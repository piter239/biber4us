/* Aufgabe Lichterstern (Logik, Operatoren): Welche Lichter sind an, wenn alle roten an sind? */
(function () {
  'use strict';
  var h = Biber.h;

  var VW = 480, VH = 470;
  // Koordinaten aus der Abbildung im Heft (Pixel einer Ausschnitt-Vorlage), in den Zeichenraum umgerechnet
  function X(px) { return Math.round(((px - 170) * 0.47 + 45) * 10) / 10; }
  function Y(py) { return Math.round(((py - 115) * 0.47 + 40) * 10) / 10; }

  // kind: r = rot (rund), b = blau (quadratisch, UND), y = gelb (fünfeckig, genau eins = XOR)
  // in: die beiden Steuer-Lichter (Pfeile zeigen von dort auf dieses Licht)
  var NODES = [
    { id: 'rt', kind: 'r', x: X(595), y: Y(115), name: 'Rot oben' },
    { id: 'y1', kind: 'y', x: X(430), y: Y(335), name: 'Gelb oben links', in: ['rt', 'rl'] },
    { id: 'b1', kind: 'b', x: X(760), y: Y(337), name: 'Blau oben rechts', in: ['rt', 'rr'] },
    { id: 'rl', kind: 'r', x: X(170), y: Y(420), name: 'Rot links' },
    { id: 'rr', kind: 'r', x: X(1015), y: Y(420), name: 'Rot rechts' },
    { id: 'b2', kind: 'b', x: X(598), y: Y(398), name: 'Blau oben Mitte', in: ['y1', 'b1'] },
    { id: 'b3', kind: 'b', x: X(458), y: Y(510), name: 'Blau links innen', in: ['y1', 'b4'] },
    { id: 'y2', kind: 'y', x: X(753), y: Y(512), name: 'Gelb rechts innen', in: ['b1', 'y3'] },
    { id: 'b4', kind: 'b', x: X(325), y: Y(650), name: 'Blau links unten', in: ['rl', 'rbl'] },
    { id: 'y3', kind: 'y', x: X(863), y: Y(650), name: 'Gelb rechts unten', in: ['rr', 'rbr'] },
    { id: 'b5', kind: 'b', x: X(705), y: Y(690), name: 'Blau rechts innen', in: ['y3', 'y5'] },
    { id: 'y4', kind: 'y', x: X(503), y: Y(712), name: 'Gelb links unten innen', in: ['b4', 'y5'] },
    { id: 'y5', kind: 'y', x: X(598), y: Y(868), name: 'Gelb unten Mitte', in: ['rbl', 'rbr'] },
    { id: 'rbl', kind: 'r', x: X(320), y: Y(925), name: 'Rot unten links' },
    { id: 'rbr', kind: 'r', x: X(855), y: Y(925), name: 'Rot unten rechts' }
  ];
  var BY = {};
  NODES.forEach(function (n) { BY[n.id] = n; });
  var KIND = { r: 'rotes rundes', b: 'blaues quadratisches', y: 'gelbes fünfeckiges' };
  var R = 21;                                   // Radius der Lichter im Zeichenraum

  // Zustand aller Lichter, wenn alle roten an sind (Simulation nach den Regeln der Aufgabe)
  var truth = {};
  function on(id) {
    if (id in truth) return truth[id];
    var n = BY[id], v;
    if (n.kind === 'r') v = true;
    else {
      var a = on(n.in[0]), b = on(n.in[1]);
      v = n.kind === 'b' ? (a && b) : (a !== b);
    }
    return (truth[id] = v);
  }
  NODES.forEach(function (n) { on(n.id); });
  var CHOICES = NODES.filter(function (n) { return n.kind !== 'r'; }).map(function (n) { return n.id; });
  var SOLUTION = CHOICES.filter(function (id) { return truth[id]; });   // b1, b4, y2, y4
  // Reihenfolge für die Tastatur: von oben nach unten
  var TAB = CHOICES.slice().sort(function (a, b) { return BY[a].y - BY[b].y || BY[a].x - BY[b].x; });

  /* ---- Formen ---- */
  function pent(cx, cy, r) {
    var pts = [];
    for (var i = 0; i < 5; i++) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / 5;
      pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1));
    }
    return pts.join(' ');
  }
  function shape(n) {
    if (n.kind === 'r') return '<circle class="ls-shape" cx="' + n.x + '" cy="' + n.y + '" r="' + R + '"/>';
    if (n.kind === 'b') return '<rect class="ls-shape" x="' + (n.x - 18) + '" y="' + (n.y - 18) + '" width="36" height="36" rx="3"/>';
    return '<polygon class="ls-shape" points="' + pent(n.x, n.y, R + 2) + '"/>';
  }
  function halo(n) {
    return '<circle class="ls-halo" cx="' + n.x + '" cy="' + n.y + '" r="' + (R + 11) + '"/>';
  }
  function glyph(n, isOn) {
    var d = isOn ? 'M' + (n.x - 9) + ',' + (n.y + 1) + ' L' + (n.x - 3) + ',' + (n.y + 8) + ' L' + (n.x + 10) + ',' + (n.y - 8)
      : 'M' + (n.x - 8) + ',' + (n.y - 8) + ' L' + (n.x + 8) + ',' + (n.y + 8) + ' M' + (n.x + 8) + ',' + (n.y - 8) + ' L' + (n.x - 8) + ',' + (n.y + 8);
    return '<path class="ls-glyph" d="' + d + '"/>';
  }
  // Pfeil vom Steuer-Licht a zum Licht b, an den Rändern der Formen gekürzt
  function arrow(a, b) {
    var dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx * dx + dy * dy);
    var ux = dx / len, uy = dy / len;
    var s = R + 5, e = R + 8;
    return '<line class="ls-arrow" x1="' + (a.x + ux * s).toFixed(1) + '" y1="' + (a.y + uy * s).toFixed(1) +
      '" x2="' + (b.x - ux * e).toFixed(1) + '" y2="' + (b.y - uy * e).toFixed(1) + '" marker-end="url(#ls-head)"/>';
  }

  /* ---- Zustand ---- */
  var el, api, wrap, sel, locked, mark;       // sel: { id: true } der als „an“ markierten Lichter

  function reset() { sel = {}; mark = null; }
  function chosen() { return CHOICES.filter(function (id) { return sel[id]; }); }
  function isRight() {
    var c = chosen();
    return c.length === SOLUTION.length && SOLUTION.every(function (id) { return sel[id]; });
  }
  function lit(n) { return n.kind === 'r' || !!sel[n.id]; }

  function ariaOf(n) {
    var s = n.name + ' (' + KIND[n.kind] + ' Licht)';
    if (n.in) s += ', gesteuert von ' + BY[n.in[0]].name + ' und ' + BY[n.in[1]].name;
    return s;
  }

  function svg() {
    var s = '<svg class="ls-svg" viewBox="0 0 ' + VW + ' ' + VH + '" aria-hidden="true" focusable="false">' +
      '<defs><marker id="ls-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
      '<path d="M1,1 L9,5 L1,9" class="ls-head"/></marker></defs>';
    NODES.forEach(function (n) {
      var isOn = lit(n);
      var cls = 'ls-node ls-' + n.kind + (isOn ? ' on' : ' off');
      if (mark && n.kind !== 'r') {
        var right = !!sel[n.id] === truth[n.id];
        cls += right ? ' ok' : ' bad';
      }
      s += '<g class="' + cls + '">' + (isOn ? halo(n) : '') + shape(n) + glyph(n, isOn) + '</g>';
    });
    NODES.forEach(function (n) { if (n.in) s += arrow(BY[n.in[0]], n) + arrow(BY[n.in[1]], n); });
    return s + '</svg>';
  }

  function render() {
    var box = h('div', { class: 'ls-fig' });
    box.innerHTML = svg();
    TAB.forEach(function (id) {
      var n = BY[id];
      var pressed = !!sel[id];
      var cls = 'ls-btn' + (pressed ? ' pressed' : '');
      var m = null;
      if (mark === 'check' || mark === 'solution') {
        var right = pressed === truth[id];
        if (mark === 'check' && !right) { cls += ' wrong'; m = h('span', { class: 'ls-mark', 'aria-hidden': 'true' }, '✗'); }
        else if (right && truth[id]) { cls += ' right'; m = h('span', { class: 'ls-mark', 'aria-hidden': 'true' }, '✓'); }
      }
      box.appendChild(h('button', {
        type: 'button', class: cls, 'data-id': id, disabled: locked, 'aria-pressed': String(pressed),
        'aria-label': ariaOf(n) + ': ' + (pressed ? 'als an markiert' : 'nicht markiert'), title: n.name,
        style: 'left:' + (n.x / VW * 100).toFixed(3) + '%;top:' + (n.y / VH * 100).toFixed(3) + '%'
      }, m));
    });
    el.replaceChildren(h('div', { class: 'ls-board' }, box,
      h('p', { class: 'ls-count', 'aria-live': 'polite' }, chosen().length === 0 ? 'Noch kein Licht markiert.' :
        chosen().length + (chosen().length === 1 ? ' Licht' : ' Lichter') + ' als „an“ markiert (ohne die roten).')));
  }

  function onClick(e) {
    var t = e.target.closest('[data-id]');
    if (!t || locked) return;
    var id = t.dataset.id;
    if (sel[id]) delete sel[id]; else sel[id] = true;
    render();
    var again = el.querySelector('[data-id="' + id + '"]');
    if (again) again.focus({ preventScroll: true });
    api.changed();
  }

  function legend() {
    return '<ul class="ls-legend">' +
      '<li><svg viewBox="0 0 48 48" aria-hidden="true"><g class="ls-node ls-r on"><circle class="ls-halo" cx="24" cy="24" r="21"/><circle class="ls-shape" cx="24" cy="24" r="13"/><path class="ls-glyph" d="M16,25 L22,32 L33,16"/></g></svg>' +
      '<span><strong>Rot</strong>: Sophie schaltet es selbst an und aus.</span></li>' +
      '<li><svg viewBox="0 0 48 48" aria-hidden="true"><g class="ls-node ls-b off"><rect class="ls-shape" x="8" y="8" width="32" height="32" rx="3"/><path class="ls-glyph" d="M16,16 L32,32 M32,16 L16,32"/></g></svg>' +
      '<span><strong>Blau</strong> ist an, wenn <em>beide</em> Steuer-Lichter an sind.</span></li>' +
      '<li><svg viewBox="0 0 48 48" aria-hidden="true"><g class="ls-node ls-y off"><polygon class="ls-shape" points="' + pent(24, 25, 18) + '"/><path class="ls-glyph" d="M17,18 L31,32 M31,18 L17,32"/></g></svg>' +
      '<span><strong>Gelb</strong> ist an, wenn <em>genau eines</em> der beiden Steuer-Lichter an ist.</span></li></ul>';
  }

  Biber.register({
    id: 'lichterstern',
    story: '<p>In ihrem Elektronikkasten hat Sophie drei Sorten Lichter: runde rote, quadratische blaue und fünfeckige gelbe. ' +
      'Sie hat einige Lichter zu einem Lichterstern verkabelt. Die Pfeile zeigen, wie die Kabel liegen.</p>' +
      '<p>Die blauen und gelben Lichter werden über die Kabel gesteuert, in Pfeilrichtung. Jedes blaue oder gelbe Licht hat also genau zwei „Steuer-Lichter“.</p>' +
      '<p>So funktionieren die Lichter:</p>' +
      legend() +
      '<p>Sophie schaltet alle roten Lichter an.</p>',
    question: 'Welche anderen Lichter sind dann auch an?',
    howto: 'Tippe die blauen und gelben Lichter an, die an sind. Ein Licht mit Haken und Schein ist an, ein Licht mit Kreuz ist aus. Nochmal tippen nimmt die Markierung zurück.',
    explanation: function () {
      var names = function (ids) { return ids.map(function (i) { return BY[i].name; }).join(', '); };
      return '<p>Man rechnet sich von den roten Lichtern aus durch die Kabel. Zuerst die Lichter, die nur von roten gesteuert werden:</p>' +
        '<ul class="ls-why"><li><strong>Blau</strong> (beide Steuer-Lichter an): ' + names(['b1', 'b4']) + ' sind <strong>an</strong>.</li>' +
        '<li><strong>Gelb</strong> (beide an, also nicht „genau eines“): ' + names(['y1', 'y3', 'y5']) + ' sind <strong>aus</strong>.</li></ul>' +
        '<p>Mit diesen Ergebnissen geht es weiter: ' + BY.y2.name + ' hat ein Steuer-Licht an (Blau oben rechts) und eins aus (Gelb rechts unten), ist also <strong>an</strong>. ' +
        BY.y4.name + ' hat ebenso genau eines an (Blau links unten) und ist <strong>an</strong>. ' +
        names(['b2', 'b3', 'b5']) + ' haben je ein Steuer-Licht, das aus ist, und bleiben <strong>aus</strong>.</p>' +
        '<p>Außer den roten sind also vier Lichter an: <strong>Blau oben rechts, Blau links unten, Gelb rechts innen und Gelb links unten innen</strong>. ' +
        'Blau verhält sich wie das logische UND, Gelb wie das „entweder … oder“ (XOR).</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      render();
    },
    isComplete: function () { return chosen().length > 0; },
    evaluate: function () { return { correct: isRight(), answer: chosen() }; },
    setAnswer: function (ans) {
      sel = {};
      (ans || []).forEach(function (id) { if (BY[id] && BY[id].kind !== 'r') sel[id] = true; });
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      sel = {};
      SOLUTION.forEach(function (id) { sel[id] = true; });
      mark = 'solution';
      locked = true;
      render();
    }
  });
})();
