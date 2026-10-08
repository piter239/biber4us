/* Aufgabe Stickmuster (Biber 2022; Klasse 7-8 einfach): Welches Tastenprogramm der Stickmaschine erzeugt (wiederholt) das gezeigte Muster? */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-stickmuster22-';

  /* Tasten: p = Plus sticken, x = Kreuz (X) sticken, b = Stoff um ein Zeichen zurückschieben */
  var KEYNAME = { p: 'Plus', x: 'Kreuz', b: 'Zurück' };
  function keys(s) { return s.split(''); }
  var OPTIONS = [
    { key: 'A', prog: keys('xxxbpxpbxxx') },
    { key: 'B', prog: keys('xxxbpxx') },
    { key: 'C', prog: keys('xxxbpxpbx') },
    { key: 'D', prog: keys('pbxpbxxpbxx') }
  ];
  var RIGHT = 2;   /* C: im Heft bestätigt; per Simulation geprüft (nur C ergibt nach ganzzahlig vielen Durchläufen genau das Muster) */
  var TARGET = 'XX*X*XX*X*XX*X*XX*X*';   /* X = Kreuz, + = Plus, * = beides übereinander (Stern) */
  var EXAMPLE = keys('ppbxx');

  /* ---------- Simulation ---------- */
  function exec(st, k) {
    if (k === 'b') { st.cur--; return; }
    while (st.cells.length <= st.cur) st.cells.push({ p: false, x: false });
    st.cells[st.cur][k] = true;
    st.cur++;
  }
  function cellChar(c) { return c.p && c.x ? '*' : c.p ? '+' : c.x ? 'X' : ' '; }
  function run(prog, reps) {
    var st = { cells: [], cur: 0 };
    for (var r = 0; r < reps; r++) prog.forEach(function (k) { exec(st, k); });
    return st.cells.map(cellChar).join('');
  }
  function makesTarget(prog) {
    for (var n = 1; n <= TARGET.length; n++) if (run(prog, n) === TARGET) return true;
    return false;
  }

  /* ---------- Zeichnen ---------- */
  function keyIcon(k, extra) {
    var sym = k === 'p' ? 'M20 11V29M11 20H29' : k === 'x' ? 'M12 12L28 28M28 12L12 28' : 'M29 20H12M19 12L11 20L19 28';
    return '<svg class="' + P + 'key' + (extra ? ' ' + extra : '') + '" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle cx="20" cy="20" r="18" class="' + P + 'kc"/><path d="' + sym + '" class="' + P + 'ks"/></svg>';
  }
  function keyRow(prog, cls, hi) {
    return '<span class="' + P + 'keys ' + (cls || '') + '">' + prog.map(function (k, i) { return keyIcon(k, hi === i ? P + 'now' : (hi != null && i < hi ? P + 'done' : '')); }).join('') + '</span>';
  }
  function progText(prog) { return prog.map(function (k) { return KEYNAME[k]; }).join(', '); }
  function stitch(ch, i) {
    var x = i * 20, o = '';
    if (ch === '+' || ch === '*') o += 'M' + (x + 10) + ' 3V17M' + (x + 3) + ' 10H' + (x + 17);
    if (ch === 'X' || ch === '*') o += 'M' + (x + 4) + ' 4L' + (x + 16) + ' 16M' + (x + 16) + ' 4L' + (x + 4) + ' 16';
    return o ? '<path d="' + o + '" class="' + P + 'st"/>' : '';
  }
  function strip(pat, label, cursor, minCells) {
    var n = Math.max(pat.length, minCells || 0);
    var s = '<svg class="' + P + 'strip" viewBox="0 0 ' + n * 20 + ' 26" style="--n:' + n + '" role="img" aria-label="' + label + '"><rect width="' + n * 20 + '" height="20" rx="3" class="' + P + 'fab"/>';
    for (var i = 0; i < pat.length; i++) s += stitch(pat[i], i);
    if (cursor != null && cursor >= 0 && cursor < n) s += '<path d="M' + (cursor * 20 + 10) + ' 21L' + (cursor * 20 + 5) + ' 26H' + (cursor * 20 + 15)+ 'Z" class="' + P + 'cur"/>';
    return s + '</svg>';
  }
  function patLabel(pat) {
    return pat.split('').map(function (c) { return c === 'X' ? 'Kreuz' : c === '+' ? 'Plus' : c === '*' ? 'Stern' : 'leer'; }).join(', ');
  }
  function bigPat(pat) { return strip(pat, 'Muster: ' + patLabel(pat)); }

  var el, api, radios, selected, locked, mark, exStep, exBox;

  function reset() { selected = null; mark = null; exStep = 0; }

  /* ---------- Beispiel Schritt für Schritt ---------- */
  var exProg = EXAMPLE.concat(EXAMPLE);
  function drawExample() {
    var st = { cells: [], cur: 0 };
    for (var i = 0; i < exStep; i++) exec(st, exProg[i]);
    var pat = st.cells.map(cellChar).join('');
    var next = exStep < exProg.length ? 'Nächste Taste: ' + KEYNAME[exProg[exStep]] + '.' : 'Das Programm ist zweimal gelaufen: ' + (pat || 'leer') + '.';
    exBox.querySelector('.' + P + 'exrow').innerHTML = keyRow(exProg, '', exStep);
    exBox.querySelector('.' + P + 'exstrip').innerHTML = strip(pat, 'Stoff nach ' + exStep + ' Tasten: ' + (pat ? patLabel(pat) : 'noch leer'), st.cur, 6);
    exBox.querySelector('.' + P + 'exnote').textContent = next;
    exBox.querySelector('[data-ex="next"]').disabled = exStep >= exProg.length;
    exBox.querySelector('[data-ex="back"]').disabled = exStep <= 0;
  }

  /* ---------- Antworten ---------- */
  function refresh() {
    radios.forEach(function (btn, i) {
      var on = selected === i, ok = i === RIGHT;
      btn.setAttribute('aria-checked', String(on));
      btn.tabIndex = (selected === null ? i === 0 : on) ? 0 : -1;
      btn.setAttribute('aria-disabled', locked ? 'true' : 'false');
      btn.classList.toggle('selected', on);
      btn.classList.toggle('right', mark !== null && (on || mark === 'solution') && ok);
      btn.classList.toggle('wrong', on && mark === 'check' && !ok);
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
    var i = radios.indexOf(e.currentTarget), to = null, k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % radios.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + radios.length - 1) % radios.length;
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }

  var LEGEND =
    '<ul class="' + P + 'legend">' +
    '<li>' + keyIcon('p') + '<span>Die Stickmaschine stickt ein Plus.</span></li>' +
    '<li>' + keyIcon('x') + '<span>Die Stickmaschine stickt ein Kreuz (X).</span></li>' +
    '<li>' + keyIcon('b') + '<span>Der Stoff wird um ein Zeichen zurückgeschoben.</span></li></ul>';

  Biber.register({
    id: 'stickmuster22',
    story: '<p>Lana besitzt eine programmierbare Stickmaschine. Die Maschine kann diese zwei Zeichen sticken: ein Plus ' + strip('+', 'Plus') + ' oder ein Kreuz ' + strip('X', 'Kreuz') +
      '. Außerdem kann sie daraus ein drittes Zeichen zusammensetzen, den Stern ' + strip('*', 'Stern') + '. Dazu muss der Stoff zwischen Kreuz und Plus (oder umgekehrt) um ein Zeichen zurückgeschoben werden.</p>' +
      '<p>Lana programmiert die Stickmaschine mit diesen drei Tasten:</p>' + LEGEND +
      '<p>Die Stickmaschine führt ein Programm so oft hintereinander aus, wie Lana will. So hat Lana dieses Muster</p>' +
      '<div class="' + P + 'fig">' + bigPat('+*X+*X+*X+*X+*X+*X') + '</div>' +
      '<p>mit diesem Programm erstellt:</p><div class="' + P + 'fig">' + keyRow(EXAMPLE) + '</div>',
    question: 'Mit welchem Programm hat Lana nun dieses Muster erstellt?',
    howto: 'Wähle das Programm, das wiederholt ausgeführt das Muster ergibt. Unter dem Muster kannst du das Beispielprogramm Taste für Taste ausprobieren.',
    explanation: function () {
      var rows = OPTIONS.map(function (o) {
        var pat = run(o.prog, 1);
        return '<tr><th scope="row">' + o.key + '</th><td>' + keyRow(o.prog) + '</td><td>' + strip(pat, 'Muster von Programm ' + o.key + ': ' + patLabel(pat)) + '</td></tr>';
      }).join('');
      return '<p>Das Muster besteht aus dem Teilmuster ' + bigPat('XX*X*') + ' , das sich viermal wiederholt. Das Programm muss es mit einem Durchlauf erzeugen.</p>' +
        '<p>Ein Kreuz entsteht durch die Taste ' + keyIcon('x', P + 'inl') + '. Ein Stern entsteht durch ' + keyIcon('x', P + 'inl') + keyIcon('b', P + 'inl') + keyIcon('p', P + 'inl') + ' oder ' +
        keyIcon('p', P + 'inl') + keyIcon('b', P + 'inl') + keyIcon('x', P + 'inl') + '. Das Programm hat also die Form Kreuz, Kreuz, Stern, Kreuz, Stern. Nur <strong>C</strong> hat diese Form. Die Tabelle zeigt, was ein Durchlauf jedes Programms stickt:</p>' +
        '<div class="' + P + 'tablewrap"><table class="' + P + 'tab"><tbody>' + rows + '</tbody></table></div>' +
        '<p>Die Stickmaschine kennt nur drei Anweisungen und führt eine Folge davon aus, das Programm. Dass sie ein Programm wiederholt, ist eine einfache Wiederholungsanweisung. Auch Computer arbeiten Anweisungen nacheinander ab. ' +
        'Höhere Programmiersprachen haben zusätzlich bedingte Anweisungen und Wiederholungen, damit man Programme leichter schreiben und verstehen kann.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      var target = h('div', { class: P + 'fig ' + P + 'target' });
      target.innerHTML = bigPat(TARGET);
      radios = OPTIONS.map(function (o, i) {
        var b = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': o.key,
          'aria-label': 'Programm ' + o.key + ': ' + progText(o.prog),
          onclick: function () { choose(i); }, onkeydown: onKey
        }, h('span', { class: P + 'letter' }, o.key));
        var k = h('span', { class: P + 'prog' });
        k.innerHTML = keyRow(o.prog);
        b.appendChild(k);
        return b;
      });
      exBox = h('details', { class: P + 'ex' },
        h('summary', null, 'Beispielprogramm ausprobieren'),
        h('div', { class: P + 'exin' },
          h('div', { class: P + 'exrow' }),
          h('div', { class: P + 'exstrip' }),
          h('p', { class: P + 'exnote', 'aria-live': 'polite' }),
          h('div', { class: P + 'exbtns' },
            h('button', { type: 'button', class: P + 'btn', 'data-ex': 'next', onclick: function () { if (exStep < exProg.length) { exStep++; drawExample(); } } }, 'Nächste Taste'),
            h('button', { type: 'button', class: P + 'btn', 'data-ex': 'back', onclick: function () { if (exStep > 0) { exStep--; drawExample(); } } }, 'Eine zurück'))));
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { 'aria-label': 'Muster' }, h('h3', null, 'Dieses Muster soll entstehen'), target),
        exBox,
        h('section', { 'aria-label': 'Programme' }, h('h3', null, 'Programme'), h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Programme A bis D' }, radios))));
      drawExample();
      refresh();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () { return { correct: selected === RIGHT, answer: selected }; },
    setAnswer: function (ans) { selected = typeof ans === 'number' ? ans : null; mark = 'check'; refresh(); },
    lock: function (on) { locked = on; mark = on ? 'check' : null; refresh(); },
    reset: function () { reset(); drawExample(); refresh(); },
    showSolution: function () { selected = RIGHT; mark = 'solution'; locked = true; refresh(); }
  });
  Biber.modules.stickmuster22._check = function () { return OPTIONS.map(function (o) { return [o.key, run(o.prog, 1), makesTarget(o.prog)]; }); };   /* nur für den Skripttest */
})();
