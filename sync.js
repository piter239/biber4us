/* Speicherung auf dem Server über die db-Funktion der Artifact-Umgebung.
   Ohne diese Umgebung (z. B. als einfache Webseite) bleibt alles im Browser (localStorage).

   Aufbau (siehe ARCHITEKTUR.md):
   - Eine Familie = ein Konto (Login) mit beliebig vielen Profilen. Alle Profile eines Kontos stehen in einem Dokument.
   - Gast-Familien (Normalfall): Der Stand liegt unter  data/users/<Konto>/progress  und ist nur für dieses Konto lesbar,
     auch der Besitzer des Artifacts kann ihn nicht lesen.
   - "Eigene Familie" des Besitzers (Modus family): Konten, die der Besitzer ausdrücklich als Familie freigibt, liegen unter
     progress/<Konto>; Besitzer und Editoren können sie lesen (Seite "Familie"). Wer den Familiencode (famcfg/main) eingibt, trägt
     sich selbst unter family/<Konto> ein und wechselt damit in diesen Modus.
   - Klassen: classes/<Hash des Klassencodes>/e/<Konto>_<Profil>  (nur wer den Code kennt, findet den Pfad; nur Spitzname und Zahlen,
     nur wenn das Profil es ausdrücklich erlaubt).

   Die Seite übergibt Funktionen:  snapshot() -> Objekt für den Server,  merge(remote) -> true, wenn sich lokal etwas änderte,
   merged() -> wird nach dem ersten Abgleich aufgerufen. */
