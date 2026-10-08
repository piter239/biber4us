/* Aufgabe Nach Hause (Klasse 3-4 mittel, 5-6 einfach): Wegverfolgung mit Richtungspfeilen */
(function () {
  'use strict';
  var h = Biber.h, svg = Biber.svg;

  /* ---------- Wegenetz ----------
     Kreuzungen als "spalte,reihe": Spalten 0..4 (links nach rechts), Reihen 1..3 (von oben, die drei
     Querstraßen unter dem Fluss); Reihe 0 sind die beiden Kreuzungen oben vor den Brücken (A=1,0 und B=3,0). */
  var XY = { // Mittelpunkte in der Karte (Koordinaten des SVG, 1030 x 945, Ursprung 60 px links vom Kartenbild)
    '0,1': [140, 540], '1,1': [283, 535], '2,1': [455, 550], '3,1': [648, 558], '4,1': [810, 575],
    '0,2': [140, 668], '1,2': [285, 665], '2,2': [455, 675], '3,2': [655, 682], '4,2': [820, 692],
    '0,3': [115, 832], '1,3': [278, 832], '2,3': [462, 838], '3,3': [645, 838], '4,3': [840, 850],
    '1,0': [298, 225], '3,0': [665, 225]
  };
  var NODES = Object.keys(XY);
  var EDGES = {}; // 'knoten|richtung' -> Nachbar
  function link(a, b, d, o) { EDGES[a + '|' + d] = b; EDGES[b + '|' + o] = a; }
  var c, r;
  for (r = 1; r <= 3; r++) for (c = 0; c < 4; c++) link(c + ',' + r, (c + 1) + ',' + r, 'E', 'W');
  for (c = 0; c < 5; c++) for (r = 1; r <= 2; r++) link(c + ',' + r, c + ',' + (r + 1), 'S', 'N');
  [1, 3].forEach(function (k) { link(k + ',0', k + ',1', 'S', 'N'); });
  link('1,0', '3,0', 'E', 'W');
  EDGES['1,0|N'] = 'HAUS_IGEL';
  EDGES['3,0|N'] = 'HAUS_HASE';
  var HOUSE = { HAUS_IGEL: [295, 95], HAUS_HASE: [668, 95] };
  var FIXED = { '1,2': 'N', '3,2': 'W' };
  var STARTS = {
    igel: { node: '4,2', dir: 'W', from: [915, 690], home: 'HAUS_IGEL' },
    hase: { node: '0,3', dir: 'E', from: [35, 848], home: 'HAUS_HASE' }
  };
  var VEC = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
  var DIRNAME = { N: 'nach oben', E: 'nach rechts', W: 'nach links', S: 'nach unten' };

  // Läuft los: geradeaus, an Pfeilen in Pfeilrichtung. Ergebnis: Pfad, Ende (Haus / 'stuck' / 'loop'), letzte Richtung
  function run(who, arrows) {
    var s = STARTS[who], n = s.node, d = s.dir, path = [n], seen = {};
    for (;;) {
      if (arrows[n]) d = arrows[n];
      var key = n + '|' + d;
      if (seen[key]) return { end: 'loop', path: path, dir: d };
      seen[key] = 1;
      var m = EDGES[key];
      if (!m) return { end: 'stuck', path: path, dir: d };
      if (HOUSE[m]) return { end: m, path: path, dir: d };
      n = m; path.push(n);
    }
  }
  function simulate(extra) {
    var a = {}, k;
    for (k in FIXED) a[k] = FIXED[k];
    for (k in extra) a[k] = extra[k];
    var ri = run('igel', a), rh = run('hase', a);
    return { igel: ri, hase: rh, ok: ri.end === STARTS.igel.home && rh.end === STARTS.hase.home };
  }

  // Alle gültigen Platzierungen von Pfeil rechts + 2x Pfeil hoch (Brute Force)
  var SOLUTIONS = (function () {
    var out = [], seen = {};
    var free = NODES.filter(function (n) { return !FIXED[n]; });
    free.forEach(function (a) { free.forEach(function (b) { free.forEach(function (c2) {
      if (a === b || a === c2 || b === c2 || b > c2) return; // die zwei Hoch-Pfeile sind gleich
      var ex = {}; ex[a] = 'E'; ex[b] = 'N'; ex[c2] = 'N';
      if (simulate(ex).ok) { var key = JSON.stringify(ex); if (!seen[key]) { seen[key] = 1; out.push(ex); } }
    }); }); });
    return out;
  })();

  /* ---------- Zustand ---------- */
  var TOKENS = ['E', 'N', 'N'];       // die drei übrigen Pfeile
  var el, api, locked, mode;          // mode: 'edit' | 'check' | 'solution'
  var at;                             // Knoten -> Token-Index
  var selected, dragging;

  function reset() { at = {}; selected = null; dragging = null; mode = 'edit'; }
  function placed(t) { return Object.keys(at).some(function (k) { return at[k] === t; }); }
  function arrowsNow() {
    var a = {};
    Object.keys(at).forEach(function (k) { a[k] = TOKENS[at[k]]; });
    return a;
  }
  function posName(n) {
    var p = n.split(','), col = +p[0] + 1, row = +p[1];
    if (row === 0) return 'Kreuzung ganz oben vor der ' + (col === 2 ? 'linken' : 'rechten') + ' Brücke';
    return 'Kreuzung in Reihe ' + (row + 1) + ' (von oben), Spalte ' + col;
  }

  function place(tok, node) {
    if (locked || FIXED[node]) return;
    Object.keys(at).forEach(function (k) { if (at[k] === tok) delete at[k]; });
    at[node] = tok;                 // ein früher dort liegender Pfeil geht zurück in den Vorrat
    selected = null; dragging = null;
    render(); changed();
  }
  function remove(node) {
    if (locked) return;
    delete at[node];
    selected = null;
    render(); changed();
  }
  function changed() {
    var n = Object.keys(at).length;
    api.changed(n === 3 ? 'Alle drei Pfeile liegen. Du kannst prüfen.' : 'Noch ' + (3 - n) + (3 - n === 1 ? ' Pfeil' : ' Pfeile') + ' übrig.');
  }

  /* ---------- Darstellung ---------- */
  function arrowImg(dir, cx, cy, extra) {
    var vertical = dir !== 'E';
    var w = vertical ? 52 : 86, ht = vertical ? 86 : 52;
    return svg('image', { href: 'assets/nachhause/' + (vertical ? 'pfeil-hoch' : 'pfeil-rechts') + '.png', x: cx - w / 2, y: cy - ht / 2, width: w, height: ht, class: 'nh-arrow ' + (extra || ''), 'aria-hidden': 'true' });
  }
  function routeLine(res, who) {
    var s = STARTS[who];
    var pts = [s.from].concat(res.path.map(function (n) { return XY[n]; }));
    var last = res.path[res.path.length - 1], end;
    if (HOUSE[res.end]) end = HOUSE[res.end];
    else { var v = VEC[res.dir]; end = [XY[last][0] + v[0] * 70, XY[last][1] + v[1] * 70]; }
    pts.push(end);
    return { pts: pts, end: end };
  }

  function render() {
    var arrows = arrowsNow();
    var result = mode !== 'edit';
    var sim = result ? simulate(arrows) : null;

    // Vorrat
    var pool = TOKENS.map(function (dir, t) {
      var used = placed(t);
      var vertical = dir !== 'E';
      var btn = h('button', {
        type: 'button', class: 'nh-tok' + (selected === t ? ' selected' : '') + (used ? ' used' : ''), 'data-tok': String(t),
        draggable: !locked && !used ? 'true' : false, disabled: locked || used, 'aria-pressed': String(selected === t),
        'aria-label': 'Pfeil ' + DIRNAME[dir] + (used ? ' (schon gelegt)' : '')
      }, used ? null : h('img', { src: 'assets/nachhause/' + (vertical ? 'pfeil-hoch' : 'pfeil-rechts') + '.png', alt: '', width: vertical ? 41 : 66, height: vertical ? 67 : 40, draggable: 'false' }));
      return btn;
    });

    var s = svg('svg', { viewBox: '-60 0 1030 945', class: 'nh-map', role: 'group', 'aria-label': 'Karte mit Wegen, Fluss, Hasenhaus und Igelhaus' });
    s.appendChild(svg('image', { href: 'assets/nachhause/karte.png', x: -60, y: 0, width: 1030, height: 945, 'aria-hidden': 'true' }));

    // Wege von Hase und Igel
    if (result) {
      var ri = routeLine(sim.igel, 'igel'), rh = routeLine(sim.hase, 'hase');
      [[ri, 'igel'], [rh, 'hase']].forEach(function (p) {
        s.appendChild(svg('polyline', { class: 'nh-route ' + p[1], points: p[0].pts.map(function (q) { return q.join(','); }).join(' '), 'aria-hidden': 'true' }));
      });
    }
    // Kreuzungen
    NODES.forEach(function (n) {
      var xy = XY[n], tok = at[n], fixed = FIXED[n];
      if (fixed) return;
      var g = svg('g', {
        class: 'nh-spot' + (tok != null ? ' has' : '') + (selected != null || dragging != null ? ' armed' : ''), 'data-node': n,
        tabindex: locked ? '-1' : '0', role: 'button',
        'aria-label': posName(n) + (tok != null ? ': Pfeil ' + DIRNAME[TOKENS[tok]] + ' (antippen zum Entfernen)' : ': frei')
      },
        svg('circle', { class: 'nh-hit', cx: xy[0], cy: xy[1], r: 54 }),
        svg('circle', { class: 'nh-dot', cx: xy[0], cy: xy[1], r: 11 }));
      s.appendChild(g);
    });
    NODES.forEach(function (n) {
      if (at[n] == null) return;
      s.appendChild(arrowImg(TOKENS[at[n]], XY[n][0], XY[n][1], 'mine'));
    });
    if (result) {
      [[ri, sim.igel, 'igel'], [rh, sim.hase, 'hase']].forEach(function (p) {
        var good = HOUSE[p[1].end] && p[1].end === STARTS[p[2]].home;
        var e = p[0].end;
        s.appendChild(svg('g', { class: 'nh-end ' + (good ? 'ok' : 'bad'), 'aria-hidden': 'true' },
          svg('circle', { cx: e[0], cy: e[1], r: 26 }),
          svg('text', { x: e[0], y: e[1] + 10, 'text-anchor': 'middle' }, good ? '✓' : '✗')));
      });
    }

    var legend = result ? h('ul', { class: 'nh-legend' },
      h('li', null, h('span', { class: 'nh-sw hase', 'aria-hidden': 'true' }), 'Weg des Hasen: ' + endText(sim.hase, 'hase')),
      h('li', null, h('span', { class: 'nh-sw igel', 'aria-hidden': 'true' }), 'Weg des Igels: ' + endText(sim.igel, 'igel'))) : null;

    el.replaceChildren(h('div', { class: 'nh-board' },
      h('div', { class: 'nh-pool', 'data-pool': '', role: 'group', 'aria-label': 'Die drei übrigen Pfeile' }, h('span', { class: 'nh-pool-l' }, 'Pfeile'), pool),
      h('div', { class: 'nh-mapwrap' }, s, legend)));
  }
  function endText(res, who) {
    if (res.end === STARTS[who].home) return 'kommt zu Hause an.';
    if (HOUSE[res.end]) return 'landet im falschen Haus.';
    if (res.end === 'loop') return 'läuft im Kreis.';
    return 'kommt an eine Stelle, an der der Weg endet.';
  }

  /* ---------- Eingaben ---------- */
  function onClick(e) {
    if (locked) return;
    var t = e.target.closest('[data-tok]');
    if (t) {
      var k = +t.dataset.tok;
      selected = selected === k ? null : k;
      render();
      return;
    }
    var sp = e.target.closest('[data-node]');
    if (!sp) return;
    var n = sp.dataset.node;
    if (selected != null) place(selected, n);
    else if (at[n] != null) remove(n);
  }
  function onKey(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var sp = e.target.closest && e.target.closest('[data-node]');
    if (!sp || locked) return;
    e.preventDefault();
    var n = sp.dataset.node;
    if (selected != null) place(selected, n);
    else if (at[n] != null) remove(n);
    // Fokus auf dieselbe Kreuzung zurücksetzen
    var again = el.querySelector('[data-node="' + n + '"]');
    if (again) again.focus();
  }
  function onDragStart(e) {
    var t = e.target.closest && e.target.closest('[data-tok]');
    if (!t || locked) return;
    dragging = +t.dataset.tok;
    e.dataTransfer.setData('text/plain', String(dragging));
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e) {
    var sp = e.target.closest && e.target.closest('[data-node]');
    if (!sp || dragging == null) return;
    e.preventDefault();
    sp.classList.add('over');
  }
  function onDragLeave(e) {
    var sp = e.target.closest && e.target.closest('[data-node]');
    if (sp) sp.classList.remove('over');
  }
  function onDrop(e) {
    var sp = e.target.closest && e.target.closest('[data-node]');
    if (!sp || dragging == null) return;
    e.preventDefault();
    place(dragging, sp.dataset.node);
  }
  function onDragEnd() { dragging = null; if (!locked) render(); }

  Biber.register({
    id: 'nachhause',
    story: '<p>Ein Hase und ein Igel wollen nach Hause. Jeder hat ein eigenes Haus: das Haus mit dem Hasen-Schild (rote Tür) und das Haus mit dem Igel-Schild (blaue Tür).</p>' +
      '<p>Hase und Igel laufen auf den Wegen, und zwar geradeaus. Nur wenn sie zu einer Kreuzung mit Pfeil kommen, folgen sie der Richtung des Pfeils.</p>' +
      '<p>An einigen Kreuzungen liegen schon Pfeile. Entlang der Pfeile findet der Igel nach Hause, der Hase aber nicht. Zum Glück sind noch drei Pfeile übrig.</p>',
    question: 'Zeichne die drei übrigen Pfeile auf Kreuzungen, so dass Hase und Igel beide nach Hause finden.',
    howto: 'Tippe erst einen Pfeil im Vorrat an und dann die Kreuzung, auf die er soll. Du kannst ihn auch dorthin ziehen. Tippe einen gelegten Pfeil an, um ihn zurückzunehmen. Der Hase startet links unten, der Igel rechts.',
    explanation: function () {
      return '<p>Man läuft den Weg Schritt für Schritt nach, so wie ein Computer ein Programm Zeile für Zeile ausführt. Der Hase läuft sonst bis zum Ende der untersten Straße. Mit einem Pfeil nach oben an der ersten Kreuzung unten links biegt er ab; oben am Ende der Straße lenkt ihn ein Pfeil nach rechts auf die lange Querstraße. Dort schickt ihn ein Pfeil nach oben unter der rechten Brücke über den Fluss zu seinem Haus.</p>' +
        '<p>Wichtig: Der Igel läuft weiter über die linke Brücke, deshalb darf kein neuer Pfeil auf seinem Weg liegen. Wer für den Hasen etwas ändert, muss immer prüfen, dass der Igel noch ankommt. Es gibt noch eine zweite Lösung, die eine Straße weiter rechts abbiegt.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKey);
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('dragleave', onDragLeave);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', onDragEnd);
      render();
    },
    isComplete: function () { return Object.keys(at).length === 3; },
    evaluate: function () {
      var a = arrowsNow();
      var list = Object.keys(a).sort().map(function (k) { return { node: k, dir: a[k] }; });
      return { correct: simulate(a).ok, answer: list };
    },
    setAnswer: function (ans) {
      at = {}; var used = {};
      ans.forEach(function (p) {
        for (var t = 0; t < TOKENS.length; t++) if (!used[t] && TOKENS[t] === p.dir) { used[t] = 1; at[p.node] = t; break; }
      });
      selected = null; mode = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      if (on) { if (mode === 'edit') mode = 'check'; } else mode = 'edit';
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      var sol = SOLUTIONS[0], used = {};
      at = {};
      Object.keys(sol).forEach(function (n) {
        for (var t = 0; t < TOKENS.length; t++) if (!used[t] && TOKENS[t] === sol[n]) { used[t] = 1; at[n] = t; break; }
      });
      selected = null; mode = 'solution'; locked = true;
      render();
    }
  });
})();
