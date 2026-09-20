/* store.js — tiny localStorage wrapper (never throws, works in private mode) */
(function (global) {
  'use strict';
  var KEY = 'chesslearn.v1';
  var data = { lang: null, sound: true };

  try {
    var raw = global.localStorage.getItem(KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        data.lang = parsed.lang || null;
        data.sound = parsed.sound !== false;
      }
    }
  } catch (e) { /* storage blocked — stay with defaults */ }

  function save() {
    try { global.localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
  }

  global.Store = {
    getLang: function () { return data.lang; },
    setLang: function (v) { data.lang = v; save(); },
    getSound: function () { return data.sound; },
    setSound: function (v) { data.sound = !!v; save(); }
  };
})(window);
