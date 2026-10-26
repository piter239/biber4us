/* Aufgabe Mittagspause (Heft 2016, S. 48; Klasse 5-6 schwer, 7-8 mittel): Planen, Constraints.
   Lösung laut Heft: Kaffee trinken, Buch kaufen, Brief versenden, Milch kaufen (einzig möglicher Plan).
   Selbstprüfung beim Laden: Alle 24 Reihenfolgen werden durchprobiert, genau diese vermeidet alle Stoßzeiten. */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-mittagspause16-';
  var A = 'assets/mittagspause16/';

  /* Minuten ab 12:00 Uhr; rush = Stoßzeit [von, bis) */
  var ACTS = [
    { id: 'buch', name: 'Buch kaufen', place: 'Buchhandlung', dur: 15, rush: [40, 60], img: 'buch.png', w: 265, h: 300, alt: 'Buch' },
    { id: 'milch', name: 'Milch kaufen', place: 'Lebensmittelgeschäft', dur: 10, rush: [0, 40], img: 'milch.png', w: 300, h: 235, alt: 'Einkaufskorb mit Milchflasche und Brot' },
    { id: 'brief', name: 'Brief versenden', place: 'Post', dur: 15, rush: [0, 30], img: 'brief.png', w: 300, h: 226, alt: 'Briefumschlag' },
    { id: 'kaffee', name: 'Kaffee trinken', place: 'Cafeteria', dur: 20, rush: [30, 50], img: 'kaffee.png', w: 223, h: 300, alt: 'Tasse Kaffee' }
  ];
  var BY = {};
  ACTS.forEach(function (a) { BY[a.id] = a; });
  var TOTAL = 60;

  function clock(min) {
    var m = 720 + min;
    return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2);
  }
  /* Plan: die Aktivitäten lückenlos ab 12:00 Uhr; gültig, wenn keine in eine Stoßzeit fällt */
  function schedule(order) {
    var t = 0;
    return order.map(function (id) {
      var a = BY[id], s = t;
      t += a.dur;
      return { id: id, start: s, end: t };
    });
  }
  function valid(order) {
    return schedule(order).every(function (x) {
      var r = BY[x.id].rush;
      return !(x.start < r[1] && x.end > r[0]) && x.end <= TOTAL;
    });
  }
  function perms(list) {
    if (list.length <= 1) return [list];
    var out = [];
    list.forEach(function (x, i) {
      perms(list.slice(0, i).concat(list.slice(i + 1))).forEach(function (p) { out.push([x].concat(p)); });
    });
    return out;
  }
  var SOLS = perms(ACTS.map(function (a) { return a.id; })).filter(valid);
  if (SOLS.length !== 1 || SOLS[0].join() !== 'kaffee,buch,brief,milch') throw new Error('mittagspause16: Lösung stimmt nicht');
  var SOL = SOLS[0];

  function img(a, cls) {
    return h('img', { class: cls || P + 'pic', src: A + a.img, alt: '', width: a.w, height: a.h, draggable: 'false' });
  }

  var el, api;
  var slots, selected, dragging, locked, mode;

  function reset() { slots = [null, null, null, null]; selected = null; dragging = null; }

  function place(id, idx) {
    if (locked) return;
    var from = slots.indexOf(id);
    var existing = slots[idx];
    slots[idx] = id;
    if (from >= 0) slots[from] = existing === id ? null : existing;
    selected = null;
    render();
    var sb = el.querySelector('[data-slot="' + idx + '"]'); if (sb) sb.focus();
    api.changed(statusText());
  }
  function release(id) {
    if (locked) return;
    var from = slots.indexOf(id);
    if (from >= 0) slots[from] = null;
    selected = null;
    render();
    api.changed(statusText());
  }
  function statusText() {
    var n = slots.filter(Boolean).length;
    return n + ' von 4 Aktivitäten eingeordnet.';
  }

  function card(a, extra) {
    return [h('span', { class: P + 'tile' }, img(a)), h('span', { class: P + 'nm' }, a.name)].concat(extra || []);
  }

  function render() {
    var pool = ACTS.map(function (a) {
      if (slots.indexOf(a.id) >= 0) return h('div', { class: P + 'gap', 'aria-hidden': 'true' });
      return h('button', {
        type: 'button', class: P + 'act' + (selected === a.id ? ' selected' : ''), 'data-act': a.id,
        draggable: locked ? false : 'true', 'aria-pressed': String(selected === a.id), 'aria-label': a.name, disabled: locked
      }, card(a));
    });
    var list = slots.map(function (id, i) {
      var cls = P + 'slot' + (id ? ' filled' : '');
      var mark = null;
      if (id && mode === 'check') {
        var ok = id === SOL[i];
        cls += ok ? ' right' : ' wrong';
        mark = h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      } else if (mode === 'solution') cls += ' right';
      var label = (i + 1) + '. Platz' + (i === 0 ? ' (zuerst)' : i === 3 ? ' (zuletzt)' : '') + ': ' + (id ? BY[id].name : 'leer');
      return h('li', { class: P + 'step' },
        h('span', { class: P + 'no', 'aria-hidden': 'true' }, String(i + 1) + '.'),
        h('button', {
          type: 'button', class: cls, 'data-slot': String(i), draggable: id && !locked ? 'true' : false, 'data-in-slot': id || false,
          disabled: locked, 'aria-label': label
        }, id ? card(BY[id]) : h('span', { class: P + 'ph' }, 'hierher'), mark));
    });
    el.replaceChildren(h('div', { class: P + 'box' },
      h('table', { class: P + 'tab' },
        h('caption', { class: P + 'sr' }, 'Aktivitäten mit Dauer und Stoßzeiten'),
        h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Aktivität'), h('th', { scope: 'col' }, 'Dauer'), h('th', { scope: 'col' }, 'Stoßzeiten'))),
        h('tbody', null, ACTS.map(function (a) {
          return h('tr', null,
            h('th', { scope: 'row' }, h('span', { class: P + 'tn' }, h('span', { class: P + 'tile ' + P + 'small' }, img(a)), h('span', null, a.name))),
            h('td', null, a.dur + ' Minuten'),
            h('td', null, h('span', { class: P + 'rushc' }, clock(a.rush[0]) + ' Uhr–' + clock(a.rush[1]) + ' Uhr')));
        }))),
      h('div', { class: P + 'board' },
        h('section', { 'aria-label': 'Aktivitäten' }, h('h3', null, 'Aktivitäten'), h('div', { class: P + 'pool', 'data-pool': '' }, pool)),
        h('section', { 'aria-label': 'Reihenfolge' }, h('h3', null, 'Reihenfolge (12:00 Uhr bis 13:00 Uhr)'), h('ol', { class: P + 'steps' }, list)))));
  }

  function onClick(e) {
    var t = e.target.closest('[data-act],[data-slot]');
    if (!t || locked) return;
    if (t.dataset.act) {
      selected = selected === t.dataset.act ? null : t.dataset.act;
      render();
      var b = el.querySelector('[data-act="' + t.dataset.act + '"]'); if (b) b.focus();
      return;
    }
    var idx = +t.dataset.slot;
    if (selected) return place(selected, idx);
    if (slots[idx]) release(slots[idx]);
  }
  function onDragStart(e) {
    var t = e.target.closest('[data-act],[data-in-slot]');
    if (!t || locked) return;
    dragging = t.dataset.act || t.dataset.inSlot;
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

  /* Zeitplan als Tabelle: 12 Kästchen zu je 5 Minuten, wie im Heft (rot = Stoßzeit, grün = Aktivität) */
  function timeline(order) {
    var sch = schedule(order), head = '', cols = 12;
    for (var i = 0; i < cols; i++) head += '<th scope="col" class="' + P + 'tm">' + (i % 2 === 0 ? clock(i * 5).replace(/^12:/, '') : '') + '</th>';
    var rows = ACTS.map(function (a) {
      var s = sch.filter(function (x) { return x.id === a.id; })[0];
      var cells = '';
      for (var c = 0; c < cols; c++) {
        var m = c * 5, inRush = m >= a.rush[0] && m < a.rush[1], inAct = m >= s.start && m < s.end;
        cells += '<td class="' + P + 'c' + (inRush ? ' rush' : '') + (inAct ? ' act' : '') + '">' + (inAct ? '✓' : '') + '</td>';
      }
      return '<tr><th scope="row">' + a.name + '</th>' + cells + '</tr>';
    }).join('');
    return '<table class="' + P + 'time"><caption>Plan (rot: Stoßzeit, grün mit Haken: Alexandra erledigt die Aktivität; Minuten nach 12 Uhr)</caption><thead><tr><th></th>' + head + '</tr></thead><tbody>' + rows + '</tbody></table>';
  }

  Biber.register({
    id: 'mittagspause16',
    story: '<p>Während ihrer Mittagspause (12:00 Uhr bis 13:00 Uhr) möchte Alexandra Folgendes erledigen:</p>' +
      '<ul><li>ein Buch in der Buchhandlung kaufen</li><li>eine Flasche Milch im Lebensmittelgeschäft kaufen</li><li>einen Brief per Post versenden</li><li>einen Kaffee trinken in der Cafeteria.</li></ul>' +
      '<p>Für jede dieser vier Aktivitäten weiß Alexandra, wie lange sie dauern, aber nur außerhalb der Stoßzeiten. Alexandra will die Stoßzeiten vermeiden.</p>',
    question: 'Bringe die Aktivitäten in eine Reihenfolge, bei der Alexandra die Stoßzeiten vermeidet.',
    howto: 'Ziehe die Aktivitäten in die Felder 1 bis 4 (1 = zuerst). Du kannst auch erst die Aktivität und dann das Feld antippen. Ein Antippen eines belegten Feldes nimmt die Aktivität wieder heraus.',
    explanation: function () {
      return '<p>Man schaut bei jeder Aktivität, wann sie frühestens oder spätestens stattfinden darf. Das Buch muss vor 12:40 Uhr gekauft sein, die Milch gibt es erst nach 12:40 Uhr, der Brief geht erst nach 12:30 Uhr zur Post, und der Kaffee muss vor 12:30 Uhr getrunken sein (nach 12:50 Uhr bliebe nicht genug Zeit). Es gibt genau einen Plan, der alle Einschränkungen erfüllt:</p>' +
        '<p><b>Kaffee trinken</b> (12:00 bis 12:20 Uhr), <b>Buch kaufen</b> (12:20 bis 12:35 Uhr), <b>Brief versenden</b> (12:35 bis 12:50 Uhr), <b>Milch kaufen</b> (12:50 bis 13:00 Uhr).</p>' +
        '<div class="' + P + 'tlwrap">' + timeline(SOL) + '</div>' +
        '<p><b>Informatik:</b> Ein Problem ist nur dann gut gelöst, wenn alle Einschränkungen (englisch: Constraints) eingehalten werden. Das können Stoßzeiten sein, aber auch ein Hindernis auf dem Weg eines Roboters oder das Geld, das einem Projekt zur Verfügung steht. Das Lösen von Problemen unter Einschränkungen ist ein wichtiges Thema der Informatik: Gibt es mehrere Lösungen, sucht man die beste. Gibt es keine, fragt man, welche Einschränkung man am wenigsten ändern müsste. Und weil sich die Welt verändert (wenn viele Kunden sich wie Alexandra verhalten, verschieben sich die Stoßzeiten), muss man immer wieder neu planen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; mode = null; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('dragleave', onDragLeave);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', onDragEnd);
      render();
    },
    isComplete: function () { return slots.every(Boolean); },
    evaluate: function () { return { correct: valid(slots), answer: slots.slice() }; },
    setAnswer: function (ans) {
      var okIds = Array.isArray(ans) && ans.length === 4 && ans.every(function (x) { return x === null || !!BY[x]; });
      slots = okIds ? ans.slice() : [null, null, null, null];
      selected = null;
      mode = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mode = on ? (mode || 'check') : null;
      render();
    },
    reset: function () { reset(); mode = null; render(); },
    showSolution: function () {
      slots = SOL.slice();
      selected = null; locked = true; mode = 'solution';
      render();
    }
  });
})();
