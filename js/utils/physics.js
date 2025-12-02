/**
 * 物理エンジン管理（Cannon.js）
 * 高凝集度: 物理演算のみを担当
 * 低結合度: 他のモジュールに依存しない
 */

import { GAME_CONFIG } from '../config.js';

export class PhysicsWorld {
    constructor() {
        this.world = null;
        this.discs = [];
        this.board = null;
    }

    /**
     * 物理ワールドを初期化
     */
    init() {
        // Cannon.jsのワールドを作成
        this.world = new CANNON.World();
        this.world.gravity.set(0, -30, 0); // 重力設定

        // 各行に「棚」を作成（ディスクが正確な行に止まるように）
        this._createShelves();

        // 壁を作成（ディスクがボードから落ちないように）
        this._createWalls();
    }

    /**
     * 各行の棚を作成
     * @private
     */
    _createShelves() {
        const cellSize = 1.2;
        const boardWidth = GAME_CONFIG.COLS * cellSize;
        const shelfThickness = 0.2;

        for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
            // ディスクが止まるべきY座標
            const discY = cellSize / 2 + (GAME_CONFIG.ROWS - 1 - row) * cellSize;
            // 棚の中心Y座標（ディスクの底から棚の厚み半分下）
            const shelfY = discY - 0.1 - shelfThickness / 2;

            const shelfShape = new CANNON.Box(new CANNON.Vec3(boardWidth / 2, shelfThickness / 2, 1.5));
            const shelfBody = new CANNON.Body({
                mass: 0,
                shape: shelfShape,
                position: new CANNON.Vec3(0, shelfY, -0.3)
            });
            this.world.addBody(shelfBody);
        }
    }

    /**
     * 壁を作成
     * @private
     */
    _createWalls() {
        const wallThickness = 0.5;
        const cellSize = 1.2;
        const boardWidth = GAME_CONFIG.COLS * cellSize;
        const boardHeight = GAME_CONFIG.ROWS * cellSize;

        // 左壁
        const leftWall = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Box(new CANNON.Vec3(wallThickness / 2, boardHeight / 2, 1.5)),
            position: new CANNON.Vec3(-boardWidth / 2 - wallThickness / 2, boardHeight / 2, -0.3)
        });
        this.world.addBody(leftWall);

        // 右壁
        const rightWall = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Box(new CANNON.Vec3(wallThickness / 2, boardHeight / 2, 1.5)),
            position: new CANNON.Vec3(boardWidth / 2 + wallThickness / 2, boardHeight / 2, -0.3)
        });
        this.world.addBody(rightWall);

        // 奥壁
        const backWall = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Box(new CANNON.Vec3(boardWidth / 2, boardHeight / 2, wallThickness / 2)),
            position: new CANNON.Vec3(0, boardHeight / 2, -1.5)
        });
        this.world.addBody(backWall);
    }

    /**
     * ディスクを追加
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} z - Z座標
     * @param {number} radius - 半径
     * @returns {CANNON.Body}
     */
    addDisc(x, y, z, radius = 0.5) {
        const shape = new CANNON.Cylinder(radius, radius, 0.2, 16);
        const body = new CANNON.Body({
            mass: 1,
            shape: shape,
            position: new CANNON.Vec3(x, y, z),
            linearDamping: 0.3,
            angularDamping: 0.3
        });

        // 円盤を水平に回転（Cannon.jsの円柱はデフォルトでY軸方向）
        const quat = new CANNON.Quaternion();
        quat.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        body.quaternion.copy(quat);

        this.world.addBody(body);
        this.discs.push(body);

        return body;
    }

    /**
     * 物理シミュレーションを更新
     * @param {number} deltaTime - 経過時間（秒）
     */
    step(deltaTime) {
        if (this.world) {
            this.world.step(1 / 60, deltaTime, 3);
        }
    }

    /**
     * すべてのディスクをクリア
     */
    clearDiscs() {
        this.discs.forEach(disc => {
            this.world.removeBody(disc);
        });
        this.discs = [];
    }

    /**
     * 特定のディスクが静止しているか確認
     * @param {CANNON.Body} body - チェックする物体
     * @returns {boolean}
     */
    isAtRest(body) {
        const threshold = 0.01;
        return Math.abs(body.velocity.y) < threshold &&
               Math.abs(body.angularVelocity.length()) < threshold;
    }
}

// シングルトンインスタンス
export const physicsWorld = new PhysicsWorld();
