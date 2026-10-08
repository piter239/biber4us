/* Aufgabe Links-Rechts-Spiel (Biber 2020; Klasse 7-8 mittel, 9-10 leicht): Minimax in einem Spielbaum mit acht Depots */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-linksrechts20-';

  /* Chips je Depot von links nach rechts (Heft S. 37: 2, 7, 5, 4, 8, 6, 1, 3) */
  var CHIPS = [2, 7, 5, 4, 8, 6, 1, 3];
  var CHIP_COLORS = ['#ffc90e', '#ff7a00', '#f20d0d', '#5e0a3d', '#a31cf5', '#0a14b8', '#0a6a1c', '#1fe02a'];

  /* Minimax: Alice (Start und unterste Verzweigung) maximiert, Bob (mittlere Verzweigung) minimiert */
  var SOLVED = (function () {
    var l3 = [], l2 = [], i;
    for (i = 0; i < 4; i++) l3.push(Math.max(CHIPS[2 * i], CHIPS[2 * i + 1]));
    for (i = 0; i < 2; i++) l2.push(Math.min(l3[2 * i], l3[2 * i + 1]));
    var root = Math.max(l2[0], l2[1]);
    var b = l2[0] >= l2[1] ? 0 : 1;                    /* Aliceʼ Wahl am Start */
    var a = l3[2 * b] <= l3[2 * b + 1] ? 2 * b : 2 * b + 1;   /* Bobs Wahl */
    var d = CHIPS[2 * a] >= CHIPS[2 * a + 1] ? 2 * a : 2 * a + 1;   /* Aliceʼ letzte Wahl */
    return { l3: l3, l2: l2, root: root, depot: d };
  })();
  var RIGHT = SOLVED.depot;   /* Index 2 = drittes Depot mit 5 Chips; mit dem Heft abgeglichen */

  var el, api, box, svgHost, selected, locked, mode, orient, ro;

  function reset() { selected = null; mode = null; }

  /* ---------- Zeichnen ---------- */
  function chipsSvg(n, cx, cy, perRow, pitch, r) {
    var out = '', rows = Math.ceil(n / perRow), i;
    for (i = 0; i < n; i++) {
      var row = Math.floor(i / perRow), inRow = Math.min(perRow, n - row * perRow), col = i - row * perRow;
      var x = cx + (col - (inRow - 1) / 2) * pitch, y = cy + (row - (rows - 1) / 2) * pitch;
      out += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r + '" fill="' + CHIP_COLORS[i] + '" class="' + P + 'chip"/>' +
        '<path d="M' + (x - r * 0.55).toFixed(1) + ' ' + (y - r * 0.2).toFixed(1) + ' Q' + (x - r * 0.25).toFixed(1) + ' ' + (y - r * 0.65).toFixed(1) + ' ' + (x + r * 0.3).toFixed(1) + ' ' + (y - r * 0.6).toFixed(1) + '" class="' + P + 'shine"/>';
    }
    return out;
  }
  function elbow(o, x1, y1, x2, y2) {
    if (o === 'v') { var my = (y1 + y2) / 2; return 'M' + x1 + ' ' + y1 + ' V' + my + ' H' + x2 + ' V' + y2; }
    var mx = (x1 + x2) / 2;
    return 'M' + x1 + ' ' + y1 + ' H' + mx + ' V' + y2 + ' H' + x2;
  }
  function layout(o) {
    var L = { depots: [], n3: [], n2: [], root: null }, i;
    if (o === 'v') {
      L.W = 832; L.H = 346; L.bw = 92; L.bh = 92;
      for (i = 0; i < 8; i++) L.depots.push({ x: 52 + 104 * i, y: 56 });
      for (i = 0; i < 4; i++) L.n3.push({ x: (L.depots[2 * i].x + L.depots[2 * i + 1].x) / 2, y: 170 });
      for (i = 0; i < 2; i++) L.n2.push({ x: (L.n3[2 * i].x + L.n3[2 * i + 1].x) / 2, y: 238 });
      L.root = { x: (L.n2[0].x + L.n2[1].x) / 2, y: 304 };
      L.perRow = 3; L.pitch = 27; L.r = 12;
    } else {
      L.W = 392; L.H = 632; L.bw = 156; L.bh = 70;
      for (i = 0; i < 8; i++) L.depots.push({ x: 306, y: 39 + 78 * i });
      for (i = 0; i < 4; i++) L.n3.push({ y: (L.depots[2 * i].y + L.depots[2 * i + 1].y) / 2, x: 190 });
      for (i = 0; i < 2; i++) L.n2.push({ y: (L.n3[2 * i].y + L.n3[2 * i + 1].y) / 2, x: 120 });
      L.root = { y: (L.n2[0].y + L.n2[1].y) / 2, x: 40 };
      L.perRow = 4; L.pitch = 27; L.r = 12;
    }
    return L;
  }
  function edgeAnchor(o, L, d) {   /* Anschlusspunkt des Depots zum Baum */
    return o === 'v' ? { x: d.x, y: d.y + L.bh / 2 } : { x: d.x - L.bw / 2, y: d.y };
  }
  function svgFor() {
    var o = orient, L = layout(o), i, out = '';
    var pathKeys = selected !== null ? ['d' + selected, 'a' + (selected >> 1), 'b' + (selected >> 2)] : [];
    var edges = [];
    for (i = 0; i < 8; i++) { var a = edgeAnchor(o, L, L.depots[i]), n = L.n3[i >> 1]; edges.push({ k: 'd' + i, d: elbow(o, n.x, n.y, a.x, a.y) }); }
    for (i = 0; i < 4; i++) edges.push({ k: 'a' + i, d: elbow(o, L.n2[i >> 1].x, L.n2[i >> 1].y, L.n3[i].x, L.n3[i].y) });
    for (i = 0; i < 2; i++) edges.push({ k: 'b' + i, d: elbow(o, L.root.x, L.root.y, L.n2[i].x, L.n2[i].y) });
    edges.forEach(function (e) {
      var on = pathKeys.indexOf(e.k) >= 0;
      out += '<path d="' + e.d + '" class="' + P + 'edge' + (on ? ' ' + P + 'on' : '') + (on && mode === 'solution' ? ' ' + P + 'sol' : '') + '"/>';
    });
    /* Depots */
    for (i = 0; i < 8; i++) {
      var d = L.depots[i];
      var cls = P + 'depot' + (selected === i ? ' selected' : '');
      if (selected === i && mode === 'check') cls += i === RIGHT ? ' ' + P + 'right' : ' ' + P + 'wrong';
      if (mode === 'solution' && i === RIGHT) cls += ' ' + P + 'right selected';
      var isSel = selected === i;
      out += '<g class="' + cls + '" data-depot="' + i + '" role="radio" aria-checked="' + isSel + '" aria-label="Depot ' + (i + 1) + ' von 8 mit ' + CHIPS[i] + (CHIPS[i] === 1 ? ' Chip' : ' Chips') + '"' +
        ' tabindex="' + ((selected === null ? i === 0 : isSel) ? 0 : -1) + '" aria-disabled="' + locked + '">' +
        '<rect x="' + (d.x - L.bw / 2) + '" y="' + (d.y - L.bh / 2) + '" width="' + L.bw + '" height="' + L.bh + '" rx="14" class="' + P + 'box"/>' +
        chipsSvg(CHIPS[i], d.x, d.y, L.perRow, L.pitch, L.r);
      if (mode === 'check' || mode === 'solution') {
        if ((selected === i && mode === 'check') || (mode === 'solution' && i === RIGHT)) {
          var ok = i === RIGHT;
          out += '<g class="' + P + 'mark ' + (ok ? P + 'm-ok' : P + 'm-bad') + '" transform="translate(' + (d.x + L.bw / 2 - 4) + ' ' + (d.y - L.bh / 2 + 4) + ')"><circle r="13"/><text y="5" text-anchor="middle">' + (ok ? '✓' : '✗') + '</text></g>';
        }
      }
      out += '</g>';
    }
    /* Verzweigungen */
    function node(p, who, val, big) {
      var t = mode === 'solution' && val != null ? String(val) : (who === 'a' ? 'A' : 'B');
      return '<g class="' + P + 'node ' + P + (who === 'a' ? 'alice' : 'bob') + '"><circle cx="' + p.x + '" cy="' + p.y + '" r="' + (big ? 20 : 16) + '"/>' +
        '<text x="' + p.x + '" y="' + (p.y + 6) + '" text-anchor="middle">' + t + '</text></g>';
    }
    for (i = 0; i < 4; i++) out += node(L.n3[i], 'a', SOLVED.l3[i]);
    for (i = 0; i < 2; i++) out += node(L.n2[i], 'b', SOLVED.l2[i]);
    out += node(L.root, 'a', SOLVED.root, true);
    /* Spielfigur */
    var px = L.root.x, py = L.root.y;
    out += '<g class="' + P + 'pawn" transform="translate(' + px + ' ' + (py - 2) + ')"><ellipse cx="0" cy="22" rx="12" ry="4" class="' + P + 'pawn-sh"/>' +
      '<path d="M-10 20 Q-4 -2 -3 -8 L3 -8 Q4 -2 10 20 Z"/><circle cx="0" cy="-13" r="7"/></g>';
    return '<svg class="' + P + 'tree ' + P + 'o-' + o + '" viewBox="0 0 ' + L.W + ' ' + L.H + '" role="radiogroup" aria-label="Spielbaum mit acht Depots, wähle das Depot, das die Figur erreicht">' + out + '</svg>';
  }

  function draw() {
    svgHost.innerHTML = svgFor();
  }
  function choose(i, focus) {
    if (locked || i < 0 || i > 7) return;
    selected = i;
    draw();
    if (focus) { var n = svgHost.querySelector('[data-depot="' + i + '"]'); if (n) n.focus(); }
    api.changed('Depot ' + (i + 1) + ' gewählt.');
  }
  function onClick(e) {
    var d = e.target.closest('[data-depot]');
    if (d) choose(+d.dataset.depot, false);
  }
  function onKey(e) {
    var d = e.target.closest('[data-depot]');
    if (!d) return;
    var i = +d.dataset.depot, k = e.key;
    if (k === 'Enter' || k === ' ') { e.preventDefault(); choose(i, true); }
    else if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); choose((i + 1) % 8, true); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); choose((i + 7) % 8, true); }
  }
  function pickOrient() {
    var w = box.clientWidth || el.clientWidth || 800;
    var o = w < 600 ? 'h' : 'v';
    if (o !== orient) { orient = o; draw(); }
  }

  Biber.register({
    id: 'linksrechts20',
    story:
      '<p>Beim Links-Rechts-Spiel gibt es acht Depots, auf die unterschiedlich viele Spiel-Chips verteilt werden. Eine Spielfigur zieht vom Startfeld aus zu einem Depot. Jedes Spielfeld hat eine Verzweigung, nach links oder rechts.</p>' +
      '<p>Beim Startfeld entscheidet Alice, welchen Weg die Figur nimmt; bei der nächsten Verzweigung entscheidet Bob und schließlich wieder Alice. Alices Ziel ist, dass die Spielfigur ein Depot mit möglichst vielen Chips erreicht. Bobs Ziel ist hingegen, dass die Figur ein Depot mit möglichst wenigen Chips erreicht. Beide wissen voneinander, dass sie gute Spieler sind und sich immer für die Richtung entscheiden, die für ihr Ziel die beste ist.</p>' +
      '<p>Ein Beispiel: Wenn Bob die Figur zur Verzweigung ganz links zieht, dann weiß Bob, dass anschließend Alice die Figur auf das Depot mit 7 Spielsteinen zieht.</p>' +
      '<p>Ein neues Spiel beginnt, die Spiel-Chips sind verteilt.</p>',
    question: 'Welches Depot wird die Spielfigur erreichen?',
    howto: 'Tippe das Depot an, das die Figur erreicht. Die Verzweigungen mit A gehören Alice (viele Chips), die mit B gehören Bob (wenige Chips).',
    explanation: function () {
      return '<p>Man rechnet von den Depots aus rückwärts. Bei den letzten Verzweigungen wählt Alice das Depot mit mehr Chips; dort stehen dann 7, 5, 8 und 3. Bei den Verzweigungen davor wählt Bob den kleineren der beiden Werte, das sind 5 und 3. Am Start wählt Alice den größeren Wert, also <strong>5</strong>.</p>' +
        '<p>Die Figur geht also am Start nach links (ginge sie nach rechts, bekäme Alice höchstens 3). Bob zieht nach rechts, denn nach links würde Alice 7 Chips erreichen. Zuletzt wählt Alice das Depot mit 5 statt mit nur 4 Chips: Es ist das <strong>dritte Depot von links</strong>.</p>' +
        '<p>Dieses Verfahren heißt <em>MiniMax-Algorithmus</em>. Damit berechnet man in vielen Zwei-Personen-Spielen den besten Zug, wenn man alle Zugfolgen bis zum Spielende durchrechnen kann. Beim Schach geht das nicht, weil es viel zu viele Zugfolgen gibt. Dort begrenzt man die Länge der Zugfolgen und bewertet die erreichten Stellungen, so wie hier die Chips die Depots bewerten.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset(); orient = null;
      svgHost = h('div', { class: P + 'svghost' });
      box = h('div', { class: P + 'box-wrap' }, svgHost);
      var legend = h('p', { class: P + 'legend' },
        h('span', { class: P + 'lg ' + P + 'alice' }, 'A'), ' Alice möchte viele Chips. ',
        h('span', { class: P + 'lg ' + P + 'bob' }, 'B'), ' Bob möchte wenige Chips.');
      el.replaceChildren(h('div', { class: P + 'board' }, box, legend));
      svgHost.addEventListener('click', onClick);
      svgHost.addEventListener('keydown', onKey);
      pickOrient();
      if (typeof ResizeObserver === 'function') { ro = new ResizeObserver(pickOrient); ro.observe(box); }
      else window.addEventListener('resize', pickOrient);
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () { return { correct: selected === RIGHT, answer: { depot: selected + 1 } }; },
    setAnswer: function (ans) {
      var n = ans && typeof ans.depot === 'number' ? ans.depot - 1 : null;
      selected = n !== null && n >= 0 && n < 8 ? n : null;
      mode = 'check';
      draw();
    },
    lock: function (on) {
      locked = on;
      mode = on ? (mode === 'solution' ? 'solution' : 'check') : null;
      draw();
    },
    reset: function () { reset(); draw(); },
    showSolution: function () { selected = RIGHT; mode = 'solution'; locked = true; draw(); }
  });
})();
