import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});
// const prisma = new PrismaClient();

const categories = [
  {
    name: "Starters",
    slug: "starters",
    description: "Elegant appetizers to begin your dining experience.",
  },
  {
    name: "Main Course",
    slug: "main-course",
    description: "Signature dishes prepared by our chefs.",
  },
  {
    name: "Desserts",
    slug: "desserts",
    description: "Sweet creations to complete your meal.",
  },
  {
    name: "Drinks",
    slug: "drinks",
    description: "Refreshing beverages and signature drinks.",
  },
];

const dishes = [
  {
    name: "Truffle Steak",
    slug: "truffle-steak",
    description:
      "Premium grilled steak served with truffle butter and seasonal vegetables.",
    price: 1850,
    oldPrice: 2100,
    image: "/images/dishes/truffle-steak.jpg",
    rating: 4.9,
    available: true,
    featured: true,
    categorySlug: "main-course",
  },
  {
    name: "Royal Salmon",
    slug: "royal-salmon",
    description:
      "Pan-seared salmon with creamy herbs, vegetables and our signature sauce.",
    price: 1450,
    oldPrice: 1650,
    image: "/images/dishes/royal-salmon.jpg",
    rating: 4.8,
    available: true,
    featured: true,
    categorySlug: "main-course",
  },
  {
    name: "Golden Dessert",
    slug: "golden-dessert",
    description:
      "A luxurious signature dessert crafted with chocolate, cream and caramel.",
    price: 650,
    oldPrice: 750,
    image: "/images/dishes/golden-dessert.jpg",
    rating: 4.9,
    available: true,
    featured: true,
    categorySlug: "desserts",
  },
  {
    name: "Crispy Chicken",
    slug: "crispy-chicken",
    description:
      "Crispy golden chicken served with our signature dipping sauce.",
    price: 780,
    image: "/images/dishes/crispy-chicken.jpg",
    rating: 4.7,
    available: true,
    featured: false,
    categorySlug: "starters",
  },
  {
    name: "Creamy Pasta",
    slug: "creamy-pasta",
    description: "Rich creamy pasta prepared with fresh herbs and parmesan.",
    price: 720,
    image: "/images/dishes/creamy-pasta.jpg",
    rating: 4.8,
    available: true,
    featured: false,
    categorySlug: "main-course",
  },
  {
    name: "Chocolate Lava Cake",
    slug: "chocolate-lava-cake",
    description: "Warm chocolate cake with a rich molten chocolate center.",
    price: 550,
    image: "/images/dishes/chocolate-lava-cake.jpg",
    rating: 4.9,
    available: true,
    featured: false,
    categorySlug: "desserts",
  },
  {
    name: "Classic Mojito",
    slug: "classic-mojito",
    description:
      "Refreshing mint, lime and sparkling soda with a signature ST twist.",
    price: 420,
    image: "/images/dishes/classic-mojito.jpg",
    rating: 4.6,
    available: true,
    featured: false,
    categorySlug: "drinks",
  },
  {
    name: "Fresh Orange Juice",
    slug: "fresh-orange-juice",
    description: "Freshly squeezed orange juice served chilled.",
    price: 280,
    image: "/images/dishes/orange-juice.jpg",
    rating: 4.7,
    available: true,
    featured: false,
    categorySlug: "drinks",
  },
];

async function main() {
  console.log("🌱 Starting ST Restaurant seed...");

  for (const category of categories) {
    await prisma.category.upsert({
      where: {
        slug: category.slug,
      },
      update: {
        name: category.name,
        description: category.description,
      },
      create: category,
    });
  }

  for (const dish of dishes) {
    const category = await prisma.category.findUnique({
      where: {
        slug: dish.categorySlug,
      },
    });

    if (!category) {
      throw new Error(`Category not found: ${dish.categorySlug}`);
    }

    await prisma.menuItem.upsert({
      where: {
        slug: dish.slug,
      },
      update: {
        name: dish.name,
        description: dish.description,
        price: dish.price,
        oldPrice: dish.oldPrice,
        image: dish.image,
        rating: dish.rating,
        available: dish.available,
        featured: dish.featured,
        categoryId: category.id,
      },
      create: {
        name: dish.name,
        slug: dish.slug,
        description: dish.description,
        price: dish.price,
        oldPrice: dish.oldPrice,
        image: dish.image,
        rating: dish.rating,
        available: dish.available,
        featured: dish.featured,
        categoryId: category.id,
      },
    });
  }

  console.log("✅ Categories created.");
  console.log("✅ Menu items created.");
  console.log("🍽️ ST Restaurant seed completed successfully.");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
