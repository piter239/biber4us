/* Aufgabe Lecker! (Heft 2017, S. 38) - Stämme nach Blättern sortieren, Tauschen mit Ablage */
(function () {
  'use strict';
  var h = Biber.h;

  /* Anfangsreihenfolge im Heft: 3, 1, 5, 2, 4 Blätter. Ben steht links; je mehr Blätter, desto näher bei ihm. */
  var START = [3, 1, 5, 2, 4, 0];
  var GOAL = [5, 4, 3, 2, 1, 0];   /* Plätze 1-5 auf dem Brett, Index 5 = Ablage (0 = leer) */

  /* Geometrie in Punkten der Heftseite: Brett-Bild beginnt bei (189,172), 367 x 150;
     Ben-Bild bei (30,165), 159 x 157. Ein Stamm-Bild ist 78 x 84,33 breit/hoch, der Stamm selbst sitzt bei cx. */
  var PLANK = { x: 189, y: 172, w: 367, h: 150 };
  var BEN = { x: 30, y: 165, w: 159, h: 157 };
  var CX = [238.8, 305.9, 364.4, 429.2, 502.7];
  var AB_CX = 61, AB_DY = -4;
  var IMG_L = 30, IMG_W = 78, IMG_T = 177, IMG_H = 84.33;
  var BTN_L = 25, BTN_W = 52;     /* Antippfläche: cx-25 ... cx+27 */

  function pc(v, base, size) { return (100 * (v - base) / size).toFixed(3) + '%'; }
  function leavesText(n) { return n === 1 ? '1 Blatt' : n + ' Blätter'; }
  function src(n) { return 'assets/lecker17/stamm' + n + '.png'; }

  var el, api, slots, selected, locked, drag, moves, msgEl, focusIdx, mode;

  function fresh() { slots = START.slice(); selected = null; drag = null; moves = 0; focusIdx = null; mode = null; }

  function slotName(i) {
    if (i === 5) return 'Ablage neben Ben';
    return 'Platz ' + (i + 1) + (i === 0 ? ' (direkt bei Ben)' : '');
  }

  function slotButton(i) {
    var n = slots[i];
    var cx = i === 5 ? AB_CX : CX[i];
    var base = i === 5 ? BEN : PLANK;
    var dy = i === 5 ? AB_DY : 0;
    var top = IMG_T + dy, btnH = IMG_H;
    var cls = 't-lecker17-slot' + (n ? ' has' : ' empty') + (selected === i ? ' selected' : '');
    var mark = null;
    if (mode && i < 5) {
      var ok = n === GOAL[i];
      cls += mode === 'solution' ? ' right' : (ok ? ' right' : ' wrong');
      if (n) mark = h('span', { class: 't-lecker17-badge', 'aria-hidden': 'true' }, String(n), mode === 'solution' || ok ? ' ✓' : ' ✗');
    }
    var kids = [];
    if (n) kids.push(h('img', {
      class: 't-lecker17-log', src: src(n), alt: '', draggable: 'false',
      style: 'left:' + (100 * (BTN_L - IMG_L) / BTN_W).toFixed(3) + '%;top:0;width:' + (100 * IMG_W / BTN_W).toFixed(3) + '%'
    }));
    else kids.push(h('span', { class: 't-lecker17-hole', 'aria-hidden': 'true' }));
    if (mark) kids.push(mark);
    var label = slotName(i) + ': ' + (n ? 'Stamm mit ' + leavesText(n) + (selected === i ? ', ausgewählt' : '') : 'leer');
    return h('button', {
      type: 'button', class: cls, 'data-slot': String(i), 'aria-label': label, 'aria-pressed': n ? String(selected === i) : false,
      draggable: n && !locked ? 'true' : false, disabled: locked,
      style: 'left:' + pc(cx - BTN_L, base.x, base.w) + ';top:' + pc(top, base.y, base.h) +
        ';width:' + (100 * BTN_W / base.w).toFixed(3) + '%;height:' + (100 * btnH / base.h).toFixed(3) + '%'
    }, kids);
  }

  function render() {
    var had = el.contains(document.activeElement);
    var ben = h('div', { class: 't-lecker17-ben' },
      h('img', { src: 'assets/lecker17/ben.png', alt: 'Biber Ben mit der Ablage (einer Astgabel) links neben ihm', draggable: 'false' }),
      slotButton(5));
    var plank = h('div', { class: 't-lecker17-plank' },
      h('img', { src: 'assets/lecker17/plank.png', alt: 'Brett mit fünf Plätzen für die Stämme', draggable: 'false' }),
      [0, 1, 2, 3, 4].map(slotButton));
    msgEl = h('p', { class: 't-lecker17-msg', role: 'status', 'aria-live': 'polite' }, '');
    el.replaceChildren(h('div', { class: 't-lecker17-wrap' },
      h('div', { class: 't-lecker17-scene', role: 'group', 'aria-label': 'Ben, die Ablage und das Brett mit den Stämmen' }, ben, plank),
      msgEl));
    if (had || focusIdx != null) {
      var f = el.querySelector('[data-slot="' + (focusIdx != null ? focusIdx : selected) + '"]');
      if (f && !f.disabled) f.focus({ preventScroll: true });
    }
    focusIdx = null;
  }

  function say(t) { if (msgEl) msgEl.textContent = t || ''; }

  function move(from, to) {
    slots[to] = slots[from];
    slots[from] = 0;
    selected = null;
    moves++;
    focusIdx = to;
    render();
    api.changed('Bewegte Stämme: ' + moves);
  }

  function onClick(e) {
    var t = e.target.closest('[data-slot]');
    if (!t || locked) return;
    var i = +t.dataset.slot;
    if (selected == null) {
      if (slots[i]) { selected = i; focusIdx = i; render(); say('Stamm ausgewählt. Tippe jetzt auf einen leeren Platz oder die Ablage.'); }
      else say('Wähle zuerst einen Stamm aus.');
      return;
    }
    if (selected === i) { selected = null; focusIdx = i; render(); return; }
    if (slots[i]) {
      selected = i; focusIdx = i; render();
      say('Dieser Platz ist besetzt. Ein Stamm darf nur auf einen leeren Platz oder auf die Ablage. Du hast jetzt diesen Stamm ausgewählt.');
      return;
    }
    move(selected, i);
  }

  function onDragStart(e) {
    var t = e.target.closest('[data-slot]');
    if (!t || locked || !slots[+t.dataset.slot]) { e.preventDefault(); return; }
    drag = +t.dataset.slot;
    e.dataTransfer.setData('text/plain', String(drag));
    e.dataTransfer.effectAllowed = 'move';
    t.classList.add('dragging');
  }
  function onDragOver(e) {
    var t = e.target.closest('[data-slot]');
    if (!t || drag == null || locked) return;
    var i = +t.dataset.slot;
    if (!slots[i]) { e.preventDefault(); t.classList.add('over'); }
  }
  function onDragLeave(e) {
    var t = e.target.closest('[data-slot]');
    if (t) t.classList.remove('over');
  }
  function onDrop(e) {
    var t = e.target.closest('[data-slot]');
    if (!t || drag == null || locked) return;
    e.preventDefault();
    var from = drag, to = +t.dataset.slot;
    drag = null;
    if (slots[to] || from === to) { render(); if (slots[to] && from !== to) say('Dieser Platz ist besetzt.'); return; }
    move(from, to);
  }
  function onDragEnd() { drag = null; if (!locked) render(); }

  function isRight() { return GOAL.every(function (v, i) { return slots[i] === v; }); }

  Biber.register({
    id: 'lecker17',
    story: '<p>Biber Ben hat auf einem Brett fünf Stämme gesammelt. An den Stämmen wachsen Zweige mit Blättern. ' +
      'Ben liebt Blätter: Je mehr Blätter, desto leckerer! Ben möchte, dass die Stämme auf dem Brett anders liegen: ' +
      'Je leckerer, desto näher bei ihm. Der Stamm mit den meisten Blättern soll direkt bei ihm liegen.</p>',
    question: 'Lege die Stämme so auf das Brett, wie Ben das möchte!',
    howto: 'Tippe einen Stamm an und dann einen leeren Platz auf dem Brett oder die Ablage neben Ben (die Astgabel links). ' +
      'Du kannst die Stämme auch mit der Maus ziehen. Es lässt sich immer nur ein Stamm bewegen, und zwar nur auf einen leeren Platz.',
    explanation: function () {
      return '<p>Weil immer nur ein Stamm bewegt werden darf und jeder Platz nur einen Stamm trägt, braucht man die Ablage als Hilfsplatz. ' +
        'So kommt der beste Stamm auf Platz 1: <b>1.</b> Stamm von Platz 1 auf die Ablage legen, <b>2.</b> den Stamm mit den meisten Blättern auf den freien Platz 1 legen, ' +
        '<b>3.</b> den Stamm von der Ablage auf den Platz legen, der dadurch frei geworden ist. ' +
        'Genauso füllst Du dann Platz 2, Platz 3 und so weiter. Am Ende liegen die Stämme mit 5, 4, 3, 2 und 1 Blättern von Ben aus gesehen hintereinander.</p>' +
        '<p>Das ist Informatik: Zum Sortieren müssen Daten ihre Plätze tauschen. Um zwei Werte in Variablen zu tauschen, braucht ein Computer eine dritte Variable als Tauschhilfe, ' +
        'sonst geht ein Wert verloren. Das hier benutzte Verfahren heißt „Selection Sort“.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; fresh();
      el.addEventListener('click', onClick);
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('dragleave', onDragLeave);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', onDragEnd);
      render();
    },
    isComplete: function () {
      return slots[5] === 0 && slots.slice(0, 5).every(Boolean) && slots.some(function (v, i) { return v !== START[i]; });
    },
    evaluate: function () { return { correct: isRight(), answer: slots.slice() }; },
    setAnswer: function (ans) {
      slots = (ans && ans.length === 6 ? ans : START).slice();
      selected = null;
      mode = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      selected = null;
      mode = on ? 'check' : null;
      render();
    },
    reset: function () { fresh(); render(); },
    showSolution: function () {
      slots = GOAL.slice();
      selected = null;
      locked = true;
      mode = 'solution';
      render();
    }
  });
})();
