/* Meet the Pieces — a sandbox board. Pick a piece, see where it may go,
   move it around, and chase the star. */
(function () {
  'use strict';

  var SIZE = 8;

  function start(cfg, ctx) {
    var type = 'n';
    var state, heroAt, starAt, dead = false, gotStar = 0;

    Board.setup({ size: SIZE, flipped: false });
    Board.onTap(onTap);
    ctx.setTools({ hint: false, undo: false, restart: true });
    ctx.relabel(function () { drawPicker(); status(); });

    function build() {
      state = Rules.makeState(SIZE, { promote: 'q', turn: 'w' });
      heroAt = type === 'p' ? Rules.idx(state, SIZE - 2, 4) : Rules.idx(state, SIZE - 4, 3);
      Rules.place(state, heroAt, type, 'w');
      newStar();
      Board.clearMarks('sel');
      Board.clearMarks('target');
      Board.render(state);
      showMoves();
    }

    function newStar() {
      var free = [];
      for (var i = 0; i < SIZE * SIZE; i++) if (i !== heroAt && !state.sq[i]) free.push(i);
      starAt = free[Math.floor(Math.random() * free.length)];
      Board.clearDecor();
      Board.decor(starAt, '⭐', 'star-decor');
    }

    function status(msg) {
      if (dead) return;
      ctx.setStatus(msg || ctx.t('learn.tip.' + type), 'white-turn');
    }

    function drawPicker() {
      var html = '<div class="picker-label">' + ctx.t('learn.pick') + '</div><div class="picker">';
      Pieces.types.forEach(function (tp) {
        html += '<button class="pick' + (tp === type ? ' on' : '') + '" data-t="' + tp + '">' +
          '<span class="chip-piece w">' + Pieces.svg(tp, 'w') + '</span>' +
          '<span>' + ctx.t('piece.' + tp) + '</span></button>';
      });
      html += '</div><div class="picker-label small">' + ctx.t('learn.star') + '</div>';
      ctx.setScore(html);
      Array.prototype.forEach.call(document.querySelectorAll('#scoreCard .pick'), function (btn) {
        btn.addEventListener('click', function () {
          type = btn.getAttribute('data-t');
          Sound.play('select');
          drawPicker();
          build();
          status();
        });
      });
    }

    function showMoves() {
      Board.clearMarks('sel');
      Board.clearMarks('target');
      Board.mark(heroAt, 'sel');
      Rules.movesFrom(state, heroAt).forEach(function (m) { Board.mark(m.to, 'target'); });
    }

    function onTap(i) {
      if (dead) return;
      var moves = Rules.movesFrom(state, heroAt).filter(function (m) { return m.to === i; });
      if (!moves.length) {
        if (i !== heroAt) { Board.shake(i); Sound.play('error'); }
        return;
      }
      var move = moves[0];
      if (move.promo) {                     // a pawn at the end goes home again
        state.sq[heroAt] = null;
        heroAt = Rules.idx(state, SIZE - 2, Rules.colOf(state, move.to));
        Rules.place(state, heroAt, 'p', 'w');
        state.turn = 'w';
        Board.render(state);
        Sound.play('star');
        showMoves();
        return;
      }
      var res = Rules.apply(state, move);
      state = res.state;
      state.turn = 'w';
      heroAt = move.to;
      Board.render(state);
      if (move.to === starAt) {
        gotStar++;
        Sound.play('star');
        ctx.confetti();
        status(ctx.t('learn.gotstar'));
        newStar();
      } else {
        Sound.play('move');
        status();
      }
      showMoves();
    }

    drawPicker();
    build();
    status();

    return { destroy: function () { dead = true; Board.clearDecor(); } };
  }

  App.registerMode({
    id: 'learn',
    icon: '<span class="ic-pair">' + Pieces.svg('n', 'w') + Pieces.svg('q', 'w') + '</span>',
    titleKey: 'mode.learn.title',
    descKey: 'mode.learn.desc',
    helpKey: 'help.learn',
    options: [],
    start: start
  });
})();
