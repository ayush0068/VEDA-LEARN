// Checks the SMTP settings in server/.env and sends a test email.
// Usage:  npm run test-mail -- you@example.com
const { env } = require('../config/env');

const to = process.argv[2];

const run = async () => {
  const { host, port, secure, user, pass, from } = env.smtp;

  const missing = [
    ['SMTP_HOST', host],
    ['SMTP_USER', user],
    ['SMTP_PASS', pass],
    ['MAIL_FROM', from],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);

  if (missing.length) {
    console.error(`[mail] Missing in server/.env: ${missing.join(', ')}`);
    process.exit(1);
  }
  if (!to) {
    console.error('[mail] Give the address to send the test to:  npm run test-mail -- you@example.com');
    process.exit(1);
  }

  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });

  console.log(`[mail] Connecting to ${host}:${port} (secure=${secure}) as ${user} ...`);
  await transporter.verify();
  console.log('[mail] Login OK. Sending a test email ...');

  const info = await transporter.sendMail({
    from,
    to,
    subject: 'VedaLearn email test',
    text: 'If you can read this, the VedaLearn server can send emails.',
  });
  console.log(`[mail] Sent to ${to} (id ${info.messageId}). Check the inbox (and the spam folder).`);
};

run().catch((err) => {
  console.error('[mail] FAILED:', err.message);
  if (/Invalid login|Username and Password not accepted|535/i.test(err.message)) {
    console.error('[mail] Hint: for Gmail use an "App password" (not your normal password), without spaces.');
  }
  if (/ETIMEDOUT|ECONNREFUSED|ENOTFOUND|ESOCKET/i.test(err.message)) {
    console.error('[mail] Hint: check SMTP_HOST / SMTP_PORT, and that your network or host does not block SMTP ports.');
  }
  process.exit(1);
});