/**
 * AI戦略
 * 高凝集度: AI戦略のみを担当
 * 低結合度: Board, Rules, gameStateを読み取るのみ
 */

import { GAME_CONFIG } from '../config.js';
import { gameState } from '../state.js';
import { Board } from '../game/board.js';
import { Rules } from '../game/rules.js';

export class AI {
    /**
     * AIの手を計算
     * @returns {number} - 選択された列番号
     */
    static calculateMove() {
        const difficulty = gameState.getDifficulty();

        switch (difficulty) {
            case GAME_CONFIG.DIFFICULTY.EASY:
                return this._moveRandom();
            case GAME_CONFIG.DIFFICULTY.MEDIUM:
                return this._moveMedium();
            case GAME_CONFIG.DIFFICULTY.HARD:
                return this._moveHard();
            default:
                return this._moveRandom();
        }
    }

    /**
     * Easy: ランダムに列を選択
     * @returns {number}
     * @private
     */
    static _moveRandom() {
        const availableCols = Board.getAvailableColumns();
        return availableCols[Math.floor(Math.random() * availableCols.length)];
    }

    /**
     * Medium: 基本戦略（勝利・阻止）
     * @returns {number}
     * @private
     */
    static _moveMedium() {
        // 1. 勝てる手があればそれを選ぶ
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            if (Rules.canPlaceDisc(col)) {
                const row = Board.getLowestEmptyRow(col);
                gameState.setCell(row, col, GAME_CONFIG.PLAYER2);
                const won = Rules.checkWin(GAME_CONFIG.PLAYER2);
                gameState.setCell(row, col, GAME_CONFIG.EMPTY);

                if (won) {
                    return col;
                }
            }
        }

        // 2. 相手が勝つ手を阻止
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            if (Rules.canPlaceDisc(col)) {
                const row = Board.getLowestEmptyRow(col);
                gameState.setCell(row, col, GAME_CONFIG.PLAYER1);
                const won = Rules.checkWin(GAME_CONFIG.PLAYER1);
                gameState.setCell(row, col, GAME_CONFIG.EMPTY);

                if (won) {
                    return col;
                }
            }
        }

        // 3. ランダム
        return this._moveRandom();
    }

    /**
     * Hard: ミニマックスアルゴリズム
     * @returns {number}
     * @private
     */
    static _moveHard() {
        let bestScore = -Infinity;
        let bestCol = 0;

        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            if (Rules.canPlaceDisc(col)) {
                const row = Board.getLowestEmptyRow(col);
                gameState.setCell(row, col, GAME_CONFIG.PLAYER2);
                const score = this._minimax(GAME_CONFIG.AI_DEPTH, false);
                gameState.setCell(row, col, GAME_CONFIG.EMPTY);

                if (score > bestScore) {
                    bestScore = score;
                    bestCol = col;
                }
            }
        }

        return bestCol;
    }

    /**
     * ミニマックスアルゴリズム
     * @param {number} depth - 探索深度
     * @param {boolean} isMaximizing - 最大化プレイヤーか
     * @returns {number} - 評価値
     * @private
     */
    static _minimax(depth, isMaximizing) {
        if (depth === 0) {
            return this._evaluateBoard();
        }

        if (isMaximizing) {
            let maxScore = -Infinity;
            for (let col = 0; col < GAME_CONFIG.COLS; col++) {
                if (Rules.canPlaceDisc(col)) {
                    const row = Board.getLowestEmptyRow(col);
                    gameState.setCell(row, col, GAME_CONFIG.PLAYER2);
                    const score = this._minimax(depth - 1, false);
                    gameState.setCell(row, col, GAME_CONFIG.EMPTY);
                    maxScore = Math.max(maxScore, score);
                }
            }
            return maxScore;
        } else {
            let minScore = Infinity;
            for (let col = 0; col < GAME_CONFIG.COLS; col++) {
                if (Rules.canPlaceDisc(col)) {
                    const row = Board.getLowestEmptyRow(col);
                    gameState.setCell(row, col, GAME_CONFIG.PLAYER1);
                    const score = this._minimax(depth - 1, true);
                    gameState.setCell(row, col, GAME_CONFIG.EMPTY);
                    minScore = Math.min(minScore, score);
                }
            }
            return minScore;
        }
    }

    /**
     * ボードを評価（簡易版）
     * @returns {number} - 評価値
     * @private
     */
    static _evaluateBoard() {
        let score = 0;

        // 中央の列を優先
        const centerCol = Math.floor(GAME_CONFIG.COLS / 2);
        for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
            if (gameState.getCell(row, centerCol) === GAME_CONFIG.PLAYER2) {
                score += 3;
            }
            if (gameState.getCell(row, centerCol) === GAME_CONFIG.PLAYER1) {
                score -= 3;
            }
        }

        return score;
    }
}
