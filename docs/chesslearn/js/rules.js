/* rules.js — a small chess-move engine.
   No castling and no check/checkmate: none of the mini games need them,
   and leaving them out keeps every rule explainable to a six-year-old. */
(function (global) {
  'use strict';

  var nextId = 1;

  function piece(type, color) { return { id: nextId++, t: type, c: color }; }

  function makeState(size, opts) {
    opts = opts || {};
    return {
      size: size,
      sq: new Array(size * size).fill(null),
      turn: opts.turn || 'w',
      ep: null,                                  // en-passant target square
      promote: opts.promote || 'q',              // 'q' | 'remove'
      scored: { w: 0, b: 0 }                     // pawns that reached the far end
    };
  }

  function clone(s) {
    return {
      size: s.size,
      sq: s.sq.slice(),
      turn: s.turn,
      ep: s.ep,
      promote: s.promote,
      scored: { w: s.scored.w, b: s.scored.b }
    };
  }

  function rowOf(s, i) { return Math.floor(i / s.size); }
  function colOf(s, i) { return i % s.size; }
  function idx(s, r, c) { return r * s.size + c; }
  function inside(s, r, c) { return r >= 0 && c >= 0 && r < s.size && c < s.size; }
  function other(color) { return color === 'w' ? 'b' : 'w'; }

  /* White marches towards row 0, black towards the last row. */
  function forward(color) { return color === 'w' ? -1 : 1; }
  function homeRow(s, color) { return color === 'w' ? s.size - 2 : 1; }
  function lastRow(s, color) { return color === 'w' ? 0 : s.size - 1; }

  function squareName(s, i) {
    return 'abcdefgh'.charAt(colOf(s, i)) + String(s.size - rowOf(s, i));
  }

  var OFFSETS = {
    n: [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]],
    k: [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]],
    b: [[-1, -1], [-1, 1], [1, -1], [1, 1]],
    r: [[-1, 0], [1, 0], [0, -1], [0, 1]],
    q: [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]
  };

  function mv(from, to, cap, extra) {
    var m = { from: from, to: to, cap: (cap === undefined ? null : cap), dbl: false, ep: false, promo: false };
    if (extra) for (var k in extra) m[k] = extra[k];
    return m;
  }

  /* All pseudo-legal moves of the piece standing on `from`. */
  function movesFrom(s, from) {
    var p = s.sq[from];
    var out = [];
    if (!p) return out;
    var r = rowOf(s, from), c = colOf(s, from);

    if (p.t === 'p') {
      var d = forward(p.c);
      var r1 = r + d;
      if (inside(s, r1, c) && !s.sq[idx(s, r1, c)]) {
        out.push(mv(from, idx(s, r1, c), null, { promo: r1 === lastRow(s, p.c) }));
        var r2 = r + 2 * d;
        if (r === homeRow(s, p.c) && inside(s, r2, c) && !s.sq[idx(s, r2, c)]) {
          out.push(mv(from, idx(s, r2, c), null, { dbl: true }));
        }
      }
      [-1, 1].forEach(function (dc) {
        var cc = c + dc;
        if (!inside(s, r1, cc)) return;
        var to = idx(s, r1, cc);
        var target = s.sq[to];
        if (target && target.c !== p.c) {
          out.push(mv(from, to, to, { promo: r1 === lastRow(s, p.c) }));
        } else if (!target && s.ep === to) {
          out.push(mv(from, to, idx(s, r, cc), { ep: true }));
        }
      });
      return out;
    }

    var dirs = OFFSETS[p.t] || [];
    var sliding = (p.t === 'b' || p.t === 'r' || p.t === 'q');
    for (var i = 0; i < dirs.length; i++) {
      var dr = dirs[i][0], dc2 = dirs[i][1];
      var rr = r + dr, cc2 = c + dc2;
      while (inside(s, rr, cc2)) {
        var to2 = idx(s, rr, cc2);
        var t = s.sq[to2];
        if (!t) out.push(mv(from, to2));
        else {
          if (t.c !== p.c) out.push(mv(from, to2, to2));
          break;
        }
        if (!sliding) break;
        rr += dr; cc2 += dc2;
      }
    }
    return out;
  }

  function allMoves(s, color) {
    var out = [];
    for (var i = 0; i < s.sq.length; i++) {
      var p = s.sq[i];
      if (p && p.c === color) out = out.concat(movesFrom(s, i));
    }
    return out;
  }

  /* Squares controlled by `color` (pawns control their two diagonals). */
  function attacked(s, color) {
    var set = new Set();
    for (var i = 0; i < s.sq.length; i++) {
      var p = s.sq[i];
      if (!p || p.c !== color) continue;
      if (p.t === 'p') {
        var r = rowOf(s, i) + forward(p.c), c = colOf(s, i);
        [-1, 1].forEach(function (dc) {
          if (inside(s, r, c + dc)) set.add(idx(s, r, c + dc));
        });
      } else {
        movesFrom(s, i).forEach(function (m) { set.add(m.to); });
      }
    }
    return set;
  }

  /* Applies a move to a COPY of the state. Returns {state, captured, scored}. */
  function apply(s, m) {
    var ns = clone(s);
    var p = ns.sq[m.from];
    var captured = (m.cap !== null && m.cap !== undefined) ? ns.sq[m.cap] : null;
    if (m.cap !== null && m.cap !== undefined) ns.sq[m.cap] = null;
    ns.sq[m.from] = null;

    var scored = false;
    if (m.promo) {
      if (ns.promote === 'remove') {
        ns.scored[p.c] += 1;
        scored = true;
        ns.sq[m.to] = null;
      } else {
        ns.sq[m.to] = { id: p.id, t: 'q', c: p.c };
      }
    } else {
      ns.sq[m.to] = p;
    }

    ns.ep = m.dbl ? idx(ns, (rowOf(ns, m.from) + rowOf(ns, m.to)) / 2, colOf(ns, m.from)) : null;
    ns.turn = other(p.c);
    return { state: ns, captured: captured, scored: scored, mover: p };
  }

  /* Squares a colour controls. Unlike movesFrom this counts squares occupied
     by its own pieces too — a king may not capture a defended piece. */
  function controls(s, color) {
    var set = new Set();
    for (var i = 0; i < s.sq.length; i++) {
      var p = s.sq[i];
      if (!p || p.c !== color) continue;
      var r = rowOf(s, i), c = colOf(s, i);
      if (p.t === 'p') {
        var pr = r + forward(p.c);
        [-1, 1].forEach(function (dc) {
          if (inside(s, pr, c + dc)) set.add(idx(s, pr, c + dc));
        });
        continue;
      }
      var dirs = OFFSETS[p.t] || [];
      var sliding = (p.t === 'b' || p.t === 'r' || p.t === 'q');
      for (var d = 0; d < dirs.length; d++) {
        var rr = r + dirs[d][0], cc = c + dirs[d][1];
        while (inside(s, rr, cc)) {
          set.add(idx(s, rr, cc));
          if (s.sq[idx(s, rr, cc)] || !sliding) break;
          rr += dirs[d][0]; cc += dirs[d][1];
        }
      }
    }
    return set;
  }

  function kingSquare(s, color) {
    for (var i = 0; i < s.sq.length; i++) {
      var p = s.sq[i];
      if (p && p.c === color && p.t === 'k') return i;
    }
    return -1;
  }

  function inCheck(s, color) {
    var k = kingSquare(s, color);
    return k >= 0 && controls(s, other(color)).has(k);
  }

  /* Moves that do not leave (or put) your own king in check. */
  function legalMoves(s, color) {
    return allMoves(s, color).filter(function (m) {
      return !inCheck(apply(s, m).state, color);
    });
  }

  function isMate(s, color) { return inCheck(s, color) && legalMoves(s, color).length === 0; }
  function isStalemate(s, color) { return !inCheck(s, color) && legalMoves(s, color).length === 0; }

  /* Knight distance between two squares on an empty board (-1 if unreachable). */
  function knightDistance(s, from, to) {
    if (from === to) return 0;
    var seen = {}, queue = [from], dist = {}, offs = OFFSETS.n;
    seen[from] = true; dist[from] = 0;
    while (queue.length) {
      var cur = queue.shift();
      var r = rowOf(s, cur), c = colOf(s, cur);
      for (var i = 0; i < offs.length; i++) {
        var rr = r + offs[i][0], cc = c + offs[i][1];
        if (!inside(s, rr, cc)) continue;
        var n = idx(s, rr, cc);
        if (seen[n]) continue;
        seen[n] = true;
        dist[n] = dist[cur] + 1;
        if (n === to) return dist[n];
        queue.push(n);
      }
    }
    return -1;
  }

  function count(s, color, type) {
    var n = 0;
    for (var i = 0; i < s.sq.length; i++) {
      var p = s.sq[i];
      if (p && p.c === color && (!type || p.t === type)) n++;
    }
    return n;
  }

  function place(s, index, type, color) {
    var p = piece(type, color);
    s.sq[index] = p;
    return p;
  }

  global.Rules = {
    makeState: makeState, clone: clone, piece: piece, place: place,
    rowOf: rowOf, colOf: colOf, idx: idx, inside: inside, other: other,
    forward: forward, homeRow: homeRow, lastRow: lastRow, squareName: squareName,
    movesFrom: movesFrom, allMoves: allMoves, attacked: attacked,
    controls: controls, kingSquare: kingSquare, inCheck: inCheck,
    legalMoves: legalMoves, isMate: isMate, isStalemate: isStalemate,
    knightDistance: knightDistance,
    apply: apply, count: count
  };
})(window);
