const { app, BrowserWindow, session, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const { setupAdblocker } = require('./adblocker');
const settingsManager = require('./settings-manager');

// Handle unhandled promise rejections globally
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

// (Optional) Enable software WebGL fallback
app.commandLine.appendSwitch('enable-unsafe-swiftshader');

require('events').EventEmitter.defaultMaxListeners = 100;

// Disable throttling to improve performance
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

// Load settings and apply hardware acceleration
const settings = settingsManager.getSettings();
if (!settings.hardwareAcceleration) {
  app.commandLine.appendSwitch('disable-gpu');
}

let mainWindow;
let tray;
let splashWindow;
const ZOOM_LIMITS = { MIN: -3, MAX: 3 };
let currentZoomLevel = 0;

function createTray() {
  if (tray) return;
  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, 'assets', 'YouTube.ico')
    : path.join(__dirname, 'assets', 'YouTube (original).png');

  tray = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    { label: 'Quit', click: () => {
      app.isQuitting = true;
      app.quit();
    } }
  ]);

  tray.setToolTip('YouTube App');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

function configureWindow(win) {
  // Inject script to auto-select highest YouTube quality after navigation
  win.webContents.on('did-navigate', () => {
    win.webContents.executeJavaScript(`
      (function selectBestQuality(){
        if (!/youtube\\.com\\/watch/.test(location.href)) return;
        let menu = document.querySelector('.ytp-settings-button');
        if (menu) menu.click();
        setTimeout(()=>{
          let qualityBtn = Array.from(document.querySelectorAll('.ytp-menuitem')).find(el=>el.textContent.includes('Quality'));
          if (qualityBtn) qualityBtn.click();
          setTimeout(()=>{
            let best = document.querySelectorAll('.ytp-quality-menu .ytp-menuitem')[0];
            if (best) best.click();
            if (menu) menu.click();
          }, 400);
        }, 400);
      })();
    `);
  });

  win.on('closed', () => {
    mainWindow = null;
  });

  win.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      win.hide();
    }
    return false;
  });

  createTray();
}

async function createMainWindow(showImmediately = true) {
  const preloadPath = path.join(__dirname, 'preload.js');
  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, 'assets', 'YouTube.ico')
    : path.join(__dirname, 'assets', 'YouTube (original).png');

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    autoHideMenuBar: true,
    frame: false,
    show: showImmediately,
    opacity: showImmediately ? 1 : 0,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: preloadPath,
      webviewTag: true,
      enableWebSQL: false,
      webSecurity: true,
      scrollBounce: false,
      offscreen: false,
      backgroundThrottling: true,
      experimentalFeatures: true,
      enableBlinkFeatures: 'HardwareMediaKeyHandling,VideoPlaybackQuality',
    },
  });

  // Reduce memory/cpu usage with Electron flags
  app.commandLine.appendSwitch('js-flags', '--max-old-space-size=128');
  app.commandLine.appendSwitch('disable-software-rasterizer');
  app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,VaapiVideoEncoder');

  // Start adblocker setup
  setupAdblocker(session.defaultSession).catch(console.error);

  mainWindow.loadFile('index.html').catch(err => {
    console.error('Failed to load index.html:', err);
  });

  configureWindow(mainWindow);
}

async function createWindow() {
  try {
    const settings = settingsManager.getSettings();

    if (settings.skipIntro) {
      createMainWindow(true);
      return;
    }

    // 1. Create splash window IMMEDIATELY
    splashWindow = new BrowserWindow({
      width: 440,
      height: 320,
      frame: false,
      transparent: false,
      alwaysOnTop: true,
      resizable: false,
      movable: true,
      show: true,
      center: true,
      skipTaskbar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });
    splashWindow.setMenuBarVisibility(false);
    splashWindow.loadFile(path.join(__dirname, 'splash.html'));

    // 2. Delay heavy logic until splash is visible
    splashWindow.once('ready-to-show', async () => {
      let mainLoaded = false;
      let splashMinTimeReached = false;
      let splashClosed = false;

      createMainWindow(false);

      function tryCloseSplash() {
        if (mainLoaded && splashMinTimeReached && !splashClosed) {
          splashClosed = true;
          if (splashWindow && !splashWindow.isDestroyed()) {
            splashWindow.webContents.executeJavaScript('window.electronSplashClose && window.electronSplashClose();');
          }
          setTimeout(() => {
            if (mainWindow) {
              mainWindow.show();
              let opacity = 0;
              const fade = setInterval(() => {
                opacity += 0.07;
                if (opacity >= 1) {
                  opacity = 1;
                  clearInterval(fade);
                }
                try { mainWindow.setOpacity(opacity); } catch {}
              }, 30);
            }
          }, 800); // match splash fade duration
        }
      }

      // Wait for main window to finish loading YouTube
      mainWindow.webContents.on('did-finish-load', async () => {
        mainLoaded = true;
        tryCloseSplash();
      });

      // Ensure splash stays up for at least 3 seconds
      setTimeout(() => {
        splashMinTimeReached = true;
        tryCloseSplash();
      }, 3000);
    });
  } catch (err) {
    console.error('Error creating window:', err);
  }
}

