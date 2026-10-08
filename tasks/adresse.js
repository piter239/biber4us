/* Aufgabe Adress-Erkennung (Klasse 9-10 schwer, 11-13 mittel): vier endliche Automaten, welcher erkennt genau die Biber-Mail-Adressen? */
(function () {
  'use strict';
  var h = Biber.h, sv = Biber.svg;

  var AZ = 'a-z,0-9';
  var R = 17;        /* Radius eines Zustands */
  var CORRECT = 'A';

  /* Zustände: Position (Spalte, Zeile) für die breite und die schmale Anordnung.
     kind: 's' Start, 'e' Ende, sonst normal. Kanten: von, nach, Beschriftung.
     Schleifen: loop {q, label, th: Richtung in Grad (90 = oben, -90 = unten)}.
     Bögen (nur D): sa/ea = Austritts-/Eintrittswinkel, c = Kontrollpunkt relativ zur Mitte der Zustände, lo = Beschriftungs-Versatz. */
  var SYSTEMS = [
    {
      id: 'A',
      states: { S: { k: 's', w: [0, 0], n: [0, 0] }, a: { w: [1, 0], n: [1, 0] }, b: { w: [2, 0], n: [2, 0] }, c: { w: [3, 0], n: [2, 1] }, d: { w: [4, 0], n: [1, 1] }, E: { k: 'e', w: [5, 0], n: [0, 1] } },
      edges: [['S', 'a', AZ], ['a', 'b', '@'], ['b', 'c', AZ], ['c', 'd', '.'], ['d', 'E', AZ]],
      loops: [{ q: 'a', l: AZ, w: 90, n: 90 }, { q: 'c', l: AZ, w: 90, n: -90 }, { q: 'E', l: AZ, w: 90, n: -90 }]
    },
    {
      id: 'B',
      states: { S: { k: 's', w: [0, 0], n: [0, 0] }, a: { w: [1, 0], n: [1, 0] }, b: { w: [2, 0], n: [2, 0] }, E: { k: 'e', w: [3, 0], n: [2, 1] } },
      edges: [['S', 'a', AZ], ['a', 'b', '@'], ['b', 'E', AZ + ',.']],
      loops: [{ q: 'a', l: AZ, w: 90, n: 90 }, { q: 'E', l: AZ + ',.', w: 90, n: -90 }]
    },
    {
      id: 'C',
      states: { S: { k: 's', w: [0, 0], n: [0, 0] }, a: { w: [1, 0], n: [1, 0] }, b: { w: [2, 0], n: [2, 0] }, c: { w: [3, 0], n: [2, 1] }, d: { w: [4, 0], n: [1, 1] }, E: { k: 'e', w: [5, 0], n: [0, 1] } },
      edges: [['S', 'a', AZ], ['a', 'b', '@'], ['b', 'c', AZ], ['c', 'd', '.'], ['d', 'E', AZ]],
      loops: []
    },
    {
      id: 'D',
      states: { S: { k: 's', w: [0, 0], n: [0, 0] }, a: { w: [1, 0], n: [1, 0] }, b: { w: [2, 0], n: [2, 0] }, E: { k: 'e', w: [3, 0], n: [1, 1] } },
      edges: [['S', 'a', AZ], ['a', 'b', '@'], { w: ['a', 'E', '.', -60, -120, 0, 50, 0, 17], n: ['a', 'E', '.'] }],
      arcs: [['b', 'a', AZ, 120, 60, 0, -50, 0, -8]],
      loops: [{ q: 'a', l: AZ, w: 128, n: 128 }, { q: 'E', l: AZ, w: 90, n: 0 }]
    }
  ];

  /* ------- Zeichnen ------- */
  var DX = 108, DY = 112, X0 = 40, Y0 = { w: 78, n: 78 };
  var uid = 0;

  function rad(d) { return d * Math.PI / 180; }
  function pt(c, r, deg) { return [c[0] + r * Math.cos(rad(deg)), c[1] - r * Math.sin(rad(deg))]; }
  function f(n) { return Math.round(n * 10) / 10; }
  function P(p) { return f(p[0]) + ' ' + f(p[1]); }

  function build(sys, lay) {
    var id = 'adm' + (++uid);
    var pos = {};
    var maxX = 0, maxY = 0, minX = 1e9;
    Object.keys(sys.states).forEach(function (q) {
      var g = sys.states[q][lay];
      pos[q] = [X0 + g[0] * (lay === 'w' ? DX : 110), Y0[lay] + g[1] * DY];
      maxX = Math.max(maxX, pos[q][0]); maxY = Math.max(maxY, pos[q][1]);
    });
    var W = maxX + X0, H = maxY + 70;
    var kids = [];
    kids.push(sv('defs', {}, sv('marker', { id: id, viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '8', markerHeight: '8', orient: 'auto-start-reverse' },
      sv('path', { d: 'M0 0 L10 5 L0 10 z', class: 'ad-ah' }))));

    function lab(text, x, y, anchor) {
      var big = text === '.' || text === '@';
      return sv('text', { x: f(x), y: f(y), 'text-anchor': anchor || 'middle', class: 'ad-lab' + (big ? ' big' : '') }, text === '.' ? '•' : text);
    }
    function ring(q) { return sys.states[q].k === 'e' ? R + 2 : R; }

    function straight(a, b, text) {
      var pa = pos[a], pb = pos[b];
      var dx = pb[0] - pa[0], dy = pb[1] - pa[1], len = Math.sqrt(dx * dx + dy * dy);
      var ux = dx / len, uy = dy / len;
      var p1 = [pa[0] + ux * (ring(a) + 3), pa[1] + uy * (ring(a) + 3)];
      var p2 = [pb[0] - ux * (ring(b) + 3), pb[1] - uy * (ring(b) + 3)];
      kids.push(sv('path', { d: 'M' + P(p1) + 'L' + P(p2), class: 'ad-edge', 'marker-end': 'url(#' + id + ')' }));
      var mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2;
      if (Math.abs(dy) < 1) kids.push(lab(text, mx, my - 9));
      else kids.push(lab(text, mx + 9, my + 5, 'start'));
    }
    function arc(a, b, text, sa, ea, cx, cy, lx, ly) {
      var pa = pos[a], pb = pos[b];
      var p1 = pt(pa, ring(a) + 1, sa), p2 = pt(pb, ring(b) + 4, ea);
      var m = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2];
      var c = [m[0] + cx, m[1] + cy];
      kids.push(sv('path', { d: 'M' + P(p1) + 'Q' + P(c) + ' ' + P(p2), class: 'ad-edge', 'marker-end': 'url(#' + id + ')' }));
      var mid = [0.25 * p1[0] + 0.5 * c[0] + 0.25 * p2[0], 0.25 * p1[1] + 0.5 * c[1] + 0.25 * p2[1]];
      kids.push(lab(text, mid[0] + lx, mid[1] + ly + (ly > 0 ? 8 : 0)));
    }
    function loop(q, text, th) {
      var c = pos[q], r = ring(q);
      var p1 = pt(c, r + 1, th + 30), p2 = pt(c, r + 4, th - 30);
      var c1 = pt(c, r + 50, th + 42), c2 = pt(c, r + 50, th - 42);
      kids.push(sv('path', { d: 'M' + P(p1) + 'C' + P(c1) + ' ' + P(c2) + ' ' + P(p2), class: 'ad-edge', 'marker-end': 'url(#' + id + ')' }));
      var lp = pt(c, r + 40, th);
      var anchor = 'middle', lx = lp[0], ly = lp[1];
      if (Math.abs(th) < 15) { anchor = 'start'; lx += 8; ly += 5; }
      else if (th > 0) ly -= 7; else ly += 12;
      kids.push(lab(text, lx, ly, anchor));
    }

    sys.edges.forEach(function (e) {
      if (Array.isArray(e)) return straight(e[0], e[1], e[2]);
      var sp = e[lay];
      if (sp.length > 3) arc.apply(null, sp); else straight(sp[0], sp[1], sp[2]);
    });
    (sys.arcs || []).forEach(function (a) { arc.apply(null, a); });
    sys.loops.forEach(function (l) { loop(l.q, l.l, l[lay]); });

    Object.keys(sys.states).forEach(function (q) {
      var st = sys.states[q], c = pos[q], g = [];
      if (st.k === 's') g.push(sv('circle', { cx: f(c[0]), cy: f(c[1]), r: R, class: 'ad-s' }), sv('text', { x: f(c[0]), y: f(c[1] + 6), 'text-anchor': 'middle', class: 'ad-st' }, 'S'));
      else if (st.k === 'e') g.push(sv('circle', { cx: f(c[0]), cy: f(c[1]), r: R + 2, class: 'ad-s' }), sv('circle', { cx: f(c[0]), cy: f(c[1]), r: R - 3, class: 'ad-in' }), sv('text', { x: f(c[0]), y: f(c[1] + 6), 'text-anchor': 'middle', class: 'ad-et' }, 'E'));
      else g.push(sv('circle', { cx: f(c[0]), cy: f(c[1]), r: R, class: 'ad-q' }));
      kids.push(sv('g', {}, g));
    });
    var svg = sv.apply(null, ['svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'ad-svg ad-' + lay, 'aria-hidden': 'true', focusable: 'false', style: 'max-width:' + W + 'px' }].concat(kids));
    return svg;
  }

  /* Beschreibung für Screenreader */
  function describe(sys) {
    var names = {}, n = 0;
    Object.keys(sys.states).forEach(function (q) { names[q] = sys.states[q].k === 's' ? 'S' : sys.states[q].k === 'e' ? 'E' : 'Zustand ' + (++n); });
    var t = [];
    function say(l) { return l === AZ ? 'a bis z oder 0 bis 9' : l === '.' ? 'Punkt' : l === '@' ? 'At-Zeichen' : l === AZ + ',.' ? 'a bis z, 0 bis 9 oder Punkt' : l; }
    sys.edges.forEach(function (e) {
      var s = Array.isArray(e) ? e : e.n;
      t.push(names[s[0]] + ' nach ' + names[s[1]] + ' bei ' + say(s[2]));
    });
    (sys.arcs || []).forEach(function (a) { t.push(names[a[0]] + ' zurück nach ' + names[a[1]] + ' bei ' + say(a[2])); });
    sys.loops.forEach(function (l) { t.push(names[l.q] + ' bleibt bei ' + say(l.l) + ' im selben Zustand'); });
    return t.join('; ');
  }

  /* ------- Simulation (für die Erklärung und zur Kontrolle) ------- */
  var WHY = {
    A: 'Benutzername (Schleife), @, Domäne (Schleife), Punkt, Top-Level-Domäne (Schleife) - jeder Teil besteht aus mindestens einem Zeichen, und nur so kommt man nach E.',
    B: 'Nach dem @ darf man auch Punkte schreiben, aber es muss keiner kommen: „a@b“ wird erkannt, obwohl der Punkt und die Top-Level-Domäne fehlen. Auch „a@.“ wird erkannt.',
    C: 'Es gibt keine Schleifen, also sind alle Teile genau ein Zeichen lang. „bebro@birke2.amfluss“ wird nicht erkannt, nur zum Beispiel „a@b.c“.',
    D: 'Von Zustand 1 führt der Punkt direkt nach E, ohne dass vorher ein @ nötig war: „a.b“ (und sogar „a.“) wird erkannt, obwohl es kein @ und keine Domäne gibt.'
  };
  var EX = { A: ['bebro@birke2.amfluss', 'a@b.c'], B: ['a@b', 'a@.'], C: ['ab@c.d', 'bebro@birke2.amfluss'], D: ['a.b', 'a.'] };

  var el, api;
  var choice, locked, mark;       /* mark: null | 'check' | 'solution' */

  function reset() { choice = null; mark = null; }

  function render() {
    var cards = SYSTEMS.map(function (s, i) {
      var cls = 'ad-card' + (choice === s.id ? ' sel' : '');
      var badge = null;
      if (mark === 'check' && choice === s.id) {
        var ok = s.id === CORRECT;
        cls += ok ? ' right' : ' wrong';
        badge = h('span', { class: 'ad-mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      } else if (mark === 'solution' && s.id === CORRECT) cls += ' right';
      var tab = choice ? (choice === s.id ? '0' : '-1') : (i === 0 ? '0' : '-1');
      return h('button', {
        type: 'button', role: 'radio', class: cls, 'data-sys': s.id, 'aria-checked': String(choice === s.id),
        tabindex: tab, disabled: locked,
        'aria-label': 'System ' + s.id + ': ' + describe(s)
      },
        h('span', { class: 'ad-name', 'aria-hidden': 'true' }, s.id + ')'),
        h('span', { class: 'ad-dia' }, build(s, 'w'), build(s, 'n')),
        badge);
    });
    el.replaceChildren(h('div', { class: 'ad-board', role: 'radiogroup', 'aria-label': 'Die vier Systeme A bis D' }, cards));
  }

  function pick(id) {
    if (locked) return;
    choice = id;
    render();
    var b = el.querySelector('[data-sys="' + id + '"]');
    if (b) b.focus();
    api.changed('System ' + id + ' ausgewählt.');
  }
  function onClick(e) {
    var b = e.target.closest('[data-sys]');
    if (b && !locked) pick(b.dataset.sys);
  }
  function onKey(e) {
    var b = e.target.closest('[data-sys]');
    if (!b || locked) return;
    var i = SYSTEMS.map(function (s) { return s.id; }).indexOf(b.dataset.sys), d = 0;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') d = 1;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') d = -1;
    else return;
    e.preventDefault();
    pick(SYSTEMS[(i + d + SYSTEMS.length) % SYSTEMS.length].id);
  }

  Biber.register({
    id: 'adresse',
    story: '<p>Die IT-Biber brauchen ein System, das erkennt, ob eine Zeichenfolge eine Biber-Mail-Adresse ist. Eine Biber-Mail-Adresse besteht aus drei Teilen:</p>' +
      '<ul><li>dem <strong>Benutzernamen</strong>: eine beliebige, nicht leere Zeichenfolge aus Kleinbuchstaben (a-z) und Ziffern (0-9),</li>' +
      '<li>dem <strong>At-Zeichen</strong> (@) und</li>' +
      '<li>dem <strong>Servernamen</strong>, der wiederum aus drei Teilen besteht:' +
      '<ul><li>dem Domänennamen: eine beliebige, nicht leere Zeichenfolge aus Kleinbuchstaben und Ziffern,</li>' +
      '<li>einem Punkt (.) und</li>' +
      '<li>dem Top-Level-Domänennamen: eine beliebige, nicht leere Zeichenfolge aus Kleinbuchstaben und Ziffern.</li></ul></li></ul>' +
      '<p>„Nicht leere“ Zeichenfolgen bestehen aus mindestens einem Zeichen. Ein Beispiel für eine Biber-Mail-Adresse ist: <code>bebro@birke2.amfluss</code></p>' +
      '<p>Die IT-Biber überlegen sich vier Systeme und beschreiben sie mit Diagrammen aus Kreisen und Pfeilen. Ein Kreis steht für einen der Zustände, in denen das System sein kann. Ein Pfeil beschreibt den Wechsel zu einem nächsten, möglicherweise gleichen Zustand. Die Beschriftung des Pfeils sagt, zu welchen Zeichen dieser Zustandswechsel passt.</p>' +
      '<p>Ein System untersucht eine Zeichenfolge Zeichen für Zeichen, von links nach rechts, und ist zu Beginn im Zustand <strong>S</strong>. Der nächste Zustand hängt vom aktuell untersuchten Zeichen ab: Das System folgt dem Zustandswechsel, der zum aktuellen Zeichen passt. Ist das System nach dem letzten Zeichen im Zustand <strong>E</strong>, hat es die Zeichenfolge als Biber-Mail-Adresse erkannt.</p>',
    question: 'Nur eines dieser Systeme erkennt alle möglichen Biber-Mail-Adressen korrekt. Welches?',
    howto: 'Tippe auf das System, das du für richtig hältst. Ein Punkt (•) an einem Pfeil bedeutet das Zeichen „.“.',
    explanation: function () {
      return '<p>Richtig ist <strong>System A</strong>: Es erkennt genau die Zeichenfolgen „Benutzername @ Domäne . Top-Level-Domäne“. Jeder der drei Teile besteht aus mindestens einem Zeichen (Pfeil zum nächsten Zustand) und darf beliebig lang sein (Schleife). Man kommt nur nach E, wenn das @ und danach der Punkt vorkommen.</p>' +
        '<p>Die anderen Systeme erkennen auch falsche Zeichenfolgen oder lehnen richtige ab:</p>' +
        '<ul class="ad-why">' + ['B', 'C', 'D'].map(function (k) {
          return '<li><strong>System ' + k + ':</strong> ' + WHY[k] + '</li>';
        }).join('') + '</ul>' +
        '<p>Solche Systeme heißen <em>endliche Automaten</em>. Sie merken sich nur den aktuellen Zustand und können damit zum Beispiel prüfen, ob Eingaben einem festen Muster folgen (ein „regulärer Ausdruck“).</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKey);
      render();
    },
    isComplete: function () { return !!choice; },
    evaluate: function () { return { correct: choice === CORRECT, answer: { choice: choice } }; },
    setAnswer: function (ans) {
      choice = ans && ans.choice ? ans.choice : null;
      mark = choice === CORRECT ? 'check' : 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? 'check' : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      choice = CORRECT; mark = 'solution'; locked = true;
      render();
    }
  });
})();
