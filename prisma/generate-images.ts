/**
 * Generates the placeholder imagery for the seeded catalogue.
 *
 * Run with: npx tsx prisma/generate-images.ts
 *
 * Why generated art rather than downloaded photos: a nursery catalogue needs a
 * specific plant photographed specifically, and a stock photo of the wrong
 * species is worse than an honest placeholder. These are drawn in the Verdant
 * palette, sized to the exact aspect ratios the UI asks for, and every file
 * listed in /public/images/REPLACE_ME.md can be swapped for a real photo without
 * touching a line of code — the filenames are the contract.
 *
 * Product images are 4:5 (800x1000), journal covers 16:10 (1280x800) and
 * category tiles 1:1 (600x600), all encoded as WebP under 150KB.
 */

import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { CATEGORIES } from "./seed-data/categories";
import { JOURNAL_POSTS } from "./seed-data/journal";
import { PRODUCTS } from "./seed-data/products";

const OUTPUT_DIR = path.join(process.cwd(), "public", "images");

/* Verdant palette, matching src/app/globals.css. */
const INK = "#0B0F0C";
const FOREST = "#14532D";
const LEAF = "#3E9B4F";
const MINT = "#E6F2E8";
const WARM_WHITE = "#F8F8F4";
const WHITE = "#FFFFFF";

type Size = { width: number; height: number };

const PRODUCT_SIZE: Size = { width: 800, height: 1000 };
const JOURNAL_SIZE: Size = { width: 1280, height: 800 };
const CATEGORY_SIZE: Size = { width: 600, height: 600 };

/**
 * Deterministic pseudo-random from a string, so re-running the generator produces
 * byte-identical files and a git diff only shows what actually changed.
 */
