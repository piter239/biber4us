/* Aufgabe Zum Theater! (Klasse 9-13): früheste Ankunft mit Bussen und Umsteigen (dynamische Programmierung) */
(function () {
  'use strict';
  var h = Biber.h;

  /* ---------- Aufgabendaten (Koordinaten im SVG der Karte) ---------- */
  var LINES = {
    gelb: { name: 'gelbe', col: 'var(--c2)', iv: 3, from: 'A' },
    gruen: { name: 'grüne', col: 'var(--c6)', iv: 2, from: 'B' },
    blau: { name: 'blaue', col: 'var(--c4)', iv: 4, from: 'C' },
    rosa: { name: 'rosa', col: 'var(--c1)', iv: 5, from: 'D' }
  };
  var STOPS = {
    A: { x: 197, y: 258 }, B: { x: 432, y: 258 }, C: { x: 983, y: 258 }, D: { x: 1241, y: 258 },
    E: { x: 875, y: 525 }, F: { x: 1140, y: 575 }, G: { x: 592, y: 652 }, H: { x: 870, y: 807 },
    I: { x: 522, y: 978 }, J: { x: 1220, y: 957 }
  };
  var NAMES = 'ABCDEFGHIJ'.split('');
  /* Streckenabschnitte je Linie in Fahrtrichtung: l = Linie, a -> b, m = Minuten, (lx, ly) = Lage der Zahl */
  var EDGES = [
    { l: 'gelb', a: 'A', b: 'B', m: 1, lx: 315, ly: 312, d: 'M197 258 L432 258' },
    { l: 'gelb', a: 'B', b: 'E', m: 4, lx: 628, ly: 448, d: 'M432 258 C 560 300, 720 400, 875 525' },
    { l: 'gelb', a: 'E', b: 'F', m: 3, lx: 1020, ly: 520, d: 'M875 525 C 960 560, 1040 585, 1140 575' },
    { l: 'gruen', a: 'B', b: 'G', m: 7, lx: 368, ly: 472, d: 'M432 258 C 340 380, 290 450, 330 520 C 380 590, 480 610, 592 652' },
    { l: 'gruen', a: 'G', b: 'H', m: 3, lx: 718, ly: 742, d: 'M592 652 C 700 680, 830 670, 868 760 L 870 807' },
    { l: 'gruen', a: 'H', b: 'I', m: 2, lx: 672, ly: 886, d: 'M870 807 C 820 900, 700 955, 522 978' },
    { l: 'blau', a: 'C', b: 'E', m: 2, lx: 910, ly: 385, d: 'M983 258 C 985 380, 950 450, 875 525' },
    { l: 'blau', a: 'E', b: 'G', m: 1, lx: 718, ly: 552, d: 'M875 525 C 780 600, 700 625, 592 652' },
    { l: 'blau', a: 'G', b: 'I', m: 8, lx: 238, ly: 750, d: 'M592 652 C 400 680, 270 760, 280 830 C 290 910, 400 960, 522 978' },
    { l: 'blau', a: 'I', b: 'J', m: 6, lx: 860, ly: 940, d: 'M522 978 C 700 1000, 1000 990, 1220 957' },
    { l: 'rosa', a: 'D', b: 'F', m: 1, lx: 1165, ly: 410, d: 'M1241 258 C 1235 400, 1190 500, 1140 575' },
    { l: 'rosa', a: 'F', b: 'H', m: 5, lx: 972, ly: 658, d: 'M1140 575 C 1080 660, 950 700, 870 807' },
    { l: 'rosa', a: 'H', b: 'J', m: 9, lx: 1068, ly: 872, d: 'M870 807 C 950 880, 1100 930, 1220 957' }
  ];
  /* Streckenverlängerungen hinter der letzten benannten Haltestelle (ohne weitere Haltestelle) */
  var TAILS = [
    { l: 'gelb', d: 'M1140 575 L1300 580' },
    { l: 'gruen', d: 'M522 978 L152 985' },
    { l: 'blau', d: 'M1220 957 C 1260 952, 1300 945, 1340 935' },
    { l: 'rosa', d: 'M1220 957 C 1270 965, 1310 970, 1352 972' }
  ];
  var START = 'A', GOAL = 'J';
  var VB = { x: 60, y: 20, w: 1420, h: 1030 };

  /* Fahrplan: pro Linie die Haltestellen in Fahrtrichtung mit Minuten seit der Abfahrt an der Starthaltestelle */
  var SCHED = {};
  Object.keys(LINES).forEach(function (l) {
    var st = [LINES[l].from], off = [0], t = 0;
    EDGES.forEach(function (e) { if (e.l === l) { t += e.m; st.push(e.b); off.push(t); } });
    SCHED[l] = { stops: st, off: off, iv: LINES[l].iv };
  });

  /* Früheste Ankunft an jeder Haltestelle (Dijkstra / dynamische Programmierung über die Haltestellen) */
  var PLAN = (function () {
    var arr = {}, prev = {}, done = {}, s;
    arr[START] = 0;
    for (;;) {
      s = null;
      Object.keys(arr).forEach(function (k) { if (!done[k] && (s === null || arr[k] < arr[s])) s = k; });
      if (s === null) break;
      done[s] = true;
      Object.keys(SCHED).forEach(function (l) {
        var L = SCHED[l], i = L.stops.indexOf(s);
        if (i < 0) return;
        var k = Math.max(0, Math.ceil((arr[s] - L.off[i]) / L.iv));
        for (var j = i + 1; j < L.stops.length; j++) {
          var t = k * L.iv + L.off[j], b = L.stops[j];
          if (arr[b] === undefined || t < arr[b]) {
            arr[b] = t;
            prev[b] = { from: s, to: b, line: l, k: k, dep: k * L.iv + L.off[i], arr: t };
          }
        }
      });
    }
    var legs = [], cur = GOAL;
    while (cur !== START) { legs.unshift(prev[cur]); cur = prev[cur].from; }
    var route = [START], used = {};
    legs.forEach(function (g) {
      var L = SCHED[g.line], i = L.stops.indexOf(g.from), j = L.stops.indexOf(g.to);
      for (var q = i + 1; q <= j; q++) route.push(L.stops[q]);
      for (var e = i; e < j; e++) used[L.stops[e] + L.stops[e + 1]] = true;
    });
    return { arr: arr, legs: legs, route: route, used: used };
  })();
  var CORRECT = PLAN.route.slice().sort();
  var INNER = CORRECT.filter(function (s) { return s !== START && s !== GOAL; });

  function isRight(sel) {
    var s = sel.slice().sort().join('');
    return s === CORRECT.join('') || s === INNER.join('');
  }

  /* ---------- Zeichnen (SVG als Text) ---------- */
  function pct(v, o, size) { return ((v - o) / size * 100).toFixed(3) + '%'; }

  function busPair(x, y, iv) {
    var bus = function (cx) {
      return '<g transform="translate(' + cx + ' ' + (y + 20) + ')"><rect x="-24" y="0" width="48" height="60" rx="9" class="th-ink"/>' +
        '<rect x="-18" y="7" width="36" height="22" rx="4" class="th-sf"/><circle cx="-12" cy="44" r="5" class="th-sf"/><circle cx="12" cy="44" r="5" class="th-sf"/></g>';
    };
    return '<g aria-hidden="true"><text x="' + x + '" y="' + (y - 10) + '" class="th-iv" text-anchor="middle">' + iv + '</text>' +
      '<path d="M' + (x - 14) + ' ' + (y + 12) + ' H' + (x + 14) + ' M' + (x - 14) + ' ' + (y + 12) + ' l7 -6 M' + (x - 14) + ' ' + (y + 12) + ' l7 6 M' + (x + 14) + ' ' + (y + 12) + ' l-7 -6 M' + (x + 14) + ' ' + (y + 12) + ' l-7 6" class="th-arr"/>' +
      bus(x - 34) + bus(x + 34) + '</g>';
  }
  function houseG() {
    return '<path d="M-46 4 L0 -42 L46 4 Z" class="th-ink"/><rect x="-32" y="2" width="64" height="42" class="th-ink"/><rect x="-8" y="18" width="16" height="26" class="th-sf"/>';
  }
  function masksG() {
    var shield = 'M-40 -46 Q0 -58 40 -46 L40 -6 Q40 44 0 56 Q-40 44 -40 -6 Z';
    var happy = '<path d="' + shield + '" class="th-ink"/><path d="M-26 -20 Q-17 -32 -8 -20 M8 -20 Q17 -32 26 -20 M-20 10 Q0 36 20 10" class="th-face"/>';
    var sad = '<path d="' + shield + '" class="th-ink"/><path d="M-26 -24 Q-17 -14 -8 -24 M8 -24 Q17 -14 26 -24 M-20 32 Q0 8 20 32" class="th-face"/>';
    return '<g transform="translate(-34 12) rotate(-14) scale(0.9)">' + happy + '</g><g transform="translate(34 -8) rotate(12) scale(0.9)" class="th-back">' + sad + '</g>';
  }
  function mapSvg() {
    var s = '';
    s += '<rect x="100" y="37" width="1365" height="308" rx="44" class="th-panel"/>';
    TAILS.forEach(function (t) { s += '<path d="' + t.d + '" class="th-ln th-' + t.l + '"/>'; });
    s += '<g class="th-halos"></g>';
    ['blau', 'gruen', 'rosa', 'gelb'].forEach(function (l) {
      EDGES.forEach(function (e) { if (e.l === l) s += '<path d="' + e.d + '" class="th-ln th-' + l + '"/>'; });
    });
    EDGES.forEach(function (e) {
      s += '<text x="' + e.lx + '" y="' + e.ly + '" class="th-min th-t-' + e.l + '" text-anchor="middle" dominant-baseline="central">' + e.m + '</text>';
    });
    Object.keys(LINES).forEach(function (l) { s += busPair(STOPS[LINES[l].from].x, 92, LINES[l].iv); });
    s += '<g transform="translate(106 334)" aria-hidden="true">' + houseG() + '</g>';
    s += '<g transform="translate(1292 846)" aria-hidden="true">' + masksG() + '</g>';
    return '<svg viewBox="' + VB.x + ' ' + VB.y + ' ' + VB.w + ' ' + VB.h + '" class="th-svg" aria-hidden="true" focusable="false">' + s + '</svg>';
  }
  function icon(inner, vb, w, hh, label) {
    return '<svg class="th-ic" viewBox="' + vb + '" width="' + w + '" height="' + hh + '" role="img" aria-label="' + label + '" focusable="false">' + inner + '</svg>';
  }
  function iconBus() { return icon(busPair(0, 24, '').replace(/<text[^>]*><\/text>/, ''), '-66 26 132 82', 34, 21, 'zwei Busse mit Doppelpfeil'); }
  function iconHouse() { return icon('<g transform="translate(0 44)">' + houseG() + '</g>', '-60 0 120 100', 24, 20, 'Haus'); }
  function iconMasks() { return icon('<g transform="translate(0 56)">' + masksG() + '</g>', '-90 0 180 120', 28, 19, 'Theatermasken'); }

  /* ---------- Zustand und Anzeige ---------- */
  var el, api, sel, locked, showRoute, nodes, halos, live;

  function describe(id) {
    return 'Haltestelle ' + id + (id === START ? ' (Start, Marcus wohnt hier)' : id === GOAL ? ' (Theater)' : '');
  }
  function mark(id) {
    if (!locked) return '';
    var on = sel.indexOf(id) >= 0, inRoute = CORRECT.indexOf(id) >= 0;
    if (on) return inRoute ? 'right' : 'wrong';
    return inRoute && !isRight(sel) ? 'missing' : '';
  }
  function render() {
    NAMES.forEach(function (id) {
      var b = nodes[id], on = sel.indexOf(id) >= 0, m = mark(id);
      b.className = 'th-node' + (on ? ' on' : '') + (m ? ' ' + m : '') + ('ABCD'.indexOf(id) >= 0 ? ' th-st-' + id : '');
      b.setAttribute('aria-pressed', String(on));
      b.disabled = !!locked;
      b.setAttribute('aria-label', describe(id) + ': ' + (on ? 'ausgewählt' : 'nicht ausgewählt') +
        (m === 'right' ? ', liegt auf der Route' : m === 'wrong' ? ', liegt nicht auf der Route' : m === 'missing' ? ', gehört zur Route' : ''));
    });
    var hs = '';
    if (showRoute) {
      EDGES.forEach(function (e) { if (PLAN.used[e.a + e.b]) hs += '<path d="' + e.d + '" class="th-halo"/>'; });
    }
    halos.innerHTML = hs;
    live.textContent = sel.length ? 'Ausgewählt: ' + sel.slice().sort().join(', ') : 'Noch keine Haltestelle ausgewählt.';
  }
  function toggle(id) {
    if (locked) return;
    var p = sel.indexOf(id);
    if (p >= 0) sel.splice(p, 1); else sel.push(id);
    sel.sort();
    render();
    api.changed(sel.length ? 'Ausgewählt: ' + sel.join(', ') : '');
  }

  function legsHtml() {
    return '<ol class="th-legs">' + PLAN.legs.map(function (g) {
      var L = SCHED[g.line], i = L.stops.indexOf(g.from), j = L.stops.indexOf(g.to);
      var via = L.stops.slice(i, j + 1).join(' → ');
      return '<li><span class="th-dot th-bg-' + g.line + '" aria-hidden="true"></span><span>' +
        '<strong>' + via + '</strong> mit der ' + LINES[g.line].name + 'n Linie: Abfahrt in ' + g.from + ' an Minute ' + g.dep + ', Ankunft in ' + g.to + ' an Minute ' + g.arr + '.</span></li>';
    }).join('') + '</ol>';
  }

  var STORY =
    '<p>In Marcus’ Stadt gibt es vier Buslinien. Sie starten an den Haltestellen A, B, C und D. Ihre Fahrstrecken kannst du unten in der Karte sehen.</p>' +
    '<p>Die ersten Busse jeder Linie fahren zur gleichen Zeit von den Starthaltestellen (A, B, C, D) ab: das ist Minute 0. Danach fahren die Busse in den angegebenen Zeit-Abständen ' + iconBus() +
    '. Von Haltestelle A zum Beispiel fahren Busse alle 3 Minuten, also an den Minuten 0, 3, 6, 9 …</p>' +
    '<p>Für jeden Streckenabschnitt zwischen zwei Haltestellen gibt eine Zahl an, wie viele Minuten ein Bus für den Abschnitt benötigt. Zum Beispiel hat der erste Bus, der von A abfährt, an Minute 0 + 1 + 4 + 3 = 8 die Haltestelle F erreicht.</p>' +
    '<p>Marcus wohnt ' + iconHouse() + ' bei Haltestelle A. Von dort aus möchte er mit dem ersten Bus zum Theater ' + iconMasks() +
    ' fahren. An Haltestellen, an denen sich Buslinien kreuzen, kann er innerhalb von 0 Minuten umsteigen. Er kann also mit jedem Bus weiterfahren, der zur gleichen Zeit oder später als er an der Umsteige-Haltestelle ankommt. ' +
    'Marcus weiß, auf welcher Route er fahren und umsteigen muss, damit er so früh wie möglich beim Theater ist.</p>';

  Biber.register({
    id: 'theater',
    story: STORY,
    question: 'Welche Haltestellen liegen auf dieser Route?',
    howto: 'Tippe alle Haltestellen an, die auf Marcus’ schnellster Route liegen, auch die Haltestelle, bei der er einsteigt, und die beim Theater. Noch einmal tippen nimmt eine Haltestelle wieder weg.',
    explanation: function () {
      var a = PLAN.arr;
      return '<p>Marcus rechnet für jede Haltestelle aus, wann er sie frühestens erreichen kann, und baut dabei auf den schon berechneten früheren Haltestellen auf: ' +
        'B an Minute ' + a.B + ', E an Minute ' + a.E + ', G an Minute ' + a.G + ', H an Minute ' + a.H + ' und das Theater (J) an Minute <strong>' + a.J + '</strong>. ' +
        'Dabei darf er nur Busse nehmen, die in der Umsteige-Haltestelle zur gleichen Zeit oder später abfahren. Dass der Weg über E, G und H der schnellste ist, liegt an den Anschlüssen: ' +
        'In G wartet genau an Minute ' + a.G + ' der grüne Bus, der in B an Minute 0 gestartet ist, und in H kommt der rosa Bus eine Minute nach Marcus.</p>' + legsHtml() +
        '<p>Die schnellste Route führt also über <strong>' + PLAN.route.join(', ') + '</strong>. ' +
        'Das Verfahren, die besten Teilergebnisse zu speichern und daraus die nächsten zu berechnen, heißt dynamische Programmierung.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; sel = []; locked = false; showRoute = false; nodes = {};
      var wrap = h('div', { class: 'th-map' });
      wrap.innerHTML = mapSvg();
      halos = wrap.querySelector('.th-halos');
      var desc = h('p', { class: 'th-sr', id: 'th-desc' },
        'Karte mit vier Buslinien. Gelbe Linie, Abstand 3 Minuten: A nach B 1 Minute, B nach E 4, E nach F 3. ' +
        'Grüne Linie, Abstand 2 Minuten, startet in B: B nach G 7, G nach H 3, H nach I 2. ' +
        'Blaue Linie, Abstand 4 Minuten, startet in C: C nach E 2, E nach G 1, G nach I 8, I nach J 6. ' +
        'Rosa Linie, Abstand 5 Minuten, startet in D: D nach F 1, F nach H 5, H nach J 9. Das Theater liegt bei Haltestelle J.');
      var grp = h('div', { class: 'th-nodes', role: 'group', 'aria-label': 'Haltestellen, mehrere auswählbar', 'aria-describedby': 'th-desc' });
      NAMES.forEach(function (id) {
        var b = h('button', { type: 'button', class: 'th-node', onclick: function () { toggle(id); } }, id);
        b.style.left = pct(STOPS[id].x, VB.x, VB.w);
        b.style.top = pct(STOPS[id].y, VB.y, VB.h);
        nodes[id] = b;
        grp.appendChild(b);
      });
      wrap.appendChild(grp);
      live = h('p', { class: 'th-sel', 'aria-live': 'polite' });
      el.replaceChildren(h('div', { class: 'th-board' }, desc, wrap, live));
      render();
    },
    isComplete: function () { return sel.length > 0; },
    evaluate: function () { return { correct: isRight(sel), answer: sel.slice().sort() }; },
    setAnswer: function (ans) { sel = (ans || []).slice().sort(); showRoute = false; render(); },
    lock: function (on) { locked = on; render(); },
    reset: function () { sel = []; locked = false; showRoute = false; render(); },
    showSolution: function () { sel = CORRECT.slice(); showRoute = true; locked = true; render(); }
  });
})();
