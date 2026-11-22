// LAYER: Controller — HTTP boundary, uses req/res, calls wishlistService
const wishlistService = require('../services/wishlistService');

exports.get = async (req, res, next) => {
  try {
    res.json(await wishlistService.getOrCreateWishlist(req.user.id));
  } catch (err) { next(err); }
};

exports.add = async (req, res, next) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId required' });
    res.json(await wishlistService.addItem(req.user.id, productId));
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    res.json(await wishlistService.removeItem(req.user.id, req.params.productId));
  } catch (err) { next(err); }
};