const express = require('express');
const router = express.Router();
const { generateReportPDF } = require('../controllers/reportController');

router.get('/report/pdf/:vin', generateReportPDF);

module.exports = router;