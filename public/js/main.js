var user = localStorage.getItem("user")
var toggle_type = false
var menu_navbar = false
if (user) {
    document.querySelector('.navbar_all_user_kirish').style = "display: none;"
    document.querySelector('.navbar_all_user_name').style = "display: flex;"
    document.querySelector('#name_user').innerHTML = JSON.parse(user).name;
} else {
    document.querySelector('.navbar_all_user_kirish').style = "display: flex;"
    document.querySelector('.navbar_all_user_name').style = "display: none;"
}
function viteOut_account() {
    user=null
    if (user) {
    document.querySelector('.navbar_all_user_kirish').style = "display: none;"
    document.querySelector('.navbar_all_user_name').style = "display: flex;"
    document.querySelector('#name_user').innerHTML = JSON.parse(user).name;
} else {
    document.querySelector('.navbar_all_user_kirish').style = "display: flex;"
    document.querySelector('.navbar_all_user_name').style = "display: none;"
}
}
if (toggle_type) {
    document.querySelector('.navbar_all_user_menu').style = "display: flex;"
} else {
    document.querySelector('.navbar_all_user_menu').style = "display: none;"
}
if (menu_navbar) {
    document.querySelector('.navbar_all_menu').style = "display: flex;"
} else {
    document.querySelector('.navbar_all_menu').style = "display: none;"
}
function userButton() {
    if (!toggle_type) {
        document.querySelector('.navbar_all_user_menu').style = "display: flex;"
        document.querySelector('.navbar_all_user_arow').style.transform = "rotate(180deg)";
        toggle_type = true
    } else {
        document.querySelector('.navbar_all_user_menu').style = "display: none;"
        document.querySelector('.navbar_all_user_arow').style.transform = "rotate(0deg)";
        toggle_type = false


    }
}
function toggle_menu() {
    console.log("sss");

    if (!menu_navbar) {
        menu_navbar = true
        document.querySelector('.navbar_all_menu').style = "display: flex;"
        document.querySelector('#togle').src = "./img/close.png"

        document.body.classList.add("no-scroll");
    } else {
        menu_navbar = false
        document.querySelector('#togle').src = "./img/menu-4-line.png"
        document.querySelector('.navbar_all_menu').style = "display: none;"
        document.body.classList.remove("no-scroll");
    }
}

const modal = document.getElementById("modal");
const openBtn = document.getElementById("openModal");
const closeBtn = document.querySelector(".close");

openBtn.onclick = () => {
    modal.classList.add("active");
    document.body.classList.add("no-scroll");
};
function closeBtnfn(params) {
    modal.classList.remove("active");

    document.body.classList.remove("no-scroll");
}


// tashqarisini bosganda yopilsin
modal.onclick = (e) => {
    if (e.target === modal) {
        modal.classList.remove("active");
        document.body.classList.remove("no-scroll");
    }
};



const input = document.getElementById("tl_phone");
const input2 = document.getElementById("tl_phone2");

input.value = "+998 ";
input2.value = "+998 ";
input.addEventListener("input", () => {
    let numbers = input.value.replace(/\D/g, "");

    if (!numbers.startsWith("998")) {
        numbers = "998";
    }

    numbers = numbers.substring(3, 12);

    let formatted = "+998";

    if (numbers.length > 0) formatted += " " + numbers.substring(0, 2);
    if (numbers.length > 2) formatted += " " + numbers.substring(2, 5);
    if (numbers.length > 5) formatted += " " + numbers.substring(5, 7);
    if (numbers.length > 7) formatted += " " + numbers.substring(7, 9);

    input.value = formatted;
});
input2.addEventListener("input", () => {
    let numbers = input2.value.replace(/\D/g, "");

    if (!numbers.startsWith("998")) {
        numbers = "998";
    }

    numbers = numbers.substring(3, 12);

    let formatted = "+998";

    if (numbers.length > 0) formatted += " " + numbers.substring(0, 2);
    if (numbers.length > 2) formatted += " " + numbers.substring(2, 5);
    if (numbers.length > 5) formatted += " " + numbers.substring(5, 7);
    if (numbers.length > 7) formatted += " " + numbers.substring(7, 9);

    input2.value = formatted;
});
// +998 ni o‘chirib yubormaslik
input.addEventListener("keydown", (e) => {
    if (input.selectionStart <= 5 && (e.key === "Backspace" || e.key === "Delete")) {
        e.preventDefault();
    }
});
input2.addEventListener("keydown", (e) => {
    if (input2.selectionStart <= 5 && (e.key === "Backspace" || e.key === "Delete")) {
        e.preventDefault();
    }
});


