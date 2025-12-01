/**
 * ボード管理
 * 高凝集度: ボードの操作のみを担当
 * 低結合度: gameStateを通じて状態にアクセス
 */

import { GAME_CONFIG } from '../config.js';
import { gameState } from '../state.js';

export class Board {
    /**
     * 指定された列にディスクを落とす
     * @param {number} col - 列番号
     * @returns {number|null} - 配置された行番号、または失敗時null
     */
    static dropDisc(col) {
        const board = gameState.getBoardCopy();

        // 列が満杯かチェック
        if (board[0][col] !== GAME_CONFIG.EMPTY) {
            return null;
        }

        // 最下段から空いている場所を探す
        for (let row = GAME_CONFIG.ROWS - 1; row >= 0; row--) {
            if (board[row][col] === GAME_CONFIG.EMPTY) {
                gameState.setCell(row, col, gameState.getCurrentPlayer());
                return row;
            }
        }

        return null;
    }

    /**
     * 指定された列が満杯かチェック
     * @param {number} col - 列番号
     * @returns {boolean}
     */
    static isColumnFull(col) {
        return gameState.getCell(0, col) !== GAME_CONFIG.EMPTY;
    }

    /**
     * ボードが満杯かチェック
     * @returns {boolean}
     */
    static isBoardFull() {
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            if (gameState.getCell(0, col) === GAME_CONFIG.EMPTY) {
                return false;
            }
        }
        return true;
    }

    /**
     * 指定された列の最下部の空行を取得
     * @param {number} col - 列番号
     * @returns {number} - 行番号、または満杯の場合-1
     */
    static getLowestEmptyRow(col) {
        const board = gameState.getBoardCopy();
        for (let row = GAME_CONFIG.ROWS - 1; row >= 0; row--) {
            if (board[row][col] === GAME_CONFIG.EMPTY) {
                return row;
            }
        }
        return -1;
    }

    /**
     * 配置可能な列のリストを取得
     * @returns {number[]}
     */
    static getAvailableColumns() {
        const available = [];
        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            if (!this.isColumnFull(col)) {
                available.push(col);
            }
        }
        return available;
    }

    /**
     * ボードの状態をコンソールに出力（デバッグ用）
     */
    static printBoard() {
        const board = gameState.getBoardCopy();
        console.log('Current Board:');
        board.forEach(row => {
            console.log(row.map(cell => {
                if (cell === GAME_CONFIG.EMPTY) return '·';
                if (cell === GAME_CONFIG.PLAYER1) return 'O';
                if (cell === GAME_CONFIG.PLAYER2) return 'X';
                return '?';
            }).join(' '));
        });
    }
}
