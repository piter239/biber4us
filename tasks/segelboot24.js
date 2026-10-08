/* Aufgabe Segelboot (Biber 2024, S. 61; Klasse 3-4 mittel, 5-6 einfach): Eulerweg, Startpunkte */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-segelboot24-';
  var NS = 'http://www.w3.org/2000/svg';

  /* Punkte der Zeichnung (nach dem Bild im Heft; senkrecht um 1,25 gestreckt, damit man sie gut antippen kann) */
  var VY = 1.25;
  function pt(id, x, y, name) { return { id: id, x: x, y: Math.round(y * VY), name: name }; }
  var NODES = [
    pt('T', 182, 20, 'Spitze des Mastes oben'),
    pt('SL', 47, 161, 'linke Ecke des Segels'),
    pt('M1', 182, 161, 'Mast in Höhe der Segel-Unterkante'),
    pt('SR', 314, 161, 'rechte Ecke des Segels'),
    pt('HL', 26, 198, 'linke obere Ecke des Rumpfs'),
    pt('M2', 182, 196, 'Mast auf dem Rumpf'),
    pt('HR', 337, 198, 'rechte obere Ecke des Rumpfs'),
    pt('BL', 81, 238, 'linke untere Ecke des Rumpfs'),
    pt('BR', 281, 238, 'rechte untere Ecke des Rumpfs')
  ];
  var BY = {};
  NODES.forEach(function (n) { BY[n.id] = n; });
  /* Linien (Kanten) der Zeichnung */
  var EDGES = [
    ['T', 'SL'], ['T', 'SR'], ['T', 'M1'], ['SL', 'M1'], ['M1', 'SR'], ['M1', 'M2'],
    ['HL', 'M2'], ['M2', 'HR'], ['HL', 'BL'], ['BL', 'BR'], ['BR', 'HR']
  ];
  /* Ein Eulerweg (Lösung S. 61: vom unteren roten Punkt erst Rumpf, dann Mast und Segel bis zum oberen roten Punkt) */
  var PATH = ['M2', 'HL', 'BL', 'BR', 'HR', 'M2', 'M1', 'SL', 'T', 'M1', 'SR', 'T'];

  function degree(id) { return EDGES.filter(function (e) { return e[0] === id || e[1] === id; }).length; }
  /* Startpunkte eines Eulerwegs: genau zwei Punkte mit ungerader Linienzahl (die Zeichnung hängt zusammen) */
  var ODD = NODES.filter(function (n) { return degree(n.id) % 2 === 1; }).map(function (n) { return n.id; }).sort();

  var el, api, locked, sel, mark, solutionShown;

  function reset() { sel = {}; mark = null; solutionShown = false; }
  function chosen() { return NODES.filter(function (n) { return sel[n.id]; }).map(function (n) { return n.id; }).sort(); }
  function isRight() { return chosen().join(',') === ODD.join(','); }

  function s(tag, attrs, kids) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }

  function nodeState(n) {
    var on = !!sel[n.id], odd = ODD.indexOf(n.id) >= 0;
    if (mark === 'solution') return on ? 'right' : 'off';
    if (mark === 'check') {
      if (on && odd) return 'right';
      if (on && !odd) return 'wrong';
      if (!on && odd) return 'missed';
    }
    return on ? 'on' : 'off';
  }
  var STATE_TXT = { on: 'gewählt', off: 'nicht gewählt', right: 'gewählt, richtig', wrong: 'gewählt, falsch', missed: 'nicht gewählt, aber nötig' };

  function render() {
    var svg = s('svg', { class: P + 'svg', viewBox: '0 0 363 ' + (Math.round(238 * VY) + 24), role: 'group', 'aria-label': 'Zeichnung eines Segelboots aus Punkten und Linien. Wähle die Punkte, an denen Sophie begonnen haben kann.' });
    EDGES.forEach(function (e) {
      var a = BY[e[0]], b = BY[e[1]];
      svg.appendChild(s('line', { class: P + 'edge', x1: a.x, y1: a.y, x2: b.x, y2: b.y }));
    });
    if (mark === 'solution') {
      /* der Weg aus dem Heft: Linie für Linie mit Pfeil und Nummer */
      for (var i = 0; i < PATH.length - 1; i++) {
        var a = BY[PATH[i]], b = BY[PATH[i + 1]];
        var dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
        var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        var g = s('g', { 'aria-hidden': 'true' });
        g.appendChild(s('line', { class: P + 'way', x1: a.x, y1: a.y, x2: b.x, y2: b.y }));
        g.appendChild(s('path', { class: P + 'arrow', d: 'M' + (mx + ux * 7) + ' ' + (my + uy * 7) + 'L' + (mx - ux * 5 - uy * 6) + ' ' + (my - uy * 5 + ux * 6) + 'L' + (mx - ux * 5 + uy * 6) + ' ' + (my - uy * 5 - ux * 6) + 'Z' }));
        svg.appendChild(g);
      }
    }
    NODES.forEach(function (n) {
      var st = nodeState(n);
      var g = s('g', {
        class: P + 'node ' + st, tabindex: locked ? '-1' : '0', role: 'checkbox', 'data-node': n.id,
        'aria-checked': String(!!sel[n.id]), 'aria-disabled': locked ? 'true' : 'false',
        'aria-label': 'Punkt ' + n.name + ': ' + STATE_TXT[st]
      });
      g.appendChild(s('circle', { class: P + 'hit', cx: n.x, cy: n.y, r: 19 }));
      g.appendChild(s('circle', { class: P + 'dot', cx: n.x, cy: n.y, r: 12.5 }));
      if (st === 'on' || st === 'right' || st === 'wrong') {
        var t = s('text', { class: P + 'tick', x: n.x, y: n.y + 5, 'text-anchor': 'middle', 'aria-hidden': 'true' });
        t.textContent = st === 'wrong' ? '✗' : '✓';
        g.appendChild(t);
      }
      svg.appendChild(g);
    });
    el.replaceChildren(h('div', { class: P + 'board' }, svg));
  }

  function toggle(id) {
    if (locked) return;
    if (sel[id]) delete sel[id]; else sel[id] = true;
    mark = null;
    render();
    var again = el.querySelector('[data-node="' + id + '"]');
    if (again) again.focus();
    api.changed(chosen().length ? 'Gewählt: ' + chosen().length + (chosen().length === 1 ? ' Punkt' : ' Punkte') : '');
  }
  function onClick(e) {
    var g = e.target.closest('[data-node]');
    if (g) toggle(g.getAttribute('data-node'));
  }
  function onKey(e) {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    var g = e.target.closest('[data-node]');
    if (!g) return;
    e.preventDefault();
    toggle(g.getAttribute('data-node'));
  }

  Biber.register({
    id: 'segelboot24',
    story:
      '<p>Sophie hat ein Segelboot gezeichnet. Sie hat es <b>in einem Zug</b> gezeichnet, den Stift also niemals angehoben, ' +
      'und <b>jede Linie nur genau einmal</b> gezeichnet.</p>',
    question: 'An welchen der markierten Punkte kann Sophie mit dem Zeichnen begonnen haben?',
    howto: 'Tippe die Punkte an, an denen Sophie begonnen haben kann. Du kannst mehrere Punkte wählen; tippst du einen Punkt noch einmal an, ist er wieder abgewählt.',
    explanation: function () {
      return '<p>Sophie kann an <b>beiden</b> Punkten beginnen, an denen eine <b>ungerade</b> Anzahl von Linien zusammenkommt: ganz oben an der Mastspitze (3 Linien) und unten, wo der Mast auf den Rumpf trifft (3 Linien). ' +
        'Von allen anderen Punkten gehen 2 oder 4 Linien aus. Beginnt Sophie unten, zeichnet sie zuerst den Rumpf nach, dann Mast und Segel und kommt oben an; beginnt sie oben, geht es genau umgekehrt.</p>' +
        '<p>Warum? Bei einem Punkt mit gerader Linienzahl kann man immer wieder hinausgehen, wenn man hineingekommen ist. Bei ungerader Linienzahl bleibt zuletzt eine Linie übrig: Dort muss der Weg beginnen oder enden. ' +
        'Es gibt genau zwei solche Punkte, also beginnt der Weg im einen und endet im anderen.</p>' +
        '<p>Die Zeichnung ist ein <i>Graph</i> aus Knoten (Punkten) und Kanten (Linien). Einen Weg, der jede Kante genau einmal benutzt, nennt man <i>Eulerweg</i>. ' +
        'Man findet ihn zum Beispiel, wenn man einen Spaziergang plant, der jede Straße genau einmal benutzt.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKey);
      render();
    },
    isComplete: function () { return chosen().length > 0; },
    evaluate: function () { return { correct: isRight(), answer: chosen() }; },
    setAnswer: function (ans) {
      sel = {};
      (ans || []).forEach(function (id) { if (BY[id]) sel[id] = true; });
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      if (on && mark !== 'solution') mark = 'check';
      if (!on) mark = null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      sel = {};
      ODD.forEach(function (id) { sel[id] = true; });
      locked = true; mark = 'solution';
      render();
    }
  });
})();
