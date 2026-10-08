/* Aufgabe Bunte Straße (Heft 2020, Klasse 3-4 mittel, 5-6 einfach): Graphfärbung mit drei Farben */
(function () {
  'use strict';
  var h = Biber.h, S = Biber.svg;

  var COL = {
    r: { name: 'Rot', v: 'var(--c1)', ch: 'R' },
    b: { name: 'Blau', v: 'var(--c4)', ch: 'B' },
    g: { name: 'Grün', v: 'var(--c6)', ch: 'G' }
  };
  var ORDER = ['r', 'b', 'g'];
  /* Index 0-4: obere Straßenseite (links -> rechts), 5-9: untere Seite. null = weißes Haus */
  var FIXED = ['r', null, 'b', null, 'g', 'b', null, null, null, 'r'];
  /* Dachform: p = Spitzdach, f = Flachdach (wie im Heft) */
  var ROOF = ['p', 'p', 'p', 'p', 'f', 'f', 'p', 'f', 'p', 'p'];
  var SOLUTION = ['r', 'g', 'b', 'r', 'g', 'b', 'r', 'g', 'b', 'r'];

  function pos(i) { return (i < 5 ? 'obere' : 'untere') + ' Straßenseite, Haus ' + (i % 5 + 1); }
  /* Nachbarschaften (Kanten des Graphen) */
  var EDGES = (function () {
    var e = [], i;
    for (i = 0; i < 4; i++) { e.push([i, i + 1]); e.push([5 + i, 6 + i]); }
    for (i = 0; i < 5; i++) e.push([i, 5 + i]);
    return e;
  })();
  function conflicts(cols) {
    var bad = {};
    EDGES.forEach(function (e) {
      if (cols[e[0]] && cols[e[0]] === cols[e[1]]) { bad[e[0]] = true; bad[e[1]] = true; }
    });
    return bad;
  }

  function houseSvg(i, col) {
    var top = i < 5;
    var fill = col ? COL[col].v : 'var(--paper)';
    var kids = [];
    if (ROOF[i] === 'p') kids.push(S('polygon', { points: '4,26 30,4 56,26', class: 't-buntestrasse20-p', style: 'fill:' + fill }));
    else kids.push(S('rect', { x: 4, y: 6, width: 52, height: 20, class: 't-buntestrasse20-p', style: 'fill:' + fill }));
    kids.push(S('rect', { x: 8, y: 26, width: 44, height: 32, class: 't-buntestrasse20-p', style: 'fill:' + fill }));
    if (top) kids.push(S('rect', { x: 36, y: 40, width: 10, height: 18, class: 't-buntestrasse20-door' }));
    else kids.push(S('rect', { x: 34, y: 38, width: 11, height: 11, class: 't-buntestrasse20-win' }));
    if (col) kids.push(S('text', { x: 21, y: 52, 'text-anchor': 'middle', class: 't-buntestrasse20-ch' }, COL[col].ch));
    else kids.push(S('path', { d: 'M12 58 L12 36 M18 58 L18 36 M12 40 L18 40 M12 46 L18 46 M12 52 L18 52', class: 't-buntestrasse20-ladder' }));
    return S.apply(null, ['svg', { viewBox: '0 0 60 62', 'aria-hidden': 'true', focusable: 'false' }].concat(kids));
  }

  var el, api, cols, brush, locked, marks;

  function reset() { cols = FIXED.slice(); brush = 'r'; marks = null; }

  function paint(i) {
    if (locked || FIXED[i]) return;
    cols[i] = cols[i] === brush ? null : brush;
    render();
    api.changed();
  }

  function render() {
    var cells = cols.map(function (c, i) {
      var cls = 't-buntestrasse20-house' + (c ? '' : ' white') + (marks && marks[i] ? ' bad' : '');
      var label = pos(i) + ': ' + (c ? COL[c].name : 'weiß');
      if (FIXED[i]) {
        return h('div', { class: cls + ' fixed', role: 'img', 'aria-label': label + ' (fertig)' }, houseSvg(i, c));
      }
      return h('button', {
        type: 'button', class: cls, 'data-i': String(i), disabled: locked,
        'aria-label': label + (locked ? '' : (c === brush ? '. Antippen entfernt die Farbe' : '. Antippen streicht ' + COL[brush].name))
      }, houseSvg(i, c));
    });
    var palette = ORDER.map(function (k) {
      return h('button', {
        type: 'button', class: 't-buntestrasse20-brush', 'data-brush': k, disabled: locked,
        'aria-pressed': String(brush === k), 'aria-label': 'Farbe ' + COL[k].name
      }, h('span', { class: 't-buntestrasse20-sw', style: 'background:' + COL[k].v, 'aria-hidden': 'true' }), COL[k].name);
    });
    el.replaceChildren(h('div', { class: 't-buntestrasse20-wrap' },
      h('div', { class: 't-buntestrasse20-palette', role: 'group', 'aria-label': 'Farbtopf wählen' }, palette),
      h('div', { class: 't-buntestrasse20-street' },
        h('div', { class: 't-buntestrasse20-row', 'aria-label': 'Obere Straßenseite', role: 'group' }, cells.slice(0, 5)),
        h('div', { class: 't-buntestrasse20-road', 'aria-hidden': 'true' }),
        h('div', { class: 't-buntestrasse20-row', 'aria-label': 'Untere Straßenseite', role: 'group' }, cells.slice(5)))));
  }

  function onClick(e) {
    var b = e.target.closest('[data-brush]');
    if (b && !locked) { brush = b.dataset.brush; render(); var sel = el.querySelector('[data-brush="' + brush + '"]'); if (sel) sel.focus(); return; }
    var c = e.target.closest('[data-i]');
    if (c) {
      var i = +c.dataset.i;
      paint(i);
      var again = el.querySelector('[data-i="' + i + '"]');
      if (again) again.focus();
    }
  }

  function graphSvg() {
    var xs = [24, 64, 104, 144, 184], ys = [20, 60];
    function p(i) { return { x: xs[i % 5], y: ys[i < 5 ? 0 : 1] }; }
    var s = '<svg class="t-buntestrasse20-graph" viewBox="0 0 208 80" role="img" aria-label="Häuser-Graph: jedes Haus ein Knoten, jede Nachbarschaft eine Kante">';
    EDGES.forEach(function (e) { var a = p(e[0]), b = p(e[1]); s += '<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"/>'; });
    SOLUTION.forEach(function (c, i) { var a = p(i); s += '<circle cx="' + a.x + '" cy="' + a.y + '" r="9" style="fill:' + COL[c].v + '"/>'; });
    return s + '</svg>';
  }

  function allOk(c) {
    return c.every(Boolean) && !Object.keys(conflicts(c)).length;
  }

  Biber.register({
    id: 'buntestrasse20',
    story: '<p>An einer Straße sollen alle Häuser bunt angestrichen werden: in Rot, Blau oder Grün. Damit es nicht langweilig aussieht, gibt es zwei Regeln:</p>' +
      '<ul><li>Zwei Häuser, die auf einer Straßenseite direkt nebeneinander stehen, dürfen nicht dieselbe Farbe haben.</li>' +
      '<li>Zwei Häuser, die sich auf den beiden Straßenseiten direkt gegenüber stehen, dürfen nicht dieselbe Farbe haben.</li></ul>' +
      '<p>Einige Häuser sind schon fertig.</p>',
    question: 'Streiche auch die weißen Häuser nach den Regeln an!',
    howto: 'Wähle einen Farbtopf und tippe dann auf ein weißes Haus. Tippst du noch einmal mit derselben Farbe darauf, wird es wieder weiß.',
    explanation: function () {
      return '<p>Die Farben ergeben sich Schritt für Schritt: Die beiden weißen Häuser oben stehen jeweils zwischen zwei Häusern mit verschiedenen Farben, also bleibt nur die dritte Farbe (Grün und Rot). Danach ist beim linken weißen Haus unten die Farbe festgelegt (Rot), dann beim nächsten (Grün) und zuletzt beim letzten (Blau). Es gibt genau eine Lösung.</p>' +
        '<p>Die Häuser kann man als Graph modellieren: Jedes Haus ist ein Knoten, jede direkte Nachbarschaft eine Kante. Gefragt ist dann eine Knotenfärbung, bei der verbundene Knoten verschiedene Farben haben.</p>' +
        graphSvg() +
        '<p>Nach dem Vier-Farben-Satz genügen bei jedem Graphen, dessen Kanten sich nicht kreuzen, vier Farben. Solche Färbungen braucht man zum Beispiel, um Frequenzen an Sendemasten so zu verteilen, dass sie sich nicht stören.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      render();
    },
    isComplete: function () { return cols.every(Boolean); },
    evaluate: function () { return { correct: allOk(cols), answer: cols.slice() }; },
    setAnswer: function (ans) { cols = ans.slice(); marks = null; render(); },
    lock: function (on) {
      locked = on;
      marks = on && cols.every(Boolean) ? conflicts(cols) : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () { cols = SOLUTION.slice(); marks = null; locked = true; render(); }
  });
})();
