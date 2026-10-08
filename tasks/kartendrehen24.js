/* Aufgabe Karten drehen (Klasse 11-13, schwer): binäres Hochzählen mit Karten */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-kartendrehen24';
  var N = 16, MOVES = 16, RIGHT = 1;

  /* ---------- Spiellogik (ein Spielzug, von rechts nach links) ---------- */
  function step(cards) {
    var changed = [];
    for (var i = cards.length - 1; i >= 0; i--) {
      changed.push(i);
      if (!cards[i]) { cards[i] = true; break; }
      cards[i] = false;
    }
    return changed;
  }
  function play(n, moves) {
    var c = [];
    for (var i = 0; i < n; i++) c.push(false);
    for (var m = 0; m < moves; m++) step(c);
    return c;
  }
  function countUp(c) { return c.filter(Boolean).length; }

  /* ---------- Karten als SVG ---------- */
  function cardSvg(up, label, extra) {
    var s;
    if (up) {
      s = '<rect x="1.5" y="1.5" width="37" height="53" rx="5" fill="#fdf9f1" stroke="#30638e" stroke-width="2"/>' +
        '<path d="M9 36c-2-9 2-17 11-18 8 0 12 6 11 15-1 7-6 12-11 12S10 41 9 36z" fill="#9a6a3a"/>' +
        '<path d="M11 17c-1-5 2-8 6-8 3 0 6 2 7 6z" fill="#5c3a17"/>' +
        '<circle cx="17" cy="27" r="2.3" fill="#fff"/><circle cx="25" cy="27" r="2.3" fill="#fff"/>' +
        '<circle cx="17.4" cy="27.2" r="1.1" fill="#222"/><circle cx="24.6" cy="27.2" r="1.1" fill="#222"/>' +
        '<ellipse cx="21" cy="33" rx="3.2" ry="2.2" fill="#3a2410"/>' +
        '<rect x="19.3" y="35" width="3.4" height="5" rx="1" fill="#fff" stroke="#3a2410" stroke-width="0.8"/>';
    } else {
      s = '<rect x="1.5" y="1.5" width="37" height="53" rx="5" fill="#6a93c4" stroke="#30638e" stroke-width="2"/>' +
        '<path d="M26 17a9 9 0 1 0-9 11l3 9" fill="none" stroke="#c9d6e6" stroke-width="3.6" stroke-linecap="round" opacity="0.85"/>' +
        '<circle cx="24.5" cy="19" r="2.2" fill="#c9d6e6" opacity="0.85"/>';
    }
    return '<svg class="' + P + '-svg' + (extra ? ' ' + extra : '') + '" viewBox="0 0 40 56" role="img" aria-label="' + label + '" focusable="false">' + s + '</svg>';
  }
  function miniRow(cards, lead) {
    return '<span class="' + P + '-mini">' + (lead ? '<span class="' + P + '-dots" aria-hidden="true">…</span>' : '') +
      cards.map(function (c) { return cardSvg(c, c ? 'aufgedeckt' : 'verdeckt'); }).join('') + '</span>';
  }

  /* ---------- Zustand ---------- */
  var el, api, locked;
  var cards, moves, lastChanged, input, btnStep, btnAll, btnBack, live, rowEl, countEl;

  function resetSim() { cards = play(N, 0); moves = 0; lastChanged = []; }

  function renderSim() {
    rowEl.replaceChildren.apply(rowEl, cards.map(function (c, i) {
      var chg = lastChanged.indexOf(i) >= 0;
      var d = h('div', { class: P + '-card' + (chg ? ' chg' : '') });
      d.innerHTML = cardSvg(c, 'Karte ' + (i + 1) + ' von links: ' + (c ? 'aufgedeckt' : 'verdeckt'));
      return d;
    }));
    countEl.textContent = 'Spielzug ' + moves + ' von ' + MOVES;
    btnStep.disabled = moves >= MOVES;
    btnAll.disabled = moves >= MOVES;
    btnBack.disabled = moves === 0;
    if (moves === 0) live.textContent = 'Alle 16 Karten sind verdeckt.';
  }
  function doStep() {
    if (moves >= MOVES) return;
    lastChanged = step(cards);
    moves++;
    renderSim();
    var turned = lastChanged.length - 1;
    live.textContent = 'Spielzug ' + moves + ': ' + (turned === 0 ? 'keine Karte wurde umgedreht, ' : turned + (turned === 1 ? ' aufgedeckte Karte wurde verdeckt, ' : ' aufgedeckte Karten wurden verdeckt, ')) +
      '1 verdeckte Karte wurde aufgedeckt. Jetzt sind ' + countUp(cards) + ' Karten aufgedeckt.';
  }
  function doAll() { while (moves < MOVES) { lastChanged = step(cards); moves++; } renderSim(); live.textContent = 'Nach 16 Spielzügen: ' + countUp(cards) + ' Karten aufgedeckt.'; }
  function doBack() { resetSim(); renderSim(); }

  function parsed() {
    var v = input.value.trim();
    return /^\d{1,3}$/.test(v) ? +v : null;
  }

  function mark(state) {
    el.classList.remove(P + '-right', P + '-wrong');
    var m = el.querySelector('.' + P + '-mark');
    if (m) m.remove();
    if (!state) return;
    var ok = state === 'right';
    el.classList.add(P + (ok ? '-right' : '-wrong'));
    input.parentNode.appendChild(h('span', { class: P + '-mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
  }

  Biber.register({
    id: 'kartendrehen24',
    story:
      '<p>Jemand schenkt dir einen Satz gleicher Karten. Die Karten sehen so aus:</p>' +
      '<p class="' + P + '-legend"><span>Aufgedeckt: ' + cardSvg(true, 'aufgedeckte Karte mit Biber') + '</span><span>Verdeckt: ' + cardSvg(false, 'verdeckte Karte') + '</span></p>' +
      '<p>Mit diesen Karten kannst du „Drehen“ spielen. Eine Reihe von Karten liegt vor dir. In einem Spielzug gehst du diese Karten <b>von rechts nach links</b> so durch:</p>' +
      '<ul><li>Ist die aktuelle Karte verdeckt, decke sie auf. Damit ist der Spielzug beendet, die übrigen Karten bleiben unverändert.</li>' +
      '<li>Ist die aktuelle Karte aufgedeckt, drehe sie um.</li></ul>' +
      '<p>Das Beispiel zeigt, wie sich die Karten in einem Spielzug verändern können:</p>' +
      '<div class="' + P + '-example">' +
      '<div><span class="' + P + '-lab">Vorher:</span>' + miniRow([false, true, false, true, true], true) + '</div>' +
      '<div><span class="' + P + '-lab">Nachher:</span>' + miniRow([false, true, true, false, false], true) + '</div></div>' +
      '<ul><li>Die beiden rechten Karten sind aufgedeckt und werden umgedreht.</li>' +
      '<li>Die dritte Karte von rechts ist verdeckt und wird aufgedeckt.</li></ul>' +
      '<p>Damit ist der Spielzug beendet, die übrigen Karten bleiben unverändert.</p>' +
      '<p>Diesmal beginnt das Spiel mit 16 verdeckten Karten.</p>',
    question: 'Wie viele Karten sind nach 16 Spielzügen aufgedeckt?',
    howto: 'Du kannst die Spielzüge unten Schritt für Schritt ausprobieren. Trage dann die Anzahl der aufgedeckten Karten ein.',
    explanation: function () {
      var rows = '';
      [1, 2, 3, 4, 5, 16].forEach(function (m) {
        var c = play(N, m).slice(N - 6);
        rows += '<tr><th scope="row">Spielzug ' + m + '</th><td>' + miniRow(c, true) + '</td></tr>';
      });
      return '<p>Die Karten stellen eine <strong>Binärzahl</strong> dar: verdeckt ist die Ziffer 0, aufgedeckt die Ziffer 1. ' +
        'Ein Spielzug zählt diese Zahl genau um 1 hoch. Ist die Ziffer ganz rechts eine 0, wird sie zur 1. Ist sie eine 1, wird sie zur 0 und der Übertrag wandert eine Stelle nach links. ' +
        'Am Anfang steht die Zahl 0 (alle Karten verdeckt).</p>' +
        '<table class="' + P + '-tab"><tbody>' + rows + '</tbody></table>' +
        '<p>Nach 16 Spielzügen steht dort die Zahl 16 = 2<sup>4</sup>, also 0…010000 mit genau einer 1. ' +
        'Es ist daher <strong>genau 1 Karte</strong> aufgedeckt. Allgemein ist bei jeder Zweierpotenz nur eine Karte aufgedeckt.</p>' +
        '<p>Computer speichern alle Daten als Binärzahlen. Das Hochzählen um 1 mit Übertrag ist eine der einfachsten Rechenoperationen darauf.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false;
      resetSim();
      rowEl = h('div', { class: P + '-row', role: 'group', 'aria-label': 'Kartenreihe mit 16 Karten, am Anfang alle verdeckt' });
      countEl = h('span', { class: P + '-count num' });
      live = h('p', { class: P + '-live', 'aria-live': 'polite' });
      btnStep = h('button', { type: 'button', class: 'btn', onclick: doStep }, 'Spielzug machen');
      btnAll = h('button', { type: 'button', class: 'btn ghost', onclick: doAll }, 'Alle 16 Spielzüge');
      btnBack = h('button', { type: 'button', class: 'btn ghost', onclick: doBack }, 'Von vorn');
      input = h('input', {
        type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: '3', class: P + '-input', id: P + '-in',
        'aria-label': 'Anzahl der aufgedeckten Karten nach 16 Spielzügen',
        oninput: function () { input.value = input.value.replace(/[^0-9]/g, ''); mark(null); api.changed(); }
      });
      el.replaceChildren(h('div', { class: P + '-board' },
        h('div', { class: P + '-sim' },
          h('div', { class: P + '-head' }, h('b', null, 'Zum Ausprobieren'), countEl),
          rowEl,
          h('p', { class: P + '-dir', 'aria-hidden': 'true' }, '← Die Karten werden von rechts nach links durchgegangen'),
          h('div', { class: P + '-btns' }, btnStep, btnAll, btnBack),
          live),
        h('div', { class: P + '-answer' },
          h('label', { for: P + '-in' }, 'Nach 16 Spielzügen sind '),
          h('span', { class: P + '-inwrap' }, input),
          h('span', null, ' Karten aufgedeckt.'))));
      renderSim();
    },
    isComplete: function () { return parsed() !== null; },
    evaluate: function () { var v = parsed(); return { correct: v === RIGHT, answer: { value: v } }; },
    setAnswer: function (ans) {
      input.value = ans && ans.value != null ? String(ans.value) : '';
      doAll();
      mark(parsed() === RIGHT ? 'right' : 'wrong');
    },
    lock: function (on) {
      locked = on;
      input.disabled = on;
      if (on) mark(parsed() === RIGHT ? 'right' : 'wrong'); else mark(null);
    },
    reset: function () { input.value = ''; mark(null); resetSim(); renderSim(); },
    showSolution: function () {
      doAll();
      input.value = String(RIGHT);
      input.disabled = true;
      mark('right');
    }
  });
})();
