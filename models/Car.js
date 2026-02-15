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


// YANGI: Auction Schema
const AuctionSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true,
    trim: true
  },
  link: {
    type: String,
    required: true,
    trim: true
  }

}, { _id: true, timestamps: true });

// YANGI: Auction Schema
const LizingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  }

}, { _id: true, timestamps: true });

// YANGI: Auction Schema
const SudSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  }

}, { _id: true, timestamps: true });

const QidiruvSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  }

}, { _id: true, timestamps: true });

const ZalogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  }

}, { _id: true, timestamps: true });


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
// YANGI: Diagnostic Schema
const DiagnosticSchema = new mongoose.Schema({
  inspectionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  source: {
    type: String,
    required: true,
    trim: true,
    default: 'Партнер'
  },
  mileage: {
    type: Number,
    required: true,
    default: 0
  },
  region: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: true, timestamps: true });

// YANGI: Damage History Schema (DTP uchun)
const DamageHistorySchema = new mongoose.Schema({
  damageDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  damageType: {
    type: String,
    required: true,
    default: 'ДТП'
  },
  daraja: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: '',
    trim: true
  },
  qatnashchi: {
    type: String,
    default: '',
    trim: true
  },
  rasxot_remont: {
    type: Number,
    default: 0
  },
  rasxot_kuzup: {
    type: Number,
    default: 0
  },
  damageImage: {
    type: String,
    default: '',
    trim: true
  },

  
}, { _id: true, timestamps: true });



const HistoryEventSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },  
  image: {
    type: String,
    trim: true,
    default: ''
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: true, timestamps: true });


const ShtrafEventSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },  
  image: {
    type: String,
    trim: true,
    default: ''
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: true, timestamps: true });
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
  auctionHistory: {
    type: [AuctionSchema],
    default: []
  },
  diagnosticHistory: {
    type: [DiagnosticSchema],
    default: []
  }, 
  damageHistory: {
    type: [DamageHistorySchema],
    default: []
  },
  LizingHistory:{
    type: [LizingSchema],
    default: []
  },
    SudHistory:{
    type: [SudSchema],
    default: []
  },
    QidiruvHistory:{
    type: [QidiruvSchema],
    default: []
  },
    ZalogHistory:{
    type: [ZalogSchema],
    default: []
  },
  historyEvents: {
  type: [HistoryEventSchema],
  default: []
},
shtrafEvents: {
  type: [ShtrafEventSchema],
  default: []
}
}, { timestamps: true });













module.exports = mongoose.model('Car', CarSchema);
