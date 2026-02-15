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
  

  // Agar images bo'lmasa, default rasm
  const slider = car.images.length ? car.images : ['https://img.freepik.com/premium-vector/blue-car-flat-style-illustration-isolated-white-background_108231-795.jpg?semt=ais_user_personalization&w=740&q=80'];

  // Big image
  bigImage.style.background = `url('${slider[0].url}')`;
  bigImage.style.backgroundSize = 'cover';
  bigImage.style.backgroundPosition = 'center';

 

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

const mainTimeline   = document.getElementById("timeline");
const fullTimeline   = document.getElementById("full-timeline");
const counter        = document.getElementById("events-counter");
const modal          = document.getElementById("historyModal");
const showButtons    = document.querySelectorAll(".show-more-trigger");
const closeBtn       = document.querySelector(".modal-close");
function renderHistoryItems(container, items) {
    container.innerHTML = "";

    items.forEach(item => {
        const km = item.endKilometer != null
            ? `${item.startKilometer.toLocaleString("ru-RU")} → ${item.endKilometer.toLocaleString("ru-RU")} км`
            : `${item.startKilometer.toLocaleString("ru-RU")} км`;

        const dates = item.endDate
            ? `${new Date(item.startDate).toLocaleDateString("ru-RU")} — ${new Date(item.endDate).toLocaleDateString("ru-RU")}`
            : new Date(item.startDate).toLocaleDateString("ru-RU");

        const div = document.createElement("div");
        div.className = "istoriya_item";

        div.innerHTML = `
            <div class="istoriya_date">
                <span>${dates}</span><br>
                <div class="istoriya_km">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 0C9.06087 0 10.0783 0.421427 10.8284 1.17157 11.5786 1.92172 12 2.93913 12 4c0 1.06087-.4214 2.07828-1.1716 2.82843C10.0783 7.57857 9.06087 8 8 8 6.93913 8 5.92172 7.57857 5.17157 6.82843 4.42143 6.07828 4 5.06087 4 4c0-1.06087.42143-2.07828 1.17157-2.82843C5.92172 0.421427 6.93913 0 8 0zM8 10c4.42 0 8 1.79 8 4v2H0v-2c0-2.21 3.58-4 8-4z" fill="white"/>
                    </svg>
                    ${km}
                </div>
            </div>

            <div class="istoriya_line">
                <span class="istoriya_circle"></span>
            </div>

            <div class="istoriya_content">
                <h3>${item.title || "—"}</h3>
                <p class="istoriya_subtitle">${item.description || ""}</p>
                <p class="istoriya_location">${item.location || "—"}</p>
            </div>
        `;

        container.appendChild(div);
    });
}

// sahifani yangilash
function updateHistoryDisplay(historyArray) {
    if (!Array.isArray(historyArray)) return;
document.querySelector('.istoriya_card_top p').innerHTML=`Найдено ${historyArray.length} событий и 1 владелец`
    const SHOW_ON_MAIN = 4; // asosiy sahifada nechta ko‘rsatiladi

    renderHistoryItems(mainTimeline, historyArray.slice(0, SHOW_ON_MAIN));
    renderHistoryItems(fullTimeline, historyArray);

    if (counter) {
        counter.textContent = `Найдено ${historyArray.length} событий и 1 владелец`;
    }
}

// modal ochish/yopish
function openModal() {
    if (modal) modal.style.display = "flex";
}

function closeModal() {
    if (modal) modal.style.display = "none";
}

// ==================== EVENTLAR ====================

document.addEventListener("DOMContentLoaded", () => {
    // Bu yerda real ma'lumotlaringiz keladi
    // misol uchun:
    // fetch("/api/history").then(r => r.json()).then(updateHistoryDisplay);

    // test uchun vaqtincha
    // updateHistoryDisplay(yourHistoryArrayHere);

    // tugmalar
    showButtons.forEach(btn => btn.addEventListener("click", openModal));

    if (closeBtn) closeBtn.addEventListener("click", closeModal);

    if (modal) {
        modal.addEventListener("click", e => {
            if (e.target === modal) closeModal();
        });
    }
});




