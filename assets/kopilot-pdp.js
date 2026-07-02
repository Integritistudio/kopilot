class KopilotPdp extends HTMLElement {
  constructor() {
    super();
    this.isSubmitting = false;
    this.selectedQty = 1;
  }

  connectedCallback() {
    this.productId = Number(this.dataset.productId);
    this.variantId = Number(this.dataset.variantId);
    this.tierButtons = this.querySelectorAll('[data-kopilot-tier]');
    this.addButton = this.querySelector('[data-kopilot-add]');
    this.addLabel = this.querySelector('[data-kopilot-add-label]');
    this.accordionTrigger = this.querySelector('[data-kopilot-accordion-trigger]');
    this.accordionPanel = this.querySelector('[data-kopilot-accordion-panel]');
    this.carousel = this.querySelector('[data-kopilot-carousel]');
    this.carouselTrack = this.querySelector('[data-kopilot-carousel-track]');
    this.carouselDots = this.querySelectorAll('[data-kopilot-carousel-dot]');
    this.deliveryOrder = this.querySelector('[data-kopilot-delivery-order]');
    this.deliveryArrives = this.querySelector('[data-kopilot-delivery-arrives]');

    this.bindTiers();
    this.bindAccordion();
    this.bindCarousel();
    this.bindAddToCart();
    this.updateDeliveryEstimate();

    const defaultTier = this.querySelector('[data-kopilot-tier][data-selected="true"]');
    if (defaultTier) {
      this.selectTier(defaultTier);
    }
  }

  bindTiers() {
    this.tierButtons.forEach((button) => {
      button.addEventListener('click', () => this.selectTier(button));
    });
  }

  selectTier(button) {
    this.tierButtons.forEach((tier) => {
      tier.classList.remove('is-selected');
      tier.setAttribute('aria-pressed', 'false');
    });

    button.classList.add('is-selected');
    button.setAttribute('aria-pressed', 'true');
    this.selectedQty = parseInt(button.dataset.quantity || '1', 10);
    if (Number.isNaN(this.selectedQty) || this.selectedQty < 1) {
      this.selectedQty = 1;
    }

    if (button.dataset.variantId) {
      this.variantId = Number(button.dataset.variantId);
    }

    const clickedIndex = Array.from(this.tierButtons).indexOf(button);
    const includedLists = this.querySelectorAll('[data-kopilot-included-pills]');
    includedLists.forEach((list) => {
      const listIndex = Number(list.dataset.tierIndex);
      if (listIndex === clickedIndex) {
        list.style.display = 'flex';
      } else {
        list.style.display = 'none';
      }
    });

    this.updateButtonLabel();
  }

  updateButtonLabel() {
    if (!this.addLabel) return;

    const quantity = Number.isNaN(this.selectedQty) ? 1 : this.selectedQty;
    const defaultLabel = this.dataset.defaultButtonLabel || 'ADD TO CART - 1 TAG';

    this.addLabel.textContent = quantity === 1
      ? defaultLabel
      : `ADD TO CART - SET OF ${quantity}`;
  }

  bindAccordion() {
    if (!this.accordionTrigger || !this.accordionPanel) return;

    this.accordionTrigger.addEventListener('click', () => {
      const isOpen = this.accordionPanel.hidden;
      this.accordionPanel.hidden = !isOpen;
      this.accordionTrigger.classList.toggle('is-open', isOpen);
      this.accordionTrigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  bindCarousel() {
    if (!this.carouselTrack || !this.carouselDots.length) return;

    const slides = this.carouselTrack.querySelectorAll('[data-kopilot-slide]');
    if (!slides.length) return;

    let activeIndex = 0;

    const goTo = (index) => {
      activeIndex = index;
      this.carouselTrack.style.transform = `translateX(-${index * 100}%)`;
      this.carouselDots.forEach((dot, dotIndex) => {
        dot.classList.toggle('is-active', dotIndex === index);
        dot.setAttribute('aria-current', dotIndex === index ? 'true' : 'false');
      });
    };

    this.carouselDots.forEach((dot) => {
      dot.addEventListener('click', () => {
        goTo(Number(dot.dataset.index || 0));
      });
    });

    let startX = 0;
    let deltaX = 0;

    this.carouselTrack.addEventListener('touchstart', (event) => {
      startX = event.touches[0].clientX;
      deltaX = 0;
    }, { passive: true });

    this.carouselTrack.addEventListener('touchmove', (event) => {
      deltaX = event.touches[0].clientX - startX;
    }, { passive: true });

    this.carouselTrack.addEventListener('touchend', () => {
      if (Math.abs(deltaX) < 40) return;
      if (deltaX < 0 && activeIndex < slides.length - 1) goTo(activeIndex + 1);
      if (deltaX > 0 && activeIndex > 0) goTo(activeIndex - 1);
    });
  }

  updateDeliveryEstimate() {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setHours(14, 0, 0, 0);

    const orderBy = now < cutoff ? cutoff : new Date(cutoff.getTime() + 24 * 60 * 60 * 1000);
    const arrives = new Date(now);
    arrives.setDate(arrives.getDate() + (now < cutoff ? 3 : 4));

    const timeFormatter = new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
    const dateFormatter = new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    if (this.deliveryOrder) {
      this.deliveryOrder.textContent = timeFormatter.format(orderBy);
    }
    if (this.deliveryArrives) {
      this.deliveryArrives.textContent = dateFormatter.format(arrives);
    }
  }

  bindAddToCart() {
    if (!this.addButton) return;

    this.addButton.addEventListener('click', () => this.handleAddToCart());
  }

  async handleAddToCart() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.addButton.setAttribute('disabled', 'disabled');
    this.addButton.setAttribute('aria-busy', 'true');
    this.addButton.classList.add('is-loading');

    try {
      const cart = await fetch(`${Shopify.routes.root}cart.js`).then((response) => response.json());
      const selectedQty = Number.isNaN(parseInt(this.selectedQty, 10)) || parseInt(this.selectedQty, 10) < 1
        ? 1
        : parseInt(this.selectedQty, 10);

      // Check if all tiers use the same variant ID (single variant setup)
      const variantIds = Array.from(this.tierButtons).map(btn => btn.dataset.variantId).filter(Boolean);
      const isSingleVariantSetup = new Set(variantIds).size <= 1;
      const quantityToAdd = isSingleVariantSetup ? selectedQty : 1;

      // Find any existing line item for this product in the cart
      const existingLine = cart.items.find((item) => item.product_id === this.productId);

      let addResponse;
      if (existingLine) {
        // Remove the existing line item first
        await fetch(`${Shopify.routes.root}cart/change.js`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify({
            id: existingLine.key,
            quantity: 0,
          }),
        });
      }

      // Add the selected variant to the cart
      addResponse = await fetch(`${Shopify.routes.root}cart/add.js`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          id: this.variantId,
          quantity: quantityToAdd,
        }),
      });

      const addData = await addResponse.json();
      if (!addResponse.ok) {
        throw addData;
      }

      if (this.addLabel) {
        this.addLabel.textContent = 'ADDED';
        setTimeout(() => {
          if (this.addLabel.textContent === 'ADDED') {
            this.updateButtonLabel();
          }
        }, 2000);
      }

      const sections = await fetch(
        `${Shopify.routes.root}?sections=cart-drawer,cart,cart-bubble`,
      ).then((response) => response.json());

      document.dispatchEvent(
        new CustomEvent('cart-updated', {
          detail: { sections },
          bubbles: true,
        }),
      );

      const cartDrawer = document.querySelector('cart-drawer');
      if (typeof openDrawer === 'function' && cartDrawer) {
        openDrawer(cartDrawer, this.addButton);
      }
    } catch (error) {
      const message = error?.description || error?.message || 'Unable to add to cart.';
      window.alert(message);
    } finally {
      this.isSubmitting = false;
      this.addButton.removeAttribute('disabled');
      this.addButton.removeAttribute('aria-busy');
      this.addButton.classList.remove('is-loading');
    }
  }
}

if (!customElements.get('kopilot-pdp')) {
  customElements.define('kopilot-pdp', KopilotPdp);
}
