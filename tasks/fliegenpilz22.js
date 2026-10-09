/* Aufgabe Achtung Fliegenpilz (Biber 2022; Klasse 7-8 leicht, 9-10 leicht): aus den aufgedeckten Zahlen schließen, wo sicher kein Pilz ist */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-fliegenpilz22-';

  /* Brett der Aufgabe (3 Zeilen × 4 Spalten): Zahl = aufgedeckte Zahl, 'M' = aufgedeckter Pilz, Buchstabe = zugedeckt */
  var BOARD = [
    ['A', 1, 'B', 'C'],
    [1, 2, 1, 'E'],
    ['D', 1, 'M', 'F']
  ];
  var SAFE = ['B', 'C', 'D', 'E', 'F'];   /* im Heft bestätigt; per Skript über alle 2^6 Verteilungen geprüft: nur "Pilz auf A" passt zu allen Zahlen */
  var MUSH = 'A';
  var LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

  /* Beispiel-Brett aus dem Heft (4 × 4), vollständig aufgedeckt */
  var EXAMPLE = [
    [0, 1, 1, 1],
    [1, 3, 'M', 2],
    [1, 'M', 'M', 2],
    [1, 2, 2, 1]
  ];

  var MUSHROOM_SVG =
    '<svg class="' + P + 'pilz" viewBox="0 0 40 40" aria-hidden="true" focusable="false">' +
    '<path d="M14 24h12l2 11H12z" fill="#fbf7ea" stroke="#9a937f" stroke-width="1"/>' +
    '<path d="M4 23C4 11 11 5 20 5s16 6 16 18c0 2-2 3-4 3H8c-2 0-4-1-4-3z" fill="#d6282a" stroke="#8c1416" stroke-width="1.2"/>' +
    '<circle cx="12" cy="16" r="3" fill="#fff"/><circle cx="22" cy="11" r="3.2" fill="#fff"/><circle cx="29" cy="19" r="2.8" fill="#fff"/><circle cx="19" cy="20" r="2" fill="#fff"/>' +
    '<circle cx="18" cy="29" r="1.1" fill="#4a4538"/><circle cx="23" cy="29" r="1.1" fill="#4a4538"/><path d="M18 32q2.5 1.6 5 0" fill="none" stroke="#4a4538" stroke-width="1"/></svg>';

  function neighbours(grid, r, c) {
    var n = [];
    for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      if (grid[r + dr] && (c + dc) >= 0 && (c + dc) < grid[r + dr].length) n.push([r + dr, c + dc]);
    }
    return n;
  }

  /* statische Darstellung eines Bretts als HTML (Beispiel, Lösung); cell(v, r, c) -> {cls, html} */
  function staticBoard(grid, label, cellFn) {
    var cols = grid[0].length;
    var s = '<div class="' + P + 'grid ' + P + 'static" style="--cols:' + cols + '" role="img" aria-label="' + label + '">';
    grid.forEach(function (row, r) {
      row.forEach(function (v, c) { var o = cellFn(v, r, c); s += '<div class="' + P + 'cell ' + o.cls + '" aria-hidden="true">' + o.html + '</div>'; });
    });
    return s + '</div>';
  }
  function exampleHtml() {
    return staticBoard(EXAMPLE, 'Beispiel: vollständig aufgedecktes Spielbrett mit 4 mal 4 Feldern. Erste Zeile 0 1 1 1, zweite Zeile 1 3 Pilz 2, dritte Zeile 1 Pilz Pilz 2, vierte Zeile 1 2 2 1.',
      function (v) { return v === 'M' ? { cls: P + 'mush', html: MUSHROOM_SVG } : { cls: P + 'num', html: String(v) }; });
  }
  function solvedHtml() {
    var full = BOARD.map(function (row) { return row.map(function (v) { return v === MUSH ? 'M' : v; }); });
    var isM = function (v) { return v === 'M'; };
    return staticBoard(full, 'Das vollständig aufgedeckte Brett: Pilze auf A und auf dem schon sichtbaren Feld, alle anderen Felder zeigen Zahlen.', function (v, r, c) {
      if (isM(v)) return { cls: P + 'mush', html: MUSHROOM_SVG };
      var n = neighbours(full, r, c).filter(function (q) { return isM(full[q[0]][q[1]]); }).length;
      var wasCovered = typeof v === 'string';
      return { cls: P + 'num' + (wasCovered ? ' ' + P + 'new' : ''), html: String(n) };
    });
  }

  var el, api, marked, locked, mark, boardEl, noteEl;

  function reset() { marked = {}; mark = null; }
  function count() { return LETTERS.filter(function (k) { return marked[k]; }).length; }
  function toggle(k) {
    if (locked) return;
    marked[k] = !marked[k];
    render(k);
    api.changed();
  }

  function render(focusLetter) {
    var kids = [];
    BOARD.forEach(function (row, r) {
      row.forEach(function (v, c) {
        if (v === 'M') kids.push(h('div', { class: P + 'cell ' + P + 'mush', role: 'img', 'aria-label': 'Aufgedeckter Fliegenpilz' }, mushNode()));
        else if (typeof v === 'number') kids.push(h('div', { class: P + 'cell ' + P + 'num', role: 'img', 'aria-label': 'Zahl ' + v }, String(v)));
        else {
          var on = !!marked[v], isSafe = SAFE.indexOf(v) >= 0, cls = P + 'cell ' + P + 'cov';
          var shown = mark === 'solution' && v === MUSH;
          if (on) cls += ' ' + P + 'on';
          if (mark === 'check') {
            if (on) cls += isSafe ? ' right' : ' wrong';
            else if (isSafe) cls += ' missed';
          }
          if (mark === 'solution' && !shown) cls += ' right';
          var b;
          if (shown) {
            b = h('div', { class: P + 'cell ' + P + 'mush ' + P + 'reveal', role: 'img', 'aria-label': 'Feld ' + v + ': hier versteckt sich ein Fliegenpilz' }, mushNode(),
              h('span', { class: P + 'letter', 'aria-hidden': 'true' }, v));
          } else {
            b = h('button', {
              type: 'button', role: 'checkbox', class: cls, 'data-k': v, 'aria-checked': String(on), disabled: locked,
              'aria-label': 'Feld ' + v + ', zugedeckt, Zeile ' + (r + 1) + ', Spalte ' + (c + 1) + ': hier ist sicher kein Fliegenpilz',
              onclick: function () { toggle(v); }
            }, h('span', { class: P + 'letter', 'aria-hidden': 'true' }, v),
              on || (mark === 'solution') ? h('span', { class: P + 'tick', 'aria-hidden': 'true' }, mark === 'check' && !isSafe ? '✗' : '✓') : null);
          }
          kids.push(b);
        }
      });
    });
    boardEl.replaceChildren.apply(boardEl, kids);
    var n = count();
    noteEl.textContent = mark === 'solution' ? 'Auf A steckt ein Fliegenpilz. Auf B, C, D, E und F darfst du aufdecken.' :
      n === 0 ? 'Tippe die zugedeckten Felder an, auf denen sicher kein Fliegenpilz ist.' : n + (n === 1 ? ' Feld' : ' Felder') + ' als sicher markiert.';
    if (focusLetter) { var t = boardEl.querySelector('[data-k="' + focusLetter + '"]'); if (t) t.focus(); }
  }
  function mushNode() { var d = document.createElement('span'); d.className = P + 'mushwrap'; d.innerHTML = MUSHROOM_SVG; return d; }

  Biber.register({
    id: 'fliegenpilz22',
    story:
      '<p>Beim Spiel „Achtung Fliegenpilz“ ist zu Beginn genau ein Fliegenpilz zu sehen. Alle anderen Felder des Spielbretts sind zugedeckt. Deckst du ein Feld auf, erscheint entweder ein weiterer Fliegenpilz oder die Anzahl der Fliegenpilze auf den Nachbarfeldern (auch diagonal). Wenn du alle Felder aufdeckst, auf denen kein Fliegenpilz versteckt ist, hast du gewonnen.</p>' +
      '<p>Hier ist ein Beispiel für ein vollständig aufgedecktes Spielbrett:</p>' + exampleHtml() +
      '<p>Du hast ein neues Spiel begonnen und bereits einige Felder aufgedeckt (siehe unten). Die zugedeckten Felder tragen die Buchstaben A bis F.</p>',
    question: 'Auf welchen der übrigen Felder ist sicher kein Fliegenpilz?',
    howto: 'Tippe jedes zugedeckte Feld an, auf dem sicher kein Fliegenpilz ist. Noch einmal antippen nimmt die Markierung zurück.',
    explanation: function () {
      return '<p>Eine Zahl N gilt als „verbraucht“, wenn schon auf N ihrer Nachbarfelder ein Fliegenpilz zu sehen ist; auf den übrigen Nachbarfeldern ist dann keiner mehr. Die 1 rechts neben D hat schon einen Pilz als Nachbarn, also ist auf <strong>D</strong> kein Pilz. ' +
        'Die gemeinsame Nachbarzahl 1 von <strong>B, C, E und F</strong> ist ebenfalls verbraucht, also ist auch dort keiner. Auf <strong>A</strong> muss ein Pilz sein, sonst würden die Zahlen 1, 2 und 1 in der Nachbarschaft nicht stimmen. Sicher pilzfrei sind also B, C, D, E und F:</p>' +
        solvedHtml() +
        '<p>Mit solchen Regeln kann auch ein Computerprogramm das Spiel lösen: Bei einer 0 sind alle Nachbarn sicher, bei einer verbrauchten Zahl sind alle übrigen Nachbarn sicher. Es prüft immer wieder alle Felder, bis keine Regel mehr anwendbar ist. Das ist ein Algorithmus aus einfachen Regeln.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      boardEl = h('div', { class: P + 'grid', style: '--cols:4', role: 'group', 'aria-label': 'Spielbrett mit 3 Zeilen und 4 Spalten' });
      noteEl = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      el.replaceChildren(h('div', { class: P + 'wrap' }, boardEl, noteEl));
      render();
    },
    isComplete: function () { return count() > 0; },
    evaluate: function () {
      var picked = LETTERS.filter(function (k) { return marked[k]; });
      return { correct: picked.join('') === SAFE.join(''), answer: { safe: picked } };
    },
    setAnswer: function (ans) {
      marked = {};
      ((ans && ans.safe) || []).forEach(function (k) { if (LETTERS.indexOf(k) >= 0) marked[k] = true; });
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      marked = {};
      SAFE.forEach(function (k) { marked[k] = true; });
      mark = 'solution'; locked = true;
      render();
    }
  });
})();
