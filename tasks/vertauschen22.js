/* Aufgabe Vertauschen (Heft 2022, Klasse 3-4 mittel / 5-6 leicht): drei Dinge in drei Beuteln, drei Vertauschungen nacheinander.
   Start: A Murmel, B Edelstein, C Papier; Tausch A-B, dann A-C, dann B-C -> A Papier, B Edelstein, C Murmel. */
(function () {
  'use strict';
  var h = Biber.h;
  var A = 'assets/vertauschen22/';

  var THING = {
    murmel: { name: 'Murmel', img: 'murmel.png', w: 164, h: 140, alt: 'Murmel' },
    edelstein: { name: 'Edelstein', img: 'edelstein.png', w: 207, h: 140, alt: 'Pinker Edelstein' },
    papier: { name: 'Papier', img: 'papier.png', w: 175, h: 140, alt: 'Zerknülltes Stück Papier' }
  };
  var ORDER = ['murmel', 'edelstein', 'papier'];
  var BAGS = [
    { id: 'A', img: 'beutelA.png', w: 300, h: 197, alt: 'Beutel A' },
    { id: 'B', img: 'beutelB.png', w: 300, h: 143, alt: 'Beutel B' },
    { id: 'C', img: 'beutelC.png', w: 300, h: 153, alt: 'Beutel C' }
  ];
  var START = ['murmel', 'edelstein', 'papier'];
  var SWAPS = [[0, 1], [0, 2], [1, 2]];
  var RIGHT = START.slice();
  SWAPS.forEach(function (s) { var t = RIGHT[s[0]]; RIGHT[s[0]] = RIGHT[s[1]]; RIGHT[s[1]] = t; });
  /* RIGHT = ['papier', 'edelstein', 'murmel'] (mit dem Heft abgeglichen) */

  var el, api, locked, mode, slots, selected, dragging;

  function reset() { slots = [null, null, null]; selected = null; dragging = null; mode = null; }
  function same(a, b) { return a.every(function (x, i) { return x === b[i]; }); }
  function thingImg(id, cls) {
    var t = THING[id];
    return h('img', { class: cls, src: A + t.img, alt: t.alt, width: t.w, height: t.h, draggable: 'false' });
  }

  function place(id, idx) {
    if (locked) return;
    var from = slots.indexOf(id);
    var existing = slots[idx];
    slots[idx] = id;
    if (from >= 0) slots[from] = existing === id ? null : existing;
    selected = null;
    render('slot' + idx);
    api.changed(slots.every(Boolean) ? '' : (function (n) { return n === 1 ? 'Noch 1 Ding fehlt.' : 'Noch ' + n + ' Dinge fehlen.'; })(slots.filter(function (s) { return !s; }).length));
  }
  function release(id) {
    if (locked) return;
    var from = slots.indexOf(id);
    if (from >= 0) slots[from] = null;
    selected = null;
    render('thing' + id);
    api.changed('');
  }

  function render(focus) {
    var hadFocus = el.contains(document.activeElement);
    var pool = ORDER.map(function (id) {
      if (slots.indexOf(id) >= 0) return h('div', { class: 't-vertauschen22-cell', 'aria-hidden': 'true' });
      return h('button', {
        type: 'button', class: 't-vertauschen22-thing' + (selected === id ? ' selected' : ''), 'data-thing': id,
        draggable: locked ? false : 'true', disabled: locked, 'aria-pressed': String(selected === id),
        'aria-label': THING[id].name + (selected === id ? ', ausgewählt' : '')
      }, thingImg(id, 't-vertauschen22-timg'));
    });

    var cols = BAGS.map(function (b, i) {
      var id = slots[i];
      var cls = 't-vertauschen22-slot' + (id ? ' filled' : '');
      var mark = null;
      if (mode === 'check') {
        var ok = id === RIGHT[i];
        cls += ok ? ' right' : ' wrong';
        mark = h('span', { class: 't-vertauschen22-mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      } else if (mode === 'solution') cls += ' right';
      return h('div', { class: 't-vertauschen22-col' },
        h('button', {
          type: 'button', class: cls, 'data-slot': String(i), disabled: locked, draggable: id && !locked ? 'true' : false, 'data-in-slot': id || false,
          'aria-label': 'Inhalt von Beutel ' + b.id + ': ' + (id ? THING[id].name : 'leer')
        }, id ? thingImg(id, 't-vertauschen22-timg') : h('span', { class: 't-vertauschen22-ph' }, 'hierher'), mark),
        h('img', { class: 't-vertauschen22-bag', src: A + b.img, alt: b.alt, width: b.w, height: b.h, draggable: 'false' }),
        h('span', { class: 't-vertauschen22-lab' }, 'Beutel ' + b.id));
    });

    el.replaceChildren(h('div', { class: 't-vertauschen22' },
      h('section', { 'aria-label': 'Beutel' }, h('h3', null, 'Nach den drei Vertauschungen'), h('div', { class: 't-vertauschen22-bags' }, cols)),
      h('section', { 'aria-label': 'Dinge' }, h('h3', null, 'Dinge'), h('div', { class: 't-vertauschen22-pool', 'data-pool': '' }, pool))));

    if (hadFocus && !locked && focus) {
      var t = null;
      if (focus.indexOf('slot') === 0) t = el.querySelector('[data-slot="' + focus.slice(4) + '"]');
      else if (focus.indexOf('thing') === 0) t = el.querySelector('[data-thing="' + focus.slice(5) + '"]');
      if (t && !t.disabled) t.focus();
    }
  }

  function onClick(e) {
    var t = e.target.closest('[data-thing],[data-slot]');
    if (!t || locked) return;
    if (t.getAttribute('data-thing')) {
      var id = t.getAttribute('data-thing');
      selected = selected === id ? null : id;
      render('thing' + id);
      return;
    }
    var idx = +t.getAttribute('data-slot');
    if (selected) return place(selected, idx);
    if (slots[idx]) release(slots[idx]);
  }
  function onDragStart(e) {
    var t = e.target.closest('[data-thing],[data-in-slot]');
    if (!t || locked) return;
    dragging = t.getAttribute('data-thing') || t.getAttribute('data-in-slot');
    e.dataTransfer.setData('text/plain', dragging);
    e.dataTransfer.effectAllowed = 'move';
    t.classList.add('dragging');
  }
  function onDragOver(e) {
    var s = e.target.closest('[data-slot],[data-pool]');
    if (!s || !dragging) return;
    e.preventDefault();
    if (s.getAttribute('data-slot') != null) s.classList.add('over');
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
    if (s.getAttribute('data-slot') != null) place(id, +s.getAttribute('data-slot')); else release(id);
  }
  function onDragEnd() { dragging = null; if (!locked) render(); }

  function stepsHtml() {
    var names = ['Am Anfang', 'Nach Tausch A–B', 'Nach Tausch A–C', 'Nach Tausch B–C'];
    var state = START.slice();
    var rows = [state.slice()];
    SWAPS.forEach(function (s) { var t = state[s[0]]; state[s[0]] = state[s[1]]; state[s[1]] = t; rows.push(state.slice()); });
    return '<table class="t-vertauschen22-steps"><thead><tr><th scope="col"></th><th scope="col">Beutel A</th><th scope="col">Beutel B</th><th scope="col">Beutel C</th></tr></thead><tbody>' +
      rows.map(function (r, i) {
        return '<tr><th scope="row">' + names[i] + '</th>' + r.map(function (id) {
          return '<td><img src="' + A + THING[id].img + '" alt="' + THING[id].name + '" width="' + Math.round(THING[id].w * 30 / 140) + '" height="30"></td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table>';
  }

  Biber.register({
    id: 'vertauschen22',
    story: '<p>Lila legt eine Murmel in Beutel A, einen Edelstein in Beutel B und ein Stück Papier in Beutel C.</p>' +
      '<figure class="t-vertauschen22-fig"><img src="' + A + 'start.png" width="450" height="129" alt="Drei Beutel A, B und C. Über Beutel A liegt eine Murmel, über Beutel B ein Edelstein, über Beutel C ein zerknülltes Stück Papier. Pfeile zeigen, dass jedes Ding in den Beutel darunter gelegt wird."></figure>' +
      '<p>Dann vertauscht sie die Inhalte: zuerst die von Beutel A und Beutel B, danach die von A und C, und zuletzt die von B und C.</p>' +
      '<figure class="t-vertauschen22-fig"><img src="' + A + 'tausch.png" width="450" height="151" alt="Drei Beutel A, B und C mit Pfeilen: Pfeil 1 verbindet A und B, Pfeil 2 verbindet A und C, Pfeil 3 verbindet B und C."></figure>',
    question: 'Wo sind die drei Dinge dann?',
    howto: 'Tippe erst ein Ding an und dann das Feld über dem Beutel, in dem es nun liegt. Du kannst die Dinge auch ziehen.',
    explanation: function () {
      return '<p>Am Anfang liegen Murmel, Edelstein und Papier in den Beuteln A, B und C. Die drei Vertauschungen nacheinander:</p>' + stepsHtml() +
        '<p>Am Ende liegt das <b>Papier in A</b>, der <b>Edelstein in B</b> und die <b>Murmel in C</b>. ' +
        'Dasselbe wäre auch mit einer einzigen Vertauschung (A mit C) gegangen.</p>' +
        '<p><b>Informatik:</b> Die Dinge stehen in einer bestimmten Reihenfolge (einer <i>Anordnung</i>). Jede Vertauschung ändert die Anordnung. Drei Dinge können in sechs verschiedenen Anordnungen stehen, ' +
        'und jede Anordnung lässt sich aus jeder anderen durch Vertauschungen herstellen, bei n Dingen mit höchstens n − 1 Vertauschungen. Das ist die Grundidee des Sortierens durch Tauschen.</p>';
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
    evaluate: function () { return { correct: same(slots, RIGHT), answer: slots.slice() }; },
    setAnswer: function (ans) {
      slots = (ans || [null, null, null]).slice();
      selected = null;
      mode = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mode = on ? (mode || 'check') : null;
      if (on) selected = null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      slots = RIGHT.slice();
      selected = null;
      locked = true;
      mode = 'solution';
      render();
    }
  });
})();
