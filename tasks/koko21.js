/* Aufgabe Der Affe Koko (Heft 2021, S. 17; Klasse 9-10 schwer, 11-13 mittel): größte Zusammenhangskomponente in einem Graphen (Sprunggruppe) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-koko21-';
  var SVGNS = 'http://www.w3.org/2000/svg';

  var SIZE = 11;
  /* Bäume als [Zeile, Spalte] (0-basiert), abgelesen aus dem Bild im Heft S. 17 und mit der Lösungsabbildung S. 18 abgeglichen */
  var TREES = [[0, 2], [0, 3], [1, 0], [1, 4], [1, 8], [2, 1], [2, 4], [2, 6], [2, 9], [3, 2], [3, 8], [3, 10], [4, 1], [4, 5], [4, 6], [4, 9],
    [5, 2], [5, 5], [6, 10], [7, 1], [7, 10], [8, 0], [8, 2], [8, 4], [8, 7], [9, 0], [9, 5], [9, 10], [10, 1], [10, 8], [10, 10]];
  /* Sprungweite: grüner Bereich im Heft = alle Felder mit |Δzeile| + |Δspalte| ≤ 2 */
  function reach(a, b) { return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) <= 2; }

  /* Sprunggruppen (Zusammenhangskomponenten) bestimmen */
  function components() {
    var comp = TREES.map(function () { return -1; }), n = 0;
    TREES.forEach(function (t, i) {
      if (comp[i] >= 0) return;
      var stack = [i]; comp[i] = n;
      while (stack.length) {
        var a = stack.pop();
        TREES.forEach(function (u, j) {
          if (comp[j] < 0 && reach(TREES[a], u)) { comp[j] = n; stack.push(j); }
        });
      }
      n++;
    });
    return { comp: comp, count: n };
  }
  var CC = components();
  var SIZES = [];
  for (var q = 0; q < CC.count; q++) SIZES.push(CC.comp.filter(function (c) { return c === q; }).length);
  var BIG = SIZES.indexOf(Math.max.apply(null, SIZES));   /* eindeutig: 8 Bäume (im Heft die „blauen“ Bäume), per Skript geprüft */
  var SOLUTION = TREES.map(function (t, i) { return i; }).filter(function (i) { return CC.comp[i] === BIG; });

  function s(tag, attrs) {
    var e = document.createElementNS(SVGNS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function treeSvg(cls) {
    var svg = s('svg', { viewBox: '0 0 40 40', class: cls, 'aria-hidden': 'true', focusable: 'false' });
    svg.appendChild(s('path', { class: P + 'crown', d: 'M20 3 Q22 3 23.5 6 L35.5 31 Q37 35 32.5 35 H7.5 Q3 35 4.5 31 L16.5 6 Q18 3 20 3Z' }));
    svg.appendChild(s('rect', { class: P + 'trunk', x: 18.2, y: 19, width: 3.6, height: 17, rx: 1 }));
    svg.appendChild(s('path', { class: P + 'twig', d: 'M20 25 L15.5 20.5 M20 25 L24.5 20.5 M20 31 L16.5 27.5 M20 31 L23.5 27.5', fill: 'none' }));
    return svg;
  }
  function monkeySvg() {
    var svg = s('svg', { viewBox: '0 0 30 30', class: P + 'monkey', 'aria-hidden': 'true', focusable: 'false' });
    svg.appendChild(s('circle', { cx: 6, cy: 11, r: 4.5, class: P + 'mfur' }));
    svg.appendChild(s('circle', { cx: 24, cy: 11, r: 4.5, class: P + 'mfur' }));
    svg.appendChild(s('circle', { cx: 15, cy: 14, r: 10, class: P + 'mfur' }));
    svg.appendChild(s('ellipse', { cx: 15, cy: 18, rx: 6.5, ry: 5.5, class: P + 'mface' }));
    svg.appendChild(s('circle', { cx: 11.5, cy: 12.5, r: 1.6, class: P + 'meye' }));
    svg.appendChild(s('circle', { cx: 18.5, cy: 12.5, r: 1.6, class: P + 'meye' }));
    svg.appendChild(s('path', { d: 'M12 20 Q15 22.5 18 20', class: P + 'mmouth', fill: 'none' }));
    return svg;
  }

  /* Kleine Beispielbilder (5x5): Sprungbereich und Beispiel aus dem Heft */
  function exampleGrid(withTrees) {
    var box = h('div', { class: P + 'ex', 'aria-hidden': 'true' });
    var TR = withTrees ? [[1, 2, 'in'], [2, 0, 'in'], [3, 3, 'in'], [0, 1, 'out'], [1, 4, 'out'], [4, 1, 'out']] : [];
    for (var r = 0; r < 5; r++) for (var c = 0; c < 5; c++) {
      var cell = h('span', { class: P + 'exc' + (Math.abs(r - 2) + Math.abs(c - 2) <= 2 ? ' ' + P + 'in' : '') });
      TR.forEach(function (t) { if (t[0] === r && t[1] === c) { cell.appendChild(treeSvg(P + 'extree ' + P + (t[2] === 'in' ? 'tin' : 'tout'))); } });
      if (r === 2 && c === 2) { cell.appendChild(treeSvg(P + 'extree ' + P + 'tin')); cell.appendChild(monkeySvg()); }
      box.appendChild(cell);
    }
    return box;
  }

  var el, api, grid, btns, marked, locked, mark, statusEl;
  var focusIdx;

  function reset() { marked = TREES.map(function () { return false; }); mark = null; }
  function cellIdx(r, c) { return TREES.findIndex(function (t) { return t[0] === r && t[1] === c; }); }

  function refresh() {
    var n = marked.filter(Boolean).length;
    btns.forEach(function (b, i) {
      var on = marked[i], should = SOLUTION.indexOf(i) >= 0;
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-disabled', locked ? 'true' : 'false');
      b.classList.toggle('on', on);
      b.classList.toggle('right', mark !== null && on && should);
      b.classList.toggle('wrong', mark === 'check' && on && !should);
      b.classList.toggle('missed', mark === 'check' && !on && should);
      var m = b.querySelector('.' + P + 'mark');
      if (m) m.remove();
      if (mark !== null && ((on && should) || (mark === 'check' && on !== should))) {
        b.appendChild(h('span', { class: P + 'mark', 'aria-hidden': 'true' }, (on && should) ? '✓' : (on ? '✗' : '!')));
      }
      b.tabIndex = i === focusIdx ? 0 : -1;
    });
    statusEl.textContent = n === 0 ? 'Noch kein Baum markiert.' : (n === 1 ? '1 Baum markiert.' : n + ' Bäume markiert.');
  }
  function toggle(i) {
    if (locked) return;
    marked[i] = !marked[i];
    refresh();
    api.changed();
  }
  /* Sprungbereich des Baums i im Gitter anzeigen (Hilfe beim Überfahren/Fokussieren) */
  function showRange(i) {
    var cells = grid.querySelectorAll('.' + P + 'cell');
    var t = i === null ? null : TREES[i];
    cells.forEach(function (cell, k) {
      var r = Math.floor(k / SIZE), c = k % SIZE;
      cell.classList.toggle('range', !!t && reach(t, [r, c]));
    });
    btns.forEach(function (b, j) { b.classList.toggle('near', i !== null && j !== i && reach(TREES[i], TREES[j])); });
  }
  function onKey(e) {
    var i = btns.indexOf(e.currentTarget), d = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] }[e.key];
    if (!d) return;
    e.preventDefault();
    /* nächster Baum in dieser Richtung: kleinster Abstand in Richtung, dann kleinste Abweichung quer */
    var t = TREES[i], best = -1, bestScore = Infinity;
    TREES.forEach(function (u, j) {
      var along = (u[0] - t[0]) * d[0] + (u[1] - t[1]) * d[1];
      var across = Math.abs((u[0] - t[0]) * d[1]) + Math.abs((u[1] - t[1]) * d[0]);
      if (along <= 0) return;
      var score = along + 2 * across;
      if (score < bestScore) { bestScore = score; best = j; }
    });
    if (best >= 0) { focusIdx = best; refresh(); btns[best].focus(); }
  }

  function coloredMap() {
    var COL = ['var(--c4)', 'var(--c1)', 'var(--c2)', 'var(--c6)', 'var(--c5)', 'var(--muted)'];
    /* Farbe je Komponente: größte Gruppe blau, Einzelbaum grau, übrige der Reihe nach */
    var order = [], ci = 1;
    for (var q = 0; q < CC.count; q++) {
      if (q === BIG) order[q] = 0; else if (SIZES[q] === 1) order[q] = 5; else { order[q] = ci; ci++; }
    }
    var C = 28, svg = s('svg', { viewBox: '0 0 ' + SIZE * C + ' ' + SIZE * C, class: P + 'cmap', role: 'img',
      'aria-label': 'Der Wald, jede Sprunggruppe in einer eigenen Farbe. Die größte Gruppe (blau) hat acht Bäume.' });
    svg.appendChild(s('rect', { x: 0, y: 0, width: SIZE * C, height: SIZE * C, class: P + 'cmapbg' }));
    for (var i = 1; i < SIZE; i++) {
      svg.appendChild(s('line', { x1: i * C, y1: 0, x2: i * C, y2: SIZE * C, class: P + 'cmapgrid' }));
      svg.appendChild(s('line', { x1: 0, y1: i * C, x2: SIZE * C, y2: i * C, class: P + 'cmapgrid' }));
    }
    TREES.forEach(function (t, k) {
      var x = t[1] * C + C / 2, y = t[0] * C + C / 2, col = COL[order[CC.comp[k]]];
      svg.appendChild(s('path', { d: 'M' + x + ' ' + (y - 11) + 'L' + (x + 11) + ' ' + (y + 8) + 'L' + (x - 11) + ' ' + (y + 8) + 'Z', style: 'fill:' + col + ';stroke:var(--ink);stroke-width:1;stroke-linejoin:round' }));
      svg.appendChild(s('rect', { x: x - 1.5, y: y + 8, width: 3, height: 4, style: 'fill:var(--ink)' }));
    });
    var tmp = h('div');
    tmp.appendChild(svg);
    return tmp.innerHTML;
  }

  Biber.register({
    id: 'koko21',
    story:
      '<p>Der Affe Koko kann von einem Baum aus so weit springen, wie es der <strong>grüne Bereich</strong> zeigt (erstes Bild unten). ' +
      'Im Beispiel (zweites Bild) erreicht Koko mit einem Sprung die farbigen Bäume, die grauen aber nicht.</p>' +
      '<p>Es gibt Gruppen von Bäumen, zwischen denen sich Koko mit mehreren Sprüngen beliebig bewegen kann, ohne jemals den Boden zu berühren. ' +
      'Im Beispiel bilden die farbigen Bäume und die beiden grauen Bäume oben eine solche „Sprunggruppe“; der graue Baum unten gehört nicht dazu.</p>' +
      '<p>Unten siehst du Kokos Wald.</p>',
    question: 'Markiere darin alle Bäume der größten Sprunggruppe!',
    howto: 'Tippe die Bäume an, die du markieren willst. Wenn du mit der Maus über einen Baum fährst oder ihn mit der Tastatur auswählst (Pfeiltasten), siehst du, wie weit Koko von dort springen kann.',
    explanation: function () {
      return '<p>Zwei Bäume gehören zur selben Sprunggruppe, wenn Koko von dem einen zum anderen kommt, ohne den Boden zu berühren. Dazu muss man <strong>ketten</strong>: ' +
        'Von einem Baum aus sucht man alle Bäume, die mit einem Sprung erreichbar sind, von dort wieder alle weiteren und so fort. Im Bild hat jede Gruppe ihre eigene Farbe.</p>' +
        '<div class="' + P + 'sol">' + coloredMap() + '</div>' +
        '<p>Die <strong>acht blauen Bäume</strong> bilden die größte Sprunggruppe (die anderen haben 7, 5, 5, 5 und 1 Baum).</p>' +
        '<p>In der Informatik ist der Wald ein <em>Graph</em>: Die Bäume sind die Knoten, und zwei Bäume sind verbunden, wenn Koko zwischen ihnen springen kann. ' +
        'Die Sprunggruppen sind die <em>Zusammenhangskomponenten</em> dieses Graphen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset(); focusIdx = 0;
      statusEl = h('p', { class: P + 'status', role: 'status', 'aria-live': 'polite' });
      btns = TREES.map(function (t, i) {
        var b = h('button', {
          type: 'button', class: P + 'tree', 'aria-label': 'Baum in Zeile ' + (t[0] + 1) + ', Spalte ' + (t[1] + 1), 'aria-pressed': 'false',
          onclick: function () { focusIdx = i; toggle(i); },
          onkeydown: onKey,
          onfocus: function () { focusIdx = i; showRange(i); },
          onblur: function () { showRange(null); },
          onpointerenter: function (e) { if (e.pointerType === 'mouse') showRange(i); },
          onpointerleave: function (e) { if (e.pointerType === 'mouse' && document.activeElement !== b) showRange(null); }
        });
        b.appendChild(treeSvg(P + 'treesvg'));
        return b;
      });
      grid = h('div', { class: P + 'grid', role: 'group', 'aria-label': 'Wald mit 31 Bäumen auf einem Gitter aus 11 mal 11 Feldern', style: '--n:' + SIZE });
      for (var r = 0; r < SIZE; r++) for (var c = 0; c < SIZE; c++) {
        var i = cellIdx(r, c);
        grid.appendChild(h('div', { class: P + 'cell' }, i >= 0 ? btns[i] : null));
      }
      var legend = h('div', { class: P + 'legend' },
        h('figure', null, exampleGrid(false), h('figcaption', null, 'So weit springt Koko (grün)')),
        h('figure', null, exampleGrid(true), h('figcaption', null, 'Beispiel: farbig = ein Sprung, grau = zu weit')));
      el.replaceChildren(h('div', { class: P + 'board' }, legend, h('div', { class: P + 'gridwrap' }, grid), statusEl));
      refresh();
    },
    isComplete: function () { return marked.some(Boolean); },
    evaluate: function () {
      var sel = TREES.map(function (t, i) { return marked[i] ? t : null; }).filter(Boolean);
      var ok = marked.every(function (m, i) { return m === (SOLUTION.indexOf(i) >= 0); });
      return { correct: ok, answer: { trees: sel } };
    },
    setAnswer: function (ans) {
      var sel = (ans && ans.trees) || [];
      marked = TREES.map(function (t) { return sel.some(function (u) { return u[0] === t[0] && u[1] === t[1]; }); });
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      refresh();
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () {
      marked = TREES.map(function (t, i) { return SOLUTION.indexOf(i) >= 0; });
      mark = 'solution'; locked = true; refresh();
    }
  });
})();
