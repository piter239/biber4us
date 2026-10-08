/* Aufgabe Sierpinski-Dreieck (Biber 2020; Klasse 9-10 mittel, 11-13 einfach): Teildreiecke nach drei Schritten schwarz färben */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-sierpinski20-';

  var SIDE = 8, E = 50, HH = E * Math.sqrt(3) / 2, W = SIDE * E;

  /* Zelle (i, j): Reihe i = 0..7 von oben, j = 0..2i; gerades j = Spitze oben, ungerades j = Spitze unten */
  function key(i, j) { return i + '-' + j; }
  function cellPoints(i, j) {
    var k = j >> 1, ax = W / 2 - E / 2 * i + E * k, y0 = i * HH, y1 = (i + 1) * HH;
    var pts = (j % 2 === 0) ? [[ax, y0], [ax - E / 2, y1], [ax + E / 2, y1]] : [[ax, y0], [ax + E, y0], [ax + E / 2, y1]];
    return pts;
  }
  function center(i, j) {
    var p = cellPoints(i, j);
    return { x: (p[0][0] + p[1][0] + p[2][0]) / 3, y: (p[0][1] + p[1][1] + p[2][1]) / 3 };
  }
  function pointsAttr(i, j) { return cellPoints(i, j).map(function (p) { return p[0].toFixed(2) + ',' + p[1].toFixed(2); }).join(' '); }

  /* Schwarze Zellen nach "depth" Schritten (rekursive Konstruktion wie im Heft). Teildreieck: Spitzenzelle (r0, j0), Seitenlänge s. */
  function blackAfter(depth) {
    var set = {};
    (function sub(r0, j0, s, d) {
      if (d === 0 || s < 2) return;
      var hs = s / 2, di, dj;
      var inChild = function (r, j) {
        return (r < r0 + hs && j >= j0 && j <= j0 + 2 * (r - r0)) ||
          (r >= r0 + hs && ((j >= j0 && j <= j0 + 2 * (r - r0 - hs)) || (j >= j0 + s && j <= j0 + s + 2 * (r - r0 - hs))));
      };
      for (di = 0; di < s; di++) for (dj = 0; dj <= 2 * di; dj++) {
        if (!inChild(r0 + di, j0 + dj)) set[key(r0 + di, j0 + dj)] = true;
      }
      sub(r0, j0, hs, d - 1); sub(r0 + hs, j0, hs, d - 1); sub(r0 + hs, j0 + s, hs, d - 1);
    })(0, 0, SIDE, depth);
    return set;
  }
  var STEP1 = blackAfter(1), TARGET = blackAfter(3);
  var CELLS = [];   /* alle Zellen in Reihenfolge */
  (function () { var i, j; for (i = 0; i < SIDE; i++) for (j = 0; j <= 2 * i; j++) CELLS.push({ i: i, j: j, k: key(i, j), pre: !!STEP1[key(i, j)], want: !!TARGET[key(i, j)] }); })();
  var EDIT = CELLS.filter(function (c) { return !c.pre; });   /* Zellen, die du färben darfst */

  /* ---------- Zustand ---------- */
  var upBound = false;
  var el, api, svgEl, nodes, on, locked, mark, focusKey, paintVal, paintFrom, suppressClick;

  function reset() { on = {}; mark = null; }

  function stateOf(c) {
    if (c.pre) return 'pre';
    if (mark === 'solution') return c.want ? 'on' : 'off';
    var v = !!on[c.k];
    if (mark === 'check') {
      if (v && !c.want) return 'bad';
      if (!v && c.want) return 'miss';
    }
    return v ? 'on' : 'off';
  }
  function paint() {
    CELLS.forEach(function (c) {
      var n = nodes[c.k], s = stateOf(c);
      n.setAttribute('class', P + 'cell ' + P + s + (c.pre ? '' : ' ' + P + 'edit'));
      if (!c.pre) {
        var v = s === 'on' || s === 'bad';
        n.setAttribute('aria-checked', String(v));
        n.setAttribute('aria-label', 'Reihe ' + (c.i + 1) + ', Dreieck ' + (c.j + 1) + ' von ' + (2 * c.i + 1) + ', ' + (c.j % 2 ? 'Spitze unten' : 'Spitze oben') + ', ' + (v ? 'schwarz' : 'weiß'));
        n.setAttribute('aria-disabled', locked ? 'true' : 'false');
        n.setAttribute('tabindex', c.k === focusKey ? '0' : '-1');
      }
    });
  }
  function setCell(c, v) {
    if (locked || c.pre) return;
    if (v) on[c.k] = true; else delete on[c.k];
    paint();
    api.changed();
  }
  function cellOf(node) { var t = node.closest ? node.closest('[data-k]') : null; return t ? byKey[t.getAttribute('data-k')] : null; }
  var byKey = {};
  CELLS.forEach(function (c) { byKey[c.k] = c; });

  function onPointerDown(e) {
    var c = cellOf(e.target);
    if (!c || c.pre || locked || e.pointerType !== 'mouse' || e.button !== 0) return;
    paintVal = !on[c.k];
    paintFrom = c.k;
    suppressClick = c.k;
    focusKey = c.k;
    setCell(c, paintVal);
  }
  function onPointerOver(e) {
    if (paintVal === undefined || !(e.buttons & 1)) { paintVal = undefined; return; }
    var c = cellOf(e.target);
    if (!c || c.pre || c.k === paintFrom) return;
    suppressClick = null;
    setCell(c, paintVal);
  }
  function onClick(e) {
    var c = cellOf(e.target);
    if (!c || c.pre || locked) return;
    if (suppressClick === c.k) { suppressClick = null; return; }
    focusKey = c.k;
    setCell(c, !on[c.k]);
  }
  function onKey(e) {
    var c = cellOf(e.target);
    if (!c || c.pre) return;
    var idx = EDIT.indexOf(c), to = null, k = e.key;
    if (k === ' ' || k === 'Enter') { e.preventDefault(); if (!locked) setCell(c, !on[c.k]); return; }
    if (k === 'ArrowRight') to = EDIT[Math.min(EDIT.length - 1, idx + 1)];
    else if (k === 'ArrowLeft') to = EDIT[Math.max(0, idx - 1)];
    else if (k === 'ArrowUp' || k === 'ArrowDown') {
      var row = c.i + (k === 'ArrowUp' ? -1 : 1), cx = center(c.i, c.j).x, bestD = 1e9;
      EDIT.forEach(function (d) {
        if (d.i !== row) return;
        var dd = Math.abs(center(d.i, d.j).x - cx);
        if (dd < bestD) { bestD = dd; to = d; }
      });
    } else if (k === 'Home') to = EDIT[0];
    else if (k === 'End') to = EDIT[EDIT.length - 1];
    if (!to) return;
    e.preventDefault();
    focusKey = to.k;
    paint();
    nodes[to.k].focus();
  }

  function buildBoard() {
    var x = Biber.svg;
    nodes = {};
    svgEl = x('svg', { class: P + 'svg', viewBox: '-4 -4 ' + (W + 8) + ' ' + (SIDE * HH + 8), role: 'group', 'aria-label': 'Dreieck aus 64 kleinen Teildreiecken in 8 Reihen. Die Teildreiecke des ersten Schritts sind schon schwarz.' });
    CELLS.forEach(function (c) {
      var attrs = { points: pointsAttr(c.i, c.j), 'data-k': c.k };
      if (!c.pre) { attrs.role = 'checkbox'; attrs.focusable = 'true'; }
      var n = x('polygon', attrs);
      nodes[c.k] = n;
      svgEl.appendChild(n);
    });
    svgEl.appendChild(x('polygon', { class: P + 'outline', points: [[W / 2, 0], [0, SIDE * HH], [W, SIDE * HH]].map(function (p) { return p.join(','); }).join(' ') }));
    focusKey = EDIT[0].k;
    svgEl.addEventListener('pointerdown', onPointerDown);
    svgEl.addEventListener('pointerover', onPointerOver);
    svgEl.addEventListener('click', onClick);
    svgEl.addEventListener('keydown', onKey);
    if (!upBound) { upBound = true; document.addEventListener('pointerup', function () { paintVal = undefined; }); }
    return svgEl;
  }

  /* ---------- kleine Bilder für die Erklärung ---------- */
  function stepSvg(depth) {
    var set = blackAfter(depth), out = '';
    CELLS.forEach(function (c) {
      out += '<polygon class="' + P + (set[c.k] ? 'x-b' : 'x-w') + '" points="' + pointsAttr(c.i, c.j) + '"/>';
    });
    return '<svg class="' + P + 'mini" viewBox="-4 -4 ' + (W + 8) + ' ' + (SIDE * HH + 8) + '" role="img" aria-label="Sierpinski-Dreieck nach ' + depth + (depth === 1 ? ' Schritt' : ' Schritten') + '">' + out + '</svg>';
  }

  Biber.register({
    id: 'sierpinski20',
    story:
      '<p>Ein Sierpinski-Dreieck zeichnet man so: Zuerst zeichnet man ein gleichseitiges weißes Dreieck. Dann geht es schrittweise weiter.</p>' +
      '<p>In jedem Schritt wird jedes weiße Dreieck in vier kleinere unterteilt und das mittlere davon schwarz gefärbt.</p>',
    question: 'Wie sieht ein Sierpinski-Dreieck nach drei Schritten aus? Färbe die richtigen Teildreiecke schwarz. Für den ersten Schritt ist das schon erledigt.',
    howto: 'Tippe auf ein weißes Teildreieck, um es schwarz zu färben, und noch einmal, um es wieder weiß zu machen. Mit der Maus kannst du auch über mehrere Dreiecke ziehen. Mit der Tastatur: Pfeiltasten und Leertaste.',
    explanation: function () {
      return '<p>Im ersten Schritt wird das mittlere von vier Teildreiecken schwarz; es bleiben drei weiße. Im zweiten Schritt wird in jedem dieser drei weißen Dreiecke wieder das mittlere (kleinere) schwarz; dann gibt es neun weiße. Im dritten Schritt bekommt jedes dieser neun weißen Dreiecke ein schwarzes Mittendreieck. Schwarze Dreiecke werden nie wieder verändert.</p>' +
        '<div class="' + P + 'steps">' +
        [1, 2, 3].map(function (d) { return '<figure>' + stepSvg(d) + '<figcaption>nach Schritt ' + d + '</figcaption></figure>'; }).join('') + '</div>' +
        '<p>Das ist eine <em>rekursive</em> Konstruktion: Dieselbe Regel (teilen und die Mitte schwarz färben) wird immer wieder auf die neu entstandenen weißen Dreiecke angewendet, bis die vorgegebene Zahl an Schritten erreicht ist. So entsteht ein <em>Fraktal</em>: Jeder weiße Teil sieht aus wie eine verkleinerte Kopie des Ganzen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset(); paintVal = undefined; suppressClick = null;
      el.replaceChildren(h('div', { class: P + 'board' }, buildBoard()));
      paint();
    },
    isComplete: function () { return Object.keys(on).length > 0; },
    evaluate: function () {
      var ok = EDIT.every(function (c) { return !!on[c.k] === c.want; });
      return { correct: ok, answer: { black: EDIT.filter(function (c) { return on[c.k]; }).map(function (c) { return c.k; }) } };
    },
    setAnswer: function (ans) {
      on = {};
      ((ans && ans.black) || []).forEach(function (k) { if (byKey[k] && !byKey[k].pre) on[k] = true; });
      mark = 'check';
      paint();
    },
    lock: function (v) {
      locked = v;
      mark = v ? (mark === 'solution' ? 'solution' : 'check') : null;
      paint();
    },
    reset: function () { reset(); paint(); },
    showSolution: function () { mark = 'solution'; locked = true; paint(); }
  });
})();
