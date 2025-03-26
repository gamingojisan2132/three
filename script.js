// ゲームの状態を管理する変数
let board = [];
let selectedTile = null;
let score = 0;
let gameRunning = false;
let timeLeft = 60;
let timerInterval = null;
let soundInitialized = false;
let lastMessageTime = 0;

// 定数
const BOARD_SIZE = 8;
const TILE_TYPES = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
const SPECIAL_TILE_CHANCE = 0.05;
const MATCH_SCORE = 10;
const SPECIAL_MATCH_SCORE = 50;

// DOM要素
const boardElement = document.getElementById('board');
const scoreElement = document.getElementById('score');
const timerElement = document.getElementById('timer');
const startButton = document.getElementById('start-button');
const characterElement = document.getElementById('character');
const speechBubble = document.querySelector('.speech-bubble');
const speechText = document.getElementById('speech-text');
const soundIndicator = document.getElementById('sound-indicator');

// 効果音
const selectSound = document.getElementById('select-sound');
const matchSound = document.getElementById('match-sound');
const gameoverSound = document.getElementById('gameover-sound');
const bgm = document.getElementById('bgm');

// ゲームの初期化
function initializeGame() {
    // 効果音の初期化
    initializeSound();
    
    // ゲームボードの初期化
    initializeBoard();
    
    // スコアのリセット
    score = 0;
    scoreElement.textContent = score;
    
    // タイマーのリセット
    timeLeft = 60;
    timerElement.textContent = timeLeft;
    
    // ゲーム開始
    gameRunning = true;
    
    // タイマーの開始
    startTimer();
    
    // BGMの再生
    playSound('bgm');
    
    // スタートボタンを非表示
    startButton.style.display = 'none';
    
    // キャラクターのセリフを表示
    showCharacterMessage('がんばって！');
}

// 効果音の初期化
function initializeSound() {
    try {
        // 効果音の読み込み確認
        Promise.all([
            selectSound.play().then(() => selectSound.pause()).catch(e => console.error("効果音の読み込みエラー:", e)),
            matchSound.play().then(() => matchSound.pause()).catch(e => console.error("効果音の読み込みエラー:", e)),
            gameoverSound.play().then(() => gameoverSound.pause()).catch(e => console.error("効果音の読み込みエラー:", e)),
            bgm.play().then(() => bgm.pause()).catch(e => console.error("BGM読み込みエラー:", e))
        ]).then(() => {
            soundInitialized = true;
            soundIndicator.textContent = 'OK';
        }).catch(error => {
            console.error("効果音の初期化エラー:", error);
            soundIndicator.textContent = 'エラー';
        });
    } catch (error) {
        console.error("効果音の初期化中に予期せぬエラー:", error);
        soundIndicator.textContent = 'エラー';
    }
}

// ゲームボードの初期化
function initializeBoard() {
    boardElement.innerHTML = '';
    board = [];
    
    // ゲームボードの状態を初期化
    for (let row = 0; row < BOARD_SIZE; row++) {
        board[row] = [];
        for (let col = 0; col < BOARD_SIZE; col++) {
            board[row][col] = null;
        }
    }
    
    // タイルのサイズを計算（ボードの幅から正確に計算）
    const tileSize = Math.floor(boardElement.clientWidth / BOARD_SIZE);
    
    // ゲームボードを作成
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            // ランダムな色のタイルを生成
            const tileType = getRandomTileType();
            
            // タイル要素を作成
            const tile = document.createElement('div');
            tile.id = `tile-${row}-${col}`;
            tile.className = `tile ${tileType}`;
            tile.dataset.row = row;
            tile.dataset.col = col;
            
            // タイルのサイズを設定（正方形に固定）
            tile.style.width = `${tileSize}px`;
            tile.style.height = `${tileSize}px`;
            
            // タイルのクリックイベントを設定
            tile.addEventListener('click', () => handleTileClick(row, col));
            
            // ゲームボードにタイルを追加
            boardElement.appendChild(tile);
            
            // ゲームボードの状態を更新
            board[row][col] = tileType;
        }
    }
    
    // 初期状態でマッチするタイルがあれば処理
    setTimeout(() => {
        checkAndRemoveMatches();
    }, 500);
}

