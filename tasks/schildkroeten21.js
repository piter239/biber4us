/* Aufgabe Vier Schildkröten (Heft 2021, S. 59; Klasse 3-4 schwer, 5-6 mittel, 7-8 leicht): Garten ohne Weg über alle Felder (Hamiltonpfad) finden */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-schildkroeten21-';

  /* Gärten (5 x 9 Felder mit Steinrand): # Stein, G Gras, T Gras mit Schildkröte (Start).
     Aus den Abbildungen im Heft abgelesen; per Skript (Tiefensuche) geprüft: Wege über alle Grasfelder von T aus gibt es in A (3), B (1), D (4), in C keinen. */
  var GARDENS = [
    { key: 'A', rows: ['#########', '#GG#GGGG#', '#GGTG#GG#', '#GGGG#GG#', '#########'] },
    { key: 'B', rows: ['#########', '####GGG##', '#GGTG#G##', '#GGGG#G##', '#########'] },
    { key: 'C', rows: ['#########', '#GGTGGG##', '#G###GG##', '#GGGGGG##', '#########'] },
    { key: 'D', rows: ['#########', '#GGTGGGG#', '#G###GGG#', '#GGGGGGG#', '#########'] }
  ];
  var RIGHT = 2;   /* C: im Heft bestätigt und per Skript (alle Wege durchprobiert) geprüft */
  var COLS = 9, ROWS = 5;

  GARDENS.forEach(function (g) {
    g.cells = [];
    g.rows.forEach(function (row, r) {
      for (var c = 0; c < COLS; c++) {
        var ch = row.charAt(c);
        g.cells.push(ch === '#' ? null : { r: r, c: c });
        if (ch === 'T') g.start = r * COLS + c;
      }
    });
    g.grass = g.cells.filter(Boolean).length;
    g.solution = findPath(g);
  });

  function neighbors(g, i) {
    var r = Math.floor(i / COLS), c = i % COLS, out = [];
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(function (d) {
      var rr = r + d[0], cc = c + d[1];
      if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS) return;
      var j = rr * COLS + cc;
      if (g.cells[j]) out.push(j);
    });
    return out;
  }
  function findPath(g) {   /* ein Weg über alle Grasfelder (Tiefensuche) oder null */
    var path = [g.start], seen = {};
    seen[g.start] = true;
    function dfs() {
      if (path.length === g.grass) return true;
      var ns = neighbors(g, path[path.length - 1]);
      for (var k = 0; k < ns.length; k++) {
        if (seen[ns[k]]) continue;
        seen[ns[k]] = true; path.push(ns[k]);
        if (dfs()) return true;
        path.pop(); seen[ns[k]] = false;
      }
      return false;
    }
    return dfs() ? path : null;
  }
  function parityCounts(g) {
    var a = 0, b = 0;
    g.cells.forEach(function (c) { if (c) { if ((c.r + c.c) % 2 === 0) a++; else b++; } });
    return { even: a, odd: b };
  }

  var TURTLE =
    '<svg class="' + P + 'turtle" viewBox="0 0 40 40" aria-hidden="true">' +
    '<g fill="#2e8b2e" stroke="#14541a" stroke-width="1.3"><ellipse cx="9" cy="11" rx="4" ry="3"/><ellipse cx="31" cy="11" rx="4" ry="3"/><ellipse cx="9" cy="29" rx="4" ry="3"/><ellipse cx="31" cy="29" rx="4" ry="3"/>' +
    '<circle cx="20" cy="6" r="4.5"/></g>' +
    '<ellipse cx="20" cy="22" rx="11" ry="14" fill="#52c25a" stroke="#14541a" stroke-width="1.5"/>' +
    '<path d="M20 12 L26 16 L26 24 L20 28 L14 24 L14 16 Z M20 12 L20 8 M26 16 L30 13 M26 24 L30 28 M14 24 L10 28 M14 16 L10 13 M20 28 L20 33" fill="#7ad982" stroke="#14541a" stroke-width="1" stroke-linejoin="round"/>' +
    '<circle cx="18.3" cy="5.2" r="0.9" fill="#14541a"/><circle cx="21.7" cy="5.2" r="0.9" fill="#14541a"/></svg>';

  var el, api, locked, mark, selected, state, radios, gardenEls;
  /* state[i] = { path: [Zellindex, ...], msg: '' , shown: 'solution'|null } */

  function reset() {
    selected = null; mark = null;
    state = GARDENS.map(function (g) { return { path: [g.start], msg: '', demo: false }; });
  }

  function statusText(i) {
    var g = GARDENS[i], s = state[i], n = s.path.length;
    if (s.demo) return g.solution ? 'So geht es: Die Schildkröte besucht alle ' + g.grass + ' Grasfelder genau einmal.' : paritySentence(g);
    if (s.msg) return s.msg;
    if (n === g.grass) return 'Geschafft: Alle ' + g.grass + ' Grasfelder besucht, jedes genau einmal.';
    var cur = s.path[n - 1];
    var free = neighbors(g, cur).filter(function (j) { return s.path.indexOf(j) < 0; });
    if (!free.length) return 'Sackgasse: ' + n + ' von ' + g.grass + ' Feldern besucht, von hier geht es nicht weiter. Gehe Schritte zurück.';
    return n + ' von ' + g.grass + ' Grasfeldern besucht.';
  }
  function paritySentence(g) {
    var p = parityCounts(g);
    return 'Hier gibt es keinen Weg: Färbt man die Felder wie ein Schachbrett, sind es ' + p.odd + ' helle und ' + p.even + ' dunkle Felder. Die Schildkröte steht auf einem dunklen Feld, müsste aber auf der häufigeren Farbe starten.';
  }

  function drawGarden(i) {
    var g = GARDENS[i], s = state[i], box = gardenEls[i];
    var order = {};
    var path = s.demo && g.solution ? g.solution : s.path;
    path.forEach(function (idx, k) { order[idx] = k + 1; });
    var cur = path[path.length - 1];
    var showParity = s.demo && !g.solution;
    var grid = g.cells.map(function (cell, idx) {
      if (!cell) return h('div', { class: P + 'stone', 'aria-hidden': 'true' });
      var cls = P + 'grass';
      if (order[idx]) cls += ' visited';
      if (showParity) cls += (cell.r + cell.c) % 2 === 0 ? ' dark' : ' light';
      var kids = [];
      if (idx === cur) { var tw = h('span', { class: P + 'tw', 'aria-hidden': 'true' }); tw.innerHTML = TURTLE; kids.push(tw); }
      if (order[idx] && idx !== cur) kids.push(h('span', { class: P + 'num', 'aria-hidden': 'true' }, String(order[idx])));
      return h('button', {
        type: 'button', class: cls, 'data-cell': String(idx), tabindex: '-1', disabled: locked || s.demo,
        'aria-label': 'Feld in Zeile ' + cell.r + ', Spalte ' + cell.c + (idx === cur ? ', hier steht die Schildkröte' : order[idx] ? ', schon besucht' : '')
      }, kids);
    });
    box.grid.replaceChildren.apply(box.grid, grid);
    box.status.textContent = statusText(i);
    box.undo.disabled = locked || s.demo || s.path.length < 2;
    box.restart.disabled = locked || s.demo || s.path.length < 2;
  }
  function refresh() {
    gardenEls.forEach(function (_, i) { drawGarden(i); });
    gardenEls.forEach(function (box, i) {
      var on = selected === i, ok = i === RIGHT;
      box.card.classList.toggle('selected', on);
      box.card.classList.toggle('right', on && mark !== null && ok);
      box.card.classList.toggle('wrong', on && mark === 'check' && !ok);
    });
    radios.forEach(function (btn, i) {
      var on = selected === i, ok = i === RIGHT;
      btn.setAttribute('aria-checked', String(on));
      btn.tabIndex = (selected === null ? i === 0 : on) ? 0 : -1;
      btn.setAttribute('aria-disabled', locked ? 'true' : 'false');
      btn.classList.toggle('selected', on);
      btn.classList.toggle('right', on && mark !== null && ok);
      btn.classList.toggle('wrong', on && mark === 'check' && !ok);
      var m = btn.querySelector('.' + P + 'mark');
      if (m) m.remove();
      if (on && mark !== null) btn.appendChild(h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
    });
  }

  function step(i, j) {   /* Schildkröte in Garten i auf Feld j bewegen (oder einen Schritt zurück) */
    var g = GARDENS[i], s = state[i];
    if (locked || s.demo) return;
    var n = s.path.length, cur = s.path[n - 1];
    s.msg = '';
    if (j === cur) { /* nichts */ }
    else if (n > 1 && j === s.path[n - 2]) s.path.pop();
    else if (s.path.indexOf(j) >= 0) s.msg = 'Dieses Feld hast du schon besucht. Jedes Feld darf nur einmal betreten werden.';
    else if (neighbors(g, cur).indexOf(j) < 0) s.msg = 'Die Schildkröte kann nur auf ein Feld direkt neben ihr gehen: nach links, rechts, oben oder unten.';
    else s.path.push(j);
    drawGarden(i);
  }
  function onClick(e) {
    var t = e.target.closest('[data-cell]');
    if (!t) return;
    var i = gardenEls.map(function (b) { return b.grid; }).indexOf(t.parentNode);
    if (i >= 0) step(i, +t.dataset.cell);
  }
  function onKeyGarden(e, i) {
    var d = { ArrowUp: -COLS, ArrowDown: COLS, ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (!d) return;
    e.preventDefault();
    var s = state[i], cur = s.path[s.path.length - 1];
    var cr = Math.floor(cur / COLS), cc = cur % COLS;
    var nr = cr + (d === -COLS ? -1 : d === COLS ? 1 : 0), nc = cc + (d === -1 ? -1 : d === 1 ? 1 : 0);
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return;
    var j = nr * COLS + nc;
    if (!GARDENS[i].cells[j]) { s.msg = 'Dort liegen Steine, über Steine kann die Schildkröte nicht gehen.'; drawGarden(i); return; }
    step(i, j);
  }

  function choose(i, focus) {
    if (locked) return;
    selected = i;
    refresh();
    if (focus) radios[i].focus();
    api.changed();
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
    id: 'schildkroeten21',
    story:
      '<p>Vier Schildkröten leben in ihren kleinen Gärten. Die Gärten sind in Felder unterteilt. Jedes Feld ist entweder mit Gras oder mit Steinen bedeckt. Die Schildkröten können von einem Grasfeld zum nächsten gehen: nach links, rechts, oben oder unten. Über Steine können sie nicht gehen.</p>' +
      '<p>Jede Schildkröte möchte ihren Garten vollständig abgrasen. Dafür muss sie alle Grasfelder betreten, aber jedes nur genau einmal. Sie startet auf dem Feld, auf dem sie im Bild steht.</p>' +
      '<p>Leider kann eine Schildkröte ihren Garten nicht vollständig abgrasen.</p>',
    question: 'Welcher Garten ist das?',
    howto: 'Wähle unten den Garten aus. Zum Ausprobieren kannst du jede Schildkröte selbst laufen lassen: Tippe auf ein Nachbarfeld oder nutze die Pfeiltasten, tippe auf das vorherige Feld oder „Schritt zurück“, um einen Schritt zu löschen.',
    explanation: function () {
      var p = parityCounts(GARDENS[RIGHT]);
      return '<p>In den Gärten <strong>A</strong>, <strong>B</strong> und <strong>D</strong> findet man jeweils einen Weg über alle Grasfelder. <strong>Garten C</strong> kann nicht vollständig abgegrast werden.</p>' +
        '<p>Das sieht man mit einem Trick: Färbe die Felder wie ein Schachbrett abwechselnd hell und dunkel. Bei jedem Schritt wechselt die Schildkröte die Farbe. In Garten C gibt es ' + p.odd + ' helle und ' + p.even + ' dunkle Felder, die Schildkröte startet aber auf einem dunklen. Ein Weg über alle 15 Felder geht also dunkel, hell, dunkel, hell, … und endet nach 15 Feldern mit dem 8. dunklen Feld. Es gibt aber nur ' + p.even + ' dunkle Felder.</p>' +
        '<p>Einen Weg, der jeden Ort genau einmal besucht, nennt man in der Informatik einen Hamiltonpfad. Ob es einen gibt, kann man durch Ausprobieren oder durch kluge Überlegungen feststellen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      gardenEls = GARDENS.map(function (g, i) {
        var grid = h('div', { class: P + 'grid' });
        var status = h('p', { class: P + 'status', role: 'status', 'aria-live': 'polite' });
        var undo = h('button', { type: 'button', class: 'btn ghost ' + P + 'btn', onclick: function () { var s = state[i]; if (s.path.length > 1) { s.path.pop(); s.msg = ''; drawGarden(i); } } }, 'Schritt zurück');
        var restart = h('button', { type: 'button', class: 'btn ghost ' + P + 'btn', onclick: function () { state[i] = { path: [g.start], msg: '', demo: false }; drawGarden(i); } }, 'Neu starten');
        var area = h('div', { class: P + 'area', tabindex: '0', role: 'group',
          'aria-label': 'Garten ' + g.key + ': Pfeiltasten bewegen die Schildkröte', onkeydown: function (e) { onKeyGarden(e, i); } }, grid);
        var card = h('section', { class: P + 'card', 'aria-label': 'Garten ' + g.key },
          h('h3', null, 'Garten ' + g.key), area, status, h('div', { class: P + 'btns' }, undo, restart));
        return { card: card, grid: grid, status: status, undo: undo, restart: restart };
      });
      radios = GARDENS.map(function (g, i) {
        return h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': g.key,
          'aria-label': 'Antwort ' + g.key + ': In Garten ' + g.key + ' kann die Schildkröte nicht alles abgrasen',
          onclick: function () { choose(i, false); }, onkeydown: onKey
        }, h('span', { 'aria-hidden': 'true' }, g.key + ')'));
      });
      el.addEventListener('click', onClick);
      el.replaceChildren(h('div', { class: P + 'board' },
        h('div', { class: P + 'gardens' }, gardenEls.map(function (b) { return b.card; })),
        h('div', { class: P + 'answer' },
          h('h3', { id: P + 'ah' }, 'Dieser Garten kann nicht vollständig abgegrast werden:'),
          h('div', { class: P + 'opts', role: 'radiogroup', 'aria-labelledby': P + 'ah' }, radios))));
      refresh();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () {
      return { correct: selected === RIGHT, answer: { choice: GARDENS[selected].key } };
    },
    setAnswer: function (ans) {
      var i = GARDENS.map(function (g) { return g.key; }).indexOf(ans && ans.choice);
      selected = i >= 0 ? i : null;
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      if (!on) state.forEach(function (s) { s.demo = false; });
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      refresh();
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () {
      selected = RIGHT; mark = 'solution'; locked = true;
      state.forEach(function (s) { s.demo = true; });
      refresh();
    }
  });
})();
