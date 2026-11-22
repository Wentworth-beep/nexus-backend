// LAYER: Controller — HTTP boundary, uses req/res, calls orderService
const orderService = require('../services/orderService');

exports.list = async (req, res, next) => {
  try {
    res.json(await orderService.listOrders(req.user.id));
  } catch (err) { next(err); }
};

exports.detail = async (req, res, next) => {
  try {
    res.json(await orderService.getOrder(req.user.id, req.params.id));
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { couponCode } = req.body;
    const order = await orderService.createOrder(req.user.id, { couponCode });
    res.status(201).json(order);
  } catch (err) { next(err); }
};