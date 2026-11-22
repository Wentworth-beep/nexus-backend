const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Manual checkout uses admin messaging. This route intentionally has no
// automatic payment or sandbox endpoints.

module.exports = router;