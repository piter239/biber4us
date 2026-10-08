/* Aufgabe Bergseen (Klasse 9-13): Flussalgorithmen, Kanalnetz mit minimalen Kosten */
(function () {
  'use strict';
  var h = Biber.h, svg = Biber.svg;

  /* Seen: Zahl = abzuleitendes Wasser (aus der Abbildung abgelesen; Lage frei, Verbindungen wie im Heft) */
  var LAKES = {
    A: { x: 62, y: 72, rx: 34, ry: 20, w: 4 },
    B: { x: 225, y: 128, rx: 36, ry: 22, w: 5 },
    C: { x: 52, y: 232, rx: 28, ry: 18, w: 1 },
    D: { x: 222, y: 300, rx: 30, ry: 20, w: 2 },
    E: { x: 400, y: 62, rx: 92, ry: 24, w: 9 },
    F: { x: 385, y: 200, rx: 38, ry: 20, w: 3 },
    G: { x: 455, y: 320, rx: 38, ry: 20, w: 6 }
  };
  var ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  var SHORE = 446; /* y-Wert, an dem die Kanäle den Stausee erreichen */
  /* Kanäle: from, to ('S' = Stausee, sx = Mündung am Ufer), Kapazität = Kosten, t = Lage der Zahl, fx/fy = Startpunkt abweichend vom Seemittelpunkt */
  var EDGES = [
    { k: 'AB', a: 'A', b: 'B', c: 4 },
    { k: 'AC', a: 'A', b: 'C', c: 10 },
    { k: 'BD', a: 'B', b: 'D', c: 9 },
    { k: 'CD', a: 'C', b: 'D', c: 20 },
    { k: 'CS', a: 'C', b: 'S', c: 8, sx: 52 },
    { k: 'DS', a: 'D', b: 'S', c: 11, sx: 222 },
    { k: 'ED', a: 'E', b: 'D', c: 9, t: 0.45 },
    { k: 'EF', a: 'E', b: 'F', c: 10 },
    { k: 'ES', a: 'E', b: 'S', c: 20, sx: 528, fx: 485, fy: 72, t: 0.55 },
    { k: 'FD', a: 'F', b: 'D', c: 4 },
    { k: 'FG', a: 'F', b: 'G', c: 12 },
    { k: 'FS', a: 'F', b: 'S', c: 4, sx: 385 },
    { k: 'GS', a: 'G', b: 'S', c: 20, sx: 462 }
  ];
  var BY_KEY = {};
  EDGES.forEach(function (e) { BY_KEY[e.k] = e; });
  /* Die einzige günstigste Lösung (per Brute Force über alle 2^13 Mengen und Max-Flow geprüft): Kosten 74 */
  var SOLUTION = ['AB', 'BD', 'CS', 'DS', 'EF', 'FG', 'GS'];
  var BEST = 74;

  function lakeName(id) { return id === 'S' ? 'Stausee' : 'See ' + LAKES[id].w; }

  /* ---------- Rechnung: kann alles Wasser abgeleitet werden? (Edmonds-Karp) ---------- */
  function maxflow(built) {
    var idx = { src: 0, S: 1 };
    ORDER.forEach(function (id, i) { idx[id] = i + 2; });
    var n = ORDER.length + 2, cap = [], i, j;
    for (i = 0; i < n; i++) { cap.push([]); for (j = 0; j < n; j++) cap[i].push(0); }
    ORDER.forEach(function (id) { cap[0][idx[id]] = LAKES[id].w; });
    built.forEach(function (k) { var e = BY_KEY[k]; cap[idx[e.a]][idx[e.b]] += e.c; });
    var flow = 0;
    for (;;) {
      var par = [], q = [0];
      for (i = 0; i < n; i++) par.push(-1);
      par[0] = 0;
      while (q.length && par[1] < 0) {
        var u = q.shift();
        for (var v = 0; v < n; v++) if (par[v] < 0 && cap[u][v] > 0) { par[v] = u; q.push(v); }
      }
      if (par[1] < 0) break;
      var m = Infinity, x = 1;
      while (x !== 0) { m = Math.min(m, cap[par[x]][x]); x = par[x]; }
      x = 1;
      while (x !== 0) { cap[par[x]][x] -= m; cap[x][par[x]] += m; x = par[x]; }
      flow += m;
    }
    return flow;
  }
  var TOTAL = ORDER.reduce(function (s, id) { return s + LAKES[id].w; }, 0);
  function costOf(built) { return built.reduce(function (s, k) { return s + BY_KEY[k].c; }, 0); }
  /* Seen, aus denen es keinen gebauten Weg zum Stausee gibt */
  function stranded(built) {
    var reach = { S: true }, ch = true;
    while (ch) {
      ch = false;
      built.forEach(function (k) { var e = BY_KEY[k]; if (reach[e.b] && !reach[e.a]) { reach[e.a] = true; ch = true; } });
    }
    return ORDER.filter(function (id) { return !reach[id]; });
  }

  /* ---------- Geometrie ---------- */
  function clip(L, dx, dy) { /* Abstand vom Mittelpunkt bis zum Seerand in Richtung (dx, dy) */
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var ux = dx / len, uy = dy / len;
    return 1 / Math.sqrt(Math.pow(ux / L.rx, 2) + Math.pow(uy / L.ry, 2));
  }
  function geom(e) {
    var A = LAKES[e.a];
    var sx0 = e.fx != null ? e.fx : A.x, sy0 = e.fy != null ? e.fy : A.y;
    var tx, ty;
    if (e.b === 'S') { tx = e.sx; ty = SHORE; } else { tx = LAKES[e.b].x; ty = LAKES[e.b].y; }
    var dx = tx - sx0, dy = ty - sy0, len = Math.sqrt(dx * dx + dy * dy), ux = dx / len, uy = dy / len;
    var r1 = e.fx != null ? 6 : clip(A, dx, dy) + 5;
    var r2 = e.b === 'S' ? 0 : clip(LAKES[e.b], dx, dy) + 6;
    var x1 = sx0 + ux * r1, y1 = sy0 + uy * r1, x2 = tx - ux * r2, y2 = ty - uy * r2;
    var t = e.t || 0.5;
    return { x1: x1, y1: y1, x2: x2, y2: y2, ux: ux, uy: uy, bx: x1 + (x2 - x1) * t, by: y1 + (y2 - y1) * t };
  }
  function f1(v) { return v.toFixed(1); }
  function head(g) {
    var s = 13, w = 6.5, bx = g.x2 - g.ux * s, by = g.y2 - g.uy * s;
    return f1(g.x2) + ',' + f1(g.y2) + ' ' + f1(bx - g.uy * w) + ',' + f1(by + g.ux * w) + ' ' + f1(bx + g.uy * w) + ',' + f1(by - g.ux * w);
  }

  var el, api, locked, mode; /* mode: play | check | solution */
  var built, parts, infoEl, resEl;

  function sorted() { return EDGES.map(function (e) { return e.k; }).filter(function (k) { return built.indexOf(k) >= 0; }); }

  function edgeLabel(e) {
    return 'Kanal von ' + lakeName(e.a) + ' zum ' + lakeName(e.b) + ', Kapazität ' + e.c;
  }

  function paint() {
    EDGES.forEach(function (e) {
      var p = parts[e.k], on = built.indexOf(e.k) >= 0;
      var st = (on ? ' on' : '') + (on && mode === 'solution' ? ' sol' : '');
      p.g.setAttribute('class', 'bs-edge' + st);
      p.b.setAttribute('class', 'bs-badge' + st);
      p.b.setAttribute('aria-pressed', on ? 'true' : 'false');
      p.b.setAttribute('aria-label', edgeLabel(e) + (on ? ', gebaut' : ', nicht gebaut'));
    });
    var bad = mode === 'check' ? stranded(built) : [];
    ORDER.forEach(function (id) {
      parts[id].setAttribute('class', 'bs-lake' + (bad.indexOf(id) >= 0 ? ' bad' : ''));
    });
    var cost = costOf(built);
    infoEl.textContent = 'Gebaute Kanäle: ' + built.length + ' · Baukosten: ' + cost;
    var msg = '', cls = '';
    if (mode === 'check' || mode === 'solution') {
      var flow = maxflow(built);
      if (mode === 'solution') { msg = 'Eine günstigste Lösung: Baukosten ' + cost + '.'; cls = 'ok'; }
      else if (flow < TOTAL) {
        msg = 'Hier läuft bei starkem Regen Wasser über: Es kommen nur ' + flow + ' von ' + TOTAL + ' Einheiten im Stausee an' +
          (bad.length ? '; ' + bad.map(lakeName).join(', ') + (bad.length > 1 ? ' haben' : ' hat') + ' gar keinen Weg zum Stausee.' : ' (mindestens ein Kanal ist zu klein).');
        cls = 'bad';
      } else if (cost > BEST) { msg = 'Das Wasser wird abgeleitet, aber der Bau kostet ' + cost + ' und es geht noch günstiger.'; cls = 'bad'; }
      else { msg = 'Alles Wasser wird abgeleitet, Baukosten ' + cost + ' sind das Minimum.'; cls = 'ok'; }
    }
    resEl.textContent = msg;
    resEl.setAttribute('class', 'bs-result' + (cls ? ' ' + cls : ''));
  }

  function toggle(k) {
    if (locked) return;
    var i = built.indexOf(k);
    if (i >= 0) built.splice(i, 1); else built.push(k);
    paint();
    api.changed(built.length ? 'Baukosten: ' + costOf(built) : '');
  }

  function build() {
    parts = {};
    var s = svg('svg', { class: 'bs-svg', viewBox: '0 0 560 520', role: 'group', 'aria-label': 'Karte der Bergseen mit möglichen Kanälen' });
    s.appendChild(svg('path', { class: 'bs-land', 'aria-hidden': 'true', d: 'M0 450V40L38 22C60 12 78 22 96 14L132 4C150 0 166 18 184 24C204 30 214 12 240 14L274 18L306 34C322 40 336 26 352 18L384 6C400 2 410 20 430 26C452 34 470 14 496 12L528 12L560 22V450Z' }));
    s.appendChild(svg('path', { class: 'bs-reservoir', 'aria-hidden': 'true', d: 'M0 452C70 440 150 450 235 444S410 438 485 442S540 446 560 450V520H0Z' }));
    s.appendChild(svg('text', { class: 'bs-rtext', x: 280, y: 492, 'text-anchor': 'middle', 'aria-hidden': 'true' }, 'Stausee'));
    var layerHit = svg('g'), layerVis = svg('g'), layerLake = svg('g'), layerBadge = svg('g');
    EDGES.forEach(function (e) {
      var g = geom(e);
      layerHit.appendChild(svg('line', { class: 'bs-hit', 'data-edge': e.k, x1: f1(g.x1), y1: f1(g.y1), x2: f1(g.x2), y2: f1(g.y2) }));
      var vis = svg('g', { 'aria-hidden': 'true' },
        svg('line', { class: 'bs-line', x1: f1(g.x1), y1: f1(g.y1), x2: f1(g.x2 - g.ux * 6), y2: f1(g.y2 - g.uy * 6) }),
        svg('polygon', { class: 'bs-head', points: head(g) }));
      layerVis.appendChild(vis);
      var badge = svg('g', { class: 'bs-badge', 'data-edge': e.k, role: 'button', tabindex: '0', transform: 'translate(' + f1(g.bx) + ' ' + f1(g.by) + ')' },
        svg('circle', { class: 'bs-bhit', r: 27 }),
        svg('circle', { class: 'bs-bdot', r: 20 }),
        svg('text', { class: 'bs-btext', 'text-anchor': 'middle', y: 7.5 }, String(e.c)));
      layerBadge.appendChild(badge);
      parts[e.k] = { g: vis, b: badge };
    });
    ORDER.forEach(function (id) {
      var L = LAKES[id];
      var g = svg('g', { class: 'bs-lake', 'aria-hidden': 'true' },
        svg('ellipse', { class: 'bs-water', cx: L.x, cy: L.y, rx: L.rx, ry: L.ry }),
        svg('text', { class: 'bs-ltext', x: L.x, y: L.y + 8, 'text-anchor': 'middle' }, String(L.w)));
      layerLake.appendChild(g);
      parts[id] = g;
    });
    s.appendChild(layerHit); s.appendChild(layerVis); s.appendChild(layerLake); s.appendChild(layerBadge);
    return s;
  }

  function onClick(e) {
    var t = e.target.closest('[data-edge]');
    if (t) toggle(t.getAttribute('data-edge'));
  }
  function onKey(e) {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    var t = e.target.closest && e.target.closest('[data-edge]');
    if (!t) return;
    e.preventDefault();
    toggle(t.getAttribute('data-edge'));
  }

  Biber.register({
    id: 'bergseen',
    story: '<p>Am Bergmassiv hinter dem Stausee gibt es mehrere kleine Bergseen. Bei starkem Regen könnten sie überlaufen, und das ist gefährlich. Deshalb sollen zwischen einigen Seen Kanäle gebaut werden. Diese Kanäle sollen alles überschüssige Wasser aus den Bergseen in den Stausee ableiten können. Gleichzeitig soll ihr Bau <strong>möglichst wenig kosten</strong>.</p>' +
      '<p>Für jeden Bergsee gibt eine Zahl an, wieviel überschüssiges Wasser aus dem See abgeleitet werden muss.</p>' +
      '<p>An jeder Stelle zwischen zwei Seen, an der ein Kanal gebaut werden kann, ist ein Pfeil. Er zeigt, in welche Richtung ein Kanal das Wasser dort ableiten würde. Die Zahl an einem Pfeil gibt die Kapazität des Kanals an, also wieviel überschüssiges Wasser er ableiten kann. Die Kapazität bestimmt auch die Kosten für den Bau eines Kanals an dieser Stelle.</p>' +
      '<p>Beachte: Wenn ein Kanal Wasser von einem kleinen Bergsee in einen zweiten ableitet, sammelt sich im zweiten See das überschüssige Wasser aus beiden Seen.</p>',
    question: 'An welchen Stellen sollen Kanäle gebaut werden?',
    howto: 'Tippe auf einen Pfeil oder seine Zahl, um dort einen Kanal zu bauen. Tippe noch einmal, um ihn wieder zu entfernen.',
    explanation: function () {
      return '<p>Jeder See muss seine Wassermenge samt dem Wasser, das andere Seen in ihn leiten, loswerden. A (4) und B (5) leiten zusammen 9 ab: Der Kanal B→D mit Kapazität 9 reicht genau, danach hat D 9 + 2 = 11 und braucht den Kanal D→Stausee mit 11. ' +
        'C (1) kommt mit dem Kanal 8 aus, A→B (4) ist billiger als A→C (10). E (9) und F (3) ergeben 12, also genau den Kanal F→G (12); G hat dann 6 + 12 = 18 und braucht G→Stausee (20). ' +
        'E→Stausee (20) plus F→Stausee (4) wäre mit 24 teurer als E→F (10) plus F→G (12) mit 22. Die Baukosten sind 4 + 9 + 8 + 11 + 10 + 12 + 20 = <strong>74</strong>; das ist die einzige günstigste Lösung.</p>' +
        '<p>Solche Netze mit Kapazitäten heißen Flussnetzwerke. Ob ein Netz das Wasser ableiten kann, entscheidet der maximale Fluss; hier kommt es zusätzlich darauf an, unter allen ausreichenden Kanalmengen die billigste zu finden.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; mode = 'play'; built = [];
      infoEl = h('div', { class: 'bs-info', 'aria-live': 'polite' });
      resEl = h('div', { class: 'bs-result', 'aria-live': 'polite' });
      var s = build();
      s.addEventListener('click', onClick);
      s.addEventListener('keydown', onKey);
      el.replaceChildren(h('div', { class: 'bs-board' },
        h('div', { class: 'bs-map' }, s),
        h('p', { class: 'bs-legend' }, 'Zahl im See: abzuleitendes Wasser. Zahl am Pfeil: Kapazität des Kanals, zugleich seine Baukosten.'),
        infoEl, resEl));
      paint();
    },
    isComplete: function () { return built.length > 0; },
    evaluate: function () {
      var ok = maxflow(built) === TOTAL && costOf(built) === BEST;
      return { correct: ok, answer: sorted() };
    },
    setAnswer: function (ans) {
      built = (ans || []).filter(function (k) { return BY_KEY[k]; });
      mode = 'check';
      paint();
    },
    lock: function (on) {
      locked = on;
      if (on) { if (mode !== 'solution') mode = 'check'; } else mode = 'play';
      paint();
    },
    reset: function () { built = []; mode = 'play'; paint(); api.changed(''); },
    showSolution: function () {
      built = SOLUTION.slice();
      mode = 'solution';
      paint();
    }
  });
})();
