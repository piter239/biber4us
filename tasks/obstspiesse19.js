/* Aufgabe Obstspieße (Heft 2019, S. 32; 5-6 schwer, 7-8 schwer, 9-10 einfach): Algorithmik, Heiratsproblem, Matching */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-obstspiesse19-';
  var A = 'assets/obstspiesse19/';

  /* Bilder sind aus dem Heft (oben nach unten) */
  var FRUITS = [
    { k: 'apfel', n: 'Apfel', num: 1 },
    { k: 'banane', n: 'Banane', num: 2 },
    { k: 'zwetschge', n: 'Zwetschge', num: 3 },
    { k: 'weintraube', n: 'Weintraube', num: 4 },
    { k: 'erdbeere', n: 'Erdbeere', num: 5 },
    { k: 'brombeere', n: 'Brombeere', num: 6 }
  ];
  var SKEWERS = [
    { img: 't1.png', nums: [3, 6], alt: 'Spieß mit Brombeere und Zwetschge' },
    { img: 't2.png', nums: [1, 2, 5], alt: 'Spieß mit Apfel, Erdbeere und Banane' },
    { img: 't3.png', nums: [2, 5, 6], alt: 'Spieß mit Banane, Erdbeere und Brombeere' },
    { img: 't4.png', nums: [2, 3, 4], alt: 'Spieß mit Weintraube, Banane und Zwetschge' }
  ];
  var OPTIONS = [
    { k: 'A', img: 'oa.png', alt: 'Spieß A: Brombeere, Erdbeere, Apfel' },
    { k: 'B', img: 'ob.png', alt: 'Spieß B: Apfel, Erdbeere, Banane' },
    { k: 'C', img: 'oc.png', alt: 'Spieß C: Brombeere, Zwetschge, Apfel' },
    { k: 'D', img: 'od.png', alt: 'Spieß D: Weintraube, Erdbeere, Brombeere' }
  ];
  var RIGHT = 'A';

  function fruitImg(f, size, cls) {
    return h('img', { class: cls || '', src: A + 'f-' + f.k + '.png', alt: '', width: size, height: size, draggable: 'false' });
  }

  var el, api, locked, picked, mode, notes;
  var tableEl, notesEl, optsEl;

  function renderTable() {
    tableEl.replaceChildren.apply(tableEl, SKEWERS.map(function (s, i) {
      return h('div', { class: P + 'sk', role: 'listitem' },
        h('img', { src: A + s.img, alt: s.alt, width: 103, height: 330, draggable: 'false' }),
        h('span', { class: P + 'nums', 'aria-label': 'Obstsorten ' + s.nums.join(', ') }, s.nums.join(', ')));
    }));
  }
  function renderNotes() {
    notesEl.replaceChildren.apply(notesEl, FRUITS.map(function (f) {
      var sel = h('select', { class: P + 'sel', 'data-k': f.k, 'aria-label': 'Nummer für ' + f.n + ' notieren' },
        h('option', { value: '0' }, '?'),
        [1, 2, 3, 4, 5, 6].map(function (v) { return h('option', { value: String(v) }, String(v)); }));
      sel.value = String(notes[f.k] || 0);
      sel.disabled = locked;
      return h('div', { class: P + 'fr' }, h('span', { class: P + 'pic' }, fruitImg(f, 64)), sel);
    }));
  }
  function renderOpts() {
    optsEl.replaceChildren.apply(optsEl, OPTIONS.map(function (o) {
      var sl = picked === o.k;
      var cls = P + 'opt';
      var mark = '';
      if (mode && (mode === 'solution' ? o.k === RIGHT : sl)) {
        var ok = o.k === RIGHT;
        cls += ok ? ' right' : ' wrong';
        mark = ok ? '✓' : '✗';
      }
      var input = h('input', { type: 'radio', name: P + 'opt', value: o.k, disabled: locked, 'aria-label': o.alt });
      input.checked = sl;
      return h('label', { class: cls }, input,
        h('span', { class: P + 'card' },
          h('img', { src: A + o.img, alt: '', width: 125, height: 360, draggable: 'false' }),
          h('span', { class: P + 'let' }, o.k + ')'),
          mark ? h('span', { class: P + 'mark', 'aria-hidden': 'true' }, mark) : null));
    }));
  }
  function renderAll() { renderTable(); renderNotes(); renderOpts(); }

  function fruitTableHtml() {
    return '<ul class="' + P + 'key" aria-label="Nummer und Obstsorte">' + FRUITS.map(function (f) {
      return '<li><span class="' + P + 'pic s"><img src="' + A + 'f-' + f.k + '.png" alt="" width="40" height="40"></span><b>' + f.num + '</b> ' + f.n + '</li>';
    }).join('') + '</ul>';
  }

  Biber.register({
    id: 'obstspiesse19',
    story: '<p>Bei Leos Party gibt es Obstspieße. Dafür stehen sechs Obstsorten zur Auswahl. Die Sorten haben die Nummern 1 bis 6. ' +
      'Die Tabelle zeigt, welche Obstsorten für die ersten vier Spieße gewählt wurden.</p>',
    question: 'Leo wählt für seinen Spieß die Obstsorten 1, 5 und 6. Welcher ist Leos Spieß?',
    howto: 'Wähle einen der vier Spieße unten aus. Wenn Du magst, kannst Du Dir mit den Auswahlfeldern bei den Früchten Nummern notieren. Das ist nur eine Gedankenstütze und zählt nicht zur Antwort.',
    explanation: function () {
      return '<p>Vergleicht man zwei Spieße, haben sie immer genau <b>eine</b> Sorte gemeinsam, und die verrät die Nummer. ' +
        'Die Spieße mit „3, 6“ und „2, 5, 6“ haben nur die Brombeere gemeinsam, also ist die Brombeere die 6. ' +
        'Auf dieselbe Weise ergibt sich: Zwetschge = 3, Banane = 2, Erdbeere = 5. ' +
        'Übrig bleiben Apfel und Weintraube für die Nummern 1 und 4. Der Spieß mit „1, 2, 5“ enthält Banane und Erdbeere und noch eine Frucht, den Apfel, also ist der Apfel die 1.</p>' +
        fruitTableHtml() +
        '<p>Leos Spieß mit den Sorten 1, 5 und 6 hat also Apfel, Erdbeere und Brombeere. Das ist <b>Spieß A</b>.</p>' +
        '<p><b>Informatik:</b> Jede Nummer soll genau einer Obstsorte zugeordnet werden und umgekehrt. Aus den Spießen weiß man zunächst nur, welche Nummern für eine Sorte in Frage kommen. ' +
        'Das ähnelt dem „Heiratsproblem“: Jede Person hat Wunschpartner, und gesucht wird eine eindeutige Zuordnung. In der Informatik nennt man das ein <i>Matching</i>, hier sogar ein <i>perfektes Matching</i>, weil jede Sorte eine Nummer bekommt und jede Nummer eine Sorte.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null; notes = {};
      tableEl = h('div', { class: P + 'table', role: 'list', 'aria-label': 'Die ersten vier Spieße mit ihren Obstsorten' });
      notesEl = h('div', { class: P + 'notes', role: 'group', 'aria-label': 'Notizzettel: Nummer für jede Frucht (nur zum Ausprobieren)' });
      optsEl = h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Spieße zur Auswahl' });
      el.replaceChildren(h('div', { class: P + 'box' },
        h('div', { class: P + 'explore' },
          h('h3', { class: P + 'h' }, 'Die ersten vier Spieße und ihre Obstsorten'), tableEl,
          h('h3', { class: P + 'h' }, 'Notizzettel: Welche Nummer gehört zu welcher Frucht?'), notesEl),
        h('h3', { class: P + 'h' }, 'Welcher ist Leos Spieß?'), optsEl));
      notesEl.addEventListener('change', function (e) {
        var s = e.target.closest('select'); if (!s) return;
        notes[s.getAttribute('data-k')] = +s.value;
      });
      optsEl.addEventListener('change', function (e) {
        if (locked || !e.target.matches('input[type=radio]')) return;
        picked = e.target.value;
        renderOpts();
        var f = optsEl.querySelector('input:checked'); if (f) f.focus();
        api.changed('Spieß ' + picked + ' gewählt.');
      });
      renderAll();
    },
    isComplete: function () { return picked !== null; },
    evaluate: function () { return { correct: picked === RIGHT, answer: { c: picked, notes: JSON.parse(JSON.stringify(notes)) } }; },
    setAnswer: function (ans) {
      picked = ans && typeof ans.c === 'string' ? ans.c : null;
      notes = ans && ans.notes && typeof ans.notes === 'object' ? ans.notes : {};
      mode = 'check'; renderAll();
    },
    lock: function (on) {
      locked = on;
      mode = on ? (mode || 'check') : null;
      renderNotes(); renderOpts();
    },
    reset: function () { picked = null; mode = null; notes = {}; renderAll(); },
    showSolution: function () {
      picked = RIGHT; mode = 'solution'; locked = true;
      notes = {}; FRUITS.forEach(function (f) { notes[f.k] = f.num; });
      renderAll();
    }
  });
})();
