/* Aufgabe Bauklötze 2 (Klasse 7-8, einfach): Welches Bauwerk lässt sich mit der Anleitung nicht bauen? */
(function () {
  'use strict';
  var h = Biber.h;
  var BASE = 'assets/bauklotze2/';

  /* Lösung B (per Skript geprüft: A, C, D sind mit der Anleitung baubar, B nicht: Brücke liegt unter Würfeln und Quader) */
  var SOLUTION = 'B';

  /* w = Breite der Originalabbildung im Heft (Pixel), damit alle Bauwerke gleich groß erscheinen; h = Höhe der Bilddatei */
  var OPTIONS = [
    { id: 'A', w: 706, h: 510, src: 'A.png',
      alt: 'Bauwerk A: Auf dem Boden stehen von links ein rosa Quader, ein Turm aus drei Würfeln (von unten dunkeltürkis, grün, lila), ein blauer Quader und ein Turm aus drei Würfeln (von unten hellblau, gelb, rot). Darauf liegt die Brücke umgedreht, mit dem Bogen nach oben. Auf dem linken Ende der Brücke steht eine orange Pyramide, auf dem rechten Ende eine pinke.' },
    { id: 'B', w: 908, h: 417, src: 'B.png',
      alt: 'Bauwerk B: Links steht ein rosa Quader mit einer pinken Pyramide. Rechts daneben liegt die Brücke ganz unten auf dem Boden. Auf der Brücke stehen links ein Turm aus drei Würfeln (von unten rot, gelb, lila), in der Mitte ein blauer Quader mit einer orangen Pyramide darauf und rechts ein Turm aus drei Würfeln (von unten hellblau, grün, dunkeltürkis).' },
    { id: 'C', w: 1063, h: 274, src: 'C.png',
      alt: 'Bauwerk C: Von links stehen auf dem Boden ein Turm aus drei Würfeln (von unten gelb, grün, lila) mit einer pinken Pyramide, ein rosa Quader, ein blauer Quader und ein Turm aus drei Würfeln (von unten hellblau, dunkeltürkis, rot) mit einer orangen Pyramide. Die Brücke liegt auf dem rosa und dem blauen Quader.' },
    { id: 'D', w: 1081, h: 337, src: 'D.png',
      alt: 'Bauwerk D: Von links stehen auf dem Boden ein Turm aus drei Würfeln (von unten dunkeltürkis, lila, grün), ein blauer Quader, ein Turm aus drei Würfeln (von unten hellblau, rot, gelb) und ein rosa Quader mit einer pinken Pyramide. Die Brücke liegt auf dem blauen Quader und dem Würfelturm daneben, auf ihr steht eine orange Pyramide.' }
  ];
  var MAXW = 1081;

  function imgHtml(name, alt, w, ht) {
    return '<img src="' + BASE + name + '" alt="' + alt + '" width="' + w + '" height="' + ht + '" draggable="false">';
  }

  function inventory() {
    function cell(label, img) { return '<li><span class="b2-cap">' + label + '</span><span class="b2-pic">' + img + '</span></li>'; }
    return '<ul class="b2-inv" aria-label="Deine Bauklötze">' +
      cell('6 Würfel', imgHtml('cubes.png', 'Sechs Würfel in Lila, Rot, Gelb, Dunkeltürkis, Grün und Hellblau', 320, 169)) +
      cell('2 Quader', imgHtml('quader.png', 'Zwei lange Quader, ein rosa und ein blauer', 150, 200)) +
      cell('1 Brücke', imgHtml('bridge.png', 'Eine grüne Brücke mit einem Bogen an der Unterseite', 320, 102)) +
      cell('2 Pyramiden', imgHtml('pyr.png', 'Zwei Pyramiden, eine orange und eine pinke', 320, 211)) + '</ul>';
  }
  function examples() {
    return '<div class="b2-ex" role="group" aria-label="Zwei Beispiele für Bauwerke">' +
      '<span class="b2-extit">Zwei Beispiele:</span>' +
      '<figure class="b2-ex1">' + imgHtml('ex1.png', 'Beispiel 1: Links steht ein rosa Quader, daneben ein Turm aus drei Würfeln (von unten dunkeltürkis, lila, grün), dann ein Turm aus drei Würfeln (von unten hellblau, rot, gelb) und rechts ein blauer Quader. Die Brücke liegt auf den beiden Quadern, auf ihr stehen eine pinke und eine orange Pyramide.', 520, 549) + '</figure>' +
      '<span class="b2-und" aria-hidden="true">und</span>' +
      '<figure class="b2-ex2">' + imgHtml('ex2.png', 'Beispiel 2: Links steht ein rosa Quader mit einer pinken Pyramide. Es folgen ein Turm aus drei Würfeln (von unten rot, gelb, lila) und ein blauer Quader. Rechts steht ein Turm aus drei Würfeln (von unten hellblau, grün, dunkeltürkis). Die Brücke liegt auf den beiden Würfeltürmen, auf ihr steht eine orange Pyramide.', 520, 408) + '</figure></div>';
  }

  var el, api, locked, choice, mark, box;

  function render() {
    [].forEach.call(box.querySelectorAll('label'), function (lab) {
      var inp = lab.querySelector('input');
      var id = inp.value;
      inp.checked = id === choice;
      inp.disabled = !!locked;
      lab.classList.toggle('sel', id === choice);
      lab.classList.toggle('right', (mark === 'check' && id === choice && id === SOLUTION) || (mark === 'solution' && id === SOLUTION));
      lab.classList.toggle('wrong', mark === 'check' && id === choice && id !== SOLUTION);
    });
  }

  Biber.register({
    id: 'bauklotze2',
    story: '<p>Du hast diese Bauklötze:</p>' + inventory() +
      '<p>Dein Freund gibt dir diese Anleitung, um aus den Klötzen Bauwerke zu bauen:</p>' +
      '<ol class="b2-steps">' +
      '<li>Nimm drei Würfel.</li>' +
      '<li>Staple die Würfel übereinander, um einen Turm zu bauen.</li>' +
      '<li>Baue einen weiteren Turm mit den drei restlichen Würfeln.</li>' +
      '<li>Stelle die Quader neben die Türme.</li>' +
      '<li>Lege die Brücke auf dein Bauwerk.</li>' +
      '<li>Nimm die beiden Pyramiden und lege sie auf dein Bauwerk.</li></ol>' +
      '<p>Beim Bauen musst du dich an die Reihenfolge der sechs Anweisungen halten. Mit der Bauanleitung kannst du trotzdem viele verschiedene Bauwerke bauen.</p>' +
      examples() +
      '<p>Hier sind vier weitere Bauwerke.</p>',
    question: 'Eines davon kannst du NICHT mit der Bauanleitung bauen. Welches?',
    howto: 'Tippe das Bauwerk an, das sich nicht mit der Anleitung bauen lässt.',
    explanation: function () {
      return '<p>Wegen der Reihenfolge der Anweisungen steht alles, was früher gebaut wird, unten, und alles, was später kommt, liegt darauf: ' +
        'erst die Würfeltürme, dann die Quader, dann die Brücke und zuletzt die Pyramiden. Bei <strong>B</strong> liegt die Brücke aber ganz unten auf dem Boden, und ' +
        'die beiden Würfeltürme sowie der blaue Quader stehen auf ihr. Dann hätte die Brücke vor den Türmen und Quadern gelegt werden müssen, und das widerspricht der Anleitung.</p>' +
        '<p>Die anderen drei sind baubar: Bei A liegt die Brücke (umgedreht, das verbietet die Anleitung nicht) auf den Quadern und Türmen, bei C auf den beiden Quadern und bei D auf einem Quader und einem Turm. Die Pyramiden sitzen jeweils zuletzt oben.</p>' +
        '<p>Eine Anleitung ist <em>wohldefiniert</em>, wenn jeder Schritt eindeutig ist und die Reihenfolge feststeht. Genau daran kann man prüfen, ob ein Ergebnis mit ihr entstehen kann.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; choice = null; mark = null;
      box = h('div', { class: 'b2-opts', role: 'radiogroup', 'aria-label': 'Bauwerke A bis D' },
        OPTIONS.map(function (o) {
          return h('label', { class: 'b2-opt' },
            h('input', { type: 'radio', name: 'b2-ans', value: o.id, onchange: function () { if (locked) return; choice = o.id; mark = null; render(); api.changed(); } }),
            h('span', { class: 'b2-letter', 'aria-hidden': 'true' }, o.id),
            h('span', { class: 'b2-fig' },
              h('img', { src: BASE + o.src, alt: o.alt, width: 520, height: o.h,
                style: 'width:' + (Math.round(o.w / MAXW * 1000) / 10) + '%', draggable: 'false' })));
        }));
      el.replaceChildren(box);
      render();
    },
    isComplete: function () { return choice != null; },
    evaluate: function () { return { correct: choice === SOLUTION, answer: { choice: choice } }; },
    setAnswer: function (ans) { choice = ans && ans.choice ? ans.choice : null; mark = 'check'; render(); },
    lock: function (on) { locked = on; mark = on ? 'check' : null; render(); },
    reset: function () { choice = null; mark = null; render(); },
    showSolution: function () { choice = SOLUTION; locked = true; mark = 'solution'; render(); }
  });
})();
