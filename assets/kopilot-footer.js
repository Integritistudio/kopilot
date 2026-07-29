function footerInstagramSlider() {
  const slider = document.querySelector('.js-footer-instagram-slider');
  if (!slider || typeof Swiper === 'undefined') return;

  new Swiper(slider, {
    loop: false,
    slidesPerView: 1.4,
    spaceBetween: 10,
    autoplay: { delay: 3000 },
    breakpoints: {
      550: { slidesPerView: 2.2, spaceBetween: 10 },
      767: { slidesPerView: 2.5, spaceBetween: 20 },
      1024: { slidesPerView: 3, spaceBetween: 20 }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  footerInstagramSlider();
});
