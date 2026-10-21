import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Books & Textbooks', slug: 'books-textbooks' },
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Furniture', slug: 'furniture' },
  { name: 'Clothing & Accessories', slug: 'clothing-accessories' },
  { name: 'Sports & Fitness', slug: 'sports-fitness' },
  { name: 'Stationery', slug: 'stationery' },
  { name: 'Other', slug: 'other' },
];

async function main() {
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i];
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, sortOrder: i },
      create: { ...c, sortOrder: i },
    });
  }

  await prisma.university.upsert({
    where: { emailDomain: 'example.edu' },
    update: {},
    create: { name: 'Example University', emailDomain: 'example.edu' },
  });

  console.log(`Seeded ${CATEGORIES.length} categories and 1 placeholder university.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
