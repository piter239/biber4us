/* Aufgabe Brücken bauen! (Biber 2023, Klasse 9-10 schwer, 11-13 mittel) */
(function () {
  'use strict';
  var h = Biber.h, svg = Biber.svg;
  var P = 't-bruecken23-';

  /* Inseln: Mittelpunkt/Radien der Insel, Anzahl Baumstämme, Lage der Stämme (Zeichnung im Heft, Querformat) */
  var NODES = {
    A: { logs: 3, e: [235, 365, 160, 195], lg: [282, 395], desc: 'Dorf-Insel ganz links' },
    T: { logs: 3, e: [542, 147, 97, 98], lg: [540, 130], desc: 'Insel oben links' },
    X: { logs: 4, e: [557, 390, 77, 78], lg: [556, 385], desc: 'Insel links in der Mitte' },
    B: { logs: 2, e: [546, 641, 94, 79], lg: [570, 645], desc: 'Insel unten links' },
    C: { logs: 3, e: [745, 518, 73, 71], lg: [752, 515], desc: 'Insel in der Mitte unten' },
    Y: { logs: 3, e: [815, 258, 97, 76], lg: [828, 245], desc: 'Insel oben in der Mitte' },
    D: { logs: 2, e: [997, 388, 92, 325], lg: [975, 572], desc: 'lange Insel in der Mitte' },
    G: { logs: 0, e: [1210, 266, 65, 65], lg: [1210, 266], desc: 'kleine Insel oben rechts' },
    F: { logs: 1, e: [1158, 454, 68, 66], lg: [1163, 443], desc: 'kleine Insel rechts in der Mitte' },
    Z: { logs: 3, e: [1342, 439, 70, 69], lg: [1342, 430], desc: 'Insel rechts' },
    E: { logs: 3, e: [1205, 606, 63, 66], lg: [1210, 603], desc: 'Insel rechts unten' },
    H: { logs: 0, e: [1588, 331, 137, 160], lg: [1588, 331], desc: 'Schul-Insel ganz rechts' },
    S: { logs: 3, e: [938, 785, 112, 40], lg: [980, 770], desc: 'Insel ganz unten' },
    K: { logs: 0, e: [1432, 720, 153, 108], lg: [1432, 720], desc: 'Insel unten rechts' }
  };
  /* Linien (Brücken-Bauplätze): von, nach, Kosten, Endpunkte der Linie und Lage der Zahl (Querformat) */
  var EDGES = [
    { id: 'AT', a: 'A', b: 'T', w: 3, p: [365, 268, 465, 178], t: [438, 262] },
    { id: 'AB', a: 'A', b: 'B', w: 2, p: [323, 478, 500, 645], t: [386, 594] },
    { id: 'TD', a: 'T', b: 'D', w: 4, p: [607, 153, 970, 145], t: [780, 110] },
    { id: 'TX', a: 'T', b: 'X', w: 2, p: [541, 200, 556, 326], t: [513, 275] },
    { id: 'XB', a: 'X', b: 'B', w: 3, p: [555, 437, 555, 583], t: [515, 515] },
    { id: 'XC', a: 'X', b: 'C', w: 2, p: [617, 418, 700, 482], t: [680, 413] },
    { id: 'BC', a: 'B', b: 'C', w: 2, p: [617, 607, 700, 548], t: [640, 541] },
    { id: 'BD', a: 'B', b: 'D', w: 4, p: [617, 663, 950, 645], t: [820, 614] },
    { id: 'YC', a: 'Y', b: 'C', w: 4, p: [820, 303, 772, 450], t: [822, 402] },
    { id: 'YD', a: 'Y', b: 'D', w: 1, p: [884, 273, 980, 272], t: [935, 237] },
    { id: 'DG', a: 'D', b: 'G', w: 3, p: [1032, 198, 1190, 238], t: [1127, 182] },
    { id: 'DE', a: 'D', b: 'E', w: 2, p: [1032, 587, 1162, 617], t: [1097, 643] },
    { id: 'DS', a: 'D', b: 'S', w: 2, p: [942, 683, 910, 775], t: [892, 708] },
    { id: 'SK', a: 'S', b: 'K', w: 1, p: [1042, 788, 1328, 753], t: [1173, 727] },
    { id: 'GF', a: 'G', b: 'F', w: 1, p: [1198, 298, 1190, 408], t: [1158, 352] },
    { id: 'GH', a: 'G', b: 'H', w: 2, p: [1246, 265, 1498, 262], t: [1370, 222] },
    { id: 'FZ', a: 'F', b: 'Z', w: 1, p: [1207, 455, 1290, 447], t: [1252, 408] },
    { id: 'FE', a: 'F', b: 'E', w: 1, p: [1190, 487, 1212, 548], t: [1170, 522] },
    { id: 'ZH', a: 'Z', b: 'H', w: 3, p: [1395, 432, 1498, 407], t: [1453, 463] },
    { id: 'HK', a: 'H', b: 'K', w: 3, p: [1565, 478, 1465, 636], t: [1556, 560] }
  ];
  var START = 'A', GOAL = 'H', BEST = 14;
  var SOLUTION = ['AB', 'BC', 'BD', 'DE', 'FE', 'GF', 'GH'];
  var BYID = {};
  EDGES.forEach(function (e) { BYID[e.id] = e; });

  function cost(ids) { return ids.reduce(function (s, id) { return s + BYID[id].w; }, 0); }

  /* Gibt es eine Reihenfolge, in der Bianca alle Brücken bauen kann (Randbedingung: genug Stämme)? */
  function feasible(ids) {
    var seen = {}, total = ids.length;
    function go(done, comp) {
      if (done.length === total) return comp[GOAL] === true;
      var key = done.slice().sort().join(',');
      if (seen[key]) return false;
      seen[key] = true;
      var logs = 0, spent = 0;
      Object.keys(comp).forEach(function (n) { logs += NODES[n].logs; });
      done.forEach(function (id) { spent += BYID[id].w; });
      var have = logs - spent;
      for (var i = 0; i < ids.length; i++) {
        var e = BYID[ids[i]];
        if (done.indexOf(e.id) >= 0 || e.w > have || (!comp[e.a] && !comp[e.b])) continue;
        var c2 = {};
        Object.keys(comp).forEach(function (n) { c2[n] = true; });
        c2[e.a] = c2[e.b] = true;
        if (go(done.concat(e.id), c2)) return true;
      }
      return false;
    }
    var start = {};
    start[START] = true;
    return go([], start);
  }
  function isRight(ids) { return cost(ids) === BEST && feasible(ids); }

  var el, api, wrap, mapSvg, statusEl, built, locked, mark, portrait, mql;

  function pt(x, y) { return portrait ? [y, x] : [x, y]; }
  function chosen() { return EDGES.filter(function (e) { return built[e.id]; }).map(function (e) { return e.id; }); }

  /* ---------- Zeichnung ---------- */
  function logsG(n, ax, ay) {
    var g = svg('g', { class: P + 'logs', 'aria-hidden': 'true' });
    for (var i = 0; i < n; i++) {
      var x = ax + (i - (n - 1) / 2) * 27;
      g.appendChild(svg('rect', { x: x - 11, y: ay - 28, width: 22, height: 58, rx: 7, class: P + 'log' }));
      g.appendChild(svg('ellipse', { cx: x, cy: ay - 26, rx: 11, ry: 6, class: P + 'logtop' }));
    }
    return g;
  }
  function village(cx, cy) {
    var g = svg('g', { class: P + 'village', 'aria-hidden': 'true', transform: 'translate(' + cx + ' ' + cy + ')' });
    [[-30, 8, 1], [8, -4, 1.15], [-6, 26, 0.9]].forEach(function (s) {
      g.appendChild(svg('g', { transform: 'translate(' + s[0] + ' ' + s[1] + ') scale(' + s[2] + ')' },
        svg('rect', { x: -22, y: -4, width: 44, height: 30, class: P + 'wall' }),
        svg('path', { d: 'M-28 -2L0 -26L28 -2Z', class: P + 'roof' })));
    });
    return g;
  }
  function school(cx, cy) {
    var g = svg('g', { class: P + 'school', 'aria-hidden': 'true', transform: 'translate(' + cx + ' ' + cy + ')' },
      svg('rect', { x: -78, y: -34, width: 156, height: 78, class: P + 'wall' }),
      svg('path', { d: 'M-86 -34L0 -78L86 -34Z', class: P + 'roof' }),
      svg('circle', { cx: 0, cy: -48, r: 9, class: P + 'clock' }),
      svg('path', { d: 'M-16 44V20A16 16 0 0 1 16 20V44Z', class: P + 'door' }));
    [-60, -38, 38, 60].forEach(function (x) {
      [-18, 8].forEach(function (y) { g.appendChild(svg('rect', { x: x - 8, y: y, width: 16, height: 14, class: P + 'win' })); });
    });
    return g;
  }
  function builder(cx, cy) {
    return svg('g', { class: P + 'builder', 'aria-hidden': 'true', transform: 'translate(' + cx + ' ' + cy + ')' },
      svg('rect', { x: -15, y: -2, width: 30, height: 44, rx: 8, class: P + 'body' }),
      svg('circle', { cx: 0, cy: -16, r: 14, class: P + 'head' }),
      svg('path', { d: 'M-16 -20A16 14 0 0 1 16 -20Z', class: P + 'hat' }),
      svg('path', { d: 'M-12 40V58M12 40V58', class: P + 'legs' }));
  }
  function tag(x, y, text) {
    return svg('text', { x: x, y: y, class: P + 'tag', 'text-anchor': 'middle', 'aria-hidden': 'true' }, text);
  }

  function build() {
    var vb = portrait ? '6 30 860 1780' : '30 6 1780 860';
    var s = svg('svg', {
      class: P + 'map ' + (portrait ? P + 'portrait' : P + 'land'), viewBox: vb, role: 'group',
      'aria-label': 'Inselkarte mit 14 Inseln und 20 Linien, an denen Brücken gebaut werden können. Die Zahl an einer Linie ist die Zahl der Baumstämme, die die Brücke kostet.'
    });
    var vx = portrait ? 6 : 30, vy = portrait ? 30 : 6, vw = portrait ? 860 : 1780, vh = portrait ? 1780 : 860;
    s.appendChild(svg('rect', { x: vx + 4, y: vy + 4, width: vw - 8, height: vh - 8, rx: 90, class: P + 'sea', 'aria-hidden': 'true' }));
    var isl = svg('g', { 'aria-hidden': 'true' });
    Object.keys(NODES).forEach(function (id) {
      var n = NODES[id], c = pt(n.e[0], n.e[1]), rx = portrait ? n.e[3] : n.e[2], ry = portrait ? n.e[2] : n.e[3];
      isl.appendChild(svg('ellipse', { cx: c[0], cy: c[1], rx: rx + 15, ry: ry + 15, class: P + 'sand' }));
      isl.appendChild(svg('ellipse', { cx: c[0], cy: c[1], rx: rx, ry: ry, class: P + 'grass' }));
    });
    s.appendChild(isl);
    var eg = svg('g', null);
    EDGES.forEach(function (e) {
      var a = pt(e.p[0], e.p[1]), b = pt(e.p[2], e.p[3]), t = pt(e.t[0], e.t[1]);
      var g = svg('g', {
        class: P + 'edge', 'data-edge': e.id, role: 'button', tabindex: '0', 'aria-pressed': 'false',
        'aria-label': 'Brücke von ' + NODES[e.a].desc + ' zur ' + NODES[e.b].desc + ', kostet ' + e.w + (e.w === 1 ? ' Baumstamm' : ' Baumstämme')
      },
        svg('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: P + 'hit' }),
        svg('circle', { cx: t[0], cy: t[1], r: portrait ? 34 : 36, class: P + 'hit2' }),
        svg('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: P + 'line' }),
        svg('text', { x: t[0], y: t[1] + (portrait ? 14 : 19), class: P + 'num', 'text-anchor': 'middle' }, String(e.w)));
      eg.appendChild(g);
    });
    s.appendChild(eg);
    Object.keys(NODES).forEach(function (id) {
      var n = NODES[id];
      if (n.logs) { var l = pt(n.lg[0], n.lg[1]); s.appendChild(logsG(n.logs, l[0], l[1])); }
    });
    var v = pt(165, 462), sc = pt(1590, 335), bd = pt(300, 262);
    s.appendChild(village(v[0], v[1]));
    s.appendChild(school(sc[0], sc[1]));
    s.appendChild(builder(bd[0], bd[1]));
    var t1 = pt(318, 205), t2 = pt(1590, 218);
    s.appendChild(tag(t1[0], t1[1], 'Start'));
    s.appendChild(tag(t2[0], t2[1], 'Schule'));
    return s;
  }

  function paint() {
    [].forEach.call(mapSvg.querySelectorAll('[data-edge]'), function (g) {
      var id = g.getAttribute('data-edge'), on = !!built[id];
      g.classList.toggle('on', on);
      g.classList.toggle('solution', mark === 'solution' && on);
      g.setAttribute('aria-pressed', String(on));
      g.setAttribute('tabindex', locked ? '-1' : '0');
    });
    mapSvg.classList.toggle(P + 'locked', !!locked);
    statusEl.textContent = summary();
  }
  function summary() {
    var ids = chosen();
    if (!ids.length) return 'Noch keine Brücke gebaut.';
    return 'Gebaute Brücken: ' + ids.length + ', benutzte Baumstämme: ' + cost(ids) + '.';
  }

  function toggle(id) {
    if (locked) return;
    if (built[id]) delete built[id]; else built[id] = true;
    mark = null;
    paint();
    api.changed();
  }

  function rebuild() {
    mapSvg = build();
    var old = wrap.querySelector('.' + P + 'map');
    if (old) old.replaceWith(mapSvg); else wrap.insertBefore(mapSvg, wrap.firstChild);
    mapSvg.addEventListener('click', function (e) {
      var g = e.target.closest('[data-edge]');
      if (g) toggle(g.getAttribute('data-edge'));
    });
    mapSvg.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var g = e.target.closest('[data-edge]');
      if (g) { e.preventDefault(); toggle(g.getAttribute('data-edge')); }
    });
    paint();
  }

  function setBuilt(ids) { built = {}; ids.forEach(function (id) { built[id] = true; }); }

  Biber.register({
    id: 'bruecken23',
    story: '<p>Auf der Insel ganz links sind Kinder eingezogen. Bianca soll Brücken bauen, über die die Kinder zur Schule auf der Insel ganz rechts gehen können.</p>' +
      '<p>Die Karte zeigt, wie viele Baumstämme es auf jeder Insel gibt. Diese Baumstämme kann Bianca nehmen, um an den Linien Brücken zu bauen. Die Zahl an einer Linie sagt, wie viele Baumstämme dort für eine Brücke benutzt werden. Sobald es zwischen zwei Inseln eine Brücke gibt, kann Bianca darüber gehen und Stämme, die sie noch hat, mitnehmen. Natürlich kann sie jeden Baumstamm nur für eine Brücke benutzen.</p>' +
      '<p>Bianca fängt auf der Insel links an. Ihr Ziel ist, möglichst wenige Baumstämme zu benutzen.</p>',
    question: 'An welchen Linien soll Bianca Brücken bauen, damit sie ihr Ziel erreicht?',
    howto: 'Tippe eine Linie (oder ihre Zahl) an, um dort eine Brücke zu bauen. Tippe sie noch einmal an, um die Brücke zurückzunehmen. Unter der Karte siehst du, wie viele Baumstämme du insgesamt benutzt.',
    explanation: function () {
      return '<p>Bianca nimmt auf der Dorf-Insel ihre 3 Stämme und baut mit 2 davon eine Brücke zur Insel unten links; dort liegen 2 weitere Stämme, jetzt hat sie 3 - 2 + 2 = 3. Für die 4 zur langen Insel reicht das nicht. Also baut sie mit 2 Stämmen eine Brücke zur Nachbarinsel, geht hin, nimmt dort 3 Stämme mit und kommt zurück: 3 - 2 + 3 = 4 Stämme. Damit baut sie die Brücke über die 4 zur langen Insel und nimmt deren 2 Stämme. Von dort geht es mit 2, 1, 1 und 2 Stämmen über die Inseln rechts bis zur Schule.</p>' +
        '<p>Zusammen sind das 8 + 6 = <strong>14 Baumstämme</strong>. Weniger geht nicht: Alle Wege führen über die lange Insel. Bis dorthin braucht man mindestens 8 Stämme (der kürzere Weg 3 - 4 geht nur mit Umweg und kostet 9), danach mindestens 6 (der direkte Weg 3 - 2 ist nicht zu bauen).</p>' +
        '<p>Die Karte ist ein Graph: Inseln sind Knoten, Linien sind Kanten. Hier haben sogar die Knoten Gewichte (die Stämme einer Insel). Gesucht ist ein kürzester Weg mit einer Nebenbedingung, nämlich genug Stämme zu haben. Man probiert Wege und schließt aus, was nicht klappt (Backtracking). Die Zerlegung in zwei Teile an der langen Insel spart dabei viele Möglichkeiten.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; mark = null; built = {};
      mql = window.matchMedia('(max-width: 44rem)');
      portrait = mql.matches;
      statusEl = h('p', { class: P + 'status', 'aria-live': 'polite' });
      wrap = h('div', { class: P + 'wrap' }, statusEl);
      el.replaceChildren(wrap);
      rebuild();
      var onChange = function () {
        if (!el.isConnected) { if (mql.removeEventListener) mql.removeEventListener('change', onChange); return; }
        if (mql.matches !== portrait) { portrait = mql.matches; rebuild(); }
      };
      if (mql.addEventListener) mql.addEventListener('change', onChange);
    },
    isComplete: function () { return chosen().length > 0; },
    evaluate: function () { var ids = chosen(); return { correct: isRight(ids), answer: ids }; },
    setAnswer: function (ans) { setBuilt(Array.isArray(ans) ? ans.filter(function (id) { return BYID[id]; }) : []); mark = 'check'; paint(); },
    lock: function (on) {
      locked = on;
      if (on) { if (mark !== 'solution') mark = 'check'; } else mark = null;
      paint();
    },
    reset: function () { built = {}; mark = null; paint(); api.changed(); },
    showSolution: function () { setBuilt(SOLUTION); mark = 'solution'; paint(); }
  });
})();
