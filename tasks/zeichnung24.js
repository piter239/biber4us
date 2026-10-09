/* Aufgabe Zeichnung (Biber 2024, S. 76; Klasse 5-6 einfach): Farbverbrauch und Flächen vergleichen (Computer Vision) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-zeichnung24-';
  var DIR = 'assets/zeichnung24/';

  /* Rest der fünf Flaschen als Anteil der Flaschenfüllung (am Heft-Bild in Pixeln abgemessen):
     Verbraucht = 1 - Rest, also Grün 0,84; Blau 0,33; Braun 0,33; Gelb 0,07; Violett 0,09. */
  /* Flächenanteile der Farben in den vier Bildern in Prozent (per Pixelzählung an den Bildern aus dem Heft):
     gruen = Wiese, blau = Himmel, gelb = Sonne, violett = Blüten, braun = Biber. */
  var PICS = [
    { key: 'A', gruen: 56, blau: 22, gelb: 3.5, violett: 9.4, braun: 6.9, alt: 'Bild A: Wiese und Himmel, eine Sonne, drei violette Blüten und ein Biber' },
    { key: 'B', gruen: 17, blau: 67, gelb: 3.4, violett: 3.1, braun: 6.8, alt: 'Bild B: fast nur Himmel, eine Sonne, ein Biber und eine violette Blüte auf kleiner Wiese' },
    { key: 'C', gruen: 33, blau: 37, gelb: 3.4, violett: 9.3, braun: 13.6, alt: 'Bild C: Wiese und Himmel, eine Sonne, drei violette Blüten und zwei Biber' },
    { key: 'D', gruen: 55, blau: 22, gelb: 3.4, violett: 3.1, braun: 13.5, alt: 'Bild D: Wiese und Himmel, eine Sonne, eine violette Blüte und zwei Biber' }
  ];

  /* Welches Bild passt zu den Flaschen? Grün am meisten und Blau am zweitmeisten, außerdem
     Gelb ~ Violett (Faktor < 1,5) und Braun ~ Blau (Faktor < 2; Biber mit Umriss wirken dunkler). */
  function near(a, b, f) { return Math.max(a, b) / Math.min(a, b) < f; }
  function fits(p) {
    var maxOther = Math.max(p.blau, p.braun, p.gelb, p.violett);
    if (p.gruen <= maxOther) return false;                              /* Grün wurde am meisten verbraucht */
    if (p.blau <= Math.max(p.gelb, p.violett)) return false;            /* Blau deutlich mehr als Gelb und Violett */
    return near(p.gelb, p.violett, 1.5) && near(p.braun, p.blau, 2);
  }
  var ANSWER = PICS.filter(fits).map(function (p) { return p.key; });    /* nur D, wie im Heft */

  var el, api, locked, selected, mark;
  function reset() { selected = null; mark = null; }
  function isRight(k) { return ANSWER.indexOf(k) >= 0; }

  function render() {
    var opts = PICS.map(function (p) {
      var cls = P + 'opt', badge = null;
      var isSel = selected === p.key || (mark === 'solution' && p.key === ANSWER[0]);
      if (isSel) {
        cls += ' selected';
        if (mark) {
          var ok = isRight(p.key);
          cls += ok ? ' right' : ' wrong';
          badge = h('span', { class: P + 'badge', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
        }
      }
      return h('button', {
        type: 'button', class: cls, role: 'radio', 'data-key': p.key, disabled: locked,
        'aria-checked': String(isSel), 'aria-label': p.alt
      }, h('span', { class: P + 'letter', 'aria-hidden': 'true' }, p.key + ')'),
      h('img', { src: DIR + p.key.toLowerCase() + '.png', alt: '', width: 262, height: 319, draggable: 'false' }), badge);
    });
    el.replaceChildren(h('div', { class: P + 'board' },
      h('figure', { class: P + 'fig' },
        h('img', {
          class: P + 'bottles', src: DIR + 'flaschen.png', width: 526, height: 217, draggable: 'false',
          alt: 'Fünf Farbflaschen mit dem Rest an Farbe: blau und braun etwa zu zwei Dritteln gefüllt, gelb und violett fast voll, grün fast leer.'
        }),
        h('figcaption', null, 'So viel Farbe ist noch in den Flaschen.')),
      h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Bilder A bis D' }, opts)));
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
    var keys = PICS.map(function (x) { return x.key; });
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
    id: 'zeichnung24',
    story:
      '<p>Bea malt ein Bild. Sie hat fünf Flaschen mit Farbe. Am Anfang sind alle Flaschen voll. ' +
      'Für große Flächen auf dem Bild braucht sie mehr Farbe als für kleine Flächen.</p>' +
      '<p>Als Bea fertig ist, enthalten die Flaschen noch so viel Farbe:</p>',
    question: 'Welches Bild hat Bea gemalt?',
    howto: 'Vergleiche die Farbflächen der Bilder mit dem Rest in den Flaschen und tippe das passende Bild an.',
    explanation: function () {
      return '<p>Die Flaschen zeigen, <strong>wie viel</strong> von jeder Farbe verbraucht wurde: Am meisten Grün, am zweitmeisten Blau. Das passt zu den Bildern A, C und D, Bild B (viel zu viel Blau) scheidet aus.</p>' +
        '<p>Gelb und Violett wurden gleich viel verbraucht. In A und C sind die drei Blüten etwa dreimal so groß wie die Sonne, nur in D sind Sonne und die eine Blüte etwa gleich groß. ' +
        'Auch Braun und Blau sind gleich viel verbraucht, und die zwei Biber in D sind etwa so groß wie der Himmel. Also hat Bea <strong>Bild D</strong> gemalt.</p>' +
        '<p>Solche Farbuntersuchungen kann auch ein Computerprogramm machen: Es unterscheidet Flächen, schätzt ihre Größe und vergleicht sie. ' +
        'So kann es zum Beispiel Landschaftsfotos (oben viel Blau, unten viel Grün) von Porträts unterscheiden. Dieses Gebiet heißt <i>Computer Vision</i>.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKey);
      render();
    },
    isComplete: function () { return selected != null; },
    evaluate: function () { return { correct: isRight(selected), answer: selected }; },
    setAnswer: function (ans) {
      selected = PICS.some(function (p) { return p.key === ans; }) ? ans : null;
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () { selected = ANSWER[0]; locked = true; mark = 'solution'; render(); }
  });
})();
