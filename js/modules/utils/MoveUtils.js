// Move processing and validation utilities
export class TopMove {
  constructor(line, depth, cp, mate) {
    this.line = line.split(" ");
    this.move = this.line[0];
    this.promotion = this.move.length > 4 ? this.move.substring(4, 5) : null;
    this.from = this.move.substring(0, 2);
    this.to = this.move.substring(2, 4);
    this.cp = cp;
    this.mate = mate;
    this.depth = depth;
  }
}

export function sortTopMoves(moves) {
  return moves.sort((a, b) => {
    if (a.mate && b.mate) {
      return Math.abs(a.mate) - Math.abs(b.mate);
    }
    if (a.mate) return -1;
    if (b.mate) return 1;
    return b.cp - a.cp;
  });
}

export function calculateGameAccuracy(moves) {
  if (!moves || moves.length === 0) return 100;
  
  let totalAccuracy = 0;
  let moveCount = 0;
  
  for (const move of moves) {
    if (move.evaluation) {
      totalAccuracy += Math.min(100, Math.max(0, 100 - Math.abs(move.evaluation)));
      moveCount++;
    }
  }
  
  return moveCount > 0 ? Math.round(totalAccuracy / moveCount) : 100;
}

export function getHumanModeBlunderChance(level) {
  const levels = {
    'Noob': 0.4,
    'Intermediate': 0.25,
    'Pro': 0.15,
    'GM': 0.05,
    'Alien': 0.01
  };
  return levels[level] || 0.2;
}

export function getAdaptiveElo(currentElo, opponentElo) {
  const diff = opponentElo - currentElo;
  if (Math.abs(diff) < 100) return currentElo;
  return currentElo + (diff > 0 ? -100 : 100);
} 