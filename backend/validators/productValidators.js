const { body } = require('express-validator');

exports.createRules = [
  body('name').isString().trim().isLength({ min: 2, max: 200 }),
  body('description').isString().trim().isLength({ min: 5 }),
  body('price').isFloat({ gt: 0 }),
  body('comparePrice').optional({ nullable: true }).isFloat({ gt: 0 }),
  body('stock').optional().isInt({ min: 0 }),
  body('categoryId').isUUID(),
  body('platformId').optional({ nullable: true }).isUUID(),
  body('regionId').optional({ nullable: true }).isUUID(),
];

exports.updateRules = [
  body('name').optional().isString().trim().isLength({ min: 2, max: 200 }),
  body('price').optional().isFloat({ gt: 0 }),
  body('stock').optional().isInt({ min: 0 }),
];