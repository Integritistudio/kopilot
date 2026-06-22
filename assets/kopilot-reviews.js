class KopilotReviews {
  constructor(root) {
    this.root = root;
    this.list = root.querySelector('[data-reviews-list]');
    this.pagination = root.querySelector('[data-reviews-pagination]');
    this.sort = root.querySelector('[data-reviews-sort]');
    this.perPage = Number(root.dataset.reviewsPerPage) || 5;
    this.currentPage = 1;
    this.items = [];

    if (!this.list) return;

    this.refreshItems();
    this.bindEvents();
    this.applySort();
    this.applyPagination();
  }

  refreshItems() {
    this.items = Array.from(this.list.querySelectorAll('[data-review-item]'));
  }

  bindEvents() {
    this.sort?.addEventListener('change', () => {
      this.currentPage = 1;
      this.applySort();
      this.applyPagination();
    });

    this.pagination?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-page]');
      if (!button || button.disabled) return;

      event.preventDefault();

      const page = button.dataset.page;
      if (page === 'prev') {
        this.currentPage = Math.max(1, this.currentPage - 1);
      } else if (page === 'next') {
        this.currentPage = Math.min(this.totalPages, this.currentPage + 1);
      } else if (page === 'last') {
        this.currentPage = this.totalPages;
      } else {
        this.currentPage = Number(page);
      }

      this.applyPagination();
    });
  }

  parseDate(value) {
    if (!value) return 0;
    const parts = value.split('/');
    if (parts.length !== 3) return 0;
    const month = Number(parts[0]);
    const day = Number(parts[1]);
    const year = Number(parts[2]);
    return new Date(year, month - 1, day).getTime();
  }

  applySort() {
    const mode = this.sort?.value || 'recent';

    this.refreshItems();

    this.items.sort((a, b) => {
      const ratingA = Number(a.dataset.rating) || 0;
      const ratingB = Number(b.dataset.rating) || 0;
      const dateA = this.parseDate(a.dataset.date);
      const dateB = this.parseDate(b.dataset.date);
      const orderA = Number(a.dataset.order) || 0;
      const orderB = Number(b.dataset.order) || 0;

      switch (mode) {
        case 'oldest':
          return dateA - dateB || orderA - orderB;
        case 'highest':
          return ratingB - ratingA || dateB - dateA;
        case 'lowest':
          return ratingA - ratingB || dateB - dateA;
        default:
          return dateB - dateA || orderA - orderB;
      }
    });

    this.items.forEach((item) => this.list.appendChild(item));
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this.items.length / this.perPage));
  }

  applyPagination() {
    this.refreshItems();

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    const start = (this.currentPage - 1) * this.perPage;
    const end = start + this.perPage;

    this.items.forEach((item, index) => {
      if (index >= start && index < end) {
        item.removeAttribute('hidden');
      } else {
        item.setAttribute('hidden', '');
      }
    });

    this.renderPagination();
  }

  renderPagination() {
    if (!this.pagination) return;

    if (this.totalPages <= 1) {
      this.pagination.innerHTML = '';
      this.pagination.setAttribute('hidden', '');
      return;
    }

    this.pagination.removeAttribute('hidden');

    const pages = Array.from({ length: this.totalPages }, (_, index) => {
      const pageNumber = index + 1;
      const isCurrent = pageNumber === this.currentPage;
      return `<button type="button" class="kopilot-reviews__page${isCurrent ? ' is-current' : ''}" data-page="${pageNumber}" aria-label="Page ${pageNumber}"${isCurrent ? ' aria-current="page"' : ''}>${pageNumber}</button>`;
    }).join('');

    const prevButton =
      this.currentPage > 1
        ? `<button type="button" class="kopilot-reviews__page-nav" data-page="prev" aria-label="Previous page">
        <svg width="10" height="16" viewBox="0 0 10 16" fill="none" aria-hidden="true"><path d="M8 2L2 8L8 14" stroke="currentColor" stroke-width="2"/></svg>
      </button>`
        : '';

    this.pagination.innerHTML = `
      ${prevButton}
      ${pages}
      <button type="button" class="kopilot-reviews__page-nav" data-page="next" aria-label="Next page"${this.currentPage === this.totalPages ? ' disabled' : ''}>
        <svg width="10" height="16" viewBox="0 0 10 16" fill="none" aria-hidden="true"><path d="M2 2L8 8L2 14" stroke="currentColor" stroke-width="2"/></svg>
      </button>
      <button type="button" class="kopilot-reviews__page-nav kopilot-reviews__page-nav--last" data-page="last" aria-label="Last page"${this.currentPage === this.totalPages ? ' disabled' : ''}>
        <svg width="18" height="16" viewBox="0 0 18 16" fill="none" aria-hidden="true">
          <path d="M2 2L8 8L2 14" stroke="currentColor" stroke-width="2"/>
          <path d="M10 2H12V14H10V2Z" fill="currentColor"/>
        </svg>
      </button>
    `;
  }
}

function initKopilotReviews(root) {
  if (!root || root.dataset.reviewsInitialized === 'true') return;
  root.dataset.reviewsInitialized = 'true';
  new KopilotReviews(root);
}

function initAllKopilotReviews(scope = document) {
  scope.querySelectorAll('[data-kopilot-reviews]').forEach(initKopilotReviews);
}

document.addEventListener('DOMContentLoaded', () => {
  initAllKopilotReviews();
});

document.addEventListener('shopify:section:load', (event) => {
  const section = event.target;
  const root = section.matches('[data-kopilot-reviews]')
    ? section
    : section.querySelector('[data-kopilot-reviews]');

  if (root) {
    delete root.dataset.reviewsInitialized;
    initKopilotReviews(root);
  }
});

document.addEventListener('shopify:section:unload', (event) => {
  const section = event.target;
  const root = section.matches('[data-kopilot-reviews]')
    ? section
    : section.querySelector('[data-kopilot-reviews]');

  if (root) {
    delete root.dataset.reviewsInitialized;
  }
});
