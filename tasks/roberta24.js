/* Aufgabe Robertas Roboter (Biber 2024, S. 53; Klasse 3-4 schwer, 7-8 einfach): Wegeplan, Tiefensuche / Backtracking */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-roberta24-';

  var ROWS = 5, COLS = 7;
  /* Anzeige-Spalten: 0 Start, 1 Kärtchen, 2 freie Stellen, 3 Kärtchen, 4 freie Stellen, 5 Kärtchen, 6 Ziel.
     Feste Kärtchen (von oben nach unten) laut Bild im Heft; r = rechts, l = links, u = hoch, d = runter */
  var FIXED = {
    1: ['r', 'd', 'r', 'u', 'u'],
    3: ['r', 'u', 'd', 'd', 'r'],
    5: ['d', 'd', 'r', 'r', 'u']
  };
  var START = { row: 4, col: 0 }, GOAL = { row: 2, col: 6 };
  var SLOT_COLS = [2, 4];
  var CARDS = ['r', 'r', 'u'];                 /* die drei Kärtchen zum Auslegen */
  var ARROW = { r: 'rechts', u: 'hoch', d: 'runter', l: 'links' };
  var DELTA = { r: [0, 1], l: [0, -1], u: [-1, 0], d: [1, 0] };
  /* Lösung laut Heft: Stelle (Spalte 2, Zeile 2) hoch, (Spalte 2, Zeile 1) rechts, (Spalte 4, Zeile 0) rechts */
  var SOLUTION = (function () { var s = {}; s['2,2'] = 'u'; s['2,1'] = 'r'; s['4,0'] = 'r'; return s; })();

  function slotKey(col, row) { return col + ',' + row; }
  var SLOTS = [];                              /* feste Reihenfolge der 10 freien Stellen */
  SLOT_COLS.forEach(function (c) { for (var r = 0; r < ROWS; r++) SLOTS.push({ col: c, row: r, key: slotKey(c, r) }); });

  /* Der Roboter fährt von Kärtchen zu Kärtchen. placed: {key -> 'r'|'u'} */
  function run(placed) {
    var path = [{ row: START.row, col: START.col }], seen = {}, cur = path[0], dir = 'r', outcome = 'ende';
    for (var step = 0; step < 60; step++) {
      var d = DELTA[dir], nr = cur.row + d[0], nc = cur.col + d[1];
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) { outcome = 'rand'; break; }
      if (!FIXED[nc] && SLOT_COLS.indexOf(nc) < 0 && !(nr === GOAL.row && nc === GOAL.col)) { outcome = 'rand'; break; }
      var nxt = { row: nr, col: nc };
      if (nr === GOAL.row && nc === GOAL.col) { path.push(nxt); outcome = 'ziel'; break; }
      var card = FIXED[nc] ? FIXED[nc][nr] : placed[slotKey(nc, nr)];
      if (!card) { path.push(nxt); outcome = 'leer'; break; }
      var k = nr + ',' + nc;
      if (seen[k]) { outcome = 'schleife'; break; }
      seen[k] = true;
      path.push(nxt);
      cur = nxt; dir = card;
    }
    return { path: path, outcome: outcome };
  }

  /* ---------- Zeichnung der Kärtchen ---------- */
  function cardSvg(kind, dir, extra) {
    /* kind: 'card' (hellgelb), 'start' (dunkelblau), 'goal' (orange), 'used' (Weg, orange) */
    var fill = { card: '#fbe9a2', start: '#2f3a78', goal: '#f28a1a', used: '#f7b25a' }[kind];
    var stroke = { card: '#c9b25a', start: '#1a2250', goal: '#a85a00', used: '#b87a20' }[kind];
    var ink = kind === 'start' ? '#f7b25a' : '#3b4a8c';
    var body = '<path d="M3 3 L33 3 L38 20 L33 37 L3 37 L8 20 Z" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.6" stroke-linejoin="round"/>';
    var inner = '';
    if (kind === 'goal') inner = '<circle cx="21" cy="20" r="8.5" fill="#111"/>';
    else if (dir) {
      var rot = { r: 0, d: 90, l: 180, u: 270 }[dir];
      inner = '<g transform="rotate(' + rot + ' 21 20)"><path d="M10 16 H22 V9 L33 20 L22 31 V24 H10 Z" fill="' + ink + '" stroke="' + (kind === 'start' ? '#000' : '#1f2a5c') + '" stroke-width="0.8" stroke-linejoin="round"/></g>';
    }
    return '<svg viewBox="0 0 41 40" class="' + P + 'cardsvg ' + (extra || '') + '" aria-hidden="true" focusable="false">' + body + inner + '</svg>';
  }
  var ROBOT = '<svg viewBox="0 0 40 40" class="' + P + 'robot" aria-hidden="true" focusable="false"><rect x="5" y="5" width="30" height="30" rx="6" fill="#3a8fe0" stroke="#173a66" stroke-width="2"/>' +
    '<circle cx="20" cy="20" r="8" fill="#f28a1a" stroke="#173a66" stroke-width="2"/><circle cx="20" cy="20" r="3.2" fill="#fbd9a0"/>' +
    '<circle cx="5" cy="5" r="3" fill="#8a949c"/><circle cx="35" cy="5" r="3" fill="#8a949c"/><circle cx="5" cy="35" r="3" fill="#8a949c"/><circle cx="35" cy="35" r="3" fill="#8a949c"/></svg>';

  var el, api, locked, mark;
  var placed, tray, selected, dragging, boardEl, trayEl, statusEl, runBtn, robotAt, trail, timer, running;

  function reset() { placed = {}; tray = [0, 1, 2]; selected = null; dragging = null; mark = null; stopRun(); }
  function stopRun() { if (timer) clearTimeout(timer); timer = null; running = false; trail = null; robotAt = START; }

  function cardIdAt(key) { return placed[key] != null ? placed[key].id : null; }
  /* placed: key -> {id, dir} ; für run() brauchen wir key -> dir */
  function dirMap() { var m = {}; Object.keys(placed).forEach(function (k) { m[k] = placed[k].dir; }); return m; }

  function place(id, key) {
    if (locked || running) return;
    var inTray = tray.indexOf(id);
    var prevKey = null;
    Object.keys(placed).forEach(function (k) { if (placed[k].id === id) prevKey = k; });
    var existing = placed[key];
    if (existing && existing.id === id) return;
    if (inTray >= 0) tray.splice(inTray, 1);
    if (prevKey) delete placed[prevKey];
    if (existing) {
      if (prevKey) placed[prevKey] = existing; else tray.push(existing.id);
    }
    placed[key] = { id: id, dir: CARDS[id] };
    selected = null; mark = null; trail = null; robotAt = START;
    render(); api.changed();
  }
  function unplace(key) {
    if (locked || running || !placed[key]) return;
    tray.push(placed[key].id);
    tray.sort();
    delete placed[key];
    selected = null; mark = null; trail = null; robotAt = START;
    render(); api.changed();
  }

  function cellLabel(c, r) {
    if (c === START.col && r === START.row) return 'Start, Pfeil nach rechts';
    if (c === GOAL.col && r === GOAL.row) return 'Ziel';
    if (FIXED[c]) return 'Kärtchen ' + ARROW[FIXED[c][r]];
    return '';
  }

  function render() {
    var res = run(dirMap());
    var onPath = {};
    if (trail) trail.forEach(function (p) { onPath[p.row + ',' + p.col] = true; });
    var cells = [];
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      var cls = P + 'cell', inner = '', attrs = { class: cls };
      var onp = !!onPath[r + ',' + c];
      if (c === START.col && r === START.row) {
        inner = cardSvg('start', 'r');
        attrs['aria-label'] = 'Start-Kärtchen, Pfeil nach rechts';
      } else if (c === GOAL.col && r === GOAL.row) {
        inner = cardSvg('goal');
        attrs['aria-label'] = 'Ziel-Kärtchen';
      } else if (FIXED[c]) {
        inner = cardSvg(onp ? 'used' : 'card', FIXED[c][r]);
        attrs['aria-label'] = 'Zeile ' + (r + 1) + ': festes Kärtchen ' + ARROW[FIXED[c][r]];
      } else if (SLOT_COLS.indexOf(c) >= 0) {
        var key = slotKey(c, r), pc = placed[key];
        attrs = { class: cls + ' ' + P + 'slot' + (pc ? ' filled' : ''), type: 'button', 'data-slot': key, disabled: locked || running,
          'aria-label': 'Freie Stelle, Spalte ' + (c / 2) + ', Zeile ' + (r + 1) + ': ' + (pc ? 'Kärtchen ' + ARROW[pc.dir] + ' (antippen zum Entfernen)' : (selected != null ? 'leer, hier ablegen' : 'leer')) };
        if (pc) inner = cardSvg(onp ? 'used' : 'card', pc.dir);
        else if (!locked && !running) attrs.class += ' ' + P + 'open';
      } else attrs['aria-hidden'] = 'true';
      var cell = h(c !== 0 && c !== 6 && SLOT_COLS.indexOf(c) >= 0 ? 'button' : 'div', attrs);
      if (inner) cell.innerHTML = inner;
      if (robotAt && robotAt.row === r && robotAt.col === c) {
        var rb = h('span', { class: P + 'rob' }); rb.innerHTML = ROBOT; cell.appendChild(rb);
      }
      cells.push(cell);
    }
    boardEl.replaceChildren.apply(boardEl, cells);

    trayEl.replaceChildren.apply(trayEl, CARDS.map(function (dir, id) {
      if (tray.indexOf(id) < 0) return h('span', { class: P + 'traygap', 'aria-hidden': 'true' });
      var b = h('button', {
        type: 'button', class: P + 'tcard' + (selected === id ? ' selected' : ''), 'data-card': String(id), draggable: locked ? false : 'true', disabled: locked || running,
        'aria-pressed': String(selected === id), 'aria-label': 'Kärtchen ' + ARROW[dir] + (selected === id ? ', ausgewählt' : '')
      });
      b.innerHTML = cardSvg('card', dir);
      return b;
    }));

    var ok = res.outcome === 'ziel' && Object.keys(placed).length === 3;
    if (mark && Object.keys(placed).length === 3) {
      boardEl.classList.toggle('right', ok); boardEl.classList.toggle('wrong', !ok);
    } else { boardEl.classList.remove('right', 'wrong'); }
    if (runBtn) runBtn.disabled = running;
  }

  function say(t) { statusEl.textContent = t; }
  function outcomeText(o) {
    return o === 'ziel' ? 'Der Roboter erreicht das Ziel!'
      : o === 'leer' ? 'Der Roboter fährt auf eine freie Stelle ohne Kärtchen und bleibt stehen.'
        : o === 'rand' ? 'Der Roboter fährt aus dem Wegeplan hinaus.'
          : o === 'schleife' ? 'Der Roboter fährt im Kreis.' : 'Der Roboter bleibt stehen.';
  }
  function startRun() {
    if (running) return;
    var res = run(dirMap());
    running = true; trail = [res.path[0]]; robotAt = res.path[0];
    render();
    var i = 0;
    (function stepOn() {
      i++;
      if (i >= res.path.length) {
        running = false; say(outcomeText(res.outcome)); render(); return;
      }
      robotAt = res.path[i]; trail = res.path.slice(0, i + 1);
      render();
      timer = setTimeout(stepOn, 330);
    })();
    say('Der Roboter fährt …');
  }

  function onClick(e) {
    if (locked || running) return;
    var t = e.target.closest('[data-card]');
    if (t) { selected = selected === +t.dataset.card ? null : +t.dataset.card; render(); say(selected != null ? 'Kärtchen ausgewählt. Tippe jetzt eine freie hellblaue Stelle an.' : ''); return; }
    var s = e.target.closest('[data-slot]');
    if (!s) return;
    if (selected != null) place(selected, s.dataset.slot);
    else if (placed[s.dataset.slot]) unplace(s.dataset.slot);
  }
  function onDragStart(e) {
    var t = e.target.closest('[data-card],[data-slot]');
    if (!t || locked || running) return;
    if (t.dataset.card != null) dragging = +t.dataset.card;
    else if (placed[t.dataset.slot]) dragging = placed[t.dataset.slot].id;
    else return;
    e.dataTransfer.setData('text/plain', String(dragging));
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e) {
    if (dragging == null) return;
    var s = e.target.closest('[data-slot],[data-tray]');
    if (!s) return;
    e.preventDefault();
    if (s.dataset.slot) s.classList.add('over');
  }
  function onDragLeave(e) { var s = e.target.closest('[data-slot]'); if (s) s.classList.remove('over'); }
  function onDrop(e) {
    if (dragging == null) return;
    var s = e.target.closest('[data-slot],[data-tray]');
    if (!s) return;
    e.preventDefault();
    var id = dragging; dragging = null;
    if (s.dataset.slot) place(id, s.dataset.slot);
    else {
      Object.keys(placed).forEach(function (k) { if (placed[k].id === id) unplace(k); });
    }
  }
  function onDragEnd() { dragging = null; render(); }

  Biber.register({
    id: 'roberta24',
    story:
      '<p>Robertas Roboter kann nur über besondere Kärtchen fahren. Mit den Kärtchen legt man einen Wegeplan. Der Roboter beginnt immer auf dem <b>Start-Kärtchen</b> (dunkelblau) und soll das <b>Ziel-Kärtchen</b> (orange) erreichen. ' +
      'Von einem Kärtchen mit Pfeil fährt er in Pfeilrichtung zum nächsten Kärtchen.</p>' +
      '<p>Auf dem Wegeplan fährt der Roboter zuerst nach rechts, dann hoch und noch einmal hoch. Dann würde er gern nach rechts fahren, aber dort liegt kein Kärtchen! Der Plan ist noch nicht fertig: Es gibt noch drei Kärtchen und zehn freie (hellblaue) Stellen, an die sie gelegt werden können.</p>',
    question: 'Lege die drei Kärtchen so, dass Robertas Roboter das Ziel erreicht.',
    howto: 'Tippe erst ein Kärtchen oben an und dann eine hellblaue Stelle, oder ziehe das Kärtchen dorthin. Tippe auf ein gelegtes Kärtchen, um es wieder wegzunehmen. Mit „Roboter fahren lassen“ siehst du, wohin der Roboter fährt.',
    explanation: function () {
      return '<p>Man probiert einen Weg aus und geht zurück, wenn er nicht zum Ziel führt. Der Roboter fährt zuerst nach rechts und zweimal hoch. Die freie Stelle rechts davon braucht ein Kärtchen. ' +
        'Läge dort „rechts“, führe er nach rechts, zweimal runter und wieder nach rechts. Mit den zwei übrigen Kärtchen (rechts oder hoch und darüber rechts) käme er danach aber nur unter das Ziel. Also muss dort „hoch“ liegen.</p>' +
        '<p>Dann bleibt für die Stelle über dem „hoch“ nur noch „rechts“, und das letzte „rechts“ gehört ganz oben in die rechte hellblaue Spalte. Von dort fährt der Roboter nach rechts, zweimal runter und noch einmal rechts ins Ziel. Es gibt nur diese eine richtige Lösung.</p>' +
        '<p>Diese Art zu suchen heißt in der Informatik <i>Tiefensuche</i>: Man verfolgt einen Weg vollständig und probiert erst dann einen anderen. Muss man dazu Schritte zurückgehen, nennt man das <i>Backtracking</i>. ' +
        'Hier geht es auch rückwärts schnell: Ins Ziel kommt man nur von oben rechts, dorthin nur von den obersten Kärtchen der Mitte.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      boardEl = h('div', { class: P + 'board', role: 'group', 'aria-label': 'Wegeplan mit 5 Zeilen und 3 Kärtchen-Spalten, dazwischen zwei Spalten mit freien Stellen' });
      trayEl = h('div', { class: P + 'tray', 'data-tray': '', role: 'group', 'aria-label': 'Die drei Kärtchen zum Auslegen' });
      statusEl = h('p', { class: P + 'status', role: 'status', 'aria-live': 'polite' });
      runBtn = h('button', { type: 'button', class: 'btn ghost ' + P + 'run', onclick: startRun }, 'Roboter fahren lassen');
      el.replaceChildren(h('div', { class: P + 'wrap' },
        h('section', { 'aria-label': 'Kärtchen' }, h('h3', null, 'Deine Kärtchen'), trayEl),
        h('section', { 'aria-label': 'Wegeplan' }, h('h3', null, 'Wegeplan'), boardEl),
        h('div', { class: P + 'ctl' }, runBtn), statusEl));
      el.addEventListener('click', onClick);
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('dragleave', onDragLeave);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', onDragEnd);
      render();
    },
    isComplete: function () { return Object.keys(placed).length === 3; },
    evaluate: function () {
      var ans = {};
      Object.keys(placed).forEach(function (k) { ans[k] = placed[k].dir; });
      return { correct: run(ans).outcome === 'ziel', answer: ans };
    },
    setAnswer: function (ans) {
      stopRun(); placed = {}; tray = [];
      var used = [];
      Object.keys(ans || {}).forEach(function (k) {
        var dir = ans[k], id = -1;
        for (var i = 0; i < CARDS.length; i++) if (CARDS[i] === dir && used.indexOf(i) < 0) { id = i; break; }
        if (id >= 0) { used.push(id); placed[k] = { id: id, dir: dir }; }
      });
      for (var j = 0; j < CARDS.length; j++) if (used.indexOf(j) < 0) tray.push(j);
      selected = null; mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? 'check' : null;
      if (!on) selected = null;
      render();
    },
    reset: function () { reset(); render(); say(''); },
    showSolution: function () {
      stopRun(); placed = {}; tray = [];
      var used = [];
      Object.keys(SOLUTION).forEach(function (k) {
        var dir = SOLUTION[k];
        for (var i = 0; i < CARDS.length; i++) if (CARDS[i] === dir && used.indexOf(i) < 0) { used.push(i); placed[k] = { id: i, dir: dir }; break; }
      });
      selected = null; mark = 'check'; locked = true;
      trail = run(dirMap()).path; robotAt = trail[trail.length - 1];
      render();
      say('Der Roboter fährt nach rechts, hoch, hoch, nach rechts, hoch, rechts, noch einmal rechts, zweimal runter und rechts ins Ziel.');
    }
  });
})();
