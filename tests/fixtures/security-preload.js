// Test-only attack surface; excluded from packaged resources.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('securityProbe', { invoke: (channel, value) => ipcRenderer.invoke(channel, value) });
