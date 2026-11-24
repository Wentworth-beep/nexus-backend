const express = require('express');
const prisma = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireAdmin);

router.get('/dashboard', async (req, res, next) => {
  try {
    const [userCount, productCount, orderCount, revenueAgg, recentOrders] = await Promise.all([
      prisma.user.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true }, where: { status: 'PAID' } }),
      prisma.order.findMany({ take: 8, orderBy: { createdAt: 'desc' }, include: { user: { select: { email: true } } } }),
    ]);
    res.json({
      stats: {
        users: userCount,
        products: productCount,
        orders: orderCount,
        revenue: Number(revenueAgg._sum.total || 0),
      },
      recentOrders,
    });
  } catch (err) { next(err); }
});

router.get('/metadata', async (req, res, next) => {
  try {
    const [categories, platforms, regions] = await Promise.all([
      prisma.category.findMany({ orderBy: { name: 'asc' } }),
      prisma.platform.findMany({ orderBy: { name: 'asc' } }),
      prisma.region.findMany({ orderBy: { name: 'asc' } }),
    ]);
    res.json({ categories, platforms, regions });
  } catch (err) { next(err); }
});

router.patch('/orders/:id', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['PENDING', 'PAID', 'FAILED', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }
    const order = await prisma.order.update({ where: { id: req.params.id }, data: { status } });
    res.json(order);
  } catch (err) { next(err); }
});

router.delete('/orders/:id', async (req, res, next) => {
  try {
    await prisma.order.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.get('/users', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      include: { role: true, _count: { select: { orders: true } } },
      orderBy: { createdAt: 'desc' },
    });

    router.patch('/users/:id', async (req, res, next) => {
      try {
        const target = await prisma.user.findUnique({ where: { id: req.params.id }, include: { role: true } });
        if (!target) return res.status(404).json({ error: 'Client not found' });
        if (target.role.name === 'ADMIN') return res.status(400).json({ error: 'Cannot ban an admin account' });
        const isActive = req.body.isActive === true;
        const user = await prisma.user.update({ where: { id: target.id }, data: { isActive } });
        res.json({ id: user.id, isActive: user.isActive });
      } catch (err) { next(err); }
    });

    router.delete('/users/:id', async (req, res, next) => {
      try {
        const target = await prisma.user.findUnique({ where: { id: req.params.id }, include: { role: true } });
        if (!target) return res.status(404).json({ error: 'Client not found' });
        if (target.role.name === 'ADMIN') return res.status(400).json({ error: 'Cannot delete an admin account' });

        await prisma.$transaction([
          prisma.message.deleteMany({ where: { OR: [{ senderId: target.id }, { recipientId: target.id }] } }),
          prisma.order.deleteMany({ where: { userId: target.id } }),
          prisma.cart.deleteMany({ where: { userId: target.id } }),
          prisma.wishlist.deleteMany({ where: { userId: target.id } }),
          prisma.user.delete({ where: { id: target.id } }),
        ]);
        res.json({ ok: true });
      } catch (err) { next(err); }
    });
    res.json(users.map(u => ({
      id: u.id, email: u.email, role: u.role.name, orders: u._count.orders,
      isActive: u.isActive, createdAt: u.createdAt,
    })));
  } catch (err) { next(err); }
});

router.get('/orders', async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { id: true, email: true } },
        items: { include: { product: { select: { id: true, name: true, imageUrl: true } } } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) { next(err); }
});

router.get('/products', async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true, platform: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(products.map((product) => ({
      ...product,
      imageUrl: product.imageUrl?.startsWith('/uploads/') ? null : product.imageUrl,
    })));
  } catch (err) { next(err); }
});

module.exports = router;