/* Aufgabe Ballon-Maschine 1 (Biber 2024, S. 9; Klasse 3-4 schwer): Reihenfolge der Anweisungen (Sequenz) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-ballon124-';

  /* Rahmen 100 x 100. Lage der Ballons laut Bild im Heft:
     B und C kommen von links (Höhe y), A von oben, D und E von unten (Spalte x). */
  var BALLOONS = {
    A: { dir: 'down', pos: 60 },
    B: { dir: 'right', pos: 20 },
    C: { dir: 'right', pos: 44 },
    D: { dir: 'up', pos: 40 },
    E: { dir: 'up', pos: 80 }
  };
  var LETTERS = ['A', 'B', 'C', 'D', 'E'];
  /* Gewünschtes Bild: Länge jedes Ballons (aus dem Bild im Heft) */
  var TARGET = { A: 20, B: 100, C: 80, D: 56, E: 80 };
  var SOLUTION = 'BECDA';   /* eine der vier richtigen Folgen (im Heft als Beispiel gezeigt) */

  /* Segment eines aufgeblasenen Ballons als {x0,x1,y0,y1} */
  function seg(k, len) {
    var b = BALLOONS[k];
    if (b.dir === 'right') return { x0: 0, x1: len, y0: b.pos, y1: b.pos };
    if (b.dir === 'down') return { x0: b.pos, x1: b.pos, y0: 0, y1: len };
    return { x0: b.pos, x1: b.pos, y0: 100 - len, y1: 100 };
  }

  /* Die Maschine: liest die Buchstaben der Reihe nach und bläst den jeweiligen Ballon auf,
     bis er einen anderen (bereits aufgeblasenen) Ballon oder den gegenüberliegenden Rand berührt. */
  function simulate(seq) {
    var len = {};
    for (var i = 0; i < seq.length; i++) {
      var k = seq[i], b = BALLOONS[k];
      if (len[k] != null) continue;
      var stop = 100, others = Object.keys(len);
      others.forEach(function (o) {
        var s = seg(o, len[o]), ob = BALLOONS[o];
        if (ob.dir === b.dir || (ob.dir === 'up' && b.dir === 'down') || (ob.dir === 'down' && b.dir === 'up')) return;
        if (b.dir === 'right') {                 /* waagerecht: trifft senkrechte Ballons, deren Höhenbereich y enthält */
          if (ob.dir === 'right') return;
          if (s.y0 <= b.pos && b.pos <= s.y1) stop = Math.min(stop, s.x0);
        } else if (b.dir === 'down') {           /* von oben: trifft waagerechte Ballons, deren Bereich x enthält */
          if (ob.dir !== 'right') return;
          if (s.x0 <= b.pos && b.pos <= s.x1) stop = Math.min(stop, s.y0);
        } else {                                 /* von unten */
          if (ob.dir !== 'right') return;
          if (s.x0 <= b.pos && b.pos <= s.x1) stop = Math.min(stop, 100 - s.y0);
        }
      });
      len[k] = stop;
    }
    return len;
  }
  function sameAsTarget(len) {
    return LETTERS.every(function (k) { return len[k] != null && Math.abs(len[k] - TARGET[k]) < 0.5; });
  }
  function isRight(seq) { return seq.length === 5 && sameAsTarget(simulate(seq)); }

  /* ---------- Zeichnung ---------- */
  function badge(k) {
    var b = BALLOONS[k], x, y;
    if (b.dir === 'right') { x = -12; y = b.pos; }
    else if (b.dir === 'down') { x = b.pos; y = -12; }
    else { x = b.pos; y = 112; }
    return '<g><circle cx="' + x + '" cy="' + y + '" r="6.4" class="' + P + 'badge"/><text x="' + x + '" y="' + (y + 3.2) + '" text-anchor="middle" class="' + P + 'bt">' + k + '</text></g>';
  }
  function balloonSvg(k, len) {
    var b = BALLOONS[k], d, n;
    if (b.dir === 'right') { n = 'M-5 ' + b.pos + 'L0 ' + b.pos; d = 'M0 ' + b.pos + 'L' + Math.max(len, 0.01) + ' ' + b.pos; }
    else if (b.dir === 'down') { n = 'M' + b.pos + ' -5L' + b.pos + ' 0'; d = 'M' + b.pos + ' 0L' + b.pos + ' ' + Math.max(len, 0.01); }
    else { n = 'M' + b.pos + ' 105L' + b.pos + ' 100'; d = 'M' + b.pos + ' 100L' + b.pos + ' ' + (100 - Math.max(len, 0.01)); }
    return '<path d="' + n + '" class="' + P + 'nozzle"/><path d="' + d + '" class="' + P + (len > 5 ? 'bal' : 'bal0') + '"/>';
  }
  function frameSvg(len, label) {
    var s = '<svg class="' + P + 'frame" viewBox="-20 -20 140 140" role="img" aria-label="' + label + '">' +
      '<rect x="-2" y="-2" width="104" height="104" rx="1" class="' + P + 'rim"/><rect x="0" y="0" width="100" height="100" class="' + P + 'floor"/>';
    LETTERS.forEach(function (k) { s += balloonSvg(k, len[k] || 0); });
    LETTERS.forEach(function (k) { s += badge(k); });
    return s + '</svg>';
  }
  function describe(len) {
    var parts = LETTERS.map(function (k) {
      var l = len[k];
      if (l == null) return k + ' ist noch leer';
      var b = BALLOONS[k];
      var how = l >= 99.5 ? 'ganz bis zum gegenüberliegenden Rand' : 'bis zu einem anderen Ballon';
      return k + ' ist aufgeblasen, ' + how;
    });
    return parts.join('; ');
  }

  var el, api, locked, mark;
  var seq, seqEl, poolEl, userEl, statusEl, slotBtns, poolBtns, targetEl;

  function reset() { seq = []; mark = null; }

  function refresh() {
    var len = simulate(seq);
    userEl.innerHTML = frameSvg(len, 'Dein Bild nach der Folge ' + (seq.length ? seq.join(' ') : '(noch leer)') + '. ' + describe(len));
    slotBtns.forEach(function (b, i) {
      var k = seq[i];
      b.textContent = k || '';
      b.classList.toggle('filled', !!k);
      b.classList.remove('right', 'wrong');
      b.setAttribute('aria-label', 'Schritt ' + (i + 1) + ': ' + (k ? 'Ballon ' + k + ' (antippen zum Entfernen)' : 'noch leer'));
      b.disabled = locked || !k;
      var m = b.querySelector('.' + P + 'mark');
      if (m) m.remove();
    });
    if (mark && seq.length === 5) {
      var ok = isRight(seq);
      slotBtns.forEach(function (b) {
        b.classList.add(ok ? 'right' : 'wrong');
        b.appendChild(h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
      });
    }
    poolBtns.forEach(function (b) {
      var used = seq.indexOf(b.dataset.k) >= 0;
      b.disabled = locked || used || seq.length >= 5;
      b.classList.toggle('used', used);
    });
    statusEl.textContent = seq.length === 0 ? 'Tippe die Buchstaben in der Reihenfolge an, in der die Maschine sie liest.'
      : seq.length < 5 ? 'Bisher gelesen: ' + seq.join(' ') + '. Noch ' + (5 - seq.length) + ' Buchstabe' + (seq.length === 4 ? '' : 'n') + '.'
        : 'Folge: ' + seq.join(' ') + '. Prüfe die Antwort, wenn das Bild stimmt.';
  }
  function add(k) {
    if (locked || seq.length >= 5 || seq.indexOf(k) >= 0) return;
    seq.push(k);
    mark = null;
    refresh();
    api.changed();
  }
  function removeAt(i) {
    if (locked || !seq[i]) return;
    seq.splice(i, 1);
    mark = null;
    refresh();
    api.changed();
  }
  function clearAll() {
    if (locked || !seq.length) return;
    seq = [];
    mark = null;
    refresh();
    api.changed();
  }

  Biber.register({
    id: 'ballon124',
    story:
      '<p>Eine Ballon-Maschine erstellt Bilder, indem sie Ballons in einem quadratischen Rahmen aufbläst. Die Ballons sind mit <b>A, B, C, D</b> und <b>E</b> beschriftet. ' +
      'Die Maschine liest nacheinander eine Folge von Buchstaben, von links nach rechts. Am Anfang sind alle Ballons leer.</p>' +
      '<p>Für jeden gelesenen Buchstaben bläst die Maschine den Ballon mit diesem Buchstaben auf, bis er <b>entweder einen anderen Ballon berührt oder den gegenüberliegenden Rand des Rahmens</b>. ' +
      'Liest sie zum Beispiel <b>E C</b>, wird zuerst E ganz bis nach oben aufgeblasen und danach C nach rechts, bis es E berührt.</p>',
    question: 'Die Maschine liest eine Folge von fünf Buchstaben und erstellt das Bild „So soll es werden“. Gib die Folge an.',
    howto: 'Tippe die Buchstaben der Reihe nach an. Im Rahmen „Dein Bild“ siehst du sofort, was die Maschine mit deiner Folge bisher macht. Tippe auf einen Buchstaben in der Folge, um ihn wieder zu entfernen.',
    explanation: function () {
      return '<p>Fast jeder Ballon endet an einem anderen Ballon. Das verrät die Reihenfolge: <b>B</b> muss vor <b>A</b> und vor <b>E</b> drankommen (sonst wären A und E länger geworden), <b>E</b> vor <b>C</b> und <b>C</b> vor <b>D</b>. ' +
        'Nur B reicht bis zum Rand und muss deshalb ganz am Anfang stehen.</p>' +
        '<p>A darf irgendwann nach B kommen. So gibt es genau vier richtige Folgen: <b>B A E C D</b>, <b>B E A C D</b>, <b>B E C A D</b> und <b>B E C D A</b>.</p>' +
        '<p>Die Buchstabenfolge ist wie ein kleines Programm, jeder Buchstabe eine Anweisung. Eine Folge von Anweisungen heißt in der Informatik <i>Sequenz</i>. ' +
        'Die Reihenfolge ist wichtig, weil eine Anweisung beeinflusst, was die späteren bewirken: Hier ändert sich die Länge der Ballons, die danach aufgeblasen werden.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      targetEl = h('div', { class: P + 'fig' });
      targetEl.innerHTML = frameSvg(TARGET, 'So soll das Bild aussehen: B reicht quer durch den ganzen Rahmen, E reicht von unten bis an B, C von links bis an E, D von unten bis an C und A von oben bis an B.');
      userEl = h('div', { class: P + 'fig' });
      statusEl = h('p', { class: P + 'status', role: 'status', 'aria-live': 'polite' });
      slotBtns = [0, 1, 2, 3, 4].map(function (i) {
        return h('button', { type: 'button', class: P + 'slot', onclick: function () { removeAt(i); } });
      });
      poolBtns = LETTERS.map(function (k) {
        var b = h('button', { type: 'button', class: P + 'letter', 'data-k': k, 'aria-label': 'Buchstabe ' + k + ' anhängen', onclick: function () { add(k); } }, k);
        return b;
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('div', { class: P + 'figs' },
          h('figure', { class: P + 'figure' }, targetEl, h('figcaption', null, 'So soll es werden')),
          h('figure', { class: P + 'figure' }, userEl, h('figcaption', null, 'Dein Bild'))),
        h('section', { 'aria-label': 'Folge' },
          h('h3', null, 'Die Folge'),
          h('div', { class: P + 'slots' }, slotBtns.map(function (b, i) { return h('div', { class: P + 'step' }, h('span', { class: P + 'no', 'aria-hidden': 'true' }, String(i + 1)), b); }))),
        h('section', { 'aria-label': 'Buchstaben' },
          h('h3', null, 'Buchstaben'),
          h('div', { class: P + 'pool' }, poolBtns,
            h('button', { type: 'button', class: 'btn ghost ' + P + 'clear', onclick: clearAll }, 'Folge löschen'))),
        statusEl));
      refresh();
    },
    isComplete: function () { return seq.length === 5; },
    evaluate: function () { return { correct: isRight(seq), answer: seq.join('') }; },
    setAnswer: function (ans) {
      seq = String(ans || '').split('').filter(function (k) { return BALLOONS[k]; });
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? 'check' : null;
      refresh();
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () { seq = SOLUTION.split(''); mark = 'check'; locked = true; refresh(); }
  });
})();
