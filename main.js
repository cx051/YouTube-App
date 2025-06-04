const { app, BrowserWindow, session, ipcMain } = require('electron');

const path = require('path');
const { setupAdblocker } = require('./adblocker');

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
// Disable hardware acceleration by default
app.commandLine.appendSwitch('disable-gpu');

let mainWindow;
let splashWindow;
const ZOOM_LIMITS = { MIN: -3, MAX: 3 };
let currentZoomLevel = 0;

async function createWindow() {
  try {
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
      // Record splash show time
      const splashShownAt = Date.now();
      let mainLoaded = false;
      let splashMinTimeReached = false;
      let splashClosed = false;
      let adblockerReady = false;
      let adblockerTimeout;
      // Start adblocker setup but do not block UI
      const adblockerPromise = setupAdblocker(session.defaultSession).then(() => { adblockerReady = true; });
      // If adblocker takes >2.5s, show loading message on splash (optional)
      adblockerTimeout = setTimeout(() => {
        if (!adblockerReady && splashWindow && !splashClosed) {
          splashWindow.webContents.executeJavaScript(`
            let msg = document.getElementById('adblocker-loading-msg');
            if (!msg) {
              msg = document.createElement('div');
              msg.id = 'adblocker-loading-msg';
              msg.style = 'color:#ff2222;font-size:15px;text-align:center;margin-top:18px;opacity:0.92;font-family:monospace;';
              msg.textContent = 'Loading adblocker…';
              document.querySelector('.splash-container').appendChild(msg);
            }
          `);
        }
      }, 2500);
      // Do not block main window creation/loading
      const preloadPath = path.join(__dirname, 'preload.js');
      const iconPath = process.platform === 'win32'
        ? path.join(__dirname, 'assets', 'YouTube.ico')
        : path.join(__dirname, 'assets', 'YouTube (original).png');

      mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        autoHideMenuBar: true,
        frame: false,
        show: false, // hidden initially
        opacity: 0, // for fade-in
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
          backgroundThrottling: true, // allow throttling for background tabs
          experimentalFeatures: true,
          enableBlinkFeatures: 'HardwareMediaKeyHandling,VideoPlaybackQuality',
          // Hardware acceleration will be toggled via IPC
        },
      });

      // Reduce memory/cpu usage with Electron flags
      app.commandLine.appendSwitch('js-flags', '--max-old-space-size=128');
      app.commandLine.appendSwitch('disable-software-rasterizer');
      app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder,VaapiVideoEncoder');

      // Inject script to auto-select highest YouTube quality after navigation
      mainWindow.webContents.on('did-navigate', () => {
        mainWindow.webContents.executeJavaScript(`
          (function selectBestQuality(){
            if (!/youtube\.com\/watch/.test(location.href)) return;
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

      mainWindow.loadFile('index.html').catch(err => {
        console.error('Failed to load index.html:', err);
      });

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

      mainWindow.on('closed', () => {
        mainWindow = null;
      });
    });
  } catch (err) {
    console.error('Error creating window:', err);
  }
}

// Hardware acceleration IPC
ipcMain.handle('get-hardware-acceleration', () => {
  return !app.commandLine.hasSwitch('disable-gpu');
});
ipcMain.handle('set-hardware-acceleration', async (_event, enabled) => {
  if (enabled) {
    // Remove the disable-gpu switch if present
    if (app.commandLine.hasSwitch('disable-gpu')) {
      // This only takes effect on restart
      // No direct way to enable at runtime in Electron
      // Inform renderer to prompt for restart
      return { restartRequired: true, enabled: true };
    }
    return { restartRequired: false, enabled: true };
  } else {
    // Add the disable-gpu switch (takes effect on restart)
    if (!app.commandLine.hasSwitch('disable-gpu')) {
      app.commandLine.appendSwitch('disable-gpu');
      return { restartRequired: true, enabled: false };
    }
    return { restartRequired: false, enabled: false };
  }
});

// IPC handler for app restart (hardware acceleration modal)
ipcMain.handle('restart-app', () => {
  app.relaunch();
  app.exit(0);
});

// Navigation
ipcMain.on('toolbar-go-back', () => mainWindow?.webContents.goBack());
ipcMain.on('toolbar-go-forward', () => mainWindow?.webContents.goForward());
ipcMain.on('toolbar-reload', () => mainWindow?.webContents.reload());

// Window controls
ipcMain.on('minimize-window', () => mainWindow?.minimize());
ipcMain.on('toggle-maximize', () => {
  if (!mainWindow) return;
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
});
ipcMain.on('close-window', () => mainWindow?.close());

// Zoom
ipcMain.on('zoom-in', () => {
  if (mainWindow && currentZoomLevel < ZOOM_LIMITS.MAX) {
    currentZoomLevel += 0.5;
    mainWindow.webContents.setZoomLevel(currentZoomLevel);
  }
});
ipcMain.on('zoom-out', () => {
  if (mainWindow && currentZoomLevel > ZOOM_LIMITS.MIN) {
    currentZoomLevel -= 0.5;
    mainWindow.webContents.setZoomLevel(currentZoomLevel);
  }
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
    mainWindow.webContents.send('clear-data-result', { success: false });
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
