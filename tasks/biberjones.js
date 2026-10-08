/* Aufgabe Biber Jones (Klasse 11-13, schwer): Fallblöcke, schnellster Weg und kürzeste Anweisungsfolge (Pareto-Optimum) */
(function () {
  'use strict';
  var h = Biber.h;

  /* ---------- Daten ---------- */
  var EXAMPLE = [2, 3];                 /* erster Gang: Block A Takt 2, Block B Takt 3 */
  var TAKTS = [3, 5, 8, 4];             /* zweiter Gang: A:3 B:5 C:8 D:4 */
  var NAMES = ['A', 'B', 'C', 'D'];
  var MAXLEN = 12, MAXWAIT = 30, MAXMERGED = 99, SHOWROWS = 40;

  /* Ein Block mit Takt T ist am Anfang unten, in den Minuten T bis 2T-1 oben, dann wieder unten usw. */
  function up(T, t) { return Math.floor(t / T) % 2 === 1; }

  function fmt(ins) {
    if (ins.op === 'wait') return 'wait(' + ins.n + ')';
    if (ins.op === 'block') return 'goto_block(' + ins.k + ')';
    return 'goto_treasure';
  }
  function posName(pos, n) { return pos === 0 ? 'am Start' : pos === n + 1 ? 'beim Schatz' : 'unter Block ' + NAMES[pos - 1]; }

  /* ---------- Simulation ----------
     Positionen: 0 = Start, 1..n = unter Block A.., n+1 = Schatz. Wechsel dauern keine Zeit; dabei müssen
     alle Blöcke auf dem Weg (inklusive Zielblock) in diesem Moment oben sein. Wer unter einem Block wartet,
     muss ihn bis zum Ende der Wartezeit oben haben (fällt er in dem Moment, ist Jones zerquetscht). */
  function crossing(pos, q, n) {          /* Blöcke, die beim Wechsel von pos nach q passiert werden */
    var out = [], b;
    if (q > pos) for (b = pos + 1; b <= Math.min(q, n); b++) out.push(b);
    else for (b = Math.max(q, 1); b < pos; b++) out.push(b);
    return out;
  }
  function sim(takts, prog) {
    var n = takts.length, t = 0, pos = 0, status = 'open', msg = '', states = [{ pos: 0 }], steps = [], i;
    function at(time) { if (!states[time]) states[time] = { pos: states[time - 1].pos }; return states[time]; }
    for (i = 0; i < prog.length; i++) {
      var ins = prog[i];
      if (status !== 'open') { steps.push({ ignored: true }); continue; }
      if (ins.op === 'wait') {
        var s, crash = null;
        for (s = t + 1; s <= t + ins.n; s++) {
          at(s);
          if (pos >= 1 && pos <= n && !up(takts[pos - 1], s)) { crash = s; break; }
          states[s].pos = pos;
        }
        if (crash !== null) {
          states[crash].crash = pos;
          t = crash; status = 'crushed';
          msg = 'Jones wird in Minute ' + crash + ' von Block ' + NAMES[pos - 1] + ' zerquetscht.';
          steps.push({ fail: true, t: crash });
        } else { t += ins.n; steps.push({ t: t }); }
      } else {
        var q = ins.op === 'treasure' ? n + 1 : NAMES.indexOf(ins.k) + 1;
        var blocked = null;
        crossing(pos, q, n).forEach(function (b) { if (blocked === null && !up(takts[b - 1], t)) blocked = b; });
        if (blocked !== null) {
          at(t).blocked = blocked;
          status = 'blocked';
          msg = 'In Minute ' + t + ' ist Block ' + NAMES[blocked - 1] + ' unten. Jones kommt nicht durch.';
          steps.push({ fail: true, t: t });
        } else {
          pos = q; at(t).pos = pos; steps.push({ t: t });
          if (pos === n + 1) { status = 'done'; msg = 'Jones erreicht den Schatz nach ' + t + (t === 1 ? ' Minute.' : ' Minuten.'); }
        }
      }
    }
    if (status === 'open') msg = prog.length ? 'Jones hat den Schatz noch nicht erreicht.' : '';
    return { status: status, time: t, msg: msg, states: states, steps: steps, n: n, len: prog.length };
  }

  /* ---------- Beste Lösung durch Suche ----------
     Zustände (Minute, Position); jede Anweisung kostet 1. Breitensuche nach Anzahl der Anweisungen. */
  var BEST = (function () {
    var n = TAKTS.length, TMAX = 60, seen = {}, layer = [[0, 0]], c, front = [];
    seen['0,0'] = { c: 0, from: null, ins: null };
    function visit(t, pos, from, ins, cost, next) {
      var key = t + ',' + pos;
      if (seen[key]) return;
      seen[key] = { c: cost, from: from, ins: ins };
      if (pos < n + 1) next.push([t, pos]);
    }
    for (c = 0; c < 8 && layer.length; c++) {
      var next = [];
      layer.forEach(function (st) {
        var t = st[0], pos = st[1], from = t + ',' + pos, q, k;
        for (q = 1; q <= n + 1; q++) {
          if (q === pos) continue;
          if (crossing(pos, q, n).every(function (b) { return up(TAKTS[b - 1], t); }))
            visit(t, q, from, q === n + 1 ? { op: 'treasure' } : { op: 'block', k: NAMES[q - 1] }, c + 1, next);
        }
        for (k = 1; t + k <= TMAX; k++) {
          if (pos >= 1 && !up(TAKTS[pos - 1], t + k)) break;
          visit(t + k, pos, from, { op: 'wait', n: k }, c + 1, next);
        }
      });
      layer = next;
    }
    var bestTime = null, minCost = 99, t, key, prog = [], s;
    for (t = 0; t <= TMAX; t++) {
      s = seen[t + ',' + (n + 1)];
      if (s && s.c < minCost) { minCost = s.c; front.push({ time: t, len: s.c }); if (bestTime === null) bestTime = t; }
    }
    key = bestTime + ',' + (n + 1);
    while (seen[key] && seen[key].from) { prog.unshift(seen[key].ins); key = seen[key].from; }
    return { time: bestTime, len: front[0].len, prog: prog, front: front };
  })();

  /* ---------- Zeichnung: Gang als Streifen, eine Zeile pro Minute ---------- */
  var LBL = 34, CW = 44, HH = 24, RH = 30;

  function jones(cx, cy) {
    return '<g transform="translate(' + cx + ' ' + cy + ') scale(0.9)">' +
      '<ellipse class="bj-body" cx="0" cy="7" rx="6.5" ry="6.5"/><circle class="bj-head" cx="0" cy="-3" r="6.2"/>' +
      '<ellipse class="bj-hat" cx="0" cy="-8" rx="10" ry="2.4"/><path class="bj-hat" d="M-5.5 -8 L-4.5 -15 L4.5 -15 L5.5 -8 Z"/>' +
      '<circle class="bj-eye" cx="-2.3" cy="-3" r="0.9"/><circle class="bj-eye" cx="2.3" cy="-3" r="0.9"/></g>';
  }
  function chest(cx, cy) {
    return '<g transform="translate(' + cx + ' ' + cy + ')"><rect class="bj-chest" x="-11" y="-6" width="22" height="13" rx="2"/>' +
      '<path class="bj-gold" d="M-11 -6 Q0 -15 11 -6 Z"/><rect class="bj-lock" x="-2" y="-2" width="4" height="5"/></g>';
  }
  function strip(takts, states, opts) {
    opts = opts || {};
    var n = takts.length, cells = n + 2, W = LBL + cells * CW, rows = states.length, r, i, out = [], label = [];
    var H = HH + rows * RH;
    out.push('<rect class="bj-head-bg" x="0" y="0" width="' + W + '" height="' + HH + '"/>');
    out.push('<text class="bj-hd" x="' + (LBL - 6) + '" y="16" text-anchor="end">min</text>');
    takts.forEach(function (T, b) {
      out.push('<text class="bj-hd" x="' + (LBL + (b + 1) * CW + CW / 2) + '" y="17" text-anchor="middle">' + NAMES[b] + ':' + T + '</text>');
    });
    for (r = 0; r < rows; r++) {
      var y = HH + r * RH, stt = states[r] || { pos: 0 }, down = [];
      out.push('<rect class="bj-row' + (stt.crash || stt.blocked ? ' bad' : '') + '" x="0" y="' + y + '" width="' + W + '" height="' + RH + '"/>');
      out.push('<text class="bj-t" x="' + (LBL - 8) + '" y="' + (y + RH / 2 + 4) + '" text-anchor="end">' + r + '</text>');
      out.push('<rect class="bj-floor" x="' + LBL + '" y="' + (y + RH - 5) + '" width="' + (cells * CW) + '" height="5"/>');
      out.push('<circle class="bj-glow" cx="' + (LBL + CW / 2) + '" cy="' + (y + RH / 2) + '" r="12"/>');
      for (i = 1; i <= n; i++) {
        var x = LBL + i * CW;
        if (up(takts[i - 1], r)) {
          out.push('<ellipse class="bj-shadow" cx="' + (x + CW / 2) + '" cy="' + (y + RH - 2.5) + '" rx="16" ry="2"/>');
        } else {
          down.push(NAMES[i - 1]);
          var bad = stt.blocked === i || stt.crash === i;
          out.push('<g class="bj-block' + (bad ? ' bad' : '') + '"><rect x="' + (x + 3) + '" y="' + (y + 2) + '" width="' + (CW - 6) + '" height="' + (RH - 6) + '" rx="3"/>' +
            '<path d="M' + (x + 3) + ' ' + (y + RH / 2 - 1) + ' H' + (x + CW - 3) + ' M' + (x + CW / 2) + ' ' + (y + 2) + ' V' + (y + RH / 2 - 1) +
            ' M' + (x + CW / 3) + ' ' + (y + RH / 2 - 1) + ' V' + (y + RH - 4) + '"/></g>');
        }
      }
      out.push(chest(LBL + (n + 1) * CW + CW / 2, y + RH / 2 - 1));
      var px = LBL + stt.pos * CW + CW / 2;
      if (stt.crash) out.push('<text class="bj-x" x="' + (LBL + stt.crash * CW + CW / 2) + '" y="' + (y + RH / 2 + 6) + '" text-anchor="middle">✗</text>');
      else out.push(jones(px, y + RH / 2 - 1));
      label.push('Minute ' + r + ': Jones ' + (stt.crash ? 'zerquetscht unter Block ' + NAMES[stt.crash - 1] : posName(stt.pos, n)) +
        ', Blöcke unten: ' + (down.length ? down.join(', ') : 'keiner'));
    }
    return '<svg class="bj-svg' + (opts.cls ? ' ' + opts.cls : '') + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' +
      (opts.title ? opts.title + '. ' : '') + label.join('. ') + '" focusable="false">' + out.join('') + '</svg>';
  }

  /* Beispielgang aus dem Heft: wait(2), goto_block(A), wait(1), goto_treasure, gezeigt bis Minute 4 */
  var EX_PROG = [{ op: 'wait', n: 2 }, { op: 'block', k: 'A' }, { op: 'wait', n: 1 }, { op: 'treasure' }];
  function exampleStrip() {
    var r = sim(EXAMPLE, EX_PROG), st = r.states.slice();
    st.push({ pos: EXAMPLE.length + 1 });
    return strip(EXAMPLE, st, { title: 'Beispielgang mit Block A (Takt 2) und Block B (Takt 3), eine Zeile pro Minute', cls: 'bj-ex' });
  }

  /* ---------- Zustand und Oberfläche ---------- */
  var el, api, locked, mark, prog, waitN, showStrip;
  var listEl, statusEl, stripEl, stripBtn, gangEl, waitIn, addWait, btnBlocks, btnTreasure, btnUndo, btnClear, tools;

  function reset() { prog = []; mark = null; waitN = 1; showStrip = false; }

  function isBest(r) { return r.status === 'done' && r.time === BEST.time && r.len === BEST.len; }

  function update(quiet) {
    var r = sim(TAKTS, prog);
    listEl.replaceChildren.apply(listEl, prog.length ? prog.map(function (ins, i) {
      var s = r.steps[i] || {}, note = '';
      if (s.ignored) note = 'wird nicht mehr ausgeführt';
      else if (s.fail) note = '✗ Minute ' + s.t;
      else if (s.t !== undefined) note = 'Minute ' + s.t;
      return h('li', { class: 'bj-ins' + (s.fail ? ' fail' : '') + (s.ignored ? ' ign' : '') },
        h('code', null, fmt(ins)), h('span', { class: 'bj-note' }, note),
        h('button', {
          type: 'button', class: 'bj-del', disabled: locked, 'aria-label': 'Anweisung ' + (i + 1) + ' entfernen: ' + fmt(ins),
          onclick: function () { if (locked) return; prog.splice(i, 1); update(); }
        }, '×'));
    }) : [h('li', { class: 'bj-empty' }, 'Noch keine Anweisung. Füge unten welche an.')]);
    var full = prog.length >= MAXLEN;
    addWait.disabled = locked || full;
    btnBlocks.forEach(function (b) { b.disabled = locked || full; });
    btnTreasure.disabled = locked || full;
    btnUndo.disabled = locked || !prog.length;
    btnClear.disabled = locked || !prog.length;
    waitIn.disabled = locked;
    stripBtn.hidden = locked;
    var shown = showStrip || locked;
    stripBtn.setAttribute('aria-expanded', String(shown));
    stripBtn.textContent = shown ? 'Ablauf verbergen' : 'Ablauf anzeigen';

    var text = r.msg || 'Baue eine Folge von Anweisungen für Jones.';
    if (prog.length) text += ' (' + prog.length + (prog.length === 1 ? ' Anweisung' : ' Anweisungen') + ')';
    var cls = r.status === 'done' ? ' good' : r.status === 'crushed' || r.status === 'blocked' ? ' bad' : '';
    if (locked && mark) {
      var ok = isBest(r);
      cls = ok ? ' good' : ' bad';
      if (!ok && r.status === 'done') text += r.time > BEST.time ? ' Das geht schneller.' : ' Das geht mit weniger Anweisungen.';
    }
    statusEl.textContent = text;
    statusEl.className = 'bj-status' + cls;
    if (shown) {
      var sts = r.states.slice(0, SHOWROWS);
      stripEl.innerHTML = prog.length ? strip(TAKTS, sts, { title: 'Ablauf deiner Anweisungen, eine Zeile pro Minute' }) +
        (r.states.length > SHOWROWS ? '<p class="bj-cut">Es sind nur die ersten ' + SHOWROWS + ' Minuten dargestellt.</p>' : '') :
        '<p class="bj-cut">Noch nichts zu zeigen. Füge zuerst Anweisungen an.</p>';
      stripEl.hidden = false;
    } else { stripEl.innerHTML = ''; stripEl.hidden = true; }
    if (!quiet) api.changed(text);
  }

  function addIns(ins) {
    if (locked || prog.length >= MAXLEN && !(ins.op === 'wait' && prog.length && prog[prog.length - 1].op === 'wait')) return;
    var last = prog[prog.length - 1];
    if (ins.op === 'wait' && last && last.op === 'wait') last.n = Math.min(MAXMERGED, last.n + ins.n);
    else prog.push(ins);
    update();
  }
  function readWait() {
    var v = parseInt(waitIn.value, 10);
    if (isNaN(v) || v < 1) v = 1;
    if (v > MAXWAIT) v = MAXWAIT;
    waitN = v; waitIn.value = String(v);
    return v;
  }

  function setProg(list) {
    prog = (list || []).filter(function (ins) {
      return ins && (ins.op === 'treasure' || (ins.op === 'block' && NAMES.indexOf(ins.k) >= 0) || (ins.op === 'wait' && ins.n >= 1));
    }).map(function (ins) { return ins.op === 'wait' ? { op: 'wait', n: ins.n } : ins.op === 'block' ? { op: 'block', k: ins.k } : { op: 'treasure' }; });
  }

  Biber.register({
    id: 'biberjones',
    story:
      '<p>Biber Jones ist in einer perfiden Pyramide mit gefährlichen Gängen. Am Ende jedes Ganges befindet sich ein sagenhafter Schatz. Jones will jeden Schatz so schnell wie möglich erreichen.</p>' +
      '<p>Jedoch ist jeder Gang durch eine Reihe von Fallblöcken gesichert. Am Anfang sind alle Blöcke unten. Sobald jemand den Gang betritt, beginnen die Blöcke sich zu bewegen. Jeder Block bewegt sich in festem Takt nach oben und unten. Zum Beispiel schnellt ein Block mit Takt 2 nach 2 Minuten hoch und kracht nach weiteren 2 Minuten wieder herunter.</p>' +
      '<p>Jones steht vor seiner ersten Herausforderung: Dieser Gang hat zwei Blöcke: Block A hat Takt 2, Block B Takt 3. Glücklicherweise hat Jones eine Schriftrolle mit Anweisungen gefunden, wie man so schnell wie möglich sicher den Schatz erreicht:</p>' +
      '<pre class="bj-code">wait(2)\ngoto_block(A)\nwait(1)\ngoto_treasure</pre>' +
      '<p>Jones befolgt die Anweisungen: Er wartet 2 Minuten, geht dann zu Block A, wartet dort 1 Minute und geht dann zum Schatz. Er erreicht den Schatz nach 3 Minuten. Jede Zeile des Bildes zeigt eine Minute. Ein dunkler Block ist unten, bei einem Block, der oben ist, sieht man nur den Schatten am Boden.</p>' +
      exampleStrip() +
      '<p>Jones bemerkt, dass er auch mit weniger Anweisungen den Schatz erreicht hätte, und zwar gleich schnell:</p>' +
      '<pre class="bj-code">wait(3)\ngoto_treasure</pre>' +
      '<p>Er kommt zum nächsten Gang. Der hat vier Blöcke, mit Takt 3, 5, 8 und 4.</p>',
    question: 'Was ist die kürzeste Folge von Anweisungen, mit denen Jones so schnell wie möglich den Schatz erreicht?',
    howto: 'Füge Anweisungen an: wait(n) mit einer Zahl, goto_block(A bis D) oder goto_treasure. Mit „Ablauf anzeigen“ siehst du, was in jeder Minute passiert. Mit × entfernst du eine Anweisung.',
    explanation: function () {
      var sol = BEST.prog.map(fmt).join(', ');
      var other = BEST.front.slice(1).map(function (f) { return f.time + ' Minuten mit ' + f.len + ' Anweisungen'; }).join('; ');
      return '<p>Ein Block mit Takt T ist ab Minute T oben (bis Minute 2T), dann wieder unten, und so weiter. Die Blöcke A (3), B (5), C (8) und D (4) sind erst in Minute 15 alle gleichzeitig oben. ' +
        'Wer nur wartet, braucht also <code>wait(15)</code>, <code>goto_treasure</code>: zwei Anweisungen, aber 15 Minuten.</p>' +
        '<p>Schneller geht es in Etappen. In Minute 9 sind A, B und C gleichzeitig oben, Jones geht bis unter C und ist dort sicher, denn C bleibt bis Minute 16 oben. Block D hebt sich in Minute 12, dann geht Jones zum Schatz: <code>' + sol.replace(/, /g, '</code>, <code>') + '</code>. ' +
        'Das sind <strong>' + BEST.time + ' Minuten und ' + BEST.len + ' Anweisungen</strong>. Eine vollständige Suche über alle Anweisungsfolgen zeigt, dass es nicht schneller geht und dass es für ' + BEST.time + ' Minuten keine kürzere Folge gibt.</p>' +
        '<p>Zeit und Länge der Folge sind zwei Ziele, die sich widersprechen: ' + (other ? 'Die Folge mit ' + other + ' ist kürzer, aber langsamer. ' : '') +
        'Beide Lösungen sind <em>Pareto-optimal</em>, denn man kann keine verbessern, ohne bei dem anderen Ziel zu verlieren. Gefragt war zuerst nach der Schnellsten, davon die Kürzeste.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      gangEl = h('div', { class: 'bj-gang' });
      gangEl.innerHTML = strip(TAKTS, [{ pos: 0 }], { title: 'Zweiter Gang mit vier Blöcken: A hat Takt 3, B Takt 5, C Takt 8 und D Takt 4' });
      listEl = h('ol', { class: 'bj-list', 'aria-label': 'Deine Anweisungen' });
      statusEl = h('p', { class: 'bj-status', role: 'status', 'aria-live': 'polite' });
      stripEl = h('div', { class: 'bj-strip', hidden: true });
      stripBtn = h('button', { type: 'button', class: 'btn ghost bj-sbtn', 'aria-expanded': 'false', onclick: function () { showStrip = !showStrip; update(true); } }, 'Ablauf anzeigen');
      waitIn = h('input', {
        type: 'number', class: 'bj-num', min: '1', max: String(MAXWAIT), value: '1', inputmode: 'numeric', 'aria-label': 'Wartezeit in Minuten',
        onchange: readWait, oninput: function () { if (waitIn.value !== '') readWait(); }
      });
      function stepBtn(d, sign) {
        return h('button', {
          type: 'button', class: 'bj-step', 'aria-label': d < 0 ? 'Wartezeit verringern' : 'Wartezeit erhöhen',
          onclick: function () { if (waitIn.disabled) return; waitIn.value = String(Math.max(1, Math.min(MAXWAIT, readWait() + d))); readWait(); }
        }, sign);
      }
      addWait = h('button', { type: 'button', class: 'btn bj-add', onclick: function () { addIns({ op: 'wait', n: readWait() }); } }, 'anfügen');
      btnBlocks = NAMES.map(function (k) {
        return h('button', { type: 'button', class: 'btn ghost bj-go', 'aria-label': 'Anweisung goto_block(' + k + ') anfügen', onclick: function () { addIns({ op: 'block', k: k }); } }, k);
      });
      btnTreasure = h('button', { type: 'button', class: 'btn ghost bj-go bj-tr', 'aria-label': 'Anweisung goto_treasure anfügen', onclick: function () { addIns({ op: 'treasure' }); } }, 'goto_treasure');
      btnUndo = h('button', { type: 'button', class: 'btn ghost bj-tool', onclick: function () { if (!locked) { prog.pop(); update(); } } }, 'Letzte entfernen');
      btnClear = h('button', { type: 'button', class: 'btn ghost bj-tool', onclick: function () { if (!locked) { prog = []; update(); } } }, 'Alle entfernen');
      el.replaceChildren(h('div', { class: 'bj-board' },
        h('section', { class: 'bj-s1', 'aria-label': 'Der nächste Gang' }, h('h3', null, 'Der nächste Gang'), gangEl),
        h('section', { class: 'bj-s2', 'aria-label': 'Anweisungen für Jones' },
          h('h3', null, 'Anweisungen für Jones'), listEl,
          h('div', { class: 'bj-adds' },
            h('div', { class: 'bj-wrow' }, h('code', null, 'wait('), stepBtn(-1, '−'), waitIn, stepBtn(1, '+'), h('code', null, ')'), addWait),
            h('div', { class: 'bj-grow' }, h('code', null, 'goto_block('), h('span', { class: 'bj-gb' }, btnBlocks), h('code', null, ')')),
            h('div', { class: 'bj-grow' }, btnTreasure)),
          h('div', { class: 'bj-tools' }, btnUndo, btnClear),
          statusEl, stripBtn),
        h('section', { class: 'bj-s3', 'aria-label': 'Ablauf' }, stripEl)));
      update(true);
    },
    isComplete: function () { return prog.length > 0; },
    evaluate: function () {
      var r = sim(TAKTS, prog);
      return { correct: isBest(r), answer: { program: prog.map(function (x) { return JSON.parse(JSON.stringify(x)); }) } };
    },
    setAnswer: function (ans) {
      setProg(ans && ans.program);
      mark = 'check';
      update(true);
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      update(true);
      el.classList.toggle('bj-locked', on);
    },
    reset: function () { reset(); update(true); },
    showSolution: function () {
      prog = BEST.prog.map(function (x) { return JSON.parse(JSON.stringify(x)); });
      mark = 'solution'; locked = true; showStrip = true;
      update(true);
      el.classList.add('bj-locked');
    }
  });
})();
