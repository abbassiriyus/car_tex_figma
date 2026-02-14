const express = require('express');
const router = express.Router();
const Otchot = require('../models/Otchot');
const upload = require('../middlewares/upload');
const { getImageUrl, deleteImage } = require('../controllers/imageController');

// Helper
const errorResponse = (res, status, message) => {
  return res.status(status).json({ success: false, message });
};

// CREATE
router.post('/', upload.single('icon'), async (req, res) => {
  try {
    if (!req.body.title) {
      return errorResponse(res, 400, 'Title majburiy');
    }

    let iconUrl = '';
    if (req.file) {
      iconUrl = getImageUrl(req, req.file);
    }

    // Eng oxirgi order ni topib, +1 qilamiz (yangi element oxiriga qo‘shiladi)
    const lastOtchot = await Otchot.findOne().sort({ order: -1 });
    const nextOrder = lastOtchot ? lastOtchot.order + 1 : 0;

    const otchot = await Otchot.create({
      title: req.body.title,
      icon: iconUrl,
      order: nextOrder,           // ← yangi qo‘shildi
    });

    res.status(201).json({ success: true, data: otchot });
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
});

// READ ALL — order bo‘yicha sort qilamiz (eng muhimi shu)
router.get('/', async (req, res) => {
  try {
    const otchots = await Otchot.find()
      .sort({ order: 1 })           // ← 0, 1, 2 ... tartibda
      // .sort({ createdAt: -1 })   // agar xohlasangiz createdAt bo‘yicha qoldirishingiz mumkin
      .select('title icon order createdAt'); // faqat kerakli maydonlarni qaytarish

    res.json({
      success: true,
      count: otchots.length,
      data: otchots,
    });
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
});

// READ ONE
router.get('/:id', async (req, res) => {
  try {
    const otchot = await Otchot.findById(req.params.id);
    if (!otchot) return errorResponse(res, 404, 'Topilmadi');

    res.json({ success: true, data: otchot });
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
});

// UPDATE (title va icon + order ham yangilanishi mumkin)
router.put('/:id', upload.single('icon'), async (req, res) => {
  try {
    const otchot = await Otchot.findById(req.params.id);
    if (!otchot) return errorResponse(res, 404, 'Topilmadi');

    // title
    if (req.body.title !== undefined) {
      otchot.title = req.body.title;
    }

    // icon
    if (req.file) {
      if (otchot.icon) await deleteImage(otchot.icon);
      otchot.icon = getImageUrl(req, req.file);
    }

    // order — agar frontenddan kelgan bo‘lsa yangilaymiz
    if (req.body.order !== undefined) {
      otchot.order = Number(req.body.order);
    }

    await otchot.save();

    res.json({ success: true, message: 'Yangilandi', data: otchot });
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const otchot = await Otchot.findById(req.params.id);
    if (!otchot) return errorResponse(res, 404, 'Topilmadi');

    if (otchot.icon) await deleteImage(otchot.icon);

    await otchot.deleteOne();

    // Agar xohlasangiz, qolgan elementlarning orderlarini to‘g‘rilash mumkin
    // lekin ko‘pincha bunga hojat yo‘q — keyingi tartiblashda hammasi joyiga tushadi

    res.json({ success: true, message: 'O‘chirildi' });
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
});

// Qo‘shimcha: bir nechta otchotning orderini bir vaqtda yangilash (drag & drop uchun juda qulay)
router.put('/reorder', async (req, res) => {
  try {
    const { items } = req.body; // [{ _id: "...", order: 0 }, { _id: "...", order: 1 }, ...]

    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse(res, 400, 'Items array kelmadi');
    }

    // bulkWrite bilan tez yangilash
    const operations = items.map(item => ({
      updateOne: {
        filter: { _id: item._id },
        update: { $set: { order: Number(item.order) } },
      },
    }));

    await Otchot.bulkWrite(operations);

    res.json({ success: true, message: 'Tartib yangilandi' });
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
});

module.exports = router;