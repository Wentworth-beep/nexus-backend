const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { jwtSecret, jwtExpiresIn } = require('../config/environment');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function registerUser({ email, password, firstName, lastName }) {
  email = normalizeEmail(email);
  if (!email || !password) {
    throw Object.assign(new Error('Email and password required'), { status: 400 });
  }

  const role = await prisma.role.upsert({
    where: { name: 'CUSTOMER' },
    update: {},
    create: { name: 'CUSTOMER' },
  });

  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: firstName?.trim() || null,
      lastName: lastName?.trim() || null,
      roleId: role.id,
      cart: { create: {} },
      wishlist: { create: {} },
    },
    include: { role: true },
  });
}

async function loginUser({ email, password }) {
  email = normalizeEmail(email);
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });
  if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  if (!user.isActive) throw Object.assign(new Error('Account disabled'), { status: 403 });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  return user;
}

function signToken(user) {
  return jwt.sign({ sub: user.id }, jwtSecret, { expiresIn: jwtExpiresIn });
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role.name,
  };
}

module.exports = { registerUser, loginUser, signToken, publicUser };
