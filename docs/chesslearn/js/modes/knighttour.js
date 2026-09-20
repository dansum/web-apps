/* Knight's Tour — hop on every square exactly once.
   The knight always starts in a corner, where a full tour is possible. */
(function () {
  'use strict';

  function start(cfg, ctx) {
    var size = parseInt(cfg.tsize, 10);
    var state, at, visited, order, hero, dead = false;
    var bestKey = 'knight.' + size;

    Board.setup({ size: size, flipped: false });
    Board.onTap(onTap);
    ctx.setTools({ hint: true, undo: true, restart: true });
    ctx.relabel(refresh);

    function build() {
      state = Rules.makeState(size, { promote: 'q', turn: 'w' });
      var corners = [0, size - 1, size * (size - 1), size * size - 1];
      at = corners[Math.floor(Math.random() * corners.length)];
      hero = Rules.place(state, at, 'n', 'w');
      visited = {};
      order = [at];
      visited[at] = 1;
      Board.clearDecor();
      Board.clearMarks('visited');
      Board.render(state);
      paint();
    }

    function legal() {
      return Rules.movesFrom(state, at).filter(function (m) { return !visited[m.to]; });
    }

    function paint() {
      Board.clearMarks('target');
      Board.clearMarks('sel');
      Board.mark(at, 'sel');
      legal().forEach(function (m) { Board.mark(m.to, 'target'); });
    }

    function stamp(i, n) { Board.decor(i, String(n), 'num-decor'); }

    function refresh(msg) {
      if (dead) return;
      var total = size * size;
      var best = Scores.get(bestKey);
      ctx.setStatus(msg || ctx.t('game.yourturn'), 'white-turn');
      ctx.setScore(
        '<div class="score-row"><span class="chip-icon">👣</span>' +
        '<span class="score-name">' + ctx.t('game.visited') + '</span><b>' +
        order.length + '/' + total + '</b></div>' +
        (best ? '<div class="score-row"><span class="chip-icon">🏅</span>' +
          '<span class="score-name">' + ctx.t('game.best') + '</span><b>' + best + '</b></div>' : '')
      );
    }

    function onTap(i) {
      if (dead) return;
      var ok = legal().filter(function (m) { return m.to === i; });
      if (!ok.length) { Board.shake(i); Sound.play('error'); return; }
      stamp(at, order.length);
      Board.mark(at, 'visited');
      var res = Rules.apply(state, ok[0]);
      state = res.state;
      state.turn = 'w';
      at = i;
      visited[i] = 1;
      order.push(i);
      Board.render(state);
      Sound.play('move');
      paint();
      refresh();
      if (order.length === size * size) { win(); return; }
      if (!legal().length) { stuck(); }
    }

    function win() {
      dead = true;
      Scores.submit(bestKey, order.length);
      ctx.finish({
        win: true, emoji: '🐎',
        title: ctx.t('result.win'),
        text: ctx.t('result.visited', { n: order.length, t: size * size }),
        stars: 3
      });
    }

    function stuck() {
      dead = true;
      var total = size * size;
      Scores.submit(bestKey, order.length);
      ctx.finish({
        win: false, emoji: '😓', sound: 'lose',
        title: ctx.t('result.stuck'),
        text: ctx.t('result.visited', { n: order.length, t: total }),
        stars: order.length >= total - 2 ? 2 : 1
      });
    }

    /* Warnsdorff: go to the square with the fewest onward jumps. */
    function hint() {
      if (dead) return;
      var options = legal();
      Board.clearMarks('hint');
      if (!options.length) { refresh(ctx.t('game.nohint')); return; }
      var best = null, bestCount = 99;
      options.forEach(function (m) {
        var work = Rules.clone(state);
        work.sq[at] = null;
        work.sq[m.to] = state.sq[at];
        var onward = Rules.movesFrom(work, m.to).filter(function (x) { return !visited[x.to]; }).length;
        if (onward < bestCount) { bestCount = onward; best = m; }
      });
      Board.mark(best.to, 'hint');
      Sound.play('select');
    }

    function undo() {
      if (dead || order.length < 2) return;
      var last = order.pop();
      delete visited[last];
      state.sq[last] = null;
      at = order[order.length - 1];
      state.sq[at] = hero;
      Board.clearDecor();
      Board.clearMarks('visited');
      for (var k = 0; k < order.length - 1; k++) {
        stamp(order[k], k + 1);
        Board.mark(order[k], 'visited');
      }
      Board.render(state);
      paint();
      refresh();
    }

    build();
    refresh();

    return {
      hint: hint,
      undo: undo,
      destroy: function () { dead = true; Board.clearDecor(); }
    };
  }

  App.registerMode({
    id: 'knight',
    order: 2,
    group: 'learning',
    icon: '<span class="ic-pair">' + Pieces.svg('n', 'w') + '<span class="ic-star">⭐</span></span>',
    titleKey: 'mode.knight.title',
    descKey: 'mode.knight.desc',
    helpKey: 'help.knight',
    options: [
      { key: 'tsize', labelKey: 'opt.tsize', def: '5', choices: [
        { v: '5', labelKey: 'opt.tsize.5' },
        { v: '6', labelKey: 'opt.tsize.6' }
      ] }
    ],
    start: start
  });
})();
