/* Fork! — find the square where your knight attacks two pieces at once,
   and where it cannot be eaten in return. */
(function () {
  'use strict';

  var SIZE = 8;
  var PUZZLES = 5;
  var THEIRS = ['n', 'b', 'r', 'q'];

  function randInt(n) { return Math.floor(Math.random() * n); }

  function forkTargets(s, from) {
    var work = Rules.clone(s);
    var knight = work.sq[from];
    return function (to) {
      var probe = Rules.clone(work);
      probe.sq[from] = null;
      probe.sq[to] = knight;
      return Rules.movesFrom(probe, to)
        .filter(function (m) { return m.cap !== null; })
        .map(function (m) { return m.to; });
    };
  }

  function buildPuzzle() {
    for (var attempt = 0; attempt < 800; attempt++) {
      var s = Rules.makeState(SIZE, {});
      var used = {};
      var spot = function () {
        var at;
        do { at = randInt(SIZE * SIZE); } while (used[at]);
        used[at] = true;
        return at;
      };
      var knightAt = spot();
      Rules.place(s, knightAt, 'n', 'w');
      for (var n = 0; n < 3; n++) Rules.place(s, spot(), THEIRS[randInt(THEIRS.length)], 'b');
      var danger = Rules.attacked(s, 'b');
      var hits = forkTargets(s, knightAt);
      var good = Rules.movesFrom(s, knightAt).filter(function (m) {
        if (m.cap !== null) return false;            // the fork lands on an empty square
        if (danger.has(m.to)) return false;          // and somewhere safe
        return hits(m.to).length >= 2;
      });
      if (good.length !== 1) continue;               // exactly one answer keeps it a puzzle
      return { state: s, knightAt: knightAt, answer: good[0].to, hits: hits };
    }
    return null;
  }

  function start(cfg, ctx) {
    var puzzle, state, round = 0, solved = 0, clean = true, dead = false, sel = false;

    Board.setup({ size: SIZE, flipped: false });
    Board.onTap(onTap);
    ctx.setTools({ hint: false, undo: false, restart: true });
    ctx.relabel(function () { status(); panel(); });

    function build() {
      round++;
      clean = true;
      sel = false;
      puzzle = buildPuzzle();
      state = puzzle ? puzzle.state : Rules.makeState(SIZE, {});
      ['good', 'bad', 'sel', 'target', 'cap'].forEach(function (c) { Board.clearMarks(c); });
      Board.render(state);
      status();
      panel();
    }

    function status(msg) {
      if (dead) return;
      ctx.setStatus(msg || ctx.t('help.fork'), 'white-turn');
    }

    function panel() {
      Quiz.panel(ctx, [
        { icon: '🧩', label: ctx.t('quiz.round'), value: round + '/' + PUZZLES },
        { icon: '✅', label: ctx.t('quiz.right'), value: solved }
      ], 'fork');
    }

    function onTap(i) {
      if (dead || !puzzle) return;
      if (i === puzzle.knightAt) {
        sel = true;
        Board.clearMarks('sel');
        Board.clearMarks('target');
        Board.mark(i, 'sel');
        Rules.movesFrom(state, i).forEach(function (m) { Board.mark(m.to, 'target'); });
        Sound.play('select');
        return;
      }
      if (!sel) { Board.shake(i); Sound.play('error'); return; }
      var legal = Rules.movesFrom(state, puzzle.knightAt).some(function (m) { return m.to === i; });
      if (!legal) { Board.shake(i); Sound.play('error'); return; }

      if (i === puzzle.answer) {
        var knight = state.sq[puzzle.knightAt];
        state.sq[puzzle.knightAt] = null;
        state.sq[i] = knight;
        Board.clearMarks('target');
        Board.clearMarks('sel');
        Board.render(state);
        Board.mark(i, 'good');
        puzzle.hits(i).forEach(function (t) { Board.mark(t, 'bad'); });
        Sound.play('star');
        if (clean) solved++;
        panel();
        status(ctx.t('quiz.correct'));
        if (round >= PUZZLES) { setTimeout(done, 1000); return; }
        setTimeout(function () { if (!dead) build(); }, 1100);
      } else {
        clean = false;
        Board.shake(i);
        Sound.play('error');
        status(ctx.t('quiz.nope'));
      }
    }

    function done() {
      dead = true;
      Quiz.finish(ctx, { value: solved, total: PUZZLES, recordKey: 'fork', emoji: '🍴' });
    }

    build();

    return { destroy: function () { dead = true; } };
  }

  App.registerMode({
    id: 'fork',
    order: 1,
    group: 'advanced',
    icon: '<span class="ic-pair">' + Pieces.svg('n', 'w') + '<span class="ic-star">⚡</span></span>',
    titleKey: 'mode.fork.title',
    descKey: 'mode.fork.desc',
    helpKey: 'help.fork',
    options: [],
    start: start
  });
})();
