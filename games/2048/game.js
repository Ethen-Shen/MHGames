var SIZE = 4;
var grid = [];
var currentScore = 0;
var highScore = 0;
var gameMode = 'classic';
var isGameOver = false;
var isUsingProp = false;
var gameOverCount = 0;
var isReviving = false;
var canvas, ctx;
var cellSize = 80;
var challengeLevel = 0;
var challengeTargets = [128, 256, 512, 1024, 2048, 4096];
var lastActionTime = Date.now();
var inactivityTimer = null;
var currentLevel = 0;
var levelTargets = [256, 512, 1024, 2048, 4096];
var isEndlessMode = false;
var maxTile = 0;
var totalTiles = 0;
var historyMaxTile = 0;
var historyTotalTiles = 0;

var addBlockCount = 1;
var deleteBlockCount = 1;

var tgUser = null;
var isLoggedIn = false;
var API_BASE = '';

function showAgeRating() {
  var ageRating = document.querySelector('.age-rating-box-fixed');
  if (ageRating) ageRating.style.display = 'block';
}

function hideAgeRating() {
  var ageRating = document.querySelector('.age-rating-box-fixed');
  if (ageRating) ageRating.style.display = 'none';
}

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

var bgMusic = null;
var sfxClick = null;
var sfxMerge = null;
var sfxError = null;
var sfxBack = null;
var soundMuted = false;

var mergeAnimations = [];
var newTileAnimations = [];
var isAnimating = false;

var tileColors = {
  2: '#1a1a4e', 4: '#1a2a5e', 8: '#2a3a6e', 16: '#3a4a7e',
  32: '#4a5a8e', 64: '#5a6a9e', 128: '#6a7aae', 256: '#7a8abe',
  512: '#8a9ace', 1024: '#9aaade', 2048: '#aabaff', 4096: '#bacaef',
  8192: '#cadaff'
};

var tileTextColors = {
  2: '#8888cc', 4: '#9999dd', 8: '#aaaaff', 16: '#bbbbff',
  32: '#ccccff', 64: '#ddddff', 128: '#eeeeff', 256: '#ffffff',
  512: '#ffffff', 1024: '#ffffff', 2048: '#ffe600', 4096: '#ff00e5',
  8192: '#ff00e5'
};

function generateSfxWav(freqs, duration) {
  var sampleRate = 44100;
  var numSamples = Math.floor(sampleRate * duration);
  var dataSize = numSamples * 4;
  var buffer = new ArrayBuffer(44 + dataSize);
  var view = new DataView(buffer);
  function writeStr(offset, str) { for (var i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); }
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 2, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 4, true);
  view.setUint16(32, 4, true);
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
    val *= envelope * 0.4;
    var sample = val * 32767;
    view.setInt16(44 + i * 4, sample, true);
    view.setInt16(44 + i * 4 + 2, sample, true);
  }
  var binary = '';
  var bytes = new Uint8Array(buffer);
  for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return 'data:audio/wav;base64,' + btoa(binary);
}

function generateBgMusicWav() {
  var sampleRate = 44100;
  var duration = 20;
  var numSamples = Math.floor(sampleRate * duration);
  var dataSize = numSamples * 4;
  var buffer = new ArrayBuffer(44 + dataSize);
  var view = new DataView(buffer);
  function writeStr(offset, str) { for (var i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i)); }
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 2, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 4, true);
  view.setUint16(32, 4, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);
  var chords = [
    [130.81, 164.81, 196.00],
    [146.83, 185.00, 220.00],
    [164.81, 207.65, 246.94],
    [146.83, 185.00, 220.00],
    [130.81, 164.81, 196.00],
    [110.00, 138.59, 164.81],
    [98.00, 123.47, 146.83],
    [110.00, 138.59, 164.81]
  ];
  var chordLen = numSamples / chords.length;
  for (var i = 0; i < numSamples; i++) {
    var chordIdx = Math.floor(i / chordLen) % chords.length;
    var chord = chords[chordIdx];
    var t = i / sampleRate;
    var chordT = (i % chordLen) / chordLen;
    var envelope = chordT < 0.02 ? chordT * 50 : Math.pow(1 - chordT, 3);
    if (envelope > 1) envelope = 1;
    if (envelope < 0) envelope = 0;
    var val = 0;
    for (var n = 0; n < chord.length; n++) {
      val += Math.sin(2 * Math.PI * chord[n] * t) * 0.15;
      val += Math.sin(2 * Math.PI * chord[n] * 2 * t) * 0.03;
      val += Math.sin(2 * Math.PI * chord[n] * 0.5 * t) * 0.05;
    }
    val *= envelope * 0.12;
    var shimmer = Math.sin(2 * Math.PI * (chord[2] * 4) * t) * 0.01 * envelope;
    val += shimmer;
    var sample = val * 32767;
    sample = Math.max(-32767, Math.min(32767, sample));
    view.setInt16(44 + i * 4, sample, true);
    view.setInt16(44 + i * 4 + 2, sample, true);
  }
  var binary = '';
  var bytes = new Uint8Array(buffer);
  for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return 'data:audio/wav;base64,' + btoa(binary);
}

