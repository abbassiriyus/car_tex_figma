const mongoose = require('mongoose');

const OtchotSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true 
  },       // Hisobot nomi

  icon: { 
    type: String, 
    default: '' 
  },       // Icon uchun URL yoki fayl yo‘l

  order: { 
    type: Number, 
    default: 0, 
    required: true 
  },       // Tartib raqami (sort qilish uchun)

}, { 
  timestamps: true 
});

// Agar har bir otchot uchun order unikalligi kerak bo‘lsa (masalan, bir xil order bo‘lmasin)
OtchotSchema.index({ order: 1 }, { unique: false }); // unique: true qilish ham mumkin

module.exports = mongoose.model('Otchot', OtchotSchema);