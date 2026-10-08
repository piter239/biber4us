/* Aufgabe Berukone (Klasse 5-8): Zahlenpaare verbinden, welches Rätsel ist nicht lösbar (Backtracking) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-berukone24';
  var COLOR = { 1: 'var(--c1)', 2: 'var(--c4)', 3: 'var(--c6)' };

  /* ---------- Rätsel (4 x 4), '.' = leeres Feld ---------- */
  var PUZZLES = [
    { key: 'A', rows: ['...3', '3...', '.212', '1...'] },
    { key: 'B', rows: ['3..3', '..1.', '.2.2', '1...'] },
    { key: 'C', rows: ['3...', '..13', '.2..', '1..2'] },
    { key: 'D', rows: ['...3', '3.1.', '.2.2', '1...'] }
  ];
  var EX_OK = { rows: ['..1', '12.', '..2'], lines: { 1: [[1, 0], [0, 0], [0, 1], [0, 2]], 2: [[1, 1], [2, 1], [2, 2]] } };
  var EX_NO = { rows: ['21.', '..2', '.1.'], lines: { 1: [[0, 1], [1, 1], [2, 1]] } };

  PUZZLES.forEach(function (p) {
    p.n = p.rows.length;
    p.num = [];
    p.rows.forEach(function (row, r) {
      row.split('').forEach(function (ch, c) { p.num[r * p.n + c] = ch === '.' ? 0 : +ch; });
    });
    p.pairs = {};
    p.num.forEach(function (v, i) { if (v) (p.pairs[v] = p.pairs[v] || []).push(i); });
  });

  /* ---------- Löser (Backtracking): findet Verbindungen für eine Menge von Zahlen ---------- */
  function neighbors(i, n) {
    var r = Math.floor(i / n), c = i % n, out = [];
    if (r > 0) out.push(i - n);
    if (r < n - 1) out.push(i + n);
    if (c > 0) out.push(i - 1);
    if (c < n - 1) out.push(i + 1);
    return out;
  }
  function solve(p, values) {
    var used = {}, lines = {};
    function search(k) {
      if (k === values.length) return true;
      var v = values[k], a = p.pairs[v][0], b = p.pairs[v][1], path = [a];
      function walk(cur) {
        var nb = neighbors(cur, p.n);
        for (var j = 0; j < nb.length; j++) {
          var x = nb[j];
          if (x === b) {
            path.push(x);
            lines[v] = path.slice();
            if (search(k + 1)) return true;
            delete lines[v];
            path.pop();
          } else if (!p.num[x] && !used[x]) {
            used[x] = true; path.push(x);
            if (walk(x)) return true;
            path.pop(); delete used[x];
          }
        }
        return false;
      }
      return walk(a);
    }
    return search(0) ? lines : null;
  }
  function valuesOf(p) { return Object.keys(p.pairs).map(Number).sort(function (a, b) { return a - b; }); }
  /* beste (größte) lösbare Teilmenge der Paare, bei Gleichstand bevorzugt mit kleinen Zahlen */
  function best(p) {
    var vals = valuesOf(p), n = vals.length, res = null;
    for (var size = n; size >= 0 && !res; size--) {
      for (var mask = 0; mask < (1 << n) && !res; mask++) {
        var sub = vals.filter(function (v, i) { return (mask >> i) & 1; });
        if (sub.length !== size) continue;
        var l = solve(p, sub);
        if (l) res = { lines: l, solved: size === n };
      }
    }
    return res;
  }
  PUZZLES.forEach(function (p) {
    var b = best(p);
    p.solvable = b.solved;
    p.sol = b.lines;
  });
  var RIGHT = (function () {
    var idx = -1, cnt = 0;
    PUZZLES.forEach(function (p, i) { if (!p.solvable) { idx = i; cnt++; } });
    return cnt === 1 ? idx : -1;
  })();

  /* ---------- Statische Raster (Beispiele und Lösungen) ---------- */
  function staticGrid(p, lines, opts) {
    opts = opts || {};
    var n = p.rows.length, S = 40, s = '';
    p.rows.forEach(function (row, r) {
      row.split('').forEach(function (ch, c) { s += '<rect x="' + (c * S) + '" y="' + (r * S) + '" width="' + S + '" height="' + S + '" class="' + P + '-sc"/>'; });
    });
    Object.keys(lines || {}).forEach(function (v) {
      var pts = lines[v].map(function (cell) {
        var r, c;
        if (typeof cell === 'number') { r = Math.floor(cell / n); c = cell % n; } else { r = cell[0]; c = cell[1]; }
        return ((c + 0.5) * S) + ',' + ((r + 0.5) * S);
      }).join(' ');
      s += '<polyline points="' + pts + '" class="' + P + '-sl" style="stroke:' + COLOR[v] + '"/>';
    });
    p.rows.forEach(function (row, r) {
      row.split('').forEach(function (ch, c) {
        if (ch === '.') return;
        var bad = opts.bad && opts.bad.indexOf(+ch) >= 0;
        s += '<circle cx="' + ((c + 0.5) * S) + '" cy="' + ((r + 0.5) * S) + '" r="14" class="' + P + '-sb' + (bad ? ' bad' : '') + '" style="stroke:' + (bad ? 'var(--bad)' : COLOR[ch]) + '"/>' +
          '<text x="' + ((c + 0.5) * S) + '" y="' + ((r + 0.5) * S + 6.5) + '" text-anchor="middle" class="' + P + '-st">' + ch + '</text>';
      });
    });
    return '<svg class="' + P + '-static' + (opts.cls ? ' ' + opts.cls : '') + '" viewBox="-1 -1 ' + (n * S + 2) + ' ' + (n * S + 2) + '" role="img" aria-label="' + opts.label + '" focusable="false">' + s + '</svg>';
  }
  function gridLabel(p) {
    return p.rows.map(function (row, r) {
      var parts = [];
      row.split('').forEach(function (ch, c) { if (ch !== '.') parts.push('Zahl ' + ch + ' in Spalte ' + (c + 1)); });
      return 'Zeile ' + (r + 1) + (parts.length ? ': ' + parts.join(', ') : ': leer');
    }).join('; ');
  }

  function storyHtml() {
    return '<p>Lasst uns Berukone spielen! Ein Berukone-Rätsel besteht aus einem Raster mit Zahlen auf den Feldern. Zwei gleiche Zahlen bilden ein Paar.</p>' +
      '<p>Um das Rätsel zu lösen, musst du für alle Paare die beiden Zahlen durch eine Linie verbinden. Diese Verbindungslinie muss waagrecht oder senkrecht von Feld zu Feld gehen, darf sich aber auf einem Feld um 90 Grad drehen. Eine Linie darf nicht durch eine andere Zahl und nicht durch eine andere Linie gehen.</p>' +
      '<p>Leider gibt es Berukone-Rätsel, die nicht gelöst werden können:</p>' +
      '<div class="' + P + '-examples">' +
      '<figure>' + staticGrid(EX_OK, EX_OK.lines, { cls: P + '-exg', label: 'Lösbares Beispiel mit 3 mal 3 Feldern. ' + gridLabel(EX_OK) + '. Die Einsen sind über die obere Zeile verbunden, die Zweien über die untere.' }) +
      '<figcaption>Dieses Berukone kann gelöst werden.</figcaption></figure>' +
      '<figure>' + staticGrid(EX_NO, EX_NO.lines, { cls: P + '-exg', label: 'Nicht lösbares Beispiel mit 3 mal 3 Feldern. ' + gridLabel(EX_NO) + '. Die senkrechte Linie zwischen den Einsen versperrt den Weg zwischen den Zweien.' }) +
      '<figcaption>Dieses Berukone kann nicht gelöst werden.</figcaption></figure></div>';
  }

  /* ---------- Zustand ---------- */
  var el, api, locked, selected, mark;
  var cards, radios, live;
  var G = []; // je Rätsel: { p, lines: {v: [cells]}, active: {v, cells}|null, cellEls, svg, focus }

  function reset() { selected = null; mark = null; }
  function cellOwner(g, i) {
    var v, k;
    for (k in g.lines) if (g.lines[k].indexOf(i) >= 0) return +k;
    if (g.active && g.active.cells.indexOf(i) >= 0) return g.active.v;
    return 0;
  }
  function say(t) { live.textContent = t; }
  function allConnected(g) { return valuesOf(g.p).every(function (v) { return g.lines[v]; }); }

  function renderGrid(g) {
    var p = g.p, n = p.n;
    g.cellEls.forEach(function (b, i) {
      var num = p.num[i], own = cellOwner(g, i);
      b.className = P + '-cell' + (num ? ' num' : '') + (own && !num ? ' on' : '');
      if (num) b.style.setProperty('--cc', COLOR[num]); else if (own) b.style.setProperty('--cc', COLOR[own]); else b.style.removeProperty('--cc');
      var r = Math.floor(i / n) + 1, c = (i % n) + 1;
      var t = 'Zeile ' + r + ', Spalte ' + c + ': ';
      t += num ? 'Zahl ' + num + (g.lines[num] ? ', verbunden' : (g.active && g.active.v === num && g.active.cells[0] === i ? ', Linie beginnt hier' : '')) : (own ? 'Linie der Zahl ' + own : 'leer');
      b.setAttribute('aria-label', t);
    });
    var s = '';
    function poly(cells, cls, v) {
      var pts = cells.map(function (i) { return (i % n + 0.5) + ',' + (Math.floor(i / n) + 0.5); }).join(' ');
      return '<polyline points="' + pts + '" class="' + cls + '" style="stroke:' + COLOR[v] + '"/>';
    }
    Object.keys(g.lines).forEach(function (v) { s += poly(g.lines[v], P + '-line', v); });
    if (g.active) s += poly(g.active.cells.length > 1 ? g.active.cells : [g.active.cells[0], g.active.cells[0]], P + '-line act', g.active.v);
    g.svg.innerHTML = s;
  }

  function handle(g, i, src) {
    var p = g.p, n = p.n, A = g.active, v;
    if (!A) {
      if (src === 'move') return;
      if (p.num[i]) {
        delete g.lines[p.num[i]];
        g.active = { v: p.num[i], cells: [i] };
        say('Linie für die Zahl ' + p.num[i] + ' begonnen. Gehe jetzt Feld für Feld zur zweiten ' + p.num[i] + '.');
      } else {
        for (v in g.lines) if (g.lines[v].indexOf(i) >= 0) { delete g.lines[v]; say('Linie der Zahl ' + v + ' entfernt.'); break; }
      }
      return;
    }
    var cells = A.cells, last = cells[cells.length - 1];
    if (i === last) {
      if (src === 'key' && cells.length === 1) { g.active = null; say('Linie abgebrochen.'); }
      return;
    }
    if (cells.length >= 2 && i === cells[cells.length - 2]) { cells.pop(); return; }
    if (neighbors(last, n).indexOf(i) >= 0) {
      if (p.num[i]) {
        if (p.num[i] === A.v && i !== cells[0]) {
          cells.push(i);
          g.lines[A.v] = cells; g.active = null;
          say('Die beiden Zahlen ' + A.v + ' sind verbunden.' + (allConnected(g) ? ' Alle Paare sind verbunden: Dieses Rätsel ist lösbar.' : ''));
        }
        return;
      }
      if (!cellOwner(g, i)) cells.push(i);
      return;
    }
    if (src === 'down' && p.num[i]) { g.active = null; handle(g, i, src); }
  }

  function cellAt(g, e) {
    var rc = g.box.getBoundingClientRect(), n = g.p.n;
    var x = (e.clientX - rc.left) / rc.width * n, y = (e.clientY - rc.top) / rc.height * n;
    if (x < 0 || y < 0 || x >= n || y >= n) return -1;
    return Math.floor(y) * n + Math.floor(x);
  }
  function setFocus(g, i) {
    g.cellEls.forEach(function (b, k) { b.tabIndex = k === i ? 0 : -1; });
    g.cellEls[i].focus();
  }

  function buildGrid(p, gi) {
    var g = { p: p, lines: {}, active: null, cellEls: [], drag: null };
    G.push(g);
    var n = p.n;
    g.svg = Biber.svg('svg', { class: P + '-lines', viewBox: '0 0 ' + n + ' ' + n, 'aria-hidden': 'true', focusable: 'false' });
    for (var i = 0; i < n * n; i++) {
      (function (i) {
        var b = h('button', {
          type: 'button', class: P + '-cell', tabindex: i === 0 ? '0' : '-1', 'data-i': String(i),
          onkeydown: function (e) {
            var r = Math.floor(i / n), c = i % n, to = -1;
            if (e.key === 'ArrowRight' && c < n - 1) to = i + 1;
            else if (e.key === 'ArrowLeft' && c > 0) to = i - 1;
            else if (e.key === 'ArrowDown' && r < n - 1) to = i + n;
            else if (e.key === 'ArrowUp' && r > 0) to = i - n;
            if (to >= 0) { e.preventDefault(); setFocus(g, to); return; }
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (locked) return;
              handle(g, i, 'key'); renderGrid(g);
            } else if (e.key === 'Escape' && g.active && !locked) { g.active = null; renderGrid(g); say('Linie abgebrochen.'); }
          }
        });
        if (p.num[i]) b.textContent = String(p.num[i]);
        g.cellEls.push(b);
      })(i);
    }
    g.box = h('div', {
      class: P + '-grid', role: 'group', 'aria-label': 'Berukone ' + p.key + ' zum Ausprobieren (Pfeiltasten bewegen, Eingabetaste legt die Linie Feld für Feld)',
      onpointerdown: function (e) {
        if (locked || (e.pointerType === 'mouse' && e.button !== 0)) return;
        var i = cellAt(g, e);
        if (i < 0) return;
        e.preventDefault();
        try { g.box.setPointerCapture(e.pointerId); } catch (err) { /* egal */ }
        var A = g.active;
        g.drag = { id: e.pointerId, last: i, moved: false, startedOnLastOfSingle: !!(A && A.cells.length === 1 && A.cells[0] === i) };
        handle(g, i, 'down'); renderGrid(g);
        g.cellEls[i].focus({ preventScroll: true });
        g.cellEls.forEach(function (b, k) { b.tabIndex = k === i ? 0 : -1; });
      },
      onpointermove: function (e) {
        if (!g.drag || g.drag.id !== e.pointerId) return;
        var i = cellAt(g, e);
        if (i < 0 || i === g.drag.last) return;
        g.drag.last = i; g.drag.moved = true;
        handle(g, i, 'move'); renderGrid(g);
      },
      onpointerup: function (e) {
        if (!g.drag || g.drag.id !== e.pointerId) return;
        if (g.drag.startedOnLastOfSingle && !g.drag.moved && g.active && g.active.cells.length === 1) { g.active = null; renderGrid(g); say('Linie abgebrochen.'); }
        g.drag = null;
      },
      onpointercancel: function () { g.drag = null; }
    }, g.svg, g.cellEls);
    renderGrid(g);
    return g;
  }

  function choose(i, focus) {
    if (locked) return;
    selected = i;
    refresh();
    if (focus) radios[i].focus();
    api.changed();
  }
  function refresh() {
    radios.forEach(function (btn, i) {
      var on = selected === i;
      btn.setAttribute('aria-checked', String(on));
      btn.tabIndex = (selected === null ? i === 0 : on) ? 0 : -1;
      btn.setAttribute('aria-disabled', locked ? 'true' : 'false');
      var ok = i === RIGHT;
      cards[i].classList.toggle('selected', on);
      cards[i].classList.toggle('right', on && mark !== null && ok);
      cards[i].classList.toggle('wrong', on && mark === 'check' && !ok);
      var m = cards[i].querySelector('.' + P + '-mark');
      if (m) m.remove();
      if (on && mark !== null) cards[i].appendChild(h('span', { class: P + '-mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
    });
    G.forEach(function (g) { g.box.classList.toggle('locked', !!locked); });
  }
  function onKey(e) {
    var k = e.key, i = radios.indexOf(e.currentTarget), to = null;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % radios.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + radios.length - 1) % radios.length;
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }

  Biber.register({
    id: 'berukone24',
    story: storyHtml(),
    question: 'Genau eines dieser Berukones kann nicht gelöst werden. Welches?',
    howto: 'Du kannst die Rätsel ausprobieren: Ziehe mit dem Finger oder der Maus von einer Zahl zur gleichen Zahl, oder tippe die Felder nacheinander an. Eine fertige Linie entfernst du durch Antippen. Wähle dann unter dem Rätsel, das nicht lösbar ist, „Nicht lösbar“.',
    explanation: function () {
      var order = [0, 2, 1, 3];
      var figs = order.map(function (i) {
        var p = PUZZLES[i];
        var lab = 'Rätsel ' + p.key + ' (' + (p.solvable ? 'gelöst' : 'nicht lösbar') + '). ' + gridLabel(p);
        return '<figure class="' + P + '-fig' + (p.solvable ? '' : ' no') + '"><figcaption>' + p.key + ')</figcaption>' +
          staticGrid(p, p.sol, { cls: P + '-exg', label: lab, bad: p.solvable ? null : valuesOf(p).filter(function (v) { return !p.sol[v]; }) }) + '</figure>';
      }).join('');
      var d = PUZZLES[RIGHT];
      return '<p>Rätsel <strong>' + d.key + '</strong> ist das einzige, das nicht gelöst werden kann. Die Rätsel A, B und C lassen sich lösen, wie hier gezeigt:</p>' +
        '<div class="' + P + '-figs">' + figs + '</div>' +
        '<p>Bei D kann nur für eines der beiden Paare aus Einsen und Zweien eine Linie gelegt werden. Die einzige mögliche Linie zwischen den Einsen, die nicht durch eine andere Zahl führt, ist oben gezeigt. ' +
        'Jede mögliche Linie zwischen den Zweien müsste sie kreuzen oder durch eine andere Zahl laufen. Es gibt also keine Möglichkeit, auch die Zweien noch zu verbinden.</p>' +
        '<p>Bei großen Rätseln gibt es sehr viele mögliche Linien, alle auszuprobieren dauert zu lange. Schlauer ist es, Schritt für Schritt vorzugehen: Sobald man erkennt, dass der aktuelle Weg nicht mehr zu einer Lösung führen kann, macht man den letzten Schritt (oder mehrere) rückgängig und probiert einen anderen Weg. ' +
        'Diese Methode heißt <em>Backtracking</em> („auf der Spur zurückgehen“) und wird oft verwendet, damit Computer Rätsel und andere Probleme automatisch lösen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset(); G = [];
      live = h('p', { class: P + '-live', 'aria-live': 'polite' });
      cards = PUZZLES.map(function (p) { return null; });
      radios = [];
      PUZZLES.forEach(function (p, i) {
        var g = buildGrid(p, i);
        var rb = h('button', {
          type: 'button', role: 'radio', class: P + '-pick', 'aria-label': 'Berukone ' + p.key + ' ist nicht lösbar',
          onclick: function () { choose(i, false); }, onkeydown: onKey
        }, 'Nicht lösbar');
        radios.push(rb);
        cards[i] = h('div', { class: P + '-card' },
          h('div', { class: P + '-key', 'aria-hidden': 'true' }, p.key + ')'), g.box, rb);
      });
      el.replaceChildren(h('div', { class: P + '-board', role: 'radiogroup', 'aria-label': 'Berukone-Rätsel A bis D: welches ist nicht lösbar?' }, cards), live);
      refresh();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () { return { correct: selected === RIGHT, answer: { choice: PUZZLES[selected].key } }; },
    setAnswer: function (ans) {
      var i = PUZZLES.map(function (p) { return p.key; }).indexOf(ans && ans.choice);
      selected = i >= 0 ? i : null;
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      G.forEach(function (g) { g.active = null; renderGrid(g); });
      refresh();
    },
    reset: function () {
      reset();
      G.forEach(function (g) { g.lines = {}; g.active = null; renderGrid(g); });
      say('');
      refresh();
    },
    showSolution: function () {
      selected = RIGHT; mark = 'solution'; locked = true;
      G.forEach(function (g) {
        g.lines = {};
        Object.keys(g.p.sol).forEach(function (v) { g.lines[v] = g.p.sol[v].slice(); });
        g.active = null;
        renderGrid(g);
      });
      refresh();
    }
  });
})();
