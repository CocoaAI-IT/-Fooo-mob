/**
 * メインエントリーポイント
 * 各モジュールを統合してゲーム全体を制御
 */

import { GAME_CONFIG } from './config.js';
import { gameState } from './state.js';
import { Board } from './game/board.js';
import { Rules } from './game/rules.js';
import { Player } from './game/player.js';
import { AI } from './ai/ai.js';
import { peerManager } from './online/peer.js';
import { ScoreStorage } from './storage/localStorage.js';
import { gameHistoryDB } from './storage/indexedDB.js';
import { BoardUI } from './ui/board-ui.js';
import { ModalManager } from './ui/modal.js';
import { controlsManager } from './ui/controls.js';
import { AudioManager } from './utils/audio.js';

class ConnectFourGame {
    constructor() {
        this.initialized = false;
    }

    /**
     * ゲーム初期化
     */
    async init() {
        if (this.initialized) return;

        // IndexedDB初期化
        await gameHistoryDB.init();

        // スコア読み込み
        const savedScores = ScoreStorage.load();
        if (savedScores) {
            gameState.setScores(savedScores);
        }

        // ボード描画
        const boardElement = document.getElementById('board');
        BoardUI.renderBoard(boardElement);

        // イベントリスナー設定
        this._setupEventListeners();

        // PeerJSイベント設定
        this._setupPeerEvents();

        // UI更新
        this._updateAllUI();

        this.initialized = true;
    }

    /**
     * イベントリスナーを設定
     * @private
     */
    _setupEventListeners() {
        // コントロール初期化
        controlsManager.initEventListeners();
        controlsManager.initBoardListeners(document.getElementById('board'));

        // ゲームイベント
        controlsManager.on('cellClicked', (col) => this._handleCellClick(col));
        controlsManager.on('cellHover', (col) => this._handleCellHover(col));
        controlsManager.on('boardLeave', () => BoardUI.hidePreview());

        // モード変更
        controlsManager.on('modeChanged', (mode) => {
            gameState.setGameMode(mode);
            ModalManager.updateModeUI(mode);
            this._resetGame();
        });

        controlsManager.on('difficultyChanged', (difficulty) => {
            gameState.setDifficulty(difficulty);
        });

        // オンライン接続
        controlsManager.on('createRoom', () => this._createRoom());
        controlsManager.on('joinRoom', (roomId) => this._joinRoom(roomId));
        controlsManager.on('copyRoomId', () => controlsManager.copyRoomIdToClipboard());

        // ゲームコントロール
        controlsManager.on('newGame', () => this._resetGame());
        controlsManager.on('playAgain', () => {
            ModalManager.hideModal();
            this._resetGame();
        });
        controlsManager.on('resetScore', () => this._resetScores());
        controlsManager.on('toggleSound', () => this._toggleSound());

        // 履歴
        controlsManager.on('viewHistory', () => this._showHistory());
        controlsManager.on('closeHistory', () => ModalManager.hideModal());
        controlsManager.on('clearHistory', () => this._clearHistory());
    }

    /**
     * PeerJSイベントを設定
     * @private
     */
    _setupPeerEvents() {
        peerManager.on('peerOpen', (id) => {
            console.log('Peer opened:', id);
            ModalManager.updateConnectionStatus('待機中', '🟡');
        });

        peerManager.on('connected', ({ isHost }) => {
            ModalManager.updateConnectionStatus('接続済み', '🟢');
            this._resetGame();
        });

        peerManager.on('dataReceived', (data) => {
            this._handlePeerData(data);
        });

        peerManager.on('disconnected', () => {
            ModalManager.updateConnectionStatus('切断されました', '🔴');
            alert('相手との接続が切断されました');
        });

        peerManager.on('error', (err) => {
            ModalManager.updateConnectionStatus('エラー', '🔴');
            console.error('Peer error:', err);
        });

        peerManager.on('connectionError', (err) => {
            ModalManager.updateConnectionStatus('接続失敗', '🔴');
            alert('接続に失敗しました');
        });
    }

    /**
     * セルクリックを処理
     * @param {number} col - 列番号
     * @private
     */
    _handleCellClick(col) {
        if (!gameState.isGameActive()) return;

        // オンラインモードチェック
        if (gameState.getGameMode() === GAME_CONFIG.GAME_MODES.ONLINE) {
            if (!peerManager.isConnected()) {
                alert('対戦相手と接続されていません');
                return;
            }
            if (!Player.isMyTurnOnline()) {
                return;
            }
        }

        // AIのターンはスキップ
        if (Player.isAITurn()) {
            return;
        }

        // ディスクを落とす
        const row = Board.dropDisc(col);
        if (row === null) return;

        AudioManager.play('drop');
        BoardUI.updateBoardUI();

        // 勝利判定
        const gameOver = Rules.checkGameOver();

        // オンラインモードの場合は送信
        if (gameState.getGameMode() === GAME_CONFIG.GAME_MODES.ONLINE) {
            peerManager.send({
                type: 'move',
                col: col,
                board: gameState.getBoardCopy(),
                player: gameState.getCurrentPlayer(),
                nextPlayer: gameState.getCurrentPlayer() === GAME_CONFIG.PLAYER1
                    ? GAME_CONFIG.PLAYER2
                    : GAME_CONFIG.PLAYER1,
                won: gameOver.gameOver && gameOver.winner !== null,
                draw: gameOver.gameOver && gameOver.winner === null
            });
        }

        if (gameOver.gameOver) {
            this._handleGameOver(gameOver);
        } else {
            gameState.switchPlayer();
            this._updateAllUI();

            // AIのターン
            if (Player.isAITurn()) {
                setTimeout(() => this._handleAIMove(), GAME_CONFIG.ANIMATION_DELAY.DROP);
            }
        }
    }

