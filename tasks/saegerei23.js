/* Aufgabe Noahs Sägerei (Biber 2023; Klasse 5-6 mittel, 7-8 einfach): Behälterproblem, First-Fit-Regel */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-saegerei23-';

  /* Weg von links nach rechts: fester Stamm (f), Lücke (g) - zusammen 18 m */
  var START = [
    { t: 'f', len: 4 }, { t: 'g', len: 3 }, { t: 'f', len: 3 }, { t: 'g', len: 6 }, { t: 'f', len: 1 }, { t: 'g', len: 1 }
  ];
  var LOGS = [1, 2, 3, 4];
  var SOLUTION = [3, 4, 2, 1];   /* erste der drei richtigen Reihenfolgen im Heft */

  /* ---------- Spiellogik: First Fit ---------- */
  function simulate(order) {
    var segs = START.map(function (s) { return { t: s.t, len: s.len }; });
    var placed = [];
    order.forEach(function (len, k) {
      var i, done = false;
      for (i = 0; i < segs.length && !done; i++) {
        if (segs[i].t === 'g' && segs[i].len >= len) {
          var rest = segs[i].len - len;
          var piece = { t: 'n', len: len, k: k };
          if (rest > 0) segs.splice(i, 1, piece, { t: 'g', len: rest }); else segs.splice(i, 1, piece);
          done = true;
        }
      }
      placed.push(done);
    });
    return { segs: segs, placed: placed };
  }
  function allFit(order) { return simulate(order).placed.every(Boolean); }
  function perms(a) {
    if (a.length <= 1) return [a.slice()];
    var out = [];
    a.forEach(function (x, i) {
      perms(a.slice(0, i).concat(a.slice(i + 1))).forEach(function (p) { out.push([x].concat(p)); });
    });
    return out;
  }
  var VALID = perms(LOGS).filter(allFit);   /* Brute Force: genau (3,4,2,1), (3,2,4,1), (4,3,2,1) */

  /* ---------- Zeichnen ---------- */
  var U = 20;   /* Einheiten pro Meter im viewBox */
  function pathSvg(sim, label) {
    var x = 0, out = '', posList = [];
    sim.segs.forEach(function (s) {
      var w = s.len * U, cx = x + w / 2;
      if (s.t === 'g') {
        out += '<rect class="' + P + 'gap" x="' + (x + 1.5) + '" y="22" width="' + (w - 3) + '" height="30" rx="5"/>' +
          '<text class="' + P + 'gaplbl" x="' + cx + '" y="68" text-anchor="middle">' + s.len + ' m</text>';
      } else {
        var cls = s.t === 'f' ? 'fix' : 'new';
        out += '<g class="' + P + 'wood ' + P + cls + (w < 30 ? ' ' + P + 'sm' : '') + '"><rect x="' + (x + 1) + '" y="19" width="' + (w - 2) + '" height="36" rx="8"/>' +
          (w > 30 ? '<ellipse class="' + P + 'ring" cx="' + (x + 11) + '" cy="37" rx="5" ry="12"/>' : '') +
          '<text x="' + (w > 30 ? cx + 5 : cx) + '" y="42" text-anchor="middle">' + s.len + ' m</text></g>';
      }
      x += w;
    });
    return '<svg class="' + P + 'road" viewBox="0 0 360 76" role="img" aria-label="' + label + '">' +
      '<rect class="' + P + 'ground" x="0" y="12" width="360" height="50" rx="10"/>' + out + '</svg>';
  }
  function roadLabel(sim) {
    return 'Der 18 Meter lange Weg von links nach rechts: ' + sim.segs.map(function (s) {
      return (s.t === 'g' ? 'Lücke ' : s.t === 'f' ? 'Stamm ' : 'neuer Stamm ') + s.len + ' m';
    }).join(', ');
  }
  function logSvg(len, cls) {
    var w = 18 * len + 22;
    return '<svg class="' + P + 'logsvg ' + (cls || '') + '" width="' + w + '" height="34" viewBox="0 0 ' + w + ' 34" aria-hidden="true">' +
      '<rect x="1" y="2" width="' + (w - 2) + '" height="30" rx="8"/><ellipse class="' + P + 'ring" cx="11" cy="17" rx="4.5" ry="10"/>' +
      '<text x="' + (w / 2 + 5) + '" y="22" text-anchor="middle">' + len + ' m</text></svg>';
  }

  /* ---------- Zustand ---------- */
  var el, api, locked, slots, mark, dragging, noteEl, roadEl, slotEls, poolEl;

  function reset() { slots = [null, null, null, null]; mark = null; dragging = null; }
  function prefix() {
    var out = [];
    for (var i = 0; i < slots.length; i++) { if (slots[i] === null) break; out.push(slots[i]); }
    return out;
  }
  function usedLen(len) { return slots.indexOf(len) >= 0; }

  function place(len, idx) {
    if (locked) return;
    var from = slots.indexOf(len), existing = slots[idx];
    slots[idx] = len;
    if (from >= 0) slots[from] = existing === len ? null : existing;
    render('s' + idx);
    api.changed();
  }
  function tapPool(len) {
    if (locked || usedLen(len)) return;
    var idx = slots.indexOf(null);
    if (idx < 0) return;
    slots[idx] = len;
    render('s' + Math.min(idx + 1, 3));
    api.changed();
  }
  function release(idx) {
    if (locked || slots[idx] === null) return;
    var len = slots[idx];
    slots[idx] = null;
    render('l' + len);
    api.changed();
  }

  function render(focusKey) {
    var pre = prefix();
    var sim = simulate(pre);
    var failAt = sim.placed.indexOf(false);
    var full = slots.every(function (s) { return s !== null; });

    roadEl.innerHTML = pathSvg(sim, roadLabel(sim));
    if (!pre.length) noteEl.textContent = 'Lege die Stämme unten der Reihe nach fest. Der Weg zeigt dir, wohin Noah sie nach seiner Regel legt.';
    else if (failAt >= 0) noteEl.textContent = 'Der ' + pre[failAt] + '-m-Stamm (Platz ' + (failAt + 1) + ') passt in keine Lücke mehr. So klappt es nicht.';
    else if (pre.length === 4) noteEl.textContent = 'Alle vier Stämme liegen auf dem Weg.';
    else noteEl.textContent = 'Bis jetzt passt alles. Noch ' + (4 - pre.length) + (4 - pre.length === 1 ? ' Stamm' : ' Stämme') + ' zu schneiden.';

    slotEls = slots.map(function (len, i) {
      var cls = P + 'slot' + (len !== null ? ' filled' : '');
      var m = null;
      if (len !== null && mark === 'check') {
        var ok = i < sim.placed.length ? sim.placed[i] : false;
        cls += ok ? ' right' : ' wrong';
        m = h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      } else if (len !== null && mark === 'solution') cls += ' right';
      var b = h('button', {
        type: 'button', class: cls, 'data-slot': String(i), 'data-key': 's' + i, disabled: locked,
        draggable: len !== null && !locked ? 'true' : false, 'data-in-slot': len !== null ? String(len) : false,
        'aria-label': 'Platz ' + (i + 1) + ': ' + (len !== null ? len + '-m-Stamm. Antippen zum Entfernen.' : 'leer')
      }, h('span', { class: P + 'no', 'aria-hidden': 'true' }, String(i + 1)));
      if (len !== null) { var holder = h('span', { class: P + 'holder' }); holder.innerHTML = logSvg(len); b.appendChild(holder); }
      else b.appendChild(h('span', { class: P + 'ph', 'aria-hidden': 'true' }, '?'));
      if (m) b.appendChild(m);
      return b;
    });
    poolEl.replaceChildren.apply(poolEl, LOGS.map(function (len) {
      if (usedLen(len)) return h('span', { class: P + 'ghost', 'aria-hidden': 'true' }, len + ' m');
      var b = h('button', {
        type: 'button', class: P + 'log', 'data-log': String(len), 'data-key': 'l' + len, disabled: locked, draggable: locked ? false : 'true',
        'aria-label': len + '-m-Stamm' + (full ? '' : ': antippen, um ihn als Nächsten zu schneiden')
      });
      b.innerHTML = logSvg(len);
      return b;
    }));
    el.querySelector('[data-slots]').replaceChildren.apply(el.querySelector('[data-slots]'), slotEls);

    if (focusKey && !locked) {
      var t = el.querySelector('[data-key="' + focusKey + '"]') || el.querySelector('[data-key^="l"]') || el.querySelector('[data-key^="s"]');
      if (t) { try { t.focus({ preventScroll: true }); } catch (e) { /* egal */ } }
    }
  }

  /* ---------- Ereignisse ---------- */
  function onClick(e) {
    var t = e.target.closest('[data-log],[data-slot]');
    if (!t || locked) return;
    if (t.dataset.log) return tapPool(+t.dataset.log);
    release(+t.dataset.slot);
  }
  function onDragStart(e) {
    var t = e.target.closest('[data-log],[data-in-slot]');
    if (!t || locked) return;
    dragging = +(t.dataset.log || t.dataset.inSlot);
    e.dataTransfer.setData('text/plain', String(dragging));
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e) {
    var s = e.target.closest('[data-slot],[data-pool]');
    if (!s || !dragging) return;
    e.preventDefault();
    if (s.dataset.slot) s.classList.add('over');
  }
  function onDragLeave(e) {
    var s = e.target.closest('[data-slot]');
    if (s) s.classList.remove('over');
  }
  function onDrop(e) {
    var s = e.target.closest('[data-slot],[data-pool]');
    if (!s || !dragging) return;
    e.preventDefault();
    var len = dragging;
    dragging = null;
    if (s.dataset.slot) place(len, +s.dataset.slot);
    else { var i = slots.indexOf(len); if (i >= 0) release(i); }
  }
  function onDragEnd() { dragging = null; if (!locked) render(); }

  Biber.register({
    id: 'saegerei23',
    story:
      '<p>Biber Noah schneidet Holzstämme in verschiedenen Längen zu und verkauft sie dann. Sobald er einen Stamm zugeschnitten hat, legt er ihn auf dem 18 Meter langen Weg ab. Dabei beachtet Noah eine Regel: <strong>Er legt den Stamm in die erste Lücke von links, in die der Stamm passt.</strong></p>' +
      '<p>Noah verkauft einige Stämme. Danach gibt es drei Lücken auf dem Weg (3 m, 6 m und 1 m). Nun will Noah vier Stämme zuschneiden, mit Längen von 1, 2, 3 und 4 Metern.</p>',
    question: 'In welcher Reihenfolge muss Noah die Stämme zuschneiden, damit er alle vier in die Lücken legen kann?',
    howto: 'Tippe die Stämme der Reihe nach an (oder ziehe sie auf die Plätze 1 bis 4). Der Weg oben zeigt, wohin Noah sie nach seiner Regel legt. Tippe einen Stamm auf einem Platz an, um ihn wieder wegzunehmen.',
    explanation: function () {
      return '<p>Richtig sind die Reihenfolgen <strong>3 m, 4 m, 2 m, 1 m</strong>, <strong>3 m, 2 m, 4 m, 1 m</strong> und <strong>4 m, 3 m, 2 m, 1 m</strong>. ' +
        'Bei der ersten kommt der 3-m-Stamm in die 3-m-Lücke, der 4-m-Stamm in die 6-m-Lücke, dann bleibt dort eine 2-m-Lücke für den 2-m-Stamm, und der 1-m-Stamm füllt die letzte Lücke.</p>' +
        '<p>Der 1-m-Stamm muss zuletzt kommen, weil nur er die letzte 1-m-Lücke füllen kann. Und der 2-m-Stamm darf nicht vor dem 3-m-Stamm kommen: Er würde sonst in die 3-m-Lücke gelegt, und es bliebe eine zweite 1-m-Lücke übrig.</p>' +
        '<p>Das ist ein Fall des <em>Behälterproblems</em> (bin packing): Gegenstände sollen so in Behälter gepackt werden, dass alles hineinpasst. Noahs Regel heißt <em>First Fit</em>. Sie ist einfach, liefert aber nur bei der richtigen Reihenfolge ein gutes Ergebnis.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      roadEl = h('div', { class: P + 'roadbox' });
      noteEl = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      poolEl = h('div', { class: P + 'pool', 'data-pool': '' });
      el.addEventListener('click', onClick);
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('dragleave', onDragLeave);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', onDragEnd);
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { 'aria-label': 'Der Weg' }, h('h3', null, 'Der Weg (18 m)'), roadEl, noteEl),
        h('section', { 'aria-label': 'Reihenfolge' }, h('h3', null, 'Reihenfolge, in der Noah zuschneidet'),
          h('div', { class: P + 'slots', 'data-slots': '', role: 'group', 'aria-label': 'Plätze 1 bis 4' })),
        h('section', { 'aria-label': 'Stämme' }, h('h3', null, 'Stämme zum Zuschneiden'), poolEl)));
      render();
    },
    isComplete: function () { return slots.every(function (s) { return s !== null; }); },
    evaluate: function () {
      return { correct: allFit(slots), answer: { order: slots.slice() } };
    },
    setAnswer: function (ans) {
      var o = ans && ans.order;
      slots = Array.isArray(o) && o.length === 4 ? o.slice() : [null, null, null, null];
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () { slots = SOLUTION.slice(); mark = 'solution'; locked = true; render(); }
  });
})();
