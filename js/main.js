var user=localStorage.getItem("user")
var toggle_type=false
var menu_navbar=false
if (user) {
    document.querySelector('.navbar_all_user_kirish').style="display: none;"
    document.querySelector('.navbar_all_user_name').style="display: flex;"
}else{
 document.querySelector('.navbar_all_user_kirish').style="display: flex;"
    document.querySelector('.navbar_all_user_name').style="display: none;"
}

if(toggle_type){
document.querySelector('.navbar_all_user_menu').style="display: flex;"
}else{
document.querySelector('.navbar_all_user_menu').style="display: none;"
}
if(menu_navbar){
document.querySelector('.navbar_all_menu').style="display: flex;"
}else{
document.querySelector('.navbar_all_menu').style="display: none;"
}
function userButton() {
    if(!toggle_type){
document.querySelector('.navbar_all_user_menu').style="display: flex;"
document.querySelector('.navbar_all_user_arow').style.transform = "rotate(180deg)";
toggle_type=true
}else{
document.querySelector('.navbar_all_user_menu').style="display: none;"
document.querySelector('.navbar_all_user_arow').style.transform = "rotate(0deg)";
toggle_type=false


}
}
function toggle_menu() {
    console.log("sss");
    
    if(!menu_navbar){
        menu_navbar=true
document.querySelector('.navbar_all_menu').style="display: flex;"
 document.querySelector('#togle').src="./img/close.png"

document.body.classList.add("no-scroll");
}else{
    menu_navbar=false
    document.querySelector('#togle').src="./img/menu-4-line.png"
document.querySelector('.navbar_all_menu').style="display: none;"
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
    document.querySelector('.kirish').style="display:none"
    document.querySelector('.register').style="display:block"

}
function openKirish() {
    document.querySelector('.kirish').style="display:block"
    document.querySelector('.register').style="display:none"
    document.querySelector('.Potverdit').style="display:none"

}
function openPotverdit() {
    document.querySelector('.Potverdit').style="display:block"
    document.querySelector('.register').style="display:none"
}



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

function uspeshniyFu() {
     document.querySelector('.uspeshniy').style="display:flex"
         
    modal.classList.remove("active");
        document.body.classList.remove("no-scroll");
     setTimeout(() => {
     document.querySelector('.uspeshniy').style="display:none"
        openKirish()
     }, 3000);
}


function openCarInfo() {
    document.body.classList.add("no-scroll");
    document.querySelector('#modal_2').style="display:flex"
}

function closeCarInfo() {
    document.body.classList.remove("no-scroll");
    document.querySelector('#modal_2').style="display:none"
}
