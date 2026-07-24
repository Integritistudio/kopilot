var Shopify = Shopify || {};
// ---------------------------------------------------------------------------
// Money format handler
// ---------------------------------------------------------------------------
Shopify.money_format = "${{amount}}";
Shopify.formatMoney = function (cents, format) {
  if (typeof cents == "string") {
    cents = cents.replace(".", "");
  }
  var value = "";
  var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  var formatString = format || this.money_format;

  function defaultOption(opt, def) {
    return typeof opt == "undefined" ? def : opt;
  }

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultOption(precision, 2);
    thousands = defaultOption(thousands, ",");
    decimal = defaultOption(decimal, ".");

    if (isNaN(number) || number == null) {
      return 0;
    }

    number = (number / 100.0).toFixed(precision);

    var parts = number.split("."),
      dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1" + thousands),
      cents = parts[1] ? decimal + parts[1] : "";

    return dollars + cents;
  }

  switch (formatString.match(placeholderRegex)[1]) {
    case "amount":
      value = formatWithDelimiters(cents, 2);
      break;
    case "amount_no_decimals":
      value = formatWithDelimiters(cents, 0);
      break;
    case "amount_with_comma_separator":
      value = formatWithDelimiters(cents, 2, ".", ",");
      break;
    case "amount_no_decimals_with_comma_separator":
      value = formatWithDelimiters(cents, 0, ".", ",");
      break;
  }

  return formatString.replace(placeholderRegex, value);
};


// PROMO TILE
class PromoTile extends HTMLElement {
  constructor() {
    super();
    this.inner = this.querySelector('.promo_tile_inner');
    this.imgWrapper = this.querySelector('.promo_tile_img');
  }

  connectedCallback() {
    document.addEventListener('DOMContentLoaded', this.render.bind(this));
    document.addEventListener('DOMContentLoaded', this.zoomOut.bind(this));
  }

  render() {
    if (this.inner) {
      setTimeout(() => {
        this.inner.classList.add('visible');
      }, 250)
    }
  }

  zoomOut() {
    if (this.imgWrapper) {
      this.querySelector('img').classList.add('zoom_out');
    }
  }
}

customElements.define('promo-tile', PromoTile);


// PROMO COUNTDOWN
class PromoCountdown extends HTMLElement {
  constructor() {
    super();
    this.interval = null;
    this.dateString = this.dataset.date;
  }

  connectedCallback() {
    if (!this.dateString) {
      this.invalidate();
      return;
    }

    const parsedDate = new Date(this.dateString.replace(" ", "T"));

    if (isNaN(parsedDate.getTime())) {
      this.invalidate();
      return;
    }

    this.targetDate = parsedDate;

    this.daysEl = this.querySelector("[data-promo-days] p");
    this.hoursEl = this.querySelector("[data-promo-hours] p");
    this.minutesEl = this.querySelector("[data-promo-minutes] p");
    this.secondsEl = this.querySelector("[data-promo-seconds] p");

    this.update();
    this.interval = setInterval(() => this.update(), 1000);
  }

  disconnectedCallback() {
    clearInterval(this.interval);
  }

  invalidate() {
    this.render(0, 0, 0, 0);
    clearInterval(this.interval);
    this.classList.add("is-invalid");
  }

  update() {
    const now = new Date();
    const diff = this.targetDate - now;

    if (diff <= 0) {
      this.render(0, 0, 0, 0);
      clearInterval(this.interval)
      this.classList.add('is_complete');
      return;
    }

    const seconds = Math.floor(diff / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    this.render(days, hours, minutes, secs);
  }

  render(days, hours, minutes, seconds) {
    this.fadeUpdate(this.daysEl, days);
    this.fadeUpdate(this.hoursEl, hours);
    this.fadeUpdate(this.minutesEl, minutes);
    this.fadeUpdate(this.secondsEl, seconds);
  }

  fadeUpdate(el, value) {
    if (!el) return;

    const newValue = String(value).padStart(2, "0");

    if (el.textContent === newValue) return;

    el.classList.add("is-fading");

    setTimeout(() => {
      el.textContent = newValue;
      el.classList.remove("is-fading");
    }, 180); // half of CSS duration
  }

}

customElements.define('promo-countdown', PromoCountdown);


// REVEAL ON SCROLL
class ScrollReveal {
  constructor(selector = ".reveal", staggerDelay = 300) {
    this.selector = selector;
    this.staggerDelay = staggerDelay;

    this.isEditor = Shopify && Shopify.designMode;

    this.observer = new IntersectionObserver(this.onIntersect.bind(this), {
      root: null,
      threshold: 0.2,
    });

    this.initElements();
  }

  initElements(scope = document) {
    const elements = scope.querySelectorAll(this.selector);

    elements.forEach((el) => {
      if (el.dataset.revealed === "true") return;

      // ✅ FIX: show instantly in editor
      if (this.isEditor) {
        el.style.opacity = 1;
        el.style.transform = "none";
        el.dataset.revealed = "true";
        return;
      }

      el.style.opacity = 0;
      el.style.transform = "translateY(20px)";
      el.style.transition = "opacity 0.4s ease, transform 0.4s ease";

      this.observer.observe(el);
    });
  }

  // Stagger reveal for a specific batch
  staggerBatch(elements) {
    elements.forEach((el, index) => {
      setTimeout(() => {
        el.style.opacity = 1;
        el.style.transform = "translateY(0)";
        el.dataset.revealed = "true";
      }, index * this.staggerDelay);

      this.observer.unobserve(el);
    });
  }

  onIntersect(entries, observer) {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      const el = entry.target;

      // normal scroll-based stagger (initial load)
      if (el.classList.contains("stagger")) {
        const siblings = Array.from(
          el.parentNode.querySelectorAll(".reveal.stagger"),
        ).filter((sib) => sib.dataset.revealed !== "true");

        this.staggerBatch(siblings);
      } else {
        el.style.opacity = 1;
        el.style.transform = "translateY(0)";
        el.dataset.revealed = "true";
        observer.unobserve(el);
      }
    });
  }
}

// Initialize on DOM ready
let scrollReveal;

document.addEventListener("DOMContentLoaded", () => {
  scrollReveal = new ScrollReveal(".reveal", 150);
});

document.addEventListener("shopify:section:load", (event) => {
  if (!scrollReveal) return;
  scrollReveal.initElements(event.target);
});


// DEBOUNCE
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}


// HERO BANNER
class HeroBanner extends HTMLElement {
  constructor() {
    super();

    this.hero = this.querySelector('.hero_banner_inner');
    this.ticker = this.hero?.querySelector('.hero_banner_ticker_list');
    this.blocks = this.querySelectorAll('.hero_banner_block');
    this.prev = this.querySelector('.prev_arrow');
    this.next = this.querySelector('.next_arrow');

    this.isAnimating = false;
    this.animationDuration = 450;

    // Reveal
    this.hasAnimated = false;
    this.observer = null;

    // Ticker
    this.targetX = 0;
    this.currentX = 0;
    this.rafId = null;
    this.strength = 50;
    this.ease = 0.08;

    // Image stack
    this.stackIndex = 0;

    // Pagination
    this.currentSlideNumber = 1;
    this.totalSlides = this.blocks.length;

    // Touch
    this.touchStartX = 0;

    // Bindings
    this.onIntersect = this.onIntersect.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    this.animateTicker = this.animateTicker.bind(this);
    this.handleArrowKeydown = this.handleArrowKeydown.bind(this);
  }

  connectedCallback() {
    if (!this.hero) return;

    this.initializeFocusState();

    /* ---------- REVEAL OBSERVER ---------- */

    // Instantly reveal in environments like Shopify theme preview where scrolling may be delayed.
    if (!('IntersectionObserver' in window)) {
      this.hasAnimated = true;
      this.animateBlocks();
    } else {
      this.observer = new IntersectionObserver(this.onIntersect, {
        root: null,
        threshold: 0,
      });

      this.observer.observe(this.hero);
    }

    /* ---------- DESKTOP TICKER ---------- */

    if (window.matchMedia('(pointer: fine)').matches) {
      this.hero.addEventListener('mousemove', this.onMouseMove);
      this.hero.addEventListener('mouseleave', this.onMouseLeave);
    }

    /* ---------- STACK CONTROLS ---------- */

    this.prev?.addEventListener('click', () => this.shiftStack(-1));
    this.next?.addEventListener('click', () => this.shiftStack(1));
    this.prev?.addEventListener('keydown', this.handleArrowKeydown);
    this.next?.addEventListener('keydown', this.handleArrowKeydown);

    /* ---------- TOUCH ---------- */

    this.addTouchEvents();

    /* ---------- INITIAL STACK ---------- */

    requestAnimationFrame(() => {
      this.updateStacks();
      this.showProductBlocks();
      this.updatePagination();
    });

    this.addStackClickEvents();
  }

  disconnectedCallback() {
    this.hero?.removeEventListener('mousemove', this.onMouseMove);
    this.hero?.removeEventListener('mouseleave', this.onMouseLeave);
    this.prev?.removeEventListener('keydown', this.handleArrowKeydown);
    this.next?.removeEventListener('keydown', this.handleArrowKeydown);

    this.observer?.disconnect();

    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  /* ---------- REVEAL ---------- */

  onIntersect(entries) {
    entries.forEach(entry => {
      if (!entry.isIntersecting || this.hasAnimated) return;

      this.hasAnimated = true;
      this.animateBlocks();

      this.observer.disconnect();
    });
  }

  animateBlocks() {
    const blocks = [...this.blocks];
    const text = this.querySelector('.hero-text');
    const arrows = this.querySelector('.hero_banner_arrows');

    blocks.forEach((block, i) => {
      setTimeout(() => {
        block.classList.add('is-visible');
      }, i * 200);
    });

    if (text) {
      setTimeout(() => {
        text.classList.add('is-visible');
        this.enableTextLinkFocus();
      }, blocks.length * 200);
    }

    setTimeout(() => {
      this.enableCenterLinkFocus();
    }, blocks.length * 200);

    if (arrows) {
      setTimeout(() => {
        arrows.classList.add('is-visible');
        this.enableArrowFocus();
      }, blocks.length * 300);
    }
  }

  initializeFocusState() {
    this.sideLinks = this.querySelectorAll('[data-hero-side-link]');
    this.centerLinks = this.querySelectorAll('[data-hero-center-link]');
    this.textLinks = this.querySelectorAll('[data-hero-text-link]');
    this.arrowButtons = this.querySelectorAll('[data-hero-arrow]');
    this.centerLinksEnabled = false;

    this.sideLinks.forEach((link) => {
      link.setAttribute('tabindex', '-1');
    });

    this.centerLinks.forEach((link) => {
      link.setAttribute('tabindex', '-1');
    });

    this.textLinks.forEach((link) => {
      link.setAttribute('tabindex', '-1');
    });

    this.arrowButtons.forEach((button) => {
      button.setAttribute('tabindex', '-1');
    });
  }

  enableTextLinkFocus() {
    this.textLinks?.forEach((link) => {
      if (link.hasAttribute('href')) {
        link.removeAttribute('tabindex');
      }
    });
  }

  enableCenterLinkFocus() {
    this.centerLinksEnabled = true;
    this.syncCenterLinkFocus();
  }

  enableArrowFocus() {
    this.arrowButtons?.forEach((button) => {
      button.removeAttribute('tabindex');
    });
  }

  syncCenterLinkFocus() {
    this.centerLinks?.forEach((link) => {
      const card = link.closest('.hbb');
      const isActiveCard = card?.dataset.pos === '0';

      if (this.centerLinksEnabled && isActiveCard && link.hasAttribute('href')) {
        link.removeAttribute('tabindex');
      } else {
        link.setAttribute('tabindex', '-1');
      }
    });
  }

  /* ---------- TICKER ---------- */

  onMouseMove(e) {
    const rect = this.hero.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const offsetX = (e.clientX - centerX) / (rect.width / 2);

    this.targetX = offsetX * -this.strength;

    if (!this.rafId) this.animateTicker();
  }

  onMouseLeave() {
    this.targetX = 0;

    if (!this.rafId) this.animateTicker();
  }

  animateTicker() {
    this.currentX += (this.targetX - this.currentX) * this.ease;

    if (this.ticker) {
      this.ticker.style.transform = `translateX(${this.currentX}px)`;
    }

    if (Math.abs(this.targetX - this.currentX) < 0.1) {
      this.currentX = this.targetX;
      this.rafId = null;
      return;
    }

    this.rafId = requestAnimationFrame(this.animateTicker);
  }

  /* ---------- STACK ---------- */

  shiftStack(direction) {
    if (this.isAnimating) return;

    const firstBlock = this.blocks[0];
    if (!firstBlock) return;

    const items = firstBlock.querySelectorAll('.hbb[data-real="true"]');
    const total = items.length;

    if (!total) return;

    this.isAnimating = true;

    this.stackIndex =
      (this.stackIndex + direction + total) % total;

    // Update pagination
    this.currentSlideNumber = (this.stackIndex % this.totalSlides) + 1;
    this.updatePagination();

    this.hideProductBlocks();
    this.updateStacks();

    setTimeout(() => {
      this.showProductBlocks();
    }, this.animationDuration);

    setTimeout(() => {
      this.isAnimating = false;
    }, this.animationDuration);
  }

  updatePagination() {
    const currentSlideElement = this.querySelector('.hero_banner_current_slide');
    const progressBar = this.querySelector('.hero_banner_pagination_progress_inner');

    // Animate slide number with fade effect
    if (currentSlideElement) {
      currentSlideElement.style.opacity = '0';
      currentSlideElement.style.transform = 'scale(0.8)';

      setTimeout(() => {
        currentSlideElement.textContent = String(this.currentSlideNumber).padStart(2, '0');
        currentSlideElement.style.opacity = '1';
        currentSlideElement.style.transform = 'scale(1)';
      }, 150);
    }

    // Update progress bar with smooth animation
    if (progressBar) {
      const progress = (this.currentSlideNumber / this.totalSlides) * 100;
      progressBar.style.width = `${progress}%`;
    }
  }

  updateStacks() {
    this.blocks.forEach(block => {
      const items = [...block.querySelectorAll('.hbb[data-real="true"]')];
      const total = items.length;

      if (!total) return;

      items.forEach(item => {
        const index = Number(item.dataset.index);

        let pos = index - this.stackIndex;

        if (pos < -Math.floor(total / 2)) pos += total;
        if (pos > Math.floor(total / 2)) pos -= total;

        item.style.transform = `translateX(${pos * 100}%)`;
        item.style.zIndex = total - Math.abs(pos);

        item.dataset.pos = pos;
      });
    });

    this.syncCenterLinkFocus();
  }

  addStackClickEvents() {
    this.blocks.forEach(block => {
      block.addEventListener('click', () => {
        const index = block.dataset.blockIndex;

        if (index == 4 || index == 5) {
          this.next?.click();
        }

        if (index == 1 || index == 2) {
          this.prev?.click();
        }
      });
    });
  }

  handleArrowKeydown(e) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.prev?.click();
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.next?.click();
    }
  }

  /* ---------- PRODUCT BLOCKS ---------- */

  hideProductBlocks() {
    this.querySelectorAll('.hbb_product_block').forEach(block => {
      block.classList.remove('is-visible');
    });
  }

  showProductBlocks() {
    this.querySelectorAll('.hbb_product_block').forEach(block => {
      block.classList.add('is-visible');
    });
  }

  /* ---------- TOUCH ---------- */

  addTouchEvents() {
    this.hero.addEventListener('touchstart', e => {
      this.touchStartX = e.touches[0].clientX;
    }, { passive: true });

    this.hero.addEventListener('touchend', e => {
      const delta = e.changedTouches[0].clientX - this.touchStartX;

      if (Math.abs(delta) > 50) {
        this.shiftStack(delta > 0 ? -1 : 1);
      }
    });
  }
}

customElements.define('hero-banner', HeroBanner);

// CATEGORY SECTION
class CategorySection extends HTMLElement {
  constructor() {
    super();

    // main slider
    this.track = this.querySelector('.category_track');
    this.slides = [...this.querySelectorAll('.category_slide')];

    // small slider
    this.smallTrack = this.querySelector('.category_small_block_track');
    this.smallSlides = [...this.querySelectorAll('.category_small_block_slide')];
    this.collectionBlocks = [...this.querySelectorAll('.category_section_collection_block')];

    // controls
    this.prev = this.querySelector('.cat-prev');
    this.next = this.querySelector('.cat-next');

    this.index = 0;
    this.total = this.slides.length;
    this.isAnimating = false;
    this.duration = 600;

    this.blockNumbers = [...this.querySelectorAll('.block_start_item')];
    this.syncKeyboardAccess = this.syncKeyboardAccess.bind(this);
    this.handleFocusIn = this.handleFocusIn.bind(this);
  }

  connectedCallback() {
    // ---------- STYLE 1 ----------
    if (this.track && this.total > 0) {
      this.prev?.addEventListener('click', () => this.move(-1));
      this.next?.addEventListener('click', () => this.move(1));

      this.update();
      this.updateSmallBlocks();
      this.setupZoomObserver();
      this.setupSmallBlockObserver();
      this.syncKeyboardAccess();
      this.addEventListener('focusin', this.handleFocusIn);
    }

    // ---------- STYLE 2 ----------
    this.style2Buttons = [...this.querySelectorAll('.category_style2_block_img')];
    this.style2Images = [...this.querySelectorAll('.category_section_style2_img')];

    if (this.style2Buttons.length && this.style2Images.length) {
      this.initStyle2Toggle();
    }
  }

  disconnectedCallback() {
    this.removeEventListener('focusin', this.handleFocusIn);
  }

  formatNumber(num) {
    return String(num + 1).padStart(2, '0');
  }

  move(direction) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    this.index = (this.index + direction + this.total) % this.total;
    this.update();

    setTimeout(() => {
      this.isAnimating = false;
    }, this.duration);
  }

  update() {
    // main slider (track-based)
    this.track.style.transform = `translateX(-${this.index * 100}%)`;

    // small blocks (slide-based)
    this.updateSmallBlocks();

    this.updateActiveStates();
    this.syncKeyboardAccess();
  }


  updateActiveStates() {
    // main slides
    this.slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === this.index);
    });

    // small slides
    this.smallSlides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === this.index);
    });

    // collection blocks 
    this.collectionBlocks.forEach(block => {
      const blockIndex = Number(block.dataset.index);
      block.classList.toggle('is-active', blockIndex === this.index);
    });

    // slide number
    this.blockNumbers.forEach(block => {
      const blockIndex = Number(block.dataset.index);
      block.classList.toggle('is-active', blockIndex === this.index);
    });
  }

  updateSmallBlocks() {
    if (!this.smallSlides.length) return;

    this.smallSlides.forEach(slide => {
      const slideIndex = Number(slide.dataset.index);

      const pos = slideIndex - this.index;

      slide.style.transform = `translateX(${pos * 100}%)`;

      // z-index: active highest, then decreasing
      slide.style.zIndex = this.total - Math.abs(pos);
    });
  }

  setupZoomObserver() {
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const img = entry.target.querySelector('img');
        if (img && !img.classList.contains('zoomed')) {
          img.classList.add('zoomed');
        }

        observer.unobserve(entry.target);
      });
    }, { threshold: 0.3 });

    this.slides.forEach(slide => observer.observe(slide));
  }

  setupSmallBlockObserver() {
    const wrapper = this.querySelector('.category_small_block_wrapper');
    if (!wrapper) return;

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        wrapper.classList.add('is-visible');
        this.syncKeyboardAccess();
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.5 });

    observer.observe(this);
  }

  syncKeyboardAccess() {
    const wrapperVisible = this.querySelector('.category_small_block_wrapper')?.classList.contains('is-visible');

    this.collectionBlocks.forEach((block) => {
      const isActive = Number(block.dataset.index) === this.index;
      this.toggleFocusableElements(block, isActive);
    });

    this.smallSlides.forEach((slide) => {
      const isActive = Number(slide.dataset.index) === this.index;
      this.toggleFocusableElements(slide, wrapperVisible && isActive);
    });

    this.syncArrowFocusability(wrapperVisible);
  }

  toggleFocusableElements(container, enabled) {
    const focusableElements = container.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]'
    );

    focusableElements.forEach((element) => {
      if (enabled) {
        const originalTabindex = element.dataset.originalTabindex;

        if (originalTabindex !== undefined) {
          if (originalTabindex === '') {
            element.removeAttribute('tabindex');
          } else {
            element.setAttribute('tabindex', originalTabindex);
          }
        } else {
          element.removeAttribute('tabindex');
        }
      } else {
        if (element.dataset.originalTabindex === undefined) {
          element.dataset.originalTabindex = element.getAttribute('tabindex') ?? '';
        }

        element.setAttribute('tabindex', '-1');
      }
    });
  }

  syncArrowFocusability(enabled) {
    [this.prev, this.next].forEach((button) => {
      if (!button) return;

      if (enabled) {
        button.removeAttribute('tabindex');
      } else {
        button.setAttribute('tabindex', '-1');
      }
    });
  }

  handleFocusIn(e) {
    const wrapper = this.querySelector('.category_small_block_wrapper');
    if (!wrapper || wrapper.classList.contains('is-visible')) return;

    if (
      e.target.closest('.category_section_collection_block') ||
      e.target.closest('.category_small_block_slide') ||
      e.target.closest('.category_section_arrow')
    ) {
      wrapper.classList.add('is-visible');
      this.syncKeyboardAccess();
    }
  }

  initStyle2Toggle() {
    if (!this.style2Buttons.length || !this.style2Images.length) return;

    this.style2Buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const index = Number(btn.dataset.index);

        // remove active from buttons
        this.style2Buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        // reset all images
        this.style2Images.forEach((img) => {
          img.classList.remove('active');

          // 🔥 force reflow (important for animation reset)
          img.offsetHeight;
        });

        // activate target
        const target = this.style2Images.find(
          (img) => Number(img.dataset.index) === index
        );

        if (target) {
          target.classList.add('active');
        }
      });
    });
  }

}

