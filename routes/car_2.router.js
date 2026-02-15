const express = require('express');
const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const router = express.Router();


const upload = require('../middlewares/upload');
const { deleteImage, getImageUrl } = require('../controllers/imageController');
const Car = require('../models/Car');

// Helper
const errorResponse = (res, status, message) => {
  return res.status(status).json({ success: false, message });
};



// =============================================
// POST /api/cars/:carId/auction-history
// Yangi auction havolasi + rasm yuklash
// =============================================
router.post('/:carId/auction-history',
  upload.single('image'),  // ← sizning middleware'ingiz (multer)
  async (req, res) => {
    try {
      const { carId } = req.params;
      const { link } = req.body;  // link majburiy, rasm ixtiyoriy

      if (!mongoose.Types.ObjectId.isValid(carId)) {
        return res.status(400).json({ success: false, message: 'Noto‘g‘ri car ID' });
      }

      if (!link) {
        return res.status(400).json({
          success: false,
          message: 'link maydoni majburiy'
        });
      }

      const car = await Car.findById(carId);
      if (!car) {
        return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
      }

      let imageUrl = '';
      if (req.file) {
        imageUrl = getImageUrl(req, req.file);  // ← sizning funksiyangiz
      }

      // Yangi yozuv
      const newAuction = {
        image: imageUrl,
        link: link.trim()
      };

      car.auctionHistory.push(newAuction);
      await car.save();

      // Oxirgi qo‘shilgan element
      const created = car.auctionHistory[car.auctionHistory.length - 1];

      res.status(201).json({
        success: true,
        message: 'Auction havolasi qo‘shildi',
        data: {
          _id: created._id.toString(),
          image: created.image || '',
          link: created.link,
          createdAt: created.createdAt?.toISOString() || null,
          updatedAt: created.updatedAt?.toISOString() || null
        }
      });

    } catch (err) {
      // Agar rasm yuklangan bo‘lsa, lekin saqlashda xato chiqsa — rasmni o‘chirish
      if (req.file && req.file.filename) {
        deleteImage(getImageUrl(req, req.file));  // ← xavfsizlik uchun
      }
      console.error('POST auction-history xatosi:', err);
      res.status(500).json({ success: false, message: 'Server xatosi: ' + err.message });
    }
  }
);

// =============================================
// PUT /api/cars/:carId/auction-history/:auctionId
// Mavjud auction yozuvini yangilash (rasm + link)
// =============================================
router.put('/:carId/auction-history/:auctionId',
  upload.single('image'),  // ← yangi rasm yuklash ixtiyoriy
  async (req, res) => {
    try {
      const { carId, auctionId } = req.params;
      const { link } = req.body;

      if (!mongoose.Types.ObjectId.isValid(carId) || !mongoose.Types.ObjectId.isValid(auctionId)) {
        return res.status(400).json({ success: false, message: 'Noto‘g‘ri ID' });
      }

      const car = await Car.findById(carId);
      if (!car) {
        return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
      }

      const auction = car.auctionHistory.id(auctionId);
      if (!auction) {
        return res.status(404).json({ success: false, message: 'Auction yozuvi topilmadi' });
      }

      // Eski rasmni o‘chirish (agar yangisi yuklansa)
      let oldImageUrl = auction.image;
      if (req.file) {
        const newImageUrl = getImageUrl(req, req.file);
        auction.image = newImageUrl;

        // Eski rasm mavjud bo‘lsa o‘chirish
        if (oldImageUrl) {
          deleteImage(oldImageUrl);
        }
      }

      // Link yangilash (agar kelsa)
      if (link !== undefined) {
        auction.link = link.trim();
      }

      await car.save();

      res.json({
        success: true,
        message: 'Auction yozuvi yangilandi',
        data: {
          _id: auction._id.toString(),
          image: auction.image || '',
          link: auction.link,
          createdAt: auction.createdAt?.toISOString() || null,
          updatedAt: auction.updatedAt?.toISOString() || null
        }
      });

    } catch (err) {
      // Xato bo‘lsa yangi yuklangan rasmni o‘chirish
      if (req.file && req.file.filename) {
        deleteImage(getImageUrl(req, req.file));
      }
      console.error('PUT auction-history xatosi:', err);
      res.status(500).json({ success: false, message: 'Server xatosi: ' + err.message });
    }
  }
);

