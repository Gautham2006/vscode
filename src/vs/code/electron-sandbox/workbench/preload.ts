import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    initBrowser: () => ipcRenderer.invoke('init-browser'),
    navigate: (url: string) => ipcRenderer.invoke('navigate-browser', url)
}); 