// タイルをクリックした時の処理
function handleTileClick(row, col) {
    if (!gameRunning) return;
    
    // 効果音を再生
    playSound('select');
    
    // タイル要素を取得
    const tile = getTileElement(row, col);
    
    if (!selectedTile) {
        // 1つ目のタイルを選択
        selectedTile = { row, col };
        tile.classList.add('selected');
    } else {
        // 2つ目のタイルを選択
        const selectedTileElement = getTileElement(selectedTile.row, selectedTile.col);
        selectedTileElement.classList.remove('selected');
        
        // 同じタイルをクリックした場合は選択解除
        if (selectedTile.row === row && selectedTile.col === col) {
            selectedTile = null;
            return;
        }
        
        // タイルを交換
        swapTiles(selectedTile, { row, col });
        
        // 選択をリセット
        selectedTile = null;
    }
}

// タイル要素を取得
function getTileElement(row, col) {
    return document.getElementById(`tile-${row}-${col}`);
}

// タイルが隣接しているかチェック
function isAdjacent(tile1, tile2) {
    const rowDiff = Math.abs(tile1.row - tile2.row);
    const colDiff = Math.abs(tile1.col - tile2.col);
    
    // 上下左右に隣接している場合
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

// タイルの交換
function swapTiles(tile1, tile2) {
    if (!isAdjacent(tile1, tile2)) {
        console.log('隣接していないタイルは交換できません');
        return false;
    }
    
    // 効果音を再生
    playSound('select');
    
    // タイル要素を取得
    const element1 = getTileElement(tile1.row, tile1.col);
    const element2 = getTileElement(tile2.row, tile2.col);
    
    if (!element1 || !element2) {
        console.error('タイル要素が見つかりません');
        return false;
    }
    
    // ゲームボードの状態を更新
    const temp = board[tile1.row][tile1.col];
    board[tile1.row][tile1.col] = board[tile2.row][tile2.col];
    board[tile2.row][tile2.col] = temp;
    
    // アニメーションでタイルを交換
    const rect1 = element1.getBoundingClientRect();
    const rect2 = element2.getBoundingClientRect();
    
    const deltaX = rect2.left - rect1.left;
    const deltaY = rect2.top - rect1.top;
    
    // タイル1のアニメーション
    element1.style.transition = 'transform 0.3s ease-out';
    element1.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    
    // タイル2のアニメーション
    element2.style.transition = 'transform 0.3s ease-out';
    element2.style.transform = `translate(${-deltaX}px, ${-deltaY}px)`;
    
    // アニメーション完了後の処理
    setTimeout(() => {
        // ボードの表示を更新
        updateBoardVisual();
        
        // マッチングをチェック
        const hasMatches = checkAndRemoveMatches();
        
        // マッチがなければ元に戻す
        if (!hasMatches) {
            console.log('マッチなし、元に戻します');
            
            // ゲームボードの状態を元に戻す
            const temp = board[tile1.row][tile1.col];
            board[tile1.row][tile1.col] = board[tile2.row][tile2.col];
            board[tile2.row][tile2.col] = temp;
            
            // ボードの表示を更新
            updateBoardVisual();
        }
        
        return hasMatches;
    }, 300);
    
    return true;
}

// ボードを更新
function updateBoardVisual() {
    boardElement.innerHTML = '';
    
    // タイルのサイズを計算（ボードの幅から正確に計算）
    const tileSize = Math.floor(boardElement.clientWidth / BOARD_SIZE);
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const tileType = board[row][col];
            if (tileType) {
                // タイル要素を作成
                const tile = document.createElement('div');
                tile.id = `tile-${row}-${col}`;
                
                // スペシャルタイルの判定
                if (tileType.includes('special')) {
                    const baseType = tileType.replace('special', '').trim();
                    tile.className = `tile ${baseType} special`;
                } else {
                    tile.className = `tile ${tileType}`;
                }
                
                tile.dataset.row = row;
                tile.dataset.col = col;
                
                // タイルのサイズを設定（正方形に固定）
                tile.style.width = `${tileSize}px`;
                tile.style.height = `${tileSize}px`;
                
                // タイルのクリックイベントを設定
                tile.addEventListener('click', () => handleTileClick(row, col));
                
                // ゲームボードにタイルを追加
                boardElement.appendChild(tile);
            }
        }
    }
    
    console.log("ボード更新完了");
}

