/* Aufgabe Wanderungen (Heft 2023, Klasse 7-8 schwer, 9-10 mittel, 11-13 einfach): Zählen, Zerlegen (Divide and Conquer) */
(function () {
  'use strict';
  var h = Biber.h;
  /* Biber.svg ohne verschachtelte Arrays: Kinder flach übergeben */
  function svg(tag, attrs) {
    var kids = [];
    (function add(list) { list.forEach(function (c) { if (Array.isArray(c)) add(c); else if (c != null) kids.push(c); }); })([].slice.call(arguments, 2));
    return Biber.svg.apply(null, [tag, attrs].concat(kids));
  }

  var SOLUTION = 6;
  /* Abschnitte 0..6 liegen zwischen Start und Ziel; die gestrichelten Linien sind Orte 1..6.
     Übernachten kann man nur in den Häusern A bis E. */
  var HOUSES = [
    { id: 'A', at: 1 }, { id: 'B', at: 2 }, { id: 'C', at: 4 }, { id: 'D', at: 5 }, { id: 'E', at: 6 }
  ];
  var END = 7;           /* Ort des Ziels (Bus), Start ist 0 */
  var MAXDAY = 2;        /* höchstens zwei Abschnitte pro Tag */
  var HIKE1 = ['B', 'C', 'D'], HIKE2 = ['A', 'B', 'C', 'E'];
  var X0 = 50, DX = 78;
  function px(u) { return X0 + DX * u; }
  var GROUND = [[0.35, 238], [1, 198], [1.5, 214], [2, 176], [2.5, 198], [3, 150], [3.5, 192], [4, 216], [4.5, 202], [5, 172], [5.5, 198], [6, 138], [6.5, 202], [6.75, 238]];
  function ground(u) {
    for (var i = 1; i < GROUND.length; i++) {
      if (u <= GROUND[i][0]) {
        var a = GROUND[i - 1], b = GROUND[i], t = (u - a[0]) / (b[0] - a[0]);
        return a[1] + (b[1] - a[1]) * t;
      }
    }
    return GROUND[GROUND.length - 1][1];
  }
  function houseAt(id) { return HOUSES.filter(function (x) { return x.id === id; })[0]; }
  function placeName(u) { return u === 0 ? 'Start' : u === END ? 'Ziel' : HOUSES.filter(function (x) { return x.at === u; })[0].id; }

  /* alle gültigen Mengen von Übernachtungsorten (Brute Force über alle 2^5 Möglichkeiten) */
  function stops(sel) { return [0].concat(HOUSES.filter(function (x) { return sel[x.id]; }).map(function (x) { return x.at; }), [END]); }
  function valid(sel) { var p = stops(sel); return p.every(function (u, i) { return !i || u - p[i - 1] <= MAXDAY; }); }
  function allValid() {
    var out = [];
    for (var m = 0; m < 32; m++) {
      var sel = {};
      HOUSES.forEach(function (x, i) { sel[x.id] = !!(m & (1 << i)); });
      if (valid(sel)) out.push(HOUSES.filter(function (x) { return sel[x.id]; }).map(function (x) { return x.id; }));
    }
    return out;
  }
  function eqSet(ids, ref) { return ids.length === ref.length && ref.every(function (r) { return ids.indexOf(r) >= 0; }); }

  var el, api, locked, mark, sel;
  var mapSvg, planG, statusEl, chips, input, inputWrap;

  function selIds() { return HOUSES.filter(function (x) { return sel[x.id]; }).map(function (x) { return x.id; }); }
  function value() { return input ? input.value.replace(/\D/g, '') : ''; }

  /* ---------- Zeichnung ---------- */
  function arrow(y, u1, u2, cls) {
    return svg('path', { class: 't-wanderungen23-arr ' + (cls || ''), d: 'M' + (px(u1) + 8) + ' ' + y + 'H' + (px(u2) - 10), 'marker-end': 'url(#t-wanderungen23-m' + (cls === 'bad' ? 'b' : cls === 'plan' ? 'p' : 'g') + ')' });
  }
  function hikeRow(y, label, ids) {
    var pts = [0].concat(ids.map(function (i) { return houseAt(i).at; }), [END]);
    var g = svg('g', { 'aria-hidden': 'true' }, svg('text', { class: 't-wanderungen23-rl', x: 12, y: y + 5 }, label));
    for (var i = 1; i < pts.length; i++) g.appendChild(arrow(y, pts[i - 1], pts[i], 'given'));
    return g;
  }
  function houseSvg(hs) {
    var u = hs.at, x = px(u), y = ground(u);
    var g = svg('g', { class: 't-wanderungen23-house', 'data-h': hs.id, role: 'button', tabindex: '0', 'aria-pressed': 'false', 'aria-label': 'Haus ' + hs.id + ', Übernachtung: nein' },
      svg('rect', { class: 't-wanderungen23-hit', x: x - 24, y: y - 52, width: 48, height: 56 }),
      svg('rect', { class: 't-wanderungen23-hbody', x: x - 15, y: y - 30, width: 30, height: 26, rx: 2 }),
      svg('path', { class: 't-wanderungen23-roof', d: 'M' + (x - 20) + ' ' + (y - 29) + 'L' + x + ' ' + (y - 47) + 'L' + (x + 20) + ' ' + (y - 29) + 'Z' }),
      svg('text', { class: 't-wanderungen23-hl', x: x, y: y - 11, 'text-anchor': 'middle' }, hs.id));
    return g;
  }
  function buildMap() {
    var gpath = 'M' + px(0.35) + ' 246';
    GROUND.forEach(function (p) { gpath += 'L' + px(p[0]).toFixed(1) + ' ' + p[1]; });
    gpath += 'L' + px(6.75) + ' 246Z';
    var lines = svg('g', { 'aria-hidden': 'true' });
    for (var i = 1; i <= 6; i++) lines.appendChild(svg('line', { class: 't-wanderungen23-sep', x1: px(i), y1: 8, x2: px(i), y2: 250 }));
    planG = svg('g', { class: 't-wanderungen23-plan', 'aria-hidden': 'true' });
    var defs = svg('defs', null,
      ['g', 'p', 'b'].map(function (k) {
        return svg('marker', { id: 't-wanderungen23-m' + k, viewBox: '0 0 10 10', refX: '8', refY: '5', markerWidth: '8', markerHeight: '8', orient: 'auto', markerUnits: 'userSpaceOnUse' },
          svg('path', { class: 't-wanderungen23-head ' + k, d: 'M1 1L9 5L1 9' }));
      }));
    var bus = svg('g', { class: 't-wanderungen23-bus', 'aria-hidden': 'true', transform: 'translate(' + (px(7) - 28) + ' 196)' },
      svg('rect', { class: 't-wanderungen23-busb', x: 0, y: 0, width: 92, height: 38, rx: 8 }),
      [8, 30, 52].map(function (x) { return svg('rect', { class: 't-wanderungen23-busw', x: x, y: 7, width: 16, height: 11, rx: 2 }); }),
      svg('rect', { class: 't-wanderungen23-busw', x: 74, y: 7, width: 12, height: 11, rx: 2 }),
      svg('circle', { class: 't-wanderungen23-wh', cx: 22, cy: 40, r: 8 }), svg('circle', { class: 't-wanderungen23-wh', cx: 70, cy: 40, r: 8 }));
    var sign = svg('g', { class: 't-wanderungen23-sign', 'aria-hidden': 'true' },
      svg('rect', { class: 't-wanderungen23-pole', x: px(0) - 14, y: 178, width: 5, height: 70 }),
      svg('path', { class: 't-wanderungen23-signb', d: 'M' + (px(0) - 12) + ' 172H' + (px(0) + 20) + 'L' + (px(0) + 32) + ' 184L' + (px(0) + 20) + ' 196H' + (px(0) - 12) + 'Z' }),
      svg('rect', { class: 't-wanderungen23-busw', x: px(0) - 6, y: 177, width: 20, height: 14, rx: 2, style: 'fill: var(--ink)' }));
    var s = svg('svg', { class: 't-wanderungen23-map', viewBox: '0 0 700 262', role: 'group',
      'aria-label': 'Karte der Region: Start links, Ziel rechts, sechs gestrichelte Linien teilen sie in sieben Abschnitte. Die Häuser A bis E sind mögliche Übernachtungsorte. Wanderung 1 übernachtet in B, C und D, Wanderung 2 in A, B, C und E.' },
      defs,
      svg('rect', { class: 't-wanderungen23-road', x: 14, y: 236, width: 672, height: 20, rx: 10 }),
      svg('path', { class: 't-wanderungen23-hills', d: gpath }),
      lines, sign, bus,
      hikeRow(30, '1', HIKE1), hikeRow(58, '2', HIKE2), planG,
      HOUSES.map(houseSvg));
    return s;
  }

  function updatePlan() {
    planG.replaceChildren();
    var ids = selIds();
    var pts = stops(sel);
    if (ids.length) planG.appendChild(svg('text', { class: 't-wanderungen23-rl plan', x: 12, y: 91 }, 'Du'));
    for (var i = 1; ids.length && i < pts.length; i++) {
      var bad = pts[i] - pts[i - 1] > MAXDAY;
      planG.appendChild(arrow(86, pts[i - 1], pts[i], bad ? 'bad' : 'plan'));
    }
    [].forEach.call(mapSvg.querySelectorAll('.t-wanderungen23-house'), function (g) {
      var id = g.getAttribute('data-h'), on = !!sel[id];
      g.classList.toggle('on', on);
      g.setAttribute('aria-pressed', on ? 'true' : 'false');
      g.setAttribute('aria-label', 'Haus ' + id + ', Übernachtung: ' + (on ? 'ja' : 'nein'));
    });
    chips.forEach(function (c) {
      var on = !!sel[c.getAttribute('data-h')];
      c.classList.toggle('on', on);
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var msg;
    if (!ids.length) {
      msg = 'Tippe die Häuser an, in denen Mia übernachtet. Dann zeigt dir eine Linie unter den Wanderungen 1 und 2, ob der Plan geht.';
    } else if (valid(sel)) {
      msg = 'Übernachtung in ' + ids.join(', ') + ' (' + (stops(sel).length - 1) + ' Tage): Jeder Tag hat höchstens 2 Abschnitte. Das geht.';
      if (eqSet(ids, HIKE1)) msg += ' Das ist Wanderung 1.';
      else if (eqSet(ids, HIKE2)) msg += ' Das ist Wanderung 2.';
    } else {
      var k = 1;
      while (pts[k] - pts[k - 1] <= MAXDAY) k++;
      msg = 'Von ' + placeName(pts[k - 1]) + ' bis ' + placeName(pts[k]) + ' sind es ' + (pts[k] - pts[k - 1]) + ' Abschnitte. Das ist zu weit für einen Tag.';
    }
    statusEl.textContent = msg;
  }

  function toggle(id) {
    if (locked) return;
    sel[id] = !sel[id];
    updatePlan();
  }

  function paint() {
    inputWrap.className = 't-wanderungen23-field' + (mark === 'right' ? ' right' : mark === 'wrong' ? ' wrong' : '');
    input.disabled = !!locked;
  }

  function build() {
    mapSvg = buildMap();
    statusEl = h('p', { class: 't-wanderungen23-status', 'aria-live': 'polite' });
    chips = HOUSES.map(function (x) {
      return h('button', { type: 'button', class: 't-wanderungen23-chip', 'data-h': x.id, 'aria-pressed': 'false', 'aria-label': 'Übernachtung in Haus ' + x.id, onclick: function () { toggle(x.id); } }, x.id);
    });
    var clear = h('button', { type: 'button', class: 't-wanderungen23-btn', onclick: function () { sel = {}; updatePlan(); } }, 'Plan löschen');
    mapSvg.addEventListener('click', function (e) {
      var g = e.target.closest('[data-h]');
      if (g) toggle(g.getAttribute('data-h'));
    });
    mapSvg.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var g = e.target.closest('[data-h]');
      if (!g) return;
      e.preventDefault();
      toggle(g.getAttribute('data-h'));
    });
    input = h('input', {
      class: 't-wanderungen23-input', type: 'text', inputmode: 'numeric', pattern: '[0-9]*', maxlength: '2', autocomplete: 'off',
      'aria-label': 'Anzahl der verschiedenen Wanderungen', oninput: function () {
        var v = input.value.replace(/\D/g, '');
        if (v !== input.value) input.value = v;
        mark = null; paint(); api.changed();
      }
    });
    inputWrap = h('label', { class: 't-wanderungen23-field' }, input, h('span', null, 'Wanderungen'));
    el.replaceChildren(h('div', { class: 't-wanderungen23-board' },
      h('div', { class: 't-wanderungen23-mapwrap' }, mapSvg),
      h('section', { class: 't-wanderungen23-try', 'aria-label': 'Wanderung ausprobieren' },
        h('h3', null, 'Ausprobieren: Wo übernachtet Mia?'),
        h('div', { class: 't-wanderungen23-chips', role: 'group', 'aria-label': 'Übernachtungsorte' }, chips, clear),
        statusEl),
      h('div', { class: 't-wanderungen23-answer' }, h('span', { class: 't-wanderungen23-q' }, 'Mia kann'), inputWrap, h('span', { class: 't-wanderungen23-q' }, 'machen.'))));
    updatePlan();
    paint();
  }

  function resetAll() { sel = {}; mark = null; if (input) input.value = ''; }

  Biber.register({
    id: 'wanderungen23',
    story: '<p>Mia mag Wanderurlaube, bei denen sie jede Nacht an einem anderen Ort übernachtet. Für ihren nächsten Urlaub hat Mia eine Karte der Region (siehe Bild). Die Karte zeigt Mias Startpunkt (Schild links), ihr Ziel (Bus rechts) und alle Orte, an denen sie übernachten kann (Häuser).</p>' +
      '<p>Mia hat die Region mit gestrichelten Linien in Abschnitte eingeteilt. Sie kann immer nur einen oder zwei Abschnitte an einem Tag wandern. Zwei verschiedene Wanderungen, die sie machen kann, hat sie bereits in die Karte eingetragen. Wanderung 1 hat 3 Übernachtungsorte, Wanderung 2 hat 4 Übernachtungsorte.</p>',
    question: 'Wie viele verschiedene Wanderungen kann Mia insgesamt machen? Zähle die Wanderungen 1 und 2 mit.',
    howto: 'Zum Ausprobieren tippst du die Häuser (auf der Karte oder in der Leiste darunter) an: Dort übernachtet Mia. Unter der Karte siehst du, ob jeder Tag höchstens zwei Abschnitte lang ist. Die Anzahl aller Wanderungen tippst du unten als Zahl ein.',
    explanation: function () {
      var list = allValid();
      return '<div class="t-wanderungen23-expl"><p>Zwischen den Häusern <strong>B</strong> und <strong>C</strong> liegen zwei Abschnitte, dazwischen gibt es kein Haus. Diese Strecke ist an einem Tag zu schaffen, aber nicht mehr. ' +
        'Also muss Mia in B und in C übernachten. So zerfällt die Aufgabe in drei unabhängige Teile:</p>' +
        '<ul><li>Start bis B (2 Abschnitte): 2 Möglichkeiten, in einem Stück oder mit Übernachtung in A.</li>' +
        '<li>B bis C: genau 1 Möglichkeit.</li>' +
        '<li>C bis Ziel (3 Abschnitte): 3 Möglichkeiten (1+1+1, 1+2 oder 2+1), also mit Übernachtung in D und E, nur in E oder nur in D.</li></ul>' +
        '<p>Zusammen: 2 · 1 · 3 = <strong>6 Wanderungen</strong>:</p>' +
        '<ol class="t-wanderungen23-list">' + list.map(function (ids) { return '<li>Start → ' + ids.concat(['Ziel']).join(' → ') + '</li>'; }).join('') + '</ol>' +
        '<p>Diese Technik heißt <em>Problemzerlegung</em> (Divide and Conquer): Statt alle Wege auf einmal zu zählen, zählt man die Teile einzeln und multipliziert. Auch die dynamische Programmierung baut darauf auf.</p></div>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; resetAll();
      el.classList.add('t-wanderungen23');
      build();
    },
    isComplete: function () { return value() !== ''; },
    evaluate: function () {
      var n = parseInt(value(), 10);
      return { correct: n === SOLUTION, answer: { n: n } };
    },
    setAnswer: function (ans) {
      input.value = ans && typeof ans.n === 'number' && isFinite(ans.n) ? String(ans.n) : '';
      mark = parseInt(value(), 10) === SOLUTION ? 'right' : 'wrong';
      paint();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (parseInt(value(), 10) === SOLUTION ? 'right' : 'wrong') : null;
      paint();
    },
    reset: function () { locked = false; resetAll(); updatePlan(); paint(); },
    showSolution: function () { locked = true; mark = 'right'; input.value = String(SOLUTION); paint(); }
  });
})();
