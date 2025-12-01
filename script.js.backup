// ========================================
// ゲーム状態管理
// ========================================
const ROWS = 6;
const COLS = 7;
const PLAYER1 = 1;
const PLAYER2 = 2;
const EMPTY = 0;

let board = [];
let currentPlayer = PLAYER1;
let gameMode = 'local'; // 'local', 'online', or 'pvc'
let difficulty = 'medium';
let gameActive = true;
let soundEnabled = true;

// オンラインプレイ用
let peer = null;
let connection = null;
let myPeerId = null;
let isHost = false;
let myPlayerNumber = null;

// スコア
let scores = {
    player1: 0,
    player2: 0,
    draws: 0
};

// IndexedDB
let db = null;

// ========================================
// IndexedDB 初期化
// ========================================
function initIndexedDB() {
    const request = indexedDB.open('ConnectFourDB', 1);

    request.onerror = () => {
        console.error('IndexedDB error:', request.error);
    };

    request.onsuccess = () => {
        db = request.result;
        console.log('IndexedDB initialized');
    };

    request.onupgradeneeded = (event) => {
        db = event.target.result;

        if (!db.objectStoreNames.contains('games')) {
            const objectStore = db.createObjectStore('games', { keyPath: 'id', autoIncrement: true });
            objectStore.createIndex('date', 'date', { unique: false });
            objectStore.createIndex('mode', 'mode', { unique: false });
        }
    };
}

// ゲーム履歴を保存
function saveGameHistory(winner, mode) {
    if (!db) return;

    const transaction = db.transaction(['games'], 'readwrite');
    const objectStore = transaction.objectStore('games');

    const gameData = {
        winner: winner,
        mode: mode,
        date: new Date().toISOString()
    };

    objectStore.add(gameData);
}

// ゲーム履歴を取得
function getGameHistory(callback) {
    if (!db) {
        callback([]);
        return;
    }

    const transaction = db.transaction(['games'], 'readonly');
    const objectStore = transaction.objectStore('games');
    const request = objectStore.getAll();

    request.onsuccess = () => {
        callback(request.result.reverse()); // 新しい順
    };

    request.onerror = () => {
        callback([]);
    };
}

// ゲーム履歴をクリア
function clearGameHistory() {
    if (!db) return;

    const transaction = db.transaction(['games'], 'readwrite');
    const objectStore = transaction.objectStore('games');
    objectStore.clear();
}

// ========================================
// PeerJS 初期化
// ========================================
function initPeer() {
    if (peer) return;

    // ランダムなIDを生成
    const randomId = 'cf-' + Math.random().toString(36).substr(2, 9);
    peer = new Peer(randomId);

    peer.on('open', (id) => {
        myPeerId = id;
        console.log('My peer ID:', id);
        updateConnectionStatus('待機中', '🟡');
    });

    peer.on('connection', (conn) => {
        if (connection) {
            conn.close();
            return;
        }

        connection = conn;
        setupConnection();
        isHost = true;
        myPlayerNumber = PLAYER1;
        updateConnectionStatus('接続済み', '🟢');
        resetGame();
    });

    peer.on('error', (err) => {
        console.error('PeerJS error:', err);
        updateConnectionStatus('エラー', '🔴');
        alert('接続エラーが発生しました: ' + err.type);
    });
}

// 接続のセットアップ
function setupConnection() {
    connection.on('data', (data) => {
        handlePeerData(data);
    });

    connection.on('close', () => {
        updateConnectionStatus('切断されました', '🔴');
        connection = null;
        alert('相手との接続が切断されました');
    });

    connection.on('error', (err) => {
        console.error('Connection error:', err);
    });
}

// ピアからのデータを処理
function handlePeerData(data) {
    switch (data.type) {
        case 'move':
            if (data.player !== currentPlayer) return;

            board = data.board;
            currentPlayer = data.nextPlayer;
            updateBoardUI();
            updateUI();

            if (data.won) {
                handleWin(data.player);
            } else if (data.draw) {
                handleDraw();
            }
            break;

        case 'reset':
            resetGame();
            break;
    }
}

// 手を送信
function sendMove(col, won = false, draw = false) {
    if (!connection || !connection.open) return;

    const nextPlayer = currentPlayer === PLAYER1 ? PLAYER2 : PLAYER1;

    connection.send({
        type: 'move',
        col: col,
        board: board,
        player: currentPlayer,
        nextPlayer: nextPlayer,
        won: won,
        draw: draw
    });
}

