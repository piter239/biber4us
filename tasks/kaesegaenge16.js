/* Aufgabe Käsegänge (Heft 2016, Klasse 3-4 schwer, 5-6 einfach): Programmieren, Ereignis, Mensch-Computer-Schnittstelle (GUI) */
(function () {
  'use strict';
  var h = Biber.h;
  var S = Biber.svg;

  /* Geometrie nach der Abbildung im Heft (Einheiten = Pixel der Vorlage, äußere Kanten inkl. Rand) */
  var TUBES = [[330, 465], [553, 690], [789, 925], [1005, 1140], [1243, 1379]];
  var TOP = 593, BOTTOM = 1211, EDGE = 6;
  /* Quergänge: Verbindung zwischen zwei benachbarten langen Gängen (0-basiert), y von/bis (außen) */
  var CROSS = [
    { id: 'A', a: 0, b: 1, y0: 599, y1: 677 },
    { id: 'E', a: 2, b: 3, y0: 599, y1: 677 },
    { id: 'D', a: 1, b: 2, y0: 668, y1: 745 },
    { id: 'G', a: 3, b: 4, y0: 691, y1: 769 },
    { id: 'B', a: 0, b: 1, y0: 754, y1: 831 },
    { id: 'F', a: 2, b: 3, y0: 766, y1: 845 },
    { id: 'H', a: 3, b: 4, y0: 849, y1: 927 },
    { id: 'C', a: 0, b: 1, y0: 937, y1: 1015 },
    { id: 'I', a: 3, b: 4, y0: 972, y1: 1050 },
    { id: 'J', a: 2, b: 3, y0: 1048, y1: 1127 }
  ];
  var GOAL = 4;      /* Käse am Ende des Gangs ganz rechts */
  var RIGHT = 2;     /* Gang 3 (0-basiert) */

  function cx(i) { return (TUBES[i][0] + TUBES[i][1]) / 2; }
  function cy(c) { return (c.y0 + c.y1) / 2; }

  /* Die Maus läuft abwechselnd: Gang hinunter bis zum nächsten Quergang, dann durch den Quergang */
  function walk(start) {
    var g = start, y = -Infinity, steps = [];
    for (var guard = 0; guard < 20; guard++) {
      var next = null;
      CROSS.forEach(function (c) {
        if ((c.a === g || c.b === g) && cy(c) > y && (!next || cy(c) < cy(next))) next = c;
      });
      if (!next) break;
      steps.push({ from: g, c: next, to: next.a === g ? next.b : next.a });
      g = next.a === g ? next.b : next.a;
      y = cy(next);
    }
    return { end: g, steps: steps };
  }
  function pathPoints(start) {
    var w = walk(start);
    var pts = [[cx(start), 576]];
    w.steps.forEach(function (s) {
      var yy = cy(s.c);
      pts.push([cx(s.from), yy]);
      pts.push([cx(s.to), yy]);
    });
    pts.push([cx(w.end), w.end === GOAL ? 1150 : 1170]);
    return pts;
  }

  function rect(x, y, w, hh, attrs) {
    var a = { x: x, y: y, width: w, height: hh };
    Object.keys(attrs || {}).forEach(function (k) { a[k] = attrs[k]; });
    return S('rect', a);
  }

  function innerShapes() {
    var list = [];
    TUBES.forEach(function (t) { list.push({ x: t[0] + EDGE, y: TOP + EDGE, w: t[1] - t[0] - 2 * EDGE, h: BOTTOM - TOP - 2 * EDGE, r: 30 }); });
    CROSS.forEach(function (c) {
      var x0 = TUBES[c.a][1] - 2 * EDGE, x1 = TUBES[c.b][0] + 2 * EDGE;
      list.push({ x: x0, y: c.y0 + EDGE, w: x1 - x0, h: c.y1 - c.y0 - 2 * EDGE, r: 0 });
    });
    return list;
  }

  function cheese() {
    var g = S('g', { 'aria-hidden': 'true' });
    var steam = 't-kaese16-steam';
    g.appendChild(S('path', { d: 'M1309 1078 C1305 1090 1317 1096 1312 1108 C1309 1118 1320 1120 1316 1126', class: steam }));
    g.appendChild(S('path', { d: 'M1328 1076 C1318 1086 1334 1096 1330 1106 C1326 1114 1324 1118 1325 1124', class: steam }));
    g.appendChild(S('path', { d: 'M1345 1096 C1338 1104 1346 1114 1342 1124', class: steam }));
    g.appendChild(S('polygon', {
      points: '1250,1178 1270,1169 1284,1166 1289,1157 1325,1138 1366,1142 1366,1194 1341,1194 1333,1190 1324,1194 1268,1194',
      class: 't-kaese16-cheese'
    }));
    g.appendChild(S('polyline', { points: '1270,1192 1366,1144', class: 't-kaese16-edge' }));
    g.appendChild(S('circle', { cx: 1314, cy: 1169, r: 10, class: 't-kaese16-hole' }));
    g.appendChild(S('circle', { cx: 1352, cy: 1166, r: 6, class: 't-kaese16-hole' }));
    g.appendChild(S('ellipse', { cx: 1273, cy: 1182, rx: 10, ry: 4.5, transform: 'rotate(-18 1273 1182)', class: 't-kaese16-hole' }));
    g.appendChild(S('ellipse', { cx: 1322, cy: 1146, rx: 7, ry: 3, transform: 'rotate(-18 1322 1146)', class: 't-kaese16-hole' }));
    return g;
  }

  var el, api, locked, picked, mode, noAnim;
  var svg, signs, pathLayer, statusEl;

  function buildMaze() {
    svg = S('svg', {
      viewBox: '290 470 1130 770', class: 't-kaese16-svg', role: 'radiogroup',
      'aria-label': 'Fünf lange Gänge mit Quergängen. Der Käse liegt am Ende von Gang 5. Wähle den gelben Punkt oder das Schild eines Gangs.'
    });
    var shapes = innerShapes();
    var outline = S('g', { class: 't-kaese16-outline' });
    var fill = S('g', { class: 't-kaese16-water' });
    shapes.forEach(function (s) {
      outline.appendChild(rect(s.x, s.y, s.w, s.h, { rx: s.r, ry: s.r }));
      fill.appendChild(rect(s.x, s.y, s.w, s.h, { rx: s.r, ry: s.r }));
    });
    svg.appendChild(outline);
    svg.appendChild(fill);
    /* Rand der Röhren oben (Öffnung) */
    TUBES.forEach(function (t, i) {
      svg.appendChild(S('ellipse', { cx: cx(i), cy: TOP + 10, rx: (t[1] - t[0]) / 2 - 4, ry: 13, class: 't-kaese16-rim' }));
    });
    svg.appendChild(cheese());
    pathLayer = S('g', { class: 't-kaese16-pathlayer', 'aria-hidden': 'true' });
    svg.appendChild(pathLayer);
    signs = TUBES.map(function (t, i) {
      var x = cx(i);
      var g = S('g', { class: 't-kaese16-sign', role: 'radio', tabindex: '0', 'data-i': String(i), 'aria-label': 'Gang ' + (i + 1), 'aria-checked': 'false' });
      g.appendChild(rect(x - 78, 478, 156, 150, { class: 't-kaese16-hit' }));
      g.appendChild(rect(x - 46, 488, 92, 66, { rx: 6, class: 't-kaese16-board' }));
      g.appendChild(rect(x - 6, 552, 12, 14, { class: 't-kaese16-post' }));
      var tx = S('text', { x: x, y: 541, 'text-anchor': 'middle', class: 't-kaese16-num' });
      tx.textContent = String(i + 1);
      g.appendChild(tx);
      g.appendChild(S('circle', { cx: x, cy: 578, r: 17, class: 't-kaese16-dot' }));
      svg.appendChild(g);
      return g;
    });
    svg.addEventListener('click', onClick);
    svg.addEventListener('keydown', onKey);
    return svg;
  }

  function drawPath(start, cls, animate) {
    pathLayer.replaceChildren();
    if (start === null || start === undefined) return;
    var pts = pathPoints(start);
    var d = 'M' + pts.map(function (p) { return p[0] + ' ' + p[1]; }).join(' L');
    var p = S('path', { d: d, class: 't-kaese16-route ' + cls });
    pathLayer.appendChild(p);
    var end = pts[pts.length - 1];
    var endOk = walk(start).end === GOAL;
    var badge = S('g', { class: 't-kaese16-end ' + (endOk ? 'ok' : 'bad') });
    badge.appendChild(S('circle', { cx: end[0], cy: end[1] - (endOk ? 56 : 0), r: 21 }));
    var t = S('text', { x: end[0], y: end[1] - (endOk ? 56 : 0) + 9, 'text-anchor': 'middle' });
    t.textContent = endOk ? '✓' : '✗';
    badge.appendChild(t);
    pathLayer.appendChild(badge);
    if (animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && p.getTotalLength) {
      var L = p.getTotalLength();
      badge.style.opacity = '0';
      p.style.strokeDasharray = L + ' ' + L;
      p.style.strokeDashoffset = String(L);
      p.getBoundingClientRect();
      p.style.transition = 'stroke-dashoffset ' + Math.min(2.6, 0.6 + L / 1400) + 's linear';
      p.style.strokeDashoffset = '0';
      var done = function () { badge.style.opacity = ''; };
      p.addEventListener('transitionend', done);
      setTimeout(done, 3200);
    }
  }

  function render(animate) {
    signs.forEach(function (g, i) {
      var sel = picked === i;
      g.setAttribute('aria-checked', sel ? 'true' : 'false');
      g.setAttribute('tabindex', locked ? '-1' : (sel || (picked === null && i === 0) ? '0' : '-1'));
      g.setAttribute('class', 't-kaese16-sign' + (sel ? ' selected' : '') + (locked ? ' locked' : '') +
        (mode && sel ? (i === RIGHT ? ' right' : ' wrong') : '') + (mode === 'solution' && i === RIGHT ? ' right' : ''));
    });
    if (mode === 'check' || mode === 'solution') {
      var s = mode === 'solution' ? RIGHT : picked;
      drawPath(s, s === RIGHT ? 'ok' : 'bad', animate);
    } else drawPath(null);
  }

  function choose(i, focus) {
    if (locked) return;
    picked = i;
    render();
    if (focus) signs[i].focus();
    api.changed('Gang ' + (i + 1) + ' gewählt.');
  }
  function onClick(e) {
    var g = e.target.closest('[data-i]');
    if (g && !locked) choose(+g.getAttribute('data-i'), true);
  }
  function onKey(e) {
    var g = e.target.closest ? e.target.closest('[data-i]') : null;
    if (!g || locked) return;
    var i = +g.getAttribute('data-i');
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(i, true); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); choose(Math.min(4, i + 1), true); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); choose(Math.max(0, i - 1), true); }
  }

  function endsHtml() {
    return '<ul class="t-kaese16-ends">' + [0, 1, 3, 4].map(function (i) {
      return '<li>Gang ' + (i + 1) + ' hinein: Die Maus kommt am Ende von Gang ' + (walk(i).end + 1) + ' an.</li>';
    }).join('') + '</ul>';
  }

  Biber.register({
    id: 'kaesegaenge16',
    story: '<p>Eine Maus steht oben vor fünf langen Gängen. Zwischen den langen Gängen gibt es kurze Quergänge. ' +
      'Die Maus möchte zum Käse unten am Ende vom langen Gang ganz rechts.</p>' +
      '<p>Auf ihrem Weg durch die Gänge befolgt die Maus immer abwechselnd diese Anweisungen:</p>' +
      '<ol class="t-kaese16-rules"><li>Laufe durch den langen Gang nach unten, bis ein Quergang kommt.</li><li>Laufe durch den Quergang.</li></ol>',
    question: 'In welchen langen Gang muss die Maus hineinlaufen, damit sie zum Käse kommt?',
    howto: 'Tippe auf das Schild (oder den gelben Punkt) des Gangs, in den die Maus laufen soll. Mit den Pfeiltasten kannst Du zwischen den Gängen wechseln. Nach dem Prüfen siehst Du den Weg der Maus.',
    explanation: function () {
      return '<p>Die Maus muss in <b>Gang 3</b> hineinlaufen. Sie geht in Gang 3 nach unten bis zum ersten Quergang und wechselt nach Gang 4, ' +
        'läuft dort bis zum nächsten Quergang nach Gang 5, wechselt wieder zurück nach Gang 4 (nächster Quergang), dann noch einmal nach Gang 5 und kommt dort zum Käse.</p>' +
        '<p>Bei den anderen Gängen kommt die Maus nicht zum Käse:</p>' + endsHtml() +
        '<p><b>Informatik:</b> Die Maus hat klare Anweisungen, wie sie auf bestimmte <i>Ereignisse</i> reagieren soll: ' +
        '„Wenn Du in einen langen Gang hineinkommst, laufe ihn hinunter. Wenn Du an einen Quergang kommst, laufe hindurch.“ ' +
        'Viele Computerprogramme müssen auf Ereignisse reagieren, besonders der Teil, der die Bedienung durch Menschen regelt: die Benutzeroberfläche (englisch GUI). ' +
        'Sie legt fest, was passiert, wenn mit Maus oder Finger etwas angeklickt wird oder eine Taste gedrückt wird. ' +
        'Dafür hat die Informatik das ereignisgesteuerte Programmieren entwickelt.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null; noAnim = false;
      buildMaze();
      el.replaceChildren(h('div', { class: 't-kaese16-box' },
        h('div', { class: 't-kaese16-scene' },
          h('img', { class: 't-kaese16-mouse', src: 'assets/kaesegaenge16/maus.png', alt: 'Zeichnung einer Maus, die aufrecht steht und auf die Gänge schaut', width: 300, height: 264, draggable: 'false' }),
          h('div', { class: 't-kaese16-svgwrap' }, svg))));
      render();
    },
    isComplete: function () { return picked !== null; },
    evaluate: function () { return { correct: picked === RIGHT, answer: picked + 1 }; },
    setAnswer: function (ans) {
      var n = typeof ans === 'number' ? ans - 1 : null;
      picked = n !== null && n >= 0 && n < 5 ? n : null;
      mode = 'check';
      noAnim = true;
      render(false);
    },
    lock: function (on) {
      locked = on;
      var anim = !noAnim && on && !mode;
      noAnim = false;
      mode = on ? (mode || 'check') : null;
      render(anim);
    },
    reset: function () { picked = null; mode = null; locked = false; render(); },
    showSolution: function () { picked = RIGHT; mode = 'solution'; locked = true; render(true); }
  });
})();
