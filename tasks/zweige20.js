/* Aufgabe Zweige (Biber 2020; Klasse 3-4 mittel, 5-6 leicht): Tiere nach Vergleichen den Zweigen zuordnen */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-zweige20-';

  /* Reihenfolge wie im Heft */
  var ANIMALS = [
    { id: 'falter', name: 'Schmetterling', img: 'falter', alt: 'Schmetterling' },
    { id: 'raupe', name: 'Raupe', img: 'raupe', alt: 'Raupe' },
    { id: 'kaefer', name: 'Marienkäfer', img: 'kaefer', alt: 'Marienkäfer' },
    { id: 'schnecke', name: 'Schnecke', img: 'schnecke', alt: 'Schnecke' }
  ];
  var LEAVES = [3, 1, 5, 1];            /* Blätter an den Zweigen von oben nach unten (Bild im Heft) */
  var ORD = ['oberster', 'zweiter', 'dritter', 'unterster'];

  /* Aussagen aus dem Aufgabentext */
  function ok(a) {   /* a[tier] = Zweig-Index; Tiere: 0 Falter, 1 Raupe, 2 Käfer, 3 Schnecke */
    var most = Math.max.apply(null, LEAVES);
    return LEAVES[a[1]] === most && LEAVES.filter(function (n) { return n === most; }).length === 1 &&
      LEAVES[a[0]] > LEAVES[a[3]] && LEAVES[a[2]] === 1;
  }
  /* alle gültigen Zuordnungen per Brute Force (Permutationen) */
  var SOLUTIONS = [];
  (function () {
    function rec(cur, used) {
      if (cur.length === 4) { if (ok(cur)) SOLUTIONS.push(cur.slice()); return; }
      for (var z = 0; z < 4; z++) if (!used[z]) { used[z] = true; cur.push(z); rec(cur, used); cur.pop(); used[z] = false; }
    }
    rec([], [false, false, false, false]);
  })();
  function allowed(tier) {   /* Zweige, die für dieses Tier in mindestens einer gültigen Lösung vorkommen */
    var s = {};
    SOLUTIONS.forEach(function (a) { s[a[tier]] = true; });
    return s;
  }

  var el, api, board, svgEl, animalBtns, branchBtns, statusEl;
  var conn, sel, locked, mode, drag, suppressClick, onResize, ro;

  function reset() { conn = [-1, -1, -1, -1]; sel = null; mode = null; drag = null; }
  function branchOf(a) { return conn[a]; }
  function animalOf(z) { return conn.indexOf(z); }
  function leafText(z) { return LEAVES[z] + (LEAVES[z] === 1 ? ' Blatt' : ' Blätter'); }
  function zLabel(z) { return 'Zweig ' + (z + 1) + ' (' + ORD[z] + ', ' + leafText(z) + ')'; }

  function isRight(a) { return !!allowed(a)[conn[a]]; }
  function allRight() { return conn.every(function (z) { return z >= 0; }) && SOLUTIONS.some(function (s) { return s.every(function (z, a) { return conn[a] === z; }); }); }

  function connect(a, z) {
    if (locked) return;
    if (conn[a] === z) conn[a] = -1;       /* gleiche Verbindung noch einmal: lösen */
    else {
      var other = animalOf(z);
      if (other >= 0) conn[other] = -1;
      conn[a] = z;
    }
    sel = null;
    render();
    var n = conn.filter(function (x) { return x >= 0; }).length;
    api.changed(n === 4 ? 'Alle Tiere sind verbunden.' : n + ' von 4 Tieren verbunden.');
  }

  function pick(kind, i) {
    if (locked) return;
    if (sel && sel.kind !== kind) {
      return kind === 'a' ? connect(i, sel.i) : connect(sel.i, i);
    }
    sel = sel && sel.kind === kind && sel.i === i ? null : { kind: kind, i: i };
    render();
    if (sel) api.changed(kind === 'a' ? ANIMALS[i].name + ' ausgewählt. Tippe jetzt auf einen Zweig.' : zLabel(i) + ' ausgewählt. Tippe jetzt auf ein Tier.');
    else api.changed(conn.filter(function (x) { return x >= 0; }).length + ' von 4 Tieren verbunden.');
  }

  /* ---------- Zeichnen ---------- */
  function animalCard(i, markResult) {
    var a = ANIMALS[i], z = conn[i];
    var cls = P + 'card ' + P + 'animal' + (sel && sel.kind === 'a' && sel.i === i ? ' selected' : '') + (z >= 0 ? ' linked' : '');
    var mk = null;
    if (markResult === 'check' && z >= 0) { var good = isRight(i); cls += good ? ' right' : ' wrong'; mk = h('span', { class: P + 'mark', 'aria-hidden': 'true' }, good ? '✓' : '✗'); }
    else if (markResult === 'solution') cls += ' right';
    return h('button', {
      type: 'button', class: cls, 'data-a': String(i), disabled: locked,
      'aria-pressed': String(!!(sel && sel.kind === 'a' && sel.i === i)),
      'aria-label': 'Tier ' + (i + 1) + ': ' + a.name + (z >= 0 ? ', verbunden mit ' + zLabel(z) : ', nicht verbunden')
    }, h('img', { src: 'assets/zweige20/' + a.img + '.png', alt: '', draggable: 'false' }), h('span', { class: P + 'dot', 'aria-hidden': 'true' }), mk);
  }
  function branchCard(z, markResult) {
    var a = animalOf(z);
    var cls = P + 'card ' + P + 'branch' + (sel && sel.kind === 'z' && sel.i === z ? ' selected' : '') + (a >= 0 ? ' linked' : '');
    return h('button', {
      type: 'button', class: cls, 'data-z': String(z), disabled: locked,
      'aria-pressed': String(!!(sel && sel.kind === 'z' && sel.i === z)),
      'aria-label': zLabel(z) + (a >= 0 ? ', verbunden mit ' + ANIMALS[a].name : ', nicht verbunden')
    }, h('img', { src: 'assets/zweige20/zweig' + z + '.png', alt: '', draggable: 'false' }), h('span', { class: P + 'dot', 'aria-hidden': 'true' }));
  }

  var markState = null;
  function render(markResult) {
    if (markResult !== undefined) markState = markResult;
    var mr = markState;
    var af = document.activeElement, fkey = null;
    if (af && el && el.contains(af) && af.dataset) fkey = af.dataset.a !== undefined ? '[data-a="' + af.dataset.a + '"]' : (af.dataset.z !== undefined ? '[data-z="' + af.dataset.z + '"]' : null);
    animalBtns = ANIMALS.map(function (x, i) { return animalCard(i, mr); });
    branchBtns = LEAVES.map(function (x, z) { return branchCard(z, mr); });
    svgEl = Biber.svg('svg', { class: P + 'lines', 'aria-hidden': 'true', focusable: 'false' });
    var rows = [];
    for (var i = 0; i < 4; i++) rows.push(animalBtns[i], h('span', { class: P + 'gap', 'aria-hidden': 'true' }), branchBtns[i]);
    board = h('div', { class: P + 'board' }, svgEl, h('div', { class: P + 'grid' }, rows));
    el.replaceChildren(board);
    drawLines();
    if (fkey) { var nf = el.querySelector(fkey); if (nf && !nf.disabled) nf.focus(); }
  }

  function dotPos(btn, side) {
    var r = btn.getBoundingClientRect(), b = board.getBoundingClientRect();
    return { x: (side === 'r' ? r.right : r.left) - b.left, y: r.top + r.height / 2 - b.top };
  }
  function drawLines() {
    if (!board || !svgEl) return;
    var b = board.getBoundingClientRect();
    svgEl.setAttribute('viewBox', '0 0 ' + b.width + ' ' + b.height);
    svgEl.replaceChildren();
    conn.forEach(function (z, a) {
      if (z < 0) return;
      var p = dotPos(animalBtns[a], 'r'), q = dotPos(branchBtns[z], 'l');
      var cls = P + 'line';
      if (markState === 'check') cls += isRight(a) ? ' ' + P + 'right' : ' ' + P + 'wrong';
      else if (markState === 'solution') cls += ' ' + P + 'right';
      svgEl.appendChild(Biber.svg('line', { class: cls, x1: p.x, y1: p.y, x2: q.x, y2: q.y }));
    });
    if (drag && drag.moved) {
      var s = drag.kind === 'a' ? dotPos(animalBtns[drag.i], 'r') : dotPos(branchBtns[drag.i], 'l');
      svgEl.appendChild(Biber.svg('line', { class: P + 'line ' + P + 'pending', x1: s.x, y1: s.y, x2: drag.x - b.left, y2: drag.y - b.top }));
    }
  }

  /* ---------- Eingaben: Antippen (Tier, dann Zweig - oder umgekehrt) und Ziehen ---------- */
  function cardOf(t) {
    var c = t && t.closest ? t.closest('[data-a],[data-z]') : null;
    if (!c || !el.contains(c)) return null;
    return c.dataset.a !== undefined ? { kind: 'a', i: +c.dataset.a } : { kind: 'z', i: +c.dataset.z };
  }
  function onDown(e) {
    if (locked || (e.pointerType === 'mouse' && e.button !== 0)) return;
    var c = cardOf(e.target);
    if (!c) return;
    drag = { kind: c.kind, i: c.i, sx: e.clientX, sy: e.clientY, x: e.clientX, y: e.clientY, moved: false, id: e.pointerId };
  }
  function onMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    drag.x = e.clientX; drag.y = e.clientY;
    if (!drag.moved && Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) > 10) {
      drag.moved = true;
      try { board.setPointerCapture(e.pointerId); } catch (err) { /* egal */ }
    }
    if (drag.moved) { e.preventDefault(); drawLines(); }
  }
  function onUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag;
    drag = null;
    try { board.releasePointerCapture(e.pointerId); } catch (err) { /* egal */ }
    if (!d.moved) return;
    suppressClick = true;
    setTimeout(function () { suppressClick = false; }, 0);
    var t = cardOf(document.elementFromPoint(e.clientX, e.clientY));
    if (t && t.kind !== d.kind) { if (d.kind === 'a') connect(d.i, t.i); else connect(t.i, d.i); }
    else { drawLines(); }
  }
  function onCancel() { if (drag) { drag = null; drawLines(); } }
  function onClick(e) {
    if (suppressClick) { suppressClick = false; return; }
    var c = cardOf(e.target);
    if (c) pick(c.kind, c.i);
  }

  Biber.register({
    id: 'zweige20',
    story:
      '<p>Emma und Felix entdecken in einem Busch vier Tiere. Die Tiere sitzen auf vier verschiedenen Zweigen:</p>' +
      '<ul>' +
      '<li>Der Zweig mit der <strong>Raupe</strong> hat die meisten Blätter.</li>' +
      '<li>Der Zweig mit dem <strong>Schmetterling</strong> hat mehr Blätter als der Zweig mit der <strong>Schnecke</strong>.</li>' +
      '<li>Der Zweig mit dem <strong>Marienkäfer</strong> hat genau ein Blatt.</li>' +
      '</ul>',
    question: 'Verbinde jedes Tier mit seinem Zweig.',
    howto: 'Ziehe von einem Tier zu einem Zweig. Du kannst auch erst das Tier und dann den Zweig antippen (oder umgekehrt). Tippst du zwei verbundene Karten noch einmal nacheinander an, löst sich die Verbindung.',
    explanation: function () {
      return '<p>Die Zweige haben von oben nach unten <strong>3, 1, 5 und 1 Blätter</strong>. Die meisten Blätter hat der dritte Zweig (5), also sitzt dort die <strong>Raupe</strong>. ' +
        'Der <strong>Marienkäfer</strong> braucht einen Zweig mit genau einem Blatt: Das ist der zweite oder der unterste Zweig.</p>' +
        '<p>Für Schmetterling und Schnecke bleiben der Zweig mit 3 Blättern und ein Zweig mit einem Blatt. Weil der Schmetterling mehr Blätter haben muss als die Schnecke, sitzt er auf dem Zweig mit <strong>3 Blättern</strong> ganz oben und die Schnecke auf dem anderen Zweig mit einem Blatt. ' +
        'Es gibt deshalb <strong>zwei richtige Lösungen</strong>: Marienkäfer und Schnecke dürfen die beiden Ein-Blatt-Zweige tauschen.</p>' +
        '<p>Es hätte geholfen, die Zweige nach der Zahl der Blätter zu sortieren. Dann sieht man „mehr als“ und „die meisten“ sofort. Sortierte Daten machen das Vergleichen und Finden leichter, deshalb sortieren Computer ständig.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; markState = null; suppressClick = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('pointerdown', onDown);
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerup', onUp);
      el.addEventListener('pointercancel', onCancel);
      if (onResize) window.removeEventListener('resize', onResize);
      onResize = function () { if (el && el.isConnected) drawLines(); };
      window.addEventListener('resize', onResize);
      render(null);
      if (ro) ro.disconnect();
      if (window.ResizeObserver) { ro = new ResizeObserver(function () { if (el.isConnected) drawLines(); }); ro.observe(el); }
    },
    isComplete: function () { return conn.every(function (z) { return z >= 0; }); },
    evaluate: function () { return { correct: allRight(), answer: conn.slice() }; },
    setAnswer: function (ans) {
      conn = ans.slice(); sel = null;
      render(allRight() ? 'solution' : 'check');
    },
    lock: function (on) {
      locked = on; sel = null;
      render(on ? 'check' : null);
    },
    reset: function () { reset(); render(null); },
    showSolution: function () {
      conn = SOLUTIONS[0].slice(); sel = null; locked = true;
      render('solution');
    }
  });
})();
