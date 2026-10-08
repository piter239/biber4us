(function () {
  'use strict';

  var TASKS = window.BIBER_TASKS;
  var SCORING = window.BIBER_SCORING;
  var B = window.Biber;
  var GROUPS = ['3-4', '5-6', '7-8', '9-10', '11-13'];
  var LEVEL_RANK = { einfach: 0, mittel: 1, schwer: 2 };
  var STORE_KEY = 'biber2025.v4';
  var app = document.getElementById('app');

  /* ---------- Speicher (localStorage) ----------
     Profile (z. B. zwei Geschwister auf einem Gerät): jedes Profil hat Name, Klasse und eigene Ergebnisse.
     Ergebnisse gelten pro Aufgabe (erster Versuch). mode: 'alle' (alle Aufgaben) oder 'stufe' (Filter nach Klassenstufe). */
  function classToGroup(k) { return k <= 4 ? '3-4' : k <= 6 ? '5-6' : k <= 8 ? '7-8' : k <= 10 ? '9-10' : '11-13'; }
  function newProfile(name, klasse, legacy) {
    return { id: 'p' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36), name: name, klasse: klasse, results: {}, legacy: !!legacy, created: new Date().toISOString() };
  }
  var store = null;
  try {
    var raw = window.localStorage.getItem(STORE_KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.profiles && parsed.profiles.length) store = parsed;
    }
    if (!store) {
      var v3 = window.localStorage.getItem('biber2025.v3');
      var p0 = newProfile('', 6, true);
      p0.setup = true;
      var mode0 = 'alle';
      if (v3) {
        var o3 = JSON.parse(v3);
        p0.results = (o3 && o3.results) || {};
        if (o3 && (o3.mode === 'alle' || o3.mode === 'stufe')) mode0 = o3.mode;
      }
      store = { mode: mode0, group: '5-6', current: p0.id, profiles: [p0] };
    }
  } catch (e) { /* ohne Speicher weiterarbeiten */ }
  if (!store) {
    var p1 = newProfile('', 6, true);
    p1.setup = true;
    store = { mode: 'alle', group: '5-6', current: p1.id, profiles: [p1] };
  }
  if (store.mode !== 'alle' && store.mode !== 'stufe') store.mode = 'alle';
  function profile() {
    for (var i = 0; i < store.profiles.length; i++) if (store.profiles[i].id === store.current) return store.profiles[i];
    return store.profiles[0];
  }
  Object.defineProperty(store, 'results', { get: function () { return profile().results; }, enumerable: false });
  if (GROUPS.indexOf(store.group) < 0) store.group = '5-6';
  function save() {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* ignorieren */ }
    if (window.BiberSync) window.BiberSync.schedule();
  }
  /* Das Kätzchen (kitten.js) merkt sich Sticker und Geschenke pro Profil. */
  function syncKitten() {
    var p = profile();
    window.BIBER_PROFILE = { key: p.legacy ? 'bk.v1' : 'bk.v1.' + p.id, name: p.name };
    if (window.BiberKitten && window.BiberKitten.setProfile) window.BiberKitten.setProfile(window.BIBER_PROFILE.key, p.name);
  }
  syncKitten();

  /* ---------- Abgleich mit dem Server (sync.js) ----------
     Pro Konto ein Dokument mit allen Profilen. Zusammenführen: Profile vereinigen; je Aufgabe zählt das früheste Ergebnis
     (erster Versuch); Name und Niveau-Anpassung der Profile nach Änderungszeit; Löschungen als Merker (gone / cleared);
     Kätzchen-Stand: der größere gewinnt. */
  function kittenKey(p) { return p.legacy ? 'bk.v1' : 'bk.v1.' + p.id; }
  function readKitten(p) {
    try { var r = window.localStorage.getItem(kittenKey(p)); return r ? JSON.parse(r) : null; } catch (e) { return null; }
  }
  function kittenScore(k) { return k ? Object.keys(k.stickers || {}).length * 1000 + (k.giftN || 0) * 10 + (k.pets || 0) : -1; }
  function isPristine(p) { return p.setup && !Object.keys(p.results).length; }
  function snapshot(light) {
    var out = store.profiles.filter(function (p) { return !isPristine(p); }).map(function (p) {
      var res = {};
      Object.keys(p.results).forEach(function (id) {
        var r = p.results[id];
        res[id] = light ? { correct: r.correct, at: r.at } : r;
      });
      return { id: p.id, name: p.name, legacy: !!p.legacy, created: p.created, upd: p.upd || '', adj: p.adj || 0, cleared: p.cleared || {}, results: res, kitten: readKitten(p) };
    });
    if (!out.length && !Object.keys(store.gone || {}).length) return null;
    return { v: 1, at: new Date().toISOString(), gone: store.gone || {}, profiles: out };
  }
  var mergeNeedsPick = false;
  function mergeRemote(remote) {
    if (!remote || !remote.profiles) return false;
    var changed = false;
    store.gone = store.gone || {};
    Object.keys(remote.gone || {}).forEach(function (id) { if (!store.gone[id]) { store.gone[id] = remote.gone[id]; changed = true; } });
    var n0 = store.profiles.length;
    store.profiles = store.profiles.filter(function (p) { return !store.gone[p.id]; });
    if (store.profiles.length !== n0) changed = true;
    var remoteLive = remote.profiles.filter(function (rp) { return !store.gone[rp.id]; });
    var oldCur = store.current;
    if (remoteLive.length && store.profiles.every(isPristine)) { store.profiles = []; changed = true; }
    var kittenTouched = false;
    remoteLive.forEach(function (rp) {
      var lp = store.profiles.filter(function (x) { return x.id === rp.id; })[0];
      if (!lp) {
        var hasLegacy = store.profiles.some(function (x) { return x.legacy; });
        lp = { id: rp.id, name: rp.name || '', klasse: 6, results: {}, legacy: !!rp.legacy && !hasLegacy, created: rp.created || new Date().toISOString(), upd: rp.upd || '', adj: rp.adj || 0, cleared: {} };
        store.profiles.push(lp);
        changed = true;
      } else if ((rp.upd || '') > (lp.upd || '')) {
        if (lp.name !== rp.name || (lp.adj || 0) !== (rp.adj || 0)) changed = true;
        lp.name = rp.name; lp.adj = rp.adj || 0; lp.upd = rp.upd;
      }
      lp.cleared = lp.cleared || {};
      Object.keys(rp.cleared || {}).forEach(function (id) { if ((rp.cleared[id] || '') > (lp.cleared[id] || '')) { lp.cleared[id] = rp.cleared[id]; changed = true; } });
      Object.keys(lp.results).forEach(function (id) {
        if (lp.cleared[id] && (lp.results[id].at || '') <= lp.cleared[id]) { delete lp.results[id]; changed = true; }
      });
      Object.keys(rp.results || {}).forEach(function (id) {
        var r = rp.results[id];
        if (lp.cleared[id] && (r.at || '') <= lp.cleared[id]) return;
        var l = lp.results[id];
        if (!l || (r.at || '') < (l.at || '')) { lp.results[id] = r; changed = true; }
      });
      if (kittenScore(rp.kitten) > kittenScore(readKitten(lp))) {
        try { window.localStorage.setItem(kittenKey(lp), JSON.stringify(rp.kitten)); } catch (e) { /* ignorieren */ }
        kittenTouched = true; changed = true;
      }
    });
    if (!store.profiles.length) { var np0 = newProfile('', 6, true); np0.setup = true; store.profiles.push(np0); }
    if (!store.profiles.some(function (x) { return x.id === store.current; })) {
      store.current = store.profiles[0].id;
      if (store.profiles.length > 1) mergeNeedsPick = true;
    }
    if (changed) {
      try { window.localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* ignorieren */ }
    }
    if (kittenTouched && window.BiberKitten && window.BiberKitten.reload) window.BiberKitten.reload();
    return changed || store.current !== oldCur;
  }
  function afterMerge() {
    syncKitten(); updateProfileBtn();
    if (dlg && dlg.dataset.forced && !profile().setup) closeDialog();
    if (mergeNeedsPick) { mergeNeedsPick = false; openProfiles(false); }
    if (!document.querySelector('.task')) route();
    syncNav();
  }
  function syncNav() {
    var fam = document.querySelector('[data-nav="familie"]');
    if (fam) fam.hidden = !(window.BiberSync && window.BiberSync.canAdmin());
  }
  function storageNote() {
    var st = window.BiberSync ? window.BiberSync.state() : 'local';
    return st === 'server' ? 'Alles wird auf dem Server gespeichert und ist auf jedem Gerät mit deinem Konto da.' : 'Alles bleibt nur in diesem Browser.';
  }
  var syncStat = document.getElementById('syncStat');
  if (window.BiberSync) {
    window.BiberSync.onStatus(function (st) {
      if (!syncStat) return;
      syncStat.textContent = { server: 'Gespeichert auf dem Server', local: 'Nur auf diesem Gerät gespeichert', connecting: 'Verbinde mit dem Server …', readonly: 'Nur auf diesem Gerät gespeichert (kein Schreibrecht auf dem Server)' }[st] || '';
      syncNav();
    });
    document.addEventListener('bk:update', function () { window.BiberSync.schedule(); });
  }

  /* ---------- Aufgabenlisten ---------- */
  function byId(id) { return TASKS.filter(function (t) { return t.id === id; })[0]; }
  function rankOf(t) { return TASKS.indexOf(t); }
  function inGroup(t, g) { return !!(t.groups && t.groups[g]); }
  function inView(t) { return store.mode === 'alle' ? !!t.groups : inGroup(t, store.group); }
  /* Stufe der aktuellen Ansicht: im Filter die der gewählten Klasse, sonst die der jüngsten Klassenstufe, in der die Aufgabe vorkommt. */
  function levelOf(t) {
    if (!t.groups) return null;
    if (store.mode === 'stufe') return t.groups[store.group] || null;
    for (var i = 0; i < GROUPS.length; i++) if (t.groups[GROUPS[i]]) return t.groups[GROUPS[i]];
    return null;
  }
  /* alle: alle 37 Aufgaben in der Reihenfolge von Heft-Seite 6 (ungefähr steigende Schwierigkeit);
     stufe: nur die Aufgaben der Klassenstufe, nach Stufe (einfach, mittel, schwer), dann Heftreihenfolge. */
  function listFor() {
    if (store.mode === 'alle') return TASKS.slice();
    var g = store.group;
    return TASKS.filter(function (t) { return inGroup(t, g); })
      .sort(function (a, b) {
        return LEVEL_RANK[a.groups[g]] - LEVEL_RANK[b.groups[g]] || rankOf(a) - rankOf(b);
      });
  }
  function resultOf(t) { return store.results[t.id]; }
  function pointsOf(t, r) { var lv = levelOf(t); return lv ? SCORING[lv][r.correct ? 'right' : 'wrong'] : 0; }
  function isReady(t) { return !!t.id && !!B.modules[t.id]; }
  function groupLabel(g) { return 'Klasse ' + g.replace('-', '–'); }
  function pts(n) { return n > 0 ? '+' + n : String(n); }
  function viewLabel() { return store.mode === 'alle' ? 'Alle Aufgaben' : groupLabel(store.group); }
  function statusOf(t) {
    if (!isReady(t)) return { cls: 'soon', label: 'folgt noch' };
    var r = resultOf(t);
    if (!r) return { cls: 'open', label: 'offen' };
    return r.correct ? { cls: 'ok', label: 'richtig' } : { cls: 'bad', label: 'falsch' };
  }
  function groupsText(t) {
    return GROUPS.filter(function (g) { return inGroup(t, g); }).map(function (g) { return g.replace('-', '–') + ' ' + t.groups[g]; }).join(' · ');
  }

  /* ---------- Adaptives Training ----------
     Die Schwierigkeit einer Aufgabe ist ihre Position D (1..37) in der Aufgabenliste von Heft-Seite 6
     (ungefähr steigende Schwierigkeit), unabhängig von Klassenstufen. Das Biber-Niveau A eines Profils ist ebenfalls
     eine Position auf dieser Liste. Es startet vorn und wird nach jeder gewerteten Antwort (erster Versuch, zeitlich
     geordnet) wie beim Elo-System angepasst: richtig bei einer Aufgabe über dem Niveau hebt es stark, falsch bei einer
     Aufgabe unter dem Niveau senkt es stark. Mit „zu leicht“ / „zu schwer“ lässt sich das Niveau von Hand verschieben
     (profile.adj). Empfohlen wird, was etwas über dem Niveau liegt; bei Fehlern kommt eine Wiederholung dazu. */
  var N_TASKS = TASKS.length;
  function taskD(t) { return TASKS.indexOf(t) + 1; }
  function expectedP(A, D) { return 1 / (1 + Math.exp(-(A - D) / 4)); }
  function answeredTasks(p) {
    return TASKS.filter(function (t) { return t.id && p.results[t.id]; })
      .sort(function (x, y) { return (p.results[x.id].at || '') < (p.results[y.id].at || '') ? -1 : 1; });
  }
  function clampA(a) { return Math.max(1, Math.min(N_TASKS + 0.5, a)); }
  function abilityOf(p) {
    var A = 3;
    answeredTasks(p).forEach(function (t) {
      A = clampA(A + 5 * ((p.results[t.id].correct ? 1 : 0) - expectedP(A, taskD(t))));
    });
    return clampA(A + (p.adj || 0));
  }
  var STAGES = [[0, 'Einstieg'], [9, 'Aufbau'], [19, 'Fortgeschritten'], [29, 'Experte']];
  function levelLabel(A) {
    var name = STAGES[0][1];
    STAGES.forEach(function (s2) { if (A >= s2[0]) name = s2[1]; });
    return { name: name, text: name + ' (≈ Aufgabe ' + Math.round(A) + ' von ' + N_TASKS + ')', pct: Math.max(3, Math.min(100, A / N_TASKS * 100)) };
  }

  function areaOf(t) {
    var a = (t.topic || '').split(',')[0].trim();
    return a === 'Algorithmus' ? 'Algorithmen' : a;
  }
  function areaStats(p) {
    var st = {};
    TASKS.forEach(function (t) {
      if (!t.id || !isReady(t)) return;
      var a = areaOf(t);
      st[a] = st[a] || { area: a, n: 0, done: 0, right: 0 };
      st[a].n++;
      var r = p.results[t.id];
      if (r) { st[a].done++; if (r.correct) st[a].right++; }
    });
    return Object.keys(st).map(function (k) { return st[k]; });
  }
  function recommend(p, excludeId) {
    var A = abilityOf(p);
    var ready = TASKS.filter(function (t) { return t.id && isReady(t) && t.id !== excludeId; });
    var open = ready.filter(function (t) { return !p.results[t.id]; });
    var wrong = ready.filter(function (t) { return p.results[t.id] && !p.results[t.id].correct; });
    var answered = answeredTasks(p);
    var allRight = answered.length > 0 && wrong.length === 0 && answered.every(function (t) { return p.results[t.id].correct; });
    var items = [];
    function used(t) { return items.some(function (i) { return i.task === t; }); }
    function nearest(list, target) {
      var best = null;
      list.forEach(function (t) {
        if (used(t)) return;
        var d = Math.abs(taskD(t) - target);
        if (!best || d < best.d) best = { t: t, d: d };
      });
      return best && best.t;
    }
    var c = nearest(open, A + 3);
    if (c) items.push({ task: c, label: 'Nächste Herausforderung', why: allRight ? 'Du hast bisher alles richtig. Jetzt wird es anspruchsvoller.' : 'Passt zu deinem Niveau und ist ein Stück schwerer.' });
    var w = nearest(wrong, A);
    if (w) items.push({ task: w, label: 'Nochmal anschauen', why: 'Beim ersten Mal war es knifflig. Probier die Aufgabe noch einmal zum Üben.' });
    else {
      var warm = nearest(open, A - 6);
      if (warm) items.push({ task: warm, label: 'Zum Aufwärmen', why: 'Ein etwas leichterer Einstieg zum Warmwerden.' });
    }
    var stats = areaStats(p).filter(function (x) { return open.some(function (t) { return areaOf(t) === x.area; }); })
      .sort(function (x, y) { return x.done - y.done; });
    if (stats.length) {
      var theme = nearest(open.filter(function (t) { return areaOf(t) === stats[0].area; }), A + 1);
      if (theme) items.push({ task: theme, label: 'Neues Thema', why: stats[0].area + ' hast du noch kaum geübt.' });
    }
    return { A: A, level: levelLabel(A), items: items, answered: answered.length, right: answered.filter(function (t) { return p.results[t.id].correct; }).length, allRight: allRight, openLeft: open.length };
  }
  function daysToBiber() {
    var now = new Date();
    var y = now.getFullYear();
    var start = new Date(y, 10, 9);
    if (now > new Date(y, 10, 21)) start = new Date(y + 1, 10, 9);
    return Math.ceil((start - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
  }
  function trainingHtml(rec) {
    var p = profile();
    var name = p.name || 'du';
    var days = daysToBiber();
    var head = 'Hallo ' + name + '!';
    var info;
    if (!rec.answered) info = 'Löse die erste Aufgabe. Dann passt sich das Training an deine Ergebnisse an.';
    else info = (rec.allRight ? 'Bisher alles richtig: ' : '') + rec.right + ' von ' + rec.answered + ' richtig. Die Vorschläge unten passen sich deinen Ergebnissen an.';
    var cards = rec.items.map(function (it, i) {
      var t = it.task;
      var lv = levelOf(t) || 'mittel';
      return '<li><a class="rec-card' + (i === 0 ? ' first' : '') + '" href="#' + t.id + '"><span class="eyebrow">' + it.label + '</span>' +
        '<b>' + t.title + '</b><span class="rec-meta"><span class="chip">Aufgabe ' + taskD(t) + ' von ' + N_TASKS + '</span> ' + areaOf(t) + '</span>' +
        '<span class="rec-why">' + it.why + '</span></a></li>';
    }).join('');
    var themes = areaStats(p).sort(function (x, y) { return y.n - x.n; }).map(function (x) {
      var cls = x.done === 0 ? 'soon' : x.right === x.done ? 'ok' : (x.right / x.done < 0.6 ? 'bad' : 'open');
      return '<span class="chip ' + cls + '" title="' + x.right + ' von ' + x.done + ' richtig, ' + x.n + ' Aufgaben insgesamt">' + x.area + ' ' + x.right + '/' + x.done + '</span>';
    }).join(' ');
    return '<section class="train" aria-labelledby="trH">' +
      '<p class="eyebrow">Dein Training' + (days > 0 && days <= 60 ? ' · noch ' + days + ' Tage bis zum Biber (9.–20. November)' : '') + '</p>' +
      '<h1 id="trH">' + head + '</h1>' +
      '<div class="lvl"><div class="lvl-top"><span>Dein Biber-Niveau</span><b>' + rec.level.text + '</b></div>' +
      '<div class="lvl-bar" role="img" aria-label="Biber-Niveau: ' + rec.level.text + '"><i style="width:' + rec.level.pct.toFixed(0) + '%"></i></div>' +
      '<div class="lvl-scale"><span>Einstieg</span><span>Aufbau</span><span>Fortgeschritten</span><span>Experte</span></div>' +
      '<div class="adj"><span>Passt das Niveau?</span><button type="button" class="linkbtn" data-adj="1">Zu leicht, bitte schwerer</button><button type="button" class="linkbtn" data-adj="-1">Zu schwer, bitte leichter</button></div></div>' +
      '<p class="note">' + info + '</p>' +
      (cards ? '<ol class="rec">' + cards + '</ol>' : '<div class="feedback info"><h2>Alles geschafft!</h2><p>Du hast alle spielbaren Aufgaben bearbeitet. Weitere Aufgaben aus anderen Jahren folgen.</p></div>') +
      '<div class="themes"><span class="eyebrow">Deine Themen (richtig/bearbeitet)</span><div class="chips">' + themes + '</div></div>' +
      '</section>';
  }

  /* ---------- Übersicht ---------- */
  function renderOverview() {
    var list = listFor();
    var playable = list.filter(isReady);
    var done = playable.filter(resultOf).length;
    var rec = recommend(profile());
    var firstOpen = rec.items[0] ? rec.items[0].task : playable.filter(function (t) { return !resultOf(t); })[0];
    var alle = store.mode === 'alle';
    var rows = list.map(function (t, i) {
      var s = statusOf(t);
      var lv = levelOf(t);
      var inner =
        '<span class="rank num">' + (i + 1) + '</span>' +
        '<span class="t-title">' + t.title + '</span>' +
        '<span class="t-topic">' + t.topic + '</span>' +
        '<span class="t-state"><span class="chip ' + s.cls + '">' + s.label + '</span>' +
        '<span class="num">' + (lv ? '<span class="chip ' + lv + '">' + lv + '</span> ' : '') + 'Heft S. ' + t.page + '</span>' +
        (alle && t.groups ? '<span class="num small">' + groupsText(t) + '</span>' : '') + '</span>';
      return isReady(t)
        ? '<li><a class="task-row" href="#' + t.id + '">' + inner + '</a></li>'
        : '<li><div class="task-row soon">' + inner + '</div></li>';
    }).join('');
    var later = '';
    if (!alle) {
      var rest = TASKS.filter(function (t) { return !t.groups; });
      if (rest.length) later = '<details class="later"><summary>Ab Klasse 7 · ' + rest.length + ' weitere Aufgaben (noch nicht umgesetzt)</summary><ol class="tasklist">' +
        rest.map(function (t) {
          return '<li><div class="task-row soon"><span class="rank num">·</span><span class="t-title">' + t.title +
            '</span><span class="t-topic">' + t.topic + '</span><span class="t-state"><span class="num">Heft S. ' + t.page + '</span></span></div></li>';
        }).join('') + '</ol></details>';
    }
    app.innerHTML = trainingHtml(rec) +
      '<section class="intro" style="margin-top:2rem"><p class="eyebrow">Informatik-Biber 2025 · ' + viewLabel() + '</p>' +
      '<h1>' + (alle ? 'Alle Aufgaben nach Schwierigkeit' : playable.length + ' Aufgaben für ' + groupLabel(store.group)) + '</h1>' +
      '<p>' + (alle
        ? 'Alle 37 Aufgaben in der Reihenfolge der Aufgabenliste auf Seite 6 des Biberhefts, ungefähr von einfach nach schwer. ' + playable.length + ' davon sind schon spielbar, die übrigen folgen. Mit „Nach Klasse“ oben filterst du auf eine Klassenstufe.'
        : 'Die Aufgaben dieser Klassenstufe stehen von einfach bis schwer, gleiche Stufen in der Reihenfolge von Seite 6 des Biberhefts. Mit „Alle Aufgaben“ oben siehst du wieder die ganze Liste.') + '</p></section>' +
      '<div class="progress"><div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + playable.length + '" aria-valuenow="' + done + '"><i style="width:' + (playable.length ? done / playable.length * 100 : 0) + '%"></i></div>' +
      '<small class="num">' + done + ' von ' + playable.length + ' spielbaren Aufgaben bearbeitet</small></div>' +
      '<div class="actions" style="margin-top:1rem">' +
      (firstOpen ? '<a class="btn" href="#' + firstOpen.id + '">' + (done ? 'Weiter: ' + firstOpen.title : 'Mit ' + firstOpen.title + ' starten') + '</a>' : '') +
      '<a class="btn ghost" href="#bewertung">Bewertung</a></div>' +
      '<ol class="tasklist">' + rows + '</ol>' + later;
  }

  /* ---------- Aufgabenansicht ---------- */
  function renderTask(id) {
    var t = byId(id);
    if (!t || !t.groups) return renderOverview();
    if (!inView(t)) {
      store.mode = 'alle';
      save();
      syncControls();
    }
    var level = levelOf(t);
    var mod = B.modules[id];
    var list = listFor();
    var idx = list.indexOf(t);
    var next = list.slice(idx + 1).filter(isReady)[0];
    function nextAdaptive() { var r = recommend(profile(), id).items[0]; return r ? r.task : next; }
    var saved = resultOf(t);
    var alle = store.mode === 'alle';

    app.innerHTML =
      '<p class="crumbs"><a href="#">← Alle Aufgaben</a></p>' +
      '<article class="task t-' + id + '">' +
      '<header class="task-head">' +
      '<div class="chips"><span class="chip ' + level + '">' + (alle ? level : groupLabel(store.group) + ' · ' + level) + '</span>' +
      '<span class="chip">Platz ' + (idx + 1) + ' von ' + list.length + '</span><span class="chip">Heft S. ' + t.page + '</span>' +
      (alle ? '<span class="chip soon">' + groupsText(t) + '</span>' : '') + '</div>' +
      '<h1>' + t.title + '</h1><p class="eyebrow">' + t.topic + '</p>' +
      (mod ? '<div class="story">' + (mod.story || '') + '</div>' +
        '<h2 class="question">' + (mod.question || '') + '</h2>' +
        (mod.howto ? '<p class="howto">' + mod.howto + '</p>' : '') : '') +
      '</header>' +
      (mod
        ? '<div class="board-shell"><div class="board-mount" data-mount></div>' +
          '<div class="board-foot"><span class="status-line" role="status" data-status></span>' +
          '<div class="actions" data-bar></div></div></div><div data-feedback></div>'
        : '<div class="feedback info"><h2>In Arbeit</h2><p>Diese Aufgabe ist noch nicht umgesetzt.</p></div>') +
      '<nav class="task-nav" aria-label="Aufgabennavigation"><a class="btn ghost" href="#">Aufgabenliste</a>' +
      (next ? '<a class="btn ghost" href="#' + next.id + '">Nächste in der Liste: ' + next.title + ' →</a>'
        : '<a class="btn ghost" href="#bewertung">Zur Bewertung</a>') + '</nav></article>';
    if (!mod) return;

    var el = app.querySelector('[data-mount]');
    var statusEl = app.querySelector('[data-status]');
    var bar = app.querySelector('[data-bar]');
    var fb = app.querySelector('[data-feedback]');
    var st = { locked: false, checked: false, text: '', note: '' };

    function refreshBar() {
      var complete = !!mod.isComplete();
      if (!st.checked) {
        statusEl.textContent = st.text || (complete ? 'Bereit zum Prüfen.' : 'Löse die Aufgabe, dann kannst du prüfen.');
        bar.innerHTML =
          '<button class="btn ghost" type="button" data-act="reset">Zurücksetzen</button>' +
          '<button class="btn" type="button" data-act="check"' + (complete ? '' : ' disabled') + '>Antwort prüfen</button>';
      } else {
        statusEl.textContent = '';
        bar.innerHTML = '';
      }
    }
    var api = {
      group: store.group,
      level: level,
      locked: function () { return st.locked; },
      changed: function (text) { st.text = typeof text === 'string' ? text : ''; if (!st.checked) refreshBar(); }
    };
    mod.mount(el, api);

    function explanation() {
      return typeof mod.explanation === 'function' ? mod.explanation() : (mod.explanation || '');
    }
    function showFeedback(correct, points, counts, solution) {
      var head, cls;
      if (solution) { cls = 'info'; head = 'So geht es'; }
      else if (correct) { cls = 'ok'; head = 'Richtig! ' + (counts ? pts(points) + ' Punkte' : 'Gut geübt'); }
      else { cls = 'bad'; head = 'Nicht ganz. ' + (counts ? pts(points) + ' Punkte' : 'Versuch es noch einmal'); }
      var nx = nextAdaptive();
      st.last = [correct, points, counts, solution];
      fb.innerHTML = '<div class="feedback ' + cls + '"><h2>' + head + '</h2>' +
        (st.note ? '<p class="note"><b>' + st.note + '</b></p>' : '') +
        (!solution && !counts ? '<p class="note">Das war ein Übungsversuch. Gewertet wird dein erster Versuch.</p>' : '') +
        '<div class="expl">' + explanation() + '</div>' +
        '<p class="note adj-line">Wie war die Aufgabe? <button type="button" class="linkbtn" data-adj="1">Zu leicht</button> · <button type="button" class="linkbtn" data-adj="-1">Zu schwer</button></p>' +
        '<div class="actions">' +
        (!correct && !solution ? '<button class="btn ghost" type="button" data-act="solution">Lösung zeigen</button>' : '') +
        '<button class="btn ghost" type="button" data-act="retry">Noch einmal üben</button>' +
        '<a class="btn" href="#bewertung">Zur Bewertung</a>' +
        (nx ? '<a class="btn' + (correct && !solution ? '' : ' ghost') + '" href="#' + nx.id + '">Nächste für dich: ' + nx.title + ' →</a>' : '') + '</div></div>';
    }
    function lock(on) { st.locked = on; mod.lock(on); }

    if (saved) {
      mod.setAnswer(saved.answer);
      lock(true);
      st.checked = true;
      refreshBar();
      showFeedback(saved.correct, pointsOf(t, saved), true, false);
    } else {
      refreshBar();
    }

    app.querySelector('.task').addEventListener('click', function (e) {
      var a = e.target.closest('[data-act]');
      if (!a) return;
      var act = a.dataset.act;
      if (act === 'check') {
        if (!mod.isComplete()) return;
        var res = mod.evaluate();
        var counts = !resultOf(t);
        var points = SCORING[level][res.correct ? 'right' : 'wrong'];
        if (counts) {
          var before = levelLabel(abilityOf(profile()));
          store.results[id] = { correct: !!res.correct, answer: res.answer, at: new Date().toISOString() };
          save();
          var after = levelLabel(abilityOf(profile()));
          st.note = after.name !== before.name ? 'Neue Stufe im Biber-Niveau: ' + after.name + '!' : '';
        }
        lock(true);
        st.checked = true;
        refreshBar();
        showFeedback(res.correct, points, counts, false);
        document.dispatchEvent(new CustomEvent('biber:result', { detail: { correct: !!res.correct, id: id, counted: counts } }));
        fb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else if (act === 'reset' || act === 'retry') {
        mod.reset();
        lock(false);
        st.checked = false;
        st.text = '';
        fb.innerHTML = '';
        refreshBar();
      } else if (act === 'solution') {
        mod.showSolution();
        lock(true);
        showFeedback(true, 0, true, true);
      }
    });
  }

  /* ---------- Bewertung ---------- */
  var confirmReset = false;
  function renderResults() {
    var list = listFor();
    var scored = list.filter(function (t) { return levelOf(t); });
    var total = 0, maxPts = 0, right = 0, tried = 0;
    var perLevel = { einfach: { n: 0, tried: 0, right: 0, pts: 0, max: 0 }, mittel: { n: 0, tried: 0, right: 0, pts: 0, max: 0 }, schwer: { n: 0, tried: 0, right: 0, pts: 0, max: 0 } };
    scored.forEach(function (t) {
      var lv = levelOf(t);
      var p = perLevel[lv];
      p.n++;
      p.max += SCORING[lv].right;
      maxPts += SCORING[lv].right;
      var r = resultOf(t);
      if (!r) return;
      var pt = pointsOf(t, r);
      tried++; p.tried++;
      total += pt; p.pts += pt;
      if (r.correct) { right++; p.right++; }
    });
    var pct = tried ? Math.round(right / tried * 100) : 0;
    var alle = store.mode === 'alle';

    var rows = list.map(function (t, i) {
      var s = statusOf(t);
      var r = resultOf(t);
      var lv = levelOf(t);
      return '<tr class="' + (isReady(t) ? '' : 'dim') + '"><td class="num">' + (i + 1) + '</td>' +
        '<td>' + (isReady(t) ? '<a href="#' + t.id + '">' + t.title + '</a>' : t.title) + '</td>' +
        '<td>' + (lv ? '<span class="chip ' + lv + '">' + lv + '</span>' : '–') + '</td><td><span class="chip ' + s.cls + '">' + s.label + '</span></td>' +
        '<td class="r num">' + (r ? pts(pointsOf(t, r)) : '–') + '</td></tr>';
    }).join('');
    var levels = ['einfach', 'mittel', 'schwer'].map(function (lv) {
      var p = perLevel[lv];
      if (!p.n) return '';
      return '<tr><td><span class="chip ' + lv + '">' + lv + '</span></td><td class="r num">' + p.n + '</td><td class="r num">' + p.tried +
        '</td><td class="r num">' + p.right + '</td><td class="r num">' + (p.pts > 0 ? '+' : '') + p.pts + ' / ' + p.max + '</td></tr>';
    }).join('');

    var resetBtn = confirmReset
      ? '<span class="note">Alle Ergebnisse (' + viewLabel() + ') löschen?</span><button class="btn danger" type="button" data-act="reset-yes">Ja, löschen</button><button class="btn ghost" type="button" data-act="reset-no">Abbrechen</button>'
      : '<button class="btn ghost" type="button" data-act="reset-ask"' + (tried ? '' : ' disabled') + '>Bewertung zurücksetzen</button>';

    app.innerHTML =
      '<section class="intro"><p class="eyebrow">Auswertung · ' + (profile().name || 'Profil') + ' · ' + viewLabel() + '</p><h1>Bewertung</h1>' +
      '<p>Dein Stand bei den ' + scored.length + ' spielbaren Aufgaben' + (alle ? '' : ' dieser Klassenstufe') + '. Gewertet wird jeweils der erste Versuch.</p></section>' +
      '<div class="score-top">' +
      '<div class="stat hero"><span class="v num">' + total + ' <small>/ ' + maxPts + '</small></span><span class="l">Punkte</span></div>' +
      '<div class="stat"><span class="v num">' + right + ' <small>/ ' + tried + '</small></span><span class="l">richtig beantwortet</span></div>' +
      '<div class="stat"><span class="v num">' + pct + ' <small>%</small></span><span class="l">Trefferquote</span></div>' +
      '<div class="stat"><span class="v num">' + tried + ' <small>/ ' + scored.length + '</small></span><span class="l">Aufgaben bearbeitet</span></div></div>' +
      '<section class="panel"><h2>Nach Schwierigkeit</h2><div class="tbl-wrap"><table class="res"><thead><tr><th>Stufe</th><th class="r">Aufgaben</th><th class="r">bearbeitet</th><th class="r">richtig</th><th class="r">Punkte</th></tr></thead><tbody>' + levels + '</tbody></table></div></section>' +
      '<section class="panel"><h2>Deine Themen</h2><div class="tbl-wrap"><table class="res"><thead><tr><th>Thema</th><th class="r">Aufgaben</th><th class="r">bearbeitet</th><th class="r">richtig</th></tr></thead><tbody>' +
      areaStats(profile()).sort(function (x, y) { return y.n - x.n; }).map(function (x) { return '<tr><td>' + x.area + '</td><td class="r num">' + x.n + '</td><td class="r num">' + x.done + '</td><td class="r num">' + x.right + '</td></tr>'; }).join('') +
      '</tbody></table></div><p class="note">Das Biber-Niveau: ' + levelLabel(abilityOf(profile())).text + '.</p></section>' +
      '<section class="panel"><h2>' + (alle ? 'Alle 37 Aufgaben' : 'Alle Aufgaben') + '</h2><div class="tbl-wrap"><table class="res"><thead><tr><th>Nr.</th><th>Aufgabe</th><th>Stufe</th><th>Status</th><th class="r">Punkte</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="note">Punkteschema: einfach +6 / −2, mittel +9 / −3, schwer +12 / −4, ohne Antwort 0 (üblich beim Bebras, im Biberheft nicht angegeben). ' +
      (alle ? 'In der Ansicht „Alle Aufgaben“ zählt die Stufe der jüngsten Klassenstufe, in der die Aufgabe vorkommt; mit „Nach Klasse“ zählt die Stufe der gewählten Klasse. ' : '') +
      'Das Heft liegt ohne Lösungen vor; die Lösungen wurden aus den Aufgabenstellungen abgeleitet und sollten mit den offiziellen Lösungen abgeglichen werden.</p>' +
      '<div class="actions">' + resetBtn + '</div></section>';
  }

  /* ---------- Profile ---------- */
  var dlg = null, dlgFrom = null;
  function klasseOptions(sel) {
    var out = '';
    for (var k = 3; k <= 13; k++) out += '<option value="' + k + '"' + (k === sel ? ' selected' : '') + '>Klasse ' + k + '</option>';
    return out;
  }
  function esc(x) { return String(x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function updateProfileBtn() {
    var b = document.getElementById('profileBtn');
    var p = profile();
    if (b) b.textContent = p.name || 'Profil';
  }
  function closeDialog() {
    if (!dlg) return;
    dlg.remove(); dlg = null;
    document.removeEventListener('keydown', dlgKey, true);
    if (dlgFrom && dlgFrom.focus) { try { dlgFrom.focus(); } catch (e) { /* ignorieren */ } }
  }
  function dlgKey(e) {
    if (!dlg) return;
    if (e.key === 'Escape' && !dlg.dataset.forced) { e.preventDefault(); closeDialog(); }
    if (e.key === 'Tab') {
      var f = [].slice.call(dlg.querySelectorAll('button,input,select,a[href]')).filter(function (x) { return !x.disabled; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  function switchProfile(id) {
    store.current = id;
    save(); syncKitten(); updateProfileBtn();
  }
  function openProfiles(forced) {
    closeDialog();
    dlgFrom = document.activeElement;
    var cur = profile();
    var needSetup = forced || cur.setup;
    var html;
    if (needSetup) {
      html = '<h2 id="dlgT">Willkommen! Wer trainiert hier?</h2>' +
        '<p class="note">Jedes Profil hat eigene Ergebnisse, ein eigenes Kätzchen-Album und ein eigenes Training. ' +
        (Object.keys(cur.results).length ? 'Deine bisherigen ' + Object.keys(cur.results).length + ' Ergebnisse bleiben erhalten. ' : '') +
        storageNote() + '</p>' +
        '<form class="dlg-form" data-form="setup"><label>Name<input id="pfName" type="text" maxlength="24" autocomplete="off" value="' + esc(cur.name) + '" required></label>' +
        '<div class="actions"><button class="btn" type="submit">Los geht’s</button></div></form>';
    } else {
      var rows = store.profiles.map(function (p) {
        var n = Object.keys(p.results).length;
        return '<li class="dlg-row' + (p.id === cur.id ? ' cur' : '') + '"><div><b>' + esc(p.name || 'Profil') + '</b> <span class="note">' + n + ' Aufgaben bearbeitet</span></div>' +
          '<div class="actions">' + (p.id === cur.id ? '<span class="chip ok">aktiv</span>' : '<button class="btn ghost" type="button" data-sw="' + p.id + '">Wechseln</button>') +
          '<button class="btn ghost" type="button" data-ed="' + p.id + '">Ändern</button>' +
          (store.profiles.length > 1 ? '<button class="btn ghost" type="button" data-del="' + p.id + '">Löschen</button>' : '') + '</div></li>';
      }).join('');
      html = '<h2 id="dlgT">Profile</h2><p class="note">Jedes Profil hat eigene Ergebnisse, ein eigenes Kätzchen-Album und ein eigenes Training. ' + storageNote() + '</p>' +
        '<ul class="dlg-list">' + rows + '</ul>' +
        '<form class="dlg-form" data-form="new"><b>Neues Profil</b><label>Name<input id="pfName" type="text" maxlength="24" autocomplete="off" required></label>' +
        '<div class="actions"><button class="btn" type="submit">Anlegen</button><button class="btn ghost" type="button" data-close>Schließen</button></div></form>';
    }
    dlg = document.createElement('div');
    dlg.className = 'dlg-back';
    if (needSetup) dlg.dataset.forced = '1';
    dlg.innerHTML = '<div class="dlg" role="dialog" aria-modal="true" aria-labelledby="dlgT">' + html + '</div>';
    document.body.appendChild(dlg);
    document.addEventListener('keydown', dlgKey, true);
    var first = dlg.querySelector('input,button');
    if (first) first.focus();
    dlg.addEventListener('click', function (e) {
      var t = e.target.closest('[data-sw],[data-ed],[data-del],[data-close],[data-delyes]');
      if (!t) { if (e.target === dlg && !dlg.dataset.forced) closeDialog(); return; }
      if (t.dataset.sw) { switchProfile(t.dataset.sw); closeDialog(); route(); }
      else if (t.dataset.ed) {
        var p = store.profiles.filter(function (x) { return x.id === t.dataset.ed; })[0];
        var li = t.closest('.dlg-row');
        li.innerHTML = '<form class="dlg-form" data-form="edit" data-id="' + p.id + '"><label>Name<input id="pfEName" type="text" maxlength="24" autocomplete="off" value="' + esc(p.name) + '" required></label>' +
          '<div class="actions"><button class="btn" type="submit">Speichern</button></div></form>';
        li.querySelector('input').focus();
      } else if (t.dataset.del) {
        t.outerHTML = '<span class="note">Alle Ergebnisse dieses Profils löschen?</span> <button class="btn danger" type="button" data-delyes="' + t.dataset.del + '">Ja, löschen</button>';
      } else if (t.dataset.delyes) {
        store.gone = store.gone || {};
        store.gone[t.dataset.delyes] = new Date().toISOString();
        store.profiles = store.profiles.filter(function (x) { return x.id !== t.dataset.delyes; });
        if (store.current === t.dataset.delyes) store.current = store.profiles[0].id;
        save(); syncKitten(); updateProfileBtn(); closeDialog(); route();
      } else if (t.dataset.close !== undefined) closeDialog();
    });
    dlg.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target, kind = f.dataset.form;
      if (kind === 'setup') {
        var nm = f.querySelector('#pfName').value.trim();
        if (!nm) return;
        var c = profile();
        c.name = nm; c.setup = false; c.upd = new Date().toISOString();
        save(); syncKitten(); updateProfileBtn(); closeDialog(); route();
      } else if (kind === 'new') {
        var n2 = f.querySelector('#pfName').value.trim();
        if (!n2) return;
        var np = newProfile(n2, 6, false);
        store.profiles.push(np);
        switchProfile(np.id); closeDialog(); route();
      } else if (kind === 'edit') {
        var ep = store.profiles.filter(function (x) { return x.id === f.dataset.id; })[0];
        var en = f.querySelector('#pfEName').value.trim();
        if (!en) return;
        ep.name = en; ep.upd = new Date().toISOString();
        save(); syncKitten(); updateProfileBtn(); closeDialog(); route();
      }
    });
  }


  /* ---------- Familie (nur Besitzer / Editoren) ---------- */
  function lastActive(p) {
    var m = '';
    Object.keys(p.results || {}).forEach(function (id) { if ((p.results[id].at || '') > m) m = p.results[id].at; });
    return m;
  }
  function fmtDate(iso) {
    if (!iso) return '–';
    var d = new Date(iso);
    return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
  function profileCard(p, owner) {
    var done = TASKS.filter(function (t) { return t.id && p.results[t.id]; });
    var right = done.filter(function (t) { return p.results[t.id].correct; });
    var wrong = done.filter(function (t) { return !p.results[t.id].correct; });
    var A = abilityOf(p), lv = levelLabel(A);
    var areas = areaStats(p).filter(function (a) { return a.done; }).sort(function (x, y) { return (x.right / x.done) - (y.right / y.done) || y.done - x.done; });
    var weak = areas.filter(function (a) { return a.right < a.done; }).slice(0, 3);
    return '<article class="panel fam-card"><h2>' + esc(p.name || 'Profil') + (owner ? ' <span class="note">· Konto: ' + esc(owner) + '</span>' : '') + '</h2>' +
      '<p><b>' + lv.text + '</b> · ' + done.length + ' von ' + N_TASKS + ' Aufgaben bearbeitet, ' + right.length + ' richtig' + (wrong.length ? ', ' + wrong.length + ' falsch' : '') + ' · zuletzt aktiv: ' + fmtDate(lastActive(p)) + '</p>' +
      '<div class="lvl-bar" role="img" aria-label="Niveau"><i style="width:' + lv.pct + '%"></i></div>' +
      (wrong.length ? '<p class="note">Falsch im ersten Versuch: ' + wrong.map(function (t) { return esc(t.title); }).join(', ') + '</p>' : '') +
      (weak.length ? '<p class="note">Themen mit Fehlern: ' + weak.map(function (a) { return esc(a.area) + ' (' + a.right + '/' + a.done + ')'; }).join(', ') + '</p>' : '') +
      '</article>';
  }
  function renderFamily() {
    var B2 = window.BiberSync;
    app.innerHTML = '<section class="hero"><p class="eyebrow">Eltern-Übersicht</p><h1>Familie</h1><p class="lead">Alle Profile, die auf dem Server gespeichert sind.</p></section><div id="famBody"><p class="note">Lade …</p></div>';
    if (!B2 || !B2.canAdmin()) { document.getElementById('famBody').innerHTML = '<p class="note">Diese Seite ist nur für den Besitzer und Editoren sichtbar.</p>'; return; }
    B2.listAll().then(function (docs) {
      var ids = docs.map(function (d) { return d.uid; });
      return B2.names(ids).then(function (nm) { return { docs: docs, nm: nm }; });
    }).then(function (r) {
      var body = document.getElementById('famBody');
      if (!body || (location.hash || '') !== '#familie') return;
      var cards = [];
      r.docs.forEach(function (d) {
        var who = (r.nm[d.uid] && r.nm[d.uid].name) || '';
        (d.data.profiles || []).forEach(function (p) { cards.push(profileCard(p, who)); });
      });
      body.innerHTML = cards.length ? '<div class="fam-grid">' + cards.join('') + '</div>' +
        '<p class="note">Die Ergebnisse stammen aus den Konten der Besucher, die die Seite mit Schreibrecht geöffnet haben.</p>'
        : '<p class="note">Noch keine gespeicherten Profile.</p>';
    }).catch(function () {
      var body = document.getElementById('famBody');
      if (body) body.innerHTML = '<p class="note">Die Übersicht konnte nicht geladen werden.</p>';
    });
  }

  /* ---------- Router und Umschalter ---------- */
  function syncControls() {
    document.querySelectorAll('[data-mode]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.mode === store.mode ? 'true' : 'false');
    });
    document.querySelectorAll('[data-group]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.group === store.group ? 'true' : 'false');
    });
    document.getElementById('groupSeg').hidden = store.mode !== 'stufe';
  }
  function route() {
    var h = (location.hash || '').replace(/^#/, '');
    var page = h === 'bewertung' ? 'bewertung' : h === 'familie' ? 'familie' : 'aufgaben';
    document.querySelectorAll('.nav a').forEach(function (a) {
      a.setAttribute('aria-current', a.dataset.nav === page ? 'page' : 'false');
    });
    syncControls();
    if (h === 'bewertung') { confirmReset = false; renderResults(); }
    else if (h === 'familie') renderFamily();
    else if (h && byId(h)) renderTask(h);
    else renderOverview();
    window.scrollTo(0, 0);
    document.dispatchEvent(new Event('biber:render'));
  }
  function afterViewChange() {
    save();
    var t = byId((location.hash || '').replace(/^#/, ''));
    if (t && !inView(t)) location.hash = '#';
    else route();
  }

  document.getElementById('modeSeg').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-mode]');
    if (!b || b.dataset.mode === store.mode) return;
    store.mode = b.dataset.mode;
    afterViewChange();
  });
  document.getElementById('groupSeg').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-group]');
    if (!b || b.dataset.group === store.group) return;
    store.group = b.dataset.group;
    afterViewChange();
  });
  function adjustLevel(dir) {
    var p = profile();
    p.adj = Math.max(-15, Math.min(15, (p.adj || 0) + dir * 4));
    p.upd = new Date().toISOString();
    save();
  }
  app.addEventListener('click', function (e) {
    var adj = e.target.closest('[data-adj]');
    if (adj && adj.dataset.adj) {
      adjustLevel(+adj.dataset.adj);
      if (!document.querySelector('.task')) route();
      else adj.parentNode.innerHTML = 'Danke! Die nächsten Aufgaben werden ' + (+adj.dataset.adj > 0 ? 'schwerer.' : 'leichter.');
      return;
    }
    var act = e.target.closest('[data-act^="reset-"]');
    if (!act) return;
    if (act.dataset.act === 'reset-ask') confirmReset = true;
    if (act.dataset.act === 'reset-no') confirmReset = false;
    if (act.dataset.act === 'reset-yes') {
      var cp = profile(), nowIso = new Date().toISOString();
      cp.cleared = cp.cleared || {};
      listFor().forEach(function (t) { if (t.id && store.results[t.id]) { delete store.results[t.id]; cp.cleared[t.id] = nowIso; } });
      cp.upd = nowIso;
      save();
      confirmReset = false;
    }
    renderResults();
  });
  window.addEventListener('hashchange', route);
  var pbtn = document.getElementById('profileBtn');
  if (pbtn) pbtn.addEventListener('click', function () { openProfiles(false); });
  updateProfileBtn();
  route();
  if (profile().setup) openProfiles(true);
  if (window.BiberSync) {
    window.BiberSync.start({ snapshot: snapshot, merge: mergeRemote, merged: afterMerge });
  }

  /* Kätzchen-Schalter im Seitenfuß (kitten.js ist eigenständig und per defer geladen) */
  var bkToggle = document.getElementById('bkToggle'), bkMute = document.getElementById('bkMute'), bkStat = document.getElementById('bkStat');
  function bkSync() {
    var K = window.BiberKitten;
    if (!K || !bkToggle) return;
    var s = K.stats();
    bkToggle.textContent = 'Kätzchen: ' + (s.enabled ? 'an' : 'aus');
    bkToggle.setAttribute('aria-pressed', String(s.enabled));
    bkMute.textContent = 'Ton: ' + (s.muted ? 'aus' : 'an');
    bkMute.setAttribute('aria-pressed', String(!s.muted));
    bkStat.textContent = s.seen + ' von ' + s.total + ' Stickern gesammelt';
  }
  if (bkToggle) {
    bkToggle.addEventListener('click', function () { if (window.BiberKitten) { window.BiberKitten.setEnabled(!window.BiberKitten.stats().enabled); bkSync(); } });
    document.getElementById('bkAlbum').addEventListener('click', function () { if (window.BiberKitten) window.BiberKitten.album(); });
    bkMute.addEventListener('click', function () { if (window.BiberKitten) { window.BiberKitten.setMuted(!window.BiberKitten.stats().muted); bkSync(); } });
    document.addEventListener('bk:update', bkSync);
    window.addEventListener('load', bkSync);
  }
})();
