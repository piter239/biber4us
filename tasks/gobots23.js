/* Aufgabe Go-Bots (Heft 2023, 7-8 schwer, 9-10 mittel, 11-13 einfach): Systeme, Multiagentensystem, Koordination */
(function () {
  'use strict';
  var h = Biber.h, S = Biber.svg;
  var P = 't-gobots23-';

  var CELL = 36;
  var DIRS = {
    u: { dc: 0, dr: -1, name: 'nach oben', glyph: '↑', key: 'ArrowUp' },
    d: { dc: 0, dr: 1, name: 'nach unten', glyph: '↓', key: 'ArrowDown' },
    l: { dc: -1, dr: 0, name: 'nach links', glyph: '←', key: 'ArrowLeft' },
    r: { dc: 1, dr: 0, name: 'nach rechts', glyph: '→', key: 'ArrowRight' }
  };
  var BOT_CLASS = { 1: 'b1', 2: 'b2', 3: 'b3', 4: 'b4' };

  /* Spielbrett der Aufgabe (Spalte c, Zeile r, jeweils ab 0) */
  var MAIN = {
    cols: 13, rows: 10,
    obst: [[2, 0], [12, 0], [6, 2], [11, 2], [4, 3], [11, 3], [0, 6], [7, 7], [1, 8], [11, 8], [4, 9], [8, 9], [11, 9]],
    bots: { 1: [5, 0], 2: [9, 4], 3: [4, 7], 4: [7, 2] },
    goal: [10, 3]
  };
  /* Beispiel aus dem Heft */
  var EX = {
    cols: 7, rows: 6,
    obst: [[5, 0]],
    bots: { 1: [4, 4], 3: [2, 0] },
    goal: [0, 1]
  };
  var EX_CMDS = [{ b: 3, d: 'r' }, { b: 1, d: 'u' }, { b: 1, d: 'l' }];
  var NCMD = 4;
  /* Lösung aus dem Heft: 3 hoch, 2 links, 1 runter, 1 rechts */
  var SOLUTION = [{ b: 3, d: 'u' }, { b: 2, d: 'l' }, { b: 1, d: 'd' }, { b: 1, d: 'r' }];

  function isObst(cfg, c, r) {
    return cfg.obst.some(function (o) { return o[0] === c && o[1] === r; });
  }
  /* Befehlsfolge ausführen; liefert Endpositionen und die gefahrenen Strecken */
  function simulate(cfg, cmds) {
    var pos = {}, trails = [];
    Object.keys(cfg.bots).forEach(function (k) { pos[k] = cfg.bots[k].slice(); });
    cmds.forEach(function (cm) {
      var p = pos[cm.b], dd = DIRS[cm.d], from = p.slice(), n = 0;
      for (;;) {
        var c = p[0] + dd.dc, r = p[1] + dd.dr;
        if (c < 0 || r < 0 || c >= cfg.cols || r >= cfg.rows || isObst(cfg, c, r)) break;
        if (Object.keys(pos).some(function (k) { return +k !== cm.b && pos[k][0] === c && pos[k][1] === r; })) break;
        p[0] = c; p[1] = r; n++;
      }
      trails.push({ b: cm.b, from: from, to: p.slice(), n: n });
    });
    return { pos: pos, trails: trails };
  }
  function reaches(cfg, cmds) {
    var p = simulate(cfg, cmds).pos[1];
    return p[0] === cfg.goal[0] && p[1] === cfg.goal[1];
  }
  if (!reaches(MAIN, SOLUTION) || !reaches(EX, EX_CMDS)) throw new Error('gobots23: Lösung stimmt nicht');

  /* ---------- Zeichnen ---------- */
  function cx(c) { return c * CELL + CELL / 2; }
  function starPath(x, y, R, r) {
    var d = '';
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r : R;
      d += (i ? 'L' : 'M') + (x + rad * Math.cos(a)).toFixed(1) + ' ' + (y + rad * Math.sin(a)).toFixed(1);
    }
    return d + 'Z';
  }
  function botG(n, c, r) {
    var g = S('g', { class: P + 'bot ' + P + BOT_CLASS[n], 'data-bot': n });
    g.appendChild(S('circle', { class: P + 'ring', r: 17, cx: 0, cy: 0 }));
    g.appendChild(S('circle', { class: P + 'disc', r: 13, cx: 0, cy: 0 }));
    g.appendChild(S('text', { class: P + 'num', x: 0, y: 6, 'text-anchor': 'middle' }, String(n)));
    placeBot(g, c, r);
    return g;
  }
  function placeBot(g, c, r) { g.style.transform = 'translate(' + cx(c) + 'px,' + cx(r) + 'px)'; }

  /* Brett als SVG; liefert {svg, bots, trailG, dynG} */
  function drawBoard(cfg, o) {
    o = o || {};
    var W = cfg.cols * CELL, H = cfg.rows * CELL;
    var svg = S('svg', { class: P + 'svg', viewBox: '0 0 ' + W + ' ' + H, role: 'img', focusable: 'false' });
    var c, r;
    for (r = 0; r < cfg.rows; r++) for (c = 0; c < cfg.cols; c++) {
      svg.appendChild(S('rect', { class: P + 'cell', x: c * CELL, y: r * CELL, width: CELL, height: CELL }));
    }
    cfg.obst.forEach(function (ob) {
      svg.appendChild(S('rect', { class: P + 'obst', x: ob[0] * CELL + 1.5, y: ob[1] * CELL + 1.5, width: CELL - 3, height: CELL - 3, rx: 4 }));
    });
    svg.appendChild(S('path', { class: P + 'goal', d: starPath(cx(cfg.goal[0]), cx(cfg.goal[1]), 14, 6) }));
    var trailG = S('g', { class: P + 'trails' });
    svg.appendChild(trailG);
    var bots = {};
    Object.keys(cfg.bots).forEach(function (k) {
      bots[k] = botG(+k, cfg.bots[k][0], cfg.bots[k][1]);
      svg.appendChild(bots[k]);
    });
    return { svg: svg, bots: bots, trailG: trailG, cfg: cfg };
  }
  function arrowHead(x, y, dc, dr) {
    var L = 7, a = Math.atan2(dr, dc), s = 0.5;
    return 'M' + x + ' ' + y + 'L' + (x - L * Math.cos(a - s)).toFixed(1) + ' ' + (y - L * Math.sin(a - s)).toFixed(1) +
      'L' + (x - L * Math.cos(a + s)).toFixed(1) + ' ' + (y - L * Math.sin(a + s)).toFixed(1) + 'Z';
  }
  /* Strecken und Startpositionen zeichnen, Roboter auf Endpositionen setzen */
  function showState(bd, cmds, withTrails) {
    var cfg = bd.cfg, res = simulate(cfg, cmds);
    bd.trailG.replaceChildren();
    if (withTrails) {
      var moved = {};
      res.trails.forEach(function (t) { if (t.n) moved[t.b] = true; });
      Object.keys(moved).forEach(function (k) {
        var s0 = cfg.bots[k];
        bd.trailG.appendChild(S('circle', { class: P + 'ghost ' + P + BOT_CLASS[k], cx: cx(s0[0]), cy: cx(s0[1]), r: 13 }));
      });
      res.trails.forEach(function (t) {
        if (!t.n) return;
        var x1 = cx(t.from[0]), y1 = cx(t.from[1]), x2 = cx(t.to[0]), y2 = cx(t.to[1]);
        var dd = DIRS[cmds[res.trails.indexOf(t)].d];
        var ex = x2 - dd.dc * 14, ey = y2 - dd.dr * 14;
        bd.trailG.appendChild(S('line', { class: P + 'trail ' + P + BOT_CLASS[t.b], x1: x1, y1: y1, x2: ex, y2: ey }));
        bd.trailG.appendChild(S('path', { class: P + 'head ' + P + BOT_CLASS[t.b], d: arrowHead(ex + dd.dc * 2, ey + dd.dr * 2, dd.dc, dd.dr) }));
      });
    }
    Object.keys(bd.bots).forEach(function (k) { placeBot(bd.bots[k], res.pos[k][0], res.pos[k][1]); });
    return res;
  }
  function chipHtml(b, d) {
    return '<span class="' + P + 'chip ' + P + BOT_CLASS[b] + '">' + b + '</span><span class="' + P + 'achip">' + DIRS[d].glyph + '</span>';
  }
  function staticBoard(cfg, cmds, withTrails, label) {
    var bd = drawBoard(cfg);
    bd.svg.setAttribute('aria-label', label);
    showState(bd, cmds, withTrails);
    bd.svg.querySelectorAll('g').forEach(function (g) { g.style.transition = 'none'; });
    return '<figure class="' + P + 'fig">' + bd.svg.outerHTML + '</figure>';
  }

  var exSeq = EX_CMDS.map(function (cm) { return '<span class="' + P + 'pair">' + chipHtml(cm.b, cm.d) + '</span>'; }).join(' ');
  var STORY =
    '<p>Die Go-Bots sind sehr einfache Roboter. Sie fahren über ein Spielbrett mit Feldern. Um sie zu steuern, wählt man zunächst einen der Go-Bots aus. ' +
    'Den schickt man dann mit einem Pfeil-Befehl in eine Richtung: hoch, runter, links oder rechts.</p>' +
    '<p>Der Go-Bot fährt dann stur geradeaus, bis er direkt vor einem Hindernis (dunkles Feld) oder einem anderen Roboter ankommt. ' +
    'Auch der Rand des Spielbretts hält ihn auf. Dort bleibt er stehen, bis er einen neuen Befehl bekommt.</p>' +
    '<p>Mit einer geschickten Folge von Befehlen sollst du dafür sorgen, dass <b>Go-Bot 1</b> das Ziel (grüner Stern) erreicht, also genau dort stehen bleibt.</p>' +
    '<p>Beispiel: Mit dieser Befehlsfolge erreicht Go-Bot 1 auf einem kleineren Brett mit zwei Go-Bots das Ziel:</p>' +
    '<p class="' + P + 'seq">' + exSeq + '</p>' +
    '<div class="' + P + 'exrow">' +
    staticBoard(EX, [], false, 'Beispielbrett vor der Befehlsfolge: Go-Bot 3 oben, Go-Bot 1 unten, Ziel am linken Rand') +
    '<span class="' + P + 'exarrow" aria-hidden="true">→</span>' +
    staticBoard(EX, EX_CMDS, true, 'Beispielbrett nach der Befehlsfolge: Go-Bot 1 steht auf dem Ziel') +
    '</div>' +
    '<p>Unten ist ein anderes Spielbrett mit vier Go-Bots.</p>';

  /* ---------- Zustand ---------- */
  var el, api, locked, cmds, sel, bd, statusEl, slotEls, botBtns, arrBtns, delBtn, clrBtn, nextHint, mode;

  function cellName(p) { return 'Zeile ' + (p[1] + 1) + ', Spalte ' + (p[0] + 1); }
  function say(t) { statusEl.textContent = t; }

  function render() {
    var res = showState(bd, cmds, true);
    var i;
    for (i = 0; i < NCMD; i++) {
      var s = slotEls[i], cm = cmds[i];
      s.classList.toggle('filled', !!cm);
      s.classList.toggle('next', !cm && i === cmds.length && !locked);
      s.replaceChildren();
      s.appendChild(h('span', { class: P + 'n' }, String(i + 1)));
      if (cm) {
        s.appendChild(h('span', { class: P + 'chip ' + P + BOT_CLASS[cm.b] }, String(cm.b)));
        s.appendChild(h('span', { class: P + 'achip' }, DIRS[cm.d].glyph));
        s.setAttribute('aria-label', 'Befehl ' + (i + 1) + ': Go-Bot ' + cm.b + ' ' + DIRS[cm.d].name);
      } else {
        s.appendChild(h('span', { class: P + 'chip ' + P + 'empty' }));
        s.appendChild(h('span', { class: P + 'achip ' + P + 'empty' }));
        s.setAttribute('aria-label', 'Befehl ' + (i + 1) + ': noch leer');
      }
    }
    var full = cmds.length >= NCMD;
    botBtns.forEach(function (b) {
      var n = +b.getAttribute('data-bot');
      b.disabled = locked || full;
      b.classList.toggle('sel', sel === n);
      b.setAttribute('aria-pressed', sel === n ? 'true' : 'false');
    });
    arrBtns.forEach(function (b) { b.disabled = locked || full; });
    delBtn.disabled = locked || !cmds.length;
    clrBtn.disabled = locked || !cmds.length;
    Object.keys(bd.bots).forEach(function (k) {
      bd.bots[k].classList.toggle('sel', sel === +k && !locked);
      bd.bots[k].setAttribute('aria-label', 'Go-Bot ' + k + ' in ' + cellName(res.pos[k]));
    });
    nextHint.textContent = locked ? '' : full ? 'Alle vier Befehle sind gesetzt. Prüfe die Folge oder ändere sie.' :
      sel ? 'Go-Bot ' + sel + ' ist ausgewählt. Wähle jetzt einen Pfeil.' : 'Wähle als Nächstes einen Go-Bot.';
    bd.svg.setAttribute('aria-label', 'Spielbrett mit 13 mal 10 Feldern. ' + [1, 2, 3, 4].map(function (k) { return 'Go-Bot ' + k + ' in ' + cellName(res.pos[k]); }).join('; ') +
      '. Das Ziel liegt in ' + cellName(MAIN.goal) + '.');
    bd.svg.classList.toggle('ok', mode === 'ok');
    bd.svg.classList.toggle('bad', mode === 'bad');
    return res;
  }

  function pickBot(n) {
    if (locked || cmds.length >= NCMD) return;
    sel = sel === n ? null : n;
    render();
    say(sel ? 'Go-Bot ' + n + ' ausgewählt.' : 'Auswahl aufgehoben.');
  }
  function addCmd(d) {
    if (locked || cmds.length >= NCMD) return;
    if (!sel) { say('Wähle zuerst einen Go-Bot, dann einen Pfeil.'); nextHint.textContent = 'Wähle als Nächstes einen Go-Bot.'; return; }
    var cm = { b: sel, d: d };
    cmds.push(cm);
    sel = null;
    var res = render();
    var t = res.trails[cmds.length - 1];
    say('Befehl ' + cmds.length + ': Go-Bot ' + cm.b + ' ' + DIRS[d].name + '. ' +
      (t.n ? 'Er fährt ' + t.n + (t.n === 1 ? ' Feld' : ' Felder') + ' weit und bleibt in ' + cellName(t.to) + ' stehen.' : 'Er kann sich nicht bewegen und bleibt stehen.'));
    api.changed();
  }
  function delLast() {
    if (locked || !cmds.length) return;
    cmds.pop(); sel = null;
    render(); say('Letzten Befehl gelöscht.');
    api.changed();
  }
  function clearAll() {
    if (locked || !cmds.length) return;
    cmds = []; sel = null;
    render(); say('Alle Befehle gelöscht.');
    api.changed();
  }
  function onKey(e) {
    if (locked || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[1-4]$/.test(e.key)) { e.preventDefault(); pickBot(+e.key); return; }
    for (var d in DIRS) if (DIRS[d].key === e.key) { e.preventDefault(); addCmd(d); return; }
    if (e.key === 'Backspace' || e.key === 'Delete') { e.preventDefault(); delLast(); }
  }

  function botButton(n) {
    return h('button', { type: 'button', class: P + 'pbot ' + P + BOT_CLASS[n], 'data-bot': n, 'aria-label': 'Go-Bot ' + n + ' auswählen', 'aria-pressed': 'false',
      onclick: function () { pickBot(n); } }, String(n));
  }
  function arrowButton(d) {
    return h('button', { type: 'button', class: P + 'parr', 'data-d': d, 'aria-label': 'Pfeil ' + DIRS[d].name, onclick: function () { addCmd(d); } }, DIRS[d].glyph);
  }

  Biber.register({
    id: 'gobots23',
    story: STORY,
    question: 'Erstelle eine Befehlsfolge mit vier Pfeilen, mit der Go-Bot 1 das Ziel erreicht!',
    howto: 'Wähle immer abwechselnd einen Go-Bot und einen Pfeil aus, um die Befehlsfolge zu erstellen (Antippen oder Tasten 1 bis 4 und Pfeiltasten). Auf dem Brett siehst du, wohin die Go-Bots fahren. Mit „Letzten löschen“ änderst du die Folge.',
    explanation: function () {
      return '<p>Go-Bot 1 kommt nur mit Hilfe der anderen Roboter ans Ziel, denn er braucht Hindernisse, an denen er stehen bleibt. ' +
        'Eine Lösung: Go-Bot 3 fährt nach oben und bleibt vor dem Hindernis stehen. Damit ist er selbst ein Hindernis für Go-Bot 2, der nach links fährt und links neben ihm stehen bleibt. ' +
        'Nun fährt Go-Bot 1 nach unten und hält direkt über Go-Bot 2, dann nach rechts, bis er vor dem Hindernis genau auf dem Ziel stoppt.</p>' +
        '<p>Man findet die Folge, wenn man rückwärts denkt: Die letzte Bewegung von Go-Bot 1 muss auf dem Ziel enden. ' +
        'Kommt er von links, braucht man vorher nur noch zwei Hilfsbewegungen, kommt er von oben, wären es mindestens fünf Befehle. So bleibt es bei vier Pfeilen.</p>' +
        '<p><b>Informatik:</b> Mehrere einfache Roboter arbeiten zusammen und haben dabei unterschiedliche Aufgaben: einer will ans Ziel, die anderen dienen als Hindernisse. ' +
        'Solche Aufgabenverteilung und Koordination ist in der Robotik wichtig, etwa bei Lagerrobotern und Schwarmrobotern, und ebenso bei Multiagentensystemen aus Software.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; cmds = []; sel = null; mode = null;
      bd = drawBoard(MAIN);
      statusEl = h('p', { class: P + 'status', role: 'status', 'aria-live': 'polite' });
      nextHint = h('p', { class: P + 'hint' });
      slotEls = [];
      var slotRow = h('ol', { class: P + 'slots', 'aria-label': 'Befehlsfolge' });
      for (var i = 0; i < NCMD; i++) {
        var li = h('li', { class: P + 'slot' });
        slotEls.push(li);
        slotRow.appendChild(li);
      }
      botBtns = [1, 2, 3, 4].map(botButton);
      arrBtns = ['u', 'd', 'l', 'r'].map(arrowButton);
      delBtn = h('button', { type: 'button', class: P + 'tool', onclick: delLast }, '↶ Letzten löschen');
      clrBtn = h('button', { type: 'button', class: P + 'tool', onclick: clearAll }, 'Alle löschen');
      /* Roboter auf dem Brett antippen = auswählen */
      Object.keys(bd.bots).forEach(function (k) {
        var g = bd.bots[k];
        g.setAttribute('role', 'button'); g.setAttribute('tabindex', '0');
        g.addEventListener('click', function () { pickBot(+k); });
        g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); pickBot(+k); } });
      });
      el.replaceChildren(h('div', { class: P + 'box', onkeydown: onKey },
        h('div', { class: P + 'boardwrap' }, bd.svg),
        h('div', { class: P + 'panel' },
          h('div', { class: P + 'lab' }, 'Befehlsfolge'),
          slotRow,
          h('div', { class: P + 'pal' },
            h('div', { class: P + 'palrow', role: 'group', 'aria-label': 'Go-Bot wählen' }, botBtns),
            h('div', { class: P + 'palrow', role: 'group', 'aria-label': 'Richtung wählen' }, arrBtns)),
          h('div', { class: P + 'tools' }, delBtn, clrBtn),
          nextHint, statusEl)));
      render();
    },
    isComplete: function () { return cmds.length === NCMD; },
    evaluate: function () {
      return { correct: reaches(MAIN, cmds), answer: cmds.map(function (c) { return c.b + c.d; }) };
    },
    setAnswer: function (ans) {
      cmds = (Array.isArray(ans) ? ans : []).slice(0, NCMD).filter(function (s) { return /^[1-4][udlr]$/.test(s); })
        .map(function (s) { return { b: +s[0], d: s[1] }; });
      sel = null;
      mode = cmds.length === NCMD ? (reaches(MAIN, cmds) ? 'ok' : 'bad') : null;
      render();
    },
    lock: function (on) {
      locked = on; sel = null;
      mode = on ? (reaches(MAIN, cmds) ? 'ok' : 'bad') : null;
      render();
      if (on) {
        var p = simulate(MAIN, cmds).pos[1];
        say(reaches(MAIN, cmds) ? 'Go-Bot 1 steht auf dem Ziel.' : 'Go-Bot 1 steht in ' + cellName(p) + ', das Ziel liegt in ' + cellName(MAIN.goal) + '.');
      } else say('');
    },
    reset: function () { cmds = []; sel = null; mode = null; render(); say(''); },
    showSolution: function () {
      cmds = SOLUTION.map(function (c) { return { b: c.b, d: c.d }; }); sel = null; mode = 'ok'; locked = true; render();
      say('Eine richtige Lösung: Go-Bot 3 nach oben, Go-Bot 2 nach links, Go-Bot 1 nach unten, Go-Bot 1 nach rechts.');
    }
  });
})();
