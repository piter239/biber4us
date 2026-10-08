/* Aufgabe Zerobots Mission (Heft 2023, Klasse 9-10 schwer, 11-13 mittel): Systeme, Roboter, Planung */
(function () {
  'use strict';
  var h = Biber.h;
  var NS = 'http://www.w3.org/2000/svg';

  var SIZE = 5, CELL = 64;
  var START = { r: 4, c: 2 }, BASE = { r: 1, c: 0 };
  var START_TANK = { color: 'p', fill: 9 };                /* violett, Füllstand 9 */
  var EXCH = [{ r: 3, c: 4, color: 'o', fill: 3, name: 'A' },    /* orange */
              { r: 0, c: 4, color: 'g', fill: 3, name: 'B' }];   /* grün */
  var DIRS = { u: [-1, 0, 'oben'], d: [1, 0, 'unten'], l: [0, -1, 'links'], r: [0, 1, 'rechts'] };
  var SOLUTION = 'urr' + 'uuu' + 'ddd' + 'uu' + 'llll';   /* hoch, 2 rechts (A), 3 hoch (B), 3 runter (A), 2 hoch, 4 links (Basis) */
  var TANK_NAME = { p: 'violetter Tank', o: 'orange Tank', g: 'grüner Tank' };

  function key(r, c) { return r + ',' + c; }

  /* Zustand aus der Zugfolge berechnen; liefert auch, wie weit die Folge gültig war */
  function simulate(moves) {
    var st = { r: START.r, c: START.c, tank: { color: START_TANK.color, fill: START_TANK.fill }, cells: {}, trail: [[START.r, START.c]], n: 0, swapped: null, error: null };
    EXCH.forEach(function (e) { st.cells[key(e.r, e.c)] = { color: e.color, fill: e.fill }; });
    for (var i = 0; i < moves.length; i++) {
      var d = DIRS[moves[i]];
      if (!d) { st.error = 'bad'; break; }
      var r = st.r + d[0], c = st.c + d[1];
      if (r < 0 || c < 0 || r >= SIZE || c >= SIZE) { st.error = 'edge'; break; }
      if (st.tank.fill <= 0) { st.error = 'empty'; break; }
      st.tank.fill -= 1;
      st.r = r; st.c = c; st.n++;
      st.trail.push([r, c]);
      st.swapped = null;
      var k = key(r, c);
      if (st.cells[k]) {
        var t = st.cells[k];
        st.cells[k] = st.tank;
        st.tank = t;
        st.swapped = k;
      }
    }
    return st;
  }
  function isSolved(st) {
    if (st.r !== BASE.r || st.c !== BASE.c || st.tank.fill !== 0) return false;
    return Object.keys(st.cells).every(function (k) { return st.cells[k].fill === 0; });
  }
  if (!isSolved(simulate(SOLUTION)) || SOLUTION.length !== 15) throw new Error('zerobots23: Lösung stimmt nicht');

  /* ---------- Zeichnen ---------- */
  function s(name, attrs, kids) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]);
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  /* Tank: Mitte (0,0), Größe ca. 34 */
  function tankShape(color) {
    if (color === 'o') return s('path', { class: 't-zerobots23-tk o', d: 'M-14 -12L-9 -17H8L14 -12V15Q14 18 11 18H-11Q-14 18 -14 15Z' });
    if (color === 'g') return s('path', { class: 't-zerobots23-tk g', d: 'M0 -18L16 -6L10 15Q9.5 18 6.5 18H-6.5Q-9.5 18 -10 15L-16 -6Z' });
    return s('rect', { class: 't-zerobots23-tk p', x: -13, y: -16, width: 26, height: 34, rx: 9 });
  }
  function tank(t, x, y, sc) {
    return s('g', { transform: 'translate(' + x + ' ' + y + ') scale(' + sc + ')' }, [
      tankShape(t.color),
      s('circle', { class: 't-zerobots23-cap', cx: -9, cy: -16.5, r: 2.4 }),
      s('text', { class: 't-zerobots23-num', x: 0, y: 7, 'text-anchor': 'middle' }, null)
    ]);
  }
  function withText(g, txt) { g.lastChild.textContent = String(txt); return g; }
  function tankN(t, x, y, sc) { return withText(tank(t, x, y, sc), t.fill); }

  function robot(t, x, y, sc) {
    var g = s('g', { transform: 'translate(' + x + ' ' + y + ') scale(' + sc + ')' });
    g.appendChild(s('rect', { class: 't-zerobots23-plate', x: -21, y: -22, width: 5, height: 40, rx: 1.5 }));
    g.appendChild(s('rect', { class: 't-zerobots23-plate', x: -21, y: 14, width: 42, height: 5, rx: 1.5 }));
    g.appendChild(tankN(t, 0, -3, 0.95));
    g.appendChild(s('rect', { class: 't-zerobots23-track', x: -23, y: 19, width: 46, height: 10, rx: 5 }));
    for (var i = 0; i < 5; i++) g.appendChild(s('circle', { class: 't-zerobots23-wheel', cx: -16 + i * 8, cy: 24, r: 2.4 }));
    return g;
  }
  function tower(x, y) {
    return s('g', { transform: 'translate(' + x + ' ' + y + ')', class: 't-zerobots23-tower' }, [
      s('path', { d: 'M0 -16L-11 18M0 -16L11 18M-6 2H6M-8.5 10H8.5M-4 -6L5 6M4 -6L-5 6M-13 18H13' }),
      s('circle', { cx: 0, cy: -19, r: 2.6, class: 't-zerobots23-towerdot' }),
      s('path', { d: 'M-8 -24Q-12 -19 -8 -14M8 -24Q12 -19 8 -14M-13 -28Q-19 -19 -13 -10M13 -28Q19 -19 13 -10', class: 't-zerobots23-wave' })
    ]);
  }

  var el, api, locked, moves, mode, svg, statusEl, infoEl, padEl, undoBtn;

  function aria(st) {
    return 'Spielfeld mit 5 mal 5 Feldern. Zerobot steht in Zeile ' + (st.r + 1) + ', Spalte ' + (st.c + 1) + ' und hat einen Tank mit Füllstand ' + st.tank.fill + '. ' +
      'Die Basisstation ist in Zeile 2, Spalte 1.';
  }

  function render() {
    var st = simulate(moves);
    var kids = [];
    for (var r = 0; r < SIZE; r++) for (var c = 0; c < SIZE; c++) {
      var isBase = r === BASE.r && c === BASE.c;
      var nb = Math.abs(r - st.r) + Math.abs(c - st.c) === 1;
      kids.push(s('rect', { class: 't-zerobots23-cell' + (isBase ? ' base' : '') + (nb && !locked ? ' nb' : ''), x: c * CELL, y: r * CELL, width: CELL, height: CELL, 'data-r': r, 'data-c': c }));
    }
    kids.push(tower(BASE.c * CELL + 32, BASE.r * CELL + 36));
    /* Spur */
    if (st.trail.length > 1) {
      kids.push(s('polyline', { class: 't-zerobots23-trail', points: st.trail.map(function (p) { return (p[1] * CELL + 32) + ',' + (p[0] * CELL + 32); }).join(' ') }));
    }
    kids.push(s('circle', { class: 't-zerobots23-startdot', cx: START.c * CELL + 32, cy: START.r * CELL + 32, r: 4.5 }));
    /* Tanks auf Feldern */
    Object.keys(st.cells).forEach(function (k) {
      var p = k.split(','), r = +p[0], c = +p[1];
      var here = st.r === r && st.c === c;
      kids.push(here ? tankN(st.cells[k], c * CELL + 14, r * CELL + 44, 0.62) : tankN(st.cells[k], c * CELL + 32, r * CELL + 33, 1.15));
    });
    kids.push(robot(st.tank, st.c * CELL + (st.swapped ? 38 : 32), st.r * CELL + 31, 0.95));
    svg.replaceChildren.apply(svg, kids);
    svg.setAttribute('aria-label', aria(st));
    svg.classList.toggle('ok', mode === 'ok');
    svg.classList.toggle('bad', mode === 'bad');

    infoEl.replaceChildren(
      h('span', { class: 't-zerobots23-chip' }, 'Tank von Zerobot: ', h('b', null, String(st.tank.fill))),
      h('span', { class: 't-zerobots23-chip' }, 'Bewegungen: ', h('b', null, String(st.n))));
    undoBtn.disabled = locked || !moves.length;
    Array.prototype.forEach.call(padEl.querySelectorAll('button'), function (b) { b.disabled = locked; });
    return st;
  }

  function msgFor(err) {
    if (err === 'edge') return 'Dort ist der Rand des Spielfelds.';
    if (err === 'empty') return 'Der Tank ist leer, Zerobot kann nicht weiterfahren. Gehe einen Zug zurück.';
    return '';
  }
  function say(t) { statusEl.textContent = t; }

  function move(d) {
    if (locked) return;
    var st = simulate(moves + d);
    if (st.error) { say(msgFor(st.error)); return; }
    moves += d;
    var cur = render();
    var txt = 'Zerobot fährt nach ' + DIRS[d][2] + '.';
    if (cur.swapped) txt += ' Tankwechsel: Zerobot hat jetzt einen Tank mit Füllstand ' + cur.tank.fill + '.';
    else if (cur.tank.fill === 0 && !(cur.r === BASE.r && cur.c === BASE.c)) txt += ' Der Tank ist leer.';
    say(txt);
    api.changed();
  }
  function undo() {
    if (locked || !moves.length) return;
    moves = moves.slice(0, -1);
    render();
    say('Letzter Zug zurückgenommen.');
    api.changed();
  }
  function onClick(e) {
    var b = e.target.closest('[data-d]');
    if (b) { move(b.getAttribute('data-d')); return; }
    var cell = e.target.closest('[data-r]');
    if (!cell || locked) return;
    var st = simulate(moves);
    var r = +cell.getAttribute('data-r'), c = +cell.getAttribute('data-c');
    for (var d in DIRS) if (st.r + DIRS[d][0] === r && st.c + DIRS[d][1] === c) { move(d); return; }
    say('Zerobot kann nur auf ein Nachbarfeld fahren.');
  }
  function onKey(e) {
    var m = { ArrowUp: 'u', ArrowDown: 'd', ArrowLeft: 'l', ArrowRight: 'r' }[e.key];
    if (m) { e.preventDefault(); move(m); }
    else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); undo(); }
  }

  function arrow(d, glyph) {
    return h('button', { type: 'button', class: 't-zerobots23-arr ' + d, 'data-d': d, 'aria-label': 'Nach ' + DIRS[d][2] + ' fahren' }, glyph);
  }

  Biber.register({
    id: 'zerobots23',
    story: '<p>Zerobot hat einen austauschbaren Treibstofftank. Er bewegt sich damit in einem Raster nach oben, unten, rechts und links. ' +
      'Bei <b>jeder Bewegung</b> von einem Rasterfeld zum nächsten sinkt der Füllstand des Tanks um 1.</p>' +
      '<p>Auf einigen Feldern liegen Austauschtanks; die Zahl darauf zeigt den Füllstand. Wenn Zerobot ein solches Feld erreicht, tauscht er seinen Tank, egal wie voll der ist: ' +
      'Er nimmt den Austauschtank auf, setzt seinen bisherigen Tank auf dem Feld ab und fährt weiter.</p>' +
      '<p>Alarm: Die Tanks sind fehlerhaft und könnten explodieren! Das ist Zerobots Mission: Er soll so zur Basisstation (Funkturm) fahren, dass am Ende <b>alle Tanks leer</b> sind (Füllstand 0).</p>',
    question: 'Wie muss Zerobot sich bewegen, um seine Mission zu erfüllen?',
    howto: 'Steuere Zerobot mit den Pfeiltasten (auf der Tastatur oder unten) oder tippe ein Nachbarfeld an. Mit „Zug zurück“ nimmst du die letzte Bewegung zurück. Prüfe, wenn du die Basisstation erreicht hast.',
    explanation: function () {
      return '<p>Insgesamt gibt es 9 + 3 + 3 = 15 Einheiten Treibstoff, also genau 15 Bewegungen. Zerobot muss beide Austauschtanks besuchen, und zwar das Feld A (unten rechts, orange) sogar zweimal:</p>' +
        '<ol class="t-zerobots23-steps"><li>3 Felder bis A: Tank 9 → 6. Tausch gegen den orangen Tank (Füllstand 3), der violette Tank mit 6 bleibt liegen.</li>' +
        '<li>3 Felder nach oben bis B: Tank 3 → 0. Tausch gegen den grünen Tank (3), der orange Tank bleibt leer bei B.</li>' +
        '<li>3 Felder zurück zu A: Tank 3 → 0. Tausch gegen den violetten Tank (6), der grüne bleibt leer bei A.</li>' +
        '<li>6 Felder bis zur Basisstation: Tank 6 → 0. Alle Tanks sind leer.</li></ol>' +
        '<p>Der Weg zwischen den Feldern darf unterschiedlich sein, nur die Reihenfolge A, B, A, Basis ist zwingend: Fährt man zuerst zu B, braucht man 17 Bewegungen, und so viel Treibstoff gibt es nicht.</p>' +
        '<p><b>Informatik:</b> Autonome Roboter und selbstfahrende Autos müssen ihren Energievorrat planen und rechtzeitig Ladestationen erreichen. ' +
        'Software für mobile Roboter enthält dafür ein Batterie- und Lademanagement, und die Platzierung von Ladestationen ist selbst ein Forschungsthema (charging station placement problem).</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; moves = ''; mode = null;
      svg = s('svg', { class: 't-zerobots23-svg', viewBox: '0 0 ' + (SIZE * CELL) + ' ' + (SIZE * CELL), role: 'group', tabindex: '0', focusable: 'false' });
      infoEl = h('div', { class: 't-zerobots23-info' });
      statusEl = h('p', { class: 't-zerobots23-status', role: 'status', 'aria-live': 'polite' });
      undoBtn = h('button', { type: 'button', class: 't-zerobots23-undo' }, '↶ Zug zurück');
      padEl = h('div', { class: 't-zerobots23-pad', role: 'group', 'aria-label': 'Steuerung' },
        arrow('u', '↑'), arrow('l', '←'), arrow('d', '↓'), arrow('r', '→'));
      undoBtn.addEventListener('click', undo);
      el.replaceChildren(h('div', { class: 't-zerobots23-box' },
        h('div', { class: 't-zerobots23-main' }, svg,
          h('div', { class: 't-zerobots23-ctl' }, infoEl, padEl, undoBtn)),
        statusEl));
      svg.addEventListener('click', onClick);
      svg.addEventListener('keydown', onKey);
      padEl.addEventListener('click', onClick);
      render();
    },
    isComplete: function () { return moves.length > 0; },
    evaluate: function () { return { correct: isSolved(simulate(moves)), answer: moves }; },
    setAnswer: function (ans) {
      moves = typeof ans === 'string' ? ans : '';
      var st = simulate(moves);
      if (st.error) moves = moves.slice(0, st.n);
      mode = isSolved(simulate(moves)) ? 'ok' : 'bad';
      render();
    },
    lock: function (on) {
      locked = on;
      mode = on ? (isSolved(simulate(moves)) ? 'ok' : 'bad') : null;
      render();
      if (on) {
        var st = simulate(moves);
        if (!isSolved(st)) {
          var left = [];
          if (st.r !== BASE.r || st.c !== BASE.c) left.push('Zerobot steht nicht an der Basisstation');
          if (st.tank.fill) left.push('sein Tank hat noch Füllstand ' + st.tank.fill);
          Object.keys(st.cells).forEach(function (k) { if (st.cells[k].fill) left.push('ein Tank auf dem Feld hat noch Füllstand ' + st.cells[k].fill); });
          say('Mission nicht erfüllt: ' + left.join('; ') + '.');
        } else say('Mission erfüllt: Zerobot steht an der Basisstation und alle Tanks sind leer.');
      } else say('');
    },
    reset: function () { moves = ''; mode = null; render(); say(''); },
    showSolution: function () {
      moves = SOLUTION; mode = 'ok'; locked = true; render();
      say('Eine richtige Lösung mit 15 Bewegungen: A, B, A, Basisstation.');
    }
  });
})();
