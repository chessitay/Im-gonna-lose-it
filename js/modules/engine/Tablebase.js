// Endgame tablebase implementation
export class Tablebase {
  constructor() {
    this.loaded = false;
    this.maxPieces = 6; // Maximum number of pieces for tablebase lookup
  }

  async loadTablebase(url) {
    try {
      const response = await fetch(url);
      const data = await response.json();
      this.tablebase = new Map(Object.entries(data));
      this.loaded = true;
      return true;
    } catch (error) {
      console.error('Failed to load tablebase:', error);
      return false;
    }
  }

  getPosition(fen) {
    if (!this.loaded) return null;
    
    // Check if position is in tablebase
    const position = this.tablebase.get(fen);
    if (!position) return null;

    return {
      moves: position.moves,
      score: position.score,
      distance: position.distance
    };
  }

  isInTablebase(fen) {
    if (!this.loaded) return false;
    
    // Count pieces in position
    const pieces = fen.split(' ')[0].replace(/[^KQRBNPkqrbnp]/g, '');
    return pieces.length <= this.maxPieces && this.tablebase.has(fen);
  }

  getBestMove(fen) {
    const position = this.getPosition(fen);
    if (!position) return null;

    // Find move with best score
    let bestMove = null;
    let bestScore = -Infinity;

    for (const move of position.moves) {
      if (move.score > bestScore) {
        bestScore = move.score;
        bestMove = move.move;
      }
    }

    return bestMove;
  }
} 