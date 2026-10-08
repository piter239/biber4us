/* Aufgabe Erdbeerklau (Heft 2021, S. 23; Klasse 5-10): Graph mit Regel "gleiche Dinge sind nicht verbunden" (Cliquen / Färbung) */
(function () {
  'use strict';
  var h = Biber.h;

  /* Gegenstände auf dem Rasen: Position im Heft: oben links, Mitte, rechts; unten links, Mitte (Erdbeere), rechts */
  var NODES = {
    tl: { x: 70, y: 50, kind: 'eichel', name: 'Eichel oben links' },
    tm: { x: 300, y: 50, kind: 'nuss', name: 'Haselnuss oben Mitte' },
    tr: { x: 530, y: 50, kind: 'eichel', name: 'Eichel oben rechts' },
    bl: { x: 70, y: 280, kind: 'stein', name: 'Stein unten links' },
    bm: { x: 300, y: 280, kind: 'erdbeere', name: 'Erdbeere unten Mitte' },
    br: { x: 530, y: 280, kind: 'stein', name: 'Stein unten rechts' }
  };
  var KINDS = {
    eichel: { name: 'Eichel', plural: 'Eicheln' },
    nuss: { name: 'Haselnuss', plural: 'Haselnüsse' },
    stein: { name: 'Stein', plural: 'Steine' }
  };
  var SLOT = 'bm';
  /* Die elf Äste aus dem Heftbild (zwei Kreuze, drei senkrechte, zwei obere, zwei untere Äste) */
  var EDGES = [
    { id: 'e1', a: 'tl', b: 'tm', bend: 8 },
    { id: 'e2', a: 'tm', b: 'tr', bend: -8 },
    { id: 'e3', a: 'tl', b: 'bl', bend: 10 },
    { id: 'e4', a: 'tr', b: 'br', bend: -10 },
    { id: 'e5', a: 'tl', b: 'bm', bend: 6 },
    { id: 'e6', a: 'bl', b: 'tm', bend: -6 },
    { id: 'e7', a: 'tm', b: 'br', bend: 6 },
    { id: 'e8', a: 'bm', b: 'tr', bend: -6 },
    { id: 'e9', a: 'tm', b: 'bm', bend: 8 },
    { id: 'e10', a: 'bl', b: 'bm', bend: -8 },
    { id: 'e11', a: 'bm', b: 'br', bend: 8 }
  ];
  var EDGE = {};
  EDGES.forEach(function (e) { EDGE[e.id] = e; });
  var ITEMS = ['eichel', 'nuss', 'stein'];

  function kindAt(id, item) { return id === SLOT ? item : NODES[id].kind; }
  /* Äste, die zwischen zwei gleichen Sachen liegen, wenn an der Stelle der Erdbeere 'item' liegt */
  function conflicts(item) {
    return EDGES.filter(function (e) { return kindAt(e.a, item) === kindAt(e.b, item); }).map(function (e) { return e.id; });
  }
  /* Eine Antwort ist richtig, wenn nach dem Entfernen des einen Asts keine Regelverletzung übrig bleibt */
  function valid(item, removed) {
    return ITEMS.indexOf(item) >= 0 && !!EDGE[removed] && conflicts(item).every(function (id) { return id === removed; });
  }
  var SOL = { item: 'nuss', removed: 'e9' };

  /* ---------- Zeichnung ---------- */
  var R = 34;   /* Äste enden vor den Gegenständen */
  function edgePath(e) {
    var A = NODES[e.a], B = NODES[e.b];
    var dx = B.x - A.x, dy = B.y - A.y, len = Math.sqrt(dx * dx + dy * dy), ux = dx / len, uy = dy / len;
    var x1 = A.x + ux * R, y1 = A.y + uy * R, x2 = B.x - ux * R, y2 = B.y - uy * R;
    var mx = (x1 + x2) / 2 - uy * e.bend, my = (y1 + y2) / 2 + ux * e.bend;
    return 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + x2.toFixed(1) + ' ' + y2.toFixed(1);
  }
  var SHAPES = {
    eichel: '<ellipse cx="0" cy="7" rx="14" ry="17" fill="#c9833f" stroke="#4a2a12" stroke-width="2"/>' +
      '<path d="M-18 -3 Q-18 -23 0 -23 Q18 -23 18 -3 Q0 3 -18 -3Z" fill="#5b3416" stroke="#3a210d" stroke-width="2"/>' +
      '<path d="M0 -23 L2 -31" stroke="#3a210d" stroke-width="3" stroke-linecap="round"/>',
    nuss: '<ellipse cx="0" cy="3" rx="19" ry="21" fill="#b5e07d" stroke="#4d8a2b" stroke-width="2"/>' +
      '<path d="M-17 -6 Q-12 -22 0 -19 Q12 -22 17 -6 L9 -9 L5 -17 L0 -9 L-5 -17 L-9 -9Z" fill="#5fa83a" stroke="#3b7020" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M-8 6 Q-9 -1 -4 -3" stroke="#e9f8c9" stroke-width="3" fill="none" stroke-linecap="round"/>',
    stein: '<path d="M-26 8 Q-28 -10 -8 -14 Q14 -18 25 -5 Q30 8 18 14 Q-8 18 -26 8Z" fill="#767070" stroke="#2f2b2b" stroke-width="2"/>' +
      '<path d="M-14 -3 Q-6 -9 4 -8 M2 6 Q10 1 18 3" stroke="#c9c4c4" stroke-width="3" fill="none" stroke-linecap="round"/>',
    erdbeere: '<path d="M-20 -8 Q-22 14 0 24 Q22 14 20 -8 Q10 -17 0 -13 Q-10 -17 -20 -8Z" fill="#e0242e" stroke="#7d1017" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M-12 -12 L-6 -22 L0 -15 L6 -22 L12 -12 L0 -9Z" fill="#4da02f" stroke="#2c6a16" stroke-width="2" stroke-linejoin="round"/>' +
      '<g fill="#ffd9a0"><circle cx="-9" cy="-1" r="1.6"/><circle cx="2" cy="1" r="1.6"/><circle cx="10" cy="-2" r="1.6"/><circle cx="-4" cy="9" r="1.6"/><circle cx="6" cy="11" r="1.6"/></g>'
  };
  function shape(kind, x, y, scale) {
    var g = Biber.svg('g', { transform: 'translate(' + x + ' ' + y + ') scale(' + (scale || 1) + ')' });
    g.innerHTML = SHAPES[kind];
    return g;
  }

  var el, api, svgEl;
  var item, removed, locked, mark, dragging;   /* mark: null | 'check' | 'solution' */

  function reset() { item = null; removed = null; mark = null; dragging = false; }

  function status() {
    if (!item) return 'Wähle zuerst, was an die Stelle der Erdbeere kommt.';
    if (!removed) return 'Tippe jetzt den Ast an, den du entfernen willst.';
    return '';
  }
  function setItem(k) {
    if (locked) return;
    item = item === k ? null : k;
    render();
    api.changed(status());
  }
  function toggleEdge(id) {
    if (locked) return;
    removed = removed === id ? null : id;
    render();
    api.changed(status());
  }

  function palette() {
    return h('div', { class: 't-erdbeerklau21-pal', role: 'radiogroup', 'aria-label': 'Was liegt an der Stelle der Erdbeere?' },
      ITEMS.map(function (k) {
        var s = Biber.svg('svg', { viewBox: '-34 -34 68 68', width: 52, height: 52, 'aria-hidden': 'true', focusable: 'false' }, shape(k, 0, 2, 1));
        return h('button', {
          type: 'button', role: 'radio', 'aria-checked': String(item === k), class: 't-erdbeerklau21-opt' + (item === k ? ' on' : ''),
          'data-item': k, disabled: locked, draggable: locked ? false : 'true', 'aria-label': KINDS[k].name
        }, s, h('span', null, KINDS[k].name));
      }));
  }

  function nodeName(id) { return id === SLOT ? (item ? KINDS[item].name + ' unten Mitte' : 'leeres Feld unten Mitte') : NODES[id].name; }

  function drawBoard() {
    var bad = (mark === 'check' && item && removed) ? conflicts(item).filter(function (id) { return id !== removed; }) : [];
    var s = Biber.svg('svg', { class: 't-erdbeerklau21-svg', viewBox: '0 0 600 330', role: 'group', 'aria-label': 'Kunstwerk aus Gegenständen und Ästen' });
    s.appendChild(Biber.svg('title', {}, 'Kunstwerk aus Gegenständen und Ästen'));
    EDGES.forEach(function (e) {
      var d = edgePath(e);
      var isRemoved = removed === e.id;
      var cls = 't-erdbeerklau21-edge' + (isRemoved ? ' removed' : '') + (bad.indexOf(e.id) >= 0 ? ' bad' : '') + (locked ? ' locked' : '');
      var g = Biber.svg('g', {
        class: cls, 'data-edge': e.id, role: 'button', tabindex: locked ? '-1' : '0', 'aria-pressed': String(isRemoved),
        'aria-label': 'Ast zwischen ' + nodeName(e.a) + ' und ' + nodeName(e.b) + (isRemoved ? ', entfernt' : '') + (bad.indexOf(e.id) >= 0 ? ', verletzt die Regel' : '')
      });
      g.appendChild(Biber.svg('path', { class: 'vis', d: d }));
      g.appendChild(Biber.svg('path', { class: 'hit', d: d }));
      s.appendChild(g);
    });
    Object.keys(NODES).forEach(function (id) {
      var n = NODES[id];
      if (id === SLOT) {
        var cls = 't-erdbeerklau21-slot' + (item ? ' filled' : '') + (dragging ? ' target' : '');
        var g = Biber.svg('g', { class: cls, 'data-slot': '' });
        g.appendChild(Biber.svg('rect', { x: n.x - 31, y: n.y - 31, width: 62, height: 62, rx: 8 }));
        if (item) g.appendChild(shape(item, n.x, n.y + 2, 1));
        else g.appendChild(Biber.svg('text', { x: n.x, y: n.y + 12, 'text-anchor': 'middle', class: 't-erdbeerklau21-q' }, '?'));
        s.appendChild(g);
      } else {
        s.appendChild(shape(n.kind, n.x, n.y + 2, 1));
      }
    });
    svgEl = s;
    return s;
  }

  function render() {
    var legend = h('p', { class: 't-erdbeerklau21-note' },
      'Regel: Ein Ast darf nicht zwischen zwei gleichen Sachen liegen.');
    var info = null;
    if (mark === 'check' && item && removed && !valid(item, removed)) {
      info = h('p', { class: 't-erdbeerklau21-info bad', role: 'status' },
        'Rot markiert: Diese Äste liegen noch zwischen zwei gleichen Sachen.');
    }
    el.replaceChildren(h('div', { class: 't-erdbeerklau21-board' },
      h('div', { class: 't-erdbeerklau21-stage' }, drawBoard()),
      legend,
      h('p', { class: 't-erdbeerklau21-lab' }, '1. Was legst du an die Stelle der Erdbeere?'),
      palette(),
      h('p', { class: 't-erdbeerklau21-lab' }, '2. Tippe den Ast an, den du entfernst. (Noch einmal tippen: zurücknehmen.)'),
      info));
  }

  function edgeFrom(t) { var g = t.closest('[data-edge]'); return g ? g.getAttribute('data-edge') : null; }

  Biber.register({
    id: 'erdbeerklau21',
    story: '<p>Anja will im Garten ein Kunstwerk herstellen. Sie hat Eicheln, Haselnüsse, Steine und eine Erdbeere gesammelt, ' +
      'legt einige Sachen auf den Rasen und danach Äste dazwischen. Dafür hat sie diese Regel: ' +
      '<b>Ein Ast darf nicht zwischen zwei gleichen Sachen liegen</b>, zum Beispiel nicht zwischen zwei Eicheln.</p>' +
      '<p>Das ist das fertige Kunstwerk. Als Anja weg ist, kommt ihr Bruder und isst die Erdbeere.</p>' +
      '<p>Lege eine andere Sache an die Stelle der Erdbeere und entferne genau einen Ast. Am Ende soll Anjas Regel auch für das veränderte Kunstwerk gelten.</p>',
    question: 'Kannst du ihm helfen, die Tat zu verschleiern?',
    howto: 'Wähle unten Eichel, Haselnuss oder Stein (oder ziehe sie auf das Feld mit dem Fragezeichen). Tippe dann den Ast an, den du entfernen willst.',
    explanation: function () {
      return '<p>Mit einer <b>Haselnuss</b> an der Stelle der Erdbeere verletzt nur ein Ast die Regel: der senkrechte Ast in der Mitte, denn er verbindet zwei Haselnüsse. ' +
        'Entfernt man genau ihn, passt wieder alles.</p>' +
        '<p>Bei den anderen Sachen reicht ein Ast nicht: Eine neue Eichel wäre über zwei Äste mit den beiden oberen Eicheln verbunden, ein neuer Stein über zwei Äste mit den beiden unteren Steinen.</p>' +
        '<p>Informatisch ist das ein Graph: Sachen sind Knoten, Äste sind Kanten. Die Regel verlangt, dass keine Kante zwei Knoten derselben Sorte verbindet (eine Art Färbung).</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', function (e) {
        var o = e.target.closest('[data-item]');
        if (o) return setItem(o.dataset.item);
        var id = edgeFrom(e.target);
        if (id) toggleEdge(id);
      });
      el.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var id = edgeFrom(e.target);
        if (id) { e.preventDefault(); toggleEdge(id); }
      });
      el.addEventListener('dragstart', function (e) {
        var o = e.target.closest('[data-item]');
        if (!o || locked) return;
        e.dataTransfer.setData('text/plain', o.dataset.item);
        e.dataTransfer.effectAllowed = 'move';
      });
      el.addEventListener('dragover', function (e) {
        if (locked) return;
        if (e.target.closest('[data-slot]')) e.preventDefault();
      });
      el.addEventListener('drop', function (e) {
        if (locked || !e.target.closest('[data-slot]')) return;
        e.preventDefault();
        var k = e.dataTransfer.getData('text/plain');
        if (ITEMS.indexOf(k) >= 0) { item = k; render(); api.changed(status()); }
      });
      render();
    },
    isComplete: function () { return !!item && !!removed; },
    evaluate: function () {
      return { correct: valid(item, removed), answer: { item: item, removed: removed } };
    },
    setAnswer: function (ans) {
      item = ans.item; removed = ans.removed; mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? 'check' : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      item = SOL.item; removed = SOL.removed; locked = true; mark = 'solution';
      render();
    }
  });
})();
