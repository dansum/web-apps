/* pieces.js — chunky, kid-friendly chess pieces drawn as inline SVG.
   Two-tone: the body uses currentColor, the outline uses var(--pc-line). */
(function (global) {
  'use strict';

  var BODY = {
    p: '<circle cx="50" cy="30" r="14"/>' +
       '<path d="M37 44h26l-4 9c8 7 12 15 13 25H28c1-10 5-18 13-25z"/>' +
       '<rect x="22" y="78" width="56" height="13" rx="6"/>',

    r: '<path d="M26 18h11v9h8v-9h10v9h8v-9h11v22H26z"/>' +
       '<path d="M34 40h32l-3 32H37z"/>' +
       '<rect x="26" y="70" width="48" height="10" rx="4"/>' +
       '<rect x="20" y="79" width="60" height="12" rx="6"/>',

    b: '<circle cx="50" cy="15" r="6"/>' +
       '<path d="M50 21c12 7 19 17 19 28 0 10-8 17-19 17s-19-7-19-17c0-11 7-21 19-28z"/>' +
       '<path d="M35 65h30l4 11H31z"/>' +
       '<rect x="20" y="79" width="60" height="12" rx="6"/>',

    n: '<path d="M33 78c0-16 4-25 12-31l-11 2c-4 1-7-3-5-6l14-15c4-6 10-10 16-11l-2-9 10 7c9 6 14 17 14 30v33z"/>' +
       '<rect x="20" y="79" width="60" height="12" rx="6"/>',

    q: '<circle cx="21" cy="30" r="6"/><circle cx="35" cy="21" r="6"/><circle cx="50" cy="16" r="7"/>' +
       '<circle cx="65" cy="21" r="6"/><circle cx="79" cy="30" r="6"/>' +
       '<path d="M21 33l7 26h44l7-26-14 11-8-20-7 20-7-20-8 20z"/>' +
       '<path d="M28 59h44l4 14H24z"/>' +
       '<rect x="20" y="79" width="60" height="12" rx="6"/>',

    k: '<path d="M45 4h10v8h8v10h-8v9H45v-9h-8V12h8z"/>' +
       '<path d="M30 46c0-11 9-19 20-19s20 8 20 19l-4 15H34z"/>' +
       '<path d="M30 61h40l4 13H26z"/>' +
       '<rect x="20" y="79" width="60" height="12" rx="6"/>'
  };

  var DETAIL = {
    b: '<path class="pc-line" d="M55 30L44 48" fill="none" stroke-width="5" stroke-linecap="round"/>',
    n: '<circle class="pc-dot" cx="61" cy="33" r="3.2"/>' +
       '<path class="pc-line" d="M62 20c6 5 9 13 9 22" fill="none" stroke-width="4" stroke-linecap="round"/>',
    p: '', r: '', q: '', k: ''
  };

  var GLYPH = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' };

  function svg(type, color, extraClass) {
    var body = BODY[type] || BODY.p;
    return '<svg class="piece-svg pc-' + (color || 'w') + ' ' + (extraClass || '') + '" viewBox="0 0 100 100" ' +
      'aria-hidden="true" focusable="false">' +
      '<g class="pc-body" stroke-linejoin="round">' + body + '</g>' +
      (DETAIL[type] || '') +
      '</svg>';
  }

  global.Pieces = {
    svg: svg,
    glyph: function (t) { return GLYPH[t] || '?'; },
    types: ['p', 'n', 'b', 'r', 'q', 'k']
  };
})(window);
