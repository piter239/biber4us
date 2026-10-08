/* Aufgabe Bücherei (Heft 2021, S. 13; Klasse 7-8 schwer, 9-10 mittel, 11-13 einfach): Ortsbestimmung per Rechenausdruck (Hashfunktion), fehlerhaften Ausdruck finden */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-buecherei21-';

  var TITLE_EX = 'Dämme bauen, aber gern!';
  var OPTIONS = [
    { id: 'A', title: 'Gutes gegen Biber-Fieber', expr: '((7·3+7)·3+2)·3+6' },
    { id: 'B', title: 'Bäume fällen für Dummies', expr: '((2·3+6)+6)·3+4' },
    { id: 'C', title: 'Der Herr der Dämme', expr: '((4·3+8)·3+4)·3+4' },
    { id: 'D', title: 'Bebretti: Der erste Fall', expr: '((2·3+4)·3+5)·3+6' }
  ];
  var RIGHT = 'B';          /* Heft S. 14: In Antwort B fehlt einmal die Multiplikation mit 3; per Skript nachgerechnet (nur B weicht ab) */

  /* Anfangsbuchstaben der Wörter (Wörter durch Leerzeichen oder Bindestrich getrennt), ihre Positionen im Alphabet und der Sollwert */
  function initials(title) {
    return title.split(/[\s-]+/).filter(Boolean).map(function (w) { return w.charAt(0); });
  }
  function pos(ch) { return ch.toLowerCase().charCodeAt(0) - 96; }
  function target(title) { return initials(title).reduce(function (v, c) { return v * 3 + pos(c); }, 0); }
  /* kleiner Rechenausdruck-Auswerter: Zahlen, +, ·, Klammern (Punkt vor Strich) */
  function evalExpr(s) {
    var t = s.replace(/\s+/g, ''), i = 0;
    function sum() { var v = prod(); while (t.charAt(i) === '+') { i++; v += prod(); } return v; }
    function prod() { var v = atom(); while (t.charAt(i) === '·') { i++; v *= atom(); } return v; }
    function atom() {
      if (t.charAt(i) === '(') { i++; var v = sum(); i++; return v; }
      var j = i; while (/[0-9]/.test(t.charAt(i))) i++;
      return parseInt(t.slice(j, i), 10);
    }
    return sum();
  }

  /* Beschriftung: Anfangsbuchstaben hervorgehoben */
  function titleEl(title, withMarks) {
    var out = [], re = /([^\s-]+)([\s-]*)/g, m;
    while ((m = re.exec(title)) !== null) {
      out.push(withMarks ? h('span', { class: P + 'ini' }, m[1].charAt(0)) : m[1].charAt(0), m[1].slice(1) + m[2]);
    }
    return out;
  }

  var el, api, picked, locked, mode, optsEl;

  function optionCard(o) {
    var sel = picked === o.id, cls = P + 'opt', mark = '';
    if (mode) {
      var isRight = o.id === RIGHT;
      if (mode === 'solution' ? isRight : sel) { cls += isRight ? ' right' : ' wrong'; mark = isRight ? '✓' : '✗'; }
    }
    var input = h('input', { type: 'radio', name: P + 'opt', value: o.id, disabled: locked, 'aria-label': 'Antwort ' + o.id + ': ' + o.title + ', Ausdruck ' + o.expr.replace(/·/g, ' mal ') });
    input.checked = sel;
    return h('label', { class: cls },
      input,
      h('span', { class: P + 'card' },
        h('span', { class: P + 'head' }, o.id + ')', mark ? h('span', { class: P + 'mark', 'aria-hidden': 'true' }, mark) : null),
        h('span', { class: P + 'note', 'aria-hidden': 'true' },
          h('span', { class: P + 'ttl' }, titleEl(o.title, true)),
          h('span', { class: P + 'expr' }, o.expr))));
  }
  function renderOptions() { optsEl.replaceChildren.apply(optsEl, OPTIONS.map(optionCard)); }
  function onChange(e) {
    if (locked || !e.target.matches('input[type=radio]')) return;
    picked = e.target.value; renderOptions();
    var f = optsEl.querySelector('input:checked'); if (f) f.focus();
    api.changed('Antwort ' + picked + ' gewählt.');
  }

  function alphabet() {
    var rows = [0, 13].map(function (from) {
      var letters = [];
      for (var i = from; i < from + 13; i++) letters.push(h('span', { class: P + 'cell' }, h('b', null, String.fromCharCode(97 + i)), h('i', null, String(i + 1))));
      return h('div', { class: P + 'arow' }, letters);
    });
    return h('div', { class: P + 'alpha', role: 'img', 'aria-label': 'Alphabet mit Positionen: a gleich 1, b gleich 2 und so weiter bis z gleich 26' }, rows);
  }

  Biber.register({
    id: 'buecherei21',
    story: '<p>Susi ist mit Tim in der Biber-Bücherei. Sie wollen ein Buch ausleihen: „Dämme bauen, aber gern!“ ' +
      'Tim geht zu Regal 1, greift in Reihe 3, Fach 6 und holt das Buch heraus. Susi ist beeindruckt. Tim erklärt Susi, wie man den Ort eines Buches mit einem Rechenausdruck bestimmt:</p>' +
      '<p>Man nimmt von jedem Wort im Titel den Anfangsbuchstaben und bestimmt dessen Position im Alphabet. Nach und nach werden die Positionen addiert; ' +
      'aber vor jedem Addieren wird der bisher erreichte Wert mit 3 multipliziert.</p>' +
      '<p>Für das gewünschte Buch ergibt der Ausdruck 136. Schon ist klar, wo das Buch steht. Nun stellt Susi für ihre vier Lieblingsbücher die Orts-Bestimmungs-Ausdrücke auf. In genau einem Fall hat sie aber einen Fehler gemacht.</p>',
    question: 'In welchem?',
    howto: 'Wähle die Karte mit dem fehlerhaften Ausdruck. Oben siehst du das Beispiel und die Positionen der Buchstaben im Alphabet.',
    explanation: function () {
      var rows = OPTIONS.map(function (o) {
        var ini = initials(o.title), want = target(o.title), got = evalExpr(o.expr);
        return '<li><b>' + o.id + ')</b> ' + o.title + ': Anfangsbuchstaben ' + ini.join(', ') + ' ergeben die Positionen ' + ini.map(pos).join(', ') + '; ' +
          (want === got ? 'der Ausdruck ' + o.expr + ' passt.' : '<b>der Ausdruck ' + o.expr + ' ergibt ' + got + ', richtig wäre ' + want + '</b>: Nach der Klammer fehlt „·3“ (also ((2·3+6)·3+6)·3+4).') + '</li>';
      }).join('');
      return '<p>Susi hat fast alles richtig gemacht: Sie hat immer die richtigen Positionswerte addiert und die Zwischenergebnisse immer mit 3 multipliziert, mit einer Ausnahme. In Antwort B hat sie das einmal vergessen.</p>' +
        '<ul class="' + P + 'why">' + rows + '</ul>' +
        '<p><b>Informatik:</b> So ein Rechenausdruck, der aus einem Text eine Zahl (hier einen Platz im Regal) macht, heißt <i>Hashfunktion</i>. Mit ihr findet man Daten sofort, ohne lange zu suchen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null;
      optsEl = h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Susis vier Ausdrücke' });
      optsEl.addEventListener('change', onChange);
      var ex = h('div', { class: P + 'ex' },
        h('div', { class: P + 'ttl' }, titleEl(TITLE_EX, true)),
        h('div', { class: P + 'expr' }, '((4·3+2)·3+1)·3+7 = 136'));
      el.replaceChildren(h('div', { class: P + 'wrap' },
        h('section', { 'aria-label': 'Hilfe' }, h('h3', null, 'Alphabet'), alphabet(),
          h('h3', null, 'Beispiel'), ex),
        h('section', { 'aria-label': 'Antworten' }, h('h3', null, 'Susis Ausdrücke'), optsEl)));
      renderOptions();
    },
    isComplete: function () { return !!picked; },
    evaluate: function () { return { correct: picked === RIGHT, answer: picked }; },
    setAnswer: function (ans) { picked = ans || null; mode = 'check'; renderOptions(); },
    lock: function (on) { locked = on; mode = on ? (mode || 'check') : null; renderOptions(); },
    reset: function () { picked = null; mode = null; renderOptions(); },
    showSolution: function () { picked = RIGHT; mode = 'solution'; locked = true; renderOptions(); }
  });
})();
