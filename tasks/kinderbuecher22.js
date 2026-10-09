/* Aufgabe Kinder lieben Bücher (Biber 2022; Klasse 3-4 einfach, 5-6 einfach): in einer Ausleihtabelle das am häufigsten geliehene Buch finden */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-kinderbuecher22-';

  /* ---------- Daten (Tabelle aus dem Heft, S. 35) ---------- */
  var KIDS = {
    stern:  { name: 'Kind mit Stern', desc: 'das Kind mit dem Stern auf dem lila Shirt', shirt: '#7e57c2', skin: '#f1c9a5', hair: '#6d4c41', icon: 'stern' },
    ball:   { name: 'Kind mit Basketball', desc: 'das Kind mit dem Basketball auf dem grünen Shirt', shirt: '#43a047', skin: '#f6d2a0', hair: '#f2a93b', icon: 'ball' },
    auto:   { name: 'Kind mit Auto', desc: 'das Kind mit dem Auto auf dem gelben Shirt', shirt: '#fbc02d', skin: '#8d5a3b', hair: '#3e2723', icon: 'auto' }
  };
  var BOOKS = [
    { id: 'hinkelstein', name: 'Buch mit dem Hinkelstein', short: 'Hinkelstein' },
    { id: 'drache', name: 'Buch mit dem Drachen', short: 'Drachen' },
    { id: 'lupe', name: 'Buch mit der Lupe', short: 'Lupe' },
    { id: 'rakete', name: 'Buch mit der Rakete', short: 'Rakete' }
  ];
  var LOANS = [   /* [Kind, Buch], von oben nach unten */
    ['stern', 'rakete'], ['ball', 'lupe'], ['ball', 'rakete'], ['auto', 'drache'],
    ['stern', 'hinkelstein'], ['auto', 'rakete'], ['ball', 'drache']
  ];
  var RIGHT = 'rakete';   /* Heft: Rakete 3x, Drache 2x, Lupe 1x, Hinkelstein 1x; per Skript nachgezählt */
  function count(id) { return LOANS.filter(function (l) { return l[1] === id; }).length; }

  /* ---------- Bildchen (viewBox 0 0 48 48) ---------- */
  function starPath() {
    var pts = [], i, a, r;
    for (i = 0; i < 10; i++) {
      a = -Math.PI / 2 + i * Math.PI / 5; r = i % 2 ? 8.5 : 20;
      pts.push((24 + r * Math.cos(a)).toFixed(1) + ',' + (25 + r * Math.sin(a)).toFixed(1));
    }
    return pts.join(' ');
  }
  var ICONS = {
    stern: '<polygon points="' + starPath() + '" fill="#fff8e1" stroke="#6a4c93" stroke-width="2.5" stroke-linejoin="round"/>',
    ball: '<circle cx="24" cy="24" r="19" fill="#f28c1e" stroke="#7a3d05" stroke-width="2"/>' +
      '<path d="M24 5V43M5 24H43M10 9Q21 24 10 39M38 9Q27 24 38 39" fill="none" stroke="#7a3d05" stroke-width="2"/>',
    auto: '<path d="M4 31L7 22Q9 17 14 17H34Q39 17 41 22L44 31V36H4Z" fill="#d32f2f" stroke="#7f1313" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M11 22L13 19H23V22ZM26 22V19H35L37 22Z" fill="#bbdefb"/>' +
      '<circle cx="14" cy="36" r="5" fill="#263238" stroke="#cfd8dc" stroke-width="1.5"/><circle cx="34" cy="36" r="5" fill="#263238" stroke="#cfd8dc" stroke-width="1.5"/>',
    rakete: '<path d="M16 30L7 41L16 38ZM32 30L41 41L32 38Z" fill="#d32f2f" stroke="#7f1313" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<path d="M20 38L24 47L28 38Z" fill="#ffb300" stroke="#e65100" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<path d="M24 3Q33 13 32 30V38H16V30Q15 13 24 3Z" fill="#fafafa" stroke="#7f1313" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M24 3Q29 8 30.500 15H17.500Q19 8 24 3Z" fill="#d32f2f"/>' +
      '<rect x="16.500" y="30" width="5.500" height="5" fill="#d32f2f"/><rect x="26" y="30" width="5.500" height="5" fill="#d32f2f"/><rect x="21.500" y="34.500" width="5" height="3.500" fill="#d32f2f"/>' +
      '<circle cx="24" cy="22" r="4.500" fill="#1976d2" stroke="#0d3c73" stroke-width="1.500"/>',
    lupe: '<path d="M30 30L42 42" stroke="#b71c1c" stroke-width="6.500" stroke-linecap="round"/>' +
      '<circle cx="20" cy="20" r="13" fill="#90caf9" stroke="#1a237e" stroke-width="3.500"/><path d="M13 18Q15 12 21 12" fill="none" stroke="#fff" stroke-width="2.500" stroke-linecap="round"/>',
    drache: '<path d="M11 36Q3 38 4 28Q5 22 10 22" fill="none" stroke="#2e7d32" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M15 29L7 9L18 16L22 3L29 15L32 29Z" fill="#fb8c00" stroke="#a04f00" stroke-width="1.500" stroke-linejoin="round"/>' +
      '<path d="M29 31Q36 28 35 19" fill="none" stroke="#2e7d32" stroke-width="7" stroke-linecap="round"/>' +
      '<ellipse cx="21" cy="34" rx="14" ry="8" fill="#43a047" stroke="#1b5e20" stroke-width="2"/>' +
      '<path d="M15 40V45M27 40V45" stroke="#2e7d32" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M30 14Q31 7 38 8L46 11L45 17Q41 20 34 19Z" fill="#43a047" stroke="#1b5e20" stroke-width="2" stroke-linejoin="round"/>' +
      '<circle cx="38" cy="12" r="1.800" fill="#fff"/><circle cx="38.500" cy="12" r="0.900" fill="#000"/><path d="M33 8L32 3L37 7Z" fill="#fb8c00"/>',
    hinkelstein: '<ellipse cx="24" cy="42" rx="21" ry="5" fill="#5da24a"/>' +
      '<path d="M24 5Q34 9 33 30Q32 42 24 42Q16 42 15 30Q14 9 24 5Z" fill="#9a9ca2" stroke="#4b4d52" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M20 14Q21 10 24 9" fill="none" stroke="#d5d7db" stroke-width="2" stroke-linecap="round"/>'
  };
  function icon(name, extra) {
    return '<svg class="' + P + 'ico" viewBox="0 0 48 48" aria-hidden="true"' + (extra || '') + '>' + ICONS[name] + '</svg>';
  }

  /* Buchdeckel (viewBox 0 0 60 78) */
  var COVER = {
    hinkelstein: '<rect x="4" y="3" width="52" height="38" fill="#5fb4e8"/><rect x="4" y="41" width="52" height="34" fill="#4aa047"/>',
    drache: '<rect x="4" y="3" width="52" height="72" fill="#1e88e5"/><rect x="4" y="3" width="52" height="9" fill="#0d47a1"/>',
    lupe: '<rect x="4" y="3" width="52" height="72" fill="#2c2e36"/><rect x="38" y="6" width="3" height="3" fill="#e53935"/><rect x="43" y="6" width="3" height="3" fill="#fff"/>',
    rakete: '<rect x="4" y="3" width="52" height="72" fill="#fb8c00"/><rect x="4" y="3" width="52" height="16" fill="#1b1b2f"/><circle cx="47" cy="11" r="3" fill="#42a5f5"/>'
  };
  function cover(id) {
    return '<svg class="' + P + 'cover" viewBox="0 0 60 78" aria-hidden="true">' +
      '<rect x="4" y="3" width="52" height="72" rx="3" fill="#000" opacity="0.18" transform="translate(2 2)"/>' +
      COVER[id] +
      '<svg x="11" y="22" width="40" height="40" viewBox="0 0 48 48">' + ICONS[id === 'rakete' ? 'rakete' : id] + '</svg>' +
      '<rect x="4" y="3" width="6" height="72" fill="#000" opacity="0.22"/>' +
      '<rect x="4" y="3" width="52" height="72" rx="3" fill="none" stroke="#1d1d22" stroke-width="1.500"/></svg>';
  }
  function kidSvg(k) {
    var d = KIDS[k];
    return '<svg class="' + P + 'kid" viewBox="0 0 60 72" aria-hidden="true">' +
      '<path d="M12 72V56Q12 46 30 46Q48 46 48 56V72Z" fill="' + d.shirt + '" stroke="#2b2b2b" stroke-width="1.500"/>' +
      '<circle cx="30" cy="27" r="14" fill="' + d.skin + '" stroke="#2b2b2b" stroke-width="1.500"/>' +
      '<path d="M16 26Q16 11 30 11Q44 11 44 26Q38 19 30 19Q22 19 16 26Z" fill="' + d.hair + '"/>' +
      '<circle cx="25" cy="29" r="1.600" fill="#2b2b2b"/><circle cx="35" cy="29" r="1.600" fill="#2b2b2b"/><path d="M25 34Q30 38 35 34" fill="none" stroke="#2b2b2b" stroke-width="1.500" stroke-linecap="round"/>' +
      '<svg x="21" y="49" width="18" height="18" viewBox="0 0 48 48">' + ICONS[d.icon] + '</svg></svg>';
  }
  var HEAD_PERSON = '<svg class="' + P + 'hico" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="14" r="9" fill="#9aa5ab"/><path d="M8 44Q8 27 24 27Q40 27 40 44Z" fill="#9aa5ab"/></svg>';
  var HEAD_BOOK = '<svg class="' + P + 'hico" viewBox="0 0 48 48" aria-hidden="true"><rect x="9" y="4" width="30" height="40" rx="3" fill="#9aa5ab"/><rect x="9" y="4" width="5" height="40" fill="#6f7b82"/></svg>';

  /* ---------- Zustand und Anzeige ---------- */
  var el, api, radios, rows, selected, locked, mark, counts;

  function reset() { selected = null; mark = null; }

  function choose(id, focus) {
    if (locked) return;
    selected = id;
    refresh();
    if (focus) radios[BOOKS.map(function (b) { return b.id; }).indexOf(id)].focus();
    api.changed();
  }
  function refresh() {
    radios.forEach(function (btn, i) {
      var b = BOOKS[i], on = selected === b.id, ok = b.id === RIGHT;
      btn.setAttribute('aria-checked', String(on));
      btn.tabIndex = (selected === null ? i === 0 : on) ? 0 : -1;
      btn.setAttribute('aria-disabled', locked ? 'true' : 'false');
      btn.classList.toggle('selected', on);
      btn.classList.toggle('right', on && mark !== null && ok);
      btn.classList.toggle('wrong', on && mark === 'check' && !ok);
      var m = btn.querySelector('.' + P + 'mark');
      if (m) m.remove();
      if (on && mark !== null) btn.appendChild(h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
      counts[i].textContent = mark !== null ? count(b.id) + '×' : '';
      counts[i].hidden = mark === null;
    });
    rows.forEach(function (tr, i) { tr.classList.toggle('hl', selected !== null && LOANS[i][1] === selected); });
    live.textContent = selected === null ? '' : (BOOKS.filter(function (b) { return b.id === selected; })[0].name + ' ist in der Tabelle markiert.');
  }
  var live;
  function onKey(e) {
    var k = e.key, i = radios.indexOf(e.currentTarget), to = null;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % radios.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + radios.length - 1) % radios.length;
    else if (k === ' ' || k === 'Enter') { e.preventDefault(); choose(BOOKS[i].id, true); return; }
    if (to === null) return;
    e.preventDefault();
    choose(BOOKS[to].id, true);
  }

  Biber.register({
    id: 'kinderbuecher22',
    story:
      '<p>Die Kinder leihen in der Bibliothek Bücher aus. Die Bibliothek schreibt in einer Tabelle auf, wer welches Buch ausgeliehen hat.</p>',
    question: 'Welches Buch haben die Kinder am häufigsten ausgeliehen?',
    howto: 'Jede Zeile der Tabelle ist eine Ausleihe. Tippe auf das Buch, das du für das häufigste hältst. In der Tabelle siehst du dann, wo es vorkommt.',
    explanation: function () {
      return '<p>Jede Zeile der Tabelle ist eine Ausleihe: ein Kind und das Buch, das es geliehen hat. Zum Beantworten genügt es, bei den Büchern nachzuzählen: Das Buch mit der <strong>Rakete</strong> kommt dreimal vor, das mit dem Drachen zweimal, die Bücher mit Lupe und Hinkelstein je einmal. ' +
        'Also ist die Rakete das am häufigsten ausgeliehene Buch.</p>' +
        '<p>Computer können mit Tabellen sehr gut arbeiten, mit Bildern aus Linien dagegen nicht. Deshalb speichert man Beziehungen (Relationen) wie „Kind leiht Buch aus“ in Tabellen. Auf solchen Tabellen beruhen die relationalen Datenbanken.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      var kids = h('div', { class: P + 'kids', role: 'group', 'aria-label': 'Die drei Kinder' },
        Object.keys(KIDS).map(function (k) {
          var f = h('div', { class: P + 'kidbox', role: 'img', 'aria-label': KIDS[k].desc });
          f.innerHTML = kidSvg(k);
          return f;
        }));
      var thead = h('thead', null, h('tr', null,
        h('th', { scope: 'col', 'aria-label': 'Kind' }), h('th', { scope: 'col', 'aria-label': 'Buch' })));
      thead.rows[0].cells[0].innerHTML = HEAD_PERSON;
      thead.rows[0].cells[1].innerHTML = HEAD_BOOK;
      var tbody = h('tbody');
      rows = LOANS.map(function (l, i) {
        var td1 = h('td', { 'aria-label': KIDS[l[0]].name }), td2 = h('td', { 'aria-label': BOOKS.filter(function (b) { return b.id === l[1]; })[0].name });
        td1.innerHTML = icon(l[0]);
        td2.innerHTML = icon(l[1]);
        var tr = h('tr', null, td1, td2);
        tr.setAttribute('aria-label', 'Ausleihe ' + (i + 1) + ': ' + KIDS[l[0]].name + ', ' + td2.getAttribute('aria-label'));
        tbody.appendChild(tr);
        return tr;
      });
      var table = h('table', { class: P + 'table', 'aria-label': 'Ausleihtabelle: 7 Ausleihen mit Kind und Buch' }, thead, tbody);
      counts = [];
      radios = BOOKS.map(function (b, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-book': b.id, 'aria-label': b.name,
          onclick: function () { choose(b.id, false); }, onkeydown: onKey
        });
        btn.innerHTML = cover(b.id);
        var cnt = h('span', { class: P + 'count', hidden: true, 'aria-hidden': 'true' });
        counts.push(cnt);
        btn.appendChild(cnt);
        return btn;
      });
      live = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { 'aria-label': 'Ausleihtabelle', class: P + 'left' }, h('h3', null, 'Ausleihtabelle'), table),
        h('section', { 'aria-label': 'Kinder und Bücher', class: P + 'right' },
          h('h3', null, 'Die Kinder'), kids,
          h('h3', null, 'Welches Buch?'),
          h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Die vier Bücher' }, radios),
          live)));
      refresh();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () {
      return { correct: selected === RIGHT, answer: { choice: selected } };
    },
    setAnswer: function (ans) {
      var ok = ans && BOOKS.some(function (b) { return b.id === ans.choice; });
      selected = ok ? ans.choice : null;
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      refresh();
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () { selected = RIGHT; mark = 'solution'; locked = true; refresh(); }
  });
})();
