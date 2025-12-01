/**
 * モーダル管理
 * 高凝集度: モーダル表示のみを担当
 * 低結合度: DOM操作のみ
 */

import { GAME_CONFIG } from '../config.js';

export class ModalManager {
    /**
     * 勝利モーダルを表示
     * @param {string} winnerName - 勝者名
     */
    static showWinModal(winnerName) {
        const modal = document.getElementById('win-modal');
        const message = document.getElementById('win-message');
        const trophy = document.querySelector('.modal-trophy');

        if (winnerName === '引き分け') {
            message.textContent = '引き分け！';
            trophy.textContent = '🤝';
        } else {
            message.textContent = `${winnerName} の勝利！`;
            trophy.textContent = '🏆';
        }

        modal.classList.add('show');
    }

    /**
     * モーダルを非表示
     */
    static hideModal() {
        document.getElementById('win-modal').classList.remove('show');
        document.getElementById('history-modal').classList.remove('show');
    }

    /**
     * ゲーム履歴モーダルを表示
     * @param {Array} games - ゲーム履歴
     */
    static showHistoryModal(games) {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';

        if (games.length === 0) {
            historyList.innerHTML = '<div class="history-empty">まだ履歴がありません</div>';
        } else {
            games.forEach(game => {
                const item = document.createElement('div');
                item.className = 'history-item';

                const icon = game.winner === '引き分け' ? '🤝' : '🏆';
                const modeText = this._getModeName(game.mode);
                const date = new Date(game.date).toLocaleString('ja-JP');

                item.innerHTML = `
                    <div class="history-icon">${icon}</div>
                    <div class="history-details">
                        <div class="history-winner">${game.winner}</div>
                        <div class="history-mode">${modeText}</div>
                    </div>
                    <div class="history-date">${date}</div>
                `;

                historyList.appendChild(item);
            });
        }

        // 統計を計算して表示
        this._updateHistoryStats(games);

        document.getElementById('history-modal').classList.add('show');
    }

    /**
     * 履歴統計を更新
     * @param {Array} games - ゲーム履歴
     * @private
     */
    static _updateHistoryStats(games) {
        const totalGames = games.length;
        const wins = games.filter(g => g.winner === 'Player 1').length;
        const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

        // 最長連勝を計算
        let maxStreak = 0;
        let currentStreak = 0;
        [...games].reverse().forEach(game => {
            if (game.winner === 'Player 1') {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        });

        document.getElementById('total-games').textContent = totalGames;
        document.getElementById('win-rate').textContent = winRate + '%';
        document.getElementById('max-streak').textContent = maxStreak;
    }

    /**
     * モード名を取得
     * @param {string} mode - モードID
     * @returns {string}
     * @private
     */
    static _getModeName(mode) {
        switch (mode) {
            case GAME_CONFIG.GAME_MODES.LOCAL:
                return 'ローカル';
            case GAME_CONFIG.GAME_MODES.ONLINE:
                return 'オンライン';
            case GAME_CONFIG.GAME_MODES.PVC:
                return 'CPU';
            default:
                return mode;
        }
    }

    /**
     * 接続状態を更新
     * @param {string} text - ステータステキスト
     * @param {string} emoji - ステータス絵文字
     */
    static updateConnectionStatus(text, emoji) {
        document.getElementById('status-text').textContent = text;
        document.getElementById('connection-status').textContent = emoji;
    }

    /**
     * ルーム情報を表示
     * @param {string} roomId - ルームID
     */
    static showRoomInfo(roomId) {
        document.getElementById('room-id-display').textContent = roomId;
        document.getElementById('room-info').classList.remove('hidden');
    }

    /**
     * ルーム情報を非表示
     */
    static hideRoomInfo() {
        document.getElementById('room-info').classList.add('hidden');
    }

    /**
     * モード選択UIを更新
     * @param {string} mode - ゲームモード
     */
    static updateModeUI(mode) {
        const difficultySelector = document.querySelector('.difficulty-selector');
        const onlineConnection = document.querySelector('.online-connection');

        // すべて非表示
        difficultySelector.classList.add('hidden');
        onlineConnection.classList.add('hidden');

        // モードに応じて表示
        if (mode === GAME_CONFIG.GAME_MODES.PVC) {
            difficultySelector.classList.remove('hidden');
        } else if (mode === GAME_CONFIG.GAME_MODES.ONLINE) {
            onlineConnection.classList.remove('hidden');
        }
    }
}