customElements.define('category-section', CategorySection);


// SWIPER
class SwiperSection extends HTMLElement {
  connectedCallback() {
    this.swiperEl = this.querySelector(".swiper");
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

    /* ---------- read dataset ---------- */
    this.slidesDesktop = Number(this.dataset.slidesDesktop) || 1;
    this.slidesTablet = Number(this.dataset.slidesTablet) || 3;
    this.slidesMobile = Number(this.dataset.slidesMobile) || 1;
    this.slidesCustom = Number(this.dataset.slidesCustom) || 2;

    this.speed = Number(this.dataset.speed) || 600;
    this.loop = this.dataset.loop === "true";
    this.freeMode = this.dataset.freeMode === "true";
    this.effect = this.dataset.effect || "slide";
    this.gap = Number(this.dataset.gap) || 15;
    this.customGap = Number(this.dataset.customGap) || Number(this.dataset.gap) || 15;
    this.mobileGap = Number(this.dataset.mobileGap) || 15;
    this.centerMode = this.dataset.centerMode === "true";

    this.observeParents = this.dataset.observeParents === "true";
    this.autoHeight = this.dataset.autoHeight === "true";
    this.grabCursor = this.dataset.grabCursor === "true";
    this.watchSlidesProgress = this.dataset.progress === "true";
    this.allowTouchMove = this.dataset.allowTouchMove !== "false";

    this.paginationEl = this.querySelector(".swiper-pagination");
    this.paginationType = this.dataset.paginationType || "bullets";

    this.autoplayEnabled =
      this.dataset.autoplay === "true" || this.dataset.autoplay === "1";
    this.delay = Number(this.dataset.delay) || 3000;

    this.thumbsSelector = this.dataset.thumbs;

    /* ---------- thumbs handling ---------- */
    if (this.thumbsSelector) {
      const thumbsEl = document.querySelector(`.${this.thumbsSelector}`);

      if (thumbsEl) {
        const waitForThumbs = () => {
          if (thumbsEl.swiperInstance) {
            this.createSwiper(thumbsEl.swiperInstance);
          } else {
            requestAnimationFrame(waitForThumbs);
          }
        };
        waitForThumbs();
        return;
      }
    }

    /* ---------- no thumbs ---------- */
    this.createSwiper();
  }

  animateActiveSlide(swiper) {
    const activeSlide = swiper.slides[swiper.activeIndex];
    if (!activeSlide) return;

    // content animation
    const content = activeSlide.querySelector(".slideshow_slide_content_inner");

    if (content && this.contains(content)) {
      setTimeout(() => {
        content.classList.add("animate-in");
      }, 100);
    }
  }

  createSwiper(thumbsSwiper = null) {
    if (this.swiper) return;

    this.swiper = new Swiper(this.swiperEl, {
      slidesPerView: this.slidesMobile,
      spaceBetween: this.gap,
      speed: this.speed,
      loop: this.loop,
      freeMode: this.freeMode,
      centeredSlides: this.centerMode,
      grabCursor: this.grabCursor,
      effect: this.effect,
      // touchStartPreventDefault: false,

      observeParents: this.observeParents,
      autoHeight: this.autoHeight,
      grabCursor: this.grabCursor,
      watchSlidesProgress: this.watchSlidesProgress,
      allowTouchMove: this.allowTouchMove,

      breakpoints: {
        0: {
          slidesPerView: this.slidesMobile,
          spaceBetween: this.mobileGap,
          freeMode: false,
        },
        640: { slidesPerView: this.slidesCustom, spaceBetween: this.customGap },
        899: { slidesPerView: this.slidesTablet, spaceBetween: this.customGap },
        1199: { slidesPerView: this.slidesDesktop },
      },

      ...(this.autoplayEnabled && {
        autoplay: {
          delay: this.delay,
          disableOnInteraction: false,
        },
      }),

      ...(this.paginationEl && {
        pagination: {
          el: this.paginationEl,
          clickable: true,
          type: this.paginationType,
          renderBullet: function (index, className) {
            return `
              <span class="${className}">
                <svg
                  class="progress-ring"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="progress-ring__bg"
                    stroke-width="2"
                    fill="transparent"
                    r="10"
                    cx="12"
                    cy="12"
                  />
                  <circle
                    class="progress-ring__progress"
                    stroke-width="2"
                    fill="transparent"
                    r="10"
                    cx="12"
                    cy="12"
                  />
                </svg>
              </span>
            `;
          },
        },
      }),

      on: {
        slideChangeTransitionStart: (swiper) => {
          this.querySelectorAll(".slideshow_slide_content_inner").forEach((el) => {
            el.classList.remove("animate-in");
          });

          this.querySelectorAll(".progress-ring__progress").forEach((circle) => {
            circle.style.animation = "none";
            circle.getBoundingClientRect();
            circle.style.animation = "";
          });
        },
        init: (swiper) => {
          this.animateActiveSlide(swiper);
          window.dispatchEvent(new Event("layout:updated"));
        },
        slideChangeTransitionEnd: (swiper) => {
          this.animateActiveSlide(swiper);
        },
        resize: () => {
          window.dispatchEvent(new Event("layout:updated"));
        },
      },   

      ...(thumbsSwiper && {
        thumbs: {
          swiper: thumbsSwiper,
        },
      }),

      navigation: {
        nextEl: this.querySelector(".swiper-button-next"),
        prevEl: this.querySelector(".swiper-button-prev"),
      }
    });

    /* expose instance for thumbs linking */
    this.swiperEl.swiperInstance = this.swiper;

    this.swiperEl.style.setProperty(
      "--swiper-autoplay-duration",
      `${this.delay}ms`,
    );
  }

  disconnectedCallback() {
    if (!this.swiper) return;
    this.swiper.destroy(true, true);
    this.swiper = null;
  }
}

customElements.define("swiper-section", SwiperSection);


// FEATURED COLLECTION
class FeaturedCollection extends HTMLElement {
  constructor() {
    super();

    this.currentSlideNumber = 1;
    this.totalSlides = 1;
    this.navigableSlides = 1; // Actual number of positions the slider can be at
    this.view = this.dataset.view || 'grid';
    this.swiper = null;
    this.headingWrapper = null;
    this.handleResize = this.handleResize.bind(this);
  }

  connectedCallback() {
    if (this.view !== 'slider') return;

    // Find the heading wrapper (2 levels up to container, then find featured_collection_head)
    const container = this.parentElement?.parentElement;
    if (container) {
      this.headingWrapper = container.querySelector('.featured_collection_head');
    }

    if (!this.headingWrapper) {
      console.warn('FeaturedCollection: Could not find heading wrapper');
      return;
    }

    // Wait for swiper to be ready
    this.waitForSwiper();
  }

  waitForSwiper() {
    const swiperSection = this.querySelector('swiper-section');
    if (!swiperSection) {
      console.warn('FeaturedCollection: Could not find swiper-section');
      return;
    }

    // Check if swiper already exists
    if (swiperSection.swiper) {
      this.swiper = swiperSection.swiper;
      this.initSwiper();
      return;
    }

    // Wait for swiper to be created
    let checkCount = 0;
    const checkInterval = setInterval(() => {
      checkCount++;
      if (swiperSection.swiper) {
        clearInterval(checkInterval);
        this.swiper = swiperSection.swiper;
        this.initSwiper();
      } else if (checkCount > 50) {
        // Timeout after 5 seconds
        clearInterval(checkInterval);
        console.warn('FeaturedCollection: Swiper init timeout');
      }
    }, 100);
  }

  initSwiper() {
    if (!this.swiper) return;

    // Get total slides count (unique products, not duplicates)
    const swiperEl = this.querySelector('.swiper');
    if (!swiperEl) return;

    // Count product cards (exclude swiper duplicates from loop)
    const productCards = swiperEl.querySelectorAll('.product_card_wrapper:not(.swiper-slide-duplicate)');
    this.totalSlides = productCards.length > 0 ? productCards.length : this.swiper.slides.length;

    // Calculate navigable slides: how many positions the slider can be at
    // Formula: totalSlides - slidesPerView + 1
    // This accounts for the fact that at the last position, you're viewing the last N slides
    const slidesPerView = this.swiper.params.slidesPerView || 1;
    this.navigableSlides = Math.max(1, this.totalSlides - Math.ceil(slidesPerView) + 1);

    // Update total slides display (show navigable positions, not total products)
    const totalSlideElement = this.headingWrapper.querySelector('.fc_total_slide');
    if (totalSlideElement) {
      totalSlideElement.textContent = String(this.navigableSlides).padStart(2, '0');
    }

    // Setup event listener
    this.swiper.on('slideChange', () => {
      this.updateSlideNumber();
      this.syncKeyboardAccess();
    });

    this.swiper.on('transitionEnd', () => {
      this.syncKeyboardAccess();
    });

    window.addEventListener('resize', this.handleResize);

    // Update initial state
    this.updateSlideNumber();
    this.syncKeyboardAccess();
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this.handleResize);
  }

  updateSlideNumber() {
    if (!this.swiper || !this.headingWrapper) return;

    // Get real index (accounts for loop)
    let index = this.swiper.realIndex;
    
    // Constrain to valid range for navigable slides
    if (this.navigableSlides > 0) {
      index = index % this.navigableSlides;
    }
    
    this.currentSlideNumber = index + 1;
    this.updateDisplay();
  }

  updateDisplay() {
    const currentSlideElement = this.headingWrapper.querySelector('.fc_current_slide');
    const progressBar = this.headingWrapper.querySelector('.fc_pagination_progress_inner');

    // Update slide number with animation
    if (currentSlideElement) {
      currentSlideElement.style.opacity = '0';
      currentSlideElement.style.transform = 'scale(0.8)';

      setTimeout(() => {
        currentSlideElement.textContent = String(this.currentSlideNumber).padStart(2, '0');
        currentSlideElement.style.opacity = '1';
        currentSlideElement.style.transform = 'scale(1)';
      }, 150);
    }

    // Update progress bar based on navigable slides
    if (progressBar && this.navigableSlides > 0) {
      const progress = (this.currentSlideNumber / this.navigableSlides) * 100;
      progressBar.style.width = `${progress}%`;
    }
  }

  handleResize() {
    this.syncKeyboardAccess();
  }

  syncKeyboardAccess() {
    if (!this.swiper) return;

    const slides = Array.from(this.querySelectorAll('.product_card_wrapper.swiper-slide'));
    const viewport = this.querySelector('.swiper');

    slides.forEach((slide) => {
      const isVisible = this.isSlideKeyboardVisible(slide, viewport);
      this.toggleFocusableElements(slide, isVisible);
    });

    this.syncArrowFocusability();
  }

  isSlideKeyboardVisible(slide, viewport) {
    if (!slide || !viewport) return false;
    if (slide.classList.contains('swiper-slide-duplicate')) return false;

    const slideRect = slide.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    const overlap = Math.min(slideRect.right, viewportRect.right) - Math.max(slideRect.left, viewportRect.left);

    return overlap > Math.min(slideRect.width * 0.6, viewportRect.width);
  }

  toggleFocusableElements(container, enabled) {
    const focusableElements = container.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]'
    );

    focusableElements.forEach((element) => {
      if (enabled) {
        const originalTabindex = element.dataset.originalTabindex;

        if (originalTabindex !== undefined) {
          if (originalTabindex === '') {
            element.removeAttribute('tabindex');
          } else {
            element.setAttribute('tabindex', originalTabindex);
          }
        } else if (element.classList.contains('quick_add_btn') || element.classList.contains('product_form_submit_btn')) {
          element.removeAttribute('tabindex');
        }
      } else {
        if (element.dataset.originalTabindex === undefined) {
          element.dataset.originalTabindex = element.getAttribute('tabindex') ?? '';
        }

        element.setAttribute('tabindex', '-1');
      }
    });
  }

  syncArrowFocusability() {
    const arrows = this.querySelectorAll('.fc_btn');

    arrows.forEach((arrow) => {
      const isDisabled = arrow.classList.contains('swiper-button-disabled') || arrow.disabled;

      if (isDisabled) {
        arrow.setAttribute('tabindex', '-1');
      } else {
        arrow.removeAttribute('tabindex');
      }
    });
  }
}

customElements.define('featured-collection', FeaturedCollection);

// TESTIMONIALS
class Testimonials extends HTMLElement {
  constructor() {
    super();

    this.currentSlideNumber = 1;
    this.totalSlides = 1;
    this.navigableSlides = 1;
    this.swiper = null;
    this.headingWrapper = null;
  }

  connectedCallback() {
    // Find the heading wrapper (parent > parent > testimonials_head)
    const wrapper = this.parentElement;
    if (wrapper) {
      this.headingWrapper = wrapper.querySelector('.testimonials_head');
    }

    if (!this.headingWrapper) {
      console.warn('Testimonials: Could not find heading wrapper');
      return;
    }

    // Check if progress bar is shown
    const progressBar = this.headingWrapper.querySelector('.t_pagination_progress_inner');
    if (!progressBar) {
      return; // Progress bar not enabled
    }

    // Wait for swiper to be ready
    this.waitForSwiper();
  }

  waitForSwiper() {
    const swiperSection = this.querySelector('swiper-section');
    if (!swiperSection) {
      console.warn('Testimonials: Could not find swiper-section');
      return;
    }

    // Check if swiper already exists
    if (swiperSection.swiper) {
      this.swiper = swiperSection.swiper;
      this.initSwiper();
      return;
    }

    // Wait for swiper to be created
    let checkCount = 0;
    const checkInterval = setInterval(() => {
      checkCount++;
      if (swiperSection.swiper) {
        clearInterval(checkInterval);
        this.swiper = swiperSection.swiper;
        this.initSwiper();
      } else if (checkCount > 50) {
        // Timeout after 5 seconds
        clearInterval(checkInterval);
        console.warn('Testimonials: Swiper init timeout');
      }
    }, 100);
  }

  initSwiper() {
    if (!this.swiper) return;

    // Get total slides count
    const swiperEl = this.querySelector('.swiper');
    if (!swiperEl) return;

    // Count testimonial slides (exclude swiper duplicates from loop)
    const testimonialSlides = swiperEl.querySelectorAll('.testimonial_block:not(.swiper-slide-duplicate)');
    this.totalSlides = testimonialSlides.length > 0 ? testimonialSlides.length : this.swiper.slides.length;

    // Calculate navigable slides
    const slidesPerView = this.swiper.params.slidesPerView || 1;
    this.navigableSlides = Math.max(1, this.totalSlides - Math.ceil(slidesPerView) + 1);

    // Update total slides display
    const totalSlideElement = this.headingWrapper.querySelector('.t_total_slide');
    if (totalSlideElement) {
      totalSlideElement.textContent = String(this.navigableSlides).padStart(2, '0');
    }

    // Setup event listener
    this.swiper.on('slideChange', () => {
      this.updateSlideNumber();
    });

    // Update initial state
    this.updateSlideNumber();
  }

  updateSlideNumber() {
    if (!this.swiper || !this.headingWrapper) return;

    let index = this.swiper.realIndex;

    if (this.navigableSlides > 0) {
      index = index % this.navigableSlides;
    }

    this.currentSlideNumber = index + 1;
    this.updateDisplay();
  }

  updateDisplay() {
    const currentSlideElement = this.headingWrapper.querySelector('.t_current_slide');
    const progressBar = this.headingWrapper.querySelector('.t_pagination_progress_inner');

    // Update slide number with animation
    if (currentSlideElement) {
      currentSlideElement.style.opacity = '0';
      currentSlideElement.style.transform = 'scale(0.8)';

      setTimeout(() => {
        currentSlideElement.textContent = String(this.currentSlideNumber).padStart(2, '0');
        currentSlideElement.style.opacity = '1';
        currentSlideElement.style.transform = 'scale(1)';
      }, 150);
    }

    // Update progress bar
    if (progressBar && this.navigableSlides > 0) {
      const progress = (this.currentSlideNumber / this.navigableSlides) * 100;
      progressBar.style.width = `${progress}%`;
    }
  }
}

customElements.define('testimonials-section', Testimonials);

// FEATURED BLOG
class FeaturedBlog extends HTMLElement {
  constructor() {
    super();

    this.currentSlideNumber = 1;
    this.totalSlides = 1;
    this.navigableSlides = 1;
    this.swiper = null;
    this.headingWrapper = null;
  }

  connectedCallback() {
    // Find the heading wrapper (parent > featured_blog_head)
    const wrapper = this.parentElement;
    if (wrapper) {
      this.headingWrapper = wrapper.querySelector('.featured_blog_head');
    }

    if (!this.headingWrapper) {
      console.warn('FeaturedBlog: Could not find heading wrapper');
      return;
    }

    // Check if progress bar is shown
    const progressBar = this.headingWrapper.querySelector('.fb_pagination_progress_inner');
    if (!progressBar) {
      return; // Progress bar not enabled
    }

    // Wait for swiper to be ready
    this.waitForSwiper();
  }

  waitForSwiper() {
    const swiperSection = this.querySelector('swiper-section');
    if (!swiperSection) {
      console.warn('FeaturedBlog: Could not find swiper-section');
      return;
    }

    // Check if swiper already exists
    if (swiperSection.swiper) {
      this.swiper = swiperSection.swiper;
      this.initSwiper();
      return;
    }

    // Wait for swiper to be created
    let checkCount = 0;
    const checkInterval = setInterval(() => {
      checkCount++;
      if (swiperSection.swiper) {
        clearInterval(checkInterval);
        this.swiper = swiperSection.swiper;
        this.initSwiper();
      } else if (checkCount > 50) {
        // Timeout after 5 seconds
        clearInterval(checkInterval);
        console.warn('FeaturedBlog: Swiper init timeout');
      }
    }, 100);
  }

  initSwiper() {
    if (!this.swiper) return;

    // Get total slides count
    const swiperEl = this.querySelector('.swiper');
    if (!swiperEl) return;

    // Count article slides (exclude swiper duplicates from loop)
    const articleSlides = swiperEl.querySelectorAll('.article_card_wrapper:not(.swiper-slide-duplicate)');
    this.totalSlides = articleSlides.length > 0 ? articleSlides.length : this.swiper.slides.length;

    // Calculate navigable slides
    const slidesPerView = this.swiper.params.slidesPerView || 1;
    this.navigableSlides = Math.max(1, this.totalSlides - Math.ceil(slidesPerView) + 1);

    // Update total slides display
    const totalSlideElement = this.headingWrapper.querySelector('.fb_total_slide');
    if (totalSlideElement) {
      totalSlideElement.textContent = String(this.navigableSlides).padStart(2, '0');
    }

    // Setup event listener
    this.swiper.on('slideChange', () => {
      this.updateSlideNumber();
    });

    // Update initial state
    this.updateSlideNumber();
  }

  updateSlideNumber() {
    if (!this.swiper || !this.headingWrapper) return;

    let index = this.swiper.realIndex;

    if (this.navigableSlides > 0) {
      index = index % this.navigableSlides;
    }

    this.currentSlideNumber = index + 1;
    this.updateDisplay();
  }

  updateDisplay() {
    const currentSlideElement = this.headingWrapper.querySelector('.fb_current_slide');
    const progressBar = this.headingWrapper.querySelector('.fb_pagination_progress_inner');

    // Update slide number with animation
    if (currentSlideElement) {
      currentSlideElement.style.opacity = '0';
      currentSlideElement.style.transform = 'scale(0.8)';

      setTimeout(() => {
        currentSlideElement.textContent = String(this.currentSlideNumber).padStart(2, '0');
        currentSlideElement.style.opacity = '1';
        currentSlideElement.style.transform = 'scale(1)';
      }, 150);
    }

    // Update progress bar
    if (progressBar && this.navigableSlides > 0) {
      const progress = (this.currentSlideNumber / this.navigableSlides) * 100;
      progressBar.style.width = `${progress}%`;
    }
  }
}

customElements.define('featured-blog', FeaturedBlog);

// FAQ ACCORDION
class FAQSection extends HTMLElement {
  constructor() {
    super();
    this.currentOpenItem = null;
    this.resizeObserver = new ResizeObserver(() => this.updateOpenItemHeight());
    this.resizeHandler = () => this.updateOpenItemHeight();
  }

  connectedCallback() {
    const faqItems = this.querySelectorAll('.faq_item');
    const questions = this.querySelectorAll('.faq_question');

    questions.forEach((question, index) => {
      question.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleItem(question, faqItems[index]);
      });
    });

    // Add window resize listener for viewport changes
    window.addEventListener('resize', this.resizeHandler);
  }

  disconnectedCallback() {
    // Clean up event listeners
    window.removeEventListener('resize', this.resizeHandler);
    this.resizeObserver.disconnect();
  }

  updateOpenItemHeight() {
    if (this.currentOpenItem) {
      const answer = this.currentOpenItem.querySelector('.faq_answer');
      const innerContent = answer.querySelector('.faq_answer_inner');
      if (innerContent) {
        answer.style.height = innerContent.offsetHeight + 'px';
      }
    }
  }

  toggleItem(question, item) {
    const answer = item.querySelector('.faq_answer');
    const isCurrentlyOpen = question.classList.contains('active');

    // Close all items
    if (this.currentOpenItem && this.currentOpenItem !== item) {
      const currentQuestion = this.currentOpenItem.querySelector('.faq_question');
      const currentAnswer = this.currentOpenItem.querySelector('.faq_answer');
      
      currentQuestion.classList.remove('active');
      currentAnswer.style.height = '0px';
    }

    // Toggle current item
    if (!isCurrentlyOpen) {
      question.classList.add('active');
      const contentHeight = answer.querySelector('.faq_answer_inner').offsetHeight;
      answer.style.height = contentHeight + 'px';
      this.currentOpenItem = item;

      // Watch content for size changes
      const innerContent = answer.querySelector('.faq_answer_inner');
      if (innerContent) {
        this.resizeObserver.observe(innerContent);
      }
    } else {
      question.classList.remove('active');
      answer.style.height = '0px';
      this.currentOpenItem = null;
      this.resizeObserver.disconnect();
    }
  }
}

