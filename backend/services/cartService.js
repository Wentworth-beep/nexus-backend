const prisma = require('../config/database');

async function getOrCreateCart(userId) {
  const existing = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });
  if (existing) return existing;
  return prisma.cart.create({
    data: { userId },
    include: { items: { include: { product: true } } },
  });
}

function calculateSubtotal(cart) {
  return cart.items.reduce(
    (sum, i) => sum + Number(i.product.price) * i.quantity, 0
  );
}

async function addItem(userId, productId, quantity) {
  const cart = await getOrCreateCart(userId);
  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    update: { quantity: { increment: quantity } },
    create: { cartId: cart.id, productId, quantity },
  });
  return getOrCreateCart(userId);
}

async function updateItem(userId, itemId, quantity) {
  const cart = await getOrCreateCart(userId);
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
  });
  if (!item) throw Object.assign(new Error('Item not found'), { status: 404 });

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  }
  return getOrCreateCart(userId);
}

async function removeItem(userId, itemId) {
  const cart = await getOrCreateCart(userId);
  await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
  return getOrCreateCart(userId);
}

async function clearCart(cartId) {
  await prisma.cartItem.deleteMany({ where: { cartId } });
}

module.exports = {
  getOrCreateCart, calculateSubtotal, addItem, updateItem, removeItem, clearCart,
};