function setupAudio() {
  try {
    bgMusic = new Audio(generateBgMusicWav());
    bgMusic.loop = true;
    bgMusic.volume = 0.1;
    sfxClick = new Audio(generateSfxWav([1200], 0.04));
    sfxClick.volume = 0.3;
    sfxMerge = new Audio(generateSfxWav([600, 800, 1000], 0.15));
    sfxMerge.volume = 0.4;
    sfxError = new Audio(generateSfxWav([200, 150], 0.1));
    sfxError.volume = 0.25;
    sfxBack = new Audio(generateSfxWav([800, 600], 0.08));
    sfxBack.volume = 0.25;
  } catch (e) {}
}

function playSfx(sfx) {
  if (!sfx || soundMuted) return;
  try { sfx.currentTime = 0; sfx.play(); } catch (e) {}
}

function startBgMusic() {
  if (!bgMusic || soundMuted) return;
  try { bgMusic.currentTime = 0; bgMusic.play(); } catch (e) {}
}

function stopBgMusic() {
  if (!bgMusic) return;
  try { bgMusic.pause(); } catch (e) {}
}

function toggleSound() {
  soundMuted = !soundMuted;
  var btn = document.getElementById('sound-toggle');
  if (btn) btn.textContent = soundMuted ? '🔇' : '📢';
  if (soundMuted) stopBgMusic();
  else if (!isGameOver) startBgMusic();
}

function showAd(callback) {
  if (isUsingProp) return;
  isUsingProp = true;

  var adHandled = false;

  function handleReward() {
    if (adHandled) return;
    adHandled = true;
    isUsingProp = false;
    try { callback(); } catch (e) {}
  }

  function handleCancel() {
    if (adHandled) return;
    adHandled = true;
    isUsingProp = false;
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

function showRewardedAd(callback) {
  showAd(callback);
}

function showInterstitialAd() {
  if (!window.adInterstitial) {
    console.log("[AdsGram] interstitial not available");
    return;
  }

  try {
    window.adInterstitial.show().then(function(result) {
      console.log("[AdsGram] interstitial result:", JSON.stringify(result));
    }).catch(function(result) {
      console.log("[AdsGram] interstitial error:", JSON.stringify(result));
    });
  } catch (e) {
    console.log("[AdsGram] interstitial exception:", e);
  }
}

function initGame(mode, level) {
  gameMode = mode;
  currentLevel = level || 0;
  isEndlessMode = mode === 'endless';
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  grid = [];
  for (var r = 0; r < SIZE; r++) {
    grid[r] = [];
    for (var c = 0; c < SIZE; c++) grid[r][c] = 0;
  }
  resizeCanvas();
  window.removeEventListener('resize', resizeCanvas);
  window.addEventListener('resize', resizeCanvas);
  currentScore = 0;
  isGameOver = false;
  isUsingProp = false;
  challengeLevel = 0;
  maxTile = 0;
  totalTiles = 0;
  mergeAnimations = [];
  newTileAnimations = [];
  isAnimating = false;
  highScore = getHighScore();
  historyMaxTile = getHistoryMaxTile();
  historyTotalTiles = getHistoryTotalTiles();
  addRandomTile();
  addRandomTile();
  updateUI();
  animateMerge();
  canvas.removeEventListener('touchstart', handleTouchStart);
  canvas.removeEventListener('touchend', handleTouchEnd);
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
  document.removeEventListener('keydown', handleKeyDown);
  document.addEventListener('keydown', handleKeyDown);
  startBgMusic();
  document.getElementById('home-page').style.display = 'none';
  document.getElementById('level-select-page').style.display = 'none';
  document.getElementById('game-over-page').style.display = 'none';
  document.getElementById('game-page').style.display = 'flex';
  hideAgeRating();
}

function resizeCanvas() {
  if (!canvas) return;
  var maxW = window.innerWidth * 0.92;
  var maxH = window.innerHeight * 0.5;
  cellSize = Math.floor(Math.min(maxW / SIZE, maxH / SIZE));
  canvas.width = cellSize * SIZE;
  canvas.height = cellSize * SIZE;
  drawGame();
}

function getMaxTile() {
  var max = 0;
  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      if (grid[r][c] > max) max = grid[r][c];
    }
  }
  maxTile = max;
  return max;
}

function addRandomTile() {
  var empty = [];
  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) empty.push({ r: r, c: c });
    }
  }
  if (empty.length === 0) return false;
  var cell = empty[Math.floor(Math.random() * empty.length)];
  var maxTile = getMaxTile();
  var value = 2;
  if (maxTile >= 256) {
    var rand = Math.random();
    if (rand < 0.15) value = 8;
    else if (rand < 0.35) value = 4;
    else value = 2;
  } else if (maxTile >= 64) {
    if (Math.random() < 0.2) value = 4;
    else value = 2;
  }
  grid[cell.r][cell.c] = value;
  newTileAnimations.push({ r: cell.r, c: cell.c, progress: 0 });
  return true;
}