// マッチングをチェックして削除する
function checkAndRemoveMatches() {
    const matchedTiles = checkForMatches();
    
    if (Object.keys(matchedTiles).length === 0) {
        return false; // マッチなし
    }
    
    // マッチしたタイルを処理
    handleMatchedTiles(matchedTiles);
    
    // タイルを落下させる
    setTimeout(() => {
        dropTiles();
        
        // 空いたスペースを埋める
        setTimeout(() => {
            fillEmptySpaces();
            
            // 新しいマッチングをチェック
            setTimeout(() => {
                checkAndRemoveMatches();
            }, 500);
        }, 300);
    }, 500);
    
    return true; // マッチあり
}

// マッチングをチェック
function checkForMatches() {
    const matchedTiles = {};
    let hasSpecialTile = false;
    let specialTileColor = '';
    
    // 横方向のマッチングをチェック
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE - 2; col++) {
            const tileType = board[row][col];
            if (!tileType) continue;
            
            const baseType = tileType.includes('special') ? tileType.replace('special', '').trim() : tileType;
            
            if (
                board[row][col + 1] && 
                board[row][col + 2] && 
                (board[row][col + 1].includes(baseType) || board[row][col + 1] === baseType) && 
                (board[row][col + 2].includes(baseType) || board[row][col + 2] === baseType)
            ) {
                // スペシャルタイルが含まれているかチェック
                if (tileType.includes('special')) {
                    hasSpecialTile = true;
                    specialTileColor = baseType;
                }
                if (board[row][col + 1].includes('special')) {
                    hasSpecialTile = true;
                    specialTileColor = baseType;
                }
                if (board[row][col + 2].includes('special')) {
                    hasSpecialTile = true;
                    specialTileColor = baseType;
                }
                
                // マッチしたタイルを記録
                matchedTiles[`${row},${col}`] = true;
                matchedTiles[`${row},${col + 1}`] = true;
                matchedTiles[`${row},${col + 2}`] = true;
                
                // 3つ以上連続しているかチェック
                let nextCol = col + 3;
                while (
                    nextCol < BOARD_SIZE && 
                    board[row][nextCol] && 
                    (board[row][nextCol].includes(baseType) || board[row][nextCol] === baseType)
                ) {
                    if (board[row][nextCol].includes('special')) {
                        hasSpecialTile = true;
                        specialTileColor = baseType;
                    }
                    matchedTiles[`${row},${nextCol}`] = true;
                    nextCol++;
                }
            }
        }
    }
    
    // 縦方向のマッチングをチェック
    for (let col = 0; col < BOARD_SIZE; col++) {
        for (let row = 0; row < BOARD_SIZE - 2; row++) {
            const tileType = board[row][col];
            if (!tileType) continue;
            
            const baseType = tileType.includes('special') ? tileType.replace('special', '').trim() : tileType;
            
            if (
                board[row + 1][col] && 
                board[row + 2][col] && 
                (board[row + 1][col].includes(baseType) || board[row + 1][col] === baseType) && 
                (board[row + 2][col].includes(baseType) || board[row + 2][col] === baseType)
            ) {
                // スペシャルタイルが含まれているかチェック
                if (tileType.includes('special')) {
                    hasSpecialTile = true;
                    specialTileColor = baseType;
                }
                if (board[row + 1][col].includes('special')) {
                    hasSpecialTile = true;
                    specialTileColor = baseType;
                }
                if (board[row + 2][col].includes('special')) {
                    hasSpecialTile = true;
                    specialTileColor = baseType;
                }
                
                // マッチしたタイルを記録
                matchedTiles[`${row},${col}`] = true;
                matchedTiles[`${row + 1},${col}`] = true;
                matchedTiles[`${row + 2},${col}`] = true;
                
                // 3つ以上連続しているかチェック
                let nextRow = row + 3;
                while (
                    nextRow < BOARD_SIZE && 
                    board[nextRow][col] && 
                    (board[nextRow][col].includes(baseType) || board[nextRow][col] === baseType)
                ) {
                    if (board[nextRow][col].includes('special')) {
                        hasSpecialTile = true;
                        specialTileColor = baseType;
                    }
                    matchedTiles[`${nextRow},${col}`] = true;
                    nextRow++;
                }
            }
        }
    }
    
    // スペシャルタイルが含まれている場合、同じ色のタイルをすべて消す
    if (hasSpecialTile && specialTileColor) {
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const tileType = board[row][col];
                if (tileType && (tileType === specialTileColor || tileType.includes(specialTileColor))) {
                    matchedTiles[`${row},${col}`] = true;
                }
            }
        }
    }
    
    return matchedTiles;
}

