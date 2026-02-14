  // Sahifa yuklanganda
  document.addEventListener('DOMContentLoaded', function() {
    // URLdan VIN yoki boshqa parametrni olish
    const urlParams = new URLSearchParams(window.location.search);
    const vinCode = urlParams.get('gosNumber');
    
    loadCarData(vinCode);
  });
// URL dan gosNumber olish
function getGosNumberFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('gosNumber') || '';
}

// API dan ma'lumot olish
async function fetchCarData(gosNumber) {
  if (!gosNumber) return null;

  try {
    const response = await fetch(`/api/cars/search?q=${gosNumber}`);
    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    return data.data[0]; // { vin, name, year, images: [], features: [], recommendation: '' }
  } catch (err) {
    console.error(err);
    return null;
  }
}

// Slider va rasmni to'ldirish
function populateSlider(car) {
  if (!car) return;

  const sliderContainer = document.querySelector('.car_slider_mid_image_smalls');
  const bigImage = document.querySelector('.car_slider_mid_image_big');
  sliderContainer.innerHTML = '';
  console.log(car.data);

  // Agar images bo'lmasa, default rasm
  const slider = car.images.length ? car.images : ['https://img.freepik.com/premium-vector/blue-car-flat-style-illustration-isolated-white-background_108231-795.jpg?semt=ais_user_personalization&w=740&q=80'];

  // Big image
  bigImage.style.background = `url('${slider[0].url}')`;
  bigImage.style.backgroundSize = 'cover';
  bigImage.style.backgroundPosition = 'center';

  // Smalls
  console.log(slider);

  slider.forEach((img, i) => {
    if (i == 2 && slider.length >= 2) {
      // "+N" rasm
      sliderContainer.innerHTML += `
            <div class="car_slider_mid_image_small" style="background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${img.url}'); background-size: cover; background-position: center;">
                <button onclick="openCarImgModal()">
                    Еще +${slider.length - 3}
                </button>
            </div>`;
    } else if (i < 3) {
      sliderContainer.innerHTML += `<div class="car_slider_mid_image_small" onclick="getImage('${img.url}')" style="background:url('${img.url}'); background-size: cover; background-position: center;"></div>`;
    }
  });
}
// Modalga rasmlarni to'ldirish
function populateCarImageModal(car) {
  if (!car) return;

  const modalCardsContainer = document.querySelector('.car_image_modal_mid_cards');
  modalCardsContainer.innerHTML = ''; // avval tozalaymiz

  // Agar images bo'lmasa, default rasm
  const images = car.images.length ? car.images : ['https://img.freepik.com/premium-vector/blue-car-flat-style-illustration-isolated-white-background_108231-795.jpg?semt=ais_user_personalization&w=740&q=80'];

  images.forEach((img, i) => {
    if (img.isDamaged) {
      modalCardsContainer.innerHTML += `
        <div class="car_image_modal_mid_card" onclick="getImage('${img.url}'); closeCarImgModal();">
            <div class="car_image_modal_mid_card_type">
                <p><div class="red_circle"></div>${img.label}</p>
            </div>
            <div style="background:url('${img.url}'); background-size: cover; background-position: center; width:100%; height:100%; border-radius:8px;"></div>
        </div>
        `;
    } else {
      modalCardsContainer.innerHTML += `
        <div class="car_image_modal_mid_card" onclick="getImage('${img.url}'); closeCarImgModal();">
           
            <div style="background:url('${img.url}'); background-size: cover; background-position: center; width:100%; height:100%; border-radius:8px;"></div>
        </div>
        `;
    }

  });
}

// Big image o'zgarishi
function getImage(img) {
  const bigImage = document.querySelector('.car_slider_mid_image_big');
  bigImage.style.background = `url('${img}')`;
  bigImage.style.backgroundSize = 'cover';
  bigImage.style.backgroundPosition = 'center';
}

