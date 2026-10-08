/* Aufgabe Lilis Nachbarn (Biber 2022; Klasse 7-8 mittel, 9-10 einfach): In welcher Burg wohnt Lili? Burgen = Knoten, Kanäle = Kanten. */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-nachbarn22-';
  var IMG = 'assets/nachbarn22/map.png', IW = 1254, IH = 472;

  /* Burgen (Mittelpunkt im Bild in Pixeln) mit den Nummern aus dem Lösungsteil des Hefts */
  var NODES = [
    { n: 1, x: 118, y: 130, name: 'ganz links' },
    { n: 2, x: 411, y: 39, name: 'oben, links der Mitte' },
    { n: 3, x: 853, y: 144, name: 'oben, rechts der Mitte' },
    { n: 4, x: 1103, y: 104, name: 'oben rechts' },
    { n: 5, x: 413, y: 217, name: 'links in der Mitte' },
    { n: 6, x: 623, y: 296, name: 'in der Mitte' },
    { n: 7, x: 363, y: 406, name: 'unten links' },
    { n: 8, x: 1073, y: 389, name: 'unten rechts' }
  ];
  /* Kanäle (aus der Karte abgelesen; Gradfolge 2,4,5,2,4,4,3,2 passt zu den Angaben im Heft) */
  var EDGES = [[1, 2], [1, 5], [2, 5], [2, 6], [2, 3], [5, 6], [5, 7], [6, 7], [3, 6], [3, 7], [3, 4], [3, 8], [4, 8]];
  var RIGHT = 6;

  function neighbors(n) {
    var out = [];
    EDGES.forEach(function (e) { if (e[0] === n) out.push(e[1]); else if (e[1] === n) out.push(e[0]); });
    return out;
  }
  function deg(n) { return neighbors(n).length; }

  /* Brute Force über alle Zuordnungen der vier Biber auf verschiedene Burgen (Lili, Simon, Peter, Nina) */
  function solutions() {
    var res = [], ns = NODES.map(function (x) { return x.n; });
    ns.forEach(function (l) { ns.forEach(function (s) { ns.forEach(function (p) { ns.forEach(function (ni) {
      if ([l, s, p, ni].filter(function (v, i, a) { return a.indexOf(v) === i; }).length < 4) return;
      if (deg(l) !== 4 || deg(s) !== 4 || deg(p) !== 4) return;
      var nb = neighbors(ni).sort();
      if (nb.length !== 2 || nb.indexOf(s) < 0 || nb.indexOf(p) < 0) return;
      res.push({ lili: l, simon: s, peter: p, nina: ni });
    }); }); }); });
    return res;
  }

  function pct(v, t) { return (v / t * 100).toFixed(3) + '%'; }
  function badge(nd) {
    return '<span class="' + P + 'badge" aria-hidden="true" style="left:' + pct(nd.x - 40, IW) + ';top:' + pct(nd.y - 30, IH) + '">' + nd.n + '</span>';
  }
  /* statische Karte für die Erklärung */
  function staticMap(rings, label) {
    var s = '<div class="' + P + 'map ' + P + 'static" role="img" aria-label="' + label + '"><img src="' + IMG + '" alt="" width="' + IW + '" height="' + IH + '">';
    NODES.forEach(function (nd) {
      s += badge(nd);
      if (rings[nd.n]) s += '<span class="' + P + 'ring ' + P + rings[nd.n].cls + '" style="left:' + pct(nd.x, IW) + ';top:' + pct(nd.y, IH) + '"></span>' +
        '<span class="' + P + 'who" style="left:' + pct(nd.x, IW) + ';top:' + pct(nd.y + 34, IH) + '">' + rings[nd.n].t + '</span>';
    });
    return s + '</div>';
  }

  var el, api, btns, mapEl, noteEl, selected, locked, mark;
  function reset() { selected = null; mark = null; }

  function refresh() {
    btns.forEach(function (b, i) {
      var n = i + 1, on = selected === n, ok = n === RIGHT;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = (selected === null ? i === 0 : on) ? 0 : -1;
      b.setAttribute('aria-disabled', locked ? 'true' : 'false');
      b.classList.toggle('selected', on);
      b.classList.toggle('right', mark !== null && (on || mark === 'solution') && ok);
      b.classList.toggle('wrong', on && mark === 'check' && !ok);
      var who = b.querySelector('.' + P + 'who');
      who.textContent = on || (mark === 'solution' && ok) ? 'Lili' : '';
    });
    noteEl.textContent = selected === null ? 'Tippe auf die Burg, in der Lili wohnt.' : 'Lili wohnt in Burg ' + selected + '.';
  }
  function choose(n, focus) {
    if (locked) return;
    selected = n;
    refresh();
    if (focus) btns[n - 1].focus();
    api.changed();
  }
  function onKey(e) {
    var i = btns.indexOf(e.currentTarget), to = null, k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % btns.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + btns.length - 1) % btns.length;
    if (to === null) return;
    e.preventDefault();
    choose(to + 1, true);
  }

  Biber.register({
    id: 'nachbarn22',
    story: '<p>Auf der Karte siehst du acht Biberburgen. In jeder Burg wohnt genau ein Biber. Zwei Biber sind Nachbarn, wenn ein Kanal ihre Burgen verbindet.</p>' +
      '<p>Das ist bekannt:</p><ul><li>Lili, Simon und Peter haben je vier Nachbarn.</li><li>Simon und Peter sind Ninas einzige Nachbarn.</li></ul>',
    question: 'Wo wohnt Lili?',
    howto: 'Die Burgen sind zur Orientierung nummeriert. Tippe auf die Burg, in der Lili wohnt. Mit den Pfeiltasten kannst du zwischen den Burgen wechseln.',
    explanation: function () {
      var degs = NODES.map(function (nd) { return 'Burg ' + nd.n + ': ' + deg(nd.n); }).join(', ');
      var rings = { 6: { cls: 'ok', t: 'Lili' }, 1: { cls: 'nina', t: 'Nina' }, 2: { cls: 'nb', t: 'Simon/Peter' }, 5: { cls: 'nb', t: 'Simon/Peter' } };
      return '<p>Zähle bei jeder Burg die Kanäle (= Nachbarn): ' + degs + '. Genau vier Kanäle haben die Burgen <strong>2, 5 und 6</strong>. Also wohnen Lili, Simon und Peter in diesen drei Burgen.</p>' +
        '<p>Nina hat genau zwei Nachbarn, und beide haben vier Nachbarn. Zwei Kanäle haben die Burgen 1, 4 und 8; nur Burg 1 ist mit zwei Vier-Kanal-Burgen (2 und 5) verbunden. ' +
        'Nina wohnt also in Burg 1, Simon und Peter in den Burgen 2 und 5, und für Lili bleibt <strong>Burg 6</strong>.</p>' +
        staticMap(rings, 'Karte mit nummerierten Burgen: Lili wohnt in Burg 6, Nina in Burg 1, Simon und Peter in den Burgen 2 und 5') +
        '<p>Burgen und Kanäle bilden einen <em>Graphen</em>: Die Burgen sind die Knoten, die Kanäle die Kanten. Die Zahl der Kanten an einem Knoten heißt Grad. ' +
        'In der Informatik beschreibt man mit Graphen Netzwerke wie Straßen, Computer oder Freundschaften.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      mapEl = h('div', { class: P + 'map', role: 'radiogroup', 'aria-label': 'Karte mit acht Biberburgen' },
        h('img', { src: IMG, alt: 'Karte mit acht Biberburgen, die durch Kanäle verbunden sind', width: IW, height: IH, draggable: 'false' }));
      btns = NODES.map(function (nd) {
        var b = h('button', {
          type: 'button', role: 'radio', class: P + 'node', 'data-burg': nd.n,
          'aria-label': 'Burg ' + nd.n + ', ' + nd.name,
          style: 'left:' + pct(nd.x, IW) + ';top:' + pct(nd.y, IH),
          onclick: function () { choose(nd.n); },
          onkeydown: onKey
        }, h('span', { class: P + 'who', 'aria-hidden': 'true' }), h('span', { class: P + 'mk', 'aria-hidden': 'true' }));
        return b;
      });
      NODES.forEach(function (nd) {
        var t = document.createElement('div');
        t.innerHTML = badge(nd);
        mapEl.appendChild(t.firstChild);
      });
      btns.forEach(function (b) { mapEl.appendChild(b); });
      noteEl = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      el.replaceChildren(h('div', { class: P + 'board' }, mapEl, noteEl));
      refresh();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () { return { correct: selected === RIGHT, answer: selected }; },
    setAnswer: function (ans) { selected = typeof ans === 'number' ? ans : null; mark = 'check'; refresh(); },
    lock: function (on) { locked = on; mark = on ? 'check' : null; refresh(); },
    reset: function () { reset(); refresh(); },
    showSolution: function () { selected = RIGHT; mark = 'solution'; locked = true; refresh(); }
  });
})();
