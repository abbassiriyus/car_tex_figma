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

// CREATE
router.post('/',
  body('vin').notEmpty().withMessage('VIN majburiy'),
  body('gosNumber').notEmpty().withMessage('Gos raqam majburiy'),
  body('engineNumber').notEmpty().withMessage('Dvigatel raqami majburiy'),
  body('stsNumber').notEmpty().withMessage('STS majburiy'),
  body('carType').notEmpty().withMessage('Mashina turi majburiy'),
  body('color').notEmpty().withMessage('Rang majburiy'),
  body('engine').notEmpty().withMessage('Dvigatel majburiy'),
  body('carName').notEmpty().withMessage('Car name majburiy'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
      const exist = await Car.findOne({ vin: req.body.vin });
      if (exist) {
        return errorResponse(res, 409, 'Bu VIN allaqachon mavjud');
      }

      const car = await Car.create(req.body);

      res.status(201).json({
        success: true,
        message: 'Mashina qo‘shildi',
        data: car
      });

    } catch (err) {
      errorResponse(res, 500, err.message);
    }
  }
);

// ➕ CAR IMAGE QO‘SHISH POST /api/cars/:id/images
router.post('/:id/images',
  upload.single('image'),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return errorResponse(res, 400, 'Noto‘g‘ri ID');
      }

      if (!req.file) {
        return errorResponse(res, 400, 'Rasm majburiy');
      }

      const car = await Car.findById(req.params.id);
      if (!car) return errorResponse(res, 404, 'Car topilmadi');

      const imageUrl = getImageUrl(req, req.file);

      const newImage = {
        url: imageUrl,
        label: req.body.label || '',
        isDamaged: !!req.body.isDamaged
      };


      car.images.push(newImage);
      await car.save();

      res.status(201).json({
        success: true,
        message: 'Rasm qo‘shildi',
        data: car.images
      });

    } catch (err) {
      errorResponse(res, 500, err.message);
    }
  }
);
//❌ BITTA IMAGE O‘CHIRISHDELETE /api/cars/:id/images
router.delete('/:id/images', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return errorResponse(res, 400, 'Noto‘g‘ri ID');
    }

    const { url } = req.body;
    if (!url) {
      return errorResponse(res, 400, 'Image url majburiy');
    }

    const car = await Car.findById(req.params.id);
    if (!car) return errorResponse(res, 404, 'Car topilmadi');

    const imageIndex = car.images.findIndex(img => img.url === url);
    if (imageIndex === -1) {
      return errorResponse(res, 404, 'Rasm topilmadi');
    }

    // Faylni serverdan o‘chirish
    deleteImage(url);

    car.images.splice(imageIndex, 1);
    await car.save();

    res.json({
      success: true,
      message: 'Rasm o‘chirildi',
      data: car.images
    });

  } catch (err) {
    errorResponse(res, 500, err.message);
  }
});



// ❌ BARCHA IMAGE O‘CHIRISH
router.delete('/:id/images/all', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return errorResponse(res, 400, 'Noto‘g‘ri ID');
    }

    const car = await Car.findById(req.params.id);
    if (!car) return errorResponse(res, 404, 'Car topilmadi');

    car.images.forEach(img => {
      deleteImage(img.url);
    });

    car.images = [];
    await car.save();

    res.json({
      success: true,
      message: 'Barcha rasmlar o‘chirildi'
    });

  } catch (err) {
    errorResponse(res, 500, err.message);
  }
});