(async function init() {
  const gosNumber = getGosNumberFromURL();
  const car = await fetchCarData(gosNumber);
  if (!car) return;

  populateSlider(car);
  populateCarImageModal(car);
  populateOtchots(car);
  renderPrice(car);
  populateLegalRisks(car);
  populateTechnicalData(car);
  renderCars(car)
  // Text info
  document.querySelector('.car_slider_mid_text h1').innerText = `${car.carName}`;
  document.querySelectorAll('.car_slider_mid_text_p')[0].innerHTML = `<b>VIN</b>: ${car.vin} <svg onclick="navigator.clipboard.writeText('${car.vin}');alert('saqlandi')" width="19" height="22" viewBox="0 0 19 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 20H6V6H17V20ZM17 4H6C5.46957 4 4.96086 4.21071 4.58579 4.58579C4.21071 4.96086 4 5.46957 4 6V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H17C17.5304 22 18.0391 21.7893 18.4142 21.4142C18.7893 21.0391 19 20.5304 19 20V6C19 5.46957 18.7893 4.96086 18.4142 4.58579C18.0391 4.21071 17.5304 4 17 4ZM14 0H2C1.46957 0 0.960859 0.210714 0.585786 0.585786C0.210714 0.960859 0 1.46957 0 2V16H2V2H14V0Z" fill="#383838"/></svg>`;
  document.querySelectorAll('.car_slider_mid_text_p')[1].innerHTML = `<b>Госномер</b>: ${car.gosNumber} <svg onclick="navigator.clipboard.writeText('${car.gosNumber}');alert('saqlandi')" width="19" height="22" viewBox="0 0 19 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 20H6V6H17V20ZM17 4H6C5.46957 4 4.96086 4.21071 4.58579 4.58579C4.21071 4.96086 4 5.46957 4 6V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H17C17.5304 22 18.0391 21.7893 18.4142 21.4142C18.7893 21.0391 19 20.5304 19 20V6C19 5.46957 18.7893 4.96086 18.4142 4.58579C18.0391 4.21071 17.5304 4 17 4ZM14 0H2C1.46957 0 0.960859 0.210714 0.585786 0.585786C0.210714 0.960859 0 1.46957 0 2V16H2V2H14V0Z" fill="#383838"/></svg>`;
})();

function populateLegalRisks(car) {
  const container = document.getElementById("yurist_cards");
  const warningBox = document.getElementById("yurist_warning");

  if (!container) return;

  container.innerHTML = "";
  if (warningBox) warningBox.innerHTML = "";

  if (!car.legalRisks || car.legalRisks.length === 0) {
    container.innerHTML = "<p>Юридических рисков не найдено</p>";
    return;
  }

  // position bo‘yicha tartiblash (3 → 2 → 1)
  car.legalRisks.sort((a, b) => b.order - a.order);

  let redCount = 0;

  car.legalRisks.forEach(item => {

    let circleClass = "";

    if (item.position === 3) {
      circleClass = "red_circle";
      redCount++;
    } else if (item.position === 2) {
      circleClass = "yelow_circle";
    } else {
      circleClass = "green_circle";
    }

    const card = `
            <div class="yurist_card">
                <div class="yurist_card_title">
                    <h1>${item.title || ''}</h1>
                    <div class="${circleClass}"></div>
                </div>
                <p>${item.text || ''}</p>
            </div>
        `;

    container.insertAdjacentHTML("beforeend", card);
  });

  // Agar qizil risk bo‘lsa tepada katta ogohlantirish
  if (redCount > 0 && warningBox) {
    warningBox.innerHTML = `
            Судя по нашим данным, этот автомобиль имеет серьёзные юридические ограничения.
            Рекомендуем внимательно проверить перед покупкой.
        `;
  }
}
const istoriyaGrid = document.getElementById('istoriyaGrid');

