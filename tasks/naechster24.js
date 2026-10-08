/* Aufgabe Der Nächste bitte! (Heft 2024, Klasse 5-6 schwer, 7-8 mittel, 9-10 einfach): Scheduling nach "Shortest Job First" */
(function () {
  'use strict';
  var h = Biber.h;
  var A = 'assets/naechster24/';

  /* Biber in der Reihenfolge ihrer Ankunft (Heft S. 23): Ankunft in Minuten nach 9:00, Anzahl Bücher */
  var BEAVERS = [
    { id: 'ada', name: 'Ada', at: 0, books: 4, col: '--accent' },
    { id: 'bina', name: 'Bina', at: 2, books: 6, col: '--c2' },
    { id: 'cora', name: 'Cora', at: 3, books: 2, col: '--c3' },
    { id: 'dan', name: 'Dan', at: 5, books: 4, col: '--c4' },
    { id: 'elia', name: 'Elia', at: 11, books: 1, col: '--slot-line' }
  ];
  var B = {};
  BEAVERS.forEach(function (b) { B[b.id] = b; });
  var ORDER = ['ada', 'bina', 'cora', 'dan', 'elia'];

  /* Der Bibliothekar nimmt von den Wartenden immer den mit den wenigsten Büchern (bei Gleichstand den, der früher kam).
     Ergebnis laut offiziellem Heft (S. 24): Ada, Cora, Dan, Bina, Elia. */
  function schedule() {
    var t = 0, rest = BEAVERS.slice(), plan = [];
    while (rest.length) {
      var waiting = rest.filter(function (b) { return b.at <= t; });
      if (!waiting.length) { t = Math.min.apply(null, rest.map(function (b) { return b.at; })); continue; }
      waiting.sort(function (a, b) { return a.books - b.books || a.at - b.at; });
      var n = waiting[0];
      plan.push({ id: n.id, from: t, to: t + n.books });
      t += n.books;
      rest = rest.filter(function (b) { return b !== n; });
    }
    return plan;
  }
  var PLAN = schedule();
  var SOLUTION = PLAN.map(function (p) { return p.id; });

  function clock(min) { return '9:' + (min < 10 ? '0' : '') + min; }

  function chip(id, extra) {
    var b = B[id];
    return h('span', { class: 't-naechster24-chip' + (extra ? ' ' + extra : ''), style: '--chip:var(' + b.col + ')' }, b.name);
  }
  function chipHtml(id) {
    var b = B[id];
    return '<span class="t-naechster24-chip" style="--chip:var(' + b.col + ')">' + b.name + '</span>';
  }

  var BOOKCOL = ['--c1', '--c4', '--c6', '--c2', '--c5', '--c3'];
  function stackSvg(n) {
    var bh = 9, w = 34;
    var rects = '';
    for (var i = 0; i < n; i++) {
      var y = (n - 1 - i) * bh;
      rects += '<rect x="' + (i % 2 ? 2 : 0) + '" y="' + y + '" width="30" height="' + (bh - 1) + '" rx="1.5" fill="var(' + BOOKCOL[i % BOOKCOL.length] + ')"/>' +
        '<rect x="' + ((i % 2 ? 2 : 0) + 3) + '" y="' + (y + 3) + '" width="24" height="2" fill="var(--paper)" opacity="0.85"/>';
    }
    return '<svg class="t-naechster24-stack" viewBox="0 0 ' + w + ' ' + (n * bh) + '" width="' + w + '" height="' + (n * bh) + '" aria-hidden="true" focusable="false">' + rects + '</svg>';
  }

  var el, api, locked, slots, dragging, mode;

  function reset() { slots = [null, null, null, null, null]; dragging = null; mode = null; }
  function firstFree() { return slots.indexOf(null); }
  function filled() { return slots.filter(Boolean).length; }
  function status() { return filled() + ' von 5 Plätzen belegt.'; }

  function put(id, idx) {
    if (locked) return;
    var from = slots.indexOf(id);
    var existing = slots[idx];
    slots[idx] = id;
    if (from >= 0) slots[from] = existing === id ? null : existing;
    render();
    api.changed(status());
  }
  function release(id) {
    if (locked) return;
    var from = slots.indexOf(id);
    if (from >= 0) slots[from] = null;
    render();
    api.changed(status());
  }

  function table() {
    var rows = BEAVERS.map(function (b) {
      return '<li class="t-naechster24-row"><span class="t-naechster24-who">' + chipHtml(b.id) + '</span>' +
        '<span class="t-naechster24-time"><span class="t-naechster24-lab">Ankunft</span>' + clock(b.at) + ' Uhr</span>' +
        '<span class="t-naechster24-bk">' + stackSvg(b.books) + '<span>' + b.books + (b.books === 1 ? ' Buch' : ' Bücher') + '</span></span></li>';
    }).join('');
    var ul = h('ul', { class: 't-naechster24-table', 'aria-label': 'Ankunft und Bücher der fünf Biber' });
    ul.innerHTML = rows;
    return ul;
  }

  function render(markResult) {
    var pool = ORDER.map(function (id) {
      if (slots.indexOf(id) >= 0) return h('span', { class: 't-naechster24-gap', 'aria-hidden': 'true' });
      return h('button', {
        type: 'button', class: 't-naechster24-pick', 'data-pick': id, draggable: locked ? false : 'true', disabled: locked,
        'aria-label': B[id].name + ' als Nächste einsortieren'
      }, chip(id));
    });
    var sl = slots.map(function (id, i) {
      var cls = 't-naechster24-slot' + (id ? ' filled' : '');
      var mark = null;
      if (markResult && id) {
        var ok = id === SOLUTION[i];
        cls += ok ? ' right' : ' wrong';
        mark = h('span', { class: 't-naechster24-mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      } else if (markResult === 'solution') cls += ' right';
      return h('li', { class: 't-naechster24-item' },
        h('span', { class: 't-naechster24-no', 'aria-hidden': 'true' }, (i + 1) + '.'),
        h('button', {
          type: 'button', class: cls, 'data-slot': String(i), 'data-in-slot': id || false, draggable: id && !locked ? 'true' : false, disabled: locked,
          'aria-label': 'Platz ' + (i + 1) + ': ' + (id ? B[id].name + (locked ? '' : ', zum Entfernen antippen') : 'leer')
        }, id ? chip(id) : h('span', { class: 't-naechster24-ph' }, '–'), mark));
    });
    el.replaceChildren(h('div', { class: 't-naechster24' },
      h('section', { 'aria-label': 'Wer kommt wann mit wie vielen Büchern?' }, h('h3', null, 'Wer kommt wann?'), table()),
      h('section', { 'aria-label': 'Biber zum Einsortieren' }, h('h3', null, 'Biber'), h('div', { class: 't-naechster24-pool', 'data-pool': '' }, pool)),
      h('section', { 'aria-label': 'Reihenfolge der Rückgabe' }, h('h3', null, 'Reihenfolge der Rückgabe'), h('ol', { class: 't-naechster24-slots' }, sl))));
  }

  function onClick(e) {
    var t = e.target.closest('[data-pick],[data-slot]');
    if (!t || locked) return;
    if (t.dataset.pick) {
      var i = firstFree();
      if (i >= 0) put(t.dataset.pick, i);
      return;
    }
    var id = slots[+t.dataset.slot];
    if (id) release(id);
  }
  function onDragStart(e) {
    var t = e.target.closest('[data-pick],[data-in-slot]');
    if (!t || locked) return;
    dragging = t.dataset.pick || t.dataset.inSlot;
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
    if (s.dataset.slot) put(id, +s.dataset.slot); else release(id);
  }
  function onDragEnd() { dragging = null; if (!locked) render(); }

  function gantt() {
    var total = PLAN[PLAN.length - 1].to;
    var bars = PLAN.map(function (p) {
      var b = B[p.id];
      return '<span class="t-naechster24-bar" style="--chip:var(' + b.col + ');flex:' + (p.to - p.from) + ' 1 0" title="' + b.name + ': ' + clock(p.from) + ' bis ' + clock(p.to) + ' Uhr">' + b.name.charAt(0) + '</span>';
    }).join('');
    return '<div class="t-naechster24-gantt" role="img" aria-label="Zeitstrahl von ' + clock(0) + ' bis ' + clock(total) + ' Uhr: ' +
      PLAN.map(function (p) { return B[p.id].name + ' ' + clock(p.from) + ' bis ' + clock(p.to); }).join(', ') + '">' + bars + '</div>';
  }

  Biber.register({
    id: 'naechster24',
    story: '<p>Die Biber in Holzdorf sind fleißige Leserinnen und Leser. In der Bibliothek müssen sie deshalb oft warten, wenn sie ihre Bücher zurückgeben wollen.</p>' +
      '<p>Wenn ein Biber an der Reihe ist, gibt er alle mitgebrachten Bücher zurück. Die Rückgabe eines Buchs dauert immer genau <b>eine Minute</b>. Ist ein Biber fertig, kommt der nächste Biber aus dem Wartebereich an die Reihe. Das ist immer der Biber mit den <b>wenigsten Büchern</b>.</p>' +
      '<img class="t-naechster24-pic" src="' + A + 'bibliothek.png" width="400" height="143" alt="Zeichnung: Biber an der Rückgabe der Bibliothek und wartende Biber mit Bücherstapeln" draggable="false">' +
      '<p>An einem Morgen kommen nach und nach 5 Biber und wollen ihre Bücher zurückgeben. Die Übersicht zeigt für jeden Biber, wann er im Wartebereich ankommt und wie viele Bücher er mitgebracht hat. Ada kommt als erste und kann sofort ihre 4 Bücher zurückgeben.</p>',
    question: 'In welcher Reihenfolge geben die Biber ihre Bücher zurück?',
    howto: 'Tippe die Biber nacheinander an, in der Reihenfolge der Rückgabe. Du kannst sie auch auf die nummerierten Plätze ziehen. Ein Biber auf einem Platz geht durch Antippen zurück.',
    explanation: function () {
      var lines = [
        'Ada ist um 9:00 Uhr allein und gibt 4 Bücher zurück. Sie ist um 9:04 Uhr fertig.',
        'Inzwischen warten Bina (6 Bücher) und Cora (2 Bücher). Cora hat die wenigsten und kommt dran, bis 9:06 Uhr.',
        'Jetzt wartet auch Dan (4 Bücher). Er hat weniger als Bina und ist bis 9:10 Uhr dran.',
        'Dann ist Bina die Einzige im Wartebereich und gibt ihre 6 Bücher bis 9:16 Uhr zurück.',
        'Elia kam um 9:11 Uhr und kommt als Letzter dran.'
      ];
      return '<p>Man spielt die Bibliothek Schritt für Schritt durch. Richtig ist: ' + SOLUTION.map(chipHtml).join(' ') + '</p>' +
        gantt() +
        '<ul>' + lines.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ul>' +
        '<p><b>Informatik:</b> Ein Computer muss viele Aufgaben (Prozesse) erledigen, und ein Programm im Betriebssystem, der <i>Scheduler</i>, entscheidet, welcher Prozess wann die Zentraleinheit nutzen darf. ' +
        'Eine mögliche Strategie ist <i>Shortest Job First</i>: Wer am wenigsten Arbeit hat, kommt zuerst dran. Andere Strategien sind zum Beispiel „Wer zuerst kommt, mahlt zuerst“ oder Round Robin.</p>';
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
      var ok = SOLUTION.every(function (id, i) { return slots[i] === id; });
      return { correct: ok, answer: slots.slice() };
    },
    setAnswer: function (ans) {
      slots = ans.slice();
      mode = 'check';
      render('check');
    },
    lock: function (on) {
      locked = on;
      mode = on ? (mode || 'check') : null;
      render(on ? mode : null);
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      slots = SOLUTION.slice();
      locked = true;
      mode = 'solution';
      render('solution');
    }
  });
})();
