export {}; // marks this file as a module

import type { ISandboxGlobals } from './globals';

declare global {
    interface Window {
        vscode: ISandboxGlobals;
    }
}

// Also declare it for globalThis
declare interface globalThis {
    vscode: ISandboxGlobals;
} 