/* Aufgabe Frowny (Heft 2024, Klasse 11-13, schwer): Kekse-Spiel (Chomp 3x3), richtigen ersten Zug wählen */
(function () {
  'use strict';
  var h = Biber.h;
  var A = 'assets/frowny24/';

  /* Spielfeld 3 x 3: Zelle = [Zeile, Spalte], Zeile 0 oben, Spalte 0 links. Der Frowny liegt unten links = [2,0].
     Wer [r,c] wählt, nimmt alle Kekse [r2,c2] mit r2 <= r (darüber) und c2 >= c (rechts davon), auch [r,c] selbst. */
  var N = 3;
  var FROWNY = '2,0';
  function key(r, c) { return r + ',' + c; }
  function allCells() { var s = []; for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) s.push(key(r, c)); return s; }
  function takenBy(r, c, cells) {
    return cells.filter(function (k) { var p = k.split(','); return +p[0] <= r && +p[1] >= c; });
  }
  function without(cells, taken) { return cells.filter(function (k) { return taken.indexOf(k) < 0; }); }

  /* Die vier Möglichkeiten A-D aus dem Heft (S. 29): gewählter Keks [Zeile, Spalte] */
  var OPTIONS = [
    { id: 'A', r: 2, c: 1 },
    { id: 'B', r: 1, c: 1 },
    { id: 'C', r: 2, c: 2 },
    { id: 'D', r: 1, c: 0 }
  ];
  var RIGHT = 'B';       /* offizielle Lösung: der mittlere Keks; per Spielbaum-Suche bestätigt (einziger Gewinnzug) */

  var POS = ['oben', 'in der Mitte', 'unten'], COL = ['links', 'in der Mitte', 'rechts'];
  function cellName(r, c) {
    return 'Keks ' + (r === 1 && c === 1 ? 'in der Mitte' : POS[r] + ' ' + COL[c]);
  }

  /* Spielfeld als HTML.
     cells: noch vorhandene Kekse; take: Zellen, die genommen werden (gelb); ring: {cell, who: 'cleo'|'dan'} */
  function boardHtml(cells, take, ring, cls) {
    var out = '<span class="t-frowny24-board ' + (cls || '') + '" aria-hidden="true">';
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
      var k = key(r, c), here = cells.indexOf(k) >= 0, tk = take && take.indexOf(k) >= 0;
      var cc = 't-frowny24-cell' + (here ? ' here' : ' gone') + (tk ? ' take' : '') + (ring && ring.cell === k ? ' ring ring-' + ring.who : '');
      out += '<span class="' + cc + '">' + (here ? '<img src="' + A + (k === FROWNY ? 'frowny' : 'keks') + '.png" alt="" width="40" height="33" draggable="false">' : '') + '</span>';
    }
    return out + '</span>';
  }
  function boardEl(cells, take, ring, cls) {
    var w = document.createElement('span');
    w.innerHTML = boardHtml(cells, take, ring, cls);
    return w.firstChild;
  }

  /* Beispielspiel aus dem Heft: Cleo oben links, Dan oben rechts (Zeile 2), Cleo Zeile 2 links, Dan unten Mitte, Cleo muss den Frowny nehmen. */
  var EXAMPLE = [
    { who: 'cleo', r: 0, c: 0 },
    { who: 'dan', r: 1, c: 2 },
    { who: 'cleo', r: 1, c: 0 },
    { who: 'dan', r: 2, c: 1 },
    { who: 'cleo', r: 2, c: 0 }
  ];
  function exampleHtml() {
    var cells = allCells();
    var parts = EXAMPLE.map(function (m, i) {
      var tk = takenBy(m.r, m.c, allCells());      /* gelb: das ganze Rechteck wie im Heft */
      var html = '<span class="t-frowny24-ex"><span class="t-frowny24-who"><img src="' + A + m.who + '.png" alt="" width="28" height="24"> ' +
        (m.who === 'cleo' ? 'Cleo' : 'Dan') + '</span>' + boardHtml(cells, tk, { cell: key(m.r, m.c), who: m.who }, 'small') + '</span>';
      cells = without(cells, tk);
      return html;
    });
    return '<div class="t-frowny24-exrow" role="img" aria-label="Beispiel: Cleo nimmt die obere Reihe. Dan nimmt den Keks rechts in der mittleren Reihe. Cleo nimmt die mittlere Reihe. Dan nimmt die beiden Kekse rechts von Frowny. Cleo muss am Ende den Frowny nehmen.">' +
      parts.join('<span class="t-frowny24-arrow" aria-hidden="true">→</span>') + '</div>';
  }

  var el, api, locked, picked, mode;
  var optsEl;

  function describe(o) {
    var tk = takenBy(o.r, o.c, allCells());
    return cellName(o.r, o.c) + ' (nimmt ' + tk.length + ' Kekse)';
  }
  function optionCard(o) {
    var sel = picked === o.id;
    var cls = 't-frowny24-opt';
    var mark = '';
    if (mode && (mode === 'solution' ? o.id === RIGHT : sel)) {
      var ok = o.id === RIGHT;
      cls += ok ? ' right' : ' wrong';
      mark = ok ? '✓' : '✗';
    }
    var input = h('input', {
      type: 'radio', name: 't-frowny24-opt', value: o.id, disabled: locked,
      'aria-label': 'Möglichkeit ' + o.id + ': ' + describe(o)
    });
    input.checked = sel;
    var tk = takenBy(o.r, o.c, allCells());
    return h('label', { class: cls },
      input,
      h('span', { class: 't-frowny24-card' },
        h('span', { class: 't-frowny24-opthead' }, o.id + ')', mark ? h('span', { class: 't-frowny24-mark', 'aria-hidden': 'true' }, mark) : null),
        boardEl(allCells(), tk, { cell: key(o.r, o.c), who: 'cleo' })));
  }
  function renderOptions() {
    optsEl.replaceChildren.apply(optsEl, OPTIONS.map(optionCard));
  }
  function onChange(e) {
    if (locked || !e.target.matches('input[type=radio]')) return;
    picked = e.target.value;
    renderOptions();
    var f = optsEl.querySelector('input:checked'); if (f) f.focus();
    api.changed('Möglichkeit ' + picked + ' gewählt.');
  }

  Biber.register({
    id: 'frowny24',
    story: '<p>In einer Schachtel sind neun Kekse. Alle sind lecker, bis auf den <b>Frowny</b> unten links.</p>' +
      '<p><img class="t-frowny24-pic" src="' + A + 'cleo.png" width="40" height="33" alt="Cleo"> Cleo und <img class="t-frowny24-pic" src="' + A + 'dan.png" width="38" height="33" alt="Dan"> Dan nehmen abwechselnd Kekse aus der Schachtel, bis sie leer ist. Cleo darf immer anfangen.</p>' +
      '<p>Man darf die Kekse nur so aus der Schachtel nehmen:</p>' +
      '<ul><li>Man wählt zuerst einen beliebigen Keks aus.</li>' +
      '<li>Dann muss man diesen Keks nehmen und zusätzlich alle Kekse aus dem rechteckigen Bereich <b>darüber und rechts</b> davon.</li></ul>' +
      '<p>Hier ist ein Beispiel. Der ausgewählte Keks ist jeweils blau (Cleo) oder rot (Dan) umrandet, der Bereich, der mitgenommen wird, ist gelb. Dummerweise muss Cleo am Ende den Frowny nehmen, um die Schachtel zu leeren.</p>' +
      exampleHtml() +
      '<p>Cleos Ziel ist, dass <b>Dan</b> auf jeden Fall den Frowny nehmen <b>muss</b>, egal welche Kekse Dan zwischendurch nimmt. Sie überlegt, welche Kekse sie am Anfang nehmen soll, um ihr Ziel sicher zu erreichen. Auch wenn Cleo zwischendurch weitere Kekse nimmt, verfolgt sie ihr Ziel.</p>',
    question: 'Hier sind vier Möglichkeiten, welche Kekse Cleo am Anfang nehmen kann. Mit einer davon kann sie ihr Ziel sicher erreichen. Mit welcher?',
    howto: 'Wähle die Möglichkeit aus (antippen oder mit den Pfeiltasten). Die blaue Umrandung zeigt den gewählten Keks, der gelbe Bereich die Kekse, die Cleo damit nimmt.',
    explanation: function () {
      var rest = without(allCells(), takenBy(1, 1, allCells()));
      return '<p>Man kann das Spiel von hinten her durchdenken. Wer nur noch den Frowny vor sich hat, muss ihn nehmen und hat verloren (<i>Verlustsituation</i>). ' +
        'Eine <i>Gewinnsituation</i> ist eine Lage, in der es einen Zug gibt, der den Gegner in eine Verlustsituation bringt. ' +
        'Eine Lage ist eine Verlustsituation, wenn jeder mögliche Zug den Gegner in eine Gewinnsituation bringt.</p>' +
        '<p>Cleo braucht also einen ersten Zug, der Dan in eine Verlustsituation bringt. Das gelingt nur mit <b>Antwort B</b>: Es bleibt ein „L“ aus Frowny, zwei Keksen darüber und zwei Keksen rechts davon.</p>' +
        '<p class="t-frowny24-res">' + boardHtml(rest, null, null, 'small') + '</p>' +
        '<p>Egal was Dan nun nimmt: Cleo kann den Winkel auf der anderen Seite wieder gleich lang machen, bis nur noch der Frowny übrig ist, den dann Dan nehmen muss. Bei A, C und D kann Dan dagegen eine Lage herstellen, in der Cleo verliert.</p>' +
        '<p><b>Informatik:</b> Das Spiel ist eine Variante des bekannten Spiels Nim; man untersucht es mit Ideen der Spieltheorie. Ein Spielbaum mit allen möglichen Zügen wäre viel zu groß. ' +
        'Weil sich Spielsituationen aber wiederholen, kann man sich ihr Ergebnis merken und wiederverwenden. Diese Strategie heißt <i>Dynamische Programmierung</i>. ' +
        'Ein Programm kann so das Spiel auch für beliebig große Spielfelder lösen und in jedem Schritt den passenden Zug bestimmen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null;
      optsEl = h('div', { class: 't-frowny24-opts', role: 'radiogroup', 'aria-label': 'Möglichkeiten für Cleos ersten Zug' });
      el.replaceChildren(h('div', { class: 't-frowny24' }, optsEl));
      optsEl.addEventListener('change', onChange);
      renderOptions();
    },
    isComplete: function () { return !!picked; },
    evaluate: function () { return { correct: picked === RIGHT, answer: picked }; },
    setAnswer: function (ans) { picked = ans || null; mode = 'check'; renderOptions(); },
    lock: function (on) {
      locked = on;
      mode = on ? (mode || 'check') : null;
      renderOptions();
    },
    reset: function () { picked = null; mode = null; renderOptions(); },
    showSolution: function () { picked = RIGHT; mode = 'solution'; locked = true; renderOptions(); }
  });
})();
