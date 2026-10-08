/* Aufgabe Theklas Netze (Heft 2021, S. 53; Klasse 9-10 schwer, 11-13 mittel): Graph als Adjazenzmatrix notieren */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-netze21-';
  var SVGNS = 'http://www.w3.org/2000/svg';

  /* Theklas Netz: fünf Endpunkte, Fäden 1-4, 2-3, 2-5, 3-4, 3-5 (laut Lösungstext im Heft S. 54) */
  var N = 5;
  var EDGES = [[1, 4], [2, 3], [2, 5], [3, 4], [3, 5]];
  /* Die vier Raster aus dem Heft: je Zeile (1..5) die Spalten mit Kreuz (abgelesen, mit den Beschreibungen im Heft abgeglichen) */
  var OPTIONS = [
    { key: 'A', rows: [[4], [3, 5], [2, 4, 5], [1, 3], [2, 3]] },
    { key: 'B', rows: [[2, 4], [1, 3], [2, 4, 5], [1, 3], [3]] },
    { key: 'C', rows: [[1, 4], [3, 5], [2, 4, 5], [1, 3, 4], [2, 3]] },
    { key: 'D', rows: [[4], [3, 5], [2, 4, 5], [1, 3], [3]] }
  ];
  var RIGHT = 0;   /* A: im Heft bestätigt; per Skript geprüft: nur A entspricht genau der Kantenmenge (symmetrisch, keine Schleifen) */
  var WHY = {
    B: 'In B ist ein Faden von 1 nach 2 angekreuzt, den es nicht gibt. Dafür fehlt der Faden von 2 nach 5.',
    C: 'In C stehen Kreuze auf der Diagonale (bei 1 und 4). Das würde bedeuten, dass ein Faden von einem Endpunkt zu sich selbst führt.',
    D: 'D ist nicht symmetrisch: Es gibt ein Kreuz in Spalte 5 / Zeile 2, aber keines in Spalte 2 / Zeile 5 (der Faden 2–5 ist nur in einer Richtung notiert).'
  };

  function s(tag, attrs, text) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text !== undefined) e.textContent = text;
    return e;
  }
  /* Raster als SVG: 5x5 Felder, Beschriftung 1..5 oben (Spalten) und links (Zeilen) */
  function matrixSvg(rows, label) {
    var C = 30, off = 34, size = off + N * C + 4;
    var svg = s('svg', { viewBox: '0 0 ' + size + ' ' + size, class: P + 'matrix', role: 'img', 'aria-label': label });
    svg.appendChild(s('rect', { x: off, y: off, width: N * C, height: N * C, class: P + 'cells' }));
    var i;
    for (i = 0; i <= N; i++) {
      svg.appendChild(s('line', { x1: off + i * C, y1: off, x2: off + i * C, y2: off + N * C, class: P + 'grid' }));
      svg.appendChild(s('line', { x1: off, y1: off + i * C, x2: off + N * C, y2: off + i * C, class: P + 'grid' }));
    }
    for (i = 0; i < N; i++) {
      [[off + i * C + C / 2, off / 2], [off / 2, off + i * C + C / 2]].forEach(function (p) {
        svg.appendChild(s('circle', { cx: p[0], cy: p[1], r: 10, class: P + 'head' }));
        svg.appendChild(s('text', { x: p[0], y: p[1] + 4.5, class: P + 'headtxt', 'text-anchor': 'middle' }, String(i + 1)));
      });
    }
    rows.forEach(function (cols, r) {
      cols.forEach(function (c) {
        var cx = off + (c - 1) * C, cy = off + r * C, m = 8;
        svg.appendChild(s('path', { d: 'M' + (cx + m) + ' ' + (cy + m) + 'L' + (cx + C - m) + ' ' + (cy + C - m) + 'M' + (cx + C - m) + ' ' + (cy + m) + 'L' + (cx + m) + ' ' + (cy + C - m), class: P + 'x' }));
      });
    });
    return svg;
  }
  function describe(opt) {
    return 'Raster ' + opt.key + ', Kreuze: ' + opt.rows.map(function (cols, r) { return 'Zeile ' + (r + 1) + ' Spalte ' + cols.join(', '); }).join('; ');
  }

  var el, api, radios, selected, locked, mark;

  function reset() { selected = null; mark = null; }

  function refresh() {
    radios.forEach(function (btn, i) {
      var on = selected === i, ok = i === RIGHT;
      btn.setAttribute('aria-checked', String(on));
      btn.tabIndex = (selected === null ? i === 0 : on) ? 0 : -1;
      btn.setAttribute('aria-disabled', locked ? 'true' : 'false');
      btn.classList.toggle('selected', on);
      btn.classList.toggle('right', on && mark !== null && ok);
      btn.classList.toggle('wrong', on && mark === 'check' && !ok);
      var m = btn.querySelector('.' + P + 'mark');
      if (m) m.remove();
      if (on && mark !== null) btn.appendChild(h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
    });
  }
  function choose(i, focus) {
    if (locked) return;
    selected = i;
    refresh();
    if (focus) radios[i].focus();
    api.changed();
  }
  function onKey(e) {
    var k = e.key, i = radios.indexOf(e.currentTarget), to = null;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % radios.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + radios.length - 1) % radios.length;
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }

  function solutionHtml() {
    var tmp = h('div');
    tmp.appendChild(matrixSvg(OPTIONS[RIGHT].rows, describe(OPTIONS[RIGHT])));
    return tmp.innerHTML;
  }

  Biber.register({
    id: 'netze21',
    story:
      '<p>Spinne Thekla möchte möglichst viele verschiedene Netze bauen. Deshalb notiert sie sich die Struktur jedes ihrer Netze so:</p>' +
      '<p>Sie nummeriert die Endpunkte des Netzes mit 1, 2 usw. Die Struktur notiert sie dann in einem Raster, das so viele Zeilen und Spalten hat, wie das Netz Endpunkte hat. ' +
      'Die Felder kreuzt sie nach dieser Regel an: <strong>Wenn es einen Faden gibt, der von Endpunkt A zu Endpunkt B führt, kreuzt sie das Feld in Spalte A und Zeile B an.</strong></p>' +
      '<p>Beachte, dass Thekla für jeden Faden zwei Kreuze macht: Ein Faden von Endpunkt A zu Endpunkt B führt auch von Endpunkt B zu Endpunkt A. Hier siehst du ein Netz und wie Thekla seine Struktur notiert hat.</p>',
    question: 'Thekla baut nun das zweite Netz. Wie notiert sie seine Struktur?',
    howto: 'Wähle das Raster, das zum Netz passt.',
    explanation: function () {
      return '<p>Wir gehen die Endpunkte nacheinander durch und schauen, wohin ihre Fäden führen. Von 1 führt ein Faden zu 4. Von 2 führen Fäden zu 3 und 5. Von 3 führen Fäden zu 2, 4 und 5. ' +
        'Von 4 führen Fäden zu 1 und 3, von 5 zu 2 und 3. Genau diese Felder sind in <strong>Raster A</strong> angekreuzt:</p>' +
        '<div class="' + P + 'sol">' + solutionHtml() + '</div>' +
        '<ul class="' + P + 'why"><li><strong>B:</strong> ' + WHY.B + '</li><li><strong>C:</strong> ' + WHY.C + '</li><li><strong>D:</strong> ' + WHY.D + '</li></ul>' +
        '<p>Ein solches Raster heißt <em>Adjazenzmatrix</em>. Man kann damit jeden Graphen (hier: das Netz) im Computer speichern. ' +
        'Weil jeder Faden in beide Richtungen führt, ist die Matrix symmetrisch zur Diagonalen, und ohne Schleifen bleibt die Diagonale leer.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      radios = OPTIONS.map(function (o, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': o.key,
          'aria-label': describe(o),
          onclick: function () { choose(i, false); }, onkeydown: onKey
        }, h('span', { class: P + 'key', 'aria-hidden': 'true' }, o.key + ')'));
        btn.appendChild(matrixSvg(o.rows, ''));
        btn.querySelector('svg').setAttribute('aria-hidden', 'true');
        btn.querySelector('svg').removeAttribute('role');
        btn.querySelector('svg').removeAttribute('aria-label');
        return btn;
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('div', { class: P + 'top' },
          h('section', { 'aria-label': 'Beispiel' },
            h('h3', null, 'Beispiel'),
            h('img', { class: P + 'pic', src: 'assets/netze21/beispiel.png', width: 760, height: 329, draggable: 'false',
              alt: 'Ein Netz mit vier Endpunkten an einem Steinbogen. Fäden führen von 1 nach 2, 3 und 4 sowie von 2 nach 4. Daneben das Raster mit Kreuzen: Zeile 1 in Spalte 2, 3, 4; Zeile 2 in Spalte 1 und 4; Zeile 3 in Spalte 1; Zeile 4 in Spalte 1 und 2.' })),
          h('section', { 'aria-label': 'Theklas neues Netz' },
            h('h3', null, 'Theklas neues Netz'),
            h('img', { class: P + 'pic', src: 'assets/netze21/netz.png', width: 760, height: 337, draggable: 'false',
              alt: 'Ein Netz mit fünf Endpunkten an einem Steinbogen: 1 links unten, 2 links oben, 3 oben, 4 rechts oben, 5 rechts unten. Fäden führen von 1 nach 4, von 2 nach 3 und 5, von 3 nach 4 und 5.' }))),
        h('section', { 'aria-label': 'Antworten' },
          h('h3', null, 'Wie notiert Thekla seine Struktur?'),
          h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Raster A bis D' }, radios))));
      refresh();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () {
      return { correct: selected === RIGHT, answer: { choice: OPTIONS[selected].key } };
    },
    setAnswer: function (ans) {
      var i = OPTIONS.map(function (o) { return o.key; }).indexOf(ans && ans.choice);
      selected = i >= 0 ? i : null;
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      refresh();
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () { selected = RIGHT; mark = 'solution'; locked = true; refresh(); }
  });
})();