window.BiberSync = (function () {
  'use strict';
  var S = { state: 'local', uid: null, ref: null, db: null, user: null, cfg: null, last: '', busy: false, again: false, timer: 0, lastPull: 0, canAdmin: false, retried: false, mode: 'local', oldRef: null };
  var statusFns = [];

  function setState(s) { S.state = s; statusFns.forEach(function (f) { try { f(s); } catch (e) { /* ignorieren */ } }); }
  function onStatus(fn) { statusFns.push(fn); fn(S.state); }

  function privatePath(uid) { return 'data/users/' + uid + '/progress'; }
  function rid(n) { var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = ''; var b = new Uint8Array(n); (window.crypto || window.msCrypto).getRandomValues(b); for (var i = 0; i < n; i++) s += a[b[i] % a.length]; return s; }

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
      var owner = false;
      try { owner = !!(await user.isOwner()); } catch (e) { owner = false; }
      var fam = S.canAdmin || owner;
      if (!fam) { try { var fs = await db.doc('family/' + uid).get(); fam = !!(fs && fs.exists); } catch (e) { fam = false; } }
      S.mode = fam ? 'family' : 'private';
      S.ref = db.doc(fam ? 'progress/' + uid : privatePath(uid));
      if (!fam) {
        /* Konten, die früher im offenen Bereich gespeichert haben, werden in den privaten Bereich geholt */
        try {
          var old = await db.doc('progress/' + uid).get();
          if (old && old.exists) { S.cfg.merge(old.data()); S.oldRef = db.doc('progress/' + uid); }
        } catch (e) { /* ignorieren */ }
      }
      await pull(true);
      var mayWrite = null;
      try { mayWrite = await user.can('data.write'); } catch (e) { /* unbekannt: ein Schreibversuch entscheidet */ }
      setState(mayWrite === false ? 'readonly' : 'server');
      await pushNow(true);
      if (S.oldRef && S.state === 'server' && S.last) { try { await S.oldRef.delete(); } catch (e) { /* ignorieren */ } S.oldRef = null; }
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

  /* Seite "Familie" des Besitzers: alle Konten im offenen Bereich lesen (nur Besitzer und Editoren) */
  async function listAll() {
    if (!S.db || S.mode !== 'family') return [];
    var snap = await S.db.collection('progress').get();
    return snap.docs.map(function (d) { return { uid: d.id, data: d.data() || {} }; });
  }
  async function names(ids) {
    if (!S.user || !ids.length) return {};
    try { return await S.user.profiles(ids); } catch (e) { return {}; }
  }
  /* Aktivitätsprotokoll eines Kontos im offenen Bereich (nur Besitzer und Editoren) */
  async function listLogs(uid) {
    if (!S.db) return [];
    var snap = await S.db.collection('logs/' + uid + '/c').get();
    return snap.docs.map(function (d) { var x = d.data() || {}; x.id = d.id; return x; });
  }
  /* Eigenes Protokoll im privaten Bereich: Dokumente data/users/<Konto>/log_<Sitzung>_<Nr> */
  async function listOwnLogs() {
    if (!S.db || !S.uid) return [];
    var snap = await S.db.collection('data/users/' + S.uid).get();
    return snap.docs.filter(function (d) { return /^log_/.test(d.id); }).map(function (d) { var x = d.data() || {}; x.id = d.id; return x; });
  }
  async function deleteOwnLogs() {
    var docs = await listOwnLogs();
    for (var i = 0; i < docs.length; i++) { try { await S.db.doc('data/users/' + S.uid + '/' + docs[i].id).delete(); } catch (e) { /* ignorieren */ } }
    return docs.length;
  }

  /* Familiencode des Besitzers (wird beim ersten Aufruf angelegt) und Mitglieder, die ihn eingegeben haben */
  var codeP = null;
  function famCode() {
    if (!S.db || S.mode !== 'family' || !S.canAdmin) return Promise.resolve(null);
    if (!codeP) {
      codeP = (async function () {
        var ref = S.db.doc('famcfg/main'), snap = await ref.get();
        if (snap.exists && snap.data() && snap.data().code) return snap.data().code;
        var code = rid(4) + '-' + rid(4) + '-' + rid(4);
        await ref.set({ code: code, at: new Date().toISOString() });
        return code;
      })().catch(function (e) { codeP = null; throw e; });
    }
    return codeP;
  }
  async function famMembers() {
    var code = await famCode(); if (!code) return [];
    var snap = await S.db.collection('family').get();
    return snap.docs.filter(function (d) { var x = d.data() || {}; return x.c === code; }).map(function (d) { return d.id; });
  }
  /* Ein Gast-Konto tritt der Familie des Besitzers bei: Eintrag family/<Konto>, Stand wandert in den offenen Bereich */
  async function joinFamily(code) {
    if (!S.db || S.mode !== 'private') return false;
    code = String(code || '').trim().toUpperCase();
    if (!/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(code)) return false;
    var privRef = S.ref;
    await S.db.doc('family/' + S.uid).set({ c: code, at: new Date().toISOString() });
    S.mode = 'family'; S.ref = S.db.doc('progress/' + S.uid); S.last = '';
    await pushNow(true);
    if (S.last) { try { await privRef.delete(); } catch (e) { /* ignorieren */ } }
    if (S.cfg.modeChanged) S.cfg.modeChanged();
    return true;
  }
  async function leaveFamily() {
    if (!S.db || S.mode !== 'family' || S.canAdmin) return false;
    var famRef = S.ref;
    S.mode = 'private'; S.ref = S.db.doc(privatePath(S.uid)); S.last = '';
    await pushNow(true);
    if (S.last) {
      try { await famRef.delete(); } catch (e) { /* ignorieren */ }
      try { await S.db.doc('family/' + S.uid).delete(); } catch (e) { /* ignorieren */ }
    }
    if (S.cfg.modeChanged) S.cfg.modeChanged();
    return true;
  }

  var api = {
    ready: function () { return !!(S.db && S.uid && S.state === 'server'); },
    doc: function (path) { return S.db.doc(path); },
    collection: function (path) { return S.db.collection(path); },
    uid: function () { return S.uid; },
    mode: function () { return S.state === 'server' || S.state === 'readonly' ? S.mode : 'local'; },
    logPath: function (id) { return S.mode === 'family' ? 'logs/' + S.uid + '/c/' + id : 'data/users/' + S.uid + '/log_' + id; }
  };

  return {
    api: api,
    start: start,
    schedule: schedule,
    onStatus: onStatus,
    listAll: listAll,
    listLogs: listLogs,
    listOwnLogs: listOwnLogs,
    deleteOwnLogs: deleteOwnLogs,
    famCode: famCode,
    famMembers: famMembers,
    joinFamily: joinFamily,
    leaveFamily: leaveFamily,
    names: names,
    state: function () { return S.state; },
    mode: api.mode,
    canAdmin: function () { return S.canAdmin; },
    uid: function () { return S.uid; }
  };
})();
