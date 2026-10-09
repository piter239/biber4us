/* Aufgabe Bominos (Biber 2020; Klasse 7-8 mittel, 9-10 leicht): die drei verschiedenen 3-Bominos in 3x3-Raster zeichnen */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-bominos20-';
  var NG = 3;   /* Anzahl Raster */

  /* ---------- Definition (deklarativ) und Prüfung (operational); Zellen als Index 0..8, Reihe = floor(i/3), Spalte = i%3 ---------- */
  /* BEGIN-LOGIK */
  function rc(i) { return [Math.floor(i / 3), i % 3]; }
  function touch(a, b) {   /* berühren sich (oben, unten, links, rechts oder diagonal) */
    var p = rc(a), q = rc(b);
    return a !== b && Math.abs(p[0] - q[0]) <= 1 && Math.abs(p[1] - q[1]) <= 1;
  }
  function diagonal(a, b) { var p = rc(a), q = rc(b); return Math.abs(p[0] - q[0]) === 1 && Math.abs(p[1] - q[1]) === 1; }
  function cond1(cells) {   /* jedes Quadrat berührt mindestens ein anderes */
    return cells.every(function (c) { return cells.some(function (d) { return touch(c, d); }); });
  }
  function cond2(cells) {   /* ein diagonales Paar, das kein weiteres Quadrat gleichzeitig berührt */
    var i, j;
    for (i = 0; i < cells.length; i++) {
      for (j = i + 1; j < cells.length; j++) {
        if (!diagonal(cells[i], cells[j])) continue;
        var both = cells.some(function (c) { return c !== cells[i] && c !== cells[j] && touch(c, cells[i]) && touch(c, cells[j]); });
        if (!both) return true;
      }
    }
    return false;
  }
  function isBomino(cells) { return cells.length >= 2 && cond1(cells) && cond2(cells); }
  function canon(cells) {   /* kleinste Form unter Drehen/Spiegeln/Verschieben */
    var best = null, t;
    for (t = 0; t < 8; t++) {
      var q = cells.map(function (i) {
        var p = rc(i), x = p[0], y = p[1], tmp;
        if (t & 1) { tmp = x; x = y; y = tmp; }
        if (t & 2) x = -x;
        if (t & 4) y = -y;
        return [x, y];
      });
      var mx = Math.min.apply(null, q.map(function (z) { return z[0]; })), my = Math.min.apply(null, q.map(function (z) { return z[1]; }));
      var key = q.map(function (z) { return (z[0] - mx) + ',' + (z[1] - my); }).sort().join(';');
      if (best === null || key < best) best = key;
    }
    return best;
  }
  function judge(grids) {   /* pro Raster: ok | count | cond1 | cond2 | dup:<n> ; gesamt richtig, wenn alle ok */
    var seen = {}, out = [];
    grids.forEach(function (cells, gi) {
      if (cells.length !== 3) { out.push('count'); return; }
      if (!cond1(cells)) { out.push('cond1'); return; }
      if (!cond2(cells)) { out.push('cond2'); return; }
      var k = canon(cells);
      if (k in seen) { out.push('dup:' + (seen[k] + 1)); return; }
      seen[k] = gi; out.push('ok');
    });
    return out;
  }
  /* END-LOGIK */

  /* Heft-Lösung: drei verschiedene 3-Bominos */
  var SOLUTION = [[0, 4, 6], [0, 4, 7], [0, 4, 8]];
  var COLORS = ['var(--c1)', 'var(--c6)', 'var(--c4)'];

  function miniGrid(rows, cols, filled, color, label) {
    var cells = '', r, c;
    for (r = 0; r < rows; r++) for (c = 0; c < cols; c++) {
      cells += '<span class="' + P + 'mc' + (filled.indexOf(r * cols + c) >= 0 ? ' ' + P + 'mon' : '') + '"></span>';
    }
    return '<span class="' + P + 'mini" role="img" aria-label="' + label + '" style="grid-template-columns:repeat(' + cols + ',1fr);width:' + (cols * 1.7) + 'rem;--t-bo-col:' + color + '">' + cells + '</span>';
  }
  function examples() {
    return '<div class="' + P + 'examples">' +
      '<div class="' + P + 'ex"><div class="' + P + 'exfig">' + miniGrid(2, 2, [0, 3], 'var(--c3)', '2-Bomino: zwei Quadrate, die sich diagonal berühren') + '</div><p>Das einzig mögliche Bomino aus 2 Quadraten (2-Bomino).</p></div>' +
      '<div class="' + P + 'ex"><div class="' + P + 'exfig">' + miniGrid(3, 2, [0, 1, 3, 4], 'var(--c5)', '4-Bomino: zwei Quadrate oben nebeneinander, darunter eins, links unten ein einzelnes diagonal angrenzendes') .replace('"></span>', '"></span>') + miniGrid(3, 2, [1, 3, 5, 4], 'var(--c1)', 'Kein Bomino: Bedingung 2 nicht erfüllt') + '</div><p>Links ein 4-Bomino, rechts kein Bomino: Bedingung 2 ist nicht erfüllt.</p></div>' +
      '</div>';
  }

  var el, api, grids, btns, locked, mark, verdict, statusEls, cardEls, countEls;

  function reset() { grids = [[], [], []]; mark = null; verdict = null; }

  function refresh() {
    var j = mark ? verdict : null;
    btns.forEach(function (row, g) {
      row.forEach(function (b, i) {
        var on = grids[g].indexOf(i) >= 0, p = rc(i);
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', String(on));
        b.setAttribute('aria-label', 'Raster ' + (g + 1) + ', Reihe ' + (p[0] + 1) + ', Spalte ' + (p[1] + 1) + ': ' + (on ? 'Quadrat' : 'leer'));
        b.setAttribute('aria-disabled', locked ? 'true' : 'false');
      });
      var n = grids[g].length;
      countEls[g].textContent = n + (n === 1 ? ' Quadrat' : ' Quadrate');
      var st = j ? j[g] : null, s = '';
      cardEls[g].classList.toggle('right', st === 'ok');
      cardEls[g].classList.toggle('wrong', !!st && st !== 'ok');
      if (st === 'ok') s = 'Das ist ein 3-Bomino.';
      else if (st === 'count') s = 'Ein 3-Bomino hat genau 3 Quadrate.';
      else if (st === 'cond1') s = 'Kein Bomino: Ein Quadrat berührt kein anderes (Bedingung 1).';
      else if (st === 'cond2') s = 'Kein Bomino: Es gibt kein diagonales Paar ohne gemeinsames Nachbarquadrat (Bedingung 2).';
      else if (st && st.indexOf('dup:') === 0) s = 'Diese Figur ist gleich wie in Raster ' + st.slice(4) + ' (nur gedreht oder gespiegelt).';
      statusEls[g].textContent = s;
    });
  }
  function toggle(g, i) {
    if (locked) return;
    var k = grids[g].indexOf(i);
    if (k >= 0) grids[g].splice(k, 1); else grids[g].push(i);
    grids[g].sort(function (a, b) { return a - b; });
    refresh();
    api.changed();
  }
  function onKey(e, g, i) {
    var r = Math.floor(i / 3), c = i % 3, to = null;
    if (e.key === 'ArrowRight') c = Math.min(2, c + 1);
    else if (e.key === 'ArrowLeft') c = Math.max(0, c - 1);
    else if (e.key === 'ArrowDown') r = Math.min(2, r + 1);
    else if (e.key === 'ArrowUp') r = Math.max(0, r - 1);
    else return;
    to = r * 3 + c;
    e.preventDefault();
    btns[g][to].focus();
  }

  Biber.register({
    id: 'bominos20',
    story:
      '<p>Bominos sind 2D-Figuren. Ein Bomino besteht aus farbigen Quadraten, die in einem Raster liegen. Die Quadrate müssen folgende Bedingungen erfüllen:</p>' +
      '<ol class="' + P + 'rules"><li>Jedes Quadrat berührt mindestens ein anderes Quadrat (oben, unten, links, rechts oder diagonal).</li>' +
      '<li>Für mindestens ein Paar von Quadraten des Bominos gilt: Die beiden Quadrate berühren sich diagonal. Kein weiteres Quadrat des Bominos berührt gleichzeitig diese beiden Quadrate.</li></ol>' +
      '<p>Ein Bomino mit n Quadraten heißt auch n-Bomino. Einige Beispiele:</p>' + examples() +
      '<p>Zwei Bominos gelten als gleich, wenn das eine durch Drehen oder Spiegeln (oder beides) aus dem anderen entsteht.</p>',
    question: 'Es gibt drei verschiedene 3-Bominos. Zeichne sie in die Raster.',
    howto: 'Tippe auf die Felder, um Quadrate zu setzen oder wieder wegzunehmen. Jedes 3-Bomino passt in ein 3×3-Raster. Mit den Pfeiltasten wanderst du über die Felder.',
    explanation: function () {
      return '<p>Jedes Bomino enthält das 2-Bomino, also zwei Quadrate, die sich nur an einer Ecke berühren. Das dritte Quadrat darf nur <em>eins</em> dieser beiden Quadrate berühren, sonst wäre Bedingung 2 für dieses Paar verletzt. Setzt man das dritte Quadrat an das untere Quadrat, gibt es drei verschiedene Möglichkeiten: unten links, unten in der Mitte oder unten rechts. Alle anderen Lösungen entstehen daraus durch Drehen oder Spiegeln.</p>' +
        '<p>Die Bominos werden hier durch eine genaue Beschreibung ihrer Eigenschaften eingeführt. In der Mathematik nennt man das eine <strong>Definition</strong>, in der Informatik eine <strong>deklarative</strong> Beschreibung. Will man Bominos aber konstruieren oder prüfen, ob eine Figur eines ist, braucht man eine <strong>operationale</strong> Beschreibung, zum Beispiel ein Programm, das die Bedingungen Schritt für Schritt prüft.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      btns = []; statusEls = []; cardEls = []; countEls = [];
      var cards = [], g, i;
      for (g = 0; g < NG; g++) {
        (function (gg) {
          var row = [], gridEl = h('div', { class: P + 'grid', role: 'group', 'aria-label': 'Raster ' + (gg + 1), style: '--t-bo-col:' + COLORS[gg] });
          for (i = 0; i < 9; i++) {
            (function (ii) {
              var b = h('button', { type: 'button', class: P + 'cell', onclick: function () { toggle(gg, ii); }, onkeydown: function (e) { onKey(e, gg, ii); } });
              row.push(b); gridEl.appendChild(b);
            })(i);
          }
          btns.push(row);
          var cnt = h('span', { class: P + 'count' }), st = h('p', { class: P + 'status', role: 'status', 'aria-live': 'polite' });
          countEls.push(cnt); statusEls.push(st);
          var card = h('section', { class: P + 'card', 'aria-label': 'Raster ' + (gg + 1) },
            h('h3', null, 'Raster ' + (gg + 1)), gridEl, cnt, st);
          cardEls.push(card); cards.push(card);
        })(g);
      }
      el.replaceChildren(h('div', { class: P + 'board' }, cards));
      refresh();
    },
    isComplete: function () { return grids.every(function (c) { return c.length === 3; }); },
    evaluate: function () {
      var j = judge(grids);
      verdict = j; mark = 'check';
      refresh();
      return { correct: j.every(function (x) { return x === 'ok'; }), answer: { grids: grids.map(function (c) { return c.slice(); }) } };
    },
    setAnswer: function (ans) {
      if (ans && Array.isArray(ans.grids) && ans.grids.length === NG) grids = ans.grids.map(function (c) { return c.slice(); });
      verdict = judge(grids); mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      if (on) { if (mark === null) { verdict = judge(grids); mark = 'check'; } }
      else { mark = null; verdict = null; }
      refresh();
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () { grids = SOLUTION.map(function (c) { return c.slice(); }); verdict = judge(grids); mark = 'solution'; locked = true; refresh(); }
  });
})();
