const prisma = require('../config/database');
const cartService = require('./cartService');
const couponService = require('./couponService');
const { generateOrderNumber } = require('../utils/orderNumber');

async function createOrder(userId, { couponCode }) {
  const cart = await cartService.getOrCreateCart(userId);
  if (!cart.items.length) throw Object.assign(new Error('Cart is empty'), { status: 400 });

  const subtotal = cartService.calculateSubtotal(cart);

  let discount = 0, coupon = null;
  if (couponCode) {
    const result = await couponService.validateCoupon(couponCode, subtotal);
    coupon = result.coupon;
    discount = result.discount;
  }
  const total = Math.max(0, subtotal - discount);

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId, subtotal, discount, total,
      couponCode: coupon?.code,
      items: {
        create: cart.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.product.price,
        })),
      },
      payments: {
        create: { provider: 'MANUAL', amount: total, status: 'PENDING' },
      },
    },
    include: { items: true, payments: true },
  });

  if (coupon) await couponService.recordUsage(coupon.id, userId, order.id);
  await cartService.clearCart(cart.id);
  return order;
}

async function listOrders(userId) {
  return prisma.order.findMany({
    where: { userId },
    include: { items: { include: { product: true } }, payments: true },
    orderBy: { createdAt: 'desc' },
  });
}

async function getOrder(userId, id) {
  const order = await prisma.order.findFirst({
    where: { id, userId },
    include: { items: { include: { product: true } }, payments: true },
  });
  if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
  return order;
}

module.exports = { createOrder, listOrders, getOrder };