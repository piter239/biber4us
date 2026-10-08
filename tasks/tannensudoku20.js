/* Aufgabe Tannen-Sudoku (Biber 2020; Klasse 5-6 schwer, 7-8 mittel, 9-10 leicht): 9 Tannen so setzen, dass Sichtbarkeits-Schilder und Sudoku-Regel stimmen */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-tannensudoku20-';

  var NAMES = { 1: 'kleine Tanne', 2: 'mittlere Tanne', 3: 'große Tanne' };
  /* Schilder: Reihe/Spalte (0-basiert), Blickrichtung und Zahl der sichtbaren Tannen (Heft S. 56) */
  var SIGNS = [
    { id: 'top', side: 'top', idx: 0, n: 3, text: 'Schild oben über der linken Spalte' },
    { id: 'left', side: 'left', idx: 0, n: 3, text: 'Schild links neben der oberen Reihe' },
    { id: 'right', side: 'right', idx: 1, n: 2, text: 'Schild rechts neben der mittleren Reihe' },
    { id: 'bottom', side: 'bottom', idx: 0, n: 1, text: 'Schild unten unter der linken Spalte' }
  ];
  /* offizielle Lösung (Heft S. 57); per Skript (alle 6^3 Belegungen) als einzige Lösung bestätigt */
  var SOLUTION = [1, 2, 3, 2, 3, 1, 3, 1, 2];

  /* ---------- Spiellogik ---------- */
  function visible(line) {   /* line: Höhen vom Schild aus gesehen */
    var m = 0, n = 0;
    line.forEach(function (x) { if (x > m) { m = x; n++; } });
    return n;
  }
  function lineOf(g, s) {
    var i, out = [];
    if (s.side === 'left' || s.side === 'right') {
      for (i = 0; i < 3; i++) out.push(g[s.idx * 3 + i]);
    } else {
      for (i = 0; i < 3; i++) out.push(g[i * 3 + s.idx]);
    }
    return (s.side === 'right' || s.side === 'bottom') ? out.reverse() : out;
  }
  function signOk(g, s) { var l = lineOf(g, s); return l.indexOf(0) < 0 && visible(l) === s.n; }
  function lineFull(vals) { return vals.every(Boolean) && vals.slice().sort().join('') === '123'; }
  function dupCells(g) {   /* Felder in Reihen/Spalten mit doppelten Höhen */
    var bad = {}, i, j;
    function scan(idxs) {
      idxs.forEach(function (a, x) {
        idxs.forEach(function (b, y) { if (x < y && g[a] && g[a] === g[b]) { bad[a] = bad[b] = true; } });
      });
    }
    for (i = 0; i < 3; i++) { scan([i * 3, i * 3 + 1, i * 3 + 2]); scan([i, i + 3, i + 6]); }
    return bad;
  }
  function allOk(g) {
    var i, ok = SIGNS.every(function (s) { return signOk(g, s); });
    for (i = 0; i < 3; i++) {
      if (!lineFull([g[i * 3], g[i * 3 + 1], g[i * 3 + 2]])) ok = false;
      if (!lineFull([g[i], g[i + 3], g[i + 6]])) ok = false;
    }
    return ok;
  }

  /* ---------- Tannen zeichnen (viewBox 0 0 60 80) ---------- */
  var TREE = {
    1: { h: 34, w: 14, fill: '#9cc021' },
    2: { h: 52, w: 18, fill: '#5d8a1c' },
    3: { h: 72, w: 24, fill: '#23330f' }
  };
  function treeSvg(size, cls) {
    var t = TREE[size], top = 76 - t.h, cx = 30;
    var d = 'M' + cx + ' ' + top +
      ' L' + (cx + t.w * 0.55) + ' ' + (top + t.h * 0.38) + ' L' + (cx + t.w * 0.3) + ' ' + (top + t.h * 0.38) +
      ' L' + (cx + t.w * 0.9) + ' ' + (top + t.h * 0.7) + ' L' + (cx + t.w * 0.45) + ' ' + (top + t.h * 0.7) +
      ' L' + (cx + t.w * 1.15) + ' ' + (76) + ' L' + (cx - t.w * 1.15) + ' ' + (76) +
      ' L' + (cx - t.w * 0.45) + ' ' + (top + t.h * 0.7) + ' L' + (cx - t.w * 0.9) + ' ' + (top + t.h * 0.7) +
      ' L' + (cx - t.w * 0.3) + ' ' + (top + t.h * 0.38) + ' L' + (cx - t.w * 0.55) + ' ' + (top + t.h * 0.38) + ' Z';
    return '<svg class="' + (cls || P + 'tree') + '" viewBox="0 0 60 80" aria-hidden="true" focusable="false">' +
      '<rect x="27" y="74" width="6" height="5" fill="#6b3d1b"/>' +
      '<path d="' + d + '" fill="' + t.fill + '" stroke="#fff" stroke-width="2.4" stroke-linejoin="round" paint-order="stroke"/></svg>';
  }

  var el, api, g, selected, dragging, locked, mode, cells, pals, countsEl, noteEl, signEls, focusIdx;

  function reset() { g = [0, 0, 0, 0, 0, 0, 0, 0, 0]; selected = null; dragging = null; mode = null; }
  function remaining(s) { return 3 - g.filter(function (x) { return x === s; }).length; }
  function filledCount() { return g.filter(Boolean).length; }

  function setCell(i, size) {   /* size 0 = leeren */
    if (locked) return false;
    if (size && g[i] !== size && remaining(size) <= 0) return false;
    g[i] = size;
    return true;
  }
  function move(from, to) {   /* Feld -> Feld: tauschen */
    if (locked || from === to) return;
    var t = g[from]; g[from] = g[to]; g[to] = t;
  }
  function after() {
    if (selected && remaining(selected) <= 0) selected = null;
    render();
    var n = filledCount();
    api.changed(n + ' von 9 Tannen gesetzt.');
  }

  /* ---------- Anzeige ---------- */
  function cellLabel(i) {
    var t = 'Reihe ' + (Math.floor(i / 3) + 1) + ', Spalte ' + (i % 3 + 1) + ': ';
    if (!g[i]) return t + 'leer' + (locked ? '' : (selected ? ', antippen, um die ' + NAMES[selected] + ' zu setzen' : ''));
    return t + NAMES[g[i]] + (locked ? '' : ', antippen zum Wegnehmen');
  }
  function render() {
    var bad = mode === 'check' ? dupCells(g) : {};
    cells.forEach(function (btn, i) {
      var cls = P + 'cell';
      if (g[i]) cls += ' ' + P + 'filled';
      if (bad[i]) cls += ' ' + P + 'dup';
      btn.className = cls;
      var inner = g[i] ? treeSvg(g[i]) : '';
      if (btn.__inner !== inner) { btn.innerHTML = inner; btn.__inner = inner; }
      btn.setAttribute('aria-label', cellLabel(i));
      btn.draggable = !!g[i] && !locked;
      btn.dataset.size = g[i] ? String(g[i]) : '';
      btn.setAttribute('aria-disabled', locked ? 'true' : 'false');
      btn.tabIndex = i === focusIdx ? 0 : -1;
    });
    pals.forEach(function (btn) {
      var s = +btn.dataset.pal, rest = remaining(s);
      btn.classList.toggle('selected', selected === s);
      btn.setAttribute('aria-pressed', String(selected === s));
      btn.disabled = locked || rest <= 0;
      btn.draggable = !locked && rest > 0;
      btn.querySelector('.' + P + 'rest').textContent = '×' + rest;
      btn.setAttribute('aria-label', NAMES[s] + ', noch ' + rest + ' übrig' + (selected === s ? ', ausgewählt' : ''));
    });
    SIGNS.forEach(function (s) {
      var e = signEls[s.id];
      e.classList.toggle(P + 'bad', mode === 'check' && !signOk(g, s));
      e.classList.toggle(P + 'ok', (mode === 'check' && signOk(g, s)) || mode === 'solution');
    });
    countsEl.textContent = filledCount() + ' von 9 Tannen gesetzt';
    var msg = '';
    if (mode === 'check') {
      var badSigns = SIGNS.filter(function (s) { return !signOk(g, s); }).length;
      var dups = Object.keys(dupCells(g)).length > 0;
      if (allOk(g)) msg = 'Alle Schilder stimmen und in jeder Reihe kommen alle Höhen vor.';
      else {
        msg = [badSigns ? (badSigns === 1 ? 'Ein Schild stimmt' : badSigns + ' Schilder stimmen') + ' nicht (rot).' : '',
          dups ? 'In rot umrandeten Reihen kommt eine Höhe doppelt vor.' : ''].filter(Boolean).join(' ');
      }
    } else if (mode === 'solution') msg = 'So stehen alle Tannen richtig.';
    noteEl.textContent = msg;
  }

  /* ---------- Eingaben ---------- */
  function onCell(i) {
    if (locked) return;
    focusIdx = i;
    if (selected) {
      if (g[i] === selected) setCell(i, 0);
      else if (!setCell(i, selected)) return;
    } else if (g[i]) setCell(i, 0);
    else return render();
    after();
  }
  function onPal(s) {
    if (locked) return;
    selected = selected === s ? null : s;
    render();
  }
  function onCellKey(e) {
    var i = cells.indexOf(e.currentTarget), r = Math.floor(i / 3), c = i % 3, k = e.key;
    if (k === 'ArrowRight') c = Math.min(2, c + 1);
    else if (k === 'ArrowLeft') c = Math.max(0, c - 1);
    else if (k === 'ArrowDown') r = Math.min(2, r + 1);
    else if (k === 'ArrowUp') r = Math.max(0, r - 1);
    else return;
    e.preventDefault();
    focusIdx = r * 3 + c;
    render();
    cells[focusIdx].focus();
  }
  function onDragStart(e) {
    var t = e.target.closest('[data-pal],[data-i]');
    if (!t || locked) return;
    dragging = t.dataset.pal ? { pal: +t.dataset.pal } : { from: +t.dataset.i };
    if (dragging.from !== undefined && !g[dragging.from]) { dragging = null; return; }
    e.dataTransfer.setData('text/plain', 'tanne');
    e.dataTransfer.effectAllowed = 'move';
    t.classList.add('dragging');
  }
  function onDragOver(e) {
    if (!dragging) return;
    var t = e.target.closest('[data-i],[data-pool]');
    if (!t) return;
    e.preventDefault();
    if (t.dataset.i !== undefined) t.classList.add('over');
  }
  function onDragLeave(e) {
    var t = e.target.closest('[data-i]');
    if (t) t.classList.remove('over');
  }
  function onDrop(e) {
    if (!dragging) return;
    var t = e.target.closest('[data-i],[data-pool]');
    if (!t) return;
    e.preventDefault();
    var d = dragging;
    dragging = null;
    if (t.dataset.i !== undefined) {
      var i = +t.dataset.i;
      if (d.pal) { if (!setCell(i, d.pal)) return render(); }
      else move(d.from, i);
    } else if (d.from !== undefined) setCell(d.from, 0);
    after();
  }
  function onDragEnd() { dragging = null; el.querySelectorAll('.over,.dragging').forEach(function (n) { n.classList.remove('over', 'dragging'); }); }

  /* ---------- Aufbau ---------- */
  function signEl(s) {
    var e = h('div', { class: P + 'sign ' + P + 'sign-' + s.side, role: 'img', 'aria-label': s.text + ': ' + s.n + ' Tannen sichtbar' },
      h('span', { 'aria-hidden': 'true' }, String(s.n)));
    return e;
  }
  function exampleBox() {
    var row = [2, 1, 3];
    return h('section', { class: P + 'example', 'aria-label': 'Beispiel mit einer Reihe' },
      h('h3', null, 'Beispiel: eine Reihe'),
      h('div', { class: P + 'exrow' },
        h('div', { class: P + 'sign ' + P + 'ok', role: 'img', 'aria-label': 'Schild links: 2 Tannen sichtbar' }, h('span', { 'aria-hidden': 'true' }, '2')),
        h('div', { class: P + 'exfield', role: 'img', 'aria-label': 'Reihe von links nach rechts: mittlere, kleine und große Tanne' },
          row.map(function (s) { var d = h('div', { class: P + 'excell' }); d.innerHTML = treeSvg(s); return d; })),
        h('div', { class: P + 'sign ' + P + 'ok', role: 'img', 'aria-label': 'Schild rechts: 1 Tanne sichtbar' }, h('span', { 'aria-hidden': 'true' }, '1'))),
      h('p', { class: P + 'excap' }, 'Von links sieht man die mittlere und die große Tanne (2). Von rechts sieht man nur die große (1).'));
  }

  Biber.register({
    id: 'tannensudoku20',
    story:
      '<p>Die Biber möchten Tannen auf ein Feld setzen. Die Tannen haben drei unterschiedliche Höhen. Wenn eine Tanne hinter einer größeren Tanne steht, kann man sie nicht sehen.</p>' +
      '<p>Das Feld hat Reihen mit je 3 Plätzen für Tannen: drei Reihen waagerecht (von links nach rechts) und drei Reihen senkrecht (von oben nach unten).</p>' +
      '<p>Am Ende einer Reihe steht manchmal ein Schild. Darauf steht, wie viele Tannen in dieser Reihe man vom Schild aus sehen soll. Die Tannen müssen so gesetzt werden, dass alle Schilder stimmen. Und: In jeder Reihe (waagerecht und senkrecht) müssen alle Tannenhöhen vorkommen.</p>',
    question: 'Setze alle Tannen auf das Feld. Am Ende müssen alle Tannen richtig stehen.',
    howto: 'Tippe zuerst eine Tanne unten an und dann das Feld, auf das sie soll. Oder ziehe die Tanne auf das Feld. Eine gesetzte Tanne nimmst du mit einem Tippen wieder weg.',
    explanation: function () {
      return '<p>Die beiden Schilder mit der 3 verlangen, dass man in der oberen Reihe von links und in der linken Spalte von oben alle drei Tannen sieht. Das geht nur, wenn die Tannen vom Schild aus gesehen immer höher werden: klein, mittel, groß. Damit sind schon fünf Felder gefüllt, und das Schild mit der 1 unten links passt auch (dort sieht man nur die große Tanne).</p>' +
        '<p>Das Schild rechts mit der 2 verlangt: Beim Schild steht die kleine Tanne, dahinter die große. Die übrigen Plätze ergeben sich aus der Sudoku-Regel, dass in jeder Reihe alle Höhen vorkommen. So bleibt genau eine Möglichkeit übrig: oben klein, mittel, groß; in der Mitte mittel, groß, klein; unten groß, klein, mittel.</p>' +
        '<p>Vier Zahlen und die Sudoku-Regel genügen, um neun Tannen eindeutig festzulegen. Daten lassen sich oft stark <em>verdichten</em> (komprimieren), wenn man Regeln ausnutzt, die für sie gelten, ohne dass Information verloren geht. Das nutzt man zum Beispiel bei Fotos, Songs und Videos.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset(); focusIdx = 0;
      cells = []; pals = []; signEls = {};
      var i;
      var fieldKids = [];
      for (i = 0; i < 9; i++) {
        (function (ii) {
          var b = h('button', { type: 'button', class: P + 'cell', 'data-i': String(ii), onclick: function () { onCell(ii); }, onkeydown: onCellKey });
          b.style.gridRow = String(Math.floor(ii / 3) + 2);
          b.style.gridColumn = String(ii % 3 + 2);
          cells.push(b);
          fieldKids.push(b);
        })(i);
      }
      SIGNS.forEach(function (s) {
        var e = signEl(s);
        signEls[s.id] = e;
        if (s.side === 'top') { e.style.gridRow = '1'; e.style.gridColumn = String(s.idx + 2); }
        else if (s.side === 'bottom') { e.style.gridRow = '5'; e.style.gridColumn = String(s.idx + 2); }
        else if (s.side === 'left') { e.style.gridColumn = '1'; e.style.gridRow = String(s.idx + 2); }
        else { e.style.gridColumn = '5'; e.style.gridRow = String(s.idx + 2); }
        fieldKids.push(e);
      });
      var field = h('div', { class: P + 'field', role: 'group', 'aria-label': 'Tannenfeld mit 3 mal 3 Plätzen und vier Schildern' }, fieldKids);
      [1, 2, 3].forEach(function (s) {
        var b = h('button', { type: 'button', class: P + 'pal', 'data-pal': String(s), onclick: function () { onPal(s); } });
        b.innerHTML = treeSvg(s) + '<span class="' + P + 'rest"></span>';
        pals.push(b);
      });
      var pool = h('div', { class: P + 'pool', 'data-pool': '', role: 'group', 'aria-label': 'Tannen zum Setzen' }, pals);
      countsEl = h('p', { class: P + 'count', role: 'status', 'aria-live': 'polite' });
      noteEl = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      el.replaceChildren(h('div', { class: P + 'board' },
        exampleBox(),
        h('div', { class: P + 'play' },
          h('section', { class: P + 'fieldbox', 'aria-label': 'Feld' }, field, countsEl, noteEl),
          h('section', { class: P + 'poolbox', 'aria-label': 'Tannen' }, h('h3', null, 'Tannen'), pool))));
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('dragleave', onDragLeave);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', onDragEnd);
      render();
    },
    isComplete: function () { return filledCount() === 9; },
    evaluate: function () { return { correct: allOk(g), answer: g.slice() }; },
    setAnswer: function (ans) {
      g = (Array.isArray(ans) && ans.length === 9 ? ans : []).map(function (x) { return x === 1 || x === 2 || x === 3 ? x : 0; });
      while (g.length < 9) g.push(0);
      [1, 2, 3].forEach(function (s) { var n = 0; g = g.map(function (x) { if (x === s && ++n > 3) return 0; return x; }); });
      selected = null; mode = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mode = on ? (mode === 'solution' ? 'solution' : 'check') : null;
      if (on) selected = null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      g = SOLUTION.slice(); selected = null; mode = 'solution'; locked = true;
      render();
    }
  });
})();
