# Replace these images with real photos

All product, category and journal images are currently **generated placeholders**
drawn in the Verdant palette. They are clean, on-brand and correctly sized, but
they are not photographs of actual plants.

## Why placeholders?

The catalogue names specific species — Monstera Deliciosa, Fiddle Leaf Fig,
Calathea Orbifolia — and a stock photo of the wrong plant is worse than an honest
placeholder. Every file below can be swapped for a real photograph without touching
a line of code, because the filename is the contract:

- product files come from `imageBase` in `prisma/seed-data/products.ts`
- category files come from `image` in `prisma/seed-data/categories.ts`
- journal files come from `coverImage` in `prisma/seed-data/journal.ts`

The alt text lives in the database, not in the markup, so it survives the swap.

## Specifications

| Type         | Aspect ratio | Dimensions  | Format | Max size |
| ------------ | ------------ | ----------- | ------ | -------- |
| Product      | 4:5          | 800 × 1000  | WebP   | 150 KB   |
| Category     | 1:1          | 600 × 600   | WebP   | 150 KB   |
| Journal      | 16:10        | 1280 × 800  | WebP   | 150 KB   |

68 files in total: 56 product images, 6 category tiles, 6 journal covers.

## Product images — 2 per product, 56 files

`-1` is the primary, used on cards, in the cart and in order lines. `-2` is the
gallery. The count is `imageAlt.length`, so adding a third alt entry is all it
takes to require a third file.

| Stem                       | Files | Stem                       | Files |
| -------------------------- | ----- | -------------------------- | ----- |
| `monstera-deliciosa`       | 2     | `glazed-cachepot`          | 2     |
| `snake-plant`              | 2     | `self-watering-planter`    | 2     |
| `pothos-golden`            | 2     | `houseplant-potting-mix`   | 2     |
| `fiddle-leaf-fig`          | 2     | `perlite-bark-blend`       | 2     |
| `zz-plant`                 | 2     | `slow-release-fertiliser`  | 2     |
| `peace-lily`               | 2     | `watering-can-brass`       | 2     |
| `rubber-plant`             | 2     | `moss-pole-coco`           | 2     |
| `bird-of-paradise`         | 2     | `pruning-shears`           | 2     |
| `philodendron-brasil`      | 2     |                            |       |
| `chinese-money-plant`      | 2     |                            |       |
| `calathea-orbifolia`       | 2     |                            |       |
| `areca-palm`               | 2     |                            |       |
| `boston-fern`              | 2     |                            |       |
| `aloe-vera`                | 2     |                            |       |
| `jade-plant`               | 2     |                            |       |
| `echeveria-set`            | 2     |                            |       |
| `string-of-pearls`         | 2     |                            |       |
| `spider-plant`             | 2     |                            |       |
| `prayer-plant`             | 2     |                            |       |
| `terracotta-pot-trio`      | 2     |                            |       |

Each is `<stem>-1.webp` and `<stem>-2.webp`.

## Category images — 6 files, 1:1

```
category-indoor-plants.webp
category-low-light-plants.webp
category-succulents-and-cacti.webp
category-pet-safe-plants.webp
category-planters-and-pots.webp
category-soil-and-care.webp
```

## Journal covers — 6 files, 16:10

```
journal-drainage.webp
journal-watering-intervals.webp
journal-potting-mix.webp
journal-yellow-leaves.webp
journal-variegation.webp
journal-repotting.webp
```

## How to replace

1. Photograph the actual plant against a neutral background. Warm-white and mint
   both sit well with the palette; a white seamless gives the cleanest edges.
2. Crop to the aspect ratio above. Cards crop to `object-cover`, so leave the
   subject centred with a little headroom.
3. Export as WebP at quality 82, or `cwebp -q 82 in.jpg -o out.webp`.
4. Check the result is under 150 KB. These are flat vector drawings, which is why
   the placeholders land around 20 KB; a photograph will not, so budget for it.
5. Drop it into `public/images/` under the exact filename from the tables above.
   No code changes, no re-seed needed for the swap itself.
6. Update the alt text in `prisma/seed-data/products.ts` if the photo shows
   something the current description does not, then `npm run db:seed`.

## Regenerating the placeholders

```bash
npm run images:generate
```

The generator reads the file list from `prisma/seed-data/*`, so it can only ever
produce exactly the files the database references, and it deletes anything left
over from an earlier catalogue. It is deterministic: the same code produces
byte-identical files, so a re-run shows a diff only when something real changed.
