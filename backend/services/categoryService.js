// LAYER: Service — pure business logic, no req/res
const prisma = require('../config/database');
const { slugify } = require('../utils/slugify');

async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  });
}

async function getCategoryBySlug(slug) {
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) throw Object.assign(new Error('Category not found'), { status: 404 });
  return category;
}

async function createCategory({ name, description, imageUrl }) {
  const slug = slugify(name);
  const exists = await prisma.category.findUnique({ where: { slug } });
  if (exists) throw Object.assign(new Error('Category already exists'), { status: 409 });

  return prisma.category.create({
    data: { name, slug, description: description || null, imageUrl: imageUrl || null },
  });
}

async function updateCategory(id, data) {
  const patch = {};
  if (data.name !== undefined) {
    patch.name = data.name;
    patch.slug = slugify(data.name);
  }
  if (data.description !== undefined) patch.description = data.description;
  if (data.imageUrl !== undefined) patch.imageUrl = data.imageUrl;

  return prisma.category.update({ where: { id }, data: patch });
}

async function deleteCategory(id) {
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    throw Object.assign(
      new Error('Cannot delete category with products'),
      { status: 409 }
    );
  }
  return prisma.category.delete({ where: { id } });
}

module.exports = {
  listCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};