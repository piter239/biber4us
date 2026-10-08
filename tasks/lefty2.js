/* Aufgabe Lefty 2 (Klasse 5-6, schwer): Roboter mit nur zwei Befehlen */
(function () {
  'use strict';
  var h = Biber.h;

  /* ---------- Aufgabendaten (Zeile r von oben, Spalte c von links) ---------- */
  var N = 5, U = 40;                 /* 5 x 5 Felder, 40 Einheiten je Feld im SVG */
  var START = [4, 1], GOAL = [4, 3];
  var HW = [[2, 2], [3, 4]];                       /* Mauer an der Oberkante des Feldes (r, c) */
  var VW = [[0, 2], [2, 3], [3, 2], [4, 3]];               /* Mauer an der linken Kante des Feldes (r, c) */
  var ONLY_SHORTEST = true;          /* wie im Heft: nur der kürzeste Weg ist richtig */

  var DIRS = [[-1, 0], [0, 1], [1, 0], [0, -1]];           /* oben, rechts, unten, links */
  var wallSet = {};
  HW.forEach(function (w) { wallSet['h' + w[0] + ',' + w[1]] = true; });
  VW.forEach(function (w) { wallSet['v' + w[0] + ',' + w[1]] = true; });

  function isWall(r, c, d) {
    if (d === 0) return !!wallSet['h' + r + ',' + c];
    if (d === 2) return !!wallSet['h' + (r + 1) + ',' + c];
    if (d === 3) return !!wallSet['v' + r + ',' + c];
    return !!wallSet['v' + r + ',' + (c + 1)];
  }
  function step(r, c, d) {          /* Zielfeld oder null, wenn Rand oder Mauer im Weg ist */
    var nr = r + DIRS[d][0], nc = c + DIRS[d][1];
    if (nr < 0 || nc < 0 || nr >= N || nc >= N || isWall(r, c, d)) return null;
    return [nr, nc];
  }
  function idx(r, c) { return r * N + c; }

  /* Alle Fahrten Start -> Ziel durchsuchen (Zustand = Feld + Blickrichtung, jeder nur einmal). Lefty startet nach oben. */
  var SETS = (function () {
    var found = {};
    function dfs(r, c, d, seen, path, moves) {
      if (r === GOAL[0] && c === GOAL[1]) {
        var cells = [];
        path.forEach(function (p) { var i = idx(p[0], p[1]); if (i !== idx(START[0], START[1]) && i !== idx(GOAL[0], GOAL[1]) && cells.indexOf(i) < 0) cells.push(i); });
        cells.sort(function (a, b) { return a - b; });
        var key = cells.join(',');
        if (!found[key] || found[key].moves.length > moves.length) found[key] = { cells: cells, path: path.slice(), moves: moves };
        return;
      }
      ['F', 'L'].forEach(function (m) {
        var nd = m === 'L' ? (d + 3) % 4 : d;
        var p = step(r, c, nd);
        if (!p) return;
        var k = p[0] + ',' + p[1] + ',' + nd;
        if (seen[k]) return;
        seen[k] = true; path.push(p);
        dfs(p[0], p[1], nd, seen, path, moves + m);
        path.pop(); delete seen[k];
      });
    }
    var s0 = {}; s0[START[0] + ',' + START[1] + ',0'] = true;
    dfs(START[0], START[1], 0, s0, [START.slice()], '');
    var all = Object.keys(found).map(function (k) { return found[k]; });
    all.sort(function (a, b) { return a.cells.length - b.cells.length || a.moves.length - b.moves.length; });
    if (ONLY_SHORTEST) all = all.filter(function (s) { return s.cells.length === all[0].cells.length; });
    return all;
  })();
  var BEST = SETS[0];

  function sameSet(a, b) {
    return a.length === b.length && a.every(function (v, i) { return v === b[i]; });
  }
  function diff(a, b) {
    return a.filter(function (v) { return b.indexOf(v) < 0; }).length + b.filter(function (v) { return a.indexOf(v) < 0; }).length;
  }
  function nearest(sel) {
    var best = SETS[0], bd = 1e9;
    SETS.forEach(function (s) { var d = diff(sel, s.cells); if (d < bd) { bd = d; best = s; } });
    return best;
  }

  /* ---------- SVG-Bausteine (Text) ---------- */
  function robot(x, y, rot) {
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')"><circle r="16" class="lf2-rb"/><path d="M0 -11 L9 10 L0 5 L-9 10 Z" class="lf2-ra"/></g>';
  }
  function head(x, y, rot) {
    return '<path d="M0 0 L-10 -6.5 L-10 6.5 Z" transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')" class="lf2-ah"/>';
  }
  function rect(c, r, cls, x0) { return '<rect x="' + ((x0 || 6) + c * U) + '" y="' + (6 + r * U) + '" width="' + U + '" height="' + U + '" class="' + cls + '"/>'; }
  function ban(x, y) {
    return '<g transform="translate(' + x + ' ' + y + ')" class="lf2-ban"><circle r="12"/><path d="M-8.5 -8.5 L8.5 8.5"/></g>';
  }
  function grid(cols, rows, special) {
    var s = '';
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) s += rect(c, r, special[r + ',' + c] || 'lf2-g');
    return s;
  }
  function svg(w, hgt, inner, label, top) {
    var t = top || 0, k = 1.5;       /* top: zusätzlicher Rand oben (für den Drehpfeil) */
    return '<svg class="lf2-fig" viewBox="0 ' + (-t) + ' ' + w + ' ' + (hgt + t) + '" width="' + Math.round(w * k) + '" height="' + Math.round((hgt + t) * k) +
      '" role="img" aria-label="' + label + '" focusable="false">' + inner + '</svg>';
  }
  function dash(d) { return '<path d="' + d + '" class="lf2-dash"/>'; }

  function figForward() {
    return svg(52, 92, grid(1, 2, { '0,0': 'lf2-y', '1,0': 'lf2-b' }) + robot(26, 66, 0) + dash('M26 48 L26 26') + head(26, 14, -90),
      'Lefty steht auf einem blauen Feld und fährt ein Feld nach oben auf das gelbe Feld.');
  }
  function figLeft() {
    return svg(92, 52, grid(2, 1, { '0,0': 'lf2-y', '0,1': 'lf2-b' }) + robot(66, 26, 0) + dash('M50 26 L30 26') + head(14, 26, 180) +
      '<path d="M80 6 Q66 -12 48 1" class="lf2-dash"/>' + head(44, 3, 145),
      'Lefty dreht sich nach links und fährt sofort ein Feld nach links auf das gelbe Feld.', 10);
  }
  function figNoRight() {
    return svg(132, 172, grid(3, 4, { '1,1': 'lf2-y', '1,2': 'lf2-y', '2,1': 'lf2-y', '3,1': 'lf2-b' }) + robot(66, 146, 0) +
      dash('M66 128 L66 72') + dash('M66 66 L96 66') + head(114, 66, 0) + ban(66, 66),
      'Lefty fährt zwei Felder nach oben. Dort nach rechts abzubiegen ist verboten.');
  }
  function figNoWall() {
    return svg(172, 132, grid(4, 3, { '1,0': 'lf2-b', '1,1': 'lf2-y', '1,2': 'lf2-y' }) + robot(26, 66, 90) +
      dash('M46 66 L96 66') + head(118, 66, 0) +
      '<path d="M86 46 L86 86" class="lf2-w lf2-fw"/>' + ban(86, 66),
      'Lefty schaut nach rechts. Vor ihm ist eine rote Mauer. Durch sie hindurch zu fahren ist verboten.');
  }
  function iconRobot() {
    return '<svg class="lf2-ic" viewBox="0 0 32 32" width="26" height="26" role="img" aria-label="Roboter Lefty" focusable="false"><rect x="1" y="1" width="30" height="30" rx="2" class="lf2-b"/>' + robot(16, 16, 0) + '</svg>';
  }
  function iconWall() {
    return '<svg class="lf2-ic lf2-icw" viewBox="0 0 56 16" width="52" height="16" role="img" aria-label="rote Mauer" focusable="false"><path d="M4 8 H52" class="lf2-w lf2-fw"/><path d="M4 2 V14 M52 2 V14" class="lf2-line"/></svg>';
  }
  function iconGoal() {
    return '<svg class="lf2-ic" viewBox="0 0 32 32" width="26" height="26" role="img" aria-label="grünes Ziel" focusable="false"><rect x="1" y="1" width="30" height="30" rx="2" class="lf2-goal"/><circle cx="16" cy="16" r="11" class="lf2-ring"/></svg>';
  }
  function fig(svgHtml, cap) {
    return '<figure class="lf2-figure"><figcaption>' + cap + '</figcaption>' + svgHtml + '</figure>';
  }

  /* Überlagerung des Spielfelds: Mauern, Lefty, Ziel und (bei der Lösung) die Fahrtroute */
  function overlay(route) {
    var s = '';
    HW.forEach(function (w) { s += '<path d="M' + (w[1] * U) + ' ' + (w[0] * U) + ' H' + ((w[1] + 1) * U) + '" class="lf2-w"/>'; });
    VW.forEach(function (w) { s += '<path d="M' + (w[1] * U) + ' ' + (w[0] * U) + ' V' + ((w[0] + 1) * U) + '" class="lf2-w"/>'; });
    if (route) {
      var pts = route.map(function (p) { return (p[1] * U + U / 2) + ',' + (p[0] * U + U / 2); }).join(' ');
      s += '<polyline points="' + pts + '" class="lf2-route"/>';
      for (var i = 1; i < route.length; i++) {
        var a = route[i - 1], b = route[i];
        var mx = (a[1] + b[1]) * U / 2 + U / 2, my = (a[0] + b[0]) * U / 2 + U / 2;
        var rot = Math.atan2(b[0] - a[0], b[1] - a[1]) * 180 / Math.PI;
        s += '<path d="M0 0 L-8 -5.5 L-8 5.5 Z" transform="translate(' + (mx + 4 * Math.cos(rot * Math.PI / 180)) + ' ' + (my + 4 * Math.sin(rot * Math.PI / 180)) + ') rotate(' + rot + ')" class="lf2-ah"/>';
      }
    }
    s += robot(START[1] * U + U / 2, START[0] * U + U / 2, 0);
    s += '<circle cx="' + (GOAL[1] * U + U / 2) + '" cy="' + (GOAL[0] * U + U / 2) + '" r="15" class="lf2-ring"/>';
    return '<svg viewBox="0 0 ' + N * U + ' ' + N * U + '" aria-hidden="true" focusable="false">' + s + '</svg>';
  }

  /* ---------- Zustand und Anzeige ---------- */
  var el, api, board, ov, cells;
  var sel, locked, showRoute;

  function sideNames(r, c) {
    var n = [];
    [['oben', 0], ['rechts', 1], ['unten', 2], ['links', 3]].forEach(function (s) { if (isWall(r, c, s[1])) n.push(s[0]); });
    return n.length ? ', Mauer ' + n.join(' und ') : '';
  }
  function marks() {
    var m = {};
    if (!locked) return m;
    var ref = SETS.filter(function (s) { return sameSet(s.cells, sel); })[0] || nearest(sel);
    sel.forEach(function (i) { m[i] = ref.cells.indexOf(i) >= 0 ? 'right' : 'wrong'; });
    ref.cells.forEach(function (i) { if (sel.indexOf(i) < 0) m[i] = 'missing'; });
    return m;
  }
  function render() {
    var m = marks();
    cells.forEach(function (b, i) {
      if (!b || b.tagName !== 'BUTTON') return;
      var on = sel.indexOf(i) >= 0, r = Math.floor(i / N), c = i % N, k = m[i];
      b.className = 'lf2-cell' + (on ? ' on' : '') + (k ? ' ' + k : '');
      b.setAttribute('aria-pressed', String(on));
      b.disabled = !!locked;
      b.setAttribute('aria-label', 'Zeile ' + (r + 1) + ', Spalte ' + (c + 1) + sideNames(r, c) + ': ' + (on ? 'ausgewählt' : 'nicht ausgewählt') +
        (k === 'right' ? ', richtig' : k === 'wrong' ? ', falsch' : k === 'missing' ? ', hier hätte Lefty fahren müssen' : ''));
    });
    ov.innerHTML = overlay(showRoute ? BEST.path : null);
  }
  function toggle(i) {
    if (locked) return;
    var p = sel.indexOf(i);
    if (p >= 0) sel.splice(p, 1); else sel.push(i);
    sel.sort(function (a, b) { return a - b; });
    render();
    api.changed(sel.length ? sel.length + (sel.length === 1 ? ' Feld' : ' Felder') + ' ausgewählt' : '');
  }
  function onKey(e) {
    var d = { ArrowUp: [-1, 0], ArrowRight: [0, 1], ArrowDown: [1, 0], ArrowLeft: [0, -1] }[e.key];
    var t = e.target.closest && e.target.closest('.lf2-cell');
    if (!d || !t || t.dataset.i == null) return;
    var i = +t.dataset.i, r = Math.floor(i / N) + d[0], c = (i % N) + d[1];
    while (r >= 0 && c >= 0 && r < N && c < N) {
      var b = cells[idx(r, c)];
      if (b && b.tagName === 'BUTTON' && !b.disabled) { b.focus(); e.preventDefault(); return; }
      r += d[0]; c += d[1];
    }
  }

  var STORY =
    '<p>Roboter Lefty ' + iconRobot() + ' bewegt sich über ein Raster mit quadratischen Feldern. Zwischen Feldern kann es rote Mauern ' + iconWall() +
    ' geben. Lefty soll das grüne Ziel ' + iconGoal() + ' erreichen.</p>' +
    '<p>Lefty kann sich auf genau zwei Arten bewegen:</p>' +
    '<div class="lf2-legend">' + fig(figForward(), 'Ein Feld vorwärts fahren') + fig(figLeft(), 'Nach links drehen und dann sofort ein Feld vorwärts fahren') + '</div>' +
    '<p>Lefty kann aber nicht alles. Zum Beispiel kann er …</p>' +
    '<div class="lf2-legend">' + fig(figNoRight(), '<b>… nicht</b> einfach rechts abbiegen und …') + fig(figNoWall(), '<b>… nicht</b> durch Mauern fahren.') + '</div>';

  Biber.register({
    id: 'lefty2',
    story: STORY,
    question: 'Über welche Felder muss Lefty fahren, um das Ziel zu erreichen?',
    howto: 'Tippe die Felder an, über die Lefty fährt (Start und Ziel zählen nicht dazu). Noch einmal tippen nimmt ein Feld wieder weg. Lefty startet mit Blick nach oben.',
    explanation: function () {
      return '<p>Lefty schaut am Start nach oben. Direkt nach rechts zum Ziel geht es nicht: Lefty kann nicht rechts abbiegen und vor dem Ziel steht außerdem eine Mauer. Also fährt Lefty vier Felder nach oben. Ganz oben müsste er rechts abbiegen, doch das kann er nicht. ' +
        'Er hilft sich mit <strong>drei Linkskurven hintereinander</strong>: Das ergibt zusammen eine Rechtskurve. Dabei fährt er ein Feld zweimal. So geht es nach rechts bis zum Rand.</p>' +
        '<p>Am rechten Rand macht Lefty wieder drei Linkskurven und fährt dann geradeaus nach unten ins Ziel. Das ist der kürzeste Weg mit ' + BEST.moves.length + ' Schritten. Weil Lefty nur links abbiegen kann, braucht jede Rechtskurve drei Befehle.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; sel = []; locked = false; showRoute = false;
      cells = [];
      var gridEl = h('div', { class: 'lf2-grid', role: 'group', 'aria-label': 'Raster mit 5 mal 5 Feldern', onkeydown: onKey });
      for (var i = 0; i < N * N; i++) {
        var r = Math.floor(i / N), c = i % N, b;
        if (r === START[0] && c === START[1]) b = h('div', { class: 'lf2-cell lf2-start', role: 'img', 'aria-label': 'Zeile ' + (r + 1) + ', Spalte ' + (c + 1) + ': Start, Lefty schaut nach oben' + sideNames(r, c) });
        else if (r === GOAL[0] && c === GOAL[1]) b = h('div', { class: 'lf2-cell lf2-goal', role: 'img', 'aria-label': 'Zeile ' + (r + 1) + ', Spalte ' + (c + 1) + ': Ziel' + sideNames(r, c) });
        else b = h('button', { type: 'button', class: 'lf2-cell', 'data-i': String(i), onclick: (function (k) { return function () { toggle(k); }; })(i) });
        cells.push(b);
        gridEl.appendChild(b);
      }
      ov = h('div', { class: 'lf2-ov' });
      board = h('div', { class: 'lf2-board' }, gridEl, ov);
      el.replaceChildren(board);
      render();
    },
    isComplete: function () { return sel.length > 0; },
    evaluate: function () {
      return { correct: SETS.some(function (s) { return sameSet(s.cells, sel); }), answer: sel.slice() };
    },
    setAnswer: function (ans) {
      sel = (ans || []).slice().sort(function (a, b) { return a - b; });
      showRoute = false;
      render();
    },
    lock: function (on) { locked = on; render(); },
    reset: function () { sel = []; locked = false; showRoute = false; render(); },
    showSolution: function () { sel = BEST.cells.slice(); showRoute = true; locked = true; render(); }
  });
})();
