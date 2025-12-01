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
let gameMode = 'pvp'; // 'pvp' or 'pvc'
let difficulty = 'medium';
let gameActive = true;
let soundEnabled = true;

// スコア
let scores = {
    player1: 0,
    player2: 0,
    draws: 0
};

// ========================================
// 初期化
// ========================================
function init() {
    initBoard();
    renderBoard();
    attachEventListeners();
    updateUI();
    loadScores();
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

    // コントロールボタン
    document.getElementById('new-game').addEventListener('click', resetGame);
    document.getElementById('reset-score').addEventListener('click', resetScores);
    document.getElementById('sound-toggle').addEventListener('click', toggleSound);
    document.getElementById('play-again').addEventListener('click', () => {
        hideModal();
        resetGame();
    });
}

// ========================================
// ゲームロジック
// ========================================
function handleCellClick(col) {
    if (!gameActive) return;
    if (gameMode === 'pvc' && currentPlayer === PLAYER2) return; // AIのターン中は操作不可

    if (dropDisc(col)) {
        updateBoardUI();

        if (checkWin(currentPlayer)) {
            handleWin(currentPlayer);
        } else if (isBoardFull()) {
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
    const playerName = currentPlayer === PLAYER1 ?
        (gameMode === 'pvp' ? 'Player 1' : 'Player 1') :
        (gameMode === 'pvp' ? 'Player 2' : 'CPU');

    document.getElementById('current-player').textContent = playerName;

    const turnDisc = document.getElementById('turn-disc');
    turnDisc.className = `player-disc ${currentPlayer === PLAYER1 ? 'blue' : 'red'}`;

    // スコア更新
    document.getElementById('player1-score').textContent = scores.player1;
    document.getElementById('player2-score').textContent = scores.player2;
    document.getElementById('draw-score').textContent = scores.draws;

    // プレイヤー名更新
    document.getElementById('player2-name').textContent = gameMode === 'pvp' ? 'Player 2' : 'CPU';
}

function updateModeUI() {
    const difficultySelector = document.querySelector('.difficulty-selector');
    if (gameMode === 'pvc') {
        difficultySelector.classList.remove('hidden');
    } else {
        difficultySelector.classList.add('hidden');
    }
}

function handleCellHover(col) {
    if (!gameActive) return;
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

    const playerName = player === PLAYER1 ?
        'Player 1' :
        (gameMode === 'pvp' ? 'Player 2' : 'CPU');

    setTimeout(() => {
        showWinModal(playerName);
    }, 800);
}

function handleDraw() {
    gameActive = false;
    scores.draws++;
    saveScores();
    updateUI();

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