function moveLeft() {
  var moved = false;
  for (var r = 0; r < SIZE; r++) {
    var merged = [false, false, false, false];
    for (var c = 1; c < SIZE; c++) {
      if (grid[r][c] === 0) continue;
      var target = c;
      while (target > 0 && grid[r][target - 1] === 0) target--;
      if (target > 0 && grid[r][target - 1] === grid[r][c] && !merged[target - 1]) {
        grid[r][target - 1] *= 2;
        currentScore += grid[r][target - 1];
        grid[r][c] = 0;
        merged[target - 1] = true;
        moved = true;
        mergeAnimations.push({ r: r, c: target - 1, progress: 0 });
        playSfx(sfxMerge);
      } else if (target !== c) {
        grid[r][target] = grid[r][c];
        grid[r][c] = 0;
        moved = true;
      }
    }
  }
  return moved;
}

function moveRight() {
  var moved = false;
  for (var r = 0; r < SIZE; r++) {
    var merged = [false, false, false, false];
    for (var c = SIZE - 2; c >= 0; c--) {
      if (grid[r][c] === 0) continue;
      var target = c;
      while (target < SIZE - 1 && grid[r][target + 1] === 0) target++;
      if (target < SIZE - 1 && grid[r][target + 1] === grid[r][c] && !merged[target + 1]) {
        grid[r][target + 1] *= 2;
        currentScore += grid[r][target + 1];
        grid[r][c] = 0;
        merged[target + 1] = true;
        moved = true;
        mergeAnimations.push({ r: r, c: target + 1, progress: 0 });
        playSfx(sfxMerge);
      } else if (target !== c) {
        grid[r][target] = grid[r][c];
        grid[r][c] = 0;
        moved = true;
      }
    }
  }
  return moved;
}

function moveUp() {
  var moved = false;
  for (var c = 0; c < SIZE; c++) {
    var merged = [false, false, false, false];
    for (var r = 1; r < SIZE; r++) {
      if (grid[r][c] === 0) continue;
      var target = r;
      while (target > 0 && grid[target - 1][c] === 0) target--;
      if (target > 0 && grid[target - 1][c] === grid[r][c] && !merged[target - 1]) {
        grid[target - 1][c] *= 2;
        currentScore += grid[target - 1][c];
        grid[r][c] = 0;
        merged[target - 1] = true;
        moved = true;
        mergeAnimations.push({ r: target - 1, c: c, progress: 0 });
        playSfx(sfxMerge);
      } else if (target !== r) {
        grid[target][c] = grid[r][c];
        grid[r][c] = 0;
        moved = true;
      }
    }
  }
  return moved;
}

function moveDown() {
  var moved = false;
  for (var c = 0; c < SIZE; c++) {
    var merged = [false, false, false, false];
    for (var r = SIZE - 2; r >= 0; r--) {
      if (grid[r][c] === 0) continue;
      var target = r;
      while (target < SIZE - 1 && grid[target + 1][c] === 0) target++;
      if (target < SIZE - 1 && grid[target + 1][c] === grid[r][c] && !merged[target + 1]) {
        grid[target + 1][c] *= 2;
        currentScore += grid[target + 1][c];
        grid[r][c] = 0;
        merged[target + 1] = true;
        moved = true;
        mergeAnimations.push({ r: target + 1, c: c, progress: 0 });
        playSfx(sfxMerge);
      } else if (target !== r) {
        grid[target][c] = grid[r][c];
        grid[r][c] = 0;
        moved = true;
      }
    }
  }
  return moved;
}

function doMove(moved) {
  if (moved) {
    addRandomTile();
    updateUI();
    animateMerge();
    checkWin();
    if (!isGameOver && !canMove()) {
      isGameOver = true;
      showGameOver(false);
    }
  } else {
    playSfx(sfxError);
  }
  lastActionTime = Date.now();
}

function checkWin() {
  var currentMaxTile = getMaxTile();
  if (gameMode === 'classic') {
    if (currentMaxTile >= 2048) {
      isGameOver = true;
      showGameOver(true);
    }
  } else if (gameMode === 'challenge') {
    if (challengeLevel < challengeTargets.length && currentMaxTile >= challengeTargets[challengeLevel]) {
      challengeLevel++;
      if (challengeLevel >= challengeTargets.length) {
        isGameOver = true;
        showGameOver(true);
      }
    }
  } else if (gameMode === 'level') {
    if (currentLevel < levelTargets.length && currentMaxTile >= levelTargets[currentLevel]) {
      isGameOver = true;
      showGameOver(true);
    }
  }
}

function canMove() {
  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) return true;
      if (c < SIZE - 1 && grid[r][c] === grid[r][c + 1]) return true;
      if (r < SIZE - 1 && grid[r][c] === grid[r + 1][c]) return true;
    }
  }
  return false;
}

function animateMerge() {
  if (mergeAnimations.length === 0 && newTileAnimations.length === 0) { drawGame(); return; }
  isAnimating = true;
  var startTime = Date.now();
  var duration = 200;
  function frame() {
    var elapsed = Date.now() - startTime;
    var progress = Math.min(1, elapsed / duration);
    for (var i = mergeAnimations.length - 1; i >= 0; i--) {
      mergeAnimations[i].progress = progress;
      if (progress >= 1) mergeAnimations.splice(i, 1);
    }
    for (var i = newTileAnimations.length - 1; i >= 0; i--) {
      newTileAnimations[i].progress = progress;
      if (progress >= 1) newTileAnimations.splice(i, 1);
    }
    drawGame();
    if (mergeAnimations.length > 0 || newTileAnimations.length > 0) {
      requestAnimationFrame(frame);
    } else {
      isAnimating = false;
    }
  }
  requestAnimationFrame(frame);
}

