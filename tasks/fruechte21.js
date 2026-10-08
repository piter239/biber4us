/* Aufgabe Früchte stapeln (Heft 2021, S. 28; Klasse 9-13): Reihenfolgen und Stapel (Stack) - jede mögliche Reihenfolge muss passen */
(function () {
  'use strict';
  var h = Biber.h;

  var FRUITS = [
    { id: 'apfel', name: 'Apfel' },
    { id: 'birne', name: 'Birne' },
    { id: 'orange', name: 'Orange' },
    { id: 'erdbeere', name: 'Erdbeere' }
  ];
  var FR = {};
  FRUITS.forEach(function (f) { FR[f.id] = f; });
  /* Tabelle aus dem Heft: welche Früchte mag wer */
  var PEOPLE = [
    { id: 'vater', name: 'Vater', likes: { apfel: 0, birne: 0, orange: 1, erdbeere: 0 } },
    { id: 'mutter', name: 'Mutter', likes: { apfel: 1, birne: 0, orange: 1, erdbeere: 1 } },
    { id: 'dorie', name: 'Dorie', likes: { apfel: 1, birne: 1, orange: 1, erdbeere: 0 } },
    { id: 'ron', name: 'Ron', likes: { apfel: 1, birne: 1, orange: 0, erdbeere: 1 } }
  ];
  var PERSON = {};
  PEOPLE.forEach(function (p) { PERSON[p.id] = p; });

  function perms(list) {
    if (list.length <= 1) return [list.slice()];
    var out = [];
    list.forEach(function (x, i) {
      perms(list.slice(0, i).concat(list.slice(i + 1))).forEach(function (r) { out.push([x].concat(r)); });
    });
    return out;
  }
  /* alle möglichen Abgangsreihenfolgen: Mutter vor Dorie, Vater als Letzter (drei Stück, wie im Heft) */
  var ORDERS = perms(['vater', 'mutter', 'dorie', 'ron']).filter(function (o) {
    return o[3] === 'vater' && o.indexOf('mutter') < o.indexOf('dorie');
  });
  /* stack[0] = oberste Box. Die erste Person nimmt die oberste Box usw. */
  function works(stack) {
    return ORDERS.every(function (o) {
      return o.every(function (pid, k) { return PERSON[pid].likes[stack[k]] === 1; });
    });
  }
  var SOLUTIONS = perms(FRUITS.map(function (f) { return f.id; })).filter(works);
  var SOL = SOLUTIONS[0];   /* eindeutig: Erdbeere, Apfel, Birne, Orange (von oben nach unten) */

  function img(id, cls, size) {
    return h('img', { class: cls, src: 'assets/fruechte21/' + id + '.png', alt: '', width: size, height: size, draggable: 'false' });
  }

  var el, api;
  var stack, selected, dragging, locked, mark;   /* mark: null | 'check' | 'solution' */

  function reset() { stack = [null, null, null, null]; selected = null; dragging = null; mark = null; }

  function place(id, idx) {
    if (locked) return;
    var from = stack.indexOf(id);
    var existing = stack[idx];
    stack[idx] = id;
    if (from >= 0) stack[from] = existing === id ? null : existing;
    selected = null;
    render();
    api.changed();
  }
  function release(id) {
    if (locked) return;
    var from = stack.indexOf(id);
    if (from >= 0) stack[from] = null;
    selected = null;
    render();
    api.changed();
  }

  function posName(i) { return i === 0 ? 'oberste Box' : i === 3 ? 'unterste Box' : (i + 1) + '. Box von oben'; }

  function table() {
    var head = h('tr', null, h('td', { class: 't-fruechte21-corner' }, h('span', { class: 't-fruechte21-sr' }, 'Wer mag welche Frucht?')),
      FRUITS.map(function (f) { return h('th', { scope: 'col' }, img(f.id, 't-fruechte21-ico', 40), h('span', { class: 't-fruechte21-sr' }, f.name)); }));
    var rows = PEOPLE.map(function (p) {
      return h('tr', null, h('th', { scope: 'row' }, p.name),
        FRUITS.map(function (f) {
          var ok = p.likes[f.id] === 1;
          return h('td', { class: ok ? 'yes' : 'no', 'aria-label': p.name + (ok ? ' mag ' : ' mag nicht ') + f.name }, h('span', { 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
        }));
    });
    return h('table', { class: 't-fruechte21-table' }, h('thead', null, head), h('tbody', null, rows));
  }

  function render() {
    var slots = stack.map(function (id, i) {
      var cls = 't-fruechte21-box' + (id ? ' filled' : '');
      var mk = null;
      if (mark === 'check') {
        var ok = id === SOL[i];
        cls += ok ? ' right' : ' wrong';
        mk = h('span', { class: 't-fruechte21-mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      } else if (mark === 'solution') cls += ' right';
      return h('button', {
        type: 'button', class: cls, 'data-slot': String(i), draggable: id && !locked ? 'true' : false, 'data-in-slot': id || false, disabled: locked,
        'aria-label': posName(i) + ': ' + (id ? FR[id].name : 'leer')
      }, h('span', { class: 't-fruechte21-lid', 'aria-hidden': 'true' }), id ? img(id, 't-fruechte21-fruit', 64) : h('span', { class: 't-fruechte21-ph' }, 'Frucht hierher'), mk);
    });
    var shelf = FRUITS.map(function (f) {
      if (stack.indexOf(f.id) >= 0) return h('div', { class: 't-fruechte21-cell', 'aria-hidden': 'true' });
      return h('button', {
        type: 'button', class: 't-fruechte21-pick' + (selected === f.id ? ' selected' : ''), 'data-fruit': f.id, 'aria-pressed': String(selected === f.id),
        draggable: locked ? false : 'true', 'aria-label': f.name, disabled: locked
      }, img(f.id, 't-fruechte21-fruit', 64));
    });
    el.replaceChildren(h('div', { class: 't-fruechte21-board' },
      h('section', { class: 't-fruechte21-tablewrap', 'aria-label': 'Tabelle: Wer mag welche Frucht' }, table()),
      h('div', { class: 't-fruechte21-play' },
        h('section', { 'aria-label': 'Früchte' }, h('h3', null, 'Früchte'), h('div', { class: 't-fruechte21-shelf', 'data-pool': '' }, shelf)),
        h('section', { 'aria-label': 'Boxenstapel' }, h('h3', null, 'Boxenstapel'),
          h('div', { class: 't-fruechte21-stack' },
            h('span', { class: 't-fruechte21-side top' }, 'oben (wird zuerst genommen)'),
            slots,
            h('span', { class: 't-fruechte21-side bottom' }, 'unten'))))));
  }

  function onClick(e) {
    if (locked) return;
    var t = e.target.closest('[data-fruit],[data-slot]');
    if (!t) return;
    if (t.dataset.fruit) { selected = selected === t.dataset.fruit ? null : t.dataset.fruit; render(); return; }
    var idx = +t.dataset.slot;
    if (selected) return place(selected, idx);
    if (stack[idx]) release(stack[idx]);
  }
  function onDragStart(e) {
    var t = e.target.closest('[data-fruit],[data-in-slot]');
    if (!t || locked) return;
    dragging = t.dataset.fruit || t.dataset.inSlot;
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
    if (s.dataset.slot) place(id, +s.dataset.slot); else release(id);
  }
  function onDragEnd() { dragging = null; if (!locked) render(); }

  Biber.register({
    id: 'fruechte21',
    story: '<p>Vater, Mutter, Dorie und Ron Biber packen abends ihre vier Frühstücksboxen. In jede Box kommt eine andere Frucht, und dann werden die Boxen gestapelt. ' +
      'Morgens sind die Bibers noch sehr müde: Wer den Bau verlässt, nimmt einfach die <b>oberste</b> Box vom Stapel, ohne hinzusehen.</p>' +
      '<p>Die Biber wissen nicht genau, in welcher Reihenfolge sie morgens den Bau verlassen. Aber <b>Mutter geht immer vor Dorie</b>, und <b>Vater geht immer als Letzter</b>. ' +
      'Die Biber wünschen sich: Die Früchte sollen so in den Boxenstapel, dass in jedem Fall jeder eine Frucht bekommt, die er mag. Die Tabelle zeigt, welche Früchte jeder Biber mag.</p>',
    question: 'Ziehe die Früchte wie gewünscht in den Boxenstapel.',
    howto: 'Ziehe jede Frucht in eine Box. Du kannst auch erst die Frucht und dann die Box antippen. Tippe eine Frucht in einer Box an, um sie wieder herauszunehmen.',
    explanation: '<p>Es gibt genau eine Lösung. Vater mag nur Orangen und geht als Letzter, also kommt die <b>Orange</b> in die unterste Box. ' +
      'Als Zweiter kann Mutter, Dorie oder Ron gehen (Mutter geht vor Dorie, Vater zuletzt). In die zweite Box muss deshalb eine Frucht, die alle drei mögen: der <b>Apfel</b>. ' +
      'Für die oberste Box bleiben Birne und Erdbeere. Mutter mag keine Birne und könnte als Erste gehen, also kommt die <b>Erdbeere</b> nach oben. Zuletzt bleibt die <b>Birne</b> für die dritte Box, und die mögen Dorie und Ron.</p>' +
      '<p>Der Stapel ist ein „Last in, first out“-Speicher: Was zuletzt hineinkommt, wird zuerst genommen. Wer die Reihenfolge nicht kennt, muss alle möglichen Reihenfolgen gleichzeitig beachten.</p>',
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
    isComplete: function () { return stack.every(Boolean); },
    evaluate: function () {
      return { correct: works(stack), answer: stack.slice() };
    },
    setAnswer: function (ans) {
      stack = ans.slice();
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? 'check' : null;
      selected = null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      stack = SOL.slice();
      locked = true;
      mark = 'solution';
      render();
    }
  });
})();
