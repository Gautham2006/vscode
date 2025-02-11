import { BrowserWindow } from 'electron';
// import { fileURLToPath } from 'url';
// import * as path from 'path';
// import TabsManager from './tabsManager.js';

// Polyfill __dirname if we're in an ESM context:
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

/**
 * Creates a new Electron BrowserWindow (your "electron browser") that loads
 * a URL while using a preload that exposes the electronAPI. This gives the
 * renderer process access to functions like 'initBrowser' and 'navigate'.
 */
export function createElectronBrowserWindow(): BrowserWindow {
	const win = new BrowserWindow({
		width: 1200,
		height: 800,
		alwaysOnTop: true,
		autoHideMenuBar: true,
		webPreferences: {
			webviewTag: true,
			contextIsolation: true,
			sandbox: true,
			nodeIntegration: false
		}
	});

	// When the renderer calls window.open, create a new always-on-top window.
	win.webContents.setWindowOpenHandler(({ url }) => {
		createElectronBrowserWindow();
		return { action: 'deny' };
	});

	// Inline HTML that includes the tab system, navigation toolbar, and webview container.
	const html = `
	<!DOCTYPE html>
	<html lang="en">
	<head>
	  <meta charset="UTF-8">
	  <title>Always On Top Browser with Tabs</title>
	  <style>
		/* Ensure the root elements fill the window entirely */
		html, body {
		  margin: 0;
		  padding: 0;
		  height: 100vh;
		}
		body {
		  font-family: Arial, sans-serif;
		  background-color: #000;
		  color: white;
		  display: flex;
		  flex-direction: column;
		}
		/* Tab Bar container */
		#tabs-container {
		  display: flex;
		  background-color: #222;
		  padding: 5px;
		  flex: 0 0 auto; /* Fix height to fit content */
		}
		.tab {
		  padding: 5px 10px;
		  margin-right: 5px;
		  background-color: #444;
		  border-radius: 3px;
		  cursor: pointer;
		}
		.tab.active {
		  background-color: #666;
		}
		.tab .close {
		  margin-left: 5px;
		  color: red;
		  cursor: pointer;
		}
		/* Navigation toolbar */
		#browser-tools {
		  display: flex;
		  flex-direction: column;
		  padding: 5px;
		  background-color: #333;
		  flex: 0 0 auto; /* Fix height to fit content */
		}
		#button-container {
		  display: flex;
		  gap: 10px;
		  margin-bottom: 5px;
		}
		button {
		  cursor: pointer;
		  background-color: gray;
		  border: 2px solid #555;
		  border-radius: 20%;
		  padding: 5px 10px;
		  color: white;
		  font-size: 16px;
		}
		#url-input {
		  width: 75vw;
		  padding: 5px;
		  border: 2px solid gray;
		  border-radius: 5%;
		  font-size: 16px;
		}
		@media (max-width: 800px) {
		  #go {
			display: none;
		  }
		}
		/* Webview container */
		#webview-container {
		  /* Allow the container to fill the remaining space */
		  flex: 1 1 auto;
		  min-height: 0;
		  overflow: hidden;
		  position: relative;
		}
		webview {
		  width: 100%;
		  height: 100%;
		  border: none;
		  display: none;
		}
		webview.active {
		  display: block;
		}
	  </style>
	</head>
	<body>
	  <!-- Tab Bar -->
	  <div id="tabs-container">
		<!-- Tabs will be dynamically added before the new tab button -->
		<button id="new-tab-button" style="padding:5px;">+</button>
	  </div>

	  <!-- Navigation toolbar -->
	  <div id="browser-tools">
		<div id="button-container">
		  <button id="back-button">&#x2190;</button>
		  <button id="forward-button">&#x2192;</button>
		  <button id="reload-button">&#x21bb;</button>
		  <button id="search-button">&#x1F50D;</button>
		</div>
		<form id="url-form" onsubmit="handleURL(); return false;">
		  <input type="text" id="url-input" required placeholder="Enter URL">
		  <button type="submit" id="go">Go</button>
		</form>
	  </div>

	  <!-- Webview container -->
	  <div id="webview-container">
		<!-- Webviews will be added dynamically -->
	  </div>

	  <script>
		// Global state for tab management
		const tabs = []; // Array of tab objects: { id, title, webview, tabElement }
		let activeTabId = null;

		const tabsContainer = document.getElementById('tabs-container');
		const webviewContainer = document.getElementById('webview-container');
		const newTabButton = document.getElementById('new-tab-button');
		const urlInput = document.getElementById('url-input');
		const backButton = document.getElementById('back-button');
		const forwardButton = document.getElementById('forward-button');
		const reloadButton = document.getElementById('reload-button');
		const searchButton = document.getElementById('search-button');

		// Function to create a new tab with its own webview
		function createTab(url = 'https://www.google.com') {
		  const tabId = Date.now(); // unique identifier for the tab
		  const tabName = 'Tab ' + (tabs.length + 1);

		  // Create tab element
		  const tabElement = document.createElement('div');
		  tabElement.classList.add('tab');
		  tabElement.dataset.tabId = tabId;
		  tabElement.innerHTML = tabName + '<span class="close">&times;</span>';
		  // Insert the new tab before the new-tab-button
		  tabsContainer.insertBefore(tabElement, newTabButton);

		  // Create webview element for the tab
		  const webview = document.createElement('webview');
		  webview.src = url;
		  webview.setAttribute('preload', '');
		  webviewContainer.appendChild(webview);

		  // Add event listener for navigation updates
		  webview.addEventListener('did-navigate', (event) => {
			if (activeTabId == tabId) {
			  urlInput.value = event.url;
			}
		  });

		  // Add the new tab to our tabs array
		  const tabObj = { id: tabId, title: tabName, webview, tabElement };
		  tabs.push(tabObj);

		  // Setup event listeners for tab interactions
		  tabElement.addEventListener('click', () => switchTab(tabId));
		  tabElement.querySelector('.close').addEventListener('click', (e) => {
			e.stopPropagation();
			closeTab(tabId);
		  });

		  // Switch to the newly created tab
		  switchTab(tabId);
		}

		// Function to switch the active tab
		function switchTab(tabId) {
		  tabs.forEach(tab => {
			if (tab.id == tabId) {
			  tab.webview.classList.add('active');
			  tab.tabElement.classList.add('active');
			  activeTabId = tabId;
			  urlInput.value = tab.webview.src;
			} else {
			  tab.webview.classList.remove('active');
			  tab.tabElement.classList.remove('active');
			}
		  });
		}

		// Function to close a tab
		function closeTab(tabId) {
		  const tabIndex = tabs.findIndex(tab => tab.id == tabId);
		  if (tabIndex !== -1) {
			const tab = tabs[tabIndex];
			tab.webview.remove();
			tab.tabElement.remove();
			tabs.splice(tabIndex, 1);
			// If the closed tab was active, switch to another tab if available
			if (activeTabId == tabId && tabs.length > 0) {
			  switchTab(tabs[tabs.length - 1].id);
			}
		  }
		}

		// URL handling for the active tab
		function handleURL() {
		  let input = urlInput.value.trim();
		  let url;
		  if (input.indexOf(' ') !== -1 || input.indexOf('.') === -1) {
			url = 'https://www.google.com/search?q=' + encodeURIComponent(input);
		  } else if (!input.startsWith('http://') && !input.startsWith('https://')) {
			url = 'http://' + input;
		  } else {
			url = input;
		  }
		  const activeTab = tabs.find(tab => tab.id == activeTabId);
		  if (activeTab) {
			activeTab.webview.src = url;
		  }
		}

		// Navigation buttons functionality for the active tab
		backButton.addEventListener('click', () => {
		  const activeTab = tabs.find(tab => tab.id == activeTabId);
		  if (activeTab && activeTab.webview.canGoBack()) {
			activeTab.webview.goBack();
		  }
		});

		forwardButton.addEventListener('click', () => {
		  const activeTab = tabs.find(tab => tab.id == activeTabId);
		  if (activeTab && activeTab.webview.canGoForward()) {
			activeTab.webview.goForward();
		  }
		});

		reloadButton.addEventListener('click', () => {
		  const activeTab = tabs.find(tab => tab.id == activeTabId);
		  if (activeTab) {
			activeTab.webview.reload();
		  }
		});

		searchButton.addEventListener('click', () => {
		  const activeTab = tabs.find(tab => tab.id == activeTabId);
		  if (activeTab) {
			const googleURL = 'https://www.google.com';
			activeTab.webview.src = googleURL;
			urlInput.value = googleURL;
		  }
		});

		// Create the initial tab on load
		createTab();

		// New tab button event listener
		newTabButton.addEventListener('click', () => {
		  createTab();
		});

		// Update URL bar when Enter is pressed in the input field
		urlInput.addEventListener('keydown', (e) => {
		  if (e.key === 'Enter') {
			e.preventDefault();
			handleURL();
		  }
		});
	  </script>
	</body>
	</html>
	`;

	win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
	return win;
}
