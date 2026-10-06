/*
  Seed catalogue.

  Care data here is botanically checked rather than aspirational:

  - petSafe is true only for plants genuinely considered non-toxic to cats and
    dogs. Everything in the Araceae family (Monstera, Pothos, Philodendron,
    Peace Lily, ZZ) plus Sansevieria/Dracaena, Jade (Crassula ovata), Aloe and
    String of Pearls are all toxic, so they carry petSafe: false. Calathea, Areca,
    Boston Fern, Echeveria, Spider Plant, Maranta and Peperomia are safe.
  - light, water and difficulty describe what the plant needs, not how forgiving
    the seller feels about it. A fiddle leaf fig is marked EXPERT because it drops
    its leaves when you move it, not because it is difficult to buy.
  - Prices vary in shape as well as value. Some end in 50 cents, most land on a
    whole dollar, and a handful sit on promotion. Nothing ends in 99, because a
    nursery prices by what a plant costs to grow rather than by a pricing model.

  SKUs are VRD-<shelf>-<number>: the shelf tells you where a product lives and the
  number is the order it was potted up. 1001-1028 run without a gap.

  Stock is set so the shop shows real states: healthy depth on the fast sellers,
  three items at or below the low-stock threshold, and String of Pearls at zero
  until the next batch is rooted.

  `imageAlt` holds one string per image, in display order, and the array length is
  the number of files: every product ships with two, named
  `<imageBase>-1.webp` and `<imageBase>-2.webp`. Alt text is stored in the
  database rather than written into the markup, so it can be edited later without
  a redeploy and it survives swapping the file for a real photograph.
*/

export type SeedProduct = {
  name: string;
  sku: string;
  description: string;
  careNotes: string;
  priceCents: number;
  salePriceCents: number | null;
  stock: number;
  categorySlug: string;
  featured: boolean;
  light: "LOW" | "MEDIUM" | "BRIGHT";
  water: "LOW" | "MODERATE" | "HIGH";
  petSafe: boolean;
  difficulty: "EASY" | "MODERATE" | "EXPERT";
  heightCm: number | null;
  /** Filename stem in /public/images, without the size suffix or extension. */
  imageBase: string;
  /** One entry per image, in display order. */
  imageAlt: [string] | [string, string];
};

