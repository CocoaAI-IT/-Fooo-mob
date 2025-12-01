/**
 * ゲームルール・勝利判定
 * 高凝集度: ゲームルールと勝利判定のみを担当
 * 低結合度: gameStateを読み取るのみ
 */

import { GAME_CONFIG } from '../config.js';
import { gameState } from '../state.js';

export class Rules {
    /**
     * 勝利判定
     * @param {number} player - プレイヤー番号
     * @returns {Array|null} - 勝利ライン[[row,col],...] または null
     */
    static checkWin(player) {
        const board = gameState.getBoardCopy();

        // 横方向チェック
        for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
            for (let col = 0; col < GAME_CONFIG.COLS - 3; col++) {
                if (this._checkLine(board, [
                    [row, col],
                    [row, col + 1],
                    [row, col + 2],
                    [row, col + 3]
                ], player)) {
                    return [[row, col], [row, col + 1], [row, col + 2], [row, col + 3]];
                }
            }
        }

        // 縦方向チェック
        for (let row = 0; row < GAME_CONFIG.ROWS - 3; row++) {
            for (let col = 0; col < GAME_CONFIG.COLS; col++) {
                if (this._checkLine(board, [
                    [row, col],
                    [row + 1, col],
                    [row + 2, col],
                    [row + 3, col]
                ], player)) {
                    return [[row, col], [row + 1, col], [row + 2, col], [row + 3, col]];
                }
            }
        }

        // 斜め（右下）チェック
        for (let row = 0; row < GAME_CONFIG.ROWS - 3; row++) {
            for (let col = 0; col < GAME_CONFIG.COLS - 3; col++) {
                if (this._checkLine(board, [
                    [row, col],
                    [row + 1, col + 1],
                    [row + 2, col + 2],
                    [row + 3, col + 3]
                ], player)) {
                    return [[row, col], [row + 1, col + 1], [row + 2, col + 2], [row + 3, col + 3]];
                }
            }
        }

        // 斜め（左下）チェック
        for (let row = 0; row < GAME_CONFIG.ROWS - 3; row++) {
            for (let col = 3; col < GAME_CONFIG.COLS; col++) {
                if (this._checkLine(board, [
                    [row, col],
                    [row + 1, col - 1],
                    [row + 2, col - 2],
                    [row + 3, col - 3]
                ], player)) {
                    return [[row, col], [row + 1, col - 1], [row + 2, col - 2], [row + 3, col - 3]];
                }
            }
        }

        return null;
    }

    /**
     * 指定されたラインが指定されたプレイヤーのものか確認
     * @param {Array} board - ボード状態
     * @param {Array} line - チェックする座標配列
     * @param {number} player - プレイヤー番号
     * @returns {boolean}
     * @private
     */
    static _checkLine(board, line, player) {
        return line.every(([row, col]) => board[row][col] === player);
    }

    /**
     * 指定された列にディスクを配置できるかチェック
     * @param {number} col - 列番号
     * @returns {boolean}
     */
    static canPlaceDisc(col) {
        if (col < 0 || col >= GAME_CONFIG.COLS) {
            return false;
        }
        return gameState.getCell(0, col) === GAME_CONFIG.EMPTY;
    }

    /**
     * ゲームオーバーかチェック（勝利または引き分け）
     * @returns {Object} {gameOver: boolean, winner: number|null, winningLine: Array|null}
     */
    static checkGameOver() {
        const player1Win = this.checkWin(GAME_CONFIG.PLAYER1);
        if (player1Win) {
            return {
                gameOver: true,
                winner: GAME_CONFIG.PLAYER1,
                winningLine: player1Win
            };
        }

        const player2Win = this.checkWin(GAME_CONFIG.PLAYER2);
        if (player2Win) {
            return {
                gameOver: true,
                winner: GAME_CONFIG.PLAYER2,
                winningLine: player2Win
            };
        }

        // 引き分けチェック
        const board = gameState.getBoardCopy();
        const isFull = board[0].every(cell => cell !== GAME_CONFIG.EMPTY);
        if (isFull) {
            return {
                gameOver: true,
                winner: null, // 引き分け
                winningLine: null
            };
        }

        return {
            gameOver: false,
            winner: null,
            winningLine: null
        };
    }
}