// Funksiya: cars massivini HTML kartalarga map qiladi
function renderCars(cars) {
  istoriyaGrid.innerHTML = ''; // eski kartalarni tozalash

  cars.salesHistory
    .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))// eng eski → eng yangi
      .forEach(sale => {
        const priceLabel = sale.price && sale.price > 0 ? 'Цена' : 'Результат';
        const priceHTML = sale.price && sale.price > 0
          ? `${sale.price.toLocaleString('ru-RU')} сум ${sale.priceDrop ? `<span class="istoriya-price-down">↓ ${sale.priceDrop.toLocaleString('ru-RU')} сум</span>` : ''}`
          : `<span class="istoriya-not-purchased">Не выкуплен</span>`;

        const card = document.createElement('div');
        card.classList.add('istoriya-card');
        card.innerHTML = `
                <div class="istoriya-card-top">
                    <div>
                        <div class="istoriya-date">${sale.saleDate ? new Date(sale.saleDate).toLocaleDateString('ru-RU') : ''}</div>
                        <div class="istoriya-card-title">${sale.title || ''}</div>
                    </div>
                    <div class="istoriya-car-icon">
                        <svg width="63" height="63" viewBox="0 0 63 63" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M13.125 28.875L17.0625 17.0625H45.9375L49.875 28.875H13.125ZM45.9375 42C44.8932 42 43.8917 41.5852 43.1533 40.8467C42.4148 40.1083 42 39.1068 42 38.0625C42 37.0182 42.4148 36.0167 43.1533 35.2783C43.8917 34.5398 44.8932 34.125 45.9375 34.125C46.9818 34.125 47.9833 34.5398 48.7217 35.2783C49.4602 36.0167 49.875 37.0182 49.875 38.0625C49.875 39.1068 49.4602 40.1083 48.7217 40.8467C47.9833 41.5852 46.9818 42 45.9375 42ZM17.0625 42C16.0182 42 15.0167 41.5852 14.2783 40.8467C13.5398 40.1083 13.125 39.1068 13.125 38.0625C13.125 37.0182 13.5398 36.0167 14.2783 35.2783C15.0167 34.5398 16.0182 34.125 17.0625 34.125C18.1068 34.125 19.1083 34.5398 19.8467 35.2783C20.5852 36.0167 21 37.0182 21 38.0625C21 39.1068 20.5852 40.1083 19.8467 40.8467C19.1083 41.5852 18.1068 42 17.0625 42ZM49.665 15.75C49.14 14.2275 47.67 13.125 45.9375 13.125H17.0625C15.33 13.125 13.86 14.2275 13.335 15.75L7.875 31.5V52.5C7.875 53.1962 8.15156 53.8639 8.64384 54.3562C9.13613 54.8484 9.80381 55.125 10.5 55.125H13.125C13.8212 55.125 14.4889 54.8484 14.9812 54.3562C15.4734 53.8639 15.75 53.1962 15.75 52.5V49.875H47.25V52.5C47.25 53.1962 47.5266 53.8639 48.0188 54.3562C48.5111 54.8484 49.1788 55.125 49.875 55.125H52.5C53.1962 55.125 53.8639 54.8484 54.3562 54.3562C54.8484 53.8639 55.125 53.1962 55.125 52.5V31.5L49.665 15.75Z" fill="#1B1B1B" fill-opacity="0.6"/>
                        </svg>
                    </div>
                </div>

                <div class="istoriya-rows">
                    <div class="istoriya-row">
                        <div class="istoriya-label">${priceLabel}</div>
                        <div class="istoriya-value">${priceHTML}</div>
                    </div>

                    <div class="istoriya-row">
                        <div class="istoriya-label">Пробег</div>
                        <div class="istoriya-value">${sale.probeg ? sale.probeg.toLocaleString('ru-RU') : 0} км</div>
                    </div>

                    <div class="istoriya-row">
                        <div class="istoriya-label">Регион</div>
                        <div class="istoriya-value">${sale.region || ''}</div>
                    </div>

                    ${sale.holati ? `<div class="istoriya-row">
                        <div class="istoriya-label">Состояние</div>
                        <div class="istoriya-value ${sale.holati === 'Битый' ? 'istoriya-bad' : ''}">${sale.holati}</div>
                    </div>` : ''}
                </div>

                <button class="istoriya-detail-btn">Подробнее</button>
            `;
        istoriyaGrid.appendChild(card);
      });
}