export const PRODUCTS: SeedProduct[] = [
  {
    name: "Monstera Deliciosa",
    sku: "VRD-IND-1001",
    description:
      "The one everyone pictures, and it earns the reputation. New leaves arrive solid, then fenestrate as they harden, so a plant on a moss pole looks nothing like the same plant on a shelf. Give it something to climb and the internodes stop stretching. Ours ships at about seven leaves, established in a 14cm pot.",
    careNotes:
      "Water when the top 5cm of soil is dry, which in a bright room is roughly every ten days and in a dim one closer to three weeks. Rotate a quarter turn weekly or it leans hard toward the glass. Wipe the leaves monthly; the dust gets thick enough to cut into light. Toxic to cats and dogs if chewed.",
    priceCents: 4750,
    salePriceCents: null,
    stock: 14,
    categorySlug: "indoor-plants",
    featured: true,
    light: "MEDIUM",
    water: "MODERATE",
    petSafe: false,
    difficulty: "EASY",
    heightCm: 90,
    imageBase: "monstera-deliciosa",
    imageAlt: [
      "Monstera Deliciosa in a terracotta pot, its broad leaves split into fenestrations along the veins",
      "A young Monstera leaf, still unfurling and solid, without splits",
    ],
  },
  {
    name: "Snake Plant",
    sku: "VRD-LGT-1002",
    description:
      "Sansevieria trifasciata, and it has survived offices, hallways and one genuinely catastrophic neglect case on Kiln Lane. Each leaf is a flat blade with the pale banding that gives the plant its other name, and it grows almost straight up until the pot tips. A mature clump in a 14cm pot stands about 50cm tall.",
    careNotes:
      "The most common way to kill one is kindness: water it on a schedule. Let the soil dry out completely, then wait another week before watering again. It will rot in wet soil, so never leave it standing in a full saucer. Very low light tolerated, though it will stretch and flop without brighter conditions. Toxic to pets.",
    priceCents: 2750,
    salePriceCents: null,
    stock: 22,
    categorySlug: "low-light-plants",
    featured: true,
    light: "LOW",
    water: "LOW",
    petSafe: false,
    difficulty: "EASY",
    heightCm: 50,
    imageBase: "snake-plant",
    imageAlt: [
      "Snake Plant with upright, banded sword-shaped leaves rising from a dark green pot",
      "A close view of Snake Plant leaves showing pale horizontal banding and yellowed edges",
    ],
  },
  {
    name: "Golden Pothos",
    sku: "VRD-IND-1003",
    description:
      "Devil's ivy, and deservedly so. It is one of the few plants that genuinely roots in a jar of water on a windowsill, which is why it has been in every hallway of every office since the 1970s. Trailing from a shelf it reaches two metres in a season, and the leaves get noticeably larger in brighter light. Trim it often and it stays dense instead of stringy.",
    careNotes:
      "Water when the soil is dry to the touch, roughly weekly in summer and fortnightly in winter. It tolerates almost any light including a dim hallway, and grows faster in medium light. Shear the vines back to the pot to keep it full; long bare stretches of vine are just spent growth. Toxic to pets if chewed.",
    priceCents: 1900,
    salePriceCents: 1500,
    stock: 31,
    categorySlug: "indoor-plants",
    featured: false,
    light: "LOW",
    water: "MODERATE",
    petSafe: false,
    difficulty: "EASY",
    heightCm: null,
    imageBase: "pothos-golden",
    imageAlt: [
      "Golden Pothos trailing from a shelf, heart-shaped leaves streaked with yellow variegation",
      "A single Golden Pothos vine with two variegated leaves against a mint background",
    ],
  },
  {
    name: "Fiddle Leaf Fig",
    sku: "VRD-IND-1004",
    description:
      "Ficus lyrata, and it has strong opinions. Leaves the size of a dinner plate sit on bare stems, and if the light moves the plant drops them within a fortnight. Ours is a 90cm plant with about twelve leaves, chosen because it has hardened off rather than because it is the tallest on the bench.",
    careNotes:
      "Bright indirect light, no exceptions, and do not move it after it settles. Water when the top 5cm is dry; it hates wet feet far more than it hates being slightly dry. Wipe the leaves, keep it away from radiators, and resist repotting unless the roots are visibly coming out. Toxic to pets.",
    priceCents: 8500,
    salePriceCents: null,
    stock: 3,
    categorySlug: "indoor-plants",
    featured: true,
    light: "BRIGHT",
    water: "MODERATE",
    petSafe: false,
    difficulty: "EXPERT",
    heightCm: 120,
    imageBase: "fiddle-leaf-fig",
    imageAlt: [
      "Fiddle Leaf Fig standing about 90cm tall, its violin-shaped leaves stacked on bare stems",
      "A Fiddle Leaf Fig leaf showing the violin silhouette and pale veining",
    ],
  },
  {
    name: "ZZ Plant",
    sku: "VRD-LGT-1005",
    description:
      "Zamioculcas zamiifolia, which stores water in thick potato-like rhizomes under the soil. That is the whole trick: a missed fortnight genuinely does not matter, which makes it the plant we recommend most often to people who travel. Each stem carries paired glossy leaflets so even a young plant reads as full.",
    careNotes:
      "Water monthly in summer, every six weeks in winter, and always let the soil dry out completely first. More ZZ plants are killed by overwatering than by anything else, and the first sign is yellow leaflets at the base. Tolerates low light better than almost anything sold here. Toxic to pets.",
    priceCents: 3650,
    salePriceCents: null,
    stock: 19,
    categorySlug: "low-light-plants",
    featured: true,
    light: "LOW",
    water: "LOW",
    petSafe: false,
    difficulty: "EASY",
    heightCm: 60,
    imageBase: "zz-plant",
    imageAlt: [
      "ZZ Plant with arching stems of paired glossy green leaflets, potted in white",
      "Close view of ZZ Plant rhizomes and thick stems emerging from dry soil",
    ],
  },
  {
    name: "Peace Lily",
    sku: "VRD-IND-1006",
    description:
      "Spathiphyllum, and the one plant that will tell you plainly when it is thirsty. The leaves droop within hours of drying out, then stand back up within a few hours of a drink, which makes it useful as a teaching plant. It will flower indoors on modest light, sending up white spathes above the foliage in spring.",
    careNotes:
      "Keep the soil lightly moist, never soggy. It will sulk if you let it dry out completely, so check weekly rather than following a calendar. Brown edges usually mean dry air or water hardness; rainwater or filtered water fixes it. Bright indirect light gives the most flowers. Toxic to pets.",
    priceCents: 3750,
    salePriceCents: null,
    stock: 16,
    categorySlug: "indoor-plants",
    featured: false,
    light: "MEDIUM",
    water: "HIGH",
    petSafe: false,
    difficulty: "MODERATE",
    heightCm: 55,
    imageBase: "peace-lily",
    imageAlt: [
      "Peace Lily with dark green leaves and a white spathe rising above the foliage",
      "A peace lily whose leaves droop slightly, showing the wilting response to dry soil",
    ],
  },
  {
    name: "Rubber Plant",
    sku: "VRD-IND-1007",
    description:
      "Ficus elastica, and a good deal tougher than its formal look suggests. The burgundy new leaf sheath is the best part: it unrolls in a single morning and fades to green over the following week, so a healthy plant looks like it is constantly unfurling something. Prune the top to keep it from growing into a bare stem.",
    careNotes:
      "Bright indirect light, and give it a quarter turn monthly so it grows evenly. Water when the top 5cm dries, roughly weekly. Wipe the leaves: the wide glossy surface collects dust faster than anything else we sell. Brown edges usually mean inconsistent watering rather than too much sun. Toxic to pets.",
    priceCents: 4400,
    salePriceCents: null,
    stock: 12,
    categorySlug: "indoor-plants",
    featured: false,
    light: "BRIGHT",
    water: "MODERATE",
    petSafe: false,
    difficulty: "MODERATE",
    heightCm: 80,
    imageBase: "rubber-plant",
    imageAlt: [
      "Rubber Plant with broad dark green leaves and a burgundy new shoot at the tip",
      "The rolled burgundy sheath of a Rubber Plant leaf before it unfurls",
    ],
  },
  {
    name: "Bird of Paradise",
    sku: "VRD-IND-1008",
    description:
      "Strelitzia reginae, which grows faster than you expect: a plant that arrives at 80cm gains a leaf every three weeks through summer, and the split edges on the oldest leaves are natural rather than a symptom. Given a sunny room it will flower indoors around year three, and the flower looks like a crested bird.",
    careNotes:
      "The brightest spot you have. Water weekly in summer with a thorough soak and a full drain; it sulks if the root ball is dry. Rotate it, and split the leaves are cosmetic and not a sign of anything. Wipe the broad blades monthly. Toxic to pets.",
    priceCents: 5600,
    salePriceCents: 4500,
    stock: 9,
    categorySlug: "indoor-plants",
    featured: false,
    light: "BRIGHT",
    water: "MODERATE",
    petSafe: false,
    difficulty: "MODERATE",
    heightCm: 110,
    imageBase: "bird-of-paradise",
    imageAlt: [
      "Bird of Paradise with tall paddle-shaped leaves split naturally along the veins",
      "A Bird of Paradise leaf held upright, showing its banana-like shape",
    ],
  },
  {
    name: "Philodendron Brasil",
    sku: "VRD-IND-1009",
    description:
      "One of the easiest trailing philodendrons, and the striped variety earns its name: each heart-shaped leaf carries a broad cream stripe down the centre. It grows fast enough that a plant bought in spring is twice the size by autumn, and it roots from a single node in water if you fancy a free plant.",
    careNotes:
      "Medium to bright indirect light keeps the variegation strong; in low light the cream stripe fades back to plain green. Water when the top 5cm dries. Trim long vines to the pot to promote bushy growth rather than one long runner. Toxic to pets.",
    priceCents: 2950,
    salePriceCents: null,
    stock: 24,
    categorySlug: "indoor-plants",
    featured: false,
    light: "MEDIUM",
    water: "MODERATE",
    petSafe: false,
    difficulty: "EASY",
    heightCm: null,
    imageBase: "philodendron-brasil",
    imageAlt: [
      "Philodendron Brasil trailing from a pot, heart-shaped leaves striped cream down the centre",
      "Two Philodendron Brasil leaves side by side showing the variegation pattern",
    ],
  },
  {
    name: "Chinese Money Plant",
    sku: "VRD-IND-1010",
    description:
      "Pilea peperomioides, which grows pups you can pot up and give away, so one purchase becomes four within a year. The leaves are round and flat like coins, sit on thin petioles, and wobble when you brush past. It grows toward the light with real commitment, which is why it needs turning every week.",
    careNotes:
      "Bright indirect light. Water when the top 3cm dries, and let it dry a little further than you would with a fern. Pinch off the pups when they reach 5cm and pot them in the same mix. Leaves falling off in clumps usually means overwatering; one or two at the base is normal shedding. Pet safe.",
    priceCents: 2450,
    salePriceCents: null,
    stock: 17,
    categorySlug: "indoor-plants",
    featured: false,
    light: "BRIGHT",
    water: "MODERATE",
    petSafe: true,
    difficulty: "MODERATE",
    heightCm: 35,
    imageBase: "chinese-money-plant",
    imageAlt: [
      "Chinese Money Plant with round coin-shaped leaves on thin stems above a white pot",
      "Small pups growing at the base of a mature Pilea",
    ],
  },
  {
    name: "Calathea Orbifolia",
    sku: "VRD-PET-1011",
    description:
      "Goeppertia orbifolia, and the silver banding on these leaves is not variegation, it is a structural adaptation that catches light from below in its native understory. Each leaf is around 30cm across and moves visibly during the day. It is genuinely fussy, and we sell it knowing some people will lose one before they succeed.",
    careNotes:
      "This is the fussiest plant in the shop. Medium indirect light, filtered water only, and humidity above 50%. Use a pot with drainage and never let it sit in water. Brown edges mean the water is too hard or the air is too dry; both are fixable. Water when the top 3cm dries. Pet safe.",
    priceCents: 3400,
    salePriceCents: null,
    stock: 2,
    categorySlug: "pet-safe-plants",
    featured: true,
    light: "MEDIUM",
    water: "HIGH",
    petSafe: true,
    difficulty: "EXPERT",
    heightCm: 65,
    imageBase: "calathea-orbifolia",
    imageAlt: [
      "Calathea Orbifolia with wide round leaves striped silver-green in concentric bands",
      "A Calathea Orbifolia leaf unfurling from its rolled purple-backed bud",
    ],
  },
  {
    name: "Areca Palm",
    sku: "VRD-PET-1012",
    description:
      "Dypsis lutescens, and it is the palm most people actually keep alive, which is a compliment given how many palms there are. Fronds arch out from the crown and reach roughly the height of the pot, and indoor palms keep their leaflets for years rather than weeks like a Kentia.",
    careNotes:
      "Medium to bright indirect light, and rotate monthly or fronds arch one way. Water when the top 5cm dries, roughly weekly, and it prefers being slightly moist rather than bone dry. Brown tips usually mean mineral-heavy tap water; filtered water fixes it. Pet safe.",
    priceCents: 3900,
    salePriceCents: null,
    stock: 11,
    categorySlug: "pet-safe-plants",
    featured: false,
    light: "MEDIUM",
    water: "HIGH",
    petSafe: true,
    difficulty: "MODERATE",
    heightCm: 100,
    imageBase: "areca-palm",
    imageAlt: [
      "Areca Palm with arching fronds of narrow leaflets rising from a nursery pot",
      "The clustered stems at the base of a mature Areca Palm",
    ],
  },
  {
    name: "Boston Fern",
    sku: "VRD-PET-1013",
    description:
      "Nephrolepis exaltata, and a Boston Fern is honestly a litmus test: if yours is still in fronds in three months, your watering and humidity are right. The fronds carry thousands of tiny leaflets and arch outward like a fountain, and it will go brown and dramatic within days if it dries out.",
    careNotes:
      "Needs humidity above 50% and consistently moist soil. A bathroom with a window suits it better than any other room in the house. Misting helps in summer but is not a substitute for watering twice a week. Trim brown fronds at the base rather than leaving them to flop. Pet safe.",
    priceCents: 2650,
    salePriceCents: null,
    stock: 13,
    categorySlug: "pet-safe-plants",
    featured: false,
    light: "MEDIUM",
    water: "HIGH",
    petSafe: true,
    difficulty: "MODERATE",
    heightCm: 45,
    imageBase: "boston-fern",
    imageAlt: [
      "Boston Fern with soft arching fronds of tiny leaflets spilling from a hanging pot",
      "A close view of Boston Fern frond underside showing the pattern of sori",
    ],
  },
  {
    name: "Aloe Vera",
    sku: "VRD-SUC-1014",
    description:
      "Aloe barbadensis miller, and the leaves are the point: thick, grey-green, and edged with soft white teeth that catch the light. Water travels through those leaves to the rosette, so a plant that has gone slightly limp will plump again within a day of a drink. Useful, quick, and unforgiving of frost.",
    careNotes:
      "The brightest light you can give it, and a pot that drains fast. Water deeply every two to three weeks from spring, then monthly in winter, and never in winter when the soil is still damp. Sagging translucent leaves mean too much water; thin curling leaves mean too little. Toxic to pets if eaten.",
    priceCents: 2300,
    salePriceCents: null,
    stock: 27,
    categorySlug: "succulents-and-cacti",
    featured: true,
    light: "BRIGHT",
    water: "LOW",
    petSafe: false,
    difficulty: "EASY",
    heightCm: 30,
    imageBase: "aloe-vera",
    imageAlt: [
      "Aloe Vera rosette of thick toothed grey-green leaves in a terracotta pot",
      "An Aloe Vera leaf cut open showing the clear gel inside the skin",
    ],
  },
  {
    name: "Jade Plant",
    sku: "VRD-SUC-1015",
    description:
      "Crassula ovata, which does the opposite of most houseplants: instead of needing to be coaxed along, it rewards neglect by developing a thick woody trunk over the years. The leaves are paired and coin-shaped, often with red margins in strong sun, and the plant flowers with small white stars in late winter.",
    careNotes:
      "Bright light, and as much direct sun as you can manage. Water only when the soil is completely dry, roughly every three weeks. Use a gritty mix; the roots rot in anything moisture-retentive. The red edge on the leaves is sun stress and looks better than it sounds. Toxic to pets.",
    priceCents: 1900,
    salePriceCents: null,
    stock: 21,
    categorySlug: "succulents-and-cacti",
    featured: false,
    light: "BRIGHT",
    water: "LOW",
    petSafe: false,
    difficulty: "EASY",
    heightCm: 30,
    imageBase: "jade-plant",
    imageAlt: [
      "Jade Plant with paired oval leaves on thick woody stems, edges reddened by sun",
      "Small white star-shaped flowers opening on a mature Jade Plant",
    ],
  },
  {
    name: "Echeveria Set",
    sku: "VRD-SUC-1016",
    description:
      "Four rosettes chosen to look right together rather than four identical echeverias: a pale blue E. elegans, a green E. agavoides, and two in between. Echeverias hold water in their leaves and colour up with cold and bright sun, so the same plant looks different in January than in July. Sold in a 14cm shallow bowl.",
    careNotes:
      "Full sun, at least six hours, or they stretch into loose shapes that never recover. Water the soil, not the leaves, every two weeks or so, and never leave water sitting in the rosette after watering. Crows and vine weevils love them, so check the soil for grubs in spring. Pet safe.",
    priceCents: 3600,
    salePriceCents: 2900,
    stock: 10,
    categorySlug: "succulents-and-cacti",
    featured: false,
    light: "BRIGHT",
    water: "LOW",
    petSafe: true,
    difficulty: "MODERATE",
    heightCm: 12,
    imageBase: "echeveria-set",
    imageAlt: [
      "Four Echeveria rosettes in shades of blue-green arranged in a shallow bowl",
      "A single Echeveria rosette showing the powdery farina on its leaf surfaces",
    ],
  },
  {
    name: "String of Pearls",
    sku: "VRD-SUC-1017",
    description:
      "Curio rowleyanus, which is a succulent pretending to be a plant you hang. Each pea-sized leaf is a translucent water store, and the strands trail from any shelf edge without needing a window box. Ours arrives with the strands already established on a wire frame, so it looks right on day one rather than in a year's time.",
    careNotes:
      "Bright indirect light, with a few hours of direct sun to keep the strands tight. Water weekly at most, and less in winter; soggy strands drop pearls overnight, which is unrecoverable. Plant shallow, in a gritty mix, and let the pearls rest on the soil surface rather than burying them. Toxic to pets.",
    priceCents: 2800,
    salePriceCents: null,
    stock: 0,
    categorySlug: "succulents-and-cacti",
    featured: false,
    light: "BRIGHT",
    water: "LOW",
    petSafe: false,
    difficulty: "EXPERT",
    heightCm: null,
    imageBase: "string-of-pearls",
    imageAlt: [
      "String of Pearls trailing from a hanging frame, strands of round translucent beads",
      "A single String of Pearls strand with its windowed bead-like leaves",
    ],
  },
  {
    name: "Spider Plant",
    sku: "VRD-PET-1018",
    description:
      "Chlorophytum comosum, and the plant that convinces people houseplants are not fussy. It throws arching striped leaves and, once established, produces baby plants on long runners you can pot up. A mature one will hand you four or five offsets in a season, and they root in water on a windowsill almost as fast as pothos.",
    careNotes:
      "Everything about it is forgiving: bright or medium light, water when the top 5cm dries, and a pot that drains. Brown tips usually mean fluoride in tap water, which filtered water fixes. Propagate by setting a plantlet in water until roots appear, then potting it on. Pet safe.",
    priceCents: 1850,
    salePriceCents: null,
    stock: 29,
    categorySlug: "pet-safe-plants",
    featured: false,
    light: "MEDIUM",
    water: "MODERATE",
    petSafe: true,
    difficulty: "EASY",
    heightCm: 30,
    imageBase: "spider-plant",
    imageAlt: [
      "Spider Plant with arching striped leaves throwing plantlets on long runners",
      "A Spider Plant pup growing on its runner, ready to pot up",
    ],
  },
  {
    name: "Prayer Plant",
    sku: "VRD-PET-1019",
    description:
      "Maranta leuconeura, named for the way the leaves fold up at night like hands in prayer, which is a real nyctinastic response to light rather than anything decorative. The red-veined pattern on each leaf is more striking on a plant that has been in the same spot for a few weeks, and it grows visibly through the summer.",
    careNotes:
      "Medium indirect light and humidity above 50%. Keep the soil lightly moist; it wilts dramatically when thirsty and recovers within hours. Filtered water only, and repot into a shallow pot because the rhizomes prefer to sit near the surface. Pet safe.",
    priceCents: 2200,
    salePriceCents: null,
    stock: 15,
    categorySlug: "pet-safe-plants",
    featured: false,
    light: "MEDIUM",
    water: "HIGH",
    petSafe: true,
    difficulty: "MODERATE",
    heightCm: 25,
    imageBase: "prayer-plant",
    imageAlt: [
      "Prayer Plant with dark oval leaves traced by bright red veins",
      "Prayer Plant leaves folded upward at their stalks in the evening",
    ],
  },
  {
    name: "Terracotta Pot Trio",
    sku: "VRD-POT-1020",
    description:
      "Three unglazed clay pots in 10, 14 and 18cm, which is the size range that fits most of what we sell. Unglazed clay breathes and is the right pot for anything that hates wet roots, at the cost of drying out faster. These have a drainage hole and a matching saucer; the saucer is optional but stops a wet floor.",
    careNotes:
      "Soak in water for half an hour before planting, which stops the clay stealing moisture from the mix on day one. Expect to water a little more often than in plastic. Terracotta also leaches salts, so an occasional thorough flush every couple of months is worth doing. Frost cracks clay, so bring them in if it turns cold.",
    priceCents: 3450,
    salePriceCents: null,
    stock: 18,
    categorySlug: "planters-and-pots",
    featured: false,
    light: "LOW",
    water: "LOW",
    petSafe: true,
    difficulty: "EASY",
    heightCm: null,
    imageBase: "terracotta-pot-trio",
    imageAlt: [
      "Three terracotta pots in graduated sizes with matching saucers",
      "A terracotta pot shown from above, its drainage hole and unglazed clay surface visible",
    ],
  },
  {
    name: "Glazed Stoneware Cachepot",
    sku: "VRD-POT-1021",
    description:
      "A heavy glazed pot with a drainage hole and an inner plastic liner, so it behaves like a proper pot rather than a cachepot that traps water. The glaze is a matte forest green, which is why it works with plants rather than fighting them. This is our most restocked hard good, mostly for people replanting a fiddle leaf.",
    careNotes:
      "The liner means watering is close to a normal schedule; check the top 5cm before you water anyway. Glazed pots hold moisture longer than terracotta, so err towards watering less. Never leave it standing in the saucer. Wipe the glaze with a damp cloth, not an abrasive one.",
    priceCents: 4800,
    salePriceCents: null,
    stock: 12,
    categorySlug: "planters-and-pots",
    featured: false,
    light: "LOW",
    water: "LOW",
    petSafe: true,
    difficulty: "EASY",
    heightCm: null,
    imageBase: "glazed-cachepot",
    imageAlt: [
      "Matte forest-green glazed stoneware pot with a rolled rim and matching saucer",
      "The plastic liner inside the glazed pot, lifted out beside it",
    ],
  },
  {
    name: "Self-Watering Planter",
    sku: "VRD-POT-1022",
    description:
      "A 20cm planter with a wicking reservoir in the base, which buys you about three weeks between waterings in normal indoor conditions. We sell these for people who travel, forget, or simply do not want to think about a plant on a Sunday. The indicator window turns red when the reservoir is empty.",
    careNotes:
      "Fill the reservoir through the fill hole rather than pouring into the top, which defeats the purpose. The soil stays evenly moist, so top-water only when the indicator shows it is needed. Flush the reservoir monthly to stop salts building up, and use a free-draining mix, because dense garden compost will not wick.",
    priceCents: 5800,
    salePriceCents: 4700,
    stock: 3,
    categorySlug: "planters-and-pots",
    featured: false,
    light: "LOW",
    water: "LOW",
    petSafe: true,
    difficulty: "EASY",
    heightCm: null,
    imageBase: "self-watering-planter",
    imageAlt: [
      "Self-watering planter with a side fill port and a red water-level indicator window",
      "The wicking reservoir lifted out of the planter to show the water chamber",
    ],
  },
  {
    name: "Houseplant Potting Mix",
    sku: "VRD-SOI-1023",
    description:
      "A 10 litre bag blended for foliage plants: peat-free coco coir, fine bark, perlite and a measured dose of slow-release feed. It is the mix we pot up on the bench, so it is what our own plants live in. Peat-free matters more than it used to, and coir holds moisture without the compaction that makes ordinary compost turn to cement.",
    careNotes:
      "Use for anything that is not a succulent or cactus. Wet it before you pot, because dry coir repels water and you will think you have a hydrophobic mix when you have not. It compresses over about eighteen months, so top-dress or repot before it sinks. Not suitable for succulents, which need something grittier.",
    priceCents: 1950,
    salePriceCents: null,
    stock: 40,
    categorySlug: "soil-and-care",
    featured: false,
    light: "LOW",
    water: "LOW",
    petSafe: true,
    difficulty: "EASY",
    heightCm: null,
    imageBase: "houseplant-potting-mix",
    imageAlt: [
      "Open bag of houseplant potting mix showing the mix texture and a handful of perlite",
      "Coarse bark pieces and perlite granules visible in the blend",
    ],
  },
  {
    name: "Perlite and Bark Blend",
    sku: "VRD-SOI-1024",
    description:
      "A 6 litre bag of coarse pine bark and perlite, and this is the mix for anything with a reputation for dying in wet soil: succulents, cacti, orchids and any plant you have just rescued from a waterlogged pot. Large particle size matters more than any ingredient here, because it is the air space between chunks that keeps roots alive.",
    careNotes:
      "Use as a component rather than a whole mix for most plants: roughly one part this blend to two parts potting mix for a succulent or cactus. It drains fast, so expect to water more often than the plant's label suggests. Never compress it down when potting; leave it loose.",
    priceCents: 1500,
    salePriceCents: null,
    stock: 33,
    categorySlug: "soil-and-care",
    featured: false,
    light: "LOW",
    water: "LOW",
    petSafe: true,
    difficulty: "EASY",
    heightCm: null,
    imageBase: "perlite-bark-blend",
    imageAlt: [
      "Coarse pine bark and white perlite granules in an open bag",
      "A handful of bark chunks showing the large particle size of the blend",
    ],
  },
  {
    name: "Slow-Release Fertiliser",
    sku: "VRD-SOI-1025",
    description:
      "A 500g tub of balanced 14-14-14 prills with a three-month coating, which is the least interesting product we sell and the one that most reliably fixes a plant. A plant that has not been fed in a year will put on better new growth in six weeks than in the previous twelve. Coated prills mean no liquid routine and no measuring.",
    careNotes:
      "Apply to the soil surface, never straight onto the root ball, and water immediately afterwards so the coating dissolves at the roots rather than on the pot rim. Once in spring and once in early autumn is plenty for most foliage plants. Stop feeding entirely in midwinter, when light is low and growth has stopped. A white salt crust on the surface means you have overdone it; flush the pot.",
    priceCents: 1300,
    salePriceCents: null,
    stock: 26,
    categorySlug: "soil-and-care",
    featured: false,
    light: "LOW",
    water: "LOW",
    petSafe: true,
    difficulty: "EASY",
    heightCm: null,
    imageBase: "slow-release-fertiliser",
    imageAlt: [
      "Small coated fertiliser prills spilling from an open tub",
      "A single grey fertiliser prill held close, showing the slow-release coating",
    ],
  },
  {
    name: "Brass Watering Can",
    sku: "VRD-CAR-1026",
    description:
      "A 1.5 litre brass-finish can with a long spout narrow enough to reach between crowded leaves without wetting them. That spout is the whole reason to own one: watering from above pushes soil out of the pot and leaves cold water sitting in the crown. Weighted, so it stays put, and it will develop a patina.",
    careNotes:
      "Rinse it after use, especially after feeding, because salts will pit the finish. Brass is not stainless, so do not leave it standing full of water for weeks. The rose unscrews off the spout if you want a shower head for seedlings.",
    priceCents: 5200,
    salePriceCents: null,
    stock: 9,
    categorySlug: "soil-and-care",
    featured: false,
    light: "LOW",
    water: "LOW",
    petSafe: true,
    difficulty: "EASY",
    heightCm: null,
    imageBase: "watering-can-brass",
    imageAlt: [
      "Brass-finish watering can with a long narrow spout",
      "The removable rose at the end of the watering can spout",
    ],
  },
  {
    name: "Coco Moss Pole",
    sku: "VRD-CAR-1027",
    description:
      "A 90cm coir-wrapped pole with a steel core, for the plants that climb rather than trail. A monstera or philodendron against a pole grows noticeably faster and develops the larger, more divided leaves it would not produce on a flat surface, because the stems have something to grip. Coir holds moisture, which the plant roots into over time.",
    careNotes:
      "Soak the pole for an hour before planting so it does not wick moisture out of the pot on day one. Tie the stems loosely as they grow; you are guiding, not strapping. It will start to grow mould and that is fine and expected; it is coir doing its job. Replace every two years in spring.",
    priceCents: 2850,
    salePriceCents: null,
    stock: 20,
    categorySlug: "soil-and-care",
    featured: false,
    light: "MEDIUM",
    water: "MODERATE",
    petSafe: true,
    difficulty: "EASY",
    heightCm: 90,
    imageBase: "moss-pole-coco",
    imageAlt: [
      "Coir-wrapped moss pole standing upright, its steel core visible at the top",
      "A climbing philodendron stem tied loosely to a coir pole",
    ],
  },
  {
    name: "Pruning Shears",
    sku: "VRD-CAR-1028",
    description:
      "Bypass secateurs with stainless blades, and the bypass is the point: they cut like scissors rather than crushing, which matters when you are trimming a pothos vine or taking a cutting. The blades are replaceable and the tool is light enough to use for an hour of potting bench work without your hand aching.",
    careNotes:
      "Wipe the blades with alcohol between plants, especially after removing diseased growth, and oil the pivot occasionally. Keep them dry; rust on a cutting tool is how disease moves from one plant to the next. This is a pruning tool, not a trowel, and it will dull fast if you use it for soil.",
    priceCents: 3600,
    salePriceCents: null,
    stock: 14,
    categorySlug: "soil-and-care",
    featured: false,
    light: "LOW",
    water: "LOW",
    petSafe: true,
    difficulty: "EASY",
    heightCm: null,
    imageBase: "pruning-shears",
    imageAlt: [
      "Bypass pruning shears with green handles and stainless blades, open",
      "The blades of pruning shears closed, showing the scissor action",
    ],
  },
];