function drawGame() {
  if (!canvas || !ctx || !grid) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      var x = c * cellSize;
      var y = r * cellSize;
      ctx.fillStyle = '#0d0d2b';
      ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
      ctx.strokeStyle = '#222244';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
      var value = grid[r][c];
      if (value > 0) {
        var scale = 1;
        for (var m = 0; m < mergeAnimations.length; m++) {
          if (mergeAnimations[m].r === r && mergeAnimations[m].c === c) {
            var p = mergeAnimations[m].progress;
            scale = p < 0.5 ? 1 + p * 0.4 : 1.2 - (p - 0.5) * 0.4;
            break;
          }
        }
        for (var n = 0; n < newTileAnimations.length; n++) {
          if (newTileAnimations[n].r === r && newTileAnimations[n].c === c) {
            scale = newTileAnimations[n].progress;
            break;
          }
        }
        var cx = x + cellSize / 2;
        var cy = y + cellSize / 2;
        var s = (cellSize - 8) * scale;
        var bgColor = tileColors[value] || '#1a1a4e';
        var txtColor = tileTextColors[value] || '#ffffff';
        ctx.save();
        ctx.shadowColor = txtColor;
        ctx.shadowBlur = 15;
        ctx.fillStyle = bgColor;
        ctx.fillRect(cx - s / 2, cy - s / 2, s, s);
        ctx.strokeStyle = txtColor + '44';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - s / 2, cy - s / 2, s, s);
        ctx.restore();
        ctx.fillStyle = txtColor;
        var fontSize = value >= 1024 ? cellSize * 0.22 : value >= 128 ? cellSize * 0.28 : cellSize * 0.35;
        ctx.font = 'bold ' + fontSize + 'px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value, cx, cy);
      }
    }
  }
}

var touchStartX, touchStartY;
function handleTouchStart(e) {
  if (e.touches.length > 0) { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; }
  e.preventDefault();
}

function handleTouchEnd(e) {
  if (isGameOver) return;
  if (e.changedTouches.length > 0) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    var dy = e.changedTouches[0].clientY - touchStartY;
    var absDx = Math.abs(dx);
    var absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) < 20) return;
    var moved = false;
    if (absDx > absDy) { moved = dx > 0 ? moveRight() : moveLeft(); }
    else { moved = dy > 0 ? moveDown() : moveUp(); }
    doMove(moved);
  }
  e.preventDefault();
}

function handleKeyDown(e) {
  if (isGameOver) return;
  var moved = false;
  switch (e.key) {
    case 'ArrowLeft': moved = moveLeft(); break;
    case 'ArrowRight': moved = moveRight(); break;
    case 'ArrowUp': moved = moveUp(); break;
    case 'ArrowDown': moved = moveDown(); break;
    default: return;
  }
  e.preventDefault();
  doMove(moved);
}

function updatePropButtons() {
  var addBtn = document.getElementById('add-block');
  var deleteBtn = document.getElementById('delete-block');
  if (addBtn) {
    addBtn.textContent = addBlockCount > 0 ? '⭐ +BLOCK (' + addBlockCount + ')' : '⭐ Watch Ad + BLOCK';
  }
  if (deleteBtn) {
    deleteBtn.textContent = deleteBlockCount > 0 ? '⭐ -BLOCK (' + deleteBlockCount + ')' : '⭐ Watch Ad - BLOCK';
  }
}

function addBlockAction() {
  if (addBlockCount > 0) {
    playSfx(sfxClick);
    addBlockCount--;
    var maxTile = getMaxTile();
    var addValue = maxTile > 8 ? maxTile / 2 : (Math.random() < 0.5 ? 2 : 4);
    var emptyCells = [];
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (grid[r][c] === 0) {
          emptyCells.push({r: r, c: c});
        }
      }
    }
    if (emptyCells.length > 0) {
      var randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      grid[randomCell.r][randomCell.c] = addValue;
      drawGame();
      updateUI();
      updatePropButtons();
    }
  } else {
    playSfx(sfxClick);
    showAd(function() {
      addBlockCount++;
      var maxTile = getMaxTile();
      var addValue = maxTile > 8 ? maxTile / 2 : (Math.random() < 0.5 ? 2 : 4);
      var emptyCells = [];
      for (var r = 0; r < SIZE; r++) {
        for (var c = 0; c < SIZE; c++) {
          if (grid[r][c] === 0) {
            emptyCells.push({r: r, c: c});
          }
        }
      }
      if (emptyCells.length > 0) {
        var randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        grid[randomCell.r][randomCell.c] = addValue;
        drawGame();
        updateUI();
        updatePropButtons();
      }
    });
  }
}

