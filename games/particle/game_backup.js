var SIZE = 4;
var grid = [];
var currentScore = 0;
var highScore = 0;
var gameMode = 'classic';
var isGameOver = false;
var isAddingBlock = false;
var isDeletingBlock = false;
var isUsingProp = false;
var isReviving = false;
var addBlockValue = 2;
var canvas, ctx;
var cellSize = 80;
var challengeLevel = 0;
var challengeTargets = [128, 256, 512, 1024, 2048, 4096];
var gameOverCount = 0;
var lastActionTime = Date.now();
var inactivityTimer = null;
var currentLevel = 0;
var levelTargets = [256, 512, 1024, 2048, 4096];
var isEndlessMode = false;
var maxTile = 0;
var totalTiles = 0;
var historyMaxTile = 0;
var historyTotalTiles = 0;

var REWARDED_AD_UNIT_ID = 'ad7627206991161133064';
var INTERSTITIAL_AD_UNIT_ID = 'ad7625964482997110792';

var userOpenId = null;
var accessToken = null;
var isLoggedIn = false;

function tiktokLogin() {
  if (typeof TTMinis !== 'undefined' && TTMinis.game && TTMinis.game.login) {
    TTMinis.game.login({
      success: function(result) {
        if (result && result.code) {
          isLoggedIn = true;
        }
      },
      fail: function(error) {
        isLoggedIn = false;
      }
    });
  }
}

function checkLoginStatus() {
  if (typeof TTMinis !== 'undefined' && TTMinis.game && TTMinis.game.getLoginStatus) {
    TTMinis.game.getLoginStatus({
      success: function(result) {
        if (result && result.isLoggedIn) {
          isLoggedIn = true;
        } else {
          isLoggedIn = false;
        }
      },
      fail: function(error) {
        isLoggedIn = false;
      }
    });
  }
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
  if (btn) btn.textContent = soundMuted ? '馃攪' : '馃摙';
  if (soundMuted) stopBgMusic();
  else if (!isGameOver) startBgMusic();
}

function showAd(callback) {
  if (isUsingProp) return;
  isUsingProp = true;
  var adHandled = false;
  var safetyTimer = null;
  function handleReward() {
    if (adHandled) return;
    adHandled = true;
    isUsingProp = false;
    if (safetyTimer) clearTimeout(safetyTimer);
    callback();
  }
  function handleFallback() {
    if (adHandled) return;
    adHandled = true;
    isUsingProp = false;
    if (safetyTimer) clearTimeout(safetyTimer);
  }
  function handleAdClose(res) {
    if (adHandled) return;
    adHandled = true;
    isUsingProp = false;
    if (safetyTimer) clearTimeout(safetyTimer);
    if (res && typeof res === 'object' && res.isEnded === true) {
      handleReward();
    }
  }
  try {
    if (typeof TTMinis !== 'undefined' && TTMinis.game && TTMinis.game.createRewardedVideoAd) {
      var ad = TTMinis.game.createRewardedVideoAd({ adUnitId: REWARDED_AD_UNIT_ID });
      ad.onClose(handleAdClose);
      ad.onError(handleFallback);
      safetyTimer = setTimeout(handleFallback, 60000);
      ad.show().then(function() {
        if (safetyTimer) clearTimeout(safetyTimer);
      }).catch(function(err) {
        handleFallback();
      });
      return;
    }
  } catch (e) {}
  isUsingProp = false;
}

