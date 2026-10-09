/* Aufgabe Digitale Bäume (Biber 2020; Klasse 11-13 schwer): Welche Wachstumsregel (L-System) erzeugt den gezeigten Baum? */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-digitalebaeume20-';
  var SVGNS = 'http://www.w3.org/2000/svg';
  var U = 40;           /* Länge eines Baumstücks im SVG */

  /* ---------- Regeln ----------
     pieces: Stücke der Struktur, [Eltern-Stück (-1 = Wurzel), Drehung gegenüber dem Eltern-Stück in Grad (+ = rechts)];
     jedes Stück hat die Länge 1 und beginnt am Ende seines Eltern-Stücks.
     arrow: Stück, an dessen Spitze der Pfeil sitzt (hier wird "der Rest des Baumes" angefügt, Richtung = Richtung dieses Stücks).
     Ersetzen: jedes Stück wird durch die Struktur ersetzt; seine Kinder hängen danach an der Pfeilspitze der neuen Struktur. */
  var RULES = {
    A: { pieces: [[-1, 0], [0, 0], [0, -30]], arrow: 2, label: 'Der Stamm hat oben einen geraden und einen nach links geneigten Zweig (30 Grad). Der Rest des Baumes wird am linken, geneigten Zweig angefügt.' },
    B: { pieces: [[-1, 0], [0, -15], [0, 15]], arrow: 1, label: 'Der Stamm teilt sich in zwei Zweige, links und rechts je 15 Grad geneigt. Der Rest des Baumes wird am linken Zweig angefügt.' },
    C: { pieces: [[-1, 0], [0, -30], [0, 0], [0, 30]], arrow: 2, label: 'Der Stamm teilt sich in drei Zweige: links 30 Grad geneigt, geradeaus, rechts 30 Grad geneigt. Der Rest des Baumes wird am mittleren, geraden Zweig angefügt.' },
    D: { pieces: [[-1, 0], [0, -15], [0, 15]], arrow: 2, label: 'Der Stamm teilt sich in zwei Zweige, links und rechts je 15 Grad geneigt. Der Rest des Baumes wird am rechten Zweig angefügt.' }
  };
  /* Beispielregeln aus der Aufgabe (nur Anzeige) */
  var EX1 = { pieces: [[-1, 0], [0, 0], [0, 30]], arrow: 1 };
  var EX2 = { pieces: [[-1, 0], [0, 0], [0, 30]], arrow: 2 };
  var KEYS = ['A', 'B', 'C', 'D'];
  var RIGHT = 'B';       /* im Heft bestätigt; Baum = Regel B nach 3 Wachstumsschritten (Skript: Strukturvergleich mit der Abbildung) */
  var TARGET_STEPS = 3;

  /* ---------- Wachstum ---------- */
  function grow(tree, rule) {
    var P2 = rule.pieces, n = P2.length, base = [], arrAt = [], out = [], i, k;
    for (i = 0; i < tree.length; i++) { base.push(i * n); arrAt.push(i * n + rule.arrow); }
    for (i = 0; i < tree.length; i++) {
      for (k = 0; k < n; k++) {
        if (P2[k][0] < 0) out.push([tree[i][0] < 0 ? -1 : arrAt[tree[i][0]], tree[i][1] + P2[k][1]]);
        else out.push([base[i] + P2[k][0], P2[k][1]]);
      }
    }
    return out;
  }
  function treeAt(rule, steps) {
    var t = [[-1, 0]], i;
    for (i = 0; i < steps; i++) t = grow(t, rule);
    return t;
  }
  function layout(tree) {
    var res = new Array(tree.length);
    function calc(i) {
      if (res[i]) return res[i];
      var par = tree[i][0], hd, s;
      if (par < 0) { hd = tree[i][1]; s = { x: 0, y: 0 }; }
      else { var p = calc(par); hd = p.h + tree[i][1]; s = p.e; }
      var r = { s: s, h: hd, e: { x: s.x + Math.sin(hd * Math.PI / 180) * U, y: s.y - Math.cos(hd * Math.PI / 180) * U } };
      res[i] = r;
      return r;
    }
    for (var i = 0; i < tree.length; i++) calc(i);
    return res;
  }
  function bounds(lay, pad) {
    var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    lay.forEach(function (p) {
      [p.s, p.e].forEach(function (q) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); });
    });
    return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad };
  }
  function r1(v) { return Math.round(v * 10) / 10; }

  /* Baum als SVG-Fragment (Linien + orange Knoten) */
  function treeShapes(lay, sw, dot) {
    var lines = '', dots = '', seen = {};
    lay.forEach(function (p) {
      lines += '<line x1="' + r1(p.s.x) + '" y1="' + r1(p.s.y) + '" x2="' + r1(p.e.x) + '" y2="' + r1(p.e.y) + '"/>';
      [p.s, p.e].forEach(function (q) {
        var key = Math.round(q.x * 10) + ',' + Math.round(q.y * 10);
        if (!seen[key]) { seen[key] = 1; dots += '<circle cx="' + r1(q.x) + '" cy="' + r1(q.y) + '" r="' + dot + '"/>'; }
      });
    });
    return '<g class="' + P + 'lines" stroke-width="' + sw + '">' + lines + '</g><g class="' + P + 'dots">' + dots + '</g>';
  }
  function dart(x, y, deg) {
    return '<polygon class="' + P + 'dart" transform="translate(' + r1(x) + ' ' + r1(y) + ') rotate(' + deg + ')" points="0,-8 7,6 0,2.5 -7,6"/>';
  }
  function svgTree(tree, box, sw, dot, label, cls) {
    var lay = layout(tree);
    var b = box || bounds(lay, 8);
    return '<svg class="' + P + 'svg ' + (cls || '') + '" viewBox="' + r1(b.x) + ' ' + r1(b.y) + ' ' + r1(b.w) + ' ' + r1(b.h) + '" role="img" aria-label="' + label + '">' +
      treeShapes(lay, sw, dot) + '</svg>';
  }
  /* Regel als SVG: Struktur plus Pfeile (Start unten, Ende an der Spitze des Pfeil-Stücks) */
  function svgRule(rule, label) {
    var lay = layout(rule.pieces), a = lay[rule.arrow];
    var off = 13, ax = a.e.x + Math.sin(a.h * Math.PI / 180) * off, ay = a.e.y - Math.cos(a.h * Math.PI / 180) * off;
    return '<svg class="' + P + 'svg ' + P + 'rulesvg" viewBox="-58 -112 116 140" role="img" aria-label="' + label + '">' +
      treeShapes(lay, 5, 4.6) + dart(0, 14, 180) + dart(ax, ay, a.h) + '</svg>';
  }
  /* kleine Beispielfolge aus der Aufgabe */
  function exampleRow(rule, label) {
    var box = bounds(layout(treeAt(rule, 2)), 8);
    var boxes = [0, 1, 2].map(function (n) {
      return svgTree(treeAt(rule, n), box, 4, 3.4, 'Schritt ' + n, P + 'exsvg');
    });
    return '<div class="' + P + 'exrow" role="group" aria-label="' + label + '">' +
      '<div class="' + P + 'exrule">' + svgRule(rule, 'Regel') + '</div>' +
      '<div class="' + P + 'exstep">' + boxes[0] + '</div><span class="' + P + 'arr" aria-hidden="true">→</span>' +
      '<div class="' + P + 'exstep">' + boxes[1] + '</div><span class="' + P + 'arr" aria-hidden="true">→</span>' +
      '<div class="' + P + 'exstep">' + boxes[2] + '</div></div>';
  }

  /* Zeichenfläche (gleicher Maßstab für alle Schritte einer Regel): Rahmen um das Ergebnis nach TARGET_STEPS Schritten */
  var boxCache = {};
  function boxFor(key) {
    if (!boxCache[key]) boxCache[key] = bounds(layout(treeAt(RULES[key], TARGET_STEPS)), 10);
    return boxCache[key];
  }

  var el, api, radios, stepBtns, previewEl, previewNote, selected, locked, mark, step;

  function reset() { selected = null; mark = null; step = 1; }

  function refresh() {
    radios.forEach(function (btn, i) {
      var k = KEYS[i], on = selected === k, ok = k === RIGHT;
      btn.setAttribute('aria-checked', String(on));
      btn.tabIndex = (selected === null ? i === 0 : on) ? 0 : -1;
      btn.setAttribute('aria-disabled', locked ? 'true' : 'false');
      btn.classList.toggle('selected', on);
      btn.classList.toggle('right', on && mark !== null && ok);
      btn.classList.toggle('wrong', on && mark === 'check' && !ok);
      var m = btn.querySelector('.' + P + 'mark');
      if (m) m.remove();
      if (on && mark !== null) btn.appendChild(h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
    });
    stepBtns.forEach(function (b, i) {
      b.setAttribute('aria-checked', String(i === step));
      b.classList.toggle('selected', i === step);
      b.tabIndex = i === step ? 0 : -1;
    });
    if (selected === null) {
      previewEl.innerHTML = '<p class="' + P + 'hint">Wähle eine Regel, dann siehst du hier, wie sie den Baum wachsen lässt.</p>';
      previewNote.textContent = '';
    } else {
      previewEl.innerHTML = svgTree(treeAt(RULES[selected], step), boxFor(selected), step >= 3 ? 3.4 : 4.4, step >= 3 ? 3 : 3.6,
        'Regel ' + selected + ' nach ' + (step === 0 ? 'keinem Wachstumsschritt (Anfangsstück)' : step + (step === 1 ? ' Wachstumsschritt' : ' Wachstumsschritten')), P + 'bigsvg');
      previewNote.textContent = 'Regel ' + selected + ', ' + (step === 0 ? 'Anfangsstück' : 'nach ' + step + (step === 1 ? ' Wachstumsschritt' : ' Wachstumsschritten')) + '.';
    }
  }
  function choose(i, focus) {
    if (locked) return;
    selected = KEYS[i];
    refresh();
    if (focus) radios[i].focus();
    api.changed();
  }
  function onKey(e) {
    var i = radios.indexOf(e.currentTarget), to = null, k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % radios.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + radios.length - 1) % radios.length;
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }
  function setStep(n, focus) {
    step = n; refresh();
    if (focus) stepBtns[n].focus();
  }
  function onStepKey(e) {
    var i = stepBtns.indexOf(e.currentTarget), to = null, k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = Math.min(i + 1, stepBtns.length - 1);
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = Math.max(i - 1, 0);
    if (to === null) return;
    e.preventDefault();
    setStep(to, true);
  }

  Biber.register({
    id: 'digitalebaeume20',
    story:
      '<p>Digitale Bäume wachsen schrittweise, nach vorgegebenen Regeln. Ein digitaler Baum besteht zuerst aus einem Stück.</p>' +
      '<p>Eine <strong>Wachstumsregel</strong> gibt an, wie ein Baumstück durch eine Struktur von Stücken ersetzt wird. In jedem Wachstumsschritt wird die Regel gleichzeitig auf jedes Baumstück angewendet. Die Pfeilspitzen in der Regel geben an, <strong>wo und in welche Richtung</strong> dabei die Strukturen aneinander gesetzt werden. Zwei Beispiele mit den ersten zwei Schritten:</p>' +
      '<div class="' + P + 'examples">' + exampleRow(EX1, 'Beispiel 1: Regel und die ersten zwei Schritte') + exampleRow(EX2, 'Beispiel 2: Regel und die ersten zwei Schritte') + '</div>',
    question: 'Nach welcher Regel ist der Baum gewachsen?',
    howto: 'Wähle eine der Regeln A bis D. Unter den Regeln kannst du die gewählte Regel Schritt für Schritt wachsen lassen und mit dem Baum vergleichen.',
    explanation: function () {
      return '<p>Man erkennt die Regel an der Form: Der Baum krümmt sich nach <strong>links</strong>, und die Zweige sind nur leicht geneigt. Das passt zu <strong>Regel B</strong>: Der Rest des Baumes wird immer am linken Abzweig angefügt, der sich nur wenig nach links neigt. Deshalb entsteht ein sanft gebogener Stamm mit kleinen Y-Verzweigungen.</p>' +
        '<p>Regel A neigt sich viel stärker nach links und rollt sich ein. Bei Regel C wird der Rest in der Mitte angefügt, der Baum bleibt gerade und symmetrisch. Regel D ist die Spiegelung von B: Der Baum neigt sich nach rechts.</p>' +
        '<p>Aus einer einfachen Regel, die immer wieder auf alle Teile angewendet wird, entstehen schon nach wenigen Schritten komplexe Figuren. Solche Systeme heißen <strong>Lindenmayer-Systeme</strong> (L-Systeme); in der Computergrafik erzeugt man damit sehr echt wirkende Pflanzen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      radios = KEYS.map(function (k, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': k,
          'aria-label': 'Regel ' + k + ': ' + RULES[k].label,
          onclick: function () { choose(i, false); }, onkeydown: onKey
        });
        btn.innerHTML = '<span class="' + P + 'key" aria-hidden="true">' + k + '</span>' + svgRule(RULES[k], 'Regel ' + k);
        return btn;
      });
      stepBtns = [0, 1, 2, 3].map(function (n) {
        return h('button', {
          type: 'button', role: 'radio', class: P + 'stepbtn', 'aria-label': n === 0 ? 'Anfangsstück' : 'Wachstumsschritt ' + n,
          onclick: function () { setStep(n, false); }, onkeydown: onStepKey
        }, n === 0 ? 'Start' : 'Schritt ' + n);
      });
      previewEl = h('div', { class: P + 'preview' });
      previewNote = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      var target = h('div', { class: P + 'target' });
      target.innerHTML = svgTree(treeAt(RULES[RIGHT], TARGET_STEPS), boxFor(RIGHT), 3.4, 3, 'Der digitale Baum, nach dem gefragt ist: ein nach links gebogener Stamm mit vielen kleinen Zweigen', P + 'bigsvg');
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { class: P + 'sec ' + P + 'sec-target', 'aria-label': 'Der Baum' },
          h('h3', null, 'Der Baum (in 4 Schritten gewachsen)'), target,
          h('p', { class: P + 'note' }, 'Gezählt wird wie in den Beispielen: Anfangsstück, dann drei Wachstumsschritte.')),
        h('section', { class: P + 'sec ' + P + 'sec-rules', 'aria-label': 'Regeln' },
          h('h3', null, 'Welche Regel?'),
          h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Regeln A bis D' }, radios)),
        h('section', { class: P + 'sec ' + P + 'sec-try', 'aria-label': 'Regel ausprobieren' },
          h('h3', null, 'Regel ausprobieren'),
          h('div', { class: P + 'steps', role: 'radiogroup', 'aria-label': 'Wachstumsschritt' }, stepBtns),
          previewEl, previewNote)));
      refresh();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () { return { correct: selected === RIGHT, answer: { choice: selected } }; },
    setAnswer: function (ans) {
      selected = ans && KEYS.indexOf(ans.choice) >= 0 ? ans.choice : null;
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      refresh();
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () { selected = RIGHT; step = TARGET_STEPS; mark = 'solution'; locked = true; refresh(); }
  });
})();