function seededRandom(seed: string): () => number {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return () => {
    hash += 0x6d2b79f5;
    let value = hash;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Evenly spaced blades radiating from a base point, like a plant in a pot. */
function leafBlades(
  random: () => number,
  count: number,
  originX: number,
  originY: number,
  spread: number,
  minLength: number,
  maxLength: number,
  fill: string,
  opacity: number,
): string {
  const blades: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const progress = count === 1 ? 0.5 : index / (count - 1);
    const angle = -90 + (progress - 0.5) * spread + (random() - 0.5) * 8;
    const length = minLength + random() * (maxLength - minLength);
    const width = length * (0.16 + random() * 0.12);

    const radians = (angle * Math.PI) / 180;
    const tipX = originX + Math.cos(radians) * length;
    const tipY = originY + Math.sin(radians) * length;

    // A blade is two quadratic curves from base to tip and back, which gives the
    // leaf a pointed tip and a pinched middle.
    const controlOneX = originX + Math.cos(radians) * length * 0.45;
    const controlOneY = originY + Math.sin(radians) * length * 0.45;
    const controlTwoX = originX + Math.cos(radians) * length * 0.7;
    const controlTwoY = originY + Math.sin(radians) * length * 0.7;

    const perpX = -Math.sin(radians);
    const perpY = Math.cos(radians);

    blades.push(
      `<path d="M ${originX.toFixed(1)} ${originY.toFixed(1)} Q ${(controlOneX + perpX * width).toFixed(1)} ${(controlOneY + perpY * width).toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)} Q ${(controlTwoX - perpX * width).toFixed(1)} ${(controlTwoY - perpY * width).toFixed(1)} ${originX.toFixed(1)} ${originY.toFixed(1)} Z" fill="${fill}" fill-opacity="${opacity.toFixed(2)}" />`,
    );
  }

  return blades.join("");
}

/** A trailing vine: a hanging curve with small round leaves along it. */
/**
 * A trailing vine. Starts at the base of the foliage mass so the strands read as
 * growing out of the plant rather than floating beneath it.
 */
function trailingVine(
  random: () => number,
  originX: number,
  originY: number,
  length: number,
  fill: string,
): string {
  const drift = (random() - 0.5) * 90;
  const endX = originX + drift;
  const endY = originY + length;

  const leaves: string[] = [];
  const leafCount = 9 + Math.floor(random() * 4);

  for (let index = 0; index < leafCount; index += 1) {
    // Starts at 0.06 rather than 0 so there is a leaf right at the join.
    const progress = 0.06 + (index / leafCount) * 0.94;
    const eased = progress * progress;
    const x = originX + drift * eased;
    const y = originY + length * progress;
    const radius = 18 + random() * 11;
    const side = index % 2 === 0 ? 1 : -1;

    leaves.push(
      `<ellipse cx="${(x + side * radius * 0.85).toFixed(1)}" cy="${y.toFixed(1)}" rx="${radius.toFixed(1)}" ry="${(radius * 0.76).toFixed(1)}" fill="${fill}" fill-opacity="0.6" transform="rotate(${(side * 26).toFixed(0)} ${(x + side * radius * 0.85).toFixed(1)} ${y.toFixed(1)})" />`,
    );
  }

  return `<path d="M ${originX.toFixed(1)} ${originY.toFixed(1)} C ${(originX + drift * 0.35).toFixed(1)} ${(originY + length * 0.34).toFixed(1)} ${(originX - drift * 0.15).toFixed(1)} ${(originY + length * 0.68).toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}" fill="none" stroke="${fill}" stroke-opacity="0.55" stroke-width="6" stroke-linecap="round" />${leaves.join("")}`;
}

/** Spiky rosette, for the succulents. */
function rosette(
  random: () => number,
  centerX: number,
  centerY: number,
  radius: number,
  fill: string,
): string {
  const layers = 3;
  const parts: string[] = [];

  for (let layer = layers; layer >= 1; layer -= 1) {
    const count = 7 + layer * 2;
    const layerRadius = radius * (layer / layers);
    const opacity = 0.35 + (layers - layer) * 0.18;

    for (let index = 0; index < count; index += 1) {
      const angle = (360 / count) * index + layer * 12 + random() * 6;
      const radians = ((angle - 90) * Math.PI) / 180;
      const tipX = centerX + Math.cos(radians) * layerRadius;
      const tipY = centerY + Math.sin(radians) * layerRadius;
      const width = layerRadius * 0.34;

      parts.push(
        `<path d="M ${centerX.toFixed(1)} ${centerY.toFixed(1)} L ${(tipX + Math.cos(radians + Math.PI / 2) * width).toFixed(1)} ${(tipY + Math.sin(radians + Math.PI / 2) * width).toFixed(1)} L ${tipX.toFixed(1)} ${tipY.toFixed(1)} L ${(tipX + Math.cos(radians - Math.PI / 2) * width).toFixed(1)} ${(tipY + Math.sin(radians - Math.PI / 2) * width).toFixed(1)} Z" fill="${fill}" fill-opacity="${opacity.toFixed(2)}" />`,
      );
    }
  }

  return parts.join("");
}

/** Upright stems with round leaves on top, for the palms. */
function palmFronds(
  random: () => number,
  baseX: number,
  baseY: number,
  height: number,
  fill: string,
): string {
  const stems: string[] = [];
  const count = 5 + Math.floor(random() * 3);

  for (let index = 0; index < count; index += 1) {
    const progress = count === 1 ? 0.5 : index / (count - 1);
    const angle = -90 + (progress - 0.5) * 76;
    const radians = (angle * Math.PI) / 180;
    const stemLength = height * (0.72 + random() * 0.3);
    const tipX = baseX + Math.cos(radians) * stemLength;
    const tipY = baseY + Math.sin(radians) * stemLength;

    stems.push(
      `<path d="M ${baseX.toFixed(1)} ${baseY.toFixed(1)} Q ${(baseX + Math.cos(radians) * stemLength * 0.6 + (random() - 0.5) * 20).toFixed(1)} ${(baseY + Math.sin(radians) * stemLength * 0.6).toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)}" fill="none" stroke="${fill}" stroke-opacity="0.5" stroke-width="6" stroke-linecap="round" />`,
    );

    // Fronds: paired leaflets along the top half of each stem.
    const leaflets = 6 + Math.floor(random() * 4);
    for (let leafIndex = 0; leafIndex < leaflets; leafIndex += 1) {
      const along = 0.45 + (leafIndex / leaflets) * 0.55;
      const lx = baseX + (tipX - baseX) * along;
      const ly = baseY + (tipY - baseY) * along;
      const side = leafIndex % 2 === 0 ? 1 : -1;
      const leafAngle = angle + side * (48 + random() * 22);
      const leafRadians = (leafAngle * Math.PI) / 180;
      const leafLength = 40 + random() * 26;

      stems.push(
        `<ellipse cx="${(lx + Math.cos(leafRadians) * leafLength).toFixed(1)}" cy="${(ly + Math.sin(leafRadians) * leafLength).toFixed(1)}" rx="${leafLength.toFixed(1)}" ry="${(leafLength * 0.26).toFixed(1)}" fill="${fill}" fill-opacity="0.42" transform="rotate(${(leafAngle + 90).toFixed(0)} ${(lx + Math.cos(leafRadians) * leafLength).toFixed(1)} ${(ly + Math.sin(leafRadians) * leafLength).toFixed(1)})" />`,
      );
    }
  }

  return stems.join("");
}

function plantArtwork(
  shape: PlantShape,
  width: number,
  height: number,
  seed: string,
): string {
  const random = seededRandom(seed);
  const baseY = height * 0.74;
  const centreX = width / 2;
  const art: string[] = [];

  switch (shape) {
    case "broadleaf":
      art.push(leafBlades(random, 7, centreX, baseY, 104, height * 0.3, height * 0.44, FOREST, 0.9));
      art.push(leafBlades(random, 4, centreX, baseY + 18, 76, height * 0.2, height * 0.3, LEAF, 0.5));
      break;

    case "upright":
      art.push(leafBlades(random, 6, centreX, baseY, 46, height * 0.36, height * 0.52, FOREST, 0.92));
      art.push(leafBlades(random, 3, centreX, baseY, 24, height * 0.24, height * 0.34, LEAF, 0.45));
      break;

    case "trailing": {
      // Foliage sits slightly high so the strands have room to hang without
      // running off the bottom of the frame.
      const crownY = baseY - height * 0.1;
      art.push(leafBlades(random, 5, centreX, crownY, 92, height * 0.18, height * 0.26, FOREST, 0.85));
      art.push(trailingVine(random, centreX - width * 0.13, crownY - height * 0.01, height * 0.33, FOREST));
      art.push(trailingVine(random, centreX + width * 0.13, crownY - height * 0.01, height * 0.28, LEAF));
      break;
    }

    case "rosette":
      art.push(rosette(random, centreX, baseY - height * 0.1, height * 0.28, FOREST));
      art.push(rosette(random, centreX, baseY - height * 0.1, height * 0.16, LEAF));
      break;

    case "palm":
      art.push(palmFronds(random, centreX, baseY, height * 0.56, FOREST));
      break;

    case "planter": {
      // An empty pot with its rim and drainage detail. Used for planters, and for
      // the care tools, which read as hard goods next to the soft green stock.
      const potWidth = width * 0.56;
      const potLeft = centreX - potWidth / 2;
      const potRight = centreX + potWidth / 2;
      const rimY = height * 0.34;
      const potBottom = height * 0.86;
      const footInset = potWidth * 0.15;

      // Interior, seen as a dark ellipse just below the rim.
      art.push(
        `<ellipse cx="${centreX.toFixed(1)}" cy="${rimY.toFixed(1)}" rx="${(potWidth / 2).toFixed(1)}" ry="${(potWidth * 0.09).toFixed(1)}" fill="${INK}" fill-opacity="0.85" />`,
      );

      // Body, tapering to a narrower foot.
      art.push(
        `<path d="M ${potLeft.toFixed(1)} ${rimY.toFixed(1)} L ${(potLeft + footInset).toFixed(1)} ${potBottom.toFixed(1)} Q ${centreX.toFixed(1)} ${(potBottom + height * 0.028).toFixed(1)} ${(potRight - footInset).toFixed(1)} ${potBottom.toFixed(1)} L ${potRight.toFixed(1)} ${rimY.toFixed(1)} Z" fill="${FOREST}" fill-opacity="0.92" />`,
      );

      // A vertical highlight, so the form curves rather than reading flat.
      art.push(
        `<path d="M ${(potLeft + potWidth * 0.13).toFixed(1)} ${(rimY + height * 0.03).toFixed(1)} L ${(potLeft + footInset + potWidth * 0.08).toFixed(1)} ${(potBottom - height * 0.02).toFixed(1)}" fill="none" stroke="${WHITE}" stroke-opacity="0.16" stroke-width="${(potWidth * 0.06).toFixed(1)}" stroke-linecap="round" />`,
      );

      // Rim, sitting proud of the body.
      art.push(
        `<rect x="${(potLeft - width * 0.028).toFixed(1)}" y="${(rimY - height * 0.042).toFixed(1)}" width="${(potWidth + width * 0.056).toFixed(1)}" height="${(height * 0.058).toFixed(1)}" rx="${(height * 0.016).toFixed(1)}" fill="${INK}" fill-opacity="0.9" />`,
      );
      break;
    }

    case "soil": {
      // An open sack with a scoop of mix heaped above the rim. Drawn as a heap
      // rather than as horizontal bands, because stacked stripes read as a bar
      // chart rather than as soil.
      const bagWidth = width * 0.52;
      const bagLeft = centreX - bagWidth / 2;
      const bagRight = centreX + bagWidth / 2;
      const rimY = height * 0.42;
      const bagBottom = height * 0.88;

      // Sack body, gently bellied so it looks full.
      art.push(
        `<path d="M ${bagLeft.toFixed(1)} ${rimY.toFixed(1)} C ${(bagLeft - width * 0.02).toFixed(1)} ${(rimY + (bagBottom - rimY) * 0.45).toFixed(1)} ${(bagLeft + width * 0.03).toFixed(1)} ${bagBottom.toFixed(1)} ${centreX.toFixed(1)} ${bagBottom.toFixed(1)} C ${(bagRight - width * 0.03).toFixed(1)} ${bagBottom.toFixed(1)} ${(bagRight + width * 0.02).toFixed(1)} ${(rimY + (bagBottom - rimY) * 0.45).toFixed(1)} ${bagRight.toFixed(1)} ${rimY.toFixed(1)} Z" fill="${WARM_WHITE}" stroke="${FOREST}" stroke-opacity="0.22" stroke-width="3" />`,
        // Gusseted sides, the diagonal creases that make a paper sack read.
        `<path d="M ${(bagLeft + width * 0.02).toFixed(1)} ${(rimY + height * 0.04).toFixed(1)} L ${(bagLeft + width * 0.09).toFixed(1)} ${(bagBottom - height * 0.02).toFixed(1)}" fill="none" stroke="${FOREST}" stroke-opacity="0.14" stroke-width="3" />`,
        `<path d="M ${(bagRight - width * 0.02).toFixed(1)} ${(rimY + height * 0.04).toFixed(1)} L ${(bagRight - width * 0.09).toFixed(1)} ${(bagBottom - height * 0.02).toFixed(1)}" fill="none" stroke="${FOREST}" stroke-opacity="0.14" stroke-width="3" />`,
      );

      // Heaped mix above the rim.
      const heapWidth = bagWidth * 1.06;
      const heapHeight = height * 0.1;
      art.push(
        `<path d="M ${(centreX - heapWidth / 2).toFixed(1)} ${rimY.toFixed(1)} Q ${(centreX - heapWidth * 0.22).toFixed(1)} ${(rimY - heapHeight * 1.7).toFixed(1)} ${(centreX - heapWidth * 0.05).toFixed(1)} ${(rimY - heapHeight * 0.7).toFixed(1)} Q ${centreX.toFixed(1)} ${(rimY - heapHeight * 0.1).toFixed(1)} ${(centreX + heapWidth * 0.08).toFixed(1)} ${(rimY - heapHeight).toFixed(1)} Q ${(centreX + heapWidth * 0.3).toFixed(1)} ${(rimY - heapHeight * 1.8).toFixed(1)} ${(centreX + heapWidth / 2).toFixed(1)} ${rimY.toFixed(1)} Z" fill="${FOREST}" fill-opacity="0.82" />`,
      );

      // Perlite, bark and grit: irregular flecks, not a repeating pattern.
      for (let fleck = 0; fleck < 54; fleck += 1) {
        const onHeap = fleck % 3 !== 0;
        const x = onHeap
          ? centreX + (random() - 0.5) * heapWidth * 0.92
          : bagLeft + random() * bagWidth;
        const y = onHeap
          ? rimY - random() * heapHeight * 1.2
          : rimY + random() * (bagBottom - rimY) * 0.8;
        const size = 2 + random() * 4.5;
        const tint = random();
        const fill = tint > 0.7 ? WHITE : tint > 0.4 ? LEAF : INK;
        const opacity = onHeap ? 0.34 + random() * 0.3 : 0.14 + random() * 0.16;

        art.push(
          `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${size.toFixed(1)}" ry="${(size * (0.6 + random() * 0.6)).toFixed(1)}" fill="${fill}" fill-opacity="${opacity.toFixed(2)}" transform="rotate(${(random() * 180).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" />`,
        );
      }

      // A rolled-down rim across the front of the sack.
      art.push(
        `<rect x="${(bagLeft - width * 0.012).toFixed(1)}" y="${(rimY - height * 0.018).toFixed(1)}" width="${(bagWidth + width * 0.024).toFixed(1)}" height="${(height * 0.036).toFixed(1)}" rx="${(height * 0.012).toFixed(1)}" fill="${INK}" fill-opacity="0.82" />`,
      );
      break;
    }
  }

  return art.join("");
}

function frame(
  size: Size,
  background: string,
  artwork: string,
  seed: string,
): Buffer {
  const random = seededRandom(seed);

  // A soft radial wash keeps flat placeholder art from looking like clip art.
  const glowX = size.width * (0.3 + random() * 0.4);
  const glowY = size.height * (0.18 + random() * 0.2);
  const glowRadius = size.width * 0.72;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}">
  <defs>
    <radialGradient id="glow" cx="${(glowX / size.width).toFixed(3)}" cy="${(glowY / size.height).toFixed(3)}" r="${(glowRadius / size.width).toFixed(3)}">
      <stop offset="0%" stop-color="${WHITE}" stop-opacity="0.85" />
      <stop offset="100%" stop-color="${WHITE}" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="${size.width}" height="${size.height}" fill="${background}" />
  <rect width="${size.width}" height="${size.height}" fill="url(#glow)" />
  ${artwork}
  <rect x="0.75" y="0.75" width="${size.width - 1.5}" height="${size.height - 1.5}" fill="none" stroke="${INK}" stroke-opacity="0.08" stroke-width="1.5" />
</svg>`;

  return Buffer.from(svg);
}

/*
  The file list is derived from the seed data rather than written out here.

  That matters more than it looks. A hand-kept list is a second source of truth
  for the catalogue, and the two drift: the seed drops a product, or renames an
  imageBase, and the generator keeps cheerfully emitting a file nobody references
  while the shop page shows a 404. Reading PRODUCTS, CATEGORIES and
  JOURNAL_POSTS means the generator can only ever produce exactly the files the
  database asks for.

  What is *not* derivable is the artwork. Silhouette is a judgement call, so it
  lives in SHAPE_BY_BASE below, keyed on the same imageBase the seed uses, and a
  product with no entry there is a hard error rather than a default shape.
*/

type PlantShape =
  | "broadleaf"
  | "upright"
  | "trailing"
  | "rosette"
  | "palm"
  | "planter"
  | "soil";

/**
 * Which silhouette suits which product. Read as a shelf list: broad leaves,
 * then upright spears, then the things that trail or sprawl, then the hard goods
 * drawn as pots and sacks.
 */
const SHAPE_BY_BASE: Record<string, PlantShape> = {
  "monstera-deliciosa": "broadleaf",
  "peace-lily": "broadleaf",
  "chinese-money-plant": "broadleaf",
  "calathea-orbifolia": "broadleaf",
  "prayer-plant": "broadleaf",

  "snake-plant": "upright",
  "zz-plant": "upright",
  "fiddle-leaf-fig": "upright",
  "rubber-plant": "upright",
  "bird-of-paradise": "upright",

  "pothos-golden": "trailing",
  "philodendron-brasil": "trailing",
  "string-of-pearls": "trailing",
  // Arching rosettes that throw plantlets on long runners, which the trailing
  // silhouette draws well.
  "spider-plant": "trailing",

  "aloe-vera": "rosette",
  "jade-plant": "rosette",
  "echeveria-set": "rosette",

  "areca-palm": "palm",
  "boston-fern": "palm",

  "terracotta-pot-trio": "planter",
  "glazed-cachepot": "planter",
  "self-watering-planter": "planter",
  "watering-can-brass": "planter",
  "moss-pole-coco": "planter",
  "pruning-shears": "planter",

  "houseplant-potting-mix": "soil",
  "perlite-bark-blend": "soil",
  "slow-release-fertiliser": "soil",
};

/** Every product image the database will reference, in product then position order. */
const PRODUCT_IMAGES: { file: string; shape: PlantShape }[] = PRODUCTS.flatMap((product) => {
  const shape = SHAPE_BY_BASE[product.imageBase];

  if (!shape) {
    throw new Error(
      `generate-images: no SHAPE_BY_BASE entry for "${product.imageBase}" (${product.name}). ` +
        "Add one so the product does not get the wrong silhouette.",
    );
  }

  return Array.from({ length: product.imageAlt.length }, (_, position) => ({
    file: `${product.imageBase}-${position + 1}`,
    shape,
  }));
});

const CATEGORY_IMAGES: string[] = CATEGORIES.map((category) =>
  // Category.image is "/images/category-slug.webp"; the generator wants the stem.
  path.basename(category.image, ".webp"),
);

/** Journal covers vary by subject, so each post picks its own silhouette. */
const JOURNAL_SHAPES: Record<string, PlantShape> = {
  "journal-drainage": "planter",
  "journal-watering-intervals": "broadleaf",
  "journal-potting-mix": "soil",
  "journal-yellow-leaves": "broadleaf",
  "journal-variegation": "trailing",
  "journal-repotting": "planter",
};

const JOURNAL_IMAGES: { file: string; shape: PlantShape }[] = JOURNAL_POSTS.map((post) => {
  const file = path.basename(post.coverImage, ".webp");
  const shape = JOURNAL_SHAPES[file];

  if (!shape) {
    throw new Error(`generate-images: no JOURNAL_SHAPES entry for "${file}".`);
  }

  return { file, shape };
});

async function writeWebp(
  filename: string,
  svg: Buffer,
  size: Size,
): Promise<number> {
  const outputPath = path.join(OUTPUT_DIR, `${filename}.webp`);

  // Quality 82 keeps these comfortably under 150KB at these dimensions while
  // staying sharp on a retina screen for flat vector artwork.
  await sharp(svg, { density: 96 })
    .resize(size.width, size.height)
    .webp({ quality: 82, effort: 5 })
    .toFile(outputPath);

  const { size: bytes } = await import("node:fs").then((fs) =>
    fs.promises.stat(outputPath),
  );

  return bytes;
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  let total = 0;
  let largest = 0;
  let largestName = "";

  const record = (filename: string, bytes: number) => {
    total += bytes;
    if (bytes > largest) {
      largest = bytes;
      largestName = filename;
    }
  };

  for (const [index, image] of PRODUCT_IMAGES.entries()) {
    const background = index % 3 === 0 ? MINT : index % 3 === 1 ? WARM_WHITE : WHITE;
    const artwork = plantArtwork(image.shape, PRODUCT_SIZE.width, PRODUCT_SIZE.height, image.file);
    const svg = frame(PRODUCT_SIZE, background, artwork, `${image.file}-frame`);
    record(image.file, await writeWebp(image.file, svg, PRODUCT_SIZE));
  }

  for (const [index, name] of CATEGORY_IMAGES.entries()) {
    const shapes: PlantShape[] = [
      "broadleaf",
      "upright",
      "rosette",
      "trailing",
      "planter",
      "soil",
    ];
    const background = index % 2 === 0 ? MINT : WARM_WHITE;
    const artwork = plantArtwork(shapes[index], CATEGORY_SIZE.width, CATEGORY_SIZE.height, name);
    const svg = frame(CATEGORY_SIZE, background, artwork, `${name}-frame`);
    record(name, await writeWebp(name, svg, CATEGORY_SIZE));
  }

  for (const { file, shape } of JOURNAL_IMAGES) {
    const background = shape === "soil" ? WARM_WHITE : MINT;
    const artwork = plantArtwork(shape, JOURNAL_SIZE.width, JOURNAL_SIZE.height, file);
    const svg = frame(JOURNAL_SIZE, background, artwork, `${file}-frame`);
    record(file, await writeWebp(file, svg, JOURNAL_SIZE));
  }

  // Remove anything left over from an earlier catalogue. Dropping a product or
  // renaming an imageBase should not leave an orphan webp sitting in the repo
  // forever, and stale files are exactly what makes an image diff unreadable.
  const expected = new Set([
    ...PRODUCT_IMAGES.map((image) => `${image.file}.webp`),
    ...JOURNAL_IMAGES.map((image) => `${image.file}.webp`),
    ...CATEGORY_IMAGES.map((name) => `${name}.webp`),
  ]);
  const removed: string[] = [];

  for (const existing of await readdir(OUTPUT_DIR)) {
    if (!existing.endsWith(".webp") || expected.has(existing)) continue;

    await unlink(path.join(OUTPUT_DIR, existing));
    removed.push(existing);
  }

  await writeFile(
    path.join(OUTPUT_DIR, "GENERATED.md"),
    [
      "# Generated imagery",
      "",
      `Written by \`prisma/generate-images.ts\` on ${new Date().toISOString().slice(0, 10)}.`,
      "",
      `\`${PRODUCT_IMAGES.length}\` product images, \`${CATEGORY_IMAGES.length}\` category tiles and`,
      `\`${JOURNAL_IMAGES.length}\` journal covers, all WebP. The file list is read from`,
      "`prisma/seed-data/*`, so it cannot drift from what the database asks for. Re-run",
      "that script to regenerate them; it is deterministic, so the output only changes",
      "when the code changes.",
      "",
      `Largest file: \`${largestName}.webp\` at ${(largest / 1024).toFixed(1)}KB. Total ${(total / 1024).toFixed(0)}KB.`,
      removed.length > 0
        ? `Removed ${removed.length} file(s) no longer in the catalogue: ${removed.join(", ")}.`
        : "No stale files were found.",
      "",
      "These are drawn placeholders. See REPLACE_ME.md for the swap checklist.",
      "",
    ].join("\n"),
    "utf8",
  );

  const count = PRODUCT_IMAGES.length + CATEGORY_IMAGES.length + JOURNAL_IMAGES.length;

  console.log(
    `wrote ${count} webp files to public/images (${(total / 1024).toFixed(0)}KB total, largest ${(largest / 1024).toFixed(1)}KB)`,
  );

  if (removed.length > 0) {
    console.log(`removed ${removed.length} stale file(s): ${removed.join(", ")}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