// マッチしたタイルを処理
function handleMatchedTiles(matchedTiles) {
    // 効果音を再生
    playSound('match');
    
    // マッチしたタイルを消去
    for (const key in matchedTiles) {
        const [row, col] = key.split(',').map(Number);
        
        // スコアを加算
        if (board[row][col].includes('special')) {
            score += SPECIAL_MATCH_SCORE;
        } else {
            score += MATCH_SCORE;
        }
        
        // タイルを消去
        board[row][col] = null;
        
        // タイル要素を取得
        const tile = getTileElement(row, col);
        if (tile) {
            // 消去アニメーション
            tile.style.transition = 'transform 0.3s, opacity 0.3s';
            tile.style.transform = 'scale(0.1)';
            tile.style.opacity = '0';
        }
    }
    
    // スコア表示を更新
    scoreElement.textContent = score;
    
    // キャラクターのセリフをランダムに表示
    const messages = ['やったね！', 'すごい！', 'その調子！', 'いいぞ！'];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    showCharacterMessage(randomMessage);
}

// タイルを落下させる
function dropTiles() {
    for (let col = 0; col < BOARD_SIZE; col++) {
        // 下から上に向かってチェック
        for (let row = BOARD_SIZE - 1; row > 0; row--) {
            if (board[row][col] === null) {
                // 上のタイルを探す
                for (let aboveRow = row - 1; aboveRow >= 0; aboveRow--) {
                    if (board[aboveRow][col] !== null) {
                        // 上のタイルを現在の位置に移動
                        board[row][col] = board[aboveRow][col];
                        board[aboveRow][col] = null;
                        break;
                    }
                }
            }
        }
    }
    
    // ボードの表示を更新
    updateBoardVisual();
}

// 空いたスペースを埋める
function fillEmptySpaces() {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === null) {
                // ランダムな色のタイルを生成
                board[row][col] = getRandomTileType();
            }
        }
    }
    
    // ボードの表示を更新
    updateBoardVisual();
}

// ランダムなタイルタイプを取得
function getRandomTileType() {
    // ランダムな色を選択
    const randomType = TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)];
    
    // 一定確率でスペシャルタイルを生成
    if (Math.random() < SPECIAL_TILE_CHANCE) {
        return `special ${randomType}`;
    }
    
    return randomType;
}

// タイマーの開始
function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        timerElement.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

// ゲーム終了
function endGame() {
    // タイマーを停止
    clearInterval(timerInterval);
    
    // ゲーム状態を更新
    gameRunning = false;
    
    // BGMを停止
    if (bgm.paused === false) {
        bgm.pause();
        bgm.currentTime = 0;
    }
    
    // 効果音を再生
    playSound('gameover');
    
    // スタートボタンを表示
    startButton.style.display = 'block';
    startButton.textContent = 'もう一度プレイ';
    
    // キャラクターのセリフを表示
    showCharacterMessage('おつかれさま！');
}

// 効果音を再生
function playSound(soundType) {
    if (!soundInitialized) return;
    
    try {
        switch (soundType) {
            case 'select':
                selectSound.currentTime = 0;
                selectSound.play();
                break;
            case 'match':
                matchSound.currentTime = 0;
                matchSound.play();
                break;
            case 'gameover':
                gameoverSound.currentTime = 0;
                gameoverSound.play();
                break;
            case 'bgm':
                bgm.currentTime = 0;
                bgm.volume = 0.5;
                bgm.play();
                break;
        }
    } catch (e) {
        console.error(`効果音 ${soundType} の再生中にエラーが発生しました:`, e);
    }
}

// キャラクターのセリフを表示
function showCharacterMessage(message) {
    // 前回のメッセージから一定時間経過していない場合は表示しない
    const now = Date.now();
    if (now - lastMessageTime < 2000) return;
    
    lastMessageTime = now;
    
    // セリフを設定
    speechText.textContent = message;
    
    // 吹き出しを表示
    speechBubble.style.opacity = '1';
    
    // 一定時間後に非表示
    setTimeout(() => {
        speechBubble.style.opacity = '0';
    }, 3000);
}

// イベントリスナー
startButton.addEventListener('click', initializeGame);

// ページ読み込み時の処理
window.addEventListener('load', () => {
    // 効果音の初期化
    initializeSound();
    
    // ゲームボードの初期化（ゲーム開始前の表示用）
    initializeBoard();
});
