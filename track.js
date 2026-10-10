/* Aktivitätsprotokoll (für die Eltern): hält kompakt fest, was in der Seite passiert, damit man später auswerten kann,
   was zum Aufgabenlösen motiviert. Eine Zeile pro Ereignis:   <ms seit letztem Ereignis> <Code> <Felder ...>
   Felder sind durch Leerzeichen getrennt (Leerzeichen und % in Werten als %20 und %25). Es werden nur Handlungen gespeichert,
   keine Mausbewegungen und keine getippten Texte (außer den Antworten in Aufgaben beim Prüfen und dem, was man der helfenden Katze sagt oder schreibt, samt ihrer Antwort).

   Aufbau auf dem Server (nur wenn die db-Funktion der Artifact-Umgebung verfügbar ist):
     logs/<Konto-Id>/c/<Sitzung>_<Nr>   ein Dokument je Abschnitt (höchstens 300 Zeilen, ca. 8 kB)
       Felder: p Profil-Id, w Name des Profils (klein, ohne Leerzeichen), d Geräte-Id, h Gerätebeschreibung, s Sitzungs-Id,
               n Abschnittsnummer, b Beginn des Abschnitts (ms seit 1970), v Version der Seite, t die Zeilen
   Ohne Server bleibt das Protokoll (begrenzt) im Browser und wird beim nächsten Start mit Server nachgeschickt.

   Ereigniscodes (Auswahl):  S Sitzungsbeginn, v Seitenwechsel, c Klick, ts/ta/tr/tsol/tl/i Aufgabe (Start, Antwort,
   Wiederholen, Lösung, Verlassen, Eingabe), r.* Probelauf, k.* Kätzchen, lvl Niveau, adj Niveau-Wunsch, idle/back, vis, sync */
