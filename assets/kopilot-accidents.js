class KopilotAccidents {
  constructor(root) {
    this.root = root;
    this.swiperEl = root.querySelector('.kopilot-accidents__swiper');
    if (!this.swiperEl) return;
    this.init();
  }

  init() {
    this.swiper = new Swiper(this.swiperEl, {
      loop: true,
      grabCursor: true,
      pagination: {
        el: this.swiperEl.querySelector('.swiper-pagination'),
        clickable: true,
      },
    });
  }
}

document.querySelectorAll('[data-kopilot-accidents]').forEach((el) => new KopilotAccidents(el));