function populateTechnicalData(car) {
  if (!car) return;

  document.getElementById('vin-field').innerText = car.vin || '—';
  document.getElementById('gos-field').innerText = car.gosNumber || '—';
  document.getElementById('engine-number-field').innerText = car.engineNumber || '—';
  document.getElementById('sts-field').innerText = car.stsNumber || '—';
  document.getElementById('type-field').innerText = car.carType || '—';
  document.getElementById('color-field').innerText = car.color || '—';
  document.getElementById('engine-field').innerText = car.engine || '—';
}
function openNashModal() {
  document.body.classList.add("no-scroll");
  document.querySelector('#hard_modal_1').style.display = "flex"
}

function closeNashModal() {
  document.body.classList.remove("no-scroll");
  document.querySelector('#hard_modal_1').style.display = "none"
}
function openYurModal() {
  document.body.classList.add("no-scroll");
  document.querySelector('#hard_modal_2').style.display = "flex"
}

function closeYurModal() {
  document.body.classList.remove("no-scroll");
  document.querySelector('#hard_modal_2').style.display = "none"
}
function renderPrice(car) {
  if (!car || !car.valuation) return;

  const v = car.valuation;

  const currency = v.currency || "UZS";

  const format = num => {
    return Number(num || 0).toLocaleString('ru-RU');
  };

  document.getElementById("priceLow").innerText =
    `До ${format(v.valuationLow)} ${currency}`;

  document.getElementById("priceRange").innerText =
    `${format(v.valuationRangeLow)} - ${format(v.valuationRangeHigh)} ${currency}`;

  document.getElementById("priceHigh").innerText =
    `От ${format(v.valuationHigh)} ${currency}`;

  document.getElementById("priceMainText").innerText =
    `${format(v.valuationRangeLow)} ${currency} — цена в объявлении ниже нашей оценки`;

  document.getElementById("priceDesc").innerText =
    "Изучили отчёт и фотографии, чтобы определить наиболее вероятную цену продажи этой машины";
}

function populateOtchots(car) {
  if (!car || !Array.isArray(car.otchots)) return;

  const container = document.getElementById('main-otchots');
  container.innerHTML = '<h1>Основное из отчёта</h1>';

  car.otchots
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .forEach(o => {

      const icon = o.icon || '';
      const title = o.title || '—';
      const text = o.text || '';
      const position = Number(o.position || 0);

      let circleClass = 'grey_circle';

      if (position === 1) circleClass = 'green_circle';
      else if (position === 2) circleClass = 'grey_circle';
      else if (position === 3) circleClass = 'yelow_circle';
      else if (position === 4) circleClass = 'red_circle';

      container.innerHTML += `
        <div class="car_ochot_teg">
          <h2>
            ${icon ? `<img src="${icon}" width="20" style="margin-right:8px;">` : ''}
            ${title}
          </h2>
          <div class="car_ochot_teg_p">
            <p>${text || '—'}</p>
            <div class="${circleClass}"></div>
          </div>
        </div>
      `;
    });
}


function renderLegalRisks(car) {
  const container = document.getElementById("yurist_cards");
  const warningBox = document.getElementById("yurist_warning");

  container.innerHTML = "";
  warningBox.innerHTML = "";

  if (!Array.isArray(car.legalRisks) || car.legalRisks.length === 0) {
    container.innerHTML = "<p>Юридических рисков не найдено</p>";
    return;
  }

  let hasRed = false;

  car.legalRisks.forEach(item => {

    const title = item.title || "—";
    const text = item.text || "";

    let circleClass = "green_circle";

    // 3 = qizil, 2 = sariq, 1 = yashil
    if (item.position === 3) {
      circleClass = "red_circle";
      hasRed = true;
    }
    else if (item.position === 2) {
      circleClass = "yellow_circle";
    }

    const card = `
      <div class="yurist_card">
        <div class="yurist_card_title">
          <h1>${title}</h1>
          <div class="${circleClass}"></div>
        </div>
        <p>${text}</p>
      </div>
    `;

    container.innerHTML += card;
  });

  // Agar qizil risk bo‘lsa ogohlantirish chiqaradi
  if (hasRed) {
    warningBox.innerHTML = `
      Судя по нашим данным, этот автомобиль может иметь серьезные ограничения.
      Рекомендуется внимательно проверить перед покупкой.
    `;
  }
}



