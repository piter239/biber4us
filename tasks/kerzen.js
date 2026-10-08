/* Aufgabe Brennende Kerzen (Klasse 7-8 schwer, 9-10 mittel, 11-13 einfach): jede Kerze gleich oft anzünden */
(function () {
  'use strict';
  var h = Biber.h;

  var N = 5;                 /* 5 Kerzen, 5 Sonntage; am 5. Sonntag brennen alle (vorgegeben) */
  var FREE = N - 1;          /* Sonntage 1 bis 4 sind frei wählbar: am k-ten Sonntag brennen k Kerzen */
  var TARGET = N * (N + 1) / 2 / N;   /* jede Kerze insgesamt gleich oft: 15 / 5 = 3 */

  /* Eine gültige Lösung (am k-ten Sonntag brennen die Kerzen der Zeile k; Spalten = Kerzen 1 bis 5). Per Brute Force geprüft: es gibt 110 gültige. */
  var SOLUTION = [
    [1, 0, 0, 0, 0],
    [0, 1, 1, 0, 0],
    [1, 0, 0, 1, 1],
    [0, 1, 1, 1, 1]
  ];

  /* ---------- Kerze als SVG ---------- */
  function candleSvg(lit, cls) {
    return '<svg class="kz-candle' + (cls ? ' ' + cls : '') + '" viewBox="0 0 40 60" focusable="false" aria-hidden="true">' +
      (lit ? '<g class="kz-rays"><path d="M7 17l5 3M33 17l-5 3M5 27l5 0M35 27l-5 0M20 1v5M10 8l3 4M30 8l-3 4"/></g>' +
        '<path class="kz-flame" d="M20 8c5 6 8 10 8 15a8 8 0 0 1-16 0c0-4 3-7 4-10 2 2 3 3 3 5 1-3 1-6 1-10z"/>' +
        '<path class="kz-flame2" d="M20 17c3 3 4 5 4 7a4 4 0 0 1-8 0c0-2 2-3 2-5l2 0z"/>' : '') +
      '<path class="kz-wick" d="M20 32v-6"/>' +
      '<path class="kz-body" d="M9 36c0-3 4-4 11-4s11 1 11 4v18c0 3-4 4-11 4S9 57 9 54z"/>' +
      '<path class="kz-drip" d="M12 38c0 4 0 7 2 9M27 37c0 5 0 9-2 11M20 40v6"/>' +
      '</svg>';
  }

  function sundayLabel(i) { return (i + 1) + '. Sonntag'; }

  /* Beispiel mit 3 Sonntagen aus dem Heft (statische Abbildung) */
  var EX3 = [[1, 0, 0], [0, 1, 1], [1, 1, 1]];
  function staticRows(rows) {
    return '<div class="kz-ex" role="img" aria-label="Beispiel mit drei Sonntagen: am 1. Sonntag brennt die erste Kerze, am 2. Sonntag die zweite und dritte, am 3. Sonntag alle drei. Jede Kerze brennt genau zweimal.">' +
      rows.map(function (r, i) {
        return '<div class="kz-exrow" aria-hidden="true"><span class="kz-exlab">' + sundayLabel(i) + '</span>' +
          r.map(function (v) { return candleSvg(v, 'kz-small'); }).join('') + '</div>';
      }).join('') + '</div>';
  }

  var el, api, locked;
  var lit;            /* lit[r][c]: 1 = Kerze brennt am (r+1). Sonntag */
  var mode;           /* null | 'check' | 'solution' */

  function emptyState() {
    var a = [];
    for (var r = 0; r < FREE; r++) a.push(new Array(N).fill(0));
    return a;
  }
  function rowCount(r) { return lit[r].reduce(function (s, v) { return s + v; }, 0); }
  function colSums() {
    var s = [];
    for (var c = 0; c < N; c++) {
      var t = 1;                                 /* 5. Sonntag */
      for (var r = 0; r < FREE; r++) t += lit[r][c];
      s.push(t);
    }
    return s;
  }
  function rowsOk() {
    for (var r = 0; r < FREE; r++) if (rowCount(r) !== r + 1) return false;
    return true;
  }
  function isCorrect() {
    return rowsOk() && colSums().every(function (t) { return t === TARGET; });
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  function statusText() {
    for (var r = 0; r < FREE; r++) {
      var d = (r + 1) - rowCount(r);
      if (d > 0) return 'Am ' + sundayLabel(r) + ' müssen noch ' + plural(d, 'Kerze', 'Kerzen') + ' brennen.';
      if (d < 0) return 'Am ' + sundayLabel(r) + ' brennen ' + plural(-d, 'Kerze', 'Kerzen') + ' zu viel.';
    }
    return '';
  }

  function render() {
    var sums = colSums();
    var rows = [];
    for (var r = 0; r < N; r++) {
      var fixed = r === FREE;
      var cells = [];
      for (var c = 0; c < N; c++) {
        var on = fixed ? 1 : lit[r][c];
        var lab = sundayLabel(r) + ', Kerze ' + (c + 1) + ': ' + (on ? 'brennt' : 'brennt nicht') + (fixed ? ' (vorgegeben)' : '');
        if (fixed) {
          cells.push(h('div', { class: 'kz-cell kz-fixed', role: 'img', 'aria-label': lab, 'data-r': r, 'data-c': c }, null));
          cells[cells.length - 1].innerHTML = candleSvg(1);
        } else {
          var b = h('button', {
            type: 'button', class: 'kz-cell' + (on ? ' on' : ''), 'data-r': r, 'data-c': c,
            'aria-pressed': String(!!on), 'aria-label': lab, disabled: locked
          });
          b.innerHTML = candleSvg(on);
          cells.push(b);
        }
      }
      var cnt = fixed ? N : rowCount(r);
      var need = fixed ? N : r + 1;
      var cc = 'kz-cnt' + (cnt === need ? ' fit' : (mode ? ' off' : (cnt > need ? ' over' : '')));
      rows.push(h('div', { class: 'kz-row' + (fixed ? ' fixedrow' : '') },
        h('div', { class: 'kz-lab' }, h('strong', null, sundayLabel(r)),
          h('span', { class: cc, 'aria-label': plural(cnt, 'Kerze', 'Kerzen') + ' von ' + need + ' brennen' }, cnt + ' von ' + need)),
        h('div', { class: 'kz-cells' }, cells)));
    }
    var sumCells = sums.map(function (t, c) {
      var cls = 'kz-sum';
      if (mode) cls += t === TARGET ? ' ok' : ' bad';
      return h('span', { class: cls, 'aria-label': 'Kerze ' + (c + 1) + ' wurde insgesamt ' + t + ' Mal angezündet' }, String(t));
    });
    var sumRow = h('div', { class: 'kz-row kz-sumrow' },
      h('div', { class: 'kz-lab' }, h('strong', null, 'Summe'), h('span', { class: 'kz-cnt kz-hint' }, 'angezündet')),
      h('div', { class: 'kz-cells' }, sumCells));
    el.replaceChildren(h('div', { class: 'kz-board' },
      h('div', { class: 'kz-grid', role: 'group', 'aria-label': 'Fünf Kerzen an fünf Sonntagen' }, rows),
      h('div', { class: 'kz-grid kz-sums', role: 'group', 'aria-label': 'Wie oft jede Kerze insgesamt angezündet wurde' }, sumRow)));
  }

  function onClick(e) {
    var b = e.target.closest('button[data-r]');
    if (!b || locked) return;
    var r = +b.dataset.r, c = +b.dataset.c;
    lit[r][c] = lit[r][c] ? 0 : 1;
    render();
    var again = el.querySelector('button[data-r="' + r + '"][data-c="' + c + '"]');
    if (again) again.focus();
    api.changed(statusText());
  }

  Biber.register({
    id: 'kerzen',
    story:
      '<p>Es gibt eine Tradition, an den vier Sonntagen vor Weihnachten Kerzen anzuzünden: 1 Kerze am ersten Sonntag, 2 Kerzen am zweiten Sonntag und so weiter.</p>' +
      '<p>Chris liebt diese Tradition. Alle seine Kerzen sind gleich lang. Chris’ Weihnachtsfest wäre wunderschön, wenn auch nach dem letzten Sonntag alle Kerzen noch gleich lang wären. Dafür müsste er jede Kerze insgesamt gleich oft anzünden.</p>' +
      '<p>Leider findet Chris keine Möglichkeit, ein wunderschönes Weihnachtsfest zu haben.</p>' +
      '<p>Wenn die Tradition nur drei Sonntage (und Kerzen) umfassen würde, wäre es möglich. Dann würde Chris jede Kerze genau zweimal anzünden:</p>' +
      staticRows(EX3) +
      '<p>Auch mit fünf Sonntagen (und Kerzen) wäre es möglich.</p>',
    question: 'Zeige Chris, wie er jede Kerze gleich oft anzünden kann.',
    howto: 'Für den fünften Sonntag sind die Kerzen bereits angezündet. Tippe in den Zeilen 1 bis 4 auf Kerzen, um sie anzuzünden oder wieder zu löschen. Am k-ten Sonntag müssen genau k Kerzen brennen.',
    explanation: function () {
      return '<p>An den fünf Sonntagen wird zusammen 1 + 2 + 3 + 4 + 5 = 15 Mal eine Kerze angezündet. Bei fünf Kerzen bekommt jede Kerze dann 15 : 5 = 3 Anzündungen. Weil der fünfte Sonntag schon eine Anzündung liefert, muss jede Kerze an den Sonntagen 1 bis 4 genau zweimal brennen, zusammen also 10 Mal.</p>' +
        '<p>Eine mögliche Lösung: am 1. Sonntag Kerze 1, am 2. Sonntag Kerzen 2 und 3, am 3. Sonntag Kerzen 1, 4 und 5, am 4. Sonntag Kerzen 2, 3, 4 und 5. Es gibt noch weitere (insgesamt 110 Möglichkeiten, die ein Programm durch Ausprobieren findet).</p>' +
        '<p>Bei vier Sonntagen geht es nicht: 1 + 2 + 3 + 4 = 10 Anzündungen lassen sich nicht gleichmäßig auf vier Kerzen verteilen. Allgemein klappt es nur, wenn n(n + 1)/2 durch n teilbar ist, also wenn die Zahl der Kerzen ungerade ist. Eine solche Überlegung zeigt vorab, ob eine Lösung überhaupt möglich ist.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; mode = null; lit = emptyState();
      el.addEventListener('click', onClick);
      render();
    },
    isComplete: function () { return rowsOk(); },
    evaluate: function () {
      return { correct: isCorrect(), answer: lit.map(function (r) { return r.slice(); }) };
    },
    setAnswer: function (ans) {
      lit = emptyState();
      for (var r = 0; r < FREE; r++) for (var c = 0; c < N; c++) lit[r][c] = ans && ans[r] && ans[r][c] ? 1 : 0;
      mode = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mode = on ? 'check' : null;
      render();
    },
    reset: function () { lit = emptyState(); mode = null; render(); },
    showSolution: function () {
      lit = SOLUTION.map(function (r) { return r.slice(); });
      locked = true;
      mode = 'solution';
      render();
    }
  });
})();
