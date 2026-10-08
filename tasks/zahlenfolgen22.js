/* Aufgabe Zahlenfolgen (Heft 2022, Klasse 7-8 schwer / 9-10 mittel / 11-13 leicht): indirekte Adressierung bei Arrays.
   X = 5 3 2 4 1; A = 3 2 4 1 5; B = 5 4 1 3 2; C = 2 5 4 3 1; (A (B (C 3))) = (A (B 4)) = (A 3) = 4. */
(function () {
  'use strict';
  var h = Biber.h;

  var SEQ = {
    X: [5, 3, 2, 4, 1],
    A: [3, 2, 4, 1, 5],
    B: [5, 4, 1, 3, 2],
    C: [2, 5, 4, 3, 1]
  };
  var NAMES = ['A', 'B', 'C'];
  /* (A (B (C 3))): von innen nach außen */
  var CHAIN = ['A', 'B', 'C'];
  var START_POS = 3;
  function steps() {
    var v = START_POS, out = [];
    for (var i = CHAIN.length - 1; i >= 0; i--) { var nv = SEQ[CHAIN[i]][v - 1]; out.push({ seq: CHAIN[i], pos: v, val: nv }); v = nv; }
    return out;
  }
  var RIGHT = steps()[CHAIN.length - 1].val;   /* 4, laut Heft */

  var el, api, locked, mode, chosen, marked;

  function reset() { chosen = null; marked = {}; mode = null; }

  function staticRow(name, withPos) {
    return '<div class="t-zahlenfolgen22-row"><span class="t-zahlenfolgen22-name">' + name + '</span>' +
      '<div class="t-zahlenfolgen22-cells">' +
      SEQ[name].map(function (v, i) {
        return '<span class="t-zahlenfolgen22-cwrap">' + (withPos ? '<span class="t-zahlenfolgen22-pos">' + (i + 1) + '</span>' : '') + '<span class="t-zahlenfolgen22-c">' + v + '</span></span>';
      }).join('') + '</div></div>';
  }

  function toggle(key) {
    if (locked) return;
    if (marked[key]) delete marked[key]; else marked[key] = true;
    render('mark' + key);
    api.changed();
  }
  function choose(v) {
    if (locked) return;
    chosen = chosen === v ? null : v;
    render('ans' + v);
    api.changed(chosen ? 'Du hast ' + chosen + ' gewählt.' : '');
  }

  function render(focus) {
    var hadFocus = el.contains(document.activeElement);
    var head = h('tr', null, h('th', { scope: 'col', class: 't-zahlenfolgen22-corner' }, h('span', { class: 't-zahlenfolgen22-sr' }, 'Folge')),
      [1, 2, 3, 4, 5].map(function (p) { return h('th', { scope: 'col', class: 't-zahlenfolgen22-poshead' }, h('span', { 'aria-hidden': 'true' }, String(p)), h('span', { class: 't-zahlenfolgen22-sr' }, 'Position ' + p)); }));
    var rows = NAMES.map(function (n) {
      return h('tr', null, h('th', { scope: 'row', class: 't-zahlenfolgen22-name' }, n),
        SEQ[n].map(function (v, i) {
          var key = n + (i + 1);
          var on = !!marked[key];
          return h('td', null, h('button', {
            type: 'button', class: 't-zahlenfolgen22-c t-zahlenfolgen22-btn' + (on ? ' on' : ''), 'data-mark': key, disabled: locked, 'aria-pressed': String(on),
            'aria-label': 'Folge ' + n + ', Position ' + (i + 1) + ': ' + v + (on ? ', markiert' : ', zum Merken markieren')
          }, String(v)));
        }));
    });

    var answers = [1, 2, 3, 4, 5].map(function (v) {
      var cls = 't-zahlenfolgen22-ans' + (chosen === v ? ' sel' : '');
      var mark = null;
      if (mode === 'check' && chosen === v) { cls += v === RIGHT ? ' right' : ' wrong'; mark = v === RIGHT ? ' ✓' : ' ✗'; }
      if (mode === 'solution' && v === RIGHT) { cls += ' sel right'; mark = ' ✓'; }
      return h('button', {
        type: 'button', role: 'radio', class: cls, 'data-ans': String(v), disabled: locked, 'aria-checked': String(chosen === v || (mode === 'solution' && v === RIGHT)),
        'aria-label': 'Antwort ' + v
      }, String(v), mark ? h('span', { 'aria-hidden': 'true', class: 't-zahlenfolgen22-m' }, mark) : null);
    });

    el.replaceChildren(h('div', { class: 't-zahlenfolgen22' },
      h('table', { class: 't-zahlenfolgen22-table' }, h('caption', { class: 't-zahlenfolgen22-sr' }, 'Die Folgen A, B und C mit Positionen 1 bis 5'), h('thead', null, head), h('tbody', null, rows)),
      h('p', { class: 't-zahlenfolgen22-hint' }, 'Zahlen antippen = zum Merken markieren (zählt nicht zur Antwort).'),
      h('p', { class: 't-zahlenfolgen22-expr' }, h('span', { class: 't-zahlenfolgen22-sr' }, 'Gesucht ist: '), '(A (B (C 3))) = ?'),
      h('div', { class: 't-zahlenfolgen22-answers', role: 'radiogroup', 'aria-label': 'Antwort' }, answers)));

    if (hadFocus && !locked && focus) {
      var t = null;
      if (focus.indexOf('mark') === 0) t = el.querySelector('[data-mark="' + focus.slice(4) + '"]');
      else if (focus.indexOf('ans') === 0) t = el.querySelector('[data-ans="' + focus.slice(3) + '"]');
      if (t) t.focus();
    }
  }

  function onClick(e) {
    if (locked) return;
    var m = e.target.closest('[data-mark]');
    if (m) return toggle(m.getAttribute('data-mark'));
    var a = e.target.closest('[data-ans]');
    if (a) choose(+a.getAttribute('data-ans'));
  }
  function onKey(e) {
    var a = e.target.closest && e.target.closest('[data-ans]');
    if (!a || locked) return;
    var k = e.key, v = +a.getAttribute('data-ans'), nv = null;
    if (k === 'ArrowRight' || k === 'ArrowDown') nv = v % 5 + 1;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') nv = (v + 3) % 5 + 1;
    else if (/^[1-5]$/.test(k)) nv = +k;
    if (nv == null) return;
    e.preventDefault();
    chosen = nv;
    render('ans' + nv);
    api.changed('Du hast ' + chosen + ' gewählt.');
  }

  var fmtSteps = function () {
    var s = steps();
    /* (A (B (C 3))) = (A (B 4)) = (A 3) = 4 */
    var parts = ['(A (B (C 3)))'];
    parts.push('(A (B ' + s[0].val + '))');
    parts.push('(A ' + s[1].val + ')');
    parts.push(String(s[2].val));
    return parts.join(' = ');
  };

  Biber.register({
    id: 'zahlenfolgen22',
    story: '<p>Hier siehst du eine Folge von Zahlen mit dem Namen X. An den Positionen 1 bis 5 stehen die Zahlen 5, 3, 2, 4, 1.</p>' +
      '<div class="t-zahlenfolgen22-demo" role="group" aria-label="Folge X: 5, 3, 2, 4, 1">' + staticRow('X', true) + '</div>' +
      '<p>Die Zahl an einer bestimmten Position beschreiben wir, indem wir Namen und Position einklammern. Ein Beispiel: Die Zahl an Position 2 von Folge X schreiben wir so: <b>(X 2)</b>. Aktuell ist (X 2) = 3.</p>' +
      '<p>Eine so beschriebene Zahl kann selbst auch eine Position sein. Zum Beispiel ist <b>(X (X 2)) = (X 3) = 2</b>.</p>' +
      '<p>Hier sind drei andere Folgen: A, B und C.</p>',
    question: 'Welche Zahl beschreiben wir so: (A (B (C 3)))?',
    howto: 'Wähle unten die Zahl, die dabei herauskommt. Wenn du magst, kannst du Zahlen in den Folgen antippen, um sie dir zu merken.',
    explanation: function () {
      var s = steps();
      return '<p>Die Beschreibung wird <b>von innen nach außen</b> ausgewertet, wie ein Rechenausdruck:</p>' +
        '<p class="t-zahlenfolgen22-eq">' + fmtSteps() + '</p>' +
        '<ul><li>(C 3): In Folge C steht an Position 3 die Zahl ' + s[0].val + '.</li>' +
        '<li>(B ' + s[0].val + '): In Folge B steht an Position ' + s[0].val + ' die Zahl ' + s[1].val + '.</li>' +
        '<li>(A ' + s[1].val + '): In Folge A steht an Position ' + s[1].val + ' die Zahl ' + s[2].val + '.</li></ul>' +
        '<p>Die richtige Antwort ist also <b>' + RIGHT + '</b>.</p>' +
        '<p><b>Informatik:</b> Eine Folge fester Länge heißt in der Informatik <i>Array</i> (Feld). Die Position einer Zahl wird dort wie eine Adresse benutzt. ' +
        'Steht an einer Position wieder eine Zahl, die als Position dient, nennt man das <i>indirekte Adressierung</i>: Der Wert gibt an, wo man als Nächstes nachschauen muss.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKey);
      render();
    },
    isComplete: function () { return chosen != null; },
    evaluate: function () { return { correct: chosen === RIGHT, answer: chosen }; },
    setAnswer: function (ans) {
      chosen = typeof ans === 'number' ? ans : null;
      mode = chosen === RIGHT ? 'solution' : 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mode = on ? (mode || 'check') : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      chosen = RIGHT;
      mode = 'solution';
      locked = true;
      render();
    }
  });
})();
