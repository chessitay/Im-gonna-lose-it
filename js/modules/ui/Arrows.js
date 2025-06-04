import { enumOptions, getValueConfig } from '../core/Config.js';
import { rgbToHex, hexToRgb, getGradientColor } from '../utils/ColorUtils.js';

export class Arrows {
  constructor(chessboard) {
    this.chessboard = chessboard;
    this.currentArrows = new Map();
    this.sequenceColors = {
      first: '#5d3fd3',    // Primary color for best move
      second: '#3f5dd3',   // Secondary color for second best
      third: '#d33f5d',    // Tertiary color for third best
      opponent: '#808080'  // Color for opponent responses
    };

    // Set up event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for settings changes
    window.addEventListener('BetterMintUpdateOptions', (event) => {
      this.onSettingsUpdated(event.detail);
    });

    // Listen for moves
    this.chessboard.game.on('Move', () => {
      this.updateArrows();
    });
  }

  addArrow(from, to, color = null, thickness = 4, opacity = 0.8) {
    const arrowId = `arrow|${from}|${to}`;
    
    // Get color from config or use default
    if (!color) {
      color = getValueConfig(enumOptions.ArrowColor) || this.sequenceColors.first;
    }

    // Convert color to RGB if needed
    if (color.startsWith('rgb')) {
      const rgb = color.match(/\d+/g);
      if (rgb && rgb.length === 3) {
        color = rgbToHex(parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2]));
      }
    }

    // Remove existing arrow if any
    this.removeArrow(from, to);

    // Add arrow to the board with thickness and opacity
    const arrowData = `${arrowId}|${color}|${thickness}|${opacity}`;
    this.chessboard.game.markings.addOne(arrowData);
    this.currentArrows.set(arrowId, { from, to, color, thickness, opacity });
  }

  removeArrow(from, to) {
    const arrowId = `arrow|${from}|${to}`;
    this.chessboard.game.markings.removeOne(arrowId);
    this.currentArrows.delete(arrowId);
  }

  clearArrows() {
    for (const [arrowId] of this.currentArrows) {
      this.chessboard.game.markings.removeOne(arrowId);
    }
    this.currentArrows.clear();
  }

  updateArrows() {
    // Clear existing arrows
    this.clearArrows();

    // Get current position and moves
    const position = this.chessboard.game.getFEN();
    const moves = this.chessboard.game.getMoves();

    // Add arrows for each move with appropriate colors
    moves.forEach((move, index) => {
      const from = move.substring(0, 2);
      const to = move.substring(2, 4);
      
      let color;
      switch(index) {
        case 0: color = this.sequenceColors.first; break;
        case 1: color = this.sequenceColors.second; break;
        case 2: color = this.sequenceColors.third; break;
        default: color = this.sequenceColors.opponent;
      }
      
      const thickness = Math.max(3, 6 - index);
      const opacity = Math.max(0.7, 1 - (index * 0.15));
      
      this.addArrow(from, to, color, thickness, opacity);
    });
  }

  onSettingsUpdated(settings) {
    // Update arrow colors if changed
    if (settings[enumOptions.ArrowColor]) {
      this.sequenceColors.first = settings[enumOptions.ArrowColor];
      this.updateArrows();
    }
  }

  // Add multiple arrows for a sequence of moves with gradient colors
  addMoveSequence(moves, baseColor = null) {
    if (!moves || moves.length < 2) return;

    const color = baseColor || this.sequenceColors.first;
    const rgb = hexToRgb(color);

    for (let i = 0; i < moves.length - 1; i++) {
      const from = moves[i];
      const to = moves[i + 1];
      
      // Calculate gradient color based on position in sequence
      const gradient = i / (moves.length - 1);
      const newColor = rgbToHex(
        Math.round(rgb.r * (1 - gradient) + 255 * gradient),
        Math.round(rgb.g * (1 - gradient) + 255 * gradient),
        Math.round(rgb.b * (1 - gradient) + 255 * gradient)
      );
      
      // Decrease thickness and opacity for later moves
      const thickness = Math.max(3, 6 - Math.floor(i / 2));
      const opacity = Math.max(0.7, 1 - (i * 0.1));
      
      this.addArrow(from, to, newColor, thickness, opacity);
    }
  }

  // Add arrows for all possible moves from a square
  addPossibleMoves(from, moves, color = null) {
    for (const to of moves) {
      this.addArrow(from, to, color);
    }
  }

  // Add arrows for the best line of play with proper styling
  addBestLine(moves, color = null) {
    if (!moves || moves.length === 0) return;
    
    // Use gradient colors for the best line
    if (!color) {
      this.addMoveSequence(moves);
    } else {
      this.addMoveSequence(moves, color);
    }
  }

  // Add arrows for top moves with proper ranking colors
  addTopMoves(moves) {
    if (!moves || moves.length === 0) return;

    moves.forEach((move, index) => {
      const from = move.substring(0, 2);
      const to = move.substring(2, 4);
      
      let color;
      switch(index) {
        case 0: color = this.sequenceColors.first; break;
        case 1: color = this.sequenceColors.second; break;
        case 2: color = this.sequenceColors.third; break;
        default: color = this.sequenceColors.opponent;
      }
      
      const thickness = Math.max(3, 6 - index);
      const opacity = Math.max(0.7, 1 - (index * 0.15));
      
      this.addArrow(from, to, color, thickness, opacity);
    });
  }

  // Add arrows for opponent responses
  addOpponentResponses(moves, fadeIntensity = 0.3) {
    if (!moves || moves.length === 0) return;

    moves.forEach((move, index) => {
      const from = move.substring(0, 2);
      const to = move.substring(2, 4);
      
      const fadeAmount = index / Math.max(1, moves.length - 1) * fadeIntensity;
      const color = getGradientColor(this.sequenceColors.opponent, '#ffffff', fadeAmount);
      
      const thickness = Math.max(2, 5 - Math.floor(index / 2));
      const opacity = Math.max(0.7, 1 - (index * 0.05));
      
      this.addArrow(from, to, color, thickness, opacity);
    });
  }
} 