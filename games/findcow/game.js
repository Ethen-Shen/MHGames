/* Find the Cow - logic puzzle implementation */
(function () {
  "use strict";

  var COW = "\uD83D\uDC2E";
  var MARK = "\u00D7";
  var state = {
    currentPage: "loading-page",
    currentLevel: 1,
    maxLevel: 1,
    stars: 0,
    props: { magnifier: 1, addTime: 1, bomb: 1, freeze: 1 },
    signinDate: "",
    signinStreak: 0,
    level: null,
    board: [],
    history: [],
    mode: "cow",
    seconds: 0,
    moves: 0,
    paused: false,
    timerId: null,
    resultPending: false,
    resultIsWin: false
  };

  function lsGet(k, def) {
    try { var v = localStorage.getItem(k); return v === null ? def : v; } catch (e) { return def; }
  }
  function lsSet(k, v) {
    try { localStorage.setItem(k, v); } catch (e) {}
  }
  function lsGetJSON(k, def) {
    try { var v = localStorage.getItem(k); return v === null ? def : JSON.parse(v); } catch (e) { return def; }
  }
  function lsSetJSON(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
  }

  function loadState() {
    state.maxLevel = parseInt(lsGet("findcow_maxLevel", "1"), 10) || 1;
    state.stars = parseInt(lsGet("findcow_stars", "0"), 10) || 0;
    state.props = lsGetJSON("findcow_items", state.props);
    ["magnifier", "addTime", "bomb", "freeze"].forEach(function (k) {
      if (typeof state.props[k] !== "number") state.props[k] = 0;
    });
    state.signinDate = lsGet("findcow_signin_date", "");
    state.signinStreak = parseInt(lsGet("findcow_signin_streak", "0"), 10) || 0;
  }

  function saveState() {
    lsSet("findcow_maxLevel", String(state.maxLevel));
    lsSet("findcow_stars", String(state.stars));
    lsSetJSON("findcow_items", state.props);
  }

  function showPage(id) {
    ["loading-page", "home-page", "levels-page", "game-page", "pause-overlay", "result-page", "shop-page", "signin-page", "settings-page"].forEach(function (pid) {
      var el = document.getElementById(pid);
      if (el) el.style.display = pid === id ? "flex" : "none";
    });
    state.currentPage = id;
    refreshLang();
  }

  var audioCtx = null;
  function beep(freq, dur, type) {
    try {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      audioCtx = audioCtx || new Ctor();
      var o = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      o.type = type || "sine";
      o.frequency.value = freq;
      o.connect(g);
      g.connect(audioCtx.destination);
      var now = audioCtx.currentTime;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.start(now);
      o.stop(now + dur + 0.02);
    } catch (e) {}
  }
  function sndClick() { beep(620, 0.05, "square"); }
  function sndOk() { beep(880, 0.07, "triangle"); }
  function sndBad() { beep(160, 0.12, "sawtooth"); }
  function sndWin() { beep(660, 0.1); setTimeout(function () { beep(990, 0.14); }, 100); }

  function haptic(kind) {
    try {
      if (window.Telegram && Telegram.WebApp && Telegram.WebApp.HapticFeedback) {
        Telegram.WebApp.HapticFeedback.impactOccurred(kind || "light");
      }
    } catch (e) {}
  }

  function showAd(callback) {
    if (!window.adReward) {
      toast(window.t("watchAd") + " unavailable");
      return false;
    }
    try {
      window.adReward.show().then(function (result) {
        if (result && result.done && typeof callback === "function") callback();
      }).catch(function (e) {
        console.log("[AdsGram] reward error:", e);
      });
      return true;
    } catch (e) {
      console.log("[AdsGram] exception:", e);
      return false;
    }
  }

  function showInterstitialAd() {
    if (!window.adInterstitial) return;
    try { window.adInterstitial.show().catch(function () {}); } catch (e) {}
  }

  function toast(msg, actions) {
    var old = document.querySelector(".toast-msg");
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var el = document.createElement("div");
    el.className = "toast-msg";
    var text = document.createElement("div");
    text.textContent = msg;
    el.appendChild(text);
    if (actions && actions.length) {
      var row = document.createElement("div");
      row.className = "toast-actions";
      actions.forEach(function (action) {
        var btn = document.createElement("button");
        btn.className = "cyborg-btn-sm";
        btn.textContent = action.label;
        btn.addEventListener("click", function () {
          if (el.parentNode) el.parentNode.removeChild(el);
          action.onClick();
        });
        row.appendChild(btn);
      });
      el.appendChild(row);
    }
    document.body.appendChild(el);
    if (!actions) setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1700);
  }

  function emptyBoard(size) {
    var b = [];
    for (var r = 0; r < size; r++) {
      b[r] = [];
      for (var c = 0; c < size; c++) b[r][c] = 0;
    }
    return b;
  }

  function startLevel(id) {
    state.currentLevel = id;
    state.level = window.loadLevel(id);
    state.board = emptyBoard(state.level.size);
    state.history = [];
    state.mode = "cow";
    state.seconds = 0;
    state.moves = 0;
    state.paused = false;
    showPage("game-page");
    buildBoard();
    updateGameUI();
    updateModeUI();
    updatePropButtons();
    if (state.timerId) clearInterval(state.timerId);
    state.timerId = setInterval(function () {
      if (!state.paused && state.currentPage === "game-page") {
        state.seconds++;
        updateGameUI();
      }
    }, 1000);
  }

  function buildBoard() {
    var boardEl = document.getElementById("puzzle-board");
    if (!boardEl || !state.level) return;
    var n = state.level.size;
    boardEl.innerHTML = "";
    boardEl.style.gridTemplateColumns = "repeat(" + n + ", 1fr)";
    boardEl.style.gridTemplateRows = "repeat(" + n + ", 1fr)";
    boardEl.style.setProperty("--board-size", n);
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        var cell = document.createElement("button");
        cell.className = "puzzle-cell";
        cell.type = "button";
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.style.backgroundColor = state.level.palette[state.level.regions[r][c] % state.level.palette.length];
        cell.addEventListener("click", onCellClick);
        boardEl.appendChild(cell);
      }
    }
    renderBoard();
  }

  function onCellClick(e) {
    if (state.paused) return;
    var r = parseInt(e.currentTarget.dataset.r, 10);
    var c = parseInt(e.currentTarget.dataset.c, 10);
    pushHistory();
    if (state.mode === "mark") {
      state.board[r][c] = state.board[r][c] === 2 ? 0 : 2;
    } else {
      state.board[r][c] = state.board[r][c] === 1 ? 0 : 1;
    }
    state.moves++;
    sndClick();
    haptic("light");
    renderBoard();
    updateGameUI();
    var status = analyzeBoard();
    if (status.solved) setTimeout(winLevel, 180);
  }

  function pushHistory() {
    state.history.push(state.board.map(function (row) { return row.slice(); }));
    if (state.history.length > 80) state.history.shift();
  }

  function analyzeBoard() {
    var n = state.level.size;
    var bad = {};
    var cows = [];
    var rows = [], cols = [], regs = [];
    for (var i = 0; i < n; i++) { rows[i] = []; cols[i] = []; regs[i] = []; }
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (state.board[r][c] === 1) {
          var item = { r: r, c: c };
          cows.push(item);
          rows[r].push(item);
          cols[c].push(item);
          regs[state.level.regions[r][c]].push(item);
        }
      }
    }

    function mark(list) {
      if (list.length <= 1) return;
      list.forEach(function (it) { bad[it.r + "," + it.c] = true; });
    }
    rows.forEach(mark);
    cols.forEach(mark);
    regs.forEach(mark);

    for (var a = 0; a < cows.length; a++) {
      for (var b = a + 1; b < cows.length; b++) {
        if (Math.abs(cows[a].r - cows[b].r) <= 1 && Math.abs(cows[a].c - cows[b].c) <= 1) {
          bad[cows[a].r + "," + cows[a].c] = true;
          bad[cows[b].r + "," + cows[b].c] = true;
        }
      }
    }

    var complete = cows.length === n;
    for (var k = 0; k < n; k++) {
      if (rows[k].length !== 1 || cols[k].length !== 1 || regs[k].length !== 1) complete = false;
    }
    return { cows: cows.length, bad: bad, errors: Object.keys(bad).length, solved: complete && Object.keys(bad).length === 0 };
  }

  function renderBoard() {
    if (!state.level) return;
    var status = analyzeBoard();
    var cells = document.querySelectorAll(".puzzle-cell");
    for (var i = 0; i < cells.length; i++) {
      var r = parseInt(cells[i].dataset.r, 10);
      var c = parseInt(cells[i].dataset.c, 10);
      var v = state.board[r][c];
      cells[i].textContent = v === 1 ? COW : (v === 2 ? MARK : "");
      cells[i].classList.toggle("has-cow", v === 1);
      cells[i].classList.toggle("has-mark", v === 2);
      cells[i].classList.toggle("bad", !!status.bad[r + "," + c]);
      setBorders(cells[i], r, c);
    }
    var count = document.getElementById("cow-count");
    if (count) count.textContent = status.cows + " / " + state.level.size;
    var msg = document.getElementById("board-status");
    if (msg) {
      msg.textContent = status.errors ? window.t("hasErrors") : (status.cows === state.level.size ? window.t("noErrors") : window.t("rules"));
      msg.classList.toggle("error", status.errors > 0);
    }
  }

  function setBorders(cell, r, c) {
    var n = state.level.size;
    var rg = state.level.regions;
    cell.classList.toggle("edge-top", r === 0 || rg[r][c] !== rg[r - 1][c]);
    cell.classList.toggle("edge-right", c === n - 1 || rg[r][c] !== rg[r][c + 1]);
    cell.classList.toggle("edge-bottom", r === n - 1 || rg[r][c] !== rg[r + 1][c]);
    cell.classList.toggle("edge-left", c === 0 || rg[r][c] !== rg[r][c - 1]);
  }

  function fmtTime(s) {
    var m = Math.floor(s / 60);
    var ss = String(s % 60);
    if (ss.length < 2) ss = "0" + ss;
    return m + ":" + ss;
  }

  function updateGameUI() {
    var el = document.getElementById("game-level-num");
    if (el) el.textContent = state.currentLevel;
    el = document.getElementById("game-time");
    if (el) el.textContent = fmtTime(state.seconds);
    el = document.getElementById("move-count");
    if (el) el.textContent = state.moves;
    el = document.getElementById("home-max-level");
    if (el) el.textContent = state.maxLevel;
    el = document.getElementById("home-stars");
    if (el) el.textContent = state.stars;
  }

  function updateModeUI() {
    var cow = document.getElementById("mode-cow");
    var mark = document.getElementById("mode-mark");
    if (cow) cow.classList.toggle("active", state.mode === "cow");
    if (mark) mark.classList.toggle("active", state.mode === "mark");
  }

  function winLevel() {
    if (state.resultPending) return;
    var status = analyzeBoard();
    if (!status.solved) return;
    state.resultPending = true;
    clearInterval(state.timerId);
    sndWin();
    haptic("heavy");
    if (state.currentLevel >= state.maxLevel) state.maxLevel = Math.min(state.currentLevel + 1, window.totalLevels);
    var bonus = state.moves <= state.level.par ? 2 : 1;
    state.stars += bonus;
    saveState();
    showResultPage(true, bonus);
    setTimeout(showInterstitialAd, 700);
  }

  function showResultPage(isWin, bonus) {
    var title = document.getElementById("result-title");
    if (title) title.textContent = isWin ? window.t("victory") : window.t("gameOver");
    var found = document.getElementById("result-find");
    if (found) found.textContent = window.t("time") + ": " + fmtTime(state.seconds) + "   " + window.t("moves") + ": " + state.moves;
    var reward = document.getElementById("result-reward");
    if (reward) reward.textContent = isWin ? window.t("reward") + ": +" + bonus + " " + window.t("stars") : "";
    var next = document.getElementById("btn-next");
    if (next) next.style.display = isWin && state.currentLevel < window.totalLevels ? "block" : "none";
    var revive = document.getElementById("result-revive");
    if (revive) revive.style.display = "none";
    showPage("result-page");
  }

  function renderLevels() {
    var grid = document.getElementById("levels-grid");
    if (!grid) return;
    grid.innerHTML = "";
    for (var i = 1; i <= window.totalLevels; i++) {
      (function (id) {
        var btn = document.createElement("button");
        btn.className = "level-cell";
        btn.textContent = id;
        if (id < state.maxLevel) btn.classList.add("completed");
        else if (id === state.maxLevel) btn.classList.add("current");
        else btn.classList.add("locked");
        btn.addEventListener("click", function () {
          if (id > state.maxLevel) {
            toast(window.t("locked"));
            haptic("light");
            return;
          }
          sndClick();
          state.resultPending = false;
          startLevel(id);
        });
        grid.appendChild(btn);
      })(i);
    }
  }

  function checkBoard() {
    var status = analyzeBoard();
    if (status.solved) {
      winLevel();
    } else if (status.errors) {
      sndBad();
      haptic("medium");
      toast(window.t("hasErrors"));
    } else if (status.cows < state.level.size) {
      sndOk();
      toast(window.t("incomplete"));
    } else {
      sndOk();
      toast(window.t("noErrors"));
    }
    renderBoard();
  }

  function useHint() {
    for (var r = 0; r < state.level.size; r++) {
      var c = state.level.solution[r];
      if (state.board[r][c] !== 1) {
        pushHistory();
        state.board[r][c] = 1;
        state.moves++;
        sndOk();
        haptic("light");
        renderBoard();
        updateGameUI();
        toast(window.t("hintDone"));
        if (analyzeBoard().solved) setTimeout(winLevel, 180);
        return;
      }
    }
    toast(window.t("solved"));
  }

  function clearWrong() {
    var changed = false;
    pushHistory();
    for (var r = 0; r < state.level.size; r++) {
      for (var c = 0; c < state.level.size; c++) {
        if (state.board[r][c] === 1 && state.level.solution[r] !== c) {
          state.board[r][c] = 0;
          changed = true;
        }
      }
    }
    if (!changed) {
      state.history.pop();
      toast(window.t("noWrong"));
      return;
    }
    state.moves++;
    renderBoard();
    updateGameUI();
    sndOk();
  }

  function undo() {
    if (!state.history.length) {
      toast(window.t("noUndo"));
      return;
    }
    state.board = state.history.pop();
    renderBoard();
    updateGameUI();
    sndClick();
  }

  function useProp(kind) {
    if (kind === "addTime") {
      checkBoard();
      return;
    }
    if (kind === "freeze") {
      undo();
      return;
    }
    if ((state.props[kind] || 0) <= 0) {
      toast(window.t("notEnough"), [
        { label: window.t("watchAd"), onClick: function () { offerAdForProp(kind); } },
        { label: window.t("goShop"), onClick: function () { showPage("shop-page"); renderShop(); } }
      ]);
      return;
    }
    state.props[kind]--;
    saveState();
    updatePropButtons();
    if (kind === "magnifier") useHint();
    if (kind === "bomb") clearWrong();
  }

  function offerAdForProp(kind) {
    showAd(function () {
      state.props[kind] = (state.props[kind] || 0) + 1;
      saveState();
      updatePropButtons();
      toast("+1");
    });
  }

  function updatePropButtons() {
    var labels = { magnifier: "hint", addTime: "check", bomb: "clearWrong", freeze: "undo" };
    ["magnifier", "addTime", "bomb", "freeze"].forEach(function (k) {
      var count = document.getElementById("count-" + k);
      if (count) count.textContent = k === "addTime" || k === "freeze" ? "\u221e" : (state.props[k] || 0);
      var text = document.querySelector('.prop-btn[data-prop="' + k + '"] .prop-label');
      if (text) text.textContent = window.t(labels[k]);
      var btn = document.querySelector('.prop-btn[data-prop="' + k + '"]');
      if (btn) btn.classList.toggle("depleted", (k === "magnifier" || k === "bomb") && (state.props[k] || 0) <= 0);
    });
  }

  var SIGNIN_REWARDS = [
    { magnifier: 1 },
    { bomb: 1 },
    { magnifier: 1, bomb: 1 },
    { magnifier: 2 },
    { bomb: 2 },
    { magnifier: 2, bomb: 2 },
    { magnifier: 3, bomb: 3, stars: 3 }
  ];

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function rewardToString(rwd) {
    var parts = [];
    if (rwd.magnifier) parts.push("\uD83D\uDCA1x" + rwd.magnifier);
    if (rwd.bomb) parts.push("\uD83E\uDDF9x" + rwd.bomb);
    if (rwd.stars) parts.push("\u2605x" + rwd.stars);
    return parts.join(" ");
  }

  function renderSignin() {
    var grid = document.getElementById("signin-grid");
    if (!grid) return;
    grid.innerHTML = "";
    var today = todayKey();
    for (var i = 1; i <= 7; i++) {
      var cell = document.createElement("div");
      cell.className = "signin-cell";
      cell.innerHTML = '<span class="day-label">' + window.t("day" + i) + '</span><span class="day-reward">' + rewardToString(SIGNIN_REWARDS[i - 1]) + "</span>";
      if (i <= state.signinStreak) cell.classList.add("done");
      grid.appendChild(cell);
    }
    var sn = document.getElementById("signin-streak-num");
    if (sn) sn.textContent = state.signinStreak;
    var btn = document.getElementById("btn-checkin");
    if (btn) {
      btn.disabled = state.signinDate === today;
      btn.classList.toggle("cyborg-btn-disabled", state.signinDate === today);
      btn.textContent = state.signinDate === today ? window.t("checked") : window.t("checkin");
    }
  }

  function doSignin() {
    var today = todayKey();
    if (state.signinDate === today) {
      toast(window.t("checked"));
      return;
    }
    state.signinStreak = state.signinStreak >= 7 ? 1 : state.signinStreak + 1;
    var reward = SIGNIN_REWARDS[state.signinStreak - 1];
    if (reward.magnifier) state.props.magnifier += reward.magnifier;
    if (reward.bomb) state.props.bomb += reward.bomb;
    if (reward.stars) state.stars += reward.stars;
    state.signinDate = today;
    lsSet("findcow_signin_date", today);
    lsSet("findcow_signin_streak", String(state.signinStreak));
    saveState();
    renderSignin();
    updateGameUI();
    toast(window.t("rewards") + ": " + rewardToString(reward));
  }

  var SHOP_ITEMS = [
    { id: "starter", name: "newPlayer", price: 1, reward: { magnifier: 2, bomb: 1 } },
    { id: "pro", name: "advance", price: 3, reward: { magnifier: 4, bomb: 3 } },
    { id: "luxury", name: "luxury", price: 8, reward: { magnifier: 8, bomb: 8, stars: 2 } }
  ];

  function renderShop() {
    var list = document.getElementById("shop-list");
    if (!list) return;
    list.innerHTML = "";
    SHOP_ITEMS.forEach(function (item) {
      var card = document.createElement("div");
      card.className = "shop-card";
      card.innerHTML = '<div class="shop-name">' + window.t(item.name) + '</div><div class="shop-items">' + rewardToString(item.reward) + '</div><div class="shop-buy"><span class="shop-price">' + item.price + " " + window.t("stars") + '</span><button class="cyborg-btn-sm">' + window.t("buy") + "</button></div>";
      card.querySelector("button").addEventListener("click", function () { buyShopItem(item); });
      list.appendChild(card);
    });
  }

  function buyShopItem(item) {
    if (state.stars < item.price) {
      toast(window.t("notEnough"));
      return;
    }
    state.stars -= item.price;
    if (item.reward.magnifier) state.props.magnifier += item.reward.magnifier;
    if (item.reward.bomb) state.props.bomb += item.reward.bomb;
    if (item.reward.stars) state.stars += item.reward.stars;
    saveState();
    renderShop();
    updateGameUI();
    updatePropButtons();
    toast(window.t("purchased"));
  }

  function refreshLang() {
    updateGameUI();
    updateModeUI();
    updatePropButtons();
    if (state.level) renderBoard();
    var lz = document.getElementById("lang-zh");
    var le = document.getElementById("lang-en");
    if (lz && le) {
      lz.classList.toggle("active", window.currentLang === "zh");
      le.classList.toggle("active", window.currentLang === "en");
    }
  }

  function bindOnce() {
    document.getElementById("btn-play").addEventListener("click", function () { sndClick(); showPage("levels-page"); renderLevels(); });
    document.getElementById("btn-signin").addEventListener("click", function () { sndClick(); showPage("signin-page"); renderSignin(); });
    document.getElementById("btn-shop").addEventListener("click", function () { sndClick(); showPage("shop-page"); renderShop(); });
    document.getElementById("btn-settings").addEventListener("click", function () { sndClick(); showPage("settings-page"); });
    document.getElementById("btn-add-home").addEventListener("click", function () {
      try {
        if (window.Telegram && Telegram.WebApp && Telegram.WebApp.addToHomeScreen) Telegram.WebApp.addToHomeScreen();
        else toast("Use browser menu to add");
      } catch (e) { toast("Not supported"); }
    });
    document.getElementById("btn-levels-back").addEventListener("click", function () { showPage("home-page"); });
    document.getElementById("btn-pause").addEventListener("click", function () { state.paused = true; document.getElementById("pause-overlay").style.display = "flex"; });
    document.getElementById("btn-continue").addEventListener("click", function () { state.paused = false; document.getElementById("pause-overlay").style.display = "none"; });
    document.getElementById("btn-restart").addEventListener("click", function () { state.resultPending = false; startLevel(state.currentLevel); });
    document.getElementById("btn-pause-home").addEventListener("click", function () { clearInterval(state.timerId); showPage("home-page"); });
    document.getElementById("btn-next").addEventListener("click", function () { state.resultPending = false; startLevel(Math.min(state.currentLevel + 1, window.totalLevels)); });
    document.getElementById("btn-again").addEventListener("click", function () { state.resultPending = false; startLevel(state.currentLevel); });
    document.getElementById("btn-result-home").addEventListener("click", function () { state.resultPending = false; showPage("home-page"); });
    document.getElementById("btn-shop-back").addEventListener("click", function () { showPage("home-page"); });
    document.getElementById("btn-checkin").addEventListener("click", doSignin);
    document.getElementById("btn-signin-back").addEventListener("click", function () { showPage("home-page"); });
    document.getElementById("lang-zh").addEventListener("click", function () { window.setLang("zh"); });
    document.getElementById("lang-en").addEventListener("click", function () { window.setLang("en"); });
    document.getElementById("btn-settings-back").addEventListener("click", function () { showPage("home-page"); });
    document.getElementById("mode-cow").addEventListener("click", function () { state.mode = "cow"; updateModeUI(); });
    document.getElementById("mode-mark").addEventListener("click", function () { state.mode = "mark"; updateModeUI(); });
    document.querySelector(".props-bar").addEventListener("click", function (e) {
      var btn = e.target.closest(".prop-btn");
      if (btn) useProp(btn.getAttribute("data-prop"));
    });
  }

  function init() {
    if (typeof window.initLang === "function") window.initLang();
    loadState();
    bindOnce();
    var progress = document.getElementById("progress");
    var v = 0;
    var interval = setInterval(function () {
      v += 14;
      if (progress) progress.style.width = Math.min(v, 100) + "%";
      if (v >= 100) {
        clearInterval(interval);
        showPage("home-page");
      }
    }, 70);
  }

  window.G = {
    state: state,
    init: init,
    startLevel: startLevel,
    showPage: showPage,
    renderLevels: renderLevels,
    refreshLang: refreshLang,
    analyzeBoard: analyzeBoard,
    checkBoard: checkBoard,
    showAd: showAd
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
