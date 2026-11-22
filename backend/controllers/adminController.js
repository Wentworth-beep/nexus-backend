// LAYER: Controller — HTTP boundary, uses req/res, calls adminService
const adminService = require('../services/adminService');

exports.dashboard = async (req, res, next) => {
  try {
    res.json(await adminService.getDashboard());
  } catch (err) { next(err); }
};

exports.users = async (req, res, next) => {
  try {
    res.json(await adminService.listUsers());
  } catch (err) { next(err); }
};

exports.orders = async (req, res, next) => {
  try {
    res.json(await adminService.listOrders());
  } catch (err) { next(err); }
};

exports.products = async (req, res, next) => {
  try {
    res.json(await adminService.listProducts());
  } catch (err) { next(err); }
};

exports.toggleUser = async (req, res, next) => {
  try {
    res.json(await adminService.toggleUserActive(req.params.id));
  } catch (err) { next(err); }
};