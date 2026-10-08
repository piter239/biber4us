/* Aufgabe Teddybär (Biber 2020; Klasse 3-4 leicht): fehlenden Teddy auf einem Rundgang durch das Dorf finden */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-teddybaer20-';
  var DIR = 'assets/teddybaer20/';

  /* Häuser (Position in Prozent des Kartenbilds 900 x 700) und ihre Teddys */
  var HOUSES = {
    A: { x: 48, y: 13, name: 'rosa-roter Teddy mit roter Schleife (oben Mitte)' },
    B: { x: 91, y: 22, name: 'orangefarbener Teddy (oben rechts)' },
    C: { x: 46, y: 48, name: 'Teddy-Mädchen im lila Kleid (Mitte)' },
    D: { x: 15, y: 65, name: 'brauner Teddy mit roter Schleife (links)' },
    E: { x: 76, y: 54, name: 'gelber Teddy mit blauer Schleife (rechts)' },
    F: { x: 51, y: 83, name: 'rosa Teddy mit roter Schleife (unten Mitte)' },
    G: { x: 89, y: 83, name: 'hellbrauner Teddy mit blauer Schleife (unten rechts)' }
  };
  /* Straßen des Dorfs ('S' = Susannes Haus), vom Bild abgelesen; zur Kontrolle per Skript benutzt */
  var ROADS = ['SA', 'AB', 'SD', 'SC', 'CB', 'CD', 'BE', 'BG', 'DF', 'FE', 'FG'];
  var REMEMBERED = [
    { img: 'r1.png', alt: 'brauner Teddy mit roter Schleife' },
    { img: 'r2.png', alt: 'Teddy-Mädchen im lila Kleid' },
    { img: 'r3.png', alt: 'orangefarbener Teddy' }
  ];
  var OPTIONS = [
    { key: 'A', img: 'oA.png', house: 'F', alt: 'rosa Teddy mit roter Schleife' },
    { key: 'B', img: 'oB.png', house: 'E', alt: 'gelber Teddy mit blauer Schleife' },
    { key: 'C', img: 'oC.png', house: 'A', alt: 'rosa-roter Teddy mit roter Schleife, sitzend' },
    { key: 'D', img: 'oD.png', house: 'G', alt: 'hellbrauner Teddy mit blauer Schleife' }
  ];
  var RIGHT = 2;   /* C: im Heft bestätigt; per Skript geprüft: der einzige Rundgang über genau 4 Häuser führt über Haus A (rosa-roter Teddy) */

  var el, api, radios, mapEl, imgEl, marksEl, selected, locked, mark, marks, noteEl;

  function reset() { selected = null; mark = null; marks = []; }

  function img(src, alt, cls, w, hgt) {
    return h('img', { class: cls, src: DIR + src, alt: alt, width: w, height: hgt, draggable: 'false' });
  }

  /* ---------- Karte mit Merkhilfe ---------- */
  function toggleMark(id) {
    if (locked) return;
    var i = marks.indexOf(id);
    if (i >= 0) marks.splice(i, 1); else marks.push(id);
    drawMarks();
  }
  function drawMarks() {
    var solution = mark === 'solution';
    marksEl.replaceChildren.apply(marksEl, Object.keys(HOUSES).map(function (id) {
      var i = marks.indexOf(id), H = HOUSES[id];
      var b = h('button', {
        type: 'button', class: P + 'house' + (i >= 0 ? ' ' + P + 'on' : ''),
        style: 'left:' + H.x + '%;top:' + H.y + '%',
        'aria-pressed': String(i >= 0), disabled: locked || solution,
        'aria-label': 'Haus mit ' + H.name + (i >= 0 ? ', als Nummer ' + (i + 1) + ' markiert' : ', markieren'),
        onclick: function () { toggleMark(id); }
      }, i >= 0 ? String(i + 1) : '');
      return b;
    }));
    marksEl.hidden = solution;
    imgEl.src = DIR + (solution ? 'loesung.png' : 'karte.png');
    imgEl.alt = solution
      ? 'Dorfkarte mit der Lösung: Der rot eingezeichnete Rundgang geht von Susannes Haus über das rosa-rote, das orangefarbene, das lila und das braune Haus zurück nach Hause.'
      : 'Dorfkarte: Susannes Haus oben links, dazu sieben weitere Häuser mit je einem Teddy, verbunden durch Wege.';
    if (!locked && !solution) noteEl.textContent = marks.length
      ? 'Du hast ' + marks.length + (marks.length === 1 ? ' Haus' : ' Häuser') + ' markiert. Ein Rundgang soll an genau vier Häusern vorbeiführen.'
      : 'Tipp: Tippe Häuser auf der Karte an, um sie dir zu merken. Das ist nur eine Merkhilfe.';
    else if (solution) noteEl.textContent = 'Der Rundgang über genau vier Häuser ist rot eingezeichnet. Dabei kommt Susanne am rosa-roten Teddy vorbei.';
    else noteEl.textContent = '';
  }

  /* ---------- Antworten ---------- */
  function choose(i, focus) {
    if (locked) return;
    selected = i;
    refresh();
    if (focus) radios[i].focus();
    api.changed();
  }
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
    drawMarks();
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
    id: 'teddybaer20',
    story:
      '<p>In Susannes Dorf sitzt vor jedem Haus ein Teddybär. Die Karte zeigt das Dorf mit den Wegen zwischen den Häusern.</p>' +
      '<p>Susanne geht spazieren. Sie geht zu Hause los, dann an vier anderen Häusern vorbei und zurück nach Hause. Susanne hat also vier Teddys gesehen. Sie erinnert sich aber nur an diese drei:</p>',
    question: 'Welchen Teddybären hat Susanne noch gesehen?',
    howto: 'Schau dir die Karte und die drei Teddys an, die Susanne einfallen. Wähle dann einen der vier Teddys A bis D aus. Auf der Karte kannst du Häuser antippen, um sie dir zu merken.',
    explanation: function () {
      return '<p>Susanne macht einen <strong>Rundgang</strong>: Sie startet zu Hause und kommt am Ende wieder dort an. Der kürzeste Rundgang führt nur an zwei Häusern vorbei, viele andere an mehr als vier. ' +
        'Es gibt aber nur <strong>einen</strong> Rundgang an genau vier Häusern, und er führt an den drei Teddys vorbei, an die Susanne sich erinnert. Der vierte Teddy auf diesem Weg ist der <strong>rosa-rote Teddy mit der roten Schleife</strong>: Antwort <strong>C</strong>.</p>' +
        '<figure class="' + P + 'sol"><img src="' + DIR + 'loesung.png" alt="Dorfkarte mit dem rot eingezeichneten Rundgang über vier Häuser" width="900" height="700"></figure>' +
        '<p>Susanne hat eine Information nicht „gespeichert“. Weil wir aber noch andere Angaben haben (wo die Teddys sitzen und dass der Rundgang an vier Häusern vorbeiführt), können wir die Lücke füllen. ' +
        'So ähnlich korrigiert man in der Informatik Fehler in gespeicherten oder übertragenen Daten: Zusätzliche Informationen verraten, was fehlt.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      imgEl = h('img', { class: P + 'map', src: DIR + 'karte.png', alt: '', width: 900, height: 700, draggable: 'false' });
      marksEl = h('div', { class: P + 'marks' });
      mapEl = h('div', { class: P + 'mapbox' }, imgEl, marksEl);
      noteEl = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      var mem = h('div', { class: P + 'mem', role: 'group', 'aria-label': 'Diese drei Teddys hat Susanne gesehen' },
        REMEMBERED.map(function (r) { return h('div', { class: P + 'memcard' }, img(r.img, r.alt, P + 'bear', 140, 140)); }));
      radios = OPTIONS.map(function (o, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': o.key,
          'aria-label': 'Antwort ' + o.key + ': ' + o.alt, onclick: function () { choose(i, false); }, onkeydown: onKey
        });
        btn.appendChild(h('span', { class: P + 'key', 'aria-hidden': 'true' }, o.key + ')'));
        btn.appendChild(img(o.img, o.alt, P + 'bear', 140, 140));
        return btn;
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { 'aria-label': 'Karte des Dorfs' }, h('h3', null, 'Das Dorf'), mapEl, noteEl),
        h('section', { 'aria-label': 'Erinnerung' }, h('h3', null, 'Daran erinnert sich Susanne'), mem),
        h('section', { 'aria-label': 'Antworten' }, h('h3', null, 'Welcher Teddy fehlt?'),
          h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Antworten' }, radios))));
      refresh();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () {
      return { correct: selected === RIGHT, answer: { choice: OPTIONS[selected].key } };
    },
    setAnswer: function (ans) {
      var i = OPTIONS.map(function (o) { return o.key; }).indexOf(ans && ans.choice);
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
