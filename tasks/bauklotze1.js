/* Aufgabe Bauklötze 1 (Klasse 3-4 mittel, 5-6 einfach): Anweisungen in die richtige Reihenfolge bringen */
(function () {
  'use strict';
  var h = Biber.h;

  /* Lösung (per Brute Force über alle 120 Reihenfolgen geprüft: nur diese Reihenfolge ist baubar) */
  var STEPS = {
    t: { text: 'Baue drei Türme mit jeweils 2 Würfeln.', why: 'Alles andere steht auf den Würfeln, also kommen sie zuerst.' },
    r: { text: 'Stelle die Würfel-Türme in eine Reihe.', why: 'Die Brücke braucht ihre Türme an der richtigen Stelle.' },
    b: { text: 'Lege die Brücke auf dein Bauwerk.', why: 'Sie liegt auf dem mittleren und dem rechten Turm. Der rechte Quader steht später auf ihr.' },
    q: { text: 'Stelle beide Quader auf dein Bauwerk.', why: 'Einer steht auf dem linken Turm, der andere auf der Brücke. Die Brücke muss also schon liegen.' },
    p: { text: 'Lege die Pyramiden auf dein Bauwerk.', why: 'Die Pyramiden sitzen ganz oben, auf den Quadern und auf der Brücke. Deshalb kommen sie zuletzt.' }
  };
  var SOLUTION = ['t', 'r', 'b', 'q', 'p'];
  var START = ['q', 'r', 'p', 't', 'b']; /* Reihenfolge wie im Heft abgedruckt */

  /* ---------- Bausteine als SVG-Text ---------- */
  function poly(cls, pts) { return '<polygon class="bk-s ' + cls + '" points="' + pts + '"/>'; }
  function rect(cls, x, y, w, ht) { return '<rect class="bk-s ' + cls + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + ht + '" rx="3"/>'; }
  function svg(vb, label, inner, cls) {
    return '<svg class="' + (cls || 'bk-fig') + '" viewBox="' + vb + '" role="img" aria-label="' + label + '" focusable="false">' + inner + '</svg>';
  }
  var BRIDGE_FLAT = 'M283 407 L357 407 A147.5 96 0 0 0 652 407 L726 407 L726 543 L283 543 Z';
  var BRIDGE_ARCH = 'M283 407 L726 407 L726 543 L652 543 A147.5 96 0 0 0 357 543 L283 543 Z';

  function structureSvg() {
    var inner =
      rect('bk-teal', 135, 628, 82, 82) + rect('bk-purple', 135, 545, 82, 82) +
      rect('bk-pink', 140, 293, 70, 251) + poly('bk-navy', '95,293 250,293 172,182') +
      rect('bk-yellow', 337, 627, 82, 82) + rect('bk-red', 337, 545, 82, 82) +
      rect('bk-green', 600, 627, 82, 82) + rect('bk-cyan', 600, 545, 82, 82) +
      '<path class="bk-s bk-bridge" d="' + BRIDGE_FLAT + '"/>' +
      poly('bk-orange', '242,408 396,408 319,298') +
      rect('bk-blue', 653, 157, 70, 251) + poly('bk-magenta', '613,157 767,157 690,46');
    return svg('60 30 760 700',
      'Das fertige Bauwerk: drei Würfel-Türme mit je zwei Würfeln in einer Reihe. Auf dem linken Turm steht ein langer Quader mit einer Pyramide. Die Brücke liegt auf dem mittleren und dem rechten Turm, mit einer Pyramide links auf der Brücke. Rechts auf der Brücke steht ein Quader mit einer Pyramide darauf.',
      inner, 'bk-fig bk-final');
  }
  function inventory() {
    var cubes = svg('0 0 150 100', '6 Würfel',
      rect('bk-purple', 8, 8, 38, 38) + rect('bk-red', 56, 8, 38, 38) + rect('bk-yellow', 104, 8, 38, 38) +
      rect('bk-teal', 8, 54, 38, 38) + rect('bk-green', 56, 54, 38, 38) + rect('bk-cyan', 104, 54, 38, 38));
    var bridge = svg('250 380 520 190', '1 Brücke',
      '<path class="bk-s bk-bridge" d="' + BRIDGE_ARCH + '"/>');
    var pyr = svg('0 0 150 100', '3 Pyramiden',
      poly('bk-orange', '10,50 66,50 38,6') + poly('bk-navy', '84,44 140,44 112,0') + poly('bk-magenta', '46,96 102,96 74,52'));
    var quad = svg('0 0 150 100', '2 Quader',
      rect('bk-pink', 42, 4, 26, 92) + rect('bk-blue', 82, 4, 26, 92));
    function cell(label, fig) { return '<li><span class="bk-cap">' + label + '</span>' + fig + '</li>'; }
    return '<ul class="bk-inv" aria-label="Alis Bauklötze">' + cell('6 Würfel', cubes) + cell('1 Brücke', bridge) +
      cell('3 Pyramiden', pyr) + cell('2 Quader', quad) + '</ul>';
  }

  /* ---------- Zustand ---------- */
  var el, api, order, locked, dragId, status; /* status: null | 'check' | 'solution' */

  function reset() { order = START.slice(); dragId = null; status = null; }
  function isRight() { return order.every(function (id, i) { return id === SOLUTION[i]; }); }
  function move(id, to) {
    var from = order.indexOf(id);
    if (from < 0 || to < 0 || to >= order.length || from === to) return false;
    order.splice(from, 1);
    order.splice(to, 0, id);
    return true;
  }
  function statusText() { return ''; }

  function render(focus) {
    var items = order.map(function (id, i) {
      var cls = 'bk-item' + (dragId === id ? ' dragging' : '');
      var mark = null;
      if (status === 'check') {
        var ok = SOLUTION[i] === id;
        cls += ok ? ' right' : ' wrong';
        mark = h('span', { class: 'bk-mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      } else if (status === 'solution') cls += ' right';
      var text = STEPS[id].text;
      return h('li', { class: cls, 'data-id': id },
        h('span', { class: 'bk-num', 'aria-hidden': 'true' }, String(i + 1)),
        h('span', { class: 'bk-grip', 'aria-hidden': 'true', 'data-grip': id }, '⠿'),
        h('span', { class: 'bk-text' }, text),
        h('span', { class: 'bk-btns' },
          h('button', { type: 'button', class: 'bk-mv', 'data-mv': 'up', 'data-id': id, disabled: locked || i === 0, 'aria-label': 'Schritt „' + text + '“ nach oben, jetzt Platz ' + (i + 1) }, '↑'),
          h('button', { type: 'button', class: 'bk-mv', 'data-mv': 'down', 'data-id': id, disabled: locked || i === order.length - 1, 'aria-label': 'Schritt „' + text + '“ nach unten, jetzt Platz ' + (i + 1) }, '↓')),
        mark);
    });
    el.replaceChildren(h('div', { class: 'bk-board' },
      h('div', { class: 'bk-ends' }, h('span', null, 'Zuerst')),
      h('ol', { class: 'bk-list', 'aria-label': 'Anweisungen von Zaha, oben zuerst' }, items),
      h('div', { class: 'bk-ends' }, h('span', null, 'Zuletzt'))));
    if (focus) {
      var b = el.querySelector('[data-id="' + focus.id + '"][data-mv="' + focus.dir + '"]:not(:disabled)') ||
        el.querySelector('[data-id="' + focus.id + '"][data-mv]:not(:disabled)');
      if (b) b.focus();
    }
  }

  function onClick(e) {
    var b = e.target.closest('[data-mv]');
    if (!b || locked) return;
    var id = b.dataset.id, i = order.indexOf(id), dir = b.dataset.mv;
    if (move(id, dir === 'up' ? i - 1 : i + 1)) {
      render({ id: id, dir: dir });
      api.changed();
    }
  }

  /* Ziehen per Zeigergerät (Maus und Touch) am Griff */
  function onDown(e) {
    var g = e.target.closest('[data-grip]');
    if (!g || locked || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    dragId = g.dataset.grip;
    render();
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
  }
  function onMove(e) {
    if (!dragId) return;
    var t = document.elementFromPoint(e.clientX, e.clientY);
    var li = t && t.closest ? t.closest('.bk-item') : null;
    if (!li || !el.contains(li) || li.dataset.id === dragId) return;
    var r = li.getBoundingClientRect();
    var target = order.indexOf(li.dataset.id);
    var cur = order.indexOf(dragId);
    /* erst umsortieren, wenn der Zeiger die Mitte des Zielfelds überschritten hat */
    if ((target > cur && e.clientY < r.top + r.height * 0.35) || (target < cur && e.clientY > r.top + r.height * 0.65)) return;
    if (move(dragId, target)) render();
  }
  function onUp() {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onUp);
    if (!dragId) return;
    dragId = null;
    render();
    api.changed();
  }

  Biber.register({
    id: 'bauklotze1',
    story: '<p>Ali hat diese Bauklötze:</p>' + inventory() +
      '<p>Alis Schwester Zaha gibt ihm nach und nach Anweisungen, was er mit den Bauklötzen tun soll. Ali erledigt jede Anweisung sofort. Am Ende entsteht dieses Bauwerk:</p>' +
      '<div class="bk-final-wrap">' + structureSvg() + '</div>',
    question: 'In welcher Reihenfolge hat Zaha die Anweisungen gegeben?',
    howto: 'Bringe die fünf Anweisungen in die richtige Reihenfolge: Ziehe sie am Griff nach oben oder unten oder benutze die Pfeil-Knöpfe. Ganz oben steht die erste Anweisung.',
    explanation: function () {
      return '<p>Jeder Baustein braucht erst das, worauf er steht. Daher geht es nur in dieser Reihenfolge:</p>' +
        '<ol class="bk-why">' + SOLUTION.map(function (id) {
          return '<li><strong>' + STEPS[id].text + '</strong><span>' + STEPS[id].why + '</span></li>';
        }).join('') + '</ol>' +
        '<p>In einem Programm ist die Reihenfolge der Anweisungen wichtig. Oft muss etwas erst da sein, bevor eine spätere Anweisung damit arbeiten kann.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('pointerdown', onDown);
      render();
    },
    isComplete: function () { return true; },
    evaluate: function () { return { correct: isRight(), answer: order.slice() }; },
    setAnswer: function (ans) {
      order = ans.slice();
      status = isRight() ? 'solution' : 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      status = on ? 'check' : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      order = SOLUTION.slice();
      locked = true;
      status = 'solution';
      render();
    }
  });
})();
