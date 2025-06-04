import { enumOptions, getValueConfig } from './Config.js';
import { ChromeRequest } from './ChromeRequest.js';
import { OpeningBook } from '../engine/OpeningBook.js';
import { Tablebase } from '../engine/Tablebase.js';
import { LuaInterface } from '../ui/LuaInterface.js';
import { TopMove, sortTopMoves, calculateGameAccuracy } from '../utils/MoveUtils.js';
import { getGradientColor } from '../utils/ColorUtils.js';

export class BetterMint {
  constructor(chessboard, options) {
    this.chessboard = chessboard;
    this.options = options;
    this.engine = null;
    this.game = null;
    this.openingBook = new OpeningBook();
    this.tablebase = new Tablebase();
    this.luaInterface = new LuaInterface();
    this.moveHistory = [];
    this.gameAccuracy = 100;
    
    // Initialize components
    this.initializeEngine();
    this.initializeGameController();
    this.initializeLuaInterface();
  }

  async initializeEngine() {
    // Initialize Stockfish engine
    this.engine = new StockfishEngine(this);
    await this.engine.initialize();
    
    // Load opening book and tablebase if enabled
    if (getValueConfig(enumOptions.OpeningBook)) {
      await this.openingBook.loadBook('path/to/opening-book.json');
    }
    
    if (getValueConfig(enumOptions.Tablebase)) {
      await this.tablebase.loadTablebase('path/to/tablebase.json');
    }
  }

  initializeGameController() {
    this.game = new GameController(this, this.chessboard);
  }

  initializeLuaInterface() {
    if (getValueConfig(enumOptions.LuaEnabled)) {
      this.luaInterface.setContext({
        game: this.game,
        engine: this.engine,
        ui: this.chessboard,
        config: this.options
      });
      this.luaInterface.enabled = true;
    }
  }

  async onEngineLoaded() {
    // Update options after engine is loaded
    this.engine.UpdateOptions();
    
    // Execute any Lua scripts that need to run on engine load
    if (this.luaInterface.enabled) {
      this.luaInterface.executeScript('onEngineLoaded');
    }
  }

  resetPreMoveCounter() {
    this.engine.moveCounter = 0;
    this.engine.hasShownLimitMessage = false;
    this.engine.isPreMoveSequence = true;
  }

  updateGameAccuracy(move) {
    this.moveHistory.push(move);
    this.gameAccuracy = calculateGameAccuracy(this.moveHistory);
    
    // Update UI with new accuracy
    if (getValueConfig(enumOptions.GameAccuracy)) {
      this.game.updateAccuracyDisplay(this.gameAccuracy);
    }
  }

  getHumanModeMove(moves, level) {
    const blunderChance = getHumanModeBlunderChance(level);
    if (Math.random() < blunderChance) {
      // Return a suboptimal move
      const randomIndex = Math.floor(Math.random() * moves.length);
      return moves[randomIndex];
    }
    return moves[0]; // Return best move
  }

  getAdaptiveDepth(evaluation) {
    if (!getValueConfig(enumOptions.FloatingDepth)) return getValueConfig(enumOptions.Depth);
    
    // Adjust depth based on evaluation
    const baseDepth = getValueConfig(enumOptions.Depth);
    const evalAbs = Math.abs(evaluation);
    
    if (evalAbs > 3) return baseDepth - 2; // Reduce depth in clearly winning/losing positions
    if (evalAbs > 1.5) return baseDepth - 1; // Slightly reduce depth in advantageous positions
    return baseDepth; // Keep full depth in equal positions
  }
}

export function InitBetterMint(chessboard) {
  ChromeRequest.getData().then(function (options) {
    window.BetterMintmaster = new BetterMint(chessboard, options);
  });
} 