/* Aufgabe Edelsteine (Heft 2022, Klasse 9-10 schwer, 11-13 mittel): Algorithmen, Analyse, Verallgemeinerung */
(function () {
  'use strict';
  var h = Biber.h, S = Biber.svg;

  var OPTIONS = [8, 10, 11, 12];
  var LETTERS = ['A', 'B', 'C', 'D'];
  var ANSWER = 10;
  var ROUNDS = 3, PICK = 4;

  /* Selbsttest: Mit n Steinen und 3 Fragen zu je 4 Steinen lässt sich der wertvollste sicher finden?
     Zustand: c = Steine, die noch nicht verloren haben (Kandidaten). Der Gegner lässt einen gewählten Kandidaten gewinnen;
     das ist für Sarah immer mindestens so schlecht wie jede andere Antwort. */
  function can(n, c, k) {
    if (c === 1) return true;
    if (k === 0) return false;
    for (var a = 1; a <= Math.min(PICK, c); a++) {
      if (PICK - a > n - c) continue;
      if (can(n, c - (a - 1), k - 1)) return true;
    }
    return false;
  }
  var MAXN = 0;
  for (var n0 = 4; n0 <= 20; n0++) if (can(n0, n0, ROUNDS)) MAXN = n0;
  if (MAXN !== ANSWER) throw new Error('edelsteine22: Lösung stimmt nicht');

  /* ---------- Zustand ---------- */
  var el, api, locked, picked, mode, choiceBox;
  var ex;      /* Experiment: { n, sel:[], cand:{}, log:[], done } */

  function exNew(n) {
    var cand = {};
    for (var i = 1; i <= n; i++) cand[i] = true;
    return { n: n, sel: [], cand: cand, log: [] };
  }
  function candList() { return Object.keys(ex.cand).filter(function (k) { return ex.cand[k]; }).map(Number); }

  function ask() {
    if (ex.sel.length !== PICK || ex.log.length >= ROUNDS) return;
    var chosen = ex.sel.slice().sort(function (a, b) { return a - b; });
    var inC = chosen.filter(function (i) { return ex.cand[i]; });
    var win;
    if (inC.length) win = inC[0];
    else win = chosen[0];
    chosen.forEach(function (i) { if (i !== win) ex.cand[i] = false; });
    ex.log.push({ set: chosen, win: win });
    ex.sel = [];
    renderEx();
  }
  function toggleGem(i) {
    if (ex.log.length >= ROUNDS) return;
    var k = ex.sel.indexOf(i);
    if (k >= 0) ex.sel.splice(k, 1);
    else if (ex.sel.length < PICK) ex.sel.push(i);
    renderEx();
  }

  function gem(i, cls) {
    var col = 'var(--c' + ((i - 1) % 6 + 1) + ')';
    return S('svg', { class: 't-edelsteine22-gem ' + (cls || ''), viewBox: '0 0 40 40', 'aria-hidden': 'true', focusable: 'false', style: '--gc:' + col },
      S('polygon', { class: 'g-body', points: '20,3 35,14 20,37 5,14' }),
      S('polygon', { class: 'g-facet', points: '20,3 28,14 20,37 12,14' }),
      S('text', { x: 20, y: 17, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, String(i)));
  }
  function gemInline(i) { return h('span', { class: 't-edelsteine22-chip' }, '◆' + i); }

  var exBox, gemsEl, logEl, infoEl, askBtn, nSel;

  function renderEx() {
    var done = ex.log.length >= ROUNDS;
    gemsEl.replaceChildren.apply(gemsEl, [].concat(
      Array.apply(null, Array(ex.n)).map(function (_, k) {
        var i = k + 1, lost = !ex.cand[i], on = ex.sel.indexOf(i) >= 0;
        return h('button', { type: 'button', class: 't-edelsteine22-g' + (on ? ' on' : '') + (lost ? ' lost' : ''), 'data-g': i, 'aria-pressed': String(on), disabled: done,
          'aria-label': 'Stein ' + i + (lost ? ', kann nicht der wertvollste sein' : '') + (on ? ', ausgewählt' : '') }, gem(i));
      })));
    logEl.replaceChildren.apply(logEl, ex.log.map(function (q, k) {
      return h('li', null, 'Frage ' + (k + 1) + ': ', q.set.map(function (i) { return [gemInline(i), ' ']; }), '→ am wertvollsten: ', h('b', null, gemInline(q.win)));
    }));
    askBtn.disabled = done || ex.sel.length !== PICK;
    askBtn.textContent = done ? 'Alle 3 Fragen gestellt' : 'Peter fragen (' + ex.sel.length + ' von ' + PICK + ' Steinen gewählt)';
    var c = candList();
    if (done) {
      infoEl.textContent = c.length === 1 ? 'Sarah weiß jetzt, welcher Stein der wertvollste ist: Stein ' + c[0] + '.'
        : 'Nach drei Fragen kommen noch ' + c.length + ' Steine in Frage (' + c.join(', ') + '). Sarah weiß es nicht.';
      infoEl.className = 't-edelsteine22-info ' + (c.length === 1 ? 'good' : 'bad');
    } else {
      infoEl.textContent = 'Noch ' + (ROUNDS - ex.log.length) + ' Frage' + (ROUNDS - ex.log.length === 1 ? '' : 'n') + '. Blasse Steine haben schon verloren und können nicht der wertvollste sein.';
      infoEl.className = 't-edelsteine22-info';
    }
  }

  function renderChoices() {
    choiceBox.replaceChildren.apply(choiceBox, OPTIONS.map(function (v, i) {
      var cls = 't-edelsteine22-opt' + (picked === v ? ' on' : '');
      if (mode === 'check' && picked === v) cls += v === ANSWER ? ' right' : ' wrong';
      if (mode === 'solution' && v === ANSWER) cls += ' right on';
      return h('button', { type: 'button', class: cls, role: 'radio', 'aria-checked': String(picked === v), 'data-v': v, disabled: locked },
        h('span', { class: 't-edelsteine22-l' }, LETTERS[i]), h('span', null, String(v)));
    }));
  }

  Biber.register({
    id: 'edelsteine22',
    story: '<p>Peter hat einige Edelsteine. Sie sind alle unterschiedlich wertvoll. Sarah kennt Peters Edelsteine, aber nicht deren Wert. Sie will wissen, welcher Stein der wertvollste ist. Dazu macht sie Folgendes dreimal:</p>' +
      '<ul><li>Sie wählt vier von Peters Steinen aus und fragt ihn, welcher davon der wertvollste Stein ist.</li></ul>' +
      '<p>Jedes Mal wählt sie die vier Steine beliebig neu aus, und Peter gibt ihr jedes Mal eine ehrliche Antwort. Danach weiß Sarah, welcher Stein der wertvollste ist.</p>',
    question: 'Wie viele Edelsteine kann Peter höchstens haben?',
    howto: 'Wähle eine Antwort. Unter „Ausprobieren“ kannst du selbst Sarahs Fragen stellen; Peter antwortet dort so, dass es Sarah möglichst schwer hat.',
    explanation: function () {
      return '<p>Richtig ist <b>B: 10 Steine</b>.</p>' +
        '<p><b>Mit 10 Steinen geht es:</b> Sarah wählt bei den ersten beiden Fragen acht verschiedene Steine. Die beiden Gewinner können noch der Gesamtsieger sein, die anderen sechs Steine scheiden aus. Bei der dritten Frage nimmt sie die beiden Gewinner und die zwei Steine, die sie noch nie gewählt hat. Der Gewinner dieser Frage ist der wertvollste Stein.</p>' +
        '<p><b>Mit 11 Steinen geht es nicht:</b> Fragt sie zweimal nach acht verschiedenen Steinen, bleiben die beiden Gewinner und drei ungewählte Steine übrig, also fünf Kandidaten, aber die dritte Frage verträgt nur vier. Vergleicht sie den ersten Gewinner stattdessen mit drei neuen Steinen, kennt sie nach zwei Fragen den besten von sieben Steinen, braucht ihn aber gegen vier weitere, und das ist wieder ein Stein zu viel. Mit weniger verschiedenen Steinen oder mit mehr als 11 Steinen wird es erst recht nicht besser.</p>' +
        '<p><b>Informatik:</b> Sarahs Vorgehen ist noch kein vollständiger Algorithmus, denn es fehlt die Vorschrift, welche vier Steine sie auswählt. Trotzdem lässt sich zeigen, dass jede Auswahlregel höchstens bei 10 Steinen funktioniert. ' +
        'Eine ganze Familie von Algorithmen auf einmal zu analysieren ist besonders wertvoll, denn man will nicht nur wissen, ob ein Algorithmus funktioniert, sondern auch, wie gut.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null;
      choiceBox = h('div', { class: 't-edelsteine22-opts', role: 'radiogroup', 'aria-label': 'Antwort' });
      ex = exNew(10);
      gemsEl = h('div', { class: 't-edelsteine22-gems', role: 'group', 'aria-label': 'Steine' });
      logEl = h('ol', { class: 't-edelsteine22-log' });
      infoEl = h('p', { class: 't-edelsteine22-info', role: 'status', 'aria-live': 'polite' });
      askBtn = h('button', { type: 'button', class: 't-edelsteine22-ask' }, '');
      nSel = h('select', { class: 't-edelsteine22-n', 'aria-label': 'Anzahl der Steine' },
        [6, 7, 8, 9, 10, 11, 12, 13].map(function (v) { return h('option', { value: v, selected: v === 10 }, String(v)); }));
      exBox = h('details', { class: 't-edelsteine22-ex' },
        h('summary', null, 'Ausprobieren: Sarah fragt Peter'),
        h('div', { class: 't-edelsteine22-exin' },
          h('p', { class: 't-edelsteine22-exp' }, 'Spiele Sarah: Wähle vier Steine und frage Peter, welcher am wertvollsten ist. Du hast drei Fragen. Peter hat hier so viele Steine, wie du einstellst.'),
          h('label', { class: 't-edelsteine22-nl' }, 'Anzahl der Steine: ', nSel),
          gemsEl, askBtn, logEl, infoEl,
          h('button', { type: 'button', class: 't-edelsteine22-again' }, 'Neu beginnen')));
      el.replaceChildren(h('div', { class: 't-edelsteine22-root' }, choiceBox, exBox));
      choiceBox.addEventListener('click', function (e) {
        var b = e.target.closest('[data-v]');
        if (!b || locked) return;
        picked = +b.getAttribute('data-v');
        renderChoices();
        api.changed('Antwort ' + LETTERS[OPTIONS.indexOf(picked)] + ' gewählt.');
        var again = choiceBox.querySelector('[data-v="' + picked + '"]'); if (again) again.focus();
      });
      choiceBox.addEventListener('keydown', function (e) {
        if (locked) return;
        var d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (!d) return;
        e.preventDefault();
        var i = OPTIONS.indexOf(picked);
        i = i < 0 ? 0 : (i + d + OPTIONS.length) % OPTIONS.length;
        picked = OPTIONS[i];
        renderChoices();
        api.changed('Antwort ' + LETTERS[i] + ' gewählt.');
        choiceBox.querySelector('[data-v="' + picked + '"]').focus();
      });
      gemsEl.addEventListener('click', function (e) {
        var g = e.target.closest('[data-g]');
        if (g) { toggleGem(+g.getAttribute('data-g')); var f = gemsEl.querySelector('[data-g="' + g.getAttribute('data-g') + '"]'); if (f && !f.disabled) f.focus(); }
      });
      askBtn.addEventListener('click', ask);
      nSel.addEventListener('change', function () { ex = exNew(+nSel.value); renderEx(); });
      exBox.querySelector('.t-edelsteine22-again').addEventListener('click', function () { ex = exNew(+nSel.value); renderEx(); });
      renderChoices();
      renderEx();
    },
    isComplete: function () { return picked !== null; },
    evaluate: function () { return { correct: picked === ANSWER, answer: picked }; },
    setAnswer: function (ans) { picked = OPTIONS.indexOf(ans) >= 0 ? ans : null; mode = 'check'; renderChoices(); },
    lock: function (on) { locked = on; mode = on ? (mode === 'solution' ? 'solution' : 'check') : null; renderChoices(); },
    reset: function () { picked = null; mode = null; renderChoices(); },
    showSolution: function () { picked = ANSWER; locked = true; mode = 'solution'; renderChoices(); }
  });
})();
