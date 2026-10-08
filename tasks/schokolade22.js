/* Aufgabe Schokolade packen (Heft 2022, Klasse 9-10 schwer / 11-13 mittel): Rechteck-Packen (rectangle packing).
   Tafeln 1x5, 2x3, 3x4, 3x5 (zusammen 38 Stücke). Kleinste Schachtel (umschließendes Rechteck) hat 40 Stücke
   (4x10 oder 5x8), frei bleiben 2. 38 (1x38, 2x19) und 39 (1x39, 3x13) sind unmöglich - per Skript (Brute Force) und mit dem Heft abgeglichen. */
(function () {
  'use strict';
  var h = Biber.h;

  var COLS = 15, GRID_ROWS = 9, ROWS = 15;
  var MIN_AREA = 40;
  /* Tafeln: w x h in der Ausgangslage wie im Heft (Breite x Höhe), c = Farbe */
  var DEF = [
    { id: 'lila', w: 5, h: 1, c: '--c5', name: 'Tafel 1 mal 5, lila', x: 0, y: 14 },
    { id: 'gelb', w: 3, h: 2, c: '--c2', name: 'Tafel 2 mal 3, gelb', x: 11, y: 10 },
    { id: 'rosa', w: 4, h: 3, c: '--c1', name: 'Tafel 3 mal 4, rosa', x: 6, y: 10 },
    { id: 'gruen', w: 5, h: 3, c: '--c6', name: 'Tafel 3 mal 5, grün', x: 0, y: 10 }
  ];
  /* Eine richtige Lösung (Box 8 x 5 = 40): oben links im Raster */
  var SOLUTION = [
    { x: 0, y: 0, w: 5, h: 1 },
    { x: 0, y: 1, w: 2, h: 3 },
    { x: 2, y: 1, w: 3, h: 4 },
    { x: 5, y: 0, w: 3, h: 5 }
  ];

  var el, api, locked, mode, P, sel, drag, nodes, fieldEl, infoEl, boxEl, rotBtn;

  function reset() {
    P = DEF.map(function (d) { return { w: d.w, h: d.h, x: d.x, y: d.y }; });
    sel = -1; drag = null; mode = null;
  }
  function inGrid(p) { return p.y + p.h <= GRID_ROWS; }
  function overlaps() {
    var bad = P.map(function () { return false; });
    for (var i = 0; i < P.length; i++) for (var j = i + 1; j < P.length; j++) {
      var a = P[i], b = P[j];
      if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) { bad[i] = true; bad[j] = true; }
    }
    return bad;
  }
  function bbox(list) {
    var x0 = 99, y0 = 99, x1 = -1, y1 = -1;
    list.forEach(function (p) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x + p.w); y1 = Math.max(y1, p.y + p.h); });
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  function state() {
    var allIn = P.every(inGrid);
    var bad = overlaps();
    var anyBad = bad.some(Boolean);
    var box = allIn ? bbox(P) : null;
    return { allIn: allIn, bad: bad, anyBad: anyBad, box: box, ok: allIn && !anyBad };
  }
  function pct(v, of) { return (v / of * 100).toFixed(4) + '%'; }

  function infoText(s) {
    if (!s.allIn) {
      var n = P.filter(inGrid).length;
      return n + ' von 4 Tafeln liegen im Raster. Ziehe alle Tafeln hinein.';
    }
    if (s.anyBad) return 'Die Tafeln dürfen sich nicht überlappen (rot umrandet).';
    var area = s.box.w * s.box.h;
    return 'Kleinste Schachtel für deine Anordnung: ' + s.box.w + ' × ' + s.box.h + ' = ' + area + ' Stücke, frei bleiben ' + (area - 38) + '.';
  }

  function buildPiece(i) {
    var p = P[i], d = DEF[i];
    var cells = [];
    for (var k = 0; k < p.w * p.h; k++) cells.push(h('span', { class: 't-schokolade22-u' }));
    var node = nodes[i];
    node.replaceChildren(h('span', { class: 't-schokolade22-cells', style: 'grid-template-columns:repeat(' + p.w + ',1fr);grid-template-rows:repeat(' + p.h + ',1fr)' }, cells));
    if (p.w >= 2 || p.h >= 2) {
      node.appendChild(h('button', { type: 'button', class: 't-schokolade22-rot', 'data-rot': String(i), tabindex: '-1', 'aria-label': d.name + ' drehen', disabled: locked }, '↻'));
    }
  }

  function layout() {
    var s = state();
    P.forEach(function (p, i) {
      var n = nodes[i];
      n.style.left = pct(p.x, COLS);
      n.style.top = pct(p.y, ROWS);
      n.style.width = pct(p.w, COLS);
      n.style.height = pct(p.h, ROWS);
      n.classList.toggle('sel', i === sel);
      n.classList.toggle('bad', s.bad[i]);
      n.classList.toggle('placed', inGrid(p));
      n.setAttribute('aria-label', DEF[i].name + ', ' + p.w + ' breit und ' + p.h + ' hoch, ' + (inGrid(p) ? 'im Raster bei Spalte ' + (p.x + 1) + ', Zeile ' + (p.y + 1) : 'in der Ablage') + (s.bad[i] ? ', überlappt' : ''));
    });
    if (s.box) {
      boxEl.hidden = false;
      boxEl.style.left = pct(s.box.x, COLS); boxEl.style.top = pct(s.box.y, ROWS);
      boxEl.style.width = pct(s.box.w, COLS); boxEl.style.height = pct(s.box.h, ROWS);
    } else boxEl.hidden = true;
    fieldEl.classList.remove('right', 'wrong');
    if (mode === 'check' || mode === 'solution') fieldEl.classList.add(s.ok && s.box.w * s.box.h === MIN_AREA ? 'right' : 'wrong');
    fieldEl.classList.toggle('locked', !!locked);
    rotBtn.disabled = locked || sel < 0;
    infoEl.textContent = infoText(s);
    return s;
  }

  function changed() {
    var s = layout();
    api.changed(s.ok ? infoText(s) : '');
  }

  function move(i, x, y) {
    var p = P[i];
    x = Math.max(0, Math.min(COLS - p.w, x));
    y = Math.max(0, Math.min(ROWS - p.h, y));
    if (x === p.x && y === p.y) return false;
    p.x = x; p.y = y;
    return true;
  }
  function rotate(i) {
    if (locked || i < 0) return;
    var p = P[i];
    var t = p.w; p.w = p.h; p.h = t;
    p.x = Math.max(0, Math.min(COLS - p.w, p.x));
    p.y = Math.max(0, Math.min(ROWS - p.h, p.y));
    buildPiece(i);
    changed();
  }
  function select(i) { sel = i; layout(); }

  function cellSize() { return fieldEl.getBoundingClientRect().width / COLS; }

  function onPointerDown(e) {
    if (locked || (e.button != null && e.button !== 0)) return;
    var r = e.target.closest('[data-rot]');
    if (r) { e.preventDefault(); sel = +r.getAttribute('data-rot'); rotate(sel); return; }
    var n = e.target.closest('[data-piece]');
    if (!n) { if (sel >= 0) { sel = -1; layout(); } return; }
    var i = +n.getAttribute('data-piece');
    e.preventDefault();
    sel = i;
    drag = { i: i, sx: e.clientX, sy: e.clientY, ox: P[i].x, oy: P[i].y, cs: cellSize(), id: e.pointerId, moved: false };
    n.classList.add('drag');
    try { n.setPointerCapture(e.pointerId); } catch (err) { /* ignorieren */ }
    n.focus({ preventScroll: true });
    layout();
  }
  function onPointerMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var dx = Math.round((e.clientX - drag.sx) / drag.cs);
    var dy = Math.round((e.clientY - drag.sy) / drag.cs);
    if (move(drag.i, drag.ox + dx, drag.oy + dy)) { drag.moved = true; changed(); }
  }
  function onPointerUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    nodes[drag.i].classList.remove('drag');
    drag = null;
    layout();
  }
  function onKey(e) {
    if (locked) return;
    var n = e.target.closest && e.target.closest('[data-piece]');
    if (!n) return;
    var i = +n.getAttribute('data-piece');
    var dx = 0, dy = 0;
    if (e.key === 'ArrowLeft') dx = -1; else if (e.key === 'ArrowRight') dx = 1;
    else if (e.key === 'ArrowUp') dy = -1; else if (e.key === 'ArrowDown') dy = 1;
    else if (e.key === 'r' || e.key === 'R' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); sel = i; rotate(i); return; }
    else return;
    e.preventDefault();
    sel = i;
    if (move(i, P[i].x + dx, P[i].y + dy)) changed(); else layout();
  }

  function gridSvg() {
    var parts = [];
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + COLS + ' ' + ROWS);
    svg.setAttribute('class', 't-schokolade22-bg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var r = document.createElementNS(ns, 'rect');
    r.setAttribute('x', 0); r.setAttribute('y', 0); r.setAttribute('width', COLS); r.setAttribute('height', GRID_ROWS); r.setAttribute('class', 't-schokolade22-gridbg');
    svg.appendChild(r);
    for (var x = 0; x <= COLS; x++) { var l = document.createElementNS(ns, 'line'); l.setAttribute('x1', x); l.setAttribute('x2', x); l.setAttribute('y1', 0); l.setAttribute('y2', GRID_ROWS); l.setAttribute('class', 't-schokolade22-gl'); svg.appendChild(l); }
    for (var y = 0; y <= GRID_ROWS; y++) { var m = document.createElementNS(ns, 'line'); m.setAttribute('y1', y); m.setAttribute('y2', y); m.setAttribute('x1', 0); m.setAttribute('x2', COLS); m.setAttribute('class', 't-schokolade22-gl'); svg.appendChild(m); }
    var t = document.createElementNS(ns, 'text');
    t.setAttribute('x', 0.2); t.setAttribute('y', GRID_ROWS + 0.85); t.setAttribute('class', 't-schokolade22-tray');
    t.textContent = 'Ablage';
    svg.appendChild(t);
    return svg;
  }

  function miniSolution() {
    var b = bbox(SOLUTION);
    var u = 12;
    var cells = '';
    SOLUTION.forEach(function (p, i) {
      var c = DEF[i].c;
      for (var dx = 0; dx < p.w; dx++) for (var dy = 0; dy < p.h; dy++) {
        cells += '<rect x="' + ((p.x - b.x + dx) * u + 1) + '" y="' + ((p.y - b.y + dy) * u + 1) + '" width="' + (u - 2) + '" height="' + (u - 2) + '" rx="2" style="fill:var(' + c + ')"/>';
      }
    });
    return '<svg class="t-schokolade22-mini" viewBox="0 0 ' + (b.w * u) + ' ' + (b.h * u) + '" width="' + (b.w * u * 1.5) + '" height="' + (b.h * u * 1.5) + '" role="img" aria-label="Beispiel: alle vier Tafeln in einer Schachtel aus 8 mal 5 Stücken, zwei Stücke bleiben frei">' + cells + '</svg>';
  }

  Biber.register({
    id: 'schokolade22',
    story: '<p>Jeder Kunde einer Schokoladenfabrik soll als Werbung vier Tafeln Schokolade bekommen. Die Tafeln sind unterschiedlich groß, aber ihre Stücke sind alle quadratisch und gleich groß.</p>' +
      '<p>Die vier Tafeln müssen nebeneinander in eine Schachtel. In der Schachtel soll so wenig Platz frei bleiben wie möglich. Wenn die Tafeln zum Beispiel so gelegt werden, wie unten gezeigt, passen sie in eine Schachtel für 5 × 9 Stücke, mit freiem Platz für 7 Stücke.</p>' +
      '<svg class="t-schokolade22-ex" viewBox="0 0 90 50" width="270" height="150" role="img" aria-label="Beispiel: Die Tafeln 1 mal 5 (senkrecht), 3 mal 5, 3 mal 4 und 2 mal 3 liegen in einem Rechteck aus 9 mal 5 Stücken, 7 Stücke bleiben frei.">' +
      (function () {
        var pl = [[0, 0, 1, 5, 0], [1, 0, 5, 3, 3], [6, 0, 3, 4, 2], [2, 3, 3, 2, 1]];  /* x,y,w,h,Farbe-Index in DEF */
        var out = '<rect x="0" y="0" width="90" height="50" rx="3" style="fill:var(--surface2)"/>';
        pl.forEach(function (q) {
          for (var dx = 0; dx < q[2]; dx++) for (var dy = 0; dy < q[3]; dy++)
            out += '<rect x="' + ((q[0] + dx) * 10 + 1) + '" y="' + ((q[1] + dy) * 10 + 1) + '" width="8" height="8" rx="1.5" style="fill:var(' + DEF[q[4]].c + ')"/>';
        });
        return out;
      })() + '</svg>',
    question: 'Lege die Tafeln so, dass sie in eine Schachtel mit möglichst wenig freiem Platz passen.',
    howto: 'Ziehe die Tafeln in das Raster. Mit dem Dreh-Knopf (↻) oder der Taste R drehst du eine Tafel. Mit der Tastatur wählst du eine Tafel per Tab und verschiebst sie mit den Pfeiltasten. Die gestrichelte Linie zeigt die kleinste Schachtel um deine Tafeln.',
    explanation: function () {
      return '<p>Zusammen haben die Tafeln 5 + 6 + 12 + 15 = <b>38 Stücke</b>. Eine Schachtel ganz ohne freien Platz müsste 1 × 38 oder 2 × 19 groß sein, doch dort passen die breiten Tafeln (3 × 4 und 3 × 5) nicht hinein. ' +
        'Mit 39 Stücken (1 × 39 oder 3 × 13) geht es auch nicht: In 1 × 39 passt nur die 1 × 5-Tafel, und in 3 × 13 bleibt für sie nur ein Platz von 3 × 2 übrig.</p>' +
        '<p>Bei 40 Stücken geht es dagegen: Eine Schachtel von 4 × 10 oder 5 × 8 Stücken reicht, <b>2 Stücke bleiben frei</b>. Besser geht es nicht. Eine mögliche Lösung:</p>' +
        '<p>' + miniSolution() + '</p>' +
        '<p><b>Informatik:</b> Dieses Problem heißt „rectangle packing“ und gehört zu den Verpackungsproblemen. Für wenige Tafeln findet man die beste Lösung durch Probieren und Überlegen. ' +
        'Bei vielen Rechtecken ist es sehr schwer (NP-vollständig); dann nutzt man Algorithmen, die nachweisbar gute, aber nicht immer die beste Lösung finden.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      nodes = DEF.map(function (d, i) {
        var n = h('div', { class: 't-schokolade22-piece', 'data-piece': String(i), tabindex: '0', role: 'group', style: 'z-index:' + (i + 2) });
        n.style.setProperty('--pc', 'var(' + d.c + ')');
        return n;
      });
      fieldEl = h('div', { class: 't-schokolade22-field' });
      boxEl = h('div', { class: 't-schokolade22-box', hidden: true, 'aria-hidden': 'true' });
      infoEl = h('p', { class: 't-schokolade22-info', 'aria-live': 'polite' });
      rotBtn = h('button', { type: 'button', class: 't-schokolade22-tool', disabled: true, onclick: function () { rotate(sel); } }, '↻ Ausgewählte Tafel drehen');
      fieldEl.appendChild(gridSvg());
      fieldEl.appendChild(boxEl);
      nodes.forEach(function (n, i) { fieldEl.appendChild(n); buildPiece(i); });
      el.replaceChildren(h('div', { class: 't-schokolade22' }, fieldEl, h('div', { class: 't-schokolade22-bar' }, rotBtn), infoEl));
      fieldEl.addEventListener('pointerdown', onPointerDown);
      fieldEl.addEventListener('pointermove', onPointerMove);
      fieldEl.addEventListener('pointerup', onPointerUp);
      fieldEl.addEventListener('pointercancel', onPointerUp);
      fieldEl.addEventListener('keydown', onKey);
      fieldEl.addEventListener('click', function (e) {
        var r = e.target.closest('[data-rot]');
        if (r && e.detail === 0 && !locked) { sel = +r.getAttribute('data-rot'); rotate(sel); }
      });
      layout();
    },
    isComplete: function () { return state().ok; },
    evaluate: function () {
      var s = state();
      var ok = s.ok && s.box.w * s.box.h === MIN_AREA;
      return { correct: ok, answer: P.map(function (p) { return { x: p.x, y: p.y, w: p.w, h: p.h }; }) };
    },
    setAnswer: function (ans) {
      if (Array.isArray(ans) && ans.length === DEF.length) {
        P = ans.map(function (p) { return { x: p.x, y: p.y, w: p.w, h: p.h }; });
        nodes.forEach(function (n, i) { buildPiece(i); });
      }
      sel = -1;
      mode = 'check';
      layout();
    },
    lock: function (on) {
      locked = on;
      if (on) { mode = mode || 'check'; sel = -1; drag = null; } else mode = null;
      nodes.forEach(function (n, i) { n.setAttribute('tabindex', on ? '-1' : '0'); buildPiece(i); });
      layout();
    },
    reset: function () {
      reset();
      nodes.forEach(function (n, i) { buildPiece(i); });
      layout();
    },
    showSolution: function () {
      P = SOLUTION.map(function (p) { return { x: p.x, y: p.y, w: p.w, h: p.h }; });
      locked = true; sel = -1;
      mode = 'solution';
      nodes.forEach(function (n, i) { n.setAttribute('tabindex', '-1'); buildPiece(i); });
      layout();
    }
  });
})();
