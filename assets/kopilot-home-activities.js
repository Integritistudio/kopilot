class KopilotHomeActivities {
  constructor(root) {
    this.root = root;
    this.swiperEl = root.querySelector('.kopilot-home-activities__swiper');
    this.prevBtn = root.querySelector('.kopilot-home-activities__nav-btn--prev');
    this.nextBtn = root.querySelector('.kopilot-home-activities__nav-btn--next');
    this.swiper = null;
    this.mq = window.matchMedia('(max-width: 767px)');

    if (!this.swiperEl) return;

    this.onMediaChange = this.onMediaChange.bind(this);
    this.onExpandClick = this.onExpandClick.bind(this);
    this.mq.addEventListener('change', this.onMediaChange);
    this.bindExpandButtons();
    this.waitForSwiper().then(() => this.onMediaChange());
  }

  bindExpandButtons() {
    this.root.querySelectorAll('[data-kopilot-activity-expand]').forEach((button) => {
      if (button._kopilotExpandBound) return;
      button._kopilotExpandBound = true;
      button.addEventListener('click', this.onExpandClick);
    });
  }

  onExpandClick(event) {
    if (!this.mq.matches) return;

    event.preventDefault();
    event.stopPropagation();

    const button = event.currentTarget;
    const card = button.closest('.kopilot-home-activities__card');
    if (!card) return;

    const willExpand = !card.classList.contains('is-expanded');

    this.collapseExpandedCards();

    if (willExpand) {
      card.classList.add('is-expanded');
      button.setAttribute('aria-expanded', 'true');
    }
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

    this.collapseExpandedCards();

    this.destroySwiper();
  }

  collapseExpandedCards() {
    this.root.querySelectorAll('.kopilot-home-activities__card.is-expanded').forEach((card) => {
      card.classList.remove('is-expanded');
      const button = card.querySelector('[data-kopilot-activity-expand]');
      if (button) button.setAttribute('aria-expanded', 'false');
    });
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
      spaceBetween: 21,
      grabCursor: true,
      watchOverflow: true,
      navigation,
      on: {
        slideChange: () => this.collapseExpandedCards(),
      },
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

function initKopilotHomeActivities(root = document) {
  root.querySelectorAll('[data-kopilot-home-activities]').forEach((section) => {
    if (section._kopilotHomeActivities) {
      section._kopilotHomeActivities.destroy();
    }
    section._kopilotHomeActivities = new KopilotHomeActivities(section);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initKopilotHomeActivities());
} else {
  initKopilotHomeActivities();
}

document.addEventListener('shopify:section:load', (event) => initKopilotHomeActivities(event.target));
