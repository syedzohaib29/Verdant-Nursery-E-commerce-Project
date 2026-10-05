import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "@/generated/prisma/client";

const SEED = [
  {
    name: "Monstera deliciosa",
    latinName: "Monstera deliciosa",
    note: "Forgiving, dramatic, and happy in a dim hallway. Give it a pole once it starts climbing.",
    priceCents: 4200,
  },
  {
    name: "Snake plant",
    latinName: "Dracaena trifasciata",
    note: "Tolerates neglect better than anything else we sell. Water when the soil is properly dry.",
    priceCents: 2600,
  },
  {
    name: "Pothos",
    latinName: "Epipremnum aureum",
    note: "Trails from a shelf within a season. Trim the vine to keep it dense rather than leggy.",
    priceCents: 1800,
  },
  {
    name: "Fiddle-leaf fig",
    latinName: "Ficus lyrata",
    note: "Beautiful, opinionated, and it will tell you when it disagrees. Only for bright rooms.",
    priceCents: 6800,
  },
  {
    name: "ZZ plant",
    latinName: "Zamioculcas zamiifolia",
    note: "Stores water in its rhizomes, so a missed fortnight genuinely does not matter.",
    priceCents: 3200,
  },
  {
    name: "Chinese money plant",
    latinName: "Pilea peperomioides",
    note: "Throws pups you can pot up for friends. Rotate it weekly or it leans.",
    priceCents: 2400,
  },
];

async function main() {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
  });
  const prisma = new PrismaClient({ adapter });

  for (const plant of SEED) {
    await prisma.product.upsert({
      where: { id: `seed-${plant.latinName.toLowerCase().replace(/[^a-z]+/g, "-")}` },
      update: { name: plant.name, note: plant.note, priceCents: plant.priceCents, status: "ACTIVE" },
      create: {
        id: `seed-${plant.latinName.toLowerCase().replace(/[^a-z]+/g, "-")}`,
        name: plant.name,
        latinName: plant.latinName,
        note: plant.note,
        priceCents: plant.priceCents,
        status: "ACTIVE",
      },
    });
  }

  const count = await prisma.product.count();
  console.log(`seeded; product count = ${count}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});