/* Aufgabe Emils Münzen (Heft 2021, S. 21; Klasse 5-6 mittel, 7-8 einfach): Münzarten zählen (Abstraktion: beide Seiten einer Münze sind dieselbe Art) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-muenzen21-';

  /* Münzarten (Reihenfolge wie im Heft): grün/gelb, blau/rot, orange, lila */
  var KINDS = ['grün-gelb', 'blau-rot', 'orange', 'lila'];
  /* Anzahl je Art, abgelesen aus den Bildern und mit der Tabelle im Heft (S. 22) abgeglichen */
  var COUNTS = {
    E: [4, 2, 1, 1],
    A: [3, 3, 1, 1],
    B: [4, 1, 2, 1],
    C: [4, 2, 1, 1],
    D: [2, 4, 1, 1]
  };
  var KEYS = ['A', 'B', 'C', 'D'];
  var RIGHT = 2;   /* C: nur Tüte C hat dieselbe Anzahl je Münzart wie Emils Tüte (im Heft bestätigt, per Skript geprüft) */

  var el, api, radios, selected, locked, mark;

  function reset() { selected = null; mark = null; }

  function refresh() {
    radios.forEach(function (btn, i) {
      var on = selected === i, ok = i === RIGHT;
      btn.setAttribute('aria-checked', String(on));
      btn.tabIndex = (selected === null ? i === 0 : on) ? 0 : -1;
      btn.setAttribute('aria-disabled', locked ? 'true' : 'false');
      btn.classList.toggle('selected', on);
      btn.classList.toggle('right', on && mark !== null && ok);
      btn.classList.toggle('wrong', on && mark === 'check' && !ok);
      var m = btn.querySelector('.' + P + 'mark');
      if (m) m.remove();
      if (on && mark !== null) btn.appendChild(h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
    });
  }
  function choose(i, focus) {
    if (locked) return;
    selected = i;
    refresh();
    if (focus) radios[i].focus();
    api.changed();
  }
  function onKey(e) {
    var k = e.key, i = radios.indexOf(e.currentTarget), to = null;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % radios.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + radios.length - 1) % radios.length;
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }

  function tableHtml() {
    var head = '<tr><th scope="col"></th>' + KINDS.map(function (k) { return '<th scope="col">' + k + '</th>'; }).join('') + '</tr>';
    var rows = ['E'].concat(KEYS).map(function (k) {
      var name = k === 'E' ? 'Emils Tüte' : 'Tüte ' + k;
      var hit = k === 'E' || KEYS.indexOf(k) === RIGHT;
      return '<tr' + (hit ? ' class="' + P + 'hit"' : '') + '><th scope="row">' + name + '</th>' +
        COUNTS[k].map(function (n) { return '<td>' + n + '</td>'; }).join('') + '</tr>';
    }).join('');
    return '<table class="' + P + 'table"><caption>Anzahl der Münzen jeder Art</caption><thead>' + head + '</thead><tbody>' + rows + '</tbody></table>';
  }

  Biber.register({
    id: 'muenzen21',
    story:
      '<p>In einem Spiel gibt es vier Arten von Münzen. Jede Münze hat zwei Seiten, die du im Bild siehst: ' +
      'Die Münzart <em>grün-gelb</em> hat eine grüne und eine gelbe Seite, die Art <em>blau-rot</em> eine blaue und eine rote Seite, ' +
      'die orange Münze ist auf beiden Seiten orange und die lila Münze auf beiden Seiten lila.</p>' +
      '<p>Emil hat einige Münzen in eine Tüte getan. Nun schüttelt er seine Tüte. Manche Münzen drehen sich. Emil erkennt seine Tüte trotzdem wieder.</p>',
    question: 'Welche ist Emils Tüte?',
    howto: 'Tippe auf die Tüte, die Emils Tüte sein könnte. Achte darauf, dass sich beim Schütteln Münzen auf die andere Seite drehen.',
    explanation: function () {
      return '<p>Beim Schütteln drehen sich Münzen, aber ihre <strong>Art</strong> ändert sich nicht: Aus einer grünen Seite wird die gelbe Seite derselben Münze. ' +
        'Deshalb zählt man, wie viele Münzen von jeder Art in der Tüte sind. Emil hat 4 grün-gelbe, 2 blau-rote, 1 orange und 1 lila Münze.</p>' +
        tableHtml() +
        '<p>Nur <strong>Tüte C</strong> hat von jeder Art genau gleich viele Münzen wie Emils Tüte.</p>' +
        '<p>In der Informatik nennt man das <em>Abstraktion</em>: Man lässt Unwichtiges weg (hier: welche Seite oben liegt) und betrachtet nur das, was wirklich zählt (die Art der Münze).</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      radios = KEYS.map(function (k, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': k,
          'aria-label': 'Tüte ' + k,
          onclick: function () { choose(i, false); }, onkeydown: onKey
        },
          h('span', { class: P + 'key', 'aria-hidden': 'true' }, k + ')'),
          h('img', { src: 'assets/muenzen21/tuete-' + k.toLowerCase() + '.png', alt: 'Tüte ' + k + ' mit Münzen in verschiedenen Farben', width: 360, height: 461, draggable: 'false' }));
        return btn;
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('div', { class: P + 'top' },
          h('section', { 'aria-label': 'Die vier Münzarten' },
            h('h3', null, 'Die vier Münzarten'),
            h('div', { class: P + 'paper' }, h('img', { src: 'assets/muenzen21/arten.png', width: 640, height: 290, draggable: 'false',
              alt: 'Vier Münzarten, jeweils mit beiden Seiten: grün mit schwarzem Stern und gelb mit Schneeflocke; blau mit schwarzem Punkt und rot mit Blüte; orange mit Kleeblatt auf beiden Seiten; lila mit Herz auf beiden Seiten.' }))),
          h('section', { 'aria-label': 'Emils Tüte' },
            h('h3', null, 'Emils Tüte'),
            h('div', { class: P + 'emil' }, h('img', { src: 'assets/muenzen21/emil.png', width: 360, height: 459, draggable: 'false',
              alt: 'Emils Tüte mit acht Münzen: drei grüne mit Stern, eine gelbe mit Schneeflocke, eine blaue mit Punkt, eine rote mit Blüte, eine orange mit Kleeblatt und eine lila mit Herz.' })))),
        h('section', { 'aria-label': 'Antworten' },
          h('h3', null, 'Welche ist Emils Tüte?'),
          h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Tüten A bis D' }, radios))));
      refresh();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () {
      return { correct: selected === RIGHT, answer: { choice: KEYS[selected] } };
    },
    setAnswer: function (ans) {
      var i = KEYS.indexOf(ans && ans.choice);
      selected = i >= 0 ? i : null;
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      refresh();
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () { selected = RIGHT; mark = 'solution'; locked = true; refresh(); }
  });
})();
