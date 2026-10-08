/* Aufgabe Karotten pflanzen (Biber 2023; Klasse 3-4 schwer, 7-8 einfach): Roboterprogramm rückwärts auswerten (Sequenz) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-karotten23-';

  var NAMES = ['A', 'B', 'C', 'D'];
  /* L = nach links springen, R = nach rechts springen, P = Samen pflanzen */
  var PROGRAM = ['R', 'P', 'L', 'P', 'L', 'L', 'P'];
  var RIGHT = [0, 2, 3];   /* Hügel A, C, D (Heft: "zuerst auf D, dann auf C und zuletzt auf A") */

  /* ---------- Auswertung des Programms (zum Absichern und zum Ausprobieren) ---------- */
  function run(start) {
    var pos = start, visited = [start], seeds = [], steps = [], ok = true;
    PROGRAM.forEach(function (ins, i) {
      if (!ok) return;
      if (ins === 'P') { seeds.push(pos); steps.push({ i: i, ins: ins, from: pos, to: pos }); return; }
      var to = pos + (ins === 'L' ? -1 : 1);
      steps.push({ i: i, ins: ins, from: pos, to: to });
      if (to < 0 || to > 3) { ok = false; return; }
      pos = to;
      if (visited.indexOf(pos) < 0) visited.push(pos);
    });
    return { ok: ok && visited.length === 4, inside: ok, seeds: seeds, steps: steps, visited: visited };
  }
  /* Brute Force: Welche Startpunkte erfüllen die Angabe "auf genau vier Hügeln gewesen"? */
  var STARTS = [0, 1, 2, 3].filter(function (s) { return run(s).ok; });   /* nur Hügel C (Index 2) */

  /* ---------- Zeichnen ---------- */
  var HX = [52, 136, 220, 304];
  function hillPath(cx, y) { return 'M' + (cx - 42) + ' ' + (y + 42) + ' C' + (cx - 34) + ' ' + (y + 14) + ' ' + (cx - 18) + ' ' + y + ' ' + cx + ' ' + y + ' S' + (cx + 34) + ' ' + (y + 14) + ' ' + (cx + 42) + ' ' + (y + 42) + ' Z'; }
  function seedSvg(cx, cy, cls) {
    return '<g class="' + P + 'seed ' + (cls || '') + '" transform="translate(' + cx + ' ' + cy + ') rotate(-12)"><ellipse rx="6.5" ry="10"/><path d="M0 -7 V7 M-3 -4 V4 M3 -4 V4"/></g>';
  }
  function iconSvg(kind) {
    var a = '<path class="' + P + 'hill" d="M10 58 C14 48 20 44 28 44 S42 48 46 58 Z"/>';
    if (kind === 'L') return '<svg viewBox="0 0 56 62" aria-hidden="true">' + a + '<path class="' + P + 'jump" d="M46 26 Q34 -2 14 26"/><path class="' + P + 'jump" d="M7 18 L14 27 L22 21"/></svg>';
    if (kind === 'R') return '<svg viewBox="0 0 56 62" aria-hidden="true">' + a + '<path class="' + P + 'jump" d="M10 26 Q22 -2 42 26"/><path class="' + P + 'jump" d="M49 18 L42 27 L34 21"/></svg>';
    return '<svg viewBox="0 0 56 62" aria-hidden="true">' + a + seedSvg(28, 15) + '<path class="' + P + 'jump" d="M28 28 V43 M21 37 L28 44 L35 37"/></svg>';
  }
  function insName(c) { return c === 'L' ? 'Springe nach links' : c === 'R' ? 'Springe nach rechts' : 'Pflanze einen Samen'; }

  function hillsSvg(opts) {
    /* opts: {seeds:[idx], run:result|null, label} */
    var out = '<svg class="' + P + 'hills" viewBox="-26 0 408 138" role="img" aria-label="' + opts.label + '"><rect class="' + P + 'sky" x="-26" y="0" width="408" height="138" rx="10"/>';
    var i;
    for (i = 0; i < 4; i++) out += '<path class="' + P + 'hill" d="' + hillPath(HX[i], 80) + '"/><text class="' + P + 'hname" x="' + HX[i] + '" y="112" text-anchor="middle">' + NAMES[i] + '</text>';
    if (opts.run) {
      var used = {};
      opts.run.steps.forEach(function (s) {
        if (s.ins === 'P') return;
        var x1 = s.from >= 0 && s.from <= 3 ? HX[s.from] : HX[0] - 70, x2 = s.to >= 0 && s.to <= 3 ? HX[s.to] : (s.to < 0 ? HX[0] - 70 : HX[3] + 70);
        var key = Math.min(s.from, s.to) + ':' + Math.max(s.from, s.to);
        var n = used[key] = (used[key] || 0) + 1;
        var peak = 52 - 16 * (n - 1), cy = 2 * peak - 70, mid = (x1 + x2) / 2, bad = s.to < 0 || s.to > 3;
        var tx = x2 - mid, ty = 70 - cy, len = Math.sqrt(tx * tx + ty * ty), ux = -tx / len, uy = -ty / len;
        function arm(sg) { var c = Math.cos(sg * 0.5), sn = Math.sin(sg * 0.5); return [x2 + 9 * (ux * c - uy * sn), 70 + 9 * (ux * sn + uy * c)]; }
        var a1 = arm(1), a2 = arm(-1);
        out += '<g class="' + P + 'step' + (bad ? ' ' + P + 'bad' : '') + '"><path d="M' + x1 + ' 70 Q' + mid + ' ' + cy + ' ' + x2 + ' 70"/>' +
          '<path d="M' + a1[0].toFixed(1) + ' ' + a1[1].toFixed(1) + ' L' + x2 + ' 70 L' + a2[0].toFixed(1) + ' ' + a2[1].toFixed(1) + '"/>' +
          '<text x="' + mid + '" y="' + (peak - 4) + '" text-anchor="middle">' + (s.i + 1) + '</text></g>';
      });
    }
    (opts.seeds || []).forEach(function (hi) { out += seedSvg(HX[hi], 74, ''); });
    return out + '</svg>';
  }

  /* ---------- Zustand ---------- */
  var el, api, locked, seeds, start, mark, exploreEl, noteEl, hillBtns, countEl, startBtns;

  function reset() { seeds = []; start = null; mark = null; }
  function same(a, b) { return a.length === b.length && a.every(function (v) { return b.indexOf(v) >= 0; }); }

  function toggle(i) {
    if (locked) return;
    var k = seeds.indexOf(i);
    if (k >= 0) seeds.splice(k, 1); else if (seeds.length < 3) seeds.push(i); else return;
    seeds.sort();
    refresh();
    api.changed();
  }
  function chooseStart(i) {
    start = start === i ? null : i;
    refreshExplore();
  }

  function refreshExplore() {
    var r = start === null ? null : run(start);
    exploreEl.innerHTML = hillsSvg({
      seeds: r ? r.seeds : [], run: r,
      label: start === null ? 'Vier Hügel A bis D' : 'Weg des Roboters bei Start auf Hügel ' + NAMES[start] + ': ' + r.steps.map(function (s) { return (s.i + 1) + '. ' + insName(s.ins) + (s.ins === 'P' ? ' auf ' + NAMES[s.from] : ''); }).join(', ')
    });
    startBtns.forEach(function (b, i) { b.setAttribute('aria-pressed', String(start === i)); b.classList.toggle('selected', start === i); });
    if (start === null) noteEl.textContent = 'Wähle einen Hügel, auf dem der Roboter starten könnte. Dann siehst du seinen Weg (die Zahlen sind die Nummern der Anweisungen).';
    else if (!r.inside) noteEl.textContent = 'Bei Start auf ' + NAMES[start] + ' springt der Roboter bei Anweisung ' + (r.steps.length) + ' ins Leere: Dort gibt es keinen Hügel. Das passt nicht.';
    else if (!r.ok) noteEl.textContent = 'Bei Start auf ' + NAMES[start] + ' wäre der Roboter nur auf ' + r.visited.length + ' Hügeln gewesen, nicht auf vieren. Das passt nicht.';
    else noteEl.textContent = 'Bei Start auf ' + NAMES[start] + ' besucht der Roboter genau vier Hügel. Er pflanzt Samen auf ' + r.seeds.map(function (s) { return NAMES[s]; }).join(', ') + '.';
  }

  function refresh() {
    hillBtns.forEach(function (b, i) {
      var on = seeds.indexOf(i) >= 0, want = RIGHT.indexOf(i) >= 0;
      b.setAttribute('aria-checked', String(on));
      b.disabled = locked;
      b.classList.toggle('selected', on);
      b.classList.toggle('off', !on && !locked && seeds.length >= 3);
      b.classList.remove('right', 'wrong');
      var m = b.querySelector('.' + P + 'mark');
      if (m) m.remove();
      if (mark === 'check' || mark === 'solution') {
        var ok = on === want;
        b.classList.add(ok ? 'right' : 'wrong');
        if (mark === 'check') b.appendChild(h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
      }
      b.querySelector('.' + P + 'seedbox').innerHTML = on ? '<svg viewBox="-12 -14 24 28" aria-hidden="true">' + seedSvg(0, 0, '') + '</svg>' : '';
      b.setAttribute('aria-label', 'Hügel ' + NAMES[i] + ': ' + (on ? 'Samen gepflanzt' : 'kein Samen') + (locked ? '' : '. Antippen zum Ändern.'));
    });
    countEl.textContent = seeds.length + ' von 3 Samen gepflanzt';
  }

  Biber.register({
    id: 'karotten23',
    story:
      '<p>Der Kaninchenroboter kann diese Anweisungen ausführen: nach links auf den nächsten Hügel springen, nach rechts auf den nächsten Hügel springen und einen Karottensamen auf dem Hügel pflanzen, auf dem er steht.</p>' +
      '<p>Er hat die unten gezeigte Folge von Anweisungen ausgeführt. Dabei ist der Roboter auf vier Hügeln gewesen. Wir wissen aber nicht, auf welchem Hügel er angefangen hat.</p>',
    question: 'Auf welche Hügel hat der Roboter die Karottensamen gepflanzt?',
    howto: 'Tippe die drei Hügel an, auf die der Roboter einen Samen gepflanzt hat. Mit „Ausprobieren“ kannst du den Roboter von einem Hügel aus starten lassen und seinen Weg ansehen.',
    explanation: function () {
      var r = run(2);
      return '<p>Den Startpunkt verrät das Programm: Der Roboter springt (Anweisungen 3, 5 und 6) dreimal hintereinander nach links, bevor er das letzte Mal pflanzt. ' +
        'Dafür muss er vorher ganz rechts auf Hügel D gestanden haben. Davor sprang er einmal nach rechts (Anweisung 1), also hat er auf <strong>Hügel C</strong> angefangen.</p>' +
        '<div class="' + P + 'expl">' + hillsSvg({ seeds: r.seeds, run: r, label: 'Weg des Roboters bei Start auf C: C nach D, pflanzen auf D, nach C, pflanzen auf C, nach B, nach A, pflanzen auf A' }) + '</div>' +
        '<p>Von C aus: rechts nach D, <strong>pflanzen auf D</strong>, links nach C, <strong>pflanzen auf C</strong>, links nach B, links nach A, <strong>pflanzen auf A</strong>. Die Samen liegen also auf A, C und D.</p>' +
        '<p>Ein Computerprogramm besteht aus einzelnen Anweisungen, die der Reihe nach (als <em>Sequenz</em>) ausgeführt werden. Was dabei herauskommt (Output), hängt von der Startposition (Input) und von der Reihenfolge der Anweisungen ab.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      var legend = h('ul', { class: P + 'legend', 'aria-label': 'Die drei Anweisungen' }, ['L', 'R', 'P'].map(function (c) {
        var li = h('li', null); li.innerHTML = iconSvg(c);
        li.appendChild(h('span', null, c === 'L' ? 'Springe nach links auf den nächsten Hügel.' : c === 'R' ? 'Springe nach rechts auf den nächsten Hügel.' : 'Pflanze einen Karottensamen auf dem Hügel, auf dem du stehst.'));
        return li;
      }));
      var prog = h('ol', { class: P + 'prog', 'aria-label': 'Das Programm, 7 Anweisungen' }, PROGRAM.map(function (c, i) {
        var li = h('li', { 'aria-label': (i + 1) + '. ' + insName(c) }); li.innerHTML = iconSvg(c);
        li.appendChild(h('span', { class: P + 'num', 'aria-hidden': 'true' }, String(i + 1)));
        return li;
      }));
      exploreEl = h('div', { class: P + 'explore' });
      noteEl = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      startBtns = [0, 1, 2, 3].map(function (i) {
        return h('button', { type: 'button', class: P + 'start', 'aria-pressed': 'false', 'aria-label': 'Start auf Hügel ' + NAMES[i] + ' ausprobieren', onclick: function () { chooseStart(i); } }, 'Start ' + NAMES[i]);
      });
      hillBtns = [0, 1, 2, 3].map(function (i) {
        var b = h('button', { type: 'button', role: 'checkbox', class: P + 'hbtn', 'aria-checked': 'false', onclick: function () { toggle(i); } });
        b.innerHTML = '<span class="' + P + 'seedbox"></span><svg class="' + P + 'bighill" viewBox="0 0 96 50" aria-hidden="true"><path class="' + P + 'hill" d="M4 48 C10 22 28 8 48 8 S86 22 92 48 Z"/></svg><span class="' + P + 'hlabel">' + NAMES[i] + '</span>';
        return b;
      });
      countEl = h('p', { class: P + 'count', role: 'status', 'aria-live': 'polite' });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { 'aria-label': 'Anweisungen' }, h('h3', null, 'Die Anweisungen'), legend),
        h('section', { 'aria-label': 'Programm' }, h('h3', null, 'Das hat der Roboter ausgeführt'), prog),
        h('section', { 'aria-label': 'Ausprobieren', class: P + 'try' }, h('h3', null, 'Ausprobieren: Wo könnte der Roboter gestartet sein?'),
          h('div', { class: P + 'starts' }, startBtns), exploreEl, noteEl),
        h('section', { 'aria-label': 'Antwort' }, h('h3', null, 'Deine Antwort: Hier liegen Samen'),
          h('div', { class: P + 'row', role: 'group', 'aria-label': 'Vier Hügel, auf drei davon liegen Samen' }, hillBtns), countEl)));
      refresh(); refreshExplore();
    },
    isComplete: function () { return seeds.length === 3; },
    evaluate: function () {
      return { correct: same(seeds, RIGHT), answer: { seeds: seeds.map(function (i) { return NAMES[i]; }) } };
    },
    setAnswer: function (ans) {
      var s = (ans && ans.seeds) || [];
      seeds = s.map(function (n) { return NAMES.indexOf(n); }).filter(function (i) { return i >= 0; }).sort();
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      refresh();
    },
    reset: function () { reset(); refresh(); refreshExplore(); },
    showSolution: function () { seeds = RIGHT.slice(); start = 2; mark = 'solution'; locked = true; refresh(); refreshExplore(); }
  });
  if (STARTS.length !== 1) window.console && console.warn('karotten23: unerwartete Startpunkte', STARTS);
})();
