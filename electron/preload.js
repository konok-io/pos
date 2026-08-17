const { contextBridge } = require('electron');

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true
});

console.log('Electron Preload Script Loaded');
