(function () {
  if (!document.body.classList.contains('page-emergency')) return;

  const popup = document.querySelector('[data-em-contact-popup]');
  const overlay = document.querySelector('.em-contact-popup__overlay');
  if (!popup || !overlay) return;

  const openers = document.querySelectorAll('.js-open-contact, [data-em-contact-open]');
  const closers = document.querySelectorAll('[data-em-contact-close]');
  const firstField = popup.querySelector('input, textarea, button');

  function openPopup(event) {
    if (event) event.preventDefault();
    popup.hidden = false;
    popup.classList.add('is-open');
    popup.setAttribute('aria-hidden', 'false');
    document.body.classList.add('em-contact-open');
    window.setTimeout(() => firstField?.focus(), 50);
  }

  function closePopup(event) {
    if (event) event.preventDefault();
    popup.classList.remove('is-open');
    popup.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('em-contact-open');
    window.setTimeout(() => {
      if (!popup.classList.contains('is-open')) popup.hidden = true;
    }, 300);
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