function switch_modal(id) {
  var length_page = document.querySelectorAll('.nash_modal_mid_tab')
  for (let i = 0; i < length_page.length; i++) {
    if (id == i) {
      document.querySelectorAll('.nash_modal_mid_action')[i].style = "display:block"
      length_page[i].classList.add('nash_modal_mid_tab_active')
    } else {
      document.querySelectorAll('.nash_modal_mid_action')[i].style = "display:none"

      length_page[i].classList.remove('nash_modal_mid_tab_active')

    }
  }
}
switch_modal(0)




function openVIRModal() {
  document.body.classList.add("no-scroll");
  document.querySelector('#hard_modal_3').style.display = "flex"
}

function closeVIRModal() {
  document.body.classList.remove("no-scroll");
  document.querySelector('#hard_modal_3').style.display = "none"
}

var carImageVeribl = false
document.querySelector('.car_image_modal_mid_filter_w').style.transform = "rotate(180deg)";

function openCarImgModal() {
  document.body.classList.add("no-scroll");
  document.querySelector('#hard_modal_4').style.display = "flex"
}

function closeCarImgModal() {
  document.body.classList.remove("no-scroll");
  document.querySelector('#hard_modal_4').style.display = "none"
}
function openCarImgFilter() {
  if (carImageVeribl) {
    document.querySelector('.car_image_modal_mid_menu_ul').style = "display:none"
    document.querySelector('.car_image_modal_mid_filter_w').style.transform = "rotate(180deg)";
    carImageVeribl = false
  } else {
    document.querySelector('.car_image_modal_mid_menu_ul').style = "display:flex"
    carImageVeribl = true
    document.querySelector('.car_image_modal_mid_filter_w').style.transform = "rotate(0deg)";
  }
}


async function loadCarData(searchQuery) {
  try {
    const response = await fetch(`/api/cars/search?q=${searchQuery}`);
    const result = await response.json();

    console.log("Backend result:", result);

    if (result.success && result.data.length > 0) {
      const car = result.data[0];

      if (!car.probegHistory || car.probegHistory.length === 0) {
        console.log("Probeg ma'lumot yo'q");
        return;
      }

      renderProbegChart(car.probegHistory);
    }

  } catch (error) {
    console.error("Xatolik:", error);
  }
}

function renderProbegChart(probegHistory) {

  const svg = document.querySelector('.probeg .chart svg');
  if (!svg) return;

  // SORT
  const sortedData = [...probegHistory].sort((a, b) => a.year - b.year);

  const minKm = Math.min(...sortedData.map(p => p.kilometer));
  const maxKm = Math.max(...sortedData.map(p => p.kilometer));
  const kmRange = maxKm - minKm || 1;

  const svgWidth = 1000;
  const svgTop = 40;
  const svgBottom = 200;
  const svgHeight = svgBottom - svgTop;
  const padding = 20;
  const xStep = (svgWidth - padding * 2) / (sortedData.length - 1 || 1);

  let points = [];
  let circlesData = [];

  sortedData.forEach((item, index) => {
    const x = padding + index * xStep;
    const y = svgBottom - ((item.kilometer - minKm) / kmRange) * svgHeight;

    points.push(`${x},${y}`);
    circlesData.push({ x, y, km: item.kilometer, year: item.year });
  });

  // ANOMALY CHECK
  let greenEndIndex = sortedData.length - 1;
  for (let i = 1; i < sortedData.length; i++) {
    if (sortedData[i].kilometer < sortedData[i - 1].kilometer) {
      greenEndIndex = i - 1;
      break;
    }
  }

  // POLYLINES
  const polylines = svg.querySelectorAll('polyline');
  const redLine = polylines[0];
  const greenLine = polylines[1];

  redLine.setAttribute('points', points.join(' '));
  greenLine.setAttribute('points', points.slice(0, greenEndIndex + 1).join(' '));

  // 🔥 ENG MUHIM FIX — oxirgi <g> ni aniq olish
  const pointsGroup = svg.querySelector('g:last-of-type');
  pointsGroup.innerHTML = '';

  circlesData.forEach((c, i) => {

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

    circle.setAttribute('cx', c.x);
    circle.setAttribute('cy', c.y);
    circle.setAttribute('r', '6');

    // 🔥 class muammosini 100% hal qilamiz
    circle.setAttribute('class', 'chart-point');

    circle.setAttribute('data-km', c.km);
    circle.setAttribute('data-year', c.year);

    const isAnomaly = i > 0 && sortedData[i].kilometer < sortedData[i - 1].kilometer;

    if (isAnomaly) {
      circle.setAttribute('fill', 'red');
    } else if (i <= greenEndIndex) {
      circle.setAttribute('fill', '#fff');
      circle.setAttribute('stroke', '#00b050');
      circle.setAttribute('stroke-width', '2');
    } else {
      circle.setAttribute('fill', '#fff');
      circle.setAttribute('stroke', 'red');
      circle.setAttribute('stroke-width', '2');
    }

    pointsGroup.appendChild(circle);
  });

  updateYears(sortedData);
  updateStatus(sortedData);
  updateLastKm(sortedData);
  setupTooltip();
}

