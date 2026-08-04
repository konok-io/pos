const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');

// Environment check
const isDev = process.env.NODE_ENV === 'development';

// Main window reference
let mainWindow = null;

// Create main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
    backgroundColor: '#ffffff',
  });

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

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
    // FILE MENU
    {
      label: 'File',
      submenu: [
        { label: 'Refresh App', accelerator: 'CmdOrCtrl+R', click: () => mainWindow?.reload() },
        { type: 'separator' },
        { label: 'Export Data', click: () => mainWindow?.webContents.send('menu-action', 'export') },
        { label: 'Import Data', click: () => mainWindow?.webContents.send('menu-action', 'import') },
        { type: 'separator' },
        { label: 'Print Receipt', accelerator: 'CmdOrCtrl+P', click: () => mainWindow?.webContents.send('menu-action', 'print') },
        { type: 'separator' },
        { role: 'quit', label: 'Exit' },
      ],
    },
    // EDIT MENU
    {
      label: 'Edit',
      submenu: [
        { role: 'undo', label: 'Undo' },
        { role: 'redo', label: 'Redo' },
        { type: 'separator' },
        { role: 'cut', label: 'Cut' },
        { role: 'copy', label: 'Copy' },
        { role: 'paste', label: 'Paste' },
        { role: 'selectAll', label: 'Select All' },
      ],
    },
    // POS MENU (Application Menus)
    {
      label: 'POS',
      submenu: [
        { label: '🛒 Sales', accelerator: 'CmdOrCtrl+1', click: () => mainWindow?.webContents.send('switch-tab', 'pos') },
        { label: '📦 All Products', accelerator: 'CmdOrCtrl+2', click: () => mainWindow?.webContents.send('switch-tab', 'products') },
        { label: '➕ New Product', accelerator: 'CmdOrCtrl+3', click: () => mainWindow?.webContents.send('switch-tab', 'newproduct') },
        { label: '📊 Barcode', accelerator: 'CmdOrCtrl+4', click: () => mainWindow?.webContents.send('switch-tab', 'barcode') },
        { type: 'separator' },
        { label: '🏢 Suppliers', accelerator: 'CmdOrCtrl+5', click: () => mainWindow?.webContents.send('switch-tab', 'suppliers') },
        { label: '👥 Customers', accelerator: 'CmdOrCtrl+6', click: () => mainWindow?.webContents.send('switch-tab', 'customers') },
        { type: 'separator' },
        { label: '🏭 Stock', accelerator: 'CmdOrCtrl+7', click: () => mainWindow?.webContents.send('switch-tab', 'inventory') },
        { label: '⚠️ Low Stock', accelerator: 'CmdOrCtrl+8', click: () => mainWindow?.webContents.send('switch-tab', 'lowstock') },
        { type: 'separator' },
        { label: '💰 Income/Expense', accelerator: 'CmdOrCtrl+9', click: () => mainWindow?.webContents.send('switch-tab', 'income') },
        { label: '📈 Reports', click: () => mainWindow?.webContents.send('switch-tab', 'reports') },
        { label: '⚙️ Settings', click: () => mainWindow?.webContents.send('switch-tab', 'settings') },
      ],
    },
    // VIEW MENU
    {
      label: 'View',
      submenu: [
        { role: 'reload', label: 'Reload' },
        { role: 'forceReload', label: 'Force Reload' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Reset Zoom' },
        { role: 'zoomIn', label: 'Zoom In' },
        { role: 'zoomOut', label: 'Zoom Out' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toggle Fullscreen' },
        ...(isDev ? [{ type: 'separator' }, { role: 'toggleDevTools', label: 'Developer Tools' }] : []),
      ],
    },
    // WINDOW MENU
    {
      label: 'Window',
      submenu: [
        { role: 'minimize', label: 'Minimize' },
        { role: 'zoom', label: 'Maximize' },
        { type: 'separator' },
        { role: 'close', label: 'Close' },
      ],
    },
    // HELP MENU
    {
      label: 'Help',
      submenu: [
        {
          label: 'About POS System',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About POS System',
              message: 'POS System v1.0.0',
              detail: 'Sales, Stock & Accounting Management\n\n© 2026 All Rights Reserved',
            });
          },
        },
        { type: 'separator' },
        { label: 'Documentation', click: () => shell.openExternal('https://konok.io/docs') },
        { label: 'Contact Support', click: () => shell.openExternal('mailto:support@konok.io') },
      ],
    },
  ];

  // Mac specific menu
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// App ready
app.whenReady().then(() => {
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
