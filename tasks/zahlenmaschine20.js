/* Aufgabe Zahlenmaschine (Biber 2020; Klasse 9-10 schwer, 11-13 mittel): Rekursion - Eingabe 4 durchrechnen, Ergebnis 16 */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-zahlenmaschine20-';

  var TASK_N = 4;            /* Eingabe der Aufgabe */
  var ANSWER = '16';         /* Lösung laut Heft; per Simulation unten geprüft (run(4) = 16) */
  var TRY = [1, 2, 3, 5, 6, 7];   /* Eingaben zum Ausprobieren (die Aufgabe 4 rechnest du selbst) */

  /* Die Einheiten laut Aufgabe: Eingabe (a, b, c). Ist a = 1, geht c als Ausgabe an die Zahlenmaschine.
     Sonst werden a - 1, B = b + 2 und B + c an die nächste Einheit weitergegeben. */
  function run(n) {
    var units = [], a = n, b = 1, c = 1;
    for (;;) {
      if (a === 1) { units.push({ a: a, b: b, c: c, out: c }); return { units: units, result: c }; }
      var B = b + 2;
      units.push({ a: a, b: b, c: c, next: { a: a - 1, b: B, c: B + c }, B: B });
      a = a - 1; b = B; c = B + c;
    }
  }
  /* Abgleich: Beispiel im Heft (Eingabe 2 -> 4) und Lösung (Eingabe 4 -> 16) */
  var CHECK = run(2).result === 4 && run(TASK_N).result === Number(ANSWER);

  var el, api, locked, mode, input, tryN, shown, chips, stepBtn, allBtn, units, outEl, hintEl;

  function status(txt) { return txt; }

  function unitCard(u, k) {
    var body;
    if (u.out != null) {
      body = h('p', { class: P + 'rule' }, 'a ist 1, also gibt die Einheit ', h('strong', null, 'c = ' + u.out), ' an die Zahlenmaschine aus.');
    } else {
      body = h('p', { class: P + 'rule' }, 'a ist nicht 1. Weitergabe: a - 1 = ' + u.next.a + ', B = ' + u.b + ' + 2 = ' + u.B + ', B + c = ' + u.B + ' + ' + u.c + ' = ',
        h('strong', null, String(u.next.c)), '.');
    }
    return h('li', { class: P + 'unit' + (u.out != null ? ' last' : '') },
      h('div', { class: P + 'uh' }, 'Einheit ' + (k + 1)),
      h('div', { class: P + 'in' }, 'Eingabe (a, b, c) = ', h('code', null, '(' + u.a + ', ' + u.b + ', ' + u.c + ')')),
      body);
  }

  function renderTry() {
    var r = run(tryN);
    var n = Math.min(shown, r.units.length);
    chips.forEach(function (c) {
      var v = +c.getAttribute('data-n');
      c.setAttribute('aria-pressed', String(v === tryN));
      c.className = P + 'chip' + (v === tryN ? ' on' : '');
    });
    units.replaceChildren.apply(units, r.units.slice(0, n).map(unitCard));
    var done = n >= r.units.length;
    outEl.textContent = done ? 'Die Zahlenmaschine gibt ' + r.result + ' aus.' : '';
    outEl.className = P + 'out' + (done ? ' on' : '');
    stepBtn.disabled = done;
    allBtn.disabled = done;
    hintEl.textContent = 'Eingabe ' + tryN + ': ' + r.units.length + (r.units.length === 1 ? ' Einheit' : ' Einheiten') + ' werden gebraucht.' + (done ? '' : ' (' + n + ' gezeigt)');
  }
  function setN(v) { tryN = v; shown = 1; renderTry(); }

  function renderChips() {
    var list = TRY.slice();
    if (locked) { list.push(TASK_N); list.sort(function (a, b) { return a - b; }); }
    chips = list.map(function (v) {
      return h('button', { type: 'button', class: P + 'chip', 'data-n': String(v), 'aria-pressed': 'false', 'aria-label': 'Eingabe ' + v + ' ausprobieren', onclick: function () { setN(v); } }, String(v));
    });
    el.querySelector('.' + P + 'chips').replaceChildren.apply(el.querySelector('.' + P + 'chips'), chips);
  }

  function renderInput() {
    input.disabled = !!locked;
    input.className = P + 'answer' + (mode === 'right' ? ' right' : mode === 'wrong' ? ' wrong' : '');
  }

  function clean(v) { return String(v == null ? '' : v).replace(/\s+/g, ''); }

  Biber.register({
    id: 'zahlenmaschine20',
    story:
      '<p>Die mysteriöse Zahlenmaschine erhält eine Zahl als Eingabe und gibt eine andere Zahl aus.</p>' +
      '<p>Im Inneren der Maschine arbeiten Einheiten. Jede Einheit erhält drei Zahlen <strong>a</strong>, <strong>b</strong>, <strong>c</strong> als Eingabe und arbeitet nach diesen Anweisungen:</p>' +
      '<ul class="' + P + 'rules"><li>Wenn a eine 1 ist, gib c an die Zahlenmaschine als Ausgabe weiter.</li>' +
      '<li>Sonst mache Folgendes:<ul><li>Gib a - 1 als Eingabe a an die nächste Einheit weiter.</li>' +
      '<li>Gib B = b + 2 als Eingabe b an die nächste Einheit weiter.</li>' +
      '<li>Gib B + c als Eingabe c an die nächste Einheit weiter.</li></ul></li></ul>' +
      '<p>Die Zahlenmaschine gibt ihre Eingabezahl als Eingabe a an die erste Einheit weiter. Die Eingaben b und c der ersten Einheit sind jeweils 1. Sobald die Zahlenmaschine von einer Einheit eine Ausgabe erhält, gibt sie diese Zahl als Ergebnis aus.</p>' +
      '<p>Beispiel: Bei der Eingabezahl 2 verwendet die Zahlenmaschine zwei Einheiten. Die erste Einheit erhält (2, 1, 1) und gibt (1, 3, 4) weiter, die zweite gibt 4 aus. Als Ergebnis gibt sie die Zahl 4 aus.</p>',
    question: 'Die Zahlenmaschine verarbeitet die Eingabezahl 4. Welche Zahl gibt sie als Ergebnis aus?',
    howto: 'Tippe das Ergebnis als Zahl ein. Unten kannst du die Maschine mit anderen Eingaben Einheit für Einheit durchlaufen lassen (die Eingabe 4 rechnest du selbst aus).',
    explanation: function () {
      var r = run(TASK_N), rows = r.units.map(function (u, k) {
        return '<li>Einheit ' + (k + 1) + ' erhält <code>(' + u.a + ', ' + u.b + ', ' + u.c + ')</code> und ' +
          (u.out != null ? 'gibt die Zahl ' + u.out + ' an die Zahlenmaschine aus.' : 'gibt <code>(' + u.next.a + ', ' + u.next.b + ', ' + u.next.c + ')</code> weiter.') + '</li>';
      }).join('');
      return '<p><strong>16</strong> ist die richtige Antwort. Man rechnet Einheit für Einheit:</p><ol class="' + P + 'why">' + rows + '</ol>' +
        '<p>Jede Einheit arbeitet nach denselben Regeln und ruft die nächste Einheit auf, bis a gleich 1 ist (Abbruchbedingung). Einen solchen Ablauf, bei dem sich eine Berechnung immer wieder selbst mit neuen Werten aufruft, nennt man rekursiv. ' +
        'Ohne Abbruchbedingung würde die Maschine nie anhalten. Bei einer Einheit, die immer nur eine weitere aufruft, könnte man auch eine einfache Wiederholung (Iteration) verwenden; die benötigt immer gleich viel Speicherplatz.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; mode = null; tryN = 2; shown = 99;
      input = h('input', {
        type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: '6', id: P + 'answer', class: P + 'answer',
        'aria-label': 'Ergebnis der Zahlenmaschine bei Eingabe 4',
        oninput: function () {
          var v = input.value.replace(/[^0-9]/g, '');
          if (v !== input.value) input.value = v;
          api.changed();
        }
      });
      chips = [];
      units = h('ol', { class: P + 'units', 'aria-live': 'polite' });
      outEl = h('p', { class: P + 'out', role: 'status' });
      hintEl = h('p', { class: P + 'hint' });
      stepBtn = h('button', { type: 'button', class: P + 'btn', onclick: function () { shown = Math.min(shown, run(tryN).units.length) + 1; renderTry(); } }, 'Nächste Einheit');
      allBtn = h('button', { type: 'button', class: P + 'btn', onclick: function () { shown = 99; renderTry(); } }, 'Alle zeigen');
      var restart = h('button', { type: 'button', class: P + 'btn', onclick: function () { shown = 1; renderTry(); } }, 'Von vorn');
      el.replaceChildren(h('div', { class: P + 'board' },
        h('div', { class: P + 'ans' },
          h('label', { for: P + 'answer' }, 'Ergebnis bei Eingabe 4:'), input),
        h('section', { class: P + 'try', 'aria-label': 'Maschine ausprobieren' },
          h('h3', null, 'Maschine ausprobieren'),
          h('div', { class: P + 'pick' }, h('span', { id: P + 'lbl' }, 'Eingabezahl:'), h('div', { class: P + 'chips', role: 'group', 'aria-labelledby': P + 'lbl' })),
          hintEl, units, outEl,
          h('div', { class: P + 'ctrl' }, stepBtn, allBtn, restart))));
      renderChips();
      renderInput();
      renderTry();
    },
    isComplete: function () { return clean(input.value) !== ''; },
    evaluate: function () {
      var v = clean(input.value).replace(/^0+(?=\d)/, '');
      return { correct: v === ANSWER, answer: v };
    },
    setAnswer: function (ans) {
      input.value = clean(ans);
      mode = clean(ans) === ANSWER ? 'right' : 'wrong';
      renderInput();
    },
    lock: function (on) {
      locked = on;
      if (on) mode = clean(input.value) === ANSWER ? 'right' : 'wrong'; else mode = null;
      renderChips();
      renderInput();
      renderTry();
    },
    reset: function () { input.value = ''; mode = null; locked = false; tryN = 2; shown = 99; renderChips(); renderInput(); renderTry(); },
    showSolution: function () {
      input.value = ANSWER; mode = 'right'; locked = true;
      tryN = TASK_N; shown = 99;
      renderChips(); renderInput(); renderTry();
    }
  });
  if (!CHECK && window.console) console.error('zahlenmaschine20: Rechenabgleich fehlgeschlagen');
})();
