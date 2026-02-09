const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  verifyCode: {
    type: String,
    required: true
  }
}, {
  timestamps: true   // createdAt & updatedAt avtomatik
});

module.exports = mongoose.model('User', UserSchema);