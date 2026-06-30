(function () {
  function initTestimonials(root) {
    const track = root.querySelector('.kopilot-pdp-testimonials__track');
    const prev = root.querySelector('[data-kopilot-testimonials-prev]');
    const next = root.querySelector('[data-kopilot-testimonials-next]');
    if (!track || !prev || !next) return;

    const scrollByCard = (direction) => {
      const card = track.querySelector('.kopilot-pdp-testimonials__card');
      if (!card) return;
      const gap = 16;
      track.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: 'smooth' });
    };

    prev.addEventListener('click', () => scrollByCard(-1));
    next.addEventListener('click', () => scrollByCard(1));
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-kopilot-pdp-testimonials]').forEach(initTestimonials);
  });
})();
