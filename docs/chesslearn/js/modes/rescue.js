/* Rescue! — one of your pieces is attacked. Move away, block, or eat the
   attacker; any move works as long as nothing of yours is attacked after it. */
(function () {
  'use strict';

  var SIZE = 8;
  var PUZZLES = 5;
  var MINE = ['n', 'b', 'r', 'q'];
  var THEIRS = ['n', 'b', 'r', 'q', 'p'];

  function randInt(n) { return Math.floor(Math.random() * n); }

  function safe(s) {
    var atk = Rules.attacked(s, 'b');
    for (var i = 0; i < s.sq.length; i++) {
      var p = s.sq[i];
      if (p && p.c === 'w' && atk.has(i)) return false;
    }
    return true;
  }

  function buildPuzzle() {
    for (var attempt = 0; attempt < 600; attempt++) {
      var s = Rules.makeState(SIZE, {});
      var used = {};
      var place = function (type, colour) {
        var at;
        do { at = randInt(SIZE * SIZE); } while (used[at]);
        used[at] = true;
        if (type === 'p') {
          var row = Rules.rowOf(s, at);
          if (row === 0 || row === SIZE - 1) return place('r', colour);
        }
        Rules.place(s, at, type, colour);
        return at;
      };
      place(MINE[randInt(MINE.length)], 'w');
      place(MINE[randInt(MINE.length)], 'w');
      place(THEIRS[randInt(THEIRS.length)], 'b');
      if (Math.random() < 0.5) place(THEIRS[randInt(THEIRS.length)], 'b');
      if (safe(s)) continue;                       // nothing to rescue
      var moves = Rules.allMoves(s, 'w');
      var solutions = moves.filter(function (m) { return safe(Rules.apply(s, m).state); });
      if (!solutions.length) continue;             // no way out
      if (solutions.length > 6) continue;          // too easy to stumble into
      return s;
    }
    return null;
  }

  function start(cfg, ctx) {
    var state, round = 0, solved = 0, clean = true, sel = null, dead = false;

    Board.setup({ size: SIZE, flipped: false });
    Board.onTap(onTap);
    ctx.setTools({ hint: false, undo: false, restart: true });
    ctx.relabel(function () { status(); panel(); });

    function build() {
      round++;
      clean = true;
      sel = null;
      state = buildPuzzle() || Rules.makeState(SIZE, {});
      Board.clearMarks('bad');
      Board.clearMarks('good');
      Board.clearMarks('sel');
      Board.clearMarks('target');
      Board.clearMarks('cap');
      Board.render(state);
      showDanger();
      status();
      panel();
    }

    function showDanger() {
      Board.clearMarks('bad');
      var atk = Rules.attacked(state, 'b');
      for (var i = 0; i < state.sq.length; i++) {
        var p = state.sq[i];
        if (p && p.c === 'w' && atk.has(i)) Board.mark(i, 'bad');
      }
    }

    function status(msg) {
      if (dead) return;
      ctx.setStatus(msg || ctx.t('help.rescue'), 'white-turn');
    }

    function panel() {
      Quiz.panel(ctx, [
        { icon: '🧩', label: ctx.t('quiz.round'), value: round + '/' + PUZZLES },
        { icon: '✅', label: ctx.t('quiz.right'), value: solved }
      ], 'rescue');
    }

    function clearSel() {
      sel = null;
      Board.clearMarks('sel');
      Board.clearMarks('target');
      Board.clearMarks('cap');
    }

    function onTap(i) {
      if (dead) return;
      if (sel !== null) {
        var list = Rules.movesFrom(state, sel).filter(function (m) { return m.to === i; });
        if (list.length) { clearSel(); play(list[0]); return; }
      }
      var p = state.sq[i];
      if (p && p.c === 'w') {
        clearSel();
        sel = i;
        Board.mark(i, 'sel');
        Sound.play('select');
        Rules.movesFrom(state, i).forEach(function (m) {
          Board.mark(m.to, m.cap !== null ? 'cap' : 'target');
        });
      } else {
        clearSel();
        if (p) { Board.shake(i); Sound.play('error'); }
      }
    }

    function play(move) {
      var res = Rules.apply(state, move);
      var next = res.state;
      next.turn = 'w';
      if (safe(next)) {
        state = next;
        Board.render(state);
        Board.clearMarks('bad');
        Board.mark(move.to, 'good');
        Sound.play(res.captured ? 'capture' : 'star');
        if (clean) solved++;
        panel();
        status(ctx.t('quiz.correct'));
        if (round >= PUZZLES) { setTimeout(done, 800); return; }
        setTimeout(function () { if (!dead) build(); }, 900);
      } else {
        clean = false;
        Sound.play('error');
        Board.shake(move.to);
        status(ctx.t('quiz.stillattacked'));
      }
    }

    function done() {
      dead = true;
      Quiz.finish(ctx, { value: solved, total: PUZZLES, recordKey: 'rescue', emoji: '🙌' });
    }

    build();

    return { destroy: function () { dead = true; } };
  }

  App.registerMode({
    id: 'rescue',
    order: 5,
    group: 'learning',
    icon: function () { return '<span class="ic-pair">' + Pieces.svg('r', 'w') + '<span class="ic-star">🆘</span></span>'; },
    titleKey: 'mode.rescue.title',
    descKey: 'mode.rescue.desc',
    helpKey: 'help.rescue',
    options: [],
    start: start
  });
})();
