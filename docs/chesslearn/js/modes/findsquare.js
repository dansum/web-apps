/* Find the Square — we name a square, the child taps it. Sixty seconds. */
(function () {
  'use strict';

  var SIZE = 8;
  var SECONDS = 60;

  function start(cfg, ctx) {
    var help = cfg.help === 'on';
    var recordKey = 'findsquare.' + (help ? 'help' : 'plain');
    var state = Rules.makeState(SIZE, {});
    var target = null, right = 0, wrong = 0, left = SECONDS, dead = false, tick = null;

    Board.setup({ size: SIZE, flipped: false, labels: help });
    Board.render(state);
    Board.onTap(onTap);
    ctx.setTools({ hint: false, undo: false, restart: true });
    ctx.relabel(function () { show(); panel(); });

    function pick() {
      var next;
      do { next = Math.floor(Math.random() * SIZE * SIZE); } while (next === target);
      target = next;
      show();
    }

    function show(msg) {
      if (dead) return;
      ctx.setStatus(msg || ctx.t('quiz.whichsquare', { sq: Rules.squareName(state, target) }), 'white-turn');
    }

    function panel() {
      Quiz.panel(ctx, [
        { icon: '⏱️', label: ctx.t('quiz.time'), value: left },
        { icon: '✅', label: ctx.t('quiz.right'), value: right },
        { icon: '❌', label: ctx.t('quiz.wrong'), value: wrong }
      ], recordKey);
    }

    function onTap(i) {
      if (dead) return;
      if (i === target) {
        right++;
        Sound.play('star');
        Board.mark(i, 'good');
        setTimeout(function () { Board.clearMarks('good'); }, 260);
        pick();
      } else {
        wrong++;
        Sound.play('error');
        Board.shake(i);
        Board.mark(target, 'hint');
        setTimeout(function () { Board.clearMarks('hint'); }, 700);
      }
      panel();
    }

    function finish() {
      dead = true;
      clearInterval(tick);
      Quiz.finish(ctx, {
        value: right, total: 14, recordKey: recordKey,
        title: ctx.t('result.timeup'),
        text: ctx.t('result.quiz', { a: right, b: right + wrong }),
        emoji: '🧭'
      });
    }

    pick();
    panel();
    tick = setInterval(function () {
      if (dead) return;
      left--;
      panel();
      if (left <= 0) finish();
    }, 1000);

    return { destroy: function () { dead = true; clearInterval(tick); } };
  }

  App.registerMode({
    id: 'findsquare',
    order: 2,
    group: 'beginner',
    icon: '<span class="ic-pair"><span class="ic-word">d4</span></span>',
    titleKey: 'mode.findsquare.title',
    descKey: 'mode.findsquare.desc',
    helpKey: 'help.findsquare',
    options: [
      { key: 'help', labelKey: 'opt.help', def: 'on', choices: [
        { v: 'on', labelKey: 'opt.help.on', icon: '🔤' },
        { v: 'off', labelKey: 'opt.help.off', icon: '🙊' }
      ] }
    ],
    start: start
  });
})();
