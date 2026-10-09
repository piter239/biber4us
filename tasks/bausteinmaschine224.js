/* Aufgabe Baustein-Maschine 2 (Heft 2024, Klasse 9-10 schwer, 11-13 schwer): Gnomesort, Startkonfiguration mit den wenigsten Schritten */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-bausteinmaschine224-';

  var N = 6;
  var CONFIGS = [                       /* Startkonfigurationen A bis D laut Heft S. 17; die Markierung steht jeweils hinter dem ersten Stein */
    { id: 'A', order: [1, 2, 6, 5, 3, 4] },
    { id: 'B', order: [1, 6, 2, 5, 3, 4] },
    { id: 'C', order: [1, 5, 6, 2, 3, 4] },
    { id: 'D', order: [1, 2, 5, 6, 3, 4] }
  ];
  var RIGHT = 'D';                      /* offizielle Lösung (Heft S. 18); per Simulation bestätigt: A 15, B 17, C 17, D 13 Schritte */
  var COLOR = { 1: 'c1', 2: 'c4', 3: 'c2', 4: 'c5', 5: 'c6', 6: 'c3' };

  /* ein Schritt der Maschine; m = Markierung steht zwischen Stein m-1 und m (m = N: ganz rechts) */
  function step(st) {
    if (st.m >= N) return null;
    var l = st.a[st.m - 1], r = st.a[st.m], info;
    if (l < r) {
      st.m++;
      info = l + ' ist kleiner als ' + r + ': Die Markierung geht nach rechts.';
    } else {
      st.a[st.m - 1] = r; st.a[st.m] = l;
      if (st.m > 1) {
        st.m--;
        info = l + ' ist größer als ' + r + ': Die Steine werden getauscht, die Markierung geht nach links.';
      } else {
        info = l + ' ist größer als ' + r + ': Die Steine werden getauscht. Die Markierung bleibt stehen.';
      }
    }
    st.n++;
    return info;
  }
  function cfg(id) { return CONFIGS.filter(function (c) { return c.id === id; })[0]; }
  function total(order) { var s = { a: order.slice(), m: 1, n: 0 }; while (step(s) !== null) { /* weiter */ } return s.n; }

  var el, api, locked, picked, mode, simId;
  var sim, stoneEls, markerEl, boxEl, capEl, cntEl, btnStep, btnFive, btnEnd, btnBack, tabsEl, optsEl;

  function stone(v, cls) {
    return h('span', { class: P + 'stone ' + (cls || ''), 'data-v': v, style: '--h:' + v + ';--col:var(--' + COLOR[v] + ')' }, h('span', { class: P + 'num' }, v));
  }
  function orderText(a) { return a.join(', '); }

  function resetSim() { sim = { a: cfg(simId).order.slice(), m: 1, n: 0 }; }
  function buildStones() {
    stoneEls = {};
    var stones = sim.a.map(function (v) { var s = stone(v, 'big'); stoneEls[v] = s; return s; });
    stonesEl.replaceChildren.apply(stonesEl, stones.concat([h('span', { class: P + 'base' }), markerEl]));
  }
  var stonesEl;

  function placeSim(info) {
    sim.a.forEach(function (v, i) { stoneEls[v].style.setProperty('--i', i); });
    markerEl.style.setProperty('--m', sim.m);
    var done = sim.m >= N;
    boxEl.setAttribute('aria-label', 'Maschine mit Startkonfiguration ' + simId + ': Steine von links nach rechts ' + orderText(sim.a) + '. Die Markierung steht ' +
      (done ? 'ganz rechts neben den Steinen' : 'zwischen ' + sim.a[sim.m - 1] + ' und ' + sim.a[sim.m]) + '.');
    cntEl.textContent = 'Schritte der Markierung: ' + sim.n;
    capEl.textContent = done
      ? 'Die Markierung steht ganz rechts: Die Maschine stoppt nach ' + sim.n + ' Schritten.'
      : (sim.n ? 'Schritt ' + sim.n + ': ' + info : 'Anfang: Die Markierung steht zwischen ' + sim.a[0] + ' und ' + sim.a[1] + '.');
    btnStep.disabled = btnFive.disabled = btnEnd.disabled = done;
    btnBack.disabled = sim.n === 0;
  }
  function doSteps(k) {
    var info = '';
    for (var i = 0; i < k; i++) { var r = step(sim); if (r === null) break; info = r; }
    placeSim(info);
  }
  function renderTabs() {
    tabsEl.replaceChildren.apply(tabsEl, CONFIGS.map(function (c) {
      return h('button', {
        type: 'button', class: P + 'tab', 'aria-pressed': String(simId === c.id), 'aria-label': 'Startkonfiguration ' + c.id + ' ausprobieren',
        onclick: function () { simId = c.id; resetSim(); buildStones(); placeSim(''); renderTabs(); }
      }, c.id);
    }));
  }

  function optionCard(o) {
    var sel = picked === o.id;
    var cls = P + 'opt';
    var mark = '';
    if (mode) {
      if (mode === 'solution' ? o.id === RIGHT : sel) {
        var ok = o.id === RIGHT;
        cls += ok ? ' right' : ' wrong';
        mark = ok ? '✓' : '✗';
      }
    }
    var input = h('input', {
      type: 'radio', name: P + 'opt', value: o.id, checked: sel, disabled: locked,
      'aria-label': 'Antwort ' + o.id + ': Startkonfiguration mit den Steinen ' + orderText(o.order) + ', Markierung hinter dem ersten Stein'
    });
    input.checked = sel;
    return h('label', { class: cls },
      input,
      h('span', { class: P + 'card' },
        h('span', { class: P + 'opthead' }, o.id + ')', mark ? h('span', { class: P + 'mark', 'aria-hidden': 'true' }, mark) : null),
        h('span', { class: P + 'mini', 'aria-hidden': 'true' },
          o.order.map(function (v) { return stone(v, 'mini'); }),
          h('span', { class: P + 'minimark' }))));
  }
  function renderOptions() {
    optsEl.replaceChildren.apply(optsEl, CONFIGS.map(optionCard));
  }

  function onChange(e) {
    if (locked || !e.target.matches('input[type=radio]')) return;
    picked = e.target.value;
    renderOptions();
    var f = optsEl.querySelector('input:checked'); if (f) f.focus();
    api.changed('Antwort ' + picked + ' gewählt.');
  }

  Biber.register({
    id: 'bausteinmaschine224',
    story: '<p>Eine Maschine kann sechs unterschiedlich hohe Bausteine bewegen. Dabei benutzt sie eine Markierung (▲), die in der Regel zwischen zwei Steinen steht. ' +
      'Am Anfang stehen Steine und Markierung in einer Startkonfiguration, zum Beispiel so: 1 | 6 4 2 5 3, die Markierung steht also hinter dem ersten Stein.</p>' +
      '<p>Die Maschine arbeitet dann nach diesen Vorschriften:</p>' +
      '<ul><li>Wenn der Stein links von der Markierung <b>kleiner</b> ist als der Stein rechts davon, macht die Markierung einen Schritt nach rechts.</li>' +
      '<li>Wenn der Stein links von der Markierung <b>größer</b> ist als der Stein rechts davon, werden die Steine vertauscht. Danach macht die Markierung einen Schritt nach links – aber nur, wenn sie dann immer noch zwischen zwei Steinen steht.</li></ul>' +
      '<p>Die Maschine arbeitet so lange, bis die Markierung ganz rechts neben den Steinen steht. Dann stoppt sie. Je nach Startkonfiguration macht die Markierung unterschiedlich viele Schritte.</p>',
    question: 'Bei welcher dieser Startkonfigurationen macht die Markierung die wenigsten Schritte?',
    howto: 'Du kannst die Maschine oben mit jeder Startkonfiguration ausprobieren und die Schritte zählen. Wähle dann unten die Konfiguration mit den wenigsten Schritten.',
    explanation: function () {
      var t = {}; CONFIGS.forEach(function (c) { t[c.id] = total(c.order); });
      return '<p>Man kann für jede Konfiguration alle Schritte zählen. Schneller geht es mit einem Vergleich: B erreicht nach 2 Schritten die Konfiguration A, also braucht B mehr Schritte als A. ' +
        'A erreicht nach 3 Schritten eine Stellung, die D schon nach 1 Schritt erreicht, und C erreicht nach 4 Schritten die Konfiguration D. ' +
        'Also braucht D die wenigsten Schritte. Richtig ist Antwort D (zum Vergleich: A ' + t.A + ', B ' + t.B + ', C ' + t.C + ', D ' + t.D + ' Schritte).</p>' +
        '<p><b>Informatik:</b> Die Maschine sortiert die Steine nach dem Verfahren <i>Gnomesort</i>, einem Verwandten von Bubblesort. Es braucht wenig Speicherplatz („in-place“) und ist bei fast sortierten Daten sehr schnell. ' +
        'Bei stark durcheinander liegenden Daten (im Extremfall 6 5 4 3 2 1) braucht es dagegen besonders viele Schritte.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null; simId = 'A';
      resetSim();
      markerEl = h('span', { class: P + 'marker', 'aria-hidden': 'true' });
      stonesEl = h('div', { class: P + 'stones', 'aria-hidden': 'true' });
      boxEl = h('div', { class: P + 'box', role: 'img' }, stonesEl);
      capEl = h('p', { class: P + 'cap', 'aria-live': 'polite' });
      cntEl = h('p', { class: P + 'cnt' });
      tabsEl = h('div', { class: P + 'tabs', role: 'group', 'aria-label': 'Startkonfiguration zum Ausprobieren' });
      btnStep = h('button', { type: 'button', class: 'btn ghost', onclick: function () { doSteps(1); } }, 'Ein Schritt');
      btnFive = h('button', { type: 'button', class: 'btn ghost', onclick: function () { doSteps(5); } }, '5 Schritte');
      btnEnd = h('button', { type: 'button', class: 'btn ghost', onclick: function () { doSteps(1000); } }, 'Bis zum Stopp');
      btnBack = h('button', { type: 'button', class: 'btn ghost', onclick: function () { resetSim(); placeSim(''); } }, 'Auf Anfang');
      optsEl = h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Startkonfiguration mit den wenigsten Schritten' });
      el.replaceChildren(h('div', { class: P.slice(0, -1) },
        h('section', { 'aria-label': 'Maschine zum Ausprobieren' },
          h('h3', null, 'Maschine ausprobieren'),
          h('div', { class: P + 'pick' }, h('span', null, 'Start:'), tabsEl),
          boxEl, cntEl, capEl,
          h('div', { class: P + 'ctl' }, btnStep, btnFive, btnEnd, btnBack)),
        h('section', { 'aria-label': 'Antworten' }, h('h3', null, 'Startkonfigurationen'), optsEl)));
      optsEl.addEventListener('change', onChange);
      buildStones();
      placeSim('');
      renderTabs();
      renderOptions();
    },
    isComplete: function () { return !!picked; },
    evaluate: function () { return { correct: picked === RIGHT, answer: picked }; },
    setAnswer: function (ans) { picked = ans || null; mode = 'check'; renderOptions(); },
    lock: function (on) {
      locked = on;
      mode = on ? (mode || 'check') : null;
      renderOptions();
    },
    reset: function () { picked = null; mode = null; simId = 'A'; resetSim(); buildStones(); placeSim(''); renderTabs(); renderOptions(); },
    showSolution: function () { picked = RIGHT; mode = 'solution'; locked = true; renderOptions(); }
  });
})();
