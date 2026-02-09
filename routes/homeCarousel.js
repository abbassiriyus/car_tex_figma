const express = require('express');
const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const router = express.Router();
const upload = require('../middlewares/upload');
const { deleteImage, getImageUrl } = require('../controllers/imageController');
const HomeCarousel = require('../models/HomeCarousel');

// Helper: error response
const errorResponse = (res, status, message) => {
  return res.status(status).json({ success: false, message });
};

// CREATE
router.post('/',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'icon', maxCount: 1 }
  ]),

  async (req, res) => {
    try {
      if (!req.files?.image || !req.files?.icon) {
        return res.status(400).json({ success: false, message: 'Rasm va icon majburiy' });
      }

      const image = getImageUrl(req, req.files.image[0]);
      const icon = getImageUrl(req, req.files.icon[0]);

      const { title, text } = req.body;

      const carousel = await HomeCarousel.create({
        image,
        icon,
        title,
        text
      });

      res.status(201).json({ success: true, data: carousel });

    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);


// GET ALL
router.get('/', async (req, res) => {
  try {
    const data = await HomeCarousel.find().sort({ createdAt: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
});

// GET ONE
router.get('/:id',
  param('id').custom(v => mongoose.Types.ObjectId.isValid(v)).withMessage('Noto‘g‘ri ID'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
      const data = await HomeCarousel.findById(req.params.id);
      if (!data) return errorResponse(res, 404, 'Topilmadi');

      res.json({ success: true, data });
    } catch (err) {
      errorResponse(res, 500, err.message);
    }
  }
);

// UPDATE
router.put('/:id',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'icon', maxCount: 1 }
  ]),

  async (req, res) => {
    try {
      const data = await HomeCarousel.findById(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: 'Topilmadi' });

      let image = data.image;
      let icon = data.icon;

      if (req.files?.image) {
        deleteImage(data.image);
        image = getImageUrl(req, req.files.image[0]);
      }

      if (req.files?.icon) {
        deleteImage(data.icon);
        icon = getImageUrl(req, req.files.icon[0]);
      }

      data.image = image;
      data.icon = icon;
      data.title = req.body.title ?? data.title;
      data.text = req.body.text ?? data.text;

      await data.save();

      res.json({ success: true, message: 'Yangilandi', data });

    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);


// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const data = await HomeCarousel.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Topilmadi' });

    deleteImage(data.image);
    deleteImage(data.icon);

    await data.deleteOne();

    res.json({ success: true, message: 'O‘chirildi' });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;
