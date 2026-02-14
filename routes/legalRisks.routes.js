const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const LegalRisk = require('../models/LegalRisk');

// Helper
const errorResponse = (res, status, message) => res.status(status).json({ success: false, message });

// CREATE
router.post('/',
  body('title').notEmpty().withMessage('Title majburiy'),
  body('text').notEmpty().withMessage('Text majburiy'),
  body('order').optional().isInt({ min: 0 }).withMessage('Order musbat son bo‘lishi kerak'),
  async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(422).json({ success:false, errors: errors.array() });

    try{
      const { title, text, order } = req.body;
      const risk = await LegalRisk.create({ title, text, order });
      res.status(201).json({ success:true, message:'LegalRisk yaratildi', data: risk });
    }catch(err){
      errorResponse(res,500,err.message);
    }
  }
);


// GET ALL
router.get('/', async (req,res)=>{
  try{
    const risks = await LegalRisk.find().sort({ order: 1, createdAt: -1 });
    res.json({ success:true, count: risks.length, data: risks });
  }catch(err){
    errorResponse(res,500,err.message);
  }
});


// GET ONE
router.get('/:id',
  param('id').custom(v=>mongoose.Types.ObjectId.isValid(v)).withMessage('Noto‘g‘ri ID'),
  async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(422).json({ success:false, errors: errors.array() });

    try{
      const risk = await LegalRisk.findById(req.params.id);
      if(!risk) return errorResponse(res,404,'LegalRisk topilmadi');
      res.json({ success:true, data: risk });
    }catch(err){
      errorResponse(res,500,err.message);
    }
  }
);


// UPDATE
router.put('/:id',
  param('id').custom(v=>mongoose.Types.ObjectId.isValid(v)).withMessage('Noto‘g‘ri ID'),
  body('title').optional().notEmpty(),
  body('text').optional().notEmpty(),
  body('order').optional().isInt({ min: 0 }),
  async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(422).json({ success:false, errors: errors.array() });

    try{
      const risk = await LegalRisk.findByIdAndUpdate(
        req.params.id,
        { ...req.body },
        { new:true, runValidators:true }
      );
      if(!risk) return errorResponse(res,404,'LegalRisk topilmadi');
      res.json({ success:true, message:'Yangilandi', data: risk });
    }catch(err){
      errorResponse(res,500,err.message);
    }
  }
);


// DELETE
router.delete('/:id',
  param('id').custom(v=>mongoose.Types.ObjectId.isValid(v)).withMessage('Noto‘g‘ri ID'),
  async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()) return res.status(422).json({ success:false, errors: errors.array() });

    try{
      const risk = await LegalRisk.findByIdAndDelete(req.params.id);
      if(!risk) return errorResponse(res,404,'LegalRisk topilmadi');
      res.json({ success:true, message:'O‘chirildi' });
    }catch(err){
      errorResponse(res,500,err.message);
    }
  }
);


module.exports = router;
