class KopilotAmbassadors {
  constructor(section) {
    this.section = section;
    this.swiperEl = section.querySelector('.kopilot-ambassadors__swiper');
    this.fill = section.querySelector('.kopilot-ambassadors__progress-fill');
    this.track = section.querySelector('.kopilot-ambassadors__progress-track');
    this.prevBtn = section.querySelector('.kopilot-ambassadors__nav-btn--prev');
    this.nextBtn = section.querySelector('.kopilot-ambassadors__nav-btn--next');
    this.swiper = null;

    if (!this.swiperEl) return;

    this.waitForSwiper().then(() => this.init());
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

  init() {
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
      spaceBetween: 50,
      grabCursor: true,
      watchOverflow: true,
      slidesOffsetBefore: 0,
      navigation,
      breakpoints: {
        991: {
          spaceBetween: 30,
          slidesOffsetBefore: 0,
        },
      },
      on: {
        init: (swiper) => this.updateProgress(swiper),
        resize: (swiper) => this.updateProgress(swiper),
        setTranslate: (swiper) => this.updateProgress(swiper),
        transitionEnd: (swiper) => this.updateProgress(swiper),
      },
    });
  }

  updateProgress(swiper) {
    if (!this.fill || !this.track) return;

    const trackWidth = this.track.offsetWidth;
    const scrollWidth = swiper.wrapperEl.scrollWidth;
    const visibleWidth = swiper.width;

    if (scrollWidth <= visibleWidth) {
      this.fill.style.width = `${trackWidth}px`;
      this.fill.style.transform = 'translateX(0)';
      return;
    }

    const thumbWidth = Math.max((visibleWidth / scrollWidth) * trackWidth, 40);
    const maxTranslate = Math.abs(swiper.maxTranslate()) || 1;
    const progress = Math.min(Math.abs(swiper.translate) / maxTranslate, 1);
    const thumbOffset = progress * (trackWidth - thumbWidth);

    this.fill.style.width = `${thumbWidth}px`;
    this.fill.style.transform = `translateX(${thumbOffset}px)`;
  }

  destroy() {
    if (this.swiper) {
      this.swiper.destroy(true, true);
      this.swiper = null;
    }
  }
}

function initKopilotAmbassadors(root = document) {
  root.querySelectorAll('.kopilot-ambassadors').forEach((section) => {
    if (section._kopilotAmbassadors) {
      section._kopilotAmbassadors.destroy();
    }
    section._kopilotAmbassadors = new KopilotAmbassadors(section);
  });
}

document.addEventListener('DOMContentLoaded', () => initKopilotAmbassadors());
document.addEventListener('shopify:section:load', (event) => initKopilotAmbassadors(event.target));
