/* Aufgabe Parkplätze (Klasse 11-13, schwer): drei Parkspuren als Kellerspeicher (Stapel), Ankunfts- und Abfahrtsreihenfolge */
(function () {
  'use strict';
  var h = Biber.h, sv = Biber.svg;

  var NAMES = { A: 'Ana', B: 'Beata', C: 'Clara', D: 'David', E: 'Emir', F: 'Frank', G: 'Gabi', H: 'Harald', J: 'Julia' };
  var ARRIVE = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J'];
  var LEAVE = ['G', 'D', 'B', 'E', 'J', 'C', 'H', 'A', 'F'];
  var START = [['A', 'C'], ['B'], []];          /* Spur = Liste von vorne (Ende der Spur, oben) nach hinten (zur Straße, unten) */
  var QUEUE = ['D', 'E', 'F', 'G', 'H', 'J'];
  var CAP = 3;
  /* einzige Lösung (per Brute Force über alle 3^6 Verteilungen geprüft) */
  var SOLUTION = [['A', 'C', 'E'], ['B', 'D', 'G'], ['F', 'H', 'J']];

  function rank(c) { return LEAVE.indexOf(c); }
  /* Ein Auto X ist blockiert, wenn hinter ihm (näher an der Straße) ein Auto steht, das später wegfährt. */
  function blockedIn(lane) {
    var res = [];
    lane.forEach(function (x, i) {
      for (var j = i + 1; j < lane.length; j++) if (rank(lane[j]) > rank(x)) { res.push(x); return; }
    });
    return res;
  }
  function valid(lanes) { return lanes.every(function (l) { return blockedIn(l).length === 0; }); }

  function car(letter, cls) {
    return sv('svg', { viewBox: '0 0 40 70', class: 'pk-car pk-c-' + letter + (cls ? ' ' + cls : ''), 'aria-hidden': 'true', focusable: 'false' },
      sv('rect', { x: 1, y: 8, width: 5, height: 12, rx: 2, class: 'pk-wheel' }),
      sv('rect', { x: 34, y: 8, width: 5, height: 12, rx: 2, class: 'pk-wheel' }),
      sv('rect', { x: 1, y: 48, width: 5, height: 12, rx: 2, class: 'pk-wheel' }),
      sv('rect', { x: 34, y: 48, width: 5, height: 12, rx: 2, class: 'pk-wheel' }),
      sv('rect', { x: 4, y: 2, width: 32, height: 66, rx: 11, class: 'pk-body' }),
      sv('path', { d: 'M9 16 Q20 10 31 16 L29 24 L11 24 Z', class: 'pk-glass' }),
      sv('path', { d: 'M11 55 L29 55 L31 60 Q20 63 9 60 Z', class: 'pk-glass' }),
      sv('rect', { x: 9, y: 26, width: 22, height: 27, rx: 6, class: 'pk-roof' }),
      sv('text', { x: 20, y: 46, 'text-anchor': 'middle', class: 'pk-letter' }, letter));
  }

  var el, api;
  var lanes, locked, dragging, mark;

  function copy(ls) { return ls.map(function (l) { return l.slice(); }); }
  function reset() { lanes = copy(START); dragging = null; mark = null; }
  function placed() { return lanes[0].length + lanes[1].length + lanes[2].length - 3; }
  function waiting() { return QUEUE.slice(placed()); }
  function nextCar() { return waiting()[0] || null; }
  /* zuletzt abgestellte Auto (nach Ankunftsreihenfolge) */
  function statusText() {
    var n = nextCar();
    return n ? 'Als Nächstes fährt ' + NAMES[n] + ' (' + n + ') ein.' : 'Alle Autos stehen. Du kannst prüfen.';
  }

  function park(idx) {
    var n = nextCar();
    if (locked || !n || lanes[idx].length >= CAP) return;
    lanes[idx].push(n);
    render();
    api.changed(statusText());
    var b = el.querySelector('[data-lane="' + idx + '"]');
    if (b && !b.disabled) b.focus();
  }
  function undo() {
    if (locked || placed() === 0) return;
    var last = QUEUE[placed() - 1];
    lanes.forEach(function (l) { if (l[l.length - 1] === last) l.pop(); });
    render();
    api.changed(statusText());
    var u = el.querySelector('[data-undo]');
    if (u && !u.disabled) u.focus();
  }

  function laneLabel(i) {
    var l = lanes[i];
    var parts = [];
    for (var k = 0; k < CAP; k++) parts.push(l[k] ? NAMES[l[k]] : 'frei');
    return 'Spur ' + (i + 1) + ', Plätze von ganz vorne bis zur Straße: ' + parts.join(', ');
  }

  function render() {
    var next = nextCar();
    var blocked = [];
    if (mark === 'check') lanes.forEach(function (l) { blocked = blocked.concat(blockedIn(l)); });

    /* wartende Autos */
    var strip = QUEUE.map(function (c, i) {
      if (i < placed()) return h('span', { class: 'pk-cell', 'aria-hidden': 'true' });
      var isNext = c === next;
      if (isNext && !locked) {
        return h('button', {
          type: 'button', class: 'pk-wait next', draggable: 'true', 'data-drag': c,
          'aria-label': NAMES[c] + ' (' + c + '), fährt als Nächstes ein. Tippe auf eine Spur, um das Auto abzustellen.'
        }, car(c), h('span', { class: 'pk-nm' }, NAMES[c]));
      }
      return h('span', { class: 'pk-wait', role: 'img', 'aria-label': NAMES[c] + ' (' + c + '), wartet' }, car(c), h('span', { class: 'pk-nm' }, NAMES[c]));
    });

    /* Parkspuren */
    var laneEls = lanes.map(function (l, i) {
      var slots = [];
      for (var k = 0; k < CAP; k++) {
        var c = l[k];
        var inner = null;
        if (c) {
          var bad = blocked.indexOf(c) >= 0;
          inner = h('span', { class: 'pk-spot' + (bad ? ' bad' : '') + (QUEUE.indexOf(c) < 0 ? ' fixed' : '') },
            car(c), bad ? h('span', { class: 'pk-x', 'aria-hidden': 'true' }, '✗') : null);
        }
        slots.push(h('span', { class: 'pk-slot' }, inner));
      }
      var full = l.length >= CAP;
      var cls = 'pk-lane' + (full ? ' full' : '') + (mark === 'solution' ? ' sol' : '');
      return h('button', {
        type: 'button', class: cls, 'data-lane': String(i), disabled: locked || !next || full,
        'aria-label': laneLabel(i) + (next && !full && !locked ? '. Tippen: ' + NAMES[next] + ' hier abstellen.' : '')
      }, slots);
    });

    var legend = LEAVE.map(function (c, i) {
      return h('li', { 'aria-label': (i + 1) + '. ' + NAMES[c] }, h('span', { class: 'pk-ord' }, String(i + 1)), car(c, 'pk-mini'));
    });

    el.replaceChildren(h('div', { class: 'pk-board' },
      h('section', { 'aria-label': 'Wartende Autos', class: 'pk-queue' },
        h('h3', null, 'Ankommende Autos'),
        h('div', { class: 'pk-strip' }, strip),
        h('p', { class: 'pk-hint' }, next ? 'Als Nächstes: ' + NAMES[next] + ' (' + next + ')' : 'Alle Autos stehen.')),
      h('div', { class: 'pk-lot-wrap' },
        h('div', { class: 'pk-lot' },
          h('div', { class: 'pk-hedge', 'aria-hidden': 'true' }),
          h('div', { class: 'pk-lanes' }, laneEls),
          h('div', { class: 'pk-road', 'aria-hidden': 'true' }, h('span', null, 'Straße')))),
      h('div', { class: 'pk-tools' },
        h('button', { type: 'button', class: 'btn ghost', 'data-undo': '', disabled: locked || placed() === 0 }, 'Letztes Auto zurücknehmen')),
      h('section', { 'aria-label': 'Reihenfolge beim Wegfahren', class: 'pk-legend' },
        h('h3', null, 'Wegfahren in dieser Reihenfolge'),
        h('ol', null, legend))));
  }

  /* Eingaben */
  function onClick(e) {
    if (locked) return;
    if (e.target.closest('[data-undo]')) return undo();
    var l = e.target.closest('[data-lane]');
    if (l) park(+l.dataset.lane);
  }
  function onDragStart(e) {
    var t = e.target.closest('[data-drag]');
    if (!t || locked) return;
    dragging = t.dataset.drag;
    e.dataTransfer.setData('text/plain', dragging);
    e.dataTransfer.effectAllowed = 'move';
    t.classList.add('dragging');
  }
  function onDragOver(e) {
    var l = e.target.closest('[data-lane]');
    if (!l || !dragging || l.disabled) return;
    e.preventDefault();
    l.classList.add('over');
  }
  function onDragLeave(e) {
    var l = e.target.closest('[data-lane]');
    if (l) l.classList.remove('over');
  }
  function onDrop(e) {
    var l = e.target.closest('[data-lane]');
    if (!l || !dragging) return;
    e.preventDefault();
    dragging = null;
    park(+l.dataset.lane);
  }
  function onDragEnd() { dragging = null; if (!locked) render(); }

  Biber.register({
    id: 'parkplaetze',
    story: '<p>Zur Party kommen 9 Gäste mit ihren Autos. Vor dem Haus können 9 Autos so parken, dass in 3 Parkspuren jeweils 3 Autos hintereinander stehen. Die Gäste kommen in dieser Reihenfolge:</p>' +
      '<p><strong>A</strong>na, <strong>B</strong>eata, <strong>C</strong>lara, <strong>D</strong>avid, <strong>E</strong>mir, <strong>F</strong>rank, <strong>G</strong>abi, <strong>H</strong>arald und zuletzt <strong>J</strong>ulia.</p>' +
      '<p>Beim Einparken wählt jeder eine Parkspur aus und fährt darin so weit wie möglich nach vorne.</p>' +
      '<p>Die Gäste wollen in dieser Reihenfolge von der Party wegfahren:</p>' +
      '<p><strong>G</strong>abi, <strong>D</strong>avid, <strong>B</strong>eata, <strong>E</strong>mir, <strong>J</strong>ulia, <strong>C</strong>lara, <strong>H</strong>arald, <strong>A</strong>na und zuletzt <strong>F</strong>rank.</p>' +
      '<p>Die Autos von Ana, Beata und Clara sind bereits geparkt. Nun parken die anderen Gäste nach und nach ein. Sie wollen so parken, dass beim Wegfahren kein Auto von einem anderen blockiert ist, das später wegfährt.</p>',
    question: 'Zeige den Gästen, wie sie so parken können! Platziere die restlichen 6 Autos in den Parkspuren.',
    howto: 'Die Autos kommen nacheinander von der Straße (unten). Tippe auf die Spur, in die das nächste Auto fahren soll, oder ziehe es dorthin. Es fährt bis ganz nach vorne (oben) bzw. bis hinter das letzte Auto der Spur. Du musst die Reihenfolgen beim Ankommen und beim Wegfahren berücksichtigen.',
    explanation: function () {
      return '<p>Jede Parkspur ist ein <strong>Stapel</strong> (Kellerspeicher): Wer zuletzt hineinfährt, steht ganz hinten und muss zuerst wieder hinaus („last in, first out“). In jeder Spur muss die Abfahrtsreihenfolge also genau umgekehrt zur Ankunftsreihenfolge sein.</p>' +
        '<p><strong>Lösung:</strong> Spur 1: Ana, Clara, Emir. Spur 2: Beata, David, Gabi. Spur 3: Frank, Harald, Julia.</p>' +
        '<ul class="pk-why">' +
        '<li>Frank fährt als Letzter weg und muss deshalb als Erster in eine leere Spur: Spur 3. David und Emir kommen vor Frank an und dürfen nicht in Spur 3.</li>' +
        '<li>Emir fährt erst nach Beata weg, darf also nicht hinter ihr stehen: Spur 1 (hinter Clara, die später wegfährt). Dann ist Spur 1 voll.</li>' +
        '<li>David fährt vor Beata weg: Spur 2 hinter Beata. Harald und Julia fahren nach David weg und müssen deshalb hinter Frank in Spur 3. Gabi fährt als Erste weg: Spur 2 hinter David.</li></ul>' +
        '<p>Mit genau dieser Verteilung ist es möglich; eine andere gibt es nicht (ein Computerprogramm hat alle Verteilungen geprüft).</p>';
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
    isComplete: function () { return placed() === QUEUE.length; },
    evaluate: function () { return { correct: valid(lanes), answer: { lanes: copy(lanes) } }; },
    setAnswer: function (ans) {
      var ok = ans && Array.isArray(ans.lanes) && ans.lanes.length === 3;
      lanes = ok ? copy(ans.lanes) : copy(START);
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? 'check' : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      lanes = copy(SOLUTION);
      locked = true;
      mark = 'solution';
      render();
    }
  });
})();
