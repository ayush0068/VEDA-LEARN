const { env } = require('../config/env');
const ApiError = require('../utils/ApiError');

const isMailConfigured = () => Boolean(env.smtp.host && env.smtp.user && env.smtp.pass && env.smtp.from);

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  let nodemailer;
  try {
    // loaded lazily so the API still starts when the package has not been installed yet
    nodemailer = require('nodemailer');
  } catch {
    throw new ApiError(503, 'Email sending is not installed on the server (run "npm install" in server/)');
  }

  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: { user: env.smtp.user, pass: env.smtp.pass },
  });
  return transporter;
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

/** Sends the login details of a new / reset student account. */
const sendCredentialsEmail = async ({ to, name, password }) => {
  if (!isMailConfigured()) {
    throw new ApiError(503, 'Email is not configured on the server (set SMTP_* in server/.env)');
  }

  const loginUrl = `${env.publicSiteUrl}/login`;

  const text = [
    `Namaste ${name},`,
    '',
    'Your VedaLearn student account is ready.',
    '',
    `Login: ${loginUrl}`,
    `Email: ${to}`,
    `Temporary password: ${password}`,
    '',
    'You will be asked to set your own new password the first time you sign in.',
    '',
    'Team VedaLearn',
  ].join('\n');

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#fbf1dd;padding:24px">
    <div style="max-width:480px;margin:auto;background:#fffaf0;border:1px solid #f0ddbf;border-radius:16px;padding:28px;color:#4b4036">
      <h2 style="margin:0 0 4px;font-family:Georgia,serif;color:#5a2d0f">VedaLearn</h2>
      <p style="margin:0 0 18px;color:#7c6a58;font-size:13px">Ancient Wisdom. Online, For You.</p>
      <p>Namaste ${escapeHtml(name)},</p>
      <p>Your student account is ready. Use these details to sign in:</p>
      <table style="width:100%;border-collapse:collapse;margin:14px 0;font-size:14px">
        <tr><td style="padding:8px 0;color:#7c6a58">Email</td><td style="padding:8px 0;text-align:right"><b>${escapeHtml(to)}</b></td></tr>
        <tr><td style="padding:8px 0;color:#7c6a58">Temporary password</td><td style="padding:8px 0;text-align:right"><b style="font-family:Consolas,monospace;font-size:16px;background:#fbe6cb;padding:3px 8px;border-radius:6px">${escapeHtml(password)}</b></td></tr>
      </table>
      <p style="text-align:center;margin:22px 0"><a href="${escapeHtml(loginUrl)}" style="background:#7a3e14;color:#fffaf0;text-decoration:none;padding:12px 26px;border-radius:10px;font-weight:bold;display:inline-block">Sign in to VedaLearn</a></p>
      <p style="font-size:13px;color:#7c6a58">For your safety you will be asked to choose a new password the first time you sign in.</p>
    </div>
  </div>`;

  await getTransporter().sendMail({
    from: env.smtp.from,
    to,
    subject: 'Your VedaLearn login details',
    text,
    html,
  });
};

module.exports = { isMailConfigured, sendCredentialsEmail };