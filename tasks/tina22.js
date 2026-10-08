/* Aufgabe Roboter Tina (Heft 2022, Klasse 7-8 schwer, 9-10 mittel, 11-13 leicht): Systeme, Roboter, Sensoren/Aktoren */
(function () {
  'use strict';
  var h = Biber.h, S = Biber.svg;

  /* G = Wiese, R = Straße, T = Baum, H = Haus (Zeile für Zeile, von oben) */
  var MAP = [
    'GTGGGGGGGG',
    'GRRRHGRHGG',
    'GHGRGHRTGG',
    'GHGRTRRRHG',
    'GTTRTRTGTG',
    'RRRRRRRRTG',
    'GHHGTRTRGG',
    'GGGTHRHRTG',
    'GGRRRRRRGG',
    'GGGGGGGTGG'
  ].map(function (r) { return r.split(''); });
  var N = 10, CELL = 40;
  var START = { r: 5, c: 2, d: 1 };                       /* Richtung 0 = oben, 1 = rechts, 2 = unten, 3 = links */
  var DIRS = [[-1, 0], [0, 1], [1, 0], [0, -1]];
  /* Sensorwerte je Feld des Weges: links, vor, rechts */
  var TABLE = ['TRH', 'RRG', 'TRT', 'RRR', 'TRT', 'THR', 'RRT', 'HRT'];
  var POINTS = { A: [1, 1], B: [2, 6], C: [3, 7], D: [7, 7], E: [8, 4], F: [8, 6] };
  var LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
  var ANSWER = 'B';
  var NAME = { R: 'Straße', G: 'Wiese', T: 'Baum', H: 'Haus' };

  function cellAt(r, c) { return (MAP[r] && MAP[r][c]) || 'G'; }
  function sense(r, c, d) {
    return [cellAt(r + DIRS[(d + 3) % 4][0], c + DIRS[(d + 3) % 4][1]),
      cellAt(r + DIRS[d][0], c + DIRS[d][1]),
      cellAt(r + DIRS[(d + 1) % 4][0], c + DIRS[(d + 1) % 4][1])].join('');
  }
  /* Alle Wege suchen, die zur Tabelle passen (Selbsttest gegen die offizielle Lösung) */
  function paths() {
    var out = [];
    (function go(r, c, d, i, trail) {
      if (sense(r, c, d) !== TABLE[i]) return;
      trail = trail.concat([[r, c]]);
      if (i === TABLE.length - 1) { out.push(trail); return; }
      [3, 0, 1].forEach(function (t) {
        var nd = (d + t) % 4, nr = r + DIRS[nd][0], nc = c + DIRS[nd][1];
        if (cellAt(nr, nc) === 'R') go(nr, nc, nd, i + 1, trail);
      });
    })(START.r, START.c, START.d, 0, []);
    return out;
  }
  var PATHS = paths();
  var PATH = PATHS[0];
  var END = PATH ? PATH[PATH.length - 1] : [-1, -1];
  if (PATHS.length !== 1 || END[0] !== POINTS[ANSWER][0] || END[1] !== POINTS[ANSWER][1]) throw new Error('tina22: Lösung stimmt nicht');

  /* ---------- Zeichnen ---------- */
  function tile(kind, x, y, w) {      /* Symbol in Quadrat (x, y, Breite w) */
    var g = S('g', { transform: 'translate(' + x + ' ' + y + ') scale(' + (w / 40) + ')' });
    g.appendChild(S('rect', { class: 't-tina22-bg ' + kind, width: 40, height: 40 }));
    if (kind === 'G') {
      g.appendChild(S('path', { class: 't-tina22-tuft', d: 'M6,12q2,-3 4,0t4,0M24,30q2,-3 4,0t4,0M7,32q2,-3 4,0M27,10q2,-3 4,0' }));
    } else if (kind === 'T') {
      g.appendChild(S('rect', { class: 't-tina22-trunk', x: 18, y: 24, width: 4, height: 11 }));
      g.appendChild(S('circle', { class: 't-tina22-crown', cx: 20, cy: 17, r: 11 }));
    } else if (kind === 'H') {
      g.appendChild(S('rect', { class: 't-tina22-wall', x: 9, y: 19, width: 22, height: 16 }));
      g.appendChild(S('path', { class: 't-tina22-roof', d: 'M5,20L20,5L35,20Z' }));
    }
    return g;
  }

  var el, api, locked, picked, mode, svg, choiceEl, statusEl, tableEl;

  function renderMap() {
    var kids = [];
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) kids.push(tile(MAP[r][c], c * CELL, r * CELL, CELL));
    kids.push(S('rect', { class: 't-tina22-frame', x: 0, y: 0, width: N * CELL, height: N * CELL }));
    /* Start */
    var sx = START.c * CELL, sy = START.r * CELL;
    kids.push(S('path', { class: 't-tina22-start', d: 'M' + (sx + 8) + ',' + (sy + 7) + 'L' + (sx + 34) + ',' + (sy + 20) + 'L' + (sx + 8) + ',' + (sy + 33) + 'Z' }));
    /* Weg (nur bei Lösung) */
    if (mode === 'solution') {
      var pts = PATH.map(function (p) { return (p[1] * CELL + 20) + ',' + (p[0] * CELL + 20); }).join(' ');
      kids.push(S('polyline', { class: 't-tina22-path', points: pts }));
      PATH.forEach(function (p, i) {
        if (i === 0) return;
        kids.push(S('circle', { class: 't-tina22-step', cx: p[1] * CELL + 20, cy: p[0] * CELL + 20 - 0, r: 9 }));
        kids.push(S('text', { class: 't-tina22-steptxt', x: p[1] * CELL + 20, y: p[0] * CELL + 20, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, String(i + 1)));
      });
    }
    /* Punkte */
    LETTERS.forEach(function (L) {
      var p = POINTS[L], cx = p[1] * CELL + 20, cy = p[0] * CELL + 20;
      var cls = 't-tina22-dot' + (picked === L ? ' picked' : '');
      if (mode === 'check' && picked === L) cls += L === ANSWER ? ' right' : ' wrong';
      if (mode === 'solution' && L === ANSWER) cls += ' right';
      kids.push(S('g', { class: cls, 'data-pt': L, role: 'button', tabindex: locked ? '-1' : '0',
        'aria-label': 'Punkt ' + L + (picked === L ? ', ausgewählt' : '') }, S('circle', { cx: cx, cy: cy, r: 15 }), S('text', { x: cx, y: cy, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, L)));
    });
    svg.replaceChildren.apply(svg, kids);

    choiceEl.replaceChildren.apply(choiceEl, LETTERS.map(function (L) {
      var cls = 't-tina22-pick' + (picked === L ? ' on' : '');
      if (mode === 'check' && picked === L) cls += L === ANSWER ? ' right' : ' wrong';
      if (mode === 'solution' && L === ANSWER) cls += ' right on';
      return h('button', { type: 'button', class: cls, 'data-pt': L, 'aria-pressed': String(picked === L), disabled: locked }, L);
    }));
  }

  function pickPoint(L) {
    if (locked) return;
    picked = picked === L ? null : L;
    renderMap();
    api.changed(picked ? 'Du hast Punkt ' + picked + ' gewählt.' : '');
  }

  function iconSvg(k) {
    var s = S('svg', { class: 't-tina22-ico', viewBox: '0 0 40 40', 'aria-hidden': 'true', focusable: 'false' }, tile(k, 0, 0, 40));
    return s;
  }
  function buildTable() {
    var head = h('tr', null, h('th', { scope: 'col', class: 't-tina22-no' }, 'Nr.'), h('th', { scope: 'col' }, 'links'), h('th', { scope: 'col' }, 'vor'), h('th', { scope: 'col' }, 'rechts'));
    var rows = TABLE.map(function (t, i) {
      return h('tr', null, h('th', { scope: 'row', class: 't-tina22-no' }, String(i + 1)),
        t.split('').map(function (k, j) { return h('td', { 'aria-label': ['links', 'vor', 'rechts'][j] + ': ' + NAME[k] }, iconSvg(k)); }));
    });
    return h('table', { class: 't-tina22-table' }, h('caption', null, 'Was Tinas Sensoren auf jedem Feld ihres Weges erkannt haben'),
      h('thead', null, head), h('tbody', null, rows));
  }
  function legend() {
    return h('div', { class: 't-tina22-legend' }, ['R', 'G', 'T', 'H'].map(function (k) { return h('span', null, iconSvg(k), NAME[k]); }));
  }

  Biber.register({
    id: 'tina22',
    story: '<p>Roboter Tina liefert Post aus. Tina benutzt dazu eine Landkarte, die in Felder eingeteilt ist. Tina bewegt sich der Straße entlang auf ein benachbartes Feld nach links, rechts oder vorne (also nicht diagonal).</p>' +
      '<p>Für die Navigation hat Tina drei Sensoren. Sobald Tina ein Feld betritt (und bevor Tina sich drehen kann), erkennen sie, was sich auf den Feldern links, vor und rechts von Tina befindet: Straße, Wiese, ein Baum oder ein Haus.</p>' +
      '<p>Die Tabelle zeigt, was Tinas Sensoren auf jedem Feld ihres Weges erkannt haben. Tina startet auf dem Feld mit dem schwarzen Pfeil, in Richtung des Pfeiles. Die dunkelblauen Punkte sind zur Unterscheidung mit A bis F beschriftet.</p>',
    question: 'An welchem der dunkelblauen Punkte befindet sich Tina am Ende ihres Weges?',
    howto: 'Tippe einen Punkt auf der Karte an oder wähle unten seinen Buchstaben. Prüfe dann deine Antwort.',
    explanation: function () {
      return '<p>Tina befindet sich am Ende ihres Weges an <b>Punkt B</b>.</p>' +
        '<p>Am schnellsten findest du das von hinten: Die letzte Zeile der Tabelle (Haus links, Straße vor, Baum rechts) passt nur zu den Punkten A, B und D. Die vorletzte Zeile (Straße, Straße, Baum) passt von diesen nur zu B. ' +
        'Du kannst auch vom Start aus einen Weg suchen, der in jedem Schritt zur Tabelle passt: Es gibt nur diesen einen, und er endet bei B (die Zahlen im Lösungsbild zeigen die Reihenfolge der Felder).</p>' +
        '<p><b>Informatik:</b> Ein Roboter erfasst seine Umwelt mit <b>Sensoren</b>, verarbeitet die Daten mit einem Programm und handelt dann mit <b>Aktoren</b> (hier: Fahrwerk und Motor). Auch selbstfahrende Autos sind Roboter mit vielen Sensoren (Geschwindigkeit, Position, Abstand zum Straßenrand) und Aktoren (Motor, Lenkung, Bremsen).</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null;
      svg = S('svg', { class: 't-tina22-svg', viewBox: '0 0 ' + (N * CELL) + ' ' + (N * CELL), role: 'group',
        'aria-label': 'Landkarte mit 10 mal 10 Feldern. Tina startet in Zeile 6, Spalte 3 und schaut nach rechts. Sechs Punkte A bis F liegen auf der Straße.' });
      choiceEl = h('div', { class: 't-tina22-choice', role: 'group', 'aria-label': 'Punkt wählen' });
      statusEl = h('p', { class: 't-tina22-status', role: 'status', 'aria-live': 'polite' });
      tableEl = buildTable();
      el.replaceChildren(h('div', { class: 't-tina22-root' },
        h('div', { class: 't-tina22-map' }, svg, h('div', { class: 't-tina22-ans' }, h('span', null, 'Mein Punkt:'), choiceEl), legend()),
        h('div', { class: 't-tina22-tab' }, tableEl)));
      var onPick = function (e) {
        var t = e.target.closest('[data-pt]');
        if (t) pickPoint(t.getAttribute('data-pt'));
      };
      el.addEventListener('click', onPick);
      el.addEventListener('keydown', function (e) {
        var t = e.target.closest && e.target.closest('g[data-pt]');
        if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pickPoint(t.getAttribute('data-pt')); }
      });
      renderMap();
    },
    isComplete: function () { return picked !== null; },
    evaluate: function () { return { correct: picked === ANSWER, answer: picked }; },
    setAnswer: function (ans) { picked = typeof ans === 'string' ? ans : null; mode = 'check'; renderMap(); },
    lock: function (on) {
      locked = on;
      mode = on ? (mode === 'solution' ? 'solution' : 'check') : null;
      renderMap();
    },
    reset: function () { picked = null; mode = null; renderMap(); },
    showSolution: function () { picked = ANSWER; locked = true; mode = 'solution'; renderMap(); }
  });
})();
