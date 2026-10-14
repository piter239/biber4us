/* Aufgabe Passende Gerichte (Heft 2018, Klasse 3-4 mittel, 5-6 einfach): Repräsentation, Mustervergleich, Abstandsmaß */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-passendegerichte18-';
  var A = 'assets/passendegerichte18/';

  /* Zutaten je Gericht, wie auf den Bildern im Heft (gleiches Bild = gleiche Zutat) */
  var DISHES = {
    pasta: { name: 'Pasta', img: 'pasta.png', items: ['nudeln', 'zwiebel', 'käse', 'soße'],
      alt: 'Pasta: Nudeln, Zwiebel, Käse und eine Flasche mit roter Soße' },
    eiersalat: { name: 'Eiersalat', img: 'eiersalat.png', items: ['mayonnaise', 'ei', 'zwiebel', 'salz'],
      alt: 'Eiersalat: ein Glas Mayonnaise, ein Ei, eine Zwiebel und Salz' },
    nusssalat: { name: 'Nusssalat', img: 'nusssalat.png', items: ['walnuss', 'pfirsich', 'mayonnaise', 'sellerie'],
      alt: 'Nusssalat: eine Walnuss, ein Pfirsich, ein Glas Mayonnaise und Sellerie' },
    huehnersuppe: { name: 'Hühnersuppe', img: 'huehnersuppe.png', items: ['ei', 'zwiebel', 'hühnerkeule', 'salz'],
      alt: 'Hühnersuppe: ein Ei, eine Zwiebel, eine Hühnerkeule und Salz' },
    torte: { name: 'Torte', img: 'torte.png', items: ['mehl', 'ei', 'zucker', 'pfirsich'],
      alt: 'Torte: Mehl, ein Ei, Zuckerwürfel und ein Pfirsich' }
  };
  var ORDER = ['pasta', 'eiersalat', 'nusssalat', 'huehnersuppe', 'torte'];
  var OPTIONS = [['huehnersuppe', 'pasta'], ['huehnersuppe', 'nusssalat'], ['huehnersuppe', 'eiersalat'], ['nusssalat', 'torte']];
  var RIGHT = 2;

  function common(a, b) {
    return DISHES[a].items.filter(function (x) { return DISHES[b].items.indexOf(x) >= 0; });
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function optText(o) { return DISHES[o[0]].name + ' und ' + DISHES[o[1]].name; }
  /* Selbstprüfung: genau Antwort C hat mindestens zwei gleiche Zutaten */
  OPTIONS.forEach(function (o, i) {
    if ((common(o[0], o[1]).length >= 2) !== (i === RIGHT)) throw new Error('passendegerichte18: Lösung stimmt nicht');
  });

  var el, api, optsEl, dishesEl, locked, picked, mode;

  function renderDishes() {
    var hit = picked === null ? [] : OPTIONS[picked];
    dishesEl.replaceChildren.apply(dishesEl, ORDER.map(function (k) {
      var d = DISHES[k];
      var on = hit.indexOf(k) >= 0;
      return h('figure', { class: P + 'dish' + (on ? ' on' : '') },
        h('figcaption', null, d.name),
        h('img', { src: A + d.img, alt: d.alt, width: 360, height: 300, draggable: 'false' }));
    }));
  }
  function optionCard(o, idx) {
    var sel = picked === idx;
    var cls = P + 'opt';
    var mark = '';
    if (mode && (mode === 'solution' ? idx === RIGHT : sel)) {
      var ok = idx === RIGHT;
      cls += ok ? ' right' : ' wrong';
      mark = ok ? '✓' : '✗';
    }
    var input = h('input', { type: 'radio', name: P + 'opt', value: String(idx), disabled: locked, 'aria-label': 'Antwort ' + 'ABCD'[idx] + ': ' + optText(o) });
    input.checked = sel;
    return h('label', { class: cls }, input,
      h('span', { class: P + 'card' },
        h('span', { class: P + 'let' }, 'ABCD'[idx] + ')'),
        h('span', { class: P + 'val' }, optText(o)),
        mark ? h('span', { class: P + 'mark', 'aria-hidden': 'true' }, mark) : null));
  }
  function render() {
    optsEl.replaceChildren.apply(optsEl, OPTIONS.map(optionCard));
    renderDishes();
  }
  function onChange(e) {
    if (locked || !e.target.matches('input[type=radio]')) return;
    picked = +e.target.value;
    render();
    var f = optsEl.querySelector('input:checked'); if (f) f.focus();
    api.changed('Antwort ' + 'ABCD'[picked] + ' gewählt.');
  }

  Biber.register({
    id: 'passendegerichte18',
    story: '<p>Bela kann fünf verschiedene Gerichte zubereiten. Das Bild zeigt die Gerichte mit ihren Zutaten.</p>' +
      '<p>Für eine Party will Bela zwei Gerichte zubereiten. Diese beiden Gerichte sollen zusammen passen. Bela meint: Zwei Gerichte passen zusammen, wenn <b>mindestens zwei Zutaten gleich</b> sind.</p>',
    question: 'Welche zwei Gerichte passen zusammen?',
    howto: 'Wähle eine Antwort aus. Die gewählten Gerichte werden im Bild hervorgehoben.',
    explanation: function () {
      var lines = OPTIONS.map(function (o, i) {
        var c = common(o[0], o[1]);
        var txt = c.length === 0 ? 'keine gemeinsame Zutat'
          : c.length === 1 ? 'nur eine gemeinsame Zutat (' + cap(c[0]) + ')'
            : c.length + ' gemeinsame Zutaten (' + c.map(cap).join(', ') + ')';
        return '<li><b>' + 'ABCD'[i] + ') ' + optText(o) + ':</b> ' + txt + (i === RIGHT ? ' – das passt.' : ' – das sind zu wenige.') + '</li>';
      }).join('');
      return '<p>Man muss bei jedem Paar die Zutaten vergleichen und die gleichen zählen. Nur bei Hühnersuppe und Eiersalat sind es mindestens zwei, nämlich <b>drei</b>: Ei, Zwiebel und Salz. Die richtige Antwort ist <b>C</b>.</p>' +
        '<ul class="' + P + 'list">' + lines + '</ul>' +
        '<p><b>Informatik:</b> Um zu entscheiden, welche Gerichte zusammen passen, misst Bela, wie weit zwei Gerichte voneinander „entfernt“ sind. Das Maß dafür ist die Zahl der gleichen Zutaten: Je mehr gleich sind, desto näher sind sich die Gerichte; sind alle gleich, ist der Abstand null. ' +
        'Solche Abstands- oder Ähnlichkeitsmaße braucht man in der Informatik oft, zum Beispiel beim Mustervergleich oder wenn man bei der Suche nach einer guten Lösung wissen will, wie groß ein Verbesserungsschritt ist.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null;
      dishesEl = h('div', { class: P + 'dishes', role: 'group', 'aria-label': 'Die fünf Gerichte mit ihren Zutaten' });
      optsEl = h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Antworten' });
      el.replaceChildren(h('div', { class: P + 'box' }, dishesEl, optsEl));
      optsEl.addEventListener('change', onChange);
      render();
    },
    isComplete: function () { return picked !== null; },
    evaluate: function () { return { correct: picked === RIGHT, answer: picked }; },
    setAnswer: function (ans) { picked = typeof ans === 'number' ? ans : null; mode = 'check'; render(); },
    lock: function (on) {
      locked = on;
      mode = on ? (mode || 'check') : null;
      render();
    },
    reset: function () { picked = null; mode = null; render(); },
    showSolution: function () { picked = RIGHT; mode = 'solution'; locked = true; render(); }
  });
})();
