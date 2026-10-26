/* Aufgabe Geburtstagskerzen (Heft 2016, Klasse 5-6 mittel, 7-8 einfach): Binärsystem, binäre Informationsdarstellung */
(function () {
  'use strict';
  var h = Biber.h;
  var svg = Biber.svg;

  var WEIGHTS = [16, 8, 4, 2, 1];                 /* von links nach rechts */
  var COLORS = ['#ee5c8b', '#f2b72b', '#7dbb3b', '#f2761f', '#4f9bd9'];
  var POS = ['ersten', 'zweiten', 'dritten', 'vierten', 'fünften'];
  var ORD = ['erste', 'zweite', 'dritte', 'vierte', 'fünfte'];
  /* 1 = Kerze brennt; Reihenfolge wie im Heft (links = 16, rechts = 1) */
  var OPTIONS = [
    { l: 'A', m: [0, 1, 0, 1, 1] },
    { l: 'B', m: [0, 1, 1, 1, 0] },
    { l: 'C', m: [1, 0, 0, 0, 0] },
    { l: 'D', m: [1, 1, 0, 1, 0] },
    { l: 'E', m: [1, 1, 1, 1, 1] }
  ];
  var EXAMPLES = [
    { m: [0, 0, 0, 0, 1], t: '1' },
    { m: [0, 0, 0, 1, 0], t: '2' },
    { m: [0, 0, 1, 0, 0], t: '4' },
    { m: [0, 0, 0, 1, 1], t: '2 + 1 = 3' },
    { m: [1, 0, 1, 0, 1], t: '16 + 4 + 1 = 21' }
  ];
  var TARGET = 11;
  var RIGHT = 0;

  function value(m) { return m.reduce(function (s, b, i) { return s + b * WEIGHTS[i]; }, 0); }
  function sum(m) {
    var parts = [];
    m.forEach(function (b, i) { if (b) parts.push(WEIGHTS[i]); });
    return parts.join(' + ') + ' = ' + value(m);
  }
  function describe(m) {
    var lit = [];
    m.forEach(function (b, i) { if (b) lit.push('die ' + ORD[i] + ' von links'); });
    if (lit.length === 5) return 'alle fünf Kerzen brennen';
    return 'es brennen ' + lit.join(', ').replace(/, ([^,]*)$/, ' und $1');
  }

  /* Kerzenbild als SVG; Farben sind Teil der Abbildung (feste Kerzenfarben) */
  function candles(m, label) {
    var kids = [];
    m.forEach(function (on, i) {
      var x = 12 + i * 17;
      kids.push(svg('rect', { x: x, y: 30, width: 12, height: 34, rx: 5, fill: COLORS[i] }));
      kids.push(svg('rect', { x: x + 8.5, y: 31, width: 3.5, height: 32, rx: 1.7, fill: '#000', 'fill-opacity': '0.14' }));
      [37, 46, 55].forEach(function (y) {
        kids.push(svg('rect', { x: x + 1.5, y: y, width: 9, height: 3.4, rx: 1.7, fill: '#fff', 'fill-opacity': '0.55' }));
      });
      if (on) {
        kids.push(svg('path', { d: 'M' + (x + 6) + ' 10 C' + (x + 11) + ' 16 ' + (x + 11.5) + ' 21 ' + (x + 6) + ' 26 C' + (x + .5) + ' 21 ' + (x + 1) + ' 16 ' + (x + 6) + ' 10Z', fill: '#ffc83a', stroke: '#f48a1c', 'stroke-width': '1.6', 'stroke-linejoin': 'round' }));
        kids.push(svg('path', { d: 'M' + (x + 6) + ' 17 C' + (x + 8.5) + ' 20 ' + (x + 8.5) + ' 22.5 ' + (x + 6) + ' 24.5 C' + (x + 3.5) + ' 22.5 ' + (x + 3.5) + ' 20 ' + (x + 6) + ' 17Z', fill: '#fff3b0' }));
        kids.push(svg('rect', { x: x + 5.2, y: 25, width: 1.6, height: 5, fill: '#5a3418' }));
      } else {
        kids.push(svg('rect', { x: x + 5.2, y: 26.5, width: 1.6, height: 4, rx: 0.8, fill: '#5a3418' }));
      }
    });
    var attrs = { viewBox: '0 0 100 70', class: 't-geburtstagskerzen16-svg', role: 'img', 'aria-label': label, focusable: 'false' };
    return svg.apply(null, ['svg', attrs].concat(kids));
  }

  var el, api, locked, picked, mode, optsEl;

  function optionCard(o, idx) {
    var sel = picked === idx;
    var cls = 't-geburtstagskerzen16-opt';
    var mark = '';
    if (mode && (mode === 'solution' ? idx === RIGHT : sel)) {
      var ok = idx === RIGHT;
      cls += ok ? ' right' : ' wrong';
      mark = ok ? '✓' : '✗';
    }
    var input = h('input', { type: 'radio', name: 't-geburtstagskerzen16-opt', value: String(idx), disabled: locked,
      'aria-label': 'Antwort ' + o.l + ': ' + describe(o.m) });
    input.checked = sel;
    return h('label', { class: cls }, input,
      h('span', { class: 't-geburtstagskerzen16-card' },
        h('span', { class: 't-geburtstagskerzen16-let' }, o.l + ')'),
        h('span', { class: 't-geburtstagskerzen16-pic' }, candles(o.m, 'Kuchen mit Kerzen: ' + describe(o.m))),
        mark ? h('span', { class: 't-geburtstagskerzen16-mark', 'aria-hidden': 'true' }, mark) : null));
  }
  function renderOpts() { optsEl.replaceChildren.apply(optsEl, OPTIONS.map(optionCard)); }

  function onChange(e) {
    if (locked || !e.target.matches('input[type=radio]')) return;
    picked = +e.target.value;
    renderOpts();
    var f = optsEl.querySelector('input:checked'); if (f) f.focus();
    api.changed('Antwort ' + OPTIONS[picked].l + ' gewählt.');
  }

  function exampleRow() {
    return h('ul', { class: 't-geburtstagskerzen16-ex', 'aria-label': 'Beispiele' }, EXAMPLES.map(function (x) {
      return h('li', null, h('span', { class: 't-geburtstagskerzen16-cap' }, x.t),
        h('span', { class: 't-geburtstagskerzen16-pic' }, candles(x.m, 'Beispiel, ' + describe(x.m) + ': Wert ' + value(x.m))));
    }));
  }

  Biber.register({
    id: 'geburtstagskerzen16',
    story: '<p>Heute ist Bodos elfter Geburtstag. Bodos Mutter findet aber nur noch fünf Kerzen. Zum Glück weiß sie, wie sie die Zahl elf mit fünf Kerzen darstellen kann. Sie steckt sie alle nebeneinander auf den Kuchen.</p>' +
      '<ul class="t-geburtstagskerzen16-rules">' +
      '<li>Die Kerze ganz rechts ist <b>1</b> wert.</li>' +
      '<li>Jede andere Kerze ist das <b>Doppelte</b> der Kerze rechts daneben wert.</li>' +
      '<li>Die Werte aller <b>brennenden</b> Kerzen werden addiert.</li></ul>' +
      '<p>Zum Beispiel:</p>' + exampleRow().outerHTML,
    question: 'Welche Kerzen brennen an Bodos elftem Geburtstag?',
    howto: 'Tippe auf den Kuchen, der zu Bodos Alter passt.',
    explanation: function () {
      var rows = OPTIONS.map(function (o) {
        var ok = value(o.m) === TARGET;
        return '<li><b>' + o.l + ')</b> ' + sum(o.m) + (ok ? ' – passt' : ' – passt nicht') + '</li>';
      }).join('');
      return '<p>Von links nach rechts sind die Kerzen 16, 8, 4, 2 und 1 wert. Für die Zahl 11 braucht man <b>8 + 2 + 1</b>. ' +
        'Es müssen also die zweite, die vierte und die fünfte Kerze von links brennen: Antwort A.</p>' +
        '<ul class="t-geburtstagskerzen16-sums">' + rows + '</ul>' +
        '<p><b>Informatik:</b> „Kerze an“ oder „Kerze aus“ sagt, ob ein Wert mitgezählt wird oder nicht. Schreibt man das mit 1 (an) und 0 (aus) auf, steht da <b>01011</b> – das ist die Zahl 11 im <i>Binärsystem</i>. ' +
        'Damit lässt sich jede Zahl darstellen. Fast alle modernen Computer rechnen intern binär, weil sich Schaltkreise mit nur zwei Zuständen einfacher bauen lassen als solche für das Dezimalsystem.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null;
      optsEl = h('div', { class: 't-geburtstagskerzen16-opts', role: 'radiogroup', 'aria-label': 'Antworten' });
      el.replaceChildren(h('div', { class: 't-geburtstagskerzen16-box' }, optsEl));
      optsEl.addEventListener('change', onChange);
      renderOpts();
    },
    isComplete: function () { return picked !== null; },
    evaluate: function () { return { correct: picked === RIGHT, answer: picked === null ? null : OPTIONS[picked].l }; },
    setAnswer: function (ans) {
      picked = null;
      OPTIONS.forEach(function (o, i) { if (o.l === ans) picked = i; });
      mode = 'check'; renderOpts();
    },
    lock: function (on) { locked = on; mode = on ? (mode || 'check') : null; renderOpts(); },
    reset: function () { picked = null; mode = null; renderOpts(); },
    showSolution: function () { picked = RIGHT; mode = 'solution'; locked = true; renderOpts(); }
  });

  /* Selbstprüfung: genau Antwort A ergibt 11, die Beispiele stimmen */
  (function () {
    var ok = OPTIONS.filter(function (o) { return value(o.m) === TARGET; });
    if (ok.length !== 1 || ok[0].l !== 'A') throw new Error('geburtstagskerzen16: Lösung stimmt nicht');
    var vals = EXAMPLES.map(function (x) { return value(x.m); }).join();
    if (vals !== '1,2,4,3,21') throw new Error('geburtstagskerzen16: Beispiele stimmen nicht');
  })();
})();
