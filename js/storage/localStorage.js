/**
 * LocalStorage管理
 * 高凝集度: スコアの永続化のみを担当
 * 低結合度: ストレージ操作のみ
 */

import { STORAGE_CONFIG } from '../config.js';

export class ScoreStorage {
    /**
     * スコアを保存
     * @param {Object} scores - {player1, player2, draws}
     */
    static save(scores) {
        try {
            localStorage.setItem(STORAGE_CONFIG.SCORES_KEY, JSON.stringify(scores));
        } catch (error) {
            console.error('Failed to save scores:', error);
        }
    }

    /**
     * スコアを読み込み
     * @returns {Object|null} - {player1, player2, draws} or null
     */
    static load() {
        try {
            const saved = localStorage.getItem(STORAGE_CONFIG.SCORES_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            console.error('Failed to load scores:', error);
            return null;
        }
    }

    /**
     * スコアをクリア
     */
    static clear() {
        try {
            localStorage.removeItem(STORAGE_CONFIG.SCORES_KEY);
        } catch (error) {
            console.error('Failed to clear scores:', error);
        }
    }
}
