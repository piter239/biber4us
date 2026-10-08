/* Aufgabe In einem Zug (Heft 2020, Klasse 5-6 mittel, 7-8 einfach): Eulerscher Pfad */
(function () {
  'use strict';
  var h = Biber.h, S = Biber.svg;

  /* Knoten in einem 100x100-Feld, Kanten als Paare von Knotennamen */
  var OPT = {
    A: {
      alt: 'Sechs Punkte: Eine waagerechte Linie oben mit Punkt in der Mitte, von dort drei Striche nach links unten, geradeaus unten und rechts unten, rechts außen ein senkrechter Strich vom rechten oberen zum rechten unteren Punkt.',
      n: { TL: [12, 14], M: [50, 14], TR: [88, 14], BL: [14, 86], BM: [50, 86], BR: [88, 86] },
      e: [['TL', 'M'], ['M', 'TR'], ['M', 'BL'], ['M', 'BM'], ['M', 'BR'], ['TR', 'BR']]
    },
    B: {
      alt: 'Sechs Punkte: Zwei Striche von links oben und rechts oben treffen sich in der Mitte, ein senkrechter Strich führt nach unten, dort teilt er sich in zwei Striche nach links unten und rechts unten, die unten durch einen waagerechten Strich verbunden sind.',
      n: { TL: [14, 14], TR: [86, 14], Mt: [50, 40], Mb: [50, 63], BL: [14, 87], BR: [86, 87] },
      e: [['TL', 'Mt'], ['TR', 'Mt'], ['Mt', 'Mb'], ['Mb', 'BL'], ['Mb', 'BR'], ['BL', 'BR']]
    },
    C: {
      alt: 'Sechs Punkte: Wie bei B, aber zusätzlich verbindet ein waagerechter Strich die Punkte links oben und rechts oben. Die Zeichnung sieht aus wie eine Sanduhr.',
      n: { TL: [14, 14], TR: [86, 14], Mt: [50, 40], Mb: [50, 63], BL: [14, 87], BR: [86, 87] },
      e: [['TL', 'Mt'], ['TR', 'Mt'], ['Mt', 'Mb'], ['Mb', 'BL'], ['Mb', 'BR'], ['BL', 'BR'], ['TL', 'TR']]
    },
    D: {
      alt: 'Sieben Punkte: Ein großes Quadrat mit vier Ecken und, nicht damit verbunden, ein kleines Dreieck in der Mitte.',
      n: { a: [12, 14], b: [88, 14], c: [88, 86], d: [12, 86], x: [34, 40], y: [66, 40], z: [50, 68] },
      e: [['a', 'b'], ['b', 'c'], ['c', 'd'], ['d', 'a'], ['x', 'y'], ['y', 'z'], ['z', 'x']]
    }
  };
  var LETTERS = ['A', 'B', 'C', 'D'];
  /* Ein möglicher Zug für C (wie im Heft): Knotenfolge */
  var C_PATH = ['Mt', 'TL', 'TR', 'Mt', 'Mb', 'BL', 'BR', 'Mb'];

  function degrees(g) {
    var d = {};
    Object.keys(g.n).forEach(function (k) { d[k] = 0; });
    g.e.forEach(function (e) { d[e[0]]++; d[e[1]]++; });
    return d;
  }
  function oddNodes(g) { var d = degrees(g); return Object.keys(d).filter(function (k) { return d[k] % 2; }); }
  function connected(g) {
    var d = degrees(g), act = Object.keys(d).filter(function (k) { return d[k] > 0; });
    if (!act.length) return true;
    var seen = {}, st = [act[0]];
    seen[act[0]] = true;
    while (st.length) {
      var v = st.pop();
      g.e.forEach(function (e) {
        var w = e[0] === v ? e[1] : e[1] === v ? e[0] : null;
        if (w && !seen[w]) { seen[w] = true; st.push(w); }
      });
    }
    return act.every(function (k) { return seen[k]; });
  }
  /* Satz von Euler: zusammenhängend und höchstens zwei Knoten mit ungeradem Grad */
  function inOneStroke(g) { var o = oddNodes(g).length; return connected(g) && (o === 0 || o === 2); }

  function caption(g) {
    var o = oddNodes(g).length;
    if (!connected(g)) return 'Zwei getrennte Teile';
    return o + ' Punkte mit ungerader Strichzahl';
  }

  function drawing(L, reveal, showPath) {
    var g = OPT[L], kids = [];
    kids.push(S('rect', { x: 2, y: 2, width: 96, height: 96, rx: 4, class: 't-ineinemzug20-sheet' }));
    g.e.forEach(function (e) {
      var a = g.n[e[0]], b = g.n[e[1]];
      kids.push(S('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: 't-ineinemzug20-line' }));
    });
    if (showPath) {
      for (var i = 0; i + 1 < C_PATH.length; i++) {
        var p = g.n[C_PATH[i]], q = g.n[C_PATH[i + 1]];
        var mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
        var dx = q[0] - p[0], dy = q[1] - p[1], len = Math.sqrt(dx * dx + dy * dy) || 1;
        var ox = -dy / len * 8, oy = dx / len * 8;
        var d1 = Math.pow(mx + ox - 50, 2) + Math.pow(my + oy - 50, 2), d2 = Math.pow(mx - ox - 50, 2) + Math.pow(my - oy - 50, 2);
        if (d2 > d1 + 0.01 || (Math.abs(d1 - d2) <= 0.01 && ox < 0)) { ox = -ox; oy = -oy; }
        kids.push(S('circle', { cx: mx + ox, cy: my + oy, r: 5.2, class: 't-ineinemzug20-num' }));
        kids.push(S('text', { x: mx + ox, y: my + oy + 2.2, 'text-anchor': 'middle', class: 't-ineinemzug20-numt' }, String(i + 1)));
      }
    }
    var odd = reveal ? oddNodes(g) : [];
    Object.keys(g.n).forEach(function (k) {
      var pt = g.n[k];
      if (odd.indexOf(k) >= 0) kids.push(S('circle', { cx: pt[0], cy: pt[1], r: 7.5, class: 't-ineinemzug20-odd' }));
      kids.push(S('circle', { cx: pt[0], cy: pt[1], r: 3.2, class: 't-ineinemzug20-dot' }));
    });
    return S.apply(null, ['svg', { viewBox: '0 0 100 100', 'aria-hidden': 'true', focusable: 'false' }].concat(kids));
  }

  var el, api, sel, locked, mode;   /* mode: null | 'check' | 'solution' */

  function render() {
    var cards = LETTERS.map(function (L) {
      var g = OPT[L], ok = inOneStroke(g);
      var cls = 't-ineinemzug20-card' + (sel === L ? ' selected' : '');
      if (mode === 'check' && sel === L) cls += ok ? ' right' : ' wrong';
      if (mode === 'solution' && ok) cls += ' right';
      var reveal = !!mode;
      return h('label', { class: cls },
        h('span', { class: 't-ineinemzug20-letter' }, L + ')'),
        h('input', {
          type: 'radio', name: 't-ineinemzug20', value: L, checked: sel === L, disabled: locked,
          'aria-label': 'Antwort ' + L + ': ' + g.alt
        }),
        h('span', { class: 't-ineinemzug20-pic' }, drawing(L, reveal, mode === 'solution' && L === 'C')),
        h('span', { class: 't-ineinemzug20-cap', 'aria-live': 'polite' }, reveal ? caption(g) + (ok ? ': in einem Zug möglich' : '') : ' '));
    });
    el.replaceChildren(h('div', { class: 't-ineinemzug20-grid', role: 'radiogroup', 'aria-label': 'Strichzeichnungen A bis D' }, cards));
  }

  function onChange(e) {
    if (locked || !e.target.matches('input[type=radio]')) return;
    sel = e.target.value;
    render();
    var again = el.querySelector('input[value="' + sel + '"]');
    if (again) again.focus();
    api.changed();
  }

  Biber.register({
    id: 'ineinemzug20',
    story: '<p>Eine Strichzeichnung besteht aus Punkten und Strichen. Jeder Strich verbindet zwei Punkte miteinander.</p>' +
      '<p>Manche Strichzeichnungen können in einem Zug gezeichnet werden. Das heißt:</p>' +
      '<ul><li>Der Stift wird erst vom Blatt abgehoben, wenn die Zeichnung fertig ist.</li>' +
      '<li>Jeder Strich wird nur einmal gezeichnet.</li></ul>',
    question: 'Welche dieser Strichzeichnungen kann in einem Zug gezeichnet werden?',
    howto: 'Tippe die Zeichnung an, die du für richtig hältst.',
    explanation: function () {
      return '<p><b>Antwort C ist richtig.</b> Man kann bei einem der beiden oberen Mittelpunkte der Sanduhr anfangen und im anderen aufhören (siehe Nummern in der Lösung).</p>' +
        '<p>Entscheidend ist, wie viele Striche sich in einem Punkt treffen. Zu jedem Strich, mit dem man in einem Punkt ankommt, muss es einen anderen geben, mit dem man weiterzeichnet. Die Striche bilden dort also Paare, es sind gerade viele. Nur beim Anfangs- und beim Endpunkt darf die Zahl ungerade sein. Bei A und B gibt es vier solche Punkte, bei D besteht die Zeichnung aus zwei getrennten Teilen.</p>' +
        '<p>Die Zeichnung ist ein Graph aus Knoten und Kanten. Ein Weg, der jede Kante genau einmal benutzt, heißt Eulerscher Pfad, nach Leonhard Euler und seinem Problem der sieben Brücken von Königsberg.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; sel = null; locked = false; mode = null;
      el.addEventListener('change', onChange);
      render();
    },
    isComplete: function () { return !!sel; },
    evaluate: function () { return { correct: inOneStroke(OPT[sel]), answer: sel }; },
    setAnswer: function (ans) { sel = ans; mode = null; render(); },
    lock: function (on) {
      locked = on;
      mode = on && sel ? (mode === 'solution' ? 'solution' : 'check') : null;
      render();
    },
    reset: function () { sel = null; mode = null; render(); },
    showSolution: function () { sel = 'C'; locked = true; mode = 'solution'; render(); }
  });
})();