customElements.define('faq-section', FAQSection);

// VIDEO BACKGROUND
class VideoBackground extends HTMLElement {
  constructor() {
    super();

    this.wrapper = this.querySelector('.video_background_inner');
    this.sticky = this.querySelector('.video_bg_vdo_wrapper');
    this.ticker = this.querySelector('.video_bg_ticker_list');

    this.start = 0;
    this.animEnd = 0;
    this.holdEnd = 0;

    /* animation tuning */
    this.textRevealAt = 0.9;
    this.holdScroll = 1;

    /* ticker */
    this.targetX = 0;
    this.currentX = 0;
    this.rafId = null;
    this.strength = 50;
    this.ease = 0.08;
    this.ctaLinks = [];

    this.onScroll = this.onScroll.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    this.animateTicker = this.animateTicker.bind(this);
    this.handleFocusIn = this.handleFocusIn.bind(this);
  }

  connectedCallback() {
    if (!this.wrapper || !this.sticky) return;

    this.initializeFocusState();
    this.calculate();
    this.onScroll();
    this.addEventListener('focusin', this.handleFocusIn);

    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onResize);
    window.addEventListener('layout:updated', this.onResize);

    this.wrapper.addEventListener('mousemove', this.onMouseMove);
    this.wrapper.addEventListener('mouseleave', this.onMouseLeave);
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('layout:updated', this.onResize);

    this.wrapper.removeEventListener('mousemove', this.onMouseMove);
    this.wrapper.removeEventListener('mouseleave', this.onMouseLeave);
    this.removeEventListener('focusin', this.handleFocusIn);

    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  onResize() {
    requestAnimationFrame(() => {
      this.calculate();
      this.onScroll();
    });
  }

  calculate() {
    const rect = this.wrapper.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    this.start = rect.top + scrollTop;

    /* animation takes first viewport */
    this.animEnd = this.start + window.innerHeight;

    /* text hold phase */
    this.holdEnd = this.animEnd + window.innerHeight * this.holdScroll;
  }

  onScroll() {
    // Disable sticky scroll effect on mobile screens
    if (window.innerWidth <= 640) {
      this.sticky.style.transform = '';
      this.classList.add('is-complete');
      this.syncCtaFocus();
      return;
    }

    const scrollY = window.scrollY;

    /* ---------------- Animation phase ---------------- */
    const animProgress = Math.min(
      Math.max((scrollY - this.start) / (this.animEnd - this.start), 0),
      1
    );

    const rotate = -6 + 6 * animProgress;
    const translateY = 200 - 200 * animProgress;
    const scale = 0.8 + 0.2 * animProgress;

    this.sticky.style.transform =
      `translateY(${translateY}px) rotate(${rotate}deg) scale(${scale})`;

    /* text appears BEFORE animation finishes */
    if (animProgress >= this.textRevealAt) {
      this.classList.add('is-complete');
    } else {
      this.classList.remove('is-complete');
    }

    this.syncCtaFocus();

    /* ---------------- Hold phase ---------------- */
    if (scrollY >= this.animEnd && scrollY <= this.holdEnd) {
      this.sticky.style.transform =
        `translateY(0) rotate(0deg) scale(1)`;
    }
  }

  /* ---------------- TICKER ---------------- */

  onMouseMove(e) {
    if (!this.ticker) return;

    const rect = this.wrapper.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const offsetX = (e.clientX - centerX) / (rect.width / 2);

    this.targetX = offsetX * -this.strength;

    if (!this.rafId) {
      this.rafId = requestAnimationFrame(this.animateTicker);
    }
  }

  onMouseLeave() {
    this.targetX = 0;

    if (!this.rafId) {
      this.rafId = requestAnimationFrame(this.animateTicker);
    }
  }

  animateTicker() {
    this.currentX += (this.targetX - this.currentX) * this.ease;

    this.ticker.style.transform =
      `translateX(${this.currentX}px)`;

    if (Math.abs(this.targetX - this.currentX) < 0.1) {
      this.currentX = this.targetX;
      this.rafId = null;
      return;
    }

    this.rafId = requestAnimationFrame(this.animateTicker);
  }

  initializeFocusState() {
    this.ctaLinks = [...this.querySelectorAll('[data-video-bg-cta]')];
    this.ctaLinks.forEach((link) => {
      if (link.hasAttribute('href')) {
        link.removeAttribute('tabindex');
      } else {
        link.setAttribute('tabindex', '-1');
      }
    });
  }

  syncCtaFocus() {
    this.ctaLinks.forEach((link) => {
      if (link.hasAttribute('href')) {
        link.removeAttribute('tabindex');
      } else {
        link.setAttribute('tabindex', '-1');
      }
    });
  }

  handleFocusIn(e) {
    if (!e.target.closest('[data-video-bg-cta]')) return;

    if (!this.classList.contains('is-complete')) {
      this.classList.add('is-complete');
      this.syncCtaFocus();
    }
  }
}

customElements.define('video-background', VideoBackground);


// HORIZONTAL SCROLLER
class HorizontalScroller extends HTMLElement {
  constructor() {
    super();
    this.el = this;
    this.speed = parseFloat(this.el.style.getPropertyValue('--speed')) || 80;
    this.direction = this.el.dataset.direction;

    this.init();
  }

  init() {
    const tracks = this.el.querySelectorAll('[data-track]');
    const isRightSelected = this.direction === 'right';

    tracks.forEach(track => {
      const inner = track.querySelector('.ticker-inner');

      const originals = Array.from(inner.children);
      inner.innerHTML = '';

      const REPEAT_COUNT = 20;

      for (let i = 0; i < REPEAT_COUNT; i++) {
        originals.forEach(item => {
          inner.appendChild(item.cloneNode(true));
        });
      }

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const totalWidth = inner.scrollWidth;
          const distance = totalWidth / 2;
          const duration = distance / this.speed;

          inner.style.setProperty('--scroll-distance', `${distance}px`);
          inner.style.animationDuration = `${duration}s`;

          const isReverseTrack = track.classList.contains('reverse');
          const shouldReverse =
            isReverseTrack ? !isRightSelected : isRightSelected;

          inner.style.animationDirection = shouldReverse
            ? 'reverse'
            : 'normal';

          /* dynamic height calculation */
          this.updateTiltHeight();
        });
      });
    });

    // Recalculate on resize
    window.addEventListener('resize', () => {
      this.updateTiltHeight();
    });
  }

  updateTiltHeight() {
    if (!this.el.classList.contains('is-tilted')) return;

    const rows = this.el.querySelectorAll('.ticker-row');
    let maxHeight = 0;

    rows.forEach(row => {
      const rect = row.getBoundingClientRect();
      maxHeight = Math.max(maxHeight, rect.height);
    });

    // Extra padding for rotation overlap
    const tiltPadding = maxHeight * 0.35;

    this.el.style.setProperty(
      '--tilt-height',
      `${maxHeight + tiltPadding}px`
    );
  }
}

customElements.define('horizontal-scroller', HorizontalScroller);

window.addEventListener("scroll", () => {
  document.dispatchEvent(new Event("theme:scroll"));
});

window.addEventListener("resize", () => {
  document.dispatchEvent(new Event("theme:resize"));
});

window.addEventListener("DOMContentLoaded", () => {
  document.dispatchEvent(new Event("theme:load"));
});


// BEFORE AFTER
class BeforeAfter extends HTMLElement {
  constructor() {
    super();

    this.container = this;
    this.beforeImg = this.querySelector('.before_after_first_img');
    this.afterImg = this.querySelector('.before_after_second_img');
    this.smallAfterImg = this.querySelector('.ba_small_box_after_img');
    this.smallBox = this.querySelector('.before_after_small_box_wrapper');
    this.slider = this.querySelector('.before_after_slider');
    this.thumb = this.slider.querySelector('.before_after_thumb');

    this.dragging = false;

    // Limits
    this.MIN = 0.01;
    this.MAX = 0.98;
    this.pos = this.MIN;
  }

  connectedCallback() {
    this.setupAccessibility();

    // Start from LEFT (no animation)
    this.setPosition(this.MIN, false);

    // Prepare small box initial state
    if (this.smallBox) {
      this.smallBox.style.opacity = '0';
      this.smallBox.style.transform = 'translate(-50%, calc(-50% + 2rem))';
      this.smallBox.style.transition =
        'opacity 0.6s ease, transform 0.6s ease';
    }

    this.setupSliderObserver();
    this.setupSmallBoxObserver();
    this.bindEvents();
  }

  /* ---------------------------
     Accessibility
  --------------------------- */
  setupAccessibility() {
    this.thumb.setAttribute('role', 'slider');
    this.thumb.setAttribute('tabindex', '0');
    this.thumb.setAttribute('aria-valuemin', '1');
    this.thumb.setAttribute('aria-valuemax', '98');
    this.thumb.setAttribute('aria-valuenow', '1');
    this.thumb.setAttribute(
      'aria-label',
      'Before and after image comparison slider'
    );
  }

  updateAria() {
    this.thumb.setAttribute(
      'aria-valuenow',
      Math.round(this.pos * 100)
    );
  }

  /* ---------------------------
     Slider animation @ 50%
  --------------------------- */
  setupSliderObserver() {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          this.slider.classList.add('transition');
          this.afterImg.classList.add('transition', 'r_transition');

          if (this.smallAfterImg) {
            this.smallAfterImg.classList.add('r_transition');
          }

          requestAnimationFrame(() => {
            this.setPosition(0.5);
          });

          setTimeout(() => {
            this.slider.classList.remove('transition');
            this.afterImg.classList.remove('r_transition');

            if (this.smallAfterImg) {
              this.smallAfterImg.classList.remove('r_transition');
            }
          }, 600);

          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(this);
  }

  /* ---------------------------
     Small box reveal @ 80%
  --------------------------- */
  setupSmallBoxObserver() {
    if (!this.smallBox) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          this.smallBox.style.opacity = '1';
          this.smallBox.style.transform = 'translate(-50%, -50%)';

          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.8 }
    );

    observer.observe(this);
  }

  /* ---------------------------
     Events
  --------------------------- */
  bindEvents() {
    this.slider.addEventListener('mousedown', this.startDrag);
    window.addEventListener('mouseup', this.stopDrag);
    window.addEventListener('mousemove', this.onDrag);

    this.slider.addEventListener('touchstart', this.startDrag, { passive: false });
    window.addEventListener('touchend', this.stopDrag);
    window.addEventListener('touchmove', this.onDrag, { passive: false });

    this.thumb.addEventListener('keydown', this.onKeyDown);
  }

  startDrag = e => {
    e.preventDefault();
    this.dragging = true;
    this.slider.style.cursor = 'grabbing';
  };

  stopDrag = () => {
    this.dragging = false;
    this.slider.style.cursor = 'grab';
  };

  onDrag = e => {
    if (!this.dragging) return;

    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    if (!clientX) return;

    const rect = this.container.getBoundingClientRect();
    const pos = (clientX - rect.left) / rect.width;

    this.setPosition(pos);
  };

  /* ---------------------------
     Keyboard support
  --------------------------- */
  onKeyDown = e => {
    const step = 0.02;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        this.setPosition(this.pos - step);
        break;

      case 'ArrowRight':
        e.preventDefault();
        this.setPosition(this.pos + step);
        break;

      case 'Home':
        e.preventDefault();
        this.setPosition(this.MIN);
        break;

      case 'End':
        e.preventDefault();
        this.setPosition(this.MAX);
        break;
    }
  };

  /* ---------------------------
     Core logic
  --------------------------- */
  setPosition(pos, clamp = true) {
    if (clamp) {
      pos = Math.max(this.MIN, Math.min(this.MAX, pos));
    }

    this.pos = pos;
    const percent = pos * 100;

    this.slider.style.left = `${percent}%`;
    this.afterImg.style.clipPath = `inset(0 0 0 ${percent}%)`;

    if (this.smallAfterImg) {
      this.smallAfterImg.style.clipPath = `inset(0 0 0 ${percent}%)`;
    }

    this.updateAria();
  }
}

customElements.define('before-after', BeforeAfter);


// NEWSLETTER SECTION
class NewsletterSection extends HTMLElement {
  constructor() {
    super();
    this.box = this.querySelector('.newsletter_small_box');
    this.overlayImg = this.querySelector('.newsletter_overlay_img');
  }

  connectedCallback() {
    if (!this.box) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          this.box.classList.add('is-visible');

          // Wait for box animation to finish, then show overlay
          if (this.overlayImg) {
            const onTransitionEnd = e => {
              // Only react to opacity or transform finishing
              if (e.target !== this.box) return;

              this.overlayImg.classList.add('is-visible');
              this.box.removeEventListener('transitionend', onTransitionEnd);
            };

            this.box.addEventListener('transitionend', onTransitionEnd);
          }

          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );

    observer.observe(this);
  }
}

customElements.define('newsletter-section', NewsletterSection);


// FORM SUBMISSION
class SubmissionForm extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.form = this.querySelector('form');
    if (!this.form) return;

    this.button = this.form.querySelector('button[type="submit"]');
    this.email = this.form.querySelector('input[type="email"]');
    this.errorWrapper = this.form.querySelector('.manual_form_error_msg');

    if (!this.button || !this.email) return;

    this.button.addEventListener('click', (e) => {
      e.preventDefault();

      if (this.isValidEmail(this.email.value)) {
        this.errorWrapper?.classList.add('hidden');
        this.form.submit();
      } else {
        this.errorWrapper?.classList.remove('hidden');
      }
    });
  }

  isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
}

customElements.define('submission-form', SubmissionForm);


// NEWSLETTER SCROLLER
class NewsletterScroller extends HTMLElement {
  connectedCallback() {
    const track = this.querySelector(".newsletter_img_scroller_inner");

    const speed = Number(this.dataset.speed) || 40;
    const direction = this.dataset.direction || "left";

    track.style.animationDuration = `${speed}s`;
    track.style.animationDirection =
      direction === "right" ? "reverse" : "normal";
  }
}

customElements.define("newsletter-scroller", NewsletterScroller);


// OFFERS CARD
class OffersCard extends HTMLElement {
  connectedCallback() {
    const cards = this.querySelectorAll('.offers_card_wrapper');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      {
        threshold: 0.2
      }
    );

    cards.forEach((card) => observer.observe(card));
  }
}

customElements.define('offers-card', OffersCard);


// VERTICAL IMAGE SCROLLER
class VerticalImageScroller extends HTMLElement {
  connectedCallback() {
    this.section = this.closest('.image_text_scroller_wrapper');
    this.textWrapper = this.querySelector('.image_text_scroller_text_wrapper');
    this.text = this.querySelector('.scroller-text');
    this.images = [...this.querySelectorAll('.image_text_scroller_img_block')];

    this.ticking = false;

    this.onScroll = this.onScroll.bind(this);
    this.onResize = this.onResize.bind(this);

    this.splitText();

    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onResize);

    this.update();
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);
  }

  onScroll() {
    if (this.ticking) return;

    this.ticking = true;
    requestAnimationFrame(() => {
      this.update();
      this.ticking = false;
    });
  }

  onResize() {
    this.update();
  }

  update() {
    this.animateText();
    this.checkOverlap();
  }

  splitText() {
    if (!this.text) return;

    const chars = this.text.textContent.split('');
    this.text.innerHTML = chars
      .map((char) => {
        if (char === ' ') {
          return `<span class="h1 custom_size">&nbsp;</span>`;
        }
        return `<span class="h1 custom_size">${char}</span>`;
      })
      .join('');

    this.charSpans = [...this.text.querySelectorAll('span')];
  }

  checkOverlap() {
    if (!this.charSpans?.length || !this.images.length) return;

    this.charSpans.forEach((span) => {
      const rect = span.getBoundingClientRect();
      let overImage = false;

      this.images.forEach((img) => {
        const imgRect = img.getBoundingClientRect();

        const overlap =
          rect.bottom > imgRect.top &&
          rect.top < imgRect.bottom &&
          rect.right > imgRect.left &&
          rect.left < imgRect.right;

        if (overlap) overImage = true;
      });

      span.classList.toggle('over-image', overImage);
    });
  }

  animateText() {
    if (!this.textWrapper) return;

    const rect = this.textWrapper.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    const totalDistance = (windowHeight + rect.height) * 1.5;

    let progress = (windowHeight - rect.top) / totalDistance;
    progress = Math.max(0, Math.min(progress, 1));

    const eased = 1 - Math.pow(1 - progress, 3);

    const translateX = -(eased * 100);

    this.textWrapper.style.transform = `translateX(${translateX}%)`;
  }
}

customElements.define('vertical-image-scroller', VerticalImageScroller);


// IMAGE HOTSPOTS
class ImageHotspots extends HTMLElement {
  static gapPx = 8;
  static edgeMarginPx = 8;

  static rectsIntersect(a, b) {
    return !(
      a.right <= b.left ||
      a.left >= b.right ||
      a.bottom <= b.top ||
      a.top >= b.bottom
    );
  }

  constructor() {
    super();
    this.hotspots = this.querySelectorAll('.image_hotspot_block');
    this.cards = this.querySelectorAll('.image_hotspot_card');
    this._boundAdjust = () => {
      requestAnimationFrame(() => this.adjustActiveCardOverlap());
    };
    this._boundResize = () => {
      if (this._resizeTimer) clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => this.adjustActiveCardOverlap(), 80);
    };
  }

  connectedCallback() {
    if (this.hotspots.length) {
      this.hotspots.forEach((hotspot) => {
        const index = hotspot.dataset.index;
        hotspot.addEventListener('click', this.handleClick.bind(this, index));
      });
    }

    // Add event listeners for product title buttons
    const productTitles = this.querySelectorAll('.ih_product_title');
    if (productTitles.length) {
      productTitles.forEach((title) => {
        const index = title.dataset.index;
        title.addEventListener('click', this.handleClick.bind(this, index));
      });
    }

    this.setupSmallBlockObserver();
    this.setupOverlapObservers();
    window.addEventListener('resize', this._boundResize);
    this._boundAdjust();
  }

  disconnectedCallback() {
    window.removeEventListener('resize', this._boundResize);
    if (this._resizeTimer) clearTimeout(this._resizeTimer);
    this._resizeObserver?.disconnect();
    this._mutationObserver?.disconnect();
  }

  resetDesktopCardNudges() {
    this.querySelectorAll('.image_hotspots_cards_layer .image_hotspot_card').forEach((card) => {
      card.style.setProperty('--ih-card-nudge-x', '0px');
      card.style.setProperty('--ih-card-nudge-y', '0px');
    });
  }

  adjustActiveCardOverlap() {
    if (window.matchMedia('(max-width: 1299px)').matches) {
      this.resetDesktopCardNudges();
      return;
    }

    const smallBlock = this.querySelector('.image_hotspots_small_block_wrapper');
    const layer = this.querySelector('.image_hotspots_cards_layer');
    const activeCard = this.querySelector('.image_hotspots_cards_layer .image_hotspot_card.active');

    if (!smallBlock || !layer || !activeCard) {
      this.resetDesktopCardNudges();
      return;
    }

    this.querySelectorAll('.image_hotspots_cards_layer .image_hotspot_card').forEach((card) => {
      if (card !== activeCard) {
        card.style.setProperty('--ih-card-nudge-x', '0px');
        card.style.setProperty('--ih-card-nudge-y', '0px');
      }
    });

    const gap = ImageHotspots.gapPx;
    const margin = ImageHotspots.edgeMarginPx;

    const resetCard = () => {
      activeCard.style.setProperty('--ih-card-nudge-x', '0px');
      activeCard.style.setProperty('--ih-card-nudge-y', '0px');
      activeCard.offsetHeight;
    };

    const applySide = (side) => {
      resetCard();
      const blockRect = smallBlock.getBoundingClientRect();
      const layerRect = layer.getBoundingClientRect();
      let cardRect = activeCard.getBoundingClientRect();
      let nx =
        side === 'right'
          ? blockRect.right + gap - cardRect.left
          : blockRect.left - gap - cardRect.right;
      activeCard.style.setProperty('--ih-card-nudge-x', `${nx}px`);
      activeCard.style.setProperty('--ih-card-nudge-y', '0px');
      cardRect = activeCard.getBoundingClientRect();
      if (cardRect.left < layerRect.left + margin) {
        nx += layerRect.left + margin - cardRect.left;
      }
      if (cardRect.right > layerRect.right - margin) {
        nx -= cardRect.right - (layerRect.right - margin);
      }
      activeCard.style.setProperty('--ih-card-nudge-x', `${nx}px`);
      activeCard.style.setProperty('--ih-card-nudge-y', '0px');
      return activeCard.getBoundingClientRect();
    };

    resetCard();
    const blockRect = smallBlock.getBoundingClientRect();
    const layerRect = layer.getBoundingClientRect();
    let cardRect = activeCard.getBoundingClientRect();

    if (!ImageHotspots.rectsIntersect(cardRect, blockRect)) {
      return;
    }

    const spaceRight = layerRect.right - margin - (blockRect.right + gap);
    const spaceLeft = blockRect.left - gap - margin - layerRect.left;
    const w = cardRect.width;
    const fitsRight = w <= spaceRight;
    const fitsLeft = w <= spaceLeft;

    let primarySide;
    if (fitsRight && fitsLeft) {
      primarySide = spaceRight >= spaceLeft ? 'right' : 'left';
    } else if (fitsRight) {
      primarySide = 'right';
    } else if (fitsLeft) {
      primarySide = 'left';
    } else {
      primarySide = spaceRight >= spaceLeft ? 'right' : 'left';
    }

    const altSide = primarySide === 'right' ? 'left' : 'right';

    cardRect = applySide(primarySide);
    if (!ImageHotspots.rectsIntersect(cardRect, blockRect)) {
      return;
    }

    applySide(altSide);
  }

  setupOverlapObservers() {
    const smallBlock = this.querySelector('.image_hotspots_small_block_wrapper');
    const layer = this.querySelector('.image_hotspots_cards_layer');
    if (!smallBlock || !layer || typeof ResizeObserver === 'undefined') return;

    this._resizeObserver = new ResizeObserver(this._boundAdjust);
    this._resizeObserver.observe(smallBlock);
    this._resizeObserver.observe(layer);
    const inner = this.querySelector('.image_hotspots_inner');
    if (inner) this._resizeObserver.observe(inner);

    this._mutationObserver = new MutationObserver(this._boundAdjust);
    this._mutationObserver.observe(smallBlock, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  handleClick(index) {
    this.hotspots.forEach((hotspot) => {
      const line = hotspot.dataset.index;
      if (line == index) {
        hotspot.classList.add('active');
      } else {
        hotspot.classList.remove('active');
      }
    });
    if (this.cards.length) {
      this.cards.forEach((card) => {
        const i = card.dataset.index;
        if (i == index) {
          card.classList.add('active');
          card.removeAttribute('inert');
        } else {
          card.classList.remove('active');
          card.setAttribute('inert', '');
        }
      });
    }

    // Manage active state for product title buttons
    const productTitles = this.querySelectorAll('.ih_product_title');
    productTitles.forEach((title) => {
      if (title.dataset.index == index) {
        title.classList.add('active');
      } else {
        title.classList.remove('active');
      }
    });

    this._boundAdjust();
  }

  setupSmallBlockObserver() {
    const wrapper = this.querySelector('.image_hotspots_small_block_wrapper');
    if (!wrapper) return;

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        wrapper.classList.add('is-visible');
        obs.unobserve(entry.target);
        requestAnimationFrame(() => this.adjustActiveCardOverlap());
      });
    }, { threshold: 0.9 });

    observer.observe(this);
  }
}

