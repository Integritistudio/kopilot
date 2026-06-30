class KopilotHomeTestimonials {
  constructor(root) {
    this.root = root;
    this.swiperEl = root.querySelector('.kopilot-home-testimonials__swiper');
    this.prevBtn = root.querySelector('.kopilot-home-testimonials__nav-btn--prev');
    this.nextBtn = root.querySelector('.kopilot-home-testimonials__nav-btn--next');
    this.swiper = null;
    this.mq = window.matchMedia('(max-width: 767px)');

    if (!this.swiperEl) return;

    this.onMediaChange = this.onMediaChange.bind(this);
    this.mq.addEventListener('change', this.onMediaChange);
    this.waitForSwiper().then(() => this.onMediaChange());
  }

  waitForSwiper() {
    return new Promise((resolve) => {
      const check = () => {
        if (window.Swiper) return resolve();
        requestAnimationFrame(check);
      };
      check();
    });
  }

  onMediaChange() {
    if (this.mq.matches) {
      this.initSwiper();
      return;
    }

    this.destroySwiper();
  }

  initSwiper() {
    if (this.swiper) return;

    const navigation =
      this.prevBtn && this.nextBtn
        ? {
            prevEl: this.prevBtn,
            nextEl: this.nextBtn,
          }
        : undefined;

    this.swiper = new Swiper(this.swiperEl, {
      slidesPerView: 'auto',
      spaceBetween: 55,
      grabCursor: true,
      watchOverflow: true,
      navigation,
    });
  }

  destroySwiper() {
    if (!this.swiper) return;
    this.swiper.destroy(true, true);
    this.swiper = null;
  }

  destroy() {
    this.mq.removeEventListener('change', this.onMediaChange);
    this.destroySwiper();
  }
}

function initKopilotHomeTestimonials(root = document) {
  root.querySelectorAll('[data-kopilot-home-testimonials]').forEach((section) => {
    if (section._kopilotHomeTestimonials) {
      section._kopilotHomeTestimonials.destroy();
    }
    section._kopilotHomeTestimonials = new KopilotHomeTestimonials(section);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initKopilotHomeTestimonials());
} else {
  initKopilotHomeTestimonials();
}

document.addEventListener('shopify:section:load', (event) => initKopilotHomeTestimonials(event.target));
