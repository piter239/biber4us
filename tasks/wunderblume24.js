/* Aufgabe Wunderblume (Heft 2024, Klasse 3-4 schwer, 5-6 mittel): Tiefe eines vollstaendigen Binaerbaums (Aeste zaehlen) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-wunderblume24-';
  var NS = 'http://www.w3.org/2000/svg';

  var DAYS = 5;                                   /* offizielle Lösung (Heft S. 75): Antwort A, 5 Tage; Baum unten wird mit genau 5 Ebenen erzeugt und per Skript gezählt (32 äußere Knospen) */
  var OPTIONS = [
    { id: 'A', days: 5 }, { id: 'B', days: 11 }, { id: 'C', days: 16 }, { id: 'D', days: 32 }
  ];
  var RIGHT = 'A';

  /* ---------- Baum erzeugen (Einheitskoordinaten, y nach oben) ----------
     Ebene 0: erste Knospe (Wurzel). Ebene k: Gabelpunkt am Ende eines Stiels, dort sitzen zwei Knospen.
     Jede Knospe wächst am nächsten Tag zu einem eigenen Stiel mit einem neuen Gabelpunkt. */
  var LEN = [0, 46, 44, 38, 31, 25];
  var ANG = [0, 0, 33, 24, 17, 12];   /* Abweichung von der Wuchsrichtung des Elterstiels, in Grad */
  function jitter(i, k) { return Math.sin(i * 12.9898 + k * 78.233) * 0.5; }   /* deterministisch, -0.5 .. 0.5 */
  function buildTree(depth) {
    var nodes = [{ id: 0, level: 0, x: 0, y: 0, head: 0, parent: -1 }];
    var cur = [nodes[0]], id = 1;
    for (var k = 1; k <= depth; k++) {
      var next = [];
      cur.forEach(function (p) {
        var kids = k === 1 ? [0] : [-1, 1];
        kids.forEach(function (sgn) {
          var head = p.head + sgn * ANG[k] + jitter(id, 1) * 8;
          var len = LEN[k] * (1 + jitter(id, 2) * 0.12);
          var rad = head * Math.PI / 180;
          var n = { id: id++, level: k, x: p.x + len * Math.sin(rad), y: p.y + len * Math.cos(rad), head: head, parent: p.id };
          nodes.push(n); next.push(n);
        });
      });
      cur = next;
    }
    return nodes;
  }
  function fit(nodes, w, h2, pad, fixedScale) {
    var minx = 1e9, maxx = -1e9, maxy = -1e9;
    nodes.forEach(function (n) { minx = Math.min(minx, n.x); maxx = Math.max(maxx, n.x); maxy = Math.max(maxy, n.y); });
    var bw = Math.max(maxx - minx, 1) + 2 * 12, bh = maxy + 12 + 8;
    var s = fixedScale || Math.min((w - 2 * pad) / bw, (h2 - 2 * pad) / bh);
    var cx = (minx + maxx) / 2;
    return { s: s, tx: w / 2 - cx * s, ty: h2 - pad - 4 };
  }
  function svg(tag, attrs, kids) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  var DROP = 'M0 0 C-1 -4 -7 -9 -7 -14 A7 7 0 0 1 7 -14 C7 -9 1 -4 0 0 Z';   /* Knospe, Spitze zeigt zur Seite des Stiels */
  function bud(x, y, headDeg, off, scale) {
    return svg('path', { d: DROP, class: P + 'bud', transform: 'translate(' + x + ' ' + y + ') rotate(' + (headDeg + off) + ') scale(' + scale + ')' });
  }
  function budPair(sx, sy, headDeg, scale) {
    /* Zeichnen im Bildschirmsystem: Knospen zeigen vom Gabelpunkt aus nach außen/oben (Winkel von der Senkrechten) */
    return [bud(sx, sy, headDeg, -24, scale), bud(sx, sy, headDeg, 24, scale)];
  }

  /* Zeichnet den Baum mit depth Ebenen; liefert {g, forks} */
  function drawTree(depth, w, h2, opt) {
    var nodes = buildTree(depth), f = fit(nodes, w, h2, opt.pad, opt.scale);
    function X(n) { return (f.tx + n.x * f.s).toFixed(1); }
    function Y(n) { return (f.ty - n.y * f.s).toFixed(1); }
    var g = svg('g', {});
    var stems = {}, forkEls = {};
    var bs = (opt.bud || 0.8) * Math.max(0.55, Math.min(1, f.s * 1.35));
    nodes.forEach(function (n) {
      if (n.parent < 0) return;
      var p = nodes[n.parent];
      var line = svg('line', { x1: X(p), y1: Y(p), x2: X(n), y2: Y(n), class: P + 'stem' });
      stems[n.id] = line; g.appendChild(line);
    });
    nodes.forEach(function (n) {
      if (n.level === 0) {
        g.appendChild(bud(X(n), Y(n), 0, 0, bs));      /* erste Knospe */
      } else if (n.level === depth) {
        budPair(X(n), Y(n), n.head, bs).forEach(function (b) { g.appendChild(b); });  /* zwei äußere Knospen */
      } else {
        budPair(X(n), Y(n), n.head, bs).forEach(function (b) { g.appendChild(b); });  /* zwei Knospen, aus denen am nächsten Tag Stiele wachsen */
      }
    });
    return { g: g, nodes: nodes, stems: stems, X: X, Y: Y, f: f };
  }

  var el, api, locked, picked, mode, optsEl, bigSvg, msgEl, tree, selFork, badgeG;

  function minis() {
    var items = [
      { d: 0, cap: 'Neue Knospe vor Sonnenaufgang' },
      { d: 1, cap: 'Tag 1 nach Sonnenuntergang' },
      { d: 2, cap: 'Tag 2 nach Sonnenuntergang' }
    ];
    var wrap = h('div', { class: P + 'minis' });
    items.forEach(function (it) {
      var s = svg('svg', { viewBox: '0 0 120 130', class: P + 'mini', role: 'img', 'aria-label': it.cap + ': ' + (it.d === 0 ? 'eine einzelne Knospe' : it.d === 1 ? 'eine Knospe, ein Stiel, darüber zwei Knospen' : 'ein Stiel mit zwei Knospen, aus jeder wächst ein Stiel mit zwei neuen Knospen') });
      var t = drawTree(it.d, 120, 130, { pad: 10, scale: 1.0, bud: 0.8 });
      s.appendChild(t.g);
      wrap.appendChild(h('figure', { class: P + 'fig' }, s, h('figcaption', null, it.cap)));
    });
    return wrap;
  }

  function forkAria(n, idx) { return 'Knospenpaar ' + idx + ' von ' + (1 << (DAYS - 1)) + ' am Ende eines Astes. Antippen zeigt den Ast von der ersten Knospe aus.'; }

  function buildBig() {
    var W = 440, H = 340;
    tree = drawTree(DAYS, W, H, { pad: 8, bud: 1.0 });
    badgeG = svg('g', { class: P + 'badges' });
    var hit = svg('g', {});
    var idx = 0;
    tree.nodes.forEach(function (n) {
      if (n.level !== DAYS) return;
      idx++;
      var c = svg('g', { class: P + 'fork', tabindex: '0', role: 'button', 'data-n': n.id, 'aria-label': forkAria(n, idx) },
        [svg('circle', { cx: tree.X(n), cy: tree.Y(n), r: 15, class: P + 'hit' })]);
      hit.appendChild(c);
    });
    bigSvg.replaceChildren(tree.g, badgeG, hit);
  }

  function selectFork(id) {
    selFork = id;
    Object.keys(tree.stems).forEach(function (k) { tree.stems[k].classList.remove('on'); });
    badgeG.replaceChildren();
    if (id == null) { msgEl.textContent = 'Tippe auf ein Knospenpaar am Rand der Blume. Dann siehst du den Ast von der ersten Knospe bis dorthin und kannst die Stiele zählen.'; return; }
    var path = [], n = tree.nodes[id];
    while (n.parent >= 0) { path.unshift(n); n = tree.nodes[n.parent]; }
    path.forEach(function (s, i) {
      tree.stems[s.id].classList.add('on');
      var p = tree.nodes[s.parent];
      var mx = (+tree.X(p) + +tree.X(s)) / 2, my = (+tree.Y(p) + +tree.Y(s)) / 2;
      var b = svg('g', { class: P + 'badge', transform: 'translate(' + mx.toFixed(1) + ' ' + my.toFixed(1) + ')' }, [svg('circle', { r: 8.5 }), svg('text', { 'text-anchor': 'middle', y: 3.8 })]);
      b.lastChild.textContent = String(i + 1);
      badgeG.appendChild(b);
    });
    msgEl.textContent = 'Dieser Ast besteht aus ' + path.length + ' Stielen (von der ersten Knospe bis zum Knospenpaar gezählt). Probiere auch andere Äste aus.';
  }

  function optionCard(o) {
    var sel = picked === o.id;
    var cls = P + 'opt';
    var mark = '';
    if (mode && (mode === 'solution' ? o.id === RIGHT : sel)) {
      var ok = o.id === RIGHT;
      cls += ok ? ' right' : ' wrong';
      mark = ok ? '✓' : '✗';
    }
    var input = h('input', { type: 'radio', name: P + 'opt', value: o.id, disabled: locked, 'aria-label': 'Antwort ' + o.id + ': ' + o.days + ' Tage' });
    input.checked = sel;
    return h('label', { class: cls }, input,
      h('span', { class: P + 'card' }, h('span', { class: P + 'letter' }, o.id + ')'), h('span', { class: P + 'days' }, o.days + ' Tage'),
        mark ? h('span', { class: P + 'mark', 'aria-hidden': 'true' }, mark) : null));
  }
  function renderOptions() { optsEl.replaceChildren.apply(optsEl, OPTIONS.map(optionCard)); }
  function onChange(e) {
    if (locked || !e.target.matches('input[type=radio]')) return;
    picked = e.target.value;
    renderOptions();
    var f = optsEl.querySelector('input:checked'); if (f) f.focus();
    api.changed('Antwort ' + picked + ' gewählt.');
  }

  Biber.register({
    id: 'wunderblume24',
    story: '<p>Bei Sonnenaufgang wächst aus jeder neuen Knospe der Wunderblume ein Stiel. Den ganzen Tag lang wächst der Stiel weiter. ' +
      'Bei Sonnenuntergang hört der Stiel auf zu wachsen, und es kommen zwei neue Knospen heraus. So geht es Tag für Tag weiter, und die Wunderblume wird immer prächtiger.</p>',
    question: 'Wie viele Tage ist diese Wunderblume gewachsen?',
    howto: 'Tippe auf ein Knospenpaar am Rand der Blume, um den Ast von der ersten Knospe dorthin zu sehen. Wähle dann die richtige Antwort.',
    explanation: function () {
      return '<p>Jeden Tag wird jeder Ast um genau einen Stiel länger. Man muss also nur einem Ast von der ersten Knospe bis zu einer äußeren Knospe folgen und die Stiele zählen: Es sind 5. Die Blume ist also <b>5 Tage</b> gewachsen (Antwort A).</p>' +
        '<p>Die anderen Zahlen passen trotzdem zu dieser Blume: Jeder Ast hat 11 Knospen (6 Gabelungen mit je zwei Knospen, an der ersten Knospe beginnend, ergibt 1 + 5 + 5), ' +
        'die äußeren Knospen sind aus 16 Stielen herausgewachsen, und es gibt 32 äußere Knospen.</p>' +
        '<p><b>Informatik:</b> Nach 5 Tagen gibt es 2 × 2 × 2 × 2 × 2 = 32 äußere Knospen, nach 10 Tagen schon 1024 und nach 20 Tagen mehr als eine Million, aber die Äste sind erst 5, 10 oder 20 Stiele lang. ' +
        'Datenstrukturen, die so ausgewogen verzweigen, erlauben es, jedes von sehr vielen Daten in wenigen Schritten zu erreichen. Die Schrittzahl wächst „logarithmisch“, die Datenmenge „exponentiell“.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null; selFork = null;
      optsEl = h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Anzahl der Tage' });
      bigSvg = svg('svg', { viewBox: '0 0 440 340', class: P + 'big', role: 'group', 'aria-label': 'Die Wunderblume mit ihren Ästen. Unten sitzt die erste Knospe, oben die äußeren Knospen.' });
      msgEl = h('p', { class: P + 'msg', 'aria-live': 'polite' });
      el.replaceChildren(h('div', { class: P.slice(0, -1) },
        h('section', { 'aria-label': 'So wächst die Wunderblume' }, h('h3', null, 'So wächst die Wunderblume'), minis()),
        h('section', { 'aria-label': 'Die Wunderblume' }, h('h3', null, 'Diese Wunderblume'), h('div', { class: P + 'bigbox' }, bigSvg), msgEl),
        h('section', { 'aria-label': 'Antworten' }, h('h3', null, 'Wie viele Tage?'), optsEl)));
      buildBig();
      selectFork(null);
      bigSvg.addEventListener('click', function (e) { var n = e.target.closest('[data-n]'); if (n) selectFork(+n.getAttribute('data-n')); });
      bigSvg.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var n = e.target.closest('[data-n]'); if (!n) return;
        e.preventDefault(); selectFork(+n.getAttribute('data-n'));
      });
      optsEl.addEventListener('change', onChange);
      renderOptions();
    },
    isComplete: function () { return !!picked; },
    evaluate: function () { return { correct: picked === RIGHT, answer: picked }; },
    setAnswer: function (ans) { picked = ans || null; mode = 'check'; renderOptions(); },
    lock: function (on) { locked = on; mode = on ? (mode || 'check') : null; renderOptions(); },
    reset: function () { picked = null; mode = null; selectFork(null); renderOptions(); },
    showSolution: function () { picked = RIGHT; mode = 'solution'; locked = true; renderOptions(); }
  });
})();
