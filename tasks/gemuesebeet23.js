/* Aufgabe Gemüsebeet (Biber 2023, Klasse 5-6 schwer, 7-8 mittel, 9-10 einfach) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-gemuesebeet23-';

  var VEG = {
    T: { name: 'Tomate', plural: 'Tomaten', img: 'tomate' },
    S: { name: 'Salat', plural: 'Salate', img: 'salat' },
    F: { name: 'Fenchel', plural: 'Fenchel', img: 'fenchel' },
    E: { name: 'Erbse', plural: 'Erbsen', img: 'erbse' },
    L: { name: 'Lauch', plural: 'Lauch', img: 'lauch' }
  };
  var PALETTE = ['T', 'S', 'F', 'E'];
  var STOCK = { T: 3, S: 3, F: 2, E: 4 };
  /* unverträgliche Paare (Blitz im Heft); alle anderen Paare sind erlaubt */
  var BAD = [['T', 'F'], ['L', 'E'], ['T', 'E']];
  var GOOD = [['S', 'E'], ['S', 'F'], ['F', 'E'], ['T', 'L'], ['T', 'S']];
  var ROWS = 3, COLS = 5;
  /* bereits gepflanzter Lauch (Reihe, Spalte) */
  var PRE = { 2: 'L', 6: 'L', 7: 'L' };
  /* die offizielle (einzige) Lösung, Reihe für Reihe */
  var SOLUTION = 'TTLFE' + 'SLLFE' + 'ESTSE';

  function img(k, cls) {
    return h('img', { class: cls || '', src: 'assets/gemuesebeet23/' + VEG[k].img + '.png', alt: '', width: 200, height: 200, draggable: 'false' });
  }
  function isBad(a, b) {
    return BAD.some(function (p) { return (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a); });
  }
  /* Nachbarn im versetzten Sechseckraster: jede untere Reihe ist um ein halbes Feld nach links verschoben */
  function neighbors(i) {
    var r = Math.floor(i / COLS), c = i % COLS, out = [];
    [[r, c - 1], [r, c + 1], [r - 1, c], [r - 1, c - 1], [r + 1, c], [r + 1, c + 1]].forEach(function (p) {
      if (p[0] >= 0 && p[0] < ROWS && p[1] >= 0 && p[1] < COLS) out.push(p[0] * COLS + p[1]);
    });
    return out;
  }
  function conflicts(g) {
    var bad = {}, n = 0;
    g.forEach(function (v, i) {
      if (!v) return;
      neighbors(i).forEach(function (j) {
        if (j > i && g[j] && isBad(v, g[j])) { bad[i] = bad[j] = true; n++; }
      });
    });
    return { cells: bad, count: n };
  }
  function cellName(i) { return 'Reihe ' + (Math.floor(i / COLS) + 1) + ', Feld ' + (i % COLS + 1); }

  var el, api, board, pal, statusEl, hexes;
  var grid, selected, dragging, locked, mark;

  function fresh() {
    var g = [];
    for (var i = 0; i < ROWS * COLS; i++) g.push(PRE[i] || null);
    return g;
  }
  function used(k) { return grid.filter(function (v) { return v === k; }).length; }
  function left(k) { return STOCK[k] - used(k); }
  function isFree(i) { return !PRE[i]; }

  function setStatus(t) { statusEl.textContent = t || ''; }
  function hint() {
    if (locked) return;
    if (selected) setStatus(VEG[selected].name + ' ausgewählt. Tippe einen Bereich an, um es zu pflanzen.');
    else {
      var open = grid.filter(function (v) { return !v; }).length;
      setStatus(open ? 'Noch ' + open + ' freie Bereiche. Wähle ein Gemüse und tippe dann einen Bereich an.' : 'Alle Bereiche sind bepflanzt.');
    }
  }

  function update() {
    var res = mark === 'check' ? conflicts(grid) : { cells: {}, count: 0 };
    PALETTE.forEach(function (k) {
      var b = pal.querySelector('[data-veg="' + k + '"]');
      var n = left(k);
      b.querySelector('.' + P + 'count').textContent = '× ' + n;
      b.classList.toggle('selected', selected === k);
      b.classList.toggle('empty', n === 0);
      b.setAttribute('aria-pressed', String(selected === k));
      b.setAttribute('aria-label', VEG[k].name + ', noch ' + n + ' übrig' + (selected === k ? ', ausgewählt' : ''));
      b.disabled = !!locked || (n === 0 && selected !== k);
      b.draggable = !locked && n > 0;
    });
    hexes.forEach(function (b, i) {
      var v = grid[i];
      var fixed = !!PRE[i];
      var im = b.querySelector('img');
      if (v) {
        if (!im) { im = img(v); b.appendChild(im); } else im.src = 'assets/gemuesebeet23/' + VEG[v].img + '.png';
      } else if (im) im.remove();
      b.classList.toggle('filled', !!v);
      b.classList.toggle('fixed', fixed);
      b.classList.toggle('bad', !!res.cells[i]);
      b.classList.toggle('ok', (mark === 'check' && !res.cells[i] && !!v && !fixed) || (mark === 'solution' && !fixed));
      b.setAttribute('aria-label', cellName(i) + ': ' + (v ? VEG[v].name + (fixed ? ' (schon gepflanzt)' : '') : 'frei') + (res.cells[i] ? ', verträgt sich nicht mit einem Nachbarn' : ''));
      if (!fixed) {
        b.disabled = !!locked;
        b.draggable = !locked && !!v;
      }
    });
    board.classList.toggle('armed', !!selected && !locked);
  }

  function plant(i, k, from) {
    if (locked || !isFree(i) || !k) return;
    var old = grid[i];
    if (old === k && from == null) { selected = null; update(); hint(); return; }
    if (from != null) {
      if (from === i) return;
      grid[from] = old || null;
    } else if (left(k) <= 0 && old !== k) {
      setStatus('Es ist kein ' + VEG[k].name + ' mehr übrig.');
      return;
    }
    grid[i] = k;
    if (from != null || left(k) === 0) selected = null;
    mark = null;
    update(); hint();
    api.changed();
  }
  function remove(i) {
    if (locked || !isFree(i) || !grid[i]) return;
    grid[i] = null;
    mark = null;
    update(); hint();
    api.changed();
  }

  function onHex(i) {
    if (locked || !isFree(i)) return;
    if (selected) plant(i, selected, null);
    else if (grid[i]) remove(i);
    else setStatus('Wähle zuerst ein Gemüse.');
  }
  function onVeg(k) {
    if (locked) return;
    selected = selected === k ? null : k;
    update(); hint();
  }

  function buildHexes() {
    hexes = [];
    var cells = [];
    for (var i = 0; i < ROWS * COLS; i++) {
      (function (i) {
        var r = Math.floor(i / COLS), c = i % COLS;
        var x = ((ROWS - 1 - r) * 50 + 100 * c) / 600 * 100;
        var y = r * 86.6 / 288.7 * 100;
        var fixed = !!PRE[i];
        var b = h(fixed ? 'div' : 'button', {
          class: P + 'hex', type: fixed ? false : 'button', 'data-i': String(i), role: fixed ? 'img' : false,
          style: 'left:' + x.toFixed(3) + '%;top:' + y.toFixed(3) + '%;'
        }, h('span', { class: P + 'edge', 'aria-hidden': 'true' }), h('span', { class: P + 'fill', 'aria-hidden': 'true' }));
        if (!fixed) b.addEventListener('click', function () { onHex(i); });
        hexes.push(b);
        cells.push(b);
      })(i);
    }
    return cells;
  }

  function legend() {
    function pair(a, b, sign) {
      return h('li', { class: P + 'pair ' + P + sign, 'aria-label': VEG[a].name + (sign === 'bad' ? ' verträgt sich nicht mit ' : ' verträgt sich gut mit ') + VEG[b].name },
        img(a), h('span', { class: P + 'sign', 'aria-hidden': 'true' }, sign === 'bad' ? '⚡' : '✓'), img(b));
    }
    return h('div', { class: P + 'legend' },
      h('div', null, h('h3', null, 'Vertragen sich nicht'), h('ul', null, BAD.map(function (p) { return pair(p[0], p[1], 'bad'); }))),
      h('div', null, h('h3', null, 'Vertragen sich gut'), h('ul', null, GOOD.map(function (p) { return pair(p[0], p[1], 'good'); }))));
  }

  function onDragStart(e) {
    var v = e.target.closest('[data-veg]'), hx = e.target.closest('[data-i]');
    if (locked) return;
    if (v && !v.disabled) dragging = { k: v.dataset.veg, from: null };
    else if (hx && isFree(+hx.dataset.i) && grid[+hx.dataset.i]) dragging = { k: grid[+hx.dataset.i], from: +hx.dataset.i };
    else return;
    e.dataTransfer.setData('text/plain', dragging.k);
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e) {
    if (!dragging) return;
    var hx = e.target.closest('[data-i]');
    if ((hx && isFree(+hx.dataset.i)) || (e.target.closest('[data-pal]') && dragging.from != null)) e.preventDefault();
  }
  function onDrop(e) {
    if (!dragging) return;
    var d = dragging, hx = e.target.closest('[data-i]');
    dragging = null;
    if (hx && isFree(+hx.dataset.i)) { e.preventDefault(); plant(+hx.dataset.i, d.k, d.from); }
    else if (e.target.closest('[data-pal]') && d.from != null) { e.preventDefault(); remove(d.from); }
  }

  function reset() { grid = fresh(); selected = null; dragging = null; mark = null; }

  Biber.register({
    id: 'gemuesebeet23',
    story: '<p>Lisa legt ein Gemüsebeet an, mit sechseckigen Bereichen. Darauf will sie Gemüse pflanzen, in jeden Bereich eines. Es gibt fünf Sorten. Manche vertragen sich gut miteinander, andere nicht (siehe unten).</p>' +
      '<p>Beim Pflanzen beachtet Lisa folgende Regel: <strong>Gemüse, die sich nicht vertragen, dürfen nicht in Bereiche gepflanzt werden, die sich berühren.</strong> In drei Bereiche hat Lisa schon Lauch gepflanzt.</p>',
    question: 'Bepflanze alle noch freien Bereiche und beachte Lisas Regel!',
    howto: 'Tippe ein Gemüse an und dann einen freien Bereich im Beet. Du kannst ein Gemüse auch hineinziehen. Tippe ein gepflanztes Gemüse an (ohne eines ausgewählt zu haben), um es wieder herauszunehmen. Jedes Gemüse gibt es nur so oft, wie angezeigt.',
    explanation: function () {
      return '<p>Man baut die Lösung Schritt für Schritt auf und achtet bei jedem Schritt auf die Regel. Erbsen vertragen sich nicht mit Lauch und passen deshalb nur in die Bereiche, die den Lauch nicht berühren. Tomaten vertragen sich nicht mit Erbsen, also kommen sie nur dorthin, wo keine Erbse angrenzt. Fenchel verträgt sich nicht mit Tomaten und findet seinen Platz zwischen Lauch und Erbsen. In die übrigen Bereiche passt der Salat, für den keine Unverträglichkeit bekannt ist.</p>' +
        '<p>Alle Kombinationen zu probieren (Brute Force) würde bei großen Beeten sehr lange dauern. Besser ist es, schrittweise vorzugehen und Fehler gar nicht erst entstehen zu lassen. Geht es bei einem Schritt nicht weiter, nimmt man die letzten Schritte zurück und probiert etwas anderes (Backtracking).</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      pal = h('div', { class: P + 'pal', 'data-pal': '', role: 'group', 'aria-label': 'Gemüse zum Pflanzen' },
        PALETTE.map(function (k) {
          return h('button', { type: 'button', class: P + 'veg', 'data-veg': k, onclick: function () { onVeg(k); } },
            img(k), h('span', { class: P + 'vname' }, VEG[k].name), h('span', { class: P + 'count' }, ''));
        }));
      board = h('div', { class: P + 'board', role: 'group', 'aria-label': 'Gemüsebeet mit 15 sechseckigen Bereichen in drei Reihen' }, buildHexes());
      statusEl = h('p', { class: P + 'status', 'aria-live': 'polite' });
      el.replaceChildren(h('div', { class: P + 'wrap' }, legend(), pal, h('div', { class: P + 'beet' }, board), statusEl));
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', function () { dragging = null; });
      update(); hint();
    },
    isComplete: function () { return grid.every(Boolean); },
    evaluate: function () {
      var ok = grid.every(Boolean) && conflicts(grid).count === 0;
      return { correct: ok, answer: grid.map(function (v) { return v || ''; }).join('') };
    },
    setAnswer: function (ans) {
      var s = String(ans || '');
      grid = fresh();
      for (var i = 0; i < grid.length; i++) if (s.charAt(i) && VEG[s.charAt(i)]) grid[i] = s.charAt(i);
      selected = null;
      mark = 'check';
      update();
    },
    lock: function (on) {
      locked = on;
      if (on) {
        selected = null;
        if (mark !== 'solution') mark = 'check';
        var n = conflicts(grid).count;
        setStatus(mark === 'solution' ? 'So kann das Beet bepflanzt werden.' :
          n ? n + (n === 1 ? ' Stelle verstößt' : ' Stellen verstoßen') + ' gegen Lisas Regel (rot markiert).' : 'Kein Verstoß gegen Lisas Regel.');
      } else {
        mark = null;
        hint();
      }
      update();
    },
    reset: function () { reset(); update(); hint(); },
    showSolution: function () {
      grid = SOLUTION.split('');
      selected = null;
      mark = 'solution';
      update();
    }
  });
})();
