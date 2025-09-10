const { contextBridge, ipcRenderer } = require('electron');

// Check for Windows screensaver command-line arguments
const args = process.argv;
const isScreensaverMode = args.includes('--screensaver') || args.includes('/s');
const isConfigMode = args.includes('/c');
const isPreviewMode = args.includes('/p');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  // Pass screensaver mode flags to renderer
  isScreensaverMode: () => ipcRenderer.invoke('is-screensaver-mode'),
  isConfigMode: () => ipcRenderer.invoke('is-config-mode'),
  isPreviewMode: () => ipcRenderer.invoke('is-preview-mode')
});

// Log the screensaver mode flag
console.log('Preload script - Screensaver mode:', process.argv.includes('--screensaver'));
