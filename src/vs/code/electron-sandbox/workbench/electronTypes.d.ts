export {};

declare global {
    interface Window {
        electronAPI: {
            initBrowser: () => Promise<void>;
            navigate: (url: string) => Promise<void>;
        }
    }
} 