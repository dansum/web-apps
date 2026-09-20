/* Queens Without a Quarrel — place N queens on an N x N board so that no two
   of them see each other. */
(function () {
  'use strict';

  function conflicts(s, list) {
    var bad = {};
    for (var a = 0; a < list.length; a++) {
      for (var b = a + 1; b < list.length; b++) {
        var ra = Rules.rowOf(s, list[a]), ca = Rules.colOf(s, list[a]);
        var rb = Rules.rowOf(s, list[b]), cb = Rules.colOf(s, list[b]);
        if (ra === rb || ca === cb || Math.abs(ra - rb) === Math.abs(ca - cb)) {
          bad[list[a]] = true;
          bad[list[b]] = true;
        }
      }
    }
    return Object.keys(bad).map(Number);
  }

  /* Can the queens already on the board grow into a full solution? */
  function solveFrom(size, placed) {
    var cols = [];
    for (var i = 0; i < placed.length; i++) cols.push(placed[i]);
    function fits(list, sq) {
      var r = Math.floor(sq / size), c = sq % size;
      return list.every(function (o) {
        var orr = Math.floor(o / size), oc = o % size;
        return orr !== r && oc !== c && Math.abs(orr - r) !== Math.abs(oc - c);
      });
    }
    var rowsUsed = {};
    cols.forEach(function (sq) { rowsUsed[Math.floor(sq / size)] = true; });
    function walk(list, row) {
      if (list.length === size) return list;
      if (row >= size) return null;
      if (rowsUsed[row]) return walk(list, row + 1);
      for (var c = 0; c < size; c++) {
        var sq = row * size + c;
        if (!fits(list, sq)) continue;
        var res = walk(list.concat([sq]), row + 1);
        if (res) return res;
      }
      return null;
    }
    return walk(cols, 0);
  }

  function start(cfg, ctx) {
    var size = parseInt(cfg.size, 10);
    var recordKey = 'queens.' + size;
    var state = Rules.makeState(size, {});
    var placed = [], taps = 0, dead = false;

    Board.setup({ size: size, flipped: false });
    Board.render(state);
    Board.onTap(onTap);
    ctx.setTools({ hint: true, undo: false, restart: true });
    ctx.relabel(function () { status(); panel(); });

    function status(msg) {
      if (dead) return;
      ctx.setStatus(msg || ctx.t('help.queens'), 'white-turn');
    }

    function panel() {
      Quiz.panel(ctx, [
        { icon: '👑', label: ctx.t('quiz.queens'), value: placed.length + '/' + size },
        { icon: '👆', label: ctx.t('quiz.taps'), value: taps }
      ], recordKey);
    }

    function paint() {
      ['bad', 'target', 'hint'].forEach(function (c) { Board.clearMarks(c); });
      var seen = Rules.attacked(state, 'w');
      seen.forEach(function (i) { if (!state.sq[i]) Board.mark(i, 'target'); });
      conflicts(state, placed).forEach(function (i) { Board.mark(i, 'bad'); });
      Board.render(state);
      panel();
    }

    function onTap(i) {
      if (dead) return;
      taps++;
      if (state.sq[i]) {
        state.sq[i] = null;
        placed = placed.filter(function (x) { return x !== i; });
        Sound.play('select');
      } else {
        Rules.place(state, i, 'q', 'w');
        placed.push(i);
        Sound.play('move');
      }
      paint();
      if (placed.length === size && conflicts(state, placed).length === 0) win();
    }

    function win() {
      dead = true;
      var perfect = taps === size;
      Quiz.finish(ctx, {
        value: taps, total: size, recordKey: recordKey, win: true, emoji: '👑',
        title: ctx.t('result.win'),
        text: ctx.t('result.inmoves', { n: taps }),
        stars: perfect ? 3 : (taps <= size * 2 ? 2 : 1)
      });
    }

    function hint() {
      if (dead) return;
      Board.clearMarks('hint');
      if (conflicts(state, placed).length) { status(ctx.t('quiz.noqueen')); return; }
      var solution = solveFrom(size, placed);
      if (!solution) { status(ctx.t('game.nohint')); return; }
      var next = solution.filter(function (sq) { return placed.indexOf(sq) < 0; })[0];
      if (next === undefined) return;
      Board.mark(next, 'hint');
      Sound.play('select');
    }

    status();
    paint();

    return { hint: hint, destroy: function () { dead = true; } };
  }

  App.registerMode({
    id: 'queens',
    order: 3,
    group: 'advanced',
    icon: '<span class="ic-pair">' + Pieces.svg('q', 'w') + Pieces.svg('q', 'w') + '</span>',
    titleKey: 'mode.queens.title',
    descKey: 'mode.queens.desc',
    helpKey: 'help.queens',
    options: [
      { key: 'size', labelKey: 'opt.size', def: '5', choices: [
        { v: '4', labelKey: 'opt.size.4' },
        { v: '5', labelKey: 'opt.size.5' },
        { v: '6', labelKey: 'opt.size.6' }
      ] }
    ],
    start: start
  });
})();
