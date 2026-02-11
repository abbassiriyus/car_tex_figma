const mongoose = require('mongoose');



const CarLegalRiskSchema = new mongoose.Schema({
  riskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LegalRisk',
    required: true
  },
  position: {
    type: Number, // 1 = qizil, 2 = sariq, 3 = ko‘k
    enum: [1,2,3],
    required: true
  }
}, { _id: false });
const CarImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  label: { type: String, default: '' },        // Masalan: "Царапины"
  isDamaged: { type: Boolean, default: false } // Filter uchun
}, { _id: false });
const CarFeatureSchema = new mongoose.Schema({
  featureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feature',
    required: true
  },
  text: {
    type: String,
    trim: true
  }, 
   position: {
    type: Number,
    enum: [1,2,3,4],
    trim: true
  }
}, { _id: false });
const CarSchema = new mongoose.Schema({
  vin: { type: String, required: true, unique: true },
  gosNumber: { type: String, required: true },

  extraGosNumber: {
    type: [String],
    default: []
  },

  engineNumber: { type: String, required: true },
  stsNumber: { type: String, required: true },
  carType: { type: String, required: true },
  color: { type: String, required: true },
  engine: { type: String, required: true },
  carName: { type: String, required: true },

  images: {
    type: [CarImageSchema],
    default: []
  },

  features: {
    type: [CarFeatureSchema],
    default: []
  },

  legalRisks: {
    type: [CarLegalRiskSchema],
    default: []
  }

}, { timestamps: true });


module.exports = mongoose.model('Car', CarSchema);
