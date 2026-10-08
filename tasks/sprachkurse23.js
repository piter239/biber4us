/* Aufgabe Sprachkurse (Heft 2023, S. 58; Klasse 7-8, 11-13): Zuordnung in einem bipartiten Graphen */
(function () {
  'use strict';
  var h = Biber.h, svg = Biber.svg;

  var COURSES = [
    { id: 'en', name: 'Englisch', word: 'Hello', fill: '#82b4ff', ink: '#14304f', teachers: 'ABCDF' },
    { id: 'es', name: 'Spanisch', word: 'Hola', fill: '#ffdf1f', ink: '#2e2600', teachers: 'DE' },
    { id: 'hu', name: 'Ungarisch', word: 'Szia', fill: '#ffffff', ink: '#222222', teachers: 'D' },
    { id: 'it', name: 'Italienisch', word: 'Ciao', fill: '#12a33a', ink: '#ffffff', teachers: 'BDEFG' }
  ];
  var PEOPLE = 'ABCDEFG'.split('');
  var W = 560, H = 450, CX0 = 90, CDX = 130, PX0 = 40, PDX = 80, YC = 122, YP = 336;

  /* Kanten laut Bild im Heft (Linien zwischen Kurs und Lehrperson) */
  var EDGES = [];
  COURSES.forEach(function (c, ci) {
    c.teachers.split('').forEach(function (p) { EDGES.push({ id: c.id + '-' + p, c: c.id, ci: ci, p: p, pi: PEOPLE.indexOf(p) }); });
  });
  EDGES.forEach(function (e) {
    var mine = EDGES.filter(function (o) { return o.ci === e.ci; });
    var n = mine.length, r = mine.indexOf(e);
    e.x1 = CX0 + CDX * e.ci + (r - (n - 1) / 2) * 11; e.y1 = YC;
    var inc = EDGES.filter(function (o) { return o.pi === e.pi; });
    var m = inc.length, q = inc.indexOf(e);
    e.x2 = PX0 + PDX * e.pi + (q - (m - 1) / 2) * 8; e.y2 = YP;
    e.name = COURSES[e.ci].name + ' mit Lehrperson ' + e.p;
  });
  function edgeById(id) { return EDGES.filter(function (e) { return e.id === id; })[0]; }
  var SOLUTION = ['en-A', 'es-E', 'hu-D', 'it-B'];   /* eine von zehn richtigen Zuordnungen (Heft: Englisch A, Italienisch B, Ungarisch D, Spanisch E) */

  /* richtig: genau eine Linie je Kurs und jede Lehrperson höchstens einmal */
  function analyse(ids) {
    var perC = {}, perP = {};
    ids.forEach(function (id) { var e = edgeById(id); perC[e.c] = (perC[e.c] || 0) + 1; perP[e.p] = (perP[e.p] || 0) + 1; });
    var bad = {}, ok = ids.length === 4;
    ids.forEach(function (id) {
      var e = edgeById(id);
      if (perC[e.c] > 1 || perP[e.p] > 1) bad[id] = true;
    });
    COURSES.forEach(function (c) { if (perC[c.id] !== 1) ok = false; });
    Object.keys(perP).forEach(function (p) { if (perP[p] > 1) ok = false; });
    return { ok: ok, bad: bad, perC: perC, perP: perP };
  }

  function dist(e, x, y) {
    var dx = e.x2 - e.x1, dy = e.y2 - e.y1, t = ((x - e.x1) * dx + (y - e.y1) * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t));
    var px = e.x1 + t * dx, py = e.y1 + t * dy;
    return Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
  }

  var el, api, svgEl, picked, locked, mark, hover;   /* mark: null | 'check' | 'solution' */

  function reset() { picked = []; mark = null; hover = null; }

  function courseIcon(c, i) {
    var x = CX0 + CDX * i;
    var g = svg('g', { 'aria-hidden': 'true' });
    g.innerHTML =
      '<text x="' + x + '" y="16" text-anchor="middle" class="t-sprachkurse23-cname">' + c.name + '</text>' +
      '<circle cx="' + x + '" cy="80" r="31" fill="#e8ecef" stroke="#222" stroke-width="2.2"/>' +
      '<path d="M' + (x - 8) + ' 62 q8 -8 14 0 q4 8 -4 10 q-8 -2 -10 -10z M' + (x + 8) + ' 82 q8 -4 14 4 q-2 10 -10 8 q-6 -6 -4 -12z M' + (x - 20) + ' 90 q6 2 6 8 q-8 2 -6 -8z" fill="#c4ccd2" stroke="#555" stroke-width="1"/>' +
      '<path d="M' + (x - 30) + ' 48 L' + x + ' 36 L' + (x + 30) + ' 48 L' + x + ' 60z" fill="' + c.fill + '" stroke="#222" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<path d="M' + (x - 14) + ' 54 L' + (x - 14) + ' 66 Q' + x + ' 74 ' + (x + 14) + ' 66 L' + (x + 14) + ' 54" fill="' + c.fill + '" stroke="#222" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<path d="M' + x + ' 48 L' + (x + 24) + ' 54 L' + (x + 24) + ' 70" fill="none" stroke="#222" stroke-width="1.8"/>' +
      '<ellipse cx="' + (x - 20) + '" cy="96" rx="27" ry="14" fill="' + c.fill + '" stroke="#222" stroke-width="2.2"/>' +
      '<path d="M' + (x - 38) + ' 104 L' + (x - 46) + ' 114 L' + (x - 28) + ' 108z" fill="' + c.fill + '" stroke="#222" stroke-width="2" stroke-linejoin="round"/>' +
      '<text x="' + (x - 20) + '" y="101" text-anchor="middle" class="t-sprachkurse23-word" fill="' + c.ink + '">' + c.word + '</text>';
    return g;
  }
  function personIcon(p, j) {
    var x = PX0 + PDX * j;
    var g = svg('g', { 'aria-hidden': 'true' });
    g.innerHTML =
      '<circle cx="' + x + '" cy="356" r="14" fill="#fff" stroke="#222" stroke-width="2.2"/>' +
      '<path d="M' + (x - 34) + ' 412 Q' + (x - 34) + ' 376 ' + (x - 12) + ' 374 L' + (x + 12) + ' 374 Q' + (x + 34) + ' 376 ' + (x + 34) + ' 412" fill="#fff" stroke="#222" stroke-width="2.2" stroke-linecap="round"/>' +
      '<text x="' + x + '" y="437" text-anchor="middle" class="t-sprachkurse23-pname">' + p + '</text>';
    return g;
  }

  function build() {
    svgEl = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 't-sprachkurse23-svg', role: 'group', 'aria-label': 'Vier Sprachkurse oben, sieben Lehrpersonen A bis G unten, dazwischen Linien für die geeigneten Lehrpersonen' });
    COURSES.forEach(function (c, i) { svgEl.appendChild(courseIcon(c, i)); });
    PEOPLE.forEach(function (p, j) { svgEl.appendChild(personIcon(p, j)); });
    var lines = svg('g', { class: 't-sprachkurse23-lines' });
    EDGES.forEach(function (e) {
      var g = svg('g', { class: 't-sprachkurse23-edge', 'data-edge': e.id, role: 'checkbox', tabindex: '0', 'aria-checked': 'false', 'aria-label': e.name });
      g.appendChild(svg('line', { class: 't-sprachkurse23-halo', x1: e.x1, y1: e.y1, x2: e.x2, y2: e.y2 }));
      g.appendChild(svg('line', { class: 't-sprachkurse23-line', x1: e.x1, y1: e.y1, x2: e.x2, y2: e.y2 }));
      lines.appendChild(g);
    });
    svgEl.appendChild(lines);
    return svgEl;
  }

  function refresh() {
    var an = analyse(picked);
    EDGES.forEach(function (e) {
      var g = svgEl.querySelector('[data-edge="' + e.id + '"]');
      var on = picked.indexOf(e.id) >= 0;
      var cls = 't-sprachkurse23-edge' + (on ? ' on' : '') + (hover === e.id && !locked ? ' hover' : '');
      if (on && mark === 'check') cls += an.ok || mark === 'solution' ? ' right' : (an.bad[e.id] ? ' wrong' : '');
      if (on && mark === 'solution') cls += ' right';
      g.setAttribute('class', cls);
      g.setAttribute('aria-checked', String(on));
      g.setAttribute('tabindex', locked ? '-1' : '0');
    });
    svgEl.classList.toggle('locked', !!locked);
    var sum = el.querySelector('.t-sprachkurse23-sum');
    if (sum) sum.textContent = picked.length ? 'Markiert: ' + picked.map(function (id) { var e = edgeById(id); return e.c === 'en' ? 'Englisch – ' + e.p : COURSES[e.ci].name + ' – ' + e.p; }).join(', ') + '.' : 'Noch keine Linie markiert.';
  }

  function toggle(id) {
    if (locked) return;
    var i = picked.indexOf(id);
    if (i >= 0) picked.splice(i, 1); else picked.push(id);
    mark = null;
    refresh();
    api.changed(picked.length + ' von 4 Linien markiert.');
  }

  function nearest(ev) {
    var pt = svgEl.createSVGPoint();
    pt.x = ev.clientX; pt.y = ev.clientY;
    var m = svgEl.getScreenCTM();
    if (!m) return null;
    var p = pt.matrixTransform(m.inverse());
    var sc = svgEl.getBoundingClientRect().width / W || 1;
    var lim = Math.max(12, 20 / sc);   /* etwa 20 Bildschirmpunkte Fangbereich */
    var best = null, bd = lim;
    EDGES.forEach(function (e) { var d = dist(e, p.x, p.y); if (d < bd) { bd = d; best = e; } });
    return best ? best.id : null;
  }

  function mount(root, a) {
    el = root; api = a; locked = false; reset();
    var wrap = h('div', { class: 't-sprachkurse23-board' },
      h('div', { class: 't-sprachkurse23-stage' }, build()),
      h('p', { class: 't-sprachkurse23-sum', 'aria-live': 'polite' }, ''));
    el.replaceChildren(wrap);
    svgEl.addEventListener('click', function (ev) {
      if (locked) return;
      var id = nearest(ev);
      if (id) toggle(id);
    });
    svgEl.addEventListener('pointermove', function (ev) {
      if (locked || ev.pointerType === 'touch') return;
      var id = nearest(ev);
      if (id !== hover) { hover = id; refresh(); }
    });
    svgEl.addEventListener('pointerleave', function () { if (hover) { hover = null; refresh(); } });
    svgEl.addEventListener('keydown', function (ev) {
      var g = ev.target.closest && ev.target.closest('[data-edge]');
      if (g && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); toggle(g.dataset.edge); }
    });
    refresh();
  }

  Biber.register({
    id: 'sprachkurse23',
    story: '<p>Eine Sprachschule plant vier Sommerkurse. Die Linien im Bild zeigen, welche Lehrperson der Schule (unten) für welchen Kurs (oben) geeignet ist. Wir nennen die Lehrpersonen A bis G.</p>' +
      '<p>Eine Lehrperson kann nur einen Kurs halten. Trotzdem gibt es mehrere Möglichkeiten, jedem Kurs eine geeignete Lehrperson zuzuordnen.</p>',
    question: 'Ordne jedem Kurs eine geeignete Lehrperson zu. Markiere dazu die Linie zwischen Person und Kurs.',
    howto: 'Tippe auf eine Linie, um sie zu markieren. Tippe sie noch einmal an, um die Markierung zu entfernen. Mit der Tab-Taste kannst du die Linien einzeln anwählen und mit Enter markieren.',
    explanation: function () {
      var an = analyse(picked), note = '';
      if (mark === 'check' && !an.ok) {
        var dup = Object.keys(an.perP).filter(function (p) { return an.perP[p] > 1; });
        var multi = COURSES.filter(function (c) { return an.perC[c.id] > 1; });
        var miss = COURSES.filter(function (c) { return !an.perC[c.id]; });
        if (dup.length) note = '<p>Bei dir hält Lehrperson ' + dup.join(' und ') + ' zwei Kurse. Das geht nicht.</p>';
        else if (multi.length) note = '<p>Bei dir hat der Kurs ' + multi.map(function (c) { return c.name; }).join(' und ') + ' mehrere Lehrpersonen. Jeder Kurs braucht genau eine.</p>';
        else if (miss.length) note = '<p>Dem Kurs ' + miss.map(function (c) { return c.name; }).join(' und ') + ' hast du keine Lehrperson zugeordnet.</p>';
      }
      return note + '<p>Fang bei dem Kurs mit der kleinsten Auswahl an. Für <b>Ungarisch</b> ist nur D geeignet, also bekommt D diesen Kurs. Dann bleibt für <b>Spanisch</b> nur noch E übrig. ' +
        'Bei Englisch (A, B, C, F) und Italienisch (B, F, G) kannst du dann recht frei wählen. B und F sind zwar für beide Kurse geeignet, dürfen aber nur einen davon halten. So ergeben sich genau 10 richtige Zuordnungen, zum Beispiel Englisch – A, Spanisch – E, Ungarisch – D, Italienisch – B.</p>' +
        '<p>Das Bild ist ein <i>bipartiter Graph</i>: Die Knoten (Kurse und Lehrpersonen) bilden zwei Gruppen, und Kanten (Linien) gibt es nur zwischen den Gruppen. Mit solchen Graphen lassen sich Zuordnungsprobleme wie Stundenpläne gut beschreiben und lösen.</p>';
    },
    mount: mount,
    isComplete: function () { return picked.length === 4; },
    evaluate: function () { return { correct: analyse(picked).ok, answer: picked.slice().sort() }; },
    setAnswer: function (ans) { picked = ans.slice(); mark = 'check'; refresh(); },
    lock: function (on) {
      locked = on;
      if (on) { if (mark !== 'solution') mark = 'check'; } else { mark = null; hover = null; }
      refresh();
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () { picked = SOLUTION.slice(); mark = 'solution'; refresh(); }
  });
})();
