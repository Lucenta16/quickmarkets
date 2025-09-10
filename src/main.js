const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Default settings (instead of using electron-store)
const defaultSettings = {
  refreshRate: 30,
  gridSize: 'medium',
  watchlist: [
    { symbol: 'AAPL', type: 'stock' },
    { symbol: 'MSFT', type: 'stock' },
    { symbol: 'GOOGL', type: 'stock' },
    { symbol: 'BTC-USD', type: 'crypto' },
    { symbol: 'ETH-USD', type: 'crypto' },
    { symbol: 'EUR=X', type: 'forex' },
    { symbol: 'GBP=X', type: 'forex' }
  ]
};

// Keep a global reference of the window object to avoid garbage collection
let mainWindow;

function createWindow() {
  // Check for Windows screensaver command-line arguments
  // /s = Run the screensaver (fullscreen mode)
  // /c = Show the configuration dialog
  // /p = Preview in a small window
  
  // Map Windows screensaver args to our internal flags
  const args = process.argv;
  let isScreensaverMode = args.includes('--screensaver');
  let isConfigMode = false;
  let isPreviewMode = false;
  
  // Check for Windows screensaver arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i].toLowerCase();
    if (arg === '/s') {
      isScreensaverMode = true;
    } else if (arg === '/c') {
      isConfigMode = true;
    } else if (arg === '/p') {
      isPreviewMode = true;
      // The next argument should be the preview window handle
      const previewHandle = args[i + 1];
      console.log('Preview handle:', previewHandle);
    }
  }
  
  console.log('Command line arguments:', process.argv);
  console.log('Screensaver mode:', isScreensaverMode);
  console.log('Config mode:', isConfigMode);
  console.log('Preview mode:', isPreviewMode);
  
  // Create the browser window with different settings based on mode
  if (isConfigMode) {
    // Configuration dialog mode
    mainWindow = new BrowserWindow({
      width: 600,
      height: 700,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      backgroundColor: '#121212',
      show: false,
      frame: true,
      fullscreen: false,
      resizable: false,
      maximizable: false,
      minimizable: true,
      title: 'QuickMarkets Screensaver Settings'
    });
  } else if (isPreviewMode) {
    // Preview mode (small window for screensaver selection dialog)
    mainWindow = new BrowserWindow({
      width: 150,
      height: 100,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      backgroundColor: '#121212',
      show: false,
      frame: false,
      fullscreen: false,
      resizable: false,
      alwaysOnTop: true
    });
  } else {
    // Normal screensaver mode
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      },
      backgroundColor: '#121212', // Dark background for the app
      show: false, // Don't show until ready-to-show
      frame: !isScreensaverMode, // No frame in screensaver mode
      fullscreen: isScreensaverMode, // Fullscreen in screensaver mode
      kiosk: isScreensaverMode // Kiosk mode prevents easy exit in screensaver mode
    });
  }

  // Load the index.html of the app
  // Using index.html which loads renderer.js instead of browser-index.html
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    // Dereference the window object
    mainWindow = null;
  });
}

// Create window when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open
    if (mainWindow === null) createWindow();
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers for settings
ipcMain.handle('get-settings', (event) => {
  return defaultSettings;
});

ipcMain.handle('save-settings', (event, settings) => {
  // Update our in-memory settings
  defaultSettings.refreshRate = settings.refreshRate;
  defaultSettings.gridSize = settings.gridSize;
  defaultSettings.watchlist = settings.watchlist;
  return true;
});

// IPC handlers for screensaver mode checks
ipcMain.handle('is-screensaver-mode', () => {
  return process.argv.includes('--screensaver') || process.argv.includes('/s');
});

ipcMain.handle('is-config-mode', () => {
  return process.argv.includes('/c');
});

ipcMain.handle('is-preview-mode', () => {
  return process.argv.includes('/p');
});
