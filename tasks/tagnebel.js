/* Aufgabe Tag im Nebel (Klasse 7-8 und 9-10, einfach): Nebel breitet sich aus (Floodfill), welches Haus wird zuletzt bedeckt? */
(function () {
  'use strict';
  var h = Biber.h;

  /* F = Nebel bei Sonnenaufgang, M = Berg, H = Haus, . = freie Region */
  var MAP = [
    'F.MM...F',
    'F..H....',
    '...M.MM.',
    'M.HM.HM.',
    'H...M.M.',
    'M...M..H',
    'FF...M..'
  ];
  var EXAMPLE = ['F....', 'F.MFM', '.H.M.', '..M.H', 'MFF..'];

  /* Ausbreitung des Nebels wie in der Aufgabe: jede Stunde in alle vier Nachbarregionen, außer in Berge */
  function spread(g) {
    var R = g.length, C = g[0].length, dist = [], r, c;
    var front = [];
    for (r = 0; r < R; r++) { dist.push([]); for (c = 0; c < C; c++) dist[r].push(null); }
    for (r = 0; r < R; r++) for (c = 0; c < C; c++) if (g[r][c] === 'F') { dist[r][c] = 0; front.push([r, c]); }
    var t = 0;
    while (front.length) {
      t++;
      var next = [];
      front.forEach(function (p) {
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
          var y = p[0] + d[0], x = p[1] + d[1];
          if (y >= 0 && y < R && x >= 0 && x < C && g[y][x] !== 'M' && dist[y][x] === null) { dist[y][x] = t; next.push([y, x]); }
        });
      });
      front = next;
    }
    return dist;
  }
  var DIST = spread(MAP);
  var MAXD = 0;
  var HOUSES = [];
  MAP.forEach(function (row, r) {
    for (var c = 0; c < row.length; c++) {
      if (DIST[r][c] !== null && DIST[r][c] > MAXD) MAXD = DIST[r][c];
      if (row[c] === 'H') HOUSES.push({ r: r, c: c, t: DIST[r][c] });
    }
  });
  /* Lösung = Haus mit der größten Ankunftszeit (per Skript verifiziert: Zeile 4, Spalte 6, nach 7 Stunden; eindeutig) */
  var LAST = Math.max.apply(null, HOUSES.map(function (x) { return x.t; }));
  var SOLUTIONS = HOUSES.filter(function (x) { return x.t === LAST; });

  /* ---------- Symbole ---------- */
  function svg(inner, cls) {
    return '<svg class="tn-ic ' + (cls || '') + '" viewBox="0 0 40 40" aria-hidden="true" focusable="false">' + inner + '</svg>';
  }
  var IC = {
    F: svg('<path class="tn-cloud" d="M10 27 C4.5 27 3.5 19.5 9 18.5 C9 12 17 10.5 20 15 C23.5 9.5 32 13 30.5 19 C36.5 19 36.5 27 30 27 Z"/>' +
      '<path class="tn-fogline" d="M9 31 H18 M22 31 H31 M13 35 H20 M24 35 H28"/>'),
    M: svg('<path class="tn-mtn" d="M4 34 L16 6 L28 34 Z"/><path class="tn-mtn dark" d="M16 6 L22 20 L19 22 L22 34 L28 34 Z"/>' +
      '<path class="tn-mtn dark" d="M22 34 L29 18 L37 34 Z"/><path class="tn-mtn" d="M29 18 L33 27 L31 28 L33 34 L37 34 Z" style="fill:var(--surface)"/>'),
    H: svg('<rect class="tn-wall" x="9" y="18" width="22" height="16" rx="1"/><rect class="tn-chim" x="25" y="8" width="4" height="8"/>' +
      '<path class="tn-roof" d="M4.5 20 L20 7 L35.5 20 Z"/><path class="tn-door" d="M16 34 V27.5 A4 4 0 0 1 24 27.5 V34 Z"/>')
  };
  var FOG_OVER = svg('<path class="tn-cloud" d="M10 27 C4.5 27 3.5 19.5 9 18.5 C9 12 17 10.5 20 15 C23.5 9.5 32 13 30.5 19 C36.5 19 36.5 27 30 27 Z"/>' +
    '<path class="tn-fogline" d="M9 31 H18 M22 31 H31 M13 35 H20 M24 35 H28"/>', 'tn-over');

  function inline(kind) { return '<span class="tn-inl">' + IC[kind] + '</span>'; }

  function icon(kind) { var s = h('span', { class: 'tn-iw' }); s.innerHTML = IC[kind]; return s; }

  function pos(r, c) { return 'Zeile ' + (r + 1) + ', Spalte ' + (c + 1); }

  /* ---------- Beispiel (statisch) ---------- */
  function exampleGrid(t, label) {
    var d = spread(EXAMPLE);
    var cells = '', fog = [];
    EXAMPLE.forEach(function (row, r) {
      for (var c = 0; c < row.length; c++) {
        var ch = row[c], covered = d[r][c] !== null && d[r][c] <= t, inner = '';
        if (ch === 'M') inner = IC.M;
        else if (ch === 'H') inner = IC.H + (covered ? FOG_OVER : '');
        else if (covered) inner = IC.F;
        if (covered) fog.push('Zeile ' + (r + 1) + ' Spalte ' + (c + 1) + (ch === 'H' ? ' (Haus)' : ''));
        cells += '<span class="tn-cell' + (covered ? ' fog' : '') + '">' + inner + '</span>';
      }
    });
    var alt = label + ': Karte mit 5 Zeilen und 5 Spalten. Berge in Zeile 2 Spalte 3 und 5, Zeile 3 Spalte 4, Zeile 4 Spalte 3, Zeile 5 Spalte 1. Häuser in Zeile 3 Spalte 2 und Zeile 4 Spalte 5. Nebel in: ' + fog.join('; ') + '.';
    return '<figure class="tn-exfig"><div class="tn-grid tn-small" role="img" aria-label="' + alt + '" style="--cols:5">' + cells + '</div>' +
      '<figcaption>' + label + '</figcaption></figure>';
  }

  /* ---------- Zustand ---------- */
  var el, api, locked, choice, mark, board, legend;

  function key(r, c) { return r + ',' + c; }
  function isSolution(r, c) { return SOLUTIONS.some(function (s) { return s.r === r && s.c === c; }); }
  function choiceOk() { return !!choice && isSolution(choice.r, choice.c); }

  function statusText() {
    return choice ? 'Gewählt: Haus in ' + pos(choice.r, choice.c) + '.' : '';
  }

  function render() {
    var annotate = !!mark;
    var cells = [];
    MAP.forEach(function (row, r) {
      for (var c = 0; c < row.length; c++) {
        var ch = row[c], d = DIST[r][c];
        var cls = 'tn-cell', kids = [], label;
        var tint = '';
        if (annotate && ch !== 'M' && d !== null && d > 0) { cls += ' fog'; tint = '--k:' + Math.round(10 + 28 * (MAXD - d) / MAXD) + '%'; }
        if (ch === 'F') { cls += ' fog'; kids.push(icon('F')); label = 'Nebel bei Sonnenaufgang'; }
        if (ch === 'M') { kids.push(icon('M')); label = 'Berg'; }
        if (annotate && ch !== 'M' && d !== null && ch !== 'F') kids.push(h('span', { class: 'tn-hour' }, String(d)));
        if (ch === 'H') {
          var sel = choice && choice.r === r && choice.c === c;
          var right = (mark === 'check' && sel && isSolution(r, c)) || (mark === 'solution' && isSolution(r, c));
          var wrong = mark === 'check' && sel && !isSolution(r, c);
          cls += ' tn-house' + (sel ? ' sel' : '') + (right ? ' right' : '') + (wrong ? ' wrong' : '');
          kids.unshift(icon('H'));
          if (right) kids.push(h('span', { class: 'tn-mark', 'aria-hidden': 'true' }, '✓'));
          if (wrong) kids.push(h('span', { class: 'tn-mark', 'aria-hidden': 'true' }, '✗'));
          label = 'Haus in ' + pos(r, c) + (annotate ? ', vom Nebel bedeckt nach ' + d + ' Stunden' : '');
          var btn = h('button', {
            type: 'button', class: cls, 'data-r': String(r), 'data-c': String(c), style: tint || false,
            'aria-label': label, 'aria-pressed': String(!!sel), disabled: !!locked
          }, kids);
          cells.push(btn);
          continue;
        }
        cells.push(h('div', { class: cls, role: 'img', style: tint || false, 'aria-label': pos(r, c) + ': ' + (label || 'frei') + (annotate && d ? ', Nebel nach ' + d + ' Stunden' : '') }, kids));
      }
    });
    board.replaceChildren.apply(board, cells);
    legend.hidden = !annotate;
  }

  function onClick(e) {
    var b = e.target.closest('button[data-r]');
    if (!b || locked) return;
    var r = +b.dataset.r, c = +b.dataset.c;
    choice = choice && choice.r === r && choice.c === c ? null : { r: r, c: c };
    mark = null;
    render();
    var again = board.querySelector('button[data-r="' + r + '"][data-c="' + c + '"]');
    if (again && !locked) again.focus();
    api.changed(statusText());
  }

  Biber.register({
    id: 'tagnebel',
    story:
      '<p>Im Land der Berge ist heute Nebel ' + inline('F') + ', und der breitet sich mit jeder Stunde weiter aus.</p>' +
      '<p>Bei Sonnenaufgang bedeckt der Nebel nur einige Regionen. In jeweils einer Stunde breitet sich der Nebel von jeder bisherigen Nebelregion in alle ihr benachbarten Regionen aus: nach rechts, links, oben oder unten. ' +
      'Dadurch werden auch Häuser ' + inline('H') + ' vom Nebel bedeckt. Nur in die Bergregionen ' + inline('M') + ' kann der Nebel sich nicht ausbreiten.</p>' +
      '<p>Ein Beispiel:</p>' +
      '<div class="tn-ex">' + exampleGrid(0, 'Sonnenaufgang') + exampleGrid(1, 'Nach 1 Stunde') + exampleGrid(2, 'Nach 2 Stunden') + '</div>',
    question: 'Welches Haus im Land wird als letztes vom Nebel bedeckt?',
    howto: 'Tippe auf das Haus, das als letztes vom Nebel bedeckt wird.',
    explanation: function () {
      var s = SOLUTIONS[0];
      var order = HOUSES.slice().sort(function (a, b) { return a.t - b.t; }).map(function (x) {
        return 'Haus in ' + pos(x.r, x.c) + ': nach ' + x.t + ' Stunden';
      });
      return '<p>Man lässt den Nebel Stunde für Stunde wachsen und schreibt in jede Region, nach wie vielen Stunden er sie erreicht (die Zahlen im Bild). ' +
        'Das Haus in ' + pos(s.r, s.c) + ' wird erst nach ' + s.t + ' Stunden bedeckt, weil der Nebel wegen der Berge einen langen Umweg nehmen muss. Alle anderen Häuser sind früher dran.</p>' +
        '<p class="tn-list">' + order.join('<br>') + '</p>' +
        '<p>Dieses Verfahren, bei dem man von Startpunkten aus Schicht für Schicht alle Nachbarfelder füllt, nennt man Flutfüllung (<em>Floodfill</em>). Es wird zum Beispiel in Zeichenprogrammen für den Farbeimer benutzt.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; choice = null; mark = null;
      board = h('div', { class: 'tn-grid tn-main', role: 'group', 'aria-label': 'Karte vom Land der Berge: 7 Zeilen und 8 Spalten. Wähle ein Haus.', style: '--cols:8' });
      legend = h('p', { class: 'tn-legend', hidden: true },
        'Die Zahl in einer Region zeigt, nach wie vielen Stunden der Nebel sie erreicht.');
      el.replaceChildren(h('div', { class: 'tn-wrap' }, board, legend));
      board.addEventListener('click', onClick);
      render();
    },
    isComplete: function () { return !!choice; },
    evaluate: function () {
      return { correct: choiceOk(), answer: { house: choice ? [choice.r, choice.c] : null } };
    },
    setAnswer: function (ans) {
      var p = ans && ans.house;
      choice = p && p.length === 2 ? { r: p[0], c: p[1] } : null;
      mark = 'check';
      render();
    },
    lock: function (on) { locked = on; mark = on ? 'check' : null; render(); },
    reset: function () { choice = null; mark = null; render(); },
    showSolution: function () {
      var s = SOLUTIONS[0];
      choice = { r: s.r, c: s.c }; locked = true; mark = 'solution'; render();
    }
  });
})();