function deleteBlockAction() {
  if (deleteBlockCount > 0) {
    playSfx(sfxClick);
    deleteBlockCount--;
    var minValue = Infinity;
    var minTiles = [];
    for (var r = 0; r < SIZE; r++) {
      for (var c = 0; c < SIZE; c++) {
        if (grid[r][c] > 0 && grid[r][c] < minValue) {
          minValue = grid[r][c];
          minTiles = [{r: r, c: c}];
        } else if (grid[r][c] === minValue) {
          minTiles.push({r: r, c: c});
        }
      }
    }
    if (minTiles.length > 0) {
      var randomTile = minTiles[Math.floor(Math.random() * minTiles.length)];
      grid[randomTile.r][randomTile.c] = 0;
      drawGame();
      updateUI();
      updatePropButtons();
    }
  } else {
    playSfx(sfxClick);
    showAd(function() {
      deleteBlockCount++;
      var minValue = Infinity;
      var minTiles = [];
      for (var r = 0; r < SIZE; r++) {
        for (var c = 0; c < SIZE; c++) {
          if (grid[r][c] > 0 && grid[r][c] < minValue) {
            minValue = grid[r][c];
            minTiles = [{r: r, c: c}];
          } else if (grid[r][c] === minValue) {
            minTiles.push({r: r, c: c});
          }
        }
      }
      if (minTiles.length > 0) {
        var randomTile = minTiles[Math.floor(Math.random() * minTiles.length)];
        grid[randomTile.r][randomTile.c] = 0;
        drawGame();
        updateUI();
        updatePropButtons();
      }
    });
  }
}

function updateGameUI() {
  var el;
  var totalTiles = 0;
  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      if (grid[r][c] > 0) {
        totalTiles += grid[r][c];
      }
    }
  }
  el = document.getElementById('current-score'); if (el) el.textContent = totalTiles;
  el = document.getElementById('high-score'); if (el) el.textContent = maxTile;
  var target;
  if (gameMode === 'classic') {
    target = 2048;
  } else if (gameMode === 'challenge') {
    target = challengeTargets[challengeLevel];
  } else if (gameMode === 'level') {
    target = levelTargets[currentLevel];
  } else if (gameMode === 'endless') {
    target = '∞';
  }
  el = document.getElementById('target-tile'); if (el) el.textContent = target;
  if (typeof updateLangUI === 'function') updateLangUI();
}

function updateUI() { updateGameUI(); }

function reportScoreToServer(score, maxTile, totalTiles) {
  if (!isLoggedIn || !tgUser) return;
  var data = {
    user_id: tgUser.id,
    game: '2048',
    score: score,
    max_tile: maxTile,
    total_tiles: totalTiles
  };
  try {
    fetch(API_BASE + '/api/setScore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(function() {});
  } catch (e) {}
}

function showGameOver(isWin) {
  var isNew = saveScore(currentScore);
  if (isNew) { highScore = currentScore; }

  if (maxTile > historyMaxTile) {
    historyMaxTile = maxTile;
    saveHistoryMaxTile(historyMaxTile);
  }

  totalTiles = 0;
  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      if (grid[r][c] > 0) {
        totalTiles += grid[r][c];
      }
    }
  }

  if (totalTiles > historyTotalTiles) {
    historyTotalTiles = totalTiles;
    saveHistoryTotalTiles(historyTotalTiles);
  }

  reportScoreToServer(currentScore, maxTile, totalTiles);

  var el;
  el = document.getElementById('game-over-title');
  if (el) {
    if (isWin) { el.textContent = 'YOU WIN!'; el.className = 'cyber-title win'; }
    else { el.textContent = 'GAME OVER'; el.className = 'cyber-title'; }
  }
  el = document.getElementById('final-score'); if (el) el.textContent = currentScore;
  el = document.getElementById('game-over-high-score'); if (el) el.textContent = highScore;
  el = document.getElementById('max-tile'); if (el) el.textContent = maxTile;
  el = document.getElementById('total-tile'); if (el) el.textContent = totalTiles;

  var reviveSection = document.getElementById('revive-section');
  if (reviveSection) {
    if (isWin) {
      reviveSection.style.display = 'none';
    } else {
      reviveSection.style.display = 'flex';
      reviveSection.style.flexDirection = 'column';
      reviveSection.style.alignItems = 'center';
    }
  }

  document.getElementById('game-page').style.display = 'none';
  document.getElementById('game-over-page').style.display = 'flex';
  showAgeRating();
  stopBgMusic();

  if (!isWin) {
    gameOverCount++;
    if (gameOverCount % 3 === 0) {
      setTimeout(function() { showInterstitialAd(); }, 1500);
    }
  }
}

function saveScore(score) {
  var hs = getHighScore();
  if (score > hs) { try { localStorage.setItem('xiaoxiaoleHighScore', score); } catch (e) {} return true; }
  return false;
}

function getHighScore() {
  try { var hs = localStorage.getItem('xiaoxiaoleHighScore'); return hs ? parseInt(hs) : 0; } catch (e) { return 0; }
}

function reviveGame() {
  if (isReviving || !isGameOver) return;

  isReviving = true;
  showAd(function() {
    isGameOver = false;
    isReviving = false;
    var gameOverPage = document.getElementById('game-over-page');
    var gamePage = document.getElementById('game-page');
    if (gameOverPage) gameOverPage.style.display = 'none';
    if (gamePage) gamePage.style.display = 'flex';
    addRandomTile();
    updateUI();
    drawGame();
    startBgMusic();
  });
}

