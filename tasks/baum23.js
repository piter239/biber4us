/* Aufgabe Ein besonderer Baum (Heft 2023, Klasse 3-4 schwer, 5-6 mittel): Programmieren, Variablen, Zustand */
(function () {
  'use strict';
  var h = Biber.h;
  var A = 'assets/baum23/';

  var ANIMAL = {
    v: { name: 'Vogel', img: 'bird.png', w: 41, hgt: 33 },
    e: { name: 'Eichhörnchen', img: 'squirrel.png', w: 33, hgt: 32 },
    s: { name: 'Schlange', img: 'snake.png', w: 54, hgt: 27 }
  };
  /* Reihenfolge wie im Heft (v = Vogel, e = Eichhörnchen, s = Schlange) */
  var SEQ = 'vvevseevvvevsvvvve';
  var START = 25;
  var OPTIONS = [3, 7, 17, 31];
  var RIGHT = 7;

  function step(n, k) {
    if (k === 'v') return n + 2;
    if (k === 'e') return n > 0 ? n - 1 : 0;
    return 0;
  }
  function run() {
    var n = START;
    for (var i = 0; i < SEQ.length; i++) n = step(n, SEQ[i]);
    return n;
  }
  function pic(k, cls) {
    var a = ANIMAL[k];
    return h('img', { class: cls || 't-baum23-pic', src: A + a.img, alt: a.name, width: a.w, height: a.hgt, draggable: 'false' });
  }
  function inl(k) {
    var a = ANIMAL[k];
    return '<img class="t-baum23-inl" src="' + A + a.img + '" alt="' + a.name + '" width="' + Math.round(a.w * 0.8) + '" height="' + Math.round(a.hgt * 0.8) + '">';
  }

  var el, api, locked, picked, mode, crossed;
  var seqEl, optsEl;

  function describeSeq() {
    return SEQ.split('').map(function (k) { return ANIMAL[k].name; }).join(', ');
  }

  function renderSeq() {
    var kids = SEQ.split('').map(function (k, i) {
      var on = !!crossed[i];
      return h('button', {
        type: 'button', class: 't-baum23-an' + (on ? ' done' : ''), 'data-i': String(i), 'aria-pressed': String(on), disabled: locked,
        'aria-label': (i + 1) + '. Besuch: ' + ANIMAL[k].name + (on ? ' (abgehakt)' : '')
      }, pic(k));
    });
    seqEl.replaceChildren.apply(seqEl, kids);
  }

  function optionCard(v, idx) {
    var sel = picked === v;
    var cls = 't-baum23-opt';
    var mark = '';
    if (mode && (mode === 'solution' ? v === RIGHT : sel)) {
      var ok = v === RIGHT;
      cls += ok ? ' right' : ' wrong';
      mark = ok ? '✓' : '✗';
    }
    var input = h('input', { type: 'radio', name: 't-baum23-opt', value: String(v), disabled: locked, 'aria-label': 'Antwort ' + 'ABCD'[idx] + ': ' + v + ' Äpfel' });
    input.checked = sel;
    return h('label', { class: cls }, input,
      h('span', { class: 't-baum23-card' },
        h('span', { class: 't-baum23-let' }, 'ABCD'[idx] + ')'),
        h('span', { class: 't-baum23-num' }, v + ' Äpfel'),
        mark ? h('span', { class: 't-baum23-mark', 'aria-hidden': 'true' }, mark) : null));
  }
  function renderOpts() {
    optsEl.replaceChildren.apply(optsEl, OPTIONS.map(optionCard));
  }

  function onSeqClick(e) {
    var b = e.target.closest('[data-i]');
    if (!b || locked) return;
    var i = +b.getAttribute('data-i');
    crossed[i] = !crossed[i];
    renderSeq();
    var nb = seqEl.querySelector('[data-i="' + i + '"]');
    if (nb) nb.focus();
  }
  function onChange(e) {
    if (locked || !e.target.matches('input[type=radio]')) return;
    picked = +e.target.value;
    renderOpts();
    var f = optsEl.querySelector('input:checked'); if (f) f.focus();
    api.changed('Antwort ' + 'ABCD'[OPTIONS.indexOf(picked)] + ' gewählt.');
  }

  function traceHtml() {
    var last = SEQ.lastIndexOf('s');
    var rows = '<li><span class="t-baum23-tn">' + pic('s', 't-baum23-tp') .outerHTML + '</span><span>Schlange: alle Äpfel verschwinden</span><b>0</b></li>';
    var n = 0;
    for (var i = last + 1; i < SEQ.length; i++) {
      var k = SEQ[i];
      n = step(n, k);
      rows += '<li><span class="t-baum23-tn">' + pic(k, 't-baum23-tp').outerHTML + '</span><span>' +
        (k === 'v' ? 'Vogel: +2 Äpfel' : 'Eichhörnchen: −1 Apfel') + '</span><b>' + n + '</b></li>';
    }
    return '<ol class="t-baum23-trace" aria-label="Rechenweg nach der letzten Schlange">' + rows + '</ol>';
  }

  Biber.register({
    id: 'baum23',
    story: '<p>Jona hat einen besonderen Apfelbaum im Garten:</p>' +
      '<ul class="t-baum23-rules">' +
      '<li>Landet ein Vogel ' + inl('v') + ' auf dem Baum, wachsen sofort <b>zwei neue Äpfel</b>.</li>' +
      '<li>Klettert ein Eichhörnchen ' + inl('e') + ' auf den Baum, fällt <b>ein Apfel</b> runter. Wenn kein Apfel am Baum hängt, passiert nichts.</li>' +
      '<li>Besucht eine Schlange ' + inl('s') + ' den Baum, verschwinden <b>alle Äpfel</b> sofort.</li></ul>' +
      '<p>Heute Morgen hängen 25 Äpfel am Baum. Dann besuchen einige Tiere nacheinander den Baum, zuletzt ein Eichhörnchen. Jona hat ihre Reihenfolge genau aufgeschrieben:</p>',
    question: 'Wie viele Äpfel hängen danach am Baum?',
    howto: 'Die Reihenfolge der Besuche läuft von links nach rechts und dann Zeile für Zeile. Wähle eine Antwort aus. Du kannst Tiere antippen, um sie als erledigt abzuhaken. Das ist nur eine Gedankenstütze und zählt nicht zur Antwort.',
    explanation: function () {
      return '<p>Eine Schlange lässt alle Äpfel verschwinden. Deshalb zählt nur, was nach der <b>letzten Schlange</b> passiert. ' +
        'Danach hängen 0 Äpfel am Baum; vier Vögel bringen 4 × 2 = 8 Äpfel, und das letzte Eichhörnchen nimmt einen weg: 8 − 1 = 7.</p>' +
        traceHtml() +
        '<p><b>Informatik:</b> Die Anzahl der Äpfel ist der <i>Zustand</i> des Baums. Jeder Tierbesuch ist wie eine Anweisung, die diesen Zustand ändert. ' +
        'Ein Programm speichert seinen Zustand in <i>Variablen</i>; hier genügt eine einzige. Wer die Anweisungen genau analysiert, entdeckt Abkürzungen, ' +
        'zum Beispiel dass man alles vor der letzten Schlange nicht betrachten muss.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null; crossed = {};
      seqEl = h('div', { class: 't-baum23-seq', role: 'group', 'aria-label': 'Reihenfolge der Besuche, 18 Tiere: ' + describeSeq() });
      optsEl = h('div', { class: 't-baum23-opts', role: 'radiogroup', 'aria-label': 'Antworten' });
      el.replaceChildren(h('div', { class: 't-baum23-box' },
        h('div', { class: 't-baum23-strip' },
          h('div', { class: 't-baum23-start' }, h('b', null, '25'), ' Äpfel am Morgen'),
          seqEl),
        optsEl));
      seqEl.addEventListener('click', onSeqClick);
      optsEl.addEventListener('change', onChange);
      renderSeq(); renderOpts();
    },
    isComplete: function () { return picked !== null; },
    evaluate: function () { return { correct: picked === RIGHT, answer: picked }; },
    setAnswer: function (ans) { picked = typeof ans === 'number' ? ans : null; mode = 'check'; renderOpts(); },
    lock: function (on) {
      locked = on;
      mode = on ? (mode || 'check') : null;
      renderSeq(); renderOpts();
    },
    reset: function () { picked = null; mode = null; crossed = {}; renderSeq(); renderOpts(); },
    showSolution: function () { picked = RIGHT; mode = 'solution'; locked = true; renderSeq(); renderOpts(); }
  });
  if (run() !== RIGHT) throw new Error('baum23: Lösung stimmt nicht');
})();