function updateYears(sortedData) {
  const yearsDiv = document.querySelector('.probeg .years');
  yearsDiv.innerHTML = sortedData.map(y => `<span>${y.year}</span>`).join('');
}

function updateStatus(sortedData) {
  const statusDiv = document.querySelector('.probeg .status');

  const hasAnomaly = sortedData.some((item, i) =>
    i > 0 && item.kilometer < sortedData[i - 1].kilometer
  );

  if (hasAnomaly) {
    statusDiv.innerHTML = 'Похоже, скручен <span></span>';
    statusDiv.style.color = 'red';
  } else {
    statusDiv.innerHTML = 'Нормальный <span></span>';
    statusDiv.style.color = 'green';
  }
}

function updateLastKm(sortedData) {
  const lastKm = sortedData[sortedData.length - 1].kilometer;
  document.querySelector('.probeg h2').textContent =
    `от ${lastKm.toLocaleString()} км`;
}

function setupTooltip() {

  const chartDiv = document.querySelector('.probeg .chart');
  const svg = chartDiv.querySelector('svg');

  let tooltip = chartDiv.querySelector('.chart-tooltip');

  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.background = '#fff';
    tooltip.style.padding = '8px 12px';
    tooltip.style.borderRadius = '6px';
    tooltip.style.boxShadow = '0 2px 10px rgba(0,0,0,0.15)';
    tooltip.style.fontSize = '14px';
    tooltip.style.display = 'none';
    tooltip.style.pointerEvents = 'none';
    chartDiv.appendChild(tooltip);
  }

  const circles = svg.querySelectorAll('circle');

  circles.forEach(circle => {

    circle.addEventListener('mouseenter', function (e) {

      const km = this.dataset.km;
      const year = this.dataset.year;

      tooltip.innerHTML = `
        <div style="font-size:12px;color:#999">${year} год</div>
        <div style="font-weight:600">${parseInt(km).toLocaleString()} км</div>
      `;

      const rect = svg.getBoundingClientRect();

      tooltip.style.left = (e.clientX - rect.left) + 'px';
      tooltip.style.top = (e.clientY - rect.top - 50) + 'px';
      tooltip.style.display = 'block';

      this.setAttribute('r', '8');
    });

    circle.addEventListener('mouseleave', function () {
      tooltip.style.display = 'none';
      this.setAttribute('r', '6');
    });
  });
}


// TOGGLE
document.getElementById('anomalyToggle')?.addEventListener('change', function () {
  const anomalies = document.querySelectorAll('.probeg circle[fill="red"]');

  anomalies.forEach(c => {
    c.style.display = this.checked ? 'block' : 'none';
  });
});


document.addEventListener('DOMContentLoaded', function () {
  const urlParams = new URLSearchParams(window.location.search);
  const gosNumber = urlParams.get('gosNumber');

  if (gosNumber) {
    loadCarData(gosNumber);
  }
});






