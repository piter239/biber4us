/* Aufgabe Stempelbild (Heft 2021, S. 51; Klasse 3-4 leicht): Reihenfolge aus Überdeckungen erschließen */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-stempelbild21-';
  var DIR = 'assets/stempelbild21/';

  var STAMPS = {
    haus: { name: 'Haus', w: 257, h: 285, alt: 'orangefarbenes Haus mit Fenstern und Tür' },
    blatt: { name: 'Blatt', w: 221, h: 264, alt: 'grünes Blatt mit hellen Adern' },
    sonne: { name: 'Sonne', w: 257, h: 257, alt: 'gelbe Sonne mit Strahlen' },
    blume: { name: 'Blume', w: 155, h: 255, alt: 'lila Tulpe mit zwei Blättern' }
  };
  var OPTIONS = [{ key: 'A', stamp: 'haus' }, { key: 'B', stamp: 'blatt' }, { key: 'C', stamp: 'sonne' }, { key: 'D', stamp: 'blume' }];
  var RIGHT = 2;   /* C: Sonne; im Heft bestätigt, Reihenfolge Sonne - Blatt - Blume - Haus per Skript (Überdeckungen im Bild) eindeutig */
  var ORDER = ['sonne', 'blatt', 'blume', 'haus'];   /* richtige Reihenfolge der Stempel (zuerst bis zuletzt) */

  /* Lage der acht Abdrücke im Bild (Koordinaten im Bild 1800 x 660; per Anpassung an die Abbildung im Heft bestimmt).
     sc: Skalierung relativ zur Bilddatei (Bildbreite = Dateibreite * sc), rot: Drehung in Grad */
  var PRINTS = {
    sonne: [{ x: 242.6, y: 212.9, sc: 0.808, rot: 0 }, { x: 1001.3, y: 262, sc: 0.808, rot: 0 }],
    blatt: [{ x: 473.5, y: 414.9, sc: 0.943, rot: -30 }, { x: 1070.3, y: 191, sc: 0.943, rot: -30 }],
    blume: [{ x: 564.5, y: 373, sc: 0.836, rot: 0 }, { x: 1366.3, y: 375.8, sc: 0.836, rot: 30 }],
    haus: [{ x: 668.1, y: 334.4, sc: 0.925, rot: 13.7 }, { x: 1462.3, y: 274.5, sc: 0.925, rot: -30 }]
  };
  var PAPER = 'M45 38 L1745 16 L1748 628 C1500 596 1100 575 800 590 C500 600 200 606 5 608 C20 480 50 360 47 230 Z';

  function img(kind, cls) {
    return h('img', { class: cls || P + 'icon', src: DIR + kind + '.png', alt: STAMPS[kind].alt, width: STAMPS[kind].w, height: STAMPS[kind].h, draggable: 'false' });
  }

  /* Das Blatt Papier mit den Abdrücken; order = Stempel von unten (zuerst) nach oben (zuletzt) */
  function sheet(order, label) {
    var s = '<svg class="' + P + 'sheet" viewBox="0 0 1800 660" role="img" aria-label="' + label + '">' +
      '<path d="' + PAPER + '" transform="translate(18 20)" fill="#cfcfcf"/><path d="' + PAPER + '" fill="#fff" stroke="#000" stroke-width="7" stroke-linejoin="round"/>';
    order.forEach(function (k) {
      var d = STAMPS[k];
      PRINTS[k].forEach(function (p) {
        var w = d.w * p.sc, hh = d.h * p.sc;
        s += '<image href="' + DIR + k + '.png" x="' + (-w / 2).toFixed(1) + '" y="' + (-hh / 2).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + hh.toFixed(1) +
          '" transform="translate(' + p.x + ' ' + p.y + ') rotate(' + p.rot + ')"/>';
      });
    });
    return s + '</svg>';
  }
  var TARGET_LABEL = 'Mikas Bild: Links eine einzelne Sonne. Daneben ein Blatt, darüber eine Blume, darüber ein Haus. Weiter rechts eine Sonne, darüber ein Blatt. Ganz rechts eine Blume, darüber ein Haus.';

  var el, api, radios, selected, locked, mark;
  var tryOrder, tryBtns, trySheetEl, tryMsgEl, tryChipsEl, tryBackBtn, tryResetBtn;

  function reset() { selected = null; mark = null; }

  function refresh() {
    radios.forEach(function (btn, i) {
      var on = selected === i, ok = i === RIGHT;
      btn.setAttribute('aria-checked', String(on));
      btn.tabIndex = (selected === null ? i === 0 : on) ? 0 : -1;
      btn.setAttribute('aria-disabled', locked ? 'true' : 'false');
      btn.classList.toggle('selected', on);
      btn.classList.toggle('right', on && mark !== null && ok);
      btn.classList.toggle('wrong', on && mark === 'check' && !ok);
      var m = btn.querySelector('.' + P + 'mark');
      if (m) m.remove();
      if (on && mark !== null) btn.appendChild(h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
    });
  }
  function choose(i, focus) {
    if (locked) return;
    selected = i;
    refresh();
    if (focus) radios[i].focus();
    api.changed();
  }
  function onKey(e) {
    var k = e.key, i = radios.indexOf(e.currentTarget), to = null;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % radios.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + radios.length - 1) % radios.length;
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }

  /* ---------- Ausprobieren: Stempel der Reihe nach nehmen ---------- */
  function drawTry() {
    var n = tryOrder.length;
    trySheetEl.innerHTML = sheet(tryOrder, n ? 'Dein Bild nach ' + n + ' Stempeln: ' + tryOrder.map(function (k) { return STAMPS[k].name; }).join(', dann ') : 'Ein leeres Blatt');
    tryBtns.forEach(function (b) {
      var used = tryOrder.indexOf(b.dataset.stamp) >= 0;
      b.disabled = used;
      b.classList.toggle('used', used);
    });
    tryChipsEl.textContent = n ? 'Reihenfolge: ' + tryOrder.map(function (k, i) { return (i + 1) + '. ' + STAMPS[k].name; }).join(' → ') : 'Noch kein Stempel genommen.';
    var same = n === 4 && tryOrder.every(function (k, i) { return k === ORDER[i]; });
    if (n < 4) tryMsgEl.textContent = n ? 'Jeder Stempel wird genau einmal genommen und stempelt zweimal.' : 'Nimm die Stempel der Reihe nach. Du siehst sofort, wie das Bild dann aussieht.';
    else tryMsgEl.textContent = same ? 'Dieses Bild sieht genauso aus wie Mikas Bild.' : 'Dieses Bild sieht anders aus als Mikas Bild. Vergleiche, welche Figur wo oben liegt.';
    tryBackBtn.disabled = !n;
    tryResetBtn.disabled = !n;
  }
  function takeStamp(k) {
    if (tryOrder.indexOf(k) >= 0) return;
    tryOrder.push(k);
    drawTry();
  }

  Biber.register({
    id: 'stempelbild21',
    story:
      '<p>Mika hat vier verschiedene Stempel. Er nimmt jeden Stempel einmal in die Hand und stempelt damit zweimal. So entsteht dieses Bild:</p>',
    question: 'Welchen Stempel hat Mika zuerst genommen?',
    howto: 'Schau genau hin, welche Figuren über anderen liegen, und tippe auf den richtigen Stempel. Unten kannst du selbst stempeln.',
    explanation: function () {
      var chain = ORDER.map(function (k) { return img(k, P + 'mini').outerHTML; }).join('<span class="' + P + 'arrow" aria-hidden="true">→</span>');
      return '<p>Eine Figur, die über einer anderen liegt, kann nicht mit dem ersten Stempel gemacht sein. Im Bild liegt das <strong>Haus</strong> über der Blume, das <strong>Blatt</strong> über der Sonne und die <strong>Blume</strong> über dem Blatt. Haus, Blatt und Blume scheiden also aus.</p>' +
        '<p>Nur die <strong>Sonne</strong> liegt über keiner anderen Figur: Mika hat zuerst die Sonne genommen (Antwort C). Danach kamen das Blatt, die Blume und zuletzt das Haus.</p>' +
        '<p class="' + P + 'chain" role="img" aria-label="Reihenfolge: Sonne, Blatt, Blume, Haus">' + chain + '</p>' +
        '<p>Aus „liegt über“-Beziehungen eine Reihenfolge zu bestimmen, ist ein Grundgedanke beim Ordnen und Sortieren: Man sucht immer wieder das, was nirgends „unten drunter“ muss, und stellt es an den Anfang.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset(); tryOrder = [];
      var target = h('div', { class: P + 'sheetbox' });
      target.innerHTML = sheet(ORDER, TARGET_LABEL);
      radios = OPTIONS.map(function (o, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': o.key,
          'aria-label': 'Antwort ' + o.key + ': ' + STAMPS[o.stamp].name,
          onclick: function () { choose(i, false); }, onkeydown: onKey
        }, h('span', { class: P + 'key', 'aria-hidden': 'true' }, o.key + ')'), img(o.stamp));
        btn.querySelector('img').setAttribute('alt', '');
        return btn;
      });
      trySheetEl = h('div', { class: P + 'sheetbox' });
      tryMsgEl = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      tryChipsEl = h('p', { class: P + 'order' });
      tryBtns = Object.keys(STAMPS).map(function (k) {
        var b = h('button', { type: 'button', class: P + 'stamp', 'data-stamp': k, 'aria-label': 'Stempel ' + STAMPS[k].name + ' nehmen', onclick: function () { takeStamp(k); } },
          img(k), h('span', null, STAMPS[k].name));
        b.querySelector('img').setAttribute('alt', '');
        return b;
      });
      tryBackBtn = h('button', { type: 'button', class: 'btn ghost ' + P + 'btn', onclick: function () { tryOrder.pop(); drawTry(); } }, 'Letzten Stempel zurück');
      tryResetBtn = h('button', { type: 'button', class: 'btn ghost ' + P + 'btn', onclick: function () { tryOrder = []; drawTry(); } }, 'Neues Blatt');
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { 'aria-label': 'Mikas Bild' }, h('h3', null, 'Mikas Bild'), target),
        h('section', { 'aria-label': 'Antworten' }, h('h3', null, 'Der erste Stempel war …'),
          h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Antworten' }, radios)),
        h('section', { class: P + 'try', 'aria-label': 'Zum Ausprobieren: selbst stempeln' },
          h('h3', null, 'Zum Ausprobieren: selbst stempeln'),
          h('div', { class: P + 'stamps' }, tryBtns), tryChipsEl, trySheetEl, tryMsgEl,
          h('div', { class: P + 'btns' }, tryBackBtn, tryResetBtn))));
      refresh();
      drawTry();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () {
      return { correct: selected === RIGHT, answer: { choice: OPTIONS[selected].key } };
    },
    setAnswer: function (ans) {
      var i = OPTIONS.map(function (o) { return o.key; }).indexOf(ans && ans.choice);
      selected = i >= 0 ? i : null;
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      refresh();
    },
    reset: function () { reset(); tryOrder = []; refresh(); drawTry(); },
    showSolution: function () { selected = RIGHT; mark = 'solution'; locked = true; refresh(); }
  });
})();
