(function () {
  if (!document.body.classList.contains('page-emergency')) return;

  const popup = document.querySelector('[data-em-contact-popup]');
  const overlay = document.querySelector('.em-contact-popup__overlay');
  if (!popup || !overlay) return;

  const openers = document.querySelectorAll('.js-open-contact, [data-em-contact-open]');
  const closers = document.querySelectorAll('[data-em-contact-close]');
  const firstField = popup.querySelector('input, textarea, button');
  let lockedScrollY = 0;

  function lockScroll() {
    lockedScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.classList.add('em-contact-open');
    document.body.style.top = `-${lockedScrollY}px`;
  }

  function unlockScroll() {
    document.body.classList.remove('em-contact-open');
    document.body.style.top = '';
    window.scrollTo(0, lockedScrollY);
  }

  function openPopup(event) {
    if (event) event.preventDefault();
    popup.hidden = false;
    popup.classList.add('is-open');
    popup.setAttribute('aria-hidden', 'false');
    lockScroll();
    window.setTimeout(() => {
      firstField?.focus({ preventScroll: true });
    }, 50);
  }

  function closePopup(event) {
    if (event) event.preventDefault();
    popup.classList.remove('is-open');
    popup.setAttribute('aria-hidden', 'true');
    unlockScroll();
    window.setTimeout(() => {
      if (!popup.classList.contains('is-open')) popup.hidden = true;
    }, 550);
  }

  openers.forEach((el) => {
    el.addEventListener('click', openPopup);
  });

  closers.forEach((el) => {
    el.addEventListener('click', closePopup);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && popup.classList.contains('is-open')) {
      closePopup(event);
    }
  });
})();
