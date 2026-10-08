/* Aufgabe Bibermeisterschaft (Biber 2022; Klasse 11-13 schwer): Welche drei Biber waren in Runde 1 in Adas Team? (Rückwärtssuche) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-meisterschaft22-';
  var IMG = 'assets/meisterschaft22/';

  var NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  var SCORE = {   /* Punkte je Runde, wie in der Tabelle im Heft */
    A: [15, 20, 10], B: [16, 27, 14], C: [19, 30, 11], D: [18, 24, 15],
    E: [17, 28, 16], F: [20, 24, 13], G: [19, 30, 9], H: [19, 30, 12]
  };
  var OTHERS = NAMES.slice(1);

  function sum(list, r) { return list.reduce(function (s, b) { return s + SCORE[b][r]; }, 0); }
  function combos(list, k) {
    if (k === 0) return [[]];
    if (list.length < k) return [];
    var out = [];
    combos(list.slice(1), k - 1).forEach(function (c) { out.push([list[0]].concat(c)); });
    return out.concat(combos(list.slice(1), k));
  }
  /* Alle Teams für Runde 1, die zu den Punkten und zu Platz 1 von Ada passen (Brute Force über alle 35 Möglichkeiten) */
  function consistent(mates) {
    var team = ['A'].concat(mates);
    var rest = NAMES.filter(function (b) { return team.indexOf(b) < 0; });
    if (!(sum(team, 0) > sum(rest, 0))) return false;                 /* Runde 1: Adas Team gewinnt */
    return mates.some(function (q) {                                  /* q = Adas Partner in Runde 2 */
      var others = mates.filter(function (b) { return b !== q; });
      return SCORE.A[1] + SCORE[q][1] > sum(others, 1) &&             /* Runde 2: Adas Zweierteam gewinnt */
        SCORE.A[2] > SCORE[q][2];                                     /* Runde 3: Ada schlägt ihren Partner */
    });
  }
  var VALID = combos(OTHERS, 3).filter(consistent).map(function (c) { return c.join(''); });   /* = ['DFG'] */

  function img(b, cls) {
    return h('img', { class: cls || '', src: IMG + b + '.png', alt: 'Biber ' + b, width: 100, height: 133, draggable: 'false' });
  }
  function imgHtml(b, cls) { return '<img class="' + cls + '" src="' + IMG + b + '.png" alt="Biber ' + b + '" width="100" height="133">'; }

  var el, api, picked, locked, mark, tableEl, slotsEl, poolEl, msgEl;

  function reset() { picked = []; mark = null; }
  function key() { return picked.slice().sort().join(''); }

  function drawTable() {
    var s = '<table class="' + P + 'tab"><caption class="' + P + 'sr">Punkte der acht Biber in drei Runden</caption><thead><tr><th scope="col"><span class="' + P + 'bib">Biber</span><span class="' + P + 'rnd">Runde</span></th>';
    NAMES.forEach(function (b) { s += '<th scope="col" class="' + (b === 'A' || picked.indexOf(b) >= 0 ? P + 'sel' : '') + '">' + imgHtml(b, P + 'th') + '</th>'; });
    s += '</tr></thead><tbody>';
    [0, 1, 2].forEach(function (r) {
      s += '<tr><th scope="row"><span class="' + P + 'rl">Runde </span>' + (r + 1) + '</th>';
      NAMES.forEach(function (b) { s += '<td class="' + (b === 'A' || picked.indexOf(b) >= 0 ? P + 'sel' : '') + '">' + SCORE[b][r] + '</td>'; });
      s += '</tr>';
    });
    tableEl.innerHTML = s + '</tbody></table>';
  }
  function drawSlots() {
    slotsEl.replaceChildren();
    slotsEl.appendChild(h('span', { class: P + 'slot ' + P + 'fixed', 'aria-label': 'Ada (A), steht schon im Team' }, img('A')));
    for (var i = 0; i < 3; i++) {
      var b = picked[i];
      slotsEl.appendChild(b
        ? h('button', { type: 'button', class: P + 'slot ' + P + 'filled', 'data-take': b, disabled: locked, 'aria-label': 'Biber ' + b + ' aus Adas Team nehmen', onclick: function (e) { toggle(e.currentTarget.getAttribute('data-take')); } }, img(b))
        : h('span', { class: P + 'slot ' + P + 'empty', 'aria-hidden': 'true' }, '?'));
    }
  }
  function drawPool() {
    poolEl.replaceChildren();
    OTHERS.forEach(function (b) {
      var on = picked.indexOf(b) >= 0;
      poolEl.appendChild(on
        ? h('span', { class: P + 'cell', 'aria-hidden': 'true' })
        : h('button', { type: 'button', class: P + 'bv', 'data-add': b, disabled: locked, 'aria-label': 'Biber ' + b + ' in Adas Team', onclick: function (e) { toggle(e.currentTarget.getAttribute('data-add')); } }, img(b)));
    });
  }
  function drawMarks() {
    var box = slotsEl.parentNode;
    box.classList.toggle('right', mark !== null && VALID.indexOf(key()) >= 0);
    box.classList.toggle('wrong', mark === 'check' && VALID.indexOf(key()) < 0);
  }
  function refresh() {
    drawTable(); drawSlots(); drawPool(); drawMarks();
    msgEl.textContent = picked.length === 3
      ? 'Adas Team: A, ' + picked.slice().sort().join(', ') + '. Zum Ändern tippe ein Teammitglied an.'
      : 'Noch ' + (3 - picked.length) + (3 - picked.length === 1 ? ' Biber' : ' Biber') + ' für Adas Team auswählen.';
  }
  function toggle(b) {
    if (locked) return;
    var i = picked.indexOf(b);
    if (i >= 0) picked.splice(i, 1);
    else if (picked.length < 3) picked.push(b);
    else return;
    refresh();
    api.changed();
  }

  function row(b) { return b + ' (' + SCORE[b].join(', ') + ')'; }

  Biber.register({
    id: 'meisterschaft22',
    story: '<p>An der Bibermeisterschaft nehmen 8 Biber teil. Es gibt drei Runden. In jeder Runde sammelt jeder Biber Punkte.</p>' +
      '<ul><li><strong>Runde 1:</strong> Es werden zwei Teams aus je 4 Bibern gebildet. Die Punkte der einzelnen Biber im Team werden aufsummiert. Das Team mit den meisten Punkten gewinnt. Diese Biber sind in Runde 2 die Spitzengruppe und spielen um die Plätze 1 bis 4. Die Verlierer machen die Plätze 5 bis 8 unter sich aus.</li>' +
      '<li><strong>Runde 2:</strong> Es gelten dieselben Regeln, die Teams bestehen jetzt aus 2 Bibern. Das Gewinnerteam der Spitzengruppe spielt in Runde 3 um Platz 1. Die Verlierer machen die Plätze 3 und 4 unter sich aus.</li>' +
      '<li><strong>Runde 3:</strong> Die Biber treten einzeln gegeneinander an.</li></ul>' +
      '<p>Biber Ada (A) erreicht Platz 1 der Bibermeisterschaft. In der Tabelle siehst du die Punkte, die jeder Biber in jeder Runde erzielt hat.</p>',
    question: 'Welche drei Biber waren in Adas Team in Runde 1?',
    howto: 'Tippe in der unteren Reihe drei Biber an, die mit Ada in einem Team waren. Tippst du einen Biber in Adas Team noch einmal an, geht er zurück. Die Spalten der gewählten Biber sind in der Tabelle markiert.',
    explanation: function () {
      var d = 'DFG';
      return '<p>Man kann rückwärts denken, von Runde 3 aus. In Runde 3 spielen nur die beiden Biber des Gewinnerteams aus Runde 2 gegeneinander, und Ada gewinnt. Ada hat 10 Punkte, nur Biber <strong>G</strong> hat weniger (9). Also war G in Runde 2 in Adas Team (zusammen ' + (SCORE.A[1] + SCORE.G[1]) + ' Punkte).</p>' +
        '<p>Die beiden anderen Biber der Spitzengruppe hatten in Runde 2 zusammen weniger als 50 Punkte. Nur <strong>D und F</strong> (24 + 24 = 48) bilden ein Paar unter 50. Adas Team in Runde 1 waren also A, D, F und G.</p>' +
        '<p>Zur Probe: In Runde 1 hat dieses Team ' + sum(['A', 'D', 'F', 'G'], 0) + ' Punkte, das andere (B, C, E, H) ' + sum(['B', 'C', 'E', 'H'], 0) + ' Punkte, es gewinnt also.</p>' +
        '<p>Man könnte auch alle ' + combos(OTHERS, 3).length + ' möglichen Teams durchprobieren (Brute Force). Das ist aufwendig. Geschickter ist eine Rückwärtssuche: Man beginnt beim Ergebnis (Platz 1) und schließt der Reihe nach, was vorher gewesen sein muss. Das hilft immer dann, wenn eine Lösung bestimmte Bedingungen erfüllen muss.</p>' +
        '<p class="' + P + 'sol">' + d.split('').map(function (b) { return imgHtml(b, P + 'xs'); }).join('') + '</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      tableEl = h('div', { class: P + 'tablewrap' });
      slotsEl = h('div', { class: P + 'slots' });
      poolEl = h('div', { class: P + 'pool' });
      msgEl = h('p', { class: P + 'msg', role: 'status', 'aria-live': 'polite' });
      el.replaceChildren(h('div', { class: P + 'board' },
        tableEl,
        h('section', { 'aria-label': 'Runde 1' },
          h('h3', null, 'Adas Team in Runde 1'),
          h('div', { class: P + 'team' }, slotsEl)),
        h('section', { 'aria-label': 'Weitere Biber' }, h('h3', null, 'Weitere Biber'), poolEl),
        msgEl));
      refresh();
    },
    isComplete: function () { return picked.length === 3; },
    evaluate: function () { return { correct: VALID.indexOf(key()) >= 0, answer: picked.slice().sort() }; },
    setAnswer: function (ans) { picked = Array.isArray(ans) ? ans.filter(function (b) { return OTHERS.indexOf(b) >= 0; }).slice(0, 3) : []; mark = 'check'; refresh(); },
    lock: function (on) { locked = on; mark = on ? 'check' : null; refresh(); },
    reset: function () { reset(); refresh(); },
    showSolution: function () { picked = VALID[0].split(''); mark = 'solution'; locked = true; refresh(); }
  });
})();
