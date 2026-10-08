/* Aufgabe Zahlenmaschine (Klasse 5-6, mittel): Sortiernetzwerk mit vier Eingaben und fünf Schaltern */
(function () {
  'use strict';
  var h = Biber.h, S = Biber.svg;

  var OPTIONS = [
    { id: 'A', text: 'Sie gibt die Zahlen in unveränderter Reihenfolge aus. Im Beispiel: 3, 4, 2, 1' },
    { id: 'B', text: 'Sie sortiert die Zahlen in absteigender Reihenfolge. Im Beispiel: 4, 3, 2, 1' },
    { id: 'C', text: 'Sie gibt die Zahlen in umgekehrter Reihenfolge aus. Im Beispiel: 1, 2, 4, 3' },
    { id: 'D', text: 'Sie sortiert die Zahlen in aufsteigender Reihenfolge. Im Beispiel: 1, 2, 3, 4' }
  ];
  var RIGHT = 'D';
  var START = [3, 4, 2, 1];

  /* Lage der Schalter (Mitte) und der Ein-/Ausgabefelder in der Zeichnung */
  var SW = [{ x: 100, y: 275 }, { x: 300, y: 275 }, { x: 100, y: 185 }, { x: 300, y: 185 }, { x: 200, y: 95 }];
  var IN_X = [50, 150, 250, 350], IN_Y = 345, OUT_Y = 24, R = 18, HALF_W = 32, HALF_H = 16, PORT = 18;
  /* Verbindungen: von (Eingang 'i', Schalter-Ausgang 's'), nach (Schalter-Eingang 'w' oder Ausgabefeld 'o') */
  var WIRES = [
    { f: ['i', 0], t: ['w', 0, 0] }, { f: ['i', 1], t: ['w', 0, 1] },
    { f: ['i', 2], t: ['w', 1, 0] }, { f: ['i', 3], t: ['w', 1, 1] },
    { f: ['s', 0, 0], t: ['w', 2, 0], v: 'a' }, { f: ['s', 0, 1], t: ['w', 3, 0], v: 'b' },
    { f: ['s', 1, 0], t: ['w', 2, 1], v: 'c' }, { f: ['s', 1, 1], t: ['w', 3, 1], v: 'd' },
    { f: ['s', 2, 0], t: ['o', 0] }, { f: ['s', 2, 1], t: ['w', 4, 0], v: 'e' },
    { f: ['s', 3, 0], t: ['w', 4, 1], v: 'f' }, { f: ['s', 3, 1], t: ['o', 3] },
    { f: ['s', 4, 0], t: ['o', 1] }, { f: ['s', 4, 1], t: ['o', 2] }
  ];

  function pair(a, b) { return a <= b ? [a, b] : [b, a]; }
  /* Rechnet die Maschine durch: Werte aller Schalter-Ausgänge und die Ausgabe */
  function run(v) {
    var s0 = pair(v[0], v[1]), s1 = pair(v[2], v[3]);
    var s2 = pair(s0[0], s1[0]), s3 = pair(s0[1], s1[1]);
    var s4 = pair(s2[1], s3[0]);
    return { sw: [s0, s1, s2, s3, s4], out: [s2[0], s4[0], s4[1], s3[1]] };
  }
  function wireValue(w, v, res) {
    if (w.f[0] === 'i') return v[w.f[1]];
    return res.sw[w.f[1]][w.f[2]];
  }
  function join(a) { return a.join(', '); }

  function start(wire) {
    if (wire.f[0] === 'i') return { x: IN_X[wire.f[1]], y: IN_Y - R };
    var s = SW[wire.f[1]];
    return { x: s.x + (wire.f[2] ? PORT : -PORT), y: s.y - HALF_H };
  }
  function end(wire) {
    if (wire.t[0] === 'o') return { x: IN_X[wire.t[1]], y: OUT_Y + R };
    var s = SW[wire.t[1]];
    return { x: s.x + (wire.t[2] ? PORT : -PORT), y: s.y + HALF_H };
  }
  function bez(p0, p1, wire) {
    var straight = wire.f[0] === 'i';
    var dy = (p0.y - p1.y) * 0.5;
    var c1 = straight ? p0 : { x: p0.x, y: p0.y - dy };
    var c2 = straight ? p1 : { x: p1.x, y: p1.y + dy };
    return { p0: p0, c1: c1, c2: c2, p1: p1 };
  }
  function at(b, t) {
    var u = 1 - t;
    return {
      x: u * u * u * b.p0.x + 3 * u * u * t * b.c1.x + 3 * u * t * t * b.c2.x + t * t * t * b.p1.x,
      y: u * u * u * b.p0.y + 3 * u * u * t * b.c1.y + 3 * u * t * t * b.c2.y + t * t * t * b.p1.y
    };
  }

  var el, api, vals, choice, locked, mode;
  var nodes = {};

  function arrowHead(b, cls) {
    var dx = b.p1.x - b.c2.x, dy = b.p1.y - b.c2.y;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    dx /= len; dy /= len;
    var L = 10, a = 0.5, ca = Math.cos(a), sa = Math.sin(a);
    function rot(sign) { return { x: b.p1.x - L * (dx * ca - sign * dy * sa), y: b.p1.y - L * (sign * dx * sa + dy * ca) }; }
    var l = rot(1), r = rot(-1);
    return S('path', { class: cls, d: 'M' + l.x.toFixed(1) + ',' + l.y.toFixed(1) + ' L' + b.p1.x.toFixed(1) + ',' + b.p1.y.toFixed(1) + ' L' + r.x.toFixed(1) + ',' + r.y.toFixed(1) });
  }

  function setVal(i, n) {
    vals[i] = Math.max(1, Math.min(9, n));
    update(true);
  }

  function buildMachine() {
    var svg = S('svg', { class: 'zm-svg', viewBox: '0 0 400 376', role: 'group', 'aria-label': 'Zahlenmaschine mit vier Eingabefeldern unten, fünf Schaltern und vier Ausgabefeldern oben' });
    nodes = { wires: [], badges: [], inputs: [], outputs: [] };
    WIRES.forEach(function (w) {
      var b = bez(start(w), end(w), w);
      var thick = w.f[0] === 's' && w.f[2] === 1;
      var cls = 'zm-wire' + (w.f[0] === 'i' ? ' in' : thick ? ' big' : ' small');
      svg.appendChild(S('path', { class: cls, d: 'M' + b.p0.x + ',' + b.p0.y + ' C' + b.c1.x + ',' + b.c1.y + ' ' + b.c2.x + ',' + b.c2.y + ' ' + b.p1.x + ',' + b.p1.y }));
      svg.appendChild(arrowHead(b, cls + ' head'));
      if (w.v) {
        var m = at(b, 0.32);
        var g = S('g', { class: 'zm-badge', transform: 'translate(' + m.x.toFixed(1) + ',' + m.y.toFixed(1) + ')', 'aria-hidden': 'true' },
          S('circle', { r: 11 }), S('text', { y: 1 }, '0'));
        nodes.badges.push({ w: w, text: g.lastChild });
        svg.appendChild(g);
      }
    });
    SW.forEach(function (s, i) {
      svg.appendChild(S('g', { class: 'zm-switch', 'aria-hidden': 'true' },
        S('rect', { x: s.x - HALF_W, y: s.y - HALF_H, width: HALF_W * 2, height: HALF_H * 2, rx: HALF_H }),
        S('path', { d: 'M' + (s.x + 5) + ',' + (s.y - 8) + ' L' + (s.x - 5) + ',' + s.y + ' L' + (s.x + 5) + ',' + (s.y + 8) })));
    });
    IN_X.forEach(function (x, i) {
      var t = S('text', { y: 2 }, '0');
      var g = S('g', {
        class: 'zm-in', transform: 'translate(' + x + ',' + IN_Y + ')', role: 'spinbutton', tabindex: '0',
        'aria-label': 'Eingabefeld ' + (i + 1) + ' von 4', 'aria-valuemin': '1', 'aria-valuemax': '9'
      }, S('circle', { r: R + 4, class: 'zm-hit' }), S('circle', { r: R, class: 'zm-ring' }), t);
      g.addEventListener('click', function () { setVal(i, vals[i] >= 9 ? 1 : vals[i] + 1); });
      g.addEventListener('keydown', function (e) {
        var k = e.key;
        if (k === 'ArrowUp' || k === 'ArrowRight' || k === '+') setVal(i, Math.min(9, vals[i] + 1));
        else if (k === 'ArrowDown' || k === 'ArrowLeft' || k === '-') setVal(i, Math.max(1, vals[i] - 1));
        else if (k === ' ' || k === 'Enter') setVal(i, vals[i] >= 9 ? 1 : vals[i] + 1);
        else if (/^[1-9]$/.test(k)) setVal(i, +k);
        else return;
        e.preventDefault();
      });
      nodes.inputs.push({ g: g, text: t });
      svg.appendChild(g);
    });
    IN_X.forEach(function (x, i) {
      var t = S('text', { y: 2 }, '0');
      svg.appendChild(S('g', { class: 'zm-out', transform: 'translate(' + x + ',' + OUT_Y + ')', 'aria-hidden': 'true' }, S('circle', { r: R }), t));
      nodes.outputs.push(t);
    });
    svg.appendChild(S('text', { class: 'zm-cap', x: 200, y: 372, 'text-anchor': 'middle' }, 'Eingabefelder (antippen zum Ändern)'));
    return svg;
  }

  function update(announce) {
    var res = run(vals);
    nodes.inputs.forEach(function (n, i) {
      n.text.textContent = vals[i];
      n.g.setAttribute('aria-valuenow', vals[i]);
      n.g.setAttribute('aria-valuetext', String(vals[i]));
    });
    nodes.badges.forEach(function (b) { b.text.textContent = wireValue(b.w, vals, res); });
    nodes.outputs.forEach(function (t, i) { t.textContent = res.out[i]; });
    nodes.live.textContent = 'Eingabe ' + join(vals) + ', Ausgabe ' + join(res.out);
    nodes.liveText.textContent = nodes.live.textContent;
    if (!announce) nodes.live.removeAttribute('aria-live'); else nodes.live.setAttribute('aria-live', 'polite');
  }

  function renderOptions() {
    var list = OPTIONS.map(function (o) {
      var cls = 'zm-opt' + (choice === o.id ? ' on' : '');
      var mark = null;
      if (mode === 'check' || mode === 'solution') {
        if (o.id === choice) {
          var ok = o.id === RIGHT;
          cls += ok ? ' right' : ' wrong';
          mark = h('span', { class: 'zm-mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
        }
      }
      var input = h('input', { type: 'radio', name: 'zm-choice', value: o.id, checked: choice === o.id, disabled: locked });
      input.checked = choice === o.id;
      input.addEventListener('change', function () {
        if (locked) return;
        choice = o.id;
        renderOptions();
        var again = el.querySelector('input[value="' + o.id + '"]');
        if (again) again.focus();
        api.changed();
      });
      return h('label', { class: cls }, input, h('span', { class: 'zm-letter' }, o.id), h('span', { class: 'zm-text' }, o.text), mark);
    });
    nodes.options.replaceChildren.apply(nodes.options, list);
  }

  function build() {
    var svg = buildMachine();
    nodes.live = h('p', { class: 'zm-live', 'aria-live': 'polite' });
    nodes.liveText = h('span', { class: 'zm-live-vis' });
    nodes.options = h('div', { class: 'zm-options', role: 'radiogroup', 'aria-label': 'Welche Aufgabe führt die Maschine aus?' });
    var tools = h('div', { class: 'zm-tools' },
      h('button', { type: 'button', class: 'btn ghost zm-btn', onclick: function () {
        vals = [1, 2, 3, 4].map(function () { return 1 + Math.floor(Math.random() * 9); });
        update(true);
      } }, 'Zufällige Zahlen'),
      h('button', { type: 'button', class: 'btn ghost zm-btn', onclick: function () { vals = START.slice(); update(true); } }, 'Beispiel 3, 4, 2, 1'));
    el.replaceChildren(h('div', { class: 'zm-board' },
      h('div', { class: 'zm-machine' }, svg, h('div', { class: 'zm-line' }, nodes.liveText), nodes.live, tools),
      nodes.options));
    update(false);
    renderOptions();
  }

  function reset() { vals = START.slice(); choice = null; mode = null; }

  Biber.register({
    id: 'zahlenmaschine',
    story: '<p>Die Biber haben eine Zahlenmaschine.</p>' +
      '<p>Vier Zahlen werden unten in die Eingabefelder eingegeben, zum Beispiel 3, 4, 2 und 1.</p>' +
      '<p>Entlang von Pfeilen und Schaltern <span class="zm-pill" aria-label="Schalter">&lt;</span> wandern die Zahlen durch die Maschine nach oben bis zu den Ausgabefeldern.</p>' +
      '<p>Jeder der fünf Schalter vergleicht die beiden eingehenden Zahlen und leitet &hellip;</p>' +
      '<ul class="zm-rules"><li>&hellip; die kleinere Zahl nach links und</li><li>&hellip; die größere Zahl nach rechts weiter.</li></ul>' +
      '<p>Etwa so: <span class="zm-etwa">' +
      '<svg class="zm-mini" viewBox="0 0 150 130" role="img" aria-label="Ein Schalter bekommt unten 3 und 2. Die kleinere Zahl 2 geht nach links oben, die größere Zahl 3 nach rechts oben weiter.">' +
      '<path class="zm-wire in" d="M32,100 L56,70"/>' +
      '<path class="zm-wire in" d="M118,100 L94,70"/>' +
      '<path class="zm-wire small" d="M56,42 L38,20"/><path class="zm-wire small head" d="M37,28 L38,19 L46,22"/>' +
      '<path class="zm-wire big" d="M94,42 L112,20"/><path class="zm-wire big head" d="M104,19 L112,19 L111,27"/>' +
      '<g class="zm-switch"><rect x="43" y="42" width="64" height="30" rx="15"/><path d="M80,49 L70,57 L80,65"/></g>' +
      '<g class="zm-sin"><circle cx="28" cy="108" r="14"/><text x="28" y="110">3</text></g>' +
      '<g class="zm-sin"><circle cx="122" cy="108" r="14"/><text x="122" y="110">2</text></g>' +
      '<g class="zm-sout"><circle cx="30" cy="12" r="11"/><text x="30" y="13" class="s">2</text></g>' +
      '<g class="zm-sout"><circle cx="120" cy="12" r="11"/><text x="120" y="13" class="s">3</text></g>' +
      '</svg></span></p>',
    question: 'Welche Aufgabe führt die Maschine aus?',
    howto: 'Probiere die Maschine aus: Tippe unten auf ein Eingabefeld, um die Zahl zu ändern (oder nutze „Zufällige Zahlen“). Wähle dann die richtige Antwort.',
    explanation: '<p>Die beiden unteren Schalter ordnen je ein Paar. Die mittleren Schalter vergleichen dann die beiden kleineren und die beiden größeren Zahlen: So landet die kleinste Zahl ganz links und die größte ganz rechts, und der obere Schalter ordnet die zwei Zahlen in der Mitte.</p>' +
      '<p>Im Beispiel kommt 1, 2, 3, 4 heraus. Die Maschine sortiert immer aufsteigend (D). Ein solches Netz aus Vergleichsschaltern heißt Sortiernetzwerk und arbeitet bei jeder Eingabe nach demselben festen Plan.</p>',
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      build();
    },
    isComplete: function () { return choice !== null; },
    evaluate: function () { return { correct: choice === RIGHT, answer: { choice: choice } }; },
    setAnswer: function (ans) {
      choice = ans && /^[ABCD]$/.test(ans.choice) ? ans.choice : null;
      mode = choice === RIGHT ? 'solution' : 'check';
      renderOptions();
    },
    lock: function (on) {
      locked = on;
      mode = on ? 'check' : null;
      renderOptions();
    },
    reset: function () { reset(); update(false); renderOptions(); },
    showSolution: function () {
      choice = RIGHT; locked = true; mode = 'solution';
      renderOptions();
    }
  });
})();
