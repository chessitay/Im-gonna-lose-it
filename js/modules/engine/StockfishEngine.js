import { enumOptions, getValueConfig } from '../core/Config.js';
import { TopMove, sortTopMoves } from '../utils/MoveUtils.js';
import { AutoMoveManager } from './AutoMoveManager.js';

export class StockfishEngine {
  constructor(BetterMintmaster) {
    this.BetterMintmaster = BetterMintmaster;
    this.worker = null;
    this.ws = null;
    this.readyCallbacks = [];
    this.moveCounter = 0;
    this.hasShownLimitMessage = false;
    this.isPreMoveSequence = false;
    this.topMoves = [];
    this.lastTopMoves = [];
    this.currentFEN = null;
    this.isAnalyzing = false;
    this.autoMoveManager = new AutoMoveManager(this, BetterMintmaster.game);
  }

  async initialize() {
    const stockfishJsURL = getValueConfig(enumOptions.UrlApiStockfish);
    const useApiStockfish = getValueConfig(enumOptions.ApiStockfish);

    console.log('Initializing Stockfish with URL:', stockfishJsURL);
    console.log('Using API Stockfish:', useApiStockfish);

    try {
      if (useApiStockfish) {
        await this.initializeWebSocket(stockfishJsURL);
      } else {
        // If it's a WebSocket URL, use WebSocket mode
        if (stockfishJsURL.startsWith('ws://') || stockfishJsURL.startsWith('wss://')) {
          await this.initializeWebSocket(stockfishJsURL);
        } else {
          // Otherwise try to use it as a Worker script
          await this.initializeWorker(stockfishJsURL);
        }
      }

      // Wait for engine to be ready
      await this.waitForReady();
      console.log('Engine initialized and ready');
    } catch (error) {
      console.error('Failed to initialize engine:', error);
      throw error;
    }
  }

