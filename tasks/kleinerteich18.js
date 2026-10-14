/* Aufgabe Kleiner Teich (Biber 2018, Seite 43): Breitensuche in einem zusammenhängenden Gebiet; Antwort ist eine Zahl */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-kleinerteich18';
  var ASSET = 'assets/kleinerteich18/';
  var RIGHT = 6;   /* laut Heft */

  var el, api, locked, value, mark, input, hint;

  function parse(v) {
    var t = String(v).trim();
    return /^\d{1,2}$/.test(t) ? parseInt(t, 10) : null;
  }
  function reset() { value = null; mark = null; }
  function render() {
    input.value = value === null ? '' : String(value);
    input.disabled = !!locked;
    var ok = value === RIGHT;
    input.className = P + '-in' + (mark === 'check' ? (ok ? ' right' : ' wrong') : '') + (mark === 'solution' ? ' right' : '');
    hint.textContent = mark === 'check' ? (ok ? '✓ richtig' : '✗ nicht richtig') : '';
    hint.className = P + '-hint' + (mark === 'check' ? (ok ? ' ok' : ' bad') : '');
  }
  function fig(src, cap, alt) {
    return h('figure', { class: P + '-fig' },
      h('img', { src: ASSET + src, alt: alt, width: 700, height: src === 'tal.png' ? 621 : 610, draggable: 'false' }),
      h('figcaption', null, cap));
  }

  Biber.register({
    id: 'kleinerteich18',
    story: '<p>In einem Tal liegt ein kleiner Teich. Er ist umgeben von Landstücken mit Wald oder mit Felsen. Im Teich leben einige Biber.</p>' +
      '<p>Eines Tages wird den Bibern der Teich zu klein, und nun fluten sie den Wald. An jedem Tag fluten sie alle Waldstücke, die an bereits geflutete Waldstücke angrenzen. Nach einem Tag sind drei Waldstücke geflutet.</p>',
    question: 'Nach wie vielen Tagen sind alle Waldstücke geflutet?',
    howto: 'Schau dir die beiden Bilder genau an und gib die Zahl der Tage ein. Waldstücke sind grün, Felsen sind grau.',
    explanation: function () {
      return '<p>Die richtige Antwort ist <strong>6</strong>. Im Bild sind die Waldstücke nach dem Tag nummeriert, an dem sie geflutet werden: Die Waldstücke am See sind nach einem Tag dran (Zahl 1). Die Waldstücke, die an diese angrenzen, sind nach zwei Tagen geflutet (Zahl 2), und so weiter. Die größte Zahl ist die 6. Nach sechs Tagen ist also das letzte Waldstück geflutet.</p>' +
        '<figure class="' + P + '-fig ' + P + '-sol"><img src="' + ASSET + 'loesung.png" width="760" height="668" alt="Der Teich mit Waldstücken. Jedes Waldstück trägt die Zahl des Tages, an dem es geflutet wird: dreimal 1, sechsmal 2, viermal 3, dann 4, 5 und 6."></figure>' +
        '<p><em>Informatik:</em> Das geflutete Gebiet ist ein zusammenhängendes Gebiet: Von jedem Stück kommt man über benachbarte Stücke zu jedem anderen. Solche Gebiete findet man auch sonst, zum Beispiel einfarbige Bereiche in einem Computerbild oder Gruppen von Freunden. Mit der Breitensuche (Schicht für Schicht, wie das Fluten) oder der Tiefensuche kann der Computer zusammenhängende Gebiete finden und zum Beispiel umfärben.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      input = h('input', {
        type: 'text', inputmode: 'numeric', pattern: '[0-9]*', maxlength: '2', autocomplete: 'off', id: P + '-input', class: P + '-in',
        oninput: function () {
          var t = input.value.replace(/[^0-9]/g, '').slice(0, 2);
          if (t !== input.value) input.value = t;
          value = parse(t);
          api.changed();
        }
      });
      hint = h('span', { class: P + '-hint', 'aria-live': 'polite' });
      el.replaceChildren(h('div', { class: P + '-board' },
        h('div', { class: P + '-figs' },
          fig('tal.png', 'Teich im Tal', 'Der Teich mit einem Biber in der Mitte. Rundherum liegen grüne Waldstücke mit Bäumen und graue Felsstücke.'),
          fig('tag1.png', 'Nach einem Tag', 'Dasselbe Tal nach einem Tag: Der Teich ist größer, drei Waldstücke direkt am Teich sind geflutet und blau.')),
        h('div', { class: P + '-ans' },
          h('label', { for: P + '-input' }, 'Alle Waldstücke sind geflutet nach'),
          input, h('span', null, 'Tagen'), hint)));
      render();
    },
    isComplete: function () { return value !== null; },
    evaluate: function () { return { correct: value === RIGHT, answer: { n: value } }; },
    setAnswer: function (ans) {
      value = ans && typeof ans.n === 'number' ? ans.n : null;
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      value = RIGHT; mark = 'solution'; locked = true;
      render();
    }
  });
})();
