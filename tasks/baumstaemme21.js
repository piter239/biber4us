/* Aufgabe Baumstämme (Biber 2021; Klasse 11-13 schwer): Gnome-Sort / Zwerg-Sortieren, Schrittzahl im besten und schlechtesten Fall */
(function () {
  'use strict';
  var h = Biber.h, S = Biber.svg;
  var P = 't-baumstaemme21-';

  var OPTIONS = [
    { key: 'A', text: '3 bis 39 Schritte' },
    { key: 'B', text: '30 bis 90 Schritte' },
    { key: 'C', text: '39 bis 81 Schritte' },
    { key: 'D', text: '39 bis 1521 Schritte' }
  ];
  var RIGHT = 3;   /* D: im Heft bestätigt; per Skript geprüft (sortiert: n-1 = 39 Schritte, umgekehrt: (n-1)^2 = 1521, für n bis 7 alle Anordnungen) */

  /* ---------- Simulation (Hamid steht in Lücke p zwischen Stamm p und p+1; p = n-1: rechts von allen) ---------- */
  function run(arr) {   /* Schrittzahl bis zum Ende */
    var a = arr.slice(), n = a.length, p = 0, steps = 0, t;
    while (p < n - 1) {
      if (a[p + 1] < a[p]) { t = a[p]; a[p] = a[p + 1]; a[p + 1] = t; if (p > 0) { p--; steps++; } }
      else { p++; steps++; }
    }
    return steps;
  }
  (function selfTest() {
    var up = [], down = [], i;
    for (i = 1; i <= 40; i++) { up.push(i); down.unshift(i); }
    if (run([1, 2, 3, 4]) !== 3 || run([4, 3, 2, 1]) !== 9 || run(up) !== 39 || run(down) !== 1521) throw new Error('baumstaemme21: Simulation stimmt nicht');
  })();

  var W = 560, GAP = 60, BASE = 205, UNIT = 17, MINH = 26;
  var EXAMPLE = [2, 4, 3, 1];

  var el, api, locked, selected, mark;
  var n, logs, p, steps, lastMsg, kind, timer;
  var svg, logEls, hamidEl, statusEl, stepsEl, stepBtn, autoBtn, nLabel, radios, nextId;

  function sorted() { for (var i = 1; i < logs.length; i++) if (logs[i].len < logs[i - 1].len) return false; return true; }
  function shuffled(m) {
    var a = [], i, j, t;
    for (i = 1; i <= m; i++) a.push(i);
    do {
      for (i = m - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; }
    } while (m > 2 && a.every(function (v, k) { return v === k + 1; }));
    return a;
  }
  function arrangement(k, m) {
    var a = [], i;
    if (k === 'example' && m === 4) return EXAMPLE.slice();
    if (k === 'sorted') { for (i = 1; i <= m; i++) a.push(i); return a; }
    if (k === 'reverse') { for (i = m; i >= 1; i--) a.push(i); return a; }
    return shuffled(m);
  }
  function setup(k) {
    stopAuto();
    if (k) kind = k;
    if (kind === 'example' && n !== 4) kind = 'shuffle';
    logs = arrangement(kind, n).map(function (len, i) { return { len: len, id: i }; });
    p = 0; steps = 0;
    lastMsg = 'Hamid startet ganz links, zwischen Stamm 1 und Stamm 2.';
    buildLogs();
    update(false);
  }

  /* ---------- Zeichnen ---------- */
  function x0() { return (W - n * GAP) / 2; }
  function cx(i) { return x0() + i * GAP + GAP / 2; }
  function hamidX() { return p >= n - 1 ? cx(n - 1) + 46 : (cx(p) + cx(p + 1)) / 2; }

  function buildLogs() {
    var kids = [
      S('rect', { class: P + 'water', x: 0, y: 0, width: W, height: 262, rx: 14 }),
      S('path', { class: P + 'ripple', d: 'M30 238q10-8 20 0t20 0M470 40q10-8 20 0t20 0M60 60q10-8 20 0t20 0M440 238q10-8 20 0t20 0' })
    ];
    logEls = logs.map(function (lg) {
      var hgt = MINH + lg.len * UNIT;
      var g = S('g', { class: P + 'log' }, [
        S('rect', { class: P + 'bark', x: -14, y: BASE - hgt, width: 28, height: hgt, rx: 8 }),
        S('path', { class: P + 'grain', d: 'M-5 ' + (BASE - hgt + 12) + 'V' + (BASE - 10) + 'M5 ' + (BASE - hgt + 22) + 'V' + (BASE - 16) }),
        S('ellipse', { class: P + 'top', cx: 0, cy: BASE - hgt + 3, rx: 14, ry: 5 })
      ]);
      kids.push(g);
      return g;
    });
    hamidEl = S('g', { class: P + 'hamid' }, [
      S('path', { class: P + 'wave', d: 'M-30 14q8-7 15 0t15 0t15 0t15 0' }),
      S('ellipse', { class: P + 'ear', cx: -13, cy: -9, rx: 5, ry: 5 }),
      S('ellipse', { class: P + 'ear', cx: 13, cy: -9, rx: 5, ry: 5 }),
      S('ellipse', { class: P + 'head', cx: 0, cy: 3, rx: 19, ry: 16 }),
      S('ellipse', { class: P + 'snout', cx: 0, cy: 9, rx: 10, ry: 7 }),
      S('ellipse', { class: P + 'nose', cx: 0, cy: 5, rx: 4, ry: 3 }),
      S('rect', { class: P + 'tooth', x: -4, y: 10, width: 4, height: 7, rx: 1 }),
      S('rect', { class: P + 'tooth', x: 0, y: 10, width: 4, height: 7, rx: 1 }),
      S('circle', { class: P + 'eye', cx: -8, cy: -2, r: 2.4 }),
      S('circle', { class: P + 'eye', cx: 8, cy: -2, r: 2.4 }),
      S('text', { class: P + 'name', x: 0, y: 42, 'text-anchor': 'middle' }, 'Hamid')
    ]);
    kids.push(hamidEl);
    svg.replaceChildren.apply(svg, kids);
    place();
  }
  function place() {
    logs.forEach(function (lg, i) { logEls[lg.id].setAttribute('transform', 'translate(' + cx(i) + ' 0)'); });
    hamidEl.setAttribute('transform', 'translate(' + hamidX() + ' ' + (BASE + 22) + ')');
  }
  function update(announce) {
    place();
    var seq = logs.map(function (l) { return l.len; }).join(', ');
    svg.setAttribute('aria-label', n + ' Baumstämme mit den Längen von links nach rechts: ' + seq + '. Hamid ist ' +
      (p >= n - 1 ? 'rechts von allen Stämmen' : 'zwischen Stamm ' + (p + 1) + ' und Stamm ' + (p + 2)) + '.');
    stepsEl.textContent = String(steps);
    statusEl.textContent = lastMsg;
    var fin = p >= n - 1;
    stepBtn.disabled = fin;
    autoBtn.disabled = fin;
    nLabel.textContent = String(n);
    el.querySelector('.' + P + 'dec').disabled = n <= 3;
    el.querySelector('.' + P + 'inc').disabled = n >= 8;
  }
  function step() {
    if (p >= n - 1) return;
    var a = logs[p], b = logs[p + 1], na = a.len, nb = b.len;
    if (nb < na) {
      logs[p] = b; logs[p + 1] = a;
      if (p > 0) { p--; steps++; lastMsg = 'Hamid vergleicht ' + na + ' und ' + nb + ': Der rechte ist kürzer, also vertauscht er die beiden und schwimmt einen Schritt nach links.'; }
      else lastMsg = 'Hamid vergleicht ' + na + ' und ' + nb + ': vertauscht. Er ist schon ganz links und macht keinen Schritt.';
    } else {
      p++; steps++;
      lastMsg = 'Hamid vergleicht ' + na + ' und ' + nb + ': Das passt schon, also schwimmt er einen Schritt nach rechts.';
    }
    if (p >= n - 1) { lastMsg += ' Er ist rechts von allen Stämmen angekommen: fertig nach ' + steps + ' Schritten.'; stopAuto(); }
    update(true);
  }
  function stopAuto() { if (timer) { clearInterval(timer); timer = null; } if (autoBtn) autoBtn.textContent = 'Automatisch abspielen'; }
  function toggleAuto() {
    if (timer) { stopAuto(); return; }
    if (p >= n - 1) return;
    autoBtn.textContent = 'Anhalten';
    timer = setInterval(function () { if (!el || !el.isConnected) return stopAuto(); step(); }, 650);
  }

  /* ---------- Antwortkarten ---------- */
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
    selected = i; refresh();
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

  Biber.register({
    id: 'baumstaemme21',
    story:
      '<p>Im See liegen unterschiedlich lange Baumstämme. Hamid soll sie der Länge nach sortieren: von kurz nach lang. Dafür schwimmt er schrittweise an den Stämmen vorbei. Nach jedem Schritt ist er zwischen zwei Stämmen. Er startet zwischen den beiden Stämmen ganz links.</p>' +
      '<p>Wenn Hamid zwischen zwei Stämmen ist, vergleicht er deren Längen. Er vertauscht die Stämme, wenn der rechte Stamm kürzer als der linke ist. Wenn er die beiden Stämme vertauscht hat und nicht schon ganz links ist, macht er einen Schritt nach links; wenn er die Stämme nicht vertauscht hat, macht er einen Schritt nach rechts. Dies alles wiederholt er, bis er rechts von den Baumstämmen angekommen ist.</p>' +
      '<p>Das Beispiel (unten zum Ausprobieren) zeigt, wie Hamid 4 Baumstämme sortiert. Die Anzahl der Schritte hängt davon ab, wie die Stämme am Anfang liegen. Für 4 Stämme muss Hamid mindestens 3 Schritte machen (wenn die Stämme bereits richtig sortiert sind) und höchstens 9 Schritte (wenn sie umgekehrt sortiert sind, von lang nach kurz). Bei 4 Baumstämmen muss er also mit 3 bis 9 Schritten rechnen. Hamid muss nun <strong>40</strong> Baumstämme sortieren.</p>',
    question: 'Mit wie vielen Schritten muss er rechnen?',
    howto: 'Wähle eine Antwort. Wenn du willst, lass Hamid vorher mit wenigen Stämmen üben: „Schritt“ zeigt jeweils einen Vergleich, und der Zähler zählt nur seine Schritte nach links und rechts.',
    explanation: function () {
      return '<p>Im besten Fall sind alle 40 Stämme schon sortiert. Dann vertauscht Hamid nie und geht nur nach rechts: <strong>39 Schritte</strong> (allgemein n − 1). Damit scheiden A und B aus, die kleinere Zahlen nennen.</p>' +
        '<p>Im schlechtesten Fall liegen die Stämme umgekehrt sortiert. Jeder neue Stamm muss dann ganz nach links „durchgetauscht“ werden. Hamid schwimmt also erst 1 Schritt hin und zurück, dann 2, dann 3 … bis n − 2, und am Ende noch n − 1 Schritte nach rechts. Insgesamt sind das (n − 1)² Schritte, für n = 40 also <strong>1521</strong>. Richtig ist <strong>D</strong>; C ist falsch, weil 81 viel zu wenig wäre.</p>' +
        '<p>Informatik: Das Verfahren ist ein einfaches Sortierverfahren („Gnome Sort“). Der Aufwand wächst im schlechtesten Fall quadratisch mit der Zahl der Elemente: doppelt so viele Stämme bedeuten ungefähr viermal so viele Schritte.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; selected = null; mark = null; n = 4; kind = 'example'; nextId = 0;
      svg = S('svg', { class: P + 'svg', viewBox: '0 0 ' + W + ' 262', role: 'img', 'aria-label': 'Baumstämme' });
      statusEl = h('p', { class: P + 'status', role: 'status', 'aria-live': 'polite' });
      stepsEl = h('b', null, '0');
      stepBtn = h('button', { type: 'button', class: P + 'btn ' + P + 'primary', onclick: function () { stopAuto(); step(); } }, 'Schritt');
      autoBtn = h('button', { type: 'button', class: P + 'btn', onclick: toggleAuto }, 'Automatisch abspielen');
      nLabel = h('b', { 'aria-live': 'polite' }, '4');
      var arr = [['example', 'Beispiel aus der Aufgabe'], ['sorted', 'Schon sortiert'], ['reverse', 'Umgekehrt sortiert'], ['shuffle', 'Mischen']].map(function (k) {
        return h('button', { type: 'button', class: P + 'btn', onclick: function () { setup(k[0]); } }, k[1]);
      });
      var lab = h('div', { class: P + 'ctl' },
        h('span', { class: P + 'chip' }, 'Schritte von Hamid: ', stepsEl),
        h('span', { class: P + 'chip ' + P + 'cnt' }, 'Stämme: ',
          h('button', { type: 'button', class: P + 'sq ' + P + 'dec', 'aria-label': 'Einen Stamm weniger', onclick: function () { if (n > 3) { n--; setup(kind === 'example' ? 'shuffle' : null); } } }, '−'),
          nLabel,
          h('button', { type: 'button', class: P + 'sq ' + P + 'inc', 'aria-label': 'Einen Stamm mehr', onclick: function () { if (n < 8) { n++; setup(kind === 'example' ? 'shuffle' : null); } } }, '+')));
      radios = OPTIONS.map(function (o, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': o.key,
          'aria-label': 'Antwort ' + o.key + ': ' + o.text, onclick: function () { choose(i, false); }, onkeydown: onKey
        });
        btn.innerHTML = '<span class="' + P + 'key" aria-hidden="true">' + o.key + ')</span><span class="' + P + 'txt">' + o.text + '</span>';
        return btn;
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { class: P + 'lab', 'aria-label': 'Zum Ausprobieren: Hamid sortiert' },
          h('h3', null, 'Zum Ausprobieren: Hamid sortiert'),
          svg, lab,
          h('div', { class: P + 'row' }, stepBtn, autoBtn),
          h('div', { class: P + 'row' }, arr),
          statusEl),
        h('section', { class: P + 'ans', 'aria-label': 'Antwort' },
          h('h3', null, 'Bei 40 Stämmen'),
          h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Antworten' }, radios))));
      setup('example');
      refresh();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () { return { correct: selected === RIGHT, answer: { choice: OPTIONS[selected].key } }; },
    setAnswer: function (ans) {
      var i = OPTIONS.map(function (o) { return o.key; }).indexOf(ans && ans.choice);
      selected = i >= 0 ? i : null; mark = 'check'; refresh();
    },
    lock: function (on) {
      locked = on; mark = on ? (mark === 'solution' ? 'solution' : 'check') : null; refresh();
    },
    reset: function () { selected = null; mark = null; n = 4; setup('example'); refresh(); },
    showSolution: function () { selected = RIGHT; mark = 'solution'; locked = true; refresh(); }
  });
})();
