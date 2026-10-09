/* Aufgabe Endstand (Biber 2022; Klasse 7-8 schwer, 9-10 mittel, 11-13 einfach): welcher Tic-Tac-Toe-Spielstand kann ein Endstand sein? */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-endstand22-';

  /* Spielstände zeilenweise von oben links; X, O oder . (leer). Aus dem Heft (S. 23) übernommen. */
  var OPTIONS = [
    { key: 'A', board: 'XOXOXOOOX' },
    { key: 'B', board: 'XOXOX.OXX' },
    { key: 'C', board: 'XXO.OXOOX' },
    { key: 'D', board: 'XOXOXOOX.' }
  ];
  var RIGHT = 2;   /* C: laut Heft; zusätzlich per Skript geprüft (alle 958 über das Spiel erreichbaren Endstände aufgezählt: nur C ist darunter) */

  /* Beispielverlauf aus dem Heft: nach 1, 2, 3, 4 Zügen und nach dem letzten (7.) Zug */
  var STEPS = [
    { board: '..X......', cap: 'nach 1 Zug' },
    { board: 'O.X......', cap: 'nach 2 Zügen' },
    { board: 'O.X...X..', cap: 'nach 3 Zügen' },
    { board: 'O.X.O.X..', cap: 'nach 4 Zügen' },
    { board: 'O.X.OOXXX', cap: 'nach dem letzten Zug (7)', end: true }
  ];

  var NAMES = { X: 'X', O: 'O', '.': 'leer' };
  var ROWN = ['oben', 'Mitte', 'unten'], COLN = ['links', 'Mitte', 'rechts'];
  function describe(board) {
    var out = [];
    for (var r = 0; r < 3; r++) {
      var cells = [];
      for (var c = 0; c < 3; c++) cells.push(NAMES[board[r * 3 + c]]);
      out.push('Zeile ' + (r + 1) + ': ' + cells.join(', '));
    }
    return out.join('; ');
  }

  /* Brett als SVG (Zettel bleibt in Hell und Dunkel hell, damit die Zeichen lesbar sind) */
  function boardSvg(board, label, small) {
    var s = '<svg class="' + P + 'svg" viewBox="0 0 120 120" role="img" aria-label="' + label + '">' +
      '<rect class="' + P + 'paper" x="4" y="4" width="112" height="112" rx="5"/>' +
      '<path class="' + P + 'grid" d="M47 16V104M73 16V104M22 41H98M22 67H98"/>';
    for (var i = 0; i < 9; i++) {
      var ch = board[i];
      if (ch === '.') continue;
      var cx = 34 + (i % 3) * 26, cy = 28 + Math.floor(i / 3) * 26;
      if (ch === 'X') s += '<path class="' + P + 'x" d="M' + (cx - 8) + ' ' + (cy - 8) + 'L' + (cx + 8) + ' ' + (cy + 8) + 'M' + (cx + 8) + ' ' + (cy - 8) + 'L' + (cx - 8) + ' ' + (cy + 8) + '"/>';
      else s += '<circle class="' + P + 'o" cx="' + cx + '" cy="' + cy + '" r="9"/>';
    }
    return s + '</svg>';
  }

  var el, api, radios, selected, locked, mark;

  function reset() { selected = null; mark = null; }

  function choose(i, focus) {
    if (locked) return;
    selected = i;
    refresh();
    if (focus) radios[i].focus();
    api.changed();
  }
  function refresh() {
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
  function onKey(e) {
    var k = e.key, i = radios.indexOf(e.currentTarget), to = null;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % radios.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + radios.length - 1) % radios.length;
    else if (k === ' ' || k === 'Enter') { e.preventDefault(); choose(i, true); return; }
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }

  Biber.register({
    id: 'endstand22',
    story:
      '<p>Tic-Tac-Toe ist ein Spiel für zwei Personen. In ein Raster mit 3 × 3 Feldern setzen die Spieler abwechselnd je ein Zeichen in ein freies Feld: immer zuerst der eine Spieler ein <strong>X</strong>, der andere ein <strong>O</strong>.</p>' +
      '<p>Wer zuerst drei gleiche Zeichen in eine Zeile, Spalte oder Diagonale setzen kann, gewinnt; dann ist das Spiel beendet. Wenn alle Felder besetzt sind und niemand gewonnen hat, endet das Spiel unentschieden.</p>' +
      '<p>Unten siehst du die Spielstände aus einem möglichen Spielverlauf: nach den ersten vier Spielzügen und nach dem letzten Zug. Der Spieler mit X gewinnt.</p>' +
      '<p>Den Spielstand am Ende eines Spiels nennen wir <em>Endstand</em>. Die Spielregeln legen genau fest, wie ein Endstand aussehen kann.</p>',
    question: 'Nur eines der vier Bilder zeigt einen Endstand von Tic-Tac-Toe. Welches?',
    howto: 'Tippe auf das Bild, das du für einen Endstand hältst.',
    explanation: function () {
      return '<p><strong>C</strong> ist ein Endstand: Beide Spieler haben vier Zeichen gesetzt. Der zweite Spieler hat mit seinem vierten O drei gleiche Zeichen in einer Diagonale und damit gewonnen. Das Spiel war beendet, es wurde nichts mehr gesetzt.</p>' +
        '<p><strong>A</strong> ist keiner: X hat gewonnen, aber O hat danach noch weitere Zeichen gesetzt. Der Gewinner setzt immer das letzte Zeichen und hat deshalb nie weniger Zeichen als der Verlierer. ' +
        '<strong>B</strong> ist keiner: Es gibt 5 X, aber nur 3 O, doch die Anzahlen dürfen sich höchstens um 1 unterscheiden. ' +
        '<strong>D</strong> ist keiner: Es gibt noch keinen Gewinner, aber auch noch ein freies Feld. X kann hier noch setzen und gewinnen.</p>' +
        '<p>Aus den Spielregeln lassen sich Bedingungen für Endstände logisch <em>ableiten</em>, zum Beispiel: die Anzahlen von X und O unterscheiden sich höchstens um 1; ohne Gewinner sind alle Felder voll; der Verlierer hat höchstens so viele Zeichen wie der Gewinner. Solches logisches Ableiten ist die Grundlage von Programmiersprachen wie Prolog.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      var steps = STEPS.map(function (s, i) {
        var f = h('figure', { class: P + 'step' + (s.end ? ' ' + P + 'last' : '') },
          h('div', { class: P + 'stepbox' }), h('figcaption', null, s.cap));
        f.firstChild.innerHTML = boardSvg(s.board, 'Spielstand ' + s.cap + ': ' + describe(s.board), true);
        return f;
      });
      radios = OPTIONS.map(function (o, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': o.key,
          'aria-label': 'Antwort ' + o.key + '. ' + describe(o.board),
          onclick: function () { choose(i, false); }, onkeydown: onKey
        });
        btn.innerHTML = '<span class="' + P + 'key" aria-hidden="true">' + o.key + '</span>' + boardSvg(o.board, '', false).replace('role="img" aria-label=""', 'aria-hidden="true"');
        return btn;
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { 'aria-label': 'Beispielspiel' },
          h('h3', null, 'Ein Beispielspiel (X beginnt und gewinnt)'),
          h('div', { class: P + 'steps' }, steps)),
        h('section', { 'aria-label': 'Antworten' },
          h('h3', null, 'Welcher ist ein Endstand?'),
          h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Antworten A bis D' }, radios))));
      refresh();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () {
      return { correct: selected === RIGHT, answer: { choice: OPTIONS[selected].key } };
    },
    setAnswer: function (ans) {
      var i = OPTIONS.map(function (o) { return o.key; }).indexOf(ans && ans.choice);
      selected = i >= 0 ? i : null;
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      refresh();
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () { selected = RIGHT; mark = 'solution'; locked = true; refresh(); }
  });
})();
