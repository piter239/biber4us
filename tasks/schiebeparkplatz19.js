/* Aufgabe Schiebeparkplatz (Heft 2019, S. 43; 5-6 schwer, 7-8 mittel, 9-10 einfach): Robotik, autonomes Fahren */
(function () {
  'use strict';
  var h = Biber.h, S = Biber.svg;
  var P = 't-schiebeparkplatz19-';

  /* Maße (Einheit = Bildpunkte der Heftgrafik, Lücke 0 = linke Innenkante des Platzes) */
  var LANE = 2822;          // Breite des Platzes
  var PW = 141, PL = 306;   // Länge/Breite eines Wagens
  var PARKED_Y = 59;
  var CROSS_Y = 422;
  var PARKED = [
    { id: 'A', x: 79, c: 3 }, { id: 'B', x: 282, c: 1 }, { id: 'C', x: 488, c: 1 }, { id: 'D', x: 692, c: 3 },
    { id: 'E', x: 898, c: 4 }, { id: 'F', x: 1101, c: 1 }, { id: 'G', x: 1308, c: 3 }, { id: 'H', x: 1511, c: 4 },
    { id: 'I', x: 1718, c: 4 }, { id: 'J', x: 1924, c: 3 }, { id: 'K', x: 2127, c: 1 }, { id: 'L', x: 2333, c: 1 },
    { id: 'Q', x: 2536, c: 1 }
  ];
  var CROSS = [
    { id: 'P', x: 293, c: 4 }, { id: 'O', x: 1120, c: 1 }, { id: 'N', x: 1533, c: 4 }, { id: 'M', x: 2145, c: 3 }
  ];
  var LINES = [44, 246, 453, 657, 859, 1066, 1272, 1474, 1680, 1885, 2087, 2293, 2502, 2708];
  var RIGHT = 'I';
  var SOLUTION_POS = [293, 1120, 1860, LANE - PL];   // M nach rechts, dann N nach rechts: Wagen I kann ausfahren
  var STEP = 40;

  function overlap(px, cx) { return px < cx + PL && cx < px + PW; }
  function blockersOf(car, pos) {
    return CROSS.filter(function (c, i) { return overlap(car.x, pos[i]); }).map(function (c) { return c.id; });
  }

  var el, api, locked, picked, mode, pos;
  var svg, boardEl, statEl, optsEl, parkedG = {}, crossG = {}, tickG = {}, selRect, drag;

  /* ---- Zeichnung eines Wagens (Fahrtrichtung nach oben, 141 x 306) ---- */
  function carShape(c) {
    return S('g', { 'aria-hidden': 'true' },
      S('rect', { class: P + 'body c' + c, x: 0, y: 0, width: PW, height: PL, rx: 30 }),
      S('path', { class: P + 'win', d: 'M24 96 C24 62 42 44 70.5 44 C99 44 117 62 117 96 Q70.5 78 24 96 Z' }),
      S('path', { class: P + 'win', d: 'M27 234 Q70.5 250 114 234 L107 264 Q70.5 274 34 264 Z' }),
      S('rect', { class: P + 'win', x: 4, y: 116, width: 8, height: 28, rx: 3 }),
      S('rect', { class: P + 'win', x: 4, y: 152, width: 8, height: 28, rx: 3 }),
      S('rect', { class: P + 'win', x: 129, y: 116, width: 8, height: 28, rx: 3 }),
      S('rect', { class: P + 'win', x: 129, y: 152, width: 8, height: 28, rx: 3 }),
      S('rect', { class: P + 'lamp', x: 12, y: 5, width: 28, height: 15, rx: 4 }),
      S('rect', { class: P + 'lamp', x: 101, y: 5, width: 28, height: 15, rx: 4 }),
      S('rect', { class: P + 'tail', x: 12, y: 286, width: 28, height: 14, rx: 4 }),
      S('rect', { class: P + 'tail', x: 101, y: 286, width: 28, height: 14, rx: 4 }));
  }
  function badge(letter, cx, cy) {
    return S('g', { 'aria-hidden': 'true', transform: 'translate(' + cx + ',' + cy + ')' },
      S('circle', { class: P + 'badge', r: 46 }),
      S('text', { class: P + 'let', y: 26, 'text-anchor': 'middle' }, letter));
  }

  function build() {
    svg = S('svg', { class: P + 'svg', viewBox: '-80 -80 2910 730', role: 'group', 'aria-label': 'Parkplatz mit 13 längs geparkten Wagen und vier quer stehenden Wagen' });
    svg.appendChild(S('rect', { class: P + 'asphalt', x: 0, y: 0, width: LANE, height: 644 }));
    LINES.forEach(function (x) {
      svg.appendChild(S('rect', { class: P + 'line', x: x, y: 40, width: 7, height: 80 }));
      svg.appendChild(S('rect', { class: P + 'line', x: x, y: 250, width: 7, height: 140 }));
    });
    svg.appendChild(S('path', { class: P + 'wall', d: 'M-37 600 V-37 H2791 V330' }));
    PARKED.forEach(function (c) {
      var g = S('g', { class: P + 'parked', 'data-car': c.id, transform: 'translate(' + c.x + ',' + PARKED_Y + ')' });
      g.appendChild(S('rect', { class: P + 'ring', x: -10, y: -10, width: PW + 20, height: PL + 20, rx: 38 }));
      g.appendChild(carShape(c.c));
      g.appendChild(badge(c.id, PW / 2, PL / 2));
      var t = S('g', { class: P + 'tick', transform: 'translate(' + PW / 2 + ',-2)' },
        S('circle', { r: 30 }), S('path', { d: 'M-14 0 L-4 11 L15 -11', fill: 'none' }));
      g.appendChild(t);
      tickG[c.id] = t; parkedG[c.id] = g;
      svg.appendChild(g);
    });
    selRect = S('rect', { class: P + 'sel', rx: 38, width: PW + 36, height: PL + 36, visibility: 'hidden' });
    svg.appendChild(selRect);
    CROSS.forEach(function (c, i) {
      var g = S('g', { class: P + 'cross', 'data-i': String(i), tabindex: '0', role: 'slider', 'aria-orientation': 'horizontal' });
      var inner = S('g', { transform: 'translate(' + PL + ',0) rotate(90)' });
      inner.appendChild(carShape(c.c));
      g.appendChild(S('rect', { class: P + 'hit', x: -15, y: -35, width: PL + 30, height: PW + 70 }));
      g.appendChild(inner);
      g.appendChild(badge(c.id, PL / 2, PW / 2));
      crossG[c.id] = g;
      svg.appendChild(g);
    });
    svg.addEventListener('pointerdown', onDown);
    svg.addEventListener('pointermove', onMove);
    svg.addEventListener('pointerup', onUp);
    svg.addEventListener('pointercancel', onUp);
    svg.addEventListener('touchstart', function (e) {
      /* Quer stehende Wagen werden mit dem Finger gezogen, nicht der Parkplatz gescrollt */
      if (!locked && e.target.closest && e.target.closest('.' + P + 'cross')) e.preventDefault();
    }, { passive: false });
    svg.addEventListener('keydown', onKey);
    svg.addEventListener('click', onClick);
  }

  function bounds(i) {
    return [i === 0 ? 0 : pos[i - 1] + PL, i === CROSS.length - 1 ? LANE - PL : pos[i + 1] - PL];
  }
  function refresh() {
    var free = 0, moved = 0;
    CROSS.forEach(function (c, i) {
      var g = crossG[c.id];
      g.setAttribute('transform', 'translate(' + pos[i] + ',' + CROSS_Y + ')');
      var b = bounds(i);
      g.setAttribute('aria-valuemin', String(Math.round(b[0])));
      g.setAttribute('aria-valuemax', String(Math.round(b[1])));
      g.setAttribute('aria-valuenow', String(Math.round(pos[i])));
      var bl = PARKED.filter(function (p) { return overlap(p.x, pos[i]); }).map(function (p) { return p.id; });
      g.setAttribute('aria-valuetext', bl.length ? 'steht vor Wagen ' + bl.join(', ') : 'steht vor keinem Wagen');
      g.setAttribute('aria-label', 'Wagen ' + c.id + ' nach links oder rechts schieben, Pfeiltasten');
      if (Math.abs(pos[i] - c.x) > 0.5) moved++;
    });
    PARKED.forEach(function (c) {
      var f = blockersOf(c, pos).length === 0;
      if (f) free++;
      parkedG[c.id].setAttribute('class', P + 'parked' + (f ? ' free' : '') + (picked === c.id ? ' picked' : '') + resultCls(c.id));
      parkedG[c.id].setAttribute('aria-hidden', 'true');
    });
    var pc = picked && PARKED.filter(function (p) { return p.id === picked; })[0];
    if (pc) {
      selRect.setAttribute('x', pc.x - 18); selRect.setAttribute('y', PARKED_Y - 18);
      selRect.setAttribute('visibility', 'visible');
      selRect.setAttribute('class', P + 'sel' + resultCls(picked));
    } else selRect.setAttribute('visibility', 'hidden');
    statEl.textContent = 'Verschobene Wagen: ' + moved + ' · Wagen, die ausfahren können: ' + free + ' von 13';
  }
  function resultCls(id) {
    if (!mode) return '';
    if (mode === 'solution') return id === RIGHT ? ' right' : '';
    return picked === id ? (id === RIGHT ? ' right' : ' wrong') : '';
  }

  function renderOpts() {
    optsEl.replaceChildren.apply(optsEl, PARKED.map(function (c) {
      var sl = picked === c.id;
      var cls = P + 'opt' + (mode ? resultCls(c.id) : '');
      var input = h('input', { type: 'radio', name: P + 'opt', value: c.id, disabled: locked, 'aria-label': 'Wagen ' + c.id });
      input.checked = sl;
      return h('label', { class: cls }, input, h('span', { class: P + 'card' }, c.id));
    }));
  }

  /* ---- Ziehen und Tasten ---- */
  function unitsPerPx() { return 2910 / svg.getBoundingClientRect().width; }
  function onDown(e) {
    var g = e.target.closest('.' + P + 'cross');
    if (!g || locked || (e.button !== undefined && e.button > 0)) return;
    var i = +g.getAttribute('data-i');
    var b = bounds(i);
    drag = { i: i, x0: e.clientX, p0: pos[i], lo: b[0], hi: b[1], id: e.pointerId, moved: false };
    try { svg.setPointerCapture(e.pointerId); } catch (err) { /* egal */ }
    g.classList.add('drag');
    g.focus({ preventScroll: true });
    e.preventDefault();
  }
  function onMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var v = drag.p0 + (e.clientX - drag.x0) * unitsPerPx();
    pos[drag.i] = Math.max(drag.lo, Math.min(drag.hi, v));
    drag.moved = true;
    refresh();
  }
  function onUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    crossG[CROSS[drag.i].id].classList.remove('drag');
    drag = null;
  }
  function onKey(e) {
    var g = e.target.closest && e.target.closest('.' + P + 'cross');
    if (!g || locked) return;
    var i = +g.getAttribute('data-i');
    var b = bounds(i), d = 0;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') d = -(e.shiftKey ? 200 : STEP);
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') d = e.shiftKey ? 200 : STEP;
    else if (e.key === 'Home') d = -1e6;
    else if (e.key === 'End') d = 1e6;
    else return;
    e.preventDefault();
    pos[i] = Math.max(b[0], Math.min(b[1], pos[i] + d));
    refresh();
  }
  function onClick(e) {
    var g = e.target.closest('.' + P + 'parked');
    if (!g || locked) return;
    choose(g.getAttribute('data-car'));
  }
  function choose(id) {
    picked = id;
    refresh(); renderOpts();
    var f = optsEl.querySelector('input:checked');
    api.changed('Wagen ' + picked + ' gewählt.');
  }

  function resetPos() { pos = CROSS.map(function (c) { return c.x; }); }

  Biber.register({
    id: 'schiebeparkplatz19',
    story: '<p>Auf dem „Schiebeparkplatz“ in Tübingen darf man Wagen auch quer vor den normalen Plätzen abstellen. ' +
      'Ein quer stehender Wagen, der einen anderen Wagen blockiert, wird vorsichtig vorwärts oder rückwärts verschoben. Dann kann der blockierte Wagen ausfahren.</p>' +
      '<p>Das Bild zeigt ein Beispiel:</p><ul>' +
      '<li>Wagen A wird nicht blockiert und kann ausfahren.</li>' +
      '<li>Wagen L wird blockiert. Wenn Wagen M verschoben wird, kann Wagen L ausfahren.</li>' +
      '<li>Im Beispiel wird ein Wagen <b>zweifach</b> blockiert: Zwei andere Wagen müssen verschoben werden, damit er ausfahren kann.</li></ul>',
    question: 'Welcher Wagen wird zweifach blockiert?',
    howto: 'Wähle einen Wagen aus: antippen oder unten den Buchstaben wählen. Zum Ausprobieren kannst Du die quer stehenden Wagen P, O, N und M ziehen (oder mit Tab und den Pfeiltasten schieben). Sie stoßen aneinander und an die Wand. Grün markierte Wagen können ausfahren. Das Ausprobieren zählt nicht zur Antwort.',
    explanation: function () {
      return '<p><b>Wagen I</b> wird zweifach blockiert. Wagen N muss verschoben werden, damit I ausfahren kann. Dafür ist aber nicht genug Platz: ' +
        'Erst wenn Wagen O nach links oder Wagen M nach rechts verschoben wurde, lässt sich auch N weit genug schieben.</p>' +
        '<p>Alle anderen Wagen brauchen höchstens eine Verschiebung: A, D, E, J und Q können direkt ausfahren. Für B und C muss P weg, für F und G muss O weg, für H muss N weg und für K und L muss M weg.</p>' +
        '<p><b>Informatik:</b> Auf dem Parkplatz verbrauchen Autos wertvollen Platz. Fahren sie autonom oder werden sie ferngesteuert (wie schon heute in einem Parkhaus in Stuttgart), können sie viel enger und sogar quer abgestellt werden, solange genug Platz zum Verschieben bleibt. ' +
        'Dazu muss ein Programm herausfinden, welche Wagen in welcher Reihenfolge bewegt werden müssen, und ob die Verschiebungen überhaupt möglich sind.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null; drag = null; resetPos();
      statEl = h('p', { class: P + 'stat', 'aria-live': 'polite' });
      optsEl = h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Wagen auswählen' });
      build();
      var back = h('button', { type: 'button', class: P + 'back', onclick: function () { if (locked) return; resetPos(); refresh(); } }, 'Wagen zurückstellen');
      boardEl = h('div', { class: P + 'board' }, svg);
      el.replaceChildren(h('div', { class: P + 'box' },
        h('div', { class: P + 'scroll' }, boardEl),
        h('p', { class: P + 'hint' }, 'Wische den Parkplatz seitlich, um alle Wagen zu sehen.'),
        h('div', { class: P + 'bar' }, statEl, back),
        h('h3', { class: P + 'h' }, 'Welcher Wagen wird zweifach blockiert?'), optsEl));
      optsEl.addEventListener('change', function (e) {
        if (locked || !e.target.matches('input[type=radio]')) return;
        choose(e.target.value);
        var f = optsEl.querySelector('input:checked'); if (f) f.focus();
      });
      refresh(); renderOpts();
    },
    isComplete: function () { return picked !== null; },
    evaluate: function () { return { correct: picked === RIGHT, answer: { c: picked, pos: pos.map(Math.round) } }; },
    setAnswer: function (ans) {
      picked = ans && typeof ans.c === 'string' ? ans.c : null;
      if (ans && Array.isArray(ans.pos) && ans.pos.length === CROSS.length) pos = ans.pos.map(Number); else resetPos();
      mode = 'check'; refresh(); renderOpts();
    },
    lock: function (on) {
      locked = on;
      mode = on ? (mode || 'check') : null;
      boardEl.classList.toggle('locked', on);
      CROSS.forEach(function (c) { crossG[c.id].setAttribute('tabindex', on ? '-1' : '0'); });
      refresh(); renderOpts();
    },
    reset: function () { picked = null; mode = null; resetPos(); refresh(); renderOpts(); },
    showSolution: function () {
      picked = RIGHT; mode = 'solution'; locked = true; pos = SOLUTION_POS.slice();
      boardEl.classList.add('locked');
      refresh(); renderOpts();
    }
  });
})();
