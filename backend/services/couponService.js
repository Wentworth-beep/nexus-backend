// LAYER: Service — pure business logic, no req/res
const prisma = require('../config/database');

async function validateCoupon(code, subtotal) {
  if (!code) throw Object.assign(new Error('Coupon code required'), { status: 400 });

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });
  if (!coupon || !coupon.isActive) {
    throw Object.assign(new Error('Invalid coupon'), { status: 400 });
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw Object.assign(new Error('Coupon expired'), { status: 400 });
  }
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    throw Object.assign(new Error('Coupon usage limit reached'), { status: 400 });
  }
  if (coupon.minSpend && subtotal < Number(coupon.minSpend)) {
    throw Object.assign(
      new Error(`Minimum spend is $${Number(coupon.minSpend).toFixed(2)}`),
      { status: 400 }
    );
  }

  const discount =
    coupon.type === 'PERCENT'
      ? (subtotal * Number(coupon.value)) / 100
      : Number(coupon.value);

  return { coupon, discount: Math.min(discount, subtotal) };
}

async function recordUsage(couponId, userId, orderId) {
  await prisma.$transaction([
    prisma.coupon.update({
      where: { id: couponId },
      data: { usedCount: { increment: 1 } },
    }),
    prisma.couponUsage.create({
      data: { couponId, userId, orderId },
    }),
  ]);
}

async function listCoupons() {
  return prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
}

async function createCoupon(input) {
  return prisma.coupon.create({
    data: {
      code: input.code.toUpperCase(),
      type: input.type,
      value: input.value,
      minSpend: input.minSpend ?? null,
      maxUses: input.maxUses ?? null,
      isActive: input.isActive ?? true,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    },
  });
}

module.exports = {
  validateCoupon,
  recordUsage,
  listCoupons,
  createCoupon,
};