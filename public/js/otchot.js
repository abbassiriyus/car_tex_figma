
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
    bigImage.style.background = `url('${slider[0]}')`;
    bigImage.style.backgroundSize = 'cover';
    bigImage.style.backgroundPosition = 'center';

    // Smalls
    console.log(slider);
    
    slider.forEach((img, i) => {
        if (i == 2 && slider.length >3) {
            // "+N" rasm
            sliderContainer.innerHTML += `
            <div class="car_slider_mid_image_small" style="background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${img}'); background-size: cover; background-position: center;">
                <button onclick="openCarImgModal()">
                    Еще +${slider.length - 3}
                </button>
            </div>`;
        } else if(i<3) {
            sliderContainer.innerHTML += `<div class="car_slider_mid_image_small" onclick="getImage('${img}')" style="background:url('${img}'); background-size: cover; background-position: center;"></div>`;
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
        modalCardsContainer.innerHTML += `
        <div class="car_image_modal_mid_card" onclick="getImage('${img}'); closeCarImgModal();">
            <div class="car_image_modal_mid_card_type">
                <p>Изображение ${i + 1}</p>
            </div>
            <div style="background:url('${img}'); background-size: cover; background-position: center; width:100%; height:100%; border-radius:8px;"></div>
        </div>
        `;
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

    // Slider
    populateSlider(car);

    // Modal
    populateCarImageModal(car);

    // Text info
    document.querySelector('.car_slider_mid_text h1').innerText = `${car.carName}, ${car.year}`;
    document.querySelectorAll('.car_slider_mid_text_p')[0].innerHTML = `<b>VIN</b>: ${car.vin} <svg onclick="navigator.clipboard.writeText('${car.vin}');alert('saqlandi')" width="19" height="22" viewBox="0 0 19 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 20H6V6H17V20ZM17 4H6C5.46957 4 4.96086 4.21071 4.58579 4.58579C4.21071 4.96086 4 5.46957 4 6V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H17C17.5304 22 18.0391 21.7893 18.4142 21.4142C18.7893 21.0391 19 20.5304 19 20V6C19 5.46957 18.7893 4.96086 18.4142 4.58579C18.0391 4.21071 17.5304 4 17 4ZM14 0H2C1.46957 0 0.960859 0.210714 0.585786 0.585786C0.210714 0.960859 0 1.46957 0 2V16H2V2H14V0Z" fill="#383838"/></svg>`;
    document.querySelectorAll('.car_slider_mid_text_p')[1].innerHTML = `<b>Госномер</b>: ${car.gosNumber} <svg onclick="navigator.clipboard.writeText('${car.gosNumber}');alert('saqlandi')" width="19" height="22" viewBox="0 0 19 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 20H6V6H17V20ZM17 4H6C5.46957 4 4.96086 4.21071 4.58579 4.58579C4.21071 4.96086 4 5.46957 4 6V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H17C17.5304 22 18.0391 21.7893 18.4142 21.4142C18.7893 21.0391 19 20.5304 19 20V6C19 5.46957 18.7893 4.96086 18.4142 4.58579C18.0391 4.21071 17.5304 4 17 4ZM14 0H2C1.46957 0 0.960859 0.210714 0.585786 0.585786C0.210714 0.960859 0 1.46957 0 2V16H2V2H14V0Z" fill="#383838"/></svg>`;
})();



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
