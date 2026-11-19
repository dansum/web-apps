/*
 * D4 (ДЧ) — Google Analytics with a cookie-consent banner.
 *
 * Google Analytics loads ONLY after the visitor clicks "Accept".
 * Until then (and after "Decline") nothing is sent to Google and no cookies are set.
 * The choice is stored in localStorage ('d4-consent') and is shared by every page
 * on the site, so the banner is shown once.
 *
 * Add to any page, just before </body> (adjust the path):
 *   <script src="../consent.js" defer></script>
 *
 * To let the visitor change their mind, call:  d4Consent.reset()
 */
(function () {
  var GA_ID = 'G-G9RTDWVTGS';
  var KEY = 'd4-consent';

  var TEXT = {
    bg: {
      msg: 'Искаме да броим колко хора отварят тези страници. За това ползваме Google Analytics, който слага бисквитки. Съгласен ли си?',
      yes: 'Приемам', no: 'Отказвам', more: 'Повече', moreUrl: 'https://policies.google.com/technologies/partner-sites?hl=bg'
    },
    en: {
      msg: 'We would like to count how many people open these pages. For that we use Google Analytics, which sets cookies. Is that OK with you?',
      yes: 'Accept', no: 'Decline', more: 'More', moreUrl: 'https://policies.google.com/technologies/partner-sites?hl=en'
    },
    de: {
      msg: 'Wir möchten zählen, wie viele Menschen diese Seiten öffnen. Dafür nutzen wir Google Analytics, das Cookies setzt. Bist du einverstanden?',
      yes: 'Akzeptieren', no: 'Ablehnen', more: 'Mehr', moreUrl: 'https://policies.google.com/technologies/partner-sites?hl=de'
    }
  };

  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  var loaded = false;
  function loadGA() {
    if (loaded) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied'
    });
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  function lang() {
    var l = (document.documentElement.lang || 'bg').slice(0, 2).toLowerCase();
    return TEXT[l] ? l : 'bg';
  }

  var box = null;
  function hide() { if (box) { box.remove(); box = null; } }

  function show() {
    if (box) return;
    var t = TEXT[lang()];
    var css =
      '#d4c{position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483647;max-width:560px;margin:0 auto;' +
      'background:#fff;color:#1b1d22;border:1px solid #e3e1da;border-radius:14px;padding:14px 16px;' +
      'box-shadow:0 8px 30px rgba(0,0,0,.18);font:15px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;text-align:left}' +
      '#d4c p{margin:0 0 12px}#d4c a{color:#2f5bea}' +
      '#d4c .b{display:flex;gap:8px;flex-wrap:wrap}' +
      '#d4c button{flex:1 1 120px;font:inherit;font-weight:600;padding:9px 14px;border-radius:10px;cursor:pointer;' +
      'border:1px solid #1b1d22;background:#fff;color:#1b1d22}' +
      '#d4c button.y{background:#1b1d22;color:#fff}' +
      '@media (prefers-color-scheme:dark){#d4c{background:#1b1e24;color:#eceef2;border-color:#2a2e36}' +
      '#d4c a{color:#7d9bff}#d4c button{background:#1b1e24;color:#eceef2;border-color:#eceef2}' +
      '#d4c button.y{background:#eceef2;color:#1b1e24}}';

    box = document.createElement('div');
    box.id = 'd4c';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-live', 'polite');
    box.setAttribute('aria-label', 'Cookies');
    var style = document.createElement('style');
    style.textContent = css;
    box.appendChild(style);

    var p = document.createElement('p');
    p.textContent = t.msg + ' ';
    var a = document.createElement('a');
    a.href = t.moreUrl; a.target = '_blank'; a.rel = 'noopener'; a.textContent = t.more;
    p.appendChild(a);
    box.appendChild(p);

    var row = document.createElement('div');
    row.className = 'b';
    // "Decline" is as easy to reach as "Accept" (GDPR).
    var no = document.createElement('button');
    no.type = 'button'; no.textContent = t.no;
    no.onclick = function () { set('denied'); hide(); };
    var yes = document.createElement('button');
    yes.type = 'button'; yes.className = 'y'; yes.textContent = t.yes;
    yes.onclick = function () { set('granted'); hide(); loadGA(); };
    row.appendChild(no);
    row.appendChild(yes);
    box.appendChild(row);
    document.body.appendChild(box);
  }

  window.d4Consent = {
    reset: function () {
      var was = get();
      try { localStorage.removeItem(KEY); } catch (e) {}
      // Remove Google Analytics cookies (_ga, _ga_XXXX) on every possible domain.
      var host = location.hostname, parts = host.split('.'), domains = ['', host];
      for (var i = 1; i < parts.length - 1; i++) domains.push('.' + parts.slice(i).join('.'));
      document.cookie.split(';').forEach(function (c) {
        var name = c.split('=')[0].trim();
        if (name.indexOf('_ga') !== 0) return;
        domains.forEach(function (d) {
          document.cookie = name + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '');
        });
      });
      // Analytics already running on this page cannot be unloaded; reload so it stops.
      if (was === 'granted') { location.reload(); return; }
      show();
    }
  };

  function start() {
    var c = get();
    if (c === 'granted') loadGA();
    else if (c !== 'denied') show();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
