(function () {
  function initHomeVideo(root) {
    const poster = root.querySelector('[data-kopilot-home-video-poster]');
    const playBtn = root.querySelector('[data-kopilot-home-video-play]');
    const video = root.querySelector('video');
    const youtubeMount = root.querySelector('[data-kopilot-home-youtube]');

    if (!poster || !playBtn) return;
    if (!video && !youtubeMount) return;

    playBtn.addEventListener('click', function () {
      poster.hidden = true;
      root.classList.add('is-playing');

      if (youtubeMount) {
        var player = youtubeMount._ytPlayer;
        if (player && typeof player.playVideo === 'function') {
          player.playVideo();
        }
        return;
      }

      video.setAttribute('controls', 'controls');
      video.play().catch(function () {});
    });
  }

  function initAll() {
    document.querySelectorAll('[data-kopilot-home-video]').forEach(initHomeVideo);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }

  document.addEventListener('shopify:section:load', function (event) {
    const root = event.target.querySelector('[data-kopilot-home-video]');
    if (root) initHomeVideo(root);
  });
})();
