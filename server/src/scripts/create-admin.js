const bcrypt = require('bcryptjs');
const { connectDB, disconnectDB, getDbState } = require('../config/db');
const User = require('../models/User');

// Usage:  npm run create-admin -- "Your Name" you@example.com "StrongPass123"
//   or:   ADMIN_NAME=.. ADMIN_EMAIL=.. ADMIN_PASSWORD=.. npm run create-admin
// Creates the first admin (or promotes + resets the password of an existing account with that email).
// The first admin of a site automatically becomes the SUPER ADMIN (the one who adds other admins in the panel).
// Add --super to make this account the super admin even if somebody else already is (the old super admin is demoted to a normal admin).
const run = async () => {
  const args = process.argv.slice(2);
  const makeSuper = args.includes('--super');
  const [argName, argEmail, argPassword] = args.filter((a) => a !== '--super');
  const name = (argName || process.env.ADMIN_NAME || 'Admin').trim();
  const email = (argEmail || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = argPassword || process.env.ADMIN_PASSWORD || '';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    console.error('[admin] Please give a valid email.  npm run create-admin -- "Name" email password');
    process.exit(1);
  }
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    console.error('[admin] Password needs 8+ characters with at least one letter and one number.');
    process.exit(1);
  }

  await connectDB();
  if (getDbState() !== 'connected') {
    console.error('[admin] Database not connected. Check MONGODB_URI in server/.env');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await User.findOne({ email });
  const hasSuper = Boolean(await User.exists({ role: 'admin', isSuperAdmin: true, ...(existing ? { _id: { $ne: existing._id } } : {}) }));
  const becomeSuper = makeSuper || !hasSuper;
  if (makeSuper && hasSuper) await User.updateMany({ role: 'admin', isSuperAdmin: true }, { $set: { isSuperAdmin: false } });

  if (existing) {
    existing.set({ role: 'admin', isActive: true, mustChangePassword: false, ...(becomeSuper ? { isSuperAdmin: true } : {}), passwordHash, passwordChangedAt: new Date(Math.floor(Date.now() / 1000) * 1000) });
    await existing.save();
    console.log(`[admin] ${email} is now ${becomeSuper ? 'the SUPER admin' : 'an admin'} (password updated).`);
  } else {
    await User.create({ name, email, passwordHash, role: 'admin', isSuperAdmin: becomeSuper });
    console.log(`[admin] ${becomeSuper ? 'Super admin' : 'Admin'} created: ${email}`);
  }

  await disconnectDB();
};

run().catch((err) => {
  console.error('[admin] failed:', err);
  process.exit(1);
});