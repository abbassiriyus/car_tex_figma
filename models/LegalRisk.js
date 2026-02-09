const mongoose = require('mongoose');

const LegalRiskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  text: { type: String, required: true, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('LegalRisk', LegalRiskSchema);
