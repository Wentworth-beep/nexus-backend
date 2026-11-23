const express = require('express');
const prisma = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

function safeImageUrl(product) {
  if (!product?.imageUrl || product.imageUrl.startsWith('/uploads/')) return null;
  return product.imageUrl;
}

router.get('/', async (req, res, next) => {
  try {
    const { q, category, platform, region, sort, featured, page = 1, limit = 12 } = req.query;
    const where = { isActive: true };

    if (q) where.name = { contains: q, mode: 'insensitive' };
    if (category) where.category = { slug: category };
    if (platform) where.platform = { name: platform };
    if (region) where.region = { code: region };
    if (featured === 'true') where.isFeatured = true;

    let orderBy = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    if (sort === 'price_desc') orderBy = { price: 'desc' };
    if (sort === 'name') orderBy = { name: 'asc' };

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: Number(limit),
        include: { category: true, platform: true, region: true },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      items: items.map((item) => ({ ...item, imageUrl: safeImageUrl(item) })),
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    next(Object.assign(
      new Error(err.code ? `${err.code}: ${err.message || 'Product could not be updated'}` : (err.message || 'Product could not be updated')),
      { status: err.status || 500, code: err.code },
    ));
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        platform: true,
        region: true,
      },
    });
    if (!product) return res.status(404).json({ error: 'Not found' });

    const related = await prisma.product.findMany({
      where: { categoryId: product.categoryId, id: { not: product.id }, isActive: true },
      take: 4,
    });

    res.json({
      product: { ...product, imageUrl: safeImageUrl(product) },
      related: related.map((item) => ({ ...item, imageUrl: safeImageUrl(item) })),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    const { name, description, price, stock, categoryId, platformId, regionId, comparePrice, isFeatured, rating } = req.body;
    if (!name || !description || !price || !categoryId) {
      return res.status(400).json({ error: 'Name, description, price, and category are required' });
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price: Number(price),
        comparePrice: comparePrice || null,
        stock: stock ? Number(stock) : 0,
        isFeatured: isFeatured === true || isFeatured === 'true',
        rating: rating ? Math.min(5, Math.max(0, Number(rating))) : 0,
        categoryId,
        platformId: platformId || null,
        regionId: regionId || null,
        imageUrl: req.file
          ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
          : null,
      },
    });
    res.status(201).json(product);
  } catch (err) {
    next(Object.assign(
      new Error(err.code ? `${err.code}: ${err.message || 'Product could not be created'}` : (err.message || 'Product could not be created')),
      { status: err.status || 500, code: err.code },
    ));
  }
});

router.put('/:id', authenticate, requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    const data = { ...req.body };
    for (const field of ['price', 'comparePrice', 'stock']) {
      if (data[field] === '' || data[field] === undefined) delete data[field];
      else if (field !== 'stock') data[field] = Number(data[field]);
      else data[field] = Number(data[field]);
    }
    for (const field of ['platformId', 'regionId']) {
      if (!data[field]) delete data[field];
    }
    if (data.rating !== undefined) {
      data.rating = Math.min(5, Math.max(0, Number(data.rating) || 0));
    }
    if (data.isFeatured !== undefined) data.isFeatured = data.isFeatured === 'true';
    if (req.file) {
      data.imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data,
    });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;