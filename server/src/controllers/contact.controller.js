const { getDbState } = require('../config/db');
const { createContactMessage } = require('../services/contact.service');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// Same rules as client/src/utils/validators.ts
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const QUERY_TYPES = [
  'Course Enquiry',
  'Live Classes',
  'Payments & Refunds',
  'Technical Support',
  'Become a Teacher',
  'Other',
];

const str = (v) => (typeof v === 'string' ? v : '');

// POST /api/contact   body: { name, email, queryType, message }
const sendMessage = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const name = str(body.name).trim().replace(/\s+/g, ' ');
  const email = str(body.email).trim().toLowerCase();
  const queryType = str(body.queryType).trim();
  const message = str(body.message).trim();

  if (name.length < 2 || name.length > 60) throw new ApiError(400, 'Please enter your full name (2–60 characters)');
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) throw new ApiError(400, 'Please enter a valid email address');
  if (!QUERY_TYPES.includes(queryType)) throw new ApiError(400, 'Please choose a valid query type');
  if (message.length < 10) throw new ApiError(400, 'Message must be at least 10 characters');
  if (message.length > 2000) throw new ApiError(400, 'Message is too long (max 2000 characters)');

  if (getDbState() !== 'connected') {
    throw new ApiError(503, 'Messages are temporarily unavailable. Please try again later.');
  }

  await createContactMessage({ name, email, queryType, message });

  res.status(201).json({
    success: true,
    message: 'Thank you for reaching out! Our team will get back to you within 24 hours.',
  });
});

module.exports = { sendMessage };