// Damage points tooltip
document.addEventListener('DOMContentLoaded', function() {
    const damagePoints = document.querySelectorAll('.damage-point');
    
    damagePoints.forEach(point => {
        point.addEventListener('mouseenter', function() {
            const info = this.getAttribute('data-info');
            showTooltip(this, info);
        });
        
        point.addEventListener('mouseleave', function() {
            hideTooltip();
        });
    });
});

function showTooltip(element, text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'damage-tooltip';
    tooltip.textContent = text;
    tooltip.style.cssText = `
        position: absolute;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 13px;
        white-space: nowrap;
        z-index: 1000;
        pointer-events: none;
    `;
    
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
    
    element._tooltip = tooltip;
}

function hideTooltip() {
    const tooltips = document.querySelectorAll('.damage-tooltip');
    tooltips.forEach(tooltip => tooltip.remove());
}

// Damage tags filter
const damageTags = document.querySelectorAll('.damage-tag');
damageTags.forEach(tag => {
    tag.addEventListener('click', function() {
        this.classList.toggle('active');
      
    });
});

// Auction button
const auctionBtn = document.querySelector('.auction-btn');
if (auctionBtn) {
    auctionBtn.addEventListener('click', function() {
        alert('Открытие подробной информации об аукционе...');
    });
}

// Info items click
const infoItems = document.querySelectorAll('.damage-info-item');
infoItems.forEach(item => {
    item.addEventListener('click', function() {
        
        // Modal ochish yoki boshqa harakatlar
    });
});

// Load car image (placeholder)
const carImage = document.getElementById('carImage');
if (carImage) {
    // Agar rasm bo'lmasa, placeholder ko'rsatish
    carImage.onerror = function() {
        this.style.width = '300px';
        this.style.height = '400px';
        this.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        this.style.borderRadius = '12px';
    };
}

// Load auction image (placeholder)
const auctionImage = document.getElementById('auctionImage');
if (auctionImage) {
    auctionImage.onerror = function() {
        this.style.background = '#e0e0e0';
    };
}





// 3 ta o'zgaruvchi
let hasDamage = true;        // true = повреждения найдены, false = не найдено
let hasAuction = true;       // true = был на аукционе, false = не было
let hasDiagnostic = true;    // true = есть диагностика, false = нет

// Ma'lumotlar (agar topilgan bo'lsa)
const damageData = {
    count: 6,
    tags: [
        '04.12.2024 · ДТП · сильный',
        '10.09.2023 · ДТП · средний',
        '18.06.2022 · ДТП · лёгкий',
        '05.11.2021 · страховой случай',
        '27.03.2020 · кузовной ремонт',
        '14.05.2017 · ДТП · лёгкий'
    ],
    incidents: [
        {
            title: 'ДТП есть повреждения',
            description: 'Ташкент, Мирабадский район, 1 участник'
        },
        {
            title: 'Расчет стоимости ремонта',
            description: '4 677 000 сум'
        },
        {
            title: 'Кузовный ремонт',
            description: '4 677 000 сум'
        }
    ],

};

const diagnosticData = {
    date: '28 дек 2021',
    source: 'Партнер',
    mileage: '20 000 км',
    region: 'Ташкент'
};



// API dan ma'lumot olish va flaglarni yangilash
async function loadCarAndUpdateFlags(carId) {
  if (!carId) {
    console.warn("carId yo‘q, flaglar o‘zgartirilmaydi");
    return;
  }

  try {
    const res = await fetch(`/api/cars/${carId}`);
    const result = await res.json();

    if (!result.success || !result.data) {
      console.error("Mashina ma'lumotlari yuklanmadi");
      return;
    }

    const car = result.data;

    // Flaglarni aniqlash
    hasDamage    = Array.isArray(car.damageHistory)    && car.damageHistory.length > 0;
    hasAuction   = Array.isArray(car.auctionHistory)   && car.auctionHistory.length > 0;
    hasDiagnostic = Array.isArray(car.diagnosticHistory) && car.diagnosticHistory.length > 0;

  
    // UI ni yangilash
    updateDamageSection(hasDamage, hasAuction, hasDiagnostic);

  } catch (err) {
    console.error("API xatosi:", err);
  }
}

