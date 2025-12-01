/**
 * ボードUI描画
 * 高凝集度: ボード描画のみを担当
 * 低結合度: DOM操作とgameStateの読み取りのみ
 */

import { GAME_CONFIG, UI_CONFIG } from '../config.js';
import { gameState } from '../state.js';
import { Player } from '../game/player.js';

export class BoardUI {
    /**
     * ボードを描画
     * @param {HTMLElement} boardElement - ボード要素
     */
    static renderBoard(boardElement) {
        boardElement.innerHTML = '';

        for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
            for (let col = 0; col < GAME_CONFIG.COLS; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;

                boardElement.appendChild(cell);
            }
        }
    }

    /**
     * ボードの状態を更新
     */
    static updateBoardUI() {
        const cells = document.getElementById('board').children;
        const board = gameState.getBoardCopy();

        for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
            for (let col = 0; col < GAME_CONFIG.COLS; col++) {
                const index = row * GAME_CONFIG.COLS + col;
                const cell = cells[index];
                cell.innerHTML = '';
                cell.classList.remove('filled', 'drop-animation');

                if (board[row][col] !== GAME_CONFIG.EMPTY) {
                    const disc = document.createElement('span');
                    const colorClass = Player.getPlayerColorClass(board[row][col]);
                    disc.className = `player-disc ${colorClass}`;
                    cell.appendChild(disc);
                    cell.classList.add('filled', 'drop-animation');
                }
            }
        }
    }

    /**
     * 勝利ラインをハイライト
     * @param {Array} cells - [[row, col], ...]
     */
    static highlightWinningCells(cells) {
        const boardCells = document.getElementById('board').children;

        cells.forEach(([row, col]) => {
            const index = row * GAME_CONFIG.COLS + col;
            boardCells[index].classList.add('winning');
        });
    }

    /**
     * プレビューディスクを表示
     * @param {number} col - 列番号
     */
    static showPreview(col) {
        const preview = document.getElementById('hover-preview');
        const previewDisc = preview.querySelector('.preview-disc');

        preview.classList.add('visible');
        const colorClass = Player.getCurrentPlayerColorClass();
        previewDisc.className = `preview-disc ${colorClass}`;

        const cellSize = parseFloat(getComputedStyle(document.documentElement)
            .getPropertyValue(UI_CONFIG.CELL_SIZE_VAR));
        const gap = 8;
        const padding = 10;
        const leftPosition = padding + col * (cellSize + gap);

        previewDisc.style.left = `${leftPosition}px`;
    }

    /**
     * プレビューディスクを非表示
     */
    static hidePreview() {
        document.getElementById('hover-preview').classList.remove('visible');
    }

    /**
     * ターン表示を更新
     */
    static updateTurnIndicator() {
        const playerName = Player.getCurrentPlayerName();
        document.getElementById('current-player').textContent = playerName;

        const turnDisc = document.getElementById('turn-disc');
        const colorClass = Player.getCurrentPlayerColorClass();
        turnDisc.className = `player-disc ${colorClass}`;
    }

    /**
     * スコア表示を更新
     */
    static updateScoreDisplay() {
        const scores = gameState.getScores();
        document.getElementById('player1-score').textContent = scores.player1;
        document.getElementById('player2-score').textContent = scores.player2;
        document.getElementById('draw-score').textContent = scores.draws;

        // プレイヤー2の名前を更新
        const player2Name = Player.getPlayer2Name();
        document.getElementById('player2-name').textContent = player2Name;
    }
}
