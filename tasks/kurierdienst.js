/* Aufgabe Kurierdienst (visuelle Kryptografie): Folie 2 zu geheimem Bild und Folie 1 erstellen */
(function () {
  'use strict';
  var h = Biber.h;

  /* ---- Daten wie im Heft ----
     Geheimes Bild: '#' schwarz, '.' weiß. Folien: 'D' dunkel, 'L' hell. */
  var SECRET = ['.###.', '.#...', '.###.', '.#...', '.###.'];
  var FOLIE1 = ['LDDLL', 'LDDLD', 'DDLDL', 'LDDDD', 'DLLLL'];
  var N = 5;

  // Einführungsbeispiel (Kreuz)
  var EX_SECRET = ['.#.', '###', '.#.'];
  var EX_F1 = ['LLD', 'DLL', 'DLL'];
  var EX_F2 = ['LDD', 'LDD', 'DDL'];

  // Regel: schwarz im geheimen Bild -> Folien verschieden; weiß -> gleich
  function rule(secretCell, d1) { return secretCell === '#' ? !d1 : d1; }
  function solveRows(secret, f1) {
    return secret.map(function (row, r) {
      return row.split('').map(function (c, i) { return rule(c, f1[r][i] === 'D') ? 'D' : 'L'; }).join('');
    });
  }
  var SOLUTION = solveRows(SECRET, FOLIE1);

  /* ---- Zeichnen: Folien als Schraffur (dunkel = dichte Linien, hell = lockere Linien) ----
     Dunkle und helle Schraffur ergänzen sich: dunkel über hell ergibt eine geschlossene schwarze Fläche. */
  var uid = 0;
  function defs(id) {
    var tf = 'patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(-25)"';
    return '<defs><pattern id="kdD' + id + '" ' + tf + '><rect class="kd-ink" x="0" y="0" width="4" height="2.6"/></pattern>' +
      '<pattern id="kdL' + id + '" ' + tf + '><rect class="kd-ink" x="0" y="2.6" width="4" height="1.4"/></pattern></defs>';
  }
  function hatch(id, dark) { return '<rect class="kd-hatch" width="20" height="20" fill="url(#kd' + (dark ? 'D' : 'L') + id + ')"/>'; }
  function figure(n, cellFn, label, cls) {
    var id = 'f' + (++uid), body = '';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
      body += '<g transform="translate(' + (c * 20) + ' ' + (r * 20) + ')">' + cellFn(id, r, c) + '</g>';
    }
    return '<svg class="kd-fig ' + (cls || '') + '" viewBox="-1.5 -1.5 ' + (n * 20 + 3) + ' ' + (n * 20 + 3) + '" role="img" aria-label="' + label + '" focusable="false">' +
      defs(id) + body + '<rect class="kd-frame" x="0" y="0" width="' + (n * 20) + '" height="' + (n * 20) + '"/></svg>';
  }
  var PAPER = '<rect class="kd-paper" width="20" height="20"/>';
  function secretFig(rows, cls) {
    return figure(rows.length, function (id, r, c) {
      return rows[r][c] === '#' ? '<rect class="kd-black" width="20" height="20"/>' : '<rect class="kd-white" width="20" height="20"/>';
    }, 'Geheimes Bild. ' + wordsRows(rows, { '#': 'schwarz', '.': 'weiß' }), cls);
  }
  function foilFig(rows, name, cls) {
    return figure(rows.length, function (id, r, c) { return PAPER + hatch(id, rows[r][c] === 'D'); },
      name + '. ' + wordsRows(rows, { D: 'dunkel', L: 'hell' }), cls);
  }
  function overFig(f1, f2, cls) {
    return figure(f1.length, function (id, r, c) {
      return PAPER + hatch(id, f1[r][c] === 'D') + hatch(id, f2[r][c] === 'D');
    }, 'Folien 1 und 2 übereinander. Wo das geheime Bild schwarz ist, ist die Fläche ganz schwarz, sonst bleibt sie gestreift.', cls);
  }
  function wordsRows(rows, names) {
    return rows.map(function (row, r) {
      return 'Zeile ' + (r + 1) + ': ' + row.split('').map(function (ch) { return names[ch]; }).join(', ') + '.';
    }).join(' ');
  }
  function sw(kind) {
    var id = 's' + (++uid), inner;
    if (kind === 'black') inner = '<rect class="kd-black" width="20" height="20"/>';
    else if (kind === 'white') inner = '<rect class="kd-white" width="20" height="20"/>';
    else inner = PAPER + hatch(id, kind === 'dark');
    return '<svg class="kd-sw" viewBox="-1 -1 22 22" aria-hidden="true" focusable="false">' + defs(id) + inner + '<rect class="kd-frame" width="20" height="20"/></svg>';
  }

  function storyHtml() {
    return '<p>Ein geheimes Bild, das aus schwarzen ' + sw('black') + ' und weißen ' + sw('white') + ' Pixeln besteht, soll sicher übertragen werden. ' +
      'Hierfür erstellt der Kurierdienst auf transparenten Folien zwei Bilder aus dunklen ' + sw('dark') + ' und hellen ' + sw('light') + ' Pixeln. ' +
      'Das geheime Bild wird erst dann erkennbar, wenn die beiden Folien übereinander gelegt werden.</p>' +
      '<div class="kd-example">' +
      '<figure><figcaption>Geheimes Bild</figcaption>' + secretFig(EX_SECRET) + '</figure>' +
      '<figure><figcaption>Folie 1</figcaption>' + foilFig(EX_F1, 'Folie 1') + '</figure>' +
      '<figure><figcaption>Folie 2</figcaption>' + foilFig(EX_F2, 'Folie 2') + '</figure>' +
      '<figure><figcaption>Folien 1 und 2 übereinander</figcaption>' + overFig(EX_F1, EX_F2) + '</figure>' +
      '</div>' +
      '<p>Die Bilder für die beiden Folien werden so erstellt: Zuerst wird für Folie 1 ein zufälliges Muster aus dunklen ' + sw('dark') + ' und hellen ' + sw('light') + ' Pixeln erzeugt. ' +
      'Die Pixel im Bild für Folie 2 werden dann nach der folgenden Regel gesetzt, abhängig von den Pixeln an der gleichen Stelle im geheimen Bild und in Folie 1:</p>' +
      '<ul class="kd-rules">' +
      '<li>Ist das Pixel im geheimen Bild schwarz ' + sw('black') + ', dann müssen die Pixel in Folie 1 und Folie 2 <strong>verschieden</strong> sein (das eine dunkel ' + sw('dark') + ', das andere hell ' + sw('light') + ').</li>' +
      '<li>Ist das Pixel im geheimen Bild weiß ' + sw('white') + ', dann müssen die Pixel in Folie 1 und Folie 2 <strong>gleich</strong> sein (beide ' + sw('light') + ' oder beide ' + sw('dark') + ').</li>' +
      '</ul>';
  }

  /* ---- Zustand und Spielfeld ---- */
  var el, api, cells, f2, touched, locked, mark, overBox, overHolder, focusIdx;

  function reset() {
    f2 = []; for (var i = 0; i < N * N; i++) f2.push(false);
    touched = false; mark = null; focusIdx = 0;
  }
  function rowsOf(arr) {
    var out = [];
    for (var r = 0; r < N; r++) {
      var s = '';
      for (var c = 0; c < N; c++) s += arr[r * N + c] ? 'D' : 'L';
      out.push(s);
    }
    return out;
  }
  function fromRows(rows) {
    var arr = [];
    for (var r = 0; r < N; r++) for (var c = 0; c < N; c++) arr.push(rows[r][c] === 'D');
    return arr;
  }
  function isRight(i) { return f2[i] === (SOLUTION[Math.floor(i / N)][i % N] === 'D'); }
  function allRight() { return rowsOf(f2).join('|') === SOLUTION.join('|'); }

  function toggle(i) {
    if (locked) return;
    f2[i] = !f2[i];
    touched = true;
    refresh();
    api.changed();
  }

  function refresh() {
    cells.forEach(function (btn, i) {
      var r = Math.floor(i / N), c = i % N;
      var dark = f2[i];
      btn.querySelector('use').setAttribute('href', dark ? '#kd-d-b' : '#kd-l-b');
      btn.setAttribute('aria-label', 'Folie 2, Zeile ' + (r + 1) + ', Spalte ' + (c + 1) + ': ' + (dark ? 'dunkel' : 'hell'));
      btn.setAttribute('aria-disabled', locked ? 'true' : 'false');
      btn.tabIndex = i === focusIdx ? 0 : -1;
      var ok = mark === 'check' && isRight(i);
      var bad = mark === 'check' && !isRight(i);
      btn.classList.toggle('right', ok);
      btn.classList.toggle('wrong', bad);
      var m = btn.querySelector('.kd-mark');
      if (m) m.remove();
      if (bad) btn.appendChild(h('span', { class: 'kd-mark', 'aria-hidden': 'true' }, '✗'));
    });
    overBox.hidden = mark === null;
    overHolder.innerHTML = mark === null ? '' : overFig(FOLIE1, rowsOf(f2));
  }

  function onKey(e) {
    var i = cells.indexOf(e.currentTarget), r = Math.floor(i / N), c = i % N, to = null;
    if (e.key === 'ArrowRight') c = Math.min(N - 1, c + 1);
    else if (e.key === 'ArrowLeft') c = Math.max(0, c - 1);
    else if (e.key === 'ArrowDown') r = Math.min(N - 1, r + 1);
    else if (e.key === 'ArrowUp') r = Math.max(0, r - 1);
    else return;
    e.preventDefault();
    to = r * N + c;
    focusIdx = to;
    cells.forEach(function (b, k) { b.tabIndex = k === to ? 0 : -1; });
    cells[to].focus();
  }

  function sharedDefs() {
    var tf = 'patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(-25)"';
    return '<svg class="kd-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>' +
      '<pattern id="kdD-b" ' + tf + '><rect class="kd-ink" x="0" y="0" width="4" height="2.6"/></pattern>' +
      '<pattern id="kdL-b" ' + tf + '><rect class="kd-ink" x="0" y="2.6" width="4" height="1.4"/></pattern>' +
      '<g id="kd-d-b"><rect class="kd-paper" width="20" height="20"/><rect class="kd-hatch" width="20" height="20" fill="url(#kdD-b)"/></g>' +
      '<g id="kd-l-b"><rect class="kd-paper" width="20" height="20"/><rect class="kd-hatch" width="20" height="20" fill="url(#kdL-b)"/></g>' +
      '</defs></svg>';
  }

  function build() {
    cells = [];
    for (var i = 0; i < N * N; i++) {
      (function (i) {
        var btn = h('button', { type: 'button', class: 'kd-cell', onclick: function () { focusIdx = i; toggle(i); }, onkeydown: onKey });
        btn.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><use href="#kd-l-b"/></svg>';
        cells.push(btn);
      })(i);
    }
    var defsHolder = h('div', { class: 'kd-defs-holder' });
    defsHolder.innerHTML = sharedDefs();
    overHolder = h('div', { class: 'kd-over-fig' });
    overBox = h('figure', { class: 'kd-panel kd-over', hidden: true },
      h('figcaption', null, 'Folien 1 und 2 übereinander'), overHolder);
    var secret = h('figure', { class: 'kd-panel' }, h('figcaption', null, 'Geheimes Bild'));
    var f1 = h('figure', { class: 'kd-panel' }, h('figcaption', null, 'Folie 1'));
    var sHold = h('div', { class: 'kd-fig-wrap' }); sHold.innerHTML = secretFig(SECRET);
    var fHold = h('div', { class: 'kd-fig-wrap' }); fHold.innerHTML = foilFig(FOLIE1, 'Folie 1');
    secret.appendChild(sHold); f1.appendChild(fHold);
    var f2panel = h('figure', { class: 'kd-panel kd-f2' }, h('figcaption', null, 'Folie 2'),
      h('div', { class: 'kd-grid', role: 'group', 'aria-label': 'Folie 2: 5 mal 5 Pixel. Pfeiltasten bewegen, Eingabetaste oder Leertaste schaltet zwischen hell und dunkel um.' }, cells));
    var note = h('p', { class: 'kd-note', 'aria-hidden': 'true' }, 'Tippe ein Pixel an, um es zwischen hell und dunkel umzuschalten.');
    el.replaceChildren(defsHolder, h('div', { class: 'kd-board' }, secret, f1, f2panel, overBox), note);
  }

  Biber.register({
    id: 'kurierdienst',
    story: storyHtml(),
    question: 'Für das folgende geheime Bild wurde Folie 1 bereits erzeugt. Erstelle nun Folie 2.',
    howto: 'Tippe die Pixel von Folie 2 an. Jeder Tipp schaltet ein Pixel zwischen hell und dunkel um. Alle Pixel beginnen hell.',
    explanation: function () {
      return '<p>Pixel für Pixel gilt: Ist das Pixel im geheimen Bild <strong>schwarz</strong>, kommt in Folie 2 das <em>Gegenteil</em> von Folie 1; ist es <strong>weiß</strong>, kommt <em>dasselbe</em> wie in Folie 1. ' +
        'Aus dieser Regel ergibt sich jedes Pixel von Folie 2 eindeutig, die Lösung sieht so aus:</p>' +
        '<div class="kd-sol">' + foilFig(SOLUTION, 'Richtige Folie 2', 'kd-fig-sol') + '</div>' +
        '<p>Legt man die Folien übereinander, wird jedes schwarze Pixel ganz dunkel, an den weißen bleibt ein Streifenmuster, und der Buchstabe E wird sichtbar. ' +
        'Jede Folie allein sieht wie reiner Zufall aus und verrät nichts. Das ist <em>visuelle Kryptografie</em>: Folie 1 wirkt wie ein zufälliger Schlüssel, ' +
        'Folie 2 wie die verschlüsselte Nachricht. Die Regel ist dieselbe wie beim „exklusiven Oder“ (XOR).</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      build();
      refresh();
    },
    isComplete: function () { return touched; },
    evaluate: function () {
      return { correct: allRight(), answer: { rows: rowsOf(f2) } };
    },
    setAnswer: function (ans) {
      f2 = fromRows(ans && ans.rows ? ans.rows : SOLUTION);
      touched = true;
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      refresh();
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () { f2 = fromRows(SOLUTION); touched = true; mark = 'solution'; locked = true; refresh(); }
  });
})();
