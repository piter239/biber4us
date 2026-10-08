/* Aufgabe Bienenwaben (Heft 2022, Klasse 3-4 mittel): Algorithmen, Lösungssuche, Heuristik */
(function () {
  'use strict';
  var h = Biber.h, S = Biber.svg;

  /* Waben: Gitter mit Spalte x (0..2) und halben Zeilen y (0..4); Nachbarn: (0,±2), (±1,±1) */
  var COMBS = [
    { x: 1, y: 0, name: 'oben' },
    { x: 0, y: 1, name: 'links oben' },
    { x: 2, y: 1, name: 'rechts oben' },
    { x: 1, y: 2, name: 'Mitte' },
    { x: 0, y: 3, name: 'links unten' },
    { x: 2, y: 3, name: 'rechts unten' },
    { x: 1, y: 4, name: 'unten' }
  ];
  /* Hinweise: Offsets (dx, dy) der hellen Waben relativ zur orangen Wabe (die Wabe der Biene) */
  var BEES = [
    { light: [[-1, -1], [1, -1]], txt: 'Die Wabe hat Nachbarwaben oben links und oben rechts.',
      look: { rx: 17, ry: 24, cy: 62, stripes: [[58, 12]], sc: 1 } },
    { light: [[-1, -1], [-2, -2]], txt: 'Von der Wabe aus führen zwei Waben in einer Reihe nach links oben.',
      look: { rx: 10, ry: 27, cy: 62, tip: true, stripes: [[52, 5], [70, 5]], sc: 1 } },
    { light: [[0, -2], [0, -4]], txt: 'Über der Wabe liegen zwei Waben in einer Reihe.',
      look: { rx: 18, ry: 20, cy: 64, stripes: [[64, 3]], sc: 1 } },
    { light: [[-1, 1], [-2, 2]], txt: 'Von der Wabe aus führen zwei Waben in einer Reihe nach links unten.',
      look: { rx: 12, ry: 26, cy: 62, tip: true, stripes: [[50, 9]], sc: 1 } },
    { light: [[1, -1], [1, -3]], txt: 'Rechts oben liegt eine Wabe und über dieser noch eine.',
      look: { rx: 17, ry: 20, cy: 64, stripes: [[68, 9]], sc: 1.08 } },
    { light: [[1, -1], [1, 1]], txt: 'Die Wabe hat Nachbarwaben rechts oben und rechts unten.',
      look: { rx: 11, ry: 18, cy: 62, stripes: [[56, 2.5], [62, 2.5], [68, 2.5]], sc: 0.85 } },
    { light: [[1, 1], [0, 2]], txt: 'Die Wabe hat Nachbarwaben unten und rechts unten.',
      look: { rx: 11, ry: 26, cy: 62, tip: true, stripes: [[48, 4], [64, 5]], sc: 1 } }
  ];
  var N = 7;

  function combAt(x, y) {
    for (var i = 0; i < COMBS.length; i++) if (COMBS[i].x === x && COMBS[i].y === y) return i;
    return -1;
  }
  /* Wabe c passt zu Biene b, wenn alle hellen Waben des Hinweises (relativ zu c) existieren */
  function fits(b, c) {
    return BEES[b].light.every(function (o) { return combAt(COMBS[c].x + o[0], COMBS[c].y + o[1]) >= 0; });
  }
  function allowed(b) { var r = []; for (var c = 0; c < N; c++) if (fits(b, c)) r.push(c); return r; }

  /* Lösung per Suche (Brute Force); gleichzeitig Selbsttest gegen die offizielle Lösung */
  function matchings() {
    var out = [], cur = [], used = {};
    (function rec(b) {
      if (b === N) { out.push(cur.slice()); return; }
      allowed(b).forEach(function (c) {
        if (used[c]) return;
        used[c] = 1; cur[b] = c; rec(b + 1); used[c] = 0;
      });
    })(0);
    return out;
  }
  var SOLS = matchings();
  var SOLUTION = SOLS[0];
  if (SOLS.length !== 1 || SOLUTION.join() !== '3,5,6,2,4,1,0') throw new Error('bienenwaben22: Lösung stimmt nicht');
  /* Reihenfolge aus dem Heft: Bienen mit nur einer passenden Wabe zuerst (2, 3, 4), dann 1 und 5, dann 6 und 7 */

  /* ---------- Zeichnen ---------- */
  var uid = 0;
  function hexPts(cx, cy, r) {
    var p = [];
    for (var i = 0; i < 6; i++) { var a = Math.PI / 3 * i; p.push((cx + r * Math.cos(a)).toFixed(2) + ',' + (cy + r * Math.sin(a)).toFixed(2)); }
    return p.join(' ');
  }
  var SQ3 = Math.sqrt(3);
  function center(x, y, R) { return { x: R + 1.5 * R * x, y: SQ3 / 2 * R + SQ3 / 2 * R * y }; }

  function beeSvg(b, cls) {
    var l = BEES[b].look, id = 't-bienenwaben22-clip' + (++uid);
    var cx = 50, top = l.cy - l.ry;
    var body;
    if (l.tip) {
      var rx = l.rx, cy = l.cy - l.ry * 0.25, ry = l.ry * 0.75, tipY = l.cy + l.ry;
      body = 'M' + (cx - rx) + ',' + cy + 'A' + rx + ',' + ry + ' 0 0 1 ' + (cx + rx) + ',' + cy +
        'C' + (cx + rx) + ',' + (cy + 14) + ' ' + (cx + rx * 0.35) + ',' + (tipY - 8) + ' ' + cx + ',' + tipY +
        'C' + (cx - rx * 0.35) + ',' + (tipY - 8) + ' ' + (cx - rx) + ',' + (cy + 14) + ' ' + (cx - rx) + ',' + cy + 'Z';
    } else {
      body = 'M' + (cx - l.rx) + ',' + l.cy + 'a' + l.rx + ',' + l.ry + ' 0 1 0 ' + (2 * l.rx) + ',0a' + l.rx + ',' + l.ry + ' 0 1 0 ' + (-2 * l.rx) + ',0Z';
    }
    var stripes = l.stripes.map(function (s) {
      return S('rect', { x: 0, y: s[0] - s[1] / 2, width: 100, height: s[1], class: 't-bienenwaben22-yel' });
    });
    var wy = top + 4;
    var g = S('g', { transform: 'translate(50 50) scale(' + l.sc + ') translate(-50 -50)' },
      S('ellipse', { class: 't-bienenwaben22-wing', cx: 27, cy: wy - 6, rx: 21, ry: 9, transform: 'rotate(-18 27 ' + (wy - 6) + ')' }),
      S('ellipse', { class: 't-bienenwaben22-wing', cx: 73, cy: wy - 6, rx: 21, ry: 9, transform: 'rotate(18 73 ' + (wy - 6) + ')' }),
      S('path', { class: 't-bienenwaben22-leg', d: 'M42,' + (wy + 2) + 'l-9,5M58,' + (wy + 2) + 'l9,5' }),
      S('clipPath', { id: id }, S('path', { d: body })),
      S('path', { class: 't-bienenwaben22-body', d: body }),
      S.apply(null, ['g', { 'clip-path': 'url(#' + id + ')' }].concat(stripes)),
      S('path', { class: 't-bienenwaben22-thorax', d: 'M42,' + (top + 6) + 'Q50,' + (top - 4) + ' 58,' + (top + 6) + 'L56,' + (top + 14) + 'L44,' + (top + 14) + 'Z' }),
      S('circle', { class: 't-bienenwaben22-head', cx: 50, cy: top - 6, r: 7 }),
      S('path', { class: 't-bienenwaben22-ant', d: 'M46,' + (top - 11) + 'q-2,-8 -9,-8M54,' + (top - 11) + 'q2,-8 9,-8' }));
    return S('svg', { class: cls || 't-bienenwaben22-bee', viewBox: '0 0 100 100', 'aria-hidden': 'true', focusable: 'false' }, g);
  }

  function hintSvg(b) {
    var R = 10, o = BEES[b].light, cells = [{ x: 0, y: 0, dark: true }].concat(o.map(function (d) { return { x: d[0], y: d[1], dark: false }; }));
    var W = 5 * R, H = 3 * SQ3 * R;
    var minx = 9, maxx = -9, miny = 99, maxy = -99;
    cells.forEach(function (c) { minx = Math.min(minx, c.x); maxx = Math.max(maxx, c.x); miny = Math.min(miny, c.y); maxy = Math.max(maxy, c.y); });
    var bw = (1.5 * (maxx - minx) + 2) * R, bh = (SQ3 / 2 * (maxy - miny) + SQ3) * R;
    var ox = (W - bw) / 2 + R - 1.5 * R * minx, oy = (H - bh) / 2 + SQ3 / 2 * R - SQ3 / 2 * R * miny;
    var kids = cells.map(function (c) {
      return S('polygon', { class: 't-bienenwaben22-hx ' + (c.dark ? 'dark' : 'light'), points: hexPts(ox + 1.5 * R * c.x, oy + SQ3 / 2 * R * c.y, R - 0.8) });
    });
    return S.apply(null, ['svg', { class: 't-bienenwaben22-hint', viewBox: '0 0 ' + W + ' ' + H.toFixed(1), role: 'img', 'aria-label': 'Hinweis für Biene ' + (b + 1) + ': ' + BEES[b].txt + ' Die orange Wabe ist die Wabe der Biene.' }].concat(kids));
  }

  /* ---------- Zustand ---------- */
  var wired = false;
  var el, api, locked, pos, selected, mode, boardEl, trayEl, combSvg, statusEl, ghost, drag, suppressClick;
  var R = 34, VW = 5 * R + 8, VH = 3 * SQ3 * R + 8;

  function occupant(c) { for (var b = 0; b < N; b++) if (pos[b] === c) return b; return -1; }
  function blank() { pos = []; for (var i = 0; i < N; i++) pos.push(-1); selected = null; }
  function placed() { return pos.filter(function (p) { return p >= 0; }).length; }

  function put(b, c) {            /* Biene b auf Wabe c (c = -1: zurück zum Weg) */
    if (locked) return;
    if (c >= 0) {
      var o = occupant(c), from = pos[b];
      if (o >= 0 && o !== b) pos[o] = from;   /* Tausch bzw. Verdrängen in den Korb */
      pos[b] = c;
    } else pos[b] = -1;
    selected = null;
    render();
    var n = placed();
    api.changed(n === N ? 'Alle sieben Bienen sitzen auf einer Wabe.' : n + ' von ' + N + ' Bienen sind auf Waben.');
  }

  function render() {
    /* Waben */
    var kids = [];
    COMBS.forEach(function (cb, c) {
      var ct = center(cb.x, cb.y, R); ct.x += 4; ct.y += 4;
      var b = occupant(c), cls = 't-bienenwaben22-comb';
      if (mode && b >= 0) cls += (mode === 'solution' || fits(b, c)) ? ' right' : ' wrong';
      var g = S('g', { class: cls, 'data-comb': c, role: 'button', tabindex: locked ? '-1' : '0',
        'aria-label': 'Wabe ' + cb.name + ': ' + (b >= 0 ? 'Biene ' + (b + 1) + (locked ? '' : ', antippen schickt sie zurück') : 'leer') });
      g.appendChild(S('polygon', { class: 't-bienenwaben22-cell', points: hexPts(ct.x, ct.y, R - 2) }));
      if (b >= 0) {
        var bee = beeSvg(b, 't-bienenwaben22-bee');
        bee.setAttribute('x', ct.x - 26); bee.setAttribute('y', ct.y - 26); bee.setAttribute('width', 52); bee.setAttribute('height', 52);
        var gb = S('g', { 'data-bee': b, class: 't-bienenwaben22-inbee' + (selected === b ? ' selected' : '') }, bee);
        g.appendChild(gb);
        if (mode) {
          var ok = mode === 'solution' || fits(b, c);
          g.appendChild(S('circle', { class: 't-bienenwaben22-mark ' + (ok ? 'ok' : 'bad'), cx: ct.x + 20, cy: ct.y - 20, r: 8 }));
          g.appendChild(S('text', { class: 't-bienenwaben22-marktxt', x: ct.x + 20, y: ct.y - 20, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, ok ? '✓' : '✗'));
        }
      }
      kids.push(g);
    });
    combSvg.replaceChildren.apply(combSvg, kids);

    /* Bienenreihe mit Hinweisen */
    var slots = [];
    for (var b = 0; b < N; b++) {
      var inTray = pos[b] < 0;
      var beeEl = inTray
        ? h('button', { type: 'button', class: 't-bienenwaben22-tb' + (selected === b ? ' selected' : ''), 'data-bee': b, disabled: locked,
            'aria-pressed': String(selected === b), 'aria-label': 'Biene ' + (b + 1) + ' (Hinweis: ' + BEES[b].txt + ')' }, beeSvg(b), h('span', { class: 't-bienenwaben22-no', 'aria-hidden': 'true' }, String(b + 1)))
        : h('div', { class: 't-bienenwaben22-gone', 'aria-label': 'Biene ' + (b + 1) + ' sitzt auf der Wabe ' + COMBS[pos[b]].name }, h('span', { 'aria-hidden': 'true' }, String(b + 1)));
      slots.push(h('div', { class: 't-bienenwaben22-slot' }, beeEl, hintSvg(b)));
    }
    trayEl.replaceChildren.apply(trayEl, slots);
    trayEl.classList.toggle('canreturn', selected !== null && pos[selected] >= 0);
  }

  /* ---------- Bedienung: Antippen und Ziehen ---------- */
  function beeOf(t) { var e = t.closest('[data-bee]'); return e ? +e.getAttribute('data-bee') : -1; }

  function onClick(e) {
    if (suppressClick) { suppressClick = false; return; }
    if (locked) return;
    var cb = e.target.closest('[data-comb]');
    if (cb) {
      var c = +cb.getAttribute('data-comb');
      if (selected !== null) return put(selected, c);
      var o = occupant(c);
      if (o >= 0) return put(o, -1);
      return;
    }
    var tb = e.target.closest('.t-bienenwaben22-tb');
    if (tb) {
      var b = +tb.getAttribute('data-bee');
      selected = selected === b ? null : b;
      render();
      var again = el.querySelector('.t-bienenwaben22-tb[data-bee="' + b + '"]'); if (again) again.focus();
    }
  }

  function onKey(e) {
    var g = e.target.closest && e.target.closest('[data-comb]');
    if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); g.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
    if (e.key === 'Escape' && selected !== null) { selected = null; render(); }
  }

  function onDown(e) {
    if (locked || (e.pointerType === 'mouse' && e.button !== 0)) return;
    var t = e.target.closest('.t-bienenwaben22-tb, .t-bienenwaben22-inbee');
    if (!t) return;
    drag = { b: beeOf(t), x: e.clientX, y: e.clientY, on: false, id: e.pointerId };
  }
  function onMove(e) {
    if (!drag) return;
    if (!drag.on) {
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 8) return;
      drag.on = true;
      ghost = h('div', { class: 't-bienenwaben22-ghost', 'aria-hidden': 'true' }, beeSvg(drag.b));
      document.body.appendChild(ghost);
      selected = null;
    }
    e.preventDefault();
    ghost.style.left = e.clientX + 'px';
    ghost.style.top = e.clientY + 'px';
    var t = document.elementFromPoint(e.clientX, e.clientY);
    var over = t && t.closest ? t.closest('[data-comb]') : null;
    Array.prototype.forEach.call(el.querySelectorAll('.over'), function (x) { x.classList.remove('over'); });
    if (over) over.classList.add('over');
  }
  function endDrag(e, cancel) {
    if (!drag) return;
    var d = drag; drag = null;
    if (!d.on) return;
    suppressClick = true;
    setTimeout(function () { suppressClick = false; }, 0);
    if (ghost) { ghost.remove(); ghost = null; }
    Array.prototype.forEach.call(el.querySelectorAll('.over'), function (x) { x.classList.remove('over'); });
    if (cancel) { render(); return; }
    var t = document.elementFromPoint(e.clientX, e.clientY);
    var comb = t && t.closest ? t.closest('[data-comb]') : null;
    if (comb) put(d.b, +comb.getAttribute('data-comb'));
    else if (t && t.closest && t.closest('.t-bienenwaben22-tray')) put(d.b, -1);
    else render();
  }

  Biber.register({
    id: 'bienenwaben22',
    story: '<p>Die Bienen wollen auf die sieben Waben. Unter jeder Biene zeigt ein Hinweis, wann eine Wabe für sie richtig ist.</p>',
    question: 'Ziehe jede Biene auf eine richtige Wabe!',
    howto: 'Ziehe eine Biene auf eine Wabe. Du kannst auch erst die Biene und dann die Wabe antippen. Eine Biene auf einer Wabe tippst du an, um sie zurückzuschicken. Im Hinweis ist die orange Wabe die Wabe der Biene; die hellen Waben müssen genau so daneben liegen.',
    explanation: function () {
      var names = COMBS.map(function (c) { return c.name; });
      return '<p>Schau dir zuerst die Hinweise an und überlege, welche Waben dafür überhaupt in Frage kommen. Für die Bienen 2, 3 und 4 gibt es nur je eine passende Wabe: ' +
        'Biene 2 gehört nach ' + names[SOLUTION[1]] + ', Biene 3 nach ' + names[SOLUTION[2]] + ' und Biene 4 nach ' + names[SOLUTION[3]] + '. ' +
        'Danach bleibt für Biene 1 (' + names[SOLUTION[0]] + ') und Biene 5 (' + names[SOLUTION[4]] + ') nur noch je eine Wabe übrig, und zuletzt für Biene 6 (' + names[SOLUTION[5]] + ') und Biene 7 (' + names[SOLUTION[6]] + ').</p>' +
        '<p>Würdest du die Bienen einfach von links nach rechts setzen, müsstest du oft umziehen: Biene 1 könnte die Wabe unten wählen, die Biene 3 aber braucht.</p>' +
        '<p><b>Informatik:</b> Es gibt über 5000 Möglichkeiten, sieben Bienen auf sieben Waben zu setzen. Die Idee, zuerst die Bienen mit nur einer passenden Wabe zu platzieren, ist eine <b>Heuristik</b>: eine Faustregel, die schneller zum Ziel führt und dabei keine Lösung verbaut.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; mode = null; blank(); drag = null; suppressClick = false;
      combSvg = S('svg', { class: 't-bienenwaben22-comb-svg', viewBox: '0 0 ' + VW + ' ' + VH.toFixed(1), role: 'group', 'aria-label': 'Sieben Waben' });
      trayEl = h('div', { class: 't-bienenwaben22-tray', role: 'group', 'aria-label': 'Bienen mit Hinweisen' });
      statusEl = h('p', { class: 't-bienenwaben22-status', role: 'status', 'aria-live': 'polite' });
      boardEl = h('div', { class: 't-bienenwaben22-board' }, combSvg, trayEl);
      el.replaceChildren(h('div', { class: 't-bienenwaben22-root' }, boardEl, statusEl));
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKey);
      el.addEventListener('pointerdown', onDown);
      if (!wired) {
        wired = true;
        window.addEventListener('pointermove', onMove, { passive: false });
        window.addEventListener('pointerup', function (e) { endDrag(e, false); });
        window.addEventListener('pointercancel', function (e) { endDrag(e, true); });
      }
      render();
    },
    isComplete: function () { return placed() === N; },
    evaluate: function () {
      var ok = pos.every(function (c, b) { return c >= 0 && fits(b, c); });
      return { correct: ok, answer: pos.slice() };
    },
    setAnswer: function (ans) {
      pos = ans.slice(); selected = null;
      mode = 'check';
      render();
    },
    lock: function (on) {
      locked = on; selected = null;
      mode = on ? (mode === 'solution' ? 'solution' : 'check') : null;
      render();
    },
    reset: function () { blank(); mode = null; render(); },
    showSolution: function () {
      pos = SOLUTION.slice(); selected = null; locked = true; mode = 'solution'; render();
    }
  });
})();
