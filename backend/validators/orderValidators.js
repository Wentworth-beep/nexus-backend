const { body } = require('express-validator');

exports.createOrderRules = [
  body('couponCode').optional({ nullable: true }).isString().trim(),
];

exports.createPaymentRules = [
  body('orderId').isUUID(),
];