const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
  appName: 'POS System',
  
  // Listen for menu actions
  onMenuAction: (callback) => {
    ipcRenderer.on('switch-tab', (event, tabId) => {
      callback('switch-tab', tabId);
    });
    ipcRenderer.on('menu-action', (event, action) => {
      callback('menu-action', action);
    });
  },
  
  license: {
    getMachineId: () => {
      // Simple hash based on timestamp and random
      return 'POS-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },
    check: async () => ({ status: 'active', message: 'Offline Mode' }),
    activate: async () => ({ success: true }),
  },
});
