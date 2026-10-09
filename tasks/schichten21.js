/* Aufgabe Flüssige Schichten (Biber 2021, S. 27; Klasse 7-8 schwer, 9-10 mittel, 11-13 leicht): Reihenfolge aus Teilordnungen bestimmen (topologische Sortierung) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-schichten21-';

  var LIQ = {
    gelb:   { name: 'gelb',    text: 'gelbe Flüssigkeit mit schwarzen Punkten' },
    rot:    { name: 'rot',     text: 'rote Flüssigkeit mit orangen Streifen' },
    gruen:  { name: 'grün',    text: 'grüne Flüssigkeit mit Bläschen' },
    blau:   { name: 'blau',    text: 'blaue Flüssigkeit mit Sprenkeln' },
    violett: { name: 'violett', text: 'violette Flüssigkeit mit dunklen Streifen' }
  };
  var POOL = ['gelb', 'rot', 'gruen', 'blau', 'violett'];           /* Reihenfolge der Becher im Heft */
  /* Die drei kleinen Flaschen, jeweils von unten nach oben (Heftbild S. 27) */
  var BOTTLES = [['blau', 'rot', 'gelb'], ['rot', 'gelb', 'gruen'], ['blau', 'gruen', 'violett']];
  /* Große Flasche, von unten nach oben: einzige Anordnung, die zu allen drei Flaschen passt (Heft S. 27; per Skript über alle 120 Reihenfolgen bestätigt) */
  var RIGHT = ['blau', 'rot', 'gelb', 'gruen', 'violett'];
  var N = 5;

  var el, api, locked, assign, selected, markMode, drag, suppressClick;

  function reset() { assign = []; for (var i = 0; i < N; i++) assign.push(null); selected = null; markMode = null; }
  function isRight(a) { return a.every(function (g, i) { return g === RIGHT[i]; }); }
  function count() { return assign.filter(Boolean).length; }

  /* Flasche zeichnen: Glas als SVG, Schichten (Slot 0 = ganz unten) als Elemente darüber */
  var GLASS = 'M62 4 H98 V64 C98 90 140 100 140 140 V292 Q140 314 118 314 H42 Q20 314 20 292 V140 C20 100 62 90 62 64 Z';
  function glass() {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 160 320');
    svg.setAttribute('class', P + 'glass');
    svg.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', GLASS);
    svg.appendChild(p);
    return svg;
  }
  function smallBottle(layers, nr) {
    var bands = [];
    for (var i = 0; i < N; i++) bands.push(layers[i] ? h('div', { class: P + 'band ' + P + 'l-' + layers[i] }) : h('div', { class: P + 'band ' + P + 'air' }));
    var label = 'Flasche ' + nr + ', von unten nach oben: ' + layers.map(function (l) { return LIQ[l].name; }).join(', ');
    return h('figure', { class: P + 'small', role: 'img', 'aria-label': label },
      h('div', { class: P + 'bottle' }, glass(), h('div', { class: P + 'stack' }, bands)),
      h('figcaption', { 'aria-hidden': 'true' }, String(nr)));
  }

  function swatch(l) { return h('span', { class: P + 'sw ' + P + 'l-' + l }); }

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
  function say() { api.changed(count() + ' von ' + N + ' Flüssigkeiten in der Flasche.'); }

  function render(focus) {
    var pool = POOL.map(function (g) {
      if (assign.indexOf(g) >= 0) return h('div', { class: P + 'ghost', 'aria-hidden': 'true' });
      return h('button', {
        type: 'button', class: P + 'cup' + (selected === g ? ' sel' : ''), 'data-g': g,
        'aria-pressed': String(selected === g), 'aria-label': LIQ[g].text + (selected === g ? ', ausgewählt' : ''), disabled: locked
      }, swatch(g), h('span', { class: P + 'nm', 'aria-hidden': 'true' }, LIQ[g].name));
    });
    var slots = assign.map(function (g, k) {
      var cls = P + 'slot' + (g ? ' filled ' + P + 'l-' + g : ''), mark = null, tail = '';
      if (g && markMode === 'check') {
        var ok = g === RIGHT[k];
        cls += ok ? ' right' : ' wrong';
        mark = h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
        tail = ok ? ', richtig' : ', falsch';
      } else if (g && markMode === 'solution') cls += ' right';
      var pos = k === 0 ? 'ganz unten' : k === N - 1 ? 'ganz oben' : 'von unten die ' + (k + 1) + '.';
      return h('button', {
        type: 'button', class: cls, 'data-slot': String(k), 'data-g': g || false, disabled: locked,
        'aria-label': 'Schicht ' + (k + 1) + ' von unten (' + pos + '): ' + (g ? LIQ[g].text + tail + (locked ? '' : '. Antippen nimmt sie heraus') : 'leer')
      }, g ? null : h('span', { class: P + 'ph', 'aria-hidden': 'true' }, String(k + 1)), mark);
    });
    el.replaceChildren(h('div', { class: P + 'box' },
      h('section', { class: P + 'given', 'aria-label': 'Die drei kleinen Flaschen' },
        h('h3', null, 'Drei Flaschen'),
        h('div', { class: P + 'smalls' }, BOTTLES.map(function (b, i) { return smallBottle(b, i + 1); }))),
      h('section', { class: P + 'big', 'aria-label': 'Die große Flasche' },
        h('h3', null, 'Alle fünf in einer Flasche'),
        h('div', { class: P + 'work' },
          h('div', { class: P + 'pool', 'data-pool': '', role: 'group', 'aria-label': 'Flüssigkeiten zum Einfüllen' }, pool),
          h('div', { class: P + 'bottle ' + P + 'main' }, glass(),
            h('div', { class: P + 'stack', role: 'group', 'aria-label': 'Große Flasche, Schichten von unten nach oben' }, slots.slice().reverse()))))));
    if (focus) {
      var f = el.querySelector(focus);
      if (f && !f.disabled) f.focus({ preventScroll: true });
    }
  }

  /* ---------- Bedienung: Antippen (erst Flüssigkeit, dann Schicht), Ziehen ---------- */
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
    el.querySelector('[data-pool]').classList.toggle('over', !!over && over.hasAttribute('data-pool'));
    e.preventDefault();
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
    id: 'schichten21',
    story:
      '<p>Maria experimentiert mit fünf farbigen Flüssigkeiten. Die Flüssigkeiten haben alle eine andere Dichte und ordnen sich in Schichten an.</p>' +
      '<p>In drei Flaschen gibt Maria nun jeweils drei Flüssigkeiten, immer gleich viel. Am Ende sind die Flüssigkeiten so angeordnet, wie du es unten in den drei Flaschen siehst.</p>' +
      '<p>Nun gibt Maria alle fünf Flüssigkeiten in eine Flasche.</p>',
    question: 'Ziehe alle Flüssigkeiten so in die Flasche, wie sie am Ende angeordnet sind!',
    howto: 'Ziehe die Flüssigkeiten in die fünf Schichten der großen Flasche. Oder tippe erst eine Flüssigkeit an und dann die Schicht. Tippst du eine gefüllte Schicht an, kommt die Flüssigkeit wieder heraus.',
    explanation: function () {
      function chip(l) { return '<span class="' + P + 'chip ' + P + 'l-' + l + '" aria-hidden="true"></span><b>' + LIQ[l].name + '</b>'; }
      return '<p>Die Flüssigkeit ganz unten darf in keiner der drei kleinen Flaschen über einer anderen liegen. Das ist nur <strong>blau</strong>: Sie liegt in Flasche 1 und 3 unten und kommt in Flasche 2 gar nicht vor. Sie kommt also ganz unten in die große Flasche. Danach lässt man sie in Gedanken weg.</p>' +
        '<p>Jetzt ist <strong>rot</strong> die einzige Flüssigkeit, die in keiner Flasche mehr über einer anderen liegt, dann folgen gelb, grün und zum Schluss violett. Von unten nach oben: ' +
        RIGHT.map(chip).join(' · ') + '.</p>' +
        '<p>Aus mehreren Teil-Reihenfolgen eine Gesamtreihenfolge zu bauen, nennt man in der Informatik topologisches Sortieren: Man nimmt immer ein Element, vor dem nichts mehr stehen muss, und entfernt es dann aus allen Teil-Reihenfolgen.</p>';
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
      assign = [];
      for (var i = 0; i < N; i++) assign.push(ans && ans[i] && LIQ[ans[i]] ? ans[i] : null);
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
