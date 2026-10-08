/* Aufgabe Entdecke Seoul! (Klasse 7-8, schwer): beste Busroute mit 10 km Fahrkarte */
(function () {
  'use strict';
  var h = Biber.h;
  var NS = 'http://www.w3.org/2000/svg';

  /* Koordinaten: Einheiten der Heftseite (Rand abgezogen); img = Bildgröße in Pixeln, bottom = Unterkante der grünen Fläche */
  var OX = 146, OY = 296, VW = 780, VH = 440, LIMIT = 10;
  var NODES = {
    pal:   { name: 'Palast (Start)', stars: 0, img: 'c', w: 289, h: 220, cx: 228, bottom: 577 },
    haus:  { name: 'Haus mit grünem Dach', stars: 3, img: 'a', w: 289, h: 219, cx: 383, bottom: 428 },
    markt: { name: 'Marktstand mit Sonnenschirm', stars: 5, img: 'b', w: 361, h: 278, cx: 689, bottom: 437 },
    gelb:  { name: 'gelbes Gebäude', stars: 2, img: 'd', w: 289, h: 214, cx: 522, bottom: 578 },
    turm:  { name: 'Turm', stars: 5, img: 'e', w: 327, h: 364, cx: 837, bottom: 598 },
    grau:  { name: 'graues Gebäude mit blauer Kuppel', stars: 1, img: 'f', w: 289, h: 248, cx: 385, bottom: 727 },
    tor:   { name: 'Stadttor', stars: 4, img: 'g', w: 302, h: 257, cx: 688, bottom: 727 }
  };
  var SCALE = 1 / (0.6 * 450 / 130);          /* Bildpixel -> Einheiten */
  /* Verbindungen: a, b, km, Endpunkte der Linie und Mitte des Kilometerschilds (Heftkoordinaten) */
  var EDGES = [
    { a: 'haus',  b: 'markt', km: 6, p: [460, 383, 596, 383], l: [530, 368] },
    { a: 'pal',   b: 'haus',  km: 2, p: [285, 502, 362, 432], l: [288, 446] },
    { a: 'pal',   b: 'gelb',  km: 3, p: [300, 532, 450, 530], l: [378, 514] },
    { a: 'markt', b: 'turm',  km: 1, p: [727, 438, 797, 512], l: [703, 472] },
    { a: 'gelb',  b: 'turm',  km: 6, p: [598, 545, 757, 541], l: [668, 526] },
    { a: 'pal',   b: 'grau',  km: 4, p: [248, 578, 320, 658], l: [243, 630] },
    { a: 'gelb',  b: 'tor',   km: 4, p: [547, 578, 626, 655], l: [540, 622] },
    { a: 'turm',  b: 'tor',   km: 3, p: [800, 595, 745, 648], l: [808, 627] },
    { a: 'grau',  b: 'tor',   km: 2, p: [455, 684, 614, 685], l: [530, 698] }
  ];
  EDGES.forEach(function (e) { e.id = e.a + '-' + e.b; });
  var BYID = {};
  EDGES.forEach(function (e) { BYID[e.id] = e; });

  /* ---------- Auswertung ---------- */
  /* Gültige Fahrt: ausgewählte Verbindungen bilden einen einfachen Weg, der am Palast beginnt. */
  function analyse(ids) {
    var deg = {}, adj = {}, km = 0;
    ids.forEach(function (id) {
      var e = BYID[id];
      km += e.km;
      deg[e.a] = (deg[e.a] || 0) + 1; deg[e.b] = (deg[e.b] || 0) + 1;
      (adj[e.a] = adj[e.a] || []).push(e.b); (adj[e.b] = adj[e.b] || []).push(e.a);
    });
    var nodes = Object.keys(deg), stars = 0, order = [];
    var path = ids.length > 0 && deg.pal === 1 && nodes.length === ids.length + 1 &&
      nodes.every(function (n) { return deg[n] <= 2; });
    if (path) {                                  /* zusammenhängend? */
      var cur = 'pal', prev = null;
      order = ['pal'];
      for (;;) {
        var nxt = (adj[cur] || []).filter(function (n) { return n !== prev; })[0];
        if (!nxt) break;
        order.push(nxt); prev = cur; cur = nxt;
      }
      path = order.length === nodes.length;
    }
    nodes.forEach(function (n) { stars += NODES[n].stars; });
    return { km: km, stars: stars, path: path, order: order };
  }

  /* Tiefensuche über alle Fahrten ab dem Palast (nur der Skript-Beweis: es gibt genau eine beste Fahrt) */
  var BEST = (function () {
    var best = { stars: -1, sets: [] };
    function dfs(n, seen, used, km) {
      var ids = used.slice().sort();
      var st = 0; Object.keys(seen).forEach(function (k) { st += NODES[k].stars; });
      if (st > best.stars) { best.stars = st; best.sets = []; }
      if (st === best.stars && ids.length) best.sets.push({ ids: ids, order: Object.keys(seen), km: km });
      EDGES.forEach(function (e) {
        var m = e.a === n ? e.b : e.b === n ? e.a : null;
        if (!m || seen[m] || km + e.km > LIMIT) return;
        seen[m] = true; used.push(e.id);
        dfs(m, seen, used, km + e.km);
        used.pop(); delete seen[m];
      });
    }
    dfs('pal', { pal: true }, [], 0);
    return best;
  })();
  var BEST_KEYS = BEST.sets.map(function (s) { return s.ids.join('|'); });
  var SOL = BEST.sets[0].ids;

  /* ---------- Zeichnung ---------- */
  var el, api, svg, status, sel, locked, mode;      /* mode: null | 'check' | 'solution' */

  function s(tag, attrs, kids) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (c) { n.appendChild(c); });
    return n;
  }
  function X(x) { return x - OX; }
  function Y(y) { return y - OY; }

  function kmText(n) { return n + ' km'; }
  function starText(n) { return n + (n === 1 ? ' Stern' : ' Sterne'); }

  function edgeState(e) {
    var on = sel.indexOf(e.id) >= 0;
    if (!mode) return on ? 'on' : '';
    var inSol = SOL.indexOf(e.id) >= 0;
    if (on) return inSol || isAccepted() ? 'right' : 'wrong';
    return inSol ? 'missing' : '';
  }
  function isAccepted() { return BEST_KEYS.indexOf(sel.slice().sort().join('|')) >= 0; }

  function draw() {
    var ana = analyse(sel);
    var visited = {};
    sel.forEach(function (id) { visited[BYID[id].a] = true; visited[BYID[id].b] = true; });
    svg.replaceChildren();
    svg.appendChild(s('title', {}, []));
    svg.lastChild.textContent = 'Karte von Seoul mit sieben Sehenswürdigkeiten und neun Busverbindungen';

    /* Linien */
    EDGES.forEach(function (e) {
      var st = edgeState(e), on = sel.indexOf(e.id) >= 0;
      var g = s('g', {
        class: 'so-edge' + (st ? ' ' + st : ''), 'data-edge': e.id, role: 'button', tabindex: locked ? '-1' : '0',
        'aria-pressed': String(on),
        'aria-label': 'Verbindung ' + NODES[e.a].name + ' bis ' + NODES[e.b].name + ', ' + kmText(e.km) + ': ' +
          (on ? 'ausgewählt' : 'nicht ausgewählt') +
          (st === 'right' ? ', richtig' : st === 'wrong' ? ', falsch' : st === 'missing' ? ', hier hätte Lotte fahren müssen' : '')
      });
      g.appendChild(s('line', { class: 'so-hit', x1: X(e.p[0]), y1: Y(e.p[1]), x2: X(e.p[2]), y2: Y(e.p[3]) }));
      g.appendChild(s('line', { class: 'so-line', x1: X(e.p[0]), y1: Y(e.p[1]), x2: X(e.p[2]), y2: Y(e.p[3]) }));
      var lx = X(e.l[0]), ly = Y(e.l[1]);
      g.appendChild(s('rect', { class: 'so-tag', x: lx - 46, y: ly - 22, width: 92, height: 44, rx: 22 }));
      var t = s('text', { class: 'so-km', x: lx, y: ly + 1, 'text-anchor': 'middle', 'dominant-baseline': 'central' });
      t.textContent = kmText(e.km);
      g.appendChild(t);
      svg.appendChild(g);
    });

    /* Sehenswürdigkeiten */
    Object.keys(NODES).forEach(function (k) {
      var n = NODES[k], w = n.w * SCALE, hh = n.h * SCALE;
      var g = s('g', { class: 'so-node' + (visited[k] || k === 'pal' && sel.length ? ' visited' : '') });
      var cy = Y(n.bottom) - 40;
      g.appendChild(s('ellipse', { class: 'so-halo', cx: X(n.cx), cy: cy, rx: 79, ry: 49 }));
      g.appendChild(s('image', {
        href: 'assets/seoul/' + n.img + '.png', x: X(n.cx) - w / 2, y: Y(n.bottom) - hh, width: w, height: hh,
        role: 'img', 'aria-label': n.name + (k === 'pal' ? '' : ', ' + starText(n.stars))
      }));
      svg.appendChild(g);
    });

    /* Startmarke */
    var sx = X(196), sy = Y(452);
    var st = s('g', { class: 'so-start', 'aria-hidden': 'true' });
    st.appendChild(s('rect', { x: sx - 38, y: sy - 17, width: 76, height: 34, rx: 17 }));
    var tx = s('text', { x: sx, y: sy + 1, 'text-anchor': 'middle', 'dominant-baseline': 'central' });
    tx.textContent = 'Start';
    st.appendChild(tx);
    svg.appendChild(st);

    updateStatus(ana);
  }

  function summary(ana) {
    if (!sel.length) return 'Noch keine Verbindung gewählt.';
    var t = 'Strecke: ' + kmText(ana.km) + ' von ' + LIMIT + ' km · Sterne: ' + ana.stars;
    if (ana.km > LIMIT) t += ' · Die Fahrkarte reicht nicht!';
    else if (!ana.path) t += ' · Das ist noch keine Fahrt vom Palast aus.';
    return t;
  }
  function updateStatus(ana) {
    var over = ana.km > LIMIT, bad = sel.length && !ana.path;
    status.textContent = summary(ana);
    status.className = 'so-status' + (over ? ' over' : bad ? ' warn' : '');
  }

  function toggle(id) {
    if (locked) return;
    var p = sel.indexOf(id);
    if (p >= 0) sel.splice(p, 1); else sel.push(id);
    draw();
    api.changed(summary(analyse(sel)));
  }

  function onClick(e) {
    var t = e.target.closest && e.target.closest('[data-edge]');
    if (t && el.contains(t)) toggle(t.getAttribute('data-edge'));
  }
  function onKey(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var t = e.target.closest && e.target.closest('[data-edge]');
    if (!t) return;
    e.preventDefault();
    var id = t.getAttribute('data-edge');
    toggle(id);
    var again = svg.querySelector('[data-edge="' + id + '"]');
    if (again && !locked) again.focus();
  }

  var STORY =
    '<p>In Seoul in Korea gibt es Busse für Touristen, die Sehenswürdigkeiten miteinander verbinden. Das Bild zeigt die wichtigsten Sehenswürdigkeiten. ' +
    'Die Sterne sagen, wie beliebt die Sehenswürdigkeiten sind. Die Linien zeigen die Busverbindungen. An jeder Linie steht, wie viele Kilometer die Verbindung lang ist.</p>' +
    '<p>Lotte besucht zuerst den Palast. Von dort aus möchte sie mit den Bussen weitere Sehenswürdigkeiten besuchen. Lotte hat eine Fahrkarte, mit der sie höchstens ' +
    '10 Kilometer weit fahren kann. Damit möchte sie über die Verbindungen Sehenswürdigkeiten erreichen, die insgesamt möglichst viele Sterne haben! ' +
    'Sie besucht eine Sehenswürdigkeit natürlich nur einmal und muss nicht zum Palast zurück.</p>';

  Biber.register({
    id: 'seoul',
    story: STORY,
    question: 'Welche Verbindungen muss Lotte mit ihrer Fahrkarte fahren, um möglichst viele Sterne zu sammeln?',
    howto: 'Tippe die Linien (die Kilometer-Schilder) an, die Lotte fährt. Noch einmal tippen nimmt eine Verbindung wieder weg. Unter der Karte siehst du, wie weit und wie viele Sterne es sind.',
    explanation: function () {
      return '<p>Man muss die möglichen Fahrten ab dem Palast systematisch durchprobieren: eine Verbindung wählen, von dort weitersuchen, und bei Sackgassen oder wenn die 10 km überschritten werden, zurückgehen und die nächste Möglichkeit prüfen. Das ist eine <strong>Tiefensuche</strong> mit Zurückgehen.</p>' +
        '<p>Die beste Fahrt führt vom Palast über das graue Gebäude (4 km), das Stadttor (2 km) und den Turm (3 km) zum Marktstand (1 km). Das sind genau 10 km und <strong>' + (1 + 4 + 5 + 5) + ' Sterne</strong> (1 + 4 + 5 + 5). ' +
        'Andere Fahrten sind schlechter: Über das Haus zum Marktstand und zum Turm (2 + 6 + 1 = 9 km) bringt nur 13 Sterne, über das gelbe Gebäude (3 + 6 + 1 km) nur 12.</p>' +
        '<p>Immer die nächstgelegene Station zu wählen, führt hier nicht zum Ziel: Der kurze Weg zum Haus (2 km) verbraucht schon früh viel von der Fahrkarte.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; sel = []; locked = false; mode = null;
      svg = s('svg', {
        class: 'so-map', viewBox: '0 0 ' + VW + ' ' + VH, role: 'group',
        'aria-label': 'Karte mit Sehenswürdigkeiten und Busverbindungen. Verbindungen sind Schaltflächen.', focusable: 'false'
      });
      status = h('p', { class: 'so-status', 'aria-live': 'polite' });
      svg.addEventListener('click', onClick);
      svg.addEventListener('keydown', onKey);
      el.replaceChildren(h('div', { class: 't-seoul' }, h('div', { class: 'so-board' }, svg), status));
      draw();
    },
    isComplete: function () { return sel.length > 0; },
    evaluate: function () {
      var ana = analyse(sel);
      var ok = ana.path && ana.km <= LIMIT && isAccepted();
      return { correct: !!ok, answer: sel.slice().sort() };
    },
    setAnswer: function (ans) {
      sel = (ans || []).filter(function (id) { return BYID[id]; });
      mode = null;
      draw();
    },
    lock: function (on) {
      locked = !!on;
      el.classList.toggle('so-locked', locked);
      mode = locked ? (mode || 'check') : null;
      draw();
    },
    reset: function () { sel = []; locked = false; mode = null; el.classList.remove('so-locked'); draw(); },
    showSolution: function () { sel = SOL.slice(); locked = true; mode = 'solution'; el.classList.add('so-locked'); draw(); }
  });
})();