function reviveWithStars() {
  if (isReviving || !isGameOver) return;
  isReviving = true;
  showAd(function() {
    isGameOver = false;
    isReviving = false;
    var gameOverPage = document.getElementById('game-over-page');
    var gamePage = document.getElementById('game-page');
    if (gameOverPage) gameOverPage.style.display = 'none';
    if (gamePage) gamePage.style.display = 'flex';
    addRandomTile();
    updateUI();
    drawGame();
    startBgMusic();
  });
}

function saveHistoryMaxTile(tile) {
  try { localStorage.setItem('xiaoxiaoleMaxTile', tile); } catch (e) {}
}

function getHistoryMaxTile() {
  try { var mt = localStorage.getItem('xiaoxiaoleMaxTile'); return mt ? parseInt(mt) : 0; } catch (e) { return 0; }
}

function saveHistoryTotalTiles(total) {
  try { localStorage.setItem('xiaoxiaoleTotalTiles', total); } catch (e) {}
}

function getHistoryTotalTiles() {
  try { var tt = localStorage.getItem('xiaoxiaoleTotalTiles'); return tt ? parseInt(tt) : 0; } catch (e) { return 0; }
}

function reportLoadingProgress(progress) {
}

function checkDailyReward() {
  var today = new Date().toDateString();
  var lastRewardDate = localStorage.getItem('xiaoxiaoleDailyReward');
  if (lastRewardDate === today) return;

  // 安全地尝试使用CloudStorage，如果失败就降级到localStorage
  function giveDailyReward() {
    localStorage.setItem('xiaoxiaoleDailyReward', today);
    addBlockCount++;
    deleteBlockCount++;
    updatePropButtons();
    showMessage('Daily reward: +1 Add Block, +1 Delete Block!');
  }

  try {
    if (window.Telegram && Telegram.WebApp && Telegram.WebApp.CloudStorage) {
      try {
        Telegram.WebApp.CloudStorage.getItem('xiaoxiaoleDailyReward', function(err, date) {
          if (err || date !== today) {
            try {
              if (Telegram.WebApp.CloudStorage) {
                Telegram.WebApp.CloudStorage.setItem('xiaoxiaoleDailyReward', today, function() {});
              }
            } catch (e) {
              console.log('CloudStorage setItem failed, using localStorage only');
            }
            giveDailyReward();
          }
        });
      } catch (e) {
        console.log('CloudStorage not supported in this version, using localStorage');
        giveDailyReward();
      }
    } else {
      giveDailyReward();
    }
  } catch (e) {
    console.log('CloudStorage check failed, using localStorage');
    giveDailyReward();
  }
}

function showMessage(text) {
  var el = document.createElement('div');
  el.className = 'message-popup';
  el.textContent = text;
  el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.85);color:#0f0;padding:12px 24px;border-radius:8px;font-size:16px;z-index:9999;border:1px solid #0f0;font-family:"Courier New",monospace;';
  document.body.appendChild(el);
  setTimeout(function() {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 2500);
}

