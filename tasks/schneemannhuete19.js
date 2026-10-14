/* Aufgabe Schneemann-Hüte (Biber-Heft 2019, Klasse 3-4 schwer, 5-6 einfach): Hutstapel und Schneemann-Reihen anhand der Größenfolge zuordnen */
(function () {
  'use strict';
  var h = Biber.h, S = Biber.svg;

  /* Größen als Zahlen 1 (kleinster) bis 5 (größter), wie in der Lösung im Heft */
  var HATS = [[1, 2, 3, 4, 5], [5, 4, 3, 2, 1], [3, 2, 1, 5, 4], [4, 3, 5, 1, 2]]; /* Stapel von oben nach unten */
  var ROWS = [[1, 2, 3, 4, 5], [3, 2, 1, 5, 4], [5, 4, 3, 2, 1], [4, 3, 5, 1, 2]]; /* Reihen von links nach rechts */
  /* Der erste Schneemann bekommt den obersten Hut usw.: Stapel i passt zu Reihe j, wenn die Folgen gleich sind */
  var SOL = HATS.map(function (hs) {
    var m = -1;
    ROWS.forEach(function (r, j) { if (r.join() === hs.join()) m = j; });
    return m;
  });
  var COLORS = { 1: 'grün', 2: 'blau', 3: 'rosa', 4: 'rot', 5: 'orange' };

  var el, api, links, sel, locked, mode, drag, board, svg, suppress = false;
  /* links[i] = Index der verbundenen Reihe (-1 = keine) für Hutstapel i; sel = {side:'h'|'r', i} oder null; mode: null | 'check' | 'solution' */

  function reset() { links = [-1, -1, -1, -1]; sel = null; mode = null; drag = null; }
  function rowOf(j) { return links.indexOf(j); }

  function connect(hi, rj) {
    if (links[hi] === rj) { links[hi] = -1; return 'getrennt'; }
    var other = rowOf(rj);
    if (other >= 0) links[other] = -1;
    links[hi] = rj;
    return 'verbunden';
  }

  function hatLabel(i) {
    var l = 'Hutstapel ' + (i + 1) + ' von oben, Hüte von oben nach unten in den Größen ' + HATS[i].join(', ') + ' (1 = kleinster Hut, 5 = größter): ' + HATS[i].map(function (s) { return COLORS[s]; }).join(', ') + '.';
    return l + (links[i] >= 0 ? ' Verbunden mit Reihe ' + (links[i] + 1) + '.' : ' Noch nicht verbunden.');
  }
  function rowLabel(j) {
    var l = 'Schneemann-Reihe ' + (j + 1) + ' von oben, Schneemänner von links nach rechts in den Größen ' + ROWS[j].join(', ') + ' (1 = kleinster Schneemann, 5 = größter).';
    var hi = rowOf(j);
    return l + (hi >= 0 ? ' Verbunden mit Hutstapel ' + (hi + 1) + '.' : ' Noch nicht verbunden.');
  }

  function render() {
    var rows = [];
    for (var i = 0; i < 4; i++) {
      var hs = sel && sel.side === 'h' && sel.i === i, rs = sel && sel.side === 'r' && sel.i === i;
      rows.push(h('div', { class: 't-schneemannhuete19-row' },
        h('button', {
          type: 'button', class: 't-schneemannhuete19-card hat' + (hs ? ' sel' : '') + (links[i] >= 0 ? ' linked' : ''),
          'data-side': 'h', 'data-i': String(i), 'aria-pressed': String(!!hs), 'aria-label': hatLabel(i), disabled: locked
        }, h('img', { src: 'assets/schneemannhuete19/hut' + (i + 1) + '.png', alt: '', width: 160, height: 338, draggable: 'false' }),
        h('span', { class: 't-schneemannhuete19-dot', 'data-dot': 'h', 'aria-hidden': 'true' })),
        h('span', { class: 't-schneemannhuete19-gap' }),
        h('button', {
          type: 'button', class: 't-schneemannhuete19-card row' + (rs ? ' sel' : '') + (rowOf(i) >= 0 ? ' linked' : ''),
          'data-side': 'r', 'data-i': String(i), 'aria-pressed': String(!!rs), 'aria-label': rowLabel(i), disabled: locked
        }, h('img', { src: 'assets/schneemannhuete19/reihe' + (i + 1) + '.png', alt: '', width: 698, height: 329, draggable: 'false' }),
        h('span', { class: 't-schneemannhuete19-dot', 'data-dot': 'r', 'aria-hidden': 'true' }))));
    }
    svg = S('svg', { class: 't-schneemannhuete19-lines', 'aria-hidden': 'true', focusable: 'false' });
    board = h('div', { class: 't-schneemannhuete19-board' }, rows, svg,
      h('p', { class: 't-schneemannhuete19-sr', role: 'status', 'aria-live': 'polite' }, ''));
    el.replaceChildren(board);
    drawLines();
  }

  function dotPos(side, i) {
    var d = board.querySelector('[data-side="' + side + '"][data-i="' + i + '"] .t-schneemannhuete19-dot');
    if (!d) return null;
    var b = board.getBoundingClientRect(), r = d.getBoundingClientRect();
    return { x: r.left + r.width / 2 - b.left, y: r.top + r.height / 2 - b.top };
  }
  function drawLines() {
    if (!board || !svg) return;
    var b = board.getBoundingClientRect();
    if (!b.width) return;
    svg.setAttribute('viewBox', '0 0 ' + b.width + ' ' + b.height);
    svg.replaceChildren();
    links.forEach(function (j, i) {
      if (j < 0) return;
      var p = dotPos('h', i), q = dotPos('r', j);
      if (!p || !q) return;
      var cls = 't-schneemannhuete19-line';
      if (mode === 'check') cls += SOL[i] === j ? ' right' : ' wrong';
      else if (mode === 'solution') cls += ' right';
      svg.appendChild(S('line', { x1: p.x, y1: p.y, x2: q.x, y2: q.y, class: cls }));
    });
    if (drag && drag.pt) {
      var s = dotPos(drag.side, drag.i);
      if (s) svg.appendChild(S('line', { x1: s.x, y1: s.y, x2: drag.pt.x, y2: drag.pt.y, class: 't-schneemannhuete19-line temp' }));
    }
  }

  function say(t) { var p = board && board.querySelector('[role="status"]'); if (p) p.textContent = t; }

  function act(side, i) {
    var msg = '';
    if (!sel) { sel = { side: side, i: i }; msg = (side === 'h' ? 'Hutstapel ' : 'Reihe ') + (i + 1) + ' ausgewählt.'; }
    else if (sel.side === side) {
      if (sel.i === i) { sel = null; msg = 'Auswahl aufgehoben.'; } else { sel = { side: side, i: i }; msg = (side === 'h' ? 'Hutstapel ' : 'Reihe ') + (i + 1) + ' ausgewählt.'; }
    } else {
      var hi = side === 'h' ? i : sel.i, rj = side === 'r' ? i : sel.i;
      var r = connect(hi, rj);
      msg = 'Hutstapel ' + (hi + 1) + ' und Reihe ' + (rj + 1) + ' ' + r + '.';
      sel = null;
    }
    var keep = sel ? { side: sel.side, i: sel.i } : { side: side, i: i };
    render();
    var f = el.querySelector('[data-side="' + keep.side + '"][data-i="' + keep.i + '"]');
    if (f) f.focus();
    say(msg);
    api.changed(links.filter(function (x) { return x >= 0; }).length + ' von 4 verbunden.');
  }

  function onClick(e) {
    if (locked) return;
    var c = e.target.closest('[data-side]');
    if (!c) return;
    if (suppress) return;
    act(c.dataset.side, +c.dataset.i);
  }

  function dragStart(e) {
    var d = e.target.closest('[data-dot]');
    if (!d || locked || (e.button != null && e.button > 0)) return;
    var c = d.closest('[data-side]');
    drag = { side: c.dataset.side, i: +c.dataset.i, moved: false, pt: null, id: e.pointerId, x0: e.clientX, y0: e.clientY };
    try { d.setPointerCapture(e.pointerId); } catch (err) { /* ignorieren */ }
    e.preventDefault();
  }
  function dragMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
    drag.moved = true;
    var b = board.getBoundingClientRect();
    drag.pt = { x: e.clientX - b.left, y: e.clientY - b.top };
    drawLines();
  }
  function dragEnd(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dd = drag;
    drag = null;
    if (dd.moved) { suppress = true; setTimeout(function () { suppress = false; }, 60); }
    if (dd.moved && e.type === 'pointerup') {
      var t = document.elementFromPoint(e.clientX, e.clientY);
      var c = t && t.closest ? t.closest('[data-side]') : null;
      if (c && c.dataset.side !== dd.side) {
        var hi = dd.side === 'h' ? dd.i : +c.dataset.i, rj = dd.side === 'r' ? dd.i : +c.dataset.i;
        var rr = connect(hi, rj);
        sel = null;
        render();
        say('Hutstapel ' + (hi + 1) + ' und Reihe ' + (rj + 1) + ' ' + rr + '.');
        api.changed(links.filter(function (x) { return x >= 0; }).length + ' von 4 verbunden.');
        return;
      }
    }
    drawLines();
  }

  var ro = null;
  function onResize() { drawLines(); }

  Biber.register({
    id: 'schneemannhuete19',
    story: '<p>Die Schneemänner bekommen Hüte. Sie stellen sich in vier Reihen an. Jede Reihe sucht sich den passenden Hutstapel aus. Dann nimmt der erste Schneemann (links) den obersten Hut vom Stapel, der zweite den nächsten Hut, und so weiter.</p>' +
      '<p>Am Ende hat jeder den passenden Hut: Der kleinste Schneemann hat den kleinsten Hut, der zweitkleinste Schneemann den zweitkleinsten Hut, und so weiter.</p>',
    question: 'Verbinde jede Schneemann-Reihe mit dem passenden Hutstapel.',
    howto: 'Tippe einen Hutstapel und dann eine Schneemann-Reihe an, um sie zu verbinden. Du kannst auch vom gelben Punkt zum gelben Punkt ziehen. Eine Verbindung löst Du, indem Du dieselben beiden noch einmal antippst.',
    explanation: function () {
      return '<p>Wir nummerieren Schneemänner und Hüte nach der Größe: 1 ist der kleinste, 5 der größte. Dann hat <strong>der oberste Stapel</strong> von oben die Nummern 1-2-3-4-5 und passt zur <strong>obersten Reihe</strong> (1-2-3-4-5). <strong>Der zweite Stapel</strong> (5-4-3-2-1) passt zur <strong>dritten Reihe</strong>, <strong>der dritte Stapel</strong> (3-2-1-5-4) zur <strong>zweiten Reihe</strong> und <strong>der vierte Stapel</strong> (4-3-5-1-2) zur <strong>vierten Reihe</strong>.</p>' +
        '<p>Hüte werden dabei von oben vergeben, Schneemänner von links: Beide Folgen müssen gleich sein. Wir haben Hüte und Schneemänner durch Größenzahlen ersetzt und alles andere, zum Beispiel Farben, weggelassen. Das nennt man Abstraktion: Man behält nur die Information, die für das Problem wichtig ist. Dabei geht andere Information verloren. Stapel und Reihe (Schlange) sind außerdem zwei bekannte Datenstrukturen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('pointerdown', dragStart);
      el.addEventListener('pointermove', dragMove);
      el.addEventListener('pointerup', dragEnd);
      el.addEventListener('pointercancel', dragEnd);
      render();
      window.addEventListener('resize', onResize);
      if (ro) ro.disconnect();
      if (window.ResizeObserver) { ro = new ResizeObserver(function () { drawLines(); }); ro.observe(el); }
      setTimeout(drawLines, 50);
    },
    isComplete: function () { return links.every(function (j) { return j >= 0; }); },
    evaluate: function () {
      return { correct: links.every(function (j, i) { return j === SOL[i]; }), answer: links.slice() };
    },
    setAnswer: function (ans) {
      links = (Array.isArray(ans) ? ans : []).slice(0, 4);
      while (links.length < 4) links.push(-1);
      links = links.map(function (j) { return j >= 0 && j < 4 ? j : -1; });
      sel = null; mode = 'check';
      render();
    },
    lock: function (on) {
      locked = on; sel = null;
      if (on) { if (mode !== 'solution') mode = 'check'; } else mode = null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      links = SOL.slice(); sel = null; mode = 'solution'; locked = true;
      render();
    }
  });
})();
