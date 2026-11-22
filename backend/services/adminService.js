// LAYER: Service — pure business logic, no req/res
const prisma = require('../config/database');

async function getDashboard() {
  const [users, products, orders, revenue, recentOrders] = await Promise.all([
    prisma.user.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: 'PAID' },
    }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true } } },
    }),
  ]);

  return {
    stats: {
      users,
      products,
      orders,
      revenue: Number(revenue._sum.total || 0),
    },
    recentOrders,
  };
}

async function listUsers() {
  const users = await prisma.user.findMany({
    include: { role: true, _count: { select: { orders: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return users.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role.name,
    orders: u._count.orders,
    isActive: u.isActive,
    createdAt: u.createdAt,
  }));
}

async function listOrders() {
  return prisma.order.findMany({
    include: {
      user: { select: { email: true } },
      items: true,
      payments: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function listProducts() {
  return prisma.product.findMany({
    include: { category: true, platform: true },
    orderBy: { createdAt: 'desc' },
  });
}

async function toggleUserActive(id) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });
  return prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
  });
}

module.exports = {
  getDashboard,
  listUsers,
  listOrders,
  listProducts,
  toggleUserActive,
};