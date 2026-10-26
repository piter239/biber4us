/* Aufgabe Kreiselstadt (Heft 2017, S. 32): Wegbeschreibung als Zahlenfolge durch ein Netz aus Kreisverkehren folgen */
(function () {
  'use strict';
  var h = Biber.h, sv = Biber.svg;

  /* ---------- Stadtplan (Koordinaten im SVG) ---------- */
  var NODES = {
    s: [175, 615], n1: [450, 100], n2: [690, 210], n3: [975, 155], n4: [320, 300], n5: [665, 385], n6: [890, 440],
    n7: [475, 455], n8: [410, 660], n9: [735, 610], n10: [1025, 715], n11: [580, 830]
  };
  /* Zufahrten A bis D: Endpunkt außerhalb der Stadt und der zugehörige Kreisverkehr */
  var GATES = {
    A: { node: 's', p: [10, 740], lab: [-28, 800] },
    B: { node: 'n10', p: [1165, 600], lab: [1222, 578] },
    C: { node: 'n3', p: [1165, 155], lab: [1228, 166] },
    D: { node: 'n4', p: [160, 235], lab: [92, 236] }
  };
  var ROADS = [
    ['s', 'n4'], ['s', 'n7'], ['s', 'n8'], ['s', 'n11'], ['n4', 'n7'], ['n4', 'n1'], ['n1', 'n2'], ['n1', 'n5'],
    ['n2', 'n3'], ['n2', 'n5'], ['n3', 'n6'], ['n5', 'n6'], ['n5', 'n7'], ['n5', 'n9'], ['n5', 'n8'], ['n6', 'n9'],
    ['n6', 'n10'], ['n9', 'n10'], ['n9', 'n11'], ['n10', 'n11'], ['n8', 'n11']
  ];
  var RO = 54, RI = 33, RR = 44;      /* Außenradius, Insel, Fahrspur (für die Linie der Wegbeschreibung) */
  var TWO_PI = Math.PI * 2;

  var SEQ = [3, 1, 3, 2, 3];
  var EXAMPLE = [4, 1, 2];
  var OPTIONS = ['A', 'B', 'C', 'D'];

  /* Nachbarn je Kreisverkehr (Straßen und Zufahrten) */
  var NB = {};
  Object.keys(NODES).forEach(function (k) { NB[k] = []; });
  ROADS.forEach(function (r) { NB[r[0]].push(r[1]); NB[r[1]].push(r[0]); });
  Object.keys(GATES).forEach(function (g) { NB[GATES[g].node].push(g); });

  function pos(k) { return NODES[k] || GATES[k].p; }
  function angle(n, k) {            /* mathematischer Winkel (y nach oben) von n zu k */
    var a = pos(n), b = pos(k);
    return Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
  }
  /* Ausfahrten im Kreisverkehr n bei Einfahrt aus 'from': gegen den Uhrzeigersinn, die Rückkehr zur Einfahrt ist die letzte */
  function exits(n, from) {
    var a0 = angle(n, from);
    return NB[n].slice().sort(function (p, q) {
      var dp = ((angle(n, p) - a0) % TWO_PI + TWO_PI) % TWO_PI || TWO_PI;
      var dq = ((angle(n, q) - a0) % TWO_PI + TWO_PI) % TWO_PI || TWO_PI;
      return dp - dq;
    });
  }
  /* Fährt die Wegbeschreibung von A aus ab. Ergebnis: Schritte, Ziel (Zufahrt A-D oder Kreisverkehr, an dem die Beschreibung endet) */
  function drive(seq) {
    var from = 'A', cur = 's', steps = [], dest = null;
    for (var i = 0; i < seq.length; i++) {
      var ex = exits(cur, from);
      var out = ex[seq[i] - 1];
      if (!out) break;
      if (GATES[out]) { steps.push({ node: cur, from: from, out: out }); dest = out; break; }
      steps.push({ node: cur, from: from, out: out });
      from = cur; cur = out;
    }
    if (!dest) { dest = cur; steps.push({ node: cur, from: from, out: null }); }
    return { steps: steps, dest: dest };
  }
  var SOL = drive(SEQ);
  var CORRECT = SOL.dest;               /* 'B' */
  var EX = drive(EXAMPLE);

  /* ---------- Zeichnen ---------- */
  var VB = '-80 30 1350 880';
  function f(n) { return Math.round(n * 10) / 10; }
  function ringPt(n, a, r) { var c = NODES[n]; return [c[0] + r * Math.cos(a), c[1] - r * Math.sin(a)]; }
  function P(p) { return f(p[0]) + ' ' + f(p[1]); }

  function routePath(rt) {
    var d = '', st = rt.steps;
    st.forEach(function (s, i) {
      var inA = angle(s.node, s.from);
      var p0 = ringPt(s.node, inA, RR);
      if (i === 0) d += 'M' + P(pos(s.from)) + ' L' + P(p0);
      else d += ' L' + P(p0);
      if (s.out) {
        var outA = angle(s.node, s.out);
        var delta = ((outA - inA) % TWO_PI + TWO_PI) % TWO_PI || TWO_PI;
        var p1 = ringPt(s.node, outA, RR);
        if (delta >= TWO_PI - 1e-9) {          /* volle Runde: in zwei Halbbögen */
          var pm = ringPt(s.node, inA + Math.PI, RR);
          d += ' A' + RR + ' ' + RR + ' 0 0 0 ' + P(pm) + ' A' + RR + ' ' + RR + ' 0 0 0 ' + P(p1);
        } else d += ' A' + RR + ' ' + RR + ' 0 ' + (delta > Math.PI ? 1 : 0) + ' 0 ' + P(p1);
        if (GATES[s.out]) d += ' L' + P(pos(s.out));
      }
    });
    return d;
  }

  function arrowIcon(c) {
    /* Kreispfeil gegen den Uhrzeigersinn in der Mitte der Insel */
    var r = 15, a0 = -0.35, a1 = 4.35;     /* Bogenmaß, mathematisch */
    var p0 = [c[0] + r * Math.cos(a0), c[1] - r * Math.sin(a0)];
    var p1 = [c[0] + r * Math.cos(a1), c[1] - r * Math.sin(a1)];
    var tx = -Math.sin(a1), ty = -Math.cos(a1);        /* Fahrtrichtung in Bildschirmkoordinaten */
    var nx = -ty, ny = tx;
    var tip = [p1[0] + tx * 9, p1[1] + ty * 9];
    var l = [p1[0] + nx * 6, p1[1] + ny * 6], rr = [p1[0] - nx * 6, p1[1] - ny * 6];
    return [
      sv('path', { d: 'M' + P(p0) + ' A' + r + ' ' + r + ' 0 1 0 ' + P(p1), class: 't-kreiselstadt17-arc' }),
      sv('path', { d: 'M' + P(l) + ' L' + P(tip) + ' L' + P(rr) + ' Z', class: 't-kreiselstadt17-head' })
    ];
  }

  function buildMap(opts) {
    opts = opts || {};
    var roads = sv('g', { class: 't-kreiselstadt17-roads' });
    var dRoads = '';
    ROADS.forEach(function (r) { dRoads += 'M' + P(NODES[r[0]]) + ' L' + P(NODES[r[1]]) + ' '; });
    Object.keys(GATES).forEach(function (g) { dRoads += 'M' + P(NODES[GATES[g].node]) + ' L' + P(GATES[g].p) + ' '; });
    roads.appendChild(sv('path', { d: dRoads, class: 't-kreiselstadt17-road-out' }));
    roads.appendChild(sv('path', { d: dRoads, class: 't-kreiselstadt17-road-in' }));
    var svg = sv('svg', { viewBox: VB, class: 't-kreiselstadt17-svg', role: 'img', 'aria-label': opts.label || 'Stadtplan von Kreiselstadt mit zwölf Kreisverkehren und den vier Zufahrten A, B, C und D' });
    svg.appendChild(roads);
    var nodeEls = {};
    Object.keys(NODES).forEach(function (k) {
      var c = NODES[k];
      var g = sv('g', { class: 't-kreiselstadt17-node', 'data-node': k });
      g.appendChild(sv('circle', { cx: c[0], cy: c[1], r: RO, class: 't-kreiselstadt17-ring' }));
      g.appendChild(sv('circle', { cx: c[0], cy: c[1], r: RI, class: 't-kreiselstadt17-isle' }));
      arrowIcon(c).forEach(function (e) { g.appendChild(e); });
      svg.appendChild(g);
      nodeEls[k] = g;
    });
    if (opts.example) svg.appendChild(sv('path', { d: routePath(EX), class: 't-kreiselstadt17-route ex' }));
    if (opts.solution) svg.appendChild(sv('path', { d: routePath(SOL), class: 't-kreiselstadt17-route sol' }));
    Object.keys(GATES).forEach(function (g) {
      var t = sv('text', { x: GATES[g].lab[0], y: GATES[g].lab[1], class: 't-kreiselstadt17-gate' }, g);
      svg.appendChild(t);
    });
    return { svg: svg, nodes: nodeEls };
  }

  /* ---------- Modul ---------- */
  var el, api, locked, choice, map, wrap, optsEl, marks;

  function renderOpts(markResult) {
    optsEl.replaceChildren.apply(optsEl, OPTIONS.map(function (o) {
      var cls = 't-kreiselstadt17-opt' + (choice === o ? ' sel' : '');
      var mark = null;
      if (markResult === 'check') {
        if (o === CORRECT) { cls += ' right'; mark = h('span', { class: 't-kreiselstadt17-mark', 'aria-hidden': 'true' }, '✓'); }
        else if (choice === o) { cls += ' wrong'; mark = h('span', { class: 't-kreiselstadt17-mark', 'aria-hidden': 'true' }, '✗'); }
      }
      return h('button', {
        type: 'button', class: cls, 'aria-pressed': String(choice === o), 'data-opt': o, disabled: locked,
        onclick: function () { if (locked) return; choice = o; renderOpts(); api.changed(); }
      }, h('b', null, o + ')'), h('span', null, 'Sie führt zu ' + o + '.'), mark);
    }));
  }

  function toggleMark(k) {
    if (locked) return;
    marks[k] = !marks[k];
    paintMarks();
  }
  function paintMarks() {
    Object.keys(map.nodes).forEach(function (k) {
      var g = map.nodes[k], on = !!marks[k];
      g.classList.toggle('marked', on);
      g.setAttribute('aria-pressed', String(on));
    });
  }
  function drawSolution(on) {
    var old = map.svg.querySelector('.t-kreiselstadt17-route.sol');
    if (old) old.remove();
    var ex = map.svg.querySelector('.t-kreiselstadt17-route.ex');
    if (ex) ex.style.display = on ? 'none' : '';
    if (on) {
      var p = sv('path', { d: routePath(SOL), class: 't-kreiselstadt17-route sol' });
      var gates = map.svg.querySelectorAll('.t-kreiselstadt17-gate');
      map.svg.insertBefore(p, gates[0]);
    }
  }

  function pass(seq) {
    return seq.join(' ');
  }

  Biber.register({
    id: 'kreiselstadt17',
    story:
      '<p>In Kreiselstadt gibt es nur Kreisverkehre und sonst keine anderen Kreuzungen. An vier Stellen A, B, C und D kann man in die Stadt hineinfahren. Unten siehst Du einen Plan.</p>' +
      '<p>Wenn die Kreiselstädter einen Weg beschreiben, sagen sie zum Beispiel:<br>Beim nächsten Kreisverkehr nimm die 4. Ausfahrt.<br>Beim dann folgenden Kreisverkehr nimm die 1. Ausfahrt.<br>Beim dann folgenden Kreisverkehr nimm die 2. Ausfahrt.</p>' +
      '<p>Einem einheimischen Fahrer sagen sie stattdessen nur kurz die Wegbeschreibung „4 1 2“. Von A aus führt diese Wegbeschreibung zu einem Kreisverkehr in der Stadtmitte (grün eingezeichnet).</p>',
    question: 'Wohin führt die Wegbeschreibung „' + pass(SEQ) + '“ von A aus?',
    howto: 'Die Pfeile zeigen die Fahrtrichtung im Kreisverkehr. Wähle unten eine Antwort. Zum Merken kannst Du Kreisverkehre auf dem Plan antippen und so markieren.',
    explanation: function () {
      var m = buildMap({ solution: true, label: 'Stadtplan mit dem Weg von A nach B' });
      var wrapEl = h('div', { class: 't-kreiselstadt17-expmap' });
      wrapEl.appendChild(m.svg);
      return '<p>Die Wegbeschreibung „3 1 3 2 3“ führt von A aus nach <b>B</b>: Man nimmt nacheinander die 3., 1., 3., 2. und 3. Ausfahrt, die man im jeweiligen Kreisverkehr gegen den Uhrzeigersinn zählt. Der Weg ist im Plan eingezeichnet.</p>' +
        wrapEl.outerHTML +
        '<p>Dass das so gut klappt, liegt am gleichförmigen Aufbau des Stadtplans: Alle Kreuzungen sind Kreisverkehre. Informatikerinnen und Informatiker nennen so etwas eine homogene Struktur. Dann reicht eine Folge von Zahlen als Befehle (eine Sequenz), die ein Computer leicht Schritt für Schritt abarbeiten kann.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; choice = null; marks = {};
      map = buildMap({ example: true });
      wrap = h('div', { class: 't-kreiselstadt17-map' }, map.svg);
      optsEl = h('div', { class: 't-kreiselstadt17-opts', role: 'group', 'aria-label': 'Antworten' });
      el.replaceChildren(h('div', { class: 't-kreiselstadt17-board' }, wrap, optsEl));
      Object.keys(map.nodes).forEach(function (k, i) {
        var g = map.nodes[k];
        g.setAttribute('role', 'button');
        g.setAttribute('tabindex', '0');
        g.setAttribute('aria-pressed', 'false');
        g.setAttribute('aria-label', 'Kreisverkehr ' + (i + 1) + ' markieren');
        g.addEventListener('click', function () { toggleMark(k); });
        g.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMark(k); }
        });
      });
      renderOpts();
    },
    isComplete: function () { return !!choice; },
    evaluate: function () { return { correct: choice === CORRECT, answer: choice }; },
    setAnswer: function (ans) {
      choice = OPTIONS.indexOf(ans) >= 0 ? ans : null;
      renderOpts('check');
    },
    lock: function (on) {
      locked = on;
      el.classList.toggle('t-kreiselstadt17-locked', on);
      renderOpts(on && choice ? 'check' : null);
    },
    reset: function () {
      choice = null; marks = {};
      paintMarks(); drawSolution(false);
      renderOpts();
    },
    showSolution: function () {
      choice = CORRECT;
      drawSolution(true);
      renderOpts('check');
    }
  });
})();
