/* Aufgabe Anprobe (Biber 2023; Klasse 11-13 schwer): binäre Suche in zwei Dimensionen (7 x 7 Hosen, höchstens 2 Anproben) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-anprobe23-';

  var N = 7;
  var ANSWER = 2;   /* Heft: "2 ist die richtige Antwort"; per Skript (Minimax über alle Rechtecke) bestätigt */
  var MID = 3;

  /* ---------- Hosen zeichnen: Zeile = Länge (oben lang), Spalte = Breite (links schmal) ---------- */
  function pantsSvg(r, c) {
    var W = 13 + 4.3 * c, L = 40 - 4.3 * r, x0 = 24 - W / 2, x1 = 24 + W / 2, y0 = 24 - L / 2, yb = y0 + L, yc = y0 + L * 0.38, g = 1.3;
    var d = 'M' + x0 + ' ' + y0 + ' H' + x1 + ' V' + yb + ' H' + (24 + g) + ' V' + yc + ' H' + (24 - g) + ' V' + yb + ' H' + x0 + ' Z';
    return '<svg viewBox="0 0 48 48" aria-hidden="true"><path class="' + P + 'pants" d="' + d + '"/><rect class="' + P + 'belt" x="' + x0 + '" y="' + y0 + '" width="' + W + '" height="3"/></svg>';
  }
  function region(r, c) {
    var rr = r < MID ? 0 : r === MID ? 1 : 2, cc = c < MID ? 0 : c === MID ? 1 : 2;
    return [[1, 2, 3], [4, 0, 5], [6, 7, 8]][rr][cc];   /* 0 = Mitte (Position +) */
  }
  function isRegionCenter(r, c) { return (r === 1 || r === 3 || r === 5) && (c === 1 || c === 3 || c === 5); }
  function cellName(r, c) { return 'Länge ' + (r + 1) + ' von 7 (' + (r === 0 ? 'am längsten' : r === N - 1 ? 'am kürzesten' : 'von lang nach kurz') + '), Breite ' + (c + 1) + ' von 7'; }

  /* ---------- Zustand ---------- */
  var el, api, locked, mark, cells, target, tries, lo, input, feedEl, countEl, focusPos, newBtn, wrapEl;

  function newGame() {
    target = { r: Math.floor(Math.random() * N), c: Math.floor(Math.random() * N) };
    tries = [];
    lo = { r0: 0, r1: N - 1, c0: 0, c1: N - 1 };
  }
  function reset() { mark = null; newGame(); }

  function tryOn(r, c) {
    if (locked || mark !== null) return;
    if (tries.some(function (t) { return t.r === r && t.c === c; })) { feedEl.textContent = 'Diese Hose hast du schon anprobiert.'; return; }
    if (found()) return;
    var t = { r: r, c: c };
    tries.push(t);
    var dr = target.r - r, dc = target.c - c;   /* dr > 0: die gesuchte Hose ist kürzer */
    if (dr > 0) lo.r0 = Math.max(lo.r0, r + 1); else if (dr < 0) lo.r1 = Math.min(lo.r1, r - 1); else lo.r0 = lo.r1 = r;
    if (dc > 0) lo.c0 = Math.max(lo.c0, c + 1); else if (dc < 0) lo.c1 = Math.min(lo.c1, c - 1); else lo.c0 = lo.c1 = c;
    var msg;
    if (!dr && !dc) msg = 'Die Hose passt! Gefunden nach ' + tries.length + (tries.length === 1 ? ' Anprobe.' : ' Anproben.');
    else {
      var parts = [];
      if (dr) parts.push(dr > 0 ? 'kürzere' : 'längere');
      if (dc) parts.push(dc > 0 ? 'breitere' : 'schmalere');
      msg = 'Anprobe ' + tries.length + ': Die Hose passt noch nicht. Du brauchst eine ' + parts.join(' und ') + ' Hose' + (!dr ? ' (die Länge stimmt).' : !dc ? ' (die Breite stimmt).' : '.');
      if (lo.r0 === lo.r1 && lo.c0 === lo.c1) msg += ' Es ist nur noch eine Größe möglich: Jetzt weißt du, welche es ist.';
    }
    focusPos = { r: r, c: c };
    refresh();
    feedEl.textContent = msg;
  }
  function found() { return tries.some(function (t) { return t.r === target.r && t.c === target.c; }); }

  function refresh() {
    var over = mark !== null;
    cells.forEach(function (b) {
      var r = +b.dataset.r, c = +b.dataset.c, tryIdx = -1;
      tries.forEach(function (t, i) { if (t.r === r && t.c === c) tryIdx = i; });
      var inside = r >= lo.r0 && r <= lo.r1 && c >= lo.c0 && c <= lo.c1;
      var done = !over && found();
      b.classList.toggle('out', !over && !inside && tryIdx < 0);
      b.classList.toggle('tried', !over && tryIdx >= 0);
      b.classList.toggle('hit', !over && tryIdx >= 0 && r === target.r && c === target.c);
      b.classList.toggle('reg', over && isRegionCenter(r, c));
      b.classList.toggle('mid', over && r === MID && c === MID);
      b.disabled = over || done;
      var num = b.querySelector('.' + P + 'badge'), txt = b.querySelector('.' + P + 'rtxt');
      if (num) num.remove();
      if (txt) txt.remove();
      if (!over && tryIdx >= 0) b.appendChild(h('span', { class: P + 'badge', 'aria-hidden': 'true' }, String(tryIdx + 1)));
      if (over && (isRegionCenter(r, c) || (r === MID && c === MID))) b.appendChild(h('span', { class: P + 'rtxt', 'aria-hidden': 'true' }, r === MID && c === MID ? '+' : String(region(r, c))));
      var label = 'Hose, ' + cellName(r, c);
      if (over) label += isRegionCenter(r, c) ? '. Mitte von Bereich ' + region(r, c) : r === MID && c === MID ? '. Hier probiert Christian zuerst an (Position +)' : '. Bereich ' + (region(r, c) || 'Mitte');
      else if (tryIdx >= 0) label += '. Anprobe ' + (tryIdx + 1);
      else if (!inside) label += '. Kann nicht mehr die gesuchte Hose sein';
      else label += '. Antippen zum Anprobieren';
      b.setAttribute('aria-label', label);
      b.tabIndex = focusPos && focusPos.r === r && focusPos.c === c ? 0 : -1;
    });
    countEl.textContent = over ? '' : 'Anproben: ' + tries.length;
    if (over) feedEl.textContent = 'Nummeriert sind die acht Bereiche rund um die Mitte (+).';
    else if (!tries.length) feedEl.textContent = 'Zum Ausprobieren: Eine Hose ist für Christian die richtige, du weißt nicht welche. Tippe eine Hose an, um sie anzuprobieren. Grau werden Hosen, die nicht mehr passen können.';
    wrapEl.classList.toggle(P + 'over', over);
    if (input) {
      input.disabled = locked;
      input.classList.toggle('right', mark !== null && value() === ANSWER);
      input.classList.toggle('wrong', mark === 'check' && value() !== ANSWER);
    }
  }
  function value() {
    var s = (input.value || '').trim();
    return /^\d+$/.test(s) ? parseInt(s, 10) : null;
  }
  function onKey(e) {
    var b = e.target.closest('[data-r]');
    if (!b) return;
    var r = +b.dataset.r, c = +b.dataset.c, k = e.key;
    if (k === 'ArrowRight') c = Math.min(N - 1, c + 1);
    else if (k === 'ArrowLeft') c = Math.max(0, c - 1);
    else if (k === 'ArrowDown') r = Math.min(N - 1, r + 1);
    else if (k === 'ArrowUp') r = Math.max(0, r - 1);
    else return;
    e.preventDefault();
    focusPos = { r: r, c: c };
    cells.forEach(function (x) { x.tabIndex = +x.dataset.r === r && +x.dataset.c === c ? 0 : -1; });
    cells[r * N + c].focus();
  }

  Biber.register({
    id: 'anprobe23',
    story:
      '<p>Christian braucht neue Hosen. Im Geschäft gibt es seine Lieblings-Hose in <strong>sieben Längen und sieben Breiten</strong>. Hosen in allen 49 Größen sind im Regal, nach Länge und Breite sortiert.</p>' +
      '<p>Weil Christian seine richtige Größe nicht weiß, muss er sie durch Anprobieren herausfinden. Bei jeder Anprobe merkt er, ob die Hose passt oder ob er eine kürzere, längere, schmalere oder breitere Hose braucht. Damit eine Hose passt, müssen Länge und Breite stimmen.</p>' +
      '<p>Der Verkäufer stöhnt: Bei 49 Größen die richtige zu finden, das kann dauern. Doch Christian ist eine Methode eingefallen, die richtige Größe in jedem Fall nach möglichst wenigen Anproben zu wissen.</p>',
    question: 'Wie viele Anproben braucht er mit dieser Methode höchstens, bis er die richtige Größe weiß?',
    howto: 'Schreibe die Zahl unter das Regal. Im Regal kannst du vorher selbst anprobieren: Die Hose, die für Christian passt, ist versteckt. Mit „Neue Hose“ versteckst du sie neu.',
    explanation: function () {
      return '<p>Christian probiert zuerst die Hose in der <strong>Mitte</strong> des Regals an (Position +). Danach weiß er, in welchem der <strong>acht Bereiche</strong> um die Mitte die passende Hose liegt (zu kurz oder zu lang, zu schmal oder zu breit). Oder die Hose passt sofort.</p>' +
        '<p>In jedem Bereich probiert er wieder die Hose in der Mitte an. Weil dort das mittlere Fach in jeder Richtung nur ein Nachbarfach hat, weiß er danach die richtige Größe. Er braucht also <strong>höchstens 2 Anproben</strong>. Mit nur einer Anprobe geht es nicht, denn sie kann höchstens 9 verschiedene Antworten liefern, es gibt aber 49 Größen.</p>' +
        '<p>Diese Methode heißt <em>binäre Suche</em>: Man vergleicht mit der Mitte und halbiert so den Suchraum. Weil die Hosen hier in zwei Richtungen sortiert sind (Länge und Breite), kann man in beiden Richtungen gleichzeitig halbieren. Bei 1.000 Objekten braucht man so etwa 10 Schritte, bei einer Million etwa 20.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset(); focusPos = { r: MID, c: MID };
      cells = [];
      var r, c;
      for (r = 0; r < N; r++) for (c = 0; c < N; c++) {
        var b = h('button', { type: 'button', class: P + 'cell ' + ((r + c) % 2 ? 'b' : 'a'), 'data-r': String(r), 'data-c': String(c), onclick: (function (rr, cc) { return function () { focusPos = { r: rr, c: cc }; tryOn(rr, cc); }; })(r, c) });
        b.innerHTML = pantsSvg(r, c);
        cells.push(b);
      }
      var grid = h('div', { class: P + 'grid', role: 'group', 'aria-label': 'Regal mit 49 Hosen: sieben Längen (Zeilen, oben lang) und sieben Breiten (Spalten, links schmal)', onkeydown: onKey }, cells);
      feedEl = h('p', { class: P + 'feed', role: 'status', 'aria-live': 'polite' });
      countEl = h('span', { class: P + 'count', 'aria-hidden': 'true' });
      newBtn = h('button', { type: 'button', class: 'btn ghost ' + P + 'new', onclick: function () { if (mark !== null) return; newGame(); focusPos = { r: MID, c: MID }; refresh(); feedEl.textContent = 'Eine neue Hose ist versteckt. Probiere sie an!'; } }, 'Neue Hose');
      wrapEl = h('div', { class: P + 'shelf' },
        h('span', { class: P + 'corner', 'aria-hidden': 'true' }),
        h('div', { class: P + 'axis-x', 'aria-hidden': 'true' }, h('span', null, 'schmal'), h('i', null), h('span', null, 'breit')),
        h('div', { class: P + 'axis-y', 'aria-hidden': 'true' }, h('span', null, 'lang'), h('i', null), h('span', null, 'kurz')),
        grid);
      input = h('input', { type: 'text', inputmode: 'numeric', pattern: '[0-9]*', maxlength: '3', autocomplete: 'off', class: P + 'num', id: P + 'in', 'aria-label': 'Höchste Zahl der Anproben', oninput: function () { api.changed(); refresh(); } });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { 'aria-label': 'Regal' }, h('h3', null, 'Das Regal mit 49 Hosen'), wrapEl,
          h('div', { class: P + 'bar' }, countEl, newBtn), feedEl),
        h('section', { 'aria-label': 'Antwort', class: P + 'ans' },
          h('label', { for: P + 'in' }, 'Christian braucht höchstens'), input, h('span', null, 'Anproben.'))));
      refresh();
    },
    isComplete: function () { return value() !== null; },
    evaluate: function () {
      var v = value();
      return { correct: v === ANSWER, answer: { n: v } };
    },
    setAnswer: function (ans) {
      input.value = ans && typeof ans.n === 'number' ? String(ans.n) : '';
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      refresh();
    },
    reset: function () { reset(); input.value = ''; focusPos = { r: MID, c: MID }; refresh(); },
    showSolution: function () { input.value = String(ANSWER); mark = 'solution'; locked = true; refresh(); }
  });
})();
