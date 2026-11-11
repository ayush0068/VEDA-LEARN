const crypto = require('crypto');

// no look-alike characters (0/O, 1/l/I) so a password read out over the phone or typed from WhatsApp is hard to get wrong
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const DIGITS = '23456789';
const SYMBOLS = '@#$%&*';

const pick = (chars) => chars[crypto.randomInt(chars.length)];

/**
 * Random temporary password (cryptographically secure), e.g. "Kd7@mTq4xPv2".
 * Always has an upper-case letter, a lower-case letter, a digit and a symbol, so it passes the site's password rules.
 */
const generateTempPassword = (length = 12) => {
  const all = UPPER + LOWER + DIGITS + SYMBOLS;
  const chars = [pick(UPPER), pick(LOWER), pick(DIGITS), pick(SYMBOLS)];
  while (chars.length < length) chars.push(pick(all));

  // Fisher-Yates shuffle with a secure RNG
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
};

module.exports = { generateTempPassword };