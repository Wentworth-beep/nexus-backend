const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const where = req.user.role.name === 'ADMIN'
      ? {}
      : {
          OR: [
            { senderId: req.user.id },
            { recipientId: req.user.id },
          ],
        };
    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
        recipient: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      },
    });
    res.json(messages);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { recipientId, orderId, body } = req.body;
    if (!body?.trim()) return res.status(400).json({ error: 'Message is required' });

    let recipient = recipientId ? await prisma.user.findUnique({ where: { id: recipientId } }) : null;
    if (!recipient) {
      const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
      recipient = await prisma.user.findFirst({ where: { roleId: adminRole?.id } });
    }
    if (!recipient) return res.status(400).json({ error: 'No admin recipient available' });

    const message = await prisma.message.create({
      data: {
        senderId: req.user.id,
        recipientId: recipient.id,
        orderId: orderId || null,
        body: body.trim(),
      },
      include: {
        sender: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
        recipient: { select: { id: true, email: true, firstName: true, lastName: true, role: true } },
      },
    });
    res.status(201).json(message);
  } catch (err) { next(err); }
});

module.exports = router;