// UI ni flaglarga qarab yangilash (sizning render funksiyalaringizni chaqiradi)
function updateDamageSection(damageFound, auctionFound, diagnosticFound) {
  hasDamage = damageFound;
  hasAuction = auctionFound;
  hasDiagnostic = diagnosticFound;

  // Sizning render funksiyalaringizni chaqiramiz



  // Qo‘shimcha: bo‘limlarni ko‘rsatish/yashirish (ixtiyoriy)
  const damageSection = document.querySelector('.sub-section_demage');
  if (damageSection) damageSection.style.display = hasDamage ? 'block' : 'none';

  const auctionSection = document.querySelector('.auction-section');
  if (auctionSection) auctionSection.style.display = hasAuction ? 'block' : 'none';

  const diagnosticSection = document.querySelector('.sub-section_diagnostic');
  if (diagnosticSection) diagnosticSection.style.display = hasDiagnostic ? 'block' : 'none';
}

// Sahifa yuklanganda ishga tushirish
document.addEventListener('DOMContentLoaded', function() {
  // URL dan gosNumber olish (sizning kodda bor)
  const urlParams = new URLSearchParams(window.location.search);
  const gosNumber = urlParams.get('gosNumber');

  if (gosNumber) {
    // gosNumber orqali mashina ID sini topish (sizning search API orqali)
    fetch(`/api/cars/search?q=${gosNumber}`)
      .then(res => res.json())
      .then(result => {
        if (result.success && result.data?.length > 0) {
          const car = result.data[0];
          const carId = car._id;

          // Endi carId bilan to‘liq ma'lumotni yuklaymiz
          loadCarAndUpdateFlags(carId);

          // Qo‘shimcha: boshqa funksiyalarni chaqirish
          populateSlider(car);
          populateCarImageModal(car);
          populateOtchots(car);
          updateHistoryDisplay(car.exploitationHistory);
          renderPrice(car);
          populateLegalRisks(car);
          populateTechnicalData(car);
          renderCars(car);
          renderNashModalRestrictions(car)
          renderNashModalRestrictions1(car)
          renderDamageCard(car)
        } else {
          console.warn("Mashina topilmadi");
        }
      })
      .catch(err => console.error(err));
  } else {
    console.warn("gosNumber URL da yo‘q");
  }
});
// Render damage card (dinamik, API dan kelgan car ob'ektidan ishlaydi)
function renderDamageCard(car) {
  renderAuctionCard(car)
  renderDiagnosticCard(car)
  const card = document.getElementById('damageCard');
  if (!card) {
    console.error("damageCard elementi topilmadi");
    return;
  }

  card.innerHTML = ''; // avval tozalaymiz

  // Agar zarar yo‘q bo‘lsa
  if (!car || !Array.isArray(car.damageHistory) || car.damageHistory.length === 0) {
    card.innerHTML = `
      <div class="step_pt_card_title">
        <h2>Происшествий не найдено</h2>
        <div class="green_circle"></div>
      </div>
      <p>Мы проверили базы данных госсервисов, страховых компаний, независимых оценщиков, дилеров и СТО.</p>
      <hr>
      <p>
        ДТП не найден<br>
        Расчёт стоимости ремонта не найден<br>
        Страховая выплата не найдена<br>
        Кузовной ремонт не найден
      </p>
    `;
    return;
  }

  const damages = car.damageHistory;

  // Tabs yaratish
  let tabsHTML = '<div class="damage-tabs">';
  let contentsHTML = '<div class="damage-contents">';

  damages.forEach((damage, index) => {
    const date = damage.damageDate 
      ? new Date(damage.damageDate).toLocaleDateString('ru-RU') 
      : '—';

    const type = damage.damageType || '—';
    const level = damage.daraja || '—';
    const tag = `${date} · ${type} · ${level}`;

    const isActive = index === 0 ? 'active' : '';

    tabsHTML += `
      <button class="damage-tab ${isActive}" 
              data-index="${index}"
              onclick="switchDamageTab(this, ${index})">
        ${tag}
      </button>
    `;

    contentsHTML += `
      <div class="damage-content ${isActive ? 'active' : ''}" data-index="${index}">
        <div class="damage-visual">
          <div class="car-diagram">
            <img src="${damage.damageImage || 'https://via.placeholder.com/400x300?text=Rasm+yo‘q'}" 
                 alt="Car diagram"
                 onerror="this.src='https://via.placeholder.com/400x300?text=Rasm+yo‘q';">
          </div>
          
          <div class="damage-info">
            <div class="damage-info-item">
              <div class="info-icon"></div>
              <div class="info-content">
                <h3>ДТП есть повреждения ›</h3>
                <p>${damage.location || '—'}</p>
              </div>
            </div>
            <div class="damage-info-item">
              <div class="info-icon"></div>
              <div class="info-content">
                <h3>Расчет стоимости ремонта ›</h3>
                <p>${damage.rasxot_remont ? damage.rasxot_remont.toLocaleString('ru-RU') + ' сум' : '—'}</p>
              </div>
            </div>
            <div class="damage-info-item">
              <div class="info-icon"></div>
              <div class="info-content">
                <h3>Кузовный ремонт ›</h3>
                <p>${damage.rasxot_kuzup ? damage.rasxot_kuzup.toLocaleString('ru-RU') + ' сум' : '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  tabsHTML += '</div>';
  contentsHTML += '</div>';

  card.innerHTML = tabsHTML + contentsHTML;

  // Birinchi tab active bo‘lishi uchun
  switchDamageTab(document.querySelector('.damage-tab'), 0);

  // Tooltiplarni faollashtirish (agar kerak bo‘lsa)
  setupDamagePointsTooltip();
}

// Tabni o‘zgartirish funksiyasi
function switchDamageTab(button, index) {
  // Barcha tablar active classini olib tashlaymiz
  document.querySelectorAll('.damage-tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.damage-content').forEach(content => content.classList.remove('active'));

  // Bosilgan tabni active qilamiz
  button.classList.add('active');
  document.querySelector(`.damage-content[data-index="${index}"]`).classList.add('active');
}
function renderAuctionCard(car) {
  const card = document.getElementById('auctionCard');
  if (!card) {
    console.error("auctionCard elementi topilmadi");
    return;
  }

  card.innerHTML = ''; // tozalash

  // Agar auctionHistory yo‘q yoki bo‘sh bo‘lsa
  if (!car || !Array.isArray(car.auctionHistory) || car.auctionHistory.length === 0) {
    card.innerHTML = `
      <div class="step_pt_card_title">
        <h2>Нет сведений о продаже на аукционах аварийных автомобилей</h2>
        <div class="green_circle"></div>
      </div>
      <p>Мы проверили базы данных наших партнёров.</p>
      <hr>
      <p><b>Что такое аукцион аварийных автомобилей?</b></p>
      <p>Это место, куда попадают автомобили с сильными повреждениями, например после аварии, пожара или стихийного бедствия.</p>
    `;
    return;
  }

  // Auction topilgan holat
  const auctions = car.auctionHistory;

  // Agar bir nechta auction bo‘lsa — ularni ro‘yxat qilamiz
  let content = `
    <div class="step_pt_card_title">
      <h2>Оценивался на аукционе ${auctions.length} раз</h2>
      <div class="red_circle"></div>
    </div>
    <div class="auction-box-list">
  `;

  auctions.forEach((auction, index) => {
    const date = auction.date ? new Date(auction.date).toLocaleDateString('ru-RU') : '—';
    const link = auction.link || '#';

    content += `
      <div class="auction-item">
        <div class="auction-image">
          <img src="${auction.image || './img/Frame 2087330637.png'}" 
               alt="Auction rasm" 
               onerror="this.src='./img/Frame 2087330637.png';">
        </div>
        <div class="auction-info">
         
          ${auction.description ? `<p>${auction.description}</p>` : ''}
        </div>
        <button class="auction-btn" onclick="showAuctionDetails(${index})">
          Подробнее
        </button>
      </div>
    `;
  });

  content += '</div>';

  card.innerHTML = content;
}
function renderDiagnosticCard(car) {
  const card = document.getElementById('diagnosticCard');
  if (!card) {
    console.error("diagnosticCard elementi topilmadi");
    return;
  }

  card.innerHTML = ''; // tozalash

  // Agar diagnostika yo‘q bo‘lsa
  if (!car || !Array.isArray(car.diagnosticHistory) || car.diagnosticHistory.length === 0) {
    card.innerHTML = `
      <div class="step_pt_card_title">
        <h2>Не найдены сведения о диагностике</h2>
        <div class="grey_circle"></div>
      </div>
      <p>Наши партнёры не осматривали автомобиль.</p>
    `;
    return;
  }

  // Diagnostika topilgan holat
  // Eng yangi diagnostikani olamiz (oxirgi element, agar sort bo‘lmasa)
  const diagnostic = car.diagnosticHistory[car.diagnosticHistory.length - 1];

  // Sana formatlash
  const inspectionDate = diagnostic.inspectionDate 
    ? new Date(diagnostic.inspectionDate).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }) 
    : '—';

  card.innerHTML = `
    <div class="step_pt_card_title">
      <h2>Результат диагностики</h2>
      <div class="green_circle"></div>
    </div>
    <p>Сведения из таможенной декларации</p>
    <h3 style="font-size: 18px; font-weight: 500; margin: 16px 0;">Осмотр от ${inspectionDate}</h3>
    
    <div class="diagnostic-info">
      <div class="diagnostic-row">
        <span class="diagnostic-label">Источник</span>
        <span class="diagnostic-value">${diagnostic.source || '—'}</span>
      </div>
      <div class="diagnostic-row">
        <span class="diagnostic-label">Пробег</span>
        <span class="diagnostic-value">${diagnostic.mileage ? diagnostic.mileage.toLocaleString('ru-RU') + ' км' : '—'}</span>
      </div>
      <div class="diagnostic-row">
        <span class="diagnostic-label">Регион</span>
        <span class="diagnostic-value">${diagnostic.region || '—'}</span>
      </div>
    </div>
  `;
}

// Damage points tooltip
function setupDamagePointsTooltip() {
    const points = document.querySelectorAll('.damage-point');
    
    points.forEach(point => {
        point.addEventListener('mouseenter', function() {
            const info = this.getAttribute('data-info');
            const tooltip = document.createElement('div');
            tooltip.className = 'damage-tooltip';
            tooltip.textContent = info;
            tooltip.style.cssText = `
                position: absolute;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 13px;
                white-space: nowrap;
                z-index: 1000;
                pointer-events: none;
            `;
            
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
            tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
            
            this._tooltip = tooltip;
        });
        
        point.addEventListener('mouseleave', function() {
            if (this._tooltip) {
                this._tooltip.remove();
            }
        });
    });
}

// Auction details
function showAuctionDetails() {
    alert('Открытие подробной информации об аукционе...');
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
   
 
});

// API dan ma'lumot kelganda yangilash
function updateDamageSection(damageFound, auctionFound, diagnosticFound) {
    hasDamage = damageFound;
    hasAuction = auctionFound;
    hasDiagnostic = diagnosticFound;
  
 
}

// Test uchun: o'zgaruvchilarni o'zgartirish
// setTimeout(() => {
//     updateDamageSection(true, true, true); // Hammasi topilgan
// }, 2000);



function renderNashModalRestrictions(car) {
  const container = document.querySelector('.nash_modal_mid_action'); // modal ichidagi asosiy container
  if (!container) {
    console.error(".nash_modal_mid_action topilmadi");
    return;
  }

  container.innerHTML = ''; // tozalash

  // Ma'lumotlar arrayini olish (sizning array nomingizga moslashtiring)
  const restrictionGroups = car.historyEvents

  if (!Array.isArray(restrictionGroups) || restrictionGroups.length === 0) {
    container.innerHTML = `
      <p style="text-align:center; color:#64748b; padding:20px;">
        Ограничений или запретов не найдено
      </p>
    `;
    return;
  }

  // Har bir guruh (sana + events) uchun kartochka yaratish
  restrictionGroups.forEach(group => {
    // Sana formatlash
    const date = group.date 
      ? new Date(group.date).toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }) 
      : '—';

    // Events ro‘yxati
    const eventsHTML = (group.events || []).map(event => `
      <div class="nash_modal_mid_action_card_grid">
        <div class="nash_modal_mid_action_card_grid_p">
    <img src="${event.image}">
          ${event.title}
        </div> 
        <span>${event.text || '—'}</span>
      </div>
    `).join('');

    const cardHTML = `
      <div class="nash_modal_mid_action_card">
        <div class="nash_modal_mid_action_card_title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 14H7V16H14V14ZM19 19H5V8H19V19ZM19 3H18V1H16V3H8V1H6V3H5C3.89 3 3 3.9 3 5V19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21H19C19.5304 21 20.0391 20.7893 20.4142 20.4142C20.7893 20.0391 21 19.5304 21 19V5C21 4.46957 20.7893 3.96086 20.4142 3.58579C20.0391 3.21071 19.5304 3 19 3ZM17 10H7V12H17V10Z" fill="#0A4BA9" />
          </svg>
          ${date}
        </div>
        ${eventsHTML}
      </div>
    `;

    container.insertAdjacentHTML('beforeend', cardHTML);
  });
}


function renderNashModalRestrictions1(car) {
  vZaloge(car);
  QidiruvHistory(car);
  SudHistory(car);
  LizingHistory(car);
  const container = document.querySelectorAll('.nash_modal_mid_action')[1]; // modal ichidagi asosiy container
  if (!container) {
    console.error(".nash_modal_mid_action topilmadi");
    return;
  }

  container.innerHTML = ''; // tozalash

  // Ma'lumotlar arrayini olish (sizning array nomingizga moslashtiring)
  const restrictionGroups = car.shtrafEvents

  if (!Array.isArray(restrictionGroups) || restrictionGroups.length === 0) {
    container.innerHTML = `
      <p style="text-align:center; color:#64748b; padding:20px;">
        Ограничений или запретов не найдено
      </p>
    `;
    return;
  }

  // Har bir guruh (sana + events) uchun kartochka yaratish
  restrictionGroups.forEach(group => {
    // Sana formatlash
    const date = group.date 
      ? new Date(group.date).toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }) 
      : '—';

    // Events ro‘yxati
    const eventsHTML = (group.events || []).map(event => `
      <div class="nash_modal_mid_action_card_grid">
        <div class="nash_modal_mid_action_card_grid_p">
    
          ${event.title}
        </div> 
        <span><img style="width:24px" src="${event.image}"> ${event.text || '—'}</span>
      </div>
    `).join('');

    const cardHTML = `
      <div class="nash_modal_mid_action_card">
        <div class="nash_modal_mid_action_card_title nash_modal_mid_action_card_title_red">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 14H7V16H14V14ZM19 19H5V8H19V19ZM19 3H18V1H16V3H8V1H6V3H5C3.89 3 3 3.9 3 5V19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21H19C19.5304 21 20.0391 20.7893 20.4142 20.4142C20.7893 20.0391 21 19.5304 21 19V5C21 4.46957 20.7893 3.96086 20.4142 3.58579C20.0391 3.21071 19.5304 3 19 3ZM17 10H7V12H17V10Z" fill="#0A4BA9" />
          </svg>
          Штраф: ${date} на 30 000 сум
        </div>
        ${eventsHTML}
      </div>
    `;

    container.insertAdjacentHTML('beforeend', cardHTML);
  });
}


function vZaloge(car) {
  const container = document.querySelector('#nash_modal_mid_action_card'); // modal ichidagi asosiy container
  if (!container) {
    console.error(".nash_modal_mid_action_card topilmadi");
    return;
  }

  container.innerHTML = ''; // tozalash

  // Ma'lumotlar arrayini olish (sizning array nomingizga moslashtiring)
  const restrictionGroups = car.ZalogHistory

  if (!Array.isArray(restrictionGroups) || restrictionGroups.length === 0) {
    container.innerHTML = `
      <p style="text-align:center; color:#64748b; padding:20px;">
        Ограничений или запретов не найдено
      </p>
    `;
    return;
  }
for (let i = 0; i < restrictionGroups.length; i++) {
  
  
 container.innerHTML +=`<div class="nash_modal_mid_action_card_grid">
                        <div class="nash_modal_mid_action_card_grid_p">${restrictionGroups[i].title}</div>
                        <span>
${restrictionGroups[i].text}</span>
                    </div>`
  
}


}




function QidiruvHistory(car) {
  const container = document.querySelector('#nash_modal_mid_action_card2'); // modal ichidagi asosiy container
  if (!container) {
    console.error(".nash_modal_mid_action_card2 topilmadi");
    return;
  }

  container.innerHTML = ''; // tozalash

  // Ma'lumotlar arrayini olish (sizning array nomingizga moslashtiring)
  const restrictionGroups = car.QidiruvHistory

  if (!Array.isArray(restrictionGroups) || restrictionGroups.length === 0) {
    container.innerHTML = `
      <p style="text-align:center; color:#64748b; padding:20px;">
        Ограничений или запретов не найдено
      </p>
    `;
    return;
  }
for (let i = 0; i < restrictionGroups.length; i++) {
  
  
 container.innerHTML +=`<div class="nash_modal_mid_action_card_grid">

                        <span>
                            ${restrictionGroups[i].title} <b>${restrictionGroups[i].text}</b>
                        </span>
                    </div>`
  
}


}

function SudHistory(car) {
  const container = document.querySelector('#nash_modal_mid_action_card3'); // modal ichidagi asosiy container
  if (!container) {
    console.error(".nash_modal_mid_action_card3 topilmadi");
    return;
  }

  container.innerHTML = ''; // tozalash

  // Ma'lumotlar arrayini olish (sizning array nomingizga moslashtiring)
  const restrictionGroups = car.SudHistory

  if (!Array.isArray(restrictionGroups) || restrictionGroups.length === 0) {
    container.innerHTML = `
      <p style="text-align:center; color:#64748b; padding:20px;">
        Ограничений или запретов не найдено
      </p>
    `;
    return;
  }
for (let i = 0; i < restrictionGroups.length; i++) {

  
 container.innerHTML +=`<div class="nash_modal_mid_action_card_grid">
                        <div class="nash_modal_mid_action_card_grid_p">${restrictionGroups[i].title}</div>
                        <span>
${restrictionGroups[i].text}</span>
                    </div>`
  
}


}

function LizingHistory(car) {
  const container = document.querySelector('#nash_modal_mid_action_card4'); // modal ichidagi asosiy container
  if (!container) {
    console.error(".nash_modal_mid_action_card4 topilmadi");
    return;
  }

  container.innerHTML = ''; // tozalash

  // Ma'lumotlar arrayini olish (sizning array nomingizga moslashtiring)
  const restrictionGroups = car.LizingHistory

  if (!Array.isArray(restrictionGroups) || restrictionGroups.length === 0) {
    container.innerHTML = `
      <p style="text-align:center; color:#64748b; padding:20px;">
        Ограничений или запретов не найдено
      </p>
    `;
    return;
  }
for (let i = 0; i < restrictionGroups.length; i++) {
  
  
 container.innerHTML +=`<div class="nash_modal_mid_action_card_grid">
                        <div class="nash_modal_mid_action_card_grid_p">${restrictionGroups[i].title}</div>
                        <span>
${restrictionGroups[i].text}</span>
                    </div>`
  
}


}