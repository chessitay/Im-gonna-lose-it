export class UIManager {
    constructor() {
        this.tabs = null;
        this.tabContents = null;
        this.resetButton = null;
        this.exportButton = null;
        this.importButton = null;
        this.importInput = null;
        this.themeSelect = null;
        this.customThemeInputs = null;
        this.customThemePreview = null;
    }

    init() {
        // Get DOM elements
        this.tabs = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        this.resetButton = document.getElementById('reset-btn');
        this.exportButton = document.getElementById('export-btn');
        this.importButton = document.getElementById('import-btn');
        this.importInput = document.getElementById('import-file');
        this.themeSelect = document.getElementById('theme-select');
        this.customThemeInputs = document.querySelectorAll('.custom-theme-input');
        this.customThemePreview = document.getElementById('custom-theme-preview');
        
        this.initTabs();
        this.initSettingsButtons();
        this.initThemeControls();
    }

    initTabs() {
        if (!this.tabs || !this.tabContents) return;

        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.getAttribute('data-tab');
                
                // Update active tab
                this.tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Show corresponding content
                this.tabContents.forEach(content => {
                    content.classList.toggle('active', content.id === `${tabId}-tab`);
                });
            });
        });
    }

    initSettingsButtons() {
        // Reset settings
        if (this.resetButton) {
            this.resetButton.addEventListener('click', () => {
                if (confirm('Are you sure you want to reset all settings to default?')) {
                    chrome.runtime.sendMessage({ action: 'resetSettings' });
                }
            });
        }

        // Export settings
        if (this.exportButton) {
            this.exportButton.addEventListener('click', () => {
                chrome.runtime.sendMessage({ action: 'exportSettings' }, response => {
                    const blob = new Blob([response], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'bettermint-settings.json';
                    a.click();
                    URL.revokeObjectURL(url);
                });
            });
        }

        // Import settings
        if (this.importButton && this.importInput) {
            this.importButton.addEventListener('click', () => {
                this.importInput.click();
            });

            this.importInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            const settings = JSON.parse(event.target.result);
                            chrome.runtime.sendMessage({ 
                                action: 'importSettings', 
                                settings: settings 
                            });
                        } catch (error) {
                            alert('Invalid settings file');
                        }
                    };
                    reader.readAsText(file);
                }
            });
        }
    }

    initThemeControls() {
        // Theme selection
        if (this.themeSelect) {
            this.themeSelect.addEventListener('change', (e) => {
                const theme = e.target.value;
                if (theme === 'custom') {
                    document.getElementById('custom-theme-section').style.display = 'block';
                } else {
                    document.getElementById('custom-theme-section').style.display = 'none';
                    chrome.runtime.sendMessage({ 
                        action: 'updateSettings', 
                        settings: { 'selected-theme': theme } 
                    });
                }
            });
        }

        // Custom theme inputs
        if (this.customThemeInputs) {
            this.customThemeInputs.forEach(input => {
                input.addEventListener('input', () => this.updateCustomThemePreview());
            });
        }

        // Custom theme preview
        if (this.customThemePreview) {
            this.updateCustomThemePreview();
        }
    }

    updateCustomThemePreview() {
        if (!this.customThemePreview) return;

        const colors = {
            primary: document.getElementById('custom-primary')?.value,
            bg: document.getElementById('custom-bg')?.value,
            text: document.getElementById('custom-text')?.value
        };

        if (colors.primary) {
            this.customThemePreview.style.setProperty('--preview-primary', colors.primary);
        }
        if (colors.bg) {
            this.customThemePreview.style.setProperty('--preview-bg', colors.bg);
        }
        if (colors.text) {
            this.customThemePreview.style.setProperty('--preview-text', colors.text);
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
} 