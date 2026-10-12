/* Klasse: ein Ranking nur für Kinder, deren Eltern das ausdrücklich erlauben.
   - Eine Klasse ist ein Code (XXXX-XXXX-XXXX). Alle Eltern, die den Code kennen, können beitreten; jede Familie kann Klassen anlegen.
   - Auf dem Server liegt nur  classes/<Hash des Codes>/e/<Konto>_<Profil>  mit Spitzname, Zahl der bearbeiteten und richtigen Aufgaben
     und dem Niveau-Namen. Ohne den Code findet niemand den Pfad (die Liste "classes" selbst ist leer).
   - Standard: aus. Pro Profil schaltet das Konto ein, ob es in der Klasse gezeigt wird (Seite Klasse). Ausschalten löscht den Eintrag.
   - Das Konto speichert je Profil  p.cls = { code, name, nick, on }  (wird wie die Ergebnisse zwischen Geräten abgeglichen). */
(function () {
  'use strict';
  var A = window.BiberApp;
  if (!A) return;
  var esc = A.esc, app = A.app;
  var ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  function rid(n) { var b = new Uint8Array(n), s = ''; window.crypto.getRandomValues(b); for (var i = 0; i < n; i++) s += ALPHA[b[i] % ALPHA.length]; return s; }
  function newCode() { return rid(4) + '-' + rid(4) + '-' + rid(4); }
  function okCode(c) { return /^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(c); }
  function normCode(c) { return String(c || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^(.{4})(.{4})(.{4}).*$/, '$1-$2-$3'); }
  async function cid(code) {
    var buf = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(code).toUpperCase().replace(/[^A-Z0-9]/g, '')));
    return Array.prototype.map.call(new Uint8Array(buf), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('').slice(0, 24);
  }
  function B() { return window.BiberSync; }
  function ready() { return B() && B().state() === 'server' && B().api.ready(); }
  function now() { return new Date().toISOString(); }
  function touch(p) { p.upd = now(); A.save(); }

  /* ---------- Eintrag veröffentlichen / entfernen ---------- */
  function stats(p) {
    var ids = Object.keys(p.results || {}), right = ids.filter(function (id) { return p.results[id].correct; }).length;
    return { n: ids.length, r: right, lv: A.levelLabel(A.abilityOf(p)).name };
  }
  async function publish(p) {
    if (!ready() || !p.cls) return;
    var id = await cid(p.cls.code), docId = B().api.uid() + '_' + p.id, ref = B().api.doc('classes/' + id + '/e/' + docId);
    if (p.cls.on && p.cls.nick) {
      var st = stats(p);
      await ref.set({ u: B().api.uid(), pid: p.id, nick: String(p.cls.nick).slice(0, 20), n: st.n, r: st.r, lv: st.lv, at: now() });
    } else { try { await ref.delete(); } catch (e) { /* war nicht da */ } }
  }
  var pubT = 0;
  function publishSoon() {
    clearTimeout(pubT);
    pubT = setTimeout(function () {
      var p = A.profile();
      if (p && p.cls && p.cls.on) publish(p).catch(function () { /* später wieder */ });
    }, 4000);
  }
  document.addEventListener('biber:result', publishSoon);
  document.addEventListener('biber:credit', publishSoon);

  /* ---------- Seite ---------- */
  var msg = '';
  function renderBoard(host, p) {
    host.innerHTML = '<p class="note">Lade die Klasse …</p>';
    cid(p.cls.code).then(function (id) { return B().api.collection('classes/' + id + '/e').get(); }).then(function (snap) {
      var rows = snap.docs.filter(function (d) { return d.id !== 'meta'; }).map(function (d) { return d.data() || {}; }).filter(function (x) { return x.nick; });
      rows.sort(function (a, b) { return (b.r || 0) - (a.r || 0) || (b.n || 0) - (a.n || 0); });
      var me = B().api.uid();
      host.innerHTML = rows.length ? '<div class="tbl-wrap"><table class="res"><thead><tr><th>Platz</th><th>Name</th><th class="r">Richtig</th><th class="r">Bearbeitet</th><th>Niveau</th></tr></thead><tbody>' +
        rows.map(function (x, i) { return '<tr' + (x.u === me && x.pid === p.id ? ' class="me"' : '') + '><td class="num">' + (i + 1) + '</td><td>' + esc(x.nick) + '</td><td class="r num">' + (x.r || 0) + '</td><td class="r num">' + (x.n || 0) + '</td><td>' + esc(x.lv || '') + '</td></tr>'; }).join('') +
        '</tbody></table></div><p class="note">Angezeigt werden nur Kinder, deren Eltern das Zeigen in der Klasse eingeschaltet haben.</p>'
        : '<p class="note">Noch zeigt niemand seine Ergebnisse in dieser Klasse. Schalte es für dein Profil ein, dann bist du der Erste.</p>';
    }).catch(function () { host.innerHTML = '<p class="note">Die Klasse konnte nicht geladen werden.</p>'; });
  }

  function render(h) {
    var p = A.profile(), codeInUrl = (/^klasse=(.+)$/.exec(h || '') || [])[1];
    app.innerHTML = '<section class="hero"><p class="eyebrow">Mit anderen vergleichen, wenn du willst</p><h1>Klasse</h1><p class="lead">Eine Klasse ist ein Code, den die Eltern untereinander weitergeben. Ob ein Profil dort gezeigt wird, entscheidest du für jedes Profil einzeln. Standard: nicht.</p></section><div id="klBody"></div>';
    var body = document.getElementById('klBody');
    if (!ready()) { body.innerHTML = '<p class="note">Klassen gibt es, wenn die Seite mit dem Server verbunden ist.</p>'; return; }
    var c = p.cls;
    if (!c) {
      var pre = codeInUrl ? normCode(decodeURIComponent(codeInUrl)) : '';
      body.innerHTML = '<section class="panel"><h2>Profil „' + esc(p.name || 'Profil') + '“</h2><p>Dieses Profil ist noch in keiner Klasse.</p>' +
        '<form class="dlg-form" data-kl="join"><label>Code der Klasse<input id="klCode" type="text" maxlength="14" autocomplete="off" placeholder="XXXX-XXXX-XXXX" value="' + esc(pre) + '"></label><div class="actions"><button class="btn" type="submit">Beitreten</button></div></form>' +
        '<form class="dlg-form" data-kl="new"><b>Neue Klasse anlegen</b><label>Name der Klasse<input id="klName" type="text" maxlength="30" autocomplete="off" placeholder="z. B. 6b Gymnasium"></label><div class="actions"><button class="btn ghost" type="submit">Anlegen</button></div></form>' +
        '<p class="note" id="klMsg" role="status">' + esc(msg) + '</p></section>';
      return;
    }
    body.innerHTML = '<section class="panel"><h2>' + esc(c.name || 'Klasse') + '</h2><p class="note">Profil „' + esc(p.name || 'Profil') + '“ · Code der Klasse: <b class="fam-code-inline">' + esc(c.code) + '</b> (gib ihn anderen Eltern weiter, damit sie beitreten können)</p>' +
      '<form class="dlg-form" data-kl="save"><label>Name in der Klasse (z. B. Vorname oder Spitzname)<input id="klNick" type="text" maxlength="20" autocomplete="off" value="' + esc(c.nick || '') + '"></label>' +
      '<label class="fam-check"><input type="checkbox" id="klOn"' + (c.on ? ' checked' : '') + '> Dieses Profil in der Klasse zeigen</label>' +
      '<p class="note">Gezeigt werden nur: dieser Name, wie viele Aufgaben bearbeitet und richtig gelöst wurden und der Niveau-Name. Keine Antworten, kein Protokoll. Ausschalten löscht den Eintrag sofort.</p>' +
      '<div class="actions"><button class="btn" type="submit">Speichern</button><button class="btn ghost" type="button" data-kl="leave">Klasse verlassen</button></div><p class="note" id="klMsg" role="status">' + esc(msg) + '</p></form></section>' +
      '<section class="panel"><h2>Die Klasse</h2><div id="klBoard"></div></section>';
    renderBoard(document.getElementById('klBoard'), p);
  }

  document.addEventListener('submit', function (e) {
    var f = e.target.closest && e.target.closest('[data-kl]');
    if (!f || !app.contains(f)) return;
    e.preventDefault();
    var p = A.profile(), kind = f.dataset.kl;
    if (kind === 'join') {
      var code = normCode(document.getElementById('klCode').value);
      if (!okCode(code)) { msg = 'Der Code sieht so aus: XXXX-XXXX-XXXX.'; render(location.hash.slice(1)); return; }
      p.cls = { code: code, name: '', nick: '', on: false }; touch(p);
      cid(code).then(function (id) { return B().api.doc('classes/' + id + '/e/meta').get(); }).then(function (s) { if (s.exists && s.data() && s.data().name) { p.cls.name = s.data().name; touch(p); } msg = ''; render(location.hash.slice(1)); }).catch(function () { msg = ''; render(location.hash.slice(1)); });
    } else if (kind === 'new') {
      var name = document.getElementById('klName').value.trim() || 'Meine Klasse', code2 = newCode();
      p.cls = { code: code2, name: name, nick: '', on: false }; touch(p);
      cid(code2).then(function (id) { return B().api.doc('classes/' + id + '/e/meta').set({ name: name, at: now() }); }).then(function () { msg = 'Klasse angelegt. Gib den Code an die anderen Eltern weiter.'; render(location.hash.slice(1)); }).catch(function () { msg = 'Die Klasse konnte nicht angelegt werden.'; render(location.hash.slice(1)); });
    } else if (kind === 'save') {
      var nick = document.getElementById('klNick').value.trim(), on = document.getElementById('klOn').checked;
      if (on && !nick) { msg = 'Bitte gib einen Namen ein, der in der Klasse stehen soll.'; render(location.hash.slice(1)); return; }
      p.cls.nick = nick; p.cls.on = on; touch(p);
      publish(p).then(function () { msg = on ? 'Gespeichert. Dein Profil wird in der Klasse gezeigt.' : 'Gespeichert. Dein Profil wird in der Klasse nicht gezeigt.'; render(location.hash.slice(1)); }).catch(function () { msg = 'Das hat nicht geklappt. Versuche es später noch einmal.'; render(location.hash.slice(1)); });
    }
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-kl="leave"]');
    if (!b || !app.contains(b)) return;
    var p = A.profile(); if (!p.cls) return;
    var old = p.cls; p.cls.on = false;
    publish(p).catch(function () { /* egal */ }).then(function () { p.cls = null; touch(p); msg = ''; render(location.hash.slice(1)); });
    void old;
  });

  A.registerPage('klasse', render);
})();
