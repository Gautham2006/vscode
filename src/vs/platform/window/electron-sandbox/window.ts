/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { getZoomLevel, setZoomFactor, setZoomLevel } from '../../../base/browser/browser.js';
import { getActiveWindow, getWindows } from '../../../base/browser/dom.js';
import { mainWindow } from '../../../base/browser/window.js';
import { ISandboxConfiguration } from '../../../base/parts/sandbox/common/sandboxTypes.js';
import { ISandboxGlobals, ipcRenderer, webFrame } from '../../../base/parts/sandbox/electron-sandbox/globals.js';
import { zoomLevelToZoomFactor } from '../common/window.js';
import { WebUtils } from '../../../base/parts/sandbox/electron-sandbox/electronTypes.js';
import { ISandboxNodeProcess } from '../../../base/parts/sandbox/electron-sandbox/globals.js';
import { IProcessEnvironment } from '../../../base/common/platform.js';

// Get sandbox globals
const globals = (globalThis as any).vscode?.context;

export enum ApplyZoomTarget {
	ACTIVE_WINDOW = 1,
	ALL_WINDOWS
}

export const MAX_ZOOM_LEVEL = 8;
export const MIN_ZOOM_LEVEL = -8;

/**
 * Apply a zoom level to the window. Also sets it in our in-memory
 * browser helper so that it can be accessed in non-electron layers.
 */
export function applyZoom(zoomLevel: number, target: ApplyZoomTarget | Window): void {
	zoomLevel = Math.min(Math.max(zoomLevel, MIN_ZOOM_LEVEL), MAX_ZOOM_LEVEL); // cap zoom levels between -8 and 8

	const targetWindows: Window[] = [];
	if (target === ApplyZoomTarget.ACTIVE_WINDOW) {
		targetWindows.push(getActiveWindow());
	} else if (target === ApplyZoomTarget.ALL_WINDOWS) {
		targetWindows.push(...Array.from(getWindows()).map(({ window }) => window));
	} else {
		targetWindows.push(target);
	}

	for (const targetWindow of targetWindows) {
		getGlobals(targetWindow)?.webFrame?.setZoomLevel(zoomLevel);
		setZoomFactor(zoomLevelToZoomFactor(zoomLevel), targetWindow);
		setZoomLevel(zoomLevel, targetWindow);
	}
}

// Standard browser window options
const browserWindowDefaults: ISandboxConfiguration = {
	windowId: 1,
	appRoot: globals?.configuration()?.appRoot || '',
	userEnv: globals?.configuration()?.userEnv || {},
	product: {
		version: '1.x.y',
		nameShort: 'Code',
		nameLong: 'Visual Studio Code',
		applicationName: 'code',
		dataFolderName: '.vscode',
		urlProtocol: 'vscode',
		webEndpointUrlTemplate: 'https://{{uuid}}.vscode-cdn.net/',
		serverApplicationName: 'code-server',
		embedderIdentifier: 'desktop',
		quality: 'stable',
		extensionsGallery: {
			serviceUrl: 'https://marketplace.visualstudio.com/_apis/public/gallery',
			servicePPEUrl: 'https://marketplace.visualstudio.com/_apis/public/gallery',
			searchUrl: 'https://marketplace.visualstudio.com/_apis/public/gallery/search',
			itemUrl: 'https://marketplace.visualstudio.com/items',
			publisherUrl: 'https://marketplace.visualstudio.com/publishers',
			resourceUrlTemplate: 'https://marketplace.visualstudio.com/_apis/public/gallery/publishers/{publisher}/vsextensions/{name}/{version}/vspackage',
			extensionUrlTemplate: 'https://marketplace.visualstudio.com/_apis/public/gallery/publishers/{publisher}/vsextensions/{name}/latest/vspackage',
			controlUrl: '',
			nlsBaseUrl: 'https://www.vscode.com/nls'
		},
		downloadUrl: 'https://code.visualstudio.com',
		commit: undefined,
		date: undefined,
		checksums: undefined
	},
	zoomLevel: 0,
	nls: {
		messages: [],
		language: undefined
	}
};

function getGlobals(win: Window): ISandboxGlobals | undefined {
	if (win === mainWindow) {
		const webUtils: WebUtils = {
			getPathForFile: (file: File) => file.path || ''
		};

		// Get the process object from sandbox globals
		const sandboxProcess = (globalThis as any).vscode?.process;

		if (!sandboxProcess) {
			return undefined;
		}

		const sandboxNodeProcess: ISandboxNodeProcess = {
			...sandboxProcess,
			shellEnv: async (): Promise<IProcessEnvironment> => {
				return sandboxProcess.env || {};
			},
			env: sandboxProcess.env || {},
			on: (type: string, callback: Function) => {
				if (typeof sandboxProcess.on === 'function') {
					sandboxProcess.on(type, callback as (...args: any[]) => void);
				}
			}
		};

		return {
			ipcRenderer,
			webFrame,
			process: sandboxNodeProcess,
			context: {
				configuration: () => ({
					...browserWindowDefaults,
					webPreferences: {
						nodeIntegration: true,
						contextIsolation: false,
						webSecurity: false,
						allowRunningInsecureContent: true
					}
				}),
				resolveConfiguration: () => Promise.resolve(browserWindowDefaults)
			},
			webUtils,
			ipcMessagePort: {
				acquire: (responseChannel: string, nonce: string) => {}
			},
			browser: {
				initBrowser: () => Promise.resolve(),
				navigate: (url: string) => Promise.resolve()
			}
		};
	} else if (win && (win as any).vscode) {
		// auxiliary window
		return (win as any).vscode;
	}

	return undefined;
}

export function zoomIn(target: ApplyZoomTarget | Window): void {
	applyZoom(getZoomLevel(typeof target === 'number' ? getActiveWindow() : target) + 1, target);
}

export function zoomOut(target: ApplyZoomTarget | Window): void {
	applyZoom(getZoomLevel(typeof target === 'number' ? getActiveWindow() : target) - 1, target);
}

//#region Bootstrap Window

export interface ILoadOptions<T extends ISandboxConfiguration = ISandboxConfiguration> {
	configureDeveloperSettings?: (config: T) => {
		forceDisableShowDevtoolsOnError?: boolean;
		forceEnableDeveloperKeybindings?: boolean;
		disallowReloadKeybinding?: boolean;
		removeDeveloperKeybindingsAfterLoad?: boolean;
	};
	beforeImport?: (config: T) => void;
}

export interface ILoadResult<M, T> {
	readonly result: M;
	readonly configuration: T;
}

export interface IBootstrapWindow {
	load<M, T extends ISandboxConfiguration = ISandboxConfiguration>(
		esModule: string,
		options: ILoadOptions<T>
	): Promise<ILoadResult<M, T>>;
}

//#endregion
