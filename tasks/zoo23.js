/* Aufgabe Spaß im Zoo (Heft 2023, S. 56; Klasse 3-6): Intervall-Scheduling, größte Auswahl überschneidungsfreier Vorführungen */
(function () {
  'use strict';
  var h = Biber.h;
  var BASE = 'assets/zoo23/';
  var UNITS = 19;   /* 10:00 bis 14:45 Uhr in Viertelstunden */

  /* Vorführungen aus dem Plan im Heft: Beginn und Ende in Viertelstunden nach 10:00 Uhr (Lage aus der Abbildung gemessen). */
  var SHOWS = [
    { id: 'A', animal: 'Fische', s: 0, e: 5, color: '#3ca2e0', ink: '#10202a' },
    { id: 'B', animal: 'Wasserschweine', s: 1, e: 4, color: '#e0c63c', ink: '#10202a' },
    { id: 'C', animal: 'Elefant', s: 4, e: 6, color: '#e23b43', ink: '#ffffff' },
    { id: 'D', animal: 'Seelöwe', s: 5, e: 8, color: '#68b8c9', ink: '#10202a' },
    { id: 'E', animal: 'Pinguine', s: 6, e: 9, color: '#85907a', ink: '#10202a' },
    { id: 'F', animal: 'Pferd', s: 6, e: 10, color: '#2a7f1f', ink: '#ffffff' },
    { id: 'G', animal: 'Krokodile', s: 8, e: 14, color: '#2368cc', ink: '#ffffff' },
    { id: 'H', animal: 'Nilpferd', s: 10, e: 14, color: '#94ffec', ink: '#10202a' },
    { id: 'I', animal: 'Schlangen', s: 13, e: 16, color: '#ff9a00', ink: '#10202a' },
    { id: 'J', animal: 'Affen', s: 15, e: 19, color: '#2ea62a', ink: '#ffffff' }
  ];
  var MAX = 5;                                  /* Heft: höchstens 5 Vorführungen */
  var SOLUTION = ['B', 'C', 'E', 'H', 'J'];     /* eine der beiden richtigen Antworten (zweite: B C F H J) */
  var HOURS = [0, 4, 8, 12, 16];

  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function clock(u) { var m = 600 + 15 * u; return Math.floor(m / 60) + ':' + pad(m % 60); }
  function byId(id) { return SHOWS.filter(function (s) { return s.id === id; })[0]; }
  function overlap(a, b) { return a.s < b.e && b.s < a.e; }

  var el, api, picked, locked, mark;   /* picked: Liste der Vorführungs-ids; mark: null | 'check' | 'solution' */

  function reset() { picked = []; mark = null; }
  function conflicts() {
    var bad = {};
    for (var i = 0; i < picked.length; i++) for (var j = i + 1; j < picked.length; j++) {
      if (overlap(byId(picked[i]), byId(picked[j]))) { bad[picked[i]] = true; bad[picked[j]] = true; }
    }
    return bad;
  }
  function statusText() {
    var n = picked.length, bad = Object.keys(conflicts());
    if (bad.length) return 'Zwei Vorführungen überschneiden sich: ' + bad.sort().join(', ') + '. Wähle nur Vorführungen, die nacheinander stattfinden.';
    return n === 0 ? '' : n + (n === 1 ? ' Vorführung' : ' Vorführungen') + ' ausgewählt.';
  }
  function notify() { render(); api.changed(statusText()); }

  function toggle(id) {
    if (locked) return;
    var i = picked.indexOf(id);
    if (i >= 0) picked.splice(i, 1); else picked.push(id);
    mark = null;
    notify();
    var b = el.querySelector('[data-show="' + id + '"]');
    if (b) b.focus();
  }

  function barLabel(s, on) {
    return 'Vorführung ' + s.id + ': ' + s.animal + ', ' + clock(s.s) + ' bis ' + clock(s.e) + ' Uhr, ' + (on ? 'ausgewählt' : 'nicht ausgewählt');
  }

  function render() {
    var bad = conflicts();
    var axis = h('div', { class: 't-zoo23-axis', 'aria-hidden': 'true' },
      HOURS.map(function (u) { return h('span', { style: 'left:' + (u / UNITS * 100) + '%' }, clock(u)); }));
    var rows = SHOWS.map(function (s) {
      var on = picked.indexOf(s.id) >= 0;
      var cls = 't-zoo23-bar' + (on ? ' on' : '') + (on && bad[s.id] ? ' clash' : '');
      var bar = h('button', {
        type: 'button', class: cls, 'data-show': s.id, disabled: locked, 'aria-pressed': String(on), 'aria-label': barLabel(s, on),
        style: 'left:' + (s.s / UNITS * 100) + '%;width:' + ((s.e - s.s) / UNITS * 100) + '%;--zoo-c:' + s.color + ';--zoo-ink:' + s.ink
      }, h('span', { class: 't-zoo23-id', 'aria-hidden': 'true' }, s.id), on ? h('span', { class: 't-zoo23-tick', 'aria-hidden': 'true' }, '✓') : null);
      return h('div', { class: 't-zoo23-row' },
        h('div', { class: 't-zoo23-ico' }, h('img', { src: BASE + 'abcdefghij'.charAt(SHOWS.indexOf(s)) + '.png', alt: s.animal, draggable: 'false' })),
        h('div', { class: 't-zoo23-track' }, bar));
    });
    el.replaceChildren(h('div', { class: 't-zoo23-board' + (mark === 'check' ? (picked.length === MAX ? ' right' : ' wrong') : '') },
      h('div', { class: 't-zoo23-chart', role: 'group', 'aria-label': 'Plan der zehn Vorführungen von 10:00 bis 14:45 Uhr' },
        h('div', { class: 't-zoo23-row t-zoo23-head' }, h('div', { class: 't-zoo23-ico' }), axis), rows),
      h('p', { class: 't-zoo23-sum', 'aria-live': 'polite' }, picked.length
        ? 'Ausgewählt: ' + picked.slice().sort().map(function (id) { var s = byId(id); return id + ' (' + s.animal + ', ' + clock(s.s) + ' bis ' + clock(s.e) + ')'; }).join(', ')
        : 'Noch keine Vorführung ausgewählt.')));
  }

  function onClick(e) {
    var b = e.target.closest('[data-show]');
    if (b && !locked) toggle(b.dataset.show);
  }

  Biber.register({
    id: 'zoo23',
    story: '<p>Heute ist Ali im Zoo. Er will möglichst viele verschiedene Vorführungen besuchen. Im Plan siehst du alle Vorführungen. Zum Beispiel beginnt die Vorführung der Affen um 13:45 Uhr und endet um 14:45 Uhr. Jedes Kästchen ist eine Viertelstunde.</p>' +
      '<p>Ali besucht eine Vorführung immer ganz, von Anfang bis Ende.</p>',
    question: 'Wähle so viele Vorführungen wie möglich aus, die Ali nacheinander besuchen kann.',
    howto: 'Tippe die Balken an, die Ali besuchen soll. Ein Balken, der noch einmal angetippt wird, ist wieder abgewählt. Wenn eine Vorführung genau dann beginnt, wenn die vorige endet, passt das.',
    explanation: function () {
      var n = picked.length;
      var lead = mark === 'check' && n && n < MAX && !Object.keys(conflicts()).length
        ? '<p>Du hast ' + n + ' Vorführungen ausgewählt, die zusammenpassen. Es geht aber noch eine mehr.</p>' : '';
      return lead + '<p>Ali kann höchstens <b>5</b> Vorführungen nacheinander besuchen. Zwei richtige Pläne sind B, C, E, H, J und B, C, F, H, J.</p>' +
        '<p>Mehr geht nicht: Der Plan hat nur 19 Viertelstunden. Die sechs kürzesten Vorführungen brauchen zusammen 2 + 3 + 3 + 3 + 3 + 4 = 18, doch dazu gehören C, D und E, und D liegt genau zwischen C und E. D fällt also weg. Jede Ersatz-Vorführung dauert mindestens 4 Viertelstunden, das ergibt mindestens 19. ' +
        'Aber jede Vorführung mit 4 Viertelstunden überschneidet sich mit einer mit 3, die dann auch ersetzt werden muss. Dann sind es mindestens 20 Viertelstunden, und das ist mehr als 19. Also gibt es keinen Plan mit 6 Vorführungen.</p>' +
        '<p>Solche Zeitpläne herzustellen nennt man in der Informatik ein <i>Scheduling-Problem</i>. Schon bei kleinen Plänen ist es von Hand mühsam, alle Möglichkeiten durchzuprobieren. Auch dein Computer plant so, welcher Prozessor wann was erledigt.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      render();
    },
    isComplete: function () { return picked.length > 0 && !Object.keys(conflicts()).length; },
    evaluate: function () {
      var ok = picked.length === MAX && !Object.keys(conflicts()).length;
      return { correct: ok, answer: picked.slice().sort() };
    },
    setAnswer: function (ans) { picked = ans.slice(); mark = 'check'; render(); },
    lock: function (on) {
      locked = on;
      if (on) { if (mark !== 'solution') mark = 'check'; } else mark = null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () { picked = SOLUTION.slice(); mark = 'solution'; render(); }
  });
})();
