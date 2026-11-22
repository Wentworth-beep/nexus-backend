// LAYER: Controller — HTTP boundary, uses req/res, calls paymentService
const paymentService = require('../services/paymentService');
const { port } = require('../config/environment');

exports.create = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId required' });
    res.json(await paymentService.createIntent(req.user.id, orderId));
  } catch (err) { next(err); }
};

exports.webhook = async (req, res, next) => {
  try {
    // In production: verify HMAC signature of req.body against provider secret here.
    await paymentService.applyWebhook({
      providerRef: req.body.providerRef,
      status: req.body.status,
      raw: req.body,
    });
    res.json({ received: true });
  } catch (err) { next(err); }
};

// DEV ONLY — simulates provider calling our webhook. Remove in production.
exports.simulateWebhook = async (req, res, next) => {
  try {
    const { orderId, success = true } = req.body;
    const payment = await paymentService.findByOrderId(orderId);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    await fetch(`http://localhost:${port}/api/payments/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerRef: payment.providerRef,
        status: success ? 'SUCCEEDED' : 'FAILED',
      }),
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
};