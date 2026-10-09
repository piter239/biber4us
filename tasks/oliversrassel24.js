/* Aufgabe Olivers Rassel (Biber 2024; Klasse 3-4 mittel): verkettete (zirkuläre) Liste, Kugeln in der Reihenfolge einsetzen */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-oliversrassel24-';

  var BALLS = {
    r: { name: 'rote Kugel mit Dreieck', short: 'rot', color: 'var(--c1)', sym: '<path d="M18 9.5L26 23H10Z"/>' },
    y: { name: 'gelbe Kugel mit Stern', short: 'gelb', color: 'var(--c2)', sym: '<path d="M18 8.5l2.7 6 6.5.6-4.9 4.3 1.5 6.4L18 22.4l-5.8 3.4 1.5-6.4-4.9-4.3 6.5-.6Z"/>' },
    g: { name: 'grüne Kugel mit Kleeblatt', short: 'grün', color: 'var(--c6)', sym: '<circle cx="18" cy="12" r="3.6"/><circle cx="18" cy="24" r="3.6"/><circle cx="12" cy="18" r="3.6"/><circle cx="24" cy="18" r="3.6"/>' },
    c: { name: 'hellblaue Kugel mit Sechseck', short: 'hellblau', color: 'var(--c3)', sym: '<path d="M18 8.5l7.8 4.5v10L18 27.5 10.2 23V13Z"/>' },
    p: { name: 'violette Kugel mit Quadrat', short: 'violett', color: 'var(--c5)', sym: '<rect x="11" y="11" width="14" height="14" rx="2.5"/>' }
  };
  /* Reihenfolge laut Heft: rot -> gelb -> grün -> hellblau -> violett -> rot (Nachbar rechts, ganz rechts folgt wieder ganz links) */
  var CYCLE = ['r', 'y', 'g', 'c', 'p'];
  var START = ['r', 'y', 'g', 'c', 'p'];
  var SHAKE1 = ['g', 'c', 'p', 'r', 'y'];
  var FIXED = ['p', null, null, 'g', null];     /* Vorgabe in der Aufgabe (von links) */
  var ANSWER = ['p', 'r', 'y', 'g', 'c'];

  /* Prüfung der Heft-Lösung gegen die Kettenregel (rechter Nachbar, am Ende wieder links) */
  (function () {
    function nextOf(id) { return CYCLE[(CYCLE.indexOf(id) + 1) % CYCLE.length]; }
    function consistent(arr) { return arr.every(function (id, i) { return nextOf(id) === arr[(i + 1) % arr.length]; }); }
    if (!consistent(START) || !consistent(SHAKE1) || !consistent(ANSWER)) throw new Error('oliversrassel24: Reihenfolge stimmt nicht');
    FIXED.forEach(function (f, i) { if (f && f !== ANSWER[i]) throw new Error('oliversrassel24: Vorgabe stimmt nicht'); });
  })();

  /* ---------- Geometrie (viewBox 320 x 295) ---------- */
  var VW = 320, VH = 295, CX = 160, CY = 150, RC = 112, STEP = 21;
  function slotPos(i) {
    var a = (i - 2) * STEP * Math.PI / 180;
    return { x: CX + RC * Math.sin(a), y: CY + RC * Math.cos(a) };
  }

  function ballSvg(id, size) {
    var b = BALLS[id];
    return '<svg class="' + P + 'ballsvg" viewBox="0 0 36 36"' + (size ? ' width="' + size + '" height="' + size + '"' : '') + ' aria-hidden="true" focusable="false">' +
      '<circle cx="18" cy="18" r="16.2" fill="' + b.color + '" stroke="var(--ink)" stroke-opacity=".45" stroke-width="1.4"/>' +
      '<ellipse cx="12" cy="9.5" rx="6" ry="3" transform="rotate(-28 12 9.5)" fill="#fff" fill-opacity=".38"/>' +
      '<g fill="#fff" fill-opacity=".92" stroke="var(--ink)" stroke-opacity=".35" stroke-width=".8">' + b.sym + '</g></svg>';
  }
  function ballSpan(id) {
    var s = h('span', { class: P + 'ball', 'aria-hidden': 'true' });
    s.innerHTML = ballSvg(id);
    return s;
  }

  function ringBg() {
    return '<svg class="' + P + 'ringsvg" viewBox="0 0 ' + VW + ' ' + VH + '" aria-hidden="true" focusable="false">' +
      '<circle cx="' + CX + '" cy="' + CY + '" r="142" fill="var(--band)" stroke="var(--accent)" stroke-width="3"/>' +
      '<circle cx="' + CX + '" cy="' + CY + '" r="84" fill="var(--surface)" stroke="var(--accent)" stroke-width="3"/>' +
      '<path d="M70 70 A112 112 0 0 1 150 38" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="7" stroke-linecap="round"/></svg>';
  }
  function place(el, i) {
    var p = slotPos(i);
    el.style.left = (p.x / VW * 100) + '%';
    el.style.top = (p.y / VH * 100) + '%';
  }
  function staticRing(order, label) {
    var box = h('div', { class: P + 'ring ' + P + 'small', role: 'img', 'aria-label': label });
    box.innerHTML = ringBg();
    order.forEach(function (id, i) {
      var b = h('span', { class: P + 'pos' }, ballSpan(id));
      place(b, i);
      box.appendChild(b);
    });
    return box;
  }

  /* ---------- Zustand ---------- */
  var el, api, locked, slots, selected, mark;
  var ringEl, trayEl, noteEl, drag, suppress, winOff;

  function fresh() { return FIXED.slice(); }
  function reset() { slots = fresh(); selected = null; mark = null; }
  function loose() {
    return CYCLE.filter(function (id) { return slots.indexOf(id) < 0; });
  }
  function describeSlot(i) {
    var id = slots[i];
    return 'Platz ' + (i + 1) + ' von 5 (von links): ' + (id ? BALLS[id].name : 'leer') + (FIXED[i] ? ', fest vorgegeben' : '');
  }
  function say(t) { noteEl.textContent = t || ''; }

  function setSlot(i, id) {
    if (locked || FIXED[i]) return;
    var from = id ? slots.indexOf(id) : -1;
    if (from >= 0 && !FIXED[from]) slots[from] = null;
    slots[i] = id;
    selected = null;
    var kb = document.activeElement && el.contains(document.activeElement);
    draw();
    if (kb) { var nx = trayEl.querySelector('[data-ball]') || ringEl.querySelector('[data-slot="' + i + '"]'); if (nx) nx.focus(); }
    say(id ? BALLS[id].name.replace(/^(\w)/, function (m) { return m.toUpperCase(); }) + ' liegt auf Platz ' + (i + 1) + '.' : '');
    api.changed();
  }
  function release(i) {
    if (locked || FIXED[i] || !slots[i]) return;
    slots[i] = null; selected = null;
    draw();
    api.changed();
  }

  function draw() {
    var ok = mark !== null;
    ringEl.querySelectorAll('.' + P + 'slot').forEach(function (n) { n.remove(); });
    slots.forEach(function (id, i) {
      var cls = P + 'slot' + (id ? ' filled' : '') + (FIXED[i] ? ' fixed' : '') + (!id && selected ? ' target' : '');
      var right = ok && id === ANSWER[i];
      if (ok && !FIXED[i]) cls += right ? ' right' : ' wrong';
      var b = h('button', {
        type: 'button', class: cls, 'data-slot': String(i), 'aria-label': describeSlot(i) + (ok && !FIXED[i] ? (right ? ', richtig' : ', falsch') : ''),
        disabled: locked && !FIXED[i] ? 'disabled' : false
      }, id ? ballSpan(id) : null);
      if (FIXED[i]) b.setAttribute('aria-disabled', 'true');
      if (ok && !FIXED[i]) b.appendChild(h('span', { class: P + 'mark', 'aria-hidden': 'true' }, right ? '✓' : '✗'));
      place(b, i);
      ringEl.appendChild(b);
    });
    trayEl.replaceChildren.apply(trayEl, loose().map(function (id) {
      return h('button', {
        type: 'button', class: P + 'chip' + (selected === id ? ' selected' : ''), 'data-ball': id, 'aria-pressed': String(selected === id),
        'aria-label': BALLS[id].name + (selected === id ? ', ausgewählt' : '') + ', noch nicht eingesetzt', disabled: locked ? 'disabled' : false
      }, ballSpan(id));
    }));
    if (!loose().length) trayEl.appendChild(h('span', { class: P + 'empty' }, 'Alle Kugeln liegen in der Rassel.'));
  }

  /* ---------- Bedienung: Antippen oder Ziehen ---------- */
  function onClick(e) {
    if (suppress) { suppress = false; return; }
    if (locked) return;
    var t = e.target.closest('[data-ball],[data-slot]');
    if (!t) return;
    if (t.dataset.ball) {
      selected = selected === t.dataset.ball ? null : t.dataset.ball;
      draw();
      var chip = trayEl.querySelector('[data-ball="' + t.dataset.ball + '"]');
      if (chip) chip.focus();
      say(selected ? BALLS[selected].name.replace(/^(\w)/, function (m) { return m.toUpperCase(); }) + ' ausgewählt. Tippe nun einen leeren Platz an.' : '');
      return;
    }
    var i = +t.dataset.slot;
    if (FIXED[i]) { say('Diese Kugel ist vorgegeben und bleibt liegen.'); return; }
    if (selected) setSlot(i, selected);
    else if (slots[i]) release(i);
  }
  function onDown(e) {
    if (locked || (e.button !== undefined && e.button > 0)) return;
    var t = e.target.closest('[data-ball],[data-slot]');
    if (!t) return;
    var id = t.dataset.ball || (t.dataset.slot !== undefined ? slots[+t.dataset.slot] : null);
    if (!id || (t.dataset.slot !== undefined && FIXED[+t.dataset.slot])) return;
    drag = { id: id, x: e.clientX, y: e.clientY, on: false, ghost: null, pid: e.pointerId, from: t.dataset.slot !== undefined ? +t.dataset.slot : -1 };
  }
  function onMove(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    if (!drag.on) {
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 8) return;
      drag.on = true;
      drag.ghost = h('div', { class: P + 'ghost', 'aria-hidden': 'true' }, ballSpan(drag.id));
      document.body.appendChild(drag.ghost);
    }
    e.preventDefault();
    drag.ghost.style.left = e.clientX + 'px';
    drag.ghost.style.top = e.clientY + 'px';
    var under = document.elementFromPoint(e.clientX, e.clientY);
    var s = under && under.closest('[data-slot]');
    ringEl.querySelectorAll('.over').forEach(function (n) { n.classList.remove('over'); });
    if (s && ringEl.contains(s) && !FIXED[+s.dataset.slot]) s.classList.add('over');
  }
  function onUp(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    var d = drag; drag = null;
    if (!d.on) return;
    suppress = true;
    setTimeout(function () { suppress = false; }, 50);
    if (d.ghost) d.ghost.remove();
    var under = document.elementFromPoint(e.clientX, e.clientY);
    var s = under && under.closest('[data-slot]');
    if (s && ringEl.contains(s)) {
      var i = +s.dataset.slot;
      if (!FIXED[i]) {
        if (slots[i] && d.from >= 0) { slots[d.from] = slots[i]; slots[i] = null; }
        else if (slots[i]) { slots[i] = null; }
        setSlot(i, d.id);
        return;
      }
    }
    if (d.from >= 0) release(d.from); else draw();
  }
  function onCancel() {
    if (drag && drag.ghost) drag.ghost.remove();
    drag = null;
    draw();
  }

  function cycleHtml(size) {
    return '<span class="' + P + 'chain">' + CYCLE.concat(CYCLE[0]).map(function (id) { return ballSvg(id, size); }).join('<span class="' + P + 'arr" aria-hidden="true">→</span>') + '</span>';
  }

  Biber.register({
    id: 'oliversrassel24',
    story:
      '<p>Oliver hat eine durchsichtige Rassel mit bunten Kugeln. Wenn er die Rassel schüttelt, bewegen sich einige Kugeln. ' +
      'Danach liegen die Kugeln anders in der Rassel als vorher. Oliver schüttelt die Rassel noch einmal.</p>',
    question: 'Wie liegen die Kugeln nun? Fülle die leeren Plätze in der Rassel.',
    howto: 'Ziehe die Kugeln auf die leeren Plätze. Du kannst auch erst eine Kugel und dann einen Platz antippen. Eine eingesetzte Kugel nimmst du durch Antippen wieder heraus.',
    explanation: function () {
      return '<p>Beim Schütteln ändert sich die Reihenfolge der Kugeln nicht: Nach jeder Kugel kommt immer dieselbe nächste Kugel (hier nach rechts gesehen), und nach der letzten kommt wieder die erste. ' +
        'Aus dem ersten Bild liest man die Kette ab:</p>' +
        '<p class="' + P + 'chainrow">' + cycleHtml(30) + '</p>' +
        '<p>Nach der violetten Kugel kommt also die rote, dann die gelbe, dann die schon liegende grüne und zuletzt die hellblaue.</p>' +
        '<p><strong>Informatik:</strong> Diese Kette ist eine <em>zirkuläre verkettete Liste</em>: Jedes Datenelement (Knoten) verweist auf den nächsten, und der letzte verweist wieder auf den ersten. ' +
        'So ähnlich spielt eine Musik-App eine Wiedergabeliste der Reihe nach ab und fängt am Ende wieder von vorn an.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; drag = null; suppress = false; reset();
      ringEl = h('div', { class: P + 'ring ' + P + 'big', role: 'group', 'aria-label': 'Rassel mit fünf Plätzen, von links nach rechts' });
      ringEl.innerHTML = ringBg();
      trayEl = h('div', { class: P + 'tray', role: 'group', 'aria-label': 'Kugeln, die noch fehlen' });
      noteEl = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      var arrow = function () { return h('span', { class: P + 'shake', 'aria-hidden': 'true' }, '→'); };
      el.replaceChildren(h('div', { class: P + 'board' },
        h('div', { class: P + 'history' },
          h('figure', { class: P + 'fig' }, staticRing(START, 'Rassel am Anfang, von links nach rechts: rot, gelb, grün, hellblau, violett'), h('figcaption', null, 'Anfang')),
          arrow(),
          h('figure', { class: P + 'fig' }, staticRing(SHAKE1, 'Rassel nach dem ersten Schütteln, von links nach rechts: grün, hellblau, violett, rot, gelb'), h('figcaption', null, 'nach dem 1. Schütteln'))),
        h('p', { class: P + 'lead' }, 'Nach dem 2. Schütteln:'),
        h('div', { class: P + 'work' }, ringEl, h('div', { class: P + 'side' }, h('p', { class: P + 'lab' }, 'Diese Kugeln fehlen noch:'), trayEl)),
        noteEl));
      el.addEventListener('click', onClick);
      el.addEventListener('pointerdown', onDown);
      if (winOff) winOff();
      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onCancel);
      winOff = function () {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onCancel);
        if (drag && drag.ghost) drag.ghost.remove();
        drag = null; winOff = null;
      };
      draw();
    },
    isComplete: function () { return slots.every(Boolean); },
    evaluate: function () {
      var ok = ANSWER.every(function (id, i) { return slots[i] === id; });
      return { correct: ok, answer: slots.slice() };
    },
    setAnswer: function (ans) {
      slots = Array.isArray(ans) ? ans.slice(0, 5) : fresh();
      FIXED.forEach(function (f, i) { if (f) slots[i] = f; });
      mark = 'check'; selected = null;
      draw();
    },
    lock: function (on) {
      locked = on; selected = null;
      mark = on ? 'check' : null;
      if (on) say(ANSWER.every(function (id, i) { return slots[i] === id; }) ? 'Alle Kugeln liegen an der richtigen Stelle.' : 'Markiert ist, welche Plätze stimmen.'); else say('');
      draw();
    },
    reset: function () { reset(); draw(); say(''); },
    showSolution: function () {
      slots = ANSWER.slice(); selected = null; mark = 'check'; locked = true;
      draw();
      say('Lösung: von links nach rechts violett, rot, gelb, grün, hellblau.');
    }
  });
})();
