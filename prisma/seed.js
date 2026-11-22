const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN' },
  });
  const customerRole = await prisma.role.upsert({
    where: { name: 'CUSTOMER' },
    update: {},
    create: { name: 'CUSTOMER' },
  });

  // Users
  const adminPass = await bcrypt.hash('Peaceking', 10);
  const customerPass = await bcrypt.hash('Customer@123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {
      passwordHash: adminPass,
      roleId: adminRole.id,
      isActive: true,
    },
    create: {
      email: 'admin@gmail.com',
      passwordHash: adminPass,
      firstName: 'Admin',
      lastName: 'User',
      roleId: adminRole.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {
      passwordHash: customerPass,
      roleId: customerRole.id,
      isActive: true,
    },
    create: {
      email: 'customer@example.com',
      passwordHash: customerPass,
      firstName: 'Jane',
      lastName: 'Customer',
      roleId: customerRole.id,
    },
  });

  // Categories
  const categories = [
    'Game Gift Cards',
    'PlayStation Cards',
    'Xbox Cards',
    'Steam Wallet',
    'Mobile Game Credits',
    'PC Games',
    'Gaming Subscriptions',
    'Digital Keys',
  ];
  for (const name of categories) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug, description: `Browse ${name}` },
    });
  }

  // Platforms
  const platforms = ['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Mobile'];
  for (const name of platforms) {
    await prisma.platform.upsert({ where: { name }, update: {}, create: { name } });
  }

  // Regions
  const regions = [
    { code: 'US', name: 'United States' },
    { code: 'EU', name: 'Europe' },
    { code: 'UK', name: 'United Kingdom' },
    { code: 'GLOBAL', name: 'Global' },
  ];
  for (const r of regions) {
    await prisma.region.upsert({ where: { code: r.code }, update: {}, create: r });
  }

  await prisma.product.updateMany({
    where: {
      name: {
        in: [
          'Steam Wallet $50',
          'PlayStation Store $25',
          'Xbox Gift Card $30',
          'Google Play $20',
          'Nintendo eShop $50',
          'Roblox 800 Robux',
        ],
      },
    },
    data: { isActive: false },
  });

  // Coupon
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: { code: 'WELCOME10', type: 'PERCENT', value: 10, isActive: true },
  });

  console.log('✅ Seed complete');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });