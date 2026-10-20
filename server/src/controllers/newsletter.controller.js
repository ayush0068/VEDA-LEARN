const { getDbState } = require('../config/db');
const { subscribeEmail } = require('../services/newsletter.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// POST /api/newsletter/subscribe   body: { email }
const subscribe = asyncHandler(async (req, res) => {
  const raw = req.body && req.body.email;
  const email = typeof raw === 'string' ? raw.trim().toLowerCase() : '';

  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    throw new ApiError(400, 'Please enter a valid email address');
  }
  if (getDbState() !== 'connected') {
    throw new ApiError(503, 'Subscription is temporarily unavailable. Please try again later.');
  }

  const isNew = await subscribeEmail(email);

  res.status(isNew ? 201 : 200).json({
    success: true,
    message: isNew ? 'Thank you for subscribing!' : "You're already subscribed.",
  });
});

module.exports = { subscribe };