  async waitForReady() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Engine initialization timeout'));
      }, 10000);

      const checkReady = (message) => {
        if (message.data === 'readyok') {
          clearTimeout(timeout);
          resolve();
        }
      };

      if (this.worker) {
        const originalOnMessage = this.worker.onmessage;
        this.worker.onmessage = (event) => {
          checkReady(event);
          originalOnMessage(event);
        };
      } else if (this.ws) {
        const originalOnMessage = this.ws.onmessage;
        this.ws.onmessage = (event) => {
          checkReady(event);
          originalOnMessage(event);
        };
      }

      this.send('isready');
    });
  }

  async initializeWorker(stockfishJsURL) {
    try {
      console.log('Initializing Stockfish worker with URL:', stockfishJsURL);
      this.worker = new Worker(stockfishJsURL);
      this.worker.onmessage = this.onStockfishResponse.bind(this);
      this.send('uci');
    } catch (error) {
      console.error('Failed to initialize Stockfish worker:', error);
      // Fallback to WebSocket if Worker fails
      await this.initializeWebSocket(stockfishJsURL);
    }
  }

  async initializeWebSocket(url) {
    try {
      console.log('Initializing Stockfish WebSocket with URL:', url);
      this.ws = new WebSocket(url);
      this.ws.onmessage = this.onStockfishResponse.bind(this);
      this.ws.onclose = this.handleDisconnect.bind(this);
      
      // Wait for WebSocket to be open
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, 5000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          this.send('uci');
          resolve();
        };
      });
    } catch (error) {
      console.error('Failed to initialize Stockfish WebSocket:', error);
      throw error;
    }
  }

  send(cmd) {
    if (this.worker) {
      this.worker.postMessage(cmd);
    } else if (this.ws && this.isWebSocketOpen()) {
      this.ws.send(cmd);
    } else {
      console.warn('Cannot send command - engine not initialized');
    }
  }

  isReady() {
    return (this.worker || (this.ws && this.isWebSocketOpen()));
  }

  isWebSocketOpen() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  go() {
    if (!this.isAnalyzing) {
      this.isAnalyzing = true;
      const depth = getValueConfig(enumOptions.Depth);
      const multiPV = getValueConfig(enumOptions.MultiPV);
      
      // Set MultiPV before starting analysis
      this.send('setoption name MultiPV value ' + multiPV);
      this.send('go depth ' + depth);
    }
  }

  handleDisconnect() {
    console.log('Stockfish WebSocket disconnected');
    setTimeout(this.attemptReconnect.bind(this), 1000);
  }

  async attemptReconnect() {
    if (!this.isWebSocketOpen()) {
      try {
        await this.initializeWebSocket(getValueConfig(enumOptions.ApiStockfish));
      } catch (error) {
        console.error('Failed to reconnect to Stockfish:', error);
        setTimeout(this.attemptReconnect.bind(this), 1000);
      }
    }
  }

  onReady(callback) {
    this.readyCallbacks.push(callback);
  }

  stopEvaluation(callback) {
    this.isAnalyzing = false;
    this.send('stop');
    if (callback) {
      callback();
    }
  }

  onStockfishResponse(event) {
    const message = event.data;
    this.ProcessMessage(message);
  }

  executeCallbacks() {
    for (const callback of this.readyCallbacks) {
      callback();
    }
    this.readyCallbacks = [];
  }

  UpdatePosition(FENs = null, isNewGame = true) {
    if (!this.BetterMintmaster.chessboard) {
      console.warn('Chessboard not initialized');
      return;
    }

    if (FENs) {
      this.currentFEN = FENs;
    } else {
      this.currentFEN = this.BetterMintmaster.chessboard.game.getFEN();
    }

    // Check opening book
    if (isNewGame && getValueConfig(enumOptions.OpeningBook) && this.BetterMintmaster.openingBook) {
      try {
        const bookMove = this.BetterMintmaster.openingBook.getMove(this.currentFEN);
        if (bookMove) {
          this.BetterMintmaster.chessboard.game.move(bookMove);
          return;
        }
      } catch (error) {
        console.warn('Error checking opening book:', error);
      }
    }

    // Check tablebase
    if (getValueConfig(enumOptions.Tablebase) && this.BetterMintmaster.tablebase) {
      try {
        const tablebaseMove = this.BetterMintmaster.tablebase.getBestMove(this.currentFEN);
        if (tablebaseMove) {
          this.BetterMintmaster.chessboard.game.move(tablebaseMove);
          return;
        }
      } catch (error) {
        console.warn('Error checking tablebase:', error);
      }
    }

    this.send('position fen ' + this.currentFEN);
    this.go();
  }

  restartGame() {
    this.moveCounter = 0;
    this.hasShownLimitMessage = false;
    this.isPreMoveSequence = true;
    this.topMoves = [];
    this.lastTopMoves = [];
    this.currentFEN = null;
    this.isAnalyzing = false;
  }

  UpdateExtensionOptions(options) {
    if (options) {
      this.BetterMintmaster.options = options;
    }
    this.UpdateOptions();
  }

  UpdateOptions(options = null) {
    if (options) {
      this.BetterMintmaster.options = options;
    }

    const depth = getValueConfig(enumOptions.Depth);
    const threads = getValueConfig(enumOptions.NumCores);
    const hash = getValueConfig(enumOptions.HashtableRam);
    const multiPV = getValueConfig(enumOptions.MultiPV);

    // Update engine options
    this.send('setoption name MultiPV value ' + multiPV);
    this.send('setoption name Threads value ' + threads);
    this.send('setoption name Hash value ' + hash);

    // Restart analysis with new settings if currently analyzing
    if (this.isAnalyzing) {
      this.stopEvaluation(() => {
        // Update position and restart analysis
        this.UpdatePosition(this.currentFEN, false);
      });
    }
  }

  ProcessMessage(message) {
    if (message === 'readyok') {
      this.executeReadyCallbacks();
      return;
    }

    if (message.startsWith('info')) {
      this.processInfoMessage(message);
    }
  }

  processInfoMessage(message) {
    const parts = message.split(' ');
    let depth = 0;
    let score = 0;
    let isMate = false;
    let pv = [];
    let multiPV = 1;

    for (let i = 0; i < parts.length; i++) {
      switch (parts[i]) {
        case 'depth':
          depth = parseInt(parts[++i]);
          break;
        case 'score':
          if (parts[i + 1] === 'cp') {
            score = parseInt(parts[i + 2]) / 100;
            i += 2;
          } else if (parts[i + 1] === 'mate') {
            score = parseInt(parts[i + 2]);
            isMate = true;
            i += 2;
          }
          break;
        case 'pv':
          pv = parts.slice(i + 1);
          i = parts.length;
          break;
        case 'multipv':
          multiPV = parseInt(parts[++i]);
          break;
      }
    }

    // Update analysis tools
    if (this.BetterMintmaster.analysisTools) {
      // Update evaluation bar
      this.BetterMintmaster.analysisTools.updateEvaluation(score, isMate);
      
      // Update depth bar
      const maxDepth = getValueConfig(enumOptions.Depth);
      const depthPercentage = (depth / maxDepth) * 100;
      this.BetterMintmaster.analysisTools.updateDepth(depthPercentage);
    }

    // Update top moves
    if (depth > 0 && pv.length > 0) {
      const move = pv[0];
      if (move && typeof move === 'string' && move.length >= 4) {
        this.onTopMoves(move, multiPV === 1);
      }
    }
  }

  executeReadyCallbacks() {
    this.send('uci');
    this.send('isready');
  }

  MoveAndGo(FENs = null, isNewGame = true) {
    let go = () => {
      this.UpdatePosition(FENs, isNewGame);
    };

    if (this.isAnalyzing) {
      this.stopEvaluation(go);
    } else {
      go();
    }
  }

  AnalyzeLastMove() {
    if (!this.topMoves.length) return;

    const lastMove = this.topMoves[this.topMoves.length - 1];
    if (!lastMove || typeof lastMove !== 'string' || lastMove.length < 4) return;

    const from = lastMove.substring(0, 2);
    const to = lastMove.substring(2, 4);

    // Get move quality
    const quality = this.getMoveQuality(lastMove);
    if (quality && this.BetterMintmaster.game && this.BetterMintmaster.game.controller) {
      const qualityMarking = {
        type: 'effect',
        square: to,
        effect: quality,
        color: '#808080',
        data: { square: to, effect: quality, color: '#808080' }
      };
      
      this.BetterMintmaster.game.controller.markings.addOne(qualityMarking);
    }
  }

  getMoveQuality(move) {
    // Implement move quality logic here
    // This is a placeholder - you should implement proper move quality analysis
    return null;
  }

  onTopMoves(move, isBestMove) {
    if (!move || typeof move !== 'string' || move.length < 4) return;

    const from = move.substring(0, 2);
    const to = move.substring(2, 4);
    
    // Get arrow color based on move ranking
    let color;
    if (isBestMove) {
      color = getValueConfig(enumOptions.ArrowColor) || '#5d3fd3';
    } else {
      // Use different colors for different move rankings
      const colors = ['#3f5dd3', '#d33f5d', '#808080'];
      const index = Math.min(this.topMoves.length, colors.length - 1);
      color = colors[index];
    }

    // Add arrow with proper color
    if (this.BetterMintmaster.game && this.BetterMintmaster.game.controller) {
      const arrowMarking = {
        type: 'arrow',
        from: from,
        to: to,
        color: color,
        data: { from, to, color: color }
      };
      
      this.BetterMintmaster.game.controller.markings.addOne(arrowMarking);
    }

    // Store move for analysis
    this.topMoves.push(move);
    if (this.topMoves.length > 3) {
      this.topMoves.shift();
    }

    // Analyze the last move
    this.AnalyzeLastMove();
  }

  speakMove(move) {
    const msg = new SpeechSynthesisUtterance(move.move);
    const voices = window.speechSynthesis.getVoices();
    const femaleVoices = voices.filter(voice => 
      voice.voiceURI.includes("Google UK English Female")
    );
    if (femaleVoices.length > 0) {
      msg.voice = femaleVoices[0];
    }
    msg.volume = 0.75;
    msg.rate = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(msg);
  }

  sortTopMoves() {
    this.topMoves = sortTopMoves(this.topMoves);
  }
} 