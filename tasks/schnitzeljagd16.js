/* Aufgabe Vegetarische Schnitzeljagd (Heft 2016, Klasse 3-4 schwer, 5-6 mittel): Datenstrukturen, einfach verkettete Liste */
(function () {
  'use strict';
  var h = Biber.h;
  var A = 'assets/schnitzeljagd16/';

  var ITEMS = {
    apfel: { name: 'Apfel', img: 'apfel.png', w: 220, hgt: 220 },
    mais: { name: 'Mais', img: 'mais.png', w: 197, hgt: 220 },
    kraut: { name: 'Löwenzahn', img: 'loewenzahn.png', w: 220, hgt: 218 },
    ast: { name: 'Ast', img: 'ast.png', w: 180, hgt: 220 },
    ruebe: { name: 'Rübe', img: 'ruebe.png', w: 143, hgt: 220 }
  };
  /* Antworten A bis E wie im Heft */
  var ORDER = ['apfel', 'mais', 'kraut', 'ast', 'ruebe'];
  /* Schild bei Zutat X zeigt auf die Zutat, die danach kommt */
  var NEXT = { ruebe: 'apfel', apfel: 'mais', mais: 'kraut', kraut: 'ast' };
  var RIGHT = 'ruebe';

  function chain() {
    var pointed = {};
    Object.keys(NEXT).forEach(function (k) { pointed[NEXT[k]] = true; });
    var first = ORDER.filter(function (k) { return !pointed[k]; });
    if (first.length !== 1) throw new Error('schnitzeljagd16: Anfang nicht eindeutig');
    var out = [first[0]];
    while (NEXT[out[out.length - 1]]) out.push(NEXT[out[out.length - 1]]);
    return out;
  }

  function pic(k, cls) {
    var it = ITEMS[k];
    return h('img', { class: cls || 't-schnitzeljagd16-pic', src: A + it.img, alt: '', width: it.w, height: it.hgt, draggable: 'false' });
  }

  var el, api, locked, picked, mode, optsEl;

  function optionCard(k, idx) {
    var sel = picked === k;
    var cls = 't-schnitzeljagd16-opt';
    var mark = '';
    if (mode && (mode === 'solution' ? k === RIGHT : sel)) {
      var ok = k === RIGHT;
      cls += ok ? ' right' : ' wrong';
      mark = ok ? '✓' : '✗';
    }
    var input = h('input', { type: 'radio', name: 't-schnitzeljagd16-opt', value: k, disabled: locked,
      'aria-label': 'Antwort ' + 'ABCDE'[idx] + ': ' + ITEMS[k].name });
    input.checked = sel;
    return h('label', { class: cls }, input,
      h('span', { class: 't-schnitzeljagd16-let' }, 'ABCDE'[idx] + ')'),
      h('span', { class: 't-schnitzeljagd16-card' },
        h('span', { class: 't-schnitzeljagd16-icon' }, pic(k)),
        mark ? h('span', { class: 't-schnitzeljagd16-mark', 'aria-hidden': 'true' }, mark) : null));
  }
  function renderOpts() { optsEl.replaceChildren.apply(optsEl, ORDER.map(optionCard)); }

  function onChange(e) {
    if (locked || !e.target.matches('input[type=radio]')) return;
    picked = e.target.value;
    renderOpts();
    var f = optsEl.querySelector('input:checked'); if (f) f.focus();
    api.changed('Antwort ' + 'ABCDE'[ORDER.indexOf(picked)] + ' gewählt.');
  }

  var GARDEN_ALT = 'Gartenplan von oben mit Weg, Teich, Beeten und Bäumen. Bei vier Zutaten steht ein Holzschild mit einem Bild: ' +
    'beim Apfel (links neben dem Teich) ein Schild mit Mais, bei der Rübe (im Beet unten in der Mitte) ein Schild mit einem Apfel, ' +
    'beim Mais (Beet oben rechts) ein Schild mit Löwenzahn und beim Löwenzahn (rechts) ein Schild mit einem Ast. Der Ast liegt oben im Garten und hat kein Schild.';

  function chainHtml() {
    var c = chain();
    var parts = c.map(function (k, i) {
      return '<li><span class="t-schnitzeljagd16-cimg"><img src="' + A + ITEMS[k].img + '" alt="" width="' + Math.round(ITEMS[k].w / 4) + '" height="' + Math.round(ITEMS[k].hgt / 4) + '"></span>' +
        '<span class="t-schnitzeljagd16-cname">' + (i + 1) + '. ' + ITEMS[k].name + '</span></li>';
    }).join('');
    return '<ol class="t-schnitzeljagd16-chain" aria-label="Reihenfolge: ' + c.map(function (k) { return ITEMS[k].name; }).join(', dann ') + '">' + parts + '</ol>';
  }

  Biber.register({
    id: 'schnitzeljagd16',
    story: '<p>Biber Kati möchte einen Bibersalat machen. Kati muss fünf Zutaten in die Schüssel tun.</p>' +
      '<p>Im Garten findet Kati die Zutaten. Bei jeder Zutat zeigt ein Schild, welche Zutat sie als <b>nächste</b> in die Schüssel tun muss. ' +
      'Zum Beispiel muss sie nach dem Apfel den Mais in die Schüssel tun.</p>' +
      '<p class="t-schnitzeljagd16-fig"><a href="' + A + 'garten.png" target="_blank" rel="noopener" title="Bild in Originalgröße öffnen">' +
      '<img class="t-schnitzeljagd16-garden" src="' + A + 'garten.png" width="1100" height="733" alt="' + GARDEN_ALT + '"></a>' +
      '<span class="t-schnitzeljagd16-zoom">Bild antippen, um es größer zu sehen</span></p>',
    question: 'Welche Zutat muss Kati als erste in die Schüssel tun?',
    howto: 'Tippe auf die richtige Zutat.',
    explanation: function () {
      return '<p>Kati muss mit der <b>Rübe</b> anfangen. Die erste Zutat ist nämlich die einzige, auf die kein Schild zeigt – sonst müsste ja noch eine andere Zutat vor ihr in die Schüssel. ' +
        'Beim Apfel zum Beispiel würde das nicht gehen, denn er steht auf dem Schild bei der Rübe.</p>' +
        chainHtml() +
        '<p><b>Informatik:</b> Das ist eine <i>einfach verkettete Liste</i>. Jedes Listenelement (hier: eine Zutat) hat einen Zeiger (hier: das Schild) auf seinen Nachfolger. ' +
        'Das letzte Element hat keinen Nachfolger und daher kein Schild. Das erste Element erkennt man daran, dass kein Zeiger auf es zeigt.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null;
      optsEl = h('div', { class: 't-schnitzeljagd16-opts', role: 'radiogroup', 'aria-label': 'Antworten' });
      el.replaceChildren(h('div', { class: 't-schnitzeljagd16-box' }, optsEl));
      optsEl.addEventListener('change', onChange);
      renderOpts();
    },
    isComplete: function () { return picked !== null; },
    evaluate: function () { return { correct: picked === RIGHT, answer: picked ? 'ABCDE'[ORDER.indexOf(picked)] : null }; },
    setAnswer: function (ans) {
      var i = 'ABCDE'.indexOf(ans);
      picked = i >= 0 && typeof ans === 'string' && ans.length === 1 ? ORDER[i] : null;
      mode = 'check'; renderOpts();
    },
    lock: function (on) { locked = on; mode = on ? (mode || 'check') : null; renderOpts(); },
    reset: function () { picked = null; mode = null; renderOpts(); },
    showSolution: function () { picked = RIGHT; mode = 'solution'; locked = true; renderOpts(); }
  });

  /* Selbstprüfung: Kette Rübe, Apfel, Mais, Löwenzahn, Ast; Antwort E (= Rübe) */
  (function () {
    var c = chain();
    if (c.join() !== 'ruebe,apfel,mais,kraut,ast' || c[0] !== RIGHT || ORDER.indexOf(RIGHT) !== 4) throw new Error('schnitzeljagd16: Lösung stimmt nicht');
  })();
})();