window.BiberTrack = (function () {
  'use strict';
  var VER = 'v22';
  var CHUNK = 300;            /* Zeilen je Abschnitt */
  var FLUSH_MS = 15000;
  var MAX_LOCAL = 400000;     /* Zeichen im Browser-Puffer */
  var LS_DEV = 'biber.dev', LS_PEND = 'biber.log.pending';
  var dev = '', desc = '', sid = '', pid = '', who = '', chunkNo = 0, cur = null, lastT = 0, lastAct = 0, idleSent = false;
  var pending = [];           /* Abschnitte, die noch nicht (vollständig) auf dem Server sind */
  var timer = 0, saveTimer = 0, busy = false, started = false, syncFns = null;

  function rid(n) { var s = ''; while (s.length < n) s += Math.floor(Math.random() * 36).toString(36); return s; }
  function esc(x) { return String(x == null ? '' : x).replace(/%/g, '%25').replace(/\s/g, '%20').slice(0, 300); }
  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* ignorieren */ } }

  function describe() {
    var nav = window.navigator || {}, ua = nav.userAgent || '', b = 'x', os = 'x';
    if (/Edg\//.test(ua)) b = 'edge'; else if (/OPR\/|Opera/.test(ua)) b = 'opera'; else if (/Firefox\//.test(ua)) b = 'firefox';
    else if (/Chrome\//.test(ua)) b = 'chrome'; else if (/Safari\//.test(ua)) b = 'safari';
    if (/Windows/.test(ua)) os = 'win'; else if (/Android/.test(ua)) os = 'android'; else if (/iPhone|iPad|iPod/.test(ua) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1)) os = 'ios';
    else if (/Mac/.test(ua)) os = 'mac'; else if (/Linux/.test(ua)) os = 'linux';
    var sc = window.screen || {};
    var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) { tz = ''; }
    return [os, b, (window.innerWidth || 0) + 'x' + (window.innerHeight || 0), (sc.width || 0) + 'x' + (sc.height || 0), 'dpr' + (window.devicePixelRatio || 1),
      (nav.maxTouchPoints > 0 ? 'touch' : 'mouse'), (nav.language || ''), tz].join(' ');
  }

  function newChunk(first) {
    cur = { id: sid + '_' + chunkNo, n: chunkNo, b: Date.now(), lines: [], dirty: true, full: false, p: pid, w: who, d: dev, h: desc, s: sid };
    chunkNo++;
    lastT = cur.b;
    pending.push(cur);
    if (first) cur.lines.push('0 S ' + esc(VER) + ' ' + desc.split(' ').map(esc).join(' '));
  }

  function startSession() {
    sid = Date.now().toString(36) + rid(3);
    chunkNo = 0;
    desc = describe();
    newChunk(true);
    idleSent = false;
  }

  function persistLocal() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      var data = pending.filter(function (c) { return c.lines.length; });
      var s = JSON.stringify(data);
      while (s.length > MAX_LOCAL && data.length > 1) { data.shift(); s = JSON.stringify(data); }
      lsSet(LS_PEND, s);
    }, 600);
  }

  function schedule() {
    if (timer) return;
    timer = setTimeout(function () { timer = 0; flush(); }, FLUSH_MS);
  }

  function log(code) {
    if (!started) return;
    var now = Date.now();
    if (cur && lastAct && now - lastAct > 30 * 60 * 1000 && code !== 'vis' && code !== 'sync') startSession();   /* lange Pause: neue Sitzung */
    if (idleSent && code !== 'vis' && code !== 'sync' && code !== 'idle' && code !== 'back') { idleSent = false; log('back', Math.round((now - lastAct) / 1000)); now = Date.now(); }
    if (!cur || cur.full || cur.p !== pid) {
      if (!cur || cur.p !== pid) { startSession(); } else newChunk(false);
    }
    var args = [].slice.call(arguments, 1).map(esc);
    var dt = Math.max(0, now - lastT);
    lastT = now;
    cur.lines.push(dt + ' ' + code + (args.length ? ' ' + args.join(' ') : ''));
    cur.dirty = true;
    if (cur.lines.length >= CHUNK) { cur.full = true; }
    if (code !== 'vis' && code !== 'sync' && code !== 'idle') { lastAct = now; if (idleSent) { idleSent = false; } }
    persistLocal();
    schedule();
  }

  /* ---------- Server ---------- */
  function ready() { return syncFns && syncFns.ready && syncFns.ready(); }
  async function flush() {
    if (busy || !ready()) { if (pending.length) schedule(); return; }
    busy = true;
    try {
      var todo = pending.filter(function (c) { return c.dirty && c.lines.length; });
      for (var i = 0; i < todo.length; i++) {
        var c = todo[i], snapshotN = c.lines.length;
        await syncFns.doc('logs/' + syncFns.uid() + '/c/' + c.id).set({ p: c.p, w: c.w, d: c.d, h: c.h, s: c.s, n: c.n, b: c.b, v: VER, t: c.lines.join('\n') });
        if (c.lines.length === snapshotN) c.dirty = false;
        if (c.full && !c.dirty) pending.splice(pending.indexOf(c), 1);
      }
      persistLocal();
    } catch (e) {
      var code = e && e.code;
      if (code === 'invalid_argument' || code === 'revoked') { syncFns = null; }   /* kein Schreibrecht: nur im Browser puffern */
    } finally { busy = false; if (pending.some(function (c) { return c.dirty; })) schedule(); }
  }

  function restorePending() {
    var raw = lsGet(LS_PEND);
    if (!raw) return;
    try {
      var arr = JSON.parse(raw);
      if (Array.isArray(arr)) arr.forEach(function (c) { if (c && c.id && c.lines && c.lines.length) { c.dirty = true; c.full = true; pending.push(c); } });
    } catch (e) { /* ignorieren */ }
  }

  /* ---------- Beschreibung von Klicks ---------- */
  function clickDesc(el) {
    var node = el, hops = 0, d = '';
    while (node && node !== document.body && hops < 6) {
      var ds = node.dataset || {};
      if (ds.act) { d = 'act.' + ds.act; break; }
      if (ds.run) { d = 'run.' + ds.run + (ds.i != null ? '.' + ds.i : ''); break; }
      if (ds.nav) { d = 'nav.' + ds.nav; break; }
      if (ds.adj) { d = 'adj.' + ds.adj; break; }
      if (ds.mode) { d = 'mode.' + ds.mode; break; }
      if (ds.group) { d = 'grp.' + ds.group; break; }
      if (ds.st) { d = 'st.' + ds.st; break; }
      if (ds.gift) { d = 'gift.' + ds.gift; break; }
      if (ds.tab) { d = 'tab.' + ds.tab; break; }
      if (ds.help) { d = 'help.' + ds.help; break; }
      if (ds.hf) { d = 'hf.' + ds.hf; break; }
      if (node.id && node.id !== 'app' && node.id !== 'runTask') { d = '#' + node.id; break; }
      if (node.classList && node.classList.contains('hf-tafel')) { d = 'hf.tafel'; break; }
      if (node.classList && node.classList.contains('bk-wrap')) { d = 'cat'; break; }
      if (node.classList && node.classList.contains('bk-hid')) { d = 'cat.hidden'; break; }
      if (node.classList && node.classList.contains('bk-toast')) { d = 'toast'; break; }
      if (node.classList && node.classList.contains('bk-say-go')) { d = 'say.go'; break; }
      if (node.tagName === 'A' && node.getAttribute('href')) { d = 'a' + node.getAttribute('href'); break; }
      if (node.classList && node.classList.contains('rec-card')) { d = 'rec'; break; }
      if (node.classList && node.classList.contains('task-row')) { d = 'row'; break; }
      node = node.parentNode; hops++;
    }
    if (!d) {
      var t = el.tagName ? el.tagName.toLowerCase() : '?', c = (el.className && el.className.baseVal != null ? el.className.baseVal : el.className) || '';
      d = t + (c ? '.' + String(c).split(' ')[0] : '');
      if (el.closest && el.closest('.board-mount')) d = 'board:' + d;
    }
    return d;
  }

  function init(opts) {
    if (started) return;
    started = true;
    dev = lsGet(LS_DEV) || (function () { var d = rid(8); lsSet(LS_DEV, d); return d; })();
    desc = describe();
    restorePending();
    pid = (opts && opts.pid) || ''; who = (opts && opts.who) || '';
    startSession();
    lastAct = Date.now();

    document.addEventListener('click', function (e) {
      var x = Math.round((e.clientX || 0) / Math.max(1, window.innerWidth) * 1000), y = Math.round((e.clientY || 0) / Math.max(1, window.innerHeight) * 1000);
      log('c', clickDesc(e.target), x, y);
    }, true);
    var kb = 0, kbT = 0;
    document.addEventListener('keydown', function (e) {
      kb++;
      if (!kbT) kbT = setTimeout(function () { log('kb', kb); kb = 0; kbT = 0; }, 3000);
      if (e.key === 'Escape' || e.key === 'Enter') log('key', e.key);
    }, true);
    document.addEventListener('visibilitychange', function () { log('vis', document.hidden ? 'h' : 'v'); if (document.hidden) flush(); });
    window.addEventListener('pagehide', function () { persistLocal(); flush(); });
    window.addEventListener('hashchange', function () { log('v', location.hash || '#'); });
    setInterval(function () {
      if (!idleSent && lastAct && Date.now() - lastAct > 60000 && !document.hidden) { idleSent = true; log('idle', 60); }
    }, 10000);
    window.addEventListener('resize', (function () { var t = 0; return function () { clearTimeout(t); t = setTimeout(function () { log('rs', window.innerWidth + 'x' + window.innerHeight); }, 800); }; })());
    log('v', location.hash || '#');
  }

  return {
    init: init,
    log: log,
    setProfile: function (id, name) {
      var w = String(name || '').toLowerCase().replace(/[^a-zäöüß0-9]/g, '').slice(0, 24);
      if (id === pid && w === who) return;
      var changed = id !== pid;
      pid = id; who = w;
      if (started && changed) { startSession(); log('prof', 'sel'); }
      else if (started && cur) { cur.w = who; cur.dirty = true; }
    },
    useServer: function (fns) { syncFns = fns; flush(); },
    flush: flush,
    state: function () { return { dev: dev, sid: sid, pending: pending.length }; }
  };
})();
