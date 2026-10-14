/* Aufgabe Stempel (Biber-Heft 2019, Klasse 3-4 mittel, 5-6 einfach): aus dem Bild auf die benutzten Stempel schließen (Reverse Engineering) */
(function () {
  'use strict';
  var h = Biber.h, S = Biber.svg;

  var U = 40, COLS = 12, ROWS = 5; /* Rasterweite und Größe des Bretts in Rasterzellen */
  var ANSWER = 'A';

  /* ---------- Kleine Geometrie: Figuren als Mengen von Einheitsstrecken ---------- */
  function sq(x, y, s) {
    var e = [], i;
    for (i = 0; i < s; i++) e.push(['h', x + i, y], ['h', x + i, y + s], ['v', x, y + i], ['v', x + s, y + i]);
    return e;
  }
  function line(x, y, l, d) {
    var e = [], i;
    for (i = 0; i < l; i++) e.push(d === 'h' ? ['h', x + i, y] : ['v', x, y + i]);
    return e;
  }
  function norm(edges) {
    var seen = {}, out = [];
    edges.forEach(function (e) { var k = e.join(','); if (!seen[k]) { seen[k] = 1; out.push(e); } });
    return out;
  }
  function seg(e, dx, dy) {
    var x = e[1] + dx, y = e[2] + dy;
    return e[0] === 'h' ? { x1: x * U, y1: y * U, x2: (x + 1) * U, y2: y * U } : { x1: x * U, y1: y * U, x2: x * U, y2: (y + 1) * U };
  }

  /* Figuren auf dem Brett (Rasterkoordinaten im Brett) */
  var FIG1 = { dx: 1, dy: 1, label: [1, 0.5], edges: norm([].concat(sq(0, 0, 1), sq(1, 0, 1), sq(0, 1, 1), sq(1, 1, 1))) };            /* 4 x Stempel B */
  var FIG2 = { dx: 5, dy: 1, label: [5, 0.5], edges: norm([].concat(sq(0, 1, 1), line(1, 0, 1, 'v'), line(0, 2, 1, 'v'))) };            /* 1 x B, 2 x D (senkrecht) */
  var FIG3 = { dx: 8, dy: 1, label: [8, 0.5], edges: norm([].concat(sq(0, 0, 2), sq(0, 1, 2))) };                                       /* Ziel: 2 x A */

  /* ---------- Absicherung: Welche Stempel können Figur 3 überhaupt erzeugen, und wie oft müssen sie benutzt werden? ---------- */
  var COUNTS = (function () {
    var target = {}, i;
    FIG3.edges.forEach(function (e) { target[e.join(',')] = 1; });
    var tkeys = Object.keys(target);
    function subset(es) { return es.every(function (e) { return target[e.join(',')]; }); }
    function cands(name) {
      var out = [], x, y, d;
      for (x = -1; x < 5; x++) for (y = -1; y < 5; y++) {
        if (name === 'A') out.push(sq(x, y, 2));
        else if (name === 'B') out.push(sq(x, y, 1));
        else for (d = 0; d < 2; d++) out.push(line(x, y, name === 'C' ? 2 : 1, d ? 'h' : 'v'));
      }
      return out.filter(subset).map(function (es) { return es.map(function (e) { return e.join(','); }); });
    }
    function mincover(name) {
      var cs = cands(name), n, best = null;
      var covered = {};
      cs.forEach(function (c) { c.forEach(function (k) { covered[k] = 1; }); });
      if (tkeys.some(function (k) { return !covered[k]; })) return null;
      function rec(idx, used, left) {
        /* wähle eine noch unbedeckte Strecke und probiere alle Stempel, die sie enthalten */
        var firstMissing = null;
        for (var q = 0; q < tkeys.length; q++) if (!left[tkeys[q]]) { firstMissing = tkeys[q]; break; }
        if (firstMissing === null) { if (best === null || used < best) best = used; return; }
        if (best !== null && used + 1 >= best) return;
        cs.forEach(function (c) {
          if (c.indexOf(firstMissing) < 0) return;
          var nl = {}; Object.keys(left).forEach(function (k) { nl[k] = 1; }); c.forEach(function (k) { nl[k] = 1; });
          rec(idx + 1, used + 1, nl);
        });
      }
      rec(0, 0, {});
      return best;
    }
    var r = {};
    ['A', 'B', 'C', 'D'].forEach(function (n) { r[n] = mincover(n); });
    return r;
  })();
  /* Mia benutzt genau einen Stempel zweimal: Der Stempel, der Figur 3 mit genau 2 Abdrücken erzeugt */
  var TWICE = ['A', 'B', 'C', 'D'].filter(function (n) { return COUNTS[n] === 2; });
  if (TWICE.length === 1) ANSWER = TWICE[0];

  var STAMPS = {
    A: { name: 'großes Quadrat', desc: 'Stempel A: großes Quadrat' },
    B: { name: 'kleines Quadrat', desc: 'Stempel B: kleines Quadrat' },
    C: { name: 'lange Linie', desc: 'Stempel C: lange Linie' },
    D: { name: 'kurze Linie', desc: 'Stempel D: kurze Linie' }
  };
  var ORDER = ['A', 'B', 'C', 'D'];

  var el, api, picked, locked, mode; /* mode: null | 'check' | 'solution' */

  function reset() { picked = null; mode = null; }

  /* ---------- Zeichnungen ---------- */
  function figure(f, cls, extra) {
    var g = S('g', { class: cls || 't-stempel19-fig' });
    f.edges.forEach(function (e) {
      var s = seg(e, f.dx, f.dy);
      g.appendChild(S('line', { x1: s.x1, y1: s.y1, x2: s.x2, y2: s.y2 }));
    });
    return g;
  }
  function squareRect(x, y, sz, cls) {
    return S('rect', { x: (x) * U, y: (y) * U, width: sz * U, height: sz * U, class: cls });
  }
  function label(n, f) {
    var cx = f.label[0] * U - 6, cy = f.label[1] * U;
    return S('g', { class: 't-stempel19-num' },
      S('circle', { cx: cx, cy: cy, r: 13 }),
      S('text', { x: cx, y: cy, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, String(n)));
  }

  function boardSvg() {
    var svg = S('svg', {
      class: 't-stempel19-svg', viewBox: '0 0 ' + COLS * U + ' ' + ROWS * U, role: 'img',
      'aria-label': 'Kariertes Brett mit drei Figuren. Figur 1: vier kleine Quadrate zu einem 2 mal 2 großen Quadrat zusammengesetzt. Figur 2: ein kleines Quadrat, an dessen rechter Seite oben ein kurzer senkrechter Strich ansetzt und an dessen linker Seite unten ein kurzer senkrechter Strich ansetzt. Figur 3 (noch zu stempeln, gestrichelt): ein Rechteck, zwei Kästchen breit und drei Kästchen hoch, mit zwei waagerechten Strichen im Inneren.'
    });
    var grid = S('g', { class: 't-stempel19-grid' }), i;
    for (i = 0; i <= COLS; i++) grid.appendChild(S('line', { x1: i * U, y1: 0, x2: i * U, y2: ROWS * U }));
    for (i = 0; i <= ROWS; i++) grid.appendChild(S('line', { x1: 0, y1: i * U, x2: COLS * U, y2: i * U }));
    svg.appendChild(grid);
    svg.appendChild(figure(FIG1));
    svg.appendChild(figure(FIG2));
    if (mode === 'solution') {
      /* zwei Abdrücke von Stempel A: oberer (Kästchen 0-1) und unterer (Kästchen 1-2) */
      var a1 = squareRect(FIG3.dx, FIG3.dy, 2, 't-stempel19-a1');
      var a2 = squareRect(FIG3.dx, FIG3.dy + 1, 2, 't-stempel19-a2');
      svg.appendChild(a1); svg.appendChild(a2);
      [0, 2].forEach(function (k) {
        svg.appendChild(S('ellipse', { cx: (FIG3.dx + k) * U, cy: (FIG3.dy + 1.5) * U, rx: 12, ry: 0.62 * U, class: 't-stempel19-overlap' }));
      });
    } else {
      svg.appendChild(figure(FIG3, 't-stempel19-fig target'));
    }
    svg.appendChild(label(1, FIG1)); svg.appendChild(label(2, FIG2)); svg.appendChild(label(3, FIG3));
    return svg;
  }

  function disc(letter) {
    var shape;
    if (letter === 'A') shape = S('rect', { x: 32, y: 32, width: 56, height: 56 });
    else if (letter === 'B') shape = S('rect', { x: 46, y: 46, width: 28, height: 28 });
    else if (letter === 'C') shape = S('line', { x1: 32, y1: 60, x2: 88, y2: 60 });
    else shape = S('line', { x1: 46, y1: 60, x2: 74, y2: 60 });
    return S('svg', { class: 't-stempel19-disc', viewBox: '0 0 120 120', 'aria-hidden': 'true', focusable: 'false' },
      S('path', { class: 'wood', d: 'M58 5 C90 3 114 24 112 56 C110 90 86 115 56 113 C24 111 4 88 6 56 C8 26 28 7 58 5 Z' }),
      S('ellipse', { class: 'ring', cx: 60, cy: 59, rx: 44, ry: 42 }),
      S('ellipse', { class: 'ring', cx: 60, cy: 59, rx: 31, ry: 29 }),
      S('g', { class: 'shape' }, shape));
  }

  function render() {
    var cards = ORDER.map(function (l) {
      var sel = picked === l, cls = 't-stempel19-card' + (sel ? ' sel' : ''), mark = null;
      if (mode === 'check' && sel) {
        var ok = l === ANSWER;
        cls += ok ? ' right' : ' wrong';
        mark = h('span', { class: 't-stempel19-mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      } else if (mode === 'solution' && l === ANSWER) {
        cls += ' right';
        mark = h('span', { class: 't-stempel19-mark', 'aria-hidden': 'true' }, '✓');
      }
      return h('button', { type: 'button', class: cls, 'data-l': l, 'aria-pressed': String(sel), 'aria-label': STAMPS[l].desc, disabled: locked },
        disc(l), h('span', { class: 't-stempel19-letter' }, l + ')'), mark);
    });
    var legend = mode === 'solution'
      ? h('p', { class: 't-stempel19-legend' },
        h('span', { class: 'k a1' }), ' erster Abdruck von Stempel A (oben)  ',
        h('span', { class: 'k a2' }), ' zweiter Abdruck (unten)  ',
        h('span', { class: 'k ov' }), ' hier überlappt die Farbe')
      : null;
    el.replaceChildren(h('div', { class: 't-stempel19-wrap' },
      h('div', { class: 't-stempel19-board' }, boardSvg()), legend,
      h('div', { class: 't-stempel19-stamps', role: 'group', 'aria-label': 'Die vier Stempel' }, cards)));
  }

  function onClick(e) {
    var b = e.target.closest('[data-l]');
    if (!b || locked) return;
    picked = picked === b.dataset.l ? null : b.dataset.l;
    render();
    var again = picked && el.querySelector('[data-l="' + picked + '"]');
    if (again) again.focus();
    api.changed(picked ? 'Stempel ' + picked + ' ausgewählt.' : '');
  }

  Biber.register({
    id: 'stempel19',
    story: '<p>Biber Paul hat vier Stempel: A, B, C und D. Sie sind unten zu sehen. Damit hat er bereits die Formen 1 und 2 gestempelt.</p>' +
      '<ul><li>Für Figur 1 hat er Stempel B viermal benutzt.</li><li>Für Figur 2 hat er Stempel B einmal und Stempel D zweimal benutzt.</li></ul>' +
      '<p>Jetzt will Paul Figur 3 stempeln. Seine Freundin Mia will ihm helfen. Mia sagt: „Für Figur 3 benutze ich genau einen Stempel zweimal.“</p>',
    question: 'Welchen Stempel benutzt Mia?',
    howto: 'Tippe auf den Stempel, den Mia benutzt.',
    explanation: function () {
      return '<p><strong>Mia benutzt Stempel A,</strong> den mit dem großen Quadrat. Zuerst stempelt sie den oberen Teil, danach den unteren. An zwei Stellen liegen die Linien dabei genau übereinander, dort überlappt sich die Farbe.</p>' +
        '<p>Figur 3 ginge auch mit Stempel C (achtmal) oder Stempel D (vierzehnmal). Mit Stempel B ist sie nicht möglich: Seine Abdrücke hätten in der Mitte einen senkrechten Strich, den Figur 3 nicht hat. Nur Stempel A passt also zu „genau zweimal“.</p>' +
        '<p>Hier hat man aus dem fertigen Bild geschlossen, wie es entstanden ist. In der Informatik nennt man das Reverse Engineering: Man versucht zu verstehen, wie ein Ergebnis, zum Beispiel ein Programm oder ein Computerspiel, gemacht wurde, auch wenn man die Bauanleitung nicht hat. Das ist in der Praxis viel schwieriger als bei diesem Stempelbild.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      render();
    },
    isComplete: function () { return !!picked; },
    evaluate: function () { return { correct: picked === ANSWER, answer: picked }; },
    setAnswer: function (ans) {
      picked = STAMPS[ans] ? ans : null;
      mode = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      if (on) { if (mode !== 'solution') mode = 'check'; } else mode = null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      picked = ANSWER; mode = 'solution'; locked = true;
      render();
    }
  });
})();
