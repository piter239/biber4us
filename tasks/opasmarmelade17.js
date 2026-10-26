/* Aufgabe Opas Marmelade (Heft 2017, S. 44): Arbeitsplan für drei Kinder, parallele Prozesse mit Abhängigkeiten (Finish-to-Start) */
(function () {
  'use strict';
  var h = Biber.h, sv = Biber.svg;

  var COLS = 10;
  var NEED = 5;                                   /* so viele Gläser sind in 10 Minuten das Optimum: 3 · 10 : 6 = 5 */
  var KIDS = ['Anna', 'Peter', 'Lisa'];
  var TYPES = {
    W: { len: 3, name: 'Glas spülen', short: 'spülen' },
    F: { len: 2, name: 'Marmelade einfüllen', short: 'füllen' },
    C: { len: 1, name: 'Glas verschließen', short: 'verschließen' }
  };
  var ORDER = ['W', 'F', 'C'];
  /* offizieller Plan: Zeilen als Folge von Arbeitsschritten (Anfang jeweils nahtlos hinter dem vorigen) */
  var OFFICIAL = ['WWFCC', 'WWFCC', 'WFFFC'];

  function fromString(s) {
    var t = 0, out = [];
    s.split('').forEach(function (c) { out.push({ t: c, s: t }); t += TYPES[c].len; });
    return out;
  }
  function officialRows() { return OFFICIAL.map(fromString); }

  /* ---------- Auswertung: wie viele Gläser werden fertig? ----------
     Ein Glas ist eine Kette Spülen -> Füllen -> Verschließen, jeweils erst nach dem Ende des vorigen Schritts.
     Höchstzahl knotendisjunkter Ketten = maximaler Fluss (Kapazität 1 je Arbeitsschritt). */
  function analyse(rows) {
    var items = { W: [], F: [], C: [] };
    rows.forEach(function (row, r) {
      row.forEach(function (b, i) { items[b.t].push({ r: r, i: i, s: b.s, e: b.s + TYPES[b.t].len }); });
    });
    var n = 2;
    ORDER.forEach(function (t) { items[t].forEach(function (x) { x.a = n++; x.b = n++; }); });
    var cap = [], i, j;
    for (i = 0; i < n; i++) { cap.push([]); for (j = 0; j < n; j++) cap[i].push(0); }
    items.W.forEach(function (w) {
      cap[0][w.a] = 1; cap[w.a][w.b] = 1;
      items.F.forEach(function (f) { if (w.e <= f.s) cap[w.b][f.a] = 1; });
    });
    items.F.forEach(function (f) {
      cap[f.a][f.b] = 1;
      items.C.forEach(function (c) { if (f.e <= c.s) cap[f.b][c.a] = 1; });
    });
    items.C.forEach(function (c) { cap[c.a][c.b] = 1; cap[c.b][1] = 1; });
    var orig = cap.map(function (r) { return r.slice(); });
    function augment() {
      var seen = {}, prev = {}, queue = [0];
      seen[0] = true;
      while (queue.length) {
        var u = queue.shift();
        if (u === 1) break;
        for (var v = 0; v < n; v++) if (!seen[v] && cap[u][v] > 0) { seen[v] = true; prev[v] = u; queue.push(v); }
      }
      if (!seen[1]) return false;
      for (var x = 1; x !== 0; x = prev[x]) { cap[prev[x]][x]--; cap[x][prev[x]]++; }
      return true;
    }
    var flow = 0;
    while (augment()) flow++;
    /* Ketten aus dem Fluss ablesen */
    var chains = [];
    function used(u, v) { return orig[u][v] > 0 && cap[u][v] === 0; }
    items.W.forEach(function (w) {
      if (!used(0, w.a)) return;
      var ch = { W: w };
      items.F.forEach(function (f) { if (used(w.b, f.a)) ch.F = f; });
      if (ch.F) items.C.forEach(function (c) { if (used(ch.F.b, c.a)) ch.C = c; });
      if (ch.F && ch.C) chains.push(ch);
    });
    var glass = {};
    chains.forEach(function (ch, k) {
      ORDER.forEach(function (t) { glass[ch[t].r + ':' + ch[t].i] = k + 1; });
    });
    return { count: flow, glass: glass };
  }

  /* ---------- Darstellung ---------- */
  function jar(t) {
    var s = sv('svg', { viewBox: '0 0 20 26', class: 't-opasmarmelade17-jar', 'aria-hidden': 'true', focusable: 'false' });
    var body = 'M5 7 Q2 9 2 13 L2 21 Q2 24.5 5.5 24.5 L14.5 24.5 Q18 24.5 18 21 L18 13 Q18 9 15 7 L15 5 L5 5 Z';
    if (t === 'W') {
      s.appendChild(sv('path', { d: body, class: 't-opasmarmelade17-glass' }));
    } else {
      s.appendChild(sv('path', { d: body, class: 't-opasmarmelade17-glass' }));
      s.appendChild(sv('path', { d: 'M2.4 12.5 Q2.2 10 4 8.4 L16 8.4 Q17.8 10 17.6 12.5 L17.6 21 Q17.6 24 14.5 24 L5.5 24 Q2.4 24 2.4 21 Z', class: 't-opasmarmelade17-jam' }));
      s.appendChild(sv('path', { d: body, class: 't-opasmarmelade17-outline' }));
      if (t === 'C') s.appendChild(sv('rect', { x: 4.5, y: 1.8, width: 11, height: 3.6, rx: 1, class: 't-opasmarmelade17-lid' }));
    }
    if (t === 'W') s.appendChild(sv('path', { d: body, class: 't-opasmarmelade17-outline' }));
    return s;
  }

  var el, api, locked, rows, sel, drag, resultMark, flowInfo, focusReq;

  function emptyRows() { return [[], [], []]; }
  function occupied(r, col, ignore) {
    return rows[r].some(function (b) { return b !== ignore && col >= b.s && col < b.s + TYPES[b.t].len; });
  }
  function fits(r, s, t, ignore) {
    if (s < 0 || s + TYPES[t].len > COLS) return false;
    for (var c = s; c < s + TYPES[t].len; c++) if (occupied(r, c, ignore)) return false;
    return true;
  }
  function place(r, s, t) {
    rows[r].push({ t: t, s: s });
    rows[r].sort(function (a, b) { return a.s - b.s; });
  }
  function minutes() {
    var m = 0;
    rows.forEach(function (row) { row.forEach(function (b) { m += TYPES[b.t].len; }); });
    return m;
  }
  function statusText() {
    var m = minutes();
    return m ? m + ' von 30 Arbeitsminuten verplant' : '';
  }

  function render() {
    var hadFocus = el.contains(document.activeElement);
    el.replaceChildren(buildBoard({ editable: true }));
    if (hadFocus && focusReq) {
      var q = el.querySelector(focusReq);
      if (q) q.focus();
    }
    focusReq = null;
  }

  function buildBoard(o) {
    var data = o.rows || rows;
    var info = o.info || null;
    var head = h('div', { class: 't-opasmarmelade17-axis', 'aria-hidden': 'true' }, h('span', { class: 't-opasmarmelade17-who' }, ''));
    var ticks = h('div', { class: 't-opasmarmelade17-ticks' });
    for (var c = 1; c <= COLS; c++) ticks.appendChild(h('span', null, String(c)));
    head.appendChild(ticks);
    var grid = h('div', { class: 't-opasmarmelade17-grid' + (info ? ' done ' + (info.ok ? 'ok' : 'bad') : '') }, head);
    data.forEach(function (row, r) {
      var line = h('div', { class: 't-opasmarmelade17-line', 'data-row': String(r) });
      var cells = h('div', { class: 't-opasmarmelade17-cells' });
      var col = 0;
      /* leere Felder und Blöcke in einem Spaltenraster */
      var cover = {};
      row.forEach(function (b, i) { for (var k = 0; k < TYPES[b.t].len; k++) cover[b.s + k] = true; });
      for (col = 0; col < COLS; col++) {
        if (cover[col]) continue;
        cells.appendChild(h('button', {
          type: 'button', class: 't-opasmarmelade17-cell' + (o.editable && sel ? ' armed' : ''), 'data-r': String(r), 'data-c': String(col),
          style: 'grid-column:' + (col + 1),
          'aria-label': KIDS[r] + ', Minute ' + (col + 1) + ' (frei)', disabled: !o.editable || locked, tabindex: o.editable ? false : '-1'
        }));
      }
      row.forEach(function (b, i) {
        var T = TYPES[b.t], k = info && info.glass[r + ':' + i];
        var bad = info && !k;
        var cls = 't-opasmarmelade17-block t-opasmarmelade17-' + b.t + (info ? (bad ? ' loose' : ' used') : '');
        var children = [jar(b.t)];
        if (k) children.push(h('span', { class: 't-opasmarmelade17-no', 'aria-hidden': 'true' }, String(k)));
        var label = KIDS[r] + ': ' + T.name + ', Minute ' + (b.s + 1) + (T.len > 1 ? ' bis ' + (b.s + T.len) : '') +
          (info ? (k ? ', gehört zu Glas ' + k : ', gehört zu keinem fertigen Glas') : (o.editable && !locked ? '. Antippen zum Entfernen' : ''));
        cells.appendChild(h('button', {
          type: 'button', class: cls, 'data-r': String(r), 'data-i': String(i), 'data-b': r + ':' + b.s,
          style: 'grid-column:' + (b.s + 1) + ' / span ' + T.len,
          draggable: o.editable && !locked ? 'true' : false, 'aria-label': label, disabled: !o.editable || locked, tabindex: o.editable ? false : '-1'
        }, children));
      });
      line.appendChild(h('div', { class: 't-opasmarmelade17-who' }, KIDS[r].toUpperCase()));
      line.appendChild(cells);
      grid.appendChild(line);
    });
    var board = h('div', { class: 't-opasmarmelade17-board' });
    if (o.editable) {
      var pal = h('div', { class: 't-opasmarmelade17-pal', role: 'group', 'aria-label': 'Arbeitsschritte' });
      ORDER.forEach(function (t) {
        var T = TYPES[t];
        pal.appendChild(h('button', {
          type: 'button', class: 't-opasmarmelade17-tool t-opasmarmelade17-' + t + (sel === t ? ' sel' : ''), 'data-tool': t,
          'aria-pressed': String(sel === t), draggable: locked ? false : 'true', disabled: locked,
          'aria-label': T.name + ', ' + T.len + (T.len === 1 ? ' Minute' : ' Minuten')
        }, jar(t), h('span', { class: 't-opasmarmelade17-tt' }, h('b', null, T.name), h('small', null, T.len + (T.len === 1 ? ' Minute' : ' Minuten')))));
      });
      board.appendChild(pal);
    }
    board.appendChild(grid);
    return board;
  }

  function staticBoard(rs, info) {
    return buildBoard({ editable: false, rows: rs, info: info });
  }

  /* ---------- Bedienung ---------- */
  function clickTool(t) {
    if (locked) return;
    sel = sel === t ? null : t;
    focusReq = '[data-tool="' + t + '"]';
    render();
    api.changed(sel ? TYPES[sel].name + ' gewählt. Tippe auf ein freies Feld in einer Zeile.' : statusText());
  }
  function tryPlace(r, c, t, ignore) {
    if (!fits(r, c, t, ignore)) return false;
    place(r, c, t);
    return true;
  }
  function onClick(e) {
    if (locked) return;
    var tool = e.target.closest('[data-tool]');
    if (tool) return clickTool(tool.dataset.tool);
    var blk = e.target.closest('.t-opasmarmelade17-block');
    if (blk) {
      var r = +blk.dataset.r, i = +blk.dataset.i, b = rows[r][i];
      rows[r].splice(i, 1);
      focusReq = '.t-opasmarmelade17-cell[data-r="' + r + '"][data-c="' + b.s + '"]';
      render();
      api.changed(statusText());
      return;
    }
    var cell = e.target.closest('.t-opasmarmelade17-cell');
    if (cell) {
      var rr = +cell.dataset.r, cc = +cell.dataset.c;
      if (!sel) { api.changed('Wähle zuerst oben einen Arbeitsschritt aus.'); return; }
      if (!tryPlace(rr, cc, sel)) { api.changed('Hier ist nicht genug Platz: ' + TYPES[sel].name + ' dauert ' + TYPES[sel].len + ' Minuten am Stück.'); return; }
      focusReq = '.t-opasmarmelade17-block[data-b="' + rr + ':' + cc + '"]';
      render();
      api.changed(statusText());
    }
  }
  function onDragStart(e) {
    if (locked) return;
    var tool = e.target.closest('[data-tool]');
    var blk = e.target.closest('.t-opasmarmelade17-block');
    if (tool) drag = { kind: 'new', t: tool.dataset.tool };
    else if (blk) { var r = +blk.dataset.r; drag = { kind: 'move', r: r, i: +blk.dataset.i, t: rows[r][+blk.dataset.i].t }; }
    else return;
    e.dataTransfer.setData('text/plain', drag.t);
    e.dataTransfer.effectAllowed = 'move';
  }
  function clearOver() {
    [].forEach.call(el.querySelectorAll('.over'), function (x) { x.classList.remove('over'); });
  }
  function onDragOver(e) {
    if (!drag || locked) return;
    var cell = e.target.closest('.t-opasmarmelade17-cell');
    if (!cell) return;
    e.preventDefault();
    clearOver();
    cell.classList.add('over');
  }
  function onDrop(e) {
    if (!drag || locked) return;
    var cell = e.target.closest('.t-opasmarmelade17-cell');
    if (!cell) return;
    e.preventDefault();
    var d = drag; drag = null;
    var r = +cell.dataset.r, c = +cell.dataset.c;
    if (d.kind === 'move') {
      var b = rows[d.r][d.i];
      rows[d.r].splice(d.i, 1);
      if (!tryPlace(r, c, d.t)) { place(d.r, b.s, b.t); api.changed('Hier ist nicht genug Platz.'); render(); return; }
    } else if (!tryPlace(r, c, d.t)) { api.changed('Hier ist nicht genug Platz: ' + TYPES[d.t].name + ' dauert ' + TYPES[d.t].len + ' Minuten am Stück.'); clearOver(); return; }
    render();
    api.changed(statusText());
  }
  function onDragEnd() { drag = null; clearOver(); }

  function planInfo() {
    var a = analyse(rows);
    return { ok: a.count >= NEED, count: a.count, glass: a.glass };
  }
  function copyRows(rs) { return rs.map(function (row) { return row.map(function (b) { return { t: b.t, s: b.s }; }); }); }
  function sanitize(rs) {
    var out = emptyRows();
    if (!Array.isArray(rs)) return out;
    rs.slice(0, 3).forEach(function (row, r) {
      (row || []).forEach(function (b) {
        if (b && TYPES[b.t] && b.s >= 0 && b.s + TYPES[b.t].len <= COLS && !out[r].some(function (x) { return b.s < x.s + TYPES[x.t].len && x.s < b.s + TYPES[b.t].len; })) out[r].push({ t: b.t, s: b.s });
      });
      out[r].sort(function (a, b) { return a.s - b.s; });
    });
    return out;
  }

  function showResult() {
    var info = planInfo();
    flowInfo = info;
    el.replaceChildren(h('div', { class: 't-opasmarmelade17-board' }, staticBoard(rows, info)));
  }

  Biber.register({
    id: 'opasmarmelade17',
    story:
      '<p>Opa kocht Marmelade. Anna, Peter und Lisa helfen ihm, die Marmelade in Gläser abzufüllen. Dazu müssen sie jeweils diese Arbeitsschritte erledigen, und zwar genau in dieser Reihenfolge:</p>' +
      '<ol class="t-opasmarmelade17-steps"><li><b>Ein Glas spülen.</b> Das dauert 3 Minuten.</li><li><b>Marmelade in das Glas füllen.</b> Das dauert 2 Minuten.</li><li><b>Das Glas verschließen.</b> Das dauert 1 Minute.</li></ol>' +
      '<p>Anna, Peter und Lisa wollen sich die Arbeit aufteilen und dazu einen Plan erstellen. Dabei müssen sie beachten:</p>' +
      '<ul><li>Ein Arbeitsschritt muss komplett erledigt sein, bevor der nächste erledigt werden kann.</li><li>Ein Glas muss ganz sauber sein, bevor man Marmelade einfüllt.</li><li>Und das Glas darf natürlich erst verschlossen werden, wenn es fertig gefüllt ist.</li></ul>' +
      '<p>Ein Plan ist zum Beispiel nicht möglich, wenn Peter schon Marmelade einfüllt, während Anna das Glas noch spült.</p>' +
      '<p>Anna, Peter und Lisa wollen in 10 Minuten möglichst viele Gläser abfüllen.</p>',
    question: 'Erstelle einen Plan, mit dem sie das schaffen.',
    howto: 'Wähle oben einen Arbeitsschritt und tippe dann auf ein freies Feld in der Zeile von Anna, Peter oder Lisa. Der Schritt beginnt in diesem Feld und braucht so viele Felder wie Minuten. Du kannst ihn auch ziehen. Einen gesetzten Schritt entfernst Du mit einem Tipp darauf.',
    explanation: function () {
      var own = flowInfo && rows && minutes() ? flowInfo : null;
      var s = '';
      if (own && !own.ok) s += '<p>' + (own.count === 0 ? 'In Deinem Plan wird <b>kein Glas</b> fertig' : own.count === 1 ? 'In Deinem Plan wird nur <b>ein Glas</b> fertig' : 'In Deinem Plan werden nur <b>' + own.count + ' Gläser</b> fertig') + '. Möglich sind aber fünf. Achte darauf, dass jeder Schritt erst beginnt, wenn der vorige Schritt am selben Glas fertig ist, und dass die Kinder nicht untätig herumstehen.</p>';
      s += '<p>Das Abfüllen eines Glases dauert 3 + 2 + 1 = 6 Minuten. Jedes der drei Kinder hat 10 Minuten Arbeitszeit, zusammen sind das 30 Minuten. Wegen 30 : 6 = 5 können sie höchstens fünf Gläser schaffen. Das gelingt, wenn alle drei die ganze Zeit durcharbeiten und kein Schritt vor dem Ende des vorigen Schritts am selben Glas beginnt. Ein möglicher Plan (die Zahlen zeigen, welche Schritte zu einem Glas gehören):</p>';
      var info = analyse(officialRows());
      s += '<div class="t-opasmarmelade17-expl">' + staticBoard(officialRows(), { ok: true, glass: info.glass }).outerHTML + '</div>';
      s += '<p>Es gibt noch andere Pläne, die ebenfalls fünf Gläser schaffen. Hier arbeiten die drei gleichzeitig, also parallel, aber die Schritte hängen voneinander ab: Der nächste Schritt darf erst beginnen, wenn der frühere abgeschlossen ist. Solche Abhängigkeiten gibt es auch in Computern, deren Prozessor mehrere Kerne hat, die gleichzeitig Teilaufgaben abarbeiten.</p>';
      return s;
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; rows = emptyRows(); sel = null; drag = null; flowInfo = null; focusReq = null;
      el.addEventListener('click', onClick);
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', onDragEnd);
      el.addEventListener('dragleave', function (e) { var c = e.target.closest && e.target.closest('.t-opasmarmelade17-cell'); if (c) c.classList.remove('over'); });
      render();
    },
    isComplete: function () { return minutes() > 0; },
    evaluate: function () {
      var info = planInfo();
      flowInfo = info;
      return { correct: info.ok, answer: copyRows(rows) };
    },
    setAnswer: function (ans) {
      rows = sanitize(ans);
      sel = null;
      flowInfo = planInfo();
      showResult();
    },
    lock: function (on) {
      locked = on;
      if (on) { flowInfo = planInfo(); showResult(); }
      else { sel = null; render(); }
    },
    reset: function () {
      rows = emptyRows(); sel = null; flowInfo = null;
      render();
    },
    showSolution: function () {
      rows = officialRows(); sel = null;
      flowInfo = planInfo();
      showResult();
    }
  });
})();
