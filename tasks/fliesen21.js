/* Aufgabe Fliesenmuster (Heft 2021, S. 25; Klasse 9-10 schwer, 11-13 mittel): Kachelmuster den vier Böden zuordnen */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-fliesen21-';
  var DIR = 'assets/fliesen21/';

  var TILES = {
    t1: { name: 'Muster 1', alt: 'Fliese mit zwei dünnen, geraden Streifen quer über die Ecken', short: 'dünne gerade Streifen' },
    t2: { name: 'Muster 2', alt: 'Fliese mit zwei Bögen in gegenüberliegenden Ecken, die oben und unten verschieden aussehen (nicht symmetrisch)', short: 'unsymmetrische Bögen' },
    t3: { name: 'Muster 3', alt: 'Fliese mit zwei runden Viertelkreis-Bögen in gegenüberliegenden Ecken', short: 'runde Bögen' },
    t4: { name: 'Muster 4', alt: 'Fliese mit einem dicken, geraden Streifen von links oben nach rechts unten', short: 'dicke gerade Streifen' }
  };
  var ORDER = ['t1', 't2', 't3', 't4'];
  /* Böden A-D, answer = richtiges Muster (laut Heft: A rund, B dicke Streifen, C dünne Streifen, D Ausnahmemuster).
     Die Lage des Feldes unter dem Boden (Anteile der Bildbreite/-höhe) entspricht dem Platz im Heft. */
  var FLOORS = [
    { key: 'A', img: 'bodena', answer: 't3', w: 600, h: 591, alt: 'Boden A: Muster aus vielen geschwungenen Linien, Kreisen und S-Kurven',
      why: 'Die Linien sind rund und gehen weich ineinander über, dazu passen die runden Bögen von Muster 3.' },
    { key: 'B', img: 'bodenb', answer: 't4', w: 600, h: 588, alt: 'Boden B: dichtes Muster aus dicken, geraden Diagonallinien und kleinen Quadraten',
      why: 'Die Linien sind gerade und die Streifen dick, die hellen Zwischenräume schmal. Das passt zu Muster 4, nicht zum dünneren Muster 1.' },
    { key: 'C', img: 'bodenc', answer: 't1', w: 600, h: 589, alt: 'Boden C: Muster aus geraden, dünnen Diagonallinien und Rauten',
      why: 'Gerade Linien mit viel Abstand dazwischen: Das sind die dünnen Streifen von Muster 1.' },
    { key: 'D', img: 'bodend', answer: 't2', w: 600, h: 594, alt: 'Boden D: Muster aus wellenartigen Linien mit kleinen Knubbeln und Kreisen',
      why: 'Nur dieses Muster ist nicht symmetrisch. Seine Linien treffen an den Kanten nicht genau aufeinander, das gibt die Knubbel im Boden.' }
  ];
  var SLOT = { x: 0.382, y: 0.770, w: 0.232, h: 0.229 };

  function tileImg(id, cls) {
    return h('img', { class: cls || P + 'tile', src: DIR + id + '.png', alt: TILES[id].alt, width: 120, height: 120, draggable: 'false' });
  }

  var el, api, slots, selected, dragging, locked, mark;

  function reset() { slots = [null, null, null, null]; selected = null; dragging = null; mark = null; }
  function allRight() { return FLOORS.every(function (f, i) { return slots[i] === f.answer; }); }

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

  function render() {
    var pool = ORDER.map(function (id) {
      if (slots.indexOf(id) >= 0) return h('div', { class: P + 'cell', 'aria-hidden': 'true' });
      return h('button', {
        type: 'button', class: P + 'chip' + (selected === id ? ' selected' : ''), 'data-tile': id,
        draggable: locked ? false : 'true', 'aria-pressed': String(selected === id), 'aria-label': TILES[id].name + ': ' + TILES[id].short, disabled: locked
      }, tileImg(id), h('span', null, TILES[id].name));
    });
    var floors = FLOORS.map(function (f, i) {
      var id = slots[i], cls = P + 'slot' + (id ? ' filled' : '');
      var m = null;
      if (mark) {
        var ok = id === f.answer;
        cls += ok ? ' right' : ' wrong';
        if (mark === 'check') m = h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      }
      return h('div', { class: P + 'floor' },
        h('div', { class: P + 'flabel' }, 'Boden ' + f.key),
        h('div', { class: P + 'imgbox' },
          h('img', { src: DIR + f.img + '.png', alt: f.alt, width: f.w, height: f.h, draggable: 'false' }),
          h('button', {
            type: 'button', class: cls, 'data-slot': String(i), draggable: id && !locked ? 'true' : false, 'data-in-slot': id || false, disabled: locked,
            style: 'left:' + (SLOT.x * 100) + '%;top:' + (SLOT.y * 100) + '%;width:' + (SLOT.w * 100) + '%;height:' + (SLOT.h * 100) + '%',
            'aria-label': 'Feld für Boden ' + f.key + ': ' + (id ? TILES[id].name + ', ' + TILES[id].short : 'leer')
          }, id ? tileImg(id, P + 'in') : h('span', { class: P + 'ph', 'aria-hidden': 'true' }, '?'), m)));
    });
    el.replaceChildren(h('div', { class: P + 'board' },
      h('section', { 'aria-label': 'Fliesenmuster' }, h('h3', null, 'Fliesenmuster (vergrößert)'), h('div', { class: P + 'pool', 'data-pool': '' }, pool)),
      h('section', { 'aria-label': 'Böden' }, h('h3', null, 'Böden'), h('div', { class: P + 'floors' }, floors))));
  }

  function onClick(e) {
    var t = e.target.closest('[data-tile],[data-slot]');
    if (!t || locked) return;
    if (t.dataset.tile) {
      selected = selected === t.dataset.tile ? null : t.dataset.tile;
      render();
      return;
    }
    var idx = +t.dataset.slot;
    if (selected) return place(selected, idx);
    if (slots[idx]) release(slots[idx]);
  }
  function onDragStart(e) {
    var t = e.target.closest('[data-tile],[data-in-slot]');
    if (!t || locked) return;
    dragging = t.dataset.tile || t.dataset.inSlot;
    e.dataTransfer.setData('text/plain', dragging);
    e.dataTransfer.effectAllowed = 'move';
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
    id: 'fliesen21',
    story:
      '<p>Unten siehst du vier Böden. Jeder Boden wurde mit Fliesen gelegt, die alle das gleiche Muster haben. Daneben sind die vier Fliesenmuster vergrößert abgebildet.</p>',
    question: 'Welcher Boden wurde mit welchem Muster gelegt?',
    howto: 'Ziehe jedes Muster in das Feld unter dem passenden Boden. Du kannst auch erst das Muster und dann das Feld antippen.',
    explanation: function () {
      return '<p>Ein Muster ist eine Ausnahme: <strong>Muster 2</strong> ist nicht symmetrisch, seine vier Seiten sehen nicht alle gleich aus. Beim Legen schließen die Linien deshalb nicht genau aneinander an. Das gilt nur für <strong>Boden D</strong>.</p>' +
        '<p>Muster 4 hat dickere Striche als Muster 1 und gehört deshalb zu <strong>Boden B</strong>. Die runden Formen von Muster 3 ergeben <strong>Boden A</strong>, die geraden dünnen Linien von Muster 1 <strong>Boden C</strong>.</p>' +
        '<ul class="' + P + 'why">' + FLOORS.map(function (f) {
          return '<li>' + tileImg(f.answer, P + 'mini').outerHTML + '<div><strong>Boden ' + f.key + ' = ' + TILES[f.answer].name + '</strong><span>' + f.why + '</span></div></li>';
        }).join('') + '</ul>' +
        '<p>Ein Muster, das man lückenlos wiederholt, nennt man Parkettierung oder Kachelung. Welche Linien an den Rändern aufeinandertreffen, entscheidet über das Gesamtbild.</p>';
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
    evaluate: function () { return { correct: allRight(), answer: slots.slice() }; },
    setAnswer: function (ans) {
      slots = ans.slice();
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      slots = FLOORS.map(function (f) { return f.answer; });
      locked = true; mark = 'solution';
      render();
    }
  });
})();
