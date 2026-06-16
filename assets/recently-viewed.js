/**
 * Recently viewed products: reads handles from localStorage (see scripts.js),
 * fetches product JSON, renders markup aligned with snippets/product-card.liquid.
 */
const RECENTLY_VIEWED_STORAGE_KEY = "elevate-recently-viewed-handles";
const RECENTLY_VIEWED_MAX_STORED = 24;

function recordCurrentProductHandleToStorage() {
  try {
    const path = window.location.pathname;
    const i = path.indexOf("/products/");
    if (i === -1) return;
    const raw = path.slice(i + "/products/".length).split("/")[0];
    if (!raw) return;
    const handle = decodeURIComponent(raw);
    let list = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY) || "[]");
    if (!Array.isArray(list)) list = [];
    list = list.filter((h) => h !== handle);
    list.unshift(handle);
    localStorage.setItem(
      RECENTLY_VIEWED_STORAGE_KEY,
      JSON.stringify(list.slice(0, RECENTLY_VIEWED_MAX_STORED)),
    );
  } catch {
    /* ignore */
  }
}

const ICON_CART = `<svg width="19" height="20" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M14.85 19.25H4.125C1.85625 19.25 0 17.3937 0 15.125V14.9875L0.4125 3.9875C0.48125 1.71875 2.3375 0 4.5375 0H14.4375C16.6375 0 18.4938 1.71875 18.5625 3.9875L18.975 14.9875C19.0438 16.0875 18.6313 17.1187 17.875 17.9438C17.1188 18.7688 16.0875 19.25 14.9875 19.25C14.9875 19.25 14.9187 19.25 14.85 19.25ZM4.5375 1.375C3.025 1.375 1.85625 2.54375 1.7875 3.9875L1.375 15.125C1.375 16.6375 2.6125 17.875 4.125 17.875H14.9875C15.7438 17.875 16.4312 17.5312 16.9125 16.9813C17.3938 16.4312 17.6688 15.7437 17.6688 14.9875L17.2563 3.9875C17.1875 2.475 16.0188 1.375 14.5063 1.375H4.5375Z" fill="currentColor"/><path d="M9.4873 8.25C6.80605 8.25 4.6748 6.11875 4.6748 3.4375C4.6748 3.025 4.9498 2.75 5.3623 2.75C5.7748 2.75 6.0498 3.025 6.0498 3.4375C6.0498 5.3625 7.5623 6.875 9.4873 6.875C11.4123 6.875 12.9248 5.3625 12.9248 3.4375C12.9248 3.025 13.1998 2.75 13.6123 2.75C14.0248 2.75 14.2998 3.025 14.2998 3.4375C14.2998 6.11875 12.1686 8.25 9.4873 8.25Z" fill="currentColor"/></svg>`;

const ICON_EYE = `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M11 17.875C3.80308 17.875 0.234953 11.6009 0.086625 11.334C-0.028875 11.1262 -0.028875 10.8737 0.086625 10.6659C0.234953 10.3991 3.80308 4.125 11 4.125C18.1969 4.125 21.765 10.3991 21.9134 10.666C22.0289 10.8738 22.0289 11.1263 21.9134 11.3341C21.765 11.6009 18.1969 17.875 11 17.875ZM1.49652 10.999C2.3143 12.2384 5.52509 16.5 11 16.5C16.4923 16.5 19.6888 12.2418 20.5035 11.001C19.6857 9.76164 16.4749 5.5 11 5.5C5.50773 5.5 2.3112 9.7582 1.49652 10.999ZM11 15.125C8.72541 15.125 6.875 13.2746 6.875 11C6.875 8.72541 8.72541 6.875 11 6.875C13.2746 6.875 15.125 8.72541 15.125 11C15.125 13.2746 13.2746 15.125 11 15.125ZM11 8.25C9.48372 8.25 8.25 9.48372 8.25 11C8.25 12.5163 9.48372 13.75 11 13.75C12.5163 13.75 13.75 12.5163 13.75 11C13.75 9.48372 12.5163 8.25 11 8.25Z" fill="currentColor"/></svg>`;

const CORNER_SVG_TOP = `<svg class="corner-svg-top" width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" style="scale: 1;"><path fill="rgb(var(--background-color))" d="M24.0033 24H0C18.9005 23.8195 23.8918 18.3064 24.0033 0V24Z" style="fill: red;"></path></svg>`;

