/* app.js — the shell: menu, setup screen, game panel, language, sound.
   Every mini game registers itself here and gets a small context object. */
(function (global) {
  'use strict';

  var modes = [];
  var current = null;        // { mode, cfg, controller }
  var el = {};

  function $(id) { return document.getElementById(id); }
  function t(key, vars) { return I18N.t(key, vars); }

  /* A piece label reads "Knight" or "Tank" depending on the chosen style. */
  function tLabel(key) {
    return key.indexOf('piece.') === 0 ? t(Pieces.nameKey(key.slice(6))) : t(key);
  }

  /* ---------------- screens ---------------- */

  function show(name) {
    ['menu', 'setup', 'records', 'game'].forEach(function (s) {
      $('screen-' + s).hidden = (s !== name);
    });
    el.homeBtn.hidden = (name === 'menu');
    document.body.setAttribute('data-screen', name);
    window.scrollTo(0, 0);
  }

  function stopGame() {
    if (current && current.controller && current.controller.destroy) {
      current.controller.destroy();
    }
    if (current) current.controller = null;
    Board.onTap(null);
    Board.clearMarks();
    Board.clearDecor();
    hideDialog();
  }

  function goMenu() {
    stopGame();
    current = null;
    renderMenu();
    show('menu');
  }

  /* ---------------- menu ---------------- */

  var GROUPS = ['beginner', 'learning', 'advanced'];

  function renderStyleSwitch() {
    var html = '<span class="style-label">' + t('style.title') + '</span><div class="style-chips">';
    Pieces.styles.forEach(function (name) {
      var on = Pieces.getStyle() === name;
      html += '<button class="style-chip' + (on ? ' on' : '') + '" data-style="' + name + '">' +
        '<span class="chip-piece w">' + Pieces.svgIn(name, 'n', 'w') + '</span>' +
        '<span>' + t('style.' + name) + '</span></button>';
    });
    el.styleSwitch.innerHTML = html + '</div>';
    Array.prototype.forEach.call(el.styleSwitch.querySelectorAll('.style-chip'), function (btn) {
      btn.addEventListener('click', function () {
        Pieces.setStyle(btn.getAttribute('data-style'));
        Store.setPieces(Pieces.getStyle());
        Sound.play('select');
        renderMenu();
      });
    });
  }

  function iconOf(thing) {
    return typeof thing === 'function' ? thing() : (thing || '');
  }

  function renderMenu() {
    renderStyleSwitch();
    el.modeGrid.innerHTML = '';
    GROUPS.forEach(function (group) {
      var inGroup = modes.filter(function (m) { return (m.group || 'beginner') === group; })
        .sort(function (a, b) { return (a.order || 99) - (b.order || 99); });
      if (!inGroup.length) return;
      var head = document.createElement('h2');
      head.className = 'group-head ' + group;
      head.innerHTML = '<span class="group-dot"></span>' + t('group.' + group);
      el.modeGrid.appendChild(head);
      var grid = document.createElement('div');
      grid.className = 'group-grid';
      inGroup.forEach(function (mode) {
        var card = document.createElement('button');
        card.className = 'mode-card';
        card.innerHTML =
          '<div class="mode-icon">' + iconOf(mode.icon) + '</div>' +
          '<div class="mode-text">' +
          '<span class="mode-title">' + t(mode.titleKey) + '</span>' +
          '<span class="mode-desc">' + t(mode.descKey) + '</span>' +
          '</div>';
        card.addEventListener('click', function () { openSetup(mode); });
        grid.appendChild(card);
      });
      el.modeGrid.appendChild(grid);
    });
  }

  /* ---------------- records ---------------- */

  function goRecords() {
    stopGame();
    renderRecords();
    show('records');
  }

  function renderRecords() {
    var entries = Scores.list();
    el.recordsList.innerHTML = '';
    el.recordsMsg.hidden = true;
    if (!entries.length) {
      el.recordsList.innerHTML = '<p class="records-empty">' + t('records.empty') + '</p>';
      return;
    }
    var currentGame = null, group = null;
    entries.forEach(function (e) {
      if (e.meta.game !== currentGame) {
        currentGame = e.meta.game;
        group = document.createElement('div');
        group.className = 'record-group';
        group.innerHTML = '<h3>' + t(currentGame) + '</h3>';
        el.recordsList.appendChild(group);
      }
      var row = document.createElement('div');
      row.className = 'record-row';
      row.innerHTML =
        '<span class="record-what">' + Scores.label(e, t) + '</span>' +
        '<b class="record-value">' + e.value + '</b>' +
        '<span class="record-date">' + t('records.on', { date: e.date }) + '</span>';
      group.appendChild(row);
    });
  }

  function message(text) {
    el.recordsMsg.textContent = text;
    el.recordsMsg.hidden = false;
  }

  function downloadRecords() {
    var name = 'chess-playground-records.txt';
    var blob = new Blob([Scores.toText(t)], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    Sound.play('select');
    message(t('records.saved', { name: name }));
  }

  function uploadRecords(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var res = Scores.importText(String(reader.result || ''));
      var known = res.added + res.improved + res.skipped;
      renderRecords();
      if (!known) {
        Sound.play('error');
        message(t('records.badfile'));
      } else {
        Sound.play(res.added || res.improved ? 'star' : 'select');
        message(t('records.imported', { a: res.added, b: res.improved, c: res.skipped }));
      }
    };
    reader.onerror = function () { message(t('records.badfile')); };
    reader.readAsText(file);
  }

  /* ---------------- setup ---------------- */

  var pendingCfg = null, pendingMode = null, optionsOpen = false;

  function openSetup(mode) {
    stopGame();
    pendingMode = mode;
    pendingCfg = {};
    (mode.options || []).forEach(function (opt) { pendingCfg[opt.key] = opt.def; });
    if (!mode.options || !mode.options.length) { startGame(mode, pendingCfg); return; }
    el.setupTitle.textContent = t(mode.titleKey);
    el.setupDesc.textContent = t(mode.descKey);
    applyOptionsOpen();
    renderOptions();
    show('setup');
  }

  function applyOptionsOpen() {
    el.setupOptions.hidden = !optionsOpen;
    el.settingsToggle.setAttribute('aria-expanded', optionsOpen ? 'true' : 'false');
    el.settingsToggle.classList.toggle('open', optionsOpen);
  }

  /* What the game will start with, in a line: "Computer · White · Learning" */
  function summarise() {
    if (!pendingMode) return '';
    return (pendingMode.options || []).filter(function (opt) {
      return !opt.showIf || opt.showIf(pendingCfg);
    }).map(function (opt) {
      var chosen = opt.choices.filter(function (c) { return c.v === pendingCfg[opt.key]; })[0];
      return chosen ? tLabel(chosen.labelKey) : '';
    }).filter(Boolean).join(' \u00B7 ');
  }

  function renderOptions() {
    el.setupSummary.textContent = summarise();
    el.setupOptions.innerHTML = '';
    pendingMode.options.forEach(function (opt) {
      if (opt.showIf && !opt.showIf(pendingCfg)) return;
      var wrap = document.createElement('div');
      wrap.className = 'opt-group';
      var label = document.createElement('div');
      label.className = 'opt-label';
      label.textContent = t(opt.labelKey);
      wrap.appendChild(label);

      var row = document.createElement('div');
      row.className = 'opt-row';
      opt.choices.forEach(function (choice) {
        var b = document.createElement('button');
        b.className = 'chip' + (pendingCfg[opt.key] === choice.v ? ' on' : '');
        b.innerHTML = (choice.icon ? '<span class="chip-icon">' + iconOf(choice.icon) + '</span>' : '') +
          '<span>' + tLabel(choice.labelKey) + '</span>';
        b.addEventListener('click', function () {
          pendingCfg[opt.key] = choice.v;
          Sound.play('select');
          renderOptions();
        });
        row.appendChild(b);
      });
      wrap.appendChild(row);
      el.setupOptions.appendChild(wrap);
    });
  }

  /* ---------------- game ---------------- */

  function startGame(mode, cfg) {
    stopGame();
    current = { mode: mode, cfg: cfg, controller: null };
    show('game');
    el.statusText.textContent = '';
    el.scoreCard.innerHTML = '';
    el.helpText.textContent = mode.helpKey ? t(mode.helpKey) : '';
    setTools({ hint: false, undo: false, restart: true });
    Board.setLocked(false);
    Board.setLabels(Store.getLabels());
    current.controller = mode.start(cfg, makeCtx(mode, current));
  }

  function setTools(opts) {
    el.hintBtn.hidden = !opts.hint;
    el.undoBtn.hidden = !opts.undo;
    el.restartBtn.hidden = opts.restart === false;
  }

  function makeCtx(mode, session) {
    return {
      t: t,
      cfgMode: mode,
      setStatus: function (text, cls) {
        el.statusText.textContent = text;
        el.statusCard.className = 'status-card' + (cls ? ' ' + cls : '');
      },
      setScore: function (html) { el.scoreCard.innerHTML = html || ''; },
      setHelp: function (text) { el.helpText.textContent = text; },
      setTools: setTools,
      finish: finish,
      confetti: confetti,
      relabel: function (fn) { session.relabel = fn; }
    };
  }

  /* ---------------- result dialog ---------------- */

  function finish(res) {
    Sound.play(res.sound || (res.win ? 'win' : 'lose'));
    el.dlgEmoji.textContent = res.emoji || (res.win ? '🎉' : '🙂');
    el.dlgTitle.textContent = res.title || '';
    el.dlgText.textContent = res.text || '';
    el.dlgStars.innerHTML = '';
    if (res.stars) {
      for (var i = 0; i < 3; i++) {
        var s = document.createElement('span');
        s.className = 'star' + (i < res.stars ? ' on' : '');
        s.textContent = '★';
        el.dlgStars.appendChild(s);
      }
    }
    if (res.win) confetti();
    el.overlay.hidden = false;
  }

  function hideDialog() { el.overlay.hidden = true; }

  function confetti() {
    var box = $('confetti');
    box.innerHTML = '';
    var colors = ['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff', '#c77dff'];
    for (var i = 0; i < 40; i++) {
      var d = document.createElement('i');
      d.style.left = Math.random() * 100 + '%';
      d.style.background = colors[i % colors.length];
      d.style.animationDelay = (Math.random() * 0.5) + 's';
      d.style.transform = 'rotate(' + (Math.random() * 360) + 'deg)';
      box.appendChild(d);
    }
    setTimeout(function () { box.innerHTML = ''; }, 2600);
  }

  /* ---------------- language & sound ---------------- */

  function applyLang() {
    I18N.applyStatic();
    el.langLabel.textContent = t('lang.other');
    document.title = t('app.title');
    renderMenu();
    if (!$('screen-setup').hidden && pendingMode) {
      el.setupTitle.textContent = t(pendingMode.titleKey);
      el.setupDesc.textContent = t(pendingMode.descKey);
      renderOptions();
    }
    if (!$('screen-records').hidden) renderRecords();
    if (!$('screen-game').hidden && current) {
      el.helpText.textContent = current.mode.helpKey ? t(current.mode.helpKey) : '';
      if (current.relabel) current.relabel();
    }
  }

  function toggleSound() {
    var on = !Sound.isEnabled();
    Sound.setEnabled(on);
    Store.setSound(on);
    el.soundIcon.textContent = on ? '🔊' : '🔇';
    el.soundBtn.classList.toggle('off', !on);
    if (on) Sound.play('select');
  }

  /* ---------------- boot ---------------- */

  function init() {
    ['homeBtn', 'soundBtn', 'soundIcon', 'langBtn', 'langLabel', 'modeGrid',
     'styleSwitch', 'coordsBtn', 'recordsBtn', 'recordsList', 'recordsMsg', 'saveRecordsBtn', 'loadRecordsBtn',
     'clearRecordsBtn', 'recordsFile',
     'setupTitle', 'setupDesc', 'setupOptions', 'settingsToggle', 'setupSummary', 'playBtn', 'statusCard', 'statusText',
     'scoreCard', 'helpText', 'hintBtn', 'undoBtn', 'restartBtn', 'overlay',
     'dlgEmoji', 'dlgTitle', 'dlgText', 'dlgStars', 'dlgAgain', 'dlgMenu'
    ].forEach(function (id) { el[id] = $(id); });

    Board.mount($('board'));

    var savedLang = Store.getLang();
    if (!savedLang) {
      savedLang = (navigator.language || 'en').toLowerCase().indexOf('bg') === 0 ? 'bg' : 'en';
    }
    I18N.setLang(savedLang);
    Sound.setEnabled(Store.getSound());
    Pieces.setStyle(Store.getPieces());
    Board.setLabels(Store.getLabels());
    el.coordsBtn.classList.toggle('off', !Store.getLabels());
    el.soundIcon.textContent = Sound.isEnabled() ? '🔊' : '🔇';
    el.soundBtn.classList.toggle('off', !Sound.isEnabled());

    el.langBtn.addEventListener('click', function () {
      var next = I18N.getLang() === 'en' ? 'bg' : 'en';
      I18N.setLang(next);
      Store.setLang(next);
      Sound.play('select');
    });
    el.soundBtn.addEventListener('click', toggleSound);
    el.recordsBtn.addEventListener('click', goRecords);
    el.coordsBtn.addEventListener('click', function () {
      var on = !Store.getLabels();
      Store.setLabels(on);
      Board.setLabels(on);
      el.coordsBtn.classList.toggle('off', !on);
      Sound.play('select');
    });
    el.saveRecordsBtn.addEventListener('click', downloadRecords);
    el.loadRecordsBtn.addEventListener('click', function () { el.recordsFile.click(); });
    el.recordsFile.addEventListener('change', function (ev) {
      uploadRecords(ev.target.files && ev.target.files[0]);
      ev.target.value = '';
    });
    el.clearRecordsBtn.addEventListener('click', function () {
      if (!Scores.count()) return;
      if (window.confirm(t('records.confirm'))) { Scores.clear(); renderRecords(); }
    });
    el.homeBtn.addEventListener('click', goMenu);
    el.playBtn.addEventListener('click', function () { startGame(pendingMode, pendingCfg); });
    el.settingsToggle.addEventListener('click', function () {
      optionsOpen = !optionsOpen;
      applyOptionsOpen();
      Sound.play('select');
    });
    el.restartBtn.addEventListener('click', function () {
      if (current) startGame(current.mode, current.cfg);
    });
    el.hintBtn.addEventListener('click', function () {
      if (current && current.controller && current.controller.hint) current.controller.hint();
    });
    el.undoBtn.addEventListener('click', function () {
      if (current && current.controller && current.controller.undo) current.controller.undo();
    });
    el.dlgAgain.addEventListener('click', function () {
      hideDialog();
      if (current) startGame(current.mode, current.cfg);
    });
    el.dlgMenu.addEventListener('click', goMenu);

    I18N.onChange(applyLang);
    applyLang();
    show('menu');
  }

  global.App = {
    registerMode: function (mode) { modes.push(mode); },
    goMenu: goMenu,
    goRecords: goRecords,
    init: init
  };

  document.addEventListener('DOMContentLoaded', init);
})(window);
