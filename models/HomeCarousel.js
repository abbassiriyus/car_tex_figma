const mongoose = require('mongoose');

const HomeCarouselSchema = new mongoose.Schema({
  image: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
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
  },
  order: {
    type: Number,
    default: 0 // default tartib
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('HomeCarousel', HomeCarouselSchema);
