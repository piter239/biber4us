/* Probelauf: wie der echte Biber-Wettbewerb, mit Zeitlimit.
   Aufbau wie in den Heften (Seite "Der Wettbewerb"): Klasse 3-4: 9 Aufgaben in 30 Minuten, Klasse 5-6: 12 Aufgaben in 35 Minuten,
   Klasse 7-13: 15 Aufgaben in 40 Minuten, jeweils gleich viele einfache, mittlere und schwere (aufsteigend sortiert),
   keine Rückmeldung während des Laufs,
   Aufgaben frei anspringbar, Antworten änderbar bis zum Abgeben oder bis die Zeit um ist. Am Ende gibt es Punkte
   (+6/−2, +9/−3, +12/−4, keine Antwort 0) und die Lösungen zum Nachschauen.
   Die Aufgaben werden zum Niveau des Profils passend gewählt (bevorzugt solche, die es noch nicht bearbeitet hat).
   Alternativ "wie im Wettbewerb": je 5 einfache, mittlere und schwere Aufgaben, die im Heft für die gewählte Klassenstufe so eingestuft sind
   (z. B. Klasse 9–10); Dauer 35, 40 oder 45 Minuten.
   Antworten auf Aufgaben, die das Profil noch nicht kannte, zählen wie ein erster Versuch auch für Niveau und Bewertung. */
