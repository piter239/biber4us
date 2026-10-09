/* Aufgabe Lieblingsgeschenk b (Biber 2021, S. 37; Klasse 7-8 mittel, 9-10 leicht): Geschenke den Kindern zuteilen (Rank-Maximal Matching) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-geschenkb21-';
  var DIR = 'assets/geschenkb21/';

  var GIFTS = {
    ahorn: { name: 'Ahornblatt auf Baumstumpf' },
    birke: { name: 'Birkenblatt auf Birkenstamm' },
    weide: { name: 'Weidenzweig auf Holzstück' },
    eiche: { name: 'Eichenblatt auf dunklem Holzstück' },
    pappel: { name: 'grünes Blatt auf Baumstumpf' }
  };
  var POOL = ['birke', 'ahorn', 'weide', 'eiche', 'pappel'];                 /* Reihenfolge der Geschenke wie im Heft */
  var KIDS = [
    { wish: ['birke', 'ahorn'] },
    { wish: ['ahorn', 'weide'] },
    { wish: ['eiche', 'weide'] },
    { wish: ['ahorn', 'birke'] },
    { wish: ['pappel', 'birke'] }
  ];                 /* wish = [Lieblingsgeschenk, zweitliebstes Geschenk] */
  var RIGHT = ['birke', 'weide', 'eiche', 'ahorn', 'pappel'];               /* einzige Lösung laut Heft (S. 37); per Skript (alle Zuteilungen) bestätigt */
  var N = KIDS.length;

  var el, api, locked, assign, selected, markMode, drag, suppressClick;

  function reset() { assign = KIDS.map(function () { return null; }); selected = null; markMode = null; }
  function isRight(a) { return a.every(function (g, i) { return g === RIGHT[i]; }); }
  function count() { return assign.filter(Boolean).length; }
  function icon(g, cls) { return h('img', { class: cls || '', src: DIR + 'i_' + g + '.png', alt: GIFTS[g].name, draggable: 'false' }); }
  function card(g) { return h('img', { src: DIR + 'g_' + g + '.png', alt: '', draggable: 'false' }); }

  function place(g, k) {
    if (locked) return;
    var from = assign.indexOf(g), occupant = assign[k];
    if (from === k) return;
    assign[k] = g;
    if (from >= 0) assign[from] = occupant;
    selected = null;
  }
  function release(g) {
    var from = assign.indexOf(g);
    if (from >= 0) assign[from] = null;
    selected = null;
  }
  function say() { api.changed(count() + ' von ' + N + ' Geschenken verteilt.'); }

  function render(focus) {
    var pool = POOL.map(function (g) {
      if (assign.indexOf(g) >= 0) return h('div', { class: P + 'ghost', 'aria-hidden': 'true' });
      return h('button', {
        type: 'button', class: P + 'gift' + (selected === g ? ' sel' : ''), 'data-g': g, 'data-pool-item': '',
        'aria-pressed': String(selected === g), 'aria-label': 'Geschenk: ' + GIFTS[g].name + (selected === g ? ', ausgewählt' : ''), disabled: locked
      }, card(g));
    });
    var rows = KIDS.map(function (kid, k) {
      var g = assign[k], cls = P + 'slot' + (g ? ' filled' : ''), mark = null, tail = '';
      if (g && markMode === 'check') {
        var ok = g === RIGHT[k];
        cls += ok ? ' right' : ' wrong';
        mark = h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
        tail = ok ? ', richtig' : ', falsch';
      } else if (g && markMode === 'solution') cls += ' right';
      var label = 'Biber ' + (k + 1) + ': wünscht sich zuerst ' + GIFTS[kid.wish[0]].name + ', dann ' + GIFTS[kid.wish[1]].name + '. ' +
        (g ? 'Bekommt: ' + GIFTS[g].name + tail + (locked ? '' : '. Antippen legt das Geschenk zurück') : 'Noch kein Geschenk');
      var slot = h('button', {
        type: 'button', class: cls, 'data-slot': String(k), 'data-g': g || false, 'aria-label': label, disabled: locked
      }, g ? card(g) : h('span', { class: P + 'ph', 'aria-hidden': 'true' }, '?'), mark);
      return h('div', { class: P + 'row' },
        slot,
        h('img', { class: P + 'kid', src: DIR + 'k' + (k + 1) + '.png', alt: '', draggable: 'false' }),
        h('div', { class: P + 'bubble', 'aria-hidden': 'true' },
          h('span', { class: P + 'rk' }, '1:'), h('span', { class: P + 'ic' }, icon(kid.wish[0])),
          h('span', { class: P + 'rk' }, '2:'), h('span', { class: P + 'ic' }, icon(kid.wish[1]))));
    });
    el.replaceChildren(h('div', { class: P + 'box' },
      h('div', { class: P + 'pool', 'data-pool': '', role: 'group', 'aria-label': 'Geschenke zum Verteilen' }, pool),
      h('div', { class: P + 'rows', role: 'group', 'aria-label': 'Die Biberkinder mit ihren Wünschen' }, rows)));
    if (focus) {
      var f = el.querySelector(focus);
      if (f && !f.disabled) f.focus({ preventScroll: true });
    }
  }

  /* ---------- Bedienung: Antippen (erst Geschenk, dann Kind), Ziehen ---------- */
  function onClick(e) {
    var t = e.target.closest('[data-g],[data-slot]');
    if (!t || locked) return;
    if (suppressClick) { suppressClick = false; return; }
    if (t.dataset.slot !== undefined) {
      var k = +t.dataset.slot;
      if (selected) {
        place(selected, k);
        render('[data-slot="' + k + '"]');
      } else if (assign[k]) {
        var g = assign[k];
        release(g);
        render('[data-g="' + g + '"]');
      } else return;
      return say();
    }
    var id = t.dataset.g;
    selected = selected === id ? null : id;
    render('[data-g="' + id + '"]');
  }
  function onDown(e) {
    var t = e.target.closest('[data-g]');
    if (!t || locked || (e.pointerType === 'mouse' && e.button !== 0)) return;
    drag = { b: t, id: t.dataset.g, x: e.clientX, y: e.clientY, on: false, pid: e.pointerId };
  }
  function onMove(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.on) {
      if (Math.abs(dx) + Math.abs(dy) < 8) return;
      drag.on = true;
      try { drag.b.setPointerCapture(e.pointerId); } catch (x) { /* egal */ }
      drag.b.classList.add('drag');
    }
    drag.b.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    var over = targetAt(e.clientX, e.clientY, drag.b);
    [].forEach.call(el.querySelectorAll('[data-slot]'), function (s) { s.classList.toggle('over', over === s); });
    el.querySelector('[data-pool]').classList.toggle('over', over && over.hasAttribute('data-pool'));
    e.preventDefault();
  }
  function targetAt(x, y, skip) {
    var list = document.elementsFromPoint(x, y);
    for (var i = 0; i < list.length; i++) {
      var n = list[i];
      if (skip && (n === skip || skip.contains(n))) continue;
      if (!el.contains(n)) continue;
      var s = n.closest('[data-slot],[data-pool]');
      if (s) return s;
    }
    return null;
  }
  function onUp(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    var d = drag; drag = null;
    if (!d.on) return;
    suppressClick = true;
    setTimeout(function () { suppressClick = false; }, 60);
    var t = targetAt(e.clientX, e.clientY, d.b);
    if (t && t.dataset.slot !== undefined) { place(d.id, +t.dataset.slot); render('[data-slot="' + t.dataset.slot + '"]'); say(); }
    else if (t) { release(d.id); render('[data-g="' + d.id + '"]'); say(); }
    else render();
  }
  function onCancel() {
    if (!drag) return;
    drag = null; render();
  }

  Biber.register({
    id: 'geschenkb21',
    story: '<p>Die Biberfamilie hat fünf Geschenke für ihre fünf Kinder. Jedes Kind nennt zuerst sein Lieblingsgeschenk und dann das zweitliebste. Die Geschenke sollen richtig zugeteilt werden:</p><ol><li>Möglichst viele Kinder sollen ihr Lieblingsgeschenk bekommen.</li><li>Die übrigen sollen das zweitliebste bekommen.</li></ol>',
    question: 'Ziehe die richtigen Geschenke zu den Kindern.',
    howto: 'Ziehe ein Geschenk auf das Feld neben einem Biber. Oder tippe erst das Geschenk an und dann das Feld. Tippst du ein belegtes Feld an, geht das Geschenk zurück.',
    explanation: function () {
      function ic(g) { return '<img class="' + P + 'inl" src="' + DIR + 'i_' + g + '.png" alt="' + GIFTS[g].name + '">'; }
      return '<p>Vier Biber bekommen ihr Lieblingsgeschenk, einer das zweitliebste. Alle fünf Lieblingsgeschenke gleichzeitig gehen nicht, denn Biber 2 und Biber 4 wünschen sich zuerst beide das Ahornblatt ' + ic('ahorn') + '.</p>' +
        '<p>Zuerst vergibt man die Geschenke, die nur ein Biber als Lieblingsgeschenk nennt: die Birke ' + ic('birke') + ' an Biber 1, die Eiche ' + ic('eiche') + ' an Biber 3 und das grüne Blatt ' + ic('pappel') + ' an Biber 5. Bleiben Biber 2 und Biber 4 mit dem Ahornblatt als Lieblingsgeschenk. Biber 4 hat als zweiten Wunsch die Birke, die schon vergeben ist, also bekommt Biber 4 das Ahornblatt. Biber 2 bekommt als zweitliebstes den Weidenzweig ' + ic('weide') + '.</p>' +
        '<p>Gieriges Vorgehen von oben nach unten reicht hier nicht: Gibt man dem zweiten Biber das Ahornblatt, bleibt für den vierten Biber keines seiner beiden Wunschgeschenke übrig. Bei Zuteilungsproblemen (Matching) muss man die Gesamtlösung im Blick behalten.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; drag = null; suppressClick = false;
      reset();
      el.addEventListener('click', onClick);
      el.addEventListener('pointerdown', onDown);
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerup', onUp);
      el.addEventListener('pointercancel', onCancel);
      render();
    },
    isComplete: function () { return count() === N; },
    evaluate: function () { return { correct: isRight(assign), answer: assign.slice() }; },
    setAnswer: function (ans) {
      assign = KIDS.map(function (_, i) { return ans && ans[i] && GIFTS[ans[i]] ? ans[i] : null; });
      selected = null; markMode = null;
      render();
    },
    lock: function (on) {
      locked = on; selected = null; drag = null;
      markMode = on ? (markMode === 'solution' ? 'solution' : 'check') : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      assign = RIGHT.slice(); selected = null; markMode = 'solution';
      render();
    }
  });
})();
