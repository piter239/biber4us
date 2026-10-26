/* Aufgabe 3D-Labyrinth (Heft 2016, S. 7): Kugel mit einer Folge von Richtungsbefehlen N, O, S, W ins Ziel steuern */
(function () {
  'use strict';
  var h = Biber.h, sv = Biber.svg;

  /* Ebenen von oben (0) nach unten (3). Feld (c, r): c = 0 links, 1 rechts; r = 0 vorn, 1 hinten (Richtung N). */
  var HOLES = { 0: [1, 0], 1: [0, 0], 2: [1, 1] };      /* weißes Feld je Ebene: dort fällt die Kugel eine Ebene nach unten */
  var START = { l: 0, c: 0, r: 0 };
  var GOAL = { l: 3, c: 0, r: 1 };
  var DIR = { N: [0, 1], S: [0, -1], O: [1, 0], W: [-1, 0] };
  var MAXLEN = 30;
  var SOLUTION = 'OWNOW';
  var FIELDNAME = ['vorne links', 'vorne rechts', 'hinten links', 'hinten rechts'];

  function isHole(l, c, r) { var x = HOLES[l]; return !!x && x[0] === c && x[1] === r; }

  /* Simulation: Liste der Zustände (Start und nach jedem Befehl; Fallen = zusätzliche Zustände) */
  function simulate(cmds) {
    var s = { l: START.l, c: START.c, r: START.r };
    var states = [{ l: s.l, c: s.c, r: s.r, cmd: null, kind: 'start' }];
    cmds.split('').forEach(function (ch, i) {
      var d = DIR[ch];
      var nc = s.c + d[0], nr = s.r + d[1];
      if (nc < 0 || nc > 1 || nr < 0 || nr > 1) {
        states.push({ l: s.l, c: s.c, r: s.r, cmd: i, kind: 'bump' });
        return;
      }
      s.c = nc; s.r = nr;
      states.push({ l: s.l, c: s.c, r: s.r, cmd: i, kind: 'move' });
      while (s.l < 3 && isHole(s.l, s.c, s.r)) {
        s.l++;
        states.push({ l: s.l, c: s.c, r: s.r, cmd: i, kind: 'fall' });
      }
    });
    return states;
  }
  function finalOf(cmds) { var st = simulate(cmds); return st[st.length - 1]; }
  function atGoal(s) { return s.l === GOAL.l && s.c === GOAL.c && s.r === GOAL.r; }

  /* ---------- Zeichnung (schräge Ansicht wie im Heft: Norden zeigt nach hinten, also nach rechts oben) ---------- */
  var CW = 84, DX = 34, DY = 34, OX = 10, OY0 = 92, GAP = 120, VW = 256, VH = 468, BALL = 13;
  function oy(l) { return OY0 + l * GAP; }
  function corners(l, c, r) {
    var x = OX + c * CW + r * DX, y = oy(l) - r * DY;
    return [[x, y], [x + CW, y], [x + CW + DX, y - DY], [x + DX, y - DY]];
  }
  function center(l, c, r) {
    var p = corners(l, c, r);
    return [(p[0][0] + p[2][0]) / 2, (p[0][1] + p[2][1]) / 2];
  }
  function pts(p) { return p.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' '); }

  function describe() {
    var t = '3D-Labyrinth mit vier Ebenen zu je vier Feldern. ';
    for (var l = 0; l < 4; l++) {
      t += 'Ebene ' + (l + 1) + (l === 0 ? ' (oben)' : l === 3 ? ' (unten)' : '') + ': ';
      var parts = [];
      for (var r = 0; r < 2; r++) for (var c = 0; c < 2; c++) {
        var name = FIELDNAME[r * 2 + c];
        var what = isHole(l, c, r) ? 'weiß, die Kugel fällt hindurch' : (l === GOAL.l && c === GOAL.c && r === GOAL.r) ? 'gelbes Zielfeld' : 'grauer Boden';
        parts.push(name + ' ' + what);
      }
      t += parts.join(', ') + '. ';
    }
    return t + 'Die Kugel startet auf der obersten Ebene vorne links.';
  }

  function buildMaze() {
    var svg = sv('svg', { viewBox: '0 0 ' + VW + ' ' + VH, class: 't-labyrinth3d16-svg', role: 'img', 'aria-label': describe() });
    /* Gerüst */
    var frame = sv('g', { class: 't-labyrinth3d16-frame' });
    var x0 = OX, x1 = OX + 2 * CW, top = oy(0), bot = oy(3);
    [[x0, top, x0, bot], [x1, top, x1, bot], [x1 + 2 * DX, top - 2 * DY, x1 + 2 * DX, bot - 2 * DY], [x0 + 2 * DX, top - 2 * DY, x0 + 2 * DX, bot - 2 * DY]].forEach(function (l, i) {
      frame.appendChild(sv('line', { x1: l[0], y1: l[1], x2: l[2], y2: l[3], class: i === 3 ? 'back' : '' }));
    });
    svg.appendChild(frame);
    for (var l = 0; l < 4; l++) {
      var g = sv('g', { class: 't-labyrinth3d16-level' });
      for (var r = 1; r >= 0; r--) for (var c = 0; c < 2; c++) {
        var p = corners(l, c, r);
        var hole = isHole(l, c, r), goal = l === GOAL.l && c === GOAL.c && r === GOAL.r;
        g.appendChild(sv('polygon', { points: pts(p), class: 't-labyrinth3d16-field' + (hole ? ' hole' : goal ? ' goal' : '') }));
        if (goal) {
          var ctr = center(l, c, r);
          g.appendChild(sv('text', { x: ctr[0], y: ctr[1] + 4, class: 't-labyrinth3d16-goaltxt' }, 'Ziel'));
        }
      }
      /* Vorderkante der Platte */
      var fl = corners(l, 0, 0)[0], fr = corners(l, 1, 0)[1];
      g.appendChild(sv('polygon', { points: pts([fl, fr, [fr[0], fr[1] + 6], [fl[0], fl[1] + 6]]), class: 't-labyrinth3d16-edge' }));
      g.appendChild(sv('text', { x: OX, y: oy(l) + 20, class: 't-labyrinth3d16-lvl' }, 'Ebene ' + (l + 1) + (l === 0 ? ' (oben)' : l === 3 ? ' (unten)' : '')));
      svg.appendChild(g);
    }
    var trail = sv('path', { d: '', class: 't-labyrinth3d16-trail' });
    svg.appendChild(trail);
    var ball = sv('g', { class: 't-labyrinth3d16-ball' });
    ball.appendChild(sv('ellipse', { cx: 0, cy: BALL - 2, rx: BALL * 0.8, ry: 4, class: 't-labyrinth3d16-shadow' }));
    ball.appendChild(sv('circle', { cx: 0, cy: 0, r: BALL, class: 't-labyrinth3d16-ballc' }));
    ball.appendChild(sv('circle', { cx: -4, cy: -4.5, r: 3.5, class: 't-labyrinth3d16-shine' }));
    svg.appendChild(ball);
    return { svg: svg, ball: ball, trail: trail };
  }

  function compass() {
    var s = sv('svg', { viewBox: '0 0 150 110', class: 't-labyrinth3d16-compass', role: 'img', 'aria-label': 'Richtungen: N nach hinten (oben rechts), O nach rechts, S nach vorn (unten links), W nach links' });
    s.appendChild(sv('defs', {}, sv('marker', { id: 't-labyrinth3d16-ah', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, sv('path', { d: 'M0 0 L10 5 L0 10 Z', fill: 'currentColor' }))));
    [[75, 62, 75 + 30, 62 - 30, 'N', 112, 24], [75, 62, 75 + 50, 62, 'O', 142, 66], [75, 62, 75 - 30, 62 + 30, 'S', 38, 104], [75, 62, 75 - 50, 62, 'W', 8, 66]].forEach(function (a) {
      s.appendChild(sv('line', { x1: a[0], y1: a[1], x2: a[2], y2: a[3], class: 't-labyrinth3d16-arrow', 'marker-end': 'url(#t-labyrinth3d16-ah)' }));
      s.appendChild(sv('text', { x: a[5], y: a[6], class: 't-labyrinth3d16-dirtxt' }, a[4]));
    });
    return s;
  }

  /* ---------- Modul ---------- */
  var el, api, locked, cmds, maze, input, caption, playing, timer, pos, trailPts;
  var ARROWS = { N: '↗', O: '→', S: '↙', W: '←' };

  function ballXY(s) {
    var c = center(s.l, s.c, s.r);
    return [c[0], c[1] - BALL - 1];
  }
  function placeBall(s) {
    var p = ballXY(s);
    maze.ball.style.transform = 'translate(' + p[0].toFixed(1) + 'px,' + p[1].toFixed(1) + 'px)';
    pos = s;
  }
  function trailPath(states, upto) {
    var d = '';
    for (var i = 0; i <= upto && i < states.length; i++) {
      var c = center(states[i].l, states[i].c, states[i].r);
      var prev = states[i - 1];
      if (i === 0) d += 'M' + c[0].toFixed(1) + ' ' + c[1].toFixed(1);
      else if (prev && prev.c === states[i].c && prev.r === states[i].r && prev.l === states[i].l) continue;
      else d += ' L' + c[0].toFixed(1) + ' ' + c[1].toFixed(1);
    }
    return d;
  }
  function stopPlay() {
    if (timer) { clearTimeout(timer); timer = null; }
    playing = false;
    refreshControls();
  }
  function describeState(s) {
    return 'Die Kugel liegt auf Ebene ' + (s.l + 1) + ', ' + FIELDNAME[s.r * 2 + s.c] + (atGoal(s) ? ' auf dem Ziel.' : '.');
  }
  function backToStart() {
    stopPlay();
    placeBall(START);
    maze.trail.setAttribute('d', '');
    caption.textContent = '';
  }
  function showEnd(c) {
    var st = simulate(c);
    placeBall(st[st.length - 1]);
    maze.trail.setAttribute('d', c ? trailPath(st, st.length - 1) : '');
    caption.textContent = c ? describeState(st[st.length - 1]) : '';
  }
  function play() {
    if (locked || playing || !cmds) return;
    var st = simulate(cmds), i = 0;
    placeBall(st[0]);
    maze.trail.setAttribute('d', '');
    caption.textContent = '';
    playing = true;
    refreshControls();
    (function step() {
      i++;
      if (i >= st.length) { playing = false; caption.textContent = describeState(st[st.length - 1]); refreshControls(); return; }
      placeBall(st[i]);
      maze.trail.setAttribute('d', trailPath(st, i));
      setHighlight(st[i].cmd);
      timer = setTimeout(step, st[i].kind === 'fall' ? 520 : 440);
    })();
  }
  function setHighlight(i) {
    /* aktueller Befehl wird im Textfeld nicht markiert; stattdessen kurze Meldung für Screenreader */
    caption.textContent = i == null ? '' : 'Befehl ' + (i + 1) + ' von ' + cmds.length + ': ' + cmds.charAt(i);
  }
  function setCmds(v) {
    v = (v || '').toUpperCase().replace(/[^NOSW]/g, '').slice(0, MAXLEN);
    var changed = v !== cmds;
    cmds = v;
    if (input.value !== v) input.value = v;
    if (changed) backToStart();
    refreshControls();
    api.changed(cmds ? cmds.length + (cmds.length === 1 ? ' Befehl' : ' Befehle') : '');
  }
  function refreshControls() {
    var off = locked || playing;
    input.disabled = locked || playing;
    [].forEach.call(el.querySelectorAll('[data-dirbtn],[data-del]'), function (b) { b.disabled = off; });
    var tryBtn = el.querySelector('[data-try]');
    tryBtn.disabled = locked || !cmds || playing;
    tryBtn.textContent = playing ? 'Läuft …' : 'Ausprobieren';
  }

  Biber.register({
    id: 'labyrinth3d16',
    story:
      '<p>Ein 3D-Labyrinth hat vier Ebenen mit jeweils vier Feldern. Eine Kugel liegt auf der obersten Ebene. Auf der untersten Ebene ist das Ziel: das gelbe Feld.</p>' +
      '<p>Du kannst die Kugel mit den Richtungsbefehlen N, O, S und W steuern. Auf einem weißen Feld fällt die Kugel eine Ebene nach unten. Das Labyrinth ist geschlossen; Du kannst die Kugel also nicht nach außen steuern.</p>',
    question: 'Steuere die Kugel ins Ziel!',
    howto: 'Tippe eine Folge von Richtungsbefehlen ein oder wähle sie mit den Knöpfen, direkt nacheinander, z. B. NOS, um die Kugel nach N, O und dann nach S zu bewegen. Mit „Ausprobieren“ siehst Du, wie Deine Befehlsfolge die Kugel steuert. Am Ende der Befehle muss die Kugel auf dem gelben Feld liegen.',
    explanation: function () {
      var f = finalOf(cmds || '');
      var s = '';
      if (cmds && !atGoal(f)) s += '<p>Mit „' + cmds + '“ liegt die Kugel am Ende nicht auf dem Ziel.</p>';
      s += '<p>Mit Befehlsfolgen wie „OWNOW“ oder „OWONW“ steuerst Du die Kugel ins Ziel: Erst O, dann fällt die Kugel durch das weiße Feld auf Ebene 2; mit W kommt sie auf das nächste weiße Feld und fällt auf Ebene 3; N und O führen sie auf das weiße Feld ganz hinten rechts; auf der letzten Ebene bringt sie ein W ins Ziel. Es gibt noch viele andere Möglichkeiten, die Kugel ins Ziel zu steuern, denn Umwege sind nicht verboten. Kürzer als fünf Befehle geht es aber nicht.</p>' +
        '<p>Die Befehlsfolge ist ein kurzes Computerprogramm. Die zugehörige Programmiersprache kennt nur vier Befehle, N, O, S und W; in der Informatik spricht man auch von Anweisungen. Ein Programm ist eine Folge von Anweisungen, die nacheinander (sequenziell) ausgeführt werden. Auch bei richtigen Programmiersprachen ist die Abfolge von Anweisungen die grundlegendste Möglichkeit, ein Programm aufzubauen. Weitere Bausteine sind die Wiederholung, die bedingte Anweisung und Unterprogramme.</p>';
      return s;
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; cmds = ''; playing = false; timer = null;
      maze = buildMaze();
      caption = h('p', { class: 't-labyrinth3d16-cap', role: 'status', 'aria-live': 'polite' });
      input = h('input', {
        type: 'text', class: 't-labyrinth3d16-input', 'aria-label': 'Befehlsfolge aus N, O, S und W', placeholder: 'z. B. NOS',
        autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', maxlength: String(MAXLEN), inputmode: 'text',
        oninput: function () { setCmds(input.value); },
        onkeydown: function (e) { if (e.key === 'Enter') { e.preventDefault(); play(); } }
      });
      var btns = Object.keys(DIR).map(function (k) {
        return h('button', {
          type: 'button', class: 't-labyrinth3d16-dir', 'data-dirbtn': k, 'aria-label': 'Befehl ' + k + ' anhängen',
          onclick: function () { if (!locked && !playing && cmds.length < MAXLEN) setCmds(cmds + k); }
        }, h('b', null, k), h('span', { 'aria-hidden': 'true' }, ARROWS[k]));
      });
      var del = h('button', {
        type: 'button', class: 't-labyrinth3d16-del', 'data-del': '', 'aria-label': 'Letzten Befehl löschen',
        onclick: function () { if (!locked && !playing) setCmds(cmds.slice(0, -1)); }
      }, '⌫ Löschen');
      var tryBtn = h('button', { type: 'button', class: 't-labyrinth3d16-try', 'data-try': '', onclick: play }, 'Ausprobieren');
      var controls = h('div', { class: 't-labyrinth3d16-controls' },
        h('div', { class: 't-labyrinth3d16-comp' }, compass()),
        h('label', { class: 't-labyrinth3d16-lab' }, 'Deine Befehle', input),
        h('div', { class: 't-labyrinth3d16-btns' }, btns, del),
        h('div', { class: 't-labyrinth3d16-go' }, tryBtn),
        caption);
      el.replaceChildren(h('div', { class: 't-labyrinth3d16-board' }, h('div', { class: 't-labyrinth3d16-mazewrap' }, maze.svg), controls));
      placeBall(START);
      refreshControls();
    },
    isComplete: function () { return cmds.length > 0; },
    evaluate: function () {
      stopPlay();
      showEnd(cmds);
      return { correct: atGoal(finalOf(cmds)), answer: cmds };
    },
    setAnswer: function (ans) {
      stopPlay();
      var v = typeof ans === 'string' ? ans.toUpperCase().replace(/[^NOSW]/g, '').slice(0, MAXLEN) : '';
      cmds = v; input.value = v;
      showEnd(v);
      refreshControls();
    },
    lock: function (on) {
      locked = on;
      if (on) stopPlay();
      refreshControls();
    },
    reset: function () {
      cmds = ''; input.value = '';
      backToStart();
      refreshControls();
    },
    showSolution: function () {
      stopPlay();
      cmds = SOLUTION; input.value = SOLUTION;
      showEnd(SOLUTION);
      refreshControls();
    }
  });
})();
