import { getValueConfig } from '../core/Config.js';

export class AutoMoveManager {
  constructor(engine, game) {
    this.engine = engine;
    this.game = game;
    this.controller = game?.controller;
    this.moveCounter = 0;
    this.hasShownLimitMessage = false;
    this.isPreMoveSequence = false;
  }

  resetCounter() {
    this.moveCounter = 0;
    this.hasShownLimitMessage = false;
    this.isPreMoveSequence = false;
  }

  handleTopMoves(bestMove, isBestMove) {
    if (!this.controller || !bestMove) return;

    try {
      // Handle auto moves
      if (this.engine.BetterMintmaster.options["option-auto-move"] && isBestMove) {
        const move = bestMove.move;
        if (move && this.controller.isLegalMove(move)) {
          this.controller.makeMove(move);
        }
      }

      // Handle pre-moves
      if (this.engine.BetterMintmaster.options["option-pre-move"] && isBestMove) {
        const move = bestMove.move;
        if (move && this.controller.isLegalMove(move)) {
          this.controller.setPreMove(move);
        }
      }
    } catch (error) {
      console.warn('Error handling top moves:', error);
    }
  }

  shouldExecutePreMove(currentTurn, playingAs) {
    return getValueConfig('option-premove-enabled') && 
           getValueConfig('option-legit-auto-move') &&
           ((playingAs === 1 && currentTurn === 'w') || 
            (playingAs === 2 && currentTurn === 'b')) &&
           this.moveCounter < getValueConfig('option-max-premoves') &&
           !this.hasShownLimitMessage;
  }

  shouldExecuteAutoMove(currentTurn, playingAs) {
    return getValueConfig('option-legit-auto-move') &&
           ((playingAs === 1 && currentTurn === 'w') || 
            (playingAs === 2 && currentTurn === 'b'));
  }

  executePreMove(move) {
    const legalMoves = this.game.controller.getLegalMoves();
    const moveData = legalMoves.find(
      m => m.from === move.from && m.to === move.to
    );

    if (!moveData) return;

    moveData.userGenerated = true;
    if (move.promotion) {
      moveData.promotion = move.promotion;
    }

    this.moveCounter++;

    const preMoveTime = this.calculatePreMoveTime();
    setTimeout(() => {
      this.game.controller.move(moveData);
      this.showPreMoveNotification();
    }, preMoveTime);
  }

  executeAutoMove(move) {
    const legalMoves = this.game.controller.getLegalMoves();
    const moveData = legalMoves.find(
      m => m.from === move.from && m.to === move.to
    );

    if (!moveData) return;

    moveData.userGenerated = true;
    if (move.promotion) {
      moveData.promotion = move.promotion;
    }

    const autoMoveTime = this.calculateAutoMoveTime();
    setTimeout(() => {
      this.game.controller.move(moveData);
      this.showAutoMoveNotification(autoMoveTime);
    }, autoMoveTime);
  }

  calculatePreMoveTime() {
    return getValueConfig('option-premove-time') +
           (Math.floor(Math.random() * getValueConfig('option-premove-time-random')) %
            getValueConfig('option-premove-time-random-div')) *
            getValueConfig('option-premove-time-random-multi');
  }

  calculateAutoMoveTime() {
    return getValueConfig('option-auto-move-time') +
           (Math.floor(Math.random() * getValueConfig('option-auto-move-time-random')) %
            getValueConfig('option-auto-move-time-random-div')) *
            getValueConfig('option-auto-move-time-random-multi');
  }

  showPreMoveNotification() {
    if (!window.toaster) return;

    window.toaster.add({
      id: "auto-move-counter",
      duration: 2000,
      icon: "circle-info",
      content: `Pre-move ${this.moveCounter}/${getValueConfig('option-max-premoves')} executed!`,
      style: {
        position: "fixed",
        bottom: "120px",
        right: "30px",
        backgroundColor: "#2ecc71",
        color: "white"
      }
    });

    if (this.moveCounter >= getValueConfig('option-max-premoves')) {
      window.toaster.add({
        id: "auto-move-limit",
        duration: 2000,
        icon: "circle-checkmark",
        content: "Maximum pre-moves reached!",
        style: {
          position: "fixed",
          bottom: "120px",
          right: "30px",
          backgroundColor: "#e67e22",
          color: "white"
        }
      });
      this.hasShownLimitMessage = true;
    }
  }

  showAutoMoveNotification(delay) {
    if (!window.toaster) return;

    const secondsTillAutoMove = (delay / 1000).toFixed(1);
    window.toaster.add({
      id: "chess.com",
      duration: (parseFloat(secondsTillAutoMove) + 1) * 1000,
      icon: "circle-info",
      content: `BetterMint: Auto move in ${secondsTillAutoMove} seconds`,
      style: {
        position: "fixed",
        bottom: "60px",
        right: "30px",
        backgroundColor: "black",
        color: "white"
      }
    });
  }

  shouldPrioritizeMate(move) {
    return getValueConfig('option-highmatechance') && 
           move.mate !== null && 
           move.mate > 0 && 
           move.mate <= getValueConfig('option-mate-finder-value');
  }

  shouldSelectBestMove() {
    return Math.random() * 100 < getValueConfig('option-best-move-chance');
  }

  shouldSelectRandomMove() {
    return getValueConfig('option-random-best-move');
  }
} 