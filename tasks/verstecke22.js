/* Aufgabe Verstecke (Biber 2022, Heft S. 58): Paritätsbits in Zeilen und Spalten */
(function () {
  'use strict';
  var h = Biber.h;

  /* ---- Geometrie der Karte (Bildpunkte des Kartenbildes assets/verstecke22/karte.png, 1000 x 727) ----
     6 senkrechte und 6 waagerechte Gitterlinien (leicht schräg gezeichnet) teilen die Karte in 7 x 7 Felder. */
  var IMG_W = 1000, IMG_H = 727;
  var VX = [217, 324, 431, 538, 645, 752], SV = -0.0143;       // x der senkrechten Linien bei y = 60, Steigung dx/dy
  var HY = [87, 193, 298, 404, 509, 615], SH = 0.0108;         // y der waagerechten Linien bei x = 70, Steigung dy/dx
  var LEFT = 14, RIGHT = 972, TOP = 18, BOTTOM = 708;
  var N = 7;
  var COLS = 'ABCDEFG';

  function vline(i, y) { return i < 0 ? LEFT : i >= N - 1 ? RIGHT : VX[i] + SV * (y - 60); }
  function hline(j, x) { return j < 0 ? TOP : j >= N - 1 ? BOTTOM : HY[j] + SH * (x - 70); }
  function corner(i, j) {   // Schnittpunkt der senkrechten Linie i mit der waagerechten Linie j
    var x = vline(i, 300), y = hline(j, x);
    for (var k = 0; k < 4; k++) { x = vline(i, y); y = hline(j, x); }
    return [x, y];
  }
  // Feld (Spalte c, Zeile r): Ecken links oben, rechts oben, rechts unten, links unten
  function cellPoly(c, r) { return [corner(c - 1, r - 1), corner(c, r - 1), corner(c, r), corner(c - 1, r)]; }
  function centroid(p) {
    return [(p[0][0] + p[1][0] + p[2][0] + p[3][0]) / 4, (p[0][1] + p[1][1] + p[2][1] + p[3][1]) / 4];
  }
  var POLY = [];
  for (var rr = 0; rr < N; rr++) { POLY.push([]); for (var cc = 0; cc < N; cc++) POLY[rr].push(cellPoly(cc, rr)); }
  function pts(p) { return p.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' '); }

  // Vorgegebene Markierungen (Spalte, Zeile; 0-basiert), Mittelpunkte wie im Heft gezeichnet
  var GIVEN = [
    { c: 2, r: 1, x: 379, y: 150 }, { c: 5, r: 1, x: 689, y: 151 },
    { c: 4, r: 2, x: 586, y: 256 }, { c: 5, r: 5, x: 695, y: 572 }
  ];
  var SOLUTION = [{ c: 2, r: 2 }, { c: 4, r: 5 }];             // C3 und E6
  function name(c, r) { return COLS[c] + (r + 1); }
  function key(c, r) { return c + ',' + r; }
  var SOLKEYS = SOLUTION.map(function (s) { return key(s.c, s.r); });

  /* ---- Zeichnung ---- */
  function cross(x, y, cls, half, w) {
    var d = 'M' + (x - half) + ',' + (y - half) + ' L' + (x + half) + ',' + (y + half) + ' M' + (x + half) + ',' + (y - half) + ' L' + (x - half) + ',' + (y + half);
    return '<path class="t-verstecke22-halo ' + cls + '" d="' + d + '" style="stroke-width:' + (w + 10) + 'px"/><path class="t-verstecke22-x ' + cls + '" d="' + d + '" style="stroke-width:' + w + 'px"/>';
  }
  function frame(inner, label, interactive) {
    var s = '<svg class="t-verstecke22-svg" viewBox="-46 -46 ' + (IMG_W + 54) + ' ' + (IMG_H + 52) + '" ' +
      (interactive ? 'role="group" aria-label="' + label + '"' : 'role="img" aria-label="' + label + '"') + ' focusable="false">' +
      '<image href="assets/verstecke22/karte.png" x="0" y="0" width="' + IMG_W + '" height="' + IMG_H + '"/>';
    for (var c = 0; c < N; c++) {
      var m = centroid(POLY[0][c]);
      s += '<text class="t-verstecke22-lab" x="' + m[0].toFixed(0) + '" y="-14" text-anchor="middle" aria-hidden="true">' + COLS[c] + '</text>';
    }
    for (var r = 0; r < N; r++) {
      var m2 = centroid(POLY[r][0]);
      s += '<text class="t-verstecke22-lab" x="-24" y="' + (m2[1] + 8).toFixed(0) + '" text-anchor="middle" aria-hidden="true">' + (r + 1) + '</text>';
    }
    return s + inner + '</svg>';
  }
  function givenMarks() {
    return GIVEN.map(function (g) { return cross(g.x, g.y, 'given', 36, 12); }).join('');
  }

  /* ---- Zustand ---- */
  var el, api, sel, locked, mark, focusKey;     // sel: Liste von {c, r} in der Reihenfolge des Anklickens; mark: null | 'check' | 'solution'

  function reset() { sel = []; mark = null; focusKey = key(0, 0); }
  function idx(c, r) { for (var i = 0; i < sel.length; i++) if (sel[i].c === c && sel[i].r === r) return i; return -1; }
  function isRight() {
    return sel.length === 2 && sel.every(function (s) { return SOLKEYS.indexOf(key(s.c, s.r)) >= 0; });
  }
  function selNames() { return sel.map(function (s) { return name(s.c, s.r); }); }

  function board() {
    var s = givenMarks();
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      var on = idx(c, r) >= 0, k = key(c, r);
      var given = GIVEN.some(function (g) { return g.c === c && g.r === r; });
      var cls = 't-verstecke22-cell' + (on ? ' on' : '');
      if (on && mark) cls += SOLKEYS.indexOf(k) >= 0 ? ' right' : ' wrong';
      s += '<polygon class="' + cls + '" points="' + pts(POLY[r][c]) + '" data-c="' + c + '" data-r="' + r + '" role="checkbox" aria-checked="' + on + '"' +
        ' tabindex="' + (locked ? '-1' : (k === focusKey ? '0' : '-1')) + '" aria-label="Feld ' + name(c, r) + ', Spalte ' + COLS[c] + ', Zeile ' + (r + 1) +
        (given ? ', schon mit einem Kreuz markiert' : '') + ', ' + (on ? 'als Versteck gewählt' : 'nicht gewählt') + '"' + (locked ? ' aria-disabled="true"' : '') + '/>';
    }
    sel.forEach(function (q) {
      var m = centroid(POLY[q.r][q.c]);
      var cls = mark ? (SOLKEYS.indexOf(key(q.c, q.r)) >= 0 ? 'right' : 'wrong') : 'pick';
      s += cross(m[0], m[1], cls, 30, 12);
    });
    return frame(s, 'Karte mit 7 mal 7 Feldern, Spalten A bis G, Zeilen 1 bis 7', true);
  }

  function render() {
    var fig = h('div', { class: 't-verstecke22-fig' });
    fig.innerHTML = board();
    var status = sel.length === 0 ? 'Noch kein Feld gewählt.' :
      sel.length + ' von 2 Feldern gewählt: ' + selNames().join(' und ') + '.';
    el.replaceChildren(h('div', { class: 't-verstecke22-wrap' }, fig,
      h('p', { class: 't-verstecke22-status', 'aria-live': 'polite' }, status)));
  }

  function toggle(c, r) {
    var i = idx(c, r);
    if (i >= 0) sel.splice(i, 1);
    else { if (sel.length >= 2) sel.shift(); sel.push({ c: c, r: r }); }
    focusKey = key(c, r);
    render();
    refocus();
    api.changed();
  }
  function refocus() {
    var f = el.querySelector('[data-c="' + focusKey.split(',')[0] + '"][data-r="' + focusKey.split(',')[1] + '"]');
    if (f) f.focus({ preventScroll: true });
  }
  function onClick(e) {
    var t = e.target.closest('[data-c]');
    if (!t || locked) return;
    toggle(+t.dataset.c, +t.dataset.r);
  }
  function onKey(e) {
    var t = e.target.closest && e.target.closest('[data-c]');
    if (!t || locked) return;
    var c = +t.dataset.c, r = +t.dataset.r, d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (d) {
      e.preventDefault();
      c = Math.max(0, Math.min(N - 1, c + d[0])); r = Math.max(0, Math.min(N - 1, r + d[1]));
      focusKey = key(c, r);
      var all = el.querySelectorAll('[data-c]');
      for (var i = 0; i < all.length; i++) all[i].setAttribute('tabindex', all[i].dataset.c == c && all[i].dataset.r == r ? '0' : '-1');
      refocus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle(c, r);
    }
  }
  function onFocusIn(e) {
    var t = e.target.closest && e.target.closest('[data-c]');
    if (t && !locked) focusKey = key(+t.dataset.c, +t.dataset.r);
  }

  /* Erklärbild: ungerade Zeilen und Spalten gelb, die beiden Verstecke grün */
  function explainFigure() {
    var oddRow = [2, 5], oddCol = [2, 4], s = '<g class="t-verstecke22-stripes">';
    oddRow.forEach(function (r) { for (var c = 0; c < N; c++) s += '<polygon points="' + pts(POLY[r][c]) + '"/>'; });
    oddCol.forEach(function (c) { for (var r = 0; r < N; r++) s += '<polygon points="' + pts(POLY[r][c]) + '"/>'; });
    s += '</g>' + givenMarks();
    SOLUTION.forEach(function (q) { var m = centroid(POLY[q.r][q.c]); s += cross(m[0], m[1], 'right', 30, 12); });
    return '<div class="t-verstecke22-fig t-verstecke22-small">' + frame(s, 'Karte mit den vier markierten Feldern und den beiden Verstecken C3 und E6', false) + '</div>';
  }

  Biber.register({
    id: 'verstecke22',
    story: '<p>Biber Bilbo hat zwei gute Verstecke für sein Futter. Auf einer Karte markiert er die beiden Felder, in denen die Verstecke liegen, mit einem Kreuz. ' +
      'Aber was ist, wenn andere Biber die Karte und damit die Verstecke finden?</p>' +
      '<p>Zur Verwirrung markiert Bilbo weitere Felder mit einem Kreuz. Das macht er so, dass in <strong>jeder Zeile und jeder Spalte</strong> der Karte eine <strong>gerade Anzahl</strong> an Feldern markiert ist (oder gar keines).</p>' +
      '<p>Danach entfernt er die beiden Kreuze von den Feldern mit seinen Verstecken. Unten siehst du das Ergebnis.</p>',
    question: 'In welchen Feldern liegen Bilbos Verstecke?',
    howto: 'Tippe die beiden Felder an, in denen die Verstecke lagen. Nochmal tippen nimmt die Wahl zurück. Mit den Pfeiltasten kommst du von Feld zu Feld, Enter wählt.',
    explanation: function () {
      return '<p>Bevor Bilbo die Kreuze der Verstecke entfernt hat, war überall eine gerade Anzahl markiert. Jetzt ist die Anzahl nur in den Zeilen und Spalten ungerade, in denen ein Versteck lag: ' +
        'in den <strong>Zeilen 3 und 6</strong> und in den <strong>Spalten C und E</strong> (gelb).</p>' +
        explainFigure() +
        '<p>Jedes Versteck liegt in genau einer Zeile und einer Spalte. Die beiden Verstecke müssen also je eine der ungeraden Zeilen und je eine der ungeraden Spalten abdecken. ' +
        'Das geht nur mit <strong>C3 und E6</strong> oder mit E3 und C6. E3 trägt aber noch ein Kreuz, dort kann kein Versteck gewesen sein, denn die Kreuze der Verstecke wurden entfernt. ' +
        'Bilbos Verstecke liegen also in <strong>C3 und E6</strong>.</p>' +
        '<p><strong>Informatik:</strong> Das ist die Idee der <em>Paritätsbits</em>: Man fügt Daten zusätzliche Bits so hinzu, dass die Anzahl der Einsen immer gerade ist. ' +
        'Ändert sich später ein Bit, ist die Anzahl in seiner Zeile und Spalte ungerade und man kann das Feld finden. So lassen sich Übertragungsfehler erkennen und sogar korrigieren.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKey);
      el.addEventListener('focusin', onFocusIn);
      render();
    },
    isComplete: function () { return sel.length === 2; },
    evaluate: function () {
      return { correct: isRight(), answer: sel.map(function (s) { return name(s.c, s.r); }) };
    },
    setAnswer: function (ans) {
      sel = [];
      (ans || []).forEach(function (n) {
        var c = COLS.indexOf(String(n).charAt(0)), r = parseInt(String(n).slice(1), 10) - 1;
        if (c >= 0 && r >= 0 && r < N) sel.push({ c: c, r: r });
      });
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      sel = SOLUTION.map(function (s) { return { c: s.c, r: s.r }; });
      mark = 'solution'; locked = true;
      render();
    }
  });
})();
