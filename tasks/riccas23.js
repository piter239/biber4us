/* Aufgabe Riccas (Biber 2023, Klasse 5-6 mittel, 7-8 einfach): Aussagen mit Quantoren und Operatoren an Beispielen prüfen */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-riccas23-';
  var A = 'assets/riccas23/';

  /* Eigenschaften der sechs Riccas (Bild 1-5: Evelyn, Bild 6: Lydia), aus den Bildern abgelesen;
     Arme/Beine/Augen wie in der Heftlösung (alle 6: zwei Arme; Bild 1-5: zwei Beine, Bild 6: fünf; 4 mit Hörnern und 2 Augen, 2 ohne Hörner mit 3 Augen). */
  var RICCAS = [
    { img: 'r1.png', horns: true, eyes: 2, teeth: true, wings: false, arms: 2, legs: 2, alt: 'Grünes rundes Ricca mit zwei Augen, lila Hörnern, spitzen Zähnen, zwei Armen und zwei Beinen' },
    { img: 'r2.png', horns: true, eyes: 2, teeth: true, wings: true, arms: 2, legs: 2, alt: 'Oranges Ricca mit zwei Augen, grünen Hörnern, Zähnen, schwarzen Flügeln, zwei Armen und zwei Beinen' },
    { img: 'r3.png', horns: false, eyes: 3, teeth: true, wings: false, arms: 2, legs: 2, alt: 'Hellgrünes Ricca mit drei Augen auf Stielen, Zähnen, ohne Hörner, zwei erhobenen Armen und zwei Beinen' },
    { img: 'r4.png', horns: false, eyes: 3, teeth: true, wings: false, arms: 2, legs: 2, alt: 'Violettes Ricca mit drei Augen, großem Mund mit Zähnen, ohne Hörner, zwei Armen und zwei Beinen' },
    { img: 'r5.png', horns: true, eyes: 2, teeth: true, wings: false, arms: 2, legs: 2, alt: 'Pinkes Ricca mit zwei Augen, schwarzen Hörnern, Zähnen, zwei Armen und zwei Beinen' },
    { img: 'r6.png', horns: true, eyes: 2, teeth: true, wings: false, arms: 2, legs: 5, alt: 'Lila Ricca mit zwei Augen, Hörnern, vielen Zähnen, Zunge, zwei Armen und fünf Beinen' }
  ];
  /* Sätze: all = Aussage über alle Riccas (kann durch ein Gegenbeispiel widerlegt werden), some = "einige" */
  var SENT = [
    { key: 'A', text: 'Alle Riccas haben Zähne.', kind: 'all', test: function (r) { return r.teeth; }, col: 'hat Zähne' },
    { key: 'B', text: 'Einige Riccas haben Flügel.', kind: 'some', test: function (r) { return r.wings; }, col: 'hat Flügel' },
    { key: 'C', text: 'Riccas haben entweder Hörner oder drei Augen.', kind: 'all', test: function (r) { return r.horns !== (r.eyes === 3); }, col: 'entweder Hörner oder drei Augen' },
    { key: 'D', text: 'Wenn Riccas genau zwei Arme haben, dann haben sie auch genau zwei Beine.', kind: 'all', test: function (r) { return r.arms !== 2 || r.legs === 2; }, col: 'Wenn zwei Arme, dann zwei Beine' }
  ];
  /* "sicher falsch" = Aussage über alle Riccas mit Gegenbeispiel unter den sechs bekannten */
  function certainlyFalse(s) {
    return s.kind === 'all' && RICCAS.some(function (r) { return !s.test(r); });
  }
  var RIGHT = -1;
  SENT.forEach(function (s, i) { if (certainlyFalse(s)) RIGHT = i; });   /* D */

  var el, api, radios, selected, locked, mark, tableEl;
  function reset() { selected = null; mark = null; }

  function buildTable() {
    var head = h('tr', null, h('th', { scope: 'col' }, 'Satz'));
    RICCAS.forEach(function (r, j) {
      head.appendChild(h('th', { scope: 'col', class: P + 'tc' }, h('img', { src: A + r.img, alt: '', width: 28, height: 28, draggable: 'false' }), h('span', null, String(j + 1))));
    });
    var rows = SENT.map(function (s) {
      var tr = h('tr', { class: s.kind === 'all' && certainlyFalse(s) ? P + 'falserow' : '' }, h('th', { scope: 'row' }, s.key + ': ' + s.col));
      RICCAS.forEach(function (r, j) {
        var ok = s.test(r);
        tr.appendChild(h('td', { class: P + 'tc ' + (ok ? 'y' : (s.kind === 'all' ? 'n' : 'z')), 'aria-label': 'Ricca ' + (j + 1) + ': ' + (ok ? 'trifft zu' : 'trifft nicht zu') }, ok ? '✓' : '✗'));
      });
      return tr;
    });
    return h('div', { class: P + 'tablewrap' },
      h('p', { class: P + 'tcap' }, 'Gilt der Satz für das jeweilige Ricca?'),
      h('div', { class: P + 'scroll' }, h('table', { class: P + 'table' }, h('thead', null, head), h('tbody', null, rows))));
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
    tableEl.hidden = !locked;
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

  function ricca(j, label) {
    var r = RICCAS[j];
    return h('figure', { class: P + 'fig' }, h('img', { src: A + r.img, alt: label + ': ' + r.alt, draggable: 'false' }), h('figcaption', null, label));
  }

  Biber.register({
    id: 'riccas23',
    story:
      '<p>Evelyn hat fünf Bilder von Riccas. Sie beschreibt in Sätzen, wie Riccas aussehen. Ihre Freundin Lydia zeigt ihr ein sechstes Bild von einem Ricca.</p>' +
      '<p>Nun stellt Evelyn fest: Einer ihrer Sätze über Riccas ist sicher falsch.</p>',
    question: 'Welcher dieser Sätze über Riccas ist nun sicher falsch?',
    howto: 'Sieh dir alle sechs Bilder an und wähle den Satz, der sicher falsch ist.',
    explanation: function () {
      return '<p><strong>A</strong> sagt etwas über <em>alle</em> Riccas. Er wäre falsch, sobald ein Ricca keine Zähne hätte, aber alle sechs bekannten haben Zähne. <strong>B</strong> sagt nur, dass <em>einige</em> Flügel haben: Ricca 2 hat welche, und selbst ohne das könnten andere, unbekannte Riccas Flügel haben. Dieser Satz ist nie sicher falsch.</p>' +
        '<p><strong>C</strong> ist ein „entweder – oder“ und gilt, wenn genau eine der beiden Bedingungen stimmt: Vier Riccas haben Hörner, aber keine drei Augen, die anderen beiden haben drei Augen und keine Hörner. Der Satz stimmt für alle sechs.</p>' +
        '<p><strong>D</strong> ist ein „wenn – dann“. Alle sechs Riccas haben genau zwei Arme, die Bedingung trifft also immer zu. Das Ricca auf Lydias Bild hat aber fünf Beine. Damit ist D <strong>sicher falsch</strong>.</p>' +
        '<p>Evelyns Sätze sind ein Modell der Riccas, formuliert mit logischen Ausdrücken: mit „alle“ und „einige“ (Quantoren) und mit „entweder – oder“ und „wenn – dann“ (Operatoren). Ein einziges Gegenbeispiel genügt, um eine Aussage über alle zu widerlegen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      radios = SENT.map(function (s, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': s.key,
          'aria-label': 'Satz ' + s.key + ': ' + s.text,
          onclick: function () { choose(i, false); }, onkeydown: onKey
        });
        btn.innerHTML = '<span class="' + P + 'key" aria-hidden="true">' + s.key + ')</span><span class="' + P + 'txt">' + s.text + '</span>';
        return btn;
      });
      tableEl = buildTable();
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { 'aria-label': 'Evelyns Bilder' },
          h('h3', null, 'Evelyns Bilder'),
          h('div', { class: P + 'row' }, [0, 1, 2, 3, 4].map(function (j) { return ricca(j, 'Bild ' + (j + 1)); }))),
        h('section', { 'aria-label': 'Lydias Bild' },
          h('h3', null, 'Lydias Bild'),
          h('div', { class: P + 'row' }, ricca(5, 'Bild 6'))),
        h('section', { 'aria-label': 'Evelyns Sätze' },
          h('h3', null, 'Evelyns Sätze'),
          h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Sätze A bis D' }, radios)),
        tableEl));
      refresh();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () {
      return { correct: selected === RIGHT, answer: { choice: SENT[selected].key } };
    },
    setAnswer: function (ans) {
      var i = SENT.map(function (o) { return o.key; }).indexOf(ans && ans.choice);
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
