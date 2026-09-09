import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true },
    take: 2,
  });

  if (!users.length) {
    console.log('No users found. Seed needs an existing user in the database.');
    return;
  }

  const ownerId = users[0].id;
  const products = [
    {
      name: 'Aurora Lamp',
      description: 'Minimal desk lamp with warm ambience.',
      price: 49.99,
      stock: 10,
      category: 'Lighting',
      imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80',
      rating: 4.8,
      reviewsCount: 24,
      sku: 'SKU-LAMP-001',
      isFeatured: true,
      tags: ['lamp', 'home', 'lighting'],
      ownerId,
    },
    {
      name: 'Terra Chair',
      description: 'Compact ergonomic chair for home offices.',
      price: 189.0,
      stock: 7,
      category: 'Furniture',
      imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80',
      rating: 4.6,
      reviewsCount: 18,
      sku: 'SKU-CHAIR-002',
      isFeatured: false,
      tags: ['chair', 'office', 'furniture'],
      ownerId,
    },
    {
      name: 'Pulse Bottle',
      description: 'Insulated bottle for daily hydration.',
      price: 25.0,
      stock: 15,
      category: 'Lifestyle',
      imageUrl: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=900&q=80',
      rating: 4.7,
      reviewsCount: 9,
      sku: 'SKU-BOTTLE-003',
      isFeatured: false,
      tags: ['bottle', 'drinkware'],
      ownerId,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: product,
      create: product,
    });
  }

  console.log('Seeded products:', products.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
