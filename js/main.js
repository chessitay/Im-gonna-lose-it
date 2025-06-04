"use strict";

import { SiteManager } from './sites/SiteManager.js';
import { SettingsManager } from './backend/SettingsManager.js';
import { ThemeManager } from './backend/ThemeManager.js';
import { SearchManager } from './backend/SearchManager.js';
import { UIManager } from './backend/UIManager.js';
import ThreatsAndRefutations from './modules/analysis/ThreatsAndRefutations.js';
import { AnalysisTools } from './modules/ui/AnalysisTools.js';
import { StockfishEngine } from './modules/engine/StockfishEngine.js';
import { OpeningBook } from './modules/engine/OpeningBook.js';
import { Tablebase } from './modules/engine/Tablebase.js';
import { setSettingsManager } from './modules/core/Config.js';

class BetterMint {
    constructor() {
        this.siteManager = new SiteManager();
        this.settingsManager = new SettingsManager();
        this.themeManager = new ThemeManager();
        this.searchManager = new SearchManager();
        this.uiManager = new UIManager();
        this.threatsAndRefutations = new ThreatsAndRefutations();
        this.analysisTools = null;
        this.engine = null;
        this.chessboard = null;
        this.openingBook = new OpeningBook();
        this.tablebase = new Tablebase();

        // Set the settings manager in Config
        setSettingsManager(this.settingsManager);
    }

    async init() {
        // Initialize site detection and handling
        this.siteManager.init();

        // Load settings
        const settings = await this.settingsManager.loadSettings();
        
        // Apply theme
        const theme = settings['selected-theme'] || 'default';
        this.themeManager.applyTheme(theme);

        // Initialize UI
        this.uiManager.init();

        // Initialize search
        this.searchManager.init();

        // Listen for board found events
        window.addEventListener('BetterMintBoardFound', (event) => {
            this.onBoardFound(event.detail.board);
        });

        // Listen for settings changes
        window.addEventListener('BetterMintUpdateOptions', (event) => {
            this.onSettingsUpdated(event.detail);
        });
    }

    async onBoardFound(board) {
        console.log('Chess board found, initializing analysis...');
        
        try {
            // Store the board reference
            this.chessboard = board;
            
            // Initialize analysis tools with the board
            this.analysisTools = new AnalysisTools(this.chessboard);
            
            // Initialize engine
            this.engine = new StockfishEngine(this);
            await this.engine.initialize();
            
            // Start analysis
            this.engine.UpdatePosition();
            
            // Show analysis tools
            this.analysisTools.showAnalysis();
        } catch (error) {
            console.error('Failed to initialize analysis:', error);
        }
    }

    onSettingsUpdated(settings) {
        console.log('Settings updated:', settings);
        // Update components with new settings
        this.themeManager.applyTheme(settings['selected-theme'] || 'default');
        if (this.engine) {
            this.engine.UpdateExtensionOptions(settings);
        }
    }

    cleanup() {
        this.siteManager.cleanup();
        if (this.engine) {
            this.engine.stopEvaluation();
        }
    }

    // Public methods for external access
    getSettings() {
        return this.settingsManager.getSettings();
    }

    updateSettings(newSettings) {
        return this.settingsManager.updateSettings(newSettings);
    }

    resetSettings() {
        return this.settingsManager.resetSettings();
    }

    exportSettings() {
        return this.settingsManager.exportSettings();
    }

    importSettings(settings) {
        return this.settingsManager.importSettings(settings);
    }
}

// Initialize BetterMint when the extension loads
const betterMint = new BetterMint();
betterMint.init().catch(console.error);

// Clean up when the extension unloads
window.addEventListener('unload', () => {
    betterMint.cleanup();
});

// Make BetterMint available globally
window.BetterMint = betterMint;

// Export for module usage
export default betterMint; 