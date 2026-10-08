/* Aufgabe Nasenlänge (Heft 2021, S. 42; Klasse 11-13 schwer): Programmieren mit Schleife, "warte bis" und Variable (Zähler) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-nasenlaenge21-';

  /* Bedingungen (Reihenfolge wie im Heft) */
  var CONDS = [
    { id: 'gt0', text: 'Nasenlänge > 0', test: function (x) { return x > 0; } },
    { id: 'gt08', text: 'Nasenlänge > 0,8', test: function (x) { return x > 0.8; } },
    { id: 'gt12', text: 'Nasenlänge > 1,2', test: function (x) { return x > 1.2; } },
    { id: 'lt08', text: 'Nasenlänge < 0,8', test: function (x) { return x < 0.8; } },
    { id: 'lt11', text: 'Nasenlänge < 1,1', test: function (x) { return x < 1.1; } }
  ];
  function cond(id) { return CONDS.filter(function (c) { return c.id === id; })[0]; }
  /* Offizielle Lösung (Heft S. 43): wiederhole bis <0,8 / warte bis >1,2 / warte bis <1,1.
     Per Skript geprüft (alle 60 Belegungen gegen simulierte Messreihen mit 0..5 Nicken): nur diese zählt erst ein vollständiges Nicken (senken, dann geradeaus);
     die Belegung mit vertauschten "warte bis" zählt schon das Senken und gilt im Heft nicht als richtig. */
  var SOLUTION = ['lt08', 'gt12', 'lt11'];
  var SLOT_LABEL = ['wiederhole bis', 'warte bis (1)', 'warte bis (2)'];

  var POSES = [
    { key: 'gerade', value: 1, label: 'Geradeaus schauen', name: 'Der Kunde schaut geradeaus.' },
    { key: 'gesenkt', value: 1.3, label: 'Kopf senken', name: 'Der Kunde hat den Kopf gesenkt.' },
    { key: 'gehoben', value: 0.7, label: 'Kopf heben', name: 'Der Kunde hat den Kopf gehoben.' }
  ];
  function fmt(x) { return String(x).replace('.', ','); }

  function faceSvg(value) {
    var ry = 8 * value, cy = 50;
    var top = cy - ry, bot = cy + ry;
    return '<svg class="' + P + 'face" viewBox="0 0 120 90" aria-hidden="true" focusable="false">' +
      '<circle cx="22" cy="20" r="11" fill="#b5754a" stroke="#5a3a22" stroke-width="2"/><circle cx="78" cy="20" r="11" fill="#b5754a" stroke="#5a3a22" stroke-width="2"/>' +
      '<ellipse cx="50" cy="50" rx="35" ry="33" fill="#d9a074" stroke="#5a3a22" stroke-width="2"/>' +
      '<ellipse cx="50" cy="64" rx="21" ry="15" fill="#ffd9b8" stroke="#5a3a22" stroke-width="1.5"/>' +
      '<circle cx="37" cy="38" r="3.5" fill="#222"/><circle cx="63" cy="38" r="3.5" fill="#222"/>' +
      '<ellipse cx="50" cy="' + cy + '" rx="10" ry="' + ry.toFixed(1) + '" fill="#262626"/>' +
      '<path d="M44 72 L44 83 L50 83 L50 72Z M50 72 L50 83 L56 83 L56 72Z" fill="#fff" stroke="#5a3a22" stroke-width="1.2"/>' +
      '<g stroke="#d6001c" stroke-width="2" fill="#d6001c"><path d="M92 ' + top.toFixed(1) + ' L92 ' + bot.toFixed(1) + '"/>' +
      '<path d="M88 ' + (top + 5).toFixed(1) + ' L92 ' + top.toFixed(1) + ' L96 ' + (top + 5).toFixed(1) + 'Z"/><path d="M88 ' + (bot - 5).toFixed(1) + ' L92 ' + bot.toFixed(1) + ' L96 ' + (bot - 5).toFixed(1) + 'Z"/>' +
      '<path d="M82 ' + top.toFixed(1) + ' L102 ' + top.toFixed(1) + ' M82 ' + bot.toFixed(1) + ' L102 ' + bot.toFixed(1) + '" fill="none"/></g></svg>';
  }

  function faceEl(value) { var d = h('span', { class: P + 'facebox' }); d.innerHTML = faceSvg(value); return d; }

  var el, api, slots, selected, dragging, locked, mark;
  var simEl, sim;

  function reset() { slots = [null, null, null]; selected = null; dragging = null; mark = null; }
  function isRight(s) { return SOLUTION.every(function (id, i) { return s[i] === id; }); }
  function usedChip(id) { return slots.indexOf(id) >= 0; }

  /* ---------- Simulation ---------- */
  function simReset() {
    sim = { value: 1, count: 0, pc: 0, done: false, hist: [] };
    if (slots.every(Boolean)) simStep(1, true);
  }
  function simStep(m, init) {
    var loop = cond(slots[0]).test, w1 = cond(slots[1]).test, w2 = cond(slots[2]).test;
    sim.value = m;
    if (loop(m)) { sim.done = true; return; }
    if (sim.pc === 0) { if (w1(m)) sim.pc = 1; }
    else if (w2(m)) { sim.count += 1; sim.pc = 0; }
  }
  function simPose(p) {
    if (!slots.every(Boolean) || sim.done) return;
    sim.hist.push(p.label);
    simStep(p.value);
    renderSim();
  }

  function renderSim() {
    var ready = slots.every(Boolean);
    var lines = [
      ['setze Zähler auf 0', false],
      ['wiederhole bis ' + (ready ? cond(slots[0]).text : '…'), false],
      ['warte bis ' + (ready ? cond(slots[1]).text : '…'), ready && !sim.done && sim.pc === 0],
      ['warte bis ' + (ready ? cond(slots[2]).text : '…'), ready && !sim.done && sim.pc === 1],
      ['erhöhe Zähler um 1', false],
      ['gib Zähler Karten aus', ready && sim.done]
    ];
    var state;
    if (!ready) state = 'Fülle zuerst alle drei Lücken im Programm, dann kannst du es mit einem Kunden ausprobieren.';
    else if (sim.done) state = 'Die Schleife ist beendet: Der Automat gibt ' + sim.count + (sim.count === 1 ? ' Karte' : ' Karten') + ' aus.';
    else state = 'Das Programm läuft und wartet. Zähler: ' + sim.count + '. Wähle, was der Kunde tut.';
    var btns = POSES.map(function (p) {
      return h('button', {
        type: 'button', class: P + 'pose' + (ready && sim.value === p.value ? ' now' : ''), disabled: !ready || sim.done,
        'aria-label': p.label + ' (Nasenlänge ' + fmt(p.value) + ')', onclick: function () { simPose(p); }
      }, h('span', { class: P + 'poseface' }, faceEl(p.value)), h('span', { class: P + 'poselbl' }, p.label), h('span', { class: P + 'poseval' }, fmt(p.value)));
    });
    simEl.replaceChildren(
      h('div', { class: P + 'simgrid' },
        h('ol', { class: P + 'trace', 'aria-label': 'Programmzeilen' }, lines.map(function (l) {
          return h('li', { class: l[1] ? 'cur' : false }, l[0]);
        })),
        h('div', null,
          h('div', { class: P + 'poses' }, btns),
          h('p', { class: P + 'nums' }, 'Nasenlänge: ', h('b', null, fmt(ready ? sim.value : 1)), ' · Zähler: ', h('b', null, ready ? sim.count : 0))
        )),
      h('p', { class: P + 'state', role: 'status', 'aria-live': 'polite' }, state),
      h('button', { type: 'button', class: 'btn ghost ' + P + 'again', disabled: !ready, onclick: function () { simReset(); renderSim(); } }, 'Neu starten'));
  }

  /* ---------- Programmeditor ---------- */
  function chipEl(c, inSlot) {
    return h('span', { class: P + 'chiptxt' }, c.text);
  }
  function render(markResult) {
    var pool = CONDS.map(function (c) {
      if (usedChip(c.id)) return h('span', { class: P + 'cell', 'aria-hidden': 'true' });
      return h('button', {
        type: 'button', class: P + 'chip' + (selected === c.id ? ' selected' : ''), 'data-chip': c.id, draggable: locked ? false : 'true',
        'aria-pressed': String(selected === c.id), 'aria-label': 'Bedingung ' + c.text, disabled: locked
      }, c.text);
    });
    function slotEl(i) {
      var id = slots[i], cls = P + 'slot' + (id ? ' filled' : ''), mk = null;
      if (markResult === 'check') {
        var ok = id === SOLUTION[i];
        cls += ok ? ' right' : ' wrong';
        mk = h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      } else if (markResult === 'solution') cls += ' right';
      return h('button', {
        type: 'button', class: cls, 'data-slot': String(i), draggable: id && !locked ? 'true' : false, 'data-in-slot': id || false, disabled: locked,
        'aria-label': 'Lücke bei „' + SLOT_LABEL[i] + '“: ' + (id ? cond(id).text : 'leer')
      }, id ? cond(id).text : h('span', { class: P + 'ph' }, 'Bedingung hierher'), mk);
    }
    function line(cls, text, i, extra) {
      return h('div', { class: P + 'line ' + cls }, h('span', { class: P + 'kw' }, text), i == null ? null : slotEl(i), extra);
    }
    var code = h('div', { class: P + 'code', role: 'group', 'aria-label': 'Steuerungsprogramm' },
      h('div', { class: P + 'line ' + P + 'b-var' }, h('span', { class: P + 'kw' }, 'setze '), h('code', null, 'Zähler'), h('span', { class: P + 'kw' }, ' auf '), h('code', null, '0')),
      h('div', { class: P + 'loop' },
        line(P + 'b-loop', 'wiederhole bis', 0),
        h('div', { class: P + 'inner' },
          line(P + 'b-wait', 'warte bis', 1),
          line(P + 'b-wait', 'warte bis', 2),
          h('div', { class: P + 'line ' + P + 'b-var' }, h('span', { class: P + 'kw' }, 'erhöhe '), h('code', null, 'Zähler'), h('span', { class: P + 'kw' }, ' um '), h('code', null, '1')))),
      h('div', { class: P + 'line ' + P + 'b-var' }, h('span', { class: P + 'kw' }, 'gib '), h('code', null, 'Zähler'), h('span', { class: P + 'kw' }, ' Karten aus')));
    var poseRows = POSES.map(function (p) {
      return h('tr', null, h('td', null, faceEl(p.value)), h('td', { class: P + 'val' }, fmt(p.value)), h('td', null, p.name));
    });
    var table = h('table', { class: P + 'table' },
      h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Kamera-Messung'), h('th', { scope: 'col' }, 'Wert Nasenlänge'), h('th', { scope: 'col' }, 'Kopfhaltung'))),
      h('tbody', null, poseRows));
    el.replaceChildren(h('div', { class: P + 'board' },
      table,
      h('div', { class: P + 'edit' },
        h('section', { 'aria-label': 'Programm' }, h('h3', null, 'Programm'), code),
        h('section', { 'aria-label': 'Bedingungen' }, h('h3', null, 'Bedingungen'), h('div', { class: P + 'pool', 'data-pool': '' }, pool))),
      h('section', { class: P + 'sim', 'aria-label': 'Programm ausprobieren' }, h('h3', null, 'Ausprobieren: ein Kunde am Automaten'), simEl)));
    renderSim();
  }

  function place(id, idx) {
    if (locked) return;
    var from = slots.indexOf(id), existing = slots[idx];
    slots[idx] = id;
    if (from >= 0) slots[from] = existing === id ? null : existing;
    selected = null;
    simReset();
    render();
    api.changed();
  }
  function release(id) {
    if (locked) return;
    var from = slots.indexOf(id);
    if (from >= 0) slots[from] = null;
    selected = null;
    simReset();
    render();
    api.changed();
  }
  function onClick(e) {
    var t = e.target.closest('[data-chip],[data-slot]');
    if (!t || locked || !el.contains(t)) return;
    if (t.dataset.chip) { selected = selected === t.dataset.chip ? null : t.dataset.chip; render(); return; }
    var idx = +t.dataset.slot;
    if (selected) return place(selected, idx);
    if (slots[idx]) release(slots[idx]);
  }
  function onDragStart(e) {
    var t = e.target.closest('[data-chip],[data-in-slot]');
    if (!t || locked) return;
    dragging = t.dataset.chip || t.dataset.inSlot;
    e.dataTransfer.setData('text/plain', dragging);
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e) {
    var s = e.target.closest('[data-slot],[data-pool]');
    if (!s || !dragging) return;
    e.preventDefault();
    if (s.dataset.slot) s.classList.add('over');
  }
  function onDragLeave(e) { var s = e.target.closest('[data-slot]'); if (s) s.classList.remove('over'); }
  function onDrop(e) {
    var s = e.target.closest('[data-slot],[data-pool]');
    if (!s || !dragging) return;
    e.preventDefault();
    var id = dragging; dragging = null;
    if (s.dataset.slot) place(id, +s.dataset.slot); else release(id);
  }
  function onDragEnd() { dragging = null; if (!locked) render(); }

  Biber.register({
    id: 'nasenlaenge21',
    story:
      '<p>Ein neuer Eintrittskartenautomat soll so funktionieren: Ein Kunde nickt so oft mit dem Kopf – senkt also den Kopf und schaut dann wieder geradeaus –, wie viele Karten er kaufen möchte. Danach hebt der Kunde den Kopf, und dann gibt der Automat die Karten aus.</p>' +
      '<p>Der Automat hat dazu eine Kamera eingebaut. Sie kann die Nasen der Kunden erkennen und misst ständig die Nasenlänge. Das Steuerungsprogramm des Automaten speichert das aktuelle Messergebnis unter dem Namen <code>Nasenlänge</code> und unterscheidet die Kopfhaltungen der Kunden mit Hilfe dieser Tabelle. Das Steuerungsprogramm ist fast fertig.</p>',
    question: 'Vervollständige das Steuerungsprogramm!',
    howto: 'Ziehe je eine Bedingung in eine der drei Lücken. Du kannst auch erst die Bedingung und dann die Lücke antippen. Zwei Bedingungen bleiben übrig. Unten kannst du dein Programm mit einem Kunden ausprobieren.',
    explanation: function () {
      return '<p>Das Programm hat eine zentrale Wiederholung („Schleife“). Ihre letzte Anweisung erhöht den Zähler der Karten. Die zwei „warte bis“-Anweisungen müssen also ein <strong>Nicken</strong> erkennen: Der Kunde senkt zuerst den Kopf (Nasenlänge etwa 1,3) und schaut dann wieder geradeaus (etwa 1). Das sind die Bedingungen <code>Nasenlänge &gt; 1,2</code> und danach <code>Nasenlänge &lt; 1,1</code>.</p>' +
        '<p>Die Schleife soll enden, wenn der Kunde den Kopf hebt, die Nasenlänge also deutlich unter 1 liegt. Dazu passt nur <code>Nasenlänge &lt; 0,8</code>.</p>' +
        '<p>Die Werte im Programm sind absichtlich nicht genau die aus der Tabelle: Die Kamera misst nur in kleinen Abständen (zum Beispiel 25-mal pro Sekunde). Dabei kann der Wert 1,0 ausgelassen werden, weil erst 0,95 und dann 1,03 gemessen wird. Mit Schwellenwerten wie „kleiner als 1,1“ ist das Programm robust. Vertauscht man die beiden „warte bis“, zählt der Automat schon das Senken des Kopfes und nicht erst das fertige Nicken. Eine Schleife, die so lange wiederholt, bis eine Bedingung gilt, und eine Variable, die mitzählt, sind zwei Grundbausteine des Programmierens.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      simEl = h('div', { class: P + 'simbody' });
      simReset();
      el.addEventListener('click', onClick);
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('dragleave', onDragLeave);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', onDragEnd);
      render();
    },
    isComplete: function () { return slots.every(Boolean); },
    evaluate: function () { return { correct: isRight(slots), answer: slots.slice() }; },
    setAnswer: function (ans) {
      slots = (ans && ans.length === 3 ? ans : [null, null, null]).map(function (id) { return cond(id) ? id : null; });
      simReset();
      render(isRight(slots) ? 'solution' : 'check');
    },
    lock: function (on) {
      locked = on;
      selected = null;
      render(on ? 'check' : undefined);
    },
    reset: function () { reset(); simReset(); render(); },
    showSolution: function () { slots = SOLUTION.slice(); locked = true; simReset(); render('solution'); }
  });
})();
