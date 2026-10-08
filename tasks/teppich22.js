/* Aufgabe Teppichmuster (Heft 2022, S. 56; Klasse 5-6 schwer, 7-8 mittel): Ja-Nein-Anleitung auf Teppichfelder anwenden, Auswahl A-D */
(function () {
  'use strict';
  var h = Biber.h;
  var IMG = 'assets/teppich22/';

  var SYM = {
    M: { name: 'Mäander', img: 'meander', w: 140, h: 122 },
    D: { name: 'Mandala', img: 'mandala', w: 139, h: 140 },
    Y: { name: 'Y-Würfel', img: 'ypsilon', w: 140, h: 137 },
    F: { name: 'Windrad', img: 'blume', w: 140, h: 135 }
  };
  var KEYS = ['A', 'B', 'C', 'D'];
  /* Die vier Teppiche aus dem Heft (Zeile für Zeile, M = Mäander, D = Mandala, Y = Y-Würfel, F = Windrad) */
  var OPT = {
    A: ['MMMMMM', 'MDYYYM', 'MFDYYM', 'MFFDYM', 'MFFFDM', 'MMMMMM'],
    B: ['MMMMMM', 'MDFFFM', 'MYDFFM', 'MYYDFM', 'MYYYDM', 'MMMMMM'],
    C: ['MMMMMF', 'MDFFFM', 'MYDFFM', 'MYYDFM', 'MYYYDM', 'YMMMMM'],
    D: ['DMMMMM', 'MDFFFM', 'MYDFFM', 'MYYDFM', 'MYYYDM', 'MMMMMD']
  };
  var CORRECT = 'B';          /* offizielle Lösung (Heft S. 57) */
  var QS = [
    'Ist die Nummer der Zeile oder der Spalte (oder beide) eine 1 oder eine 6?',
    'Sind die Nummer der Zeile und die Nummer der Spalte gleich?',
    'Ist die Nummer der Zeile größer als die Nummer der Spalte?'
  ];

  /* Die Anleitung von Hale: liefert Symbol und die Antworten auf die gestellten Fragen */
  function run(r, c) {
    if (r === 1 || r === 6 || c === 1 || c === 6) return { sym: 'M', ans: [true] };
    if (r === c) return { sym: 'D', ans: [false, true] };
    return r > c ? { sym: 'Y', ans: [false, false, true] } : { sym: 'F', ans: [false, false, false] };
  }
  function rowsOf() {
    return [1, 2, 3, 4, 5, 6].map(function (r) { return [1, 2, 3, 4, 5, 6].map(function (c) { return run(r, c).sym; }).join(''); });
  }

  function symImg(k, cls) {
    return h('img', { class: cls || 't-teppich22-sym', src: IMG + SYM[k].img + '.png', alt: '', width: SYM[k].w, height: SYM[k].h, draggable: 'false' });
  }
  function bgClass(r, c) { return 't-teppich22-bg' + ((r % 2 === 1 ? 0 : 2) + (c % 2 === 1 ? 0 : 1)); }

  /* Teppich als Gitternetz; cellFn(r, c) liefert das Zellelement */
  function carpet(cellFn, extra) {
    var box = h('span', { class: 't-teppich22-carpet' + (extra ? ' ' + extra : '') });
    box.appendChild(h('span', { class: 't-teppich22-ax', 'aria-hidden': 'true' }));
    for (var c = 1; c <= 6; c++) box.appendChild(h('span', { class: 't-teppich22-ax', 'aria-hidden': 'true' }, String(c)));
    for (var r = 1; r <= 6; r++) {
      box.appendChild(h('span', { class: 't-teppich22-ax', 'aria-hidden': 'true' }, String(r)));
      for (c = 1; c <= 6; c++) box.appendChild(cellFn(r, c));
    }
    return box;
  }
  function staticCarpet(rows, stage) {
    return carpet(function (r, c) {
      var k = rows[r - 1][c - 1];
      var show = !stage || (stage === 1 && k === 'M') || (stage === 2 && (k === 'M' || k === 'D')) || stage === 3;
      return h('span', { class: 't-teppich22-cell ' + bgClass(r, c) }, show ? symImg(k) : null);
    });
  }
  function describe(k) {
    return OPT[k].map(function (row, i) {
      return 'Zeile ' + (i + 1) + ': ' + row.split('').map(function (s) { return SYM[s].name; }).join(', ');
    }).join('. ');
  }

  var el, api, choice, locked, mark;
  var cards = {};
  var revealed, probe, flowQ, flowOut, probeInfo, cellBtns;

  function refresh() {
    KEYS.forEach(function (k) {
      var c = cards[k], on = choice === k;
      var cls = 't-teppich22-card' + (on ? ' on' : ''), badge = '';
      if (mark === 'check' && on) { cls += k === CORRECT ? ' right' : ' wrong'; badge = k === CORRECT ? '✓' : '✗'; }
      else if (mark === 'solution' && k === CORRECT) { cls += ' right'; badge = '✓'; }
      c.btn.className = cls;
      c.btn.setAttribute('aria-pressed', String(on));
      c.btn.disabled = !!locked;
      c.badge.textContent = badge;
      c.badge.hidden = !badge;
    });
  }

  function refreshProbe() {
    var res = probe ? run(probe[0], probe[1]) : null;
    flowQ.forEach(function (q, i) {
      var reached = res && i < res.ans.length;
      q.card.className = 't-teppich22-q' + (res ? (reached ? ' reached' : ' skipped') : '');
      q.badge.textContent = reached ? (res.ans[i] ? 'ja' : 'nein') : '';
      q.badge.className = 't-teppich22-ans ' + (reached ? (res.ans[i] ? 'y' : 'n') : '');
    });
    Object.keys(flowOut).forEach(function (k) {
      flowOut[k].className = 't-teppich22-out' + (res ? (res.sym === k ? ' hit' : ' dim') : '');
    });
    cellBtns.forEach(function (b) {
      var key = b.r + ',' + b.c, on = !!revealed[key], cur = probe && probe[0] === b.r && probe[1] === b.c;
      b.btn.className = 't-teppich22-cell t-teppich22-cellbtn ' + bgClass(b.r, b.c) + (cur ? ' cur' : '');
      b.btn.replaceChildren();
      if (on) b.btn.appendChild(symImg(run(b.r, b.c).sym));
      b.btn.setAttribute('aria-label', 'Zeile ' + b.r + ', Spalte ' + b.c + (on ? ': ' + SYM[run(b.r, b.c).sym].name : ': leer'));
    });
    if (!res) probeInfo.textContent = 'Tippe auf ein Feld, dann wird die Anleitung für dieses Feld durchgegangen.';
    else {
      var parts = res.ans.map(function (a, i) { return 'Frage ' + (i + 1) + ': ' + (a ? 'ja' : 'nein'); });
      probeInfo.textContent = 'Zeile ' + probe[0] + ', Spalte ' + probe[1] + ' – ' + parts.join(', ') + ' – Symbol: ' + SYM[res.sym].name + '.';
    }
  }

  function build() {
    el.replaceChildren();
    cards = {}; flowQ = []; flowOut = {}; cellBtns = []; revealed = {}; probe = null;

    function out(k, label) {
      var o = h('span', { class: 't-teppich22-out' }, label ? h('span', { class: 't-teppich22-lbl' }, label) : null, symImg(k));
      o.title = SYM[k].name; flowOut[k] = o; return o;
    }
    function q(i, outs) {
      var badge = h('span', { class: 't-teppich22-ans' });
      var card = h('div', { class: 't-teppich22-q' }, h('span', { class: 't-teppich22-qn' }, String(i + 1)), h('span', { class: 't-teppich22-qt' }, QS[i]), badge);
      flowQ.push({ card: card, badge: badge });
      return h('div', { class: 't-teppich22-step' }, card, h('div', { class: 't-teppich22-outs' }, outs));
    }
    var flow = h('div', { class: 't-teppich22-flow', role: 'group', 'aria-label': 'Anleitung von Hale' },
      h('div', { class: 't-teppich22-start' }, 'Start ↓'),
      q(0, [out('M', 'ja →')]),
      h('div', { class: 't-teppich22-nein' }, 'nein ↓'),
      q(1, [out('D', 'ja →')]),
      h('div', { class: 't-teppich22-nein' }, 'nein ↓'),
      q(2, [out('Y', 'ja →'), out('F', 'nein →')]));

    probeInfo = h('p', { class: 't-teppich22-pinfo', 'aria-live': 'polite' });
    var blank = carpet(function (r, c) {
      var b = h('button', { type: 'button', class: 't-teppich22-cell t-teppich22-cellbtn ' + bgClass(r, c), onclick: function () {
        probe = [r, c]; revealed[r + ',' + c] = true; refreshProbe();
      } });
      cellBtns.push({ r: r, c: c, btn: b });
      return b;
    }, 't-teppich22-probe');

    var tool = h('div', { class: 't-teppich22-tool' },
      h('h3', null, 'Anleitung ausprobieren'),
      h('div', { class: 't-teppich22-toolrow' },
        flow,
        h('div', { class: 't-teppich22-probecol' }, blank, probeInfo,
          h('button', { type: 'button', class: 'btn ghost', onclick: function () { revealed = {}; probe = null; refreshProbe(); } }, 'Felder leeren'))));

    var grid = h('div', { class: 't-teppich22-grid', role: 'group', 'aria-label': 'Teppiche zur Auswahl' });
    KEYS.forEach(function (k) {
      var badge = h('span', { class: 't-teppich22-badge', 'aria-hidden': 'true', hidden: true });
      var btn = h('button', {
        type: 'button', class: 't-teppich22-card', 'aria-pressed': 'false', 'aria-label': 'Teppich ' + k + ' auswählen. ' + describe(k),
        onclick: function () { if (locked) return; choice = k; refresh(); api.changed(); }
      }, h('span', { class: 't-teppich22-letter' }, k), staticCarpet(OPT[k]), badge);
      cards[k] = { btn: btn, badge: badge };
      grid.appendChild(btn);
    });
    el.appendChild(tool);
    el.appendChild(h('h3', { class: 't-teppich22-h' }, 'Welcher Teppich ist es?'));
    el.appendChild(grid);
    refresh(); refreshProbe();
  }

  function explanation() {
    var rows = rowsOf();
    var step = function (stage, txt) {
      return '<figure class="t-teppich22-fig">' + staticCarpet(rows, stage).outerHTML + '<figcaption>' + txt + '</figcaption></figure>';
    };
    return '<p>Für jedes Feld werden die Fragen der Reihe nach gestellt, bis ein „ja“ ein Symbol festlegt:</p>' +
      '<div class="t-teppich22-figs">' +
      step(1, 'Frage 1 ist „ja“ für alle Randfelder (Zeile oder Spalte 1 oder 6): Mäander.') +
      step(2, 'Frage 2 ist „ja“ auf der Diagonalen (Zeile = Spalte): Mandala.') +
      step(3, 'Frage 3: Zeile größer als Spalte (links unter der Diagonalen) „ja“: Y-Würfel; sonst (rechts oberhalb) Windrad.') +
      '</div>' +
      '<p>Das ist Teppich B. Bei A sind Y-Würfel und Windrad vertauscht, bei C stimmen die Ecken rechts oben und links unten nicht (sie müssten Mäander zeigen), und bei D zeigen die Ecken links oben und rechts unten das Mandala statt des Mäanders.</p>' +
      '<p>Eine solche eindeutige Anleitung ist ein <em>Algorithmus</em>: Jede Person (oder Maschine), die sie befolgt, erzeugt genau denselben Teppich. Ja-Nein-Fragen wie diese heißen in Programmen <em>Bedingungen</em> (boolesche Ausdrücke).</p>';
  }

  Biber.register({
    id: 'teppich22',
    story: '<p>Hale ist eine türkische Künstlerin. Sie gestaltet ein Teppichmuster. Der Teppich hat Felder in sechs Zeilen und sechs Spalten. Für jedes Feld gibt es die Nummer der Zeile und die der Spalte.</p>' +
      '<p>Hales Angestellte sollen in jedes Feld ein Symbol setzen. Hale hat ihnen dazu diese Anleitung gegeben (siehe Ablaufplan unten).</p>',
    question: 'Wie wird der Teppich aussehen?',
    howto: 'Tippe unten auf den Teppich, der zur Anleitung passt. Mit dem leeren Teppich kannst du die Anleitung für einzelne Felder ausprobieren.',
    explanation: explanation,
    mount: function (root, a) { el = root; api = a; locked = false; choice = null; mark = null; build(); },
    isComplete: function () { return choice !== null; },
    evaluate: function () { return { correct: choice === CORRECT, answer: { choice: choice } }; },
    setAnswer: function (ans) { choice = ans && ans.choice || null; mark = 'check'; refresh(); },
    lock: function (on) {
      locked = on;
      if (on) { if (mark !== 'solution') mark = 'check'; } else mark = null;
      refresh();
    },
    reset: function () { choice = null; mark = null; revealed = {}; probe = null; refresh(); refreshProbe(); },
    showSolution: function () { choice = CORRECT; mark = 'solution'; refresh(); }
  });
})();