// リセットを送信
function sendReset() {
    if (!connection || !connection.open) return;

    connection.send({
        type: 'reset'
    });
}

// 接続状態を更新
function updateConnectionStatus(text, emoji) {
    document.getElementById('status-text').textContent = text;
    document.getElementById('connection-status').textContent = emoji;
}

// ========================================
// 初期化
// ========================================
function init() {
    initBoard();
    renderBoard();
    attachEventListeners();
    updateUI();
    loadScores();
    initIndexedDB();
}

function initBoard() {
    board = Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));
    currentPlayer = PLAYER1;
    gameActive = true;
}

function renderBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;

            cell.addEventListener('click', () => handleCellClick(col));
            cell.addEventListener('mouseenter', () => handleCellHover(col));

            boardElement.appendChild(cell);
        }
    }

    boardElement.addEventListener('mouseleave', hideHoverPreview);
}

// ========================================
// イベントリスナー
// ========================================
function attachEventListeners() {
    // モード選択
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            gameMode = btn.dataset.mode;
            updateModeUI();
            resetGame();
        });
    });

    // 難易度選択
    document.getElementById('difficulty').addEventListener('change', (e) => {
        difficulty = e.target.value;
    });

    // オンライン接続
    document.getElementById('create-room').addEventListener('click', createRoom);
    document.getElementById('join-room').addEventListener('click', joinRoom);
    document.getElementById('copy-room-id').addEventListener('click', copyRoomId);

    // ゲーム履歴
    document.getElementById('view-history').addEventListener('click', showHistory);
    document.getElementById('close-history').addEventListener('click', () => {
        document.getElementById('history-modal').classList.remove('show');
    });
    document.getElementById('clear-history').addEventListener('click', () => {
        if (confirm('履歴を全て削除しますか？')) {
            clearGameHistory();
            showHistory();
        }
    });

    // コントロールボタン
    document.getElementById('new-game').addEventListener('click', resetGame);
    document.getElementById('reset-score').addEventListener('click', resetScores);
    document.getElementById('sound-toggle').addEventListener('click', toggleSound);
    document.getElementById('play-again').addEventListener('click', () => {
        hideModal();
        resetGame();
    });
}

// ルームを作成
function createRoom() {
    if (!peer) initPeer();

    setTimeout(() => {
        if (myPeerId) {
            document.getElementById('room-id-display').textContent = myPeerId;
            document.getElementById('room-info').classList.remove('hidden');
            updateConnectionStatus('待機中...', '🟡');
        }
    }, 1000);
}

// ルームに参加
function joinRoom() {
    const roomId = document.getElementById('room-id-input').value.trim();
    if (!roomId) {
        alert('ルームIDを入力してください');
        return;
    }

    if (!peer) initPeer();

    setTimeout(() => {
        connection = peer.connect(roomId);

        connection.on('open', () => {
            setupConnection();
            isHost = false;
            myPlayerNumber = PLAYER2;
            updateConnectionStatus('接続済み', '🟢');
            alert('ルームに参加しました！');
        });

        connection.on('error', (err) => {
            console.error('Connection failed:', err);
            updateConnectionStatus('接続失敗', '🔴');
            alert('接続に失敗しました。ルームIDを確認してください。');
        });
    }, 1000);
}

// ルームIDをコピー
function copyRoomId() {
    const roomId = document.getElementById('room-id-display').textContent;
    navigator.clipboard.writeText(roomId).then(() => {
        const btn = document.getElementById('copy-room-id');
        btn.textContent = '✓';
        setTimeout(() => {
            btn.textContent = '📋';
        }, 2000);
    });
}

