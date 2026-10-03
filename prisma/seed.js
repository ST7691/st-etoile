import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting ST Restaurant seed...");

  const starters = await prisma.category.upsert({
    where: { slug: "starters" },
    update: {},
    create: {
      name: "Starters",
      slug: "starters",
      description: "Elegant starters to begin your dining experience.",
    },
  });

  const mainCourse = await prisma.category.upsert({
    where: { slug: "main-course" },
    update: {},
    create: {
      name: "Main Course",
      slug: "main-course",
      description: "Signature main dishes from ST Restaurant.",
    },
  });

  const desserts = await prisma.category.upsert({
    where: { slug: "desserts" },
    update: {},
    create: {
      name: "Desserts",
      slug: "desserts",
      description: "Premium desserts and sweet dishes.",
    },
  });

  const drinks = await prisma.category.upsert({
    where: { slug: "drinks" },
    update: {},
    create: {
      name: "Drinks",
      slug: "drinks",
      description: "Refreshing drinks and signature beverages.",
    },
  });

  await prisma.menuItem.upsert({
    where: { slug: "truffle-bruschetta" },
    update: {},
    create: {
      name: "Truffle Bruschetta",
      slug: "truffle-bruschetta",
      description: "Crispy artisan bread with creamy truffle and fresh herbs.",
      price: 590,
      image: "/images/dishes/truffle-bruschetta.jpg",
      available: true,
      featured: true,
      categoryId: starters.id,
    },
  });

  await prisma.menuItem.upsert({
    where: { slug: "crispy-calamari" },
    update: {},
    create: {
      name: "Crispy Calamari",
      slug: "crispy-calamari",
      description: "Golden crispy calamari with signature lemon herb sauce.",
      price: 790,
      image: "/images/dishes/crispy-calamari.jpg",
      available: true,
      featured: false,
      categoryId: starters.id,
    },
  });

  await prisma.menuItem.upsert({
    where: { slug: "truffle-steak" },
    update: {},
    create: {
      name: "Truffle Steak",
      slug: "truffle-steak",
      description: "Premium grilled steak with truffle sauce and vegetables.",
      price: 1890,
      image: "/images/dishes/truffle-steak.jpg",
      available: true,
      featured: true,
      categoryId: mainCourse.id,
    },
  });

  await prisma.menuItem.upsert({
    where: { slug: "royal-salmon" },
    update: {},
    create: {
      name: "Royal Salmon",
      slug: "royal-salmon",
      description: "Fresh salmon fillet with creamy sauce and herbs.",
      price: 1490,
      image: "/images/dishes/royal-salmon.jpg",
      available: true,
      featured: true,
      categoryId: mainCourse.id,
    },
  });

  await prisma.menuItem.upsert({
    where: { slug: "golden-dessert" },
    update: {},
    create: {
      name: "Golden Dessert",
      slug: "golden-dessert",
      description: "Elegant signature dessert with rich creamy texture.",
      price: 690,
      image: "/images/dishes/golden-dessert.jpg",
      available: true,
      featured: true,
      categoryId: desserts.id,
    },
  });

  await prisma.menuItem.upsert({
    where: { slug: "chocolate-lava" },
    update: {},
    create: {
      name: "Chocolate Lava",
      slug: "chocolate-lava",
      description: "Warm chocolate cake with a rich molten center.",
      price: 650,
      image: "/images/dishes/chocolate-lava.jpg",
      available: true,
      featured: false,
      categoryId: desserts.id,
    },
  });

  await prisma.menuItem.upsert({
    where: { slug: "royal-mocktail" },
    update: {},
    create: {
      name: "Royal Mocktail",
      slug: "royal-mocktail",
      description: "Refreshing signature mocktail with citrus and berries.",
      price: 390,
      image: "/images/dishes/royal-mocktail.jpg",
      available: true,
      featured: true,
      categoryId: drinks.id,
    },
  });

  await prisma.menuItem.upsert({
    where: { slug: "fresh-lemonade" },
    update: {},
    create: {
      name: "Fresh Lemonade",
      slug: "fresh-lemonade",
      description: "Fresh lemon with mint and a refreshing citrus finish.",
      price: 290,
      image: "/images/dishes/fresh-lemonade.jpg",
      available: true,
      featured: false,
      categoryId: drinks.id,
    },
  });

  console.log("✅ Categories created!");
  console.log("✅ Menu items created!");
  console.log("🍽️ ST Restaurant database is ready!");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
