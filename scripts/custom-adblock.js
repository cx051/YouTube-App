// custom-adblock.js
// Lightweight, non-blocking DOM-based ad removal for YouTube
(function removeYouTubeAds() {
  // Remove banners, overlays, and ad containers
  const adSelectors = [
    '#player-ads',
    '.ytp-ad-module',
    '.ytp-ad-overlay-container',
    '.ytp-ad-player-overlay',
    '.ytp-ad-image-overlay',
    '.video-ads',
    '.ytp-ad-progress-list',
    '.ytp-ad-action-interstitial',
    '.ytp-ad-action-interstitial-slot',
    'ytd-promoted-sparkles-web-renderer',
    'ytd-display-ad-renderer',
    'ytd-companion-slot-renderer',
    '.ytp-ad-text',
    '.ytp-ad-skip-button',
    '.ytp-ad-message-container',
    'ytd-player-legacy-desktop-watch-ads-renderer',
    'ytd-ad-slot-renderer',
    'ytd-search-pyv-renderer',
    'ytd-promoted-video-renderer',
    '.ytp-ad-overlay-slot',
    '.ytp-ad-overlay-image',
    '.ytp-ad-overlay-close-button',
    '.ytp-ad-overlay-link',
    '.ytp-ad-overlay-title',
    '.ytp-ad-overlay-text',
    '.ytp-ad-overlay-image',
    '.ytp-ad-overlay',
  ];
  adSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => el.remove());
  });

  // Auto-skip video ads if skip button is present
  const skipBtn = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern');
  if (skipBtn) skipBtn.click();

  // If video is an ad, try to fast-forward
  const video = document.querySelector('video');
  if (video && video.duration && video.currentTime < video.duration - 1 && document.querySelector('.ad-showing')) {
    video.currentTime = video.duration;
  }

  // Run again in 1s for overlays injected later
  setTimeout(removeYouTubeAds, 1000);
})();
