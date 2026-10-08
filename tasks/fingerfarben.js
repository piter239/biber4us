/* Aufgabe Fingerfarben (Klasse 3-4, einfach) */
(function () {
  'use strict';
  var h = Biber.h;

  var DRAW = {
    z1: { alt: 'Zeichnung: senkrechter Stängel mit drei kleinen Knospen, zwei davon an Seitenzweigen', name: 'Stängel mit Seitenzweigen' },
    z2: { alt: 'Zeichnung: Grasbüschel mit einem hohen Bogen, der in einer Glocke endet', name: 'Gras mit Glockenblüte' },
    z3: { alt: 'Zeichnung: große gewellte Blüte auf kurzem Stiel mit zwei Blättern', name: 'Große Blüte' },
    z4: { alt: 'Zeichnung: zwei Stängel, die sich nach außen zu je einer Knospe biegen', name: 'Zwei Bögen mit Knospen' }
  };
  var PAINTED = [
    { id: 'b1', color: 'hellblau', answer: 'z2',
      why: 'Rechts oben schaut ein Stück des Bogens heraus, der in einer Knospe endet. Die Farbe links unten verdeckt die Grasblätter.' },
    { id: 'b2', color: 'rot', answer: 'z1',
      why: 'Unten in der Mitte ragt der senkrechte Stängel unter der Farbe hervor. Die Seitenzweige mit den Knospen liegen unter den roten Flächen.' },
    { id: 'b3', color: 'lila', answer: 'z4',
      why: 'Zwei gleich hohe Farbflecken links und rechts passen zu den zwei Knospen. Rechts ist ein Stück des gebogenen Stängels zu sehen.' },
    { id: 'b4', color: 'blau', answer: 'z3',
      why: 'Die Farbfläche ist die größte und deckt fast alles ab, wie bei der großen gewellten Blüte. Die anderen drei Zeichnungen sind schon vergeben.' }
  ];
  var ORDER = ['z1', 'z2', 'z3', 'z4'];

  function img(id, cls) {
    return h('img', { class: cls || 'ff-card', src: 'assets/fingerfarben/' + id + '.png', alt: DRAW[id] ? DRAW[id].alt : '', width: 368, height: 368, draggable: 'false' });
  }

  var el, api;
  var slots, selected, dragging, locked;

  function reset() { slots = [null, null, null, null]; selected = null; dragging = null; }

  function place(id, idx) {
    if (locked) return;
    var from = slots.indexOf(id);
    var existing = slots[idx];
    slots[idx] = id;
    if (from >= 0) slots[from] = existing === id ? null : existing;
    selected = null;
    render();
    api.changed();
  }
  function release(id) {
    if (locked) return;
    var from = slots.indexOf(id);
    if (from >= 0) slots[from] = null;
    selected = null;
    render();
    api.changed();
  }

  function render(markResult) {
    var filled = slots.filter(Boolean).length;
    var pool = ORDER.map(function (id) {
      if (slots.indexOf(id) >= 0) return h('div', { class: 'ff-cell', 'aria-hidden': 'true' });
      return h('button', {
        type: 'button', class: 'ff-drawing' + (selected === id ? ' selected' : ''), 'data-drawing': id,
        draggable: locked ? false : 'true', 'aria-pressed': String(selected === id), 'aria-label': DRAW[id].name, disabled: locked
      }, img(id));
    });
    var pairs = PAINTED.map(function (p, i) {
      var id = slots[i];
      var cls = 'ff-slot' + (id ? ' filled' : '');
      var mark = null;
      if (markResult === 'check') {
        var ok = id === p.answer;
        cls += ok ? ' right' : ' wrong';
        mark = h('span', { class: 'ff-mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      } else if (markResult === 'solution') cls += ' right';
      return h('div', { class: 'ff-pair' },
        h('img', { src: 'assets/fingerfarben/' + p.id + '.png', alt: 'Bemaltes Bild, ' + p.color, width: 368, height: 368, draggable: 'false' }),
        h('button', {
          type: 'button', class: cls, 'data-slot': String(i), draggable: id && !locked ? 'true' : false, 'data-in-slot': id || false, disabled: locked,
          'aria-label': 'Feld unter dem ' + p.color + ' bemalten Bild: ' + (id ? DRAW[id].name : 'leer')
        }, id ? img(id) : h('span', { class: 'ff-ph' }, 'hierher'), mark));
    });
    el.replaceChildren(h('div', { class: 'ff-board' },
      h('section', { 'aria-label': 'Zeichnungen' }, h('h3', null, 'Zeichnungen'), h('div', { class: 'ff-pool', 'data-pool': '' }, pool)),
      h('section', { 'aria-label': 'Bemalte Bilder' }, h('h3', null, 'Bemalte Bilder'), h('div', { class: 'ff-painted' }, pairs))));
  }

  function onClick(e) {
    var t = e.target.closest('[data-drawing],[data-slot]');
    if (!t || locked) return;
    if (t.dataset.drawing) {
      selected = selected === t.dataset.drawing ? null : t.dataset.drawing;
      render();
      return;
    }
    var idx = +t.dataset.slot;
    if (selected) return place(selected, idx);
    if (slots[idx]) release(slots[idx]);
  }
  function onDragStart(e) {
    var t = e.target.closest('[data-drawing],[data-in-slot]');
    if (!t || locked) return;
    dragging = t.dataset.drawing || t.dataset.inSlot;
    e.dataTransfer.setData('text/plain', dragging);
    e.dataTransfer.effectAllowed = 'move';
    t.classList.add('dragging');
  }
  function onDragOver(e) {
    var s = e.target.closest('[data-slot],[data-pool]');
    if (!s || !dragging) return;
    e.preventDefault();
    if (s.dataset.slot) s.classList.add('over');
  }
  function onDragLeave(e) {
    var s = e.target.closest('[data-slot]');
    if (s) s.classList.remove('over');
  }
  function onDrop(e) {
    var s = e.target.closest('[data-slot],[data-pool]');
    if (!s || !dragging) return;
    e.preventDefault();
    var id = dragging;
    dragging = null;
    if (s.dataset.slot) place(id, +s.dataset.slot); else release(id);
  }
  function onDragEnd() { dragging = null; if (!locked) render(); }

  Biber.register({
    id: 'fingerfarben',
    story: '<p>Lars hat Blumen gezeichnet. Seine kleine Schwester Carlotta findet die Zeichnungen und bemalt sie mit Fingerfarben.</p>',
    question: 'Wie sahen die bemalten Zeichnungen vorher aus?',
    howto: 'Ziehe jede Zeichnung in das gelbe Feld unter dem passenden bemalten Bild. Du kannst auch erst die Zeichnung und dann das Feld antippen.',
    explanation: function () {
      return '<p>Bei jedem Bild verraten Reste der Zeichnung, welche Blume darunter liegt: Ort, Richtung und Zahl der Knospen.</p>' +
        '<ul class="ff-why">' + PAINTED.map(function (p) {
          return '<li><img src="assets/fingerfarben/' + p.answer + '.png" alt="' + DRAW[p.answer].alt + '" width="64" height="64">' +
            '<div><strong>Bemalt in ' + p.color + '</strong><span>' + p.why + '</span></div></li>';
        }).join('') + '</ul>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('dragleave', onDragLeave);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', onDragEnd);
      render();
    },
    isComplete: function () { return slots.every(Boolean); },
    evaluate: function () {
      var ok = PAINTED.every(function (p, i) { return slots[i] === p.answer; });
      return { correct: ok, answer: slots.slice() };
    },
    setAnswer: function (ans) {
      slots = ans.slice();
      var ok = PAINTED.every(function (p, i) { return slots[i] === p.answer; });
      render(ok ? 'solution' : 'check');
    },
    lock: function (on) {
      locked = on;
      if (on) {
        var ok = PAINTED.every(function (p, i) { return slots[i] === p.answer; });
        render(ok ? 'check' : 'check');
      } else render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      slots = PAINTED.map(function (p) { return p.answer; });
      locked = true;
      render('solution');
    }
  });
})();
