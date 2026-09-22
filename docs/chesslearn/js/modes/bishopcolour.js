/* The Bishop's Colour — of the six question marks, which can the bishop reach?
   Five rounds; a round counts only if it is solved with no wrong tap. */
(function () {
  'use strict';

  var SIZE = 8;
  var ROUNDS = 5;
  var GOOD = 3, BAD = 3;

  function randInt(n) { return Math.floor(Math.random() * n); }

  function start(cfg, ctx) {
    var state, bishopAt, wanted, found, clean, hero, solved = 0, round = 0;
    var mistakes = 0, dead = false;

    Board.setup({ size: SIZE, flipped: false });
    Board.onTap(onTap);
    ctx.setTools({ hint: false, undo: false, restart: true });
    ctx.relabel(function () { status(); panel(); });

    function build() {
      round++;
      clean = true;
      state = Rules.makeState(SIZE, {});
      bishopAt = randInt(SIZE * SIZE);
      if (!hero) hero = Rules.piece('b', 'w');
      state.sq[bishopAt] = hero;
      var colour = (Rules.rowOf(state, bishopAt) + Rules.colOf(state, bishopAt)) % 2;
      var same = [], other = [];
      for (var i = 0; i < SIZE * SIZE; i++) {
        if (i === bishopAt) continue;
        ((Rules.rowOf(state, i) + Rules.colOf(state, i)) % 2 === colour ? same : other).push(i);
      }
      wanted = pickSome(same, GOOD);
      var decoys = pickSome(other, BAD);
      found = [];
      Board.clearDecor();
      Board.clearMarks('good');
      Board.clearMarks('bad');
      Board.render(state);
      wanted.concat(decoys).forEach(function (i) { Board.decor(i, '?', 'q-decor'); });
      status();
      panel();
    }

    function pickSome(list, n) {
      var copy = list.slice(), out = [];
      for (var k = 0; k < n && copy.length; k++) out.push(copy.splice(randInt(copy.length), 1)[0]);
      return out;
    }

    function status(msg) {
      if (dead) return;
      ctx.setStatus(msg || ctx.t('help.bishop'), 'white-turn');
    }

    function panel() {
      Quiz.panel(ctx, [
        { icon: '🧩', label: ctx.t('quiz.round'), value: round + '/' + ROUNDS },
        { icon: '✅', label: ctx.t('quiz.found'), value: found.length + '/' + GOOD },
        { icon: '❌', label: ctx.t('quiz.wrong'), value: mistakes }
      ], 'bishop');
    }

    function onTap(i) {
      if (dead) return;
      if (found.indexOf(i) >= 0) return;
      if (wanted.indexOf(i) >= 0) {
        found.push(i);
        Board.mark(i, 'good');
        Sound.play('star');
        panel();
        if (found.length === wanted.length) {
          if (clean) solved++;
          if (round >= ROUNDS) { setTimeout(done, 500); return; }
          setTimeout(function () { if (!dead) build(); }, 650);
        }
      } else {
        mistakes++;
        clean = false;
        Board.mark(i, 'bad');
        Board.shake(i);
        Sound.play('error');
        panel();
      }
    }

    function done() {
      dead = true;
      Quiz.finish(ctx, { value: solved, total: ROUNDS, recordKey: 'bishop', emoji: '🎨' });
    }

    build();

    return { destroy: function () { dead = true; Board.clearDecor(); } };
  }

  App.registerMode({
    id: 'bishop',
    order: 3,
    group: 'beginner',
    icon: function () { return '<span class="ic-pair">' + Pieces.svg('b', 'w') + '<span class="ic-star">?</span></span>'; },
    titleKey: 'mode.bishop.title',
    descKey: 'mode.bishop.desc',
    helpKey: 'help.bishop',
    options: [],
    start: start
  });
})();
