/* Aufgabe Geheime Nachrichten (Heft 2016, S. 31; Klasse 5-6 schwer, 9-10 einfach): Kryptologie, Transposition.
   Lösung laut Heft: Antwort B (OKICHWERDEDORTSEIN). Selbstprüfung beim Laden: das Verfahren erzeugt Boris' Nachricht aus dem Beispiel,
   und nur Antwort B ergibt Bertas geheime Nachricht. */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-geheimenachrichten16-';

  var COLS = 4, ROWS = 5;
  var BORIS_TEXT = 'TREFFENMITBILLYUM6';
  var BORIS_SECRET = 'TFILMRETL6ENBY#FMIU#';
  var BERTA_SECRET = 'OHDRIKWETNIEDS#CROE#';
  var OPTIONS = ['OITDRHKNSODWIEREEC', 'OKICHWERDEDORTSEIN', 'WIRSTDUAUCHDASEIN', 'ORTDESTREFFENSISTWO'];
  var RIGHT = 1;

  /* Zeilenweise in die Tabelle schreiben (mit # auffüllen), spaltenweise auslesen */
  function table(text) {
    var s = text;
    while (s.length < COLS * ROWS) s += '#';
    var rows = [];
    for (var r = 0; r < ROWS; r++) rows.push(s.slice(r * COLS, (r + 1) * COLS).split(''));
    return rows;
  }
  function encrypt(text) {
    var t = table(text), out = '';
    for (var c = 0; c < COLS; c++) for (var r = 0; r < ROWS; r++) out += t[r][c];
    return out;
  }
  function decrypt(secret) {
    var rows = [], r, c;
    for (r = 0; r < ROWS; r++) rows.push([]);
    for (c = 0; c < COLS; c++) for (r = 0; r < ROWS; r++) rows[r][c] = secret.charAt(c * ROWS + r);
    return rows;
  }
  function flat(rows) { return rows.map(function (r) { return r.join(''); }).join(''); }

  if (encrypt(BORIS_TEXT) !== BORIS_SECRET) throw new Error('geheimenachrichten16: Beispiel stimmt nicht');
  var BERTA_ROWS = decrypt(BERTA_SECRET);
  var BERTA_PLAIN = flat(BERTA_ROWS).replace(/#+$/, '');
  OPTIONS.forEach(function (o, i) {
    if ((encrypt(o) === BERTA_SECRET) !== (i === RIGHT)) throw new Error('geheimenachrichten16: Lösung stimmt nicht');
  });
  if (BERTA_PLAIN !== OPTIONS[RIGHT]) throw new Error('geheimenachrichten16: Entschlüsselung stimmt nicht');

  function gridHtml(rows, cls) {
    return '<table class="' + P + 'grid ' + (cls || '') + '"><tbody>' + rows.map(function (r) {
      return '<tr>' + r.map(function (ch) { return '<td>' + ch + '</td>'; }).join('') + '</tr>';
    }).join('') + '</tbody></table>';
  }
  function html(s) { var d = document.createElement('div'); d.innerHTML = s; return d.firstChild; }

  var el, api, optsEl, notesEl, locked, picked, mode;

  function optionCard(text, idx) {
    var sel = picked === idx;
    var cls = P + 'opt';
    var mark = '';
    if (mode && (mode === 'solution' ? idx === RIGHT : sel)) {
      var ok = idx === RIGHT;
      cls += ok ? ' right' : ' wrong';
      mark = ok ? '✓' : '✗';
    }
    var input = h('input', { type: 'radio', name: P + 'opt', value: String(idx), disabled: locked, 'aria-label': 'Antwort ' + 'ABCD'[idx] + ': ' + text.split('').join(' ') });
    input.checked = sel;
    return h('label', { class: cls }, input,
      h('span', { class: P + 'card' },
        h('span', { class: P + 'let' }, 'ABCD'[idx] + ')'),
        h('span', { class: P + 'val' }, text),
        mark ? h('span', { class: P + 'mark', 'aria-hidden': 'true' }, mark) : null));
  }
  function render() {
    optsEl.replaceChildren.apply(optsEl, OPTIONS.map(optionCard));
  }
  function onChange(e) {
    if (locked || !e.target.matches('input[type=radio]')) return;
    picked = +e.target.value;
    render();
    var f = optsEl.querySelector('input:checked'); if (f) f.focus();
    api.changed('Antwort ' + 'ABCD'[picked] + ' gewählt.');
  }

  /* Notizraster: leeres Raster zum eigenen Ausprobieren (nicht Teil der Antwort) */
  function buildNotes() {
    var cells = [];
    var rows = [];
    for (var r = 0; r < ROWS; r++) {
      var tds = [];
      for (var c = 0; c < COLS; c++) {
        var inp = h('input', { type: 'text', maxlength: '1', class: P + 'cell', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false',
          'aria-label': 'Notizraster, Zeile ' + (r + 1) + ', Spalte ' + (c + 1), 'data-i': String(r * COLS + c) });
        cells.push(inp);
        tds.push(h('td', null, inp));
      }
      rows.push(h('tr', null, tds));
    }
    var tbl = h('table', { class: P + 'grid ' + P + 'notes' }, h('tbody', null, rows));
    tbl.addEventListener('input', function (e) {
      var t = e.target;
      if (!t.matches('input')) return;
      t.value = t.value.toUpperCase();
      var i = +t.dataset.i;
      if (t.value && cells[i + 1]) cells[i + 1].focus();
    });
    tbl.addEventListener('keydown', function (e) {
      var t = e.target;
      if (!t.matches('input')) return;
      var i = +t.dataset.i, to = null;
      if (e.key === 'ArrowRight') to = i + 1;
      else if (e.key === 'ArrowLeft') to = i - 1;
      else if (e.key === 'ArrowDown') to = i + COLS;
      else if (e.key === 'ArrowUp') to = i - COLS;
      else if (e.key === 'Backspace' && !t.value) to = i - 1;
      if (to !== null && cells[to]) { e.preventDefault(); cells[to].focus(); }
    });
    notesEl = { table: tbl, cells: cells };
    return h('details', { class: P + 'notes-box' },
      h('summary', null, 'Notizraster zum Ausprobieren (vier Spalten, fünf Zeilen)'),
      h('p', { class: P + 'hint' }, 'Hier kannst Du Zeichen eintragen, wie auf einem Schmierzettel. Das Raster wird nicht geprüft.'),
      tbl);
  }

  Biber.register({
    id: 'geheimenachrichten16',
    story: '<p>Boris und Berta senden sich geheime Nachrichten, die niemand außer ihnen verstehen soll.</p>' +
      '<p>Boris möchte Berta diesen Text mitteilen: <b class="' + P + 'mono">' + BORIS_TEXT + '</b></p>',
    question: 'Wie lautet Bertas Antwort?',
    howto: 'Wähle eine Antwort aus. Im Notizraster kannst Du die Nachricht auf einem Schmierzettel aufschreiben.',
    explanation: function () {
      return '<p>Um den Text zu finden, dreht man die Methode um: Man schreibt die Zeichen der geheimen Nachricht <b>Spalte für Spalte</b> von links nach rechts (in jeder Spalte von oben nach unten) in die Tabelle mit vier Spalten und fünf Zeilen. Dann liest man die Tabelle <b>Zeile für Zeile</b> wie einen normalen Text. Bertas Nachricht ergibt:</p>' +
        '<div class="' + P + 'expl">' + gridHtml(BERTA_ROWS) + '</div>' +
        '<p>Gelesen: <b class="' + P + 'mono">' + BERTA_ROWS.map(function (r) { return r.join(''); }).join('') + '</b>. Die <b>#</b> am Ende gehören nicht zur Nachricht. Bertas Antwort ist also <b class="' + P + 'mono">' + OPTIONS[RIGHT] + '</b>, das ist <b>Antwort B</b>.</p>' +
        '<p><b>Informatik:</b> Nachrichten, die über ein Computernetz gesendet werden, kann jemand abfangen. Damit nur der richtige Empfänger sie versteht, verschlüsselt man den Text und macht daraus eine geheime Nachricht. Nur wer das Verfahren kennt, kann sie wieder entschlüsseln. Hier bleiben alle Buchstaben erhalten und nur ihre Reihenfolge ändert sich; das nennt man <b>Transposition</b>. Solche Verfahren sind leicht zu knacken. Die Wissenschaft von der Verschlüsselung heißt Kryptographie. Moderne Verfahren laufen auf dem Computer: Das Verschlüsseln ist einfach, aber das Entschlüsseln ist praktisch unmöglich, wenn man nicht der gewünschte Empfänger ist.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null;
      optsEl = h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Antworten' });
      var boris = h('div', { class: P + 'boris' },
        h('div', { class: P + 'steps' },
          h('p', null, 'Boris schreibt die Zeichen des Texts nacheinander in die Felder einer Tabelle mit vier Spalten und fünf Zeilen. Dabei füllt er die Tabelle Zeile für Zeile von oben nach unten, in jeder Zeile von links nach rechts. In leere Felder am Ende der Tabelle schreibt er ein #. Das Bild zeigt das Ergebnis.'),
          h('p', null, 'Nun nimmt Boris die Zeichen aus der Tabelle, aber diesmal Spalte für Spalte von links nach rechts, aus jeder Spalte von oben nach unten. Er sendet also diese geheime Nachricht:'),
          h('p', { class: P + 'msg' }, h('span', { role: 'img', 'aria-label': BORIS_SECRET.split('').join(' ') }, BORIS_SECRET))),
        html(gridHtml(table(BORIS_TEXT), P + 'boris-grid')));
      var berta = h('div', { class: P + 'berta' },
        h('p', null, 'Berta verwendet für ihre Antwort dieselbe Methode. Sie sendet folgende geheime Nachricht an Boris:'),
        h('p', { class: P + 'msg' }, h('span', { role: 'img', 'aria-label': BERTA_SECRET.split('').join(' ') }, BERTA_SECRET)));
      el.replaceChildren(h('div', { class: P + 'box' }, boris, berta, buildNotes(), optsEl));
      optsEl.addEventListener('change', onChange);
      render();
    },
    isComplete: function () { return picked !== null; },
    evaluate: function () { return { correct: picked === RIGHT, answer: picked }; },
    setAnswer: function (ans) { picked = typeof ans === 'number' && ans >= 0 && ans < OPTIONS.length ? ans : null; mode = 'check'; render(); },
    lock: function (on) {
      locked = on;
      mode = on ? (mode || 'check') : null;
      render();
    },
    reset: function () {
      picked = null; mode = null; render();
      if (notesEl) notesEl.cells.forEach(function (c) { c.value = ''; });
    },
    showSolution: function () { picked = RIGHT; mode = 'solution'; locked = true; render(); }
  });
})();
