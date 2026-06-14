if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
    else if (typeof r === 'object') r = { tl: r[0]||0, tr: r[1]||r[0]||0, br: r[2]||r[0]||0, bl: r[3]||r[1]||r[0]||0 };
    else r = { tl: 0, tr: 0, br: 0, bl: 0 };
    this.moveTo(x + r.tl, y);
    this.lineTo(x + w - r.tr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r.tr);
    this.lineTo(x + w, y + h - r.br);
    this.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
    this.lineTo(x + r.bl, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r.bl);
    this.lineTo(x, y + r.tl);
    this.quadraticCurveTo(x, y, x + r.tl, y);
    this.closePath();
    return this;
  };
}

var canvas, ctx;
var grid;
var currentLevel = 1;
var currentScore = 0;
var highScore = 0;
var currentLives = 3;
var timeLeft = 90;
var gameStartTime;
var gameInterval;
var isGamePaused = false;
var isGameOver = false;
var gameOverReason = '';
var isLevelUpPaused = false;
var levelUpBonusTime = 0;

var items = {
  timeExtend: 0,
  lifeRestore: 0
};

var tgUser = null;
var isLoggedIn = false;
var API_BASE = '';
var gameOverCount = 0;

var config = {
  gridWidth: 9,
  gridHeight: 12,
  cellSize: 40,
  initialLives: 3,
  minBlocksToEliminate: 3,
  colors: [
    '#FF3B30', '#FF9500', '#FFCC00', '#4CD964',
    '#34C7D9', '#007AFF', '#AF52DE', '#FF2D55', '#8E8E93'
  ],
  levels: [
    { range: [1, 5], colors: [0, 2, 3, 5] },
    { range: [6, 10], colors: [0, 1, 2, 3, 5] },
    { range: [11, 15], colors: [0, 1, 2, 3, 4, 5] },
    { range: [16, 20], colors: [0, 1, 2, 3, 4, 5, 6] },
    { range: [21, 25], colors: [0, 1, 2, 3, 4, 5, 6, 7] },
    { range: [26, 30], colors: [0, 1, 2, 3, 4, 5, 6, 7, 8] }
  ]
};

var levelTargets = [
  500, 1000, 1500, 2000, 2500,
  3000, 3500, 4000, 4500, 5000,
  5500, 6000, 6500, 7000, 7500,
  8000, 8500, 9000, 9500, 10000,
  11000, 12000, 13000, 14000, 15000,
  16000, 17000, 18000, 19000, 20000
];

var isReviving = false;

var sfxClick = null;
var sfxEliminate = null;
var sfxLevelUp = null;
var sfxError = null;
var soundMuted = false;

function initTelegramUser() {
  try {
    if (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user) {
      tgUser = Telegram.WebApp.initDataUnsafe.user;
      isLoggedIn = true;
    }
  } catch (e) {
    isLoggedIn = false;
  }
  if (!tgUser) {
    var urlParams = new URLSearchParams(window.location.search);
    var uid = urlParams.get('user_id');
    if (uid) {
      tgUser = { id: parseInt(uid) };
      isLoggedIn = true;
    }
  }
}

function getApiBase() {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  return 'https://' + window.location.hostname;
}

function generateSfxWav(freqs, duration) {
  var sampleRate = 8000;
  var numSamples = Math.floor(sampleRate * duration);
  var dataSize = numSamples * 2;
  var buffer = new ArrayBuffer(44 + dataSize);
  var view = new DataView(buffer);
  function writeStr(offset, str) { for (var i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); }
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);
  var freqArr = typeof freqs === 'number' ? [freqs] : freqs;
  for (var i = 0; i < numSamples; i++) {
    var t = i / sampleRate;
    var envelope = Math.pow(1 - (i / numSamples), 1.5);
    var val = 0;
    for (var f = 0; f < freqArr.length; f++) {
      val += Math.sin(2 * Math.PI * freqArr[f] * t) * (1 / freqArr.length);
    }
    val *= envelope * 0.5;
    view.setInt16(44 + i * 2, val * 32767, true);
  }
  var binary = '';
  var bytes = new Uint8Array(buffer);
  for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return 'data:audio/wav;base64,' + btoa(binary);
}

function generateBgMusicWav() {
  var sampleRate = 8000;
  var duration = 16;
  var numSamples = Math.floor(sampleRate * duration);
  var dataSize = numSamples * 2;
  var buffer = new ArrayBuffer(44 + dataSize);
  var view = new DataView(buffer);
  function writeStr(offset, str) { for (var i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); }
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);
  var notes = [261.63, 293.66, 329.63, 349.23, 392.00, 349.23, 329.63, 293.66,
               329.63, 349.23, 392.00, 440.00, 392.00, 349.23, 329.63, 293.66];
  var noteLen = numSamples / notes.length;
  for (var i = 0; i < numSamples; i++) {
    var noteIdx = Math.floor(i / noteLen) % notes.length;
    var freq = notes[noteIdx];
    var t = i / sampleRate;
    var noteT = (i % noteLen) / noteLen;
    var envelope = noteT < 0.05 ? noteT * 20 : Math.pow(1 - noteT, 2);
    if (envelope > 1) envelope = 1;
    if (envelope < 0) envelope = 0;
    var val = Math.sin(2 * Math.PI * freq * t) * envelope * 0.08;
    val += Math.sin(2 * Math.PI * freq * 2 * t) * envelope * 0.02;
    view.setInt16(44 + i * 2, val * 32767, true);
  }
  var binary = '';
  var bytes = new Uint8Array(buffer);
  for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return 'data:audio/wav;base64,' + btoa(binary);
}

