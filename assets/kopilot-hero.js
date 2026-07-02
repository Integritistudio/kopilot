(function () {
  function getScrollOffset() {
    const rootStyles = getComputedStyle(document.documentElement);
    const cssHeaderHeight = parseFloat(rootStyles.getPropertyValue('--header-height')) || 0;
    const header = document.querySelector('.shopify-section-group-header-group');
    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    return Math.max(cssHeaderHeight, headerHeight, 0);
  }

  function scrollToTarget(target) {
    const offset = -getScrollOffset();

    if (typeof window.lenis !== 'undefined' && window.lenis?.scrollTo) {
      window.lenis.scrollTo(target, { offset, duration: 1.2 });
      return;
    }

    const top = target.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
  }

  function resolveHashTarget(href) {
    if (!href || href === '#') return null;

    try {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin || !url.hash) return null;
      const id = decodeURIComponent(url.hash.slice(1));
      return id ? document.getElementById(id) : null;
    } catch (error) {
      if (!href.startsWith('#')) return null;
      const id = decodeURIComponent(href.slice(1));
      return id ? document.getElementById(id) : null;
    }
  }

  function initHeroCta(section) {
    const cta = section.querySelector('.kopilot-hero__cta');
    if (!cta || cta.dataset.kopilotHeroCtaInit === 'true') return;

    cta.dataset.kopilotHeroCtaInit = 'true';

    cta.addEventListener('click', function (event) {
      const href = cta.getAttribute('href');
      const target = resolveHashTarget(href);
      if (!target) return;

      event.preventDefault();
      scrollToTarget(target);

      const hash = href.includes('#') ? href.slice(href.indexOf('#')) : `#${target.id}`;
      if (window.history?.pushState) {
        window.history.pushState(null, '', hash);
      } else {
        window.location.hash = hash;
      }
    });
  }

  function initAll() {
    document.querySelectorAll('.kopilot-hero').forEach(initHeroCta);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', function (event) {
    if (event.target.classList?.contains('kopilot-hero')) {
      initHeroCta(event.target);
    }
  });
})();
