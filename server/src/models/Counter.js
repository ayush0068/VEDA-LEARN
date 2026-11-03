const mongoose = require('mongoose');

/** Tiny atomic counters (used for student ids like VD-2026-001: one counter per year). */
const counterSchema = new mongoose.Schema({
  _id: { type: String },
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.models.Counter || mongoose.model('Counter', counterSchema);