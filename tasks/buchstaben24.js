/* Aufgabe Gleiche Buchstaben (Biber 2024; Klasse 9-10 mittel, 11-13 einfach): drei Buchstaben so ersetzen, dass die Punktzahl maximal wird */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-buchstaben24-';

  var ROW = 'ABBCABCABAAA'.split('');
  var TILES = ['B', 'B', 'C'];
  var N = ROW.length;

  /* Punkte: eine Gruppe aus k >= 2 gleichen, direkt benachbarten Buchstaben gibt k Punkte */
  function groups(letters) {
    var out = [], i = 0;
    while (i < letters.length) {
      var j = i;
      while (j < letters.length && letters[j] === letters[i]) j++;
      if (j - i >= 2) out.push({ start: i, len: j - i, letter: letters[i] });
      i = j;
    }
    return out;
  }
  function score(letters) { return groups(letters).reduce(function (s, g) { return s + g.len; }, 0); }

  /* Maximum und Lösungen per Brute Force über alle 12 * 11 * 10 / 2 Ersetzungen (zur Laufzeit; Heft: 11 Punkte, genau eine Reihe) */
  var BEST = (function () {
    var best = 0, sols = {}, c, b1, b2, s, pts;
    for (c = 0; c < N; c++) for (b1 = 0; b1 < N; b1++) for (b2 = b1 + 1; b2 < N; b2++) {
      if (b1 === c || b2 === c) continue;
      s = ROW.slice(); s[c] = 'C'; s[b1] = 'B'; s[b2] = 'B';
      pts = score(s);
      if (pts > best) { best = pts; sols = {}; }
      if (pts === best) sols[s.join('')] = { c: c, b: [b1, b2] };
    }
    return { pts: best, sols: sols };
  })();
  var SOL = (function () { var k = Object.keys(BEST.sols)[0]; return BEST.sols[k]; })();   /* ABBCCBBBBAAA: C auf Stelle 5, B auf Stellen 7 und 8 */

  var el, api, placed, selected, locked, mark, dragging;
  var rowEl, supplyEl, scoreEl;

  function reset() { placed = {}; selected = 0; mark = null; dragging = null; }
  function letters() {
    var l = ROW.slice();
    Object.keys(placed).forEach(function (p) { l[+p] = TILES[placed[p]]; });
    return l;
  }
  function usedTiles() { return Object.keys(placed).map(function (p) { return placed[p]; }); }
  function nextFree(from) {
    var used = usedTiles(), i;
    for (i = 0; i < TILES.length; i++) {
      var t = (from + i) % TILES.length;
      if (used.indexOf(t) < 0) return t;
    }
    return null;
  }

  var mq = window.matchMedia ? window.matchMedia('(max-width: 30rem)') : null;
  function narrow() { return !!(mq && mq.matches); }

  function render() {
    var l = letters(), gs = groups(l), pts = score(l), used = usedTiles();
    var inGroup = {};
    gs.forEach(function (g) { for (var k = g.start; k < g.start + g.len; k++) inGroup[k] = true; });
    var tiles = l.map(function (c, i) {
      var isNew = i in placed;
      var cls = P + 'tile' + (isNew ? ' ' + P + 'new' : '') + (inGroup[i] ? ' ' + P + 'grp' : '');
      return h('button', {
        type: 'button', class: cls, 'data-pos': String(i),
        'aria-disabled': locked ? 'true' : 'false',
        'aria-label': 'Stelle ' + (i + 1) + ': ' + c + (isNew ? ' (ersetzt, Original ' + ROW[i] + ')' : '') + (locked ? '' : isNew ? '. Antippen nimmt das Plättchen zurück.' : (selected !== null && usedTiles().indexOf(selected) < 0 ? '. Antippen ersetzt durch ' + TILES[selected] + '.' : ''))
      }, c);
    });
    var per = narrow() ? 6 : N, chunks = [], from;
    for (from = 0; from < N; from += per) {
      var marks = [];
      gs.forEach(function (g) {
        var s0 = Math.max(g.start, from), e0 = Math.min(g.start + g.len, from + per);
        if (e0 <= s0) return;
        marks.push(h('span', { class: P + 'gnum', style: 'grid-column:' + (s0 - from + 1) + ' / span ' + (e0 - s0) },
          g.start >= from || e0 - s0 >= g.len / 2 ? String(g.len) : ''));
      });
      chunks.push(h('div', { class: P + 'chunk' },
        h('div', { class: P + 'groups', 'aria-hidden': 'true', style: 'grid-template-columns:repeat(' + per + ',minmax(0,1fr))' }, marks),
        h('div', { class: P + 'row', style: 'grid-template-columns:repeat(' + per + ',minmax(0,1fr))' }, tiles.slice(from, from + per))));
    }
    rowEl.replaceChildren.apply(rowEl, chunks);
    supplyEl.replaceChildren.apply(supplyEl, TILES.map(function (c, t) {
      var isUsed = used.indexOf(t) >= 0;
      return h('button', {
        type: 'button', class: P + 'tile ' + P + 'new ' + P + 'sup' + (selected === t && !isUsed ? ' ' + P + 'sel' : '') + (isUsed ? ' ' + P + 'used' : ''),
        'data-tile': String(t), draggable: (!locked && !isUsed) ? 'true' : 'false', disabled: isUsed || locked,
        'aria-pressed': String(selected === t && !isUsed),
        'aria-label': 'Plättchen ' + c + (isUsed ? ' (schon eingesetzt)' : selected === t ? ' (ausgewählt)' : '')
      }, c);
    }));
    var cls = P + 'score' + (mark === 'check' ? (pts === BEST.pts ? ' right' : ' wrong') : mark === 'solution' ? ' right' : '');
    scoreEl.className = cls;
    scoreEl.textContent = 'Punkte: ' + pts + (used.length < TILES.length ? ' (noch ' + (TILES.length - used.length) + (TILES.length - used.length === 1 ? ' Plättchen' : ' Plättchen') + ' übrig)' : '');
  }

  function put(pos, tile) {
    if (locked) return;
    var old = placed[pos];
    var wasTile = tile;
    /* war das Plättchen schon woanders eingesetzt, nimm es dort zurück */
    Object.keys(placed).forEach(function (p) { if (placed[p] === tile) delete placed[p]; });
    placed[pos] = wasTile;
    if (old !== undefined && old !== tile) selected = old; else selected = nextFree(tile + 1);
    render();
    api.changed();
  }
  function takeBack(pos) {
    if (locked || !(pos in placed)) return;
    selected = placed[pos];
    delete placed[pos];
    render();
    api.changed();
  }

  function onClick(e) {
    if (locked) return;
    var t = e.target.closest('[data-tile],[data-pos]');
    if (!t) return;
    if (t.dataset.tile !== undefined) {
      var k = +t.dataset.tile;
      if (usedTiles().indexOf(k) >= 0) return;
      selected = k;
      render();
      return;
    }
    var pos = +t.dataset.pos;
    if (selected !== null && usedTiles().indexOf(selected) < 0) { put(pos, selected); return; }
    if (pos in placed) { takeBack(pos); return; }
  }
  function onDragStart(e) {
    var t = e.target.closest('[data-tile]');
    if (!t || locked) return;
    dragging = +t.dataset.tile;
    e.dataTransfer.setData('text/plain', String(dragging));
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e) {
    if (dragging === null) return;
    var t = e.target.closest('[data-pos]');
    if (t) e.preventDefault();
  }
  function onDrop(e) {
    if (dragging === null) return;
    var t = e.target.closest('[data-pos]');
    if (!t) return;
    e.preventDefault();
    var tile = dragging; dragging = null;
    put(+t.dataset.pos, tile);
  }

  Biber.register({
    id: 'buchstaben24',
    story:
      '<p>Lege Buchstaben in eine Reihe und bekomme Punkte: Wenn 2 gleiche Buchstaben direkt nebeneinander liegen, bekommst du 2 Punkte, bei 3 gleichen Buchstaben 3, und so weiter.</p>' +
      '<p>Beispiel: In der Reihe <strong>B A A B B</strong> bekommst du 4 Punkte: 2 für die beiden A und 2 für die beiden B hintereinander. In der Reihe B C A C B gibt es 0 Punkte, weil nirgends gleiche Buchstaben direkt nebeneinander liegen.</p>' +
      '<p>Die Reihe unten hat 12 Buchstaben. Du kannst darin drei beliebige Buchstaben ersetzen, und zwar durch die Buchstaben B, B und C.</p>',
    question: 'Ersetze so, dass du für das Ergebnis so viele Punkte bekommst wie möglich.',
    howto: 'Tippe ein rotes Plättchen an und dann den Buchstaben in der Reihe, den es ersetzen soll (oder ziehe es dorthin). Tippst du ein eingesetztes Plättchen in der Reihe an, nimmst du es zurück.',
    explanation: function () {
      return '<p>Die beste Ersetzung ist <strong>A B B C C B B B B A A A</strong> mit 2 + 2 + 4 + 3 = <strong>11 Punkte</strong>. Mehr geht nicht: Die Reihe hat 12 Buchstaben, aber das A ganz links kann keiner Gruppe angehören, weil man kein A zum Ersetzen hat.</p>' +
        '<p>Für jede Ersetzung gilt: Ein Buchstabe, der an eine bestehende Gruppe passt, bringt 1 Punkt. Einer, der sich an einen einzelnen gleichen Buchstaben legt, bringt 2 Punkte, und einer, der zwischen zwei gleichen Einzelbuchstaben liegt, sogar 3. Ursprünglich gibt es 5 Punkte. Für 11 Punkte müssen B, B und C so gelegt werden, dass jedes Mal eine neue Zweiergruppe entsteht und keine bestehende Gruppe kleiner wird. Dafür gibt es nur eine Möglichkeit: das A hinter dem ersten C wird zu C, das zweite C und das A danach werden zu B.</p>' +
        '<p>Das ist ein Optimierungsproblem: Gesucht ist nicht irgendeine, sondern die beste Lösung im Lösungsraum. Hier gibt es 12 × 11 × 10 = 1320 Ersetzungen, bei längeren Reihen werden es sehr schnell viel mehr. Deshalb schränkt man den Lösungsraum klug ein, zum Beispiel: Nur Buchstaben neben gleichen Buchstaben bringen Punkte.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      rowEl = h('div', { class: P + 'rowwrap', role: 'group', 'aria-label': 'Reihe mit 12 Buchstaben' });
      supplyEl = h('div', { class: P + 'supply', role: 'group', 'aria-label': 'Zum Ersetzen: B, B und C' });
      scoreEl = h('p', { class: P + 'score', role: 'status', 'aria-live': 'polite' });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('div', { class: P + 'rowlabel' }, 'Die Reihe'),
        rowEl,
        h('div', { class: P + 'rowlabel' }, 'Zum Ersetzen'),
        supplyEl, scoreEl));
      el.addEventListener('click', onClick);
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', function () { dragging = null; });
      if (mq && mq.addEventListener) mq.addEventListener('change', render);
      render();
    },
    isComplete: function () { return usedTiles().length === TILES.length; },
    evaluate: function () {
      var l = letters();
      var pts = score(l);
      return { correct: pts === BEST.pts, answer: { row: l.join(''), placed: Object.keys(placed).map(function (p) { return [+p, TILES[placed[p]], placed[p]]; }) } };
    },
    setAnswer: function (ans) {
      placed = {};
      selected = null;
      if (ans && Array.isArray(ans.placed)) ans.placed.forEach(function (x) { if (x[0] >= 0 && x[0] < N && x[2] >= 0 && x[2] < TILES.length) placed[x[0]] = x[2]; });
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      if (!on) selected = nextFree(0);
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      placed = {};
      placed[SOL.c] = 2;
      placed[SOL.b[0]] = 0;
      placed[SOL.b[1]] = 1;
      selected = null; mark = 'solution'; locked = true;
      render();
    }
  });
})();
