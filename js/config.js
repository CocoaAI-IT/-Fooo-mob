/**
 * ゲーム設定と定数
 * 高凝集度: ゲーム設定に関する定数のみを管理
 * 低結合度: 他のモジュールに依存しない
 */

export const GAME_CONFIG = {
    ROWS: 6,
    COLS: 7,
    PLAYER1: 1,
    PLAYER2: 2,
    EMPTY: 0,

    GAME_MODES: {
        LOCAL: 'local',
        ONLINE: 'online',
        PVC: 'pvc'
    },

    DIFFICULTY: {
        EASY: 'easy',
        MEDIUM: 'medium',
        HARD: 'hard'
    },

    AI_DEPTH: 3, // ミニマックスアルゴリズムの探索深度

    ANIMATION_DELAY: {
        DROP: 500,
        WIN_MODAL: 800,
        DRAW_MODAL: 500
    }
};

export const UI_CONFIG = {
    CELL_SIZE_VAR: '--cell-size',
    DEFAULT_CELL_SIZE: 70
};

export const STORAGE_CONFIG = {
    SCORES_KEY: 'connectFourScores',
    DB_NAME: 'ConnectFourDB',
    DB_VERSION: 1,
    GAMES_STORE: 'games'
};
