function errorHandler(err, req, res, next) {
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  if (err instanceof require('multer').MulterError) {
    return res.status(400).json({ error: err.message, code: err.code });
  }
  if (err.message === 'Only JPEG, PNG, or WebP allowed') {
    return res.status(400).json({ error: err.message });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Duplicate value' });
  }
  if (['P1001', 'P1002', 'P2024'].includes(err.code)) {
    return res.status(503).json({
      error: 'Database temporarily unavailable. Please try again shortly.',
      code: 'DATABASE_UNAVAILABLE',
    });
  }
  if (err.code?.startsWith?.('P200')) {
    return res.status(400).json({ error: 'The request could not be completed.' });
  }

  const status = err.status || 500;
  const message = status >= 500
    ? (err.message || 'An internal server error occurred.')
    : (err.message || 'Request failed');
  res.status(status).json({
    error: message,
    ...(err.code ? { code: err.code } : {}),
  });
}
module.exports = errorHandler;