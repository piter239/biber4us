(function () {
  'use strict';

  var TASKS = window.BIBER_TASKS;
  var SCORING = window.BIBER_SCORING;
  var STORE_KEY = 'biber2025.ergebnisse.v1';
  var app = document.getElementById('app');

  /* ---------- Speicher (localStorage, mit Fallback im Arbeitsspeicher) ---------- */
  var memory = {};
  function load() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      if (raw) memory = JSON.parse(raw) || {};
    } catch (e) { /* ohne Speicher weiterarbeiten */ }
    return memory;
  }
  function save() {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(memory)); } catch (e) { /* ignorieren */ }
  }
  load();

  /* ---------- Aufgabe Fingerfarben ---------- */
  var FF = {
    drawings: {
      z1: { alt: 'Zeichnung: senkrechter Stängel mit drei kleinen Knospen, zwei davon an Seitenzweigen', name: 'Stängel mit Seitenzweigen' },
      z2: { alt: 'Zeichnung: Grasbüschel mit einem hohen Bogen, der in einer Glocke endet', name: 'Gras mit Glockenblüte' },
      z3: { alt: 'Zeichnung: große gewellte Blüte auf kurzem Stiel mit zwei Blättern', name: 'Große Blüte' },
      z4: { alt: 'Zeichnung: zwei Stängel, die sich nach außen zu je einer Knospe biegen', name: 'Zwei Bögen mit Knospen' }
    },
    painted: [
      { id: 'b1', color: 'hellblau', answer: 'z2',
        why: 'Rechts oben schaut ein Stück des Bogens heraus, der in einer Knospe endet. Die Farbe links unten verdeckt die Grasblätter.' },
      { id: 'b2', color: 'rot', answer: 'z1',
        why: 'Unten in der Mitte ragt der senkrechte Stängel unter der Farbe hervor. Die Seitenzweige mit den Knospen liegen unter den roten Flächen.' },
      { id: 'b3', color: 'lila', answer: 'z4',
        why: 'Zwei gleich hohe Farbflecken links und rechts passen zu den zwei Knospen. Rechts ist ein Stück des gebogenen Stängels zu sehen.' },
      { id: 'b4', color: 'blau', answer: 'z3',
        why: 'Die Farbfläche ist die größte und deckt fast alles ab, wie bei der großen gewellten Blüte. Die anderen drei Zeichnungen sind schon vergeben.' }
    ],
    order: ['z1', 'z2', 'z3', 'z4']
  };
  var ffState = { slots: [null, null, null, null], selected: null, checked: false, dragging: null };

  function ffImg(id, cls) {
    var alt = FF.drawings[id] ? FF.drawings[id].alt : '';
    return '<img class="' + (cls || 'card') + '" src="assets/fingerfarben/' + id + '.png" alt="' + alt + '" width="368" height="368" draggable="false">';
  }
  function slotOf(id) { return ffState.slots.indexOf(id); }

  function place(id, idx) {
    if (ffState.checked) return;
    var from = slotOf(id);
    var existing = ffState.slots[idx];
    ffState.slots[idx] = id;
    if (from >= 0) ffState.slots[from] = existing === id ? null : existing;
    ffState.selected = null;
    renderFingerfarben();
  }
  function release(id) {
    if (ffState.checked) return;
    var from = slotOf(id);
    if (from >= 0) ffState.slots[from] = null;
    ffState.selected = null;
    renderFingerfarben();
  }
  function isRight() {
    return FF.painted.every(function (p, i) { return ffState.slots[i] === p.answer; });
  }
  function scoreFor(task, right) {
    var s = SCORING[task.level];
    return right ? s.right : s.wrong;
  }

  function checkFingerfarben() {
    var task = TASKS[0];
    var right = isRight();
    ffState.checked = true;
    if (!memory.fingerfarben) {
      memory.fingerfarben = {
        correct: right,
        points: scoreFor(task, right),
        answer: ffState.slots.slice(),
        at: new Date().toISOString()
      };
      save();
    }
    renderFingerfarben();
  }
  function resetFingerfarben() {
    ffState = { slots: [null, null, null, null], selected: null, checked: false, dragging: null };
    renderFingerfarben();
  }
  function showSolution() {
    ffState.slots = FF.painted.map(function (p) { return p.answer; });
    ffState.checked = true;
    ffState.solution = true;
    renderFingerfarben();
  }

  function renderFingerfarben() {
    var task = TASKS[0];
    var st = ffState;
    var filled = st.slots.filter(Boolean).length;
    var firstTry = memory.fingerfarben;

    var pool = FF.order.map(function (id) {
      if (st.slots.indexOf(id) >= 0) return '<div class="pool-cell" aria-hidden="true"></div>';
      var sel = st.selected === id ? ' selected' : '';
      return '<button type="button" class="drawing' + sel + '" data-drawing="' + id + '" draggable="true"' +
        ' aria-pressed="' + (st.selected === id) + '" aria-label="' + FF.drawings[id].name + '"' + (st.checked ? ' disabled' : '') + '>' +
        ffImg(id) + '</button>';
    }).join('');

    var pairs = FF.painted.map(function (p, i) {
      var id = st.slots[i];
      var cls = 'slot' + (id ? ' filled' : '');
      var mark = '';
      if (st.checked && !st.solution) {
        var ok = id === p.answer;
        cls += ok ? ' right' : ' wrong';
        mark = '<span class="mark" aria-hidden="true">' + (ok ? '✓' : '✗') + '</span>';
      } else if (st.solution) {
        cls += ' right';
      }
      var label = 'Feld unter dem ' + p.color + ' bemalten Bild: ' + (id ? FF.drawings[id].name : 'leer');
      var inner = id ? ffImg(id) : '<span class="ph">hierher</span>';
      return '<div class="pair">' +
        '<img src="assets/fingerfarben/' + p.id + '.png" alt="Bemaltes Bild, ' + p.color + '" width="368" height="368" draggable="false">' +
        '<button type="button" class="' + cls + '" data-slot="' + i + '"' + (id ? ' draggable="true" data-in-slot="' + id + '"' : '') +
        ' aria-label="' + label + '"' + (st.checked ? ' disabled' : '') + '>' + inner + mark + '</button></div>';
    }).join('');

    var status;
    if (st.checked) status = firstTry ? 'Deine erste Antwort zählt für die Bewertung.' : '';
    else if (filled < 4) status = filled + ' von 4 Feldern belegt';
    else status = 'Alle Felder belegt. Du kannst prüfen.';

    var feedback = '';
    if (st.checked) {
      var right = st.solution ? null : isRight();
      var why = FF.painted.map(function (p) {
        return '<li>' + ffImg(p.answer, '') .replace('<img class=""', '<img') +
          '<div><strong>Bemalt in ' + p.color + '</strong><span>' + p.why + '</span></div></li>';
      }).join('');
      var head;
      if (st.solution) {
        head = '<div class="feedback bad"><h2>So passt es zusammen</h2>';
      } else if (right) {
        head = '<div class="feedback ok"><h2>Richtig! +' + SCORING[task.level].right + ' Punkte</h2>';
      } else {
        head = '<div class="feedback bad"><h2>Nicht ganz. ' + SCORING[task.level].wrong + ' Punkte</h2>';
      }
      feedback = head +
        '<p>' + (st.solution || !right
          ? 'Achte auf Reste der Zeichnung, die unter der Farbe hervorschauen: Ort, Richtung und Zahl der Knospen verraten die Zeichnung.'
          : 'Bei jedem Bild verraten Reste der Zeichnung, welche Blume darunter liegt.') + '</p>' +
        '<ul class="why">' + why + '</ul>' +
        '<div class="actions">' +
        (!st.solution && !right ? '<button class="btn ghost" type="button" data-act="solution">Lösung zeigen</button>' : '') +
        '<button class="btn ghost" type="button" data-act="retry">Noch einmal üben</button>' +
        '<a class="btn" href="#bewertung">Zur Bewertung</a></div></div>';
    }

    app.innerHTML =
      '<p class="crumbs"><a href="#">← Alle Aufgaben</a></p>' +
      '<article class="task">' +
      '<header class="task-head">' +
      '<div class="chips"><span class="chip">Klasse ' + task.ages + ' · ' + task.level + '</span>' +
      '<span class="chip">Heft S. ' + task.page + '</span></div>' +
      '<h1>' + task.title + '</h1>' +
      '<p class="eyebrow">' + task.topic + '</p>' +
      '<p class="story">Lars hat Blumen gezeichnet. Seine kleine Schwester Carlotta findet die Zeichnungen und bemalt sie mit Fingerfarben.</p>' +
      '<h2 class="question">Wie sahen die bemalten Zeichnungen vorher aus?</h2>' +
      '<p class="howto">Ziehe jede Zeichnung in das gelbe Feld unter dem passenden bemalten Bild. Du kannst auch erst die Zeichnung und dann das Feld antippen.</p>' +
      '</header>' +
      '<div class="board">' +
      '<section aria-label="Zeichnungen"><h3>Zeichnungen</h3><div class="pool" data-pool>' + pool + '</div></section>' +
      '<section aria-label="Bemalte Bilder"><h3>Bemalte Bilder</h3><div class="painted">' + pairs + '</div></section>' +
      '<div class="board-foot"><span class="status-line" role="status">' + status + '</span>' +
      '<div class="actions">' +
      (st.checked ? '' : '<button class="btn ghost" type="button" data-act="reset"' + (filled ? '' : ' disabled') + '>Zurücksetzen</button>' +
        '<button class="btn" type="button" data-act="check"' + (filled === 4 ? '' : ' disabled') + '>Antwort prüfen</button>') +
      '</div></div></div>' +
      feedback +
      '<nav class="task-nav" aria-label="Aufgabennavigation"><a class="btn ghost" href="#">Aufgabenliste</a>' +
      '<span class="chip soon">Nächste Aufgabe: Flugzeuge folgt</span></nav>' +
      '</article>';
  }

  function onFingerfarbenClick(e) {
    var t = e.target.closest('[data-drawing],[data-slot],[data-act]');
    if (!t || ffState.checked && !t.dataset.act) return;
    if (t.dataset.act === 'check') return checkFingerfarben();
    if (t.dataset.act === 'reset' || t.dataset.act === 'retry') return resetFingerfarben();
    if (t.dataset.act === 'solution') return showSolution();
    if (t.dataset.drawing) {
      ffState.selected = ffState.selected === t.dataset.drawing ? null : t.dataset.drawing;
      return renderFingerfarben();
    }
    if (t.dataset.slot) {
      var idx = +t.dataset.slot;
      if (ffState.selected) return place(ffState.selected, idx);
      if (ffState.slots[idx]) return release(ffState.slots[idx]);
    }
  }
  function onDragStart(e) {
    var t = e.target.closest('[data-drawing],[data-in-slot]');
    if (!t) return;
    ffState.dragging = t.dataset.drawing || t.dataset.inSlot;
    e.dataTransfer.setData('text/plain', ffState.dragging);
    e.dataTransfer.effectAllowed = 'move';
    t.classList.add('dragging');
  }
  function onDragOver(e) {
    var s = e.target.closest('[data-slot],[data-pool]');
    if (!s || !ffState.dragging) return;
    e.preventDefault();
    if (s.dataset.slot) s.classList.add('over');
  }
  function onDragLeave(e) {
    var s = e.target.closest('[data-slot]');
    if (s) s.classList.remove('over');
  }
  function onDrop(e) {
    var s = e.target.closest('[data-slot],[data-pool]');
    if (!s || !ffState.dragging) return;
    e.preventDefault();
    var id = ffState.dragging;
    ffState.dragging = null;
    if (s.dataset.slot) place(id, +s.dataset.slot); else release(id);
  }
  function onDragEnd() {
    ffState.dragging = null;
    renderFingerfarben();
  }

  /* ---------- Übersicht ---------- */
  function statusOf(t) {
    if (!t.ready) return { cls: 'soon', label: 'folgt noch' };
    var r = memory[t.id];
    if (!r) return { cls: 'open', label: 'offen' };
    return r.correct ? { cls: 'ok', label: 'richtig' } : { cls: 'bad', label: 'falsch' };
  }
  function renderOverview() {
    var done = TASKS.filter(function (t) { return t.ready && memory[t.id]; }).length;
    var ready = TASKS.filter(function (t) { return t.ready; }).length;
    var rows = TASKS.map(function (t, i) {
      var s = statusOf(t);
      var inner =
        '<span class="rank num">' + (i + 1) + '</span>' +
        '<span class="t-title">' + t.title + '</span>' +
        '<span class="t-topic">' + t.topic + '</span>' +
        '<span class="t-state"><span class="chip ' + s.cls + '">' + s.label + '</span>' +
        '<span class="num">' + (t.ready ? 'Klasse ' + t.ages + ' · ' + t.level + ' · ' : '') + 'Heft S. ' + t.page + '</span></span>';
      return t.ready
        ? '<li><a class="task-row" href="#' + t.id + '">' + inner + '</a></li>'
        : '<li><div class="task-row soon">' + inner + '</div></li>';
    }).join('');
    app.innerHTML =
      '<section class="intro"><p class="eyebrow">Informatik-Biber 2025</p>' +
      '<h1>Die 37 Aufgaben zum Ausprobieren</h1>' +
      '<p>Die Reihenfolge folgt der Aufgabenliste auf Seite 6 des Biberhefts: nach ungefähr steigender Schwierigkeit. ' +
      'Du beginnst mit Fingerfarben. Die weiteren Aufgaben kommen nach und nach dazu.</p></section>' +
      '<div class="progress"><div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="' + TASKS.length + '" aria-valuenow="' + done + '"><i style="width:' + (done / TASKS.length * 100) + '%"></i></div>' +
      '<small class="num">' + done + ' von ' + TASKS.length + ' Aufgaben bearbeitet · ' + ready + ' spielbar</small></div>' +
      '<div class="actions" style="margin-top:1rem"><a class="btn" href="#fingerfarben">' + (memory.fingerfarben ? 'Fingerfarben ansehen' : 'Mit Fingerfarben starten') + '</a>' +
      '<a class="btn ghost" href="#bewertung">Bewertung</a></div>' +
      '<ol class="tasklist">' + rows + '</ol>';
  }

  /* ---------- Bewertung ---------- */
  var confirmReset = false;
  function renderResults() {
    var task = TASKS[0];
    var r = memory.fingerfarben;
    var total = 0, maxPts = 0, right = 0, wrong = 0, tried = 0;
    TASKS.forEach(function (t) {
      if (!t.ready) return;
      maxPts += SCORING[t.level].right;
      var res = memory[t.id];
      if (!res) return;
      tried++;
      total += res.points;
      if (res.correct) right++; else wrong++;
    });
    var ready = TASKS.filter(function (t) { return t.ready; }).length;
    var pct = tried ? Math.round(right / tried * 100) : 0;

    var rows = TASKS.map(function (t, i) {
      var s = statusOf(t);
      var res = memory[t.id];
      var pts = res ? (res.points > 0 ? '+' + res.points : String(res.points)) : '–';
      return '<tr class="' + (t.ready ? '' : 'dim') + '"><td class="num">' + (i + 1) + '</td><td>' + t.title +
        '</td><td>' + (t.ready ? t.level : '–') + '</td><td><span class="chip ' + s.cls + '">' + s.label +
        '</span></td><td class="r num">' + pts + '</td></tr>';
    }).join('');

    var detail;
    if (!r) {
      detail = '<div class="empty">Noch keine Antwort. <a href="#fingerfarben">Löse zuerst Fingerfarben</a>, dann erscheint hier die Auswertung.</div>';
    } else {
      var cmps = FF.painted.map(function (p, i) {
        var given = r.answer[i];
        var ok = given === p.answer;
        var left = given ? ffImg(given, '') : '';
        return '<div class="cmp ' + (ok ? 'ok' : 'bad') + '"><div class="pic">' +
          '<img src="assets/fingerfarben/' + p.id + '.png" alt="Bemaltes Bild, ' + p.color + '" width="368" height="368">' +
          (given ? left.replace('<img class=""', '<img') : '<span></span>') + '</div>' +
          '<span class="cap"><b>' + (ok ? '✓ richtig' : '✗ falsch') + '</b> · ' + p.color +
          (ok ? '' : '<br>Richtig wäre: ' + FF.drawings[p.answer].name) + '</span></div>';
      }).join('');
      detail = '<div class="compare">' + cmps + '</div>' +
        '<p class="note">Gewertet wird dein erster Versuch: ' +
        (r.correct ? 'alle vier Zuordnungen stimmen, das gibt ' + SCORING[task.level].right + ' Punkte.' :
          'mindestens eine Zuordnung stimmt nicht, das ergibt ' + SCORING[task.level].wrong + ' Punkte.') + '</p>';
    }

    var resetBtn = confirmReset
      ? '<span class="note">Alle Ergebnisse löschen?</span><button class="btn danger" type="button" data-act="reset-yes">Ja, löschen</button><button class="btn ghost" type="button" data-act="reset-no">Abbrechen</button>'
      : '<button class="btn ghost" type="button" data-act="reset-ask"' + (tried ? '' : ' disabled') + '>Bewertung zurücksetzen</button>';

    app.innerHTML =
      '<section class="intro"><p class="eyebrow">Auswertung</p><h1>Bewertung</h1>' +
      '<p>Dein Stand bei den Aufgaben des Informatik-Biber 2025.</p></section>' +
      '<div class="score-top">' +
      '<div class="stat hero"><span class="v num">' + total + ' <small>/ ' + maxPts + '</small></span><span class="l">Punkte (bei ' + ready + ' spielbarer Aufgabe)</span></div>' +
      '<div class="stat"><span class="v num">' + right + ' <small>/ ' + tried + '</small></span><span class="l">richtig beantwortet</span></div>' +
      '<div class="stat"><span class="v num">' + pct + ' <small>%</small></span><span class="l">Trefferquote</span></div>' +
      '<div class="stat"><span class="v num">' + tried + ' <small>/ ' + TASKS.length + '</small></span><span class="l">Aufgaben bearbeitet</span></div>' +
      '</div>' +
      '<section class="panel"><h2>Fingerfarben</h2><div class="chips"><span class="chip">Klasse ' + task.ages + ' · ' + task.level + '</span></div>' + detail + '</section>' +
      '<section class="panel"><h2>Alle Aufgaben</h2><div class="tbl-wrap"><table class="res"><thead><tr><th>Nr.</th><th>Aufgabe</th><th>Stufe</th><th>Status</th><th class="r">Punkte</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="note">Punkteschema: einfach +6 / −2, mittel +9 / −3, schwer +12 / −4, ohne Antwort 0 (üblich beim Bebras, im Biberheft nicht angegeben). ' +
      'Das Heft liegt ohne Lösungen vor. Die Lösung von Fingerfarben wurde aus den Abbildungen abgeleitet und sollte mit der offiziellen Lösung abgeglichen werden.</p>' +
      '<div class="actions">' + resetBtn + '</div></section>';
  }

  /* ---------- Router ---------- */
  function route() {
    var h = (location.hash || '').replace(/^#/, '');
    var links = document.querySelectorAll('.nav a');
    var page = h === 'bewertung' ? 'bewertung' : 'aufgaben';
    links.forEach(function (a) { a.setAttribute('aria-current', a.dataset.nav === page ? 'page' : 'false'); });
    if (h === 'fingerfarben') {
      if (memory.fingerfarben && !ffState.checked && !ffState.slots.some(Boolean)) {
        ffState.slots = memory.fingerfarben.answer.slice();
        ffState.checked = true;
      }
      renderFingerfarben();
    } else if (h === 'bewertung') {
      confirmReset = false;
      renderResults();
    } else {
      renderOverview();
    }
    window.scrollTo(0, 0);
  }

  app.addEventListener('click', function (e) {
    var act = e.target.closest('[data-act]');
    if (act && act.dataset.act.indexOf('reset-') === 0) {
      if (act.dataset.act === 'reset-ask') confirmReset = true;
      if (act.dataset.act === 'reset-no') confirmReset = false;
      if (act.dataset.act === 'reset-yes') {
        memory = {};
        save();
        ffState = { slots: [null, null, null, null], selected: null, checked: false, dragging: null };
        confirmReset = false;
      }
      return renderResults();
    }
    if (location.hash === '#fingerfarben') onFingerfarbenClick(e);
  });
  app.addEventListener('dragstart', onDragStart);
  app.addEventListener('dragover', onDragOver);
  app.addEventListener('dragleave', onDragLeave);
  app.addEventListener('drop', onDrop);
  app.addEventListener('dragend', onDragEnd);
  window.addEventListener('hashchange', route);
  route();
})();
