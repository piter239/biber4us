/* Aufgabe Biber-Bausteine (Biber 2023, S. 13; Klasse 7-8 mittel, 9-10 einfach): neun Bausteine in drei Dreier-Gruppen einteilen (Attribute: Breite, Höhe, Noppen, Nuten) */
(function () {
  'use strict';
  var h = Biber.h, svg = Biber.svg;
  var P = 't-bausteine23-';

  var WN = ['schmal', 'mittel', 'breit'], HN = ['klein', 'mittel', 'groß'];
  /* Maße in Rasterzellen aus dem Heftbild: Breite 2/3/4, Höhe 1/2/3; Noppen oben, Nuten unten (Reihenfolge wie im Heft) */
  var PIECES = [
    { id: 'p1', w: 4, hh: 1, nop: 2, nut: 2 },
    { id: 'p2', w: 2, hh: 3, nop: 1, nut: 0 },
    { id: 'p3', w: 3, hh: 3, nop: 0, nut: 0 },
    { id: 'p4', w: 3, hh: 2, nop: 2, nut: 0 },
    { id: 'p5', w: 3, hh: 2, nop: 0, nut: 1 },
    { id: 'p6', w: 3, hh: 1, nop: 2, nut: 0 },
    { id: 'p7', w: 3, hh: 1, nop: 0, nut: 2 },
    { id: 'p8', w: 4, hh: 1, nop: 0, nut: 0 },
    { id: 'p9', w: 2, hh: 1, nop: 2, nut: 1 }
  ];
  var BY = {};
  PIECES.forEach(function (p) { p.wi = p.w - 2; p.hi = p.hh - 1; BY[p.id] = p; });
  /* offizielle Lösung (Heft S. 14), Reihenfolge wie dort; per Brute Force über alle Einteilungen ist sie die einzige */
  var SOLUTION = [['p9', 'p6', 'p1'], ['p7', 'p5', 'p3'], ['p2', 'p4', 'p8']];
  var ATTRS = [
    { name: 'Breite', get: function (p) { return p.wi; } },
    { name: 'Höhe', get: function (p) { return p.hi; } },
    { name: 'Noppen', get: function (p) { return p.nop; } },
    { name: 'Nuten', get: function (p) { return p.nut; } }
  ];
  function validGroup(g) {
    return g.length === 3 && ATTRS.every(function (a) {
      var n = {};
      g.forEach(function (id) { n[a.get(BY[id])] = 1; });
      var k = Object.keys(n).length;
      return k === 1 || k === 3;
    });
  }
  function key(g) { return g.slice().sort().join(','); }
  var SOLKEYS = SOLUTION.map(key);

  function name(p) {
    return WN[p.wi] + ' (Breite), ' + HN[p.hi] + ' (Höhe), ' + p.nop + (p.nop === 1 ? ' Noppe' : ' Noppen') + ', ' + p.nut + (p.nut === 1 ? ' Nut' : ' Nuten');
  }

  /* ---------- Baustein zeichnen: 40 Einheiten je Rasterzelle ---------- */
  var U = 40, R = 10;
  function centers(n, w) { return n === 0 ? [] : n === 1 ? [w / 2] : [w / 2 - 0.5, w / 2 + 0.5]; }
  function pieceSvg(p) {
    var W = p.w * U, H = p.hh * U, d = 'M0 0', i, j;
    centers(p.nop, p.w).forEach(function (c) { var x = c * U; d += ' L' + (x - R) + ' 0 A' + R + ' ' + R + ' 0 0 1 ' + (x + R) + ' 0'; });
    d += ' L' + W + ' 0 L' + W + ' ' + H;
    centers(p.nut, p.w).reverse().forEach(function (c) { var x = c * U; d += ' L' + (x + R) + ' ' + H + ' A' + R + ' ' + R + ' 0 0 0 ' + (x - R) + ' ' + H; });
    d += ' L0 ' + H + ' Z';
    var root = svg('svg', {
      viewBox: (-2) + ' ' + (-R - 2) + ' ' + (W + 4) + ' ' + (H + R + 4), class: P + 'svg', 'aria-hidden': 'true', focusable: 'false',
      style: 'width:calc(var(--' + P + 'u) * ' + ((W + 4) / U).toFixed(3) + ')'
    }, svg('path', { d: d, class: P + 'body' }));
    for (i = 1; i < p.w; i++) for (j = 0; j < p.hh; j++)
      root.appendChild(svg('line', { x1: i * U, y1: j * U + 7, x2: i * U, y2: j * U + 33, class: P + 'slit' }));
    for (j = 1; j < p.hh; j++) for (i = 0; i < p.w; i++)
      root.appendChild(svg('line', { x1: i * U + 7, y1: j * U, x2: i * U + 33, y2: j * U, class: P + 'slit' }));
    return root;
  }

  var EXAMPLE = [{ w: 2, hh: 1, nop: 1, nut: 2 }, { w: 2, hh: 2, nop: 0, nut: 1 }, { w: 2, hh: 3, nop: 2, nut: 0 }];

  var el, api, groups, selected, locked, mark, statusEl, trayEl, backBtn, boxes;

  function reset() { groups = [[], [], []]; selected = null; mark = null; }
  function where(id) {
    for (var g = 0; g < 3; g++) if (groups[g].indexOf(id) >= 0) return g;
    return -1;
  }
  function say(t) { if (statusEl) statusEl.textContent = t; }

  function move(id, g) {   /* g: 0..2 = Gruppe, -1 = zurück zu den Bausteinen */
    if (locked) return;
    var from = where(id);
    if (from === g) { selected = null; render(); return; }
    if (g >= 0 && groups[g].length >= 3) { say('Gruppe ' + (g + 1) + ' ist schon voll. Nimm erst einen Baustein heraus.'); return; }
    if (from >= 0) groups[from].splice(groups[from].indexOf(id), 1);
    if (g >= 0) groups[g].push(id);
    selected = null;
    render();
    say(g >= 0 ? 'Baustein in Gruppe ' + (g + 1) + ' gelegt.' : 'Baustein zurückgelegt.');
    api.changed();
  }

  function pieceBtn(p, res) {
    var on = selected === p.id;
    return h('button', {
      type: 'button', class: P + 'piece' + (on ? ' selected' : ''), 'data-p': p.id, disabled: locked, draggable: locked ? false : 'true',
      'aria-pressed': String(on), 'aria-label': 'Baustein: ' + name(p) + (on ? ', ausgewählt' : '')
    }, pieceSvg(p));
  }

  function render() {
    var placed = groups.reduce(function (n, g) { return n + g.length; }, 0);
    trayEl.replaceChildren.apply(trayEl, PIECES.filter(function (p) { return where(p.id) < 0; }).map(function (p) { return pieceBtn(p); }));
    if (!trayEl.firstChild) trayEl.appendChild(h('span', { class: P + 'empty' }, 'Alle Bausteine sind verteilt.'));
    boxes.forEach(function (box, g) {
      var list = groups[g];
      var cls = P + 'box', badge = null;
      if (mark === 'check' || mark === 'solution') {
        var ok = list.length === 3 && SOLKEYS.indexOf(key(list)) >= 0;
        if (mark === 'solution') cls += ' right';
        else { cls += ok ? ' right' : ' wrong'; badge = h('span', { class: P + 'badge', 'aria-hidden': 'true' }, ok ? '✓' : '✗'); }
      }
      box.root.className = cls;
      box.list.replaceChildren.apply(box.list, list.map(function (id) { return pieceBtn(BY[id]); }).concat(badge ? [badge] : []));
      box.put.disabled = locked || !selected || (where(selected) === g) || list.length >= 3;
      box.put.setAttribute('aria-label', 'Ausgewählten Baustein in Gruppe ' + (g + 1) + ' legen (' + list.length + ' von 3 Bausteinen)');
      box.count.textContent = list.length + ' von 3';
    });
    backBtn.disabled = locked || !selected || where(selected) < 0;
    if (!statusEl.textContent) say('Tippe einen Baustein an und dann auf „Hierher“ bei einer Gruppe. Du kannst Bausteine auch ziehen.');
  }

  function select(id) {
    if (locked) return;
    selected = selected === id ? null : id;
    render();
    var b = el.querySelector('[data-p="' + id + '"]');
    if (b) b.focus({ preventScroll: true });
    say(selected ? 'Ausgewählt: ' + name(BY[id]) + '. Tippe nun bei einer Gruppe auf „Hierher“.' : 'Auswahl aufgehoben.');
  }

  function onClick(e) {
    var pb = e.target.closest('[data-p]');
    if (pb) {
      if (locked) return;
      /* ausgewählter Baustein + Tippen auf einen anderen Baustein in einer Gruppe: einfach Auswahl wechseln */
      return select(pb.dataset.p);
    }
    var put = e.target.closest('[data-put]');
    if (put && selected) return move(selected, +put.dataset.put);
    var bx = e.target.closest('[data-box]');
    if (bx && selected && e.target === bx) return move(selected, +bx.dataset.box);
  }
  var dragging = null;
  function onDragStart(e) {
    var pb = e.target.closest('[data-p]');
    if (!pb || locked) return;
    dragging = pb.dataset.p;
    e.dataTransfer.setData('text/plain', dragging);
    e.dataTransfer.effectAllowed = 'move';
  }
  function dropTarget(e) { return e.target.closest('[data-box],[data-tray]'); }
  function onDragOver(e) {
    var t = dropTarget(e);
    if (!t || !dragging) return;
    e.preventDefault();
    t.classList.add('over');
  }
  function onDragLeave(e) {
    var t = dropTarget(e);
    if (t && !t.contains(e.relatedTarget)) t.classList.remove('over');
  }
  function onDrop(e) {
    var t = dropTarget(e);
    if (!t || !dragging) return;
    e.preventDefault();
    t.classList.remove('over');
    var id = dragging;
    dragging = null;
    move(id, t.dataset.box !== undefined ? +t.dataset.box : -1);
  }
  function onDragEnd() { dragging = null; [].forEach.call(el.querySelectorAll('.over'), function (n) { n.classList.remove('over'); }); }

  function tableHtml() {
    var head = '<tr><th>Eigenschaft</th>' + SOLUTION.map(function (g, i) { return '<th>Gruppe ' + (i + 1) + '</th>'; }).join('') + '</tr>';
    var rows = ATTRS.map(function (a) {
      return '<tr><th scope="row">' + a.name + '</th>' + SOLUTION.map(function (g) {
        var n = {};
        g.forEach(function (id) { n[a.get(BY[id])] = 1; });
        return '<td>' + (Object.keys(n).length === 1 ? 'gleich' : 'unterschiedlich') + '</td>';
      }).join('') + '</tr>';
    }).join('');
    return '<table class="' + P + 'tab"><thead>' + head + '</thead><tbody>' + rows + '</tbody></table>';
  }

  Biber.register({
    id: 'bausteine23',
    story:
      '<p>Die Biber-Bausteine unterscheiden sich in vier Eigenschaften:</p>' +
      '<ol class="' + P + 'props"><li><b>Breite:</b> schmal, mittel, breit</li><li><b>Höhe:</b> klein, mittel, groß</li><li><b>Noppen oben:</b> null, eins, zwei</li><li><b>Nuten unten:</b> null, eins, zwei</li></ol>' +
      '<p>Otto teilt die Bausteine in Dreier-Gruppen ein. Er macht das so, dass für jede Gruppe gilt: Die drei Steine haben für jede der vier Eigenschaften entweder alle den gleichen Wert oder drei unterschiedliche Werte.</p>' +
      '<p>Hier ist eine von Ottos Gruppen:</p>' +
      '<div class="' + P + 'example" role="img" aria-label="Beispielgruppe: ein schmaler kleiner Baustein mit einer Noppe und zwei Nuten, ein schmaler mittelhoher Baustein ohne Noppe mit einer Nut, ein schmaler großer Baustein mit zwei Noppen und ohne Nut">' +
      EXAMPLE.map(function (p) { return pieceSvg(p).outerHTML; }).join('') + '</div>' +
      '<p>Denn diese drei Steine haben alle die gleiche Breite, unterschiedliche Höhen, unterschiedlich viele Noppen und unterschiedlich viele Nuten.</p>',
    question: 'Teile diese Bausteine in Dreier-Gruppen ein, so wie Otto es machen würde.',
    howto: 'Tippe einen Baustein an und dann bei einer Gruppe auf „Hierher“. Oder ziehe den Baustein in eine Gruppe. Tippst du einen Baustein in einer Gruppe an, kannst du ihn in eine andere Gruppe oder zurück legen.',
    explanation: function () {
      return '<p>So teilt Otto die Bausteine ein. Die Tabelle zeigt für jede Gruppe, bei welchen Eigenschaften die Werte alle gleich oder alle unterschiedlich sind.</p>' +
        '<div class="' + P + 'sol">' + SOLUTION.map(function (g, i) {
          return '<figure><div class="' + P + 'solrow">' + g.map(function (id) { return pieceSvg(BY[id]).outerHTML; }).join('') + '</div><figcaption>Gruppe ' + (i + 1) + '</figcaption></figure>';
        }).join('') + '</div>' +
        tableHtml() +
        '<p>Und es geht nur so: Die Breiten „schmal“ und „breit“ gibt es nur je zweimal, also muss eine Gruppe aus lauter mittelbreiten Steinen bestehen. Darunter hat keiner genau eine Noppe, also haben diese drei null Noppen (Gruppe 2). In den übrigen sechs Steinen gibt es nur noch je einen mittelhohen und einen großen Stein, also besteht eine Gruppe aus lauter kleinen Steinen (Gruppe 1). Der Rest ist Gruppe 3.</p>' +
        '<p>Informatik: Jeder Baustein wird durch Eigenschaften (Attribute) beschrieben. Ein Computer kann die Steine nicht sehen. Er braucht sie als Zeilen einer Tabelle, mit einer Spalte je Eigenschaft: der Entwurf einer Datenbank-Tabelle.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      statusEl = h('p', { class: P + 'status', role: 'status', 'aria-live': 'polite' });
      trayEl = h('div', { class: P + 'tray', 'data-tray': '', role: 'group', 'aria-label': 'Bausteine, noch nicht eingeteilt' });
      backBtn = h('button', { type: 'button', class: 'btn ghost ' + P + 'back', onclick: function () { if (selected) move(selected, -1); } }, 'Zurück zu den Bausteinen');
      boxes = [0, 1, 2].map(function (g) {
        var list = h('div', { class: P + 'list' });
        var count = h('span', { class: P + 'count' });
        var put = h('button', { type: 'button', class: P + 'put', 'data-put': String(g) }, 'Hierher');
        var root = h('div', { class: P + 'box', 'data-box': String(g), role: 'group', 'aria-label': 'Gruppe ' + (g + 1) },
          h('div', { class: P + 'bhead' }, h('strong', null, 'Gruppe ' + (g + 1)), count), list, put);
        return { root: root, list: list, put: put, count: count };
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { 'aria-label': 'Bausteine' }, h('h3', null, 'Bausteine'), trayEl, backBtn),
        h('section', { 'aria-label': 'Gruppen' }, h('h3', null, 'Gruppen'), h('div', { class: P + 'boxes' }, boxes.map(function (b) { return b.root; }))),
        statusEl));
      el.addEventListener('click', onClick);
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('dragleave', onDragLeave);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', onDragEnd);
      render();
    },
    isComplete: function () { return groups.every(function (g) { return g.length === 3; }); },
    evaluate: function () {
      var keys = groups.map(key).sort();
      var ok = keys.join('|') === SOLKEYS.slice().sort().join('|');
      return { correct: ok, answer: { groups: groups.map(function (g) { return g.slice(); }) } };
    },
    setAnswer: function (ans) {
      groups = (ans && ans.groups ? ans.groups : [[], [], []]).map(function (g) { return g.filter(function (id) { return BY[id]; }); });
      while (groups.length < 3) groups.push([]);
      selected = null; mark = null;
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      if (on) selected = null;
      render();
    },
    reset: function () { reset(); statusEl.textContent = ''; render(); },
    showSolution: function () {
      groups = SOLUTION.map(function (g) { return g.slice(); });
      selected = null; mark = 'solution'; locked = true;
      render();
    }
  });
})();