function showInterstitialAd(callback) {
  try {
    if (typeof TTMinis !== 'undefined' && TTMinis.game && TTMinis.game.createInterstitialAd) {
      var interstitialAd = TTMinis.game.createInterstitialAd({ adUnitId: INTERSTITIAL_AD_UNIT_ID });
      interstitialAd.onClose(function() { if (callback) callback(); });
      interstitialAd.onError(function() { if (callback) callback(); });
      interstitialAd.show();
      return;
    }
  } catch (e) {}
  if (callback) callback();
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
  isAddingBlock = false;
  isDeletingBlock = false;
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
  canvas.removeEventListener('click', handleCanvasClick);
  canvas.removeEventListener('touchstart', handleTouchStart);
  canvas.removeEventListener('touchend', handleTouchEnd);
  canvas.addEventListener('click', handleCanvasClick);
  canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
  canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
  document.removeEventListener('keydown', handleKeyDown);
  document.addEventListener('keydown', handleKeyDown);
  startBgMusic();
  document.getElementById('home-page').style.display = 'none';
  document.getElementById('level-select-page').style.display = 'none';
  document.getElementById('game-over-page').style.display = 'none';
  document.getElementById('game-page').style.display = 'flex';
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

function handlePropClick(r, c) {
  if (isAddingBlock) {
    if (grid[r][c] === 0) {
      grid[r][c] = addBlockValue;
      isAddingBlock = false;
      drawGame(); updateUI();
    }
    return;
  }
  if (isDeletingBlock) {
    if (grid[r][c] !== 0) {
      grid[r][c] = 0;
      isDeletingBlock = false;
      drawGame(); updateUI();
    }
    return;
  }
}

function handleCanvasClick(e) {
  lastActionTime = Date.now();
  var rect = canvas.getBoundingClientRect();
  var c = Math.floor((e.clientX - rect.left) / cellSize);
  var r = Math.floor((e.clientY - rect.top) / cellSize);
  if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return;
  if (isAddingBlock || isDeletingBlock) {
    handlePropClick(r, c);
    return;
  }
}

var touchStartX, touchStartY;
function handleTouchStart(e) {
  if (isAddingBlock || isDeletingBlock) {
    if (e.touches.length > 0) { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; }
    e.preventDefault(); return;
  }
  if (e.touches.length > 0) { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY; }
  e.preventDefault();
}

function handleTouchEnd(e) {
  if (isAddingBlock || isDeletingBlock) {
    if (e.changedTouches.length > 0) {
      var touch = e.changedTouches[0];
      var rect = canvas.getBoundingClientRect();
      var c = Math.floor((touch.clientX - rect.left) / cellSize);
      var r = Math.floor((touch.clientY - rect.top) / cellSize);
      if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) handlePropClick(r, c);
    }
    e.preventDefault(); return;
  }
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
  if (isGameOver || isAddingBlock || isDeletingBlock) return;
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

function addBlockAction() {
  playSfx(sfxClick);
  showAd(function() {
    var maxTile = getMaxTile();
    addBlockValue = maxTile > 8 ? maxTile / 2 : (Math.random() < 0.5 ? 2 : 4);
    isAddingBlock = true;
  });
}

function deleteBlockAction() {
  playSfx(sfxClick);
  showAd(function() {
    isDeletingBlock = true;
  });
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
    target = 'None';
  }
  el = document.getElementById('target-tile'); if (el) el.textContent = target;
  if (typeof updateLangUI === 'function') updateLangUI();
}

function updateUI() { updateGameUI(); }

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
  
  var el;
  el = document.getElementById('game-over-title');
  if (el) {
    if (isWin) { el.textContent = getText('youWin'); el.className = 'cyber-title win'; }
    else { el.textContent = getText('gameOver'); el.className = 'cyber-title'; }
  }
  el = document.getElementById('final-score'); if (el) el.textContent = currentScore;
  el = document.getElementById('game-over-high-score'); if (el) el.textContent = highScore;
  el = document.getElementById('max-tile'); if (el) el.textContent = maxTile;
  el = document.getElementById('total-tile'); if (el) el.textContent = totalTiles;
  document.getElementById('game-page').style.display = 'none';
  document.getElementById('game-over-page').style.display = 'flex';
  stopBgMusic();
  gameOverCount++;
  if (gameOverCount >= 2) {
    gameOverCount = 0;
    showInterstitialAd(function() {});
  }
}

function saveScore(score) {
  var hs = getHighScore();
  if (score > hs) { try { localStorage.setItem('neon2048HighScore', score); } catch (e) {} return true; }
  return false;
}

