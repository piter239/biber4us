/* Aufgabe Hotspot-Heizung (Biber 2020; Klasse 7-8 schwer, 9-10 mittel, 11-13 leicht): 4 Hotspots so setzen, dass das Bad möglichst schnell warm wird */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-hotspot20-';

  /* Grundriss wie im Heft: oberer Gang (Spalten 0-8), Hauptraum (Zeilen 1-3, Spalten 5-14), unterer Gang (Spalten 0-8); 48 Fliesen */
  var TILES = [], R, C;
  for (C = 0; C < 9; C++) TILES.push([0, C]);
  for (R = 1; R <= 3; R++) for (C = 5; C < 15; C++) TILES.push([R, C]);
  for (C = 0; C < 9; C++) TILES.push([4, C]);
  var NR = 5, NC = 15, MAXHS = 4;
  var POS = {};   /* "r,c" -> Index in TILES */
  TILES.forEach(function (t, i) { POS[t[0] + ',' + t[1]] = i; });
  function tileAt(r, c) { var k = r + ',' + c; return k in POS ? POS[k] : -1; }

  /* Wärme breitet sich in 1 Minute auf alle Nachbarfliesen aus (auch über Eck), nur über vorhandene Fliesen */
  var NEI = TILES.map(function (t) {
    var out = [];
    for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      var j = tileAt(t[0] + dr, t[1] + dc);
      if (j >= 0) out.push(j);
    }
    return out;
  });
  function times(hs) {   /* Minuten bis zur Erwärmung je Fliese (Mehrquellen-Breitensuche); -1 = wird nie warm */
    var d = TILES.map(function () { return -1; }), q = [];
    hs.forEach(function (i) { d[i] = 0; q.push(i); });
    while (q.length) {
      var u = q.shift();
      NEI[u].forEach(function (v) { if (d[v] < 0) { d[v] = d[u] + 1; q.push(v); } });
    }
    return d;
  }
  function maxTime(hs) {
    var d = times(hs), m = 0;
    for (var i = 0; i < d.length; i++) { if (d[i] < 0) return Infinity; if (d[i] > m) m = d[i]; }
    return m;
  }
  /* Schranke aus dem Heft: Ein Hotspot erwärmt in 1 Minute höchstens 9 Fliesen, in 2 Minuten höchstens 25; 4 Hotspots in 1 Minute höchstens 36 < 48.
     Brute Force über alle 194 580 Vierermengen: das Minimum ist 2 Minuten, genau 3 Platzierungen erreichen es. */
  var BEST = 2;
  var SOL = [tileAt(0, 2), tileAt(4, 2), tileAt(2, 7), tileAt(2, 12)];

  var el, api, hs, locked, preview, focusI, narrow, mq, onMq, boardEl, statusLine, toggleBtn, tileBtns, forced;

  function reset() { hs = []; preview = false; forced = false; }
  function showHeat() { return preview || forced; }
  function summary() {
    var m = maxTime(hs);
    if (hs.length < MAXHS) return hs.length + ' von ' + MAXHS + ' Hotspots montiert.';
    return m === Infinity ? 'Alle 4 Hotspots montiert. Nicht alle Fliesen werden warm.' : 'Alle 4 Hotspots montiert. Das Bad ist nach ' + m + (m === 1 ? ' Minute' : ' Minuten') + ' ganz warm.';
  }

  function flame() {
    return '<svg class="' + P + 'fire" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle class="' + P + 'disc" cx="20" cy="20" r="18"/>' +
      '<path class="' + P + 'fl1" d="M20 7 C22 13 28 15 28 23 C28 28 24.500 32 20 32 C15.500 32 12 28 12 23 C12 19 14.500 17 15.500 13.500 C17.500 15 18 16 18.500 18 C20 15 20.500 11 20 7 Z"/>' +
      '<path class="' + P + 'fl2" d="M20 19 C21 22 24 23 24 26.500 C24 29 22 30.500 20 30.500 C18 30.500 16 29 16 26.500 C16 24 18.500 23 20 19 Z"/></svg>';
  }

  function toggleTile(i) {
    if (locked) return;
    var k = hs.indexOf(i);
    if (k >= 0) hs.splice(k, 1);
    else if (hs.length >= MAXHS) {
      focusI = i; render();
      api.changed('Du hast schon ' + MAXHS + ' Hotspots. Tippe zuerst einen Hotspot an, um ihn wieder zu entfernen.');
      return;
    } else hs.push(i);
    hs.sort(function (a, b) { return a - b; });
    focusI = i;
    render();
    api.changed(summary());
  }

  function render() {
    narrow = !!(mq && mq.matches);
    var d = times(hs), mx = maxTime(hs);
    var heat = showHeat();
    var btns = TILES.map(function (t, i) {
      var isH = hs.indexOf(i) >= 0;
      var cls = P + 'tile' + (isH ? ' on' : '');
      var time = d[i];
      var txt = null;
      if (heat && hs.length) {
        if (time >= 0) { cls += ' w' + Math.min(time, 4); txt = isH ? null : String(time); }
        if (locked && (time < 0 || time > BEST)) cls += ' late';
      }
      var lab = 'Fliese in Zeile ' + (t[0] + 1) + ', Spalte ' + (t[1] + 1) + ': ' + (isH ? 'Hotspot montiert' : 'kein Hotspot') +
        (heat && hs.length && time > 0 ? ', warm nach ' + time + (time === 1 ? ' Minute' : ' Minuten') : '');
      var b = h('button', {
        type: 'button', class: cls, 'data-i': String(i), style: '--r:' + t[0] + ';--c:' + t[1],
        'aria-pressed': String(isH), 'aria-label': lab, tabindex: i === focusI ? '0' : '-1', 'aria-disabled': locked ? 'true' : false
      });
      b.innerHTML = isH ? flame() : '';
      if (txt !== null) b.appendChild(h('span', { class: P + 'n', 'aria-hidden': 'true' }, txt));
      return b;
    });
    tileBtns = btns;
    var stock = [];
    for (var k = 0; k < MAXHS; k++) stock.push(h('span', { class: P + 'stock' + (k < hs.length ? ' used' : ''), 'aria-hidden': 'true' }));
    stock.forEach(function (s, k) { if (k >= hs.length) s.innerHTML = flame(); });
    toggleBtn = locked ? null : h('button', { type: 'button', class: 'btn ghost ' + P + 'tgl', 'aria-pressed': String(preview), onclick: function () { preview = !preview; render(); var tg = el.querySelector('.' + P + 'tgl'); if (tg) tg.focus(); } }, preview ? 'Wärmeverlauf ausblenden' : 'Wärmeverlauf anzeigen');
    statusLine = h('p', { class: P + 'sum', 'aria-live': 'polite' }, heat && hs.length === MAXHS ? summary() : '');
    boardEl = h('div', { class: P + 'floor', role: 'group', 'aria-label': 'Grundriss des Bades mit 48 Fliesen', onkeydown: onKey, onclick: onClick }, btns);
    el.replaceChildren(h('div', { class: P + 'wrap' },
      h('div', { class: P + 'bar' }, h('span', { class: P + 'stocklab' }, 'Hotspots:'), h('span', { class: P + 'stocks', role: 'img', 'aria-label': (MAXHS - hs.length) + ' von ' + MAXHS + ' Hotspots übrig' }, stock), toggleBtn),
      boardEl,
      h('p', { class: P + 'turn' }, 'Der Grundriss ist hier um eine Vierteldrehung gedreht, damit die Fliesen groß genug sind.'),
      statusLine));
  }
  function onClick(e) {
    var b = e.target.closest('[data-i]');
    if (b) toggleTile(+b.dataset.i);
  }
  function onKey(e) {
    var b = e.target.closest('[data-i]');
    if (!b) return;
    var i = +b.dataset.i, t = TILES[i], dr = 0, dc = 0;
    if (e.key === 'ArrowRight') { if (narrow) dr = 1; else dc = 1; }
    else if (e.key === 'ArrowLeft') { if (narrow) dr = -1; else dc = -1; }
    else if (e.key === 'ArrowDown') { if (narrow) dc = 1; else dr = 1; }
    else if (e.key === 'ArrowUp') { if (narrow) dc = -1; else dr = -1; }
    else return;
    e.preventDefault();
    var j = tileAt(t[0] + dr, t[1] + dc);
    if (j < 0) return;
    focusI = j;
    tileBtns.forEach(function (x, k) { x.tabIndex = k === j ? 0 : -1; });
    tileBtns[j].focus();
  }

  Biber.register({
    id: 'hotspot20',
    story:
      '<p>Luis mag es warm im Bad. In sein neues Haus lässt er eine Bodenheizung mit <strong>Hotspots</strong> einbauen. Ein Hotspot wird direkt unter einer Fliese montiert. Schaltet man ihn ein, wird diese Fliese sofort warm. ' +
      'Von einer warmen Fliese breitet sich die Wärme <strong>in einer Minute auf alle benachbarten Fliesen</strong> aus, seitlich und über Eck.</p>' +
      '<div class="' + P + 'ex" role="img" aria-label="Beispiel: Hotspot unten in der dritten Fliese der untersten Reihe. Die Zahlen sagen, nach wie vielen Minuten jede Fliese warm ist: obere Reihe 2 2 2 2 2 3, mittlere Reihe 2 1 1 1 2 3, untere Reihe 2 1 und der Hotspot.">' +
      (function () {
        var rows = [[2, 2, 2, 2, 2, 3], [2, 1, 1, 1, 2, 3], [2, 1, 0]], s = '';
        rows.forEach(function (r, ri) { r.forEach(function (v, ci) { s += '<span class="' + P + 'exc w' + v + '" style="grid-row:' + (ri + 1) + ';grid-column:' + (ci + 1) + '">' + (v ? v : flame()) + '</span>'; }); });
        return s;
      })() + '</div>' +
      '<p>Beispiel: Die Zahlen sagen für jede Fliese, nach wie vielen Minuten sie warm ist. Luis kann sich <strong>4 Hotspots</strong> leisten. Er wünscht, dass nach möglichst wenigen Minuten alle Fliesen im Bad warm sind. Die Hotspots werden gleichzeitig angeschaltet.</p>',
    question: 'Montiere die 4 Hotspots so, dass Luis’ Wunsch erfüllt wird.',
    howto: 'Tippe auf eine Fliese, um dort einen Hotspot zu montieren. Tippst du einen Hotspot noch einmal an, wird er wieder entfernt. Mit „Wärmeverlauf anzeigen“ siehst du, wie schnell die Fliesen warm werden.',
    explanation: function () {
      return '<p>Ein Hotspot erwärmt in der ersten Minute höchstens 9 Fliesen, nach 2 Minuten höchstens 25. Vier Hotspots schaffen in einer Minute höchstens 36 Fliesen, das Bad hat aber 48. ' +
        '<strong>Eine Minute reicht also nicht, aber 2 Minuten können reichen.</strong></p>' +
        '<p>Wegen des Grundrisses setzt man zwei Hotspots in die Mitte der beiden schmalen Gänge (jeweils an die dritte Fliese von links). ' +
        'Die anderen zwei kommen in den großen Raum: einer in die mittlere Reihe an die dritte Fliese des großen Raums (von links), der andere in dieselbe Reihe an die achte Fliese. ' +
        'Den rechten Hotspot kann man auch eine Fliese höher oder tiefer setzen. Es gibt genau diese drei Lösungen.</p>' +
        '<p>Mit möglichst wenig Aufwand möglichst viel erreichen: In der Informatik heißt das verwandte Problem „minimales Dominating Set“. In einem Graphen sucht man dabei möglichst wenige Knoten, sodass jeder andere Knoten einen Nachbarn in dieser Auswahl hat. ' +
        'Auch bei der Planung von WLAN-Hotspots in einem Haus geht es darum.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset(); focusI = 0;
      if (window.matchMedia) {
        if (mq && onMq) { try { mq.removeEventListener('change', onMq); } catch (err) { /* ältere Browser */ } }
        mq = window.matchMedia('(max-width: 36rem)');
        onMq = function () { if (el && el.isConnected) render(); };
        try { mq.addEventListener('change', onMq); } catch (err) { /* ältere Browser */ }
      }
      render();
    },
    isComplete: function () { return hs.length === MAXHS; },
    evaluate: function () { return { correct: maxTime(hs) <= BEST, answer: hs.slice() }; },
    setAnswer: function (ans) { hs = ans.slice(); forced = true; locked = true; render(); },
    lock: function (on) {
      locked = on; forced = on;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () { hs = SOL.slice().sort(function (a, b) { return a - b; }); locked = true; forced = true; render(); }
  });
})();
