/* Aufgabe Seerosen-Treff (Heft 2021, S. 47; Klasse 5-6 mittel, 7-8 einfach): Wo treffen sich zwei Frösche? */
(function () {
  'use strict';
  var h = Biber.h;

  /* ---------- Aufgabendaten ----------
     8 Spalten (A-H) x 5 Zeilen (1 unten bis 5 oben); jeder Pfeil "X>Y" führt vom Blatt X zum Blatt Y. */
  var COLS = 'ABCDEFGH', ROWS = 5;
  var ARROWS = ('B5>A5 D5>C5 E5>D5 E5>F5 H5>G5 A5>A4 B4>B5 C4>C5 E4>E5 F5>F4 G5>G4 H4>H5 ' +
    'A4>B4 D4>C4 F4>E4 B3>B4 D3>D4 F3>F4 G4>G3 H3>H4 D3>C3 E3>D3 G3>F3 ' +
    'A2>A3 B2>B3 C3>C2 E2>E3 G3>G2 H3>H2 A2>B2 C2>D2 F2>E2 H2>G2 ' +
    'A1>A2 C1>C2 D2>D1 F1>F2 G1>G2 H1>H2 A1>B1 B1>C1 D1>E1 E1>F1 G1>H1').split(' ').map(function (s) { return s.split('>'); });
  var RED = 'A1', BLUE = 'H3', RIGHT = 'C5';

  function reach(from) {
    var seen = {}, stack = [from];
    seen[from] = true;
    while (stack.length) {
      var x = stack.pop();
      ARROWS.forEach(function (a) { if (a[0] === x && !seen[a[1]]) { seen[a[1]] = true; stack.push(a[1]); } });
    }
    return seen;
  }
  var REACH_R = reach(RED), REACH_B = reach(BLUE);
  var BOTH = Object.keys(REACH_R).filter(function (k) { return REACH_B[k]; });   /* genau ["C5"] */

  /* ---------- Geometrie (SVG-Einheiten) ---------- */
  var P = 70, R = 30, X0 = 30 + R, Y0 = 18 + R, W = 30 + COLS.length * P + 14, H = 14 + ROWS * P + 34;
  function pos(id) {
    var c = COLS.indexOf(id[0]), r = +id[1];
    return { x: X0 + c * P, y: Y0 + (ROWS - r) * P };
  }
  var IDS = [];
  for (var r = ROWS; r >= 1; r--) for (var c = 0; c < COLS.length; c++) IDS.push(COLS[c] + r);

  var NS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs, kids) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (k) { if (k) e.appendChild(k); });
    return e;
  }
  function leafPath(p) {
    var a1 = 25 * Math.PI / 180, a2 = 68 * Math.PI / 180;
    function pt(a) { return (p.x + R * Math.cos(a)).toFixed(1) + ' ' + (p.y + R * Math.sin(a)).toFixed(1); }
    return 'M' + p.x + ' ' + p.y + ' L' + pt(a2) + ' A' + R + ' ' + R + ' 0 1 1 ' + pt(a1) + ' Z';
  }
  function arrowEl(a) {
    var p = pos(a[0]), q = pos(a[1]);
    var dx = q.x - p.x, dy = q.y - p.y, d = Math.sqrt(dx * dx + dy * dy), ux = dx / d, uy = dy / d;
    var x1 = p.x + ux * 9, y1 = p.y + uy * 9, x2 = q.x - ux * 2, y2 = q.y - uy * 2;
    var hx = x2 - ux * 15, hy = y2 - uy * 15, nx = -uy * 8, ny = ux * 8;
    return s('g', { class: 't-seerosen21-arrow' }, [
      s('line', { x1: x1, y1: y1, x2: hx + ux * 3, y2: hy + uy * 3 }),
      s('polygon', { points: x2 + ',' + y2 + ' ' + (hx + nx) + ',' + (hy + ny) + ' ' + (hx - nx) + ',' + (hy - ny) })
    ]);
  }
  function frog(id, cls, label) {
    var p = pos(id);
    return s('g', { class: 't-seerosen21-frog ' + cls, transform: 'translate(' + p.x + ' ' + (p.y + 2) + ')', 'aria-hidden': 'true' }, [
      s('ellipse', { cx: -17, cy: 14, rx: 10, ry: 6, class: 'fl' }), s('ellipse', { cx: 17, cy: 14, rx: 10, ry: 6, class: 'fl' }),
      s('ellipse', { cx: 0, cy: 6, rx: 19, ry: 16, class: 'fb' }),
      s('ellipse', { cx: 0, cy: 12, rx: 11, ry: 8, class: 'fv' }),
      s('circle', { cx: -9, cy: -9, r: 7.5, class: 'fe' }), s('circle', { cx: 9, cy: -9, r: 7.5, class: 'fe' }),
      s('circle', { cx: -8, cy: -9, r: 3.2, class: 'fp' }), s('circle', { cx: 8, cy: -9, r: 3.2, class: 'fp' }),
      s('path', { d: 'M-9 3 Q0 9 9 3', class: 'fm' })
    ]);
  }

  /* ---------- Zustand ---------- */
  var el, api, locked, mode, picked, marks, shown, focusId, svg, leaves;
  /* mode: 'pick' (Treffpunkt wählen) | 'r' | 'b' (Merkhilfe: Blätter markieren); shown: null | 'check' | 'solution' */

  function leafName(id) { return 'Blatt ' + id; }
  function leafLabel(id) {
    var t = leafName(id);
    if (id === RED) t += ', hier sitzt der rote Frosch';
    if (id === BLUE) t += ', hier sitzt der blaue Frosch';
    if (marks.r[id]) t += ', als vom roten Frosch erreichbar gemerkt';
    if (marks.b[id]) t += ', als vom blauen Frosch erreichbar gemerkt';
    if (picked === id) t += ', als Treffpunkt gewählt';
    return t;
  }

  function build() {
    svg = s('svg', { class: 't-seerosen21-svg', viewBox: '0 0 ' + W + ' ' + H, role: 'group', 'aria-label': 'See mit 40 Seerosenblättern und Pfeilen' });
    var water = s('rect', { x: 2, y: 2, width: W - 4, height: H - 4, rx: 14, class: 't-seerosen21-water' });
    svg.appendChild(water);
    COLS.split('').forEach(function (L, i) { var t = s('text', { x: X0 + i * P, y: H - 10, class: 't-seerosen21-axis', 'text-anchor': 'middle' }); t.textContent = L; svg.appendChild(t); });
    for (var r = 1; r <= ROWS; r++) { var t = s('text', { x: 15, y: Y0 + (ROWS - r) * P + 7, class: 't-seerosen21-axis', 'text-anchor': 'middle' }); t.textContent = r; svg.appendChild(t); }
    leaves = {};
    IDS.forEach(function (id) {
      var p = pos(id);
      var g = s('g', { class: 't-seerosen21-leaf', role: 'button', 'data-id': id, tabindex: '-1', 'aria-pressed': 'false' }, [
        s('path', { d: leafPath(p), class: 'shape' }),
        s('path', { d: 'M' + (p.x - 17) + ' ' + (p.y - 15) + ' Q' + (p.x - 8) + ' ' + (p.y - 24) + ' ' + (p.x + 8) + ' ' + (p.y - 24), class: 'shine' }),
        s('circle', { cx: p.x - 17, cy: p.y - 20, r: 6, class: 'mk mk-r' }),
        s('circle', { cx: p.x + 17, cy: p.y - 20, r: 6, class: 'mk mk-b' })
      ]);
      leaves[id] = g;
      svg.appendChild(g);
    });
    var arrows = s('g', { class: 't-seerosen21-arrows', 'aria-hidden': 'true' }, ARROWS.map(arrowEl));
    svg.appendChild(arrows);
    var starts = s('g', { 'aria-hidden': 'true' }, [frog(RED, 'red'), frog(BLUE, 'blue')]);
    svg.appendChild(starts);
    svg.addEventListener('click', onClick);
    svg.addEventListener('keydown', onKey);
  }

  function paint() {
    IDS.forEach(function (id) {
      var g = leaves[id], cls = 't-seerosen21-leaf';
      if (id === RED || id === BLUE) cls += ' start';
      if (picked === id) cls += ' picked';
      if (marks.r[id]) cls += ' mr';
      if (marks.b[id]) cls += ' mb';
      if (shown === 'check' && picked === id) cls += id === RIGHT ? ' right' : ' wrong';
      if (shown === 'solution' && id === RIGHT) cls += ' right picked';
      if (locked) cls += ' locked';
      g.setAttribute('class', cls);
      g.setAttribute('aria-pressed', String(picked === id));
      g.setAttribute('aria-label', leafLabel(id));
      g.setAttribute('tabindex', id === focusId ? '0' : '-1');
    });
  }
  /* Merkhilfe-Schalter und Status */
  function ui() {
    var modes = [['pick', 'Treffpunkt wählen'], ['r', 'Rot merken'], ['b', 'Blau merken']];
    return h('div', { class: 't-seerosen21-tools' },
      h('div', { class: 't-seerosen21-modes', role: 'group', 'aria-label': 'Was passiert beim Antippen eines Blattes?' },
        modes.map(function (m) {
          return h('button', { type: 'button', class: 't-seerosen21-mode m-' + m[0] + (mode === m[0] ? ' on' : ''), 'data-mode': m[0], 'aria-pressed': String(mode === m[0]), disabled: locked }, m[1]);
        })),
      h('button', { type: 'button', class: 't-seerosen21-clear', 'data-clear': '1', disabled: locked }, 'Merkpunkte löschen'),
      h('p', { class: 't-seerosen21-hint' }, mode === 'pick'
        ? 'Tippe das Blatt an, auf dem sich die Frösche treffen.'
        : 'Merkhilfe: Tippe Blätter an, die der ' + (mode === 'r' ? 'rote' : 'blaue') + ' Frosch erreichen kann. Das zählt nicht für die Antwort.'));
  }
  function render() {
    var tools = el.querySelector('.t-seerosen21-tools');
    var nt = ui();
    if (tools) tools.replaceWith(nt); else el.querySelector('.t-seerosen21-board').prepend(nt);
    paint();
  }

  function onClick(e) {
    var g = e.target.closest('[data-id]');
    if (!g || locked) return;
    activate(g.getAttribute('data-id'));
  }
  function activate(id) {
    focusId = id;
    if (mode === 'pick') picked = picked === id ? null : id;
    else { var m = marks[mode]; if (m[id]) delete m[id]; else m[id] = true; }
    paint();
    api.changed(picked ? 'Treffpunkt: ' + leafName(picked) + '.' : '');
  }
  function onKey(e) {
    var g = e.target.closest('[data-id]');
    if (!g) return;
    var id = g.getAttribute('data-id');
    var c = COLS.indexOf(id[0]), r = +id[1];
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!locked) activate(id); return; }
    var d = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
    if (!d) return;
    e.preventDefault();
    var nc = Math.max(0, Math.min(COLS.length - 1, c + d[0])), nr = Math.max(1, Math.min(ROWS, r + d[1]));
    focusId = COLS[nc] + nr;
    paint();
    leaves[focusId].focus();
  }

  function clearMarks() { marks = { r: {}, b: {} }; }
  function reset() { picked = null; mode = 'pick'; shown = null; clearMarks(); focusId = 'A5'; }

  Biber.register({
    id: 'seerosen21',
    story: '<p>Auf einem See können zwei Frösche von Seerosenblatt zu Seerosenblatt springen, aber nur entlang der Pfeile. ' +
      'Der rote Frosch sitzt auf dem Blatt unten links (A1), der blaue Frosch auf dem Blatt ganz rechts in der Mitte (H3).</p>',
    question: 'Auf welchem Seerosenblatt können sie sich treffen?',
    howto: 'Tippe das Blatt an, auf dem sich beide Frösche treffen können. Mit „Rot merken“ und „Blau merken“ kannst du dir unterwegs Blätter markieren, die ein Frosch erreicht.',
    explanation: function () {
      return '<p>Man verfolgt alle Pfeilwege, die vom roten Frosch ausgehen, und merkt sich alle Blätter, die er erreichen kann. Dasselbe macht man für den blauen Frosch. ' +
        'Beide Frösche können sich nur auf einem Blatt treffen, das in beiden Mengen vorkommt. Das ist allein <b>C5</b>.</p>' +
        '<p>Der rote Frosch erreicht ' + Object.keys(REACH_R).length + ' Blätter, der blaue ' + Object.keys(REACH_B).length + '. ' +
        'Dieses systematische Absuchen aller Wege in einem Graphen nennt man Breiten- oder Tiefensuche.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      build();
      el.replaceChildren(h('div', { class: 't-seerosen21-board' }, h('div', { class: 't-seerosen21-lake' }, svg)));
      el.addEventListener('click', function (e) {
        var m = e.target.closest('[data-mode]');
        if (m && !locked) { mode = m.getAttribute('data-mode'); render(); el.querySelector('[data-mode="' + mode + '"]').focus(); return; }
        if (e.target.closest('[data-clear]') && !locked) { clearMarks(); render(); }
      });
      render();
    },
    isComplete: function () { return !!picked; },
    evaluate: function () { return { correct: picked === RIGHT, answer: { leaf: picked } }; },
    setAnswer: function (ans) { picked = ans && ans.leaf || null; shown = 'check'; if (picked) focusId = picked; paint(); },
    lock: function (on) {
      locked = on;
      if (on) { if (shown !== 'solution') shown = 'check'; } else shown = null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      picked = RIGHT; shown = 'solution'; locked = true; focusId = RIGHT;
      marks = { r: REACH_R, b: REACH_B };
      render();
    }
  });
})();
