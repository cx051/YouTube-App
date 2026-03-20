// scripts/custom-adblock.js
// Lightweight, non-blocking DOM-based ad removal and quality optimization for YouTube
(function adblockAndQuality() {
  // --- 1. Ad Blocking Logic ---
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
    '.ytp-ad-skip-button-modern',
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
    '.ytp-ad-overlay',
    'ytd-merch-shelf-renderer',
    '#masthead-ad',
    'ytd-banner-promo-renderer',
    'tp-yt-paper-dialog:has(ytd-enforcement-message-view-model)' // New YouTube adblock detection dialogs
  ];

  function removeAds() {
    adSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => el.remove());
    });

    // Auto-skip video ads if skip button is present
    const skipBtn = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern');
    if (skipBtn) {
        skipBtn.click();
        console.log('Adblocker: Auto-skipped video ad.');
    }

    // If video is an ad, try to fast-forward
    const video = document.querySelector('video');
    if (video && video.duration && video.currentTime < video.duration - 1 && document.querySelector('.ad-showing')) {
      video.currentTime = video.duration;
      console.log('Adblocker: Fast-forwarded video ad.');
    }
  }

  // --- 2. Quality Selection Logic ---
  function selectBestQuality() {
    if (!/youtube\.com\/watch/.test(location.href)) return;

    // Check if we've already tried to set quality for this video
    const videoId = new URLSearchParams(window.location.search).get('v');
    if (window._lastVideoQualityId === videoId) return;

    let menu = document.querySelector('.ytp-settings-button');
    if (!menu) return;

    menu.click();
    setTimeout(() => {
      let qualityBtn = Array.from(document.querySelectorAll('.ytp-menuitem')).find(el => el.textContent.includes('Quality'));
      if (qualityBtn) {
        qualityBtn.click();
        setTimeout(() => {
          let best = document.querySelectorAll('.ytp-quality-menu .ytp-menuitem')[0];
          if (best) {
            best.click();
            console.log('Quality: Selected highest quality.');
            window._lastVideoQualityId = videoId; // Remember we did this for this video
          }
          if (menu) menu.click(); // Close menu
        }, 300);
      } else {
        if (menu) menu.click(); // Close menu if quality btn not found
      }
    }, 300);
  }

  // Run on load and periodically
  removeAds();
  selectBestQuality();

  // Use a more frequent interval for ad removal to catch dynamic injections
  if (!window._adblockInterval) {
    window._adblockInterval = setInterval(removeAds, 500);
    // Periodically try to set quality as well, in case it was missed
    setInterval(selectBestQuality, 5000);
  }
})();
