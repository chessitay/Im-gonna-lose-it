// Opening book implementation
export class OpeningBook {
  constructor() {
    this.book = new Map();
    this.loaded = false;
  }

  async loadBook(url) {
    try {
      const response = await fetch(url);
      const data = await response.json();
      this.book = new Map(Object.entries(data));
      this.loaded = true;
      return true;
    } catch (error) {
      console.error('Failed to load opening book:', error);
      return false;
    }
  }

  getMove(fen) {
    if (!this.loaded) return null;
    
    const position = this.book.get(fen);
    if (!position) return null;

    // Get all possible moves for this position
    const moves = position.moves;
    if (!moves || moves.length === 0) return null;

    // Calculate total weight
    const totalWeight = moves.reduce((sum, move) => sum + move.weight, 0);
    
    // Random selection based on weights
    let random = Math.random() * totalWeight;
    for (const move of moves) {
      random -= move.weight;
      if (random <= 0) {
        return move.move;
      }
    }
    
    return moves[0].move; // Fallback to first move
  }

  isInBook(fen) {
    return this.loaded && this.book.has(fen);
  }
} 