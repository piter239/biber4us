/* Aufgabe Flugzeuge (Klasse 3-6, einfach): Startplan durch Reihenfolge-Logik ergänzen */
(function () {
  'use strict';
  var h = Biber.h;

  var PLANE = {
    gelb: 'Gelbes Flugzeug mit blauen Punkten',
    rot: 'Rotes Flugzeug mit Dreiecken',
    gruen: 'Hellgrünes Flugzeug',
    lila: 'Violettes Flugzeug mit gelben Streifen',
    hellblau: 'Hellblaues Flugzeug mit blauen Streifen',
    gruenstreif: 'Grünes Flugzeug mit gelben Streifen',
    blaupink: 'Blau-pinkes Flugzeug'
  };
  /* Zeilen des Startplans; fixed = schon eingetragen, ans = richtige Lösung für leere Zeilen */
  var ROWS = [
    { time: '10:45', ans: 'gruen' },
    { time: '10:52', fixed: 'hellblau' },
    { time: '10:55', ans: 'rot' },
    { time: '10:59', fixed: 'gruenstreif' },
    { time: '11:00', ans: 'gelb' },
    { time: '11:10', fixed: 'blaupink' },
    { time: '11:11', ans: 'lila' }
  ];
  /* Linien: vorne zuerst; auf einer Linie kann niemand überholen */
  var LANES = [['gelb', 'blaupink'], ['rot', 'gruenstreif'], ['hellblau', 'lila']];
  var POOL = ['gelb', 'rot', 'gruen', 'lila'];
  var FREE = ROWS.map(function (r, i) { return r.fixed ? -1 : i; }).filter(function (i) { return i >= 0; });

  function img(id, cls) {
    return h('img', { class: cls || 'fl-plane', src: 'assets/flugzeuge/' + id + '.png', alt: PLANE[id] || '', width: 143, height: 108, draggable: 'false' });
  }

  /* Gültig, wenn auf jeder Linie die Reihenfolge stimmt und das Flugzeug auf der Startbahn zuerst startet */
  function positions(slots) {
    var pos = {};
    ROWS.forEach(function (r, i) { if (r.fixed) pos[r.fixed] = i; });
    FREE.forEach(function (rowIdx, k) { if (slots[k]) pos[slots[k]] = rowIdx; });
    return pos;
  }
  function isValid(slots) {
    var pos = positions(slots);
    if (Object.keys(pos).length !== 7 || pos.gruen !== 0) return false;
    return LANES.every(function (l) { return pos[l[0]] < pos[l[1]]; });
  }

  var el, api;
  var slots, selected, dragging, locked;

  function reset() { slots = [null, null, null, null]; selected = null; dragging = null; }
  function count() { return slots.filter(Boolean).length; }
  function changed() { api.changed(count() + ' von 4 Flugzeugen eingetragen.'); }

  function place(id, k) {
    if (locked) return;
    var from = slots.indexOf(id);
    var existing = slots[k];
    slots[k] = id;
    if (from >= 0 && from !== k) slots[from] = existing === id ? null : existing;
    selected = null;
    render();
    changed();
  }
  function release(id) {
    if (locked) return;
    var from = slots.indexOf(id);
    if (from >= 0) slots[from] = null;
    selected = null;
    render();
    changed();
  }

  function render(mark) {
    var pool = POOL.map(function (id) {
      if (slots.indexOf(id) >= 0) return h('div', { class: 'fl-cell', 'aria-hidden': 'true' });
      return h('button', {
        type: 'button', class: 'fl-chip' + (selected === id ? ' selected' : ''), 'data-plane': id,
        draggable: locked ? false : 'true', 'aria-pressed': String(selected === id), 'aria-label': PLANE[id], disabled: locked
      }, img(id));
    });
    var k = 0;
    var rows = ROWS.map(function (r) {
      var slotCell;
      if (r.fixed) {
        slotCell = h('div', { class: 'fl-slot fixed', role: 'img', 'aria-label': r.time + ' Uhr: ' + PLANE[r.fixed] + ' (schon eingetragen)' }, img(r.fixed));
      } else {
        var idx = k++;
        var id = slots[idx];
        var cls = 'fl-slot' + (id ? ' filled' : '');
        var badge = null;
        if (mark === 'check') {
          var ok = id === r.ans;
          cls += ok ? ' right' : ' wrong';
          badge = h('span', { class: 'fl-mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
        } else if (mark === 'solution') cls += ' right';
        slotCell = h('button', {
          type: 'button', class: cls, 'data-slot': String(idx), disabled: locked,
          draggable: id && !locked ? 'true' : false, 'data-in-slot': id || false,
          'aria-label': r.time + ' Uhr: ' + (id ? PLANE[id] : 'leer')
        }, id ? img(id) : h('span', { class: 'fl-ghost', 'aria-hidden': 'true' }), badge);
      }
      return h('tr', null, h('th', { scope: 'row', class: 'num' }, r.time), h('td', null, slotCell));
    });
    el.replaceChildren(h('div', { class: 'fl-board' },
      h('section', { class: 'fl-plan', 'aria-label': 'Startplan' },
        h('table', { class: 'fl-table' },
          h('caption', { class: 'fl-cap' }, 'Startplan'),
          h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Zeit'), h('th', { scope: 'col' }, 'Flugzeug'))),
          h('tbody', null, rows))),
      h('section', { class: 'fl-hangar', 'aria-label': 'Fehlende Flugzeuge' },
        h('h3', null, 'Fehlende Flugzeuge'),
        h('div', { class: 'fl-pool', 'data-pool': '' }, pool))));
  }

  function onClick(e) {
    var t = e.target.closest('[data-plane],[data-slot]');
    if (!t || locked) return;
    if (t.dataset.plane) {
      selected = selected === t.dataset.plane ? null : t.dataset.plane;
      render();
      return;
    }
    var idx = +t.dataset.slot;
    if (selected) return place(selected, idx);
    if (slots[idx]) release(slots[idx]);
  }
  function onDragStart(e) {
    var t = e.target.closest('[data-plane],[data-in-slot]');
    if (!t || locked) return;
    dragging = t.dataset.plane || t.dataset.inSlot;
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
    id: 'flugzeuge',
    story:
      '<p>Heute Morgen wollen sieben Flugzeuge starten. Alle starten auf derselben Startbahn rechts. ' +
      'Die Flugzeuge fahren auf den Linien vorwärts und können einander nicht überholen.</p>' +
      '<figure class="fl-map"><img src="assets/flugzeuge/karte.png" width="1500" height="589" ' +
      'alt="Plan des Flughafens: Drei Linien führen von links nach rechts und treffen sich vor der gemeinsamen Startbahn rechts. ' +
      'Auf der oberen Linie steht das gelbe Flugzeug mit blauen Punkten vor dem blau-pinken. ' +
      'In der Mitte steht das rote Flugzeug mit Dreiecken vor dem grün gestreiften. ' +
      'Auf der unteren Linie steht das hellblaue Flugzeug mit blauen Streifen vor dem violetten mit gelben Streifen. ' +
      'Auf der Startbahn selbst steht schon das hellgrüne Flugzeug."></figure>' +
      '<p>Der Startplan zeigt, in welcher Reihenfolge die sieben Flugzeuge starten. Einige Flugzeuge fehlen aber noch.</p>',
    question: 'Ergänze die fehlenden Flugzeuge im Startplan.',
    howto: 'Ziehe jedes Flugzeug in ein leeres Feld des Startplans. Du kannst auch erst das Flugzeug und dann das Feld antippen. Ein eingetragenes Flugzeug nimmst du durch Antippen wieder heraus.',
    explanation: function () {
      var why = [
        ['gruen', 'Das hellgrüne Flugzeug steht schon auf der Startbahn. Alle anderen müssen hinter ihm warten, also startet es zuerst (10:45).'],
        ['rot', 'Das rote Flugzeug steht auf seiner Linie vor dem grün gestreiften (10:59). Es startet also früher, und nur 10:55 ist noch frei.'],
        ['gelb', 'Das gelbe Flugzeug steht vor dem blau-pinken (11:10). Von den freien Zeiten passt nur 11:00.'],
        ['lila', 'Das violette Flugzeug steht hinter dem hellblauen (10:52). Es muss später starten, und nur 11:11 ist noch übrig.']
      ];
      return '<p>Auf jeder Linie kann kein Flugzeug überholen. Wer vorn steht, startet vor dem, der dahinter steht. Mit dieser Regel kann man die Zeiten nacheinander finden.</p>' +
        '<ul class="fl-why">' + why.map(function (w) {
          var row = ROWS.filter(function (r) { return r.ans === w[0]; })[0];
          return '<li><img src="assets/flugzeuge/' + w[0] + '.png" alt="' + PLANE[w[0]] + '" width="72" height="54">' +
            '<div><strong>' + row.time + ' Uhr</strong><span>' + w[1] + '</span></div></li>';
        }).join('') + '</ul>' +
        '<p>Solche Reihenfolgeregeln gibt es auch in Computern: Aufgaben dürfen erst starten, wenn alle vor ihnen in der Warteschlange fertig sind.</p>';
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
    evaluate: function () { return { correct: isValid(slots), answer: slots.slice() }; },
    setAnswer: function (ans) {
      slots = ans.slice();
      render('check');
    },
    lock: function (on) {
      locked = on;
      if (on) render('check'); else render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      slots = FREE.map(function (i) { return ROWS[i].ans; });
      locked = true;
      render('solution');
    }
  });
})();
