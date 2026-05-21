var languages = {
  en: {
    gameTitle: "Neon2048",
    classicMode: "CLASSIC",
    challengeMode: "CHALLENGE",
    shareGame: "SHARE GAME",
    addToHome: "ADD TO HOME",
    settings: "SETTINGS",
    play: "PLAY",
    language: "Language",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    back: "BACK",
    score: "SCORE",
    highScore: "BEST",
    mode: "MODE",
    target: "TARGET",
    addBlock: "▶️ Watch Ad + BLOCK",
    deleteBlock: "▶️ Watch Ad - BLOCK",
    restart: "RESTART",
    home: "HOME",
    gameOver: "GAME OVER",
    youWin: "YOU WIN!",
    finalScore: "FINAL SCORE",
    playAgain: "PLAY AGAIN",
    backToHome: "HOME",
    newHighScore: "NEW HIGH SCORE!",
    addBlockHint: "Tap empty cell to add block",
    deleteBlockHint: "Tap block to delete",
    watchAd: "Watch ad to unlock",
    notEmpty: "Cell not empty!",
    noBlock: "No block here!",
    inactivityHint: "Stuck? Try -BLOCK!",
    adLoading: "Loading ad...",
    adNotCompleted: "Ad not completed",
    shareSuccess: "Shared successfully!",
    shareFailed: "Share failed",
    shareNotAvailable: "Share not available",
    shortcutAdded: "Added to home screen!",
    shortcutFailed: "Add to home failed",
    shortcutAlreadyAdded: "Already added!",
    shortcutNotAvailable: "Feature not supported",
    iosShortcutGuide: "Use Safari \"Share\" > \"Add to Home Screen\""
  }
};
var currentLanguage = 'en';
function detectLanguage() {
  if (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user) {
    var lc = Telegram.WebApp.initDataUnsafe.user.language_code;
    if (lc && languages[lc]) return lc;
    var l = lc ? lc.split('-')[0] : '';
    if (l && languages[l]) return l;
  }
  if (navigator && navigator.language) { var l = navigator.language.split('-')[0]; if (languages[l]) return l; }
  return 'en';
}
function getText(key) {
  if (languages[currentLanguage] && languages[currentLanguage][key]) return languages[currentLanguage][key];
  if (languages.en && languages.en[key]) return languages.en[key];
  return key;
}
function updateLangUI() {
  var el;
  el = document.querySelector('.game-title'); if (el) el.textContent = getText('gameTitle');
  el = document.getElementById('play-button'); if (el) el.textContent = getText('play');
  el = document.getElementById('classic-mode'); if (el) el.textContent = getText('classicMode');
  el = document.getElementById('challenge-mode'); if (el) el.textContent = getText('challengeMode');
  el = document.getElementById('share-game'); if (el) el.textContent = getText('shareGame');
  el = document.getElementById('add-shortcut'); if (el) el.textContent = getText('addToHome');
  el = document.getElementById('settings-button'); if (el) el.textContent = getText('settings');
  el = document.querySelector('.settings-page h2'); if (el) el.textContent = getText('settings');
  el = document.querySelector('label[for="language"]'); if (el) el.textContent = getText('language');
  el = document.getElementById('privacy-policy'); if (el) el.textContent = getText('privacyPolicy');
  el = document.getElementById('terms-of-service'); if (el) el.textContent = getText('termsOfService');
  el = document.getElementById('back-button'); if (el) el.textContent = getText('back');
  el = document.getElementById('delete-block'); if (el) el.textContent = getText('deleteBlock');
  if (typeof updatePropButtons === 'function') updatePropButtons();
  el = document.getElementById('restart-button'); if (el) el.textContent = getText('restart');
  el = document.getElementById('home-button'); if (el) el.textContent = getText('home');
  el = document.getElementById('play-again'); if (el) el.textContent = getText('playAgain');
  el = document.getElementById('back-to-home'); if (el) el.textContent = getText('backToHome');
  el = document.getElementById('label-score'); if (el) el.textContent = getText('score') + ':';
  el = document.getElementById('label-best'); if (el) el.textContent = getText('highScore') + ':';
  el = document.getElementById('label-mode'); if (el) el.textContent = getText('mode') + ':';
  el = document.getElementById('label-target'); if (el) el.textContent = getText('target') + ':';
  el = document.getElementById('label-final-score'); if (el) el.textContent = getText('finalScore') + ':';
  el = document.getElementById('label-best-score'); if (el) el.textContent = getText('highScore') + ':';
}
function initLanguage() {
  var saved = null;
  try { saved = localStorage.getItem('game2048Language'); } catch(e) {}
  if (saved && languages[saved]) currentLanguage = saved;
  else currentLanguage = detectLanguage();
  var sel = document.getElementById('language');
  if (sel) {
    sel.value = currentLanguage;
    sel.addEventListener('change', function(e) {
      currentLanguage = e.target.value;
      try { localStorage.setItem('game2048Language', currentLanguage); } catch(err) {}
      updateLangUI();
      if (typeof updateGameUI === 'function') updateGameUI();
    });
  }
}

function changeLanguage(lang) {
  if (languages[lang]) {
    currentLanguage = lang;
    try { localStorage.setItem('game2048Language', currentLanguage); } catch(err) {}
    updateLangUI();
    if (typeof updateGameUI === 'function') updateGameUI();
  }
}