function openRegister() {
    document.querySelector('.kirish').style = "display:none"
    document.querySelector('.register').style = "display:block"

}
function openKirish() {
    document.querySelector('.kirish').style = "display:block"
    document.querySelector('.register').style = "display:none"
    document.querySelector('.Potverdit').style = "display:none"

}
function startVerifyTimer(type, phone) {
 const now = Date.now();
    const expireTime =now+4 * 60 * 1000;

    localStorage.setItem('verify_expire_time', expireTime);
    localStorage.setItem('verify_type', type);
    localStorage.setItem('verify_phone', phone);
}
function maskPhone(phone) {
    // +998901234567 → +99890*****67
    return phone.replace(/^(\+?\d{5})\d+(\d{2})$/, '$1*****$2');
}
function startCountdown() {
    
    const expireTime = localStorage.getItem('verify_expire_time');
    const phone = localStorage.getItem('verify_phone');

    if (!expireTime || !phone) return;


    // telefonni chiqarish
    document.getElementById('verify_phone_text').innerText =
        `Код отправлен на ваш номер телефона ${maskPhone(phone)}`;

    function updateTimer() {
        const now = Date.now();
        const diff = expireTime - now;

        if (diff <= 0) {
            clearInterval(timerInterval);
            document.getElementById('timer_text').innerText =
                'Код истёк. Отправить снова';
            return;
        }

        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        document.getElementById('timer_text').innerText =
            `Отправить код снова через: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}
const API = '/api/users';
    async function openKirish_1() {
        console.log("qwqwewq");
        
        const phone = document.getElementById('tl_phone').value.trim();

        if (!phone) {
            alert('Telefon raqam kiriting');
            return;
        }

        try {
            const res = await fetch(`${API}/resend-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            });

            const data = await res.json();

            if (!data.success) {
                document.querySelector('.kirish span').style = "display:block"
                document.querySelector('#tl_phone').style = "border:1px solid red;margin-bottom: 20px;"

                // alert(data.message);
                return;
            }

       startVerifyTimer('login', phone);
       
document.querySelector('.Potverdit').style = "display:block";
document.querySelector('.kirish').style = "display:none";


startCountdown();



        } catch (err) {
             document.querySelector('.kirish span').style = "display:block"
                document.querySelector('#tl_phone').style = "border:1px solid red"
            console.error(err);
        }
    }



async function registerUser() {
   
    
  const name  = document.getElementById('tl_phone1').value.trim();
  const phone = document.getElementById('tl_phone2').value.trim();

  if (!name) {
    document.getElementById('reg_name_err').style.display = 'block';
    return;
  }

  if (!phone) {
    document.getElementById('reg_phone_err').style.display = 'block';
    return;
  }

  try {
    const res = await fetch(`${API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone })
    });

    const data = await res.json();

    if (!data.success) {
           document.querySelector('.register span').style = "display:block"
                document.querySelector('#tl_phone1').style = "border:1px solid red"
                document.querySelector('#tl_phone2').style = "border:1px solid red"
      alert(data.message);
      return;
    }
  // success → verify oynani ochamiz
startVerifyTimer('register', phone);

document.querySelector('.Potverdit').style = "display:block";
document.querySelector('.register').style = "display:none";
startCountdown();



  } catch (err) {
     document.querySelector('.register span').style = "display:block"
                document.querySelector('#tl_phone1').style = "border:1px solid red"
                document.querySelector('#tl_phone2').style = "border:1px solid red"
 
            }
}

let timerInterval = null;




const inputs = document.querySelectorAll(".otp-input");

inputs.forEach((input, index) => {

    input.addEventListener("input", () => {
        input.value = input.value.replace(/\D/g, "");

        if (input.value && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !input.value && index > 0) {
            inputs[index - 1].focus();
        }
    });
});

// ixtiyoriy: birinchi inputga avtomatik fokus
inputs[0].focus();
function getOtpCode() {
    const inputs = document.querySelectorAll('.otp-input');
    let code = '';

    inputs.forEach(input => {
        code += input.value.trim();
    });

    return code;
}
function isVerifyExpired() {
    const expireTime = localStorage.getItem('verify_expire_time');
    if (!expireTime) return true;
    return Date.now() > Number(expireTime);
}
async function uspeshniyFu() {
    const phone = localStorage.getItem('verify_phone');
    const code = getOtpCode();

    if (!phone) {
        alert('Telefon topilmadi');
        return;
    }

    if (isVerifyExpired()) {
        alert('Kod muddati tugagan');
        return;
    }

    if (code.length !== 5) {
        alert('Kod to‘liq kiritilmadi');
        return;
    }

    try {
        const res = await fetch(`${API}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, code })
        });

        const data = await res.json();

        if (!data.success) {
            alert(data.message);
            return;
        }

  

    // USER MA’LUMOTLARINI SAQLASH
    localStorage.setItem('user', JSON.stringify(data.user));

    document.querySelector('.navbar_all_user_kirish').style = "display: none;"
    document.querySelector('.navbar_all_user_name').style = "display: flex;"

    document.querySelector('.uspeshniy').style = "display:flex";
