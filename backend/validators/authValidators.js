// LAYER: Validator — declarative express-validator chains, no logic
const { body } = require('express-validator');

exports.registerRules = [
  body('email')
    .isEmail().withMessage('Valid email required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .isString(),
  body('firstName')
    .optional({ nullable: true })
    .isString().trim()
    .isLength({ max: 100 }),
  body('lastName')
    .optional({ nullable: true })
    .isString().trim()
    .isLength({ max: 100 }),
];

exports.loginRules = [
  body('email')
    .isEmail().withMessage('Valid email required')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password required')
    .isString(),
];