// ゲーム履歴を表示
function showHistory() {
    getGameHistory((games) => {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';

        if (games.length === 0) {
            historyList.innerHTML = '<div class="history-empty">まだ履歴がありません</div>';
        } else {
            games.forEach(game => {
                const item = document.createElement('div');
                item.className = 'history-item';

                const icon = game.winner === '引き分け' ? '🤝' : '🏆';
                const modeText = game.mode === 'local' ? 'ローカル' : (game.mode === 'online' ? 'オンライン' : 'CPU');
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

        // 統計を計算
        const totalGames = games.length;
        const wins = games.filter(g => g.winner === 'Player 1').length;
        const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

        // 最長連勝を計算
        let maxStreak = 0;
        let currentStreak = 0;
        games.reverse().forEach(game => {
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

        document.getElementById('history-modal').classList.add('show');
    });
}

// ========================================
// ゲームロジック
// ========================================
function handleCellClick(col) {
    if (!gameActive) return;

    // オンラインモードでは自分のターンのみ操作可能
    if (gameMode === 'online') {
        if (!connection || !connection.open) {
            alert('対戦相手と接続されていません');
            return;
        }
        if (currentPlayer !== myPlayerNumber) {
            return;
        }
    }

    // PVCモードでAIのターン中は操作不可
    if (gameMode === 'pvc' && currentPlayer === PLAYER2) {
        return;
    }

    if (dropDisc(col)) {
        updateBoardUI();

        const won = checkWin(currentPlayer);
        const draw = !won && isBoardFull();

        if (gameMode === 'online') {
            sendMove(col, won, draw);
        }

        if (won) {
            handleWin(currentPlayer);
        } else if (draw) {
            handleDraw();
        } else {
            switchPlayer();

            // PVCモードでAIのターン
            if (gameMode === 'pvc' && currentPlayer === PLAYER2) {
                setTimeout(() => {
                    aiMove();
                }, 500);
            }
        }
    }
}

function dropDisc(col) {
    // 列が満杯かチェック
    if (board[0][col] !== EMPTY) {
        return false;
    }

    // 最下段から空いている場所を探す
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row][col] === EMPTY) {
            board[row][col] = currentPlayer;
            playSoundEffect('drop');
            return true;
        }
    }

    return false;
}

function switchPlayer() {
    currentPlayer = currentPlayer === PLAYER1 ? PLAYER2 : PLAYER1;
    updateUI();
}

function checkWin(player) {
    // 横方向チェック
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS - 3; col++) {
            if (board[row][col] === player &&
                board[row][col + 1] === player &&
                board[row][col + 2] === player &&
                board[row][col + 3] === player) {
                highlightWinningCells([[row, col], [row, col + 1], [row, col + 2], [row, col + 3]]);
                return true;
            }
        }
    }

    // 縦方向チェック
    for (let row = 0; row < ROWS - 3; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col] === player &&
                board[row + 1][col] === player &&
                board[row + 2][col] === player &&
                board[row + 3][col] === player) {
                highlightWinningCells([[row, col], [row + 1, col], [row + 2, col], [row + 3, col]]);
                return true;
            }
        }
    }

    // 斜め（右下）チェック
    for (let row = 0; row < ROWS - 3; row++) {
        for (let col = 0; col < COLS - 3; col++) {
            if (board[row][col] === player &&
                board[row + 1][col + 1] === player &&
                board[row + 2][col + 2] === player &&
                board[row + 3][col + 3] === player) {
                highlightWinningCells([[row, col], [row + 1, col + 1], [row + 2, col + 2], [row + 3, col + 3]]);
                return true;
            }
        }
    }

    // 斜め（左下）チェック
    for (let row = 0; row < ROWS - 3; row++) {
        for (let col = 3; col < COLS; col++) {
            if (board[row][col] === player &&
                board[row + 1][col - 1] === player &&
                board[row + 2][col - 2] === player &&
                board[row + 3][col - 3] === player) {
                highlightWinningCells([[row, col], [row + 1, col - 1], [row + 2, col - 2], [row + 3, col - 3]]);
                return true;
            }
        }
    }

    return false;
}

function isBoardFull() {
    return board[0].every(cell => cell !== EMPTY);
}

function highlightWinningCells(cells) {
    cells.forEach(([row, col]) => {
        const index = row * COLS + col;
        const cellElement = document.getElementById('board').children[index];
        cellElement.classList.add('winning');
    });
}

// ========================================
// AI ロジック
// ========================================
function aiMove() {
    if (!gameActive) return;

    let col;

    switch (difficulty) {
        case 'easy':
            col = aiMoveRandom();
            break;
        case 'medium':
            col = aiMoveMedium();
            break;
        case 'hard':
            col = aiMoveHard();
            break;
        default:
            col = aiMoveRandom();
    }

    if (dropDisc(col)) {
        updateBoardUI();

        if (checkWin(PLAYER2)) {
            handleWin(PLAYER2);
        } else if (isBoardFull()) {
            handleDraw();
        } else {
            switchPlayer();
        }
    }
}

function aiMoveRandom() {
    const availableCols = [];
    for (let col = 0; col < COLS; col++) {
        if (board[0][col] === EMPTY) {
            availableCols.push(col);
        }
    }
    return availableCols[Math.floor(Math.random() * availableCols.length)];
}

