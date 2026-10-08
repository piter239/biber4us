/* Aufgabe Schatzsuche (Biber 2023, Klasse 5-6 schwer, 7-8 mittel, 9-10 einfach) */
(function () {
  'use strict';
  var h = Biber.h, svg = Biber.svg;
  var P = 't-schatzsuche23-';

  var CS = 64;            /* Kantenlänge eines Feldes im SVG */
  var COLS = 'ABCDEFG';
  /* Spielbrett 7 x 4: Spalte, Zeile (0-basiert) */
  var BIG = { cols: 7, rows: 4 };
  var PATH = [
    { c: 5, r: 0 },
    { c: 5, r: 1, fb: 'near' },
    { c: 5, r: 2, fb: 'far' },
    { c: 4, r: 2, fb: 'near' },
    { c: 4, r: 3, fb: 'far' },
    { c: 3, r: 3, fb: 'near' },
    { c: 2, r: 3, fb: 'near' },
    { c: 1, r: 3, fb: 'far' },
    { c: 1, r: 2, fb: 'near' },
    { c: 1, r: 1, fb: 'near' }
  ];
  /* blau markierte Felder = mögliche Schatzfelder */
  var CANDS = ['A1', 'B1', 'C1', 'A2', 'C2'];
  var RIGHT = 'C2';

  function name(c, r) { return COLS.charAt(c) + (r + 1); }
  function dist(a, b) { return Math.abs(a.c - b.c) + Math.abs(a.r - b.r); }

  /* ---- kleine Symbole (Mittelpunkt 0/0, Größe ca. 32 x 32) ---- */
  function flame() {
    return svg('g', { class: P + 'flame', 'aria-hidden': 'true' },
      svg('path', { d: 'M0 -15C2 -8 11 -5 11 5A11 11 0 0 1 -11 5C-11 -2 -6 -4 -5 -10C-3 -8 -2 -8 -2 -8C-1 -11 -1 -12 0 -15Z', class: P + 'f1' }),
      svg('path', { d: 'M0 -3C1 1 6 3 6 8A6 6 0 0 1 -6 8C-6 4 -3 3 0 -3Z', class: P + 'f2' }));
  }
  function snow() {
    return svg('g', { class: P + 'snow', 'aria-hidden': 'true' },
      svg('path', { d: 'M0 -14V14M-12.1 -7L12.1 7M-12.1 7L12.1 -7M-3.5 -11L0 -8L3.5 -11M-3.5 11L0 8L3.5 11M-9 -9.5L-6.1 -5.5L-10.3 -4.5M9 9.5L6.1 5.5L10.3 4.5M9 -9.5L6.1 -5.5L10.3 -4.5M-9 9.5L-6.1 5.5L-10.3 4.5' }));
  }
  function star() {
    return svg('polygon', { class: P + 'star', 'aria-hidden': 'true', points: '0,-15 4.4,-5.2 15,-4.6 6.9,2.3 9.5,12.6 0,7 -9.5,12.6 -6.9,2.3 -15,-4.6 -4.4,-5.2' });
  }
  function pawn() {
    return svg('g', { class: P + 'pawn', 'aria-hidden': 'true' },
      svg('ellipse', { cx: 4, cy: 15, rx: 12, ry: 3.5, class: P + 'shadow' }),
      svg('path', { d: 'M-9 15C-9 8 -4 6 -3 -2L3 -2C4 6 9 8 9 15Z' }),
      svg('circle', { cx: 0, cy: -9, r: 7 }));
  }
  function arrow(x, y, dir) {
    var rot = { right: 0, down: 90, left: 180, up: 270 }[dir];
    return svg('path', { d: 'M-9 0H8M2 -6L9 0L2 6', class: P + 'arrow', transform: 'translate(' + x + ' ' + y + ') rotate(' + rot + ')', 'aria-hidden': 'true' });
  }
  function use(node, x, y, s) { var g = svg('g', { transform: 'translate(' + x + ' ' + y + ')' + (s ? ' scale(' + s + ')' : '') }); g.appendChild(node); return g; }

  function stepDir(a, b) { return b.c > a.c ? 'right' : b.c < a.c ? 'left' : b.r > a.r ? 'down' : 'up'; }

  /* ---- Beispielbrett (3 x 3) ---- */
  function smallBoard() {
    var ox = 4, oy = 4, w = 3 * CS + 8;
    var s = svg('svg', {
      class: P + 'svg ' + P + 'small', viewBox: '0 0 ' + w + ' ' + w, role: 'img',
      'aria-label': 'Kleines Spielbrett mit 3 mal 3 Feldern. Der Schatz liegt links in der mittleren Reihe. Daniel startet rechts oben mit Entfernung 3, geht ein Feld nach unten (Entfernung 2, näher: Flamme) und noch eines nach unten (Entfernung 3, weiter weg: Schneeflocke).'
    });
    var path = [{ c: 2, r: 0, d: 3 }, { c: 2, r: 1, d: 2, fb: 'near' }, { c: 2, r: 2, d: 3, fb: 'far' }];
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
      var on = c === 2;
      s.appendChild(svg('rect', { x: ox + c * CS, y: oy + r * CS, width: CS, height: CS, class: P + 'cell' + (on ? ' ' + P + 'seen' : '') }));
    }
    s.appendChild(use(star(), ox + CS / 2, oy + CS + CS / 2));
    path.forEach(function (p, i) {
      var x = ox + p.c * CS, y = oy + p.r * CS;
      s.appendChild(svg('text', { x: x + 6, y: y + 24, class: P + 'dist' }, String(p.d)));
      if (i === 0) s.appendChild(use(pawn(), x + CS * 0.62, y + CS * 0.55, 1.15));
      else s.appendChild(use(p.fb === 'near' ? flame() : snow(), x + CS * 0.62, y + CS * 0.6, 1.2));
      if (i < 2) s.appendChild(arrow(x + CS - 7, y + CS, 'down'));
    });
    return s;
  }

  /* ---- großes Spielbrett ---- */
  var el, api, boardSvg, statusEl, sel, locked, mark;

  function bigBoard() {
    var ox = 26, oy = 24, W = ox + BIG.cols * CS + 4, H = oy + BIG.rows * CS + 4;
    var s = svg('svg', {
      class: P + 'svg ' + P + 'big', viewBox: '0 0 ' + W + ' ' + H, role: 'group',
      'aria-label': 'Großes Spielbrett mit 7 Spalten (A bis G) und 4 Zeilen (1 bis 4). Blau markiert sind die fünf möglichen Schatzfelder A1, B1, C1, A2 und C2.'
    });
    var gCells = svg('g', null), gLab = svg('g', { 'aria-hidden': 'true' }), gMark = svg('g', { 'aria-hidden': 'true' });
    for (var c = 0; c < BIG.cols; c++) gLab.appendChild(svg('text', { x: ox + c * CS + CS / 2, y: 17, class: P + 'axis', 'text-anchor': 'middle' }, COLS.charAt(c)));
    for (var r = 0; r < BIG.rows; r++) gLab.appendChild(svg('text', { x: 11, y: oy + r * CS + CS / 2 + 5, class: P + 'axis', 'text-anchor': 'middle' }, String(r + 1)));
    var visited = {};
    PATH.forEach(function (p) { visited[name(p.c, p.r)] = p; });
    for (var rr = 0; rr < BIG.rows; rr++) for (var cc = 0; cc < BIG.cols; cc++) {
      (function (c, r) {
        var n = name(c, r), x = ox + c * CS, y = oy + r * CS;
        var cand = CANDS.indexOf(n) >= 0, v = visited[n];
        var g = svg('g', { class: P + 'fld' + (cand ? ' ' + P + 'cand' : '') + (v ? ' ' + P + 'seen' : ''), 'data-cell': n });
        g.appendChild(svg('rect', { x: x, y: y, width: CS, height: CS, class: P + 'cell' }));
        if (cand) {
          g.setAttribute('role', 'button');
          g.setAttribute('tabindex', '0');
          g.appendChild(svg('rect', { x: x + 3, y: y + 3, width: CS - 6, height: CS - 6, class: P + 'ring', rx: 4 }));
        }
        if (v) {
          if (v === PATH[0]) g.appendChild(use(pawn(), x + CS / 2, y + CS / 2, 1.3));
          else g.appendChild(use(v.fb === 'near' ? flame() : snow(), x + CS / 2, y + CS / 2 + 2, 1.35));
        }
        g.appendChild(svg('g', { class: P + 'slotmark', transform: 'translate(' + (x + CS / 2) + ' ' + (y + CS / 2 + 1) + ')' }));
        gCells.appendChild(g);
      })(cc, rr);
    }
    for (var i = 1; i < PATH.length; i++) {
      var a = PATH[i - 1], b = PATH[i], d = stepDir(a, b);
      var bx = ox + (a.c + b.c) / 2 * CS + CS / 2, by = oy + (a.r + b.r) / 2 * CS + CS / 2;
      gMark.appendChild(arrow(bx, by, d));
    }
    s.appendChild(gLab); s.appendChild(gCells); s.appendChild(gMark);
    return s;
  }

  function pathText() {
    var t = 'Daniels Weg: Start in ' + name(PATH[0].c, PATH[0].r) + '. ';
    for (var i = 1; i < PATH.length; i++) {
      t += 'Schritt ' + i + ' nach ' + name(PATH[i].c, PATH[i].r) + ': ' + (PATH[i].fb === 'near' ? 'näher dran (Flamme)' : 'weiter weg (Schneeflocke)') + '. ';
    }
    return t;
  }

  function paint() {
    [].forEach.call(boardSvg.querySelectorAll('[data-cell]'), function (g) {
      var n = g.getAttribute('data-cell'), cand = CANDS.indexOf(n) >= 0;
      var isSel = sel === n;
      g.classList.toggle('on', isSel);
      g.classList.toggle('right', isSel && (mark === 'solution' || (mark === 'check' && n === RIGHT)));
      g.classList.toggle('wrong', isSel && mark === 'check' && n !== RIGHT);
      var sm = g.querySelector('.' + P + 'slotmark');
      while (sm.firstChild) sm.removeChild(sm.firstChild);
      if (isSel) {
        var st = star();
        sm.appendChild(st);
        if (mark === 'check' && n !== RIGHT) {
          sm.appendChild(svg('path', { d: 'M-17 -17L17 17M17 -17L-17 17', class: P + 'cross' }));
        }
      }
      if (cand) {
        g.setAttribute('aria-pressed', String(isSel));
        g.setAttribute('aria-label', 'Feld ' + n + ' als Schatzversteck' + (isSel ? ', ausgewählt' : ''));
        g.setAttribute('tabindex', locked ? '-1' : '0');
        g.setAttribute('aria-disabled', locked ? 'true' : 'false');
      } else {
        g.setAttribute('aria-hidden', 'true');
      }
    });
    boardSvg.classList.toggle(P + 'locked', !!locked);
  }

  function choose(n) {
    if (locked || CANDS.indexOf(n) < 0) return;
    sel = sel === n ? null : n;
    mark = null;
    paint();
    api.changed(sel ? 'Gewählt: Feld ' + sel : '');
    statusEl.textContent = sel ? 'Du vermutest den Schatz auf Feld ' + sel + '.' : '';
  }

  function reset() { sel = null; mark = null; if (boardSvg) paint(); if (statusEl) statusEl.textContent = ''; }

  Biber.register({
    id: 'schatzsuche23',
    story: '<p>Nina und Daniel spielen Schatzsuche. Auf einem Spielbrett mit quadratischen Feldern wählt Nina im Kopf ein Feld aus. Dort ist der Schatz versteckt.</p>' +
      '<p>Daniel wählt ein Startfeld aus. Von dort geht er schrittweise mit seiner Spielfigur um je ein Feld weiter: nach links, rechts, oben oder unten. Nach jedem Schritt sagt Nina, ob Daniel nun <strong>näher</strong> (Flamme) am Schatz oder <strong>weiter weg</strong> (Schneeflocke) vom Schatz ist als vor dem Schritt.</p>' +
      '<p>Beim ersten Versuch nehmen sie ein kleines Spielbrett. Nina versteckt den Schatz auf dem Feld mit dem Stern. Daniel startet rechts oben und macht zwei Schritte entlang der Pfeile. Die Zahlen zeigen Daniels Entfernung vom Schatz: jeweils die kleinste Anzahl Schritte, mit denen er den Schatz aktuell erreichen könnte.</p>',
    question: 'Nun nehmen sie ein größeres Spielbrett. Nina versteckt den Schatz auf einem der blau markierten Felder. Das Bild zeigt Daniels Schritte und was Nina nach jedem Schritt sagt. Wo ist der Schatz versteckt?',
    howto: 'Tippe das blaue Feld an, auf dem der Schatz versteckt ist. Mit der Tastatur wählst du ein Feld mit Tab und Enter.',
    explanation: function () {
      return '<p>Daniel startet in Zeile 1, geht nach Zeile 2 und kommt näher. Der nächste Schritt nach Zeile 3 führt wieder weg, obwohl er in der gleichen Spalte bleibt. Also muss der Schatz in Zeile 2 liegen: Wer in einer anderen Spalte ist, hat den kürzesten Weg, wenn er erst in die Zeile des Schatzes geht.</p>' +
        '<p>Auf dem Rückweg in Zeile 4 kommt Daniel nach links bis Spalte C immer näher, in Spalte B aber wieder weiter weg. Also liegt der Schatz in Spalte C, und damit auf Feld <strong>C2</strong>. Schritte entlang eines Rasters misst man mit der Manhattan-Distanz: Das ist die Zahl der Schritte, die man bis zum Ziel mindestens gehen muss.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; sel = null; mark = null;
      boardSvg = bigBoard();
      statusEl = h('p', { class: P + 'status', 'aria-live': 'polite' });
      var legend = h('p', { class: P + 'legend' },
        h('span', null, svg('svg', { viewBox: '-16 -16 32 32', width: 22, height: 22, 'aria-hidden': 'true' }, flame()), ' näher am Schatz'),
        h('span', null, svg('svg', { viewBox: '-16 -16 32 32', width: 22, height: 22, 'aria-hidden': 'true' }, snow()), ' weiter weg vom Schatz'));
      el.replaceChildren(h('div', { class: P + 'wrap' },
        h('section', { class: P + 'part', 'aria-label': 'Erster Versuch' }, h('h3', null, 'Erster Versuch'), h('div', { class: P + 'smallwrap' }, smallBoard()), legend),
        h('section', { class: P + 'part', 'aria-label': 'Größeres Spielbrett' }, h('h3', null, 'Größeres Spielbrett'),
          h('div', { class: P + 'bigwrap' }, boardSvg), h('p', { class: P + 'sr' }, pathText()), statusEl)));
      boardSvg.addEventListener('click', function (e) {
        var g = e.target.closest('[data-cell]');
        if (g) choose(g.getAttribute('data-cell'));
      });
      boardSvg.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var g = e.target.closest('[data-cell]');
        if (g) { e.preventDefault(); choose(g.getAttribute('data-cell')); }
      });
      paint();
    },
    isComplete: function () { return !!sel; },
    evaluate: function () { return { correct: sel === RIGHT, answer: { cell: sel } }; },
    setAnswer: function (ans) { sel = ans && ans.cell || null; mark = 'check'; paint(); },
    lock: function (on) {
      locked = on;
      if (on) { if (mark !== 'solution') mark = 'check'; } else mark = null;
      paint();
    },
    reset: function () { reset(); },
    showSolution: function () { sel = RIGHT; mark = 'solution'; paint(); statusEl.textContent = 'Der Schatz liegt auf Feld C2.'; }
  });
})();
