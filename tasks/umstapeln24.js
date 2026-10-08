/* Aufgabe Umstapeln (Biber 2024; Klasse 11-13 schwer): Welcher neue Ziegelstapel entsteht, wenn Stein für Stein nach Bobs Methode umgestapelt wird? */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-umstapeln24-';

  /* Stapel von oben nach unten: Reihen mit 4, 3, 4, 3, 4 Steinen. S = Stern, W = Welle, C = Kreis.
     Ein Stein liegt auf den ein oder zwei Steinen der Reihe darunter, die er überdeckt. */
  var WIDTH = [4, 3, 4, 3, 4];
  var OFF = [0, 4, 7, 11, 14];
  var N = 18;
  var START = 'SWSC WWS CSWW WCS SWSC'.replace(/ /g, '').split('');
  var OPTIONS = [
    { key: 'A', rows: 'SCWW WWS WSSW WSS SCCC' },
    { key: 'B', rows: 'SCWW WWS WCSW CSC SSWS' },
    { key: 'C', rows: 'SCWC WSS CSSW CSS WWWW' },
    { key: 'D', rows: 'SWWS SCC WCWW SSC SWSW' }
  ].map(function (o) { o.types = o.rows.replace(/ /g, '').split(''); return o; });
  var RIGHT = 3;   /* D: im Heft bestätigt (S. 69) und per Skript durchgerechnet: nur D lässt sich durch Umstapeln nach Bobs Methode erzeugen */
  /* Reihenfolge aus dem Heft (S. 70): Stein k vom ersten Stapel wird als k-ter Stein auf den neuen Stapel gelegt (nach Antwort D) */
  var NUM_OLD = [1, 2, 3, 5, 4, 7, 6, 9, 8, 10, 11, 15, 12, 13, 16, 17, 18, 14];
  var NUM_NEW = [16, 15, 17, 18, 13, 12, 14, 11, 9, 7, 10, 8, 6, 5, 1, 2, 3, 4];

  /* ---------- Geometrie ---------- */
  var ROWOF = [], COLOF = [];
  (function () { var r, j; for (r = 0; r < 5; r++) for (j = 0; j < WIDTH[r]; j++) { ROWOF.push(r); COLOF.push(j); } })();
  function idOf(r, j) { return OFF[r] + j; }
  var SUP = [];   /* Steine der Reihe darunter, auf denen Stein i liegt */
  var ABOVE = []; /* Steine der Reihe darüber, die auf Stein i liegen */
  (function () {
    var i;
    for (i = 0; i < N; i++) { SUP.push([]); ABOVE.push([]); }
    for (i = 0; i < N; i++) {
      var r = ROWOF[i], j = COLOF[i];
      if (r === 4) continue;
      var cand = WIDTH[r] === 3 ? [j, j + 1] : [j - 1, j];
      cand.forEach(function (k) { if (k >= 0 && k < WIDTH[r + 1]) { SUP[i].push(idOf(r + 1, k)); ABOVE[idOf(r + 1, k)].push(i); } });
    }
  })();

  /* ---------- Zeichnen ---------- */
  var BW = 44, BH = 24, GAP = 3;
  var FILL = { S: '#c8722f', W: '#ecc9b0', C: '#5b4849' };
  var NAME = { S: 'Stern', W: 'Welle', C: 'Kreis' };
  var NAME_ACC = { S: 'Stern-Stein', W: 'Wellen-Stein', C: 'Kreis-Stein' };
  function bx(i) { return COLOF[i] * (BW + GAP) + (WIDTH[ROWOF[i]] === 3 ? (BW + GAP) / 2 : 0); }
  function by(i) { return ROWOF[i] * (BH + GAP); }
  function symbol(t, cx, cy) {
    if (t === 'S') {
      var pts = [], k, a, rr;
      for (k = 0; k < 10; k++) { a = -Math.PI / 2 + k * Math.PI / 5; rr = k % 2 ? 3.4 : 8; pts.push((cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1)); }
      return '<polygon points="' + pts.join(' ') + '" fill="#6b3508"/>';
    }
    if (t === 'W') return '<path d="M' + (cx - 9) + ' ' + (cy + 1.5) + 'Q' + (cx - 4.5) + ' ' + (cy - 6) + ' ' + cx + ' ' + cy + 'T' + (cx + 9) + ' ' + (cy - 1.5) + '" fill="none" stroke="#b5876b" stroke-width="3" stroke-linecap="round"/>';
    return '<circle cx="' + cx + '" cy="' + cy + '" r="5.2" fill="none" stroke="#a58d8d" stroke-width="2.8"/>';
  }
  function brick(i, t, o) {   /* o: {cls, num, extra} */
    var x = bx(i), y = by(i);
    return '<rect class="' + P + 'brick ' + (o.cls || '') + '" x="' + x + '" y="' + y + '" width="' + BW + '" height="' + BH + '" rx="5" fill="' + FILL[t] + '"/>' +
      (o.num ? '<text class="' + P + 'num" x="' + (x + BW / 2) + '" y="' + (y + BH / 2 + 6) + '" text-anchor="middle" fill="' + (t === 'W' ? '#3b1d0a' : '#ffffff') + '">' + o.num + '</text>' : symbol(t, x + BW / 2, y + BH / 2));
  }
  var VB = '-3 -3 ' + (4 * BW + 3 * GAP + 6) + ' ' + (5 * BH + 4 * GAP + 6);
  function describeRows(types) {
    var out = [], r;
    for (r = 0; r < 5; r++) {
      var s = [], j;
      for (j = 0; j < WIDTH[r]; j++) s.push(NAME[types[idOf(r, j)]]);
      out.push('Reihe ' + (r + 1) + ' von oben: ' + s.join(', '));
    }
    return out.join('. ');
  }
  function staticSvg(types, nums, label, cls) {
    var out = '', i;
    for (i = 0; i < N; i++) out += brick(i, types[i], { num: nums ? nums[i] : 0 });
    return '<svg class="' + P + 'stack ' + (cls || '') + '" viewBox="' + VB + '" role="img" aria-label="' + label + '">' + out + '</svg>';
  }

  /* ---------- Zustand ---------- */
  var el, api, radios, selected, locked, mark;
  var sim, simBox, statusEl, undoBtn, oldHost, newHost;

  function resetChoice() { selected = null; mark = null; }
  function newSim() { sim = { removed: [], from: [], hist: [], pick: null }; for (var i = 0; i < N; i++) { sim.removed.push(false); sim.from.push(null); } }
  function isFree(b) { return !sim.removed[b] && ABOVE[b].every(function (a) { return sim.removed[a]; }); }
  function canPlace(p) { return sim.from[p] === null && SUP[p].every(function (s) { return sim.from[s] !== null; }); }
  function placedTypes() { return sim.from.map(function (f) { return f === null ? null : START[f]; }); }

  function renderSim() {
    var focusKey = document.activeElement && simBox.contains(document.activeElement) ? (document.activeElement.getAttribute('data-old') !== null ? 'o' + document.activeElement.getAttribute('data-old') : document.activeElement.getAttribute('data-new') !== null ? 'n' + document.activeElement.getAttribute('data-new') : null) : null;
    var o = '', n = '', i, done = sim.hist.length === N;
    for (i = 0; i < N; i++) {
      var rowTxt = ' (Reihe ' + (ROWOF[i] + 1) + ' von oben, Stelle ' + (COLOF[i] + 1) + ')';
      if (sim.removed[i]) {
        o += '<g class="' + P + 'gone" aria-hidden="true"><rect x="' + bx(i) + '" y="' + by(i) + '" width="' + BW + '" height="' + BH + '" rx="5"/></g>';
      } else {
        var free = isFree(i), sel = sim.pick === i;
        o += '<g class="' + P + 'cell' + (free ? ' ' + P + 'free' : '') + (sel ? ' ' + P + 'sel' : '') + '" data-old="' + i + '"' +
          (free ? ' tabindex="0" role="button" aria-pressed="' + sel + '" aria-label="' + NAME_ACC[START[i]] + rowTxt + ', frei: kein Stein liegt darauf' + (sel ? ', ausgewählt' : '') + '"'
                : ' aria-label="' + NAME_ACC[START[i]] + rowTxt + ', nicht frei: es liegt noch ein Stein darauf" role="img"') + '>' +
          brick(i, START[i], { cls: sel ? P + 'selbrick' : '' }) + '</g>';
      }
      if (sim.from[i] !== null) {
        n += '<g role="img" aria-label="' + NAME_ACC[START[sim.from[i]]] + rowTxt + '">' + brick(i, START[sim.from[i]], {}) + '</g>';
      } else {
        var ok = sim.pick !== null && canPlace(i);
        n += '<g class="' + P + 'slot' + (ok ? ' ' + P + 'ok' : '') + '"' + (ok ? ' data-new="' + i + '" tabindex="0" role="button" aria-label="Hier ablegen' + rowTxt + '"' : ' aria-hidden="true"') + '>' +
          '<rect x="' + bx(i) + '" y="' + by(i) + '" width="' + BW + '" height="' + BH + '" rx="5"/></g>';
      }
    }
    oldHost.innerHTML = '<svg class="' + P + 'stack" viewBox="' + VB + '" role="group" aria-label="Bobs erster Stapel">' + o + '</svg>';
    newHost.innerHTML = '<svg class="' + P + 'stack" viewBox="' + VB + '" role="group" aria-label="Der neue Stapel">' + n + '</svg>';
    undoBtn.disabled = sim.hist.length === 0;
    var msg;
    if (done) {
      var t = placedTypes(), hit = OPTIONS.filter(function (op) { return op.types.join('') === t.join(''); })[0];
      msg = 'Alle 18 Steine sind umgestapelt. ' + (hit ? 'Dein neuer Stapel sieht aus wie Antwort ' + hit.key + '.' : 'Dein neuer Stapel passt zu keiner der Antworten A bis D.');
    } else if (sim.pick === null) msg = sim.hist.length + ' von 18 Steinen umgestapelt. Tippe einen Stein an, auf dem kein anderer liegt (heller Rand).';
    else msg = 'Der ' + NAME_ACC[START[sim.pick]] + ' ist ausgewählt. Tippe auf eine markierte Stelle im neuen Stapel, an der er liegen darf.';
    statusEl.textContent = msg;
    if (focusKey) {
      var t2 = simBox.querySelector('[data-' + (focusKey[0] === 'o' ? 'old' : 'new') + '="' + focusKey.slice(1) + '"][tabindex]');
      if (t2) t2.focus();
    }
  }
  function simAct(e) {
    var o = e.target.closest('[data-old]'), n = e.target.closest('[data-new]');
    if (o) {
      var b = +o.getAttribute('data-old');
      if (!isFree(b)) return;
      sim.pick = sim.pick === b ? null : b;
      renderSim();
    } else if (n && sim.pick !== null) {
      var p = +n.getAttribute('data-new');
      if (!canPlace(p)) return;
      sim.from[p] = sim.pick; sim.removed[sim.pick] = true; sim.hist.push([sim.pick, p]); sim.pick = null;
      renderSim();
    }
  }
  function simKey(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.target.closest('[data-old],[data-new]')) { e.preventDefault(); simAct(e); }
    }
  }
  function undo() {
    var last = sim.hist.pop();
    if (!last) return;
    sim.removed[last[0]] = false; sim.from[last[1]] = null; sim.pick = null;
    renderSim();
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

  Biber.register({
    id: 'umstapeln24',
    story:
      '<p>Bob hat einige Ziegelsteine ordentlich gestapelt. Nun soll er den Stapel woanders neu aufbauen. Damit auch der neue Stapel ordentlich wird, arbeitet Bob nach dieser Methode, Stein für Stein, bis alle Steine umgestapelt sind:</p>' +
      '<ul><li>Er nimmt irgendeinen Stein, auf dem kein anderer Stein liegt, vom Stapel und</li>' +
      '<li>legt ihn auf den neuen Stapel, entweder auf den Boden oder auf einen oder zwei andere Steine, keinesfalls aber unter einen anderen Stein.</li></ul>' +
      '<p>Unten siehst du Bobs ersten Stapel (links) und den Platz für den neuen Stapel (rechts).</p>',
    question: 'Wie kann Bobs neuer Stapel aussehen, wenn er fertig ist?',
    howto: 'Wähle unten eine Antwort. Zum Ausprobieren kannst du Bobs Methode selbst durchführen: Tippe einen freien Stein im ersten Stapel an und dann die Stelle im neuen Stapel, an die er soll.',
    explanation: function () {
      return '<p>Bob kann die Steine nicht in beliebiger Reihenfolge umstapeln. Im ersten Stapel muss jeder Stein <strong>nach</strong> allen Steinen drankommen, die auf ihm liegen. Im neuen Stapel muss er <strong>vor</strong> allen Steinen drankommen, die auf ihm liegen werden. ' +
        'Bei <strong>D</strong> klappt das: Mit der Reihenfolge unten (die Zahlen geben an, als wievielter Stein er umgestapelt wird) ist jeder Stein frei, wenn er drankommt, und der neue Stapel wächst von unten nach oben.</p>' +
        '<div class="' + P + 'pair"><figure><figcaption>Erster Stapel</figcaption>' + staticSvg(START, NUM_OLD, 'Bobs erster Stapel, die Steine sind in der Reihenfolge des Umstapelns nummeriert. ' + describeRows(START)) + '</figure>' +
        '<figure><figcaption>Neuer Stapel (Antwort D)</figcaption>' + staticSvg(OPTIONS[3].types, NUM_NEW, 'Neuer Stapel von Antwort D mit denselben Nummern. ' + describeRows(OPTIONS[3].types)) + '</figure></div>' +
        '<p>Die anderen Stapel gehen nicht. <strong>C:</strong> In der unteren Reihe liegen vier Wellen-Steine. Ein zweiter Wellen-Stein wird frühestens als dritter Stein frei, aber die ersten beiden Steine müssen schon in die untere Reihe. <strong>A:</strong> Drei Kreis-Steine in der unteren Reihe gehen nicht, weil der zweite Kreis-Stein frühestens als 10. Stein frei wird und der dritte frühestens als 11., die untere Reihe aber spätestens mit dem 10. Stein fertig sein muss. ' +
        '<strong>B:</strong> Vor dem vierten Wellen-Stein müssten mindestens drei Kreis-Steine auf den neuen Stapel gelegt werden, im ersten Stapel können aber höchstens zwei Kreis-Steine vor dem vierten Wellen-Stein umgestapelt werden.</p>' +
        '<p>In der Informatik nennt man das eine unvollständige Ordnung: Für manche Paare steht fest, welcher Stein zuerst drankommt, für andere nicht. Eine Reihenfolge, die alle Vorgaben erfüllt, findet man mit einer <em>topologischen Sortierung</em>. Das braucht man zum Beispiel, um Arbeitsschritte oder Software-Installationen zu planen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; resetChoice(); newSim();
      oldHost = h('div', { class: P + 'host' });
      newHost = h('div', { class: P + 'host' });
      statusEl = h('p', { class: P + 'status', role: 'status', 'aria-live': 'polite' });
      undoBtn = h('button', { type: 'button', class: 'btn ghost ' + P + 'tool', onclick: undo }, 'Schritt zurück');
      simBox = h('section', { class: P + 'sim', 'aria-label': 'Zum Ausprobieren: Stapel selbst umbauen' },
        h('h3', null, 'Zum Ausprobieren'),
        h('div', { class: P + 'pair' },
          h('figure', null, h('figcaption', null, 'Bobs erster Stapel'), oldHost),
          h('figure', null, h('figcaption', null, 'Neuer Stapel'), newHost)),
        statusEl,
        h('div', { class: P + 'tools' }, undoBtn,
          h('button', { type: 'button', class: 'btn ghost ' + P + 'tool', onclick: function () { newSim(); renderSim(); } }, 'Neu beginnen')));
      simBox.addEventListener('click', simAct);
      simBox.addEventListener('keydown', simKey);
      radios = OPTIONS.map(function (o, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': o.key,
          'aria-label': 'Antwort ' + o.key + '. ' + describeRows(o.types),
          onclick: function () { choose(i, false); }, onkeydown: onKey
        });
        btn.innerHTML = '<span class="' + P + 'key" aria-hidden="true">' + o.key + ')</span>' + staticSvg(o.types, null, '', P + 'optsvg').replace('role="img" aria-label=""', 'aria-hidden="true"');
        return btn;
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        simBox,
        h('section', { 'aria-label': 'Antworten' }, h('h3', null, 'Wie kann der neue Stapel aussehen?'),
          h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Antworten' }, radios))));
      renderSim();
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
    reset: function () { resetChoice(); newSim(); renderSim(); refresh(); },
    showSolution: function () { selected = RIGHT; mark = 'solution'; locked = true; refresh(); }
  });
})();
