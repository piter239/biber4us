/* Aufgabe Sechsecke ausmalen (Biber 2022; Klasse 5-6 einfach): Sechseck-Pyramide nach einer Drei-Felder-Regel ausmalen */
(function () {
  'use strict';
  var h = Biber.h, S = Biber.svg;
  var P = 't-sechsecke22-';

  /* Farben: 1 = grün (Quadrat), 2 = gelb (Punkt), 3 = blau (Stern); 0 = weiß/leer */
  var COL = {
    1: { name: 'Grün', sym: 'Quadrat', cls: 'g' },
    2: { name: 'Gelb', sym: 'Punkt', cls: 'y' },
    3: { name: 'Blau', sym: 'Stern', cls: 'b' }
  };
  /* Pyramide laut Heft (S. 51): Reihe 0 = unterste (6 Felder), Reihe 5 = Spitze (1 Feld). 0 = noch weiß. */
  var START = [
    [1, 1, 2, 3, 1, 3],
    [1, 0, 1, 2, 2],
    [0, 0, 3, 2],
    [0, 0, 0],
    [0, 0],
    [0]
  ];
  var ROWS = START.length;
  /* Regel: zwei Felder unten, eines darüber: alle gleich oder alle verschieden */
  function above(a, b) { return a === b ? a : 6 - a - b; }
  function solve() {
    var g = START.map(function (r) { return r.slice(); }), r, i;
    for (r = 1; r < ROWS; r++) for (i = 0; i < g[r].length; i++) g[r][i] = above(g[r - 1][i], g[r - 1][i + 1]);
    return g;
  }
  var SOLUTION = solve();
  /* Abgleich mit der Abbildung im Heft (Lösung S. 51, von der Spitze nach unten): Gelb / Blau Grün / Gelb Grün Grün / Gelb Gelb Blau Gelb / Grün Blau Grün Gelb Gelb / Grün Grün Gelb Blau Grün Blau */
  var HEFT = [[1, 1, 2, 3, 1, 3], [1, 3, 1, 2, 2], [2, 2, 3, 2], [2, 1, 1], [3, 1], [2]];
  (function () { if (JSON.stringify(SOLUTION) !== JSON.stringify(HEFT)) throw new Error('sechsecke22: Lösung weicht vom Heft ab'); })();

  /* ---------- Geometrie (spitze Sechsecke, Spitze oben) ---------- */
  var R = 30, W = Math.sqrt(3) * R, PAD = 8;
  var VBW = Math.ceil(ROWS * W + 2 * PAD), VBH = Math.ceil(R * 2 + (ROWS - 1) * 1.5 * R + 2 * PAD);
  function center(r, i) { return { x: PAD + W / 2 + (i + r / 2) * W, y: VBH - PAD - R - r * 1.5 * R }; }
  function hexPts(c, k) {
    var pts = [], a, j;
    for (j = 0; j < 6; j++) { a = Math.PI / 180 * (60 * j - 90); pts.push((c.x + k * Math.cos(a)).toFixed(1) + ',' + (c.y + k * Math.sin(a)).toFixed(1)); }
    return pts.join(' ');
  }
  function symbol(c, v) {
    if (v === 1) return S('rect', { class: P + 'sym', x: c.x - 6.5, y: c.y - 6.5, width: 13, height: 13 });
    if (v === 2) return S('circle', { class: P + 'sym', cx: c.x, cy: c.y, r: 7.5 });
    var pts = [], i, a, rr;
    for (i = 0; i < 10; i++) { a = -Math.PI / 2 + i * Math.PI / 5; rr = i % 2 ? 5 : 11; pts.push((c.x + rr * Math.cos(a)).toFixed(1) + ',' + (c.y + 0.6 + rr * Math.sin(a)).toFixed(1)); }
    return S('polygon', { class: P + 'sym', points: pts.join(' ') });
  }

  var el, api, svg, cells, toolBtns, tool, grid, locked, mark, live;

  function cellLabel(r, i, v, fixed) {
    return 'Reihe ' + (r + 1) + ' von unten, Feld ' + (i + 1) + ': ' + (v ? COL[v].name + ' (' + COL[v].sym + ')' : 'noch weiß') + (fixed ? ', vorgegeben' : '');
  }
  function draw() {
    cells.forEach(function (row, r) {
      row.forEach(function (c, i) {
        var v = grid[r][i];
        c.g.setAttribute('class', P + 'cell ' + (v ? P + COL[v].cls : P + 'w') + (c.fixed ? ' ' + P + 'fixed' : '') + (mark === 'solution' && !c.fixed ? ' ' + P + 'sol' : ''));
        c.g.setAttribute('aria-label', cellLabel(r, i, v, c.fixed));
        if (!c.fixed) c.g.setAttribute('aria-disabled', locked ? 'true' : 'false');
        c.sym.replaceChildren();
        if (v) c.sym.appendChild(symbol(center(r, i), v));
      });
    });
    toolBtns.forEach(function (b) {
      var on = +b.getAttribute('data-tool') === tool;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
      b.setAttribute('aria-disabled', locked ? 'true' : 'false');
      b.classList.toggle('on', on);
    });
    var left = 0;
    grid.forEach(function (row, r) { row.forEach(function (v, i) { if (!v) left++; }); });
    live.textContent = left ? 'Noch ' + left + (left === 1 ? ' Sechseck' : ' Sechsecke') + ' weiß.' : 'Alle Sechsecke sind ausgemalt.';
  }
  function paint(r, i, v) {
    if (locked || cells[r][i].fixed) return;
    grid[r][i] = v;
    draw();
    api.changed();
  }
  function reset() {
    grid = START.map(function (r) { return r.slice(); });
    tool = 1;
  }
  function validTriples(g) {
    for (var r = 1; r < ROWS; r++) for (var i = 0; i < g[r].length; i++) {
      var a = g[r - 1][i], b = g[r - 1][i + 1], c = g[r][i];
      if (!(a === b ? c === a : (c !== a && c !== b))) return false;
    }
    return true;
  }
  function flat(g) { return g.map(function (r) { return r.join(''); }); }

  function moveFocus(r, i, d) {
    var list = [], k;
    cells.forEach(function (row, rr) { row.forEach(function (c, ii) { if (!c.fixed) list.push([rr, ii]); }); });
    for (k = 0; k < list.length; k++) if (list[k][0] === r && list[k][1] === i) break;
    var to = list[(k + d + list.length) % list.length];
    cells[to[0]][to[1]].g.focus();
  }

  function buildTools() {
    var items = [{ v: 1 }, { v: 2 }, { v: 3 }, { v: 0 }];
    toolBtns = items.map(function (it) {
      var btn = h('button', {
        type: 'button', role: 'radio', class: P + 'tool' + (it.v ? '' : ' ' + P + 'erase'), 'data-tool': it.v,
        'aria-label': it.v ? COL[it.v].name + ' (' + COL[it.v].sym + ')' : 'Radierer: Sechseck wieder weiß machen',
        onclick: function () { if (locked) return; tool = it.v; draw(); },
        onkeydown: function (e) {
          var k = e.key, i = toolBtns.indexOf(btn), to = null;
          if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % toolBtns.length;
          else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + toolBtns.length - 1) % toolBtns.length;
          if (to === null || locked) return;
          e.preventDefault(); tool = items[to].v; draw(); toolBtns[to].focus();
        }
      });
      if (it.v) {
        var sv = S('svg', { viewBox: '0 0 40 40', class: P + 'tsvg', 'aria-hidden': 'true' },
          S('polygon', { class: P + 'cell ' + P + COL[it.v].cls, points: hexPts({ x: 20, y: 20 }, 18) }),
          symbol({ x: 20, y: 20 }, it.v));
        btn.appendChild(sv);
      } else btn.innerHTML = '<span aria-hidden="true">✕ weiß</span>';
      return btn;
    });
    return toolBtns;
  }

  Biber.register({
    id: 'sechsecke22',
    story:
      '<p>Sami legt weiße Sechsecke aneinander. Dann malt er sie mit drei verschiedenen Farben aus. Immer wenn drei Sechsecke genau so zusammenliegen – zwei unten und eines oben in der Mitte –, müssen sie am Ende</p>' +
      '<ul><li>alle drei die gleiche Farbe <strong>oder</strong></li><li>alle drei verschiedene Farben haben.</li></ul>' +
      '<p>Das gefällt Sami! Sami hat viele Sechsecke aneinandergelegt und schon einige ausgemalt.</p>',
    question: 'Male alle übrigen Sechsecke aus, so wie es Sami gefällt.',
    howto: 'Wähle unten eine Farbe und tippe dann auf die weißen Sechsecke. Mit „weiß“ machst du ein Sechseck wieder leer. Jede Farbe hat ihr eigenes Zeichen. Per Tastatur: Tab zum Sechseck, Taste 1, 2 oder 3 für eine Farbe, Entf zum Löschen.',
    explanation: function () {
      return '<p>Sobald zwei nebeneinanderliegende Sechsecke ausgemalt sind, steht die Farbe des Sechsecks darüber fest: Haben beide die gleiche Farbe, bekommt es ebenfalls diese Farbe. Haben sie verschiedene Farben, bekommt es die dritte Farbe. ' +
        'So muss zum Beispiel das unterste Feld, das anfangs weiß ist, blau werden. Man malt die Pyramide Reihe für Reihe von unten nach oben aus.</p>' +
        '<p>Dabei hast du einen Algorithmus benutzt: Für jedes weiße Sechseck prüfst du eine <em>Bedingung</em> (gleiche oder verschiedene Farben darunter), führst die passende <em>Aktion</em> aus (ausmalen) und <em>wiederholst</em> das für alle Felder.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; mark = null; reset();
      svg = S('svg', { class: P + 'svg', viewBox: '0 0 ' + VBW + ' ' + VBH, role: 'group', 'aria-label': 'Sechseck-Pyramide mit 6 Reihen, unten 6 Felder, oben 1 Feld' });
      cells = [];
      for (var r = 0; r < ROWS; r++) {
        cells.push([]);
        for (var i = 0; i < START[r].length; i++) (function (r, i) {
          var c = center(r, i), fixed = START[r][i] !== 0;
          var g = S('g', { class: P + 'cell', 'data-r': r, 'data-i': i }, S('polygon', { class: P + 'hex', points: hexPts(c, R - 1.2) }));
          var sym = S('g', { 'pointer-events': 'none' });
          g.appendChild(sym);
          if (fixed) { g.setAttribute('role', 'img'); }
          else {
            g.setAttribute('role', 'button'); g.setAttribute('tabindex', '0');
            g.addEventListener('click', function () { paint(r, i, grid[r][i] === tool ? 0 : tool); });
            g.addEventListener('keydown', function (e) {
              var k = e.key;
              if (k === 'Enter' || k === ' ') { e.preventDefault(); paint(r, i, grid[r][i] === tool ? 0 : tool); }
              else if (k === '1' || k === '2' || k === '3') { e.preventDefault(); paint(r, i, +k); }
              else if (k === '0' || k === 'Delete' || k === 'Backspace') { e.preventDefault(); paint(r, i, 0); }
              else if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); moveFocus(r, i, 1); }
              else if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); moveFocus(r, i, -1); }
            });
          }
          cells[r].push({ g: g, sym: sym, fixed: fixed });
          svg.appendChild(g);
        })(r, i);
      }
      live = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      var rule = h('div', { class: P + 'rule' });
      rule.innerHTML = '<svg viewBox="0 0 ' + Math.ceil(2 * W + 8) + ' ' + Math.ceil(3.5 * R + 8) + '" class="' + P + 'rsvg" role="img" aria-label="Drei Sechsecke: zwei unten nebeneinander, eines darüber in der Mitte"></svg>';
      var rs = rule.firstChild;
      [{ x: 4 + W / 2, y: 4 + R * 2.5 }, { x: 4 + W * 1.5, y: 4 + R * 2.5 }, { x: 4 + W, y: 4 + R }].forEach(function (c) { rs.appendChild(S('polygon', { class: P + 'cell ' + P + 'w', points: hexPts(c, R - 1.2) })); });
      var tools = h('div', { class: P + 'tools', role: 'radiogroup', 'aria-label': 'Farbe wählen' }, buildTools());
      el.replaceChildren(h('div', { class: P + 'board' },
        h('div', { class: P + 'ruleline' }, rule, h('p', null, 'Regel: Je zwei Sechsecke unten legen das Sechseck darüber fest – gleich + gleich = diese Farbe, verschieden = die dritte Farbe.')),
        h('div', { class: P + 'tw' }, tools),
        h('div', { class: P + 'pyr' }, svg),
        live));
      draw();
    },
    isComplete: function () { return grid.every(function (r) { return r.every(function (v) { return v !== 0; }); }); },
    evaluate: function () {
      var ok = grid.every(function (r) { return r.every(function (v) { return v !== 0; }); }) && validTriples(grid) &&
        START.every(function (r, ri) { return r.every(function (v, i) { return !v || grid[ri][i] === v; }); });
      return { correct: ok, answer: { grid: flat(grid) } };
    },
    setAnswer: function (ans) {
      var g = ans && ans.grid;
      if (Array.isArray(g) && g.length === ROWS) {
        var ok = g.every(function (s, r) { return typeof s === 'string' && s.length === START[r].length; });
        if (ok) grid = g.map(function (s) { return s.split('').map(Number); });
      }
      mark = 'check';
      draw();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      draw();
    },
    reset: function () { reset(); mark = null; draw(); },
    showSolution: function () { grid = SOLUTION.map(function (r) { return r.slice(); }); mark = 'solution'; locked = true; draw(); }
  });
})();
