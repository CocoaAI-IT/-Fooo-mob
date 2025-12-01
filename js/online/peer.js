/**
 * PeerJS統合（オンラインPVP）
 * 高凝集度: P2P通信のみを担当
 * 低結合度: イベントベースで通信
 */

import { GAME_CONFIG } from '../config.js';
import { gameState } from '../state.js';

export class PeerManager {
    constructor() {
        this.peer = null;
        this.connection = null;
        this.myPeerId = null;
        this.callbacks = {};
    }

    /**
     * PeerJS初期化
     */
    init() {
        if (this.peer) return;

        const randomId = 'cf-' + Math.random().toString(36).substr(2, 9);
        this.peer = new Peer(randomId);

        this.peer.on('open', (id) => {
            this.myPeerId = id;
            this._trigger('peerOpen', id);
        });

        this.peer.on('connection', (conn) => {
            if (this.connection) {
                conn.close();
                return;
            }

            this.connection = conn;
            this._setupConnection();
            gameState.setOnlinePlayerInfo(GAME_CONFIG.PLAYER1, true);
            this._trigger('connected', { isHost: true });
        });

        this.peer.on('error', (err) => {
            this._trigger('error', err);
        });
    }

    /**
     * 接続のセットアップ
     * @private
     */
    _setupConnection() {
        this.connection.on('data', (data) => {
            this._trigger('dataReceived', data);
        });

        this.connection.on('close', () => {
            this._trigger('disconnected');
            this.connection = null;
        });

        this.connection.on('error', (err) => {
            this._trigger('connectionError', err);
        });
    }

    /**
     * ルームに参加
     * @param {string} roomId - ルームID
     */
    joinRoom(roomId) {
        if (!this.peer) this.init();

        setTimeout(() => {
            this.connection = this.peer.connect(roomId);

            this.connection.on('open', () => {
                this._setupConnection();
                gameState.setOnlinePlayerInfo(GAME_CONFIG.PLAYER2, false);
                this._trigger('connected', { isHost: false });
            });

            this.connection.on('error', (err) => {
                this._trigger('connectionError', err);
            });
        }, 1000);
    }

    /**
     * データを送信
     * @param {Object} data - 送信するデータ
     */
    send(data) {
        if (this.connection && this.connection.open) {
            this.connection.send(data);
        }
    }

    /**
     * 接続状態を取得
     * @returns {boolean}
     */
    isConnected() {
        return this.connection && this.connection.open;
    }

    /**
     * ピアIDを取得
     * @returns {string|null}
     */
    getPeerId() {
        return this.myPeerId;
    }

    /**
     * イベントコールバックを登録
     * @param {string} event - イベント名
     * @param {Function} callback - コールバック関数
     */
    on(event, callback) {
        this.callbacks[event] = callback;
    }

    /**
     * イベントを発火
     * @param {string} event - イベント名
     * @param {*} data - イベントデータ
     * @private
     */
    _trigger(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event](data);
        }
    }

    /**
     * 接続を切断
     */
    disconnect() {
        if (this.connection) {
            this.connection.close();
            this.connection = null;
        }
    }
}

// シングルトンインスタンス
export const peerManager = new PeerManager();