    /**
     * セルホバーを処理
     * @param {number} col - 列番号
     * @private
     */
    _handleCellHover(col) {
        if (!gameState.isGameActive()) return;
        if (Player.isAITurn()) return;
        if (!Player.isMyTurnOnline()) return;
        if (!Rules.canPlaceDisc(col)) return;

        BoardUI.showPreview(col);
    }

    /**
     * AIの手を処理
     * @private
     */
    _handleAIMove() {
        if (!gameState.isGameActive()) return;

        const col = AI.calculateMove();
        const row = Board.dropDisc(col);
        if (row === null) return;

        AudioManager.play('drop');
        BoardUI.updateBoardUI();

        const gameOver = Rules.checkGameOver();
        if (gameOver.gameOver) {
            this._handleGameOver(gameOver);
        } else {
            gameState.switchPlayer();
            this._updateAllUI();
        }
    }

    /**
     * ピアからのデータを処理
     * @param {Object} data - 受信データ
     * @private
     */
    _handlePeerData(data) {
        switch (data.type) {
            case 'move':
                if (data.player !== gameState.getCurrentPlayer()) return;

                gameState.setBoard(data.board);
                gameState.currentPlayer = data.nextPlayer;
                BoardUI.updateBoardUI();
                this._updateAllUI();

                if (data.won) {
                    const gameOver = Rules.checkGameOver();
                    this._handleGameOver(gameOver);
                } else if (data.draw) {
                    this._handleGameOver({ gameOver: true, winner: null, winningLine: null });
                }
                break;

            case 'reset':
                this._resetGame();
                break;
        }
    }

    /**
     * ゲーム終了を処理
     * @param {Object} gameOver - {gameOver, winner, winningLine}
     * @private
     */
    _handleGameOver(gameOver) {
        gameState.setGameActive(false);
        AudioManager.play('win');

        if (gameOver.winningLine) {
            BoardUI.highlightWinningCells(gameOver.winningLine);
        }

        // スコア更新
        if (gameOver.winner !== null) {
            gameState.incrementScore(gameOver.winner);
        } else {
            gameState.incrementScore('draw');
        }

        ScoreStorage.save(gameState.getScores());
        this._updateAllUI();

        // 勝者名を取得
        let winnerName;
        if (gameOver.winner === null) {
            winnerName = '引き分け';
        } else {
            winnerName = Player.getPlayerName(gameOver.winner);
        }

        // 履歴に保存
        gameHistoryDB.save({
            winner: winnerName,
            mode: gameState.getGameMode()
        });

        // モーダル表示
        const delay = gameOver.winner !== null
            ? GAME_CONFIG.ANIMATION_DELAY.WIN_MODAL
            : GAME_CONFIG.ANIMATION_DELAY.DRAW_MODAL;

        setTimeout(() => {
            ModalManager.showWinModal(winnerName);
        }, delay);
    }

    /**
     * ゲームをリセット
     * @private
     */
    _resetGame() {
        ModalManager.hideModal();
        gameState.initBoard();
        const boardElement = document.getElementById('board');
        BoardUI.renderBoard(boardElement);
        controlsManager.initBoardListeners(boardElement);
        BoardUI.updateBoardUI();
        this._updateAllUI();

        // オンラインモードでホストの場合は通知
        if (gameState.getGameMode() === GAME_CONFIG.GAME_MODES.ONLINE &&
            gameState.isHostPlayer() &&
            peerManager.isConnected()) {
            peerManager.send({ type: 'reset' });
        }
    }

    /**
     * スコアをリセット
     * @private
     */
    _resetScores() {
        if (confirm('スコアをリセットしますか？')) {
            gameState.resetScores();
            ScoreStorage.save(gameState.getScores());
            this._updateAllUI();
        }
    }

    /**
     * サウンドを切り替え
     * @private
     */
    _toggleSound() {
        const enabled = AudioManager.toggleSound();
        controlsManager.updateSoundIcon(enabled);
    }

    /**
     * 履歴を表示
     * @private
     */
    async _showHistory() {
        const games = await gameHistoryDB.getAll();
        ModalManager.showHistoryModal(games);
    }

    /**
     * 履歴をクリア
     * @private
     */
    async _clearHistory() {
        if (confirm('履歴を全て削除しますか？')) {
            await gameHistoryDB.clear();
            this._showHistory();
        }
    }

    /**
     * ルームを作成
     * @private
     */
    _createRoom() {
        peerManager.init();

        setTimeout(() => {
            const peerId = peerManager.getPeerId();
            if (peerId) {
                ModalManager.showRoomInfo(peerId);
                ModalManager.updateConnectionStatus('待機中...', '🟡');
            }
        }, 1000);
    }

    /**
     * ルームに参加
     * @param {string} roomId - ルームID
     * @private
     */
    _joinRoom(roomId) {
        if (!roomId) {
            alert('ルームIDを入力してください');
            return;
        }

        peerManager.joinRoom(roomId);
    }

    /**
     * すべてのUIを更新
     * @private
     */
    _updateAllUI() {
        BoardUI.updateTurnIndicator();
        BoardUI.updateScoreDisplay();
    }
}

// アプリケーション起動
const game = new ConnectFourGame();

document.addEventListener('DOMContentLoaded', () => {
    game.init();
});
