const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  // Pass screensaver mode flag to renderer
  isScreensaverMode: () => ipcRenderer.invoke('is-screensaver-mode')
});

// Log the screensaver mode flag
console.log('Preload script - Screensaver mode:', process.argv.includes('--screensaver'));
