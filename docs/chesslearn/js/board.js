/* board.js — draws the board, slides the pieces, reports taps.
   Pieces live in their own layer and move with a CSS transform, so a move
   looks like a piece gliding across the board instead of blinking. */
(function (global) {
  'use strict';

  var root = null, squaresEl = null, decorEl = null, piecesEl = null;
  var size = 8, flipped = false;
  var pieceEls = {};        // piece id -> element
  var marked = [];
  var tapHandler = null;

  function mount(el) {
    root = el;
    root.innerHTML =
      '<div class="layer squares"></div>' +
      '<div class="layer decor"></div>' +
      '<div class="layer pieces"></div>';
    squaresEl = root.querySelector('.squares');
    decorEl = root.querySelector('.decor');
    piecesEl = root.querySelector('.pieces');
    root.addEventListener('click', function (ev) {
      if (!tapHandler) return;
      var sq = ev.target.closest ? ev.target.closest('.sq') : null;
      if (!sq) return;
      tapHandler(parseInt(sq.getAttribute('data-i'), 10));
    });
  }

  function setup(opts) {
    size = opts.size;
    flipped = !!opts.flipped;
    pieceEls = {};
    marked = [];
    piecesEl.innerHTML = '';
    decorEl.innerHTML = '';
    root.style.setProperty('--n', size);
    var html = '';
    for (var d = 0; d < size * size; d++) {
      var index = flipped ? (size * size - 1 - d) : d;
      var r = Math.floor(index / size), c = index % size;
      var dark = (r + c) % 2 === 1;
      html += '<div class="sq ' + (dark ? 'dark' : 'light') + '" data-i="' + index + '"></div>';
    }
    squaresEl.innerHTML = html;
  }

  function squareEl(index) {
    return squaresEl.querySelector('.sq[data-i="' + index + '"]');
  }

  function place(el, index) {
    var r = Math.floor(index / size), c = index % size;
    if (flipped) { r = size - 1 - r; c = size - 1 - c; }
    el.style.transform = 'translate(' + (c * 100) + '%,' + (r * 100) + '%)';
  }

  function makePiece(p) {
    var el = document.createElement('div');
    el.className = 'piece ' + p.c + ' t-' + p.t + ' pop';
    el.innerHTML = Pieces.svg(p.t, p.c);
    el.setAttribute('data-t', p.t);
    piecesEl.appendChild(el);
    setTimeout(function () { el.classList.remove('pop'); }, 260);
    return el;
  }

  function render(state) {
    var seen = {};
    for (var i = 0; i < state.sq.length; i++) {
      var p = state.sq[i];
      if (!p) continue;
      seen[p.id] = true;
      var el = pieceEls[p.id];
      if (!el) { el = makePiece(p); pieceEls[p.id] = el; }
      if (el.getAttribute('data-t') !== p.t) {
        el.innerHTML = Pieces.svg(p.t, p.c);
        el.className = 'piece ' + p.c + ' t-' + p.t;
        el.setAttribute('data-t', p.t);
      }
      place(el, i);
    }
    Object.keys(pieceEls).forEach(function (id) {
      if (seen[id]) return;
      var el = pieceEls[id];
      delete pieceEls[id];
      el.classList.add('gone');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 320);
    });
  }

  function clearMarks(cls) {
    marked = marked.filter(function (entry) {
      if (cls && entry.cls !== cls) return true;
      var el = squareEl(entry.i);
      if (el) el.classList.remove(entry.cls);
      return false;
    });
  }

  function mark(index, cls) {
    var el = squareEl(index);
    if (!el) return;
    el.classList.add(cls);
    marked.push({ i: index, cls: cls });
  }

  function markAll(list, cls) {
    (list || []).forEach(function (i) { mark(i, cls); });
  }

  function shake(index) {
    var el = squareEl(index);
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
    setTimeout(function () { el.classList.remove('shake'); }, 400);
  }

  function decor(index, html, cls) {
    var el = document.createElement('div');
    el.className = 'decor-item ' + (cls || '');
    el.innerHTML = '<span class="decor-in">' + html + '</span>';
    decorEl.appendChild(el);
    place(el, index);
    return el;
  }

  function clearDecor() { decorEl.innerHTML = ''; }

  function onTap(fn) { tapHandler = fn; }
  function setLocked(v) { root.classList.toggle('locked', !!v); }

  global.Board = {
    mount: mount, setup: setup, render: render,
    clearMarks: clearMarks, mark: mark, markAll: markAll,
    shake: shake, decor: decor, clearDecor: clearDecor,
    onTap: onTap, setLocked: setLocked,
    squareEl: squareEl,
    getSize: function () { return size; }
  };
})(window);
