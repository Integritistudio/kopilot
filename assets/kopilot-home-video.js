(function () {
  function playYoutube(wrap) {
    var videoId = (wrap.getAttribute('data-youtube-id') || '').trim();
    if (!videoId) return;

    var iframe = wrap.querySelector('iframe');
    var src =
      'https://www.youtube.com/embed/' +
      encodeURIComponent(videoId) +
      '?autoplay=1&rel=0&playsinline=1&modestbranding=1&controls=1';

    if (iframe) {
      iframe.src = src;
      return;
    }

    iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.title = 'YouTube video';
    iframe.setAttribute(
      'allow',
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
    );
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('frameborder', '0');

    wrap.innerHTML = '';
    wrap.appendChild(iframe);
  }

  function playHtmlVideo(video) {
    if (!video) return;
    video.setAttribute('controls', 'controls');
    video.setAttribute('playsinline', '');
    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {
        // Retry once after metadata is ready (common on mobile)
        video.addEventListener(
          'loadeddata',
          function () {
            video.play().catch(function () {});
          },
          { once: true }
        );
        video.load();
      });
    }
  }

  function initHomeVideo(root) {
    var poster = root.querySelector('[data-kopilot-home-video-poster]');
    var playBtn = root.querySelector('[data-kopilot-home-video-play]');
    var video = root.querySelector('video');
    var youtubeMount = root.querySelector('[data-kopilot-home-youtube]');
    var section = root.closest('.kopilot-home-video');

    if (!poster || !playBtn) return;
    if (!video && !youtubeMount) return;
    if (playBtn.dataset.bound === '1') return;
    playBtn.dataset.bound = '1';

    playBtn.addEventListener('click', function (event) {
      event.preventDefault();
      if (playBtn.getAttribute('aria-disabled') === 'true') return;

      poster.hidden = true;
      root.classList.add('is-playing');
      if (section) section.classList.add('is-playing');

      if (youtubeMount) {
        playYoutube(youtubeMount);
        return;
      }

      playHtmlVideo(video);
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
    var root = event.target.querySelector('[data-kopilot-home-video]');
    if (root) initHomeVideo(root);
  });
})();
