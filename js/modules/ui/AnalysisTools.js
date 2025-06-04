import { enumOptions, getValueConfig } from '../core/Config.js';
import { getGradientColor } from '../utils/ColorUtils.js';

export class AnalysisTools {
  constructor(chessboard) {
    this.chessboard = chessboard;
    this.controller = chessboard.game;
    this.currentMarkings = [];
    this.depthBar = null;
    this.evalBar = null;
    this.evalBarFill = null;
    this.evalScore = null;
    this.evalScoreAbbreviated = null;
    
    // Get the board container
    this.boardContainer = document.querySelector('.board-container') || 
                        document.querySelector('.board') ||
                        this.chessboard.element ||
                        document.body;
    
    // Initialize UI elements based on settings
    if (getValueConfig(enumOptions.EvaluationBar)) {
      this.createEvaluationBar();
    }
    if (getValueConfig(enumOptions.DepthBar)) {
      this.createDepthBar();
    }
    
    // Set up event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for settings changes
    window.addEventListener('BetterMintUpdateOptions', (event) => {
      this.onSettingsUpdated(event.detail);
    });

    // Listen for board orientation changes
    if (this.controller && typeof this.controller.on === 'function') {
      this.controller.on('UpdateOptions', (event) => {
        if (event.data.flipped !== undefined && this.evalBar) {
          if (event.data.flipped) {
            this.evalBar.classList.add('evaluation-bar-flipped');
          } else {
            this.evalBar.classList.remove('evaluation-bar-flipped');
          }
        }
      });

      // Listen for moves
      this.controller.on('Move', () => {
        this.showAnalysis();
      });

      // Listen for game mode changes
      this.controller.on('ModeChanged', (event) => {
        if (event.data === 'playing') {
          this.showAnalysis();
        }
      });

      // Listen for board reset
      this.controller.on('ResetGame', () => {
        this.showAnalysis();
      });

      // Listen for renderer set
      this.controller.on('RendererSet', () => {
        this.showAnalysis();
      });
    }
  }

  createEvaluationBar() {
    // Create evaluation bar container
    this.evalBar = document.createElement('div');
    this.evalBar.className = 'better-mint-eval-bar';
    this.evalBar.style.cssText = `
      position: absolute;
      right: -20px;
      top: 0;
      bottom: 0;
      width: 20px;
      background: #2c2c2c;
      z-index: 1000;
      border-radius: 0 4px 4px 0;
      box-shadow: 2px 0 5px rgba(0,0,0,0.2);
      display: block;
      opacity: 1;
    `;

    // Create fill element
    this.evalBarFill = document.createElement('div');
    this.evalBarFill.className = 'better-mint-eval-fill';
    this.evalBarFill.style.cssText = `
      position: absolute;
      left: 0;
      right: 0;
      background: #4CAF50;
      transition: all 0.3s ease;
    `;

    // Create score display
    this.evalScore = document.createElement('div');
    this.evalScore.className = 'better-mint-eval-score';
    this.evalScore.style.cssText = `
      position: absolute;
      left: 0;
      right: 0;
      text-align: center;
      color: white;
      font-size: 12px;
      font-weight: bold;
      text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
      z-index: 1001;
      padding: 2px 0;
    `;

    // Create abbreviated score display
    this.evalScoreAbbreviated = document.createElement('div');
    this.evalScoreAbbreviated.className = 'better-mint-eval-score-abbreviated';
    this.evalScoreAbbreviated.style.cssText = `
      position: absolute;
      left: 0;
      right: 0;
      text-align: center;
      color: white;
      font-size: 10px;
      font-weight: bold;
      text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
      z-index: 1001;
      padding: 2px 0;
    `;

    this.evalBar.appendChild(this.evalBarFill);
    this.evalBar.appendChild(this.evalScore);
    this.evalBar.appendChild(this.evalScoreAbbreviated);
    this.boardContainer.appendChild(this.evalBar);
  }

