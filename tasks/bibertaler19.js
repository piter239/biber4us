/* Aufgabe Bibertaler (Biber-Heft 2019, Klasse 3-4 einfach, 5-6 einfach): 13 Bibertaler mit möglichst wenigen Münzen (Binärsystem) */
(function () {
  'use strict';
  var h = Biber.h, S = Biber.svg;

  var TARGET = 13, VALUES = [1, 2, 4, 8, 16], SLOTS = 16;
  var SOLUTION = [8, 4, 1];
  /* Lage der Münzen im Beutel (Mitte in Prozent der Beutelfläche), wie im Heft: Kreuzform */
  var POS = { 1: [50.8, 34.8], 2: [28.2, 61.7], 4: [50.8, 61.7], 8: [73.8, 61.7], 16: [50.8, 86.1] };

  /* Kleinste Münzzahl für TARGET und alle Münzmengen, die sie erreichen (zur Absicherung der Wertung) */
  var MIN = (function () {
    var best = [];
    (function rec(i, left, cur) {
      if (left === 0) { best.push(cur.slice()); return; }
      if (i < 0) return;
      for (var n = 0; n * VALUES[i] <= left; n++) {
        var add = []; for (var k = 0; k < n; k++) add.push(VALUES[i]);
        rec(i - 1, left - n * VALUES[i], cur.concat(add));
      }
    })(VALUES.length - 1, TARGET, []);
    var m = Math.min.apply(null, best.map(function (b) { return b.length; }));
    return best.filter(function (b) { return b.length === m; }).map(function (b) { return b.sort(function (x, y) { return y - x; }); });
  })();
  var SOL_KEY = SOLUTION.join(',');
  if (MIN.length !== 1 || MIN[0].join(',') !== SOL_KEY) SOL_KEY = MIN[0].join(',');

  var el, api, coins, locked, mode, solShown; /* mode: null | 'check' */

  function reset() { coins = []; mode = null; solShown = false; }
  function sum() { return coins.reduce(function (a, b) { return a + b; }, 0); }
  function key() { return coins.slice().sort(function (a, b) { return b - a; }).join(','); }
  function isRight() { return key() === SOL_KEY; }

  function coin(v, cls) { return h('span', { class: 't-bibertaler19-coin' + (cls ? ' ' + cls : '') }, h('span', null, String(v))); }

  function bagSvg() {
    return S('svg', { class: 't-bibertaler19-bagsvg', viewBox: '0 0 340 330', 'aria-hidden': 'true', focusable: 'false' },
      S('path', { class: 't-bibertaler19-bagshape', d: 'M170 62 C150 56 118 44 100 12 C140 2 162 26 170 58 C178 26 200 2 240 12 C222 44 190 56 170 62 Z' }),
      S('path', { class: 't-bibertaler19-bagshape', d: 'M170 60 C60 78 4 180 12 250 C20 312 120 324 170 324 C230 324 324 314 330 250 C338 180 280 78 170 60 Z' }));
  }

  function render() {
    var bag = h('div', { class: 't-bibertaler19-bag' }, bagSvg(),
      VALUES.map(function (v) {
        return h('button', {
          type: 'button', class: 't-bibertaler19-src', 'data-add': String(v), disabled: locked || coins.length >= SLOTS,
          'aria-label': v + ' Bibertaler: Münze zum Bezahlen legen',
          style: 'left:' + POS[v][0] + '%;top:' + POS[v][1] + '%'
        }, coin(v));
      }));
    var slots = [];
    for (var i = 0; i < SLOTS; i++) {
      if (i < coins.length) {
        slots.push(h('button', {
          type: 'button', class: 't-bibertaler19-slot full', 'data-rm': String(i), disabled: locked,
          'aria-label': coins[i] + ' Bibertaler, antippen zum Zurücklegen'
        }, coin(coins[i])));
      } else slots.push(h('span', { class: 't-bibertaler19-slot', 'aria-hidden': 'true' }));
    }
    var cls = 't-bibertaler19-tray', mark = null;
    if (mode === 'check') {
      cls += isRight() ? ' right' : ' wrong';
      mark = h('span', { class: 't-bibertaler19-mark', 'aria-hidden': 'true' }, isRight() ? '✓' : '✗');
    }
    el.replaceChildren(h('div', { class: 't-bibertaler19-board' },
      h('section', { 'aria-label': 'Beutel mit Münzen' },
        h('h3', null, 'Beutel (antippen = Münze nehmen)'), bag),
      h('section', { 'aria-label': 'Bezahlte Münzen' },
        h('h3', null, 'Münzen zum Bezahlen (antippen = zurücklegen)'),
        h('div', { class: cls }, h('div', { class: 't-bibertaler19-slots' }, slots), mark),
        h('p', { class: 't-bibertaler19-sr', role: 'status', 'aria-live': 'polite' },
          coins.length ? 'Gelegt: ' + coins.join(', ') + '.' : 'Noch keine Münze gelegt.'))));
  }

  function onClick(e) {
    if (locked) return;
    var t = e.target.closest('[data-add],[data-rm]');
    if (!t) return;
    var focusAdd = null;
    if (t.dataset.add) {
      if (coins.length >= SLOTS) return;
      coins.push(+t.dataset.add);
      focusAdd = t.dataset.add;
    } else coins.splice(+t.dataset.rm, 1);
    mode = null;
    render();
    if (focusAdd) { var b = el.querySelector('[data-add="' + focusAdd + '"]'); if (b && !b.disabled) b.focus(); }
    else { var f = el.querySelector('.t-bibertaler19-slot.full') || el.querySelector('[data-add="1"]'); if (f) f.focus(); }
    api.changed(coins.length ? coins.length + (coins.length === 1 ? ' Münze gelegt.' : ' Münzen gelegt.') : '');
  }

  Biber.register({
    id: 'bibertaler19',
    story: '<p>Bibertaler gibt es nur als Münzen, und zwar <strong>1, 2, 4, 8 und 16</strong> Bibertaler. Die Biber bezahlen immer den genauen Betrag, mit so wenigen Münzen wie möglich.</p>' +
      '<p>Ein Biber kauft Holz und muss <strong>13 Bibertaler</strong> bezahlen.</p>',
    question: 'Mit welchen Münzen bezahlt der Biber?',
    howto: 'Tippe im Beutel auf die Münzen, die der Biber bezahlt. Sie liegen dann unten auf dem Tablett. Eine Münze auf dem Tablett kannst Du antippen, um sie zurückzulegen.',
    explanation: function () {
      var extra = '';
      if (!solShown && coins.length && !isRight()) {
        var s = sum();
        if (s !== TARGET) extra = '<p>Deine Münzen ergeben ' + s + ' Bibertaler, gefragt waren aber genau 13.</p>';
        else extra = '<p>Deine Münzen ergeben zwar genau 13 Bibertaler, aber es geht mit weniger Münzen.</p>';
      }
      return extra + '<p>Der Biber bezahlt mit den Münzen <strong>8, 4 und 1</strong>, denn 8 + 4 + 1 = 13. Mit zwei Münzen geht es nicht: Die einzige Paarung, die mindestens 13 ergibt, sind zwei 8er mit 16, und das ist zu viel. Eine einzelne Münze ergibt 13 auch nicht.</p>' +
        '<p>Die Münzen 1, 2, 4, 8 und 16 sind die Stellenwerte des Zweiersystems (Binärsystem). Jede Zahl lässt sich darin auf genau eine Weise darstellen: Jeder Stellenwert wird entweder benutzt (1) oder nicht (0). 13 ist 8 + 4 + 1, also 01101. Computerspeicher besteht aus Bausteinen mit zwei Zuständen (Bits), deshalb ist das Zweiersystem in der Informatik so wichtig.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      render();
    },
    isComplete: function () { return coins.length > 0; },
    evaluate: function () { return { correct: isRight(), answer: coins.slice().sort(function (x, y) { return y - x; }) }; },
    setAnswer: function (ans) {
      coins = (Array.isArray(ans) ? ans : []).filter(function (v) { return VALUES.indexOf(v) >= 0; }).slice(0, SLOTS);
      solShown = false;
      mode = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      if (on) { if (!solShown) mode = 'check'; } else mode = null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      coins = SOLUTION.slice();
      solShown = true;
      mode = 'check';
      locked = true;
      render();
    }
  });
})();
