/* Aufgabe Verflixte Tische (Biber 2021, S. 57; Klasse 7-8 schwer, 9-10 mittel, 11-13 leicht): Tastendrücke aus linearen Gleichungen bestimmen */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-tische21-';
  var NS = 'http://www.w3.org/2000/svg';

  var START = [10, 70, 50, 80];          /* Höhen der Tische 1-4 in cm */
  var GOAL = 60;
  /* Wirkung einer Taste auf die Tische 1-4 (in 10-cm-Schritten): T: +,+,+,0   O: 0,-,-,-   M: +,0,+,+ */
  var KEYS = {
    T: { name: 'Taste T (gelb)', eff: [1, 1, 1, 0] },
    O: { name: 'Taste O (rot)', eff: [0, -1, -1, -1] },
    M: { name: 'Taste M (blau)', eff: [1, 0, 1, 1] }
  };
  var KEYORDER = ['T', 'O', 'M'];
  var OPTIONS = [
    { key: 'A', n: { T: 4, O: 5, M: 1 } },
    { key: 'B', n: { T: 5, O: 1, M: 0 } },
    { key: 'C', n: { T: 3, O: 4, M: 2 } },
    { key: 'D', n: { T: 2, O: 4, M: 6 } }
  ];
  var RIGHT = 2;   /* C: im Heft bestätigt; per Skript für alle vier Antworten durchgerechnet (nur C ergibt viermal 60 cm) */

  function heights(n) {
    return START.map(function (s, i) {
      return KEYORDER.reduce(function (sum, k) { return sum + 10 * KEYS[k].eff[i] * n[k]; }, s);
    });
  }
  function keyChip(k, extra) { return '<span class="' + P + 'kc ' + P + 'k-' + k + (extra || '') + '" aria-hidden="true">' + k + '</span>'; }
  function optHtml(o) {
    return 'Drücke ' + KEYORDER.map(function (k) { return o.n[k] + ' × ' + keyChip(k); }).join(', ').replace(/, ([^,]*)$/, ' und $1') + '.';
  }
  function optText(o) {
    return 'Drücke ' + o.n.T + ' mal Taste T, ' + o.n.O + ' mal Taste O und ' + o.n.M + ' mal Taste M';
  }

  var el, api, locked, selected, mark, n, hist, tableEls, labelEls, countEls, radios, undoBtn, liveEl;

  function resetSim() { n = { T: 0, O: 0, M: 0 }; hist = []; }
  function reset() { selected = null; mark = null; resetSim(); }

  /* ---------- Tische zeichnen (Vorderansicht, 0 bis 120 cm) ---------- */
  var FLOOR = 176, SC = 1.3, VMAX = 125;
  function svgEl(name, attrs) {
    var e = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (a) { e.setAttribute(a, attrs[a]); });
    return e;
  }
  function buildTables() {
    var svg = svgEl('svg', { viewBox: '0 0 400 206', class: P + 'svg', role: 'img', 'aria-label': 'Vier Tische mit einstellbarer Höhe und eine gestrichelte Linie bei 60 Zentimetern' });
    var gy = FLOOR - GOAL * SC;
    svg.appendChild(svgEl('line', { x1: 4, x2: 396, y1: FLOOR, y2: FLOOR, class: P + 'floor' }));
    svg.appendChild(svgEl('line', { x1: 4, x2: 396, y1: gy, y2: gy, class: P + 'goal' }));
    var gl = svgEl('text', { x: 396, y: gy - 4, 'text-anchor': 'end', class: P + 'goaltx' });
    gl.textContent = 'Ziel: 60 cm';
    svg.appendChild(gl);
    tableEls = []; labelEls = [];
    START.forEach(function (_, i) {
      var cx = 50 + i * 100;
      var g = svgEl('g', { transform: 'translate(' + cx + ' 0)', class: P + 'tbl' });
      var legL = svgEl('rect', { x: -27, width: 8, class: P + 'leg' });
      var legR = svgEl('rect', { x: 19, width: 8, class: P + 'leg' });
      var top = svgEl('rect', { x: -36, width: 72, height: 9, rx: 3, class: P + 'top' });
      var num = svgEl('text', { x: 0, 'text-anchor': 'middle', class: P + 'num' });
      num.textContent = String(i + 1);
      var foot = svgEl('g', {});
      foot.appendChild(svgEl('rect', { x: -31, y: FLOOR - 4, width: 18, height: 4, rx: 2, class: P + 'foot' }));
      foot.appendChild(svgEl('rect', { x: 13, y: FLOOR - 4, width: 18, height: 4, rx: 2, class: P + 'foot' }));
      var lb = svgEl('text', { x: 0, y: FLOOR + 22, 'text-anchor': 'middle', class: P + 'val' });
      g.appendChild(legL); g.appendChild(legR); g.appendChild(foot); g.appendChild(top); g.appendChild(num); g.appendChild(lb);
      svg.appendChild(g);
      tableEls.push({ top: top, legL: legL, legR: legR, num: num });
      labelEls.push(lb);
    });
    return svg;
  }
  function drawTables() {
    var hs = heights(n);
    hs.forEach(function (v, i) {
      var vis = Math.max(0, Math.min(VMAX, v));
      var topY = FLOOR - 4 - vis * SC - 9 + 4;            /* Oberkante der Tischplatte */
      var t = tableEls[i];
      t.top.style.y = topY + 'px';
      t.top.style.height = '9px';
      [t.legL, t.legR].forEach(function (l) { l.style.y = (topY + 9) + 'px'; l.style.height = Math.max(0, FLOOR - 4 - topY - 9) + 'px'; });
      t.num.style.transform = 'translateY(' + (topY + 7.5) + 'px)';
      t.num.setAttribute('y', 0);
      var ok = v === GOAL;
      labelEls[i].textContent = v + ' cm' + (ok ? ' ✓' : '');
      labelEls[i].setAttribute('class', P + 'val' + (ok ? ' ' + P + 'ok' : ''));
      t.top.setAttribute('class', P + 'top' + (ok ? ' ' + P + 'ok' : ''));
    });
    liveEl.textContent = 'Tisch 1: ' + hs[0] + ' cm, Tisch 2: ' + hs[1] + ' cm, Tisch 3: ' + hs[2] + ' cm, Tisch 4: ' + hs[3] + ' cm.' +
      (hs.every(function (v) { return v === GOAL; }) ? ' Alle Tische stehen auf 60 cm.' : '');
    KEYORDER.forEach(function (k) { countEls[k].textContent = n[k] + '×'; });
    undoBtn.disabled = locked || !hist.length;
  }
  function press(k) {
    if (locked) return;
    n[k]++; hist.push(k);
    drawTables();
  }
  function undo() {
    if (locked || !hist.length) return;
    n[hist.pop()]--;
    drawTables();
  }
  function restart() {
    if (locked) return;
    resetSim();
    drawTables();
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
    if (tableEls) drawTables();
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
    else if (k === ' ' || k === 'Enter') { e.preventDefault(); choose(i, false); return; }
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }

  Biber.register({
    id: 'tische21',
    story:
      '<p>Toll: Im Klassenraum gibt es vier Tische mit elektrisch einstellbarer Höhe! Die Höhe kann mit einer Fernbedienung verändert werden. Sie hat drei Tasten: ' +
      keyChip('T') + ', ' + keyChip('O') + ' und ' + keyChip('M') + '.</p>' +
      '<p>Jemand hat die Fernbedienung umprogrammiert. Jedes Mal, wenn die Tasten gedrückt werden, passiert nun Folgendes:</p>' +
      '<ul class="' + P + 'rules">' +
      '<li>' + keyChip('T') + ' <span><b>erhöht</b> die Tische 1, 2 und 3 um jeweils 10 cm.</span></li>' +
      '<li>' + keyChip('O') + ' <span><b>senkt</b> die Tische 2, 3 und 4 um jeweils 10 cm.</span></li>' +
      '<li>' + keyChip('M') + ' <span><b>erhöht</b> die Tische 1, 3 und 4 um jeweils 10 cm.</span></li></ul>' +
      '<p>Momentan sind die Tische 1, 2, 3 und 4 auf 10 cm, 70 cm, 50 cm und 80 cm eingestellt. Für den Unterricht sollen alle vier Tische auf 60 cm eingestellt werden.</p>',
    question: 'Wie muss man dazu die Tasten drücken?',
    howto: 'Zum Ausprobieren kannst du die Tasten unter den Tischen drücken. Wähle dann die richtige Antwort aus.',
    explanation: function () {
      return '<p>Jede Taste verändert die Tische um 10 cm. Es genügt also zu zählen, wie oft man drückt: <i>t</i> mal T, <i>o</i> mal O, <i>m</i> mal M. Für jeden Tisch gibt es dann eine Gleichung:</p>' +
        '<ul class="' + P + 'eq">' +
        '<li><b>Tisch 1</b> muss um 50 cm höher: <i>t</i> + <i>m</i> = 5</li>' +
        '<li><b>Tisch 2</b> muss um 10 cm tiefer: <i>o</i> − <i>t</i> = 1</li>' +
        '<li><b>Tisch 3</b> muss um 10 cm höher: <i>t</i> + <i>m</i> − <i>o</i> = 1</li>' +
        '<li><b>Tisch 4</b> muss um 20 cm tiefer: <i>o</i> − <i>m</i> = 2</li></ul>' +
        '<p>Nur <b>C</b> (3 × T, 4 × O, 2 × M) erfüllt alle vier Gleichungen. A passt nur zu Tisch 1 und 2, B nur zu Tisch 1, und D zu keinem Tisch.</p>' +
        '<p>Mehrere Gleichungen, die gleichzeitig gelten müssen, nennt man ein lineares Gleichungssystem. Solche Systeme lösen Computer in der Optimierung und in vielen Berechnungen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      var svg = buildTables();
      liveEl = h('p', { class: P + 'live', role: 'status', 'aria-live': 'polite' });
      countEls = {};
      var keyBtns = KEYORDER.map(function (k) {
        var cnt = h('span', { class: P + 'cnt', 'aria-hidden': 'true' }, '0×');
        countEls[k] = cnt;
        return h('button', {
          type: 'button', class: P + 'key ' + P + 'k-' + k, onclick: function () { press(k); },
          'aria-label': KEYS[k].name + ' drücken: ' + (k === 'O' ? 'senkt Tisch 2, 3 und 4' : k === 'T' ? 'erhöht Tisch 1, 2 und 3' : 'erhöht Tisch 1, 3 und 4') + ' um 10 cm'
        }, h('span', { class: P + 'kl', 'aria-hidden': 'true' }, k), cnt);
      });
      undoBtn = h('button', { type: 'button', class: 'btn ghost ' + P + 'small', onclick: undo }, 'Rückgängig');
      var restartBtn = h('button', { type: 'button', class: 'btn ghost ' + P + 'small', onclick: restart }, 'Von vorn');
      radios = OPTIONS.map(function (o, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': o.key,
          'aria-label': 'Antwort ' + o.key + ': ' + optText(o),
          onclick: function () { choose(i, false); }, onkeydown: onKey
        });
        btn.innerHTML = '<span class="' + P + 'okey" aria-hidden="true">' + o.key + ')</span><span class="' + P + 'otxt">' + optHtml(o) + '</span>';
        return btn;
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { class: P + 'lab', 'aria-label': 'Zum Ausprobieren: die Fernbedienung' },
          h('h3', null, 'Zum Ausprobieren'),
          h('div', { class: P + 'stage' }, svg),
          liveEl,
          h('div', { class: P + 'remote' }, h('div', { class: P + 'keys', role: 'group', 'aria-label': 'Fernbedienung' }, keyBtns),
            h('div', { class: P + 'ctl' }, undoBtn, restartBtn))),
        h('section', { 'aria-label': 'Antworten' }, h('h3', null, 'Welche Antwort stimmt?'),
          h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Antworten' }, radios))));
      refresh();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () {
      return { correct: selected === RIGHT, answer: { choice: OPTIONS[selected].key } };
    },
    setAnswer: function (ans) {
      var i = OPTIONS.map(function (o) { return o.key; }).indexOf(ans && ans.choice);
      selected = i >= 0 ? i : null;
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      [].forEach.call(el.querySelectorAll('.' + P + 'key'), function (b) { b.disabled = on; });
      refresh();
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () {
      selected = RIGHT; mark = 'solution'; locked = true;
      n = { T: OPTIONS[RIGHT].n.T, O: OPTIONS[RIGHT].n.O, M: OPTIONS[RIGHT].n.M }; hist = [];
      [].forEach.call(el.querySelectorAll('.' + P + 'key'), function (b) { b.disabled = true; });
      refresh();
    }
  });
})();
