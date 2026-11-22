const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

async function getOrCreateCart(userId) {
  let cart = await prisma.cart.findUnique({ where: { userId }, include: { items: { include: { product: true } } } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId }, include: { items: { include: { product: true } } } });
  }
  return cart;
}

router.get('/', async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user.id);
    const subtotal = cart.items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
    res.json({ cart, subtotal });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const cart = await getOrCreateCart(req.user.id);
    await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      update: { quantity: { increment: quantity } },
      create: { cartId: cart.id, productId, quantity },
    });
    const updated = await getOrCreateCart(req.user.id);
    res.json(updated);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: req.params.id } });
    } else {
      await prisma.cartItem.update({ where: { id: req.params.id }, data: { quantity } });
    }
    const cart = await getOrCreateCart(req.user.id);
    res.json(cart);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.cartItem.delete({ where: { id: req.params.id } });
    const cart = await getOrCreateCart(req.user.id);
    res.json(cart);
  } catch (err) { next(err); }
});

module.exports = router;