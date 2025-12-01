/**
 * UIコントロール管理
 * 高凝集度: UIコントロールのイベントハンドリングのみを担当
 * 低結合度: イベントベースで他のモジュールと連携
 */

export class ControlsManager {
    constructor() {
        this.callbacks = {};
    }

    /**
     * イベントリスナーを初期化
     */
    initEventListeners() {
        // モード選択
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this._trigger('modeChanged', btn.dataset.mode);
            });
        });

        // 難易度選択
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this._trigger('difficultyChanged', e.target.value);
        });

        // オンライン接続
        document.getElementById('create-room').addEventListener('click', () => {
            this._trigger('createRoom');
        });

        document.getElementById('join-room').addEventListener('click', () => {
            const roomId = document.getElementById('room-id-input').value.trim();
            this._trigger('joinRoom', roomId);
        });

        document.getElementById('copy-room-id').addEventListener('click', () => {
            this._trigger('copyRoomId');
        });

        // ゲーム履歴
        document.getElementById('view-history').addEventListener('click', () => {
            this._trigger('viewHistory');
        });

        document.getElementById('close-history').addEventListener('click', () => {
            this._trigger('closeHistory');
        });

        document.getElementById('clear-history').addEventListener('click', () => {
            this._trigger('clearHistory');
        });

        // ゲームコントロール
        document.getElementById('new-game').addEventListener('click', () => {
            this._trigger('newGame');
        });

        document.getElementById('reset-score').addEventListener('click', () => {
            this._trigger('resetScore');
        });

        document.getElementById('sound-toggle').addEventListener('click', () => {
            this._trigger('toggleSound');
        });

        document.getElementById('play-again').addEventListener('click', () => {
            this._trigger('playAgain');
        });
    }

    /**
     * ボードのイベントリスナーを初期化
     * @param {HTMLElement} boardElement - ボード要素
     */
    initBoardListeners(boardElement) {
        // セルクリック
        boardElement.addEventListener('click', (e) => {
            const cell = e.target.closest('.cell');
            if (cell) {
                const col = parseInt(cell.dataset.col);
                this._trigger('cellClicked', col);
            }
        });

        // ホバー
        boardElement.addEventListener('mouseover', (e) => {
            const cell = e.target.closest('.cell');
            if (cell) {
                const col = parseInt(cell.dataset.col);
                this._trigger('cellHover', col);
            }
        });

        boardElement.addEventListener('mouseleave', () => {
            this._trigger('boardLeave');
        });
    }

    /**
     * イベントコールバックを登録
     * @param {string} event - イベント名
     * @param {Function} callback - コールバック関数
     */
    on(event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback);
    }

    /**
     * イベントを発火
     * @param {string} event - イベント名
     * @param {*} data - イベントデータ
     * @private
     */
    _trigger(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => callback(data));
        }
    }

    /**
     * サウンドアイコンを更新
     * @param {boolean} enabled - サウンド有効状態
     */
    updateSoundIcon(enabled) {
        document.getElementById('sound-icon').textContent = enabled ? '🔊' : '🔇';
    }

    /**
     * ルームIDをクリップボードにコピー
     * @returns {Promise<void>}
     */
    async copyRoomIdToClipboard() {
        const roomId = document.getElementById('room-id-display').textContent;
        try {
            await navigator.clipboard.writeText(roomId);
            const btn = document.getElementById('copy-room-id');
            const originalText = btn.textContent;
            btn.textContent = '✓';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        } catch (error) {
            console.error('Failed to copy room ID:', error);
        }
    }

    /**
     * ルームID入力値を取得
     * @returns {string}
     */
    getRoomIdInput() {
        return document.getElementById('room-id-input').value.trim();
    }
}

// シングルトンインスタンス
export const controlsManager = new ControlsManager();
