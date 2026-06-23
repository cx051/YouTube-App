const { ElectronBlocker } = require('@ghostery/adblocker-electron');
const fetch = require('cross-fetch');
const fs = require('fs');
const path = require('path');
const { app, ipcMain } = require('electron');

// Aggressive public YouTube adblock filter lists
const AD_FILTER_LISTS = [
  'https://easylist.to/easylist/easylist.txt',
  'https://easylist.to/easylist/easyprivacy.txt',
  'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt',
  'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/badware.txt',
  'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/privacy.txt',
  'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/unbreak.txt',
  'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/annoyances.txt',
  'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/resource-abuse.txt',
  'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/quick-fixes.txt',
  'https://raw.githubusercontent.com/brave/adblock-lists/master/brave-unbreak.txt',
  'https://raw.githubusercontent.com/brave/adblock-lists/master/brave-specific.txt',
];

const CACHE_PATH = path.join(app.getPath('userData'), 'adblock-engine.bin');
const LISTS_HASH_PATH = path.join(app.getPath('userData'), 'adblock-lists-hash.txt');

// Track the current blocker instance to avoid IPC conflicts
let currentBlocker = null;

/**
 * Sets up the Ghostery adblocker for the given Electron session.
 * Uses aggressive filter lists and caches them for fast startup.
 */
async function setupAdblocker(session) {
  try {
    // We already have a blocker running, no need to re-initialize
    if (currentBlocker) {
      console.log('Adblocker: Already initialized.');
      return currentBlocker;
    }

    // Explicitly unregister any existing handlers before starting to avoid "Attempted to register a second handler" error
    // These are the names used by @ghostery/adblocker-electron
    ipcMain.removeHandler('@ghostery/adblocker/inject-cosmetic-filters');
    ipcMain.removeHandler('@ghostery/adblocker/is-mutation-observer-enabled');

    let blocker;
    const currentHash = Buffer.from(AD_FILTER_LISTS.join(',')).toString('base64');
    let cacheValid = false;

    if (fs.existsSync(CACHE_PATH) && fs.existsSync(LISTS_HASH_PATH)) {
      const savedHash = await fs.promises.readFile(LISTS_HASH_PATH, 'utf8');
      if (savedHash === currentHash) {
        cacheValid = true;
      }
    }

    // We try to load from cache for speed
    if (cacheValid) {
      console.log(`Adblocker: Loading from cache (${CACHE_PATH})...`);
      const buffer = await fs.promises.readFile(CACHE_PATH);
      blocker = ElectronBlocker.deserialize(buffer);
      console.log('Adblocker: Engine deserialized from cache.');
    } else {
      console.log('Adblocker: Loading from lists (first time or lists updated)...');

      // Implement a 15-second timeout for list fetching
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        blocker = await ElectronBlocker.fromLists((url, opts) => fetch(url, { ...opts, signal: controller.signal }), AD_FILTER_LISTS);
        clearTimeout(timeoutId);

        const buffer = Buffer.from(blocker.serialize());
        await fs.promises.writeFile(CACHE_PATH, buffer);
        await fs.promises.writeFile(LISTS_HASH_PATH, currentHash);
        console.log('Adblocker: Engine fetched and cached successfully.');
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('Adblocker: Fetching filter lists timed out after 15 seconds.');
        }
        throw fetchError; // Re-throw to trigger fallback
      }
    }

    wrapBlocker(blocker);
    blocker.enableBlockingInSession(session);
    currentBlocker = blocker;
    console.log('Adblocker successfully enabled with aggressive lists.');
    return blocker;
  } catch (error) {
    console.error('Adblocker: Failed to setup:', error);
    // Fallback if anything goes wrong
    try {
      const fallbackBlocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
      wrapBlocker(fallbackBlocker);
      fallbackBlocker.enableBlockingInSession(session);
      currentBlocker = fallbackBlocker;
      return fallbackBlocker;
    } catch (fallbackError) {
      console.error('Adblocker: Fallback failed:', fallbackError);
    }
  }
}

/**
 * Wraps the blocker's cosmetic filter injection to catch script execution errors.
 * This prevents unhandled rejections when YouTube's CSP or other factors cause
 * adblocker scriptlets to fail.
 */
function wrapBlocker(blocker) {
  if (!blocker || !blocker.onInjectCosmeticFilters) return blocker;

  const original = blocker.onInjectCosmeticFilters;
  blocker.onInjectCosmeticFilters = function(event, url, msg) {
    // Wrap the event object to intercept sender.executeJavaScript
    const proxyEvent = new Proxy(event, {
      get(target, prop) {
        if (prop === 'sender') {
          return new Proxy(target.sender, {
            get(senderTarget, senderProp) {
              const val = senderTarget[senderProp];
              if (typeof val === 'function' && (senderProp === 'executeJavaScript' || senderProp === 'insertCSS')) {
                return (...args) => {
                  try {
                    const result = val.apply(senderTarget, args);
                    if (result && typeof result.catch === 'function') {
                      return result.catch((err) => {
                        // Silently catch scriptlet/CSS injection failures
                        console.debug(`Adblocker: ${senderProp} failed (silenced):`, err.message || err);
                      });
                    }
                    return result;
                  } catch (e) {
                    // Handle immediate throws
                    return Promise.resolve();
                  }
                };
              }
              return typeof val === 'function' ? val.bind(senderTarget) : val;
            }
          });
        }
        return target[prop];
      }
    });

    return original.call(blocker, proxyEvent, url, msg);
  };

  return blocker;
}

module.exports = { setupAdblocker };
