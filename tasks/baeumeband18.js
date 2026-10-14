/* Aufgabe Bäume-Band (Heft 2018, Klasse 5-6 einfach): Algorithmik, geometrische Algorithmen, konvexe Hülle */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-baeumeband18-';

  /* Baumpositionen (aus dem Heft-Bild übernommen, Einheiten beliebig) */
  var YESTERDAY = [[153.9, 406.4], [264.3, 445.3], [368.7, 398.2], [441.4, 488.3], [225.4, 566.2], [389.2, 587.7]];
  var TODAY = [[619.4, 399.9], [684.2, 451.2], [793.9, 435.5], [854.7, 408.4], [895, 465.4], [744.5, 508.6], [627.7, 530.9], [729.8, 579.8], [894.5, 582.6]];
  var R = 18;
  var OPTIONS = [3, 5, 6, 9];
  var RIGHT = 6;

  /* konvexe Hülle (Andrew-Monotone-Chain); Rückgabe im Uhrzeigersinn (Bildschirm: y nach unten), beginnend links oben */
  function cross(o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }
  function hull(pts) {
    var p = pts.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    var lo = [], up = [], i;
    for (i = 0; i < p.length; i++) {
      while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p[i]) <= 0) lo.pop();
      lo.push(p[i]);
    }
    for (i = p.length - 1; i >= 0; i--) {
      while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p[i]) <= 0) up.pop();
      up.push(p[i]);
    }
    lo.pop(); up.pop();
    return lo.concat(up);
  }
  var HULL_Y = hull(YESTERDAY);
  var HULL_T = hull(TODAY);
  function isIn(list, p) { return list.some(function (q) { return q === p; }); }

  function figure(trees, hl, x0, label, numbered) {
    var s = '<svg class="' + P + 'svg" viewBox="' + x0 + ' 355 360 265" role="img" aria-label="' + label + '" focusable="false">';
    if (hl) {
      s += '<polygon class="' + P + 'band" points="' + hl.map(function (p) { return p[0] + ',' + p[1]; }).join(' ') + '"/>';
    }
    trees.forEach(function (t) {
      s += '<circle class="' + P + 'tree" cx="' + t[0] + '" cy="' + t[1] + '" r="' + R + '"/>';
    });
    if (numbered && hl) {
      hl.forEach(function (t, i) {
        s += '<circle class="' + P + 'badge" cx="' + t[0] + '" cy="' + t[1] + '" r="' + (R - 1) + '"/>' +
          '<text class="' + P + 'num" x="' + t[0] + '" y="' + (t[1] + 7) + '" text-anchor="middle">' + (i + 1) + '</text>';
      });
    }
    return s + '</svg>';
  }
  var ALT_Y = 'Gestern: sechs Bäume. Das Band berührt die fünf Bäume am Rand; der Baum in der Mitte oben links wird nicht berührt.';
  var ALT_T = 'Heute: neun Bäume, die gefällt werden sollen, ohne Band.';
  function figYesterday() { return figure(YESTERDAY, HULL_Y, 115, ALT_Y); }
  function figToday() { return figure(TODAY, null, 570, ALT_T); }
  function figSolution() {
    return figure(TODAY, HULL_T, 570, 'Lösung: Das Band berührt sechs nummerierte Bäume am Rand. Drei Bäume liegen innen im Band.', true);
  }

  var el, api, optsEl, locked, picked, mode, todayBox;

  function optionCard(v, idx) {
    var sel = picked === v;
    var cls = P + 'opt';
    var mark = '';
    if (mode && (mode === 'solution' ? v === RIGHT : sel)) {
      var ok = v === RIGHT;
      cls += ok ? ' right' : ' wrong';
      mark = ok ? '✓' : '✗';
    }
    var input = h('input', { type: 'radio', name: P + 'opt', value: String(v), disabled: locked, 'aria-label': 'Antwort ' + 'ABCD'[idx] + ': ' + v + ' Bäume' });
    input.checked = sel;
    return h('label', { class: cls }, input,
      h('span', { class: P + 'card' },
        h('span', { class: P + 'let' }, 'ABCD'[idx] + ')'),
        h('span', { class: P + 'val' }, v + ' Bäume'),
        mark ? h('span', { class: P + 'mark', 'aria-hidden': 'true' }, mark) : null));
  }
  function render() {
    optsEl.replaceChildren.apply(optsEl, OPTIONS.map(optionCard));
    todayBox.innerHTML = mode === 'solution' ? figSolution() : figToday();
  }
  function onChange(e) {
    if (locked || !e.target.matches('input[type=radio]')) return;
    picked = +e.target.value;
    render();
    var f = optsEl.querySelector('input:checked'); if (f) f.focus();
    api.changed('Antwort ' + 'ABCD'[OPTIONS.indexOf(picked)] + ' gewählt.');
  }

  Biber.register({
    id: 'baeumeband18',
    story: '<p>Die Biber spannen immer ein langes Band um Bäume, die sie fällen wollen.</p>' +
      '<p>Gestern wollten sie sechs Bäume fällen. Das Band hat aber nur fünf Bäume berührt. Aus der Luft sah das so aus (links). ' +
      'Heute wollen die Biber die Bäume rechts fällen.</p>',
    question: 'Wie viele Bäume berührt das gespannte Band diesmal?',
    howto: 'Vergleiche das Bild von gestern mit dem von heute und wähle eine Antwort aus.',
    explanation: function () {
      return '<p>Das Band spannt sich wie ein Gummiband um alle Bäume. Es berührt genau die Bäume, die ganz außen stehen. Hier sind das <b>sechs</b> Bäume. Die drei Bäume in der Mitte liegen innerhalb des Bandes und werden nicht berührt.</p>' +
        '<div class="' + P + 'fig">' + figSolution() + '</div>' +
        '<p><b>Informatik:</b> Das kleinste Vieleck, das alle Punkte einer Menge umschließt, heißt <i>konvexe Hülle</i>. „Konvex“ heißt: Das Band geht zwischen zwei Bäumen nie nach innen. ' +
        'Computer berechnen konvexe Hüllen zum Beispiel in der Mustererkennung, bei der Handschrifterkennung, in Geoinformationssystemen oder um die kleinste Verpackung für einen Gegenstand zu finden. Dafür gibt es Verfahren, die auch bei sehr vielen Punkten schnell sind.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null;
      todayBox = h('div', { class: P + 'panel' });
      optsEl = h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Antworten' });
      var yBox = h('div', { class: P + 'panel' });
      yBox.innerHTML = figYesterday();
      el.replaceChildren(h('div', { class: P + 'box' },
        h('div', { class: P + 'figs' },
          h('figure', { class: P + 'f' }, h('figcaption', null, 'Gestern: sechs Bäume, das Band berührt fünf'), yBox),
          h('figure', { class: P + 'f' }, h('figcaption', null, 'Heute: diese Bäume sollen gefällt werden'), todayBox)),
        optsEl));
      optsEl.addEventListener('change', onChange);
      render();
    },
    isComplete: function () { return picked !== null; },
    evaluate: function () { return { correct: picked === RIGHT, answer: picked }; },
    setAnswer: function (ans) { picked = typeof ans === 'number' ? ans : null; mode = 'check'; render(); },
    lock: function (on) {
      locked = on;
      mode = on ? (mode || 'check') : null;
      render();
    },
    reset: function () { picked = null; mode = null; render(); },
    showSolution: function () { picked = RIGHT; mode = 'solution'; locked = true; render(); }
  });
  /* Selbstprüfung: Die Hülle der heutigen Bäume hat genau die Lösungszahl, die von gestern fünf Ecken */
  if (HULL_T.length !== RIGHT || HULL_Y.length !== 5 || isIn(HULL_T, TODAY[1])) throw new Error('baeumeband18: Lösung stimmt nicht');
})();
