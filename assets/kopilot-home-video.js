(function () {
  function loadYoutubeApi(callback) {
    if (window.YT && window.YT.Player) {
      callback();
      return;
    }

    var previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof previous === 'function') previous();
      callback();
    };

    if (!document.getElementById('youtube-iframe-api')) {
      var tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  }

  function playYoutube(wrap) {
    var videoId = wrap.getAttribute('data-youtube-id');
    if (!videoId) return;

    // Reliable fallback: inject iframe with autoplay on click
    if (wrap._ytPlayer && typeof wrap._ytPlayer.playVideo === 'function') {
      wrap._ytPlayer.playVideo();
      return;
    }

    var existing = wrap.querySelector('iframe');
    if (existing) {
      existing.src =
        'https://www.youtube.com/embed/' +
        videoId +
        '?autoplay=1&rel=0&playsinline=1&modestbranding=1';
      return;
    }

    var mount = wrap.querySelector('[id^="KopilotHomeYt-"]') || wrap;
    var mountId = mount.id || 'KopilotHomeYt-' + Date.now();
    if (!mount.id) mount.id = mountId;

    loadYoutubeApi(function () {
      if (wrap._ytPlayer) {
        wrap._ytPlayer.playVideo();
        return;
      }

      wrap._ytPlayer = new YT.Player(mountId, {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          iv_load_policy: 3,
          fs: 1
        },
        events: {
          onReady: function (event) {
            wrap._ytPlayer = event.target;
            event.target.playVideo();
          }
        }
      });
    });
  }

  function initHomeVideo(root) {
    const poster = root.querySelector('[data-kopilot-home-video-poster]');
    const playBtn = root.querySelector('[data-kopilot-home-video-play]');
    const video = root.querySelector('video');
    const youtubeMount = root.querySelector('[data-kopilot-home-youtube]');

    if (!poster || !playBtn) return;
    if (!video && !youtubeMount) return;
    if (playBtn.dataset.bound === '1') return;
    playBtn.dataset.bound = '1';

    playBtn.addEventListener('click', function () {
      if (playBtn.getAttribute('aria-disabled') === 'true') return;

      poster.hidden = true;
      root.classList.add('is-playing');

      if (youtubeMount) {
        playYoutube(youtubeMount);
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
