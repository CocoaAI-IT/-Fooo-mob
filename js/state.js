/**
 * ゲーム状態管理
 * 高凝集度: ゲーム状態の管理のみを担当
 * 低結合度: Observerパターンで変更を通知
 */

import { GAME_CONFIG } from './config.js';

class GameState {
    constructor() {
        this.board = [];
        this.currentPlayer = GAME_CONFIG.PLAYER1;
        this.gameMode = GAME_CONFIG.GAME_MODES.LOCAL;
        this.difficulty = GAME_CONFIG.DIFFICULTY.MEDIUM;
        this.gameActive = true;
        this.soundEnabled = true;

        // オンラインプレイ用
        this.myPlayerNumber = null;
        this.isHost = false;

        // スコア
        this.scores = {
            player1: 0,
            player2: 0,
            draws: 0
        };

        // Observerパターン: 状態変更を購読するリスナー
        this.listeners = [];

        this.initBoard();
    }

    initBoard() {
        this.board = Array(GAME_CONFIG.ROWS)
            .fill(null)
            .map(() => Array(GAME_CONFIG.COLS).fill(GAME_CONFIG.EMPTY));
        this.currentPlayer = GAME_CONFIG.PLAYER1;
        this.gameActive = true;
        this.notify('boardReset');
    }

    // 状態変更を通知
    notify(event, data = {}) {
        this.listeners.forEach(listener => {
            if (listener.event === event || listener.event === '*') {
                listener.callback(data);
            }
        });
    }

    // リスナーを登録
    subscribe(event, callback) {
        this.listeners.push({ event, callback });
    }

    // ボード操作
    getCell(row, col) {
        return this.board[row][col];
    }

    setCell(row, col, value) {
        this.board[row][col] = value;
        this.notify('cellChanged', { row, col, value });
    }

    getBoardCopy() {
        return this.board.map(row => [...row]);
    }

    setBoard(newBoard) {
        this.board = newBoard.map(row => [...row]);
        this.notify('boardChanged');
    }

    // プレイヤー操作
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === GAME_CONFIG.PLAYER1
            ? GAME_CONFIG.PLAYER2
            : GAME_CONFIG.PLAYER1;
        this.notify('playerSwitched', { currentPlayer: this.currentPlayer });
    }

    getCurrentPlayer() {
        return this.currentPlayer;
    }

    // ゲームモード
    setGameMode(mode) {
        this.gameMode = mode;
        this.notify('gameModeChanged', { mode });
    }

    getGameMode() {
        return this.gameMode;
    }

    // 難易度
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
    }

    getDifficulty() {
        return this.difficulty;
    }

    // ゲームアクティブ状態
    setGameActive(active) {
        this.gameActive = active;
        if (!active) {
            this.notify('gameEnded');
        }
    }

    isGameActive() {
        return this.gameActive;
    }

    // スコア管理
    incrementScore(player) {
        if (player === GAME_CONFIG.PLAYER1) {
            this.scores.player1++;
        } else if (player === GAME_CONFIG.PLAYER2) {
            this.scores.player2++;
        } else {
            this.scores.draws++;
        }
        this.notify('scoreChanged', { scores: this.scores });
    }

    getScores() {
        return { ...this.scores };
    }

    setScores(scores) {
        this.scores = { ...scores };
        this.notify('scoreChanged', { scores: this.scores });
    }

    resetScores() {
        this.scores = { player1: 0, player2: 0, draws: 0 };
        this.notify('scoreChanged', { scores: this.scores });
    }

    // サウンド
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }

    isSoundEnabled() {
        return this.soundEnabled;
    }

    // オンラインプレイ
    setOnlinePlayerInfo(playerNumber, isHost) {
        this.myPlayerNumber = playerNumber;
        this.isHost = isHost;
    }

    getMyPlayerNumber() {
        return this.myPlayerNumber;
    }

    isHostPlayer() {
        return this.isHost;
    }
}

// シングルトンパターン
export const gameState = new GameState();