document.querySelector('#name_user').innerHTML = data.user.name;
    localStorage.removeItem('verify_expire_time');
    localStorage.removeItem('verify_type');
    localStorage.removeItem('verify_phone');

    modal.classList.remove("active");
    document.body.classList.remove("no-scroll");

    setTimeout(() => {
        document.querySelector('.uspeshniy').style = "display:none";
        openKirish();
    }, 3000);



    } catch (err) {
        console.error(err);
        alert('Server bilan xatolik');
    }
}


async function openCarInfo() {
  document.body.classList.add("no-scroll");

  const input = document.getElementById("carSearchInput");
  const query = input.value.trim();

  if (!query) {
    input.style.border = "1px solid red";
    return;
  }
  input.style.border = "1px solid #ccc";

  try {
    const response = await fetch(`/api/cars/search?q=${encodeURIComponent(query)}`);
    const result = await response.json();

    if (!result.success || !result.data || result.data.length === 0) {
      alert("Avtomobil topilmadi");
      return;
    }

    const car = result.data[0];

    // ====== Asosiy ma'lumotlar ======
    document.getElementById("modalVin").innerText = car.vin || "-";
    document.getElementById("modalCarName").innerText = car.carName || "-";

    // ====== Avtomobil rasm ======
    const carImage = car.images?.length
      ? car.images[0].url
      : "https://img.freepik.com/premium-vector/blue-car-flat-style-illustration-isolated-white-background_108231-795.jpg";

    const carImageElem = document.querySelector(".infocar_card img");
    carImageElem.src = carImage;
    carImageElem.alt = car.carName || "Car";

    // ====== FEATURES (TO‘LIQ FIX) ======
    const info1 = document.querySelector(".infocar_info_1");
    info1.querySelectorAll(".feature-infocar_card").forEach(el => el.remove());

    if (Array.isArray(car.features) && car.features.length) {

      const sorted = [...car.features].sort((a, b) => (a.order || 0) - (b.order || 0));

      sorted.forEach(f => {
        const iconUrl = f.image
          ? (f.image.startsWith("http") ? f.image : `${window.location.origin}${f.image}`)
          : "";

        const div = document.createElement("div");
        div.className = "infocar_info_1_card feature-infocar_card";

        div.innerHTML = `
          <p style="display:flex;align-items:center;gap:6px">
            ${iconUrl ? `<img src="${iconUrl}" width="22">` : ""}
            ${f.title || ""}
          </p>
          <p>${f.text || ""}</p>
        `;

        info1.appendChild(div);
      });
    }

    // ====== REPORT BUTTON ======
    const reportBtn = document.getElementById("getReportBtn");
    if (reportBtn) {
      reportBtn.onclick = () => {
        const gosNumber = encodeURIComponent(car.gosNumber || "");
        window.location.href = `/otchot.html?gosNumber=${gosNumber}`;
      };
    }

    // ====== MODAL OPEN ======
    document.getElementById("modal_2").style.display = "flex";

  } catch (error) {
    console.error("Search error:", error);
    alert("Server bilan bog‘lanishda xatolik");
  }
}


function closeCarInfo() {
    document.getElementById("modal_2").style.display = "none";
}

function closeCarInfo() {
    document.body.classList.remove("no-scroll");
    document.querySelector('#modal_2').style = "display:none"
}





// API dan ma'lumot olish
async function loadCarData(searchQuery) {
  try {
    const response = await fetch(`/api/cars/search?q=${searchQuery}`);
    const result = await response.json();
    
    if (result.success && result.data.length > 0) {
      const car = result.data[0]; // Birinchi mashinani olamiz
      renderProbegChart(car.probegHistory);
    }
  } catch (error) {
    console.error('Ma\'lumot yuklashda xatolik:', error);
  }
}

