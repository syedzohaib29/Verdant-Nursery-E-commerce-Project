/*
  Which products a journal post's prose is actually about.

  Kept as a plain map rather than a database relation because the link is
  editorial: the author decides a post is "about" a plant the way a gardener
  decides what goes next to what. Slugs let the strip reuse the shop's own
  cards, and a slug that stops existing simply drops the card.
*/

export const POST_PRODUCT_SLUGS: Record<string, string[]> = {
  "drainage-is-not-optional": [
    "snake-plant",
    "zz-plant",
    "houseplant-potting-mix",
    "terracotta-pot-trio",
  ],
  "watering-intervals-honestly": [
    "monstera-deliciosa",
    "calathea-orbifolia",
    "boston-fern",
    "echeveria-set",
  ],
  "potting-mix-that-works": [
    "houseplant-potting-mix",
    "perlite-and-bark-blend",
    "slow-release-fertiliser",
  ],
  "repotting-when-and-why": [
    "houseplant-potting-mix",
    "terracotta-pot-trio",
    "glazed-stoneware-cachepot",
    "self-watering-planter",
  ],
  "variegation-fragile-beautiful": [
    "monstera-deliciosa",
    "golden-pothos",
    "philodendron-brasil",
    "rubber-plant",
  ],
  "yellow-leaves-explained": [
    "peace-lily",
    "golden-pothos",
    "spider-plant",
    "chinese-money-plant",
  ],
};