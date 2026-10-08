/* Aufgabe Biber-Burger (Heft 2022, S. 13; Klasse 3-4 schwer, 5-6 mittel, 7-8 einfach): Bedingungen prüfen, Auswahl A-D */
(function () {
  'use strict';
  var h = Biber.h;
  var IMG = 'assets/burger22/';

  var ING = {
    b: { name: 'Brötchen', img: 'broetchen' },
    P: { name: 'Patty', img: 'patty' },
    So: { name: 'Soße', img: 'sosse' },
    G: { name: 'Gurken', img: 'gurken' },
    S: { name: 'Salat', img: 'salat' },
    Z: { name: 'Zwiebeln', img: 'zwiebeln' },
    K: { name: 'Käse', img: 'kaese' }
  };
  var LEGEND = ['b', 'P', 'So', 'G', 'S', 'Z', 'K'];
  /* Schichten von oben nach unten (Brötchen oben und unten), nach den Abbildungen im Heft */
  var LAYERS = {
    A: ['b', 'Z', 'G', 'S', 'K', 'So', 'P', 'b'],
    B: ['b', 'G', 'Z', 'K', 'So', 'P', 'S', 'b'],
    C: ['b', 'S', 'G', 'Z', 'So', 'K', 'P', 'b'],
    D: ['b', 'G', 'Z', 'S', 'K', 'So', 'P', 'b']
  };
  var KEYS = ['A', 'B', 'C', 'D'];
  var CORRECT = 'D';          /* offizielle Lösung (Heft S. 14) */
  var CONDS = [
    'Die Soße ist direkt auf dem Patty.',
    'Das Patty und der Käse liegen unter den Gurken, dem Salat und den Zwiebeln.',
    'Die Zwiebeln berühren nicht das Brötchen.'
  ];

  /* die drei Bedingungen für einen Burger prüfen (Index 0 = oben) */
  function checks(l) {
    var at = function (x) { return l.indexOf(x); };
    var zi = at('Z');
    return [
      at('So') === at('P') - 1,
      ['G', 'S', 'Z'].every(function (a) { return ['P', 'K'].every(function (u) { return at(a) < at(u); }); }),
      l[zi - 1] !== 'b' && l[zi + 1] !== 'b'
    ];
  }
  var WHY = {
    A: 'Die Soße liegt auf dem Patty und Patty und Käse liegen unten, aber die Zwiebeln berühren oben das Brötchen (Bedingung 3).',
    B: 'Die Soße liegt auf dem Patty, aber der Salat liegt unter dem Patty und dem Käse (Bedingung 2).',
    C: 'Der Käse liegt zwischen Soße und Patty, die Soße ist also nicht direkt auf dem Patty (Bedingung 1).',
    D: 'Alle drei Bedingungen sind erfüllt.'
  };

  function describe(k) {
    return LAYERS[k].map(function (x) { return ING[x].name; }).join(', ');
  }

  var el, api, locked, choice, notes, mark;
  var cards = {};

  function fresh() { choice = null; mark = null; notes = {}; KEYS.forEach(function (k) { notes[k] = [0, 0, 0]; }); }

  var NOTE_TXT = ['noch nicht geprüft', 'erfüllt', 'nicht erfüllt'];
  var NOTE_SYM = ['', ' ✓', ' ✗'];

  function refresh() {
    KEYS.forEach(function (k) {
      var c = cards[k];
      var on = choice === k;
      var cls = 't-burger22-card' + (on ? ' on' : '');
      var badge = '';
      if (mark === 'check' && on) { cls += k === CORRECT ? ' right' : ' wrong'; badge = k === CORRECT ? '✓' : '✗'; }
      else if (mark === 'solution' && k === CORRECT) { cls += ' right'; badge = '✓'; }
      c.root.className = cls;
      c.pick.setAttribute('aria-pressed', String(on));
      c.pick.disabled = !!locked;
      c.badge.textContent = badge;
      c.badge.hidden = !badge;
      c.chips.forEach(function (b, i) {
        var s = notes[k][i];
        b.className = 't-burger22-chip s' + s;
        b.textContent = (i + 1) + NOTE_SYM[s];
        b.setAttribute('aria-label', 'Notiz zu Burger ' + k + ', Bedingung ' + (i + 1) + ': ' + NOTE_TXT[s]);
        b.disabled = !!locked;
      });
    });
  }

  function build() {
    el.replaceChildren();
    cards = {};
    var grid = h('div', { class: 't-burger22-grid', role: 'group', 'aria-label': 'Burger zur Auswahl' });
    KEYS.forEach(function (k) {
      var badge = h('span', { class: 't-burger22-badge', 'aria-hidden': 'true', hidden: true });
      var pick = h('button', {
        type: 'button', class: 't-burger22-pick', 'aria-pressed': 'false',
        'aria-label': 'Burger ' + k + ' auswählen. Von oben nach unten: ' + describe(k),
        onclick: function () { if (locked) return; choice = k; refresh(); api.changed(); }
      }, h('span', { class: 't-burger22-letter' }, k),
      h('img', { src: IMG + 'burger_' + k + '.png', alt: '', width: 340, height: 508, draggable: 'false' }), badge);
      var chips = [0, 1, 2].map(function (i) {
        return h('button', {
          type: 'button', class: 't-burger22-chip s0', title: 'Bedingung ' + (i + 1) + ': ' + CONDS[i],
          onclick: function () { if (locked) return; notes[k][i] = (notes[k][i] + 1) % 3; refresh(); api.changed(); }
        }, String(i + 1));
      });
      var root = h('div', { class: 't-burger22-card' },
        pick,
        h('div', { class: 't-burger22-notes' }, h('span', { class: 't-burger22-nl' }, 'Notiz:'), chips));
      cards[k] = { root: root, pick: pick, badge: badge, chips: chips };
      grid.appendChild(root);
    });
    el.appendChild(grid);
    el.appendChild(h('p', { class: 't-burger22-hint' }, 'Tipp: Mit den Feldern 1, 2 und 3 unter jedem Burger kannst du dir merken, welche Bedingung er erfüllt (✓) oder nicht erfüllt (✗). Antippen wechselt die Markierung.'));
    refresh();
  }

  function story() {
    return '<p>Für Biber-Burger gibt es diese Zutaten:</p>' +
      '<ul class="t-burger22-legend">' + LEGEND.map(function (x) {
        return '<li><span class="t-burger22-ic"><img src="' + IMG + ING[x].img + '.png" alt="" width="200" height="' + { b: 203, P: 66, So: 59, G: 76, S: 110, Z: 60, K: 86 }[x] + '"></span><span>' + ING[x].name + '</span></li>';
      }).join('') + '</ul>' +
      '<p>Echte Biber-Burger erfüllen alle diese Bedingungen:</p>' +
      '<ol class="t-burger22-conds">' + CONDS.map(function (c) { return '<li>' + c + '</li>'; }).join('') + '</ol>';
  }

  Biber.register({
    id: 'burger22',
    story: story(),
    question: 'Nur einer dieser Burger ist ein echter Biber-Burger. Welcher?',
    howto: 'Tippe auf den Burger, den du für richtig hältst.',
    explanation: function () {
      return '<p>Man muss bei jedem Burger alle drei Bedingungen prüfen. Nur wenn keine einzige verletzt ist, ist er ein echter Biber-Burger.</p><ul class="t-burger22-why">' +
        KEYS.map(function (k) {
          var c = checks(LAYERS[k]);
          return '<li><strong>Burger ' + k + (k === CORRECT ? ' (richtig)' : '') + ':</strong> ' +
            c.map(function (v, i) { return (i + 1) + (v ? ' ✓' : ' ✗'); }).join(' · ') + '. ' + WHY[k] + '</li>';
        }).join('') + '</ul>' +
        '<p>Bedingungen wie diese prüft ein Computer mit „wenn …“-Anweisungen. Schwerer ist es, unter vielen möglichen Burgern einen zu <em>finden</em>, der viele Bedingungen gleichzeitig erfüllt. Solche Aufgaben heißen Bedingungserfüllungsprobleme (Constraint Satisfaction Problems); auch Sudokus gehören dazu.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; fresh(); build();
    },
    isComplete: function () { return choice !== null; },
    evaluate: function () {
      return { correct: choice === CORRECT, answer: { choice: choice, notes: JSON.parse(JSON.stringify(notes)) } };
    },
    setAnswer: function (ans) {
      choice = ans && ans.choice || null;
      KEYS.forEach(function (k) { notes[k] = (ans && ans.notes && ans.notes[k]) ? ans.notes[k].slice(0, 3) : [0, 0, 0]; });
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      if (on && mark !== 'solution') mark = 'check';
      if (!on) mark = null;
      refresh();
    },
    reset: function () { fresh(); refresh(); },
    showSolution: function () { choice = CORRECT; mark = 'solution'; refresh(); }
  });
})();
