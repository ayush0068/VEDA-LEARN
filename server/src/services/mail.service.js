const path = require('path');
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
const sendCredentialsEmail = async ({ to, name, password, accountType = 'student' }) => {
  if (!isMailConfigured()) {
    throw new ApiError(503, 'Email is not configured on the server (set SMTP_* in server/.env)');
  }

  const loginUrl = `${accountType === 'admin' && env.publicAdminUrl ? env.publicAdminUrl : env.publicSiteUrl}/login`;
  const safeName = escapeHtml(name);

  const text = [
    `Namaste ${name},`,
    '',
    `Your VedaLearn ${accountType} account has been created by the VedaLearn team.`,
    '',
    `Sign in: ${loginUrl}`,
    `Email: ${to}`,
    `Temporary password: ${password}`,
    '',
    'You will be asked to set your own new password the first time you sign in.',
    '',
    'If you were not expecting this email, you can safely ignore it.',
    '',
    'Team VedaLearn',
  ].join('\n');

  // The banner is attached inline (cid) so it shows up without the reader having to "load images"
  const html = `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#fbf1dd">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf1dd;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fffaf0;border:1px solid #f0ddbf;border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#4b4036">
        <tr><td style="padding:0;line-height:0">
          <img src="cid:vedalearn-header" width="520" alt="VedaLearn - Ancient Wisdom. Online, For You." style="display:block;width:100%;max-width:520px;height:auto;border:0">
        </td></tr>
        <tr><td style="padding:26px 28px 8px;font-size:15px;line-height:1.55">
          <p style="margin:0 0 12px">Namaste ${safeName},</p>
          <p style="margin:0">Your VedaLearn ${escapeHtml(accountType)} account has been created by the VedaLearn team. Use the details below to sign in.</p>
        </td></tr>
        <tr><td style="padding:12px 28px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #f0ddbf;border-radius:12px">
            <tr><td style="padding:12px 16px;font-size:13px;color:#7c6a58">Email</td><td align="right" style="padding:12px 16px;font-size:14px;font-weight:bold;color:#3e1f0b">${escapeHtml(to)}</td></tr>
            <tr><td style="padding:0 16px 14px;font-size:13px;color:#7c6a58">Temporary password</td><td align="right" style="padding:0 16px 14px"><span style="display:inline-block;background:#fbe6cb;border-radius:6px;padding:5px 10px;font-family:Consolas,Menlo,monospace;font-size:16px;font-weight:bold;color:#3e1f0b">${escapeHtml(password)}</span></td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding:14px 28px 6px">
          <a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:#7a3e14;color:#fffaf0;text-decoration:none;font-weight:bold;font-size:15px;padding:13px 30px;border-radius:10px">Sign in to VedaLearn</a>
        </td></tr>
        <tr><td style="padding:14px 28px 26px;font-size:12.5px;line-height:1.5;color:#7c6a58">
          For your safety you will be asked to choose your own password the first time you sign in.<br>
          If you were not expecting this email, you can safely ignore it.
        </td></tr>
        <tr><td style="background:#f8e4c9;padding:14px 28px;font-size:12px;color:#7c6a58;text-align:center">
          VedaLearn · Ancient Wisdom. Online, For You.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await getTransporter().sendMail({
    from: env.smtp.from,
    to,
    replyTo: env.smtp.from,
    subject: `Your VedaLearn ${accountType} account is ready`,
    text,
    html,
    attachments: [
      {
        filename: 'vedalearn-header.jpg',
        path: path.join(__dirname, '../assets/email-header.jpg'),
        cid: 'vedalearn-header',
        contentDisposition: 'inline',
      },
    ],
  });
};

module.exports = { isMailConfigured, sendCredentialsEmail };