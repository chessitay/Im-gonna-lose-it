export const DefaultExtensionOptions = {
    "option-url-api-stockfish": "wss://ProtonnDev-engine.hf.space/stockfish-11",
    "option-api-stockfish": true,
    "option-num-cores": 1,
    "option-hashtable-ram": 1024,
    "option-depth": 15,
    "option-mate-finder-value": 3,
    "option-multipv": 3,
    "option-highmatechance": false,
    "option-show-hints": true,
    "option-move-analysis": true,
    "option-depth-bar": true,
    "option-evaluation-bar": true,
    "option-text-to-speech": false,
    "option-show-refutations": true,
    "option-show-threats": true,
    "option-threat-color": "#ff0000",
    "option-refutation-color": "#ff0000",
    "option-show-opponent-lines": true,
    "option-show-move-stats": true,
    "option-show-opening-info": true,
    "option-show-endgame-tablebase": true,
    "option-show-engine-battle": false,
    "option-show-time-management": true,
    "option-show-psychological-factors": true,
    "option-legit-auto-move": false,
    "option-random-best-move": false,
    "option-best-move-chance": 30,
    "option-auto-move-time": 5000,
    "option-auto-move-time-random": 1000,
    "option-auto-move-time-random-div": 10,
    "option-auto-move-time-random-multi": 1000,
    "option-premove-enabled": false,
    "option-max-premoves": 3,
    "option-premove-time": 1000,
    "option-premove-time-random": 500,
    "option-premove-time-random-div": 100,
    "option-premove-time-random-multi": 1,
    "option-arrow-color": "#5d3fd3"
};

export class SettingsManager {
    constructor() {
        this.settings = { ...DefaultExtensionOptions };
        this.unsavedChanges = false;
        this.storage = chrome?.storage?.sync || {
            get: (keys, callback) => {
                const result = {};
                if (keys === null) {
                    for (let i = 0; i < localStorage.length; i++) {
                        const k = localStorage.key(i);
                        try {
                            result[k] = JSON.parse(localStorage.getItem(k));
                        } catch {
                            result[k] = localStorage.getItem(k);
                        }
                    }
                } else if (Array.isArray(keys)) {
                    keys.forEach(key => {
                        try {
                            result[key] = JSON.parse(localStorage.getItem(key));
                        } catch {
                            result[key] = localStorage.getItem(key);
                        }
                    });
                } else if (typeof keys === 'string') {
                    try {
                        result[keys] = JSON.parse(localStorage.getItem(keys));
                    } catch {
                        result[keys] = localStorage.getItem(keys);
                    }
                }
                callback(result);
            },
            set: (items, callback) => {
                Object.entries(items).forEach(([key, value]) => {
                    localStorage.setItem(key, JSON.stringify(value));
                });
                callback && callback();
            },
            clear: (callback) => {
                localStorage.clear();
                callback && callback();
            }
        };
        this.listeners = new Set();
        this.initialized = false;
    }

    async loadSettings() {
        return new Promise((resolve) => {
            this.storage.get(null, (result) => {
                // Merge loaded settings with defaults
                this.settings = { ...DefaultExtensionOptions, ...result };
                this.initialized = true;
                this.notifySettingsUpdate();
                resolve(this.settings);
            });
        });
    }

    async saveSettings() {
        if (!this.initialized) return;

        return new Promise((resolve) => {
            this.storage.set(this.settings, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error saving settings:', chrome.runtime.lastError);
                } else {
                    this.notifySettingsUpdate();
                    this.unsavedChanges = false;
                }
                resolve();
            });
        });
    }

    async updateSettings(newSettings) {
        if (!this.initialized) return;
        
        // Update settings
        this.settings = { ...this.settings, ...newSettings };
        
        // Save settings immediately
        await this.saveSettings();
        
        // Notify all listeners
        this.notifySettingsUpdate();
    }

    getSetting(key) {
        if (!this.initialized) {
            return DefaultExtensionOptions[key];
        }
        return this.settings[key];
    }

    notifySettingsUpdate() {
        if (!this.initialized) return;

        // Notify all registered listeners
        this.listeners.forEach(listener => {
            try {
                listener(this.settings);
            } catch (error) {
                console.error('Error in settings listener:', error);
            }
        });

        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('BetterMintUpdateOptions', {
            detail: this.settings
        }));

        // Notify other tabs if in extension context
        if (chrome?.tabs) {
            chrome.tabs.query({}, tabs => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {
                        type: 'UpdateOptions',
                        data: this.settings
                    }).catch(() => {});
                });
            });
        }
    }

    addSettingsListener(listener) {
        this.listeners.add(listener);
        // Immediately notify the new listener of current settings
        if (this.initialized) {
            listener(this.settings);
        }
    }

    removeSettingsListener(listener) {
        this.listeners.delete(listener);
    }

    async resetSettings() {
        console.log('Resetting settings to defaults');
        this.settings = { ...DefaultExtensionOptions };
        return this.saveSettings();
    }

    exportSettings() {
        return JSON.stringify(this.settings, null, 2);
    }

    async importSettings(jsonString) {
        try {
            const importedSettings = JSON.parse(jsonString);
            console.log('Importing settings:', importedSettings);
            this.settings = { ...this.settings, ...importedSettings };
            return this.saveSettings();
        } catch (error) {
            throw new Error('Invalid settings file');
        }
    }

    hasUnsavedChanges() {
        return this.unsavedChanges;
    }

    // Helper method to get all current settings
    getAllSettings() {
        return { ...this.settings };
    }
} 