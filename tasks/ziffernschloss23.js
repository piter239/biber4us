/* Aufgabe Ziffernschloss (Biber 2023, S. 67; Klasse 9-10 schwer, 11-13 mittel): Permutation aus der Inversionssequenz bestimmen */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-ziffernschloss23-';

  /* Bobs neue Notation "n >> c": links von Ziffer c stehen genau n größere Ziffern */
  var NOTE = [[3, 0], [2, 1], [4, 2], [4, 3], [1, 4], [1, 5], [1, 6], [0, 7]];
  var DIGITS = [0, 1, 2, 3, 4, 5, 6, 7];
  /* offizielle Lösung (Heft S. 67/68): 7 4 1 0 5 6 2 3; per Skript (alle 8! Anordnungen) ist sie die einzige, die zur Notation passt */
  var SOLUTION = [7, 4, 1, 0, 5, 6, 2, 3];

  function fits(code) {
    return NOTE.every(function (nc) {
      var pos = code.indexOf(nc[1]);
      return pos >= 0 && code.slice(0, pos).filter(function (x) { return x > nc[1]; }).length === nc[0];
    });
  }
  function isRight(code) { return code.every(function (d) { return d !== null; }) && fits(code); }

  function note(n, c) { return '<span class="' + P + 'n"><b>' + n + '</b> &gt;&gt; <b>' + c + '</b></span>'; }
  function tiles(list) { return '<span class="' + P + 'tiles">' + list.map(function (d) { return '<span class="' + P + 'key ' + P + 'static">' + d + '</span>'; }).join('') + '</span>'; }

  var el, api, slots, selected, dragging, locked, mark;

  function reset() { slots = DIGITS.map(function () { return null; }); selected = null; dragging = null; mark = null; }

  function place(d, idx) {
    if (locked) return;
    var from = slots.indexOf(d);
    var existing = slots[idx];
    slots[idx] = d;
    if (from >= 0) slots[from] = existing === d ? null : existing;
    selected = null;
    render(idx);
    api.changed();
  }
  function release(d) {
    if (locked) return;
    var from = slots.indexOf(d);
    if (from >= 0) slots[from] = null;
    selected = null;
    render();
    api.changed();
  }

  function render(focusSlot) {
    var pool = DIGITS.map(function (d) {
      if (slots.indexOf(d) >= 0) return h('span', { class: P + 'gap', 'aria-hidden': 'true' });
      return h('button', {
        type: 'button', class: P + 'key ' + P + 'tile' + (selected === d ? ' selected' : ''), 'data-d': String(d), draggable: locked ? false : 'true',
        'aria-pressed': String(selected === d), 'aria-label': 'Ziffer ' + d + (selected === d ? ', ausgewählt' : ''), disabled: locked
      }, String(d));
    });
    var cells = slots.map(function (d, i) {
      var cls = P + 'slot' + (d !== null ? ' filled' : '');
      var m = null;
      if (mark === 'check') {
        var ok = d === SOLUTION[i];
        cls += ok ? ' right' : ' wrong';
        m = h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      } else if (mark === 'solution') cls += ' right';
      return h('div', { class: P + 'cell' },
        h('button', {
          type: 'button', class: cls, 'data-slot': String(i), disabled: locked, draggable: d !== null && !locked ? 'true' : false, 'data-in': d !== null ? String(d) : false,
          'aria-label': (i + 1) + '. Stelle: ' + (d !== null ? 'Ziffer ' + d : 'leer')
        }, d !== null ? h('span', { class: P + 'key ' + P + 'placed' }, String(d)) : null, m),
        h('span', { class: P + 'pos', 'aria-hidden': 'true' }, String(i + 1)));
    });
    el.replaceChildren(h('div', { class: P + 'board' },
      h('div', { class: P + 'pool', 'data-pool': '', role: 'group', 'aria-label': 'Ziffern 0 bis 7' }, pool),
      h('div', { class: P + 'code', role: 'group', 'aria-label': 'Der neue Code, acht Stellen' }, cells),
      h('p', { class: P + 'hint' }, 'Stelle 1 ist ganz links.')));
    if (focusSlot !== undefined) {
      var f = el.querySelector('[data-slot="' + focusSlot + '"]');
      if (f) f.focus({ preventScroll: true });
    }
  }

  function onClick(e) {
    var t = e.target.closest('[data-d],[data-slot]');
    if (!t || locked) return;
    if (t.dataset.d !== undefined) {
      var d = +t.dataset.d;
      selected = selected === d ? null : d;
      render();
      var b = el.querySelector('[data-d="' + d + '"]');
      if (b) b.focus({ preventScroll: true });
      return;
    }
    var idx = +t.dataset.slot;
    if (selected !== null) return place(selected, idx);
    if (slots[idx] !== null) release(slots[idx]);
  }
  function onKey(e) {
    var t = e.target.closest('[data-slot]');
    if (!t || locked) return;
    var idx = +t.dataset.slot;
    if (/^[0-7]$/.test(e.key)) { e.preventDefault(); place(+e.key, idx); }
    else if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); if (slots[idx] !== null) { var d = slots[idx]; slots[idx] = null; selected = null; render(idx); api.changed(); } }
  }
  function onDragStart(e) {
    var t = e.target.closest('[data-d],[data-in]');
    if (!t || locked) return;
    dragging = +(t.dataset.d !== undefined ? t.dataset.d : t.dataset.in);
    e.dataTransfer.setData('text/plain', String(dragging));
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e) {
    var s = e.target.closest('[data-slot],[data-pool]');
    if (!s || dragging === null) return;
    e.preventDefault();
    if (s.dataset.slot !== undefined) s.classList.add('over');
  }
  function onDragLeave(e) {
    var s = e.target.closest('[data-slot]');
    if (s) s.classList.remove('over');
  }
  function onDrop(e) {
    var s = e.target.closest('[data-slot],[data-pool]');
    if (!s || dragging === null) return;
    e.preventDefault();
    var d = dragging;
    dragging = null;
    if (s.dataset.slot !== undefined) place(d, +s.dataset.slot); else release(d);
  }
  function onDragEnd() { dragging = null; if (!locked) render(); }

  Biber.register({
    id: 'ziffernschloss23',
    story:
      '<p>Bob hat ein Ziffernschloss an seiner Haustür. Um es zu öffnen, muss man einen Zifferncode eingeben. Alle Ziffern im Code müssen verschieden sein. Aktuell hat der Code fünf Stellen und lautet so:</p>' +
      '<p class="' + P + 'line" aria-label="Code 0 2 4 3 1">' + tiles([0, 2, 4, 3, 1]) + '</p>' +
      '<p>Bob hat sich den Code notiert, aber ein wenig verschleiert: ' + note('n', 'c') + ' bedeutet, dass links von Ziffer <b>c</b> im Code genau <b>n</b> Ziffern stehen, die größer sind als <b>c</b>. Zum Beispiel notiert Bob mit ' + note(1, 3) + ', dass links von Ziffer 3 genau eine Ziffer steht (nämlich die 4), die größer ist als 3.</p>' +
      '<p>Den aktuellen Zifferncode hat er sich insgesamt so notiert:</p>' +
      '<p class="' + P + 'line">' + [[0, 0], [3, 1], [0, 2], [1, 3], [0, 4]].map(function (x) { return note(x[0], x[1]); }).join(' ; ') + '</p>' +
      '<p>Ein Code aus nur fünf Ziffern ist Bob zu unsicher. Deshalb überlegt er sich einen neuen Code aus den Ziffern 0 bis 7. Den neuen Code notiert er sich so:</p>' +
      '<p class="' + P + 'line">' + NOTE.map(function (x) { return note(x[0], x[1]); }).join(' ; ') + '</p>',
    question: 'Wie lautet der neue Code?',
    howto: 'Ziehe die Ziffern an die richtigen Stellen. Du kannst auch erst eine Ziffer und dann ein Feld antippen. Ein belegtes Feld antippen nimmt die Ziffer wieder heraus. Mit der Tastatur: Feld wählen und die Ziffer eintippen.',
    explanation: function () {
      var free = [1, 2, 3, 4, 5, 6, 7, 8], steps = [];
      NOTE.forEach(function (nc) {
        var pos = free[nc[0]];
        steps.push('<li><b>' + nc[0] + ' &gt;&gt; ' + nc[1] + '</b>: Die Ziffer ' + nc[1] + ' steht an der ' + (nc[0] + 1) + '. freien Stelle, also an Stelle ' + pos + '.</li>');
        free.splice(nc[0], 1);
      });
      return '<p>Der neue Code lautet <b>' + SOLUTION.join(' ') + '</b>. Man bestimmt ihn Ziffer für Ziffer, von der kleinsten zur größten. Dann sind links von einer Ziffer alle schon gesetzten Ziffern kleiner und alle noch freien Stellen müssen später mit größeren Ziffern gefüllt werden. Die Ziffer c kommt deshalb an die (n+1)-te freie Stelle von links:</p>' +
        '<ol class="' + P + 'steps">' + steps.join('') + '</ol>' +
        '<p>Informatik: Bobs Notation zählt für jede Zahl ihre Inversionen (Fehlstände), also wie viele größere Zahlen vor ihr stehen. Dieses Muster heißt Inversionssequenz. Der Code ist eine Permutation der Zahlen 0 bis 7, und aus der Inversionssequenz lässt sich die Permutation mit einem einzigen Durchlauf berechnen. Solche kombinatorischen Aufgaben löst man in der Informatik mit Algorithmen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKey);
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('dragleave', onDragLeave);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', onDragEnd);
      render();
    },
    isComplete: function () { return slots.every(function (d) { return d !== null; }); },
    evaluate: function () { return { correct: isRight(slots), answer: slots.slice() }; },
    setAnswer: function (ans) {
      slots = DIGITS.map(function (_, i) { return ans && typeof ans[i] === 'number' ? ans[i] : null; });
      selected = null; mark = null;
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      if (on) selected = null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () { slots = SOLUTION.slice(); selected = null; locked = true; mark = 'solution'; render(); }
  });
})();
