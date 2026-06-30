class KopilotHomePartnerCta {
  constructor(root) {
    this.root = root;
    this.swiperEl = root.querySelector('.kopilot-home-partner-cta__swiper');
    this.prevBtn = root.querySelector('.kopilot-home-partner-cta__nav-btn--prev');
    this.nextBtn = root.querySelector('.kopilot-home-partner-cta__nav-btn--next');
    this.swiper = null;
    this.mq = window.matchMedia('(max-width: 1023px)');

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
      spaceBetween: 45,
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

function initKopilotHomePartnerCta(root = document) {
  root.querySelectorAll('[data-kopilot-home-partner-cta]').forEach((section) => {
    if (section._kopilotHomePartnerCta) {
      section._kopilotHomePartnerCta.destroy();
    }
    section._kopilotHomePartnerCta = new KopilotHomePartnerCta(section);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initKopilotHomePartnerCta());
} else {
  initKopilotHomePartnerCta();
}

document.addEventListener('shopify:section:load', (event) => initKopilotHomePartnerCta(event.target));
