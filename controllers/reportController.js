// controllers/reportController.js
const puppeteer = require('puppeteer');
const QRCode = require('qrcode');
const Car = require('../models/Car');

exports.generateReportPDF = async (req, res) => {
  let browser = null;
  try {
    const { vin } = req.params;
    const car = await Car.findOne({ vin: vin.toUpperCase() })
      .populate('legalRisks.riskId features.featureId otchots.otchotId');

    if (!car) {
      return res.status(404).json({ success: false, message: 'Mashina topilmadi' });
    }

    // QR kod (dataURL — base64)
    const reportUrl = `https://avtotekshiruv.uz/report?vin=${car.vin}`;
    const qrDataUrl = await QRCode.toDataURL(reportUrl, {
      width: 180,
      margin: 1,
      errorCorrectionLevel: 'H',
      color: { dark: '#000', light: '#fff' }
    });

    // To‘liq HTML generatsiya qilamiz
    const html = generateFullReportHTML(car, qrDataUrl);

    // Puppeteer (2025-2026 eng barqaror sozlamalar)
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--font-render-hinting=medium',
        '--force-color-profile=srgb'
      ],
      timeout: 90000
    });

    const page = await browser.newPage();

    // Rasmlar va fontlar to‘g‘ri yuklanishi uchun
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'ru-RU,uz-UZ' });
    await page.setViewport({ width: 1280, height: 800 });

    await page.setContent(html, {
      waitUntil: ['load', 'networkidle0'],
      timeout: 90000
    });

    // PDF yaratish
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '8mm', right: '8mm', bottom: '10mm', left: '8mm' },
      scale: 0.94,
      preferCSSPageSize: true,
      timeout: 120000
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Avtotex_${car.vin}.pdf"`,
      'Cache-Control': 'no-cache'
    });
    res.send(pdfBuffer);

  } catch (err) {
    console.error('PDF xatoligi:', err);
    if (browser) await browser.close();
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'PDF yaratishda xatolik' });
    }
  }
};

