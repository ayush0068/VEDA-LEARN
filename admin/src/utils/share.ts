import { env } from '@/config/env';

export const loginUrl = `${env.siteUrl}/login`;

/** The message the admin sends to the student (WhatsApp / mail app / clipboard). */
export const buildShareMessage = ({ name, email, password }: { name: string; email: string; password: string }): string =>
  [
    `Namaste ${name},`,
    '',
    'Your VedaLearn student account is ready.',
    '',
    `Login: ${loginUrl}`,
    `Email: ${email}`,
    `Temporary password: ${password}`,
    '',
    'You will be asked to set your own new password the first time you sign in.',
    '',
    'Team VedaLearn',
  ].join('\n');

/** wa.me needs the number with country code and no symbols. A plain 10-digit number is treated as Indian (+91). */
export const whatsappNumber = (phone: string): string => {
  const trimmed = phone.trim();
  let digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  else if (!trimmed.startsWith('+')) {
    if (digits.length === 10) digits = `91${digits}`;
    else if (digits.length === 11 && digits.startsWith('0')) digits = `91${digits.slice(1)}`;
  }
  return digits;
};

/** Opens WhatsApp with the message ready. Without a phone number WhatsApp lets the admin pick the contact. */
export const whatsappLink = (phone: string, text: string): string => {
  const number = whatsappNumber(phone);
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
};

export const mailtoLink = (email: string, text: string): string =>
  `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('Your VedaLearn login details')}&body=${encodeURIComponent(text)}`;

export const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // older browsers / http: fall back to a hidden textarea
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
};