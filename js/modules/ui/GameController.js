import { enumOptions, getValueConfig } from '../core/Config.js';
import { getGradientColor } from '../utils/ColorUtils.js';
import { Arrows } from './Arrows.js';

export class GameController {
  constructor(BetterMintmaster, chessboard) {
    this.BetterMintmaster = BetterMintmaster;
    this.chessboard = chessboard;
    this.controller = chessboard.game;
    this.options = this.controller.getOptions();
    this.depthBar = null;
    this.evalBar = null;
    this.evalBarFill = null;
    this.evalScore = null;
    this.evalScoreAbbreviated = null;
    this.currentMarkings = [];
    this.accuracyDisplay = null;
    this.arrows = new Arrows(chessboard);
    
    this.initializeEventListeners();
    this.initializeAnalysisTools();
  }

  initializeEventListeners() {
    this.controller.on("Move", (event) => {
      console.log("On Move", event.data);
      
      // Trigger pre-moves after white's first move
      const currentFEN = this.controller.getFEN();
      if (currentFEN.startsWith("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR")) {
        if (this.BetterMintmaster.engine.moveCounter === 0 && currentFEN.endsWith("w KQkq")) {
          this.BetterMintmaster.engine.isPreMoveSequence = true;
          console.log("WHITE'S FIRST MOVE - INITIATING PRE-MOVES");
        }
      }
      
      this.UpdateEngine(false);
    });

    this.controller.on('ModeChanged', (event) => {
      if (event.data === "playing") {
        this.ResetGame();
        this.RefreshEvalutionBar();
        this.BetterMintmaster.engine.moveCounter = 0;
        this.BetterMintmaster.engine.hasShownLimitMessage = false;
        this.BetterMintmaster.engine.isPreMoveSequence = true;
      }
    });

    this.controller.on("UpdateOptions", (event) => {
      this.options = this.controller.getOptions();
      if (event.data.flipped != undefined && this.evalBar != null) {
        if (event.data.flipped)
          this.evalBar.classList.add("evaluation-bar-flipped");
        else this.evalBar.classList.remove("evaluation-bar-flipped");
      }
    });
  }

  initializeAnalysisTools() {
    if (getValueConfig(enumOptions.EvaluationBar)) {
      this.CreateAnalysisTools();
    }
  }

  CreateAnalysisTools() {
    // Create evaluation bar
    this.evalBar = document.createElement("div");
    this.evalBar.className = "evaluation-bar";
    this.evalBarFill = document.createElement("div");
    this.evalBarFill.className = "evaluation-bar-fill";
    this.evalBar.appendChild(this.evalBarFill);
    this.evalScore = document.createElement("div");
    this.evalScore.className = "evaluation-score";
    this.evalBar.appendChild(this.evalScore);
    this.evalScoreAbbreviated = document.createElement("div");
    this.evalScoreAbbreviated.className = "evaluation-score-abbreviated";
    this.evalBar.appendChild(this.evalScoreAbbreviated);
    document.body.appendChild(this.evalBar);

    // Create depth bar
    if (getValueConfig(enumOptions.DepthBar)) {
      this.depthBar = document.createElement("div");
      this.depthBar.className = "depth-bar";
      document.body.appendChild(this.depthBar);
    }

    // Create accuracy display
    if (getValueConfig(enumOptions.GameAccuracy)) {
      this.accuracyDisplay = document.createElement("div");
      this.accuracyDisplay.className = "game-accuracy";
      document.body.appendChild(this.accuracyDisplay);
    }
  }

  RefreshEvalutionBar() {
    if (this.evalBar) {
      this.evalBar.style.display = getValueConfig(enumOptions.EvaluationBar) ? "block" : "none";
    }
  }

  UpdateEngine(isNewGame) {
    this.BetterMintmaster.engine.UpdatePosition(null, isNewGame);
  }

  ResetGame() {
    this.RemoveCurrentMarkings();
    this.BetterMintmaster.engine.restartGame();
  }

  RemoveCurrentMarkings() {
    for (const marking of this.currentMarkings) {
      this.controller.markings.removeOne(marking);
    }
    this.currentMarkings = [];
  }

  updateAccuracyDisplay(accuracy) {
    if (this.accuracyDisplay) {
      this.accuracyDisplay.textContent = `Game Accuracy: ${accuracy}%`;
    }
  }

  SetCurrentDepth(percentage) {
    if (this.depthBar) {
      this.depthBar.style.width = `${percentage}%`;
    }
  }

  SetEvaluation(score, isMate) {
    if (!this.evalBar) return;

    const maxScore = 10;
    const normalizedScore = Math.min(Math.max(score, -maxScore), maxScore);
    const percentage = (normalizedScore + maxScore) / (2 * maxScore) * 100;
    
    this.evalBarFill.style.height = `${percentage}%`;
    this.evalBarFill.style.backgroundColor = getGradientColor(
      "#ff0000",
      "#00ff00",
      percentage / 100
    );

    if (isMate) {
      this.evalScore.textContent = `M${score}`;
      this.evalScoreAbbreviated.textContent = `M${score}`;
    } else {
      this.evalScore.textContent = score.toFixed(2);
      this.evalScoreAbbreviated.textContent = score.toFixed(1);
    }
  }

  addArrow(from, to, color) {
    if (this.arrows) {
      this.arrows.addArrow(from, to, color);
    }
  }

  clearArrows() {
    if (this.arrows) {
      this.arrows.clearArrows();
    }
  }
}