// GET /api/cars/search
router.get('/search', async (req, res) => {
  try {
    const { 
      q, 
      page = '1', 
      limit = '10' 
    } = req.query;

    // Validatsiya
    if (!q || typeof q !== 'string' || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Qidiruv parametri (q) majburiy va bo‘sh bo‘lmasligi kerak'
      });
    }

    const searchTerm = q.trim();
    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 50); // maksimal 50 ta cheklash

    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
    if (isNaN(limitNum) || limitNum < 1) limitNum = 10;

    // Qidiruv shartlari (eng ko‘p ishlatiladigan maydonlar qo‘shildi)
    const query = {
      $or: [
        { vin:               { $regex: searchTerm, $options: 'i' } },
        { gosNumber:         { $regex: searchTerm, $options: 'i' } },
        { engineNumber:      { $regex: searchTerm, $options: 'i' } },
        { stsNumber:         { $regex: searchTerm, $options: 'i' } },
        { carName:           { $regex: searchTerm, $options: 'i' } },
        { color:             { $regex: searchTerm, $options: 'i' } },
        { 'extraGosNumber':    { $in: [searchTerm] } }, // array ichida exact match
        // Agar partial match kerak bo‘lsa quyidagini qo‘shing:
        // { 'extraGosNumber':  { $regex: searchTerm, $options: 'i' } }
      ]
    };

    // Umumiy son
    const total = await Car.countDocuments(query);

    // Ma'lumotlarni olish (populate qilingan maydonlar bilan)
    const cars = await Car.find(query)
      .populate({ path: 'features.featureId', select: 'title image order' })
      .populate({ path: 'legalRisks.riskId',   select: 'title text' })
      .populate({ path: 'otchots.otchotId',    select: 'title icon order' })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    // To‘liq formatlash — hammasi qo‘shildi
    const formattedCars = cars.map(car => {
      // Sana bo‘yicha guruhlash funksiyasi (historyEvents va shtrafEvents uchun)
      const groupByDate = (events) => {
        const grouped = {};

        (events || []).forEach(item => {
          const dateKey = new Date(item.date).toISOString().split('T')[0];

          if (!grouped[dateKey]) {
            grouped[dateKey] = {
              date: new Date(dateKey).toISOString(),
              events: []
            };
          }

          grouped[dateKey].events.push({
            _id: item._id.toString(),
            image: item.image || '',
            title: item.title || '',
            text: item.text || '',
            createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
            updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : null
          });
        });

        return Object.values(grouped).sort((a, b) => new Date(b.date) - new Date(a.date));
      };

      return {
        _id: car._id.toString(),
        vin: car.vin || '',
        gosNumber: car.gosNumber || '',
        extraGosNumber: car.extraGosNumber || [],
        engineNumber: car.engineNumber || '',
        stsNumber: car.stsNumber || '',
        carName: car.carName || '',
        carType: car.carType || '',
        color: car.color || '',
        engine: car.engine || '',

        images: car.images || [],

        features: (car.features || []).map(f => ({
          featureId: f.featureId?._id?.toString() || null,
          title: f.featureId?.title || "Noma'lum xususiyat",
          text: f.text || '',
          image: f.featureId?.image || '',
          position: f.position || 0
        })),

        legalRisks: (car.legalRisks || []).map(lr => ({
          riskId: lr.riskId?._id?.toString() || null,
          title: lr.riskId?.title || "Noma'lum risk",
          text: lr.riskId?.text || '',
          position: lr.position || 0
        })),

        otchots: (car.otchots || []).map(o => ({
          otchotId: o.otchotId?._id?.toString() || null,
          title: o.otchotId?.title || "Noma'lum otchot",
          icon: o.otchotId?.icon || '',
          position: o.position || 0,
          text: o.text || ''
        })),

        probegHistory: car.probegHistory || [],
        salesHistory: car.salesHistory || [],
        exploitationHistory: car.exploitationHistory || [],

        valuation: {
          valuationLow: car.valuation?.valuationLow || 0,
          valuationRangeLow: car.valuation?.valuationRangeLow || 0,
          valuationRangeHigh: car.valuation?.valuationRangeHigh || 0,
          valuationHigh: car.valuation?.valuationHigh || 0,
          currency: car.valuation?.currency || 'UZS'
        },

        // Yangi qo‘shilgan barcha tarixiy bo‘limlar (oddiy array sifatida)
        auctionHistory:     car.auctionHistory     || [],
        diagnosticHistory:  car.diagnosticHistory  || [],
        damageHistory:      car.damageHistory      || [],
        LizingHistory:      car.LizingHistory      || [],
        SudHistory:         car.SudHistory         || [],
        QidiruvHistory:     car.QidiruvHistory     || [],
        ZalogHistory:       car.ZalogHistory       || [],

        // Sana bo‘yicha guruhlangan historyEvents va shtrafEvents
        historyEvents: groupByDate(car.historyEvents || []),
        shtrafEvents:  groupByDate(car.shtrafEvents  || []),

        createdAt: car.createdAt ? car.createdAt.toISOString() : null,
        updatedAt: car.updatedAt ? car.updatedAt.toISOString() : null
      };
    });

    res.json({
      success: true,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
        hasNext: pageNum * limitNum < total,
        hasPrev: pageNum > 1
      },
      count: formattedCars.length,
      data: formattedCars
    });

  } catch (err) {
    console.error('Search endpoint xatosi:', {
      query: req.query?.q,
      error: err.message,
      stack: err.stack
    });

    res.status(500).json({
      success: false,
      message: 'Server ichki xatosi yuz berdi',
      ...(process.env.NODE_ENV === 'development' && { errorDetail: err.message })
    });
  }
});





