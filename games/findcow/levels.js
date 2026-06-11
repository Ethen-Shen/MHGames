/* Find the Cow puzzle levels.
 * Rules: one cow in each row, column, and colored area; cows cannot touch
 * around the 8 neighboring cells.
 */
(function () {
  "use strict";

  var PALETTES = [
    ["#f97316", "#22c55e", "#06b6d4", "#a855f7", "#f43f5e", "#eab308", "#14b8a6", "#60a5fa", "#fb7185"],
    ["#ef4444", "#84cc16", "#0ea5e9", "#d946ef", "#f59e0b", "#10b981", "#6366f1", "#ec4899", "#94a3b8"],
    ["#fb923c", "#34d399", "#38bdf8", "#c084fc", "#f472b6", "#facc15", "#2dd4bf", "#818cf8", "#a3e635"]
  ];

  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function shuffle(list, random) {
    var a = list.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function makeSolution(size, random) {
    var cols = [];
    for (var i = 0; i < size; i++) cols.push(i);
    var result = [];
    var used = {};

    function place(row) {
      if (row >= size) return true;
      var choices = shuffle(cols, random);
      for (var i = 0; i < choices.length; i++) {
        var c = choices[i];
        if (used[c]) continue;
        if (row > 0 && Math.abs(result[row - 1] - c) <= 1) continue;
        used[c] = true;
        result[row] = c;
        if (place(row + 1)) return true;
        used[c] = false;
        result[row] = undefined;
      }
      return false;
    }

    return place(0) ? result : null;
  }

  function makeRegions(size, solution, random) {
    var regions = [];
    var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    var unfilled = size * size - size;
    for (var row = 0; row < size; row++) {
      regions[row] = [];
      for (var col = 0; col < size; col++) regions[row][col] = -1;
    }
    for (var r = 0; r < size; r++) regions[r][solution[r]] = r;

    while (unfilled > 0) {
      var frontier = [];
      for (var rr = 0; rr < size; rr++) {
        for (var cc = 0; cc < size; cc++) {
          if (regions[rr][cc] < 0) continue;
          for (var d = 0; d < dirs.length; d++) {
            var nr = rr + dirs[d][0];
            var nc = cc + dirs[d][1];
            if (nr >= 0 && nr < size && nc >= 0 && nc < size && regions[nr][nc] < 0) {
              frontier.push({ r: nr, c: nc, region: regions[rr][cc] });
            }
          }
        }
      }
      if (!frontier.length) break;
      var pick = frontier[Math.floor(random() * frontier.length)];
      regions[pick.r][pick.c] = pick.region;
      unfilled--;
    }
    return regions;
  }

  function countSolutions(size, regions, maxCount) {
    var regionCounts = [];
    var usedCols = [];
    var count = 0;
    for (var i = 0; i < size; i++) {
      regionCounts[i] = 0;
      usedCols[i] = false;
    }

    function search(row, prevCol) {
      if (count >= maxCount) return;
      if (row === size) {
        for (var k = 0; k < size; k++) {
          if (regionCounts[k] !== 1) return;
        }
        count++;
        return;
      }

      for (var col = 0; col < size; col++) {
        if (usedCols[col]) continue;
        if (prevCol >= 0 && Math.abs(prevCol - col) <= 1) continue;
        var region = regions[row][col];
        if (regionCounts[region] >= 1) continue;
        usedCols[col] = true;
        regionCounts[region]++;
        search(row + 1, col);
        regionCounts[region]--;
        usedCols[col] = false;
      }
    }

    search(0, -99);
    return count;
  }

  function buildLevel(id) {
    var size = id <= 8 ? 5 : id <= 18 ? 6 : 7;
    var seed = 9127 + id * 7919;
    var fallback = null;

    for (var attempt = 0; attempt < 2200; attempt++) {
      var random = rng(seed + attempt * 104729);
      var solution = makeSolution(size, random);
      if (!solution) continue;
      var regions = makeRegions(size, solution, random);
      var level = {
        id: id,
        size: size,
        solution: solution,
        regions: regions,
        palette: PALETTES[id % PALETTES.length],
        par: size * 3 + Math.floor(id / 3),
        difficulty: id <= 8 ? "easy" : id <= 18 ? "normal" : id <= 30 ? "hard" : "expert"
      };
      if (!fallback) fallback = level;
      if (countSolutions(size, regions, 2) === 1) return level;
    }

    return fallback;
  }

  window.LEVELS = [];
  for (var i = 1; i <= 40; i++) window.LEVELS.push(buildLevel(i));
  window.totalLevels = window.LEVELS.length;
  window.loadLevel = function (id) {
    id = parseInt(id, 10) || 1;
    if (id < 1) id = 1;
    if (id > window.totalLevels) id = window.totalLevels;
    return window.LEVELS[id - 1];
  };

  window.findCowCountSolutions = countSolutions;
})();
