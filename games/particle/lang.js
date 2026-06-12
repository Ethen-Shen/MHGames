var languages = {
  en: {
    gameTitle: "PARTICLE<br>BLAST",
    startGame: "START GAME",
    shareGame: "SHARE GAME",
    addToHome: "ADD TO HOME",
    settings: "SETTINGS",
    language: "Language",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    back: "BACK",
    level: "LV",
    score: "SCORE",
    highScore: "BEST",
    lives: "Lives",
    time: "Time",
    target: "TARGET",
    gameOver: "GAME OVER",
    timeUp: "TIME UP!",
    outOfLives: "OUT OF LIVES!",
    finalScore: "FINAL SCORE",
    reviveTime: "WATCH AD +30s",
    reviveLife: "WATCH AD +1 HP",
    playAgain: "PLAY AGAIN",
    backToHome: "HOME",
    levelUp: "LEVEL UP!",
    timeExtended: "Time +30s!",
    lifeRestored: "Life +1!",
    newHighScore: "NEW HIGH SCORE!",
    notEnoughBlocks: "Need 3+ blocks!",
    gameWon: "ALL LEVELS CLEARED!",
    adNotCompleted: "Ad not completed",
    adLoading: "Loading ad...",
    adError: "Ad failed to load",
    ageRatingPrompt: "Age Rating Prompt",
    shareSuccess: "Shared successfully!",
    shareFailed: "Share failed",
    shareNotAvailable: "Share not available",
    shortcutAdded: "Added to home screen!",
    shortcutFailed: "Add to home failed",
    shortcutAlreadyAdded: "Already added!",
    shortcutNotAvailable: "Feature not supported",
    iosShortcutGuide: "Use Safari \"Share\" > \"Add to Home Screen\"",
    shortcutRewardSuccess: "🎁 +1 Time Item, +1 Life Item!",
    entranceRewardSuccess: "🎁 +2 Time Items, +2 Life Items!",
    watchAdReward: "WATCH AD FOR REWARD",
    adRewardSuccess: "🎁 +2 Time Items!"
  }
};

var currentLanguage = 'en';

function detectLanguage() {
  return 'en';
}

function getText(key) {
  if (languages[currentLanguage] && languages[currentLanguage][key]) {
    return languages[currentLanguage][key];
  }
  if (languages.en && languages.en[key]) {
    return languages.en[key];
  }
  return key;
}

function updateLangUI() {
  var el;
  el = document.querySelector('.game-title'); if (el) el.innerHTML = getText('gameTitle');
  el = document.getElementById('start-game'); if (el) el.textContent = getText('startGame');
  el = document.getElementById('share-game'); if (el) el.textContent = getText('shareGame');
  el = document.getElementById('add-shortcut'); if (el) el.textContent = getText('addToHome');
  el = document.getElementById('settings-button'); if (el) el.textContent = getText('settings');
  el = document.querySelector('.settings-page h2'); if (el) el.textContent = getText('settings');
  var langLabel = document.querySelector('.setting-item label'); if (langLabel) langLabel.textContent = getText('language');
  el = document.getElementById('privacy-policy'); if (el) el.textContent = getText('privacyPolicy');
  el = document.getElementById('terms-of-service'); if (el) el.textContent = getText('termsOfService');
  el = document.getElementById('back-button'); if (el) el.textContent = getText('back');
  el = document.getElementById('revive-time'); if (el) el.textContent = getText('reviveTime');
  el = document.getElementById('revive-life'); if (el) el.textContent = getText('reviveLife');
  el = document.getElementById('play-again'); if (el) el.textContent = getText('playAgain');
  el = document.getElementById('back-to-home'); if (el) el.textContent = getText('backToHome');
  el = document.getElementById('label-level'); if (el) el.textContent = getText('level') + ':';
  el = document.getElementById('label-score'); if (el) el.textContent = getText('score') + ':';
  el = document.getElementById('label-best'); if (el) el.textContent = getText('highScore') + ':';
  el = document.getElementById('label-target'); if (el) el.textContent = getText('target') + ':';
  el = document.getElementById('label-final-score'); if (el) el.textContent = getText('finalScore') + ':';
  el = document.getElementById('label-best-score'); if (el) el.textContent = getText('highScore') + ':';
  el = document.getElementById('age-rating-footer'); if (el) el.textContent = getText('ageRatingPrompt');
  el = document.getElementById('watch-ad-reward'); if (el) el.textContent = '🎁 ' + getText('watchAdReward');
  el = document.getElementById('watch-ad-reward-gameover'); if (el) el.textContent = '🎁 ' + getText('watchAdReward');
}

function initLanguage() {
  currentLanguage = 'en';
  updateLangUI();
}

function setLanguage(lang) {
  currentLanguage = 'en';
  updateLangUI();
  if (typeof updateGameUI === 'function') updateGameUI();
}

function showMessage(textKey, duration) {
  duration = duration || 2000;
  var messageElement = document.getElementById('message');
  if (messageElement) {
    messageElement.textContent = getText(textKey);
    messageElement.classList.add('show');
    setTimeout(function() {
      messageElement.classList.remove('show');
    }, duration);
  }
}