export class BaseSite {
    constructor() {
        this.name = 'base';
        this.boardSelector = null;
        this.moveListSelector = null;
        this.analysisContainerSelector = null;
    }

    // Initialize the site-specific functionality
    init() {
        throw new Error('init() must be implemented by site class');
    }

    // Get the current FEN position
    getCurrentFEN() {
        throw new Error('getCurrentFEN() must be implemented by site class');
    }

    // Get the current move list
    getMoveList() {
        throw new Error('getMoveList() must be implemented by site class');
    }

    // Make a move on the board
    makeMove(move) {
        throw new Error('makeMove() must be implemented by site class');
    }

    // Get the board element
    getBoard() {
        return document.querySelector(this.boardSelector);
    }

    // Get the move list element
    getMoveListElement() {
        return document.querySelector(this.moveListSelector);
    }

    // Get the analysis container element
    getAnalysisContainer() {
        return document.querySelector(this.analysisContainerSelector);
    }

    // Check if the site is currently active
    isActive() {
        return window.location.hostname.includes(this.name);
    }

    // Setup site-specific observers
    setupObservers() {
        throw new Error('setupObservers() must be implemented by site class');
    }

    // Clean up site-specific observers
    cleanup() {
        throw new Error('cleanup() must be implemented by site class');
    }
} 