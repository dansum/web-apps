/* quiz.js — the bits every round-based mini game repeats: the side panel,
   the end-of-game dialog and the record submission. */
(function (global) {
  'use strict';

  function row(icon, name, value, cls) {
    return '<div class="score-row' + (cls ? ' ' + cls : '') + '">' +
      '<span class="chip-icon">' + icon + '</span>' +
      '<span class="score-name">' + name + '</span>' +
      '<b>' + value + '</b></div>';
  }

  /* items: [{icon, label, value}], plus the record row when there is one */
  function panel(ctx, items, recordKey) {
    var html = items.map(function (it) {
      return row(it.icon, it.label, it.value, it.cls);
    }).join('');
    if (recordKey) {
      var best = Scores.get(recordKey);
      if (best !== undefined) html += row('🏅', ctx.t('game.best'), best);
    }
    ctx.setScore(html);
  }

  function stars(value, total) {
    if (value >= total) return 3;
    if (value >= Math.ceil(total * 0.6)) return 2;
    return value > 0 ? 1 : 0;
  }

  /* opts: {value, total, recordKey, emoji, title, text, win, stars} */
  function finish(ctx, opts) {
    var text = opts.text !== undefined
      ? opts.text
      : ctx.t('result.quiz', { a: opts.value, b: opts.total });
    if (opts.recordKey && Scores.submit(opts.recordKey, opts.value).isRecord) {
      text += '  ' + ctx.t('result.newbest');
    }
    var st = opts.stars !== undefined ? opts.stars : stars(opts.value, opts.total);
    ctx.finish({
      win: opts.win !== undefined ? opts.win : st >= 2,
      emoji: opts.emoji || (st >= 2 ? '🎉' : '🙂'),
      title: opts.title || ctx.t(st >= 2 ? 'result.done' : 'result.tryagain'),
      text: text,
      stars: st,
      sound: opts.sound
    });
  }

  global.Quiz = { row: row, panel: panel, finish: finish, stars: stars };
})(window);
