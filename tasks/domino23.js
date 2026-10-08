/* Aufgabe Domino (Biber 2023, S. 23; Klasse 11-13 schwer): welche Dominosteine können nicht an den Rand einer Reihe? (Eulerweg, Grad der Knoten) */
(function () {
  'use strict';
  var h = Biber.h, svg = Biber.svg;
  var P = 't-domino23-';

  /* die acht Steine in der Reihenfolge des Heftbilds (oberes Feld, unteres Feld) */
  var STONES = [[5, 4], [1, 5], [4, 1], [5, 2], [1, 2], [6, 2], [5, 3], [6, 3]];
  var TILT = [-13, 5, -8, 9, -11, 3, 11, -6];
  /* Muster der Augen auf einem 3x3-Raster (Spalte, Zeile) */
  var PIPS = {
    1: [[1, 1]], 2: [[0, 0], [2, 2]], 3: [[0, 0], [1, 1], [2, 2]], 4: [[0, 0], [2, 0], [0, 2], [2, 2]],
    5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], 6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]]
  };

  /* Lösung: Ein Stein kann am Rand liegen, wenn ein Feld eine Augenzahl mit ungerader Häufigkeit hat. Berechnet statt fest eingetragen: */
  var COUNT = {};
  STONES.forEach(function (s) { s.forEach(function (v) { COUNT[v] = (COUNT[v] || 0) + 1; }); });
  function odd(v) { return COUNT[v] % 2 === 1; }
  var RIGHT = STONES.map(function (s, i) { return (!odd(s[0]) && !odd(s[1])) ? i : -1; }).filter(function (i) { return i >= 0; });
  /* offizielle Lösung (Heft S. 23/24): der erste, der siebte und der achte Stein, also [0, 6, 7]; Brute Force über alle 32 gültigen Reihen bestätigt das */

  var el, api, locked, marked, mark;

  function half(v, y0) {
    return PIPS[v].map(function (p) { return svg('circle', { cx: 16 + p[0] * 14, cy: y0 + 10 + p[1] * 14, r: 4.6, class: P + 'pip' }); });
  }
  function stoneSvg(s) {
    var root = svg('svg', { viewBox: '0 0 60 112', class: P + 'svg', 'aria-hidden': 'true', focusable: 'false' },
      svg('rect', { x: 2, y: 2, width: 56, height: 108, rx: 9, class: P + 'body' }),
      svg('line', { x1: 8, y1: 56, x2: 52, y2: 56, class: P + 'mid' }));
    half(s[0], 6).concat(half(s[1], 58)).forEach(function (c) { root.appendChild(c); });
    return root;
  }
  function nameOf(i) { return 'Stein ' + (i + 1) + ': oben ' + STONES[i][0] + ', unten ' + STONES[i][1] + ' Augen'; }

  function render() {
    var btns = STONES.map(function (s, i) {
      var on = marked.indexOf(i) >= 0;
      var cls = P + 'stone' + (on ? ' on' : '');
      var note = '';
      if (mark === 'check' || mark === 'solution') {
        var should = RIGHT.indexOf(i) >= 0;
        if (on && should) { cls += ' right'; note = ', richtig markiert'; }
        else if (on && !should) { cls += ' wrong'; note = ', falsch markiert: dieser Stein kann am Rand liegen'; }
        else if (!on && should) { cls += ' miss'; note = ', fehlt: dieser Stein kann nicht am Rand liegen'; }
      }
      return h('button', {
        type: 'button', class: cls, 'data-i': String(i), disabled: locked, 'aria-pressed': String(on),
        'aria-label': nameOf(i) + (on ? ', markiert' : '') + note, style: '--tilt:' + TILT[i] + 'deg'
      }, stoneSvg(s), h('span', { class: P + 'badge', 'aria-hidden': 'true' }));
    });
    el.replaceChildren(h('div', { class: P + 'box' },
      h('div', { class: P + 'row', role: 'group', 'aria-label': 'Die acht Dominosteine' }, btns),
      h('p', { class: P + 'count', 'aria-live': 'polite' },
        marked.length ? marked.length + (marked.length === 1 ? ' Stein markiert' : ' Steine markiert') + ' (sie können nicht an den Anfang oder das Ende).' : 'Tippe die Steine an, die nicht an den Anfang oder das Ende der Reihe passen.')));
  }

  function onClick(e) {
    var b = e.target.closest('[data-i]');
    if (!b || locked) return;
    var i = +b.dataset.i, k = marked.indexOf(i);
    if (k >= 0) marked.splice(k, 1); else marked.push(i);
    marked.sort(function (a, c) { return a - c; });
    render();
    var f = el.querySelector('[data-i="' + i + '"]');
    if (f) f.focus({ preventScroll: true });
    api.changed();
  }

  function sameSet(a, b) { return a.length === b.length && a.every(function (v, i) { return v === b[i]; }); }

  Biber.register({
    id: 'domino23',
    story: '<p>Jeder Dominostein hat zwei Felder. Auf jedem Feld sind 1 bis 6 Punkte. Du hast diese acht Steine:</p>' +
      '<p class="' + P + 'steine">' + STONES.map(function (s) { return '<b>' + s[0] + '|' + s[1] + '</b>'; }).join(', ') + ' (oben|unten, wie im Bild unten)</p>' +
      '<p>Alle acht Steine sollst du so in eine Reihe legen, dass auf den angrenzenden Feldern zweier benachbarter Steine immer gleich viele Punkte sind. Du kannst mehrere solcher Reihen legen. Es gibt aber Steine, die du auf keinen Fall an den Anfang oder das Ende deiner Reihe legen kannst.</p>',
    question: 'Welche Steine sind das?',
    howto: 'Tippe die Steine an, die nie am Anfang oder Ende der Reihe liegen können. Noch einmal tippen nimmt die Markierung weg.',
    explanation: function () {
      var rows = [1, 2, 3, 4, 5, 6].map(function (v) { return '<tr><td>' + v + '</td><td>' + COUNT[v] + '</td><td>' + (odd(v) ? 'ungerade' : 'gerade') + '</td></tr>'; }).join('');
      return '<p>Es sind der <b>erste, der siebte und der achte Stein</b> (5|4, 5|3 und 6|3). Wir zählen, wie oft jede Augenzahl auf den 16 Feldern vorkommt:</p>' +
        '<table class="' + P + 'tab"><thead><tr><th>Augenzahl</th><th>Häufigkeit</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<p>In der Mitte der Reihe stoßen Felder mit gleicher Augenzahl paarweise aneinander. Eine Augenzahl, die ungerade oft vorkommt (hier 1 und 2), bleibt deshalb einmal übrig und muss an einem Ende der Reihe stehen. Steine, deren beide Felder zu geraden Häufigkeiten gehören, können also nicht am Rand liegen.</p>' +
        '<p>Als Graph gezeichnet sind die Augenzahlen Knoten und die Steine Kanten. Eine Reihe aus allen Steinen ist ein Weg, der jede Kante genau einmal benutzt: ein <i>Eulerweg</i>. Er kann nur bei den Knoten mit ungerader Kantenzahl beginnen und enden.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; marked = []; mark = null;
      el.addEventListener('click', onClick);
      render();
    },
    isComplete: function () { return marked.length > 0; },
    evaluate: function () { return { correct: sameSet(marked, RIGHT), answer: marked.slice() }; },
    setAnswer: function (ans) { marked = ans.slice(); mark = null; render(); },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      render();
    },
    reset: function () { marked = []; mark = null; render(); },
    showSolution: function () { marked = RIGHT.slice(); mark = 'solution'; render(); }
  });
})();
