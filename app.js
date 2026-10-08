(function () {
  'use strict';

  var TASKS = window.BIBER_TASKS;
  var SCORING = window.BIBER_SCORING;
  var B = window.Biber;
  var GROUPS = ['3-4', '5-6'];
  var LEVEL_RANK = { einfach: 0, mittel: 1, schwer: 2 };
  var STORE_KEY = 'biber2025.v2';
  var app = document.getElementById('app');

  /* ---------- Speicher (localStorage, mit Fallback im Arbeitsspeicher) ---------- */
  var store = { group: '3-4', results: {} };
  try {
    var raw = window.localStorage.getItem(STORE_KEY);
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.results) store = parsed;
    }
  } catch (e) { /* ohne Speicher weiterarbeiten */ }
  if (GROUPS.indexOf(store.group) < 0) store.group = '3-4';
  function save() {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* ignorieren */ }
  }

  /* ---------- Aufgabenlisten ---------- */
  function byId(id) { return TASKS.filter(function (t) { return t.id === id; })[0]; }
  function rankOf(t) { return TASKS.indexOf(t); }
  function listFor(group) {
    return TASKS.filter(function (t) { return t.groups && t.groups[group]; })
      .sort(function (a, b) {
        return LEVEL_RANK[a.groups[group]] - LEVEL_RANK[b.groups[group]] || rankOf(a) - rankOf(b);
      });
  }
  function laterTasks() { return TASKS.filter(function (t) { return !t.groups; }); }
  function resultKey(group, id) { return group + ':' + id; }
  function resultOf(group, t) { return store.results[resultKey(group, t.id)]; }
  function isReady(t) { return !!B.modules[t.id]; }
  function groupLabel(g) { return 'Klasse ' + g.replace('-', '–'); }
  function pts(n) { return n > 0 ? '+' + n : String(n); }
  function statusOf(group, t) {
    if (!isReady(t)) return { cls: 'soon', label: 'folgt noch' };
    var r = resultOf(group, t);
    if (!r) return { cls: 'open', label: 'offen' };
    return r.correct ? { cls: 'ok', label: 'richtig' } : { cls: 'bad', label: 'falsch' };
  }

  /* ---------- Übersicht ---------- */
  function renderOverview() {
    var g = store.group;
    var list = listFor(g);
    var done = list.filter(function (t) { return resultOf(g, t); }).length;
    var firstOpen = list.filter(function (t) { return isReady(t) && !resultOf(g, t); })[0];
    var rows = list.map(function (t, i) {
      var s = statusOf(g, t);
      var level = t.groups[g];
      var inner =
        '<span class="rank num">' + (i + 1) + '</span>' +
        '<span class="t-title">' + t.title + '</span>' +
        '<span class="t-topic">' + t.topic + '</span>' +
        '<span class="t-state"><span class="chip ' + s.cls + '">' + s.label + '</span>' +
        '<span class="num"><span class="chip ' + level + '">' + level + '</span> Heft S. ' + t.page + '</span></span>';
      return isReady(t)
        ? '<li><a class="task-row" href="#' + t.id + '">' + inner + '</a></li>'
        : '<li><div class="task-row soon">' + inner + '</div></li>';
    }).join('');
    var later = laterTasks().map(function (t) {
      return '<li><div class="task-row soon"><span class="rank num">·</span><span class="t-title">' + t.title +
        '</span><span class="t-topic">' + t.topic + '</span><span class="t-state"><span class="num">Heft S. ' + t.page + '</span></span></div></li>';
    }).join('');
    app.innerHTML =
      '<section class="intro"><p class="eyebrow">Informatik-Biber 2025 · ' + groupLabel(g) + '</p>' +
      '<h1>' + list.length + ' Aufgaben zum Ausprobieren</h1>' +
      '<p>Die Aufgaben stehen von einfach bis schwer, innerhalb einer Stufe in der Reihenfolge der Aufgabenliste auf Seite 6 des Biberhefts. ' +
      'Oben rechts wechselst du zwischen Klasse 3–4 und Klasse 5–6.</p></section>' +
      '<div class="progress"><div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + list.length + '" aria-valuenow="' + done + '"><i style="width:' + (done / list.length * 100) + '%"></i></div>' +
      '<small class="num">' + done + ' von ' + list.length + ' Aufgaben bearbeitet</small></div>' +
      '<div class="actions" style="margin-top:1rem">' +
      (firstOpen ? '<a class="btn" href="#' + firstOpen.id + '">' + (done ? 'Weiter mit ' + firstOpen.title : 'Mit ' + firstOpen.title + ' starten') + '</a>' : '') +
      '<a class="btn ghost" href="#bewertung">Bewertung</a></div>' +
      '<ol class="tasklist">' + rows + '</ol>' +
      '<details class="later"><summary>Ab Klasse 7 · ' + laterTasks().length + ' weitere Aufgaben (noch nicht umgesetzt)</summary>' +
      '<ol class="tasklist">' + later + '</ol></details>';
  }

  /* ---------- Aufgabenansicht ---------- */
  var current = null;

  function renderTask(id) {
    var t = byId(id);
    var g = store.group;
    if (!t || !t.groups) return renderOverview();
    if (!t.groups[g]) {
      g = GROUPS.filter(function (x) { return t.groups[x]; })[0];
      store.group = g;
      save();
      syncGroupButtons();
    }
    var level = t.groups[g];
    var mod = B.modules[id];
    var list = listFor(g);
    var idx = list.indexOf(t);
    var next = list[idx + 1];
    var saved = resultOf(g, t);

    app.innerHTML =
      '<p class="crumbs"><a href="#">← Alle Aufgaben</a></p>' +
      '<article class="task t-' + id + '">' +
      '<header class="task-head">' +
      '<div class="chips"><span class="chip ' + level + '">' + groupLabel(g) + ' · ' + level + '</span>' +
      '<span class="chip">Aufgabe ' + (idx + 1) + ' von ' + list.length + '</span><span class="chip">Heft S. ' + t.page + '</span></div>' +
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
      (next ? (isReady(next) ? '<a class="btn ghost" href="#' + next.id + '">Nächste: ' + next.title + ' →</a>'
        : '<span class="chip soon">Nächste: ' + next.title + ' folgt</span>')
        : '<a class="btn ghost" href="#bewertung">Zur Bewertung</a>') + '</nav></article>';
    if (!mod) return;

    var el = app.querySelector('[data-mount]');
    var statusEl = app.querySelector('[data-status]');
    var bar = app.querySelector('[data-bar]');
    var fb = app.querySelector('[data-feedback]');
    var st = { locked: false, checked: false, text: '' };
    current = st;

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
      group: g,
      level: level,
      locked: function () { return st.locked; },
      changed: function (text) { if (typeof text === 'string') st.text = text; else st.text = ''; if (!st.checked) refreshBar(); }
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
        (next && isReady(next) ? '<a class="btn ghost" href="#' + next.id + '">Nächste Aufgabe</a>' : '') + '</div></div>';
    }
    function lock(on) { st.locked = on; mod.lock(on); }

    if (saved) {
      mod.setAnswer(saved.answer);
      lock(true);
      st.checked = true;
      refreshBar();
      showFeedback(saved.correct, saved.points, true, false);
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
        var counts = !resultOf(g, t);
        var points = SCORING[level][res.correct ? 'right' : 'wrong'];
        if (counts) {
          store.results[resultKey(g, id)] = { correct: !!res.correct, points: points, answer: res.answer, at: new Date().toISOString() };
          save();
        }
        lock(true);
        st.checked = true;
        refreshBar();
        showFeedback(res.correct, points, counts, false);
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
    var g = store.group;
    var list = listFor(g);
    var total = 0, maxPts = 0, right = 0, tried = 0;
    var perLevel = { einfach: { n: 0, tried: 0, right: 0, pts: 0, max: 0 }, mittel: { n: 0, tried: 0, right: 0, pts: 0, max: 0 }, schwer: { n: 0, tried: 0, right: 0, pts: 0, max: 0 } };
    list.forEach(function (t) {
      var lv = t.groups[g];
      var p = perLevel[lv];
      p.n++;
      p.max += SCORING[lv].right;
      maxPts += SCORING[lv].right;
      var r = resultOf(g, t);
      if (!r) return;
      tried++; p.tried++;
      total += r.points; p.pts += r.points;
      if (r.correct) { right++; p.right++; }
    });
    var pct = tried ? Math.round(right / tried * 100) : 0;

    var rows = list.map(function (t, i) {
      var s = statusOf(g, t);
      var r = resultOf(g, t);
      return '<tr class="' + (isReady(t) ? '' : 'dim') + '"><td class="num">' + (i + 1) + '</td>' +
        '<td>' + (isReady(t) ? '<a href="#' + t.id + '">' + t.title + '</a>' : t.title) + '</td>' +
        '<td><span class="chip ' + t.groups[g] + '">' + t.groups[g] + '</span></td>' +
        '<td><span class="chip ' + s.cls + '">' + s.label + '</span></td>' +
        '<td class="r num">' + (r ? pts(r.points) : '–') + '</td></tr>';
    }).join('');
    var levels = ['einfach', 'mittel', 'schwer'].map(function (lv) {
      var p = perLevel[lv];
      if (!p.n) return '';
      return '<tr><td><span class="chip ' + lv + '">' + lv + '</span></td><td class="r num">' + p.n + '</td><td class="r num">' + p.tried +
        '</td><td class="r num">' + p.right + '</td><td class="r num">' + pts(p.pts).replace('+0', '0') + ' / ' + p.max + '</td></tr>';
    }).join('');

    var resetBtn = confirmReset
      ? '<span class="note">Alle Ergebnisse für ' + groupLabel(g) + ' löschen?</span><button class="btn danger" type="button" data-act="reset-yes">Ja, löschen</button><button class="btn ghost" type="button" data-act="reset-no">Abbrechen</button>'
      : '<button class="btn ghost" type="button" data-act="reset-ask"' + (tried ? '' : ' disabled') + '>Bewertung zurücksetzen</button>';

    app.innerHTML =
      '<section class="intro"><p class="eyebrow">Auswertung · ' + groupLabel(g) + '</p><h1>Bewertung</h1>' +
      '<p>Dein Stand bei den ' + list.length + ' Aufgaben dieser Klassenstufe. Gewertet wird jeweils der erste Versuch.</p></section>' +
      '<div class="score-top">' +
      '<div class="stat hero"><span class="v num">' + total + ' <small>/ ' + maxPts + '</small></span><span class="l">Punkte</span></div>' +
      '<div class="stat"><span class="v num">' + right + ' <small>/ ' + tried + '</small></span><span class="l">richtig beantwortet</span></div>' +
      '<div class="stat"><span class="v num">' + pct + ' <small>%</small></span><span class="l">Trefferquote</span></div>' +
      '<div class="stat"><span class="v num">' + tried + ' <small>/ ' + list.length + '</small></span><span class="l">Aufgaben bearbeitet</span></div></div>' +
      '<section class="panel"><h2>Nach Schwierigkeit</h2><div class="tbl-wrap"><table class="res"><thead><tr><th>Stufe</th><th class="r">Aufgaben</th><th class="r">bearbeitet</th><th class="r">richtig</th><th class="r">Punkte</th></tr></thead><tbody>' + levels + '</tbody></table></div></section>' +
      '<section class="panel"><h2>Alle Aufgaben</h2><div class="tbl-wrap"><table class="res"><thead><tr><th>Nr.</th><th>Aufgabe</th><th>Stufe</th><th>Status</th><th class="r">Punkte</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="note">Punkteschema: einfach +6 / −2, mittel +9 / −3, schwer +12 / −4, ohne Antwort 0 (üblich beim Bebras, im Biberheft nicht angegeben). ' +
      'Das Heft liegt ohne Lösungen vor; die Lösungen wurden aus den Aufgabenstellungen abgeleitet und sollten mit den offiziellen Lösungen abgeglichen werden.</p>' +
      '<div class="actions">' + resetBtn + '</div></section>';
  }

  /* ---------- Router ---------- */
  function syncGroupButtons() {
    document.querySelectorAll('.seg button').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.group === store.group ? 'true' : 'false');
    });
  }
  function route() {
    var h = (location.hash || '').replace(/^#/, '');
    var page = h === 'bewertung' ? 'bewertung' : 'aufgaben';
    document.querySelectorAll('.nav a').forEach(function (a) {
      a.setAttribute('aria-current', a.dataset.nav === page ? 'page' : 'false');
    });
    syncGroupButtons();
    current = null;
    if (h === 'bewertung') { confirmReset = false; renderResults(); }
    else if (h && byId(h)) renderTask(h);
    else renderOverview();
    window.scrollTo(0, 0);
  }

  document.querySelector('.seg').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-group]');
    if (!b || b.dataset.group === store.group) return;
    store.group = b.dataset.group;
    save();
    var h = (location.hash || '').replace(/^#/, '');
    var t = byId(h);
    if (t && !(t.groups && t.groups[store.group])) location.hash = '#';
    else route();
  });
  app.addEventListener('click', function (e) {
    var act = e.target.closest('[data-act^="reset-"]');
    if (!act) return;
    if (act.dataset.act === 'reset-ask') confirmReset = true;
    if (act.dataset.act === 'reset-no') confirmReset = false;
    if (act.dataset.act === 'reset-yes') {
      Object.keys(store.results).forEach(function (k) { if (k.indexOf(store.group + ':') === 0) delete store.results[k]; });
      save();
      confirmReset = false;
    }
    renderResults();
  });
  window.addEventListener('hashchange', route);
  route();
})();
