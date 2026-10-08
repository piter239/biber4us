/* Aufgabe Momos Spiel (Klasse 5-6, schwer): Roboterprogramm mit möglichst wenigen Befehlen für drei Level */
(function () {
  'use strict';
  var h = Biber.h, S = Biber.svg;

  var ROWS = 5, COLS = 7;
  /* Richtungen: 0 oben, 1 rechts, 2 unten, 3 links; Felder als [Zeile, Spalte] */
  var DR = [[-1, 0], [0, 1], [1, 0], [0, -1]];
  var LEVELS = [
    { name: 'Level 1', obs: [[0, 0], [0, 2], [0, 5], [1, 5], [3, 0], [3, 5], [4, 4]], goal: [0, 4], start: [3, 2], dir: 0 },
    { name: 'Level 2', obs: [[0, 0], [0, 2], [0, 5], [1, 4], [2, 5], [3, 0], [4, 2], [4, 4]], goal: [3, 6], start: [2, 0], dir: 1 },
    { name: 'Level 3', obs: [[0, 1], [1, 1], [1, 5], [2, 0], [2, 3], [3, 1], [4, 4]], goal: [4, 2], start: [0, 3], dir: 2 }
  ];
  var CMD = {
    F: { label: 'Fahre ein Feld vorwärts.', short: 'Ein Feld vorwärts', icon: '↑' },
    W: { label: 'Fahre vorwärts, bis es nicht mehr weitergeht.', short: 'Vorwärts bis zum Hindernis', icon: '⇈' },
    L: { label: 'Drehe dich um 90 Grad gegen den Uhrzeigersinn.', short: 'Links drehen (90°)', icon: '↺' },
    R: { label: 'Drehe dich um 90 Grad im Uhrzeigersinn.', short: 'Rechts drehen (90°)', icon: '↻' }
  };
  var ORDER = ['F', 'W', 'L', 'R'];
  var BEST = 5;                       /* kürzestes Programm (Brute Force über alle Programme bis Länge 5 geprüft) */
  var SOLUTION = ['W', 'R', 'W', 'L', 'W'];
  var MAXLEN = 10;

  function blocked(lv, r, c) {
    if (r < 0 || c < 0 || r >= ROWS || c >= COLS) return true;
    return lv.obs.some(function (o) { return o[0] === r && o[1] === c; });
  }
  /* Simulation: liefert den Zustand nach jedem Befehl (Index 0 = Start) */
  function simulate(lv, prog) {
    var r = lv.start[0], c = lv.start[1], d = lv.dir;
    var st = [{ r: r, c: c, d: d, cells: [[r, c]] }];
    var reached = r === lv.goal[0] && c === lv.goal[1];
    prog.forEach(function (cmd) {
      var cells = [];
      if (cmd === 'L') d = (d + 3) % 4;
      else if (cmd === 'R') d = (d + 1) % 4;
      else {
        var n = cmd === 'F' ? 1 : 99;
        while (n-- > 0 && !blocked(lv, r + DR[d][0], c + DR[d][1])) {
          r += DR[d][0]; c += DR[d][1];
          cells.push([r, c]);
          if (r === lv.goal[0] && c === lv.goal[1]) reached = true;
        }
      }
      st.push({ r: r, c: c, d: d, cells: cells, reached: reached });
    });
    return { states: st, reached: reached };
  }
  function solvesAll(prog) { return LEVELS.every(function (lv) { return simulate(lv, prog).reached; }); }

  /* ---------- Zeichnen ---------- */
  var U = 40, PAD = 14;
  function board(lv, sim, step, showPath, mark) {
    var w = COLS * U + 2 * PAD, ht = ROWS * U + 2 * PAD;
    var kids = [S('rect', { class: 'mo-frame', x: 0.5, y: 0.5, width: w - 1, height: ht - 1, rx: 6 }),
      S('rect', { class: 'mo-floor', x: PAD, y: PAD, width: COLS * U, height: ROWS * U })];
    for (var i = 1; i < COLS; i++) kids.push(S('line', { class: 'mo-grid', x1: PAD + i * U, y1: PAD, x2: PAD + i * U, y2: PAD + ROWS * U }));
    for (var j = 1; j < ROWS; j++) kids.push(S('line', { class: 'mo-grid', x1: PAD, y1: PAD + j * U, x2: PAD + COLS * U, y2: PAD + j * U }));
    function cx(c) { return PAD + c * U + U / 2; }
    function cy(r) { return PAD + r * U + U / 2; }
    kids.push(S('rect', { class: 'mo-start', x: PAD + lv.start[1] * U + 1, y: PAD + lv.start[0] * U + 1, width: U - 2, height: U - 2 }));
    lv.obs.forEach(function (o) {
      var x = PAD + o[1] * U + 3, y = PAD + o[0] * U + 3;
      kids.push(S('g', { class: 'mo-crate' },
        S('rect', { x: x, y: y, width: U - 6, height: U - 6, rx: 3 }),
        S('line', { x1: x + 2, y1: y + (U - 6) / 3, x2: x + U - 8, y2: y + (U - 6) / 3 }),
        S('line', { x1: x + 2, y1: y + 2 * (U - 6) / 3, x2: x + U - 8, y2: y + 2 * (U - 6) / 3 })));
    });
    kids.push(S('g', { class: 'mo-goal' },
      S('circle', { cx: cx(lv.goal[1]), cy: cy(lv.goal[0]), r: 15 }),
      S('circle', { cx: cx(lv.goal[1]), cy: cy(lv.goal[0]), r: 9, class: 'in' }),
      S('circle', { cx: cx(lv.goal[1]), cy: cy(lv.goal[0]), r: 4, class: 'core' })));
    /* Spur */
    if (showPath) {
      var pts = [[lv.start[0], lv.start[1]]];
      for (var k = 1; k <= step; k++) sim.states[k].cells.forEach(function (p) { pts.push(p); });
      if (pts.length > 1) kids.push(S('polyline', { class: 'mo-trail', points: pts.map(function (p) { return cx(p[1]) + ',' + cy(p[0]); }).join(' ') }));
    }
    var s = sim.states[showPath ? step : 0];
    var ang = s.d * 90;
    kids.push(S('g', { class: 'mo-robot', transform: 'translate(' + cx(s.c) + ' ' + cy(s.r) + ') rotate(' + ang + ')' },
      S('circle', { r: 13 }),
      S('path', { class: 'nose', d: 'M0 -17 L6 -7 L-6 -7 Z' }),
      S('circle', { class: 'eye', r: 4.5, cy: 1 })));
    if (mark) {
      kids.push(S('g', { class: 'mo-badge ' + mark.cls, transform: 'translate(' + (w - 18) + ' 18)' },
        S('circle', { r: 13 }), S('text', { y: 5, 'text-anchor': 'middle' }, mark.sym)));
    }
    return S.apply(null, ['svg', { class: 'mo-svg', viewBox: '0 0 ' + w + ' ' + ht, role: 'img', 'aria-label': '' }].concat(kids));
  }

  var el, api, prog, locked, step, timer, status, boardsEl, listEl, infoEl;

  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
  function reset() { stopTimer(); prog = []; step = null; status = null; }

  function levelNote(lv, sim) {
    var s = sim.states[step == null ? sim.states.length - 1 : Math.min(step, sim.states.length - 1)];
    var dirs = ['nach oben', 'nach rechts', 'nach unten', 'nach links'];
    return lv.name + ': ' + (sim.reached ? 'Ziel erreicht' : 'Ziel nicht erreicht') + '. Roboter steht in Zeile ' + (s.r + 1) + ', Spalte ' + (s.c + 1) + ' und schaut ' + dirs[s.d] + '.';
  }

  function render() {
    var playing = step != null;
    var shown = playing ? step : prog.length;
    boardsEl.replaceChildren.apply(boardsEl, LEVELS.map(function (lv) {
      var sim = simulate(lv, prog);
      var upto = Math.min(shown, sim.states.length - 1);
      var done = !playing && prog.length > 0;
      var ok = sim.reached;
      var reachedNow = playing ? !!sim.states[upto].reached : ok;
      var svg = board(lv, sim, upto, prog.length > 0, done ? { cls: ok ? 'ok' : 'no', sym: ok ? '✓' : '✗' } : null);
      svg.setAttribute('aria-label', levelNote(lv, sim));
      return h('figure', { class: 'mo-level' + (done && ok ? ' ok' : '') + (status === 'check' && !ok ? ' wrong' : '') },
        h('figcaption', null, lv.name, h('span', { class: 'mo-state' }, prog.length === 0 ? '' : (reachedNow ? ' · Ziel erreicht' : playing ? '' : ' · Ziel nicht erreicht'))),
        svg);
    }));

    /* Programmliste */
    var items = prog.map(function (cmd, i) {
      return h('li', { class: 'mo-step' + (playing && i === step - 1 ? ' now' : '') },
        h('span', { class: 'mo-ic', 'aria-hidden': 'true' }, CMD[cmd].icon),
        h('span', { class: 'mo-lab' }, CMD[cmd].label),
        h('button', { type: 'button', class: 'mo-del', 'data-del': String(i), disabled: locked, 'aria-label': 'Befehl ' + (i + 1) + ' entfernen: ' + CMD[cmd].short }, '×'));
    });
    listEl.replaceChildren(prog.length ? h('ol', { class: 'mo-prog' }, items) : h('p', { class: 'mo-empty' }, 'Dein Programm ist noch leer. Tippe unten auf Befehle.'));

    var n = prog.length;
    var msg = 'Programm: ' + n + (n === 1 ? ' Befehl' : ' Befehle');
    if (n && !playing) {
      var cnt = LEVELS.filter(function (lv) { return simulate(lv, prog).reached; }).length;
      msg += ' · ' + cnt + ' von 3 Leveln geschafft';
    }
    infoEl.textContent = msg;
    infoEl.dataset.long = '';

    ORDER.forEach(function (k) {
      var b = el.querySelector('[data-add="' + k + '"]');
      if (b) b.disabled = locked || prog.length >= MAXLEN;
    });
    var play = el.querySelector('[data-play]');
    if (play) {
      play.disabled = locked || !n;
      play.textContent = playing ? 'Anhalten' : 'Ablauf zeigen';
    }
    var clr = el.querySelector('[data-clear]');
    if (clr) clr.disabled = locked || !n;
  }

  function changed() { api.changed(); }

  function add(k) {
    if (locked || prog.length >= MAXLEN) return;
    stopTimer(); step = null;
    prog.push(k);
    render(); changed();
  }
  function del(i) {
    if (locked) return;
    stopTimer(); step = null;
    prog.splice(i, 1);
    render(); changed();
  }
  function togglePlay() {
    if (locked || !prog.length) return;
    if (step != null) { stopTimer(); step = null; render(); return; }
    step = 0; render();
    timer = setInterval(function () {
      step++;
      if (step > prog.length) { stopTimer(); step = null; }
      render();
    }, 600);
  }

  function onClick(e) {
    var t = e.target.closest('[data-add],[data-del],[data-play],[data-clear]');
    if (!t || locked) return;
    if (t.dataset.add) return add(t.dataset.add);
    if (t.dataset.del != null && t.dataset.del !== '') return del(+t.dataset.del);
    if (t.hasAttribute('data-play')) return togglePlay();
    if (t.hasAttribute('data-clear')) { stopTimer(); step = null; prog = []; render(); changed(); }
  }

  Biber.register({
    id: 'momos',
    story: '<p>In einem von Momos Computerspielen kann ein Roboter über Felder fahren. Wenn er vor ein Hindernis (eine Holzkiste) oder die Wand fährt, geht es nicht mehr weiter. Dann muss der Roboter die Richtung wechseln.</p>' +
      '<p>In jedem Level des Spiels können die Hindernisse und auch das Ziel (der grüne Kreis) woanders sein. Ein Level ist geschafft, wenn der Roboter das Ziel erreicht.</p>' +
      '<p>Momo kann den Roboter mit Programmen steuern. Für seine Programme kann er diese vier Befehle benutzen:</p>' +
      '<ul class="mo-cmds">' + ORDER.map(function (k) { return '<li><span class="mo-ic" aria-hidden="true">' + CMD[k].icon + '</span>' + CMD[k].label + '</li>'; }).join('') + '</ul>' +
      '<p>Momo kennt die nächsten drei Level. Er möchte ein Programm mit möglichst wenigen Befehlen haben, das alle drei Level schafft.</p>',
    question: 'Erstelle so ein Programm für Momo!',
    howto: 'Tippe auf die Befehle, um sie hinten an dein Programm zu hängen. Mit × nimmst du einen Befehl wieder heraus. „Ablauf zeigen“ lässt den Roboter in allen drei Leveln Schritt für Schritt fahren. Dasselbe Programm gilt für alle drei Level.',
    explanation: function () {
      return '<p>Das Programm mit nur ' + BEST + ' Befehlen ist: <strong>vorwärts bis zum Hindernis, im Uhrzeigersinn drehen, vorwärts bis zum Hindernis, gegen den Uhrzeigersinn drehen, vorwärts bis zum Hindernis.</strong> ' +
        'Der Roboter fährt immer erst bis zum Hindernis, biegt rechts ab, fährt wieder bis zum Hindernis, biegt nach links ab und fährt zum Ziel. In jedem Level liegt das Ziel genau dort, wo er am Ende ankommt.</p>' +
        '<ol class="mo-prog mo-sol">' + SOLUTION.map(function (k) { return '<li><span class="mo-ic" aria-hidden="true">' + CMD[k].icon + '</span><span class="mo-lab">' + CMD[k].label + '</span></li>'; }).join('') + '</ol>' +
        '<p>Der Befehl „Fahre vorwärts, bis es nicht mehr weitergeht“ wiederholt „ein Feld vorwärts“ so oft wie nötig. So passt ein Programm zu vielen verschiedenen Leveln. Weniger als ' + BEST + ' Befehle reichen nicht, das haben wir mit dem Computer alle Möglichkeiten durchprobiert.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      boardsEl = h('div', { class: 'mo-boards' });
      listEl = h('div', { class: 'mo-list', 'aria-live': 'polite' });
      infoEl = h('p', { class: 'mo-info', role: 'status' });
      el.replaceChildren(h('div', { class: 'mo-wrap' },
        boardsEl,
        h('div', { class: 'mo-edit' },
          h('div', { class: 'mo-pal' },
            h('h3', null, 'Befehle'),
            ORDER.map(function (k) {
              return h('button', { type: 'button', class: 'mo-cmd', 'data-add': k, 'aria-label': 'Befehl anhängen: ' + CMD[k].label },
                h('span', { class: 'mo-ic', 'aria-hidden': 'true' }, CMD[k].icon), CMD[k].label);
            })),
          h('div', { class: 'mo-pg' },
            h('h3', null, 'Dein Programm'),
            listEl, infoEl,
            h('div', { class: 'mo-tools' },
              h('button', { type: 'button', class: 'btn ghost', 'data-play': '' }, 'Ablauf zeigen'),
              h('button', { type: 'button', class: 'btn ghost', 'data-clear': '' }, 'Programm leeren'))))));
      el.addEventListener('click', onClick);
      render();
    },
    isComplete: function () { return prog.length > 0; },
    evaluate: function () {
      stopTimer(); step = null;
      return { correct: solvesAll(prog) && prog.length === BEST, answer: prog.slice() };
    },
    setAnswer: function (ans) {
      stopTimer(); step = null;
      prog = ans.slice();
      status = 'check';
      render();
    },
    lock: function (on) {
      stopTimer(); step = null;
      locked = on;
      status = on ? 'check' : null;
      render();
      if (on) {
        var ok = solvesAll(prog), n = prog.length;
        infoEl.textContent = ok ? (n === BEST ? n + ' Befehle: alle drei Level geschafft, kürzer geht es nicht.' : n + ' Befehle: alle drei Level geschafft, aber es geht mit weniger Befehlen.')
          : n + (n === 1 ? ' Befehl' : ' Befehle') + ': nicht alle Level geschafft.';
      }
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      stopTimer(); step = null;
      prog = SOLUTION.slice();
      locked = true;
      status = 'solution';
      render();
      infoEl.textContent = SOLUTION.length + ' Befehle: alle drei Level geschafft.';
    }
  });
})();
