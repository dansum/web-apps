/* scores.js — personal records, kept in this browser and exportable as a
   plain text file so a child can carry them to another computer.

   A record key looks like "glutton.n.fight" or "pawnrace.best.8.3".
   meta() alone decides what a key means — how to compare it and how to name
   it — so an imported file only has to carry the key, the number and a date. */
(function (global) {
  'use strict';

  var KEY = 'chesslearn.records.v1';
  var HEADER = [
    '# Chess Playground / Шах игрище — records',
    '# key<TAB>value<TAB>date   (lines starting with # are ignored)'
  ];

  var records = {};
  try {
    var raw = global.localStorage.getItem(KEY);
    if (raw) records = JSON.parse(raw) || {};
  } catch (e) { records = {}; }

  function save() {
    try { global.localStorage.setItem(KEY, JSON.stringify(records)); } catch (e) { /* ignore */ }
  }

  function today() { return new Date().toISOString().slice(0, 10); }

  /* What does this key mean? null for a key we do not know. */
  function meta(key) {
    var p = String(key).split('.');
    switch (p[0]) {
      case 'learn':
        if (p[1] !== 'stars') return null;
        return { dir: 'sum', game: 'mode.learn.title', metric: 'metric.stars', variants: [] };
      case 'glutton':
        if (!p[1] || 'pnbrqk'.indexOf(p[1]) < 0) return null;
        return { dir: 'min', game: 'mode.glutton.title', metric: 'metric.moves',
          variants: ['piece.' + p[1]].concat(p[2] === 'fight' ? ['opt.fight.on'] : []) };
      case 'knight':
        if (p[1] !== '5' && p[1] !== '6') return null;
        return { dir: 'max', game: 'mode.knight.title', metric: 'metric.visited',
          variants: ['opt.tsize.' + p[1]] };
      case 'safe':
        if (['2', '3', '4'].indexOf(p[1]) < 0) return null;
        return { dir: 'min', game: 'mode.safe.title', metric: 'metric.moves',
          variants: ['opt.guards.' + p[1]] };
      case 'pawnrace':
        if (p[1] === 'best') {
          return { dir: 'max', game: 'mode.pawnrace.title', metric: 'metric.through',
            variants: ['opt.board.' + p[2], 'opt.level.' + p[3]] };
        }
        if (p[1] === 'wins') {
          return { dir: 'sum', game: 'mode.pawnrace.title', metric: 'metric.wins',
            variants: ['opt.level.' + p[2]] };
        }
        return null;
      case 'findsquare':
        if (['plain', 'help'].indexOf(p[1]) < 0) return null;
        return { dir: 'max', game: 'mode.findsquare.title', metric: 'metric.correct',
          variants: [p[1] === 'help' ? 'opt.help.on' : 'opt.help.off'] };
      case 'bishop':
        return { dir: 'max', game: 'mode.bishop.title', metric: 'metric.solved', variants: [] };
      case 'knighttaxi':
        if (['6', '8'].indexOf(p[1]) < 0) return null;
        return { dir: 'max', game: 'mode.knighttaxi.title', metric: 'metric.perfect',
          variants: ['opt.size.' + p[1]] };
      case 'knightrace':
        if (p[1] === 'wins') {
          return { dir: 'sum', game: 'mode.knightrace.title', metric: 'metric.wins',
            variants: ['opt.level.' + p[2]] };
        }
        if (p[1] === 'fast') {
          return { dir: 'min', game: 'mode.knightrace.title', metric: 'metric.moves',
            variants: ['opt.level.' + p[2]] };
        }
        return null;
      case 'ischeck':
        return { dir: 'max', game: 'mode.ischeck.title', metric: 'metric.correct', variants: [] };
      case 'rescue':
        return { dir: 'max', game: 'mode.rescue.title', metric: 'metric.solved', variants: [] };
      case 'fork':
        return { dir: 'max', game: 'mode.fork.title', metric: 'metric.solved', variants: [] };
      case 'mate1':
        return { dir: 'max', game: 'mode.mate1.title', metric: 'metric.solved', variants: [] };
      case 'queens':
        if (['4', '5', '6'].indexOf(p[1]) < 0) return null;
        return { dir: 'min', game: 'mode.queens.title', metric: 'metric.taps',
          variants: ['opt.size.' + p[1]] };
      case 'krk':
        return { dir: 'min', game: 'mode.krk.title', metric: 'metric.moves', variants: [] };
      case 'center':
        if (p[1] === 'wins') {
          return { dir: 'sum', game: 'mode.center.title', metric: 'metric.wins',
            variants: ['opt.level.' + p[2]] };
        }
        if (p[1] === 'fast') {
          return { dir: 'min', game: 'mode.center.title', metric: 'metric.moves',
            variants: ['opt.level.' + p[2]] };
        }
        return null;
    }
    return null;
  }

  function isBetter(dir, next, current) {
    if (current === undefined || current === null) return true;
    if (dir === 'min') return next < current;
    return next > current;   // 'max'; 'sum' never replaces, it adds
  }

  /* Returns { value, isRecord } — isRecord is true when this beat the old one. */
  function submit(key, value, date) {
    var m = meta(key);
    if (!m || typeof value !== 'number' || !isFinite(value)) return { value: null, isRecord: false };
    var cur = records[key];
    if (m.dir === 'sum') {
      var total = (cur ? cur.v : 0) + value;
      records[key] = { v: total, d: date || today() };
      save();
      return { value: total, isRecord: false };
    }
    if (isBetter(m.dir, value, cur && cur.v)) {
      records[key] = { v: value, d: date || today() };
      save();
      return { value: value, isRecord: cur !== undefined };
    }
    return { value: cur.v, isRecord: false };
  }

  function get(key) {
    var r = records[key];
    return r ? r.v : undefined;
  }

  /* Every known record, grouped in menu order. */
  function list() {
    var out = [];
    Object.keys(records).forEach(function (key) {
      var m = meta(key);
      if (!m) return;
      out.push({ key: key, value: records[key].v, date: records[key].d, meta: m });
    });
    var order = ['mode.learn.title', 'mode.findsquare.title', 'mode.bishop.title',
      'mode.glutton.title', 'mode.pawnrace.title', 'mode.safe.title',
      'mode.knighttaxi.title', 'mode.knight.title', 'mode.knightrace.title',
      'mode.ischeck.title', 'mode.rescue.title', 'mode.center.title',
      'mode.fork.title', 'mode.mate1.title', 'mode.queens.title', 'mode.krk.title'];
    out.sort(function (a, b) {
      var d = order.indexOf(a.meta.game) - order.indexOf(b.meta.game);
      return d !== 0 ? d : a.key.localeCompare(b.key);
    });
    return out;
  }

  function label(entry, t) {
    var parts = entry.meta.variants.map(function (k) { return t(k); });
    parts.push(t(entry.meta.metric));
    return parts.join(' · ');
  }

  function toText(t) {
    var lines = HEADER.slice();
    list().forEach(function (e) {
      lines.push([e.key, e.value, e.date, t(e.meta.game) + ' / ' + label(e, t)].join('\t'));
    });
    if (lines.length === HEADER.length) lines.push('# (no records yet)');
    return lines.join('\n') + '\n';
  }

  /* Tolerant import: tabs or runs of spaces, unknown keys skipped, and a
     record only ever replaces a weaker one (sums are taken as the larger). */
  function importText(text) {
    var res = { added: 0, improved: 0, skipped: 0, unknown: 0 };
    String(text).split(/\r?\n/).forEach(function (line) {
      line = line.trim();
      if (!line || line.charAt(0) === '#') return;
      var cols = line.split(/\t+| {2,}/);
      var key = (cols[0] || '').trim();
      var value = parseInt(cols[1], 10);
      var date = (cols[2] || '').trim();
      var m = meta(key);
      if (!m || isNaN(value) || value < 0) { res.unknown++; return; }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) date = today();
      var cur = records[key];
      var better = m.dir === 'sum' ? (!cur || value > cur.v) : isBetter(m.dir, value, cur && cur.v);
      if (!cur) { records[key] = { v: value, d: date }; res.added++; }
      else if (better) { records[key] = { v: value, d: date }; res.improved++; }
      else res.skipped++;
    });
    save();
    return res;
  }

  function clear() { records = {}; save(); }

  global.Scores = {
    submit: submit, get: get, list: list, label: label,
    toText: toText, importText: importText, clear: clear,
    count: function () { return list().length; }
  };
})(window);
