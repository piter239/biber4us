/* Aufgabe Happy Birthday (Heft 2024, Klasse 7-8 mittel, 9-10 einfach): Entscheidungsplan fuer Schaltjahre vervollstaendigen */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-happybirthday24-';

  /* Drei offene Entscheidungen (Heft S. 33/34): S1 = durch 4, nicht durch 100; S2 = durch 4 und 100, nicht durch 400; S3 = durch 4, 100 und 400 */
  var SLOTS = [
    { id: 's1', right: 'ja', label: 'Entscheidung für Jahre, die durch 4, aber nicht durch 100 teilbar sind' },
    { id: 's2', right: 'nein', label: 'Entscheidung für Jahre, die durch 4 und durch 100, aber nicht durch 400 teilbar sind' },
    { id: 's3', right: 'ja', label: 'Entscheidung für Jahre, die durch 4, durch 100 und durch 400 teilbar sind' }
  ];   /* offizielle Lösung: Schaltjahr, kein Schaltjahr, Schaltjahr; per Skript gegen die echte Schaltjahr-Regel geprüft */
  var CHOICE = { ja: 'Schaltjahr', nein: 'kein Schaltjahr' };

  function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  /* Weg eines Jahres durch den Plan: Liste der besuchten Knoten und das erreichte Ziel */
  function route(y) {
    if (y % 4 !== 0) return { nodes: ['d4'], end: 'o1' };
    if (y % 100 !== 0) return { nodes: ['d4', 'd100'], end: 's1' };
    if (y % 400 !== 0) return { nodes: ['d4', 'd100', 'd400'], end: 's2' };
    return { nodes: ['d4', 'd100', 'd400'], end: 's3' };
  }

  /* Symbole: Kalenderblatt mit 29, mit Partyhut (Schaltjahr) oder durchgestrichen (kein Schaltjahr) */
  function icon(kind, big) {
    var cross = kind === 'nein';
    var s = '<svg viewBox="0 0 52 52" class="' + P + 'icon' + (big ? ' big' : '') + '" aria-hidden="true" focusable="false">' +
      '<rect x="6" y="12" width="34" height="34" rx="3" class="' + P + 'cal"/>' +
      '<rect x="6" y="12" width="34" height="8" rx="3" class="' + P + 'calTop"/>' +
      '<text x="23" y="40" text-anchor="middle" class="' + P + 'calNum">29</text>';
    if (cross) s += '<path d="M4 46 L44 10 M4 12 L44 46" class="' + P + 'cross"/>';
    else s += '<path d="M33 2 L45 20 L27 20 Z" class="' + P + 'hat"/><circle cx="33" cy="2.5" r="2.2" class="' + P + 'hatDot"/>';
    return s + '</svg>';
  }
  function iconEl(kind, big) {
    var span = h('span', { class: P + 'iconbox', 'aria-hidden': 'true' });
    span.innerHTML = icon(kind, big);
    return span;
  }

  var el, api, locked, mode, vals, testYear, testBox, slotEls, nodeEls;

  function reset() { vals = { s1: null, s2: null, s3: null }; mode = null; }

  function slotView(s) {
    var cls = P + 'slot';
    if (mode === 'check' || mode === 'solution') cls += (vals[s.id] === s.right) ? ' right' : ' wrong';
    var group = h('div', { class: cls, 'data-slot': s.id, role: 'radiogroup', 'aria-label': s.label });
    ['ja', 'nein'].forEach(function (v) {
      var input = h('input', { type: 'radio', name: P + s.id, value: v, disabled: locked, 'aria-label': CHOICE[v] });
      input.checked = vals[s.id] === v;
      group.appendChild(h('label', { class: P + 'opt' + (vals[s.id] === v ? ' on' : '') },
        input, h('span', { class: P + 'optface' }, iconEl(v, false), h('span', { class: P + 'optname' }, v === 'ja' ? 'Schaltjahr' : 'kein Schaltjahr'))));
    });
    var mark = null;
    if (mode === 'check' || mode === 'solution') {
      var ok = vals[s.id] === s.right;
      mark = h('span', { class: P + 'tick', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
    }
    return h('div', { class: P + 'slotwrap' }, group, mark);
  }

  function diamond(id, text) {
    return h('div', { class: P + 'diamond', 'data-node': id }, h('span', null, 'Jahr teilbar durch ', h('b', null, text + '?')));
  }
  function arrow(txt, dir) { return h('div', { class: P + 'arrow ' + dir, 'aria-hidden': 'true' }, h('span', null, txt), h('i')); }

  function render() {
    slotEls = {};
    var s = {};
    SLOTS.forEach(function (x) { s[x.id] = slotView(x); });
    var o1 = h('div', { class: P + 'fixed', 'data-node': 'o1' }, iconEl('nein', true), h('span', { class: P + 'fixedtxt' }, 'kein Schaltjahr'));
    nodeEls = {};
    var plan = h('div', { class: P + 'plan', role: 'group', 'aria-label': 'Entscheidungsplan: Start, dann drei Fragen nacheinander' },
      h('div', { class: P + 'start' }, h('span', { class: P + 'pill' }, 'Start')),
      h('div', { class: P + 'rowA' }, arrow('', 'down')),
      h('div', { class: P + 'row' }, o1, arrow('nein', 'left'), diamond('d4', '4')),
      h('div', { class: P + 'rowA' }, arrow('ja', 'down')),
      h('div', { class: P + 'row' }, s.s1, arrow('nein', 'left'), diamond('d100', '100')),
      h('div', { class: P + 'rowA' }, arrow('ja', 'down')),
      h('div', { class: P + 'row' }, s.s2, arrow('nein', 'left'), diamond('d400', '400')),
      h('div', { class: P + 'rowA' }, arrow('ja', 'down')),
      h('div', { class: P + 'row last' }, h('div', { class: P + 'slotcell' }, s.s3)));
    // Knoten fuer die Testanzeige einsammeln
    Array.prototype.forEach.call(plan.querySelectorAll('[data-node]'), function (n) { nodeEls[n.dataset.node] = n; });
    Array.prototype.forEach.call(plan.querySelectorAll('[data-slot]'), function (n) { nodeEls[n.dataset.slot] = n.parentNode; });
    planEl.replaceChildren(plan);
    showTest();
  }

  function showTest() {
    Object.keys(nodeEls).forEach(function (k) { nodeEls[k].classList.remove('visited', 'reached'); });
    var out = testBox.querySelector('.' + P + 'result');
    var y = parseInt(testYear.value, 10);
    if (!(y >= 1 && y <= 99999)) { out.textContent = 'Gib eine Jahreszahl ein, um den Weg durch den Plan zu sehen.'; return; }
    var r = route(y);
    r.nodes.forEach(function (n) { nodeEls[n].classList.add('visited'); });
    nodeEls[r.end].classList.add('reached');
    var txt = y + ' ist ' + (y % 4 ? 'nicht ' : '') + 'durch 4 teilbar';
    if (y % 4 === 0) txt += ', ' + (y % 100 ? 'nicht ' : '') + 'durch 100 teilbar' + (y % 100 === 0 ? ', ' + (y % 400 ? 'nicht ' : '') + 'durch 400 teilbar' : '');
    txt += '. ';
    if (r.end === 'o1') txt += 'Der Plan endet bei „kein Schaltjahr“.';
    else if (vals[r.end]) txt += 'Mit deinen Entscheidungen endet der Plan bei „' + CHOICE[vals[r.end]] + '“.';
    else txt += 'Der Plan endet an einer Stelle, die du noch nicht festgelegt hast.';
    out.textContent = txt;
  }

  var planEl;

  function onChange(e) {
    if (locked || !e.target.matches('input[type=radio]')) return;
    var slot = e.target.closest('[data-slot]').dataset.slot;
    vals[slot] = e.target.value;
    mode = null;
    render();
    var f = planEl.querySelector('[data-slot="' + slot + '"] input:checked'); if (f) f.focus();
    api.changed();
  }

  Biber.register({
    id: 'happybirthday24',
    story: '<p>Johanna wurde in einem Schaltjahr an einem 29. Februar geboren. Nur wenn wieder ein Schaltjahr ist, kann sie ihren Geburtstag am 29. Februar feiern. ' +
      'Bisher war das alle vier Jahre. Um schnell bestimmen zu können, ob ein Jahr ein Schaltjahr ist, hat Johanna einen „Entscheidungsplan“ gemacht: Ist das Jahr durch 4 teilbar, ist es ein Schaltjahr.</p>' +
      '<p>Nach einiger Zeit lernt Johanna, dass es etwas komplizierter ist:</p>' +
      '<ul><li>Wenn das Jahr durch 100 teilbar ist, ist es kein Schaltjahr (zum Beispiel 1900).</li>' +
      '<li>Ist das Jahr aber durch 400 teilbar, dann ist es doch ein Schaltjahr (zum Beispiel 2000).</li></ul>' +
      '<p>Johanna erweitert ihren Plan und fügt zwei Fragen hinzu. Nur die Entscheidungen sind noch offen: Schaltjahr (Kalender mit 29 und Partyhut) oder nicht (durchgestrichener Kalender).</p>',
    question: 'Hilf Johanna und wähle für jede offene Stelle die richtige Entscheidung aus.',
    howto: 'Tippe bei jeder offenen Stelle auf „Schaltjahr“ oder „kein Schaltjahr“. Unten kannst du eine Jahreszahl eingeben und den Weg durch den Plan verfolgen.',
    explanation: function () {
      return '<p>Wer durch 400 teilbar ist, ist auch durch 100 und durch 4 teilbar. Die 400er-Regel hebt deshalb die 100er-Regel wieder auf, und beide Fragen werden nur für Jahre gestellt, die durch 4 teilbar sind.</p>' +
        '<ul><li><b>Durch 4, aber nicht durch 100</b> (zum Beispiel 2024): Keine der neuen Regeln trifft zu, es bleibt bei „Schaltjahr“.</li>' +
        '<li><b>Durch 4 und 100, aber nicht durch 400</b> (zum Beispiel 1900): Nur die 100er-Regel trifft zu, also „kein Schaltjahr“.</li>' +
        '<li><b>Durch 4, 100 und 400</b> (zum Beispiel 2000): Die 400er-Regel trifft zu, also „Schaltjahr“.</li></ul>' +
        '<p><b>Informatik:</b> Der Entscheidungsplan beschreibt einen Algorithmus: Er ist endlich, jede Frage ist eindeutig, und für jede Jahreszahl führt er nach endlich vielen Schritten zu einer Entscheidung. ' +
        'Solche Pläne heißen Programmablaufpläne. Sie beschreiben ein Verfahren, ohne an eine bestimmte Programmiersprache gebunden zu sein.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset(); testYear = null;
      planEl = h('div', { class: P + 'planhost' });
      testYear = h('input', { type: 'number', class: P + 'year', min: '1', max: '99999', inputmode: 'numeric', value: '2024', 'aria-label': 'Jahreszahl zum Ausprobieren', oninput: showTest });
      testBox = h('div', { class: P + 'test' },
        h('h3', null, 'Plan ausprobieren'),
        h('div', { class: P + 'testrow' }, h('label', { class: P + 'yl' }, 'Jahr: ', testYear),
          [1900, 2000, 2024].map(function (y) { return h('button', { type: 'button', class: 'btn ghost ' + P + 'ex', onclick: function () { testYear.value = y; showTest(); } }, String(y)); })),
        h('p', { class: P + 'result', 'aria-live': 'polite' }));
      el.replaceChildren(h('div', { class: P.slice(0, -1) }, planEl, testBox));
      planEl.addEventListener('change', onChange);
      render();
    },
    isComplete: function () { return !!(vals.s1 && vals.s2 && vals.s3); },
    evaluate: function () {
      var ok = SLOTS.every(function (s) { return vals[s.id] === s.right; });
      return { correct: ok, answer: [vals.s1, vals.s2, vals.s3] };
    },
    setAnswer: function (ans) {
      vals = { s1: ans[0] || null, s2: ans[1] || null, s3: ans[2] || null };
      mode = 'check'; render();
    },
    lock: function (on) {
      locked = on;
      mode = on ? (mode || 'check') : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      SLOTS.forEach(function (s) { vals[s.id] = s.right; });
      mode = 'solution'; locked = true; render();
    }
  });
})();
