// LAYER: Controller — HTTP boundary, uses req/res, calls cartService
const cartService = require('../services/cartService');

exports.get = async (req, res, next) => {
  try {
    const cart = await cartService.getOrCreateCart(req.user.id);
    const subtotal = cartService.calculateSubtotal(cart);
    res.json({ cart, subtotal });
  } catch (err) { next(err); }
};

exports.add = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId required' });
    const cart = await cartService.addItem(req.user.id, productId, Number(quantity));
    res.json(cart);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const quantity = Number(req.body.quantity);
    if (Number.isNaN(quantity)) {
      return res.status(400).json({ error: 'quantity must be a number' });
    }
    const cart = await cartService.updateItem(req.user.id, req.params.id, quantity);
    res.json(cart);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const cart = await cartService.removeItem(req.user.id, req.params.id);
    res.json(cart);
  } catch (err) { next(err); }
};