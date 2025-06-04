(function() {

    const BMA = window.BetterMintAnalysis;

    function openAnalysisWindow() {
        BMA.loadPreferences();

        if (BMA.overlayMode) {
            BMA.injectOverlayStyles();
            BMA.createOverlayWindow();
        } else {
            BMA.openPopupWindow();
        }
    }

    function setupGameStateMonitor() {
        let lastFEN = '';

        function checkGameState() {
            if (!window.BetterMintmaster?.game?.controller) return;

            const currentFEN = BetterMintmaster.game.controller.getFEN();
            if (!currentFEN) return;

            const currentPosition = currentFEN.split(' ')[0];
            const lastPosition = lastFEN ? lastFEN.split(' ')[0] : '';

            if (currentPosition !== lastPosition) {
                console.log('Game position changed, updating analysis');
                lastFEN = currentFEN;

                if (BMA.autoUpdate) {
                    if (BMA.overlayMode) {
                        const overlayWindow = document.getElementById('bettermint-analysis-window');
                        if (overlayWindow && overlayWindow.style.display !== 'none') {
                            BMA.updateOverlayAnalysis();
                        }
                    } else if (BMA.analysisWindow && !BMA.analysisWindow.closed) {
                        BMA.requestAnalysisUpdate();
                    }
                }
            }
        }

        const monitorInterval = setInterval(checkGameState, 500);

        try {
            const moveListElements = document.querySelectorAll('.move-list, .moves, .notation-container');
            moveListElements.forEach(element => {
                if (element) {
                    const observer = new MutationObserver(() => {
                        setTimeout(checkGameState, 100); 
                    });
                    observer.observe(element, { childList: true, subtree: true });
                }
            });
        } catch (e) {
            console.error('Failed to set up DOM observer:', e);
        }

        return monitorInterval;
    }

    function hookIntoStockfishEngine() {
        const checkInterval = setInterval(() => {
            if (window.StockfishEngine && StockfishEngine.prototype.onTopMoves) {
                clearInterval(checkInterval);

                const originalOnTopMoves = StockfishEngine.prototype.onTopMoves;

                StockfishEngine.prototype.onTopMoves = function(move, isBestMove) {
                    originalOnTopMoves.call(this, move, isBestMove);

                    if (BMA.overlayMode) {
                        const overlayWindow = document.getElementById('bettermint-analysis-window');

                        if (overlayWindow && 
                            overlayWindow.style.display !== 'none' && 
                            BMA.autoUpdate) {
                            BMA.updateOverlayAnalysis();
                        }
                    } else if (BMA.analysisWindow && !BMA.analysisWindow.closed && BMA.autoUpdate) {
                        BMA.requestAnalysisUpdate();
                    }
                };
            }
        }, 1000);
    }

    function initialize() {
        let isAnalysisWindowEnabled = false;

        window.addEventListener("BetterMintSendOptions", function (evt) {
            if (evt.detail && evt.detail.data) {
                isAnalysisWindowEnabled = evt.detail.data["option-show-analysis-window"] !== false;

                setupKeyboardShortcuts();

                if (isAnalysisWindowEnabled) {
                    const checkInterval = setInterval(() => {
                        if (window.BetterMintmaster) {
                            clearInterval(checkInterval);

                            if (!document.getElementById('bettermint-analysis-toggle')) {
                                createToggleButton();
                            }

                            hookIntoStockfishEngine();
                            setupGameStateMonitor();
                        }
                    }, 1000);
                } else {
                    const button = document.getElementById('bettermint-analysis-toggle');
                    if (button) {
                        button.remove();
                    }
                    BMA.closeAnalysisWindow();
                }
            }
        });

        window.dispatchEvent(
            new CustomEvent("BetterMintGetOptions", { 
                detail: { id: "analysis-window-init" } 
            })
        );

        window.addEventListener("BetterMintUpdateOptions", function(event) {
            if (event.detail && typeof event.detail["option-show-analysis-window"] !== 'undefined') {
                const newSetting = event.detail["option-show-analysis-window"];

                if (newSetting !== isAnalysisWindowEnabled) {
                    isAnalysisWindowEnabled = newSetting;

                    if (isAnalysisWindowEnabled) {
                        if (!document.getElementById('bettermint-analysis-toggle')) {
                            createToggleButton();
                        }
                        setupGameStateMonitor();
                    } else {
                        const button = document.getElementById('bettermint-analysis-toggle');
                        if (button) {
                            button.remove();
                        }
                        BMA.closeAnalysisWindow();
                    }
                }
            }
        });
    }

    window.BetterMintAnalysis = Object.assign(window.BetterMintAnalysis, {
        openAnalysisWindow,
        createToggleButton,
        setupKeyboardShortcuts,
        setupGameStateMonitor,
        hookIntoStockfishEngine,
        initialize
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();