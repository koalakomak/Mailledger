import { PrismaClient } from "@prisma/client";
import { parserRegistry } from "../parsers/registry";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding transaction sources...");

  const sources = parserRegistry.getAllSources();

  for (const src of sources) {
    const record = await prisma.source.upsert({
      where: { slug: src.slug },
      update: {
        name: src.name,
        filterQuery: src.filterQuery,
        parserType: src.slug,
        isActive: true,
      },
      create: {
        name: src.name,
        slug: src.slug,
        filterQuery: src.filterQuery,
        parserType: src.slug,
        isActive: true,
      },
    });
    console.log(`- Upserted source: ${record.name} (${record.slug})`);
  }

  console.log("✅ Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
