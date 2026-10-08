/* Aufgabe Fiat Lux (Biber 2022, Heft S. 25): Schaltung aus UND- und XOR-Bauteilen */
(function () {
  'use strict';
  var h = Biber.h;

  var VW = 400, VH = 480;
  var LET = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  var SW_Y = LET.map(function (_, i) { return 30 + i * 60; });
  var GW = 30;                                  // Breite der Bauteile
  // Bauteile nach der Abbildung im Heft: in = Eingänge (Schalter 'sA'… oder Bauteile 'g4'…), Nummern wie in der Lösung
  var GATES = [
    { id: 'g4', kind: 'and', x: 118, y: 60, in: ['sA', 'sB'] },
    { id: 'g5', kind: 'xor', x: 118, y: 180, in: ['sC', 'sD'] },
    { id: 'g6', kind: 'and', x: 118, y: 300, in: ['sE', 'sF'] },
    { id: 'g7', kind: 'xor', x: 118, y: 420, in: ['sG', 'sH'] },
    { id: 'g2', kind: 'and', x: 188, y: 120, in: ['g4', 'g5'] },
    { id: 'g3', kind: 'xor', x: 188, y: 360, in: ['g6', 'g7'] },
    { id: 'g1', kind: 'and', x: 258, y: 240, in: ['g2', 'g3'] }
  ];
  var POS = {};
  LET.forEach(function (l, i) { POS['s' + l] = { x: 78, y: SW_Y[i] }; });
  GATES.forEach(function (g) { POS[g.id] = { x: g.x + GW, y: g.y }; });
  var KINDNAME = { and: 'UND-Bauteil', xor: 'XOR-Bauteil (genau ein Eingang)' };

  function simulate(sw) {
    var v = {};
    LET.forEach(function (l, i) { v['s' + l] = !!sw[i]; });
    GATES.slice().sort(function (a, b) { return a.x - b.x; }).forEach(function (g) {
      var a = v[g.in[0]], b = v[g.in[1]];
      v[g.id] = g.kind === 'and' ? (a && b) : (a !== b);
    });
    return v;
  }
  function lit(sw) { return !!simulate(sw).g1; }

  var SOLUTION = [1, 1, 1, 0, 1, 1, 0, 0];     // A, B, C, E und F an: leuchtet (eine von 16 Möglichkeiten)

  /* ---- Zeichnung ---- */
  function wire(from, g, idx, v) {
    var a = POS[from], xm = g.x - 14, py = g.y + (idx ? 11 : -11);
    var on = v && v[from];
    return '<path class="t-fiatlux22-wire' + (on ? ' on' : '') + '" d="M' + a.x + ',' + a.y + ' H' + xm + ' V' + py + ' H' + g.x + '"/>';
  }
  function gateShape(g, on) {
    var body;
    if (g.kind === 'and') body = '<path class="t-fiatlux22-gate and" d="M0,-18 H14 A16,18 0 0 1 14,18 H0 Z"/>';
    else body = '<path class="t-fiatlux22-gate xor" d="M5,-18 H15 A15,18 0 0 1 15,18 H5 Q13,0 5,-18 Z"/>' +
      '<path class="t-fiatlux22-xorline" d="M-1,-18 Q7,0 -1,18"/>';
    return '<g transform="translate(' + g.x + ',' + g.y + ')">' + body +
      '<text class="t-fiatlux22-gtext" x="' + (g.kind === 'and' ? 13 : 16) + '" y="4" text-anchor="middle">' + (g.kind === 'and' ? 'UND' : 'XOR') + '</text></g>';
  }
  function switchShape(i, on) {
    var y = SW_Y[i];
    return '<g class="t-fiatlux22-sw' + (on ? ' on' : '') + '">' +
      '<text class="t-fiatlux22-letter" x="8" y="' + (y + 5) + '">' + LET[i] + '</text>' +
      '<rect class="t-fiatlux22-track" x="22" y="' + (y - 13) + '" width="56" height="26" rx="13"/>' +
      '<circle class="t-fiatlux22-knob" cx="' + (on ? 65 : 35) + '" cy="' + y + '" r="10"/>' +
      '<text class="t-fiatlux22-state" x="' + (on ? 36 : 65) + '" y="' + (y + 4) + '" text-anchor="middle">' + (on ? 'AN' : 'AUS') + '</text></g>';
  }
  function lampShape(on) {
    var x0 = 304, y0 = 190, w = 92, hh = 100, dots = '';
    var n = 0, pts = [];
    for (var k = 0; k < 5; k++) pts.push([x0 + 10 + k * (w - 20) / 4, y0 + 9], [x0 + 10 + k * (w - 20) / 4, y0 + hh - 9]);
    for (var j = 1; j < 4; j++) pts.push([x0 + 9, y0 + 9 + j * (hh - 18) / 4], [x0 + w - 9, y0 + 9 + j * (hh - 18) / 4]);
    pts.forEach(function (p) { dots += '<circle class="t-fiatlux22-bulb" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="3.6"/>'; });
    return '<g class="t-fiatlux22-lamp' + (on ? ' on' : '') + '">' +
      '<rect class="t-fiatlux22-board" x="' + x0 + '" y="' + y0 + '" width="' + w + '" height="' + hh + '" rx="9"/>' + dots +
      '<ellipse class="t-fiatlux22-sign" cx="' + (x0 + w / 2) + '" cy="' + (y0 + hh / 2) + '" rx="34" ry="24"/>' +
      '<text class="t-fiatlux22-signtext" x="' + (x0 + w / 2) + '" y="' + (y0 + hh / 2 - 1) + '" text-anchor="middle">FIAT</text>' +
      '<text class="t-fiatlux22-signtext" x="' + (x0 + w / 2) + '" y="' + (y0 + hh / 2 + 15) + '" text-anchor="middle">LUX</text></g>';
  }
  function svg(sw, showPower) {
    var v = showPower ? simulate(sw) : null;
    var s = '<svg class="t-fiatlux22-svg" viewBox="0 0 ' + VW + ' ' + VH + '" aria-hidden="true" focusable="false">';
    GATES.forEach(function (g) { s += wire(g.in[0], g, 0, v) + wire(g.in[1], g, 1, v); });
    var o = POS.g1, on1 = v && v.g1;
    s += '<path class="t-fiatlux22-wire' + (on1 ? ' on' : '') + '" d="M' + o.x + ',' + o.y + ' H304"/>';
    // eingeschaltete Leitungen noch einmal oben auf die ausgeschalteten legen
    GATES.forEach(function (g) {
      [0, 1].forEach(function (i) { if (v && v[g.in[i]]) s += wire(g.in[i], g, i, v); });
    });
    GATES.forEach(function (g) { s += gateShape(g); });
    sw.forEach(function (x, i) { s += switchShape(i, !!x); });
    s += lampShape(!!on1);
    return s + '</svg>';
  }

  /* ---- Zustand ---- */
  var el, api, sw, locked, helpOn, touched, mark;   // mark: null | 'check' | 'solution'

  function reset() { sw = [0, 0, 0, 0, 0, 0, 0, 0]; helpOn = false; touched = false; mark = null; }
  function showPower() { return locked || helpOn; }
  function count() { return sw.reduce(function (a, b) { return a + b; }, 0); }

  function render() {
    var fig = h('div', { class: 't-fiatlux22-fig' });
    fig.innerHTML = svg(sw, showPower());
    LET.forEach(function (l, i) {
      fig.appendChild(h('button', {
        type: 'button', class: 't-fiatlux22-btn', 'data-i': String(i), disabled: locked, 'aria-pressed': String(!!sw[i]),
        'aria-label': 'Schalter ' + l + ': ' + (sw[i] ? 'an' : 'aus'), title: 'Schalter ' + l,
        style: 'left:' + (22 / VW * 100).toFixed(2) + '%;top:' + ((SW_Y[i] - 27) / VH * 100).toFixed(2) + '%;width:' + (60 / VW * 100).toFixed(2) + '%;height:' + (54 / VH * 100).toFixed(2) + '%'
      }));
    });
    var status;
    if (locked) status = lit(sw) ? 'Das Schild leuchtet.' : 'Das Schild leuchtet nicht.';
    else if (helpOn) status = lit(sw) ? 'Strom angezeigt: Das Schild leuchtet.' : 'Strom angezeigt: Das Schild leuchtet noch nicht.';
    else status = count() + ' von 8 Schaltern an.';
    var tools = h('div', { class: 't-fiatlux22-tools' },
      h('button', { type: 'button', class: 't-fiatlux22-help', 'data-help': '1', 'aria-pressed': String(showPower()), disabled: locked },
        showPower() ? 'Strom verbergen' : 'Strom anzeigen (Hilfe)'),
      h('p', { class: 't-fiatlux22-status', 'aria-live': 'polite' }, status));
    el.replaceChildren(h('div', { class: 't-fiatlux22-board-wrap' }, fig, tools));
  }

  function onClick(e) {
    if (locked) return;
    var help = e.target.closest('[data-help]');
    if (help) { helpOn = !helpOn; render(); var hb = el.querySelector('[data-help]'); if (hb) hb.focus({ preventScroll: true }); return; }
    var t = e.target.closest('[data-i]');
    if (!t) return;
    var i = +t.dataset.i;
    sw[i] = sw[i] ? 0 : 1;
    touched = true;
    render();
    var again = el.querySelector('[data-i="' + i + '"]');
    if (again) again.focus({ preventScroll: true });
    api.changed();
  }

  function legend() {
    return '<ul class="t-fiatlux22-legend">' +
      '<li><svg viewBox="0 0 64 40" aria-hidden="true" focusable="false"><g transform="translate(14,20)"><path class="t-fiatlux22-gate and" d="M0,-18 H14 A16,18 0 0 1 14,18 H0 Z"/><text class="t-fiatlux22-gtext" x="13" y="4" text-anchor="middle">UND</text></g></svg>' +
      '<span>hat Strom, wenn <strong>beide</strong> Eingangsdrähte Strom haben.</span></li>' +
      '<li><svg viewBox="0 0 64 40" aria-hidden="true" focusable="false"><g transform="translate(14,20)"><path class="t-fiatlux22-gate xor" d="M5,-18 H15 A15,18 0 0 1 15,18 H5 Q13,0 5,-18 Z"/><path class="t-fiatlux22-xorline" d="M-1,-18 Q7,0 -1,18"/><text class="t-fiatlux22-gtext" x="16" y="4" text-anchor="middle">XOR</text></g></svg>' +
      '<span>hat Strom, wenn <strong>genau ein</strong> Eingangsdraht Strom hat.</span></li></ul>';
  }

  Biber.register({
    id: 'fiatlux22',
    story: '<p>Das Spiel „Fiat Lux“ hat 8 Schalter, die an oder aus sein können. Von den Schaltern aus gehen Drähte zu Bauteilen, von diesen wieder zu anderen Bauteilen und schließlich zu einem Leuchtschild.</p>' +
      '<ul><li>Der Ausgangsdraht eines Schalters hat Strom, wenn der Schalter <strong>an</strong> ist.</li>' +
      '<li>Das Leuchtschild leuchtet, wenn sein Eingangsdraht Strom hat.</li></ul>' +
      '<p>Der Ausgangsdraht eines Bauteils hat Strom unter diesen Bedingungen:</p>' + legend(),
    question: 'Stelle die Schalter so, dass das Leuchtschild leuchtet.',
    howto: 'Tippe einen Schalter an, um ihn ein- oder auszuschalten. Wenn du magst, kannst du dir mit „Strom anzeigen“ helfen lassen, welche Drähte Strom haben.',
    explanation: function () {
      var right = lit(sw);
      return '<p>Am besten rechnet man vom Leuchtschild rückwärts. Es leuchtet nur, wenn <strong>beide</strong> Drähte vor dem letzten UND-Bauteil Strom haben.</p>' +
        '<ul><li><strong>Oberer Teil:</strong> Das UND-Bauteil braucht Strom von A <em>und</em> B (beide an) und vom XOR-Bauteil, also genau einem der Schalter C und D. Möglich sind: A, B, C an (D aus) oder A, B, D an (C aus).</li>' +
        '<li><strong>Unterer Teil:</strong> Das XOR-Bauteil braucht genau einen Strom führenden Draht. Entweder sind E und F beide an und G, H gleich (beide an oder beide aus), oder E und F sind nicht beide an und genau einer von G und H ist an. Dafür gibt es 8 Möglichkeiten.</li></ul>' +
        '<p>Beide Teile lassen sich beliebig kombinieren: 2 · 8 = <strong>16 richtige Schalterstellungen</strong>. Jede davon wird als richtig gewertet' + (right ? '' : ', deine leider nicht') + '. Eine Möglichkeit: A, B, C, E und F an, alle anderen aus.</p>' +
        '<p><strong>Informatik:</strong> Draht und Schalter kennen nur zwei Zustände, an oder aus. Das ist die kleinste Informationseinheit, ein <em>Bit</em> (0 oder 1). Die Bauteile verrechnen Bits wie die Operationen AND und XOR. ' +
        'Auch in echten Computern stecken Schaltungen aus solchen einfachen Bauteilen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      render();
    },
    isComplete: function () { return count() > 0; },
    evaluate: function () { return { correct: lit(sw), answer: sw.slice() }; },
    setAnswer: function (ans) {
      sw = LET.map(function (_, i) { return ans && ans[i] ? 1 : 0; });
      touched = true; mark = 'check';
      locked = true;
      render();
    },
    lock: function (on) {
      locked = on;
      if (!on) { helpOn = false; mark = null; } else if (mark !== 'solution') mark = 'check';
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      sw = SOLUTION.slice(); mark = 'solution'; locked = true;
      render();
    }
  });
})();
