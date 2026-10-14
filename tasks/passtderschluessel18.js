/* Aufgabe Passt der Schlüssel? (Heft 2018, Klasse 3-4 schwer, 5-6 einfach): Repräsentation, Mustervergleich, Suchfunktion */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-passtderschluessel18-';

  /* ---------- Aufgabendaten ----------
     Länge der unteren Schlüsselstifte in Kästchen (Spalte 1 bis 4, von links nach rechts) und Höhe der Bartteile.
     Stift und Bartteil ergänzen sich in jeder Spalte zu drei Kästchen (= Abstand Boden bis Trennlinie). */
  var TOTAL = 3, COLS = 4, ROWS = 3;
  var EXAMPLE_PINS = [2, 3, 3, 1];
  var EXAMPLE_BITS = [1, 0, 0, 2];
  var PINS = [2, 3, 1, 2];
  var RIGHT = PINS.map(function (p) { return TOTAL - p; });   /* [1, 0, 2, 1], wie im Heft */
  if (RIGHT.join() !== '1,0,2,1' || EXAMPLE_PINS.some(function (p, i) { return p + EXAMPLE_BITS[i] !== TOTAL; })) throw new Error('passtderschluessel18: Lösung stimmt nicht');

  /* ---------- Geometrie des Schlosses (SVG-Einheiten) ---------- */
  var U = 26, CW = 44, X0 = 38, YT = 28, YB = 232, SH = YB - TOTAL * U, DRV = 46, PW = 32;

  function spring(cx, y0, y1) {
    var len = y1 - y0;
    if (len < 6) return '';
    var n = Math.max(4, Math.round(len / 6)), d = 'M' + cx + ' ' + y0;
    for (var k = 1; k <= n; k++) d += ' L' + (cx + (k % 2 ? 11 : -11)) + ' ' + (y0 + len * k / n);
    return '<path d="' + d + '" class="' + P + 'spring"/>';
  }
  function ring(cx, cy, rx, ry) {
    function el(a, b) { return 'M' + (cx - a) + ' ' + cy + ' a' + a + ' ' + b + ' 0 1 0 ' + (2 * a) + ' 0 a' + a + ' ' + b + ' 0 1 0 ' + (-2 * a) + ' 0 Z'; }
    return '<path d="' + el(rx, ry) + ' ' + el(rx - 14, ry - 16) + '" fill-rule="evenodd" class="' + P + 'key"/>';
  }
  /* Schlüsselprofil: Schaft ab xs, Bartteile in den vier Spalten ab xg, Oberkante des Schafts bei y0 */
  function keyShape(xs, xg, y0, bits) {
    var d = 'M' + xs + ' ' + y0 + ' L' + xg + ' ' + y0;
    bits.forEach(function (b, i) {
      var x = xg + CW * i, y = y0 - b * U;
      d += ' L' + x + ' ' + y + ' L' + (x + CW) + ' ' + y;
    });
    d += ' L' + (xg + CW * COLS) + ' ' + (y0 + 26) + ' L' + xs + ' ' + (y0 + 26) + ' Z';
    return '<path d="' + d + '" class="' + P + 'key"/>';
  }
  function badge(cx, cy, kind, txt) {
    return '<g class="' + P + 'bd ' + P + kind + '"><circle cx="' + cx + '" cy="' + cy + '" r="9"/><text x="' + cx + '" y="' + (cy + 4.5) + '" text-anchor="middle">' + txt + '</text></g>';
  }
  function numRow(x0, y, marks) {
    var s = '';
    for (var i = 0; i < COLS; i++) {
      var cx = x0 + CW * i + CW / 2;
      if (marks && marks[i] != null) s += badge(cx, y, marks[i] ? 'ok' : 'bad', marks[i] ? '✓' : '✗');
      else s += '<text x="' + cx + '" y="' + (y + 4.5) + '" text-anchor="middle" class="' + P + 'num">' + (i + 1) + '</text>';
    }
    return s;
  }

  /* Schloss; bits = null: Schlüssel steckt nicht; sonst Schlüssel steckt und schiebt die Stifte nach oben */
  function lockBody(pins, bits, marks) {
    var s = '<rect x="10" y="6" width="230" height="' + (SH - 8) + '" class="' + P + 'hs"/>' +
      '<rect x="10" y="' + (SH + 2) + '" width="230" height="' + (282 - SH - 2) + '" class="' + P + 'hs"/>' +
      '<rect x="' + X0 + '" y="' + YT + '" width="' + (CW * COLS) + '" height="' + (YB - YT) + '" class="' + P + 'ch"/>' +
      '<rect x="10" y="' + YB + '" width="' + (X0 + CW * COLS - 10) + '" height="34" class="' + P + 'ch"/>';
    pins.forEach(function (p, i) {
      var b = bits ? bits[i] : 0, x = X0 + (CW - PW) / 2 + CW * i;
      var bottom = YB - b * U, top = bottom - p * U, dtop = top - DRV;
      s += spring(x + PW / 2, YT, dtop) +
        '<rect x="' + x + '" y="' + dtop + '" width="' + PW + '" height="' + DRV + '" class="' + P + 'dp"/>' +
        '<rect x="' + x + '" y="' + top + '" width="' + PW + '" height="' + (bottom - top) + '" class="' + P + 'kp"/>';
    });
    return s + numRow(X0, 17, marks);
  }
  function lockLabel(pins) {
    return 'Schloss mit vier Stiften. Die unteren Schlüsselstifte sind von links nach rechts ' + pins.join(', ') + ' Kästchen lang.';
  }
  function lockSvg(pins, label) {
    return '<svg class="' + P + 'svg" viewBox="0 0 250 290" role="img" aria-label="' + (label || lockLabel(pins)) + '" focusable="false">' + lockBody(pins, null) + '</svg>';
  }
  function keySvg(bits, label) {
    return '<svg class="' + P + 'svg" viewBox="0 0 330 176" role="img" aria-label="' + label + '" focusable="false">' +
      keyShape(66, 140, 118, bits) + ring(40, 131, 32, 40) + '</svg>';
  }
  /* Schlüssel steckt im Schloss: rechnet nach, ob alle vier Stifte an der Trennlinie enden */
  function fits(pins, bits) { return pins.every(function (p, i) { return p + bits[i] === TOTAL; }); }
  function insertedSvg(pins, bits) {
    var marks = pins.map(function (p, i) { return p + bits[i] === TOTAL; });
    var good = marks.every(Boolean), c = good ? 'ok' : 'bad';
    var shackle = good ? 'M-57 ' + (SH - 6) + ' v-12 a12 12 0 0 1 24 0 v4' : 'M-57 ' + (SH - 6) + ' v-12 a12 12 0 0 1 24 0 v12';
    var s = lockBody(pins, bits, marks) + keyShape(-62, X0, YB, bits) + ring(-92, YB + 13, 34, 44) +
      (good ? '<path d="M-30 ' + SH + ' H10 M240 ' + SH + ' H268" class="' + P + 'sl"/>' : '') +
      '<path d="' + shackle + '" class="' + P + 'sh ' + P + 's' + c + '"/><rect x="-61" y="' + (SH - 6) + '" width="30" height="24" rx="4" class="' + P + 'lk ' + P + 's' + c + '"/>' +
      '<circle cx="-46" cy="' + (SH + 4) + '" r="3.5" class="' + P + 'kh"/>';
    var label = 'Schlüssel im Schloss. Die Bartteile sind von links nach rechts ' + bits.join(', ') + ' Kästchen hoch. ' +
      (good ? 'Alle vier Stifte enden genau an der Trennlinie: Das Schloss ist offen.' : 'Nicht alle Stifte enden an der Trennlinie (Spalte ' +
        marks.map(function (m, i) { return m ? 0 : i + 1; }).filter(Boolean).join(', ') + '): Der Schlüssel klemmt.');
    return '<svg class="' + P + 'svg" viewBox="-135 0 410 300" role="img" aria-label="' + label + '" focusable="false">' + s + '</svg>';
  }

  /* ---------- Zustand ---------- */
  var el, api, locked, bits, mode, keyHost, cells;

  function marks() {
    if (!mode) return null;
    return bits.map(function (b, i) { return mode === 'solution' ? true : b === RIGHT[i]; });
  }
  function render() {
    var m = marks();
    var key = keyShape(66, 140, 118, bits) + ring(40, 131, 32, 40);
    var grid = '';
    for (var c = 0; c < COLS; c++) for (var r = 1; r <= ROWS; r++) {
      grid += '<rect x="' + (140 + CW * c) + '" y="' + (118 - r * U) + '" width="' + CW + '" height="' + U + '" class="' + P + 'gc' + (bits[c] >= r ? ' ' + P + 'on' : '') + '"/>';
    }
    keyHost.innerHTML = '<svg class="' + P + 'svg" viewBox="0 0 330 176" aria-hidden="true" focusable="false">' + grid + key + numRow(140, 24, m) + '</svg>';
    cells.forEach(function (b) {
      var c = +b.getAttribute('data-c'), r = +b.getAttribute('data-r'), on = bits[c] >= r;
      b.setAttribute('aria-pressed', String(on));
      b.disabled = !!locked;
      b.setAttribute('aria-label', 'Spalte ' + (c + 1) + ', Kästchen ' + r + ' von unten: ' + (on ? 'ausgefüllt' : 'leer'));
    });
  }
  function toggle(c, r) {
    if (locked) return;
    bits[c] = bits[c] >= r ? r - 1 : r;
    render();
    var b = cells.filter(function (x) { return +x.getAttribute('data-c') === c && +x.getAttribute('data-r') === r; })[0];
    if (b) b.focus();
    api.changed('Bartteile von links nach rechts: ' + bits.join(', ') + ' Kästchen hoch.');
  }
  function onKey(e) {
    var d = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[e.key];
    var t = e.target.closest && e.target.closest('[data-c]');
    if (!d || !t) return;
    var c = +t.getAttribute('data-c') + d[0], r = +t.getAttribute('data-r') + d[1];
    if (c < 0 || c >= COLS || r < 1 || r > ROWS) return;
    var n = cells.filter(function (x) { return +x.getAttribute('data-c') === c && +x.getAttribute('data-r') === r; })[0];
    if (n) { n.focus(); e.preventDefault(); }
  }

  function figure(svg, cap) { return '<figure class="' + P + 'fig"><div class="' + P + 'pic">' + svg + '</div><figcaption>' + cap + '</figcaption></figure>'; }

  Biber.register({
    id: 'passtderschluessel18',
    story: '<p>Dieser Schlüssel passt in dieses Schloss. Beim Einschieben drückt der Bart des Schlüssels die Stifte im Schloss nach oben. ' +
      'Der Schlüssel passt, wenn alle Stifte genau an der Trennlinie (grüne Linie) enden. Dann lässt sich das Schloss öffnen.</p>' +
      '<div class="' + P + 'ex">' +
      figure(keySvg(EXAMPLE_BITS, 'Schlüssel mit Bartteilen von links nach rechts ' + EXAMPLE_BITS.join(', ') + ' Kästchen hoch.'), 'Dieser Schlüssel passt …') +
      figure(lockSvg(EXAMPLE_PINS), '… in dieses Schloss.') +
      figure(insertedSvg(EXAMPLE_PINS, EXAMPLE_BITS), 'Hier siehst du warum.') + '</div>' +
      '<p>Hier ist ein anderes Schloss:</p>',
    question: 'Wie muss der Schlüssel aussehen, damit er in dieses Schloss passt?',
    howto: 'Klicke auf die Kästchen über dem Schlüssel, bis der Schlüssel passt. Ein Kästchen anklicken füllt die Spalte bis dorthin auf, ein gefülltes Kästchen anklicken macht es und die Kästchen darüber wieder leer.',
    explanation: function () {
      var mine = bits.slice(), ok = fits(PINS, mine);
      var out = '<p>Die Bartteile des Schlüssels müssen das Gegenstück zu den Stiften des Schlosses bilden: ' +
        'Je kürzer der Schlüsselstift in einer Spalte ist, desto länger muss das Bartteil sein. In jeder Spalte ergeben Stift und Bartteil zusammen drei Kästchen. ' +
        'Die Stifte sind hier von links nach rechts ' + PINS.join(', ') + ' Kästchen lang, also müssen die Bartteile ' + RIGHT.join(', ') + ' Kästchen hoch sein.</p>';
      out += '<div class="' + P + 'ex">';
      if (!ok && mine.some(Boolean)) out += figure(insertedSvg(PINS, mine), 'Dein Schlüssel klemmt.');
      out += figure(insertedSvg(PINS, RIGHT), 'So passt der Schlüssel.') + '</div>';
      out += '<p><b>Informatik:</b> Der Schlüssel passt, wenn jedes Teil seines Barts zum zugehörigen Teil im Schloss passt. Das Muster der Bartteile muss also zum Muster der Schlossteile passen. ' +
        'Dieser <i>Mustervergleich</i> (englisch „pattern matching“) steckt in vielen Systemen: Jede Suchfunktion muss in Texten, Webseiten oder anderen Daten die Stellen finden, die zum Suchmuster passen. ' +
        'Besonders nützlich ist es, wenn das Muster nur ungefähr passen muss, zum Beispiel wie bei einem Generalschlüssel oder bei einer Suchmaschine, die auch falsch geschriebene Wörter findet.</p>';
      return out;
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; bits = [0, 0, 0, 0]; mode = null; cells = [];
      keyHost = h('div', { class: P + 'host' });
      var overlay = h('div', { class: P + 'cells', role: 'group', 'aria-label': 'Bartteile des Schlüssels, vier Spalten mit je drei Kästchen', onkeydown: onKey });
      for (var c = 0; c < COLS; c++) for (var r = 1; r <= ROWS; r++) {
        var b = h('button', {
          type: 'button', class: P + 'cell', 'data-c': String(c), 'data-r': String(r),
          style: 'left:' + ((140 + CW * c) / 330 * 100) + '%;top:' + ((118 - r * U) / 176 * 100) + '%;width:' + (CW / 330 * 100) + '%;height:' + (U / 176 * 100) + '%',
          onclick: (function (cc, rr) { return function () { toggle(cc, rr); }; })(c, r)
        });
        cells.push(b); overlay.appendChild(b);
      }
      var lockBox = h('div', { class: P + 'pic ' + P + 'lockbox' });
      lockBox.innerHTML = lockSvg(PINS);
      el.replaceChildren(h('div', { class: P + 'board' },
        h('div', { class: P + 'panel ' + P + 'kp-panel' }, h('h3', null, 'Schlüssel'), h('div', { class: P + 'keybox' }, keyHost, overlay)),
        h('div', { class: P + 'panel ' + P + 'lk-panel' }, h('h3', null, 'Schloss'), lockBox)));
      render();
    },
    isComplete: function () { return bits.some(Boolean); },
    evaluate: function () { return { correct: bits.join() === RIGHT.join(), answer: bits.slice() }; },
    setAnswer: function (ans) {
      bits = Array.isArray(ans) && ans.length === COLS ? ans.map(function (v) { return Math.max(0, Math.min(ROWS, v | 0)); }) : [0, 0, 0, 0];
      mode = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mode = on ? (mode || 'check') : null;
      render();
    },
    reset: function () { bits = [0, 0, 0, 0]; mode = null; render(); },
    showSolution: function () { bits = RIGHT.slice(); mode = 'solution'; locked = true; render(); }
  });
})();
