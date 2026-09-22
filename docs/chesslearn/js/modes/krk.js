/* Rook and King — the classic first endgame. You have a king and a rook,
   the computer has a lonely king. Mate it before the moves run out. */
(function () {
  'use strict';

  var SIZE = 8;
  var LIMIT = 40;

  function randInt(n) { return Math.floor(Math.random() * n); }

  function cheb(s, a, b) {
    return Math.max(Math.abs(Rules.rowOf(s, a) - Rules.rowOf(s, b)),
      Math.abs(Rules.colOf(s, a) - Rules.colOf(s, b)));
  }

  function rookSquare(s) {
    for (var i = 0; i < s.sq.length; i++) {
      var p = s.sq[i];
      if (p && p.c === 'w' && p.t === 'r') return i;
    }
    return -1;
  }

  /* Always from White's point of view. */
  function score(s) {
    var rook = rookSquare(s);
    if (rook < 0) return -5000;
    var bk = Rules.kingSquare(s, 'b'), wk = Rules.kingSquare(s, 'w');
    var free = Rules.legalMoves(s, 'b').length;
    if (!free) return Rules.inCheck(s, 'b') ? 100000 : -20000;   // mate, or the stalemate trap
    var r = Rules.rowOf(s, bk), c = Rules.colOf(s, bk);
    var edge = Math.min(r, SIZE - 1 - r, c, SIZE - 1 - c);
    var v = -40 * edge - 6 * cheb(s, wk, bk) - 3 * free;
    if (cheb(s, bk, rook) === 1 && cheb(s, wk, rook) !== 1) v -= 300;  // hanging rook
    return v;
  }

  function buildState() {
    for (;;) {
      var s = Rules.makeState(SIZE, { turn: 'w' });
      var used = {};
      var spot = function () {
        var at;
        do { at = randInt(SIZE * SIZE); } while (used[at]);
        used[at] = true;
        return at;
      };
      var bk = spot(), wk = spot(), rk = spot();
      Rules.place(s, bk, 'k', 'b');
      Rules.place(s, wk, 'k', 'w');
      Rules.place(s, rk, 'r', 'w');
      if (cheb(s, bk, wk) < 2) continue;
      if (Rules.inCheck(s, 'b')) continue;
      if (Rules.legalMoves(s, 'b').length < 2) continue;
      return s;
    }
  }

  function start(cfg, ctx) {
    var state = buildState();
    var moves = 0, sel = null, dead = false, busy = false, timer = null;

    Board.setup({ size: SIZE, flipped: false });
    Board.render(state);
    Board.onTap(onTap);
    ctx.setTools({ hint: true, undo: false, restart: true });
    ctx.relabel(function () { status(); panel(); });

    function status(msg) {
      if (dead) return;
      var text = msg || (Rules.inCheck(state, 'b') ? ctx.t('quiz.check') : ctx.t('game.yourturn'));
      ctx.setStatus(text, 'white-turn');
    }

    function panel() {
      Quiz.panel(ctx, [
        { icon: '👣', label: ctx.t('game.moves'), value: moves + '/' + LIMIT }
      ], 'krk');
    }

    function clearSel() {
      sel = null;
      Board.clearMarks('sel');
      Board.clearMarks('target');
      Board.clearMarks('cap');
    }

    function onTap(i) {
      if (dead || busy) return;
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
      state = Rules.apply(state, move).state;
      moves++;
      Board.clearMarks('last');
      Board.clearMarks('hint');
      Board.mark(move.from, 'last');
      Board.mark(move.to, 'last');
      Board.render(state);
      Sound.play('move');
      panel();
      if (over('b')) return;
      blackTurn();
    }

    function over(side) {
      var legal = Rules.legalMoves(state, side);
      if (legal.length) return false;
      dead = true;
      if (side === 'b' && Rules.inCheck(state, 'b')) {
        Board.mark(Rules.kingSquare(state, 'b'), 'bad');
        var record = Scores.submit('krk', moves).isRecord;
        ctx.finish({
          win: true, emoji: '👑',
          title: ctx.t('result.mate'),
          text: ctx.t('result.inmoves', { n: moves }) + (record ? '  ' + ctx.t('result.newbest') : ''),
          stars: moves <= 16 ? 3 : (moves <= 25 ? 2 : 1)
        });
      } else {
        ctx.finish({
          win: false, emoji: '🤝', sound: 'lose',
          title: ctx.t('result.draw'), text: ctx.t('result.stalemate')
        });
      }
      return true;
    }

    function blackTurn() {
      busy = true;
      Board.setLocked(true);
      timer = setTimeout(function () {
        if (dead) return;
        var legal = Rules.legalMoves(state, 'b');
        var level = parseInt(cfg.level, 10);
        var blunder = [0.6, 0.35, 0.15, 0][level - 1];
        var move;
        if (Math.random() < blunder) {
          move = legal[randInt(legal.length)];
        } else {
          var best = -Infinity, pick = [];
          legal.forEach(function (m) {
            var v = -score(Rules.apply(state, m).state);
            if (v > best + 0.001) { best = v; pick = [m]; }
            else if (Math.abs(v - best) <= 0.001) pick.push(m);
          });
          move = pick[randInt(pick.length)];
        }
        var res = Rules.apply(state, move);
        state = res.state;
        Board.render(state);
        Sound.play(res.captured ? 'capture' : 'move');
        busy = false;
        Board.setLocked(false);
        if (res.captured && res.captured.t === 'r') {
          dead = true;
          ctx.finish({ win: false, emoji: '😱', sound: 'lose',
            title: ctx.t('result.lose'), text: ctx.t('result.norook') });
          return;
        }
        if (moves >= LIMIT) {
          dead = true;
          ctx.finish({ win: false, emoji: '⏰', sound: 'lose',
            title: ctx.t('result.timeup'), text: ctx.t('result.toolong') });
          return;
        }
        status();
        panel();
      }, 420);
    }

    function hint() {
      if (dead || busy) return;
      var move = AI.pickMove(state, 'w', {
        depth: 3,
        genMoves: function (s, c) { return Rules.legalMoves(s, c); },
        isOver: function (s) { return Rules.legalMoves(s, s.turn).length === 0; },
        evaluate: function (s, c) { return score(s) * (c === 'w' ? 1 : -1); }
      });
      Board.clearMarks('hint');
      if (!move) { status(ctx.t('game.nohint')); return; }
      Board.mark(move.from, 'hint');
      Board.mark(move.to, 'hint');
      Sound.play('select');
    }

    status();
    panel();

    return {
      hint: hint,
      destroy: function () { dead = true; clearTimeout(timer); Board.setLocked(false); }
    };
  }

  App.registerMode({
    id: 'krk',
    order: 4,
    group: 'advanced',
    icon: function () { return '<span class="ic-pair">' + Pieces.svg('r', 'w') + Pieces.svg('k', 'b') + '</span>'; },
    titleKey: 'mode.krk.title',
    descKey: 'mode.krk.desc',
    helpKey: 'help.krk',
    options: [
      { key: 'level', labelKey: 'opt.level', def: '2', choices: [
        { v: '1', labelKey: 'opt.level.1', icon: '😴' },
        { v: '2', labelKey: 'opt.level.2', icon: '🙂' },
        { v: '3', labelKey: 'opt.level.3', icon: '😎' },
        { v: '4', labelKey: 'opt.level.4', icon: '👑' }
      ] }
    ],
    start: start
  });
})();
