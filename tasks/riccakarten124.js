/* Aufgabe Ricca-Karten 1 (Biber 2024, S. 49; Klasse 3-4 einfach): Eigenschaften mit erlaubten Werten (Datentypen) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-riccakarten124-';
  var DIR = 'assets/riccakarten124/';

  var ICON = {
    name: { img: 'ico-name.png', w: 59, h: 43, label: 'Name' },
    hoerner: { img: 'ico-hoerner.png', w: 39, h: 59, label: 'hat Hörner' },
    augen: { img: 'ico-augen.png', w: 45, h: 46, label: 'Anzahl der Augen' }
  };
  /* Erlaubte Werte je Eigenschaft (Tabelle im Heft) */
  var RULES = {
    name: function (v) { return /^[A-Za-zÄÖÜäöüß]{2,}$/.test(v); },     /* Text (mehrere Buchstaben) */
    hoerner: function (v) { return v === '✓' || v === 'X'; },            /* ✓ oder X */
    augen: function (v) { return /^[0-9]+$/.test(v); }                   /* Zahlen */
  };
  /* Die vier Karten, so wie sie im Heft stehen */
  var CARDS = [
    { key: 'A', name: 'LORI', hoerner: '2', augen: '✓' },
    { key: 'B', name: 'LORI', hoerner: '✓', augen: '3' },
    { key: 'C', name: 'LORI', hoerner: '2', augen: '3' },
    { key: 'D', name: '✓', hoerner: '2', augen: '3' }
  ];
  function valid(c) { return Object.keys(RULES).every(function (k) { return RULES[k](c[k]); }); }
  var ANSWER = CARDS.filter(valid).map(function (c) { return c.key; });   /* nur B */

  function cardAlt(c) {
    return 'Karte ' + c.key + ': Name ' + (c.name === '✓' ? 'Häkchen' : c.name) + ', Hörner ' + (c.hoerner === '✓' ? 'Häkchen' : c.hoerner) +
      ', Augen ' + (c.augen === '✓' ? 'Häkchen' : c.augen);
  }
  function ico(k, cls) {
    var i = ICON[k];
    return '<img class="' + (cls || P + 'ico') + '" src="' + DIR + i.img + '" width="' + i.w + '" height="' + i.h + '" alt="' + i.label + '">';
  }

  var el, api, locked, selected, mark;
  function reset() { selected = null; mark = null; }

  function table() {
    var t = h('table', { class: P + 'table' },
      h('thead', null, h('tr', null, h('th', null, 'Symbol'), h('th', null, 'Eigenschaft'), h('th', null, 'erlaubte Werte'))),
      h('tbody', null,
        ['name', 'hoerner', 'augen'].map(function (k) {
          var td = h('td', { class: P + 'sym' });
          td.innerHTML = ico(k);
          return h('tr', null, td, h('td', null, ICON[k].label),
            h('td', null, k === 'name' ? 'Text (mehrere Buchstaben)' : k === 'hoerner' ? '✓ oder X' : 'Zahlen'));
        })));
    return h('div', { class: P + 'tablewrap' }, t);
  }

  function render() {
    var opts = CARDS.map(function (c) {
      var cls = P + 'opt', badge = null;
      var isSel = selected === c.key || (mark === 'solution' && c.key === ANSWER[0]);
      if (isSel) {
        cls += ' selected';
        if (mark) {
          var ok = ANSWER.indexOf(c.key) >= 0;
          cls += ok ? ' right' : ' wrong';
          badge = h('span', { class: P + 'badge', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
        }
      }
      return h('button', {
        type: 'button', class: cls, role: 'radio', 'data-key': c.key, disabled: locked,
        'aria-checked': String(isSel), 'aria-label': cardAlt(c)
      }, h('span', { class: P + 'letter', 'aria-hidden': 'true' }, c.key + ')'),
      h('img', { src: DIR + c.key.toLowerCase() + '.png', alt: '', width: 279, height: 407, draggable: 'false' }), badge);
    });
    el.replaceChildren(h('div', { class: P + 'board' },
      h('figure', { class: P + 'fig' },
        h('img', {
          class: P + 'ex', src: DIR + 'beispiele.png', width: 820, height: 444, draggable: 'false',
          alt: 'Drei Ricca-Karten. Karte 1: Josi, Hörner X, 3 Augen. Karte 2: Moni, Hörner X, 3 Augen. Karte 3: Beni, Hörner Häkchen, 2 Augen.'
        })),
      table(),
      h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Karten A bis D' }, opts)));
  }

  function choose(key) {
    if (locked) return;
    selected = selected === key ? null : key;
    mark = null;
    render();
    var again = el.querySelector('[data-key="' + key + '"]');
    if (again) again.focus();
    api.changed();
  }
  function onClick(e) {
    var b = e.target.closest('[data-key]');
    if (b) choose(b.dataset.key);
  }
  function onKey(e) {
    var b = e.target.closest('[data-key]');
    if (!b || locked) return;
    var keys = CARDS.map(function (x) { return x.key; });
    var i = keys.indexOf(b.dataset.key), to = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = (i + 1) % keys.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = (i + keys.length - 1) % keys.length;
    if (to === null) return;
    e.preventDefault();
    selected = keys[to]; mark = null; render();
    el.querySelector('[data-key="' + keys[to] + '"]').focus();
    api.changed();
  }

  Biber.register({
    id: 'riccakarten124',
    story:
      '<p>Barbara sammelt Karten mit Monstern, den „Riccas“. Auf jeder Karte sind die Eigenschaften eines Riccas angegeben: ' +
      'der Name ' + ico('name') + ', ob das Ricca Hörner hat ' + ico('hoerner') + ' und die Anzahl der Augen ' + ico('augen') + '.</p>' +
      '<p>Hier sind drei Ricca-Karten, auf denen die Werte der Eigenschaften stehen. ' +
      'Für jede Eigenschaft ist festgelegt, welche Werte erlaubt sind. Barbara bekommt vier Karten für ein weiteres Ricca. ' +
      'Aber nur auf einer Karte haben alle Eigenschaften erlaubte Werte.</p>',
    question: 'Auf welcher Karte haben alle Eigenschaften erlaubte Werte?',
    howto: 'Vergleiche die Werte auf den Karten mit der Tabelle und tippe die passende Karte an.',
    explanation: function () {
      var rows = CARDS.map(function (c) {
        function cell(k) { var ok = RULES[k](c[k]); return '<td class="' + P + (ok ? 'ok' : 'no') + '">' + c[k] + ' <span aria-hidden="true">' + (ok ? '✓' : '✗') + '</span><span class="' + P + 'sr">' + (ok ? ' erlaubt' : ' nicht erlaubt') + '</span></td>'; }
        return '<tr><th scope="row">' + c.key + ')</th>' + cell('name') + cell('hoerner') + cell('augen') + '</tr>';
      }).join('');
      return '<p>Die Tabelle zeigt die Werte auf den vier Karten und ob sie erlaubt sind:</p>' +
        '<div class="' + P + 'tablewrap"><table class="' + P + 'table ' + P + 'res"><thead><tr><th></th><th>' + ico('name') + '<span class="' + P + 'sr">Name</span></th><th>' + ico('hoerner') + '<span class="' + P + 'sr">Hörner</span></th><th>' + ico('augen') + '<span class="' + P + 'sr">Augen</span></th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<p>Nur auf <strong>Karte B</strong> sind alle Werte erlaubt: ein Text als Name, ✓ bei den Hörnern und eine Zahl bei den Augen. ' +
        'Bei A, C und D steht bei den Hörnern die Zahl 2. Das Ricca hat zwar zwei Hörner, aber die Eigenschaft soll nur angeben, <i>ob</i> es Hörner hat. ' +
        'Bei A steht bei den Augen ein Häkchen statt einer Zahl, und bei D steht beim Namen ein Häkchen statt eines Textes.</p>' +
        '<p>Die Menge der erlaubten Werte einer Eigenschaft nennt man in der Informatik ihren <i>Datentyp</i>. ' +
        'Er bestimmt, was ein Programm mit den Werten machen kann: Mit Zahlen kann man zum Beispiel rechnen und zählen, mit ✓ oder X nur ja oder nein sagen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKey);
      render();
    },
    isComplete: function () { return selected != null; },
    evaluate: function () { return { correct: ANSWER.indexOf(selected) >= 0, answer: selected }; },
    setAnswer: function (ans) {
      selected = CARDS.some(function (c) { return c.key === ans; }) ? ans : null;
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () { selected = ANSWER[0]; locked = true; mark = 'solution'; render(); }
  });
})();
