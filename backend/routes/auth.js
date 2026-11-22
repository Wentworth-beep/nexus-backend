const express = require('express');
const { validationResult } = require('express-validator');
const controller = require('../controllers/authController');
const { registerRules, loginRules } = require('../validators/authValidators');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function validate(rules) {
  return [
    ...rules,
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(), error: errors.array()[0].msg });
      }
      next();
    },
  ];
}

router.post('/register', validate(registerRules), controller.register);
router.post('/login', validate(loginRules), controller.login);
router.post('/logout', controller.logout);
router.get('/me', authenticate, controller.me);

module.exports = router;