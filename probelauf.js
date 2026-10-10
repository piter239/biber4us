/* Probelauf: wie der echte Biber-Wettbewerb, mit Zeitlimit.
   35 Minuten, 15 Aufgaben (5 einfach, 5 mittel, 5 schwer, aufsteigend sortiert), keine Rückmeldung während des Laufs,
   Aufgaben frei anspringbar, Antworten änderbar bis zum Abgeben oder bis die Zeit um ist. Am Ende gibt es Punkte
   (+6/−2, +9/−3, +12/−4, keine Antwort 0) und die Lösungen zum Nachschauen.
   Die Aufgaben werden zum Niveau des Profils passend gewählt (bevorzugt solche, die es noch nicht bearbeitet hat).
   Antworten auf Aufgaben, die das Profil noch nicht kannte, zählen wie ein erster Versuch auch für Niveau und Bewertung. */
(function () {
  'use strict';
  var A = window.BiberApp;
  if (!A) return;

  var MINUTES = 35;
  var N = 15;
  var PER_LEVEL = N / 3;
  var LEVELS = ['einfach', 'mittel', 'schwer'];
  function levelAt(i) { return LEVELS[Math.floor(i / PER_LEVEL)]; }
  function maxScore() { var m = 0; for (var i = 0; i < N; i++) m += A.SCORING[levelAt(i)].right; return m; }
  var app = A.app, esc = A.esc, pts = A.pts;
  var timerId = 0, liveSaid = {}, view = { kind: 'auto', rec: null }, mounted = null;

  function el(id) { return document.getElementById(id); }
  function mmss(sec) { sec = Math.max(0, Math.ceil(sec)); var m = Math.floor(sec / 60), s = sec % 60; return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }
  function fmtDate(iso) { try { return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return iso; } }
  function runOf() { var r = A.profile().run; return r && !r.done ? r : null; }
  function taskOf(id) { return A.tasks.filter(function (t) { return t.id === id; })[0]; }

  /* ---------- Aufgabenauswahl ---------- */
  function pickRun(p) {
    var A0 = A.abilityOf(p), lo = A0 - 7, hi = A0 + 6, MAXD = 37;
    if (hi > MAXD) { lo -= hi - MAXD; hi = MAXD; }
    if (lo < 1) { hi = Math.min(MAXD, hi + (1 - lo)); lo = 1; }
    var pool = A.tasks.filter(A.isReady), used = {}, ids = [], prevArea = '';
    for (var i = 0; i < N; i++) {
      var target = lo + (hi - lo) * i / (N - 1), best = null, bc = 1e9;
      pool.forEach(function (t) {
        if (used[t.id]) return;
        var c = Math.abs(A.taskD(t) - target) + (p.results[t.id] ? 3 : 0) + (A.areaOf(t) === prevArea ? 1.5 : 0) + Math.random() * 0.8;
        if (c < bc) { bc = c; best = t; }
      });
      used[best.id] = true; ids.push(best.id); prevArea = A.areaOf(best);
    }
    return ids;
  }

  function startRun() {
    var p = A.profile(), now = Date.now();
    p.run = { at: new Date(now).toISOString(), endAt: now + MINUTES * 60000, minutes: MINUTES, ids: pickRun(p), ans: {}, cur: 0, done: false };
    A.save();
    view = { kind: 'auto', rec: null };
    A.route();
  }

  /* ---------- Abschluss ---------- */
  function finish() {
    var p = A.profile(), r = p.run;
    if (!r || r.done) return;
    leaveTask();
    r.done = true;
    var usedSec = Math.max(0, Math.min(r.minutes * 60, Math.round((Math.min(Date.now(), r.endAt) - new Date(r.at).getTime()) / 1000)));
    var rec = { at: r.at, minutes: r.minutes, used: usedSec, n: r.ids.length, right: 0, wrong: 0, blank: 0, score: 0, max: maxScore(), tasks: [] };
    r.ids.forEach(function (id, i) {
      var lv = levelAt(i), a = r.ans[id], entry = { id: id, level: lv, correct: null, pts: 0 };
      if (a) {
        entry.correct = !!a.correct;
        entry.pts = A.SCORING[lv][a.correct ? 'right' : 'wrong'];
        if (a.correct) rec.right++; else rec.wrong++;
        A.recordResult(id, !!a.correct, a.answer);   /* zählt als erster Versuch, falls die Aufgabe noch unbekannt war */
      } else rec.blank++;
      rec.score += entry.pts;
      rec.tasks.push(entry);
    });
    p.runs = [rec].concat(p.runs || []).slice(0, 30);
    p.run = null;
    p.upd = new Date().toISOString();
    A.save();
    view = { kind: 'result', rec: rec, fresh: true };
    A.route();
  }

  /* ---------- Zeitgeber ---------- */
  function stopTimer() { if (timerId) { clearInterval(timerId); timerId = 0; } }
  function startTimer() {
    stopTimer();
    liveSaid = {};
    timerId = setInterval(tick, 250);
    tick();
  }
  function tick() {
    var r = runOf();
    if (!r) { stopTimer(); return; }
    var left = (r.endAt - Date.now()) / 1000;
    if (left <= 0) { stopTimer(); finish(); return; }
    var t = el('runTimer');
    if (t) {
      t.textContent = mmss(left);
      t.classList.toggle('warn', left <= 300);
      t.classList.toggle('alarm', left <= 60);
    }
    [600, 300, 60].forEach(function (s) {
      if (left <= s && !liveSaid[s]) {
        liveSaid[s] = true;
        var live = el('runLive');
        if (live && left > s - 5) live.textContent = 'Noch ' + (s / 60) + (s === 60 ? ' Minute' : ' Minuten') + '.';
      }
    });
  }

  /* ---------- Aufgabe im Lauf ---------- */
  function leaveTask() {
    mounted = null;   /* Antworten werden schon bei jeder Änderung gesichert */
  }

  function showTask(i) {
    var r = runOf();
    if (!r) return;
    leaveTask();
    r.cur = i;
    A.save();
    var id = r.ids[i], t = taskOf(id), mod = A.B.modules[id], lv = levelAt(i);
    var box = el('runTask');
    box.innerHTML =
      '<article class="task t-' + id + '" data-run-task>' +
      '<header class="task-head"><div class="chips"><span class="chip ' + lv + '">Aufgabe ' + (i + 1) + ' von ' + r.ids.length + ' · ' + lv + '</span>' +
      '<span class="chip">' + pts(A.SCORING[lv].right) + ' / ' + pts(A.SCORING[lv].wrong) + ' Punkte</span></div>' +
      '<h1>' + t.title + '</h1>' +
      '<div class="story">' + (mod.story || '') + '</div><h2 class="question">' + (mod.question || '') + '</h2>' +
      (mod.howto ? '<p class="howto">' + mod.howto + '</p>' : '') + '</header>' +
      '<div class="board-shell"><div class="board-mount" data-mount></div>' +
      '<div class="board-foot"><span class="status-line" role="status" id="runStatus"></span></div></div>' +
      '<nav class="task-nav run-nav"><button class="btn ghost" type="button" data-run="prev"' + (i === 0 ? ' disabled' : '') + '>← Zurück</button>' +
      '<button class="btn ghost" type="button" data-run="clear">Antwort löschen</button>' +
      (i < r.ids.length - 1 ? '<button class="btn" type="button" data-run="next">Weiter →</button>' : '<button class="btn" type="button" data-run="finish">Abgeben</button>') + '</nav></article>';
    var m = box.querySelector('[data-mount]');
    var ready = false;
    function status() {
      var s = el('runStatus'); if (!s) return;
      s.textContent = r.ans[id] ? 'Antwort gespeichert. Du kannst sie bis zum Abgeben ändern.' : 'Noch keine Antwort gespeichert.';
    }
    var api = {
      group: '5-6', level: lv,
      locked: function () { return false; },
      changed: function () {
        if (mounted !== id || !ready) return;
        var run = runOf(); if (!run) return;
        if (mod.isComplete()) { var res = mod.evaluate(); run.ans[id] = { answer: res.answer, correct: !!res.correct }; }
        else delete run.ans[id];
        A.save(); chips(); status();
      }
    };
    mounted = id;
    mod.mount(m, api);
    if (r.ans[id]) { try { mod.setAnswer(r.ans[id].answer); } catch (e) { /* ignorieren */ } }
    ready = true;
    status(); chips();
    window.scrollTo(0, 0);
  }

  function chips() {
    var r = runOf(), c = el('runChips');
    if (!r || !c) return;
    c.innerHTML = r.ids.map(function (id, i) {
      var cls = 'run-chip ' + levelAt(i) + (r.ans[id] ? ' done' : '') + (i === r.cur ? ' cur' : '');
      return '<button type="button" class="' + cls + '" data-run="go" data-i="' + i + '" aria-label="Aufgabe ' + (i + 1) + (r.ans[id] ? ', beantwortet' : ', offen') + (i === r.cur ? ', aktuell' : '') + '"' + (i === r.cur ? ' aria-current="true"' : '') + '>' + (i + 1) + '</button>';
    }).join('');
    var n = Object.keys(r.ans).length, s = el('runCount');
    if (s) s.textContent = n + ' von ' + r.ids.length + ' beantwortet';
  }

  function renderRun() {
    var r = runOf();
    app.innerHTML =
      '<div class="run-bar" role="region" aria-label="Probelauf"><div class="run-time"><span class="run-lbl">Zeit</span><span class="run-timer" id="runTimer" role="timer">' + mmss((r.endAt - Date.now()) / 1000) + '</span></div>' +
      '<div class="run-mid"><div class="run-chips" id="runChips"></div><span class="note" id="runCount"></span></div>' +
      '<div class="run-end" id="runEnd"><button class="btn ghost" type="button" data-run="ask">Abgeben</button></div></div>' +
      '<div class="visually-hidden" id="runLive" aria-live="polite"></div><div id="runTask"></div>';
    startTimer();
    showTask(Math.min(r.cur || 0, r.ids.length - 1));
  }

  /* ---------- Startseite und Ergebnis ---------- */
  function renderIntro() {
    var p = A.profile(), runs = p.runs || [], max = maxScore();
    var hist = runs.length ? '<section class="panel"><h2>Deine bisherigen Läufe</h2><div class="tbl-wrap"><table class="res"><thead><tr><th>Datum</th><th class="r">Punkte</th><th class="r">Richtig</th><th class="r">Zeit</th><th></th></tr></thead><tbody>' +
      runs.slice(0, 10).map(function (x, i) {
        return '<tr><td>' + fmtDate(x.at) + '</td><td class="r num">' + x.score + ' / ' + x.max + '</td><td class="r num">' + x.right + ' von ' + x.n + '</td><td class="r num">' + mmss(x.used) + '</td>' +
          '<td><button class="linkbtn" type="button" data-run="view" data-i="' + i + '">Ansehen</button></td></tr>';
      }).join('') + '</tbody></table></div></section>' : '';
    app.innerHTML =
      '<section class="intro"><p class="eyebrow">Wie beim echten Wettbewerb</p><h1>Probelauf</h1>' +
      '<p class="lead">' + MINUTES + ' Minuten, ' + N + ' Aufgaben: ' + PER_LEVEL + ' einfache, ' + PER_LEVEL + ' mittlere und ' + PER_LEVEL + ' schwere. Die Aufgaben passen zu deinem Niveau. Probier aus, wie weit du in der Zeit kommst.</p></section>' +
      '<section class="panel"><h2>So läuft es</h2><ul class="run-rules">' +
      '<li>Die Uhr läuft ab dem Start weiter, auch wenn du die Seite wechselst oder neu lädst.</li>' +
      '<li>Du kannst die Aufgaben in beliebiger Reihenfolge lösen und eine Antwort jederzeit ändern. Fertige Antworten werden gleich gespeichert.</li>' +
      '<li>Während des Laufs gibt es keine Rückmeldung. Nach dem Abgeben (oder wenn die Zeit um ist) siehst du deine Punkte und die Lösungen.</li>' +
      '<li>Punkte: einfach +6 / −2, mittel +9 / −3, schwer +12 / −4. Falsche Antworten kosten Punkte, keine Antwort kostet nichts. Höchstens ' + max + ' Punkte.</li>' +
      '<li>Das Kätzchen bleibt während des Laufs im Körbchen.</li></ul>' +
      '<div class="actions"><button class="btn" type="button" data-run="start">Probelauf starten</button><a class="btn ghost" href="#">Zurück zu den Aufgaben</a></div></section>' + hist;
  }

  function renderResult(rec, fresh) {
    var pct = rec.max ? Math.round(rec.score / rec.max * 100) : 0;
    var prev = (A.profile().runs || []).filter(function (x) { return x.at !== rec.at; })[0];
    var msg = pct >= 70 ? 'Starke Leistung!' : pct >= 40 ? 'Das ist schon ordentlich. Beim nächsten Mal geht noch mehr.' : 'Übung macht den Biber. Schau dir die Lösungen unten an.';
    var by = LEVELS.map(function (lv) {
      var xs = rec.tasks.filter(function (t) { return t.level === lv; });
      var rt = xs.filter(function (t) { return t.correct === true; }).length;
      return '<div class="stat"><span class="chip ' + lv + '">' + lv + '</span><b>' + rt + ' von ' + xs.length + ' richtig</b></div>';
    }).join('');
    var rows = rec.tasks.map(function (x, i) {
      var t = taskOf(x.id);
      var st = x.correct === true ? '<span class="chip ok">richtig</span>' : x.correct === false ? '<span class="chip bad">falsch</span>' : '<span class="chip soon">keine Antwort</span>';
      return '<tr><td class="num">' + (i + 1) + '</td><td><a href="#' + x.id + '">' + (t ? t.title : x.id) + '</a></td><td><span class="chip ' + x.level + '">' + x.level + '</span></td><td>' + st + '</td><td class="r num">' + pts(x.pts) + '</td></tr>';
    }).join('');
    app.innerHTML =
      '<p class="crumbs"><a href="#probelauf">← Probelauf</a></p>' +
      '<section class="intro"><p class="eyebrow">Probelauf vom ' + fmtDate(rec.at) + '</p><h1>' + rec.score + ' von ' + rec.max + ' Punkten</h1>' +
      '<p class="lead">' + rec.right + ' richtig, ' + rec.wrong + ' falsch, ' + rec.blank + ' ohne Antwort · Zeit: ' + mmss(rec.used) + ' von ' + mmss(rec.minutes * 60) + ' (' + pct + ' %). ' + msg + '</p>' +
      (prev ? '<p class="note">Letzter Lauf davor: ' + prev.score + ' Punkte.</p>' : '') + '</section>' +
      '<section class="panel"><div class="stats">' + by + '</div></section>' +
      '<section class="panel"><h2>Deine Aufgaben</h2><div class="tbl-wrap"><table class="res"><thead><tr><th>Nr.</th><th>Aufgabe</th><th>Stufe</th><th>Ergebnis</th><th class="r">Punkte</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="note">Ein Klick auf eine Aufgabe zeigt deine Antwort und die Erklärung (bei Aufgaben, die du nicht beantwortet hast, kannst du sie jetzt in Ruhe lösen).</p>' +
      '<div class="actions"><button class="btn" type="button" data-run="start">Noch ein Probelauf</button><a class="btn ghost" href="#">Zu den Aufgaben</a></div></section>';
    if (fresh && window.BiberKitten) {
      try { if (pct >= 50) window.BiberKitten.cheer('Das war ein toller Probelauf!'); else window.BiberKitten.comfort('Das nächste Mal schaffst Du mehr. Ich glaube an Dich!'); } catch (e) { /* ignorieren */ }
    }
  }

  /* ---------- Seite ---------- */
  function render() {
    var p = A.profile();
    if (p.run && !p.run.done && p.run.endAt <= Date.now()) { finish(); return; }
    if (runOf()) { renderRun(); return; }
    stopTimer();
    if (view.kind === 'result' && view.rec) { var f = view.fresh; view.fresh = false; renderResult(view.rec, f); return; }
    renderIntro();
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-run]');
    if (!b || !app.contains(b)) return;
    var a = b.dataset.run, r = runOf();
    if (a === 'start') startRun();
    else if (a === 'view') { var rec = (A.profile().runs || [])[+b.dataset.i]; if (rec) { view = { kind: 'result', rec: rec, fresh: false }; A.route(); } }
    else if (!r) return;
    else if (a === 'go') showTask(+b.dataset.i);
    else if (a === 'prev') showTask(Math.max(0, r.cur - 1));
    else if (a === 'next') showTask(Math.min(r.ids.length - 1, r.cur + 1));
    else if (a === 'clear') {
      var id = r.ids[r.cur], mod = A.B.modules[id];
      mod.reset(); delete r.ans[id]; A.save(); chips();
      var s = el('runStatus'); if (s) s.textContent = 'Noch keine Antwort gespeichert.';
    } else if (a === 'ask' || a === 'finish') {
      var left = r.ids.length - Object.keys(r.ans).length;
      var end = el('runEnd');
      end.innerHTML = '<span class="note">' + (left ? left + ' ohne Antwort. ' : '') + 'Wirklich abgeben?</span> <button class="btn danger" type="button" data-run="yes">Ja, abgeben</button> <button class="btn ghost" type="button" data-run="no">Weiter üben</button>';
      end.querySelector('[data-run="yes"]').focus();
    } else if (a === 'no') {
      el('runEnd').innerHTML = '<button class="btn ghost" type="button" data-run="ask">Abgeben</button>';
    } else if (a === 'yes') finish();
  });

  /* Kätzchen ruht während des Laufs; Navigationslink zeigt, dass ein Lauf läuft */
  document.addEventListener('biber:render', function () {
    var on = !!runOf() && (location.hash || '') === '#probelauf';
    if (window.BiberKitten && window.BiberKitten.pause) window.BiberKitten.pause(on);
    var link = document.querySelector('[data-nav="probelauf"]');
    if (link) link.textContent = runOf() ? 'Probelauf läuft' : 'Probelauf';
    if (!on) stopTimer();
    var p = A.profile();
    if (p.run && !p.run.done && p.run.endAt <= Date.now() && (location.hash || '') !== '#probelauf') finish();
  });

  A.registerPage('probelauf', render);
  if ((location.hash || '') === '#probelauf') A.route();
})();