(function () {
  'use strict';
  var A = window.BiberApp;
  if (!A) return;

  var STRUCT = { '3-4': { n: 9, min: 30 }, '5-6': { n: 12, min: 35 }, '7-8': { n: 15, min: 40 }, '9-10': { n: 15, min: 40 }, '11-13': { n: 15, min: 40 } };
  var LEVELS = ['einfach', 'mittel', 'schwer'];
  function levelAt(i, n) { return LEVELS[Math.min(2, Math.floor(i / ((n || 15) / 3)))]; }
  function maxScore(n) { var m = 0; for (var i = 0; i < n; i++) m += A.SCORING[levelAt(i, n)].right; return m; }
  var app = A.app, esc = A.esc, pts = A.pts;
  var timerId = 0, liveSaid = {}, view = { kind: 'auto', rec: null }, mounted = null;

  function el(id) { return document.getElementById(id); }
  function mmss(sec) { sec = Math.max(0, Math.ceil(sec)); var m = Math.floor(sec / 60), s = sec % 60; return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }
  function fmtDate(iso) { try { return new Date(iso).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return iso; } }
  function runOf() { var r = A.profile().run; return r && !r.done ? r : null; }
  function taskOf(id) { return A.lookup(id); }
  function isHold(id) { return !!A.holdById(id); }

  /* ---------- Aufgabenauswahl ---------- */
  function pickRun(p, N, g) {
    var A0 = A.abilityOf(p), lo = A0 - 7, hi = A0 + 6, MAXD = 37;
    if (hi > MAXD) { lo -= hi - MAXD; hi = MAXD; }
    if (lo < 1) { hi = Math.min(MAXD, hi + (1 - lo)); lo = 1; }
    var hp = A.holdOf(p);
    /* zurückgehaltene Testaufgaben (nur für Klassenstufen, für die das Heft sie einordnet) kommen bevorzugt, solange sie unbekannt sind */
    var pool = A.tasks.filter(A.isReady).concat(A.hold.filter(function (t) { return A.isReady(t) && t.groups && t.groups[g]; })), used = {}, ids = [], prevArea = '';
    for (var i = 0; i < N; i++) {
      var target = lo + (hi - lo) * i / (N - 1), best = null, bc = 1e9;
      pool.forEach(function (t) {
        if (used[t.id]) return;
        var seen = t.holdout ? !!hp[t.id] : !!p.results[t.id];
        var c = Math.abs(A.taskD(t) - target) + (seen ? 3 : 0) + (t.holdout && !seen ? -2 : 0) + (A.areaOf(t) === prevArea ? 1.5 : 0) + Math.random() * 0.8;
        if (c < bc) { bc = c; best = t; }
      });
      used[best.id] = true; ids.push(best.id); prevArea = A.areaOf(best);
    }
    return ids;
  }

  /* Wettbewerbs-Lauf: je PER_LEVEL Aufgaben pro Stufe, so wie das Heft sie für die Klassenstufe einordnet. Unbekannte Aufgaben zuerst,
     gleichmäßig über die Schwierigkeit der Stufe verteilt, innerhalb der Stufe nach Schwierigkeit sortiert. */
  /* k Aufgaben aus der nach Schwierigkeit sortierten Liste, gleichmäßig verteilt (mit etwas Zufall) */
  function spread(list, k) {
    var out = [], used = {};
    if (list.length <= k) return list.slice();
    for (var j = 0; j < k; j++) {
      var pos = Math.round((j + 0.5) * list.length / k - 0.5 + (Math.random() - 0.5) * list.length / k * 0.8);
      pos = Math.max(0, Math.min(list.length - 1, pos));
      while (used[pos]) pos = (pos + 1) % list.length;
      used[pos] = true; out.push(list[pos]);
    }
    return out;
  }
  function pickClassRun(p, g, N) {
    var PER_LEVEL = N / 3, hp = A.holdOf(p), ids = [];
    var pool = A.tasks.concat(A.hold).filter(function (t) { return A.isReady(t) && t.groups && t.groups[g]; });
    LEVELS.forEach(function (lv) {
      var cand = pool.filter(function (t) { return t.groups[g] === lv; }).sort(function (a, b) { return A.taskD(a) - A.taskD(b); });
      function isSeen(t) { return t.holdout ? !!hp[t.id] : !!p.results[t.id]; }
      var freshHold = cand.filter(function (t) { return t.holdout && !isSeen(t); });
      var freshReg = cand.filter(function (t) { return !t.holdout && !isSeen(t); });
      var seen = cand.filter(isSeen).sort(function () { return Math.random() - 0.5; });
      /* zuerst unbekannte Testaufgaben, dann unbekannte aus dem Training, zuletzt bekannte */
      var chosen = spread(freshHold, PER_LEVEL);
      if (chosen.length < PER_LEVEL) chosen = chosen.concat(spread(freshReg, PER_LEVEL - chosen.length));
      if (chosen.length < PER_LEVEL) chosen = chosen.concat(seen.slice(0, PER_LEVEL - chosen.length));
      chosen.sort(function (a, b) { return A.taskD(a) - A.taskD(b); });
      chosen.forEach(function (t) { ids.push(t.id); });
    });
    return ids;
  }

  var GROUPS = ['3-4', '5-6', '7-8', '9-10', '11-13'];
  var EXTRA = [0, 5, 10];
  function opts() {
    var p = A.profile(), o = p.runOpt || {};
    return { mode: o.mode === 'klasse' ? 'klasse' : 'niveau', group: GROUPS.indexOf(o.group) >= 0 ? o.group : (GROUPS.indexOf(A.store.group) >= 0 ? A.store.group : '5-6'), extra: EXTRA.indexOf(+o.extra) >= 0 ? +o.extra : 0, timed: o.timed !== false };
  }
  function readOpts() {
    var p = A.profile(), m = document.querySelector('input[name="rmode"]:checked'), g = el('rGroup'), x = el('rExtra'), tm = el('rTimed');
    if (m || g || x) { p.runOpt = { mode: m ? m.value : 'niveau', group: g ? g.value : opts().group, extra: x ? +x.value : 0, timed: tm ? !!tm.checked : opts().timed }; }
    return opts();
  }
  /* Anzeige in der Auswahl: Aufgabenzahl, Zeit und Höchstpunktzahl der gewählten Klassenstufe */
  function refreshOpt() {
    var g = el('rGroup'), x = el('rExtra'); if (!g || !x) return;
    var st = STRUCT[g.value], keep = +x.value;
    x.innerHTML = EXTRA.map(function (e) { return '<option value="' + e + '"' + (e === keep ? ' selected' : '') + '>' + (st.min + e) + (e === 0 ? ' (wie im Wettbewerb)' : '') + '</option>'; }).join('');
    var tm = el('rTimed'), timed = !tm || tm.checked;
    x.disabled = !timed;
    var info = el('rInfo'); if (info) info.textContent = st.n + ' Aufgaben, je ' + (st.n / 3) + ' einfache, mittlere und schwere. Im Wettbewerb gibt es dafür ' + st.min + ' Minuten und höchstens ' + maxScore(st.n) + ' Punkte.';
    var mx = el('rMax'); if (mx) mx.textContent = maxScore(st.n);
  }
  document.addEventListener('change', function (e) { if (e.target && (e.target.id === 'rGroup' || e.target.id === 'rTimed')) { refreshOpt(); var lead = el('rTimedNote'); if (lead && e.target.id === 'rTimed') lead.textContent = e.target.checked ? 'Die Uhr läuft, und nach Ablauf der Zeit wird automatisch abgegeben.' : 'Keine Uhr, kein Zeitlimit. Du gibst selbst ab, wenn du fertig bist. Deine Zeit wird trotzdem gemessen (für uns, nicht zum Zeigen).'; } });

  function startRun() {
    var p = A.profile(), now = Date.now(), o = readOpts(), st = STRUCT[o.group], minutes = st.min + o.extra;
    var ids = o.mode === 'klasse' ? pickClassRun(p, o.group, st.n) : pickRun(p, st.n, o.group);
    p.run = { at: new Date(now).toISOString(), endAt: o.timed ? now + minutes * 60000 : 0, timed: o.timed, sp: {}, minutes: minutes, A0: Math.round(A.abilityOf(p) * 100) / 100, ids: ids, ans: {}, cur: 0, done: false, kind: o.mode, group: o.group };
    A.save();
    A.track('r.start', p.run.ids.join(','), minutes, o.mode, o.group, o.timed ? 1 : 0);
    view = { kind: 'auto', rec: null };
    A.route();
  }

  /* ---------- Abschluss ---------- */
  function finish() {
    var p = A.profile(), r = p.run;
    if (!r || r.done) return;
    leaveTask();
    r.done = true;
    var timed = r.timed !== false;
    var usedSec = timed ? Math.max(0, Math.min(r.minutes * 60, Math.round((Math.min(Date.now(), r.endAt) - new Date(r.at).getTime()) / 1000))) : Math.max(0, Math.round((Date.now() - new Date(r.at).getTime()) / 1000));
    var actSec = Object.keys(r.sp || {}).reduce(function (a, k) { return a + (r.sp[k] || 0); }, 0);
    var rec = { at: r.at, minutes: r.minutes, timed: timed, act: actSec, kind: r.kind || 'niveau', group: r.group || '', used: usedSec, n: r.ids.length, right: 0, wrong: 0, blank: 0, score: 0, max: maxScore(r.ids.length), tasks: [] };
    r.ids.forEach(function (id, i) {
      var lv = levelAt(i, r.ids.length), a = r.ans[id], entry = { id: id, level: lv, correct: null, pts: 0, secs: Math.round((r.sp || {})[id] || 0) };
      if (a) {
        entry.correct = !!a.correct;
        entry.pts = A.SCORING[lv][a.correct ? 'right' : 'wrong'];
        if (a.correct) rec.right++; else rec.wrong++;
        if (isHold(id)) {   /* Testaufgabe: nur Validierung, kein Einfluss auf das Niveau */
          var pr = A.expectedP(r.A0 != null ? r.A0 : A.abilityOf(p), A.taskD(taskOf(id)));
          entry.hold = true; entry.pr = Math.round(pr * 1000) / 1000;
          entry.first = A.recordHold(id, !!a.correct, a.answer, { p: entry.pr, A0: r.A0, lv: lv, run: r.at });
        } else A.recordResult(id, !!a.correct, a.answer);   /* zählt als erster Versuch, falls die Aufgabe noch unbekannt war */
      } else {
        rec.blank++;
        if (isHold(id)) { entry.hold = true; A.recordHold(id, null, null, { lv: lv, run: r.at }); }
      }
      rec.score += entry.pts;
      rec.tasks.push(entry);
    });
    A.track('r.fin', rec.score, rec.right, rec.wrong, rec.blank, rec.used, timed ? 1 : 0, rec.act);
    var hs = A.holdStats(p, r.at);
    if (hs.n) A.track('r.val', hs.n, hs.right, Math.round(hs.exp * 100) / 100, Math.round(hs.brier * 1000) / 1000);
    try { document.dispatchEvent(new CustomEvent('biber:run', { detail: { score: rec.score } })); } catch (e) { /* ignorieren */ }
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
    if (r.timed === false) return;   /* ohne Zeitkontrolle: keine Uhr, kein Limit */
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
  var stint = { id: '', t0: 0 };
  /* Zeit je Aufgabe messen (ohne Zeit, in der die Seite im Hintergrund war); höchstens 20 Minuten pro Besuch einer Aufgabe */
  function closeStint() {
    if (!stint.id) return;
    var r = runOf(), secs = Math.min(1200, Math.round((Date.now() - stint.t0) / 1000));
    if (r && secs > 0) { r.sp = r.sp || {}; r.sp[stint.id] = (r.sp[stint.id] || 0) + secs; A.track('r.tm', stint.id, secs); A.save(); }
    stint = { id: '', t0: 0 };
  }
  document.addEventListener('visibilitychange', function () {
    var r = runOf();
    if (document.hidden) closeStint();
    else if (r && mounted) stint = { id: mounted, t0: Date.now() };
  });
  function leaveTask() {
    closeStint();
    mounted = null;   /* Antworten werden schon bei jeder Änderung gesichert */
  }

  function showTask(i) {
    var r = runOf();
    if (!r) return;
    leaveTask();
    r.cur = i;
    A.save();
    A.track('r.go', i + 1, r.ids[i]);
    var id = r.ids[i], t = taskOf(id), mod = A.B.modules[id], lv = levelAt(i, r.ids.length);
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
        if (mod.isComplete()) { var res = mod.evaluate(); run.ans[id] = { answer: res.answer, correct: !!res.correct }; A.track('r.ans', id, res.correct ? 1 : 0); }
        else { delete run.ans[id]; A.track('r.ans', id, 'x'); }
        A.save(); chips(); status();
      }
    };
    mounted = id;
    stint = { id: id, t0: Date.now() };
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
      var cls = 'run-chip ' + levelAt(i, r.ids.length) + (r.ans[id] ? ' done' : '') + (i === r.cur ? ' cur' : '');
      return '<button type="button" class="' + cls + '" data-run="go" data-i="' + i + '" aria-label="Aufgabe ' + (i + 1) + (r.ans[id] ? ', beantwortet' : ', offen') + (i === r.cur ? ', aktuell' : '') + '"' + (i === r.cur ? ' aria-current="true"' : '') + '>' + (i + 1) + '</button>';
    }).join('');
    var n = Object.keys(r.ans).length, s = el('runCount');
    if (s) s.textContent = n + ' von ' + r.ids.length + ' beantwortet';
  }

  function renderRun() {
    var r = runOf();
    app.innerHTML =
      '<div class="run-bar" role="region" aria-label="Probelauf">' + (r.timed === false ? '<div class="run-time"><span class="run-lbl">Ohne Zeitkontrolle</span></div>' : '<div class="run-time"><span class="run-lbl">Zeit</span><span class="run-timer" id="runTimer" role="timer">' + mmss((r.endAt - Date.now()) / 1000) + '</span></div>') +
      '<div class="run-mid"><div class="run-chips" id="runChips"></div><span class="note" id="runCount"></span></div>' +
      '<div class="run-end" id="runEnd"><button class="btn ghost" type="button" data-run="ask">Abgeben</button></div></div>' +
      '<div class="visually-hidden" id="runLive" aria-live="polite"></div><div id="runTask"></div>';
    startTimer();
    showTask(Math.min(r.cur || 0, r.ids.length - 1));
  }

  /* ---------- Startseite und Ergebnis ---------- */
  function renderIntro() {
    var p = A.profile(), runs = p.runs || [], o0 = opts(), max = maxScore(STRUCT[o0.group].n);
    var hist = runs.length ? '<section class="panel"><h2>Deine bisherigen Läufe</h2><div class="tbl-wrap"><table class="res"><thead><tr><th>Datum</th><th class="r">Punkte</th><th class="r">Richtig</th><th class="r">Zeit</th><th></th></tr></thead><tbody>' +
      runs.slice(0, 10).map(function (x, i) {
        return '<tr><td>' + fmtDate(x.at) + '</td><td class="r num">' + x.score + ' / ' + x.max + '</td><td class="r num">' + x.right + ' von ' + x.n + '</td><td class="r num">' + mmss(x.used) + (x.timed === false ? ' <span class="note">(ohne Limit)</span>' : '') + '</td>' +
          '<td><button class="linkbtn" type="button" data-run="view" data-i="' + i + '">Ansehen</button></td></tr>';
      }).join('') + '</tbody></table></div></section>' : '';
    var o = opts(), st0 = STRUCT[o.group];
    var optHtml = '<fieldset class="run-opt"><legend>Dein Probelauf</legend>' +
      '<label>Klassenstufe <select id="rGroup" aria-label="Klassenstufe">' + GROUPS.map(function (g) { return '<option value="' + g + '"' + (g === o.group ? ' selected' : '') + '>' + g.replace('-', '–') + '</option>'; }).join('') + '</select></label>' +
      '<p class="note" id="rInfo"></p>' +
      '<label><input type="radio" name="rmode" value="niveau"' + (o.mode === 'niveau' ? ' checked' : '') + '> Aufgaben passend zu meinem Niveau</label>' +
      '<label><input type="radio" name="rmode" value="klasse"' + (o.mode === 'klasse' ? ' checked' : '') + '> Aufgaben so, wie das Heft sie für diese Klassenstufe einordnet</label>' +
      '<label class="run-timed"><input type="checkbox" id="rTimed" role="switch"' + (o.timed ? ' checked' : '') + '> Zeitkontrolle</label>' +
      '<p class="note" id="rTimedNote">' + (o.timed ? 'Die Uhr läuft, und nach Ablauf der Zeit wird automatisch abgegeben.' : 'Keine Uhr, kein Zeitlimit. Du gibst selbst ab, wenn du fertig bist. Deine Zeit wird trotzdem gemessen (für uns, nicht zum Zeigen).') + '</p>' +
      '<label>Zeit <select id="rExtra" aria-label="Dauer in Minuten">' + EXTRA.map(function (e) { return '<option value="' + e + '"' + (e === o.extra ? ' selected' : '') + '>' + (st0.min + e) + (e === 0 ? ' (wie im Wettbewerb)' : '') + '</option>'; }).join('') + '</select> Minuten</label></fieldset>';
    app.innerHTML =
      '<section class="intro"><p class="eyebrow">Wie beim echten Wettbewerb</p><h1>Probelauf</h1>' +
      '<p class="lead">Wie im echten Wettbewerb: gleich viele einfache, mittlere und schwere Aufgaben, aufsteigend sortiert. Wenn du magst, mit Zeitkontrolle: Probier aus, wie weit du in der Zeit kommst. Ohne Zeitkontrolle löst du in Ruhe und gibst selbst ab.'+'</p></section>' +
      '<section class="panel"><h2>So läuft es</h2><ul class="run-rules">' +
      '<li>Mit Zeitkontrolle läuft die Uhr ab dem Start weiter, auch wenn du die Seite wechselst oder neu lädst. Ohne Zeitkontrolle gibt es keine Uhr und kein Limit.</li>' +
      '<li>Du kannst die Aufgaben in beliebiger Reihenfolge lösen und eine Antwort jederzeit ändern. Fertige Antworten werden gleich gespeichert.</li>' +
      '<li>Während des Laufs gibt es keine Rückmeldung. Nach dem Abgeben (oder bei Zeitkontrolle: wenn die Zeit um ist) siehst du deine Punkte und die Lösungen.</li>' +
      '<li>Punkte: einfach +6 / −2, mittel +9 / −3, schwer +12 / −4. Falsche Antworten kosten Punkte, keine Antwort kostet nichts. Höchstens <span id="rMax">' + max + '</span> Punkte.</li>' +
      '<li>Das Kätzchen bleibt während des Laufs im Körbchen.</li></ul>' +
      optHtml + '<div class="actions"><button class="btn" type="button" data-run="start">Probelauf starten</button><a class="btn ghost" href="#">Zurück zu den Aufgaben</a></div></section>' + hist;
    refreshOpt();
  }

  function de1(x) { return (Math.round(x * 10) / 10).toString().replace('.', ','); }
  /* Validierung: Testaufgaben kommen nie im Training vor. Das Niveau-Modell hat vor dem Lauf für jede eine Erfolgswahrscheinlichkeit geschätzt. */
  function validationPanel(rec) {
    var xs = (rec.tasks || []).filter(function (t) { return t.hold && t.first && t.pr != null && t.correct !== null; });
    if (!xs.length) return '';
    var exp = 0, right = 0;
    xs.forEach(function (t) { exp += t.pr; if (t.correct) right++; });
    var tot = A.holdStats(A.profile());
    var rows = xs.map(function (t) {
      var tk = taskOf(t.id);
      return '<tr><td>' + esc(tk ? tk.title : t.id) + '</td><td><span class="chip ' + t.level + '">' + t.level + '</span></td><td class="r num">' + Math.round(t.pr * 100) + ' %</td><td>' + (t.correct ? '<span class="chip ok">richtig</span>' : '<span class="chip bad">falsch</span>') + '</td></tr>';
    }).join('');
    return '<section class="panel"><h2>Testaufgaben: Stimmt die Vorhersage?</h2>' +
      '<p>' + xs.length + (xs.length === 1 ? ' Aufgabe' : ' Aufgaben') + ' dieses Laufs kommen sonst nirgends auf der Seite vor und fließen nicht ins Biber-Niveau ein. Vor dem Lauf hat das Niveau-Modell ' + de1(exp) + ' richtige Antworten erwartet, geschafft hast Du ' + right + '.' +
      (tot.n > xs.length ? ' Über alle Läufe: ' + tot.right + ' von ' + tot.n + ' richtig, erwartet ' + de1(tot.exp) + '.' : '') + '</p>' +
      '<div class="tbl-wrap"><table class="res"><thead><tr><th>Aufgabe</th><th>Stufe</th><th class="r">Erwartet</th><th>Ergebnis</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="note">Die Zahl ist die Wahrscheinlichkeit, mit der das Modell eine richtige Antwort erwartet hat. Je öfter sie im Mittel zum Ergebnis passt, desto besser trifft das Niveau Deine Stärke.</p></section>';
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
      return '<tr><td class="num">' + (i + 1) + '</td><td><a href="#' + x.id + '">' + (t ? t.title : x.id) + '</a>' + (x.hold ? ' <span class="chip soon" title="Zurückgehaltene Testaufgabe, die nur im Probelauf vorkommt">Testaufgabe</span>' : '') + '</td><td><span class="chip ' + x.level + '">' + x.level + '</span></td><td>' + st + '</td><td class="r num">' + (x.secs ? mmss(x.secs) : '–') + '</td><td class="r num">' + pts(x.pts) + '</td></tr>';
    }).join('');
    app.innerHTML =
      '<p class="crumbs"><a href="#probelauf">← Probelauf</a></p>' +
      '<section class="intro"><p class="eyebrow">Probelauf vom ' + fmtDate(rec.at) + '</p><h1>' + rec.score + ' von ' + rec.max + ' Punkten</h1>' +
      '<p class="lead">' + (rec.kind === 'klasse' ? 'Wettbewerbs-Probelauf Klasse ' + esc(rec.group.replace('-', '–')) + '. ' : '') + rec.right + ' richtig, ' + rec.wrong + ' falsch, ' + rec.blank + ' ohne Antwort · ' + (rec.timed === false ? 'Zeit: ' + mmss(rec.used) + ' (ohne Zeitkontrolle)' : 'Zeit: ' + mmss(rec.used) + ' von ' + mmss(rec.minutes * 60)) + ' (' + pct + ' %). ' + msg + '</p>' + (rec.timed === false ? '<p class="note">Ohne Zeitlimit gelöst. Die Punkte lassen sich nicht direkt mit Läufen mit Uhr vergleichen.</p>' : '') +
      (prev ? '<p class="note">Letzter Lauf davor: ' + prev.score + ' Punkte.</p>' : '') + '</section>' +
      '<section class="panel"><div class="stats">' + by + '</div></section>' + validationPanel(rec) +
      '<section class="panel"><h2>Deine Aufgaben</h2><div class="tbl-wrap"><table class="res"><thead><tr><th>Nr.</th><th>Aufgabe</th><th>Stufe</th><th>Ergebnis</th><th class="r">Zeit</th><th class="r">Punkte</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="note">Ein Klick auf eine Aufgabe zeigt deine Antwort und die Erklärung (bei Aufgaben, die du nicht beantwortet hast, kannst du sie jetzt in Ruhe lösen).</p>' +
      '<div class="actions"><button class="btn" type="button" data-run="start">Noch ein Probelauf</button><a class="btn ghost" href="#">Zu den Aufgaben</a></div></section>';
    if (fresh && window.BiberKitten) {
      try { if (pct >= 50) window.BiberKitten.cheer('Das war ein toller Probelauf!'); else window.BiberKitten.comfort('Das nächste Mal schaffst Du mehr. Ich glaube an Dich!'); } catch (e) { /* ignorieren */ }
    }
  }

  /* ---------- Seite ---------- */
  function render() {
    var p = A.profile();
    if (p.run && !p.run.done && p.run.timed !== false && p.run.endAt <= Date.now()) { finish(); return; }
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
    if (p.run && !p.run.done && p.run.timed !== false && p.run.endAt <= Date.now() && (location.hash || '') !== '#probelauf') finish();
  });

  /* Einzelansicht einer Testaufgabe: erst nach einem Probelauf mit ihr, nur zum Nachschauen und Üben (ohne Wertung) */
  function renderHoldTask(id) {
    var t = A.holdById(id), mod = A.B.modules[id], r = A.holdOf(A.profile())[id];
    if (!t) { A.route(); return; }
    if (!r || !mod) {
      app.innerHTML = '<p class="crumbs"><a href="#probelauf">← Probelauf</a></p><section class="intro"><h1>' + esc(t.title) + '</h1>' +
        '<div class="feedback info"><h2>Testaufgabe</h2><p>' + (mod ? 'Diese Aufgabe gehört zu den Aufgaben, die nur im Probelauf vorkommen. Du siehst sie erst nach einem Probelauf, in dem sie vorkam.' : 'Diese Aufgabe ist noch nicht umgesetzt.') + '</p>' +
        '<div class="actions"><a class="btn" href="#probelauf">Zum Probelauf</a></div></div></section>';
      return;
    }
    A.track('hv', id);
    var lv = (r.lv || t.groups['5-6'] || Object.keys(t.groups).map(function (k) { return t.groups[k]; })[0]);
    app.innerHTML =
      '<p class="crumbs"><a href="#probelauf">← Probelauf</a></p>' +
      '<article class="task t-' + id + '"><header class="task-head"><div class="chips"><span class="chip ' + lv + '">' + lv + '</span><span class="chip">Heft ' + t.year + ', S. ' + t.page + '</span><span class="chip soon">Testaufgabe (nur im Probelauf)</span></div>' +
      '<h1>' + esc(t.title) + '</h1><p class="eyebrow">' + esc(t.topic) + '</p>' +
      '<div class="story">' + (mod.story || '') + '</div><h2 class="question">' + (mod.question || '') + '</h2>' + (mod.howto ? '<p class="howto">' + mod.howto + '</p>' : '') + '</header>' +
      '<div class="board-shell"><div class="board-mount" data-mount></div><div class="board-foot"><span class="status-line" role="status" data-status></span><div class="actions" data-bar></div></div></div>' +
      '<div data-feedback></div><nav class="task-nav"><a class="btn ghost" href="#probelauf">Probelauf</a></nav></article>';
    var el2 = app.querySelector('[data-mount]'), bar = app.querySelector('[data-bar]'), fb = app.querySelector('[data-feedback]'), stt = app.querySelector('[data-status]');
    var st = { checked: false };
    function expl() { return typeof mod.explanation === 'function' ? mod.explanation() : (mod.explanation || ''); }
    function feedback(correct, solution) {
      fb.innerHTML = '<div class="feedback ' + (solution ? 'info' : correct ? 'ok' : 'bad') + '"><h2>' + (solution ? 'So geht es' : correct ? 'Richtig!' : 'Nicht ganz.') + '</h2>' +
        (r.correct === null && !solution ? '<p class="note">Das war ein Übungsversuch, er zählt nicht.</p>' : '') +
        '<div class="expl">' + expl() + '</div><div class="actions">' +
        (!correct && !solution ? '<button class="btn ghost" type="button" data-hold="solution">Lösung zeigen</button>' : '') +
        '<button class="btn ghost" type="button" data-hold="retry">Noch einmal üben</button></div></div>';
    }
    function refresh() {
      if (st.checked) { stt.textContent = ''; bar.innerHTML = ''; return; }
      var ok = !!mod.isComplete();
      stt.textContent = ok ? 'Bereit zum Prüfen.' : 'Löse die Aufgabe, dann kannst Du prüfen.';
      bar.innerHTML = '<button class="btn ghost" type="button" data-hold="reset">Zurücksetzen</button><button class="btn" type="button" data-hold="check"' + (ok ? '' : ' disabled') + '>Antwort prüfen</button>';
    }
    mod.mount(el2, { group: '5-6', level: lv, locked: function () { return false; }, changed: function () { if (!st.checked) refresh(); } });
    if (r.correct !== null && r.answer !== undefined) {
      try { mod.setAnswer(r.answer); } catch (e) { /* ignorieren */ }
      mod.lock(true); st.checked = true; refresh(); feedback(!!r.correct, false);
    } else refresh();
    app.querySelector('.task').addEventListener('click', function (e) {
      var b = e.target.closest('[data-hold]'); if (!b) return;
      var a = b.dataset.hold;
      if (a === 'check') { if (!mod.isComplete()) return; var res = mod.evaluate(); mod.lock(true); st.checked = true; refresh(); feedback(!!res.correct, false); }
      else if (a === 'reset' || a === 'retry') { mod.reset(); mod.lock(false); st.checked = false; fb.innerHTML = ''; refresh(); }
      else if (a === 'solution') { mod.showSolution(); mod.lock(true); feedback(true, true); }
    });
  }

  A.registerPage('hold', renderHoldTask);
  A.registerPage('probelauf', render);
  if ((location.hash || '') === '#probelauf') A.route();
})();
