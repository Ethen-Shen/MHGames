(function () {
  "use strict";

  window.LANG = {
    zh: {
      play: "\u5f00\u59cb\u6e38\u620f",
      signin: "\u6bcf\u65e5\u7b7e\u5230",
      shop: "\u5546\u5e97",
      settings: "\u8bbe\u7f6e",
      level: "\u5173\u5361",
      time: "\u7528\u65f6",
      moves: "\u6b65\u6570",
      rules: "\u6bcf\u884c\u3001\u6bcf\u5217\u3001\u6bcf\u4e2a\u8272\u5757\u5404\u653e 1 \u5934\u725b\uff0c\u725b\u4e0d\u80fd\u8fde\u7740\u5468\u56f4 8 \u683c\u3002",
      modeCow: "\u653e\u725b",
      modeMark: "\u6807\u8bb0",
      hint: "\u63d0\u793a",
      check: "\u68c0\u67e5",
      clearWrong: "\u6e05\u9519",
      undo: "\u64a4\u9500",
      notEnough: "\u9053\u5177\u4e0d\u8db3",
      checkin: "\u7b7e\u5230",
      checked: "\u5df2\u7b7e\u5230",
      day1: "\u7b2c1\u5929",
      day2: "\u7b2c2\u5929",
      day3: "\u7b2c3\u5929",
      day4: "\u7b2c4\u5929",
      day5: "\u7b2c5\u5929",
      day6: "\u7b2c6\u5929",
      day7: "\u7b2c7\u5929",
      rewards: "\u5956\u52b1",
      about: "\u5173\u4e8e",
      pause: "\u6682\u505c",
      continue: "\u7ee7\u7eed",
      restart: "\u91cd\u73a9",
      home: "\u56de\u9996\u9875",
      victory: "\u901a\u5173\uff01",
      gameOver: "\u8fd8\u5dee\u4e00\u70b9",
      next: "\u4e0b\u4e00\u5173",
      again: "\u518d\u6765\u4e00\u5c40",
      levelLabel: "\u5173\u5361",
      findCount: "\u725b",
      back: "\u8fd4\u56de",
      language: "\u8bed\u8a00",
      chinese: "\u4e2d\u6587",
      english: "English",
      selectLevel: "\u9009\u62e9\u5173\u5361",
      maxLevel: "\u6700\u9ad8\u5173\u5361",
      reward: "\u5956\u52b1",
      watchAd: "\u770b\u5e7f\u544a\u83b7\u53d6",
      goShop: "\u53bb\u5546\u5e97",
      revive: "\u770b\u5e7f\u544a\u7ee7\u7eed",
      found: "\u5df2\u5b8c\u6210",
      locked: "\u672a\u89e3\u9501",
      addToHome: "\u6dfb\u52a0\u5230\u4e3b\u5c4f\u5e55",
      title: "\u627e\u725b",
      titleEn: "Find the Cow",
      loading: "\u52a0\u8f7d\u4e2d",
      aboutText: "MHGames \u51fa\u54c1 · v2.0",
      confirm: "\u786e\u8ba4",
      cancel: "\u53d6\u6d88",
      got: "\u5df2\u83b7\u5f97",
      purchased: "\u8d2d\u4e70\u6210\u529f",
      buy: "\u8d2d\u4e70",
      newPlayer: "\u65b0\u624b\u5305",
      advance: "\u8fdb\u9636\u5305",
      luxury: "\u8c6a\u534e\u5305",
      stars: "\u661f\u661f",
      streak: "\u8fde\u7eed\u7b7e\u5230",
      days: "\u5929",
      solved: "\u68cb\u76d8\u6210\u7acb\uff01",
      incomplete: "\u8fd8\u6ca1\u653e\u5b8c\u6240\u6709\u725b",
      hasErrors: "\u6709\u51b2\u7a81\uff0c\u7ea2\u8272\u683c\u5b50\u9700\u8981\u8c03\u6574",
      noErrors: "\u76ee\u524d\u6ca1\u6709\u51b2\u7a81",
      noWrong: "\u6ca1\u6709\u9519\u8bef\u725b",
      noUndo: "\u6ca1\u6709\u53ef\u64a4\u9500\u7684\u6b65\u9aa4",
      hintDone: "\u63d0\u793a\u5df2\u653e\u7f6e",
      best: "\u6700\u4f73"
    },
    en: {
      play: "PLAY",
      signin: "DAILY",
      shop: "SHOP",
      settings: "SETTINGS",
      level: "LEVEL",
      time: "TIME",
      moves: "MOVES",
      rules: "Place one cow in every row, column, and color area. Cows cannot touch in the 8 surrounding cells.",
      modeCow: "COW",
      modeMark: "MARK",
      hint: "HINT",
      check: "CHECK",
      clearWrong: "CLEAN",
      undo: "UNDO",
      notEnough: "Not enough items",
      checkin: "CHECK IN",
      checked: "CHECKED",
      day1: "Day 1",
      day2: "Day 2",
      day3: "Day 3",
      day4: "Day 4",
      day5: "Day 5",
      day6: "Day 6",
      day7: "Day 7",
      rewards: "REWARD",
      about: "ABOUT",
      pause: "PAUSE",
      continue: "CONTINUE",
      restart: "RESTART",
      home: "HOME",
      victory: "CLEARED!",
      gameOver: "TRY AGAIN",
      next: "NEXT",
      again: "PLAY AGAIN",
      levelLabel: "LEVEL",
      findCount: "COWS",
      back: "BACK",
      language: "Language",
      chinese: "\u4e2d\u6587",
      english: "English",
      selectLevel: "SELECT LEVEL",
      maxLevel: "MAX LEVEL",
      reward: "REWARD",
      watchAd: "Watch Ad",
      goShop: "Shop",
      revive: "Watch Ad to Continue",
      found: "DONE",
      locked: "LOCKED",
      addToHome: "ADD TO HOME",
      title: "Find the Cow",
      titleEn: "Logic Cow Puzzle",
      loading: "Loading",
      aboutText: "MHGames · v2.0",
      confirm: "OK",
      cancel: "CANCEL",
      got: "GOT",
      purchased: "PURCHASED",
      buy: "BUY",
      newPlayer: "Starter Pack",
      advance: "Pro Pack",
      luxury: "Luxury Pack",
      stars: "Stars",
      streak: "STREAK",
      days: "d",
      solved: "Board solved!",
      incomplete: "Place all cows first",
      hasErrors: "Conflicts found. Adjust the red cells.",
      noErrors: "No conflicts so far",
      noWrong: "No wrong cows",
      noUndo: "Nothing to undo",
      hintDone: "Hint placed",
      best: "BEST"
    }
  };

  window.currentLang = "zh";

  function detectLanguage() {
    try {
      if (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user) {
        var lc = Telegram.WebApp.initDataUnsafe.user.language_code;
        if (lc) {
          var l = lc.toLowerCase().split("-")[0];
          if (l === "zh" || l === "en") return l;
        }
      }
    } catch (e) {}
    if (navigator && navigator.language) {
      var l2 = navigator.language.toLowerCase().split("-")[0];
      if (l2 === "zh" || l2 === "en") return l2;
    }
    return "zh";
  }

  window.t = function (key) {
    var dict = window.LANG[window.currentLang] || window.LANG.zh;
    return dict[key] || (window.LANG.zh && window.LANG.zh[key]) || key;
  };

  window.setLang = function (lang) {
    if (!window.LANG[lang]) lang = "zh";
    window.currentLang = lang;
    try { localStorage.setItem("findcow_lang", lang); } catch (e) {}
    var els = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < els.length; i++) {
      var key = els[i].getAttribute("data-i18n");
      if (key) els[i].textContent = window.t(key);
    }
    if (window.G && typeof window.G.refreshLang === "function") window.G.refreshLang();
  };

  window.initLang = function () {
    var saved = null;
    try { saved = localStorage.getItem("findcow_lang"); } catch (e) {}
    window.currentLang = saved && window.LANG[saved] ? saved : detectLanguage();
    window.setLang(window.currentLang);
  };
})();
