/* Knight Race — both knights start in a bottom corner and race to the far
   corner diagonally opposite. Landing on the other knight wins on the spot. */
(function () {
  'use strict';

  function goalsFor(size) {
    return {
      w: { start: (size - 1) * size, goal: size - 1 },              // a1 -> h8
      b: { start: size * size - 1, goal: 0 }                        // h1 -> a8
    };
  }

  function makeEval(size, spec) {
    var empty = Rules.makeState(size, {});
    return function (s, color) {
      var opp = Rules.other(color);
      var mine = -1, theirs = -1;
      for (var i = 0; i < s.sq.length; i++) {
        var p = s.sq[i];
        if (!p) continue;
        if (p.c === color) mine = i; else theirs = i;
      }
      if (mine < 0) return -9000;
      if (theirs < 0) return 9000;
      if (mine === spec[color].goal) return 8000;
      if (theirs === spec[opp].goal) return -8000;
      var dMine = Rules.knightDistance(empty, mine, spec[color].goal);
      var dTheirs = Rules.knightDistance(empty, theirs, spec[opp].goal);
      var v = (dTheirs - dMine) * 100;
      /* standing where the other knight can eat you is a bad idea */
      if (Rules.movesFrom(s, theirs).some(function (m) { return m.to === mine; })) v -= 60;
      return v;
    };
  }

  function start(cfg, ctx) {
    var size = parseInt(cfg.size, 10);
    var spec = goalsFor(size);
    var evaluate = makeEval(size, spec);
    var vsCpu = cfg.opponent === 'cpu';
    var human = vsCpu ? cfg.side : null;
    var cpu = vsCpu ? Rules.other(human) : null;
    var state = Rules.makeState(size, { turn: 'w' });
    var played = { w: 0, b: 0 };
    var sel = null, dead = false, busy = false, timer = null;

    Rules.place(state, spec.w.start, 'n', 'w');
    Rules.place(state, spec.b.start, 'n', 'b');

    Board.setup({ size: size, flipped: vsCpu && human === 'b' });
    Board.render(state);
    Board.decor(spec.w.goal, '🏁', 'flag-decor');
    Board.decor(spec.b.goal, '🏁', 'flag-decor');
    Board.mark(spec.w.goal, 'goal');
    Board.mark(spec.b.goal, 'goal');
    Board.onTap(onTap);
    ctx.setTools({ hint: true, undo: false, restart: true });
    ctx.relabel(refresh);

    function isHuman(color) { return !vsCpu || color === human; }

    function nameOf(color) {
      if (!vsCpu) return ctx.t(color === 'w' ? 'game.white' : 'game.black');
      return color === human ? ctx.t('game.you') : ctx.t('game.computer');
    }

    function refresh(msg) {
      if (dead) return;
      var text = msg || (vsCpu
        ? (state.turn === human ? ctx.t('game.yourturn') : ctx.t('game.cputurn'))
        : ctx.t(state.turn === 'w' ? 'game.turn.w' : 'game.turn.b'));
      ctx.setStatus(text, state.turn === 'w' ? 'white-turn' : 'black-turn');
      var rows = ['w', 'b'].map(function (c) {
        return '<div class="score-row' + (vsCpu && c === human ? ' me' : '') + '">' +
          '<span class="chip-piece ' + c + '">' + Pieces.svg('n', c) + '</span>' +
          '<span class="score-name">' + nameOf(c) + '</span><b>' + played[c] + '</b></div>';
      }).join('');
      var best = vsCpu ? Scores.get('knightrace.fast.' + cfg.level) : undefined;
      ctx.setScore(rows + '<div class="score-note">' + ctx.t('game.moves') + '</div>' +
        (best !== undefined ? Quiz.row('🏅', ctx.t('game.best'), best) : ''));
    }

    function clearSel() {
      sel = null;
      Board.clearMarks('sel');
      Board.clearMarks('target');
      Board.clearMarks('cap');
    }

    function onTap(i) {
      if (dead || busy || !isHuman(state.turn)) return;
      if (sel !== null) {
        var list = Rules.movesFrom(state, sel).filter(function (m) { return m.to === i; });
        if (list.length) { clearSel(); play(list[0]); return; }
      }
      var p = state.sq[i];
      if (p && p.c === state.turn) {
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
      var mover = state.turn;
      var res = Rules.apply(state, move);
      state = res.state;
      played[mover]++;
      Board.clearMarks('last');
      Board.clearMarks('hint');
      Board.mark(move.from, 'last');
      Board.mark(move.to, 'last');
      Board.render(state);
      Sound.play(res.captured ? 'capture' : 'move');
      if (res.captured) { finish(mover, true); return; }
      if (move.to === spec[mover].goal) { finish(mover, false); return; }
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
      }, 420 + Math.random() * 320);
    }

    function finish(winner, byCapture) {
      dead = true;
      var res = { emoji: byCapture ? '😋' : '🏁' };
      if (vsCpu) {
        res.win = winner === human;
        res.title = ctx.t(res.win ? 'result.win' : 'result.lose');
        if (!res.win) res.emoji = '🤖';
      } else {
        res.win = true;
        res.title = ctx.t(winner === 'w' ? 'result.wwin' : 'result.bwin');
      }
      res.text = ctx.t(vsCpu && winner === human ? 'result.inmoves' : 'result.inmovestotal',
        { n: played[winner] });
      if (vsCpu && winner === human) {
        Scores.submit('knightrace.wins.' + cfg.level, 1);
        if (Scores.submit('knightrace.fast.' + cfg.level, played[human]).isRecord) {
          res.text += '  ' + ctx.t('result.newbest');
        }
      }
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
      if (!move) return;
      Board.mark(move.from, 'hint');
      Board.mark(move.to, 'hint');
      Sound.play('select');
    }

    refresh();
    if (vsCpu && state.turn === cpu) cpuTurn();

    return {
      hint: hint,
      destroy: function () { dead = true; clearTimeout(timer); Board.setLocked(false); Board.clearDecor(); }
    };
  }

  App.registerMode({
    id: 'knightrace',
    order: 3,
    group: 'learning',
    icon: '<span class="ic-pair">' + Pieces.svg('n', 'w') + Pieces.svg('n', 'b') + '</span>',
    titleKey: 'mode.knightrace.title',
    descKey: 'mode.knightrace.desc',
    helpKey: 'help.knightrace',
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
      { key: 'size', labelKey: 'opt.size', def: '8', choices: [
        { v: '6', labelKey: 'opt.size.6' },
        { v: '8', labelKey: 'opt.size.8' }
      ] }
    ],
    start: start
  });
})();