function getHighScore() {
  try { var hs = localStorage.getItem('particleHighScore'); return hs ? parseInt(hs) : 0; } catch (e) { return 0; }
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

function saveHistoryMaxTile(tile) {
  try { localStorage.setItem('neon2048MaxTile', tile); } catch (e) {}
}

function getHistoryMaxTile() {
  try { var mt = localStorage.getItem('neon2048MaxTile'); return mt ? parseInt(mt) : 0; } catch (e) { return 0; }
}

function saveHistoryTotalTiles(total) {
  try { localStorage.setItem('neon2048TotalTiles', total); } catch (e) {}
}

function getHistoryTotalTiles() {
  try { var tt = localStorage.getItem('neon2048TotalTiles'); return tt ? parseInt(tt) : 0; } catch (e) { return 0; }
}

function reportLoadingProgress(progress) {
  if (typeof TTMinis !== 'undefined' && TTMinis.game && TTMinis.game.setLoadingProgress) {
    TTMinis.game.setLoadingProgress({ progress: progress });
  }
}

var bgAnimFrame = null;
var fallingNumbers = [];
var bgCanvas, bgCtx;

function initBgAnimation() {
  bgCanvas = document.getElementById('bg-canvas');
  if (!bgCanvas) return;
  bgCtx = bgCanvas.getContext('2d');
  resizeBgCanvas();
  window.addEventListener('resize', resizeBgCanvas);
  for (var i = 0; i < 18; i++) {
    fallingNumbers.push(createFallingNumber(true));
  }
  animateBg();
}

function resizeBgCanvas() {
  if (!bgCanvas) return;
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}

function createFallingNumber(randomY) {
  var nums = [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
  var value = nums[Math.floor(Math.random() * nums.length)];
  var alpha = 0.08 + Math.random() * 0.12;
  var cellSize = 28 + Math.random() * 24;
  if (value >= 128) cellSize += 8;
  if (value >= 1024) cellSize += 6;
  var hue = (value <= 4) ? 220 : (value <= 16) ? 200 : (value <= 64) ? 180 : (value <= 256) ? 160 : 140;
  var lightness = 15 + Math.floor(Math.random() * 10);
  var fontSize = cellSize * 0.35;
  if (value >= 128) fontSize = cellSize * 0.32;
  if (value >= 1024) fontSize = cellSize * 0.28;
  return {
    x: Math.random() * window.innerWidth,
    y: randomY ? Math.random() * window.innerHeight : -cellSize,
    value: value,
    alpha: alpha,
    cellSize: cellSize,
    fontSize: fontSize,
    speed: 0.3 + Math.random() * 0.6,
    drift: (Math.random() - 0.5) * 0.3,
    rotation: (Math.random() - 0.5) * 0.15,
    hue: hue,
    bgColor: 'hsl(' + hue + ', 60%, ' + lightness + '%)',
    borderColor: 'hsl(' + hue + ', 80%, 50%)',
    textColor: 'hsl(' + hue + ', 80%, 70%)'
  };
}

function animateBg() {
  if (!bgCtx || !bgCanvas) return;
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  for (var i = 0; i < fallingNumbers.length; i++) {
    var n = fallingNumbers[i];
    n.y += n.speed;
    n.x += n.drift;
    if (n.y > bgCanvas.height + n.cellSize) {
      fallingNumbers[i] = createFallingNumber(false);
      continue;
    }
    if (n.x < -50) n.x = bgCanvas.width + 50;
    if (n.x > bgCanvas.width + 50) n.x = -50;
    bgCtx.save();
    bgCtx.globalAlpha = n.alpha;
    bgCtx.translate(n.x, n.y);
    bgCtx.rotate(n.rotation);
    var half = n.cellSize / 2;
    var r = 4;
    bgCtx.beginPath();
    bgCtx.moveTo(-half + r, -half);
    bgCtx.lineTo(half - r, -half);
    bgCtx.quadraticCurveTo(half, -half, half, -half + r);
    bgCtx.lineTo(half, half - r);
    bgCtx.quadraticCurveTo(half, half, half - r, half);
    bgCtx.lineTo(-half + r, half);
    bgCtx.quadraticCurveTo(-half, half, -half, half - r);
    bgCtx.lineTo(-half, -half + r);
    bgCtx.quadraticCurveTo(-half, -half, -half + r, -half);
    bgCtx.closePath();
    bgCtx.fillStyle = n.bgColor;
    bgCtx.fill();
    bgCtx.strokeStyle = n.borderColor;
    bgCtx.lineWidth = 1.5;
    bgCtx.stroke();
    bgCtx.shadowColor = n.textColor;
    bgCtx.shadowBlur = 6;
    bgCtx.font = 'bold ' + n.fontSize + 'px "Courier New", monospace';
    bgCtx.textAlign = 'center';
    bgCtx.textBaseline = 'middle';
    bgCtx.fillStyle = n.textColor;
    bgCtx.fillText(n.value, 0, 0);
    bgCtx.restore();
  }
  bgAnimFrame = requestAnimationFrame(animateBg);
}

document.addEventListener('DOMContentLoaded', function() {
  setupAudio();
  initLanguage();
  checkLoginStatus();
  checkEntryMethod();
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
  document.getElementById('home-button').addEventListener('click', function() { playSfx(sfxBack); stopBgMusic(); document.getElementById('game-page').style.display = 'none'; document.getElementById('home-page').style.display = 'flex'; });
  document.getElementById('play-again').addEventListener('click', function() { playSfx(sfxClick); document.getElementById('game-over-page').style.display = 'none'; document.getElementById('game-page').style.display = 'flex'; initGame(gameMode, currentLevel); });
  document.getElementById('back-to-home').addEventListener('click', function() { playSfx(sfxBack); document.getElementById('game-over-page').style.display = 'none'; document.getElementById('home-page').style.display = 'flex'; });
  
  // Revive button event listener
  var reviveBtn = document.getElementById('revive-game');
  if (reviveBtn) {
    reviveBtn.addEventListener('click', function() { playSfx(sfxClick); reviveGame(); });
  }
  
  // Language switch buttons
  var langEnBtn = document.getElementById('lang-en');
  var langJaBtn = document.getElementById('lang-ja');
  if (langEnBtn) {
    langEnBtn.addEventListener('click', function() {
      playSfx(sfxClick);
      changeLanguage('en');
    });
  }
  if (langJaBtn) {
    langJaBtn.addEventListener('click', function() {
      playSfx(sfxClick);
      changeLanguage('ja');
    });
  }
  
  // Add to Home Screen
  // Add to Home Screen
  var shortcutBtn = document.getElementById('add-shortcut');
  if (shortcutBtn) {
    shortcutBtn.addEventListener('click', function() {
      playSfx(sfxClick);
      try {
        if (typeof TTMinis !== 'undefined' && TTMinis.game && TTMinis.game.addShortcut) {
          TTMinis.game.addShortcut({
            success: function() {
              showMessage('Shortcut added successfully!');
            },
            fail: function(err) {}
          });
        }
      } catch (e) {}
    });
  }

  var sidebarBtn = document.getElementById('add-to-sidebar');
  if (sidebarBtn) {
    sidebarBtn.addEventListener('click', function() {
      playSfx(sfxClick);
      try {
        if (typeof TTMinis !== 'undefined' && TTMinis.game && TTMinis.game.startEntranceMission) {
          TTMinis.game.startEntranceMission({
            success: function(res) {
              showMessage('Sidebar added successfully!');
            },
            fail: function(err) {}
          });
        }
      } catch (e) {}
    });
  }

  initBgAnimation();
});

// Check entry method and handle rewards
function checkEntryMethod() {
  if (typeof TTMinis !== 'undefined' && TTMinis.game && TTMinis.game.getLaunchOptionsSync) {
    try {
      var launchOptions = TTMinis.game.getLaunchOptionsSync();
      var entrySource = 'unknown';
      
      if (launchOptions.scene && (launchOptions.scene.includes('sidebar') || launchOptions.scene === 'entrance')) {
        entrySource = 'sidebar';
      } else if (launchOptions.query && (launchOptions.query.from === 'shortcut' || launchOptions.query.source === 'shortcut')) {
        entrySource = 'shortcut';
      }
      
      if (entrySource === 'sidebar') {
        getEntranceMissionReward();
      } else if (entrySource === 'shortcut') {
        getShortcutMissionReward();
      } else {
        getShortcutMissionReward();
      }
    } catch (e) {
      getShortcutMissionReward();
    }
  } else {
    getShortcutMissionReward();
  }
}

// Get personal homepage sidebar reward (should be called when entering from sidebar)
function getEntranceMissionReward() {
  if (typeof TTMinis !== 'undefined' && TTMinis.game && TTMinis.game.getEntranceMissionReward) {
    var today = new Date().toDateString();
    var lastRewardDate = localStorage.getItem('lastEntranceRewardDate');
    if (lastRewardDate === today) {
      return;
    }
    
    TTMinis.game.getEntranceMissionReward({
      success: function(res) {
        if (res && res.canReceiveReward) {
          localStorage.setItem('lastEntranceRewardDate', today);
          showMessage('Sidebar entry reward claimed!');
        }
      },
      fail: function(err) {}
    });
  }
}

// Get desktop shortcut reward (should be called when entering from desktop shortcut)
function getShortcutMissionReward() {
  if (typeof TTMinis !== 'undefined' && TTMinis.game && TTMinis.game.getShortcutMissionReward) {
    var today = new Date().toDateString();
    var lastRewardDate = localStorage.getItem('lastShortcutRewardDate');
    if (lastRewardDate === today) {
      return;
    }
    
    TTMinis.game.getShortcutMissionReward({
      success: function(res) {
        if (res && res.canReceiveReward) {
          localStorage.setItem('lastShortcutRewardDate', today);
          showMessage('Daily reward claimed!');
        }
      },
      fail: function(err) {}
    });
  }
}



