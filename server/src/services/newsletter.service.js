const Subscriber = require('../models/Subscriber');

/**
 * Idempotent subscribe. Returns true when the email is new, false when it already existed.
 * (upsert avoids duplicate-key errors when two requests race.)
 */
const subscribeEmail = async (email, source = 'footer') => {
  const result = await Subscriber.updateOne(
    { email },
    { $setOnInsert: { email, source, isActive: true } },
    { upsert: true },
  );
  return result.upsertedCount > 0;
};

module.exports = { subscribeEmail };