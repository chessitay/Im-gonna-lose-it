// Evaluation processing utilities
export function normalizeEvaluation(score, maxScore = 10) {
  return Math.min(Math.max(score, -maxScore), maxScore);
}

export function calculateAccuracy(evaluation, moveEvaluation) {
  if (!evaluation || !moveEvaluation) return 100;
  
  const evalDiff = Math.abs(evaluation - moveEvaluation);
  return Math.max(0, Math.min(100, 100 - evalDiff * 10));
}

export function getEvaluationColor(score, maxScore = 10) {
  const normalizedScore = normalizeEvaluation(score, maxScore);
  const percentage = (normalizedScore + maxScore) / (2 * maxScore);
  
  // Red (negative) to Green (positive) gradient
  const red = Math.round(255 * (1 - percentage));
  const green = Math.round(255 * percentage);
  
  return `rgb(${red}, ${green}, 0)`;
}

export function formatEvaluation(score, isMate) {
  if (isMate) {
    return `M${Math.abs(score)}`;
  }
  return score.toFixed(2);
}

export function parseEvaluation(text) {
  if (text.startsWith('M')) {
    return {
      score: parseInt(text.substring(1)),
      isMate: true
    };
  }
  
  const score = parseFloat(text);
  return {
    score: isNaN(score) ? 0 : score,
    isMate: false
  };
}

export function calculateGameAccuracy(moves) {
  if (!moves || moves.length === 0) return 100;
  
  let totalAccuracy = 0;
  let moveCount = 0;
  
  for (const move of moves) {
    if (move.evaluation) {
      const accuracy = calculateAccuracy(move.positionEvaluation, move.evaluation);
      totalAccuracy += accuracy;
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

export function getAdaptiveDepth(evaluation, baseDepth) {
  const evalAbs = Math.abs(evaluation);
  
  if (evalAbs > 3) return baseDepth - 2; // Reduce depth in clearly winning/losing positions
  if (evalAbs > 1.5) return baseDepth - 1; // Slightly reduce depth in advantageous positions
  return baseDepth; // Keep full depth in equal positions
}

export function getFastMoverDelay(baseDelay, fastMoverValue, randomFactor = 0) {
  // Adjust delay based on fast mover value (-100 to 100)
  const fastMoverFactor = 1 - (fastMoverValue / 100);
  return baseDelay * fastMoverFactor + randomFactor;
} 