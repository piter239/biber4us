/* Aufgabe Sporthemd (Heft 2021, S. 50; Klasse 3-4 leicht): Hemd anhand von Eigenschaften (Attributen) auswählen */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-sporthemd21-';
  var DIR = 'assets/sporthemd21/';

  /* Eigenschaften der vier Hemden laut Abbildung im Heft */
  var SHIRTS = [
    { key: 'A', img: 'a', alt: 'Hemd mit türkisem Rumpf, schwarzen Punkten, weißem Kragen und schwarzen Ärmeln', collarBlack: false, sleevesBlack: true, stripes: false,
      why: 'Die Ärmel sind schwarz, außerdem ist der Kragen weiß.' },
    { key: 'B', img: 'b', alt: 'Hemd mit gelbem Rumpf, schwarzen Punkten, schwarzem Kragen und gelben Ärmeln', collarBlack: true, sleevesBlack: false, stripes: false,
      why: 'Schwarzer Kragen, gelbe Ärmel, keine Streifen: Alles passt.' },
    { key: 'C', img: 'c', alt: 'Rotes Hemd mit schwarzen senkrechten Streifen, schwarzem Kragen und roten Ärmeln', collarBlack: true, sleevesBlack: false, stripes: true,
      why: 'Das Hemd hat schwarze Streifen.' },
    { key: 'D', img: 'd', alt: 'Grünes Hemd mit schwarzem Kragen und schwarzen Ärmeln', collarBlack: true, sleevesBlack: true, stripes: false,
      why: 'Die Ärmel sind schwarz.' }
  ];
  var RIGHT = 1;   /* B: im Heft bestätigt; Kontrolle: nur B erfüllt alle drei Bedingungen (Kragen schwarz, Ärmel nicht schwarz, keine Streifen) */
  var CLUES = [
    { id: 'kragen', label: 'schwarzer Kragen', ok: function (s) { return s.collarBlack; } },
    { id: 'aermel', label: 'keine schwarzen Ärmel', ok: function (s) { return !s.sleevesBlack; } },
    { id: 'streifen', label: 'keine Streifen', ok: function (s) { return !s.stripes; } }
  ];

  var el, api, radios, chips, selected, locked, mark, active;

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
      var dim = Object.keys(active).some(function (id) {
        return active[id] && !CLUES.filter(function (c) { return c.id === id; })[0].ok(SHIRTS[i]);
      });
      btn.classList.toggle(P + 'dim', dim);
      var m = btn.querySelector('.' + P + 'mark');
      if (m) m.remove();
      if (on && mark !== null) btn.appendChild(h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
    });
    chips.forEach(function (c, i) {
      c.setAttribute('aria-pressed', String(!!active[CLUES[i].id]));
      c.classList.toggle('on', !!active[CLUES[i].id]);
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

  Biber.register({
    id: 'sporthemd21',
    story:
      '<p>Heute hat Anne ein Sporthemd an. Es hat einen <strong>schwarzen Kragen</strong>, aber <strong>keine schwarzen Ärmel</strong> und <strong>keine Streifen</strong>.</p>',
    question: 'Welches Hemd hat Anne an?',
    howto: 'Tippe auf das Hemd, das zu allen drei Angaben passt. Mit den drei Knöpfen unter den Hemden kannst du Hemden abblenden, die eine Angabe nicht erfüllen.',
    explanation: function () {
      return '<p>Man prüft jedes Hemd der Reihe nach auf die drei Angaben. <strong>A</strong> und <strong>D</strong> sind falsch, weil sie schwarze Ärmel haben (A hat außerdem einen weißen Kragen). ' +
        '<strong>C</strong> ist falsch, weil es Streifen hat. Nur <strong>B</strong> hat einen schwarzen Kragen, keine schwarzen Ärmel und keine Streifen (die Punkte sind keine Streifen).</p>' +
        '<p>Jedes Hemd lässt sich durch seine Eigenschaften (Attribute) beschreiben, hier Kragenfarbe, Ärmelfarbe und Streifen. Wer in einer Datenbank etwas sucht, legt genau solche Bedingungen fest und behält nur die Einträge, die alle erfüllen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; active = {}; reset();
      var figure = h('figure', { class: P + 'fig' },
        h('img', { src: DIR + 'ref.png', width: 420, height: 501, draggable: 'false',
          alt: 'Ein Sporthemd. Ein Pfeil zeigt auf den Kragen, zwei Pfeile zeigen auf die beiden Ärmel.' }),
        h('figcaption', null, 'Kragen und Ärmel'));
      radios = SHIRTS.map(function (s, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': s.key,
          'aria-label': 'Hemd ' + s.key + ': ' + s.alt,
          onclick: function () { choose(i, false); }, onkeydown: onKey
        }, h('span', { class: P + 'key', 'aria-hidden': 'true' }, s.key + ')'),
          h('img', { src: DIR + s.img + '.png', alt: '', width: 360, height: 336, draggable: 'false' }));
        return btn;
      });
      chips = CLUES.map(function (c) {
        return h('button', {
          type: 'button', class: P + 'chip', 'aria-pressed': 'false',
          onclick: function () { active[c.id] = !active[c.id]; refresh(); }
        }, c.label);
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        figure,
        h('section', { 'aria-label': 'Hemden' },
          h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Hemden A bis D' }, radios),
          h('div', { class: P + 'filter' },
            h('span', { class: P + 'flabel', id: P + 'fl' }, 'Hemden abblenden, die nicht passen:'),
            h('div', { class: P + 'chips', role: 'group', 'aria-labelledby': P + 'fl' }, chips)))));
      refresh();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () {
      return { correct: selected === RIGHT, answer: { choice: SHIRTS[selected].key } };
    },
    setAnswer: function (ans) {
      var i = SHIRTS.map(function (s) { return s.key; }).indexOf(ans && ans.choice);
      selected = i >= 0 ? i : null;
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      refresh();
    },
    reset: function () { reset(); active = {}; refresh(); },
    showSolution: function () { selected = RIGHT; mark = 'solution'; locked = true; refresh(); }
  });
})();
