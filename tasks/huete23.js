/* Aufgabe Neue Hüte (Biber 2023, S. 41; Klasse 3-4 einfach): fünf Biber nach der Höhe ihrer Hüte sortieren */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-huete23-';

  /* hat = Höhe des Huts im Heftbild (Pixel bei 400 dpi, nur Hut gemessen: Krempe bis Spitze); f = Bildhöhe des Bibers relativ zur Bühne (Füße auf einer Linie) */
  var B = {
    rot:   { hat: 235, f: 0.964, w: 244, h: 964, name: 'rotem Pilzhut' },
    gelb:  { hat: 477, f: 0.724, w: 199, h: 724, name: 'langem gelbem Zipfelhut' },
    gruen: { hat: 165, f: 0.487, w: 253, h: 487, name: 'flachem grünem Hut' },
    blau:  { hat: 317, f: 0.726, w: 224, h: 726, name: 'blauem Zylinderhut' },
    lila:  { hat: 397, f: 0.964, w: 312, h: 964, name: 'hohem lila Strickhut' }
  };
  var START = ['rot', 'gelb', 'gruen', 'blau', 'lila'];     /* Reihenfolge im Heftbild */
  var RIGHT = ['gruen', 'rot', 'blau', 'lila', 'gelb'];     /* offizielle Lösung (Heft S. 41); per Skript aus den gemessenen Hutgrößen bestätigt */
  var N = 5;

  var el, api, locked, order, picked, moved, sel, drag, markMode, suppressClick;

  function src(id) { return 'assets/huete23/' + id + '.png'; }
  function isRight(o) { return o.every(function (id, i) { return id === RIGHT[i]; }); }
  function label(id, i) { return 'Biber mit ' + B[id].name + ', Platz ' + (i + 1) + ' von ' + N; }

  function swap(i, j) {
    if (locked || i === j) return;
    var t = order[i]; order[i] = order[j]; order[j] = t;
    moved = true;
  }

  function render(focusId) {
    var slots = order.map(function (id, i) {
      var cls = P + 'beaver' + (picked === id ? ' sel' : '');
      if (markMode === 'check') cls += id === RIGHT[i] ? ' right' : ' wrong';
      else if (markMode === 'solution') cls += ' right';
      var b = h('button', {
        type: 'button', class: cls, 'data-id': id, 'data-i': String(i), disabled: locked,
        'aria-pressed': String(picked === id), 'aria-label': label(id, i) + (markMode === 'check' ? (id === RIGHT[i] ? ', richtig' : ', falscher Platz') : ''),
        style: 'height:' + (B[id].f * 100) + '%;aspect-ratio:' + B[id].w + '/' + B[id].h
      }, h('img', { src: src(id), alt: '', draggable: 'false' }));
      return h('div', { class: P + 'slot', 'data-slot': String(i) }, b);
    });
    var nodes = [h('div', { class: P + 'grid', 'aria-hidden': 'true' }), h('div', { class: P + 'row', role: 'group', 'aria-label': 'Fünf Biber von links nach rechts' }, slots)];
    el.replaceChildren(h('div', { class: P + 'box' },
      h('div', { class: P + 'stage' }, nodes),
      h('div', { class: P + 'axis', 'aria-hidden': 'true' },
        h('span', null, '← kürzester Hut'), h('span', null, 'höchster Hut →'))));
    sel = el.querySelector('.' + P + 'row');
    if (focusId) {
      var f = el.querySelector('[data-id="' + focusId + '"]');
      if (f) f.focus({ preventScroll: true });
    }
  }

  function say(id) { api.changed('Der Biber mit ' + B[id].name + ' steht jetzt auf Platz ' + (order.indexOf(id) + 1) + ' von ' + N + '.'); }

  /* ---------- Bedienung: Antippen (erst wählen, dann tauschen), Ziehen, Pfeiltasten ---------- */
  function onClick(e) {
    var b = e.target.closest('.' + P + 'beaver');
    if (!b || locked) return;
    if (suppressClick) { suppressClick = false; return; }
    var id = b.dataset.id;
    if (picked === id) { picked = null; render(id); return; }
    if (picked) {
      var a = picked, i = order.indexOf(a), j = order.indexOf(id);
      picked = null;
      swap(i, j);
      render(a);
      say(a);
      return;
    }
    picked = id;
    render(id);
  }
  function onKey(e) {
    var b = e.target.closest('.' + P + 'beaver');
    if (!b || locked) return;
    var d = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
    if (!d) return;
    e.preventDefault();
    var id = b.dataset.id, i = order.indexOf(id), j = i + d;
    if (j < 0 || j >= N) return;
    picked = null;
    swap(i, j);
    render(id);
    say(id);
  }
  function slotAt(x) {
    var r = sel.getBoundingClientRect();
    var k = Math.floor((x - r.left) / (r.width / N));
    return Math.max(0, Math.min(N - 1, k));
  }
  function onDown(e) {
    var b = e.target.closest('.' + P + 'beaver');
    if (!b || locked || (e.pointerType === 'mouse' && e.button !== 0)) return;
    drag = { b: b, id: b.dataset.id, x: e.clientX, y: e.clientY, on: false, pid: e.pointerId };
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
    var k = slotAt(e.clientX);
    [].forEach.call(el.querySelectorAll('.' + P + 'slot'), function (s, i) { s.classList.toggle('over', i === k); });
    e.preventDefault();
  }
  function onUp(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    var d = drag; drag = null;
    if (!d.on) return;
    suppressClick = true;
    setTimeout(function () { suppressClick = false; }, 60);
    var i = order.indexOf(d.id), j = slotAt(e.clientX);
    picked = null;
    swap(i, j);
    render(d.id);
    if (i !== j) say(d.id);
  }
  function onCancel() {
    if (!drag) return;
    drag = null; render();
  }


  Biber.register({
    id: 'huete23',
    story: '<p>Die Biber haben neue Hüte. Die Hüte sind unterschiedlich hoch.</p>',
    question: 'Sortiere die Hüte nach der Höhe. Der Biber mit dem kürzesten Hut soll links stehen.',
    howto: 'Tippe einen Biber an und dann einen zweiten: Die beiden tauschen ihre Plätze. Du kannst Biber auch ziehen oder mit den Pfeiltasten verschieben. Die Linien im Hintergrund helfen dir beim Vergleichen.',
    explanation: function () {
      var strip = RIGHT.map(function (id) {
        return '<img src="' + src(id) + '" alt="Biber mit ' + B[id].name + '" style="height:' + Math.round(B[id].f * 130) + 'px;width:auto">';
      }).join('');
      return '<p>Es kommt nur auf die Höhe des <b>Huts</b> an, nicht auf die Größe des Bibers: Der grüne Hut ist am kürzesten, danach folgen der rote, der blaue und der lila Hut. Der gelbe Hut ist am höchsten, obwohl sein Biber klein ist.</p>' +
        '<p class="' + P + 'strip">' + strip + '</p>' +
        '<p>Sortieren geht nur, wenn man eine Eigenschaft hat, die man vergleichen kann (hier die Höhe: „kleiner als“). Sortierte Daten kann ein Computer viel schneller durchsuchen, zum Beispiel ein Wörterbuch.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false;
      suppressClick = false; drag = null;
      order = START.slice(); picked = null; moved = false; markMode = null;
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKey);
      el.addEventListener('pointerdown', onDown);
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerup', onUp);
      el.addEventListener('pointercancel', onCancel);
      render();
    },
    isComplete: function () { return moved; },
    evaluate: function () { return { correct: isRight(order), answer: order.slice() }; },
    setAnswer: function (ans) {
      order = ans.slice(); picked = null; moved = true;
      markMode = null;
      render();
    },
    lock: function (on) {
      locked = on; picked = null;
      markMode = on ? (markMode === 'solution' ? 'solution' : 'check') : null;
      render();
    },
    reset: function () {
      order = START.slice(); picked = null; moved = false; markMode = null; render();
    },
    showSolution: function () {
      order = RIGHT.slice(); picked = null; markMode = 'solution'; moved = true; render();
    }
  });
})();
