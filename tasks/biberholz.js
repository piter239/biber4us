/* Aufgabe Biberholz (Klasse 5-6, schwer): Tabellen verknüpfen (Datenbankabfragen) */
(function () {
  'use strict';
  var h = Biber.h;

  /* ---------- Symbole (Strings, damit sie im Text und in der Erklärung stehen können) ---------- */
  var SHAPES = {
    blatt: '<path d="M16 4C8 8 5 17 9 27c9-1 17-8 17-21-4-1-7-2-10-2z" fill="var(--c2)" stroke="var(--ink)" stroke-width="1.4" stroke-linejoin="round"/><path d="M10 25C14 17 18 12 22 9" fill="none" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round"/>',
    blatt2: '<ellipse cx="16" cy="16" rx="8" ry="11" transform="rotate(35 16 16)" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 24L24 8" stroke="currentColor" stroke-width="1.4"/>',
    blatt3: '<path d="M16 4l3 6 6-2-2 6 6 2-5 4 3 6-7-1-3 5-3-5-7 1 3-6-5-4 6-2-2-6 6 2z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
    baum: '<path d="M16 29v-8" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/><path d="M16 21c-7 0-11-4-10-9 0-4 3-6 6-6 1-3 4-4 7-3 4 0 7 3 7 6 3 1 4 4 3 6-1 4-6 6-13 6z" fill="var(--c6)" stroke="var(--ink)" stroke-width="1.4" stroke-linejoin="round"/>',
    baum2: '<path d="M16 29v-6M16 4l8 11h-4l6 8H6l6-8H8z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
    baum3: '<path d="M16 29v-9M10 22c-5-1-6-7-2-9-1-5 4-8 8-5 4-3 9 0 8 5 4 2 3 8-2 9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>',
    frucht: '<path d="M16 9c-2-3-1-5 1-6" stroke="var(--ink)" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M16 9c-5-2-11 1-11 8 0 7 5 11 11 11s11-4 11-11c0-7-6-10-11-8z" fill="var(--c1)" stroke="var(--ink)" stroke-width="1.4" stroke-linejoin="round"/>',
    frucht2: '<circle cx="12" cy="20" r="6" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="21" cy="14" r="5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 14l3-6 6 2" fill="none" stroke="currentColor" stroke-width="1.4"/>',
    zapfen: '<g transform="rotate(-30 16 16)"><ellipse cx="16" cy="16" rx="8" ry="12" fill="var(--c2)" stroke="var(--ink)" stroke-width="1.4"/><path d="M9 10l14 12M9 16l14 0M10 22l12-12M13 5l6 22M19 5l-6 22" stroke="var(--ink)" stroke-width="1" opacity="0.7" fill="none"/></g>',
    farbe: '<path d="M16 4C8 4 3 9 3 16c0 8 7 12 12 12 3 0 3-3 2-5-1-3 1-5 4-5h5c3 0 4-2 4-4 0-6-6-10-14-10z" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.5" stroke-linejoin="round"/><circle cx="11" cy="11" r="2.4" fill="var(--c1)"/><circle cx="18" cy="9" r="2.4" fill="var(--c2)"/><circle cx="8" cy="18" r="2.4" fill="var(--c4)"/><circle cx="23" cy="13" r="2.4" fill="var(--c6)"/>',
    punkte: '<circle cx="12" cy="16" r="6" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="19" cy="16" r="6" fill="currentColor" opacity="0.7"/>',
    punkt: '<circle cx="16" cy="16" r="6.5" fill="currentColor" opacity="0.7"/>',
    burg: '<path d="M3 27C3 14 9 7 16 7s13 7 13 20z" fill="var(--c2)" stroke="var(--ink)" stroke-width="1.4" stroke-linejoin="round"/><path d="M5 20h22M7 14h18M12 7l-4 13M20 7l4 13M16 7v20M11 27a5 5 0 0 1 10 0z" stroke="var(--ink)" stroke-width="1" fill="none" opacity="0.7"/><path d="M12 27a4 4 0 0 1 8 0z" fill="var(--ink)"/>',
    haken: '<path d="M7 17l6 7L26 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    kreuz: '<path d="M8 8l16 16M24 8L8 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>'
  };
  var LABEL = {
    blatt: 'Blattform', baum: 'Baumart', frucht: 'Baumfrucht', zapfen: 'Nadelbaum-Zapfen', farbe: 'Holzfarbe', burg: 'Biberholz für Biberburgen'
  };
  function ic(name, size, extra) {
    var label = LABEL[name];
    return '<svg class="bh-ic' + (extra ? ' ' + extra : '') + '" viewBox="0 0 32 32" width="' + (size || 26) + '" height="' + (size || 26) + '" ' +
      (label ? 'role="img" aria-label="' + label + '"' : 'aria-hidden="true"') + ' focusable="false">' + SHAPES[name] + '</svg>';
  }
  function dots() { return '<span class="bh-dots" aria-hidden="true">⋮</span>'; }

  /* kleine Tabellen wie im Heft: Kopfzeile mit Symbolen, ein paar Beispielzeilen, "und so weiter" */
  function table(cols, rows) {
    var cell = function (s) { return '<td>' + (s || '') + '</td>'; };
    return '<table class="bh-tbl" aria-hidden="true"><thead><tr>' + cols.map(function (c) { return '<th>' + ic(c, 30) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr>' + r.map(cell).join('') + '</tr>'; }).join('') +
      '<tr>' + cols.map(function () { return '<td>' + dots() + '</td>'; }).join('') + '</tr></tbody></table>';
  }
  function friend(name, tbl, text) {
    return '<div class="bh-friend"><div class="bh-tblwrap">' + tbl + '</div><p class="bh-text"><strong>' + name + '</strong> ' + text + '</p></div>';
  }

  var OPTIONS = [
    { id: 'A', text: 'Nur Ladina.', seq: ['Ladina'] },
    { id: 'B', text: 'Erst Severin, dann Quirina.', seq: ['Severin', 'Quirina'] },
    { id: 'C', text: 'Erst Severin, dann Ladina.', seq: ['Severin', 'Ladina'] },
    { id: 'D', text: 'Erst Quirina, dann Severin, dann Ladina.', seq: ['Quirina', 'Severin', 'Ladina'] }
  ];
  var SOLUTION = 'C';

  var el, api, locked, choice, mark, box;

  function render() {
    [].forEach.call(box.querySelectorAll('label'), function (lab) {
      var inp = lab.querySelector('input');
      var id = inp.value;
      inp.checked = id === choice;
      inp.disabled = !!locked;
      lab.classList.toggle('sel', id === choice);
      lab.classList.toggle('right', (mark === 'check' && id === choice && id === SOLUTION) || (mark === 'solution' && id === SOLUTION));
      lab.classList.toggle('wrong', mark === 'check' && id === choice && id !== SOLUTION);
    });
  }

  Biber.register({
    id: 'biberholz',
    story: '<p>Eddie und seine Freunde gehen gern wandern. Während ihrer Wanderungen sammeln sie Informationen über die Bäume, die sie sehen, und notieren diese in lange Tabellen.</p>' +
      '<div class="bh-friends">' +
      friend('Severin', table(['blatt', 'baum'], [['<span class="bh-d">' + ic('blatt3', 22) + '</span>', '<span class="bh-d">' + ic('baum3', 22) + '</span>'], ['<span class="bh-d">' + ic('blatt2', 22) + '</span>', '<span class="bh-d">' + ic('baum2', 22) + '</span>']]),
        'sammelt Information über Blattformen ' + ic('blatt', 22) + ' und die zugehörigen Baumarten ' + ic('baum', 22) + '.') +
      friend('Quirina', table(['frucht', 'zapfen', 'baum'], [['<span class="bh-d">' + ic('frucht2', 22) + '</span>', '<span class="bh-d">' + ic('kreuz', 18) + '</span>', '<span class="bh-d">' + ic('baum3', 22) + '</span>'], ['<span class="bh-d">' + ic('frucht2', 22) + '</span>', '<span class="bh-d">' + ic('kreuz', 18) + '</span>', '<span class="bh-d">' + ic('baum2', 22) + '</span>']]),
        'sammelt Informationen über Baumfrüchte ' + ic('frucht', 22) + ', ob diese von Nadelbäumen ' + ic('zapfen', 22) + ' stammen und über die zugehörigen Baumarten ' + ic('baum', 22) + '.') +
      friend('Ladina', table(['baum', 'farbe', 'burg'], [['<span class="bh-d">' + ic('baum3', 22) + '</span>', '<span class="bh-d">' + ic('punkte', 22) + '</span>', '<span class="bh-d">' + ic('haken', 20) + '</span>'], ['<span class="bh-d">' + ic('baum2', 22) + '</span>', '<span class="bh-d">' + ic('punkt', 22) + '</span>', '<span class="bh-d">' + ic('kreuz', 18) + '</span>']]),
        'sammelt Informationen über Baumarten ' + ic('baum', 22) + ', über deren Holzfarben ' + ic('farbe', 22) + ', und darüber, ob sie Biberholz ' + ic('burg', 22) + ' für Biberburgen liefern.') +
      '</div>' +
      '<p>Eddie hat im Wald ein Blatt gefunden und kennt dessen Form. Nun möchte er erfahren, ob die zugehörige Baumart Biberholz für Biberburgen liefert.</p>',
    question: 'Welche seiner Freunde muss Eddie fragen, und in welcher Reihenfolge, um das zu erfahren?',
    howto: 'Tippe die richtige Antwort an.',
    explanation: function () {
      var chain = '<p class="bh-chain" aria-hidden="true">' + ic('blatt', 30) + '<span>→</span><strong>Severin</strong><span>→</span>' + ic('baum', 30) +
        '<span>→</span><strong>Ladina</strong><span>→</span>' + ic('burg', 30) + '</p>';
      return chain + '<p>Eddie kennt nur die Blattform. Nur Severins Tabelle hat eine Spalte mit Blattformen, dort findet er die Baumart. ' +
        'Mit der Baumart schaut er in Ladinas Tabelle nach, ob sie Biberholz liefert. Quirina muss er nicht fragen: Ihre Tabelle kennt keine Blattformen und sagt auch nichts über Biberholz.</p>' +
        '<p>Die Baumart verbindet beide Tabellen, weil sie in beiden vorkommt. In Datenbanken nutzt man solche gemeinsamen Spalten, um Tabellen zu verknüpfen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; choice = null; mark = null;
      box = h('div', { class: 'bh-opts', role: 'radiogroup', 'aria-label': 'Antworten' },
        OPTIONS.map(function (o) {
          return h('label', { class: 'bh-opt' },
            h('input', { type: 'radio', name: 'bh-ans', value: o.id, onchange: function () { if (locked) return; choice = o.id; mark = null; render(); api.changed(); } }),
            h('span', { class: 'bh-letter', 'aria-hidden': 'true' }, o.id),
            h('span', { class: 'bh-otext' }, o.text));
        }));
      el.replaceChildren(box);
      render();
    },
    isComplete: function () { return choice != null; },
    evaluate: function () { return { correct: choice === SOLUTION, answer: { choice: choice } }; },
    setAnswer: function (ans) { choice = ans && ans.choice ? ans.choice : null; mark = 'check'; render(); },
    lock: function (on) { locked = on; mark = on ? 'check' : null; render(); },
    reset: function () { choice = null; mark = null; render(); },
    showSolution: function () { choice = SOLUTION; locked = true; mark = 'solution'; render(); }
  });
})();
