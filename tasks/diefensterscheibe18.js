/* Aufgabe Die Fensterscheibe (Biber 2018, Seite 26): Logikrätsel mit Wahrheit und Lüge */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-diefensterscheibe18';
  var ASSET = 'assets/diefensterscheibe18/';

  /* Kinder in Reihenfolge wie im Heft; h = Höhe der Zeichnung (Einheit: gleiche Skala), w = Breite */
  var KIDS = [
    { id: 'marko', name: 'Marko', say: 'Ich habe die Fensterscheibe nicht kaputt gemacht.', w: 245, hh: 694, alt: 'Marko, Junge mit blauem Pullover und brauner Hose',
      claim: function (t) { return t !== 'marko'; } },
    { id: 'iva', name: 'Iva', say: 'Marko oder David haben die Fensterscheibe kaputt gemacht.', w: 231, hh: 641, alt: 'Iva, Mädchen mit blonden Haaren und lila Kleid',
      claim: function (t) { return t === 'marko' || t === 'david'; } },
    { id: 'david', name: 'David', say: 'Maja, du lügst!', w: 227, hh: 702, alt: 'David, Junge mit dunklen Locken und grünem Kapuzenpulli',
      claim: function (t) { return !KIDS[3].claim(t); } },
    { id: 'maja', name: 'Maja', say: 'David hat die Fensterscheibe kaputt gemacht.', w: 187, hh: 642, alt: 'Maja, Mädchen mit roten Zöpfen und pinkem Top',
      claim: function (t) { return t === 'david'; } }
  ];
  var MAXH = 702;

  /* Modell: Täter t, "unsicheres" Kind u. Die drei anderen sagen die Wahrheit. */
  var SOLUTIONS = [];
  KIDS.forEach(function (c) {
    KIDS.forEach(function (u) {
      var ok = KIDS.every(function (k) { return k === u || k.claim(c.id); });
      if (ok) SOLUTIONS.push({ culprit: c.id, unsure: u.id });
    });
  });
  var CULPRITS = SOLUTIONS.map(function (s) { return s.culprit; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
  var RIGHT = CULPRITS.length === 1 ? CULPRITS[0] : null;   /* david */
  var LIAR = SOLUTIONS.length === 1 ? SOLUTIONS[0].unsure : null;

  var el, api, locked, sel, mark, btns;

  function reset() { sel = null; mark = null; }

  function truthful(k) { return RIGHT ? k.claim(RIGHT) : true; }

  function render() {
    btns.forEach(function (b, i) {
      var k = KIDS[i], on = sel === k.id, ok = k.id === RIGHT;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = (sel === null ? i === 0 : on) ? 0 : -1;
      b.setAttribute('aria-disabled', locked ? 'true' : 'false');
      b.className = P + '-kid' + (on ? ' selected' : '') + (on && mark === 'check' ? (ok ? ' right' : ' wrong') : '') + (on && mark === 'solution' ? ' right' : '');
      var m = b.querySelector('.' + P + '-mark');
      if (m) m.remove();
      if (on && mark) b.appendChild(h('span', { class: P + '-mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
      var tag = b.querySelector('.' + P + '-tag');
      tag.textContent = mark ? (truthful(k) ? 'sagt die Wahrheit' : 'sagt die Unwahrheit') : '';
      tag.className = P + '-tag' + (mark ? (truthful(k) ? ' t' : ' f') : '');
    });
  }
  function choose(i, focus) {
    if (locked) return;
    sel = KIDS[i].id;
    render();
    if (focus) btns[i].focus();
    api.changed();
  }
  function onKey(e) {
    var k = e.key, i = btns.indexOf(e.currentTarget), to = null;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % btns.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + btns.length - 1) % btns.length;
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }

  Biber.register({
    id: 'diefensterscheibe18',
    story: '<p>Maja, David, Iva und Marko spielen Fußball bei Annas Haus. Auf einmal geht eine Fensterscheibe kaputt. Anna fragt die vier Kinder, wer es war.</p>' +
      '<p>Anna weiß, dass drei von ihnen immer die Wahrheit sagen. Bei dem vierten Kind weiß sie es nicht.</p>',
    question: 'Wer hat die Fensterscheibe kaputt gemacht?',
    howto: 'Lies genau durch, was die Kinder sagen. Tippe dann auf ein Kind, um es auszuwählen.',
    explanation: function () {
      return '<p>Es war <strong>David</strong>. Die Aussagen von Maja und David können nicht gleichzeitig wahr sein: Maja sagt, David war es, David sagt, dass Maja lügt, also dass David es nicht war. Eines dieser beiden Kinder sagt also die Unwahrheit. Damit weiß Anna, dass Iva und Marko die Wahrheit sagen.</p>' +
        '<p>Iva sagt, es war Marko oder David. Marko sagt die Wahrheit, er war es also nicht. Es bleibt nur David übrig.</p>' +
        '<p><em>Informatik:</em> Jede Aussage der Kinder ist entweder wahr oder falsch. Mit solchen Aussagen kann man rechnen, das hat George Boole 1847 als Erster beschrieben (Aussagenlogik). Aus wahren Aussagen lassen sich neue wahre Aussagen herleiten, ohne über den Sinn nachzudenken. Auch Computer arbeiten so: Ein Bit kennt nur zwei Werte, und einfache logische Regeln lassen sich in Schaltungen bauen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      btns = KIDS.map(function (k, i) {
        var ratio = k.hh / MAXH;
        var pic = h('span', { class: P + '-pic' },
          h('img', { src: ASSET + k.id + '.svg', alt: '', width: k.w, height: k.hh, draggable: 'false', style: '--k:' + ratio.toFixed(3) }),
          k.id === 'marko' ? h('img', { class: P + '-ball', src: ASSET + 'ball.svg', alt: '', width: 97, height: 96, draggable: 'false', style: '--k:' + (96 / MAXH).toFixed(3) }) : null);
        return h('button', {
          type: 'button', role: 'radio', 'aria-checked': 'false',
          'aria-label': k.name + '. ' + k.name + ' sagt: ' + k.say,
          onclick: function () { choose(i, false); }, onkeydown: onKey
        }, h('span', { class: P + '-say', 'aria-hidden': 'true' }, k.say), pic,
          h('span', { class: P + '-name', 'aria-hidden': 'true' }, k.name),
          h('span', { class: P + '-tag', 'aria-hidden': 'true' }));
      });
      el.replaceChildren(h('div', { class: P + '-board', role: 'radiogroup', 'aria-label': 'Wer hat die Fensterscheibe kaputt gemacht?' }, btns));
      render();
    },
    isComplete: function () { return sel !== null; },
    evaluate: function () { return { correct: sel === RIGHT, answer: { choice: sel } }; },
    setAnswer: function (ans) {
      var ok = ans && KIDS.some(function (k) { return k.id === ans.choice; });
      sel = ok ? ans.choice : null;
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      sel = RIGHT; mark = 'solution'; locked = true;
      render();
    }
  });
})();
