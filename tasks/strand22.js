/* Aufgabe Spiel am Strand (Biber 2022, Heft S. 52): Spielbaum, COL-Spiel auf einem Graphen */
(function () {
  'use strict';
  var h = Biber.h;

  /* ---- Spielfeld nach der Abbildung im Heft ---- */
  // Mulden: Anns Muscheln (a) und Bobs Steine (b) liegen schon, die Mulden 1 bis 7 sind frei
  var VB = '170 50 1280 740';
  var NODES = {
    A: { x: 280, y: 430, own: 'a', name: 'Mulde mit Muschel links' },
    B: { x: 1165, y: 410, own: 'a', name: 'Mulde mit Muschel rechts' },
    S1: { x: 810, y: 255, own: 'b', name: 'Mulde mit Stein oben' },
    S2: { x: 1065, y: 690, own: 'b', name: 'Mulde mit Stein unten' },
    1: { x: 540, y: 300, name: 'links oben' },
    2: { x: 690, y: 430, name: 'Mitte links' },
    3: { x: 550, y: 540, name: 'links unten' },
    4: { x: 940, y: 430, name: 'Mitte rechts' },
    5: { x: 810, y: 600, name: 'unten in der Mitte' },
    6: { x: 1080, y: 140, name: 'rechts oben' },
    7: { x: 1350, y: 330, name: 'ganz rechts' }
  };
  // Furchen (direkte Verbindungen) mit Verlauf für die Zeichnung
  var EDGES = [
    ['A', '6', 'M280,430 C300,260 340,160 560,140 L1050,125 L1080,140'],
    ['A', '1', 'M280,430 Q400,340 540,300'],
    ['A', '3', 'M280,430 Q420,500 550,540'],
    ['A', 'S2', 'M280,430 C340,610 520,712 720,716 L1000,712 L1065,690'],
    ['1', 'S1', 'M540,300 Q650,230 810,255'],
    ['1', '2', 'M540,300 Q630,380 690,430'],
    ['S1', '6', 'M810,255 Q990,260 1080,140'],
    ['S1', '4', 'M810,255 Q850,360 940,430'],
    ['6', '7', 'M1080,140 Q1290,200 1350,330'],
    ['6', 'B', 'M1080,140 Q1170,250 1165,410'],
    ['2', '4', 'M690,430 Q810,455 940,430'],
    ['2', '3', 'M690,430 Q620,500 550,540'],
    ['4', 'B', 'M940,430 Q1070,445 1165,410'],
    ['4', '5', 'M940,430 Q900,540 810,600'],
    ['3', '5', 'M550,540 Q660,610 810,600'],
    ['5', 'S2', 'M810,600 Q930,600 1065,690'],
    ['B', 'S2', 'M1165,410 Q1140,560 1065,690']
  ];
  var FREE = ['1', '2', '3', '4', '5', '6', '7'];
  var ADJ = {};
  Object.keys(NODES).forEach(function (k) { ADJ[k] = []; });
  EDGES.forEach(function (e) { ADJ[e[0]].push(e[1]); ADJ[e[1]].push(e[0]); });

  /* ---- Spiellogik: wer zuerst zwei eigene Figuren in zwei direkt verbundene Mulden setzt, verliert ---- */
  function owners() {
    var o = {};
    Object.keys(NODES).forEach(function (k) { o[k] = NODES[k].own || null; });
    return o;
  }
  function conflict(o, id, p) { return ADJ[id].some(function (m) { return o[m] === p; }); }
  // Gewinnt der Spieler p, der am Zug ist? (vollständige Suche über alle Zugfolgen)
  function wins(o, p) {
    var q = p === 'a' ? 'b' : 'a';
    return FREE.some(function (id) {
      if (o[id] || conflict(o, id, p)) return false;
      o[id] = p;
      var w = !wins(o, q);
      o[id] = null;
      return w;
    });
  }
  var START = owners();
  var WIN = FREE.filter(function (id) {
    if (conflict(START, id, 'a')) return false;
    START[id] = 'a'; var w = !wins(START, 'b'); START[id] = null;
    return w;
  });                                             // laut Rechnung und Heft: nur die Mulde 7
  var RIGHT = WIN[0];
  var BLOCKED = FREE.filter(function (id) { return conflict(START, id, 'a'); });   // 1, 3, 4, 6

  /* ---- Zeichnung ---- */
  function shell(x, y, cls) {
    var ribs = '';
    for (var i = -3; i <= 3; i++) ribs += '<path d="M0,34 L' + (i * 13) + ',-30"/>';
    return '<g class="t-strand22-shell ' + (cls || '') + '" transform="translate(' + x + ',' + y + ')">' +
      '<path class="t-strand22-shellbody" d="M0,36 L-44,2 C-50,-22 -28,-42 -14,-40 C-8,-46 8,-46 14,-40 C28,-42 50,-22 44,2 Z"/>' +
      '<g class="t-strand22-ribs">' + ribs + '</g></g>';
  }
  function stone(x, y) {
    return '<g transform="translate(' + x + ',' + y + ')"><ellipse class="t-strand22-stone" cx="0" cy="0" rx="46" ry="31"/>' +
      '<path class="t-strand22-shine" d="M-20,-12 Q0,-22 22,-10"/></g>';
  }
  function badge(id) {
    var n = NODES[id];
    return '<g class="t-strand22-badge" transform="translate(' + (n.x - 40) + ',' + (n.y + 40) + ')"><circle r="19"/><text y="7" text-anchor="middle">' + id + '</text></g>';
  }
  /* opt: chosen, mark (null | 'right' | 'wrong'), numbers (immer sichtbar), blocked (✗ für Ann gesperrte Mulden), interactive */
  function board(opt) {
    var s = '<svg class="t-strand22-svg" viewBox="' + VB + '" role="' + (opt.interactive ? 'group' : 'img') + '" aria-label="Spielfeld mit elf Mulden, zwei Muscheln und zwei Steinen" focusable="false">' +
      '<path class="t-strand22-sand" d="M200,330 C190,200 330,100 520,80 C760,55 1000,50 1180,60 C1300,70 1380,150 1420,230 C1470,330 1440,480 1380,540 C1330,600 1250,700 1100,740 C900,780 600,760 420,710 C280,670 210,560 200,430 Z"/>';
    EDGES.forEach(function (e) { s += '<path class="t-strand22-furrow" d="' + e[2] + '"/>'; });
    Object.keys(NODES).forEach(function (k) {
      var n = NODES[k];
      s += '<ellipse class="t-strand22-hollow" cx="' + n.x + '" cy="' + n.y + '" rx="66" ry="56" transform="rotate(' + ((k.charCodeAt(0) * 7) % 30 - 15) + ' ' + n.x + ' ' + n.y + ')"/>';
    });
    Object.keys(NODES).forEach(function (k) {
      var n = NODES[k];
      if (n.own === 'a') s += shell(n.x, n.y);
      else if (n.own === 'b') s += stone(n.x, n.y);
    });
    FREE.forEach(function (id) {
      var n = NODES[id], isChosen = opt.chosen === id;
      if (isChosen) {
        s += (opt.mark ? '<circle class="t-strand22-ring ' + opt.mark + '" cx="' + n.x + '" cy="' + n.y + '" r="78"/>' : '') + shell(n.x, n.y, 'chosen');
      }
      if (opt.numbers || opt.interactive) s += badge(id);
      if (opt.blocked && BLOCKED.indexOf(id) >= 0) {
        s += '<g class="t-strand22-block" transform="translate(' + n.x + ',' + n.y + ')"><path d="M-34,-34 L34,34 M34,-34 L-34,34"/></g>';
      }
    });
    if (opt.interactive) {
      FREE.forEach(function (id) {
        var n = NODES[id], on = opt.chosen === id;
        s += '<g class="t-strand22-hit' + (on ? ' on' : '') + '" data-id="' + id + '" role="button" aria-pressed="' + on + '" tabindex="' + (opt.locked ? '-1' : '0') + '"' +
          (opt.locked ? ' aria-disabled="true"' : '') +
          ' aria-label="Muschel in Mulde ' + id + ' (' + n.name + ') setzen' + (on ? ', gewählt' : '') + '">' +
          '<circle class="t-strand22-area" cx="' + n.x + '" cy="' + n.y + '" r="92"/>' +
          (on ? '' : shell(n.x, n.y, 'ghost')) + '</g>';
      });
    }
    return s + '</svg>';
  }

  var el, api, chosen, locked, mark;       // mark: null | 'check' | 'solution'

  function reset() { chosen = null; mark = null; }
  function markClass() { return mark ? (chosen === RIGHT ? 'right' : 'wrong') : null; }

  function render() {
    var fig = h('div', { class: 't-strand22-fig' });
    fig.innerHTML = board({ chosen: chosen, mark: markClass(), interactive: true, locked: locked });
    var status = chosen ? 'Muschel in Mulde ' + chosen + ' gesetzt.' : 'Noch keine Mulde gewählt.';
    el.replaceChildren(h('div', { class: 't-strand22-wrap' }, fig, h('p', { class: 't-strand22-status', 'aria-live': 'polite' }, status)));
  }

  function pick(id) {
    if (locked) return;
    chosen = chosen === id ? null : id;
    render();
    var again = el.querySelector('[data-id="' + id + '"]');
    if (again) again.focus({ preventScroll: true });
    api.changed();
  }
  function onClick(e) {
    var t = e.target.closest('[data-id]');
    if (t) pick(t.getAttribute('data-id'));
  }
  function onKey(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var t = e.target.closest && e.target.closest('[data-id]');
    if (!t) return;
    e.preventDefault();
    pick(t.getAttribute('data-id'));
  }

  Biber.register({
    id: 'strand22',
    story: '<p>Ann und Bob spielen am Strand. Sie graben einige Mulden und verbinden manche davon mit Furchen. Anns Spielfiguren sind <strong>Muscheln</strong>, Bobs Spielfiguren sind <strong>Steine</strong>.</p>' +
      '<p>Abwechselnd setzen sie eine ihrer Spielfiguren in eine freie Mulde. <strong>Verloren hat, wer als Erstes zwei eigene Figuren in zwei direkt verbundene Mulden gesetzt hat.</strong></p>' +
      '<p>Unten siehst du den Spielstand nach einigen Zügen. Ann ist an der Reihe.</p>',
    question: 'In welche Mulde muss Ann ihre nächste Muschel setzen, um sich den Sieg zu sichern?',
    howto: 'Tippe die freie Mulde an, in die Ann ihre Muschel setzen soll. Die freien Mulden sind nummeriert. Nochmal tippen nimmt die Wahl zurück.',
    explanation: function () {
      var fig = '<div class="t-strand22-fig t-strand22-small">' + board({ chosen: RIGHT, numbers: true, blocked: true }) + '</div>';
      return '<p>Die Muscheln links und rechts sperren für Ann die Mulden 1, 3, 4 und 6, denn dort würde sie zwei verbundene Muscheln setzen und sofort verlieren. Es bleiben 2, 5 und 7. ' +
        'Bob sind dagegen 1, 4, 5 und 6 verboten (sie liegen an seinen Steinen), ihm bleiben 2, 3 und 7.</p>' + fig +
        '<p>Spielt Ann die <strong>7</strong>, kann Bob nur noch 2 oder 3 spielen. In beiden Fällen setzt Ann danach die 5, und Bob hat keinen erlaubten Zug mehr: Er muss verlieren. ' +
        'Spielt Ann dagegen die 2, antwortet Bob mit 7, und Ann muss 5 spielen, Bob 3 – dann hat Ann keinen sicheren Zug mehr. Mit der 5 geht es ähnlich: Bob spielt 7, Ann muss 2 setzen, Bob 3, und Ann verliert.</p>' +
        '<p><strong>Informatik:</strong> Alle möglichen Spielverläufe lassen sich in einem <em>Spielbaum</em> darstellen. Man sucht darin rückwärts einen Zug, nach dem der Gegner bei jeder Antwort verliert. ' +
        'Solche Auswertungen von Spielbäumen sind Teil der Spieltheorie; mit genug Rechenleistung können Computer so Spiele wie Schach gewinnen. Dieses Spiel heißt „COL“ und hängt mit dem Färbeproblem zusammen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKey);
      render();
    },
    isComplete: function () { return !!chosen; },
    evaluate: function () { return { correct: WIN.indexOf(chosen) >= 0, answer: chosen }; },
    setAnswer: function (ans) {
      chosen = FREE.indexOf(String(ans)) >= 0 ? String(ans) : null;
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      chosen = RIGHT; mark = 'solution'; locked = true;
      render();
    }
  });
})();
