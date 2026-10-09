/* Aufgabe Computerviren (Biber 2022; Klasse 11-13 schwer): Ausbreitung zweier Viren in einem Netz simulieren; Knoten mit beiden Viren schalten ab */
(function () {
  'use strict';
  var h = Biber.h, S = Biber.svg;
  var P = 't-computerviren22-';

  /* Netz aus dem Heft (S. 20), Koordinaten im viewBox 0 0 770 440 */
  var NODES = [
    [182, 62], [63, 143], [346, 62], [483, 62], [620, 62],
    [402, 143], [539, 143], [676, 143], [182, 223], [318, 223],
    [589, 223], [726, 223], [93, 304], [266, 304], [505, 335],
    [159, 385], [359, 385]
  ];
  var EDGES = [[0, 1], [0, 2], [2, 3], [3, 4], [2, 5], [3, 6], [5, 6], [6, 7], [6, 10], [7, 10], [7, 11], [1, 8], [1, 12],
    [8, 9], [5, 9], [9, 13], [9, 14], [13, 16], [10, 14], [12, 15], [15, 16], [16, 14]];
  var START_BLUE = 1, START_RED = 0;
  var R = 34;
  /* Markierungen: 0 leer, 1 BlueBug, 2 RedRaptor, 3 abgeschaltet */
  var NAMES = ['unmarkiert', 'mit BlueBug infiziert', 'mit RedRaptor infiziert', 'abgeschaltet'];
  var BRUSHES = [
    { v: 1, label: 'BlueBug' },
    { v: 2, label: 'RedRaptor' },
    { v: 3, label: 'abgeschaltet' }
  ];

  /* ---------- Simulation (Tag für Tag) ---------- */
  var ADJ = NODES.map(function () { return []; });
  EDGES.forEach(function (e) { ADJ[e[0]].push(e[1]); ADJ[e[1]].push(e[0]); });
  function marksOf(blue, red) {
    return NODES.map(function (_, i) { return blue[i] && red[i] ? 3 : blue[i] ? 1 : red[i] ? 2 : 0; });
  }
  var DAYS = (function () {   /* DAYS[d] = Markierungen am Ende von Tag d (Tag 0 = Start) */
    var blue = NODES.map(function (_, i) { return i === START_BLUE; });
    var red = NODES.map(function (_, i) { return i === START_RED; });
    var off = NODES.map(function () { return false; });
    var days = [marksOf(blue, red)];
    for (var guard = 0; guard < 50; guard++) {
      var nb = blue.slice(), nr = red.slice();
      NODES.forEach(function (_, i) {
        if (off[i]) return;
        ADJ[i].forEach(function (j) { if (blue[i]) nb[j] = true; if (red[i]) nr[j] = true; });
      });
      blue = nb; red = nr;
      NODES.forEach(function (_, i) { if (blue[i] && red[i]) off[i] = true; });
      var m = marksOf(blue, red);
      if (m.join('') === days[days.length - 1].join('')) break;
      days.push(m);
    }
    return days;
  })();
  var SOLUTION = DAYS[DAYS.length - 1];   /* nach 5 Tagen; stimmt mit der Abbildung im Heft überein */

  var el, api, locked = false, mark = null;
  var marks, brush = 1, day = 0;
  var nodeEls = [], brushEls = [], svgEl, dayBar, dayLabel, prevBtn, nextBtn, noteEl;

  /* ---------- Symbole in den Knoten ---------- */
  function bugIcon() {
    return S('g', { class: P + 'ic' },
      S('ellipse', { cx: 0, cy: 3, rx: 7, ry: 11, fill: '#fff' }),
      S('circle', { cx: 0, cy: -10, r: 4, fill: '#fff' }),
      S('path', { d: 'M-2 -13 Q-6 -19 -10 -19 M2 -13 Q6 -19 10 -19 M-7 -2 L-14 -6 M7 -2 L14 -6 M-7 5 L-14 6 M7 5 L14 6 M-6 11 L-12 18 M6 11 L12 18', fill: 'none', stroke: '#fff', 'stroke-width': 2, 'stroke-linecap': 'round' }),
      S('path', { d: 'M0 -4 V14', stroke: '#0b1a55', 'stroke-width': 1.6 }));
  }
  function raptorIcon() {
    return S('g', { class: P + 'ic' },
      S('path', { d: 'M-17 -16 L-9 -9 L-5 -14 H5 L9 -9 L17 -16 L15 -2 L9 11 L4 16 H-4 L-9 11 L-15 -2 Z', fill: '#111' }),
      S('path', { d: 'M-12 -4 L-4 0 L-5 3 L-12 1 Z M12 -4 L4 0 L5 3 L12 1 Z', fill: '#e11d1d' }),
      S('path', { d: 'M-6 10 L-3 5 L0 10 L3 5 L6 10', fill: 'none', stroke: '#fff', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
  }
  function offIcon() {
    return S('g', { class: P + 'ic' },
      S('path', { d: 'M-8 -10 A13 13 0 1 0 8 -10', fill: 'none', stroke: '#3c444a', 'stroke-width': 4, 'stroke-linecap': 'round' }),
      S('path', { d: 'M0 -17 V-2', fill: 'none', stroke: '#3c444a', 'stroke-width': 4, 'stroke-linecap': 'round' }));
  }
  function iconFor(v) { return v === 1 ? bugIcon() : v === 2 ? raptorIcon() : v === 3 ? offIcon() : null; }

  /* ---------- Zeichnen ---------- */
  function shown() { return mark === 'solution' ? DAYS[day] : marks; }
  function nodeLabel(i, v) {
    var s = 'Knoten ' + (i + 1) + ': ' + NAMES[v];
    if (i === START_BLUE) s += ' (am Anfang mit BlueBug infiziert)';
    if (i === START_RED) s += ' (am Anfang mit RedRaptor infiziert)';
    return s + (mark === 'solution' || locked ? '' : '. Zum Markieren antippen.');
  }
  function drawNode(i) {
    var v = shown()[i], g = nodeEls[i];
    var wrong = mark === 'check' && marks[i] !== SOLUTION[i];
    g.setAttribute('aria-label', nodeLabel(i, v) + (wrong ? ' (falsch markiert)' : ''));
    g.setAttribute('aria-disabled', locked ? 'true' : 'false');
    g.setAttribute('class', P + 'node ' + P + 'v' + v + (wrong ? ' wrong' : '') + (locked ? ' locked' : ''));
    var disc = g.querySelector('.' + P + 'disc');
    while (disc.nextSibling) g.removeChild(disc.nextSibling);
    var ic = iconFor(v);
    if (ic) { ic.setAttribute('transform', 'translate(' + NODES[i][0] + ' ' + NODES[i][1] + ') scale(1.05)'); g.appendChild(ic); }
  }
  function refresh() {
    NODES.forEach(function (_, i) { drawNode(i); });
    brushEls.forEach(function (b, k) {
      b.setAttribute('aria-pressed', brush === BRUSHES[k].v ? 'true' : 'false');
      b.disabled = locked;
    });
    dayBar.hidden = mark !== 'solution';
    if (mark === 'solution') {
      dayLabel.textContent = day === 0 ? 'Start' : 'Tag ' + day + ' von ' + (DAYS.length - 1);
      prevBtn.disabled = day <= 0;
      nextBtn.disabled = day >= DAYS.length - 1;
    }
    var left = marks.filter(function (v) { return v === 0; }).length;
    noteEl.textContent = mark === 'solution'
      ? (day === 0 ? 'Zu Beginn sind nur zwei Knoten infiziert.' : day === DAYS.length - 1 ? 'Nach ' + day + ' Tagen ist alles infiziert oder abgeschaltet.' : 'Zustand am Ende von Tag ' + day + '.')
      : mark === 'check' ? '' : (left ? 'Noch ' + left + (left === 1 ? ' Knoten ist' : ' Knoten sind') + ' unmarkiert.' : 'Alle Knoten sind markiert.');
  }
  function apply(i) {
    if (locked) return;
    marks[i] = marks[i] === brush ? 0 : brush;
    refresh();
    var left = marks.filter(function (v) { return v === 0; }).length;
    api.changed(left ? left + ' unmarkiert' : 'Alle markiert');
  }

  function reset() {
    marks = NODES.map(function (_, i) { return i === START_BLUE ? 1 : i === START_RED ? 2 : 0; });
    mark = null; day = 0;
  }

  Biber.register({
    id: 'computerviren22',
    story:
      '<p>In einem Computernetz haben sich zwei Netzknoten mit Computerviren infiziert: einer mit dem Virus <b class="' + P + 'tb">BlueBug</b>, ein anderer mit dem Virus <b class="' + P + 'tr">RedRaptor</b>.</p>' +
      '<p>Immer am Morgen breiten sich beide Viren aus. Jedes Virus infiziert dann zusätzlich alle Knoten, die mit den von ihm bereits infizierten Knoten direkt verbunden sind. Wenn ein Knoten mit <b>beiden</b> Viren infiziert ist, schaltet er nach einigen Stunden wegen Überlastung ab. Die Viren können sich an den folgenden Tagen von dort also nicht weiter ausbreiten.</p>' +
      '<p>Unten siehst du das Computernetz mit den Knoten und ihren direkten Verbindungen. Die beiden zu Beginn infizierten Knoten sind markiert. Nach einigen Tagen sind alle Knoten mit einem Virus infiziert oder sogar abgeschaltet.</p>',
    question: 'Welche Knoten sind dann mit welchem Virus infiziert oder abgeschaltet? Wähle für jeden Knoten die richtige Markierung.',
    howto: 'Wähle oben eine Markierung und tippe dann die Knoten an. Tippst du einen Knoten mit derselben Markierung noch einmal an, wird sie entfernt. Auch die beiden Startknoten müssen am Ende richtig markiert sein.',
    explanation: function () {
      return '<p>Am besten spielt man die Ausbreitung <strong>Tag für Tag</strong> durch. Nach Tag 1 sind die beiden Startknoten mit beiden Viren infiziert und schalten ab, außerdem sind drei weitere Knoten infiziert. An Tag 2 kommen vier Knoten hinzu, an Tag 3 werden zwei Knoten mit beiden Viren überlastet und schalten ab. An Tag 4 schaltet noch ein Knoten ab, und erst am fünften Tag erreicht RedRaptor den letzten Knoten.</p>' +
        '<p>Am Ende sind <strong>5 Knoten abgeschaltet</strong>, <strong>6 mit BlueBug</strong> und <strong>6 mit RedRaptor</strong> infiziert. Abgeschaltete Knoten verbreiten nichts mehr, deshalb kommt BlueBug nicht an die rechte Seite des Netzes.</p>' +
        '<p>Malware wie Viren, Spyware oder Ransomware ist eine große Bedrohung für Computernetze. Dass sich ein Computer wegen der Malware selbst abschaltet, ist meist nicht beabsichtigt, weil es die Verbreitung stoppt. Sicherheitsupdates, Virenschutz und regelmäßige Datensicherungen schützen am besten.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      nodeEls = [];
      svgEl = S('svg', { viewBox: '0 0 770 440', class: P + 'net', role: 'group', 'aria-label': 'Computernetz mit 17 Knoten' });
      EDGES.forEach(function (e) {
        svgEl.appendChild(S('line', { x1: NODES[e[0]][0], y1: NODES[e[0]][1], x2: NODES[e[1]][0], y2: NODES[e[1]][1], class: P + 'edge' }));
      });
      NODES.forEach(function (p, i) {
        var g = S('g', { role: 'button', tabindex: 0 });
        if (i === START_BLUE || i === START_RED) g.appendChild(S('circle', { cx: p[0], cy: p[1], r: R + 7, class: P + 'startring' }));
        g.appendChild(S('circle', { cx: p[0], cy: p[1], r: R, class: P + 'disc' }));
        g.addEventListener('click', function () { apply(i); });
        g.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); apply(i); }
        });
        nodeEls.push(g); svgEl.appendChild(g);
      });
      /* Startring liegt hinter der Scheibe: Disc muss nach dem Ring kommen (siehe drawNode: entfernt alles hinter der Disc) */
      brushEls = BRUSHES.map(function (b) {
        var ic = S('svg', { viewBox: '-22 -22 44 44', width: 30, height: 30, class: P + 'bico', 'aria-hidden': 'true', focusable: 'false' });
        var disc = S('circle', { cx: 0, cy: 0, r: 20, class: P + 'disc ' + P + 'b' + b.v });
        ic.appendChild(S('g', { class: P + 'node ' + P + 'v' + b.v }, disc));
        var inner = iconFor(b.v); inner.setAttribute('transform', 'scale(0.62)'); ic.firstChild.appendChild(inner);
        return h('button', { type: 'button', class: P + 'brush', 'aria-pressed': b.v === brush ? 'true' : 'false',
          'aria-label': 'Markierung ' + b.label, onclick: function () { brush = b.v; refresh(); } }, ic, h('span', null, b.label));
      });
      prevBtn = h('button', { type: 'button', class: 'btn ghost ' + P + 'small', 'aria-label': 'Vorheriger Tag', onclick: function () { if (day > 0) { day--; refresh(); } } }, '◀');
      nextBtn = h('button', { type: 'button', class: 'btn ghost ' + P + 'small', 'aria-label': 'Nächster Tag', onclick: function () { if (day < DAYS.length - 1) { day++; refresh(); } } }, '▶');
      dayLabel = h('strong', { class: P + 'day', role: 'status', 'aria-live': 'polite' });
      dayBar = h('div', { class: P + 'daybar', hidden: true }, prevBtn, dayLabel, nextBtn);
      noteEl = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('div', { class: P + 'brushes', role: 'group', 'aria-label': 'Markierung auswählen' }, brushEls),
        h('div', { class: P + 'netbox' }, svgEl),
        dayBar, noteEl));
      refresh();
    },
    isComplete: function () { return marks.every(function (v) { return v !== 0; }); },
    evaluate: function () {
      var ok = marks.every(function (v, i) { return v === SOLUTION[i]; });
      return { correct: ok, answer: { marks: marks.join('') } };
    },
    setAnswer: function (ans) {
      var s = ans && typeof ans.marks === 'string' ? ans.marks : '';
      marks = NODES.map(function (_, i) { var v = parseInt(s.charAt(i), 10); return v >= 0 && v <= 3 ? v : 0; });
      mark = 'check'; day = 0;
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      refresh();
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () {
      marks = SOLUTION.slice(); mark = 'solution'; locked = true; day = DAYS.length - 1;
      refresh();
    }
  });
})();
