/* Aufgabe Obstkörbe (Klasse 3-4, einfach): fünf Körbe nach Äpfeln, dann Bananen sortieren */
(function () {
  'use strict';
  var h = Biber.h;

  /* Inhalt der Körbe, aus der Abbildung im Heft abgezählt (jeder Korb hat 8 Früchte).
     Die Nummer entspricht der Reihenfolge im Heft von links nach rechts. */
  var BASKETS = {
    1: { a: 3, b: 2, p: 3 },
    2: { a: 5, b: 0, p: 3 },
    3: { a: 2, b: 4, p: 2 },
    4: { a: 3, b: 4, p: 1 },
    5: { a: 1, b: 3, p: 4 }
  };
  var START = [1, 2, 3, 4, 5];

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function describe(id) {
    var c = BASKETS[id];
    return plural(c.a, 'Apfel', 'Äpfel') + ', ' + plural(c.b, 'Banane', 'Bananen') + ', ' + plural(c.p, 'Birne', 'Birnen');
  }
  /* true, wenn Korb x vor Korb y stehen darf (mehr Äpfel, bei Gleichstand mehr Bananen) */
  function before(x, y) {
    var p = BASKETS[x], q = BASKETS[y];
    if (p.a !== q.a) return p.a > q.a;
    return p.b >= q.b;
  }
  function isSorted(order) {
    for (var i = 0; i < order.length - 1; i++) if (!before(order[i], order[i + 1])) return false;
    return true;
  }
  var SOLUTION = START.slice().sort(function (x, y) { return before(x, y) ? -1 : 1; });

  function icon(name, cls) {
    return h('img', { class: cls || 'ok-ico', src: 'assets/obstkoerbe/' + name + '.png', alt: '', 'aria-hidden': 'true', draggable: 'false' });
  }

  var el, api, order, selected, locked, touched, mode;
  var drag = null, suppressClick = false;

  function reset() { order = START.slice(); selected = null; touched = false; drag = null; }
  function valid(a) {
    return Array.isArray(a) && a.length === 5 && START.every(function (id) { return a.indexOf(id) >= 0; });
  }

  function swap(i, j) {
    if (i === j || locked) return;
    var t = order[i]; order[i] = order[j]; order[j] = t;
    touched = true;
    selected = null;
  }

  function counts(id) {
    var c = BASKETS[id];
    return h('div', { class: 'ok-counts', 'aria-hidden': 'true' },
      h('span', null, icon('apfel'), c.a), h('span', null, icon('banane'), c.b), h('span', null, icon('birne'), c.p));
  }

  function render(markMode, focusId) {
    mode = markMode || null;
    var showInfo = mode === 'check' || mode === 'solution';
    var slots = order.map(function (id, i) {
      var cls = 'ok-slot';
      var mark = null;
      if (mode === 'check') {
        var ok = order[i] === SOLUTION[i];
        cls += ok ? ' right' : ' wrong';
        mark = h('span', { class: 'ok-mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      } else if (mode === 'solution') cls += ' right';
      var card = h('button', {
        type: 'button', class: 'ok-card' + (selected === id ? ' selected' : ''), 'data-basket': String(id), 'data-pos': String(i),
        'aria-pressed': String(selected === id), disabled: locked,
        'aria-label': 'Korb mit ' + describe(id) + ', Platz ' + (i + 1) + ' von 5' + (selected === id ? ', ausgewählt' : '')
      }, h('img', { src: 'assets/obstkoerbe/korb' + id + '.png', alt: '', width: 420, height: 290, draggable: 'false' }));
      return h('li', { class: cls, 'data-slot': String(i) },
        h('span', { class: 'ok-pos', 'aria-hidden': 'true' }, String(i + 1)),
        card, mark, showInfo ? counts(id) : null);
    });
    el.replaceChildren(h('div', { class: 'ok-board' },
      h('div', { class: 'ok-ruler', 'aria-hidden': 'true' },
        h('span', null, '← links: Bella mag am liebsten'), h('span', null, 'rechts: am wenigsten →')),
      h('ol', { class: 'ok-row', 'aria-label': 'Körbe von links nach rechts' }, slots),
      h('p', { class: 'ok-narrow-note', 'aria-hidden': 'true' }, 'Platz 1 ist ganz links. Gelesen wird in jeder Zeile von links nach rechts.')));
    if (focusId) {
      var f = el.querySelector('[data-basket="' + focusId + '"]');
      if (f) f.focus();
    }
  }

  function slotAt(x, y) {
    var best = null, bestD = 1e12;
    [].forEach.call(el.querySelectorAll('.ok-slot'), function (s) {
      var r = s.getBoundingClientRect();
      var cx = Math.min(Math.max(x, r.left), r.right), cy = Math.min(Math.max(y, r.top), r.bottom);
      var d = (cx - x) * (cx - x) + (cy - y) * (cy - y);
      if (d < bestD) { bestD = d; best = s; }
    });
    return best ? +best.dataset.slot : -1;
  }

  function onPointerDown(e) {
    var c = e.target.closest('.ok-card');
    if (!c || locked || (e.pointerType === 'mouse' && e.button !== 0)) return;
    drag = { card: c, from: +c.dataset.pos, x: e.clientX, y: e.clientY, moving: false, id: e.pointerId };
  }
  function onPointerMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moving) {
      if (dx * dx + dy * dy < 49) return;
      drag.moving = true;
      drag.card.classList.add('dragging');
      try { drag.card.setPointerCapture(e.pointerId); } catch (err) { /* ignorieren */ }
    }
    drag.card.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    var to = slotAt(e.clientX, e.clientY);
    [].forEach.call(el.querySelectorAll('.ok-slot'), function (s) {
      s.classList.toggle('over', +s.dataset.slot === to && to !== drag.from);
    });
  }
  function onPointerUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag;
    drag = null;
    if (!d.moving) return;
    suppressClick = true;
    setTimeout(function () { suppressClick = false; }, 60);
    var to = slotAt(e.clientX, e.clientY);
    if (to < 0 || to === d.from) { render(mode, null); return; }
    var id = order[d.from];
    swap(d.from, to);
    render(null, id);
    api.changed('Korb auf Platz ' + (to + 1) + ' gelegt.');
  }
  function onPointerCancel() {
    if (!drag) return;
    drag = null;
    render(mode, null);
  }

  function onClick(e) {
    var c = e.target.closest('.ok-card');
    if (!c || locked || suppressClick) return;
    var id = +c.dataset.basket;
    if (selected === null) {
      selected = id;
      render(null, id);
      api.changed('Korb ausgewählt. Tippe auf einen anderen Korb, um beide zu tauschen.');
    } else if (selected === id) {
      selected = null;
      render(null, id);
      api.changed();
    } else {
      var i = order.indexOf(selected), j = order.indexOf(id);
      swap(i, j);
      render(null, id);
      api.changed('Zwei Körbe getauscht.');
    }
  }
  function onKey(e) {
    var c = e.target.closest('.ok-card');
    if (!c || locked) return;
    var dir = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : 0;
    if (!dir) return;
    e.preventDefault();
    var i = +c.dataset.pos, j = i + dir;
    if (j < 0 || j > 4) return;
    var id = order[i];
    swap(i, j);
    render(null, id);
    api.changed('Korb steht jetzt auf Platz ' + (j + 1) + ' von 5.');
  }

  Biber.register({
    id: 'obstkoerbe',
    story: '<p>Bella mag Obst. Am liebsten mag sie Äpfel <img class="ok-inline" src="assets/obstkoerbe/apfel.png" alt="" width="22" height="22">, ' +
      'dann Bananen <img class="ok-inline" src="assets/obstkoerbe/banane.png" alt="" width="26" height="22"> ' +
      'und am wenigsten Birnen <img class="ok-inline" src="assets/obstkoerbe/birne.png" alt="" width="16" height="22">.</p>' +
      '<p>Bella hat fünf Körbe mit Obst. Sie möchte diese Körbe nach ihrer Vorliebe anordnen. Je mehr Äpfel ein Korb hat, desto weiter links soll er stehen. ' +
      'Wenn zwei Körbe gleich viele Äpfel haben, soll der Korb mit mehr Bananen weiter links stehen.</p>',
    question: 'Ordne die Körbe so an, wie Bella das möchte.',
    howto: 'Ziehe die Körbe an einen anderen Platz, dann tauschen die beiden Körbe. Du kannst auch einen Korb antippen und dann den Korb, mit dem er tauschen soll. Mit der Tastatur: Korb auswählen und die Pfeiltasten nutzen.',
    explanation: function () {
      var list = SOLUTION.map(function (id) { var c = BASKETS[id]; return c.a + ' Äpfel, ' + c.b + ' Bananen'; }).join(' &ndash; ');
      return '<p>Zähle zuerst in jedem Korb die Äpfel: Der Korb mit den meisten Äpfeln (5) steht ganz links, der mit den wenigsten (1) ganz rechts. ' +
        'Zwei Körbe haben gleich viele Äpfel (3), dort entscheiden die Bananen: Der Korb mit 4 Bananen steht vor dem mit 2 Bananen.</p>' +
        '<p>Richtige Reihenfolge von links nach rechts: ' + list + '.</p>' +
        '<p>Auch Computer sortieren so: erst nach einem Merkmal, und bei Gleichstand nach einem zweiten.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKey);
      el.addEventListener('pointerdown', onPointerDown);
      el.addEventListener('pointermove', onPointerMove);
      el.addEventListener('pointerup', onPointerUp);
      el.addEventListener('pointercancel', onPointerCancel);
      el.addEventListener('contextmenu', function (e) { if (drag && drag.moving) e.preventDefault(); });
      render();
    },
    isComplete: function () { return touched; },
    evaluate: function () {
      return { correct: isSorted(order), answer: order.slice() };
    },
    setAnswer: function (ans) {
      order = valid(ans) ? ans.slice() : START.slice();
      touched = true; selected = null;
      render(isSorted(order) ? 'solution' : 'check');
    },
    lock: function (on) {
      locked = on;
      selected = null;
      if (on) render('check'); else render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      order = SOLUTION.slice();
      selected = null;
      touched = true;
      locked = true;
      render('solution');
    }
  });
})();
