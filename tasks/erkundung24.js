/* Aufgabe Erkundung (Biber 2024, S. 25; Klasse 11-13 schwer): Tiefensuche in einem Graphen (Anleitung vervollständigen) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-erkundung24-';
  var NS = 'http://www.w3.org/2000/svg';

  /* Inselgruppe nach dem Bild im Heft (S. 25/26): Inseln A-G, Baumstämme als Kanten */
  var ISLE = {
    A: { x: 96, y: 190, rx: 52, ry: 24, rot: 8 },
    B: { x: 290, y: 116, rx: 50, ry: 30, rot: -6 },
    C: { x: 450, y: 108, rx: 66, ry: 28, rot: 4 },
    D: { x: 622, y: 84, rx: 44, ry: 26, rot: -4 },
    E: { x: 252, y: 296, rx: 62, ry: 36, rot: -8 },
    F: { x: 466, y: 232, rx: 54, ry: 30, rot: -6 },
    G: { x: 650, y: 222, rx: 56, ry: 28, rot: -18 }
  };
  var IDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  var LOGS = [['A', 'B'], ['B', 'C'], ['B', 'E'], ['C', 'D'], ['C', 'E'], ['C', 'F'], ['E', 'F'], ['D', 'G']];
  var START = 'C';
  function nbrs(i) {
    var r = [];
    LOGS.forEach(function (l) { if (l[0] === i) r.push(l[1]); else if (l[1] === i) r.push(l[0]); });
    return r;
  }
  /* Ausgangslage im Heft: Harry steht auf E; C hat das START-Schild, F einen Pfeil zu C, E einen Pfeil zu F */
  var START_SIGNS = { C: { type: 'start' }, F: { type: 'arrow', to: 'C' }, E: { type: 'arrow', to: 'F' } };

  /* Textbausteine */
  var BLOCKS = {
    kein: { gap: 1, text: 'kein Schild' },
    pfeil: { gap: 1, text: 'ein Pfeil' },
    start: { gap: 1, text: 'ein START-Schild' },
    zeigt: { gap: 2, text: 'auf die der Pfeil zeigt' },
    kommen: { gap: 2, text: 'von der du gerade gekommen bist' }
  };
  var ORDER1 = ['kein', 'pfeil', 'start'], ORDER2 = ['zeigt', 'kommen'];
  var RIGHT = { 1: 'kein', 2: 'zeigt' };

  /* ---------- Simulation der Anleitung (für den Probelauf nach dem Prüfen) ---------- */
  var PREFER = ['F', 'E', 'B', 'A', 'D', 'G', 'C'];   /* bei mehreren Möglichkeiten darf Harry frei wählen; wie im Heft-Beispiel */
  function copySigns(s) { var r = {}; Object.keys(s).forEach(function (k) { r[k] = s[k]; }); return r; }
  function holds(g1, sign) {
    if (g1 === 'kein') return !sign;
    if (g1 === 'pfeil') return !!sign && sign.type === 'arrow';
    return !!sign && sign.type === 'start';
  }
  function run(g1, g2) {
    var signs = {}, pos = START, prev = null, frames = [], seen = {}, visited = {}, end = null;
    signs[START] = { type: 'start' };
    visited[START] = true;
    frames.push({ pos: pos, signs: copySigns(signs), text: 'Harry beginnt auf Insel ' + START + ' und setzt dort das START-Schild.' });
    seen[pos + '|' + prev + '|' + JSON.stringify(signs)] = true;
    for (var n = 0; n < 60 && !end; n++) {
      var notes = [];
      if (!signs[pos]) {
        signs[pos] = { type: 'arrow', to: prev };
        notes.push('Hier steht noch kein Schild: Harry setzt einen Pfeil zurück zu ' + prev + '.');
      }
      var cands = nbrs(pos).filter(function (x) { return holds(g1, signs[x]); });
      cands.sort(function (a, b) { return PREFER.indexOf(a) - PREFER.indexOf(b); });
      var next = null, why = '';
      if (cands.length) { next = cands[0]; why = 'geht nach ' + next + ', denn dort steht ' + (g1 === 'kein' ? 'noch kein Schild.' : g1 === 'pfeil' ? 'ein Pfeil.' : 'ein START-Schild.'); }
      else if (signs[pos].type === 'arrow') {
        next = g2 === 'zeigt' ? signs[pos].to : prev;
        why = g2 === 'zeigt' ? 'folgt dem Pfeil nach ' + next + '.' : 'geht nach ' + next + ' zurück, woher er gerade gekommen ist.';
      }
      if (next == null) {
        end = 'stop';
        frames.push({ pos: pos, signs: copySigns(signs), text: notes.join(' ') + (notes.length ? ' ' : '') + 'Harry bleibt stehen.', last: true });
        break;
      }
      frames.push({ pos: pos, signs: copySigns(signs), text: (notes.length ? notes.join(' ') + ' ' : '') + 'Harry ' + why, mid: true, move: [pos, next] });
      prev = pos; pos = next; visited[pos] = true;
      var k = pos + '|' + prev + '|' + JSON.stringify(signs);
      if (seen[k]) {
        end = 'loop';
        frames.push({ pos: pos, signs: copySigns(signs), text: 'Jetzt ist alles wie schon einmal: Harry läuft für immer im Kreis.', last: true });
        break;
      }
      seen[k] = true;
    }
    if (!end) end = 'loop';
    return { frames: frames, end: end, visited: Object.keys(visited).length };
  }

  /* ---------- Zeichnung ---------- */
  function s(tag, attrs, kids) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    [].concat(kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function harry(x, y, cls) {
    return s('g', { class: P + 'harry ' + (cls || ''), transform: 'translate(' + x + ' ' + y + ')', 'aria-hidden': 'true' }, [
      s('ellipse', { cx: 0, cy: 12, rx: 11, ry: 14, fill: '#8a5a2b', stroke: '#3a2412', 'stroke-width': 2 }),
      s('ellipse', { cx: 0, cy: 14, rx: 6.5, ry: 9, fill: '#d9a46a' }),
      s('path', { d: 'M9 20 Q24 22 22 32 Q12 34 7 26Z', fill: '#4a2f17', stroke: '#2a180b', 'stroke-width': 1.5 }),
      s('circle', { cx: -8, cy: -9, r: 4, fill: '#8a5a2b', stroke: '#3a2412', 'stroke-width': 1.6 }),
      s('circle', { cx: 8, cy: -9, r: 4, fill: '#8a5a2b', stroke: '#3a2412', 'stroke-width': 1.6 }),
      s('circle', { cx: 0, cy: -2, r: 11, fill: '#9a6a36', stroke: '#3a2412', 'stroke-width': 2 }),
      s('circle', { cx: -4, cy: -4, r: 2.4, fill: '#fff' }), s('circle', { cx: 4, cy: -4, r: 2.4, fill: '#fff' }),
      s('circle', { cx: -4, cy: -4, r: 1.1, fill: '#222' }), s('circle', { cx: 4, cy: -4, r: 1.1, fill: '#222' }),
      s('ellipse', { cx: 0, cy: 2, rx: 3.2, ry: 2.2, fill: '#2a180b' }),
      s('rect', { x: -3.2, y: 3.5, width: 6.4, height: 5, rx: 1, fill: '#fff', stroke: '#3a2412', 'stroke-width': 1 })
    ]);
  }
  function sign(i, sg) {
    var I = ISLE[i], x = I.x + I.rx * 0.45, y = I.y - 2;
    if (sg.type === 'start') {
      var gs = s('g', { class: P + 'sign', transform: 'translate(' + (I.x + 6) + ' ' + (I.y - 4) + ')' }, [
        s('line', { x1: 0, y1: 0, x2: 0, y2: -26, stroke: '#5a3a1a', 'stroke-width': 3, 'stroke-linecap': 'round' }),
        s('rect', { x: -27, y: -42, width: 54, height: 18, rx: 3, fill: '#fff', stroke: '#222', 'stroke-width': 1.5 }),
        s('text', { x: 0, y: -29, 'text-anchor': 'middle', class: P + 'starttxt' }, 'START')
      ]);
      return gs;
    }
    var T = ISLE[sg.to];
    var ang = Math.atan2(T.y - y, T.x - x) * 180 / Math.PI;
    return s('g', { class: P + 'sign', transform: 'translate(' + x + ' ' + y + ')' }, [
      s('line', { x1: 0, y1: 0, x2: 0, y2: -18, stroke: '#5a3a1a', 'stroke-width': 3, 'stroke-linecap': 'round' }),
      s('g', { transform: 'translate(0 -22) rotate(' + ang + ')' },
        s('path', { class: P + 'arrow', d: 'M-14 -5 L4 -5 L4 -11 L18 0 L4 11 L4 5 L-14 5 Z' }))
    ]);
  }
  function mapSvg(o) {
    var svg = s('svg', { class: P + 'map', viewBox: '0 0 760 360', role: 'img', 'aria-label': o.label });
    svg.appendChild(s('path', { class: P + 'water', d: 'M20 150 Q10 100 90 100 Q160 60 260 40 Q380 10 520 30 Q640 10 720 40 Q770 90 750 160 Q770 250 700 300 Q560 350 380 345 Q200 350 120 310 Q40 260 20 150Z' }));
    LOGS.forEach(function (l) {
      var a = ISLE[l[0]], b = ISLE[l[1]];
      svg.appendChild(s('line', { class: P + 'log', x1: a.x, y1: a.y, x2: b.x, y2: b.y }));
    });
    IDS.forEach(function (i) {
      var I = ISLE[i];
      svg.appendChild(s('g', { transform: 'translate(' + I.x + ' ' + I.y + ') rotate(' + I.rot + ')' }, [
        s('ellipse', { class: P + 'sand', rx: I.rx + 8, ry: I.ry + 7 }),
        s('ellipse', { class: P + 'land', rx: I.rx, ry: I.ry }),
        s('ellipse', { class: P + 'land2', cx: -I.rx * 0.25, cy: -I.ry * 0.2, rx: I.rx * 0.5, ry: I.ry * 0.5 })
      ]));
    });
    IDS.forEach(function (i) {
      var sg = o.signs[i];
      if (sg) svg.appendChild(sign(i, sg));
    });
    if (o.harry) {
      var Hh = ISLE[o.harry];
      svg.appendChild(harry(Hh.x - Hh.rx * 0.38, Hh.y - 12));
    }
    if (o.letters) IDS.forEach(function (i) {
      var I = ISLE[i];
      svg.appendChild(s('text', { class: P + 'lbl', x: I.x - I.rx * 0.2, y: I.y + I.ry * 0.55, 'text-anchor': 'middle' }, i));
    });
    return svg;
  }

  function startLabel() {
    return 'Karte mit sieben durch Baumstämme verbundenen Inseln A bis G. Harry steht auf Insel E, die Insel C hat das START-Schild, Insel F und Insel E haben einen Pfeil: der Pfeil auf F zeigt zu C, der Pfeil auf E zeigt zu F.';
  }

  /* ---------- Zustand ---------- */
  var el, api, locked, mark;
  var gaps, selected, dragging, runStep, runRes, probeEl, boardEl;

  function reset() { gaps = { 1: null, 2: null }; selected = null; dragging = null; mark = null; runRes = null; }
  function inGap(id) { return gaps[1] === id ? 1 : gaps[2] === id ? 2 : 0; }

  function place(id, g) {
    if (locked || BLOCKS[id].gap !== g) return;
    gaps[g] = id;
    selected = null;
    renderBoard();
    api.changed();
  }
  function release(g) {
    if (locked || !gaps[g]) return;
    gaps[g] = null;
    selected = null;
    renderBoard();
    api.changed();
  }

  function gapBtn(g) {
    var id = gaps[g], b = id ? BLOCKS[id] : null;
    var cls = P + 'gap ' + P + 'g' + g + (id ? ' filled' : '');
    var badge = null;
    if (mark === 'check' && id) {
      var ok = id === RIGHT[g];
      cls += ok ? ' right' : ' wrong';
      badge = h('span', { class: P + 'badge', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
    } else if (mark === 'solution') cls += ' right';
    var targetable = selected && BLOCKS[selected].gap === g;
    if (targetable) cls += ' target';
    return h('button', {
      type: 'button', class: cls, 'data-gap': String(g), disabled: locked,
      draggable: id && !locked ? 'true' : false, 'data-in-gap': id || false,
      'aria-label': 'Lücke ' + g + ' (' + (g === 1 ? 'gelb' : 'grün') + '): ' + (b ? b.text + ' (antippen zum Entfernen)' : 'leer')
    }, b ? b.text : h('span', { class: P + 'ph' }, '…'), badge);
  }
  function blockBtn(id) {
    var b = BLOCKS[id];
    if (inGap(id)) return h('div', { class: P + 'cell', 'aria-hidden': 'true' }, b.text);
    return h('button', {
      type: 'button', class: P + 'block ' + P + 'b' + b.gap + (selected === id ? ' selected' : ''), 'data-block': id,
      draggable: locked ? false : 'true', disabled: locked, 'aria-pressed': String(selected === id),
      'aria-label': 'Textbaustein ' + (b.gap === 1 ? 'gelb' : 'grün') + ': ' + b.text
    }, b.text);
  }

  function code() {
    return h('div', { class: P + 'code' },
      h('div', { class: P + 'l0' }, 'Betritt eine beliebige Insel, setze dort das START-Schild und erkunde diese Insel.'),
      h('div', { class: P + 'l0' }, h('b', null, 'Jedes Mal'), ', wenn du eine Insel erkundest, tue Folgendes:',
        h('div', { class: P + 'l1' }, h('b', null, 'Wenn'), ' auf der aktuellen Insel kein Schild steht, ', h('b', null, 'dann:'), h('div', { class: P + 'ind' }, 'Setze einen Pfeil; der Pfeil zeigt zu der Insel, von der aus du die aktuelle Insel betreten hast.')),
        h('div', { class: P + 'l1' }, h('b', null, 'Wenn'), ' es eine Nachbarinsel gibt, auf der ', gapBtn(1), ' steht, ', h('b', null, 'dann:'),
          h('div', { class: P + 'ind' }, 'Betritt diese Insel und erkunde sie.'),
          h('div', { class: P + 'sonst' }, h('b', null, 'Sonst:')),
          h('div', { class: P + 'l2' }, h('b', null, 'Wenn'), ' auf der aktuellen Insel ein Pfeil steht, ', h('b', null, 'dann:'),
            h('div', { class: P + 'ind' }, 'Betritt diejenige Insel, ', gapBtn(2), ', und erkunde sie.'),
            h('div', { class: P + 'sonst' }, h('b', null, 'Sonst:')),
            h('div', { class: P + 'ind' }, 'Bleibe stehen. Du hast jede Insel wenigstens einmal betreten.')))));
  }

  function renderBoard() {
    boardEl.replaceChildren(
      h('div', { class: P + 'mapwrap' }, mapSvg({ harry: 'E', signs: START_SIGNS, letters: true, label: startLabel() }),
        h('p', { class: P + 'cap' }, 'So weit ist Harry schon: Er ist auf Insel E angekommen.')),
      h('div', { class: P + 'work' },
        h('div', { class: P + 'prog' }, code()),
        h('div', { class: P + 'bank', 'data-bank': '' },
          h('h3', null, 'Textbausteine'),
          h('div', { class: P + 'bgroup ' + P + 'bg1' }, ORDER1.map(blockBtn)),
          h('div', { class: P + 'bgroup ' + P + 'bg2' }, ORDER2.map(blockBtn)))));
    if (selected) {
      /* Tastatur/Fokus: gewählten Baustein behalten */
      var again = boardEl.querySelector('[data-block="' + selected + '"]');
      if (again && document.activeElement === document.body) again.focus();
    }
  }

  /* ---------- Probelauf nach dem Prüfen ---------- */
  function renderProbe() {
    probeEl.replaceChildren();
    if (!locked || !gaps[1] || !gaps[2]) return;
    runRes = run(gaps[1], gaps[2]);
    var n = runRes.frames.length;
    if (runStep == null || runStep > n - 1) runStep = n - 1;
    var f = runRes.frames[runStep];
    var summary = runRes.end === 'stop' && runRes.visited === IDS.length ? 'Mit deiner Anleitung besucht Harry alle 7 Inseln und hört dann auf.'
      : runRes.end === 'loop' ? 'Mit deiner Anleitung läuft Harry für immer im Kreis und besucht nur ' + runRes.visited + ' von 7 Inseln.'
        : 'Mit deiner Anleitung bleibt Harry stehen und besucht nur ' + runRes.visited + ' von 7 Inseln.';
    var ok = gaps[1] === RIGHT[1] && gaps[2] === RIGHT[2];
    var moveNote = ' (Schritt ' + (runStep + 1) + ' von ' + n + ')';
    probeEl.appendChild(h('section', { class: P + 'probe', 'aria-label': 'Probelauf' },
      h('h3', null, ok ? 'So geht Harry vor (Probelauf)' : 'Probelauf mit deiner Anleitung'),
      h('p', { class: P + 'sum ' + (ok ? 'ok' : 'bad') }, summary),
      mapSvg({ harry: f.pos, signs: f.signs, letters: true, label: 'Probelauf, Schritt ' + (runStep + 1) + ' von ' + n + '. Harry steht auf Insel ' + f.pos + '. ' + f.text }),
      h('p', { class: P + 'ftext', 'aria-live': 'polite' }, f.text + moveNote),
      h('div', { class: P + 'ctl' },
        h('button', { type: 'button', class: 'btn ghost', disabled: runStep <= 0, onclick: function () { runStep--; renderProbe(); } }, '◀ Zurück'),
        h('button', { type: 'button', class: 'btn ghost', disabled: runStep >= n - 1, onclick: function () { runStep++; renderProbe(); } }, 'Weiter ▶'),
        h('button', { type: 'button', class: 'btn ghost', disabled: runStep === 0, onclick: function () { runStep = 0; renderProbe(); } }, 'Von vorn'))));
  }

  function renderAll() { renderBoard(); renderProbe(); }

  /* ---------- Ereignisse ---------- */
  function onClick(e) {
    if (locked) return;
    var t = e.target.closest('[data-block],[data-gap]');
    if (!t) return;
    if (t.dataset.block) {
      selected = selected === t.dataset.block ? null : t.dataset.block;
      renderBoard();
      return;
    }
    var g = +t.dataset.gap;
    if (selected) {
      if (BLOCKS[selected].gap === g) place(selected, g);
      return;
    }
    release(g);
  }
  function onDragStart(e) {
    var t = e.target.closest('[data-block],[data-in-gap]');
    if (!t || locked) return;
    dragging = t.dataset.block || t.dataset.inGap;
    e.dataTransfer.setData('text/plain', dragging);
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e) {
    if (!dragging) return;
    var g = e.target.closest('[data-gap]');
    if (g && BLOCKS[dragging].gap === +g.dataset.gap) { e.preventDefault(); g.classList.add('over'); }
    else if (e.target.closest('[data-bank]')) e.preventDefault();
  }
  function onDragLeave(e) { var g = e.target.closest('[data-gap]'); if (g) g.classList.remove('over'); }
  function onDrop(e) {
    if (!dragging) return;
    var id = dragging, g = e.target.closest('[data-gap]');
    dragging = null;
    if (g) { if (BLOCKS[id].gap === +g.dataset.gap) { e.preventDefault(); place(id, +g.dataset.gap); } }
    else if (e.target.closest('[data-bank]')) { e.preventDefault(); var from = inGap(id); if (from) release(from); }
  }
  function onDragEnd() { dragging = null; if (!locked) renderBoard(); }

  Biber.register({
    id: 'erkundung24',
    story:
      '<p>Harry erkundet eine Gruppe von Inseln, die durch Baumstämme verbunden sind. Er hat verschiedene Schilder dabei: ein <b>START-Schild</b> und <b>Pfeile</b>. ' +
      'Wenn Harry sich auf einer Insel befindet, kann er alle damit verbundenen Inseln sehen und feststellen, ob auf ihnen ein Schild steht.</p>' +
      '<p>Auf dem Bild hat Harry bereits drei Inseln betreten. Er bewegt sich nach der folgenden Anleitung. Darin ist die „aktuelle Insel“ die Insel, auf der sich Harry gerade befindet, und eine „Nachbarinsel“ ist mit der aktuellen Insel über einen Baumstamm verbunden. ' +
      'Die Anleitung funktioniert, wenn Harry mit ihrer Hilfe jede Insel wenigstens einmal betritt. Leider hat die Anleitung noch Lücken.</p>',
    question: 'Fülle die Lücken mit passenden Textbausteinen, so dass die Anleitung funktioniert.',
    howto: 'Tippe einen Textbaustein an und dann die Lücke, in die er gehört (gelbe Bausteine in die gelbe Lücke, grüne in die grüne). Du kannst Bausteine auch ziehen. Tippe auf eine gefüllte Lücke, um den Baustein zurückzulegen.',
    explanation: function () {
      return '<p><b>Gelbe Lücke:</b> Harry stellt immer dann ein Schild auf, wenn er eine Insel ohne Schild betritt. Auf allen betretenen Inseln steht also ein Schild, auf allen unbetretenen keins. ' +
        'Damit Harry überhaupt alle Inseln betritt, muss er von einer Insel aus zu einer Nachbarinsel gehen, auf der <b>kein Schild</b> steht. ' +
        '„Ein Pfeil“ oder „ein START-Schild“ gehen nicht: Auf der ersten Insel gibt es nur das START-Schild und noch keinen Pfeil, Harry käme nie von der Stelle.</p>' +
        '<p><b>Grüne Lücke:</b> Hat die aktuelle Insel keine Nachbarinsel ohne Schild, muss Harry zurück. Auf dem Hinweg hat er mit den Pfeilen eine Spur gelegt, die bis zur ersten Insel zurückführt. Er folgt ihr mit <b>„auf die der Pfeil zeigt“</b>, bis er auf eine Insel mit einer unbetretenen Nachbarinsel kommt, oder am Start ankommt. ' +
        'Ginge er stattdessen zur Insel, „von der er gerade gekommen ist“, würde er für immer zwischen zwei Inseln hin- und herlaufen (zum Beispiel zwischen A und B).</p>' +
        '<p>Diese Strategie heißt <i>Tiefensuche</i>: Man geht immer weiter, bis es nicht mehr geht, und kehrt dann Schritt für Schritt zurück. So besucht man garantiert jeden Knoten eines Graphen und lässt keinen aus. ' +
        'Ein Graph besteht aus Knoten (hier Inseln) und Kanten (hier Baumstämme) und kann viele Systeme beschreiben, etwa Freundschaften, Bahnnetze oder die Stellungen eines Schachspiels.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset(); runStep = null;
      boardEl = h('div', { class: P + 'board' });
      probeEl = h('div', { class: P + 'probewrap' });
      el.replaceChildren(boardEl, probeEl);
      el.addEventListener('click', onClick);
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('dragleave', onDragLeave);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', onDragEnd);
      renderAll();
    },
    isComplete: function () { return !!gaps[1] && !!gaps[2]; },
    evaluate: function () { return { correct: gaps[1] === RIGHT[1] && gaps[2] === RIGHT[2], answer: { g1: gaps[1], g2: gaps[2] } }; },
    setAnswer: function (ans) {
      ans = ans || {};
      gaps = { 1: BLOCKS[ans.g1] && BLOCKS[ans.g1].gap === 1 ? ans.g1 : null, 2: BLOCKS[ans.g2] && BLOCKS[ans.g2].gap === 2 ? ans.g2 : null };
      selected = null; mark = 'check'; runStep = null;
      renderBoard();
    },
    lock: function (on) {
      locked = on; selected = null; runStep = null;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      renderAll();
    },
    reset: function () { reset(); runStep = null; renderAll(); },
    showSolution: function () {
      gaps = { 1: RIGHT[1], 2: RIGHT[2] }; selected = null; locked = true; mark = 'solution'; runStep = null;
      renderAll();
    }
  });
})();
