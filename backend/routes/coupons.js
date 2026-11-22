const express = require('express');
const prisma = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const couponController = require('../controllers/couponController');

const router = express.Router();

router.post('/validate', authenticate, async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.isActive) return res.status(400).json({ error: 'Invalid coupon' });
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return res.status(400).json({ error: 'Expired' });
    if (coupon.minSpend && subtotal < Number(coupon.minSpend)) return res.status(400).json({ error: `Minimum spend $${coupon.minSpend}` });

    const discount = coupon.type === 'PERCENT'
      ? (subtotal * Number(coupon.value)) / 100
      : Number(coupon.value);

    res.json({ coupon, discount: Math.min(discount, subtotal) });
  } catch (err) { next(err); }
});

router.get('/', authenticate, requireAdmin, async (req, res) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(coupons);
});

router.post('/', authenticate, requireAdmin, couponController.create);

module.exports = router;