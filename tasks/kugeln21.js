/* Aufgabe Kugeln ordnen (Heft 2021, S. 34; Klasse 3-4 schwer, 7-8 leicht): Kugeln nach Farben in Gläsern umlegen */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-kugeln21-';

  var CAP = 3;                                   /* in jedes Glas passen drei Kugeln */
  /* Anfangsstellung laut Heftbild, von unten nach oben: Glas 1 blau-orange-blau, Glas 2 orange-blau-orange, Glas 3 leer */
  var START = [['b', 'o', 'b'], ['o', 'b', 'o'], []];
  var NAME = { b: 'blau', o: 'orange' };

  function copy(g) { return g.map(function (x) { return x.slice(); }); }
  function top(col) { return col.length ? col[col.length - 1] : null; }
  /* Regelprüfung: null = erlaubt, sonst Text mit dem Grund */
  function why(g, from, to) {
    var ball = top(g[from]);
    if (ball === null) return 'Das Glas ' + (from + 1) + ' ist leer. Dort gibt es keine Kugel zum Nehmen.';
    if (g[to].length >= CAP) return 'In Glas ' + (to + 1) + ' ist kein Platz mehr frei.';
    if (g[to].length && top(g[to]) !== ball) return 'Das geht nicht: In Glas ' + (to + 1) + ' liegt oben eine ' + NAME[top(g[to])] + 'e Kugel, die Kugel ist aber ' + NAME[ball] + '.';
    return null;
  }
  function doMove(g, from, to) { g[to].push(g[from].pop()); }
  /* Ziel: alle Kugeln in zwei Gläsern, und jedes dieser Gläser hat nur eine Farbe (bei 3 + 3 Kugeln und Platz für drei gleichwertig) */
  function isGoal(g) {
    var used = g.filter(function (c) { return c.length; });
    return used.length === 2 && used.every(function (c) { return c.every(function (x) { return x === c[0]; }); });
  }
  function key(g) { return g.map(function (c) { return c.join(''); }).join('|'); }

  /* Kürzeste Lösung per Breitensuche (die Anzahl 6 steht im Heft) */
  function solve() {
    var seen = {}, q = [{ g: copy(START), path: [] }];
    seen[key(START)] = 1;
    for (var i = 0; i < q.length; i++) {
      var s = q[i];
      if (isGoal(s.g)) return s.path;
      for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++) {
        if (a === b || why(s.g, a, b)) continue;
        var n = copy(s.g); doMove(n, a, b);
        var k = key(n);
        if (seen[k]) continue;
        seen[k] = 1;
        q.push({ g: n, path: s.path.concat([[a, b]]) });
      }
    }
    return null;
  }
  var SOL = solve();                              /* 6 Züge */

  var el, api, locked, g, sel, moves, mark, msg;
  var colEls, msgEl, countEl, btnUndo, btnRestart, boardEl;

  function replay(list) {
    var st = copy(START);
    list.forEach(function (m) { if (!why(st, m[0], m[1])) doMove(st, m[0], m[1]); });
    return st;
  }
  function reset() { g = copy(START); sel = null; moves = []; mark = null; msg = ''; }

  function ballEl(c) { return h('span', { class: P + 'ball ' + P + c, 'aria-hidden': 'true' }); }
  function colText(i) {
    var c = g[i];
    var s = 'Glas ' + (i + 1) + ': ';
    if (!c.length) return s + 'leer';
    var list = c.slice().reverse().map(function (x) { return NAME[x]; });
    return s + 'von oben nach unten ' + list.join(', ') + (sel === i ? '. Die oberste Kugel ist in der Hand' : '');
  }

  function render() {
    colEls.forEach(function (btn, i) {
      var c = g[i], held = sel === i;
      var inGlass = held ? c.slice(0, -1) : c;
      btn.className = P + 'col' + (held ? ' sel' : '');
      btn.setAttribute('aria-pressed', String(held));
      btn.setAttribute('aria-label', colText(i) + (sel !== null && sel !== i ? '. Antippen, um die Kugel aus Glas ' + (sel + 1) + ' hierher zu legen.' : ''));
      btn.disabled = locked;
      btn._hand.replaceChildren.apply(btn._hand, held ? [ballEl(top(c))] : []);
      btn._glass.replaceChildren.apply(btn._glass, inGlass.map(ballEl));
    });
    boardEl.className = P + 'board' + (mark ? ' ' + mark : '');
    msgEl.textContent = msg;
    countEl.textContent = moves.length + (moves.length === 1 ? ' Zug' : ' Züge');
    btnUndo.disabled = locked || !moves.length;
    btnRestart.disabled = locked || !moves.length;
  }

  function onCol(i) {
    if (locked) return;
    if (sel === null) {
      if (!g[i].length) { msg = 'Das Glas ' + (i + 1) + ' ist leer. Dort gibt es keine Kugel zum Nehmen.'; render(); return; }
      sel = i; msg = 'Du hältst die ' + NAME[top(g[i])] + 'e Kugel aus Glas ' + (i + 1) + '. Tippe auf das Glas, in das sie soll.';
      render();
      return;
    }
    if (sel === i) { sel = null; msg = 'Die Kugel liegt wieder im Glas.'; render(); return; }
    var bad = why(g, sel, i);
    if (bad) { msg = bad; render(); return; }
    var from = sel;
    doMove(g, from, i);
    moves.push([from, i]);
    sel = null;
    msg = isGoal(g) ? 'Geschafft: Alle Kugeln sind nach Farben geordnet (' + moves.length + (moves.length === 1 ? ' Zug' : ' Züge') + ').' :
      'Kugel von Glas ' + (from + 1) + ' in Glas ' + (i + 1) + ' gelegt.';
    render();
    api.changed();
  }
  function undo() {
    if (locked || !moves.length) return;
    moves.pop(); g = replay(moves); sel = null; msg = 'Der letzte Zug ist zurückgenommen.';
    render(); api.changed();
  }
  function restart() {
    if (locked || !moves.length) return;
    reset(); msg = 'Alles auf Anfang.'; render(); api.changed();
  }

  Biber.register({
    id: 'kugeln21',
    story: '<p>In einem Spiel gibt es Kugeln in zwei Farben; die Kugeln sind in Gläsern, in jedes Glas passen drei. Du sollst die Kugeln nach Farbe ordnen: ' +
      'Am Ende sollen alle Kugeln in <b>zwei</b> Gläsern sein, und in einem Glas sollen alle Kugeln die gleiche Farbe haben.</p>' +
      '<p>Das Spiel hat drei Regeln:</p>' +
      '<ul><li>Du darfst nur die oberste Kugel eines Glases nehmen.</li>' +
      '<li>Du darfst eine Kugel in ein leeres Glas legen.</li>' +
      '<li>Du darfst eine Kugel in ein Glas legen, wenn dort noch Platz frei ist und die oberste Kugel die gleiche Farbe hat.</li></ul>',
    question: 'Ordne diese Kugeln!',
    howto: 'Tippe auf ein Glas, um dessen oberste Kugel zu nehmen, und dann auf das Glas, in das sie soll. Mit „Zug zurück“ nimmst du den letzten Zug zurück. Prüfen kannst du, sobald du fertig bist.',
    explanation: function () {
      var st = copy(START), steps = SOL.map(function (m, i) {
        var ball = top(st[m[0]]);
        doMove(st, m[0], m[1]);
        return '<li>Die ' + NAME[ball] + 'e Kugel von Glas ' + (m[0] + 1) + ' in Glas ' + (m[1] + 1) + '</li>';
      }).join('');
      return '<p>Das leere Glas dient als Zwischenlager: Man legt Kugeln dorthin, damit darunter die Kugel der anderen Farbe frei wird. ' +
        'Eine mögliche Lösung (diese hier braucht ' + SOL.length + ' Züge):</p><ol>' + steps + '</ol>' +
        '<p>Weniger als 6 Züge gehen bei diesen Kugeln nicht; es gibt auch andere Wege mit 6 Zügen und viele längere. Alle sind richtig, wenn am Ende die Farben getrennt sind.</p>' +
        '<p><b>Informatik:</b> Jede Stellung der Kugeln ist ein „Zustand“, jeder erlaubte Zug führt in einen neuen Zustand. Eine Lösung ist ein Weg von der Anfangs- zu einer Endstellung. ' +
        'Probiert ein Programm systematisch alle Wege der Reihe nach aus („Breitensuche“), findet es als Erstes einen kürzesten.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      colEls = [0, 1, 2].map(function (i) {
        var hand = h('span', { class: P + 'hand' }), glass = h('span', { class: P + 'glass' });
        var btn = h('button', { type: 'button', class: P + 'col', onclick: function () { onCol(i); } },
          hand, glass, h('span', { class: P + 'num', 'aria-hidden': 'true' }, 'Glas ' + (i + 1)));
        btn._hand = hand; btn._glass = glass;
        return btn;
      });
      boardEl = h('div', { class: P + 'board' }, colEls);
      msgEl = h('p', { class: P + 'msg', 'aria-live': 'polite' });
      countEl = h('span', { class: P + 'count' });
      btnUndo = h('button', { type: 'button', class: 'btn ghost', onclick: undo }, 'Zug zurück');
      btnRestart = h('button', { type: 'button', class: 'btn ghost', onclick: restart }, 'Von vorn');
      el.replaceChildren(h('div', { class: P + 'wrap' }, boardEl, msgEl,
        h('div', { class: P + 'ctl' }, countEl, btnUndo, btnRestart)));
      render();
    },
    isComplete: function () { return moves.length > 0; },
    evaluate: function () { return { correct: isGoal(g), answer: { moves: moves.map(function (m) { return m.slice(); }) } }; },
    setAnswer: function (ans) {
      moves = ((ans && ans.moves) || []).map(function (m) { return m.slice(); });
      g = replay(moves); sel = null;
      mark = isGoal(g) ? 'right' : 'wrong';
      msg = isGoal(g) ? 'Alle Kugeln sind nach Farben geordnet (' + moves.length + ' Züge).' : 'Die Farben sind noch nicht getrennt.';
      render();
    },
    lock: function (on) {
      locked = on;
      if (on) { sel = null; mark = isGoal(g) ? 'right' : 'wrong'; if (!isGoal(g)) msg = 'Die Farben sind noch nicht getrennt.'; }
      else { if (mark !== 'solution') mark = null; }
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      moves = SOL.map(function (m) { return m.slice(); });
      g = replay(moves); sel = null; locked = true; mark = 'solution';
      msg = 'Eine Lösung mit ' + SOL.length + ' Zügen: In Glas 2 und Glas 3 liegen nun die Kugeln nach Farben getrennt.';
      render();
    }
  });
})();
