const { ElectronBlocker } = require('@ghostery/adblocker-electron');
const fetch = require('cross-fetch');

// Aggressive public YouTube adblock filter lists
const AD_FILTER_LISTS = [
  'https://easylist.to/easylist/easylist.txt',
  'https://easylist.to/easylist/easyprivacy.txt',
  'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/annoyances-youtube.txt',
  'https://raw.githubusercontent.com/AdguardTeam/AdguardFilters/master/English/sections/youtube.txt',
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
