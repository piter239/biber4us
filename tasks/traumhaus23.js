/* Aufgabe Karlas Traumhaus (Heft 2023, 3-4 schwer, 5-6 mittel, 7-8 einfach): Modellierung, Geodaten, Ebenen */
(function () {
  'use strict';
  var h = Biber.h, S = Biber.svg;
  var P = 't-traumhaus23-';

  /* Geometrie der drei Karten (Koordinaten 0..135, aus dem Heft übernommen) */
  var FOREST = ["M 0 0 L 0 41.4 C 5.8 40 12.5 40.4 18.4 40.6 C 31.6 40.9 44.7 42.7 57.7 44.6 C 76.6 47.4 96 51.3 115.1 50.4 C 119.3 50.3 123.6 49.9 127.7 49.2 C 130.2 48.8 132.6 48 135 47.7 L 135 0 Z M 0 0", "M 0 135 L 135 135 L 135 87.6 C 132.6 88.3 130.3 89.3 127.9 89.9 C 122.3 91.4 116.5 92.2 110.8 92.6 C 85.6 94.4 60.8 88.7 35.7 87.6 C 26.7 87.2 17.5 86.7 8.6 88.4 C 6.4 88.8 4.3 89.3 2.3 90 C 1.7 90.2 0.6 90.3 0.2 90.8 C -0.3 91.5 0 93.2 0 93.9 Z M 0 135"];
  var RIVER = "M 17.6 0 C 18.1 2.8 18.4 5.6 19 8.4 C 20.6 15.4 23.2 22 26.6 28.3 C 34.3 42.6 45.8 54.5 53.7 68.7 C 62.1 83.8 65.9 100.4 65.5 117.6 C 65.4 123.3 65.4 129.4 64 135 L 71 135 C 72.2 125.8 72.1 116.3 73 107 C 75.1 84.5 77.2 61.8 83.1 39.8 C 85.7 30.5 88.9 21.2 93.3 12.6 C 94.7 9.9 96.2 7.3 97.8 4.7 C 98.8 3.2 100.1 1.7 100.7 0 L 95.7 0 C 95.1 0 94.2 -0.2 93.7 0.2 C 92.6 0.9 91.8 3.2 91.2 4.4 C 89.3 7.8 87.5 11.2 85.6 14.6 C 81 22.7 77.2 31.6 75 40.7 C 73.2 48.5 72.5 56.5 71.5 64.4 C 70.8 70.4 70.1 76.7 69.9 82.8 C 69.8 84.3 69.6 85.8 69.6 87.3 C 69.6 87.7 69.5 88.4 69 88.5 C 68.5 88.6 68.6 87.7 68.7 87.5 C 68.8 86 68.2 84.4 67.8 83 C 66.3 76.9 63.7 71.1 60.9 65.5 C 52.3 48.2 39.9 33.2 30.4 16.5 C 28.2 12.8 26.1 9.1 24.5 5.2 C 24 4 23.6 2.8 23.2 1.6 C 23.1 1.2 23.1 0.5 22.7 0.2 C 21.8 -0.5 18.8 0 17.6 0";
  /* Häuser (Mittelpunkte) und Namen für Screenreader */
  var HOUSES = [
    { x: 10.75, y: 7.52, name: 'oben links' },
    { x: 45.27, y: 68.88, name: 'Mitte links' },
    { x: 88.77, y: 69.69, name: 'Mitte rechts, linkes der beiden eng beieinander liegenden Häuser' },
    { x: 100.65, y: 71.55, name: 'Mitte rechts, rechtes der beiden eng beieinander liegenden Häuser' },
    { x: 118.45, y: 122.41, name: 'unten rechts' },
    { x: 11.28, y: 127.35, name: 'unten links' }
  ];
  var ANSWER = 0;   /* Heft: das Haus oben links auf der Hauskarte */
  var SIZE = 135;

  function compass() {
    var g = S('g', { class: P + 'compass', 'aria-hidden': 'true' });
    g.appendChild(S('path', { d: 'M113 11V30M104 20.5H122' }));
    g.appendChild(S('path', { class: P + 'tip', d: 'M113 9.5L110.6 14H115.4Z' }));
    [['N', 113, 8], ['S', 113, 38], ['W', 100, 23.5], ['O', 126, 23.5]].forEach(function (t) {
      g.appendChild(S('text', { x: t[1], y: t[2], 'text-anchor': 'middle' }, t[0]));
    });
    return g;
  }
  function layerForest() { var g = S('g', { class: P + 'forest' }); FOREST.forEach(function (d) { g.appendChild(S('path', { d: d })); }); return g; }
  function layerRiver() { return S('g', { class: P + 'river' }, S('path', { d: RIVER })); }
  function mapSvg(cls, label) {
    return S('svg', { class: P + 'map ' + cls, viewBox: '0 0 ' + SIZE + ' ' + SIZE, role: 'img', 'aria-label': label, focusable: 'false' });
  }
  function houseSquare(hs, cls) {
    return S('rect', { class: P + 'sq ' + (cls || ''), x: hs.x - 4.5, y: hs.y - 4.5, width: 9, height: 9 });
  }

  /* ---------- Zustand ---------- */
  var el, api, locked, sel, mode, stack, forestL, riverL, houseEls, ringEls, btnForest, btnRiver, statusEl, showSol;

  function setLayer(btn, layer, on) {
    layer.style.display = on ? '' : 'none';
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  function render() {
    HOUSES.forEach(function (hs, i) {
      var ring = ringEls[i], g = houseEls[i];
      var isSel = sel === i, isAns = i === ANSWER;
      var state = '';
      if (mode && isSel) state = isAns ? 'ok' : 'bad';
      else if (mode && isAns && (mode === 'bad' || mode === 'sol')) state = 'ok';
      ring.setAttribute('class', P + 'ring' + (isSel && !mode ? ' sel' : '') + (state ? ' ' + state : '') + (isSel || state ? ' show' : ''));
      g.setAttribute('aria-pressed', isSel ? 'true' : 'false');
      g.classList.toggle('locked', !!locked);
    });
  }
  function pick(i) {
    if (locked) return;
    sel = sel === i ? null : i;
    render();
    statusEl.textContent = sel === null ? 'Auswahl aufgehoben.' : 'Haus ' + (i + 1) + ' (' + HOUSES[i].name + ') ausgewählt.';
    api.changed();
  }
  function toggle(btn, layer, name) {
    var on = !btn.classList.contains('on');
    setLayer(btn, layer, on);
    statusEl.textContent = name + (on ? ' liegt jetzt auf der Karte.' : ' ist ausgeblendet.');
  }

  Biber.register({
    id: 'traumhaus23',
    story: '<p>Karla hat drei Karten, die alle genau das gleiche Gebiet zeigen. Eine Karte zeigt die Wälder, eine die Flüsse und eine die Häuser in diesem Gebiet. ' +
      'Karlas Traumhaus liegt <b>im Wald</b> und <b>in der Nähe eines Flusses</b>.</p>',
    question: 'Welches ist Karlas Traumhaus?',
    howto: 'Die drei Karten stehen oben. In der großen Karte darunter kannst du sie übereinanderlegen. Tippe dort auf das Haus, das du für Karlas Traumhaus hältst.',
    explanation: function () {
      return '<p>Das Haus <b>oben links</b> ist Karlas Traumhaus. Man muss die Informationen aller drei Karten zusammen auswerten: Das Haus muss in einem Waldgebiet liegen und in der Nähe eines Flusses. ' +
        'Die drei Häuser in der Mitte stehen auf der freien Fläche zwischen den Wäldern. Die beiden Häuser unten liegen zwar im Wald, aber weit weg vom Fluss. Nur das Haus oben links erfüllt beides. Mit übereinandergelegten Karten sieht man das sofort.</p>' +
        '<p><b>Informatik:</b> Ein Geoinformationssystem (GIS) führt viele räumliche Informationen wie Wälder, Straßen, Grenzen oder Überschwemmungsgebiete auf einer Karte zusammen, in getrennten Ebenen, die man ein- und ausblenden kann. ' +
        'Das nutzt man zum Beispiel für Evakuierungspläne. Auch aus Grafikprogrammen kennt man Ebenen. Dabei ist wichtig, welche Ebene oben liegt: Die Häuser müssen oben liegen, damit die Waldflächen sie nicht verdecken.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; sel = null; mode = null;

      /* drei Einzelkarten */
      function mini(title, build) {
        var svg = mapSvg(P + 'mini', title);
        build(svg);
        svg.appendChild(compass());
        return h('figure', { class: P + 'fig' }, svg, h('figcaption', null, title));
      }
      var minis = h('div', { class: P + 'minis' },
        mini('Waldkarte', function (s) { s.appendChild(layerForest()); }),
        mini('Flusskarte', function (s) { s.appendChild(layerRiver()); }),
        mini('Hauskarte', function (s) { HOUSES.forEach(function (hs) { s.appendChild(houseSquare(hs)); }); }));

      /* übereinandergelegte Karte */
      stack = mapSvg(P + 'stack', 'Übereinandergelegte Karten mit sechs Häusern. Wähle ein Haus aus.');
      stack.removeAttribute('role');
      forestL = layerForest(); riverL = layerRiver();
      stack.appendChild(forestL); stack.appendChild(riverL);
      houseEls = []; ringEls = [];
      HOUSES.forEach(function (hs, i) {
        var g = S('g', { class: P + 'house', role: 'button', tabindex: '0', 'aria-pressed': 'false', 'aria-label': 'Haus ' + (i + 1) + ': ' + hs.name });
        var ring = S('rect', { class: P + 'ring', x: hs.x - 8.5, y: hs.y - 8.5, width: 17, height: 17, rx: 2.5 });
        g.appendChild(ring);
        g.appendChild(S('circle', { class: P + 'hit', cx: hs.x, cy: hs.y, r: 10 }));
        g.appendChild(houseSquare(hs));
        g.addEventListener('click', function () { pick(i); });
        g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(i); } });
        stack.appendChild(g);
        houseEls.push(g); ringEls.push(ring);
      });
      stack.appendChild(compass());

      btnForest = h('button', { type: 'button', class: P + 'tog', 'aria-pressed': 'false', onclick: function () { toggle(btnForest, forestL, 'Die Waldkarte'); } }, 'Waldkarte darüberlegen');
      btnRiver = h('button', { type: 'button', class: P + 'tog', 'aria-pressed': 'false', onclick: function () { toggle(btnRiver, riverL, 'Die Flusskarte'); } }, 'Flusskarte darüberlegen');
      setLayer(btnForest, forestL, false); setLayer(btnRiver, riverL, false);
      statusEl = h('p', { class: P + 'status', role: 'status', 'aria-live': 'polite' });

      el.replaceChildren(h('div', { class: P + 'box' },
        minis,
        h('div', { class: P + 'work' },
          h('div', { class: P + 'togs', role: 'group', 'aria-label': 'Karten übereinanderlegen' }, btnForest, btnRiver),
          h('div', { class: P + 'stackwrap' }, stack),
          statusEl)));
      render();
    },
    isComplete: function () { return sel !== null; },
    evaluate: function () { return { correct: sel === ANSWER, answer: sel }; },
    setAnswer: function (ans) {
      sel = typeof ans === 'number' && ans >= 0 && ans < HOUSES.length ? ans : null;
      mode = sel === null ? null : (sel === ANSWER ? 'ok' : 'bad');
      render();
    },
    lock: function (on) {
      locked = on;
      mode = on && sel !== null ? (sel === ANSWER ? 'ok' : 'bad') : null;
      if (on && sel !== null) { setLayer(btnForest, forestL, true); setLayer(btnRiver, riverL, true); }
      render();
      statusEl.textContent = on && sel !== null ? (sel === ANSWER ? 'Richtig: Das Haus oben links.' : 'Karlas Traumhaus ist das Haus oben links.') : '';
    },
    reset: function () {
      sel = null; mode = null;
      setLayer(btnForest, forestL, false); setLayer(btnRiver, riverL, false);
      render(); statusEl.textContent = '';
    },
    showSolution: function () {
      sel = ANSWER; mode = 'sol'; locked = true;
      setLayer(btnForest, forestL, true); setLayer(btnRiver, riverL, true);
      render(); statusEl.textContent = 'Karlas Traumhaus ist das Haus oben links.';
    }
  });
})();
