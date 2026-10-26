/* Aufgabe Ehrenname (Biber 2017; Klasse 5-6 mittel, 7-8 leicht): Ehrenname aus Silben zurückübersetzen */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-en17-';

  var LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  var SYL = 'ka pi mi te ku lu ji ri ki zu me ta rin to mo mor ke shi ari chi do ru mei na fu zi'.split(' ');
  var CODE = {};
  LETTERS.forEach(function (c, i) { CODE[c] = SYL[i]; });

  var HONOR = 'Zukame Moru';
  var OPTIONS = [
    { id: 'A', name: 'Josip' },
    { id: 'B', name: 'Jani' },
    { id: 'C', name: 'Jakov' },
    { id: 'D', name: 'Jurica' }
  ];
  var CORRECT = 'C';

  function encode(name) {
    return name.toUpperCase().split('').map(function (c) { return CODE[c]; });
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function tableHtml() {
    return '<ul class="' + P + 'tab" aria-label="Tabelle: Buchstabe und zugehörige Silbe">' + LETTERS.map(function (c) {
      return '<li><b>' + c + '</b><span aria-hidden="true">→</span><span class="' + P + 'sr">wird zu </span><span>' + CODE[c] + '</span></li>';
    }).join('') + '</ul>';
  }

  var el, api, choice, locked, mark;

  function reset() { choice = null; mark = null; }

  function render() {
    var cards = OPTIONS.map(function (o, i) {
      var cls = P + 'card' + (choice === o.id ? ' sel' : '');
      var badge = null;
      if (mark === 'check' && choice === o.id) {
        var ok = o.id === CORRECT;
        cls += ok ? ' right' : ' wrong';
        badge = h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      } else if (mark === 'solution' && o.id === CORRECT) cls += ' right';
      var tab = choice ? (choice === o.id ? '0' : '-1') : (i === 0 ? '0' : '-1');
      return h('button', {
        type: 'button', role: 'radio', class: cls, 'data-opt': o.id, 'aria-checked': String(choice === o.id),
        tabindex: tab, disabled: locked, 'aria-label': o.id + ': ' + o.name
      }, h('span', { class: P + 'letter', 'aria-hidden': 'true' }, o.id + ')'), h('span', { class: P + 'val', 'aria-hidden': 'true' }, o.name), badge);
    });
    el.replaceChildren(h('div', { class: P + 'board', role: 'radiogroup', 'aria-label': 'Die vier Vornamen A bis D' }, cards));
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
    id: 'ehrenname17',
    story: '<p>Yurine aus Japan gibt ihren Freunden Ehrennamen, nach einer alten Tradition. Ein Ehrenname wird aus dem richtigen Vornamen gemacht, indem jeder Buchstabe des Vornamens durch eine Silbe ersetzt wird, und zwar so:</p>' +
      tableHtml() +
      '<p>Einem Freund aus Kroatien gibt Yurine diesen Ehrennamen:</p>' +
      '<p class="' + P + 'honor">' + HONOR + '</p>',
    question: 'Wie lautet der richtige Vorname des Freundes?',
    howto: 'Tippe auf den Vornamen, den du für richtig hältst.',
    explanation: function () {
      var rows = OPTIONS.map(function (o) {
        var syl = encode(o.name);
        var same = syl.join('') === HONOR.toLowerCase().replace(' ', '');
        return '<li' + (same ? ' class="' + P + 'yes"' : '') + '><strong>' + o.name + '</strong> ergibt <span class="' + P + 'syl">' + syl.join(' · ') + '</span>' +
          (same ? ' – das passt zu „' + HONOR + '“.' : ' – das passt nicht.') + '</li>';
      }).join('');
      return '<p>Richtig ist <strong>Jakov</strong>. „Zukame Moru“ besteht aus den Silben zu, ka, me, mo und ru, und die gehören zu den Buchstaben J, A, K, O und V.</p>' +
        '<p>Am schnellsten geht es von vorn: Schon nach „zu“ und „ka“ (J und A) fallen Josip und Jurica weg, und mit „me“ (K) bleibt nur noch Jakov übrig. Wer die Namen ausprobiert und jeden Buchstaben ersetzt, erhält:</p>' +
        '<ul class="' + P + 'why">' + rows + '</ul>' +
        '<p>Wenn Daten wie die Buchstaben des Alphabets durch andere Daten ersetzt werden, spricht die Informatik von einer <em>Codierung</em>. Weil hier jeder Buchstabe immer durch dieselbe Silbe ersetzt wird, ist der Code leicht zu knacken. Für geheime Nachrichten ist das keine gute Verschlüsselung, für Ehrennamen ist es aber nicht schlimm.</p>';
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