customElements.define('image-hotspots', ImageHotspots);


// READ MORE / READ LESS
class ReadMore extends HTMLElement {
  constructor() {
    super();
    this.btn = this.querySelector('button');
  }

  connectedCallback() {
    if (!this.btn) return;
    this.rm = this.btn.querySelector('.read_more_btn');
    this.rl = this.btn.querySelector('.read_less_btn');
    this.btn.addEventListener('click', this.handleClick.bind(this));
    this.wrapper = this.previousElementSibling;
  }

  handleClick() {
    if (this.rm.classList.contains('active')) {
      this.rm.classList.remove('active');
      this.rl.classList.add('active');
      if (!this.wrapper) return;
      this.wrapper.classList.add('full');
    } else {
      this.rm.classList.add('active');
      this.rl.classList.remove('active');
      this.wrapper.classList.remove('full');
    }
  }
}

customElements.define('read-more', ReadMore);


// DISCOUNT CODE
class DiscountCode extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.addEventListener('click', () => this.copyCode());
  }

  copyCode() {
    const textEl = this.querySelector('.dc');
    if (!textEl) return;

    const text = textEl.textContent.trim();

    navigator.clipboard.writeText(text).then(() => {
      this.classList.add('copied');

      // optional: remove after 2s
      setTimeout(() => {
        this.classList.remove('copied');
      }, 2000);
    }).catch(err => {
      console.error('Copy failed', err);
    });
  }
}

customElements.define('discount-code', DiscountCode);


// LOCALIZATION
class LocalizationWrapper extends HTMLElement {
  constructor() {
    super();

    this.currencyForm = this.querySelector("#currency_selector_form");
    this.languageForm = this.querySelector("#language_selector_form");

    this.currencyDropdown = this.querySelector('.currency_dropdown');
    this.languageDropdown = this.querySelector('.language_dropdown');

    this.activeButton = null;
    this.activeDropdown = null;

    this.handleClick = this.handleClick.bind(this);
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
  }

