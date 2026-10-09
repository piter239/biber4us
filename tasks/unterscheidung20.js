/* Aufgabe Unterscheidung (Biber 2020; Klasse 7-8 schwer, 9-10 mittel, 11-13 leicht): Pixel-Bilder und ihre "Unterscheidungskarten" (Heat Maps) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-unterscheidung20-';

  /* Die fünf Bilder (3x3, zeilenweise, 1 = schwarz) */
  var IMGS = {
    I: '010010010',
    T: '111010010',
    O: '111101111',
    C: '111100111',
    L: '100100111'
  };
  var ALL = ['I', 'T', 'O', 'C', 'L'];
  var OPTIONS = [{ key: 'A', img: 'T' }, { key: 'B', img: 'O' }, { key: 'C', img: 'C' }, { key: 'D', img: 'L' }];
  var RIGHT = 'B';   /* im Heft bestätigt und per Skript geprüft: nur die Karte von O stimmt mit der gezeigten Karte überein */
  var TARGET = [3, 3, 2, 2, 2, 0, 2, 4, 2];   /* gezeigte Karte, zeilenweise (Farbe -> Anzahl gleicher Pixel bei den anderen Bildern) */
  var COLNAME = ['weiß', 'gelb', 'grün', 'blau', 'schwarz'];

  function pix(k, p) { return IMGS[k].charAt(p) === '1'; }
  /* Unterscheidungskarte: für jedes Pixel, bei wie vielen der anderen vier Bilder das Pixel gleich ist */
  function mapOf(k) {
    var out = [], p;
    for (p = 0; p < 9; p++) {
      var n = 0;
      ALL.forEach(function (o) { if (o !== k && IMGS[o].charAt(p) === IMGS[k].charAt(p)) n++; });
      out.push(n);
    }
    return out;
  }
  function posName(p) { return 'Reihe ' + (Math.floor(p / 3) + 1) + ', Spalte ' + (p % 3 + 1); }

  /* ---------- Bausteine ---------- */
  function imgGrid(k, label, onCell) {
    var g = h('div', { class: P + 'grid ' + P + 'img', role: onCell ? 'group' : 'img', 'aria-label': label });
    var cells = [], p;
    for (p = 0; p < 9; p++) {
      (function (pp) {
        var attrs = { class: P + 'cell ' + (pix(k, pp) ? P + 'blk' : P + 'wht') };
        var c;
        if (onCell) {
          attrs.type = 'button';
          attrs['aria-label'] = 'Bild ' + k + ', ' + posName(pp) + ': ' + (pix(k, pp) ? 'schwarz' : 'weiß');
          attrs.onclick = function () { onCell(pp); };
          c = h('button', attrs);
        } else c = h('span', attrs);
        cells.push(c); g.appendChild(c);
      })(p);
    }
    g._cells = cells;
    return g;
  }
  function mapGrid(vals, label) {
    var g = h('div', { class: P + 'grid ' + P + 'map', role: 'img', 'aria-label': label });
    vals.forEach(function (v) { g.appendChild(h('span', { class: P + 'cell ' + P + 'col' + v })); });
    return g;
  }
  function mapLabel(vals) {
    var rows = [0, 1, 2].map(function (r) { return COLNAME[vals[r * 3]] + ', ' + COLNAME[vals[r * 3 + 1]] + ', ' + COLNAME[vals[r * 3 + 2]]; });
    return 'Unterscheidungskarte. Reihe 1: ' + rows[0] + '. Reihe 2: ' + rows[1] + '. Reihe 3: ' + rows[2] + '.';
  }
  function imgLabel(k) {
    var rows = [0, 1, 2].map(function (r) { return [0, 1, 2].map(function (c) { return pix(k, r * 3 + c) ? 'schwarz' : 'weiß'; }).join(', '); });
    return 'Pixel-Bild. Reihe 1: ' + rows[0] + '. Reihe 2: ' + rows[1] + '. Reihe 3: ' + rows[2] + '.';
  }

  var el, api, radios, selected, locked, mark, five, inspected, infoEl, mapSlots;

  function reset() { selected = null; mark = null; inspected = null; }

  function refreshInspect() {
    ALL.forEach(function (k, i) {
      five[i]._cells.forEach(function (c, p) { c.classList.toggle(P + 'hl', inspected === p); });
    });
    if (inspected === null) { infoEl.textContent = 'Tippe ein Pixel an. Dann siehst du, in welchen Bildern es an dieser Position schwarz oder weiß ist.'; return; }
    var blk = ALL.filter(function (k) { return pix(k, inspected); }), wht = ALL.filter(function (k) { return !pix(k, inspected); });
    infoEl.textContent = posName(inspected) + ': schwarz bei ' + (blk.length ? blk.join(', ') : 'keinem Bild') + '; weiß bei ' + (wht.length ? wht.join(', ') : 'keinem Bild') + '.';
  }
  function refresh() {
    radios.forEach(function (btn, i) {
      var o = OPTIONS[i], on = selected === o.key, ok = o.key === RIGHT;
      btn.setAttribute('aria-checked', String(on));
      btn.tabIndex = (selected === null ? i === 0 : on) ? 0 : -1;
      btn.setAttribute('aria-disabled', locked ? 'true' : 'false');
      btn.classList.toggle('selected', on);
      btn.classList.toggle('right', on && mark !== null && ok);
      btn.classList.toggle('wrong', on && mark === 'check' && !ok);
      var m = btn.querySelector('.' + P + 'mark');
      if (m) m.remove();
      if (on && mark !== null) btn.appendChild(h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
      mapSlots[i].hidden = !locked;
    });
    refreshInspect();
  }
  function choose(i, focus) {
    if (locked) return;
    selected = OPTIONS[i].key;
    refresh();
    if (focus) radios[i].focus();
    api.changed();
  }
  function onKey(e) {
    var i = radios.indexOf(e.currentTarget), to = null, k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % radios.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + radios.length - 1) % radios.length;
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }

  function legend() {
    var rows = [['Keines (0)', 0], ['1', 1], ['2', 2], ['3', 3], ['Alle (4)', 4]];
    return h('table', { class: P + 'legend' },
      h('caption', null, 'Farben der Unterscheidungskarte'),
      h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Farbe'), h('th', { scope: 'col' }, 'So viele der anderen Bilder haben an dieser Position das gleiche Pixel:'))),
      h('tbody', null, rows.map(function (r) {
        return h('tr', null, h('td', null, h('span', { class: P + 'sw ' + P + 'col' + r[1], role: 'img', 'aria-label': COLNAME[r[1]] })), h('td', null, r[0]));
      })));
  }

  Biber.register({
    id: 'unterscheidung20',
    story:
      '<p>Eine Maschine erkennt genau diese Pixel-Bilder, und zwar als Buchstaben I, T, O, C und L.</p>' +
      '<p>Dabei entsteht für jedes der fünf Bilder eine <strong>Unterscheidungskarte</strong>. Sie zeigt für jedes Bild-Pixel an dessen Position eine Farbe. Die Farbe zeigt, wie viele der anderen Bilder an dieser Position das gleiche Pixel haben. Je heller die Farbe, desto wichtiger ist dieses Pixel für die Unterscheidung.</p>',
    question: 'Welches Pixel-Bild hat die gezeigte Unterscheidungskarte?',
    howto: 'Tippe auf die Pixel der fünf Bilder, um dieselbe Position in allen Bildern zu vergleichen. Wähle dann unten eine Antwort.',
    explanation: function () {
      return '<p>Die Karte zeigt in Reihe 2, Spalte 3 die Farbe <strong>Weiß</strong>. Das heißt: An dieser Position hat <em>keines</em> der anderen Bilder das gleiche Pixel. Das Bild unterscheidet sich dort von allen anderen. Bei <strong>B</strong> (dem Buchstaben O) ist dieses Pixel schwarz, bei allen anderen Bildern weiß. Nur B passt also. Die Karten der anderen Bilder sehen unter den Antworten anders aus.</p>' +
        '<p>Solche Farbkarten heißen <strong>Heat Maps</strong>. Man kennt sie von Temperaturkarten der Wettervorhersage. Auch in künstlichen neuronalen Netzen zeigen Heat Maps, wie wichtig einzelne Einheiten für die Erkennung eines Objekts sind.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      five = ALL.map(function (k) { return imgGrid(k, 'Bild ' + k, function (p) { inspected = inspected === p ? null : p; refreshInspect(); }); });
      infoEl = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      var fiveRow = h('div', { class: P + 'five' }, ALL.map(function (k, i) {
        return h('figure', { class: P + 'fig' }, five[i], h('figcaption', null, k));
      }));
      var example = h('div', { class: P + 'example' },
        h('figure', { class: P + 'fig' }, imgGrid('I', imgLabel('I')), h('figcaption', null, 'Bild I')),
        h('span', { class: P + 'arrow', 'aria-hidden': 'true' }, '→'),
        h('figure', { class: P + 'fig' }, mapGrid(mapOf('I'), mapLabel(mapOf('I'))), h('figcaption', null, 'Karte von I')));
      var target = h('figure', { class: P + 'fig ' + P + 'targetfig' }, mapGrid(TARGET, mapLabel(TARGET)), h('figcaption', null, 'Gezeigte Karte'));
      mapSlots = [];
      radios = OPTIONS.map(function (o, i) {
        var slot = h('span', { class: P + 'slot', hidden: true }, mapGrid(mapOf(o.img), 'Karte von Bild ' + o.key + '. ' + mapLabel(mapOf(o.img))), h('small', null, 'seine Karte'));
        mapSlots.push(slot);
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': o.key,
          'aria-label': 'Antwort ' + o.key + ': ' + imgLabel(o.img),
          onclick: function () { choose(i, false); }, onkeydown: onKey
        });
        btn.appendChild(h('span', { class: P + 'key', 'aria-hidden': 'true' }, o.key + ')'));
        btn.appendChild(imgGrid(o.img, imgLabel(o.img)));
        btn.appendChild(slot);
        return btn;
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { 'aria-label': 'Die fünf Bilder' }, h('h3', null, 'Die fünf Bilder'), fiveRow, infoEl),
        h('section', { 'aria-label': 'Farben' }, h('h3', null, 'Farben der Karte'), legend()),
        h('section', { 'aria-label': 'Ein Beispiel' }, h('h3', null, 'Ein Beispiel'), example),
        h('section', { 'aria-label': 'Frage' }, h('h3', null, 'Welches Bild hat diese Karte?'), target),
        h('section', { class: P + 'answers', 'aria-label': 'Antworten' }, h('h3', null, 'Antwort'),
          h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Antworten' }, radios))));
      refresh();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () { return { correct: selected === RIGHT, answer: { choice: selected } }; },
    setAnswer: function (ans) {
      var ok = ans && OPTIONS.some(function (o) { return o.key === ans.choice; });
      selected = ok ? ans.choice : null;
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      refresh();
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () { selected = RIGHT; mark = 'solution'; locked = true; refresh(); }
  });
})();
