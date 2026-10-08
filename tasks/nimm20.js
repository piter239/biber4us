/* Aufgabe Nim(m) (Biber 2020; Klasse 9-10 schwer, 11-13 schwer): Gewinnzug in einem Nim-Spiel mit schwarzen und weißen Steinen */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-nimm20-';

  var START = { b: 3, w: 7 };
  /* Zugregeln: 1 oder 2 schwarze Steine ODER 1, 2 oder 3 weiße Steine; wer eine Farbe ganz leert, gewinnt */
  var MOVES = [{ c: 'b', n: 1 }, { c: 'b', n: 2 }, { c: 'w', n: 1 }, { c: 'w', n: 2 }, { c: 'w', n: 3 }];
  function moveText(m) { return m.n + (m.c === 'b' ? (m.n === 1 ? ' schwarzen Stein' : ' schwarze Steine') : (m.n === 1 ? ' weißen Stein' : ' weiße Steine')); }

  var OPTIONS = [
    { key: 'A', text: '1 weißen Stein', mv: { c: 'w', n: 1 } },
    { key: 'B', text: '2 schwarze Steine', mv: { c: 'b', n: 2 } },
    { key: 'C', text: '3 weiße Steine', mv: { c: 'w', n: 3 } },
    { key: 'D', text: 'Das ist egal, Susi gewinnt auf jeden Fall.', mv: null }
  ];
  var RIGHT = 2;   /* C: im Heft bestätigt und per Skript (Rückwärtsrechnen aller Stellungen) geprüft; nur (3 schwarz, 4 weiß) ist eine Verlust-Stellung für den, der am Zug ist */

  /* ---------- Spiellogik (Stellung = {b, w}, Spieler am Zug) ---------- */
  var memo = {};
  function wins(b, w) {   /* gewinnt der Spieler am Zug mit bestem Spiel? */
    var key = b + ',' + w;
    if (key in memo) return memo[key];
    var r = MOVES.some(function (m) {
      var nb = b - (m.c === 'b' ? m.n : 0), nw = w - (m.c === 'w' ? m.n : 0);
      if (nb < 0 || nw < 0) return false;
      return nb === 0 || nw === 0 || !wins(nb, nw);
    });
    memo[key] = r;
    return r;
  }
  function apply(pos, m) { return { b: pos.b - (m.c === 'b' ? m.n : 0), w: pos.w - (m.c === 'w' ? m.n : 0) }; }
  function legal(pos, m) { return pos[m.c] >= m.n; }
  function takesAll(pos, m) { var q = apply(pos, m); return q.b === 0 || q.w === 0; }

  /* ---------- Steine zeichnen (viewBox 0 0 400 150) ---------- */
  var JIT = [[0, 2, -12], [3, -3, 10], [-2, 3, 22], [2, -2, -18], [0, 3, 8], [-3, -2, -6], [2, 2, 16]];
  function stone(color, i, state) {
    var x = 34 + i * 55 + JIT[i][0], y = (color === 'b' ? 38 : 108) + JIT[i][1], rot = JIT[i][2] * (color === 'b' ? -1 : 1);
    return '<g class="' + P + 'stone ' + P + (color === 'b' ? 'black' : 'white') + (state === 'ghost' ? ' ' + P + 'ghost' : '') + '" transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')">' +
      '<ellipse rx="24" ry="16"/><path class="' + P + 'shine" d="M-13 -5 Q-4 -11 8 -9"/></g>';
  }
  function stonesSvg(pos, gb, gw, label) {
    var out = '', i;
    for (i = 0; i < pos.b; i++) out += stone('b', i, i >= pos.b - gb ? 'ghost' : 'norm');
    for (i = 0; i < pos.w; i++) out += stone('w', i, i >= pos.w - gw ? 'ghost' : 'norm');
    return '<svg class="' + P + 'stones" viewBox="0 0 400 146" role="img" aria-label="' + label + '">' + out + '</svg>';
  }
  function posLabel(pos) {
    return pos.b + (pos.b === 1 ? ' schwarzer Stein' : ' schwarze Steine') + ' und ' + pos.w + (pos.w === 1 ? ' weißer Stein' : ' weiße Steine');
  }

  var el, api, radios, stonesEl, noteEl, selected, locked, mark;
  var game, gameStonesEl, gameMsgEl, gameBtns, gameBox;

  function reset() { selected = null; mark = null; }

  /* ---------- Antwortkarten ---------- */
  function showBoard() {
    var o = selected === null ? null : OPTIONS[selected];
    var gb = o && o.mv && o.mv.c === 'b' ? o.mv.n : 0, gw = o && o.mv && o.mv.c === 'w' ? o.mv.n : 0;
    stonesEl.innerHTML = stonesSvg(START, gb, gw, 'Die Steine: ' + posLabel(START) + (o && o.mv ? '. Gestrichelt: die Steine, die Susi bei ' + o.key + ' wegnimmt.' : '.'));
    if (!o) noteEl.textContent = 'Susi beginnt. Wähle unten einen Zug, dann siehst du, welche Steine übrig bleiben.';
    else if (!o.mv) noteEl.textContent = 'Bei D nimmt Susi irgendeinen erlaubten Zug.';
    else { var q = apply(START, o.mv); noteEl.textContent = 'Susi nimmt ' + moveText(o.mv) + ' (gestrichelt). Für Hans bleiben ' + posLabel(q) + '.'; }
  }
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
    showBoard();
  }
  function onKey(e) {
    var k = e.key, i = radios.indexOf(e.currentTarget), to = null;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % radios.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + radios.length - 1) % radios.length;
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }

  /* ---------- Ausprobieren: Susi (du) gegen Hans ---------- */
  function newGame() { game = { pos: { b: START.b, w: START.w }, over: false, msg: 'Du bist Susi und beginnst. Wähle einen Zug.' }; drawGame(); }
  function drawGame() {
    gameStonesEl.innerHTML = stonesSvg(game.pos, 0, 0, 'Spielstand: ' + posLabel(game.pos));
    gameMsgEl.textContent = game.msg;
    gameBtns.forEach(function (btn, i) {
      btn.disabled = game.over || !legal(game.pos, MOVES[i]);
    });
  }
  function play(i) {
    if (game.over) return;
    var m = MOVES[i];
    if (!legal(game.pos, m)) return;
    var said = 'Du nimmst ' + moveText(m) + '. ';
    if (takesAll(game.pos, m)) {
      game.pos = apply(game.pos, m); game.over = true;
      game.msg = said + 'Eine Farbe ist ganz weg: Du (Susi) hast gewonnen!';
      return drawGame();
    }
    game.pos = apply(game.pos, m);
    var opts = MOVES.filter(function (x) { return legal(game.pos, x); });
    var good = opts.filter(function (x) { return takesAll(game.pos, x) || !wins(apply(game.pos, x).b, apply(game.pos, x).w); });
    var hm = (good.length ? good : opts)[Math.floor(Math.random() * (good.length ? good.length : opts.length))];
    said += 'Hans nimmt ' + moveText(hm) + '. ';
    var wasAll = takesAll(game.pos, hm);
    game.pos = apply(game.pos, hm);
    if (wasAll) { game.over = true; game.msg = said + 'Hans hat eine Farbe ganz weggenommen und gewonnen.'; }
    else game.msg = said + 'Jetzt bist du wieder dran: ' + posLabel(game.pos) + '.';
    drawGame();
  }

  Biber.register({
    id: 'nimm20',
    story:
      '<p>Susi und Hans spielen ein Spiel mit 3 schwarzen und 7 weißen Steinen. Sie nehmen abwechselnd Steine weg. Ein Spieler darf entweder 1 oder 2 schwarze Steine wegnehmen oder 1, 2 oder 3 weiße Steine.</p>' +
      '<p>Der Spieler, der den letzten Stein einer der beiden Farben wegnimmt, hat gewonnen. Susi beginnt.</p>',
    question: 'Welche Steine soll Susi nun wegnehmen, damit sie sicher das Spiel gewinnt?',
    howto: 'Wähle eine Antwort. Die Steine zeigen dir dann, was Susi wegnimmt. Unter der Aufgabe kannst du das Spiel auch selbst gegen Hans ausprobieren.',
    explanation: function () {
      return '<p>Es kommt darauf an, Hans in eine Stellung zu bringen, in der er verliert. Das ist hier die Stellung mit <strong>3 schwarzen und 4 weißen Steinen</strong>: ' +
        'Nimmt Hans schwarze Steine, räumt Susi die restlichen schwarzen weg. Nimmt er 1, 2 oder 3 weiße, bleiben höchstens 3 weiße übrig, und Susi nimmt alle auf einmal. In beiden Fällen gewinnt Susi.</p>' +
        '<p>Mit <strong>C</strong> (3 weiße Steine) erreicht Susi genau diese Stellung. B ist falsch: Nach 1 oder 2 schwarzen Steinen nimmt Hans die übrigen schwarzen und gewinnt. A ist falsch: Nimmt Susi 1 oder 2 weiße, senkt Hans die weißen Steine auf 4, und nun ist Susi in der Verlust-Stellung. D ist deshalb auch falsch.</p>' +
        '<p>Nim ist ein Zwei-Personen-Spiel, bei dem in jeder Stellung feststeht, wer gewinnt, wenn beide richtig spielen. Solche Stellungen kann man rückwärts bestimmen: Eine Stellung ist eine Verlust-Stellung, wenn jeder Zug in eine Gewinn-Stellung für den Gegner führt.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      stonesEl = h('div', { class: P + 'stonebox' });
      noteEl = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      radios = OPTIONS.map(function (o, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': o.key,
          'aria-label': 'Antwort ' + o.key + ': ' + (o.mv ? 'Susi nimmt ' + o.text : o.text),
          onclick: function () { choose(i, false); }, onkeydown: onKey
        });
        btn.innerHTML = '<span class="' + P + 'key" aria-hidden="true">' + o.key + ')</span><span class="' + P + 'txt">' + o.text + '</span>';
        return btn;
      });
      gameStonesEl = h('div', { class: P + 'stonebox' });
      gameMsgEl = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      gameBtns = MOVES.map(function (m, i) {
        return h('button', { type: 'button', class: P + 'mv ' + P + 'mv-' + m.c, onclick: function () { play(i); } }, moveText(m));
      });
      gameBox = h('section', { class: P + 'game', 'aria-label': 'Zum Ausprobieren: Spiel gegen Hans' },
        h('h3', null, 'Zum Ausprobieren: Spiel gegen Hans'),
        gameStonesEl, gameMsgEl,
        h('div', { class: P + 'mvs' }, gameBtns),
        h('button', { type: 'button', class: 'btn ghost ' + P + 'again', onclick: newGame }, 'Neu spielen'));
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { 'aria-label': 'Die Steine' }, h('h3', null, 'Die Steine'), stonesEl, noteEl),
        h('section', { 'aria-label': 'Antwort' }, h('h3', null, 'Susi nimmt …'),
          h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Antworten' }, radios)),
        gameBox));
      newGame();
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
    reset: function () { reset(); newGame(); refresh(); },
    showSolution: function () { selected = RIGHT; mark = 'solution'; locked = true; refresh(); }
  });
})();