  connectedCallback() {
    this.addEventListener("click", this.handleClick);
    document.addEventListener("click", this.handleOutsideClick);
    document.addEventListener("keydown", this.handleKeydown);
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.handleClick);
    document.removeEventListener("click", this.handleOutsideClick);
    document.removeEventListener("keydown", this.handleKeydown);
  }

  handleClick(e) {
    const currencyBtn = e.target.closest('.currency_selector_btn');
    const languageBtn = e.target.closest('.language_selector_btn');

    // Toggle dropdowns
    if (currencyBtn) {
      this.toggleDropdown(this.currencyDropdown, currencyBtn);
      return;
    }

    if (languageBtn) {
      this.toggleDropdown(this.languageDropdown, languageBtn);
      return;
    }

    // Handle selection
    const option = e.target.closest("button[data-value]");
    if (!option) return;

    if (option.closest(".currency_list")) {
      this.submitForm(this.currencyForm, "country_code", option.dataset.value);
    }

    if (option.closest(".language_list")) {
      this.submitForm(this.languageForm, "language_code", option.dataset.value);
    }

  }

  toggleDropdown(openEl, triggerBtn) {
    if (!openEl) return;

    const isOpen = openEl.classList.contains('active');

    this.closeAll();

    if (!isOpen) {
      openEl.classList.add('active');
      openEl.removeAttribute('inert');
      openEl.setAttribute('aria-hidden', 'false');
      this.activeDropdown = openEl;
      this.activeButton = triggerBtn;

      // Focus first button in dropdown
      setTimeout(() => {
        const firstBtn = openEl.querySelector("button[data-value]");
        if (firstBtn) firstBtn.focus();
      }, 0);
    }
  }

  submitForm(form, inputName, value) {
    if (!form) return;

    const input = form.querySelector(`input[name="${inputName}"]`);
    if (!input) return;

    input.value = value;
    form.submit();
  }

  handleOutsideClick(e) {
    if (!this.contains(e.target)) {
      this.closeAll();
    }
  }

  handleKeydown(e) {
    const isDropdownOpen = this.activeDropdown && this.activeDropdown.classList.contains('active');

    if (e.key === "Escape" && isDropdownOpen) {
      e.preventDefault();
      const btnToFocus = this.activeButton;
      this.closeAll();

      if (btnToFocus) {
        btnToFocus.focus();
      }
      return;
    }

    if (e.key === "Tab" && isDropdownOpen) {
      const focusableElements = this.activeDropdown.querySelectorAll("button[data-value]");
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (e.shiftKey) {
        // Shift + Tab on first element, focus last
        if (activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab on last element, focus first
        if (activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  }

  closeAll() {
    [this.currencyDropdown, this.languageDropdown].forEach(el => {
      if (!el) return;
      el.classList.remove('active');
      el.setAttribute('inert', '');
      el.setAttribute('aria-hidden', 'true');
    });
    this.activeButton = null;
    this.activeDropdown = null;
  }
}

customElements.define("localization-wrapper", LocalizationWrapper);


// DRAWERS
const drawerOpenBtns = document.querySelectorAll(".drawer_open_btn");
const drawerCloseBtns = document.querySelectorAll(".drawer_close_btn");
const drawers = document.querySelectorAll(".drawer_wrapper");
let scrollPosition = 0;

let lastFocusedButton = null;

drawers.forEach((drawer) => {
  const focusableElements = drawer.querySelectorAll(
    "button, a, select, textarea, input:not([type='hidden'])",
  );
  focusableElements.forEach((el) => {
    el.setAttribute("tabindex", "-1");
  });
});

function closeAllDrawers() {
  drawers.forEach((drawer) => {
    drawer.classList.remove("active");
    drawer.setAttribute("aria-hidden", "true");
    drawer.setAttribute("inert", "");
  });
}

function trapFocus(event, drawer) {
  const focusableElements = drawer.querySelectorAll(
    "button, input:not([type='hidden']), a, select, textarea",
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.key === "Tab") {
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
}

function openDrawer(drawer, button, section) {
  closeAllDrawers();
  if (drawer) {
    if (!lastFocusedButton && button) {
      lastFocusedButton = button;
    }

    drawer.classList.add("active");
    drawer.removeAttribute("inert");
    drawer.setAttribute("aria-hidden", "false");

    const focusableElements = drawer.querySelectorAll(
      "button, input:not([type='hidden']), a, select, textarea",
    );
    focusableElements.forEach((el) => {
      el.setAttribute("tabindex", "0");
    });

    if (focusableElements.length) {
      focusableElements[0].focus();
    }

    drawer.addEventListener("keydown", (event) => trapFocus(event, drawer));
  }
}

function closeDrawer(drawer, section) {
  if (drawer) {
    drawer.classList.remove("active");
    drawer.setAttribute("inert", "");
    drawer.setAttribute("aria-hidden", "true");

    const focusableElements = drawer.querySelectorAll("input, button, a");
    focusableElements.forEach((el) => {
      el.setAttribute("tabindex", "-1");
    });

    const anyDrawerOpen = document.querySelector(".drawer_wrapper.active");

    if (!anyDrawerOpen && lastFocusedButton) {
      lastFocusedButton.focus();
      lastFocusedButton = null;
    }
  }
}

function AddScrollLock() {
  document.body.setAttribute("scroll-lock", "");
  document.body.classList.add("overflow-hidden");
  if (typeof lenis !== "undefined" && lenis?.stop) {
    lenis.stop();
  }
}

function RemoveScrollLock() {
  document.body.removeAttribute("scroll-lock");
  document.body.classList.remove("overflow-hidden");
  if (typeof lenis !== "undefined" && lenis?.start) {
    lenis.start();
  }
}

function initDrawerOpenButtons() {
  const openBtns = document.querySelectorAll("[data-drawer]");

  openBtns.forEach((button) => {
    if (!button.hasAttribute("data-drawer-initialized")) {
      button.setAttribute("data-drawer-initialized", "true");

      button.addEventListener("click", async (event) => {
        event.preventDefault();
        const drawerId = button.getAttribute("data-drawer");
        const drawer = document.getElementById(drawerId);
        // const rootSection = drawer.dataset.rootSection === "true";
        // const section = document.querySelector(".main-product-section");

        if (drawer) {
          // if (rootSection && section) {
          //   openDrawer(drawer, button, section);
          //   AddScrollLock();
          // } else {
          //   openDrawer(drawer, button);
          //   AddScrollLock();
          // }
          openDrawer(drawer, button);
          AddScrollLock();
        }
      });
    }
  });
}

document.addEventListener("DOMContentLoaded", initDrawerOpenButtons);
document.addEventListener("shopify:section:load", initDrawerOpenButtons);
document.addEventListener("shopify:section:unload", initDrawerOpenButtons);
document.addEventListener("collection-grid-update", initDrawerOpenButtons);

function bindDrawerCloseButtons() {
  document.querySelectorAll(".drawer_close_btn").forEach((button) => {
    if (button.dataset.closeInitialized) return; // avoid rebinding
    button.dataset.closeInitialized = "true";

    button.addEventListener("click", () => {
      const drawer = button.closest(".drawer_wrapper");
      const section = document.querySelector(".main-product-section");
      if (section) {
        closeDrawer(drawer, section);
        RemoveScrollLock();
      } else {
        closeDrawer(drawer);
        RemoveScrollLock();
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", bindDrawerCloseButtons);
document.addEventListener("shopify:section:load", bindDrawerCloseButtons);

drawers.forEach((drawer) => {
  drawer.addEventListener("click", (event) => {
    const section = document.querySelector(".main-product-section");
    if (event.target === drawer) {
      if (section) {
        closeDrawer(drawer, section);
        RemoveScrollLock();
      } else {
        closeDrawer(drawer);
        RemoveScrollLock();
      }
    }
  });

  drawer.addEventListener("keydown", (event) => {
    const section = document.querySelector(".main-product-section");
    if (event.key === "Escape") {
      if (section) {
        closeDrawer(drawer, section);
        RemoveScrollLock();
      } else {
        closeDrawer(drawer);
        RemoveScrollLock();
      }
    }
  });
});


// SEARCH DRAWER
class SearchDrawer extends HTMLElement {
  constructor() {
    super();

    this.input = this.querySelector("#search_drawer_input");
    this.emptyWrapper = this.querySelector(".search_drawer_empty");
    this.resultsWrapper = this.querySelector(".search_results_wrapper");
    this.resultsInner = this.querySelector(".search_results_inner");
    this.reset = this.querySelector(".search_drawer_reset_btn");
  }

  connectedCallback() {
    if (!this.input) return;

    this.input.addEventListener(
      "input",
      this.debounce(this.handleUserInput.bind(this), 300),
    );

    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const q = this.input.value.trim();
        if (q) {
          window.location.href = `${window.Shopify.routes.root}search?q=${encodeURIComponent(q)}&options[prefix]=last`;
        }
      }
    });

    this.reset?.addEventListener("click", this.handleInputReset.bind(this));
  }

  debounce(fn, delay = 300) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  toggleResetBtn(show) {
    if (!this.reset) return;
    this.reset.classList.toggle("hidden", !show);
  }

  toggleSearchView(showEmpty) {
    if (this.emptyWrapper) {
      this.emptyWrapper.style.display = showEmpty ? "block" : "none";
    }
    if (this.resultsWrapper) {
      this.resultsWrapper.style.display = showEmpty ? "none" : "block";
    }
  }

  handleInputReset(e) {
    e.preventDefault();
    this.input.value = "";
    this.toggleResetBtn(false);
    this.toggleSearchView(true);
    this.resultsInner.innerHTML = "";
    this.classList.remove("is-loading");
  }

  handleUserInput() {
    const q = this.input.value.trim();

    this.toggleResetBtn(q.length > 0);

    if (!q) {
      this.toggleSearchView(true);
      return;
    }

    this.setLoading(true);

    fetch(
      `${window.Shopify.routes.root}search/suggest.json?q=${encodeURIComponent(q)}&resources[type]=product,collection,article,page,query`,
    )
      .then((res) => res.json())
      .then((data) => {
        this.setLoading(false);
        this.renderResults(data.resources?.results || {});
      })
      .catch((err) => {
        this.setLoading(false);
        console.error("Search error:", err);
      });
  }

  setLoading(isLoading) {
    this.classList.toggle("is-loading", isLoading);

    if (isLoading) {
      this.toggleSearchView(false);
      this.resultsInner.innerHTML = this.getLoadingMarkup();
    }
  }

  getLoadingMarkup() {
    return `
      <div class="search_drawer_loading">
        <div class="skeleton"></div>
        <div class="skeleton"></div>
        <div class="skeleton"></div>
      </div>
    `;
  }

  renderResults(results) {
    const {
      products = [],
      collections = [],
      articles = [],
      pages = [],
      queries = [],
    } = results;

    this.toggleSearchView(false);
    this.resultsInner.innerHTML = "";

    const addGroup = (title, html) => {
      const group = document.createElement("div");
      group.className = "search_result_block";
      group.innerHTML = `<h3 class="h6">${title}</h3>${html}`;
      this.resultsInner.appendChild(group);
    };

    if (queries.length) {
      addGroup(
        "Suggestions",
        queries
          .map((q) => `<p><a href="${q.url}">${q.styled_text}</a></p>`)
          .join(""),
      );
    }

    if (collections.length) {
      addGroup(
        "Collections",
        collections
          .map((c) => `<p><a href="${c.url}">${c.title}</a></p>`)
          .join(""),
      );
    }

    if (products.length) {
      addGroup(
        "Products",
        products
          .map(
            (p) => `
            <div class="search_result_product_card">
              <div class="search_result_product_card_img ratio" style="--aspect-ratio: 100%;">
                <a href="${p.url}">
                  <img src="${p.featured_image?.url || "null"}" alt="${p.title}">
                </a>
              </div>
              <div class="search_result_product_card_info">
                <h4 class="small-text"><a href="${p.url}">${p.title}</a></h4>
                <div class="search_result_product_price">
                  <p>${Shopify.formatMoney(p.price_min)}</p>
                  ${p.compare_at_price_min > p.price_min
                ? `<s>${Shopify.formatMoney(p.compare_at_price_min)}</s>`
                : ""
              }
                </div>
              </div>
            </div>
          `,
          )
          .join(""),
      );
    }

    if (articles.length) {
      addGroup(
        "Articles",
        articles
          .map(
            (a) => `
            <div class="search_result_article_card">
            <div class="search_result_article_card_img ratio" style="--aspect-ratio: 100%;">
                <a href="${a.url}">
                  <img src="${a.image || "null"}" alt="${a.title}">
                </a>
              </div>
              <div class="search_result_article_card_info">
                <h4 class="small-text"><a href="${a.url}">${a.title}</a></h4>
              </div>
            </div>
          `,
          )
          .join(""),
      );
    }

    if (pages.length) {
      addGroup(
        "Pages",
        pages.map((p) => `<p><a href="${p.url}">${p.title}</a></p>`).join(""),
      );
    }

    if (
      !queries.length &&
      !collections.length &&
      !products.length &&
      !articles.length &&
      !pages.length
    ) {
      this.resultsInner.innerHTML = `<h6 class="empty_results_heading">No results found.</h6>`;
    }
  }
}

customElements.define('search-drawer', SearchDrawer);


// COLLECTION SORTING
class CollectionSorting extends HTMLElement {
  constructor() {
    super();

    this.form = this.querySelector('form#main_collection_sort_form');
    this.select = this.querySelector('select[name="sort_by"]');
    this.sectionId = this.dataset.sectionId;

    this.isLoading = false;
  }

  connectedCallback() {
    this.select.addEventListener('change', () => {
      const value = this.select.value;

      this.isLoading = true;
      this.showLoaderSkeleton();
      this.disableFilters();

      const url = new URL(window.location.href, window.location.origin);
      url.searchParams.set('sort_by', value);
      url.searchParams.set('sections', this.sectionId);

      this.updatePage(url, this.sectionId);

      this.updateURL(url);
    })
  }

  showLoaderSkeleton() {
    const grid = document.querySelector(".main_collection_product_grid_wrapper") || document.querySelector('.main_search_results_grid_wrapper');
    if (!grid) return;

    grid.classList.add("is-loading");
    grid.setAttribute("aria-busy", "true");
  }

  hideLoaderSkeleton() {
    const grid = document.querySelector(".main_collection_product_grid_wrapper") || document.querySelector('.main_search_results_grid_wrapper');
    if (!grid) return;

    grid.classList.remove("is-loading");
    grid.removeAttribute("aria-busy");
  }

  disableFilters() {
    const filters = this.closest(".main_collection_filters");
    if (!filters) return;

    filters.setAttribute("inert", "");
    filters.classList.add("is-loading");
  }

  enableFilters() {
    const filters = this.closest(".main_collection_filters");
    if (!filters) return;

    filters.removeAttribute("inert");
    filters.classList.remove("is-loading");
  }

  updatePage(url, id) {
    const wasFilterOpen = this.closest(
      ".main_collection_filters",
    )?.classList.contains("active");

    fetch(url.toString())
      .then((res) => res.json())
      .then((htmlString) => {
        const temp = document.createElement("div");
        temp.innerHTML = htmlString[id];

        const newWrapper = temp.querySelector(".main_collection_inner_wrapper") || temp.querySelector('.main_search_inner_wrapper');
        const oldWrapper = document.querySelector(".main_collection_inner_wrapper") || document.querySelector('.main_search_inner_wrapper');

        if (oldWrapper && newWrapper) {
          oldWrapper.innerHTML = newWrapper.innerHTML;

          if (wasFilterOpen) {
            const filterWrapper = document.querySelector(
              ".main_collection_filters",
            );
            const gridWrapper = document.querySelector(
              ".main_collection_product_grid_wrapper",
            );

            if (filterWrapper && gridWrapper) {
              filterWrapper.classList.add("active");
              filterWrapper.removeAttribute("inert");
              gridWrapper.classList.add("padding");
            }
          }
        }

        const newDrawer = temp.querySelector('.collection_filter_drawer');
        const oldDrawer = document.querySelector('.collection_filter_drawer');

        if (oldDrawer && newDrawer) {
          oldDrawer.innerHTML = newDrawer.innerHTML;
        }

        document.dispatchEvent(
          new CustomEvent("collection-grid-update", {
            detail: {
              url: url,
              sectionId: this.sectionId,
            },
          }),
        );
      })
      .catch((err) => {
        console.error("Error: ", err);
      })
      .finally(() => {
        this.hideLoaderSkeleton();
        this.enableFilters();
        this.isLoading = false;
      });
  }

  updateURL(url) {
    url.searchParams.delete("sections");
    window.history.replaceState({}, "", url.toString());
  }
}

customElements.define('collection-sorting', CollectionSorting);


// COLLECTION FILTERS
class CollectionFilters extends HTMLElement {
  constructor() {
    super();

    this.sectionId = this.dataset.sectionId;
    this.btn = this.querySelector(".collection_filters_apply_button_wrapper button");
    this.form = this.querySelector("#collection_filters_form");
    this.drawer = document.querySelector(".collection_filter_drawer");
    this.activeValues = this.querySelectorAll(".collection_filter_drawer_active_values_wrapper a");

    this.isLoading = false;
  }

  connectedCallback() {
    this.attachListeners();
  }

  attachListeners() {

    /* APPLY BUTTON */
    if (this.btn) {
      this.btn.addEventListener("click", (e) => {
        e.preventDefault();

        if (!this.form || this.isLoading) return;

        this.isLoading = true;
        this.showLoaderSkeleton();
        this.disableFilters();

        this.submitForm();
      });
    }

    /* REMOVE ACTIVE FILTERS */
    if (this.activeValues.length) {
      this.activeValues.forEach((value) => {
        value.addEventListener("click", (e) => {
          e.preventDefault();

          if (this.isLoading) return;

          this.isLoading = true;
          this.showLoaderSkeleton();
          this.disableFilters();

          const url = new URL(
            e.currentTarget.getAttribute("href"),
            window.location.origin
          );

          url.searchParams.set("sections", this.sectionId);

          this.updatePage(url, this.sectionId);
          this.updateURL(url);
        });
      });
    }
  }

  showLoaderSkeleton() {
    const grid = document.querySelector(".main_collection_product_grid_wrapper") || document.querySelector('.main_search_results_grid_wrapper');
    if (!grid) return;

    grid.classList.add("is-loading");
    grid.setAttribute("aria-busy", "true");
  }

  hideLoaderSkeleton() {
    const grid = document.querySelector(".main_collection_product_grid_wrapper") || document.querySelector('.main_search_results_grid_wrapper');
    if (!grid) return;

    grid.classList.remove("is-loading");
    grid.removeAttribute("aria-busy");
  }

  disableFilters() {
    if (!this.drawer) return;

    this.drawer.setAttribute("inert", "");
    this.drawer.classList.add("is-loading");
  }

  enableFilters() {
    if (!this.drawer) return;

    this.drawer.removeAttribute("inert");
    this.drawer.classList.remove("is-loading");
  }

  submitForm() {

    const formData = new FormData(this.form);

    const priceGte = this.form.querySelector('[name="filter.v.price.gte"]');
    const priceLte = this.form.querySelector('[name="filter.v.price.lte"]');

    const defaultMin = priceGte?.getAttribute("data-default");
    const defaultMax = priceLte?.getAttribute("data-default");

    if (priceGte && priceLte && defaultMin && defaultMax) {
      if (priceGte.value === defaultMin && priceLte.value === defaultMax) {
        priceGte.value = "";
        priceLte.value = "";

        formData.delete("filter.v.price.gte");
        formData.delete("filter.v.price.lte");
      }
    }

    const params = new URLSearchParams();

    const currentParams = new URLSearchParams(window.location.search);
    const hasSortBy = formData.has("sort_by");

    for (const [key, value] of currentParams.entries()) {
      if (!key.startsWith("filter.v.") && !key.startsWith("filter.p.")) {
        if (key === "sort_by" && hasSortBy) continue;
        params.append(key, value);
      }
    }

    for (const [key, value] of formData.entries()) {
      if (value && value !== "") {
        if (key === "sort_by") {
          params.set(key, value);
        } else {
          params.append(key, value);
        }
      }
    }

    const url = new URL(`${window.location.pathname}?${params.toString()}`, window.location.origin);

    url.searchParams.set("sections", this.sectionId);

    this.updatePage(url, this.sectionId);
    this.updateURL(url);
  }

  updatePage(url, id) {

    fetch(url.toString())
      .then((res) => res.json())
      .then((htmlString) => {

        const temp = document.createElement("div");
        temp.innerHTML = htmlString[id];

        const newWrapper = temp.querySelector(".main_collection_inner_wrapper") || temp.querySelector('.main_search_inner_wrapper');
        const oldWrapper = document.querySelector(".main_collection_inner_wrapper") || document.querySelector('.main_search_inner_wrapper');

        if (oldWrapper && newWrapper) {
          oldWrapper.innerHTML = newWrapper.innerHTML;
        }

        const newDrawer = temp.querySelector(".collection_filter_drawer");
        const oldDrawer = this.drawer;

        if (oldDrawer && newDrawer) {
          oldDrawer.innerHTML = newDrawer.innerHTML;
        }

        document.dispatchEvent(
          new CustomEvent("collection-grid-update", {
            detail: {
              url: url,
              sectionId: this.sectionId,
            },
          })
        );
      })
      .catch((err) => {
        console.error("Error:", err);
      })
      .finally(() => {

        this.hideLoaderSkeleton();
        this.enableFilters();
        this.isLoading = false;

        if (typeof closeDrawer === "function") {
          closeDrawer(this.drawer);
          RemoveScrollLock();
        }

        // After the page re-renders, lastFocusedButton points to the old
        // detached DOM node, so focus is lost. Re-focus the new filter
        // icon button so keyboard users land back at the correct element.
        const filterBtn = document.querySelector('.collection_filter_icon_button') || document.querySelector('.collection_mobile_filter_icon_button') || document.querySelector('.search_filter_icon_button');
        if (filterBtn) {
          filterBtn.focus();
        }
      });
  }

  updateURL(url) {
    url.searchParams.delete("sections");
    window.history.replaceState({}, "", url.toString());
  }
}

customElements.define("collection-filters", CollectionFilters);


document.addEventListener("collection-grid-update", () => {
  if (!scrollReveal) return;

  const wrapper = document.querySelector(".main_collection_inner_wrapper") || document.querySelector('.main_search_inner_wrapper');
  if (!wrapper) return;

  scrollReveal.initElements(wrapper);
});


// CLEAR SEARCH BUTTON
class ClearSearchButton extends HTMLElement {
  constructor() {
    super();
    this.form = this.closest('form[role="search"]');
    this.btn = this.querySelector('.clear_search');
  }

  connectedCallback() {
    this.btn.addEventListener('click', this.handleClick.bind(this));
  }

  handleClick(e) {
    e.preventDefault();
    const url = new URL(window.location.href);
    url.search = '';
    window.location.href = url.toString();
  }
}

customElements.define('clear-search-button', ClearSearchButton);


// CART QUANTITY PICKER
class CartQuantityPicker extends HTMLElement {
  constructor() {
    super();

    this.btnMinus = this.querySelector("[data-minus]");
    this.input = this.querySelector('input[type="text"]');
    this.btnPlus = this.querySelector("[data-plus]");
    this.inputValue = Number(this.input.value);
    this.step = Number(this.input.getAttribute("step"));
    this.min = this.input.dataset.min;
    this.max = this.input.dataset.max;
    this.line = this.dataset.line;
  }

  connectedCallback() {
    this.btnMinus.addEventListener("click", this.handleChange.bind(this));
    this.btnPlus.addEventListener("click", this.handleChange.bind(this));
    const debouncedInputandler = debounce((e) => this.handleInput(e), 1000);
    this.input.addEventListener("input", debouncedInputandler);
  }

  handleChange(e) {
    if (e.currentTarget.hasAttribute("data-plus")) {
      this.inputValue = this.inputValue + this.step;
      this.input.value = this.inputValue;
    } else {
      this.inputValue = this.inputValue - this.step;
      this.input.value = this.inputValue;
    }

    if (this.min) {
      if (this.inputValue <= this.min) {
        this.btnMinus.setAttribute("disabled", "");
      } else {
        this.btnMinus.removeAttribute("disabled");
      }
    }

    if (this.max) {
      if (this.inputValue >= this.max) {
        this.btnMinus.setAttribute("disabled", "");
      } else {
        this.btnPlus.removeAttribute("disabled");
      }
    }

    document.dispatchEvent(
      new CustomEvent("cart-quantity-changed", {
        detail: {
          value: this.inputValue,
          line: this.line,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  handleInput(e) {
    this.value = Number(this.input.value);
    if (this.value == 0) {
      this.value = 1;
      this.input.value = 1;
    }

    if (this.min) {
      if (this.value <= this.min) {
        this.btnMinus.setAttribute("disabled", "");
      } else {
        this.btnMinus.removeAttribute("disabled");
      }
    }

    if (this.max) {
      if (this.value >= this.max) {
        this.btnMinus.setAttribute("disabled", "");
      } else {
        this.btnMinus.removeAttribute("disabled");
      }
    }

    this.dispatchEvent(
      new CustomEvent("cart-quantity-changed", {
        detail: {
          value: this.value,
          line: this.line,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

customElements.define('cart-quantity-picker', CartQuantityPicker);


// CART ITEM REMOVE
class ItemRemove extends HTMLElement {
  constructor() {
    super();
    this.line = this.dataset.line;
    this.removeBtn = this.querySelector(".item_remove_btn");
  }

  connectedCallback() {
    this.removeBtn.addEventListener("click", this.handleClick.bind(this));
  }

  handleClick(e) {
    e.preventDefault();

    document.dispatchEvent(
      new CustomEvent("cart-item-removed", {
        detail: {
          value: 0,
          line: this.line,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

customElements.define('item-remove', ItemRemove);


// CART DISCOUNT INPUT
class CartDiscountInput extends HTMLElement {
  constructor() {
    super();

    this.discountInput = this.querySelector('input[name="discount"]');
    this.value = this.discountInput.value;
    this.btn = this.querySelector('button[name="cdi_discount_btn"]');
    this.remove = this.querySelector("[data-cart-discount-remove]");
    this.error = this.querySelector(".cdi_discount_error");

    this.debounceTimer = null;
  }

  connectedCallback() {
    this.discountInput.addEventListener("input", this.handleInput.bind(this));
    this.btn.addEventListener("click", this.handleClick.bind(this));
    if (!this.remove) return;
    this.remove.addEventListener("click", this.handleRemove.bind(this));
  }

  handleInput() {
    if (this.error) {
      this.error.classList.add("hidden");
    }

    this.value = this.discountInput.value.trim();
  }

  handleClick(e) {
    e.preventDefault();

    if (!this.value) {
      if (this.error) {
        this.error.classList.remove("hidden");

        this.discountInput.focus();
        return;
      }
    }

    document.dispatchEvent(
      new CustomEvent("discount-button-clicked", {
        detail: {
          discount: this.value,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  handleRemove(e) {
    e.preventDefault();

    document.dispatchEvent(
      new CustomEvent("discount-remove-clicked", {
        detail: {
          discount: "",
        },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

customElements.define('cart-discount-input', CartDiscountInput);


// CART NOTE
class CartNote extends HTMLElement {
  constructor() {
    super();

    this.cartNoteBtn = this.querySelector(".cdi_cart_note_btn");
    this.cartNoteWrapper = this.querySelector('.cdi_cart_note_inner')
    this.textarea = this.querySelector("textarea");
  }


  connectedCallback() {
    if (this.cartNoteBtn) {
      this.cartNoteBtn.addEventListener("click", this.handleNoteClick.bind(this));
    }

    this.textarea?.addEventListener("input", () => {
      clearTimeout(this.debounceTimer);

      this.debounceTimer = setTimeout(() => {
        this.updateCartNote(this.textarea.value.trim());
      }, 500);
    });
  }

  handleNoteClick() {
    const isOpen = this.cartNoteWrapper.hasAttribute("open");

    if (isOpen) {
      this.closeNote();
    } else {
      this.openNote();
    }
  }

  openNote() {
    this.cartNoteWrapper.setAttribute("open", "");
    this.textarea.removeAttribute("inert");
    this.textarea.setAttribute("aria-hidden", "false");
    this.textarea.focus();
  }

  closeNote() {
    this.cartNoteWrapper.removeAttribute("open");
    this.textarea.setAttribute("inert", "");
    this.textarea.setAttribute("aria-hidden", "true");
  }

  updateCartNote(value) {
    fetch(`${window.Shopify.routes.root}cart/update.js`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: value }),
    }).catch((err) => {
      console.error("Error updating cart note:", err);
    });
  }
}

customElements.define('cart-note', CartNote);


// CART CONTROLLER
class CartController {
  static init() {
    this.locked = false;

    document.addEventListener("cart-quantity-changed", (e) =>
      this.updateLine(e.detail.line, e.detail.value)
    );

    document.addEventListener("cart-item-removed", (e) =>
      this.updateLine(e.detail.line, 0)
    );

    document.addEventListener("discount-button-clicked", (e) =>
      this.updateDiscount(e.detail.discount)
    );

    document.addEventListener("discount-remove-clicked", (e) =>
      this.updateDiscount("")
    );

    document.addEventListener("cart-note-change", (e) =>
      this.updateNote(e.detail.note)
    );
  }

  static startLoading() {
    document.dispatchEvent(
      new CustomEvent("cart-loading", {
        detail: { loading: true },
        bubbles: true,
      })
    );
  }

  static stopLoading() {
    document.dispatchEvent(
      new CustomEvent("cart-loading", {
        detail: { loading: false },
        bubbles: true,
      })
    );
  }

  static async updateLine(line, quantity) {
    if (this.locked) return;
    this.locked = true;
    this.startLoading();

    try {
      const res = await fetch(`${window.Shopify.routes.root}cart/change.js`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line,
          quantity,
          sections: "cart-drawer,cart,cart-bubble",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const sections = await fetch(
          `${window.Shopify.routes.root}?sections=cart-drawer,cart,cart-bubble`
        ).then((r) => r.json());

        document.dispatchEvent(
          new CustomEvent("cart-updated", {
            detail: {
              line,
              message: data.message || data.description,
              sections,
            },
            bubbles: true,
          })
        );

        return;
      }

      this.dispatchUpdate(data);
    } catch (err) {
      console.error("Cart line update failed:", err);
    } finally {
      this.locked = false;
      this.stopLoading();
    }
  }

  static async updateDiscount(discount) {
    if (this.locked) return;
    this.locked = true;
    this.startLoading();

    try {
      const res = await fetch(`${window.Shopify.routes.root}cart/update.js`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discount,
          sections: "cart-drawer,cart,cart-bubble",
        }),
      });

      const data = await res.json();

      const discountData = data.discount_codes?.[0];

      if (discount && discountData && discountData.applicable === false) {
        document.dispatchEvent(
          new CustomEvent("cart-discount-error", {
            detail: {
              message: "Invalid or expired discount code",
            },
            bubbles: true,
          })
        );
        return;
      }

      this.dispatchUpdate(data);
    } catch (err) {
      console.error(err);
    } finally {
      this.locked = false;
      this.stopLoading();
    }
  }

  static async updateNote(note) {
    if (this.locked) return;
    this.locked = true;
    this.startLoading();

    try {
      const res = await fetch(`${window.Shopify.routes.root}cart/update.js`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note,
          sections: "cart-drawer,cart",
        }),
      });

      const data = await res.json();
      this.dispatchUpdate(data);
    } catch (err) {
      console.error(err);
    } finally {
      this.locked = false;
      this.stopLoading();
    }
  }

  static dispatchUpdate(data) {
    document.dispatchEvent(
      new CustomEvent("cart-updated", {
        detail: data,
        bubbles: true,
      })
    );
  }
}

CartController.init();


// CART DRAWER
class CartDrawer extends HTMLElement {
  constructor() {
    super();
    this.inner = this.querySelector(".cart_drawer_inner") || this.querySelector('.main_cart_contents_wrapper');

    this.handleUpdate = updateCart.bind(this);
    this.handleLoading = this.handleLoading.bind(this);
    this.handleDiscountError = this.handleDiscountError.bind(this);
  }

  connectedCallback() {
    document.addEventListener("cart-updated", this.handleUpdate);
    document.addEventListener("cart-loading", this.handleLoading);
    document.addEventListener("cart-discount-error", this.handleDiscountError);
    this.querySelector('input[name="discount"]')
      ?.addEventListener("input", () => {
        this.querySelector(".cdi_discount_error")?.classList.add("hidden");
      });
  }

  disconnectedCallback() {
    document.removeEventListener("cart-updated", this.handleUpdate);
    document.removeEventListener("cart-loading", this.handleLoading);
    document.removeEventListener("cart-discount-error", this.handleDiscountError);
  }

  handleLoading(e) {
    if (!this.inner) return;
    this.inner.classList.toggle("loading", e.detail.loading);
  }

  handleDiscountError(e) {
    const error = this.querySelector(".cdi_discount_error");
    const input = this.querySelector('input[name="discount"]');

    if (!error) return;

    error.textContent = e.detail.message;
    error.classList.remove("hidden");

    if (input) input.value = "";
  }
}

customElements.define("cart-drawer", CartDrawer);

class CartPackUpgrade extends HTMLElement {
  connectedCallback() {
    this.button = this.querySelector("button");
    this.onClick = this.onClick.bind(this);
    this.button?.addEventListener("click", this.onClick);
  }

  disconnectedCallback() {
    this.button?.removeEventListener("click", this.onClick);
  }

  async onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.button?.disabled || this.isUpgrading) return;

    const lineKey = this.dataset.key;
    const variantId = Number(this.dataset.variantId);
    const quantity = Math.max(1, Number(this.dataset.quantity) || 1);
    const sameVariant = this.dataset.sameVariant === "true";

    if (!lineKey || !variantId) {
      console.error("Cart pack upgrade missing key or variant id", this.dataset);
      return;
    }

    this.isUpgrading = true;
    this.button.disabled = true;

    try {
      CartController.startLoading();

      if (sameVariant) {
        const changeRes = await fetch(`${window.Shopify.routes.root}cart/change.js`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({
            id: lineKey,
            quantity,
          }),
        });

        if (!changeRes.ok) {
          const changeErr = await changeRes.json().catch(() => ({}));
          throw new Error(changeErr.description || changeErr.message || "Unable to update quantity");
        }
      } else {
        const changeRes = await fetch(`${window.Shopify.routes.root}cart/change.js`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({
            id: lineKey,
            quantity: 0,
          }),
        });

        if (!changeRes.ok) {
          const changeErr = await changeRes.json().catch(() => ({}));
          throw new Error(changeErr.description || changeErr.message || "Unable to remove current item");
        }

        const addRes = await fetch(`${window.Shopify.routes.root}cart/add.js`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: JSON.stringify({
            id: variantId,
            quantity,
          }),
        });

        const addData = await addRes.json();
        if (!addRes.ok) {
          throw new Error(addData.description || addData.message || "Upgrade failed");
        }
      }

      const sections = await fetch(
        `${window.Shopify.routes.root}?sections=cart-drawer,cart,cart-bubble`
      ).then((r) => r.json());

      document.dispatchEvent(
        new CustomEvent("cart-updated", {
          detail: { sections },
          bubbles: true,
        })
      );
    } catch (err) {
      console.error("Cart pack upgrade failed:", err);
      window.alert(err?.message || "Unable to upgrade pack.");
    } finally {
      this.isUpgrading = false;
      CartController.stopLoading();
      if (this.button) this.button.disabled = false;
    }
  }
}

customElements.define("cart-pack-upgrade", CartPackUpgrade);

function getFreeShippingCurrencyRate(fallbackRate = 1) {
  const storefrontRate =
    window.Shopify?.currency?.rate || window.Shopify?.Currency?.rate;
  const parsedRate = Number(storefrontRate);

  if (!Number.isNaN(parsedRate) && parsedRate > 0) {
    return parsedRate;
  }

  return fallbackRate;
}

function formatFreeShippingAmount(amount, currencyCode, locale) {
  if (currencyCode && window.Intl?.NumberFormat) {
    try {
      return new Intl.NumberFormat(locale || undefined, {
        style: "currency",
        currency: currencyCode,
      }).format(amount);
    } catch (error) {
      console.warn("Unable to format free shipping amount with Intl.", error);
    }
  }

  return Shopify.formatMoney(Math.round(amount * 100));
}

function celebrateFreeShipping(freeShippingBar) {
  const container = freeShippingBar?.closest(
    ".cart_drawer_inner, .main_cart_contents_wrapper"
  );
  const layer = container?.querySelector(
    ".cart_drawer_confetti_layer, .main_cart_confetti_layer"
  );

  if (!layer) return;

  layer.innerHTML = "";

  const colors = [
    "#ff7b72",
    "#ffd166",
    "#7bdff2",
    "#cdb4db",
    "#80ed99",
    "#f9bec7",
    "#a0c4ff",
    "#b8f2e6",
  ];
  const shapes = ["", "cart_drawer_confetti_piece--square", "cart_drawer_confetti_piece--circle"];
  const totalPieces = 26;

  for (let index = 0; index < totalPieces; index += 1) {
    const piece = document.createElement("span");
    const size = 0.55 + Math.random() * 0.7;
    const x = -16 + Math.random() * 32;
    const y = 18 + Math.random() * 28;
    const left = 8 + Math.random() * 84;
    const rotate = 120 + Math.random() * 260;
    const duration = 1000 + Math.random() * 500;
    const color = colors[index % colors.length];
    const shape = shapes[index % shapes.length];

    piece.className = `cart_drawer_confetti_piece ${shape}`.trim();
    piece.style.setProperty("--confetti-size", `${size}rem`);
    piece.style.setProperty("--confetti-left", `${left}%`);
    piece.style.setProperty("--confetti-x", `${x}rem`);
    piece.style.setProperty("--confetti-y", `${y}rem`);
    piece.style.setProperty("--confetti-rotate", `${rotate}deg`);
    piece.style.setProperty("--confetti-duration", `${duration}ms`);
    piece.style.setProperty("--confetti-color", color);
    layer.appendChild(piece);
  }

  window.setTimeout(() => {
    layer.innerHTML = "";
  }, 1700);
}

function refreshFreeShippingBar(totalPrice) {
  const freeShippingBar = document.querySelector(".free_shipping_bar");

  if (!freeShippingBar) return;

  const threshold = Number(freeShippingBar.dataset.threshold) || 0;
  const fallbackRate = Number(freeShippingBar.dataset.exchangeRate) || 1;
  const currencyCode = freeShippingBar.dataset.currencyCode;
  const locale = freeShippingBar.dataset.locale;
  const currentTotal =
    typeof totalPrice === "number"
      ? totalPrice
      : Number(freeShippingBar.dataset.cartTotal) || 0;

  if (threshold <= 0) return;

  const rate = getFreeShippingCurrencyRate(fallbackRate);
  const finalThreshold = threshold * rate;
  const remaining = Math.max(finalThreshold - currentTotal, 0);
  const percentage =
    finalThreshold > 0
      ? Math.min((currentTotal / finalThreshold) * 100, 100)
      : 0;

  const shippingMessage = freeShippingBar.querySelector(
    ".free_shipping_bar_message"
  );
  const progressBar = freeShippingBar.querySelector(".free_shipping_bar_fill");
  const spendMoreTemplate =
    freeShippingBar.dataset.spendMoreTemplate ||
    "You're [amount] away from free shipping";
  const qualifiedText =
    freeShippingBar.dataset.qualifiedText ||
    "You've unlocked free shipping";
  const isQualified = remaining <= 0;
  const wasQualified = freeShippingBar.dataset.qualified === "true";

  freeShippingBar.dataset.qualified = String(isQualified);
  freeShippingBar.classList.toggle("is-qualified", isQualified);

  if (shippingMessage) {
    if (!isQualified) {
      const formattedAmount = formatFreeShippingAmount(
        remaining,
        currencyCode,
        locale
      );
      shippingMessage.innerHTML = spendMoreTemplate.replace(
        "[amount]",
        formattedAmount
      );
    } else {
      shippingMessage.innerHTML = `<span class="free_shipping_bar_qualified">${qualifiedText}</span>`;
    }
  }

  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
  }

  if (isQualified && !wasQualified) {
    freeShippingBar.classList.remove("is-celebrating");
    void freeShippingBar.offsetWidth;
    freeShippingBar.classList.add("is-celebrating");
    celebrateFreeShipping(freeShippingBar);

    window.setTimeout(() => {
      freeShippingBar.classList.remove("is-celebrating");
    }, 950);
  }
}


// UPDATE CART
function updateCart(e) {
  const data = e.detail;
  const updatedDrawer = data.sections["cart-drawer"];
  const updatedCartPage = data.sections["cart"];
  const updatedCartBubble = data.sections["cart-bubble"];
  const div = document.createElement("div");
  const pageDiv = document.createElement("div");
  const bubbleDiv = document.createElement("div");
  const errorMsg = e.detail.message;
  const line = e.detail.line;

  // CART DRAWER UPDATE
  if (updatedDrawer) {
    div.innerHTML = updatedDrawer;
  }

  const oldDrawer = document.querySelector('cart-drawer');

  if (oldDrawer) {
    const drawerHeader = oldDrawer.querySelector(".cart_drawer_header h2");
    const drawerContent = oldDrawer.querySelector(".cart_drawer_content_wrapper");

    if (drawerHeader) {
      drawerHeader.innerHTML = div.querySelector(".cart_drawer_header h2").innerHTML;
    }

    // Sync the shipping bar, which lives between the header and content wrapper
    const newShippingBar = div.querySelector(".free_shipping_bar");
    const oldShippingBar = oldDrawer.querySelector(".free_shipping_bar");
    if (newShippingBar) {
      if (oldShippingBar) {
        oldShippingBar.replaceWith(newShippingBar);
      } else if (drawerContent) {
        drawerContent.insertAdjacentElement("beforebegin", newShippingBar);
      }
    } else if (oldShippingBar) {
      oldShippingBar.remove();
    }

    if (drawerContent) {
      drawerContent.innerHTML = div.querySelector(".cart_drawer_content_wrapper").innerHTML;

      if (errorMsg && line) {
        const errorWrapper = drawerContent.querySelector(
          `.cart_drawer_error[data-line="${line}"]`,
        );

        if (errorWrapper) {
          errorWrapper.innerHTML = `<p>${errorMsg}</p>`;
          errorWrapper.removeAttribute("hidden");
        }
      }
    }
  }

  // MAIN CART PAGE UPDATE
  if (updatedCartPage) {
    pageDiv.innerHTML = updatedCartPage;
  }

  const oldCartPage = document.querySelector('.main_cart_contents_wrapper');
  const newCartPage = pageDiv.querySelector('.main_cart_contents_wrapper');

  if (oldCartPage && newCartPage) {
    oldCartPage.innerHTML = newCartPage.innerHTML;

    scrollReveal.initElements(oldCartPage);

    if (errorMsg && line) {
      const errorWrapper = oldCartPage.querySelector(`.cart_error[data-line="${line}"]`);

      if (errorWrapper) {
        errorWrapper.innerHTML = `<p>${errorMsg}</p>`
        errorWrapper.removeAttribute('hidden')
      }
    }

  }

  // CART BUBBLE UPDATE
  if (updatedCartBubble) {
    bubbleDiv.innerHTML = updatedCartBubble;
  }

  const oldBubble = document.querySelector(".cart_count_text");
  if (oldBubble) {
    oldBubble.innerHTML = bubbleDiv.querySelector(".cart_count_text").innerHTML;
  }

  if (typeof data.total_price === "number") {
    refreshFreeShippingBar(data.total_price / 100);
  } else if (data.sections?.["cart-drawer"]) {
    const tmpDiv = document.createElement("div");
    tmpDiv.innerHTML = data.sections["cart-drawer"];
    const freshFsb = tmpDiv.querySelector(".free_shipping_bar");
    const freshTotal = freshFsb ? Number(freshFsb.dataset.cartTotal) || undefined : undefined;
    // Delay so confetti fires after the cart drawer finishes opening
    window.setTimeout(() => refreshFreeShippingBar(freshTotal), 500);
  } else {
    refreshFreeShippingBar();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  refreshFreeShippingBar();
});


// QUANTITY PICKER
class QuantityPicker extends HTMLElement {
  constructor() {
    super();
    this.onButtonClick = this.onButtonClick.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
  }

  connectedCallback() {
    this.btnMinus = this.querySelector("[data-minus]");
    this.btnPlus = this.querySelector("[data-plus]");
    this.input = this.querySelector('input[type="text"]');

    this.step = Number(this.input.step) || 1;
    this.min = Number(this.input.dataset.min) || 1;
    this.max = Number(this.input.dataset.max) || null;

    this.btnMinus.addEventListener("click", this.onButtonClick);
    this.btnPlus.addEventListener("click", this.onButtonClick);
    this.input.addEventListener("input", this.onInputChange);

    this.updateButtons();
  }

  get value() {
    return Number(this.input.value) || this.min;
  }

  set value(val) {
    const clamped = this.max
      ? Math.min(Math.max(val, this.min), this.max)
      : Math.max(val, this.min);

    this.input.value = clamped;
    this.updateButtons();
    this.emitChange(clamped);
  }

  onButtonClick(e) {
    if (e.currentTarget === this.btnPlus) {
      this.value = this.value + this.step;
    } else {
      this.value = this.value - this.step;
    }
  }

  onInputChange() {
    this.value = this.value;
  }

  updateButtons() {
    this.btnMinus.disabled = this.value <= this.min;
    this.btnPlus.disabled = this.max && this.value >= this.max;
  }

  emitChange(value) {
    this.dispatchEvent(
      new CustomEvent("quantity-changed", {
        detail: { value },
        bubbles: true,
        composed: true,
      }),
    );
  }
}

customElements.define("quantity-picker", QuantityPicker);


// VARIANT PICKER
class VariantPicker extends HTMLElement {
  connectedCallback() {
    this.addEventListener("change", this.onChange);
  }

  disconnectedCallback() {
    this.removeEventListener("change", this.onChange);
  }

  onChange = () => {
    const selectedOptions = this.selectedOptions;

    this.dispatchEvent(
      new CustomEvent("variant-changed", {
        detail: { selectedOptions },
        bubbles: true,
        composed: true,
      }),
    );
  };

  get selectedOptions() {
    const selectValues = Array.from(this.querySelectorAll("select")).map(
      (select) => select.selectedOptions[0]?.dataset.value,
    );

    const radioValues = Array.from(
      this.querySelectorAll('input[type="radio"]:checked'),
    ).map((radio) => radio.dataset.value);

    return [...selectValues, ...radioValues].filter(Boolean);
  }
}

customElements.define("variant-picker", VariantPicker);


// PRODUCT FORM
class ProductForm extends HTMLElement {
  constructor() {
    super();

    this.handleSubmit = this.handleSubmit.bind(this);
    this.onVariantChange = this.onVariantChange.bind(this);
    this.isSubmitting = false;
  }

  connectedCallback() {
    this.cacheElements();

    this.addEventListener("submit", this.handleSubmit);
    this.addEventListener("variant-changed", this.onVariantChange);
  }

  disconnectedCallback() {
    this.removeEventListener("submit", this.handleSubmit);
    this.removeEventListener("variant-changed", this.onVariantChange);
  }

  cacheElements() {
    this.form = this.querySelector("form");
    this.button = this.querySelector(".product_form_submit_btn");
    this.btnText = this.button?.querySelector(".btn_text");
    this.loader = this.button?.querySelector(".loader");
    this.cart =
      document.getElementById("cart_drawer") ||
      document.querySelector(".cart_drawer_wrapper");
    this.openDrawer = false;
  }

  onVariantChange() {
    this.cacheElements();
  }

  async handleSubmit(e) {
    if (!e.target.closest("form")) return;

    e.preventDefault();
    e.stopPropagation();

    if (this.isSubmitting) return;
    this.isSubmitting = true;

    this.cacheElements();
    if (!this.form || !this.button) {
      this.isSubmitting = false;
      return;
    }

    this.button.setAttribute("disabled", "disabled");
    this.button.setAttribute("aria-busy", "true");
    this.button.classList.add('loading');

    if (this.btnText) this.btnText.classList.add("hidden");

    if (this.loader) this.loader.classList.remove("hidden");

    try {
      const formData = new FormData(this.form);

      const res = await fetch(`${Shopify.routes.root}cart/add.js`, {
        method: "POST",
        headers: { "X-Requested-With": "XMLHttpRequest" },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        this.showError(data);
        const sections = await fetch(
          `${Shopify.routes.root}?sections=cart-drawer,cart,cart-bubble`,
        ).then((r) => r.json());

        document.dispatchEvent(
          new CustomEvent("cart-updated", {
            detail: { sections },
            bubbles: true,
          }),
        );
        throw data;
      }

      this.cart =
        document.getElementById("cart_drawer") ||
        document.querySelector(".cart_drawer_wrapper");

      if (this.cart) {
        openDrawer(this.cart, this.button);
        AddScrollLock();
        this.openDrawer = true;

        const sections = await fetch(
          `${Shopify.routes.root}?sections=cart-drawer,cart,cart-bubble`,
        ).then((r) => r.json());

        document.dispatchEvent(
          new CustomEvent("cart-updated", {
            detail: { sections },
            bubbles: true,
          }),
        );
      } else {
        window.location.href = `${Shopify.routes.root}cart`;
      }
    } catch (err) {
      this.showError(err);
    } finally {
      this.isSubmitting = false;

      if (this.button) {
        this.button.removeAttribute("disabled");
        this.button.removeAttribute("aria-busy");
        this.button.classList.remove('loading');
      }
      if (this.btnText) this.btnText.classList.remove("hidden");

      if (this.loader) this.loader.classList.add("hidden");

      if (this.openDrawer && this.cart) {
        openDrawer(this.cart, this.button);
        AddScrollLock();
      }
    }
  }

  showError(data) {
    const error =
      this.querySelector(".product_add_error") || this.closest(".product_card_wrapper").querySelector(".product_add_error") || this.closest(".complementary_product_card_wrapper").querySelector('.product_add_error');
    if (!error) return;

    let message = "Unable to add product to cart";

    if (data?.errors && typeof data.errors === "object") {
      const formattedErrors = [];

      Object.entries(data.errors).forEach(([field, value]) => {
        let fieldLabel = "";

        if (field === "email") fieldLabel = "Email";

        if (value === "can't be blank") {
          formattedErrors.push(`${fieldLabel} can't be blank`);
        } else if (value === "is invalid") {
          formattedErrors.push(`${fieldLabel} is invalid`);
        } else {
          formattedErrors.push(`${fieldLabel} ${value}`);
        }
      });

      message = formattedErrors.join("<br>");
    } else if (typeof data?.errors === "string") {
      message = data.errors;
    } else if (typeof data?.description === "string") {
      message = data.description;
    } else if (typeof data?.message === "string") {
      message = data.message;
    }

    error.innerHTML = message;
    error.classList.remove("hidden");
  }
}

customElements.define("product-form", ProductForm);


// QUICK ADD BUTTON
class QuickAddButton extends HTMLElement {
  constructor() {
    super();
    this.btn = this.querySelector(".quick_add_btn");
    this.productHandle = this.dataset.productHandle;
  }

  connectedCallback() {
    if (!this.btn) return;
    this.btn.addEventListener("click", this.handleClick.bind(this));
  }

  async handleClick() {
    const drawer = document.querySelector(".quick_add_drawer_wrapper");
    if (!drawer || !this.btn) return;

    const skeleton = drawer.querySelector(".quick_add_skeleton");
    const content = drawer.querySelector(".quick_add_content");

    content.innerHTML = "";
    skeleton.classList.remove("hidden");

    openDrawer(drawer, this.btn);
    AddScrollLock();

    const fetchPromise = fetch(
      `${Shopify.routes.root}products/${this.productHandle}?section_id=quick-add-drawer`,
    ).then((r) => r.text());

    const delayPromise = new Promise((resolve) => setTimeout(resolve, 1000));

    const [html] = await Promise.all([fetchPromise, delayPromise]);

    const doc = new DOMParser().parseFromString(html, "text/html");
    const newContent = doc.querySelector(".quick_add_content");

    if (!newContent) return;

    skeleton.classList.add("hidden");
    content.innerHTML = newContent.innerHTML;
  }
}

customElements.define("quick-add-button", QuickAddButton);


// QUICK ADD PRODUCT
class QuickAddProduct extends HTMLElement {
  constructor() {
    super();
    this.abortController = null;
    this.cache = new Map();

    this.onQuantityChange = this.onQuantityChange.bind(this);
    this.onVariantChange = this.onVariantChange.bind(this);
    this.productUrl = this.dataset.productUrl;
    this.drawer = document.querySelector(".quick_add_drawer_wrapper");
  }

  connectedCallback() {
    this.addEventListener("quantity-changed", this.onQuantityChange);
    this.addEventListener("variant-changed", this.onVariantChange);
  }

  disconnectedCallback() {
    this.removeEventListener("quantity-changed", this.onQuantityChange);
    this.removeEventListener("variant-changed", this.onVariantChange);
  }

  setLoading(state) {
    if (!this.drawer) return;
    const inner = this.drawer.querySelector(".quick_add_drawer_inner");
    if (inner) {
      inner.classList.toggle("loading", state);
    }
  }

  onQuantityChange(e) {
    const { value } = e.detail;
    const input = this.querySelector('input[name="quantity"]');
    if (input) {
      input.value = value;
    }
  }

  onVariantChange(e) {
    if (!e.detail?.selectedOptions) return;

    this.setLoading(true);

    this.requestedURL = this.buildURL(e.detail.selectedOptions);

    this.loadProductInfo(this.requestedURL);
  }

  buildURL(options) {
    const params = new URLSearchParams();
    if (options.length) {
      params.append("option_values", options.join(","));
    }

    params.append("section_id", "quick-add-drawer");

    return `${this.productUrl}?${params.toString()}`;
  }

  loadProductInfo(url) {
    if (this.abortController) {
      this.abortController.abort();
    }

    if (this.cache.has(url)) {
      const html = this.cache.get(url);
      const doc = new DOMParser().parseFromString(html, "text/html");
      this.updateQuickDrawer(doc);
      this.setLoading(false);
      return;
    }

    this.abortController = new AbortController();

    fetch(url, { signal: this.abortController.signal })
      .then((res) => res.text())
      .then((html) => {
        this.cache.set(url, html);

        const doc = new DOMParser().parseFromString(html, "text/html");
        this.updateQuickDrawer(doc);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("Error loading product info:", err);
        }
      })
      .finally(() => {
        this.setLoading(false);
      });
  }

  updateQuickDrawer(doc) {
    let container = doc.querySelector("#shopify-section-quick-add-drawer") || doc.body.firstElementChild;

    if (!container) return;

    // UPDATE IMAGES
    const oldImages = this.querySelector(".quick_add_product_images");
    const updatedImages = container.querySelector(".quick_add_product_images");

    if (oldImages && updatedImages) {
      oldImages.innerHTML = updatedImages.innerHTML;
    }

    // UPDATE PRICE
    const oldPrice = this.querySelector(".quick_add_product_price");
    const updatedPrice = container.querySelector(".quick_add_product_price");

    if (oldPrice && updatedPrice) {
      oldPrice.innerHTML = updatedPrice.innerHTML;
    }

    // UPDATE INVENTORY
    const oldInventory = this.querySelector(".quick_add_inventory_wrapper");
    const updatedInventory = container.querySelector(
      ".quick_add_inventory_wrapper",
    );

    if (oldInventory && updatedInventory) {
      oldInventory.innerHTML = updatedInventory.innerHTML;
    }

    // UPDATE VARIANT SELECTOR
    const oldVariantSelector = this.querySelector(
      ".quick_add_variant_picker_wrapper",
    );
    const updatedVariantSelector = container.querySelector(
      ".quick_add_variant_picker_wrapper",
    );

    if (oldVariantSelector && updatedVariantSelector) {
      oldVariantSelector.innerHTML = updatedVariantSelector.innerHTML;
    }

    // UPDATE QUANTITY
    const oldQuantity = this.querySelector(".quick_add_quantity_wrapper");
    const updatedQuantity = container.querySelector(
      ".quick_add_quantity_wrapper",
    );
    const oldMainQty = this.querySelector('input[name="quantity"]');
    const updatedMainQty = container.querySelector('input[name="quantity"]');

    if (oldQuantity && updatedQuantity) {
      oldQuantity.innerHTML = updatedQuantity.innerHTML;
    }

    // // UPDATE ACTION BUTTONS
    const oldActionBtns = this.querySelector(
      ".quick_add_action_buttons_wrapper",
    );
    const updatedActionBtns = container.querySelector(
      ".quick_add_action_buttons_wrapper",
    );

    if (oldActionBtns && updatedActionBtns) {
      oldActionBtns.innerHTML = updatedActionBtns.innerHTML;
    }
  }
}

customElements.define("quick-add-product", QuickAddProduct);


// FEATURED PRODUCT
class FeaturedProduct extends HTMLElement {
  constructor() {
    super();
    this.onQuantityChange = this.onQuantityChange.bind(this);
    this.onVariantChange = this.onVariantChange.bind(this);
    this.productUrl = this.dataset.productUrl;
    this.sectionId = this.dataset.sectionId;
    this.updateUrl = this.dataset.updateUrl === 'true';

    this.cache = new Map();
    this.cacheLimit = 10;
  }

  connectedCallback() {
    this.addEventListener("quantity-changed", this.onQuantityChange);
    this.addEventListener("variant-changed", this.onVariantChange);
  }

  disconnectedCallback() {
    this.removeEventListener("quantity-changed", this.onQuantityChange);
    this.removeEventListener("variant-changed", this.onVariantChange);
  }

  onQuantityChange(e) {
    const { value } = e.detail;
    const input = this.querySelector('input[name="quantity"]');
    if (input) {
      input.value = value;
    }
  }

  onVariantChange(e) {
    if (!e.detail?.selectedOptions) return;

    this.lastFocusedSignature = this.getFocusedElementSignature();

    this.requestedURL = this.buildURL(e.detail.selectedOptions);

    this.loadProductInfo(this.requestedURL);
  }

  buildURL(options) {
    const params = [];
    if (options.length) {
      params.push(`option_values=${encodeURIComponent(options.join(","))}`);
    }

    if (this.sectionId) {
      params.push(`section_id=${this.sectionId}`);
    }

    return `${this.productUrl}?${params.join("&")}`;
  }

  loadProductInfo(url) {
    if (this.cache.has(url)) {
      this.updateInfo(this.cache.get(url));
      return;
    }

    fetch(url)
      .then((res) => res.text())
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");

        if (this.cache.size >= this.cacheLimit) {
          const firstKey = this.cache.keys().next().value;
          this.cache.delete(firstKey);
        }
        this.cache.set(url, doc);

        this.updateInfo(doc);
      })
      .catch((err) => {
        console.error("Error loading product info: ", err);
      })
  }

  updateInfo(doc) {
    const container = doc.querySelector("featured-product");

    if (!container) return;
    this.innerHTML = container.innerHTML;

    requestAnimationFrame(() => {
      this.restoreFocus(this.lastFocusedSignature);
    });

    this.reinitializePickupAvailability();
  }

  getFocusedElementSignature() {
    const el = document.activeElement;
    if (!this.contains(el)) return null;

    return {
      id: el.id || null,
      name: el.getAttribute("name"),
      value: el.value,
      dataset: { ...el.dataset },
      tag: el.tagName
    };
  }

  reinitializePickupAvailability() {
    const pickupContainer = this.querySelector('[data-store-availability-container]');
    
    if (!pickupContainer) return;

    if (window.Shopify && Shopify.StoreAvailability) {
      new Shopify.StoreAvailability(pickupContainer);
    }

    initDrawerOpenButtons();

    bindDrawerCloseButtons();

    const pickup_drawer = document.querySelector('.pickup_availability_drawer');
    if (pickup_drawer) {
      pickup_drawer.addEventListener("click", (event) => {
        if (event.target === pickup_drawer) {          
            closeDrawer(pickup_drawer);
            RemoveScrollLock();          
        }
      });

      pickup_drawer.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {          
            closeDrawer(pickup_drawer);
            RemoveScrollLock();          
        }
      });
    }    
  }

  restoreFocus(signature) {
    if (!signature) return;

    let target = null;

    if (signature.id) {
      target = this.querySelector(`#${CSS.escape(signature.id)}`);
    }

    if (!target && signature.name) {
      target = this.querySelector(
        `[name="${CSS.escape(signature.name)}"][value="${CSS.escape(signature.value ?? "")}"]`
      );
    }

    if (!target && signature.dataset) {
      for (const [key, val] of Object.entries(signature.dataset)) {
        target = this.querySelector(`[data-${key}="${CSS.escape(val)}"]`);
        if (target) break;
      }
    }

    if (target && typeof target.focus === "function") {
      target.focus({ preventScroll: true });
    }
  }

  updateURL(html) {
    const variantEl = html.querySelector('[data-selected-variant]');
    if (!variantEl) return;

    let variantData;
    try {
      variantData = JSON.parse(variantEl.textContent);
    } catch {
      return;
    }

    if (!variantData?.id) return;

    window.history.replaceState(
      null,
      "",
      `${this.productUrl}?variant=${variantData.id}`
    );

  }
}

customElements.define("featured-product", FeaturedProduct);


// MAIN PRODUCT
class MainProduct extends HTMLElement {
  constructor() {
    super();
    this.onQuantityChange = this.onQuantityChange.bind(this);
    this.onVariantChange = this.onVariantChange.bind(this);
    this.handleStickyVisibility = this.handleStickyVisibility.bind(this);
    this.handleStickyChangeClick = this.handleStickyChangeClick.bind(this);
    this.productUrl = this.dataset.productUrl;
    this.sectionId = this.dataset.sectionId;
    this.updateUrl = this.dataset.updateUrl === 'true';

    this.cache = new Map();
    this.cacheLimit = 10;
  }

  connectedCallback() {
    this.addEventListener("quantity-changed", this.onQuantityChange);
    this.addEventListener("variant-changed", this.onVariantChange);
    this.initializeStickyAddToCart();
  }

  disconnectedCallback() {
    this.removeEventListener("quantity-changed", this.onQuantityChange);
    this.removeEventListener("variant-changed", this.onVariantChange);
    this.teardownStickyAddToCart();
  }

  onQuantityChange(e) {
    const { value } = e.detail;
    const input = this.querySelector('input[name="quantity"]');
    if (input) {
      input.value = value;
    }
  }

  onVariantChange(e) {
    if (!e.detail?.selectedOptions) return;

    this.lastFocusedSignature = this.getFocusedElementSignature();

    this.requestedURL = this.buildURL(e.detail.selectedOptions);

    this.loadProductInfo(this.requestedURL);
  }

  buildURL(options) {
    const params = [];
    if (options.length) {
      params.push(`option_values=${encodeURIComponent(options.join(","))}`);
    }

    if (this.sectionId) {
      params.push(`section_id=${this.sectionId}`);
    }

    return `${this.productUrl}?${params.join("&")}`;
  }

  loadProductInfo(url) {
    if (this.cache.has(url)) {
      this.updateInfo(this.cache.get(url));
      return;
    }

    fetch(url)
      .then((res) => res.text())
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");

        if (this.cache.size >= this.cacheLimit) {
          const firstKey = this.cache.keys().next().value;
          this.cache.delete(firstKey);
        }
        this.cache.set(url, doc);

        this.updateInfo(doc);
        if (this.updateUrl) {
          this.updateURL(doc);
        }

      })
      .catch((err) => {
        console.error("Error loading product info: ", err);
      })
  }

  updateInfo(doc) {
    const container = doc.querySelector("main-product");

    if (!container) return;
    this.innerHTML = container.innerHTML;

    requestAnimationFrame(() => {
      this.restoreFocus(this.lastFocusedSignature);
    });

    this.reinitializePickupAvailability();
    this.initializeStickyAddToCart();
  }

  getFocusedElementSignature() {
    const el = document.activeElement;
    if (!this.contains(el)) return null;

    return {
      id: el.id || null,
      name: el.getAttribute("name"),
      value: el.value,
      dataset: { ...el.dataset },
      tag: el.tagName
    };
  }

  reinitializePickupAvailability() {
    const pickupContainer = this.querySelector('[data-store-availability-container]');
    
    if (!pickupContainer) return;

    if (window.Shopify && Shopify.StoreAvailability) {
      new Shopify.StoreAvailability(pickupContainer);
    }

    initDrawerOpenButtons();

    bindDrawerCloseButtons();

    const pickup_drawer = document.querySelector('.pickup_availability_drawer');
    if (pickup_drawer) {
      pickup_drawer.addEventListener("click", (event) => {
        if (event.target === pickup_drawer) {          
            closeDrawer(pickup_drawer);
            RemoveScrollLock();          
        }
      });

      pickup_drawer.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {          
            closeDrawer(pickup_drawer);
            RemoveScrollLock();          
        }
      });
    }    
  }

  restoreFocus(signature) {
    if (!signature) return;

    let target = null;

    if (signature.id) {
      target = this.querySelector(`#${CSS.escape(signature.id)}`);
    }

    if (!target && signature.name) {
      target = this.querySelector(
        `[name="${CSS.escape(signature.name)}"][value="${CSS.escape(signature.value ?? "")}"]`
      );
    }

    if (!target && signature.dataset) {
      for (const [key, val] of Object.entries(signature.dataset)) {
        target = this.querySelector(`[data-${key}="${CSS.escape(val)}"]`);
        if (target) break;
      }
    }

    if (target && typeof target.focus === "function") {
      target.focus({ preventScroll: true });
    }
  }

  updateURL(html) {
    const variantEl = html.querySelector('[data-selected-variant]');
    if (!variantEl) return;

    let variantData;
    try {
      variantData = JSON.parse(variantEl.textContent);
    } catch {
      return;
    }

    if (!variantData?.id) return;

    window.history.replaceState(
      null,
      "",
      `${this.productUrl}?variant=${variantData.id}`
    );

  }

  initializeStickyAddToCart() {
    this.teardownStickyAddToCart();

    this.stickyAddToCart = this.querySelector("[data-sticky-add-to-cart]");
    this.mainAddToCart = this.querySelector("[data-main-add-to-cart]");
    this.variantPickerTarget = this.querySelector("[data-variant-picker-target]");
    this.changeLink = this.querySelector("[data-sticky-change-link]");
    this.footer = document.querySelector(".main_footer_wrapper");

    if (!this.stickyAddToCart || !this.mainAddToCart) return;

    this.changeLink?.addEventListener("click", this.handleStickyChangeClick);
    window.addEventListener("scroll", this.handleStickyVisibility, { passive: true });
    window.addEventListener("resize", this.handleStickyVisibility, { passive: true });
    window.addEventListener("load", this.handleStickyVisibility);

    requestAnimationFrame(() => {
      this.handleStickyVisibility();
    });
  }

  teardownStickyAddToCart() {
    this.changeLink?.removeEventListener("click", this.handleStickyChangeClick);
    window.removeEventListener("scroll", this.handleStickyVisibility);
    window.removeEventListener("resize", this.handleStickyVisibility);
    window.removeEventListener("load", this.handleStickyVisibility);
  }

  handleStickyVisibility() {
    if (!this.stickyAddToCart || !this.mainAddToCart) return;

    const triggerRect = this.mainAddToCart.getBoundingClientRect();
    const stickyHeight = this.stickyAddToCart.offsetHeight || 0;
    const stickyStyles = window.getComputedStyle(this.stickyAddToCart);
    const stickyBottomOffset = parseFloat(stickyStyles.bottom) || 0;
    const stickyTopEdge = window.innerHeight - stickyBottomOffset - stickyHeight;
    const footerRect = this.footer?.getBoundingClientRect();
    const footerOverlapsSticky =
      footerRect && footerRect.top <= stickyTopEdge;
    const shouldShow =
      triggerRect.bottom <= Math.min(stickyHeight * 0.35, 40) && !footerOverlapsSticky;

    this.stickyAddToCart.classList.toggle("is-visible", shouldShow);
    this.stickyAddToCart.setAttribute("aria-hidden", shouldShow ? "false" : "true");
  }

  handleStickyChangeClick(e) {
    if (!this.variantPickerTarget) return;

    e.preventDefault();

    const topOffset = this.getStickyScrollOffset();
    const targetTop =
      this.variantPickerTarget.getBoundingClientRect().top + window.scrollY - topOffset;

    window.scrollTo({
      top: Math.max(targetTop, 0),
      behavior: "smooth",
    });
  }

  getStickyScrollOffset() {
    const rootStyles = getComputedStyle(document.documentElement);
    const cssHeaderHeight = parseFloat(rootStyles.getPropertyValue("--header-height")) || 0;
    const stickyHeaderSelectors = [
      ".shopify-section-group-header-group",
      ".main-header-section",
      "main-header",
    ];

    const stickyHeaderHeight = stickyHeaderSelectors.reduce((maxHeight, selector) => {
      const element = document.querySelector(selector);
      if (!element) return maxHeight;

      const rect = element.getBoundingClientRect();
      const isPinnedToTop = rect.top <= 0 && rect.bottom > 0;

      if (!isPinnedToTop) return maxHeight;

      return Math.max(maxHeight, rect.height);
    }, 0);

    return Math.max(cssHeaderHeight, stickyHeaderHeight) + 24;
  }
}

customElements.define("main-product", MainProduct);


// VIDEO ALT TAG
document.addEventListener('DOMContentLoaded', () => {
  const videos = document.querySelectorAll('video');
  if (videos.length) {
    videos.forEach((video) => {
      const img = video.querySelector('img');
      if (!img) return;
      img.setAttribute('alt', 'Video preview image')
    })
  }
})


// PRODUCT MEDIA
class ProductMediaDesktop extends HTMLElement {
  constructor() {
    super();

    this.videos = this.querySelectorAll('video');
    this.externalYoutubeVideos = this.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]');
    this.externalVimeoVideos = this.querySelectorAll('iframe[src*="vimeo.com"]');
    this.models = this.querySelectorAll('product-model');
  }

  connectedCallback() {
    if (this.videos.length) {
      this.videos.forEach((video) => {
        video.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleVideoClick(video);
        })
      })
    }

    if (this.externalYoutubeVideos.length) {
      this.externalYoutubeVideos.forEach((externalYoutubeVideo) => {
        externalYoutubeVideo.nextElementSibling.addEventListener('click', () => {
          externalYoutubeVideo.nextElementSibling.style.pointerEvents = 'none';
          this.handleYoutubeVideoClick(externalYoutubeVideo);
        })
      })
    }

    if (this.externalVimeoVideos.length) {
      this.externalVimeoVideos.forEach((externalVimeoVideo) => {
        externalVimeoVideo.nextElementSibling.addEventListener('click', () => {
          externalVimeoVideo.nextElementSibling.style.pointerEvents = 'none';
          this.handleVimeoVideoClick(externalVimeoVideo);
        })
      })
    }

    if (this.models.length) {
      this.models.forEach((model) => {
        model.addEventListener('mouseenter', () => {
          lenis.stop();
          document.documentElement.style.overflow = 'auto';
        })

        model.addEventListener('mouseleave', () => {
          lenis.start();
          document.documentElement.style.overflow = 'unset';
        })

        model.addEventListener('click', () => this.handleProductModelClick(model));
      })
    }
  }

  handleVideoClick(video) {
    this.pauseAllMedia(video);
    video.nextElementSibling.classList.add('fade_out');
    if (video.paused) {
      video.play();
      video.nextElementSibling.classList.add('fade_out');
    } else {
      video.pause();
      video.nextElementSibling.classList.remove('fade_out');
    }
  }

  handleYoutubeVideoClick(externalYoutubeVideo) {
    this.pauseAllMedia(externalYoutubeVideo);
    externalYoutubeVideo.contentWindow.postMessage(
      JSON.stringify({ event: "command", func: "playVideo", args: [] }),
      "*"
    );
  }

  handleVimeoVideoClick(externalVimeoVideo) {
    this.pauseAllMedia(externalVimeoVideo);
    externalVimeoVideo.contentWindow.postMessage(
      { method: "play" },
      "*"
    );
  }

  handleProductModelClick(model) {
    this.pauseAllMedia(model)
  }

  pauseAllMedia(except = null) {
    this.videos.forEach((video) => {
      if (video != except) {
        video.nextElementSibling.classList.remove('fade_out');
        video.pause();
      }
    })

    this.externalYoutubeVideos.forEach((externalYoutubeVideo) => {
      if (externalYoutubeVideo !== except) {
        externalYoutubeVideo.nextElementSibling.style.pointerEvents = 'all';
        externalYoutubeVideo.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
          "*"
        );
      }
    });

    this.externalVimeoVideos.forEach((externalVimeoVideo) => {
      if (externalVimeoVideo !== except) {
        externalVimeoVideo.nextElementSibling.style.pointerEvents = 'all';
        externalVimeoVideo.contentWindow.postMessage({ method: "pause" }, "*");
      }
    });

    this.models.forEach((model) => {
      if (model !== except) {
        const modelViewer = model.querySelector('model-viewer');

        if (!modelViewer) return;
        if (model.modelViewerUI) model.modelViewerUI.pause();
      }
    })
  }
}

customElements.define('product-media-desktop', ProductMediaDesktop);


// PRODUCT MOBILE MEDIA
class ProductMobileMedia extends HTMLElement {
  constructor() {
    super();

    this.videos = this.querySelectorAll('video');
    this.externalYoutubeFrames = this.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]');
    this.externalVimeoFrames = this.querySelectorAll('iframe[src*="vimeo.com"]');
    this.models = this.querySelectorAll('product-model');
  }

  connectedCallback() {
    if (this.videos.length) {
      this.videos.forEach((video) => {
        video.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleVideoClick(video);
        })
      })
    }

    if (this.externalYoutubeFrames.length) {
      this.externalYoutubeFrames.forEach((externalYoutubeFrame) => {
        externalYoutubeFrame.nextElementSibling.addEventListener('click', () => {
          externalYoutubeFrame.nextElementSibling.style.pointerEvents = 'none';
          this.handleYoutubeFrameClick(externalYoutubeFrame);
        })
      })
    }

    if (this.externalVimeoFrames.length) {
      this.externalVimeoFrames.forEach((externalVimeoFrame) => {
        externalVimeoFrame.nextElementSibling.addEventListener('click', () => {
          externalVimeoFrame.nextElementSibling.style.pointerEvents = 'none';
          this.handleVimeoFrameClick(externalVimeoFrame);
        })
      })
    }

    if (this.models.length) {
      this.models.forEach((model) => {
        model.addEventListener('mouseenter', () => {
          lenis.stop();
          document.documentElement.style.overflow = 'auto';
        })

        model.addEventListener('mouseleave', () => {
          lenis.start();
          document.documentElement.style.overflow = 'unset';
        })

        model.addEventListener('click', () => this.handleProductModelClick(model));
      })
    }

    this.mainSwiperEl = this.querySelector('.product_mobile_main_media.swiper');

    const waitForSwiper = () => {
      if (this.mainSwiperEl?.swiperInstance) {
        this.swiper = this.mainSwiperEl.swiperInstance;
        this.initModelControls();
      } else {
        requestAnimationFrame(waitForSwiper);
      }
    };

    waitForSwiper();

  }

  handleVideoClick(video) {
    this.pauseAllMedia(video);
    video.nextElementSibling.classList.add('fade');
    if (video.paused) {
      video.play();
      video.nextElementSibling.classList.add('fade');
    } else {
      video.pause();
      video.nextElementSibling.classList.remove('fade');
    }
  }

  handleYoutubeFrameClick(externalYoutubeFrame) {
    this.pauseAllMedia(externalYoutubeFrame);
    externalYoutubeFrame.contentWindow.postMessage(
      JSON.stringify({ event: "command", func: "playVideo", args: [] }),
      "*"
    );
  }

  handleVimeoFrameClick(externalVimeoFrame) {
    this.pauseAllMedia(externalVimeoFrame);
    externalVimeoFrame.contentWindow.postMessage(
      { method: "play" },
      "*"
    );
  }

  initModelControls() {
    if (!this.models.length) return;

    this.models.forEach((model) => {

      model.addEventListener('touchstart', () => {
        this.disableSwiper();
      });

      model.addEventListener('mousedown', () => {
        this.disableSwiper();
      });

      model.addEventListener('touchend', () => {
        this.enableSwiper();
      });

      model.addEventListener('mouseup', () => {
        this.enableSwiper();
      });

      model.addEventListener('mouseleave', () => {
        this.enableSwiper();
      });

      model.addEventListener('touchstart', () => {
        this.disableSwiper();
        document.body.style.overflow = 'hidden';
      });

      model.addEventListener('touchend', () => {
        this.enableSwiper();
        document.body.style.overflow = '';
      });

      model.addEventListener('wheel', (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, { passive: false });

      model.addEventListener('click', () => this.handleProductModelClick(model));
    });
  }

  handleProductModelClick(model) {
    this.pauseAllMedia(model)
  }

  disableSwiper() {
    if (!this.swiper) return;
    this.swiper.allowTouchMove = false;
  }

  enableSwiper() {
    if (!this.swiper) return;
    this.swiper.allowTouchMove = true;
  }

  pauseAllMedia(except = null) {
    this.videos.forEach((video) => {
      if (video != except) {
        video.nextElementSibling.classList.remove('fade');
        video.pause();
      }
    })

    this.externalYoutubeFrames.forEach((externalYoutubeFrame) => {
      if (externalYoutubeFrame !== except) {
        externalYoutubeFrame.nextElementSibling.style.pointerEvents = 'all';
        externalYoutubeFrame.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
          "*"
        );
      }
    });

    this.externalVimeoFrames.forEach((externalVimeoFrame) => {
      if (externalVimeoFrame !== except) {
        externalVimeoFrame.nextElementSibling.style.pointerEvents = 'all';
        externalVimeoFrame.contentWindow.postMessage({ method: "pause" }, "*");
      }
    });

    this.models.forEach((model) => {
      if (model !== except) {
        const modelViewer = model.querySelector('model-viewer');

        if (!modelViewer) return;
        if (model.modelViewerUI) model.modelViewerUI.pause();
      }
    })
  }
}

customElements.define('product-mobile-media', ProductMobileMedia);


// PRODUCT SLIDER MEDIA
class ProductSliderMedia extends HTMLElement {
  constructor() {
    super();

    this.videos = this.querySelectorAll('video');
    this.externalYoutubeFrames = this.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]');
    this.externalVimeoFrames = this.querySelectorAll('iframe[src*="vimeo.com"]');
    this.models = this.querySelectorAll('product-model');
  }

  connectedCallback() {
    if (this.videos.length) {
      this.videos.forEach((video) => {
        video.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleVideoClick(video);
        })
      })
    }

    if (this.externalYoutubeFrames.length) {
      this.externalYoutubeFrames.forEach((externalYoutubeFrame) => {
        externalYoutubeFrame.nextElementSibling.addEventListener('click', () => {
          externalYoutubeFrame.nextElementSibling.style.pointerEvents = 'none';
          this.handleYoutubeFrameClick(externalYoutubeFrame);
        })
      })
    }

    if (this.externalVimeoFrames.length) {
      this.externalVimeoFrames.forEach((externalVimeoFrame) => {
        externalVimeoFrame.nextElementSibling.addEventListener('click', () => {
          externalVimeoFrame.nextElementSibling.style.pointerEvents = 'none';
          this.handleVimeoFrameClick(externalVimeoFrame);
        })
      })
    }

    if (this.models.length) {
      this.models.forEach((model) => {
        model.addEventListener('mouseenter', () => {
          lenis.stop();
          document.documentElement.style.overflow = 'auto';
        })

        model.addEventListener('mouseleave', () => {
          lenis.start();
          document.documentElement.style.overflow = 'unset';
        })

        model.addEventListener('click', () => this.handleProductModelClick(model));
      })
    }

    this.mainSwiperEl = this.querySelector('.product_mobile_main_media.swiper');

    const waitForSwiper = () => {
      if (this.mainSwiperEl?.swiperInstance) {
        this.swiper = this.mainSwiperEl.swiperInstance;
        this.initModelControls();
      } else {
        requestAnimationFrame(waitForSwiper);
      }
    };

    waitForSwiper();

  }

  handleVideoClick(video) {
    this.pauseAllMedia(video);
    video.nextElementSibling.classList.add('fade');
    if (video.paused) {
      video.play();
      video.nextElementSibling.classList.add('fade');
    } else {
      video.pause();
      video.nextElementSibling.classList.remove('fade');
    }
  }

  handleYoutubeFrameClick(externalYoutubeFrame) {
    this.pauseAllMedia(externalYoutubeFrame);
    externalYoutubeFrame.contentWindow.postMessage(
      JSON.stringify({ event: "command", func: "playVideo", args: [] }),
      "*"
    );
  }

  handleVimeoFrameClick(externalVimeoFrame) {
    this.pauseAllMedia(externalVimeoFrame);
    externalVimeoFrame.contentWindow.postMessage(
      { method: "play" },
      "*"
    );
  }

  initModelControls() {
    if (!this.models.length) return;

    this.models.forEach((model) => {

      model.addEventListener('touchstart', () => {
        this.disableSwiper();
      });

      model.addEventListener('mousedown', () => {
        this.disableSwiper();
      });

      model.addEventListener('touchend', () => {
        this.enableSwiper();
      });

      model.addEventListener('mouseup', () => {
        this.enableSwiper();
      });

      model.addEventListener('mouseleave', () => {
        this.enableSwiper();
      });

      model.addEventListener('touchstart', () => {
        this.disableSwiper();
        document.body.style.overflow = 'hidden';
      });

      model.addEventListener('touchend', () => {
        this.enableSwiper();
        document.body.style.overflow = '';
      });

      model.addEventListener('wheel', (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, { passive: false });

      model.addEventListener('click', () => this.handleProductModelClick(model));
    });
  }

  handleProductModelClick(model) {
    this.pauseAllMedia(model)
  }

  disableSwiper() {
    if (!this.swiper) return;
    this.swiper.allowTouchMove = false;
  }

  enableSwiper() {
    if (!this.swiper) return;
    this.swiper.allowTouchMove = true;
  }

  pauseAllMedia(except = null) {
    this.videos.forEach((video) => {
      if (video != except) {
        video.nextElementSibling.classList.remove('fade');
        video.pause();
      }
    })

    this.externalYoutubeFrames.forEach((externalYoutubeFrame) => {
      if (externalYoutubeFrame !== except) {
        externalYoutubeFrame.nextElementSibling.style.pointerEvents = 'all';
        externalYoutubeFrame.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
          "*"
        );
      }
    });

    this.externalVimeoFrames.forEach((externalVimeoFrame) => {
      if (externalVimeoFrame !== except) {
        externalVimeoFrame.nextElementSibling.style.pointerEvents = 'all';
        externalVimeoFrame.contentWindow.postMessage({ method: "pause" }, "*");
      }
    });

    this.models.forEach((model) => {
      if (model !== except) {
        const modelViewer = model.querySelector('model-viewer');

        if (!modelViewer) return;
        if (model.modelViewerUI) model.modelViewerUI.pause();
      }
    })
  }
}

customElements.define('product-slider-media', ProductSliderMedia);


//QUICK ADD PRODUCT MEDIA
class QuickAddProductMedia extends HTMLElement {
  constructor() {
    super();

    this.videos = this.querySelectorAll('video');
    this.externalYoutubeFrames = this.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]');
    this.externalVimeoFrames = this.querySelectorAll('iframe[src*="vimeo.com"]');
    this.models = this.querySelectorAll('product-model');
  }

  connectedCallback() {
    if (this.videos.length) {
      this.videos.forEach((video) => {
        video.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleVideoClick(video);
        })
      })
    }

    if (this.externalYoutubeFrames.length) {
      this.externalYoutubeFrames.forEach((externalYoutubeFrame) => {
        externalYoutubeFrame.nextElementSibling.addEventListener('click', () => {
          externalYoutubeFrame.nextElementSibling.style.pointerEvents = 'none';
          this.handleYoutubeFrameClick(externalYoutubeFrame);
        })
      })
    }

    if (this.externalVimeoFrames.length) {
      this.externalVimeoFrames.forEach((externalVimeoFrame) => {
        externalVimeoFrame.nextElementSibling.addEventListener('click', () => {
          externalVimeoFrame.nextElementSibling.style.pointerEvents = 'none';
          this.handleVimeoFrameClick(externalVimeoFrame);
        })
      })
    }

    if (this.models.length) {
      this.models.forEach((model) => {
        model.addEventListener('mouseenter', () => {
          lenis.stop();
          document.documentElement.style.overflow = 'auto';
        })

        model.addEventListener('mouseleave', () => {
          lenis.start();
          document.documentElement.style.overflow = 'unset';
        })

        model.addEventListener('click', () => this.handleProductModelClick(model));
      })
    }

    this.mainSwiperEl = this.querySelector('.product_mobile_main_media.swiper');

    const waitForSwiper = () => {
      if (this.mainSwiperEl?.swiperInstance) {
        this.swiper = this.mainSwiperEl.swiperInstance;
        this.initModelControls();
      } else {
        requestAnimationFrame(waitForSwiper);
      }
    };

    waitForSwiper();

  }

  handleVideoClick(video) {
    this.pauseAllMedia(video);
    video.nextElementSibling.classList.add('fade');
    if (video.paused) {
      video.play();
      video.nextElementSibling.classList.add('fade');
    } else {
      video.pause();
      video.nextElementSibling.classList.remove('fade');
    }
  }

  handleYoutubeFrameClick(externalYoutubeFrame) {
    this.pauseAllMedia(externalYoutubeFrame);
    externalYoutubeFrame.contentWindow.postMessage(
      JSON.stringify({ event: "command", func: "playVideo", args: [] }),
      "*"
    );
  }

  handleVimeoFrameClick(externalVimeoFrame) {
    this.pauseAllMedia(externalVimeoFrame);
    externalVimeoFrame.contentWindow.postMessage(
      { method: "play" },
      "*"
    );
  }

  initModelControls() {
    if (!this.models.length) return;

    this.models.forEach((model) => {

      model.addEventListener('touchstart', () => {
        this.disableSwiper();
      });

      model.addEventListener('mousedown', () => {
        this.disableSwiper();
      });

      model.addEventListener('touchend', () => {
        this.enableSwiper();
      });

      model.addEventListener('mouseup', () => {
        this.enableSwiper();
      });

      model.addEventListener('mouseleave', () => {
        this.enableSwiper();
      });

      model.addEventListener('touchstart', () => {
        this.disableSwiper();
        document.body.style.overflow = 'hidden';
      });

      model.addEventListener('touchend', () => {
        this.enableSwiper();
        document.body.style.overflow = '';
      });

      model.addEventListener('wheel', (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, { passive: false });

      model.addEventListener('click', () => this.handleProductModelClick(model));
    });
  }

  handleProductModelClick(model) {
    this.pauseAllMedia(model)
  }

  disableSwiper() {
    if (!this.swiper) return;
    this.swiper.allowTouchMove = false;
  }

  enableSwiper() {
    if (!this.swiper) return;
    this.swiper.allowTouchMove = true;
  }

  pauseAllMedia(except = null) {
    this.videos.forEach((video) => {
      if (video != except) {
        video.nextElementSibling.classList.remove('fade');
        video.pause();
      }
    })

    this.externalYoutubeFrames.forEach((externalYoutubeFrame) => {
      if (externalYoutubeFrame !== except) {
        externalYoutubeFrame.nextElementSibling.style.pointerEvents = 'all';
        externalYoutubeFrame.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
          "*"
        );
      }
    });

    this.externalVimeoFrames.forEach((externalVimeoFrame) => {
      if (externalVimeoFrame !== except) {
        externalVimeoFrame.nextElementSibling.style.pointerEvents = 'all';
        externalVimeoFrame.contentWindow.postMessage({ method: "pause" }, "*");
      }
    });

    this.models.forEach((model) => {
      if (model !== except) {
        const modelViewer = model.querySelector('model-viewer');

        if (!modelViewer) return;
        if (model.modelViewerUI) model.modelViewerUI.pause();
      }
    })
  }
}

