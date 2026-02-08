var slider1=[
    {img:'../img/243dfd3d6587d14768a27f2bd398ba8a5fb55e13.png'},
    {img:'https://static.vecteezy.com/system/resources/thumbnails/053/733/179/small/every-detail-of-a-sleek-modern-car-captured-in-close-up-photo.jpg'},
    {img:'../img/243dfd3d6587d14768a27f2bd398ba8a5fb55e13.png'},
    {img:'../img/243dfd3d6587d14768a27f2bd398ba8a5fb55e13.png'},
    {img:'../img/243dfd3d6587d14768a27f2bd398ba8a5fb55e13.png'},
    {img:'../img/243dfd3d6587d14768a27f2bd398ba8a5fb55e13.png'},
]


for (let i = 0; i < 3; i++) {

if(i==2){
  document.querySelector('.car_slider_mid_image_smalls').innerHTML+=`<div class="car_slider_mid_image_small" style="
  background:
    linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)),
    url('${slider1[i].img}');
  background-size: cover;
  background-position: center;
">
  <button><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 4C13.0609 4 14.0783 4.42143 14.8284 5.17157C15.5786 5.92172 16 6.93913 16 8C16 9.06087 15.5786 10.0783 14.8284 10.8284C14.0783 11.5786 13.0609 12 12 12C10.9391 12 9.92172 11.5786 9.17157 10.8284C8.42143 10.0783 8 9.06087 8 8C8 6.93913 8.42143 5.92172 9.17157 5.17157C9.92172 4.42143 10.9391 4 12 4ZM12 14C16.42 14 20 15.79 20 18V20H4V18C4 15.79 7.58 14 12 14Z" fill="#606266"/>
</svg>
Еще +${slider1.length-3}</button>
  </div>`
}else{
      document.querySelector('.car_slider_mid_image_smalls').innerHTML+=` <div class="car_slider_mid_image_small" onclick="getImage('${slider1[i].img}')"  style="background:url('${slider1[i].img}') ;background-size: cover;" ></div>`
}
}

function getImage(paras) {
   
const el = document.querySelector('.car_slider_mid_image_big');

el.style.background = `url('${paras}')`;
el.style.backgroundSize = 'cover';
el.style.backgroundPosition = 'center';
}



function openNashModal() {
  document.body.classList.add("no-scroll");
  document.querySelector('#hard_modal_1').style.display="flex"
}

function closeNashModal() {
   document.body.classList.remove("no-scroll");
  document.querySelector('#hard_modal_1').style.display="none"
}