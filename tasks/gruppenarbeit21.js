/* Aufgabe Gruppenarbeit (Biber 2021; Klasse 11-13 schwer): Graph, Zwei-Färbbarkeit, einen Blitz (Kante) entfernen */
(function () {
  'use strict';
  var h = Biber.h, S = Biber.svg;
  var P = 't-gruppenarbeit21-';

  /* Personen: Mitte im Bild (viewBox 10 8 620 352), Farbe in der Ausgangslage (1 rot, 2 blau, 3 violett) */
  var PEOPLE = [
    { x: 52,  y: 145, c: 2, name: 'Person 1 (links)' },
    { x: 217, y: 100, c: 1, name: 'Person 2 (oben links)' },
    { x: 368, y: 152, c: 2, name: 'Person 3 (Mitte)' },
    { x: 512, y: 42,  c: 3, name: 'Person 4 (oben rechts)' },
    { x: 586, y: 198, c: 1, name: 'Person 5 (rechts)' },
    { x: 190, y: 213, c: 1, name: 'Person 6 (links unten)' },
    { x: 326, y: 308, c: 2, name: 'Person 7 (unten Mitte)' },
    { x: 505, y: 325, c: 3, name: 'Person 8 (unten rechts)' }
  ];
  /* Blitze = Kanten (Personennummern ab 1), wie im Heft */
  var EDGES = [[1, 2], [2, 3], [3, 4], [4, 5], [3, 5], [1, 6], [3, 6], [6, 7], [7, 8], [5, 8]];
  var RIGHT = 4;   /* Index von [3,5]: im Heft bestätigt und per Skript (alle 10 Blitze, alle 2-Färbungen) geprüft: nur dieser Blitz geht */
  var COLNAME = ['keine Gruppe', 'Gruppe 1 (rot)', 'Gruppe 2 (blau)'];
  var STATIC_NAME = ['', 'rot', 'blau', 'violett'];

  /* ---------- Graphlogik ---------- */
  function twoColoring(skip) {   /* liefert Färbung (0/1 je Person) ohne Kante skip oder null */
    var adj = PEOPLE.map(function () { return []; });
    EDGES.forEach(function (e, i) { if (i !== skip) { adj[e[0] - 1].push(e[1] - 1); adj[e[1] - 1].push(e[0] - 1); } });
    var col = PEOPLE.map(function () { return -1; });
    for (var s0 = 0; s0 < col.length; s0++) {
      if (col[s0] >= 0) continue;
      col[s0] = 0;
      var q = [s0];
      while (q.length) {
        var v = q.shift();
        for (var k = 0; k < adj[v].length; k++) {
          var w = adj[v][k];
          if (col[w] < 0) { col[w] = 1 - col[v]; q.push(w); } else if (col[w] === col[v]) return null;
        }
      }
    }
    return col;
  }
  var okEdges = EDGES.map(function (e, i) { return i; }).filter(function (i) { return twoColoring(i); });
  if (okEdges.length !== 1 || okEdges[0] !== RIGHT || twoColoring(-1)) throw new Error('gruppenarbeit21: Lösung stimmt nicht');

  /* ---------- Zeichnen ---------- */
  function person(p, cls, extra) {
    var g = S('g', { class: P + 'person ' + cls, transform: 'translate(' + p.x + ' ' + p.y + ')' });
    g.appendChild(S('circle', { class: P + 'hit', r: 30 }));
    g.appendChild(S('circle', { class: P + 'head', cx: 0, cy: -13, r: 11 }));
    g.appendChild(S('path', { class: P + 'body', d: 'M-20 18C-20 3 -10 -1 0 -1S20 3 20 18Z' }));
    if (extra) g.appendChild(extra);
    return g;
  }
  function geom(e) {
    var a = PEOPLE[e[0] - 1], b = PEOPLE[e[1] - 1];
    var dx = b.x - a.x, dy = b.y - a.y, L = Math.sqrt(dx * dx + dy * dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    var s0 = 34, len = L - 2 * s0;
    var pts = [[0, 0], [0.24, 9], [0.4, -7], [0.58, 9], [0.74, -7], [1, 0]].map(function (t) {
      var along = s0 + t[0] * len;
      return (a.x + ux * along + nx * t[1]).toFixed(1) + ',' + (a.y + uy * along + ny * t[1]).toFixed(1);
    }).join(' ');
    return { pts: pts, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, ax: a.x + ux * s0, ay: a.y + uy * s0, bx: b.x - ux * s0, by: b.y - uy * s0 };
  }
  function bolt(e, cls) {
    var g = geom(e);
    return S('g', { class: P + 'bolt ' + (cls || '') }, [
      S('polyline', { class: P + 'hitline', points: g.pts }),
      S('polyline', { class: P + 'boltout', points: g.pts }),
      S('polyline', { class: P + 'boltin', points: g.pts })
    ]);
  }
  function figure(label) {
    return S('svg', { class: P + 'svg', viewBox: '10 8 620 352', role: 'group', 'aria-label': label });
  }

  var el, api, locked, mark, removed, colors, mode;
  var staticSvg, svg, noteEl, modeBtns, legendEl;

  function drawStatic() {
    var kids = EDGES.map(function (e) { return bolt(e); });
    PEOPLE.forEach(function (p) { kids.push(person(p, P + 'g' + p.c)); });
    staticSvg.replaceChildren.apply(staticSvg, kids);
    staticSvg.setAttribute('aria-label', 'Ausgangslage: acht Personen, zehn Blitze, Einteilung in drei Gruppen. ' +
      PEOPLE.map(function (p, i) { return (i + 1) + ': ' + STATIC_NAME[p.c]; }).join(', ') + '.');
  }

  function conflicts() {
    return EDGES.map(function (e, i) { return i !== removed && colors[e[0] - 1] && colors[e[0] - 1] === colors[e[1] - 1]; });
  }

  function draw() {
    var cf = conflicts(), kids = [];
    EDGES.forEach(function (e, i) {
      var isGone = removed === i, cls = '';
      if (isGone) cls += ' gone';
      if (cf[i]) cls += ' conflict';
      var g = bolt(e, cls);
      var a = PEOPLE[e[0] - 1].name.split(' (')[0], b = PEOPLE[e[1] - 1].name.split(' (')[0];
      if (mode === 'remove') {
        g.setAttribute('role', 'button');
        g.setAttribute('tabindex', locked ? '-1' : '0');
        g.setAttribute('aria-pressed', String(isGone));
        g.setAttribute('aria-label', 'Blitz zwischen ' + a + ' und ' + b + (isGone ? ', entfernt' : '') );
        g.addEventListener('click', function () { toggleEdge(i); });
        g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggleEdge(i); } });
      } else {
        g.classList.add('inert');
        g.setAttribute('aria-hidden', 'true');
      }
      kids.push(g);
    });
    EDGES.forEach(function (e, i) {
      var g = geom(e);
      if (removed === i) {
        var m = mark === 'check' ? (i === RIGHT ? 'ok' : 'bad') : (mark === 'solution' ? 'ok' : 'sel');
        var sym = m === 'ok' ? '✓' : m === 'bad' ? '✗' : '×';
        kids.push(S('g', { class: P + 'badge ' + P + 'm-' + m, transform: 'translate(' + g.mx.toFixed(1) + ' ' + g.my.toFixed(1) + ')', 'aria-hidden': 'true' }, [
          S('circle', { r: 15 }), S('text', { y: 6, 'text-anchor': 'middle' }, sym)]));
      } else if (cf[i]) {
        kids.push(S('g', { class: P + 'badge ' + P + 'm-conf', transform: 'translate(' + g.mx.toFixed(1) + ' ' + g.my.toFixed(1) + ')', 'aria-hidden': 'true' }, [
          S('circle', { r: 13 }), S('text', { y: 6, 'text-anchor': 'middle' }, '!')]));
      }
    });
    PEOPLE.forEach(function (p, i) {
      var c = colors[i];
      var num = S('text', { class: P + 'num', x: 0, y: 36, 'text-anchor': 'middle' }, c ? String(c) : '');
      var g = person(p, P + 'g' + (c ? c : 0) + (mode === 'color' ? ' ' + P + 'active' : ' inert'), num);
      if (mode === 'color') {
        g.setAttribute('role', 'button');
        g.setAttribute('tabindex', locked ? '-1' : '0');
        g.setAttribute('aria-label', p.name + ': ' + COLNAME[c] + '. Antippen zum Wechseln.');
        g.addEventListener('click', function () { cycle(i); });
        g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); cycle(i); } });
      } else g.setAttribute('aria-hidden', 'true');
      kids.push(g);
    });
    svg.replaceChildren.apply(svg, kids);
    svg.classList.toggle('locked', !!locked);
    modeBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === mode)); b.classList.toggle('on', b.getAttribute('data-mode') === mode); });
    legendEl.hidden = mode !== 'color';
    if (removed === null) noteEl.textContent = mode === 'remove' ? 'Tippe auf den Blitz, der verschwinden soll.' : 'Tippe auf Personen, um sie probeweise in Gruppe 1 (rot) oder Gruppe 2 (blau) einzuteilen. Ein „!“ zeigt einen Blitz zwischen zwei Personen derselben Gruppe.';
    else noteEl.textContent = (mark === 'solution' ? 'Dieser Blitz ist entfernt, und die Personen sind in zwei Gruppen eingeteilt.' :
      'Entfernt: der Blitz zwischen ' + PEOPLE[EDGES[removed][0] - 1].name.split(' (')[0] + ' und ' + PEOPLE[EDGES[removed][1] - 1].name.split(' (')[0] + '.') +
      (mode === 'color' && mark !== 'solution' ? ' Ein „!“ zeigt einen Blitz zwischen zwei Personen derselben Gruppe.' : '');
  }

  function toggleEdge(i) {
    if (locked) return;
    removed = removed === i ? null : i;
    draw();
    api.changed(removed === null ? '' : 'Ein Blitz ist entfernt.');
    focusEdge(i);
  }
  function focusEdge(i) {
    var gs = svg.querySelectorAll('.' + P + 'bolt');
    if (gs[i] && mode === 'remove') gs[i].focus();
  }
  function cycle(i) {
    if (locked) return;
    colors[i] = (colors[i] + 1) % 3;
    draw();
    var gs = svg.querySelectorAll('.' + P + 'person.' + P + 'active');
    if (gs[i]) gs[i].focus();
  }
  function setMode(m) { mode = m; draw(); }

  function reset() { removed = null; colors = PEOPLE.map(function () { return 0; }); mode = 'remove'; mark = null; }

  Biber.register({
    id: 'gruppenarbeit21',
    story:
      '<p>Für ein Projekt sollst du acht Personen in Gruppen aufteilen. Ein Blitz zwischen zwei Personen zeigt: Diese beiden wollen nicht zusammenarbeiten. ' +
      'Zwischen zwei Personen derselben Gruppe darf also kein Blitz sein.</p>' +
      '<p>Damit ist eine Aufteilung in drei Gruppen möglich: rot, blau und violett (oben). Nun willst du die Personen in <strong>zwei</strong> Gruppen aufteilen. ' +
      'Das ist möglich, wenn du die richtigen beiden Personen zur Zusammenarbeit überzeugst, also den richtigen Blitz entfernst.</p>',
    question: 'Entferne den richtigen Blitz!',
    howto: 'Tippe unten auf einen Blitz, um ihn zu entfernen (noch einmal tippen bringt ihn zurück). Zum Ausprobieren kannst du auf „Personen einfärben“ wechseln und die Personen in zwei Gruppen einteilen.',
    explanation: function () {
      return '<p>Der Plan besteht aus drei Teilen: einem Viereck, einem Dreieck und einem Fünfeck aus Blitzen. Ein Viereck lässt sich mit zwei Gruppen aufteilen (abwechselnd), ein Dreieck und ein Fünfeck nicht: Weil die Zahl der Personen ungerade ist, träfen beim Abwechseln am Ende zwei Personen derselben Gruppe aufeinander.</p>' +
        '<p>Mit zwei Gruppen kommst du nur aus, wenn das Dreieck <em>und</em> das Fünfeck verschwinden. Das gelingt mit einem einzigen Blitz, nämlich dem, den beide gemeinsam haben: der Blitz zwischen der mittleren Person und der Person rechts daneben.</p>' +
        '<p>Informatik: Personen sind „Knoten“, Blitze „Kanten“ eines Graphen, die Gruppen entsprechen einer Färbung. Mit zwei Farben geht es genau dann, wenn der Graph keinen Kreis mit ungerader Länge enthält.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      staticSvg = figure('Ausgangslage');
      svg = figure('Plan zum Entfernen eines Blitzes');
      noteEl = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      modeBtns = [['remove', 'Blitz entfernen'], ['color', 'Personen einfärben (Ausprobieren)']].map(function (m) {
        return h('button', { type: 'button', class: P + 'mode', 'data-mode': m[0], 'aria-pressed': 'false', onclick: function () { setMode(m[0]); } }, m[1]);
      });
      legendEl = h('p', { class: P + 'legend', hidden: true },
        h('span', { class: P + 'sw ' + P + 'g1' }, '1'), ' Gruppe 1 (rot)  ',
        h('span', { class: P + 'sw ' + P + 'g2' }, '2'), ' Gruppe 2 (blau)  ',
        h('span', { class: P + 'sw ' + P + 'g0' }), ' noch keine Gruppe');
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { class: P + 'start', 'aria-label': 'Ausgangslage' }, h('h3', null, 'Ausgangslage: drei Gruppen'), staticSvg),
        h('section', { class: P + 'work', 'aria-label': 'Spielfeld' }, h('h3', null, 'Dein Plan: zwei Gruppen'),
          h('div', { class: P + 'modes', role: 'group', 'aria-label': 'Werkzeug' }, modeBtns),
          svg, legendEl, noteEl)));
      drawStatic();
      draw();
    },
    isComplete: function () { return removed !== null; },
    evaluate: function () {
      var ok = removed !== null && !!twoColoring(removed);
      return { correct: ok, answer: { removed: removed === null ? null : EDGES[removed] } };
    },
    setAnswer: function (ans) {
      var r = null;
      if (ans && ans.removed) EDGES.forEach(function (e, i) { if (e[0] === ans.removed[0] && e[1] === ans.removed[1]) r = i; });
      removed = r; colors = PEOPLE.map(function () { return 0; }); mode = 'remove'; mark = 'check';
      draw();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      draw();
    },
    reset: function () { reset(); draw(); },
    showSolution: function () {
      removed = RIGHT;
      var col = twoColoring(RIGHT);
      colors = col.map(function (c) { return c + 1; });
      mode = 'color'; mark = 'solution'; locked = true;
      draw();
    }
  });
})();
