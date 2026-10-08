/* Aufgabe Leuchttürme (Biber 2024, S. 39; Klasse 3-4 einfach): Aussagenlogik mit Kreisen (UND, NICHT) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-leuchtt24-';
  var DIR = 'assets/leuchtt24/';

  /* Karte aus dem Heft (Bild 1336 x 1256 Pixel). Kreise: Mittelpunkt und Radius in Bildpixeln. */
  var W = 1336, H = 1256;
  var TOWERS = {
    A: { name: 'rot-weiß gestreifter Leuchtturm', ring: 'rot', circle: { x: 294, y: 575, r: 408 }, img: 'turm-a.png', w: 44, h: 201 },
    B: { name: 'rot-gelb gestreifter Leuchtturm', ring: 'gelb', circle: { x: 797, y: 409, r: 353 }, img: 'turm-b.png', w: 63, h: 122 },
    C: { name: 'brauner Leuchtturm', ring: 'türkis', circle: { x: 771, y: 856, r: 359 }, img: 'turm-c.png', w: 99, h: 209 }
  };
  /* Die neun Boote (Mitte im Bild, geordnet von oben nach unten und links nach rechts) */
  var BOATS = [
    { x: 1064, y: 515 }, { x: 627, y: 620 }, { x: 834, y: 620 }, { x: 419, y: 625 }, { x: 1202, y: 640 },
    { x: 529, y: 790 }, { x: 1056, y: 780 }, { x: 894, y: 815 }, { x: 677, y: 900 }
  ];
  function inside(b, t) { var c = TOWERS[t].circle; return Math.hypot(b.x - c.x, b.y - c.y) < c.r; }
  BOATS.forEach(function (b, i) {
    b.id = i;
    b.sees = ['A', 'B', 'C'].filter(function (t) { return inside(b, t); });
    b.ok = b.sees.join('') === 'BC';          /* sieht B und C, aber nicht A */
  });
  var ANSWER = BOATS.filter(function (b) { return b.ok; })[0].id;   /* genau ein Boot passt */

  function icon(t, cls) {
    var T = TOWERS[t];
    return h('img', { class: cls || P + 'ico', src: DIR + T.img, alt: T.name, width: T.w, height: T.h, draggable: 'false' });
  }
  function iconHtml(t) {
    var T = TOWERS[t];
    return '<img class="' + P + 'ico" src="' + DIR + T.img + '" alt="' + T.name + '" width="' + T.w + '" height="' + T.h + '">';
  }

  var el, api, locked, selected, mark, stage;

  function reset() { selected = null; mark = null; }

  function boatLabel(b) {
    return 'Boot ' + (b.id + 1) + ' von 9' + (selected === b.id ? ', gewählt' : '');
  }

  function render() {
    var btns = BOATS.map(function (b) {
      var cls = P + 'boat';
      var badge = null;
      if (selected === b.id) {
        cls += ' selected';
        if (mark === 'check') {
          cls += b.ok ? ' right' : ' wrong';
          badge = h('span', { class: P + 'badge', 'aria-hidden': 'true' }, b.ok ? '✓' : '✗');
        }
      }
      if (mark === 'solution' && b.ok) { cls += ' selected right'; badge = h('span', { class: P + 'badge', 'aria-hidden': 'true' }, '✓'); }
      return h('button', {
        type: 'button', class: cls, 'data-boat': String(b.id), disabled: locked,
        style: 'left:' + (b.x / W * 100).toFixed(2) + '%;top:' + (b.y / H * 100).toFixed(2) + '%',
        'aria-pressed': String(selected === b.id), 'aria-label': boatLabel(b)
      }, h('span', { class: P + 'ring', 'aria-hidden': 'true' }), badge);
    });
    stage = h('div', { class: P + 'stage' },
      h('img', {
        class: P + 'map', src: DIR + 'karte.png', width: 1000, height: 940, draggable: 'false',
        alt: 'Seekarte mit drei Leuchttürmen und drei sich überschneidenden Kreisen: roter Kreis um den rot-weißen Turm links, gelber Kreis um den rot-gelben Turm oben, türkiser Kreis um den braunen Turm unten. In der Bucht liegen neun Segelboote.'
      }), btns);
    var legend = h('ul', { class: P + 'legend', 'aria-label': 'Leuchttürme' },
      ['A', 'B', 'C'].map(function (t) {
        return h('li', { class: P + 'leg' }, icon(t), h('span', null, TOWERS[t].name, h('small', null, 'Kreis: ' + TOWERS[t].ring)));
      }));
    el.replaceChildren(h('div', { class: P + 'board' }, legend, stage));
  }

  function onClick(e) {
    var b = e.target.closest('[data-boat]');
    if (!b || locked) return;
    var id = +b.dataset.boat;
    selected = selected === id ? null : id;
    mark = null;
    render();
    var again = el.querySelector('[data-boat="' + (selected == null ? id : selected) + '"]');
    if (again) again.focus();
    api.changed();
  }

  Biber.register({
    id: 'leuchtt24',
    story:
      '<p>Ben ist auf seinem Segelboot. Ben hat eine Karte. Sie zeigt die Leuchttürme. Um jeden Leuchtturm ist ein Kreis gezeichnet. ' +
      'Wenn Bens Boot in dem Kreis ist, kann Ben den Leuchtturm sehen.</p>' +
      '<p class="' + P + 'line">Ben sieht die Leuchttürme ' + iconHtml('B') + ' und ' + iconHtml('C') +
      '. Den Leuchtturm ' + iconHtml('A') + ' sieht er nicht.</p>',
    question: 'Welches ist Bens Boot?',
    howto: 'Tippe auf das Boot, das zu dem passt, was Ben sieht.',
    explanation: function () {
      return '<p>Ben sieht ' + iconHtml('B') + ' und ' + iconHtml('C') + '. Sein Boot ist also in dem Gebiet, in dem sich <b>die Kreise dieser beiden Leuchttürme überschneiden</b>. ' +
        'Den Leuchtturm ' + iconHtml('A') + ' sieht er nicht, also liegt sein Boot <b>nicht</b> in dessen Kreis. ' +
        'Nur ein einziges Boot erfüllt beides: Es liegt im gelben und im türkisen Kreis, aber außerhalb des roten.</p>' +
        '<p>In der Informatik beschreibt man so etwas mit der <i>Aussagenlogik</i>: Aussagen wie „Leuchtturm B ist sichtbar“ sind wahr oder falsch. ' +
        'Mit UND und NICHT lässt sich das Gebiet genau beschreiben: „B UND C UND NICHT A“. ' +
        'Dieselbe Sprache nutzt man, um Wissen darzustellen, Programme zu überprüfen und digitale Schaltungen zu entwerfen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      render();
    },
    isComplete: function () { return selected != null; },
    evaluate: function () { return { correct: selected === ANSWER, answer: selected }; },
    setAnswer: function (ans) {
      selected = typeof ans === 'number' && BOATS[ans] ? ans : null;
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
      selected = ANSWER; locked = true; mark = 'solution';
      render();
    }
  });
})();
