/* Aufgabe Biberone (Klasse 9-13): Biberone mischen = XNOR, Inhalte zweier Behälter mit möglichst wenigen Anweisungen vertauschen */
(function () {
  'use strict';
  var h = Biber.h;

  /* ---------- Aufgabendaten ---------- */
  var START = ['CAC', 'ACA', 'AAC'];          /* Behälter 1, 2, 3 */
  var GOAL = ['AAC', 'ACA', 'CAC'];
  var MOVES = ['1>2', '1>3', '2>1', '2>3', '3>1', '3>2'];   /* Tropfen aus Behälter a in Behälter b, Reihenfolge wie im Heft */
  var MAXSTEPS = 8;
  /* Farben der Flüssigkeiten: wie im Heft (CAC rot, ACA gelb, AAC türkis, ACC lila, CCA blau); die übrigen Biberone sind im Heft nicht abgebildet */
  var COL = {
    CAC: 'var(--c1)', ACA: 'var(--c2)', AAC: 'var(--c3)', ACC: 'var(--c5)', CCA: 'var(--c4)',
    CAA: 'var(--c6)', CCC: 'var(--muted)', AAA: 'var(--line)'
  };

  /* Ein Tropfen von x zu y: gleiche Bausteine -> C, verschiedene -> A */
  function mix(x, y) {
    var r = '';
    for (var i = 0; i < y.length; i++) r += x.charAt(i) === y.charAt(i) ? 'C' : 'A';
    return r;
  }
  function apply(state, mv) {
    var a = +mv.charAt(0) - 1, b = +mv.charAt(2) - 1, s = state.slice();
    s[b] = mix(state[a], state[b]);
    return s;
  }
  function run(steps) {
    var states = [START.slice()];
    steps.forEach(function (m) { states.push(apply(states[states.length - 1], m)); });
    return states;
  }
  function same(a, b) { return a.join() === b.join(); }

  /* Kürzeste Anweisungsfolge per Breitensuche (alle Folgen nach Länge sortiert) */
  var BEST = (function () {
    var level = [{ s: START, p: [] }];
    for (var d = 0; d <= 6; d++) {
      for (var i = 0; i < level.length; i++) if (same(level[i].s, GOAL)) return level[i].p;
      var next = [];
      level.forEach(function (n) { MOVES.forEach(function (m) { next.push({ s: apply(n.s, m), p: n.p.concat([m]) }); }); });
      level = next;
    }
    return null;
  })();
  var MIN = BEST.length;

  /* ---------- Zeichnen ---------- */
  function tile(c) { return '<span class="bo-tile">' + c + '</span>'; }
  function stack(mol) {
    return '<span class="bo-stack" aria-hidden="true">' + mol.split('').map(tile).join('<i class="bo-link"></i>') + '</span>';
  }
  function beakerInner(mol, num) {
    return '<path d="M8 17 H48 V68 Q48 74 42 74 H14 Q8 74 8 68 Z" class="bo-liq" style="fill:' + COL[mol] + '"/>' +
      '<path d="M8 17 H48 V25 H8 Z" class="bo-shine"/>' +
      '<path d="M6 6 V68 Q6 76 14 76 H42 Q50 76 50 68 V6" class="bo-glass"/>' +
      (num ? '<circle cx="28" cy="50" r="10" class="bo-badge"/><text x="28" y="50" class="bo-num" text-anchor="middle" dominant-baseline="central">' + num + '</text>' : '');
  }
  function beaker(mol, num) {
    return '<svg class="bo-bk" viewBox="0 0 56 80" aria-hidden="true" focusable="false">' + beakerInner(mol, num) + '</svg>';
  }
  function eq(a, b, c) {
    return '<span class="bo-eq">' + tile(a) + '<b class="bo-op">+</b>' + tile(b) + '<b class="bo-op">→</b>' + tile(c) + '</span>';
  }
  function rulesFig() {
    return '<div class="bo-rules" role="img" aria-label="Regeln: A plus A ergibt C, C plus C ergibt C, C plus A ergibt A, A plus C ergibt A">' +
      '<div class="bo-rcol">' + eq('A', 'A', 'C') + eq('C', 'C', 'C') + '</div><span class="bo-und">und</span>' +
      '<div class="bo-rcol">' + eq('C', 'A', 'A') + eq('A', 'C', 'A') + '</div></div>';
  }
  function circ(n, cx, cy) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="12.5" class="bo-badge"/><text x="' + cx + '" y="' + (cy + 0.5) + '" class="bo-num bo-num2" text-anchor="middle" dominant-baseline="central">' + n + '</text>';
  }
  function instrIcon(mv, cls) {
    var a = mv.charAt(0), b = mv.charAt(2);
    return '<svg class="bo-ins ' + (cls || '') + '" viewBox="0 0 76 42" aria-hidden="true" focusable="false">' +
      '<path d="M20 15 Q38 -10 58 11" class="bo-arc"/><path d="M49 4 L59 12 L47 16" class="bo-arc"/>' + circ(a, 14, 29) + circ(b, 62, 29) + '</svg>';
  }
  function exampleFig() {
    var dropper = '<g transform="translate(116 20) rotate(28)"><rect x="-6" y="-34" width="12" height="20" rx="6" class="bo-ink"/><rect x="-9" y="-15" width="18" height="5" rx="2" class="bo-ink"/>' +
      '<path d="M-5 -10 L5 -10 L2 14 L-2 14 Z" class="bo-dr"/><circle cx="0" cy="22" r="4.5" style="fill:' + COL.ACC + '"/></g>';
    var mid = '<svg class="bo-exsvg" viewBox="0 0 150 100" aria-hidden="true" focusable="false">' +
      '<svg x="6" y="30" width="48" height="68" viewBox="0 0 56 80">' + beakerInner('ACC') + '</svg>' +
      '<svg x="88" y="30" width="48" height="68" viewBox="0 0 56 80">' + beakerInner('ACA') + '</svg>' +
      '<path d="M26 28 Q58 -2 92 34" class="bo-arc"/><path d="M82 24 L93 35 L78 36" class="bo-arc"/>' + dropper + '</svg>';
    function panel(title, body) { return '<div class="bo-pn"><div class="bo-pt">' + title + '</div><div class="bo-pb">' + body + '</div></div>'; }
    function pair(m1, m2) {
      return '<div class="bo-pair"><div class="bo-one">' + beaker(m1) + stack(m1) + '</div><div class="bo-one">' + beaker(m2) + stack(m2) + '</div></div>';
    }
    var sums = '<div class="bo-sums" aria-hidden="true">' + ['AA', 'CC', 'CA'].map(function (p, i) {
      var r = 'ACC'.charAt(i) + 'ACA'.charAt(i);
      return '<span class="bo-eq">' + tile(r.charAt(0)) + '<b class="bo-op">+</b>' + tile(r.charAt(1)) + '</span>';
    }).join('') + '</div>';
    return '<div class="bo-ex" role="group" aria-label="Beispiel: Ein Tropfen ACC wird zu ACA hinzugefügt, es entsteht CCA">' +
      panel('Biberone ACC und ACA', pair('ACC', 'ACA')) +
      panel('Tropfen von ACC in ACA', mid + sums) +
      panel('rechts entsteht CCA', pair('ACC', 'CCA')) + '</div>';
  }
  function moveText(mv) { return 'Tropfen aus Behälter ' + mv.charAt(0) + ' in Behälter ' + mv.charAt(2); }

  /* ---------- Zustand und Anzeige ---------- */
  var el, api, steps, locked, lab, seqList, undoBtn, palette, live, countEl, goalOk;

  function render() {
    var states = run(steps), cur = states[states.length - 1];
    /* Behälter */
    lab.innerHTML = '';
    cur.forEach(function (mol, i) {
      var ok = mol === GOAL[i];
      var d = document.createElement('div');
      d.className = 'bo-cont' + (locked ? (same(cur, GOAL) && steps.length === MIN ? ' right' : same(cur, GOAL) ? ' ok' : ' wrong') : '');
      d.setAttribute('role', 'group');
      d.setAttribute('aria-label', 'Behälter ' + (i + 1) + ': ' + mol.split('').join(' ') + (ok ? ', entspricht dem Ziel' : ', Ziel ist ' + GOAL[i]));
      d.innerHTML = beaker(mol, i + 1) + stack(mol) + '<span class="bo-goal' + (ok ? ' hit' : '') + '" aria-hidden="true">Ziel: ' + GOAL[i] + (ok ? ' ✓' : '') + '</span>';
      lab.appendChild(d);
    });
    /* Folge der Anweisungen mit Zwischenständen */
    var html = '<li class="bo-row bo-start"><span class="bo-sn">Start</span><span class="bo-sts">' + stateChips(states[0], null) + '</span></li>';
    steps.forEach(function (m, i) {
      var b = +m.charAt(2) - 1;
      html += '<li class="bo-row"><span class="bo-sn">' + (i + 1) + '.</span><span class="bo-isw" aria-label="' + moveText(m) + '">' + instrIcon(m) + '</span>' +
        '<span class="bo-sts" aria-hidden="true">' + stateChips(states[i + 1], b) + '</span></li>';
    });
    seqList.innerHTML = html;
    countEl.textContent = steps.length ? steps.length + (steps.length === 1 ? ' Anweisung' : ' Anweisungen') : 'noch keine Anweisung';
    var full = steps.length >= MAXSTEPS;
    [].forEach.call(palette.querySelectorAll('button'), function (b) { b.disabled = !!locked || full; });
    if (undoBtn.disabled === false && (locked || !steps.length) && document.activeElement === undoBtn) palette.querySelector('button').focus();
    undoBtn.disabled = !!locked || !steps.length;
    live.textContent = (steps.length ? steps.length + ' Anweisungen. ' : '') + 'Behälter 1: ' + cur[0] + ', Behälter 2: ' + cur[1] + ', Behälter 3: ' + cur[2] + '.';
  }
  function stateChips(s, changed) {
    return s.map(function (m, i) {
      return '<span class="bo-chip' + (changed === i ? ' chg' : '') + '"><b>' + (i + 1) + '</b>' + m + '</span>';
    }).join('');
  }
  function status() {
    var cur = run(steps).pop();
    if (!steps.length) return '';
    return steps.length + (steps.length === 1 ? ' Anweisung' : ' Anweisungen') + (same(cur, GOAL) ? ', Ziel erreicht' : '');
  }
  function add(mv) {
    if (locked || steps.length >= MAXSTEPS) return;
    steps.push(mv);
    render();
    api.changed(status());
  }
  function undo() {
    if (locked || !steps.length) return;
    steps.pop();
    render();
    api.changed(status());
  }

  var STORY =
    '<p>Ein Biberon ist ein besonderer chemischer Stoff: Seine Moleküle sind jeweils eine Folge von genau drei Bausteinen der Typen A und C. Diese Folge wird auch als Name des Biberons verwendet, zum Beispiel: ACA.</p>' +
    '<p>Wenn ein Biberon zu einem anderen Biberon hinzugefügt wird, entsteht wieder ein Biberon. Aus den Bausteinen in den Molekülen der beiden Biberone entstehen die Bausteine des neuen Biberons nach diesen Regeln:</p>' +
    rulesFig() +
    '<p>Ein Beispiel: Wenn man einen Tropfen von ACC zu ACA hinzufügt, entsteht CCA:</p>' +
    exampleFig() +
    '<p>Im Labor gibt es drei Behälter 1, 2 und 3 mit den Biberonen CAC, ACA und AAC.</p>' +
    '<p class="bo-instr-p">Mit einer solchen Anweisung ' + instrIcon('2>3', 'bo-inl') + ' kannst du bestimmen, dass ein Tropfen des Biberons in einem Behälter (z. B. Behälter 2) dem Biberon in einem anderen Behälter (z. B. Behälter 3) hinzugefügt wird.</p>';

  Biber.register({
    id: 'biberone',
    story: STORY,
    question: 'Unten siehst du sechs verschiedene Anweisungen. Verwende möglichst wenige davon, um die Biberone in den Behältern 1 und 3 zu vertauschen: Am Ende soll in Behälter 1 AAC sein, in Behälter 2 bleibt ACA, und in Behälter 3 soll CAC sein.',
    howto: 'Tippe nacheinander auf die Anweisungen. Du darfst dieselbe Anweisung auch mehrmals verwenden. Die Behälter zeigen sofort, was nach jeder Anweisung darin ist. Mit „Letzte entfernen“ nimmst du die letzte Anweisung zurück.',
    explanation: function () {
      var st = run(BEST), cur = run(steps).pop();
      var note = '';
      if (same(cur, GOAL) && steps.length > MIN) note = '<p>Dein Ergebnis stimmt, aber es geht mit nur ' + MIN + ' Anweisungen.</p>';
      var rows = BEST.map(function (m, i) {
        return '<li>' + instrIcon(m, 'bo-ex-ins') + '<span>' + moveText(m) + ': <strong>' + st[i + 1].join(' · ') + '</strong></span></li>';
      }).join('');
      return note + '<p>Schreibt man C als 1 und A als 0, dann ergeben zwei gleiche Bausteine eine 1 und zwei verschiedene eine 0: Die Regeln sind das Gegenteil von XOR. ' +
        'Die Biberone zu vertauschen funktioniert deshalb wie das bekannte Vertauschen zweier Werte mit XOR, ganz ohne dritten Behälter, in drei Schritten (Start: ' + START.join(' · ') + '):</p>' +
        '<ol class="bo-sol">' + rows + '</ol>' +
        '<p>Genauso gut geht 3 → 1, 1 → 3, 3 → 1. Mit nur 1 oder 2 Anweisungen gelingt das Vertauschen nie, das zeigt das Durchprobieren aller Folgen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; steps = []; locked = false;
      lab = h('div', { class: 'bo-lab' });
      palette = h('div', { class: 'bo-pal', role: 'group', 'aria-label': 'Sechs Anweisungen' });
      MOVES.forEach(function (m) {
        palette.appendChild(h('button', { type: 'button', class: 'bo-btn', 'aria-label': moveText(m), 'data-mv': m, onclick: function () { add(m); } }));
        palette.lastChild.innerHTML = instrIcon(m);
      });
      seqList = h('ol', { class: 'bo-seq', 'aria-label': 'Deine Anweisungen' });
      countEl = h('span', { class: 'bo-count' });
      undoBtn = h('button', { type: 'button', class: 'btn ghost bo-undo', onclick: undo }, 'Letzte entfernen');
      live = h('p', { class: 'bo-sr', 'aria-live': 'polite' });
      el.replaceChildren(h('div', { class: 'bo-board' },
        lab,
        h('section', { 'aria-label': 'Anweisungen' }, h('h3', null, 'Anweisungen'), palette),
        h('section', { 'aria-label': 'Deine Anweisungen' },
          h('div', { class: 'bo-sh' }, h('h3', null, 'Deine Folge: ', countEl), undoBtn), seqList),
        live));
      render();
    },
    isComplete: function () { return steps.length > 0; },
    evaluate: function () {
      var cur = run(steps).pop();
      return { correct: same(cur, GOAL) && steps.length === MIN, answer: steps.slice() };
    },
    setAnswer: function (ans) { steps = (ans || []).slice(0, MAXSTEPS); render(); },
    lock: function (on) { locked = on; render(); },
    reset: function () { steps = []; locked = false; render(); },
    showSolution: function () { steps = BEST.slice(); locked = true; render(); }
  });
})();
