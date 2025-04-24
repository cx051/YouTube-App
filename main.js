const { app, BrowserWindow, session, ipcMain } = require('electron');
const path = require('path');
const { ElectronBlocker } = require('@ghostery/adblocker-electron');
const fetch = require('cross-fetch');

require('events').EventEmitter.defaultMaxListeners = 100;

// Disable throttling and backgrounding to improve performance
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

let mainWindow;

const ZOOM_LIMITS = {
  MIN: -3,
  MAX: 3,
};
let currentZoomLevel = 0;

async function createWindow() {
  const blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
  blocker.enableBlockingInSession(session.defaultSession, {
    enableCompression: true,
    whitelist: ['www.youtube.com', 'i.ytimg.com', 'ytimg.com'],
  });

  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('Preload script path:', preloadPath);

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    autoHideMenuBar: true,
    frame: false,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: preloadPath,
      webviewTag: true,
    },
  });

  mainWindow.loadFile('index.html').catch(error => {
    console.error('Error loading index.html:', error);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

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

// Clear browsing data and send result to renderer
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
  if (mainWindow === null) createWindow();
});
