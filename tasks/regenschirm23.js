/* Aufgabe Aylas Regenschirm (Heft 2023, S. 11; Klasse 3-6): Muster-Teilfolge suchen */
(function () {
  'use strict';
  var h = Biber.h;
  var BASE = 'assets/regenschirm23/';

  /* Antworten laut Heft: nur C zeigt eine Folge von fünf Mustern, die auf Aylas Regenschirm vorkommt. */
  var OPTS = [
    { id: 'A', img: 'a.png', alt: 'Schirm A: von links nach rechts Streifen, Gitter, Labyrinth, Ovale, Schwarz' },
    { id: 'B', img: 'b.png', alt: 'Schirm B: von links nach rechts Linien, Ringe, Quadrate, Schwarz, Dreiecke' },
    { id: 'C', img: 'c.png', alt: 'Schirm C: von links nach rechts Punkte, Ovale, Labyrinth, Gitter, Streifen' },
    { id: 'D', img: 'd.png', alt: 'Schirm D: von links nach rechts Gitter, Labyrinth, Ovale, Punkte, Schwarz' }
  ];
  var RIGHT = 'C';
  var CMP = [
    { id: 'A', note: 'Beginnt mit Streifen (Muster 5). Rechts davon folgen auf Aylas Schirm aber Linien, Kreise, Quadrate und Dreiecke, nicht Gitter, Labyrinth, Ovale und Schwarz.' },
    { id: 'B', note: 'Beginnt mit Linien (Muster 6) und stimmt bis zu den Quadraten (8). Dann kommen auf Aylas Schirm Dreiecke (9) und dann Schwarz (10), im Bild aber erst Schwarz und dann Dreiecke.' },
    { id: 'C', note: 'Punkte, Ovale, Labyrinth, Gitter, Streifen: genau die Muster 1 bis 5 von Aylas Schirm, in dieser Reihenfolge.' },
    { id: 'D', note: 'Beginnt mit dem Gitter (Muster 4). Rechts davon folgen auf Aylas Schirm Streifen, Linien, Kreise und Quadrate, nicht Labyrinth, Ovale, Punkte und Schwarz.' }
  ];

  var el, api, sel, locked, mark;   /* mark: null | 'check' | 'solution' */

  function reset() { sel = null; mark = null; }

  function render() {
    var board = h('div', { class: 't-regenschirm23-board' },
      h('figure', { class: 't-regenschirm23-main' },
        h('img', {
          src: BASE + 'schirm.png', width: 560, height: 478, draggable: 'false',
          alt: 'Aylas Regenschirm von oben, zusammengeklappt gezeichnet: zehn Felder reihum mit Punkten, Ovalen, Labyrinth, Gitter, Streifen, Linien, Kreisen, Quadraten, Dreiecken und einer schwarzen Fläche'
        }),
        h('figcaption', null, 'Aylas Regenschirm')),
      h('div', { class: 't-regenschirm23-opts', role: 'radiogroup', 'aria-label': 'Die vier Bilder A bis D' },
        OPTS.map(function (o, i) {
          var cls = 't-regenschirm23-opt' + (sel === o.id ? ' selected' : '');
          var badge = null;
          if (mark && sel === o.id && mark === 'check') {
            var ok = o.id === RIGHT;
            cls += ok ? ' right' : ' wrong';
            badge = h('span', { class: 't-regenschirm23-mk', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
          } else if (mark === 'solution' && o.id === RIGHT) cls += ' right';
          return h('button', {
            type: 'button', class: cls, role: 'radio', 'aria-checked': String(sel === o.id), 'data-opt': o.id,
            tabindex: (sel ? sel === o.id : i === 0) ? '0' : '-1', disabled: locked, 'aria-label': 'Bild ' + o.id
          },
          h('img', { src: BASE + o.img, alt: o.alt, width: 380, height: 299, draggable: 'false' }),
          h('b', null, o.id), badge);
        })));
    el.replaceChildren(board);
  }

  function choose(id) {
    if (locked) return;
    sel = id; mark = null;
    render();
    api.changed();
  }

  function onClick(e) {
    var b = e.target.closest('[data-opt]');
    if (!b || locked) return;
    choose(b.dataset.opt);
    var nb = el.querySelector('[data-opt="' + b.dataset.opt + '"]');
    if (nb && e.detail === 0) nb.focus();
  }
  function onKey(e) {
    var b = e.target.closest('[data-opt]');
    if (!b || locked) return;
    var ids = OPTS.map(function (o) { return o.id; });
    var i = ids.indexOf(b.dataset.opt), n = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % ids.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i + ids.length - 1) % ids.length;
    else return;
    e.preventDefault();
    choose(ids[n]);
    var nb = el.querySelector('[data-opt="' + ids[n] + '"]');
    if (nb) nb.focus();
  }

  Biber.register({
    id: 'regenschirm23',
    story: '<p>Das ist Aylas Regenschirm. Er hat zehn Felder mit zehn verschiedenen Mustern, die reihum angeordnet sind:</p>',
    question: 'Eines der vier Bilder zeigt Aylas Regenschirm. Welches?',
    howto: 'Tippe das Bild an, das zu Aylas Regenschirm passt. Jedes Bild zeigt nur fünf der Felder, die nebeneinander liegen.',
    explanation: function () {
      return '<p>Aylas Schirm hat die Muster der Reihe nach: Punkte (1), Ovale (2), Labyrinth (3), Gitter (4), Streifen (5), Linien (6), Kreise (7), Quadrate (8), Dreiecke (9), Schwarz (10). ' +
        'Jedes Bild zeigt fünf Muster nebeneinander. Es passt nur, wenn diese fünf auf dem Schirm genau so hintereinander liegen. Das trifft nur auf <b>Bild C</b> zu (Felder 1 bis 5).</p>' +
        '<figure class="t-regenschirm23-fig"><img src="' + BASE + 'nummern.png" width="480" height="388" alt="Aylas Regenschirm mit den Feldern 1 bis 10 durchnummeriert"></figure>' +
        '<ul class="t-regenschirm23-why">' + CMP.map(function (c) {
          return '<li><b>' + c.id + (c.id === RIGHT ? ' ✓' : ' ✗') + '</b><span>' + c.note + '</span></li>';
        }).join('') + '</ul>' +
        '<p>Auch Computer suchen so: Sie vergleichen ein Suchwort Zeichen für Zeichen mit dem Text. Je länger das Suchwort, desto genauer ist die Suche.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKey);
      render();
    },
    isComplete: function () { return !!sel; },
    evaluate: function () { return { correct: sel === RIGHT, answer: sel }; },
    setAnswer: function (ans) { sel = ans; mark = 'check'; render(); },
    lock: function (on) {
      locked = on;
      if (on) { if (mark !== 'solution') mark = 'check'; } else mark = null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () { sel = RIGHT; mark = 'solution'; render(); }
  });
})();
