const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    createBrowserWindow: (options) => ipcRenderer.invoke('create-browser-window', options),
    loadURL: (url) => ipcRenderer.invoke('load-url', url)
}); 