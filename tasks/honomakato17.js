/* Aufgabe Honomakato (Heft 2017, S. 25) - robustes Netz: Graph ohne Brücke */
(function () {
  'use strict';
  var h = Biber.h, S = Biber.svg;

  /* Koordinaten in Punkten der Heftseite (Karte: Kreis mit Mittelpunkt (281, 346.3), Radius 131.2) */
  var VIEW = { x: 149.8, y: 215.1, w: 262.4, h: 262.4 };
  var ISLANDS = {
    No: { name: 'No', img: 'assets/honomakato17/no.png', x: 249.4, y: 233.2, w: 47.5, h: 48.5, cx: 270, cy: 262 },
    Ho: { name: 'Ho', img: 'assets/honomakato17/ho.png', x: 178.2, y: 316.6, w: 59, h: 60.4, cx: 208, cy: 356 },
    Ma: { name: 'Ma', img: 'assets/honomakato17/ma.png', x: 359.2, y: 288.3, w: 32.6, h: 58.4, cx: 377, cy: 325 },
    Ka: { name: 'Ka', img: 'assets/honomakato17/ka.png', x: 284.3, y: 331.9, w: 32.2, h: 60.4, cx: 301, cy: 350 },
    To: { name: 'To', img: 'assets/honomakato17/to.png', x: 255.6, y: 408.2, w: 47.8, h: 59.8, cx: 277, cy: 452 }
  };
  var ORDER = ['No', 'Ho', 'Ka', 'Ma', 'To'];
  /* schon verlegte Kupferkabel (Anfang und Ende wie im Heft an den Inselrändern) */
  var BASE = [
    { id: 'Ho-No', a: [228.1, 318.9], b: [259.8, 275.7] },
    { id: 'Ho-Ka', a: [228.1, 350.2], b: [289.2, 360.3] },
    { id: 'Ka-Ma', a: [306.2, 358.7], b: [361.1, 326.1] },
    { id: 'Ka-To', a: [293.0, 388.9], b: [279.5, 438.0] }
  ];
  var FIBER = { a: [150.2, 334.1], b: [204.7, 346.8] };
  var SOLUTION = ['Ho-Ma', 'No-To'];

  function key(a, b) { return [a, b].sort().join('-'); }
  function ends(k) { return k.split('-'); }
  function pt(p) { return { x: p[0], y: p[1] }; }

  /* Zusammenhang aller Inseln mit Ho (dort liegt das Glasfaserkabel); ohne ein bestimmtes Kabel */
  function connected(edges, skip) {
    var seen = { Ho: 1 }, stack = ['Ho'];
    while (stack.length) {
      var u = stack.pop();
      edges.forEach(function (e) {
        if (e === skip) return;
        var p = ends(e), w = p[0] === u ? p[1] : p[1] === u ? p[0] : null;
        if (w && !seen[w]) { seen[w] = 1; stack.push(w); }
      });
    }
    return ORDER.every(function (n) { return seen[n]; });
  }
  function bridges(edges) { return edges.filter(function (e) { return !connected(edges, e); }); }
  function robust(edges) { return connected(edges) && bridges(edges).length === 0; }

  var baseKeys = BASE.map(function (b) { return b.id; });
  var el, api, added, sel, locked, mode, msg, svgEl, msgEl, btnConnect, btnCut, listEl;

  function fresh() { added = []; sel = []; msg = ''; mode = null; }

  function allEdges() { return baseKeys.concat(added); }
  function pairName(k) { var p = ends(k); return p[0] + '–' + p[1]; }

  function line(a, b, cls) {
    return S('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: cls, 'stroke-linecap': 'round' });
  }

  function render() {
    var weak = mode === 'check' && !robust(allEdges()) ? bridges(allEdges()) : [];
    var kids = [];
    kids.push(S('circle', { cx: 281, cy: 346.3, r: 131.2, class: 't-honomakato17-sea' }));
    kids.push(line(pt(FIBER.a), pt(FIBER.b), 't-honomakato17-fiber'));
    BASE.forEach(function (c) {
      kids.push(line(pt(c.a), pt(c.b), 't-honomakato17-cu' + (weak.indexOf(c.id) >= 0 ? ' weak' : '')));
    });
    ORDER.forEach(function (n) {
      var i = ISLANDS[n];
      var isSel = sel.indexOf(n) >= 0;
      var g = S('g', {
        class: 't-honomakato17-island' + (isSel ? ' sel' : ''), tabindex: locked ? '-1' : '0', role: 'button', 'data-island': n,
        'aria-pressed': String(isSel), 'aria-label': 'Insel ' + n + (isSel ? ', ausgewählt' : ''), 'aria-disabled': locked ? 'true' : 'false'
      },
      S('rect', { x: i.x - 2, y: i.y - 2, width: i.w + 4, height: i.h + 4, rx: 7, class: 't-honomakato17-halo' }),
      S('image', { href: i.img, x: i.x, y: i.y, width: i.w, height: i.h, preserveAspectRatio: 'none' }));
      kids.push(g);
    });
    added.forEach(function (k) {
      var p = ends(k);
      var a = ISLANDS[p[0]], b = ISLANDS[p[1]];
      var cls = 't-honomakato17-new' + (mode === 'solution' || mode === 'check' ? (weak.length ? ' bad' : ' ok') : '');
      /* Enden etwas vor den Inselnamen enden lassen, damit die Beschriftung lesbar bleibt */
      var dx = b.cx - a.cx, dy = b.cy - a.cy, d = Math.sqrt(dx * dx + dy * dy), r = 11;
      var p1 = { x: a.cx + dx / d * r, y: a.cy + dy / d * r }, p2 = { x: b.cx - dx / d * r, y: b.cy - dy / d * r };
      kids.push(S('g', { class: cls, 'pointer-events': 'none' }, line(p1, p2, 'under'), line(p1, p2, 'over')));
    });
    svgEl = S.apply(null, ['svg', {
      viewBox: VIEW.x + ' ' + VIEW.y + ' ' + VIEW.w + ' ' + VIEW.h, class: 't-honomakato17-map', role: 'group',
      'aria-label': 'Karte der Inselgruppe Honomakato mit den Inseln No, Ho, Ka, Ma und To. Ho ist über ein Glasfaserkabel mit dem Internet verbunden. ' +
        'Kupferkabel liegen zwischen Ho und No, Ho und Ka, Ka und Ma sowie Ka und To.'
    }].concat(kids));

    var two = sel.length === 2;
    var selText = sel.length ? 'Ausgewählt: ' + sel.map(function (n) { return n; }).join(' und ') + '.' : 'Wähle zwei Inseln aus.';
    btnConnect = h('button', { type: 'button', class: 'btn', 'data-act2': 'connect', disabled: locked || !two }, 'verbinden');
    btnCut = h('button', { type: 'button', class: 'btn ghost', 'data-act2': 'cut', disabled: locked || !two }, 'trennen');
    listEl = h('p', { class: 't-honomakato17-list' },
      'Neue Kabel (' + added.length + ' von 2): ',
      added.length ? h('b', null, added.map(pairName).join(', ')) : '–');
    msgEl = h('p', { class: 't-honomakato17-msg', role: 'status', 'aria-live': 'polite' }, msg || (locked ? '' : selText));
    el.replaceChildren(h('div', { class: 't-honomakato17-wrap' },
      h('div', { class: 't-honomakato17-panel' }, svgEl),
      h('div', { class: 't-honomakato17-bar' }, btnConnect, btnCut),
      listEl, msgEl));
    if (weak.length) {
      msgEl.textContent = 'Rot gestrichelt: Fällt dieses Kabel aus, ist mindestens eine Insel nicht mehr mit dem Internet verbunden.';
    }
  }

  function setMsg(t) { msg = t; if (msgEl) msgEl.textContent = t; }

  function toggle(n) {
    if (locked) return;
    var i = sel.indexOf(n);
    if (i >= 0) sel.splice(i, 1); else { sel.push(n); if (sel.length > 2) sel.shift(); }
    msg = '';
    render();
    var f = el.querySelector('[data-island="' + n + '"]');
    if (f) f.focus({ preventScroll: true });
  }

  function connect() {
    if (locked || sel.length !== 2) return;
    var k = key(sel[0], sel[1]);
    if (allEdges().indexOf(k) >= 0) { setMsg('Zwischen ' + pairName(k) + ' liegt schon ein Kabel.'); return; }
    if (added.length >= 2) { setMsg('Du sollst nur zwei weitere Kabel verlegen. Entferne zuerst ein neues Kabel mit „trennen“.'); return; }
    added.push(k);
    sel = [];
    msg = 'Kabel ' + pairName(k) + ' verlegt.';
    render();
    api.changed(added.length + ' von 2 neuen Kabeln verlegt.');
  }
  function cut() {
    if (locked || sel.length !== 2) return;
    var k = key(sel[0], sel[1]);
    var i = added.indexOf(k);
    if (i < 0) {
      setMsg(baseKeys.indexOf(k) >= 0 ? 'Dieses Kabel ist schon verlegt und bleibt liegen. Du kannst nur neue Kabel entfernen.' : 'Zwischen ' + pairName(k) + ' liegt kein Kabel.');
      return;
    }
    added.splice(i, 1);
    sel = [];
    msg = 'Kabel ' + pairName(k) + ' entfernt.';
    render();
    api.changed(added.length + ' von 2 neuen Kabeln verlegt.');
  }

  function onClick(e) {
    var g = e.target.closest('[data-island]');
    if (g) return toggle(g.getAttribute('data-island'));
    var b = e.target.closest('[data-act2]');
    if (!b) return;
    if (b.getAttribute('data-act2') === 'connect') connect(); else cut();
  }
  function onKey(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var g = e.target.closest && e.target.closest('[data-island]');
    if (!g) return;
    e.preventDefault();
    toggle(g.getAttribute('data-island'));
  }

  Biber.register({
    id: 'honomakato17',
    story: '<p>Die Inselgruppe Honomakato besteht aus den fünf Inseln Ho, No, Ma, Ka und To. ' +
      'Die Hauptinsel Ho ist über ein Glasfaserkabel mit dem Internet verbunden. ' +
      'Außerdem sind einige Kupferkabel verlegt: zwischen Ho und No, Ho und Ka, Ka und Ma sowie Ka und To. ' +
      'So sind alle Inseln mit Ho verbunden und dadurch auch mit dem Internet.</p>' +
      '<p>Die Bewohner von Honomakato möchten eine robuste Verbindung aller Inseln mit dem Internet: ' +
      'Auch wenn irgendeines der Kupferkabel beschädigt würde, sollte jede Insel noch mit dem Internet verbunden sein.</p>',
    question: 'Sorge dafür, dass Honomakato eine robuste Verbindung mit dem Internet bekommt. Verlege dazu zwei weitere Kupferkabel zwischen den Inseln.',
    howto: 'Um zwischen zwei Inseln ein Kabel zu verlegen, tippe auf die beiden Inseln und dann auf „verbinden“. Tippe auf „trennen“, um ein neues Kabel wieder zu entfernen. Es gibt mehrere richtige Antworten.',
    explanation: function () {
      return '<p>Das Netz ist robust, wenn jede Insel mindestens zwei Verbindungen hat und es kein einzelnes Kabel gibt, dessen Ausfall das Netz in zwei Teile trennt. ' +
        'Dafür müssen die Inseln No, Ma und To, die bisher nur an einem Kabel hängen, jeweils ein zweites bekommen. Es gibt genau sechs richtige Lösungen: ' +
        'Ho–Ma und No–To, Ho–To und No–Ma, No–To und No–Ma, No–To und Ma–To, No–Ka und Ma–To sowie No–Ma und Ma–To.</p>' +
        '<p>Das ist Informatik: Das Internet wurde als robustes Netzwerk erfunden, bei dem der Ausfall einer Leitung nicht alles lahmlegt. ' +
        'In der Graphentheorie heißt ein Netz aus Knoten und Kanten „zusammenhängend“, wenn man von jedem Knoten zu jedem anderen kommt. ' +
        'Eine Kante, ohne die der Graph nicht mehr zusammenhängt, nennt man Brücke. Robert Tarjan hat dafür ein effizientes Verfahren zum Finden von Brücken entwickelt.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; fresh();
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKey);
      render();
    },
    isComplete: function () { return added.length === 2; },
    evaluate: function () { return { correct: robust(allEdges()), answer: added.slice() }; },
    setAnswer: function (ans) {
      added = Array.isArray(ans) ? ans.slice(0, 2) : [];
      sel = []; msg = '';
      mode = 'check';
      render();
    },
    lock: function (on) { locked = on; sel = []; msg = ''; mode = on ? 'check' : null; render(); },
    reset: function () { fresh(); render(); },
    showSolution: function () { added = SOLUTION.slice(); sel = []; msg = ''; locked = true; mode = 'solution'; render(); }
  });
})();