// ➕ Extra gos nomer qo‘shish  POST /api/cars/:id/gos
router.post('/:id/gos', async (req, res) => {
  try {
    const { number } = req.body;

    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Car topilmadi' });
    }

    // duplicate bo‘lmasin
    if (car.extraGosNumber.includes(number)) {
      return res.status(409).json({
        success: false,
        message: 'Bu gos nomer allaqachon mavjud'
      });
    }

    car.extraGosNumber.push(number);
    await car.save();

    res.status(201).json({
      success: true,
      message: 'Extra gos nomer qo‘shildi',
      data: car.extraGosNumber
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✏️ Extra gos nomer yangilash PUT /api/cars/:id/gos/:number
router.put('/:id/gos/:number', async (req, res) => {
  try {
    const { newNumber } = req.body;

    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Car topilmadi' });
    }

    const index = car.extraGosNumber.findIndex(
      n => n === req.params.number
    );

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Gos nomer topilmadi'
      });
    }

    // duplicate check
    if (car.extraGosNumber.includes(newNumber)) {
      return res.status(409).json({
        success: false,
        message: 'Bu gos nomer allaqachon mavjud'
      });
    }

    car.extraGosNumber[index] = newNumber;
    await car.save();

    res.json({
      success: true,
      message: 'Gos nomer yangilandi',
      data: car.extraGosNumber
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ❌ Extra gos nomer o‘chirish DELETE /api/cars/:id/gos/:number
router.delete('/:id/gos/:number', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Car topilmadi' });
    }

    car.extraGosNumber = car.extraGosNumber.filter(
      n => n !== req.params.number
    );

    await car.save();

    res.json({
      success: true,
      message: 'Gos nomer olib tashlandi',
      data: car.extraGosNumber
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



// ➕ Feature biriktirish POST /api/cars/:id/features
router.post('/:id/features', async (req, res) => {
  try {
    const { featureId, text, position } = req.body;

    if (!mongoose.Types.ObjectId.isValid(featureId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri featureId' });
    }

    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Car topilmadi' });
    }

    const exists = car.features.some(
      f => f.featureId.toString() === featureId
    );

    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'Bu feature allaqachon biriktirilgan'
      });
    }

    car.features.push({
      featureId,
      text,
      position
    });

    await car.save();

    res.status(201).json({
      success: true,
      message: 'Feature biriktirildi',
      data: car.features
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/cars/:id/features/:featureId Feature text yangilash
router.put('/:id/features/:featureId', async (req, res) => {
  try {
    const { text, position } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.featureId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri featureId' });
    }

    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Car topilmadi' });
    }

    const feature = car.features.find(
      f => f.featureId.toString() === req.params.featureId
    );

    if (!feature) {
      return res.status(404).json({
        success: false,
        message: 'Feature topilmadi'
      });
    }

    feature.text = text ?? feature.text;
    feature.position = position ?? feature.position;

    await car.save();

    res.json({
      success: true,
      message: 'Feature yangilandi',
      data: car.features
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ❌ Feature olib tashlash DELETE /api/cars/:id/features/:featureId
router.delete('/:id/features/:featureId', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.featureId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri featureId' });
    }

    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Car topilmadi' });
    }

    const before = car.features.length;

    car.features = car.features.filter(
      f => f.featureId.toString() !== req.params.featureId
    );

    if (before === car.features.length) {
      return res.status(404).json({
        success: false,
        message: 'Feature topilmadi'
      });
    }

    await car.save();

    res.json({
      success: true,
      message: 'Feature olib tashlandi'
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});



router.post('/:id/legal-risks', async (req, res) => {
  try {
    const { riskId } = req.body;
    const position = Number(req.body.position); // 🔥 numberga o'tkazamiz

    if (!Number.isInteger(position) || ![1,2,3].includes(position)) {
      return res.status(400).json({
        success: false,
        message: 'Position 1, 2 yoki 3 bo‘lishi kerak'
      });
    }

    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Car topilmadi'
      });
    }

    const exist = car.legalRisks.find(
      lr => lr.riskId.toString() === riskId
    );

    if (exist) {
      return res.status(409).json({
        success: false,
        message: 'Bu risk allaqachon biriktirilgan'
      });
    }

    car.legalRisks.push({ riskId, position });

    await car.save();

    const populated = await Car.findById(req.params.id)
      .populate('legalRisks.riskId');

    res.status(201).json({
      success: true,
      message: 'Risk biriktirildi',
      data: populated.legalRisks
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});


//✏️ Risk pozitsiyasini yangilash  PUT /api/cars/:id/legal-risks/:riskId
router.put('/:id/legal-risks/:riskId', async (req, res) => {
  try {
    const { position } = req.body;
    if (![1, 2, 3].includes(position)) return res.status(400).json({ success: false, message: 'Position 1,2,3 bo‘lishi kerak' });

    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ success: false, message: 'Car topilmadi' });

    const risk = car.legalRisks.find(lr => lr.riskId.toString() === req.params.riskId);
    if (!risk) return res.status(404).json({ success: false, message: 'Risk topilmadi' });

    risk.position = position;
    await car.save();

    res.json({ success: true, message: 'Yangilandi', data: car.legalRisks });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ❌ Riskni olib tashlash  DELETE /api/cars/:id/legal-risks/:riskId

router.delete('/:id/legal-risks/:riskId', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ success: false, message: 'Car topilmadi' });

    car.legalRisks = car.legalRisks.filter(lr => lr.riskId.toString() !== req.params.riskId);
    await car.save();

    res.json({ success: true, message: 'Risk olib tashlandi' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// GET ALL
router.get('/', async (req, res) => {
  try {
    const cars = await Car.find().sort({ createdAt: -1 });
    res.json({ success: true, count: cars.length, data: cars });
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
});
// GET /api/cars/:id
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Noto‘g‘ri ID formati'
      });
    }

    const car = await Car.findById(req.params.id)
      .populate({
        path: 'features.featureId',
        select: 'title image order'
      })
      .populate({
        path: 'legalRisks.riskId',
        select: 'title text'
      })
      .populate({
        path: 'otchots.otchotId',
        select: 'title icon order'
      })
      .lean();

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Mashina topilmadi'
      });
    }

    // Sana bo‘yicha guruhlash funksiyasi (historyEvents va shtrafEvents uchun)
    const groupByDate = (eventsArray) => {
      const grouped = {};

      (eventsArray || []).forEach(item => {
        const dateKey = new Date(item.date).toISOString().split('T')[0];

        if (!grouped[dateKey]) {
          grouped[dateKey] = {
            date: new Date(dateKey).toISOString(),
            events: []
          };
        }

        grouped[dateKey].events.push({
          _id: item._id.toString(),
          image: item.image || '',
          title: item.title || '',
          text: item.text || '',
          createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : null,
          updatedAt: item.updatedAt ? new Date(item.updatedAt).toISOString() : null
        });
      });

      // Eng yangi sanadan boshlab tartiblash
      return Object.values(grouped).sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
    };

    // Javob strukturasini to‘liq tayyorlash
    const response = {
      _id: car._id.toString(),
      vin: car.vin || '',
      gosNumber: car.gosNumber || '',
      extraGosNumber: car.extraGosNumber || [],
      engineNumber: car.engineNumber || '',
      stsNumber: car.stsNumber || '',
      carName: car.carName || '',
      carType: car.carType || '',
      color: car.color || '',
      engine: car.engine || '',

      images: car.images || [],

      features: (car.features || []).map(f => ({
        featureId: f.featureId?._id?.toString() || null,
        title: f.featureId?.title || "Noma'lum",
        text: f.text || '',
        image: f.featureId?.image || '',
        position: f.position || 0
      })),

      legalRisks: (car.legalRisks || []).map(lr => ({
        riskId: lr.riskId?._id?.toString() || null,
        title: lr.riskId?.title || "Noma'lum risk",
        text: lr.riskId?.text || '',
        position: lr.position || 0
      })),

      otchots: (car.otchots || []).map(o => ({
        otchotId: o.otchotId?._id?.toString() || null,
        title: o.otchotId?.title || "Noma'lum",
        icon: o.otchotId?.icon || '',
        position: o.position || 0,
        text: o.text || ''
      })),

      probegHistory: (car.probegHistory || [])
        .sort((a, b) => b.year - a.year)
        .map(p => ({
          _id: p._id?.toString() || null,
          year: p.year || 0,
          kilometer: p.kilometer || 0,
          createdAt: p.createdAt?.toISOString() || null,
          updatedAt: p.updatedAt?.toISOString() || null
        })),

      salesHistory: (car.salesHistory || [])
        .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))
        .map(s => ({
          _id: s._id?.toString() || null,
          saleDate: s.saleDate?.toISOString() || null,
          price: s.price || 0,
          priceDrop: s.priceDrop || 0,
          probeg: s.probeg || 0,
          title: s.title || '',
          holati: s.holati || '',
          region: s.region || '',
          link: s.link || '',
          createdAt: s.createdAt?.toISOString() || null,
          updatedAt: s.updatedAt?.toISOString() || null
        })),

      exploitationHistory: (car.exploitationHistory || [])
        .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
        .map(e => ({
          _id: e._id?.toString() || null,
          startDate: e.startDate?.toISOString() || null,
          endDate: e.endDate?.toISOString() || null,
          startKilometer: e.startKilometer || 0,
          endKilometer: e.endKilometer || 0,
          title: e.title || '',
          description: e.description || '',
          location: e.location || '',
          createdAt: e.createdAt?.toISOString() || null,
          updatedAt: e.updatedAt?.toISOString() || null
        })),

      valuation: {
        valuationLow: car.valuation?.valuationLow || 0,
        valuationRangeLow: car.valuation?.valuationRangeLow || 0,
        valuationRangeHigh: car.valuation?.valuationRangeHigh || 0,
        valuationHigh: car.valuation?.valuationHigh || 0,
        currency: car.valuation?.currency || 'UZS'
      },

      // Oddiy array sifatida qaytariladigan bo‘limlar
      auctionHistory:     car.auctionHistory     || [],
      diagnosticHistory:  car.diagnosticHistory  || [],
      damageHistory:      car.damageHistory      || [],
      LizingHistory:      car.LizingHistory      || [],
      SudHistory:         car.SudHistory         || [],
      QidiruvHistory:     car.QidiruvHistory     || [],
      ZalogHistory:       car.ZalogHistory       || [],

      // Sana bo‘yicha guruhlangan bo‘limlar
      historyEvents: groupByDate(car.historyEvents || []),
      shtrafEvents:  groupByDate(car.shtrafEvents  || []),

      createdAt: car.createdAt?.toISOString() || null,
      updatedAt: car.updatedAt?.toISOString() || null
    };

    res.json({
      success: true,
      data: response
    });

  } catch (err) {
    console.error('GET /:id xatosi:', {
      id: req.params.id,
      error: err.message,
      stack: err.stack
    });

    res.status(500).json({
      success: false,
      message: 'Server ichki xatosi yuz berdi',
      ...(process.env.NODE_ENV === 'development' && { errorDetail: err.message })
    });
  }
});
// UPDATE
router.put('/:id',
  param('id').custom(v => mongoose.Types.ObjectId.isValid(v)).withMessage('Noto‘g‘ri ID'),

  async (req, res) => {
    try {
      const car = await Car.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!car) return errorResponse(res, 404, 'Mashina topilmadi');

      res.json({ success: true, message: 'Yangilandi', data: car });
    } catch (err) {
      errorResponse(res, 500, err.message);
    }
  }
);

// DELETE
router.delete('/:id',
  param('id').custom(v => mongoose.Types.ObjectId.isValid(v)).withMessage('Noto‘g‘ri ID'),

  async (req, res) => {
    try {
      const car = await Car.findByIdAndDelete(req.params.id);
      if (!car) return errorResponse(res, 404, 'Mashina topilmadi');

      res.json({ success: true, message: 'O‘chirildi' });
    } catch (err) {
      errorResponse(res, 500, err.message);
    }
  }
);


/////////////////////////////////////////////////////
// ➕ 1. CAR GA OTCHOT QO‘SHISH
// POST /api/cars/:carId/otchots
/////////////////////////////////////////////////////
router.post('/:carId/otchots', async (req, res) => {
  try {
    const { otchotId, position, text } = req.body;

    const car = await Car.findById(req.params.carId);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Mashina topilmadi'
      });
    }

    car.otchots.push({
      otchotId,
      position: Number(position),
      text: text || ''
    });

    await car.save();

    const populatedCar = await Car.findById(req.params.carId)
      .populate('otchots.otchotId');

    res.status(201).json({
      success: true,
      message: 'Otchot qo‘shildi',
      data: populatedCar.otchots
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});


// PUT va DELETE endpointlari ham xuddi shunday mustahkam bo‘lishi kerak
/////////////////////////////////////////////////////
// ✏️ 2. OTCHOTNI UPDATE QILISH
// PUT /api/cars/:carId/otchots/:otchotId
/////////////////////////////////////////////////////

router.put('/:carId/otchots/:otchotId', async (req, res) => {
  try {
    const { carId, otchotId } = req.params;
    const { position, text } = req.body;

    const car = await Car.findById(carId);
    if (!car) return errorResponse(res, 404, 'Car topilmadi');

    const otchot = car.otchots.find(o => o.otchotId.toString() === otchotId);
    if (!otchot) return errorResponse(res, 404, 'Otchot topilmadi');

    if (position) {
      if (![1,2,3,4].includes(Number(position)))
        return errorResponse(res, 400, 'Position 1-4 oralig‘ida bo‘lishi kerak');

      // boshqa position bandmi?
      const positionExists = car.otchots.find(
        o => o.position === Number(position) && o.otchotId.toString() !== otchotId
      );
      if (positionExists)
        return errorResponse(res, 400, 'Bu position band');

      otchot.position = Number(position);
    }

    if (text !== undefined) otchot.text = text;

    await car.save();

    res.json({
      success: true,
      message: 'Otchot yangilandi',
      data: car.otchots
    });

  } catch (err) {
    errorResponse(res, 500, err.message);
  }
});

/////////////////////////////////////////////////////
// ❌ 3. OTCHOTNI O‘CHIRISH
// DELETE /api/cars/:carId/otchots/:otchotId
/////////////////////////////////////////////////////

router.delete('/:carId/otchots/:otchotId', async (req, res) => {
  try {
    const { carId, otchotId } = req.params;

    const car = await Car.findById(carId);
    if (!car) return errorResponse(res, 404, 'Car topilmadi');

    car.otchots = car.otchots.filter(
      o => o.otchotId.toString() !== otchotId
    );

    await car.save();

    res.json({
      success: true,
      message: 'Otchot o‘chirildi',
      data: car.otchots
    });

  } catch (err) {
    errorResponse(res, 500, err.message);
  }
});

/////////////////////////////////////////////////////
// 📥 4. CAR OTCHOTLARINI POPULATE QILIB OLISH
// GET /api/cars/:carId/otchots
/////////////////////////////////////////////////////

router.get('/:carId/otchots', async (req, res) => {
  try {
    const { carId } = req.params;

    const car = await Car.findById(carId)
      .populate('otchots.otchotId');

    if (!car) return errorResponse(res, 404, 'Car topilmadi');

    res.json({
      success: true,
      data: car.otchots
    });

  } catch (err) {
    errorResponse(res, 500, err.message);
  }
});
router.patch('/:carId/otchots/:otchotId', async (req, res) => {
  try {
    const { position, text } = req.body;

    const car = await Car.findById(req.params.carId);
    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Mashina topilmadi'
      });
    }

    const otchot = car.otchots.find(
      o => o.otchotId.toString() === req.params.otchotId
    );

    if (!otchot) {
      return res.status(404).json({
        success: false,
        message: 'Otchot topilmadi'
      });
    }

    if (position) otchot.position = Number(position);
    if (text !== undefined) otchot.text = text;

    await car.save();

    const populated = await Car.findById(req.params.carId)
      .populate('otchots.otchotId');

    res.json({
      success: true,
      message: 'Yangilandi',
      data: populated.otchots
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// =============================================
// POST /api/cars/:carId/sales-history
// Yangi sotuv tarixi qo‘shish
// =============================================
router.post('/:carId/sales-history', async (req, res) => {
  try {
    const { carId } = req.params;
    const {
      price,
      priceDrop = 0,
      probeg = 0,
      title,
      holati,
      region,
      link,
      saleDate // agar frontenddan kelmasa, default Date.now ishlaydi
    } = req.body;

    // Validatsiya
    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri car ID' });
    }

    if (!price || !title) {
      return res.status(400).json({
        success: false,
        message: 'Narx va sarlavha (title) majburiy maydonlar'
      });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    // Yangi yozuv qo‘shish
    const newSale = {
      saleDate: saleDate ? new Date(saleDate) : Date.now(),
      price: Number(price),
      priceDrop: Number(priceDrop),
      probeg: Number(probeg),
      title: title.trim(),
      holati: holati ? holati.trim() : undefined,
      region: region ? region.trim() : undefined,
      link: link ? link.trim() : undefined
    };

    car.salesHistory.push(newSale);
    await car.save();

    // Oxirgi qo‘shilgan yozuvni qaytarish
    const createdSale = car.salesHistory[car.salesHistory.length - 1];

    res.status(201).json({
      success: true,
      message: 'Sotuv tarixi qo‘shildi',
      data: createdSale
    });

  } catch (err) {
    console.error('POST sales-history xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: ' + err.message });
  }
});

// =============================================
// PUT /api/cars/:carId/sales-history/:historyId
// Mavjud sotuv yozuvini yangilash
// =============================================
router.put('/:carId/sales-history/:historyId', async (req, res) => {
  try {
    const { carId, historyId } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(carId) || !mongoose.Types.ObjectId.isValid(historyId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri ID' });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const sale = car.salesHistory.id(historyId);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sotuv tarixi topilmadi' });
    }

    // Faqat kelgan maydonlarni yangilash
    if (updateData.saleDate !== undefined) sale.saleDate = new Date(updateData.saleDate);
    if (updateData.price !== undefined) sale.price = Number(updateData.price);
    if (updateData.priceDrop !== undefined) sale.priceDrop = Number(updateData.priceDrop);
    if (updateData.probeg !== undefined) sale.probeg = Number(updateData.probeg);
    if (updateData.title !== undefined) sale.title = updateData.title.trim();
    if (updateData.holati !== undefined) sale.holati = updateData.holati.trim();
    if (updateData.region !== undefined) sale.region = updateData.region.trim();
    if (updateData.link !== undefined) sale.link = updateData.link.trim();

    await car.save();

    res.json({
      success: true,
      message: 'Sotuv tarixi yangilandi',
      data: sale
    });

  } catch (err) {
    console.error('PUT sales-history xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: ' + err.message });
  }
});

