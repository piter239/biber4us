/* Aufgabe Postfix-Notation (Heft 2023, 9-10 schwer, 11-13 mittel): Theorie, Formale Sprachen, Strukturbaum */
(function () {
  'use strict';
  var h = Biber.h, S = Biber.svg;
  var P = 't-postfix23-';

  var EXPR = 'a 1 + b 2 + · 25 c : +'.split(' ');
  var OPS = { '+': 1, '−': 1, '·': 1, ':': 1 };

  function N(op, l, r) { return { op: op, l: l, r: r }; }
  function leaf(v) { return { v: v }; }
  var T = {
    A: N('+', leaf('a'), N('·', leaf('1'), N('+', leaf('b'), N('+', leaf('2'), N(':', leaf('25'), leaf('c')))))),
    B: N('·', N('+', leaf('a'), leaf('1')), N('+', N('+', leaf('b'), leaf('2')), N(':', leaf('25'), leaf('c')))),
    C: N('+', N('·', N('+', leaf('a'), leaf('1')), N('+', leaf('b'), leaf('2'))), N(':', leaf('25'), leaf('c'))),
    D: N('·', N('+', leaf('a'), leaf('1')), N('+', N('−', leaf('b'), leaf('2')), N(':', leaf('25'), leaf('c'))))
  };
  var ANSWER = 'C';
  var LETTERS = ['A', 'B', 'C', 'D'];

  function postfix(t) { return t.op ? postfix(t.l).concat(postfix(t.r), [t.op]) : [t.v]; }
  function infix(t) { return t.op ? '(' + infix(t.l) + ' ' + t.op + ' ' + infix(t.r) + ')' : t.v; }
  /* Sicherheitsnetz: nur Baum C hat genau diese Postfix-Notation */
  LETTERS.forEach(function (k) {
    if ((postfix(T[k]).join(' ') === EXPR.join(' ')) !== (k === ANSWER)) throw new Error('postfix23: Lösung stimmt nicht');
  });

  /* ---------- Baum zeichnen ---------- */
  var DX = 34, DY = 44, RX = 15, RY = 11, PAD = 20;
  function layout(t) {
    var nodes = [], edges = [], i = 0, maxD = 0;
    (function rec(n, d) {
      var o = { n: n, d: d };
      if (d > maxD) maxD = d;
      if (n.op) {
        var a = rec(n.l, d + 1), b = rec(n.r, d + 1);
        o.x = (a.x + b.x) / 2;
        edges.push([o, a], [o, b]);
      } else o.x = i++;
      nodes.push(o);
      return o;
    })(t, 0);
    return { nodes: nodes, edges: edges, w: (i - 1) * DX + 2 * PAD + 2 * 4, h: maxD * DY + 2 * RY + 2 * 6, leaves: i };
  }
  function rad(ux, uy, rx, ry) { return 1 / Math.sqrt((ux / rx) * (ux / rx) + (uy / ry) * (uy / ry)); }
  function treeSvg(t) {
    var L = layout(t);
    var minX = Math.min.apply(null, L.nodes.map(function (o) { return o.x; }));
    var maxX = Math.max.apply(null, L.nodes.map(function (o) { return o.x; }));
    var W = (maxX - minX) * DX + 2 * (RX + 6), H = L.h;
    var ox = RX + 6, oy = RY + 6;
    function px(o) { return ox + (o.x - minX) * DX; }
    function py(o) { return oy + o.d * DY; }
    var svg = S('svg', { class: P + 'tree', viewBox: '0 0 ' + W.toFixed(0) + ' ' + H, 'aria-hidden': 'true', focusable: 'false' });
    svg.style.maxWidth = (W * 1.25).toFixed(0) + 'px';
    L.edges.forEach(function (e) {
      var p = e[0], c = e[1], dx = px(c) - px(p), dy = py(c) - py(p), len = Math.sqrt(dx * dx + dy * dy), ux = dx / len, uy = dy / len;
      var s = rad(ux, uy, RX, RY) + 1, t2 = rad(ux, uy, RX, RY) + 1.5;
      var x1 = px(p) + ux * s, y1 = py(p) + uy * s, x2 = px(c) - ux * t2, y2 = py(c) - uy * t2;
      var a = Math.atan2(uy, ux), q = 0.45, hl = 6;
      svg.appendChild(S('line', { class: P + 'edge', x1: x1.toFixed(1), y1: y1.toFixed(1), x2: x2.toFixed(1), y2: y2.toFixed(1) }));
      svg.appendChild(S('path', { class: P + 'head', d: 'M' + x2.toFixed(1) + ' ' + y2.toFixed(1) +
        'L' + (x2 - hl * Math.cos(a - q)).toFixed(1) + ' ' + (y2 - hl * Math.sin(a - q)).toFixed(1) +
        'L' + (x2 - hl * Math.cos(a + q)).toFixed(1) + ' ' + (y2 - hl * Math.sin(a + q)).toFixed(1) + 'Z' }));
    });
    L.nodes.forEach(function (o) {
      svg.appendChild(S('ellipse', { class: P + 'node' + (o.n.op ? ' ' + P + 'op' : ''), cx: px(o).toFixed(1), cy: py(o), rx: RX, ry: RY }));
      svg.appendChild(S('text', { class: P + 'txt', x: px(o).toFixed(1), y: py(o) + 5, 'text-anchor': 'middle' }, o.n.op || o.n.v));
    });
    return svg;
  }

  function exTree(t) { var s = treeSvg(t); s.setAttribute('class', P + 'tree ' + P + 'etree'); s.setAttribute('role', 'img'); s.setAttribute('aria-label', 'Strukturbaum von ' + infix(t)); s.removeAttribute('aria-hidden'); return s.outerHTML; }

  /* ---------- Zustand ---------- */
  var el, api, locked, choice, mode, cards, statusEl;

  function render() {
    LETTERS.forEach(function (k) {
      var c = cards[k];
      c.classList.toggle('sel', choice === k);
      c.setAttribute('aria-checked', choice === k ? 'true' : 'false');
      c.classList.toggle('right', mode && k === ANSWER && (choice === k || mode === 'sol'));
      c.classList.toggle('wrong', mode === 'bad' && choice === k && k !== ANSWER);
      c.disabled = locked;
    });
  }
  function pick(k) {
    if (locked) return;
    choice = k;
    render();
    statusEl.textContent = 'Baum ' + k + ' gewählt.';
    api.changed();
  }

  Biber.register({
    id: 'postfix23',
    story: '<p>Ein mathematischer Ausdruck besteht aus einem Operator (+, −, · oder :) und den Operanden. Das sind Zahlen wie 1, 2, …, Buchstaben wie a, b, … oder wieder Ausdrücke wie (1 + 2).</p>' +
      '<p>Die Struktur eines Ausdrucks kann man als <b>Strukturbaum</b> darstellen: Ein Kringel mit dem Operator wird durch Pfeile mit den Strukturbäumen der Operanden verbunden. ' +
      'Im einfachsten Fall sind das Kringel mit einer Zahl oder einem Buchstaben.</p>' +
      '<p>Aus einem Strukturbaum kann man die <b>Postfix-Notation</b> des Ausdrucks ablesen: Für jeden Ausdruck schreibt man zuerst die Operanden und dahinter den Operator.</p>' +
      '<table class="' + P + 'ex"><thead><tr><th>Ausdruck</th><th>Strukturbaum</th><th>Postfix-Notation</th></tr></thead><tbody>' +
      '<tr><td>a + b</td><td>' + exTree(N('+', leaf('a'), leaf('b'))) + '</td><td><code>a b +</code></td></tr>' +
      '<tr><td>(a + 1) \u00B7 (b + c)</td><td>' + exTree(N('\u00B7', N('+', leaf('a'), leaf('1')), N('+', leaf('b'), leaf('c')))) + '</td><td><code>a 1 + b c + \u00B7</code></td></tr></tbody></table>' +
      '<p>Hier ist die Postfix-Notation eines anderen Ausdrucks:</p>' +
      '<p class="' + P + 'expr" aria-label="a 1 plus b 2 plus mal 25 c geteilt plus">' + EXPR.map(function (t) { return '<span class="' + P + (OPS[t] ? 'o' : 'v') + '">' + t + '</span>'; }).join(' ') + '</p>',
    question: 'Welchen Strukturbaum hat dieser Ausdruck?',
    howto: 'Tippe auf den Baum, den du für richtig hältst, und prüfe dann deine Antwort.',
    explanation: function () {
      return '<p>Der letzte Operator der Postfix-Notation ist der zentrale Operator, also die Wurzel des Baums. Das ist hier ein <b>+</b>, daher kommen nur die Bäume A und C in Frage. ' +
        'Direkt davor steht der Operator <b>:</b>, der zu den Operanden <i>25</i> und <i>c</i> gehört. Er bildet den rechten Operanden der Wurzel, und das passt nur zu <b>Baum C</b>.</p>' +
        '<p>Zur Probe: Wandelt man Baum C von unten nach oben um, erhält man <code>a 1 +</code>, <code>b 2 +</code> und <code>25 c :</code>, und insgesamt <code>a 1 + b 2 + · 25 c : +</code>. ' +
        'In gewohnter Schreibweise ist das (a + 1) · (b + 2) + 25 : c.</p>' +
        '<p><b>Informatik:</b> Die Postfix-Notation (umgekehrte polnische Notation) kommt ohne Klammern aus und ist eindeutig. ' +
        'Sie wurde in den ersten wissenschaftlichen Taschenrechnern genutzt, und beim Auswerten und Übersetzen von Programmausdrücken (Parsen) arbeiten Computer mit Strukturbäumen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; choice = null; mode = null; cards = {};
      statusEl = h('p', { class: P + 'status', role: 'status', 'aria-live': 'polite' });
      var grid = h('div', { class: P + 'grid', role: 'radiogroup', 'aria-label': 'Mögliche Strukturbäume' });
      LETTERS.forEach(function (k) {
        var c = h('button', { type: 'button', class: P + 'card', role: 'radio', 'aria-checked': 'false',
          'aria-label': 'Baum ' + k + ': ' + infix(T[k]), onclick: function () { pick(k); } },
          h('span', { class: P + 'letter' }, k), treeSvg(T[k]));
        cards[k] = c;
        grid.appendChild(c);
      });
      el.replaceChildren(h('div', { class: P + 'box' }, grid, statusEl));
      render();
    },
    isComplete: function () { return !!choice; },
    evaluate: function () { return { correct: choice === ANSWER, answer: choice }; },
    setAnswer: function (ans) {
      choice = LETTERS.indexOf(ans) >= 0 ? ans : null;
      mode = choice ? (choice === ANSWER ? 'ok' : 'bad') : null;
      render();
    },
    lock: function (on) {
      locked = on;
      mode = on && choice ? (choice === ANSWER ? 'ok' : 'bad') : null;
      render();
      statusEl.textContent = on ? (choice === ANSWER ? 'Baum C ist richtig.' : 'Der richtige Baum ist C.') : '';
      if (on && choice !== ANSWER) { mode = 'bad'; cards[ANSWER].classList.add('right'); }
    },
    reset: function () { choice = null; mode = null; render(); statusEl.textContent = ''; },
    showSolution: function () {
      choice = ANSWER; mode = 'sol'; locked = true; render();
      statusEl.textContent = 'Baum C ist richtig.';
    }
  });
})();
