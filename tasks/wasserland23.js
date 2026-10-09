/* Aufgabe Wasser - Land (Biber 2023, Klasse 3-4 einfach): Kärtchen so in zwei Lücken legen, dass Wasser an Wasser und Land an Land grenzt */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-wasserland23-';
  var A = 'assets/wasserland23/';

  /* Jedes Kärtchen hat vier Bereiche (oben links, oben rechts, unten links, unten rechts), W = Wasser, L = Land
     (abgelesen aus den Bildern im Heft, S. 62/63). */
  var TILES = [
    { id: 'c1', q: 'WLWL', name: 'Kärtchen mit den fünf Vögeln', desc: 'links Wasser, rechts Land mit Bäumen und fünf Vögeln' },
    { id: 'c2', q: 'LLWL', name: 'Kärtchen mit dem roten Haus', desc: 'Land mit rotem Haus und Hecke, unten links ein Stück Wasser' },
    { id: 'c3', q: 'WWLL', name: 'Kärtchen mit dem Strand', desc: 'oben Wasser, unten Land mit Strand und Sonnenschirmen' },
    { id: 'c4', q: 'WLWW', name: 'Kärtchen mit dem See', desc: 'fast ganz Wasser, oben rechts ein Stück Land mit einem kleinen See' },
    { id: 'c5', q: 'LLLW', name: 'Kärtchen mit den Bäumen', desc: 'Land mit Bäumen, unten rechts ein Stück Wasser' },
    { id: 'c6', q: 'WWLW', name: 'Kärtchen mit dem Boot', desc: 'Wasser mit Boot und Vögeln, unten links ein Stück Land' }
  ];
  var FIX = { tl: { id: 'p0', q: 'LWWL', desc: 'oben links: Land links oben, Wasser rechts oben, Wasser links unten, Land rechts unten' },
              br: { id: 'p3', q: 'LWLL', desc: 'unten rechts: Land links oben, Wasser rechts oben, Land unten' } };
  /* Lücken: tr = oben rechts, bl = unten links. Nachbarn: tr grenzt links an tl und unten an br; bl grenzt oben an tl und rechts an br. */
  function fitsH(a, b) { return a[1] === b[0] && a[3] === b[2]; }   /* a links von b */
  function fitsV(a, b) { return a[2] === b[0] && a[3] === b[1]; }   /* a über b */
  function fitsGap(gap, q) {
    if (gap === 'tr') return fitsH(FIX.tl.q, q) && fitsV(q, FIX.br.q);
    return fitsV(FIX.tl.q, q) && fitsH(q, FIX.br.q);
  }
  var SOL = {};
  ['tr', 'bl'].forEach(function (g) {
    var js = TILES.map(function (t, i) { return i; }).filter(function (i) { return fitsGap(g, TILES[i].q); });
    SOL[g] = js.length === 1 ? js[0] : -1;
  });

  var el, api, locked, mark, sel, put, boardEl, poolEl, status, gapBtns = {}, poolBtns = [], drag, clickBlock;
  function reset() { sel = -1; put = { tr: -1, bl: -1 }; mark = null; }
  function where(i) { return put.tr === i ? 'tr' : (put.bl === i ? 'bl' : null); }

  function tileFace(imgId, q, alt) {
    var d = h('span', { class: P + 'face' }, h('img', { src: A + imgId + '.png', alt: alt || '', draggable: 'false', width: 240, height: 240 }));
    var ov = h('span', { class: P + 'pat', 'aria-hidden': 'true' }, q.split('').map(function (c) { return h('span', { class: c === 'W' ? 'w' : 'l' }, c); }));
    d.appendChild(ov);
    return d;
  }

  function update() {
    boardEl.classList.toggle(P + 'showpat', !!locked);
    ['tr', 'bl'].forEach(function (g) {
      var b = gapBtns[g], i = put[g];
      b.replaceChildren();
      b.classList.toggle('filled', i >= 0);
      b.classList.toggle('armed', i < 0 && sel >= 0 && !locked);
      b.classList.toggle('right', i >= 0 && mark !== null && fitsGap(g, TILES[i].q) && (mark === 'solution' || mark === 'check'));
      b.classList.toggle('wrong', i >= 0 && mark === 'check' && !fitsGap(g, TILES[i].q));
      var pos = g === 'tr' ? 'oben rechts' : 'unten links';
      if (i >= 0) {
        b.appendChild(tileFace(TILES[i].id, TILES[i].q, ''));
        b.setAttribute('aria-label', 'Lücke ' + pos + ': ' + TILES[i].name + (locked ? '' : '. Antippen, um es wieder zu entfernen'));
      } else {
        b.appendChild(h('span', { class: P + 'hole', 'aria-hidden': 'true' }, '?'));
        b.setAttribute('aria-label', 'Lücke ' + pos + ': leer' + (sel >= 0 ? '. Antippen, um das gewählte Kärtchen hier hineinzulegen' : ''));
      }
      b.setAttribute('aria-disabled', locked ? 'true' : 'false');
    });
    poolBtns.forEach(function (b, i) {
      var w = where(i);
      b.classList.toggle('sel', sel === i);
      b.classList.toggle('used', !!w);
      b.setAttribute('aria-pressed', sel === i ? 'true' : 'false');
      b.setAttribute('aria-disabled', (locked || w) ? 'true' : 'false');
      b.tabIndex = w ? -1 : 0;
      b.setAttribute('aria-label', TILES[i].name + (w ? ' (liegt schon in einer Lücke)' : (sel === i ? ' (ausgewählt)' : '')));
      b.querySelector('.' + P + 'face').style.visibility = w ? 'hidden' : '';
    });
    status.textContent = sel >= 0 ? 'Ausgewählt: ' + TILES[sel].name + '. Tippe jetzt auf eine Lücke.' :
      (put.tr >= 0 && put.bl >= 0 ? 'Beide Lücken sind gefüllt.' : 'Wähle ein Kärtchen und tippe dann auf eine Lücke.');
  }

  function place(g, i) {      /* Kärtchen i in Lücke g legen */
    var prev = where(i); if (prev) put[prev] = -1;
    put[g] = i; sel = -1;
    update(); api.changed();
  }
  function unplace(g) {
    if (put[g] < 0) return;
    put[g] = -1; update(); api.changed();
  }
  function onGap(g) {
    if (locked) return;
    if (sel >= 0) place(g, sel);
    else if (put[g] >= 0) { sel = put[g]; put[g] = -1; update(); api.changed(); }
  }
  function onPool(i) {
    if (locked || where(i)) return;
    sel = sel === i ? -1 : i;
    update();
  }

  /* Ziehen mit der Maus (Touch: antippen) */
  var ghost = null;
  function endGhost() { if (ghost) { ghost.remove(); ghost = null; } }
  function startDrag(tile, from, e) {
    if (locked || e.pointerType === 'touch' || e.button > 0) return;
    drag = { tile: tile, from: from, x: e.clientX, y: e.clientY, on: false };
  }
  window.addEventListener('pointermove', function (e) {
    if (!drag) return;
    if (!drag.on) {
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 8) return;
      drag.on = true;
      ghost = h('img', { class: P + 'ghost', src: A + TILES[drag.tile].id + '.png', alt: '' });
      document.body.appendChild(ghost);
      if (drag.from) { put[drag.from] = -1; }
      sel = -1; update();
    }
    if (ghost) { ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px'; }
  });
  window.addEventListener('pointerup', function (e) {
    if (!drag) return;
    var d = drag; drag = null;
    if (!d.on) return;
    endGhost();
    clickBlock = true; setTimeout(function () { clickBlock = false; }, 0);
    var t = document.elementFromPoint(e.clientX, e.clientY);
    var gb = t && t.closest ? t.closest('[data-gap]') : null;
    if (gb && boardEl.contains(gb)) place(gb.getAttribute('data-gap'), d.tile);
    else { update(); api.changed(); }
  });
  window.addEventListener('pointercancel', function () { if (drag) { drag = null; endGhost(); update(); } });

  Biber.register({
    id: 'wasserland23',
    story:
      '<p>Edu hat ein neues Spiel. Das Spiel hat Kärtchen mit Wasser und Land. Edu legt die Kärtchen so aneinander, dass sie passen: <strong>Land an Land, Wasser an Wasser</strong>. Dann entstehen schöne Landschaften. Die Kärtchen dürfen nicht gedreht werden.</p>' +
      '<p>Edu legt zwei Kärtchen hin und lässt zwei Lücken.</p>',
    question: 'Welche Kärtchen passen in die Lücken?',
    howto: 'Tippe ein Kärtchen an und dann eine Lücke (oder ziehe es mit der Maus hinein). Tippe ein eingelegtes Kärtchen an, um es wieder herauszunehmen.',
    explanation: function () {
      return '<p>Das Kärtchen mit dem <strong>Boot</strong> und das mit den <strong>fünf Vögeln</strong> passen in die Lücken: Überall liegt Wasser an Wasser und Land an Land. Von den sechs Kärtchen passt für jede Lücke nur eines. Nur wenn man die Kärtchen drehen dürfte, würden noch weitere passen.</p>' +
        '<p>Jedes Kärtchen lässt sich in vier Bereiche teilen, deren Ränder entweder nur Wasser (W) oder nur Land (L) zeigen. Nach dem Prüfen siehst du diese Buchstaben auf den Kärtchen. Für die obere rechte Lücke muss das Kärtchen oben links <em>W</em>, unten links <em>L</em> und unten rechts <em>W</em> haben, oben rechts ist egal. Für die untere linke Lücke braucht es oben links <em>W</em>, oben rechts <em>L</em> und unten rechts <em>L</em>.</p>' +
        '<p>So wird aus den Bildern ein einfaches Modell aus den Zeichen L und W. Das ist Abstraktion: Man behält nur die Information, die für die Aufgabe wichtig ist. Computer arbeiten immer mit solchen Modellen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; clickBlock = false; drag = null; reset();
      status = h('p', { class: P + 'status', role: 'status', 'aria-live': 'polite' });
      ['tr', 'bl'].forEach(function (g) {
        var b = h('button', { type: 'button', class: P + 'cell ' + P + 'gap', 'data-gap': g, onclick: function () { if (!clickBlock) onGap(g); } });
        b.addEventListener('pointerdown', function (e) { if (put[g] >= 0) startDrag(put[g], g, e); });
        gapBtns[g] = b;
      });
      poolBtns = TILES.map(function (t, i) {
        var b = h('button', { type: 'button', class: P + 'cell ' + P + 'pool', onclick: function () { if (!clickBlock) onPool(i); } }, tileFace(t.id, t.q, ''));
        b.addEventListener('pointerdown', function (e) { if (!where(i)) startDrag(i, null, e); });
        return b;
      });
      function fixed(f, label) {
        return h('div', { class: P + 'cell ' + P + 'fixed', role: 'img', 'aria-label': label }, tileFace(f.id, f.q, ''));
      }
      boardEl = h('div', { class: P + 'grid', role: 'group', 'aria-label': 'Spielfeld mit zwei Kärtchen und zwei Lücken' },
        fixed(FIX.tl, 'Kärtchen oben links: Land links oben, Wasser rechts oben, Wasser links unten, Land rechts unten; mit einem Baum oben links'),
        gapBtns.tr, gapBtns.bl,
        fixed(FIX.br, 'Kärtchen unten rechts: Land mit Vögeln und Bäumen links, Wasser mit einem Bach oben rechts'));
      poolEl = h('div', { class: P + 'poolgrid', role: 'group', 'aria-label': 'Die sechs Kärtchen zur Auswahl' }, poolBtns);
      el.replaceChildren(h('div', { class: P + 'board' }, boardEl, h('div', { class: P + 'side' }, poolEl, status)));
      update();
    },
    isComplete: function () { return put.tr >= 0 && put.bl >= 0; },
    evaluate: function () {
      var ok = put.tr >= 0 && put.bl >= 0 && fitsGap('tr', TILES[put.tr].q) && fitsGap('bl', TILES[put.bl].q);
      return { correct: ok, answer: { tr: TILES[put.tr].id, bl: TILES[put.bl].id } };
    },
    setAnswer: function (ans) {
      var ids = TILES.map(function (t) { return t.id; });
      put = { tr: ids.indexOf(ans && ans.tr), bl: ids.indexOf(ans && ans.bl) };
      sel = -1; mark = 'check';
      update();
    },
    lock: function (on) {
      locked = on;
      if (on) { mark = mark === 'solution' ? 'solution' : 'check'; sel = -1; } else mark = null;
      update();
    },
    reset: function () { reset(); update(); },
    showSolution: function () { put = { tr: SOL.tr, bl: SOL.bl }; sel = -1; mark = 'solution'; locked = true; update(); }
  });
})();
