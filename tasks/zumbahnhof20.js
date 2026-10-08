/* Aufgabe Zum Bahnhof! (Biber 2020, Klasse 3-4 einfach): Schienenstücke auf zwei freie Felder legen, so dass der Zug zum Bahnhof fährt */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-zumbahnhof20-';
  var NS = 'http://www.w3.org/2000/svg';

  /* Spielfeld 3 Zeilen x 6 Spalten. Schienenstück = die zwei Seiten, die es verbindet (L, R, U, D).
     'S' = Bahnhof, 'LR|B' = gerade Schiene, die an einem Prellbock endet, null = leeres Feld, '?' = freier Platz (grüner Punkt) */
  var GRID = [
    [null, 'RD', 'LR', 'LR', 'LD', 'S'],
    ['LR', '?', 'LR', 'LR|B', 'UD', 'UD'],
    [null, 'UR', 'LR', 'LR', '?', 'UL']
  ];
  var TARGETS = [[1, 1], [2, 4]];
  var START = { r: 1, c: 0, from: 'L' };      /* Der Zug fährt von links ins Feld (Zeile 2, Spalte 1) */
  var PIECES = ['RD', 'LD', 'UR', 'UL', 'LR', 'UD'];
  /* Heft: zwei Möglichkeiten (per Skript über alle 36 Belegungen bestätigt) */
  var SOLUTIONS = [['UL', 'UR'], ['LD', 'LR']];
  var DIR = { L: [0, -1], R: [0, 1], U: [-1, 0], D: [1, 0] };
  var OPP = { L: 'R', R: 'L', U: 'D', D: 'U' };
  var SIDE_NAME = { L: 'links', R: 'rechts', U: 'oben', D: 'unten' };
  var EDGE = { L: [0, 50], R: [100, 50], U: [50, 0], D: [50, 100] };

  function pieceName(p) {
    if (p === 'LR') return 'Gerade Schiene waagerecht';
    if (p === 'UD') return 'Gerade Schiene senkrecht';
    return 'Kurve von ' + SIDE_NAME[p.charAt(0)] + ' nach ' + SIDE_NAME[p.charAt(1)];
  }

  /* ---------- Schienen zeichnen (Feld 100 x 100) ---------- */
  function sleeperLine(x1, y1, x2, y2) {
    return '<line class="' + P + 'sl" x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"/>';
  }
  function pieceInner(spec) {
    var buffer = spec.indexOf('|B') >= 0, p = spec.replace('|B', ''), out = '', i;
    if (p === 'LR' || p === 'UD') {
      var rot = p === 'UD' ? ' transform="rotate(90 50 50)"' : '';
      out += '<g' + rot + '>';
      for (i = 0; i < 4; i++) out += sleeperLine(14 + i * 24, 28, 14 + i * 24, 72);
      var x2 = buffer ? 92 : 100;
      out += '<line class="' + P + 'rail" x1="0" y1="37" x2="' + x2 + '" y2="37"/><line class="' + P + 'rail" x1="0" y1="63" x2="' + x2 + '" y2="63"/>';
      if (buffer) out += '<rect class="' + P + 'buf" x="88" y="26" width="10" height="48" rx="2"/><circle class="' + P + 'bufd" cx="93" cy="37" r="3.6"/><circle class="' + P + 'bufd" cx="93" cy="63" r="3.6"/>';
      return out + '</g>';
    }
    /* Kurve: Grundform RD (Mittelpunkt des Bogens in der Ecke unten rechts), gedreht in 90°-Schritten */
    var base = { RD: 0, LD: 90, UL: 180, UR: 270 }[p];
    out += '<g transform="rotate(' + base + ' 50 50)">';
    [195, 225, 255].forEach(function (a) {
      var rad = a * Math.PI / 180;
      out += sleeperLine(100 + 28 * Math.cos(rad), 100 + 28 * Math.sin(rad), 100 + 72 * Math.cos(rad), 100 + 72 * Math.sin(rad));
    });
    [37, 63].forEach(function (r) {
      out += '<path class="' + P + 'rail" d="M' + (100 - r) + ' 100 A' + r + ' ' + r + ' 0 0 1 100 ' + (100 - r) + '"/>';
    });
    return out + '</g>';
  }
  function houseInner() {
    return '<rect class="' + P + 'hw" x="6" y="46" width="88" height="40" rx="2"/>' +
      '<rect class="' + P + 'hr" x="3" y="40" width="94" height="9" rx="2"/>' +
      '<path class="' + P + 'hroof" d="M30 40 L50 8 L70 40 Z"/>' +
      '<circle class="' + P + 'hclock" cx="50" cy="30" r="6.5"/><path class="' + P + 'hhand" d="M50 30 V25 M50 30 L54 32"/>' +
      '<rect class="' + P + 'hdoor" x="42" y="58" width="16" height="28" rx="8"/>' +
      '<rect class="' + P + 'hwin" x="14" y="58" width="9" height="14" rx="3"/><rect class="' + P + 'hwin" x="28" y="58" width="9" height="14" rx="3"/>' +
      '<rect class="' + P + 'hwin" x="63" y="58" width="9" height="14" rx="3"/><rect class="' + P + 'hwin" x="77" y="58" width="9" height="14" rx="3"/>';
  }
  function svgWrap(inner) {
    return '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' + inner + '</svg>';
  }
  function trainSvg() {
    return '<svg class="' + P + 'trainsvg" viewBox="0 0 80 44" aria-hidden="true" focusable="false">' +
      '<rect class="' + P + 'tcab" x="2" y="8" width="22" height="26" rx="3"/><rect class="' + P + 'troof" x="0" y="4" width="26" height="6" rx="2"/>' +
      '<rect class="' + P + 'tbody" x="24" y="14" width="40" height="20" rx="6"/><rect class="' + P + 'tchim" x="50" y="4" width="9" height="12" rx="2"/>' +
      '<rect class="' + P + 'tcab" x="30" y="6" width="9" height="8" rx="2"/>' +
      '<circle class="' + P + 'twheel" cx="14" cy="36" r="6"/><circle class="' + P + 'twheel" cx="38" cy="37" r="5"/><circle class="' + P + 'twheel" cx="56" cy="37" r="5"/>' +
      '<path class="' + P + 'tnose" d="M64 20 L74 34 L64 34 Z"/></svg>';
  }

  /* ---------- Spiellogik ---------- */
  function cellAt(placed, r, c) {
    var g = GRID[r][c];
    if (g === '?') {
      var k = -1;
      TARGETS.forEach(function (t, i) { if (t[0] === r && t[1] === c) k = i; });
      return placed[k] || '?';
    }
    return g;
  }
  /* Fahrt des Zuges: Liste der befahrenen Felder und Ausgang (ok | derail | buffer) */
  function run(placed) {
    var r = START.r, c = START.c, from = START.from, steps = [], i;
    for (i = 0; i < 40; i++) {
      var cell = cellAt(placed, r, c);
      if (cell === 'S') { steps.push({ r: r, c: c, from: from, out: null }); return { steps: steps, result: 'ok' }; }
      if (cell === null || cell === '?') return { steps: steps, result: 'derail', at: { r: r, c: c, from: from, gap: true } };
      var buffer = cell.indexOf('|B') >= 0, sides = cell.replace('|B', '');
      if (sides.indexOf(from) < 0) return { steps: steps, result: 'derail', at: { r: r, c: c, from: from, gap: false } };
      if (buffer) { steps.push({ r: r, c: c, from: from, out: null, buffer: true }); return { steps: steps, result: 'buffer', at: { r: r, c: c } }; }
      var out = sides.replace(from, '');
      steps.push({ r: r, c: c, from: from, out: out, piece: sides });
      r += DIR[out][0]; c += DIR[out][1]; from = OPP[out];
      if (r < 0 || c < 0 || r > 2 || c > 5) return { steps: steps, result: 'derail', at: { r: r, c: c, from: from, gap: true, outside: true } };
    }
    return { steps: steps, result: 'loop' };
  }
  function isRight(placed) { return placed.every(Boolean) && run(placed).result === 'ok'; }

  /* Wegpunkte (Koordinaten 600 x 300) für Zeichnung und Animation */
  function waypoints(rn) {
    var pts = [];
    function add(r, c, p) { pts.push([c * 100 + p[0], r * 100 + p[1]]); }
    rn.steps.forEach(function (s, idx) {
      if (idx === 0) add(s.r, s.c, EDGE[s.from]);
      if (s.out === null) {
        if (s.buffer) add(s.r, s.c, [84, 50]); else add(s.r, s.c, [50, 70]);
        return;
      }
      var p = s.piece;
      if (p === 'LR' || p === 'UD') add(s.r, s.c, [50, 50]);
      else {
        var cx = p.indexOf('R') >= 0 ? 100 : 0, cy = p.indexOf('D') >= 0 ? 100 : 0;
        add(s.r, s.c, [cx + (cx ? -35.4 : 35.4), cy + (cy ? -35.4 : 35.4)]);
      }
      add(s.r, s.c, EDGE[s.out]);
    });
    if (rn.result === 'derail' && rn.at && !rn.at.outside) {
      var e = EDGE[rn.at.from], mid = [50 + (e[0] - 50) * 0.35, 50 + (e[1] - 50) * 0.35];
      if (!rn.steps.length) add(rn.at.r, rn.at.c, e);
      add(rn.at.r, rn.at.c, mid);
    }
    return pts;
  }

  var el, api, placed, selected, dragging, locked, mode, boardEl, overlay, msgEl, runBtn, anim;

  function stopAnim() { if (anim) { cancelAnimationFrame(anim.id); anim = null; } if (overlay) { var m = overlay.querySelector('.' + P + 'anim'); if (m) m.remove(); } }

  function resultText(rn) {
    if (rn.result === 'ok') return 'Der Zug fährt in den Bahnhof.';
    if (rn.result === 'buffer') return 'Der Zug fährt gegen den Prellbock.';
    if (rn.at && rn.at.outside) return 'Der Zug fährt aus dem Gleisbild hinaus und entgleist.';
    var where = ' (Zeile ' + (rn.at.r + 1) + ', Spalte ' + (rn.at.c + 1) + ')';
    return rn.at && rn.at.gap ? 'Hier fehlt eine Schiene, der Zug entgleist' + where + '.' : 'Die Schiene passt nicht, der Zug entgleist' + where + '.';
  }

  function drawOverlay(rn, showEnd) {
    var pts = waypoints(rn), s = '';
    if (pts.length > 1) s += '<polyline class="' + P + 'route ' + (rn.result === 'ok' ? 'ok' : 'bad') + '" points="' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '"/>';
    if (showEnd && rn.result !== 'ok' && pts.length) {
      var q = pts[pts.length - 1];
      s += '<g class="' + P + 'cross" transform="translate(' + q[0].toFixed(1) + ' ' + q[1].toFixed(1) + ')"><circle r="15"/><path d="M-7 -7 L7 7 M7 -7 L-7 7"/></g>';
    }
    if (showEnd && rn.result === 'ok' && pts.length) {
      var e = pts[pts.length - 1];
      s += '<g class="' + P + 'tick" transform="translate(' + e[0].toFixed(1) + ' ' + (e[1] + 6).toFixed(1) + ')"><circle r="15"/><path d="M-7 1 L-2 6 L8 -6"/></g>';
    }
    overlay.innerHTML = s;
  }

  function runTrain() {
    stopAnim();
    var rn = run(placed);
    drawOverlay(rn, false);
    msgEl.textContent = '';
    var pts = waypoints(rn);
    if (pts.length < 2) { drawOverlay(rn, true); msgEl.textContent = resultText(rn); return; }
    pts.unshift([-34, 150]);
    var seg = [], tot = 0, i;
    for (i = 1; i < pts.length; i++) { var d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); tot += d; }
    var mk = document.createElementNS(NS, 'g');
    mk.setAttribute('class', P + 'anim');
    mk.innerHTML = '<rect x="-17" y="-10" width="34" height="20" rx="5"/><rect class="' + P + 'aw" x="2" y="-6" width="8" height="8" rx="2"/><path d="M17 -6 L26 0 L17 6 Z"/>';
    overlay.appendChild(mk);
    runBtn.disabled = true;
    var t0 = null, speed = 380;
    function frame(t) {
      if (t0 === null) t0 = t;
      var dist = Math.min(tot, (t - t0) / 1000 * speed), k = 0, acc = 0;
      while (k < seg.length - 1 && acc + seg[k] < dist) { acc += seg[k]; k++; }
      var f = seg[k] ? (dist - acc) / seg[k] : 1;
      var x = pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, y = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f;
      var ang = Math.atan2(pts[k + 1][1] - pts[k][1], pts[k + 1][0] - pts[k][0]) * 180 / Math.PI;
      mk.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')');
      if (dist >= tot) {
        anim = null; runBtn.disabled = false;
        drawOverlay(rn, true);
        msgEl.textContent = resultText(rn);
        mk.remove();
        return;
      }
      anim.id = requestAnimationFrame(frame);
    }
    anim = { id: 0 };
    anim.id = requestAnimationFrame(frame);
  }

  /* ---------- Bedienung ---------- */
  function statusText() {
    var n = placed.filter(Boolean).length;
    return n === 2 ? '' : (n + ' von 2 Feldern belegt.');
  }
  function place(piece, k) {
    if (locked) return;
    stopAnim();
    placed[k] = piece; selected = null;
    render(); focusTarget(k);
    api.changed(statusText());
  }
  function clearTarget(k) {
    if (locked) return;
    stopAnim();
    placed[k] = null; selected = null;
    render(); focusTarget(k);
    api.changed(statusText());
  }
  function focusTarget(k) { var b = el.querySelector('[data-target="' + k + '"]'); if (b) b.focus(); }

  function render() {
    var rn = run(placed);
    var cells = [];
    GRID.forEach(function (row, r) {
      row.forEach(function (g, c) {
        var k = -1;
        TARGETS.forEach(function (t, i) { if (t[0] === r && t[1] === c) k = i; });
        if (k >= 0) {
          var p = placed[k];
          var b = h('button', {
            type: 'button', class: P + 'cell ' + P + 'target' + (p ? ' filled' : ''), 'data-target': String(k), disabled: locked,
            'aria-label': 'Freies Feld, Zeile ' + (r + 1) + ', Spalte ' + (c + 1) + ': ' + (p ? pieceName(p) + ' (antippen entfernt sie)' : 'leer')
          });
          b.innerHTML = p ? svgWrap(pieceInner(p)) : '<span class="' + P + 'dot" aria-hidden="true"></span>';
          cells.push(b);
        } else {
          var d = h('div', { class: P + 'cell ' + P + 'fixed', 'aria-hidden': 'true' });
          if (g === 'S') d.innerHTML = svgWrap(houseInner());
          else if (g) d.innerHTML = svgWrap(pieceInner(g));
          cells.push(d);
        }
      });
    });
    var pool = PIECES.map(function (p) {
      return h('button', {
        type: 'button', class: P + 'piece' + (selected === p ? ' selected' : ''), 'data-piece': p, draggable: locked ? false : 'true', disabled: locked,
        'aria-pressed': String(selected === p), 'aria-label': pieceName(p)
      }, svgHtml(p));
    });
    boardEl = h('div', { class: P + 'board' + (mode ? ' ' + mode : '') + (mode === 'check' && rn.result === 'ok' ? ' ok' : '') }, cells);
    overlay = document.createElementNS(NS, 'svg');
    overlay.setAttribute('class', P + 'overlay');
    overlay.setAttribute('viewBox', '0 0 600 300');
    overlay.setAttribute('aria-hidden', 'true');
    var trainBox = h('div', { class: P + 'start', 'aria-hidden': 'true' });
    trainBox.innerHTML = trainSvg() + '<span class="' + P + 'arrow">&#10148;</span>';
    msgEl = h('p', { class: P + 'msg', role: 'status', 'aria-live': 'polite' });
    runBtn = h('button', { type: 'button', class: 'btn ghost ' + P + 'run', onclick: runTrain, disabled: false }, 'Zug fahren lassen');
    el.replaceChildren(h('div', { class: P + 'wrap' },
      h('div', { class: P + 'stage' }, trainBox, h('div', { class: P + 'field' }, boardEl, overlay)),
      h('div', { class: P + 'pool', 'data-pool': '', role: 'group', 'aria-label': 'Schienenstücke' }, pool),
      h('div', { class: P + 'bar' }, runBtn, msgEl)));
    if (mode === 'check' || mode === 'solution') {
      drawOverlay(rn, true);
      msgEl.textContent = resultText(rn);
    }
  }
  function svgHtml(p) {
    var s = document.createElement('span');
    s.className = P + 'pic';
    s.innerHTML = svgWrap(pieceInner(p));
    return s;
  }

  function onClick(e) {
    if (locked) return;
    var pb = e.target.closest('[data-piece]');
    if (pb) {
      var p = pb.dataset.piece;
      selected = selected === p ? null : p;
      render();
      var f = el.querySelector('[data-piece="' + p + '"]'); if (f) f.focus();
      return;
    }
    var tb = e.target.closest('[data-target]');
    if (!tb) return;
    var k = Number(tb.dataset.target);
    if (selected) place(selected, k);
    else if (placed[k]) clearTarget(k);
  }
  function onDragStart(e) {
    if (locked) return;
    var pb = e.target.closest('[data-piece]');
    if (pb) { dragging = { p: pb.dataset.piece }; }
    else {
      var tb = e.target.closest('[data-target]');
      if (!tb || !placed[Number(tb.dataset.target)]) return;
      dragging = { p: placed[Number(tb.dataset.target)], from: Number(tb.dataset.target) };
    }
    e.dataTransfer.setData('text/plain', dragging.p);
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e) {
    if (!dragging) return;
    var t = e.target.closest('[data-target],[data-pool]');
    if (!t) return;
    e.preventDefault();
    el.querySelectorAll('.over').forEach(function (x) { x.classList.remove('over'); });
    if (t.dataset.target !== undefined) t.classList.add('over');
  }
  function onDrop(e) {
    if (!dragging) return;
    var t = e.target.closest('[data-target],[data-pool]');
    if (!t) return;
    e.preventDefault();
    var d = dragging; dragging = null;
    if (t.dataset.target !== undefined) {
      var k = Number(t.dataset.target);
      if (d.from !== undefined && d.from !== k) { placed[d.from] = placed[k] || null; }
      place(d.p, k);
    } else if (d.from !== undefined) clearTarget(d.from);
  }
  function onDragEnd() { dragging = null; if (!locked) render(); }

  Biber.register({
    id: 'zumbahnhof20',
    story:
      '<p>Der Zug soll von links bis zum Bahnhof rechts oben fahren. Auf der Strecke fehlen aber noch zwei Schienenstücke, und zwar genau da, wo die grünen Punkte sind. Unter dem Gleisplan liegen sechs verschiedene Schienenstücke bereit.</p>',
    question: 'Ziehe Schienen auf die grünen Punkte, so dass der Zug zum Bahnhof fahren kann.',
    howto: 'Ziehe ein Schienenstück auf einen grünen Punkt. Du kannst auch erst das Stück und dann den Punkt antippen. Ein gelegtes Stück antippen nimmt es wieder weg. Mit „Zug fahren lassen“ kannst du sehen, wie der Zug fährt.',
    explanation: function () {
      return '<p>Es gibt <strong>zwei Möglichkeiten</strong>. Entweder biegt der Zug beim linken Punkt nach oben ab (Kurve von links nach oben) und fährt oben herum; dann muss auf dem rechten Punkt unten eine Kurve von oben nach rechts liegen, damit er zum Bahnhof weiterkommt. ' +
        'Oder er biegt beim linken Punkt nach unten ab (Kurve von links nach unten) und fährt unten entlang; dann muss auf dem rechten Punkt eine gerade, waagerechte Schiene liegen. Bei allen anderen Möglichkeiten entgleist der Zug oder er fährt gegen den Prellbock.</p>' +
        '<p>Ein Computer führt die Anweisungen eines Programms genauso genau aus, wie der Zug den Schienen folgt. Er kann nicht erkennen, ob ein Programm einen Fehler enthält – so wie ein Zug nicht merkt, dass Schienen falsch verlegt wurden. Wer ein Programm schreibt, muss deshalb sehr sorgfältig sein, und Informatikerinnen und Informatiker bauen „Notbremsen“ ein, damit Fehler keinen Schaden anrichten.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; placed = [null, null]; selected = null; dragging = null; locked = false; mode = null; anim = null;
      el.addEventListener('click', onClick);
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', onDragEnd);
      render();
    },
    isComplete: function () { return placed.every(Boolean); },
    evaluate: function () { return { correct: isRight(placed), answer: placed.slice() }; },
    setAnswer: function (ans) { stopAnim(); placed = [ans && ans[0] || null, ans && ans[1] || null]; selected = null; mode = null; render(); },
    lock: function (on) { stopAnim(); locked = on; selected = null; mode = on ? (mode === 'solution' ? 'solution' : 'check') : null; render(); },
    reset: function () { stopAnim(); placed = [null, null]; selected = null; mode = null; locked = false; render(); },
    showSolution: function () { stopAnim(); placed = SOLUTIONS[0].slice(); selected = null; locked = true; mode = 'solution'; render(); }
  });
})();
