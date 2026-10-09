/* Aufgabe Äpfel halbieren (Biber 2023, Klasse 3-4 einfach): obere und untere Apfelhälften nach dem Muster der Kerne zuordnen */
(function () {
  'use strict';
  var h = Biber.h, svg = Biber.svg;
  var P = 't-aepfel23-';

  /* Muster im Uhrzeigersinn: K = Kern, L = Loch (leeres Kernfach); a0 = Winkel (Grad, im Uhrzeigersinn von oben) des ersten Fachs.
     Abgelesen aus der Abbildung im Heft (S. 9); die Reihenfolge der Hälften ist wie im Heft. */
  var LEFT = [{ pat: 'KLLKK', a0: 15 }, { pat: 'LLLLK', a0: 10 }, { pat: 'KKKKK', a0: 10 }, { pat: 'KLKLK', a0: 10 }];
  var RIGHT = [{ pat: 'KKKKL', a0: 25 }, { pat: 'KLLKL', a0: 10 }, { pat: 'LLLLL', a0: 355 }, { pat: 'LLKKL', a0: 15 }];
  var N = 4;

  /* Zwei Hälften passen zusammen, wenn das Muster der einen (nach Drehen) das Gegenstück (K <-> L) der anderen ist. */
  function shiftFor(lp, rp) {
    for (var k = 0; k < 5; k++) {
      var ok = true;
      for (var s = 0; s < 5; s++) if (lp[s] === rp[(s + k) % 5]) { ok = false; break; }
      if (ok) return k;
    }
    return -1;
  }
  function fits(l, r) { return shiftFor(LEFT[l].pat, RIGHT[r].pat) >= 0; }
  var SOL = LEFT.map(function (x, l) {
    var js = RIGHT.map(function (y, r) { return r; }).filter(function (r) { return fits(l, r); });
    return js.length === 1 ? js[0] : -1;
  });

  /* ---------- Zeichnen (viewBox 0 0 360 520) ---------- */
  var VW = 360, VH = 520, R = 48, XL = 105, XR = 255, ROWS = [70, 195, 320, 445];
  var PETAL = 'M0 -3 C 9 -12 11 -29 1 -39 C -8 -29 -9 -12 0 -3 Z';
  function half(pat, a0, label) {
    var g = svg('g', { class: P + 'pat' });
    for (var s = 0; s < 5; s++) {
      var a = a0 + 72 * s;
      var pg = svg('g', { transform: 'rotate(' + a + ')' });
      pg.appendChild(svg('path', { class: P + 'petal', d: PETAL }));
      if (pat[s] === 'K') {
        pg.appendChild(svg('ellipse', { class: P + 'seed', cx: 0, cy: -21, rx: 4.6, ry: 10 }));
        pg.appendChild(svg('ellipse', { class: P + 'shine', cx: -1, cy: -22, rx: 1.8, ry: 5.5 }));
      }
      g.appendChild(pg);
    }
    return g;
  }
  function patText(pat) {
    return pat.split('').map(function (c) { return c === 'K' ? 'Kern' : 'Loch'; }).join(', ');
  }

  var el, api, locked, mark;
  var link, sel, rot, drag, clickBlock;
  var root, linesG, tempG, nodes = { L: [], R: [] }, rotBtns = { L: [], R: [] }, statusEl;
  var NAME = { L: 'Obere Hälfte', R: 'Untere Hälfte' };

  function cx(side) { return side === 'L' ? XL : XR; }
  function rightOf(l) { return link[l]; }
  function leftOf(r) { return link.indexOf(r); }
  function reset() { link = [-1, -1, -1, -1]; sel = null; rot = { L: [0, 0, 0, 0], R: [0, 0, 0, 0] }; mark = null; }

  function colorVar(l) { return 'var(--c' + ((l % 6) + 1) + ')'; }

  function update() {
    var n = link.filter(function (x) { return x >= 0; }).length;
    ['L', 'R'].forEach(function (side) {
      nodes[side].forEach(function (nd, i) {
        var l = side === 'L' ? i : leftOf(i), linked = l >= 0 && link[l] >= 0;
        var on = sel && sel.side === side && sel.i === i;
        nd.classList.toggle(P + 'sel', !!on);
        nd.classList.toggle(P + 'linked', linked);
        nd.setAttribute('aria-pressed', on ? 'true' : 'false');
        nd.setAttribute('aria-disabled', locked ? 'true' : 'false');
        var ring = nd.querySelector('.' + P + 'ring');
        if (linked) ring.setAttribute('stroke', colorVar(l)); else ring.removeAttribute('stroke');
        var other = '';
        if (linked) other = side === 'L' ? ' verbunden mit unterer Hälfte ' + (link[i] + 1) : ' verbunden mit oberer Hälfte ' + (l + 1);
        nd.setAttribute('aria-label', NAME[side] + ' ' + (i + 1) + ', Fächer im Uhrzeigersinn: ' + patText((side === 'L' ? LEFT : RIGHT)[i].pat) + (on ? ', ausgewählt' : '') + other);
        nd.querySelector('.' + P + 'rotg').style.transform = 'rotate(' + (rot[side][i] * 72) + 'deg)';
      });
    });
    while (linesG.firstChild) linesG.removeChild(linesG.firstChild);
    link.forEach(function (r, l) {
      if (r < 0) return;
      var good = fits(l, r);
      var cls = P + 'link' + (mark === 'check' ? (good ? ' ok' : ' bad') : (mark === 'solution' ? ' ok' : ''));
      var p = svg('path', { class: cls, d: 'M' + (XL + R - 2) + ' ' + ROWS[l] + ' L' + (XR - R + 2) + ' ' + ROWS[r] });
      if (!mark) p.setAttribute('stroke', colorVar(l));
      linesG.appendChild(p);
    });
    statusEl.textContent = n + ' von ' + N + ' Paaren verbunden.' + (sel ? ' Ausgewählt: ' + NAME[sel.side].toLowerCase() + ' ' + (sel.i + 1) + '.' : '');
  }

  function connect(l, r) {
    for (var k = 0; k < N; k++) if (link[k] === r) link[k] = -1;
    link[l] = r;
    sel = null;
  }
  function pick(side, i) {
    if (locked) return;
    if (sel && sel.side !== side) {
      if (side === 'R') connect(sel.i, i); else connect(i, sel.i);
    } else if (sel && sel.side === side && sel.i === i) {
      sel = null;
    } else {
      /* ggf. bestehende Verbindung lösen und diese Hälfte neu verbinden */
      if (side === 'L') link[i] = -1; else { var l = leftOf(i); if (l >= 0) link[l] = -1; }
      sel = { side: side, i: i };
    }
    update();
    api.changed();
  }
  function turn(side, i) {
    if (locked) return;
    rot[side][i] += 1;
    update();
  }

  /* Ziehen mit der Maus: von einer Hälfte zur gegenüberliegenden */
  function svgPoint(e) {
    var pt = root.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    var m = root.getScreenCTM();
    return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
  }
  function onDown(side, i, e) {
    if (locked || e.pointerType === 'touch' || e.button > 0) return;
    drag = { side: side, i: i, x: e.clientX, y: e.clientY, on: false };
  }
  function onMove(e) {
    if (!drag) return;
    if (!drag.on) {
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 8) return;
      drag.on = true;
      sel = null;
      if (drag.side === 'L') link[drag.i] = -1; else { var l0 = leftOf(drag.i); if (l0 >= 0) link[l0] = -1; }
      update();
    }
    var p = svgPoint(e);
    while (tempG.firstChild) tempG.removeChild(tempG.firstChild);
    tempG.appendChild(svg('path', { class: P + 'link ' + P + 'temp', d: 'M' + cx(drag.side) + ' ' + ROWS[drag.i] + ' L' + p.x + ' ' + p.y }));
  }
  function onUp(e) {
    if (!drag) return;
    var d = drag; drag = null;
    while (tempG.firstChild) tempG.removeChild(tempG.firstChild);
    if (!d.on) return;
    clickBlock = true; setTimeout(function () { clickBlock = false; }, 0);
    var t = document.elementFromPoint(e.clientX, e.clientY);
    var nd = t && t.closest ? t.closest('[data-side]') : null;
    if (nd && nd.getAttribute('data-side') !== d.side && root.contains(nd)) {
      var j = +nd.getAttribute('data-i');
      if (d.side === 'L') connect(d.i, j); else connect(j, d.i);
    }
    update();
    api.changed();
  }

  function build() {
    nodes = { L: [], R: [] }; rotBtns = { L: [], R: [] };
    root = svg('svg', { class: P + 'svg', viewBox: '0 0 ' + VW + ' ' + VH, role: 'group', 'aria-label': 'Obere Apfelhälften links, untere Apfelhälften rechts' });
    root.appendChild(svg('text', { class: P + 'cap', x: XL, y: 14, 'text-anchor': 'middle' }, 'oben'));
    root.appendChild(svg('text', { class: P + 'cap', x: XR, y: 14, 'text-anchor': 'middle' }, 'unten'));
    linesG = svg('g', { class: P + 'lines' });
    tempG = svg('g', { class: P + 'tempg' });
    root.appendChild(linesG);
    ['L', 'R'].forEach(function (side) {
      var data = side === 'L' ? LEFT : RIGHT;
      data.forEach(function (d, i) {
        var g = svg('g', { class: P + 'half', tabindex: 0, role: 'button', 'data-side': side, 'data-i': i, transform: 'translate(' + cx(side) + ' ' + ROWS[i] + ')' });
        g.appendChild(svg('circle', { class: P + 'ring', r: R + 6, fill: 'none' }));
        g.appendChild(svg('circle', { class: P + 'disc', r: R }));
        var rg = svg('g', { class: P + 'rotg' });
        rg.appendChild(half(d.pat, d.a0));
        g.appendChild(rg);
        g.addEventListener('click', function () { if (clickBlock) return; pick(side, i); });
        g.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(side, i); }
          else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); turn(side, i); }
        });
        g.addEventListener('pointerdown', function (e) { onDown(side, i, e); });
        root.appendChild(g);
        nodes[side][i] = g;
        /* Drehknopf */
        var bx = side === 'L' ? 24 : 336;
        var b = svg('g', { class: P + 'rot', tabindex: 0, role: 'button', transform: 'translate(' + bx + ' ' + ROWS[i] + ')', 'aria-label': NAME[side] + ' ' + (i + 1) + ' drehen' });
        b.appendChild(svg('circle', { r: 17 }));
        b.appendChild(svg('path', { class: P + 'arrow', d: 'M-6 3 A7 7 0 1 1 0 8 M-6 3 L-9.5 -2.5 M-6 3 L0 1.5', fill: 'none' }));
        b.addEventListener('click', function () { turn(side, i); });
        b.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); turn(side, i); } });
        root.appendChild(b);
        rotBtns[side][i] = b;
      });
    });
    root.appendChild(tempG);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', function () { drag = null; while (tempG.firstChild) tempG.removeChild(tempG.firstChild); update(); });
    /* Ziehen soll auch außerhalb des SVG zu Ende gehen */
    window.addEventListener('pointerup', function (e) { if (drag && !root.contains(e.target)) onUp(e); });
  }

  Biber.register({
    id: 'aepfel23',
    story:
      '<p>Äpfel kann man in eine obere und untere Hälfte teilen. Einige Apfelkerne bleiben in der oberen Hälfte, die anderen in der unteren Hälfte. An den Löchern und Kernen sieht man, dass die Hälften zusammen passen.</p>' +
      '<p>Gala halbiert vier Äpfel. Sie legt die oberen Hälften links und die unteren Hälften rechts untereinander.</p>',
    question: 'Welche Apfelhälften passen zusammen? Ordne die Apfelhälften einander zu.',
    howto: 'Tippe eine obere Hälfte an und danach die untere Hälfte, die dazu passt (oder ziehe mit der Maus von einer zur anderen). Mit dem runden Pfeil kannst du eine Hälfte drehen.',
    explanation: function () {
      return '<p>Jeder Apfel hat 5 Kerne. Zwei Hälften, die zusammen passen, haben also zusammen 5 Kerne: Die Hälfte mit 5 Kernen gehört zu der ohne Kern, die mit 1 Kern zu der mit 4 Kernen.</p>' +
        '<p>Bei den beiden übrigen Paaren haben die oberen Hälften je 3 Kerne, die unteren je 2. Hier hilft nur das Muster: Die Kerne und Löcher liegen in einer bestimmten Reihenfolge im Kreis. Die obere Hälfte mit drei Kernen nebeneinander (K-K-K-L-L) passt zu der unteren mit drei Löchern nebeneinander (L-L-L-K-K). Die obere Hälfte K-L-K-L-K passt zur unteren L-K-L-K-L. Dazu muss man die Hälften eventuell drehen.</p>' +
        '<p>Es genügt also nicht, nur die Anzahl der Kerne zu kennen: Für die richtige Zuordnung braucht man die Reihenfolge. Darum werden solche Daten in Programmen oft in einer <em>Liste</em> gespeichert.</p>';
    },
    mount: function (rootEl, a) {
      el = rootEl; api = a; locked = false; clickBlock = false; drag = null; reset();
      build();
      statusEl = h('p', { class: P + 'status', role: 'status', 'aria-live': 'polite' });
      el.replaceChildren(h('div', { class: P + 'board' }, root, statusEl));
      update();
    },
    isComplete: function () { return link.every(function (r) { return r >= 0; }); },
    evaluate: function () {
      var ok = link.every(function (r, l) { return r >= 0 && fits(l, r); });
      return { correct: ok, answer: { pairs: link.slice() } };
    },
    setAnswer: function (ans) {
      var p = ans && ans.pairs;
      link = Array.isArray(p) && p.length === N ? p.slice() : [-1, -1, -1, -1];
      sel = null; mark = 'check';
      update();
    },
    lock: function (on) {
      locked = on;
      if (on) { mark = mark === 'solution' ? 'solution' : 'check'; sel = null; } else mark = null;
      update();
    },
    reset: function () { reset(); update(); },
    showSolution: function () {
      link = SOL.slice(); sel = null; mark = 'solution'; locked = true;
      /* rechte Hälften so drehen, dass die Muster Fach für Fach zusammen passen */
      SOL.forEach(function (r, l) {
        var k = shiftFor(LEFT[l].pat, RIGHT[r].pat);
        var deg = LEFT[l].a0 - RIGHT[r].a0 - 72 * k;
        rot.R[r] = (((deg % 360) + 360) % 360) / 72;   /* in Schritten à 72 Grad, hier ggf. nicht ganzzahlig */
      });
      update();
    }
  });
})();
