const { ElectronBlocker } = require('@ghostery/adblocker-electron');
const fetch = require('cross-fetch');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// Cache file path in the user's data directory
const CACHE_PATH = path.join(app.getPath('userData'), 'adblock-engine.bin');

/**
 * Sets up the Ghostery adblocker for the given Electron session.
 * Uses a prebuilt engine for ads and tracking and caches it for fast startup.
 */
async function setupAdblocker(session) {
  try {
    // Built-in caching configuration for the adblocker
    const caching = {
      path: CACHE_PATH,
      read: async (p) => {
        try {
          return await fs.promises.readFile(p);
        } catch (e) {
          return null; // Return null if file doesn't exist to trigger fetch
        }
      },
      write: async (p, buf) => {
        try {
          await fs.promises.writeFile(p, buf);
        } catch (e) {
          console.error('Failed to write adblocker cache:', e);
        }
      },
    };

    // Load the blocker. If cache exists, it uses it. If not, it fetches from CDN and saves to cache.
    // We use fromPrebuiltAdsAndTracking as requested for standard browser-like blocking.
    const blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch, caching);

    // Enable blocking in the session.
    // This handles network blocking and automatic injection of cosmetic filters.
    // We no longer whitelist YouTube to ensure ads are actually blocked there.
    blocker.enableBlockingInSession(session);

    console.log('Adblocker successfully enabled (cached version used if available).');
    return blocker;
  } catch (error) {
    console.error('Failed to setup adblocker:', error);
    // Silent fallback to standard lists if prebuilt fails
    try {
      const fallbackBlocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
      fallbackBlocker.enableBlockingInSession(session);
      return fallbackBlocker;
    } catch (fallbackError) {
      console.error('Adblocker fallback failed:', fallbackError);
    }
  }
}

module.exports = { setupAdblocker };
