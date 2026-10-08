/* Aufgabe Pizza-Party (Heft 2024, S. 47; Klasse 3-4 schwer, 7-8 einfach): drei Beläge wählen, die die meisten Wünsche erfüllen */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-pizza24-';
  var A = 'assets/pizza24/';

  /* Beläge in der Reihenfolge der Tabelle im Heft (S. 48) */
  var TOP = [
    { id: 'chili', name: 'Peperoni', alt: 'Peperoni (Chilischote)' },
    { id: 'pilz', name: 'Pilze', alt: 'Pilz' },
    { id: 'ananas', name: 'Ananas', alt: 'Ananasring' },
    { id: 'kraeuter', name: 'Kräuter', alt: 'Kräuter (Rucola)' },
    { id: 'kaese', name: 'Käse', alt: 'Käse' },
    { id: 'zwiebel', name: 'Zwiebeln', alt: 'Zwiebelringe' }
  ];
  /* Wünsche der Gäste laut Heft S. 47 */
  var GUESTS = [
    { name: 'Alice', wants: ['chili', 'pilz', 'kaese'] },
    { name: 'Bob', wants: ['pilz', 'ananas', 'zwiebel'] },
    { name: 'Cem', wants: ['pilz', 'kraeuter', 'kaese'] },
    { name: 'Dana', wants: ['pilz', 'kaese', 'zwiebel'] }
  ];
  var N = 3;

  function byId(id) { return TOP.filter(function (t) { return t.id === id; })[0]; }
  function score(ids) {
    var s = 0;
    GUESTS.forEach(function (g) { g.wants.forEach(function (w) { if (ids.indexOf(w) >= 0) s++; }); });
    return s;
  }
  function count(id) { return GUESTS.filter(function (g) { return g.wants.indexOf(id) >= 0; }).length; }
  /* Brute Force über alle 20 Dreier-Kombinationen: bester Wert */
  var BEST = (function () {
    var best = 0, i, j, k;
    for (i = 0; i < TOP.length; i++) for (j = i + 1; j < TOP.length; j++) for (k = j + 1; k < TOP.length; k++) {
      best = Math.max(best, score([TOP[i].id, TOP[j].id, TOP[k].id]));
    }
    return best;
  })();
  var SOLUTION = ['pilz', 'kaese', 'zwiebel'];   /* im Heft: Pilze (4), Käse (3), Zwiebeln (2) = 9 Wünsche */

  /* Plätze für die Beläge auf der Pizza (Prozent von Breite/Höhe der Pizza) */
  var SPOTS = [[50, 26, -10], [28, 40, 20], [70, 38, -25], [42, 56, 8], [62, 58, 30], [30, 66, -15],
    [51, 42, 14], [74, 54, -8], [24, 52, 25], [48, 74, -20], [60, 30, 5], [38, 30, 18]];

  var el, api, locked, picked, mark;
  var pizzaEl, boardBtns, tableEl, infoEl;

  function reset() { picked = []; mark = null; }

  function toggle(id) {
    if (locked) return;
    var i = picked.indexOf(id);
    if (i >= 0) picked.splice(i, 1);
    else if (picked.length < N) picked.push(id);
    else { refresh(); infoEl.textContent = 'Auf die Pizza passen nur drei Beläge. Nimm erst einen weg.'; return; }
    refresh();
    api.changed(picked.length + ' von ' + N + ' Belägen gewählt.');
  }

  function refresh() {
    /* Pizza */
    var kids = [h('img', { class: P + 'base', src: A + 'pizza.png', alt: '', width: 640, height: 617, draggable: 'false' })];
    picked.forEach(function (id, r) {
      [0, 3, 6, 9].forEach(function (off) {
        var s = SPOTS[r + off];
        kids.push(h('img', {
          class: P + 'on', src: A + id + '.png', alt: '', draggable: 'false',
          style: 'left:' + s[0] + '%;top:' + s[1] + '%;transform:translate(-50%,-50%) rotate(' + s[2] + 'deg)'
        }));
      });
    });
    pizzaEl.replaceChildren.apply(pizzaEl, kids);
    pizzaEl.setAttribute('aria-label', picked.length
      ? 'Die Pizza ist belegt mit: ' + picked.map(function (id) { return byId(id).name; }).join(', ') + '.'
      : 'Die Pizza ist noch unbelegt.');
    /* Belagbrett */
    boardBtns.forEach(function (b) {
      var id = b.getAttribute('data-top');
      var on = picked.indexOf(id) >= 0;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', byId(id).name + (on ? ', gewählt' : ', nicht gewählt'));
      b.disabled = false;
      b.classList.toggle('full', !on && picked.length >= N && !locked);
      b.setAttribute('aria-disabled', locked ? 'true' : 'false');
    });
    /* Tabelle: nach dem Prüfen erfüllte Wünsche markieren */
    var shown = mark !== null;
    var rows = GUESTS.map(function (g) {
      var fulfilled = g.wants.filter(function (w) { return picked.indexOf(w) >= 0; }).length;
      var cells = g.wants.map(function (w) {
        var ok = shown && picked.indexOf(w) >= 0;
        return h('td', null, h('span', { class: P + 'wish' + (ok ? ' met' : '') + (shown && !ok ? ' unmet' : '') },
          h('img', { src: A + w + '.png', alt: byId(w).alt, width: 40, height: 40, draggable: 'false' }),
          ok ? h('span', { class: P + 'tick', 'aria-label': 'erfüllt' }, '✓') : null));
      });
      return h('tr', null, h('th', { scope: 'row' }, g.name), cells, shown ? h('td', { class: P + 'cnt' }, fulfilled + ' von 3') : null);
    });
    tableEl.replaceChildren(h('tbody', null, rows));
    var sc = score(picked);
    if (shown) {
      infoEl.textContent = 'Erfüllte Wünsche: ' + sc + ' von ' + (GUESTS.length * 3) + (sc === BEST ? ' – mehr geht nicht.' : ' – es geht besser (bestens: ' + BEST + ').');
    } else if (picked.length === N) infoEl.textContent = 'Drei Beläge gewählt. Du kannst jetzt prüfen.';
    else infoEl.textContent = 'Wähle ' + N + ' Beläge. Gewählt: ' + picked.length + ' von ' + N + '.';
  }

  Biber.register({
    id: 'pizza24',
    story:
      '<p>John feiert eine Pizzaparty. Er weiß, welche Beläge sich seine Gäste auf der Pizza wünschen: Die Tabelle zeigt für jeden Gast drei Wünsche.</p>' +
      '<p>John möchte eine Pizza mit insgesamt drei Belägen backen. Er wählt drei Beläge so aus, dass er möglichst viele Wünsche seiner Gäste erfüllt.</p>',
    question: 'Mit welchen drei Belägen erfüllt John die meisten Wünsche?',
    howto: 'Tippe auf drei Beläge, sie landen auf der Pizza. Tippe einen gewählten Belag noch einmal an, um ihn wieder wegzunehmen.',
    explanation: function () {
      var head = '<th></th>' + TOP.map(function (t) { return '<th scope="col"><img src="' + A + t.id + '.png" alt="' + t.name + '" width="32" height="32"></th>'; }).join('');
      var body = GUESTS.map(function (g) {
        return '<tr><th scope="row">' + g.name + '</th>' + TOP.map(function (t) { return '<td>' + (g.wants.indexOf(t.id) >= 0 ? 1 : 0) + '</td>'; }).join('') + '</tr>';
      }).join('');
      var sum = '<tr class="' + P + 'sum"><th scope="row">Summe</th>' + TOP.map(function (t) { return '<td>' + count(t.id) + '</td>'; }).join('') + '</tr>';
      return '<p>Man muss nicht alle 20 Kombinationen ausprobieren. Es genügt zu zählen, wie oft jeder Belag gewünscht wird, und die drei beliebtesten zu nehmen:</p>' +
        '<div class="' + P + 'scroll"><table class="' + P + 'sumtab"><thead><tr>' + head + '</tr></thead><tbody>' + body + sum + '</tbody></table></div>' +
        '<p><strong>Pilze (4), Käse (3) und Zwiebeln (2)</strong> sind am beliebtesten. Zusammen erfüllen sie 9 Wünsche, mehr schafft keine andere Zusammenstellung.</p>' +
        '<p>Das ist ein Optimierungsproblem: Die Anzahl der erfüllten Wünsche ist das Maß, das so groß wie möglich werden soll. Hier lässt sich die beste Lösung direkt durch Addieren bestimmen, ohne Lösungen miteinander zu vergleichen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      tableEl = h('table', { class: P + 'tab' });
      pizzaEl = h('div', { class: P + 'pizza', role: 'img' });
      infoEl = h('p', { class: P + 'info', role: 'status', 'aria-live': 'polite' });
      boardBtns = TOP.map(function (t) {
        return h('button', { type: 'button', class: P + 'top', 'data-top': t.id, onclick: function () { toggle(t.id); } },
          h('img', { src: A + t.id + '.png', alt: '', width: 56, height: 56, draggable: 'false' }),
          h('span', null, t.name));
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { 'aria-label': 'Wünsche der Gäste' }, h('h3', null, 'Das wünschen sich die Gäste'),
          h('div', { class: P + 'scroll' }, tableEl)),
        h('section', { 'aria-label': 'Pizza und Beläge' },
          h('h3', null, 'Johns Pizza'), pizzaEl,
          h('h3', null, 'Beläge'), h('div', { class: P + 'tops' }, boardBtns), infoEl)));
      refresh();
    },
    isComplete: function () { return picked.length === N; },
    evaluate: function () {
      return { correct: score(picked) === BEST, answer: { toppings: picked.slice().sort() } };
    },
    setAnswer: function (ans) {
      picked = ((ans && ans.toppings) || []).filter(function (id) { return !!byId(id); }).slice(0, N);
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark || 'check') : null;
      refresh();
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () { picked = SOLUTION.slice(); locked = true; mark = 'solution'; refresh(); }
  });
})();
