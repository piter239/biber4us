/* Aufgabe Claras Blumen (Heft 2018, Klasse 3-4 schwer, 5-6 mittel): Datenstrukturen, Datenbanken, Logik */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-clarasblumen18-';
  var A = 'assets/clarasblumen18/';

  var SORTS = {
    G: { name: 'Gladiolen', one: 'Gladiole', img: 'sorte_gladiolen.png', w: 119, hgt: 140 },
    L: { name: 'Lilien', one: 'Lilie', img: 'sorte_lilien.png', w: 139, hgt: 140 },
    T: { name: 'Tulpen', one: 'Tulpe', img: 'sorte_tulpen.png', w: 89, hgt: 140 },
    R: { name: 'Rosen', one: 'Rose', img: 'sorte_rosen.png', w: 140, hgt: 82 }
  };
  var COLORS = { w: 'weiß', b: 'blau', y: 'gelb' };
  var SORT_ORDER = ['G', 'L', 'T', 'R'];

  /* Inhalt der vier Sträuße (Sorte, Farbe), wie auf den Heft-Bildern */
  var BOUQUETS = [
    { id: 'A', img: 'strauss_a.png', w: 381, hgt: 370, flowers: [['R', 'w'], ['T', 'b'], ['T', 'w'], ['L', 'y'], ['G', 'b'], ['L', 'w']] },
    { id: 'B', img: 'strauss_b.png', w: 382, hgt: 370, flowers: [['R', 'b'], ['T', 'b'], ['R', 'y'], ['R', 'w'], ['G', 'y'], ['T', 'w']] },
    { id: 'C', img: 'strauss_c.png', w: 382, hgt: 369, flowers: [['R', 'w'], ['T', 'b'], ['G', 'y'], ['G', 'y'], ['T', 'w'], ['L', 'b']] },
    { id: 'D', img: 'strauss_d.png', w: 382, hgt: 369, flowers: [['R', 'w'], ['T', 'b'], ['L', 'y'], ['G', 'y'], ['T', 'w'], ['G', 'b']] }
  ];
  var RIGHT = 3;

  function desc(b) {
    return 'Strauß ' + b.id + ': ' + b.flowers.map(function (f) { return COLORS[f[1]] + 'e ' + SORTS[f[0]].one; }).join(', ');
  }
  function count(b, fn) { return b.flowers.filter(fn).length; }
  /* die drei Wünsche, einzeln geprüft */
  function rule1(b) { return Object.keys(COLORS).every(function (c) { return count(b, function (f) { return f[1] === c; }) === 2; }); }
  function rule2(b) {
    return SORT_ORDER.every(function (s) {
      var cs = b.flowers.filter(function (f) { return f[0] === s; }).map(function (f) { return f[1]; });
      return cs.every(function (c, i) { return cs.indexOf(c) === i; });
    });
  }
  function rule3(b) { return SORT_ORDER.every(function (s) { return count(b, function (f) { return f[0] === s; }) <= 2; }); }
  function ok(b) { return rule1(b) && rule2(b) && rule3(b); }
  /* Selbstprüfung: genau Strauß D erfüllt alle drei Wünsche, die anderen verletzen genau den im Heft genannten */
  if (BOUQUETS.some(function (b, i) { return ok(b) !== (i === RIGHT); })) throw new Error('clarasblumen18: Lösung stimmt nicht');
  if (rule1(BOUQUETS[0]) || !rule1(BOUQUETS[1]) || rule3(BOUQUETS[1]) || rule2(BOUQUETS[2]) || !rule1(BOUQUETS[2]) || !rule3(BOUQUETS[2])) {
    throw new Error('clarasblumen18: Begründungen stimmen nicht');
  }

  var el, api, optsEl, locked, picked, mode;

  function sortImg(s, cls) {
    var d = SORTS[s];
    return h('img', { class: cls || P + 'sort', src: A + d.img, alt: '', width: d.w, height: d.hgt, draggable: 'false' });
  }
  function optionCard(b, idx) {
    var sel = picked === idx;
    var cls = P + 'opt';
    var mark = '';
    if (mode && (mode === 'solution' ? idx === RIGHT : sel)) {
      var good = idx === RIGHT;
      cls += good ? ' right' : ' wrong';
      mark = good ? '✓' : '✗';
    }
    var input = h('input', { type: 'radio', name: P + 'opt', value: String(idx), disabled: locked, 'aria-label': desc(b) });
    input.checked = sel;
    return h('label', { class: cls }, input,
      h('span', { class: P + 'card' },
        h('img', { src: A + b.img, alt: '', width: b.w, height: b.hgt, draggable: 'false' }),
        h('span', { class: P + 'let' }, b.id + ')'),
        mark ? h('span', { class: P + 'mark', 'aria-hidden': 'true' }, mark) : null));
  }
  function render() { optsEl.replaceChildren.apply(optsEl, BOUQUETS.map(optionCard)); }
  function onChange(e) {
    if (locked || !e.target.matches('input[type=radio]')) return;
    picked = +e.target.value;
    render();
    var f = optsEl.querySelector('input:checked'); if (f) f.focus();
    api.changed('Strauß ' + BOUQUETS[picked].id + ' gewählt.');
  }

  function legend() {
    return '<ul class="' + P + 'sorts" aria-label="Die vier Sorten">' + SORT_ORDER.map(function (s) {
      var d = SORTS[s];
      return '<li><span class="' + P + 'pic"><img src="' + A + d.img + '" alt="Zeichnung: ' + d.one + '" width="' + d.w + '" height="' + d.hgt + '"></span><b>' + d.name + '</b></li>';
    }).join('') + '</ul>' +
      '<p>Jede Sorte ist in diesen Farben erhältlich: ' +
      '<span class="' + P + 'chip ' + P + 'cw">Weiß</span> <span class="' + P + 'chip ' + P + 'cb">Blau</span> und <span class="' + P + 'chip ' + P + 'cy">Gelb</span>.</p>';
  }

  Biber.register({
    id: 'clarasblumen18',
    story: '<p>Clara liebt Blumen! Im Blumenladen gibt es diese Sorten:</p>' + legend() +
      '<p>Clara möchte einen Blumenstrauß kaufen. Aber sie hat besondere Wünsche:</p>' +
      '<ol class="' + P + 'rules"><li>Jede Farbe soll genau zweimal vorkommen,</li><li>Blumen der gleichen Sorte sollen nicht die gleiche Farbe haben und</li><li>jede Sorte darf höchstens zweimal vorkommen.</li></ol>',
    question: 'Welchen Blumenstrauß wird Clara kaufen?',
    howto: 'Wähle einen der vier Sträuße aus. Prüfe dazu bei jedem Strauß, ob alle drei Wünsche erfüllt sind.',
    explanation: function () {
      var d = BOUQUETS[RIGHT];
      function colorsOf(s) { return d.flowers.filter(function (f) { return f[0] === s; }).map(function (f) { return COLORS[f[1]]; }).join(' und '); }
      return '<p>Strauß D ist richtig. Bei den anderen ist je ein Wunsch verletzt:</p>' +
        '<ul class="' + P + 'list">' +
        '<li><b>A:</b> Es gibt drei weiße Blüten. Der erste Wunsch ist nicht erfüllt.</li>' +
        '<li><b>B:</b> Es gibt drei Rosen. Der dritte Wunsch ist nicht erfüllt.</li>' +
        '<li><b>C:</b> Die beiden Gladiolen haben die gleiche Farbe. Der zweite Wunsch ist nicht erfüllt.</li>' +
        '<li><b>D:</b> Jede Farbe kommt genau zweimal vor. Die Tulpen sind ' + colorsOf('T') + ', die Gladiolen ' + colorsOf('G') +
        '. Es gibt zwei Gladiolen, eine Lilie, zwei Tulpen und eine Rose, also keine Sorte öfter als zweimal. Alle Wünsche sind erfüllt.</li></ul>' +
        '<p><b>Informatik:</b> Hier suchst du aus vielen Dingen das heraus, das mehrere Bedingungen gleichzeitig erfüllt, so wie bei einer Suche in einer Datenbank, zum Beispiel in einem Online-Shop. ' +
        'Dort verknüpft man Teilbedingungen mit logischen Operatoren: Mit <i>UND</i> müssen alle Teilbedingungen gelten, mit <i>ODER</i> genügt mindestens eine. Mit Abfragesprachen kann man sehr komplexe Bedingungen formulieren.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null;
      optsEl = h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Die vier Blumensträuße' });
      el.replaceChildren(h('div', { class: P + 'box' }, optsEl));
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
