/* Aufgabe Filmabend (Biber 2022; Klasse 7-8 schwer, 9-10 mittel, 11-13 leicht): in einer Bewertungstabelle möglichst wenige Bewertungen ändern, damit ein Film von allen Personen die jeweils beste Bewertung erhält */
(function () {
  'use strict';
  var h = Biber.h, S = Biber.svg;
  var P = 't-filmabend22-';

  var PEOPLE = ['Ada', 'Nancy', 'Niklaus', 'Grace', 'Edsger', 'Rozsa'];
  var FILMS = 7;
  /* 2 = gut, 1 = mittel, 0 = schlecht (Tabelle aus dem Heft, S. 27) */
  var START = [
    [2, 2, 2, 2, 2, 2, 2],
    [1, 2, 2, 1, 1, 2, 2],
    [0, 0, 0, 1, 0, 0, 0],
    [0, 1, 1, 1, 0, 1, 0],
    [2, 1, 0, 0, 1, 2, 2],
    [1, 0, 1, 0, 2, 1, 1]
  ];
  var MINCHANGES = 2;   /* per Skript bestätigt: mit 1 Änderung gibt es nie einen Favoriten, mit 2 genau 9 Möglichkeiten (alle für Film 6) */
  var LABEL = ['schlecht', 'mittel', 'gut'];
  var SOLUTION = [[2, 5, 1], [5, 5, 2]];   /* Niklaus bewertet Film 6 mit „mittel“, Rozsa Film 6 mit „gut“ */
  var NEXT = { 2: 1, 1: 0, 0: 2 };         /* Klick: gut -> mittel -> schlecht -> gut */

  var el, api, locked = false, mark = null;
  var grid, cellBtns = [], countEl, noteEl, filmHeads = [];

  function copyStart() { return START.map(function (r) { return r.slice(); }); }
  function changes() {
    var n = 0;
    for (var i = 0; i < PEOPLE.length; i++) for (var j = 0; j < FILMS; j++) if (grid[i][j] !== START[i][j]) n++;
    return n;
  }
  function favourites(g) {
    var f = [];
    for (var j = 0; j < FILMS; j++) {
      var ok = true;
      for (var i = 0; i < g.length; i++) {
        var best = Math.max.apply(null, g[i]);
        if (g[i][j] !== best) { ok = false; break; }
      }
      if (ok) f.push(j);
    }
    return f;
  }

  /* ---------- Smileys ---------- */
  function smiley(v) {
    var fill = v === 2 ? '#2a9a3c' : v === 1 ? '#f4b81c' : '#e5391d';
    var mouth = v === 2 ? 'M11.5 23.5 Q20 31.5 28.5 23.5' : v === 1 ? 'M12 26.5 H28' : 'M11.5 29.5 Q20 21 28.5 29.5';
    return S('svg', { viewBox: '0 0 40 40', class: P + 'face', 'aria-hidden': 'true', focusable: 'false' },
      S('circle', { cx: 20, cy: 20, r: 17, fill: fill, stroke: '#1b1b1b', 'stroke-width': 2.2 }),
      S('circle', { cx: 14.5, cy: 15.5, r: 2, fill: '#1b1b1b' }),
      S('circle', { cx: 25.5, cy: 15.5, r: 2, fill: '#1b1b1b' }),
      S('path', { d: mouth, fill: 'none', stroke: '#1b1b1b', 'stroke-width': 2.4, 'stroke-linecap': 'round' }));
  }

  /* ---------- Anzeige ---------- */
  function cellLabel(i, j) {
    var s = PEOPLE[i] + ', Film ' + (j + 1) + ': ' + LABEL[grid[i][j]];
    if (grid[i][j] !== START[i][j]) s += ' (geändert, vorher ' + LABEL[START[i][j]] + ')';
    return s + (locked ? '' : '. Antippen ändert die Bewertung.');
  }
  function refresh() {
    var fav = (locked || mark) ? favourites(grid) : [];
    for (var i = 0; i < PEOPLE.length; i++) {
      for (var j = 0; j < FILMS; j++) {
        var b = cellBtns[i][j];
        b.replaceChildren(smiley(grid[i][j]));
        b.setAttribute('aria-label', cellLabel(i, j));
        b.setAttribute('aria-disabled', locked ? 'true' : 'false');
        b.classList.toggle('changed', grid[i][j] !== START[i][j]);
        b.classList.toggle('fav', mark && fav.indexOf(j) >= 0);
      }
    }
    filmHeads.forEach(function (fh, j) { fh.classList.toggle('fav', !!mark && fav.indexOf(j) >= 0); });
    var n = changes();
    countEl.textContent = 'Geänderte Bewertungen: ' + n;
    var msg = '';
    if (mark) {
      if (fav.length) msg = 'Film ' + fav.map(function (j) { return j + 1; }).join(' und ') + ' ist jetzt ein Favorit, mit ' + n + (n === 1 ? ' Änderung.' : ' Änderungen.');
      else msg = 'So gibt es noch keinen Favoriten.';
    }
    noteEl.textContent = msg;
  }

  function cycle(i, j) {
    if (locked) return;
    grid[i][j] = NEXT[grid[i][j]];
    refresh();
    api.changed(changes() + (changes() === 1 ? ' Änderung' : ' Änderungen'));
  }
  function onKey(e, i, j) {
    var di = 0, dj = 0;
    if (e.key === 'ArrowLeft') dj = -1; else if (e.key === 'ArrowRight') dj = 1;
    else if (e.key === 'ArrowUp') di = -1; else if (e.key === 'ArrowDown') di = 1;
    else return;
    var ni = i + di, nj = j + dj;
    if (ni < 0 || nj < 0 || ni >= PEOPLE.length || nj >= FILMS) return;
    e.preventDefault();
    cellBtns[ni][nj].focus();
  }

  function reset() { grid = copyStart(); mark = null; }

  Biber.register({
    id: 'filmabend22',
    story:
      '<p>Ein paar Freunde möchten einen Film miteinander anschauen. Zur Auswahl stehen sieben Filme. Um eine Entscheidung zu fällen, bewertet jede Person jeden Film, und zwar mit <b>gut</b> (grüner Smiley), <b>mittel</b> (gelber Smiley) oder <b>schlecht</b> (roter Smiley). Das Ergebnis siehst du unten.</p>' +
      '<p>Leider gibt es keinen Favoriten für den Filmabend. Ein Film ist ein <b>„Favorit“</b>, wenn jede Person diesem Film die eigene beste Bewertung gegeben hat. Film 1 zum Beispiel ist kein Favorit, weil Niklaus seine beste Bewertung einem anderen Film gegeben hat, nämlich Film 4.</p>' +
      '<p>Ada möchte nun so wenige Freunde wie möglich überzeugen, ihre Bewertung zu ändern, damit es doch einen Favoriten gibt. Aber welche?</p>',
    question: 'Hilf Ada und ändere so wenige Bewertungen wie möglich, sodass es einen Favoriten gibt.',
    howto: 'Tippe auf einen Smiley, um die Bewertung zu ändern (gut, mittel, schlecht, dann wieder gut). Geänderte Bewertungen sind markiert und werden gezählt.',
    explanation: function () {
      return '<p>Zu Beginn gibt es keinen Favoriten. Für jeden Film kann man zählen, welche Freunde einen anderen Film besser bewerten: Bei Film 6 sind es nur <strong>Niklaus und Rozsa</strong>, bei allen anderen Filmen mindestens drei. Eine einzige Änderung reicht also nie, aber <strong>zwei Änderungen</strong> genügen: ' +
        'Niklaus bewertet Film 6 besser (zu mittel oder gut) oder Film 4 schlechter (zu schlecht); Rozsa bewertet Film 6 besser (zu gut) oder Film 5 schlechter (zu mittel oder schlecht). Diese Möglichkeiten lassen sich beliebig kombinieren: 3 × 3 = 9 richtige Lösungen.</p>' +
        '<p>Ada geht so vor: Sie bestimmt zuerst für jede Person die beste Bewertung (einmal alle 7 · 6 Einträge ansehen) und vergleicht danach jede Bewertung damit (noch einmal alle Einträge). Das sind bei 7 Filmen und 6 Freunden nur <strong>84 Tabellenzugriffe</strong>. Vergleicht sie dagegen jede Bewertung mit allen anderen Bewertungen derselben Person, sind es 252. Beide Verfahren sind richtig, das erste ist aber <strong>effizienter</strong>, und genau darauf kommt es in der Informatik an.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      cellBtns = []; filmHeads = [];
      var head = [h('div', { class: P + 'corner', 'aria-hidden': 'true' })];
      for (var j = 0; j < FILMS; j++) {
        var fh = h('div', { class: P + 'film', role: 'columnheader', 'aria-label': 'Film ' + (j + 1) }, h('span', null, String(j + 1)));
        filmHeads.push(fh); head.push(fh);
      }
      var rows = [h('div', { class: P + 'row', role: 'row' }, head)];
      PEOPLE.forEach(function (name, i) {
        var cells = [h('div', { class: P + 'who', role: 'rowheader' }, name)];
        cellBtns[i] = [];
        for (var jj = 0; jj < FILMS; jj++) {
          (function (i, j) {
            var b = h('button', { type: 'button', class: P + 'cell', role: 'gridcell',
              onclick: function () { cycle(i, j); }, onkeydown: function (e) { onKey(e, i, j); } });
            cellBtns[i][j] = b; cells.push(b);
          })(i, jj);
        }
        rows.push(h('div', { class: P + 'row', role: 'row' }, cells));
      });
      countEl = h('span', { class: P + 'count', role: 'status', 'aria-live': 'polite' });
      noteEl = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      var back = h('button', { type: 'button', class: 'btn ghost ' + P + 'back', onclick: function () {
        if (locked) return;
        grid = copyStart(); refresh(); api.changed('Zurückgesetzt');
      } }, 'Alle Änderungen zurücknehmen');
      el.replaceChildren(h('div', { class: P + 'board' },
        h('div', { class: P + 'table', role: 'grid', 'aria-label': 'Bewertungen der sechs Freunde für sieben Filme' }, rows),
        h('div', { class: P + 'bar' }, countEl, back),
        noteEl));
      refresh();
    },
    isComplete: function () { return changes() >= 1; },
    evaluate: function () {
      var ok = favourites(grid).length > 0 && changes() <= MINCHANGES;
      return { correct: ok, answer: { grid: grid.map(function (r) { return r.join(''); }) } };
    },
    setAnswer: function (ans) {
      var g = ans && ans.grid;
      var okShape = Array.isArray(g) && g.length === PEOPLE.length && g.every(function (r) { return typeof r === 'string' && r.length === FILMS; });
      grid = okShape ? g.map(function (r) { return r.split('').map(function (c) { return Math.max(0, Math.min(2, parseInt(c, 10) || 0)); }); }) : copyStart();
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
      grid = copyStart();
      SOLUTION.forEach(function (s) { grid[s[0]][s[1]] = s[2]; });
      mark = 'solution'; locked = true;
      refresh();
    }
  });
})();
