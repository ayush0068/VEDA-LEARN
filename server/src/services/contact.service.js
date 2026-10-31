const ContactMessage = require('../models/ContactMessage');

const createContactMessage = async ({ name, email, queryType, message }) =>
  ContactMessage.create({ name, email, queryType, message });

module.exports = { createContactMessage };