/* Safe Path — walk the little king to the cheese without ever stopping on a
   square that an enemy guard attacks. The guards never move. */
(function () {
  'use strict';

  var SIZE = 6;
  var GUARD_TYPES = ['r', 'b', 'n', 'q'];
  var LIVES = 3;

  function randInt(n) { return Math.floor(Math.random() * n); }

  function neighbours(s, i) {
    var out = [];
    var r = Rules.rowOf(s, i), c = Rules.colOf(s, i);
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        if (Rules.inside(s, r + dr, c + dc)) out.push(Rules.idx(s, r + dr, c + dc));
      }
    }
    return out;
  }

  /* Shortest walk through safe squares only; null when there is none. */
  function safeDistance(s, from, to, danger) {
    var dist = {}; dist[from] = 0;
    var queue = [from];
    while (queue.length) {
      var cur = queue.shift();
      if (cur === to) return dist[cur];
      var next = neighbours(s, cur);
      for (var i = 0; i < next.length; i++) {
        var n = next[i];
        if (dist[n] !== undefined) continue;
        if (s.sq[n] && n !== to) continue;
        if (danger.has(n) && n !== to) continue;
        dist[n] = dist[cur] + 1;
        queue.push(n);
      }
    }
    return null;
  }

  function buildLevel(guards) {
    for (var attempt = 0; attempt < 400; attempt++) {
      var s = Rules.makeState(SIZE, { promote: 'q', turn: 'w' });
      var used = {};
      for (var g = 0; g < guards; g++) {
        var at;
        do { at = randInt(SIZE * SIZE); } while (used[at]);
        used[at] = true;
        Rules.place(s, at, GUARD_TYPES[randInt(GUARD_TYPES.length)], 'b');
      }
      var danger = Rules.attacked(s, 'b');
      var free = [];
      for (var i = 0; i < SIZE * SIZE; i++) {
        if (!s.sq[i] && !danger.has(i)) free.push(i);
      }
      if (free.length < 6) continue;
      var start = free[randInt(free.length)];
      var goal = free[randInt(free.length)];
      if (start === goal) continue;
      var d = safeDistance(s, start, goal, danger);
      var minWalk = attempt > 200 ? 3 : 5;
      if (d === null || d < minWalk) continue;
      return { state: s, start: start, goal: goal, danger: danger, dist: d };
    }
    return null;
  }

  function start(cfg, ctx) {
    var guards = parseInt(cfg.guards, 10);
    var level = buildLevel(guards) || buildLevel(2);
    var state = level.state;
    var danger = level.danger;
    var at = level.start;
    var hero = Rules.place(state, at, 'k', 'w');
    var moves = 0, lives = LIVES, reveals = 3, dead = false, revealTimer = null;
    var bestKey = 'safe.' + guards;

    Board.setup({ size: SIZE, flipped: false });
    Board.render(state);
    Board.decor(level.goal, '🧀', 'cheese-decor');
    Board.onTap(onTap);
    ctx.setTools({ hint: true, undo: false, restart: true });
    ctx.relabel(refresh);
    paint();

    function paint() {
      Board.clearMarks('sel');
      Board.clearMarks('target');
      Board.mark(at, 'sel');
      neighbours(state, at).forEach(function (i) {
        if (!state.sq[i]) Board.mark(i, 'target');
      });
    }

    function refresh(msg) {
      if (dead) return;
      ctx.setStatus(msg || ctx.t('game.yourturn'), 'white-turn');
      var hearts = '';
      for (var i = 0; i < LIVES; i++) hearts += i < lives ? '❤️' : '🖤';
      ctx.setScore(
        '<div class="score-row"><span class="chip-icon">💖</span>' +
        '<span class="score-name">' + ctx.t('game.lives') + '</span><b>' + hearts + '</b></div>' +
        '<div class="score-row"><span class="chip-icon">👣</span>' +
        '<span class="score-name">' + ctx.t('game.moves') + '</span><b>' + moves + '</b></div>' +
        (Scores.get(bestKey) !== undefined
          ? '<div class="score-row"><span class="chip-icon">\uD83C\uDFC5</span>' +
            '<span class="score-name">' + ctx.t('game.best') + '</span><b>' +
            Scores.get(bestKey) + '</b></div>' : '') +
        '<button id="revealBtn" class="tool-btn wide">👁️ ' +
        ctx.t('game.reveal') + ' (' + reveals + ')</button>'
      );
      var btn = document.getElementById('revealBtn');
      if (btn) btn.addEventListener('click', reveal);
    }

    function reveal(showAll) {
      if (dead) return;
      if (showAll !== true) {
        if (reveals <= 0) return;
        reveals--;
      }
      Board.clearMarks('danger');
      danger.forEach(function (i) { if (!state.sq[i]) Board.mark(i, 'danger'); });
      Sound.play('select');
      refresh();
      clearTimeout(revealTimer);
      revealTimer = setTimeout(function () { Board.clearMarks('danger'); }, 2200);
    }

    function onTap(i) {
      if (dead) return;
      if (neighbours(state, at).indexOf(i) < 0 || state.sq[i]) {
        Board.shake(i); Sound.play('error'); return;
      }
      state.sq[at] = null;
      state.sq[i] = hero;
      at = i;
      moves++;
      Board.render(state);
      paint();
      if (i === level.goal) { win(); return; }
      if (danger.has(i)) { caught(); return; }
      Sound.play('move');
      refresh();
    }

    function caught() {
      lives--;
      Sound.play('capture');
      Board.shake(at);
      reveal(true);
      if (lives <= 0) {
        dead = true;
        ctx.finish({
          win: false, emoji: '😿', sound: 'lose',
          title: ctx.t('result.caught'),
          text: ctx.t('result.inmoves', { n: moves })
        });
        return;
      }
      refresh(ctx.t('result.caught'));
      setTimeout(function () {
        if (dead) return;
        state.sq[at] = null;
        at = level.start;
        state.sq[at] = hero;
        Board.render(state);
        paint();
        refresh();
      }, 900);
    }

    function win() {
      dead = true;
      var stars = moves <= level.dist + 1 ? 3 : (moves <= level.dist + 5 ? 2 : 1);
      if (lives < LIVES) stars = Math.max(1, stars - 1);
      ctx.finish({
        win: true, emoji: '🧀',
        title: ctx.t('result.win'),
        text: ctx.t('result.inmoves', { n: moves }),
        stars: stars
      });
    }

    refresh();

    return {
      hint: function () { reveal(); },
      destroy: function () { dead = true; clearTimeout(revealTimer); Board.clearDecor(); }
    };
  }

  App.registerMode({
    id: 'safe',
    order: 6,
    group: 'beginner',
    icon: '<span class="ic-pair">' + Pieces.svg('k', 'w') + '<span class="ic-star">🧀</span></span>',
    titleKey: 'mode.safe.title',
    descKey: 'mode.safe.desc',
    helpKey: 'help.safe',
    options: [
      { key: 'guards', labelKey: 'opt.guards', def: '2', choices: [
        { v: '2', labelKey: 'opt.guards.2', icon: Pieces.svg('r', 'b') },
        { v: '3', labelKey: 'opt.guards.3', icon: Pieces.svg('b', 'b') },
        { v: '4', labelKey: 'opt.guards.4', icon: Pieces.svg('q', 'b') }
      ] },
    ],
    start: start
  });
})();
