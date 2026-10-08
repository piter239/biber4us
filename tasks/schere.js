/* Aufgabe Schere, Stein, Papier (Klasse 11-13, schwer): Invariante beim Tauschen von Karten */
(function () {
  'use strict';
  var h = Biber.h;

  var PLAYERS = ['Anna', 'Ben', 'Conni'];
  var CARD = {
    stein: { name: 'Stein', cls: 'sp-stein' },
    schere: { name: 'Schere', cls: 'sp-schere' },
    papier: { name: 'Papier', cls: 'sp-papier' }
  };
  var START = ['stein', 'schere', 'papier'];            /* Anna, Ben, Conni */
  var BEATS = { stein: 'schere', schere: 'papier', papier: 'stein' };   /* Schlüssel schlägt Wert */

  var OPTIONS = [
    { key: 'A', text: 'Ben und Conni tauschen ihre Karten eine ungerade Anzahl Male.' },
    { key: 'B', text: 'Beliebig oft tauschen zwei Spieler ihre Karten, aber nie Ben mit Conni.' },
    { key: 'C', text: 'Beliebig oft tauschen zwei Spieler ihre Karten, darunter Ben mindestens einmal mit Conni.' },
    { key: 'D', text: 'Eine gerade Anzahl Male tauschen zwei Spieler ihre Karten.' }
  ];
  var RIGHT = 3;   /* D, per Brute Force über alle Tauschfolgen bestätigt */

  /* ---------- Kartensymbole (SVG, viewBox 48 x 48) ---------- */
  var ICON = {
    stein: '<path class="sp-ic-fill sp-rock" d="M7 33 L10 20 L18 12 L31 11 L40 19 L42 31 L34 38 L15 38 Z"/>' +
      '<path class="sp-ic-line" d="M18 12 L21 22 L33 24 L40 19 M21 22 L15 38 M33 24 L34 38"/>',
    schere: '<path class="sp-ic-line sp-blade" d="M11 38 L33 9 M37 38 L15 9"/>' +
      '<circle class="sp-ic-fill sp-ring" cx="11" cy="38" r="5"/><circle class="sp-ic-fill sp-ring" cx="37" cy="38" r="5"/>' +
      '<circle class="sp-pin" cx="24" cy="24" r="2"/>',
    papier: '<path class="sp-ic-fill sp-sheet" d="M12 6 H30 L38 14 V42 H12 Z"/><path class="sp-ic-line" d="M30 6 V14 H38"/>'
  };
  function icon(kind) {
    return '<svg class="sp-icon" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' + ICON[kind] + '</svg>';
  }
  function chip(kind) {
    return '<span class="sp-chip ' + CARD[kind].cls + '" role="img" aria-label="' + CARD[kind].name + '">' + icon(kind) + '</span>';
  }

  /* ---------- Spiellogik ---------- */
  function duel(a, b) {          /* Karten a, b -> 1: a gewinnt, -1: b gewinnt */
    return BEATS[a] === b ? 1 : -1;
  }
  function benWins(cards) { return duel(cards[1], cards[2]) === 1; }
  function result(cards, i, j) {
    return duel(cards[i], cards[j]) === 1 ? PLAYERS[i] + ' gewinnt gegen ' + PLAYERS[j] : PLAYERS[j] + ' gewinnt gegen ' + PLAYERS[i];
  }

  var el, api, radios, selected, locked, mark;
  var cards, swaps, pick, seats, tableEl, resEl, countEl, hintEl;

  function reset() { selected = null; mark = null; }
  function resetTable() { cards = START.slice(); swaps = 0; pick = null; }

  /* ---------- Ausprobier-Tisch ---------- */
  function drawTable() {
    seats.forEach(function (btn, i) {
      var k = cards[i];
      btn.innerHTML = '<span class="sp-name">' + PLAYERS[i] + '</span>' + chip(k) + '<span class="sp-cname">' + CARD[k].name + '</span>';
      btn.classList.toggle('pick', pick === i);
      btn.setAttribute('aria-pressed', String(pick === i));
      btn.setAttribute('aria-label', PLAYERS[i] + ' hat ' + CARD[k].name + (pick === i ? ', ausgewählt zum Tauschen' : ''));
    });
    var pairs = [[0, 1], [0, 2], [1, 2]];
    resEl.replaceChildren.apply(resEl, pairs.map(function (p) {
      var bc = p[0] === 1 && p[1] === 2;
      return h('li', { class: bc ? 'sp-bc ' + (benWins(cards) ? 'good' : 'bad') : '' },
        h('span', null, PLAYERS[p[0]] + ' – ' + PLAYERS[p[1]] + ':'), ' ', h('strong', null, result(cards, p[0], p[1])));
    }));
    countEl.textContent = swaps === 0 ? 'Noch kein Tausch gemacht.' : 'Bisher ' + swaps + (swaps === 1 ? ' Tausch.' : ' Tausche.');
    hintEl.textContent = pick === null ? 'Tippe zwei Spieler nacheinander an, um ihre Karten zu tauschen.' : PLAYERS[pick] + ' ist gewählt. Tippe nun den Spieler an, mit dem getauscht werden soll.';
  }
  function onSeat(i) {
    if (pick === null) pick = i;
    else if (pick === i) pick = null;
    else {
      var t = cards[pick]; cards[pick] = cards[i]; cards[i] = t;
      swaps++; pick = null;
    }
    drawTable();
  }

  /* ---------- Antwortkarten ---------- */
  function choose(i, focus) {
    if (locked) return;
    selected = i;
    refresh();
    if (focus) radios[i].focus();
    api.changed();
  }
  function refresh() {
    radios.forEach(function (btn, i) {
      var on = selected === i;
      btn.setAttribute('aria-checked', String(on));
      btn.tabIndex = (selected === null ? i === 0 : on) ? 0 : -1;
      btn.setAttribute('aria-disabled', locked ? 'true' : 'false');
      btn.classList.toggle('selected', on);
      var ok = i === RIGHT;
      btn.classList.toggle('right', on && mark !== null && ok);
      btn.classList.toggle('wrong', on && mark === 'check' && !ok);
      var m = btn.querySelector('.sp-mark');
      if (m) m.remove();
      if (on && mark !== null) btn.appendChild(h('span', { class: 'sp-mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
    });
  }
  function onKey(e) {
    var k = e.key, i = radios.indexOf(e.currentTarget), to = null;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % radios.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + radios.length - 1) % radios.length;
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }

  Biber.register({
    id: 'schere',
    story:
      '<p>Anna, Ben und Conni spielen gemeinsam eine Runde Schere-Stein-Papier. Sie spielen gleichzeitig paarweise gegeneinander.</p>' +
      '<p>Jeder hat eine Spielkarte gezogen: Anna hat Stein ' + chip('stein') + ', Ben hat Schere ' + chip('schere') + ' und Conni hat Papier ' + chip('papier') + '.</p>' +
      '<p>Es gelten die klassischen Regeln: Stein schlägt Schere, Schere schlägt Papier, Papier schlägt Stein. So wie die Karten jetzt verteilt sind, würde jeder einmal gewinnen und einmal verlieren. Zum Beispiel gewinnt Ben gegen Conni und verliert gegen Anna.</p>' +
      '<p>Bevor das Ergebnis für jedes Spielerpaar ausgewertet wird, muss aber noch eine von vier Aktionskarten gewählt und deren Aktion ausgeführt werden. Bei den Aktionen geht es darum, mehrfach Spielkarten zwischen je zwei Spielern zu tauschen. Bei jedem Tausch kann neu entschieden werden, welche zwei Spieler miteinander tauschen – es sei denn, die Aktion sagt etwas anderes.</p>' +
      '<p>Ben möchte unbedingt gegen Conni gewinnen, egal wie die Aktion auf der gewählten Aktionskarte ausgeführt wird.</p>',
    question: 'Nur eine der vier Aktionen garantiert das. Welche?',
    howto: 'Wähle eine Aktionskarte. Am Spieltisch kannst du Tauschen ausprobieren: Tippe zwei Spieler an, dann tauschen sie ihre Karten.',
    explanation: function () {
      return '<p>Mit drei verschiedenen Karten gibt es nur zwei Arten, sie zu verteilen: Entweder gewinnt der Reihe nach Anna gegen Ben, Ben gegen Conni und Conni gegen Anna (so wie am Anfang), oder alle drei Ergebnisse sind genau umgekehrt. ' +
        '<strong>Jeder einzelne Tausch dreht diese Richtung um.</strong> Nach einer geraden Anzahl von Tauschen ist die Richtung also wieder wie am Anfang, und Ben gewinnt gegen Conni. Nach einer ungeraden Anzahl gewinnt Conni.</p>' +
        '<p>Richtig ist deshalb <strong>D</strong>. A ist falsch: Ein einziger Tausch von Ben und Conni lässt Conni gewinnen. B ist falsch: Schon ein Tausch von Anna und Ben reicht, damit Ben verliert (dann hat er Stein gegen Connis Papier). C ist falsch: Wenn Ben nur einmal mit Conni tauscht, verliert er.</p>' +
        '<p>Die Richtung hängt nur davon ab, ob die Anzahl der Tausche gerade oder ungerade ist – das ist eine <em>Invariante</em>: Sie bleibt bei zwei Tauschen unverändert, egal wer tauscht. Solche Invarianten helfen, Aussagen über alle möglichen Abläufe zu beweisen, ohne sie einzeln durchzuspielen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset(); resetTable();
      seats = PLAYERS.map(function (p, i) {
        return h('button', { type: 'button', class: 'sp-seat sp-seat' + i, 'data-seat': String(i), onclick: function () { onSeat(i); } });
      });
      resEl = h('ul', { class: 'sp-res' });
      countEl = h('p', { class: 'sp-count', role: 'status', 'aria-live': 'polite' });
      hintEl = h('p', { class: 'sp-hint' });
      tableEl = h('section', { class: 'sp-table', 'aria-label': 'Spieltisch zum Ausprobieren' },
        h('h3', null, 'Spieltisch zum Ausprobieren'),
        h('div', { class: 'sp-seats' }, seats),
        hintEl, countEl, resEl,
        h('button', { type: 'button', class: 'btn ghost sp-again', onclick: function () { resetTable(); drawTable(); } }, 'Ausgangslage'));
      radios = OPTIONS.map(function (o, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: 'sp-opt', 'data-opt': o.key,
          'aria-label': 'Aktion ' + o.key + ': ' + o.text,
          onclick: function () { choose(i, false); }, onkeydown: onKey
        });
        btn.innerHTML = '<span class="sp-key" aria-hidden="true">' + o.key + ')</span><span class="sp-txt">' + o.text + '</span>';
        return btn;
      });
      el.replaceChildren(h('div', { class: 'sp-board' },
        tableEl,
        h('section', { 'aria-label': 'Aktionskarten' }, h('h3', null, 'Aktionskarten'),
          h('div', { class: 'sp-opts', role: 'radiogroup', 'aria-label': 'Aktionen' }, radios))));
      drawTable();
      refresh();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () {
      return { correct: selected === RIGHT, answer: { choice: OPTIONS[selected].key } };
    },
    setAnswer: function (ans) {
      var i = OPTIONS.map(function (o) { return o.key; }).indexOf(ans && ans.choice);
      selected = i >= 0 ? i : null;
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      refresh();
    },
    reset: function () { reset(); resetTable(); drawTable(); refresh(); },
    showSolution: function () { selected = RIGHT; mark = 'solution'; locked = true; refresh(); }
  });
})();
