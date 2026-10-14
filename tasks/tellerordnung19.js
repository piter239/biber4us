/* Aufgabe Teller-Ordnung (Biber 2019; Klasse 5-6 mittel, 7-8 einfach): großen Teller sortiert einfügen, mit möglichst wenigen Umstellungen */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-tellerordnung19-';

  var N = 10;                                        /* Plätze im Gestell (11 Stäbe) */
  var START = ['L', 'L', 'L', 'M', 'M', 'M', 'S', 'S', null, null];
  var MIN_MOVES = 2;                                 /* laut Heft und per Skript (Breitensuche) bestätigt */
  var SOLUTION = ['L', 'L', 'L', 'L', 'M', 'M', 'M', 'S', 'S', null];
  var SIZE = {
    L: { name: 'großer Teller', h: 150, light: '#bddc52', dark: '#8aa22e' },
    M: { name: 'mittlerer Teller', h: 122, light: '#55d9c3', dark: '#0fa085' },
    S: { name: 'kleiner Teller', h: 88, light: '#da5552', dark: '#a02421' }
  };
  var ORDER = { L: 0, M: 1, S: 2 };
  var BASE = 168;                                    /* Höhe der Auflage im Platz-SVG */

  /* Ein Teller als schräg stehende Linse (helle Vorderseite, dunkle Kante) */
  function plateSvg(kind, x0, base) {
    var s = SIZE[kind], H = s.h;
    var tx = x0 + 8, ty = base - H, bx = x0 + 34, by = base;
    var light = 'M' + tx + ' ' + ty + ' C ' + (tx - 22) + ' ' + (ty + H * 0.22) + ' ' + (bx - 40) + ' ' + (by - H * 0.3) + ' ' + bx + ' ' + by + ' Z';
    var dark = 'M' + tx + ' ' + ty + ' C ' + (tx + 6) + ' ' + (ty + H * 0.3) + ' ' + (bx + 1) + ' ' + (by - H * 0.3) + ' ' + bx + ' ' + by + ' Z';
    return '<path d="' + light + '" fill="' + s.light + '"/><path d="' + dark + '" fill="' + s.dark + '"/>';
  }

  /* ---- Prüfung ---- */
  function sortedContiguous(slots) {
    var first = -1, last = -1, i;
    for (i = 0; i < N; i++) if (slots[i]) { if (first < 0) first = i; last = i; }
    if (first < 0) return false;
    for (i = first; i <= last; i++) {
      if (!slots[i]) return false;
      if (i > first && ORDER[slots[i]] < ORDER[slots[i - 1]]) return false;
    }
    return true;
  }
  function count(slots, k) { return slots.filter(function (c) { return c === k; }).length; }

  var el, api, board;
  var slots, placed, moves, selected, locked, mode;   /* mode: null | 'check' | 'solution' */
  var dragging, focusKey;

  function reset() { slots = START.slice(); placed = false; moves = 0; selected = null; dragging = null; mode = null; }

  function result() {
    var full = placed && count(slots, 'L') === 4 && count(slots, 'M') === 3 && count(slots, 'S') === 2;
    var ok = full && sortedContiguous(slots) && moves <= MIN_MOVES;
    return { sorted: full && sortedContiguous(slots), ok: ok };
  }

  function moveTo(from, to) {
    if (locked || slots[to]) return;
    if (from === 'new') {
      if (placed) return;
      slots[to] = 'L'; placed = true;
    } else {
      if (!slots[from]) return;
      slots[to] = slots[from]; slots[from] = null; moves++;
    }
    selected = null;
    focusKey = 's' + to;
    render();
    api.changed();
  }

  function slotLabel(i) {
    var c = slots[i];
    return 'Platz ' + (i + 1) + ': ' + (c ? SIZE[c].name : 'frei') + (selected === i ? ', ausgewählt' : '');
  }

  function render() {
    var res = (mode === 'check' || mode === 'solution') ? result() : null;
    var cells = [];
    for (var i = 0; i < N; i++) {
      (function (i) {
        var c = slots[i], cls = P + 'slot' + (c ? ' filled' : ' free') + (selected === i ? ' selected' : '');
        if (mode === 'solution' && c && START[i] !== c) cls += ' ' + P + 'moved';
        var svg = '<svg viewBox="0 0 90 190" aria-hidden="true" focusable="false">' +
          '<rect class="' + P + 'bar" x="0" y="' + (BASE - 2) + '" width="90" height="20"/>' +
          '<rect class="' + P + 'pole" x="1" y="40" width="6" height="' + (BASE - 38) + '"/>' +
          (i === N - 1 ? '<rect class="' + P + 'pole" x="83" y="40" width="6" height="' + (BASE - 38) + '"/>' : '') +
          (c ? '<g class="' + P + 'plate">' + plateSvg(c, 28, BASE) + '</g>' : '') + '</svg>';
        var btn = h('button', {
          type: 'button', class: cls, 'data-key': 's' + i, 'data-slot': String(i),
          'aria-label': slotLabel(i), 'aria-pressed': c ? String(selected === i) : false,
          draggable: c && !locked ? 'true' : false, disabled: locked
        });
        btn.innerHTML = svg;
        cells.push(h('div', { class: P + 'cell' }, btn, h('span', { class: P + 'num', 'aria-hidden': 'true' }, String(i + 1))));
      })(i);
    }
    var holderBtn = null;
    if (!placed) {
      holderBtn = h('button', {
        type: 'button', class: P + 'new' + (selected === 'new' ? ' selected' : ''), 'data-key': 'new', 'data-new': '1',
        'aria-label': 'Neuer großer Teller' + (selected === 'new' ? ', ausgewählt' : ''), 'aria-pressed': String(selected === 'new'),
        draggable: locked ? false : 'true', disabled: locked
      });
      holderBtn.innerHTML = '<svg viewBox="0 0 90 170" aria-hidden="true" focusable="false">' + plateSvg('L', 24, 160) + '</svg>';
    }
    var holder = h('div', { class: P + 'holder' + (placed ? ' placed' : '') },
      holderBtn || h('span', { class: P + 'ghost' }, 'Der neue Teller steht im Gestell.'),
      h('span', { class: P + 'hint' }, placed ? '' : 'Neuer Teller'));
    var status = h('div', { class: P + 'status', 'aria-live': 'polite' },
      h('span', null, 'Umgestellte Teller: '), h('strong', null, String(moves)));
    var rackCls = P + 'rack' + (res ? (res.ok ? ' right' : ' wrong') : '');
    var rack = h('div', { class: rackCls, 'data-rack': '1', role: 'group', 'aria-label': 'Spülmaschine mit 10 Plätzen' }, cells);
    var verdict = null;
    if (res) {
      verdict = h('p', { class: P + 'verdict ' + (res.ok ? 'ok' : 'bad') },
        res.ok ? 'Sortiert, mit nur ' + moves + ' umgestellten Tellern.' :
          (res.sorted ? 'Sortiert, aber mit ' + moves + ' Umstellungen - es geht mit weniger.' : 'Die Teller sind noch nicht in Ordnung.'));
    }
    board = h('div', { class: P + 'board' },
      h('div', { class: P + 'top' }, holder, h('div', { class: P + 'tools' }, status)),
      rack, verdict);
    el.replaceChildren(board);
    if (focusKey) {
      var f = el.querySelector('[data-key="' + focusKey + '"]');
      if (f && !f.disabled) { try { f.focus({ preventScroll: true }); } catch (e) { /* ignorieren */ } }
      focusKey = null;
    }
  }

  function onClick(e) {
    if (locked) return;
    var t = e.target.closest('[data-new],[data-slot]');
    if (!t) return;
    if (t.dataset.new) {
      selected = selected === 'new' ? null : 'new';
      focusKey = 'new';
      render();
      return;
    }
    var i = +t.dataset.slot;
    if (selected !== null && selected !== i && !slots[i]) return moveTo(selected, i);
    if (slots[i]) { selected = selected === i ? null : i; focusKey = 's' + i; render(); }
  }
  function onDragStart(e) {
    var t = e.target.closest('[data-new],[data-slot]');
    if (!t || locked) return;
    var src = t.dataset.new ? 'new' : +t.dataset.slot;
    if (src !== 'new' && !slots[src]) { e.preventDefault(); return; }
    dragging = src;
    e.dataTransfer.setData('text/plain', String(src));
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e) {
    var t = e.target.closest('[data-slot]');
    if (dragging === null || !t || slots[+t.dataset.slot]) return;
    e.preventDefault();
    t.classList.add('over');
  }
  function onDragLeave(e) {
    var t = e.target.closest('[data-slot]');
    if (t) t.classList.remove('over');
  }
  function onDrop(e) {
    var t = e.target.closest('[data-slot]');
    if (dragging === null || !t) return;
    e.preventDefault();
    var src = dragging;
    dragging = null;
    moveTo(src, +t.dataset.slot);
  }
  function onDragEnd() { dragging = null; if (!locked) render(); }

  Biber.register({
    id: 'tellerordnung19',
    story:
      '<p>In der Spülmaschine herrscht Ordnung! Die Teller werden immer so in die Maschine einsortiert (von links): zuerst die großen Teller, dann die mittleren und schließlich die kleinen Teller. Es gibt keine Lücken zwischen den Tellern.</p>' +
      '<p>Nach dem Abendessen soll ein weiterer großer Teller in die Spülmaschine einsortiert werden. Damit danach wieder Ordnung herrscht, müssen einige andere Teller umgestellt werden.</p>',
    question: 'Sortiere den Teller richtig ein. Stelle dazu so wenige Teller um wie möglich.',
    howto: 'Tippe einen Teller an und dann einen freien Platz, oder ziehe den Teller dorthin. Der neue Teller wird nur einsortiert und zählt nicht als Umstellung. Der Zähler zeigt, wie viele Teller du umgestellt hast.',
    explanation: function () {
      return '<p>Man kann den Teller mit nur <strong>zwei</strong> Umstellungen einsortieren: Zuerst kommt der kleine Teller von Platz 7 auf Platz 9, dann der mittlere Teller von Platz 4 auf Platz 7. Jetzt ist Platz 4 frei, und der neue große Teller passt dorthin.</p>' +
        '<p>Weniger geht nicht: Bei den großen Tellern gibt es keine Lücke. Also muss ein Teller von Platz 4 weg, und er muss selbst einen Platz finden, ohne die Ordnung zu stören. Dafür ist mindestens ein weiterer Teller nötig.</p>' +
        '<p>Das allgemeine Einfüge-Verfahren verschiebt alle kleineren Teller um einen Platz nach rechts, hier also fünf Teller. Im schlechtesten Fall muss es alle vorhandenen Daten bewegen, das ist bei großen Datenmengen viel Arbeit. Deshalb suchen Informatikerinnen und Informatiker schnellere Verfahren, die zum Beispiel nutzen, dass es viele gleiche Daten gibt, wie hier die gleich großen Teller.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; focusKey = null; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('dragleave', onDragLeave);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', onDragEnd);
      render();
    },
    isComplete: function () { return placed; },
    evaluate: function () {
      return { correct: result().ok, answer: { slots: slots.slice(), moves: moves } };
    },
    setAnswer: function (ans) {
      var s = ans && ans.slots;
      if (Array.isArray(s) && s.length === N) {
        slots = s.slice(); placed = true; moves = +ans.moves || 0;
      } else reset();
      selected = null;
      mode = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      selected = null;
      if (on) mode = mode === 'solution' ? 'solution' : 'check'; else mode = null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      slots = SOLUTION.slice(); placed = true; moves = MIN_MOVES; selected = null; locked = true; mode = 'solution';
      render();
    }
  });
})();
