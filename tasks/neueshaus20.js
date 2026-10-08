/* Aufgabe Neues Haus (Biber 2020; Klasse 7-8 schwer, 11-13 leicht): kleinste Zahl k bei der k-nächste-Nachbarn-Regel */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-neueshaus20-';

  /* Lage der Häuser (aus Heft S. 39 vermessen; Karte 668 x 450). c: b = blau, r = rot */
  var HOUSES = [
    { c: 'b', x: 58.0, y: 39.5 }, { c: 'b', x: 93.8, y: 171.1 }, { c: 'b', x: 110.9, y: 293.5 }, { c: 'b', x: 177.1, y: 180.7 },
    { c: 'b', x: 210.0, y: 383.5 }, { c: 'b', x: 220.2, y: 55.4 }, { c: 'b', x: 318.2, y: 186.9 }, { c: 'b', x: 333.3, y: 120.7 },
    { c: 'r', x: 373.2, y: 275.1 }, { c: 'r', x: 447.9, y: 226.8 }, { c: 'r', x: 457.6, y: 142.8 }, { c: 'r', x: 517.4, y: 291.3 },
    { c: 'r', x: 525.4, y: 378.7 }, { c: 'r', x: 558.0, y: 194.8 }, { c: 'r', x: 629.3, y: 244.3 }
  ];
  var NEW = { x: 369.7, y: 152.6 };
  HOUSES.forEach(function (o, i) { o.id = i; o.d = Math.hypot(o.x - NEW.x, o.y - NEW.y); });
  var ORDER = HOUSES.slice().sort(function (a, b) { return a.d - b.d; });   /* nach Entfernung zum neuen Haus */

  /* Regel: Mehrheit der k nächsten Häuser, sonst Mehrheit der k+1 nächsten */
  function decide(k) {
    function cnt(n) { var r = 0, b = 0; ORDER.slice(0, n).forEach(function (o) { if (o.c === 'r') r++; else b++; }); return [r, b]; }
    var c = cnt(k);
    if (c[0] === c[1]) c = cnt(k + 1);
    return c[0] > c[1] ? 'r' : 'b';
  }
  /* kleinstes k mit Entscheidung Rot (Heft: 4) */
  var ANSWER = (function () { for (var k = 1; k <= HOUSES.length; k++) if (decide(k) === 'r') return k; return null; })();
  var MAXK = HOUSES.length;

  var NAME = { b: 'Blaues Haus', r: 'Rotes Haus' };

  function houseShape(cls) {
    return '<path class="' + cls + '" d="M0 -19 L18 -3 L12 -3 L12 17 L-12 17 L-12 -3 L-18 -3 Z" stroke-linejoin="round"/><path class="' + P + 'door" d="M-3.5 17 V8 Q0 4 3.5 8 V17 Z"/>';
  }
  function legendIcon(cls) {
    return '<svg class="' + P + 'lg" viewBox="-22 -22 44 42" aria-hidden="true" focusable="false">' + houseShape(cls) + '</svg>';
  }

  var el, api, svgHost, kInput, noteEl, marks, k, locked, mode, focusId;

  function reset() { marks = []; k = null; mode = null; }
  function markNo(id) { var i = marks.indexOf(id); return i < 0 ? 0 : i + 1; }

  function draw() {
    var out = '<rect x="1" y="1" width="666" height="448" rx="10" class="' + P + 'map"/>';
    var list = HOUSES.slice().sort(function (a, b) { return a.y - b.y || a.x - b.x; });
    list.forEach(function (o) {
      var n = mode === 'solution' ? (ORDER.indexOf(o) < 5 ? ORDER.indexOf(o) + 1 : 0) : markNo(o.id);
      var cls = P + 'house ' + P + (o.c === 'b' ? 'blue' : 'red') + (n ? ' ' + P + 'marked' : '');
      out += '<g class="' + cls + '" data-id="' + o.id + '" transform="translate(' + o.x + ' ' + o.y + ')" role="button" tabindex="' + (o.id === focusId ? 0 : -1) +
        '" aria-label="' + NAME[o.c] + (n ? ', Nummer ' + n : '') + (locked ? '' : ', antippen zum Nummerieren') + '" aria-disabled="' + locked + '">' +
        '<rect x="-24" y="-26" width="48" height="50" class="' + P + 'hit"/>' + houseShape(P + 'body') +
        (n ? '<g class="' + P + 'badge" transform="translate(16 -22)"><circle r="12"/><text y="5" text-anchor="middle">' + n + '</text></g>' : '') + '</g>';
    });
    out += '<g class="' + P + 'newhouse" transform="translate(' + NEW.x + ' ' + NEW.y + ')" role="img" aria-label="Neues Haus">' + houseShape(P + 'newbody') + '</g>';
    svgHost.innerHTML = '<svg class="' + P + 'svg" viewBox="0 0 668 450" role="group" aria-label="Karte des Dorfes mit 8 blauen, 7 roten und dem neuen Haus">' + out + '</svg>';
    kInput.value = k === null ? '' : String(k);
    kInput.disabled = locked;
    var msg = '';
    if (mode === 'check' && k !== null) {
      var dec = decide(k);
      msg = 'Mit k = ' + k + ' wird das neue Haus ' + (dec === 'r' ? 'rot' : 'blau') + '.' + (dec === 'r' && k > ANSWER ? ' Es geht aber mit einer kleineren Zahl.' : '');
    } else if (mode === 'solution') msg = 'Die fünf nächsten Häuser sind nummeriert. Bei k = 4 stehen 2 rote gegen 2 blaue, also zählen 5: 3 rote gegen 2 blaue.';
    noteEl.textContent = msg;
  }

  function toggleMark(id) {
    if (locked) return;
    focusId = id;
    var i = marks.indexOf(id);
    if (i >= 0) marks.splice(i, 1); else marks.push(id);
    draw();
    var n = svgHost.querySelector('[data-id="' + id + '"]');
    if (n) n.focus();
  }
  function onClick(e) {
    var t = e.target.closest('[data-id]');
    if (t) toggleMark(+t.dataset.id);
  }
  function onKey(e) {
    var t = e.target.closest('[data-id]');
    if (!t) return;
    var id = +t.dataset.id, key = e.key;
    if (key === 'Enter' || key === ' ') { e.preventDefault(); toggleMark(id); return; }
    var nodes = [].slice.call(svgHost.querySelectorAll('[data-id]')), i = nodes.indexOf(t), to = null;
    if (key === 'ArrowRight' || key === 'ArrowDown') to = (i + 1) % nodes.length;
    else if (key === 'ArrowLeft' || key === 'ArrowUp') to = (i + nodes.length - 1) % nodes.length;
    if (to === null) return;
    e.preventDefault();
    focusId = +nodes[to].dataset.id;
    draw();
    svgHost.querySelector('[data-id="' + focusId + '"]').focus();
  }

  function setK(v) {
    if (locked) return;
    var n = parseInt(v, 10);
    k = isFinite(n) && n >= 1 ? Math.min(n, 99) : null;
    kInput.value = k === null ? '' : String(k);
    api.changed(k === null ? '' : 'k = ' + k);
  }

  Biber.register({
    id: 'neueshaus20',
    story:
      '<p>In einem Dorf werden alle Häuser entweder blau oder rot angestrichen. Um über die Farbe eines neuen Hauses zu entscheiden, haben die Bewohner eine Zahl <i>k</i> und diese Regel festgelegt:</p>' +
      '<ul><li>Ein neues Haus muss die Farbe bekommen, welche die Mehrheit der <i>k</i> nächstgelegenen Häuser hat. Wenn es keine Mehrheit gibt, entscheidet die Mehrheit der <i>k</i> + 1 nächstgelegenen Häuser.</li></ul>' +
      '<p>Nun wurde wieder ein neues Haus gebaut. Das Bild zeigt die Lage aller Häuser im Dorf. Die Regel entscheidet, dass das neue Haus die Farbe <strong>Rot</strong> bekommt.</p>',
    question: 'Wie lautet die kleinste Zahl k, die zu dieser Entscheidung führt?',
    howto: 'Tippe die Zahl ein oder stelle sie mit + und − ein. Zum Mitzählen kannst du Häuser antippen: Sie werden der Reihe nach nummeriert (das ist nur eine Hilfe, nochmal antippen nimmt die Nummer weg).',
    explanation: function () {
      return '<p>Man probiert <i>k</i> = 1, 2, 3, … der Reihe nach aus und zählt die nächsten Häuser des neuen Hauses. Die Reihenfolge nach Entfernung ist: blau, blau, rot, rot, rot, …</p>' +
        '<ul><li><i>k</i> = 1: das nächste Haus ist blau, also Blau.</li><li><i>k</i> = 2: beide sind blau, also Blau.</li>' +
        '<li><i>k</i> = 3: 1 rotes und 2 blaue, also Blau.</li>' +
        '<li><i>k</i> = 4: 2 rote und 2 blaue, keine Mehrheit. Dann zählen die 5 nächsten: 3 rote und 2 blaue, also <strong>Rot</strong>.</li></ul>' +
        '<p>Die kleinste Zahl ist also <strong><i>k</i> = 4</strong> (auch <i>k</i> = 5 ergibt Rot, ist aber nicht die kleinste).</p>' +
        '<p>Das ist der Algorithmus <em>k nächste Nachbarn</em> aus der Klassifikation: Ein neues Ding bekommt die Klasse, zu der die meisten seiner <i>k</i> ähnlichsten Nachbarn gehören. Computer sortieren so zum Beispiel Bilder in „Hund“ oder „Katze“. Wählt man <i>k</i> ungerade, gibt es bei zwei Klassen immer eine Mehrheit.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset(); focusId = 0;
      svgHost = h('div', { class: P + 'maphost' });
      kInput = h('input', {
        type: 'number', class: P + 'k', min: '1', max: '99', step: '1', inputmode: 'numeric', 'aria-label': 'Zahl k',
        oninput: function () { setK(kInput.value); }, onchange: function () { setK(kInput.value); draw(); }
      });
      var minus = h('button', { type: 'button', class: P + 'step', 'aria-label': 'k um 1 verkleinern', onclick: function () { if (!locked) { setK(String(Math.max(1, (k || 1) - 1))); } } }, '−');
      var plus = h('button', { type: 'button', class: P + 'step', 'aria-label': 'k um 1 vergrößern', onclick: function () { if (!locked) { setK(String(Math.min(99, (k || 0) + 1))); } } }, '+');
      noteEl = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      var legend = h('p', { class: P + 'legend' });
      legend.innerHTML = legendIcon(P + 'body ' + P + 'blue-i') + ' Blaues Haus &nbsp; ' + legendIcon(P + 'body ' + P + 'red-i') + ' Rotes Haus &nbsp; ' + legendIcon(P + 'newbody') + ' Neues Haus';
      el.replaceChildren(h('div', { class: P + 'board' },
        svgHost, legend,
        h('div', { class: P + 'answer' },
          h('label', { class: P + 'klabel', for: P + 'kin' }, 'k ='),
          minus, kInput, plus),
        noteEl));
      kInput.id = P + 'kin';
      svgHost.addEventListener('click', onClick);
      svgHost.addEventListener('keydown', onKey);
      draw();
    },
    isComplete: function () { return k !== null; },
    evaluate: function () { return { correct: k === ANSWER, answer: k }; },
    setAnswer: function (ans) {
      k = typeof ans === 'number' && isFinite(ans) && ans >= 1 ? Math.round(ans) : null;
      mode = 'check';
      draw();
    },
    lock: function (on) {
      locked = on;
      mode = on ? (mode === 'solution' ? 'solution' : 'check') : null;
      draw();
    },
    reset: function () { reset(); draw(); },
    showSolution: function () { k = ANSWER; mode = 'solution'; locked = true; draw(); }
  });
})();