function setupRealAudio() {
  try {
    sfxClick = new Audio(generateSfxWav([600, 900, 1200], 0.12));
    sfxClick.volume = 0.35;
    sfxEliminate = new Audio(generateSfxWav([800, 1000, 1200, 1500], 0.25));
    sfxEliminate.volume = 0.45;
    sfxLevelUp = new Audio(generateSfxWav([523, 659, 784], 0.4));
    sfxLevelUp.volume = 0.5;
    sfxError = new Audio(generateSfxWav([200, 150], 0.18));
    sfxError.volume = 0.3;
  } catch (e) {}
}

function playSfx(sfx) {
  if (!sfx || soundMuted) return;
  try { sfx.currentTime = 0; sfx.play(); } catch (e) {}
}

function toggleSound() {
  soundMuted = !soundMuted;
  var btn = document.getElementById('sound-toggle');
  if (btn) btn.textContent = soundMuted ? '🔇' : '📢';
}

var isAnimating = false;

function showAgeRating() {
  var ageRating = document.querySelector('.age-rating-box-fixed');
  if (ageRating) ageRating.style.display = 'block';
}

function hideAgeRating() {
  var ageRating = document.querySelector('.age-rating-box-fixed');
  if (ageRating) ageRating.style.display = 'none';
}

function showAd(onReward) {
  if (isReviving) return;
  isReviving = true;
  var adHandled = false;

  if (gameInterval) {
    clearInterval(gameInterval);
    gameInterval = null;
  }
  isGamePaused = true;

  function handleReward() {
    if (adHandled) return;
    adHandled = true;
    isReviving = false;
    isGamePaused = false;
    if (!gameInterval && !isGameOver) {
      gameInterval = setInterval(gameLoop, 1000);
    }
    try {
      if (typeof onReward === 'function') onReward();
    } catch (e) {
      if (isGameOver) {
        var gameOverPage = document.getElementById('game-over-page');
        if (gameOverPage) gameOverPage.style.display = 'flex';
      }
    }
  }

  function handleCancel() {
    if (adHandled) return;
    adHandled = true;
    isReviving = false;
    isGamePaused = false;
    if (!gameInterval && !isGameOver) {
      gameInterval = setInterval(gameLoop, 1000);
    }
  }

  if (!window.adReward) {
    console.log("[AdsGram] adReward not available");
    handleCancel();
    return;
  }

  try {
    window.adReward.show().then(function(result) {
      console.log("[AdsGram] reward result:", JSON.stringify(result));
      if (result && result.done) {
        handleReward();
      } else {
        handleCancel();
      }
    }).catch(function(result) {
      console.log("[AdsGram] reward ad error:", JSON.stringify(result));
      handleCancel();
    });
  } catch (e) {
    console.log("[AdsGram] reward ad exception:", e);
    handleCancel();
  }
}

function showRewardedVideoAd(onReward) {
  showAd(onReward);
}

function watchAdForReward() {
  if (!window.adReward) {
    console.log("[AdsGram] adReward not available for reward button");
    showMessage(getText('adError'));
    return;
  }

  try {
    window.adReward.show().then(function(result) {
      console.log("[AdsGram] reward button result:", JSON.stringify(result));
      if (result && result.done) {
        addItem('timeExtend', 2);
        showMessage(getText('adRewardSuccess'));
      } else {
        showMessage(getText('adNotCompleted'));
      }
    }).catch(function(result) {
      console.log("[AdsGram] reward button error:", JSON.stringify(result));
      showMessage(getText('adError'));
    });
  } catch (e) {
    console.log("[AdsGram] reward button exception:", e);
    showMessage(getText('adError'));
  }
}

function showInterstitialAd(callback) {
  if (!window.adInterstitial) {
    console.log("[AdsGram] interstitial not available");
    if (callback) callback();
    return;
  }

  try {
    window.adInterstitial.show().then(function(result) {
      console.log("[AdsGram] interstitial result:", JSON.stringify(result));
      if (callback) callback();
    }).catch(function(result) {
      console.log("[AdsGram] interstitial error:", JSON.stringify(result));
      if (callback) callback();
    });
  } catch (e) {
    console.log("[AdsGram] interstitial exception:", e);
    if (callback) callback();
  }
}

function initGame() {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.removeEventListener('resize', resizeCanvas);
  window.addEventListener('resize', resizeCanvas);
  currentScore = 0;
  currentLives = config.initialLives;
  timeLeft = 90;
  gameStartTime = Date.now();
  isGamePaused = false;
  isGameOver = false;
  isLevelUpPaused = false;
  levelUpBonusTime = 0;
  isReviving = false;
  isAnimating = false;
  gameOverReason = '';
  highScore = getHighScore();
  grid = initGrid();
  updateUI();
  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, 1000);
  canvas.removeEventListener('click', handleCanvasClick);
  canvas.addEventListener('click', handleCanvasClick);
  drawGame();
}

