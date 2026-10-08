/* Aufgabe Bebrasien (Klasse 5-6, schwer): Graphen, starke Zusammenhangskomponenten */
(function () {
  'use strict';
  var h = Biber.h, svg = Biber.svg;

  /* Inseln wie in der Abbildung des Hefts (Koordinaten im Bereich 850 x 450) */
  var ISLANDS = {
    A: { x: 142, y: 95, rx: 40, ry: 31, tilt: -8 },
    B: { x: 98, y: 270, rx: 56, ry: 42, tilt: 20 },
    C: { x: 331, y: 178, rx: 40, ry: 42, tilt: 18 },
    D: { x: 254, y: 360, rx: 42, ry: 36, tilt: -10 },
    E: { x: 436, y: 350, rx: 62, ry: 50, tilt: 0 },
    F: { x: 546, y: 134, rx: 42, ry: 62, tilt: -35 },
    G: { x: 663, y: 288, rx: 42, ry: 40, tilt: 0 }
  };
  var ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  /* gerichtete Fährverbindungen (aus der Abbildung abgelesen) */
  var EDGES = [
    ['A', 'B'], ['B', 'A'], ['A', 'C'], ['C', 'F'], ['C', 'D'], ['C', 'E'],
    ['D', 'B'], ['E', 'F'], ['F', 'E'], ['F', 'G'], ['E', 'G']
  ];
  /* Inselgruppen, innerhalb derer man in einem Ausflug alles besuchen kann (ergibt sich aus EDGES) */
  var GROUPS = [['A', 'B', 'C', 'D'], ['E', 'F'], ['G']];
  var GROUP_COLOR = ['var(--c1)', 'var(--c5)', 'var(--c2)'];
  var SOLUTION = 3;
  var OPTIONS = [2, 3, 4, 5, 6, 7];

  var el, api, locked;
  var choice, route, showGroups, mark, statusEl, mapSvg, optBox;

  function edgeExists(a, b) { return EDGES.some(function (e) { return e[0] === a && e[1] === b; }); }
  function groupOf(id) { for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i].indexOf(id) >= 0) return i; return -1; }

  /* kleine Symbole für den Aufgabentext */
  var ICON_FERRY = '<svg class="bb-ico" viewBox="0 0 64 28" width="44" height="20" role="img" aria-label="Fähre" focusable="false">' +
    '<path d="M18 4h10v7h-10z" fill="var(--accent)"/><rect x="21" y="1" width="3" height="4" fill="var(--ink)"/>' +
    '<path d="M10 11h30l-4 9H14z" fill="var(--c1)"/>' +
    '<path d="M2 24c4 0 4 2 8 2s4-2 8-2 4 2 8 2 4-2 8-2" fill="none" stroke="var(--muted)" stroke-width="2" stroke-dasharray="4 3"/>' +
    '<path d="M46 20l8 4-8 3" fill="none" stroke="var(--muted)" stroke-width="2.5" stroke-linecap="round"/></svg>';
  function heliSvg(w) {
    return '<svg class="bb-ico" viewBox="0 0 70 36" width="' + w + '" height="' + Math.round(w * 36 / 70) + '" role="img" aria-label="Hubschrauber" focusable="false">' +
      '<line x1="8" y1="3" x2="42" y2="3" stroke="var(--ink)" stroke-width="2" stroke-linecap="round"/><line x1="25" y1="3" x2="25" y2="9" stroke="var(--ink)" stroke-width="2"/>' +
      '<path d="M10 20c0-7 6-11 14-11 6 0 10 3 11 7l25 2v3l-25 2c-3 4-8 6-14 6-7 0-11-4-11-9z" fill="var(--c2)"/>' +
      '<path d="M15 19c1-5 5-7 10-7 3 0 6 1 7 4H15z" fill="var(--accent)" opacity="0.8"/>' +
      '<path d="M60 14l6-4 2 3-5 6z" fill="var(--c2)"/>' +
      '<path d="M14 31h24M20 28l-2 3M32 28l2 3" stroke="var(--muted)" stroke-width="2" stroke-linecap="round" fill="none"/></svg>';
  }

  /* ---------- Karte ---------- */
  function ellRadius(isl, dx, dy) {
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var ux = dx / len, uy = dy / len;
    var t = isl.tilt * Math.PI / 180;
    var px = ux * Math.cos(t) + uy * Math.sin(t), py = -ux * Math.sin(t) + uy * Math.cos(t);
    return 1 / Math.sqrt(Math.pow(px / isl.rx, 2) + Math.pow(py / isl.ry, 2));
  }
  function edgePath(a, b) {
    var A = ISLANDS[a], B = ISLANDS[b];
    var dx = B.x - A.x, dy = B.y - A.y, len = Math.sqrt(dx * dx + dy * dy);
    var nx = -dy / len, ny = dx / len;
    var off = edgeExists(b, a) ? 11 : 0;
    var r1 = ellRadius(A, dx, dy) + 9, r2 = ellRadius(B, -dx, -dy) + 13;
    var x1 = A.x + dx / len * r1 + nx * off, y1 = A.y + dy / len * r1 + ny * off;
    var x2 = B.x - dx / len * r2 + nx * off, y2 = B.y - dy / len * r2 + ny * off;
    return { d: 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + 'L' + x2.toFixed(1) + ' ' + y2.toFixed(1), mx: (x1 + x2) / 2, my: (y1 + y2) / 2 };
  }
  function palm(x, y, s) {
    return svg('g', { transform: 'translate(' + x + ' ' + y + ') scale(' + s + ')', 'aria-hidden': 'true' },
      svg('path', { d: 'M0 0c1-10 2-18 3-26', class: 'bb-trunk' }),
      svg('path', { d: 'M3-26c-8-8-14-6-19-1 7-3 12-1 19 1zM3-26c8-9 15-7 19-2-7-2-12 0-19 2zM3-26c-2-9 1-14 7-17-1 7-3 12-7 17zM3-26c-5-7-9-8-16-6 6 1 11 3 16 6z', class: 'bb-leaf' }));
  }

  function grp(cls, kids) {
    var g = svg('g', { class: cls });
    kids.forEach(function (k) { g.appendChild(k); });
    return g;
  }

  function buildMap() {
    var defs = svg('defs', null,
      svg('marker', { id: 'bb-arr', viewBox: '0 0 12 12', refX: '10', refY: '6', markerWidth: '8', markerHeight: '8', orient: 'auto', markerUnits: 'userSpaceOnUse' },
        svg('path', { d: 'M1 1L10 6L1 11', class: 'bb-head' })),
      svg('marker', { id: 'bb-arr-on', viewBox: '0 0 12 12', refX: '10', refY: '6', markerWidth: '10', markerHeight: '10', orient: 'auto', markerUnits: 'userSpaceOnUse' },
        svg('path', { d: 'M1 1L10 6L1 11', class: 'bb-head on' })));
    var edges = EDGES.map(function (e, i) {
      var p = edgePath(e[0], e[1]);
      return svg('path', { d: p.d, class: 'bb-edge', 'data-e': e[0] + e[1], 'marker-end': 'url(#bb-arr)', 'aria-hidden': 'true' });
    });
    var isl = ORDER.map(function (id) {
      var I = ISLANDS[id];
      return svg('g', { class: 'bb-isl', 'data-isl': id, role: 'button', tabindex: '0', 'aria-label': 'Insel ' + id },
        svg('g', { transform: 'rotate(' + I.tilt + ' ' + I.x + ' ' + I.y + ')' },
          svg('ellipse', { cx: I.x, cy: I.y, rx: I.rx, ry: I.ry, class: 'bb-sand' }),
          svg('ellipse', { cx: I.x, cy: I.y, rx: I.rx * 0.74, ry: I.ry * 0.7, class: 'bb-grass' })),
        palm(I.x - I.rx * 0.12, I.y + 8, I.rx > 50 ? 1.1 : 0.9),
        palm(I.x + I.rx * 0.28, I.y + 14, 0.65),
        svg('circle', { cx: I.x - I.rx * 0.6, cy: I.y - I.ry * 0.5, r: 11, class: 'bb-tag' }),
        svg('text', { x: I.x - I.rx * 0.6, y: I.y - I.ry * 0.5 + 4.5, class: 'bb-tagt', 'text-anchor': 'middle', 'aria-hidden': 'true' }, id));
    });
    var heli = svg('g', { class: 'bb-heli', 'aria-hidden': 'true' },
      svg('line', { x1: -16, y1: -13, x2: 16, y2: -13, class: 'bb-rotor' }),
      svg('line', { x1: 0, y1: -13, x2: 0, y2: -8, class: 'bb-rotor' }),
      svg('path', { d: 'M-13 0c0-6 5-9 11-9 5 0 8 2 9 5l16 2v2l-16 2c-2 3-6 5-11 5-6 0-9-3-9-7z', class: 'bb-body' }),
      svg('path', { d: 'M-9 -1c1-4 4-6 8-6 3 0 5 1 6 3z', class: 'bb-glass' }),
      svg('path', { d: 'M-12 11h20', class: 'bb-skid' }));
    var s = svg('svg', { class: 'bb-map', viewBox: '0 0 850 450', role: 'group', 'aria-label': 'Karte mit sieben Inseln A bis G und den Fährverbindungen' },
      defs, svg('path', { class: 'bb-sea', d: 'M92 30C140-10 300 20 350 70c80 45 130 30 210-20 50-30 120-20 160 20 30 30 40 70 120 100 70 40 95 90 90 150-8 70-60 130-120 120-70-8-130 10-170 40-60 40-120 50-180 10-40-25-70 0-130 25C190 440 100 380 55 340 10 290 5 250 40 190 70 140 60 60 92 30z' }),
      grp('bb-edges', edges), svg('g', { class: 'bb-route-layer', 'aria-hidden': 'true' }), grp('bb-isls', isl), heli);
    return s;
  }

  function updateMap() {
    var onEdges = {};
    for (var i = 1; i < route.length; i++) onEdges[route[i - 1] + route[i]] = true;
    [].forEach.call(mapSvg.querySelectorAll('.bb-edge'), function (p) {
      var on = !!onEdges[p.getAttribute('data-e')];
      p.classList.toggle('on', on);
      p.setAttribute('marker-end', on ? 'url(#bb-arr-on)' : 'url(#bb-arr)');
    });
    var visited = {};
    route.forEach(function (r) { visited[r] = true; });
    [].forEach.call(mapSvg.querySelectorAll('.bb-isl'), function (g) {
      var id = g.getAttribute('data-isl');
      var gi = showGroups ? groupOf(id) : -1;
      g.classList.toggle('visited', !!visited[id]);
      g.classList.toggle('start', route[0] === id);
      g.classList.toggle('grouped', gi >= 0);
      g.style.setProperty('--bb-g', gi >= 0 ? GROUP_COLOR[gi] : 'transparent');
      var lbl = 'Insel ' + id + (route[0] === id ? ', Start mit dem Hubschrauber' : visited[id] ? ', besucht' : '') + (gi >= 0 ? ', Gruppe ' + (gi + 1) : '');
      g.setAttribute('aria-label', lbl);
    });
    var heli = mapSvg.querySelector('.bb-heli');
    var hx = 665, hy = 68;
    if (route.length) { hx = ISLANDS[route[0]].x + 6; hy = ISLANDS[route[0]].y - ISLANDS[route[0]].ry - 16; }
    heli.setAttribute('transform', 'translate(' + hx + ' ' + hy + ') scale(1.5)');
    heli.classList.toggle('placed', route.length > 0);
  }

  function tripText() {
    if (!route.length) return 'Tippe eine Insel an, um dort mit dem Hubschrauber zu landen und einen Ausflug auszuprobieren.';
    if (route.length === 1) return 'Hubschrauber auf Insel ' + route[0] + '. Tippe die nächste Insel an, die per Fähre erreichbar ist.';
    var t = 'Ausflug: ' + route.join(' → ');
    if (route[route.length - 1] === route[0]) t += '. Zurück am Start, der Hubschrauber kann abheben.';
    return t;
  }
  function setStatus(msg) { statusEl.textContent = msg || tripText(); }

  function tapIsland(id) {
    if (!route.length) route = [id];
    else {
      var last = route[route.length - 1];
      if (id === last) { setStatus(); return; }
      if (!edgeExists(last, id)) {
        setStatus('Von Insel ' + last + ' fährt keine Fähre nach Insel ' + id + '.');
        updateMap();
        return;
      }
      route.push(id);
    }
    updateMap();
    setStatus();
  }
  function undoStep() {
    if (route.length) route.pop();
    updateMap();
    setStatus();
  }
  function newTrip() { route = []; updateMap(); setStatus(); }

  /* ---------- Antwortkarten ---------- */
  function renderOptions() {
    var sel = choice;
    [].forEach.call(optBox.querySelectorAll('label'), function (lab) {
      var inp = lab.querySelector('input');
      var n = +inp.value;
      inp.checked = n === sel;
      inp.disabled = !!locked;
      lab.classList.toggle('sel', n === sel);
      lab.classList.toggle('wrong', mark === 'check' && n === sel && n !== SOLUTION);
      lab.classList.toggle('right', (mark === 'check' && n === sel && n === SOLUTION) || (mark === 'solution' && n === SOLUTION));
    });
  }

  function build() {
    mapSvg = buildMap();
    statusEl = h('p', { class: 'bb-status', 'aria-live': 'polite' });
    optBox = h('div', { class: 'bb-opts', role: 'radiogroup', 'aria-label': 'Anzahl der Ausflüge' },
      OPTIONS.map(function (n) {
        return h('label', { class: 'bb-opt' },
          h('input', { type: 'radio', name: 'bb-n', value: String(n), onchange: function () { if (locked) return; choice = n; mark = null; renderOptions(); api.changed(); } }),
          h('span', null, n + ' Ausflüge'));
      }));
    var undoBtn = h('button', { type: 'button', class: 'bb-btn', onclick: undoStep }, 'Einen Schritt zurück');
    var newBtn = h('button', { type: 'button', class: 'bb-btn', onclick: newTrip }, 'Neuer Ausflug');
    mapSvg.addEventListener('click', function (e) {
      var g = e.target.closest('[data-isl]');
      if (g) tapIsland(g.getAttribute('data-isl'));
    });
    mapSvg.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var g = e.target.closest('[data-isl]');
      if (!g) return;
      e.preventDefault();
      tapIsland(g.getAttribute('data-isl'));
    });
    el.replaceChildren(h('div', { class: 'bb-board' },
      h('div', { class: 'bb-mapwrap' }, mapSvg),
      h('div', { class: 'bb-try' },
        h('div', { class: 'bb-trytext' }, h('strong', null, 'Ausprobieren'), statusEl),
        h('div', { class: 'bb-trybtns' }, undoBtn, newBtn)),
      h('h3', { class: 'bb-h' }, 'Wie viele Ausflüge?'), optBox));
  }

  function reset() { choice = null; route = []; showGroups = false; mark = null; }
  function refresh() { updateMap(); setStatus(); renderOptions(); }

  Biber.register({
    id: 'bebrasien',
    story: '<p>Vor der Küste von Bebrasien liegen sieben Inseln.</p>' +
      '<p>Zwischen den Inseln kann man mit Fähren ' + ICON_FERRY + ' fahren, aber nur in Richtung der Pfeile.</p>' +
      '<p>Ein Forschungsteam möchte die Tierwelt auf allen sieben Inseln erkunden. Ein einzelner Ausflug des Teams zu den Inseln läuft so ab:</p>' +
      '<p>Das Team …</p>' +
      '<ol><li>… fliegt mit einem Hubschrauber ' + heliSvg(46) + ' zu irgendeiner Insel,</li>' +
      '<li>benutzt die Fähren, um weitere Inseln zu besuchen, und</li>' +
      '<li>kehrt zum Schluss zur Insel mit dem Hubschrauber zurück, um zurückzufliegen.</li></ol>' +
      '<p>Das Team stellt fest: Ein einziger Ausflug reicht nicht, um alle Inseln zu besuchen.</p>',
    question: 'Wie viele Ausflüge muss das Team dazu mindestens machen?',
    howto: 'Wähle unten die Anzahl. Auf der Karte kannst du Ausflüge ausprobieren: Tippe die Startinsel an und dann nacheinander die Inseln, zu denen eine Fähre fährt.',
    explanation: function () {
      return '<p>Wer auf einer Insel landet, muss auch wieder dorthin zurückkommen. Das geht nur zwischen Inseln, die sich in beide Richtungen erreichen lassen. ' +
        'Das sind drei Gruppen: <strong>A, B, C, D</strong> (A → C → D → B → A ist ein Kreis), <strong>E, F</strong> (die Fähren fahren hin und zurück) und <strong>G</strong> allein.</p>' +
        '<p>Von E und F kommt man zwar nach G, aber nie wieder zurück. Deshalb braucht jede der drei Gruppen einen eigenen Ausflug: <strong>3 Ausflüge</strong>. ' +
        'In der Informatik heißen solche Gruppen in einem Graphen starke Zusammenhangskomponenten.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      build();
      refresh();
    },
    isComplete: function () { return choice != null; },
    evaluate: function () { return { correct: choice === SOLUTION, answer: { n: choice } }; },
    setAnswer: function (ans) {
      choice = ans && typeof ans.n === 'number' ? ans.n : null;
      showGroups = choice === SOLUTION;
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      if (on) { mark = 'check'; showGroups = choice === SOLUTION; } else { mark = null; showGroups = false; }
      refresh();
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () {
      choice = SOLUTION; locked = true; showGroups = true; mark = 'solution'; route = [];
      refresh();
    }
  });
})();
