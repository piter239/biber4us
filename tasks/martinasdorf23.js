/* Aufgabe Martinas Dorf (Heft 2023, Klasse 5-6 schwer, 7-8 mittel, 9-10 einfach): Graphen, Spannbaum */
(function () {
  'use strict';
  var h = Biber.h;

  /* Häuser: M = Martina; die Lage ist in allen Zeichnungen gleich */
  var POS = { a: [202, 42], b: [405, 40], M: [55, 198], c: [324, 172], d: [532, 178], e: [186, 342] };
  var NODES = ['a', 'b', 'c', 'd', 'e', 'M'];
  var TREE = [['M', 'a'], ['a', 'b'], ['a', 'c'], ['c', 'd'], ['M', 'e']];       /* Martinas besondere Karte */
  var CURVE = ['b', 'e'];                                                           /* gebogener Weg b-e */
  var OPTIONS = [
    { id: 'A', extra: [['a', 'e']] },
    { id: 'B', extra: [['b', 'e']] },
    { id: 'C', extra: [['a', 'e'], ['b', 'e'], ['b', 'c'], ['a', 'd']] },
    { id: 'D', extra: [] }
  ];
  var SOLUTION = 'C';
  var BAD = ['a', 'd'];                                                             /* Abkürzung in C: Haus d in 2 statt 3 Wegen */

  function same(e, f) { return (e[0] === f[0] && e[1] === f[1]) || (e[0] === f[1] && e[1] === f[0]); }

  function edgePath(e) {
    var p = POS[e[0]], q = POS[e[1]];
    if (same(e, CURVE)) return 'M' + POS.b[0] + ' ' + POS.b[1] + 'Q225 85 ' + POS.e[0] + ' ' + POS.e[1];
    return 'M' + p[0] + ' ' + p[1] + 'L' + q[0] + ' ' + q[1];
  }
  function graph(edges, cls, showBad, label) {
    var s = '<svg class="t-martinasdorf23-g ' + (cls || '') + '" viewBox="0 0 590 390" role="img" aria-label="' + label + '" focusable="false">';
    edges.forEach(function (e) {
      var bad = showBad && same(e, BAD);
      s += '<path class="t-martinasdorf23-edge' + (bad ? ' bad' : '') + '" d="' + edgePath(e) + '"/>';
    });
    NODES.forEach(function (n) {
      s += n === 'M' ? '<circle class="t-martinasdorf23-m" cx="' + POS[n][0] + '" cy="' + POS[n][1] + '" r="26"/><text class="t-martinasdorf23-mt" x="' + POS[n][0] + '" y="' + (POS[n][1] + 10) + '" text-anchor="middle">M</text>' :
        '<circle class="t-martinasdorf23-node" cx="' + POS[n][0] + '" cy="' + POS[n][1] + '" r="20"/>';
    });
    return s + '</svg>';
  }
  function optEdges(o) { return TREE.concat(o.extra); }
  function optOf(id) { return OPTIONS.filter(function (o) { return o.id === id; })[0]; }

  var el, api, locked, choice, mark, optBox;

  function render() {
    [].forEach.call(optBox.querySelectorAll('label'), function (lab) {
      var inp = lab.querySelector('input');
      var id = inp.value;
      inp.checked = id === choice;
      inp.disabled = !!locked;
      lab.classList.toggle('sel', id === choice);
      lab.classList.toggle('wrong', mark === 'check' && id === choice && id !== SOLUTION);
      lab.classList.toggle('right', (mark === 'check' && id === choice && id === SOLUTION) || (mark === 'solution' && id === SOLUTION));
      var svgEl = lab.querySelector('svg');
      var badEdge = svgEl.querySelector('.t-martinasdorf23-edge.bad');
      if (badEdge) badEdge.style.display = locked || mark ? '' : 'none';
    });
  }

  function build() {
    optBox = h('div', { class: 't-martinasdorf23-opts', role: 'radiogroup', 'aria-label': 'Welche Zeichnung kann nicht die richtige Karte sein?' },
      OPTIONS.map(function (o) {
        var lab = h('label', { class: 't-martinasdorf23-opt' },
          h('input', { type: 'radio', name: 't-martinasdorf23-ans', value: o.id, 'aria-label': 'Zeichnung ' + o.id, onchange: function () { if (locked) return; choice = o.id; mark = null; render(); api.changed(); } }),
          h('span', { class: 't-martinasdorf23-letter' }, o.id),
          h('span', { class: 't-martinasdorf23-gw' }));
        lab.querySelector('.t-martinasdorf23-gw').innerHTML = graph(optEdges(o), '', o.id === SOLUTION,
          'Zeichnung ' + o.id + ': sechs Häuser, Martinas Haus M, ' + optEdges(o).length + ' Wege');
        var bad = lab.querySelector('.t-martinasdorf23-edge.bad');
        if (bad) bad.style.display = 'none';
        return lab;
      }));
    var map = h('figure', { class: 't-martinasdorf23-map' },
      h('div', { class: 't-martinasdorf23-gw' }),
      h('figcaption', null, 'Martinas besondere Karte'));
    map.querySelector('.t-martinasdorf23-gw').innerHTML = graph(TREE, 'big', false, 'Martinas besondere Karte: sechs Häuser, fünf Wege. Von Martinas Haus M führen Wege zu zwei Häusern; von dort geht es weiter zu den übrigen drei Häusern.');
    el.replaceChildren(h('div', { class: 't-martinasdorf23-board' }, map,
      h('h3', null, 'Welche Zeichnung kann nicht die richtige Karte sein?'), optBox));
  }

  function reset() { choice = null; mark = null; }

  Biber.register({
    id: 'martinasdorf23',
    story: '<p>In Martinas Dorf gibt es sechs Häuser. Außerdem gibt es Wege, über die man von einem Haus zum nächsten gehen kann. Für alle diese Wege braucht Martina die gleiche Zeit.</p>' +
      '<p>Martina hat eine besondere Karte des Dorfs gezeichnet. Sie hat darin Wege eingezeichnet, über die sie am schnellsten zu den anderen Häusern gehen kann.</p>' +
      '<p>Natürlich gibt es auch eine richtige Karte des Dorfs, mit allen Wegen.</p>',
    question: 'Welche dieser Zeichnungen kann nicht die richtige Karte sein?',
    howto: 'Tippe die Zeichnung an, die nicht die richtige Karte des Dorfs sein kann. Vergleiche mit Martinas besonderer Karte: Wie viele Wege muss sie zu jedem Haus mindestens gehen?',
    explanation: function () {
      return '<div class="t-martinasdorf23-expl"><p>Martinas besondere Karte zeigt: Das Haus ganz rechts erreicht sie am schnellsten über <strong>drei</strong> Wege. ' +
        'In Zeichnung C gibt es aber einen Weg vom oberen Haus direkt dorthin (rot). Dann ginge es in nur <strong>zwei</strong> Wegen. Also kann C nicht die richtige Karte sein. ' +
        'Bei A, B und D gibt es keine Abkürzung, deshalb können sie die richtige Karte sein.</p>' +
        '<div class="t-martinasdorf23-exfig">' + graph(optEdges(optOf('C')), 'big', true, 'Zeichnung C, der Weg oben nach rechts ist rot markiert') + '</div>' +
        '<p>Martinas Karte ist ein <strong>Baum</strong>: Alle Häuser hängen zusammen, und zwischen zwei Häusern gibt es genau einen Weg. Weil sie alle Häuser der großen Karte enthält, ' +
        'nennt man sie einen <strong>Spannbaum</strong> des Graphen. Solche Wege findet man zum Beispiel mit der Breitensuche. Sie wird in Navigationssystemen und beim Planen von Netzen gebraucht.</p></div>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.classList.add('t-martinasdorf23');
      build();
      render();
    },
    isComplete: function () { return choice != null; },
    evaluate: function () { return { correct: choice === SOLUTION, answer: { choice: choice } }; },
    setAnswer: function (ans) {
      choice = ans && typeof ans.choice === 'string' ? ans.choice : null;
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? 'check' : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () { choice = SOLUTION; locked = true; mark = 'solution'; render(); }
  });
})();
