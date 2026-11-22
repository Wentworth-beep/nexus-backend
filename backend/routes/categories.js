const express = require('express');
const prisma = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    res.json(categories);
  } catch (err) { next(err); }
});

router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const c = await prisma.category.create({ data: { name, slug, description } });
    res.status(201).json(c);
  } catch (err) { next(err); }
});

module.exports = router;