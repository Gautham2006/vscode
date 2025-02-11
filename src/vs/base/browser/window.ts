/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export type CodeWindow = Window & typeof globalThis & {
	readonly vscodeWindowId: number;
	readonly vscode: {
		ipcRenderer: {
			send(channel: string, ...args: any[]): void;
			invoke(channel: string, ...args: any[]): Promise<any>;
			on(channel: string, listener: (event: any, ...args: any[]) => void): void;
			once(channel: string, listener: (event: any, ...args: any[]) => void): void;
			removeListener(channel: string, listener: (event: any, ...args: any[]) => void): void;
		};
		webFrame: {
			setZoomLevel(level: number): void;
		};
		browser: {
			initBrowser: () => Promise<void>;
			navigate: (url: string) => Promise<void>;
		};
	};
};

export function ensureCodeWindow(targetWindow: Window, fallbackWindowId: number): asserts targetWindow is CodeWindow {
	const codeWindow = targetWindow as Partial<CodeWindow>;

	if (typeof codeWindow.vscodeWindowId !== 'number') {
		Object.defineProperty(codeWindow, 'vscodeWindowId', {
			get: () => fallbackWindowId
		});
	}
}

// eslint-disable-next-line no-restricted-globals
export const mainWindow = window as CodeWindow;

export function isAuxiliaryWindow(obj: Window): obj is CodeWindow {
	if (obj === mainWindow) {
		return false;
	}

	const candidate = obj as CodeWindow | undefined;

	return typeof candidate?.vscodeWindowId === 'number';
}
