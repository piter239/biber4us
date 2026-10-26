/* Aufgabe Stock und Schild (Heft 2017, S. 56): sieben Bilder so auf ein 4x2-Feld schieben, dass jeder Stock auf ein Schild zeigt */
(function () {
  'use strict';
  var h = Biber.h;

  var COLS = 4, ROWS = 2, LUCIA = 7;               /* Feldindex von Lucia: unten rechts */
  var DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
  var OPP = { N: 'S', S: 'N', W: 'E', E: 'W' };
  var DIRNAME = { N: 'oben', S: 'unten', W: 'links', E: 'rechts' };
  /* Stock: Richtungen, in die ein Stock zeigt; Schild: Seiten, an denen ein Schild gehalten wird */
  var B = {
    b1: { stick: ['W'], shield: ['E'], alt: 'Biber mit Stock nach links und Schild rechts' },
    b2: { stick: [], shield: ['E'], alt: 'Schlafender Biber ohne Stock, mit Schild rechts' },
    b3: { stick: ['W'], shield: ['S'], alt: 'Biber mit Stock nach links und Schild unten' },
    b4: { stick: ['S'], shield: ['E'], alt: 'Biber mit Stock nach unten und Schild rechts' },
    b5: { stick: ['W'], shield: ['N'], alt: 'Biber mit Stock nach links und Schild oben' },
    b6: { stick: [], shield: ['N', 'E'], alt: 'Biber ohne Stock, mit einem Schild oben und einem Schild rechts' },
    b7: { stick: ['S'], shield: [], alt: 'Biber mit Stock nach unten, ohne Schild' },
    lucia: { stick: ['N', 'W'], shield: [], alt: 'Lucia mit einem Stock nach oben und einem Stock nach links, ohne Schild' }
  };
  var POOL = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7'];
  var SOLUTION = ['b7', 'b4', 'b1', 'b3', 'b6', 'b5', 'b2', 'lucia'];   /* Zeile für Zeile, oben links beginnend */

  function img(id, cls) {
    return h('img', { class: cls || 't-stockundschild17-img', src: 'assets/stockundschild17/' + (id === 'lucia' ? 'lucia' : 'biber' + id.slice(1)) + '.png', alt: B[id].alt, width: 300, height: 313, draggable: 'false' });
  }
  function cellName(i) {
    return 'Zeile ' + (Math.floor(i / COLS) + 1) + ', Spalte ' + (i % COLS + 1);
  }

  /* Trifft der Stock in Richtung d vom Feld i auf ein Schild? */
  function hits(slots, i, d) {
    var c = i % COLS + DIRS[d][0], r = Math.floor(i / COLS) + DIRS[d][1];
    if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return false;
    var o = slots[r * COLS + c];
    return !!o && B[o].shield.indexOf(OPP[d]) >= 0;
  }
  function stickResults(slots) {
    var res = [];
    slots.forEach(function (id, i) {
      if (!id) return;
      B[id].stick.forEach(function (d) { res.push({ i: i, d: d, ok: hits(slots, i, d) }); });
    });
    return res;
  }
  function allHit(slots) {
    return slots.every(Boolean) && stickResults(slots).every(function (r) { return r.ok; });
  }

  var el, api, slots, selected, dragging, locked, mode;   /* mode: null | 'check' | 'solution' */

  function fresh() {
    var s = [null, null, null, null, null, null, null, 'lucia'];
    return s;
  }
  function reset() { slots = fresh(); selected = null; dragging = null; mode = null; }

  function place(id, idx) {
    if (locked || idx === LUCIA) return;
    var from = slots.indexOf(id);
    var existing = slots[idx];
    if (existing === id) { selected = null; render(); return; }
    slots[idx] = id;
    if (from >= 0) slots[from] = existing || null;
    selected = null;
    render();
    api.changed(status());
  }
  function release(id) {
    if (locked) return;
    var from = slots.indexOf(id);
    if (from >= 0 && from !== LUCIA) slots[from] = null;
    selected = null;
    render();
    api.changed(status());
  }
  function status() {
    var n = slots.filter(function (s, i) { return s && i !== LUCIA; }).length;
    return n + ' von 7 Bildern auf dem Schulhof';
  }

  function render() {
    var hadFocus = el.contains(document.activeElement);
    var results = mode === 'check' ? stickResults(slots) : [];
    var pool = POOL.map(function (id) {
      if (slots.indexOf(id) >= 0) {
        return h('button', {
          type: 'button', class: 't-stockundschild17-home', 'data-home': id, disabled: locked, 'aria-label': 'Leerer Platz in der Auswahl. Antippen legt das gewählte Bild hierher zurück.'
        });
      }
      return h('button', {
        type: 'button', class: 't-stockundschild17-tile' + (selected === id ? ' selected' : ''), 'data-tile': id,
        draggable: locked ? false : 'true', 'aria-pressed': String(selected === id), 'aria-label': B[id].alt + ' (Auswahl)', disabled: locked
      }, img(id));
    });
    var cells = slots.map(function (id, i) {
      var cls = 't-stockundschild17-cell' + (i === LUCIA ? ' fixed' : '');
      var kids = [];
      var label;
      if (id) {
        if (i !== LUCIA) cls += ' filled' + (selected === id ? ' selected' : '');
        kids.push(img(id));
        label = cellName(i) + ': ' + B[id].alt + (i === LUCIA ? ' (steht fest)' : '');
        results.forEach(function (r) {
          if (r.i !== i) return;
          kids.push(h('span', { class: 't-stockundschild17-arrow ' + r.d + (r.ok ? ' ok' : ' bad'), 'aria-hidden': 'true' }));
        });
        if (mode === 'check' && B[id].stick.length) {
          var good = results.filter(function (r) { return r.i === i; }).every(function (r) { return r.ok; });
          cls += good ? ' right' : ' wrong';
          kids.push(h('span', { class: 't-stockundschild17-mark', 'aria-hidden': 'true' }, good ? '✓' : '✗'));
          label += good ? '. Alle Stöcke zeigen auf ein Schild.' : '. Ein Stock zeigt nicht auf ein Schild.';
        }
      } else {
        label = cellName(i) + ': leer';
        kids.push(h('span', { class: 't-stockundschild17-ph', 'aria-hidden': 'true' }, ''));
      }
      return h('button', {
        type: 'button', class: cls, 'data-cell': String(i), disabled: locked || i === LUCIA,
        draggable: id && i !== LUCIA && !locked ? 'true' : false, 'data-in-cell': id && i !== LUCIA ? id : false, 'aria-label': label
      }, kids);
    });
    var foc = hadFocus && document.activeElement && document.activeElement.dataset ? (document.activeElement.dataset.cell ? '[data-cell="' + document.activeElement.dataset.cell + '"]' : document.activeElement.dataset.tile ? '[data-tile="' + document.activeElement.dataset.tile + '"]' : null) : null;
    el.replaceChildren(h('div', { class: 't-stockundschild17-wrap' + (mode === 'solution' ? ' solved' : '') },
      h('section', { 'aria-label': 'Bilder der Freunde' }, h('h3', null, 'Bilder der Freunde'), h('div', { class: 't-stockundschild17-pool', 'data-pool': '' }, pool)),
      h('section', { 'aria-label': 'Schulhof' }, h('h3', null, 'Schulhof'), h('div', { class: 't-stockundschild17-field' + (mode === 'check' ? ' checked' : ''), role: 'group', 'aria-label': 'Felder auf dem Schulhof, vier Spalten und zwei Zeilen' }, cells))));
    if (foc) { var f = el.querySelector(foc); if (f && !f.disabled) f.focus(); }
  }

  function onClick(e) {
    if (locked) return;
    var t = e.target.closest('[data-tile],[data-cell],[data-home]');
    if (!t) return;
    if (t.dataset.tile) {
      selected = selected === t.dataset.tile ? null : t.dataset.tile;
      render();
      return;
    }
    if (t.dataset.home !== undefined) {
      if (selected && slots.indexOf(selected) >= 0) release(selected);
      return;
    }
    var idx = +t.dataset.cell;
    if (idx === LUCIA) return;
    if (selected) return place(selected, idx);
    if (slots[idx]) { selected = slots[idx]; render(); }
  }
  function onDragStart(e) {
    var t = e.target.closest('[data-tile],[data-in-cell]');
    if (!t || locked) return;
    dragging = t.dataset.tile || t.dataset.inCell;
    e.dataTransfer.setData('text/plain', dragging);
    e.dataTransfer.effectAllowed = 'move';
    t.classList.add('dragging');
  }
  function onDragOver(e) {
    var s = e.target.closest('[data-cell],[data-home],[data-pool]');
    if (!s || !dragging) return;
    if (s.dataset.cell !== undefined && +s.dataset.cell === LUCIA) return;
    e.preventDefault();
    if (s.dataset.cell !== undefined) s.classList.add('over');
  }
  function onDragLeave(e) {
    var s = e.target.closest('[data-cell]');
    if (s) s.classList.remove('over');
  }
  function onDrop(e) {
    var s = e.target.closest('[data-cell],[data-home],[data-pool]');
    if (!s || !dragging) return;
    e.preventDefault();
    var id = dragging;
    dragging = null;
    if (s.dataset.cell !== undefined) place(id, +s.dataset.cell);
    else if (slots.indexOf(id) >= 0) release(id);
    else render();
  }
  function onDragEnd() { dragging = null; if (!locked) render(); }

  function solutionGrid() {
    var d = h('div', { class: 't-stockundschild17-field t-stockundschild17-small', role: 'img', 'aria-label': 'Lösung: obere Reihe Biber 7, 4, 1, 3; untere Reihe Biber 6, 5, 2 und Lucia' },
      SOLUTION.map(function (id) { return h('span', { class: 't-stockundschild17-cell filled' }, img(id)); }));
    return d.outerHTML;
  }

  Biber.register({
    id: 'stockundschild17',
    story:
      '<p>Lucia und ihre Freunde sind Anhänger eines japanischen Spiels mit Stock und Schild. Für ein Foto möchten sie sich auf dem Schulhof so aufstellen, dass jeder Stock auf ein Schild zeigt. Dafür wurden Felder auf den Schulhof gezeichnet. Lucia hat sich bereits in Pose gestellt. Die Bilder darunter zeigen die Freunde in ihren Lieblingsposen.</p>',
    question: 'Schiebe die Bilder der Freunde in die Felder auf dem Schulhof. Am Ende muss jeder Stock auf ein Schild zeigen.',
    howto: 'Ziehe ein Bild in ein Feld oder tippe erst das Bild und dann das Feld an. Ein Bild auf dem Schulhof kannst Du genauso verschieben oder gegen ein anderes tauschen. Um es zurückzulegen, ziehe es zurück zur Auswahl oder tippe es und dann einen leeren Platz oben an.',
    explanation: function () {
      var bad = mode === 'check' ? stickResults(slots).filter(function (r) { return !r.ok; }).length : 0;
      var s = '';
      if (bad) s += '<p>In Deiner Aufstellung zeigt ' + (bad === 1 ? 'ein Stock' : bad + ' Stöcke') + ' nicht auf ein Schild (rot markiert).</p>';
      s += '<p>Alles auszuprobieren wäre mühsam: Sieben Bilder lassen sich auf 5040 Arten anordnen. Mit etwas Logik wird es viel weniger. Lucias Stock nach oben kann nur das Bild mit dem Schild nach unten treffen, also muss genau dieses Bild über Lucia stehen. Die beiden Biber mit Stock nach unten müssen in der oberen Reihe stehen, und unter ihnen muss jeweils ein Schild nach oben zu sehen sein. Stöcke nach links dürfen nicht in der linken Spalte stehen. So bleibt am Ende nur eine einzige Aufstellung übrig:</p>' +
        solutionGrid() +
        '<p>Dieses systematische Ausprobieren mit Zurücknehmen, wenn es nicht passt, heißt in der Informatik Backtracking. Es ist nur schnell genug, wenn man den Suchraum vorher mit logischen Regeln klein macht.</p>';
      return s;
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('dragleave', onDragLeave);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', onDragEnd);
      render();
    },
    isComplete: function () { return slots.every(Boolean); },
    evaluate: function () {
      return { correct: allHit(slots), answer: slots.slice(0, LUCIA) };
    },
    setAnswer: function (ans) {
      slots = fresh();
      (Array.isArray(ans) ? ans : []).slice(0, LUCIA).forEach(function (id, i) { slots[i] = B[id] && id !== 'lucia' && POOL.indexOf(id) >= 0 && slots.indexOf(id) < 0 ? id : null; });
      selected = null; mode = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      if (on) { mode = mode === 'solution' ? 'solution' : 'check'; selected = null; }
      else mode = null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      slots = SOLUTION.slice();
      selected = null; mode = 'solution'; locked = true;
      render();
    }
  });
})();
