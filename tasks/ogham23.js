/* Aufgabe Ogham (Biber 2023, Klasse 7-8 schwer, 9-10 mittel, 11-13 einfach) */
(function () {
  'use strict';
  var h = Biber.h, svg = Biber.svg;
  var P = 't-ogham23-';

  /* Ogham-Buchstaben: Gruppe (r = Striche rechts, l = links, q = quer durch die Linie, d = schräg) und Anzahl */
  var LETTERS = {
    B: ['r', 1], L: ['r', 2], S: ['r', 4], N: ['r', 5],
    A: ['q', 1], O: ['q', 2], E: ['q', 4],
    M: ['d', 1], G: ['d', 2], R: ['d', 5]
  };
  var WORDS = ['ANANAS', 'BANANE', 'MELONE', 'ORANGE'];
  /* Code 1-4 wie im Heft (von unten nach oben zu lesen) */
  var CODES = ['ORANGE', 'BANANE', 'MELONE', 'ANANAS'];

  var STEP = 8, GAP = 17, VW = 90, VH = 214, X0 = 45;

  function codeSvg(word, n) {
    var y = VH - 14, strokes = [];
    word.split('').forEach(function (ch, li) {
      var L = LETTERS[ch], t = L[0], cnt = L[1];
      if (li) y -= GAP;
      for (var k = 0; k < cnt; k++) {
        var yy = y - k * STEP, d;
        if (t === 'r') d = 'M' + X0 + ' ' + yy + 'H' + (X0 + 26);
        else if (t === 'q') d = 'M' + (X0 - 26) + ' ' + yy + 'H' + (X0 + 26);
        else d = 'M' + (X0 - 19) + ' ' + (yy - 8) + 'L' + (X0 + 19) + ' ' + (yy + 8);
        strokes.push(svg('path', { d: d, class: P + 'stroke' }));
      }
      y -= (cnt - 1) * STEP;
    });
    var top = y - 12;
    var g = svg('svg', {
      class: P + 'code', viewBox: '0 0 ' + VW + ' ' + VH, role: 'img',
      'aria-label': 'Ogham-Code ' + n + ': ' + word.length + ' Buchstaben, von unten nach oben zu lesen. Beschreibung: ' + describe(word)
    }, svg('path', { d: 'M' + X0 + ' ' + Math.max(4, top) + 'V' + (VH - 6), class: P + 'stem' }));
    strokes.forEach(function (s) { g.appendChild(s); });
    return g;
  }
  var TYPE_TXT = { r: 'rechts neben der Linie', q: 'quer durch die Linie', d: 'schräg durch die Linie' };
  function describe(word) {
    return word.split('').map(function (ch) {
      var L = LETTERS[ch];
      return L[1] + (L[1] === 1 ? ' Strich ' : ' Striche ') + TYPE_TXT[L[0]];
    }).join('; ');
  }

  var el, api, slots, selected, dragging, locked, mark;

  function reset() { slots = [null, null, null, null]; selected = null; dragging = null; mark = null; }

  function place(word, idx) {
    if (locked) return;
    var from = slots.indexOf(word);
    var existing = slots[idx];
    slots[idx] = word;
    if (from >= 0) slots[from] = existing === word ? null : existing;
    selected = null; mark = null;
    render();
    api.changed();
  }
  function release(word) {
    if (locked) return;
    var from = slots.indexOf(word);
    if (from >= 0) slots[from] = null;
    selected = null; mark = null;
    render();
    api.changed();
  }

  function render() {
    var pool = WORDS.map(function (w) {
      if (slots.indexOf(w) >= 0) return h('div', { class: P + 'cell', 'aria-hidden': 'true' });
      return h('button', {
        type: 'button', class: P + 'word' + (selected === w ? ' selected' : ''), 'data-word': w,
        draggable: locked ? false : 'true', 'aria-pressed': String(selected === w), 'aria-label': 'Wort ' + w + (selected === w ? ', ausgewählt' : ''), disabled: locked
      }, w);
    });
    var cols = CODES.map(function (code, i) {
      var w = slots[i];
      var cls = P + 'slot' + (w ? ' filled' : '');
      var m = null;
      if (mark === 'check') {
        var ok = w === code;
        cls += ok ? ' right' : ' wrong';
        m = h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      } else if (mark === 'solution') cls += ' right';
      return h('div', { class: P + 'col' },
        h('div', { class: P + 'num' }, 'Code ' + (i + 1)),
        h('div', { class: P + 'fig' }, codeSvg(code, i + 1)),
        h('button', {
          type: 'button', class: cls, 'data-slot': String(i), draggable: w && !locked ? 'true' : false, 'data-in-slot': w || false, disabled: locked,
          'aria-label': 'Feld unter Code ' + (i + 1) + ': ' + (w || 'leer')
        }, w ? h('span', { class: P + 'wtxt' }, w) : h('span', { class: P + 'ph' }, 'Wort hierher'), m));
    });
    el.replaceChildren(h('div', { class: P + 'board' },
      h('div', { class: P + 'codes' }, cols),
      h('section', { 'aria-label': 'Wörter' }, h('h3', null, 'Wörter'), h('div', { class: P + 'pool', 'data-pool': '' }, pool))));
  }

  function onClick(e) {
    var t = e.target.closest('[data-word],[data-slot]');
    if (!t || locked) return;
    if (t.dataset.word) { selected = selected === t.dataset.word ? null : t.dataset.word; render(); return; }
    var idx = +t.dataset.slot;
    if (selected) return place(selected, idx);
    if (slots[idx]) release(slots[idx]);
  }
  function onDragStart(e) {
    var t = e.target.closest('[data-word],[data-in-slot]');
    if (!t || locked) return;
    dragging = t.dataset.word || t.dataset.inSlot;
    e.dataTransfer.setData('text/plain', dragging);
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e) {
    var s = e.target.closest('[data-slot],[data-pool]');
    if (!s || !dragging) return;
    e.preventDefault();
    if (s.dataset.slot) s.classList.add('over');
  }
  function onDragLeave(e) { var s = e.target.closest('[data-slot]'); if (s) s.classList.remove('over'); }
  function onDrop(e) {
    var s = e.target.closest('[data-slot],[data-pool]');
    if (!s || !dragging) return;
    e.preventDefault();
    var w = dragging;
    dragging = null;
    if (s.dataset.slot) place(w, +s.dataset.slot); else release(w);
  }

  function allRight() { return CODES.every(function (c, i) { return slots[i] === c; }); }

  Biber.register({
    id: 'ogham23',
    story: '<p>Sue kennt das alte irische Alphabet Ogham. Jeder Buchstabe besteht aus einem oder mehreren Strichen, die entlang einer langen Linie angeordnet sind. Zwei aufeinander folgende Buchstaben werden durch einen Zwischenraum getrennt.</p>' +
      '<p>Sue benutzt Ogham als Code. Sie kodiert vier Wörter, ihre liebsten Obstsorten: <strong>ANANAS, BANANE, MELONE</strong> und <strong>ORANGE</strong>.</p>',
    question: 'Welches Wort passt zu welchem Ogham-Code?',
    howto: 'Ziehe jedes Wort in das Feld unter dem passenden Code. Du kannst auch erst das Wort und dann das Feld antippen.',
    explanation: function () {
      return '<p>Zuerst muss man herausfinden, in welcher Richtung die Buchstaben entlang der Linie stehen. Dabei hilft ANANAS: Der Buchstabe A kommt dreimal vor, mit je einem anderen Buchstaben dazwischen. Nur Code 4 hat einen Buchstaben, der dreimal vorkommt (ein einzelner Strich quer durch die Linie). Also gehört ANANAS zu Code 4, die Wörter werden von unten nach oben geschrieben, und A ist ein Strich quer durch die Linie. N sind fünf Striche rechts neben der Linie.</p>' +
        '<p>Nur Code 2 hat den Buchstaben A zweimal, dazu passt BANANE. ORANGE hat nur ein A und gehört zu Code 1. Für MELONE bleibt Code 3 übrig, und die bekannten Buchstaben E und N sitzen dort an den passenden Stellen.</p>' +
        '<p>Einen unbekannten Text zu entschlüsseln, dessen Klartext man kennt, ist hier nicht schwer. Ohne Klartext hilft oft, die Häufigkeit von Buchstaben und Wörtern zu untersuchen. So wurden auch alte Schriften entziffert.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('dragleave', onDragLeave);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', function () { dragging = null; if (!locked) render(); });
      render();
    },
    isComplete: function () { return slots.every(Boolean); },
    evaluate: function () { return { correct: allRight(), answer: slots.slice() }; },
    setAnswer: function (ans) {
      slots = (ans || []).slice(0, 4);
      while (slots.length < 4) slots.push(null);
      selected = null;
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      if (on) { if (mark !== 'solution') mark = 'check'; } else mark = null;
      selected = null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      slots = CODES.slice();
      selected = null;
      mark = 'solution';
      render();
    }
  });
})();
