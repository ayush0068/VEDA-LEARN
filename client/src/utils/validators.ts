// Same rules as server/src/controllers/auth.controller.js
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const nameError = (value: string): string => {
  const name = value.trim().replace(/\s+/g, ' ');
  if (!name) return 'Please enter your full name';
  if (name.length < 2) return 'Name must be at least 2 characters';
  if (name.length > 60) return 'Name is too long (max 60 characters)';
  return '';
};

export const emailError = (value: string): string => {
  const email = value.trim();
  if (!email) return 'Please enter your email address';
  if (email.length > 254 || !EMAIL_RE.test(email)) return 'Please enter a valid email address';
  return '';
};

/** Rules used when creating a password (sign-up). */
export const newPasswordError = (value: string): string => {
  if (!value) return 'Please create a password';
  if (value.length < 8) return 'Password must be at least 8 characters';
  if (new TextEncoder().encode(value).length > 72) return 'Password is too long (max 72 characters)';
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Use at least one letter and one number';
  return '';
};