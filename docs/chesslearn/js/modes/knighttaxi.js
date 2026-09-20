/* Knight Taxi — five rides. A ride is perfect when it takes the fewest
   possible jumps, which the app works out with a breadth-first search. */
(function () {
  'use strict';

  var RIDES = 5;

  function randInt(n) { return Math.floor(Math.random() * n); }

  function start(cfg, ctx) {
    var size = parseInt(cfg.size, 10);
    var recordKey = 'knighttaxi.' + size;
    var state, at, goal, par, jumps = 0, ride = 0, perfect = 0, hero, dead = false;

    Board.setup({ size: size, flipped: false });
    Board.onTap(onTap);
    ctx.setTools({ hint: false, undo: false, restart: true });
    ctx.relabel(function () { status(); panel(); });

    function build() {
      ride++;
      jumps = 0;
      state = Rules.makeState(size, {});
      var tries = 0;
      do {
        at = randInt(size * size);
        goal = randInt(size * size);
        par = Rules.knightDistance(state, at, goal);
        tries++;
      } while ((par < 3 || par > 5) && tries < 200);
      if (!hero) hero = Rules.piece('n', 'w');
      state.sq[at] = hero;
      Board.clearDecor();
      Board.clearMarks('good');
      Board.render(state);
      Board.decor(goal, '🚩', 'flag-decor');
      paint();
      status();
      panel();
    }

    function paint() {
      Board.clearMarks('sel');
      Board.clearMarks('target');
      Board.mark(at, 'sel');
      Rules.movesFrom(state, at).forEach(function (m) { Board.mark(m.to, 'target'); });
    }

    function status(msg) {
      if (dead) return;
      ctx.setStatus(msg || ctx.t('help.knighttaxi'), 'white-turn');
    }

    function panel() {
      Quiz.panel(ctx, [
        { icon: '🚕', label: ctx.t('quiz.rides'), value: ride + '/' + RIDES },
        { icon: '👣', label: ctx.t('quiz.jumps'), value: jumps },
        { icon: '🎯', label: ctx.t('quiz.par'), value: par },
        { icon: '⭐', label: ctx.t('quiz.perfect'), value: perfect }
      ], recordKey);
    }

    function onTap(i) {
      if (dead) return;
      var moves = Rules.movesFrom(state, at).filter(function (m) { return m.to === i; });
      if (!moves.length) { Board.shake(i); Sound.play('error'); return; }
      state.sq[at] = null;
      state.sq[i] = hero;
      at = i;
      jumps++;
      Board.render(state);
      paint();
      panel();
      if (at === goal) {
        if (jumps <= par) { perfect++; Sound.play('star'); } else Sound.play('move');
        Board.mark(at, 'good');
        panel();
        if (ride >= RIDES) { setTimeout(done, 600); return; }
        setTimeout(function () { if (!dead) build(); }, 700);
      } else {
        Sound.play('move');
      }
    }

    function done() {
      dead = true;
      Quiz.finish(ctx, {
        value: perfect, total: RIDES, recordKey: recordKey, emoji: '🚕',
        text: ctx.t('result.perfect', { a: perfect, b: RIDES })
      });
    }

    build();

    return { destroy: function () { dead = true; Board.clearDecor(); } };
  }

  App.registerMode({
    id: 'knighttaxi',
    order: 1,
    group: 'learning',
    icon: '<span class="ic-pair">' + Pieces.svg('n', 'w') + '<span class="ic-star">🚩</span></span>',
    titleKey: 'mode.knighttaxi.title',
    descKey: 'mode.knighttaxi.desc',
    helpKey: 'help.knighttaxi',
    options: [
      { key: 'size', labelKey: 'opt.size', def: '8', choices: [
        { v: '6', labelKey: 'opt.size.6' },
        { v: '8', labelKey: 'opt.size.8' }
      ] }
    ],
    start: start
  });
})();
