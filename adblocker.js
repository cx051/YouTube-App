const { ElectronBlocker } = require('@ghostery/adblocker-electron');
const fetch = require('cross-fetch');

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
];

async function setupAdblocker(session, options = {}) {
  const blocker = await ElectronBlocker.fromLists(fetch, AD_FILTER_LISTS);
  await blocker.enableBlockingInSession(session, {
    enableCompression: true,
    whitelist: options.whitelist || ['www.youtube.com', 'i.ytimg.com', 'ytimg.com'],
  });
  return blocker;
}

module.exports = { setupAdblocker };
