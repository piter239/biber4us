/* Aufgabe Bitte lächeln! (Heft 2017, Klasse 3-4 mittel, 5-6 einfach): Welches Gesicht passt komplett ins Lächelmuster? */
(function () {
  'use strict';
  var h = Biber.h, sv = Biber.svg;
  var P = 't-bittelaecheln17-';

  /* Alle Maße in einem Gesichtsquadrat von 100 x 100 Einheiten. */
  var DOT = 3.2;      /* Radius eines Auges */
  var LINE = 2.2;     /* Strichstärke des Mundes */
  var PATTERN = {
    eyes: [[21, 22, 20], [79.5, 22, 20]],                        /* Augenbereiche: Mitte x, y, Radius */
    mouth: 'M21 68.4 Q50 75.6 79 68.4 L79 83.9 Q50 111 21 83.9 Z'   /* Mundbereich */
  };

  /* Gesichter: Augenpunkte und Mundlinie (nach den Abbildungen im Heft) */
  var FACES = [
    { id: 'A', eyes: [[20.4, 25], [74.4, 24.2]], mouth: 'M26.5 77.1 C40 79.5 70 76 90.9 65.7',
      label: 'Gesicht A: zwei Augen, darunter ein langer, nach rechts ansteigender Strich als Mund, der bis zum rechten Rand reicht',
      why: 'Der Mund ragt rechts aus dem Mundbereich heraus. Er liegt nicht komplett im Muster.' },
    { id: 'B', eyes: [[45.2, 25.7], [58.8, 25.4]], mouth: 'M32.4 78 Q52 87.8 74.2 76.8',
      label: 'Gesicht B: zwei Augen dicht nebeneinander in der Mitte, darunter ein kleiner Lächel-Bogen',
      why: 'Die Augen sitzen zu dicht beieinander in der Mitte. Sie liegen nicht in den beiden Augenbereichen, nur der Mund passt.' },
    { id: 'C', eyes: [[22.1, 23.9], [75.8, 23.2]],
      mouth: 'M26.7 76.5 L34.2 75.5 L37.9 78.6 L42.4 82.3 L47.9 79.5 L52.4 77.1 L57 78 L60.6 80.7 L64.5 79.5',
      label: 'Gesicht C: zwei Augen, darunter ein kleiner Zickzack-Strich als Mund',
      why: 'Beide Augen liegen in ihren Bereichen und der ganze Mund liegt im Mundbereich. Das Muster ist erfüllt, auch wenn der Mund eher wie eine Zickzacklinie aussieht.' },
    { id: 'D', eyes: [[23.9, 22.3], [77.9, 22.3]], mouth: 'M26.4 48 Q47.6 69.4 68.2 48',
      label: 'Gesicht D: zwei Augen, darunter ein deutlicher Lächel-Bogen in der Mitte des Gesichts',
      why: 'Der Mund sitzt zu weit oben und liegt ganz außerhalb des Mundbereichs. Obwohl er schön lächelt, passt er nicht ins Muster.' }
  ];
  var CORRECT = 'C';

  /* Beispiele aus dem Heft (Lächeln / kein Lächeln) */
  var EX_OK = { eyes: [[20.3, 27.3], [79, 26.3]], mouth: 'M29.7 82.8 Q52 88 74.7 82' };
  var EX_NO = { eyes: [[24.4, 21.6], [83.1, 20.9]], mouth: 'M30.7 78.4 C50 78 68 83 75.3 97.5' };

  function faceSvg(f, overlay, cls, title) {
    var kids = [sv('rect', { x: 1, y: 1, width: 98, height: 98, class: P + 'frame' })];
    if (overlay !== 'only') {
      f.eyes.forEach(function (e) { kids.push(sv('circle', { cx: e[0], cy: e[1], r: DOT, class: P + 'dot' })); });
      kids.push(sv('path', { d: f.mouth, class: P + 'line' }));
    }
    if (overlay) {
      PATTERN.eyes.forEach(function (e) { kids.push(sv('circle', { cx: e[0], cy: e[1], r: e[2], class: P + 'zone' })); });
      kids.push(sv('path', { d: PATTERN.mouth, class: P + 'zone' }));
    }
    var svg = sv.apply(null, ['svg', { viewBox: '0 0 100 100', class: cls || (P + 'face'), role: 'img', 'aria-label': title || '', focusable: 'false' }].concat(kids));
    return svg;
  }

  var el, api, choice, mark, locked;
  function reset() { choice = null; mark = null; }

  function legend() {
    function fig(svg, cap, text) {
      return h('figure', { class: P + 'fig' }, svg, h('figcaption', null, h('strong', null, cap), ' ', text));
    }
    return h('div', { class: P + 'legend' },
      fig(faceSvg({}, 'only', null, 'Das Lächelmuster: zwei runde Augenbereiche und ein Mundbereich in Form eines Bechers'), 'Lächelmuster', 'Bereiche für Augen und Mund.'),
      fig(faceSvg(EX_OK, true, null, 'Beispiel Lächeln: beide Augen liegen in den Augenbereichen, der Mund liegt im Mundbereich'), 'Lächeln', 'Augen und Mund passen ins Muster.'),
      fig(faceSvg(EX_NO, true, null, 'Beispiel kein Lächeln: der Mund ragt unten aus dem Mundbereich heraus'), 'Kein Lächeln', 'Der Mund passt nicht ins Muster.'));
  }

  function render() {
    var cards = FACES.map(function (f, i) {
      var cls = P + 'card' + (choice === f.id ? ' sel' : '');
      var badge = null;
      if (mark === 'check' && choice === f.id) {
        var ok = f.id === CORRECT;
        cls += ok ? ' right' : ' wrong';
        badge = h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      } else if (mark === 'solution' && f.id === CORRECT) cls += ' right';
      var tab = choice ? (choice === f.id ? '0' : '-1') : (i === 0 ? '0' : '-1');
      return h('button', {
        type: 'button', role: 'radio', class: cls, 'data-face': f.id, 'aria-checked': String(choice === f.id),
        tabindex: tab, disabled: locked, 'aria-label': f.label
      }, h('span', { class: P + 'letter', 'aria-hidden': 'true' }, f.id + ')'), faceSvg(f, false, null, ''), badge);
    });
    el.replaceChildren(h('div', { class: P + 'board' },
      legend(),
      h('div', { class: P + 'cards', role: 'radiogroup', 'aria-label': 'Die vier Gesichter A bis D' }, cards)));
  }

  function pick(id) {
    if (locked) return;
    choice = id;
    render();
    var b = el.querySelector('[data-face="' + id + '"]');
    if (b) b.focus();
    api.changed('Gesicht ' + id + ' ausgewählt.');
  }
  function onClick(e) {
    var b = e.target.closest('[data-face]');
    if (b && !locked) pick(b.dataset.face);
  }
  function onKey(e) {
    var b = e.target.closest('[data-face]');
    if (!b || locked) return;
    var i = FACES.map(function (f) { return f.id; }).indexOf(b.dataset.face), d = 0;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') d = 1;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') d = -1;
    else return;
    e.preventDefault();
    pick(FACES[(i + d + FACES.length) % FACES.length].id);
  }

  Biber.register({
    id: 'bittelaecheln17',
    story: '<p>Eine App soll entscheiden, ob ein gezeichnetes Gesicht lächelt. Sie benutzt dazu ein „Lächelmuster“ mit Bereichen für Augen und Mund (rot umrandet).</p>' +
      '<p>Ein Gesicht lächelt, wenn Augen und Mund ins Lächelmuster passen: Augen und Mund müssen <strong>komplett in den Bereichen des Musters</strong> liegen.</p>',
    question: 'Bei welchem Gesicht entscheidet die App, dass es lächelt?',
    howto: 'Tippe auf das Gesicht, bei dem alles komplett in den Bereichen des Lächelmusters liegt.',
    explanation: function () {
      return '<p>Man legt das Lächelmuster über jedes Gesicht und prüft, ob beide Augen und der ganze Mund in den roten Bereichen liegen. Nur bei <strong>Gesicht C</strong> ist das so.</p>' +
        '<div class="' + P + 'why">' + FACES.map(function (f) {
          var svg = faceSvg(f, true, P + 'mini', 'Gesicht ' + f.id + ' mit aufgelegtem Lächelmuster').outerHTML;
          return '<div class="' + P + 'whyitem' + (f.id === CORRECT ? ' ok' : '') + '">' + svg +
            '<div><strong>' + f.id + (f.id === CORRECT ? ' (passt)' : ' (passt nicht)') + '</strong><span>' + f.why + '</span></div></div>';
        }).join('') + '</div>' +
        '<p>Die App wendet nur einfache Regeln an. Darum erkennt sie hier ein „Lächeln“, obwohl der Mund wie eine Zickzacklinie aussieht, und übersieht ein echtes Lächeln, das nur etwas zu hoch sitzt. Solche Fehler passieren auch bei echten Systemen zur Gesichtserkennung, die mit Mustern arbeiten: Man darf sich nicht blind auf sie verlassen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKey);
      render();
    },
    isComplete: function () { return !!choice; },
    evaluate: function () { return { correct: choice === CORRECT, answer: { choice: choice } }; },
    setAnswer: function (ans) {
      choice = ans && ans.choice ? ans.choice : null;
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
      choice = CORRECT; mark = 'solution'; locked = true;
      render();
    }
  });
})();
