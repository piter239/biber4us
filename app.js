(function () {
  'use strict';

  var TASKS = window.BIBER_TASKS;
  var SCORING = window.BIBER_SCORING;
  var B = window.Biber;
  var GROUPS = ['3-4', '5-6', '7-8', '9-10', '11-13'];
  var LEVEL_RANK = { einfach: 0, mittel: 1, schwer: 2 };
  var STORE_KEY = 'biber2025.v3';
  var app = document.getElementById('app');

  /* ---------- Speicher (localStorage, mit Fallback im Arbeitsspeicher) ----------
     mode: 'alle' (alle Aufgaben nach Schwierigkeit) oder 'stufe' (Filter nach Klassenstufe).
     Ergebnisse gelten pro Aufgabe (erster Versuch); die Punkte ergeben sich aus der Stufe der aktuellen Ansicht. */
  var store = { mode: 'alle', group: '3-4', results: {} };
  try {
    var raw = window.localStorage.getItem(STORE_KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.results) store = parsed;
    } else {
      var old = window.localStorage.getItem('biber2025.v2');
      if (old) {
        var o = JSON.parse(old);
        Object.keys((o && o.results) || {}).forEach(function (k) {
          var id = k.split(':')[1];
          if (id && !store.results[id]) store.results[id] = { correct: o.results[k].correct, answer: o.results[k].answer, at: o.results[k].at };
        });
        if (o && GROUPS.indexOf(o.group) >= 0) store.group = o.group;
      }
    }
  } catch (e) { /* ohne Speicher weiterarbeiten */ }
  if (GROUPS.indexOf(store.group) < 0) store.group = '3-4';
  if (store.mode !== 'alle' && store.mode !== 'stufe') store.mode = 'alle';
  function save() {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* ignorieren */ }
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

  /* ---------- Übersicht ---------- */
  function renderOverview() {
    var list = listFor();
    var playable = list.filter(isReady);
    var done = playable.filter(resultOf).length;
    var firstOpen = playable.filter(function (t) { return !resultOf(t); })[0];
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
    app.innerHTML =
      '<section class="intro"><p class="eyebrow">Informatik-Biber 2025 · ' + viewLabel() + '</p>' +
      '<h1>' + (alle ? 'Alle Aufgaben nach Schwierigkeit' : playable.length + ' Aufgaben für ' + groupLabel(store.group)) + '</h1>' +
      '<p>' + (alle
        ? 'Alle 37 Aufgaben in der Reihenfolge der Aufgabenliste auf Seite 6 des Biberhefts, ungefähr von einfach nach schwer. ' + playable.length + ' davon sind schon spielbar, die übrigen folgen. Mit „Nach Klasse“ oben filterst du auf eine Klassenstufe.'
        : 'Die Aufgaben dieser Klassenstufe stehen von einfach bis schwer, gleiche Stufen in der Reihenfolge von Seite 6 des Biberhefts. Mit „Alle Aufgaben“ oben siehst du wieder die ganze Liste.') + '</p></section>' +
      '<div class="progress"><div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + playable.length + '" aria-valuenow="' + done + '"><i style="width:' + (playable.length ? done / playable.length * 100 : 0) + '%"></i></div>' +
      '<small class="num">' + done + ' von ' + playable.length + ' spielbaren Aufgaben bearbeitet</small></div>' +
      '<div class="actions" style="margin-top:1rem">' +
      (firstOpen ? '<a class="btn" href="#' + firstOpen.id + '">' + (done ? 'Weiter mit ' + firstOpen.title : 'Mit ' + firstOpen.title + ' starten') + '</a>' : '') +
      '<a class="btn ghost" href="#bewertung">Bewertung</a></div>' +
      '<ol class="tasklist">' + rows + '</ol>' + later;
  }

  /* ---------- Aufgabenansicht ---------- */
  function renderTask(id) {
    var t = byId(id);
    if (!t || !t.groups) return renderOverview();
    if (!inView(t)) {
      store.group = GROUPS.filter(function (x) { return inGroup(t, x); })[0];
      save();
      syncControls();
    }
    var level = levelOf(t);
    var mod = B.modules[id];
    var list = listFor();
    var idx = list.indexOf(t);
    var next = list.slice(idx + 1).filter(isReady)[0];
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
      (next ? '<a class="btn ghost" href="#' + next.id + '">Nächste: ' + next.title + ' →</a>'
        : '<a class="btn ghost" href="#bewertung">Zur Bewertung</a>') + '</nav></article>';
    if (!mod) return;

    var el = app.querySelector('[data-mount]');
    var statusEl = app.querySelector('[data-status]');
    var bar = app.querySelector('[data-bar]');
    var fb = app.querySelector('[data-feedback]');
    var st = { locked: false, checked: false, text: '' };

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
      fb.innerHTML = '<div class="feedback ' + cls + '"><h2>' + head + '</h2>' +
        (!solution && !counts ? '<p class="note">Das war ein Übungsversuch. Gewertet wird dein erster Versuch.</p>' : '') +
        '<div class="expl">' + explanation() + '</div>' +
        '<div class="actions">' +
        (!correct && !solution ? '<button class="btn ghost" type="button" data-act="solution">Lösung zeigen</button>' : '') +
        '<button class="btn ghost" type="button" data-act="retry">Noch einmal üben</button>' +
        '<a class="btn" href="#bewertung">Zur Bewertung</a>' +
        (next ? '<a class="btn ghost" href="#' + next.id + '">Nächste Aufgabe</a>' : '') + '</div></div>';
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
          store.results[id] = { correct: !!res.correct, answer: res.answer, at: new Date().toISOString() };
          save();
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
      '<section class="intro"><p class="eyebrow">Auswertung · ' + viewLabel() + '</p><h1>Bewertung</h1>' +
      '<p>Dein Stand bei den ' + scored.length + ' spielbaren Aufgaben' + (alle ? '' : ' dieser Klassenstufe') + '. Gewertet wird jeweils der erste Versuch.</p></section>' +
      '<div class="score-top">' +
      '<div class="stat hero"><span class="v num">' + total + ' <small>/ ' + maxPts + '</small></span><span class="l">Punkte</span></div>' +
      '<div class="stat"><span class="v num">' + right + ' <small>/ ' + tried + '</small></span><span class="l">richtig beantwortet</span></div>' +
      '<div class="stat"><span class="v num">' + pct + ' <small>%</small></span><span class="l">Trefferquote</span></div>' +
      '<div class="stat"><span class="v num">' + tried + ' <small>/ ' + scored.length + '</small></span><span class="l">Aufgaben bearbeitet</span></div></div>' +
      '<section class="panel"><h2>Nach Schwierigkeit</h2><div class="tbl-wrap"><table class="res"><thead><tr><th>Stufe</th><th class="r">Aufgaben</th><th class="r">bearbeitet</th><th class="r">richtig</th><th class="r">Punkte</th></tr></thead><tbody>' + levels + '</tbody></table></div></section>' +
      '<section class="panel"><h2>' + (alle ? 'Alle 37 Aufgaben' : 'Alle Aufgaben') + '</h2><div class="tbl-wrap"><table class="res"><thead><tr><th>Nr.</th><th>Aufgabe</th><th>Stufe</th><th>Status</th><th class="r">Punkte</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="note">Punkteschema: einfach +6 / −2, mittel +9 / −3, schwer +12 / −4, ohne Antwort 0 (üblich beim Bebras, im Biberheft nicht angegeben). ' +
      (alle ? 'In der Ansicht „Alle Aufgaben“ zählt die Stufe der jüngsten Klassenstufe, in der die Aufgabe vorkommt; mit „Nach Klasse“ zählt die Stufe der gewählten Klasse. ' : '') +
      'Das Heft liegt ohne Lösungen vor; die Lösungen wurden aus den Aufgabenstellungen abgeleitet und sollten mit den offiziellen Lösungen abgeglichen werden.</p>' +
      '<div class="actions">' + resetBtn + '</div></section>';
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
    var page = h === 'bewertung' ? 'bewertung' : 'aufgaben';
    document.querySelectorAll('.nav a').forEach(function (a) {
      a.setAttribute('aria-current', a.dataset.nav === page ? 'page' : 'false');
    });
    syncControls();
    if (h === 'bewertung') { confirmReset = false; renderResults(); }
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
  app.addEventListener('click', function (e) {
    var act = e.target.closest('[data-act^="reset-"]');
    if (!act) return;
    if (act.dataset.act === 'reset-ask') confirmReset = true;
    if (act.dataset.act === 'reset-no') confirmReset = false;
    if (act.dataset.act === 'reset-yes') {
      listFor().forEach(function (t) { if (t.id) delete store.results[t.id]; });
      save();
      confirmReset = false;
    }
    renderResults();
  });
  window.addEventListener('hashchange', route);
  route();

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
