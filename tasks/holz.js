/* Aufgabe Holz für den Damm (Klasse 3-4 schwer, 5-6 mittel): Teilfolge mit maximaler Summe */
(function () {
  'use strict';
  var h = Biber.h;

  // Bäume von links nach rechts: Höhe in Metern, Bildbreite relativ zum breitesten Baum, Bildgröße in px
  var TREES = [
    { m: 8, f: 't8', w: 154, ht: 205 },
    { m: 6, f: 't6', w: 79, ht: 156 },
    { m: 9, f: 't9', w: 154, ht: 234 },
    { m: 7, f: 't7', w: 128, ht: 184 },
    { m: 10, f: 't10', w: 110, ht: 255 },
    { m: 5, f: 't5', w: 82, ht: 131 }
  ];
  var MAXW = 154;

  // Lösung per Dynamischer Programmierung / Brute Force: alle Teilmengen prüfen
  function chainOk(sel) {
    for (var i = 1; i < sel.length; i++) if (TREES[sel[i]].m >= TREES[sel[i - 1]].m) return false;
    return true;
  }
  function sum(sel) { return sel.reduce(function (s, i) { return s + TREES[i].m; }, 0); }
  var BEST = (function () {
    var best = 0, sols = [];
    for (var mask = 1; mask < (1 << TREES.length); mask++) {
      var sel = [];
      for (var i = 0; i < TREES.length; i++) if (mask & (1 << i)) sel.push(i);
      if (!chainOk(sel)) continue;
      var s = sum(sel);
      if (s > best) { best = s; sols = [sel]; } else if (s === best) sols.push(sel);
    }
    return { sum: best, sols: sols };
  })();

  var AXE = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">' +
    '<path d="M5 20L16 7" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" fill="none"/>' +
    '<path d="M13 3.5c3-1.2 6.2-.6 8 1.2l-4.2 6.1-5.4-3.2z" fill="currentColor"/></svg>';

  function axe() { var a = h('span', { class: 'ho-axe' }); a.innerHTML = AXE; return a; }

  var el, api;
  var sel, locked, mode; // mode: 'edit' | 'check' | 'solution'

  function reset() { sel = []; mode = 'edit'; }
  function sorted() { return sel.slice().sort(function (a, b) { return a - b; }); }

  // erster Verstoß gegen Regel 2 (nächster Baum nicht kleiner)? -> Index in sorted() oder -1
  function violation(s) {
    for (var i = 1; i < s.length; i++) if (TREES[s[i]].m >= TREES[s[i - 1]].m) return i;
    return -1;
  }

  function statusText() {
    var s = sorted();
    if (!s.length) return 'Tippe die Bäume an, die gefällt werden sollen.';
    var txt = 'Gefällt: ' + s.map(function (i) { return TREES[i].m + ' m'; }).join(' + ') + ' = ' + sum(s) + ' m';
    var v = violation(s);
    if (v >= 0) txt += '. Regel 2 verletzt: ' + TREES[s[v]].m + ' m ist nicht kleiner als ' + TREES[s[v - 1]].m + ' m.';
    return txt;
  }

  function toggle(i) {
    if (locked) return;
    var k = sel.indexOf(i);
    if (k >= 0) sel.splice(k, 1); else sel.push(i);
    render();
    api.changed(statusText());
  }

  function render() {
    var s = sorted();
    var v = violation(s);
    var bad = {};
    if (v >= 0) { bad[s[v]] = true; bad[s[v - 1]] = true; }
    var result = mode !== 'edit';
    var okAll = result && v < 0 && sum(s) === BEST.sum;
    var trees = TREES.map(function (t, i) {
      var pos = s.indexOf(i);
      var on = pos >= 0;
      var cls = 'ho-tree' + (on ? ' on' : '') + (on && bad[i] ? ' bad' : '') + (on && okAll ? ' good' : '');
      return h('button', {
        type: 'button', class: cls, 'data-tree': String(i), disabled: locked,
        'aria-pressed': String(on), 'aria-label': 'Baum ' + (i + 1) + ' von 6, ' + t.m + ' Meter' + (on ? ', gefällt als Nummer ' + (pos + 1) : '')
      },
        h('span', { class: 'ho-lab' }, t.m + ' m'),
        h('span', { class: 'ho-pic' },
          h('img', { src: 'assets/holz/' + t.f + '.png', alt: '', width: t.w, height: t.ht, draggable: 'false', style: 'width:' + (t.w / MAXW * 100).toFixed(1) + '%;max-width:' + t.w + 'px' }),
          on ? h('span', { class: 'ho-badge', 'aria-hidden': 'true' }, axe(), String(pos + 1)) : null));
    });
    var total = sum(s);
    var field = h('div', { class: 'ho-field' },
      h('img', { class: 'ho-beaver', src: 'assets/holz/biber.png', alt: 'Biber mit Axt', width: 168, height: 171, draggable: 'false' }),
      h('div', { class: 'ho-trees', role: 'group', 'aria-label': 'Sechs Bäume von links nach rechts' }, trees),
      h('div', { class: 'ho-ground', 'aria-hidden': 'true' }));
    var sumCls = 'ho-sum' + (v >= 0 ? ' bad' : '') + (okAll ? ' good' : '');
    var sumEl = h('div', { class: sumCls, 'aria-live': 'polite' },
      h('span', { class: 'ho-sum-l' }, 'Holz insgesamt'),
      h('span', { class: 'ho-sum-v num' }, total + ' m'),
      s.length ? h('span', { class: 'ho-sum-e' }, s.map(function (i) { return TREES[i].m; }).join(' + ')) : null);
    el.replaceChildren(field, sumEl);
  }

  Biber.register({
    id: 'holz',
    story: '<p>Für ihren nächsten Dammbau müssen die Biber einige Bäume fällen.</p>' +
      '<p>Sechs Bäume kommen in Frage. Die Biber wissen, wieviele Meter Holz jeder Baum hat. Sie wollen insgesamt möglichst viele Meter Holz haben. Den ersten Baum können sie frei wählen. Immer wenn sie danach einen nächsten Baum fällen wollen, müssen sie zwei Regeln befolgen:</p>' +
      '<ul><li>Regel 1: Der nächste Baum muss weiter rechts stehen als der vorherige.</li>' +
      '<li>Regel 2: Der nächste Baum muss kleiner sein, also weniger Meter Holz haben als der vorherige.</li></ul>' +
      '<p>Ein Beispiel: Wenn sie den 6m-Baum fällen, dürfen sie danach nur noch den 5m-Baum fällen. Dann haben sie am Ende insgesamt 11 Meter Holz.</p>',
    question: 'Welche Bäume können die Biber nach ihren Regeln fällen, damit sie am Ende möglichst viele Meter Holz haben?',
    howto: 'Tippe die Bäume an, die gefällt werden sollen. Noch einmal tippen nimmt einen Baum wieder heraus. Die Zahl am Baum zeigt die Reihenfolge, in der die Biber fällen.',
    explanation: function () {
      return '<p>Die Biber gehen von links nach rechts und dürfen nur immer kleinere Bäume nehmen. Man probiert alle Möglichkeiten durch: 8 + 6 + 5 = 19 m, 8 + 7 + 5 = 20 m, 10 + 5 = 15 m &ndash; und am besten ist <strong>9 + 7 + 5 = 21 m</strong>.</p>' +
        '<p>Der 10-m-Baum ist der größte, aber er lohnt sich nicht: Danach bleibt nur der 5-m-Baum übrig. Solche Aufgaben, bei denen man aus vielen Möglichkeiten die beste sucht, nennt man Optimierung. Computer prüfen dafür systematisch alle Möglichkeiten oder merken sich gute Teillösungen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', function (e) {
        var t = e.target.closest('[data-tree]');
        if (t) toggle(+t.dataset.tree);
      });
      render();
    },
    isComplete: function () { return sel.length > 0; },
    evaluate: function () {
      var s = sorted();
      return { correct: violation(s) < 0 && sum(s) === BEST.sum, answer: s };
    },
    setAnswer: function (ans) { sel = ans.slice(); mode = 'check'; render(); },
    lock: function (on) {
      locked = on;
      if (on) { if (mode === 'edit') mode = 'check'; } else mode = 'edit';
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () { sel = BEST.sols[0].slice(); mode = 'solution'; locked = true; render(); }
  });
})();
