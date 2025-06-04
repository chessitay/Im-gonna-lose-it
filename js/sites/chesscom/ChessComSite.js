import { BaseSite } from '../BaseSite.js';

export class ChessComSite extends BaseSite {
    constructor() {
        super();
        this.name = 'chess.com';
        this.boardSelector = 'wc-chess-board, chess-board';
        this.moveListSelector = '.move-list, .moves, .notation-container';
        this.analysisContainerSelector = '#board-layout-analysis';
    }

    init() {
        this.setupObservers();
        this.injectStyles();
    }

    getCurrentFEN() {
        const board = this.getBoard();
        if (!board || !board.game) return null;
        return board.game.fen();
    }

    getMoveList() {
        const moveList = this.getMoveListElement();
        if (!moveList) return [];
        
        const moves = [];
        const moveElements = moveList.querySelectorAll('.move');
        moveElements.forEach(move => {
            const moveText = move.textContent.trim();
            if (moveText) moves.push(moveText);
        });
        return moves;
    }

    makeMove(move) {
        const board = this.getBoard();
        if (!board || !board.game) return false;
        
        try {
            board.game.move(move);
            return true;
        } catch (e) {
            console.error('Failed to make move:', e);
            return false;
        }
    }

    setupObservers() {
        // Observe board changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'WC-CHESS-BOARD' || node.tagName === 'CHESS-BOARD') {
                            if (Object.hasOwn(node, 'game')) {
                                this.onBoardFound(node);
                            }
                        }
                    }
                });
            });
        });

        observer.observe(document, {
            childList: true,
            subtree: true
        });

        // Store observer for cleanup
        this.observer = observer;
    }

    cleanup() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }

    onBoardFound(board) {
        // Initialize BetterMint with the found board
        window.dispatchEvent(new CustomEvent('BetterMintBoardFound', {
            detail: { board }
        }));
    }

    injectStyles() {
        // Inject site-specific styles
        const style = document.createElement('style');
        style.textContent = `
            .better-mint-analysis {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                pointer-events: none;
                z-index: 1000;
            }
            
            .better-mint-arrow {
                position: absolute;
                pointer-events: none;
                z-index: 1000;
            }
            
            .better-mint-highlight {
                position: absolute;
                pointer-events: none;
                z-index: 1000;
            }
        `;
        document.head.appendChild(style);
    }
} 