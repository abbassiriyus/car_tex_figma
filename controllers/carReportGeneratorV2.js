const Car = require('./models/Car');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

/**
 * VIN kod orqali avtomobil hisobotini PDF formatda yaratish
 * @param {string} vin - Mashina VIN kodi
 * @param {string} outputPath - PDF fayl saqlanadigan joy (ixtiyoriy)
 * @returns {Promise<string>} - Yaratilgan PDF fayl yo'li
 */
async function generateCarPDFReport(vin, outputPath = null) {
  try {
    // 1. Ma'lumotlar bazasidan ma'lumot olish
    const car = await Car.findOne({ vin })
      .populate('legalRisks.riskId')
      .populate('otchots.otchotId')
      .populate('features.featureId')
      .exec();

    if (!car) {
      throw new Error(`VIN kod ${vin} topilmadi`);
    }

    // 2. Output path sozlash
    if (!outputPath) {
      outputPath = path.join(__dirname, 'reports', `car_report_${vin}_${Date.now()}.pdf`);
    }

    const reportsDir = path.dirname(outputPath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // 3. QR kod yaratish
    const reportUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/api/car-report/${vin}`;
    const qrCodeDataUrl = await QRCode.toDataURL(reportUrl, {
      width: 150,
      margin: 1
    });

    // 4. PDF Document yaratish
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
      info: {
        Title: `Avtomobil hisoboti - ${car.carName}`,
        Author: 'Car Report System',
        Subject: `VIN: ${vin}`
      }
    });

    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    // ============================================
    // SAHIFA 1: ASOSIY MA'LUMOTLAR
    // ============================================
    
    // Header - mashina nomi va yil
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .fillColor('#1a1a1a')
       .text(`${car.carName}, 2020`, 40, 40);

    // Sana
    doc.fontSize(10)
       .font('Helvetica')
       .fillColor('#666666')
       .text(`ot ${formatDate(new Date())}`, 40, 75);

    // QR kod (o'ng tomonda)
    const qrBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
    doc.image(qrBuffer, doc.page.width - 150, 40, { width: 100 });

    // Asosiy blok
    doc.moveDown(3);
    let yPos = 120;

    // Asosiy ma'lumotlar bo'limi
    drawSectionHeader(doc, 'Asosiy ma\'lumotlar', yPos);
    yPos += 30;

    // VIN, Gos nomer va boshqalar
    const mainData = [
      { label: 'VIN', value: car.vin },
      { label: 'Davlat raqami', value: car.gosNumber },
      { label: 'Dvigatel raqami', value: car.engineNumber },
      { label: 'STS raqami', value: car.stsNumber },
      { label: 'Mashina turi', value: car.carType },
      { label: 'Rang', value: car.color },
      { label: 'Dvigatel', value: car.engine }
    ];

    mainData.forEach(item => {
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#666666')
         .text(item.label, 40, yPos, { width: 150, continued: true })
         .font('Helvetica-Bold')
         .fillColor('#1a1a1a')
         .text(item.value);
      yPos += 20;
    });

    // Yuridik risklar bo'limi
    yPos += 20;
    drawSectionHeader(doc, 'Yuridik risklar', yPos);
    yPos += 30;

    if (car.legalRisks && car.legalRisks.length > 0) {
      car.legalRisks.forEach(risk => {
        const color = risk.position === 1 ? '#ef4444' : risk.position === 2 ? '#f59e0b' : '#3b82f6';
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(color)
           .text(`• ${risk.riskId?.name || 'Noma\'lum'}`, 40, yPos);
        yPos += 20;
      });
    } else {
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#10b981')
         .text('✓ Yuridik risklar topilmadi', 40, yPos);
      yPos += 20;
    }

    // ============================================
    // SAHIFA 2: PROBEG VA BAHOLASH
    // ============================================
    doc.addPage();
    yPos = 40;

    // Probeg grafigi
    if (car.probegHistory && car.probegHistory.length > 0) {
      drawSectionHeader(doc, 'Probeg tarixi', yPos);
      yPos += 40;

      // Probeg jadval
      const tableTop = yPos;
      const cellWidth = (doc.page.width - 80) / 2;
      
      // Jadval header
      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor('#666666')
         .text('Yil', 40, tableTop, { width: cellWidth })
         .text('Probeg', 40 + cellWidth, tableTop, { width: cellWidth });

      yPos += 20;

      // Jadval qatorlari
      car.probegHistory.slice(-10).forEach((probeg, index) => {
        const bgColor = index % 2 === 0 ? '#f9fafb' : '#ffffff';
        doc.rect(40, yPos - 5, doc.page.width - 80, 20)
           .fillAndStroke(bgColor, '#e5e7eb');

        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#1a1a1a')
           .text(probeg.year, 45, yPos, { width: cellWidth - 10 })
           .text(`${probeg.kilometer.toLocaleString('uz-UZ')} km`, 45 + cellWidth, yPos, { width: cellWidth - 10 });
        
        yPos += 20;
      });

      yPos += 30;
    }

    // Baholash ma'lumotlari
    if (car.valuation && Object.keys(car.valuation).length > 0) {
      drawSectionHeader(doc, 'Baho ma\'lumotlari', yPos);
      yPos += 30;

      const valuation = car.valuation;
      
      // Narx oralig'i
      if (valuation.valuationRangeLow && valuation.valuationRangeHigh) {
        doc.fontSize(11)
           .font('Helvetica')
           .fillColor('#666666')
           .text('Bizning bahomiz', 40, yPos);
        
        yPos += 25;
        
        doc.fontSize(18)
           .font('Helvetica-Bold')
           .fillColor('#1a1a1a')
           .text(`${formatCurrency(valuation.valuationRangeLow, valuation.currency)} - ${formatCurrency(valuation.valuationRangeHigh, valuation.currency)}`, 40, yPos);
        
        yPos += 40;
      }

      // Qo'shimcha narxlar
      const priceData = [
        { label: 'Eng past', value: valuation.valuationLow, color: '#ef4444' },
        { label: 'Eng yuqori', value: valuation.valuationHigh, color: '#10b981' }
      ];

      priceData.forEach(item => {
        if (item.value) {
          doc.fontSize(10)
             .font('Helvetica')
             .fillColor('#666666')
             .text(item.label, 40, yPos, { width: 150, continued: true })
             .font('Helvetica-Bold')
             .fillColor(item.color)
             .text(formatCurrency(item.value, valuation.currency));
          yPos += 25;
        }
      });
    }

    // ============================================
    // SAHIFA 3: SOTUV TARIXI
    // ============================================
    if (car.salesHistory && car.salesHistory.length > 0) {
      doc.addPage();
      yPos = 40;

      drawSectionHeader(doc, 'Sotuv tarixi', yPos);
      yPos += 40;

      car.salesHistory.forEach((sale, index) => {
        // Sale card
        const cardHeight = 100;
        doc.roundedRect(40, yPos, doc.page.width - 80, cardHeight, 5)
           .fillAndStroke('#f9fafb', '#e5e7eb');

        // Sana
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#666666')
           .text(formatDate(sale.saleDate), 50, yPos + 10);

        // Sarlavha
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#1a1a1a')
           .text(sale.title, 50, yPos + 30, { width: doc.page.width - 140 });

        // Narx
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .fillColor('#10b981')
           .text(`${sale.price.toLocaleString('uz-UZ')} so'm`, 50, yPos + 55);

        // Probeg
        if (sale.probeg) {
          doc.fontSize(10)
             .font('Helvetica')
             .fillColor('#666666')
             .text(`Probeg: ${sale.probeg.toLocaleString('uz-UZ')} km`, 50, yPos + 75);
        }

        // Hudud
        if (sale.region) {
          doc.fontSize(10)
             .fillColor('#666666')
             .text(sale.region, doc.page.width - 150, yPos + 10, { width: 100, align: 'right' });
        }

        yPos += cardHeight + 15;

        // Yangi sahifa kerak bo'lsa
        if (yPos > doc.page.height - 100 && index < car.salesHistory.length - 1) {
          doc.addPage();
          yPos = 40;
        }
      });
    }

    // ============================================
    // SAHIFA 4: DTP VA ZARAR TARIXI
    // ============================================
    if (car.damageHistory && car.damageHistory.length > 0) {
      doc.addPage();
      yPos = 40;

      drawSectionHeader(doc, '⚠ DTP va zarar tarixi', yPos, '#ef4444');
      yPos += 40;

      car.damageHistory.forEach((damage, index) => {
        // Damage card
        const cardHeight = 130;
        doc.roundedRect(40, yPos, doc.page.width - 80, cardHeight, 5)
           .fillAndStroke('#fef2f2', '#fecaca');

        // Sana
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#991b1b')
           .text(formatDate(damage.damageDate), 50, yPos + 10);

        // Tur
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#dc2626')
           .text(damage.damageType, 50, yPos + 30);

        // Daraja
        if (damage.daraja) {
          doc.fontSize(10)
             .font('Helvetica')
             .fillColor('#991b1b')
             .text(`Daraja: ${damage.daraja}`, 50, yPos + 50);
        }

        // Xarajatlar
        let expenseY = yPos + 70;
        if (damage.rasxot_remont) {
          doc.fontSize(10)
             .font('Helvetica')
             .fillColor('#666666')
             .text(`Ta'mirlash: ${damage.rasxot_remont.toLocaleString('uz-UZ')} so'm`, 50, expenseY);
          expenseY += 20;
        }

        if (damage.rasxot_kuzup) {
          doc.fontSize(10)
             .fillColor('#666666')
             .text(`Kuzov: ${damage.rasxot_kuzup.toLocaleString('uz-UZ')} so'm`, 50, expenseY);
        }

        yPos += cardHeight + 15;

        if (yPos > doc.page.height - 100 && index < car.damageHistory.length - 1) {
          doc.addPage();
          yPos = 40;
        }
      });
    }

    // ============================================
    // SAHIFA 5: FOYDALANISH TARIXI
    // ============================================
    if (car.exploitationHistory && car.exploitationHistory.length > 0) {
      doc.addPage();
      yPos = 40;

      drawSectionHeader(doc, 'Foydalanish tarixi', yPos);
      yPos += 40;

      car.exploitationHistory.forEach((exp, index) => {
        const cardHeight = 110;
        doc.roundedRect(40, yPos, doc.page.width - 80, cardHeight, 5)
           .fillAndStroke('#eff6ff', '#bfdbfe');

        // Sarlavha
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .fillColor('#1e40af')
           .text(exp.title, 50, yPos + 10);

        // Davr
        const period = `${formatDate(exp.startDate)} - ${exp.endDate ? formatDate(exp.endDate) : 'Davom etmoqda'}`;
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#3b82f6')
           .text(period, 50, yPos + 35);

        // Probeg
        if (exp.startKilometer) {
          const probegText = exp.endKilometer 
            ? `${exp.startKilometer.toLocaleString('uz-UZ')} - ${exp.endKilometer.toLocaleString('uz-UZ')} km`
            : `${exp.startKilometer.toLocaleString('uz-UZ')} km dan`;
          
          doc.fontSize(10)
             .font('Helvetica')
             .fillColor('#1e40af')
             .text(`Probeg: ${probegText}`, 50, yPos + 55);
        }

        // Tavsif
        if (exp.description) {
          doc.fontSize(9)
             .font('Helvetica')
             .fillColor('#64748b')
             .text(exp.description, 50, yPos + 75, { width: doc.page.width - 120 });
        }

        yPos += cardHeight + 15;

        if (yPos > doc.page.height - 100 && index < car.exploitationHistory.length - 1) {
          doc.addPage();
          yPos = 40;
        }
      });
    }

    // ============================================
    // OXIRGI SAHIFA: JARIMA VA QR KOD
    // ============================================
    doc.addPage();
    yPos = 40;

    // Jarima tarixi
    if (car.shtrafEvents && car.shtrafEvents.length > 0) {
      drawSectionHeader(doc, '🚨 Jarima tarixi', yPos, '#ef4444');
      yPos += 40;

      car.shtrafEvents.forEach((shtraf, index) => {
        doc.fontSize(11)
           .font('Helvetica-Bold')
           .fillColor('#dc2626')
           .text(`• ${shtraf.title}`, 40, yPos);
        
        yPos += 20;

        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#666666')
           .text(`Sana: ${formatDate(shtraf.date)}`, 50, yPos);
        
        yPos += 20;

        doc.fontSize(9)
           .fillColor('#64748b')
           .text(shtraf.text, 50, yPos, { width: doc.page.width - 100 });
        
        yPos += 35;
      });

      yPos += 20;
    }

    // Footer - QR kod va ma'lumot
    const footerY = doc.page.height - 150;
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#1a1a1a')
       .text('Hisobotni qayta yuklash', 40, footerY, { align: 'center' });

    doc.fontSize(9)
       .font('Helvetica')
       .fillColor('#666666')
       .text('QR kodni skanerlang yoki quyidagi havolaga kiring', 40, footerY + 25, { align: 'center' });

    // QR kod markazda
    const qrX = (doc.page.width - 100) / 2;
    doc.image(qrBuffer, qrX, footerY + 45, { width: 100 });

    // Havola
    doc.fontSize(8)
       .fillColor('#3b82f6')
       .text(reportUrl, 40, footerY + 155, { 
         align: 'center', 
         link: reportUrl,
         underline: true 
       });

    // PDF ni tugatish
    doc.end();

    // Yozish tugashini kutish
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    console.log(`✅ PDF muvaffaqiyatli yaratildi: ${outputPath}`);
    return outputPath;

  } catch (error) {
    console.error('❌ PDF yaratishda xatolik:', error);
    throw error;
  }
}

// ============================================
// YORDAMCHI FUNKSIYALAR
// ============================================

/**
 * Bo'lim sarlavhasini chizish
 */
function drawSectionHeader(doc, title, y, color = '#1a1a1a') {
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(color)
     .text(title, 40, y);
  
  // Chiziq
  doc.moveTo(40, y + 22)
     .lineTo(doc.page.width - 40, y + 22)
     .strokeColor('#e5e7eb')
     .lineWidth(1)
     .stroke();
}

/**
 * Sanani formatlash
 */
function formatDate(date) {
  if (!date) return 'Noma\'lum';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Pul birligini formatlash
 */
function formatCurrency(amount, currency = 'UZS') {
  if (!amount) return '0';
  const formatted = amount.toLocaleString('uz-UZ');
  return currency === 'USD' ? `$${formatted}` : `${formatted} so'm`;
}

/**
 * Matnni kesish (overflow uchun)
 */
function truncateText(text, maxLength = 100) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

module.exports = { generateCarPDFReport };
