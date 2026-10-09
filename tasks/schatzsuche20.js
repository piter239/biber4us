/* Aufgabe Schatzsuche (Biber 2020; Klasse 5-6 schwer): Tore und Steine in drei Gängen (Locks / parallele Prozesse) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-schatzsuche20-';
  var NS = 'http://www.w3.org/2000/svg';

  /* Zeichen: r roter Kreis, w weißes Quadrat, g grünes Karo, y gelber Stern, b blaues Dreieck */
  var SYM = {
    r: { name: 'roter Kreis', nom: 'rotem Kreis' },
    w: { name: 'weißes Quadrat', nom: 'weißem Quadrat' },
    g: { name: 'grünes Karo', nom: 'grünem Karo' },
    y: { name: 'gelber Stern', nom: 'gelbem Stern' },
    b: { name: 'blaues Dreieck', nom: 'blauem Dreieck' }
  };
  /* Gänge von links nach rechts: G = Tor, S = Stein (aus dem Heft abgelesen) */
  var WHO = [
    { id: 'ada', name: 'Ada', col: 'c1', items: [['G', 'r'], ['G', 'w'], ['G', 'g'], ['G', 'w']] },
    { id: 'belle', name: 'Belle', col: 'c4', items: [['S', 'r'], ['G', 'y'], ['S', 'b'], ['G', 'r'], ['G', 'w']] },
    { id: 'cody', name: 'Cody', col: 'c6', items: [['G', 'r'], ['S', 'g'], ['S', 'w'], ['G', 'b']] }
  ];
  var OPTIONS = [
    { key: 'A', text: 'Ada' }, { key: 'B', text: 'Belle' }, { key: 'C', text: 'Cody' },
    { key: 'D', text: 'Niemand kann den Schatz erreichen.' }
  ];

  /* ---------- Spiellogik ---------- */
  function fresh() { return { pos: [0, 0, 0], open: {} }; }
  /* ein Schritt für Läufer i; liefert {kind, ...} */
  function stepOf(st, i) {
    var w = WHO[i], p = st.pos[i];
    if (p >= w.items.length) return { kind: 'done' };
    var it = w.items[p];
    if (it[0] === 'S') { st.pos[i]++; st.open[it[1]] = true; return { kind: 'stone', sym: it[1] }; }
    if (st.open[it[1]]) { st.pos[i]++; return { kind: 'pass', sym: it[1], end: st.pos[i] >= w.items.length }; }
    return { kind: 'wait', sym: it[1] };
  }
  function canStep(st, i) {
    var w = WHO[i], p = st.pos[i];
    if (p >= w.items.length) return false;
    var it = w.items[p];
    return it[0] === 'S' || !!st.open[it[1]];
  }
  /* Öffnen von Toren schadet nie: Es genügt, so lange Schritte zu machen, wie überhaupt einer geht. */
  function runAll(st) {
    var moved = true, i;
    while (moved) {
      moved = false;
      for (i = 0; i < WHO.length; i++) while (canStep(st, i)) { stepOf(st, i); moved = true; }
    }
    return st;
  }
  var FINAL = runAll(fresh());
  var REACH = WHO.map(function (w, i) { return FINAL.pos[i] >= w.items.length; });
  var RIGHT = (function () {
    var idx = [];
    REACH.forEach(function (r, i) { if (r) idx.push(i); });
    return idx.length === 0 ? 3 : idx[0];   /* hier: nur Ada (A), wie im Heft */
  })();

  /* ---------- Zeichnen ---------- */
  function svg(tag, attrs) {
    var n = document.createElementNS(NS, tag), k;
    for (k in attrs) if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, attrs[k]);
    for (var j = 2; j < arguments.length; j++) if (arguments[j]) n.appendChild(arguments[j]);
    return n;
  }
  function symbol(s, x, y, k) {
    var g = svg('g', { transform: 'translate(' + x + ' ' + y + ') scale(' + (k || 1) + ')', class: P + 'sym ' + P + 's-' + s });
    if (s === 'r') g.appendChild(svg('circle', { r: 7 }));
    else if (s === 'w') g.appendChild(svg('rect', { x: -6.5, y: -6.5, width: 13, height: 13 }));
    else if (s === 'g') g.appendChild(svg('path', { d: 'M0 -9 L7.5 0 L0 9 L-7.5 0 Z' }));
    else if (s === 'y') {
      var d = '', i;
      for (i = 0; i < 10; i++) { var a = (-90 + 36 * i) * Math.PI / 180, r = i % 2 ? 4.2 : 9.5; d += (i ? 'L' : 'M') + (r * Math.cos(a)).toFixed(1) + ' ' + (r * Math.sin(a)).toFixed(1); }
      g.appendChild(svg('path', { d: d + 'Z' }));
    } else g.appendChild(svg('path', { d: 'M0 -8.5 L8 6 L-8 6 Z' }));
    return g;
  }
  var X0 = 100, DX = 62, LANE_H = 70, GAP = 8;
  function ix(k) { return X0 + k * DX; }
  function laneY(i) { return 6 + i * (LANE_H + GAP); }

  var el, api, selected, locked, mark, st;
  var radios, stage, itemEls, tokenEls, btns, statusEls, noteEl;

  function reset() { selected = null; mark = null; st = fresh(); }

  function build() {
    stage = svg('svg', { class: P + 'cave', viewBox: '0 0 460 ' + (laneY(3) - GAP + 6), role: 'img',
      'aria-label': 'Drei Gänge mit Toren und Steinen, rechts der Schatz. Ada: Tore mit rotem Kreis, weißem Quadrat, grünem Karo, weißem Quadrat. Belle: Stein mit rotem Kreis, Tor mit gelbem Stern, Stein mit blauem Dreieck, Tor mit rotem Kreis, Tor mit weißem Quadrat. Cody: Tor mit rotem Kreis, Steine mit grünem Karo und weißem Quadrat, Tor mit blauem Dreieck.' });
    itemEls = []; tokenEls = [];
    WHO.forEach(function (w, i) {
      var top = laneY(i), cy = top + 30;
      stage.appendChild(svg('rect', { class: P + 'lane', x: 4, y: top, width: 394, height: LANE_H, rx: 10 }));
      var t = svg('text', { class: P + 'lname', x: 12, y: top + 15 }); t.textContent = w.name; stage.appendChild(t);
      itemEls[i] = w.items.map(function (it, k) {
        var x = ix(k), g = svg('g', { class: P + (it[0] === 'G' ? 'gate' : 'stone') });
        if (it[0] === 'G') {
          g.appendChild(svg('rect', { class: P + 'bar', x: x - 10, y: top + 4, width: 20, height: LANE_H - 8, rx: 3 }));
          g.appendChild(svg('path', { class: P + 'slats', d: 'M' + (x - 10) + ' ' + (top + 14) + 'h20M' + (x - 10) + ' ' + (top + 24) + 'h20M' + (x - 10) + ' ' + (top + 34) + 'h20M' + (x - 10) + ' ' + (top + 44) + 'h20M' + (x - 10) + ' ' + (top + 54) + 'h20' }));
          g.appendChild(svg('circle', { class: P + 'badge', cx: x, cy: cy, r: 11 }));
          g.appendChild(symbol(it[1], x, cy, 1));
        } else {
          g.appendChild(svg('ellipse', { class: P + 'rock', cx: x, cy: cy + 12, rx: 22, ry: 14 }));
          g.appendChild(symbol(it[1], x, cy + 11, 0.95));
        }
        stage.appendChild(g);
        return g;
      });
      /* Marke, damit die Kopie im Dunkeln nicht verschwindet: Token */
      var tok = svg('g', { class: P + 'token', style: 'fill:var(--' + w.col + ')' },
        svg('circle', { r: 10 }), (function () { var tx = svg('text', { y: 4, 'text-anchor': 'middle' }); tx.textContent = w.name[0]; return tx; })());
      stage.appendChild(tok);
      tokenEls[i] = tok;
    });
    /* Schatzkammer rechts: alle drei Gänge münden hier */
    var top0 = laneY(0), hall = laneY(3) - GAP - top0;
    stage.appendChild(svg('rect', { class: P + 'lane ' + P + 'hall', x: 388, y: top0, width: 68, height: hall, rx: 10 }));
    var tr = svg('g', { class: P + 'treasure' });
    var coins = [[-14, 6], [0, 10], [14, 6], [-7, -4], [7, -4], [0, -14], [-21, 14], [21, 14], [-10, 16], [10, 17]];
    coins.forEach(function (c) { tr.appendChild(svg('circle', { cx: 424 + c[0], cy: top0 + hall / 2 + c[1] - 4, r: 7 })); });
    var tl = svg('text', { class: P + 'tlabel', x: 424, y: top0 + 15, 'text-anchor': 'middle' }); tl.textContent = 'Schatz';
    stage.appendChild(tr); stage.appendChild(tl);
    tokenEls.forEach(function (t) { stage.appendChild(t); });
  }

  function tokenX(i) {
    var w = WHO[i], p = st.pos[i], n = w.items.length;
    if (p === 0) return 44;
    if (p >= n) return 424;
    if (w.items[p - 1][0] === 'S') return ix(p - 1);
    return ix(p - 1) + DX / 2;
  }
  function render() {
    WHO.forEach(function (w, i) {
      w.items.forEach(function (it, k) {
        var g = itemEls[i][k];
        var cls = P + (it[0] === 'G' ? 'gate' : 'stone');
        if (it[0] === 'G' && st.open[it[1]]) cls += ' open';
        if (it[0] === 'S' && k < st.pos[i]) cls += ' used';
        g.setAttribute('class', cls);
      });
      var y = laneY(i) + LANE_H - 15;
      var finished = st.pos[i] >= w.items.length;
      var x = tokenX(i);
      tokenEls[i].setAttribute('transform', 'translate(' + x + ' ' + y + ')');
      var waiting = !finished && !canStep(st, i);
      statusEls[i].textContent = finished ? 'am Schatz' : (waiting ? 'wartet am Tor' : 'unterwegs');
      statusEls[i].className = P + 'stat' + (finished ? ' done' : (waiting ? ' wait' : ''));
      btns[i].disabled = finished;
      btns[i].setAttribute('aria-label', w.name + ' einen Schritt gehen lassen (' + statusEls[i].textContent + ')');
    });
  }
  function say(t) { noteEl.textContent = t; }
  function walk(i) {
    var w = WHO[i], r = stepOf(st, i);
    if (r.kind === 'stone') say(w.name + ' tritt auf den Stein mit ' + SYM[r.sym].nom + '. Alle Tore mit ' + SYM[r.sym].nom + ' sind jetzt für immer offen.');
    else if (r.kind === 'pass') say(w.name + ' geht durch das offene Tor mit ' + SYM[r.sym].nom + (r.end ? ' und erreicht den Schatz!' : '.'));
    else if (r.kind === 'wait') say(w.name + ' muss warten: Das Tor mit ' + SYM[r.sym].nom + ' ist noch verschlossen. Vielleicht kann eine andere Entdeckerin es öffnen.');
    render();
  }

  function refresh() {
    radios.forEach(function (btn, i) {
      var on = selected === i, ok = i === RIGHT;
      btn.setAttribute('aria-checked', String(on));
      btn.tabIndex = (selected === null ? i === 0 : on) ? 0 : -1;
      btn.setAttribute('aria-disabled', locked ? 'true' : 'false');
      btn.classList.toggle('selected', on);
      btn.classList.toggle('right', on && mark !== null && ok);
      btn.classList.toggle('wrong', on && mark === 'check' && !ok);
      var m = btn.querySelector('.' + P + 'mark');
      if (m) m.remove();
      if (on && mark !== null) btn.appendChild(h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
    });
  }
  function choose(i, focus) {
    if (locked) return;
    selected = i;
    refresh();
    if (focus) radios[i].focus();
    api.changed();
  }
  function onKey(e) {
    var k = e.key, i = radios.indexOf(e.currentTarget), to = null;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % radios.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + radios.length - 1) % radios.length;
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }

  var HELP = 'Tippe auf einen Namen, um die Entdeckerin einen Schritt gehen zu lassen. Hier kannst du ausprobieren, wer wo wartet.';
  Biber.register({
    id: 'schatzsuche20',
    story:
      '<p>Die drei Entdeckerinnen Ada, Belle und Cody wollen einen Schatz erreichen. Jede geht durch einen anderen Gang. In den Gängen sind Tore und Steine. Darauf sind verschiedene farbige Zeichen. Am Anfang sind alle Tore verschlossen.</p>' +
      '<p>Wenn eine Entdeckerin an ein verschlossenes Tor kommt, muss sie warten, bis das Tor geöffnet wird. Wenn eine Entdeckerin auf einen Stein tritt, werden alle Tore mit dem gleichen Zeichen für immer geöffnet.</p>',
    question: 'Wer kann den Schatz erreichen?',
    howto: 'Probiere es mit den Namen unter dem Bild aus (Tore sind Balken, Steine liegen am Boden). Wähle dann eine Antwort.',
    explanation: function () {
      return '<p>Belle tritt gleich zu Beginn auf den Stein mit dem roten Kreis und öffnet damit alle roten Tore. Dann kann Cody das erste Tor passieren und auf die Steine mit grünem Karo und weißem Quadrat treten. Damit sind in Adas Gang alle Tore offen, und <strong>Ada erreicht den Schatz</strong> (A).</p>' +
        '<p>Belle bleibt am Tor mit dem gelben Stern hängen, denn es gibt keinen Stein mit gelbem Stern (B ist falsch). Das letzte Tor in Codys Gang hat ein blaues Dreieck. Den passenden Stein hätte nur Belle, aber sie kommt nie so weit (C ist falsch).</p>' +
        '<p>Die drei Entdeckerinnen verhalten sich wie Prozessoren oder <strong>Threads</strong>, die gleichzeitig arbeiten. Die Tore sind Sperren (<strong>Locks</strong>): Ein Thread muss warten, bis ein anderer seine Sperre löst. Dabei kann es passieren, dass sich Threads gegenseitig aufhalten.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      build();
      noteEl = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' }, HELP);
      statusEls = []; btns = [];
      var ctl = WHO.map(function (w, i) {
        var s = h('span', { class: P + 'stat' });
        statusEls[i] = s;
        var b = h('button', { type: 'button', class: P + 'who', style: '--pc:var(--' + w.col + ')', onclick: function () { walk(i); } },
          h('span', { class: P + 'dot', 'aria-hidden': 'true' }, w.name[0]), h('span', { class: P + 'wn' }, w.name), s);
        btns[i] = b;
        return b;
      });
      var again = h('button', { type: 'button', class: P + 'again', onclick: function () { st = fresh(); say(HELP); render(); } }, 'Von vorn');
      radios = OPTIONS.map(function (o, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': o.key,
          'aria-label': 'Antwort ' + o.key + ': ' + o.text, onclick: function () { choose(i, false); }, onkeydown: onKey
        });
        btn.innerHTML = '<span class="' + P + 'key" aria-hidden="true">' + o.key + ')</span><span class="' + P + 'txt">' + o.text + '</span>';
        return btn;
      });
      var cave = h('div', { class: P + 'cavebox' });
      cave.appendChild(stage);
      el.replaceChildren(h('div', { class: P + 'board' },
        cave,
        h('div', { class: P + 'ctl', role: 'group', 'aria-label': 'Entdeckerinnen gehen lassen' }, ctl, again),
        noteEl,
        h('section', { 'aria-label': 'Antwort' }, h('h3', null, 'Wer erreicht den Schatz?'),
          h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Antworten' }, radios))));
      render();
      refresh();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () {
      return { correct: selected === RIGHT, answer: { choice: OPTIONS[selected].key } };
    },
    setAnswer: function (ans) {
      var i = OPTIONS.map(function (o) { return o.key; }).indexOf(ans && ans.choice);
      selected = i >= 0 ? i : null;
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      refresh();
    },
    reset: function () { reset(); say(HELP); render(); refresh(); },
    showSolution: function () {
      selected = RIGHT; mark = 'solution'; locked = true;
      st = runAll(fresh());
      say('So kommt Ada zum Schatz: Belle öffnet die roten Tore, dann öffnet Cody die grünen und weißen Tore.');
      render(); refresh();
    }
  });
})();
