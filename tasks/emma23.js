/* Aufgabe Emma erledigt (Biber 2023, S. 26; Klasse 9-10 schwer, 11-13 mittel): kürzester Rundweg über drei Orte in einem gewichteten Graphen */
(function () {
  'use strict';
  var h = Biber.h, svg = Biber.svg;
  var P = 't-emma23-';
  var A = 'assets/emma23/';

  /* Orte: Mittelpunkt und Bildgröße in Kartenkoordinaten (Heftbild S. 26); target = hier muss Emma hin */
  var NODES = {
    haus:      { name: 'Zuhause',   x: 1013, y: 1007, w: 153, h: 274, img: 'haus' },
    kiosk:     { name: 'Kiosk',     x: 278,  y: 230,  w: 159, h: 136, img: 'kiosk', target: true, what: 'Päckchen abholen' },
    markt:     { name: 'Markt',     x: 492,  y: 847,  w: 100, h: 145, img: 'markt', target: true, what: 'Obst kaufen' },
    apotheke:  { name: 'Apotheke',  x: 1501, y: 355,  w: 164, h: 150, img: 'apotheke', target: true, what: 'Medikament besorgen' },
    park:      { name: 'Park',      x: 913,  y: 137,  w: 234, h: 177, img: 'park' },
    kirche:    { name: 'Kirche',    x: 910,  y: 564,  w: 199, h: 211, img: 'kirche' },
    baeckerei: { name: 'Bäckerei',  x: 199,  y: 617,  w: 183, h: 152, img: 'baeckerei' },
    schule:    { name: 'Schule',    x: 1523, y: 770,  w: 214, h: 224, img: 'schule' }
  };
  var TARGETS = ['kiosk', 'markt', 'apotheke'];
  /* Strecken mit Minuten (Heftbild S. 26, vereinfachter Plan S. 27) */
  var EDGES = [
    ['kiosk', 'baeckerei', 3], ['kiosk', 'park', 9], ['park', 'apotheke', 7], ['park', 'kirche', 6], ['apotheke', 'kirche', 8],
    ['apotheke', 'schule', 3], ['baeckerei', 'kirche', 4], ['kirche', 'schule', 4], ['baeckerei', 'markt', 6], ['kirche', 'markt', 10],
    ['kirche', 'haus', 5], ['schule', 'haus', 6], ['markt', 'haus', 4]
  ];
  var BEST = 36;   /* offizielle Lösung (Heft S. 26); per Skript (Tiefensuche über alle Wege) bestätigt: 36 Minuten, nur diese Route und ihre Umkehrung */
  var SOLUTION = ['haus', 'schule', 'apotheke', 'schule', 'kirche', 'baeckerei', 'kiosk', 'baeckerei', 'markt', 'haus'];

  var ADJ = {};
  EDGES.forEach(function (e) {
    (ADJ[e[0]] = ADJ[e[0]] || {})[e[1]] = e[2];
    (ADJ[e[1]] = ADJ[e[1]] || {})[e[0]] = e[2];
  });
  function minutes(a, b) { return ADJ[a] && ADJ[a][b]; }
  function cost(path) { var s = 0; for (var i = 1; i < path.length; i++) s += minutes(path[i - 1], path[i]) || 0; return s; }
  function visited(path) { return TARGETS.filter(function (t) { return path.indexOf(t) >= 0; }); }
  function done(path) { return path.length > 1 && path[path.length - 1] === 'haus' && visited(path).length === TARGETS.length; }
  function validPath(p) { return Array.isArray(p) && p[0] === 'haus' && p.every(function (n, i) { return NODES[n] && (i === 0 || minutes(p[i - 1], n)); }); }

  var el, api, locked, path, mark, mapEl, seqEl;
  function radius(id) { var n = NODES[id]; return Math.max(n.w, n.h) * 0.56; }
  function edgeKey(a, b) { return a < b ? a + '|' + b : b + '|' + a; }

  function statusText() {
    var left = TARGETS.filter(function (t) { return path.indexOf(t) < 0; }).map(function (t) { return NODES[t].name; });
    var at = NODES[path[path.length - 1]].name;
    var t = 'Weg bisher: ' + cost(path) + ' Minuten. Emma ist bei: ' + at + '. ';
    if (done(path)) return t + 'Emma ist wieder zu Hause und hat alles erledigt.';
    return t + (left.length ? 'Noch zu besuchen: ' + left.join(', ') + '.' : 'Alles erledigt. Jetzt muss Emma noch nach Hause.');
  }

  /* ---------- Zeichnen ---------- */
  function lineBetween(a, b, trimA, trimB) {
    var na = NODES[a], nb = NODES[b];
    var dx = nb.x - na.x, dy = nb.y - na.y, d = Math.sqrt(dx * dx + dy * dy), ux = dx / d, uy = dy / d;
    return { x1: na.x + ux * trimA, y1: na.y + uy * trimA, x2: nb.x - ux * trimB, y2: nb.y - uy * trimB, ux: ux, uy: uy, len: d };
  }
  function arrow(x, y, ux, uy, cls) {
    var s = 30, px = -uy, py = ux;
    var pts = [(x + ux * s) + ',' + (y + uy * s), (x - ux * s * 0.7 + px * s * 0.8) + ',' + (y - uy * s * 0.7 + py * s * 0.8), (x - ux * s * 0.7 - px * s * 0.8) + ',' + (y - uy * s * 0.7 - py * s * 0.8)];
    return svg('polygon', { points: pts.join(' '), class: P + cls });
  }

  function drawMap() {
    var cur = path[path.length - 1];
    var used = {};
    for (var i = 1; i < path.length; i++) (used[edgeKey(path[i - 1], path[i])] = used[edgeKey(path[i - 1], path[i])] || []).push([path[i - 1], path[i]]);

    var gEdges = svg('g', { class: P + 'edges' });
    var gChips = svg('g', { class: P + 'chips' });
    EDGES.forEach(function (e) {
      var l = lineBetween(e[0], e[1], radius(e[0]) * 0.9, radius(e[1]) * 0.9);
      var u = used[edgeKey(e[0], e[1])];
      if (u) gEdges.appendChild(svg('line', { x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2, class: P + 'hl' }));
      gEdges.appendChild(svg('line', { x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2, class: P + 'edge' }));
      if (u) u.forEach(function (tr, k) {
        var f = u.length === 1 ? 0.27 : (k === 0 ? 0.25 : 0.75);
        var ax = l.x1 + (l.x2 - l.x1) * f, ay = l.y1 + (l.y2 - l.y1) * f;
        var dir = tr[0] === e[0] ? 1 : -1;
        gEdges.appendChild(arrow(ax, ay, l.ux * dir, l.uy * dir, 'arrow'));
      });
      var mx = (l.x1 + l.x2) / 2, my = (l.y1 + l.y2) / 2;
      gChips.appendChild(svg('g', { class: P + 'chip' + (u ? ' used' : ''), transform: 'translate(' + mx + ' ' + my + ')' },
        svg('rect', { x: -48, y: -42, width: 96, height: 84, rx: 22 }),
        svg('text', { x: 0, y: 2, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, String(e[2]))));
    });

    var gNodes = svg('g', { class: P + 'nodes' });
    Object.keys(NODES).forEach(function (id) {
      var n = NODES[id], r = radius(id);
      var can = !locked && !!minutes(cur, id);
      var isCur = id === cur;
      var visitedT = n.target && path.indexOf(id) >= 0;
      var cls = P + 'node' + (can ? ' can' : '') + (isCur ? ' cur' : '') + (n.target ? ' target' : '') + (visitedT ? ' seen' : '');
      var label = n.name + (n.target ? ' (' + n.what + ')' : '') + (id === 'haus' ? ' (Start und Ziel)' : '') + '. ' +
        (isCur ? 'Emma ist hier.' : can ? 'Gehe hierhin: ' + minutes(cur, id) + ' Minuten.' : 'Von hier aus nicht direkt erreichbar.');
      var g = svg('g', { class: cls, 'data-node': id, role: 'button', tabindex: locked ? '-1' : '0', 'aria-label': label, 'aria-disabled': String(!can) });
      g.appendChild(svg('circle', { cx: n.x, cy: n.y, r: r, class: P + 'disc' }));
      if (n.target) g.appendChild(svg('circle', { cx: n.x, cy: n.y, r: r, class: P + 'ring' }));
      g.appendChild(svg('image', { href: A + n.img + '.png', x: n.x - n.w / 2, y: n.y - n.h / 2, width: n.w, height: n.h }));
      g.appendChild(svg('circle', { cx: n.x, cy: n.y, r: r + 14, class: P + 'focus' }));
      if (visitedT) g.appendChild(svg('g', { transform: 'translate(' + (n.x + r * 0.75) + ' ' + (n.y - r * 0.75) + ')', class: P + 'tick' },
        svg('circle', { r: 36 }), svg('path', { d: 'M-17 1 L-5 14 L18 -13' })));
      if (isCur) {
        var bx = n.x, by = n.y - r - 26;
        if (id === 'park') { by = n.y + r + 62; }
        g.appendChild(svg('g', { transform: 'translate(' + bx + ' ' + by + ')', class: P + 'you' },
          svg('rect', { x: -88, y: -38, width: 176, height: 76, rx: 38 }),
          svg('text', { x: 0, y: 2, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, 'Emma')));
      }
      gNodes.appendChild(g);
    });
    return svg('svg', { viewBox: '70 30 1600 1140', class: P + 'svg', role: 'group', 'aria-label': 'Stadtplan mit acht Orten und den Strecken dazwischen. Die Zahlen sind die Minuten für die jeweilige Strecke.' }, gEdges, gChips, gNodes);
  }

  function seqView() {
    var items = [];
    path.forEach(function (id, i) {
      if (i) items.push(h('span', { class: P + 'step', 'aria-hidden': 'true' }, '→ ' + minutes(path[i - 1], id)));
      items.push(h('img', { src: A + NODES[id].img + '.png', alt: NODES[id].name, title: NODES[id].name, class: P + 'mini' }));
    });
    return h('div', { class: P + 'seq' }, items);
  }

  function render(focusId) {
    var total = cost(path);
    var resCls = '';
    var resTxt = '';
    if (mark === 'check') {
      resCls = total === BEST && done(path) ? ' ok' : ' bad';
      resTxt = total === BEST && done(path) ? 'Das ist der kürzeste Weg: ' + total + ' Minuten.' : 'Dein Weg dauert ' + total + ' Minuten. Es geht kürzer.';
    } else if (mark === 'solution') { resCls = ' ok'; resTxt = 'Ein kürzester Weg dauert ' + total + ' Minuten.'; }
    var chips = TARGETS.map(function (t) {
      var ok = path.indexOf(t) >= 0;
      return h('span', { class: P + 'todo' + (ok ? ' ok' : '') }, (ok ? '✓ ' : '○ ') + NODES[t].name + ': ' + NODES[t].what);
    });
    mapEl = h('div', { class: P + 'map' }, drawMap());
    var undo = h('button', { type: 'button', class: P + 'undo', 'data-undo': '', disabled: locked || path.length < 2 }, '← Schritt zurück');
    el.replaceChildren(h('div', { class: P + 'box' },
      h('div', { class: P + 'todos' }, chips),
      mapEl,
      h('div', { class: P + 'info' },
        h('div', { class: P + 'time' + resCls }, h('b', null, String(total)), ' Minuten bisher'),
        undo),
      resTxt ? h('p', { class: P + 'res' + resCls, role: 'status' }, resTxt) : null,
      h('div', { class: P + 'route' }, h('span', { class: P + 'cap' }, 'Dein Weg'), seqView())));
    if (focusId) {
      var f = el.querySelector('[data-node="' + focusId + '"]');
      if (f) f.focus({ preventScroll: true });
    }
  }

  function go(id) {
    if (locked) return;
    var cur = path[path.length - 1];
    if (id === cur || !minutes(cur, id)) return;
    path.push(id);
    render(id);
    api.changed(statusText());
  }
  function undo() {
    if (locked || path.length < 2) return;
    path.pop();
    render(path[path.length - 1]);
    api.changed(path.length > 1 ? statusText() : '');
  }

  function onClick(e) {
    if (e.target.closest('[data-undo]')) { undo(); return; }
    var g = e.target.closest('[data-node]');
    if (g) go(g.dataset.node);
  }
  function onKey(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var g = e.target.closest && e.target.closest('[data-node]');
    if (!g) return;
    e.preventDefault();
    go(g.dataset.node);
  }

  Biber.register({
    id: 'emma23',
    story: '<p>Emma ist zu Hause. Sie soll drei Aufgaben erledigen und danach zurückkommen:</p>' +
      '<ul><li>beim <b>Kiosk</b> ein Päckchen abholen,</li><li>auf dem <b>Markt</b> Obst kaufen und</li><li>in der <b>Apotheke</b> ein Medikament besorgen.</li></ul>' +
      '<p>Emma weiß nicht, wie lange sie in jedem Geschäft brauchen wird. Aber zumindest ihr Weg soll so kurz wie möglich sein.</p>' +
      '<p>Auf einem Plan hat Emma eingetragen, wie viele Minuten sie für die Strecken zwischen einzelnen Orten ihrer Stadt braucht. Die Strecken kann sie in beide Richtungen gehen. Ein Weg ist zum Beispiel: Zuhause, Markt, Bäckerei, Kiosk, Park, Apotheke, Schule, Zuhause. Dafür braucht sie insgesamt 4 + 6 + 3 + 9 + 7 + 3 + 6 = 38 Minuten. Vielleicht geht es noch schneller, wenn sie manche Strecken hin und zurück geht.</p>',
    question: 'Bestimme den kürzesten Weg, den Emma gehen kann, um ihre drei Aufgaben zu erledigen. Welche Strecken geht sie dazu in welcher Richtung?',
    howto: 'Emma startet zu Hause. Tippe nacheinander auf die Orte, zu denen sie gehen soll (nur Nachbarorte, die eine Strecke verbindet). Mit „Schritt zurück“ nimmst du den letzten Schritt zurück. Prüfen kannst du, wenn Emma alles erledigt hat und wieder zu Hause ist.',
    explanation: function () {
      return '<p>Der kürzeste Weg dauert <b>36 Minuten</b>: Zuhause → Markt → Bäckerei → Kiosk → Bäckerei → Kirche → Schule → Apotheke → Schule → Zuhause (4 + 6 + 3 + 3 + 4 + 4 + 3 + 3 + 6). Man kann ihn auch in der Gegenrichtung gehen.</p>' +
        '<p>Warum geht es nicht kürzer? Zum Kiosk kommt Emma nur von der Bäckerei aus (3 Minuten), zur Apotheke nur von der Schule aus (3 Minuten). Hin und zurück sind das je 6 Minuten, zusammen 12. Der Weg über den Park ist nie kürzer. Dazu muss Emma Zuhause, Markt, Bäckerei, Kirche und Schule verbinden: Der kürzeste Rundweg Zuhause → Markt → Bäckerei → Kirche → Schule → Zuhause dauert 4 + 6 + 4 + 4 + 6 = 24 Minuten. Zusammen sind das 36 Minuten.</p>' +
        '<p>Der Plan ist ein <i>gewichteter Graph</i>: Die Orte sind Knoten, die Strecken Kanten, und die Minuten sind die Gewichte. Für solche Fragen nach kürzesten Wegen gibt es Algorithmen, die zum Beispiel in der Routenplanung laufen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; path = ['haus']; mark = null;
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKey);
      render();
    },
    isComplete: function () { return done(path); },
    evaluate: function () { return { correct: done(path) && cost(path) === BEST, answer: path.slice() }; },
    setAnswer: function (ans) { path = validPath(ans) ? ans.slice() : ['haus']; mark = null; render(); },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      render();
    },
    reset: function () { path = ['haus']; mark = null; render(); },
    showSolution: function () { path = SOLUTION.slice(); mark = 'solution'; render(); }
  });
})();
