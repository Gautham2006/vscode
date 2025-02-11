import { BrowserWindow, BrowserView } from 'electron';

const TAB_BAR_HEIGHT = 30; // Reserve 30px height for a potential tab bar UI

export default class TabsManager {
	// Array to hold all tabs (each tab is represented by a BrowserView)
	private tabs: BrowserView[] = [];
	private activeIndex: number = -1;

	constructor(private win: BrowserWindow) {
		// When the window resizes, adjust the active tab bounds.
		this.win.on('resize', () => this.adjustBounds());
	}

	/**
	 * Adds a new tab loading the given URL.
	 * Returns the index of the new tab.
	 */
	public addTab(url: string): number {
		const view = new BrowserView({
			webPreferences: {
				contextIsolation: true,
				sandbox: true,
				nodeIntegration: false
			}
		});

		// Load the provided URL in the new tab.
		view.webContents.loadURL(url);
		this.tabs.push(view);
		const newIndex = this.tabs.length - 1;

		// if no active tab, set this one as active
		if (this.activeIndex === -1) {
			this.activeIndex = newIndex;
			this.win.addBrowserView(view);
			this.adjustBounds();
		}

		return newIndex;
	}

	/**
	 * Switches the active tab to the given index.
	 */
	public switchTab(index: number): void {
		if (index < 0 || index >= this.tabs.length) {
			console.warn('TabsManager.switchTab: Invalid tab index');
			return;
		}

		if (this.activeIndex === index) {
			return; // Already active
		}

		// Remove the current view
		if (this.activeIndex !== -1) {
			this.win.removeBrowserView(this.tabs[this.activeIndex]);
		}

		this.activeIndex = index;
		this.win.addBrowserView(this.tabs[this.activeIndex]);
		this.adjustBounds();
	}

	/**
	 * Closes the tab at the given index.
	 */
	public closeTab(index: number): void {
		if (index < 0 || index >= this.tabs.length) {
			console.warn('TabsManager.closeTab: Invalid tab index');
			return;
		}

		const view = this.tabs[index];

		// If closing the active tab, remove it from the window and switch to another one.
		if (this.activeIndex === index) {
			this.win.removeBrowserView(view);
			this.tabs.splice(index, 1);
			if (this.tabs.length > 0) {
				// Activate the previous tab if available, or the first tab
				const newIndex = index === 0 ? 0 : index - 1;
				this.activeIndex = newIndex;
				this.win.addBrowserView(this.tabs[newIndex]);
			} else {
				this.activeIndex = -1;
			}
		} else {
			// Remove tab from the array. If the closed tab comes before the active tab, adjust activeIndex.
			this.tabs.splice(index, 1);
			if (index < this.activeIndex) {
				this.activeIndex--;
			}
		}

		// Adjust bounds after closing a tab.
		this.adjustBounds();
	}

	/**
	 * Returns the current active BrowserView (or null if none).
	 */
	public getActiveTab(): BrowserView | null {
		if (this.activeIndex === -1) {
			return null;
		}

		return this.tabs[this.activeIndex];
	}

	/**
	 * Adjusts the bounds of the active tab so it fits inside the BrowserWindow.
	 * Reserves TAB_BAR_HEIGHT pixels at the top (for a tab bar UI if you add one).
	 */
	public adjustBounds(): void {
		const bounds = this.win.getContentBounds();
		if (this.activeIndex !== -1) {
			this.tabs[this.activeIndex].setBounds({
				x: 0,
				y: TAB_BAR_HEIGHT,
				width: bounds.width,
				height: bounds.height - TAB_BAR_HEIGHT
			});
		}
	}

	/**
	 * Closes the active tab.
	 */
	public closeActiveTab(): void {
		if (this.activeIndex !== -1) {
			this.closeTab(this.activeIndex);
		} else {
			console.warn('TabsManager.closeActiveTab: No active tab to close.');
		}
	}
}