// =============================================
// DELETE /api/cars/:carId/auction-history/:auctionId
// Auction yozuvini o‘chirish + rasmni serverdan tozalash
// =============================================
router.delete('/:carId/auction-history/:auctionId', async (req, res) => {
  try {
    const { carId, auctionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(carId) || !mongoose.Types.ObjectId.isValid(auctionId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri ID' });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const auction = car.auctionHistory.id(auctionId);
    if (!auction) {
      return res.status(404).json({ success: false, message: 'Auction yozuvi topilmadi' });
    }

    // Rasm mavjud bo‘lsa serverdan o‘chirish
    if (auction.image) {
      deleteImage(auction.image);
    }

    car.auctionHistory.pull(auctionId);
    await car.save();

    res.json({
      success: true,
      message: 'Auction yozuvi o‘chirildi',
      remaining: car.auctionHistory.length
    });

  } catch (err) {
    console.error('DELETE auction-history xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: ' + err.message });
  }
});


// =============================================
// POST /api/cars/:carId/diagnostic-history
// Yangi diagnostika yozuvini qo‘shish
// =============================================
router.post('/:carId/diagnostic-history', async (req, res) => {
  try {
    const { carId } = req.params;
    const {
      inspectionDate,
      source = 'Партнер',
      mileage,
      region
    } = req.body;

    // Validatsiya
    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri car ID' });
    }

    if (!inspectionDate || !mileage || !region) {
      return res.status(400).json({
        success: false,
        message: 'inspectionDate, mileage va region majburiy maydonlar'
      });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    // Yangi yozuv
    const newDiagnostic = {
      inspectionDate: new Date(inspectionDate),
      source: source.trim(),
      mileage: Number(mileage),
      region: region.trim()
    };

    car.diagnosticHistory.push(newDiagnostic);
    await car.save();

    // Oxirgi qo‘shilgan yozuvni qaytarish
    const created = car.diagnosticHistory[car.diagnosticHistory.length - 1];

    res.status(201).json({
      success: true,
      message: 'Diagnostika yozuvi qo‘shildi',
      data: {
        _id: created._id.toString(),
        inspectionDate: created.inspectionDate?.toISOString() || null,
        source: created.source,
        mileage: created.mileage,
        region: created.region,
        createdAt: created.createdAt?.toISOString() || null,
        updatedAt: created.updatedAt?.toISOString() || null
      }
    });

  } catch (err) {
    console.error('POST diagnostic-history xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: ' + err.message });
  }
});

// =============================================
// PUT /api/cars/:carId/diagnostic-history/:diagnosticId
// Mavjud diagnostika yozuvini yangilash
// =============================================
router.put('/:carId/diagnostic-history/:diagnosticId', async (req, res) => {
  try {
    const { carId, diagnosticId } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(carId) || !mongoose.Types.ObjectId.isValid(diagnosticId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri ID' });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const diagnostic = car.diagnosticHistory.id(diagnosticId);
    if (!diagnostic) {
      return res.status(404).json({ success: false, message: 'Diagnostika yozuvi topilmadi' });
    }

    // Faqat kelgan maydonlarni yangilash
    if (updateData.inspectionDate !== undefined) {
      diagnostic.inspectionDate = new Date(updateData.inspectionDate);
    }
    if (updateData.source !== undefined) {
      diagnostic.source = updateData.source.trim();
    }
    if (updateData.mileage !== undefined) {
      diagnostic.mileage = Number(updateData.mileage);
    }
    if (updateData.region !== undefined) {
      diagnostic.region = updateData.region.trim();
    }

    await car.save();

    res.json({
      success: true,
      message: 'Diagnostika yozuvi yangilandi',
      data: {
        _id: diagnostic._id.toString(),
        inspectionDate: diagnostic.inspectionDate?.toISOString() || null,
        source: diagnostic.source,
        mileage: diagnostic.mileage,
        region: diagnostic.region,
        createdAt: diagnostic.createdAt?.toISOString() || null,
        updatedAt: diagnostic.updatedAt?.toISOString() || null
      }
    });

  } catch (err) {
    console.error('PUT diagnostic-history xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: ' + err.message });
  }
});

