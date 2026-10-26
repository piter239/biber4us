/* Aufgabe Kurzes Programm (Heft 2017, S. 35) - Roboter mit höchstens vier Bausteinen zum Ziel programmieren */
(function () {
  'use strict';
  var h = Biber.h, S = Biber.svg;

  var W = 8, H = 5;                     /* Raum: 8 mal 5 Felder */
  var START = { x: 1, y: 4, d: 0 };     /* d: 0 Osten, 1 Norden, 2 Westen, 3 Süden (Linksdrehung = +1) */
  var GOAL = { x: 5, y: 0 };
  var DX = [1, 0, -1, 0], DY = [0, -1, 0, 1];
  var MAX_BLOCKS = 4;
  var ACTION_LIMIT = 400, NODE_LIMIT = 20000;
  var COND = { v: 'vorne', l: 'links', r: 'rechts' };
  var OFFSET = { v: 0, l: 1, r: 3 };
  var OFFICIAL = [{ t: 'W', a: [{ t: 'I', c: 'v', a: [{ t: 'F' }], b: [{ t: 'L' }] }] }];

  var LABEL = { F: 'gehe vorwärts', L: 'drehe nach links', R: 'drehe nach rechts', I: 'wenn … frei, mache … sonst …', W: 'wiederhole … mache …' };
  var PALETTE = ['F', 'L', 'R', 'I', 'W'];

  /* ---------- Simulation ---------- */
  function simulate(prog) {
    var st = { x: START.x, y: START.y, d: START.d }, trace = [], nodes = 0;
    function stop(r) { return { stop: r }; }
    function free(rel) {
      var d = (st.d + OFFSET[rel]) % 4, nx = st.x + DX[d], ny = st.y + DY[d];
      return nx >= 0 && nx < W && ny >= 0 && ny < H;
    }
    function push() { trace.push({ x: st.x, y: st.y, d: st.d }); if (trace.length >= ACTION_LIMIT) throw stop('limit'); }
    function run(list) {
      list.forEach(function (b) {
        if (++nodes > NODE_LIMIT) throw stop('limit');
        if (b.t === 'F') {
          if (free('v')) { st.x += DX[st.d]; st.y += DY[st.d]; }
          push();
          if (st.x === GOAL.x && st.y === GOAL.y) throw stop('goal');
        } else if (b.t === 'L') { st.d = (st.d + 1) % 4; push(); }
        else if (b.t === 'R') { st.d = (st.d + 3) % 4; push(); }
        else if (b.t === 'I') { run(free(b.c) ? b.a : b.b); }
        else if (b.t === 'W') {
          if (!b.a.length) throw stop('leer');
          for (;;) run(b.a);
        }
      });
    }
    var reason = 'ende';
    try { run(prog); } catch (e) { if (e && e.stop) reason = e.stop; else throw e; }
    return { reached: reason === 'goal', reason: reason, trace: trace, last: trace.length ? trace[trace.length - 1] : { x: START.x, y: START.y, d: START.d } };
  }

  function count(list) {
    return list.reduce(function (n, b) { return n + 1 + (b.a ? count(b.a) : 0) + (b.b ? count(b.b) : 0); }, 0);
  }
  function copy(x) { return JSON.parse(JSON.stringify(x)); }
  function newBlock(t) {
    if (t === 'I') return { t: 'I', c: 'v', a: [], b: [] };
    if (t === 'W') return { t: 'W', a: [] };
    return { t: t };
  }
  function valid(list) {
    return Array.isArray(list) && list.every(function (b) {
      if (!b || PALETTE.indexOf(b.t) < 0) return false;
      if (b.t === 'W') return valid(b.a);
      if (b.t === 'I') return !!COND[b.c] && valid(b.a) && valid(b.b);
      return true;
    });
  }
  function listAt(path) {
    var l = prog;
    for (var i = 0; i < path.length; i += 2) l = l[path[i]][path[i + 1]];
    return l;
  }
  function where(path) {
    if (!path.length) return 'im Programm';
    var b = listAt(path.slice(0, -2))[path[path.length - 2]];
    return b.t === 'W' ? 'in „wiederhole, mache“' : (path[path.length - 1] === 'a' ? 'in „wenn, mache“' : 'in „wenn, sonst“');
  }

  var el, api, prog, armed, locked, robot, timer, running, speed, msg, msgEl, mazeEl, robotEl, runBtn, drag;

  /* ---------- Darstellung des Programms ---------- */
  function blockEl(b, path, idx) {
    var rm = locked ? null : h('button', {
      type: 'button', class: 't-kurzesprogramm17-rm', 'data-rm': JSON.stringify(path.concat([idx])),
      'aria-label': 'Baustein „' + LABEL[b.t] + '“ entfernen'
    }, '×');
    if (b.t === 'F' || b.t === 'L' || b.t === 'R') {
      return h('div', { class: 't-kurzesprogramm17-blk k' + b.t }, h('span', { class: 't-kurzesprogramm17-bt' }, LABEL[b.t]), rm);
    }
    var here = path.concat([idx]);
    if (b.t === 'W') {
      return h('div', { class: 't-kurzesprogramm17-blk kW' },
        h('div', { class: 't-kurzesprogramm17-head' }, h('span', { class: 't-kurzesprogramm17-bt' }, 'wiederhole'), rm),
        h('div', { class: 't-kurzesprogramm17-sub' }, h('span', { class: 't-kurzesprogramm17-lab' }, 'mache'), listEl(b.a, here.concat(['a']))));
    }
    var sel = h('select', { class: 't-kurzesprogramm17-sel', 'aria-label': 'Richtung der Bedingung', 'data-cond': JSON.stringify(here), disabled: locked },
      Object.keys(COND).map(function (k) { return h('option', { value: k, selected: b.c === k }, COND[k]); }));
    return h('div', { class: 't-kurzesprogramm17-blk kI' },
      h('div', { class: 't-kurzesprogramm17-head' }, h('span', { class: 't-kurzesprogramm17-bt' }, 'wenn'), sel, h('span', { class: 't-kurzesprogramm17-bt' }, 'frei'), rm),
      h('div', { class: 't-kurzesprogramm17-sub' }, h('span', { class: 't-kurzesprogramm17-lab' }, 'mache'), listEl(b.a, here.concat(['a']))),
      h('div', { class: 't-kurzesprogramm17-sub' }, h('span', { class: 't-kurzesprogramm17-lab' }, 'sonst'), listEl(b.b, here.concat(['b']))));
  }
  function marker(path, i, empty) {
    var on = !!armed && !locked;
    return h('div', {
      class: 't-kurzesprogramm17-ins' + (empty ? ' empty' : '') + (on ? ' on' : ''), 'data-ins': JSON.stringify(path), 'data-idx': String(i),
      role: on ? 'button' : false, tabindex: on ? '0' : false, 'aria-hidden': on ? false : 'true',
      'aria-label': on ? 'Baustein „' + LABEL[armed] + '“ hier einfügen, Position ' + (i + 1) + ' ' + where(path) : false
    }, h('span', null, on ? '+ hier einfügen' : (empty ? 'leer' : '')));
  }
  function listEl(list, path) {
    var kids = [];
    if (!list.length) kids.push(marker(path, 0, true));
    else {
      list.forEach(function (b, i) { kids.push(marker(path, i, false)); kids.push(blockEl(b, path, i)); });
      kids.push(marker(path, list.length, false));
    }
    return h('div', { class: 't-kurzesprogramm17-list' }, kids);
  }

  function paletteEl() {
    var n = count(prog);
    return h('div', { class: 't-kurzesprogramm17-palette', role: 'group', 'aria-label': 'Bausteine' },
      PALETTE.map(function (t) {
        var on = armed === t;
        return h('button', {
          type: 'button', class: 't-kurzesprogramm17-pal k' + t + (on ? ' armed' : ''), 'data-pal': t, 'aria-pressed': String(on),
          draggable: locked ? false : 'true', disabled: locked
        }, LABEL[t]);
      }), h('span', { class: 't-kurzesprogramm17-cnt' + (n >= MAX_BLOCKS ? ' full' : '') }, 'Bausteine: ' + n + ' von ' + MAX_BLOCKS));
  }

  /* ---------- Raum und Roboter ---------- */
  function mazeSvg() {
    var kids = [
      S('rect', { x: 0, y: 0, width: W + 2, height: H + 2, class: 't-kurzesprogramm17-wall' }),
      S('rect', { x: 1, y: 1, width: W, height: H, class: 't-kurzesprogramm17-floor' }),
      S('rect', { x: 1 + START.x, y: 1 + START.y, width: 1, height: 1, class: 't-kurzesprogramm17-start' }),
      S('rect', { x: 1 + GOAL.x, y: 1 + GOAL.y, width: 1, height: 1, class: 't-kurzesprogramm17-goal' })
    ];
    var i;
    for (i = 1; i < W; i++) kids.push(S('line', { x1: 1 + i, y1: 1, x2: 1 + i, y2: 1 + H, class: 't-kurzesprogramm17-grid' }));
    for (i = 1; i < H; i++) kids.push(S('line', { x1: 1, y1: 1 + i, x2: 1 + W, y2: 1 + i, class: 't-kurzesprogramm17-grid' }));
    robotEl = S('g', { class: 't-kurzesprogramm17-robot' },
      S('polygon', { points: '-0.36,-0.36 0.4,0 -0.36,0.36', class: 't-kurzesprogramm17-tri' }),
      S('circle', { cx: -0.08, cy: 0, r: 0.1, class: 't-kurzesprogramm17-eye' }));
    kids.push(robotEl);
    return S.apply(null, ['svg', {
      viewBox: '0 0 ' + (W + 2) + ' ' + (H + 2), class: 't-kurzesprogramm17-maze', role: 'img',
      'aria-label': 'Raum mit 8 mal 5 Feldern. Der Roboter startet unten auf dem roten Feld in der zweiten Spalte und schaut nach rechts. Das grüne Zielfeld liegt oben an der Wand in der sechsten Spalte.'
    }].concat(kids));
  }
  function placeRobot(s) {
    robot = s;
    var deg = [0, -90, 180, 90][s.d];
    robotEl.style.transform = 'translate(' + (1.5 + s.x) + 'px,' + (1.5 + s.y) + 'px) rotate(' + deg + 'deg)';
  }
  function say(t) { msg = t; if (msgEl) msgEl.textContent = t; }

  function stopRun() {
    if (timer) { clearInterval(timer); timer = null; }
    running = false;
    if (runBtn) runBtn.textContent = 'Programm testen';
  }
  function resultText(r) {
    if (r.reached) return 'Der Roboter hat das Ziel erreicht (nach ' + r.trace.length + ' Schritten).';
    if (r.reason === 'leer') return 'Eine leere Wiederholung tut nichts. Der Roboter kommt nicht zum Ziel.';
    if (r.reason === 'limit') return 'Das Programm läuft immer weiter, ohne das Ziel zu erreichen. Der Test wurde abgebrochen.';
    return 'Das Programm ist zu Ende, aber der Roboter hat das Ziel nicht erreicht.';
  }
  function runTest() {
    if (running) { stopRun(); say('Test angehalten.'); return; }
    if (!prog.length) { say('Baue zuerst ein Programm aus Bausteinen.'); return; }
    var r = simulate(prog);
    placeRobot({ x: START.x, y: START.y, d: START.d });
    running = true; runBtn.textContent = 'Anhalten';
    say('Der Roboter läuft …');
    var i = 0, shown = r.trace.slice(0, 150);
    var ms = { slow: 600, normal: 280, fast: 70 }[speed];
    timer = setInterval(function () {
      if (i >= shown.length) {
        stopRun();
        say(resultText(r) + (r.trace.length > shown.length ? '' : ''));
        return;
      }
      placeRobot(shown[i++]);
    }, ms);
  }
  function resetRobot() { stopRun(); placeRobot({ x: START.x, y: START.y, d: START.d }); say(''); }

  function render() {
    var had = el.contains(document.activeElement) ? document.activeElement : null;
    var focusKey = had && had.getAttribute ? (had.getAttribute('data-pal') ? 'pal:' + had.getAttribute('data-pal') : null) : null;
    mazeEl = mazeSvg();
    runBtn = h('button', { type: 'button', class: 'btn', 'data-run': '' }, running ? 'Anhalten' : 'Programm testen');
    msgEl = h('p', { class: 't-kurzesprogramm17-msg', role: 'status', 'aria-live': 'polite' }, msg);
    var speeds = h('div', { class: 't-kurzesprogramm17-speed', role: 'group', 'aria-label': 'Geschwindigkeit' },
      [['slow', 'langsam'], ['normal', 'normal'], ['fast', 'schnell']].map(function (s) {
        return h('button', { type: 'button', class: 't-kurzesprogramm17-sp' + (speed === s[0] ? ' on' : ''), 'data-speed': s[0], 'aria-pressed': String(speed === s[0]) }, s[1]);
      }));
    var work = h('div', { class: 't-kurzesprogramm17-work' + (armed && !locked ? ' armed' : ''), 'data-work': '' },
      h('h3', null, 'Dein Programm'),
      prog.length ? listEl(prog, []) : h('div', { class: 't-kurzesprogramm17-ins empty top' + (armed && !locked ? ' on' : ''), 'data-ins': '[]', 'data-idx': '0',
        role: armed && !locked ? 'button' : false, tabindex: armed && !locked ? '0' : false,
        'aria-label': armed && !locked ? 'Baustein „' + LABEL[armed] + '“ als ersten Baustein einfügen' : false },
      h('span', null, armed && !locked ? '+ hier einfügen' : 'Noch leer. Wähle einen Baustein und tippe hier.')));
    el.replaceChildren(h('div', { class: 't-kurzesprogramm17-wrap' },
      h('div', { class: 't-kurzesprogramm17-stage' },
        h('div', { class: 't-kurzesprogramm17-mazebox' }, mazeEl),
        h('div', { class: 't-kurzesprogramm17-ctl' }, runBtn, h('button', { type: 'button', class: 'btn ghost', 'data-back': '' }, 'Roboter zurück')),
        speeds, msgEl),
      h('div', { class: 't-kurzesprogramm17-prog' },
        h('h3', null, 'Bausteine'), paletteEl(), work)));
    placeRobot(robot || START);
    if (focusKey) { var f = el.querySelector('[data-pal="' + focusKey.slice(4) + '"]'); if (f && !f.disabled) f.focus({ preventScroll: true }); }
  }

  function changed() {
    stopRun();
    robot = { x: START.x, y: START.y, d: START.d };
    msg = '';
    render();
    api.changed('Bausteine: ' + count(prog) + ' von ' + MAX_BLOCKS);
  }

  function insert(path, idx, t) {
    if (locked) return;
    if (count(prog) >= MAX_BLOCKS) { armed = null; stopRun(); msg = 'Du darfst höchstens vier Bausteine benutzen. Entferne zuerst einen Baustein mit „×“.'; render(); return; }
    listAt(path).splice(idx, 0, newBlock(t));
    armed = null;
    changed();
  }

  function onClick(e) {
    var t = e.target;
    var pal = t.closest('[data-pal]');
    if (pal && !locked) {
      armed = armed === pal.getAttribute('data-pal') ? null : pal.getAttribute('data-pal');
      stopRun(); render();
      if (armed && count(prog) >= MAX_BLOCKS) say('Du hast schon vier Bausteine. Entferne zuerst einen Baustein mit „×“.');
      return;
    }
    var ins = t.closest('[data-ins]');
    if (ins && armed && !locked) { insert(JSON.parse(ins.getAttribute('data-ins')), +ins.getAttribute('data-idx'), armed); return; }
    var rm = t.closest('[data-rm]');
    if (rm && !locked) {
      var p = JSON.parse(rm.getAttribute('data-rm'));
      listAt(p.slice(0, -1)).splice(p[p.length - 1], 1);
      armed = null;
      changed();
      return;
    }
    if (t.closest('[data-run]')) { runTest(); return; }
    if (t.closest('[data-back]')) { resetRobot(); return; }
    var sp = t.closest('[data-speed]');
    if (sp) {
      speed = sp.getAttribute('data-speed');
      [].forEach.call(el.querySelectorAll('[data-speed]'), function (b) {
        var on = b.getAttribute('data-speed') === speed; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
      });
    }
  }
  function onKey(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var ins = e.target.closest && e.target.closest('[data-ins]');
    if (ins && ins === e.target && armed && !locked) { e.preventDefault(); insert(JSON.parse(ins.getAttribute('data-ins')), +ins.getAttribute('data-idx'), armed); }
  }
  function onChangeSel(e) {
    var s = e.target.closest('[data-cond]');
    if (!s || locked) return;
    var p = JSON.parse(s.getAttribute('data-cond'));
    listAt(p.slice(0, -1))[p[p.length - 1]].c = s.value;
    changed();
    var want = JSON.stringify(p);
    [].forEach.call(el.querySelectorAll('[data-cond]'), function (n) { if (n.getAttribute('data-cond') === want) n.focus({ preventScroll: true }); });
  }
  function onDragStart(e) {
    var pal = e.target.closest && e.target.closest('[data-pal]');
    if (!pal || locked) return;
    drag = pal.getAttribute('data-pal');
    e.dataTransfer.setData('text/plain', drag);
    e.dataTransfer.effectAllowed = 'copy';
    setTimeout(function () { if (drag && el) el.classList.add('t-kurzesprogramm17-dragging'); }, 0);
  }
  function onDragOver(e) {
    var ins = e.target.closest && e.target.closest('[data-ins]');
    if (!ins || !drag || locked) return;
    e.preventDefault();
    ins.classList.add('over');
  }
  function onDragLeave(e) { var ins = e.target.closest && e.target.closest('[data-ins]'); if (ins) ins.classList.remove('over'); }
  function onDrop(e) {
    var ins = e.target.closest && e.target.closest('[data-ins]');
    if (!ins || !drag || locked) return;
    e.preventDefault();
    var t = drag; drag = null;
    el.classList.remove('t-kurzesprogramm17-dragging');
    insert(JSON.parse(ins.getAttribute('data-ins')), +ins.getAttribute('data-idx'), t);
  }
  function onDragEnd() { drag = null; el.classList.remove('t-kurzesprogramm17-dragging'); [].forEach.call(el.querySelectorAll('.over'), function (n) { n.classList.remove('over'); }); }

  function fresh() { prog = []; armed = null; robot = { x: START.x, y: START.y, d: START.d }; msg = ''; stopRun(); }

  Biber.register({
    id: 'kurzesprogramm17',
    story: '<p>Der dreieckige Roboter soll vom roten Startfeld zum grünen Zielfeld gehen. ' +
      'Der Roboter kann nur sehr kurze Programme verarbeiten.</p>' +
      '<p><b>Programmiere den Roboter!</b> Füge dazu Programmbausteine zusammen. Du darfst höchstens vier Bausteine für dein Programm benutzen.</p>',
    question: 'Wie muss das Programm aussehen, damit der Roboter das Zielfeld erreicht?',
    howto: 'Tippe einen Baustein an und dann auf „+ hier einfügen“. Mit der Maus kannst Du die Bausteine auch ziehen. ' +
      'Bei „wenn“ stellst Du die Richtung ein. Mit „×“ entfernst Du einen Baustein, mit „Programm testen“ lässt Du den Roboter laufen.',
    explanation: function () {
      return '<p>Startfeld und Zielfeld liegen an der Wand. Wenn der Roboter immer an der Wand entlanggeht, erreicht er sicher das Ziel. ' +
        'Dazu wiederholt er: <b>wenn vorne frei ist, gehe vorwärts, sonst drehe nach links.</b> Das sind genau vier Bausteine: wiederhole, wenn/sonst, gehe vorwärts, drehe nach links. ' +
        'Von Hand wären es 14 Schritte: sechsmal vor, links, viermal vor, links, zweimal vor.</p>' +
        '<p>Das ist Informatik: Die Wiederholung (Schleife) führt beliebig viele Vorwärtsschritte und Drehungen aus, bis das Ziel erreicht ist. ' +
        'Die bedingte Anweisung („wenn … mache … sonst …“) sorgt dafür, dass der Roboter bis zur nächsten Wand geht und dort die Richtung ändert. ' +
        'Dieses kurze Programm findet aber nicht den kürzesten Weg und würde bei einem Ziel mitten im Raum nicht funktionieren.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; speed = 'normal'; running = false; fresh();
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKey);
      el.addEventListener('change', onChangeSel);
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('dragleave', onDragLeave);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', onDragEnd);
      render();
    },
    isComplete: function () { return prog.length > 0; },
    evaluate: function () { return { correct: simulate(prog).reached && count(prog) <= MAX_BLOCKS, answer: copy(prog) }; },
    setAnswer: function (ans) {
      stopRun();
      prog = valid(ans) ? copy(ans) : [];
      armed = null;
      var r = simulate(prog);
      robot = r.last;
      msg = prog.length ? resultText(r) : '';
      render();
    },
    lock: function (on) { locked = on; if (on) { armed = null; stopRun(); } render(); },
    reset: function () { fresh(); render(); },
    showSolution: function () {
      stopRun();
      prog = copy(OFFICIAL); armed = null; locked = true;
      var r = simulate(prog);
      robot = r.last; msg = resultText(r);
      render();
    }
  });
})();
