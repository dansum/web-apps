/* Mate in One — a queen (and sometimes a rook) against a lonely king.
   Positions are made at random and kept only when exactly one move mates. */
(function () {
  'use strict';

  var SIZE = 8;
  var PUZZLES = 5;

  function randInt(n) { return Math.floor(Math.random() * n); }

  function buildPuzzle() {
    for (var attempt = 0; attempt < 1500; attempt++) {
      var s = Rules.makeState(SIZE, { turn: 'w' });
      var used = {};
      var spot = function () {
        var at;
        do { at = randInt(SIZE * SIZE); } while (used[at]);
        used[at] = true;
        return at;
      };
      Rules.place(s, spot(), 'k', 'b');
      Rules.place(s, spot(), 'k', 'w');
      Rules.place(s, spot(), 'q', 'w');
      if (Math.random() < 0.5) Rules.place(s, spot(), 'r', 'w');
      if (Rules.inCheck(s, 'b') || Rules.inCheck(s, 'w')) continue;   // must be White to move
      if (!Rules.legalMoves(s, 'b').length) continue;                 // and Black must be alive
      var mates = Rules.legalMoves(s, 'w').filter(function (m) {
        return Rules.isMate(Rules.apply(s, m).state, 'b');
      });
      if (mates.length !== 1) continue;                               // exactly one answer
      return { state: s, answer: mates[0] };
    }
    return null;
  }

  function start(cfg, ctx) {
    var puzzle, state, round = 0, solved = 0, clean = true, sel = null, dead = false;

    Board.setup({ size: SIZE, flipped: false });
    Board.onTap(onTap);
    ctx.setTools({ hint: false, undo: false, restart: true });
    ctx.relabel(function () { status(); panel(); });

    function build() {
      round++;
      clean = true;
      sel = null;
      puzzle = buildPuzzle();
      state = puzzle ? puzzle.state : Rules.makeState(SIZE, {});
      ['good', 'bad', 'sel', 'target', 'cap'].forEach(function (c) { Board.clearMarks(c); });
      Board.render(state);
      status();
      panel();
    }

    function status(msg) {
      if (dead) return;
      ctx.setStatus(msg || ctx.t('quiz.mateit'), 'white-turn');
    }

    function panel() {
      Quiz.panel(ctx, [
        { icon: '🧩', label: ctx.t('quiz.round'), value: round + '/' + PUZZLES },
        { icon: '✅', label: ctx.t('quiz.right'), value: solved }
      ], 'mate1');
    }

    function clearSel() {
      sel = null;
      Board.clearMarks('sel');
      Board.clearMarks('target');
      Board.clearMarks('cap');
    }

    function onTap(i) {
      if (dead || !puzzle) return;
      if (sel !== null) {
        var list = Rules.legalMoves(state, 'w').filter(function (m) {
          return m.from === sel && m.to === i;
        });
        if (list.length) { clearSel(); play(list[0]); return; }
      }
      var p = state.sq[i];
      if (p && p.c === 'w') {
        clearSel();
        sel = i;
        Board.mark(i, 'sel');
        Sound.play('select');
        Rules.legalMoves(state, 'w').forEach(function (m) {
          if (m.from === i) Board.mark(m.to, m.cap !== null ? 'cap' : 'target');
        });
      } else {
        clearSel();
        if (p) { Board.shake(i); Sound.play('error'); }
      }
    }

    function play(move) {
      var next = Rules.apply(state, move).state;
      if (Rules.isMate(next, 'b')) {
        state = next;
        Board.render(state);
        Board.mark(Rules.kingSquare(state, 'b'), 'bad');
        Board.mark(move.to, 'good');
        Sound.play('star');
        if (clean) solved++;
        panel();
        status(ctx.t('result.mate'));
        if (round >= PUZZLES) { setTimeout(done, 1100); return; }
        setTimeout(function () { if (!dead) build(); }, 1200);
      } else {
        clean = false;
        Board.shake(move.to);
        Sound.play('error');
        status(ctx.t('quiz.notmate'));
      }
    }

    function done() {
      dead = true;
      Quiz.finish(ctx, { value: solved, total: PUZZLES, recordKey: 'mate1', emoji: '👑' });
    }

    build();

    return { destroy: function () { dead = true; } };
  }

  App.registerMode({
    id: 'mate1',
    order: 2,
    group: 'advanced',
    icon: '<span class="ic-pair">' + Pieces.svg('q', 'w') + Pieces.svg('k', 'b') + '</span>',
    titleKey: 'mode.mate1.title',
    descKey: 'mode.mate1.desc',
    helpKey: 'help.mate1',
    options: [],
    start: start
  });
})();
