/* Aufgabe Arten (Heft 2016, Klasse 5-6 schwer, 7-8 mittel, 9-10 einfach): Wissensrepräsentation, Objektorientierung, Vererbung */
(function () {
  'use strict';
  var h = Biber.h;
  var svg = Biber.svg;

  /* Baum: Name -> Oberart; Lage x in Prozent, Zeile 0 bis 3 */
  var NODES = [
    { n: 'Kroklokwafzi', p: null, x: 50, r: 0 },
    { n: 'Seiokrontro', p: 'Kroklokwafzi', x: 25, r: 1 },
    { n: 'Semememi', p: 'Kroklokwafzi', x: 75, r: 1 },
    { n: 'Prafriplo', p: 'Seiokrontro', x: 15, r: 2 },
    { n: 'Lalulalula', p: 'Seiokrontro', x: 39, r: 2 },
    { n: 'Bifzi', p: 'Semememi', x: 61, r: 2 },
    { n: 'Hulalemi', p: 'Semememi', x: 82, r: 2 },
    { n: 'Zasku', p: 'Prafriplo', x: 10, r: 3 },
    { n: 'Basti', p: 'Prafriplo', x: 29, r: 3 },
    { n: 'Hontraruru', p: 'Hulalemi', x: 66, r: 3 },
    { n: 'Miromente', p: 'Hulalemi', x: 89, r: 3 }
  ];
  var ROW_H = 62, NODE_H = 30, TOTAL_H = 3 * ROW_H + NODE_H + 4;

  /* Behauptungen "Alle X sind auch Y" (all = true) bzw. "Manche X sind keine Y" (all = false) */
  var STATEMENTS = [
    { l: 'A', x: 'Basti', y: 'Seiokrontro', all: true, text: 'Alle Basti sind auch Seiokrontro.' },
    { l: 'B', x: 'Hontraruru', y: 'Semememi', all: false, text: 'Manche Hontraruru sind keine Semememi.' },
    { l: 'C', x: 'Zasku', y: 'Bifzi', all: true, text: 'Alle Zasku sind auch Bifzi.' },
    { l: 'D', x: 'Prafriplo', y: 'Basti', all: true, text: 'Alle Prafriplo sind auch Basti.' }
  ];
  var RIGHT = 0;

  function byName(n) { return NODES.filter(function (k) { return k.n === n; })[0]; }
  /* Alle X sind Y genau dann, wenn Y gleich X oder eine Oberart von X ist */
  function isA(x, y) {
    var k = byName(x);
    while (k) { if (k.n === y) return true; k = k.p ? byName(k.p) : null; }
    return false;
  }
  function holds(s) { var a = isA(s.x, s.y); return s.all ? a : !a; }

  function treeLabel() {
    var kids = {};
    NODES.forEach(function (k) { if (k.p) (kids[k.p] = kids[k.p] || []).push(k.n); });
    return 'Baumdiagramm der Tierarten, von oben nach unten: ' + NODES.filter(function (k) { return kids[k.n]; }).map(function (k) {
      return k.n + ' hat die Unterarten ' + kids[k.n].join(' und ');
    }).join('. ') + '.';
  }

  function tree() {
    var lines = NODES.filter(function (k) { return k.p; }).map(function (k) {
      var p = byName(k.p);
      return svg('line', { x1: p.x, y1: p.r * ROW_H + NODE_H, x2: k.x, y2: k.r * ROW_H, class: 't-arten16-line' });
    });
    var boxes = NODES.map(function (k) {
      return h('span', { class: 't-arten16-node', style: 'left:' + k.x + '%;top:' + k.r * ROW_H + 'px' }, k.n);
    });
    return h('div', { class: 't-arten16-tree', role: 'img', 'aria-label': treeLabel(), style: 'height:' + TOTAL_H + 'px' },
      svg.apply(null, ['svg', { class: 't-arten16-lines', viewBox: '0 0 100 ' + TOTAL_H, preserveAspectRatio: 'none', 'aria-hidden': 'true', focusable: 'false' }].concat(lines)),
      boxes);
  }

  var el, api, locked, picked, mode, optsEl;

  function optionCard(s, idx) {
    var sel = picked === idx;
    var cls = 't-arten16-opt';
    var mark = '';
    if (mode && (mode === 'solution' ? idx === RIGHT : sel)) {
      var ok = idx === RIGHT;
      cls += ok ? ' right' : ' wrong';
      mark = ok ? '✓' : '✗';
    }
    var input = h('input', { type: 'radio', name: 't-arten16-opt', value: String(idx), disabled: locked, 'aria-label': 'Antwort ' + s.l + ': ' + s.text });
    input.checked = sel;
    return h('label', { class: cls }, input,
      h('span', { class: 't-arten16-card' },
        h('span', { class: 't-arten16-let' }, s.l + ')'),
        h('span', { class: 't-arten16-txt' }, s.text),
        mark ? h('span', { class: 't-arten16-mark', 'aria-hidden': 'true' }, mark) : null));
  }
  function renderOpts() { optsEl.replaceChildren.apply(optsEl, STATEMENTS.map(optionCard)); }

  function onChange(e) {
    if (locked || !e.target.matches('input[type=radio]')) return;
    picked = +e.target.value;
    renderOpts();
    var f = optsEl.querySelector('input:checked'); if (f) f.focus();
    api.changed('Antwort ' + STATEMENTS[picked].l + ' gewählt.');
  }

  Biber.register({
    id: 'arten16',
    story: '<p>Das Bild beschreibt die Beziehungen zwischen Tierarten auf dem Planeten Morgenstern. ' +
      'Eine Linie zwischen zwei Tierarten bedeutet, dass <b>alle Tiere der unteren Art auch Tiere der oberen Art</b> sind.</p>' +
      '<div class="t-arten16-figure">' + tree().outerHTML + '</div>' +
      '<p>Beispielsweise sind alle Hulalemi auch Semememi. Manche Seiokrontro sind hingegen keine Basti.</p>',
    question: 'Nur eine der folgenden Behauptungen ist richtig. Welche?',
    howto: 'Wähle eine Behauptung aus.',
    explanation: function () {
      return '<p><b>Antwort A ist richtig:</b> Alle Basti sind Prafriplo, und alle Prafriplo sind Seiokrontro. Also sind auch alle Basti Seiokrontro.</p>' +
        '<ul class="t-arten16-why">' +
        '<li><b>B</b> stimmt nicht: Hontraruru sind Hulalemi, und die sind Semememi. Also sind alle Hontraruru Semememi.</li>' +
        '<li><b>C</b> stimmt nicht: Zasku sind Seiokrontro, und Seiokrontro sind keine Semememi – sie liegen auf einem anderen Ast des Baums. Also sind Zasku auch keine Bifzi, denn Bifzi sind Semememi.</li>' +
        '<li><b>D</b> stimmt nicht: Auch die Zasku sind Prafriplo, aber keine Basti. Es gibt also Prafriplo, die keine Basti sind.</li></ul>' +
        '<p><b>Informatik:</b> Programme beschreiben Objekte der Welt in <i>Klassen</i> (hier: Arten). Eine Klasse kann Unterklasse einer Oberklasse sein, so wie jeder Joghurt auch ein Milchprodukt ist. ' +
        'Eigenschaften der Oberklasse werden an die Unterklassen <i>vererbt</i>: Weiß das Programm, dass Milchprodukte gekühlt werden müssen, dann weiß es das auch für Joghurt. ' +
        'Dem Computer ist es dabei egal, wie die Klassen heißen – nur Menschen, die das Programm lesen, haben mit Namen wie „Seiokrontro“ Schwierigkeiten.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null;
      optsEl = h('div', { class: 't-arten16-opts', role: 'radiogroup', 'aria-label': 'Behauptungen' });
      el.replaceChildren(h('div', { class: 't-arten16-box' }, optsEl));
      optsEl.addEventListener('change', onChange);
      renderOpts();
    },
    isComplete: function () { return picked !== null; },
    evaluate: function () { return { correct: picked === RIGHT, answer: picked === null ? null : STATEMENTS[picked].l }; },
    setAnswer: function (ans) {
      picked = null;
      STATEMENTS.forEach(function (s, i) { if (s.l === ans) picked = i; });
      mode = 'check'; renderOpts();
    },
    lock: function (on) { locked = on; mode = on ? (mode || 'check') : null; renderOpts(); },
    reset: function () { picked = null; mode = null; renderOpts(); },
    showSolution: function () { picked = RIGHT; mode = 'solution'; locked = true; renderOpts(); }
  });

  /* Selbstprüfung: genau Behauptung A ist wahr; Beispiele aus dem Text */
  (function () {
    var ok = STATEMENTS.filter(holds);
    if (ok.length !== 1 || ok[0].l !== 'A' || RIGHT !== 0) throw new Error('arten16: Lösung stimmt nicht');
    if (!isA('Hulalemi', 'Semememi') || isA('Seiokrontro', 'Basti') || isA('Basti', 'Seiokrontro') === false) throw new Error('arten16: Beispiele stimmen nicht');
  })();
})();
