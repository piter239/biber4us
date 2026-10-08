/* Aufgabe Klausurenplan (Klasse 11-13, schwer): Graphenfärbung */
(function () {
  'use strict';
  var h = Biber.h, svg = Biber.svg;

  /* Diagramm wie im Heft (Lage im Bereich 600 x 470); Buchstaben sind nur Namen für Beschriftung und Erklärung */
  var NODES = {
    A: { x: 195, y: 68 }, B: { x: 407, y: 62 }, C: { x: 313, y: 224 }, D: { x: 553, y: 233 },
    E: { x: 63, y: 284 }, F: { x: 183, y: 429 }, G: { x: 475, y: 411 }
  };
  var ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  var EDGES = [['A', 'B'], ['A', 'C'], ['A', 'E'], ['B', 'C'], ['B', 'D'], ['B', 'E'], ['B', 'G'],
    ['C', 'D'], ['C', 'E'], ['C', 'F'], ['C', 'G'], ['E', 'F']];
  var DAYS = 5;
  var MIN_DAYS = 4; /* A, B, C, E sind paarweise verbunden (K4); Brute Force: 4 Tage genügen */
  var SOLUTION = { A: 1, B: 2, C: 3, E: 4, D: 1, F: 1, G: 1 };
  var W = 600, H = 470, D = 0.14; /* Knotendurchmesser als Anteil der Breite */

  function nb(id) {
    var r = [];
    EDGES.forEach(function (e) { if (e[0] === id) r.push(e[1]); else if (e[1] === id) r.push(e[0]); });
    return r;
  }

  var el, api, locked, mode; /* mode: play | check | solution */
  var col, sel, nodeEls, edgeEls, palEls, infoEl, resEl;

  function conflicts() { return EDGES.filter(function (e) { return col[e[0]] && col[e[0]] === col[e[1]]; }); }
  function used() {
    var seen = {};
    ORDER.forEach(function (id) { if (col[id]) seen[col[id]] = true; });
    return Object.keys(seen).length;
  }
  function allSet() { return ORDER.every(function (id) { return col[id]; }); }
  function isCorrect() { return allSet() && conflicts().length === 0 && used() === MIN_DAYS; }

  function dayColor(d) { return 'var(--c' + d + ')'; }

  function paint() {
    var bad = mode === 'check' ? conflicts() : [];
    EDGES.forEach(function (e, i) {
      var isBad = bad.indexOf(e) >= 0;
      edgeEls[i].setAttribute('class', 'kl-edge' + (isBad ? ' bad' : ''));
    });
    var badNodes = {};
    bad.forEach(function (e) { badNodes[e[0]] = true; badNodes[e[1]] = true; });
    ORDER.forEach(function (id) {
      var b = nodeEls[id], d = col[id];
      b.setAttribute('class', 'kl-node' + (d ? ' set' : '') + (badNodes[id] ? ' bad' : ''));
      b.style.setProperty('--kl-c', d ? dayColor(d) : 'transparent');
      b.querySelector('.kl-num').textContent = d ? String(d) : '';
      var ns = nb(id).sort().join(', ');
      b.setAttribute('aria-label', 'Klausur ' + id + ', verbunden mit ' + ns + ': ' + (d ? 'Tag ' + d : 'noch kein Tag'));
    });
    for (var d = 0; d <= DAYS; d++) {
      var p = palEls[d];
      p.setAttribute('aria-pressed', sel === d ? 'true' : 'false');
      p.classList.toggle('on', sel === d);
    }
    infoEl.textContent = 'Verwendete Tage: ' + used() + ' · Klausuren verplant: ' + ORDER.filter(function (id) { return col[id]; }).length + ' von 7';
    var msg = '', cls = '';
    if (mode === 'solution') { msg = 'Eine mögliche Lösung mit 4 Tagen. Es gibt noch weitere.'; cls = 'ok'; }
    else if (mode === 'check') {
      var c = conflicts(), u = used();
      if (c.length) {
        msg = c.length > 3 ? c.length + ' Tageskonflikte (rot markiert): Verbundene Klausuren liegen am selben Tag.'
          : 'Tageskonflikt (rot markiert): ' + c.map(function (e) { return 'Klausur ' + e[0] + ' und ' + e[1]; }).join('; ') + ' liegen am selben Tag.';
        cls = 'bad';
      } else if (u > MIN_DAYS) { msg = 'Kein Konflikt, aber ' + u + ' Tage sind zu viele. Es geht mit weniger.'; cls = 'bad'; }
      else if (u < MIN_DAYS) { msg = 'Das geht nicht mit so wenigen Tagen.'; cls = 'bad'; }
      else { msg = 'Keine Tageskonflikte, und mit 4 Tagen sind es so wenige wie möglich.'; cls = 'ok'; }
    }
    resEl.textContent = msg;
    resEl.setAttribute('class', 'kl-result' + (cls ? ' ' + cls : ''));
  }

  function apply(id) {
    if (locked) return;
    var d = sel;
    if (!d || col[id] === d) delete col[id]; else col[id] = d;
    paint();
    api.changed();
  }

  function pick(d) {
    if (locked) return;
    sel = d;
    paint();
  }

  function pct(v, total) { return (v / total * 100).toFixed(3) + '%'; }

  function build() {
    nodeEls = {}; edgeEls = []; palEls = [];
    var s = svg('svg', { class: 'kl-svg', viewBox: '0 0 ' + W + ' ' + H, 'aria-hidden': 'true', focusable: 'false' });
    EDGES.forEach(function (e) {
      var a = NODES[e[0]], b = NODES[e[1]];
      var ln = svg('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y });
      edgeEls.push(ln);
      s.appendChild(ln);
    });
    var wrap = h('div', { class: 'kl-graph' }, s);
    ORDER.forEach(function (id) {
      var n = NODES[id];
      var b = h('button', {
        type: 'button', class: 'kl-node', 'data-node': id,
        style: 'left:' + pct(n.x, W) + ';top:' + pct(n.y, H) + ';width:' + (D * 100) + '%',
        onclick: function () { apply(id); },
        onkeydown: function (e) {
          if (locked) return;
          if (e.key >= '1' && e.key <= String(DAYS)) { e.preventDefault(); col[id] = +e.key; paint(); api.changed(); }
          else if (e.key === 'Delete' || e.key === 'Backspace' || e.key === '0') { e.preventDefault(); delete col[id]; paint(); api.changed(); }
        }
      }, h('span', { class: 'kl-letter', 'aria-hidden': 'true' }, id), h('span', { class: 'kl-disc', 'aria-hidden': 'true' }, h('span', { class: 'kl-num' })));
      nodeEls[id] = b;
      wrap.appendChild(b);
    });
    var pal = h('div', { class: 'kl-pal', role: 'group', 'aria-label': 'Tag auswählen' });
    for (var d = 1; d <= DAYS; d++) (function (d) {
      var b = h('button', {
        type: 'button', class: 'kl-day', 'aria-pressed': 'false', 'aria-label': 'Tag ' + d, onclick: function () { pick(d); },
        style: '--kl-c:' + dayColor(d)
      }, h('span', { class: 'kl-dday' }, h('span', { class: 'kl-dnum' }, String(d))), h('span', { class: 'kl-dlabel' }, 'Tag ' + d));
      palEls[d] = b;
      pal.appendChild(b);
    })(d);
    var er = h('button', { type: 'button', class: 'kl-day kl-erase', 'aria-pressed': 'false', 'aria-label': 'Radierer: Tag entfernen', onclick: function () { pick(0); } },
      h('span', { class: 'kl-dday' }, h('span', { class: 'kl-dnum', 'aria-hidden': 'true' }, '×')), h('span', { class: 'kl-dlabel' }, 'leeren'));
    palEls[0] = er;
    pal.appendChild(er);
    return { wrap: wrap, pal: pal };
  }

  Biber.register({
    id: 'klausuren',
    story: '<p>An der Euler-Schule stehen Klausuren an. Sie sollen an <strong>möglichst wenigen Tagen</strong> geschrieben werden. Weil man nur eine Klausur pro Tag mitschreiben darf, dürfen zwei Klausuren, bei denen mindestens eine Person beide mitschreibt, nicht für den gleichen Tag geplant werden. Solche zwei Klausuren haben einen „Tageskonflikt“.</p>' +
      '<p>Um die Planung zu erleichtern, werden die Tageskonflikte in einem Diagramm aus Kreisen und Linien dargestellt:</p>' +
      '<ul><li>Für jede Klausur wird ein Kreis gezeichnet.</li><li>Zwischen zwei Kreisen wird genau dann eine Linie gezeichnet, wenn diese beiden Klausuren einen Tageskonflikt haben, also nicht für den gleichen Tag geplant werden dürfen.</li></ul>' +
      '<p>Beispiel mit drei Klausuren: Die Klausur in der Mitte hat zwei Tageskonflikte, nämlich mit jeder der beiden anderen Klausuren. Sie liegt am Tag 1, die beiden äußeren Klausuren liegen beide am Tag 2. Zwei Tage genügen also.</p>' +
      '<div class="kl-example" role="img" aria-label="Beispiel: drei Kreise in einer Reihe, durch Linien verbunden; außen jeweils Tag 2, in der Mitte Tag 1">' +
      '<svg viewBox="0 0 220 56" width="220" height="56" aria-hidden="true" focusable="false"><line x1="30" y1="28" x2="190" y2="28" class="kl-exline"/>' +
      '<g class="kl-exnode"><circle cx="30" cy="28" r="22" style="fill: var(--c2)"/><circle cx="110" cy="28" r="22" style="fill: var(--c1)"/><circle cx="190" cy="28" r="22" style="fill: var(--c2)"/>' +
      '<g class="kl-extext"><circle cx="30" cy="28" r="12"/><circle cx="110" cy="28" r="12"/><circle cx="190" cy="28" r="12"/></g>' +
      '<text x="30" y="34" text-anchor="middle">2</text><text x="110" y="34" text-anchor="middle">1</text><text x="190" y="34" text-anchor="middle">2</text></g></svg></div>' +
      '<p>Innerhalb der nächsten fünf Tage sollen sieben Klausuren geschrieben werden. Das Diagramm zeigt ihre Tageskonflikte.</p>',
    question: 'Verteile die Klausuren auf möglichst wenige der fünf Tage und beachte dabei die Tageskonflikte. Es gibt mehrere richtige Antworten.',
    howto: 'Wähle unten einen Tag (1 bis 5) und tippe dann auf die Kreise, die an diesem Tag geschrieben werden sollen. Mit „leeren“ oder erneutem Tippen nimmst du einen Tag wieder weg. Mit der Tastatur: Kreis anwählen und die Taste 1 bis 5 drücken.',
    explanation: function () {
      return '<p>Die vier Klausuren A, B, C und E sind untereinander alle durch Linien verbunden, haben also paarweise Tageskonflikte. Sie brauchen vier verschiedene Tage, weniger als vier gehen nicht. ' +
        'Die übrigen Klausuren D, F und G haben jeweils nur zwei Konfliktpartner (D und G mit B und C, F mit C und E), daher bleibt für jede ein Tag frei, zum Beispiel Tag 1 für alle drei. Eine Lösung ist A=1, B=2, C=3, E=4, D=F=G=1; es gibt noch viele weitere.</p>' +
        '<p>Das Verteilen von Klausuren auf Tage ist eine <strong>Graphenfärbung</strong>: Jeder Tag ist eine Farbe, verbundene Knoten dürfen nicht dieselbe Farbe haben. Die kleinste nötige Zahl an Farben heißt chromatische Zahl; sie ist mindestens so groß wie die größte Gruppe, in der alle paarweise verbunden sind.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; mode = 'play'; col = {}; sel = 1;
      var b = build();
      infoEl = h('div', { class: 'kl-info', 'aria-live': 'polite' });
      resEl = h('div', { class: 'kl-result', 'aria-live': 'polite' });
      el.replaceChildren(h('div', { class: 'kl-board' },
        h('p', { class: 'kl-cap' }, '1. Tag wählen'), b.pal,
        h('p', { class: 'kl-cap' }, '2. Klausuren zuordnen'), b.wrap,
        infoEl, resEl));
      paint();
    },
    isComplete: function () { return allSet(); },
    evaluate: function () {
      var ans = ORDER.map(function (id) { return col[id] || 0; });
      return { correct: isCorrect(), answer: ans };
    },
    setAnswer: function (ans) {
      col = {};
      ORDER.forEach(function (id, i) { if (ans && ans[i]) col[id] = ans[i]; });
      mode = 'check';
      paint();
    },
    lock: function (on) {
      locked = on;
      if (on) { if (mode !== 'solution') mode = 'check'; } else mode = 'play';
      var all = el.querySelectorAll('.kl-day');
      for (var i = 0; i < all.length; i++) all[i].disabled = on;
      paint();
    },
    reset: function () { col = {}; sel = 1; mode = 'play'; paint(); api.changed(''); },
    showSolution: function () {
      col = {};
      Object.keys(SOLUTION).forEach(function (id) { col[id] = SOLUTION[id]; });
      mode = 'solution';
      paint();
    }
  });
})();
