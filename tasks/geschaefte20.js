/* Aufgabe Geschäfte (Biber 2020; Klasse 7-8 mittel, 9-10 einfach): minimale Kantenabdeckung in einem Graphen */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-geschaefte20-';
  var NS = 'http://www.w3.org/2000/svg';

  /* Dörfer (Knoten), Koordinaten im SVG (viewBox 0 0 360 380) */
  var V = {
    t:  { x: 180, y: 28 },
    ul: { x: 112, y: 96 },  ur: { x: 248, y: 96 },
    m:  { x: 180, y: 165 },
    ml: { x: 112, y: 233 }, mr: { x: 248, y: 233 },
    lo: { x: 43,  y: 302 }, ro: { x: 317, y: 302 },
    bl: { x: 112, y: 336 }, br: { x: 248, y: 336 }
  };
  /* Straßen (Kanten); auf jeder liegt in der Mitte ein Bauplatz */
  var E = [
    ['t', 'ul', 'oben links an der Spitze'], ['t', 'ur', 'oben rechts an der Spitze'],
    ['ul', 'ur', 'oben in der Mitte, zwischen den beiden Dörfern'],
    ['ul', 'm', 'links zwischen oberem Dreieck und Mitte'], ['ur', 'm', 'rechts zwischen oberem Dreieck und Mitte'],
    ['m', 'ml', 'links unterhalb der Mitte'], ['m', 'mr', 'rechts unterhalb der Mitte'],
    ['ml', 'lo', 'ganz links außen'], ['mr', 'ro', 'ganz rechts außen'],
    ['ml', 'bl', 'links unten, senkrecht'], ['mr', 'br', 'rechts unten, senkrecht'],
    ['bl', 'br', 'ganz unten, waagerecht']
  ];
  var NODES = Object.keys(V);
  E.forEach(function (e, i) {
    var a = V[e[0]], b = V[e[1]];
    e.x = (a.x + b.x) / 2; e.y = (a.y + b.y) / 2; e.i = i;
  });

  function covers(mask) {
    var seen = {};
    E.forEach(function (e, i) { if (mask >> i & 1) { seen[e[0]] = 1; seen[e[1]] = 1; } });
    return NODES.every(function (n) { return seen[n]; });
  }
  function bits(mask) { var c = 0; while (mask) { c += mask & 1; mask >>= 1; } return c; }
  /* alle minimalen Kantenabdeckungen per Brute Force */
  var BEST = 99, SOL = [];
  (function () {
    var m;
    for (m = 1; m < (1 << E.length); m++) if (covers(m)) BEST = Math.min(BEST, bits(m));
    for (m = 1; m < (1 << E.length); m++) if (covers(m) && bits(m) === BEST) SOL.push(m);
  })();
  /* Lösung 1 wie im Heft links: Spitze links, rechts zwischen oberem Dreieck und Mitte (ur-m) */
  var SHOW = SOL.filter(function (m) { return (m & 1) && (m >> 4 & 1); })[0] || SOL[0];

  function svg(tag, attrs, kids) {
    var n = document.createElementNS(NS, tag), k;
    for (k in attrs) if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
    (kids || []).forEach(function (c) { n.appendChild(c); });
    return n;
  }

  var el, api, sel, locked, mark, svgEl, infoEl, edgeEls, villEls;

  function reset() { sel = 0; mark = null; }
  function supplied(n) {
    return E.some(function (e, i) { return (sel >> i & 1) && (e[0] === n || e[1] === n); });
  }

  function build() {
    var lines = [], i;
    E.forEach(function (e) {
      var a = V[e[0]], b = V[e[1]];
      lines.push(svg('line', { class: P + 'road', x1: a.x, y1: a.y, x2: b.x, y2: b.y }));
    });
    villEls = {};
    var vill = NODES.map(function (n) {
      var c = svg('circle', { class: P + 'vill', cx: V[n].x, cy: V[n].y, r: 17 });
      villEls[n] = c;
      return c;
    });
    edgeEls = E.map(function (e, i) {
      var g = svg('g', {
        class: P + 'plot', role: 'checkbox', tabindex: '0', 'aria-checked': 'false',
        'aria-label': 'Bauplatz ' + (i + 1) + ' von ' + E.length + ', ' + e[2]
      }, [
        svg('rect', { class: P + 'hit', x: e.x - 19, y: e.y - 19, width: 38, height: 38, rx: 6 }),
        svg('rect', { class: P + 'sq', x: e.x - 14, y: e.y - 14, width: 28, height: 28, rx: 3 }),
        /* Ladensymbol: Dach, Wand, Tür */
        svg('g', { class: P + 'shop', transform: 'translate(' + e.x + ' ' + e.y + ')' }, [
          svg('path', { class: P + 'roof', d: 'M-11 -3 L-8 -11 H8 L11 -3 Z' }),
          svg('rect', { class: P + 'wall', x: -9, y: -3, width: 18, height: 12 }),
          svg('rect', { class: P + 'door', x: -2.5, y: 2, width: 5, height: 7 })
        ]),
        svg('text', { class: P + 'xmark', x: e.x, y: e.y + 5, 'text-anchor': 'middle' }, [])
      ]);
      g.addEventListener('click', function () { toggle(i); });
      g.addEventListener('keydown', function (ev) {
        if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); toggle(i); }
      });
      return g;
    });
    svgEl = svg('svg', {
      class: P + 'map', viewBox: '0 0 360 366', role: 'group',
      'aria-label': 'Karte mit zehn Dörfern und zwölf Straßen; auf jeder Straße liegt ein Bauplatz'
    }, lines.concat(vill, edgeEls));
  }

  function toggle(i) {
    if (locked) return;
    sel ^= 1 << i;
    mark = null;
    refresh();
    api.changed();
  }

  function refresh() {
    var n = bits(sel), open = 0;
    edgeEls.forEach(function (g, i) {
      var on = !!(sel >> i & 1);
      g.setAttribute('aria-checked', String(on));
      g.setAttribute('class', P + 'plot' + (on ? ' on' : '') + (mark === 'solution' && on ? ' good' : ''));
      g.style.cursor = locked ? 'default' : 'pointer';
    });
    NODES.forEach(function (v) {
      var ok = supplied(v);
      if (!ok) open++;
      villEls[v].setAttribute('class', P + 'vill' + (ok ? ' ok' : ''));
    });
    var msg = n + (n === 1 ? ' Geschäft' : ' Geschäfte') + ' gebaut. ' +
      (open ? open + (open === 1 ? ' Dorf hat' : ' Dörfer haben') + ' noch kein Geschäft in Reichweite (blass gezeichnet).' : 'Alle Dörfer sind versorgt.');
    infoEl.textContent = msg;
    infoEl.classList.toggle('done', open === 0);
    el.classList.toggle(P + 'checked', mark === 'check');
    if (mark === 'check') {
      var cls = SOL.indexOf(sel) >= 0 ? 'right' : 'wrong';
      infoEl.classList.add(cls);
      infoEl.classList.remove(cls === 'right' ? 'wrong' : 'right');
    } else infoEl.classList.remove('right', 'wrong');
  }

  Biber.register({
    id: 'geschaefte20',
    story:
      '<p>Eine Landgemeinde will die Versorgung ihrer Dörfer verbessern und dazu Geschäfte bauen. Die Karte zeigt die Dörfer als grüne Punkte. An den Straßen zwischen den Dörfern (Linien) liegen Bauplätze für Geschäfte (Quadrate).</p>' +
      '<p>Von jedem Dorf aus soll man ein Geschäft erreichen können, ohne durch ein anderes Dorf zu fahren. Diese Bedingung muss mit so wenig Geschäften wie möglich erfüllt werden.</p>',
    question: 'Auf welchen Bauplätzen müssen Geschäfte gebaut werden?',
    howto: 'Tippe auf einen Bauplatz (Quadrat), um dort ein Geschäft zu bauen. Tippe noch einmal, um es wieder wegzunehmen. Dörfer ohne Geschäft in Reichweite sind blass.',
    explanation: function () {
      return '<p>Ein Geschäft auf einer Straße versorgt höchstens die zwei Dörfer an ihren Enden. Bei zehn Dörfern braucht man deshalb mindestens fünf Geschäfte, und mit genau fünf muss jedes Dorf von genau einem Geschäft versorgt werden.</p>' +
        '<p>Die beiden äußeren Dörfer haben nur eine Straße, also stehen dort Geschäfte; dann bleiben die beiden unteren Dörfer, die nur noch miteinander verbunden sind (ein Geschäft dazwischen). Die vier oberen Dörfer lassen sich auf genau zwei Arten mit zwei Geschäften versorgen: Spitze links und rechts unten im Dreieck, oder Spitze rechts und links unten im Dreieck. Beide Lösungen sind richtig.</p>' +
        '<p>Die Karte ist ein <strong>Graph</strong> (Dörfer sind Knoten, Straßen sind Kanten). Gesucht ist eine <strong>minimale Kantenabdeckung</strong>: möglichst wenige Kanten, sodass jeder Knoten an einer davon liegt.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      build();
      infoEl = h('p', { class: P + 'info', role: 'status', 'aria-live': 'polite' });
      var wrap = h('div', { class: P + 'board' }, h('div', { class: P + 'mapbox' }), infoEl);
      wrap.firstChild.appendChild(svgEl);
      el.replaceChildren(wrap);
      refresh();
    },
    isComplete: function () { return sel !== 0; },
    evaluate: function () {
      var picked = [];
      E.forEach(function (e, i) { if (sel >> i & 1) picked.push(i); });
      return { correct: SOL.indexOf(sel) >= 0, answer: { plots: picked } };
    },
    setAnswer: function (ans) {
      sel = 0;
      ((ans && ans.plots) || []).forEach(function (i) { if (i >= 0 && i < E.length) sel |= 1 << i; });
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      refresh();
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () { sel = SHOW; mark = 'solution'; locked = true; refresh(); }
  });
})();
