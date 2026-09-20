/* ai.js — one small negamax search shared by every mode that has a computer
   opponent. The difficulty level is a blunder probability: on the easy levels
   the computer knows the best move and still plays something else, which is
   exactly how a child expects an easy opponent to behave. */
(function (global) {
  'use strict';

  var LEVELS = {
    1: { depth: 1, blunder: 0.60 },
    2: { depth: 2, blunder: 0.35 },
    3: { depth: 3, blunder: 0.15 },
    4: { depth: 4, blunder: 0.00 }
  };

  var NODE_BUDGET = 60000;

  function order(moves) {
    return moves.slice().sort(function (a, b) {
      return (b.cap !== null ? 1 : 0) - (a.cap !== null ? 1 : 0);
    });
  }

  function negamax(state, color, depth, alpha, beta, cfg, budget) {
    if (depth <= 0 || budget.n > NODE_BUDGET || (cfg.isOver && cfg.isOver(state))) {
      return cfg.evaluate(state, color);
    }
    var moves = cfg.genMoves(state, color);
    if (!moves.length) {
      var opp = color === 'w' ? 'b' : 'w';
      if (!cfg.genMoves(state, opp).length) return cfg.evaluate(state, color);
      var passed = Rules.clone(state);
      passed.turn = opp;
      passed.ep = null;
      return -negamax(passed, opp, depth - 1, -beta, -alpha, cfg, budget);
    }
    moves = order(moves);
    var best = -Infinity;
    for (var i = 0; i < moves.length; i++) {
      budget.n++;
      var res = Rules.apply(state, moves[i]);
      var score = -negamax(res.state, color === 'w' ? 'b' : 'w', depth - 1, -beta, -alpha, cfg, budget);
      if (score > best) best = score;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    return best;
  }

  /* Returns a move, or null when the side to move has nothing to play. */
  function pickMove(state, color, cfg) {
    var level = LEVELS[cfg.level] || LEVELS[2];
    var moves = cfg.genMoves(state, color);
    if (!moves.length) return null;
    if (moves.length === 1) return moves[0];

    if (Math.random() < level.blunder) {
      return moves[Math.floor(Math.random() * moves.length)];
    }

    var budget = { n: 0 };
    var best = [];
    var bestScore = -Infinity;
    var ordered = order(moves);
    for (var i = 0; i < ordered.length; i++) {
      var res = Rules.apply(state, ordered[i]);
      var score = -negamax(res.state, color === 'w' ? 'b' : 'w',
        level.depth - 1, -Infinity, Infinity, cfg, budget);
      if (score > bestScore + 0.0001) { bestScore = score; best = [ordered[i]]; }
      else if (Math.abs(score - bestScore) <= 0.0001) { best.push(ordered[i]); }
    }
    return best[Math.floor(Math.random() * best.length)];
  }

  global.AI = { pickMove: pickMove, LEVELS: LEVELS };
})(window);
