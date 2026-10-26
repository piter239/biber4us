/* Aufgabe Klammerschmuck (Heft 2017, S. 29) - richtig geklammerte Armbänder erkennen */
(function () {
  'use strict';
  var h = Biber.h;

  /* Zeichen: g( g) = eckige Klammer auf/zu (grau), o( o) = geschweifte Klammer auf/zu (orange) */
  var FILE = { 'g(': 'eckig-auf', 'g)': 'eckig-zu', 'o(': 'geschweift-auf', 'o)': 'geschweift-zu' };
  var WORD = { 'g(': 'eckige Klammer auf', 'g)': 'eckige Klammer zu', 'o(': 'geschweifte Klammer auf', 'o)': 'geschweifte Klammer zu' };

  var OPTIONS = [
    { id: 'A', seq: ['o(', 'g(', 'o)', 'g)'] },
    { id: 'B', seq: ['g(', 'g(', 'g(', 'o)', 'o)', 'o)'] },
    { id: 'C', seq: ['g)', 'o)', 'g)', 'g(', 'o(', 'g('] },
    { id: 'D', seq: ['g(', 'o(', 'g(', 'g)', 'o)', 'g)'] }
  ];
  var EXAMPLES = [
    ['o(', 'o(', 'o)', 'o)', 'o(', 'o)'],
    ['o(', 'g(', 'o(', 'o)', 'g)', 'o)'],
    ['g(', 'o(', 'o)', 'o(', 'o(', 'o)', 'o)', 'g)']
  ];
  var CORRECT = 'D';

  /* Ein Armband ist genau dann herstellbar, wenn es aus ineinander oder nebeneinander eingefügten, gleichartigen Paaren besteht. */
  function valid(seq) {
    var st = [];
    for (var i = 0; i < seq.length; i++) {
      var t = seq[i];
      if (t.charAt(1) === '(') st.push(t.charAt(0));
      else if (!st.length || st.pop() !== t.charAt(0)) return false;
    }
    return seq.length > 0 && st.length === 0;
  }
  function imgHtml(t, cls) {
    return '<img class="' + cls + '" src="assets/klammerschmuck17/' + FILE[t] + '.png" alt="' + WORD[t] + '" height="56">';
  }
  function braceImg(t, cls) {
    return h('img', { class: cls, src: 'assets/klammerschmuck17/' + FILE[t] + '.png', alt: '', draggable: 'false' });
  }
  function describe(seq) { return seq.map(function (t) { return WORD[t]; }).join(', '); }

  var el, api, chosen, locked, mode;

  function render() {
    var list = OPTIONS.map(function (o) {
      var cls = 't-klammerschmuck17-opt' + (chosen === o.id ? ' chosen' : '');
      var mark = null;
      if (mode) {
        if (o.id === CORRECT && (mode === 'solution' || chosen === o.id)) { cls += ' right'; mark = h('span', { class: 't-klammerschmuck17-mark', 'aria-hidden': 'true' }, '✓'); }
        else if (chosen === o.id) { cls += ' wrong'; mark = h('span', { class: 't-klammerschmuck17-mark', 'aria-hidden': 'true' }, '✗'); }
      }
      return h('label', { class: cls },
        h('input', {
          type: 'radio', name: 't-klammerschmuck17', value: o.id, checked: chosen === o.id, disabled: locked,
          'aria-label': 'Armband ' + o.id + ': ' + describe(o.seq)
        }),
        h('span', { class: 't-klammerschmuck17-letter', 'aria-hidden': 'true' }, o.id + ')'),
        h('span', { class: 't-klammerschmuck17-band', 'aria-hidden': 'true' }, o.seq.map(function (t) { return braceImg(t, 't-klammerschmuck17-g'); })),
        mark);
    });
    el.replaceChildren(h('div', { class: 't-klammerschmuck17-opts', role: 'radiogroup', 'aria-label': 'Armbänder zur Auswahl' }, list));
  }

  function onChange(e) {
    if (locked || !e.target.matches('input[type=radio]')) return;
    chosen = e.target.value;
    render();
    var f = el.querySelector('input:checked');
    if (f) f.focus({ preventScroll: true });
    api.changed('Armband ' + chosen + ' gewählt.');
  }

  Biber.register({
    id: 'klammerschmuck17',
    story: function () {
      var pair = function (a, b) { return imgHtml(a, 't-klammerschmuck17-g') + imgHtml(b, 't-klammerschmuck17-g'); };
      return '<p>Die Firma „Klammerschmuck“ stellt Armbänder aus klammerförmigen Spangen her. ' +
        'Die Firma verwendet die Spangen immer paarweise und immer in der gleichen Anordnung.</p>' +
        '<p>Die Herstellung eines Armbands beginnt mit einem dieser Paare:</p>' +
        '<p class="t-klammerschmuck17-pairs"><span class="t-klammerschmuck17-pair">' + pair('g(', 'g)') + '</span> <span>oder</span> <span class="t-klammerschmuck17-pair">' + pair('o(', 'o)') + '</span></p>' +
        '<p>Danach werden wiederholt weitere Paare an beliebigen Stellen eingefügt. Hier sind Beispiele für drei verschiedene Armbänder:</p>' +
        '<p class="t-klammerschmuck17-examples">' + EXAMPLES.map(function (s) {
          return '<span class="t-klammerschmuck17-ex" role="img" aria-label="Beispiel-Armband: ' + describe(s) + '">' +
            s.map(function (t) { return imgHtml(t, 't-klammerschmuck17-g t-klammerschmuck17-small').replace(/ alt="[^"]*"/, ' alt=""'); }).join('') + '</span>';
        }).join('') + '</p>';
    }(),
    question: 'Welches der folgenden Armbänder wurde von der Firma „Klammerschmuck“ hergestellt?',
    howto: 'Tippe auf das Armband, das die Firma hergestellt haben kann.',
    explanation: function () {
      return '<p>Bei jedem Armband der Firma wurde ein Paar in ein anderes Paar hineingesteckt oder daneben gesetzt. Deshalb muss jede Spange, die sich öffnet, später von einer Spange der gleichen Art geschlossen werden, ' +
        'und die zuletzt geöffnete wird zuerst wieder geschlossen. <b>Armband D</b> stimmt: Es begann mit einem eckigen Paar, darin steckt ein geschweiftes Paar, und darin wieder ein eckiges Paar.</p>' +
        '<ul><li><b>A</b>: Die Paare überkreuzen sich. Die geschweifte Klammer schließt, bevor die eckige zu ist, die danach geöffnet wurde.</li>' +
        '<li><b>B</b>: Drei eckige Klammern öffnen sich, aber es schließen geschweifte. Die Arten passen nicht zusammen.</li>' +
        '<li><b>C</b>: Das Armband beginnt mit einer schließenden Klammer, die nie geöffnet wurde.</li></ul>' +
        '<p>Das ist Informatik: Auch in Programmiersprachen wie Java, C++ oder Python müssen Klammern immer richtig paarweise und ineinander „geschachtelt“ sein. ' +
        'Mit geschweiften Klammern fasst man zum Beispiel zusammengehörende Programmteile zusammen, mit eckigen Klammern bildet man in Python Listen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; chosen = null; mode = null;
      el.addEventListener('change', onChange);
      render();
    },
    isComplete: function () { return !!chosen; },
    evaluate: function () {
      var o = OPTIONS.filter(function (x) { return x.id === chosen; })[0];
      return { correct: !!o && valid(o.seq), answer: chosen };
    },
    setAnswer: function (ans) { chosen = typeof ans === 'string' ? ans : null; mode = 'check'; render(); },
    lock: function (on) { locked = on; mode = on ? 'check' : null; render(); },
    reset: function () { chosen = null; mode = null; render(); },
    showSolution: function () { chosen = CORRECT; locked = true; mode = 'solution'; render(); }
  });
})();
