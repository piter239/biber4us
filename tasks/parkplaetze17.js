/* Aufgabe Parkplätze (Heft 2017, Klasse 3-4 einfach, 5-6 einfach): An wie vielen von 12 Parkplätzen stand an beiden Tagen kein Auto? */
(function () {
  'use strict';
  var h = Biber.h, sv = Biber.svg;
  var P = 't-parkplaetze17-';

  /* Belegung laut Heft: Platznummer (1..12) -> Farbklasse des Autos */
  var DAYS = [
    { id: 'mo', name: 'Montag', cars: { 1: 'c6', 3: 'c3', 6: 'c1', 9: 'c2', 11: 'c6' } },
    { id: 'di', name: 'Dienstag', cars: { 1: 'c1', 4: 'c2', 10: 'c2', 11: 'c3', 12: 'c1' } }
  ];
  var OPTIONS = [
    { id: 'A', text: '2 Parkplätze', n: 2 },
    { id: 'B', text: '4 Parkplätze', n: 4 },
    { id: 'C', text: '7 Parkplätze', n: 7 },
    { id: 'D', text: '14 Parkplätze', n: 14 }
  ];

  function bits(day) { var s = ''; for (var i = 1; i <= 12; i++) s += day.cars[i] ? '1' : '0'; return s; }
  /* Lösung aus den Daten berechnet: Plätze, die an keinem der beiden Tage belegt waren */
  var FREE = (function () {
    var f = [];
    for (var i = 1; i <= 12; i++) if (!DAYS[0].cars[i] && !DAYS[1].cars[i]) f.push(i);
    return f;
  })();
  var CORRECT = OPTIONS.filter(function (o) { return o.n === FREE.length; })[0].id;
  var OR_BITS = (function () {
    var a = bits(DAYS[0]), b = bits(DAYS[1]), r = '';
    for (var i = 0; i < 12; i++) r += (a[i] === '1' || b[i] === '1') ? '1' : '0';
    return r;
  })();

  function list(day) {
    var occ = Object.keys(day.cars).map(Number);
    var last = occ.pop();
    return occ.join(', ') + ' und ' + last;
  }

  function lot(day, cls) {
    var kids = [sv('rect', { x: 0, y: 0, width: 600, height: 200, class: P + 'asphalt' })];
    var i, c, r, cx, cy;
    for (r = 0; r < 2; r++) {
      for (c = 1; c < 6; c++) kids.push(sv('path', { d: 'M' + c * 100 + ' ' + (r * 100 + 8) + 'L' + c * 100 + ' ' + (r * 100 + 92), class: P + 'stripe' }));
    }
    kids.push(sv('path', { d: 'M6 100L594 100', class: P + 'stripe' }));
    for (i = 1; i <= 12; i++) {
      r = i <= 6 ? 0 : 1; c = (i - 1) % 6; cx = c * 100 + 50; cy = r * 100 + 50;
      if (day.cars[i]) {
        kids.push(sv('g', { class: P + 'car ' + P + day.cars[i] },
          sv('rect', { x: cx - 18, y: cy - 36, width: 36, height: 72, rx: 13, class: P + 'body' }),
          sv('rect', { x: cx - 12, y: cy - 16, width: 24, height: 24, rx: 6, class: P + 'glass' }),
          sv('rect', { x: cx - 13, y: cy + 14, width: 26, height: 12, rx: 4, class: P + 'glass' })));
      } else {
        kids.push(sv('text', { x: cx, y: cy + 9, 'text-anchor': 'middle', class: P + 'num' }, String(i)));
      }
    }
    return sv.apply(null, ['svg', {
      viewBox: '0 0 600 200', class: cls || P + 'lot', role: 'img', focusable: 'false',
      'aria-label': day.name + ': Auf den Parkplätzen ' + list(day) + ' steht ein Auto, die anderen sieben Parkplätze sind frei.'
    }].concat(kids));
  }

  var el, api, choice, mark, locked;
  function reset() { choice = null; mark = null; }

  function render() {
    var opts = OPTIONS.map(function (o, i) {
      var cls = P + 'opt' + (choice === o.id ? ' sel' : '');
      var badge = null;
      if (mark === 'check' && choice === o.id) {
        var ok = o.id === CORRECT;
        cls += ok ? ' right' : ' wrong';
        badge = h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      } else if (mark === 'solution' && o.id === CORRECT) cls += ' right';
      var tab = choice ? (choice === o.id ? '0' : '-1') : (i === 0 ? '0' : '-1');
      return h('button', {
        type: 'button', role: 'radio', class: cls, 'data-opt': o.id, 'aria-checked': String(choice === o.id), tabindex: tab, disabled: locked,
        'aria-label': 'Antwort ' + o.id + ': ' + o.text
      }, h('span', { class: P + 'letter', 'aria-hidden': 'true' }, o.id + ')'), h('span', { 'aria-hidden': 'true' }, o.text), badge);
    });
    el.replaceChildren(h('div', { class: P + 'board' },
      h('div', { class: P + 'days' }, DAYS.map(function (d) {
        return h('figure', { class: P + 'day' }, h('figcaption', null, d.name), lot(d));
      })),
      h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Die vier Antworten A bis D' }, opts)));
  }

  function pick(id) {
    if (locked) return;
    choice = id;
    render();
    var b = el.querySelector('[data-opt="' + id + '"]');
    if (b) b.focus();
    api.changed('Antwort ' + id + ' ausgewählt.');
  }
  function onClick(e) {
    var b = e.target.closest('[data-opt]');
    if (b && !locked) pick(b.dataset.opt);
  }
  function onKey(e) {
    var b = e.target.closest('[data-opt]');
    if (!b || locked) return;
    var i = OPTIONS.map(function (o) { return o.id; }).indexOf(b.dataset.opt), d = 0;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') d = 1;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') d = -1;
    else return;
    e.preventDefault();
    pick(OPTIONS[(i + d + OPTIONS.length) % OPTIONS.length].id);
  }

  Biber.register({
    id: 'parkplaetze17',
    story: '<p>Ein Geschäft hat 12 Parkplätze für Autos. Die Parkplätze haben Nummern. Die Bilder zeigen, auf welchen Parkplätzen am Montag und am Dienstag Autos waren.</p>' +
      '<p>Einige Parkplätze waren an beiden Tagen frei, zum Beispiel Parkplatz 2.</p>',
    question: 'Wie viele Parkplätze waren an beiden Tagen frei?',
    howto: 'Tippe auf die richtige Antwort. Die Nummern stehen nur auf freien Parkplätzen.',
    explanation: function () {
      var a = bits(DAYS[0]), b = bits(DAYS[1]);
      return '<p>Man legt beide Tage übereinander: Ein Parkplatz war nur dann an beiden Tagen frei, wenn an keinem der Tage ein Auto darauf stand. Das trifft auf die Parkplätze ' + FREE.slice(0, -1).join(', ') + ' und ' + FREE[FREE.length - 1] + ' zu. Das sind <strong>' + FREE.length + ' Parkplätze</strong> (Antwort ' + CORRECT + ').</p>' +
        '<p>Mit Binärcode geht das so: Ein Auto ist eine 1, ein freier Platz eine 0. Die logische Operation <strong>ODER</strong> macht aus zwei Codes einen neuen, in dem jede Stelle 1 ist, an der mindestens einer der beiden Codes eine 1 hat. Die Nullen im Ergebnis sind die Parkplätze, die an beiden Tagen frei waren.</p>' +
        '<pre class="' + P + 'bin" aria-label="Montag ' + a + ', Dienstag ' + b + ', Ergebnis ' + OR_BITS + '">' +
        'Montag      ' + a + '\nDienstag    ' + b + '\nODER        ' + OR_BITS + '</pre>' +
        '<p>Das Ergebnis enthält ' + FREE.length + ' Nullen. Alle Daten, auch Bilder oder Texte, lassen sich als Folge von Nullen und Einsen (Binärcode) darstellen; jede Stelle heißt Bit.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKey);
      render();
    },
    isComplete: function () { return !!choice; },
    evaluate: function () { return { correct: choice === CORRECT, answer: { choice: choice } }; },
    setAnswer: function (ans) {
      choice = ans && ans.choice ? ans.choice : null;
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? 'check' : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      choice = CORRECT; mark = 'solution'; locked = true;
      render();
    }
  });
})();