// Diagrammani chizish funksiyasi
function renderProbegChart(probegHistory) {
  // 1. Year bo'yicha sort qilish (o'sish tartibida)
  const sortedData = [...probegHistory].sort((a, b) => a.year - b.year);
  
  if (sortedData.length === 0) return;

  // 2. Min va max qiymatlarni topish
  const minKm = Math.min(...sortedData.map(p => p.kilometer));
  const maxKm = Math.max(...sortedData.map(p => p.kilometer));
  const kmRange = maxKm - minKm || 1;

  // 3. SVG koordinatalarini hisoblash
  const svgWidth = 1000;
  const svgHeight = 200; // 40-200 oralig'i (grid ichida)
  const padding = 20;
  
  // X koordinatasi: yillar bo'yicha teng taqsimlash
  const xStep = (svgWidth - padding * 2) / (sortedData.length - 1 || 1);
  
  // Points va polyline uchun koordinatalar
  let points = [];
  let circles = [];
  let years = [];
  
  sortedData.forEach((item, index) => {
    const x = padding + (index * xStep);
    // Y koordinatasi: kilometrni teskari tartibda (yuqorida kam, pastda ko'p)
    const y = 200 - ((item.kilometer - minKm) / kmRange) * 160;
    
    points.push(`${x},${y}`);
    circles.push({ x, y, km: item.kilometer, year: item.year });
    years.push(item.year);
  });

  // 4. Anomaliyalarni aniqlash (probeg kamaygan yoki juda ko'p oshgan)
  let greenEndIndex = 0;
  for (let i = 1; i < sortedData.length; i++) {
    const prevKm = sortedData[i - 1].kilometer;
    const currKm = sortedData[i].kilometer;
    
    // Agar probeg kamaygan bo'lsa yoki juda ko'p oshgan bo'lsa - anomaliya
    if (currKm < prevKm || (currKm - prevKm) > 50000) {
      greenEndIndex = i - 1;
      break;
    }
  }
  
  if (greenEndIndex === 0) greenEndIndex = sortedData.length - 1;

  // 5. HTML ni yangilash
  const svg = document.querySelector('.probeg .chart svg');
  const yearsContainer = document.querySelector('.probeg .chart .years');
  const statusDiv = document.querySelector('.probeg .status');
  const kmHeader = document.querySelector('.probeg h2');

  // Polyline (qizil chiziq)
  const redPolyline = svg.querySelector('polyline[stroke="red"]');
  redPolyline.setAttribute('points', points.join(' '));

  // Polyline (yashil qism)
  const greenPoints = points.slice(0, greenEndIndex + 1);
  const greenPolyline = svg.querySelector('polyline[stroke="#00b050"]');
  greenPolyline.setAttribute('points', greenPoints.join(' '));

  // Circlelarni yangilash
  const circlesGroup = svg.querySelector('g:last-child');
  circlesGroup.innerHTML = circles.map((c, i) => {
    const isGreen = i <= greenEndIndex;
    const isAnomaly = i > 0 && sortedData[i].kilometer < sortedData[i - 1].kilometer;
    
    if (isGreen && i === greenEndIndex) {
      return `<circle cx="${c.x}" cy="${c.y}" r="6" fill="#fff" stroke="#00b050" stroke-width="2" />`;
    } else if (isGreen) {
      return `<circle cx="${c.x}" cy="${c.y}" r="6" fill="#fff" stroke="#00b050" stroke-width="2" />`;
    } else if (isAnomaly) {
      return `<circle cx="${c.x}" cy="${c.y}" r="6" fill="red" />`;
    } else {
      return `<circle cx="${c.x}" cy="${c.y}" r="6" fill="#fff" stroke="red" stroke-width="2" />`;
    }
  }).join('');

  // Yillarni ko'rsatish
  yearsContainer.innerHTML = years.map(y => `<span>${y}</span>`).join('');

  // Status va km ma'lumotini yangilash
  const lastKm = sortedData[sortedData.length - 1].kilometer;
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

  kmHeader.textContent = `от ${minKm.toLocaleString()} км`;
}

// Ishga tushirish
// Masalan, VIN kod bo'yicha qidirish
loadCarData('WBA3B5C50FP123456');