/* app.js — the shell: menu, setup screen, game panel, language, sound.
   Every mini game registers itself here and gets a small context object. */
(function (global) {
  'use strict';

  var modes = [];
  var current = null;        // { mode, cfg, controller }
  var el = {};

  function $(id) { return document.getElementById(id); }
  function t(key, vars) { return I18N.t(key, vars); }

  /* ---------------- screens ---------------- */

  function show(name) {
    ['menu', 'setup', 'game'].forEach(function (s) {
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

  function renderMenu() {
    el.modeGrid.innerHTML = '';
    modes.forEach(function (mode) {
      var card = document.createElement('button');
      card.className = 'mode-card';
      card.innerHTML =
        '<div class="mode-icon">' + mode.icon + '</div>' +
        '<div class="mode-text">' +
        '<span class="mode-title">' + t(mode.titleKey) + '</span>' +
        '<span class="mode-desc">' + t(mode.descKey) + '</span>' +
        '</div>';
      card.addEventListener('click', function () { openSetup(mode); });
      el.modeGrid.appendChild(card);
    });
  }

  /* ---------------- setup ---------------- */

  var pendingCfg = null, pendingMode = null;

  function openSetup(mode) {
    stopGame();
    pendingMode = mode;
    pendingCfg = {};
    (mode.options || []).forEach(function (opt) { pendingCfg[opt.key] = opt.def; });
    if (!mode.options || !mode.options.length) { startGame(mode, pendingCfg); return; }
    el.setupTitle.textContent = t(mode.titleKey);
    el.setupDesc.textContent = t(mode.descKey);
    renderOptions();
    show('setup');
  }

  function renderOptions() {
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
        b.innerHTML = (choice.icon ? '<span class="chip-icon">' + choice.icon + '</span>' : '') +
          '<span>' + t(choice.labelKey) + '</span>';
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
     'setupTitle', 'setupDesc', 'setupOptions', 'playBtn', 'statusCard', 'statusText',
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
    el.soundIcon.textContent = Sound.isEnabled() ? '🔊' : '🔇';
    el.soundBtn.classList.toggle('off', !Sound.isEnabled());

    el.langBtn.addEventListener('click', function () {
      var next = I18N.getLang() === 'en' ? 'bg' : 'en';
      I18N.setLang(next);
      Store.setLang(next);
      Sound.play('select');
    });
    el.soundBtn.addEventListener('click', toggleSound);
    el.homeBtn.addEventListener('click', goMenu);
    el.playBtn.addEventListener('click', function () { startGame(pendingMode, pendingCfg); });
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
    init: init
  };

  document.addEventListener('DOMContentLoaded', init);
})(window);