  createDepthBar() {
    this.depthBar = document.createElement('div');
    this.depthBar.className = 'better-mint-depth-bar';
    this.depthBar.style.cssText = `
      position: absolute;
      left: 0;
      right: 0;
      bottom: -4px;
      height: 4px;
      background: #2c2c2c;
      z-index: 1000;
      border-radius: 0 0 4px 4px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      display: block;
      opacity: 1;
    `;

    const fill = document.createElement('div');
    fill.className = 'better-mint-depth-fill';
    fill.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      background: #2196F3;
      transition: width 0.3s ease;
      width: 0%;
      border-radius: 0 0 4px 4px;
    `;

    this.depthBar.appendChild(fill);
    this.boardContainer.appendChild(this.depthBar);
  }

  updateEvaluation(score, isMate) {
    if (!this.evalBar || !this.evalBarFill || !this.evalScore || !this.evalScoreAbbreviated) return;

    // Calculate fill position (0-100%)
    let fillPercentage;
    if (isMate) {
      fillPercentage = score > 0 ? 100 : 0;
    } else {
      // Convert score to percentage (assuming max score of 10)
      const maxScore = 10;
      fillPercentage = Math.min(Math.max((score + maxScore) / (2 * maxScore) * 100, 0), 100);
    }

    // Update fill position
    this.evalBarFill.style.top = `${100 - fillPercentage}%`;
    this.evalBarFill.style.height = `${fillPercentage}%`;

    // Update score text
    let scoreText, abbreviatedText;
    if (isMate) {
      scoreText = `M${Math.abs(score)}`;
      abbreviatedText = scoreText;
    } else {
      scoreText = score > 0 ? `+${score.toFixed(2)}` : score.toFixed(2);
      abbreviatedText = score > 0 ? `+${Math.abs(score).toFixed(1)}` : `-${Math.abs(score).toFixed(1)}`;
    }

    this.evalScore.textContent = scoreText;
    this.evalScoreAbbreviated.textContent = abbreviatedText;
    this.evalScore.style.top = `${100 - fillPercentage}%`;
    this.evalScoreAbbreviated.style.top = `${100 - fillPercentage}%`;

    // Update colors based on score
    const isPositive = score > 0;
    this.evalScore.className = `better-mint-eval-score ${isPositive ? 'positive' : 'negative'}`;
    this.evalScoreAbbreviated.className = `better-mint-eval-score-abbreviated ${isPositive ? 'positive' : 'negative'}`;

    // Show the evaluation bar when updating
    this.showAnalysis();
  }

  updateDepth(percentage) {
    if (!this.depthBar) return;
    const fill = this.depthBar.querySelector('.better-mint-depth-fill');
    if (fill) {
      fill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
      // Show the depth bar when updating
      this.showAnalysis();
    }
  }

  showAnalysis() {
    if (getValueConfig(enumOptions.EvaluationBar) && this.evalBar) {
      this.evalBar.style.display = 'block';
      this.evalBar.style.opacity = '1';
    }
    if (getValueConfig(enumOptions.DepthBar) && this.depthBar) {
      this.depthBar.style.display = 'block';
      this.depthBar.style.opacity = '1';
    }
  }

  hideAnalysis() {
    if (this.evalBar) {
      this.evalBar.style.opacity = '0';
      setTimeout(() => {
        if (this.evalBar.style.opacity === '0') {
          this.evalBar.style.display = 'none';
        }
      }, 300);
    }
    if (this.depthBar) {
      this.depthBar.style.opacity = '0';
      setTimeout(() => {
        if (this.depthBar.style.opacity === '0') {
          this.depthBar.style.display = 'none';
        }
      }, 300);
    }
  }

  onSettingsUpdated(settings) {
    // Update UI elements based on new settings
    if (settings[enumOptions.EvaluationBar] && !this.evalBar) {
      this.createEvaluationBar();
    } else if (!settings[enumOptions.EvaluationBar] && this.evalBar) {
      this.evalBar.remove();
      this.evalBar = null;
    }

    if (settings[enumOptions.DepthBar] && !this.depthBar) {
      this.createDepthBar();
    } else if (!settings[enumOptions.DepthBar] && this.depthBar) {
      this.depthBar.remove();
      this.depthBar = null;
    }

    // Show/hide analysis based on settings
    if (settings[enumOptions.EvaluationBar] || settings[enumOptions.DepthBar]) {
      this.showAnalysis();
    } else {
      this.hideAnalysis();
    }
  }
} 