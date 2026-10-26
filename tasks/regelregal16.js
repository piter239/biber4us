/* Aufgabe Regel-Regal (Heft 2016, Klasse 5-6 einfach): Regelmenge, Strukturen, Handlungen */
(function () {
  'use strict';
  var h = Biber.h;
  var A = 'assets/regelregal16/';

  /* Gegenstände: Form und Name; rect = rechteckig, ball = kugelförmig */
  var THING = {
    g: { name: 'grünes Heft', kind: 'rect' },
    b: { name: 'blaues Glas', kind: 'rect' },
    r: { name: 'rotes Buch', kind: 'rect' },
    k: { name: 'Ball', kind: 'ball' },
    p: { name: 'Pokal', kind: 'other' },
    h: { name: 'Sechseck', kind: 'other' },
    v: { name: 'Herz mit Biber', kind: 'other' },
    d: { name: 'Dreieck', kind: 'other' }
  };
  /* Reihenfolge der Gegenstände auf den Regalen von links nach rechts, wie im Heft */
  var SHELVES = [
    { k: 'A', row: 'gbrphkvd' },
    { k: 'B', row: 'gkhbpvdr' },
    { k: 'C', row: 'ghvbdrkp' },
    { k: 'D', row: 'ghbdrvpk' }
  ];

  /* Regel 1: Rechteckige Gegenstände dürfen nicht nebeneinander sein.
     Regel 2: Kugelförmige Gegenstände dürfen nicht neben rechteckigen sein. */
  function broken(row) {
    var res = [];
    for (var i = 0; i + 1 < row.length; i++) {
      var a = THING[row[i]].kind, b = THING[row[i + 1]].kind;
      if (a === 'rect' && b === 'rect') res.push(1);
      if ((a === 'ball' && b === 'rect') || (a === 'rect' && b === 'ball')) res.push(2);
    }
    return res;
  }
  var RIGHT = SHELVES.filter(function (s) { return broken(s.row).length === 0; }).map(function (s) { return s.k; });
  /* es darf genau ein Regal übrig bleiben */
  var RIGHT1 = RIGHT.length === 1 ? RIGHT[0] : null;

  function alt(s) {
    return 'Regal ' + s.k + ': ' + s.row.split('').map(function (c) { return THING[c].name; }).join(', ') + ' (von links nach rechts)';
  }

  var el, api, locked, picked, mode, optsEl;

  function render() {
    var kids = SHELVES.map(function (s) {
      var sel = picked === s.k;
      var cls = 't-regal16-opt';
      var mark = null;
      if (mode && (mode === 'solution' ? s.k === RIGHT1 : sel)) {
        var ok = s.k === RIGHT1;
        cls += ok ? ' right' : ' wrong';
        mark = h('span', { class: 't-regal16-mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      }
      var input = h('input', { type: 'radio', name: 't-regal16-opt', value: s.k, disabled: locked, 'aria-label': alt(s) });
      input.checked = sel;
      return h('label', { class: cls }, input,
        h('span', { class: 't-regal16-card' },
          h('span', { class: 't-regal16-let' }, s.k + ')'),
          h('img', { src: A + 'regal-' + s.k.toLowerCase() + '.png', alt: '', width: 640, height: 240, draggable: 'false' }),
          mark));
    });
    optsEl.replaceChildren.apply(optsEl, kids);
  }

  function onChange(e) {
    if (locked || !e.target.matches('input[type=radio]')) return;
    picked = e.target.value;
    render();
    var f = optsEl.querySelector('input:checked');
    if (f) f.focus();
    api.changed('Regal ' + picked + ' gewählt.');
  }

  Biber.register({
    id: 'regelregal16',
    story: '<p>Beatrix schafft Ordnung auf ihrem Regal. Ihre Ordnung hält sich an zwei Regeln:</p>' +
      '<ol class="t-regal16-rules"><li>Rechteckige Gegenstände dürfen <b class="t-regal16-not">NICHT</b> nebeneinander sein.</li>' +
      '<li>Kugelförmige Gegenstände dürfen <b class="t-regal16-not">NICHT</b> neben rechteckigen sein.</li></ol>' +
      '<p>Die Bilder zeigen Regale mit verschiedenen Ordnungen. Nur auf einem Regal hält sich die Ordnung an beide Regeln zugleich. Das ist das Regel-Regal von Beatrix.</p>',
    question: 'Welches Regal ist das Regel-Regal von Beatrix?',
    howto: 'Wähle das Regal, auf dem beide Regeln eingehalten werden.',
    explanation: function () {
      return '<ul class="t-regal16-why">' +
        '<li><b>Regal A:</b> Ganz links stehen drei rechteckige Gegenstände nebeneinander. Das verstößt gegen Regel 1.</li>' +
        '<li><b>Regal B:</b> Ganz links steht der Ball neben einem rechteckigen Gegenstand. Das verstößt gegen Regel 2.</li>' +
        '<li><b>Regal C:</b> Halbrechts steht der Ball direkt neben dem roten Buch. Das verstößt gegen Regel 2.</li>' +
        '<li><b>Regal D:</b> Es stehen keine rechteckigen Gegenstände nebeneinander und der Ball steht nicht neben einem rechteckigen. Beide Regeln sind erfüllt, also ist D das Regel-Regal.</li></ul>' +
        '<p>Gegenstände mit anderen Formen (sechseckig, dreieckig, herzförmig, pokalförmig) kommen in den Regeln nicht vor. Sie können überall stehen.</p>' +
        '<p><b>Informatik:</b> Es gibt viele Arten von Regeln. Sie können zum Beispiel Strukturen oder Abläufe festlegen. Eine Verkehrsampel hat feste Regeln für die Folge ihrer Lichter. ' +
        'Auch Computerprogramme sind darauf angewiesen, dass ihre Daten einer vorgegebenen „Syntax“ folgen, also einer Menge von Regeln. ' +
        'So schreibt die Sprache HTML, in der die meisten Seiten im Web geschrieben sind, vor, dass jedes öffnende Element auch wieder geschlossen wird.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null;
      optsEl = h('div', { class: 't-regal16-opts', role: 'radiogroup', 'aria-label': 'Regale' });
      el.replaceChildren(h('div', { class: 't-regal16-box' }, optsEl));
      optsEl.addEventListener('change', onChange);
      render();
    },
    isComplete: function () { return picked !== null; },
    evaluate: function () { return { correct: picked === RIGHT1, answer: picked }; },
    setAnswer: function (ans) {
      picked = SHELVES.some(function (s) { return s.k === ans; }) ? ans : null;
      mode = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mode = on ? (mode || 'check') : null;
      render();
    },
    reset: function () { picked = null; mode = null; render(); },
    showSolution: function () { picked = RIGHT1; mode = 'solution'; locked = true; render(); }
  });
})();