// ==================================================================
//                     TO‘LIQ HTML SHABLON
// ==================================================================
function generateFullReportHTML(car, qrDataUrl) {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://avtotekshiruv.uz' 
    : 'http://localhost:5000';

  // ────────────────────────────────────────────────
  // Расмлар ва логотип
  // ────────────────────────────────────────────────
  const logo          = `${baseUrl}/img/logo.jpg`;
  const noPhoto       = `${baseUrl}/img/no-photo.jpg`;
  const defaultCar    = `${baseUrl}/img/default-car.png`;

  // Форматирование
  const fNum   = n => Number(n || 0).toLocaleString('ru-RU');
  const fDate  = d => d ? new Date(d).toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' }) : '—';
  const fShort = d => d ? new Date(d).toLocaleDateString('ru-RU') : '—';
  const fMoney = n => n ? fNum(n) + ' сум' : '—';

  // ────────────────────────────────────────────────
  // ЦЕНА
  // ────────────────────────────────────────────────
  const val = car.valuation || {};
  const currency = val.currency || 'сум';

  const priceLow   = `До ${fNum(val.valuationLow)} ${currency}`;
  const priceRange = `${fNum(val.valuationRangeLow || 0)} — ${fNum(val.valuationRangeHigh || 0)} ${currency}`;
  const priceHigh  = `От ${fNum(val.valuationHigh)} ${currency}`;

  const priceMain = val.valuationRangeLow && val.valuationRangeHigh
    ? `${fNum(val.valuationRangeLow)} — ${fNum(val.valuationRangeHigh)} ${currency}`
    : fNum(val.valuationHigh || val.valuationLow || 0) + ` ${currency}`;

  const priceDesc = 'Изучили отчёт и фотографии, чтобы определить наиболее вероятную цену продажи этой машины';

  // ────────────────────────────────────────────────
  // Фото
  // ────────────────────────────────────────────────
  const mainPhoto = car.images?.[0]?.url || defaultCar;
  const smallPhotosHtml = (car.images || []).slice(0, 6).map(img => `
    <img src="${img.url || noPhoto}" alt="${img.label || 'Фото'}" 
         style="width:138px;height:98px;object-fit:cover;border-radius:10px;margin:4px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
  `).join('');

  // ────────────────────────────────────────────────
  // Основное из отчёта
  // ────────────────────────────────────────────────
  const otchotsHtml = (car.otchots || []).sort((a,b) => (a.position||0) - (b.position||0)).map(o => {
    let color = '#22c55e';
    if (o.position === 2) color = '#f59e0b';
    if (o.position >= 3)  color = '#ef4444';

    return `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #e5e7eb;">
        <div style="display:flex;align-items:center;gap:12px;">
          ${o.otchotId?.icon ? `<img src="${o.otchotId.icon}" width="24" height="24">` : ''}
          <strong>${o.otchotId?.title || '—'}</strong>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span>${o.text || '—'}</span>
          <div style="width:12px;height:12px;border-radius:50%;background:${color};"></div>
        </div>
      </div>
    `;
  }).join('') || '<p style="color:#9ca3af;text-align:center;padding:20px;">Нет данных</p>';

  // ────────────────────────────────────────────────
  // Технические данные
  // ────────────────────────────────────────────────
  const techHtml = `
    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
      <tr><td style="color:#6b7280;width:38%;padding:14px 0;border-bottom:1px solid #e5e7eb;">VIN</td><td style="font-weight:600;padding:14px 0;border-bottom:1px solid #e5e7eb;">${car.vin || '—'}</td></tr>
      <tr><td style="color:#6b7280;padding:14px 0;border-bottom:1px solid #e5e7eb;">Госномер</td><td style="font-weight:600;padding:14px 0;border-bottom:1px solid #e5e7eb;">${car.gosNumber || '—'}</td></tr>
      <tr><td style="color:#6b7280;padding:14px 0;border-bottom:1px solid #e5e7eb;">Номер двигателя</td><td style="padding:14px 0;border-bottom:1px solid #e5e7eb;">${car.engineNumber || '—'}</td></tr>
      <tr><td style="color:#6b7280;padding:14px 0;border-bottom:1px solid #e5e7eb;">СТС</td><td style="padding:14px 0;border-bottom:1px solid #e5e7eb;">${car.stsNumber || '—'}</td></tr>
      <tr><td style="color:#6b7280;padding:14px 0;border-bottom:1px solid #e5e7eb;">Тип ТС</td><td style="padding:14px 0;border-bottom:1px solid #e5e7eb;">${car.carType || '—'}</td></tr>
      <tr><td style="color:#6b7280;padding:14px 0;border-bottom:1px solid #e5e7eb;">Цвет</td><td style="padding:14px 0;border-bottom:1px solid #e5e7eb;">${car.color || '—'}</td></tr>
      <tr><td style="color:#6b7280;padding:14px 0;">Двигатель</td><td style="padding:14px 0;">${car.engine || '—'}</td></tr>
    </table>
  `;

  // ────────────────────────────────────────────────
  // Наши рекомендации + Что повлияло
  // ────────────────────────────────────────────────
  const hasCritical = 
    (car.legalRisks || []).some(r => r.position && r.position <= 2) ||
    (car.damageHistory || []).length > 0 ||
    (car.shtrafEvents || []).length > 0 ||
    (car.ZalogHistory || car.SudHistory || car.LizingHistory || car.QidiruvHistory || []).some(arr => arr?.length > 0);

  const recTitle = hasCritical 
    ? 'Есть критические недостатки, лучше не рисковать'
    : 'Автомобиль выглядит нормально';

  const criticalItems = [];
  if ((car.legalRisks || []).some(r => r.position && r.position <= 2)) criticalItems.push('Есть ограничения на регистрацию');
  if (car.damageHistory?.length) criticalItems.push(`Повреждения (${car.damageHistory.length})`);
  if (car.shtrafEvents?.length) criticalItems.push(`Неоплаченные штрафы (${car.shtrafEvents.length})`);
  if (car.ZalogHistory?.length)  criticalItems.push('В залоге');
  if (car.SudHistory?.length)    criticalItems.push('Судебные споры');
  if (car.LizingHistory?.length) criticalItems.push('В лизинге');
  if (car.QidiruvHistory?.length) criticalItems.push('В розыске');

  const influenceHtml = criticalItems.length ? `
    <div style="margin:20px 0;">
      <strong style="color:#c53030;">Что повлияло на рекомендацию:</strong>
      <ul style="margin:12px 0 0 24px;padding-left:0;list-style:none;">
        ${criticalItems.map(item => `<li style="margin:8px 0;position:relative;padding-left:24px;color:#374151;">• ${item}</li>`).join('')}
      </ul>
    </div>
  ` : '';

  // ────────────────────────────────────────────────
  // Юридические риски — барча блоклар
  // ────────────────────────────────────────────────
  const renderRiskGroup = (items, title, color = '#ef4444', icon = '⚠️') => {
    if (!items?.length) return '';
    return `
      <div style="margin:28px 0;padding:20px;background:#fff5f5;border-radius:14px;border-left:8px solid ${color};box-shadow:0 4px 16px rgba(0,0,0,0.06);">
        <h3 style="margin:0 0 16px;color:${color};font-size:20px;">${icon} ${title} (${items.length})</h3>
        ${items.map(it => `
          <div style="margin:16px 0;padding:16px;background:white;border-radius:10px;border:1px solid #fee2e2;">
            <strong style="font-size:16px;">${it.title || '—'}</strong>
            ${it.date ? `<br><small style="color:#6b7280;">${fDate(it.date)}</small>` : ''}
            <div style="margin-top:10px;color:#374151;line-height:1.5;">${it.text || '—'}</div>
            ${it.image ? `<img src="${it.image}" style="max-width:100%;margin-top:14px;border-radius:10px;">` : ''}
          </div>
        `).join('')}
      </div>
    `;
  };

  const legalAll = `
    ${renderRiskGroup(car.historyEvents,   'Ограничения / Запреты',     '#ef4444', '⛔')}
    ${renderRiskGroup(car.shtrafEvents,    'Неоплаченные штрафы',       '#ef4444', '📄')}
    ${renderRiskGroup(car.ZalogHistory,    'В залоге',                  '#f59e0b', '🏦')}
    ${renderRiskGroup(car.QidiruvHistory,  'В розыске',                 '#f59e0b', '🔍')}
    ${renderRiskGroup(car.SudHistory,      'Судебные споры',            '#f59e0b', '⚖️')}
    ${renderRiskGroup(car.LizingHistory,   'В лизинге',                 '#f59e0b', '📝')}
  ` || '<div style="padding:48px 0;text-align:center;color:#16a34a;font-size:18px;font-weight:500;">Юридически чисто ✓</div>';

  // ────────────────────────────────────────────────
  // Цена + 3 нуқтали
  // ────────────────────────────────────────────────
  const priceHtml = `
    <div style="text-align:center;margin:48px 0;">
      <div style="font-size:30px;font-weight:700;color:#1d4ed8;margin-bottom:16px;">${priceMain}</div>
      <p style="color:#475569;font-size:18px;margin:0 0 32px;">${priceDesc}</p>
      <div style="display:flex;justify-content:center;gap:60px;max-width:640px;margin:0 auto;">
        <div style="text-align:center;flex:1;">
          <div style="color:#ef4444;font-size:15px;font-weight:600;">${priceLow}</div>
          <div style="color:#6b7280;font-size:12px;margin-top:6px;">Ниже</div>
        </div>
        <div style="text-align:center;flex:1;">
          <div style="color:#10b981;font-size:15px;font-weight:700;">${priceRange}</div>
          <div style="color:#6b7280;font-size:12px;margin-top:6px;">Наша оценка</div>
        </div>
        <div style="text-align:center;flex:1;">
          <div style="color:#3b82f6;font-size:15px;font-weight:600;">${priceHigh}</div>
          <div style="color:#6b7280;font-size:12px;margin-top:6px;">Выше</div>
        </div>
      </div>
    </div>
  `;

  // ────────────────────────────────────────────────
  // OLX эълонлари (3 та мисол сифатида)
  // ────────────────────────────────────────────────
  const salesHtml = (car.salesHistory || []).slice(0, 3).map(s => `
    <div style="margin:24px 0;padding:20px;background:#f8fafc;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.05);">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <strong>${fShort(s.saleDate)}</strong><br>
          <small>${s.title || s.holati || '—'}</small>
        </div>
        <div style="text-align:right;">
          <div style="font-size:22px;font-weight:700;color:#1d4ed8;">${fMoney(s.price)}</div>
          ${s.priceDrop ? `<div style="color:#ef4444;">↓ ${fMoney(s.priceDrop)}</div>` : ''}
        </div>
      </div>
      <div style="margin-top:12px;color:#475569;">
        Пробег: ${fNum(s.probeg || 0)} км • ${s.region || '—'}
        ${s.link ? `<br><a href="${s.link}" style="color:#3b82f6;text-decoration:underline;">Ссылка на объявление</a>` : ''}
      </div>
    </div>
  `).join('') || '<p style="color:#9ca3af;text-align:center;padding:32px 0;">Нет объявлений</p>';

  // ────────────────────────────────────────────────
  // Пробег (график + статус)
  // ────────────────────────────────────────────────
  const probegStatus = car.probegHistory?.length && car.probegHistory.some((p,i)=>i>0 && p.kilometer < car.probegHistory[i-1]?.kilometer)
    ? { text: 'Похоже, скручен', color: '#ef4444' }
    : { text: 'Нормальный', color: '#22c55e' };

  const probegHtml = car.probegHistory?.length ? `
    <div style="margin:48px 0;">
      <h2>Пробег</h2>
      <div style="font-weight:600;color:${probegStatus.color};font-size:19px;margin-bottom:24px;">
        По нашим данным ${probegStatus.text}
      </div>
      ${generateProbegSvg(car.probegHistory)}
      <p style="text-align:center;color:#6b7280;margin-top:20px;font-size:15px;">
        от ${fNum(Math.min(...car.probegHistory.map(p=>p.kilometer)))} км
      </p>
    </div>
  ` : '<p style="color:#9ca3af;text-align:center;padding:48px 0;font-size:16px;">История пробега отсутствует</p>';

  // ────────────────────────────────────────────────
  // Повреждение автомобиля — 3 та мисол
  // ────────────────────────────────────────────────
  const damageHtml = (car.damageHistory || []).slice(0, 3).map(d => `
    <div style="margin:32px 0;padding:24px;background:#fff5f5;border-radius:14px;border-left:8px solid #ef4444;box-shadow:0 4px 16px rgba(239,68,68,0.12);">
      <h3 style="margin:0 0 16px;font-size:21px;">${fShort(d.damageDate)} • ${d.damageType} • ${d.daraja || '—'}</h3>
      <div style="color:#4b5563;margin-bottom:16px;font-size:15px;">
        ${d.location || '—'} • ${d.qatnashchi || '— участник'}
      </div>
      <div style="display:flex;gap:40px;flex-wrap:wrap;align-items:flex-start;">
        <div style="flex:1;min-width:220px;">
          <strong style="font-size:16px;">Ремонт:</strong> ${fMoney(d.rasxot_remont)}<br>
          <strong style="font-size:16px;">Кузов:</strong> ${fMoney(d.rasxot_kuzup)}
        </div>
        ${d.damageImage ? `
          <img src="${d.damageImage}" style="max-width:380px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
        ` : ''}
      </div>
    </div>
  `).join('') || '<div style="padding:48px 0;text-align:center;color:#16a34a;font-size:18px;">Повреждений не зафиксировано ✓</div>';

  // ────────────────────────────────────────────────
  // История эксплуатации
  // ────────────────────────────────────────────────
  const expHtml = (car.exploitationHistory || []).map(e => `
    <div style="display:flex;margin:24px 0;padding:20px;background:#f8fafc;border-radius:12px;border-left:6px solid #3b82f6;box-shadow:0 3px 12px rgba(0,0,0,0.05);">
      <div style="min-width:200px;color:#4b5563;font-weight:500;font-size:15px;">
        ${fShort(e.startDate)} → ${fShort(e.endDate) || 'н.в.'}<br>
        ${fNum(e.startKilometer)} → ${fNum(e.endKilometer || e.startKilometer)} км
      </div>
      <div style="flex:1;padding-left:28px;">
        <strong style="font-size:18px;">${e.title || '—'}</strong>
        <div style="margin-top:10px;color:#374151;line-height:1.5;">${e.description || '—'}</div>
        <div style="margin-top:8px;color:#6b7280;">${e.location || '—'}</div>
      </div>
    </div>
  `).join('') || '<p style="color:#9ca3af;text-align:center;padding:48px 0;font-size:16px;">Событий эксплуатации не найдено</p>';

  // ────────────────────────────────────────────────
  // Footer
  // ────────────────────────────────────────────────
  const footer = `
    <div style="margin-top:120px;padding-top:40px;border-top:1px solid #e5e7eb;text-align:center;color:#6b7280;font-size:14px;line-height:1.7;">
      © 2026 AvtoTekshiruv • Политика конфиденциальности<br>
      Отчёт сформирован ${new Date().toLocaleDateString('ru-RU', { day:'numeric', month:'long', year:'numeric' })} • avtotekshiruv.uz
    </div>
  `;

  // ────────────────────────────────────────────────
  // Тўлиқ HTML
  // ────────────────────────────────────────────────
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Отчёт Avtotex — ${car.carName || 'Автомобиль'} ${car.vin}</title>
  <style>
    body { font-family: 'Segoe UI', system-ui, sans-serif; margin:0; padding:0; color:#1e293b; background:#f8fafc; line-height:1.65; font-size:15.5px; }
    .container { max-width:210mm; margin:0 auto; background:white; padding:36px; box-shadow:0 6px 28px rgba(0,0,0,0.08); border-radius:20px; }
    h1 { font-size:36px; margin:0 0 10px; color:#0f172a; font-weight:700; letter-spacing:-0.5px; }
    h2 { font-size:26px; color:#1d4ed8; margin:52px 0 20px; border-bottom:3px solid #dbeafe; padding-bottom:12px; }
    h3 { font-size:21px; color:#334155; margin:32px 0 14px; }
    .critical { background:linear-gradient(to bottom right, #fee2e2, #fef2f2); padding:32px; border-radius:20px; border-left:10px solid #ef4444; margin:36px 0; box-shadow:0 4px 16px rgba(239,68,68,0.15); }
    table { width:100%; border-collapse:collapse; margin:24px 0; }
    td { padding:16px 12px; border-bottom:1px solid #e5e7eb; vertical-align:top; }
    td:first-child { color:#64748b; width:38%; font-weight:500; }
    img { border-radius:14px; max-width:100%; height:auto; box-shadow:0 6px 16px rgba(0,0,0,0.1); }
    .photos { display:grid; grid-template-columns:repeat(auto-fill, minmax(140px,1fr)); gap:14px; margin:24px 0; }
  </style>
</head>
<body>
  <div class="container">

    <!-- Шапка -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:48px;">
      <img src="${logo}" style="height:68px;" alt="Avtotex">
      <img src="${qrDataUrl}" style="width:190px;border-radius:12px;" alt="QR-код отчёта">
    </div>

    <h1>${car.carName || 'Автомобиль'} • ${car.vin}</h1>
    <p style="font-size:20px;color:#475569;margin:0 0 48px;">
      Госномер: <strong>${car.gosNumber || '—'}</strong>
    </p>

    <!-- Фото -->
    <div style="margin-bottom:48px;">
      <img src="${mainPhoto}" style="width:100%;border-radius:16px;margin-bottom:20px;">
      <div class="photos">${smallPhotosHtml}</div>
    </div>

    <!-- Основное из отчёта -->
    <h2>Основное из отчёта</h2>
    ${otchotsHtml}

    <!-- Технические данные -->
    <h2>Технические данные</h2>
    ${techHtml}

    <!-- Наши рекомендации -->
    <div class="critical">
      <h2 style="margin:0 0 20px;color:#991b1b;">Наши рекомендации</h2>
      <p style="font-size:24px;font-weight:600;margin:0 0 24px;">${recTitle}</p>
      ${influenceHtml}
    </div>

    <!-- Юридические риски -->
    <h2>Юридические риски</h2>
    ${legalAll}

    <!-- Цена -->
    <h2>Цена</h2>
    ${priceHtml}

    <!-- Пробег -->
    ${probegHtml}

    <!-- Повреждения -->
    <h2>Повреждение автомобиля</h2>
    ${damageHtml}

    <!-- История эксплуатации -->
    <h2>История эксплуатации</h2>
    ${expHtml}

    ${footer}

  </div>
</body>
</html>
  `;
}
// ==================================================================
//                    PROBEG GRAFIGI (SVG)
// ==================================================================
function generateProbegSvg(history) {
  if (!history?.length) return '<p>Нет данных о пробеге</p>';

  const sorted = [...history].sort((a, b) => a.year - b.year);
  const kms = sorted.map(h => h.kilometer);
  const minKm = Math.min(...kms);
  const maxKm = Math.max(...kms);
  const range = maxKm - minKm || 1;

  const width = 1000;
  const height = 280;
  const padding = 60;

  let points = '';
  let circles = '';
  let labels = '';

  sorted.forEach((h, i) => {
    const x = padding + (i / (sorted.length - 1)) * (width - padding * 2);
    const y = height - padding - ((h.kilometer - minKm) / range) * (height - padding * 2);
    points += `${x},${y} `;
    circles += `<circle cx="${x}" cy="${y}" r="8" fill="${h.kilometer < (sorted[i-1]?.kilometer || Infinity) ? '#E73C3B' : '#11B566'}" stroke="#fff" stroke-width="3"/>`;
    labels += `<text x="${x}" y="${height - 30}" text-anchor="middle" font-size="14">${h.year}</text>`;
  });

  const polyline = `<polyline fill="none" stroke="#E73C3B" stroke-width="4" points="${points}" opacity="0.7"/>`;

  return `
<svg width="100%" viewBox="0 0 ${width} ${height}" class="probeg-svg" preserveAspectRatio="xMidYMid meet">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#E73C3B" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#E73C3B" stop-opacity="0"/>
    </linearGradient>
  </defs>
  ${polyline}
  ${circles}
  ${labels}
  <text x="${padding}" y="30" font-size="18" fill="#E73C3B">Пробег скручен</text>
</svg>`;
}