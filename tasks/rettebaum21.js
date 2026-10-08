/* Aufgabe Rette den Baum! (Heft 2021, S. 44; Klasse 7-8 mittel, 9-10 einfach): Äste mit minimaler Gesamtzeit absägen */
(function () {
  'use strict';
  var h = Biber.h;

  /* ---------- Aufgabendaten ----------
     Jeder Ast führt von seinem Elternast (oder vom Stamm) zum Punkt (x, y) und braucht w Zeit zum Absägen.
     Ein Ast ohne Kinder trägt ein Blatt. t = Lage der Zahl auf dem Ast (0..1), bend = Krümmung. */
  var ROOT = { x: 432, y: 730 };
  var BRANCHES = [
    { id: 'a9', parent: null, x: 200, y: 600, w: 9, bend: -20, name: 'linker Hauptast' },
    { id: 'a1', parent: 'a9', x: 95, y: 700, w: 1, bend: 8, name: 'Blattast links unten', t: 0.6 },
    { id: 'a3', parent: 'a9', x: 70, y: 545, w: 3, bend: -8, name: 'Blattast links', t: 0.45 },
    { id: 'b5', parent: 'a9', x: 185, y: 420, w: 5, bend: 12, name: 'Ast links oben' },
    { id: 'b1', parent: 'b5', x: 65, y: 335, w: 1, bend: -8, name: 'Blattast oben links', t: 0.55 },
    { id: 'b3', parent: 'b5', x: 200, y: 205, w: 3, bend: 8, name: 'Blattast links ganz oben', t: 0.5 },
    { id: 'c8', parent: null, x: 420, y: 560, w: 8, bend: 12, name: 'mittlerer Hauptast' },
    { id: 'd4', parent: 'c8', x: 390, y: 420, w: 4, bend: -10, name: 'Ast Mitte links', t: 0.45 },
    { id: 'd3', parent: 'd4', x: 288, y: 362, w: 3, bend: -8, name: 'Blattast Mitte links', t: 0.5 },
    { id: 'd5', parent: 'd4', x: 370, y: 175, w: 5, bend: 8, name: 'Blattast Mitte oben', t: 0.5 },
    { id: 'e5', parent: 'c8', x: 550, y: 430, w: 5, bend: 10, name: 'Ast Mitte rechts', t: 0.6 },
    { id: 'e2', parent: 'e5', x: 570, y: 205, w: 2, bend: -8, name: 'Blattast Mitte rechts oben', t: 0.5 },
    { id: 'e1', parent: 'e5', x: 710, y: 330, w: 1, bend: 8, name: 'Blattast Mitte rechts', t: 0.55 },
    { id: 'f5', parent: null, x: 610, y: 670, w: 5, bend: 14, name: 'rechter Hauptast' },
    { id: 'f3', parent: 'f5', x: 665, y: 500, w: 3, bend: -8, name: 'Blattast rechts oben', t: 0.55 },
    { id: 'f2', parent: 'f5', x: 740, y: 590, w: 2, bend: -8, name: 'Blattast rechts', t: 0.65 },
    { id: 'f1', parent: 'f5', x: 720, y: 775, w: 1, bend: 8, name: 'Blattast rechts unten', t: 0.6 }
  ];
  var W = 820, VY = 80, H = 770;
  var BY = {}, KIDS = {};
  BRANCHES.forEach(function (b) { BY[b.id] = b; KIDS[b.id] = []; });
  BRANCHES.forEach(function (b) { if (b.parent) KIDS[b.parent].push(b.id); });
  var LEAVES = BRANCHES.filter(function (b) { return !KIDS[b.id].length; }).map(function (b) { return b.id; });

  function start(b) { return b.parent ? BY[b.parent] : ROOT; }
  function ancestors(id) { var out = []; while (id) { out.push(id); id = BY[id].parent; } return out; }
  function isSawnOff(cut, id) { return ancestors(id).some(function (a) { return cut[a]; }); }
  function removedLeaves(cut) { return LEAVES.filter(function (l) { return isSawnOff(cut, l); }); }
  function total(cut) { return Object.keys(cut).reduce(function (t, k) { return t + (cut[k] ? BY[k].w : 0); }, 0); }

  /* Optimum (Heft): von unten nach oben min(Ast selbst, Summe der Kinder) */
  var OPT = (function () {
    var best = {}, choice = {};
    function go(id) {
      var kids = KIDS[id];
      if (!kids.length) { best[id] = BY[id].w; choice[id] = [id]; return; }
      var sum = 0, set = [];
      kids.forEach(function (k) { go(k); sum += best[k]; set = set.concat(choice[k]); });
      if (BY[id].w <= sum) { best[id] = BY[id].w; choice[id] = [id]; } else { best[id] = sum; choice[id] = set; }
    }
    var roots = BRANCHES.filter(function (b) { return !b.parent; }), t = 0, set = [];
    roots.forEach(function (r) { go(r.id); t += best[r.id]; set = set.concat(choice[r.id]); });
    return { total: t, set: set };
  })();

  /* ---------- Geometrie ---------- */
  function ctrl(b) {
    var p = start(b), dx = b.x - p.x, dy = b.y - p.y, d = Math.sqrt(dx * dx + dy * dy);
    return { x: (p.x + b.x) / 2 - dy / d * b.bend, y: (p.y + b.y) / 2 + dx / d * b.bend };
  }
  function bez(b, t) {
    var p = start(b), c = ctrl(b), u = 1 - t;
    return { x: u * u * p.x + 2 * u * t * c.x + t * t * b.x, y: u * u * p.y + 2 * u * t * c.y + t * t * b.y };
  }
  function pathD(b) { var p = start(b), c = ctrl(b); return 'M' + p.x + ' ' + p.y + ' Q' + c.x.toFixed(1) + ' ' + c.y.toFixed(1) + ' ' + b.x + ' ' + b.y; }
  function leafAngle(b) {
    var c = ctrl(b);
    return Math.atan2(b.y - c.y, b.x - c.x) * 180 / Math.PI;
  }

  var NS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs, kids) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (k) { if (k) e.appendChild(k); });
    return e;
  }
  function leafShape(b) {
    var a = leafAngle(b);
    return s('g', { class: 't-rettebaum21-leaf', transform: 'translate(' + b.x + ' ' + b.y + ') rotate(' + a.toFixed(1) + ')', 'data-leaf': b.id, 'aria-hidden': 'true' }, [
      s('path', { d: 'M-4 0 C4 -27 36 -31 54 0 C36 31 4 27 -4 0 Z', class: 'bl' }),
      s('path', { d: 'M-4 0 C10 -8 36 -10 54 0 C36 10 10 8 -4 0 Z', class: 'bl2' }),
      s('path', { d: 'M-4 0 L48 0', class: 'vein' })
    ]);
  }

  /* ---------- Zustand ---------- */
  var el, api, cut, locked, shown;        /* cut: {id: true}; shown: null | 'check' | 'solution' */
  var svg, branchEls, labelEls, leafEls, info;

  function build() {
    svg = s('svg', { class: 't-rettebaum21-svg', viewBox: '0 ' + VY + ' ' + W + ' ' + H, 'aria-hidden': 'true' });
    svg.appendChild(s('ellipse', { cx: 432, cy: 800, rx: 300, ry: 30, class: 't-rettebaum21-grass' }));
    svg.appendChild(s('path', { d: 'M376 806 C404 780 406 758 402 706 L462 706 C458 758 460 780 490 806 Z', class: 't-rettebaum21-trunk' }));
    branchEls = {}; leafEls = {};
    var gB = s('g', {}), gL = s('g', {});
    BRANCHES.slice().sort(function (a, b) { return ancestors(a.id).length - ancestors(b.id).length; }).forEach(function (b) {
      var thick = KIDS[b.id].length ? 'main' : 'twig';
      var g = s('g', { class: 't-rettebaum21-branch ' + thick, 'data-id': b.id }, [
        s('path', { d: pathD(b), class: 'wood' }), s('path', { d: pathD(b), class: 'cutline' })
      ]);
      branchEls[b.id] = g; gB.appendChild(g);
    });
    BRANCHES.filter(function (b) { return !KIDS[b.id].length; }).forEach(function (b) { var l = leafShape(b); leafEls[b.id] = l; gL.appendChild(l); });
    svg.appendChild(gB); svg.appendChild(gL);
    svg.addEventListener('click', function (e) { var g = e.target.closest('[data-id]'); if (g) toggle(g.getAttribute('data-id')); });
  }
  function buildLabels() {
    labelEls = {};
    var wrap = h('div', { class: 't-rettebaum21-labels' });
    BRANCHES.forEach(function (b) {
      var p = bez(b, b.t || 0.5);
      var btn = h('button', {
        type: 'button', class: 't-rettebaum21-label', 'data-id': b.id,
        style: 'left:' + (p.x / W * 100).toFixed(2) + '%;top:' + ((p.y - VY) / H * 100).toFixed(2) + '%',
        onclick: function () { toggle(b.id); }
      }, String(b.w));
      labelEls[b.id] = btn; wrap.appendChild(btn);
    });
    return wrap;
  }

  function paint() {
    BRANCHES.forEach(function (b) {
      var own = !!cut[b.id], gone = !own && isSawnOff(cut, b.id);
      var cls = 't-rettebaum21-branch ' + (KIDS[b.id].length ? 'main' : 'twig') + (own ? ' cut' : '') + (gone ? ' gone' : '');
      if (own && shown === 'check') cls += ok() ? ' right' : ' wrong';
      if (own && shown === 'solution') cls += ' right';
      branchEls[b.id].setAttribute('class', cls);
      var btn = labelEls[b.id];
      btn.className = 't-rettebaum21-label' + (own ? ' cut' : '') + (gone ? ' gone' : '') + (own && shown === 'check' ? (ok() ? ' right' : ' wrong') : '') + (own && shown === 'solution' ? ' right' : '');
      btn.disabled = locked || gone;
      btn.setAttribute('aria-pressed', String(own));
      btn.setAttribute('aria-label', 'Ast ' + b.name + ', Dauer ' + b.w + (own ? ', wird abgesägt' : gone ? ', schon mit einem Ast davor abgesägt' : ''));
    });
    var rem = removedLeaves(cut);
    LEAVES.forEach(function (l) { leafEls[l].setAttribute('class', 't-rettebaum21-leaf' + (rem.indexOf(l) >= 0 ? ' off' : '')); });
    info.t.textContent = String(total(cut));
    info.l.textContent = rem.length + ' von ' + LEAVES.length;
    info.box.className = 't-rettebaum21-info' + (rem.length === LEAVES.length ? ' all' : '');
  }
  function ok() { return removedLeaves(cut).length === LEAVES.length && total(cut) === OPT.total; }

  function toggle(id) {
    if (locked) return;
    if (cut[id]) delete cut[id];
    else {
      if (isSawnOff(cut, id)) return;
      /* Äste weiter außen sind dann überflüssig */
      (function drop(i) { KIDS[i].forEach(function (k) { delete cut[k]; drop(k); }); })(id);
      cut[id] = true;
    }
    paint();
    api.changed();
  }

  Biber.register({
    id: 'rettebaum21',
    story: '<p>Ein Baum in Brunos Garten ist krank, alle Blätter sind vertrocknet. Bruno will den Baum retten. Dazu muss er einige Äste absägen, ' +
      'so dass am Ende alle Blätter entfernt sind. Dann können neue Äste mit neuen Blättern wachsen. Bruno möchte so schnell wie möglich fertig sein.</p>' +
      '<p>Die Zahl an jedem Ast sagt, wie lange das Absägen dauert. Beispiel: Zwei Blätter hängen an Ästen mit 3 und 1, und beide Äste zweigen von einem Ast mit 5 ab. ' +
      'Bruno sägt besser die beiden Blattäste ab, denn 3 + 1 &lt; 5.</p>',
    question: 'Welche Äste wird Bruno absägen, um so schnell wie möglich fertig zu sein?',
    howto: 'Tippe die Zahl an einem Ast an, um ihn abzusägen. Alles, was weiter außen an diesem Ast hängt, fällt mit ab. Nochmal tippen macht es rückgängig.',
    explanation: function () {
      var own = total(cut), mine = '';
      if (removedLeaves(cut).length === LEAVES.length && own > OPT.total) mine = '<p>Mit deinen Ästen sind alle Blätter ab, aber es dauert ' + own + '. Es geht schneller.</p>';
      return mine + '<p>Am schnellsten ist Bruno nach <b>' + OPT.total + '</b>: Er sägt die vier Blattäste links (1, 3, 1 und 3), den Ast mit 4 in der Mitte, die beiden Blattäste rechts davon (2 und 1) und den rechten Hauptast mit 5 ab. ' +
        'Zusammen sind das 1 + 3 + 1 + 3 + 4 + 2 + 1 + 5 = 20.</p>' +
        '<p>Man findet das von außen nach innen: Zuerst vergleicht man bei jedem Ast, ob es schneller geht, ihn selbst abzusägen oder alle Äste, die von ihm abzweigen. ' +
        'Zum Beispiel ist 4 kleiner als 3 + 5, aber 1 + 3 ist kleiner als 5. Das Ergebnis arbeitet man Ast für Ast bis zum Stamm weiter. ' +
        'Dieses Verfahren löst ein „minimaler Schnitt“-Problem in einem Baum.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; cut = {}; shown = null;
      build();
      info = {
        t: h('b', null, '0'), l: h('b', null, '0 von ' + LEAVES.length)
      };
      info.box = h('p', { class: 't-rettebaum21-info', 'aria-live': 'polite' },
        h('span', null, 'Dauer zusammen: ', info.t), h('span', null, 'Blätter entfernt: ', info.l));
      el.replaceChildren(h('div', { class: 't-rettebaum21-board' }, info.box,
        h('div', { class: 't-rettebaum21-tree' }, svg, buildLabels())));
      paint();
    },
    isComplete: function () { return removedLeaves(cut).length === LEAVES.length; },
    evaluate: function () {
      return { correct: ok(), answer: { cut: Object.keys(cut).sort() } };
    },
    setAnswer: function (ans) {
      cut = {};
      ((ans && ans.cut) || []).forEach(function (k) { cut[k] = true; });
      shown = 'check'; paint();
    },
    lock: function (on) {
      locked = on;
      if (on) { if (shown !== 'solution') shown = 'check'; } else shown = null;
      paint();
    },
    reset: function () { cut = {}; shown = null; paint(); },
    showSolution: function () {
      cut = {}; OPT.set.forEach(function (k) { cut[k] = true; });
      shown = 'solution'; locked = true; paint();
    }
  });
})();
