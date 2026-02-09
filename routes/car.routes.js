const express = require('express');
const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const router = express.Router();

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


// ➕ Feature biriktirish POST /api/cars/:id/features
router.post('/:id/features', async (req, res) => {
  try {
    const { featureId, text } = req.body;

    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ success: false, message: 'Car topilmadi' });

    // Duplicate bo‘lmasin
    const exist = car.features.find(
      f => f.featureId.toString() === featureId
    );
    if (exist) {
      return res.status(409).json({
        success: false,
        message: 'Bu xususiyat allaqachon biriktirilgan'
      });
    }

    car.features.push({ featureId, text });
    await car.save();

    res.status(201).json({
      success: true,
      message: 'Xususiyat biriktirildi',
      data: car.features
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/cars/:id/features/:featureId Feature text yangilash
router.put('/:id/features/:featureId', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ success: false, message: 'Car topilmadi' });

    const feature = car.features.find(
      f => f.featureId.toString() === req.params.featureId
    );

    if (!feature) {
      return res.status(404).json({ success: false, message: 'Xususiyat topilmadi' });
    }

    feature.text = req.body.text ?? feature.text;

    await car.save();

    res.json({
      success: true,
      message: 'Yangilandi',
      data: car.features
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ❌ Feature olib tashlash DELETE /api/cars/:id/features/:featureId
router.delete('/:id/features/:featureId', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ success: false, message: 'Car topilmadi' });

    car.features = car.features.filter(
      f => f.featureId.toString() !== req.params.featureId
    );

    await car.save();

    res.json({
      success: true,
      message: 'Xususiyat olib tashlandi'
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
