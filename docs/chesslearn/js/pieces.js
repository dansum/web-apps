/* pieces.js — the pieces, drawn as inline SVG in two styles:
   `classic` chess pieces and `army` modern soldiers.
   Two-tone: bodies use currentColor, outlines and details var(--pc-line). */
(function (global) {
  'use strict';

  var CLASSIC = {
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

  var CLASSIC_DETAIL = {
    b: '<path class="pc-line" d="M55 30L44 48" fill="none" stroke-width="5" stroke-linecap="round"/>',
    n: '<circle class="pc-dot" cx="61" cy="33" r="3.2"/>' +
       '<path class="pc-line" d="M62 20c6 5 9 13 9 22" fill="none" stroke-width="4" stroke-linecap="round"/>',
    p: '', r: '', q: '', k: ''
  };

  /* ---- army: infantryman, artillery, tank, humvee, rocket, president ---- */

  var ARMY = {
    /* infantryman: helmet with a brim over a small face, then shoulders */
    p: '<path d="M27 42a23 21 0 0 1 46 0z"/>' +
       '<rect x="22" y="41" width="56" height="8" rx="4"/>' +
       '<rect x="38" y="49" width="24" height="9" rx="4"/>' +
       '<path d="M32 58h36c7 0 12 6 12 13v11H20V71c0-7 5-13 12-13z"/>' +
       '<rect x="20" y="81" width="60" height="11" rx="5"/>',

    /* artillery: a big wheel and a barrel angled up to the right */
    r: '<path d="M40 66 62 26l14 8-22 40z"/>' +
       '<rect x="68" y="20" width="16" height="9" rx="4" transform="rotate(30 76 24)"/>' +
       '<path d="M18 80h56l-14-20H32z"/>' +
       '<circle cx="34" cy="74" r="16"/>' +
       '<rect x="14" y="84" width="72" height="9" rx="4"/>',

    /* tank: tracks, hull, turret, barrel */
    n: '<rect x="12" y="66" width="76" height="20" rx="10"/>' +
       '<rect x="18" y="52" width="64" height="15" rx="4"/>' +
       '<rect x="34" y="38" width="32" height="15" rx="6"/>' +
       '<rect x="62" y="42" width="32" height="7" rx="3"/>',

    /* humvee: boxy body, sloped cabin, two wheels */
    b: '<path d="M28 44h30l12 16H22z"/>' +
       '<rect x="10" y="58" width="80" height="18" rx="5"/>' +
       '<rect x="8" y="86" width="84" height="7" rx="3"/>',

    /* rocket: nose cone, fins, launch pad */
    q: '<path d="M50 6c10 13 15 28 15 43v19H35V49c0-15 5-30 15-43z"/>' +
       '<path d="M35 56 20 80h15z"/><path d="M65 56 80 80H65z"/>' +
       '<rect x="34" y="68" width="32" height="12" rx="4"/>' +
       '<rect x="20" y="84" width="60" height="9" rx="4"/>',

    /* president: bare head, wide suit shoulders, a tie */
    k: '<circle cx="50" cy="26" r="15"/>' +
       '<path d="M24 64c0-9 9-14 26-14s26 5 26 14v18H24z"/>' +
       '<rect x="18" y="82" width="64" height="11" rx="5"/>'
  };

  var ARMY_DETAIL = {
    p: '<path class="pc-line" d="M50 63v12" fill="none" stroke-width="4" stroke-linecap="round"/>',
    r: '<circle class="pc-dot" cx="34" cy="74" r="5"/>',
    n: '<circle class="pc-dot" cx="26" cy="76" r="5"/><circle class="pc-dot" cx="42" cy="76" r="5"/>' +
       '<circle class="pc-dot" cx="58" cy="76" r="5"/><circle class="pc-dot" cx="74" cy="76" r="5"/>',
    b: '<circle class="pc-dot" cx="28" cy="78" r="11"/><circle class="pc-dot" cx="72" cy="78" r="11"/>' +
       '<path class="pc-line" d="M32 48h22" fill="none" stroke-width="4" stroke-linecap="round"/>',
    q: '<circle class="pc-dot" cx="50" cy="38" r="6"/>',
    k: '<path class="pc-dot" d="M50 48l5 6-5 22-5-22z" stroke="none"/>' +
       '<path class="pc-line" d="M38 52l12 8 12-8" fill="none" stroke-width="4" stroke-linecap="round"/>'
  };

  var SETS = { classic: CLASSIC, army: ARMY };
  var DETAILS = { classic: CLASSIC_DETAIL, army: ARMY_DETAIL };
  var GLYPH = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' };

  var style = 'classic';

  function svgIn(setName, type, color, extraClass) {
    var set = SETS[setName] || CLASSIC;
    var detail = DETAILS[setName] || CLASSIC_DETAIL;
    return '<svg class="piece-svg pc-' + (color || 'w') + ' ' + (extraClass || '') + '" ' +
      'viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
      '<g class="pc-body" stroke-linejoin="round">' + (set[type] || set.p) + '</g>' +
      (detail[type] || '') +
      '</svg>';
  }

  global.Pieces = {
    svg: function (type, color, extraClass) { return svgIn(style, type, color, extraClass); },
    svgIn: svgIn,
    glyph: function (t) { return GLYPH[t] || '?'; },
    types: ['p', 'n', 'b', 'r', 'q', 'k'],
    styles: ['classic', 'army'],
    setStyle: function (s) { style = SETS[s] ? s : 'classic'; },
    getStyle: function () { return style; },
    /* the pieces have different names in the army style */
    nameKey: function (type) { return (style === 'army' ? 'army.' : 'piece.') + type; },
    tipKey: function (type) { return style === 'army' ? 'army.tip.' + type : 'learn.tip.' + type; }
  };
})(window);
