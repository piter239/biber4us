/* Aufgabe Zauberschule (Heft 2022, S. 65; Klasse 9-10 schwer, 11-13 mittel): kürzester Weg über zwei Stockwerke, Auswahl 6 / 16 / 18 / 20 */
(function () {
  'use strict';
  var h = Biber.h, svg = Biber.svg;

  var N = 6, U = 44, M = 10, W = N * U + 2 * M;
  var STAIR = 5;
  var START = [0, 1, 1], GOAL = [0, 4, 4];     /* [Stockwerk, Zeile, Spalte] (von 0), A und B stehen im ersten Stockwerk */
  var OPTS = [['A', 6], ['B', 16], ['C', 18], ['D', 20]];
  var CORRECT = 18;                             /* offizielle Lösung (Heft S. 66) */

  /* Wände nach der Abbildung im Heft. H: Wand an der Oberkante des Feldes (Zeile, Spalte), V: Wand an der linken Kante.
     Kontrolle: Die damit berechneten kürzesten Zeiten stimmen in allen 72 Feldern mit der Tabelle im Heft (S. 66) überein. */
  var H = [
    { '1,1': 1, '1,4': 1, '2,0': 1, '2,3': 1, '3,1': 1, '3,2': 1, '3,3': 1, '3,4': 1, '4,0': 1, '4,1': 1, '4,4': 1, '5,1': 1, '5,2': 1, '5,3': 1, '5,4': 1 },
    { '2,1': 1, '2,5': 1, '3,0': 1, '3,1': 1, '3,3': 1, '4,1': 1, '4,2': 1, '4,3': 1, '4,4': 1, '5,4': 1 }
  ];
  var V = [
    { '1,2': 1, '2,2': 1, '0,3': 1, '1,3': 1, '3,3': 1, '4,3': 1, '1,5': 1, '2,5': 1, '4,5': 1 },
    { '0,4': 1, '2,4': 1, '1,2': 1, '4,2': 1, '1,3': 1, '2,3': 1, '3,3': 1, '5,1': 1, '5,3': 1, '5,5': 1 }
  ];
  var DIRS = [[-1, 0, 'oben'], [0, 1, 'rechts'], [1, 0, 'unten'], [0, -1, 'links']];

  function wall(f, r, c, d) {                   /* Wand zwischen (r,c) und dem Nachbarn in Richtung d, oder Rand */
    var nr = r + DIRS[d][0], nc = c + DIRS[d][1];
    if (nr < 0 || nc < 0 || nr >= N || nc >= N) return true;
    if (d === 0) return !!H[f][r + ',' + c];
    if (d === 2) return !!H[f][nr + ',' + c];
    if (d === 3) return !!V[f][r + ',' + c];
    return !!V[f][r + ',' + nc];
  }
  function key(s) { return s[0] + ',' + s[1] + ',' + s[2]; }

  /* Dijkstra von A aus (kleines Feld, einfache Suche nach dem Minimum genügt) */
  var SOL = (function () {
    var dist = {}, prev = {}, done = {}, all = [];
    for (var f = 0; f < 2; f++) for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) { all.push([f, r, c]); dist[key([f, r, c])] = 1e9; }
    dist[key(START)] = 0;
    for (;;) {
      var best = null;
      all.forEach(function (s) { var k = key(s); if (!done[k] && dist[k] < 1e9 && (!best || dist[k] < dist[key(best)])) best = s; });
      if (!best) break;
      done[key(best)] = true;
      var nbs = [];
      for (var d = 0; d < 4; d++) if (!wall(best[0], best[1], best[2], d)) nbs.push([[best[0], best[1] + DIRS[d][0], best[2] + DIRS[d][1]], 1]);
      nbs.push([[1 - best[0], best[1], best[2]], STAIR]);
      nbs.forEach(function (nb) {
        var k = key(nb[0]), nd = dist[key(best)] + nb[1];
        if (nd < dist[k]) { dist[k] = nd; prev[k] = best; }
      });
    }
    var path = [], s = GOAL;
    while (s) { path.unshift(s); s = prev[key(s)]; }
    return { dist: dist, path: path, best: dist[key(GOAL)] };
  })();

  var el, api, locked, choice, mark;
  var cur, time, trail, boards, dyn, info, dpad, msgTimer;

  function resetWalk() { cur = START.slice(); time = 0; trail = [{ s: START.slice(), t: 0 }]; }

  /* ---------- Zeichnen ---------- */
  function X(c) { return M + c * U; }
  function Y(r) { return M + r * U; }

  function board(f, o) {
    o = o || {};
    var s = svg('svg', { viewBox: '0 0 ' + W + ' ' + W, class: 't-zs22-svg', role: 'img', 'aria-label': o.label || ('Stockwerk ' + (f + 1)) });
    s.appendChild(svg('rect', { x: 0, y: 0, width: W, height: W, rx: 10, class: 't-zs22-paper' }));
    for (var i = 0; i <= N; i++) {
      s.appendChild(svg('line', { x1: X(i), y1: Y(0), x2: X(i), y2: Y(N), class: 't-zs22-grid' }));
      s.appendChild(svg('line', { x1: X(0), y1: Y(i), x2: X(N), y2: Y(i), class: 't-zs22-grid' }));
    }
    if (f === 0) {
      [[START, 'A', 't-zs22-a'], [GOAL, 'B', 't-zs22-b']].forEach(function (m) {
        s.appendChild(svg('rect', { x: X(m[0][2]) + 1, y: Y(m[0][1]) + 1, width: U - 2, height: U - 2, class: m[2] }));
      });
    }
    var layer = svg('g', { class: 't-zs22-dyn' });
    s.appendChild(layer);
    var walls = svg('g', { class: 't-zs22-walls' });
    walls.appendChild(svg('rect', { x: X(0), y: Y(0), width: N * U, height: N * U, class: 't-zs22-outer' }));
    Object.keys(H[f]).forEach(function (k) {
      var p = k.split(',').map(Number);
      walls.appendChild(svg('line', { x1: X(p[1]), y1: Y(p[0]), x2: X(p[1] + 1), y2: Y(p[0]), class: 't-zs22-wall' }));
    });
    Object.keys(V[f]).forEach(function (k) {
      var p = k.split(',').map(Number);
      walls.appendChild(svg('line', { x1: X(p[1]), y1: Y(p[0]), x2: X(p[1]), y2: Y(p[0] + 1), class: 't-zs22-wall' }));
    });
    s.appendChild(walls);
    if (f === 0) {
      s.appendChild(svg('text', { x: X(START[2]) + 4, y: Y(START[1]) + 3, class: 't-zs22-mark', 'dominant-baseline': 'hanging' }, 'A'));
      s.appendChild(svg('text', { x: X(GOAL[2]) + 4, y: Y(GOAL[1]) + 3, class: 't-zs22-mark', 'dominant-baseline': 'hanging' }, 'B'));
    }
    if (o.dist) {
      for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) {
        var v = o.dist[key([f, r, c])];
        s.appendChild(svg('text', { x: X(c) + U / 2, y: Y(r) + U / 2 + 1, class: 't-zs22-num' + (f === 0 && r === GOAL[1] && c === GOAL[2] ? ' goal' : ''), 'text-anchor': 'middle', 'dominant-baseline': 'central' }, String(v)));
      }
    }
    if (o.interactive) {
      var hit = svg('g', { class: 't-zs22-hits', 'aria-hidden': 'true' });
      for (r = 0; r < N; r++) for (c = 0; c < N; c++) {
        hit.appendChild(svg('rect', { x: X(c), y: Y(r), width: U, height: U, class: 't-zs22-hit', 'data-f': f, 'data-r': r, 'data-c': c }));
      }
      s.appendChild(hit);
    }
    return { svg: s, layer: layer };
  }

  function drawDyn() {
    for (var f = 0; f < 2; f++) {
      var L = dyn[f], nodes = [];
      /* Weg als Linienzüge je Stockwerk, Stockwerkwechsel als Ringe */
      for (var i = 1; i < trail.length; i++) {
        var a = trail[i - 1].s, b = trail[i].s;
        if (a[0] === f && b[0] === f) nodes.push(svg('line', { x1: X(a[2]) + U / 2, y1: Y(a[1]) + U / 2, x2: X(b[2]) + U / 2, y2: Y(b[1]) + U / 2, class: 't-zs22-path' }));
        else if (a[0] !== b[0]) nodes.push(svg('circle', { cx: X(b[2]) + U / 2, cy: Y(b[1]) + U / 2, r: 15, class: 't-zs22-stair' }));
      }
      if (cur[0] === f) {
        nodes.push(svg('circle', { cx: X(cur[2]) + U / 2, cy: Y(cur[1]) + U / 2, r: 13, class: 't-zs22-ron' }));
        nodes.push(svg('text', { x: X(cur[2]) + U / 2, y: Y(cur[1]) + U / 2 + 1, class: 't-zs22-rt', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, 'R'));
      } else {
        nodes.push(svg('circle', { cx: X(cur[2]) + U / 2, cy: Y(cur[1]) + U / 2, r: 13, class: 't-zs22-ghost' }));
      }
      L.replaceChildren.apply(L, nodes);
    }
    var atB = key(cur) === key(GOAL);
    info.className = 't-zs22-info' + (atB ? ' goal' : '');
    info.textContent = atB
      ? 'Ron ist bei B angekommen: ' + time + ' Sekunden. Geht es auch schneller?'
      : 'Ron ist unterwegs. Zeit bisher: ' + time + ' Sekunden.';
    dpad.forEach(function (b) {
      var can = b.d === 'st' ? true : !wall(cur[0], cur[1], cur[2], b.d);
      b.btn.disabled = !!locked || !can;
    });
  }

  function flash(t) {
    clearTimeout(msgTimer);
    info.textContent = t;
    msgTimer = setTimeout(function () { if (el && el.isConnected) drawDyn(); }, 1800);
  }

  function go(d) {
    if (locked) return false;
    if (d === 'st') { cur = [1 - cur[0], cur[1], cur[2]]; time += STAIR; }
    else {
      if (wall(cur[0], cur[1], cur[2], d)) { flash('Dort ist eine Wand.'); return false; }
      cur = [cur[0], cur[1] + DIRS[d][0], cur[2] + DIRS[d][1]]; time += 1;
    }
    trail.push({ s: cur.slice(), t: time });
    drawDyn();
    return true;
  }
  function undo() {
    if (locked || trail.length < 2) return;
    var last = trail.pop(), prev = trail[trail.length - 1];
    time -= last.t - prev.t;
    cur = prev.s.slice();
    drawDyn();
  }
  function onHit(e) {
    var t = e.target.closest('.t-zs22-hit');
    if (!t || locked) return;
    var f = +t.getAttribute('data-f'), r = +t.getAttribute('data-r'), c = +t.getAttribute('data-c');
    if (f !== cur[0]) { if (r === cur[1] && c === cur[2]) go('st'); else flash('Zwischen den Stockwerken kann Ron nur auf das gleiche Feld wechseln.'); return; }
    for (var d = 0; d < 4; d++) {
      if (cur[1] + DIRS[d][0] === r && cur[2] + DIRS[d][1] === c) { go(d); return; }
    }
    if (r === cur[1] && c === cur[2]) return;
    flash('Ron geht immer nur ein Feld weiter.');
  }
  function onKey(e) {
    if (e.target !== e.currentTarget || e.altKey || e.ctrlKey || e.metaKey) return;
    var map = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 };
    if (e.key in map) { e.preventDefault(); go(map[e.key]); }
    else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); go('st'); }
    else if (e.key === 'Backspace') { e.preventDefault(); undo(); }
  }

  function refreshOpts() {
    optBtns.forEach(function (o) {
      var on = choice === o.v, cls = 't-zs22-opt' + (on ? ' on' : ''), badge = '';
      if (mark === 'check' && on) { cls += o.v === CORRECT ? ' right' : ' wrong'; badge = o.v === CORRECT ? '✓' : '✗'; }
      else if (mark === 'solution' && o.v === CORRECT) { cls += ' right'; badge = '✓'; }
      o.btn.className = cls;
      o.btn.setAttribute('aria-pressed', String(on));
      o.btn.disabled = !!locked;
      o.mark.textContent = badge;
    });
  }
  var optBtns;

  function build() {
    el.replaceChildren();
    resetWalk();
    var b0 = board(0, { interactive: true, label: 'Erstes Stockwerk mit den Feldern A und B' });
    var b1 = board(1, { interactive: true, label: 'Zweites Stockwerk' });
    boards = [b0, b1];
    dyn = [b0.layer, b1.layer];
    info = h('p', { class: 't-zs22-info', 'aria-live': 'polite' });

    var wrap = h('div', { class: 't-zs22-boards', tabindex: '0', 'aria-label': 'Karte der Zauberschule. Mit den Pfeiltasten gehst du ein Feld weiter, mit der Leertaste wechselst du das Stockwerk, mit der Rücktaste gehst du einen Schritt zurück.', onkeydown: onKey, onclick: onHit },
      h('figure', { class: 't-zs22-fl' }, h('figcaption', null, 'Erstes Stockwerk'), b0.svg),
      h('figure', { class: 't-zs22-fl' }, h('figcaption', null, 'Zweites Stockwerk'), b1.svg));

    function db(label, d, aria, cls) {
      var btn = h('button', { type: 'button', class: 't-zs22-d ' + (cls || ''), 'aria-label': aria, onclick: function () { go(d); } }, label);
      dpad.push({ d: d, btn: btn });
      return btn;
    }
    dpad = [];
    var pad = h('div', { class: 't-zs22-pad', role: 'group', 'aria-label': 'Ron steuern' },
      db('↑', 0, 'Ron geht ein Feld nach oben', 'u'), db('←', 3, 'Ron geht ein Feld nach links', 'l'),
      db('↓', 2, 'Ron geht ein Feld nach unten', 'dn'), db('→', 1, 'Ron geht ein Feld nach rechts', 'r'),
      db('⇅ Stockwerk wechseln', 'st', 'Ron wechselt das Stockwerk, das dauert 5 Sekunden', 'st'));
    var tools = h('div', { class: 't-zs22-tools' }, pad, info,
      h('div', { class: 't-zs22-row' },
        h('button', { type: 'button', class: 'btn ghost', onclick: undo }, '↶ Schritt zurück'),
        h('button', { type: 'button', class: 'btn ghost', onclick: function () { if (locked) return; resetWalk(); drawDyn(); } }, 'Zurück zu A')));

    optBtns = OPTS.map(function (o) {
      var mk = h('span', { class: 't-zs22-mk', 'aria-hidden': 'true' });
      var btn = h('button', {
        type: 'button', class: 't-zs22-opt', 'aria-pressed': 'false', 'aria-label': 'Antwort ' + o[0] + ': ' + o[1] + ' Sekunden',
        onclick: function () { if (locked) return; choice = o[1]; refreshOpts(); api.changed(); }
      }, h('b', null, o[0]), h('span', null, o[1] + ' Sekunden'), mk);
      return { v: o[1], btn: btn, mark: mk };
    });
    el.appendChild(h('div', { class: 't-zs22-play' },
      h('h3', null, 'Ron durch die Schule führen (zum Ausprobieren)'), wrap, tools));
    el.appendChild(h('div', { class: 't-zs22-opts', role: 'group', 'aria-label': 'Antworten' }, optBtns.map(function (o) { return o.btn; })));
    drawDyn();
    refreshOpts();
  }

  function explanation() {
    var f0 = board(0, { dist: SOL.dist, label: 'Kürzeste Zeiten von A aus, erstes Stockwerk' }).svg.outerHTML;
    var f1 = board(1, { dist: SOL.dist, label: 'Kürzeste Zeiten von A aus, zweites Stockwerk' }).svg.outerHTML;
    return '<p>Ron kommt in <b>18 Sekunden</b> zu B: Er geht im ersten Stockwerk in 6 Sekunden bis zum Feld in Zeile 5, Spalte 3 (links neben der senkrechten Wand), wechselt in das zweite Stockwerk (11 Sekunden), geht dort ein Feld nach rechts (12), wechselt zurück (17) und geht das letzte Feld nach rechts zu B (18).</p>' +
      '<div class="t-zs22-figs"><figure>' + f0 + '<figcaption>Erstes Stockwerk</figcaption></figure><figure>' + f1 + '<figcaption>Zweites Stockwerk</figcaption></figure></div>' +
      '<p>Die Zahlen zeigen die kürzeste Zeit von A bis zu jedem Feld. Sie entstehen so: Man nimmt immer das Feld mit der kleinsten schon bekannten Zeit, rechnet für seine Nachbarfelder „Zeit + Schrittdauer“ aus und trägt das ein, wenn es besser ist als der bisherige Wert. Das ist der Algorithmus von Dijkstra, er findet kürzeste Wege in Graphen mit Kosten.</p>' +
      '<p>6 Sekunden (A) wäre der Weg ohne Wände, 16 (B) mit einem Stockwerkwechsel hin und zurück ohne Wände, 20 (D) der Weg nur im ersten Stockwerk.</p>';
  }

  Biber.register({
    id: 'zauberschule22',
    story: '<p>Die Zauberschule hat zwei Stockwerke. Die Stockwerke liegen genau übereinander. Beide sind in Felder eingeteilt, und es gibt Wände zwischen einigen Feldern.</p>' +
      '<p>Zauberschüler Ron braucht <b>1 Sekunde</b>, um auf dem gleichen Stockwerk von einem Feld zum nächsten zu gehen. Leider hat Ron vergessen, wie er durch Wände gehen kann. Er kann aber von einem Stockwerk zum entsprechenden Feld des anderen Stockwerks gelangen; dazu braucht er <b>5 Sekunden</b>.</p>' +
      '<p>Ron möchte von Feld A zu Feld B gelangen, und zwar so schnell wie möglich.</p>',
    question: 'Wie viele Sekunden braucht Ron dazu mindestens?',
    howto: 'Du kannst Ron selbst durch die Schule führen (Pfeiltasten oder Knöpfe, oder tippe auf ein Nachbarfeld). Dann wähle unten die Antwort.',
    explanation: explanation,
    mount: function (root, a) {
      el = root; api = a; locked = false; choice = null; mark = null;
      build();
    },
    isComplete: function () { return choice !== null; },
    evaluate: function () { return { correct: choice === CORRECT, answer: { choice: choice } }; },
    setAnswer: function (ans) { choice = ans && ans.choice != null ? ans.choice : null; mark = 'check'; refreshOpts(); },
    lock: function (on) {
      locked = on;
      if (on) { if (mark !== 'solution') mark = 'check'; } else mark = null;
      refreshOpts(); drawDyn();
    },
    reset: function () { choice = null; mark = null; resetWalk(); refreshOpts(); drawDyn(); },
    showSolution: function () {
      choice = CORRECT; mark = 'solution';
      resetWalk();
      for (var i = 1; i < SOL.path.length; i++) {
        var a = SOL.path[i - 1], b = SOL.path[i];
        time += a[0] !== b[0] ? STAIR : 1;
        trail.push({ s: b.slice(), t: time });
        cur = b.slice();
      }
      refreshOpts(); drawDyn();
    }
  });
})();
