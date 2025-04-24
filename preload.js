// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  goBack: () => ipcRenderer.send('toolbar-go-back'),
  reload: () => ipcRenderer.send('toolbar-reload'),
  goForward: () => ipcRenderer.send('toolbar-go-forward'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  toggleMaximize: () => ipcRenderer.send('toggle-maximize'),
  closeWindow: () => ipcRenderer.send('close-window'),
  zoomIn: () => ipcRenderer.send('zoom-in'),
  zoomOut: () => ipcRenderer.send('zoom-out'),
  clearData: () => ipcRenderer.send('clear-browsing-data'),
  onClearDataResult: (callback) => ipcRenderer.on('clear-data-result', callback)
});