customElements.define('quick-add-product-media', QuickAddProductMedia); 


// MOBILE MENU DRAWER
class MobileMenuDrawer extends HTMLElement {
  constructor() {
    super();
    this.handleClick = this.handleClick.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.focusStack = [];
  }

  connectedCallback() {
    this.addEventListener('click', this.handleClick);
    this.addEventListener('keydown', this.handleKeydown);

    // Hide all next pages initially
    this.querySelectorAll('.mobile_menu_next_page').forEach((page) => {
      page.setAttribute('aria-hidden', 'true');
      page.setAttribute('inert', '');
    });

    // Hide all grandchild menus initially
    this.querySelectorAll('.mobile_grandchild_ul').forEach((menu) => {
      menu.setAttribute('aria-hidden', 'true');
      menu.setAttribute('inert', '');
    });
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.handleClick);
    this.removeEventListener('keydown', this.handleKeydown);
  }

  getFocusable(container) {
    return [...container.querySelectorAll(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )].filter((el) => {
      return (
        !el.closest('[inert]') &&
        el.offsetParent !== null && // visible in layout
        getComputedStyle(el).visibility !== 'hidden'
      );
    });
  }

  // -------------------------
  // Focus trap inside opened page
  // -------------------------
  handleKeydown(e) {
    if (e.key !== 'Tab') return;

    const openPage = this.querySelector('.mobile_menu_next_page[open]');

    let focusable = [];

    if (openPage) {
      // Trap ONLY inside opened next page
      focusable = this.getFocusable(openPage);
    } else {
      // Root level trap
      focusable = [
        ...this.querySelectorAll('.drawer_close_btn'),
        ...this.getFocusable(this.querySelector('.mobile_menu_drawer_content_wrapper')),
        ...this.getFocusable(this.querySelector('.mobile_menu_drawer_utitlities_wrapper'))
      ];
    }

    if (!focusable.length) return;

    const currentIndex = focusable.indexOf(document.activeElement);

    // If somehow focus is outside known list, pull it back safely
    if (currentIndex === -1) {
      e.preventDefault();
      focusable[0].focus({ preventScroll: true });
      return;
    }

    // SHIFT + TAB
    if (e.shiftKey) {
      if (currentIndex === 0) {
        e.preventDefault();
        focusable[focusable.length - 1].focus({ preventScroll: true });
      }
      return;
    }

    // TAB forward
    if (currentIndex === focusable.length - 1) {
      e.preventDefault();
      focusable[0].focus({ preventScroll: true });
    }
  }

  resetMenuState() {
    // Close all sliding next pages
    this.querySelectorAll('.mobile_menu_next_page').forEach((page) => {
      page.removeAttribute('open');
      page.setAttribute('aria-hidden', 'true');
      page.setAttribute('inert', '');
    });

    // Close all grandchild accordions
    this.querySelectorAll('.mobile_grandchild_ul').forEach((submenu) => {
      submenu.removeAttribute('open');
      submenu.setAttribute('aria-hidden', 'true');
      submenu.setAttribute('inert', '');
      submenu.style.height = '';
    });

    // Reset all child toggle buttons
    this.querySelectorAll('.mobile_child_li > button').forEach((btn) => {
      btn.setAttribute('aria-expanded', 'false');
    });

    // Clear stored focus history
    this.focusStack = [];
  }

  handleClick(e) {
    const closeBtn = e.target.closest('.drawer_close_btn');
    if (closeBtn) {
      this.resetMenuState();
      return;
    }

    // -------------------------
    // Back button
    // -------------------------
    const backBtn = e.target.closest('.mobile_menu_back_btn button');
    if (backBtn) {
      const currentPage = backBtn.closest('.mobile_menu_next_page');
      if (!currentPage) return;

      currentPage.removeAttribute('open');
      currentPage.setAttribute('aria-hidden', 'true');
      currentPage.setAttribute('inert', '');

      const prev = this.focusStack.pop();
      prev?.focus({ preventScroll: true });

      return;
    }

    // -------------------------
    // Parent → next page
    // -------------------------
    const parentBtn = e.target.closest('.mobile_parent_li > button');
    if (parentBtn) {
      const title = parentBtn.dataset.title;
      if (!title) return;

      const nextPage = this.querySelector(
        `.mobile_menu_next_page[data-title="${CSS.escape(title)}"]`
      );

      if (!nextPage) return;

      this.focusStack.push(parentBtn);

      nextPage.setAttribute('open', '');
      nextPage.setAttribute('aria-hidden', 'false');
      nextPage.removeAttribute('inert');

      const focusable = this.getFocusable(nextPage);
      focusable[0]?.focus({ preventScroll: true });

      return;
    }

    // -------------------------
    // Child → grandchild toggle
    // -------------------------
    const childBtn = e.target.closest('.mobile_child_li > button');
    if (childBtn) {
      const childLi = childBtn.closest('.mobile_child_li');
      const submenu = childLi?.querySelector(':scope > .mobile_grandchild_ul');

      if (!submenu) return;

      const isOpen = submenu.hasAttribute('open');

      // CLOSE
      if (isOpen) {
        submenu.style.height = `${submenu.scrollHeight}px`;

        requestAnimationFrame(() => {
          submenu.style.height = '0px';
        });

        submenu.addEventListener(
          'transitionend',
          () => {
            submenu.removeAttribute('open');
            submenu.setAttribute('aria-hidden', 'true');
            submenu.setAttribute('inert', '');
            submenu.style.height = '';
          },
          { once: true }
        );

        childBtn.setAttribute('aria-expanded', 'false');
        childBtn.focus({ preventScroll: true });
        return;
      }

      // OPEN
      submenu.setAttribute('open', '');
      submenu.setAttribute('aria-hidden', 'false');
      submenu.removeAttribute('inert');
      submenu.style.height = '0px';

      requestAnimationFrame(() => {
        submenu.style.height = `${submenu.scrollHeight}px`;
      });

      submenu.addEventListener(
        'transitionend',
        () => {
          submenu.style.height = 'auto';

          const firstLink = submenu.querySelector('a, button');
          firstLink?.focus({ preventScroll: true });
        },
        { once: true }
      );

      childBtn.setAttribute('aria-expanded', 'true');
    }
  }
}

