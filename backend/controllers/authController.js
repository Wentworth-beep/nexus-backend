// LAYER: Controller — HTTP boundary, uses req/res, calls authService
const authService = require('../services/authService');

// MUST be 'none' and 'true' for cross-domain (Vercel -> Render) cookies to work
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'none',
  secure: true, 
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

exports.register = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body);
    const token = authService.signToken(user);
    res.cookie('token', token, COOKIE_OPTS);
    res.status(201).json({ user: authService.publicUser(user) });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const user = await authService.loginUser(req.body);
    const token = authService.signToken(user);
    res.cookie('token', token, COOKIE_OPTS);
    res.json({ user: authService.publicUser(user) });
  } catch (err) { next(err); }
};

exports.logout = (req, res) => {
  // Must match the exact same options to clear it properly
  res.clearCookie('token', { httpOnly: true, sameSite: 'none', secure: true });
  res.json({ ok: true });
};

exports.me = (req, res) => {
  res.json({ user: authService.publicUser(req.user) });
};
