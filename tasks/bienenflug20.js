/* Aufgabe Bienenflug (Biber 2020; Klasse 3-4 leicht): Welche Blumen sind höchstens 3 Felder (links/rechts/oben/unten) vom Bienenstock entfernt? */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-bienenflug20-';

  var COLS = 6, ROWS = 4, REACH = 3;
  var HIVE = { r: 1, c: 3 };   /* Lösungsbild im Heft: Zahlenreihen 3-2-1-[Stock]-1-2 und 1-2-3 */
  /* Blumen im Heft (Zeile, Spalte) */
  var FLOWERS = [[0, 0], [0, 5], [1, 0], [1, 5], [2, 0], [2, 1], [2, 5], [3, 1], [3, 2], [3, 4], [3, 5]];
  function idx(r, c) { return r * COLS + c; }

  /* Abstände per Breitensuche vom Bienenstock (nur links/rechts/oben/unten) */
  var DIST = (function () {
    var d = [], i;
    for (i = 0; i < ROWS * COLS; i++) d.push(-1);
    d[idx(HIVE.r, HIVE.c)] = 0;
    var q = [[HIVE.r, HIVE.c]];
    while (q.length) {
      var p = q.shift();
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (s) {
        var r = p[0] + s[0], c = p[1] + s[1];
        if (r < 0 || c < 0 || r >= ROWS || c >= COLS || d[idx(r, c)] >= 0) return;
        d[idx(r, c)] = d[idx(p[0], p[1])] + 1;
        q.push([r, c]);
      });
    }
    return d;
  })();
  var RIGHT = FLOWERS.map(function (f) { return idx(f[0], f[1]); }).filter(function (i) { return DIST[i] <= REACH; });   /* 7 Blumen */

  function flowerSvg() {
    var petals = '';
    for (var k = 0; k < 8; k++) petals += '<circle cx="' + (50 + 26 * Math.cos(k * Math.PI / 4)).toFixed(1) + '" cy="' + (50 + 26 * Math.sin(k * Math.PI / 4)).toFixed(1) + '" r="17"/>';
    return '<svg class="' + P + 'fl" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><g class="' + P + 'petals">' + petals + '</g><circle class="' + P + 'core" cx="50" cy="50" r="14"/><circle class="' + P + 'pip" cx="50" cy="50" r="6"/></svg>';
  }
  function hiveSvg() {
    return '<svg class="' + P + 'hive" viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
      '<path class="' + P + 'hv1" d="M16 88 V52 Q16 14 52 14 Q88 14 88 52 V88 Z"/>' +
      '<path class="' + P + 'hv2" d="M60 15 Q88 20 88 52 V88 H64 V30 Z"/>' +
      '<path class="' + P + 'band" d="M17 40 H87 M16 56 H88 M16 72 H88"/>' +
      '<path class="' + P + 'door" d="M34 88 V72 Q34 60 45 60 Q56 60 56 72 V88 Z"/></svg>';
  }

  var el, api, sel, locked, markMode, cells;

  function reset() { sel = []; }
  function has(i) { return sel.indexOf(i) >= 0; }
  function isRightSet() { return sel.length === RIGHT.length && RIGHT.every(has); }
  function statusText() {
    return sel.length === 0 ? '' : sel.length + (sel.length === 1 ? ' Blume ausgewählt.' : ' Blumen ausgewählt.');
  }
  function toggle(i) {
    if (locked) return;
    if (has(i)) sel.splice(sel.indexOf(i), 1); else sel.push(i);
    sel.sort(function (a, b) { return a - b; });
    render();
    var b = el.querySelector('[data-cell="' + i + '"]');
    if (b) b.focus();
    api.changed(statusText());
  }

  function render() {
    var out = [];
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      var i = idx(r, c), d = DIST[i];
      var isFlower = FLOWERS.some(function (f) { return f[0] === r && f[1] === c; });
      var showNum = markMode && d > 0 && d <= REACH;
      if (r === HIVE.r && c === HIVE.c) {
        out.push(h('div', { class: P + 'cell ' + P + 'hivecell', role: 'img', 'aria-label': 'Bienenstock' }));
        out[out.length - 1].innerHTML = hiveSvg();
        continue;
      }
      if (!isFlower) {
        out.push(h('div', { class: P + 'cell', 'aria-hidden': 'true' }, showNum ? h('span', { class: P + 'num' }, String(d)) : null));
        continue;
      }
      var on = has(i), good = RIGHT.indexOf(i) >= 0;
      var cls = P + 'cell ' + P + 'flower' + (on ? ' sel' : '');
      var mk = null;
      if (markMode === 'check') {
        if (on && good) { cls += ' right'; mk = '✓'; }
        else if (on && !good) { cls += ' wrong'; mk = '✗'; }
        else if (!on && good) cls += ' missed';
      } else if (markMode === 'solution' && good) cls += ' right';
      var label = 'Blume in Zeile ' + (r + 1) + ', Spalte ' + (c + 1) + (on ? ', ausgewählt' : ', nicht ausgewählt') +
        (markMode ? (good ? ', erreichbar (' + d + ' Felder)' : ', nicht erreichbar (' + d + ' Felder)') : '');
      var b = h('button', { type: 'button', class: cls, 'data-cell': String(i), role: 'checkbox', 'aria-checked': String(on), 'aria-label': label, disabled: locked, onclick: function (ii) { return function () { toggle(ii); }; }(i) });
      b.innerHTML = flowerSvg();
      if (markMode && d > 0) b.appendChild(h('span', { class: P + 'num ' + P + 'fnum', 'aria-hidden': 'true' }, String(d)));
      if (mk) b.appendChild(h('span', { class: P + 'mark', 'aria-hidden': 'true' }, mk));
      out.push(b);
    }
    cells = out;
    el.replaceChildren(h('div', { class: P + 'board' },
      h('div', { class: P + 'grid', role: 'group', 'aria-label': 'Wiese mit Bienenstock und Blumen, 4 Zeilen und 6 Spalten' }, out),
      h('p', { class: P + 'hint' }, markMode ? 'Die Zahlen zeigen, wie viele Felder die Bienen vom Bienenstock aus fliegen müssen.' : 'Tippe auf die Blumen, zu denen die Bienen fliegen können.')));
  }

  Biber.register({
    id: 'bienenflug20',
    story:
      '<p>Vom Bienenstock aus können die Bienen <strong>drei Felder</strong> weit fliegen. Von einem Feld zum nächsten fliegen sie nach <strong>links, rechts, oben oder unten</strong> (nicht schräg).</p>',
    question: 'Zu welchen Blumen können die Bienen vom Bienenstock aus fliegen?',
    howto: 'Tippe auf die Blumen, die die Bienen erreichen können. Tippe noch einmal, um eine Auswahl zurückzunehmen.',
    explanation: function () {
      return '<p>Zähle von Feld zu Feld vom Bienenstock aus: Erst alle Felder mit Abstand 1, dann die Nachbarn davon mit Abstand 2, dann mit Abstand 3. ' +
        'Die <strong>7 Blumen</strong> mit einer Zahl von 1 bis 3 sind erreichbar. Die anderen vier Blumen (links oben, links in der dritten Zeile, in der untersten Zeile die zweite von links und ganz rechts) sind 4 Felder entfernt, und so weit fliegen die Bienen nicht.</p>' +
        '<p>Man muss nicht immer wieder beim Bienenstock anfangen: Die Felder mit Abstand 2 findet man mithilfe der Felder mit Abstand 1, die mit Abstand 3 mithilfe derer mit Abstand 2. ' +
        'Ein Verfahren, das neue Ergebnisse aus schon gefundenen berechnet, nennt man in der Informatik „Dynamische Programmierung“. Man nutzt sie zum Beispiel, um kürzeste Wege zu finden.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; markMode = null; reset();
      render();
    },
    isComplete: function () { return sel.length > 0; },
    evaluate: function () { return { correct: isRightSet(), answer: sel.slice() }; },
    setAnswer: function (ans) { sel = ans.slice(); markMode = 'check'; locked = true; render(); },
    lock: function (on) {
      locked = on; markMode = on ? 'check' : null;
      render();
    },
    reset: function () { reset(); markMode = null; render(); },
    showSolution: function () { sel = RIGHT.slice(); locked = true; markMode = 'solution'; render(); }
  });
})();