// =============================================
// DELETE /api/cars/:carId/sales-history/:historyId
// Sotuv yozuvini o‘chirish
// =============================================
router.delete('/:carId/sales-history/:historyId', async (req, res) => {
  try {
    const { carId, historyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(carId) || !mongoose.Types.ObjectId.isValid(historyId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri ID' });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const sale = car.salesHistory.id(historyId);
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sotuv tarixi topilmadi' });
    }

    // Yozuvni o‘chirish
    car.salesHistory.pull(historyId);
    await car.save();

    res.json({
      success: true,
      message: 'Sotuv tarixi o‘chirildi',
      remaining: car.salesHistory.length
    });

  } catch (err) {
    console.error('DELETE sales-history xatosi:', err);
    res.status(500).json({ success: false, message: 'Server xatosi: ' + err.message });
  }
});





// POST /api/cars/:carId/valuation
router.post('/:carId/valuation', async (req, res) => {
  try {
    const { carId } = req.params;
    const {
      valuationLow = 0,
      valuationRangeLow = 0,
      valuationRangeHigh = 0,
      valuationHigh = 0,
      currency = 'UZS'
    } = req.body;

    // ID validatsiyasi
    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri car ID' });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    // Minimal validatsiya: kamida bitta narx chegarasi bo‘lishi kerak
    if (
      valuationLow === 0 &&
      valuationRangeLow === 0 &&
      valuationRangeHigh === 0 &&
      valuationHigh === 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Kamida bitta narx chegarasini kiriting'
      });
    }

    // Valyuta faqat UZS yoki USD bo‘lishi kerak
    const validCurrency = currency === 'USD' ? 'USD' : 'UZS';

    // Yangi valuation obyektini yaratish yoki mavjudini almashtirish
    car.valuation = {
      valuationLow: Number(valuationLow),
      valuationRangeLow: Number(valuationRangeLow),
      valuationRangeHigh: Number(valuationRangeHigh),
      valuationHigh: Number(valuationHigh),
      currency: validCurrency
    };

    await car.save();

    res.status(201).json({
      success: true,
      message: 'Narx bahosi saqlandi / yangilandi',
      data: car.valuation
    });

  } catch (err) {
    console.error('POST valuation xatosi:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// GET /api/cars/:carId/valuation
router.get('/:carId/valuation', async (req, res) => {
  try {
    const { carId } = req.params;

    // carId ni tekshirish
    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({
        success: false,
        message: 'Noto‘g‘ri car ID'
      });
    }

    // Mashinani topish (faqat valuation maydonini olamiz)
    const car = await Car.findById(carId).select('valuation').lean();

    if (!car) {
      return res.status(404).json({
        success: false,
        message: 'Mashina topilmadi'
      });
    }

    // Agar valuation mavjud bo‘lmasa yoki bo‘sh bo‘lsa — default qiymatlar bilan qaytaramiz
    const valuation = car.valuation || {
      valuationLow: 0,
      valuationRangeLow: 0,
      valuationRangeHigh: 0,
      valuationHigh: 0,
      currency: 'UZS'
    };

    res.json({
      success: true,
      data: valuation
    });

  } catch (err) {
    console.error('GET valuation xatosi:', {
      carId: req.params.carId,
      error: err.message
    });

    res.status(500).json({
      success: false,
      message: 'Server xatosi yuz berdi'
    });
  }
});

// PUT /api/cars/:carId/valuation
router.put('/:carId/valuation', async (req, res) => {
  try {
    const { carId } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri car ID' });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    // Agar valuation hali yaratilmagan bo‘lsa — xato
    if (!car.valuation || Object.keys(car.valuation).length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bu mashinada hali narx bahosi mavjud emas. Avval POST orqali yarating'
      });
    }

    // Faqat kelgan maydonlarni yangilash
    if (updateData.valuationLow !== undefined) {
      car.valuation.valuationLow = Number(updateData.valuationLow);
    }
    if (updateData.valuationRangeLow !== undefined) {
      car.valuation.valuationRangeLow = Number(updateData.valuationRangeLow);
    }
    if (updateData.valuationRangeHigh !== undefined) {
      car.valuation.valuationRangeHigh = Number(updateData.valuationRangeHigh);
    }
    if (updateData.valuationHigh !== undefined) {
      car.valuation.valuationHigh = Number(updateData.valuationHigh);
    }
    if (updateData.currency !== undefined) {
      car.valuation.currency = updateData.currency === 'USD' ? 'USD' : 'UZS';
    }

    await car.save();

    res.json({
      success: true,
      message: 'Narx bahosi yangilandi',
      data: car.valuation
    });

  } catch (err) {
    console.error('PUT valuation xatosi:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});



// DELETE /api/cars/:carId/valuation
router.delete('/:carId/valuation', async (req, res) => {
  try {
    const { carId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri car ID' });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    car.valuation = {};
    await car.save();

    res.json({
      success: true,
      message: 'Narx bahosi o‘chirildi (bo‘shatildi)',
      data: car.valuation
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// =============================================
// POST /api/cars/:carId/probeg-history
// Yangi probeg yozuvini qo‘shish
// =============================================
router.post('/:carId/probeg-history', async (req, res) => {
  try {
    const { carId } = req.params;
    const { year, kilometer } = req.body;

    // Validatsiya
    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri car ID' });
    }

    if (!year || !kilometer) {
      return res.status(400).json({
        success: false,
        message: 'Yil (year) va kilometr (kilometer) majburiy'
      });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    // Yangi yozuv qo‘shish
    const newProbeg = {
      year: Number(year),
      kilometer: Number(kilometer)
    };

    car.probegHistory.push(newProbeg);
    await car.save();

    // Oxirgi qo‘shilgan yozuvni qaytarish
    const created = car.probegHistory[car.probegHistory.length - 1];

    res.status(201).json({
      success: true,
      message: 'Probeg yozuvi qo‘shildi',
      data: created
    });

  } catch (err) {
    console.error('POST probeg-history xatosi:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// =============================================
// PUT /api/cars/:carId/probeg-history/:probegId
// Mavjud probeg yozuvini yangilash
// =============================================
router.put('/:carId/probeg-history/:probegId', async (req, res) => {
  try {
    const { carId, probegId } = req.params;
    const { year, kilometer } = req.body;

    if (!mongoose.Types.ObjectId.isValid(carId) || !mongoose.Types.ObjectId.isValid(probegId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri ID' });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const probeg = car.probegHistory.id(probegId);
    if (!probeg) {
      return res.status(404).json({ success: false, message: 'Probeg yozuvi topilmadi' });
    }

    // Yangilash (faqat kelgan maydonlar)
    if (year !== undefined) probeg.year = Number(year);
    if (kilometer !== undefined) probeg.kilometer = Number(kilometer);

    await car.save();

    res.json({
      success: true,
      message: 'Probeg yozuvi yangilandi',
      data: probeg
    });

  } catch (err) {
    console.error('PUT probeg-history xatosi:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// =============================================
// DELETE /api/cars/:carId/probeg-history/:probegId
// Probeg yozuvini o‘chirish
// =============================================
router.delete('/:carId/probeg-history/:probegId', async (req, res) => {
  try {
    const { carId, probegId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(carId) || !mongoose.Types.ObjectId.isValid(probegId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri ID' });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const exists = car.probegHistory.id(probegId);
    if (!exists) {
      return res.status(404).json({ success: false, message: 'Probeg yozuvi topilmadi' });
    }

    car.probegHistory.pull(probegId);
    await car.save();

    res.json({
      success: true,
      message: 'Probeg yozuvi o‘chirildi',
      remaining: car.probegHistory.length
    });

  } catch (err) {
    console.error('DELETE probeg-history xatosi:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// GET /api/cars/:carId/probeg-history
router.get('/:carId/probeg-history', async (req, res) => {
  try {
    const { carId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri car ID' });
    }

    const car = await Car.findById(carId).select('probegHistory').lean();

    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    // Yil bo‘yicha tartiblash (eng yangisi yuqorida)
    const history = (car.probegHistory || [])
      .sort((a, b) => b.year - a.year)
      .map(p => ({
        _id: p._id.toString(),
        year: p.year,
        kilometer: p.kilometer,
        createdAt: p.createdAt ? p.createdAt.toISOString() : null,
        updatedAt: p.updatedAt ? p.updatedAt.toISOString() : null
      }));

    res.json({
      success: true,
      data: history
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});





// =============================================
// POST /api/cars/:carId/exploitation-history
// Yangi foydalanish yozuvini qo‘shish
// =============================================
router.post('/:carId/exploitation-history', async (req, res) => {
  try {
    const { carId } = req.params;
    const {
      startDate,
      endDate,
      startKilometer = 0,
      endKilometer = 0,
      title,
      description = '',
      location = ''
    } = req.body;

    // Validatsiya
    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri car ID' });
    }

    if (!startDate || !title) {
      return res.status(400).json({
        success: false,
        message: 'Boshlanish sanasi (startDate) va sarlavha (title) majburiy'
      });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    // Yangi yozuv
    const newRecord = {
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      startKilometer: Number(startKilometer),
      endKilometer: Number(endKilometer),
      title: title.trim(),
      description: description.trim(),
      location: location.trim()
    };

    car.exploitationHistory.push(newRecord);
    await car.save();

    // Oxirgi qo‘shilgan yozuvni qaytarish
    const created = car.exploitationHistory[car.exploitationHistory.length - 1];

    res.status(201).json({
      success: true,
      message: 'Foydalanish yozuvi qo‘shildi',
      data: created
    });

  } catch (err) {
    console.error('POST exploitation-history xatosi:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// =============================================
// PUT /api/cars/:carId/exploitation-history/:recordId
// Mavjud yozuvni yangilash
// =============================================
router.put('/:carId/exploitation-history/:recordId', async (req, res) => {
  try {
    const { carId, recordId } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(carId) || !mongoose.Types.ObjectId.isValid(recordId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri ID' });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const record = car.exploitationHistory.id(recordId);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Foydalanish yozuvi topilmadi' });
    }

    // Faqat kelgan maydonlarni yangilash
    if (updateData.startDate !== undefined) record.startDate = new Date(updateData.startDate);
    if (updateData.endDate !== undefined) record.endDate = updateData.endDate ? new Date(updateData.endDate) : null;
    if (updateData.startKilometer !== undefined) record.startKilometer = Number(updateData.startKilometer);
    if (updateData.endKilometer !== undefined) record.endKilometer = Number(updateData.endKilometer);
    if (updateData.title !== undefined) record.title = updateData.title.trim();
    if (updateData.description !== undefined) record.description = updateData.description.trim();
    if (updateData.location !== undefined) record.location = updateData.location.trim();

    await car.save();

    res.json({
      success: true,
      message: 'Foydalanish yozuvi yangilandi',
      data: record
    });

  } catch (err) {
    console.error('PUT exploitation-history xatosi:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// =============================================
// DELETE /api/cars/:carId/exploitation-history/:recordId
// Yozuvni o‘chirish
// =============================================
router.delete('/:carId/exploitation-history/:recordId', async (req, res) => {
  try {
    const { carId, recordId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(carId) || !mongoose.Types.ObjectId.isValid(recordId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri ID' });
    }

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    const exists = car.exploitationHistory.id(recordId);
    if (!exists) {
      return res.status(404).json({ success: false, message: 'Yozuv topilmadi' });
    }

    car.exploitationHistory.pull(recordId);
    await car.save();

    res.json({
      success: true,
      message: 'Foydalanish yozuvi o‘chirildi',
      remaining: car.exploitationHistory.length
    });

  } catch (err) {
    console.error('DELETE exploitation-history xatosi:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// =============================================
// Qo‘shimcha: GET — barcha foydalanish tarixini olish
// GET /api/cars/:carId/exploitation-history
// =============================================
router.get('/:carId/exploitation-history', async (req, res) => {
  try {
    const { carId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({ success: false, message: 'Noto‘g‘ri car ID' });
    }

    const car = await Car.findById(carId)
      .select('exploitationHistory')
      .lean();

    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    // Sana bo‘yicha tartiblash (eng yangisi yuqorida)
    const history = (car.exploitationHistory || [])
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
      .map(record => ({
        _id: record._id.toString(),
        startDate: record.startDate ? record.startDate.toISOString() : null,
        endDate: record.endDate ? record.endDate.toISOString() : null,
        startKilometer: record.startKilometer || 0,
        endKilometer: record.endKilometer || 0,
        title: record.title || '',
        description: record.description || '',
        location: record.location || '',
        createdAt: record.createdAt ? record.createdAt.toISOString() : null,
        updatedAt: record.updatedAt ? record.updatedAt.toISOString() : null
      }));

    res.json({
      success: true,
      data: history
    });

  } catch (err) {
    console.error('GET exploitation-history xatosi:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});
module.exports = router;
