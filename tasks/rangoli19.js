/* Aufgabe Rangoli (Biber 2019; Klasse 5-6 mittel): Welches Rangoli kann Indu mit ihren Fliesen legen? */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-rangoli19-';
  var COL = { p: 'purple', g: 'green', k: 'black' };

  /* Vorrat: Sorte -> Anzahl (lila Dreieck, grünes Quadrat, schwarzes Dreieck) */
  var STOCK = { p: 8, g: 4, k: 6 };
  var NAME = { p: 'lila Dreiecke', g: 'grüne Quadrate', k: 'schwarze Dreiecke' };

  /* Muster auf einem 4x4-Raster; ein Teil = [Farbe, Punkte]. Lila Dreieck = halbes Feld,
     grünes Quadrat = ein Feld, schwarzes Dreieck = Grundlinie 2, Höhe 1 (Fläche 1 Feld). */
  function sq(c, x, y) { return [c, [[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]]]; }
  function rect(c, x, y, w, hh) { return [c, [[x, y], [x + w, y], [x + w, y + hh], [x, y + hh]]]; }
  function poly(c, pts) { return [c, pts]; }
  function mirror(pts, mx, my) { return pts.map(function (p) { return [mx ? 4 - p[0] : p[0], my ? 4 - p[1] : p[1]]; }); }

  var BLACK_RING = [
    poly('k', [[1, 1], [3, 1], [2, 0]]), poly('k', [[1, 1], [1, 3], [0, 2]]),
    poly('k', [[3, 1], [3, 3], [4, 2]]), poly('k', [[1, 3], [3, 3], [2, 4]])
  ];
  var PURPLE_CORNERS = [sq('p', 0, 0), sq('p', 3, 0), sq('p', 0, 3), sq('p', 3, 3)];
  var STAR_P = [[0, 1], [1, 1], [1, 0], [2, 1], [1, 2]];

  var PATTERNS = {
    A: PURPLE_CORNERS.concat(BLACK_RING, [rect('g', 1, 1, 2, 2)]),
    B: [
      sq('g', 0, 0), sq('g', 3, 0), sq('g', 0, 3), sq('g', 3, 3),
      poly('k', [[1, 0], [3, 0], [2, 1]]), poly('k', [[1, 4], [3, 4], [2, 3]]),
      poly('k', [[0, 1], [0, 3], [1, 2]]), poly('k', [[4, 1], [4, 3], [3, 2]]),
      poly('k', [[2, 1], [3, 2], [2, 3], [1, 2]]),
      poly('p', STAR_P), poly('p', mirror(STAR_P, 1, 0)), poly('p', mirror(STAR_P, 0, 1)), poly('p', mirror(STAR_P, 1, 1))
    ],
    C: [
      poly('p', [[0, 0], [1, 0], [0, 1]]), poly('p', [[4, 0], [3, 0], [4, 1]]),
      poly('p', [[0, 4], [1, 4], [0, 3]]), poly('p', [[4, 4], [3, 4], [4, 3]]),
      rect('g', 1, 0, 2, 1), rect('g', 1, 3, 2, 1), rect('g', 0, 1, 1, 2), rect('g', 3, 1, 1, 2),
      rect('k', 1, 1, 2, 2)
    ],
    D: PURPLE_CORNERS.concat(BLACK_RING, [sq('p', 1, 1), sq('g', 2, 1), sq('g', 1, 2), sq('p', 2, 2)])
  };
  var KEYS = ['A', 'B', 'C', 'D'];

  function area(pts) {
    var s = 0, i, a, b;
    for (i = 0; i < pts.length; i++) {
      a = pts[i]; b = pts[(i + 1) % pts.length];
      s += a[0] * b[1] - b[0] * a[1];
    }
    return Math.abs(s) / 2;
  }
  /* Anzahl benötigter Fliesen je Sorte, aus der Geometrie berechnet */
  function needed(key) {
    var n = { p: 0, g: 0, k: 0 };
    PATTERNS[key].forEach(function (part) {
      var a = area(part[1]);
      n[part[0]] += part[0] === 'p' ? a / 0.5 : a;
    });
    return n;
  }
  function feasible(key) {
    var n = needed(key);
    return n.p <= STOCK.p && n.g <= STOCK.g && n.k <= STOCK.k;
  }
  var RIGHT = KEYS.filter(feasible);   /* per Skript: nur A; im Heft: Antwort A */

  function polyEl(c, pts, u, off) {
    return '<polygon class="' + P + COL[c] + '" points="' + pts.map(function (p) {
      return (off + p[0] * u).toFixed(1) + ',' + (off + p[1] * u).toFixed(1);
    }).join(' ') + '"/>';
  }
  function patternSvg(key, label) {
    var u = 20, off = 1;
    return '<svg class="' + P + 'pat" viewBox="0 0 82 82" role="img" aria-label="' + label + '"><rect class="' + P + 'bg" x="1" y="1" width="80" height="80"/>' +
      PATTERNS[key].map(function (part) { return polyEl(part[0], part[1], u, off); }).join('') + '</svg>';
  }
  /* Fliesen-Symbole (Kopf der Tabelle) */
  var TILE_SHAPE = {
    p: { w: 30, pts: [[0, 0], [30, 30], [0, 30]], label: 'lila Dreieck' },
    g: { w: 30, pts: [[0, 0], [30, 0], [30, 30], [0, 30]], label: 'grünes Quadrat' },
    k: { w: 60, pts: [[0, 30], [30, 0], [60, 30]], label: 'schwarzes Dreieck' }
  };
  function tileSvg(c) {
    var t = TILE_SHAPE[c];
    return '<svg class="' + P + 'tile" viewBox="-2 -2 ' + (t.w + 4) + ' 34" role="img" aria-label="' + t.label + '"><polygon class="' + P + COL[c] + '" points="' +
      t.pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' ') + '"/></svg>';
  }

  var el, api, radios, selected, locked, mark;
  function reset() { selected = null; mark = null; }

  function refresh() {
    radios.forEach(function (btn, i) {
      var on = selected === i, ok = RIGHT.indexOf(KEYS[i]) >= 0;
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
    else if (k === ' ' || k === 'Enter') { e.preventDefault(); choose(i, false); return; }
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }

  function stockTable() {
    var cells = ['p', 'g', 'k'].map(function (c) { return '<td>' + tileSvg(c) + '</td>'; }).join('');
    var nums = ['p', 'g', 'k'].map(function (c) { return '<td>' + STOCK[c] + '</td>'; }).join('');
    var d = h('div', { class: P + 'stock' });
    d.innerHTML = '<table><caption class="' + P + 'sr">Indus Fliesen</caption><tbody><tr><th scope="row">Sorte</th>' + cells + '</tr><tr><th scope="row">Anzahl</th>' + nums + '</tr></tbody></table>';
    return d;
  }

  Biber.register({
    id: 'rangoli19',
    story:
      '<p>Rangoli sind kunstvolle Bodenmuster. Man kann sie zum Beispiel mit bunten Fliesen legen. Indu hat drei verschiedene Sorten Fliesen: 8 lila Dreiecke, 4 grüne Quadrate und 6 schwarze Dreiecke.</p>' +
      '<p>Indu möchte mit ihren Fliesen ein Rangoli legen. Sie muss aber nicht alle Fliesen benutzen.</p>',
    question: 'Welches Rangoli kann Indu mit ihren Fliesen legen?',
    howto: 'Wähle ein Rangoli. Die Tabelle zeigt, welche Fliesen Indu hat. Zwei lila Dreiecke ergeben ein Quadrat, ein grünes Quadrat ist genau so groß.',
    explanation: function () {
      var rows = KEYS.map(function (k) {
        var n = needed(k), ok = feasible(k), why = '';
        if (!ok) {
          why = ['p', 'g', 'k'].filter(function (c) { return n[c] > STOCK[c]; }).map(function (c) {
            return 'sie hat nur ' + STOCK[c] + ' ' + NAME[c];
          }).join(', ');
        }
        return '<tr><th scope="row">' + k + '</th><td>' + n.p + ' lila, ' + n.g + ' grün, ' + n.k + ' schwarz</td><td>' + (ok ? 'Ja, sie hat genug Fliesen von jeder Sorte.' : 'Nein, ' + why + '.') + '</td></tr>';
      }).join('');
      return '<p>Man zerlegt jedes Muster in die vorhandenen Grundformen und zählt, wie viele Fliesen von jeder Sorte nötig sind. Dann vergleicht man mit Indus Vorrat (8 lila Dreiecke, 4 grüne Quadrate, 6 schwarze Dreiecke).</p>' +
        '<div class="' + P + 'tablewrap"><table class="' + P + 'result"><thead><tr><th scope="col">Rangoli</th><th scope="col">Benötigte Fliesen</th><th scope="col">Reicht der Vorrat?</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<p>Nur <strong>Rangoli A</strong> kann Indu legen. Eine große Form in kleinere Teile zu zerlegen, die man mit bekannten Bausteinen abgleichen kann, heißt in der Informatik <strong>Dekomposition</strong>. Man nutzt sie zum Beispiel, wenn ein Programm in überschaubare Teilfunktionen zerlegt wird, die man einzeln leichter testen kann.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      radios = KEYS.map(function (k, i) {
        var n = needed(k);
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': k,
          'aria-label': 'Rangoli ' + k + ' (braucht ' + n.p + ' lila Dreiecke, ' + n.g + ' grüne Quadrate und ' + n.k + ' schwarze Dreiecke)',
          onclick: function () { choose(i, false); }, onkeydown: onKey
        });
        btn.innerHTML = '<span class="' + P + 'key" aria-hidden="true">' + k + ')</span>' + patternSvg(k, 'Rangoli ' + k);
        return btn;
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        stockTable(),
        h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Rangoli A bis D' }, radios)));
      refresh();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () {
      return { correct: RIGHT.indexOf(KEYS[selected]) >= 0, answer: { choice: KEYS[selected] } };
    },
    setAnswer: function (ans) {
      var i = KEYS.indexOf(ans && ans.choice);
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
    showSolution: function () { selected = KEYS.indexOf(RIGHT[0]); mark = 'solution'; locked = true; refresh(); }
  });
})();
