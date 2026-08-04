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
      const os = require('os');
      const info = os.hostname() + os.platform() + os.arch();
      let hash = 0;
      for (let i = 0; i < info.length; i++) {
        hash = ((hash << 5) - hash) + info.charCodeAt(i);
        hash = hash & hash;
      }
      return 'POS-' + Math.abs(hash).toString(16).toUpperCase();
    },
    check: async () => ({ status: 'active', message: 'Offline Mode' }),
    activate: async () => ({ success: true }),
  },
});
