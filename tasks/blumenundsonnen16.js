/* Aufgabe Blumen und Sonnen (Heft 2016, S. 12; Klasse 5-6 schwer, 7-8 einfach): Codierung, Präfixcode.
   Lösung laut Heft: Antwort A (Abby). Selbstprüfung beim Laden: nur Abby ergibt genau die gestempelte Folge. */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-blumenundsonnen16-';

  /* S = Sonne, F = Blume (Flower): Codetabelle aus dem Heft */
  var CODE = { B: 'F', A: 'SS', R: 'SFS', E: 'SFFF', Y: 'SFFS' };
  var LETTERS = ['B', 'A', 'R', 'E', 'Y'];
  var OPTIONS = ['Abby', 'Arya', 'Barry', 'Ray'];
  var RIGHT = 0;
  var STAMPED = 'SSFFSFFS';          /* die gestempelte Folge des Freundes */
  var BARBARA = 'FSSSFSFSSSFSSS';    /* Barbaras eigener Name, wie im Heft gezeigt */

  function encode(word) {
    return word.toUpperCase().split('').map(function (c) { return CODE[c]; }).join('');
  }
  /* Selbstprüfung: Präfixcode, Barbara richtig codiert, nur Antwort A passt */
  LETTERS.forEach(function (a) {
    LETTERS.forEach(function (b) {
      if (a !== b && CODE[a].indexOf(CODE[b]) === 0) throw new Error('blumenundsonnen16: kein Präfixcode');
    });
  });
  if (encode('Barbara') !== BARBARA) throw new Error('blumenundsonnen16: Barbara stimmt nicht');
  OPTIONS.forEach(function (o, i) {
    if ((encode(o) === STAMPED) !== (i === RIGHT)) throw new Error('blumenundsonnen16: Lösung stimmt nicht');
  });

  var SUN = '<svg class="' + P + 'sym" viewBox="0 0 40 40" aria-hidden="true" focusable="false">' +
    '<g stroke="#e0a526" stroke-width="1.6" stroke-linecap="round" opacity="0.75">' +
    [0, 45, 90, 135, 180, 225, 270, 315].map(function (a) { return '<line x1="20" y1="6.5" x2="20" y2="2.5" transform="rotate(' + a + ' 20 20)"/>'; }).join('') +
    '</g><circle cx="20" cy="20" r="9.5" fill="#fdd52f" stroke="#7a6310" stroke-width="1"/></svg>';
  var FLOWER = '<svg class="' + P + 'sym" viewBox="0 0 40 40" aria-hidden="true" focusable="false">' +
    '<path d="M20 21 C19 28 17 33 15.5 38" fill="none" stroke="#4f8f7e" stroke-width="1.4" stroke-linecap="round"/>' +
    [0, 72, 144, 216, 288].map(function (a) { return '<path d="M20 20 C13.5 14 15 6 20 2.5 C25 6 26.5 14 20 20Z" fill="#ef4136" stroke="#8c1c14" stroke-width="0.9" transform="rotate(' + a + ' 20 20)"/>'; }).join('') +
    '<circle cx="20" cy="20" r="1.8" fill="#8c1c14"/></svg>';

  var NAMES = { S: 'Sonne', F: 'Blume' };
  function strip(seq, cls) {
    var label = seq.split('').map(function (c) { return NAMES[c]; }).join(', ');
    return '<span class="' + P + 'strip ' + (cls || '') + '" role="img" aria-label="' + label + '">' +
      seq.split('').map(function (c) { return c === 'S' ? SUN : FLOWER; }).join('') + '</span>';
  }
  function html(s) { var d = document.createElement('div'); d.innerHTML = s; return d.firstChild; }

  var el, api, optsEl, locked, picked, mode;

  function optionCard(name, idx) {
    var sel = picked === idx;
    var cls = P + 'opt';
    var mark = '';
    if (mode && (mode === 'solution' ? idx === RIGHT : sel)) {
      var ok = idx === RIGHT;
      cls += ok ? ' right' : ' wrong';
      mark = ok ? '✓' : '✗';
    }
    var input = h('input', { type: 'radio', name: P + 'opt', value: String(idx), disabled: locked, 'aria-label': 'Antwort ' + 'ABCD'[idx] + ': ' + name });
    input.checked = sel;
    return h('label', { class: cls }, input,
      h('span', { class: P + 'card' },
        h('span', { class: P + 'let' }, 'ABCD'[idx] + ')'),
        h('span', { class: P + 'val' }, name),
        mark ? h('span', { class: P + 'mark', 'aria-hidden': 'true' }, mark) : null));
  }
  function render() {
    optsEl.replaceChildren.apply(optsEl, OPTIONS.map(optionCard));
  }
  function onChange(e) {
    if (locked || !e.target.matches('input[type=radio]')) return;
    picked = +e.target.value;
    render();
    var f = optsEl.querySelector('input:checked'); if (f) f.focus();
    api.changed('Antwort ' + 'ABCD'[picked] + ' gewählt.');
  }

  function codeTable() {
    var rows = LETTERS.map(function (l) {
      return '<tr><th scope="row">' + l + '</th><td>' + strip(CODE[l]) + '</td></tr>';
    }).join('');
    return html('<table class="' + P + 'table"><caption>Die Folgen für die Buchstaben</caption><thead><tr><th scope="col">Buchstabe</th><th scope="col">Folge</th></tr></thead><tbody>' + rows + '</tbody></table>');
  }

  Biber.register({
    id: 'blumenundsonnen16',
    story: '<p>Barbara hat zwei Stempel bekommen. Einer druckt eine Blume, der andere eine Sonne. Sie überlegt, wie sie nur mit Blumen und Sonnen ihren Namen stempeln kann.</p>' +
      '<p>Für verschiedene Buchstaben bestimmt sie verschiedene Folgen von Blumen und Sonnen:</p>',
    question: 'Welchen Namen hat Barbara gestempelt?',
    howto: 'Wähle eine Antwort aus.',
    explanation: function () {
      var rows = OPTIONS.map(function (o, i) {
        return '<tr class="' + (i === RIGHT ? 'hit' : '') + '"><th scope="row">' + 'ABCD'[i] + ') ' + o + '</th><td>' + strip(encode(o)) + '</td><td class="' + P + 'res">' + (i === RIGHT ? '✓ passt' : '✗ anders') + '</td></tr>';
      }).join('');
      return '<p>Man liest die gestempelte Folge von links nach rechts und sucht, welcher Buchstabe passt. Zwei Sonnen am Anfang können nur ein <b>A</b> sein, denn alle anderen Folgen außer B beginnen mit „Sonne, Blume“. Dann folgen zweimal eine einzelne Blume: <b>B</b>, <b>B</b>. Am Ende steht „Sonne, Blume, Blume, Sonne“. Das ist ein <b>Y</b>; ein E hätte drei Blumen. Der Name ist also <b>Abby</b>. Die richtige Antwort ist <b>A</b>.</p>' +
        '<p>Gestempelt wurde:</p><p>' + strip(STAMPED) + '</p>' +
        '<p>So stempelt Barbara die Namen ihrer Freunde:</p><table class="' + P + 'table ' + P + 'ans"><tbody>' + rows + '</tbody></table>' +
        '<p><b>Informatik:</b> Wenn man Daten wie Buchstaben durch andere Zeichen beschreibt, nennt man das eine Codierung. Computer speichern alles mit Folgen aus 0 und 1. Oft hat jedes Zeichen gleich viele Bits, zum Beispiel 8 Bits (ein Byte). Weil manche Buchstaben viel häufiger vorkommen als andere, kann man Platz sparen, wenn man häufige Zeichen kürzer codiert (Code mit variabler Länge). Damit man trotzdem eindeutig zurückübersetzen kann, darf kein Code der Anfang eines anderen Codes sein. Ein solcher Code heißt <b>Präfixcode</b>; ein bekanntes Beispiel ist der Morsecode.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null;
      optsEl = h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Antworten' });
      var name = h('div', { class: P + 'block' },
        h('p', { class: P + 'cap' }, 'Ihren eigenen Namen „Barbara“ stempelt sie so:'),
        html(strip(BARBARA, P + 'big')),
        h('p', { class: P + 'cap' }, 'Nun stempelt Barbara den Namen eines ihrer Freunde:'),
        html(strip(STAMPED, P + 'big')));
      el.replaceChildren(h('div', { class: P + 'box' }, codeTable(), name, optsEl));
      optsEl.addEventListener('change', onChange);
      render();
    },
    isComplete: function () { return picked !== null; },
    evaluate: function () { return { correct: picked === RIGHT, answer: picked }; },
    setAnswer: function (ans) { picked = typeof ans === 'number' ? ans : null; mode = 'check'; render(); },
    lock: function (on) {
      locked = on;
      mode = on ? (mode || 'check') : null;
      render();
    },
    reset: function () { picked = null; mode = null; render(); },
    showSolution: function () { picked = RIGHT; mode = 'solution'; locked = true; render(); }
  });
})();