// =============================================
// DELETE /api/cars/:carId/diagnostic-history/:diagnosticId
// Diagnostika yozuvini o‘chirish
// =============================================
router.delete('/:carId/diagnostic-history/:diagnosticId', async (req, res) => {
  try {
    const { carId, diagnosticId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(carId) || !mongoose.Types.ObjectId.isValid(diagnosticId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri ID' });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const exists = car.diagnosticHistory.id(diagnosticId);
    if (!exists) {
      return res.status(404).json({ success: false, message: 'Diagnostika yozuvi topilmadi' });
    }

    car.diagnosticHistory.pull(diagnosticId);
    await car.save();

    res.json({
      success: true,
      message: 'Diagnostika yozuvi o‘chirildi',
      remaining: car.diagnosticHistory.length
    });

  } catch (err) {
    console.error('DELETE diagnostic-history xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: ' + err.message });
  }
});

// =============================================
// GET /api/cars/:carId/diagnostic-history
// Barcha diagnostika yozuvlarini olish
// =============================================
router.get('/:carId/diagnostic-history', async (req, res) => {
  try {
    const { carId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri car ID' });
    }

    const car = await Car.findById(carId)
      .select('diagnosticHistory')
      .lean();

    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    // Eng yangisi birinchi bo‘lishi uchun sort (inspectionDate bo‘yicha)
    const history = (car.diagnosticHistory || [])
      .sort((a, b) => new Date(b.inspectionDate) - new Date(a.inspectionDate))
      .map(item => ({
        _id: item._id.toString(),
        inspectionDate: item.inspectionDate?.toISOString() || null,
        source: item.source || '',
        mileage: item.mileage || 0,
        region: item.region || '',
        createdAt: item.createdAt?.toISOString() || null,
        updatedAt: item.updatedAt?.toISOString() || null
      }));

    res.json({
      success: true,
      count: history.length,
      data: history
    });

  } catch (err) {
    console.error('GET diagnostic-history xatosi:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// =============================================
// POST /api/cars/:carId/damage-history
// Yangi zarar/DTP yozuvini qo‘shish (rasm ixtiyoriy)
// =============================================
router.post('/:carId/damage-history',
  upload.single('damageImage'),  // ← rasm yuklash ixtiyoriy
  async (req, res) => {
    try {
      const { carId } = req.params;
      const {
        damageDate,
        damageType = 'ДТП',
        daraja = '',
        location = '',
        qatnashchi = '',
        rasxot_remont = 0,
        rasxot_kuzup = 0
      } = req.body;

      // Validatsiya
      if (!mongoose.Types.ObjectId.isValid(carId)) {
        return res.status(400).json({ success: false, message: 'Noto‘g‘ri car ID' });
      }

      if (!damageDate || !damageType) {
        return res.status(400).json({
          success: false,
          message: 'damageDate va damageType majburiy maydonlar'
        });
      }

      const car = await Car.findById(carId);
      if (!car) {
        return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
      }

      let imageUrl = '';
      if (req.file) {
        imageUrl = getImageUrl(req, req.file);  // ← sizning funksiyangiz
      }

      // Yangi yozuv
      const newDamage = {
        damageDate: new Date(damageDate),
        damageType: damageType.trim(),
        daraja: daraja.trim(),
        location: location.trim(),
        qatnashchi: qatnashchi.trim(),
        rasxot_remont: Number(rasxot_remont),
        rasxot_kuzup: Number(rasxot_kuzup),
        damageImage: imageUrl
      };

      car.damageHistory.push(newDamage);
      await car.save();

      // Oxirgi qo‘shilgan yozuv
      const created = car.damageHistory[car.damageHistory.length - 1];

      res.status(201).json({
        success: true,
        message: 'Zarar/DTP yozuvi qo‘shildi',
        data: {
          _id: created._id.toString(),
          damageDate: created.damageDate?.toISOString() || null,
          damageType: created.damageType,
          daraja: created.daraja || '',
          location: created.location || '',
          qatnashchi: created.qatnashchi || '',
          rasxot_remont: created.rasxot_remont || 0,
          rasxot_kuzup: created.rasxot_kuzup || 0,
          damageImage: created.damageImage || '',
          createdAt: created.createdAt?.toISOString() || null,
          updatedAt: created.updatedAt?.toISOString() || null
        }
      });

    } catch (err) {
      // Xato bo‘lsa yangi yuklangan rasmni o‘chirish
      if (req.file && req.file.filename) {
        deleteImage(getImageUrl(req, req.file));
      }
      console.error('POST damage-history xatosi:', err);
      res.status(500).json({ success: false, message: 'Server xatosi: ' + err.message });
    }
  }
);

// =============================================
// PUT /api/cars/:carId/damage-history/:damageId
// Mavjud zarar yozuvini yangilash (rasm ham yangilanishi mumkin)
// =============================================
router.put('/:carId/damage-history/:damageId',
  upload.single('damageImage'),  // ← yangi rasm yuklash ixtiyoriy
  async (req, res) => {
    try {
      const { carId, damageId } = req.params;
      const updateData = req.body;

      if (!mongoose.Types.ObjectId.isValid(carId) || !mongoose.Types.ObjectId.isValid(damageId)) {
        return res.status(400).json({ success: false, message: 'Noto‘g‘ri ID' });
      }

      const car = await Car.findById(carId);
      if (!car) {
        return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
      }

      const damage = car.damageHistory.id(damageId);
      if (!damage) {
        return res.status(404).json({ success: false, message: 'Zarar yozuvi topilmadi' });
      }

      // Eski rasmni o‘chirish (agar yangisi yuklansa)
      let oldImageUrl = damage.damageImage;
      if (req.file) {
        const newImageUrl = getImageUrl(req, req.file);
        damage.damageImage = newImageUrl;

        if (oldImageUrl) {
          deleteImage(oldImageUrl);
        }
      }

      // Faqat kelgan maydonlarni yangilash
      if (updateData.damageDate !== undefined) damage.damageDate = new Date(updateData.damageDate);
      if (updateData.damageType !== undefined) damage.damageType = updateData.damageType.trim();
      if (updateData.daraja !== undefined) damage.daraja = updateData.daraja.trim();
      if (updateData.location !== undefined) damage.location = updateData.location.trim();
      if (updateData.qatnashchi !== undefined) damage.qatnashchi = updateData.qatnashchi.trim();
      if (updateData.rasxot_remont !== undefined) damage.rasxot_remont = Number(updateData.rasxot_remont);
      if (updateData.rasxot_kuzup !== undefined) damage.rasxot_kuzup = Number(updateData.rasxot_kuzup);

      await car.save();

      res.json({
        success: true,
        message: 'Zarar yozuvi yangilandi',
        data: {
          _id: damage._id.toString(),
          damageDate: damage.damageDate?.toISOString() || null,
          damageType: damage.damageType,
          daraja: damage.daraja || '',
          location: damage.location || '',
          qatnashchi: damage.qatnashchi || '',
          rasxot_remont: damage.rasxot_remont || 0,
          rasxot_kuzup: damage.rasxot_kuzup || 0,
          damageImage: damage.damageImage || '',
          createdAt: damage.createdAt?.toISOString() || null,
          updatedAt: damage.updatedAt?.toISOString() || null
        }
      });

    } catch (err) {
      // Xato bo‘lsa yangi rasmni o‘chirish
      if (req.file && req.file.filename) {
        deleteImage(getImageUrl(req, req.file));
      }
      console.error('PUT damage-history xatosi:', err);
      res.status(500).json({ success: false, message: 'Server xatosi: ' + err.message });
    }
  }
);

// =============================================
// DELETE /api/cars/:carId/damage-history/:damageId
// Zarar yozuvini o‘chirish + rasmni serverdan tozalash
// =============================================
router.delete('/:carId/damage-history/:damageId', async (req, res) => {
  try {
    const { carId, damageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(carId) || !mongoose.Types.ObjectId.isValid(damageId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri ID' });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const damage = car.damageHistory.id(damageId);
    if (!damage) {
      return res.status(404).json({ success: false, message: 'Zarar yozuvi topilmadi' });
    }

    // Rasm mavjud bo‘lsa o‘chirish
    if (damage.damageImage) {
      deleteImage(damage.damageImage);
    }

    car.damageHistory.pull(damageId);
    await car.save();

    res.json({
      success: true,
      message: 'Zarar yozuvi o‘chirildi',
      remaining: car.damageHistory.length
    });

  } catch (err) {
    console.error('DELETE damage-history xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: ' + err.message });
  }
});

// =============================================
// GET /api/cars/:carId/damage-history
// Barcha zarar yozuvlarini olish
// =============================================
router.get('/:carId/damage-history', async (req, res) => {
  try {
    const { carId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri car ID' });
    }

    const car = await Car.findById(carId)
      .select('damageHistory')
      .lean();

    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    // Sana bo‘yicha teskari tartib (eng yangi tepada)
    const history = (car.damageHistory || [])
      .sort((a, b) => new Date(b.damageDate) - new Date(a.damageDate))
      .map(item => ({
        _id: item._id.toString(),
        damageDate: item.damageDate?.toISOString() || null,
        damageType: item.damageType || 'ДТП',
        daraja: item.daraja || '',
        location: item.location || '',
        qatnashchi: item.qatnashchi || '',
        rasxot_remont: item.rasxot_remont || 0,
        rasxot_kuzup: item.rasxot_kuzup || 0,
        damageImage: item.damageImage || '',
        createdAt: item.createdAt?.toISOString() || null,
        updatedAt: item.updatedAt?.toISOString() || null
      }));

    res.json({
      success: true,
      count: history.length,
      data: history
    });

  } catch (err) {
    console.error('GET damage-history xatosi:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});



// =============================================
// POST /api/cars/:carId/lizing-history
// Yangi lizing yozuvini qo‘shish
// =============================================
router.post('/:carId/lizing-history', async (req, res) => {
  try {
    const { carId } = req.params;
    const { title, text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri car ID' });
    }

    if (!title || !text) {
      return res.status(400).json({
        success: false,
        message: 'title va text majburiy maydonlar'
      });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const newLizing = {
      title: title.trim(),
      text: text.trim()
    };

    car.LizingHistory.push(newLizing);
    await car.save();

    const created = car.LizingHistory[car.LizingHistory.length - 1];

    res.status(201).json({
      success: true,
      message: 'Lizing yozuvi qo‘shildi',
      data: {
        _id: created._id.toString(),
        title: created.title,
        text: created.text,
        createdAt: created.createdAt?.toISOString() || null,
        updatedAt: created.updatedAt?.toISOString() || null
      }
    });

  } catch (err) {
    console.error('POST lizing-history xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: ' + err.message });
  }
});

// =============================================
// PUT /api/cars/:carId/lizing-history/:lizingId
// Mavjud lizing yozuvini yangilash
// =============================================
router.put('/:carId/lizing-history/:lizingId', async (req, res) => {
  try {
    const { carId, lizingId } = req.params;
    const { title, text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(carId) || !mongoose.Types.ObjectId.isValid(lizingId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri ID' });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const lizing = car.LizingHistory.id(lizingId);
    if (!lizing) {
      return res.status(404).json({ success: false, message: 'Lizing yozuvi topilmadi' });
    }

    if (title !== undefined) lizing.title = title.trim();
    if (text  !== undefined) lizing.text  = text.trim();

    await car.save();

    res.json({
      success: true,
      message: 'Lizing yozuvi yangilandi',
      data: {
        _id: lizing._id.toString(),
        title: lizing.title,
        text: lizing.text,
        createdAt: lizing.createdAt?.toISOString() || null,
        updatedAt: lizing.updatedAt?.toISOString() || null
      }
    });

  } catch (err) {
    console.error('PUT lizing-history xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: ' + err.message });
  }
});

// =============================================
// DELETE /api/cars/:carId/lizing-history/:lizingId
// Lizing yozuvini o‘chirish
// =============================================
router.delete('/:carId/lizing-history/:lizingId', async (req, res) => {
  try {
    const { carId, lizingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(carId) || !mongoose.Types.ObjectId.isValid(lizingId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri ID' });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const exists = car.LizingHistory.id(lizingId);
    if (!exists) {
      return res.status(404).json({ success: false, message: 'Lizing yozuvi topilmadi' });
    }

    car.LizingHistory.pull(lizingId);
    await car.save();

    res.json({
      success: true,
      message: 'Lizing yozuvi o‘chirildi',
      remaining: car.LizingHistory.length
    });

  } catch (err) {
    console.error('DELETE lizing-history xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: ' + err.message });
  }
});

// =============================================
// GET /api/cars/:carId/lizing-history
// Barcha lizing yozuvlarini olish
// =============================================
router.get('/:carId/lizing-history', async (req, res) => {
  try {
    const { carId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri car ID' });
    }

    const car = await Car.findById(carId)
      .select('LizingHistory')
      .lean();

    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const history = (car.LizingHistory || [])
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(item => ({
        _id: item._id.toString(),
        title: item.title || '',
        text: item.text || '',
        createdAt: item.createdAt?.toISOString() || null,
        updatedAt: item.updatedAt?.toISOString() || null
      }));

    res.json({
      success: true,
      count: history.length,
      data: history
    });

  } catch (err) {
    console.error('GET lizing-history xatosi:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});





// =============================================
// POST /api/cars/:carId/sud-history
// Yangi sud ishi yozuvini qo‘shish
// =============================================
router.post('/:carId/sud-history', async (req, res) => {
  try {
    const { carId } = req.params;
    const { title, text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri car ID' });
    }

    if (!title || !text) {
      return res.status(400).json({
        success: false,
        message: 'title va text majburiy maydonlar'
      });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const newSud = {
      title: title.trim(),
      text: text.trim()
    };

    car.SudHistory.push(newSud);
    await car.save();

    const created = car.SudHistory[car.SudHistory.length - 1];

    res.status(201).json({
      success: true,
      message: 'Sud ishi yozuvi qo‘shildi',
      data: {
        _id: created._id.toString(),
        title: created.title,
        text: created.text,
        createdAt: created.createdAt?.toISOString() || null,
        updatedAt: created.updatedAt?.toISOString() || null
      }
    });

  } catch (err) {
    console.error('POST sud-history xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: ' + err.message });
  }
});

// =============================================
// PUT /api/cars/:carId/sud-history/:sudId
// Mavjud sud ishi yozuvini yangilash
// =============================================
router.put('/:carId/sud-history/:sudId', async (req, res) => {
  try {
    const { carId, sudId } = req.params;
    const { title, text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(carId) || !mongoose.Types.ObjectId.isValid(sudId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri ID' });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const sud = car.SudHistory.id(sudId);
    if (!sud) {
      return res.status(404).json({ success: false, message: 'Sud ishi yozuvi topilmadi' });
    }

    if (title !== undefined) sud.title = title.trim();
    if (text  !== undefined) sud.text  = text.trim();

    await car.save();

    res.json({
      success: true,
      message: 'Sud ishi yozuvi yangilandi',
      data: {
        _id: sud._id.toString(),
        title: sud.title,
        text: sud.text,
        createdAt: sud.createdAt?.toISOString() || null,
        updatedAt: sud.updatedAt?.toISOString() || null
      }
    });

  } catch (err) {
    console.error('PUT sud-history xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: ' + err.message });
  }
});

// =============================================
// DELETE /api/cars/:carId/sud-history/:sudId
// Sud ishi yozuvini o‘chirish
// =============================================
router.delete('/:carId/sud-history/:sudId', async (req, res) => {
  try {
    const { carId, sudId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(carId) || !mongoose.Types.ObjectId.isValid(sudId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri ID' });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const exists = car.SudHistory.id(sudId);
    if (!exists) {
      return res.status(404).json({ success: false, message: 'Sud ishi yozuvi topilmadi' });
    }

    car.SudHistory.pull(sudId);
    await car.save();

    res.json({
      success: true,
      message: 'Sud ishi yozuvi o‘chirildi',
      remaining: car.SudHistory.length
    });

  } catch (err) {
    console.error('DELETE sud-history xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: ' + err.message });
  }
});

// =============================================
// GET /api/cars/:carId/sud-history
// Barcha sud ishi yozuvlarini olish
// =============================================
router.get('/:carId/sud-history', async (req, res) => {
  try {
    const { carId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri car ID' });
    }

    const car = await Car.findById(carId)
      .select('SudHistory')
      .lean();

    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const history = (car.SudHistory || [])
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(item => ({
        _id: item._id.toString(),
        title: item.title || '',
        text: item.text || '',
        createdAt: item.createdAt?.toISOString() || null,
        updatedAt: item.updatedAt?.toISOString() || null
      }));

    res.json({
      success: true,
      count: history.length,
      data: history
    });

  } catch (err) {
    console.error('GET sud-history xatosi:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// =============================================
// POST /api/cars/:carId/qidiruv-history
// Yangi qidiruv yozuvini qo‘shish
// =============================================
router.post('/:carId/qidiruv-history', async (req, res) => {
  try {
    const { carId } = req.params;
    const { title, text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri car ID' });
    }

    if (!title || !text) {
      return res.status(400).json({
        success: false,
        message: 'title va text majburiy maydonlar'
      });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const newQidiruv = {
      title: title.trim(),
      text: text.trim()
    };

    car.QidiruvHistory.push(newQidiruv);
    await car.save();

    const created = car.QidiruvHistory[car.QidiruvHistory.length - 1];

    res.status(201).json({
      success: true,
      message: 'Qidiruv yozuvi qo‘shildi',
      data: {
        _id: created._id.toString(),
        title: created.title,
        text: created.text,
        createdAt: created.createdAt?.toISOString() || null,
        updatedAt: created.updatedAt?.toISOString() || null
      }
    });

  } catch (err) {
    console.error('POST qidiruv-history xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: ' + err.message });
  }
});

// =============================================
// PUT /api/cars/:carId/qidiruv-history/:qidiruvId
// Mavjud qidiruv yozuvini yangilash
// =============================================
router.put('/:carId/qidiruv-history/:qidiruvId', async (req, res) => {
  try {
    const { carId, qidiruvId } = req.params;
    const { title, text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(carId) || !mongoose.Types.ObjectId.isValid(qidiruvId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri ID' });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const qidiruv = car.QidiruvHistory.id(qidiruvId);
    if (!qidiruv) {
      return res.status(404).json({ success: false, message: 'Qidiruv yozuvi topilmadi' });
    }

    if (title !== undefined) qidiruv.title = title.trim();
    if (text  !== undefined) qidiruv.text  = text.trim();

    await car.save();

    res.json({
      success: true,
      message: 'Qidiruv yozuvi yangilandi',
      data: {
        _id: qidiruv._id.toString(),
        title: qidiruv.title,
        text: qidiruv.text,
        createdAt: qidiruv.createdAt?.toISOString() || null,
        updatedAt: qidiruv.updatedAt?.toISOString() || null
      }
    });

  } catch (err) {
    console.error('PUT qidiruv-history xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: ' + err.message });
  }
});

// =============================================
// DELETE /api/cars/:carId/qidiruv-history/:qidiruvId
// Qidiruv yozuvini o‘chirish
// =============================================
router.delete('/:carId/qidiruv-history/:qidiruvId', async (req, res) => {
  try {
    const { carId, qidiruvId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(carId) || !mongoose.Types.ObjectId.isValid(qidiruvId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri ID' });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const exists = car.QidiruvHistory.id(qidiruvId);
    if (!exists) {
      return res.status(404).json({ success: false, message: 'Qidiruv yozuvi topilmadi' });
    }

    car.QidiruvHistory.pull(qidiruvId);
    await car.save();

    res.json({
      success: true,
      message: 'Qidiruv yozuvi o‘chirildi',
      remaining: car.QidiruvHistory.length
    });

  } catch (err) {
    console.error('DELETE qidiruv-history xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: ' + err.message });
  }
});

// =============================================
// GET /api/cars/:carId/qidiruv-history
// Barcha qidiruv yozuvlarini olish
// =============================================
router.get('/:carId/qidiruv-history', async (req, res) => {
  try {
    const { carId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri car ID' });
    }

    const car = await Car.findById(carId)
      .select('QidiruvHistory')
      .lean();

    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const history = (car.QidiruvHistory || [])
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(item => ({
        _id: item._id.toString(),
        title: item.title || '',
        text: item.text || '',
        createdAt: item.createdAt?.toISOString() || null,
        updatedAt: item.updatedAt?.toISOString() || null
      }));

    res.json({
      success: true,
      count: history.length,
      data: history
    });

  } catch (err) {
    console.error('GET qidiruv-history xatosi:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});



// =============================================
// POST /api/cars/:carId/zalog-history
// Yangi zalog yozuvini qo‘shish
// =============================================
router.post('/:carId/zalog-history', async (req, res) => {
  try {
    const { carId } = req.params;
    const { title, text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri car ID' });
    }

    if (!title || !text) {
      return res.status(400).json({
        success: false,
        message: 'title va text majburiy maydonlar'
      });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const newZalog = {
      title: title.trim(),
      text: text.trim()
    };

    car.ZalogHistory.push(newZalog);
    await car.save();

    const created = car.ZalogHistory[car.ZalogHistory.length - 1];

    res.status(201).json({
      success: true,
      message: 'Zalog yozuvi qo‘shildi',
      data: {
        _id: created._id.toString(),
        title: created.title,
        text: created.text,
        createdAt: created.createdAt?.toISOString() || null,
        updatedAt: created.updatedAt?.toISOString() || null
      }
    });

  } catch (err) {
    console.error('POST zalog-history xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: ' + err.message });
  }
});

// =============================================
// PUT /api/cars/:carId/zalog-history/:zalogId
// Mavjud zalog yozuvini yangilash
// =============================================
router.put('/:carId/zalog-history/:zalogId', async (req, res) => {
  try {
    const { carId, zalogId } = req.params;
    const { title, text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(carId) || !mongoose.Types.ObjectId.isValid(zalogId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri ID' });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const zalog = car.ZalogHistory.id(zalogId);
    if (!zalog) {
      return res.status(404).json({ success: false, message: 'Zalog yozuvi topilmadi' });
    }

    if (title !== undefined) zalog.title = title.trim();
    if (text  !== undefined) zalog.text  = text.trim();

    await car.save();

    res.json({
      success: true,
      message: 'Zalog yozuvi yangilandi',
      data: {
        _id: zalog._id.toString(),
        title: zalog.title,
        text: zalog.text,
        createdAt: zalog.createdAt?.toISOString() || null,
        updatedAt: zalog.updatedAt?.toISOString() || null
      }
    });

  } catch (err) {
    console.error('PUT zalog-history xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: ' + err.message });
  }
});

// =============================================
// DELETE /api/cars/:carId/zalog-history/:zalogId
// Zalog yozuvini o‘chirish
// =============================================
router.delete('/:carId/zalog-history/:zalogId', async (req, res) => {
  try {
    const { carId, zalogId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(carId) || !mongoose.Types.ObjectId.isValid(zalogId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri ID' });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const exists = car.ZalogHistory.id(zalogId);
    if (!exists) {
      return res.status(404).json({ success: false, message: 'Zalog yozuvi topilmadi' });
    }

    car.ZalogHistory.pull(zalogId);
    await car.save();

    res.json({
      success: true,
      message: 'Zalog yozuvi o‘chirildi',
      remaining: car.ZalogHistory.length
    });

  } catch (err) {
    console.error('DELETE zalog-history xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: ' + err.message });
  }
});

// =============================================
// GET /api/cars/:carId/zalog-history
// Barcha zalog yozuvlarini olish
// =============================================
router.get('/:carId/zalog-history', async (req, res) => {
  try {
    const { carId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri car ID' });
    }

    const car = await Car.findById(carId)
      .select('ZalogHistory')
      .lean();

    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const history = (car.ZalogHistory || [])
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(item => ({
        _id: item._id.toString(),
        title: item.title || '',
        text: item.text || '',
        createdAt: item.createdAt?.toISOString() || null,
        updatedAt: item.updatedAt?.toISOString() || null
      }));

    res.json({
      success: true,
      count: history.length,
      data: history
    });

  } catch (err) {
    console.error('GET zalog-history xatosi:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// POST /api/cars/:carId/history-events
router.post('/:carId/history-events', upload.single('image'), async (req, res) => {
  try {
    const { carId } = req.params;
    const { date, title, text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(carId)) {
      if (req.file) deleteImage(getImageUrl(req, req.file));
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri car ID' });
    }

    if (!date || !title || !text) {
      if (req.file) deleteImage(getImageUrl(req, req.file));
      return res.status(400).json({ success: false, message: 'date, title va text majburiy' });
    }

    const car = await Car.findById(carId);
    if (!car) {
      if (req.file) deleteImage(getImageUrl(req, req.file));
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    let imageUrl = '';
    if (req.file) {
      imageUrl = getImageUrl(req, req.file);
    }

    const newEvent = {
      date: new Date(date),
      image: imageUrl,
      title: title.trim(),
      text: text.trim()
    };

    car.historyEvents.push(newEvent);
    await car.save();

    const created = car.historyEvents[car.historyEvents.length - 1];

    res.status(201).json({
      success: true,
      message: 'Voqea qo‘shildi',
      data: {
        _id: created._id.toString(),
        date: created.date.toISOString(),
        image: created.image || '',
        title: created.title,
        text: created.text,
        createdAt: created.createdAt?.toISOString() || null
      }
    });

  } catch (err) {
    if (req.file) deleteImage(getImageUrl(req, req.file));
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/cars/:carId/history-events/:eventId
router.put('/:carId/history-events/:eventId', upload.single('image'), async (req, res) => {
  try {
    const { carId, eventId } = req.params;
    const { date, title, text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(carId) || !mongoose.Types.ObjectId.isValid(eventId)) {
      if (req.file) deleteImage(getImageUrl(req, req.file));
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri ID' });
    }

    const car = await Car.findById(carId);
    if (!car) {
      if (req.file) deleteImage(getImageUrl(req, req.file));
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const event = car.historyEvents.id(eventId);
    if (!event) {
      if (req.file) deleteImage(getImageUrl(req, req.file));
      return res.status(404).json({ success: false, message: 'Voqea topilmadi' });
    }

    // Eski rasmni o‘chirish (agar yangisi kelsa)
    if (req.file) {
      const newImageUrl = getImageUrl(req, req.file);
      if (event.image) deleteImage(event.image);
      event.image = newImageUrl;
    }

    if (date)   event.date   = new Date(date);
    if (title)  event.title  = title.trim();
    if (text)   event.text   = text.trim();

    await car.save();

    res.json({
      success: true,
      message: 'Voqea yangilandi',
      data: event
    });

  } catch (err) {
    if (req.file) deleteImage(getImageUrl(req, req.file));
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/cars/:carId/history-events/:eventId
router.delete('/:carId/history-events/:eventId', async (req, res) => {
  try {
    const { carId, eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(carId) || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri ID' });
    }

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ success: false, message: 'Mashina topilmadi' });

    const event = car.historyEvents.id(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Voqea topilmadi' });

    if (event.image) deleteImage(event.image);

    car.historyEvents.pull(eventId);
    await car.save();

    res.json({
      success: true,
      message: 'Voqea o‘chirildi',
      remaining: car.historyEvents.length
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/cars/:carId/history-events
router.get('/:carId/history-events', async (req, res) => {
  try {
    const { carId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri car ID' });
    }

    const car = await Car.findById(carId).select('historyEvents').lean();

    if (!car) return res.status(404).json({ success: false, message: 'Mashina topilmadi' });

    const history = (car.historyEvents || [])
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(item => ({
        _id: item._id.toString(),
        date: item.date.toISOString(),
        image: item.image || '',
        title: item.title,
        text: item.text,
        createdAt: item.createdAt?.toISOString() || null
      }));

    res.json({
      success: true,
      count: history.length,
      data: history
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/cars/:carId/shtraf-events/:eventId
router.put('/:carId/shtraf-events/:eventId', upload.single('image'), async (req, res) => {
  try {
    const { carId, eventId } = req.params;
    const { date, title, text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(carId) || !mongoose.Types.ObjectId.isValid(eventId)) {
      if (req.file) deleteImage(getImageUrl(req, req.file));
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri ID' });
    }

    const car = await Car.findById(carId);
    if (!car) {
      if (req.file) deleteImage(getImageUrl(req, req.file));
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const event = car.shtrafEvents.id(eventId);
    if (!event) {
      if (req.file) deleteImage(getImageUrl(req, req.file));
      return res.status(404).json({ success: false, message: 'Jarima hodisasi topilmadi' });
    }

    // Agar yangi rasm kelsa — eskisini o‘chirib, yangisini qo‘yamiz
    if (req.file) {
      const newImageUrl = getImageUrl(req, req.file);
      if (event.image) deleteImage(event.image);
      event.image = newImageUrl;
    }

    if (date)   event.date   = new Date(date);
    if (title)  event.title  = title.trim();
    if (text)   event.text   = text.trim();

    await car.save();

    res.json({
      success: true,
      message: 'Jarima hodisasi yangilandi',
      data: event
    });

  } catch (err) {
    if (req.file) deleteImage(getImageUrl(req, req.file));
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/cars/:carId/shtraf-events/:eventId
router.delete('/:carId/shtraf-events/:eventId', async (req, res) => {
  try {
    const { carId, eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(carId) || !mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri ID' });
    }

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ success: false, message: 'Mashina topilmadi' });

    const event = car.shtrafEvents.id(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Jarima hodisasi topilmadi' });

    if (event.image) deleteImage(event.image);

    car.shtrafEvents.pull(eventId);
    await car.save();

    res.json({
      success: true,
      message: 'Jarima hodisasi o‘chirildi',
      remaining: car.shtrafEvents.length
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/cars/:carId/shtraf-events
router.get('/:carId/shtraf-events', async (req, res) => {
  try {
    const { carId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri car ID' });
    }

    const car = await Car.findById(carId).select('shtrafEvents').lean();

    if (!car) return res.status(404).json({ success: false, message: 'Mashina topilmadi' });

    const shtraf = (car.shtrafEvents || [])
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(item => ({
        _id: item._id.toString(),
        date: item.date.toISOString(),
        image: item.image || '',
        title: item.title,
        text: item.text,
        createdAt: item.createdAt?.toISOString() || null,
        updatedAt: item.updatedAt?.toISOString() || null
      }));

    res.json({
      success: true,
      count: shtraf.length,
      data: shtraf
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;