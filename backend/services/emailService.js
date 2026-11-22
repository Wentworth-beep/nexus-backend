const prisma = require('../config/database');

async function validateCoupon(code, subtotal) {
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.isActive) throw Object.assign(new Error('Invalid coupon'), { status: 400 });
  if (coupon.expiresAt && coupon.expiresAt < new Date())
    throw Object.assign(new Error('Coupon expired'), { status: 400 });
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses)
    throw Object.assign(new Error('Coupon usage limit reached'), { status: 400 });
  if (coupon.minSpend && subtotal < Number(coupon.minSpend))
    throw Object.assign(new Error(`Minimum spend ${coupon.minSpend}`), { status: 400 });

  const discount = coupon.type === 'PERCENT'
    ? (subtotal * Number(coupon.value)) / 100
    : Number(coupon.value);
  return { coupon, discount: Math.min(discount, subtotal) };
}

async function recordUsage(couponId, userId, orderId) {
  await prisma.coupon.update({
    where: { id: couponId }, data: { usedCount: { increment: 1 } },
  });
  await prisma.couponUsage.create({ data: { couponId, userId, orderId } });
}

module.exports = { validateCoupon, recordUsage };