/* Aufgabe Zugleich (Heft 2016, Klasse 5-6 mittel, 7-8 einfach): Parallelität */
(function () {
  'use strict';
  var h = Biber.h;
  var svg = Biber.svg;

  var N = 6, CELL = 52;
  /* Koordinaten (x = Spalte, y = Zeile von oben), wie im Heft */
  var ITEMS = [
    { k: 'ball', x: 0, y: 0 }, { k: 'ball', x: 3, y: 0 },
    { k: 'ring', x: 5, y: 1 },
    { k: 'ring', x: 0, y: 2 }, { k: 'kegel', x: 3, y: 2 }, { k: 'ball', x: 5, y: 2 },
    { k: 'ball', x: 1, y: 3 }, { k: 'kegel', x: 5, y: 3 },
    { k: 'ring', x: 3, y: 4 }, { k: 'ring', x: 5, y: 4 },
    { k: 'kegel', x: 1, y: 5 }, { k: 'kegel', x: 3, y: 5 }
  ];
  var ROBOTS = [{ x: 2, y: 2 }, { x: 2, y: 4 }, { x: 0, y: 5 }];
  var STEP = { N: [0, -1], S: [0, 1], O: [1, 0], W: [-1, 0] };
  var NAME = { ball: 'Ball', ring: 'Ring', kegel: 'Kegel' };
  var PLURAL = { ball: 'Bälle', ring: 'Ringe', kegel: 'Kegel' };
  var OPTIONS = [
    { l: 'A', cmd: ['N', 'O', 'O', 'O'] },
    { l: 'B', cmd: ['N', 'O', 'O', 'S', 'O'] },
    { l: 'C', cmd: ['N', 'N', 'S', 'O', 'N'] },
    { l: 'D', cmd: ['N', 'O', 'O', 'S', 'W'] }
  ];
  var RIGHT = 1;
    var PATHCOL = ['var(--c1)', 'var(--c4)', 'var(--c3)'];

  function itemAt(x, y) {
    for (var i = 0; i < ITEMS.length; i++) if (ITEMS[i].x === x && ITEMS[i].y === y) return ITEMS[i].k;
    return null;
  }
  /* Simulation: Wege aller Roboter und aufgenommene Dinge am Ende */
  function run(cmd) {
    var paths = ROBOTS.map(function (r) { return [{ x: r.x, y: r.y }]; });
    cmd.forEach(function (c) {
      paths.forEach(function (p) {
        var l = p[p.length - 1], d = STEP[c];
        p.push({ x: l.x + d[0], y: l.y + d[1] });
      });
    });
    var taken = paths.map(function (p) { var e = p[p.length - 1]; return itemAt(e.x, e.y); });
    return { paths: paths, taken: taken };
  }
  function takenText(t) {
    var cnt = {};
    t.forEach(function (k) { if (k) cnt[k] = (cnt[k] || 0) + 1; });
    var parts = [];
    ['ball', 'ring', 'kegel'].forEach(function (k) {
      if (!cnt[k]) return;
      parts.push(cnt[k] === 1 ? 'einen ' + NAME[k] : (cnt[k] === 2 ? 'zwei ' : 'drei ') + PLURAL[k]);
    });
    var missing = t.filter(function (k) { return !k; }).length;
    if (missing) parts.push(missing + ' leere' + (missing === 1 ? 's Feld' : ' Felder'));
    return parts.join(', ').replace(/, ([^,]*)$/, ' und $1');
  }
  function inBounds(res) {
    return res.paths.every(function (p) { return p.every(function (q) { return q.x >= 0 && q.y >= 0 && q.x < N && q.y < N; }); });
  }
  function cmdText(c) { return c.join(', '); }

  /* ---- Zeichnung ---- */
  var uid = 0;
  function sprite(k, cx, cy) {
    var g = svg('g', { transform: 'translate(' + cx + ' ' + cy + ')', class: 't-zugleich16-item' });
    if (k === 'ball') {
      g.appendChild(svg('circle', { r: 17, class: 't-zugleich16-ball' }));
      g.appendChild(svg('ellipse', { cx: -6, cy: -7, rx: 6, ry: 4, class: 't-zugleich16-shine', transform: 'rotate(-35 -6 -7)' }));
    } else if (k === 'ring') {
      g.appendChild(svg('circle', { r: 17, class: 't-zugleich16-ball' }));
      g.appendChild(svg('circle', { r: 8, class: 't-zugleich16-hole' }));
      g.appendChild(svg('circle', { r: 17, class: 't-zugleich16-rim' }));
    } else {
      g.appendChild(svg('path', { d: 'M0 -19 L16 17 L-16 17 Z', class: 't-zugleich16-ball', 'stroke-linejoin': 'round' }));
      g.appendChild(svg('path', { d: 'M0 -19 L-16 17 L-6 17 Z', class: 't-zugleich16-shine2' }));
    }
    return g;
  }
  function robot(cx, cy) {
    var g = svg('g', { transform: 'translate(' + cx + ' ' + cy + ')', class: 't-zugleich16-robot' });
    g.appendChild(svg('rect', { x: -18, y: 8, width: 36, height: 11, rx: 5.5, class: 't-zugleich16-track' }));
    g.appendChild(svg('rect', { x: -12, y: -8, width: 24, height: 19, rx: 4, class: 't-zugleich16-body' }));
    g.appendChild(svg('rect', { x: -8, y: -17, width: 16, height: 10, rx: 4, class: 't-zugleich16-head' }));
    g.appendChild(svg('circle', { cx: -3, cy: -12, r: 1.8, class: 't-zugleich16-eye' }));
    g.appendChild(svg('circle', { cx: 3, cy: -12, r: 1.8, class: 't-zugleich16-eye' }));
    g.appendChild(svg('path', { d: 'M12 -2 L19 -9 M19 -9 L22 -6', class: 't-zugleich16-arm', fill: 'none' }));
    return g;
  }
  function center(p) { return [p.x * CELL + CELL / 2, p.y * CELL + CELL / 2]; }

  function board(res) {
    var W = N * CELL, kids = [];
    kids.push(svg('rect', { x: 0, y: 0, width: W, height: W, class: 't-zugleich16-bg' }));
    for (var i = 0; i <= N; i++) {
      kids.push(svg('line', { x1: i * CELL, y1: 0, x2: i * CELL, y2: W, class: 't-zugleich16-grid' }));
      kids.push(svg('line', { x1: 0, y1: i * CELL, x2: W, y2: i * CELL, class: 't-zugleich16-grid' }));
    }
    ITEMS.forEach(function (it) { var c = center(it); kids.push(sprite(it.k, c[0], c[1])); });
    if (res) {
      res.paths.forEach(function (p, ri) {
        var off = (ri - 1) * 5;
        var pts = p.map(function (q) { var c = center(q); return (c[0] + off) + ',' + (c[1] + off); }).join(' ');
        kids.push(svg('polyline', { points: pts, class: 't-zugleich16-path', style: 'stroke:' + PATHCOL[ri], fill: 'none' }));
        var e = p[p.length - 1], ec = center(e);
        kids.push(svg('circle', { cx: ec[0] + off, cy: ec[1] + off, r: 21, class: 't-zugleich16-end', style: 'stroke:' + PATHCOL[ri], fill: 'none' }));
      });
    }
    ROBOTS.forEach(function (r) { var c = center(r); kids.push(robot(c[0], c[1] - 2)); });
    /* Kompass */
    var cx = W + 80, cy = W / 2;
    kids.push(svg('path', { d: 'M' + cx + ' ' + (cy - 38) + ' L' + (cx + 5) + ' ' + cy + ' L' + cx + ' ' + (cy + 38) + ' L' + (cx - 5) + ' ' + cy + ' Z', class: 't-zugleich16-needle' }));
    kids.push(svg('path', { d: 'M' + (cx - 38) + ' ' + cy + ' L' + cx + ' ' + (cy - 5) + ' L' + (cx + 38) + ' ' + cy + ' L' + cx + ' ' + (cy + 5) + ' Z', class: 't-zugleich16-needle' }));
    [['N', cx, cy - 50], ['S', cx, cy + 58], ['W', cx - 54, cy + 7], ['O', cx + 54, cy + 7]].forEach(function (t) {
      kids.push(svg('text', { x: t[1], y: t[2], class: 't-zugleich16-dir', 'text-anchor': 'middle' }, t[0]));
    });
    var label = 'Spielfeld mit sechs mal sechs Feldern. Zeilen von oben nach unten, Spalten von links nach rechts. ' +
      'Oben: Ball in Spalte 1 und 4. Zeile 2: Ring in Spalte 6. Zeile 3: Ring in Spalte 1, Roboter in Spalte 3, Kegel in Spalte 4, Ball in Spalte 6. ' +
      'Zeile 4: Ball in Spalte 2, Kegel in Spalte 6. Zeile 5: Roboter in Spalte 3, Ring in Spalte 4, Ring in Spalte 6. ' +
      'Zeile 6: Roboter in Spalte 1, Kegel in Spalte 2, Kegel in Spalte 4. Norden ist oben, Osten rechts.';
    return svg.apply(null, ['svg', { viewBox: '-2 -2 ' + (W + 156) + ' ' + (W + 4), class: 't-zugleich16-svg', role: 'img', 'aria-label': label, focusable: 'false' }].concat(kids));
  }

  var el, api, locked, picked, mode, optsEl, boardEl, noteEl;

  function showIdx() { return mode === 'solution' ? RIGHT : picked; }
  function renderBoard() {
    var i = locked ? showIdx() : null;
    var res = i != null ? run(OPTIONS[i].cmd) : null;
    boardEl.replaceChildren(board(res));
    noteEl.textContent = res ? 'Die Linien zeigen die Wege der drei Roboter bei den Befehlen ' + cmdText(OPTIONS[i].cmd) + '. Die Kreise zeigen, wo sie am Ende stehen: ' + takenText(res.taken) + '.' : '';
  }
  function optionCard(o, idx) {
    var sel = picked === idx;
    var cls = 't-zugleich16-opt';
    var mark = '';
    if (mode && (mode === 'solution' ? idx === RIGHT : sel)) {
      var ok = idx === RIGHT;
      cls += ok ? ' right' : ' wrong';
      mark = ok ? '✓' : '✗';
    }
    var input = h('input', { type: 'radio', name: 't-zugleich16-opt', value: String(idx), disabled: locked,
      'aria-label': 'Antwort ' + o.l + ': ' + o.cmd.map(function (c) { return { N: 'Norden', S: 'Süden', O: 'Osten', W: 'Westen' }[c]; }).join(', ') });
    input.checked = sel;
    return h('label', { class: cls }, input,
      h('span', { class: 't-zugleich16-card' },
        h('span', { class: 't-zugleich16-let' }, o.l + ')'),
        h('span', { class: 't-zugleich16-cmd', 'aria-hidden': 'true' }, cmdText(o.cmd)),
        mark ? h('span', { class: 't-zugleich16-mark', 'aria-hidden': 'true' }, mark) : null));
  }
  function renderOpts() { optsEl.replaceChildren.apply(optsEl, OPTIONS.map(optionCard)); }
  function renderAll() { renderOpts(); renderBoard(); }

  function onChange(e) {
    if (locked || !e.target.matches('input[type=radio]')) return;
    picked = +e.target.value;
    renderOpts();
    var f = optsEl.querySelector('input:checked'); if (f) f.focus();
    api.changed('Antwort ' + OPTIONS[picked].l + ' gewählt.');
  }

  Biber.register({
    id: 'zugleich16',
    story: '<p>Drei Roboter arbeiten als Team zusammen. Du kannst das Team mit Richtungsbefehlen steuern: <b>N</b>, <b>S</b>, <b>O</b> oder <b>W</b> (Norden oben, Süden unten, Osten rechts, Westen links). ' +
      'Mit einem Richtungsbefehl steuerst Du <b>alle drei Roboter gleich</b>: um ein Feld weiter in diese Richtung.</p>' +
      '<p>Du sollst die Roboter zu den Dingen steuern, die sie am Ende nehmen sollen. Damit sie nichts Falsches nehmen, musst Du sie vorher um andere Dinge herum steuern.</p>' +
      '<p>Ein Beispiel: Du steuerst die Roboter mit diesen Befehlen: N, N, S, S, O. Dann nehmen die Roboter am Ende zwei Kegel und einen Ring.</p>',
    question: 'Die Roboter sollen einen Ball, einen Ring und einen Kegel nehmen. Mit welchen Befehlen musst Du sie steuern?',
    howto: 'Wähle eine der vier Befehlsfolgen. Dinge nehmen die Roboter nur dort, wo sie nach dem letzten Befehl stehen.',
    explanation: function () {
      var lis = OPTIONS.map(function (o) {
        return '<li><b>' + o.l + ')</b> ' + cmdText(o.cmd) + ': ' + takenText(run(o.cmd).taken) + (o.l === OPTIONS[RIGHT].l ? ' – richtig' : '') + '</li>';
      }).join('');
      return '<p>Man verfolgt alle drei Roboter gleichzeitig: Bei jedem Befehl macht jeder Roboter denselben Schritt. Bei <b>N, O, O, S, O</b> nehmen sie am Ende einen Ball, einen Ring und einen Kegel. Die anderen Befehlsfolgen führen zu falschen Dingen:</p>' +
        '<ul class="t-zugleich16-sums">' + lis + '</ul>' +
        '<p><b>Informatik:</b> Die drei Roboter fahren gleichzeitig, also <i>parallel</i>. Das geht oft schneller, als wenn ein Roboter nacheinander alles erledigt. ' +
        'Auch Supercomputer und <i>Computer-Cluster</i> rechnen mit vielen Prozessoren parallel, zum Beispiel für Wettervorhersagen. ' +
        'Es ist einfach zu organisieren, wenn alle das Gleiche tun und jeder seine eigenen Daten hat, so wie hier die drei Roboter.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null;
      boardEl = h('div', { class: 't-zugleich16-boardwrap' });
      noteEl = h('p', { class: 't-zugleich16-note', role: 'status' });
      optsEl = h('div', { class: 't-zugleich16-opts', role: 'radiogroup', 'aria-label': 'Antworten' });
      el.replaceChildren(h('div', { class: 't-zugleich16-box' }, boardEl, noteEl, optsEl));
      optsEl.addEventListener('change', onChange);
      renderAll();
    },
    isComplete: function () { return picked !== null; },
    evaluate: function () { return { correct: picked === RIGHT, answer: picked === null ? null : OPTIONS[picked].l }; },
    setAnswer: function (ans) {
      picked = null;
      OPTIONS.forEach(function (o, i) { if (o.l === ans) picked = i; });
      mode = 'check'; renderAll();
    },
    lock: function (on) { locked = on; mode = on ? (mode || 'check') : null; renderAll(); },
    reset: function () { picked = null; mode = null; locked = false; renderAll(); },
    showSolution: function () { picked = RIGHT; mode = 'solution'; locked = true; renderAll(); }
  });

  /* Selbstprüfung gegen die Angaben im Heft */
  (function () {
    function counts(t) { return t.map(function (k) { return k || 'leer'; }).sort().join(); }
    var ex = counts(run(['N', 'N', 'S', 'S', 'O']).taken);
    if (ex !== 'kegel,kegel,ring') throw new Error('zugleich16: Beispiel stimmt nicht: ' + ex);
    var want = { A: 'kegel,ring,ring', B: 'ball,kegel,ring', C: 'ball,ball,kegel', D: 'kegel,kegel,ring' };
    OPTIONS.forEach(function (o) {
      var r = run(o.cmd);
      if (!inBounds(r) || counts(r.taken) !== want[o.l]) throw new Error('zugleich16: Antwort ' + o.l + ' weicht vom Heft ab');
    });
    if (OPTIONS[RIGHT].l !== 'B') throw new Error('zugleich16: Lösung stimmt nicht');
  })();
})();
