import { ChessComSite } from './chesscom/ChessComSite.js';

export class SiteManager {
    constructor() {
        this.sites = [
            new ChessComSite()
            // Add more sites here as they are implemented
        ];
        this.activeSite = null;
    }

    init() {
        // Find and initialize the active site
        this.activeSite = this.sites.find(site => site.isActive());
        if (this.activeSite) {
            console.log(`Initializing BetterMint for ${this.activeSite.name}`);
            this.activeSite.init();
        } else {
            console.log('No supported chess site detected');
        }
    }

    getActiveSite() {
        return this.activeSite;
    }

    cleanup() {
        if (this.activeSite) {
            this.activeSite.cleanup();
        }
    }
} 