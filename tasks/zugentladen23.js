/* Aufgabe Zug entladen (Heft 2023, Klasse 5-6 schwer, 7-8 mittel, 9-10 einfach): Inversionen zählen */
(function () {
  'use strict';
  var h = Biber.h;

  var EXAMPLE = [4, 1, 3, 2];                          /* Beispielzug im Aufgabentext: 3 Runden */
  var TRAIN = [10, 3, 9, 7, 1, 6, 2, 8, 5, 4];          /* Zug der Aufgabe (Reihenfolge ab Lok, laut Lösungsseite) */
  var SOLUTION = 7;

  /* Eine Runde: Wagen fahren der Reihe nach am Kran vorbei; entladen wird nur die nächste Nummer. */
  function playRound(seq, next) {
    var left = [], steps = [];
    seq.forEach(function (n) {
      if (n === next) { steps.push({ n: n, out: true }); next++; } else { steps.push({ n: n, out: false }); left.push(n); }
    });
    return { left: left, steps: steps, next: next };
  }
  function allRounds(seq) {
    var res = [], next = 1, rest = seq.slice();
    while (rest.length) {
      var r = playRound(rest, next);
      res.push(r.steps.filter(function (s) { return s.out; }).map(function (s) { return s.n; }));
      rest = r.left; next = r.next;
    }
    return res;
  }

  /* ---------- Zeichnung ---------- */
  var WAGON = 48, LOCO = 72;
  function trainSvg(seq, label, gone) {
    var n = seq.length, w = LOCO + n * WAGON + 52;
    var s = '<svg class="t-zugentladen23-train" viewBox="0 0 ' + w + ' 118" style="max-width:' + Math.round(w * 1.25) + 'px" role="img" aria-label="' + label + '" focusable="false">';
    s += '<rect class="t-zugentladen23-rail" x="0" y="96" width="' + w + '" height="4" rx="2"/>';
    /* Lok */
    s += '<g class="t-zugentladen23-loco">' +
      '<rect class="t-zugentladen23-chim" x="9" y="30" width="9" height="16"/><rect class="t-zugentladen23-chim" x="6" y="27" width="15" height="5" rx="2"/>' +
      '<rect class="t-zugentladen23-boiler" x="3" y="44" width="42" height="28" rx="6"/>' +
      '<rect class="t-zugentladen23-cab" x="42" y="32" width="28" height="40" rx="3"/><rect class="t-zugentladen23-win" x="48" y="38" width="15" height="14" rx="2"/>' +
      '<rect class="t-zugentladen23-bed" x="0" y="70" width="70" height="8"/>' +
      '<circle class="t-zugentladen23-wheel" cx="16" cy="84" r="8"/><circle class="t-zugentladen23-wheel" cx="54" cy="84" r="8"/></g>';
    seq.forEach(function (num, i) {
      var x = LOCO + i * WAGON, out = gone && gone.indexOf(num) >= 0;
      s += '<g class="t-zugentladen23-wagon"><rect class="t-zugentladen23-bed" x="' + x + '" y="70" width="' + WAGON + '" height="8"/>' +
        '<circle class="t-zugentladen23-wheel" cx="' + (x + 10) + '" cy="84" r="6"/><circle class="t-zugentladen23-wheel" cx="' + (x + 38) + '" cy="84" r="6"/>';
      if (!out) {
        s += '<g class="t-zugentladen23-crate"><path class="t-zugentladen23-lid" d="M' + (x + 3) + ' 36L' + (x + 9) + ' 29H' + (x + 47) + 'L' + (x + 41) + ' 36Z"/>' +
          '<path class="t-zugentladen23-side" d="M' + (x + 41) + ' 36L' + (x + 47) + ' 29V63L' + (x + 41) + ' 70Z"/>' +
          '<rect class="t-zugentladen23-face" x="' + (x + 3) + '" y="36" width="38" height="34"/>' +
          '<text class="t-zugentladen23-num" x="' + (x + 22) + '" y="61" text-anchor="middle">' + num + '</text></g>';
      }
      s += '</g>';
    });
    /* Kran */
    var cx = LOCO + n * WAGON + 24;
    s += '<g class="t-zugentladen23-crane" aria-hidden="true"><rect x="' + cx + '" y="6" width="9" height="90"/><rect x="' + (cx - 30) + '" y="6" width="39" height="9"/>' +
      '<rect class="t-zugentladen23-hook" x="' + (cx - 28) + '" y="15" width="2" height="22"/><rect class="t-zugentladen23-hook" x="' + (cx - 31) + '" y="36" width="8" height="4"/></g>';
    return s + '</svg>';
  }

  var el, api, locked, mark;
  var input, inputWrap, exWrap, exLog, exBtn, exReset;
  var exSeq, exNext, exRounds, exLast;

  function value() { return input ? input.value.replace(/\D/g, '') : ''; }

  /* ---------- Beispiel ---------- */
  function exInit() { exSeq = EXAMPLE.slice(); exNext = 1; exRounds = 0; exLast = null; }
  function exRender() {
    var gone = EXAMPLE.filter(function (n) { return exSeq.indexOf(n) < 0; });
    exWrap.innerHTML = trainSvg(EXAMPLE, 'Beispielzug mit den Kisten 4, 1, 3, 2. Schon entladen: ' + (gone.length ? gone.join(', ') : 'keine'), gone);
    exLog.replaceChildren();
    if (exLast) {
      exLog.appendChild(h('strong', null, 'Runde ' + exRounds + ':'));
      exLog.appendChild(h('ul', null, exLast.map(function (s) {
        return h('li', { class: s.out ? 'out' : '' }, s.out ? 'Kiste ' + s.n + ' wird entladen.' : 'Kiste ' + s.n + ' ist nicht an der Reihe.');
      })));
    }
    var done = exSeq.length === 0;
    exBtn.disabled = done;
    exLog.appendChild(h('p', { class: 't-zugentladen23-exstat' }, done ? 'Alle Kisten sind entladen. Der Beispielzug hat drei Runden gebraucht.' :
      exRounds === 0 ? 'Als Nächstes wird Kiste 1 entladen.' : 'Als Nächstes wird Kiste ' + exNext + ' entladen.'));
  }
  function exRound() {
    if (!exSeq.length) return;
    var r = playRound(exSeq, exNext);
    exSeq = r.left; exNext = r.next; exRounds++; exLast = r.steps;
    exRender();
  }

  function paint() {
    var v = value();
    var cls = 't-zugentladen23-field';
    if (mark === 'right') cls += ' right'; else if (mark === 'wrong') cls += ' wrong';
    inputWrap.className = cls;
    input.disabled = !!locked;
  }

  function build() {
    exInit();
    exWrap = h('div', { class: 't-zugentladen23-fig' });
    exLog = h('div', { class: 't-zugentladen23-log', 'aria-live': 'polite' });
    exBtn = h('button', { type: 'button', class: 't-zugentladen23-btn', onclick: exRound }, 'Eine Runde fahren');
    exReset = h('button', { type: 'button', class: 't-zugentladen23-btn ghost', onclick: function () { exInit(); exRender(); } }, 'Von vorn');
    input = h('input', {
      class: 't-zugentladen23-input', type: 'text', inputmode: 'numeric', pattern: '[0-9]*', maxlength: '2', autocomplete: 'off',
      'aria-label': 'Anzahl der Runden', oninput: function () {
        var v = input.value.replace(/\D/g, '');
        if (v !== input.value) input.value = v;
        mark = null; paint(); api.changed();
      }
    });
    inputWrap = h('label', { class: 't-zugentladen23-field' }, input, h('span', null, 'Runden'));
    el.replaceChildren(h('div', { class: 't-zugentladen23-board' },
      h('section', { class: 't-zugentladen23-card', 'aria-label': 'Beispiel' },
        h('h3', null, 'Beispiel: Zug mit den Kisten 4, 1, 3, 2'),
        exWrap,
        h('div', { class: 't-zugentladen23-exbar' }, exBtn, exReset),
        exLog),
      h('section', { class: 't-zugentladen23-card', 'aria-label': 'Dein Zug' },
        h('h3', null, 'Dieser Zug soll entladen werden'),
        h('div', { class: 't-zugentladen23-fig' }),
        h('p', { class: 't-zugentladen23-hint' }, 'Die Lok fährt voran: Der Wagen direkt hinter der Lok kommt zuerst am Kran vorbei.'),
        h('div', { class: 't-zugentladen23-answer' }, h('span', { class: 't-zugentladen23-q' }, 'Der Zug muss'), inputWrap, h('span', { class: 't-zugentladen23-q' }, 'fahren.')))));
    el.querySelectorAll('.t-zugentladen23-fig')[1].innerHTML = trainSvg(TRAIN, 'Zug mit zehn Wagen. Die Kisten stehen ab der Lok in dieser Reihenfolge: ' + TRAIN.join(', '));
    exRender();
    paint();
  }

  Biber.register({
    id: 'zugentladen23',
    story: '<p>Ein Zug hat Wagen mit nummerierten Kisten. Zum Entladen der Kisten fährt der Zug eine Runde zum Kran. Der Kran ist unbeweglich, und der Zug kann nur vorwärts fahren.</p>' +
      '<p>Die Kisten sollen in der Reihenfolge ihrer Nummern entladen werden, Kiste 1 zuerst.</p>' +
      '<p>Der Zug fährt Wagen für Wagen die Kisten unter den Kran. Nur wenn eine Kiste an der Reihe ist, entlädt der Kran die Kiste. Wenn der Zug unter dem Kran durch ist, können noch Kisten auf den Wagen sein. Dann muss der Zug noch eine Runde zum Kran fahren.</p>' +
      '<p>Der Beispielzug unten muss drei Runden fahren, bis alle Kisten in der richtigen Reihenfolge entladen sind.</p>',
    question: 'Wie viele Runden muss der Zug mit den zehn Kisten fahren, bis alle Kisten in der richtigen Reihenfolge entladen sind?',
    howto: 'Mit „Eine Runde fahren“ kannst du am Beispielzug nachvollziehen, wie das Entladen abläuft. Tippe deine Antwort für den unteren Zug als Zahl ein.',
    explanation: function () {
      var rounds = allRounds(TRAIN);
      return '<div class="t-zugentladen23-expl"><p>Eine weitere Runde ist immer dann nötig, wenn zwei Kisten mit aufeinanderfolgenden Nummern falsch herum stehen, also die größere Nummer weiter vorn. ' +
        'Beim Zug 10, 3, 9, 7, 1, 6, 2, 8, 5, 4 passiert das bei den Paaren (2,3), (4,5), (5,6), (6,7), (8,9) und (9,10), also sechsmal. Dazu kommt die erste Runde: <strong>7 Runden</strong>.</p>' +
        '<ol class="t-zugentladen23-rounds">' + rounds.map(function (r) { return '<li>Runde ' + (rounds.indexOf(r) + 1) + ': Kiste ' + r.join(' und ') + '</li>'; }).join('') + '</ol>' +
        '<p>In der Informatik heißt ein solches Paar eine <em>Inversion</em> (Umkehrung). Die Anzahl der Inversionen verrät zum Beispiel, wie viele Vertauschungen manche Sortieralgorithmen brauchen.</p></div>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; mark = null;
      el.classList.add('t-zugentladen23');
      build();
    },
    isComplete: function () { return value() !== ''; },
    evaluate: function () {
      var n = parseInt(value(), 10);
      return { correct: n === SOLUTION, answer: { n: n } };
    },
    setAnswer: function (ans) {
      input.value = ans && typeof ans.n === 'number' && isFinite(ans.n) ? String(ans.n) : '';
      mark = parseInt(value(), 10) === SOLUTION ? 'right' : 'wrong';
      paint();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (parseInt(value(), 10) === SOLUTION ? 'right' : 'wrong') : null;
      paint();
    },
    reset: function () { locked = false; mark = null; input.value = ''; exInit(); exRender(); paint(); },
    showSolution: function () { locked = true; mark = 'right'; input.value = String(SOLUTION); paint(); }
  });
})();
