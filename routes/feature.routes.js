const express = require('express');
const mongoose = require('mongoose');
const upload = require('../middlewares/upload');
const Feature = require('../models/Feature');
const { deleteImage, getImageUrl } = require('../controllers/imageController');

const router = express.Router();

// CREATE
router.post('/',
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file || !req.body.title) {
        return res.status(400).json({ success: false, message: 'Title va rasm majburiy' });
      }

      const image = getImageUrl(req, req.file);

      const data = await Feature.create({
        title: req.body.title,
        image
      });

      res.status(201).json({ success: true, data });

    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// GET ALL
router.get('/', async (req, res) => {
  try {
    const data = await Feature.find().sort({ createdAt: -1 });
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE
router.put('/:id',
  upload.single('image'),
  async (req, res) => {
    try {
      const data = await Feature.findById(req.params.id);
      if (!data) return res.status(404).json({ success: false, message: 'Topilmadi' });

      if (req.file) {
        deleteImage(data.image);
        data.image = getImageUrl(req, req.file);
      }

      if (req.body.title) {
        data.title = req.body.title;
      }

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
    const data = await Feature.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Topilmadi' });

    deleteImage(data.image);
    await data.deleteOne();

    res.json({ success: true, message: 'O‘chirildi' });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
