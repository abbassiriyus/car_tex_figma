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
router.post(
  '/:id/images',
  upload.single('image'),
  async (req, res) => {
    try {
      const { label, isDamaged } = req.body;

      if (!req.file) {
        return errorResponse(res, 400, 'Rasm majburiy');
      }

      const car = await Car.findById(req.params.id);
      if (!car) return errorResponse(res, 404, 'Car topilmadi');

      const imageUrl = getImageUrl(req, req.file);

      const newImage = {
        url: imageUrl,
        label: label || '',
        isDamaged: isDamaged === 'true' || isDamaged === true
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

    // serverdan faylni o‘chirish
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


//❌ BARCHA IMAGELARNI O‘CHIRISH DELETE /api/cars/:id/images/all


router.delete('/:id/images/all', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return errorResponse(res, 404, 'Car topilmadi');

    // Har bir rasmni serverdan o‘chirish
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


router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Qidiruv parametri majburiy'
      });
    }

    const cars = await Car.find({
      $or: [
        { vin: { $regex: q, $options: 'i' } },
        { gosNumber: { $regex: q, $options: 'i' } },
        { engineNumber: { $regex: q, $options: 'i' } }
      ]
    })
    .populate('features.featureId', 'title image order') // 👈 SHU MUHIM
    .populate('legalRisks.riskId') // agar risk ham kerak bo‘lsa
    .sort({ createdAt: -1 })
    .lean(); // optional, performance uchun

    res.json({
      success: true,
      count: cars.length,
      data: cars
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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


//  📥 Car + features + iconlar bilan olish

router.get('/:id', async (req, res) => {
  const car = await Car.findById(req.params.id)
    .populate('features.featureId');

  res.json({ success: true, data: car });
});

// ➕ Risk biriktirish POST /api/cars/:id/legal-risks
router.post('/:id/legal-risks', async (req, res) => {
  try {
    const { riskId, position } = req.body;

    if (![1,2,3].includes(position)) {
      return res.status(400).json({ success:false, message:'Position 1,2,3 bo‘lishi kerak' });
    }

    const car = await Car.findById(req.params.id);
    if(!car) return res.status(404).json({ success:false, message:'Car topilmadi' });

    const exist = car.legalRisks.find(lr => lr.riskId.toString() === riskId);
    if(exist) return res.status(409).json({ success:false, message:'Bu risk allaqachon biriktirilgan' });

    car.legalRisks.push({ riskId, position });
    await car.save();

    res.status(201).json({ success:true, message:'Risk biriktirildi', data: car.legalRisks });
  } catch(err){
    res.status(500).json({ success:false, message:err.message });
  }
});

//✏️ Risk pozitsiyasini yangilash  PUT /api/cars/:id/legal-risks/:riskId
router.put('/:id/legal-risks/:riskId', async (req,res)=>{
  try {
    const { position } = req.body;
    if (![1,2,3].includes(position)) return res.status(400).json({ success:false, message:'Position 1,2,3 bo‘lishi kerak' });

    const car = await Car.findById(req.params.id);
    if(!car) return res.status(404).json({ success:false, message:'Car topilmadi' });

    const risk = car.legalRisks.find(lr=>lr.riskId.toString()===req.params.riskId);
    if(!risk) return res.status(404).json({ success:false, message:'Risk topilmadi' });

    risk.position = position;
    await car.save();

    res.json({ success:true, message:'Yangilandi', data: car.legalRisks });

  } catch(err){
    res.status(500).json({ success:false, message:err.message });
  }
});

// ❌ Riskni olib tashlash  DELETE /api/cars/:id/legal-risks/:riskId

router.delete('/:id/legal-risks/:riskId', async (req,res)=>{
  try{
    const car = await Car.findById(req.params.id);
    if(!car) return res.status(404).json({ success:false, message:'Car topilmadi' });

    car.legalRisks = car.legalRisks.filter(lr=>lr.riskId.toString()!==req.params.riskId);
    await car.save();

    res.json({ success:true, message:'Risk olib tashlandi' });
  } catch(err){
    res.status(500).json({ success:false, message:err.message });
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


router.get('/:id', async (req,res)=>{
  try {
    const car = await Car.findById(req.params.id)
      .populate('legalRisks.riskId'); // legalRisks ichidagi riskIdni to‘liq fetch qiladi

    if(!car) return res.status(404).json({ success:false, message:'Car topilmadi' });

    // To‘liq frontend friendly response
    const response = {
      _id: car._id,
      carName: car.carName,
      vin: car.vin,
      gosNumber: car.gosNumber,
      images: car.images,
      legalRisks: car.legalRisks.map(lr => ({
        _id: lr.riskId._id,
        title: lr.riskId.title,
        text: lr.riskId.text,
        position: lr.position
      }))
    };

    res.json({ success:true, data: response });

  } catch(err){
    res.status(500).json({ success:false, message: err.message });
  }
})
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

module.exports = router;
