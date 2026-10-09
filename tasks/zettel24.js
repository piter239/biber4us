/* Aufgabe Zettel (Biber 2024; Klasse 9-10 einfach, 11-13 einfach): Peer-to-Peer, drei Kopien derselben Daten vergleichen */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-zettel24-';

  /* Einträge: [wer, wem, wie viele] in der Reihenfolge auf dem Zettel (Heft S. 77) */
  var NOTES = [
    { who: 'Tim', rows: [['Tim', 'Anna', 2], ['Ben', 'Tim', 1], ['Ben', 'Anna', 3], ['Anna', 'Tim', 2]] },
    { who: 'Anna', rows: [['Tim', 'Anna', 2], ['Ben', 'Tim', 1], ['Tim', 'Anna', 3], ['Anna', 'Tim', 2]] },
    { who: 'Ben', rows: [['Tim', 'Anna', 2], ['Ben', 'Tim', 1], ['Anna', 'Tim', 2], ['Tim', 'Anna', 3]] }
  ];
  var OPTIONS = [
    { key: 'A', text: 'Anna', who: 'Anna' },
    { key: 'B', text: 'Ben', who: 'Ben' },
    { key: 'C', text: 'Tim', who: 'Tim' },
    { key: 'D', text: 'Niemand hat einen Fehler gemacht', who: null }
  ];
  var RIGHT = 2;   /* C: Tim */

  function code(r) { return r[0] + '>' + r[2] + '>' + r[1]; }
  function rowText(r) { return r[0] + ' hat ' + r[1] + ' ' + r[2] + (r[2] === 1 ? ' Murmel' : ' Murmeln') + ' ausgeliehen'; }
  function sorted(n) { return n.rows.map(code).sort().join('|'); }

  /* Lösung per Brute Force: Wessen Zettel muss der falsche sein, wenn die beiden anderen übereinstimmen
     und sich der verdächtige in genau einem Eintrag unterscheidet? */
  var SOLVED = (function () {
    var cands = [];
    NOTES.forEach(function (n, i) {
      var others = NOTES.filter(function (_, j) { return j !== i; });
      if (sorted(others[0]) !== sorted(others[1])) return;
      var ref = others[0].rows.map(code), mine = n.rows.map(code);
      var missing = ref.filter(function (c) { return mine.indexOf(c) < 0; }).length;
      var extra = mine.filter(function (c) { return ref.indexOf(c) < 0; }).length;
      if (missing === 1 && extra === 1) cands.push(n.who);
    });
    return cands;
  })();
  if (SOLVED.length !== 1 || SOLVED[0] !== OPTIONS[RIGHT].who) throw new Error('zettel24: Lösung stimmt nicht');

  var el, api, locked, selected, mark, hl, radios, noteEl, entryEls;

  function reset() { selected = null; mark = null; hl = null; }

  function countOf(c) {
    return NOTES.filter(function (n) { return n.rows.some(function (r) { return code(r) === c; }); }).length;
  }

  function noteEl_(n) {
    var rows = n.rows.map(function (r) {
      var b = h('button', { type: 'button', class: P + 'entry', 'data-code': code(r), 'aria-pressed': 'false', 'aria-label': rowText(r) + '. Antippen markiert diesen Eintrag auf allen Zetteln.' },
        h('span', { class: P + 'nm' }, r[0]),
        h('span', { class: P + 'ar', 'aria-hidden': 'true' }, h('span', { class: P + 'num' }, String(r[2])), h('span', { class: P + 'sh' }, '⇒')),
        h('span', { class: P + 'nm' }, r[1]));
      entryEls.push(b);
      return b;
    });
    return h('div', { class: P + 'sheet ' + P + 'sheet-' + n.who.toLowerCase(), role: 'group', 'aria-label': 'Zettel von ' + n.who },
      h('div', { class: P + 'owner' }, n.who), h('div', { class: P + 'rows' }, rows));
  }

  function drawHl() {
    entryEls.forEach(function (b) {
      var on = hl !== null && b.dataset.code === hl;
      b.classList.toggle('hl', on);
      b.setAttribute('aria-pressed', String(on));
    });
    if (hl === null) noteEl.textContent = 'Tipp: Tippe einen Eintrag an, dann siehst du, auf welchen Zetteln er steht.';
    else {
      var n = countOf(hl);
      noteEl.textContent = 'Dieser Eintrag steht auf ' + n + ' von 3 Zetteln.';
    }
  }

  function refresh() {
    radios.forEach(function (btn, i) {
      var on = selected === i, ok = i === RIGHT;
      btn.setAttribute('aria-checked', String(on));
      btn.tabIndex = (selected === null ? i === 0 : on) ? 0 : -1;
      btn.classList.toggle('selected', on);
      btn.classList.toggle('right', mark !== null && on && ok);
      btn.classList.toggle('wrong', mark === 'check' && on && !ok);
      btn.classList.toggle('answer', mark === 'solution' && ok);
      btn.disabled = locked;
      var m = btn.querySelector('.' + P + 'mark');
      if (m) m.remove();
      if (mark !== null && ((on && mark === 'check') || (ok && mark === 'solution'))) btn.appendChild(h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
    });
  }
  function choose(i, focus) {
    if (locked) return;
    selected = i;
    refresh();
    if (focus) radios[i].focus();
    api.changed();
  }
  function onKey(e) {
    var i = radios.indexOf(e.currentTarget), to = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = (i + 1) % radios.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = (i + radios.length - 1) % radios.length;
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }

  Biber.register({
    id: 'zettel24',
    story:
      '<p>Anna, Ben und Tim leihen sich ab und zu Murmeln untereinander aus. Zur Sicherheit trägt jeder auf einem eigenen Zettel ein, wer wem wie viele Murmeln ausgeliehen hat. ' +
      'Der Eintrag „Tim ⇒ Anna“ mit der Zahl 2 heißt: Tim hat Anna 2 Murmeln ausgeliehen.</p>' +
      '<p>Nach einer Woche vergleichen die drei Freunde ihre Zettel. Sie haben den Verdacht, dass ein Fehler passiert ist: Auf genau einem Zettel scheint ein Eintrag falsch zu sein.</p>',
    question: 'Wenn ja, wer hat den Fehler gemacht?',
    howto: 'Vergleiche die drei Zettel. Tippst du einen Eintrag an, wird er auf allen Zetteln markiert. Wähle dann eine Antwort.',
    explanation: function () {
      return '<p>Hätte niemand einen Fehler gemacht, müssten auf allen drei Zetteln dieselben Einträge stehen. Drei Einträge (Tim ⇒ Anna 2, Ben ⇒ Tim 1, Anna ⇒ Tim 2) stehen tatsächlich auf allen Zetteln. ' +
        'Nur beim vierten Eintrag gibt es einen Unterschied: Auf Annas und Bens Zettel steht „Tim ⇒ Anna 3“, nur auf Tims Zettel steht dafür „Ben ⇒ Anna 3“.</p>' +
        '<p>Weil nur ein Zettel einen falschen Eintrag haben soll, hat <strong>Tim</strong> den Fehler gemacht (Antwort C): Zwei Zettel stimmen überein, der dritte weicht ab.</p>' +
        '<p><strong>Informatik:</strong> Jedes Kind führt seine eigene Datenbank, und alle sollen denselben Inhalt haben. Das ist ein Beispiel für ein <em>Peer-to-Peer-Netzwerk</em>: Alle Teilnehmer („Peers“) haben gleiche Rechte und Pflichten, und es gibt keine zentrale Stelle. ' +
        'Bei Unstimmigkeiten stimmen die Peers ab, welche Kopie stimmt. Das klappt nur, wenn die meisten ehrlich sind. Hier würden Anna und Ben die Abstimmung gewinnen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset(); entryEls = [];
      noteEl = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      var sheets = h('div', { class: P + 'sheets' }, NOTES.map(noteEl_));
      sheets.addEventListener('click', function (e) {
        var b = e.target.closest('[data-code]');
        if (!b) return;
        hl = hl === b.dataset.code ? null : b.dataset.code;
        drawHl();
      });
      radios = OPTIONS.map(function (o, i) {
        var btn = h('button', { type: 'button', role: 'radio', class: P + 'opt', 'data-opt': o.key, 'aria-checked': 'false', 'aria-label': 'Antwort ' + o.key + ': ' + o.text },
          h('span', { class: P + 'key', 'aria-hidden': 'true' }, o.key + ')'), h('span', { class: P + 'txt' }, o.text));
        btn.addEventListener('click', function () { choose(i, false); });
        btn.addEventListener('keydown', onKey);
        return btn;
      });
      el.replaceChildren(h('div', { class: P + 'board' }, sheets, noteEl, h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Wer hat den Fehler gemacht?' }, radios)));
      refresh(); drawHl();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () { return { correct: selected === RIGHT, answer: selected }; },
    setAnswer: function (ans) { selected = typeof ans === 'number' ? ans : null; mark = 'check'; refresh(); },
    lock: function (on) {
      locked = on; mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      if (on && selected === null) mark = 'solution';
      refresh();
    },
    reset: function () { reset(); refresh(); drawHl(); },
    showSolution: function () {
      selected = RIGHT; mark = 'solution'; locked = true; refresh();
      hl = 'Ben>3>Anna'; drawHl();
    }
  });
})();
