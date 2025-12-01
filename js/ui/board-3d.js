/**
 * 3Dボード描画（Three.js + Cannon.js）
 * 高凝集度: 3Dレンダリングのみを担当
 * 低結合度: gameStateを読み取り、物理エンジンと連携
 */

import { GAME_CONFIG } from '../config.js';
import { gameState } from '../state.js';
import { Player } from '../game/player.js';
import { physicsWorld } from '../utils/physics.js';

export class Board3D {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.discMeshes = [];
        this.boardMesh = null;
        this.animationId = null;
        this.clock = new THREE.Clock();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.onCellClick = null; // クリックコールバック
        this.columnMeshes = []; // 列検出用の透明メッシュ
    }

    /**
     * 3Dシーンを初期化
     */
    init() {
        // シーンを作成
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x667eea);

        // カメラを作成（正面から）
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
        this.camera.position.set(0, 5, 15);
        this.camera.lookAt(0, 3, 0);

        // レンダラーを作成
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // ライトを追加
        this._setupLights();

        // ボードを作成
        this._createBoard();

        // 物理ワールドを初期化
        physicsWorld.init();

        // 列検出用の透明メッシュを作成
        this._createColumnDetectors();

        // クリックイベントリスナーを追加
        this.renderer.domElement.addEventListener('click', (event) => this._onClick(event));

        // アニメーションループを開始
        this._animate();

        // リサイズ対応
        window.addEventListener('resize', () => this._onWindowResize());
    }

    /**
     * 列検出用の透明メッシュを作成
     * @private
     */
    _createColumnDetectors() {
        const cellSize = 1.2;
        const startX = -(GAME_CONFIG.COLS - 1) * cellSize / 2;
        const boardHeight = GAME_CONFIG.ROWS * cellSize;

        for (let col = 0; col < GAME_CONFIG.COLS; col++) {
            const geometry = new THREE.BoxGeometry(cellSize, boardHeight, 2);
            const material = new THREE.MeshBasicMaterial({
                transparent: true,
                opacity: 0,
                side: THREE.DoubleSide
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(startX + col * cellSize, boardHeight / 2, 0);
            mesh.userData.column = col;
            this.scene.add(mesh);
            this.columnMeshes.push(mesh);
        }
    }

    /**
     * クリックイベント処理
     * @param {MouseEvent} event - マウスイベント
     * @private
     */
    _onClick(event) {
        // マウス座標を正規化
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Raycasterを更新
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // 交差判定
        const intersects = this.raycaster.intersectObjects(this.columnMeshes);

        if (intersects.length > 0) {
            const col = intersects[0].object.userData.column;
            if (this.onCellClick) {
                this.onCellClick(col);
            }
        }
    }

    /**
     * ライトを設定
     * @private
     */
    _setupLights() {
        // 環境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // 指向性ライト（影あり）
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        this.scene.add(directionalLight);

        // スポットライト
        const spotLight = new THREE.SpotLight(0xffffff, 0.5);
        spotLight.position.set(-5, 10, 5);
        this.scene.add(spotLight);
    }

    /**
     * ボードを作成
     * @private
     */
    _createBoard() {
        const cellSize = 1.2;
        const boardWidth = GAME_CONFIG.COLS * cellSize;
        const boardHeight = GAME_CONFIG.ROWS * cellSize;

        // ボードの枠を作成
        const frameGeometry = new THREE.BoxGeometry(
            boardWidth + 0.4,
            boardHeight + 0.4,
            0.8
        );
        const frameMaterial = new THREE.MeshStandardMaterial({
            color: 0xF59E0B,
            roughness: 0.7,
            metalness: 0.2
        });
        this.boardMesh = new THREE.Mesh(frameGeometry, frameMaterial);
        this.boardMesh.position.set(0, boardHeight / 2, -0.3);
        this.boardMesh.receiveShadow = true;
        this.scene.add(this.boardMesh);

        // 穴（セル）を作成
        this._createCells(cellSize);

        // ボード底面
        const bottomGeometry = new THREE.BoxGeometry(boardWidth, 0.5, 2);
        const bottomMaterial = new THREE.MeshStandardMaterial({
            color: 0xFEF3C7,
            roughness: 0.8
        });
        const bottomMesh = new THREE.Mesh(bottomGeometry, bottomMaterial);
        bottomMesh.position.set(0, -0.25, 0);
        bottomMesh.receiveShadow = true;
        this.scene.add(bottomMesh);
    }

    /**
     * セル（穴）を作成
     * @param {number} cellSize - セルサイズ
     * @private
     */
    _createCells(cellSize) {
        const holeRadius = 0.5;
        const holeGeometry = new THREE.CylinderGeometry(holeRadius, holeRadius, 0.9, 32);
        const holeMaterial = new THREE.MeshStandardMaterial({
            color: 0x1E293B,
            roughness: 0.9,
            metalness: 0.1
        });

        const startX = -(GAME_CONFIG.COLS - 1) * cellSize / 2;
        const startY = (GAME_CONFIG.ROWS - 1) * cellSize / 2;

        for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
            for (let col = 0; col < GAME_CONFIG.COLS; col++) {
                const holeMesh = new THREE.Mesh(holeGeometry, holeMaterial);
                holeMesh.position.set(
                    startX + col * cellSize,
                    startY - row * cellSize,
                    -0.3
                );
                holeMesh.rotation.x = Math.PI / 2;
                this.scene.add(holeMesh);
            }
        }
    }

    /**
     * ディスクを追加（物理演算付き）
     * @param {number} col - 列番号
     * @param {number} player - プレイヤー番号
     * @returns {Promise<void>}
     */
    async dropDisc(col, player) {
        const cellSize = 1.2;
        const startX = -(GAME_CONFIG.COLS - 1) * cellSize / 2;
        const x = startX + col * cellSize;
        const y = 10; // 上から落とす
        const z = 0;

        // Three.jsのメッシュを作成
        const radius = 0.5;
        const discGeometry = new THREE.CylinderGeometry(radius, radius, 0.2, 32);
        const discMaterial = new THREE.MeshStandardMaterial({
            color: player === GAME_CONFIG.PLAYER1 ? 0x3B82F6 : 0xEF4444,
            roughness: 0.4,
            metalness: 0.6
        });
        const discMesh = new THREE.Mesh(discGeometry, discMaterial);
        discMesh.castShadow = true;
        discMesh.receiveShadow = true;

        // 円盤を水平に回転
        discMesh.rotation.x = Math.PI / 2;

        this.scene.add(discMesh);
        this.discMeshes.push(discMesh);

        // Cannon.jsの物理ボディを作成
        const physicsBody = physicsWorld.addDisc(x, y, z, radius);

        // 物理演算とThree.jsの同期
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                // 物理ボディの位置をメッシュに反映
                discMesh.position.copy(physicsBody.position);
                discMesh.quaternion.copy(physicsBody.quaternion);

                // 静止したかチェック
                if (physicsWorld.isAtRest(physicsBody)) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 16); // 約60FPS

            // タイムアウト（5秒で強制終了）
            setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
            }, 5000);
        });
    }

    /**
     * ボードをクリア
     */
    clearBoard() {
        // メッシュを削除
        this.discMeshes.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        this.discMeshes = [];

        // 物理ボディを削除
        physicsWorld.clearDiscs();
    }

    /**
     * ボードを更新（ゲームステートから）
     */
    updateBoard() {
        this.clearBoard();

        const board = gameState.getBoardCopy();
        const cellSize = 1.2;
        const startX = -(GAME_CONFIG.COLS - 1) * cellSize / 2;

        for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
            for (let col = 0; col < GAME_CONFIG.COLS; col++) {
                const player = board[row][col];
                if (player !== GAME_CONFIG.EMPTY) {
                    const x = startX + col * cellSize;
                    const y = (GAME_CONFIG.ROWS - 1 - row) * cellSize + 0.5;
                    const z = 0;

                    // ディスクを配置（物理演算なし、静的配置）
                    this._placeStaticDisc(x, y, z, player);
                }
            }
        }
    }

    /**
     * 静的ディスクを配置（物理演算なし）
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} z - Z座標
     * @param {number} player - プレイヤー番号
     * @private
     */
    _placeStaticDisc(x, y, z, player) {
        const radius = 0.5;
        const discGeometry = new THREE.CylinderGeometry(radius, radius, 0.2, 32);
        const discMaterial = new THREE.MeshStandardMaterial({
            color: player === GAME_CONFIG.PLAYER1 ? 0x3B82F6 : 0xEF4444,
            roughness: 0.4,
            metalness: 0.6
        });
        const discMesh = new THREE.Mesh(discGeometry, discMaterial);
        discMesh.position.set(x, y, z);
        discMesh.rotation.x = Math.PI / 2;
        discMesh.castShadow = true;
        discMesh.receiveShadow = true;

        this.scene.add(discMesh);
        this.discMeshes.push(discMesh);
    }

    /**
     * 勝利ラインをハイライト
     * @param {Array} cells - [[row, col], ...]
     */
    highlightWinningCells(cells) {
        // TODO: 勝利ラインのエフェクトを追加
        // 例: 該当するディスクを光らせる、パーティクルエフェクトなど
    }

    /**
     * アニメーションループ
     * @private
     */
    _animate() {
        this.animationId = requestAnimationFrame(() => this._animate());

        const deltaTime = this.clock.getDelta();

        // 物理シミュレーション更新
        physicsWorld.step(deltaTime);

        // 物理ボディとメッシュを同期
        physicsWorld.discs.forEach((body, index) => {
            if (this.discMeshes[index]) {
                this.discMeshes[index].position.copy(body.position);
                this.discMeshes[index].quaternion.copy(body.quaternion);
            }
        });

        this.renderer.render(this.scene, this.camera);
    }

    /**
     * ウィンドウリサイズ処理
     * @private
     */
    _onWindowResize() {
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.aspect = aspect;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    /**
     * 破棄
     */
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        this.clearBoard();

        if (this.boardMesh) {
            this.scene.remove(this.boardMesh);
            this.boardMesh.geometry.dispose();
            this.boardMesh.material.dispose();
        }

        if (this.renderer) {
            this.renderer.dispose();
            this.container.removeChild(this.renderer.domElement);
        }
    }
}
