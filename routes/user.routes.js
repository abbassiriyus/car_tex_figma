const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { nanoid } = require('nanoid');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');

// Helper: error response
const errorResponse = (res, status, message) => {
  return res.status(status).json({ success: false, message });
};

// CREATE USER (Register)
router.post('/',
  body('name').notEmpty().withMessage('Ism majburiy'),
  body('phone').notEmpty().withMessage('Telefon majburiy'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
      const { name, phone } = req.body;

      const exist = await User.findOne({ phone });
      if (exist) {
        return errorResponse(res, 409, 'Bu telefon raqam allaqachon mavjud');
      }

      const verifyCode = nanoid(6);

      const user = await User.create({
        name,
        phone,
        verifyCode
      });

      res.status(201).json({
        success: true,
        message: 'Foydalanuvchi yaratildi',
        data: user
      });

    } catch (err) {
      errorResponse(res, 500, err.message);
    }
  }
);

// GET ALL USERS
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-verifyCode');
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    errorResponse(res, 500, err.message);
  }
});

// GET ONE USER
router.get('/:id',
  param('id').custom(v => mongoose.Types.ObjectId.isValid(v)).withMessage('Noto‘g‘ri ID'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    try {
      const user = await User.findById(req.params.id).select('-verifyCode');
      if (!user) return errorResponse(res, 404, 'Foydalanuvchi topilmadi');

      res.json({ success: true, data: user });
    } catch (err) {
      errorResponse(res, 500, err.message);
    }
  }
);

// UPDATE USER
router.put('/:id',
  param('id').custom(v => mongoose.Types.ObjectId.isValid(v)).withMessage('Noto‘g‘ri ID'),

  async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).select('-verifyCode');

      if (!user) return errorResponse(res, 404, 'Foydalanuvchi topilmadi');

      res.json({ success: true, message: 'Yangilandi', data: user });
    } catch (err) {
      errorResponse(res, 500, err.message);
    }
  }
);

// DELETE USER
router.delete('/:id',
  param('id').custom(v => mongoose.Types.ObjectId.isValid(v)).withMessage('Noto‘g‘ri ID'),

  async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) return errorResponse(res, 404, 'Foydalanuvchi topilmadi');

      res.json({ success: true, message: 'O‘chirildi' });
    } catch (err) {
      errorResponse(res, 500, err.message);
    }
  }
);
router.post('/register', async (req, res) => {
  try {
    const { name, phone } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success:false, message:'Ism va telefon majburiy' });
    }

    const exist = await User.findOne({ phone });
    if (exist) {
      return res.status(409).json({ success:false, message:'Bu raqam band' });
    }

    const verifyCode = "12345";

    const user = await User.create({
      name,
      phone,
      verifyCode,
      verifyExpire: Date.now() + 5 * 60 * 1000,
      verifyAttempts: 0
    });

    res.status(201).json({
      success: true,
      message: 'Kod yuborildi',
      code: verifyCode // ❗ test uchun, prod da olib tashlanadi
    });

  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
});

router.post('/resend-code', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ success:false, message:'Telefon majburiy' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ success:false, message:'Topilmadi' });
    }

    const verifyCode = "12345";

    user.verifyCode = verifyCode;
    user.verifyExpire = Date.now() + 5 * 60 * 1000;
    user.verifyAttempts = 0;

    await user.save();

    res.json({
      success: true,
      message: 'Yangi kod yuborildi',
      code: verifyCode // ❗ test uchun
    });

  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({
        success:false,
        message:'Telefon va kod majburiy'
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ success:false, message:'Topilmadi' });
    }

  

    if (user.verifyAttempts >= 5) {
      return res.status(429).json({
        success:false,
        message:'Juda ko‘p urinish. Keyinroq urinib ko‘ring.'
      });
    }

    if (user.verifyExpire < Date.now()) {
      return res.status(400).json({
        success:false,
        message:'Kod muddati tugagan'
      });
    }

    if (user.verifyCode !== code) {
      user.verifyAttempts += 1;
      await user.save();

      return res.status(400).json({
        success:false,
        message:'Kod noto‘g‘ri'
      });
    }

    user.isVerified = true;
    user.verifyCode = null;
    user.verifyExpire = null;
    user.verifyAttempts = 0;

    await user.save();

    res.json({
      user:user,
      success:true,
      message:'Muvaffaqiyatli tasdiqlandi'
    });

  } catch (err) {
    res.status(500).json({
      success:false,
      message: err.message
    });
  }
});


    
module.exports = router;
