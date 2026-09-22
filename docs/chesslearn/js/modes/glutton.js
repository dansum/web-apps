/* The Glutton — one piece of your choice must eat eight enemy pawns.
   Optionally the pawns march back at you, which turns it into a real hunt. */
(function () {
  'use strict';

  var SIZE = 8;
  var PAWNS = 8;
  var STARS = {           // moves needed for 3 and for 2 stars
    q: [10, 14], r: [12, 17], b: [12, 17], n: [17, 23], k: [22, 30]
  };

  function randInt(n) { return Math.floor(Math.random() * n); }

  function buildState(type, fight) {
    var s = Rules.makeState(SIZE, { promote: 'remove', turn: 'w' });
    var heroAt = randInt(SIZE * SIZE);
    if (fight) {                                  // keep the hero out of the top rows
      heroAt = Rules.idx(s, 4 + randInt(SIZE - 4), randInt(SIZE));
    }
    Rules.place(s, heroAt, type, 'w');

    var heroColour = (Rules.rowOf(s, heroAt) + Rules.colOf(s, heroAt)) % 2;
    var free = [];
    for (var i = 0; i < SIZE * SIZE; i++) {
      if (i === heroAt) continue;
      var r = Rules.rowOf(s, i), c = Rules.colOf(s, i);
      /* A bishop never leaves its own colour, so its dinner must be there too. */
      if (type === 'b' && (r + c) % 2 !== heroColour) continue;
      /* Marching pawns start in the top half so the hunt lasts. */
      if (fight && r > 3) continue;
      free.push(i);
    }
    for (var n = 0; n < PAWNS && free.length; n++) {
      var pick = free.splice(randInt(free.length), 1)[0];
      Rules.place(s, pick, 'p', 'b');
    }
    return s;
  }

  function heroSquare(s) {
    for (var i = 0; i < s.sq.length; i++) {
      var p = s.sq[i];
      if (p && p.c === 'w') return i;
    }
    return -1;
  }

  /* Breadth-first search over the hero's own moves: the first step of the
     shortest route to the nearest pawn. That is the hint. */
  function shortestStep(s) {
    var from = heroSquare(s);
    if (from < 0) return null;
    var queue = [{ at: from, first: null }];
    var seen = {};
    seen[from] = true;
    while (queue.length) {
      var node = queue.shift();
      var work = Rules.clone(s);
      work.sq[from] = null;
      work.sq[node.at] = s.sq[from];
      var moves = Rules.movesFrom(work, node.at);
      for (var i = 0; i < moves.length; i++) {
        var m = moves[i];
        var step = node.first === null ? { from: node.at, to: m.to } : node.first;
        if (m.cap !== null) return node.first === null ? { from: from, to: m.to } : node.first;
        if (seen[m.to]) continue;
        seen[m.to] = true;
        queue.push({ at: m.to, first: step });
      }
    }
    return null;
  }

  function start(cfg, ctx) {
    var type = cfg.piece;
    var fight = cfg.fight === 'on';
    var state = buildState(type, fight);
    var history = [];
    var moves = 0, eaten = 0, dead = false, busy = false, sel = null, timer = null;
    var bestKey = 'glutton.' + type + (fight ? '.fight' : '');

    Board.setup({ size: SIZE, flipped: false });
    Board.render(state);
    Board.onTap(onTap);
    ctx.setTools({ hint: true, undo: true, restart: true });
    ctx.relabel(refresh);

    function pawnsLeft() { return Rules.count(state, 'b', 'p'); }

    function refresh(msg) {
      if (dead) return;
      ctx.setStatus(msg || ctx.t('game.yourturn'), 'white-turn');
      var best = Scores.get(bestKey);
      ctx.setScore(
        '<div class="score-row"><span class="chip-piece b">' + Pieces.svg('p', 'b') + '</span>' +
        '<span class="score-name">' + ctx.t('game.left') + '</span><b>' + pawnsLeft() + '</b></div>' +
        '<div class="score-row"><span class="chip-icon">👣</span>' +
        '<span class="score-name">' + ctx.t('game.moves') + '</span><b>' + moves + '</b></div>' +
        (best ? '<div class="score-row"><span class="chip-icon">🏅</span>' +
          '<span class="score-name">' + ctx.t('game.best') + '</span><b>' + best + '</b></div>' : '')
      );
    }

    function clearSelection() {
      sel = null;
      Board.clearMarks('sel');
      Board.clearMarks('target');
      Board.clearMarks('cap');
    }

    function showMoves(i) {
      sel = i;
      Board.mark(i, 'sel');
      Rules.movesFrom(state, i).forEach(function (m) {
        Board.mark(m.to, m.cap !== null ? 'cap' : 'target');
      });
    }

    function onTap(i) {
      if (dead || busy) return;
      if (sel !== null) {
        var list = Rules.movesFrom(state, sel).filter(function (m) { return m.to === i; });
        if (list.length) { clearSelection(); play(list[0]); return; }
      }
      var p = state.sq[i];
      if (p && p.c === 'w') { clearSelection(); showMoves(i); Sound.play('select'); }
      else { clearSelection(); if (p) { Board.shake(i); Sound.play('error'); } }
    }

    function play(move) {
      history.push({ state: Rules.clone(state), moves: moves, eaten: eaten });
      var res = Rules.apply(state, move);
      state = res.state;
      moves++;
      if (res.captured) eaten++;
      Board.clearMarks('last');
      Board.clearMarks('hint');
      Board.mark(move.from, 'last');
      Board.mark(move.to, 'last');
      Board.render(state);
      Sound.play(res.captured ? 'capture' : 'move');
      if (!pawnsLeft()) { refresh(); finish(); return; }
      if (fight) pawnTurn(); else { state.turn = 'w'; refresh(); }
    }

    function pawnTurn() {
      busy = true;
      Board.setLocked(true);
      timer = setTimeout(function () {
        if (dead) return;
        var hero = heroSquare(state);
        var all = Rules.allMoves(state, 'b');
        var bite = all.filter(function (m) { return m.cap === hero; });
        var move = bite.length ? bite[randInt(bite.length)]
          : (all.length ? all[randInt(all.length)] : null);
        busy = false;
        Board.setLocked(false);
        state.turn = 'b';
        if (move) {
          var res = Rules.apply(state, move);
          state = res.state;
          Board.render(state);
          Sound.play(res.captured ? 'capture' : (res.scored ? 'error' : 'move'));
          if (res.captured && res.captured.c === 'w') { refresh(); caught(); return; }
        }
        state.turn = 'w';
        if (!pawnsLeft()) { refresh(); finish(); return; }
        refresh();
      }, 480);
    }

    function starsFor(n) {
      var limits = STARS[type] || STARS.n;
      if (n <= limits[0]) return 3;
      if (n <= limits[1]) return 2;
      return 1;
    }

    function caught() {
      dead = true;
      ctx.finish({
        win: false, emoji: '😱',
        title: ctx.t('result.caught'),
        text: ctx.t('result.inmoves', { n: moves })
      });
    }

    function finish() {
      dead = true;
      var escaped = state.scored.b;
      var stars = escaped ? Math.max(1, starsFor(moves) - escaped) : starsFor(moves);
      var record = false;
      if (!escaped) record = Scores.submit(bestKey, moves).isRecord;
      ctx.finish({
        win: true, emoji: escaped ? '😊' : '🍽️',
        title: ctx.t(escaped ? 'result.done' : 'result.win'),
        text: ctx.t('result.inmoves', { n: moves }) + (record ? '  ' + ctx.t('result.newbest') : ''),
        stars: stars
      });
    }

    function hint() {
      if (dead || busy) return;
      var step = shortestStep(state);
      Board.clearMarks('hint');
      if (!step) { refresh(ctx.t('game.nohint')); return; }
      Board.mark(step.from, 'hint');
      Board.mark(step.to, 'hint');
      Sound.play('select');
    }

    function undo() {
      if (dead || busy || !history.length) return;
      clearSelection();
      Board.clearMarks('last');
      Board.clearMarks('hint');
      var prev = history.pop();
      state = prev.state; moves = prev.moves; eaten = prev.eaten;
      Board.render(state);
      refresh();
    }

    refresh();

    return {
      hint: hint,
      undo: undo,
      destroy: function () { dead = true; clearTimeout(timer); Board.setLocked(false); }
    };
  }

  App.registerMode({
    id: 'glutton',
    order: 4,
    group: 'beginner',
    icon: function () { return '<span class="ic-pair">' + Pieces.svg('n', 'w') + Pieces.svg('p', 'b') + '</span>'; },
    titleKey: 'mode.glutton.title',
    descKey: 'mode.glutton.desc',
    helpKey: 'help.glutton',
    options: [
      { key: 'piece', labelKey: 'opt.piece', def: 'n', choices: [
        { v: 'n', labelKey: 'piece.n', icon: function () { return Pieces.svg('n', 'w'); } },
        { v: 'b', labelKey: 'piece.b', icon: function () { return Pieces.svg('b', 'w'); } },
        { v: 'r', labelKey: 'piece.r', icon: function () { return Pieces.svg('r', 'w'); } },
        { v: 'q', labelKey: 'piece.q', icon: function () { return Pieces.svg('q', 'w'); } },
        { v: 'k', labelKey: 'piece.k', icon: function () { return Pieces.svg('k', 'w'); } }
      ] },
      { key: 'fight', labelKey: 'opt.fight', def: 'off', choices: [
        { v: 'off', labelKey: 'opt.fight.off', icon: '😴' },
        { v: 'on', labelKey: 'opt.fight.on', icon: '⚔️' }
      ] }
    ],
    start: start
  });
})();
