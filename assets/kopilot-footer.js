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

function toggleContactModal(close) {
  const popup = document.querySelector('.contact-form-popup');
  const overflow = document.querySelector('.contact-form-popup-overflow');
  const shouldClose = close === true;

  if (shouldClose) {
    popup?.classList.remove('open');
    overflow?.classList.remove('active');
    document.body.classList.remove('disable-scroll');
    return;
  }

  popup?.classList.add('open');
  overflow?.classList.add('active');
  document.body.classList.add('disable-scroll');
}

function contactModalTrigger() {
  document.querySelectorAll('.js-open-contact').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      toggleContactModal(false);
    });
  });

  document.querySelectorAll('.js-close-contact, .contact-form-popup-overflow').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      toggleContactModal(true);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  footerInstagramSlider();
  contactModalTrigger();
});