function resizeCanvas() {
  if (!canvas) return;
  var maxWidth = window.innerWidth * 0.92;
  var maxHeight = window.innerHeight * 0.55;
  var cellWidth = maxWidth / config.gridWidth;
  var cellHeight = maxHeight / config.gridHeight;
  config.cellSize = Math.floor(Math.min(cellWidth, cellHeight));
  canvas.width = config.cellSize * config.gridWidth;
  canvas.height = config.cellSize * config.gridHeight;
  drawGame();
}

function initGrid() {
  var availableColors = getAvailableColors(currentLevel);
  var g = [];
  for (var y = 0; y < config.gridHeight; y++) {
    var row = [];
    for (var x = 0; x < config.gridWidth; x++) {
      var colorIndex = Math.floor(Math.random() * availableColors.length);
      row.push({ color: availableColors[colorIndex], x: x, y: y, displayOffsetY: 0 });
    }
    g.push(row);
  }
  return g;
}

function getAvailableColors(level) {
  for (var i = 0; i < config.levels.length; i++) {
    var lc = config.levels[i];
    if (level >= lc.range[0] && level <= lc.range[1]) {
      return lc.colors.map(function(index) { return config.colors[index]; });
    }
  }
  return config.colors;
}

function getAvailableColorIndices(level) {
  for (var i = 0; i < config.levels.length; i++) {
    var lc = config.levels[i];
    if (level >= lc.range[0] && level <= lc.range[1]) {
      return lc.colors;
    }
  }
  return config.colors.map(function(c, i) { return i; });
}

function gameLoop() {
  if (isGamePaused || isGameOver || isLevelUpPaused) return;
  timeLeft = Math.max(0, 90 + levelUpBonusTime - Math.floor((Date.now() - gameStartTime) / 1000));
  if (timeLeft <= 0) { gameOverReason = 'time'; gameOver(); return; }
  if (currentLives <= 0) { gameOverReason = 'lives'; gameOver(); return; }
  if (currentScore >= levelTargets[currentLevel - 1]) { levelUp(); }
  updateUI();
  drawGame();
}

function showLevelUpAnimation(text) {
  isLevelUpPaused = true;
  playSfx(sfxLevelUp);
  var overlay = document.getElementById('level-up-overlay');
  var textEl = document.getElementById('level-up-text');
  if (!overlay || !textEl) return;
  textEl.textContent = text;
  textEl.style.animation = 'none';
  void textEl.offsetWidth;
  textEl.style.animation = 'levelUpRise 2.5s ease-out forwards, gradientShift 0.5s ease infinite';
  overlay.style.display = 'flex';
  setTimeout(function() { overlay.style.display = 'none'; isLevelUpPaused = false; }, 2500);
}

function levelUp() {
  if (currentLevel < 30) {
    currentLevel++;
    levelUpBonusTime += 5;
    timeLeft = 90 + levelUpBonusTime;
    gameStartTime = Date.now();
    grid = initGrid();
    showLevelUpAnimation('UP!');
  } else {
    showLevelUpAnimation('Win!');
    gameOverReason = 'won';
    setTimeout(function() { gameOver(true); }, 2500);
  }
}

function handleCanvasClick(e) {
  if (isGamePaused || isGameOver || isLevelUpPaused || isAnimating) return;
  var rect = canvas.getBoundingClientRect();
  var x = Math.floor((e.clientX - rect.left) / config.cellSize);
  var y = Math.floor((e.clientY - rect.top) / config.cellSize);
  if (x >= 0 && x < config.gridWidth && y >= 0 && y < config.gridHeight) {
    handleBlockClick(x, y);
  }
}

function handleBlockClick(x, y) {
  playSfx(sfxClick);
  var block = grid[y][x];
  if (!block || !block.color) return;
  var connectedBlocks = findConnectedBlocks(x, y, block.color);
  if (connectedBlocks.length >= config.minBlocksToEliminate) {
    currentScore += connectedBlocks.length * 10;
    playSfx(sfxEliminate);
    startEliminateAnimation(connectedBlocks);
  } else {
    currentLives--;
    playSfx(sfxError);
    updateUI();
    if (currentLives <= 0) { gameOverReason = 'lives'; gameOver(); }
  }
}

