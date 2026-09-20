/* Pawn Race — every pawn that reaches the far end scores a point.
   Two players on one device, or against the computer. */
(function () {
  'use strict';

  function buildState(size) {
    var s = Rules.makeState(size, { promote: 'remove', turn: 'w' });
    for (var c = 0; c < size; c++) {
      Rules.place(s, Rules.idx(s, 1, c), 'p', 'b');
      Rules.place(s, Rules.idx(s, size - 2, c), 'p', 'w');
    }
    return s;
  }

  function sideValue(s, color) {
    var v = s.scored[color] * 200;
    var opp = Rules.other(color);
    var start = Rules.homeRow(s, color);
    for (var i = 0; i < s.sq.length; i++) {
      var p = s.sq[i];
      if (!p || p.c !== color || p.t !== 'p') continue;
      var r = Rules.rowOf(s, i), c = Rules.colOf(s, i);
      var adv = Math.abs(r - start);
      v += 12 + adv * 8;
      if (isPassed(s, i, color, opp)) v += 25 + adv * 8;
    }
    return v;
  }

  function isPassed(s, i, color, opp) {
    var r = Rules.rowOf(s, i), c = Rules.colOf(s, i);
    var d = Rules.forward(color);
    for (var rr = r + d; rr >= 0 && rr < s.size; rr += d) {
      for (var dc = -1; dc <= 1; dc++) {
        var cc = c + dc;
        if (cc < 0 || cc >= s.size) continue;
        var q = s.sq[Rules.idx(s, rr, cc)];
        if (q && q.c === opp) return false;
      }
    }
    return true;
  }

  function evaluate(s, color) {
    return sideValue(s, color) - sideValue(s, Rules.other(color));
  }

  function start(cfg, ctx) {
    var size = parseInt(cfg.board, 10);
    var vsCpu = cfg.opponent === 'cpu';
    var human = vsCpu ? cfg.side : null;      // null === both sides are human
    var cpu = vsCpu ? Rules.other(human) : null;
    var state = buildState(size);
    var history = [];
    var sel = null, dead = false, busy = false, timer = null;

    Board.setup({ size: size, flipped: vsCpu && human === 'b' });
    Board.render(state);
    markGoals();
    Board.onTap(onTap);
    ctx.setTools({ hint: true, undo: true, restart: true });
    ctx.relabel(refresh);

    function markGoals() {
      for (var c = 0; c < size; c++) {
        Board.mark(Rules.idx(state, 0, c), 'goal');
        Board.mark(Rules.idx(state, size - 1, c), 'goal');
      }
    }

    function isHuman(color) { return !vsCpu || color === human; }

    function nameOf(color) {
      if (!vsCpu) return ctx.t(color === 'w' ? 'game.white' : 'game.black');
      return color === human ? ctx.t('game.you') : ctx.t('game.computer');
    }

    function refresh(msg) {
      if (dead) return;
      var text;
      if (msg) text = msg;
      else if (vsCpu) text = state.turn === human ? ctx.t('game.yourturn') : ctx.t('game.cputurn');
      else text = ctx.t(state.turn === 'w' ? 'game.turn.w' : 'game.turn.b');
      ctx.setStatus(text, state.turn === 'w' ? 'white-turn' : 'black-turn');
      ctx.setScore(
        scoreRow('w') + scoreRow('b') +
        '<div class="score-note">' + ctx.t('game.through') + '</div>'
      );
    }

    function scoreRow(color) {
      var mine = (!vsCpu && state.turn === color) || (vsCpu && color === human);
      return '<div class="score-row' + (mine ? ' me' : '') + '">' +
        '<span class="chip-piece ' + color + '">' + Pieces.svg('p', color) + '</span>' +
        '<span class="score-name">' + nameOf(color) + '</span>' +
        '<b>' + state.scored[color] + '</b></div>';
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
        var moves = Rules.movesFrom(state, sel).filter(function (m) { return m.to === i; });
        if (moves.length) { clearSelection(); play(moves[0]); return; }
      }
      var p = state.sq[i];
      if (p && p.c === state.turn) {
        clearSelection();
        sel = i;
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
      history.push(Rules.clone(state));
      var res = Rules.apply(state, move);
      state = res.state;
      Board.clearMarks('last');
      Board.clearMarks('hint');
      Board.mark(move.from, 'last');
      Board.mark(move.to, 'last');
      Board.render(state);
      Sound.play(res.scored ? 'star' : (res.captured ? 'capture' : 'move'));
      step();
    }

    /* Skips a side with no legal moves, ends the game when nobody can move. */
    function step() {
      var meMoves = Rules.allMoves(state, state.turn).length;
      if (!meMoves) {
        var oppMoves = Rules.allMoves(state, Rules.other(state.turn)).length;
        if (!oppMoves) { refresh(); finish(); return; }
        state.turn = Rules.other(state.turn);
        state.ep = null;
        refresh(ctx.t('game.nomoves'));
        setTimeout(function () { if (!dead) step(); }, 900);
        return;
      }
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
        if (move) play(move); else step();
      }, 420 + Math.random() * 350);
    }

    function finish() {
      var a = state.scored[human || 'w'], b = state.scored[Rules.other(human || 'w')];
      var res = { stars: 0 };
      if (a === b) {
        res.win = false; res.emoji = '🤝';
        res.title = ctx.t('result.draw'); res.sound = 'lose';
      } else if (vsCpu) {
        res.win = a > b;
        res.emoji = res.win ? '🏆' : '🤖';
        res.title = ctx.t(res.win ? 'result.win' : 'result.lose');
      } else {
        res.win = true;
        res.emoji = '🏆';
        res.title = ctx.t(state.scored.w > state.scored.b ? 'result.wwin' : 'result.bwin');
      }
      res.text = vsCpu
        ? ctx.t('result.score', { a: a, b: b })
        : ctx.t('result.score2', { a: state.scored.w, b: state.scored.b });
      dead = true;
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
      do {
        state = history.pop();
      } while (history.length && vsCpu && state.turn !== human);
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
    id: 'pawnrace',
    icon: '<span class="ic-pair">' + Pieces.svg('p', 'w') + Pieces.svg('p', 'b') + '</span>',
    titleKey: 'mode.pawnrace.title',
    descKey: 'mode.pawnrace.desc',
    helpKey: 'help.pawnrace',
    options: [
      { key: 'opponent', labelKey: 'opt.opponent', def: 'cpu', choices: [
        { v: 'cpu', labelKey: 'opt.opponent.cpu', icon: '🤖' },
        { v: 'two', labelKey: 'opt.opponent.two', icon: '👥' }
      ] },
      { key: 'side', labelKey: 'opt.side', def: 'w',
        showIf: function (c) { return c.opponent === 'cpu'; },
        choices: [
          { v: 'w', labelKey: 'opt.side.w', icon: Pieces.svg('p', 'w') },
          { v: 'b', labelKey: 'opt.side.b', icon: Pieces.svg('p', 'b') }
        ] },
      { key: 'level', labelKey: 'opt.level', def: '2',
        showIf: function (c) { return c.opponent === 'cpu'; },
        choices: [
          { v: '1', labelKey: 'opt.level.1', icon: '😴' },
          { v: '2', labelKey: 'opt.level.2', icon: '🙂' },
          { v: '3', labelKey: 'opt.level.3', icon: '😎' },
          { v: '4', labelKey: 'opt.level.4', icon: '👑' }
        ] },
      { key: 'board', labelKey: 'opt.board', def: '8', choices: [
        { v: '8', labelKey: 'opt.board.8' },
        { v: '6', labelKey: 'opt.board.6' }
      ] }
    ],
    start: start
  });
})();
