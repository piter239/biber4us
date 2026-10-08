/* Aufgabe Murmelband (Heft 2021, S. 40; Klasse 9-10 schwer, 11-13 mittel): Biber trägt Murmeln nach rechts */
(function () {
  'use strict';
  var h = Biber.h;

  /* ---------- Aufgabendaten ---------- */
  var N = 8;                         /* Felder auf dem Band */
  var START = [3, 4, 6];             /* heute liegen die Murmeln auf diesen Feldern */
  var OPTS = [
    { k: 'A', m: [3, 5, 6] },
    { k: 'B', m: [4, 5, 6] },
    { k: 'C', m: [4, 5, 7] },
    { k: 'D', m: [5, 6, 7] },
    { k: 'E', m: [4, 6, 7] }
  ];
  var RIGHT = 'C';

  /* Der Biber läuft Feld für Feld von links nach rechts:
     Trägt er nichts und liegt hier eine Murmel, hebt er sie auf.
     Trägt er eine Murmel und das Feld ist frei, legt er sie hier ab; ist es belegt, trägt er weiter. */
  function simulate(marbles, n) {
    var set = {}, carrying = false, steps = [];
    marbles.forEach(function (m) { set[m] = true; });
    function snap(f, note) {
      steps.push({ f: f, carrying: carrying, marbles: Object.keys(set).map(Number).sort(function (a, b) { return a - b; }), note: note });
    }
    snap(1, 'start');
    for (var f = 1; f <= n; f++) {
      var note = '';
      if (carrying && !set[f]) { set[f] = true; carrying = false; note = 'ab'; }
      else if (carrying) note = 'weiter';
      else if (set[f]) { delete set[f]; carrying = true; note = 'auf'; }
      if (f > 1) snap(f, note);
    }
    return steps;
  }
  var STEPS = simulate(START, N);
  var RESULT = STEPS[STEPS.length - 1].marbles;
  function listText(m) { return m.length ? 'Feld ' + m.join(', ') : 'keine Murmel'; }

  /* ---------- Zeichnen ---------- */
  var FW = 56;                       /* Breite eines Feldes im SVG */
  function cx(i) { return 4 + (i - 1) * FW + FW / 2; }
  function marble(x, y, r) {
    return '<g class="t-murmelband21-marble" transform="translate(' + x + ' ' + y + ')"><circle r="' + r + '" class="t-murmelband21-glass"/>' +
      '<path d="M-' + (r * 0.55) + ' ' + (r * 0.25) + ' C-' + (r * 0.2) + ' -' + (r * 0.35) + ' ' + (r * 0.45) + ' -' + (r * 0.1) + ' ' + (r * 0.7) + ' ' + (r * 0.05) +
      ' C' + (r * 0.3) + ' ' + (r * 0.5) + ' -' + (r * 0.3) + ' ' + (r * 0.6) + ' -' + (r * 0.55) + ' ' + (r * 0.25) + 'Z" class="t-murmelband21-swirl"/>' +
      '<circle cx="-' + (r * 0.4) + '" cy="-' + (r * 0.45) + '" r="' + (r * 0.22) + '" class="t-murmelband21-shine"/></g>';
  }
  function beaver(x, y, carrying) {
    return '<g transform="translate(' + x + ' ' + y + ')" class="t-murmelband21-beaver">' +
      '<ellipse cx="-15" cy="-17" rx="8" ry="14" transform="rotate(14 -15 -17)" class="t-murmelband21-tail"/>' +
      '<ellipse cx="0" cy="-20" rx="12" ry="17" class="t-murmelband21-body"/>' +
      '<ellipse cx="3" cy="-17" rx="7" ry="12" class="t-murmelband21-belly"/>' +
      '<rect x="-9" y="-5" width="7" height="5" rx="2" class="t-murmelband21-body"/><rect x="2" y="-5" width="8" height="5" rx="2" class="t-murmelband21-body"/>' +
      '<circle cx="4" cy="-42" r="10.5" class="t-murmelband21-body"/><circle cx="-3" cy="-51" r="3.6" class="t-murmelband21-body"/>' +
      '<ellipse cx="9" cy="-39" rx="6" ry="4.5" class="t-murmelband21-belly"/><circle cx="13.5" cy="-41" r="2.4" class="t-murmelband21-nose"/>' +
      '<rect x="9" y="-36.5" width="5" height="5.5" rx="1" class="t-murmelband21-tooth"/><circle cx="7" cy="-46" r="1.7" class="t-murmelband21-nose"/>' +
      (carrying ? marble(12, -22, 9.5) : '') + '</g>';
  }
  /* Band mit n Feldern: beaver = Feld des Bibers (oder 'ende'), carrying = trägt er eine Murmel */
  function bandSVG(o) {
    var n = o.n || N, w = n * FW + 8 + 44, s = '';
    s += '<rect x="0" y="52" width="' + (n * FW + 8) + '" height="26" class="t-murmelband21-track"/>';
    for (var i = 1; i <= n; i++) {
      var x0 = 4 + (i - 1) * FW;
      s += '<path d="M' + (x0 + 10) + ' 57 L' + (x0 + FW - 2) + ' 57 L' + (x0 + FW - 10) + ' 75 L' + (x0 + 2) + ' 75 Z" class="t-murmelband21-field"/>';
    }
    o.marbles.forEach(function (m) { s += marble(cx(m) + 3, 52, 11); });
    if (o.beaver != null) {
      var bx = o.beaver === 'ende' ? n * FW + 32 : cx(o.beaver) - 6;
      s += beaver(bx, 77, !!o.carrying);
    }
    return '<svg class="t-murmelband21-band" viewBox="0 0 ' + w + ' 84" role="img" aria-label="' + (o.label || '').replace(/"/g, '') + '" focusable="false">' + s + '</svg>';
  }
  function bandLabel(o) {
    var who = o.beaver == null ? '' : o.beaver === 'ende' ? 'Der Biber ist am rechten Ende angekommen. ' : 'Der Biber steht auf Feld ' + o.beaver + (o.carrying ? ' und trägt eine Murmel' : '') + '. ';
    return who + 'Murmeln: ' + listText(o.marbles) + '.';
  }
  function band(o) { o.label = bandLabel(o); return bandSVG(o); }

  /* ---------- Regel-Beispiele (wie im Heft) ---------- */
  function ruleCard(title, text, rows) {
    return h('div', { class: 't-murmelband21-rule' },
      h('h3', null, title), h('p', null, text),
      rows.map(function (r) { var d = h('div', { class: 't-murmelband21-row' }); d.innerHTML = band(r); return d; }));
  }
  function rules() {
    return h('div', { class: 't-murmelband21-rules' },
      ruleCard('Er trägt noch nichts', '… hebt er die Murmel auf und legt sie auf dem nächsten freien Feld ab.', [
        { n: 4, marbles: [2], beaver: 1 },
        { n: 4, marbles: [], beaver: 2, carrying: true },
        { n: 4, marbles: [3], beaver: 3 }
      ]),
      ruleCard('Er trägt schon eine Murmel', '… trägt er sie weiter, bis er ein freies Feld findet, und legt sie dort ab.', [
        { n: 4, marbles: [2, 3], beaver: 1 },
        { n: 4, marbles: [3], beaver: 2, carrying: true },
        { n: 4, marbles: [3, 4], beaver: 4 }
      ]));
  }

  /* ---------- Zustand ---------- */
  var el, api, choice, locked, mode;   /* mode: null | 'check' | 'solution' */

  function render() {
    var start = h('div', { class: 't-murmelband21-start' }, h('h3', null, 'Heute liegen drei Murmeln so auf dem Band'));
    var sd = h('div', { class: 't-murmelband21-row' }); sd.innerHTML = band({ marbles: START, beaver: 1 });
    start.appendChild(sd);

    var opts = OPTS.map(function (o) {
      var cls = 't-murmelband21-opt';
      var mark = null;
      if (choice === o.k) cls += ' sel';
      if (mode === 'check' && choice === o.k) {
        cls += o.k === RIGHT ? ' right' : ' wrong';
        mark = h('span', { class: 't-murmelband21-mark', 'aria-hidden': 'true' }, o.k === RIGHT ? '✓' : '✗');
      }
      if (mode === 'solution' && o.k === RIGHT) { cls += ' right'; mark = h('span', { class: 't-murmelband21-mark', 'aria-hidden': 'true' }, '✓'); }
      var pic = h('span', { class: 't-murmelband21-pic' });
      pic.innerHTML = bandSVG({ marbles: o.m, beaver: 'ende', label: 'Antwort ' + o.k + ': ' + listText(o.m) });
      var input = h('input', { type: 'radio', name: 't-murmelband21-ans', value: o.k, class: 't-murmelband21-radio', disabled: locked, 'aria-label': 'Antwort ' + o.k + ': ' + listText(o.m) });
      if (choice === o.k) input.checked = true;
      input.addEventListener('change', function () { if (locked) return; choice = o.k; render(); api.changed(); focusChoice(); });
      return h('label', { class: cls }, input, h('span', { class: 't-murmelband21-letter', 'aria-hidden': 'true' }, o.k + ')'), pic, mark);
    });
    el.replaceChildren(h('div', { class: 't-murmelband21-board' },
      rules(), start,
      h('fieldset', { class: 't-murmelband21-opts' }, h('legend', null, 'Wie liegen die Murmeln, nachdem der Biber das Band überquert hat?'), opts)));
  }
  function focusChoice() {
    var r = el.querySelector('input:checked');
    if (r && document.activeElement !== r && !locked) r.focus({ preventScroll: true });
  }

  function walk() {
    var rows = STEPS.map(function (s, i) {
      var txt = i === 0 ? 'Start' : 'Feld ' + s.f + (s.note === 'auf' ? ': Murmel aufgehoben' : s.note === 'ab' ? ': Murmel abgelegt' : s.note === 'weiter' ? ': Feld belegt, er trägt weiter' : '');
      return { txt: txt, svg: band({ marbles: s.marbles, beaver: s.f, carrying: s.carrying }) };
    });
    rows.push({ txt: 'Am Ziel', svg: band({ marbles: RESULT, beaver: 'ende' }) });
    return '<ol class="t-murmelband21-walk">' + rows.map(function (r) {
      return '<li><span class="t-murmelband21-wtxt">' + r.txt + '</span>' + r.svg + '</li>';
    }).join('') + '</ol>';
  }

  Biber.register({
    id: 'murmelband21',
    story: '<p>Der Biber spielt gerne mit dem Murmelband. Das Band hat Felder, und darauf können Murmeln liegen, höchstens eine pro Feld. ' +
      'Der Biber überquert das Band von links nach rechts und trägt dabei manche Murmeln auf andere Felder. Er kann aber immer nur eine Murmel tragen.</p>' +
      '<p>Wenn der Biber auf ein Feld mit einer Murmel kommt und <b>keine Murmel trägt</b>, hebt er sie auf, trägt sie zum nächsten freien Feld und legt sie dort ab. ' +
      'Wenn er <b>schon eine Murmel trägt</b>, trägt er sie weiter zum nächsten freien Feld und legt sie dort ab.</p>',
    question: 'Wie liegen die Murmeln, nachdem der Biber das Murmelband überquert hat?',
    howto: 'Wähle die Antwort, die zeigt, wie die drei Murmeln am Ende liegen.',
    explanation: function () {
      return '<p>Der Biber geht Feld für Feld nach rechts. Auf Feld 3 hebt er die erste Murmel auf. Feld 4 ist belegt, also trägt er weiter und legt sie auf Feld 5 ab. ' +
        'Dann hebt er die Murmel von Feld 6 auf und legt sie auf Feld 7 ab. Am Ende liegen die Murmeln auf den Feldern 4, 5 und 7: Antwort C.</p>' + walk() +
        '<p>Der Biber verhält sich wie der Schreib-Lese-Kopf einer Turingmaschine: Er wandert über ein Band, merkt sich mit „trägt eine Murmel“ oder „trägt keine“ seinen Zustand ' +
        'und ändert je nach Zustand und Feldinhalt das Band.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; choice = null; mode = null;
      render();
    },
    isComplete: function () { return choice != null; },
    evaluate: function () { return { correct: choice === RIGHT, answer: { choice: choice } }; },
    setAnswer: function (ans) { choice = ans && ans.choice; mode = 'check'; render(); },
    lock: function (on) {
      locked = on;
      mode = on ? (mode === 'solution' ? 'solution' : 'check') : null;
      render();
    },
    reset: function () { choice = null; locked = false; mode = null; render(); },
    showSolution: function () { choice = RIGHT; locked = true; mode = 'solution'; render(); }
  });
})();
