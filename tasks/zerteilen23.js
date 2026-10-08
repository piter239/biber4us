/* Aufgabe Zerteile den Code (Heft 2023, S. 66; Klasse 11-13): Präfixcode zerlegen */
(function () {
  'use strict';
  var h = Biber.h;

  var DIGITS = '12112233321';           /* MEMORY, codiert */
  var WORD = 'MEMORY';
  var SOL = [1, 3, 4, 6, 8];            /* Heft: 1 | 21 | 1 | 22 | 33 | 321 (Schnitte nach der 1., 3., 4., 6., 8. Ziffer) */
  var NCUTS = WORD.length - 1;

  var el, api, cuts, locked, mark;      /* cuts: sortierte Positionen 1..10; mark: null | 'check' | 'solution' */

  function reset() { cuts = []; mark = null; }
  function parts(c) {
    var p = [0].concat(c, [DIGITS.length]), out = [];
    for (var i = 0; i < p.length - 1; i++) out.push(DIGITS.slice(p[i], p[i + 1]));
    return out;
  }
  function same(a, b) { return a.length === b.length && a.every(function (v, i) { return v === b[i]; }); }
  function ok() { return same(cuts, SOL); }

  function status() {
    var n = cuts.length;
    return n + ' von ' + NCUTS + ' Trennstrichen gesetzt.';
  }

  function toggle(pos) {
    if (locked) return;
    var i = cuts.indexOf(pos);
    if (i >= 0) cuts.splice(i, 1); else { cuts.push(pos); cuts.sort(function (a, b) { return a - b; }); }
    mark = null;
    render();
    var b = el.querySelector('[data-cut="' + pos + '"]');
    if (b) b.focus();
    api.changed(status());
  }

  function render() {
    var cells = DIGITS.split('').map(function (d, i) {
      var pos = i + 1, on = cuts.indexOf(pos) >= 0;
      var gap = null;
      if (pos < DIGITS.length) {
        var cls = 't-zerteilen23-cut' + (on ? ' on' : '');
        if (mark && on) cls += (SOL.indexOf(pos) >= 0 ? ' right' : ' wrong');
        gap = h('button', {
          type: 'button', class: cls, 'data-cut': String(pos), disabled: locked, 'aria-pressed': String(on),
          'aria-label': 'Trennstrich zwischen Ziffer ' + pos + ' (' + d + ') und Ziffer ' + (pos + 1) + ' (' + DIGITS.charAt(pos) + ')'
        }, h('span', { class: 't-zerteilen23-bar', 'aria-hidden': 'true' }));
      }
      return h('div', { class: 't-zerteilen23-cell' }, h('span', { class: 't-zerteilen23-digit', 'aria-hidden': 'true' }, d), gap);
    });
    var ps = parts(cuts);
    var chips = ps.map(function (p, i) {
      var letter = ps.length === WORD.length ? WORD.charAt(i) : null;
      return h('span', { class: 't-zerteilen23-chip' }, letter ? h('b', null, letter) : null, h('span', null, p));
    });
    el.replaceChildren(h('div', { class: 't-zerteilen23-board' },
      h('div', { class: 't-zerteilen23-word' }, 'Wort: ', h('b', null, WORD)),
      h('div', { class: 't-zerteilen23-digits', role: 'group', 'aria-label': 'Ziffernfolge ' + DIGITS.split('').join(' ') + ' mit Stellen für Trennstriche' }, cells),
      h('p', { class: 't-zerteilen23-lab' }, 'So zerlegt, ergeben sich diese Codewörter:'),
      h('div', { class: 't-zerteilen23-chips' + (mark ? (ok() || mark === 'solution' ? ' right' : ' wrong') : ''), 'aria-live': 'polite' }, chips)));
  }

  Biber.register({
    id: 'zerteilen23',
    story: '<p>In einem speziellen Code für Texte wird jeder Buchstabe durch ein Codewort aus den Ziffern 0 bis 9 kodiert. Dabei gilt diese Regel: <b>Kein Codewort darf mit dem Codewort eines anderen Buchstabens beginnen.</b></p>' +
      '<p>Der Buchstabe <b>X</b> wird zum Beispiel durch <b>12</b> kodiert. Nun kann <b>Y</b> durch <b>2</b> kodiert werden, denn 12 beginnt nicht mit 2 (und 2 nicht mit 12). Jetzt kann <b>Z</b> durch <b>11</b> kodiert werden, denn weder 12 noch 2 beginnen mit 11, und 11 beginnt weder mit 12 noch mit 2. <b>21</b> wäre dagegen nicht erlaubt, weil es mit 2 beginnt, dem Codewort von Y.</p>' +
      '<p>Das Wort <b>MEMORY</b> wird durch die Ziffernfolge <b>12112233321</b> kodiert.</p>',
    question: 'Teile die Ziffernfolge in die Codewörter der einzelnen Buchstaben!',
    howto: 'Tippe zwischen zwei Ziffern, um einen Trennstrich zu setzen. Tippe den Strich noch einmal an, um ihn zu entfernen. Du brauchst einen Strich weniger, als das Wort Buchstaben hat.',
    explanation: function () {
      return '<p>Richtig ist <b>1 | 21 | 1 | 22 | 33 | 321</b>, also M = 1, E = 21, O = 22, R = 33, Y = 321.</p>' +
        '<p>Die Folge beginnt mit M. Wäre M = 12, müsste E nur aus der 1 bestehen, und die beginnt auch das zweite M. Das verstößt gegen die Regel. Auch längere Anfangsstücke kommen nicht in Frage, denn M müsste dann zweimal in der Folge stehen. Also ist M = 1. ' +
        'E steht zwischen den beiden M, und das kann nur 21 sein (2 allein würde mit MEMM beginnen, 211223332 ließe nur MEM übrig). Im Rest 2233321 kann O nicht nur 2 sein, sonst gäbe es OO, also beginnt O mit 22. Am Ende sind 1 und 21 schon vergeben, also muss Y mindestens 321 sein. Dazwischen bleibt 33 für R.</p>' +
        '<p>Ein Code, bei dem kein Codewort der Anfang eines anderen ist, heißt <i>Präfixcode</i>. Man braucht keine Trennzeichen, weil man immer erkennt, wo ein Codewort endet. Häufige Buchstaben bekommen kurze Codewörter, das spart Platz. Die Huffman-Kodierung findet solche Codes und steckt zum Beispiel in JPEG und MP3.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', function (e) {
        var b = e.target.closest('[data-cut]');
        if (b && !locked) toggle(+b.dataset.cut);
      });
      render();
    },
    isComplete: function () { return cuts.length === NCUTS; },
    evaluate: function () { return { correct: ok(), answer: cuts.slice() }; },
    setAnswer: function (ans) { cuts = ans.slice(); mark = 'check'; render(); },
    lock: function (on) {
      locked = on;
      if (on) { if (mark !== 'solution') mark = 'check'; } else mark = null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () { cuts = SOL.slice(); mark = 'solution'; render(); }
  });
})();
