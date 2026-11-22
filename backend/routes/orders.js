const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { generateOrderNumber } = require('../utils/orderNumber');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: { include: { product: true } }, payments: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { items: { include: { product: true } }, payments: true },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { couponCode } = req.body;
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: { items: { include: { product: true } } },
    });
    if (!cart || cart.items.length === 0) return res.status(400).json({ error: 'Cart is empty' });

    const subtotal = cart.items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);

    let discount = 0;
    let coupon = null;
    if (couponCode) {
      coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
      if (!coupon || !coupon.isActive) return res.status(400).json({ error: 'Invalid coupon' });
      if (coupon.expiresAt && coupon.expiresAt < new Date())
        return res.status(400).json({ error: 'Coupon expired' });
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses)
        return res.status(400).json({ error: 'Coupon usage exceeded' });
      discount =
        coupon.type === 'PERCENT'
          ? (subtotal * Number(coupon.value)) / 100
          : Number(coupon.value);
      if (discount > subtotal) discount = subtotal;
    }

    const total = Math.max(0, subtotal - discount);

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: req.user.id,
        subtotal,
        discount,
        total,
        couponCode: coupon?.code,
        items: {
          create: cart.items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.product.price,
          })),
        },
        payments: {
          create: {
            provider: 'MANUAL',
            amount: total,
            status: 'PENDING',
          },
        },
      },
      include: { items: true, payments: true },
    });

    if (coupon) {
      await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
      await prisma.couponUsage.create({
        data: { couponId: coupon.id, userId: req.user.id, orderId: order.id },
      });
    }

    // Clear cart
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    res.status(201).json(order);
  } catch (err) { next(err); }
});

module.exports = router;