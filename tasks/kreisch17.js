/* Aufgabe Kreisch! (Biber 2017; Klasse 5-6 mittel): zwei Tänzer, Reaktionen des Publikums, gleiches Feld am Ende */
(function () {
  'use strict';
  var h = Biber.h, sv = Biber.svg;
  var P = 't-kr17-';

  var ROWS = 6, COLS = 9;
  var START = { elena: [3, 6], dustin: [3, 2] };   /* [Zeile, Spalte], 0-basiert, Zeile 0 = oben */
  var DIR = { L: [0, -1], R: [0, 1], U: [-1, 0], D: [1, 0] };
  var DIRN = { L: 'nach links', R: 'nach rechts', U: 'nach oben', D: 'nach unten' };
  var REACTIONS = ['Wow', 'Kreisch', 'Klatsch', 'Buh'];
  var MOVES = {
    elena:  { Wow: 'LU', Kreisch: 'UL', Klatsch: 'LLU', Buh: 'DD' },
    dustin: { Wow: 'UR', Kreisch: 'RD', Klatsch: 'UUU', Buh: 'LL' }
  };
  var OPTIONS = [
    { id: 'A', seq: ['Buh', 'Kreisch'] },
    { id: 'B', seq: ['Wow', 'Kreisch'] },
    { id: 'C', seq: ['Kreisch', 'Kreisch'] },
    { id: 'D', seq: ['Klatsch', 'Kreisch'] }
  ];
  var CORRECT = 'D';
  var PEOPLE = [['elena', 'Elena'], ['dustin', 'Dustin']];

  function label(seq) { return seq.map(function (r) { return r + '!'; }).join(' '); }
  function ser(node) { var d = document.createElement('div'); d.appendChild(node); return d.innerHTML; }

  /* Weg einer Person: Liste von Feldern, beginnend mit dem Startfeld */
  function walk(who, seq) {
    var p = START[who].slice(), pts = [p.slice()];
    seq.forEach(function (r) {
      MOVES[who][r].split('').forEach(function (m) { p[0] += DIR[m][0]; p[1] += DIR[m][1]; pts.push(p.slice()); });
    });
    return pts;
  }
  function endOf(who, seq) { var w = walk(who, seq); return w[w.length - 1]; }
  function meet(seq) { var a = endOf('elena', seq), b = endOf('dustin', seq); return a[0] === b[0] && a[1] === b[1]; }

  /* ---- Pfeile der Tabelle ---- */
  var ROT = { R: 0, D: 90, L: 180, U: 270 };
  function arrowsSvg(who, dirs) {
    var n = dirs.length, x0 = (60 - n * 20) / 2;
    var kids = dirs.split('').map(function (d, i) {
      return sv('path', { class: P + 'arr ' + P + who, d: 'M2 9.5H11V4.5L18.5 12L11 19.5V14.5H2Z', transform: 'translate(' + (x0 + i * 20) + ' 0) rotate(' + ROT[d] + ' 10 12)' });
    });
    var say = dirs.split('').map(function (d) { return DIRN[d]; }).join(', dann ');
    return sv.apply(null, ['svg', { viewBox: '0 0 60 24', class: P + 'arrows', role: 'img', 'aria-label': say, focusable: 'false' }].concat(kids));
  }
  function tableNode() {
    var head = h('tr', null, h('td', null), REACTIONS.map(function (r) { return h('th', { scope: 'col' }, r + '!'); }));
    var rows = PEOPLE.map(function (p) {
      return h('tr', null,
        h('th', { scope: 'row' }, h('img', { src: 'assets/kreisch17/' + p[0] + '.png', alt: '', width: 40, height: 40 }), h('span', null, p[1])),
        REACTIONS.map(function (r) { return h('td', null, arrowsSvg(p[0], MOVES[p[0]][r])); }));
    });
    return h('table', { class: P + 'tab' }, h('caption', { class: P + 'sr' }, 'Tanzschritte von Elena und Dustin für jede Reaktion des Publikums'), h('thead', null, head), h('tbody', null, rows));
  }

  /* ---- Tanzfläche ---- */
  var CELL = 40, W = COLS * CELL, H = ROWS * CELL;
  function cx(c) { return c * CELL + CELL / 2; }
  function cy(r) { return r * CELL + CELL / 2; }

  function face(who, r, c, size, dx, extra) {
    return sv('image', {
      href: 'assets/kreisch17/' + who + '.png', x: cx(c) + (dx || 0) - size / 2, y: cy(r) - size / 2, width: size, height: size,
      preserveAspectRatio: 'xMidYMid meet', class: P + 'face' + (extra ? ' ' + extra : '')
    });
  }
  function arrowSeg(a, b, cls) {
    var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.sqrt(dx * dx + dy * dy), ux = dx / len, uy = dy / len;
    var s = [a[0] + ux * 7, a[1] + uy * 7], e = [b[0] - ux * 3, b[1] - uy * 3];
    var bx = e[0] - ux * 8, by = e[1] - uy * 8, nx = -uy * 5, ny = ux * 5;
    function f(n) { return Math.round(n * 10) / 10; }
    return [
      sv('line', { class: P + 'path ' + cls, x1: f(s[0]), y1: f(s[1]), x2: f(bx), y2: f(by) }),
      sv('polygon', { class: P + 'head ' + cls, points: f(e[0]) + ',' + f(e[1]) + ' ' + f(bx + nx) + ',' + f(by + ny) + ' ' + f(bx - nx) + ',' + f(by - ny) })
    ];
  }

  /* seq = null: nur Startaufstellung; sonst Wege und Endfelder */
  function board(seq, aria) {
    var kids = [];
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      kids.push(sv('rect', { class: P + 'cell', x: c * CELL + 2, y: r * CELL + 2, width: CELL - 4, height: CELL - 4, rx: 7 }));
    }
    if (!seq) {
      PEOPLE.forEach(function (p) { kids.push(face(p[0], START[p[0]][0], START[p[0]][1], 32)); });
    } else {
      var off = { elena: [4, 4], dustin: [-4, -4] };
      PEOPLE.forEach(function (p) { kids.push(face(p[0], START[p[0]][0], START[p[0]][1], 30, 0, P + 'ghost')); });
      PEOPLE.forEach(function (p) {
        var pts = walk(p[0], seq).map(function (q) { return [cx(q[1]) + off[p[0]][0], cy(q[0]) + off[p[0]][1]]; });
        for (var i = 1; i < pts.length; i++) arrowSeg(pts[i - 1], pts[i], P + p[0]).forEach(function (n) { kids.push(n); });
      });
      var same = meet(seq), e = endOf('elena', seq), d = endOf('dustin', seq);
      if (same) {
        kids.push(face('dustin', d[0], d[1], 24, -9));
        kids.push(face('elena', e[0], e[1], 24, 9));
      } else {
        [['elena', e], ['dustin', d]].forEach(function (x) {
          if (x[1][0] >= 0 && x[1][0] < ROWS && x[1][1] >= 0 && x[1][1] < COLS) kids.push(face(x[0], x[1][0], x[1][1], 30));
        });
      }
    }
    return sv.apply(null, ['svg', { viewBox: '0 0 ' + W + ' ' + H, class: P + 'svg', role: 'img', 'aria-label': aria, focusable: 'false' }].concat(kids));
  }
  function spot(p) { return 'Zeile ' + (p[0] + 1) + ', Spalte ' + (p[1] + 1); }
  var START_ARIA = 'Tanzfläche mit ' + COLS + ' Spalten und ' + ROWS + ' Zeilen. Dustin steht in ' + spot(START.dustin) + ', Elena in ' + spot(START.elena) + ' (von oben und von links gezählt).';

  function net(who, seq) {
    var a = START[who], b = endOf(who, seq), dr = b[0] - a[0], dc = b[1] - a[1], t = [];
    function fel(n) { return n + (n === 1 ? ' Feld' : ' Felder'); }
    if (dr) t.push(fel(Math.abs(dr)) + (dr < 0 ? ' nach oben' : ' nach unten'));
    if (dc) t.push(fel(Math.abs(dc)) + (dc < 0 ? ' nach links' : ' nach rechts'));
    return t.length ? t.join(' und ') : 'bleibt stehen';
  }

  /* ---- Antwortkarten ---- */
  var el, api, choice, locked, mark;
  function reset() { choice = null; mark = null; }

  function render() {
    var cards = OPTIONS.map(function (o, i) {
      var cls = P + 'card' + (choice === o.id ? ' sel' : '');
      var badge = null;
      if (mark === 'check' && choice === o.id) {
        var ok = o.id === CORRECT;
        cls += ok ? ' right' : ' wrong';
        badge = h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      } else if (mark === 'solution' && o.id === CORRECT) cls += ' right';
      var tab = choice ? (choice === o.id ? '0' : '-1') : (i === 0 ? '0' : '-1');
      return h('button', {
        type: 'button', role: 'radio', class: cls, 'data-opt': o.id, 'aria-checked': String(choice === o.id),
        tabindex: tab, disabled: locked, 'aria-label': o.id + ': ' + o.seq.join(', dann ')
      }, h('span', { class: P + 'letter', 'aria-hidden': 'true' }, o.id + ')'), h('span', { class: P + 'val', 'aria-hidden': 'true' }, label(o.seq)), badge);
    });
    el.replaceChildren(h('div', { class: P + 'wrap' },
      h('div', { class: P + 'floor' }, board(null, START_ARIA)),
      h('div', { class: P + 'board', role: 'radiogroup', 'aria-label': 'Die vier Antworten A bis D' }, cards)));
  }

  function pick(id) {
    if (locked) return;
    choice = id;
    render();
    var b = el.querySelector('[data-opt="' + id + '"]');
    if (b) b.focus();
    api.changed('Antwort ' + id + ' ausgewählt.');
  }
  function onClick(e) {
    var b = e.target.closest('[data-opt]');
    if (b && !locked) pick(b.dataset.opt);
  }
  function onKey(e) {
    var b = e.target.closest('[data-opt]');
    if (!b || locked) return;
    var i = OPTIONS.map(function (o) { return o.id; }).indexOf(b.dataset.opt), d = 0;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') d = 1;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') d = -1;
    else return;
    e.preventDefault();
    pick(OPTIONS[(i + d + OPTIONS.length) % OPTIONS.length].id);
  }

  Biber.register({
    id: 'kreisch17',
    story: '<p>Elena und Dustin nehmen an einer Tanzshow teil. Je nach Reaktion des Publikums führen sie gleichzeitig bestimmte Tanzschritte aus. Die Tabelle zeigt, wie sie sich über die Felder der Tanzfläche bewegen:</p>' +
      ser(tableNode()) +
      '<p>Wenn zum Beispiel das Publikum kreischt, bewegt Elena sich um ein Feld nach oben und danach um ein Feld nach links; gleichzeitig bewegt sich Dustin um ein Feld nach rechts und danach um ein Feld nach unten.</p>' +
      '<p>Elena und Dustin starten auf der Tanzfläche unten auf den abgebildeten Feldern. Das Publikum möchte, dass die beiden am Ende auf dem gleichen Feld stehen.</p>',
    question: 'Welche Reaktionen muss das Publikum dazu zeigen?',
    howto: 'Die beiden Reaktionen kommen nacheinander, zuerst die linke. Tippe auf die Antwort, die du für richtig hältst.',
    explanation: function () {
      var figs = OPTIONS.map(function (o) {
        var same = meet(o.seq);
        var aria = 'Antwort ' + o.id + ', ' + label(o.seq) + ': Elena endet in ' + spot(endOf('elena', o.seq)) + ', Dustin in ' + spot(endOf('dustin', o.seq)) + '.';
        return '<figure class="' + P + 'fig' + (same ? ' ' + P + 'good' : '') + '"><figcaption><strong>Antwort ' + o.id + ': ' + label(o.seq) + '</strong></figcaption>' +
          ser(board(o.seq, aria)) +
          '<p>Elena: ' + net('elena', o.seq) + '. Dustin: ' + net('dustin', o.seq) + '. ' +
          (same ? '<strong>Beide stehen auf dem gleichen Feld.</strong>' : 'Sie stehen auf verschiedenen Feldern.') + '</p></figure>';
      }).join('');
      return '<p>Richtig ist <strong>Klatsch! Kreisch!</strong> Dabei bewegt sich Elena insgesamt zwei Felder nach oben und drei nach links, Dustin zwei Felder nach oben und eines nach rechts. Am Anfang standen beide in derselben Zeile, vier Felder auseinander; am Ende sind sie wieder in derselben Zeile und haben sich um vier Felder aufeinander zu bewegt. Bei den anderen Antworten stehen sie am Ende auf verschiedenen Feldern.</p>' +
        '<div class="' + P + 'figs">' + figs + '</div>' +
        '<p>Elena und Dustin handeln unabhängig voneinander, benutzen aber dieselbe Tanzfläche. In einem Computer nennt man solche unabhängig handelnden Akteure <em>Prozesse</em>; ihre gemeinsamen Arbeitsmittel, etwa der Arbeitsspeicher, heißen <em>Ressourcen</em>. Wollen zwei Prozesse gleichzeitig dieselbe Ressource nutzen, gerät leicht alles durcheinander. Darum regelt das Betriebssystem, wer welche Ressource bekommt.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKey);
      render();
    },
    isComplete: function () { return !!choice; },
    evaluate: function () { return { correct: choice === CORRECT, answer: { choice: choice } }; },
    setAnswer: function (ans) {
      choice = ans && ans.choice ? ans.choice : null;
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? 'check' : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      choice = CORRECT; mark = 'solution'; locked = true;
      render();
    }
  });
})();
