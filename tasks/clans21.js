/* Aufgabe Clans von Beavaria (Heft 2021, S. 15; Klasse 11-13 schwer): Clans in möglichst kurzer Zeit verbünden (Huffman-Prinzip) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-clans21-';

  /* Fünf Clans laut Heftbild: Flaggenart und Zahl der Häuser */
  var CLANS = [
    { flag: 'u', n: 3, name: 'blau-weiße Flagge' },
    { flag: 'g', n: 4, name: 'grün-weiße Flagge' },
    { flag: 's', n: 5, name: 'Flagge mit Stern' },
    { flag: 'r', n: 2, name: 'Flagge mit rotem Dreieck' },
    { flag: 'c', n: 1, name: 'Flagge mit gelbem Kreis' }
  ];
  var OPTIONS = [
    { id: 'A', weeks: 15 }, { id: 'B', weeks: 33 }, { id: 'C', weeks: 35 }, { id: 'D', weeks: 50 }, { id: 'E', weeks: 120 }
  ];
  var RIGHT = 'B';   /* Heft S. 16 (33 Wochen); per Skript bestätigt (Huffman-Verfahren und Brute Force über alle Verbündungsreihenfolgen) */

  /* Mindestdauer: immer die zwei kleinsten Clans verbünden */
  function minWeeks(sizes) {
    var a = sizes.slice().sort(function (x, y) { return x - y; }), total = 0;
    while (a.length > 1) {
      var s = a.shift() + a.shift();
      total += s;
      a.push(s); a.sort(function (x, y) { return x - y; });
    }
    return total;
  }
  var BEST = minWeeks(CLANS.map(function (c) { return c.n; }));   /* 33 */

  /* ---------- Zeichnung ---------- */
  function flagInner(f) {
    var base = '<rect x="9" y="1" width="26" height="18" fill="#fff" stroke="#1d2a2e" stroke-width="1.6"/>';
    if (f === 'g') base += '<rect x="9.8" y="1.8" width="24.4" height="7.6" fill="#13903a"/>';
    if (f === 'u') base += '<rect x="9.8" y="9.5" width="24.4" height="8.7" fill="#0b5fae"/>';
    if (f === 'c') base += '<circle cx="22" cy="10" r="5" fill="#ffd21a" stroke="#8a6200" stroke-width="1"/>';
    if (f === 'r') base += '<path d="M12 4 L12 16 L25 10Z" fill="#e0102a" stroke="#7a0a17" stroke-width="1" stroke-linejoin="round"/>';
    if (f === 's') base += '<path d="M22 3.6 L24.1 8.4 L29.3 8.8 L25.3 12.2 L26.6 17.2 L22 14.4 L17.4 17.2 L18.7 12.2 L14.7 8.8 L19.9 8.4Z" fill="#1d2a2e"/>';
    return base;
  }
  function houseSvg(f) {
    var s = Biber.svg('svg', { class: P + 'house', viewBox: '0 0 44 56', 'aria-hidden': 'true', focusable: 'false' });
    s.innerHTML = '<path d="M7 20 V54" stroke="#1d2a2e" stroke-width="1.6"/>' + flagInner(f) +
      '<path d="M10 33 L22 22 L34 33Z" fill="#f5b49c" stroke="#1d2a2e" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M12 33 H32 V54 H12Z" fill="#f0c25a" stroke="#1d2a2e" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M18 54 V43 Q22 38 26 43 V54Z" fill="#1d2a2e"/><path d="M13.5 38 v5 M30.5 38 v5" stroke="#6b7478" stroke-width="3" stroke-linecap="round"/>';
    return s;
  }

  /* ---------- Zustand des Ausprobier-Teils ---------- */
  var el, api, locked, picked, mode, optsEl;
  var board, groups, picks, log, boardEl, logEl, totalEl, btnUndo, btnRestart, hintEl;

  function start() { return CLANS.map(function (c, i) { var hs = []; for (var k = 0; k < c.n; k++) hs.push(c.flag); return { houses: hs, id: i }; }); }
  function total() { return log.reduce(function (s, l) { return s + l.weeks; }, 0); }
  function resetBoard() { groups = start(); picks = []; log = []; }

  function groupLabel(g, i) {
    return 'Clan ' + (i + 1) + ' mit ' + g.houses.length + (g.houses.length === 1 ? ' Haus' : ' Häusern') + (picks.indexOf(i) >= 0 ? ', ausgewählt' : '');
  }
  function renderBoard() {
    boardEl.replaceChildren.apply(boardEl, groups.map(function (g, i) {
      var sel = picks.indexOf(i) >= 0;
      return h('button', {
        type: 'button', class: P + 'clan' + (sel ? ' sel' : ''), 'aria-pressed': String(sel), 'aria-label': groupLabel(g, i) + (groups.length > 1 ? '. Antippen zum Auswählen.' : ''),
        disabled: groups.length < 2, onclick: function () { pick(i); }
      }, h('span', { class: P + 'houses', 'aria-hidden': 'true' }, g.houses.map(function (f) { return houseSvg(f); })),
        h('span', { class: P + 'cnt', 'aria-hidden': 'true' }, String(g.houses.length)));
    }));
    logEl.replaceChildren.apply(logEl, log.map(function (l) {
      return h('li', null, 'Clan mit ' + l.a + ' und Clan mit ' + l.b + ' Häusern: ' + l.weeks + ' Wochen');
    }));
    totalEl.textContent = 'Bisher: ' + total() + ' Wochen';
    btnUndo.disabled = !log.length;
    btnRestart.disabled = !log.length;
    hintEl.textContent = groups.length === 1 ? 'Alle Clans sind verbündet: ' + total() + ' Wochen insgesamt.' :
      picks.length === 1 ? 'Wähle noch einen zweiten Clan zum Verbünden.' : 'Tippe zwei Clans an, um sie zu verbünden.';
  }
  function pick(i) {
    var k = picks.indexOf(i);
    if (k >= 0) picks.splice(k, 1); else picks.push(i);
    if (picks.length === 2) {
      var a = groups[picks[0]], b = groups[picks[1]];
      log.push({ a: a.houses.length, b: b.houses.length, weeks: a.houses.length + b.houses.length, from: [picks[0], picks[1]] });
      var merged = { houses: a.houses.concat(b.houses), id: a.id };
      groups = groups.filter(function (g, j) { return picks.indexOf(j) < 0; });
      groups.push(merged);
      picks = [];
    }
    renderBoard();
  }
  function undo() {
    var n = log.length - 1;
    if (n < 0) return;
    var keep = log.slice(0, n);
    resetBoard();
    keep.forEach(function (l) { groups = merge(groups, l.from); log.push(l); });
    renderBoard();
  }
  function merge(gs, from) {
    var a = gs[from[0]], b = gs[from[1]];
    var out = gs.filter(function (g, j) { return from.indexOf(j) < 0; });
    out.push({ houses: a.houses.concat(b.houses), id: a.id });
    return out;
  }

  /* ---------- Antworten ---------- */
  function optionCard(o) {
    var sel = picked === o.id, cls = P + 'opt', mark = '';
    if (mode) {
      var isRight = o.id === RIGHT;
      if (mode === 'solution' ? isRight : sel) { cls += isRight ? ' right' : ' wrong'; mark = isRight ? '✓' : '✗'; }
    }
    var input = h('input', { type: 'radio', name: P + 'opt', value: o.id, disabled: locked, 'aria-label': 'Antwort ' + o.id + ': ' + o.weeks + ' Wochen' });
    input.checked = sel;
    return h('label', { class: cls }, input,
      h('span', { class: P + 'card' }, h('b', null, o.id + ')'), ' ' + o.weeks + ' Wochen', mark ? h('span', { class: P + 'mark', 'aria-hidden': 'true' }, mark) : null));
  }
  function renderOptions() { optsEl.replaceChildren.apply(optsEl, OPTIONS.map(optionCard)); }
  function onChange(e) {
    if (locked || !e.target.matches('input[type=radio]')) return;
    picked = e.target.value; renderOptions();
    var f = optsEl.querySelector('input:checked'); if (f) f.focus();
    api.changed('Antwort ' + picked + ' gewählt.');
  }

  Biber.register({
    id: 'clans21',
    story: '<p>In Beavaria leben fünf einst verfeindete Clans. Alle Häuser mit gleicher Flagge gehören zu einem Clan. ' +
      'Da die Zeiten lange schon friedlich sind, beschließen die Clans, sich alle nach und nach zu einem Clan zu verbünden. Die Regeln dafür sind:</p>' +
      '<ul><li>Zu jeder Zeit dürfen sich immer nur zwei Clans verbünden.</li>' +
      '<li>In jedem Haus der beiden sich verbündenden Clans wird nacheinander eine Woche lang gefeiert, um den Pakt zu besiegeln. Das Verbünden dauert also so viele Wochen, wie beide Clans zusammen Häuser haben.</li>' +
      '<li>Nach dieser Zeit sind die beiden Clans nur noch ein Clan. Dann kann das Verbünden der Clans fortgesetzt werden.</li></ul>' +
      '<p>Die Clans beschließen, sich in der kürzestmöglichen Zeit zu einem Clan zu verbünden. Das geht nur, wenn man die Reihenfolge des Verbündens sorgfältig plant.</p>',
    question: 'Wie viele Wochen dauert es mindestens, bis alle Clans zu einem verbündet sind?',
    howto: 'Im Feld „Ausprobieren“ kannst du Verbündungen durchspielen: Tippe zwei Clans an, dann zählt die Dauer mit. Wähle unten deine Antwort.',
    explanation: function () {
      return '<p>Die Häuser der zuerst verbündeten Clans feiern bei jedem weiteren Bündnis wieder mit. Deshalb ist es am besten, immer die zwei Clans mit den aktuell wenigsten Häusern zu verbünden. ' +
        'Hier: 1 + 2 = 3 Häuser (3 Wochen), dann 3 + 3 = 6 (6 Wochen), dann 4 + 5 = 9 (9 Wochen) und zuletzt 6 + 9 = 15 (15 Wochen). ' +
        'Zusammen sind das 3 + 6 + 9 + 15 = <b>33 Wochen</b>; schneller geht es nicht. Verbündet man dagegen zuerst die großen Clans (5 + 4, dann 9 + 3, 12 + 2, 14 + 1), dauert es 9 + 12 + 14 + 15 = 50 Wochen.</p>' +
        '<p>Die Verbündung von 4 und 5 ist unabhängig von den anderen; man kann sie auch vor den anderen durchführen, ohne dass es länger dauert.</p>' +
        '<p><b>Informatik:</b> Das ist ein <i>Greedy-Verfahren</i> („gierig“): In jedem Schritt nimmt man die lokal beste Wahl. Genauso arbeitet das Huffman-Verfahren, das Daten verlustfrei verkleinert: Die seltensten Zeichen werden zuerst zusammengefasst.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null;
      resetBoard();
      boardEl = h('div', { class: P + 'board' });
      logEl = h('ol', { class: P + 'log', 'aria-label': 'Bisherige Verbündungen' });
      totalEl = h('span', { class: P + 'total', 'aria-live': 'polite' });
      hintEl = h('p', { class: P + 'hint', 'aria-live': 'polite' });
      btnUndo = h('button', { type: 'button', class: 'btn ghost', onclick: undo }, 'Schritt zurück');
      btnRestart = h('button', { type: 'button', class: 'btn ghost', onclick: function () { resetBoard(); renderBoard(); } }, 'Von vorn');
      optsEl = h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Mindestdauer in Wochen' });
      optsEl.addEventListener('change', onChange);
      el.replaceChildren(h('div', { class: P + 'wrap' },
        h('section', { 'aria-label': 'Ausprobieren' }, h('h3', null, 'Ausprobieren'), boardEl, hintEl,
          h('div', { class: P + 'ctl' }, totalEl, btnUndo, btnRestart), logEl),
        h('section', { 'aria-label': 'Antworten' }, h('h3', null, 'Deine Antwort'), optsEl)));
      renderBoard(); renderOptions();
    },
    isComplete: function () { return !!picked; },
    evaluate: function () { return { correct: picked === RIGHT, answer: picked }; },
    setAnswer: function (ans) { picked = ans || null; mode = 'check'; renderOptions(); },
    lock: function (on) { locked = on; mode = on ? (mode || 'check') : null; renderOptions(); },
    reset: function () { picked = null; mode = null; renderOptions(); },
    showSolution: function () { picked = RIGHT; mode = 'solution'; locked = true; renderOptions(); }
  });
})();
