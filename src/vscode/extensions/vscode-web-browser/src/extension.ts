import * as vscode from 'vscode';

// ---------------------------------------------------------------------------
// Added stub implementations for missing helper functions
// You can later implement the actual logic as needed.
function saveBookmark(context: vscode.ExtensionContext, url: string, title: string): void {
	console.log("saveBookmark:", url, title);
}

function getBookmarks(context: vscode.ExtensionContext): any[] {
	// Return an example empty list or load your bookmarks from storage
	return [];
}

function saveHistory(context: vscode.ExtensionContext, url: string, title: string): void {
	console.log("saveHistory:", url, title);
}

function getHistory(context: vscode.ExtensionContext): any[] {
	return [];
}

function deleteHistoryItem(context: vscode.ExtensionContext, url: string): void {
	console.log("deleteHistoryItem:", url);
}

function clearHistory(context: vscode.ExtensionContext): void {
	console.log("clearHistory called");
}

function saveTabs(context: vscode.ExtensionContext, tabs: any[]): void {
	console.log("saveTabs:", tabs);
}

function getTabs(context: vscode.ExtensionContext): any[] {
	return [];
}

function handleProxyRequest(url: string, webview: vscode.Webview): void {
	console.log("handleProxyRequest:", url);
	// Example: Post a dummy HTML response as a proxy response.
	webview.postMessage({
		command: 'proxyResponse',
		data: `<html><body>Response for ${url}</body></html>`
	});
}
// ---------------------------------------------------------------------------

function getWebviewContent() {
	return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <!-- Make sure your CSP, styles, and scripts are set up appropriately -->
            <title>VS Code Browser</title>
            <style>
                /* Your styles for top panel, navbar, iframe, etc. */
            </style>
        </head>
        <body>
            <div id="topPanel">
                <!-- Navigation bar and tab container -->
            </div>
            <iframe id="browserFrame" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>
            <script>
                const vscode = acquireVsCodeApi();
                // Your JavaScript handling navigation, tab management, etc.
            </script>
        </body>
        </html>
    `;
}

class BrowserViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'mfolarin-vscode-web-browser.view';

	constructor(private readonly context: vscode.ExtensionContext) { }

	public resolveWebviewView(webviewView: vscode.WebviewView) {
		webviewView.webview.options = {
			enableScripts: true
		};

		webviewView.webview.html = getWebviewContent();

		// Handle messages from the webview exactly as before.
		webviewView.webview.onDidReceiveMessage(message => {
			switch (message.command) {
				case 'saveBookmark':
					saveBookmark(this.context, message.url, message.title);
					break;
				case 'getBookmarks': {
					const bookmarks = getBookmarks(this.context);
					webviewView.webview.postMessage({ command: 'updateBookmarks', bookmarks });
					break;
				}
				case 'saveHistory':
					saveHistory(this.context, message.url, message.title);
					break;
				case 'getHistory': {
					const history = getHistory(this.context);
					webviewView.webview.postMessage({ command: 'updateHistory', history });
					break;
				}
				case 'deleteHistoryItem':
					deleteHistoryItem(this.context, message.url);
					break;
				case 'clearHistory':
					clearHistory(this.context);
					break;
				case 'saveTabs':
					saveTabs(this.context, message.tabs);
					break;
				case 'getTabs': {
					const tabs = getTabs(this.context);
					webviewView.webview.postMessage({ command: 'restoreTabs', tabs });
					break;
				}
				case 'proxyRequest':
					handleProxyRequest(message.url, webviewView.webview);
					break;
			}
		});
	}
}

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "mfolarin-vscode-web-browser-extension" is now active!');

	// Register the BrowserViewProvider so the browser mounts on the left sidebar.
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(BrowserViewProvider.viewType, new BrowserViewProvider(context))
	);

	// (Optionally, remove any commands that previously opened the browser in a separate popup.)
}
