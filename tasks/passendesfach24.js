/* Aufgabe Passendes Fach? (Biber 2024, S. 44; Klasse 3-4 einfach): Farbmuster als Schlüssel (Hashing) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-passendesfach24-';
  var DIR = 'assets/passendesfach24/';

  /* Die sieben Fächer der Schachtel (Bild im Heft): Menge der Farben auf den Wänden */
  var SLOTS = [
    { name: 'rot', colors: ['rot'] },
    { name: 'weiß', colors: ['weiß'] },
    { name: 'schwarz', colors: ['schwarz'] },
    { name: 'gelb-rot gestreift', colors: ['gelb', 'rot'] },
    { name: 'rot-weiß gestreift', colors: ['rot', 'weiß'] },
    { name: 'rot-schwarz gestreift', colors: ['rot', 'schwarz'] },
    { name: 'rot-schwarz-weiß gestreift', colors: ['rot', 'schwarz', 'weiß'] }
  ];
  /* Die vier Armbänder: vorkommende Perlenfarben (A: rot/schwarz im Wechsel, B: nur rot,
     C: schwarz/weiß im Wechsel, D: rot, schwarz und weiß gemischt) */
  var BANDS = [
    { key: 'A', colors: ['rot', 'schwarz'], alt: 'Armband A: abwechselnd rote und schwarze Perlen' },
    { key: 'B', colors: ['rot'], alt: 'Armband B: nur rote Perlen' },
    { key: 'C', colors: ['schwarz', 'weiß'], alt: 'Armband C: abwechselnd schwarze und weiße Perlen' },
    { key: 'D', colors: ['rot', 'schwarz', 'weiß'], alt: 'Armband D: rote, schwarze und weiße Perlen gemischt' }
  ];
  function same(a, b) { return a.length === b.length && a.every(function (c) { return b.indexOf(c) >= 0; }); }
  BANDS.forEach(function (b) { b.fits = SLOTS.filter(function (s) { return same(s.colors, b.colors); }); });
  var ANSWER = BANDS.filter(function (b) { return b.fits.length === 0; })[0].key;   /* C */

  var el, api, locked, selected, mark;
  function reset() { selected = null; mark = null; }

  function render() {
    var opts = BANDS.map(function (b) {
      var cls = P + 'opt';
      var badge = null;
      var isSel = selected === b.key || (mark === 'solution' && b.key === ANSWER);
      if (isSel) {
        cls += ' selected';
        if (mark) {
          var ok = b.key === ANSWER;
          cls += ok ? ' right' : ' wrong';
          badge = h('span', { class: P + 'badge', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
        }
      }
      return h('button', {
        type: 'button', class: cls, role: 'radio', 'data-key': b.key, disabled: locked,
        'aria-checked': String(isSel), 'aria-label': b.alt
      }, h('span', { class: P + 'letter', 'aria-hidden': 'true' }, b.key + ')'),
      h('img', { src: DIR + b.key.toLowerCase() + '.png', alt: '', draggable: 'false' }), badge);
    });
    el.replaceChildren(h('div', { class: P + 'board' },
      h('figure', { class: P + 'fig' },
        h('img', {
          class: P + 'box', src: DIR + 'box.png', width: 733, height: 432, draggable: 'false',
          alt: 'Schachtel mit sieben Fächern: ein rotes, ein weißes, ein schwarzes, ein gelb-rot gestreiftes, ein rot-weiß gestreiftes, ein rot-schwarz gestreiftes und ein rot-schwarz-weiß gestreiftes Fach. Rechts oben liegt ein rot-weißes Armband mit einem Pfeil in das rot-weiß gestreifte Fach.'
        }),
        h('figcaption', null, 'Das rot-weiße Band passt in das rot-weiß gestreifte Fach.')),
      h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Armbänder A bis D' }, opts)));
  }

  function choose(key) {
    if (locked) return;
    selected = selected === key ? null : key;
    mark = null;
    render();
    var again = el.querySelector('[data-key="' + key + '"]');
    if (again) again.focus();
    api.changed();
  }
  function onClick(e) {
    var b = e.target.closest('[data-key]');
    if (b) choose(b.dataset.key);
  }
  function onKey(e) {
    var b = e.target.closest('[data-key]');
    if (!b || locked) return;
    var keys = BANDS.map(function (x) { return x.key; });
    var i = keys.indexOf(b.dataset.key), to = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = (i + 1) % keys.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = (i + keys.length - 1) % keys.length;
    if (to === null) return;
    e.preventDefault();
    selected = keys[to]; mark = null; render();
    el.querySelector('[data-key="' + keys[to] + '"]').focus();
    api.changed();
  }

  Biber.register({
    id: 'passendesfach24',
    story:
      '<p>Viktoria hat Armbänder mit farbigen Perlen. Für die Bänder hat sie eine Schachtel mit sieben Fächern. ' +
      'Sie legt ihre Armbänder nur in Fächer mit passendem Farbmuster.</p>' +
      '<p>Im Bild siehst du ein Beispiel für ein Band, das zu einem Fach passt.</p>',
    question: 'Welches Armband passt zu keinem Fach?',
    howto: 'Tippe das Armband an, das zu keinem Fach passt.',
    explanation: function () {
      return '<p>Das Farbmuster jedes Fachs zeigt, welche Farben ein Band haben muss. ' +
        'Armband A (rot und schwarz) passt in das rot-schwarz gestreifte Fach, Armband B (nur rot) in das rote Fach und Armband D (rot, schwarz und weiß) in das Fach mit drei Farben. ' +
        '<strong>Zu Armband C (schwarz und weiß) gibt es kein Fach:</strong> Das schwarz-weiße Muster fehlt.</p>' +
        '<figure class="' + P + 'fig ' + P + 'solfig"><img src="' + DIR + 'loesung.png" width="897" height="498" ' +
        'alt="Die Pfeile zeigen: A kommt ins rot-schwarz gestreifte Fach, B ins rote, D ins rot-schwarz-weiß gestreifte Fach. Für C gibt es kein Fach."></figure>' +
        '<p>Viktoria ist ordentlich: Aus dem Farbmuster eines Bandes weiß sie sofort, in welches Fach es gehört, und findet es genauso schnell wieder. ' +
        'Computer machen das mit <i>Hashing</i> ähnlich: Aus einem Datenelement wird ein Wert berechnet, der direkt zur passenden Stelle im Speicher führt. ' +
        'So findet ein Programm Daten, ohne alles durchsuchen zu müssen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKey);
      render();
    },
    isComplete: function () { return selected != null; },
    evaluate: function () { return { correct: selected === ANSWER, answer: selected }; },
    setAnswer: function (ans) {
      selected = BANDS.some(function (b) { return b.key === ans; }) ? ans : null;
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () { selected = ANSWER; locked = true; mark = 'solution'; render(); }
  });
})();
