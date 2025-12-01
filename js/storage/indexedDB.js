/**
 * IndexedDB管理
 * 高凝集度: ゲーム履歴の永続化のみを担当
 * 低結合度: データベース操作のみ
 */

import { STORAGE_CONFIG } from '../config.js';

export class GameHistoryDB {
    constructor() {
        this.db = null;
    }

    /**
     * データベース初期化
     * @returns {Promise<void>}
     */
    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(
                STORAGE_CONFIG.DB_NAME,
                STORAGE_CONFIG.DB_VERSION
            );

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                this.db = event.target.result;

                if (!this.db.objectStoreNames.contains(STORAGE_CONFIG.GAMES_STORE)) {
                    const objectStore = this.db.createObjectStore(
                        STORAGE_CONFIG.GAMES_STORE,
                        { keyPath: 'id', autoIncrement: true }
                    );
                    objectStore.createIndex('date', 'date', { unique: false });
                    objectStore.createIndex('mode', 'mode', { unique: false });
                }
            };
        });
    }

    /**
     * ゲームを保存
     * @param {Object} gameData - {winner, mode, date}
     * @returns {Promise<void>}
     */
    save(gameData) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not initialized'));
                return;
            }

            const transaction = this.db.transaction([STORAGE_CONFIG.GAMES_STORE], 'readwrite');
            const objectStore = transaction.objectStore(STORAGE_CONFIG.GAMES_STORE);

            const request = objectStore.add({
                winner: gameData.winner,
                mode: gameData.mode,
                date: new Date().toISOString()
            });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 全ゲームを取得
     * @returns {Promise<Array>}
     */
    getAll() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve([]);
                return;
            }

            const transaction = this.db.transaction([STORAGE_CONFIG.GAMES_STORE], 'readonly');
            const objectStore = transaction.objectStore(STORAGE_CONFIG.GAMES_STORE);
            const request = objectStore.getAll();

            request.onsuccess = () => {
                resolve(request.result.reverse()); // 新しい順
            };

            request.onerror = () => {
                console.error('Failed to get games:', request.error);
                resolve([]);
            };
        });
    }

    /**
     * 履歴をクリア
     * @returns {Promise<void>}
     */
    clear() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve();
                return;
            }

            const transaction = this.db.transaction([STORAGE_CONFIG.GAMES_STORE], 'readwrite');
            const objectStore = transaction.objectStore(STORAGE_CONFIG.GAMES_STORE);
            const request = objectStore.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// シングルトンインスタンス
export const gameHistoryDB = new GameHistoryDB();
