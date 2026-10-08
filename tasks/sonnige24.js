/* Aufgabe Sonnige Tage (Biber 2024; Klasse 9-10 schwer, 11-13 mittel): Gegenbeispiel zu einer Aussage mit "alle"/"mindestens ein" */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-sonnige24-';

  var FIRST = [
    { key: 's1', text: 'sonnig' },
    { key: 's2', text: 'nicht sonnig' }
  ];
  var SECOND = [
    { key: 't1', text: 'in allen Teichen schwammen Biber' },
    { key: 't2', text: 'im Teich mit dem Wasserfall schwamm kein Biber' },
    { key: 't3', text: 'Biber Michael schwamm durch alle Teiche' },
    { key: 't4', text: 'Biber Michael schwamm gar nicht' }
  ];
  /* Offizielle Lösung (Heft S. 63) und per Skript (Modellprüfung über alle Welten mit 2 Teichen und 2 Bibern) bestätigt:
     nur "sonnig" + "im Teich mit dem Wasserfall schwamm kein Biber" erzwingt, dass Toms Aussage falsch ist. */
  var RIGHT = { a: 's1', b: 't2' };

  var el, api, locked, mark, sel;
  var slotA, slotB, chipsA, chipsB;

  function reset() { sel = { a: null, b: null }; mark = null; }
  function textOf(list, key) { var r = list.filter(function (o) { return o.key === key; })[0]; return r ? r.text : ''; }
  function isRight(g) { return sel[g] === RIGHT[g]; }

  function scene() {
    return '<svg class="' + P + 'scene" viewBox="0 0 220 120" role="img" aria-label="Zwei Biber unter einem Sonnenschirm im Teich, die Sonne scheint">' +
      '<g class="' + P + 'sun"><circle cx="176" cy="30" r="15"/>' +
      '<path d="M176 6v8M176 46v8M152 30h8M192 30h8M159 13l6 6M187 41l6 6M193 13l-6 6M165 41l-6 6"/></g>' +
      '<path class="' + P + 'pole" d="M82 28V96"/>' +
      '<path class="' + P + 'sh1" d="M40 54Q82 6 124 54Z"/>' +
      '<path class="' + P + 'sh2" d="M82 22Q64 30 56 52Q82 38 82 22ZM82 22Q100 30 108 52Q82 38 82 22Z"/>' +
      '<ellipse class="' + P + 'b" cx="58" cy="90" rx="13" ry="16"/><ellipse class="' + P + 'b" cx="106" cy="90" rx="13" ry="16"/>' +
      '<circle class="' + P + 'b" cx="58" cy="70" r="9"/><circle class="' + P + 'b" cx="106" cy="70" r="9"/>' +
      '<path class="' + P + 'water" d="M6 96Q22 88 38 96T70 96T102 96T134 96T166 96T198 96T214 96V114Q214 118 208 118H12Q6 118 6 114Z"/>' +
      '</svg>';
  }

  function refresh() {
    [['a', chipsA, FIRST, slotA], ['b', chipsB, SECOND, slotB]].forEach(function (g) {
      var grp = g[0], chips = g[1], list = g[2], slot = g[3];
      var cur = sel[grp];
      chips.forEach(function (btn, i) {
        var on = cur === list[i].key, ok = list[i].key === RIGHT[grp];
        btn.setAttribute('aria-checked', String(on));
        btn.setAttribute('aria-disabled', locked ? 'true' : 'false');
        btn.tabIndex = (cur === null ? i === 0 : on) ? 0 : -1;
        btn.classList.toggle('selected', on);
        btn.classList.toggle('right', on && mark !== null && ok);
        btn.classList.toggle('wrong', on && mark === 'check' && !ok);
        var m = btn.querySelector('.' + P + 'mark');
        if (m) m.remove();
        if (on && mark !== null) btn.appendChild(h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
      });
      slot.textContent = cur ? textOf(list, cur) : '…';
      slot.classList.toggle('filled', !!cur);
      slot.classList.toggle('right', !!cur && mark !== null && cur === RIGHT[grp]);
      slot.classList.toggle('wrong', !!cur && mark === 'check' && cur !== RIGHT[grp]);
      slot.disabled = locked || !cur;
      slot.setAttribute('aria-label', 'Lücke ' + (grp === 'a' ? '1' : '2') + ': ' + (cur ? textOf(list, cur) + ' (antippen zum Leeren)' : 'leer'));
    });
  }

  function pick(grp, key) {
    if (locked) return;
    sel[grp] = sel[grp] === key ? null : key;
    refresh();
    api.changed();
  }
  function makeChips(grp, list) {
    var arr = list.map(function (o, i) {
      return h('button', {
        type: 'button', role: 'radio', class: P + 'chip', 'data-key': o.key, 'aria-checked': 'false',
        onclick: function () { pick(grp, o.key); },
        onkeydown: function (e) {
          var k = e.key, to = null, n = list.length;
          if (k === 'ArrowDown' || k === 'ArrowRight') to = (i + 1) % n;
          else if (k === 'ArrowUp' || k === 'ArrowLeft') to = (i + n - 1) % n;
          if (to === null) return;
          e.preventDefault();
          if (locked) return;
          sel[grp] = list[to].key; refresh(); arr[to].focus(); api.changed();
        }
      }, o.text);
    });
    return arr;
  }

  Biber.register({
    id: 'sonnige24',
    story:
      '<p>Tom sagt: „An sonnigen Tagen schwimmt in jedem Teich mindestens ein Biber.“</p>' +
      '<p>Kim antwortet: „Das ist nicht wahr. Am letzten Sonntag wurde deine Aussage widerlegt.“</p>',
    question: 'Was ist am letzten Sonntag passiert? Fülle die Lücken so, dass Toms Aussage widerlegt wird.',
    howto: 'Tippe für jede Lücke eine passende Möglichkeit an. Tippst du sie noch einmal an, ist die Lücke wieder leer.',
    explanation: function () {
      return '<p>Tom behauptet etwas über <strong>alle</strong> sonnigen Tage, und an jedem dieser Tage über <strong>alle</strong> Teiche. ' +
        'Um das zu widerlegen, genügt ein einziges Gegenbeispiel: ein <strong>sonniger</strong> Tag, an dem in <strong>einem</strong> Teich kein Biber schwamm. ' +
        'Über nicht sonnige Tage sagt Tom nichts, deshalb muss die erste Lücke „sonnig“ lauten. Das ist genau die Aussage „im Teich mit dem Wasserfall schwamm kein Biber“.</p>' +
        '<p>Die anderen Möglichkeiten widerlegen nichts: Wenn in allen Teichen Biber schwammen, passt das zu Toms Aussage. ' +
        'Wenn Biber Michael durch alle Teiche schwamm, war in jedem Teich ein Biber. Und wenn Michael gar nicht schwamm, können in jedem Teich trotzdem andere Biber geschwommen sein.</p>' +
        '<p>In der Logik sagt „für alle“ etwas über jedes Objekt einer Menge, „es gibt mindestens ein“ nur etwas über ein Objekt. Eine „Für-alle“-Aussage widerlegt man mit einem einzigen Gegenbeispiel.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      chipsA = makeChips('a', FIRST);
      chipsB = makeChips('b', SECOND);
      slotA = h('button', { type: 'button', class: P + 'slot', onclick: function () { pick('a', sel.a); } }, '…');
      slotB = h('button', { type: 'button', class: P + 'slot', onclick: function () { pick('b', sel.b); } }, '…');
      var sceneBox = h('div', { class: P + 'scenebox' });
      sceneBox.innerHTML = scene();
      el.replaceChildren(h('div', { class: P + 'board' },
        sceneBox,
        h('p', { class: P + 'sentence', 'aria-live': 'polite' },
          'Letzten Sonntag war es ', slotA, ' und ', slotB, '.'),
        h('div', { class: P + 'cols' },
          h('section', { 'aria-label': 'Möglichkeiten für die erste Lücke' },
            h('h3', null, 'Erste Lücke'),
            h('div', { class: P + 'chips', role: 'radiogroup', 'aria-label': 'Erste Lücke: Wetter am Sonntag' }, chipsA)),
          h('section', { 'aria-label': 'Möglichkeiten für die zweite Lücke' },
            h('h3', null, 'Zweite Lücke'),
            h('div', { class: P + 'chips', role: 'radiogroup', 'aria-label': 'Zweite Lücke: Teiche und Biber' }, chipsB)))));
      refresh();
    },
    isComplete: function () { return sel.a !== null && sel.b !== null; },
    evaluate: function () {
      return { correct: sel.a === RIGHT.a && sel.b === RIGHT.b, answer: { a: sel.a, b: sel.b } };
    },
    setAnswer: function (ans) {
      var okA = ans && FIRST.some(function (o) { return o.key === ans.a; });
      var okB = ans && SECOND.some(function (o) { return o.key === ans.b; });
      sel = { a: okA ? ans.a : null, b: okB ? ans.b : null };
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      refresh();
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () { sel = { a: RIGHT.a, b: RIGHT.b }; mark = 'solution'; locked = true; refresh(); }
  });
})();
