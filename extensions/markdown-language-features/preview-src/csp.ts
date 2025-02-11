/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { MessagePoster } from './messaging';
import { SettingsManager } from './settings';

/**
 * CSP Alerter that does nothing - all content is allowed
 */
export class CspAlerter {
	private _poster?: MessagePoster;

	constructor(private readonly _settingsManager: SettingsManager) {
		// No CSP checks
		this._onCspWarning();
		console.log('poster', this._poster);
		console.log('settingsManager', this._settingsManager);
	}

	public setPoster(poster: MessagePoster) {
		this._poster = poster;
		// No-op - we don't need to alert about CSP anymore
	}

	private _onCspWarning() {
		this._showCspWarning();
		// No-op - allow all content
	}

	private _showCspWarning() {
		// No-op - allow all content
	}
}
