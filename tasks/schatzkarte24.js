/* Aufgabe Schatzkarte (Heft 2024, Klasse 9-10 schwer, 11-13 mittel): Landkarte als Graph modellieren */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-schatzkarte24-';
  var DIR = 'assets/schatzkarte24/';

  /* Anzahl Kreise / Linien und Lage des markierten Kreises, wie in den Abbildungen des Hefts (S. 57) gelesen */
  var OPTIONS = [
    { id: 'A', file: 'karte-a.png', alt: 'sieben Kreise mit zwölf Linien; der markierte Kreis liegt in der Mitte' },
    { id: 'B', file: 'karte-b.png', alt: 'nur sechs Kreise mit zehn Linien; der markierte Kreis liegt oben' },
    { id: 'C', file: 'karte-c.png', alt: 'sieben Kreise mit elf Linien; der markierte Kreis liegt links unten' },
    { id: 'D', file: 'karte-d.png', alt: 'sieben Kreise mit elf Linien; der markierte Kreis liegt oben' },
    { id: 'E', file: 'karte-e.png', alt: 'sieben Kreise mit elf Linien; der markierte Kreis liegt in der oberen Mitte' }
  ];
  var RIGHT = 'D';   /* offizielle Lösung (Heft S. 58); per Skript bestätigt: Nur Karte D ist (mit markiertem Knoten) isomorph zum Nachbarschaftsgraphen der Landkarte */

  var el, api, locked, picked, mode, optsEl;

  function card(o) {
    var sel = picked === o.id;
    var cls = P + 'opt';
    var mark = '';
    if (mode && (mode === 'solution' ? o.id === RIGHT : sel)) {
      var ok = o.id === RIGHT;
      cls += ok ? ' right' : ' wrong';
      mark = ok ? '✓' : '✗';
    }
    var input = h('input', { type: 'radio', name: P + 'opt', value: o.id, disabled: locked, 'aria-label': 'Schatzkarte ' + o.id + ': ' + o.alt });
    input.checked = sel;
    return h('label', { class: cls },
      input,
      h('span', { class: P + 'card' },
        h('span', { class: P + 'head' }, o.id + ')', mark ? h('span', { class: P + 'mark', 'aria-hidden': 'true' }, mark) : null),
        h('img', { src: DIR + o.file, alt: '', width: 380, height: 532, draggable: 'false' })));
  }
  function renderOptions() { optsEl.replaceChildren.apply(optsEl, OPTIONS.map(card)); }

  function onChange(e) {
    if (locked || !e.target.matches('input[type=radio]')) return;
    picked = e.target.value;
    renderOptions();
    var f = optsEl.querySelector('input:checked'); if (f) f.focus();
    api.changed('Schatzkarte ' + picked + ' gewählt.');
  }

  Biber.register({
    id: 'schatzkarte24',
    story: '<p>Die Landkarte zeigt das Reich der Biberkönigin mit seinen sieben Provinzen. In einer Provinz hat die Königin ihren Schatz versteckt.</p>' +
      '<p>Die Königin will die Lage des Schatzes geheim halten. Deshalb hat sie eine besondere Schatzkarte gezeichnet: Für jede Provinz ist darin ein Kreis eingezeichnet. ' +
      'Eine Linie zwischen zwei Provinz-Kreisen zeigt, dass die beiden Provinzen aneinander angrenzen. Der Kreis für die Provinz mit dem Schatz ist markiert.</p>' +
      '<p>Um mögliche Räuber zu verwirren, hat die Königin zusätzlich vier falsche Schatzkarten gezeichnet.</p>',
    question: 'Welche ist die richtige Schatzkarte?',
    howto: 'Vergleiche die Landkarte mit den fünf Schatzkarten und wähle die richtige aus.',
    explanation: function () {
      return '<p>Nummeriert man die Provinzen A bis G und die gemeinsamen Grenzen 1 bis 11 und überträgt sie in die Schatzkarten, passt nur Karte D. Die anderen Karten verraten sich durch einfache Zählungen:</p>' +
        '<ul><li><b>A</b> ist falsch: A, C und F grenzen jeweils nur an zwei andere Provinzen. Es müsste drei Kreise mit genau zwei Linien geben, aber es gibt nur einen.</li>' +
        '<li><b>B</b> ist falsch: Sie hat nur sechs Kreise, es gibt aber sieben Provinzen.</li>' +
        '<li><b>C</b> ist falsch: Die Provinz mit dem Schatz grenzt an fünf Provinzen, vom markierten Kreis gehen aber nur vier Linien aus.</li>' +
        '<li><b>E</b> sieht der Landkarte am ähnlichsten, ist aber auch falsch: Vom markierten Kreis gehen nur vier Linien aus.</li></ul>' +
        '<div class="' + P + 'sol"><img src="' + DIR + 'loesung-landkarte.png" alt="Landkarte mit den Provinzen A bis G und den nummerierten Grenzen 1 bis 11" width="760" height="541">' +
        '<img src="' + DIR + 'loesung-karte-d.png" alt="Schatzkarte D mit den Provinzen A bis G als Kreisen und den Grenzen 1 bis 11 als Linien" width="420" height="590"></div>' +
        '<p><b>Informatik:</b> Die Schatzkarten sind Graphen: Die Kreise sind Knoten, die Linien Kanten. Sie zeigen nur, welche Provinzen aneinander grenzen; Form, Größe und Lage der Provinzen werden weggelassen. ' +
        'Dieses Weglassen von Unwichtigem heißt Abstrahieren und gehört zum Modellieren eines Problems.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null;
      optsEl = h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Schatzkarten A bis E' });
      el.replaceChildren(h('div', { class: P.slice(0, -1) },
        h('figure', { class: P + 'map' },
          h('img', { src: DIR + 'landkarte.png', width: 760, height: 542, alt: 'Landkarte des Reichs der Biberkönigin mit sieben Provinzen. In einer Provinz im Norden liegt die Schatzkiste.' }),
          h('figcaption', null, 'Das Reich der Biberkönigin')),
        h('section', { 'aria-label': 'Schatzkarten' }, h('h3', null, 'Schatzkarten'), optsEl)));
      optsEl.addEventListener('change', onChange);
      renderOptions();
    },
    isComplete: function () { return !!picked; },
    evaluate: function () { return { correct: picked === RIGHT, answer: picked }; },
    setAnswer: function (ans) { picked = ans || null; mode = 'check'; renderOptions(); },
    lock: function (on) { locked = on; mode = on ? (mode || 'check') : null; renderOptions(); },
    reset: function () { picked = null; mode = null; renderOptions(); },
    showSolution: function () { picked = RIGHT; mode = 'solution'; locked = true; renderOptions(); }
  });
})();
