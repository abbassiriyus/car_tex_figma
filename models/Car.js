const mongoose = require('mongoose');
const ValuationSchema = new mongoose.Schema({
  valuationLow: {
    type: Number,
    default: 0
  },
  valuationRangeLow: {
    type: Number,
    default: 0
  },
  valuationRangeHigh: {
    type: Number,
    default: 0
  },
  valuationHigh: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'UZS',
    enum: ['UZS', 'USD']  // faqat UZS va USD ga ruxsat beriladi
  }
}, { _id: false });
const SaleHistorySchema = new mongoose.Schema({
  saleDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  price: {
    type: Number,
    required: true
  },
  priceDrop: {                // Agar narx tushgan bo‘lsa
    type: Number,
    default: 0
  },
  probeg: {                // Agar narx tushgan bo‘lsa
    type: Number,
    default: 0
  },
  title: {
    type: String,
    required: true
  },

  holati: {                // ixtiyoriy
    type: String,
    trim: true
  },

  region: {
    type: String,
    trim: true
  },
  link: {                     // OLX/auction havolasi (ixtiyoriy)
    type: String,
    trim: true
  }
}, { _id: true, timestamps: true });

const CarLegalRiskSchema = new mongoose.Schema({
  riskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LegalRisk',
    required: true
  },
  position: {
    type: Number, // 1 = qizil, 2 = sariq, 3 = ko‘k

    required: true
  }
}, { _id: false });
const CarImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  label: { type: String, default: '' },        // Masalan: "Царапины"
  isDamaged: { type: Boolean, default: false } // Filter uchun
}, { _id: false });
const CarProbegSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true
  },
  kilometer: {
    type: Number,
    required: true
  }
}, { _id: true, timestamps: true });
const CarOtchotSchema = new mongoose.Schema({
  otchotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Otchot',
    required: true
  },
  position: {
    type: Number,
    required: true
  },
  text: {
    type: String,
    trim: true,
    default: ''
  }
}, { _id: false });

const CarExploitationSchema = new mongoose.Schema({
  
  startDate: {
    type: Date,
    required: true
  },

  endDate: {
    type: Date,
    default: null
  },

  startKilometer: {
    type: Number,
    default: 0
  },

  endKilometer: {
    type: Number,
    default: 0
  },

  title: {
    type: String,
    required: true
  },

  description: {
    type: String,
    default: ''
  },

  location: {
    type: String,
    default: ''
  }

}, { timestamps: true });
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
    enum: [1, 2, 3, 4],
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
  },

  otchots: {
    type: [CarOtchotSchema],
    default: []
  },
  probegHistory: {
  type: [CarProbegSchema],
  default: []
},
  salesHistory: {
    type: [SaleHistorySchema],
    default: []
  },
  // ← Yangi qo‘shilgan baho maydoni
  valuation: {
    type: ValuationSchema,
    default: () => ({})  // yangi mashina yaratilganda bo‘sh obyekt bo‘ladi
  },
  exploitationHistory: {
  type: [CarExploitationSchema],
  default: []
},


}, { timestamps: true });



module.exports = mongoose.model('Car', CarSchema);