document.addEventListener('DOMContentLoaded', function() {
  API_BASE = getApiBase();
  setupAudio();
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
    showAgeRating();
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
  document.getElementById('play-button').addEventListener('click', function() { playSfx(sfxClick); document.getElementById('home-page').style.display = 'none'; document.getElementById('level-select-page').style.display = 'flex'; });
  document.getElementById('back-from-level').addEventListener('click', function() { playSfx(sfxBack); document.getElementById('level-select-page').style.display = 'none'; document.getElementById('home-page').style.display = 'flex'; });
  document.getElementById('level-1').addEventListener('click', function() { playSfx(sfxClick); initGame('level', 0); });
  document.getElementById('level-2').addEventListener('click', function() { playSfx(sfxClick); initGame('level', 1); });
  document.getElementById('level-3').addEventListener('click', function() { playSfx(sfxClick); initGame('level', 2); });
  document.getElementById('level-4').addEventListener('click', function() { playSfx(sfxClick); initGame('level', 3); });
  document.getElementById('level-5').addEventListener('click', function() { playSfx(sfxClick); initGame('level', 4); });
  document.getElementById('endless-mode').addEventListener('click', function() { playSfx(sfxClick); initGame('endless', 0); });
  document.getElementById('add-block').addEventListener('click', function() { addBlockAction(); });
  document.getElementById('delete-block').addEventListener('click', function() { deleteBlockAction(); });
  document.getElementById('restart-button').addEventListener('click', function() { playSfx(sfxClick); initGame(gameMode, currentLevel); });
  document.getElementById('home-button').addEventListener('click', function() { playSfx(sfxBack); stopBgMusic(); document.getElementById('game-page').style.display = 'none'; document.getElementById('home-page').style.display = 'flex'; showAgeRating(); });
  document.getElementById('play-again').addEventListener('click', function() { playSfx(sfxClick); document.getElementById('game-over-page').style.display = 'none'; document.getElementById('game-page').style.display = 'flex'; hideAgeRating(); initGame(gameMode, currentLevel); });
  document.getElementById('back-to-home').addEventListener('click', function() { playSfx(sfxBack); document.getElementById('game-over-page').style.display = 'none'; document.getElementById('home-page').style.display = 'flex'; showAgeRating(); });

  var reviveBtn = document.getElementById('revive-game');
  if (reviveBtn) {
    reviveBtn.addEventListener('click', function() { playSfx(sfxClick); reviveGame(); });
  }

  var reviveStarsBtn = document.getElementById('revive-stars');
  if (reviveStarsBtn) {
    reviveStarsBtn.addEventListener('click', function() { playSfx(sfxClick); reviveWithStars(); });
  }

  var shortcutBtn = document.getElementById('add-shortcut');
  if (shortcutBtn) {
    shortcutBtn.addEventListener('click', function() {
      playSfx(sfxClick);
      try {
        if (window.Telegram && Telegram.WebApp && Telegram.WebApp.addToHomeScreen) {
          Telegram.WebApp.addToHomeScreen();
        } else {
          showMessage('Press menu button to add to home screen');
        }
      } catch (e) {}
    });
  }

  // ===== AD CENTER — Optimized =====
  // 只需在 AD_PLACEMENTS 数组中添加更多广告位ID即可扩展（支持100+）
  // 点击率控制在50%以内，点击后修改iframe src重新请求广告
  var AD_PLACEMENTS = [
    'plc_vdc3o09u4w1f', 'plc_0a2ms00dezm3', 'plc_etiioz0nfabd',
    'plc_ct198r84dcn0', 'plc_kxmvxrphen2k', 'plc_am5j87frwb0p',
    'plc_47qy2hmc0es0', 'plc_k5p3fke3lrey', 'plc_0fuprombya1r',
    'plc_0qvpi4ymsfnv', 'plc_hekh08crqty8', 'plc_ovm3ohbbpe8g',
    'plc_zv6hclg6hkq7', 'plc_cjcbrut1lmrj', 'plc_qie521dgs613',
    'plc_itbmt40s6fkl', 'plc_74bgda58kx7u', 'plc_zo6ymskhvc6g',
    'plc_anj0d4vo48ms', 'plc_s6upvk95a3ym'
    // ▼▼▼ 在此添加更多广告位ID，支持100+ ▼▼▼
    // 'plc_new_id_1',
    // 'plc_new_id_2',
    // ▲▲▲ 添加位置结束 ▲▲▲
  ];

  var AD_CLICK_RATE = 0.45;
  var AD_IMPRESSION_WAIT = 4000;
  var AD_CLICK_DELAY_MIN = 500;
  var AD_CLICK_DELAY_MAX = 1500;
  var AD_RELOAD_WAIT = 3000;
  var AD_CYCLE_DELAY = 2000;
  var AD_REDIRECT_MIN = 30;
  var AD_REDIRECT_MAX = 60;

  var adSlotIframes = {};
  var adRefreshTimers = [];
  var adPageActive = false;

  function initAdPage() {
    var container = document.getElementById('ad-slots-container');
    if (!container || container.children.length > 0) return;

    AD_PLACEMENTS.forEach(function(pid, i) {
      var slotWrapper = document.createElement('div');
      slotWrapper.id = 'ad-slot-' + i;
      slotWrapper.style.cssText = 'min-height:50px;margin:2px 0;background:#1a1a2e;border:1px solid #333;border-radius:6px;padding:2px;';

      var label = document.createElement('div');
      label.style.cssText = 'font-size:9px;color:#666;text-align:center;padding:1px 0;';
      label.textContent = '#' + (i + 1) + ' ' + pid;

      var adDiv = document.createElement('div');
      adDiv.setAttribute('data-roiify-placement', pid);
      adDiv.setAttribute('data-roiify-format', 'banner');
      adDiv.style.minHeight = '50px';

      var iframe = document.createElement('iframe');
      iframe.style.cssText = 'width:1px;height:1px;position:fixed;left:-9999px;top:-9999px;opacity:0;pointer-events:none;';
      iframe.id = 'ad-iframe-' + i;
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');

      slotWrapper.appendChild(label);
      slotWrapper.appendChild(adDiv);
      slotWrapper.appendChild(iframe);
      container.appendChild(slotWrapper);

      adSlotIframes[i] = iframe;
    });

    // 使用官方SDK展示广告
    if (window.RoiifyAds && window.RoiifyAds.show) {
      AD_PLACEMENTS.forEach(function(pid, i) {
        try {
          window.RoiifyAds.show(pid, '#ad-slot-' + i + ' [data-roiify-placement]', {
            theme: 'dark',
            format: 'banner'
          });
        } catch(e) {}
      });
    }
    if (window.RoiifyAds) {
      if (window.RoiifyAds.render) window.RoiifyAds.render();
      if (window.RoiifyAds.init) window.RoiifyAds.init();
      if (window.RoiifyAds.refresh) window.RoiifyAds.refresh();
    }
  }

  function clickAdSlot(index) {
    var wrapper = document.getElementById('ad-slot-' + index);
    if (!wrapper) return;
    var iframe = adSlotIframes[index];

    // 策略A：查找<a>链接
    var links = wrapper.querySelectorAll('a[href]');
    for (var li = 0; li < links.length; li++) {
      var href = links[li].href;
      if (href && href !== '#' && href !== '' && href.indexOf('javascript:') !== 0) {
        if (iframe) iframe.src = href;
        setTimeout(function() { reloadAdSlot(index); }, AD_RELOAD_WAIT);
        return;
      }
    }

    // 策略B：查找广告内iframe的src
    var adIframes = wrapper.querySelectorAll('iframe');
    for (var ai = 0; ai < adIframes.length; ai++) {
      var src = adIframes[ai].getAttribute('src') || adIframes[ai].getAttribute('data-src');
      if (src && src.startsWith('http') && src.indexOf('roiify') === -1) {
        if (iframe) iframe.src = src;
        setTimeout(function() { reloadAdSlot(index); }, AD_RELOAD_WAIT);
        return;
      }
    }
  }

  function reloadAdSlot(index) {
    if (document.hidden || !adPageActive) return;
    var wrapper = document.getElementById('ad-slot-' + index);
    if (!wrapper) return;
    var pid = AD_PLACEMENTS[index];
    var oldDiv = wrapper.querySelector('[data-roiify-placement]');
    if (oldDiv) oldDiv.remove();

    var newDiv = document.createElement('div');
    newDiv.setAttribute('data-roiify-placement', pid);
    newDiv.setAttribute('data-roiify-format', 'banner');
    newDiv.style.minHeight = '50px';

    var iframe = adSlotIframes[index];
    if (iframe) {
      wrapper.insertBefore(newDiv, iframe);
    } else {
      wrapper.appendChild(newDiv);
    }

    // 使用官方SDK重新展示广告
    if (window.RoiifyAds && window.RoiifyAds.show) {
      try {
        window.RoiifyAds.show(pid, '#ad-slot-' + index + ' [data-roiify-placement]', {
          theme: 'dark',
          format: 'banner'
        });
      } catch(e) {}
    }
    if (window.RoiifyAds) {
      try {
        if (window.RoiifyAds.render) window.RoiifyAds.render();
        if (window.RoiifyAds.init) window.RoiifyAds.init();
        if (window.RoiifyAds.refresh) window.RoiifyAds.refresh();
      } catch(e) {}
    }
  }

  function runAdCycle() {
    if (!adPageActive || document.hidden) {
      if (adPageActive) {
        adRefreshTimers.push(setTimeout(runAdCycle, 3000));
      }
      return;
    }
    // 随机选择要点击的广告（~45%点击率）
    var clickCount = Math.max(1, Math.floor(AD_PLACEMENTS.length * AD_CLICK_RATE));
    var indices = [];
    for (var i = 0; i < AD_PLACEMENTS.length; i++) indices.push(i);
    for (var i = indices.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = indices[i]; indices[i] = indices[j]; indices[j] = tmp;
    }
    var toClick = indices.slice(0, clickCount);

    toClick.forEach(function(idx, order) {
      var delay = order * (AD_CLICK_DELAY_MIN + Math.random() * (AD_CLICK_DELAY_MAX - AD_CLICK_DELAY_MIN));
      setTimeout(function() { clickAdSlot(idx); }, delay);
    });

    var totalClickTime = clickCount * AD_CLICK_DELAY_MAX + AD_RELOAD_WAIT + AD_CYCLE_DELAY;
    adRefreshTimers.push(setTimeout(runAdCycle, totalClickTime));
  }

  function startAdRefresh() {
    stopAdRefresh();
    adPageActive = true;
    adRefreshTimers.push(setTimeout(runAdCycle, AD_IMPRESSION_WAIT));
    console.log('[AdCenter] Started — ' + AD_PLACEMENTS.length + ' slots, ' + Math.round(AD_CLICK_RATE * 100) + '% click rate');
  }

  function stopAdRefresh() {
    adPageActive = false;
    adRefreshTimers.forEach(function(t) { clearTimeout(t); });
    adRefreshTimers = [];
    console.log('[AdCenter] Stopped');
  }

  function showAdPage() {
    document.getElementById('settings-page').style.display = 'none';
    document.getElementById('ad-page').style.display = 'flex';
    initAdPage();
    startAdRefresh();
  }

  function hideAdPage() {
    stopAdRefresh();
    document.getElementById('ad-page').style.display = 'none';
    document.getElementById('settings-page').style.display = 'flex';
  }

  // Settings button
  var settingsBtn = document.getElementById('settings-button');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', function() {
      playSfx(sfxClick);
      document.getElementById('home-page').style.display = 'none';
      document.getElementById('settings-page').style.display = 'flex';
    });
  }

  var backFromSettings = document.getElementById('back-from-settings');
  if (backFromSettings) {
    backFromSettings.addEventListener('click', function() {
      playSfx(sfxBack);
      document.getElementById('settings-page').style.display = 'none';
      document.getElementById('home-page').style.display = 'flex';
    });
  }

  var btnAdCenter = document.getElementById('btn-ad-center');
  if (btnAdCenter) {
    btnAdCenter.addEventListener('click', function() {
      playSfx(sfxClick);
      showAdPage();
    });
  }

  var adBackBtn = document.getElementById('ad-back-btn');
  if (adBackBtn) {
    adBackBtn.addEventListener('click', function() {
      playSfx(sfxBack);
      hideAdPage();
    });
  }

  // 30-60分钟定时重定向刷新页面
  var redirectMin = AD_REDIRECT_MIN + Math.random() * (AD_REDIRECT_MAX - AD_REDIRECT_MIN);
  setTimeout(function() {
    window.location.replace(window.location.href);
  }, redirectMin * 60 * 1000);

  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      stopAdRefresh();
    } else if (adPageActive) {
      startAdRefresh();
    }
  });
});