customElements.define('mobile-menu-drawer', MobileMenuDrawer);


// SCROLL TO TOP
(function initScrollToTop() {
  function bind() {
    const btn = document.getElementById("scroll_to_top_btn");
    if (!btn || btn.dataset.scrollTopInit === "true") return;
    btn.dataset.scrollTopInit = "true";

    function getScrollY() {
      return window.scrollY || document.documentElement.scrollTop || 0;
    }

    function firstSectionEndY() {
      const main = document.getElementById("MainContent");
      const first =
        main?.querySelector(".shopify-section") || main?.firstElementChild;
      if (!first) return null;
      return first.offsetTop + first.offsetHeight;
    }

    function shouldShow() {
      const y = getScrollY();
      const sectionEnd = firstSectionEndY();
      if (sectionEnd === null) return y > 100;
      return y > 100 || y > sectionEnd;
    }

    function update() {
      const show = shouldShow();
      btn.classList.toggle("scroll_to_top_btn--visible", show);
      btn.setAttribute("aria-hidden", show ? "false" : "true");
      if (show) {
        btn.removeAttribute("tabindex");
      } else {
        btn.setAttribute("tabindex", "-1");
      }
    }

    btn.addEventListener("click", () => {
      if (typeof lenis !== "undefined" && lenis?.scrollTo) {
        lenis.scrollTo(0);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    window.addEventListener("pageshow", () => {
      requestAnimationFrame(update);
    });
    window.addEventListener("load", update);
    document.addEventListener("shopify:section:load", update);
    document.addEventListener("shopify:section:reorder", update);

    update();
    requestAnimationFrame(() => {
      update();
      requestAnimationFrame(update);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();


// PRODUCT RECOMMENDATIONS
class ProductRecommendations extends HTMLElement {
  constructor() {
    super();
    this.productId = this.dataset.productId;
    this.sectionId = this.dataset.sectionId;
    this.recommendedURL = this.dataset.url;
    this.type = this.dataset.type || "related";

    this.observer = new IntersectionObserver(this.handleObserver, {
      rootMargin: "0px 0px 1000px 0px", // load 1000px before visible
      threshold: 0.01,
    });
  }

  connectedCallback() {
    this.observer.observe(this);
  }

  disconnectedCallback() {
    this.observer.disconnect();
  }

  handleObserver = (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        this.observer.disconnect();

        requestAnimationFrame(() => {
          this.loadRecommendedProducts(
            this.recommendedURL,
            this.productId,
            this.sectionId
          );
        });
      }
    });
  };

  loadRecommendedProducts(recommendedURL, productId, sectionId) {
    fetch(`${recommendedURL}&product_id=${productId}&section_id=${sectionId}`)
      .then((response) => response.text())
      .then((data) => {
        const html = document.createElement("div");
        html.innerHTML = data;

        const recommendedProducts = html.querySelector(
          "product-recommendations"
        );

        if (recommendedProducts?.innerHTML.trim().length) {
          this.innerHTML = recommendedProducts.innerHTML;

          this.productsInner =
            this.querySelector(".product_recommendations_inner") ||
            this.querySelector(".complementary_products_inner");

          document.dispatchEvent(
            new CustomEvent("product-recommendations-updated")
          );
        }
      });
  }
}

customElements.define("product-recommendations", ProductRecommendations);


// PRODUCT TABS
class ProductTabs extends HTMLElement {
  constructor() {
    super();
    this.headings = this.querySelectorAll(".product_tabs_heading");
    this.contents = this.querySelectorAll(".product_tabs_content");
  }

  connectedCallback() {
    if (this.headings.length && this.contents.length) {
      this.headings.forEach((heading) => {
        heading.addEventListener("click", () => {
          const id = heading.dataset.tabId;
          
          // Remove is_active from all headings
          this.headings.forEach((h) => h.classList.remove('is_active'));
          
          // Add is_active to clicked heading
          heading.classList.add('is_active');
          
          // Update contents
          this.contents.forEach((content) => {
            if (id == content.dataset.tabId) {
              content.classList.add('is_active');
            } else {
              content.classList.remove('is_active');
            }
          });
        });
      });

    }
  }
}

customElements.define("product-tabs", ProductTabs);


// GIFT CARD RECIPIENT FORM
if (!customElements.get("giftcard-recipient-form")) {
  customElements.define(
    "giftcard-recipient-form",
    class GiftcardRecipientForm extends HTMLElement {
      constructor() {
        super();
        this.checkbox = this.querySelector(
          `#Recipient_checkbox--${this.dataset.sectionId}`,
        );
        this.checkbox.disabled = false;
        this.hiddenControls = this.querySelector(
          `#Recipient_control--${this.dataset.sectionId}`,
        );
        this.wrapper = this.querySelector(".giftcard_recipients_input_wrapper");
        this.inner = this.wrapper.querySelector(".giftcard_recipients_input_inner");
        this.hiddenControls.disabled = true;

        this.emailInput = this.querySelector(
          `#Recipient_email--${this.dataset.sectionId}`,
        );
        this.nameInput = this.querySelector(
          `#Recipient_name--${this.dataset.sectionId}`,
        );
        this.messageInput = this.querySelector(
          `#Recipient_message--${this.dataset.sectionId}`,
        );
        this.sendonInput = this.querySelector(
          `#Recipient_send_on--${this.dataset.sectionId}`,
        );
        this.offsetProperty = this.querySelector(
          `#Recipient_timezone_offset--${this.dataset.sectionId}`,
        );
        if (this.offsetProperty)
          this.offsetProperty.value = new Date().getTimezoneOffset().toString();

        this.currentProductVariantId = this.dataset.variantId;
        this.addEventListener("change", this.onChange.bind(this));
      }

      connectedCallback() {
        const height = this.inner.clientHeight;
        this.wrapper.style.setProperty("--height", `${height}px`);
      }

      onChange() {
        if (this.checkbox.checked) {
          this.wrapper.setAttribute("open", "");
        } else {
          this.wrapper.removeAttribute("open");
        }
      }
    },
  );
}


// INFINITE SCROLL
class InfiniteScroll extends HTMLElement {
  constructor() {
    super();
    this.button = this.querySelector("button");
    this.sectionId = this.dataset.sectionId;

    this.isLoading = false;
  }

  connectedCallback() {
    if (!this.button) return;

    this.button.addEventListener("click", () => {
      this.loadProducts();
    });
  }

  loadProducts() {
    const nextUrl = this.button.dataset.nextUrl;
    if (!nextUrl) return;

    if (this.isLoading) return;

    this.isLoading = true;
    this.showLoader();

    const url = new URL(nextUrl, window.location.origin);
    url.searchParams.set("sections", this.sectionId);

    this.updatePage(url, this.sectionId);
  }

  updatePage(url, id) {    
    fetch(url.toString())
      .then((res) => res.json())
      .then((htmlString) => {
        const temp = document.createElement("div");
        temp.innerHTML = htmlString[id];

        const newWrapper = temp.querySelector(".main_collection_product_grid");
        const oldWrapper = document.querySelector(".main_collection_product_grid");

        if (oldWrapper && newWrapper) {
          const newItems = newWrapper.querySelectorAll(
            ".main_product_card_wrapper",
          );

          if (!newItems.length) {
            this.button.remove();
            return;
          }

          newItems.forEach((item) => {
            item.dataset.revealed = "false";
            oldWrapper.appendChild(item);
          });

          if (window.scrollReveal) {
            const revealItems = Array.from(newItems)
              .map((item) => item.querySelector(".reveal.stagger"))
              .filter(Boolean);

            scrollReveal.staggerBatch(revealItems);
          }          

          const newButton = temp.querySelector("infinite-scroll button");
          if (newButton && newButton?.dataset.nextUrl) {
            this.button.dataset.nextUrl = newButton.dataset.nextUrl;
          } else {
            this.button.remove();
          }
        }

        document.dispatchEvent(
          new CustomEvent("collection-grid-update", {
            detail: {
              url: url,
              sectionId: this.sectionId,
            },
          }),
        );
      })
      .catch((err) => {
        console.error("Error: ", err);
      })
      .finally(() => {
        this.hideLoader();
        this.isLoading = false;
      });
  }

  showLoader() {
    const text = this.button.querySelector(".load_more_text");
    const loader = this.button.querySelector(".pagination_loader");

    if (!text && !loader) return;

    text.classList.add("hidden");
    loader.classList.remove("hidden");
  }

  hideLoader() {
    const text = this.button.querySelector(".load_more_text");
    const loader = this.button.querySelector(".pagination_loader");

    if (!text && !loader) return;

    text.classList.remove("hidden");
    loader.classList.add("hidden");
  }  
}

customElements.define("infinite-scroll", InfiniteScroll);



// PRODUCT CARD SWATCHES
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const swatch = e.target.closest('.pc_swatch, .pc_swatch_label');
  if (!swatch || swatch.classList.contains('disabled')) return;
  e.preventDefault();
  swatch.click();
});

document.addEventListener('click', (e) => {
  const swatch = e.target.closest('.pc_swatch, .pc_swatch_label');
  if (!swatch || swatch.classList.contains('disabled')) return;

  const card = swatch.closest('.product_card_wrapper');
  if (!card) return;

  card.querySelectorAll('.pc_swatch, .pc_swatch_label').forEach((s) => s.classList.remove('pc_swatch--active'));
  swatch.classList.add('pc_swatch--active');

  // Swap image only when the swatch carries a variant image
  if (!swatch.dataset.image) return;

  const img = card.querySelector('.main_pc_image');
  if (!img) return;

  if (!img.dataset.pcOriginalSrc) {
    img.dataset.pcOriginalSrc = img.currentSrc || img.src;
  }

  clearTimeout(img._pcSwapTimer);
  img.style.opacity = '0';

  img._pcSwapTimer = setTimeout(() => {
    img.src = swatch.dataset.image;
    img.srcset = '';
    img.style.opacity = '1';
  }, 250);
});