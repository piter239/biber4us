/* Aufgabe Biber-Arbeit (Biber 2021; Klasse 11-13 schwer): Scheduling mit Abhängigkeiten auf zwei Bibern, kürzester Arbeitsplan */
(function () {
  'use strict';
  var h = Biber.h;
  function S(tag, attrs, kids) {   /* SVG-Element; kids: Array, Element oder Text */
    var e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.keys(attrs || {}).forEach(function (k) { if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]); });
    (Array.isArray(kids) ? kids : [kids]).forEach(function (c) { if (c !== null && c !== undefined && c !== false) e.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c))); });
    return e;
  }
  var P = 't-biberarbeit21-';

  var IDS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  var DUR = { A: 2, B: 3, C: 5, D: 7, E: 10, F: 9, G: 4, H: 6 };
  var PRE = { A: [], B: [], C: [], D: [], E: ['A', 'B'], F: ['C'], G: ['D'], H: ['E'] };
  var SUCC = {};
  IDS.forEach(function (t) { SUCC[t] = []; });
  IDS.forEach(function (t) { PRE[t].forEach(function (p) { SUCC[p].push(t); }); });
  var OPT = 23;   /* Summe der Stunden 46, geteilt durch 2 Biber; im Heft bestätigt und per Skript (alle Zuordnungen und Reihenfolgen) als Minimum bestätigt */
  var SOLUTION = [['A', 'C', 'E', 'H'], ['B', 'D', 'F', 'G']];
  var COLS = { A: 'var(--c4)', B: 'var(--c6)', C: 'color-mix(in srgb, var(--c4) 55%, var(--c3))', D: 'var(--c3)', E: 'color-mix(in srgb, var(--c6) 55%, var(--c2))', F: 'var(--c2)', G: 'color-mix(in srgb, var(--c3) 55%, var(--c6))', H: 'var(--c5)' };

  /* Plan berechnen: jede Aufgabe beginnt, sobald der Biber frei ist und alle Vorgänger fertig sind. null = Blockade (Kreis) */
  function schedule(lanes) {
    var idx = [0, 0], free = [0, 0], start = {}, end = {}, prog = true, i, t, s, ok;
    var total = lanes[0].length + lanes[1].length;
    while (prog) {
      prog = false;
      for (i = 0; i < 2; i++) {
        while (idx[i] < lanes[i].length) {
          t = lanes[i][idx[i]];
          ok = PRE[t].every(function (p) { return p in end; });
          if (!ok) break;
          s = free[i];
          PRE[t].forEach(function (p) { if (end[p] > s) s = end[p]; });
          start[t] = s; end[t] = s + DUR[t]; free[i] = end[t]; idx[i]++; prog = true;
        }
      }
    }
    if (Object.keys(end).length < total) return null;
    var mk = 0;
    Object.keys(end).forEach(function (k) { if (end[k] > mk) mk = end[k]; });
    return { start: start, end: end, makespan: mk };
  }
  (function selfTest() {
    var r = schedule(SOLUTION);
    if (!r || r.makespan !== OPT) throw new Error('biberarbeit21: Lösung stimmt nicht');
  })();

  /* ---------- Zustand ---------- */
  var el, api, locked, mark, lanes, selected, msg, justDragged;
  var dropEls, backBtn, poolEl, laneEls, trackEls, axisEls, infoEl, noteEl, chipEls, drag, ghostEl, markerEls;

  function placed(t) { return lanes[0].indexOf(t) >= 0 || lanes[1].indexOf(t) >= 0; }
  function allPlaced() { return lanes[0].length + lanes[1].length === IDS.length; }
  function blockedBy(t) { return PRE[t].filter(function (p) { return !placed(p); }); }
  function cascade(t) {   /* t und alle bereits eingeplanten Nachfolger */
    var out = [], q = [t];
    while (q.length) { var x = q.shift(); if (out.indexOf(x) < 0) { out.push(x); SUCC[x].forEach(function (y) { if (placed(y)) q.push(y); }); } }
    return out;
  }
  function say(t) { msg = t; if (noteEl) noteEl.textContent = t; }
  function names(list) { return list.length === 2 ? list[0] + ' und ' + list[1] : list.join(', '); }

  function removeFromLanes(l, ids) { return l.map(function (arr) { return arr.filter(function (x) { return ids.indexOf(x) < 0; }); }); }

  function giveBack(t) {
    var gone = cascade(t);
    lanes = removeFromLanes(lanes, gone);
    selected = null;
    say(gone.length > 1 ? t + ' ist zurück im Vorrat. ' + names(gone.slice(1)) + (gone.length > 2 ? ' sind' : ' ist') + ' mit zurückgegangen, weil ' + (gone.length > 2 ? 'sie' : 'es') + ' auf ' + t + ' warten ' + (gone.length > 2 ? 'müssen.' : 'muss.') : t + ' ist zurück im Vorrat.');
    render(); api.changed();
  }
  function moveTo(t, li, idx) {
    var wasPlaced = placed(t);
    if (!wasPlaced) {
      var b = blockedBy(t);
      if (b.length) { say(t + ' kann erst begonnen werden, wenn ' + names(b) + ' im Plan ' + (b.length > 1 ? 'stehen.' : 'steht.')); selected = null; render(); return false; }
    }
    var base = removeFromLanes(lanes, [t]);
    var arr = base[li].slice();
    idx = Math.max(0, Math.min(idx, arr.length));
    arr.splice(idx, 0, t);
    var next = [base[0], base[1]];
    next[li] = arr;
    if (!schedule(next)) {
      say('So geht das nicht: ' + t + ' würde auf eine Aufgabe warten, die selbst erst nach ' + t + ' drankommt.');
      selected = null; render(); return false;
    }
    lanes = next; selected = null;
    var sc = schedule(lanes);
    say(t + ' steht bei Biber ' + (li + 1) + ' (Stunde ' + sc.start[t] + ' bis ' + sc.end[t] + ').');
    render(); api.changed();
    return true;
  }

  /* ---------- Zeichnen ---------- */
  function chipLabel(t) { return 'Aufgabe ' + t + ', ' + DUR[t] + ' Stunden'; }
  function makeChip(t, where) {
    var b = blockedBy(t);
    var btn = h('button', {
      type: 'button', class: P + 'chip ' + P + 'in-' + where + (selected === t ? ' sel' : '') + (where === 'pool' && b.length ? ' blocked' : ''),
      'data-task': t, style: '--k:' + COLS[t],
      'aria-pressed': String(selected === t),
      'aria-disabled': where === 'pool' && b.length ? 'true' : 'false',
      'aria-label': chipLabel(t) + (where === 'pool' ? (b.length ? ', kann erst nach ' + names(b) + ' begonnen werden' : ', im Vorrat') : ', im Plan'),
      title: chipLabel(t)
    }, h('span', { class: P + 'l' }, t), h('span', { class: P + 'd' }, DUR[t] + ' h'));
    btn.addEventListener('pointerdown', function (e) { onDown(e, t, btn); });
    btn.addEventListener('click', function (e) { onChipClick(e, t); });
    btn.addEventListener('keydown', function (e) {
      if ((e.key === 'Delete' || e.key === 'Backspace') && placed(t) && !locked) { e.preventDefault(); giveBack(t); }
    });
    return btn;
  }

  function render() {
    var sc = schedule(lanes) || { start: {}, end: {}, makespan: 0 };
    var T = Math.max(24, sc.makespan);
    poolEl.replaceChildren.apply(poolEl, IDS.filter(function (t) { return !placed(t); }).map(function (t) { return makeChip(t, 'pool'); }));
    if (!poolEl.firstChild) poolEl.appendChild(h('span', { class: P + 'empty' }, 'Alle Aufgaben sind im Plan.'));
    poolEl.classList.toggle('target', !!selected && placed(selected));
    var focusT = el.contains(document.activeElement) && document.activeElement.getAttribute ? document.activeElement.getAttribute('data-task') : null;
    [0, 1].forEach(function (li) {
      var tr = trackEls[li], kids = [], prevEnd = 0;
      lanes[li].forEach(function (t) {
        var s = sc.start[t], e = sc.end[t];
        if (s > prevEnd) kids.push(h('div', { class: P + 'wait', style: 'left:' + (prevEnd / T * 100) + '%;width:' + ((s - prevEnd) / T * 100) + '%', 'aria-hidden': 'true', title: 'Wartezeit: ' + (s - prevEnd) + ' Stunden' }));
        var c = makeChip(t, 'lane');
        c.style.left = (s / T * 100) + '%';
        c.style.width = (DUR[t] / T * 100) + '%';
        if (DUR[t] / T >= 0.15) c.classList.add('wide');
        c.title = chipLabel(t) + ', Stunde ' + s + ' bis ' + e;
        c.setAttribute('aria-label', chipLabel(t) + ', bei Biber ' + (li + 1) + ', Stunde ' + s + ' bis ' + e);
        kids.push(c);
        prevEnd = e;
      });
      tr.replaceChildren.apply(tr, kids);
      tr.setAttribute('aria-label', 'Plan von Biber ' + (li + 1) + ': ' + (lanes[li].length ? lanes[li].join(', ') : 'leer'));
      laneEls[li].classList.toggle('target', !!selected && !locked);
      var ax = axisEls[li], ticks = [];
      for (var t = 0; t <= T; t += 5) ticks.push(h('span', { class: P + 'tick', style: 'left:' + (t / T * 100) + '%' }, String(t)));
      ax.replaceChildren.apply(ax, ticks);
    });
    dropEls.forEach(function (d) { d.hidden = !selected || !!locked; });
    backBtn.hidden = !selected || !!locked || !placed(selected);
    markerEls.forEach(function (m) { m.remove(); });
    markerEls = [];
    if (allPlaced() && sc.makespan) {
      var ml = h('div', { class: P + 'endline', style: 'left:' + (sc.makespan / T * 100) + '%', 'aria-hidden': 'true' });
      trackEls.forEach(function (tr) { var c = ml.cloneNode(); tr.appendChild(c); markerEls.push(c); });
    }
    var info;
    if (allPlaced()) info = 'Der Damm ist nach ' + sc.makespan + ' Stunden fertig.';
    else info = 'Noch ' + (IDS.length - lanes[0].length - lanes[1].length) + ' Aufgabe' + (IDS.length - lanes[0].length - lanes[1].length === 1 ? '' : 'n') + ' im Vorrat.';
    infoEl.textContent = info;
    el.classList.toggle(P + 'locked', !!locked);
    el.classList.toggle(P + 'ok', mark === 'ok' || mark === 'solution');
    el.classList.toggle(P + 'bad', mark === 'bad');
    if (focusT) { var f = el.querySelector('[data-task="' + focusT + '"]'); if (f) f.focus(); }
  }

  /* ---------- Einfügen: Position aus Zeigerposition ---------- */
  function insertIndex(li, clientX, ex) {
    var items = [].slice.call(trackEls[li].querySelectorAll('.' + P + 'chip')).filter(function (c) { return c.getAttribute('data-task') !== ex; });
    var idx = 0;
    items.forEach(function (c) { var r = c.getBoundingClientRect(); if (clientX > r.left + r.width / 2) idx++; });
    return idx;
  }
  function laneAt(x, y) {
    for (var i = 0; i < 2; i++) {
      var r = laneEls[i].getBoundingClientRect();
      if (x >= r.left - 6 && x <= r.right + 6 && y >= r.top - 6 && y <= r.bottom + 6) return i;
    }
    return -1;
  }
  function overPool(x, y) {
    var r = poolEl.parentNode.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  /* ---------- Antippen ---------- */
  function onChipClick(e, t) {
    e.stopPropagation();
    if (justDragged || locked) return;
    var inPlan = placed(t);
    if (selected && selected !== t && inPlan) {
      var li = lanes[0].indexOf(t) >= 0 ? 0 : 1;
      var r = e.currentTarget.getBoundingClientRect();
      var base = lanes[li].filter(function (x) { return x !== selected; });
      var at = base.indexOf(t) + (e.clientX > r.left + r.width / 2 ? 1 : 0);
      moveTo(selected, li, at);
      return;
    }
    if (selected === t) { selected = null; say(''); render(); return; }
    if (!inPlan && blockedBy(t).length) { selected = null; say(t + ' kann erst begonnen werden, wenn ' + names(blockedBy(t)) + ' im Plan ' + (blockedBy(t).length > 1 ? 'stehen.' : 'steht.')); render(); return; }
    selected = t;
    say(t + ' ist ausgewählt. Tippe auf den Plan von Biber 1 oder Biber 2' + (inPlan ? ' oder auf den Vorrat (zurücklegen).' : '.'));
    render();
  }
  function onLaneClick(li, e) {
    if (justDragged || locked || !selected) return;
    moveTo(selected, li, insertIndex(li, e.clientX, selected));
  }
  function onPoolClick() {
    if (justDragged || locked || !selected || !placed(selected)) return;
    giveBack(selected);
  }

  /* ---------- Ziehen ---------- */
  function onDown(e, t, btn) {
    if (locked || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if (!placed(t) && blockedBy(t).length) return;
    drag = { t: t, x: e.clientX, y: e.clientY, id: e.pointerId, on: false, btn: btn };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onCancel);
  }
  function onMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.on) {
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 8) return;
      drag.on = true;
      ghostEl = h('div', { class: P + 'ghost', style: '--k:' + COLS[drag.t], 'aria-hidden': 'true' }, drag.t);
      el.appendChild(ghostEl);
      drag.btn.classList.add('dragging');
    }
    e.preventDefault();
    ghostEl.style.left = e.clientX + 'px';
    ghostEl.style.top = e.clientY + 'px';
    var li = laneAt(e.clientX, e.clientY);
    laneEls.forEach(function (l, i) { l.classList.toggle('over', i === li); });
    poolEl.parentNode.classList.toggle('over', li < 0 && overPool(e.clientX, e.clientY) && placed(drag.t));
  }
  function endDrag() {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onCancel);
    if (ghostEl) { ghostEl.remove(); ghostEl = null; }
    laneEls.forEach(function (l) { l.classList.remove('over'); });
    poolEl.parentNode.classList.remove('over');
  }
  function onUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag; drag = null;
    var wasOn = d.on;
    endDrag();
    if (!wasOn) return;
    justDragged = true; setTimeout(function () { justDragged = false; }, 60);
    var li = laneAt(e.clientX, e.clientY);
    if (li >= 0) moveTo(d.t, li, insertIndex(li, e.clientX, d.t));
    else if (overPool(e.clientX, e.clientY) && placed(d.t)) giveBack(d.t);
    else { selected = null; render(); }
  }
  function onCancel() {
    if (!drag) return;
    drag = null; endDrag(); render();
  }

  /* ---------- Abhängigkeitsbild ---------- */
  function graph() {
    var N = { Start: [34, 78, 28], A: [128, 22, 21], B: [128, 62, 21], C: [128, 102, 21], D: [128, 142, 21], E: [252, 42, 27], F: [252, 102, 27], G: [252, 142, 27], H: [372, 42, 27], Fertig: [438, 100, 29] };
    var E = [['Start', 'A'], ['Start', 'B'], ['Start', 'C'], ['Start', 'D'], ['A', 'E'], ['B', 'E'], ['E', 'H'], ['C', 'F'], ['D', 'G'], ['H', 'Fertig'], ['F', 'Fertig'], ['G', 'Fertig']];
    var svg = S('svg', { class: P + 'graph', viewBox: '0 0 480 166', role: 'img', 'aria-label': 'Abhängigkeiten: Start vor A, B, C und D. A und B vor E. E vor H. C vor F. D vor G. H, F und G vor Fertig. Dauer in Stunden: A 2, B 3, C 5, D 7, E 10, F 9, G 4, H 6.' });
    svg.appendChild(S('defs', {}, [S('marker', { id: P + 'ah', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, [S('path', { d: 'M0 1L10 5L0 9Z', class: P + 'ahp' })])]));
    E.forEach(function (e) {
      var a = N[e[0]], b = N[e[1]];
      var dx = b[0] - a[0], dy = b[1] - a[1], L = Math.sqrt(dx * dx + dy * dy), ux = dx / L, uy = dy / L;
      var x1 = a[0] + ux * a[2], y1 = a[1] + uy * (a[2] * 0.62), x2 = b[0] - ux * (b[2] + 4), y2 = b[1] - uy * (b[2] * 0.62 + 4);
      svg.appendChild(S('line', { class: P + 'edge', x1: x1.toFixed(1), y1: y1.toFixed(1), x2: x2.toFixed(1), y2: y2.toFixed(1), 'marker-end': 'url(#' + P + 'ah)' }));
    });
    Object.keys(N).forEach(function (k) {
      var n = N[k], task = DUR[k] !== undefined;
      svg.appendChild(S('ellipse', { class: P + 'node' + (task ? '' : ' ' + P + 'term'), cx: n[0], cy: n[1], rx: n[2], ry: Math.min(18, n[2] * 0.7), style: task ? '--k:' + COLS[k] : null }));
      var t = S('text', { class: P + 'nt', x: n[0], y: n[1] + 5, 'text-anchor': 'middle' });
      if (task) { t.appendChild(S('tspan', { class: P + 'nl' }, k)); t.appendChild(S('tspan', {}, '(' + DUR[k] + ')')); } else t.textContent = k;
      svg.appendChild(t);
    });
    return svg;
  }

  function buildLane(li) {
    var track = h('div', { class: P + 'track', role: 'group' });
    var drop = h('button', { type: 'button', class: P + 'drop', hidden: true, onclick: function (e) { e.stopPropagation(); if (selected && !locked) moveTo(selected, li, lanes[li].filter(function (x) { return x !== selected; }).length); } }, 'Hier ablegen');
    dropEls[li] = drop;
    var lane = h('div', { class: P + 'lane', onclick: function (e) { onLaneClick(li, e); } },
      h('div', { class: P + 'lhead' }, h('span', { class: P + 'lname' }, 'Biber ' + (li + 1)), drop), track);
    var ax = h('div', { class: P + 'axis', 'aria-hidden': 'true' });
    trackEls[li] = track; laneEls[li] = lane; axisEls[li] = ax;
    return h('div', { class: P + 'lanewrap' }, lane, ax);
  }

  Biber.register({
    id: 'biberarbeit21',
    story:
      '<p>Zwei Biber bauen einen Damm. Dazu müssen sie acht Aufgaben erledigen: Bäume fällen, Äste entfernen, Stämme ins Wasser bringen usw. Für jede Aufgabe gibt es einen Buchstaben. In Klammern steht, wie viele Stunden es dauert, die Aufgabe zu erledigen. Ein Pfeil sagt, dass eine Aufgabe vor einer anderen erledigt werden muss. Zum Beispiel kann E erst begonnen werden, wenn A und B beide erledigt sind.</p>' +
      '<p>Die Biber können gleichzeitig arbeiten, aber an unterschiedlichen Aufgaben. Ein Arbeitsplan, bei dem der Damm in 32 Stunden fertig wird, ist zum Beispiel: Biber 1 macht D, G, B, A, H; Biber 2 macht C, F, E. Es geht aber schneller!</p>',
    question: 'Erstelle einen Arbeitsplan, mit dem der Damm so schnell wie möglich fertig wird!',
    howto: 'Ziehe die Aufgaben in den Plan von Biber 1 oder Biber 2 (oder tippe erst die Aufgabe an, dann den Plan). Graue Aufgaben können noch nicht begonnen werden. Zum Zurücklegen ziehe sie in den Vorrat oder tippe sie an und dann auf den Vorrat. Die Reihenfolge bei einem Biber bestimmst du durch die Stelle, an der du sie ablegst.',
    explanation: function () {
      return '<p>Zusammen haben alle Aufgaben 46 Stunden Arbeit. Verteilt auf zwei Biber, die ohne Pause arbeiten, wären das <strong>23 Stunden</strong>. Schneller geht es also nicht, und genau das ist mit dem richtigen Plan möglich.</p>' +
        '<p>Der Trick: Die beiden größten Aufgaben E (10) und F (9) dürfen nicht beim selben Biber liegen. Zum Beispiel macht Biber 1 A, C, E, H und Biber 2 B, D, F, G. Dann muss niemand auf den anderen warten.</p>' +
        '<p>Informatik: Das ist ein Scheduling-Problem. Aufgaben mit Abhängigkeiten werden auf mehrere Prozessoren verteilt, und man sucht die kürzeste Gesamtzeit. Wartezeiten (die dunklen Lücken) entstehen, wenn eine Aufgabe auf eine andere warten muss.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; mark = null; lanes = [[], []]; selected = null; msg = ''; justDragged = false; drag = null;
      trackEls = []; laneEls = []; axisEls = []; markerEls = []; dropEls = [];
      poolEl = h('div', { class: P + 'pool', role: 'group', 'aria-label': 'Vorrat der Aufgaben' });
      infoEl = h('p', { class: P + 'info', role: 'status' });
      noteEl = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      backBtn = h('button', { type: 'button', class: P + 'drop', hidden: true, onclick: function (e) { e.stopPropagation(); if (selected && placed(selected) && !locked) giveBack(selected); } }, 'Zurück in den Vorrat legen');
      var poolWrap = h('div', { class: P + 'poolwrap', onclick: onPoolClick }, poolEl, backBtn);
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { class: P + 'deps', 'aria-label': 'Abhängigkeiten' }, h('h3', null, 'Die Aufgaben'), graph()),
        h('section', { class: P + 'plan', 'aria-label': 'Arbeitsplan' },
          h('h3', null, 'Vorrat'), poolWrap,
          h('h3', { class: P + 'h2' }, 'Arbeitsplan (Stunden)'),
          buildLane(0), buildLane(1),
          infoEl, noteEl)));
      render();
    },
    isComplete: function () { return allPlaced(); },
    evaluate: function () {
      var sc = schedule(lanes);
      return { correct: !!sc && sc.makespan <= OPT, answer: { lanes: [lanes[0].slice(), lanes[1].slice()], hours: sc ? sc.makespan : null } };
    },
    setAnswer: function (ans) {
      var l = ans && ans.lanes;
      lanes = (l && l.length === 2 && schedule(l)) ? [l[0].slice(), l[1].slice()] : [[], []];
      selected = null; mark = (schedule(lanes) && schedule(lanes).makespan <= OPT && allPlaced()) ? 'ok' : 'bad'; say('');
      render();
    },
    lock: function (on) {
      locked = on; selected = null; if (drag) { drag = null; endDrag(); }
      if (on) { var sc = schedule(lanes); mark = (mark === 'solution' || (sc && allPlaced() && sc.makespan <= OPT)) ? 'ok' : 'bad'; } else mark = null;
      say(''); render();
    },
    reset: function () { lanes = [[], []]; selected = null; mark = null; say(''); render(); },
    showSolution: function () { lanes = [SOLUTION[0].slice(), SOLUTION[1].slice()]; selected = null; locked = true; mark = 'solution'; say(''); render(); }
  });
})();
