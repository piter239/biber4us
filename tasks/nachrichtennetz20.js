/* Aufgabe Nachrichten-Netz (Biber 2020; Klasse 7-8 schwer, 9-10 mittel, 11-13 leicht): Zentrum eines Graphen (Broadcasting) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-nachrichtennetz20-';
  var NS = 'http://www.w3.org/2000/svg';

  /* Lage der Biber (viewBox 1000 x 640) und Leitungen wie im Heft */
  var POS = {
    L: [322, 78], I: [647, 78], D: [888, 152], G: [162, 202], J: [418, 262], B: [655, 308], K: [870, 385],
    F: [160, 425], C: [293, 560], E: [418, 515], A: [693, 515], H: [835, 563]
  };
  var NAMES = 'ABCDEFGHIJKL'.split('');
  var EDGES = [['L', 'J'], ['I', 'D'], ['G', 'J'], ['G', 'F'], ['F', 'J'], ['J', 'C'], ['J', 'B'], ['B', 'D'], ['B', 'A'], ['D', 'A'], ['D', 'K'], ['K', 'H'], ['A', 'H'], ['A', 'E'], ['E', 'C']];
  var RIGHT = 'B';   /* Heft: nur B schafft es in 2 Runden (Exzentrizität per Skript für alle 12 Biber berechnet: B=2, A/D/E/J/…=3 oder 4) */
  var COLS = ['var(--c1)', 'var(--c2)', 'var(--c6)', 'var(--c4)', 'var(--c5)'];

  var ADJ = {};
  NAMES.forEach(function (n) { ADJ[n] = []; });
  EDGES.forEach(function (e) { ADJ[e[0]].push(e[1]); ADJ[e[1]].push(e[0]); });
  function dists(src) {
    var d = {}, q = [src];
    d[src] = 0;
    while (q.length) { var u = q.shift(); ADJ[u].forEach(function (v) { if (!(v in d)) { d[v] = d[u] + 1; q.push(v); } }); }
    return d;
  }
  var ECC = {};
  NAMES.forEach(function (n) { var d = dists(n); ECC[n] = Math.max.apply(null, NAMES.map(function (x) { return d[x]; })); });

  var el, api, selected, round, locked, mark, nodeEls, edgeEls, statusEl, nextBtn, prevBtn;

  function reset() { selected = null; round = 0; mark = null; }

  function refresh() {
    var d = selected ? dists(selected) : null;
    var have = 0;
    NAMES.forEach(function (n) {
      var g = nodeEls[n], got = d && d[n] <= round;
      if (got) have++;
      g.classList.toggle('sel', selected === n);
      g.classList.toggle('got', !!got);
      g.classList.toggle('fresh', !!got && d[n] === round && round > 0);
      g.classList.toggle('right', selected === n && mark !== null && selected === RIGHT);
      g.classList.toggle('wrong', selected === n && mark === 'check' && selected !== RIGHT);
      g.setAttribute('aria-checked', String(selected === n));
      g.setAttribute('aria-disabled', locked ? 'true' : 'false');
      g.setAttribute('tabindex', (selected ? selected === n : n === 'A') ? '0' : '-1');
      g.querySelector('.' + P + 'disc').style.setProperty('--nc', got ? COLS[Math.min(d[n], COLS.length - 1)] : 'var(--surface)');
      g.setAttribute('aria-label', 'Biber ' + n + (selected === n ? ', Startbiber' : '') + (got ? ', hat die Nachricht' : ''));
    });
    edgeEls.forEach(function (ln) {
      var a = ln.getAttribute('data-a'), b = ln.getAttribute('data-b');
      ln.classList.toggle('used', !!d && round > 0 && ((d[a] === round - 1 && d[b] === round) || (d[b] === round - 1 && d[a] === round)));
    });
    var done = d && have === NAMES.length;
    if (!selected) {
      statusEl.textContent = 'Tippe auf den Biber, der die Nachricht zuerst hat.';
    } else {
      statusEl.textContent = 'Startbiber ' + selected + ' · Runde ' + round + ': ' + have + ' von 12 Bibern haben die Nachricht.' +
        (done ? ' Alle Biber wissen Bescheid.' : '');
    }
    prevBtn.disabled = !selected || round === 0;
    nextBtn.disabled = !selected || done;
  }
  function choose(n, focus) {
    if (locked) return;
    selected = n; round = 0;
    refresh();
    if (focus) nodeEls[n].focus();
    api.changed(selected ? 'Biber ' + selected + ' gewählt' : '');
  }
  function onKey(e) {
    var n = e.currentTarget.getAttribute('data-n');
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(n, true); return; }
    var i = NAMES.indexOf(n), to = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = NAMES[(i + 1) % 12];
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = NAMES[(i + 11) % 12];
    if (to) { e.preventDefault(); nodeEls[to].setAttribute('tabindex', '0'); e.currentTarget.setAttribute('tabindex', '-1'); nodeEls[to].focus(); }
  }

  function buildSvg() {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', P + 'svg');
    svg.setAttribute('viewBox', '0 0 1000 640');
    svg.setAttribute('role', 'radiogroup');
    svg.setAttribute('aria-label', 'Nachrichten-Netz mit zwölf Bibern A bis L');
    edgeEls = EDGES.map(function (e) {
      var ln = document.createElementNS(NS, 'line');
      ln.setAttribute('class', P + 'edge');
      ln.setAttribute('x1', POS[e[0]][0]); ln.setAttribute('y1', POS[e[0]][1]);
      ln.setAttribute('x2', POS[e[1]][0]); ln.setAttribute('y2', POS[e[1]][1]);
      ln.setAttribute('data-a', e[0]); ln.setAttribute('data-b', e[1]);
      svg.appendChild(ln);
      return ln;
    });
    nodeEls = {};
    NAMES.forEach(function (n) {
      var g = document.createElementNS(NS, 'g');
      g.setAttribute('class', P + 'node');
      g.setAttribute('role', 'radio');
      g.setAttribute('data-n', n);
      g.setAttribute('transform', 'translate(' + POS[n][0] + ' ' + POS[n][1] + ')');
      g.innerHTML = '<circle r="44" class="' + P + 'hit"/><circle r="38" class="' + P + 'disc"/><text class="' + P + 'let">' + n + '</text>' ;
      g.querySelector('.' + P + 'hit').setAttribute('style', 'fill:transparent;stroke:none');
      g.addEventListener('click', function () { choose(n, false); });
      g.addEventListener('keydown', onKey);
      nodeEls[n] = g;
      svg.appendChild(g);
    });
    return svg;
  }

  Biber.register({
    id: 'nachrichtennetz20',
    story:
      '<p>Biber verbreiten gerne Nachrichten untereinander. Sie haben dazu ein Nachrichten-Netz (siehe Bild). Im Netz gibt es Nachbarn; sie sind durch eine Leitung miteinander verbunden. Zum Beispiel hat Biber F die Nachbarn G und J.</p>' +
      '<p>Die Nachrichten werden in Runden verbreitet: In einer Runde leitet jeder Biber, der eine Nachricht hat, diese gleichzeitig an alle seine Netz-Nachbarn weiter.</p>',
    question: 'Welcher Biber kann eine Nachricht in der kleinsten Anzahl Runden an alle anderen Biber im Netz verbreiten?',
    howto: 'Tippe auf den Biber, den du für richtig hältst. Mit „Nächste Runde“ kannst du ausprobieren, wie sich die Nachricht von diesem Biber aus Runde für Runde im Netz verbreitet.',
    explanation: function () {
      return '<p>Biber <strong>B</strong> schafft es in nur <strong>zwei Runden</strong>: In Runde 1 gibt B die Nachricht an seine Nachbarn A, D und J weiter. In Runde 2 geben diese sie an alle ihre Nachbarn weiter (A an E und H, D an I und K, J an C, F, G und L). Dass die Nachricht dabei auch wieder bei B ankommt, stört nicht.</p>' +
        '<p>In einer einzigen Runde geht es nicht, denn kein Biber hat alle anderen als Nachbarn. B ist außerdem der einzige, der es in zwei Runden schafft: Von C, E, F, G, H, J und L aus ist I in zwei Runden nicht erreichbar, von A, D, E, H, I und K aus ist L nicht erreichbar.</p>' +
        '<p>Die Verbreitung von Nachrichten in einem Netz, bei der jeder alles an alle Nachbarn weitergibt, heißt in der Informatik <strong>Broadcasting</strong>. Das Netz ist ein Graph (Biber = Knoten, Leitungen = Kanten). Biber B ist ein <strong>Zentrum</strong> des Graphen: Es gibt keinen Knoten, der zu allen anderen Knoten eine kleinere größte Entfernung hat. Es gibt Algorithmen, die das Zentrum eines Graphen effizient bestimmen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      statusEl = h('p', { class: P + 'status', role: 'status', 'aria-live': 'polite' });
      prevBtn = h('button', { type: 'button', class: 'btn ghost ' + P + 'btn', onclick: function () { if (round > 0) { round--; refresh(); } } }, 'Eine Runde zurück');
      nextBtn = h('button', { type: 'button', class: 'btn ghost ' + P + 'btn', onclick: function () { round++; refresh(); } }, 'Nächste Runde');
      var legend = h('p', { class: P + 'legend', 'aria-hidden': 'true' });
      legend.innerHTML = COLS.slice(0, 5).map(function (c, i) { return '<span><i style="background:' + c + '"></i>' + (i === 0 ? 'Start' : 'Runde ' + i) + '</span>'; }).join('');
      el.replaceChildren(h('div', { class: P + 'board' },
        h('div', { class: P + 'netbox' }, buildSvg()),
        legend, statusEl,
        h('div', { class: P + 'ctl' }, prevBtn, nextBtn)));
      refresh();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () { return { correct: selected === RIGHT, answer: { start: selected } }; },
    setAnswer: function (ans) {
      selected = ans && NAMES.indexOf(ans.start) >= 0 ? ans.start : null;
      round = 0; mark = 'check'; refresh();
    },
    lock: function (on) { locked = on; mark = on ? (mark === 'solution' ? 'solution' : 'check') : null; refresh(); },
    reset: function () { reset(); refresh(); },
    showSolution: function () { selected = RIGHT; round = 2; mark = 'solution'; locked = true; refresh(); }
  });
})();
