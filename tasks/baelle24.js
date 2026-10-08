/* Aufgabe Bälle (Biber 2024; Klasse 9-10 schwer, 11-13 mittel): Bälle-Folge aus Emils 0/1-Beschreibung rekonstruieren */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-baelle24-';

  var TARGET = [0, 1, 1, 1, 0, 1, 0, 0];
  var SOLUTION = 'brrbbbrr';   /* b = blau, r = rot; offizielle Lösung (Heft S. 7); per Skript: genau eine Folge passt */
  var N = TARGET.length;
  var NAME = { b: 'blau', r: 'rot' };

  /* Emils Beschreibung: je Position Anzahl blauer Bälle rechts (inklusive), dann gerade -> 0, ungerade -> 1 */
  function describe(balls) {
    var out = [], cnt = 0, i;
    for (i = N - 1; i >= 0; i--) {
      if (balls[i] === 'b') cnt++;
      out[i] = cnt % 2;
    }
    return out;
  }
  function known(balls, i) {   /* Wert an Stelle i ist nur bekannt, wenn alle Bälle ab i nach rechts gelegt sind */
    for (var k = i; k < N; k++) if (!balls[k]) return false;
    return true;
  }
  function ballSvg(c) {
    return '<span class="' + P + 'ball ' + P + c + '" role="img" aria-label="' + NAME[c] + 'er Ball"></span>';
  }

  var el, api, balls, locked, mark;
  var slotBtns, descCells;

  function reset() { balls = []; for (var i = 0; i < N; i++) balls.push(null); mark = null; }

  function refresh() {
    var d = describe(balls);
    slotBtns.forEach(function (btn, i) {
      var b = balls[i];
      btn.className = P + 'slot' + (b ? ' ' + P + 'has' : '');
      btn.innerHTML = b ? '<span class="' + P + 'ball ' + P + b + '" aria-hidden="true"></span>' : '<span class="' + P + 'empty" aria-hidden="true">?</span>';
      btn.setAttribute('aria-label', 'Stelle ' + (i + 1) + ' von links, Emil schreibt ' + TARGET[i] + ': ' + (b ? NAME[b] : 'noch leer') + '. Antippen wechselt die Farbe.');
      btn.disabled = locked;
      var shown = known(balls, i);
      var txt = shown ? String(d[i]) : '–';
      descCells[i].textContent = txt;
      var bad = mark === 'check' && shown && d[i] !== TARGET[i];
      var good = mark !== null && shown && d[i] === TARGET[i];
      descCells[i].classList.toggle('right', good);
      descCells[i].classList.toggle('wrong', bad);
      btn.classList.toggle('right', good);
      btn.classList.toggle('wrong', bad);
    });
  }

  function setBall(i, v) {
    if (locked) return;
    balls[i] = v;
    refresh();
    api.changed();
  }
  function cycle(i) {
    var cur = balls[i];
    setBall(i, cur === null ? 'b' : cur === 'b' ? 'r' : null);
  }
  function onKey(e) {
    var i = slotBtns.indexOf(e.currentTarget), k = e.key, to = null;
    if (k === 'ArrowRight') to = Math.min(N - 1, i + 1);
    else if (k === 'ArrowLeft') to = Math.max(0, i - 1);
    else if (k === 'b' || k === 'B') { e.preventDefault(); setBall(i, 'b'); return; }
    else if (k === 'r' || k === 'R') { e.preventDefault(); setBall(i, 'r'); return; }
    else if (k === 'Backspace' || k === 'Delete') { e.preventDefault(); setBall(i, null); return; }
    if (to !== null) { e.preventDefault(); slotBtns[to].focus(); }
  }

  Biber.register({
    id: 'baelle24',
    story:
      '<p>Emil beschreibt Folgen von blauen und roten Bällen nur mit 0en und 1en. Das macht er auf ganz besondere Weise. Ein Beispiel:</p>' +
      '<p class="' + P + 'ex">' + 'rbbrrb'.split('').map(ballSvg).join('') + '</p>' +
      '<p>Im ersten Schritt zählt Emil für jeden Ball, wie viele <strong>blaue</strong> Bälle sich rechts davon befinden, und zählt den Ball selbst mit, wenn er blau ist. Diese Anzahlen schreibt er als Zwischenfolge auf: <code>3, 3, 2, 1, 1, 1</code></p>' +
      '<p>Im zweiten Schritt formt er die Zwischenfolge so um: Wenn die Zahl <strong>gerade</strong> ist, wird sie zu <code>0</code>, wenn sie <strong>ungerade</strong> ist, zu <code>1</code>. (0 gilt als gerade Zahl.) Emil beschreibt die obige Bälle-Folge also so: <code>1, 1, 0, 1, 1, 1</code></p>' +
      '<p>Eine andere Bälle-Folge beschreibt Emil so: <code>0, 1, 1, 1, 0, 1, 0, 0</code></p>',
    question: 'Erstelle diese Bälle-Folge!',
    howto: 'Tippe auf ein Feld, um die Farbe zu wechseln: leer, blau, rot, leer … Mit der Tastatur: B für blau, R für rot, Entf zum Leeren. Unter den Bällen siehst du Emils Beschreibung deiner Folge, sobald alle Bälle rechts davon liegen.',
    explanation: function () {
      var html = '<p>Gehe die Beschreibung von rechts nach links durch. Ganz rechts steht 0: Dort ist rechts noch kein blauer Ball, die Anzahl 0 ist gerade, also muss der Ball <strong>rot</strong> sein. ' +
        'Allgemein gilt: Ändert sich die Ziffer beim Schritt nach links (von 0 auf 1 oder von 1 auf 0), dann muss der Ball <strong>blau</strong> sein, denn nur ein blauer Ball ändert, ob die Anzahl gerade oder ungerade ist. Bleibt die Ziffer gleich, ist der Ball <strong>rot</strong>.</p>' +
        '<p>So entsteht Schritt für Schritt die Folge <strong>blau, rot, rot, blau, blau, blau, rot, rot</strong>. Die Zwischenfolge dazu ist 4, 3, 3, 3, 2, 1, 0, 0.</p>' +
        '<p>Emil kodiert die Folge so, dass man sie aus der Beschreibung wieder eindeutig herstellen kann. Das ist das Wesen einer verlustfreien Kodierung (Kompression): Die Information geht nicht verloren, auch wenn sie in anderer Form gespeichert ist.</p>';
      return html;
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      slotBtns = []; descCells = [];
      var targetRow = h('div', { class: P + 'row ' + P + 'target', role: 'group', 'aria-label': 'Emils Beschreibung: ' + TARGET.join(', ') });
      var ballRow = h('div', { class: P + 'row ' + P + 'balls', role: 'group', 'aria-label': 'Deine Bälle-Folge' });
      var descRow = h('div', { class: P + 'row ' + P + 'mine', role: 'group', 'aria-label': 'Emils Beschreibung deiner Folge' });
      TARGET.forEach(function (t, i) {
        var tc = h('div', { class: P + 'num' }, String(t));
        var btn = h('button', { type: 'button', onclick: function () { cycle(i); }, onkeydown: onKey });
        var dc = h('div', { class: P + 'num ' + P + 'dnum', 'aria-live': 'off' }, '–');
        slotBtns.push(btn); descCells.push(dc);
        targetRow.appendChild(tc); ballRow.appendChild(btn); descRow.appendChild(dc);
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('div', { class: P + 'rowlabel' }, 'Emils Beschreibung (gegeben)'), targetRow,
        h('div', { class: P + 'rowlabel' }, 'Deine Bälle-Folge'), ballRow,
        h('div', { class: P + 'rowlabel' }, 'Emils Beschreibung deiner Folge'), descRow));
      refresh();
    },
    isComplete: function () { return balls.every(Boolean); },
    evaluate: function () {
      var s = balls.join('');
      return { correct: s === SOLUTION, answer: { balls: s } };
    },
    setAnswer: function (ans) {
      var s = ans && typeof ans.balls === 'string' ? ans.balls : '';
      balls = [];
      for (var i = 0; i < N; i++) balls.push(s[i] === 'b' || s[i] === 'r' ? s[i] : null);
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      refresh();
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () { balls = SOLUTION.split(''); mark = 'solution'; locked = true; refresh(); }
  });
})();
