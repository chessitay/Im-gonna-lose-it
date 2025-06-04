(function() {

    window.BetterMintAnalysis = window.BetterMintAnalysis || {};

    const BMA = window.BetterMintAnalysis;

    const defaultSettings = {
        autoUpdate: true,
        showOpponentArrows: true,
        moveQualityHints: true,
        boardFlipSync: true,
        handBrainMode: false,
        showPieceImages: true,
        criticalPositionDetector: true
    };

    BMA.settings = {
        autoUpdate: localStorage.getItem('bettermint-auto-update') === 'false' ? false : defaultSettings.autoUpdate,
        showOpponentArrows: localStorage.getItem('bettermint-show-opponent-arrows') === 'false' ? false : defaultSettings.showOpponentArrows,
        moveQualityHints: localStorage.getItem('bettermint-move-quality-hints') === 'false' ? false : defaultSettings.moveQualityHints,
        boardFlipSync: localStorage.getItem('bettermint-board-flip-sync') === 'false' ? false : defaultSettings.boardFlipSync,
        handBrainMode: localStorage.getItem('bettermint-hand-brain-mode') === 'true' ? true : defaultSettings.handBrainMode,
        showPieceImages: localStorage.getItem('bettermint-show-piece-images') === 'false' ? false : defaultSettings.showPieceImages,
        criticalPositionDetector: localStorage.getItem('bettermint-critical-position-detector') === 'false' ? false : defaultSettings.criticalPositionDetector
    };

    BMA.currentFEN = null;
    BMA.originalFEN = null;
    BMA.theme = localStorage.getItem('bettermint-theme') || 'dark';

    BMA.sequenceColors = {
        first: '#3F88C5',      
        second: '#44BBA4',     
        third: '#E94F37',      
        fourth: '#F6AE2D',     
        fifth: '#9B5DE5',      
        opponent: '#FF7043'    
    };

    BMA.pieceImages = {
        'p': '♟︎', 'P': '♙',  
        'r': '♜', 'R': '♖',  
        'n': '♞', 'N': '♘',  
        'b': '♝', 'B': '♗',  
        'q': '♛', 'Q': '♕',  
        'k': '♚', 'K': '♔',  
    };

    BMA.pieceNames = {
        'p': 'pawn', 'P': 'pawn',
        'r': 'rook', 'R': 'rook',
        'n': 'knight', 'N': 'knight',
        'b': 'bishop', 'B': 'bishop',
        'q': 'queen', 'Q': 'queen',
        'k': 'king', 'K': 'king',
    };

    BMA.saveSettings = function() {
        for (const key in this.settings) {
            localStorage.setItem(`bettermint-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, this.settings[key]);
        }
    };

    const analysisStyles = `
    :root {
      --bettermint-primary: #5d3fd3;
      --bettermint-primary-dark: #4a32b0;
      --bettermint-primary-light: #7b63e0;
      --bettermint-bg: #1d1e22;
      --bettermint-card: #29292f;
      --bettermint-card-hover: #34343c;
      --bettermint-text: #ffffff;
      --bettermint-text-secondary: #b0b0b0;
      --bettermint-border: rgba(255, 255, 255, 0.1);
      --bettermint-positive: #42d392;
      --bettermint-negative: #ff5757;
      --bettermint-mate: #ffcc00;
      --bettermint-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
      --bettermint-transition: all 0.2s ease;
    }

    .bettermint-analysis-window {
      position: fixed;
      z-index: 9999;
      width: 380px;
      background-color: var(--bettermint-bg);
      color: var(--bettermint-text);
      font-family: "Inter", "Segoe UI", "Roboto", Arial, sans-serif;
      box-shadow: var(--bettermint-shadow);
      border-radius: 12px;
      top: 100px;
      right: 20px;
      resize: both;
      overflow: auto;
      max-height: 90vh;
      transition: var(--bettermint-transition);
      border: 1px solid var(--bettermint-border);
    }

    body.ultra-dark .bettermint-analysis-window {
      --bettermint-bg: #000;
      --bettermint-card: #141418;
    }

    .bettermint-analysis-header {
      background: linear-gradient(135deg, var(--bettermint-primary), var(--bettermint-primary-dark));
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: move;
      user-select: none;
      border-radius: 12px 12px 0 0;
      color: white;
    }

    .bettermint-analysis-title {
      font-weight: 600;
      font-size: 14px;
      letter-spacing: 0.3px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .bettermint-analysis-title::before {
      content: "⚡";
      font-size: 16px;
    }

    .bettermint-analysis-controls {
      display: flex;
    }

    .bettermint-analysis-button {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;
      font-size: 16px;
      margin-left: 12px;
      padding: 0;
      transition: var(--bettermint-transition);
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }

    .bettermint-analysis-button:hover {
      color: white;
      background-color: rgba(255, 255, 255, 0.15);
    }

    .bettermint-analysis-content {
      padding: 16px;
      overflow-y: auto;
      max-height: calc(90vh - 50px);
    }

    .bettermint-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 18px;
    }

    .bettermint-stat-box {
      background-color: var(--bettermint-card);
      padding: 12px;
      border-radius: 10px;
      text-align: center;
      transition: var(--bettermint-transition);
      border: 1px solid var(--bettermint-border);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .bettermint-stat-box:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }

    .bettermint-stat-value {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 6px;
    }

    .bettermint-stat-label {
      font-size: 11px;
      color: var(--bettermint-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .bettermint-stat-value.positive {
      color: var(--bettermint-positive);
    }

    .bettermint-stat-value.negative {
      color: var(--bettermint-negative);
    }

    .bettermint-stat-value.mate {
      color: var(--bettermint-mate);
    }

    .bettermint-best-move {
      color: var(--bettermint-primary);
      font-weight: bold;
      font-family: "Roboto Mono", monospace;
    }

    .bettermint-analysis-refresh {
      margin: 16px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: var(--bettermint-card);
      padding: 12px;
      border-radius: 10px;
      border: 1px solid var(--bettermint-border);
    }

    .bettermint-auto-update {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .bettermint-hand-brain-box {
      background-color: var(--bettermint-card);
      border-radius: 10px;
      border: 1px solid var(--bettermint-border);
      padding: 16px;
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      animation: pulse 2s infinite;
    }

    .bettermint-hand-brain-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .bettermint-hand-brain-title h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--bettermint-primary-light);
    }

    .bettermint-piece-display {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin: 10px 0;
    }

    .bettermint-piece-image {
      font-size: 48px;
      line-height: 1;
      color: var(--bettermint-text);
    }

    .bettermint-piece-name {
      font-size: 24px;
      font-weight: 600;
      color: var(--bettermint-text);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .bettermint-piece-instruction {
      font-size: 14px;
      color: var(--bettermint-text-secondary);
      text-align: center;
      font-style: italic;
    }

    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(93, 63, 211, 0.4);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(93, 63, 211, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(93, 63, 211, 0);
      }
    }

    .bettermint-toggle {
      appearance: none;
      -webkit-appearance: none;
      width: 36px;
      height: 20px;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      position: relative;
      cursor: pointer;
      transition: var(--bettermint-transition);
      outline: none;
    }

    .bettermint-toggle::before {
      content: "";
      position: absolute;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background-color: white;
      top: 2px;
      left: 2px;
      transition: var(--bettermint-transition);
    }

    .bettermint-toggle:checked {
      background-color: var(--bettermint-primary);
    }

    .bettermint-toggle:checked::before {
      left: 18px;
    }

    .bettermint-toggle-label {
      font-size: 13px;
      cursor: pointer;
    }

    .bettermint-lines-container {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .bettermint-line {
      padding: 12px;
      border-radius: 10px;
      background-color: var(--bettermint-card);
      cursor: pointer;
      transition: var(--bettermint-transition);
      border: 1px solid var(--bettermint-border);
      position: relative;
      overflow: hidden;
    }

    .bettermint-line:hover {
      background-color: var(--bettermint-card-hover);
      transform: translateY(-2px);
    }

    .bettermint-line.active {
      background-color: rgba(93, 63, 211, 0.15);
      border-left: 3px solid var(--bettermint-primary);
    }

    .bettermint-line.active::before {
      content: "";
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: 3px;
      background-color: var(--bettermint-primary);
    }

    .bettermint-line-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .bettermint-line-number {
      font-weight: 600;
      color: var(--bettermint-primary);
      font-size: 14px;
    }

    .bettermint-line-eval {
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 13px;
      font-family: "Roboto Mono", monospace;
      letter-spacing: -0.5px;
    }

    .bettermint-line-eval.positive {
      background-color: rgba(66, 211, 146, 0.15);
      color: var(--bettermint-positive);
    }

    .bettermint-line-eval.negative {
      background-color: rgba(255, 87, 87, 0.15);
      color: var(--bettermint-negative);
    }

    .bettermint-line-eval.mate {
      background-color: rgba(255, 204, 0, 0.15);
      color: var(--bettermint-mate);
    }

    .bettermint-line-depth {
      font-size: 12px;
      color: var(--bettermint-text-secondary);
      margin-bottom: 6px;
    }

    .bettermint-line-moves {
      font-family: "Roboto Mono", monospace;
      line-height: 1.5;
      word-wrap: break-word;
      font-size: 13px;
      background-color: rgba(0, 0, 0, 0.2);
      padding: 8px;
      border-radius: 6px;
      white-space: pre-wrap;
    }

    .bettermint-refresh-button {
      outline: none;
      cursor: pointer;
      font-weight: 500;
      border-radius: 6px;
      color: #fff;
      background: var(--bettermint-primary);
      line-height: 1.15;
      font-size: 13px;
      padding: 8px 14px;
      border: none;
      text-align: center;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      transition: var(--bettermint-transition);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .bettermint-refresh-button::before {
      content: "↻";
      font-size: 15px;
    }

    .bettermint-refresh-button:hover {
      background: var(--bettermint-primary-dark);
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .bettermint-refresh-button:active {
      transform: translateY(0);
    }

    .bettermint-reset-button {
      outline: none;
      cursor: pointer;
      font-weight: 500;
      border-radius: 6px;
      color: #fff;
      background: #ff5757;
      line-height: 1.15;
      font-size: 13px;
      padding: 8px 14px;
      border: none;
      text-align: center;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      transition: var(--bettermint-transition);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      margin-top: 16px;
    }

    .bettermint-reset-button::before {
      content: "⚠️";
      font-size: 14px;
    }

    .bettermint-reset-button:hover {
      background: #e04545;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }

    .bettermint-toggle-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, var(--bettermint-primary), var(--bettermint-primary-dark));
      color: white;
      border: none;
      border-radius: 50%;
      width: 54px;
      height: 54px;
      font-size: 24px;
      cursor: pointer;
      box-shadow: var(--bettermint-shadow);
      z-index: 9998;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: var(--bettermint-transition);
    }

    .bettermint-toggle-button:hover {
      transform: scale(1.05);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
    }

    .bettermint-move-sequence-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 16px;
      width: 100%;
      background-color: var(--bettermint-card);
      padding: 12px;
      border-radius: 10px;
      border: 1px solid var(--bettermint-border);
    }

    .bettermint-move-sequence-title {
      width: 100%;
      font-size: 12px;
      color: var(--bettermint-text-secondary);
      margin-bottom: 8px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .bettermint-move-sequence-item {
      display: flex;
      align-items: center;
      font-size: 12px;
      background-color: rgba(0, 0, 0, 0.2);
      padding: 5px 8px;
      border-radius: 6px;
    }

    .bettermint-sequence-color-sample {
      width: 16px;
      height: 6px;
      border-radius: 3px;
      margin-right: 6px;
    }

    .bettermint-settings-panel {
      position: absolute;
      right: 0;
      top: 55px;
      width: 340px;
      max-width: 90vw;
      background-color: var(--bettermint-bg);
      border-radius: 10px;
      border: 1px solid var(--bettermint-border);
      box-shadow: var(--bettermint-shadow);
      padding: 20px;
      z-index: 10000;
      transform: translateX(100%);
      opacity: 0;
      transition: all 0.3s ease;
      overflow-x: auto;
      overflow-y: auto;
      max-height: 80vh;
    }

    .bettermint-settings-panel.visible {
      transform: translateX(0);
      opacity: 1;
    }

    .bettermint-settings-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 16px;
      color: var(--bettermint-text);
      padding-bottom: 8px;
      border-bottom: 1px solid var(--bettermint-border);
    }

    .bettermint-settings-group {
      margin-bottom: 20px;
    }

    .bettermint-settings-group-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--bettermint-primary-light);
      margin-bottom: 12px;
      padding-bottom: 5px;
      border-bottom: 1px dashed rgba(93, 63, 211, 0.3);
    }

    .bettermint-settings-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 300px;
    }

    .bettermint-settings-table th {
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: var(--bettermint-text-secondary);
      padding: 5px 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid var(--bettermint-border);
    }

    .bettermint-settings-table td {
      padding: 12px 10px;
      border-bottom: 1px solid var(--bettermint-border);
      vertical-align: middle;
    }

    .bettermint-settings-table td:first-child {
      width: 78%;
    }

    .bettermint-settings-table td:last-child {
      width: 22%;
      text-align: center;
    }

    .bettermint-settings-table tr:last-child td {
      border-bottom: none;
    }

    .bettermint-settings-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--bettermint-text);
      display: block;
      margin-bottom: 4px;
    }

    .bettermint-settings-description {
      font-size: 12px;
      color: var(--bettermint-text-secondary);
      display: block;
      line-height: 1.4;
    }

    .bettermint-critical-position {
      margin-top: 16px;
      padding: 12px;
      background-color: rgba(255, 87, 34, 0.15);
      border-left: 3px solid #FF5722;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 10px;
      animation: pulse-critical 2s infinite;
    }

    .bettermint-critical-position-icon {
      font-size: 24px;
      color: #FF5722;
    }

    .bettermint-critical-position-text {
      flex-grow: 1;
    }

    .bettermint-critical-position-title {
      font-weight: 600;
      margin-bottom: 4px;
      color: #FF5722;
    }

    .bettermint-critical-position-description {
      font-size: 13px;
      color: var(--bettermint-text);
    }

    .bettermint-critical-stat-box {
      grid-column: 1 / -1; 
      background: linear-gradient(135deg, rgba(255, 87, 34, 0.15), rgba(255, 152, 0, 0.15));
      border: 2px solid #FF5722;
      animation: critical-pulse 1.5s infinite;
      position: relative;
      overflow: hidden;
    }

    .bettermint-critical-stat-box::before {
      content: "";
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      transform: rotate(45deg);
      animation: shimmer 2s infinite;
    }

    .bettermint-critical-stat-box .bettermint-stat-value {
      color: #FF5722;
      font-size: 16px;
      font-weight: 700;
      text-shadow: 0 0 10px rgba(255, 87, 34, 0.5);
    }

    .bettermint-critical-stat-box .bettermint-stat-label {
      color: #FF8A65;
      font-weight: 600;
    }

    @keyframes critical-pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(255, 87, 34, 0.7);
        transform: scale(1);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(255, 87, 34, 0);
        transform: scale(1.02);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(255, 87, 34, 0);
        transform: scale(1);
      }
    }

    @keyframes shimmer {
      0% {
        transform: translateX(-100%) translateY(-100%) rotate(45deg);
      }
      100% {
        transform: translateX(100%) translateY(100%) rotate(45deg);
      }
    }

    @keyframes fadeOut {
      from {
        opacity: 1;
        transform: scale(1);
      }
      to {
        opacity: 0;
        transform: scale(0.8);
      }
    }

    @keyframes pulse-critical {
      0% {
        box-shadow: 0 0 0 0 rgba(255, 87, 34, 0.4);
      }
      70% {
        box-shadow: 0 0 0 8px rgba(255, 87, 34, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(255, 87, 34, 0);
      }
    }

    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    ::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb {
      background: var(--bettermint-primary);
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: var(--bettermint-primary-light);
    }

    .analysis-toggle-btn {
      background: linear-gradient(135deg, var(--bettermint-primary), var(--bettermint-primary-dark)) !important;
      border: none !important;
      color: white !important;
      font-weight: 600 !important;
      transition: var(--bettermint-transition) !important;
      border-radius: 6px !important;
      padding: 6px 12px !important;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2) !important;
    }

    .analysis-toggle-btn:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2) !important;
    }

    .analysis-toggle-btn.active {
      background: linear-gradient(135deg, var(--bettermint-primary-light), var(--bettermint-primary)) !important;
    }

    .bettermint-toast {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background-color: var(--bettermint-card);
      color: var(--bettermint-text);
      padding: 12px 16px;
      border-radius: 8px;
      z-index: 10000;
      transition: opacity 0.3s, transform 0.3s;
      box-shadow: var(--bettermint-shadow);
      font-weight: 500;
      border-left: 4px solid var(--bettermint-primary);
      transform: translateY(0);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .bettermint-toast::before {
      content: "✓";
      color: var(--bettermint-primary);
      font-weight: bold;
    }

    .bettermint-toast.hide {
      opacity: 0;
      transform: translateY(20px);
    }
    `;

    BMA.parseFEN = function(fen) {
        const parts = fen.split(' ');
        if (parts.length < 1) return null;

        const position = {
            board: Array(8).fill().map(() => Array(8).fill(null)),
            turn: parts[1] === 'w' ? 'w' : 'b',
            castling: parts[2] || '-',
            enPassant: parts[3] !== '-' ? parts[3] : null,
            halfmove: parseInt(parts[4] || '0', 10),
            fullmove: parseInt(parts[5] || '1', 10)
        };

        const rows = parts[0].split('/');
        if (rows.length !== 8) return null;

        for (let i = 0; i < 8; i++) {
            let col = 0;
            for (let j = 0; j < rows[i].length; j++) {
                const char = rows[i].charAt(j);
                if (/[1-8]/.test(char)) {
                    col += parseInt(char, 10);
                } else {
                    position.board[i][col] = char;
                    col++;
                }
            }
        }

        return position;
    };

    BMA.formatMoves = function(moves, turnColor) {
        if (!moves) return '';
        if (typeof moves === 'string') {

            return moves;
        }

        if (Array.isArray(moves)) {
            let formatted = '';
            let moveNumber = 1;

            for (let i = 0; i < moves.length; i++) {
                if (i % 2 === 0) {
                    formatted += moveNumber + '. ';
                    moveNumber++;
                }

                formatted += this.formatSingleMove(moves[i]) + ' ';
            }

            return formatted.trim();
        }

        return '';
    };

    BMA.formatSingleMove = function(move) {
        if (!move) return '';
        if (typeof move === 'string') {
            if (move.length < 4) return move;

            const from = move.substring(0, 2);
            const to = move.substring(2, 4);
            const promotion = move.length > 4 ? move.substring(4, 5) : '';

            return from + '-' + to + (promotion ? '=' + promotion.toUpperCase() : '');
        }

        return '';
    };

    BMA.squareToCoord = function(square, flipped = false) {
        if (!square || square.length !== 2) return null;

        const col = square.charCodeAt(0) - 'a'.charCodeAt(0);
        const row = 8 - parseInt(square.charAt(1), 10);

        if (col < 0 || col > 7 || row < 0 || row > 7) return null;

        if (flipped) {
            return { row: 7 - row, col: 7 - col };
        }

        return { row, col };
    };

    BMA.coordToSquare = function(row, col, flipped = false) {
        if (row < 0 || row > 7 || col < 0 || col > 7) return null;

        if (flipped) {
            row = 7 - row;
            col = 7 - col;
        }

        const file = String.fromCharCode('a'.charCodeAt(0) + col);
        const rank = 8 - row;

        return file + rank;
    };

    BMA.getPieceAtSquare = function(fen, square) {
        const position = this.parseFEN(fen);
        if (!position) return null;

        const coords = this.squareToCoord(square);
        if (!coords) return null;

        return position.board[coords.row][coords.col];
    };

    BMA.detectCriticalPosition = function(topMoves) {
        if (!topMoves || topMoves.length < 2 || !BMA.settings.criticalPositionDetector) {
            console.log('Critical position detection skipped:', { 
                hasTopMoves: !!topMoves, 
                moveCount: topMoves?.length, 
                settingEnabled: BMA.settings.criticalPositionDetector 
            });
            return null;
        }

        let criticalPosition = null;

        function getEvalScore(evalObj) {
            if (!evalObj) return null;
            if (evalObj.mate !== null) {

                return evalObj.mate > 0 ? 10000 - evalObj.mate * 100 : -10000 - evalObj.mate * 100;
            }
            return evalObj.cp || 0;
        }

        const bestMove = topMoves[0];
        const bestScore = getEvalScore(bestMove);

        console.log('Critical position check:', { 
            bestMove: bestMove?.move, 
            bestScore, 
            bestMate: bestMove?.mate, 
            bestCP: bestMove?.cp 
        });

        if (bestScore === null) {
            console.log('Best score is null, skipping detection');
            return null;
        }

        const isAdvantaged = bestScore > 0;

        if (bestMove.mate !== null && bestMove.mate > 0) {

            const otherMatesExist = topMoves.slice(1).some(move => move.mate !== null && move.mate > 0);

            if (!otherMatesExist) {
                criticalPosition = {
                    title: "Only Move to Mate!",
                    description: `Only one move leads to checkmate in ${bestMove.mate}. All other moves miss the winning opportunity.`,
                    type: "critical"
                };
                console.log('Critical position detected: Only move to mate');
                return criticalPosition;
            }
        }

        if (isAdvantaged) {

            const allOthersLose = topMoves.slice(1).every(move => {
                const moveScore = getEvalScore(move);
                return moveScore !== null && moveScore <= 0; 
            });

            if (allOthersLose) {
                criticalPosition = {
                    title: "Only Move Keeps Advantage!",
                    description: "This is the only move that maintains your advantage. All other moves hand the advantage to your opponent.",
                    type: "critical"
                };
                console.log('Critical position detected: Only move keeps advantage');
                return criticalPosition;
            }
        }

        if (topMoves.length >= 2) {
            const secondBestMove = topMoves[1];
            const secondBestScore = getEvalScore(secondBestMove);

            console.log('Checking score difference:', { 
                bestScore, 
                secondBestScore, 
                secondMove: secondBestMove?.move 
            });

            if (secondBestScore !== null && bestScore !== null) {

                const scoreDiff = Math.abs(bestScore - secondBestScore);

                let relativeThreshold;

                if (Math.abs(bestScore) < 100) {

                    relativeThreshold = 30; 
                } else if (Math.abs(bestScore) < 300) {

                    relativeThreshold = Math.abs(bestScore) * 0.25;
                } else {

                    relativeThreshold = Math.abs(bestScore) * 0.2;
                }

                console.log('Score difference analysis:', { 
                    scoreDiff, 
                    relativeThreshold, 
                    wouldTrigger: scoreDiff >= relativeThreshold 
                });

                if (scoreDiff >= relativeThreshold) {
                    let description;

                    if (bestScore > 0 && secondBestScore <= 0) {
                        description = "Critical decision! Only the best move maintains your advantage. The second-best move gives your opponent the upper hand.";
                    } else if (bestScore < 0 && secondBestScore < bestScore) {
                        description = "Critical defensive move! The best move minimizes your disadvantage significantly compared to alternatives.";
                    } else if (Math.abs(bestScore) < 100) {
                        description = "Sharp position! In this balanced position, move accuracy is crucial. The best move is significantly better than alternatives.";
                    } else {
                        const percentDiff = Math.round((scoreDiff / Math.abs(bestScore)) * 100);
                        description = `Critical position! The best move is ${percentDiff}% better than the second-best option.`;
                    }

                    criticalPosition = {
                        title: "Critical Choice",
                        description: description,
                        type: "critical"
                    };
                    console.log('Critical position detected: Score difference');
                    return criticalPosition;
                }
            }
        }

        if (!isAdvantaged && bestScore >= -50 && topMoves.length >= 2) {

            const allOthersWorse = topMoves.slice(1).every(move => {
                const moveScore = getEvalScore(move);
                return moveScore !== null && moveScore < bestScore - 100;
            });

            if (allOthersWorse) {
                criticalPosition = {
                    title: "Defensive Resource!",
                    description: "This move is your best defensive resource. It's the only move that keeps you in the game.",
                    type: "critical"
                };
                console.log('Critical position detected: Defensive resource');
                return criticalPosition;
            }
        }

        console.log('No critical position detected');
        return criticalPosition;
    };

    BMA.resetSettings = function() {
        BMA.settings = JSON.parse(JSON.stringify(defaultSettings));
        BMA.saveSettings();
        BMA.showToast('Settings reset to defaults');

        updateSettingsUI();

        const handBrainBox = document.getElementById('bettermint-hand-brain-box');
        const sequenceLegend = document.querySelector('.bettermint-move-sequence-legend');

        if (handBrainBox) {
            handBrainBox.style.display = BMA.settings.handBrainMode ? 'flex' : 'none';
        }

        if (sequenceLegend) {
            sequenceLegend.style.display = BMA.settings.handBrainMode ? 'none' : 'flex';
        }

        const autoUpdateCheckbox = document.getElementById('bettermint-auto-update-checkbox');
        if (autoUpdateCheckbox) {
            autoUpdateCheckbox.checked = BMA.settings.autoUpdate;
        }

        const controller = window.BetterMintmaster?.game?.controller;
        if (controller) {
            const fen = controller.getFEN();
            window.BetterMintmaster?.engine?.UpdatePosition(fen, false);
        }
    };

    function updateSettingsUI() {
        const settingsPanel = document.getElementById('bettermint-settings-panel');
        if (!settingsPanel) return;

        for (const key in BMA.settings) {
            const checkbox = document.getElementById(`bettermint-settings-${key}`);
            if (checkbox) {
                checkbox.checked = BMA.settings[key];
            }
        }
    }

    BMA.addCriticalStatBox = function(criticalPosition) {

        const existingBox = document.getElementById('bettermint-critical-stat');
        if (existingBox) {
            existingBox.remove();
        }

        const criticalBox = document.createElement('div');
        criticalBox.className = 'bettermint-stat-box bettermint-critical-stat-box';
        criticalBox.id = 'bettermint-critical-stat';

        criticalBox.innerHTML = `
            <div class="bettermint-stat-value">🚨 ${criticalPosition.title}</div>
            <div class="bettermint-stat-label">CRITICAL POSITION</div>
        `;

        const statsContainer = document.querySelector('.bettermint-stats');
        if (statsContainer) {
            statsContainer.appendChild(criticalBox);

            setTimeout(() => {
                if (document.body.contains(criticalBox)) {
                    criticalBox.style.animation = 'fadeOut 0.5s ease';
                    setTimeout(() => criticalBox.remove(), 500);
                }
            }, 15000);
        }
    };

    BMA.removeCriticalStatBox = function() {
        const existingBox = document.getElementById('bettermint-critical-stat');
        if (existingBox) {
            existingBox.remove();
        }
    };

    BMA.showToast = function(message, duration = 3000) {
        const existingToast = document.querySelector('.bettermint-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'bettermint-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    };

    function connectToMainBoard() {
        if (!window.BetterMintmaster || !window.BetterMintmaster.game) {
            setTimeout(connectToMainBoard, 500);
            return;
        }

        const originalHintMoves = BetterMintmaster.game.HintMoves;

        BetterMintmaster.game.HintMoves = function(topMoves, lastTopMoves, isBestMove) {

            originalHintMoves.call(this, topMoves, lastTopMoves, isBestMove);

            updateAnalysisStats(topMoves, isBestMove);

            BMA.currentFEN = BetterMintmaster.game.controller.getFEN();

            if (BMA.settings.handBrainMode && topMoves && topMoves.length > 0) {
                displayHandBrainHint(topMoves[0]);
            }
        };

        if (BetterMintmaster.game.controller) {
            BetterMintmaster.game.controller.on('Move', () => {

                BMA.currentFEN = BetterMintmaster.game.controller.getFEN();
            });
        }
    }

    function displayHandBrainHint(moveData) {
        if (!moveData || !moveData.move || moveData.move.length < 4) return;

        const fromSquare = moveData.move.substring(0, 2);

        const piece = BMA.getPieceAtSquare(BMA.currentFEN, fromSquare);
        if (!piece) return;

        const pieceName = BMA.pieceNames[piece] || 'piece';
        const pieceImage = BMA.pieceImages[piece] || '';

        const handBrainBox = document.getElementById('bettermint-hand-brain-box');
        if (handBrainBox) {
            const pieceImageEl = handBrainBox.querySelector('.bettermint-piece-image');
            const pieceNameEl = handBrainBox.querySelector('.bettermint-piece-name');

            if (pieceImageEl && BMA.settings.showPieceImages) {
                pieceImageEl.textContent = pieceImage;
                pieceImageEl.style.display = 'block';
            } else if (pieceImageEl) {
                pieceImageEl.style.display = 'none';
            }

            if (pieceNameEl) {
                pieceNameEl.textContent = pieceName;
            }

            handBrainBox.style.display = 'flex';
        }

        const controller = window.BetterMintmaster?.game?.controller;
        if (controller) {
            BetterMintmaster.game.RemoveCurrentMarkings();

            if (controller.markings && typeof controller.markings.removeAll === 'function') {
                controller.markings.removeAll();
            }

            const markings = [
                {
                    data: {
                        opacity: 0.7,
                        color: 'rgba(93, 63, 211, 0.7)',
                        square: fromSquare
                    },
                    node: true,
                    persistent: false,
                    type: 'highlight'
                }
            ];

            controller.markings.addMany(markings);
        }
    }

    function updateAnalysisStats(topMoves, isBestMove = false) {
        console.log('updateAnalysisStats called with:', { 
            moveCount: topMoves?.length, 
            isBestMove, 
            criticalDetectorEnabled: BMA.settings.criticalPositionDetector 
        });

        if (!topMoves || topMoves.length === 0) {
            console.log('No top moves available');
            return;
        }

        const engine = window.BetterMintmaster?.engine;
        if (!engine) {
            console.log('No engine available');
            return;
        }

        const depthElement = document.getElementById('bettermint-depth');
        const evalElement = document.getElementById('bettermint-position-eval');
        const bestMoveElement = document.getElementById('bettermint-best-move');
        const moveQualityElement = document.getElementById('bettermint-move-quality');
        const linesContainer = document.getElementById('bettermint-lines-container');
        const moveQualityContainer = document.getElementById('bettermint-move-quality-container');

        if (!linesContainer) {
            console.log('Lines container not found');
            return;
        }

        if (depthElement) {
            depthElement.textContent = engine.depth || '0';
        }

        const bestMove = topMoves[0];
        if (bestMove && evalElement) {
            let evalText, evalClass;

            if (bestMove.mate !== null) {
                const mateIn = Math.abs(bestMove.mate);
                evalText = bestMove.mate > 0 ? `M${mateIn}` : `-M${mateIn}`;
                evalClass = 'mate';
            } else {
                const cpEval = bestMove.cp / 100;
                evalText = cpEval > 0 ? `+${cpEval.toFixed(2)}` : cpEval.toFixed(2);
                evalClass = cpEval >= 0 ? 'positive' : 'negative';
            }

            evalElement.textContent = evalText;
            evalElement.className = `bettermint-stat-value ${evalClass}`;
        }

        if (bestMoveElement && bestMove) {

            if (BMA.settings.handBrainMode) {
                const fromSquare = bestMove.move.substring(0, 2);
                const piece = BMA.getPieceAtSquare(BMA.currentFEN, fromSquare);
                bestMoveElement.textContent = BMA.pieceNames[piece] || 'piece';
            } else {
                bestMoveElement.textContent = BMA.formatSingleMove(bestMove.move);
            }
        }

        if (moveQualityElement && engine.lastMoveScore) {
            moveQualityElement.textContent = engine.lastMoveScore;

            if (moveQualityContainer && !BMA.settings.moveQualityHints) {
                moveQualityContainer.style.display = 'none';
            } else if (moveQualityContainer) {
                moveQualityContainer.style.display = 'flex';
            }

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

            if (qualityColors[engine.lastMoveScore]) {
                moveQualityElement.style.color = qualityColors[engine.lastMoveScore];
            }
        }

        console.log('About to call detectCriticalPosition...');
        const criticalPosition = BMA.detectCriticalPosition(topMoves);
        console.log('detectCriticalPosition returned:', criticalPosition);
        updateCriticalPositionIndicator(criticalPosition);

        if (!BMA.settings.handBrainMode) {
            updateLinesContainer(topMoves);
        } else {

            linesContainer.innerHTML = '';
        }
    }

    function updateCriticalPositionIndicator(criticalPosition) {
        console.log('updateCriticalPositionIndicator called with:', criticalPosition);

        const existingIndicator = document.getElementById('bettermint-critical-position');
        if (existingIndicator) {
            existingIndicator.remove();
            console.log('Removed existing critical position indicator');
        }

        BMA.removeCriticalStatBox();

        if (!criticalPosition || !BMA.settings.criticalPositionDetector) {
            console.log('No critical position to show or feature disabled');
            return;
        }

        console.log('Creating prominent critical position alerts:', criticalPosition.title);

        BMA.addCriticalStatBox(criticalPosition);

        BMA.showToast(`🚨 ${criticalPosition.title}`, 4000);

        const indicator = document.createElement('div');
        indicator.className = 'bettermint-critical-position';
        indicator.id = 'bettermint-critical-position';

        indicator.innerHTML = `
            <div class="bettermint-critical-position-icon">⚠️</div>
            <div class="bettermint-critical-position-text">
                <div class="bettermint-critical-position-title">${criticalPosition.title}</div>
                <div class="bettermint-critical-position-description">${criticalPosition.description}</div>
            </div>
        `;

        if (criticalPosition.type === 'important') {
            indicator.style.backgroundColor = 'rgba(255, 193, 7, 0.15)';
            indicator.style.borderLeftColor = '#FFC107';
            const icon = indicator.querySelector('.bettermint-critical-position-icon');
            if (icon) icon.textContent = '⚡';
        }

        const linesContainer = document.getElementById('bettermint-lines-container');
        const analysisContent = document.querySelector('.bettermint-analysis-content');

        if (linesContainer) {
            console.log('Inserting indicator into lines container');
            linesContainer.insertBefore(indicator, linesContainer.firstChild);
        } else if (analysisContent) {
            console.log('Lines container not found, inserting into analysis content');
            analysisContent.appendChild(indicator);
        } else {
            console.log('No suitable container found, inserting into body');
            document.body.appendChild(indicator);

            indicator.style.position = 'fixed';
            indicator.style.top = '100px';
            indicator.style.left = '50%';
            indicator.style.transform = 'translateX(-50%)';
            indicator.style.zIndex = '10001';
            indicator.style.maxWidth = '400px';
        }

        console.log('All critical position alerts created and displayed');
    }

    function updateLinesContainer(topMoves) {
        const linesContainer = document.getElementById('bettermint-lines-container');
        if (!linesContainer) return;

        linesContainer.innerHTML = '';

        let turnColor = 'w';
        if (window.BetterMintmaster?.game?.controller) {
            turnColor = BetterMintmaster.game.controller.getTurn() === 1 ? 'w' : 'b';
        }

        topMoves.forEach((move, index) => {
            const lineElement = document.createElement('div');
            lineElement.className = 'bettermint-line';
            lineElement.setAttribute('data-index', index);

            let evalText, evalClass;

            if (move.mate !== null) {
                const mateIn = Math.abs(move.mate);
                evalText = move.mate > 0 ? `Mate in ${mateIn}` : `Mate in ${mateIn}`;
                evalClass = 'mate';
            } else {
                const cpEval = move.cp / 100;
                evalText = cpEval > 0 ? `+${cpEval.toFixed(2)}` : cpEval.toFixed(2);
                evalClass = cpEval >= 0 ? 'positive' : 'negative';
            }

            const formattedMoves = BMA.formatMoves(move.line, turnColor);

            lineElement.innerHTML = `
                <div class="bettermint-line-header">
                    <div class="bettermint-line-number">Line ${index + 1}</div>
                    <div class="bettermint-line-eval ${evalClass}">${evalText}</div>
                </div>
                <div class="bettermint-line-depth">Depth: ${move.depth || 0}</div>
                <div class="bettermint-line-moves">${formattedMoves}</div>
            `;

            linesContainer.appendChild(lineElement);
        });
    }

    function visualizeLine(lineIndex) {

        if (BMA.settings.handBrainMode) return;

        const engine = window.BetterMintmaster?.engine;
        if (!engine || !engine.topMoves || !engine.topMoves[lineIndex]) return;

        const controller = window.BetterMintmaster?.game?.controller;
        if (!controller) return;

        BetterMintmaster.game.RemoveCurrentMarkings();

        if (controller.markings && typeof controller.markings.removeAll === 'function') {
            controller.markings.removeAll();
        }

        const moveData = engine.topMoves[lineIndex];
        const startingColor = controller.getTurn() === 1 ? 'w' : 'b';

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

        if (moves.length === 0) return;

        const markings = [];

        function isOpponentMove(moveIndex, startingColor) {
            return (startingColor === 'w') ? (moveIndex % 2 === 1) : (moveIndex % 2 === 0);
        }

        const opponentMoves = [];
        const playerMoves = [];

        for (let idx = 0; idx < moves.length; idx++) {
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
                case 0: arrowColor = BMA.sequenceColors.first; break;  
                case 1: arrowColor = BMA.sequenceColors.second; break; 
                case 2: arrowColor = BMA.sequenceColors.third; break;  
                case 3: arrowColor = BMA.sequenceColors.fourth; break; 
                default: arrowColor = BMA.sequenceColors.fifth; break; 
            }

            if (i === 0) {

                markings.push({
                    data: {
                        opacity: 0.4,
                        color: 'rgba(63, 136, 197, 0.4)', 
                        square: from
                    },
                    node: true,
                    persistent: false,
                    type: 'highlight'
                });

                markings.push({
                    data: {
                        opacity: 0.6,
                        color: 'rgba(63, 136, 197, 0.6)', 
                        square: to
                    },
                    node: true,
                    persistent: false,
                    type: 'highlight'
                });
            }

            const thickness = 6 - moveSequenceIndex;
            const opacity = Math.max(0.7, 1 - (moveSequenceIndex * 0.1));

            markings.push({
                data: {
                    from: from,
                    to: to,
                    color: arrowColor,
                    opacity: opacity
                },
                node: true,
                persistent: false,
                type: 'arrow'
            });
        }

        if (BMA.settings.showOpponentArrows && opponentMoves.length > 0) {
            for (let i = 0; i < opponentMoves.length; i++) {
                const { index, move } = opponentMoves[i];

                const from = move.substring(0, 2);
                const to = move.substring(2, 4);

                const fadeIntensity = i / Math.max(1, opponentMoves.length - 1) * 0.6;
                const arrowColor = BMA.sequenceColors.opponent;

                const thickness = Math.max(2, 5 - Math.floor(i / 2));
                const opacity = Math.max(0.7, 1 - (i * 0.05));

                markings.push({
                    data: {
                        from: from,
                        to: to,
                        color: arrowColor,
                        opacity: opacity
                    },
                    node: true,
                    persistent: false,
                    type: 'arrow'
                });
            }
        }

        controller.markings.addMany(markings);

        const allLines = document.querySelectorAll('.bettermint-line');
        for (let i = 0; i < allLines.length; i++) {
            if (i === lineIndex) {
                allLines[i].classList.add('active');
            } else {
                allLines[i].classList.remove('active');
            }
        }
    }

    function createAnalysisPanel() {
        let existingPanel = document.getElementById('bettermint-analysis-panel');
        if (existingPanel) {
            existingPanel.style.display = 'block';

            const toggleButton = document.querySelector('.analysis-toggle-btn');
            if (toggleButton) {
                toggleButton.classList.add('active');
            }

            return existingPanel;
        }

        const panel = document.createElement('div');
        panel.className = 'bettermint-analysis-window';
        panel.id = 'bettermint-analysis-panel';
        panel.innerHTML = `
            <div class="bettermint-analysis-header">
                <div class="bettermint-analysis-title">BetterMint Analysis</div>
                <div class="bettermint-analysis-controls">
                    <button class="bettermint-analysis-button" id="bettermint-settings-button" title="Settings">⚙️</button>
                    <button class="bettermint-analysis-button" id="bettermint-pin-button" title="Pin/Unpin Window">📌</button>
                    <button class="bettermint-analysis-button" id="bettermint-minimize-button" title="Minimize/Maximize">-</button>
                    <button class="bettermint-analysis-button" id="bettermint-close-button" title="Close">×</button>
                </div>
            </div>
            <div class="bettermint-settings-panel" id="bettermint-settings-panel">
                <div class="bettermint-settings-title">Settings</div>

                <div class="bettermint-settings-group">
                    <table class="bettermint-settings-table">
                        <thead>
                            <tr>
                                <th>Setting</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <span class="bettermint-settings-name">Auto-update analysis</span>
                                    <span class="bettermint-settings-description">Toggle whether evaluation updates automatically</span>
                                </td>
                                <td>
                                    <input type="checkbox" id="bettermint-settings-autoUpdate" class="bettermint-toggle" ${BMA.settings.autoUpdate ? 'checked' : ''}>
                                </td>
                            </tr>

                            <tr>
                                <td>
                                    <span class="bettermint-settings-name">Show opponent arrows</span>
                                    <span class="bettermint-settings-description">Display arrows for opponent moves in PV</span>
                                </td>
                                <td>
                                    <input type="checkbox" id="bettermint-settings-showOpponentArrows" class="bettermint-toggle" ${BMA.settings.showOpponentArrows ? 'checked' : ''}>
                                </td>
                            </tr>

                            <tr>
                                <td>
                                    <span class="bettermint-settings-name">Move quality hints</span>
                                    <span class="bettermint-settings-description">Show "Brilliant", "Mistake" labels under last move</span>
                                </td>
                                <td>
                                    <input type="checkbox" id="bettermint-settings-moveQualityHints" class="bettermint-toggle" ${BMA.settings.moveQualityHints ? 'checked' : ''}>
                                </td>
                            </tr>

                            <tr>
                                <td>
                                    <span class="bettermint-settings-name">Board flip sync</span>
                                    <span class="bettermint-settings-description">Follow board flip on Chess.com (Should be on)</span>
                                </td>
                                <td>
                                    <input type="checkbox" id="bettermint-settings-boardFlipSync" class="bettermint-toggle" ${BMA.settings.boardFlipSync ? 'checked' : ''}>
                                </td>
                            </tr>

                            <tr>
                                <td>
                                    <span class="bettermint-settings-name">Critical Position Detector</span>
                                    <span class="bettermint-settings-description">Automatically identify turning points in the game</span>
                                </td>
                                <td>
                                    <input type="checkbox" id="bettermint-settings-criticalPositionDetector" class="bettermint-toggle" ${BMA.settings.criticalPositionDetector ? 'checked' : ''}>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="bettermint-settings-group">
                    <div class="bettermint-settings-group-title">Hand & Brain Mode</div>
                    <table class="bettermint-settings-table">
                        <tbody>
                            <tr>
                                <td>
                                    <span class="bettermint-settings-name">Hand & Brain Mode</span>
                                    <span class="bettermint-settings-description">Show only the piece to move, not where to move it</span>
                                </td>
                                <td>
                                    <input type="checkbox" id="bettermint-settings-handBrainMode" class="bettermint-toggle" ${BMA.settings.handBrainMode ? 'checked' : ''}>
                                </td>
                            </tr>

                            <tr>
                                <td>
                                    <span class="bettermint-settings-name">Show Piece Images</span>
                                    <span class="bettermint-settings-description">Show piece symbols in Hand & Brain mode</span>
                                </td>
                                <td>
                                    <input type="checkbox" id="bettermint-settings-showPieceImages" class="bettermint-toggle" ${BMA.settings.showPieceImages ? 'checked' : ''}>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <button class="bettermint-reset-button" id="bettermint-reset-settings">Reset to defaults</button>

                <button class="bettermint-refresh-button" id="bettermint-test-critical" style="background: #ff9800; margin-top: 8px;">Test Critical Alert</button>
            </div>
            <div class="bettermint-analysis-content">
                <!-- Hand & Brain Mode Box (hidden by default) -->
                <div class="bettermint-hand-brain-box" id="bettermint-hand-brain-box" style="display: ${BMA.settings.handBrainMode ? 'flex' : 'none'}">
                    <div class="bettermint-hand-brain-title">
                        <h3>Hand & Brain Mode</h3>
                    </div>
                    <div class="bettermint-piece-display">
                        <div class="bettermint-piece-image" style="display: ${BMA.settings.showPieceImages ? 'block' : 'none'}"></div>
                        <div class="bettermint-piece-name">--</div>
                    </div>
                    <div class="bettermint-piece-instruction">
                        Move the highlighted piece to the best square
                    </div>
                </div>

                <div class="bettermint-stats">
                    <div class="bettermint-stat-box">
                        <div class="bettermint-stat-value" id="bettermint-depth">0</div>
                        <div class="bettermint-stat-label">Depth</div>
                    </div>
                    <div class="bettermint-stat-box">
                        <div class="bettermint-stat-value" id="bettermint-position-eval">0.00</div>
                        <div class="bettermint-stat-label">Evaluation</div>
                    </div>
                    <div class="bettermint-stat-box">
                        <div class="bettermint-stat-value" id="bettermint-best-move">--</div>
                        <div class="bettermint-stat-label">Best Move</div>
                    </div>
                    <div class="bettermint-stat-box" id="bettermint-move-quality-container" style="display: ${BMA.settings.moveQualityHints ? 'flex' : 'none'}">
                        <div class="bettermint-stat-value" id="bettermint-move-quality">--</div>
                        <div class="bettermint-stat-label">Last Move</div>
                    </div>
                </div>

                <div class="bettermint-analysis-refresh">
                    <div class="bettermint-auto-update">
                        <input type="checkbox" id="bettermint-auto-update-checkbox" class="bettermint-toggle" ${BMA.settings.autoUpdate ? 'checked' : ''}>
                        <label for="bettermint-auto-update-checkbox" class="bettermint-toggle-label">Auto-update</label>
                    </div>
                    <button class="bettermint-refresh-button" id="bettermint-refresh-button">Refresh</button>
                </div>

                <div class="bettermint-move-sequence-legend" style="display: ${BMA.settings.handBrainMode ? 'none' : 'flex'}">
                    <div class="bettermint-move-sequence-title">Move Sequence Legend</div>
                    <div class="bettermint-move-sequence-item">
                        <div class="bettermint-sequence-color-sample" style="background-color: ${BMA.sequenceColors.first};"></div>
                        <span>1st</span>
                    </div>
                    <div class="bettermint-move-sequence-item">
                        <div class="bettermint-sequence-color-sample" style="background-color: ${BMA.sequenceColors.second};"></div>
                        <span>2nd</span>
                    </div>
                    <div class="bettermint-move-sequence-item">
                        <div class="bettermint-sequence-color-sample" style="background-color: ${BMA.sequenceColors.third};"></div>
                        <span>3rd</span>
                    </div>
                    <div class="bettermint-move-sequence-item">
                        <div class="bettermint-sequence-color-sample" style="background-color: ${BMA.sequenceColors.opponent};"></div>
                        <span>Opponent</span>
                    </div>
                </div>

                <div class="bettermint-lines-container" id="bettermint-lines-container">
                    <!-- Lines will be added here dynamically -->
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        setupPanelEventListeners(panel);

        return panel;
    }

    function setupPanelEventListeners(panel) {
        const closeButton = document.getElementById('bettermint-close-button');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                panel.style.display = 'none';

                const toggleButton = document.querySelector('.analysis-toggle-btn');
                if (toggleButton) {
                    toggleButton.classList.remove('active');
                }
            });
        }

        const minimizeButton = document.getElementById('bettermint-minimize-button');
        if (minimizeButton) {
            minimizeButton.addEventListener('click', () => {
                const content = panel.querySelector('.bettermint-analysis-content');
                if (content) {
                    if (content.style.display === 'none') {
                        content.style.display = 'block';
                        minimizeButton.textContent = '-';
                        panel.style.height = 'auto';
                        panel.style.resize = 'both';
                    } else {
                        content.style.display = 'none';
                        minimizeButton.textContent = '+';
                        panel.style.height = 'auto';
                        panel.style.resize = 'none';
                    }
                }
            });
        }

        const pinButton = document.getElementById('bettermint-pin-button');
        if (pinButton) {
            pinButton.addEventListener('click', () => {
                panel.classList.toggle('pinned');
                pinButton.style.color = panel.classList.contains('pinned') ? '#42d392' : 'white';
            });
        }

        const settingsButton = document.getElementById('bettermint-settings-button');
        const settingsPanel = document.getElementById('bettermint-settings-panel');
        if (settingsButton && settingsPanel) {
            settingsButton.addEventListener('click', () => {
                settingsPanel.classList.toggle('visible');
            });

            document.addEventListener('click', (e) => {
                if (!settingsPanel.contains(e.target) && 
                    !settingsButton.contains(e.target) && 
                    settingsPanel.classList.contains('visible')) {
                    settingsPanel.classList.remove('visible');
                }
            });
        }

        const resetButton = document.getElementById('bettermint-reset-settings');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                BMA.resetSettings();
            });
        }

        const testCriticalButton = document.getElementById('bettermint-test-critical');
        if (testCriticalButton) {
            testCriticalButton.addEventListener('click', () => {
                console.log('Test critical position button clicked');
                const testCriticalPosition = {
                    title: "Test Critical Position",
                    description: "This is a test to verify the critical position detection system is working correctly. You should see the stat box alert, toast notification, and indicator.",
                    type: "critical"
                };
                updateCriticalPositionIndicator(testCriticalPosition);
                BMA.showToast('Testing critical position alerts!', 2000);
            });
        }

        for (const key in BMA.settings) {
            const checkbox = document.getElementById(`bettermint-settings-${key}`);
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    BMA.settings[key] = checkbox.checked;
                    BMA.saveSettings();

                    if (key === 'autoUpdate') {

                        const mainCheckbox = document.getElementById('bettermint-auto-update-checkbox');
                        if (mainCheckbox) {
                            mainCheckbox.checked = BMA.settings.autoUpdate;
                        }
                    } else if (key === 'handBrainMode') {

                        const handBrainBox = document.getElementById('bettermint-hand-brain-box');
                        const sequenceLegend = document.querySelector('.bettermint-move-sequence-legend');

                        if (handBrainBox) {
                            handBrainBox.style.display = BMA.settings.handBrainMode ? 'flex' : 'none';
                        }

                        if (sequenceLegend) {
                            sequenceLegend.style.display = BMA.settings.handBrainMode ? 'none' : 'flex';
                        }

                        const linesContainer = document.getElementById('bettermint-lines-container');
                        if (linesContainer) {
                            if (BMA.settings.handBrainMode) {
                                linesContainer.innerHTML = '';
                            } else {

                                const controller = window.BetterMintmaster?.game?.controller;
                                if (controller) {
                                    const fen = controller.getFEN();
                                    window.BetterMintmaster?.engine?.UpdatePosition(fen, false);
                                }
                            }
                        }
                    } else if (key === 'showPieceImages') {

                        if (BMA.settings.handBrainMode) {
                            const pieceImageEl = document.querySelector('.bettermint-piece-image');
                            if (pieceImageEl) {
                                pieceImageEl.style.display = BMA.settings.showPieceImages ? 'block' : 'none';
                            }
                        }
                    } else if (key === 'moveQualityHints') {

                        const moveQualityContainer = document.getElementById('bettermint-move-quality-container');
                        if (moveQualityContainer) {
                            moveQualityContainer.style.display = BMA.settings.moveQualityHints ? 'flex' : 'none';
                        }
                    }

                    if (['showOpponentArrows', 'handBrainMode'].includes(key)) {
                        const controller = window.BetterMintmaster?.game?.controller;
                        if (controller) {
                            const fen = controller.getFEN();
                            window.BetterMintmaster?.engine?.UpdatePosition(fen, false);
                        }
                    }

                    BMA.showToast(`${key.replace(/([A-Z])/g, ' $1').toLowerCase()} ${checkbox.checked ? 'enabled' : 'disabled'}`);
                });
            }
        }

        const refreshButton = document.getElementById('bettermint-refresh-button');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {

                const originalText = refreshButton.innerHTML;
                refreshButton.innerHTML = '↻ Refreshing...';
                refreshButton.disabled = true;

                const controller = window.BetterMintmaster?.game?.controller;
                if (controller) {
                    const fen = controller.getFEN();
                    window.BetterMintmaster?.engine?.UpdatePosition(fen, false);

                    setTimeout(() => {
                        refreshButton.innerHTML = originalText;
                        refreshButton.disabled = false;
                        BMA.showToast('Analysis refreshed');
                    }, 500);
                } else {

                    setTimeout(() => {
                        refreshButton.innerHTML = originalText;
                        refreshButton.disabled = false;
                    }, 300);
                }
            });
        }

        const autoUpdateMainCheckbox = document.getElementById('bettermint-auto-update-checkbox');
        if (autoUpdateMainCheckbox) {
            autoUpdateMainCheckbox.addEventListener('change', () => {
                BMA.settings.autoUpdate = autoUpdateMainCheckbox.checked;

                const settingsCheckbox = document.getElementById('bettermint-settings-autoUpdate');
                if (settingsCheckbox) {
                    settingsCheckbox.checked = BMA.settings.autoUpdate;
                }

                BMA.saveSettings();
                BMA.showToast(`Auto-update ${BMA.settings.autoUpdate ? 'enabled' : 'disabled'}`);
            });
        }

        makeDraggable(panel);

        panel.addEventListener('click', (e) => {
            if (e.target.closest('.bettermint-line')) {
                const lineElement = e.target.closest('.bettermint-line');
                const lineIndex = parseInt(lineElement.getAttribute('data-index'), 10);

                lineElement.style.transition = 'transform 0.1s';
                lineElement.style.transform = 'scale(0.98)';

                setTimeout(() => {
                    lineElement.style.transform = '';
                    visualizeLine(lineIndex);
                }, 100);
            }
        });
    }

    function makeDraggable(element) {
        const header = element.querySelector('.bettermint-analysis-header');
        let isDragging = false;
        let offsetX, offsetY;

        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.bettermint-analysis-button')) {
                return;
            }

            isDragging = true;
            offsetX = e.clientX - element.getBoundingClientRect().left;
            offsetY = e.clientY - element.getBoundingClientRect().top;

            element.style.userSelect = 'none';
            document.body.style.userSelect = 'none';

            document.body.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;

            const maxX = window.innerWidth - element.offsetWidth;
            const maxY = window.innerHeight - element.offsetHeight;

            element.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
            element.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                element.style.userSelect = '';
                document.body.style.userSelect = '';
                document.body.style.cursor = '';
            }
        });
    }

    function addToggleButton() {

        const chessControls = document.querySelector('.board-controls-bottom');
        if (!chessControls) {

            console.log('Chess.com controls not found, using keyboard shortcut only');
            return;
        }

        if (document.querySelector('.analysis-toggle-btn')) {
            return;
        }

        const toggleButton = document.createElement('button');
        toggleButton.className = 'ui_v5-button-component ui_v5-button-basic analysis-toggle-btn';
        toggleButton.innerHTML = '<span>Analysis</span>';
        toggleButton.title = 'Toggle BetterMint Analysis (Alt+O)';
        toggleButton.addEventListener('click', toggleAnalysisPanel);
        chessControls.appendChild(toggleButton);
    }

    function toggleAnalysisPanel() {
        const panel = document.getElementById('bettermint-analysis-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';

            const toggleButton = document.querySelector('.analysis-toggle-btn');
            if (toggleButton) {
                if (panel.style.display === 'none') {
                    toggleButton.classList.remove('active');
                } else {
                    toggleButton.classList.add('active');
                }
            }
        } else {
            createAnalysisPanel();
        }
    }

    function injectStyles() {
        const styleElement = document.createElement('style');
        styleElement.textContent = analysisStyles;
        document.head.appendChild(styleElement);
    }

    function init() {

        injectStyles();
        createAnalysisPanel();
        connectToMainBoard();
        addToggleButton();

        document.addEventListener('keydown', function(e) {

            if (e.altKey && (e.key === 'o' || e.key === 'O')) {
                e.preventDefault(); 
                toggleAnalysisPanel();
                BMA.showToast('Analysis panel ' + 
                    (document.getElementById('bettermint-analysis-panel').style.display !== 'none' 
                        ? 'opened' 
                        : 'closed')
                );
            }
        });

        console.log('BetterMint Analysis initialized');

        BMA.showToast('BetterMint Analysis activated (Alt+O to toggle)', 3000);
    }

    function waitForBetterMintmaster() {
        if (window.BetterMintmaster && window.BetterMintmaster.game && window.BetterMintmaster.engine) {
            console.log('BetterMintmaster found, initializing analysis module');
            init();
        } else {
            console.log('Waiting for BetterMintmaster...');
            setTimeout(waitForBetterMintmaster, 1000);
        }
    }

    console.log('BetterMint Analysis module loading...');
    waitForBetterMintmaster();

    Object.assign(BMA, {
        createAnalysisPanel,
        connectToMainBoard,
        visualizeLine,
        updateAnalysisStats,
        injectStyles,
        updateLinesContainer,
        toggleAnalysisPanel,
        displayHandBrainHint,
        init
    });
})();