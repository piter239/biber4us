/* Aufgabe Geheimes Achteck (Heft 2022, S. 29; Klasse 5-6 schwer, 7-8 mittel, 9-10 einfach): Scheibenverschlüsselung entschlüsseln */
(function () {
  'use strict';
  var h = Biber.h, svg = Biber.svg;

  /* Folgen im Uhrzeigersinn, beginnend bei ABC (oben rechts) */
  var RING = ['ABC', 'DEF', 'GHI', 'JKL', 'MNO', 'PQRS', 'TUV', 'WXYZ'];
  var CODE = ['22', '61', '62', '74'];
  var OPTS = [['A', 'HANS'], ['B', 'HAUS'], ['C', 'HALLO'], ['D', 'HALS'], ['E', 'HAUT']];
  var CORRECT = 'B';          /* offizielle Lösung (Heft S. 29) */

  function decode(code) {
    var pos = 0;
    return code.map(function (c) {
      pos = (pos + +c[0]) % 8;
      return { turn: +c[0], from: pos, seq: RING[pos], idx: +c[1], letter: RING[pos][+c[1] - 1] };
    });
  }
  var STEPS = decode(CODE);

  var CX = 160, CY = 160, R = 100, RL = 126;
  function pt(k, r) {
    var a = (67.5 - 45 * k) * Math.PI / 180;
    return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
  }
  function f1(n) { return Math.round(n * 10) / 10; }

  var el, api, choice, locked, mark;
  var ang, pos0, ptr, labels, seqBox, info, optBtns;

  function seqView(p) {
    var s = RING[p];
    return s.split('').map(function (ch, i) {
      return h('span', { class: 't-achteck22-let' }, h('b', null, ch), h('i', null, String(i + 1)));
    });
  }

  function updateWheel() {
    var p = ((ang / 45) % 8 + 8) % 8;
    pos0 = p;
    ptr.style.transform = 'rotate(' + (22.5 + ang) + 'deg)';
    labels.forEach(function (l, k) {
      l.g.setAttribute('class', 't-achteck22-lab' + (k === p ? ' on' : ''));
    });
    seqBox.replaceChildren.apply(seqBox, seqView(p));
    info.textContent = 'Der Zeiger steht bei ' + RING[p] + '.';
  }

  function buildWheel() {
    var poly = [];
    for (var k = 0; k < 8; k++) { var q = pt(k, R); poly.push(f1(q[0]) + ',' + f1(q[1])); }
    var s = svg('svg', { viewBox: '0 0 320 320', class: 't-achteck22-svg', role: 'img', 'aria-label': 'Achteckige Scheibe. Im Uhrzeigersinn stehen die Buchstabenfolgen ' + RING.join(', ') + '. Der Zeiger zeigt auf die gewählte Folge.' });
    s.appendChild(svg('polygon', { points: poly.join(' '), class: 't-achteck22-oct' }));
    for (k = 0; k < 8; k++) { var e = pt(k, R); s.appendChild(svg('line', { x1: CX, y1: CY, x2: f1(e[0]), y2: f1(e[1]), class: 't-achteck22-dash' })); }
    labels = [];
    for (k = 0; k < 8; k++) {
      var lp = pt(k, RL), w = RING[k].length * 12 + 12;
      var g = svg('g', { class: 't-achteck22-lab', 'aria-hidden': 'true' },
        svg('rect', { x: f1(lp[0] - w / 2), y: f1(lp[1] - 12), width: w, height: 24, rx: 12 }),
        svg('text', { x: f1(lp[0]), y: f1(lp[1] + 1), 'text-anchor': 'middle', 'dominant-baseline': 'central' }, RING[k]));
      s.appendChild(g);
      labels.push({ g: g });
    }
    ptr = svg('g', { class: 't-achteck22-ptr' },
      svg('line', { x1: CX, y1: CY, x2: CX, y2: CY - (R - 12), class: 't-achteck22-arrow' }),
      svg('path', { d: 'M' + CX + ' ' + (CY - (R - 2)) + ' L' + (CX - 8) + ' ' + (CY - (R - 20)) + ' L' + (CX + 8) + ' ' + (CY - (R - 20)) + ' Z', class: 't-achteck22-head' }));
    s.appendChild(ptr);
    s.appendChild(svg('circle', { cx: CX, cy: CY, r: 7, class: 't-achteck22-hub' }));
    return s;
  }

  function turn() { ang += 45; updateWheel(); }
  function rewind() { ang = Math.ceil(ang / 360) * 360; updateWheel(); }

  function refreshOpts(markMode) {
    optBtns.forEach(function (o) {
      var on = choice === o.k;
      var cls = 't-achteck22-opt' + (on ? ' on' : '');
      var badge = '';
      if (markMode === 'check' && on) { cls += o.k === CORRECT ? ' right' : ' wrong'; badge = o.k === CORRECT ? '✓' : '✗'; }
      else if (markMode === 'solution' && o.k === CORRECT) { cls += ' right'; badge = '✓'; }
      o.btn.className = cls;
      o.btn.setAttribute('aria-pressed', String(on));
      o.btn.disabled = !!locked;
      o.mark.textContent = badge;
    });
  }

  function build() {
    el.replaceChildren();
    ang = 0;
    seqBox = h('div', { class: 't-achteck22-seq', 'aria-live': 'polite' });
    info = h('p', { class: 't-achteck22-info', 'aria-live': 'polite' });
    var tool = h('div', { class: 't-achteck22-tool' },
      h('h3', null, 'Scheibe zum Ausprobieren'),
      h('div', { class: 't-achteck22-wheelrow' },
        buildWheel(),
        h('div', { class: 't-achteck22-side' },
          info,
          h('p', { class: 't-achteck22-small' }, 'Buchstaben der Folge, auf die der Zeiger zeigt, mit ihrer Nummer:'),
          seqBox,
          h('div', { class: 't-achteck22-btns' },
            h('button', { type: 'button', class: 'btn', onclick: turn, 'aria-label': 'Zeiger um eine Position im Uhrzeigersinn weiterdrehen' }, '↻ Eine Position weiter'),
            h('button', { type: 'button', class: 'btn ghost', onclick: rewind, 'aria-label': 'Zeiger zurück auf ABC stellen' }, 'Zurück auf ABC')))));
    optBtns = OPTS.map(function (o) {
      var mk = h('span', { class: 't-achteck22-mk', 'aria-hidden': 'true' });
      var btn = h('button', {
        type: 'button', class: 't-achteck22-opt', 'aria-pressed': 'false', 'aria-label': 'Antwort ' + o[0] + ': ' + o[1],
        onclick: function () { if (locked) return; choice = o[0]; refreshOpts(); api.changed(); }
      }, h('b', null, o[0]), h('span', null, o[1]), mk);
      return { k: o[0], btn: btn, mark: mk };
    });
    el.appendChild(tool);
    el.appendChild(h('div', { class: 't-achteck22-code', 'aria-label': 'Geheimtext 22 61 62 74' },
      CODE.map(function (c) { return h('span', null, c); })));
    el.appendChild(h('div', { class: 't-achteck22-opts', role: 'group', 'aria-label': 'Antworten' }, optBtns.map(function (o) { return o.btn; })));
    updateWheel();
    refreshOpts(mark);
  }

  Biber.register({
    id: 'achteck22',
    story: '<p>Mit dieser achteckigen Scheibe werden Worte verschlüsselt. Der Zeiger auf der Scheibe kann auf acht verschiedenen Positionen stehen. An jeder Position ist eine Folge von Buchstaben.</p>' +
      '<p>Am Anfang steht der Zeiger immer bei der Folge <b>ABC</b>. Dann wird jeder Buchstabe des Wortes einzeln mit zwei Ziffern verschlüsselt:</p>' +
      '<ul><li>Die <b>erste Ziffer</b> gibt an, um wie viele Positionen der Zeiger im Uhrzeigersinn weiter gedreht wird, damit er bei der Folge mit diesem Buchstaben steht.</li>' +
      '<li>Die <b>zweite Ziffer</b> gibt an, der wievielte Buchstabe in der Folge verschlüsselt wird.</li></ul>' +
      '<p>Ein Beispiel: Das Wort <b>PAAR</b> wird so verschlüsselt: <span class="t-achteck22-ex">51 31 81 53</span></p>',
    question: 'Welches Wort wird so verschlüsselt: 22 61 62 74 ?',
    howto: 'Mit der Scheibe kannst du den Zeiger drehen und nachrechnen. Tippe dann auf das passende Wort.',
    explanation: function () {
      var lis = STEPS.map(function (s, i) {
        return '<li><b>' + CODE[i] + '</b>: Zeiger ' + s.turn + ' Positionen weiter zu <b>' + s.seq + '</b>, davon der ' + s.idx + '. Buchstabe: <b>' + s.letter + '</b></li>';
      }).join('');
      return '<p>Man dreht den Zeiger bei jedem Zifferpaar weiter und liest dann den Buchstaben ab. Dabei startet jeder Schritt dort, wo der Zeiger vorher stehen geblieben ist:</p><ol>' + lis + '</ol>' +
        '<p>Das Wort heißt also <b>' + STEPS.map(function (s) { return s.letter; }).join('') + '</b>. Es geht auch schneller: HALLO hat fünf Buchstaben, der Geheimtext aber nur vier. Die letzte Gruppe 74 zeigt den 4. Buchstaben der Folge, nur S oder Z passen, also kommt nur S in Frage. Sieben Positionen weiter heißt eine Position zurück, also kommt der vorletzte Buchstabe aus TUV (U).</p>' +
        '<p>Dasselbe Zeichen wird bei diesem Verfahren je nach Stelle im Wort verschieden verschlüsselt (A wird in PAAR zu 31 und zu 81). Man nennt das eine polyalphabetische Substitution. Geheim bleibt der Text nur, wenn man die Scheibe nicht kennt, und die Sicherheit eines Verfahrens sollte nicht davon abhängen, dass man es geheim hält.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; choice = null; mark = null; build();
    },
    isComplete: function () { return choice !== null; },
    evaluate: function () { return { correct: choice === CORRECT, answer: { choice: choice } }; },
    setAnswer: function (ans) { choice = ans && ans.choice || null; mark = 'check'; refreshOpts(mark); },
    lock: function (on) {
      locked = on;
      if (on) { if (mark !== 'solution') mark = 'check'; } else mark = null;
      refreshOpts(mark);
    },
    reset: function () { choice = null; mark = null; rewind(); refreshOpts(); },
    showSolution: function () { choice = CORRECT; mark = 'solution'; refreshOpts(mark); }
  });
})();
