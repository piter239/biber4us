/* Aufgabe Planet Z (2018, Klasse 5-6 mittel, 7-8 einfach): Ersetzungsregeln einer kontextfreien Grammatik anwenden */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-planetz18-';

  /* Bausteine mit Maßen (Einheiten wie im Heft): Haus H, Baum T, Block B (mehrere Blöcke werden gestapelt) */
  var W = { H: 44, T: 50, B: 66 };
  var GAP = 12, BH = 33, BG = 3;
  var COLOR = { H: '#ee2a22', crown: '#5bc236', trunk: '#7b3410', B: '#5599d8' };

  function stackH(k) { return k * BH + (k - 1) * BG; }
  function objH(o) {
    if (o === 'H') return 55;
    if (o === 'T') return 63;
    return stackH(+o.slice(1));          /* 'B1', 'B2', ... */
  }
  function objW(o) { return W[o.charAt(0)]; }

  /* Zeichnet eine Folge von Objekten mit gemeinsamer Standlinie bei y = base; liefert {svg, w} */
  function drawRow(objs, x0, base, mark) {
    var x = x0, out = '';
    objs.forEach(function (o, i) {
      var t = o.charAt(0), w = objW(o), k;
      if (t === 'H') {
        out += '<path fill="' + COLOR.H + '" d="M' + x + ' ' + (base - 33) + ' L' + (x + 22) + ' ' + (base - 55) + ' L' + (x + 44) + ' ' + (base - 33) + ' V' + base + ' H' + x + ' Z"/>';
      } else if (t === 'T') {
        out += '<rect fill="' + COLOR.trunk + '" x="' + (x + 19.5) + '" y="' + (base - 21) + '" width="11" height="21"/>' +
          '<path fill="' + COLOR.crown + '" transform="translate(' + x + ' ' + (base - 63) + ')" d="M3 12 C3 4 10 0 18 0 H38 C46 0 50 5 48 12 L45 22 C43 32 40 40 34 41 H12 C4 38 0 32 2 24 Z"/>';
        if (mark === i) out += '<rect x="' + (x - 5) + '" y="' + (base - 68) + '" width="60" height="73" rx="6" fill="none" stroke="var(--bad)" stroke-width="3" stroke-dasharray="6 4"/>';
      } else {
        k = +o.slice(1);
        for (var j = 0; j < k; j++) out += '<rect fill="' + COLOR.B + '" x="' + x + '" y="' + (base - BH - j * (BH + BG)) + '" width="' + w + '" height="' + BH + '"/>';
      }
      x += w + GAP;
    });
    return { svg: out, w: x - GAP - x0 };
  }
  function rowSvg(objs, opts) {
    opts = opts || {};
    var pad = 8, hh = 0;
    objs.forEach(function (o) { hh = Math.max(hh, objH(o)); });
    hh = Math.max(hh, opts.minH || 0);
    var nat = drawRow(objs, 0, 0).w;
    var vw = Math.max(nat + 2 * pad, opts.minW || 0), vh = hh + 2 * pad;
    var r = drawRow(objs, (vw - nat) / 2, hh + pad, opts.mark);
    return '<svg xmlns="http://www.w3.org/2000/svg" class="' + (opts.cls || P + 'row') + '" viewBox="0 0 ' + vw + ' ' + vh + '" width="' + (vw * (opts.scale || 1)) + '" height="' + (vh * (opts.scale || 1)) +
      '" role="img" aria-label="' + (opts.label || '') + '" focusable="false">' + r.svg + '</svg>';
  }

  /* Städte A bis D von links nach rechts */
  var CITIES = {
    A: { objs: ['H', 'T', 'B3'], text: 'ein Haus, ein Baum, daneben ein Turm aus drei Blöcken' },
    B: { objs: ['T', 'B3', 'T'], text: 'ein Baum, ein Turm aus drei Blöcken, ein weiterer Baum' },
    C: { objs: ['H', 'H', 'H', 'H'], text: 'vier Häuser' },
    D: { objs: ['T', 'B3', 'T', 'B3'], text: 'ein Baum, ein Turm aus drei Blöcken, ein Baum, ein Turm aus drei Blöcken' }
  };
  var IDS = ['A', 'B', 'C', 'D'];
  var CORRECT = 'B';
  var VH = 71;               /* gemeinsame Höhe der Kartenbilder: höchster Turm */

  function arrow(label) {
    return '<span class="' + P + 'arr" aria-hidden="true"><i>' + (label || '') + '</i><b>→</b></span>';
  }
  function rule(n, left, right, txt) {
    return '<li class="' + P + 'rule"><span class="' + P + 'rn" aria-hidden="true">' + n + ')</span>' +
      rowSvg(left, { minH: 70, label: '' }) + arrow() + rowSvg(right, { minH: 70, label: '' }) +
      '<span class="' + P + 'sr">Regel ' + n + ': ' + txt + '</span></li>';
  }
  var storyHtml = '<p>Die Leute auf Planet Z bauen ihre Städte immer auf die gleiche Weise.</p>' +
    '<p class="' + P + 'start">Sie beginnen mit einem Haus: ' + rowSvg(['H'], { label: 'Haus', scale: 0.8 }) + '</p>' +
    '<p>Dann ersetzen sie einzelne Objekte nach diesen drei Regeln:</p>' +
    '<ul class="' + P + 'rules">' +
    rule(1, ['H'], ['H', 'H'], 'Ein Haus wird durch zwei Häuser ersetzt.') +
    rule(2, ['H'], ['T', 'B1'], 'Ein Haus wird durch einen Baum und rechts daneben einen Block ersetzt.') +
    rule(3, ['B1'], ['B2'], 'Ein Block wird durch zwei übereinander gestapelte Blöcke ersetzt.') +
    '</ul>' +
    '<p>Ein Beispiel: Wenn man zuerst Regel 1, dann Regel 2 und dann zwei Mal Regel 3 anwendet, baut man diese Stadt:</p>' +
    '<div class="' + P + 'ex">' +
    '<span class="' + P + 'st">' + rowSvg(['H'], { label: 'Start: ein Haus', scale: 0.7, minH: 100 }) + '</span>' +
    '<span class="' + P + 'st">' + arrow('Regel 1') + rowSvg(['H', 'H'], { label: 'zwei Häuser', scale: 0.7, minH: 100 }) + '</span>' +
    '<span class="' + P + 'st">' + arrow('Regel 2') + rowSvg(['H', 'T', 'B1'], { label: 'Haus, Baum, Block', scale: 0.7, minH: 100 }) + '</span>' +
    '<span class="' + P + 'st">' + arrow('Regel 3') + rowSvg(['H', 'T', 'B2'], { label: 'Haus, Baum, zwei Blöcke', scale: 0.7, minH: 100 }) + '</span>' +
    '<span class="' + P + 'st">' + arrow('Regel 3') + rowSvg(['H', 'T', 'B3'], { label: 'Haus, Baum, drei Blöcke', scale: 0.7, minH: 100 }) + '</span>' +
    '</div>' +
    '<p>Beachte, dass die Reihenfolge der Objekte nicht verändert wird.</p>';

  var el, api;
  var choice, locked, mark;

  function reset() { choice = null; mark = null; }

  function render() {
    var cards = IDS.map(function (id, i) {
      var c = CITIES[id];
      var cls = P + 'card' + (choice === id ? ' sel' : '');
      var badge = null;
      if (mark === 'check' && choice === id) {
        var ok = id === CORRECT;
        cls += ok ? ' right' : ' wrong';
        badge = h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      } else if (mark === 'solution' && id === CORRECT) cls += ' right';
      var tab = choice ? (choice === id ? '0' : '-1') : (i === 0 ? '0' : '-1');
      var pic = h('span', { class: P + 'pic', 'aria-hidden': 'true' });
      pic.innerHTML = rowSvg(c.objs, { minH: VH, minW: 290, cls: P + 'city' });
      return h('button', {
        type: 'button', role: 'radio', class: cls, 'data-opt': id, 'aria-checked': String(choice === id),
        tabindex: tab, disabled: locked,
        'aria-label': 'Stadt ' + id + ': ' + c.text
      }, h('span', { class: P + 'name', 'aria-hidden': 'true' }, id + ')'), pic, badge);
    });
    el.replaceChildren(h('div', { class: P + 'board', role: 'radiogroup', 'aria-label': 'Die vier Städte A bis D' }, cards));
  }

  function pick(id) {
    if (locked) return;
    choice = id;
    render();
    var b = el.querySelector('[data-opt="' + id + '"]');
    if (b) b.focus();
    api.changed('Stadt ' + id + ' ausgewählt.');
  }
  function onClick(e) {
    var b = e.target.closest('[data-opt]');
    if (b && !locked) pick(b.dataset.opt);
  }
  function onKey(e) {
    var b = e.target.closest('[data-opt]');
    if (!b || locked) return;
    var i = IDS.indexOf(b.dataset.opt), d = 0;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') d = 1;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') d = -1;
    else return;
    e.preventDefault();
    pick(IDS[(i + d + IDS.length) % IDS.length]);
  }

  function explainHtml() {
    return '<p><strong>Stadt B</strong> steht nicht auf Planet Z. Ein Baum entsteht nur durch Regel 2, und die setzt immer einen Block rechts neben den Baum. Es gibt keine Regel, die einen Block entfernt oder einen Baum allein stehen lässt. In Stadt B hat der rechte Baum aber keinen Block neben sich:</p>' +
      '<div class="' + P + 'ex">' + rowSvg(CITIES.B.objs, { mark: 2, scale: 0.8, label: 'Stadt B, der rechte Baum ist markiert' }) + '</div>' +
      '<p>Die anderen Städte kann man bauen:</p>' +
      '<ul class="' + P + 'why">' +
      '<li><b>A:</b> Regel 1, 2, 3 und noch einmal 3 (wie im Beispiel).</li>' +
      '<li><b>C:</b> Regel 1 drei Mal anwenden.</li>' +
      '<li><b>D:</b> Erst Regel 1 (zwei Häuser), dann Regel 2 für jedes Haus (Baum, Block, Baum, Block). Danach Regel 3 für beide Blöcke und dann noch einmal für je einen Block der beiden Türme: So entstehen zwei Türme aus drei Blöcken.</li></ul>' +
      '<p>Startsymbol und Ersetzungsregeln bilden zusammen eine <em>Grammatik</em>. Sie legt fest, was „richtig gebaut“ ist, so wie die Grammatik einer Programmiersprache festlegt, welche Programme korrekt sind. Ein Compiler prüft das, bevor er ein Programm übersetzt. Die Regeln von Planet Z sind <em>kontextfrei</em>: Ein einzelnes Objekt wird ersetzt, ohne zu beachten, was links und rechts davon steht. Das macht die Prüfung leicht.</p>';
  }

  Biber.register({
    id: 'planetz18',
    story: storyHtml,
    question: 'Welche Stadt steht NICHT auf Planet Z?',
    howto: 'Tippe auf die Stadt, die nicht nach den Regeln gebaut sein kann.',
    explanation: explainHtml,
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKey);
      render();
    },
    isComplete: function () { return !!choice; },
    evaluate: function () { return { correct: choice === CORRECT, answer: { choice: choice } }; },
    setAnswer: function (ans) {
      choice = ans && CITIES[ans.choice] ? ans.choice : null;
      mark = choice ? 'check' : null;
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? 'check' : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      choice = CORRECT; mark = 'solution'; locked = true;
      render();
    }
  });
})();
