/*
  Seed categories.

  Six shelves, ordered the way a customer walks them rather than alphabetically.
  `sortOrder` is the only thing that decides the order on the shop page, so it is
  written out explicitly instead of relying on the array order in this file.

  Every category needs a 1:1 image, and the filename here is the contract with
  /public/images/REPLACE_ME.md.
*/

export type SeedCategory = {
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: number;
};

export const CATEGORIES: SeedCategory[] = [
  {
    name: "Indoor Plants",
    slug: "indoor-plants",
    description:
      "The foliage that earns its shelf space: monstera, fiddle leaf, rubber plant and the rest of it. Every one here has spent a winter on our own bench.",
    image: "/images/category-indoor-plants.webp",
    sortOrder: 1,
  },
  {
    name: "Low-Light Plants",
    slug: "low-light-plants",
    description:
      "For the hallway, the north-facing room, the office corner that never sees the sun. These hold their shape in dim conditions instead of stretching and giving up.",
    image: "/images/category-low-light-plants.webp",
    sortOrder: 2,
  },
  {
    name: "Succulents and Cacti",
    slug: "succulents-and-cacti",
    description:
      "Plants that keep water in their leaves and punish you gently for overwatering them. Gritty mix, the brightest window you have, and a light hand.",
    image: "/images/category-succulents-and-cacti.webp",
    sortOrder: 3,
  },
  {
    name: "Pet-Safe Plants",
    slug: "pet-safe-plants",
    description:
      "Non-toxic to cats and dogs, so nobody has to Google the species before they bring it home. Filtered by our own list, not a marketing category.",
    image: "/images/category-pet-safe-plants.webp",
    sortOrder: 4,
  },
  {
    name: "Planters and Pots",
    slug: "planters-and-pots",
    description:
      "Terracotta, glazed stoneware and self-watering. All of them have a drainage hole, which is the only reason they are on this list.",
    image: "/images/category-planters-and-pots.webp",
    sortOrder: 5,
  },
  {
    name: "Soil and Care",
    slug: "soil-and-care",
    description:
      "Potting mix, perlite, feed, and the three tools worth owning. Bought in the same trip as the plant, so it survives the journey home.",
    image: "/images/category-soil-and-care.webp",
    sortOrder: 6,
  },
];
