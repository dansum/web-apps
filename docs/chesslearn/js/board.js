/* board.js — draws the board, slides the pieces, reports taps.
   Pieces live in their own layer and move with a CSS transform, so a move
   looks like a piece gliding across the board instead of blinking. */
(function (global) {
  'use strict';

  var root = null, squaresEl = null, decorEl = null, piecesEl = null, coordsEl = null;
  var size = 8, flipped = false, labels = false;
  var pieceEls = {};        // piece id -> element
  var marked = [];
  var tapHandler = null;

  function mount(el) {
    root = el;
    root.innerHTML =
      '<div class="layer squares"></div>' +
      '<div class="layer decor"></div>' +
      '<div class="layer pieces"></div>' +
      '<div class="coords"><div class="files"></div><div class="ranks"></div></div>';
    squaresEl = root.querySelector('.squares');
    decorEl = root.querySelector('.decor');
    piecesEl = root.querySelector('.pieces');
    coordsEl = root.querySelector('.coords');
    root.addEventListener('click', function (ev) {
      if (!tapHandler) return;
      var sq = ev.target.closest ? ev.target.closest('.sq') : null;
      if (!sq) return;
      tapHandler(parseInt(sq.getAttribute('data-i'), 10));
    });
  }

  function buildCoords() {
    var files = '', ranks = '';
    for (var d = 0; d < size; d++) {
      var col = flipped ? size - 1 - d : d;
      var row = flipped ? size - 1 - d : d;
      files += '<span>' + 'abcdefgh'.charAt(col) + '</span>';
      ranks += '<span>' + (size - row) + '</span>';
    }
    coordsEl.querySelector('.files').innerHTML = files;
    coordsEl.querySelector('.ranks').innerHTML = ranks;
  }

  function setLabels(on) {
    labels = !!on;
    root.classList.toggle('with-coords', labels);
    if (labels) buildCoords();
  }

  function setup(opts) {
    size = opts.size;
    flipped = !!opts.flipped;
    setLabels(opts.labels === undefined ? labels : opts.labels);
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
    onTap: onTap, setLocked: setLocked, setLabels: setLabels,
    squareEl: squareEl,
    getSize: function () { return size; }
  };
})(window);
