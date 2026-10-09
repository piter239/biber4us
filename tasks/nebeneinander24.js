/* Aufgabe Nebeneinander (Biber 2024, S. 41; Klasse 5-8): doppelt verkettete Liste aus Kamerabildern */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-nebeneinander24-';
  var DIR = 'assets/nebeneinander24/';

  /* Die neun Kamerabilder in der Anordnung auf dem Bildschirm (Heft S. 41): wer ist links/rechts neben dem Kind zu sehen? */
  var KIDS = [
    { id: 'emma', name: 'Emma', left: 'james', right: 'diana' },
    { id: 'mia', name: 'Mia', left: 'raul', right: null },
    { id: 'bella', name: 'Bella', left: 'hannah', right: 'alice' },
    { id: 'lee', name: 'Lee', left: 'diana', right: 'hannah' },
    { id: 'raul', name: 'Raul', left: 'alice', right: 'mia' },
    { id: 'hannah', name: 'Hannah', left: 'lee', right: 'bella' },
    { id: 'diana', name: 'Diana', left: 'emma', right: 'lee' },
    { id: 'alice', name: 'Alice', left: 'bella', right: 'raul' },
    { id: 'james', name: 'James', left: null, right: 'emma' }
  ];
  var BY = {};
  KIDS.forEach(function (k) { BY[k.id] = k; });
  function nm(id) { return id ? BY[id].name : null; }

  /* Lösung: Kind ohne linken Nachbarn finden und den Verweisen nach rechts folgen */
  function walk() {
    var cur = KIDS.filter(function (k) { return !k.left; })[0].id, out = [];
    while (cur) { out.push(cur); cur = BY[cur].right; }
    return out;
  }
  var SOL = walk();   /* James, Emma, Diana, Lee, Hannah, Bella, Alice, Raul, Mia (wie im Heft) */
  var N = SOL.length;

  /* Die Neun in anderer Reihenfolge im Vorrat (wie im Heft: Emma, Mia, Bella, Lee, Raul, Hannah, Diana, Alice, James) */
  var POOL = KIDS.map(function (k) { return k.id; });

  function tileAlt(k) {
    return 'Kamerabild von ' + k.name + '. ' + (k.left ? 'Links daneben ist ' + nm(k.left) + ' zu sehen' : 'Links daneben ist niemand zu sehen') +
      ', ' + (k.right ? 'rechts daneben ist ' + nm(k.right) + ' zu sehen.' : 'rechts daneben ist niemand zu sehen.');
  }
  function face(id, cls) {
    return h('img', { class: cls || P + 'face', src: DIR + 'k-' + id + '.png', alt: '', draggable: 'false' });
  }

  var el, api, locked, slots, selected, dragging, mark;
  function reset() { slots = []; for (var i = 0; i < N; i++) slots.push(null); selected = null; dragging = null; mark = null; }
  function slotOf(id) { return slots.indexOf(id); }
  function isRightAt(i) { return slots[i] === SOL[i]; }
  function allRight() { return SOL.every(function (id, i) { return slots[i] === id; }); }

  function place(id, idx) {
    if (locked) return;
    var from = slotOf(id), other = slots[idx];
    slots[idx] = id;
    if (from >= 0) slots[from] = other === id ? null : other;
    selected = null;
    render();
    api.changed();
  }
  function release(id) {
    if (locked) return;
    var from = slotOf(id);
    if (from >= 0) slots[from] = null;
    selected = null;
    render();
    api.changed();
  }

  function render() {
    var screen = h('div', { class: P + 'screen', role: 'group', 'aria-label': 'Bildschirm mit den neun Kamerabildern' },
      KIDS.map(function (k) {
        return h('img', { class: P + 'tile', src: DIR + 't-' + k.id + '.png', alt: tileAlt(k), width: 286, height: 190, draggable: 'false' });
      }));
    var pool = POOL.map(function (id) {
      if (slotOf(id) >= 0) return h('div', { class: P + 'cell', 'aria-hidden': 'true' });
      var sel = selected === id;
      return h('button', {
        type: 'button', class: P + 'kid' + (sel ? ' selected' : ''), 'data-kid': id, disabled: locked,
        draggable: locked ? false : 'true', 'aria-pressed': String(sel), 'aria-label': BY[id].name
      }, face(id), h('span', { class: P + 'nm' }, BY[id].name));
    });
    var row = slots.map(function (id, i) {
      var cls = P + 'slot' + (id ? ' filled' : ''), badge = null;
      if (mark === 'check' && id) {
        var ok = isRightAt(i);
        cls += ok ? ' right' : ' wrong';
        badge = h('span', { class: P + 'badge', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      } else if (mark === 'solution') cls += ' right';
      return h('button', {
        type: 'button', class: cls, 'data-slot': String(i), disabled: locked,
        draggable: id && !locked ? 'true' : false, 'data-in-slot': id || false,
        'aria-label': 'Platz ' + (i + 1) + ' von ' + N + (i === 0 ? ' (ganz links)' : i === N - 1 ? ' (ganz rechts)' : '') + ': ' + (id ? BY[id].name : 'leer')
      }, h('span', { class: P + 'pos', 'aria-hidden': 'true' }, String(i + 1)), id ? face(id) : null, id ? h('span', { class: P + 'nm' }, BY[id].name) : null, badge);
    });
    el.replaceChildren(h('div', { class: P + 'board' },
      h('div', { class: P + 'monitor' }, screen),
      h('section', { 'aria-label': 'Reihe der Kinder' },
        h('h3', null, 'Die Reihe, von links nach rechts'),
        h('div', { class: P + 'row' }, row)),
      h('section', { 'aria-label': 'Kinder zum Einordnen' },
        h('h3', null, 'Die neun Freunde'),
        h('div', { class: P + 'pool', 'data-pool': '' }, pool))));
  }

  function onClick(e) {
    if (locked) return;
    var k = e.target.closest('[data-kid]');
    if (k) { var id = k.dataset.kid; selected = selected === id ? null : id; render(); var again = el.querySelector('[data-kid="' + id + '"]'); if (again) again.focus(); return; }
    var s = e.target.closest('[data-slot]');
    if (!s) return;
    var idx = +s.dataset.slot;
    if (selected) return place(selected, idx);
    if (slots[idx]) release(slots[idx]);
  }
  function onDragStart(e) {
    var t = e.target.closest('[data-kid],[data-in-slot]');
    if (!t || locked) return;
    dragging = t.dataset.kid || t.dataset.inSlot;
    e.dataTransfer.setData('text/plain', dragging);
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e) {
    if (!dragging) return;
    var s = e.target.closest('[data-slot],[data-pool]');
    if (!s) return;
    e.preventDefault();
    if (s.dataset.slot) s.classList.add('over');
  }
  function onDragLeave(e) { var s = e.target.closest('[data-slot]'); if (s) s.classList.remove('over'); }
  function onDrop(e) {
    if (!dragging) return;
    var s = e.target.closest('[data-slot],[data-pool]');
    if (!s) return;
    e.preventDefault();
    var id = dragging;
    dragging = null;
    if (s.dataset.slot) place(id, +s.dataset.slot); else release(id);
  }
  function onDragEnd() { dragging = null; if (!locked) render(); }

  Biber.register({
    id: 'nebeneinander24',
    story:
      '<p>Ava hat die Schule gewechselt. Heute trifft sie ihre Freunde von der alten Schule online. Ihre Freunde sitzen alle nebeneinander in einer Reihe.</p>' +
      '<p>Jedes Kind sitzt vor einer eigenen Kamera. In jedem Kamerabild sind aber auch die Kinder zu sehen, die direkt daneben sitzen. ' +
      'So sieht Ava ihre Freunde auf ihrem Bildschirm:</p>',
    question: 'Wie sitzen die Freunde nebeneinander in der Reihe?',
    howto: 'Ziehe jedes Kind auf seinen Platz in der Reihe. Du kannst auch erst das Kind und dann den Platz antippen. Tippe ein Kind in der Reihe an, um es wieder herauszunehmen.',
    explanation: function () {
      var faces = SOL.map(function (id) {
        return '<li><img src="' + DIR + 'k-' + id + '.png" alt="" width="60"><span>' + BY[id].name + '</span></li>';
      }).join('');
      return '<p>Die Kamerabilder verraten, wer neben wem sitzt. Im Bild von James ist links neben ihm niemand zu sehen, also sitzt er ganz links. ' +
        'Rechts neben James erscheint Emma. In Emmas Bild ist rechts Diana zu sehen, bei Diana dann Lee, und so geht es weiter bis Mia: Rechts neben ihr ist niemand, also sitzt sie ganz rechts.</p>' +
        '<ol class="' + P + 'sol" aria-label="Reihenfolge von links nach rechts">' + faces + '</ol>' +
        '<p>Jedes Kamerabild verweist auf die Kinder links und rechts daneben. Ein solches Geflecht nennt man in der Informatik eine <i>doppelt verkettete Liste</i>: ' +
        'Jeder Knoten enthält ein Element und Verweise auf den vorherigen und den nächsten Knoten, nur am Anfang und am Ende ist ein Verweis leer. ' +
        'Man kann sie in beide Richtungen durchlaufen, so wie den Verlauf in einem Browser.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('dragleave', onDragLeave);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', onDragEnd);
      render();
    },
    isComplete: function () { return slots.every(Boolean); },
    evaluate: function () { return { correct: allRight(), answer: slots.slice() }; },
    setAnswer: function (ans) {
      reset();
      if (Array.isArray(ans)) for (var i = 0; i < N; i++) slots[i] = BY[ans[i]] ? ans[i] : null;
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      selected = null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () { slots = SOL.slice(); selected = null; locked = true; mark = 'solution'; render(); }
  });
})();
