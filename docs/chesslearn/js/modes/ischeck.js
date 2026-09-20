/* Is it Check? — ten quick yes/no positions, then the answer is shown. */
(function () {
  'use strict';

  var SIZE = 8;
  var QUESTIONS = 10;
  var TYPES = ['r', 'b', 'n', 'q', 'p'];

  function randInt(n) { return Math.floor(Math.random() * n); }

  function start(cfg, ctx) {
    var state, kingAt, isCheck, round = 0, right = 0, dead = false, waiting = false;

    Board.setup({ size: SIZE, flipped: false });
    Board.onTap(function () { /* the board is only here to be looked at */ });
    ctx.setTools({ hint: false, undo: false, restart: true });
    ctx.relabel(function () { status(); panel(); });

    /* Half the questions are a check, half are not — decided up front. */
    function build() {
      round++;
      var want = round % 2 === 0;
      for (var attempt = 0; attempt < 400; attempt++) {
        var s = Rules.makeState(SIZE, {});
        kingAt = randInt(SIZE * SIZE);
        Rules.place(s, kingAt, 'k', 'b');
        var count = 1 + randInt(3);
        for (var n = 0; n < count; n++) {
          var at;
          do { at = randInt(SIZE * SIZE); } while (s.sq[at]);
          var type = TYPES[randInt(TYPES.length)];
          var row = Rules.rowOf(s, at);
          if (type === 'p' && (row === 0 || row === SIZE - 1)) type = 'r';
          Rules.place(s, at, type, 'w');
        }
        if (Rules.inCheck(s, 'b') === want) { state = s; isCheck = want; break; }
      }
      waiting = false;
      Board.clearMarks('bad');
      Board.clearMarks('good');
      Board.clearMarks('sel');
      Board.render(state);
      status();
      panel();
    }

    function status(msg) {
      if (dead) return;
      ctx.setStatus(msg || ctx.t('mode.ischeck.desc'), 'white-turn');
    }

    function panel() {
      var html =
        Quiz.row('🧩', ctx.t('quiz.round'), round + '/' + QUESTIONS) +
        Quiz.row('✅', ctx.t('quiz.right'), right);
      var best = Scores.get('ischeck');
      if (best !== undefined) html += Quiz.row('🏅', ctx.t('game.best'), best);
      html += '<div class="answer-row">' +
        '<button id="ansYes" class="answer-btn yes">' + ctx.t('quiz.yes') + '</button>' +
        '<button id="ansNo" class="answer-btn no">' + ctx.t('quiz.no') + '</button></div>';
      ctx.setScore(html);
      var yes = document.getElementById('ansYes');
      var no = document.getElementById('ansNo');
      if (yes) yes.addEventListener('click', function () { answer(true); });
      if (no) no.addEventListener('click', function () { answer(false); });
    }

    function answer(said) {
      if (dead || waiting) return;
      waiting = true;
      var ok = said === isCheck;
      if (ok) { right++; Sound.play('star'); } else Sound.play('error');
      Board.mark(kingAt, isCheck ? 'bad' : 'good');
      if (isCheck) {
        /* light up whoever is giving the check */
        for (var i = 0; i < state.sq.length; i++) {
          var p = state.sq[i];
          if (!p || p.c !== 'w') continue;
          var hits = Rules.movesFrom(state, i).some(function (m) { return m.to === kingAt; });
          if (p.t === 'p') {
            var r = Rules.rowOf(state, i) + Rules.forward('w'), c = Rules.colOf(state, i);
            hits = [c - 1, c + 1].some(function (cc) {
              return Rules.inside(state, r, cc) && Rules.idx(state, r, cc) === kingAt;
            });
          }
          if (hits) Board.mark(i, 'sel');
        }
      }
      status(ctx.t(ok ? 'quiz.correct' : 'quiz.nope'));
      panel();
      setTimeout(function () {
        if (dead) return;
        if (round >= QUESTIONS) done(); else build();
      }, 1400);
    }

    function done() {
      dead = true;
      Quiz.finish(ctx, { value: right, total: QUESTIONS, recordKey: 'ischeck', emoji: '👑' });
    }

    build();

    return { destroy: function () { dead = true; } };
  }

  App.registerMode({
    id: 'ischeck',
    order: 4,
    group: 'learning',
    icon: '<span class="ic-pair">' + Pieces.svg('k', 'b') + '<span class="ic-star">?</span></span>',
    titleKey: 'mode.ischeck.title',
    descKey: 'mode.ischeck.desc',
    helpKey: 'help.ischeck',
    options: [],
    start: start
  });
})();
