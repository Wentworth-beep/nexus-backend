// LAYER: Service — pure business logic, no req/res
const prisma = require('../config/database');
const { slugify } = require('../utils/slugify');

async function listProducts(query = {}) {
  const { q, category, platform, region, sort, featured, page = 1, limit = 12 } = query;
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

  const take = Math.max(1, Math.min(100, Number(limit)));
  const skip = (Math.max(1, Number(page)) - 1) * take;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
      include: { category: true, platform: true, region: true },
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, page: Number(page), limit: take };
}

async function getProduct(id) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      platform: true,
      region: true,
    },
  });
  if (!product || !product.isActive) {
    throw Object.assign(new Error('Product not found'), { status: 404 });
  }

  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      isActive: true,
    },
    take: 4,
  });

  return { product, related };
}

async function createProduct(input) {
  const slug = `${slugify(input.name)}-${Date.now().toString(36)}`;
  return prisma.product.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      price: input.price,
      comparePrice: input.comparePrice || null,
      stock: input.stock ?? 0,
      isFeatured: !!input.isFeatured,
      categoryId: input.categoryId,
      platformId: input.platformId || null,
      regionId: input.regionId || null,
    },
    include: { category: true, platform: true, region: true },
  });
}

async function updateProduct(id, data) {
  const allowed = [
    'name', 'description', 'price', 'comparePrice',
    'stock', 'isFeatured', 'isActive',
    'categoryId', 'platformId', 'regionId',
  ];
  const patch = {};
  for (const key of allowed) {
    if (data[key] !== undefined) patch[key] = data[key];
  }
  return prisma.product.update({
    where: { id },
    data: patch,
    include: { category: true, platform: true },
  });
}

async function softDeleteProduct(id) {
  return prisma.product.update({
    where: { id },
    data: { isActive: false },
  });
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  softDeleteProduct,
};