/* Aufgabe Biber-Parcours (Biber 2020; Klasse 9-10 schwer, 11-13 mittel): möglichst viele Gegenstände in 16 Sekunden zum Lehrertisch bringen */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-parcours20-';

  var N = [[2, 0, 8, 0, 15], [0, 0, 0, 3, 0], [0, 0, 0, 0, 0], [0, 1, 0, 0, 0], [0, 6, 0, 12, 0]];   /* Zahl = früheste Ankunftszeit; 0 = leerer Tisch */
  var TEACHER = [1, 4], LIMIT = 16, RIGHT = 5;
  /* Weg aus dem Heft (S. 15): Start am Tisch mit der 2, Ankunftszeiten 3 … 15; per Skript (Brute Force über alle Wege) wurde 5 als Maximum bestätigt */
  var SOL = [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [4, 1], [4, 2], [3, 2], [2, 2], [1, 2], [0, 2], [0, 3], [1, 3], [1, 4]];
  var R = 5, C = 5, CELL = 100, OFF = 50;

  function cx(c) { return OFF + CELL * c; }
  function cy(r) { return OFF + CELL * r; }
  function ek(a, b) { var x = a[0] * C + a[1], y = b[0] * C + b[1]; return x < y ? x + '-' + y : y + '-' + x; }
  function same(a, b) { return a[0] === b[0] && a[1] === b[1]; }
  function isTeacher(r, c) { return r === TEACHER[0] && c === TEACHER[1]; }
  function tableName(r, c) {
    var n = N[r][c];
    return (isTeacher(r, c) ? 'Lehrertisch' : n ? 'Tisch mit der Zahl ' + n : 'Tisch ohne Zahl') + ', Reihe ' + (r + 1) + ', Spalte ' + (c + 1);
  }

  /* ---------- Weg-Zustand: path = [[r, c, t], …] ---------- */
  var el, api, boardEl, statusEl, inputEl, undoBtn, clearBtn;
  var path, used, msg, focusAt, locked, mark;

  function resetPath() { path = []; used = {}; msg = ''; focusAt = [0, 0]; }
  function cur() { return path.length ? path[path.length - 1] : null; }
  function items() {
    var seen = {}, list = [];
    path.forEach(function (p) { if (N[p[0]][p[1]] && !seen[p[0] + ',' + p[1]]) { seen[p[0] + ',' + p[1]] = 1; list.push(N[p[0]][p[1]]); } });
    return list;
  }
  /* versucht, zum Tisch (r, c) zu gehen; liefert eine Fehlermeldung oder '' */
  function step(r, c) {
    var p = cur();
    if (!p) { path.push([r, c, N[r][c]]); return ''; }
    if (p[0] === r && p[1] === c) return 'Du stehst schon an diesem Tisch.';
    if (Math.abs(p[0] - r) + Math.abs(p[1] - c) !== 1) return 'Du kannst nur zu einem Nachbartisch gehen, der über eine Linie verbunden ist.';
    if (used[ek(p, [r, c])]) return 'Diese Linie bist du schon gegangen. Jede Linie darf nur einmal benutzt werden.';
    var t = Math.max(p[2] + 1, N[r][c]);
    if (t > LIMIT) return 'Zu spät: Du wärst dort erst nach ' + t + ' Sekunden. Es sind nur ' + LIMIT + ' Sekunden erlaubt.';
    used[ek(p, [r, c])] = true;
    path.push([r, c, t]);
    return '';
  }
  function loadPath(list) {
    resetPath();
    list.forEach(function (p) { step(p[0], p[1]); });
  }
  function activate(r, c) {
    msg = step(r, c);
    focusAt = [r, c];
    drawBoard(true);
    api.changed();
  }
  function undo() {
    if (!path.length) return;
    var p = path.pop();
    if (path.length) delete used[ek(path[path.length - 1], p)];
    msg = '';
    focusAt = [p[0], p[1]];
    drawBoard(true);
  }
  function clearPath() { resetPath(); drawBoard(true); }

  /* ---------- Zeichnen ---------- */
  function svgText(r, c) {
    var n = N[r][c], x = cx(c), y = cy(r), s = '';
    if (isTeacher(r, c)) {
      s += '<line class="' + P + 'xo" x1="' + (x - 17) + '" y1="' + (y - 20) + '" x2="' + (x + 17) + '" y2="' + (y + 14) + '"/><line class="' + P + 'xo" x1="' + (x + 17) + '" y1="' + (y - 20) + '" x2="' + (x - 17) + '" y2="' + (y + 14) + '"/>' +
        '<line class="' + P + 'xi" x1="' + (x - 17) + '" y1="' + (y - 20) + '" x2="' + (x + 17) + '" y2="' + (y + 14) + '"/><line class="' + P + 'xi" x1="' + (x + 17) + '" y1="' + (y - 20) + '" x2="' + (x - 17) + '" y2="' + (y + 14) + '"/>';
    } else if (n) s += '<text class="' + P + 'num" x="' + x + '" y="' + (y - 3) + '" text-anchor="middle" dominant-baseline="central">' + n + '</text>';
    return s;
  }
  function drawBoard(refocus) {
    var s = '', r, c, i, p, q;
    var hadFocus = refocus || (boardEl.contains(document.activeElement));
    /* Linien des Tischplans (mit breiter, unsichtbarer Klickfläche) */
    for (r = 0; r < R; r++) for (c = 0; c < C; c++) {
      if (c + 1 < C) s += '<g data-edge="' + r + ',' + c + ',' + r + ',' + (c + 1) + '"><line class="' + P + 'lane" x1="' + cx(c) + '" y1="' + cy(r) + '" x2="' + cx(c + 1) + '" y2="' + cy(r) + '"/><line class="' + P + 'hit" x1="' + cx(c) + '" y1="' + cy(r) + '" x2="' + cx(c + 1) + '" y2="' + cy(r) + '"/></g>';
      if (r + 1 < R) s += '<g data-edge="' + r + ',' + c + ',' + (r + 1) + ',' + c + '"><line class="' + P + 'lane" x1="' + cx(c) + '" y1="' + cy(r) + '" x2="' + cx(c) + '" y2="' + cy(r + 1) + '"/><line class="' + P + 'hit" x1="' + cx(c) + '" y1="' + cy(r) + '" x2="' + cx(c) + '" y2="' + cy(r + 1) + '"/></g>';
    }
    /* gegangener Weg */
    for (i = 1; i < path.length; i++) {
      p = path[i - 1]; q = path[i];
      s += '<line class="' + P + 'way" x1="' + cx(p[1]) + '" y1="' + cy(p[0]) + '" x2="' + cx(q[1]) + '" y2="' + cy(q[0]) + '"/>';
    }
    /* Tische */
    var collected = {};
    path.forEach(function (pp) { collected[pp[0] + ',' + pp[1]] = true; });
    var here = cur();
    for (r = 0; r < R; r++) for (c = 0; c < C; c++) {
      var cls = P + 'table' + (isTeacher(r, c) ? ' ' + P + 'teacher' : '') + (N[r][c] && collected[r + ',' + c] ? ' ' + P + 'got' : '') + (here && here[0] === r && here[1] === c ? ' ' + P + 'here' : '');
      s += '<g class="' + cls + '" data-r="' + r + '" data-c="' + c + '" role="button" tabindex="' + (focusAt[0] === r && focusAt[1] === c ? 0 : -1) + '" aria-label="' + tableName(r, c) + (here && here[0] === r && here[1] === c ? ', hier stehst du' : '') + '">' +
        '<rect class="' + P + 'leg" x="' + (cx(c) - 27) + '" y="' + (cy(r) + 12) + '" width="8" height="19" rx="2"/><rect class="' + P + 'leg" x="' + (cx(c) + 19) + '" y="' + (cy(r) + 12) + '" width="8" height="19" rx="2"/>' +
        '<rect class="' + P + 'top" x="' + (cx(c) - 34) + '" y="' + (cy(r) - 26) + '" width="68" height="44" rx="5"/>' + svgText(r, c) +
        '<rect class="' + P + 'ring" x="' + (cx(c) - 39) + '" y="' + (cy(r) - 31) + '" width="78" height="54" rx="9"/></g>';
    }
    /* Zeitmarken und Pfeile auf dem Weg */
    for (i = 1; i < path.length; i++) {
      p = path[i - 1]; q = path[i];
      var mx = (cx(p[1]) + cx(q[1])) / 2, my = (cy(p[0]) + cy(q[0])) / 2;
      var dx = q[1] - p[1], dy = q[0] - p[0];
      var ax = mx + dx * 13, ay = my + dy * 13;     /* Pfeilspitze hinter der Zahl */
      s += '<polygon class="' + P + 'arrow" points="' + (ax + dx * 8) + ',' + (ay + dy * 8) + ' ' + (ax - dx * 3 - dy * 8) + ',' + (ay - dy * 3 + dx * 8) + ' ' + (ax - dx * 3 + dy * 8) + ',' + (ay - dy * 3 - dx * 8) + '"/>' +
        '<circle class="' + P + 'tbub" cx="' + (mx - dx * 4) + '" cy="' + (my - dy * 4) + '" r="13"/><text class="' + P + 'ttxt" x="' + (mx - dx * 4) + '" y="' + (my - dy * 4) + '" text-anchor="middle" dominant-baseline="central">' + q[2] + '</text>';
    }
    if (path.length) s += '<g class="' + P + 'start"><circle cx="' + (cx(path[0][1]) - 34) + '" cy="' + (cy(path[0][0]) - 26) + '" r="12"/><text x="' + (cx(path[0][1]) - 34) + '" y="' + (cy(path[0][0]) - 26) + '" text-anchor="middle" dominant-baseline="central">S</text></g>';
    boardEl.innerHTML = '<svg class="' + P + 'svg" viewBox="0 0 500 500" role="group" aria-label="Tischplan mit 25 Tischen. Tippe Tische oder Linien an, um einen Weg zu gehen.">' +
      '<rect class="' + P + 'floor" x="4" y="4" width="492" height="492" rx="14"/>' + s + '</svg>';
    if (hadFocus) { var f = boardEl.querySelector('[data-r="' + focusAt[0] + '"][data-c="' + focusAt[1] + '"]'); if (f) f.focus(); }
    refreshStatus();
  }
  function refreshStatus() {
    var p = cur(), txt;
    if (!p) txt = 'Wähle zuerst einen Starttisch.';
    else {
      var it = items();
      txt = 'Zeit: ' + p[2] + ' von ' + LIMIT + ' Sekunden. ';
      if (isTeacher(p[0], p[1])) txt += 'Am Lehrertisch angekommen: ' + it.length + (it.length === 1 ? ' Gegenstand' : ' Gegenstände') + (it.length ? ' (' + it.join(', ') + ')' : '') + ' gebracht.';
      else txt += 'Unterwegs mit ' + it.length + (it.length === 1 ? ' Gegenstand' : ' Gegenständen') + (it.length ? ' (' + it.join(', ') + ')' : '') + '. Noch nicht am Lehrertisch.';
    }
    statusEl.textContent = txt;
    msgEl.textContent = msg;
    undoBtn.disabled = path.length === 0;
    clearBtn.disabled = path.length === 0;
  }
  var msgEl;

  /* ---------- Eingaben am Plan ---------- */
  function onBoardClick(e) {
    var t = e.target.closest('[data-r]');
    if (t) return activate(+t.getAttribute('data-r'), +t.getAttribute('data-c'));
    var g = e.target.closest('[data-edge]');
    if (!g) return;
    var a = g.getAttribute('data-edge').split(',').map(Number), p = cur();
    if (!p) { msg = 'Wähle zuerst einen Starttisch.'; return refreshStatus(); }
    if (p[0] === a[0] && p[1] === a[1]) return activate(a[2], a[3]);
    if (p[0] === a[2] && p[1] === a[3]) return activate(a[0], a[1]);
    msg = 'Diese Linie gehört nicht zu deinem Standort. Du kannst nur von dem Tisch aus weitergehen, an dem du stehst.';
    refreshStatus();
  }
  function onBoardKey(e) {
    var t = e.target.closest('[data-r]');
    if (!t) return;
    var r = +t.getAttribute('data-r'), c = +t.getAttribute('data-c'), k = e.key;
    if (k === 'Enter' || k === ' ') { e.preventDefault(); return activate(r, c); }
    var nr = r + (k === 'ArrowDown' ? 1 : k === 'ArrowUp' ? -1 : 0), nc = c + (k === 'ArrowRight' ? 1 : k === 'ArrowLeft' ? -1 : 0);
    if ((nr === r && nc === c) || nr < 0 || nc < 0 || nr >= R || nc >= C) return;
    e.preventDefault();
    focusAt = [nr, nc];
    [].forEach.call(boardEl.querySelectorAll('[data-r]'), function (g) { g.setAttribute('tabindex', +g.getAttribute('data-r') === nr && +g.getAttribute('data-c') === nc ? '0' : '-1'); });
    boardEl.querySelector('[data-r="' + nr + '"][data-c="' + nc + '"]').focus();
  }

  function value() {
    var v = inputEl.value.trim();
    return /^\d{1,2}$/.test(v) ? +v : null;
  }
  function paintInput() {
    inputEl.disabled = !!locked;
    var v = value();
    inputEl.classList.toggle('right', mark !== null && v === RIGHT);
    inputEl.classList.toggle('wrong', mark === 'check' && v !== RIGHT);
  }

  Biber.register({
    id: 'parcours20',
    story:
      '<p>Die Informatik-Lehrerin hat für den Unterrichtsbeginn ein Bewegungsspiel eingeführt: den Biber-Parcours.</p>' +
      '<p>Auf dem Tischplan des Klassenraums sind sieben Tische mit Zahlen markiert. Auf jedem dieser Tische liegt ein kleiner Gegenstand. Der Lehrertisch ist mit einem Kreuz markiert. Du sollst innerhalb von 16 Sekunden möglichst viele Gegenstände zum Lehrertisch bringen.</p>' +
      '<p>Du kannst an einem beliebigen Tisch starten und dich dann entlang der Linien von Tisch zu Tisch bewegen. Du darfst jede Linie nur einmal entlanggehen. Du brauchst genau 1 Sekunde, um von einem Tisch zum nächsten zu gehen und, falls vorhanden, einen Gegenstand zu nehmen.</p>' +
      '<p>Die Zahl auf einem Tisch sagt dir, nach wie vielen Sekunden du frühestens bei diesem Tisch sein darfst.</p>',
    question: 'Wie viele Gegenstände kannst du innerhalb von 16 Sekunden höchstens zum Lehrertisch bringen?',
    howto: 'Zum Ausprobieren: Tippe einen Starttisch an (dort startest du zu der Zeit, die auf dem Tisch steht), dann nacheinander die Nachbartische oder die Linien dazwischen. Trage unten die größte Zahl ein, die du für möglich hältst.',
    explanation: function () {
      return '<p>Die richtige Antwort ist <strong>5</strong>. Ein möglicher Weg: Start am Tisch 2, dann am linken Rand nach unten, zu den Tischen 1 und 6, von dort nach rechts und wieder nach oben zum Tisch 8, weiter zum Tisch 3 und ins Ziel am Lehrertisch. ' +
        'Nach 15 Sekunden bist du dort und hast die Gegenstände 2, 1, 6, 8 und 3 dabei.</p>' +
        '<p>Mehr geht nicht: Die Gegenstände 12 und 15 schließen sich aus, denn von Tisch 12 braucht man mindestens 5 weitere Sekunden bis zu Tisch 15. Für sechs Gegenstände müsste man 1, 2, 6, 8, 3 und 15 holen, doch dieser Weg dauert eine Sekunde zu lang. Alle anderen Wege mit sechs Gegenständen sind noch länger.</p>' +
        '<p>Das ist ein <em>Optimierungsproblem</em>: Unter allen erlaubten Wegen sucht man den besten. Eine Methode dafür ist das <em>Backtracking</em>: Man probiert Schritt für Schritt Wege aus und geht zurück, sobald ein Weg nicht mehr zum Ziel führen oder nicht besser sein kann als der bisher beste.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; mark = null; resetPath();
      boardEl = h('div', { class: P + 'plan', onclick: onBoardClick, onkeydown: onBoardKey });
      statusEl = h('p', { class: P + 'status', role: 'status', 'aria-live': 'polite' });
      msgEl = h('p', { class: P + 'msg', role: 'status', 'aria-live': 'polite' });
      undoBtn = h('button', { type: 'button', class: 'btn ghost ' + P + 'btn', onclick: undo }, 'Schritt zurück');
      clearBtn = h('button', { type: 'button', class: 'btn ghost ' + P + 'btn', onclick: clearPath }, 'Weg löschen');
      inputEl = h('input', {
        type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: '2', class: P + 'input', id: P + 'in', 'aria-label': 'Höchstzahl der Gegenstände',
        oninput: function () { api.changed(); }
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { 'aria-label': 'Tischplan zum Ausprobieren' }, h('h3', null, 'Tischplan zum Ausprobieren'), boardEl, statusEl, msgEl,
          h('div', { class: P + 'tools' }, undoBtn, clearBtn)),
        h('section', { class: P + 'ans', 'aria-label': 'Antwort' },
          h('label', { for: P + 'in' }, 'Höchstens ', inputEl, ' Gegenstände'))));
      drawBoard(false);
      paintInput();
    },
    isComplete: function () { return value() !== null; },
    evaluate: function () {
      var v = value();
      return { correct: v === RIGHT, answer: { value: v, path: path.map(function (p) { return [p[0], p[1]]; }) } };
    },
    setAnswer: function (ans) {
      inputEl.value = ans && ans.value != null ? String(ans.value) : '';
      loadPath((ans && ans.path) || []);
      mark = 'check';
      drawBoard(false);
      paintInput();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      paintInput();
    },
    reset: function () { inputEl.value = ''; mark = null; resetPath(); drawBoard(false); paintInput(); },
    showSolution: function () {
      inputEl.value = String(RIGHT);
      loadPath(SOL);
      mark = 'solution'; locked = true;
      drawBoard(false);
      paintInput();
    }
  });
})();
