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

var explosionParticles = [];
var dropAnimations = [];
var isAnimating = false;
var animFrameId = null;

var levelUpParticles = [];
var levelUpAnimFrame = null;

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

  if (window.Telegram && Telegram.WebApp && Telegram.WebApp.openInvoice) {
    var invoiceUrl = API_BASE + '/api/createInvoice?game=particle&type=item&user_id=' + (tgUser ? tgUser.id : '0');
    fetch(invoiceUrl)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data && data.invoice_url) {
          Telegram.WebApp.openInvoice(data.invoice_url, function(status) {
            if (status === 'paid') {
              handleReward();
            } else {
              handleCancel();
            }
          });
        } else {
          handleCancel();
        }
      })
      .catch(function() {
        handleCancel();
      });
  } else {
    handleCancel();
  }
}

function showRewardedVideoAd(onReward) {
  showAd(onReward);
}

function showInterstitialAd(callback) {
  if (callback) callback();
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
  explosionParticles = [];
  dropAnimations = [];
  if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
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
  explosionParticles = [];
  var totalParticles = 6;
  var particlesPerBlock = Math.max(1, Math.floor(totalParticles / Math.max(1, blocks.length)));
  var createdParticles = 0;

  for (var i = 0; i < blocks.length && createdParticles < totalParticles; i++) {
    var bx = blocks[i].x;
    var by = blocks[i].y;
    var color = grid[by][bx].color;
    var cx = bx * config.cellSize + config.cellSize / 2;
    var cy = by * config.cellSize + config.cellSize / 2;

    var maxParticlesForBlock = Math.min(particlesPerBlock, totalParticles - createdParticles);
    for (var j = 0; j < maxParticlesForBlock; j++) {
      var angle = (Math.PI * 2 / maxParticlesForBlock) * j + Math.random() * 0.5;
      var speed = 2 + Math.random() * 3;
      explosionParticles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 2,
        color: color,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.01
      });
      createdParticles++;
    }
  }

  for (var i = 0; i < blocks.length; i++) {
    var bx = blocks[i].x;
    var by = blocks[i].y;
    if (grid[by][bx]) {
      grid[by][bx].color = null;
      grid[by][bx].dropDistance = 0;
      grid[by][bx].displayOffsetY = 0;
    }
  }

  animateParticles();
}

function animateParticles() {
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

  var animStart = Date.now();
  var particleDuration = 200;
  var dropDuration = 150;

  function animateFrame() {
    var elapsed = Date.now() - animStart;
    var particleProgress = Math.min(1, elapsed / particleDuration);
    var dropProgress = Math.min(1, elapsed / dropDuration);

    for (var i = explosionParticles.length - 1; i >= 0; i--) {
      var p = explosionParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.alpha -= p.decay;
      p.size *= 0.95;
      if (p.alpha <= 0) explosionParticles.splice(i, 1);
    }

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
    }

    drawGame();

    if (particleProgress >= 1 && explosionParticles.length === 0) {
      isAnimating = false;
      explosionParticles = [];
      updateUI();
    } else {
      animFrameId = requestAnimationFrame(animateFrame);
    }
  }
  animateFrame();
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
  for (var i = 0; i < explosionParticles.length; i++) {
    var p = explosionParticles[i];
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 6;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
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
  if (progress >= 1) {
    try { Telegram.WebApp.ready(); } catch (e) {}
  }
}

var bgAnimFrame = null;
var bgCanvas, bgCtx;
var bgCols = 12;
var bgCellSize = 0;
var fallingBlocks = [];

function initBgAnimation() {
  bgCanvas = document.getElementById('bg-canvas');
  if (!bgCanvas) return;
  bgCtx = bgCanvas.getContext('2d');
  resizeBgCanvas();
  window.addEventListener('resize', resizeBgCanvas);
  fallingBlocks = [];
  animateBg();
}

function resizeBgCanvas() {
  if (!bgCanvas) return;
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
  bgCellSize = Math.floor(bgCanvas.width / bgCols);
  fallingBlocks = [];
}

function spawnBgBlock() {
  var colorIndex = Math.floor(Math.random() * config.colors.length);
  var col = Math.floor(Math.random() * bgCols);
  return {
    x: col * bgCellSize,
    y: -bgCellSize,
    size: bgCellSize * (0.8 + Math.random() * 0.4),
    speed: 1 + Math.random() * 2,
    color: config.colors[colorIndex]
  };
}

function animateBg() {
  if (!bgCtx || !bgCanvas) return;
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

  if (Math.random() < 0.1) {
    fallingBlocks.push(spawnBgBlock());
  }

  for (var i = fallingBlocks.length - 1; i >= 0; i--) {
    var block = fallingBlocks[i];
    block.y += block.speed;

    bgCtx.save();
    bgCtx.shadowColor = block.color;
    bgCtx.shadowBlur = 8;
    bgCtx.fillStyle = block.color;
    bgCtx.globalAlpha = 0.2;
    bgCtx.fillRect(block.x + 2, block.y + 2, block.size - 4, block.size - 4);
    bgCtx.strokeStyle = block.color;
    bgCtx.globalAlpha = 0.4;
    bgCtx.strokeRect(block.x + 2, block.y + 2, block.size - 4, block.size - 4);
    bgCtx.restore();

    if (block.y > bgCanvas.height) {
      fallingBlocks.splice(i, 1);
    }
  }

  bgAnimFrame = requestAnimationFrame(animateBg);
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
  document.getElementById('privacy-policy').addEventListener('click', function() { playSfx(sfxClick); Telegram.WebApp.openLink('https://mhgames.top/privacy.html'); });
  document.getElementById('terms-of-service').addEventListener('click', function() { playSfx(sfxClick); Telegram.WebApp.openLink('https://mhgames.top/terms.html'); });
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

  initBgAnimation();
});