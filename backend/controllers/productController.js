// LAYER: Controller — HTTP boundary, uses req/res, calls productService
const productService = require('../services/productService');

exports.list = async (req, res, next) => {
  try {
    res.json(await productService.listProducts(req.query));
  } catch (err) { next(err); }
};

exports.detail = async (req, res, next) => {
  try {
    res.json(await productService.getProduct(req.params.id));
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    res.status(201).json(await productService.createProduct(req.body));
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    res.json(await productService.updateProduct(req.params.id, req.body));
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    res.json(await productService.softDeleteProduct(req.params.id));
  } catch (err) { next(err); }
};