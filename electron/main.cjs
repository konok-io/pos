const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');

// Environment check
const isDev = !app.isPackaged;

let mainWindow = null;

function showError(title, message) {
  console.error(title + ': ' + message);
  if (mainWindow) {
    dialog.showErrorBox(title, message);
  }
}

// Create main window
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
    backgroundColor: '#0F766E',
  });

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load app with error handling
  try {
    if (isDev) {
      console.log('Loading dev server at http://localhost:5173');
      mainWindow.loadURL('http://localhost:5173');
    } else {
      // Production: Start API server and load from localhost
      console.log('Starting API server...');
      const { start } = require('./api/server.cjs');
      const port = await start(8765);
      console.log('API Server started at: http://localhost:' + port);
      
      mainWindow.loadURL('http://localhost:' + port);
    }
  } catch (err) {
    console.error('Failed to load app:', err);
    showError('Load Error', 'Failed to start: ' + err.message);
  }

  // Handle load errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    showError('Load Error', 'Failed to load page\n\nError: ' + errorCode + '\n' + errorDescription);
  });

  // Log console errors from renderer
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    if (level >= 2) { // Error level
      console.error('Renderer Error:', message);
    }
  });

  // Catch renderer errors
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('Renderer process gone:', details);
    if (details.reason !== 'clean-exit') {
      showError('App Crashed', details.reason + '\n\nExit code: ' + details.exitCode);
    }
  });

  // F12 to toggle DevTools
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      } else {
        mainWindow.webContents.openDevTools();
      }
    }
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'Hard Refresh', accelerator: 'CmdOrCtrl+Shift+R', click: () => mainWindow?.webContents.reloadIgnoringCache() },
        { label: 'Refresh App', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.reload() },
        { type: 'separator' },
        { label: 'Exit', click: () => app.quit() },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Developer Tools', accelerator: 'F12', click: () => mainWindow?.webContents.toggleDevTools() },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toggle Fullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About POS System',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About POS System',
              message: 'POS System v1.1.2000',
              detail: 'Sales, Stock & Accounting Management\n\n© 2026 All Rights Reserved',
            });
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  showError('System Error', 'An unexpected error occurred:\n\n' + err.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

// App ready
app.whenReady().then(() => {
  console.log('App starting...');
  createMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
