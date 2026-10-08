/* Aufgabe Baustein-Maschine 1 (Heft 2024, Klasse 7-8, schwer): Gnomesort, Endstellung der Steine bestimmen */
(function () {
  'use strict';
  var h = Biber.h;

  var START = [1, 6, 4, 2, 5, 3];          /* Anfangsstellung laut Heft, S. 15 */
  var N = START.length;
  var OPTIONS = [                           /* Antwortmöglichkeiten A bis D laut Heft */
    { id: 'A', order: [1, 6, 4, 2, 5, 3] },
    { id: 'B', order: [3, 5, 2, 4, 6, 1] },
    { id: 'C', order: [1, 2, 3, 4, 5, 6] },
    { id: 'D', order: [6, 5, 4, 3, 2, 1] }
  ];
  var RIGHT = 'C';                          /* offizielle Lösung (Heft S. 16); per Simulation bestätigt */
  var COLOR = { 1: 'c1', 2: 'c4', 3: 'c2', 4: 'c5', 5: 'c6', 6: 'c3' };

  /* ein Schritt der Maschine; m = Markierung steht zwischen Stein m-1 und m (m = N: ganz rechts) */
  function step(st) {
    if (st.m >= N) return null;
    var l = st.a[st.m - 1], r = st.a[st.m];
    var info;
    if (l < r) {
      st.m++;
      info = l + ' ist kleiner als ' + r + ': Die Markierung geht nach rechts.';
    } else {
      st.a[st.m - 1] = r; st.a[st.m] = l;
      if (st.m > 1) {
        st.m--;
        info = l + ' ist größer als ' + r + ': Die Steine werden getauscht, die Markierung geht nach links.';
      } else {
        info = l + ' ist größer als ' + r + ': Die Steine werden getauscht. Die Markierung bleibt stehen, weil links von ihr sonst kein Stein mehr stünde.';
      }
    }
    st.n++;
    return info;
  }
  var el, api, locked, picked, mode;
  var sim, stoneEls, markerEl, boxEl, capEl, btnStep, btnFive, btnBack;

  function stone(v, cls) {
    return h('span', { class: 't-gnomesort24-stone ' + (cls || ''), 'data-v': v, style: '--h:' + v + ';--col:var(--' + COLOR[v] + ')' }, h('span', { class: 't-gnomesort24-num' }, v));
  }
  function orderText(a) { return a.join(', '); }

  function resetSim() { sim = { a: START.slice(), m: 1, n: 0 }; }

  function placeSim(info) {
    sim.a.forEach(function (v, i) { stoneEls[v].style.setProperty('--i', i); });
    markerEl.style.setProperty('--m', sim.m);
    var done = sim.m >= N;
    boxEl.setAttribute('aria-label', 'Maschine: Steine von links nach rechts ' + orderText(sim.a) + '. Die Markierung steht ' +
      (sim.m >= N ? 'ganz rechts neben den Steinen' : 'zwischen ' + sim.a[sim.m - 1] + ' und ' + sim.a[sim.m]) + '.');
    capEl.textContent = done
      ? 'Die Markierung steht ganz rechts: Die Maschine stoppt (nach ' + sim.n + ' Schritten).'
      : (sim.n ? 'Schritt ' + sim.n + ': ' + info : 'Anfang: Die Markierung steht zwischen ' + sim.a[0] + ' und ' + sim.a[1] + '.');
    btnStep.disabled = btnFive.disabled = done;
    btnBack.disabled = sim.n === 0;
  }
  function doSteps(k) {
    var info = '';
    for (var i = 0; i < k; i++) { var r = step(sim); if (r === null) break; info = r; }
    placeSim(info);
  }

  function optionCard(o) {
    var sel = picked === o.id;
    var cls = 't-gnomesort24-opt';
    var mark = '';
    if (mode) {
      if (mode === 'solution' ? o.id === RIGHT : sel) {
        var ok = o.id === RIGHT;
        cls += ok ? ' right' : ' wrong';
        mark = ok ? '✓' : '✗';
      }
    }
    var input = h('input', {
      type: 'radio', name: 't-gnomesort24-opt', value: o.id, checked: sel, disabled: locked,
      'aria-label': 'Antwort ' + o.id + ': ' + orderText(o.order) + ', Markierung ganz rechts'
    });
    input.checked = sel;
    return h('label', { class: cls },
      input,
      h('span', { class: 't-gnomesort24-card' },
        h('span', { class: 't-gnomesort24-opthead' }, o.id + ')', mark ? h('span', { class: 't-gnomesort24-mark', 'aria-hidden': 'true' }, mark) : null),
        h('span', { class: 't-gnomesort24-mini', 'aria-hidden': 'true' },
          o.order.map(function (v) { return stone(v, 'mini'); }),
          h('span', { class: 't-gnomesort24-minimark' }))));
  }
  function renderOptions() {
    optsEl.replaceChildren.apply(optsEl, OPTIONS.map(optionCard));
  }
  var optsEl;

  function onChange(e) {
    if (locked || !e.target.matches('input[type=radio]')) return;
    picked = e.target.value;
    renderOptions();
    var f = optsEl.querySelector('input:checked'); if (f) f.focus();
    api.changed('Antwort ' + picked + ' gewählt.');
  }

  Biber.register({
    id: 'gnomesort24',
    story: '<p>Eine Maschine kann sechs unterschiedlich hohe Bausteine bewegen. Dabei benutzt sie eine Markierung (▲), die in der Regel zwischen zwei Steinen steht. ' +
      'Am Anfang stehen Steine und Markierung so, wie unten gezeigt.</p>' +
      '<p>Die Maschine arbeitet nach diesen Vorschriften:</p>' +
      '<ul><li>Wenn der Stein links von der Markierung <b>kleiner</b> ist als der Stein rechts davon, geht die Markierung nach rechts.</li>' +
      '<li>Wenn der Stein links von der Markierung <b>größer</b> ist als der Stein rechts davon, werden die Steine vertauscht. Danach geht die Markierung nach links – aber nur, wenn sie dann immer noch zwischen zwei Steinen steht.</li></ul>' +
      '<p>Die Maschine arbeitet so lange, bis die Markierung ganz rechts neben den Steinen steht. Dann stoppt sie.</p>',
    question: 'Wie stehen die Steine, nachdem die Maschine stoppt?',
    howto: 'Du kannst die Maschine oben Schritt für Schritt laufen lassen. Wähle dann unten die richtige Endstellung.',
    explanation: function () {
      return '<p>Die Maschine sortiert die Bausteine der Größe nach. Am Anfang steht links von der Markierung nur ein Stein, und der ist trivialerweise sortiert. ' +
        'Jeder Schritt erhält diese Eigenschaft: Geht die Markierung nach rechts, kommt ein größerer Stein zu den sortierten dazu. Wird getauscht, wandert der kleinere Stein so lange nach links, bis er seinen Platz gefunden hat. ' +
        'Wenn die Markierung ganz rechts steht, sind alle Steine links von ihr sortiert. Richtig ist also Antwort C: 1, 2, 3, 4, 5, 6.</p>' +
        '<p><b>Informatik:</b> Dieses Sortierverfahren heißt <i>Gnomesort</i> und ähnelt dem Bubblesort. Es ist einfach zu verstehen und zu programmieren, aber bei stark durcheinander liegenden Daten nicht besonders schnell. ' +
        'Ist alles schon fast sortiert, geht es dagegen sehr schnell.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null;
      resetSim();
      stoneEls = {};
      var stones = START.map(function (v) { var s = stone(v, 'big'); stoneEls[v] = s; return s; });
      markerEl = h('span', { class: 't-gnomesort24-marker', 'aria-hidden': 'true' });
      boxEl = h('div', { class: 't-gnomesort24-box', role: 'img' }, h('div', { class: 't-gnomesort24-stones', 'aria-hidden': 'true' }, stones, h('span', { class: 't-gnomesort24-base' }), markerEl));
      capEl = h('p', { class: 't-gnomesort24-cap', 'aria-live': 'polite' });
      btnStep = h('button', { type: 'button', class: 'btn ghost', onclick: function () { doSteps(1); } }, 'Ein Schritt');
      btnFive = h('button', { type: 'button', class: 'btn ghost', onclick: function () { doSteps(5); } }, '5 Schritte');
      btnBack = h('button', { type: 'button', class: 'btn ghost', onclick: function () { resetSim(); placeSim(''); } }, 'Maschine auf Anfang');
      optsEl = h('div', { class: 't-gnomesort24-opts', role: 'radiogroup', 'aria-label': 'Endstellung der Steine' });
      el.replaceChildren(h('div', { class: 't-gnomesort24' },
        h('section', { 'aria-label': 'Maschine zum Ausprobieren' },
          h('h3', null, 'Maschine ausprobieren'), boxEl, capEl,
          h('div', { class: 't-gnomesort24-ctl' }, btnStep, btnFive, btnBack)),
        h('section', { 'aria-label': 'Antworten' }, h('h3', null, 'Endstellung'), optsEl)));
      optsEl.addEventListener('change', onChange);
      placeSim('');
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
    reset: function () { picked = null; mode = null; resetSim(); placeSim(''); renderOptions(); },
    showSolution: function () { picked = RIGHT; mode = 'solution'; locked = true; renderOptions(); }
  });
})();
