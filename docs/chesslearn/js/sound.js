/* sound.js — short WebAudio blips, no audio files needed */
(function (global) {
  'use strict';
  var ctx = null;
  var enabled = true;

  function ac() {
    if (!ctx) {
      var Ctor = global.AudioContext || global.webkitAudioContext;
      if (!Ctor) return null;
      try { ctx = new Ctor(); } catch (e) { return null; }
    }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }

  function tone(freq, start, dur, type, vol) {
    var c = ac();
    if (!c) return;
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, c.currentTime + start);
    gain.gain.setValueAtTime(0.0001, c.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(vol || 0.18, c.currentTime + start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime + start);
    osc.stop(c.currentTime + start + dur + 0.02);
  }

  var SOUNDS = {
    move:    function () { tone(520, 0, 0.09, 'triangle', 0.14); },
    select:  function () { tone(760, 0, 0.06, 'sine', 0.10); },
    capture: function () { tone(180, 0, 0.16, 'square', 0.12); tone(110, 0.04, 0.18, 'sine', 0.14); },
    error:   function () { tone(150, 0, 0.14, 'sawtooth', 0.08); },
    win:     function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.11, 0.24, 'triangle', 0.16); }); },
    lose:    function () { [392, 330, 262].forEach(function (f, i) { tone(f, i * 0.13, 0.26, 'sine', 0.14); }); },
    star:    function () { [880, 1175].forEach(function (f, i) { tone(f, i * 0.08, 0.18, 'triangle', 0.14); }); }
  };

  global.Sound = {
    play: function (name) { if (enabled && SOUNDS[name]) SOUNDS[name](); },
    setEnabled: function (v) { enabled = !!v; },
    isEnabled: function () { return enabled; }
  };
})(window);
