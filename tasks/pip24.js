/* Aufgabe Pip der Pirat (Heft 2024, S. 45; Klasse 7-8 schwer, 9-10 mittel, 11-13 einfach): binäre Suche, 16 Quadrate -> 4 Fragen */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-pip24-';
  var A = 'assets/pip24/';

  var ANSWER = 4;       /* Heft: 4 ist die richtige Antwort (ceil(log2(16))) */
  var SIZE = 4, CELLS = SIZE * SIZE;
  /* Lage des Gitters im Kartenbild (Prozent) */
  var GX = 6.76, GY = 11.55, CW = 21.41, CH = 19.8;

  var el, api, locked, mark, inputEl;
  var cand, sel, asked, log, simBtn, simInfo, simLog, cellBtns, newBtn, mapWrap;

  function cellName(i) { return 'Zeile ' + (Math.floor(i / SIZE) + 1) + ', Spalte ' + (i % SIZE + 1); }
  function allCells() { var a = []; for (var i = 0; i < CELLS; i++) a.push(i); return a; }

  function newGame() {
    cand = allCells(); sel = []; asked = 0; log = []; simDraw();
  }
  function toggleCell(i) {
    if (locked || cand.length === 1 || cand.indexOf(i) < 0) return;
    var k = sel.indexOf(i);
    if (k >= 0) sel.splice(k, 1); else sel.push(i);
    simDraw();
  }
  function ask() {
    if (locked || cand.length <= 1 || !sel.length) return;
    var q = sel.slice().sort(function (a, b) { return a - b; });
    var yes = cand.filter(function (c) { return q.indexOf(c) >= 0; });
    var no = cand.filter(function (c) { return q.indexOf(c) < 0; });
    /* Plapper antwortet so, dass Pip möglichst lange suchen muss (ungünstigster Fall); bei Gleichstand „nein“ */
    var sayYes = yes.length > no.length;
    if (!no.length) sayYes = true;
    if (!yes.length) sayYes = false;
    cand = sayYes ? yes : no;
    asked++;
    log.push('Frage ' + asked + ': ' + q.length + (q.length === 1 ? ' Quadrat' : ' Quadrate') + ' – Plapper sagt „' + (sayYes ? 'ja' : 'nein') + '“. Noch möglich: ' + cand.length + '.');
    sel = [];
    simDraw();
  }

  function simDraw() {
    var done = cand.length === 1;
    cellBtns.forEach(function (b, i) {
      var isCand = cand.indexOf(i) >= 0, on = sel.indexOf(i) >= 0;
      b.classList.toggle('out', !isCand);
      b.classList.toggle('sel', on);
      b.classList.toggle('found', done && isCand);
      b.disabled = locked || !isCand || done;
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', cellName(i) + (!isCand ? ', kann nicht mehr sein' : on ? ', ausgewählt' : done ? ', hier ist der Schatz' : ', möglich'));
      b.textContent = done && isCand ? '★' : '';
    });
    simBtn.disabled = locked || done || !sel.length;
    simBtn.textContent = sel.length ? 'Plapper fragen (' + sel.length + (sel.length === 1 ? ' Quadrat' : ' Quadrate') + ')' : 'Plapper fragen';
    newBtn.disabled = locked || (!asked && !sel.length);
    if (done) {
      simInfo.textContent = 'Pip weiß es: Der Schatz ist im Quadrat mit dem Stern (' + cellName(cand[0]) + ') – nach ' + asked + (asked === 1 ? ' Frage.' : ' Fragen.');
    } else {
      simInfo.textContent = 'Noch möglich: ' + cand.length + ' Quadrate' + (asked ? ' (nach ' + asked + (asked === 1 ? ' Frage' : ' Fragen') + ')' : '') + '. Tippe Quadrate an, nach denen Pip fragen soll.';
    }
    simLog.replaceChildren.apply(simLog, log.map(function (t) { return h('li', null, t); }));
  }

  function miniGrid(asked, out) {
    var s = '<svg class="' + P + 'mini" viewBox="0 0 84 84" aria-hidden="true" focusable="false">';
    for (var i = 0; i < CELLS; i++) {
      var x = (i % SIZE) * 20 + 2, y = Math.floor(i / SIZE) * 20 + 2;
      var cls = out.indexOf(i) >= 0 ? 'out' : asked.indexOf(i) >= 0 ? 'ask' : 'cand';
      s += '<rect class="' + P + 'c-' + cls + '" x="' + x + '" y="' + y + '" width="18" height="18" rx="2"/>';
    }
    return s + '</svg>';
  }

  Biber.register({
    id: 'pip24',
    story:
      '<p>Pip der Pirat sucht einen Schatz auf einer einsamen Insel. Pip hat einen Plan der Insel. Der Plan ist in 16 Quadrate eingeteilt.</p>' +
      '<p>Plapper, Pips Papagei, weiß, in welchem Quadrat der Schatz ist. Pip kann Plapper nach einer beliebigen Menge von Quadraten fragen. Plapper sagt ihm dann, ob der Schatz in irgendeinem dieser Quadrate ist oder nicht.</p>' +
      '<p>Ein Beispiel: Pip fragt nach den drei Quadraten, die im Bild markiert sind. Wenn Plapper „ja“ sagt, weiß Pip, dass der Schatz in irgendeinem dieser drei Quadrate ist – aber nicht, in welchem.</p>' +
      '<figure class="' + P + 'fig"><img src="' + A + 'map_beispiel.png" width="700" height="757" alt="Plan der Insel mit 16 Quadraten. Drei Quadrate in der obersten Reihe sind orange markiert: das ganz linke, das dritte und das vierte."></figure>' +
      '<p>Pip will so schnell wie möglich sicher wissen, in welchem Quadrat der Schatz ist.</p>',
    question: 'Wie oft muss Pip dazu mindestens nach Quadraten fragen?',
    howto: 'Trage die Zahl unten ein. Zum Nachdenken kannst du es mit dem Plan ausprobieren: Plapper antwortet dort immer so, dass Pip möglichst lange suchen muss.',
    explanation: function () {
      var steps = [
        { a: [0, 1, 2, 3, 4, 5, 6, 7], o: [], t: 'Frage 1: 8 von 16 Quadraten' },
        { a: [10, 11, 14, 15], o: [0, 1, 2, 3, 4, 5, 6, 7], t: 'Frage 2: 4 von 8' },
        { a: [8, 9], o: [0, 1, 2, 3, 4, 5, 6, 7, 10, 11, 14, 15], t: 'Frage 3: 2 von 4' },
        { a: [12], o: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15], t: 'Frage 4: 1 von 2' }
      ];
      var fig = '<div class="' + P + 'steps">' + steps.map(function (s) {
        return '<figure>' + miniGrid(s.a, s.o) + '<figcaption>' + s.t + '</figcaption></figure>';
      }).join('') + '</div>';
      return '<p>Pip fragt jedes Mal nach <strong>genau der Hälfte</strong> der Quadrate, in denen der Schatz noch sein kann: erst 8 von 16, dann 4 von 8, dann 2 von 4, zuletzt 1 von 2. Nach <strong>4 Fragen</strong> weiß er sicher, wo der Schatz liegt.</p>' +
        fig +
        '<p class="' + P + 'legend">Gefragt (orange), schon ausgeschlossen (dunkel), noch möglich (hell). Hier sagt Plapper immer „nein“.</p>' +
        '<p>Mit weniger Fragen geht es nicht: Teilt Pip nicht in zwei gleich große Hälften, kann der Schatz im größeren Teil liegen, und dann braucht er mindestens so viele Fragen wie für eine Hälfte.</p>' +
        '<p>Dieses wiederholte Halbieren heißt <strong>binäre Suche</strong>. Bei n Möglichkeiten braucht man etwa log₂(n) Fragen: bei 16 sind es 4, bei 1000 etwa 10 und bei einer Million nur etwa 20.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; mark = null;
      cellBtns = [];
      for (var i = 0; i < CELLS; i++) {
        (function (i) {
          cellBtns.push(h('button', {
            type: 'button', class: P + 'cell',
            style: 'left:' + (GX + (i % SIZE) * CW).toFixed(2) + '%;top:' + (GY + Math.floor(i / SIZE) * CH).toFixed(2) + '%;width:' + CW + '%;height:' + CH + '%',
            onclick: function () { toggleCell(i); }
          }));
        })(i);
      }
      mapWrap = h('div', { class: P + 'map' },
        h('img', { src: A + 'map.png', width: 700, height: 757, draggable: 'false', alt: 'Plan der Insel mit 4 mal 4 Quadraten. Die Quadrate darüber sind zum Ausprobieren antippbar.' }),
        cellBtns);
      simBtn = h('button', { type: 'button', class: P + 'btn ' + P + 'ask', onclick: ask }, 'Plapper fragen');
      newBtn = h('button', { type: 'button', class: P + 'btn', onclick: function () { if (!locked) newGame(); } }, 'Neu probieren');
      simInfo = h('p', { class: P + 'info', role: 'status', 'aria-live': 'polite' });
      simLog = h('ol', { class: P + 'log' });
      inputEl = h('input', {
        type: 'text', inputmode: 'numeric', pattern: '[0-9]*', maxlength: '2', autocomplete: 'off', class: P + 'num', id: P + 'num',
        'aria-label': 'Mindestens so viele Fragen sind nötig',
        oninput: function () {
          inputEl.value = inputEl.value.replace(/[^0-9]/g, '');
          mark = null; showMark();
          api.changed(inputEl.value ? 'Du hast ' + inputEl.value + ' eingetragen.' : '');
        }
      });
      var markEl = h('span', { class: P + 'mark', 'aria-hidden': 'true' });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { 'aria-label': 'Zum Ausprobieren' },
          h('h3', null, 'Zum Ausprobieren: der Plan'), mapWrap,
          h('div', { class: P + 'ctl' }, simBtn, newBtn), simInfo, simLog),
        h('section', { 'aria-label': 'Antwort', class: P + 'ans' },
          h('h3', null, 'Deine Antwort'),
          h('label', { class: P + 'ansrow', for: P + 'num' },
            h('span', null, 'Pip muss mindestens'), inputEl, h('span', null, 'Mal fragen.'), markEl))));
      newGame();
    },
    isComplete: function () { return /^[1-9][0-9]*$/.test(inputEl.value); },
    evaluate: function () {
      var v = parseInt(inputEl.value, 10);
      return { correct: v === ANSWER, answer: { count: v } };
    },
    setAnswer: function (ans) {
      inputEl.value = ans && ans.count != null ? String(ans.count) : '';
      mark = 'check'; showMark();
    },
    lock: function (on) {
      locked = on;
      inputEl.disabled = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      showMark();
      simDraw();
    },
    reset: function () { inputEl.value = ''; mark = null; showMark(); newGame(); },
    showSolution: function () { inputEl.value = String(ANSWER); locked = true; inputEl.disabled = true; mark = 'solution'; showMark(); simDraw(); }
  });

  function showMark() {
    var m = el.querySelector('.' + P + 'mark');
    var ok = parseInt(inputEl.value, 10) === ANSWER;
    inputEl.classList.toggle('right', mark !== null && ok);
    inputEl.classList.toggle('wrong', mark === 'check' && !ok);
    if (m) { m.textContent = mark === null ? '' : (ok ? '✓' : '✗'); m.className = P + 'mark' + (mark === null ? '' : ok ? ' ok' : ' bad'); }
  }
})();
