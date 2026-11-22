const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { jwtSecret } = require('../config/environment');

async function authenticate(req, res, next) {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null);

    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const payload = jwt.verify(token, jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });
    if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid user' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role?.name !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = { authenticate, requireAdmin };