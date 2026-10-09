/* Aufgabe Kartenquadrat (Biber 2022; Klasse 11-13 schwer): Aus vier von fünf Karten ein passendes Quadrat legen, die unbrauchbare Karte finden */
(function () {
  'use strict';
  var h = Biber.h;
  function hx(tag, attrs, markup) { var e = h(tag, attrs); e.innerHTML = markup; return e; }
  var P = 't-kartenquadrat22-';

  /* Randsymbole je Karte im Uhrzeigersinn ab oben: oben, rechts, unten, links (aus dem Heft abgelesen).
     cy = türkise Raute, gr = grüner Halbkreis, or = orange Doppelnoppe, rd = rotes Rechteck, pu = lila Kreuz,
     bl = blauer Stern, cl = schwarze Wolke, br = hellbrauner Ring */
  var CARDS = {
    A: ['cy', 'cy', 'gr', 'or'],
    B: ['rd', 'rd', 'pu', 'or'],
    C: ['bl', 'bl', 'cl', 'rd'],
    D: ['pu', 'pu', 'gr', 'br'],
    E: ['br', 'cl', 'br', 'cy']
  };
  var KEYS = ['A', 'B', 'C', 'D', 'E'];
  var RIGHT = 'C';   /* im Heft bestätigt; per Skript (alle 5!/1! · 4^4 Anordnungen) geprüft: nur A, B, D, E lassen sich legen */
  /* eine gültige Lösung (per Skript gefunden): Position 0 oben links, 1 oben rechts, 2 unten links, 3 unten rechts */
  var SOLVED = [{ k: 'A', r: 2 }, { k: 'B', r: 0 }, { k: 'E', r: 1 }, { k: 'D', r: 0 }];
  var POSNAME = ['oben links', 'oben rechts', 'unten links', 'unten rechts'];
  var SYMNAME = { cy: 'türkise Raute', gr: 'grüner Halbkreis', or: 'orange Doppelnoppe', rd: 'rotes Rechteck', pu: 'lila Kreuz', bl: 'blauer Stern', cl: 'schwarze Wolke', br: 'hellbrauner Ring' };
  var EDGENAME = ['oben', 'rechts', 'unten', 'links'];

  /* Halbsymbole, gezeichnet am oberen Rand (y = 0) und nach unten ragend; für andere Ränder wird gedreht */
  var SHAPES = {
    cy: '<path fill="#05cfcb" d="M26 0H74L50 25Z"/>',
    gr: '<path fill="#6cd16c" d="M30 0A20 20 0 0 0 70 0Z"/>',
    or: '<rect x="35" y="-8" width="10" height="20" rx="5" fill="#ff5f00"/><rect x="55" y="-8" width="10" height="20" rx="5" fill="#ff5f00"/>',
    rd: '<rect x="30" y="-4" width="40" height="21" fill="#ff8c8c"/>',
    pu: '<rect x="27" y="0" width="46" height="7" fill="#d078ff"/><rect x="46.5" y="0" width="7" height="26" fill="#d078ff"/>',
    bl: '<path fill="#3347c4" d="M22 8L36 3L41 0H59L64 3L78 8L59 12L50 27L41 12Z"/>',
    cl: '<g fill="#484848"><rect x="26" y="0" width="48" height="8"/><circle cx="35" cy="8" r="8.5"/><circle cx="65" cy="8" r="8.5"/><circle cx="50" cy="13" r="13"/></g>',
    br: '<path fill="#f0a94d" d="M29 0A21 21 0 0 0 71 0H61A11 11 0 0 1 39 0Z"/>'
  };

  /* rot = Viertelumdrehungen im Uhrzeigersinn: am Rand i erscheint dann das Symbol CARDS[k][(i - rot) mod 4] */
  function edgeSym(k, rot, i) { return CARDS[k][((i - rot) % 4 + 4) % 4]; }
  function cardSvg(k, rot, cls) {
    var s = '';
    for (var i = 0; i < 4; i++) s += '<g transform="rotate(' + (90 * i) + ' 50 50)">' + SHAPES[edgeSym(k, rot, i)] + '</g>';
    return '<svg class="' + P + 'svg ' + (cls || '') + '" viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
      '<rect class="' + P + 'face" x="0.75" y="0.75" width="98.5" height="98.5" rx="9"/>' + s +
      '<circle class="' + P + 'disc" cx="50" cy="50" r="12"/><text class="' + P + 'let" x="50" y="50" text-anchor="middle" dominant-baseline="central">' + k + '</text></svg>';
  }
  function cardDesc(k, rot) {
    return EDGENAME.map(function (n, i) { return n + ' ' + SYMNAME[edgeSym(k, rot, i)]; }).join(', ');
  }

  /* Paare berührender Ränder im 2×2-Quadrat: [Position a, Rand a, Position b, Rand b] */
  var SEAMS = [[0, 1, 1, 3], [2, 1, 3, 3], [0, 2, 2, 0], [1, 2, 3, 0]];
  var SEAMPOS = [[50, 25], [50, 75], [25, 50], [75, 50]];   /* in Prozent der Brettgröße */

  var el, api, cards, sel, choice, locked, mark, focusKey;
  var boardEl, poolEl, optsEl, statusEl, optBtns;

  function reset() {
    cards = {};
    KEYS.forEach(function (k) { cards[k] = { pos: null, rot: 0 }; });
    sel = null; choice = null; mark = null; focusKey = null;
  }
  function atPos(p) { var f = null; KEYS.forEach(function (k) { if (cards[k].pos === p) f = k; }); return f; }

  function seamState() {
    return SEAMS.map(function (s) {
      var a = atPos(s[0]), b = atPos(s[2]);
      if (!a || !b) return null;
      return edgeSym(a, cards[a].rot, s[1]) === edgeSym(b, cards[b].rot, s[3]);
    });
  }

  /* ---------- Aktionen ---------- */
  function select(k) { if (locked) return; sel = sel === k ? null : k; focusKey = 'c' + k; render(); }
  function rotate(k) { if (locked) return; cards[k].rot = (cards[k].rot + 1) % 4; focusKey = 'r' + k; render(); api.changed(); }
  function back(k) { if (locked) return; cards[k].pos = null; if (sel === k) sel = null; focusKey = 'c' + k; render(); api.changed(); }
  function placeAt(p) {
    if (locked) return;
    var other = atPos(p);
    if (!sel) {
      if (other) { sel = other; focusKey = 's' + p; render(); }
      return;
    }
    if (other === sel) { sel = null; focusKey = 's' + p; render(); return; }
    var from = cards[sel].pos;
    if (other) cards[other].pos = from;   /* null = zurück in den Vorrat, sonst Tausch */
    cards[sel].pos = p;
    sel = null; focusKey = 's' + p;
    render(); api.changed();
  }
  function choose(k, focus) {
    if (locked) return;
    choice = k; if (focus) focusKey = 'o' + k;
    render(); api.changed();
  }

  /* ---------- Darstellung ---------- */
  function render() {
    var seams = seamState();
    var n = KEYS.filter(function (k) { return cards[k].pos !== null; }).length;
    var okN = seams.filter(function (s) { return s === true; }).length, badN = seams.filter(function (s) { return s === false; }).length;

    /* Brett */
    var slots = [0, 1, 2, 3].map(function (p) {
      var k = atPos(p), c = k && cards[k];
      var kids = [];
      if (k) {
        kids.push(hx('button', {
          type: 'button', class: P + 'cardbtn' + (sel === k ? ' selected' : ''), 'data-focus': 's' + p, 'aria-pressed': String(sel === k), disabled: locked,
          'aria-label': 'Karte ' + k + ' liegt ' + POSNAME[p] + ' (' + cardDesc(k, c.rot) + '). Antippen, um sie zu verschieben.'
        }, cardSvg(k, c.rot)));
        if (!locked) {
          kids.push(h('button', { type: 'button', class: P + 'tool ' + P + 'rot', 'data-focus': 'r' + k, 'aria-label': 'Karte ' + k + ' drehen', onclick: function () { rotate(k); } }, '↻'));
          kids.push(h('button', { type: 'button', class: P + 'tool ' + P + 'del', 'data-focus': 'x' + k, 'aria-label': 'Karte ' + k + ' vom Quadrat nehmen', onclick: function () { back(k); } }, '×'));
        }
      } else {
        kids.push(h('button', {
          type: 'button', class: P + 'empty' + (sel && !locked ? ' ready' : ''), 'data-focus': 's' + p, disabled: locked,
          'aria-label': 'Feld ' + POSNAME[p] + ' ist leer' + (sel ? '. Antippen, um Karte ' + sel + ' hier abzulegen.' : '. Wähle zuerst eine Karte unten.')
        }, h('span', { 'aria-hidden': 'true' }, sel ? 'hier' : '')));
      }
      var box = h('div', { class: P + 'slot' }, kids);
      if (k) { var cb = box.firstChild; cb.addEventListener('click', function () { placeAt(p); }); }
      else box.firstChild.addEventListener('click', function () { placeAt(p); });
      return box;
    });
    var seamEls = SEAMS.map(function (s, i) {
      if (seams[i] === null) return null;
      return h('span', {
        class: P + 'seam ' + (seams[i] ? 'ok' : 'bad'), style: 'left:' + SEAMPOS[i][0] + '%;top:' + SEAMPOS[i][1] + '%',
        'aria-hidden': 'true'
      }, seams[i] ? '✓' : '✗');
    });
    boardEl.replaceChildren.apply(boardEl, [h('div', { class: P + 'grid' }, slots)].concat(seamEls.filter(Boolean)));

    /* Vorrat */
    poolEl.replaceChildren.apply(poolEl, KEYS.map(function (k) {
      var c = cards[k];
      if (c.pos !== null) return h('div', { class: P + 'ph', 'aria-hidden': 'true' });
      return h('div', { class: P + 'pitem' },
        hx('button', {
          type: 'button', class: P + 'cardbtn' + (sel === k ? ' selected' : ''), 'data-focus': 'c' + k, 'aria-pressed': String(sel === k), disabled: locked,
          'aria-label': 'Karte ' + k + ' (' + cardDesc(k, c.rot) + '). Antippen, dann ein Feld im Quadrat antippen.',
          onclick: function () { select(k); }
        }, cardSvg(k, c.rot)),
        locked ? null : h('button', { type: 'button', class: P + 'tool ' + P + 'rot', 'data-focus': 'r' + k, 'aria-label': 'Karte ' + k + ' drehen', onclick: function () { rotate(k); } }, '↻'));
    }));

    var msg;
    if (n === 0) msg = 'Probiere es aus: Lege Karten ins Quadrat und drehe sie. Ein grünes Häkchen zeigt, dass zwei Ränder zusammenpassen.';
    else if (n === 4 && okN === 4) msg = 'Alle vier Ränder passen: Mit diesen vier Karten gibt es ein Quadrat. Die fünfte Karte ist die gesuchte.';
    else msg = n + ' von 4 Karten liegen im Quadrat. ' + (okN + badN === 0 ? 'Noch berühren sich keine zwei Karten.' : okN + ' von ' + (okN + badN) + ' berührenden Rändern passen.');
    statusEl.textContent = msg;

    /* Antwort */
    optBtns.forEach(function (btn) {
      var k = btn.getAttribute('data-opt'), on = choice === k, ok = k === RIGHT;
      btn.setAttribute('aria-checked', String(on));
      btn.tabIndex = (choice === null ? k === 'A' : on) ? 0 : -1;
      btn.setAttribute('aria-disabled', locked ? 'true' : 'false');
      btn.classList.toggle('selected', on);
      btn.classList.toggle('right', on && mark !== null && ok);
      btn.classList.toggle('wrong', on && mark === 'check' && !ok);
      var m = btn.querySelector('.' + P + 'mark');
      if (m) m.remove();
      if (on && mark !== null) btn.appendChild(h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
    });

    if (focusKey) {
      var t = el.querySelector('[data-focus="' + focusKey + '"]') || el.querySelector('[data-opt="' + focusKey.slice(1) + '"]');
      focusKey = null;
      if (t && !t.disabled) t.focus();
    }
  }

  function onOptKey(e) {
    var i = KEYS.indexOf(e.currentTarget.getAttribute('data-opt')), to = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = (i + 1) % 5;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = (i + 4) % 5;
    if (to === null) return;
    e.preventDefault();
    choose(KEYS[to], true);
  }

  function solvedSquareHtml() {
    return '<div class="' + P + 'mini" role="img" aria-label="Das Quadrat aus den Karten A, B, E und D">' +
      SOLVED.map(function (s) { return '<div>' + cardSvg(s.k, s.r) + '</div>'; }).join('') + '</div>';
  }

  Biber.register({
    id: 'kartenquadrat22',
    story:
      '<p>Du sollst mit vier Karten ein Quadrat legen. Dabei müssen je zwei sich berührende Ränder das gleiche Symbol zeigen: Die beiden Halbsymbole ergeben zusammen das ganze Symbol. Die Karten darfst du drehen.</p>' +
      '<p>Mit vier der fünf Karten A bis E kannst du ein solches Quadrat legen.</p>',
    question: 'Welche Karte kannst du dabei NICHT verwenden?',
    howto: 'Zum Ausprobieren: Tippe eine Karte an und dann ein Feld im Quadrat. Mit ↻ drehst du eine Karte. Deine Antwort wählst du unten aus.',
    explanation: function () {
      return '<p>Alle Möglichkeiten durchzuprobieren sind viel zu viele (30 720). Besser schaust du dir die Symbole an. Der blaue halbe Stern kommt nur auf Karte C vor, und zwar an zwei Rändern über Eck. C kann daher nur in einer Ecke liegen. An die halbe schwarze Wolke von C passt nur Karte E, ' +
        'an das rote Rechteck nur Karte B (so gedreht, dass ihr zweites Rechteck nach außen zeigt). Für die vierte Ecke braucht es nun ein halbes lila Kreuz und einen hellbraunen Halbkreis in der richtigen Reihenfolge: Karte D hat beides, aber im Uhrzeigersinn umgekehrt. Also ist <strong>C</strong> nicht verwendbar.</p>' +
        '<p>Aus A, B, D und E dagegen gibt es ein Quadrat:</p>' + solvedSquareHtml() +
        '<p>Man kann die Karten als Graph zeichnen: Karten sind Knoten, zwei Karten mit gleichem Symbol sind durch eine Kante verbunden. Ein Quadrat entspricht einem Rundweg über vier Knoten. Es gibt nur drei solche Rundwege (A-E-C-B, A-E-D-B und B-D-E-C), und nur A-E-D-B lässt sich mit passenden Rändern legen. Mit einem Graphen spart man sich das Ausprobieren aller Anordnungen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      boardEl = h('div', { class: P + 'board' });
      poolEl = h('div', { class: P + 'pool' });
      statusEl = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      optBtns = KEYS.map(function (k) {
        return hx('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': k, 'aria-label': 'Antwort: Karte ' + k + ' kann nicht verwendet werden',
          onclick: function () { choose(k, false); }, onkeydown: onOptKey
        }, cardSvg(k, 0, P + 'thumb'));
      });
      optsEl = h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Welche Karte kann nicht verwendet werden?' }, optBtns);
      el.replaceChildren(h('div', { class: P + 'wrap' },
        h('section', { class: P + 'play', 'aria-label': 'Quadrat zum Ausprobieren' },
          h('h3', null, 'Zum Ausprobieren'),
          boardEl, statusEl,
          h('div', { class: P + 'poolhead' }, h('h3', null, 'Karten')), poolEl),
        h('section', { class: P + 'ans', 'aria-label': 'Antwort' },
          h('h3', null, 'Diese Karte geht nicht:'), optsEl)));
      render();
    },
    isComplete: function () { return choice !== null; },
    evaluate: function () { return { correct: choice === RIGHT, answer: { choice: choice } }; },
    setAnswer: function (ans) {
      choice = ans && KEYS.indexOf(ans.choice) >= 0 ? ans.choice : null;
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      if (on) sel = null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      reset();
      SOLVED.forEach(function (s, p) { cards[s.k].pos = p; cards[s.k].rot = s.r; });
      choice = RIGHT; mark = 'solution'; locked = true;
      render();
    }
  });
})();
