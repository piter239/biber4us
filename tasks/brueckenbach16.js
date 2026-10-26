/* Aufgabe Brücken-Bach (Heft 2016, S. 16; Klasse 5-6 schwer, 7-8 mittel): Graphen, Zusammenhang, Brücken.
   Lösung laut Heft: Antwort B. Selbstprüfung beim Laden: nur Revier B hat keine Brücke (Kante, ohne die der Graph zerfällt). */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-brueckenbach16-';
  var NS = 'http://www.w3.org/2000/svg';

  /* Teiche (x, y) und Bäche (von, bis, optionaler Kontrollpunkt einer Kurve) für jedes Revier, nachgezeichnet nach den Bildern im Heft */
  var REVIERE = [
    { key: 'A', vb: [210, 210], land: [[104, 100, 100, 82], [98, 160, 74, 50]],
      trees: [[70, 128]],
      nodes: [[103, 24], [49, 66], [157, 66], [103, 104], [103, 142], [49, 186], [157, 188]],
      edges: [[0, 1, [62, 28]], [0, 2, [144, 28]], [1, 3, [60, 106]], [2, 3, [146, 106]], [3, 4], [4, 5], [4, 6], [5, 6, [103, 196]]] },
    { key: 'B', vb: [220, 195], land: [[110, 85, 100, 74], [140, 150, 70, 40]],
      trees: [[104, 52], [120, 60]],
      nodes: [[110, 17], [43, 76], [184, 76], [110, 115], [110, 171]],
      edges: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4, [116, 146]], [1, 4, [46, 156]], [2, 4, [176, 156]]] },
    { key: 'C', vb: [205, 110], land: [[95, 60, 85, 38]],
      trees: [[60, 52]],
      nodes: [[22, 80], [99, 80], [142, 22], [182, 80]],
      edges: [[0, 1, [60, 70]], [1, 2, [122, 52]], [2, 3, [160, 46]], [1, 3, [140, 88]]] },
    { key: 'D', vb: [210, 118], land: [[95, 55, 90, 42], [165, 58, 42, 36], [105, 94, 60, 22]],
      trees: [[92, 22], [138, 100]],
      nodes: [[23, 21], [66, 48], [157, 48], [190, 19], [157, 79], [66, 77], [111, 78], [23, 97]],
      edges: [[0, 1], [0, 7, [9, 60]], [1, 2, [112, 56]], [1, 5], [5, 6], [5, 7], [2, 3], [2, 4], [3, 4, [201, 52]]] }
  ];
  var RIGHT = 1;   /* Antwort B */

  /* Brücken: Kanten, nach deren Entfernen nicht mehr alle Teiche verbunden sind */
  function connected(n, edges) {
    var i, stack = [0], seen = {};
    seen[0] = true;
    while (stack.length) {
      var x = stack.pop();
      for (i = 0; i < edges.length; i++) {
        var e = edges[i], o = e[0] === x ? e[1] : e[1] === x ? e[0] : -1;
        if (o >= 0 && !seen[o]) { seen[o] = true; stack.push(o); }
      }
    }
    return Object.keys(seen).length === n;
  }
  function bridgesOf(r) {
    if (!connected(r.nodes.length, r.edges)) throw new Error('brueckenbach16: Revier ' + r.key + ' nicht zusammenhängend');
    var res = [];
    r.edges.forEach(function (e, i) {
      if (!connected(r.nodes.length, r.edges.filter(function (_, j) { return j !== i; }))) res.push(i);
    });
    return res;
  }
  REVIERE.forEach(function (r, i) {
    r.bridges = bridgesOf(r);
    if ((r.bridges.length === 0) !== (i === RIGHT)) throw new Error('brueckenbach16: Lösung stimmt nicht');
  });

  function se(tag, attrs, kids) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (c) { e.appendChild(c); });
    return e;
  }
  function edgePath(r, e) {
    var a = r.nodes[e[0]], b = r.nodes[e[1]];
    return e[2] ? 'M' + a[0] + ' ' + a[1] + ' Q' + e[2][0] + ' ' + e[2][1] + ' ' + b[0] + ' ' + b[1]
      : 'M' + a[0] + ' ' + a[1] + ' L' + b[0] + ' ' + b[1];
  }
  function midOf(r, e) {
    var a = r.nodes[e[0]], b = r.nodes[e[1]];
    if (!e[2]) return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    return [0.25 * a[0] + 0.5 * e[2][0] + 0.25 * b[0], 0.25 * a[1] + 0.5 * e[2][1] + 0.25 * b[1]];
  }

  function drawRevier(r, showBridges) {
    var svg = se('svg', { viewBox: '0 0 ' + r.vb[0] + ' ' + r.vb[1], class: P + 'svg', 'aria-hidden': 'true', focusable: 'false' });
    r.land.forEach(function (l) { svg.appendChild(se('ellipse', { cx: l[0], cy: l[1], rx: l[2], ry: l[3], class: P + 'land' })); });
    r.trees.forEach(function (t) {
      svg.appendChild(se('rect', { x: t[0] - 1.5, y: t[1] + 8, width: 3, height: 5, class: P + 'trunk' }));
      svg.appendChild(se('polygon', { points: (t[0] - 7) + ',' + (t[1] + 9) + ' ' + t[0] + ',' + (t[1] - 7) + ' ' + (t[0] + 7) + ',' + (t[1] + 9), class: P + 'tree' }));
    });
    r.edges.forEach(function (e) {
      var d = edgePath(r, e);
      svg.appendChild(se('path', { d: d, class: P + 'bank' }));
      svg.appendChild(se('path', { d: d, class: P + 'water' }));
    });
    r.nodes.forEach(function (n) {
      svg.appendChild(se('ellipse', { cx: n[0], cy: n[1], rx: 12, ry: 8.5, class: P + 'pond' }));
    });
    if (showBridges) {
      r.bridges.forEach(function (i) {
        var m = midOf(r, r.edges[i]);
        svg.appendChild(se('path', { d: edgePath(r, r.edges[i]), class: P + 'bridge' }));
        svg.appendChild(se('circle', { cx: m[0], cy: m[1], r: 7, class: P + 'dam' }));
        svg.appendChild(se('path', { d: 'M' + (m[0] - 3) + ' ' + (m[1] - 3) + 'L' + (m[0] + 3) + ' ' + (m[1] + 3) + 'M' + (m[0] + 3) + ' ' + (m[1] - 3) + 'L' + (m[0] - 3) + ' ' + (m[1] + 3), class: P + 'damx' }));
      });
    }
    return svg;
  }

  function describe(r) {
    return r.nodes.length + ' Teiche und ' + r.edges.length + ' Bäche';
  }

  var el, api, optsEl, locked, picked, mode;

  function optionCard(r, idx) {
    var sel = picked === idx;
    var cls = P + 'opt';
    var mark = '';
    if (mode && (mode === 'solution' ? idx === RIGHT : sel)) {
      var ok = idx === RIGHT;
      cls += ok ? ' right' : ' wrong';
      mark = ok ? '✓' : '✗';
    }
    var input = h('input', { type: 'radio', name: P + 'opt', value: String(idx), disabled: locked, 'aria-label': 'Revier ' + r.key + ' (' + describe(r) + ')' });
    input.checked = sel;
    var show = mode === 'check' || mode === 'solution';
    return h('label', { class: cls }, input,
      h('span', { class: P + 'card' },
        h('span', { class: P + 'let' }, r.key + ')'),
        drawRevier(r, show),
        mark ? h('span', { class: P + 'mark', 'aria-hidden': 'true' }, mark) : null));
  }
  function render() {
    optsEl.replaceChildren.apply(optsEl, REVIERE.map(optionCard));
  }
  function onChange(e) {
    if (locked || !e.target.matches('input[type=radio]')) return;
    picked = +e.target.value;
    render();
    var f = optsEl.querySelector('input:checked'); if (f) f.focus();
    api.changed('Revier ' + REVIERE[picked].key + ' gewählt.');
  }

  Biber.register({
    id: 'brueckenbach16',
    story: '<p>Im Biberrevier leben die Biber in Teichen. Jeder Teich hat mindestens einen Bach, durch den die Biber zum nächsten Teich schwimmen können. Die Biber schaffen aber auch Schwimmstrecken durch mehrere Bäche. So können sie zu jedem Teich schwimmen, egal wo sie starten.</p>' +
      '<p>Gerne blockieren die Biber einen Bach mit einem Damm. Aber sie müssen aufpassen: Wenn die Biber den falschen Bach blockieren, werden manche Teiche vom Rest des Biberreviers abgetrennt. Die Biber können dann nicht mehr zu jedem Teich schwimmen. Solch einen Bach nennen die Biber „Brücken-Bach“. Ein Brücken-Bach ist die einzige Verbindung zwischen zwei Teilen des Reviers.</p>' +
      '<p>Auf den Bildern sind einige Biberreviere zu sehen.</p>',
    question: 'Nur ein Biberrevier hat keinen Brücken-Bach. Welches?',
    howto: 'Tippe auf das Revier, das Du für richtig hältst.',
    explanation: function () {
      return '<p>Man prüft bei jedem Revier nacheinander jeden Bach: Kann man noch von jedem Teich zu jedem anderen schwimmen, wenn man ihn sperrt? Die rot markierten Bäche sind Brücken-Bäche.</p>' +
        '<ul class="' + P + 'list">' +
        '<li><b>Revier A:</b> Der Bach in der Mitte ist ein Brücken-Bach. Ist er gesperrt, kommen die Biber nicht mehr von unten nach oben (und umgekehrt).</li>' +
        '<li><b>Revier C:</b> Der Bach ganz links ist ein Brücken-Bach. Ist er gesperrt, erreichen die Biber den linken Teich nicht mehr.</li>' +
        '<li><b>Revier D:</b> Zwei Bäche in der Mitte sind Brücken-Bäche: der lange Bach zwischen den beiden mittleren oberen Teichen und der kurze Bach zum Teich, der nur an diesem einen Bach hängt.</li>' +
        '<li><b>Revier B:</b> Egal, welchen einzelnen Bach man sperrt, es bleibt immer ein anderer Weg übrig. Revier B hat keinen Brücken-Bach. Die richtige Antwort ist <b>B</b>.</li></ul>' +
        '<p><b>Informatik:</b> Das Biberrevier ist ein Netzwerk aus Teichen und Bächen, ähnlich wie das Internet: Dort sind Computer, Handys oder Fernseher die „Teiche“, Leitungen oder Funkverbindungen die „Bäche“. In der Informatik beschreibt man so etwas als Graphen aus Knoten und Kanten. Ein Graph, in dem man von jedem Knoten zu jedem anderen kommt, heißt zusammenhängend. Kanten, ohne die der Graph nicht mehr zusammenhängt, heißen Brücken. Fällt eine solche Verbindung aus, ist ein Teil des Netzes abgetrennt; deshalb versucht man, sie in Netzwerken zu vermeiden. Es gibt Algorithmen, die alle Brücken eines Graphen effizient finden, zum Beispiel einen von Robert Tarjan.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null;
      optsEl = h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Biberreviere' });
      el.replaceChildren(h('div', { class: P + 'box' }, optsEl));
      optsEl.addEventListener('change', onChange);
      render();
    },
    isComplete: function () { return picked !== null; },
    evaluate: function () { return { correct: picked === RIGHT, answer: picked }; },
    setAnswer: function (ans) { picked = typeof ans === 'number' && ans >= 0 && ans < REVIERE.length ? ans : null; mode = 'check'; render(); },
    lock: function (on) {
      locked = on;
      mode = on ? (mode || 'check') : null;
      render();
    },
    reset: function () { picked = null; mode = null; render(); },
    showSolution: function () { picked = RIGHT; mode = 'solution'; locked = true; render(); }
  });
})();