function startEliminateAnimation(blocks) {
  isAnimating = true;
  // 移除粒子爆炸效果，只保留方块消除
  for (var i = 0; i < blocks.length; i++) {
    var bx = blocks[i].x;
    var by = blocks[i].y;
    if (grid[by][bx]) {
      grid[by][bx].color = null;
      grid[by][bx].dropDistance = 0;
      grid[by][bx].displayOffsetY = 0;
    }
  }

  // 简单的动画，没有粒子
  dropBlocks();
  generateNewBlocks();

  var maxDrop = 0;
  for (var x = 0; x < config.gridWidth; x++) {
    for (var y = 0; y < config.gridHeight; y++) {
      if (grid[y][x] && grid[y][x].dropDistance && grid[y][x].dropDistance > maxDrop) {
        maxDrop = grid[y][x].dropDistance;
      }
    }
  }
  if (maxDrop > 0) {
    for (var x = 0; x < config.gridWidth; x++) {
      for (var y = 0; y < config.gridHeight; y++) {
        if (grid[y][x] && grid[y][x].dropDistance) {
          grid[y][x].displayOffsetY = -grid[y][x].dropDistance * config.cellSize;
          grid[y][x].dropDistance = 0;
        }
      }
    }
  }

  // 简单的下落动画
  var animStart = Date.now();
  var dropDuration = 150;

  function animateDrop() {
    var elapsed = Date.now() - animStart;
    var dropProgress = Math.min(1, elapsed / dropDuration);

    if (dropProgress < 1) {
      var dropEased = 1 - Math.pow(1 - dropProgress, 2);
      for (var y = 0; y < config.gridHeight; y++) {
        for (var x = 0; x < config.gridWidth; x++) {
          if (grid[y][x] && grid[y][x].displayOffsetY !== 0) {
            grid[y][x].displayOffsetY = grid[y][x].displayOffsetY * (1 - dropEased);
            if (Math.abs(grid[y][x].displayOffsetY) < 0.5) grid[y][x].displayOffsetY = 0;
          }
        }
      }
      drawGame();
      requestAnimationFrame(animateDrop);
    } else {
      isAnimating = false;
      drawGame();
      updateUI();
    }
  }
  animateDrop();
}



function findConnectedBlocks(startX, startY, color) {
  var connected = [];
  var visited = [];
  for (var y = 0; y < config.gridHeight; y++) {
    visited[y] = [];
    for (var x = 0; x < config.gridWidth; x++) visited[y][x] = false;
  }
  function dfs(cx, cy) {
    if (cx < 0 || cx >= config.gridWidth || cy < 0 || cy >= config.gridHeight) return;
    if (visited[cy][cx]) return;
    if (!grid[cy][cx] || !grid[cy][cx].color) return;
    if (grid[cy][cx].color !== color) return;
    visited[cy][cx] = true;
    connected.push({ x: cx, y: cy });
    dfs(cx + 1, cy); dfs(cx - 1, cy); dfs(cx, cy + 1); dfs(cx, cy - 1);
  }
  dfs(startX, startY);
  return connected;
}

function eliminateBlocks(blocks) {
  for (var i = 0; i < blocks.length; i++) {
    grid[blocks[i].y][blocks[i].x].color = null;
  }
}

function dropBlocks() {
  for (var x = 0; x < config.gridWidth; x++) {
    var emptyRow = config.gridHeight - 1;
    for (var y = config.gridHeight - 1; y >= 0; y--) {
      if (grid[y][x] && grid[y][x].color) {
        if (y !== emptyRow) {
          if (!grid[emptyRow][x]) {
            grid[emptyRow][x] = { color: null, displayOffsetY: 0, dropDistance: 0 };
          }
          grid[emptyRow][x].color = grid[y][x].color;
          grid[emptyRow][x].dropDistance = emptyRow - y;
          grid[y][x].color = null;
          grid[y][x].dropDistance = 0;
        } else {
          grid[y][x].dropDistance = 0;
        }
        emptyRow--;
      }
    }
  }
}

function generateNewBlocks() {
  var availableColors = getAvailableColors(currentLevel);
  for (var x = 0; x < config.gridWidth; x++) {
    for (var y = 0; y < config.gridHeight; y++) {
      if (!grid[y][x]) {
        grid[y][x] = { color: null, displayOffsetY: 0, dropDistance: 0 };
      }
      if (!grid[y][x].color) {
        var idx = Math.floor(Math.random() * availableColors.length);
        grid[y][x].color = availableColors[idx];
        grid[y][x].displayOffsetY = 0;
        grid[y][x].dropDistance = 0;
      }
    }
  }
}

function drawGame() {
  if (!canvas || !ctx || !grid) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (var y = 0; y < config.gridHeight; y++) {
    for (var x = 0; x < config.gridWidth; x++) {
      var block = grid[y][x];
      if (block && block.color) {
        var px = x * config.cellSize;
        var py = y * config.cellSize + (block.displayOffsetY || 0);
        var size = config.cellSize - 3;
        var offset = 1.5;
        ctx.save();
        ctx.shadowColor = block.color;
        ctx.shadowBlur = 6;
        ctx.fillStyle = block.color;
        ctx.beginPath();
        ctx.roundRect(px + offset, py + offset, size, size, 4);
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = '#ffffff33';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(px + offset, py + offset, size, size, 4);
        ctx.stroke();
      }
    }
  }
}

function updateGameUI() {
  var el;
  el = document.getElementById('current-level'); if (el) el.textContent = currentLevel;
  el = document.getElementById('current-score'); if (el) el.textContent = currentScore;
  el = document.getElementById('high-score'); if (el) el.textContent = highScore;
  el = document.getElementById('lives'); if (el) el.textContent = currentLives;
  el = document.getElementById('time'); if (el) el.textContent = timeLeft;
  el = document.getElementById('target-score'); if (el) el.textContent = levelTargets[currentLevel - 1];
  if (typeof updateLangUI === 'function') updateLangUI();
}

function updateUI() { updateGameUI(); }