const CORNER_SVG_BOTTOM = `<svg class="corner-svg-bottom" width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg" style="scale: 1;"><path fill="rgb(var(--background-color))" d="M24.0033 24H0C18.9005 23.8195 23.8918 18.3064 24.0033 0V24Z" style="fill: red;"></path></svg>`;

function getRecentlyViewedHandles() {
  try {
    const list = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY) || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function getCurrentProductHandleFromPath() {
  const path = window.location.pathname;
  const i = path.indexOf("/products/");
  if (i === -1) return null;
  const raw = path.slice(i + "/products/".length).split("/")[0];
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shopifyRoot() {
  if (typeof Shopify !== "undefined" && Shopify.routes && Shopify.routes.root) {
    return Shopify.routes.root;
  }
  return "/";
}

function formatMoneyCents(cents, currencyCodeEnabled, moneyFormat, moneyWithCurrencyFormat) {
  const fmt = currencyCodeEnabled === "true" ? moneyWithCurrencyFormat : moneyFormat;
  return Shopify.formatMoney(cents, fmt);
}

function firstVariant(product) {
  return product.variants?.[0];
}

function displayVariant(product) {
  return product.variants?.find((v) => v.available) || product.variants?.[0];
}

function normalizeImageSrc(src) {
  if (!src || typeof src !== "string") return null;
  let u = src;
  if (u.startsWith("//")) u = `https:${u}`;
  const sep = u.includes("?") ? "&" : "?";
  return `${u}${sep}width=800`;
}

function imageObjectSrc(img) {
  if (!img) return null;
  if (typeof img === "string") return normalizeImageSrc(img);
  if (typeof img === "object" && img.src) return normalizeImageSrc(img.src);
  return null;
}

function getCardImageUrl(product) {
  const fv = displayVariant(product);
  let url = imageObjectSrc(fv?.featured_image);
  if (!url) url = imageObjectSrc(product.featured_image);
  return url;
}

function aspectRatioPercent(product, aspectSetting) {
  let ratio = 1;
  if (aspectSetting === "portrait") ratio = 0.8;
  else if (aspectSetting === "square") ratio = 1;
  else {
    const fv = displayVariant(product);
    let img = fv?.featured_image || product.featured_image;
    if (img && typeof img === "object" && img.aspect_ratio) ratio = img.aspect_ratio;
    else if (typeof img === "number") ratio = img;
  }
  if (!ratio || ratio <= 0) ratio = 1;
  return (1 / ratio) * 100;
}

class RecentlyViewedProducts extends HTMLElement {
  connectedCallback() {
    this.track = this.querySelector("[data-recently-viewed-track]");
    this.emptyEl = this.querySelector("[data-recently-viewed-empty]");
    this.swiperWrap = this.querySelector(".recently_viewed_swiper_wrap");
    this.load();
  }

  async load() {
    recordCurrentProductHandleToStorage();
    const limit = Math.max(1, Math.min(12, Number(this.dataset.limit) || 8));
    let handles = getRecentlyViewedHandles();
    const current = getCurrentProductHandleFromPath();
    handles = handles.filter((h) => h !== current);
    handles = handles.slice(0, limit);

    if (handles.length === 0) {
      this.showEmpty();
      return;
    }

    const root = shopifyRoot();
    const products = [];

    for (const handle of handles) {
      try {
        const res = await fetch(`${root}products/${encodeURIComponent(handle)}.js`);
        if (!res.ok) continue;
        products.push(await res.json());
      } catch {
        /* skip */
      }
    }

    if (products.length === 0) {
      this.showEmpty();
      return;
    }

    if (!this.track) return;

    this.track.innerHTML = products.map((p) => this.buildSlideHtml(p)).join("");
    this.hideEmpty();

    requestAnimationFrame(() => {
      const swiperEl = this.querySelector(".recently_viewed_inner.swiper");
      if (swiperEl?.swiperInstance) {
        swiperEl.swiperInstance.update();
        swiperEl.swiperInstance.slideTo(0, 0);
      }
      document.dispatchEvent(new CustomEvent("collection-grid-update"));
      window.dispatchEvent(new Event("layout:updated"));
    });
  }

  showEmpty() {
    if (this.swiperWrap) this.swiperWrap.setAttribute("hidden", "");
    if (this.emptyEl) {
      this.emptyEl.removeAttribute("hidden");
      this.emptyEl.classList.remove("visually-hidden");
    }
    this.classList.add("is-empty");
  }

  hideEmpty() {
    if (this.swiperWrap) this.swiperWrap.removeAttribute("hidden");
    if (this.emptyEl) {
      this.emptyEl.setAttribute("hidden", "");
      this.emptyEl.classList.add("visually-hidden");
    }
    this.classList.remove("is-empty");
  }

  buildSlideHtml(product) {
    const inner = this.buildProductCardHtml(product);
    return `<div class="related_product_block swiper-slide">${inner}</div>`;
  }

  buildProductCardHtml(product) {
    const root = shopifyRoot();
    const productUrl = product.url?.startsWith("http") ? product.url : `${root}${product.url || ""}`;
    const showBg = this.dataset.showCardBg === "true";
    const cardBg = this.dataset.cardBg || "";
    const cardText = this.dataset.cardText || "";
    const cardAlign = this.dataset.cardAlign || "center";
    const aspectSetting = this.dataset.aspectRatio || "portrait";
    const showQuick = this.dataset.showQuickView === "true";
    const showBadges = this.dataset.showBadges === "true";
    const mobCols = this.dataset.mobCols || "1";

    const ar = aspectRatioPercent(product, aspectSetting);
    const imgStyle = `--aspect-ratio: ${ar}%;${showBg ? ` --card-bg: ${cardBg}; --card-text: ${cardText};` : ""}`;

    const imgUrl = getCardImageUrl(product);
    const imgBlock = imgUrl
      ? `<a aria-label="${escapeHtml(product.title)}" href="${escapeHtml(productUrl)}"><img class="main_pc_image" src="${escapeHtml(imgUrl)}" alt="${escapeHtml(product.title)}" loading="lazy" width="800" height="800" /></a>`
      : this.buildPlaceholder(product, productUrl);

    const badges = showBadges ? this.buildBadges(product, mobCols) : "";
    const customBadges = this.buildCustomBadges(product);
    const quick = showQuick ? this.buildQuickView(product) : "";

    const imgClasses = [
      "product_card_img",
      "ratio",
      showBg ? "has_bg" : "",
      showQuick ? "has_quick_view" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const priceHtml = this.buildPriceHtml(product);

    return `<div class="product_card_wrapper">
  <div class="${imgClasses}" style="${imgStyle}">
    ${imgBlock}
    ${badges}
    ${customBadges}
    ${quick}
  </div>
  <div class="product_card_info pc_info--${escapeHtml(cardAlign)}" style="--text-align: ${escapeHtml(cardAlign)}">
    <h4 class="small-text">
      <a href="${escapeHtml(productUrl)}" aria-label="${escapeHtml(product.title)}" tabindex="-1">${escapeHtml(product.title)}</a>
    </h4>
    ${priceHtml}
  </div>
</div>`;
  }

  buildPlaceholder(product, productUrl) {
    const ph = this.dataset.placeholderUrl || "";
    const alt = escapeHtml(product.title);
    const src = ph || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E";
    return `<a aria-label="${alt}" href="${escapeHtml(productUrl)}"><img class="main_pc_image" src="${escapeHtml(src)}" alt="${alt}" loading="lazy" width="800" height="800" /></a>`;
  }

  buildBadges(product, mobCols) {
    const fv = firstVariant(product);
    if (!fv) return "";
    const pos = this.dataset.badgePosition || "top_left";
    let inner = "";
    if (fv.available === false && fv.inventory_policy === "deny") {
      inner = `<span class="badge_inner badge_sold--out color-${escapeHtml(this.dataset.soldOutBadgeScheme || "")}"><span>${escapeHtml(this.dataset.labelSoldOut || "")}</span></span>`;
    } else if (
      fv.compare_at_price &&
      fv.compare_at_price > fv.price &&
      fv.compare_at_price !== 0
    ) {
      if (this.dataset.saleStyle === "text") {
        inner = `<span class="badge_inner badge_sale color-${escapeHtml(this.dataset.saleBadgeScheme || "")}"><span>${escapeHtml(this.dataset.labelSale || "")}</span></span>`;
      } else {
        const per = Math.round(((fv.compare_at_price - fv.price) / fv.compare_at_price) * 100);
        const offText = (this.dataset.labelOff || "").replace("__P__", String(per));
        inner = `<span class="badge_inner badge_sale color-${escapeHtml(this.dataset.saleBadgeScheme || "")}"><span>${escapeHtml(offText)}</span></span>`;
      }
    }
    if (!inner) return "";
    return `<div class="badge badge--${escapeHtml(pos)} mob_cols_${escapeHtml(mobCols)}">${inner}</div>`;
  }

  buildCustomBadges(product) {
    if (this.dataset.showCustomBadges !== "true") return "";
    const tags = (product.tags || []).filter((t) => String(t).includes("badge_"));
    if (!tags.length) return "";
    const spans = tags
      .map((t) => String(t).split("badge_").pop())
      .map((t) => t.replace(/-/g, " "))
      .map((s) => `<span>${escapeHtml(s)}</span>`)
      .join("");
    const pos = this.dataset.badgePosition || "top_left";
    const cbClass =
      pos === "top_left" || pos === "bottom_left" || pos === "bottom_right"
        ? "cb--top_right"
        : "cb--top_left";
    return `<div class="custom_badge ${cbClass}"><div class="custom_badge_inner color-${escapeHtml(this.dataset.customBadgeScheme || "")}">${spans}</div></div>`;
  }

  buildQuickView(product) {
    const fv = displayVariant(product);
    if (!fv) return "";
    const qv = escapeHtml(this.dataset.labelQuickView || "");
    const qa = escapeHtml(this.dataset.labelQuickAdd || "");
    const cartPair = `<span class="btn_text">${ICON_CART}${ICON_CART}</span>`;
    const eyePair = `<span class="btn_text">${ICON_EYE}${ICON_EYE}</span>`;

    let controls = "";
    if (product.has_only_default_variant) {
      controls = `<product-form>
  <form method="post" action="/cart/add" id="recently-viewed-form-${product.id}" accept-charset="UTF-8" enctype="multipart/form-data" class="form">
    <input type="hidden" name="id" value="${fv.id}" ${fv.available === false ? "disabled" : ""} />
    <input type="hidden" name="quantity" value="1" />
    <button type="submit" aria-label="${qv}" class="product_form_submit_btn" ${fv.available === false ? "disabled" : ""}>
      ${cartPair}
      <span class="loader hidden">.</span>
    </button>
  </form>
</product-form>`;
    } else {
      controls = `<quick-add-button data-product-handle="${escapeHtml(product.handle)}">
  <button type="button" class="quick_add_btn" aria-label="${qa}" data-drawer="quick_add_drawer" ${fv.available === false ? "disabled" : ""}>
    ${eyePair}
    <span class="loader hidden">.</span>
  </button>
</quick-add-button>`;
    }

    return `<div class="quick_view_wrapper">
  ${CORNER_SVG_TOP}
  ${CORNER_SVG_BOTTOM}
  ${controls}
</div>`;
  }

  buildPriceHtml(product) {
    const ccy = this.dataset.currencyCodeEnabled;
    const mf = this.dataset.moneyFormat;
    const mwc = this.dataset.moneyWithCurrencyFormat;
    const fv = displayVariant(product);
    if (!fv) return "";

    if (product.price_varies) {
      const from = formatMoneyCents(product.price_min, ccy, mf, mwc);
      const tpl = this.dataset.fromPriceTemplate || "From [price]";
      const line = tpl.replace("[price]", from);
      return `<div class="product_price_inner"><div class="product_price_inner_main"><span class="product_card_price_varies">${line}</span></div></div>`;
    }

    const price = formatMoneyCents(fv.price, ccy, mf, mwc);
    if (
      fv.compare_at_price &&
      fv.compare_at_price > fv.price &&
      fv.compare_at_price !== 0
    ) {
      const compare = formatMoneyCents(fv.compare_at_price, ccy, mf, mwc);
      return `<div class="product_price_inner"><div class="product_price_inner_main">
        <span class="product_card_price">${price}</span>
        <span class="product_card_cap"><s>${compare}</s></span>
      </div></div>`;
    }

    return `<div class="product_price_inner"><div class="product_price_inner_main"><span class="product_card_price">${price}</span></div></div>`;
  }
}

customElements.define("recently-viewed-products", RecentlyViewedProducts);
