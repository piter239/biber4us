/* Aufgabe Marias Kiste (Biber 2022; Klasse 9-10 schwer, 11-13 mittel): Schlüsselkombination aus Hinweisen bestimmen (Constraint Satisfaction) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-mariaskiste22-';

  /* Symbole (viewBox 0 0 24 24, schwarz auf hellem Rad) */
  var SYM = {
    ast: { name: 'Asterisk' }, haus: { name: 'Haus' }, mond: { name: 'Mond' }, tanne: { name: 'Tanne' },
    dia: { name: 'Diamant' }, stern: { name: 'Stern' }, herz: { name: 'Herz' }, kreis: { name: 'Kreis' }
  };
  var ORDER = ['ast', 'haus', 'mond', 'tanne', 'dia', 'stern', 'herz', 'kreis'];
  function starPts() {
    var p = [], i, a, r;
    for (i = 0; i < 10; i++) { a = -Math.PI / 2 + i * Math.PI / 5; r = i % 2 ? 4.6 : 11; p.push((12 + r * Math.cos(a)).toFixed(2) + ',' + (13 + r * Math.sin(a)).toFixed(2)); }
    return p.join(' ');
  }
  function glyph(id) {
    switch (id) {
      case 'kreis': return '<circle cx="12" cy="12" r="8.6"/>';
      case 'stern': return '<polygon points="' + starPts() + '"/>';
      case 'herz': return '<path d="M12 21.5C5 15.5 2.4 11.8 2.4 8C2.4 5 4.6 3 7.2 3C9.2 3 11 4.1 12 6C13 4.1 14.8 3 16.8 3C19.4 3 21.6 5 21.6 8C21.6 11.8 19 15.5 12 21.5Z"/>';
      case 'mond': return '<path d="M15.5 2.8A9.4 9.4 0 1 0 21.2 16.4A7.6 7.6 0 0 1 15.5 2.8Z"/>';
      case 'dia': return '<polygon points="12,2 21.5,12 12,22 2.5,12"/>';
      case 'haus': return '<polygon points="12,2.2 22,12.2 17.6,12.2 17.6,21.8 6.4,21.8 6.4,12.2 2,12.2"/>';
      case 'tanne': return '<polygon points="12,2 18.5,10.6 15,10.6 21.2,19.2 13.4,19.2 13.4,22 10.6,22 10.6,19.2 2.8,19.2 9,10.6 5.5,10.6"/>';
      case 'ast':
        return [0, 72, 144, 216, 288].map(function (a) { return '<rect x="-3.5" y="0" width="7" height="10.6" transform="translate(12 12.4) rotate(' + a + ')"/>'; }).join('');
    }
    return '';
  }
  function symSvg(id, cls) {
    return '<svg class="' + (cls || P + 'sym') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + glyph(id) + '</svg>';
  }
  function comboName(c) { return c.map(function (s) { return SYM[s].name; }).join(', '); }
  function lockHtml(c, big) {
    return '<span class="' + P + 'lock' + (big ? ' ' + P + 'big' : '') + '" aria-hidden="true">' +
      c.map(function (s) { return '<span class="' + P + 'wheel">' + symSvg(s) + '</span>'; }).join('') + '</span>';
  }

  /* Hinweise wie im Heft; t: right1 = ein Symbol richtig platziert, none = keines, wrong2 / wrong1 = so viele Symbole, alle an falscher Position */
  var CLUES = [
    { combo: ['ast', 'haus', 'mond'], t: 'right1', text: 'Eines der Symbole ist Teil des Schlüssels und steht an der richtigen Position.' },
    { combo: ['tanne', 'dia', 'haus'], t: 'none', text: 'Keines der Symbole ist Teil des Schlüssels.' },
    { combo: ['mond', 'stern', 'ast'], t: 'wrong2', text: 'Zwei Symbole sind Teil des Schlüssels. Beide stehen aber an der falschen Position.' },
    { combo: ['ast', 'herz', 'kreis'], t: 'wrong1', text: 'Ein Symbol ist Teil des Schlüssels. Es steht aber an der falschen Position.' },
    { combo: ['tanne', 'haus', 'stern'], t: 'wrong1', text: 'Ein Symbol ist Teil des Schlüssels. Es steht aber an der falschen Position.' }
  ];
  var OPTIONS = [
    { key: 'A', combo: ['ast', 'stern', 'herz'] },
    { key: 'B', combo: ['stern', 'kreis', 'mond'] },
    { key: 'C', combo: ['ast', 'stern', 'kreis'] },
    { key: 'D', combo: ['haus', 'stern', 'mond'] }
  ];
  var RIGHT = 1;   /* B: im Heft bestätigt; per Skript über alle 336 Kombinationen geprüft: B erfüllt alle Hinweise und ist der einzige Schlüssel */

  var el, api, radios, selected, locked, mark, notes, noteBtns;

  function reset() {
    selected = null; mark = null; notes = {};
    ORDER.forEach(function (s) { notes[s] = ['', '', '']; });
  }

  /* ---------- Notizblock ---------- */
  var NOTE_TXT = { '': 'offen', no: 'ausgeschlossen', yes: 'sicher' };
  var NOTE_SIGN = { '': '', no: '✗', yes: '✓' };
  function nextNote(v) { return v === '' ? 'no' : v === 'no' ? 'yes' : ''; }
  function refreshNotes() {
    ORDER.forEach(function (s) {
      for (var p = 0; p < 3; p++) {
        var b = noteBtns[s][p], v = notes[s][p];
        b.textContent = NOTE_SIGN[v];
        b.className = P + 'note ' + (v ? P + 'n-' + v : '');
        b.setAttribute('aria-label', SYM[s].name + ', Position ' + (p + 1) + ': ' + NOTE_TXT[v]);
      }
      noteBtns[s].row.setAttribute('aria-pressed', String(notes[s].every(function (v) { return v === 'no'; })));
    });
  }
  function noteTable() {
    noteBtns = {};
    var rows = ORDER.map(function (s) {
      noteBtns[s] = [];
      var rowBtn = h('button', {
        type: 'button', class: P + 'rowbtn', 'aria-pressed': 'false',
        'aria-label': SYM[s].name + ' ganz ausschließen (kommt im Schlüssel nicht vor)',
        onclick: function () {
          var allNo = notes[s].every(function (v) { return v === 'no'; });
          notes[s] = allNo ? ['', '', ''] : ['no', 'no', 'no'];
          refreshNotes();
        }
      });
      rowBtn.innerHTML = symSvg(s) + '<span>' + SYM[s].name + '</span>';
      noteBtns[s].row = rowBtn;
      var cells = [0, 1, 2].map(function (p) {
        var b = h('button', {
          type: 'button', onclick: function () { notes[s][p] = nextNote(notes[s][p]); refreshNotes(); }
        });
        noteBtns[s][p] = b;
        return h('td', null, b);
      });
      return h('tr', null, h('th', { scope: 'row' }, rowBtn), cells);
    });
    return h('table', { class: P + 'notetab' },
      h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Symbol'), h('th', { scope: 'col' }, 'Pos. 1'), h('th', { scope: 'col' }, 'Pos. 2'), h('th', { scope: 'col' }, 'Pos. 3'))),
      h('tbody', null, rows));
  }

  /* ---------- Antworten ---------- */
  function choose(i, focus) {
    if (locked) return;
    selected = i;
    refresh();
    if (focus) radios[i].focus();
    api.changed();
  }
  function refresh() {
    radios.forEach(function (btn, i) {
      var on = selected === i, ok = i === RIGHT;
      btn.setAttribute('aria-checked', String(on));
      btn.tabIndex = (selected === null ? i === 0 : on) ? 0 : -1;
      btn.setAttribute('aria-disabled', locked ? 'true' : 'false');
      btn.classList.toggle('selected', on);
      btn.classList.toggle('right', on && mark !== null && ok);
      btn.classList.toggle('wrong', on && mark === 'check' && !ok);
      var m = btn.querySelector('.' + P + 'mark');
      if (m) m.remove();
      if (on && mark !== null) btn.appendChild(h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
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
    id: 'mariaskiste22',
    story:
      '<p>Maria findet eine geheimnisvolle Kiste. Ob ein Schatz darin versteckt ist? Leider ist die Kiste verschlossen. Um sie zu öffnen, muss Maria den „Schlüssel“ herausfinden: die richtige Kombination aus drei Symbolen (acht verschiedene Symbole gibt es, jedes kommt höchstens einmal vor).</p>' +
      '<p>Zum Glück findet sie neben der Kiste auch diese Hinweise zu einigen <b>falschen</b> Kombinationen:</p>',
    question: 'Eine dieser Kombinationen ist der Schlüssel für Marias Kiste. Welche?',
    howto: 'Lies die fünf Hinweise und wähle dann eine Kombination. Im Notizblock kannst du Symbole und Positionen abhaken (antippen: ✗, nochmal: ✓, nochmal: leer).',
    explanation: function () {
      return '<p>Aus den Hinweisen lässt sich der Schlüssel Schritt für Schritt ableiten:</p>' +
        '<ol>' +
        '<li>Hinweis 2: <strong>Tanne, Diamant und Haus</strong> sind nicht dabei.</li>' +
        '<li>Hinweis 5: Eines von Tanne, Haus und Stern ist dabei, aber an falscher Stelle. Tanne und Haus fallen weg, also ist der <strong>Stern</strong> dabei, und zwar nicht an letzter Stelle.</li>' +
        '<li>Hinweis 3: Der Stern steht auch nicht in der Mitte. Er steht also <strong>vorne</strong>. Das passt nur zu Antwort B.</li>' +
        '<li>Hinweis 1: Genau ein Symbol ist an der richtigen Stelle. Haus ist ausgeschlossen, und vorne steht schon der Stern, nicht der Asterisk. Also steht der <strong>Mond hinten</strong>. Damit sind Stern und Mond die zwei Symbole aus Hinweis 3, der Asterisk ist nicht dabei.</li>' +
        '<li>Hinweis 4: Eines von Herz und Kreis ist dabei, aber an falscher Stelle. Frei ist nur noch die Mitte. Das Herz steht im Hinweis in der Mitte, wäre dort also richtig. Darum gehört der <strong>Kreis in die Mitte</strong>.</li>' +
        '</ol>' +
        '<p>Der Schlüssel ist also Stern – Kreis – Mond. Das ist ein Problem mit Randbedingungen (Constraint Satisfaction). Ein Computer könnte alle 336 möglichen Kombinationen durchprobieren (Brute Force). Besser ist Backtracking: Man baut die Kombination Schritt für Schritt auf und verwirft eine Teillösung sofort, wenn sie einem Hinweis widerspricht.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      var clueRows = CLUES.map(function (c, i) {
        var li = h('li', { class: P + 'clue' });
        li.setAttribute('aria-label', 'Hinweis ' + (i + 1) + ': ' + comboName(c.combo) + '. ' + c.text);
        li.innerHTML = '<span class="' + P + 'cn" aria-hidden="true">' + (i + 1) + '</span>' + lockHtml(c.combo, false) + '<span class="' + P + 'ct">' + c.text + '</span>';
        return li;
      });
      radios = OPTIONS.map(function (o, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': o.key,
          'aria-label': 'Antwort ' + o.key + ': ' + comboName(o.combo),
          onclick: function () { choose(i, false); }, onkeydown: onKey
        });
        btn.innerHTML = '<span class="' + P + 'key" aria-hidden="true">' + o.key + ')</span>' + lockHtml(o.combo, true);
        return btn;
      });
      var notes_ = h('details', { class: P + 'notes' }, h('summary', null, 'Notizblock (nur für dich)'), noteTable());
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { 'aria-label': 'Hinweise' }, h('h3', null, 'Hinweise'), h('ol', { class: P + 'clues' }, clueRows)),
        h('section', { 'aria-label': 'Antwort' }, h('h3', null, 'Welche Kombination ist der Schlüssel?'),
          h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Kombinationen' }, radios), notes_)));
      refresh();
      refreshNotes();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () { return { correct: selected === RIGHT, answer: { choice: OPTIONS[selected].key } }; },
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
    reset: function () { reset(); refresh(); refreshNotes(); },
    showSolution: function () { selected = RIGHT; mark = 'solution'; locked = true; refresh(); }
  });
})();