// Settings IPC
ipcMain.handle('get-settings', () => {
  try {
    return settingsManager.getSettings();
  } catch (error) {
    console.error('IPC get-settings error:', error);
    return {};
  }
});

ipcMain.handle('update-setting', (_event, key, value) => {
  try {
    settingsManager.updateSetting(key, value);
    return { success: true };
  } catch (error) {
    console.error('IPC update-setting error:', error);
    return { success: false, error: error.message };
  }
});

// Hardware acceleration IPC
ipcMain.handle('get-hardware-acceleration', () => {
  return settingsManager.getSettings().hardwareAcceleration;
});

ipcMain.handle('set-hardware-acceleration', async (_event, enabled) => {
  const currentSettings = settingsManager.getSettings();
  if (currentSettings.hardwareAcceleration === enabled) {
    return { restartRequired: false, enabled };
  }

  settingsManager.updateSetting('hardwareAcceleration', enabled);
  return { restartRequired: true, enabled };
});

// IPC handler for app restart (hardware acceleration modal)
ipcMain.handle('restart-app', () => {
  app.relaunch();
  app.exit(0);
});

// Navigation
ipcMain.on('toolbar-go-back', () => {
  try { mainWindow?.webContents.goBack(); } catch (e) { console.error(e); }
});
ipcMain.on('toolbar-go-forward', () => {
  try { mainWindow?.webContents.goForward(); } catch (e) { console.error(e); }
});
ipcMain.on('toolbar-reload', () => {
  try { mainWindow?.webContents.reload(); } catch (e) { console.error(e); }
});

// Window controls
ipcMain.on('minimize-window', () => {
  try { mainWindow?.minimize(); } catch (e) { console.error(e); }
});
ipcMain.on('minimize-to-tray', () => {
  try { mainWindow?.hide(); } catch (e) { console.error(e); }
});
ipcMain.on('toggle-maximize', () => {
  try {
    if (!mainWindow) return;
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  } catch (e) { console.error(e); }
});
ipcMain.on('close-window', () => {
  try { mainWindow?.close(); } catch (e) { console.error(e); }
});

// Zoom
ipcMain.on('zoom-in', () => {
  try {
    if (mainWindow && currentZoomLevel < ZOOM_LIMITS.MAX) {
      currentZoomLevel += 0.5;
      mainWindow.webContents.setZoomLevel(currentZoomLevel);
    }
  } catch (e) { console.error(e); }
});
ipcMain.on('zoom-out', () => {
  try {
    if (mainWindow && currentZoomLevel > ZOOM_LIMITS.MIN) {
      currentZoomLevel -= 0.5;
      mainWindow.webContents.setZoomLevel(currentZoomLevel);
    }
  } catch (e) { console.error(e); }
});

// Clear browsing data
ipcMain.on('clear-browsing-data', async () => {
  if (!mainWindow) return;

  try {
    await session.defaultSession.clearStorageData();
    mainWindow.webContents.send('clear-data-result', { success: true });
    mainWindow.webContents.reload();
  } catch (error) {
    console.error('Failed to clear browsing data:', error);
    try {
      mainWindow.webContents.send('clear-data-result', { success: false });
    } catch (e) { console.error(e); }
  }
});

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (!mainWindow) createWindow();
});
