/* Aufgabe Baumtouren (Biber 2024, S. 13; Klasse 7-8 mittel, 9-10 einfach): topologische Sortierung */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-baumtouren24-';

  var TREES = {
    eiche: 'Eiche', ahorn: 'Hellgrüner Laubbaum', tanne: 'Tanne', birke: 'Birke', apfel: 'Apfelbaum', ulme: 'Dunkelgrüner Laubbaum', kiefer: 'Kiefer'
  };
  /* Frühere Touren: von weniger zu mehr beliebt (laut Tabelle im Heft) */
  var TOURS = [
    ['eiche', 'ulme', 'tanne', 'apfel'],
    ['eiche', 'birke', 'tanne', 'ahorn'],
    ['apfel', 'kiefer', 'ahorn']
  ];
  var POOL = ['eiche', 'ahorn', 'tanne', 'birke', 'apfel'];   /* Reihenfolge wie im Heft */
  var SOLUTION = ['eiche', 'birke', 'tanne', 'apfel', 'ahorn'];

  /* Alle "weniger beliebt als"-Paare (direkt und transitiv) aus den drei Touren */
  var BEFORE = (function () {
    var less = {};
    TOURS.forEach(function (t) {
      for (var i = 0; i < t.length; i++) for (var j = i + 1; j < t.length; j++) less[t[i] + '<' + t[j]] = true;
    });
    return less;
  })();
  function consistent(order) {
    for (var i = 0; i < order.length; i++) for (var j = i + 1; j < order.length; j++) {
      if (BEFORE[order[j] + '<' + order[i]]) return false;
    }
    return true;
  }
  /* Auch indirekt (über Bäume außerhalb der Auswahl): transitiver Abschluss */
  (function closure() {
    var ids = Object.keys(TREES), changed = true;
    while (changed) {
      changed = false;
      ids.forEach(function (a) { ids.forEach(function (b) { ids.forEach(function (c) {
        if (BEFORE[a + '<' + b] && BEFORE[b + '<' + c] && !BEFORE[a + '<' + c]) { BEFORE[a + '<' + c] = true; changed = true; }
      }); }); });
    }
  })();
  function isRight(order) { return order.length === 5 && order.every(Boolean) && consistent(order); }

  function img(id, cls) {
    return h('img', { class: cls || (P + 'img'), src: 'assets/baumtouren24/' + id + '.png', alt: TREES[id], draggable: 'false' });
  }

  var el, api, locked, mark;
  var slots, dragging, poolEl, slotEls;

  function reset() { slots = [null, null, null, null, null]; mark = null; dragging = null; }

  function freeIndex() { return slots.indexOf(null); }
  function addTree(id) {
    if (locked || slots.indexOf(id) >= 0) return;
    var i = freeIndex();
    if (i < 0) return;
    slots[i] = id; mark = null;
    render(); api.changed();
  }
  function putTree(id, idx) {
    if (locked) return;
    var from = slots.indexOf(id), existing = slots[idx];
    slots[idx] = id;
    if (from >= 0) slots[from] = existing === id ? null : existing;
    mark = null;
    render(); api.changed();
  }
  function release(idx) {
    if (locked || !slots[idx]) return;
    slots[idx] = null; mark = null;
    render(); api.changed();
  }
  function releaseTree(id) {
    var i = slots.indexOf(id);
    if (i >= 0) release(i);
  }

  function render() {
    var done = slots.every(Boolean), ok = done && isRight(slots);
    poolEl.replaceChildren.apply(poolEl, POOL.map(function (id) {
      if (slots.indexOf(id) >= 0) return h('div', { class: P + 'gap', 'aria-hidden': 'true' });
      return h('button', {
        type: 'button', class: P + 'tree', 'data-tree': id, 'aria-label': TREES[id] + ' einsortieren',
        draggable: locked ? false : 'true', disabled: locked
      }, img(id));
    }));
    slotEls.forEach(function (s, i) {
      var id = slots[i];
      s.className = P + 'slot' + (id ? ' filled' : '');
      s.dataset.inSlot = id || '';
      s.draggable = !!id && !locked;
      s.disabled = locked;
      s.setAttribute('aria-label', 'Platz ' + (i + 1) + ' von 5' + (i === 0 ? ' (am wenigsten beliebt)' : i === 4 ? ' (am beliebtesten)' : '') + ': ' + (id ? TREES[id] + ', antippen zum Entfernen' : 'leer'));
      s.replaceChildren();
      if (id) s.appendChild(img(id));
      else s.appendChild(h('span', { class: P + 'ph', 'aria-hidden': 'true' }, String(i + 1)));
      if (mark && done) {
        s.classList.add(ok ? 'right' : 'wrong');
        s.appendChild(h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
      }
    });
  }

  function tourRow(t, i) {
    var kids = [h('span', { class: P + 'tname' }, 'Tour ' + (i + 1))];
    t.forEach(function (id, j) {
      if (j) kids.push(h('span', { class: P + 'lt', 'aria-hidden': 'true' }, '<'));
      kids.push(img(id, P + 'timg'));
    });
    var row = h('li', { class: P + 'tour', 'aria-label': 'Tour ' + (i + 1) + ': ' + t.map(function (id) { return TREES[id]; }).join(' weniger beliebt als ') });
    kids.forEach(function (k) { row.appendChild(k); });
    return row;
  }

  function onClick(e) {
    var t = e.target.closest('[data-tree]');
    if (t) return addTree(t.dataset.tree);
    var s = e.target.closest('[data-slot]');
    if (s) release(+s.dataset.slot);
  }
  function onDragStart(e) {
    var t = e.target.closest('[data-tree],[data-in-slot]');
    if (!t || locked) return;
    dragging = t.dataset.tree || t.dataset.inSlot;
    if (!dragging) return;
    e.dataTransfer.setData('text/plain', dragging);
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e) {
    if (!dragging) return;
    var s = e.target.closest('[data-slot],[data-pool]');
    if (!s) return;
    e.preventDefault();
    if (s.dataset.slot) s.classList.add('over');
  }
  function onDragLeave(e) {
    var s = e.target.closest('[data-slot]');
    if (s) s.classList.remove('over');
  }
  function onDrop(e) {
    if (!dragging) return;
    var s = e.target.closest('[data-slot],[data-pool]');
    if (!s) return;
    e.preventDefault();
    var id = dragging;
    dragging = null;
    if (s.dataset.slot !== undefined) putTree(id, +s.dataset.slot); else releaseTree(id);
  }
  function onDragEnd() { dragging = null; slotEls.forEach(function (s) { s.classList.remove('over'); }); }

  Biber.register({
    id: 'baumtouren24',
    story:
      '<p>Försterin Flora bietet Baumtouren an und stellt dabei einige Bäume im Wald näher vor. Von drei früheren Touren weiß sie, wie beliebt die Bäume bei ihren Gästen waren. ' +
      '<b>Baum 1 &lt; Baum 2</b> bedeutet: Baum 1 war weniger beliebt als Baum 2.</p>' +
      '<p>Bei ihren nächsten Touren möchte Flora beliebtere Bäume erst später vorstellen, denn das Beste kommt zum Schluss. Die Reihenfolge soll mit der Beliebtheit bei <b>allen drei</b> früheren Touren übereinstimmen.</p>' +
      '<p>Auf ihrer nächsten Tour will sie diese fünf Bäume vorstellen: Eiche, Tanne, Birke, Apfelbaum und den hellgrünen Laubbaum.</p>',
    question: 'Bestimme eine gute Reihenfolge dieser Bäume!',
    howto: 'Tippe die Bäume nacheinander an: Der erste kommt auf Platz 1 (zuerst vorgestellt), der letzte auf Platz 5. Du kannst Bäume auch ziehen. Tippe auf einen Baum in einem Platz, um ihn wieder wegzunehmen.',
    explanation: function () {
      var ord = SOLUTION.map(function (id) { return '<img src="assets/baumtouren24/' + id + '.png" alt="' + TREES[id] + '" width="40" height="52">'; }).join('<span aria-hidden="true">›</span>');
      return '<p>Aus den drei Touren erhältst du Regeln der Form „A kommt vor B“. Aus Tour 1 und 2 folgt: Eiche vor Birke vor Tanne. ' +
        'Tour 1 sagt außerdem: Tanne vor Apfelbaum. Tour 3: Apfelbaum vor Kiefer vor dem hellgrünen Laubbaum, also kommt der Apfelbaum vor dem Laubbaum. ' +
        'Damit ist die Reihenfolge der fünf Bäume festgelegt, es gibt genau eine richtige Lösung:</p>' +
        '<p class="' + P + 'sol">' + ord + '</p>' +
        '<p>Die „weniger beliebt als“-Vergleiche bilden eine <i>Ordnung</i>. Ist sie widerspruchsfrei, findet man mit einer <i>topologischen Sortierung</i> eine passende Reihenfolge. ' +
        'Dabei kann man die Touren zu einem Diagramm mit Pfeilen zusammenfassen und die Bäume entlang der Pfeile besuchen. Ein Vergleich gilt auch über Umwege (Transitivität): Eiche und Apfelbaum kommen in keiner Tour zusammen vor, trotzdem kommt die Eiche zuerst.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      poolEl = h('div', { class: P + 'pool', 'data-pool': '' });
      slotEls = [0, 1, 2, 3, 4].map(function (i) {
        return h('button', { type: 'button', class: P + 'slot', 'data-slot': String(i) });
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { 'aria-label': 'Frühere Touren' },
          h('h3', null, 'Frühere Touren (links weniger beliebt, rechts beliebter)'),
          h('ul', { class: P + 'tours' }, TOURS.map(tourRow))),
        h('section', { 'aria-label': 'Bäume' }, h('h3', null, 'Die fünf Bäume'), poolEl),
        h('section', { 'aria-label': 'Reihenfolge' },
          h('h3', null, 'Reihenfolge der Tour'),
          h('div', { class: P + 'slots' }, slotEls),
          h('div', { class: P + 'axis', 'aria-hidden': 'true' }, h('span', null, 'zuerst'), h('span', null, 'zuletzt')))));
      el.addEventListener('click', onClick);
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('dragleave', onDragLeave);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', onDragEnd);
      render();
    },
    isComplete: function () { return slots.every(Boolean); },
    evaluate: function () { return { correct: isRight(slots), answer: slots.slice() }; },
    setAnswer: function (ans) {
      slots = (ans || []).slice(0, 5);
      while (slots.length < 5) slots.push(null);
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? 'check' : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () { slots = SOLUTION.slice(); mark = 'check'; locked = true; render(); }
  });
})();