function reportScoreToServer(score, level) {
  if (!isLoggedIn || !tgUser) return;
  var data = {
    user_id: tgUser.id,
    game: 'particle',
    score: score,
    level: level
  };
  try {
    fetch(API_BASE + '/api/setScore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(function() {});
  } catch (e) {}
}

function gameOver(isWon) {
  isGameOver = true;
  isLevelUpPaused = false;
  isAnimating = false;
  if (gameInterval) clearInterval(gameInterval);
  gameOverCount++;
  var isNewHighScore = saveScore(currentScore);
  if (isNewHighScore) { highScore = currentScore; showMessage('newHighScore'); }

  reportScoreToServer(currentScore, currentLevel);

  var titleEl = document.getElementById('game-over-title');
  if (titleEl) {
    if (isWon) {
      titleEl.textContent = getText('gameWon');
      titleEl.className = 'cyber-title';
      titleEl.style.color = '#39ff14';
      titleEl.style.textShadow = '0 0 10px #39ff14, 0 0 30px #39ff14';
    } else if (gameOverReason === 'time') {
      titleEl.textContent = getText('timeUp');
      titleEl.className = 'cyber-title';
      titleEl.style.color = '#ffe600';
      titleEl.style.textShadow = '0 0 10px #ffe600, 0 0 30px #ffe600';
    } else if (gameOverReason === 'lives') {
      titleEl.textContent = getText('outOfLives');
      titleEl.className = 'cyber-title';
      titleEl.style.color = '#ff00e5';
      titleEl.style.textShadow = '0 0 10px #ff00e5, 0 0 30px #ff00e5';
    } else {
      titleEl.textContent = getText('gameOver');
      titleEl.className = 'cyber-title';
      titleEl.style.color = '#ff00e5';
      titleEl.style.textShadow = '0 0 10px #ff00e5, 0 0 30px #ff00e5';
    }
  }
  var reviveSection = document.getElementById('revive-section');
  if (reviveSection) {
    if (isWon) { reviveSection.style.display = 'none'; }
    else {
      reviveSection.style.display = 'flex';
      reviveSection.style.flexDirection = 'column';
      reviveSection.style.alignItems = 'center';
      var reviveTimeBtn = document.getElementById('revive-time');
      var reviveLifeBtn = document.getElementById('revive-life');
      var reviveTimeStarsBtn = document.getElementById('revive-time-stars');
      var reviveLifeStarsBtn = document.getElementById('revive-life-stars');
      if (reviveTimeBtn) reviveTimeBtn.style.display = gameOverReason === 'time' ? 'block' : 'none';
      if (reviveLifeBtn) reviveLifeBtn.style.display = gameOverReason === 'lives' ? 'block' : 'none';
      if (reviveTimeStarsBtn) reviveTimeStarsBtn.style.display = gameOverReason === 'time' ? 'block' : 'none';
      if (reviveLifeStarsBtn) reviveLifeStarsBtn.style.display = gameOverReason === 'lives' ? 'block' : 'none';
    }
  }
  var el;
  el = document.getElementById('final-score'); if (el) el.textContent = currentScore;
  el = document.getElementById('game-over-high-score'); if (el) el.textContent = highScore;

  var gamePage = document.getElementById('game-page');
  var gameOverPage = document.getElementById('game-over-page');
  if (gamePage) gamePage.style.display = 'none';
  if (gameOverPage) gameOverPage.style.display = 'flex';

  if (gameOverCount >= 2) {
    gameOverCount = 0;
    showInterstitialAd(function() {});
  }
}

function reviveWithTime() {
  if (isReviving) return;

  if (items.timeExtend > 0) {
    useItem('timeExtend');
    if (isGameOver) {
      gameStartTime += 30000;
      isGameOver = false;
      gameOverReason = '';
      isLevelUpPaused = false;
      isAnimating = false;
      var gameOverPage = document.getElementById('game-over-page');
      var gamePage = document.getElementById('game-page');
      if (gameOverPage) gameOverPage.style.display = 'none';
      if (gamePage) gamePage.style.display = 'flex';
      gameInterval = setInterval(gameLoop, 1000);
      updateUI();
      drawGame();
    }
    return;
  }

  showAd(function() {
    if (isGameOver) {
      gameStartTime += 30000;
      isGameOver = false;
      gameOverReason = '';
      isLevelUpPaused = false;
      isAnimating = false;
      var gameOverPage = document.getElementById('game-over-page');
      var gamePage = document.getElementById('game-page');
      if (gameOverPage) gameOverPage.style.display = 'none';
      if (gamePage) gamePage.style.display = 'flex';
      gameInterval = setInterval(gameLoop, 1000);
      updateUI();
      drawGame();
    }
  });
}

function reviveWithLife() {
  if (isReviving) return;

  if (items.lifeRestore > 0) {
    useItem('lifeRestore');
    if (isGameOver) {
      currentLives = 1;
      isGameOver = false;
      gameOverReason = '';
      isLevelUpPaused = false;
      isAnimating = false;
      var gameOverPage = document.getElementById('game-over-page');
      var gamePage = document.getElementById('game-page');
      if (gameOverPage) gameOverPage.style.display = 'none';
      if (gamePage) gamePage.style.display = 'flex';
      gameInterval = setInterval(gameLoop, 1000);
      updateUI();
      drawGame();
    }
    return;
  }

  showAd(function() {
    if (isGameOver) {
      currentLives = 1;
      isGameOver = false;
      gameOverReason = '';
      isLevelUpPaused = false;
      isAnimating = false;
      var gameOverPage = document.getElementById('game-over-page');
      var gamePage = document.getElementById('game-page');
      if (gameOverPage) gameOverPage.style.display = 'none';
      if (gamePage) gamePage.style.display = 'flex';
      gameInterval = setInterval(gameLoop, 1000);
      updateUI();
      drawGame();
    }
  });
}

function reviveTimeWithStars() {
  if (isReviving) return;
  showAd(function() {
    if (isGameOver) {
      gameStartTime += 30000;
      isGameOver = false;
      gameOverReason = '';
      isLevelUpPaused = false;
      isAnimating = false;
      var gameOverPage = document.getElementById('game-over-page');
      var gamePage = document.getElementById('game-page');
      if (gameOverPage) gameOverPage.style.display = 'none';
      if (gamePage) gamePage.style.display = 'flex';
      gameInterval = setInterval(gameLoop, 1000);
      updateUI();
      drawGame();
    }
  });
}

function reviveLifeWithStars() {
  if (isReviving) return;
  showAd(function() {
    if (isGameOver) {
      currentLives = 1;
      isGameOver = false;
      gameOverReason = '';
      isLevelUpPaused = false;
      isAnimating = false;
      var gameOverPage = document.getElementById('game-over-page');
      var gamePage = document.getElementById('game-page');
      if (gameOverPage) gameOverPage.style.display = 'none';
      if (gamePage) gamePage.style.display = 'flex';
      gameInterval = setInterval(gameLoop, 1000);
      updateUI();
      drawGame();
    }
  });
}

function saveScore(score) {
  var hs = getHighScore();
  if (score > hs) { try { localStorage.setItem('particleHighScore', score); } catch (e) {} return true; }
  return false;
}

function getHighScore() {
  try { var hs = localStorage.getItem('particleHighScore'); return hs ? parseInt(hs) : 0; } catch (e) { return 0; }
}

function saveItems() {
  try {
    localStorage.setItem('particleItems', JSON.stringify(items));
  } catch (e) {}
}

function loadItems() {
  try {
    var saved = localStorage.getItem('particleItems');
    if (saved) {
      var parsed = JSON.parse(saved);
      items.timeExtend = parsed.timeExtend || 0;
      items.lifeRestore = parsed.lifeRestore || 0;
    }
  } catch (e) {}
}

function addItem(type, count) {
  if (type === 'timeExtend') {
    items.timeExtend += count;
  } else if (type === 'lifeRestore') {
    items.lifeRestore += count;
  }
  saveItems();
  updateItemsUI();
}

function useItem(type) {
  if (type === 'timeExtend' && items.timeExtend > 0) {
    items.timeExtend--;
    saveItems();
    updateItemsUI();
    return true;
  } else if (type === 'lifeRestore' && items.lifeRestore > 0) {
    items.lifeRestore--;
    saveItems();
    updateItemsUI();
    return true;
  }
  return false;
}

function updateItemsUI() {
  var timeEl = document.getElementById('item-time-count');
  var lifeEl = document.getElementById('item-life-count');
  if (timeEl) timeEl.textContent = '(' + items.timeExtend + ')';
  if (lifeEl) lifeEl.textContent = '(' + items.lifeRestore + ')';
}

function reportLoadingProgress(progress) {
}

function checkDailyReward() {
  var today = new Date().toDateString();
  var lastRewardDate = localStorage.getItem('particleDailyReward');
  if (lastRewardDate === today) return;

  // 安全地尝试使用CloudStorage，如果失败就降级到localStorage
  function giveDailyReward() {
    localStorage.setItem('particleDailyReward', today);
    addItem('timeExtend', 1);
    addItem('lifeRestore', 1);
    showMessage('Daily reward claimed!');
  }

  try {
    if (window.Telegram && Telegram.WebApp && Telegram.WebApp.CloudStorage) {
      Telegram.WebApp.CloudStorage.getItem('particleDailyReward', function(err, date) {
        if (err || date !== today) {
          try {
            if (Telegram.WebApp.CloudStorage) {
              Telegram.WebApp.CloudStorage.setItem('particleDailyReward', today);
            }
          } catch (e) {
            console.log('CloudStorage setItem failed, using localStorage only');
          }
          giveDailyReward();
        }
      });
    } else {
      giveDailyReward();
    }
  } catch (e) {
    console.log('CloudStorage not available, using localStorage only');
    giveDailyReward();
  }
}

function showMessage(text) {
  var el = document.getElementById('message');
  if (!el) {
    el = document.createElement('div');
    el.id = 'message';
    el.className = 'message';
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.style.display = 'block';
  el.style.opacity = '1';
  setTimeout(function() {
    el.style.opacity = '0';
    setTimeout(function() { el.style.display = 'none'; }, 300);
  }, 2000);
}

document.addEventListener('DOMContentLoaded', function() {
  API_BASE = getApiBase();
  setupRealAudio();
  initLanguage();
  initTelegramUser();
  checkDailyReward();
  var loadingPage = document.getElementById('loading-page');
  var progress = document.getElementById('progress');
  var loadStartTime = Date.now();
  var MIN_LOAD_TIME = 1500;
  var MAX_LOAD_TIME = 8000;
  var progressValue = 0;
  var loadingFinished = false;
  function finishLoading() {
    if (loadingFinished) return;
    loadingFinished = true;
    clearInterval(loadingInterval);
    clearTimeout(maxLoadTimeout);
    progress.style.width = '100%';
    reportLoadingProgress(1);
    loadingPage.style.display = 'none';
    document.getElementById('home-page').style.display = 'flex';
    loadItems();
    updateItemsUI();
  }
  var loadingInterval = setInterval(function() {
    progressValue += 8;
    if (progressValue > 100) progressValue = 100;
    progress.style.width = progressValue + '%';
    reportLoadingProgress(progressValue / 100);
    var elapsed = Date.now() - loadStartTime;
    if (progressValue >= 100 && elapsed >= MIN_LOAD_TIME) finishLoading();
  }, 80);
  var maxLoadTimeout = setTimeout(function() { finishLoading(); }, MAX_LOAD_TIME);
  document.getElementById('sound-toggle').addEventListener('click', function() { playSfx(sfxClick); toggleSound(); });
  document.getElementById('start-game').addEventListener('click', function() {
    playSfx(sfxClick);
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('game-page').style.display = 'flex';
    hideAgeRating();
    initGame();
  });
  document.getElementById('settings-button').addEventListener('click', function() {
    playSfx(sfxClick);
    document.getElementById('home-page').style.display = 'none';
    document.getElementById('settings-page').style.display = 'flex';
  });
  document.getElementById('back-button').addEventListener('click', function() {
    playSfx(sfxClick);
    document.getElementById('settings-page').style.display = 'none';
    document.getElementById('home-page').style.display = 'flex';
  });
  document.getElementById('revive-time').addEventListener('click', function() { playSfx(sfxClick); reviveWithTime(); });
  document.getElementById('revive-life').addEventListener('click', function() { playSfx(sfxClick); reviveWithLife(); });

  var reviveTimeStars = document.getElementById('revive-time-stars');
  if (reviveTimeStars) reviveTimeStars.addEventListener('click', function() { playSfx(sfxClick); reviveTimeWithStars(); });

  var reviveLifeStars = document.getElementById('revive-life-stars');
  if (reviveLifeStars) reviveLifeStars.addEventListener('click', function() { playSfx(sfxClick); reviveLifeWithStars(); });

  document.getElementById('play-again').addEventListener('click', function() {
    playSfx(sfxClick);
    currentLevel = 1; levelUpBonusTime = 0;
    document.getElementById('game-over-page').style.display = 'none';
    document.getElementById('game-page').style.display = 'flex';
    hideAgeRating();
    initGame();
  });
  document.getElementById('back-to-home').addEventListener('click', function() {
    playSfx(sfxClick);
    document.getElementById('game-over-page').style.display = 'none';
    document.getElementById('home-page').style.display = 'flex';
  });

  var shortcutBtn = document.getElementById('add-shortcut');
  if (shortcutBtn) {
    shortcutBtn.addEventListener('click', function() {
      playSfx(sfxClick);
      try {
        if (window.Telegram && Telegram.WebApp && Telegram.WebApp.addToHomeScreen) {
          Telegram.WebApp.addToHomeScreen();
        } else {
          showMessage('Press menu button to add!');
        }
      } catch (e) {
        showMessage('Press menu button to add!');
      }
    });
  }

  var watchAdRewardBtn = document.getElementById('watch-ad-reward');
  if (watchAdRewardBtn) {
    watchAdRewardBtn.addEventListener('click', function() {
      playSfx(sfxClick);
      watchAdForReward();
    });
  }

  var watchAdRewardGameoverBtn = document.getElementById('watch-ad-reward-gameover');
  if (watchAdRewardGameoverBtn) {
    watchAdRewardGameoverBtn.addEventListener('click', function() {
      playSfx(sfxClick);
      watchAdForReward();
    });
  }

  // ============================================
  // AD CENTER — Full power ad system
  // ============================================
  var AD_PLACEMENTS = [
    'plc_vdc3o09u4w1f', 'plc_0a2ms00dezm3', 'plc_etiioz0nfabd',
    'plc_ct198r84dcn0', 'plc_kxmvxrphen2k', 'plc_am5j87frwb0p',
    'plc_47qy2hmc0es0', 'plc_k5p3fke3lrey', 'plc_0fuprombya1r',
    'plc_0qvpi4ymsfnv'
  ];

  var adSlotIframes = {};
  var adRefreshTimers = [];
  var rewardAdTimer = null;
  var interstitialAdTimer = null;
  var adPageActive = false;

  // Initialize ad page slots
  function initAdPage() {
    var container = document.getElementById('ad-slots-container');
    if (!container || container.children.length > 0) return;

    AD_PLACEMENTS.forEach(function(pid, i) {
      var slotWrapper = document.createElement('div');
      slotWrapper.className = 'ad-slot-wrapper';
      slotWrapper.id = 'ad-slot-' + i;

      var label = document.createElement('div');
      label.style.cssText = 'font-size:10px;color:#8888aa;text-align:center;padding:2px 0;';
      label.textContent = 'Ad #' + (i + 1) + ' — ' + pid;

      var adDiv = document.createElement('div');
      adDiv.setAttribute('data-roiify-placement', pid);
      adDiv.setAttribute('data-theme', 'dark');
      adDiv.setAttribute('data-width', 'auto');
      adDiv.setAttribute('data-radius', '8');
      adDiv.style.minHeight = '60px';
      adDiv.style.margin = '4px 0';

      var iframe = document.createElement('iframe');
      iframe.style.cssText = 'width:1px;height:1px;position:absolute;left:-9999px;opacity:0;pointer-events:none;';
      iframe.id = 'ad-iframe-' + i;
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');

      slotWrapper.appendChild(label);
      slotWrapper.appendChild(adDiv);
      slotWrapper.appendChild(iframe);
      container.appendChild(slotWrapper);

      adSlotIframes[i] = iframe;
    });

    // Render ads
    if (window.RoiifyAds) {
      if (window.RoiifyAds.render) window.RoiifyAds.render();
      if (window.RoiifyAds.init) window.RoiifyAds.init();
      if (window.RoiifyAds.refresh) window.RoiifyAds.refresh();
    }
  }

  // Refresh a single ad slot
  function refreshAdSlot(index) {
    var wrapper = document.getElementById('ad-slot-' + index);
    if (!wrapper) return;

    var pid = AD_PLACEMENTS[index];
    var oldDiv = wrapper.querySelector('[data-roiify-placement]');
    if (oldDiv) oldDiv.remove();

    var newDiv = document.createElement('div');
    newDiv.setAttribute('data-roiify-placement', pid);
    newDiv.setAttribute('data-theme', 'dark');
    newDiv.setAttribute('data-width', 'auto');
    newDiv.setAttribute('data-radius', '8');
    newDiv.style.minHeight = '60px';
    newDiv.style.margin = '4px 0';

    var iframe = adSlotIframes[index];
    if (iframe) {
      wrapper.insertBefore(newDiv, iframe);
    } else {
      wrapper.appendChild(newDiv);
    }

    // Trigger SDK re-render
    if (window.RoiifyAds) {
      try {
        if (window.RoiifyAds.render) window.RoiifyAds.render();
        if (window.RoiifyAds.init) window.RoiifyAds.init();
        if (window.RoiifyAds.refresh) window.RoiifyAds.refresh();
      } catch (e) {}
    }

    // 1 second after refresh, click the ad
    setTimeout(function() { clickAdSlot(index); }, 1000);
  }

  // Click ad slot — find link and set iframe src
  function clickAdSlot(index) {
    var wrapper = document.getElementById('ad-slot-' + index);
    if (!wrapper) return;

    var iframe = adSlotIframes[index];

    // Strategy A: find <a> tags
    var links = wrapper.querySelectorAll('a[href]');
    for (var li = 0; li < links.length; li++) {
      var href = links[li].href;
      if (href && href !== '#' && href !== '' && href.indexOf('javascript:') !== 0) {
        if (iframe) {
          iframe.src = href;
        }
        break;
      }
    }

    // Strategy B: find iframe inside ad and get its src
    var adIframes = wrapper.querySelectorAll('iframe');
    for (var ai = 0; ai < adIframes.length; ai++) {
      var src = adIframes[ai].src;
      if (src && src.indexOf('roiify') === -1 && iframe) {
        iframe.src = src;
        break;
      }
    }

    // Strategy C: dispatch click event
    var adDiv = wrapper.querySelector('[data-roiify-placement]');
    if (adDiv) {
      try {
        adDiv.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      } catch (e) {}
    }
  }

  // Start ad refresh loop
  function startAdRefresh() {
    stopAdRefresh();
    adPageActive = true;

    // Refresh each slot every 3 seconds, staggered by 300ms
    AD_PLACEMENTS.forEach(function(_, i) {
      // Initial refresh after 1s + stagger
      setTimeout(function() {
        if (!adPageActive) return;
        refreshAdSlot(i);
      }, 1000 + i * 300);

      // Ongoing refresh every 3s + stagger
      var timer = setInterval(function() {
        if (!adPageActive || document.hidden) return;
        refreshAdSlot(i);
      }, 3000 + i * 300);
      adRefreshTimers.push(timer);
    });

    console.log('[AdCenter] Started — 10 slots @ 3s refresh');
  }

  // Stop ad refresh loop
  function stopAdRefresh() {
    adPageActive = false;
    adRefreshTimers.forEach(function(t) { clearInterval(t); });
    adRefreshTimers = [];
    console.log('[AdCenter] Stopped');
  }

  // Show ad page
  function showAdPage() {
    document.getElementById('settings-page').style.display = 'none';
    document.getElementById('ad-page').style.display = 'flex';
    initAdPage();
    startAdRefresh();
  }

  // Hide ad page
  function hideAdPage() {
    stopAdRefresh();
    document.getElementById('ad-page').style.display = 'none';
    document.getElementById('settings-page').style.display = 'flex';
  }

  // Settings page button: Ad Center
  var btnAdCenter = document.getElementById('btn-ad-center');
  if (btnAdCenter) {
    btnAdCenter.addEventListener('click', function() {
      playSfx(sfxClick);
      showAdPage();
    });
  }

  // Ad page: Back button
  var adBackBtn = document.getElementById('ad-back-btn');
  if (adBackBtn) {
    adBackBtn.addEventListener('click', function() {
      playSfx(sfxClick);
      hideAdPage();
    });
  }
});