function aiMoveMedium() {
    // 1. 勝てる手があればそれを選ぶ
    for (let col = 0; col < COLS; col++) {
        if (canPlaceDisc(col)) {
            const row = getLowestEmptyRow(col);
            board[row][col] = PLAYER2;
            if (checkWin(PLAYER2)) {
                board[row][col] = EMPTY;
                return col;
            }
            board[row][col] = EMPTY;
        }
    }

    // 2. 相手が勝つ手を阻止
    for (let col = 0; col < COLS; col++) {
        if (canPlaceDisc(col)) {
            const row = getLowestEmptyRow(col);
            board[row][col] = PLAYER1;
            if (checkWin(PLAYER1)) {
                board[row][col] = EMPTY;
                return col;
            }
            board[row][col] = EMPTY;
        }
    }

    // 3. ランダム
    return aiMoveRandom();
}

function aiMoveHard() {
    // ミニマックスアルゴリズム（簡易版）
    let bestScore = -Infinity;
    let bestCol = 0;

    for (let col = 0; col < COLS; col++) {
        if (canPlaceDisc(col)) {
            const row = getLowestEmptyRow(col);
            board[row][col] = PLAYER2;
            const score = minimax(board, 3, false);
            board[row][col] = EMPTY;

            if (score > bestScore) {
                bestScore = score;
                bestCol = col;
            }
        }
    }

    return bestCol;
}

function minimax(board, depth, isMaximizing) {
    if (depth === 0 || !gameActive) {
        return evaluateBoard();
    }

    if (isMaximizing) {
        let maxScore = -Infinity;
        for (let col = 0; col < COLS; col++) {
            if (canPlaceDisc(col)) {
                const row = getLowestEmptyRow(col);
                board[row][col] = PLAYER2;
                const score = minimax(board, depth - 1, false);
                board[row][col] = EMPTY;
                maxScore = Math.max(maxScore, score);
            }
        }
        return maxScore;
    } else {
        let minScore = Infinity;
        for (let col = 0; col < COLS; col++) {
            if (canPlaceDisc(col)) {
                const row = getLowestEmptyRow(col);
                board[row][col] = PLAYER1;
                const score = minimax(board, depth - 1, true);
                board[row][col] = EMPTY;
                minScore = Math.min(minScore, score);
            }
        }
        return minScore;
    }
}

function evaluateBoard() {
    // 簡易評価関数
    let score = 0;

    // 中央の列を優先
    const centerCol = Math.floor(COLS / 2);
    for (let row = 0; row < ROWS; row++) {
        if (board[row][centerCol] === PLAYER2) score += 3;
        if (board[row][centerCol] === PLAYER1) score -= 3;
    }

    return score;
}

function canPlaceDisc(col) {
    return board[0][col] === EMPTY;
}

function getLowestEmptyRow(col) {
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row][col] === EMPTY) {
            return row;
        }
    }
    return -1;
}

// ========================================
// UI更新
// ========================================
function updateBoardUI() {
    const cells = document.getElementById('board').children;

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const index = row * COLS + col;
            const cell = cells[index];
            cell.innerHTML = '';
            cell.classList.remove('filled', 'drop-animation');

            if (board[row][col] !== EMPTY) {
                const disc = document.createElement('span');
                disc.className = `player-disc ${board[row][col] === PLAYER1 ? 'blue' : 'red'}`;
                cell.appendChild(disc);
                cell.classList.add('filled', 'drop-animation');
            }
        }
    }
}

function updateUI() {
    let playerName;
    if (gameMode === 'online') {
        playerName = currentPlayer === PLAYER1 ? 'Player 1' : 'Player 2';
    } else if (gameMode === 'pvc') {
        playerName = currentPlayer === PLAYER1 ? 'Player 1' : 'CPU';
    } else {
        playerName = currentPlayer === PLAYER1 ? 'Player 1' : 'Player 2';
    }

    document.getElementById('current-player').textContent = playerName;

    const turnDisc = document.getElementById('turn-disc');
    turnDisc.className = `player-disc ${currentPlayer === PLAYER1 ? 'blue' : 'red'}`;

    // スコア更新
    document.getElementById('player1-score').textContent = scores.player1;
    document.getElementById('player2-score').textContent = scores.player2;
    document.getElementById('draw-score').textContent = scores.draws;

    // プレイヤー名更新
    if (gameMode === 'pvc') {
        document.getElementById('player2-name').textContent = 'CPU';
    } else {
        document.getElementById('player2-name').textContent = 'Player 2';
    }
}

