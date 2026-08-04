const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
  appName: 'POS ???????',
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
    check: async () => ({ status: 'active', message: '?????? ???' }),
    activate: async () => ({ success: true }),
  },
});