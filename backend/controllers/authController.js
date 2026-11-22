// LAYER: Controller — HTTP boundary, uses req/res, calls authService
const authService = require('../services/authService');
const { nodeEnv } = require('../config/environment');

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: nodeEnv === 'production',
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
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: nodeEnv === 'production' });
  res.json({ ok: true });
};

exports.me = (req, res) => {
  res.json({ user: authService.publicUser(req.user) });
};