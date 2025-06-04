(function() {

    const bmLog   = (...a) => window.BMAdebug && console.log  ('[BM]', ...a);
    const bmInfo  = (...a) => window.BMAdebug && console.info ('[BM]', ...a);
    const bmWarn  = (...a) => window.BMAdebug && console.warn ('[BM]', ...a);
    const bmError = (...a) => window.BMAdebug && console.error('[BM]', ...a);

    const BMA = window.BetterMintAnalysis;

    // Game state monitoring system
    let gameStateMonitor = {
        lastFEN: null,
        lastMoveCount: 0,
        monitorInterval: null,
        isMonitoring: false,
        
        start: function() {
            if (this.isMonitoring) return;
            
            this.isMonitoring = true;
            this.lastFEN = null;
            this.lastMoveCount = 0;
            
            // Monitor game state every 500ms
            this.monitorInterval = setInterval(() => {
                this.checkForChanges();
            }, 500);
            
            bmLog("Game state monitor started");
        },
        
        stop: function() {
            if (!this.isMonitoring) return;
            
            this.isMonitoring = false;
            if (this.monitorInterval) {
                clearInterval(this.monitorInterval);
                this.monitorInterval = null;
            }
            
            bmLog("Game state monitor stopped");
        },
        
        checkForChanges: function() {
            // Check if analysis window is open and auto-update is enabled
            if (!BMA.analysisWindow || BMA.analysisWindow.closed) {
                this.stop();
                return;
            }
            
            // Check if auto-update is enabled
            if (!BMA.autoUpdate) {
                return;
            }
            
            try {
                // Get current game state
                const controller = window.BetterMintmaster?.game?.controller;
                if (!controller) return;
                
                const currentFEN = controller.getFEN();
                const moveList = controller.getMoveList?.() || [];
                const currentMoveCount = moveList.length;
                
                // Check if FEN or move count has changed
                if (currentFEN !== this.lastFEN || currentMoveCount !== this.lastMoveCount) {
                    bmLog("Game state changed - FEN or moves updated");
                    
                    this.lastFEN = currentFEN;
                    this.lastMoveCount = currentMoveCount;
                    
                    // Send update to analysis window
                    requestAnalysisUpdate();
                }
            } catch (e) {
                bmError("Error checking game state:", e);
            }
        }
    };


    const streamproofHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BetterMint Streamproof Analysis (beta)</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Exo+2:400,500,600,700&display=swap">
    <link href='https://fonts.googleapis.com/css?family=Comfortaa:400,700&display=swap' rel='stylesheet'>
    <style>
      :root {
        --primary: #6a5acd;
        --primary-light: #8a7ae0;
        --primary-dark: #5546c2;
        --accent: #5d3fd3;
        --accent-bright: #7c63e4;
        --text-primary: #e4e4e4;
        --text-secondary: #b0b0b0;
        --bg-dark: #1e1e2a;
        --bg-darker: #15151f;
        --bg-card: #2a2a38;
        --bg-card-hover: #32323e;
        --positive: #5ad759;
        --negative: #ff5d5d;
        --mate: #ffcc00;
        --border-radius: 8px;
        --box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        --transition: all 0.2s ease-in-out;
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        margin: 0;
        padding: 0;
        font-family: "Exo 2", sans-serif;
        background-color: var(--bg-dark);
        color: var(--text-primary);
        overflow-x: hidden;
        line-height: 1.5;
      }

      .dark-theme {
        background-color: var(--bg-dark);
      }

      .ultra-dark-theme {
        background-color: var(--bg-darker);
      }

      .header {
        background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
        padding: 14px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: white;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }

      .header-title {
        font-weight: 700;
        font-size: 18px;
        font-family: Comfortaa, "Exo 2", sans-serif;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        letter-spacing: 0.5px;
      }

      .header-controls {
        display: flex;
        gap: 10px;
        align-items: center;
      }

      .content {
        padding: 20px;
        max-width: 900px;
        margin: 0 auto;
      }

      .move-sequence-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 20px;
        background-color: var(--bg-card);
        padding: 15px;
        border-radius: var(--border-radius);
        box-shadow: var(--box-shadow);
        transition: var(--transition);
      }

      .move-sequence-title {
        width: 100%;
        font-size: 14px;
        color: var(--text-secondary);
        margin-bottom: 8px;
        font-weight: 600;
      }

      .move-sequence-item {
        display: flex;
        align-items: center;
        font-size: 13px;
      }

      .sequence-color-sample {
        width: 18px;
        height: 6px;
        border-radius: 3px;
        margin-right: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      }

      .chessboard-container {
        width: 100%;
        max-width: 480px;
        margin: 0 auto 25px auto;
        aspect-ratio: 1;
        position: relative;
      }

      .chessboard {
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        grid-template-rows: repeat(8, 1fr);
        border: 3px solid var(--accent);
        border-radius: var(--border-radius);
        overflow: hidden;
        box-shadow: var(--box-shadow);
      }

      .square {
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        box-sizing: border-box;
        transition: background-color 0.2s;
      }

      .square.light {
        background-color: #e8e8e8;
      }

      .square.dark {
        background-color: #b0b0b0;
      }

      .piece {
        width: 85%;
        height: 85%;
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
        z-index: 2;
        transition: transform 0.15s ease;
      }

      .arrow-layer {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 3;
      }

      .highlight {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0.6;
        z-index: 1;
        pointer-events: none;
        border-radius: 10%;
      }

      .move-indicator {
        position: absolute;
        width: 8px;
        height: 8px;
        top: 2px;
        left: 2px;
        border-radius: 2px;
        z-index: 4;
        pointer-events: none;
      }

      .eval-label {
        position: absolute;
        top: 2px;
        left: 12px;
        font-size: 12px;
        font-weight: bold;
        color: white;
        text-shadow: 0 0 2px rgba(0,0,0,0.7);
        z-index: 4;
        pointer-events: none;
      }

      .controls-container {
        width: 100%;
        max-width: 480px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 15px;
      }

      .flip-board-button:hover {
        background-color: var(--bg-card-hover);
        transform: translateY(-1px);
      }

      .flip-board-button:active {
        transform: translateY(1px);
      }

     .board-navigation {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
      width: 100%;
    }

        .flip-board-nav {
        background-color: var(--bg-card);
        color: var(--text-primary);
        border: none;
        cursor: pointer;
        font-size: 14px;
        padding: 10px;
        border-radius: var(--border-radius);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--box-shadow);
        transition: var(--transition);
        font-weight: 500;
      }

      .flip-board-nav:hover {
        background-color: var(--bg-card-hover);
        transform: translateY(-1px);
      }

      .flip-board-nav:active {
        transform: translateY(1px);
      }

      .stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(2, 1fr);
      gap: 15px;
      margin-top: 30px; 
      margin-bottom: 25px;
    }

      .nav-button {
        background-color: var(--accent);
        color: white;
        border: none;
        border-radius: var(--border-radius);
        padding: 10px;
        cursor: pointer;
        font-size: 15px;
        transition: var(--transition);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      }

      .nav-button:hover {
        background-color: var(--accent-bright);
        transform: translateY(-1px);
      }

      .nav-button:active {
        transform: translateY(1px);
      }

      .nav-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none !important;
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: repeat(2, 1fr);
        gap: 15px;
        margin-bottom: 25px;
      }

      .stat-box {
        background-color: var(--bg-card);
        padding: 15px;
        border-radius: var(--border-radius);
        text-align: center;
        box-shadow: var(--box-shadow);
        transition: var(--transition);
      }

      .stat-box:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 14px rgba(0, 0, 0, 0.25);
      }

      .stat-value {
        font-size: 20px;
        font-weight: 700;
        margin-bottom: 5px;
        transition: color 0.2s;
      }

      .stat-label {
        font-size: 12px;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      }

      .lines-container {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }

      .line {
        padding: 15px;
        border-radius: var(--border-radius);
        background-color: var(--bg-card);
        cursor: pointer;
        transition: var(--transition);
        box-shadow: var(--box-shadow);
        border-left: 4px solid transparent;
      }

      .line:hover {
        background-color: var(--bg-card-hover);
        transform: translateY(-2px);
      }

      .line.active {
        background-color: var(--bg-card-hover);
        border-left: 4px solid var(--accent);
      }

      .line-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .line-number {
        font-weight: 600;
        color: var(--accent);
        font-size: 15px;
      }

      .line-eval {
        font-weight: 700;
        font-size: 16px;
        padding: 3px 8px;
        border-radius: 4px;
        background-color: rgba(255, 255, 255, 0.1);
      }

      .positive {
        color: var(--positive);
      }

      .negative {
        color: var(--negative);
      }

      .mate {
        color: var(--mate);
      }

      .line-depth {
        font-size: 12px;
        color: var(--text-secondary);
        margin-top: 3px;
        font-weight: 500;
      }

      .line-moves {
        font-family: 'Courier New', monospace;
        line-height: 1.6;
        word-wrap: break-word;
        padding: 8px;
        background-color: rgba(0, 0, 0, 0.15);
        border-radius: 4px;
        margin-top: 8px;
        font-size: 14px;
      }

      .line-controls {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 10px;
      }

      .play-button, .stop-button {
        background-color: var(--accent);
        color: white;
        border: none;
        border-radius: var(--border-radius);
        padding: 8px 12px;
        font-size: 13px;
        cursor: pointer;
        transition: var(--transition);
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .play-button:hover {
        background-color: var(--accent-bright);
      }

      .stop-button {
        background-color: #e74c3c;
      }

      .stop-button:hover {
        background-color: #c0392b;
      }

      .button {
        background-color: var(--accent);
        color: white;
        border: none;
        border-radius: var(--border-radius);
        padding: 10px 15px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        transition: var(--transition);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .button:hover {
        background-color: var(--accent-bright);
        transform: translateY(-1px);
      }

      .button:active {
        transform: translateY(1px);
      }

      .refresh-button, .mode-toggle, .eval-mode-toggle {
        padding: 8px 15px;
      }

      .mode-toggle {
        background-color: var(--primary-dark);
      }

      .mode-toggle:hover {
        background-color: var(--primary);
      }

      .eval-mode-toggle {
        background-color: var(--primary-dark);
      }

      .eval-mode-toggle:hover {
        background-color: var(--primary);
      }

      .no-data {
        text-align: center;
        margin-top: 50px;
        color: var(--text-secondary);
        font-style: italic;
        padding: 30px;
        background-color: var(--bg-card);
        border-radius: var(--border-radius);
        box-shadow: var(--box-shadow);
      }

      .settings-button {
        background-color: transparent;
        color: white;
        border: none;
        cursor: pointer;
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        transition: var(--transition);
      }

      .settings-button:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }

      .settings-panel {
        position: absolute;
        top: 60px;
        right: 15px;
        width: 320px;
        background-color: var(--bg-card);
        border-radius: var(--border-radius);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
        z-index: 100;
        display: none;
        border: 1px solid rgba(255, 255, 255, 0.1);
        overflow: hidden;
      }

      .ultra-dark-theme .settings-panel {
        background-color: var(--bg-darker);
      }

      .settings-panel.visible {
        display: block;
      }

      .settings-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
      }

      .settings-header h3 {
        margin: 0;
        font-size: 16px;
        color: white;
        font-weight: 600;
      }

      .settings-close {
        background: none;
        border: none;
        color: white;
        font-size: 22px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 30px;
        width: 30px;
        padding: 0;
        border-radius: 50%;
        transition: var(--transition);
      }

      .settings-close:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }

      .settings-content {
        padding: 20px;
      }

      .settings-section {
        margin-bottom: 25px;
      }

      .settings-section h4 {
        margin: 0 0 15px 0;
        font-size: 14px;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      }

      .settings-option {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }

      .settings-option label {
        font-size: 14px;
        font-weight: 500;
      }

      .settings-slider-container {
        display: flex;
        align-items: center;
        width: 140px;
      }

      .settings-slider {
        -webkit-appearance: none;
        width: 100px;
        height: 6px;
        border-radius: 3px;
        background: #444;
        outline: none;
        margin-right: 12px;
      }

      .settings-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--accent);
        cursor: pointer;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      }

      .settings-slider::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: var(--accent);
        cursor: pointer;
        border: none;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      }

      #future-moves-value {
        width: 25px;
        text-align: center;
        font-weight: 600;
      }

      #playback-speed-value {
        width: 50px;
        text-align: center;
        font-weight: 600;
      }

      .settings-switch {
        position: relative;
        display: inline-block;
        width: 44px;
        height: 22px;
      }

      .settings-switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .settings-switch-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #444;
        border-radius: 22px;
        transition: .3s;
      }

      .settings-switch-slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 2px;
        bottom: 2px;
        background-color: white;
        border-radius: 50%;
        transition: .3s;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      }

      input:checked + .settings-switch-slider {
        background-color: var(--accent);
      }

      input:checked + .settings-switch-slider:before {
        transform: translateX(22px);
      }

      .theme-buttons {
        display: flex;
        gap: 8px;
      }

      .theme-btn {
        background-color: #444;
        border: none;
        color: white;
        padding: 7px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        transition: var(--transition);
        font-weight: 500;
      }

      .theme-btn.active {
        background-color: var(--accent);
      }

      .theme-btn:hover:not(.active) {
        background-color: #555;
      }

      @media (max-width: 768px) {
        .content {
          padding: 15px;
        }

        .stats {
          grid-template-columns: 1fr;
          grid-template-rows: repeat(4, 1fr);
        }
      }

      ::-webkit-scrollbar {
        width: 8px;
      }

      ::-webkit-scrollbar-track {
        background: var(--bg-darker);
        border-radius: 4px;
      }

      ::-webkit-scrollbar-thumb {
        background: var(--accent);
        border-radius: 4px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: var(--accent-bright);
      }
    </style>
    </head>
    <body class="dark-theme">
    <div class="header">
      <div class="header-title">BetterMint Analysis</div>
      <div class="header-controls">
        <button class="button refresh-button" id="refresh-button">Refresh</button>
        <button class="button mode-toggle" id="mode-toggle">Overlay Mode</button>
        <button class="button eval-mode-toggle" id="eval-mode-toggle">Evaluation Mode</button>
        <button class="settings-button" id="settings-button" title="Settings">⚙️</button>
      </div>
    </div>

    <!-- Settings Panel -->
    <div class="settings-panel" id="settings-panel">
      <div class="settings-header">
        <h3>Settings</h3>
        <button class="settings-close" id="settings-close">×</button>
      </div>

      <div class="settings-content">
        <div class="settings-section">
          <h4>Future Moves</h4>
          <div class="settings-option">
            <label for="future-moves-slider">Number of future moves to show:</label>
            <div class="settings-slider-container">
              <input type="range" id="future-moves-slider" min="1" max="10" value="5" class="settings-slider">
              <span id="future-moves-value">5</span>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h4>Playback Speed</h4>
          <div class="settings-option">
            <label for="playback-speed-slider">Speed of move playback:</label>
            <div class="settings-slider-container">
              <input type="range" id="playback-speed-slider" min="1" max="10" value="5" class="settings-slider">
              <span id="playback-speed-value">1s</span>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h4>Auto-Update</h4>
          <div class="settings-option">
            <label for="settings-auto-update">Automatically update analysis:</label>
            <label class="settings-switch">
              <input type="checkbox" id="settings-auto-update" checked>
              <span class="settings-switch-slider"></span>
            </label>
          </div>
        </div>

        <div class="settings-section">
          <h4>Theme</h4>
          <div class="settings-option">
            <label>Choose theme:</label>
            <div class="theme-buttons">
              <button id="dark-theme-btn" class="theme-btn active">Dark</button>
              <button id="ultra-dark-theme-btn" class="theme-btn">Ultra Dark</button>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h4>Opponent Responses</h4>
          <div class="settings-option">
            <label for="settings-show-opponent-responses">Show opponent's best response for top moves:</label>
            <label class="settings-switch">
              <input type="checkbox" id="settings-show-opponent-responses">
              <span class="settings-switch-slider"></span>
            </label>
          </div>
        </div>

          <h4>Auto-Refresh Position</h4>
            <div class="settings-option">
              <label for="settings-auto-refresh-position">Automatically refresh position after playing a line:</label>
              <label class="settings-switch">
                <input type="checkbox" id="settings-auto-refresh-position" checked>
                <span class="settings-switch-slider"></span>
              </label>
            </div>
      </div>
    </div>

    <div class="content">
      <!-- Move sequence legend -->
      <div class="move-sequence-legend">
        <div class="move-sequence-title">Moves in Sequence:</div>
        <div class="move-sequence-item">
          <div class="sequence-color-sample" style="background-color: #42A5F5;"></div>
          <span>First</span>
        </div>
        <div class="move-sequence-item">
          <div class="sequence-color-sample" style="background-color: #66BB6A;"></div>
          <span>Second</span>
        </div>
        <div class="move-sequence-item">
          <div class="sequence-color-sample" style="background-color: #FFEB3B;"></div>
          <span>Third</span>
        </div>
        <div class="move-sequence-item">
          <div class="sequence-color-sample" style="background-color: #FFC107;"></div>
          <span>Fourth</span>
        </div>
          <div class="move-sequence-item">
          <div class="sequence-color-sample" style="background-color: #FF5252;"></div>
          <span>Fifth+</span>
        </div>
        <div class="move-sequence-item">
          <div class="sequence-color-sample opponent-color-sample" style="background-color: #FF7043;"></div>
          <span>Opponent Moves</span>
        </div>
      </div>

      <!-- Chess board section -->
      <div class="chessboard-container">
        <div class="chessboard" id="chessboard"></div>
        <div class="arrow-layer" id="arrow-layer"></div>
      </div>

      <div class="controls-container">
        <!-- Navigation controls with Flip Board in the middle -->
        <div class="board-navigation">
          <button id="go-to-start" class="nav-button" title="Go to initial position">⏮</button>
          <button id="go-backward" class="nav-button" title="Go back one move">⏪</button>
          <button id="flip-board" class="flip-board-nav" title="Flip board orientation">Flip Board</button>
          <button id="go-forward" class="nav-button" title="Go forward one move">⏩</button>
          <button id="go-to-end" class="nav-button" title="Go to latest position">⏭</button>
        </div>
      </div>

      <!-- Stats section -->
      <div class="stats">
        <div class="stat-box">
          <div class="stat-value" id="depth">0</div>
          <div class="stat-label">Depth</div>
        </div>
        <div class="stat-box">
          <div class="stat-value" id="position-eval">0.00</div>
          <div class="stat-label">Evaluation</div>
        </div>
        <div class="stat-box">
          <div class="stat-value" id="best-move">--</div>
          <div class="stat-label">Best Move</div>
        </div>
        <div class="stat-box">
          <div class="stat-value" id="move-quality">--</div>
          <div class="stat-label">Last Move</div>
        </div>
      </div>

      <!-- Lines section -->
      <div class="lines-container" id="lines-container">
        <div class="no-data" id="no-data-message">Waiting for analysis data...</div>
      </div>
    </div>

    <script>

        window.BMAdebug = false;              

        const bmLog   = (...a) => window.BMAdebug && console.log  ('[BM]', ...a);
        const bmInfo  = (...a) => window.BMAdebug && console.info ('[BM]', ...a);
        const bmWarn  = (...a) => window.BMAdebug && console.warn ('[BM]', ...a);
        const bmError = (...a) => window.BMAdebug && console.error('[BM]', ...a);

      const pieceImages = {
        'p': "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0NSIgaGVpZ2h0PSI0NSI+PHBhdGggZD0iTTIyLjUgOWMtMi4yMSAwLTQgMS43OS00IDQgMCAuODkuMjkgMS43MS43OCAyLjM4QzE3LjMzIDE2LjUgMTYgMTguNTkgMTYgMjFjMCAyLjAzLjk0IDMuODQgMi40MSA1LjAzLTMgMS4wNi03LjQxIDUuNTUtNy40MSAxMy40N2gyM2MwLTcuOTItNC40MS0xMi40MS03LjQxLTEzLjQ3IDEuNDctMS4xOSAyLjQxLTMgMi40MS01LjAzIDAtMi40MS0xLjMzLTQuNS0zLjI4LTUuNjIuNDktLjY3Ljc4LTEuNDkuNzgtMi4zOCAwLTIuMjEtMS43OS00LTQtNHoiIGZpbGw9IiMwMDAiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==",
        'r': "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0NSIgaGVpZ2h0PSI0NSI+PGcgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik05IDM5aDI3di0zSDl2M3ptMy41LTdsMS41LTIuNWgxN2wxLjUgMi41aC0yMHptLS41IDR2LTRoMjF2NEgxMnoiIHN0cm9rZS1saW5lY2FwPSJidXR0Ii8+PHBhdGggZD0iTTE0IDI5LjV2LTEzaDE3djEzSDE0eiIgc3Ryb2tlLWxpbmVjYXA9ImJ1dHQiIHN0cm9rZS1saW5lam9pbj0ibWl0ZXIiLz48cGF0aCBkPSJNMTQgMTYuNUwxMSAxNGgyM2wtMyAyLjVIMTR6TTExIDE0VjloNHYyaDVWOWg1djJoNVY5aDR2NUgxMXoiIHN0cm9rZS1saW5lY2FwPSJidXR0Ii8+PHBhdGggZD0iTTEyIDM1LjVoMjFtLTIwLTRoMTltLTE4LTJoMTdtLTE3LTEzaDE3TTExIDE0aDIzIiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMSIvPjwvZz48L3N2Zz4=",
        'n': "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0NSIgaGVpZ2h0PSI0NSI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMiAxMGMxMC41IDEgMTYuNSA4IDE2IDI5SDE1YzAtOSAxMC02LjUgOC0yMSIgZmlsbD0iIzAwMCIvPjxwYXRoIGQ9Ik0yNCAxOGMuMzggMi45MS01LjU1IDcuMzctOCA5LTMgMi0yLjgyIDQuMzQtNSA0LTEuMDQyLS45NCAxLjQxLTMuMDQgMC0zLTEgMCAuMTkgMS4yMy0xIDItMSAwLTQuMDAzIDEtNC0yIDAtMSA2LTEyIDYtMTJzMS44OS0xLjkgMi0zLjVjLS43My0uOTk0LS41LTItLjUtMyAxLTEgMyAyLjUgMyAyLjVoMnMuNzgtMS45OTIgMi41LTNjMSAwIDEgMyAxIDMiIGZpbGw9IiMwMDAiLz48cGF0aCBkPSJNOS41IDI1LjVhLjUuNSAwIDEgMS0xIDAgLjUuNSAwIDEgMSAxIDB6bTUuNDMzLTkuNzVhLjUgMS41IDMwIDEgMS0uODY2LS41LjUgMS41IDMwIDEgMSAuODY2LjV6IiBmaWxsPSIjZWNlY2VjIiBzdHJva2U9IiNlY2VjZWMiLz48cGF0aCBkPSJNMjQuNTUgMTAuNGwtLjQ1IDEuNDUuNS4xNWMzLjE1IDEgNS42NSAyLjQ5IDcuOSA2Ljc1UzM1Ljc1IDI5LjA2IDM1LjI1IDM5bC0uMDUuNWgyLjI1bC4wNS0uNWMuNS0xMC4wNi0uODgtMTYuODUtMy4yNS0yMS4zNC0yLjM3LTQuNDktNS43OS02LjY0LTkuMTktNy4xNmwtLjUxLS4xeiIgZmlsbD0iI2VjZWNlYyIgc3Ryb2tlPSJub25lIi8+PC9nPjwvc3ZnPg==",
        'b': "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0NSIgaGVpZ2h0PSI0NSI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxnIGZpbGw9IiMwMDAiIHN0cm9rZS1saW5lY2FwPSJidXR0Ij48cGF0aCBkPSJNOSAzNmMzLjM5LS45NyAxMC4xMS40MyAxMy41LTIgMy4zOSAyLjQzIDEwLjExIDEuMDMgMTMuNSAyIDAgMCAxLjY1LjU0IDMgMi0uNjguOTctMS42NS45OS0zIC41LTMuMzktLjk3LTEwLjExLjQ2LTEzLjUtMS0zLjM5IDEuNDYtMTAuMTEuMDMtMTMuNSAxLTEuMzU0LjQ5LTIuMzIzLjQ3LTMtLjUgMS4zNTQtMS45NCAzLTIgMy0yeiIvPjxwYXRoIGQ9Ik0xNSAzMmMyLjUgMi41IDEyLjUgMi41IDE1IDAgLjUtMS41IDAtMiAwLTIgMC0yLjUtMi41LTQtMi41LTQgNS41LTEuNSA2LTExLjUtNS0xNS41LTExIDQtMTAuNSAxNC01IDE1LjUgMCAwLTIuNSAxLjUtMi41IDQgMCAwLS41LjUgMCAyeiIvPjxwYXRoIGQ9Ik0yNSA4YTIuNSAyLjUgMCAxIDEtNSAwIDIuNSAyLjUgMCAxIDEgNSAweiIvPjwvZz48cGF0aCBkPSJNMTcuNSAyNmgxME0xNSAzMGgxNW0tNy41LTE0LjV2NU0yMCAxOGg1IiBzdHJva2U9IiNlY2VjZWMiIHN0cm9rZS1saW5lam9pbj0ibWl0ZXIiLz48L2c+PC9zdmc+",
        'q': "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0NSIgaGVpZ2h0PSI0NSI+PGcgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxnIHN0cm9rZT0ibm9uZSI+PGNpcmNsZSBjeD0iNiIgY3k9IjEyIiByPSIyLjc1Ii8+PGNpcmNsZSBjeD0iMTQiIGN5PSI5IiByPSIyLjc1Ii8+PGNpcmNsZSBjeD0iMjIuNSIgY3k9IjgiIHI9IjIuNzUiLz48Y2lyY2xlIGN4PSIzMSIgY3k9IjkiIHI9IjIuNzUiLz48Y2lyY2xlIGN4PSIzOSIgY3k9IjEyIiByPSIyLjc1Ii8+PC9nPjxwYXRoIGQ9Ik05IDI2YzguNS0xLjUgMjEtMS41IDI3IDBsMi41LTEyLjVMMzEgMjVsLS4zLTE0LjEtNS4yIDEzLjYtMy0xNC41LTMgMTQuNS01LjItMTMuNkwxNCAyNSA2LjUgMTMuNSA5IDI2eiIgc3Ryb2tlLWxpbmVjYXA9ImJ1dHQiLz48cGF0aCBkPSJNOSAyNmMwIDIgMS41IDIgMi41IDQgMSAxLjUgMSAxIC41IDMuNS0xLjUgMS0xLjUgMi41LS41IDIuNS41IC4yNSAxLjUgLjUgMS41IC41IDBsLS4xOCAxLjVoLTd2LTFoLjVzLjUtLjUgLjUtMXYtLjVjLS41LTEuNS0uNS0yLTEtMy41LS41LTEuNS0xLjUtMy0xLjUtM3YtMXMuNS0xIDEtMWguNXMxIDAgMSAxYy0uNSAxIC41IDIgLjUgMnptMjcgMGMwIDIgLTEuNSAyLTIuNSA0LTEgMS41LTEgMSAwIDMuNSAxIDEgMSAyLjUgMCAyLjUtLjUuMjUtMS41LjUtMS41LjUgMGwuMTggMS41aDd2LTFoLS41cy0uNS0uNS0uNi0xdi0uNWMuNS0xLjUuNS0yIDEtMy41LjUtMS41IDEuNS0zIDEuNS0zdi0xcy0uNS0xLTEtMWgtLjVzLTEgMC0xIDFjLjUgMS0uNSAyLS41IDJ6IiBmaWxsPSIjMDAwIi8+PHBhdGggZD0iTTExIDM4LjVhMzUgMzUgMSAwIDAgMjMgMCIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9ImJ1dHQiLz48cGF0aCBkPSJNMTEgMjlhMzUgMzUgMSAwIDEgMjMgMG0tMjEuNSAyLjVoMjBtLTIxIDNhMzUgMzUgMSAwIDAgMjIgMG0tMjMgM2EzNSAzNSAxIDAgMCAyNCAwIiBmaWxsPSJub25lIiBzdHJva2U9IiNlY2VjZWMiLz48L2c+PC9zdmc+",
        'k': "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0NSIgaGVpZ2h0PSI0NSI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMi41IDExLjYzVjZNMjAgOGg1IiBzdHJva2UtbGluZWpvaW49Im1pdGVyIi8+PHBhdGggZD0iTTIyLjUgMjVzNC41LTcuNSAzLTEwLjVjMCAwLTEtMi41LTMtMi41cy0zIDIuNS0zIDIuNWMtMS41IDMgMyAxMC41IDMgMTAuNSIgZmlsbD0iIzAwMCIgc3Ryb2tlLWxpbmVjYXA9ImJ1dHQiIHN0cm9rZS1saW5lam9pbj0ibWl0ZXIiLz48cGF0aCBkPSJNMTEuNSAzN2M1LjUgMy41IDE1LjUgMy41IDIxIDB2LTdzOS00LjUgNi0xMC41Yy00LTYuNS0xMy41LTMuNS0xNiA0VjI3di0zLjVjLTMuNS03LjUtMTMtMTAuNS0xNi00LTMgNiA1IDEwIDUgMTBWMzd6IiBmaWxsPSIjMDAwIi8+PHBhdGggZD0iTTExLjUgMzBjNS41LTMgMTUuNS0zIDIxIDBtLTIxIDMuNWM1LjUtMyAxNS41LTMgMjEgMG0tMjEgMy41YzUuNS0zIDE1LjUtMyAyMSAwIiBzdHJva2U9IiNlY2VjZWMiLz48L2c+PC9zdmc+",
        'P': "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0NSIgaGVpZ2h0PSI0NSI+PHBhdGggZD0iTTIyLjUgOWMtMi4yMSAwLTQgMS43OS00IDQgMCAuODkuMjkgMS43MS43OCAyLjM4QzE3LjMzIDE2LjUgMTYgMTguNTkgMTYgMjFjMCAyLjAzLjk0IDMuODQgMi40MSA1LjAzLTMgMS4wNi03LjQxIDUuNTUtNy40MSAxMy40N2gyM2MwLTcuOTItNC40MS0xMi40MS03LjQxLTEzLjQ3IDEuNDctMS4xOSAyLjQxLTMgMi40MS01LjAzIDAtMi40MS0xLjMzLTQuNS0zLjI4LTUuNjIuNDktLjY3Ljc4LTEuNDkuNzgtMi4zOCAwLTIuMjEtMS43OS00LTQtNHoiIGZpbGw9IiNmZmYiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==",
        'R': "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0NSIgaGVpZ2h0PSI0NSI+PGcgZmlsbD0iI2ZmZiIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik05IDM5aDI3di0zSDl2M3ptMy0zdi00aDIxdjRIMTJ6bS0xLTIyVjloNHYyaDVWOWg1djJoNVY5aDR2NSIgc3Ryb2tlLWxpbmVjYXA9ImJ1dHQiLz48cGF0aCBkPSJNMzQgMTRsLTMgM0gxNGwtMy0zIi8+PHBhdGggZD0iTTMxIDE3djEyLjVIMTRWMTciIHN0cm9rZS1saW5lY2FwPSJidXR0IiBzdHJva2UtbGluZWpvaW49Im1pdGVyIi8+PHBhdGggZD0iTTMxIDI5LjVsMS41IDIuNWgtMjBsMS41LTIuNSIvPjxwYXRoIGQ9Ik0xMSAxNGgyMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVqb2luPSJtaXRlciIvPjwvZz48L3N2Zz4=",
        'N': "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0NSIgaGVpZ2h0PSI0NSI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMiAxMGMxMC41IDEgMTYuNSA4IDE2IDI5SDE1YzAtOSAxMC02LjUgOC0yMSIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik0yNCAxOGMuMzggMi45MS01LjU1IDcuMzctOCA5LTMgMi0yLjgyIDQuMzQtNSA0LTEuMDQyLS45NCAxLjQxLTMuMDQgMC0zLTEgMCAuMTkgMS4yMy0xIDItMSAwLTQuMDAzIDEtNC0yIDAtMSA2LTEyIDYtMTJzMS44OS0xLjkgMi0zLjVjLS43My0uOTk0LS41LTItLjUtMyAxLTEgMyAyLjUgMyAyLjVoMnMuNzgtMS45OTIgMi41LTNjMSAwIDEgMyAxIDMiIGZpbGw9IiNmZmYiLz48cGF0aCBkPSJNOS41IDI1LjVhLjUuNSAwIDEgMS0xIDAgLjUuNSAwIDEgMSAxIDB6bTUuNDMzLTkuNzVhLjUgMS41IDMwIDEgMS0uODY2LS41LjUgMS41IDMwIDEgMSAuODY2LjV6IiBmaWxsPSIjMDAwIi8+PC9nPjwvc3ZnPg==",
        'B': "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0NSIgaGVpZ2h0PSI0NSI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxnIGZpbGw9IiNmZmYiIHN0cm9rZS1saW5lY2FwPSJidXR0Ij48cGF0aCBkPSJNOSAzNmMzLjM5LS45NyAxMC4xMS40MyAxMy41LTIgMy4zOSAyLjQzIDEwLjExIDEuMDMgMTMuNSAyIDAgMCAxLjY1LjU0IDMgMi0uNjguOTctMS42NS45OS0zIC41LTMuMzktLjk3LTEwLjExLjQ2LTEzLjUtMS0zLjM5IDEuNDYtMTAuMTEuMDMtMTMuNSAxLTEuMzU0LjQ5LTIuMzIzLjQ3LTMtLjUgMS4zNTQtMS45NCAzLTIgMy0yeiIvPjxwYXRoIGQ9Ik0xNSAzMmMyLjUgMi41IDEyLjUgMi41IDE1IDAgLjUtMS41IDAtMiAwLTIgMC0yLjUtMi41LTQtMi41LTQgNS41LTEuNSA2LTExLjUtNS0xNS41LTExIDQtMTAuNSAxNC01IDE1LjUgMCAwLTIuNSAxLjUtMi41IDQgMCAwLS41LjUgMCAyeiIvPjxwYXRoIGQ9Ik0yNSA4YTIuNSAyLjUgMCAxIDEtNSAwIDIuNSAyLjUgMCAxIDEgNSAweiIvPjwvZz48cGF0aCBkPSJNMTcuNSAyNmgxME0xNSAzMGgxNW0tNy41LTE0LjV2NU0yMCAxOGg1IiBzdHJva2U9IiMwMDAiIHN0cm9rZS1saW5lam9pbj0ibWl0ZXIiLz48L2c+PC9zdmc+",
        'Q': "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0NSIgaGVpZ2h0PSI0NSI+PGcgZmlsbD0iI2ZmZiIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik04IDEyYTIgMiAwIDEgMS00IDAgMiAyIDAgMSAxIDQgMHptMTYuNS00LjVhMiAyIDAgMSAxLTQgMCAyIDIgMCAxIDEgNCAwek00MSAxMmEyIDIgMCAxIDEtNCAwIDIgMiAwIDEgMSA0IDB6TTE2IDguNWEyIDIgMCAxIDEtNCAwIDIgMiAwIDEgMSA0IDB6TTMzIDlhMiAyIDAgMSAxLTQgMCAyIDIgMCAxIDEgNCAweiIvPjxwYXRoIGQ9Ik05IDI2YzguNS0xLjUgMjEtMS41IDI3IDBsMi0xMi0xNC41IDIuNS0xMS41LTIuNXoiIHN0cm9rZS1saW5lY2FwPSJidXR0Ii8+PHBhdGggZD0iTTkgMjZjMCAyIDEuNSAyIDIuNSA0IDEgMS41IDEgMSAuNSAzLjUtMS41IDEtMS41IDIuNS0uNSAyLjUuNS4yNSAxLjUuNSAxLjUuNWgxN2MuNSAwIDEuNS0uMjUgMS41LS41IDEtMSAuNS0yLjUtLjUtMi41LS41LTIuNS0uNS0yIC41LTMuNSAxLTIgMi41LTIgMi41LTQtOC41LTEuNS0xOC41LTEuNS0yNyAweiIgc3Ryb2tlLWxpbmVjYXA9ImJ1dHQiLz48cGF0aCBkPSJNMTEgMzhjMy41LTEgMTgtMSAyMiAwIiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTExIDI0YzMuNS0xLjUgMTgtMS41IDIyIDBNMTEgMzBjMy41LTEgMTgtMSAyMiAwTTExIDMzLjVjMy41LTEgMTgtMSAyMiAwIiBmaWxsPSJub25lIiBzdHJva2U9IiNlY2VjZWMiLz48L2c+PC9zdmc+",
        'K': "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0NSIgaGVpZ2h0PSI0NSI+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMi41IDExLjYzVjZNMjAgOGg1IiBzdHJva2UtbGluZWpvaW49Im1pdGVyIi8+PHBhdGggZD0iTTIyLjUgMjVzNC41LTcuNSAzLTEwLjVjMCAwLTEtMi41LTMtMi41cy0zIDIuNS0zIDIuNWMtMS41IDMgMyAxMC41IDMgMTAuNSIgZmlsbD0iI2ZmZiIgc3Ryb2tlLWxpbmVjYXA9ImJ1dHQiIHN0cm9rZS1saW5lam9pbj0ibWl0ZXIiLz48cGF0aCBkPSJNMTEuNSAzN2M1LjUgMy41IDE1LjUgMy41IDIxIDB2LTdzOS00LjUgNi0xMC41Yy00LTYuNS0xMy41LTMuNS0xNiA0VjI3di0zLjVjLTMuNS03LjUtMTMtMTAuNS0xNi00LTMgNiA1IDEwIDUgMTBWMzd6IiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTExLjUgMzBjNS41LTMgMTUuNS0zIDIxIDBtLTIxIDMuNWM1LjUtMyAxNS41LTMgMjEgMG0tMjEgMy41YzUuNS0zIDE1LjUtMyAyMSAwIi8+PC9nPjwvc3ZnPg=="
      };

  function initializeSequenceColors() {

    if (localStorage.getItem('bettermint-sequence-colors')) {
      try {
        const savedColors = JSON.parse(localStorage.getItem('bettermint-sequence-colors'));

        for (const key in savedColors) {
          if (sequenceColors.hasOwnProperty(key)) {
            sequenceColors[key] = savedColors[key];
          }
        }

        updateColorSamplesUI();
      } catch (e) {
        bmError("Error loading saved colors:", e);
      }
    }
  }

    let showOpponentResponses = false; 
    let autoRefreshPosition = true; 

  function updateColorSamplesUI() {
    const colorSamples = document.querySelectorAll('.sequence-color-sample');

    colorSamples[0].style.backgroundColor = sequenceColors.first;
    colorSamples[1].style.backgroundColor = sequenceColors.second;
    colorSamples[2].style.backgroundColor = sequenceColors.third;
    colorSamples[3].style.backgroundColor = sequenceColors.fourth;
    colorSamples[4].style.backgroundColor = sequenceColors.fifth;

    const opponentSample = document.querySelector('.opponent-color-sample');
    if (opponentSample) {
      opponentSample.style.backgroundColor = sequenceColors.opponent;
    }
  }

  function isOpponentMove(moveIndex, startingColor) {

    return (startingColor === 'w') ? (moveIndex % 2 === 1) : (moveIndex % 2 === 0);
  }

  function getFadedColor(baseColor, intensity) {

    let r = parseInt(baseColor.substring(1, 3), 16);
    let g = parseInt(baseColor.substring(3, 5), 16);
    let b = parseInt(baseColor.substring(5, 7), 16);

    r = Math.min(255, r + Math.round((255 - r) * intensity));
    g = Math.min(255, g + Math.round((255 - g) * intensity));
    b = Math.min(255, b + Math.round((255 - b) * intensity));

    return '#' + 
      r.toString(16).padStart(2, '0') + 
      g.toString(16).padStart(2, '0') + 
      b.toString(16).padStart(2, '0');
  }

  function showColorPicker(colorType, element) {

    let colorPicker = document.getElementById('sequence-color-picker');
    if (!colorPicker) {
      colorPicker = document.createElement('input');
      colorPicker.type = 'color';
      colorPicker.id = 'sequence-color-picker';
      colorPicker.style.position = 'absolute';
      colorPicker.style.opacity = '0';
      colorPicker.style.pointerEvents = 'none';
      document.body.appendChild(colorPicker);
    }

    colorPicker.value = sequenceColors[colorType];

    colorPicker.setAttribute('data-color-type', colorType);

    colorPicker.onchange = function(e) {
      const newColor = e.target.value;
      const colorTypeToChange = e.target.getAttribute('data-color-type');

      sequenceColors[colorTypeToChange] = newColor;

      element.style.backgroundColor = newColor;

      localStorage.setItem('bettermint-sequence-colors', JSON.stringify(sequenceColors));

      if (activeLineElement) {
        activeLineElement.click();
      } else if (currentAnalysisData) {
        showBestMoves();
      }
    };

        colorPicker.click();
      }

      function setupColorPickerHandlers() {
    const colorSamples = document.querySelectorAll('.sequence-color-sample');
    const colorTypes = ['first', 'second', 'third', 'fourth', 'fifth'];

    colorSamples.forEach(sample => {
      sample.style.cursor = 'pointer';
      sample.title = 'Click to change color';
    });

    for (let i = 0; i < colorSamples.length; i++) {
      (function(index) {
        colorSamples[index].addEventListener('click', function() {

          if (this.classList.contains('opponent-color-sample')) {
            showColorPicker('opponent', this);
          } else if (index < colorTypes.length) {

            showColorPicker(colorTypes[index], this);
          }
        });
      })(i);
    }

    const opponentSample = document.querySelector('.opponent-color-sample');
    if (opponentSample) {
      opponentSample.addEventListener('click', function() {
        showColorPicker('opponent', this);
      });
    }
  }

      function addColorSampleStyles() {
        const styleElement = document.createElement('style');
        styleElement.textContent = 
        '.sequence-color-sample {' +
        '  cursor: pointer;' +
        '  transition: transform 0.2s, box-shadow 0.2s;' +
        '}' +
        '.sequence-color-sample:hover {' +
        '  transform: scale(1.2);' +
        '  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);' +
        '}';

        document.head.appendChild(styleElement);
      }

      function initializeColorPicker() {
        addColorSampleStyles();
        initializeSequenceColors();
        setupColorPickerHandlers();
      }

      const sequenceColors = {
        first: '#42A5F5',      
        second: '#66BB6A',     
        third: '#FFEB3B',      
        fourth: '#FFC107',     
        fifth: '#FF5252',      
        opponent: '#FF7043'    
      };

      function resetSequenceColors() {

    const defaultColors = {
      first: '#42A5F5',   
      second: '#66BB6A',  
      third: '#FFEB3B',   
      fourth: '#FFC107',  
      fifth: '#FF5252',   
      opponent: '#FF7043' 
    };

    for (const key in defaultColors) {
      if (sequenceColors.hasOwnProperty(key)) {
        sequenceColors[key] = defaultColors[key];
      }
    }

    updateColorSamplesUI();

    localStorage.setItem('bettermint-sequence-colors', JSON.stringify(sequenceColors));

    if (activeLineElement) {
      activeLineElement.click();
    } else if (currentAnalysisData) {
      showBestMoves();
    }
  }

      function addResetColorsButton() {

        const settingsContent = document.querySelector('.settings-content');
        if (!settingsContent) return;

        const moveColorsSection = document.createElement('div');
        moveColorsSection.className = 'settings-section';
        moveColorsSection.innerHTML = 
          '<h4>Move Sequence Colors</h4>' +
          '<div class="settings-option">' +
          '  <label>Reset colors to default:</label>' +
          '  <button id="reset-colors-btn" class="theme-btn">Reset Colors</button>' +
          '</div>';

        settingsContent.appendChild(moveColorsSection);

        const resetColorsBtn = document.getElementById('reset-colors-btn');
        if (resetColorsBtn) {
          resetColorsBtn.addEventListener('click', function() {
            resetSequenceColors();

            this.textContent = "Colors Reset!";
            this.style.backgroundColor = "#4CAF50";

            setTimeout(() => {
              this.textContent = "Reset Colors";
              this.style.backgroundColor = "";
            }, 1500);
          });
        }
      }

      let currentFEN = '';
      let boardFlipped = false;
      let evaluationMode = false;

      let currentAnalysisData = null;
      let selectedLine = 0;
      let activeLineElement = null;

      let moveHistory = [];
      let currentMoveIndex = -1; 
      let analysisHistory = []; 

      let isPlayingLine = false;
      let playbackInterval = null;
      let currentPlaybackMoves = [];
      let currentPlaybackIndex = 0;
      let originalFEN = ''; 
      let playbackSpeed = 1000; 

      let currentTheme = 'dark';
      const body = document.body;

      let maxFutureMoves = 5; 

  function initializeSettings() {

    if (localStorage.getItem('bettermint-future-moves') !== null) {
      maxFutureMoves = parseInt(localStorage.getItem('bettermint-future-moves'), 10);
    }

    if (localStorage.getItem('bettermint-playback-speed') !== null) {
      const speedValue = parseInt(localStorage.getItem('bettermint-playback-speed'), 10);
      playbackSpeed = speedValue * 200; 
    }

    if (localStorage.getItem('bettermint-auto-update') !== null) {
      autoUpdate = localStorage.getItem('bettermint-auto-update') === 'true';
    }

    if (localStorage.getItem('bettermint-auto-refresh-position') !== null) {
      autoRefreshPosition = localStorage.getItem('bettermint-auto-refresh-position') === 'true';
    }

    if (localStorage.getItem('bettermint-theme') !== null) {
      currentTheme = localStorage.getItem('bettermint-theme');
      if (currentTheme === 'ultra-dark') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('ultra-dark-theme');
      } else {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('ultra-dark-theme');
      }
    }

    if (localStorage.getItem('bettermint-show-opponent-responses') !== null) {
      showOpponentResponses = localStorage.getItem('bettermint-show-opponent-responses') === 'true';
    }

    const futureMovesSlider = document.getElementById('future-moves-slider');
    const futureMovesValue = document.getElementById('future-moves-value');
    const playbackSpeedSlider = document.getElementById('playback-speed-slider');
    const playbackSpeedValue = document.getElementById('playback-speed-value');
    const settingsAutoUpdate = document.getElementById('settings-auto-update');
    const settingsAutoRefreshPosition = document.getElementById('settings-auto-refresh-position');
    const settingsShowOpponentResponses = document.getElementById('settings-show-opponent-responses');

    if (futureMovesSlider && futureMovesValue) {
      futureMovesSlider.value = maxFutureMoves;
      futureMovesValue.textContent = maxFutureMoves;
    }

    if (playbackSpeedSlider && playbackSpeedValue) {
      playbackSpeedSlider.value = playbackSpeed / 200;
      playbackSpeedValue.textContent = (playbackSpeed / 1000).toFixed(1) + 's';
    }

    if (settingsAutoUpdate) {
      settingsAutoUpdate.checked = autoUpdate;
    }

    if (settingsAutoRefreshPosition) {
      settingsAutoRefreshPosition.checked = autoRefreshPosition;
    }

    if (settingsShowOpponentResponses) {
      settingsShowOpponentResponses.checked = showOpponentResponses;
    }

    const darkThemeBtn = document.getElementById('dark-theme-btn');
    const ultraDarkThemeBtn = document.getElementById('ultra-dark-theme-btn');

    if (darkThemeBtn && ultraDarkThemeBtn) {
      if (currentTheme === 'ultra-dark') {
        darkThemeBtn.classList.remove('active');
        ultraDarkThemeBtn.classList.add('active');
      } else {
        darkThemeBtn.classList.add('active');
        ultraDarkThemeBtn.classList.remove('active');
      }
    }
  }

  function setupSettingsPanel() {
    const settingsButton = document.getElementById('settings-button');
    const settingsPanel = document.getElementById('settings-panel');
    const settingsClose = document.getElementById('settings-close');
    const futureMovesSlider = document.getElementById('future-moves-slider');
    const futureMovesValue = document.getElementById('future-moves-value');
    const playbackSpeedSlider = document.getElementById('playback-speed-slider');
    const playbackSpeedValue = document.getElementById('playback-speed-value');
    const settingsAutoUpdate = document.getElementById('settings-auto-update');
    const settingsAutoRefreshPosition = document.getElementById('settings-auto-refresh-position');
    const darkThemeBtn = document.getElementById('dark-theme-btn');
    const ultraDarkThemeBtn = document.getElementById('ultra-dark-theme-btn');
    const settingsShowOpponentResponses = document.getElementById('settings-show-opponent-responses');

    settingsButton.addEventListener('click', () => {
      settingsPanel.classList.toggle('visible');
    });

    settingsClose.addEventListener('click', () => {
      settingsPanel.classList.remove('visible');
    });

    document.addEventListener('click', (e) => {
      if (!settingsPanel.contains(e.target) && e.target !== settingsButton) {
        settingsPanel.classList.remove('visible');
      }
    });

    futureMovesSlider.addEventListener('input', () => {
      futureMovesValue.textContent = futureMovesSlider.value;
    });

    futureMovesSlider.addEventListener('change', () => {
      maxFutureMoves = parseInt(futureMovesSlider.value, 10);
      localStorage.setItem('bettermint-future-moves', maxFutureMoves);

      if (activeLineElement) {
        activeLineElement.click();
      } else if (currentAnalysisData) {
        showBestMoves();
      }
    });

    if (playbackSpeedSlider) {
      playbackSpeedSlider.addEventListener('input', () => {
        const speedMs = parseInt(playbackSpeedSlider.value, 10) * 200;
        playbackSpeedValue.textContent = (speedMs / 1000).toFixed(1) + 's';
      });

      playbackSpeedSlider.addEventListener('change', () => {
        playbackSpeed = parseInt(playbackSpeedSlider.value, 10) * 200;
        localStorage.setItem('bettermint-playback-speed', playbackSpeedSlider.value);
      });
    }

    if (settingsAutoUpdate) {
      settingsAutoUpdate.addEventListener('change', () => {
        autoUpdate = settingsAutoUpdate.checked;
        localStorage.setItem('bettermint-auto-update', autoUpdate);

        if (window.opener) {
          window.opener.postMessage({ 
            type: 'bettermint-auto-update', 
            enabled: autoUpdate 
          }, '*');
        }
      });
    }

    if (settingsAutoRefreshPosition) {
      settingsAutoRefreshPosition.addEventListener('change', () => {
        autoRefreshPosition = settingsAutoRefreshPosition.checked;
        localStorage.setItem('bettermint-auto-refresh-position', autoRefreshPosition);
        bmLog("Auto refresh position setting updated:", autoRefreshPosition);
      });
    }

    darkThemeBtn.addEventListener('click', () => {
      body.classList.remove('ultra-dark-theme');
      body.classList.add('dark-theme');
      currentTheme = 'dark';
      localStorage.setItem('bettermint-theme', 'dark');

      darkThemeBtn.classList.add('active');
      ultraDarkThemeBtn.classList.remove('active');
    });

    ultraDarkThemeBtn.addEventListener('click', () => {
      body.classList.remove('dark-theme');
      body.classList.add('ultra-dark-theme');
      currentTheme = 'ultra-dark';
      localStorage.setItem('bettermint-theme', 'ultra-dark');

      darkThemeBtn.classList.remove('active');
      ultraDarkThemeBtn.classList.add('active');
    });

    if (settingsShowOpponentResponses) {
      settingsShowOpponentResponses.addEventListener('change', () => {
        showOpponentResponses = settingsShowOpponentResponses.checked;
        localStorage.setItem('bettermint-show-opponent-responses', showOpponentResponses);
        bmLog("Opponent responses setting updated:", showOpponentResponses);

        if (activeLineElement) {
          activeLineElement.click();
        } else if (currentAnalysisData) {
          showBestMoves();
        }
      });
    }

    addResetColorsButton();
  }

  function showBestMoves() {
    if (!currentAnalysisData || !currentAnalysisData.topMoves || currentAnalysisData.topMoves.length === 0) {
      bmLog("No analysis data available for current position");
      return;
    }

    clearArrows();
    clearHighlights();
    clearMoveIndicators();

    const allLines = document.querySelectorAll('.line');
    allLines.forEach(line => line.classList.remove('active'));
    activeLineElement = null;

    const movesToShow = Math.min(3, currentAnalysisData.topMoves.length);
    bmLog("Drawing arrows for top " + movesToShow + " moves");

    const startingColor = currentAnalysisData.turnColor || 'w';

    if (evaluationMode) {
      for (let i = 0; i < movesToShow; i++) {
        const move = currentAnalysisData.topMoves[i];
        if (!move || !move.move || move.move.length < 4) continue;
        const from = move.move.substring(0,2);
        const to = move.move.substring(2,4);
        let color = sequenceColors.first;
        if (i === 1) color = sequenceColors.second; else if (i === 2) color = sequenceColors.third;
        let evalText;
        if (move.mate !== null) {
          const mateIn = Math.abs(move.mate);
          evalText = move.mate > 0 ? 'M' + mateIn : '-M' + mateIn;
        } else {
          const cpEval = move.cp / 100;
          evalText = (cpEval >= 0 ? '+' : '') + cpEval.toFixed(2);
        }
        addMoveIndicator(from, color);
        addMoveIndicator(to, color, evalText);
      }
      return;
    }

    for (let i = 0; i < movesToShow; i++) {
      const move = currentAnalysisData.topMoves[i];
      if (!move || !move.move) {
        bmError("Invalid move data for index " + i + ":", move);
        continue;
      }

      if (move.move.length < 4) {
        bmError("Move format invalid: " + move.move);
        continue;
      }

      const from = move.move.substring(0, 2);
      const to = move.move.substring(2, 4);

      bmLog("Drawing move " + i + ": " + from + " -> " + to);

      if (i === 0) {
        highlightSquare(from, 'rgba(66, 165, 245, 0.4)'); 
        highlightSquare(to, 'rgba(66, 165, 245, 0.6)');   
      }

      let arrowColor = '';
      switch(i) {
        case 0: arrowColor = sequenceColors.first; break;  
        case 1: arrowColor = sequenceColors.second; break; 
        case 2: arrowColor = sequenceColors.third; break;  
      }

      const arrow = drawArrow(from, to, arrowColor, 6 - i);
      if (arrow) {
        arrow.style.opacity = (1 - (i * 0.15));
        bmLog("Arrow drawn successfully for move " + i);
      } else {
        bmError("Failed to draw arrow for move " + i + " from " + from + " to " + to);
      }

      if (showOpponentResponses) {
        bmLog("Showing opponent responses (enabled in settings)");

        let opponentMove = null;

        if (move.line) {
          if (typeof move.line === 'string') {
            const movesStr = move.line.trim();
            const cleanMovesStr = movesStr.replace(/\d+\.\s*/g, '');
            const moveParts = cleanMovesStr.split(/\s+/);

            if (moveParts.length > 1 && moveParts[1] && moveParts[1].length >= 4) {
              opponentMove = moveParts[1];
            }
          } else if (Array.isArray(move.line) && move.line.length > 1) {
            opponentMove = move.line[1];
          }

          if (opponentMove) {
            const opFrom = opponentMove.substring(0, 2);
            const opTo = opponentMove.substring(2, 4);

            bmLog("Drawing opponent response for move " + i + ": " + opFrom + " -> " + opTo);

            const fadeIntensity = 0.3; 
            const opArrowColor = getFadedColor(sequenceColors.opponent, fadeIntensity);

            const opArrow = drawArrow(opFrom, opTo, opArrowColor, 4);
            if (opArrow) {
              opArrow.style.opacity = 0.85;
              bmLog("Arrow drawn successfully for opponent response to move " + i);
            } else {
              bmError("Failed to draw arrow for opponent response to move " + i);
            }
          }
        }
      } else {
        bmLog("Opponent responses disabled in settings");
      }
    }
  }

      const modeToggle = document.getElementById('mode-toggle');
      modeToggle.addEventListener('click', () => {
        window.opener.postMessage({ type: 'bettermint-toggle-mode' }, '*');
      });

      const evalModeToggle = document.getElementById('eval-mode-toggle');
      evalModeToggle.addEventListener('click', () => {
        evaluationMode = !evaluationMode;
        evalModeToggle.textContent = evaluationMode ? 'Arrow Mode' : 'Evaluation Mode';
        if (evaluationMode) {
          clearArrows();
        } else {
          clearMoveIndicators();
        }
        showBestMoves();
      });

      const refreshButton = document.getElementById('refresh-button');
      if (refreshButton) {
        refreshButton.addEventListener('click', function() {

          window.opener.postMessage({ type: 'bettermint-refresh' }, '*');
          bmLog("Refresh request sent to parent window");

          refreshButton.textContent = "Refreshing...";
          refreshButton.disabled = true;

          setTimeout(function() {
            refreshButton.textContent = "Refresh";
            refreshButton.disabled = false;
          }, 1000);

          setTimeout(function() {
            if (typeof forceArrowRedraw === 'function') {
              forceArrowRedraw();
            } else {
              bmError("forceArrowRedraw function not found");

              if (currentAnalysisData && currentAnalysisData.topMoves) {
                clearArrows();
                clearHighlights();
                showBestMoves();
                bmLog("Fallback arrow redraw executed");
              }
            }
          }, 300);
        });
      }

      const depthElement = document.getElementById('depth');
      const evalElement = document.getElementById('position-eval');
      const bestMoveElement = document.getElementById('best-move');
      const moveQualityElement = document.getElementById('move-quality');
      const linesContainer = document.getElementById('lines-container');
      const noDataMessage = document.getElementById('no-data-message');
      const flipBoardButton = document.getElementById('flip-board');

      if (localStorage.getItem('bettermint-auto-update') !== null) {

        const autoUpdateEnabled = localStorage.getItem('bettermint-auto-update') === 'true';
        document.getElementById('settings-auto-update').checked = autoUpdateEnabled;
      }

      if (localStorage.getItem('bettermint-board-flipped') !== null) {
        boardFlipped = localStorage.getItem('bettermint-board-flipped') === 'true';
      }

      flipBoardButton.addEventListener('click', () => {
        boardFlipped = !boardFlipped;
        localStorage.setItem('bettermint-board-flipped', boardFlipped);

        if (currentFEN) {
          drawChessboard(currentFEN, boardFlipped);
        }

        if (currentAnalysisData && activeLineElement) {

          activeLineElement.click();
        } else if (currentAnalysisData) {
          showBestMoves();
        }
      });

      function parseFEN(fen) {
        if (!fen) return null;

        const parts = fen.split(' ');
        if (parts.length < 6) {
          bmError('Invalid FEN format:', fen);
          return null;
        }

        const [position, turn, castling, enPassant, halfmoveClock, fullmoveNumber] = parts;
        const rows = position.split('/');
        if (rows.length !== 8) {
          bmError('Invalid position in FEN:', position);
          return null;
        }

        const board = [];

        for (let i = 0; i < 8; i++) {
          board[i] = [];
          let j = 0;
          for (let k = 0; k < rows[i].length; k++) {
            const char = rows[i][k];
            if (/\\d/.test(char)) {
              const emptySquares = parseInt(char, 10);
              for (let l = 0; l < emptySquares; l++) {
                board[i][j] = null;
                j++;
              }
            } else {
              board[i][j] = char;
              j++;
            }
          }
        }

        return { 
          board,
          turn,
          castling,
          enPassant,
          halfmoveClock: parseInt(halfmoveClock, 10),
          fullmoveNumber: parseInt(fullmoveNumber, 10)
        };
      }

      function coordToSquare(row, col, flipped = false) {
        if (flipped) {
          row = 7 - row;
          col = 7 - col;
        }
        const file = String.fromCharCode(97 + col); 
        const rank = 8 - row; 
        return file + rank;
      }

      function squareToCoord(square, flipped = false) {
        if (!square || typeof square !== 'string' || square.length !== 2) {
          bmError("Invalid square notation:", square);
          return null;
        }

        const file = square.charCodeAt(0) - 97; 
        const rank = 8 - parseInt(square[1], 10);

        if (isNaN(file) || file < 0 || file > 7 || isNaN(rank) || rank < 0 || rank > 7) {
          bmError("Invalid coordinates calculated from square:", square, file, rank);
          return null;
        }

        if (flipped) {
          return { row: 7 - rank, col: 7 - file };
        }

        return { row: rank, col: file };
      }

      function visualizeLine(lineIndex) {

    clearArrows();
    clearHighlights();

    bmLog("Visualizing line index:", lineIndex);

    if (!currentAnalysisData || !currentAnalysisData.topMoves || !currentAnalysisData.topMoves[lineIndex]) {
      bmError("No valid analysis data for line", lineIndex);
      return;
    }

    const moveData = currentAnalysisData.topMoves[lineIndex];
    const startingColor = currentAnalysisData.turnColor || 'w'; 
    bmLog("Move data for line " + lineIndex + ":", moveData);

    let moves = [];

    const lineElement = document.querySelector('.line[data-index="' + lineIndex + '"]');
    if (lineElement) {
      const movesElement = lineElement.querySelector('.line-moves');
      if (movesElement) {
        const fullText = movesElement.textContent || '';
        bmLog("Moves text from DOM:", fullText);

        const moveMatches = fullText.match(/[a-h][1-8]-[a-h][1-8](?:=[QRBN])?/g);
        if (moveMatches && moveMatches.length > 0) {

          moves = moveMatches.map(m => m.replace('-', '').replace(/=[QRBN]/, ''));
          bmLog("Extracted UCI moves from DOM:", moves);
        }
      }
    }

    if (moves.length === 0 && moveData.line && typeof moveData.line === 'string') {
      bmLog("Extracting moves from move.line property:", moveData.line);
      const movesStr = moveData.line.trim();

      const cleanMovesStr = movesStr.replace(/\d+\.\s*/g, '');
      const moveParts = cleanMovesStr.split(/\s+/);

      const uciMoves = moveParts.filter(m => 
        m && m.length >= 4 && 
        /^[a-h][1-8][a-h][1-8][qrbnkQRBNK]?$/.test(m)
      );

      if (uciMoves.length > 0) {
        moves = uciMoves;
        bmLog("Extracted UCI moves from line property:", moves);
      }
    }

    if (moves.length === 0 && moveData.move) {
      bmLog("Using only best move:", moveData.move);
      moves = [moveData.move];
    }

    if (moves.length === 0) {
      bmError("No valid moves found in line, even after multiple attempts");
      return;
    }

    const maxMoves = Math.min(moves.length, maxFutureMoves * 2); 
    bmLog("Visualizing " + maxMoves + " moves (max future moves setting: " + maxFutureMoves + ")");

    currentPlaybackMoves = moves.slice(0, maxMoves);

    const opponentMoves = [];
    const playerMoves = [];

    for (let idx = 0; idx < maxMoves; idx++) {
      if (isOpponentMove(idx, startingColor)) {
        opponentMoves.push({ index: idx, move: moves[idx] });
      } else {
        playerMoves.push({ index: idx, move: moves[idx] });
      }
    }

    for (let i = 0; i < playerMoves.length; i++) {
      const { index, move } = playerMoves[i];

      const from = move.substring(0, 2);
      const to = move.substring(2, 4);

      bmLog("Drawing player move " + index + ": " + from + " to " + to);

      let arrowColor;
      switch(Math.floor(index / 2)) {
        case 0: arrowColor = sequenceColors.first; break;  
        case 1: arrowColor = sequenceColors.second; break; 
        case 2: arrowColor = sequenceColors.third; break;  
        case 3: arrowColor = sequenceColors.fourth; break; 
        default: arrowColor = sequenceColors.fifth; break; 
      }

      if (index === 0) {
        bmLog("Highlighting first move: " + from + " and " + to);
        highlightSquare(from, 'rgba(66, 165, 245, 0.4)'); 
        highlightSquare(to, 'rgba(66, 165, 245, 0.6)');   
      }

      const thickness = Math.max(3, 6 - Math.floor(index / 2));
      const arrow = drawArrow(from, to, arrowColor, thickness);
      if (arrow) {
        arrow.style.opacity = Math.max(0.7, 1 - (index * 0.05));
        bmLog("Arrow drawn successfully for player move " + index);
      }
    }

    for (let i = 0; i < opponentMoves.length; i++) {
      const { index, move } = opponentMoves[i];

      const from = move.substring(0, 2);
      const to = move.substring(2, 4);

      bmLog("Drawing opponent move " + index + ": " + from + " to " + to);

      const fadeIntensity = i / Math.max(1, opponentMoves.length - 1) * 0.6; 
      const arrowColor = getFadedColor(sequenceColors.opponent, fadeIntensity);

      const thickness = Math.max(2, 5 - Math.floor(i / 2));
      const arrow = drawArrow(from, to, arrowColor, thickness);
      if (arrow) {
        arrow.style.opacity = Math.max(0.7, 1 - (i * 0.05));
        bmLog("Arrow drawn successfully for opponent move " + index);
      }
    }

    selectedLine = lineIndex;

    const allLines = document.querySelectorAll('.line');
    for (let i = 0; i < allLines.length; i++) {
      if (i === lineIndex) {
        allLines[i].classList.add('active');
        activeLineElement = allLines[i];
      } else {
        allLines[i].classList.remove('active');
      }
    }
  }

    function drawChessboard(fen, flipped = false) {
      const container = document.getElementById('chessboard');
      if (!container) {
        bmError("Chessboard container not found");
        return;
      }

      container.innerHTML = '';

      let arrowLayer = document.getElementById('arrow-layer');
      if (!arrowLayer) {
        bmLog("Creating new arrow layer");
        const chessboardContainer = document.querySelector('.chessboard-container');
        if (chessboardContainer) {
          arrowLayer = document.createElement('div');
          arrowLayer.id = 'arrow-layer';
          arrowLayer.className = 'arrow-layer';
          chessboardContainer.appendChild(arrowLayer);
        } else {
          bmError("Chess container not found for arrow layer creation");
          return;
        }
      } else {

        arrowLayer.innerHTML = '';
      }

      const boardRect = container.getBoundingClientRect();
      arrowLayer.style.position = 'absolute';
      arrowLayer.style.top = '0';
      arrowLayer.style.left = '0';
      arrowLayer.style.width = '100%';
      arrowLayer.style.height = '100%';
      arrowLayer.style.pointerEvents = 'none';
      arrowLayer.style.zIndex = '3';

      const position = parseFEN(fen);
      if (!position) {
        bmError("Failed to parse FEN:", fen);
        return;
      }

      bmLog("Drawing chessboard with FEN:", fen);
      bmLog("Board flipped:", flipped);

      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const actualRow = flipped ? 7 - row : row;
          const actualCol = flipped ? 7 - col : col;
          const isLightSquare = (row + col) % 2 === 1;
          const piece = position.board[actualRow][actualCol];

          const square = document.createElement('div');
          square.className = "square " + (isLightSquare ? 'light' : 'dark');
          square.dataset.row = actualRow;
          square.dataset.col = actualCol;
          square.dataset.square = coordToSquare(actualRow, actualCol);

          if (piece) {
            const pieceElement = document.createElement('div');
            pieceElement.className = 'piece';
            pieceElement.style.backgroundImage = "url(" + pieceImages[piece] + ")";
            square.appendChild(pieceElement);
          }

          container.appendChild(square);
        }
      }

      return container;
    }

    function drawArrow(from, to, color, thickness = 4) {

      if (!from || !to || from.length !== 2 || to.length !== 2) {
        bmError("Invalid from/to coordinates:", from, to);
        return null;
      }

      const arrowLayer = document.getElementById('arrow-layer');
      if (!arrowLayer) {
        bmError("Arrow layer not found - cannot draw arrow");

        const chessboardContainer = document.querySelector('.chessboard-container');
        if (chessboardContainer) {
          const newArrowLayer = document.createElement('div');
          newArrowLayer.id = 'arrow-layer';
          newArrowLayer.className = 'arrow-layer';
          newArrowLayer.style.position = 'absolute';
          newArrowLayer.style.top = '0';
          newArrowLayer.style.left = '0';
          newArrowLayer.style.width = '100%';
          newArrowLayer.style.height = '100%';
          newArrowLayer.style.pointerEvents = 'none';
          newArrowLayer.style.zIndex = '3';
          chessboardContainer.appendChild(newArrowLayer);
          bmLog("Created new arrow layer as fallback");
          return drawArrow(from, to, color, thickness); 
        }
        return null;
      }

      const fromCoord = squareToCoord(from, boardFlipped);
      const toCoord = squareToCoord(to, boardFlipped);

      if (!fromCoord || !toCoord) {
        bmError("Invalid coordinates calculated for move:", from, "to", to);
        return null;
      }

      const squares = document.querySelectorAll('.square');
      if (!squares.length) {
        bmError("No squares found on board");
        return null;
      }

      const squareSize = squares[0].offsetWidth;

      const fromX = (fromCoord.col + 0.5) * squareSize;
      const fromY = (fromCoord.row + 0.5) * squareSize;
      const toX = (toCoord.col + 0.5) * squareSize;
      const toY = (toCoord.row + 0.5) * squareSize;

      const dx = toX - fromX;
      const dy = toY - fromY;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;

      const adjustedThickness = (length < squareSize * 1.5) ? thickness + 1 : thickness;

      const arrow = document.createElement('div');
      arrow.className = 'arrow';
      arrow.style.position = 'absolute';
      arrow.style.width = length + "px";
      arrow.style.height = adjustedThickness + "px";
      arrow.style.backgroundColor = color;
      arrow.style.top = fromY + "px";
      arrow.style.left = fromX + "px";
      arrow.style.transform = "rotate(" + angle + "deg)";
      arrow.style.transformOrigin = '0 50%';
      arrow.style.zIndex = '3';
      arrow.style.opacity = '0.85'; 
      arrow.style.borderRadius = '2px';

      if (length < squareSize * 1.5) {
        arrow.style.boxShadow = '0 0 2px rgba(0,0,0,0.7)';
      }

      const arrowHead = document.createElement('div');
      arrowHead.className = 'arrowhead';
      arrowHead.style.position = 'absolute';
      arrowHead.style.width = '0';
      arrowHead.style.height = '0';
      arrowHead.style.borderTop = (adjustedThickness + 2) + 'px solid transparent';
      arrowHead.style.borderBottom = (adjustedThickness + 2) + 'px solid transparent';
      arrowHead.style.borderLeft = (adjustedThickness * 2) + 'px solid ' + color;
      arrowHead.style.top = '50%';
      arrowHead.style.right = '-' + (adjustedThickness * 1.5) + 'px';
      arrowHead.style.transform = 'translateY(-50%)';

      arrow.appendChild(arrowHead);
      arrowLayer.appendChild(arrow);

      return arrow;
    }

    function clearArrows() {
      const arrowLayer = document.getElementById('arrow-layer');
      if (arrowLayer) {
        arrowLayer.innerHTML = '';
      }
    }

    function highlightSquare(square, color) {
      const squareElement = document.querySelector(".square[data-square='" + square + "']");

      if (squareElement) {
        const highlight = document.createElement('div');
        highlight.className = 'highlight';
        highlight.style.backgroundColor = color;

        squareElement.appendChild(highlight);
      }
    }

    function clearHighlights() {
      const highlights = document.querySelectorAll('.highlight');
      highlights.forEach(highlight => {
        highlight.remove();
      });
    }

    function clearMoveIndicators() {
      const indicators = document.querySelectorAll('.move-indicator, .eval-label');
      indicators.forEach(ind => ind.remove());
    }

    function addMoveIndicator(square, color, evalText = null) {
      const squareElement = document.querySelector(".square[data-square='" + square + "']");
      if (!squareElement) return;

      const existing = squareElement.querySelectorAll('.move-indicator').length;
      const offset = existing * 10; // stack indicators horizontally

      const indicator = document.createElement('div');
      indicator.className = 'move-indicator';
      indicator.style.backgroundColor = color;
      indicator.style.left = (2 + offset) + 'px';
      squareElement.appendChild(indicator);

      if (evalText !== null) {
        const label = document.createElement('div');
        label.className = 'eval-label';
        label.textContent = evalText;
        label.style.left = (12 + offset) + 'px';
        squareElement.appendChild(label);
      }
    }

    function showBestMoves() {
    if (!currentAnalysisData || !currentAnalysisData.topMoves || currentAnalysisData.topMoves.length === 0) {
      bmLog("No analysis data available for current position");
      return;
    }

    clearArrows();
    clearHighlights();
    clearMoveIndicators();

    const allLines = document.querySelectorAll('.line');
    allLines.forEach(line => line.classList.remove('active'));
    activeLineElement = null;

    const movesToShow = Math.min(3, currentAnalysisData.topMoves.length);
    bmLog("Drawing arrows for top " + movesToShow + " moves");

    const startingColor = currentAnalysisData.turnColor || 'w';

    if (evaluationMode) {
      for (let i = 0; i < movesToShow; i++) {
        const move = currentAnalysisData.topMoves[i];
        if (!move || !move.move || move.move.length < 4) continue;
        const from = move.move.substring(0,2);
        const to = move.move.substring(2,4);
        let color = sequenceColors.first;
        if (i === 1) color = sequenceColors.second; else if (i === 2) color = sequenceColors.third;
        let evalText;
        if (move.mate !== null) {
          const mateIn = Math.abs(move.mate);
          evalText = move.mate > 0 ? 'M' + mateIn : '-M' + mateIn;
        } else {
          const cpEval = move.cp / 100;
          evalText = (cpEval >= 0 ? '+' : '') + cpEval.toFixed(2);
        }
        addMoveIndicator(from, color);
        addMoveIndicator(to, color, evalText);
      }
      return;
    }

    for (let i = 0; i < movesToShow; i++) {
      const move = currentAnalysisData.topMoves[i];
      if (!move || !move.move) {
        bmError("Invalid move data for index " + i + ":", move);
        continue;
      }

      if (move.move.length < 4) {
        bmError("Move format invalid: " + move.move);
        continue;
      }

      const from = move.move.substring(0, 2);
      const to = move.move.substring(2, 4);

      bmLog("Drawing move " + i + ": " + from + " -> " + to);

      if (i === 0) {
        highlightSquare(from, 'rgba(66, 165, 245, 0.4)');
        highlightSquare(to, 'rgba(66, 165, 245, 0.6)');
      }

      let arrowColor = '';
      switch(i) {
        case 0: arrowColor = sequenceColors.first; break;
        case 1: arrowColor = sequenceColors.second; break;
        case 2: arrowColor = sequenceColors.third; break;
      }

      const arrow = drawArrow(from, to, arrowColor, 6 - i);
      if (arrow) {
        arrow.style.opacity = (1 - (i * 0.15));
        bmLog("Arrow drawn successfully for move " + i);
      } else {
        bmError("Failed to draw arrow for move " + i + " from " + from + " to " + to);
      }

      if (showOpponentResponses) {

        let opponentMove = null;

        if (move.line) {
          if (typeof move.line === 'string') {
            const movesStr = move.line.trim();
            const cleanMovesStr = movesStr.replace(/\d+\.\s*/g, '');
            const moveParts = cleanMovesStr.split(/\s+/);

            if (moveParts.length > 1 && moveParts[1] && moveParts[1].length >= 4) {
              opponentMove = moveParts[1];
            }
          } else if (Array.isArray(move.line) && move.line.length > 1) {
            opponentMove = move.line[1];
          }

          if (opponentMove) {
            const opFrom = opponentMove.substring(0, 2);
            const opTo = opponentMove.substring(2, 4);

            bmLog("Drawing opponent response for move " + i + ": " + opFrom + " -> " + opTo);

            const fadeIntensity = 0.3;
            const opArrowColor = getFadedColor(sequenceColors.opponent, fadeIntensity);

            const opArrow = drawArrow(opFrom, opTo, opArrowColor, 4);
            if (opArrow) {
              opArrow.style.opacity = 0.85;
              bmLog("Arrow drawn successfully for opponent response to move " + i);
            } else {
              bmError("Failed to draw arrow for opponent response to move " + i);
            }
          }
        }
      }
    }
  }

    function forceArrowRedraw() {
      if (currentAnalysisData && currentAnalysisData.topMoves) {

        clearArrows();
        clearHighlights();

        const arrowLayer = document.getElementById('arrow-layer');
        if (!arrowLayer) {
          bmLog("Arrow layer missing during force redraw - recreating");
          const chessboardContainer = document.querySelector('.chessboard-container');
          if (chessboardContainer) {
            const newArrowLayer = document.createElement('div');
            newArrowLayer.id = 'arrow-layer';
            newArrowLayer.className = 'arrow-layer';
            newArrowLayer.style.position = 'absolute';
            newArrowLayer.style.top = '0';
            newArrowLayer.style.left = '0';
            newArrowLayer.style.width = '100%';
            newArrowLayer.style.height = '100%';
            newArrowLayer.style.pointerEvents = 'none';
            newArrowLayer.style.zIndex = '3';
            chessboardContainer.appendChild(newArrowLayer);
          }
        }

        showBestMoves();
        bmLog("Forced arrow redraw complete");
      } else {
        bmLog("No analysis data available for arrow redraw");
      }
    }

    function formatSingleMove(uciMove) {
      if (!uciMove) return '';

      if (uciMove.length === 5) {
        const promotionPiece = uciMove.charAt(4).toUpperCase();
        return uciMove.substring(0, 2) + '-' + uciMove.substring(2, 4) + '=' + promotionPiece;
      }

      return uciMove.substring(0, 2) + '-' + uciMove.substring(2, 4);
    }

    function formatMoves(line, turnColor = 'w') {
      if (typeof line === 'string') {
        line = line.split(' ');
      }

      let formattedMoves = '';
      let moveNumber = 1;

      const isWhiteToMove = turnColor === 'w';

      for (let i = 0; i < line.length; i++) {

        if ((isWhiteToMove && i % 2 === 0) || (!isWhiteToMove && i === 0)) {
          formattedMoves += moveNumber + '. ';

          if (!isWhiteToMove && i === 0) {
            formattedMoves += '... ';
          }
        }

        formattedMoves += formatSingleMove(line[i]) + ' ';

        if ((isWhiteToMove && i % 2 === 1) || (!isWhiteToMove && i % 2 === 0 && i > 0)) {
          moveNumber++;
        }
      }

      return formattedMoves.trim();
    }

    function handleLineClick(index) {

    clearArrows();
    clearHighlights();

    bmLog("Line " + index + " clicked, showOpponentResponses =", showOpponentResponses);

    const analysisData = currentAnalysisData;
    if (!analysisData || !analysisData.topMoves || !analysisData.topMoves[index]) {
      return;
    }

    const moveData = analysisData.topMoves[index];
    const startingColor = analysisData.turnColor || 'w'; 

    let moves = [];

    if (typeof moveData.line === 'string') {
      const movesStr = moveData.line.trim();
      const cleanMovesStr = movesStr.replace(/\d+\.\s*/g, '');
      const moveParts = cleanMovesStr.split(/\s+/);
      moves = moveParts.filter(m => 
        m && m.length >= 4 && 
        /^[a-h][1-8][a-h][1-8][qrbnkQRBNK]?$/.test(m)
      );
    } else if (Array.isArray(moveData.line)) {
      moves = moveData.line;
    }

    if (moves.length === 0 && moveData.move) {
      moves = [moveData.move];
    }

    if (moves.length === 0) {
      bmError("No valid moves found in line, even after multiple attempts");
      return;
    }

    const maxMoves = Math.min(moves.length, maxFutureMoves * 2); 

    const opponentMoves = [];
    const playerMoves = [];

    for (let idx = 0; idx < maxMoves; idx++) {
      if (isOpponentMove(idx, startingColor)) {
        opponentMoves.push({ index: idx, move: moves[idx] });
      } else {
        playerMoves.push({ index: idx, move: moves[idx] });
      }
    }

    for (let i = 0; i < playerMoves.length; i++) {
      const { index, move } = playerMoves[i];

      const from = move.substring(0, 2);
      const to = move.substring(2, 4);

      let arrowColor;
      const moveSequenceIndex = Math.floor(index / 2); 
      switch(moveSequenceIndex) {
        case 0: arrowColor = sequenceColors.first; break;  
        case 1: arrowColor = sequenceColors.second; break; 
        case 2: arrowColor = sequenceColors.third; break;  
        case 3: arrowColor = sequenceColors.fourth; break; 
        default: arrowColor = sequenceColors.fifth; break; 
      }

      if (i === 0) {
        highlightSquare(from, 'rgba(66, 165, 245, 0.4)');
        highlightSquare(to, 'rgba(66, 165, 245, 0.6)');
      }

      const thickness = Math.max(3, 6 - moveSequenceIndex);
      const arrow = drawArrow(from, to, arrowColor, thickness);
      if (arrow) {
        arrow.style.opacity = Math.max(0.7, 1 - (moveSequenceIndex * 0.1));
      }
    }

    if (showOpponentResponses) {
      bmLog("Drawing opponent responses (enabled in settings)");

      for (let i = 0; i < opponentMoves.length; i++) {
        const { index, move } = opponentMoves[i];

        const from = move.substring(0, 2);
        const to = move.substring(2, 4);

        const fadeIntensity = i / Math.max(1, opponentMoves.length - 1) * 0.6; 
        const arrowColor = getFadedColor(sequenceColors.opponent, fadeIntensity);

        const thickness = Math.max(2, 5 - Math.floor(i / 2));
        const arrow = drawArrow(from, to, arrowColor, thickness);
        if (arrow) {
          arrow.style.opacity = Math.max(0.7, 1 - (i * 0.05));
        }
      }
    } else {
      bmLog("Opponent responses not shown (disabled in settings)");
    }

    selectedLine = index;

    const allLines = document.querySelectorAll('.line');
    for (let i = 0; i < allLines.length; i++) {
      if (i === index) {
        allLines[i].classList.add('active');
        activeLineElement = allLines[i];
      } else {
        allLines[i].classList.remove('active');
      }
    }
  }

  function visualizeLine(lineIndex) {

    clearArrows();
    clearHighlights();

    bmLog("Visualizing line index:", lineIndex, "showOpponentResponses =", showOpponentResponses);

    if (!currentAnalysisData || !currentAnalysisData.topMoves || !currentAnalysisData.topMoves[lineIndex]) {
      bmError("No valid analysis data for line", lineIndex);
      return;
    }

    const moveData = currentAnalysisData.topMoves[lineIndex];
    const startingColor = currentAnalysisData.turnColor || 'w'; 
    bmLog("Move data for line " + lineIndex + ":", moveData);

    let moves = [];

    const lineElement = document.querySelector('.line[data-index="' + lineIndex + '"]');
    if (lineElement) {
      const movesElement = lineElement.querySelector('.line-moves');
      if (movesElement) {
        const fullText = movesElement.textContent || '';
        bmLog("Moves text from DOM:", fullText);

        const moveMatches = fullText.match(/[a-h][1-8]-[a-h][1-8](?:=[QRBN])?/g);
        if (moveMatches && moveMatches.length > 0) {

          moves = moveMatches.map(m => m.replace('-', '').replace(/=[QRBN]/, ''));
          bmLog("Extracted UCI moves from DOM:", moves);
        }
      }
    }

    if (moves.length === 0 && moveData.line && typeof moveData.line === 'string') {
      bmLog("Extracting moves from move.line property:", moveData.line);
      const movesStr = moveData.line.trim();

      const cleanMovesStr = movesStr.replace(/\d+\.\s*/g, '');
      const moveParts = cleanMovesStr.split(/\s+/);

      const uciMoves = moveParts.filter(m => 
        m && m.length >= 4 && 
        /^[a-h][1-8][a-h][1-8][qrbnkQRBNK]?$/.test(m)
      );

      if (uciMoves.length > 0) {
        moves = uciMoves;
        bmLog("Extracted UCI moves from line property:", moves);
      }
    }

    if (moves.length === 0 && moveData.move) {
      bmLog("Using only best move:", moveData.move);
      moves = [moveData.move];
    }

    if (moves.length === 0) {
      bmError("No valid moves found in line, even after multiple attempts");
      return;
    }

    const maxMoves = Math.min(moves.length, maxFutureMoves * 2); 
    bmLog("Visualizing " + maxMoves + " moves (max future moves setting: " + maxFutureMoves + ")");

    currentPlaybackMoves = moves.slice(0, maxMoves);

    const opponentMoves = [];
    const playerMoves = [];

    for (let idx = 0; idx < maxMoves; idx++) {
      if (isOpponentMove(idx, startingColor)) {
        opponentMoves.push({ index: idx, move: moves[idx] });
      } else {
        playerMoves.push({ index: idx, move: moves[idx] });
      }
    }

    for (let i = 0; i < playerMoves.length; i++) {
      const { index, move } = playerMoves[i];

      const from = move.substring(0, 2);
      const to = move.substring(2, 4);

      bmLog("Drawing player move " + index + ": " + from + " to " + to);

      let arrowColor;
      const moveSequenceIndex = Math.floor(index / 2); 
      switch(moveSequenceIndex) {
        case 0: arrowColor = sequenceColors.first; break;  
        case 1: arrowColor = sequenceColors.second; break; 
        case 2: arrowColor = sequenceColors.third; break;  
        case 3: arrowColor = sequenceColors.fourth; break; 
        default: arrowColor = sequenceColors.fifth; break; 
      }

      if (i === 0) {
        bmLog("Highlighting first move: " + from + " and " + to);
        highlightSquare(from, 'rgba(66, 165, 245, 0.4)'); 
        highlightSquare(to, 'rgba(66, 165, 245, 0.6)');   
      }

      const thickness = Math.max(3, 6 - moveSequenceIndex);
      const arrow = drawArrow(from, to, arrowColor, thickness);
      if (arrow) {
        arrow.style.opacity = Math.max(0.7, 1 - (moveSequenceIndex * 0.1));
        bmLog("Arrow drawn successfully for player move " + index);
      }
    }

    if (showOpponentResponses) {
      bmLog("Drawing opponent moves (enabled in settings)");

      for (let i = 0; i < opponentMoves.length; i++) {
        const { index, move } = opponentMoves[i];

        const from = move.substring(0, 2);
        const to = move.substring(2, 4);

        bmLog("Drawing opponent move " + index + ": " + from + " to " + to);

        const fadeIntensity = i / Math.max(1, opponentMoves.length - 1) * 0.6; 
        const arrowColor = getFadedColor(sequenceColors.opponent, fadeIntensity);

        const thickness = Math.max(2, 5 - Math.floor(i / 2));
        const arrow = drawArrow(from, to, arrowColor, thickness);
        if (arrow) {
          arrow.style.opacity = Math.max(0.7, 1 - (i * 0.05));
          bmLog("Arrow drawn successfully for opponent move " + index);
        }
      }
    } else {
      bmLog("Opponent responses not shown (disabled in settings)");
    }

    selectedLine = lineIndex;

    const allLines = document.querySelectorAll('.line');
    for (let i = 0; i < allLines.length; i++) {
      if (i === lineIndex) {
        allLines[i].classList.add('active');
        activeLineElement = allLines[i];
      } else {
        allLines[i].classList.remove('active');
      }
    }
  }

    function setupLineClickHandlers() {

      const lineElements = document.querySelectorAll('.line');
      bmLog("Setting up click handlers for", lineElements.length, "lines");

      for (let i = 0; i < lineElements.length; i++) {
        lineElements[i].onclick = null;
      }

      for (let i = 0; i < lineElements.length; i++) {

        lineElements[i].setAttribute('data-index', i);

        (function(index) {
          lineElements[index].onclick = function() {
            bmLog("Line " + index + " clicked");
            handleLineClick(index);
          };
        })(i);
      }
    }

    function updateAnalysis(data) {
      if (!data || !data.topMoves || data.topMoves.length === 0) {
        bmLog("No valid analysis data to update");
        return;
      }

      currentAnalysisData = data;
      bmLog("Updated analysis data received");

      selectedLine = null;
      activeLineElement = null;

      const noDataMessage = document.getElementById('no-data-message');
      if (noDataMessage) {
        noDataMessage.style.display = 'none';
      }

      if (data.fen) {

        if (data.fen !== currentFEN || !document.querySelector('.square')) {
          bmLog("Updating board with new FEN: " + data.fen);
          currentFEN = data.fen;
          drawChessboard(data.fen, boardFlipped);

          if (currentMoveIndex < moveHistory.length - 1) {
            moveHistory = moveHistory.slice(0, currentMoveIndex + 1);
            analysisHistory = analysisHistory.slice(0, currentMoveIndex + 1);
          }

          if (moveHistory.length === 0 || moveHistory[moveHistory.length - 1] !== data.fen) {
            moveHistory.push(data.fen);
            analysisHistory.push(JSON.parse(JSON.stringify(data)));
            currentMoveIndex = moveHistory.length - 1;
          }

          updateNavigationButtons();
        }
      }

      updateLinesDisplay(data);

      setTimeout(function() {
        showBestMoves();
        bmLog("Called showBestMoves after analysis update");
      }, 100); 
    }

    window.addEventListener('message', function(event) {

      if (event.data && event.data.type === 'bettermint-analysis-data') {
        bmLog("Received analysis data message");

        if (document.getElementById('settings-auto-update').checked) {
          updateAnalysis(event.data.data);

          setTimeout(function() {
            if (currentAnalysisData && currentAnalysisData.topMoves) {
              showBestMoves();
              bmLog("Called showBestMoves again after delay");
            }
          }, 500);
        }
      }
    });

    window.addEventListener('beforeunload', function() {
      window.opener.postMessage({ type: 'bettermint-analysis-closed' }, '*');
    });

    function notifyReady() {
      try {
        window.opener.postMessage({ type: 'bettermint-analysis-ready' }, '*');
        bmLog("Sent ready notification to opener");
      } catch (e) {
        bmError("Failed to notify opener:", e);

        setTimeout(notifyReady, 500);
      }
    }

    window.onerror = function(message, source, lineno, colno, error) {
      bmError("Error occurred:", message, "at", source, "line:", lineno, "column:", colno, "error:", error);
    };

    function goToStart() {
      if (moveHistory.length === 0) return;

      currentMoveIndex = 0;
      const initialFEN = moveHistory[0];
      currentFEN = initialFEN;
      drawChessboard(initialFEN, boardFlipped);

      showArrowsForPosition(0);

      updateNavigationButtons();
    }

    function goBackward() {
      if (currentMoveIndex <= 0) return;

      currentMoveIndex--;
      const previousFEN = moveHistory[currentMoveIndex];
      currentFEN = previousFEN;
      drawChessboard(previousFEN, boardFlipped);

      showArrowsForPosition(currentMoveIndex);

      updateNavigationButtons();
    }

    function goForward() {
      if (currentMoveIndex >= moveHistory.length - 1) return;

      currentMoveIndex++;
      const nextFEN = moveHistory[currentMoveIndex];
      currentFEN = nextFEN;
      drawChessboard(nextFEN, boardFlipped);

      showArrowsForPosition(currentMoveIndex);

      updateNavigationButtons();
    }

    function goToEnd() {
      if (moveHistory.length === 0) return;

      currentMoveIndex = moveHistory.length - 1;
      const latestFEN = moveHistory[currentMoveIndex];
      currentFEN = latestFEN;
      drawChessboard(latestFEN, boardFlipped);

      showArrowsForPosition(currentMoveIndex);

      updateNavigationButtons();
    }

    function showArrowsForPosition(index) {
      clearArrows();
      clearHighlights();

      const analysisData = analysisHistory[index];
      if (!analysisData || !analysisData.topMoves || analysisData.topMoves.length === 0) {
        return;
      }

      const movesToShow = Math.min(3, analysisData.topMoves.length);
      if (evaluationMode) {
        for (let i = 0; i < movesToShow; i++) {
          const move = analysisData.topMoves[i];
          if (!move || !move.move || move.move.length < 4) continue;
          const from = move.move.substring(0,2);
          const to = move.move.substring(2,4);
          let color = sequenceColors.first;
          if (i === 1) color = sequenceColors.second; else if (i === 2) color = sequenceColors.third;
          let evalText;
          if (move.mate !== null) {
            const mateIn = Math.abs(move.mate);
            evalText = move.mate > 0 ? 'M' + mateIn : '-M' + mateIn;
          } else {
            const cpEval = move.cp / 100;
            evalText = (cpEval >= 0 ? '+' : '') + cpEval.toFixed(2);
          }
          addMoveIndicator(from, color);
          addMoveIndicator(to, color, evalText);
        }
      } else {
        for (let i = 0; i < movesToShow; i++) {
          const move = analysisData.topMoves[i];
          if (!move || !move.move) continue;

          const from = move.move.substring(0, 2);
          const to = move.move.substring(2, 4);

          if (i === 0) {
            highlightSquare(from, 'rgba(66, 165, 245, 0.4)');
            highlightSquare(to, 'rgba(66, 165, 245, 0.6)');
          }

          let arrowColor = '';
          switch(i) {
            case 0: arrowColor = sequenceColors.first; break;
            case 1: arrowColor = sequenceColors.second; break;
            case 2: arrowColor = sequenceColors.third; break;
          }

          const arrow = drawArrow(from, to, arrowColor, 6 - i);
          if (arrow) {
            arrow.style.opacity = (1 - (i * 0.15));
          }
        }
      }

      updateLinesDisplay(analysisData);
    }

    function setupPlayButtonHandlers() {
        const playButtons = document.querySelectorAll('.play-button');

        for (let i = 0; i < playButtons.length; i++) {
          playButtons[i].addEventListener('click', function(e) {
            e.stopPropagation(); 

            const lineIndex = parseInt(this.getAttribute('data-index'), 10);
            startPlayingLine(lineIndex);
          });
        }
      }

      function updateLinesDisplay(analysisData) {
    if (!analysisData || !analysisData.topMoves || analysisData.topMoves.length === 0) {
      return;
    }

    const linesContainer = document.getElementById('lines-container');
    if (!linesContainer) return;

    linesContainer.innerHTML = '';

    const noDataMessage = document.getElementById('no-data-message');
    if (noDataMessage) {
      noDataMessage.style.display = 'none';
    }

    const depthElement = document.getElementById('depth');
    const evalElement = document.getElementById('position-eval');
    const bestMoveElement = document.getElementById('best-move');
    const moveQualityElement = document.getElementById('move-quality');

    if (depthElement) depthElement.textContent = analysisData.depth || '0';

    const bestMove = analysisData.topMoves[0];
    if (bestMove && evalElement) {
      let evalText, evalClass;

      if (bestMove.mate !== null) {
        const mateIn = Math.abs(bestMove.mate);
        evalText = bestMove.mate > 0 ? "M" + mateIn : "-M" + mateIn;
        evalClass = 'mate';
      } else {
        const cpEval = bestMove.cp / 100;
        evalText = cpEval > 0 ? "+" + cpEval.toFixed(2) : cpEval.toFixed(2);
        evalClass = cpEval >= 0 ? 'positive' : 'negative';
      }

      evalElement.textContent = evalText;
      evalElement.className = "stat-value " + evalClass;

      if (bestMoveElement) {
        bestMoveElement.textContent = formatSingleMove(bestMove.move);
      }
    }

    if (moveQualityElement && analysisData.lastMoveScore) {
      moveQualityElement.textContent = analysisData.lastMoveScore;

      const qualityColors = {
        'Brilliant': '#1baca6',
        'GreatFind': '#5c8bb0',
        'BestMove': '#9eba5a',
        'Excellent': '#96bc4b',
        'Good': '#96af8b',
        'Book': '#a88865',
        'Inaccuracy': '#f0c15c',
        'Mistake': '#e6912c',
        'Blunder': '#b33430',
        'MissedWin': '#dbac16'
      };

      if (qualityColors[analysisData.lastMoveScore]) {
        moveQualityElement.style.color = qualityColors[analysisData.lastMoveScore];
      }
    }

    analysisData.topMoves.forEach((move, index) => {
      const lineElement = document.createElement('div');
      lineElement.className = 'line';
      lineElement.dataset.index = index;

      let evalText, evalClass;

      if (move.mate !== null) {
        const mateIn = Math.abs(move.mate);
        evalText = move.mate > 0 ? "Mate in " + mateIn : "Mate in -" + mateIn;
        evalClass = 'mate';
      } else {
        const cpEval = move.cp / 100;
        evalText = cpEval > 0 ? "+" + cpEval.toFixed(2) : cpEval.toFixed(2);
        evalClass = cpEval >= 0 ? 'positive' : 'negative';
      }

      const formattedMoves = formatMoves(move.line, analysisData.turnColor);

      let moveRankLabel = "";
      if (index === 0) moveRankLabel = ' <span style="color:' + sequenceColors.first + '">★</span>';
      else if (index === 1) moveRankLabel = ' <span style="color:' + sequenceColors.second + '">★</span>';
      else if (index === 2) moveRankLabel = ' <span style="color:' + sequenceColors.third + '">★</span>';

      lineElement.innerHTML = 
        '<div class="line-header">' +
          '<div class="line-number">Line ' + (index + 1) + moveRankLabel + '</div>' +
          '<div class="line-eval ' + evalClass + '">' + evalText + '</div>' +
        '</div>' +
        '<div class="line-depth">Depth: ' + move.depth + '</div>' +
        '<div class="line-moves">' + formattedMoves + '</div>' +

        '<div class="line-controls">' +
          '<button class="play-button" data-index="' + index + '">Play Line</button>' +
        '</div>';

      linesContainer.appendChild(lineElement);
    });

    setupLineClickHandlers();

    setupPlayButtonHandlers();
  }

  function setupLineClickHandlers() {

    const lineElements = document.querySelectorAll('.line');
    bmLog("Setting up click handlers for", lineElements.length, "lines");

    for (let i = 0; i < lineElements.length; i++) {
      lineElements[i].onclick = null;
    }

    for (let i = 0; i < lineElements.length; i++) {

      lineElements[i].setAttribute('data-index', i);

      (function(index) {
        lineElements[index].onclick = function() {
          bmLog("Line " + index + " clicked");
          handleLineClick(index);
        };
      })(i);
    }
  }

  function setupPlayButtonHandlers() {
    const playButtons = document.querySelectorAll('.play-button');

    for (let i = 0; i < playButtons.length; i++) {
      playButtons[i].addEventListener('click', function(e) {
        e.stopPropagation(); 

        const lineIndex = parseInt(this.getAttribute('data-index'), 10);
        startPlayingLine(lineIndex);
      });
    }
  }

  function startPlayingLine(lineIndex) {
    if (isPlayingLine) return; 

    bmLog("Starting line playback for line", lineIndex);

    const analysisData = currentAnalysisData;
    if (!analysisData || !analysisData.topMoves || !analysisData.topMoves[lineIndex]) {
      bmError("No valid analysis data for playback");
      return;
    }

    originalFEN = currentFEN;
    bmLog("Stored original position:", originalFEN);

    const moveData = analysisData.topMoves[lineIndex];
    let moves = [];

    if (typeof moveData.line === 'string') {
      const movesStr = moveData.line.trim();
      const cleanMovesStr = movesStr.replace(/\d+\.\s*/g, '');
      const moveParts = cleanMovesStr.split(/\s+/);
      moves = moveParts.filter(m => 
        m && m.length >= 4 && 
        /^[a-h][1-8][a-h][1-8][qrbnkQRBNK]?$/.test(m)
      );
      bmLog("Extracted moves from string:", moves);
    } else if (Array.isArray(moveData.line)) {
      moves = moveData.line;
      bmLog("Using array of moves:", moves);
    }

    if (moves.length === 0 && moveData.move) {
      moves = [moveData.move];
      bmLog("Fallback to single best move:", moves);
    }

    if (moves.length === 0) {
      bmError("No valid moves found in line for playback");
      return;
    }

    currentPlaybackMoves = moves;
    currentPlaybackIndex = 0;
    isPlayingLine = true;

    updatePlayButtonsToStopButtons();

    advancePlayback();
  }

  function updatePlayButtonsToStopButtons() {
    const playButtons = document.querySelectorAll('.play-button');

    for (let i = 0; i < playButtons.length; i++) {
      const button = playButtons[i];
      button.textContent = 'Stop';
      button.className = 'stop-button';

      button.onclick = function(e) {
        e.stopPropagation();
        stopPlayingLine();
      };
    }
  }

  function advancePlayback() {
    if (currentPlaybackIndex >= currentPlaybackMoves.length) {

      bmLog("End of line reached, stopping playback");
      stopPlayingLine();
      return;
    }

    const move = currentPlaybackMoves[currentPlaybackIndex];
    bmLog("Playing move", currentPlaybackIndex + 1, "of", currentPlaybackMoves.length, ":", move);

    applyMoveToBoard(move);

    const from = move.substring(0, 2);
    const to = move.substring(2, 4);

    clearHighlights();
    highlightSquare(from, 'rgba(66, 165, 245, 0.4)');
    highlightSquare(to, 'rgba(66, 165, 245, 0.6)');

    currentPlaybackIndex++;

    playbackInterval = setTimeout(advancePlayback, playbackSpeed);
  }

  function applyMoveToBoard(move) {
    bmLog("Applying move to board:", move);

    const from = move.substring(0, 2);
    const to = move.substring(2, 4);

    const fromSquare = document.querySelector('.square[data-square="' + from + '"]');
    const toSquare = document.querySelector('.square[data-square="' + to + '"]');

    if (!fromSquare || !toSquare) {
      bmError("Could not find squares for move:", from, to);
      return;
    }

    const piece = fromSquare.querySelector('.piece');
    if (piece) {

      const existingPiece = toSquare.querySelector('.piece');
      if (existingPiece) {
        existingPiece.remove();
      }

      const newPiece = piece.cloneNode(true);
      toSquare.appendChild(newPiece);

      piece.remove();

      bmLog("Moved piece from", from, "to", to);
    } else {
      bmError("No piece found at square", from);
    }
  }

  function stopPlayingLine() {
    bmLog("Stopping line playback");
    isPlayingLine = false;

    if (playbackInterval) {
      clearTimeout(playbackInterval);
      playbackInterval = null;
    }

    if (originalFEN && autoRefreshPosition) {
      bmLog("Auto-refreshing to original position:", originalFEN);
      currentFEN = originalFEN;
      drawChessboard(originalFEN, boardFlipped);

      if (activeLineElement) {
        bmLog("Restoring active line visualization");
        activeLineElement.click();
      } else {
        bmLog("No active line to restore, showing best moves");
        showBestMoves();
      }
    } else if (!autoRefreshPosition) {
      bmLog("Auto-refresh disabled, position remains at end of line");
    }

    const stopButtons = document.querySelectorAll('.stop-button');

    for (let i = 0; i < stopButtons.length; i++) {
      const button = stopButtons[i];
      button.textContent = 'Play Line';
      button.className = 'play-button';

      const lineElement = button.closest('.line');
      if (lineElement && lineElement.dataset.index) {
        button.setAttribute('data-index', lineElement.dataset.index);
      }

      button.onclick = function(e) {
        e.stopPropagation();
        startPlayingLine(parseInt(this.getAttribute('data-index'), 10));
      };
    }

    bmLog("Playback stopped and UI reset");
  }

  function updateAnalysis(data) {
    if (!data || !data.topMoves || data.topMoves.length === 0) {
      bmLog("No valid analysis data to update");
      return;
    }

    currentAnalysisData = data;
    bmLog("Updated analysis data received");

    selectedLine = null;
    activeLineElement = null;

    const noDataMessage = document.getElementById('no-data-message');
    if (noDataMessage) {
      noDataMessage.style.display = 'none';
    }

    if (data.fen) {

      if (data.fen !== currentFEN || !document.querySelector('.square')) {
        bmLog("Updating board with new FEN: " + data.fen);
        currentFEN = data.fen;
        drawChessboard(data.fen, boardFlipped);

        if (currentMoveIndex < moveHistory.length - 1) {
          moveHistory = moveHistory.slice(0, currentMoveIndex + 1);
          analysisHistory = analysisHistory.slice(0, currentMoveIndex + 1);
        }

        if (moveHistory.length === 0 || moveHistory[moveHistory.length - 1] !== data.fen) {
          moveHistory.push(data.fen);
          analysisHistory.push(JSON.parse(JSON.stringify(data)));
          currentMoveIndex = moveHistory.length - 1;
        }

        updateNavigationButtons();
      }
    }

    updateLinesDisplay(data);

    setTimeout(function() {
      showBestMoves();
      bmLog("Called showBestMoves after analysis update");
    }, 100); 
  }

  window.addEventListener('message', function(event) {

    if (event.data && event.data.type === 'bettermint-analysis-data') {
      bmLog("Received analysis data message");

      if (document.getElementById('settings-auto-update').checked) {
        updateAnalysis(event.data.data);

        setTimeout(function() {
          if (currentAnalysisData && currentAnalysisData.topMoves) {
            showBestMoves();
            bmLog("Called showBestMoves again after delay");
          }
        }, 500);
      }
    }
  });

  window.addEventListener('beforeunload', function() {
    window.opener.postMessage({ type: 'bettermint-analysis-closed' }, '*');
  });

  function notifyReady() {
    try {
      window.opener.postMessage({ type: 'bettermint-analysis-ready' }, '*');
      bmLog("Sent ready notification to opener");
    } catch (e) {
      bmError("Failed to notify opener:", e);

      setTimeout(notifyReady, 500);
    }
  }

  window.onerror = function(message, source, lineno, colno, error) {
    bmError("Error occurred:", message, "at", source, "line:", lineno, "column:", colno, "error:", error);
  };

  function goToStart() {
    if (moveHistory.length === 0) return;

    currentMoveIndex = 0;
    const initialFEN = moveHistory[0];
    currentFEN = initialFEN;
    drawChessboard(initialFEN, boardFlipped);

    showArrowsForPosition(0);

    updateNavigationButtons();
  }

  function goBackward() {
    if (currentMoveIndex <= 0) return;

    currentMoveIndex--;
    const previousFEN = moveHistory[currentMoveIndex];
    currentFEN = previousFEN;
    drawChessboard(previousFEN, boardFlipped);

    showArrowsForPosition(currentMoveIndex);

    updateNavigationButtons();
  }

  function goForward() {
    if (currentMoveIndex >= moveHistory.length - 1) return;

    currentMoveIndex++;
    const nextFEN = moveHistory[currentMoveIndex];
    currentFEN = nextFEN;
    drawChessboard(nextFEN, boardFlipped);

    showArrowsForPosition(currentMoveIndex);

    updateNavigationButtons();
  }

  function goToEnd() {
    if (moveHistory.length === 0) return;

    currentMoveIndex = moveHistory.length - 1;
    const latestFEN = moveHistory[currentMoveIndex];
    currentFEN = latestFEN;
    drawChessboard(latestFEN, boardFlipped);

    showArrowsForPosition(currentMoveIndex);

    updateNavigationButtons();
  }

  function showArrowsForPosition(index) {
    clearArrows();
    clearHighlights();
    clearMoveIndicators();

    const analysisData = analysisHistory[index];
    if (!analysisData || !analysisData.topMoves || analysisData.topMoves.length === 0) {
      return;
    }

  const movesToShow = Math.min(3, analysisData.topMoves.length);
  if (evaluationMode) {
    for (let i = 0; i < movesToShow; i++) {
      const move = analysisData.topMoves[i];
      if (!move || !move.move || move.move.length < 4) continue;
      const from = move.move.substring(0,2);
      const to = move.move.substring(2,4);
      let color = sequenceColors.first;
      if (i === 1) color = sequenceColors.second; else if (i === 2) color = sequenceColors.third;
      let evalText;
      if (move.mate !== null) {
        const mateIn = Math.abs(move.mate);
        evalText = move.mate > 0 ? 'M' + mateIn : '-M' + mateIn;
      } else {
        const cpEval = move.cp / 100;
        evalText = (cpEval >= 0 ? '+' : '') + cpEval.toFixed(2);
      }
      addMoveIndicator(from, color);
      addMoveIndicator(to, color, evalText);
    }
  } else {
    for (let i = 0; i < movesToShow; i++) {
      const move = analysisData.topMoves[i];
      if (!move || !move.move) continue;

      const from = move.move.substring(0, 2);
      const to = move.move.substring(2, 4);

      if (i === 0) {
        highlightSquare(from, 'rgba(66, 165, 245, 0.4)'); 
        highlightSquare(to, 'rgba(66, 165, 245, 0.6)');   
      }

      let arrowColor = '';
      switch(i) {
        case 0: arrowColor = sequenceColors.first; break;
        case 1: arrowColor = sequenceColors.second; break;
        case 2: arrowColor = sequenceColors.third; break;
      }

      const arrow = drawArrow(from, to, arrowColor, 6 - i);
      if (arrow) {
        arrow.style.opacity = (1 - (i * 0.15));
      }
    }
  }

    updateLinesDisplay(analysisData);
  }

  function updateNavigationButtons() {
    const backButton = document.getElementById('go-backward');
    const forwardButton = document.getElementById('go-forward');
    const startButton = document.getElementById('go-to-start');
    const endButton = document.getElementById('go-to-end');

    if (backButton && startButton) {
      const canGoBack = currentMoveIndex > 0;
      backButton.disabled = !canGoBack;
      backButton.style.opacity = canGoBack ? '1' : '0.5';
      startButton.disabled = !canGoBack;
      startButton.style.opacity = canGoBack ? '1' : '0.5';
    }

    if (forwardButton && endButton) {
      const canGoForward = currentMoveIndex < moveHistory.length - 1;
      forwardButton.disabled = !canGoForward;
      forwardButton.style.opacity = canGoForward ? '1' : '0.5';
      endButton.disabled = !canGoForward;
      endButton.style.opacity = canGoForward ? '1' : '0.5';
    }
  }

  function updateMoveHistory(fen) {
    if (!fen) return;

    if (currentMoveIndex < moveHistory.length - 1) {
      moveHistory = moveHistory.slice(0, currentMoveIndex + 1);
      analysisHistory = analysisHistory.slice(0, currentMoveIndex + 1);
    }

    if (moveHistory.length === 0 || moveHistory[moveHistory.length - 1] !== fen) {
      moveHistory.push(fen);

      analysisHistory.push(currentAnalysisData ? JSON.parse(JSON.stringify(currentAnalysisData)) : null);
      currentMoveIndex = moveHistory.length - 1;
    }

    updateNavigationButtons();
  }

  window.addEventListener('DOMContentLoaded', function() {
    bmLog("DOM loaded, initializing analysis window");

    if (!document.getElementById('arrow-layer')) {
      bmLog("Arrow layer missing, creating one");
      const container = document.querySelector('.chessboard-container');
      if (container) {
        const arrowLayer = document.createElement('div');
        arrowLayer.id = 'arrow-layer';
        arrowLayer.className = 'arrow-layer';
        container.appendChild(arrowLayer);
      }
    }

    setupLineClickHandlers();

    initializeSettings();
    setupSettingsPanel();

    initializeColorPicker();

    const startButton = document.getElementById('go-to-start');
    const backButton = document.getElementById('go-backward');
    const forwardButton = document.getElementById('go-forward');
    const endButton = document.getElementById('go-to-end');

    if (startButton) startButton.addEventListener('click', function() {
      goToStart();
    });

    if (backButton) backButton.addEventListener('click', function() {
      goBackward();
    });

    if (forwardButton) forwardButton.addEventListener('click', function() {
      goForward();
    });

    if (endButton) endButton.addEventListener('click', function() {
      goToEnd();
    });

    const refreshButton = document.getElementById('refresh-button');
    if (refreshButton) {
      const originalClickHandler = refreshButton.onclick;
      refreshButton.onclick = function() {

        if (isPlayingLine && !autoRefreshPosition && originalFEN) {
          bmLog("Manual refresh requested - resetting to original position");
          currentFEN = originalFEN;
          drawChessboard(originalFEN, boardFlipped);

          if (activeLineElement) {
            setTimeout(() => activeLineElement.click(), 100);
          } else {
            setTimeout(() => showBestMoves(), 100);
          }
        } else {

          window.opener.postMessage({ type: 'bettermint-refresh' }, '*');
          bmLog("Refresh request sent to parent window");

          refreshButton.textContent = "Refreshing...";
          refreshButton.disabled = true;

          setTimeout(function() {
            refreshButton.textContent = "Refresh";
            refreshButton.disabled = false;
          }, 1000);

          setTimeout(function() {
            if (typeof forceArrowRedraw === 'function') {
              forceArrowRedraw();
            } else {
              bmError("forceArrowRedraw function not found");

              if (currentAnalysisData && currentAnalysisData.topMoves) {
                clearArrows();
                clearHighlights();
                showBestMoves();
                bmLog("Fallback arrow redraw executed");
              }
            }
          }, 300);
        }
      };
    }

    updateNavigationButtons();

    notifyReady();
  });

  if (document.readyState === 'complete') {
    bmLog("Document already loaded, initializing now");
    notifyReady();
  }

  window.moveHistory = moveHistory;
  window.currentMoveIndex = currentMoveIndex;
  window.goToStart = goToStart;
  window.goBackward = goBackward;
  window.goForward = goForward;
  window.goToEnd = goToEnd;
  </script>
  </body>
  </html>
  `;

  function openPopupWindow() {
    if (BMA.analysisWindow && !BMA.analysisWindow.closed) {
        BMA.analysisWindow.focus();
        return;
    }

    const blob = new Blob([streamproofHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    BMA.analysisWindow = window.open(url, 'CreatedByItayF', 'width=500,height=750,resizable=yes,scrollbars=yes');

    if (!BMA.analysisWindow) {
        alert('Please allow popups for BetterMint Analysis Window to work.');
        return;
    }

    window.addEventListener('message', function(event) {
        if (event.source === BMA.analysisWindow) {
            const message = event.data;

            if (message.type === 'bettermint-analysis-ready') {
                requestAnalysisUpdate();
                // Start monitoring game state when window is ready
                gameStateMonitor.start();
            } else if (message.type === 'bettermint-analysis-closed') {
                BMA.analysisWindow = null;
                // Stop monitoring when window is closed
                gameStateMonitor.stop();
            } else if (message.type === 'bettermint-toggle-mode') {
                BMA.toggleMode();
            } else if (message.type === 'bettermint-refresh') {
                requestAnalysisUpdate();
            } else if (message.type === 'bettermint-auto-update') {
                BMA.autoUpdate = message.enabled;
                BMA.savePreferences();
                
                // Start or stop monitoring based on auto-update setting
                if (message.enabled && BMA.analysisWindow && !BMA.analysisWindow.closed) {
                    gameStateMonitor.start();
                } else {
                    gameStateMonitor.stop();
                }
            }
        }
    });

    URL.revokeObjectURL(url);
}

function requestAnalysisUpdate() {
    if (!BMA.analysisWindow || BMA.analysisWindow.closed) return;

    const engine = window.BetterMintmaster?.engine;
    if (!engine) return;

    let turnColor = 'w';
    let fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    if (window.BetterMintmaster?.game?.controller) {
        turnColor = BetterMintmaster.game.controller.getTurn() === 1 ? 'w' : 'b';
        fen = BetterMintmaster.game.controller.getFEN() || fen;
    }

    BMA.currentFEN = fen;

    try {
        BMA.analysisWindow.postMessage({
            type: 'bettermint-analysis-data',
            data: {
                topMoves: engine.topMoves,
                depth: engine.depth,
                lastMoveScore: engine.lastMoveScore,
                turnColor: turnColor,
                fen: fen
            }
        }, '*');

        bmLog("Sent analysis data with FEN:", fen);
    } catch (e) {
        bmError("Error sending data to analysis window:", e);
    }
}

function setupEngineListener() {
    try {
        const engine = window.BetterMintmaster?.engine;
        if (!engine) {
            // Retry after a delay if engine isn't ready
            setTimeout(setupEngineListener, 1000);
            return;
        }
        
        // If the engine has an event system, use it
        if (engine.on || engine.addEventListener) {
            const eventMethod = engine.on ? 'on' : 'addEventListener';
            
            // Listen for analysis updates
            engine[eventMethod]('analysis', function() {
                if (BMA.analysisWindow && !BMA.analysisWindow.closed && BMA.autoUpdate) {
                    requestAnalysisUpdate();
                }
            });
            
            // Listen for new moves
            engine[eventMethod]('newMove', function() {
                if (BMA.analysisWindow && !BMA.analysisWindow.closed && BMA.autoUpdate) {
                    requestAnalysisUpdate();
                }
            });
            
            bmLog("Engine event listeners set up successfully");
        }
    } catch (e) {
        bmError("Error setting up engine listeners:", e);
    }
}

// Initialize engine listener when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupEngineListener);
} else {
    setupEngineListener();
}

// Add cleanup on page unload
window.addEventListener('beforeunload', function() {
    gameStateMonitor.stop();
});

window.BetterMintAnalysis.gameStateMonitor = gameStateMonitor;

window.BetterMintAnalysis = Object.assign(window.BetterMintAnalysis, {
    openPopupWindow,
    requestAnalysisUpdate
});

function initializeKeyboardShortcut() {
    document.addEventListener('keydown', function(event) {
        if (event.altKey && event.key.toLowerCase() === 's') {
            event.preventDefault(); 
            openPopupWindow();
            bmLog("Streamproof window opened via Alt+S shortcut");
        }
    });
    bmLog("Alt+S keyboard shortcut initialized for streamproof window");
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeKeyboardShortcut);
} else {
    initializeKeyboardShortcut();
}

})();