function updateModeUI() {
    const difficultySelector = document.querySelector('.difficulty-selector');
    const onlineConnection = document.querySelector('.online-connection');

    // すべて非表示
    difficultySelector.classList.add('hidden');
    onlineConnection.classList.add('hidden');

    // モードに応じて表示
    if (gameMode === 'pvc') {
        difficultySelector.classList.remove('hidden');
    } else if (gameMode === 'online') {
        onlineConnection.classList.remove('hidden');
    }
}

function handleCellHover(col) {
    if (!gameActive) return;

    // オンラインモードでは自分のターンでないとプレビュー表示しない
    if (gameMode === 'online' && currentPlayer !== myPlayerNumber) return;
    if (gameMode === 'pvc' && currentPlayer === PLAYER2) return;
    if (!canPlaceDisc(col)) return;

    const preview = document.getElementById('hover-preview');
    const previewDisc = preview.querySelector('.preview-disc');

    preview.classList.add('visible');
    previewDisc.className = `preview-disc ${currentPlayer === PLAYER1 ? 'blue' : 'red'}`;

    const cellSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-size'));
    const gap = 8;
    const padding = 10;
    const leftPosition = padding + col * (cellSize + gap);

    previewDisc.style.left = `${leftPosition}px`;
}

function hideHoverPreview() {
    document.getElementById('hover-preview').classList.remove('visible');
}

// ========================================
// ゲーム終了処理
// ========================================
function handleWin(player) {
    gameActive = false;
    playSoundEffect('win');

    if (player === PLAYER1) {
        scores.player1++;
    } else {
        scores.player2++;
    }

    saveScores();
    updateUI();

    let playerName;
    if (gameMode === 'online') {
        playerName = player === PLAYER1 ? 'Player 1' : 'Player 2';
    } else if (gameMode === 'pvc') {
        playerName = player === PLAYER1 ? 'Player 1' : 'CPU';
    } else {
        playerName = player === PLAYER1 ? 'Player 1' : 'Player 2';
    }

    // IndexedDBに保存
    saveGameHistory(playerName, gameMode);

    setTimeout(() => {
        showWinModal(playerName);
    }, 800);
}

function handleDraw() {
    gameActive = false;
    scores.draws++;
    saveScores();
    updateUI();

    // IndexedDBに保存
    saveGameHistory('引き分け', gameMode);

    setTimeout(() => {
        showWinModal('引き分け');
    }, 500);
}

function showWinModal(winner) {
    const modal = document.getElementById('win-modal');
    const message = document.getElementById('win-message');

    if (winner === '引き分け') {
        message.textContent = '引き分け！';
        document.querySelector('.modal-trophy').textContent = '🤝';
    } else {
        message.textContent = `${winner} の勝利！`;
        document.querySelector('.modal-trophy').textContent = '🏆';
    }

    modal.classList.add('show');
}

function hideModal() {
    document.getElementById('win-modal').classList.remove('show');
}

function resetGame() {
    hideModal();
    initBoard();
    renderBoard();
    updateUI();

    // オンラインモードの場合、リセットを通知
    if (gameMode === 'online' && isHost) {
        sendReset();
    }
}

function resetScores() {
    if (confirm('スコアをリセットしますか？')) {
        scores = { player1: 0, player2: 0, draws: 0 };
        saveScores();
        updateUI();
    }
}

// ========================================
// ローカルストレージ
// ========================================
function saveScores() {
    localStorage.setItem('connectFourScores', JSON.stringify(scores));
}

function loadScores() {
    const saved = localStorage.getItem('connectFourScores');
    if (saved) {
        scores = JSON.parse(saved);
        updateUI();
    }
}

// ========================================
// サウンド効果
// ========================================
function toggleSound() {
    soundEnabled = !soundEnabled;
    document.getElementById('sound-icon').textContent = soundEnabled ? '🔊' : '🔇';
}

function playSoundEffect(type) {
    if (!soundEnabled) return;

    // Web Audio API でシンプルな効果音を生成
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'drop') {
        oscillator.frequency.value = 300;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } else if (type === 'win') {
        oscillator.frequency.value = 523.25; // C5
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }
}

// ========================================
// 起動
// ========================================
document.addEventListener('DOMContentLoaded', init);
