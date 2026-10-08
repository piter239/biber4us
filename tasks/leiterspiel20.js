/* Aufgabe Leiterspiel (Biber 2020; Klasse 9-10 mittel, 11-13 leicht): kürzester Weg (wenigste Runden) in einem Schlangen-und-Leitern-Spiel */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-leiterspiel20-';
  var NS = 'http://www.w3.org/2000/svg';

  /* Leitern (Fuß -> oben) und Schlangen (Kopf -> Schwanz) nach dem Bild im Heft */
  var LADDERS = { 8: 20, 10: 44, 14: 16, 23: 36, 29: 42 };
  var SNAKES = { 21: 5, 30: 11, 37: 13, 43: 28, 47: 32 };
  var SNAKE_COL = { 43: 'var(--c6)', 30: 'var(--c1)', 37: 'var(--c4)', 47: 'var(--c5)', 21: 'var(--c2)' };
  var START = 19, GOAL = 49;
  var OPTIONS = [
    { key: 'A', n: 2 }, { key: 'B', n: 3 }, { key: 'C', n: 4 }, { key: 'D', n: 5 }
  ];
  var RIGHT = 1;   /* B = 3 Runden; per Skript (Breitensuche über alle Würfe) bestätigt, ebenso die Beispiele aus dem Heft */
  var SOLUTION_THROWS = [2, 5, 5];
  var CELL = 60;

  function cellXY(n) {
    var idx = n - 1, row = Math.floor(idx / 7), col = row % 2 === 0 ? idx % 7 : 6 - idx % 7;
    return { x: col * CELL, y: (6 - row) * CELL, cx: col * CELL + CELL / 2, cy: (6 - row) * CELL + CELL / 2 };
  }
  function jump(n) { return LADDERS[n] || SNAKES[n] || n; }

  /* ---------- Spielbrett zeichnen ---------- */
  function ladderSvg(a, b) {
    var p = cellXY(a), q = cellXY(b), dx = q.cx - p.cx, dy = q.cy - p.cy, len = Math.hypot(dx, dy);
    var ux = dx / len, uy = dy / len, nx = -uy * 9, ny = ux * 9, s = '<g class="' + P + 'ladder">', t;
    s += '<line x1="' + (p.cx + nx) + '" y1="' + (p.cy + ny) + '" x2="' + (q.cx + nx) + '" y2="' + (q.cy + ny) + '"/>';
    s += '<line x1="' + (p.cx - nx) + '" y1="' + (p.cy - ny) + '" x2="' + (q.cx - nx) + '" y2="' + (q.cy - ny) + '"/>';
    for (t = 14; t < len - 6; t += 22) {
      var mx = p.cx + ux * t, my = p.cy + uy * t;
      s += '<line class="' + P + 'rung" x1="' + (mx + nx) + '" y1="' + (my + ny) + '" x2="' + (mx - nx) + '" y2="' + (my - ny) + '"/>';
    }
    return s + '</g>';
  }
  function snakeSvg(a, b) {
    var p = cellXY(a), q = cellXY(b), dx = q.cx - p.cx, dy = q.cy - p.cy, len = Math.hypot(dx, dy);
    var ux = dx / len, uy = dy / len, nx = -uy, ny = ux, pts = [], i, N = Math.max(12, Math.round(len / 6));
    var waves = Math.max(1.5, len / 80);
    for (i = 0; i <= N; i++) {
      var f = i / N, amp = 13 * Math.sin(f * Math.PI * 2 * waves) * (0.35 + 0.65 * Math.sin(Math.min(1, f * 4) * Math.PI / 2));
      pts.push([p.cx + dx * f + nx * amp, p.cy + dy * f + ny * amp]);
    }
    var d = 'M' + pts.map(function (z) { return z[0].toFixed(1) + ' ' + z[1].toFixed(1); }).join(' L');
    var c = SNAKE_COL[a];
    var hd = pts[0], nxt = pts[1], ang = Math.atan2(nxt[1] - hd[1], nxt[0] - hd[0]) + Math.PI;
    var ex = Math.cos(ang + 0.5) * 5, ey = Math.sin(ang + 0.5) * 5, fx = Math.cos(ang - 0.5) * 5, fy = Math.sin(ang - 0.5) * 5;
    return '<g class="' + P + 'snake" style="--sc:' + c + '"><path class="' + P + 'body" d="' + d + '"/>' +
      '<path class="' + P + 'belly" d="' + d + '"/>' +
      '<circle class="' + P + 'head" cx="' + hd[0].toFixed(1) + '" cy="' + hd[1].toFixed(1) + '" r="9"/>' +
      '<circle class="' + P + 'eye" cx="' + (hd[0] + ex).toFixed(1) + '" cy="' + (hd[1] + ey).toFixed(1) + '" r="2.2"/><circle class="' + P + 'eye" cx="' + (hd[0] + fx).toFixed(1) + '" cy="' + (hd[1] + fy).toFixed(1) + '" r="2.2"/></g>';
  }
  function boardSvg() {
    var s = '', n;
    for (n = 1; n <= 49; n++) {
      var c = cellXY(n);
      s += '<rect class="' + P + 'cell ' + ((Math.floor((n - 1) / 7) + (n - 1) % 7) % 2 ? 'b' : 'a') + (n === GOAL ? ' goal' : '') + '" x="' + c.x + '" y="' + c.y + '" width="' + CELL + '" height="' + CELL + '"/>';
    }
    Object.keys(LADDERS).forEach(function (a) { s += ladderSvg(Number(a), LADDERS[a]); });
    Object.keys(SNAKES).forEach(function (a) { s += snakeSvg(Number(a), SNAKES[a]); });
    for (n = 1; n <= 49; n++) {
      var d = cellXY(n);
      s += '<text class="' + P + 'no" x="' + (d.x + 4) + '" y="' + (d.y + 14) + '">' + n + '</text>';
    }
    var g = cellXY(GOAL);
    s += '<text class="' + P + 'win" x="' + g.cx + '" y="' + (g.cy + 10) + '">WIN</text>';
    return s;
  }
  function boardLabel() {
    return 'Spielbrett mit 49 Feldern. Leitern: ' + Object.keys(LADDERS).map(function (a) { return 'von ' + a + ' nach ' + LADDERS[a]; }).join(', ') +
      '. Schlangen: ' + Object.keys(SNAKES).map(function (a) { return 'von ' + a + ' nach ' + SNAKES[a]; }).join(', ') + '.';
  }

  /* ---------- Spielzustand ---------- */
  var el, api, selected, locked, mark, radios;
  var pos, moves, tokenEl, logEl, throwBtns, undoBtn, newBtn, countEl;

  function reset() { selected = null; mark = null; }
  function newGame() { pos = START; moves = []; drawGame(); }
  function throwDie(d) {
    if (pos + d > GOAL || pos === GOAL) return;
    var landed = pos + d, end = jump(landed);
    moves.push({ from: pos, d: d, land: landed, to: end });
    pos = end;
    drawGame();
  }
  function undo() {
    if (!moves.length) return;
    pos = moves.pop().from;
    drawGame();
  }
  function moveText(m, i) {
    var t = 'Runde ' + (i + 1) + ': Wurf ' + m.d + ', von ' + m.from + ' auf ' + m.land;
    if (m.to !== m.land) t += m.to > m.land ? ', die Leiter hinauf nach ' + m.to : ', die Schlange hinunter nach ' + m.to;
    return t + '.';
  }
  function drawGame() {
    var c = cellXY(pos);
    tokenEl.style.transform = 'translate(' + c.cx + 'px,' + c.cy + 'px)';
    tokenEl.querySelector('text').textContent = pos;
    logEl.innerHTML = '';
    if (!moves.length) logEl.appendChild(h('li', { class: P + 'none' }, 'Deine Figur steht auf Feld ' + START + '. Wähle einen Wurf.'));
    moves.forEach(function (m, i) { logEl.appendChild(h('li', null, moveText(m, i))); });
    var won = pos === GOAL;
    countEl.textContent = won ? 'Ziel erreicht nach ' + moves.length + (moves.length === 1 ? ' Runde.' : ' Runden.') : 'Bisher ' + moves.length + (moves.length === 1 ? ' Runde' : ' Runden') + ', Figur auf Feld ' + pos + '.';
    throwBtns.forEach(function (b, i) { b.disabled = won || pos + i + 1 > GOAL; });
    undoBtn.disabled = !moves.length;
    newBtn.disabled = !moves.length;
  }

  /* ---------- Antworten ---------- */
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
  function choose(i, focus) {
    if (locked) return;
    selected = i;
    refresh();
    if (focus) radios[i].focus();
    api.changed();
  }
  function onKey(e) {
    var k = e.key, i = radios.indexOf(e.currentTarget), to = null;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % radios.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + radios.length - 1) % radios.length;
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }

  Biber.register({
    id: 'leiterspiel20',
    story:
      '<p>Beim Leiterspiel starten alle Spieler auf Feld 1. Wer zuerst Feld 49 erreicht, gewinnt.</p>' +
      '<p>In jeder Runde würfelt man eine Zahl zwischen 1 und 6 und zieht mit seiner Figur entsprechend viele Felder vor. Endet man dabei auf einem Feld mit dem Kopf einer Schlange, schlittert man hinab bis zum Feld mit ihrem Schwanzende. Endet man aber am Fuß einer Leiter, darf man diese sofort ganz hinaufklettern.</p>' +
      '<p>Ein Beispiel: Du stehst auf Feld 26 und würfelst eine 3. Du ziehst also auf Feld 29 und darfst über die Leiter sofort zum Feld 42 vorrücken. In der nächsten Runde würfelst du eine 5, landest auf dem Schlangenkopf des Feldes 47 und musst sofort zurück zum Feld 32.</p>' +
      '<p>Deine Figur steht auf Feld 19 (schwarzer Punkt).</p>',
    question: 'Wie viele Runden brauchst du mindestens noch, um das Feld 49 zu erreichen?',
    howto: 'Wähle eine Antwort. Unter dem Spielbrett kannst du Würfe ausprobieren und die Runden zählen.',
    explanation: function () {
      return '<p>Die richtige Antwort ist <strong>B: 3 Runden</strong>. Wer nur Würfe wählt, die in Richtung Ziel führen, braucht 4 Runden: Mit einer 4 geht es von 19 auf 23 und die Leiter hinauf auf 36, danach braucht man noch 3 Würfe, zum Beispiel 6, 6, 1. ' +
        'Mit einem scheinbaren Rückschritt geht es schneller: Wirft man 2, landet man auf 21 und rutscht die Schlange hinunter auf Feld 5. Mit einer 5 geht es auf 10, die Leiter führt auf Feld 44, und mit einer weiteren 5 ist man im Ziel (2 – 5 – 5).</p>' +
        '<p>In nur 2 Runden geht es nicht: Von 44, 45, 46 oder 48 aus erreicht man das Ziel in einem Wurf (auf 47 und 43 kann man nicht stehen bleiben), und keines dieser Felder ist von 19 aus mit einem Wurf zu erreichen.</p>' +
        '<p>Gesucht war ein kürzester Weg, und zwar der mit den wenigsten Runden, nicht der über die wenigsten Felder. Dasselbe Verfahren (Kürzeste-Wege-Algorithmus) berechnet auch die kürzeste oder schnellste Route in einer Navigations-App oder die billigste Route mit den geringsten Maut-Gebühren. Man muss das Problem nur passend als Graph modellieren.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', P + 'svg');
      svg.setAttribute('viewBox', '0 0 ' + (7 * CELL) + ' ' + (7 * CELL));
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', boardLabel());
      svg.innerHTML = boardSvg() + '<g class="' + P + 'token"><circle r="13"/><text>19</text></g>';
      tokenEl = svg.querySelector('.' + P + 'token');
      logEl = h('ol', { class: P + 'log', 'aria-live': 'polite' });
      countEl = h('p', { class: P + 'count', role: 'status', 'aria-live': 'polite' });
      throwBtns = [1, 2, 3, 4, 5, 6].map(function (d) {
        return h('button', { type: 'button', class: P + 'die', 'aria-label': 'Wurf ' + d, onclick: function () { throwDie(d); } }, String(d));
      });
      undoBtn = h('button', { type: 'button', class: 'btn ghost ' + P + 'small', onclick: undo }, 'Letzten Wurf zurück');
      newBtn = h('button', { type: 'button', class: 'btn ghost ' + P + 'small', onclick: newGame }, 'Neu von Feld ' + START);
      radios = OPTIONS.map(function (o, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': o.key, 'aria-label': 'Antwort ' + o.key + ': ' + o.n + ' Runden',
          onclick: function () { choose(i, false); }, onkeydown: onKey
        });
        btn.innerHTML = '<span class="' + P + 'key" aria-hidden="true">' + o.key + ')</span><span>' + o.n + ' Runden</span>';
        return btn;
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('div', { class: P + 'left' }, h('div', { class: P + 'boardbox' }, svg)),
        h('div', { class: P + 'right' },
          h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Antworten' }, radios),
          h('section', { class: P + 'try', 'aria-label': 'Zum Ausprobieren: Würfe' },
            h('h3', null, 'Zum Ausprobieren'),
            h('p', { class: P + 'tip' }, 'Welche Zahl würfelst du?'),
            h('div', { class: P + 'dice', role: 'group', 'aria-label': 'Wurf wählen' }, throwBtns),
            countEl, logEl,
            h('div', { class: P + 'tryact' }, undoBtn, newBtn)))));
      newGame();
      refresh();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () { return { correct: selected === RIGHT, answer: { choice: OPTIONS[selected].key } }; },
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
    reset: function () { reset(); newGame(); refresh(); },
    showSolution: function () {
      selected = RIGHT; mark = 'solution'; locked = true;
      pos = START; moves = [];
      SOLUTION_THROWS.forEach(function (d) { var landed = pos + d, end = jump(landed); moves.push({ from: pos, d: d, land: landed, to: end }); pos = end; });
      drawGame(); refresh();
    }
  });
})();
