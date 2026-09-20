/* Battle for the Centre — two knights and two bishops per side.
   Stand on a golden square and survive one enemy move, and you win. */
(function () {
  'use strict';

  var SIZE = 8;

  function buildState() {
    var s = Rules.makeState(SIZE, { promote: 'q', turn: 'w' });
    [[1, 'n'], [6, 'n'], [2, 'b'], [5, 'b']].forEach(function (pair) {
      Rules.place(s, Rules.idx(s, SIZE - 1, pair[0]), pair[1], 'w');
      Rules.place(s, Rules.idx(s, 0, pair[0]), pair[1], 'b');
    });
    return s;
  }

  function targetsFor(mode) {
    /* rows 3 and 4 are ranks 5 and 4, columns 3 and 4 are files d and e */
    if (mode === '4') return [3 * SIZE + 3, 3 * SIZE + 4, 4 * SIZE + 3, 4 * SIZE + 4];
    return [4 * SIZE + 4];   // e4
  }

  function attackers(s, sq, color) {
    var n = 0;
    for (var i = 0; i < s.sq.length; i++) {
      var p = s.sq[i];
      if (!p || p.c !== color) continue;
      var moves = Rules.movesFrom(s, i);
      for (var j = 0; j < moves.length; j++) if (moves[j].to === sq) { n++; break; }
    }
    return n;
  }

  function dist(s, a, b) {
    return Math.max(Math.abs(Rules.rowOf(s, a) - Rules.rowOf(s, b)),
      Math.abs(Rules.colOf(s, a) - Rules.colOf(s, b)));
  }

  function makeEval(targets) {
    function sideVal(s, color) {
      var opp = Rules.other(color);
      var v = 0, own = [];
      for (var i = 0; i < s.sq.length; i++) {
        var p = s.sq[i];
        if (p && p.c === color) { v += 30; own.push(i); }
      }
      if (!own.length) return -5000;
      for (var k = 0; k < targets.length; k++) {
        var tsq = targets[k];
        var here = s.sq[tsq];
        var near = 99;
        for (var m = 0; m < own.length; m++) near = Math.min(near, dist(s, own[m], tsq));
        v += (8 - near) * 3;
        v += attackers(s, tsq, color) * 12;
        if (here && here.c === color) {
          var hit = attackers(s, tsq, opp);
          v += hit === 0 ? 900 : 150 + (attackers(s, tsq, color) - 1 - hit) * 60;
        }
      }
      return v;
    }
    return function (s, color) {
      var opp = Rules.other(color);
      if (Rules.count(s, opp) === 0) return 9000;
      if (Rules.count(s, color) === 0) return -9000;
      return sideVal(s, color) - sideVal(s, opp);
    };
  }

  function start(cfg, ctx) {
    var targets = targetsFor(cfg.target);
    var evaluate = makeEval(targets);
    var vsCpu = cfg.opponent === 'cpu';
    var human = vsCpu ? cfg.side : null;
    var cpu = vsCpu ? Rules.other(human) : null;
    var state = buildState();
    var history = [];
    var claim = null;                 // { c: colour, sq: index }
    var sel = null, dead = false, busy = false, timer = null;

    Board.setup({ size: SIZE, flipped: vsCpu && human === 'b' });
    Board.render(state);
    targets.forEach(function (i) { Board.mark(i, 'golden'); });
    Board.onTap(onTap);
    ctx.setTools({ hint: true, undo: true, restart: true });
    ctx.relabel(refresh);

    function isHuman(color) { return !vsCpu || color === human; }

    function nameOf(color) {
      if (!vsCpu) return ctx.t(color === 'w' ? 'game.white' : 'game.black');
      return color === human ? ctx.t('game.you') : ctx.t('game.computer');
    }

    function refresh(msg) {
      if (dead) return;
      var text;
      if (msg) text = msg;
      else if (claim && isHuman(claim.c) && claim.c === state.turn) text = ctx.t('game.claim');
      else if (vsCpu) text = state.turn === human ? ctx.t('game.yourturn') : ctx.t('game.cputurn');
      else text = ctx.t(state.turn === 'w' ? 'game.turn.w' : 'game.turn.b');
      ctx.setStatus(text, state.turn === 'w' ? 'white-turn' : 'black-turn');
      ctx.setScore(row('w') + row('b') +
        '<div class="score-note">' + ctx.t('game.pieces') + '</div>');
    }

    function row(color) {
      return '<div class="score-row' + (vsCpu && color === human ? ' me' : '') + '">' +
        '<span class="chip-piece ' + color + '">' + Pieces.svg('n', color) + '</span>' +
        '<span class="score-name">' + nameOf(color) + '</span>' +
        '<b>' + Rules.count(state, color) + '</b></div>';
    }

    function clearSelection() {
      sel = null;
      Board.clearMarks('sel');
      Board.clearMarks('target');
      Board.clearMarks('cap');
    }

    function onTap(i) {
      if (dead || busy || !isHuman(state.turn)) return;
      if (sel !== null) {
        var list = Rules.movesFrom(state, sel).filter(function (m) { return m.to === i; });
        if (list.length) { clearSelection(); play(list[0]); return; }
      }
      var p = state.sq[i];
      if (p && p.c === state.turn) {
        clearSelection(); sel = i;
        Board.mark(i, 'sel');
        Sound.play('select');
        Rules.movesFrom(state, i).forEach(function (m) {
          Board.mark(m.to, m.cap !== null ? 'cap' : 'target');
        });
      } else {
        clearSelection();
        if (p) { Board.shake(i); Sound.play('error'); }
      }
    }

    function play(move) {
      var mover = state.turn;
      history.push({ state: Rules.clone(state), claim: claim ? { c: claim.c, sq: claim.sq } : null });
      var res = Rules.apply(state, move);
      state = res.state;
      Board.clearMarks('last');
      Board.clearMarks('hint');
      Board.mark(move.from, 'last');
      Board.mark(move.to, 'last');
      Board.render(state);
      Sound.play(res.captured ? 'capture' : 'move');

      /* A claim that survived the opponent's answer wins the game. */
      if (claim && claim.c !== mover) {
        var holder = state.sq[claim.sq];
        if (holder && holder.c === claim.c) { finish(claim.c); return; }
        claim = null;
      }
      if (claim && claim.c === mover) {
        var still = state.sq[claim.sq];
        if (!still || still.c !== mover) claim = null;
      }
      if (targets.indexOf(move.to) >= 0) {
        claim = { c: mover, sq: move.to };
        Board.clearMarks('claim');
        Board.mark(move.to, 'claim');
      } else if (!claim) {
        Board.clearMarks('claim');
      }

      if (Rules.count(state, Rules.other(mover)) === 0) { finish(mover, true); return; }
      refresh();
      if (vsCpu && state.turn === cpu) cpuTurn();
    }

    function cpuTurn() {
      busy = true;
      Board.setLocked(true);
      timer = setTimeout(function () {
        if (dead) return;
        var move = AI.pickMove(state, cpu, {
          level: parseInt(cfg.level, 10),
          genMoves: function (s, c) { return Rules.allMoves(s, c); },
          evaluate: evaluate
        });
        busy = false;
        Board.setLocked(false);
        if (move) play(move);
        else { state.turn = human; refresh(ctx.t('game.nomoves')); }
      }, 450 + Math.random() * 350);
    }

    function finish(winner, byCapture) {
      dead = true;
      var res = { emoji: '🏆' };
      if (vsCpu) {
        res.win = winner === human;
        res.title = ctx.t(res.win ? 'result.win' : 'result.lose');
        if (!res.win) res.emoji = '🤖';
      } else {
        res.win = true;
        res.title = ctx.t(winner === 'w' ? 'result.wwin' : 'result.bwin');
      }
      res.text = ctx.t(byCapture ? 'result.captured' : 'result.center');
      ctx.finish(res);
    }

    function hint() {
      if (dead || busy || !isHuman(state.turn)) return;
      var move = AI.pickMove(state, state.turn, {
        level: 4,
        genMoves: function (s, c) { return Rules.allMoves(s, c); },
        evaluate: evaluate
      });
      Board.clearMarks('hint');
      if (!move) { refresh(ctx.t('game.nohint')); return; }
      Board.mark(move.from, 'hint');
      Board.mark(move.to, 'hint');
      Sound.play('select');
    }

    function undo() {
      if (dead || busy || !history.length) return;
      clearSelection();
      Board.clearMarks('last');
      Board.clearMarks('hint');
      Board.clearMarks('claim');
      var prev;
      do {
        prev = history.pop();
      } while (history.length && vsCpu && prev.state.turn !== human);
      state = prev.state;
      claim = prev.claim;
      if (claim) Board.mark(claim.sq, 'claim');
      Board.render(state);
      refresh();
      if (vsCpu && state.turn === cpu) cpuTurn();
    }

    refresh();
    if (vsCpu && state.turn === cpu) cpuTurn();

    return {
      hint: hint,
      undo: undo,
      destroy: function () { dead = true; clearTimeout(timer); Board.setLocked(false); }
    };
  }

  App.registerMode({
    id: 'center',
    icon: '<span class="ic-pair">' + Pieces.svg('n', 'w') + Pieces.svg('b', 'b') + '</span>',
    titleKey: 'mode.center.title',
    descKey: 'mode.center.desc',
    helpKey: 'help.center',
    options: [
      { key: 'opponent', labelKey: 'opt.opponent', def: 'cpu', choices: [
        { v: 'cpu', labelKey: 'opt.opponent.cpu', icon: '🤖' },
        { v: 'two', labelKey: 'opt.opponent.two', icon: '👥' }
      ] },
      { key: 'side', labelKey: 'opt.side', def: 'w',
        showIf: function (c) { return c.opponent === 'cpu'; },
        choices: [
          { v: 'w', labelKey: 'opt.side.w', icon: Pieces.svg('n', 'w') },
          { v: 'b', labelKey: 'opt.side.b', icon: Pieces.svg('n', 'b') }
        ] },
      { key: 'level', labelKey: 'opt.level', def: '2',
        showIf: function (c) { return c.opponent === 'cpu'; },
        choices: [
          { v: '1', labelKey: 'opt.level.1', icon: '😴' },
          { v: '2', labelKey: 'opt.level.2', icon: '🙂' },
          { v: '3', labelKey: 'opt.level.3', icon: '😎' },
          { v: '4', labelKey: 'opt.level.4', icon: '👑' }
        ] },
      { key: 'target', labelKey: 'opt.target', def: '1', choices: [
        { v: '1', labelKey: 'opt.target.1', icon: '⭐' },
        { v: '4', labelKey: 'opt.target.4', icon: '✨' }
      ] }
    ],
    start: start
  });
})();
