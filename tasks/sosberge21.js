/* Aufgabe S.O.S. aus den Bergen (Biber 2021; Klasse 7-8 schwer, 9-10 mittel, 11-13 leicht): Netzwerke, Erreichbarkeit, Redundanz */
(function () {
  'use strict';
  var h = Biber.h;
  function S(tag, attrs, kids) {   /* SVG-Element; kids: Array, Element oder Text */
    var e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.keys(attrs || {}).forEach(function (k) { if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]); });
    (Array.isArray(kids) ? kids : [kids]).forEach(function (c) { if (c !== null && c !== undefined && c !== false) e.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c))); });
    return e;
  }
  var P = 't-sosberge21-';

  /* Dörfer (viewBox 0 0 810 345), C und E melden S.O.S. */
  var V = { A: [215, 90], B: [130, 195], C: [370, 155], D: [575, 120], E: [250, 292], F: [505, 270], G: [725, 190], H: [575, 50] };
  /* Straßen: Dörfer, Lage des Zeichens (Mitte der Kurve), richtiger Zustand (Heft: no / yes / unk) */
  var ROADS = [
    { a: 'A', b: 'B', m: [210, 133], s: 'unk' },
    { a: 'A', b: 'C', m: [293, 123], s: 'no' },
    { a: 'A', b: 'D', m: [466, 103], s: 'unk' },
    { a: 'C', b: 'D', m: [483, 156], s: 'no' },
    { a: 'C', b: 'G', m: [512, 198], s: 'no' },
    { a: 'D', b: 'G', m: [680, 160], s: 'unk' },
    { a: 'B', b: 'G', m: [395, 235], s: 'unk' },
    { a: 'B', b: 'E', m: [149, 266], s: 'no' },
    { a: 'E', b: 'F', m: [397, 298], s: 'no' },
    { a: 'F', b: 'G', m: [650, 248], s: 'yes' },
    { a: 'D', b: 'H', m: [633, 76], s: 'yes' }
  ];
  var ORDER = [null, 'no', 'yes', 'unk'];
  var NAME = { no: 'nicht befahrbar', yes: 'befahrbar', unk: 'unklar (ohne weitere Information nicht zu sagen)' };

  /* Lösung gegen alle möglichen Zustände prüfen (Erreichbarkeit von A über befahrbare Straßen: genau C und E nicht erreichbar) */
  (function selfTest() {
    var nodes = Object.keys(V), n = ROADS.length, seen = {}, i;
    var could = ROADS.map(function () { return { 0: false, 1: false }; });
    for (var mask = 0; mask < (1 << n); mask++) {
      var adj = {};
      nodes.forEach(function (k) { adj[k] = []; });
      ROADS.forEach(function (r, j) { if (mask >> j & 1) { adj[r.a].push(r.b); adj[r.b].push(r.a); } });
      seen = { A: 1 }; var st = ['A'];
      while (st.length) { var x = st.pop(); adj[x].forEach(function (y) { if (!seen[y]) { seen[y] = 1; st.push(y); } }); }
      var unreach = nodes.filter(function (k) { return !seen[k]; }).join('');
      if (unreach === 'CE') for (i = 0; i < n; i++) could[i][mask >> i & 1] = true;
    }
    ROADS.forEach(function (r, j) {
      var s = could[j][0] && could[j][1] ? 'unk' : (could[j][1] ? 'yes' : 'no');
      if (s !== r.s) throw new Error('sosberge21: Lösung stimmt nicht (' + r.a + r.b + ')');
    });
  })();

  function key(r) { return r.a + r.b; }
  function label(r) { return r.a + ' – ' + r.b; }
  function path(r) {
    var p0 = V[r.a], p2 = V[r.b], cx = (4 * r.m[0] - p0[0] - p2[0]) / 2, cy = (4 * r.m[1] - p0[1] - p2[1]) / 2;
    return 'M' + p0[0] + ' ' + p0[1] + 'Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + p2[0] + ' ' + p2[1];
  }

  var el, api, locked, mark, state, svg, countEl;

  function glyph(st) {   /* Zeichen im Kreis, Mitte (0,0) */
    if (st === 'no') return [S('circle', { r: 14, class: P + 'z-no' }), S('rect', { x: -8, y: -3.2, width: 16, height: 6.4, rx: 1.5, class: P + 'bar' })];
    if (st === 'yes') return [S('circle', { r: 14, class: P + 'z-yes' }), S('path', { d: 'M-7 0L-2 6L8 -6', class: P + 'tick' })];
    if (st === 'unk') return [S('circle', { r: 14, class: P + 'z-unk' }), S('text', { y: 7, 'text-anchor': 'middle', class: P + 'q' }, '?')];
    return [S('circle', { r: 14, class: P + 'z-none' })];
  }
  function house(x, y, k) {
    return S('g', { transform: 'translate(' + x + ' ' + y + ')', 'aria-hidden': 'true' }, [
      S('rect', { x: -5, y: -3, width: 10, height: 7, class: P + 'hw' + k }),
      S('path', { d: 'M-6.5 -3L0 -9L6.5 -3Z', class: P + 'hr' })]);
  }
  function village(k) {
    var p = V[k], sos = k === 'C' || k === 'E';
    var g = S('g', { transform: 'translate(' + p[0] + ' ' + p[1] + ')', 'aria-hidden': 'true' }, [
      S('ellipse', { rx: 40, ry: 25, class: P + 'vbase' }),
      house(-24, 6, 0), house(24, 8, 1), house(-12, 15, 1), house(14, -12, 0), house(-22, -9, 1), house(26, 17, 0),
      S('circle', { r: 14, class: P + 'vbadge' }),
      S('text', { y: 6, 'text-anchor': 'middle', class: P + 'vl' }, k)
    ]);
    if (sos) {
      g.appendChild(S('g', { transform: 'translate(12 -22)' }, [
        S('line', { x1: 0, y1: 0, x2: -4, y2: 30, class: P + 'pole' }),
        S('path', { d: 'M0 -4H44L38 7L44 18H0Z', class: P + 'flag' }),
        S('text', { x: 20, y: 11, 'text-anchor': 'middle', class: P + 'sos' }, 'SOS')]));
    }
    return g;
  }

  function draw() {
    var kids = [];
    kids.push(S('rect', { x: 0, y: 0, width: 810, height: 345, rx: 10, class: P + 'land' }));
    kids.push(S('path', { d: 'M0 0H810V28L770 52L740 26L700 60L650 20L600 48L560 24L520 62L470 22L420 54L380 18L330 56L290 24L240 60L190 22L140 50L90 20L40 52L0 30Z', class: P + 'mount' }));
    kids.push(S('path', { d: 'M405 85C330 120 290 180 235 230S130 300 112 345', class: P + 'river' }));
    /* Hauptstraße oben links: befahrbar */
    kids.push(S('path', { d: 'M0 92L172 90', class: P + 'main' }));
    kids.push(S('text', { x: 6, y: 78, class: P + 'maintxt', 'aria-hidden': 'true' }, 'Hauptstraße'));
    ROADS.forEach(function (r) {
      var st = state[key(r)], cls = st || 'none';
      var g = S('g', { class: P + 'road ' + P + 'r-' + cls });
      g.appendChild(S('path', { d: path(r), class: P + 'rout' }));
      g.appendChild(S('path', { d: path(r), class: P + 'rin' }));
      kids.push(g);
    });
    Object.keys(V).forEach(function (k) { kids.push(village(k)); });
    ROADS.forEach(function (r) {
      var st = state[key(r)];
      var wrong = mark === 'check' && st !== r.s;
      var g = S('g', {
        class: P + 'btn' + (wrong ? ' ' + P + 'wrong' : '') + (mark === 'check' && !wrong ? ' ' + P + 'right' : ''),
        transform: 'translate(' + r.m[0] + ' ' + r.m[1] + ')', role: 'button', tabindex: locked ? '-1' : '0',
        'aria-label': 'Straße ' + label(r) + ': ' + (st ? NAME[st] : 'noch nicht angegeben') + (locked ? '' : '. Antippen zum Wechseln.'),
        'data-road': key(r)
      }, [S('circle', { r: 24, class: P + 'hit' })].concat(glyph(st)));
      g.addEventListener('click', function () { cycle(r); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cycle(r); } });
      kids.push(g);
    });
    svg.replaceChildren.apply(svg, kids);
    svg.classList.toggle('locked', !!locked);
    var done = ROADS.filter(function (r) { return state[key(r)]; }).length;
    countEl.textContent = done + ' von ' + ROADS.length + ' Straßen angegeben.';
  }

  function cycle(r) {
    if (locked) return;
    var k = key(r), i = ORDER.indexOf(state[k] || null);
    state[k] = ORDER[(i + 1) % ORDER.length];
    if (!state[k]) delete state[k];
    draw();
    var b = svg.querySelector('[data-road="' + k + '"]');
    if (b) b.focus();
    api.changed();
  }
  function allRight() { return ROADS.every(function (r) { return state[key(r)] === r.s; }); }

  function legendItem(st, text) {
    var s = S('svg', { class: P + 'lg', viewBox: '-16 -16 32 32', 'aria-hidden': 'true' }, glyph(st));
    return h('li', null, s, h('span', null, text));
  }

  Biber.register({
    id: 'sosberge21',
    story:
      '<p>Einige Dörfer in den Bergen sind über ein Straßennetz zu erreichen. Nach einem Unwetter sind zwei Dörfer aber nicht mehr erreichbar und melden S.O.S. (die Dörfer mit der Fahne). Daraus lässt sich auf den Zustand der Straßen schließen. Es gibt drei Möglichkeiten:</p>' +
      '<ul class="' + P + 'rules"><li><b>Nicht befahrbar:</b> Die Straße ist nicht befahrbar.</li><li><b>Befahrbar:</b> Die Straße ist befahrbar.</li><li><b>Unklar (?):</b> Ohne weitere Information kann man nicht sagen, ob die Straße befahrbar oder nicht befahrbar ist.</li></ul>' +
      '<p>Unten siehst du das Straßennetz. Die Hauptstraße oben links ist befahrbar.</p>',
    question: 'Gib für jede andere Straße ihren Zustand an.',
    howto: 'Tippe auf das Zeichen an einer Straße: Jedes Antippen wechselt zwischen nicht befahrbar, befahrbar und unklar.',
    explanation: function () {
      return '<p>Alle Straßen, die zu den nicht erreichbaren Dörfern C und E führen, müssen <strong>nicht befahrbar</strong> sein, sonst könnte man diese Dörfer doch erreichen.</p>' +
        '<p>Dorf F ist nur noch über die Straße F–G zu erreichen, und Dorf H nur über D–H. Beide Straßen müssen also <strong>befahrbar</strong> sein.</p>' +
        '<p>Übrig bleibt der Straßenkreis A–B–G–D–A. Jede einzelne dieser vier Straßen könnte gesperrt sein, denn dann sind die vier Dörfer über die anderen drei Straßen erreichbar. Sie könnte aber auch befahrbar sein. Hier gilt also: <strong>unklar</strong>.</p>' +
        '<p>Informatik: In einem Netzwerk mit mehreren Wegen (Redundanz) fällt ein einzelner Ausfall oft nicht auf. Eine Verbindung, die als einzige zu einem Knoten führt, muss dagegen funktionieren, sonst wäre der Knoten abgeschnitten.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; mark = null; state = {};
      svg = S('svg', { class: P + 'svg', viewBox: '0 0 810 345', role: 'group', 'aria-label': 'Karte mit acht Dörfern A bis H und elf Straßen. Die Dörfer C und E melden S.O.S. Die Hauptstraße links oben führt nach A und ist befahrbar.' });
      countEl = h('p', { class: P + 'count', role: 'status', 'aria-live': 'polite' });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('ul', { class: P + 'legend', 'aria-label': 'Zeichen' },
          legendItem('no', 'nicht befahrbar'), legendItem('yes', 'befahrbar'), legendItem('unk', 'unklar'), legendItem(null, 'noch nicht angegeben')),
        svg, countEl));
      draw();
    },
    isComplete: function () { return ROADS.every(function (r) { return state[key(r)]; }); },
    evaluate: function () {
      var ans = {};
      ROADS.forEach(function (r) { ans[key(r)] = state[key(r)] || null; });
      return { correct: allRight(), answer: ans };
    },
    setAnswer: function (ans) {
      state = {};
      ROADS.forEach(function (r) { if (ans && ORDER.indexOf(ans[key(r)]) > 0) state[key(r)] = ans[key(r)]; });
      mark = allRight() ? 'solution' : 'check';
      draw();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : (allRight() ? 'solution' : 'check')) : null;
      draw();
    },
    reset: function () { state = {}; mark = null; draw(); },
    showSolution: function () {
      state = {}; ROADS.forEach(function (r) { state[key(r)] = r.s; });
      locked = true; mark = 'solution'; draw();
    }
  });
})();
