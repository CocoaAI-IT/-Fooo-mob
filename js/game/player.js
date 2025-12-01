/**
 * プレイヤー管理
 * 高凝集度: プレイヤー情報の取得と管理のみを担当
 * 低結合度: gameStateとconfigのみに依存
 */

import { GAME_CONFIG } from '../config.js';
import { gameState } from '../state.js';

export class Player {
    /**
     * 現在のプレイヤーの名前を取得
     * @returns {string}
     */
    static getCurrentPlayerName() {
        const current = gameState.getCurrentPlayer();
        const mode = gameState.getGameMode();

        if (current === GAME_CONFIG.PLAYER1) {
            return 'Player 1';
        }

        if (mode === GAME_CONFIG.GAME_MODES.PVC) {
            return 'CPU';
        }

        return 'Player 2';
    }

    /**
     * 指定されたプレイヤーの名前を取得
     * @param {number} playerNumber - プレイヤー番号
     * @returns {string}
     */
    static getPlayerName(playerNumber) {
        const mode = gameState.getGameMode();

        if (playerNumber === GAME_CONFIG.PLAYER1) {
            return 'Player 1';
        }

        if (mode === GAME_CONFIG.GAME_MODES.PVC) {
            return 'CPU';
        }

        return 'Player 2';
    }

    /**
     * 現在のプレイヤーの色クラスを取得
     * @returns {string}
     */
    static getCurrentPlayerColorClass() {
        return gameState.getCurrentPlayer() === GAME_CONFIG.PLAYER1 ? 'blue' : 'red';
    }

    /**
     * 指定されたプレイヤーの色クラスを取得
     * @param {number} playerNumber - プレイヤー番号
     * @returns {string}
     */
    static getPlayerColorClass(playerNumber) {
        return playerNumber === GAME_CONFIG.PLAYER1 ? 'blue' : 'red';
    }

    /**
     * 現在のターンがAIのターンかチェック
     * @returns {boolean}
     */
    static isAITurn() {
        return gameState.getGameMode() === GAME_CONFIG.GAME_MODES.PVC &&
               gameState.getCurrentPlayer() === GAME_CONFIG.PLAYER2;
    }

    /**
     * オンラインモードで現在のプレイヤーのターンかチェック
     * @returns {boolean}
     */
    static isMyTurnOnline() {
        if (gameState.getGameMode() !== GAME_CONFIG.GAME_MODES.ONLINE) {
            return true; // オンラインモードでない場合は常にtrue
        }

        const myPlayerNumber = gameState.getMyPlayerNumber();
        if (myPlayerNumber === null) {
            return false; // まだ接続していない
        }

        return gameState.getCurrentPlayer() === myPlayerNumber;
    }

    /**
     * プレイヤー2の名前を取得（モード依存）
     * @returns {string}
     */
    static getPlayer2Name() {
        const mode = gameState.getGameMode();
        return mode === GAME_CONFIG.GAME_MODES.PVC ? 'CPU' : 'Player 2';
    }
}
