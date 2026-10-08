/* Aufgabe Bilder verschlüsseln (Biber 2024, S. 21; Klasse 9-10 schwer, 11-13 mittel): Verschlüsselung durch Verschieben von Pixeln */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-verschluesseln24-';

  var YEL = '#fff585', PUR = '#6166b0';
  var RIGHT = 4;   /* E (laut Heft S. 22; die Bilder sind per Skript mit der Simulation von V, dann H verglichen) */
  var N = 100;

  /* Die Operationen auf einem N x N Raster (0 = violett, 1 = gelb) */
  function startGrid() {
    var g = [];
    for (var y = 0; y < N; y++) { var row = []; for (var x = 0; x < N; x++) row.push((x < N / 2) === (y < N / 2) ? 1 : 0); g.push(row); }
    return g;
  }
  function opV(g) {   /* Pixel in Spalte n rücken um n-1 Zeilen nach unten, was unten hinausragt, kommt oben wieder herein */
    var o = [];
    for (var y = 0; y < N; y++) o.push(new Array(N));
    for (y = 0; y < N; y++) for (var x = 0; x < N; x++) o[(y + x) % N][x] = g[y][x];
    return o;
  }
  function opH(g) {   /* Pixel in Zeile n rücken um n-1 Spalten nach rechts, was rechts hinausragt, kommt links wieder herein */
    var o = [];
    for (var y = 0; y < N; y++) o.push(new Array(N));
    for (y = 0; y < N; y++) for (var x = 0; x < N; x++) o[y][(x + y) % N] = g[y][x];
    return o;
  }
  function apply(ops) {
    var g = startGrid();
    for (var i = 0; i < ops.length; i++) g = ops[i] === 'V' ? opV(g) : opH(g);
    return g;
  }
  function paint(canvas, g) {
    var ctx = canvas.getContext('2d');
    var id = ctx.createImageData(N, N), k = 0;
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var c = g[y][x] ? [255, 245, 133] : [97, 102, 176];
      id.data[k++] = c[0]; id.data[k++] = c[1]; id.data[k++] = c[2]; id.data[k++] = 255;
    }
    ctx.putImageData(id, 0, 0);
  }
  function dataUrl(ops) {
    try {
      var c = document.createElement('canvas'); c.width = N; c.height = N;
      paint(c, apply(ops));
      return c.toDataURL('image/png');
    } catch (e) { return ''; }
  }

  /* Antwortbilder A-E: exakt aus den Vektordaten des Hefts (gelber Grund, violette Flächen) */
  var OPTIONS = [
    { key: 'A', alt: 'Bild A: oben und unten je ein gelbes Parallelogramm, das von der Mitte nach links schräg verläuft, sonst violett', paths: ['M56.62 56.62L28.30 56.62L56.62 28.30L28.30 28.30L56.62 0.00ZM0.00 56.62L28.32 28.30L0.00 28.30L28.32 0.00L0.00 0.00ZM0.00 56.62'] },
    { key: 'B', alt: 'Bild B: senkrechte, leicht schräge gelbe und violette Streifen', paths: ['M28.32 0.00L42.47 56.62L42.47 0.00L56.62 56.62L56.62 0.00L28.31 0.00ZM0.00 56.62L0.00 0.00L14.16 56.62L14.16 0.00L28.31 56.62ZM0.00 56.62'] },
    { key: 'C', alt: 'Bild C: zwei Spalten, in jeder ein gelbes Parallelogramm von unten links nach oben rechts', paths: ['M0.00 56.62L28.32 28.30L28.32 56.62L56.63 28.30L56.63 56.62ZM0.00 28.30L0.00 0.00L56.62 0.00L28.30 28.32L28.30 0.00L0.00 28.32ZM0.00 28.30'] },
    { key: 'D', alt: 'Bild D: zwei gelbe Dreiecke, die von der linken Seite spitz nach rechts zulaufen', paths: ['M0.00 0.00L56.62 14.15L0.00 28.32L56.62 42.47L0.00 56.62L56.62 56.62L56.62 0.00ZM0.00 0.00'] },
    { key: 'E', alt: 'Bild E: schräge gelbe und violette Streifen und Dreiecke, die von links oben nach rechts unten verlaufen', paths: [
      'M0.00 14.15L28.32 28.30L0.00 0.00L56.62 28.31L28.32 0.00L56.63 14.15L56.63 0.00L0.00 0.00ZM0.00 14.15',
      'M0.00 56.62L0.00 42.46L28.32 56.62L0.00 28.31L56.62 56.63L28.30 28.31L56.62 42.46L56.62 56.62ZM0.00 56.62'] }
  ];
  function optSvg(o) {
    return '<svg viewBox="0 0 56.62 56.62" class="' + P + 'pic" role="img" aria-label="' + o.alt + '"><rect width="56.62" height="56.62" fill="' + YEL + '"/>' +
      o.paths.map(function (d) { return '<path d="' + d + '" fill="' + PUR + '" fill-rule="nonzero"/>'; }).join('') + '</svg>';
  }
  function startSvg(label) {
    return '<svg viewBox="0 0 56 56" class="' + P + 'pic" role="img" aria-label="' + label + '"><rect width="56" height="56" fill="' + PUR + '"/>' +
      '<rect width="28" height="28" fill="' + YEL + '"/><rect x="28" y="28" width="28" height="28" fill="' + YEL + '"/></svg>';
  }
  function grid3(rows, mark) {
    return '<table class="' + P + 'g" aria-hidden="true">' + rows.map(function (r) {
      return '<tr>' + r.map(function (c) { return '<td' + (mark && mark.indexOf(c) >= 0 ? ' class="m"' : '') + '>' + c + '</td>'; }).join('') + '</tr>';
    }).join('') + '</table>';
  }

  var el, api, radios, selected, locked, mark;
  var exCanvas, exOps, exText, exBtns;

  function reset() { selected = null; mark = null; }

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
  function choose(i, focus) {
    if (locked) return;
    selected = i;
    refresh();
    if (focus) radios[i].focus();
    api.changed();
  }
  function onKey(e) {
    var k = e.key, i = radios.indexOf(e.currentTarget), to = null;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % radios.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + radios.length - 1) % radios.length;
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }

  /* ---------- Ausprobieren ---------- */
  function drawEx() {
    paint(exCanvas, apply(exOps));
    exText.textContent = exOps.length ? 'Folge bisher: ' + exOps.split('').join(' ') : 'Das Originalbild, noch nicht verschlüsselt.';
    exCanvas.setAttribute('aria-label', exOps.length ? 'Das Bild nach der Folge ' + exOps.split('').join(' ') : 'Das Originalbild mit vier Quadraten');
  }
  function exDo(op) { if (exOps.length < 6) { exOps += op; drawEx(); } }

  Biber.register({
    id: 'verschluesseln24',
    story:
      '<p>Ein Bild ist ein Rechteck aus Zeilen und Spalten von Pixeln (Farbpunkten). Leo hat ein Verfahren zur Verschlüsselung von Bildern erfunden. Er benutzt zwei Operationen. Das Beispiel zeigt jeweils 3×3 Pixel:</p>' +
      '<ul class="' + P + 'ops">' +
      '<li><b>Operation H</b> (horizontal): Zeile 1 bleibt, Zeile 2 rückt um 1 Pixel nach rechts, Zeile 3 um 2. <i>Jede Zeile n rückt um n−1 Spalten nach rechts.</i> Was rechts hinausragt, kommt in derselben Zeile links wieder herein.' +
      '<span class="' + P + 'ex">' + grid3([[1, 2, 3], [4, 5, 6], [7, 8, 9]], [6, 8, 9]) + '<span aria-hidden="true">→</span>' + grid3([[1, 2, 3], [6, 4, 5], [8, 9, 7]], [6, 8, 9]) + '</span></li>' +
      '<li><b>Operation V</b> (vertikal): <i>Jede Spalte n rückt um n−1 Zeilen nach unten.</i> Was unten hinausragt, kommt in derselben Spalte oben wieder herein.' +
      '<span class="' + P + 'ex">' + grid3([[1, 2, 3], [6, 4, 5], [8, 9, 7]], [9, 5, 7]) + '<span aria-hidden="true">→</span>' + grid3([[1, 9, 5], [6, 2, 7], [8, 4, 3]], [9, 5, 7]) + '</span></li></ul>' +
      '<p>Die Operationen können hintereinander ausgeführt werden. Wendet man auf das erste Beispiel erst H und dann V an (Folge H V), entsteht das letzte Gitter. Leo verschlüsselt nun das unten gezeigte Bild (1000×1000 Pixel) mit der Folge <b>V H</b>: erst V, dann H.</p>',
    question: 'Wie sieht das Ergebnis aus?',
    howto: 'Wähle das passende Bild. Im Feld „Zum Ausprobieren“ kannst du die Operationen V und H selbst auf das Bild anwenden.',
    explanation: function () {
      var a = dataUrl(''), b = dataUrl('V'), c = dataUrl('VH');
      var step = function (src, cap) { return '<figure class="' + P + 'step"><img src="' + src + '" alt="' + cap + '" width="96" height="96"><figcaption>' + cap + '</figcaption></figure>'; };
      return '<p>Antwort <b>E</b> ist richtig. Operation V schert das Bild nach unten: Spalte für Spalte rutscht tiefer. Das überhängende Dreieck unten kommt oben wieder herein. ' +
        'Danach schert H das Bild nach rechts, und der Überhang kommt links wieder herein.</p>' +
        '<div class="' + P + 'steps">' + step(a, 'Original') + '<span aria-hidden="true">→</span>' + step(b, 'nach V') + '<span aria-hidden="true">→</span>' + step(c, 'nach V und H (E)') + '</div>' +
        '<p>Beim Verschlüsseln soll der Inhalt eines Bildes nicht mehr zu erkennen sein. Wer den „Schlüssel“, hier die Operationsfolge, kennt, kann das Bild leicht wieder herstellen. Ohne Schlüssel kann ein Computer die Folge meist auch durch Probieren finden. Sichere moderne Verfahren sind deshalb aufwendiger gebaut.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset(); exOps = '';
      var orig = h('div', { class: P + 'orig' });
      orig.innerHTML = startSvg('Das Originalbild mit vier Quadraten: oben links gelb, oben rechts violett, unten links violett, unten rechts gelb');
      radios = OPTIONS.map(function (o, i) {
        var btn = h('button', { type: 'button', role: 'radio', class: P + 'opt', 'data-opt': o.key, 'aria-label': 'Antwort ' + o.key + ': ' + o.alt.replace(/^Bild [A-E]: /, ''), onclick: function () { choose(i, false); }, onkeydown: onKey });
        btn.innerHTML = '<span class="' + P + 'key" aria-hidden="true">' + o.key + ')</span>' + optSvg(o).replace(' role="img" aria-label="' + o.alt + '"', ' aria-hidden="true" focusable="false"');
        return btn;
      });
      exCanvas = h('canvas', { class: P + 'canvas', width: N, height: N, role: 'img' });
      exText = h('p', { class: P + 'extext', role: 'status', 'aria-live': 'polite' });
      exBtns = h('div', { class: P + 'exbtns' },
        h('button', { type: 'button', class: 'btn ghost ' + P + 'op', onclick: function () { exDo('V'); } }, 'Operation V'),
        h('button', { type: 'button', class: 'btn ghost ' + P + 'op', onclick: function () { exDo('H'); } }, 'Operation H'),
        h('button', { type: 'button', class: 'btn ghost ' + P + 'op', onclick: function () { exOps = ''; drawEx(); } }, 'Zurück zum Original'));
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { 'aria-label': 'Original' }, h('h3', null, 'Das Bild (1000×1000 Pixel)'), orig),
        h('section', { 'aria-label': 'Antworten' }, h('h3', null, 'Ergebnis der Folge V H'),
          h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Antworten' }, radios)),
        h('section', { class: P + 'try', 'aria-label': 'Zum Ausprobieren' },
          h('h3', null, 'Zum Ausprobieren'),
          h('div', { class: P + 'tryrow' }, exCanvas, h('div', { class: P + 'trycol' }, exBtns, exText)))));
      drawEx();
      refresh();
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
    reset: function () { reset(); exOps = ''; drawEx(); refresh(); },
    showSolution: function () { selected = RIGHT; mark = 'solution'; locked = true; refresh(); }
  });
})();
