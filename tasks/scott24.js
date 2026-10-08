/* Aufgabe Scotts Armbänder (Heft 2024, S. 59; Klasse 7-8 schwer, 9-10 mittel): längste aufsteigende Teilfolge (Perlen verwenden oder weglegen) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-scott24-';

  var TUBE = [5, 1, 3, 2, 4, 8, 6, 7, 9];   /* Röhrchen im Heft, S. 59 (von der Schnur aus gesehen) */
  var N = TUBE.length;

  /* Längste aufsteigende Teilfolge per dynamischer Programmierung */
  var LEN = TUBE.map(function () { return 1; });
  (function () {
    for (var i = 0; i < N; i++) for (var j = 0; j < i; j++) if (TUBE[j] < TUBE[i] && LEN[j] + 1 > LEN[i]) LEN[i] = LEN[j] + 1;
  })();
  var BEST = Math.max.apply(null, LEN);   /* 6 */
  /* Eine Lösung laut Heft: 1 2 4 6 7 9 (die andere: 1 3 4 6 7 9) */
  var SOL = ['d', 'u', 'd', 'u', 'u', 'd', 'u', 'u', 'u'];

  var el, api, locked, dec, mark;
  var tubeEl, stringEl, trayEl, infoEl, resEl, btnUse, btnDrop, btnBack;

  function reset() { dec = []; mark = null; }
  function used() { return dec.map(function (d, i) { return d === 'u' ? TUBE[i] : null; }).filter(function (v) { return v !== null; }); }
  function lastUsed() { var u = used(); return u.length ? u[u.length - 1] : 0; }
  function canUse() { return dec.length < N && TUBE[dec.length] > lastUsed(); }

  function bead(n, cls) { return h('span', { class: P + 'bead' + (cls ? ' ' + cls : ''), 'aria-hidden': 'true' }, String(n)); }
  function beadHtml(n) { return '<span class="' + P + 'bead ' + P + 'inl">' + n + '</span>'; }
  function beads(list) { return list.map(beadHtml).join(''); }

  function push(d) {
    if (locked || dec.length >= N) return;
    if (d === 'u' && !canUse()) return;
    dec.push(d);
    draw();
    api.changed(statusText());
    focusNext();
  }
  function back() {
    if (locked || !dec.length) return;
    dec.pop();
    draw();
    api.changed(statusText());
    focusNext();
  }
  function focusNext() {
    if (document.activeElement && document.activeElement.disabled) {
      var b = [btnUse, btnDrop, btnBack].filter(function (x) { return !x.disabled; })[0];
      if (b) b.focus();
    }
  }
  function statusText() {
    return dec.length >= N ? 'Alle Perlen entschieden.' : (dec.length + ' von ' + N + ' Perlen entschieden.');
  }

  function draw() {
    var nxt = dec.length;
    /* Röhrchen: feste Plätze, entschiedene Perlen sind weg */
    tubeEl.replaceChildren.apply(tubeEl, TUBE.map(function (n, i) {
      if (i < nxt) return h('span', { class: P + 'slot', 'aria-hidden': 'true' });
      return bead(n, i === nxt && !locked ? 'next' : '');
    }));
    tubeEl.setAttribute('aria-label', 'Röhrchen, noch drin: ' + (nxt < N ? TUBE.slice(nxt).join(', ') : 'nichts'));
    var u = used();
    var st = h('div', { class: P + 'beads' }, u.map(function (n) { return bead(n); }));
    stringEl.replaceChildren.apply(stringEl, u.length ? [st] : [st, h('span', { class: P + 'empty' }, 'Die Schnur ist leer.')]);
    stringEl.setAttribute('aria-label', 'Schnur: ' + (u.length ? u.join(', ') : 'leer'));
    var dropped = dec.map(function (d, i) { return d === 'd' ? TUBE[i] : null; }).filter(function (v) { return v !== null; });
    trayEl.replaceChildren.apply(trayEl, dropped.length ? dropped.map(function (n) { return bead(n); }) : [h('span', { class: P + 'empty' }, 'Nichts weggelegt.')]);
    trayEl.setAttribute('aria-label', 'Weggelegt: ' + (dropped.length ? dropped.join(', ') : 'nichts'));

    var done = nxt >= N;
    btnUse.disabled = locked || done || !canUse();
    btnDrop.disabled = locked || done;
    btnBack.disabled = locked || !dec.length;
    var last = lastUsed();
    if (done) {
      infoEl.textContent = 'Alle Perlen sind entschieden. Dein Armband hat ' + u.length + ' Perlen.';
    } else {
      var nb = TUBE[nxt];
      infoEl.textContent = 'Nächste Perle: ' + nb + '. ' + (last ? 'Letzte Perle auf der Schnur: ' + last + '. ' : 'Die Schnur ist leer. ') +
        (canUse() ? 'Du kannst die ' + nb + ' verwenden oder weglegen.' : 'Die ' + nb + ' ist nicht größer als ' + last + ', also muss sie weggelegt werden.');
    }
    btnUse.setAttribute('aria-label', done ? 'Verwenden' : 'Perle ' + TUBE[nxt] + ' verwenden');
    btnDrop.setAttribute('aria-label', done ? 'Weglegen' : 'Perle ' + TUBE[nxt] + ' weglegen');
    var cls = P + 'res';
    if (mark !== null && done) {
      var ok = u.length === BEST;
      resEl.className = cls + ' ' + (ok ? 'ok' : 'bad');
      resEl.textContent = ok
        ? (mark === 'solution' ? 'So geht es: ' : 'Richtig: ') + u.length + ' Perlen, mehr geht nicht.'
        : 'Dein Armband hat ' + u.length + ' Perlen. Es geht mit ' + BEST + '.';
    } else { resEl.className = cls; resEl.textContent = ''; }
  }

  Biber.register({
    id: 'scott24',
    story:
      '<p>Scott hat Perlen mit Nummern und macht Armbänder daraus. Die Perlen kommen nacheinander aus einem Glasröhrchen. Für jede Perle entscheidet Scott: Entweder verwendet er die Perle fürs Armband und fädelt sie auf die Schnur, oder er legt sie weg.</p>' +
      '<p>Scott kann eine Perle nur dann verwenden, wenn</p>' +
      '<ul><li>die Schnur leer ist oder</li><li>die Nummer der Perle größer ist als die Nummer der letzten Perle auf der Schnur.</li></ul>' +
      '<p><b>Beispiel:</b> Auf der Schnur liegen ' + beads([1, 2]) + ', im Röhrchen warten ' + beads([5, 3, 4, 7]) + '. Die letzte Perle auf der Schnur ist die ' + beadHtml(2) + '. ' +
      'Die nächste Perle ' + beadHtml(5) + ' kann Scott verwenden, aber auch weglegen. Wenn er sie verwendet, kann er ein Armband mit vier Perlen machen: ' + beads([1, 2, 5, 7]) + '. ' +
      'Wenn er sie weglegt, kann er ein Armband mit fünf Perlen machen: ' + beads([1, 2, 3, 4, 7]) + '.</p>' +
      '<p>Scott bekommt ein neues Röhrchen mit Perlen. Er will daraus ein Armband mit möglichst vielen Perlen machen.</p>',
    question: 'Wie kann Scott das schaffen? Entscheide für jede Perle, ob sie verwendet oder weggelegt wird.',
    howto: 'Die Perlen kommen von links aus dem Röhrchen, die leuchtende ist die nächste. Tippe „Verwenden“ oder „Weglegen“. Mit „Zurück“ nimmst du die letzte Entscheidung zurück.',
    explanation: function () {
      return '<p>Das Röhrchen ist eine Folge von Zahlen: ' + beads(TUBE) + '. Ein Armband ist eine <strong>aufsteigende Teilfolge</strong> davon. Gesucht ist die längste.</p>' +
        '<p>Beginnt Scott mit der ' + beadHtml(5) + ', bleiben nur ' + beads([5, 6, 7, 9]) + ' oder ' + beads([5, 8, 9]) + ' möglich, also höchstens 4 Perlen. ' +
        'Legt er die 5 weg und verwendet die ' + beadHtml(1) + ', geht mehr. Beginnt er stattdessen mit der 2 oder 3, sind diese Armbänder in den Armbändern mit der 1 am Anfang enthalten.</p>' +
        '<p>Die längsten Armbänder haben <strong>6 Perlen</strong>: ' + beads([1, 2, 4, 6, 7, 9]) + ' oder ' + beads([1, 3, 4, 6, 7, 9]) + '. Beide sind richtig.</p>' +
        '<p>Alle Teilfolgen aufzulisten, wird bei langen Folgen sehr aufwändig. Mit <strong>dynamischem Programmieren</strong> bestimmt man die längste aufsteigende Teilfolge viel schneller: Man merkt sich für jede Perle, wie lang die längste Kette ist, die bei ihr endet.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      tubeEl = h('div', { class: P + 'tube', role: 'group' });
      stringEl = h('div', { class: P + 'string', role: 'group' });
      trayEl = h('div', { class: P + 'tray', role: 'group' });
      infoEl = h('p', { class: P + 'info', role: 'status', 'aria-live': 'polite' });
      resEl = h('p', { class: P + 'res', role: 'status', 'aria-live': 'polite' });
      btnUse = h('button', { type: 'button', class: P + 'btn ' + P + 'use', onclick: function () { push('u'); } }, 'Verwenden');
      btnDrop = h('button', { type: 'button', class: P + 'btn ' + P + 'drop', onclick: function () { push('d'); } }, 'Weglegen');
      btnBack = h('button', { type: 'button', class: P + 'btn ' + P + 'back', onclick: back }, '↶ Zurück');
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { 'aria-label': 'Röhrchen' }, h('h3', null, 'Röhrchen (die Perlen kommen von links)'), tubeEl),
        h('section', { 'aria-label': 'Schnur' }, h('h3', null, 'Armband auf der Schnur'), stringEl),
        h('section', { 'aria-label': 'Weggelegt' }, h('h3', null, 'Weggelegt'), trayEl),
        infoEl,
        h('div', { class: P + 'ctl' }, btnUse, btnDrop, btnBack),
        resEl));
      draw();
    },
    isComplete: function () { return dec.length === N; },
    evaluate: function () {
      var u = used();
      return { correct: u.length === BEST, answer: { choices: dec.join(''), bracelet: u } };
    },
    setAnswer: function (ans) {
      var s = String((ans && ans.choices) || '');
      dec = [];
      for (var i = 0; i < s.length && i < N; i++) {
        var d = s.charAt(i) === 'u' ? 'u' : 'd';
        if (d === 'u' && !(TUBE[i] > lastUsed())) d = 'd';
        dec.push(d);
      }
      mark = 'check';
      draw();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      draw();
    },
    reset: function () { reset(); draw(); },
    showSolution: function () { dec = SOL.slice(); locked = true; mark = 'solution'; draw(); }
  });
})();
