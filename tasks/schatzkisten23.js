/* Aufgabe Schatzkisten (Biber 2023, S. 52; Klasse 7-8 einfach): logisches Schlussfolgern aus drei Fotos */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-schatzkisten23-';

  var CHESTS = [
    { id: 'vulkan', name: 'am Fuß des Vulkans', x: 45.7, y: 35.0 },
    { id: 'palme', name: 'unter der Palme', x: 30.9, y: 62.9 },
    { id: 'strand', name: 'am Strand', x: 77.6, y: 78.1 }
  ];
  /* Welche Kisten zeigt welches Foto (laut Heft S. 52)? */
  var PHOTOS = [
    { id: 'anita', who: 'Anita', shows: ['strand'], text: 'zeigt die Kiste am Strand.', alt: 'Anitas Foto: eine geöffnete, leere Kiste am Strand' },
    { id: 'britta', who: 'Britta', shows: ['palme', 'strand'], text: 'zeigt die zwei Kisten unter der Palme und am Strand.', alt: 'Brittas Foto: zwei geöffnete, leere Kisten, eine unter der Palme und eine am Strand' },
    { id: 'carla', who: 'Carla', shows: ['palme', 'vulkan'], text: 'zeigt die zwei Kisten unter der Palme und am Fuß des Vulkans.', alt: 'Carlas Foto: zwei geöffnete, leere Kisten, eine unter der Palme und eine am Fuß des Vulkans' }
  ];
  /* Kiste k kann das Gold enthalten, wenn eine Touristin vor dem Befüllen fotografiert hat und die beiden anderen Fotos (danach) k nicht zeigen */
  function possible(k) {
    return PHOTOS.some(function (b) {
      return PHOTOS.every(function (t) { return t === b || t.shows.indexOf(k) < 0; });
    });
  }
  var RIGHT = 'vulkan';   /* offizielle Lösung (Heft S. 53); per Skript bestätigt: nur der Vulkan ist möglich */

  var el, api, locked, choice, mark;

  function chestName(id) { return CHESTS.filter(function (c) { return c.id === id; })[0].name; }

  function render() {
    var btns = CHESTS.map(function (c) {
      var cls = P + 'chest' + (choice === c.id ? ' sel' : '');
      if (mark === 'check' && choice === c.id) cls += c.id === RIGHT ? ' right' : ' wrong';
      if (mark === 'solution' && c.id === RIGHT) cls += ' sel right';
      return h('button', {
        type: 'button', class: cls, 'data-chest': c.id, disabled: locked, 'aria-pressed': String(choice === c.id || (mark === 'solution' && c.id === RIGHT)),
        'aria-label': 'Schatzkiste ' + c.name, style: 'left:' + c.x + '%;top:' + c.y + '%'
      }, h('span', { class: P + 'ring', 'aria-hidden': 'true' }), h('span', { class: P + 'tick', 'aria-hidden': 'true' }));
    });
    var island = h('div', { class: P + 'island' },
      h('img', { src: 'assets/schatzkisten23/insel.png', alt: 'Insel mit einem Vulkan. Eine Schatzkiste steht am Fuß des Vulkans, eine unter der Palme und eine am Strand.', width: 835, height: 547, draggable: 'false' }),
      btns);
    var cards = PHOTOS.map(function (p) {
      return h('figure', { class: P + 'photo' },
        h('img', { src: 'assets/schatzkisten23/foto-' + p.id + '.png', alt: p.alt, width: 480, height: 308, draggable: 'false' }),
        h('figcaption', null, h('b', null, p.who + 's Foto'), ' ' + p.text));
    });
    el.replaceChildren(h('div', { class: P + 'box' },
      island,
      h('div', { class: P + 'photos' }, cards),
      h('p', { class: P + 'pick', 'aria-live': 'polite' }, choice ? 'Dein Tipp: Das Gold ist in der Kiste ' + chestName(choice) + '.' : 'Tippe auf die Schatzkiste, in der das Gold ist.')));
  }

  function onClick(e) {
    var b = e.target.closest('[data-chest]');
    if (!b || locked) return;
    choice = b.dataset.chest;
    render();
    var f = el.querySelector('[data-chest="' + choice + '"]');
    if (f) f.focus({ preventScroll: true });
    api.changed();
  }

  Biber.register({
    id: 'schatzkisten23',
    story: '<p>Auf einer Insel gibt es drei Schatzkisten: Eine Kiste ist am Fuß des Vulkans, die zweite ist unter einer Palme, und die dritte ist am Strand. Alle Kisten sind leer.</p>' +
      '<p>An einem Tag kreuzt der Pirat Biberbart auf, füllt eine der Kisten mit Gold und verschließt sie. Am gleichen Tag sind drei Touristinnen auf der Insel: Anita, Britta und Carla. Jede macht ein Foto: eine, <b>bevor</b> Biberbart Gold in eine Kiste gefüllt hat, die anderen beiden <b>danach</b>.</p>' +
      '<p>Auf den Fotos sind alle Kisten leer. Biberbart hatte also Glück, dass keine Touristin sein Gold gefunden hat.</p>',
    question: 'In welcher Schatzkiste ist das Gold?',
    howto: 'Tippe auf eine der drei Kisten auf der Insel.',
    explanation: function () {
      return '<p>Das Gold ist in der Kiste <b>am Fuß des Vulkans</b>. Wir prüfen jede Kiste: Zwei der drei Fotos wurden gemacht, <i>nachdem</i> das Gold in der Kiste war. Auf diesen beiden Fotos kann die Kiste also nicht leer zu sehen sein.</p>' +
        '<ul><li><b>Kiste unter der Palme:</b> Sie ist auf Brittas und Carlas Foto leer zu sehen, also auf zwei Fotos. Das geht nicht.</li>' +
        '<li><b>Kiste am Strand:</b> Sie ist auf Anitas und Brittas Foto zu sehen, also wieder auf zwei Fotos. Das geht nicht.</li>' +
        '<li><b>Kiste am Vulkan:</b> Sie ist nur auf Carlas Foto zu sehen, das vor dem Befüllen entstanden sein kann. Kein Widerspruch.</li></ul>' +
        '<p>Das ist logisches Schlussfolgern: Führt eine Annahme zu einem Widerspruch, ist sie falsch. So bleibt nur eine Möglichkeit übrig.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; choice = null; mark = null;
      el.addEventListener('click', onClick);
      render();
    },
    isComplete: function () { return !!choice; },
    evaluate: function () { return { correct: choice === RIGHT && possible(choice), answer: choice }; },
    setAnswer: function (ans) { choice = ans; mark = null; render(); },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      render();
    },
    reset: function () { choice = null; mark = null; render(); },
    showSolution: function () { choice = RIGHT; mark = 'solution'; render(); }
  });
})();
