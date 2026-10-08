/* Aufgabe Konflikt-Detektor (Heft 2023, Klasse 11-13 schwer): Neuronale Netze, Perzeptron, XOR */
(function () {
  'use strict';
  var h = Biber.h;
  var NS = 'http://www.w3.org/2000/svg';

  /* Einheiten (Mittelpunkte im Bild) */
  var U = { A: [36, 36], B: [36, 176], M1: [200, 36], M2: [200, 176], Z: [346, 106] };
  var RAD = 26;
  /* Kabel: von, nach, Position des Schalters entlang des Kabels */
  var CABLES = [
    { id: 'AM1', from: 'A', to: 'M1', t: 0.5, name: 'von A zur oberen Mitteleinheit' },
    { id: 'AM2', from: 'A', to: 'M2', t: 0.3, name: 'von A zur unteren Mitteleinheit' },
    { id: 'BM1', from: 'B', to: 'M1', t: 0.3, name: 'von B zur oberen Mitteleinheit' },
    { id: 'BM2', from: 'B', to: 'M2', t: 0.5, name: 'von B zur unteren Mitteleinheit' },
    { id: 'M1Z', from: 'M1', to: 'Z', t: 0.5, name: 'von der oberen Mitteleinheit zu Z' },
    { id: 'M2Z', from: 'M2', to: 'Z', t: 0.5, name: 'von der unteren Mitteleinheit zu Z' }
  ];
  var PLUS = 1, MINUS = -1;
  /* alle richtigen Einstellungen (per Brute Force über 2^6 Belegungen bestimmt) */
  var SOLUTIONS = [[1, -1, -1, 1, 1, 1], [-1, 1, 1, -1, 1, 1]];

  function s(name, attrs, kids) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]);
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  function endpoints(c, gap) {
    var a = U[c.from], b = U[c.to];
    var dx = b[0] - a[0], dy = b[1] - a[1], d = Math.sqrt(dx * dx + dy * dy);
    return [a[0] + dx / d * RAD, a[1] + dy / d * RAD, b[0] - dx / d * (RAD + (gap || 0)), b[1] - dy / d * (RAD + (gap || 0))];
  }
  function sg(v) { return v === PLUS ? '+' : v === MINUS ? '−' : ''; }

  /* Simulation: unbelegte Kabel senden nichts */
  function fires(inp, cfg, ids) {
    var sum = 0;
    CABLES.forEach(function (c, i) {
      if (ids.indexOf(c.id) >= 0 && inp[c.from] && cfg[i]) sum += cfg[i];
    });
    return sum > 0;
  }
  function eval4(inp, cfg) {
    var st = { A: inp.A, B: inp.B };
    st.M1 = fires(st, cfg, ['AM1', 'BM1']);
    st.M2 = fires(st, cfg, ['AM2', 'BM2']);
    st.Z = fires(st, cfg, ['M1Z', 'M2Z']);
    return st;
  }
  function works(cfg) {
    return [false, true].every(function (a) {
      return [false, true].every(function (b) { return eval4({ A: a, B: b }, cfg).Z === (a !== b); });
    });
  }
  /* Selbsttest gegen die Brute-Force-Lösung */
  (function () {
    var n = 0;
    for (var m = 0; m < 64; m++) {
      var cfg = CABLES.map(function (_, i) { return (m >> i) & 1 ? PLUS : MINUS; });
      if (works(cfg)) n++;
    }
    if (n !== SOLUTIONS.length || !SOLUTIONS.every(works)) throw new Error('konflikt23: Lösungen stimmen nicht');
  })();

  function smallFigure() {
    return '<svg class="t-konflikt23-mini" viewBox="0 0 200 110" role="img" aria-label="Erste Maschine: Einheit A sendet über ein positives Kabel (+) an Z, Einheit B über ein negatives Kabel (−) an Z.">' +
      '<defs><marker id="t-konflikt23-arr0" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path class="t-konflikt23-ah" d="M1 1L9 5L1 9Z"/></marker></defs>' +
            '<line class="t-konflikt23-line" x1="44" y1="30" x2="146" y2="62" marker-end="url(#t-konflikt23-arr0)"/>' +
      '<line class="t-konflikt23-line" x1="44" y1="82" x2="146" y2="52" marker-end="url(#t-konflikt23-arr0)"/>' +
      '<circle class="t-konflikt23-unit" cx="24" cy="26" r="20"/><circle class="t-konflikt23-unit" cx="24" cy="86" r="20"/><circle class="t-konflikt23-unit" cx="164" cy="56" r="20"/>' +
      '<text class="t-konflikt23-ut" x="24" y="32" text-anchor="middle">A</text><text class="t-konflikt23-ut" x="24" y="92" text-anchor="middle">B</text><text class="t-konflikt23-ut" x="164" y="62" text-anchor="middle">Z</text>' +
      '<circle class="t-konflikt23-sg" cx="94" cy="47" r="10"/><circle class="t-konflikt23-sg" cx="94" cy="68" r="10"/>' +
      '<text class="t-konflikt23-st plus" x="94" y="53" text-anchor="middle">+</text><text class="t-konflikt23-st minus" x="94" y="74" text-anchor="middle">−</text></svg>';
  }

  var el, api, locked, cfg, inp, mode, svg, statusEl;

  function render() {
    var res = eval4(inp, cfg);
    var on = { A: inp.A, B: inp.B, M1: res.M1, M2: res.M2, Z: res.Z };
    var kids = [];
    kids.push(s('defs', {}, [s('marker', { id: 't-konflikt23-arr', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto' }, [s('path', { class: 't-konflikt23-ah', d: 'M1 1L9 5L1 9Z' })])]));
    CABLES.forEach(function (c) {
      var p = endpoints(c, 3);
      kids.push(s('line', { class: 't-konflikt23-line' + (on[c.from] ? ' act' : ''), x1: p[0], y1: p[1], x2: p[2], y2: p[3], 'marker-end': 'url(#t-konflikt23-arr)' }));
    });
    Object.keys(U).forEach(function (k) {
      var isIn = k === 'A' || k === 'B';
      var cls = 't-konflikt23-unit' + (on[k] ? ' on' : '') + (isIn ? ' input' : '');
      if (k === 'Z' && (mode === 'check' || mode === 'solution')) cls += works(cfg) ? ' right' : ' wrong';
      var label = isIn ? 'Eingabe ' + k + ': ' + (on[k] ? 'Ja' : 'Nein') + '. Antippen zum Umschalten (nur zum Ausprobieren).'
        : k === 'Z' ? 'Ausgabe Z: ' + (on[k] ? 'Ja' : 'Nein') : (k === 'M1' ? 'Obere' : 'Untere') + ' Mitteleinheit: ' + (on[k] ? 'Ja' : 'Nein');
      var g = s('g', { class: cls, 'data-u': isIn ? k : null, role: isIn ? 'button' : 'img', tabindex: isIn ? '0' : null, 'aria-label': label, 'aria-pressed': isIn ? String(!!on[k]) : null }, [
        s('circle', { class: 't-konflikt23-uc', cx: U[k][0], cy: U[k][1], r: RAD }),
        s('text', { class: 't-konflikt23-ut', x: U[k][0], y: U[k][1] + (k.length === 1 ? 0 : 0), 'text-anchor': 'middle', dy: k.length === 1 ? '-0.1em' : null }, [])
      ]);
      g.lastChild.textContent = k.length === 1 ? k : '';
      kids.push(g);
      var st = s('text', { class: 't-konflikt23-yn', x: U[k][0], y: U[k][1] + (k.length === 1 ? 16 : 5), 'text-anchor': 'middle' });
      st.textContent = on[k] ? 'Ja' : 'Nein';
      kids.push(st);
    });
    CABLES.forEach(function (c, i) {
      var a = U[c.from], b = U[c.to];
      var x = a[0] + (b[0] - a[0]) * c.t, y = a[1] + (b[1] - a[1]) * c.t;
      var v = cfg[i];
      var g = s('g', { class: 't-konflikt23-sw' + (v === PLUS ? ' plus' : v === MINUS ? ' minus' : ''), 'data-c': String(i), role: 'button', tabindex: locked ? null : '0',
        'aria-label': 'Kabel ' + c.name + ': ' + (v === PLUS ? 'positiv (+)' : v === MINUS ? 'negativ (−)' : 'noch nicht eingestellt') + (locked ? '' : '. Antippen zum Umschalten.') }, [
        s('circle', { class: 't-konflikt23-hit', cx: x, cy: y, r: 21 }),
        s('circle', { class: 't-konflikt23-sgc', cx: x, cy: y, r: 14 })
      ]);
      var t = s('text', { class: 't-konflikt23-st', x: x, y: y + 6.5, 'text-anchor': 'middle' });
      t.textContent = sg(v);
      g.appendChild(t);
      kids.push(g);
    });
    svg.replaceChildren.apply(svg, kids);
    var left = cfg.filter(function (v) { return !v; }).length;
    if (mode === 'check' || mode === 'solution') {
      statusEl.textContent = works(cfg) ? 'Der Konflikt-Detektor arbeitet korrekt: Z ist genau dann Ja, wenn A und B verschieden sind.' : 'Mit diesen Einstellungen arbeitet der Konflikt-Detektor nicht für alle vier Eingaben richtig.';
    } else statusEl.textContent = left ? 'Noch ' + left + (left === 1 ? ' Kabel' : ' Kabel') + ' ohne Einstellung.' : 'Alle Kabel sind eingestellt.';
  }

  function toggleCable(i) {
    if (locked) return;
    cfg[i] = cfg[i] === PLUS ? MINUS : PLUS;
    render();
    var g = svg.querySelector('[data-c="' + i + '"]'); if (g && g.hasAttribute('tabindex')) g.focus();
    api.changed();
  }
  function toggleInput(k) {
    inp[k] = !inp[k];
    render();
    var g = svg.querySelector('[data-u="' + k + '"]'); if (g) g.focus();
  }
  function act(t) {
    var c = t.closest('[data-c]'), u = t.closest('[data-u]');
    if (c) toggleCable(+c.getAttribute('data-c'));
    else if (u) toggleInput(u.getAttribute('data-u'));
  }

  function tableHtml() {
    var rows = '';
    [[false, false], [false, true], [true, false], [true, true]].forEach(function (p) {
      var r = eval4({ A: p[0], B: p[1] }, cfg);
      var want = p[0] !== p[1];
      var ok = r.Z === want;
      function yn(v) { return v ? 'Ja' : 'Nein'; }
      rows += '<tr class="' + (ok ? 'ok' : 'bad') + '"><td>' + yn(p[0]) + '</td><td>' + yn(p[1]) + '</td><td>' + yn(r.M1) + '</td><td>' + yn(r.M2) + '</td><td>' + yn(r.Z) +
        '</td><td>' + yn(want) + '</td><td aria-label="' + (ok ? 'richtig' : 'falsch') + '">' + (ok ? '✓' : '✗') + '</td></tr>';
    });
    return '<div class="t-konflikt23-tw"><table class="t-konflikt23-tab"><thead><tr><th>A</th><th>B</th><th>oben</th><th>unten</th><th>Z</th><th>Soll</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  Biber.register({
    id: 'konflikt23',
    story: '<p>Anna und Ben wollen einen „Konflikt-Detektor“ bauen, der anzeigt, ob sie unterschiedlicher Meinung sind.</p>' +
      '<p>Sie verwenden Einheiten, die in zwei Zuständen sein können: <b>Ja</b> und <b>Nein</b>. Zwei Einheiten können mit einem Kabel verbunden werden. ' +
      'Wenn eine Einheit im Zustand Ja ist, sendet sie über alle ausgehenden Kabel ein Signal; ist sie im Zustand Nein, sendet sie kein Signal. ' +
      'Die Kabel werden so eingestellt, dass sie ein Signal als positives (+) oder negatives (−) Signal an die rechts angeschlossene Einheit übermitteln. ' +
      'Eine angeschlossene Einheit geht in den Zustand Ja, wenn sie <b>mehr positive als negative</b> Signale empfängt, und sonst in den Zustand Nein. ' +
      'Als Eingabe setzt Anna den Zustand der Einheit A und Ben den Zustand der Einheit B.</p>' +
      '<p>Zuerst bauen Anna und Ben diese Maschine:</p>' + smallFigure() +
      '<p>Sie bemerken, dass die Einheit Z nur dann Ja ist, wenn A Ja und B Nein ist. Das ist nicht das, was sie wollen.</p>' +
      '<p>Dann bauen Anna und Ben eine größere Maschine (unten im Bild) und sind sicher, dass sie der Konflikt-Detektor sein kann: Z soll nur dann Ja sein, wenn A und B in unterschiedlichen Zuständen sind (Ja und Nein bzw. Nein und Ja). Ansonsten soll Z im Zustand Nein sein. Jetzt müssen nur noch die Kabel richtig eingestellt werden.</p>',
    question: 'Stelle für jedes Kabel ein, ob es ein Signal positiv (+) oder negativ (−) übermittelt, damit der Konflikt-Detektor korrekt arbeitet.',
    howto: 'Tippe auf einen grauen Kreis auf einem Kabel, um es auf + oder − zu stellen. Zum Ausprobieren kannst du A und B antippen, dann wechseln sie zwischen Ja und Nein; die Einheiten zeigen, was passiert.',
    explanation: function () {
      return '<p>Z soll genau bei den Eingaben „A Ja, B Nein“ und „A Nein, B Ja“ Ja sein. Z braucht dafür mindestens ein positives Kabel. ' +
        'Eine einzelne mittlere Einheit kann aber nur <b>einen</b> der beiden Fälle erkennen (wie die erste Maschine: ein Kabel +, das andere −). ' +
        'Deshalb braucht jeder Fall seine eigene mittlere Einheit: Die eine erhält von A ein + und von B ein −, die andere von A ein − und von B ein +. ' +
        'Beide Kabel zu Z müssen + sein. Welche mittlere Einheit welchen Fall übernimmt, ist egal. Es gibt darum genau zwei richtige Einstellungen.</p>' +
        '<p>So arbeitet deine Einstellung:</p>' + tableHtml() +
        '<p><b>Informatik:</b> Der Konflikt-Detektor berechnet das Exklusiv-Oder (XOR). Die erste Maschine ist ein vereinfachtes Perzeptron, wie es Frank Rosenblatt 1957 beschrieb; ' +
        'es kann Und und Oder, aber nicht XOR. Dafür braucht man eine zusätzliche Schicht von Einheiten, wie hier in der Mitte. ' +
        'Solche mehrschichtigen künstlichen neuronalen Netze sind die Grundlage vieler heutiger KI-Systeme.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; cfg = [0, 0, 0, 0, 0, 0]; inp = { A: false, B: false }; mode = null;
      svg = s('svg', { class: 't-konflikt23-svg', viewBox: '0 0 382 212', role: 'group', 'aria-label': 'Konflikt-Detektor mit den Eingaben A und B, zwei mittleren Einheiten und der Ausgabe Z. Sechs Kabel sind einzustellen.', focusable: 'false' });
      statusEl = h('p', { class: 't-konflikt23-status', 'aria-live': 'polite' });
      el.replaceChildren(h('div', { class: 't-konflikt23-box' }, svg, statusEl));
      svg.addEventListener('click', function (e) { act(e.target); });
      svg.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        if (!e.target.closest('[data-c],[data-u]')) return;
        e.preventDefault(); act(e.target);
      });
      render();
    },
    isComplete: function () { return cfg.every(function (v) { return v !== 0; }); },
    evaluate: function () { return { correct: works(cfg), answer: cfg.slice() }; },
    setAnswer: function (ans) {
      cfg = Array.isArray(ans) && ans.length === 6 ? ans.slice() : [0, 0, 0, 0, 0, 0];
      mode = 'check'; render();
    },
    lock: function (on) { locked = on; mode = on ? 'check' : null; render(); },
    reset: function () { cfg = [0, 0, 0, 0, 0, 0]; inp = { A: false, B: false }; mode = null; render(); },
    showSolution: function () { cfg = SOLUTIONS[0].slice(); mode = 'solution'; locked = true; render(); }
  });
})();
