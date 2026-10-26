/* Aufgabe Gartentor (Heft 2017, Klasse 3-4 mittel, 5-6 einfach): Wie viele weitere Nachrichten sind mit bis zu drei Holzstäben möglich? */
(function () {
  'use strict';
  var h = Biber.h, sv = Biber.svg;
  var P = 't-gartentor17-';

  var ANSWER = 4;
  var ROWS = [30, 50, 70];                 /* Höhe der drei Bohrloch-Paare: oben, Mitte, unten */
  var ROW_NAME = ['oberer', 'mittlerer', 'unterer'];

  /* Die vier verabredeten Nachrichten laut Heft: [oben, Mitte, unten] */
  var KNOWN = [
    { mask: [0, 0, 0], text: 'Wir sind da, kommt doch rein.' },
    { mask: [0, 0, 1], text: 'Wir werden schon mittags zurück sein.' },
    { mask: [1, 0, 0], text: 'Wir sind leider erst am Abend wieder da.' },
    { mask: [1, 1, 1], text: 'Wir besuchen jemand und kommen um Mitternacht heim.' }
  ];
  function key(m) { return m.join(''); }
  var KNOWN_BY_KEY = {};
  KNOWN.forEach(function (k) { KNOWN_BY_KEY[key(k.mask)] = k; });

  /* alle 8 Nachrichten, in der Reihenfolge des Heftes (erst Zeile 1, dann Zeile 2) */
  var ALL = [[0, 0, 0], [0, 0, 1], [0, 1, 0], [0, 1, 1], [1, 0, 0], [1, 0, 1], [1, 1, 0], [1, 1, 1]];

  function describe(m) {
    var n = m.reduce(function (a, b) { return a + b; }, 0);
    if (!n) return 'kein Holzstab';
    var names = [];
    m.forEach(function (v, i) { if (v) names.push(ROW_NAME[i]); });
    return n + (n === 1 ? ' Holzstab' : ' Holzstäbe') + ' (' + names.join(', ') + ')';
  }

  function gate(mask, cls, label, clickable) {
    var kids = [];
    var stone = 'M14 12 Q34 2 48 13 Q58 50 47 88 Q30 99 14 87 Q5 50 14 12Z';
    kids.push(sv('path', { d: stone, class: P + 'stone' }));
    kids.push(sv('path', { d: stone, class: P + 'stone', transform: 'translate(240 0) scale(-1 1)' }));
    ROWS.forEach(function (y) {
      kids.push(sv('ellipse', { cx: 30, cy: y, rx: 3.6, ry: 4.6, class: P + 'hole' }));
      kids.push(sv('ellipse', { cx: 210, cy: y, rx: 3.6, ry: 4.6, class: P + 'hole' }));
    });
    ROWS.forEach(function (y, i) {
      if (mask[i]) {
        kids.push(sv('path', { d: 'M28 ' + y + ' L212 ' + y, class: P + 'stick' }));
        kids.push(sv('path', { d: 'M150 ' + y + ' l9 -6', class: P + 'twig' }));
      }
    });
    if (clickable) {
      ROWS.forEach(function (y, i) {
        kids.push(sv('rect', { x: 16, y: y - 9, width: 208, height: 18, class: P + 'hit', 'data-row': String(i) }));
      });
    }
    return sv.apply(null, ['svg', { viewBox: '0 0 240 100', class: cls, role: 'img', 'aria-label': label, focusable: 'false' }].concat(kids));
  }

  var el, api, locked, value, mark, play, input, status, playBox;
  function reset() { value = ''; mark = null; play = [0, 0, 0]; }

  function playStatus() {
    var k = KNOWN_BY_KEY[key(play)];
    return k ? 'Diese Nachricht ist schon verabredet: „' + k.text + '“' : 'Diese Nachricht ist noch nicht verabredet.';
  }
  function renderPlay() {
    var svg = gate(play, P + 'gate', 'Gartentor mit ' + describe(play), true);
    var btns = ROWS.map(function (y, i) {
      return h('button', {
        type: 'button', class: P + 'tog' + (play[i] ? ' on' : ''), 'data-tog': String(i), 'aria-pressed': String(!!play[i]),
        'aria-label': ['Oberen', 'Mittleren', 'Unteren'][i] + ' Holzstab ' + (play[i] ? 'entfernen' : 'stecken'), disabled: locked
      }, ['oben', 'Mitte', 'unten'][i]);
    });
    status = h('p', { class: P + 'status', 'aria-live': 'polite' }, playStatus());
    playBox.replaceChildren(svg, h('div', { class: P + 'togs', role: 'group', 'aria-label': 'Holzstäbe stecken oder entfernen' }, btns), status);
  }

  function renderInput() {
    var cls = P + 'in';
    var badge = null;
    if (mark === 'check') {
      var ok = Number(String(value).trim()) === ANSWER && String(value).trim() !== '';
      cls += ok ? ' right' : ' wrong';
      badge = h('span', { class: P + 'mark ' + (ok ? 'ok' : 'bad'), 'aria-hidden': 'true' }, ok ? '✓' : '✗');
    } else if (mark === 'solution') cls += ' right';
    input = h('input', {
      type: 'text', inputmode: 'numeric', pattern: '[0-9]*', autocomplete: 'off', class: cls, maxlength: '3', value: String(value),
      'aria-label': 'Anzahl der weiteren Nachrichten', disabled: locked, id: P + 'num'
    });
    input.addEventListener('input', function () {
      value = input.value.replace(/[^0-9]/g, '');
      if (value !== input.value) input.value = value;
      api.changed();
    });
    return h('div', { class: P + 'answer' }, h('label', { for: P + 'num' }, 'Anzahl:'), input, badge);
  }

  function render() {
    playBox = h('div', { class: P + 'play' });
    var known = KNOWN.map(function (k) {
      return h('figure', { class: P + 'msg' }, gate(k.mask, P + 'gate', 'Gartentor mit ' + describe(k.mask)), h('figcaption', null, k.text));
    });
    el.replaceChildren(h('div', { class: P + 'board' },
      h('img', { class: P + 'scene', src: 'assets/gartentor17/szene.png', width: 640, height: 448, alt: 'Ein Biberbau hinter einem Zaun. Im Gartentor aus zwei Steinplatten stecken drei Holzstäbe.' }),
      h('section', { 'aria-label': 'Die vier verabredeten Nachrichten' },
        h('h3', null, 'Die vier verabredeten Nachrichten'),
        h('div', { class: P + 'known' }, known)),
      h('section', { 'aria-label': 'Zum Ausprobieren' },
        h('h3', null, 'Zum Ausprobieren'),
        h('p', { class: P + 'hint' }, 'Stecke Holzstäbe in das Gartentor. Die Anzeige verrät, ob die Nachricht schon verabredet ist.'),
        playBox),
      renderInput()));
    renderPlay();
  }

  function onClick(e) {
    if (locked) return;
    var t = e.target.closest('[data-tog],[data-row]');
    if (!t) return;
    var i = +(t.dataset.tog !== undefined ? t.dataset.tog : t.dataset.row);
    play[i] = play[i] ? 0 : 1;
    renderPlay();
    var b = el.querySelector('[data-tog="' + i + '"]');
    if (b && t.dataset.tog !== undefined) b.focus();
  }

  Biber.register({
    id: 'gartentor17',
    story: '<p>Die Biber besuchen einander oft. Aber … manchmal ist man nicht zu Hause. Dann hinterlässt man an seinem Steinplatten-Gartentor eine Nachricht, wann man ungefähr wieder da ist.</p>' +
      '<p>Dazu steckt man bis zu drei Holzstäbe gerade zwischen gegenüberliegende Bohrlöcher der Steinplatten. Die Biber haben die vier Gartentor-Nachrichten unten miteinander verabredet. Sie könnten noch weitere Nachrichten verabreden, ohne zusätzliche Holzstäbe oder Bohrlöcher zu verwenden.</p>',
    question: 'Wie viele weitere Nachrichten könnten sie noch verabreden?',
    howto: 'Tippe die Zahl ein. Mit „Zum Ausprobieren“ kannst du Holzstäbe stecken und sehen, welche Nachrichten es gibt.',
    explanation: function () {
      var items = ALL.map(function (m) {
        var k = KNOWN_BY_KEY[key(m)];
        return '<figure class="' + P + 'msg ' + (k ? 'old' : 'new') + '">' + gate(m, P + 'gate', 'Gartentor mit ' + describe(m)).outerHTML +
          '<figcaption>' + (k ? 'schon verabredet' : '<strong>neu</strong>') + '</figcaption></figure>';
      }).join('');
      return '<p>Jedes der drei Bohrloch-Paare hat zwei Zustände: Holzstab gesteckt oder nicht gesteckt. Das ergibt 2 · 2 · 2 = 8 verschiedene Nachrichten. Vier davon sind schon verabredet, also bleiben <strong>4</strong> weitere übrig.</p>' +
        '<div class="' + P + 'all">' + items + '</div>' +
        '<p>Das ist ein dreistelliges binäres Zeichensystem: Jedes Bohrloch-Paar ist eine „Stelle“ (ein Bit) mit den Werten „gesteckt“ oder „nicht gesteckt“. Mit n Stellen gibt es 2<sup>n</sup> verschiedene Nachrichten. Damit sich alle Computer der Welt gut verstehen, werden Zeichensysteme genau festgelegt und genormt.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      render();
    },
    isComplete: function () { return String(value).trim() !== ''; },
    evaluate: function () {
      var v = String(value).trim();
      return { correct: v !== '' && Number(v) === ANSWER, answer: { value: v } };
    },
    setAnswer: function (ans) {
      value = ans && ans.value != null ? String(ans.value) : '';
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? 'check' : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      value = String(ANSWER); mark = 'solution'; locked = true;
      render();
    }
  });
})();
