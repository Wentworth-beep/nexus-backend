// LAYER: Service — pure business logic, no req/res
const prisma = require('../config/database');

async function getOrCreateWishlist(userId) {
  const existing = await prisma.wishlist.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: { include: { category: true, platform: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (existing) return existing;

  return prisma.wishlist.create({
    data: { userId },
    include: {
      items: {
        include: { product: { include: { category: true, platform: true } } },
      },
    },
  });
}

async function addItem(userId, productId) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) {
    throw Object.assign(new Error('Product not available'), { status: 404 });
  }

  const wl = await getOrCreateWishlist(userId);
  await prisma.wishlistItem.upsert({
    where: { wishlistId_productId: { wishlistId: wl.id, productId } },
    update: {},
    create: { wishlistId: wl.id, productId },
  });

  return getOrCreateWishlist(userId);
}

async function removeItem(userId, productId) {
  const wl = await getOrCreateWishlist(userId);
  await prisma.wishlistItem.deleteMany({
    where: { wishlistId: wl.id, productId },
  });
  return getOrCreateWishlist(userId);
}

module.exports = { getOrCreateWishlist, addItem, removeItem };