/* Aufgabe Dottis (Heft 2021, S. 19; Klasse 5-10): Einfügen in einen binären Suchbaum */
(function () {
  'use strict';
  var h = Biber.h;

  /* Punkte der fünf Dottis von links nach rechts (Heft, Bild S. 19 und Lösung S. 20) */
  var DOTS = [4, 2, 3, 1, 5];
  var ORDINAL = ['erste', 'zweite', 'dritte', 'vierte', 'fünfte'];
  /* Die fünf Nester als binärer Baum: Nest -> Nest links / rechts darüber (laut Bild im Heft).
     x/y: Lage der Nestmitte in Prozent der Bildfläche. */
  var NESTS = {
    root: { left: 'l', right: 'r', x: 60.5, y: 60, name: 'unterstes Nest am Stamm' },
    l: { left: 'll', right: 'lr', x: 46.5, y: 50.5, name: 'Nest links am Stamm' },
    ll: { left: null, right: null, x: 17, y: 37, name: 'Nest ganz links' },
    lr: { left: null, right: null, x: 59.5, y: 20, name: 'Nest ganz oben' },
    r: { left: null, right: null, x: 81.5, y: 41.5, name: 'Nest rechts' }
  };
  var NEST_IDS = ['ll', 'l', 'lr', 'root', 'r'];

  /* Der Algorithmus aus der Aufgabe, Schritt für Schritt: ergibt für jeden Dotti sein Nest und den Kletterweg */
  function simulate() {
    var occ = {}, res = [];
    DOTS.forEach(function (d, i) {
      var nest = 'root', path = ['root'];
      while (occ[nest] != null) {
        nest = occ[nest] > d ? NESTS[nest].left : NESTS[nest].right;
        path.push(nest);
      }
      occ[nest] = d;
      res.push({ nest: nest, path: path });
    });
    return res;
  }
  var RUN = simulate();
  var SOL = RUN.map(function (r) { return r.nest; });   /* Nest je Dotti: 4 -> root, 2 -> l, 3 -> lr, 1 -> ll, 5 -> r */

  /* ---------- Zeichnungen ---------- */
  var DOT_POS = {
    1: [[0, 6]],
    2: [[-6, 0], [6, 10]],
    3: [[-6, -2], [6, 5], [-4, 14]],
    4: [[-6, -2], [6, -2], [-6, 12], [6, 12]],
    5: [[-6, -3], [6, -3], [0, 6], [-6, 15], [6, 15]]
  };
  function dottiSvg(n, cls) {
    var dots = DOT_POS[n].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.4" fill="#ff7a1a"/>'; }).join('');
    var s = Biber.svg('svg', { viewBox: '-26 -36 52 72', class: cls || 't-dottis21-bird', 'aria-hidden': 'true', focusable: 'false' });
    s.innerHTML =
      '<path d="M-6 26 L-8 34 M-9 34 L-3 34 M6 26 L8 34 M5 34 L11 34" stroke="#2b2b2b" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<path d="M12 -2 Q26 8 20 22 Q14 14 10 8Z" fill="#0d3f93" stroke="#071f4d" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<ellipse cx="0" cy="6" rx="16" ry="23" fill="#1f5fc4" stroke="#071f4d" stroke-width="2"/>' +
      '<circle cx="0" cy="-20" r="11" fill="#1f5fc4" stroke="#071f4d" stroke-width="2"/>' +
      '<path d="M-9 -22 L-23 -19 L-9 -14Z" fill="#ffc21a" stroke="#8a6200" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<circle cx="-3" cy="-23" r="2.6" fill="#fff"/><circle cx="-3.5" cy="-23" r="1.2" fill="#071f4d"/>' +
      dots;
    return s;
  }

  function tree() {
    var s = Biber.svg('svg', { class: 't-dottis21-tree', viewBox: '0 0 1000 700', 'aria-hidden': 'true', focusable: 'false' });
    s.innerHTML =
      '<path d="M40 640 Q250 600 520 625 T980 630 L980 690 L40 690Z" fill="#dea984"/>' +
      '<g fill="#66d46a" stroke="#14301a" stroke-width="3" stroke-linejoin="round">' +
      '<path d="M60 360 Q30 270 120 240 Q130 150 250 175 Q330 70 450 115 Q540 25 650 90 Q760 40 800 150 Q890 150 880 260 Q960 300 920 400 Q930 500 820 520 Q760 575 640 555 Q520 590 430 540 Q290 560 210 500 Q80 470 60 360Z"/>' +
      '</g>' +
      '<g fill="#3bb53f" opacity="0.8"><path d="M170 230 Q220 150 330 190 Q330 260 250 290 Q180 300 170 230Z"/><path d="M470 150 Q560 70 650 130 Q640 230 540 240 Q460 230 470 150Z"/><path d="M700 380 Q760 300 840 340 Q870 420 800 470 Q720 470 700 380Z"/><path d="M270 400 Q340 340 430 400 Q440 480 340 490 Q260 480 270 400Z"/></g>' +
      /* Stamm und Äste */
      '<path d="M400 650 C 500 632 548 575 560 470 L 642 470 C 650 575 705 632 815 650 Z" fill="#a05d2e" stroke="#4a2a12" stroke-width="3" stroke-linejoin="round"/>' +
      '<g fill="none" stroke="#a05d2e" stroke-linecap="round">' +
      '<path d="M601 560 L 600 400" stroke-width="82"/>' +
      '<path d="M604 440 C 590 360 612 270 596 150" stroke-width="46"/>' +
      '<path d="M596 150 C 585 112 568 88 545 62" stroke-width="18"/>' +
      '<path d="M600 140 C 700 118 760 84 806 36" stroke-width="20"/>' +
      '<path d="M580 470 Q 470 330 170 262" stroke-width="34"/>' +
      '<path d="M172 262 C 164 240 166 222 172 202" stroke-width="13"/>' +
      '<path d="M630 520 Q 750 430 815 290" stroke-width="30"/>' +
      '<path d="M815 292 C 838 270 862 258 888 250" stroke-width="13"/>' +
      '<path d="M780 360 C 830 366 870 362 912 352" stroke-width="12"/>' +
      '</g>' +
      '<g fill="none" stroke="#4a2a12" stroke-width="3" stroke-linecap="round"><path d="M640 640 C 650 590 630 540 628 500"/></g>' +
      Object.keys(NESTS).map(function (id) {
        var n = NESTS[id], x = n.x * 10, y = n.y * 7;
        return '<g transform="translate(' + x + ' ' + y + ')">' +
          '<ellipse cx="0" cy="8" rx="64" ry="34" fill="#6b3f22" stroke="#2e1a0d" stroke-width="3"/>' +
          '<ellipse cx="0" cy="-2" rx="58" ry="29" fill="#8e5a34" stroke="#2e1a0d" stroke-width="2.5"/>' +
          '<ellipse cx="0" cy="-5" rx="44" ry="19" fill="#f0b98e" stroke="#4a2a12" stroke-width="2"/>' +
          '<path d="M-52 4 Q0 22 52 4 M-46 -8 Q-20 -22 12 -22 M-30 14 Q0 24 34 14" stroke="#4a2a12" stroke-width="2" fill="none" stroke-linecap="round"/></g>';
      }).join('');
    return s;
  }

  /* ---------- Zustand ---------- */
  var el, api;
  var at, selected, dragging, locked, mark;   /* at: Nest -> Dotti-Nummer (0..4) oder fehlt; mark: null | 'check' | 'solution' */

  function reset() { at = {}; selected = null; dragging = null; mark = null; }
  function dottiNest(i) { for (var k in at) if (at[k] === i) return k; return null; }

  function place(i, nest) {
    if (locked) return;
    var from = dottiNest(i);
    var other = at[nest];
    if (from) delete at[from];
    at[nest] = i;
    if (other != null && other !== i) { if (from) at[from] = other; }
    selected = null;
    render();
    api.changed();
  }
  function release(i) {
    if (locked) return;
    var from = dottiNest(i);
    if (from) delete at[from];
    selected = null;
    render();
    api.changed();
  }

  function dottiLabel(i) { return 'Dotti ' + (i + 1) + ' von links mit ' + DOTS[i] + (DOTS[i] === 1 ? ' Punkt' : ' Punkten'); }

  function render() {
    var stage = h('div', { class: 't-dottis21-stage' }, tree());
    NEST_IDS.forEach(function (id) {
      var n = NESTS[id], i = at[id];
      var cls = 't-dottis21-nest' + (i != null ? ' filled' : '');
      var badge = null;
      if (mark === 'check' && i != null) {
        var ok = SOL[i] === id;
        cls += ok ? ' right' : ' wrong';
        badge = h('span', { class: 't-dottis21-badge', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      } else if (mark === 'solution') cls += ' right';
      var inner = i != null ? dottiSvg(DOTS[i], 't-dottis21-bird in') : null;
      stage.appendChild(h('button', {
        type: 'button', class: cls, 'data-nest': id, disabled: locked,
        draggable: i != null && !locked ? 'true' : false, 'data-in-nest': i != null ? String(i) : false,
        style: 'left:' + n.x + '%;top:' + n.y + '%',
        'aria-label': n.name + ': ' + (i != null ? dottiLabel(i) : 'leer')
      }, inner, badge));
    });
    var row = DOTS.map(function (d, i) {
      if (dottiNest(i) != null) return h('div', { class: 't-dottis21-cell', 'aria-hidden': 'true' });
      return h('button', {
        type: 'button', class: 't-dottis21-dotti' + (selected === i ? ' selected' : ''), 'data-dotti': String(i),
        draggable: locked ? false : 'true', 'aria-pressed': String(selected === i), 'aria-label': dottiLabel(i), disabled: locked
      }, h('span', { class: 't-dottis21-ord', 'aria-hidden': 'true' }, String(i + 1)), dottiSvg(d));
    });
    el.replaceChildren(h('div', { class: 't-dottis21-board' },
      stage,
      h('div', { class: 't-dottis21-rowwrap' },
        h('p', { class: 't-dottis21-lab' }, 'Die fünf Dottis in der Reihenfolge, in der sie klettern (von links nach rechts):'),
        h('div', { class: 't-dottis21-row', 'data-pool': '' }, row))));
  }

  function onClick(e) {
    if (locked) return;
    var d = e.target.closest('[data-dotti]');
    if (d) { var i = +d.dataset.dotti; selected = selected === i ? null : i; render(); api.changed(); return; }
    var n = e.target.closest('[data-nest]');
    if (!n) return;
    var nest = n.dataset.nest;
    if (selected != null) return place(selected, nest);
    if (at[nest] != null) release(at[nest]);
  }
  function onDragStart(e) {
    var t = e.target.closest('[data-dotti],[data-in-nest]');
    if (!t || locked) return;
    dragging = t.dataset.dotti != null && t.dataset.dotti !== '' ? +t.dataset.dotti : +t.dataset.inNest;
    e.dataTransfer.setData('text/plain', String(dragging));
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e) {
    if (dragging == null) return;
    if (e.target.closest('[data-nest],[data-pool]')) e.preventDefault();
  }
  function onDrop(e) {
    if (dragging == null) return;
    var n = e.target.closest('[data-nest]');
    var p = e.target.closest('[data-pool]');
    if (!n && !p) return;
    e.preventDefault();
    var i = dragging;
    dragging = null;
    if (n) place(i, n.dataset.nest); else release(i);
  }
  function onDragEnd() { dragging = null; }

  function allRight() { return DOTS.every(function (d, i) { return at[SOL[i]] === i; }); }

  Biber.register({
    id: 'dottis21',
    story: '<p>Dottis sind Vögel mit Punkten. Neben einem Baum stehen fünf Dottis. Einer nach dem anderen, von links nach rechts, klettern sie in den Baum und ziehen in die leeren Nester. Der Dotti mit den vier Punkten ist der erste.</p>' +
      '<p>Jeder Dotti beginnt unten am Baum und wiederholt diese Schritte, bis er ein leeres Nest gefunden hat:</p>' +
      '<ol><li>Er klettert hoch, bis er ein Nest findet.</li>' +
      '<li>Ist das Nest leer, bleibt er dort. Fertig.</li>' +
      '<li>Ist das Nest schon besetzt, klettert er weiter: Hat der Dotti im Nest <b>mehr</b> Punkte, klettert er nach <b>links</b>. Hat er <b>gleich viele oder weniger</b> Punkte, klettert er nach <b>rechts</b>.</li></ol>',
    question: 'In welche Nester klettern die Dottis?',
    howto: 'Ziehe jeden Dotti in sein Nest. Du kannst auch erst den Dotti und dann das Nest antippen. Tippe einen Dotti im Nest an, um ihn wieder herauszunehmen.',
    explanation: function () {
      var txt = [
        'Der erste Dotti (4 Punkte) bleibt im untersten Nest, denn es ist noch leer.',
        'Der zweite (2 Punkte) trifft im untersten Nest auf die 4. Weil 4 mehr als 2 ist, klettert er nach links und bleibt im nächsten leeren Nest.',
        'Der dritte (3 Punkte): unten 4 ist mehr, also links. Dort sitzt die 2, und 2 ist weniger als 3, also weiter nach rechts ins oberste Nest.',
        'Der vierte (1 Punkt): Er klettert an der 4 und an der 2 nach links und landet im Nest ganz links.',
        'Der fünfte (5 Punkte): Unten muss er nach rechts und bleibt im leeren Nest ganz rechts.'
      ];
      return '<ol>' + txt.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ol>' +
        '<p>Informatisch ist der Baum ein <b>binärer Suchbaum</b>: Links hängen kleinere, rechts größere (oder gleiche) Werte. So kann man neue Werte schnell einsortieren und später wiederfinden.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', onDragEnd);
      render();
    },
    isComplete: function () { return Object.keys(at).length === DOTS.length; },
    evaluate: function () {
      var ans = DOTS.map(function (d, i) { return dottiNest(i); });
      return { correct: allRight(), answer: ans };
    },
    setAnswer: function (ans) {
      at = {};
      ans.forEach(function (n, i) { if (n) at[n] = i; });
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? 'check' : null;
      selected = null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      at = {};
      SOL.forEach(function (n, i) { at[n] = i; });
      locked = true;
      mark = 'solution';
      render();
    }
  });
})();
