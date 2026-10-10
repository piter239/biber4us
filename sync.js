/* Speicherung auf dem Server über die db-Funktion der Artifact-Umgebung.
   Ohne diese Umgebung (z. B. als einfache Webseite) bleibt alles im Browser (localStorage).

   Aufbau: pro Konto ein Dokument "progress/<Konto-Id>" mit allen Profilen dieses Kontos
   (Ergebnisse, Niveau-Anpassung, Kätzchen-Stand). Jede Person liest und schreibt nur ihr eigenes Dokument;
   Besitzer und Editoren können alle lesen (Seite "Familie").

   Die Seite übergibt Funktionen:  snapshot() -> Objekt für den Server,  merge(remote) -> true, wenn sich lokal etwas änderte,
   merged() -> wird nach dem ersten Abgleich aufgerufen. */
window.BiberSync = (function () {
  'use strict';
  var S = { state: 'local', uid: null, ref: null, db: null, user: null, cfg: null, last: '', busy: false, again: false, timer: 0, lastPull: 0, canAdmin: false, retried: false };
  var statusFns = [];

  function setState(s) { S.state = s; statusFns.forEach(function (f) { try { f(s); } catch (e) { /* ignorieren */ } }); }
  function onStatus(fn) { statusFns.push(fn); fn(S.state); }

  async function start(cfg) {
    S.cfg = cfg;
    if (!window.claude || typeof window.claude.use !== 'function') return;
    setState('connecting');
    try {
      var db = await window.claude.use('db');
      var user = await window.claude.use('user');
      if (!db || !user) { setState('local'); return; }
      var uid = await user.id();
      if (!uid) { setState('local'); return; }           /* abgemeldet oder ohne Identität: nur im Browser */
      S.db = db; S.user = user; S.uid = uid;
      S.canAdmin = await user.canEdit();
      S.ref = db.doc('progress/' + uid);
      await pull(true);
      var mayWrite = null;
      try { mayWrite = await user.can('data.write'); } catch (e) { /* unbekannt: ein Schreibversuch entscheidet */ }
      setState(mayWrite === false ? 'readonly' : 'server');
      await pushNow(true);
      if (S.cfg.merged) S.cfg.merged();
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible' && Date.now() - S.lastPull > 60000) pull(false);
      });
    } catch (e) {
      setState('local');
    }
  }

  async function pull(first) {
    if (!S.ref) return;
    var snap = await S.ref.get();
    S.lastPull = Date.now();
    if (snap.exists) {
      var changed = S.cfg.merge(snap.data());
      if (changed && !first && S.cfg.merged) S.cfg.merged();
    }
  }

  function schedule() {
    if (!S.ref || S.state === 'readonly') return;
    clearTimeout(S.timer);
    S.timer = setTimeout(function () { pushNow(false); }, 1200);
  }

  async function pushNow(force) {
    if (!S.ref || S.state === 'readonly') return;
    if (S.busy) { S.again = true; return; }
    var data = S.cfg.snapshot();
    if (!data) return;
    var json = JSON.stringify(data);
    if (json.length > 230000) {                      /* Dokumente sind auf 256 KiB begrenzt: Antworten weglassen, Ergebnisse bleiben */
      data = S.cfg.snapshot(true) || data;
      json = JSON.stringify(data);
    }
    if (json === S.last) return;
    S.busy = true;
    try {
      await S.ref.set(data);
      S.last = json;
      S.retried = false;
      if (S.state !== 'server') setState('server');
    } catch (e) {
      var code = e && e.code;
      if (code === 'invalid_argument' || code === 'revoked') setState('readonly');   /* kein Schreibrecht: nur im Browser weiter */
      else if (!S.retried) { S.retried = true; setTimeout(function () { pushNow(false); }, 4000 + Math.random() * 2000); }
    } finally {
      S.busy = false;
      if (S.again) { S.again = false; schedule(); }
    }
  }

  /* Für die Seite "Familie": alle Konten lesen (nur Besitzer und Editoren sehen mehr als ihr eigenes Dokument) */
  async function listAll() {
    if (!S.db) return [];
    var snap = await S.db.collection('progress').get();
    return snap.docs.map(function (d) { return { uid: d.id, data: d.data() || {} }; });
  }
  /* Aktivitätsprotokoll eines Kontos (nur Besitzer und Editoren) */
  async function listLogs(uid) {
    if (!S.db) return [];
    var snap = await S.db.collection('logs/' + uid + '/c').get();
    return snap.docs.map(function (d) { var x = d.data() || {}; x.id = d.id; return x; });
  }
  async function names(ids) {
    if (!S.user || !ids.length) return {};
    try { return await S.user.profiles(ids); } catch (e) { return {}; }
  }

  var api = {
    ready: function () { return !!(S.db && S.uid && S.state === 'server'); },
    doc: function (path) { return S.db.doc(path); },
    uid: function () { return S.uid; }
  };

  return {
    api: api,
    start: start,
    schedule: schedule,
    onStatus: onStatus,
    listAll: listAll,
    listLogs: listLogs,
    names: names,
    state: function () { return S.state; },
    canAdmin: function () { return S.canAdmin; },
    uid: function () { return S.uid; }
  };
})();
