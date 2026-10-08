/* Aufgabe Muttern und Schrauben (Biber 2022, Heft S. 42): Kellerautomat / wohlgeformte Klammern */
(function () {
  'use strict';
  var h = Biber.h;

  // n = Mutter, s = Schraube (von links nach rechts auf dem Fließband), nach den Abbildungen im Heft
  var OPTS = [
    { id: 'A', seq: 'nssnnnnsss' },
    { id: 'B', seq: 'nnsnnssssn' },
    { id: 'C', seq: 'nsnnsnnsss' },
    { id: 'D', seq: 'nnssnsnnns' }
  ];
  var RIGHT = 'C';
  var BY = {};
  OPTS.forEach(function (o) { BY[o.id] = o; });

  // Simulation von Bens Verfahren: Eimer zählt die Muttern, Kasten die fertigen Teile
  function run(seq) {
    var bucket = 0, box = 0, rows = [{ box: 0, bucket: 0, rest: seq }];
    for (var i = 0; i < seq.length; i++) {
      if (seq[i] === 'n') bucket++;
      else {
        if (bucket === 0) return { ok: false, at: i, why: 'schraube', rows: rows };
        bucket--; box++;
      }
      rows.push({ box: box, bucket: bucket, rest: seq.slice(i + 1) });
    }
    if (bucket > 0) return { ok: false, at: seq.length - 1, why: 'rest', left: bucket, rows: rows };
    return { ok: true, rows: rows };
  }

  /* ---- Bauteile als SVG ---- */
  var W = 32, H = 62;
  function nut(x) {
    var cx = x + 15, y = H - 4;
    return '<g class="t-muttern22-nut" transform="translate(' + cx + ',' + y + ')">' +
      '<path class="t-muttern22-side" d="M-13,-8 L-13,-1 L-7,3 L7,3 L13,-1 L13,-8 Z"/>' +
      '<path class="t-muttern22-top" d="M-13,-8 L-6,-15 L6,-15 L13,-8 L6,-1 L-6,-1 Z"/>' +
      '<ellipse class="t-muttern22-hole" cx="0" cy="-8" rx="6" ry="3.5"/></g>';
  }
  function screw(x) {
    var cx = x + 15, y = H - 4, t = '';
    for (var k = 0; k < 7; k++) t += '<path class="t-muttern22-thread" d="M-5,' + (-52 + k * 6.5) + ' L5,' + (-50 + k * 6.5) + '"/>';
    return '<g class="t-muttern22-screw" transform="translate(' + cx + ',' + y + ')">' +
      '<rect class="t-muttern22-shaft" x="-5" y="-54" width="10" height="42" rx="2.5"/>' + t +
      '<path class="t-muttern22-side" d="M-11,-12 L-11,-2 Q0,5 11,-2 L11,-12 Z"/>' +
      '<ellipse class="t-muttern22-top" cx="0" cy="-12" rx="11" ry="4.5"/></g>';
  }
  var NAME = { n: 'Mutter', s: 'Schraube' };
  function strip(seq, mark) {
    var s = '<svg class="t-muttern22-strip" viewBox="0 -16 ' + (seq.length * W) + ' ' + (H + 16) + '" aria-hidden="true" focusable="false">';
    for (var i = 0; i < seq.length; i++) s += seq[i] === 'n' ? nut(i * W) : screw(i * W);
    if (mark != null) {
      var mx = mark * W + 16;
      s += '<path class="t-muttern22-arrow" d="M' + (mx - 9) + ',-14 L' + (mx + 9) + ',-14 L' + mx + ',-1 Z"/>';
    }
    return s + '</svg>';
  }
  function words(seq) {
    return seq.split('').map(function (c) { return NAME[c]; }).join(', ');
  }

  var el, api, chosen, locked, mark;   // mark: null | 'check' | 'solution'

  function render() {
    var cards = OPTS.map(function (o) {
      var cls = 't-muttern22-card';
      var m = null;
      if (mark === 'check' && chosen === o.id) cls += o.id === RIGHT ? ' right' : ' wrong';
      if (mark && o.id === RIGHT && (mark === 'solution' || chosen === o.id)) cls += ' right';
      if (mark && chosen === o.id) m = h('span', { class: 't-muttern22-mark', 'aria-hidden': 'true' }, o.id === RIGHT ? '✓' : '✗');
      if (mark === 'solution' && o.id === RIGHT) m = h('span', { class: 't-muttern22-mark', 'aria-hidden': 'true' }, '✓');
      var input = h('input', {
        type: 'radio', name: 't-muttern22-opt', value: o.id, class: 't-muttern22-radio',
        checked: chosen === o.id, disabled: locked,
        'aria-label': 'Folge ' + o.id + ': ' + words(o.seq)
      });
      var lab = h('label', { class: cls }, input,
        h('span', { class: 't-muttern22-letter', 'aria-hidden': 'true' }, o.id), m);
      var f = h('span', { class: 't-muttern22-figure' });
      f.innerHTML = strip(o.seq);
      lab.appendChild(f);
      return lab;
    });
    el.replaceChildren(h('div', { class: 't-muttern22-board', role: 'radiogroup', 'aria-label': 'Vier Folgen von Muttern und Schrauben' }, cards));
  }

  function onChange(e) {
    var t = e.target;
    if (!t || t.name !== 't-muttern22-opt' || locked) return;
    chosen = t.value;
    render();
    var again = el.querySelector('input[value="' + chosen + '"]');
    if (again) again.focus({ preventScroll: true });
    api.changed();
  }

  function explain() {
    var out = '<p>Ben darf nie eine Schraube nehmen, wenn der Eimer leer ist, und am Ende muss der Eimer leer sein. ' +
      'Man verfolgt also, wie viele Muttern im Eimer liegen: Eine Mutter erhöht die Zahl um 1, eine Schraube verringert sie um 1 ' +
      '(sie bekommt eine Mutter). Die Zahl darf nie unter 0 fallen und muss am Ende genau 0 sein.</p>';
    out += '<ul class="t-muttern22-why">' + OPTS.map(function (o) {
      var r = run(o.seq), txt;
      if (r.ok) txt = 'Der Eimer ist nie leer, wenn eine Schraube kommt, und am Ende ist er leer. Ben schafft die ganze Folge ohne Fehler.';
      else if (r.why === 'schraube') txt = 'Fehler beim markierten Teil: Ben nimmt eine Schraube, aber der Eimer ist leer.';
      else txt = 'Fehler am Ende: Alle Teile sind verarbeitet, aber es liegen noch ' + r.left + ' Muttern im Eimer.';
      return '<li class="' + (r.ok ? 'ok' : 'bad') + '"><strong>' + o.id + (r.ok ? ' ✓' : '') + '</strong>' +
        '<span class="t-muttern22-figure">' + strip(o.seq, r.ok ? null : (r.why === 'schraube' ? r.at : null)) + '</span>' +
        '<span>' + txt + '</span></li>';
    }).join('') + '</ul>';
    var rows = run(BY[RIGHT].seq).rows;
    out += '<p>So sieht das bei Folge C Schritt für Schritt aus (Zahl der Muttern im Eimer und der fertigen Teile im Kasten):</p>' +
      '<div class="t-muttern22-tablewrap"><table class="t-muttern22-table"><caption class="t-muttern22-sr">Zustände bei Folge C</caption>' +
      '<thead><tr><th>Schritt</th><th>Eimer</th><th>Kasten</th></tr></thead><tbody>' +
      rows.map(function (r, i) {
        return '<tr><td>' + (i === 0 ? 'Start' : i + '. ' + NAME[BY[RIGHT].seq[i - 1]]) + '</td><td>' + r.bucket + '</td><td>' + r.box + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    out += '<p><strong>Informatik:</strong> Der Eimer ist ein einfacher Speicher, wie ihn ein <em>Kellerautomat</em> benutzt (dort mit fester Reihenfolge nach dem Prinzip „last in, first out“). ' +
      'Stellt man sich Mutter als „(“ und Schraube als „)“ vor, dann geht Ben nur dann ohne Fehler durch, wenn die Folge ein wohlgeformter Klammerausdruck ist. ' +
      'Solche Prüfungen braucht zum Beispiel ein Compiler, wenn er Programmtexte mit geschachtelten Klammern übersetzt.</p>';
    return out;
  }

  Biber.register({
    id: 'muttern22',
    story: '<p>Ben steht am Fließband und verarbeitet Bauteile: <strong>Muttern</strong> und <strong>Schrauben</strong>. Er geht strikt nach diesem Verfahren vor:</p>' +
      '<ul><li>Ben nimmt das nächste Bauteil vom Fließband herunter.</li>' +
      '<li>Wenn es eine <strong>Mutter</strong> ist, legt er sie in den Eimer.</li>' +
      '<li>Wenn es eine <strong>Schraube</strong> ist, nimmt er eine Mutter aus dem Eimer, schraubt sie auf die Schraube und legt das fertige Teil in den Kasten.</li></ul>' +
      '<p>Dabei können zwei Fehler auftreten:</p>' +
      '<ol><li>Ben nimmt eine Schraube vom Fließband, aber es ist keine Mutter im Eimer, die er aufschrauben könnte.</li>' +
      '<li>Ben hat alle Bauteile vom Fließband verarbeitet, aber es sind immer noch Muttern im Eimer.</li></ol>' +
      '<p>Der Eimer ist ausreichend groß und zu Beginn leer.</p>',
    question: 'Welche Folge von Muttern und Schrauben kann Ben ohne Fehler von links nach rechts verarbeiten?',
    howto: 'Tippe die Folge an, die du für richtig hältst. Ben verarbeitet jede Folge von links nach rechts.',
    explanation: explain,
    mount: function (root, a) {
      el = root; api = a; locked = false; chosen = null; mark = null;
      el.addEventListener('change', onChange);
      render();
    },
    isComplete: function () { return !!chosen; },
    evaluate: function () { return { correct: chosen === RIGHT, answer: chosen }; },
    setAnswer: function (ans) {
      chosen = BY[ans] ? ans : null;
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      render();
    },
    reset: function () { chosen = null; mark = null; render(); },
    showSolution: function () {
      chosen = RIGHT; mark = 'solution'; locked = true;
      render();
    }
  });
})();
