/* Mate in One — eight puzzles, one from each material set, in a random order.
   Positions are made at random and kept only when exactly one move mates. */
(function () {
  'use strict';

  var SIZE = 8;
  var PUZZLES = 8;
  var ATTEMPTS = 4000;

  function randInt(n) { return Math.floor(Math.random() * n); }

  function spotter(s) {
    return function (avoid) {
      var at, guard = 0;
      do { at = randInt(SIZE * SIZE); guard++; }
      while ((s.sq[at] || (avoid && avoid(at))) && guard < 200);
      return s.sq[at] ? -1 : at;
    };
  }

  function drop(s, at, type, colour) {
    if (at < 0) return false;
    Rules.place(s, at, type, colour);
    return true;
  }

  /* a square on the rim, and a square within `d` of another one */
  function edgeSquare() {
    var all = [];
    for (var i = 0; i < SIZE * SIZE; i++) {
      var r = Math.floor(i / SIZE), c = i % SIZE;
      if (r === 0 || c === 0 || r === SIZE - 1 || c === SIZE - 1) all.push(i);
    }
    return all[randInt(all.length)];
  }

  function nearSquare(sq, d) {
    var r = Math.floor(sq / SIZE), c = sq % SIZE;
    for (var guard = 0; guard < 200; guard++) {
      var rr = r - d + randInt(2 * d + 1), cc = c - d + randInt(2 * d + 1);
      if (rr < 0 || cc < 0 || rr >= SIZE || cc >= SIZE) continue;
      var i = rr * SIZE + cc;
      if (i !== sq) return i;
    }
    return -1;
  }

  /* Each kind is a different lesson: the queen mate, the two rooks,
     the lone rook, the two bishops, rook and knight, and the back rank. */
  function simple(types) {
    return function () {
      var s = Rules.makeState(SIZE, { turn: 'w' });
      var spot = spotter(s);
      if (!drop(s, spot(), 'k', 'b')) return null;
      if (!drop(s, spot(), 'k', 'w')) return null;
      for (var i = 0; i < types.length; i++) {
        if (!drop(s, spot(), types[i], 'w')) return null;
      }
      return s;
    };
  }

  function twoBishops() {
    var s = Rules.makeState(SIZE, { turn: 'w' });
    var bk = edgeSquare();
    Rules.place(s, bk, 'k', 'b');
    var wk = nearSquare(bk, 2);
    if (wk < 0 || s.sq[wk]) return null;
    Rules.place(s, wk, 'k', 'w');
    for (var n = 0; n < 2; n++) {
      var at = nearSquare(bk, 4);
      if (at < 0 || s.sq[at]) return null;
      Rules.place(s, at, 'b', 'w');
    }
    return s;
  }

  function backRank() {
    var s = Rules.makeState(SIZE, { turn: 'w' });
    var c = 1 + randInt(SIZE - 2);
    Rules.place(s, c, 'k', 'b');
    var cols = [c - 1, c, c + 1].filter(function (x) { return x >= 0 && x < SIZE; });
    cols.sort(function () { return Math.random() - 0.5; })
      .slice(0, 2 + randInt(2))
      .forEach(function (x) { Rules.place(s, SIZE + x, 'p', 'b'); });
    var spot = spotter(s);
    if (!drop(s, spot(function (a) { return a < 3 * SIZE; }), 'k', 'w')) return null;
    if (!drop(s, spot(), Math.random() < 0.5 ? 'r' : 'q', 'w')) return null;
    return s;
  }

  var KINDS = [
    simple(['q']),            // the queen alone
    simple(['q', 'r']),       // queen and rook
    simple(['r', 'r']),       // the ladder
    simple(['r']),            // the lone rook
    simple(['r', 'n']),       // rook and knight
    simple(['q', 'b']),       // queen and bishop
    twoBishops,
    backRank
  ];

  function buildPuzzle(make) {
    for (var attempt = 0; attempt < ATTEMPTS; attempt++) {
      var s = make();
      if (!s) continue;
      if (Rules.inCheck(s, 'b') || Rules.inCheck(s, 'w')) continue;   // White must be to move
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
    var queue = KINDS.slice().sort(function () { return Math.random() - 0.5; });
    var puzzle, state, round = 0, solved = 0, clean = true, hints = 0, sel = null, dead = false;

    Board.setup({ size: SIZE, flipped: false });
    Board.onTap(onTap);
    ctx.setTools({ hint: true, undo: false, restart: true });
    ctx.relabel(function () { status(); panel(); });

    function build() {
      round++;
      clean = true;
      hints = 0;
      sel = null;
      puzzle = buildPuzzle(queue[(round - 1) % queue.length]) || buildPuzzle(KINDS[0]);
      state = puzzle ? puzzle.state : Rules.makeState(SIZE, {});
      ['good', 'bad', 'sel', 'target', 'cap', 'hint'].forEach(function (c) { Board.clearMarks(c); });
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

    /* First press shows which piece moves, second press shows where. */
    function hint() {
      if (dead || !puzzle) return;
      clean = false;
      hints++;
      Board.clearMarks('hint');
      Board.mark(puzzle.answer.from, 'hint');
      if (hints > 1) Board.mark(puzzle.answer.to, 'hint');
      Sound.play('select');
    }

    function done() {
      dead = true;
      Quiz.finish(ctx, { value: solved, total: PUZZLES, recordKey: 'mate1', emoji: '👑' });
    }

    build();

    return { hint: hint, destroy: function () { dead = true; } };
  }

  App.registerMode({
    id: 'mate1',
    order: 2,
    group: 'advanced',
    icon: function () { return '<span class="ic-pair">' + Pieces.svg('q', 'w') + Pieces.svg('k', 'b') + '</span>'; },
    titleKey: 'mode.mate1.title',
    descKey: 'mode.mate1.desc',
    helpKey: 'help.mate1',
    options: [],
    start: start
  });
})();
