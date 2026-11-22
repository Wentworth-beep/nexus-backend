// LAYER: Service — pure business logic, no req/res
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { jwtSecret, jwtExpiresIn } = require('../config/environment');

async function registerUser({ email, password, firstName, lastName }) {
  const role = await prisma.role.findUnique({ where: { name: 'CUSTOMER' } });
  if (!role) throw Object.assign(new Error('Role missing. Run seed.'), { status: 500 });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: firstName || null,
      lastName: lastName || null,
      roleId: role.id,
      cart: { create: {} },
      wishlist: { create: {} },
    },
    include: { role: true },
  });
  return user;
}

async function loginUser({ email, password }) {
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