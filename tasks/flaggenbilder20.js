/* Aufgabe Flaggenbilder (Biber 2020; Klasse 11-13 schwer): Lauflängenkodierung - Flaggen nach Größe der GIW-Datei ordnen */
(function () {
  'use strict';
  var h = Biber.h, S = Biber.svg;
  var P = 't-flaggenbilder20-';

  /* Beispielraster für die Zeilenansicht (3:2). Die Rechnung im Heft ist unabhängig von der genauen Pixelzahl. */
  var W = 60, H = 40;
  var COL = {
    gru: { k: 'grü', fill: '#4eae42' }, wei: { k: 'wei', fill: '#f6f6f6' }, bla: { k: 'bla', fill: '#3371b3' },
    rot: { k: 'rot', fill: '#c60c30' }, gel: { k: 'gel', fill: '#f2d02b' }, mar: { k: 'bla', fill: '#2a4577' },
    fbl: { k: 'bla', fill: '#313c95' }, frt: { k: 'rot', fill: '#d9142f' }, sbl: { k: 'bla', fill: '#2c5a97' }
  };
  var APEX = 0.43 * W;
  var FLAGS = {
    sl: { name: 'Sierra Leone', pix: function (x, y) { return y * 3 < H ? 'gru' : (y * 3 < 2 * H ? 'wei' : 'bla'); } },
    cz: { name: 'Tschechien', pix: function (x, y) {
      var blueLen = APEX * (1 - Math.abs(y + 0.5 - H / 2) / (H / 2));
      if (x + 0.5 <= blueLen) return 'mar';
      return y + 0.5 < H / 2 ? 'wei' : 'rot';
    } },
    fr: { name: 'Frankreich', pix: function (x) { return x * 3 < W ? 'fbl' : (x * 3 < 2 * W ? 'wei' : 'frt'); } },
    se: { name: 'Schweden', pix: function (x, y) { return (x >= 19 && x < 26) || (y >= 16 && y < 24) ? 'gel' : 'sbl'; } }
  };
  var ORDER = ['sl', 'cz', 'fr', 'se'];            /* Reihenfolge im Vorrat (wie im Heft) */
  var RIGHT = ['fr', 'se', 'cz', 'sl'];            /* größte GIW-Datei zuerst: Frankreich, Schweden, Tschechien, Sierra Leone (wie im Heft) */

  /* Läufe einer Pixelzeile: [[Farbe, Anzahl], ...]. Zwei Nachbarn gleicher Kürzel zählen nicht als Wechsel der Farbe. */
  function runs(id, y) {
    var out = [];
    for (var x = 0; x < W; x++) {
      var c = FLAGS[id].pix(x, y);
      if (out.length && out[out.length - 1][0] === c) out[out.length - 1][1]++;
      else out.push([c, 1]);
    }
    return out;
  }
  function pairs(id, y) { return runs(id, y).length; }
  function total(id) { var s = 0; for (var y = 0; y < H; y++) s += pairs(id, y); return s; }
  var TOT = {};
  ORDER.forEach(function (id) { TOT[id] = total(id); });
  /* Abgleich mit der Reihenfolge im Heft: Summe der Klammerpaare muss streng fallen */
  var DERIVED = ORDER.slice().sort(function (a, b) { return TOT[b] - TOT[a]; });

  var flagCache = {};
  function flagSvg(id, row) {
    var key = id + '|' + row;
    if (flagCache[key]) return flagCache[key];
    var g = '';
    for (var y = 0; y < H; y++) {
      var x0 = 0;
      runs(id, y).forEach(function (r) {
        g += '<rect x="' + x0 + '" y="' + y + '" width="' + (r[1] + 0.04) + '" height="1.04" fill="' + COL[r[0]].fill + '"/>';
        x0 += r[1];
      });
    }
    var line = row == null ? '' : '<rect x="-1" y="' + row + '" width="' + (W + 2) + '" height="1" class="' + P + 'rowline"/>';
    return (flagCache[key] = '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" shape-rendering="crispEdges" aria-hidden="true" focusable="false">' + g + line + '</svg>');
  }
  function flagEl(id, cls, row) {
    var d = document.createElement('div');
    d.className = cls;
    d.innerHTML = flagSvg(id, row);
    return d;
  }
  function giw(id, y) {
    return runs(id, y).map(function (r) { return '(' + COL[r[0]].k + ',' + r[1] + ')'; }).join('');
  }

  var el, api, locked, slots, selected, dragging, row, rowOut, rowInput, rowLabel, rowList;

  function reset() { slots = [null, null, null, null]; selected = null; dragging = null; }
  function isRight() { return RIGHT.every(function (id, i) { return slots[i] === id; }); }

  function place(id, idx) {
    if (locked) return;
    var from = slots.indexOf(id);
    var existing = slots[idx];
    slots[idx] = id;
    if (from >= 0) slots[from] = existing === id ? null : existing;
    selected = null;
    render();
    api.changed();
  }
  function release(id) {
    if (locked) return;
    var from = slots.indexOf(id);
    if (from >= 0) slots[from] = null;
    selected = null;
    render();
    api.changed();
  }

  var SLOT_NAMES = ['größte Datei', '', '', 'kleinste Datei'];
  function render(markResult) {
    var pool = ORDER.map(function (id) {
      if (slots.indexOf(id) >= 0) return h('div', { class: P + 'cell', 'aria-hidden': 'true' });
      var b = h('button', {
        type: 'button', class: P + 'card' + (selected === id ? ' selected' : ''), 'data-flag': id,
        draggable: locked ? false : 'true', 'aria-pressed': String(selected === id), 'aria-label': 'Flagge ' + FLAGS[id].name, disabled: locked
      }, flagEl(id, P + 'flag'));
      return b;
    });
    var slotEls = [0, 1, 2, 3].map(function (i) {
      var id = slots[i];
      var cls = P + 'slot' + (id ? ' filled' : '');
      var mark = null;
      if (markResult === 'check') {
        var ok = id === RIGHT[i];
        cls += ok ? ' right' : ' wrong';
        mark = h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      } else if (markResult === 'solution') cls += ' right';
      var pos = 'Platz ' + (i + 1) + ' von 4' + (i === 0 ? ' (größte Datei)' : i === 3 ? ' (kleinste Datei)' : '');
      var btn = h('button', {
        type: 'button', class: cls, 'data-slot': String(i), draggable: id && !locked ? 'true' : false, 'data-in-slot': id || false, disabled: locked,
        'aria-label': pos + ': ' + (id ? 'Flagge ' + FLAGS[id].name : 'leer')
      }, id ? flagEl(id, P + 'flag') : h('span', { class: P + 'ph', 'aria-hidden': 'true' }, String(i + 1)), mark);
      return h('div', { class: P + 'place' },
        h('span', { class: P + 'cap', 'aria-hidden': 'true' }, i === 0 ? 'größte' : i === 3 ? 'kleinste' : ' '), btn);
    });
    el.querySelector('.' + P + 'pool').replaceChildren.apply(el.querySelector('.' + P + 'pool'), pool);
    el.querySelector('.' + P + 'slots').replaceChildren.apply(el.querySelector('.' + P + 'slots'), slotEls);
  }

  /* ---------- Zeilenansicht ---------- */
  function renderRows() {
    var y = row;
    rowLabel.textContent = 'Pixelzeile ' + (y + 1) + ' von ' + H;
    rowOut.textContent = y + 1;
    rowList.replaceChildren.apply(rowList, ORDER.map(function (id) {
      var n = pairs(id, y);
      var li = h('li', { class: P + 'rowitem' });
      li.appendChild(flagEl(id, P + 'mini', y));
      li.appendChild(h('div', { class: P + 'code' },
        h('strong', null, FLAGS[id].name),
        h('code', null, giw(id, y)),
        h('span', { class: P + 'n' }, n + (n === 1 ? ' Klammerpaar' : ' Klammerpaare'))));
      return li;
    }));
  }

  /* ---------- Ziehen / Antippen ---------- */
  function onClick(e) {
    var t = e.target.closest('[data-flag],[data-slot]');
    if (!t || locked) return;
    if (t.dataset.flag) {
      selected = selected === t.dataset.flag ? null : t.dataset.flag;
      render();
      return;
    }
    var idx = +t.dataset.slot;
    if (selected) return place(selected, idx);
    if (slots[idx]) release(slots[idx]);
  }
  function onDragStart(e) {
    var t = e.target.closest('[data-flag],[data-in-slot]');
    if (!t || locked) return;
    dragging = t.dataset.flag || t.dataset.inSlot;
    e.dataTransfer.setData('text/plain', dragging);
    e.dataTransfer.effectAllowed = 'move';
    t.classList.add('dragging');
  }
  function onDragOver(e) {
    var s = e.target.closest('[data-slot],[data-pool]');
    if (!s || !dragging) return;
    e.preventDefault();
    if (s.dataset.slot) s.classList.add('over');
  }
  function onDragLeave(e) {
    var s = e.target.closest('[data-slot]');
    if (s) s.classList.remove('over');
  }
  function onDrop(e) {
    var s = e.target.closest('[data-slot],[data-pool]');
    if (!s || !dragging) return;
    e.preventDefault();
    var id = dragging;
    dragging = null;
    if (s.dataset.slot) place(id, +s.dataset.slot); else release(id);
  }
  function onDragEnd() { dragging = null; if (!locked) render(); }

  Biber.register({
    id: 'flaggenbilder20',
    story:
      '<p>Computerbilder bestehen aus Zeilen von Bildpunkten, genannt Pixel. Wenn Computerbilder als Dateien gespeichert werden, wird im einfachsten Fall die Farbe jedes Pixels einzeln beschrieben.</p>' +
      '<p>Mit dem (erfundenen) Dateiformat GIW werden Computerbilder komprimiert, also mit geringerer Dateigröße gespeichert. Das funktioniert so:</p>' +
      '<ul><li>Jede Pixelzeile wird einzeln beschrieben.</li>' +
      '<li>Jede Farbe wird durch ein Kürzel aus drei Buchstaben beschrieben.</li>' +
      '<li>Eine Folge gleichfarbiger Pixel wird durch ein Klammerpaar beschrieben, das ein Farbkürzel und die Anzahl der gleichfarbigen Pixel enthält.</li></ul>' +
      '<p>Ein Beispiel: Eine Pixelzeile, die durch die beiden Klammerpaare <code>(grü,20)(wei,13)</code> beschrieben wird, enthält zuerst 20 grüne und danach 13 weiße Pixel.</p>' +
      '<p>Unten siehst du vier Computerbilder von Flaggen. Die Bilder bestehen alle aus gleich vielen Pixelzeilen mit jeweils gleich vielen Pixeln. Sie wurden als Dateien im GIW-Format gespeichert. Die Größe einer GIW-Datei ergibt sich aus der Anzahl der darin enthaltenen Klammerpaare.</p>',
    question: 'Ordne die Bilder nach der Größe ihrer GIW-Datei!',
    howto: 'Ziehe die Flaggen in die Felder, links die größte Datei, rechts die kleinste. Du kannst auch erst eine Flagge und dann das Feld antippen. Mit dem Regler siehst du, wie eine einzelne Pixelzeile im GIW-Format aussieht (die Bilder sind hier 60 × 40 Pixel groß).',
    explanation: function () {
      function li(id, text) { return '<li><strong>' + FLAGS[id].name + '</strong>: ' + text + '</li>'; }
      return '<p>Eine Zeile aus nur einer Farbe braucht ein einziges Klammerpaar. Nach jedem Farbwechsel in einer Zeile kommt ein weiteres Klammerpaar dazu. Man muss also nur die Farbwechsel pro Zeile zählen:</p>' +
        '<ul class="' + P + 'why">' +
        li('fr', 'In jeder Zeile gibt es zwei Farbwechsel, also drei Klammerpaare pro Zeile.') +
        li('se', 'In den meisten Zeilen gibt es zwei Farbwechsel (drei Klammerpaare), nur in den Zeilen des gelben Querbalkens keinen (ein Klammerpaar). Im Mittel sind es mehr als zwei, aber weniger als drei.') +
        li('cz', 'In jeder Zeile gibt es genau einen Farbwechsel, also zwei Klammerpaare pro Zeile.') +
        li('sl', 'Jede Zeile hat nur eine Farbe, also ein Klammerpaar pro Zeile.') + '</ul>' +
        '<p>Die Reihenfolge von groß nach klein ist daher: Frankreich, Schweden, Tschechien, Sierra Leone. Das Verfahren heißt Lauflängenkodierung: Statt jedes Pixel einzeln zu speichern, merkt man sich Farbe und Länge jeder gleichfarbigen Strecke. Das ist ein einfaches Beispiel für Datenkompression.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset(); row = 19;
      rowLabel = h('label', { class: P + 'rowlabel', for: P + 'range' });
      rowOut = h('span', { class: P + 'rownum', 'aria-hidden': 'true' });
      rowInput = h('input', {
        type: 'range', id: P + 'range', min: '1', max: String(H), step: '1', value: String(row + 1), class: P + 'range',
        'aria-describedby': P + 'rowlist',
        oninput: function () { row = +rowInput.value - 1; renderRows(); }
      });
      rowList = h('ul', { class: P + 'rowlist', id: P + 'rowlist', 'aria-live': 'polite' });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { 'aria-label': 'Flaggen' }, h('h3', null, 'Flaggen'), h('div', { class: P + 'pool', 'data-pool': '' })),
        h('section', { 'aria-label': 'Reihenfolge' }, h('h3', null, 'Reihenfolge nach Dateigröße'), h('div', { class: P + 'slots' })),
        h('section', { class: P + 'rows', 'aria-label': 'Eine Pixelzeile im GIW-Format' },
          h('h3', null, 'Eine Pixelzeile ansehen'), h('div', { class: P + 'rowbar' }, rowLabel, rowInput), rowList)));
      el.addEventListener('click', onClick);
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('dragleave', onDragLeave);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', onDragEnd);
      render();
      renderRows();
    },
    isComplete: function () { return slots.every(Boolean); },
    evaluate: function () { return { correct: isRight(), answer: slots.slice() }; },
    setAnswer: function (ans) {
      slots = ans.slice();
      render(isRight() ? 'solution' : 'check');
    },
    lock: function (on) {
      locked = on;
      if (on) render('check'); else render();
    },
    reset: function () { reset(); locked = false; render(); },
    showSolution: function () {
      slots = RIGHT.slice();
      locked = true;
      render('solution');
    }
  });
})();
