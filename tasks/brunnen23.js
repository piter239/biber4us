/* Aufgabe Brunnen (Heft 2023, Klasse 7-8 schwer, 9-10 mittel): Graphen, distance-2-dominating set */
(function () {
  'use strict';
  var h = Biber.h;
  var NS = 'http://www.w3.org/2000/svg';

  /* Knoten: [x, y, schon ein Brunnen?] (aus dem Stadtplan des Hefts) */
  var N = [[156, 22, 0], [404, 25, 0], [272, 28, 0], [313, 75, 0], [76, 81, 0], [438, 93, 1], [189, 95, 1], [532, 96, 0],
    [21, 147, 0], [265, 151, 0], [390, 158, 0], [527, 174, 0], [198, 180, 0], [124, 191, 0], [452, 207, 0], [55, 225, 1],
    [366, 226, 0], [246, 231, 0], [526, 235, 0], [305, 254, 0], [158, 272, 0], [239, 295, 0], [415, 319, 0], [88, 328, 0]];
  var E = [[0, 6], [1, 2], [1, 3], [1, 5], [2, 3], [2, 6], [3, 6], [3, 9], [3, 10], [4, 6], [4, 8], [4, 13], [5, 7], [5, 14],
    [6, 13], [7, 11], [9, 10], [9, 12], [9, 17], [10, 14], [10, 16], [11, 18], [12, 13], [13, 15], [13, 20], [14, 18], [15, 23],
    [16, 19], [16, 22], [17, 19], [17, 20], [17, 21], [18, 22], [20, 21], [20, 23]];
  var R = 15;

  var ADJ = N.map(function () { return []; });
  E.forEach(function (e) { ADJ[e[0]].push(e[1]); ADJ[e[1]].push(e[0]); });
  var FIXED = [];
  N.forEach(function (n, i) { if (n[2]) FIXED.push(i); });

  /* Knoten mit Abstand <= 2 zu einem Brunnen */
  function covered(wells) {
    var seen = {}, fr = wells.slice();
    wells.forEach(function (w) { seen[w] = true; });
    for (var d = 0; d < 2; d++) {
      var nx = [];
      fr.forEach(function (v) { ADJ[v].forEach(function (w) { if (!seen[w]) { seen[w] = true; nx.push(w); } }); });
      fr = nx;
    }
    return seen;
  }
  function uncovered(wells) {
    var c = covered(wells);
    return N.map(function (_, i) { return i; }).filter(function (i) { return !c[i]; });
  }
  var SOLUTIONS = N.map(function (_, i) { return i; }).filter(function (i) {
    return FIXED.indexOf(i) < 0 && uncovered(FIXED.concat([i])).length === 0;
  });
  var RIGHT = 19;
  if (SOLUTIONS.length !== 1 || SOLUTIONS[0] !== RIGHT) throw new Error('brunnen23: Lösung stimmt nicht');

  function s(name, attrs, kids) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]);
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  function drop(x, y, k) {
    /* Wassertropfen, Mitte (x, y), Größe k */
    return s('path', {
      class: 't-brunnen23-drop',
      d: 'M' + x + ' ' + (y - 9 * k) + 'C' + (x + 3 * k) + ' ' + (y - 4 * k) + ' ' + (x + 7 * k) + ' ' + (y - 0.5 * k) + ' ' + (x + 7 * k) + ' ' + (y + 3.5 * k) +
        'C' + (x + 7 * k) + ' ' + (y + 8 * k) + ' ' + (x - 7 * k) + ' ' + (y + 8 * k) + ' ' + (x - 7 * k) + ' ' + (y + 3.5 * k) +
        'C' + (x - 7 * k) + ' ' + (y - 0.5 * k) + ' ' + (x - 3 * k) + ' ' + (y - 4 * k) + ' ' + x + ' ' + (y - 9 * k) + 'Z'
    });
  }

  var el, api, locked, chosen, mode, svg, statusEl;

  function render() {
    var wells = FIXED.concat(chosen === null ? [] : [chosen]);
    var unc = (mode === 'check' || mode === 'solution') ? uncovered(wells) : [];
    var kids = [];
    var lines = s('g', { class: 't-brunnen23-edges' });
    E.forEach(function (e) {
      lines.appendChild(s('line', { x1: N[e[0]][0], y1: N[e[0]][1], x2: N[e[1]][0], y2: N[e[1]][1] }));
    });
    kids.push(lines);
    var nodes = s('g');
    N.forEach(function (n, i) {
      var fixed = !!n[2];
      var isNew = chosen === i;
      var cls = 't-brunnen23-node' + (fixed ? ' fixed' : '') + (isNew ? ' new' : '') + (unc.indexOf(i) >= 0 ? ' unc' : '');
      var label = 'Straßenecke ' + (i + 1) + (fixed ? ': hier steht schon ein Brunnen' : isNew ? ': neuer Brunnen, zum Entfernen antippen' : ': hier einen Brunnen aufstellen');
      var g = s('g', {
        class: cls, 'data-i': String(i), role: fixed ? 'img' : 'button', tabindex: (fixed || locked) ? null : '0',
        'aria-label': label, 'aria-pressed': fixed ? null : String(isNew)
      }, [
        s('circle', { class: 't-brunnen23-hit', cx: n[0], cy: n[1], r: R + 8 }),
        s('circle', { class: 't-brunnen23-dot', cx: n[0], cy: n[1], r: R }),
        (fixed || isNew) ? drop(n[0], n[1], 1) : null,
        unc.indexOf(i) >= 0 ? s('circle', { class: 't-brunnen23-ring', cx: n[0], cy: n[1], r: R + 5 }) : null
      ]);
      nodes.appendChild(g);
    });
    kids.push(nodes);
    svg.replaceChildren.apply(svg, kids);
    var msg;
    if (chosen === null) msg = 'Noch kein neuer Brunnen aufgestellt.';
    else msg = 'Neuer Brunnen an Straßenecke ' + (chosen + 1) + '.';
    if (mode === 'check' || mode === 'solution') {
      msg = unc.length === 0 ? 'Von jeder Straßenecke sind es höchstens zwei Straßenabschnitte bis zu einem Brunnen.'
        : 'Von ' + unc.length + ' Ecken (rot umrandet) sind es mehr als zwei Straßenabschnitte bis zu einem Brunnen.';
    }
    statusEl.textContent = msg;
  }

  function pick(i) {
    if (locked || N[i][2]) return;
    chosen = chosen === i ? null : i;
    render();
    var g = svg.querySelector('[data-i="' + i + '"]'); if (g && g.hasAttribute('tabindex')) g.focus();
    api.changed();
  }
  function onClick(e) {
    var g = e.target.closest('[data-i]');
    if (g) pick(+g.getAttribute('data-i'));
  }
  function onKey(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var g = e.target.closest('[data-i]');
    if (!g) return;
    e.preventDefault();
    pick(+g.getAttribute('data-i'));
  }

  Biber.register({
    id: 'brunnen23',
    story: '<p>Der Sommer in der Stadt ist heiß. Die Bürgermeisterin lässt deshalb Brunnen mit Trinkwasser aufstellen.</p>' +
      '<p>Die Brunnen sollen so stehen, dass man von jeder Straßenecke aus <b>höchstens zwei Straßenabschnitte</b> gehen muss, um einen Brunnen zu erreichen. Dann ist die Bürgermeisterin zufrieden.</p>' +
      '<p>Hier ist ein Stadtplan. Die Linien sind Straßenabschnitte, und die Punkte sind Straßenecken. An drei Ecken stehen bereits Brunnen (blau mit Tropfen).</p>',
    question: 'Stelle einen weiteren Brunnen so auf, dass die Bürgermeisterin zufrieden ist.',
    howto: 'Tippe eine gelbe Straßenecke an, um dort den neuen Brunnen aufzustellen. Tippst du eine andere Ecke an, zieht der Brunnen um.',
    explanation: function () {
      return '<p>Zuerst markiert man alle Ecken, die höchstens zwei Straßenabschnitte von einem der drei vorhandenen Brunnen entfernt sind. ' +
        'Fünf Ecken im unteren Teil des Plans bleiben übrig. Prüft man für diese Ecken, welche Ecken in höchstens zwei Schritten erreichbar sind, ' +
        'so erfüllt nur die Ecke <b>unten in der Mitte</b> die Bedingung für alle fünf zugleich. Sie ist die einzige richtige Stelle für den vierten Brunnen.</p>' +
        '<p><b>Informatik:</b> Der Stadtplan ist ein <i>Graph</i>: Straßenecken sind Knoten, Straßenabschnitte sind Kanten. Gesucht ist eine Knotenmenge, ' +
        'von der jeder Knoten höchstens zwei Kanten entfernt ist (ein „distance 2-dominating set“). Eine möglichst kleine solche Menge zu finden, gehört im Allgemeinen zu den schwierigsten Problemen; ' +
        'es hilft zum Beispiel bei der Auswahl repräsentativer Nutzer in großen sozialen Netzwerken.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; chosen = null; mode = null;
      svg = s('svg', { class: 't-brunnen23-svg', viewBox: '-4 -4 563 358', role: 'group', 'aria-label': 'Stadtplan mit 24 Straßenecken und 35 Straßenabschnitten', focusable: 'false' });
      statusEl = h('p', { class: 't-brunnen23-status', 'aria-live': 'polite' });
      el.replaceChildren(h('div', { class: 't-brunnen23-box' }, svg, statusEl));
      svg.addEventListener('click', onClick);
      svg.addEventListener('keydown', onKey);
      render();
    },
    isComplete: function () { return chosen !== null; },
    evaluate: function () { return { correct: chosen === RIGHT, answer: chosen }; },
    setAnswer: function (ans) { chosen = typeof ans === 'number' ? ans : null; mode = 'check'; render(); },
    lock: function (on) {
      locked = on;
      mode = on ? 'check' : null;
      render();
    },
    reset: function () { chosen = null; mode = null; render(); },
    showSolution: function () { chosen = RIGHT; mode = 'solution'; locked = true; render(); }
  });
})();
