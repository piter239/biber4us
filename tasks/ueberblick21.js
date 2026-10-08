/* Aufgabe Überblick (Heft 2021, S. 55; Klasse 5-6 schwer, 7-8 mittel): möglichst wenige Lichtungen besetzen, so dass alle Wege überblickt werden */
(function () {
  'use strict';
  var h = Biber.h;

  /* ---------- Aufgabendaten (Lage wie im Heft, SVG-Einheiten) ---------- */
  var W = 760, H = 470;
  var NODES = {
    om:  { x: 322, y: 88,  name: 'Lichtung oben Mitte' },
    or:  { x: 628, y: 84,  name: 'Lichtung oben rechts' },
    l:   { x: 124, y: 190, name: 'Lichtung links' },
    ul:  { x: 106, y: 410, name: 'Lichtung unten links' },
    um:  { x: 296, y: 350, name: 'Lichtung unten Mitte' },
    umr: { x: 536, y: 334, name: 'Lichtung unten rechts der Mitte' },
    ur:  { x: 692, y: 396, name: 'Lichtung ganz unten rechts' }
  };
  var ORDER = ['om', 'or', 'l', 'ul', 'um', 'umr', 'ur'];
  /* Wege: Endpunkte und seitliche Ausbuchtung (b) des Weges */
  var EDGES = [
    { a: 'om', b: 'l', bend: -14 }, { a: 'om', b: 'or', bend: 8 }, { a: 'om', b: 'um', bend: -12 }, { a: 'or', b: 'umr', bend: 16 },
    { a: 'um', b: 'umr', bend: -10 }, { a: 'umr', b: 'ur', bend: 12 }, { a: 'l', b: 'ul', bend: 12 }, { a: 'ul', b: 'um', bend: -12 }
  ];
  var MIN = 3;
  var SOLUTION = ['om', 'ul', 'umr'];

  function covered(sel, e) { return sel.indexOf(e.a) >= 0 || sel.indexOf(e.b) >= 0; }
  function uncoveredCount(sel) { return EDGES.filter(function (e) { return !covered(sel, e); }).length; }
  function isCover(sel) { return uncoveredCount(sel) === 0; }

  var NS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs, kids) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (k) { if (k) e.appendChild(k); });
    return e;
  }
  function pathD(e) {
    var p = NODES[e.a], q = NODES[e.b];
    var mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2, dx = q.x - p.x, dy = q.y - p.y, d = Math.sqrt(dx * dx + dy * dy);
    var cx = mx - dy / d * e.bend * 2, cy = my + dx / d * e.bend * 2;
    return 'M' + p.x + ' ' + p.y + ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + q.x + ' ' + q.y;
  }

  /* Büsche als Waldstruktur (feste Pseudozufallszahlen, nur Dekoration) */
  function bushes() {
    var out = [], seed = 7;
    function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    var tries = 0;
    while (out.length < 80 && tries < 2000) {
      tries++;
      var x = 30 + rnd() * (W - 60), y = 28 + rnd() * (H - 56), ok = true;
      for (var k in NODES) { var n = NODES[k]; if (Math.abs(n.x - x) < 66 && Math.abs(n.y - y) < 54) { ok = false; break; } }
      if (ok) for (var i = 0; i < EDGES.length && ok; i++) {
        var p = NODES[EDGES[i].a], q = NODES[EDGES[i].b];
        for (var t = 0; t <= 1; t += 0.05) {
          var px = p.x + (q.x - p.x) * t, py = p.y + (q.y - p.y) * t;
          if (Math.abs(px - x) < 26 && Math.abs(py - y) < 26) { ok = false; break; }
        }
      }
      if (ok) out.push([x, y, 5 + rnd() * 6]);
    }
    return out;
  }

  function helperIcon(n) {
    return s('g', { class: 't-ueberblick21-helper', transform: 'translate(' + n.x + ' ' + (n.y + 2) + ')', 'aria-hidden': 'true' }, [
      s('path', { d: 'M-17 18 Q-17 2 0 2 Q17 2 17 18 Z', class: 'bd' }),
      s('circle', { cx: 0, cy: -9, r: 10.5, class: 'hd' }),
      s('path', { d: 'M-12 -13 Q0 -26 12 -13 L12 -11 L-12 -11 Z', class: 'cap' }),
      s('circle', { cx: -4, cy: -8, r: 1.6, class: 'ey' }), s('circle', { cx: 4, cy: -8, r: 1.6, class: 'ey' })
    ]);
  }

  /* ---------- Zustand ---------- */
  var el, api, sel, locked, shown;     /* shown: null | 'check' | 'solution' */
  var svg, gNodes, gHalo, status, nodeEls;

  function build() {
    svg = s('svg', { class: 't-ueberblick21-svg', viewBox: '0 0 ' + W + ' ' + H, role: 'group', 'aria-label': 'Wald mit sieben Lichtungen und acht Wegen' });
    svg.appendChild(s('rect', { x: 4, y: 4, width: W - 8, height: H - 8, rx: 40, class: 't-ueberblick21-forest' }));
    var deco = s('g', { 'aria-hidden': 'true' }, bushes().map(function (b) { return s('circle', { cx: b[0].toFixed(1), cy: b[1].toFixed(1), r: b[2].toFixed(1), class: 't-ueberblick21-bush' }); }));
    svg.appendChild(deco);
    gHalo = s('g', { 'aria-hidden': 'true' }, EDGES.map(function (e) { return s('path', { d: pathD(e), class: 't-ueberblick21-halo' }); }));
    svg.appendChild(gHalo);
    svg.appendChild(s('g', { 'aria-hidden': 'true' }, EDGES.map(function (e) { return s('path', { d: pathD(e), class: 't-ueberblick21-edge-edge' }); })));
    svg.appendChild(s('g', { 'aria-hidden': 'true' }, EDGES.map(function (e) { return s('path', { d: pathD(e), class: 't-ueberblick21-edge' }); })));
    nodeEls = {};
    gNodes = s('g', {});
    ORDER.forEach(function (id, i) {
      var n = NODES[id];
      var g = s('g', { class: 't-ueberblick21-node', role: 'button', tabindex: i === 0 ? '0' : '-1', 'data-id': id, 'aria-pressed': 'false' }, [
        s('ellipse', { cx: n.x, cy: n.y, rx: 52, ry: 40, class: 'hit' }),
        s('ellipse', { cx: n.x, cy: n.y, rx: 44, ry: 33, class: 'clear' }),
        s('ellipse', { cx: n.x - 10, cy: n.y - 10, rx: 22, ry: 9, class: 'clear-hi' })
      ]);
      nodeEls[id] = g;
      gNodes.appendChild(g);
    });
    svg.appendChild(gNodes);
    ORDER.forEach(function (id) { nodeEls[id].appendChild(helperIcon(NODES[id])); });
    svg.addEventListener('click', onClick);
    svg.addEventListener('keydown', onKey);
  }

  function stateText() {
    var un = uncoveredCount(sel);
    return sel.length + ' Helfer' + ' · ' + (EDGES.length - un) + ' von ' + EDGES.length + ' Wegen überblickt';
  }
  function paint() {
    ORDER.forEach(function (id) {
      var on = sel.indexOf(id) >= 0, cls = 't-ueberblick21-node' + (on ? ' on' : '');
      if (locked) cls += ' locked';
      if (shown === 'check' && on) cls += isCover(sel) && sel.length === MIN ? ' right' : ' wrong';
      if (shown === 'solution' && on) cls += ' right';
      nodeEls[id].setAttribute('class', cls);
      nodeEls[id].setAttribute('aria-pressed', String(on));
      nodeEls[id].setAttribute('aria-label', NODES[id].name + (on ? ', ein Helfer ist hier' : ', leer'));
    });
    var halos = gHalo.childNodes, edges = svg.querySelectorAll('.t-ueberblick21-edge');
    EDGES.forEach(function (e, i) {
      var c = covered(sel, e);
      halos[i].setAttribute('class', 't-ueberblick21-halo' + (c ? ' on' : ''));
      edges[i].setAttribute('class', 't-ueberblick21-edge' + (c ? ' on' : ''));
    });
    status.textContent = stateText();
    status.className = 't-ueberblick21-stat' + (isCover(sel) && sel.length ? ' full' : '');
  }

  function toggle(id) {
    if (locked) return;
    var i = sel.indexOf(id);
    if (i >= 0) sel.splice(i, 1); else sel.push(id);
    paint();
    api.changed();
  }
  function onClick(e) { var g = e.target.closest('[data-id]'); if (g) toggle(g.getAttribute('data-id')); }
  function onKey(e) {
    var g = e.target.closest('[data-id]');
    if (!g) return;
    var id = g.getAttribute('data-id');
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(id); return; }
    var step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    var next = ORDER[(ORDER.indexOf(id) + step + ORDER.length) % ORDER.length];
    ORDER.forEach(function (k) { nodeEls[k].setAttribute('tabindex', k === next ? '0' : '-1'); });
    nodeEls[next].focus();
  }

  Biber.register({
    id: 'ueberblick21',
    story: '<p>Im Wald gibt es Lichtungen und Wege dazwischen. Von jeder Lichtung aus kann man die von dort ausgehenden Wege genau bis zur nächsten Lichtung überblicken. ' +
      'Eine Gruppe von Helfern soll insgesamt alle Wege überblicken können. Die Försterin will dazu möglichst wenige Lichtungen mit Helfern besetzen.</p>',
    question: 'Welche Lichtungen soll die Försterin besetzen?',
    howto: 'Tippe die Lichtungen an, auf die ein Helfer kommt (nochmal tippen nimmt ihn wieder weg). Überblickte Wege leuchten auf.',
    explanation: function () {
      var extra = '';
      if (isCover(sel) && sel.length > MIN) extra = '<p>Du überblickst zwar alle Wege, aber mit ' + sel.length + ' Helfern. Es geht mit weniger.</p>';
      else if (!isCover(sel) && sel.length) extra = '<p>Bei deiner Auswahl ' + (uncoveredCount(sel) === 1 ? 'bleibt ein Weg' : 'bleiben ' + uncoveredCount(sel) + ' Wege') + ' unüberblickt.</p>';
      return extra + '<p>Es gibt acht Wege. Zwei Lichtungen reichen nicht: Dafür müsste von einer Lichtung aus mindestens vier Wege ausgehen, aber keine Lichtung hat so viele. ' +
        'Es sind also mindestens drei nötig. Mit drei geht es nur so: Die Sackgasse unten rechts verlangt die Lichtung an ihrem linken Ende (unten, rechts der Mitte). ' +
        'Dann bleiben fünf Wege übrig, und die schaffen nur noch „oben Mitte“ und „unten links“ zusammen.</p>' +
        '<p>Die Aufgabe ist ein Beispiel für eine <b>minimale Knotenüberdeckung</b> in einem Graphen: Lichtungen sind Knoten, Wege sind Kanten. Für große Graphen ist so etwas sehr schwer zu berechnen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; sel = []; shown = null;
      build();
      status = h('p', { class: 't-ueberblick21-stat', 'aria-live': 'polite' });
      el.replaceChildren(h('div', { class: 't-ueberblick21-board' }, h('div', { class: 't-ueberblick21-map' }, svg), status));
      paint();
    },
    isComplete: function () { return sel.length > 0; },
    evaluate: function () {
      return { correct: isCover(sel) && sel.length === MIN, answer: { sel: sel.slice().sort() } };
    },
    setAnswer: function (ans) { sel = (ans && ans.sel || []).slice(); shown = 'check'; paint(); },
    lock: function (on) {
      locked = on;
      if (on) { if (shown !== 'solution') shown = 'check'; } else shown = null;
      paint();
    },
    reset: function () { sel = []; shown = null; paint(); },
    showSolution: function () { sel = SOLUTION.slice(); shown = 'solution'; locked = true; paint(); }
  });
})();
