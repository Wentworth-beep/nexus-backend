// LAYER: Controller — HTTP boundary, uses req/res, calls couponService
const couponService = require('../services/couponService');

exports.validate = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) return res.status(400).json({ error: 'code required' });

    const subtotalNum = Number(subtotal);
    if (Number.isNaN(subtotalNum) || subtotalNum < 0) {
      return res.status(400).json({ error: 'valid subtotal required' });
    }

    res.json(await couponService.validateCoupon(code, subtotalNum));
  } catch (err) { next(err); }
};

exports.list = async (req, res, next) => {
  try {
    res.json(await couponService.listCoupons());
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { code, type, value, minSpend, maxUses, isActive, expiresAt } = req.body;

    if (!code || !type || value === undefined) {
      return res.status(400).json({ error: 'code, type, value are required' });
    }
    if (!['PERCENT', 'FIXED'].includes(type)) {
      return res.status(400).json({ error: 'type must be PERCENT or FIXED' });
    }
    if (Number(value) <= 0) {
      return res.status(400).json({ error: 'value must be > 0' });
    }

    res.status(201).json(
      await couponService.createCoupon({
        code,
        type,
        value,
        minSpend,
        maxUses,
        isActive,
        expiresAt,
      })
    );
  } catch (err) { next(err); }
};