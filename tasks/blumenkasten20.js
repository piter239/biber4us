/* Aufgabe Blumenkasten (Biber 2020; Klasse 7-8 mittel, 9-10 leicht): perfekte Bepflanzung eines 3x3-Blumenkastens finden */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-blumenkasten20-';

  var COLORS = ['R', 'Y', 'O'];                         /* 0 = rot, 1 = gelb, 2 = orange */
  var NAMES = ['rote', 'gelbe', 'orange'];
  var NAME1 = ['Rote Blume', 'Gelbe Blume', 'Orange Blume'];
  var PER_COLOR = 5;                                    /* im Heft liegen je 5 Blumen jeder Farbe bereit */
  var BEST = 32;                                        /* per Skript (alle 3^9 Bepflanzungen) bestimmt: Maximum 32 Punkte */
  var SOLUTION = [2, 1, 0, 1, 0, 1, 0, 1, 0];           /* O Y R / Y R Y / R Y R = 32 Punkte */

  /* Nachbarpaare (waagerecht und senkrecht) im 3x3-Kasten */
  var EDGES = [];
  (function () {
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
      var i = r * 3 + c;
      if (c < 2) EDGES.push([i, i + 1]);
      if (r < 2) EDGES.push([i, i + 3]);
    }
  })();
  function pairPoints(a, b) {
    if (a < 0 || b < 0) return 0;
    var lo = Math.min(a, b), hi = Math.max(a, b);
    if (lo === 0 && hi === 1) return 3;                 /* rot neben gelb */
    if (lo === 1 && hi === 2) return 1;                 /* gelb neben orange */
    return 0;
  }
  function score(g) { return EDGES.reduce(function (s, e) { return s + pairPoints(g[e[0]], g[e[1]]); }, 0); }
  function counts(g) { var n = [0, 0, 0]; g.forEach(function (x) { if (x >= 0) n[x]++; }); return n; }
  function isPerfect(g) {
    var n = counts(g);
    return g.every(function (x) { return x >= 0; }) && n[0] > 0 && n[1] > 0 && n[2] > 0 && score(g) === BEST;
  }

  /* ---------- Blumen zeichnen (viewBox -50 -50 100 100) ---------- */
  function flowerInner(k) {
    var i, s = '';
    if (k === 0) {
      var pts = [];
      for (i = 0; i < 10; i++) {
        var rad = i % 2 ? 19 : 46, ang = -Math.PI / 2 + i * Math.PI / 5;
        pts.push((Math.cos(ang) * rad).toFixed(1) + ',' + (Math.sin(ang) * rad).toFixed(1));
      }
      s = '<polygon points="' + pts.join(' ') + '" fill="#ff6b6b" stroke="#ff6b6b" stroke-width="6" stroke-linejoin="round"/>' +
        '<circle r="6" fill="#ffb627"/>';
    } else if (k === 1) {
      for (i = 0; i < 8; i++) {
        var a = i * Math.PI / 4;
        s += '<circle cx="' + (Math.cos(a) * 25).toFixed(1) + '" cy="' + (Math.sin(a) * 25).toFixed(1) + '" r="15" fill="#ffd93b"/>';
      }
      s += '<circle r="19" fill="#ffd93b"/><circle r="8" fill="#ff9a1a"/>';
    } else {
      var p2 = [];
      for (i = 0; i < 28; i++) {
        var r2 = i % 2 ? 38 : 47, an = i * Math.PI / 14;
        p2.push((Math.cos(an) * r2).toFixed(1) + ',' + (Math.sin(an) * r2).toFixed(1));
      }
      s = '<polygon points="' + p2.join(' ') + '" fill="#ff8a0a" stroke="#ff8a0a" stroke-width="2" stroke-linejoin="round"/>' +
        '<circle r="9" fill="#111"/>';
    }
    return s;
  }
  function flowerSvg(k, cls) {
    return '<svg class="' + (cls || P + 'fl') + '" viewBox="-52 -52 104 104" aria-hidden="true" focusable="false">' + flowerInner(k) + '</svg>';
  }
  function inlineFlower(k) {
    return '<span class="' + P + 'inl" aria-hidden="true">' + flowerSvg(k, P + 'inlsvg') + '</span>';
  }

  /* ---------- Zustand ---------- */
  var el, api, locked, mark;       /* mark: null | 'check' | 'solution' */
  var grid, active, dragging;
  var cellEls, palEls, scoreEl, linesEl, noteEl, boardEl;

  function reset() { grid = [-1, -1, -1, -1, -1, -1, -1, -1, -1]; active = null; dragging = null; mark = null; }

  function place(k, i) {
    if (locked) return;
    var left = PER_COLOR - counts(grid)[k] + (grid[i] === k ? 1 : 0);
    if (left <= 0) return say('Von dieser Farbe ist keine Blume mehr übrig. Nimm erst eine aus dem Kasten heraus.');
    grid[i] = k;
    refresh();
    api.changed();
  }
  function takeOut(i) {
    if (locked || grid[i] < 0) return;
    grid[i] = -1;
    refresh();
    api.changed();
  }
  function say(t) { noteEl.textContent = t; }

  function onCell(i) {
    if (locked) return;
    if (active !== null && grid[i] !== active) place(active, i);
    else if (grid[i] >= 0) takeOut(i);
    else say('Wähle zuerst eine Blumenfarbe aus.');
  }
  function onPalette(k) {
    if (locked) return;
    active = active === k ? null : k;
    refresh();
  }

  /* ---------- Zeichnen ---------- */
  var CX = [50, 150, 250];
  function linesSvg() {
    var s = '<svg class="' + P + 'lines" viewBox="0 0 300 300" aria-hidden="true" focusable="false">';
    EDGES.forEach(function (e) {
      var x1 = CX[e[0] % 3], y1 = CX[Math.floor(e[0] / 3)], x2 = CX[e[1] % 3], y2 = CX[Math.floor(e[1] / 3)];
      var pts = pairPoints(grid[e[0]], grid[e[1]]);
      s += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" class="' + P + 'ln' + (pts ? ' ' + P + 'on' : '') + '"/>';
      if (pts) {
        var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        s += '<g class="' + P + 'pt' + (pts === 3 ? ' ' + P + 'p3' : ' ' + P + 'p1') + '"><circle cx="' + mx + '" cy="' + my + '" r="12"/>' +
          '<text x="' + mx + '" y="' + (my + 5) + '" text-anchor="middle">' + pts + '</text></g>';
      }
    });
    return s + '</svg>';
  }

  function cellLabel(i) {
    var pos = 'Reihe ' + (Math.floor(i / 3) + 1) + ', Platz ' + (i % 3 + 1);
    if (grid[i] < 0) return pos + ': leer';
    return pos + ': ' + NAME1[grid[i]] + (locked ? '' : ', zum Herausnehmen antippen');
  }

  function refresh() {
    var n = counts(grid), sc = score(grid), full = grid.every(function (x) { return x >= 0; });
    linesEl.innerHTML = linesSvg();
    cellEls.forEach(function (b, i) {
      b.innerHTML = grid[i] >= 0 ? flowerSvg(grid[i]) : '';
      b.setAttribute('aria-label', cellLabel(i));
      b.disabled = locked;
      b.draggable = !locked && grid[i] >= 0;
      b.classList.toggle(P + 'filled', grid[i] >= 0);
    });
    palEls.forEach(function (b, k) {
      var left = PER_COLOR - n[k];
      b.querySelector('.' + P + 'cnt').textContent = '× ' + left;
      b.setAttribute('aria-pressed', String(active === k));
      b.setAttribute('aria-label', NAME1[k] + ', ' + left + ' übrig' + (active === k ? ', ausgewählt' : ''));
      b.classList.toggle(P + 'sel', active === k);
      b.classList.toggle(P + 'empty', left <= 0);
      b.disabled = locked;
      b.draggable = !locked && left > 0;
    });
    scoreEl.textContent = String(sc);
    scoreEl.parentNode.setAttribute('aria-label', 'Punkte: ' + sc);
    boardEl.classList.toggle(P + 'right', mark !== null && isPerfect(grid));
    boardEl.classList.toggle(P + 'wrong', mark === 'check' && !isPerfect(grid));
    if (mark === 'solution') say('So sieht eine perfekte Bepflanzung aus: ' + BEST + ' Punkte. Die Zahlen auf den Linien zeigen die Punkte der Paare.');
    else if (mark === 'check') {
      if (isPerfect(grid)) say('Perfekt: ' + sc + ' Punkte, mehr geht nicht.');
      else if (!(n[0] && n[1] && n[2])) say('Es fehlt noch eine Blumenfarbe. Jede Farbe muss mindestens einmal vorkommen.');
      else say('Deine Bepflanzung hat ' + sc + ' Punkte. Es geht noch besser.');
    } else if (full) say('Der Kasten ist voll: ' + sc + ' Punkte. Prüfe die Antwort oder probiere eine bessere Anordnung.');
    else if (active === null) say('Wähle eine Blumenfarbe und tippe dann auf einen freien Platz im Kasten. Eine Blume nimmst du durch Antippen wieder heraus.');
    else say(NAME1[active] + ' ausgewählt: Tippe auf Plätze im Kasten. Tippe die Farbe nochmal an, um die Auswahl aufzuheben.');
  }

  /* ---------- Ziehen mit der Maus ---------- */
  function onDragStart(e) {
    var t = e.target.closest('[data-pal],[data-cell]');
    if (!t || locked) return;
    if (t.dataset.pal !== undefined) dragging = { k: +t.dataset.pal, from: -1 };
    else if (grid[+t.dataset.cell] >= 0) dragging = { k: grid[+t.dataset.cell], from: +t.dataset.cell };
    else return e.preventDefault();
    e.dataTransfer.setData('text/plain', String(dragging.k));
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e) {
    if (!dragging) return;
    var t = e.target.closest('[data-cell],[data-pool]');
    if (t) e.preventDefault();
  }
  function onDrop(e) {
    if (!dragging || locked) return;
    var t = e.target.closest('[data-cell],[data-pool]');
    if (!t) return;
    e.preventDefault();
    var d = dragging;
    dragging = null;
    if (t.dataset.cell !== undefined) {
      var i = +t.dataset.cell;
      if (d.from === i) return;
      if (d.from >= 0) grid[d.from] = -1;
      place(d.k, i);
      if (d.from >= 0) refresh();
    } else if (d.from >= 0) takeOut(d.from);
  }

  Biber.register({
    id: 'blumenkasten20',
    story:
      '<p>Peter liebt Blumen. Er hat rote ' + inlineFlower(0) + ', gelbe ' + inlineFlower(1) + ' und orange ' + inlineFlower(2) + ' Blumen, von jeder Farbe fünf. ' +
      'Peter hat einen neuen Blumenkasten mit Platz für 3×3 Blumen. Dafür sucht er die perfekte Bepflanzung.</p>' +
      '<p>Um eine Bepflanzung zu bewerten, schaut Peter, welche Blumenfarben direkt nebeneinander stehen (waagerecht oder senkrecht, nicht schräg). Dabei vergibt er Punkte:</p>' +
      '<ul><li>Rot neben Gelb gibt 3 Punkte.</li><li>Gelb neben Orange gibt 1 Punkt.</li><li>Ansonsten gibt es keine Punkte.</li></ul>' +
      '<p>Am Ende zählt Peter alle Punkte zusammen. Die Bepflanzung ist perfekt, wenn sie so viele Punkte bekommt wie möglich. Außerdem muss jede Blumenfarbe mindestens einmal vorkommen.</p>',
    question: 'Finde die perfekte Bepflanzung!',
    howto: 'Wähle eine Blumenfarbe aus und tippe auf die Plätze im Kasten. Tippe eine Blume im Kasten an, um sie wieder herauszunehmen. Mit der Maus kannst du die Blumen auch ziehen. Die Punktzahl steht unten im Kasten.',
    explanation: function () {
      return '<p>Jede der 12 Linien im Kasten steht für ein Nachbarpaar. Am meisten Punkte gibt es, wenn möglichst viele Paare aus <strong>Rot und Gelb</strong> bestehen (3 Punkte). ' +
        'Orange muss aber mindestens einmal vorkommen, und eine orange Blume bringt nur etwas neben Gelb (1 Punkt). Jedes orange-gelbe Paar nimmt einem rot-gelben Paar den Platz weg.</p>' +
        '<p>Deshalb setzt man genau <strong>eine</strong> orange Blume in eine Ecke: Dort hat sie nur zwei Nachbarn, weniger geht nicht. Daneben kommen gelbe Blumen, den Rest füllt man abwechselnd mit Rot und Gelb. ' +
        'So gibt es 2 Paare mit Orange und 10 mit Rot-Gelb: 2 · 1 + 10 · 3 = <strong>32 Punkte</strong>. Mehr ist nicht möglich, die perfekte Bepflanzung hat also 32 Punkte.</p>' +
        '<p>Aufgaben, bei denen man die beste Lösung sucht, heißen <em>Optimierungsaufgaben</em>. Die Punktzahl, mit der man Lösungen vergleicht, nennt man <em>Optimierungsfunktion</em>. Mit ihr kann man jede Lösung bewerten und entscheiden, welche besser ist.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      linesEl = h('div', { class: P + 'linebox' });
      cellEls = [];
      var cells = h('div', { class: P + 'cells' });
      for (var i = 0; i < 9; i++) {
        (function (i) {
          var b = h('button', { type: 'button', class: P + 'cell', 'data-cell': String(i), onclick: function () { onCell(i); } });
          cellEls.push(b);
          cells.appendChild(b);
        })(i);
      }
      scoreEl = h('span', { class: P + 'num' }, '0');
      boardEl = h('div', { class: P + 'box' },
        h('div', { class: P + 'soil' }, linesEl, cells),
        h('div', { class: P + 'bar', role: 'status', 'aria-label': 'Punkte: 0' }, h('span', { class: P + 'barlbl' }, 'Punkte'), scoreEl));
      palEls = COLORS.map(function (c, k) {
        var b = h('button', { type: 'button', class: P + 'pal', 'data-pal': String(k), onclick: function () { onPalette(k); } });
        b.innerHTML = flowerSvg(k) + '<span class="' + P + 'cnt"></span>';
        return b;
      });
      noteEl = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { 'aria-label': 'Blumenkasten' }, h('h3', null, 'Blumenkasten'), boardEl),
        h('section', { 'aria-label': 'Blumen' }, h('h3', null, 'Blumen'),
          h('div', { class: P + 'pool', 'data-pool': '', role: 'group', 'aria-label': 'Blumenfarben zur Auswahl' }, palEls)),
        noteEl));
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', function () { dragging = null; });
      refresh();
    },
    isComplete: function () { return grid.every(function (x) { return x >= 0; }); },
    evaluate: function () {
      return { correct: isPerfect(grid), answer: { grid: grid.slice(), points: score(grid) } };
    },
    setAnswer: function (ans) {
      if (ans && ans.grid && ans.grid.length === 9) grid = ans.grid.slice();
      active = null;
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      if (!on) active = null;
      refresh();
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () { grid = SOLUTION.slice(); active = null; mark = 'solution'; locked = true; refresh(); }
  });
})();
