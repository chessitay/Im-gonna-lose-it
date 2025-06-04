import { SettingsManager } from './backend/SettingsManager.js';
import { ThemeManager } from './backend/ThemeManager.js';
import { SearchManager } from './backend/SearchManager.js';
import { UIManager } from './backend/UIManager.js';

// Initialize managers
const settingsManager = new SettingsManager();
const themeManager = new ThemeManager();
const searchManager = new SearchManager();
const uiManager = new UIManager();

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load settings and apply theme
    settingsManager.loadSettings().then(settings => {
        // Apply theme
        const theme = settings['selected-theme'] || 'default';
        themeManager.applyTheme(theme);
        
        // Initialize UI
        uiManager.init();
        
        // Initialize search
        searchManager.init();
        
        // Update theme select
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = theme;
        }
        
        // Update custom theme section visibility
        const customThemeSection = document.getElementById('custom-theme-section');
        if (customThemeSection) {
            customThemeSection.style.display = theme === 'custom' ? 'block' : 'none';
        }

        // Initialize sliders
        document.querySelectorAll('.slider').forEach(slider => {
            const container = slider.closest('.slider-container');
            const progress = container.querySelector('.slider-progress');
            
            const updateSlider = () => {
                const value = slider.value;
                const min = slider.min || 0;
                const max = slider.max || 100;
                const percent = ((value - min) / (max - min)) * 100;
                
                if (progress) {
                    progress.style.width = `${percent}%`;
                }
                
                const valueDisplay = container.querySelector('.value');
                if (valueDisplay) {
                    if (slider.id.includes('chance')) {
                        valueDisplay.textContent = `${value}%`;
                    } else if (slider.id.includes('time')) {
                        valueDisplay.textContent = `${value}ms`;
                    } else {
                        valueDisplay.textContent = value;
                    }
                }
            };
            
            slider.addEventListener('input', updateSlider);
            updateSlider();
            
            const plusBtn = container.querySelector('.plus');
            const minusBtn = container.querySelector('.minus');
            
            if (plusBtn && minusBtn) {
                plusBtn.addEventListener('click', () => {
                    slider.value = Math.min(parseInt(slider.value) + 1, parseInt(slider.max));
                    slider.dispatchEvent(new Event('input'));
                    settingsManager.updateSettings({ [slider.id]: parseInt(slider.value) });
                });
                
                minusBtn.addEventListener('click', () => {
                    slider.value = Math.max(parseInt(slider.value) - 1, parseInt(slider.min));
                    slider.dispatchEvent(new Event('input'));
                    settingsManager.updateSettings({ [slider.id]: parseInt(slider.value) });
                });
            }

            // Add change event listener for the slider
            slider.addEventListener('change', () => {
                settingsManager.updateSettings({ [slider.id]: parseInt(slider.value) });
            });
        });

        // Update all other settings in the UI
        Object.entries(settings).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element && !element.classList.contains('slider')) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else {
                    element.value = value;
                }

                // Add change event listeners
                element.addEventListener('change', (e) => {
                    const newValue = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
                    settingsManager.updateSettings({ [key]: newValue });
                });
            }
        });

        // Add save button handler
        const saveButton = document.getElementById('save-btn');
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                settingsManager.saveSettings().then(() => {
                    showToast('Settings saved successfully!', 'success');
                });
            });
        }

        // Add reset button handler
        const resetButton = document.getElementById('reset-btn');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                if (confirm('Are you sure you want to reset all settings to default?')) {
                    settingsManager.resetSettings().then(() => {
                        // Reload the page to reflect changes
                        window.location.reload();
                    });
                }
            });
        }
    });
});

// Listen for settings changes
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case 'settingsUpdated':
            // Update UI to reflect new settings
            Object.entries(message.settings).forEach(([key, value]) => {
                const element = document.getElementById(key);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = value;
                    } else {
                        element.value = value;
                    }
                }
            });
            break;
            
        case 'exportSettings':
            sendResponse(settingsManager.exportSettings());
            break;
            
        case 'importSettings':
            settingsManager.importSettings(message.settings);
            break;
            
        case 'resetSettings':
            settingsManager.resetSettings();
            break;
    }
});

// Helper function to show toast notifications
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

