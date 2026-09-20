/* store.js — tiny localStorage wrapper (never throws, works in private mode) */
(function (global) {
  'use strict';
  var KEY = 'chesslearn.v1';
  var data = { lang: null, sound: true, best: {} };

  try {
    var raw = global.localStorage.getItem(KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        data.lang = parsed.lang || null;
        data.sound = parsed.sound !== false;
        data.best = parsed.best || {};
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
    setSound: function (v) { data.sound = !!v; save(); },
    getBest: function (key) { return data.best[key]; },
    /* lower === better by default (move counts); pass true for higher-is-better */
    setBest: function (key, value, higherIsBetter) {
      var cur = data.best[key];
      var better = cur === undefined ||
        (higherIsBetter ? value > cur : value < cur);
      if (better) { data.best[key] = value; save(); return true; }
      return false;
    }
  };
})(window);
