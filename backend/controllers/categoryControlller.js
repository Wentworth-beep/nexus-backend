// LAYER: Controller — HTTP boundary, uses req/res, calls categoryService
const categoryService = require('../services/categoryService');

exports.list = async (req, res, next) => {
  try {
    res.json(await categoryService.listCategories());
  } catch (err) { next(err); }
};

exports.detail = async (req, res, next) => {
  try {
    res.json(await categoryService.getCategoryBySlug(req.params.slug));
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    res.status(201).json(await categoryService.createCategory(req.body));
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    res.json(await categoryService.updateCategory(req.params.id, req.body));
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    res.json(await categoryService.deleteCategory(req.params.id));
  } catch (err) { next(err); }
};