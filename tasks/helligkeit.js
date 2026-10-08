/* Aufgabe Helligkeitskarte (Convolutional NN): Welches Bild hat als einziges eine andere Helligkeitskarte? */
(function () {
  'use strict';
  var h = Biber.h;

  /* ---- Pixel und Helligkeit ---- */
  var WHITE = '#ffffff';
  var LIGHT = '#ddddee', MID = '#9f9fd3', DARK = '#8080bc';

  // wahrgenommene Helligkeit (relative Luminanz nach sRGB)
  function lum(hex) {
    var c = [1, 3, 5].map(function (i) {
      var v = parseInt(hex.substr(i, 2), 16) / 255;
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  // 1: heller als der rechte Nachbar, 0: gleich hell, -1: dunkler als der rechte Nachbar
  function cmp(a, b) {
    if (a === b) return 0;
    var d = lum(a) - lum(b);
    return Math.abs(d) < 1e-9 ? 0 : (d > 0 ? 1 : -1);
  }
  // Helligkeitskarte eines Bildes (Zeilen von Farben); rechts liegt der weiße Rahmen
  function brightnessMap(rows) {
    return rows.map(function (row) {
      return row.map(function (c, i) { return cmp(c, i + 1 < row.length ? row[i + 1] : WHITE); });
    });
  }
  function mapKey(m) { return JSON.stringify(m); }

  /* ---- Bilder wie im Heft ---- */
  var EXAMPLE = [
    [WHITE, WHITE, WHITE, WHITE],
    [WHITE, LIGHT, DARK, WHITE],
    [WHITE, DARK, DARK, WHITE],
    [WHITE, WHITE, WHITE, WHITE]
  ];
  var OPTIONS = [
    { key: 'A', alt: 'Oben eine Zeile hellblau, darunter zwei Zeilen kräftig blau',
      px: ([['#b5d6ff', '#b5d6ff', '#b5d6ff'], ['#2779e4', '#2779e4', '#2779e4'], ['#2779e4', '#2779e4', '#2779e4']]) },
    { key: 'B', alt: 'Links zwei Spalten dunkelviolett, rechts eine Spalte hellrosa',
      px: ([['#823eac', '#823eac', '#e6bdff'], ['#823eac', '#823eac', '#e6bdff'], ['#823eac', '#823eac', '#e6bdff']]) },
    { key: 'C', alt: 'Alle neun Pixel rot',
      px: ([['#ff0505', '#ff0505', '#ff0505'], ['#ff0505', '#ff0505', '#ff0505'], ['#ff0505', '#ff0505', '#ff0505']]) },
    { key: 'D', alt: 'Oben und unten eine Zeile dunkelgrün, in der Mitte eine Zeile hellgrün',
      px: ([['#217157', '#217157', '#217157'], ['#16f1ab', '#16f1ab', '#16f1ab'], ['#217157', '#217157', '#217157']]) }
  ];
  OPTIONS.forEach(function (o) { o.map = brightnessMap(o.px); });

  // Die richtige Antwort ergibt sich aus den Karten: das Bild, dessen Karte als einzige abweicht
  var RIGHT = (function () {
    var cnt = {};
    OPTIONS.forEach(function (o) { var k = mapKey(o.map); cnt[k] = (cnt[k] || 0) + 1; });
    var idx = -1;
    OPTIONS.forEach(function (o, i) { if (cnt[mapKey(o.map)] === 1) idx = i; });
    return idx;
  })();

  /* ---- Darstellung ---- */
  function num(v) { return v < 0 ? '−1' : String(v); }
  function numWord(v) { return v < 0 ? 'minus eins' : (v === 0 ? 'null' : 'eins'); }

  function gridSvg(rows, cls, label) {
    var n = rows.length, m = rows[0].length, s = 20, out = '';
    rows.forEach(function (row, r) {
      row.forEach(function (c, i) {
        out += '<rect x="' + (i * s) + '" y="' + (r * s) + '" width="' + s + '" height="' + s + '" fill="' + c + '"/>';
      });
    });
    return '<svg class="' + cls + '" viewBox="-1 -1 ' + (m * s + 2) + ' ' + (n * s + 2) + '"' +
      (label ? ' role="img" aria-label="' + label + '"' : ' aria-hidden="true"') + ' focusable="false">' + out + '</svg>';
  }

  function mapTable(map, cls) {
    return '<table class="hk-map ' + (cls || '') + '"><tbody>' + map.map(function (row) {
      return '<tr>' + row.map(function (v) { return '<td><span aria-label="' + numWord(v) + '">' + num(v) + '</span></td>'; }).join('') + '</tr>';
    }).join('') + '</tbody></table>';
  }

  function rule(left, right, value, text) {
    return '<tr><td class="hk-rule-pic"><span class="hk-pair" role="img" aria-label="Zwei Pixel nebeneinander, Wert ' + numWord(value) + '">' +
      '<span class="hk-px" style="background:' + left + '">' + num(value) + '</span><span class="hk-px" style="background:' + right + '"></span></span></td>' +
      '<td><strong>' + num(value) + ',</strong> ' + text + '</td></tr>';
  }

  function storyHtml() {
    // Karte des Beispiels: nur die vier echten Pixel, rechts je der Nachbar aus dem Rahmen
    var exMap = [0, 1].map(function (r) {
      return [1, 2].map(function (c) { return cmp(EXAMPLE[r + 1][c], EXAMPLE[r + 1][c + 1]); });
    });
    return '<p>Digitale Bilder bestehen häufig aus Pixeln. Sandra erstellt Helligkeitskarten für solche Pixelbilder. ' +
      'Dazu legt sie um ein Bild zuerst einen Rahmen aus zusätzlichen weißen Pixeln. ' +
      'Dann bestimmt sie für jedes Pixel des Bildes einen Helligkeitswert, und zwar:</p>' +
      '<table class="hk-rules"><tbody>' +
      rule(LIGHT, MID, 1, 'falls das Pixel heller ist als sein rechtes Nachbarpixel.') +
      rule(MID, MID, 0, 'falls das Pixel gleich hell ist wie sein rechtes Nachbarpixel.') +
      rule(MID, LIGHT, -1, 'falls das Pixel dunkler ist als sein rechtes Nachbarpixel.') +
      '</tbody></table>' +
      '<p>Hier siehst du ein Bild aus vier Pixeln (plus die zusätzlichen weißen Pixel) und seine Helligkeitskarte.</p>' +
      '<div class="hk-example">' +
      gridSvg(EXAMPLE, 'hk-ex-img', 'Bild aus vier Pixeln in einem weißen Rahmen: oben links hellviolett, die drei übrigen Pixel dunkler violett') +
      mapTable(exMap, 'hk-map-ex') +
      '</div>' +
      '<p>Unten siehst du vier Bilder mit je neun Pixeln. Genau drei davon haben die gleiche Helligkeitskarte.</p>';
  }

  /* ---- Zustand ---- */
  var el, api, radios, selected, locked, mark;

  function reset() { selected = null; mark = null; }

  function choose(i, focus) {
    if (locked) return;
    selected = i;
    refresh();
    if (focus) radios[i].focus();
    api.changed();
  }

  function refresh() {
    radios.forEach(function (btn, i) {
      var on = selected === i;
      btn.setAttribute('aria-checked', String(on));
      btn.tabIndex = (selected === null ? i === 0 : on) ? 0 : -1;
      btn.setAttribute('aria-disabled', locked ? 'true' : 'false');
      btn.classList.toggle('selected', on);
      var ok = i === RIGHT;
      btn.classList.toggle('right', on && mark !== null && ok);
      btn.classList.toggle('wrong', on && mark === 'check' && !ok);
      var m = btn.querySelector('.hk-mark');
      if (m) m.remove();
      if (on && mark !== null) btn.appendChild(h('span', { class: 'hk-mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
    });
  }

  function onKey(e) {
    var k = e.key, i = radios.indexOf(e.currentTarget), to = null;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % radios.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + radios.length - 1) % radios.length;
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }

  Biber.register({
    id: 'helligkeit',
    story: storyHtml(),
    question: 'Welches der Bilder hat als einziges eine andere Helligkeitskarte?',
    howto: 'Tippe das Bild an, dessen Helligkeitskarte sich von den anderen drei unterscheidet.',
    explanation: function () {
      var cards = OPTIONS.map(function (o, i) {
        return '<figure class="hk-card' + (i === RIGHT ? ' odd' : '') + '"><figcaption>' + o.key + ')</figcaption>' +
          gridSvg(o.px, 'hk-small', null) + mapTable(o.map, 'hk-map-sm') + '</figure>';
      }).join('');
      return '<p>Jedes Pixel wird mit seinem rechten Nachbarn verglichen, das letzte Pixel jeder Zeile mit dem weißen Rahmen. ' +
        'Weiß ist heller als alle Farben der Bilder, deshalb steht ganz rechts immer −1. ' +
        'Bei <strong>A, C und D</strong> ist jede Zeile einfarbig, die Karte ist darum überall <em>0, 0, −1</em>. ' +
        'Bei <strong>B</strong> ist das zweite Pixel dunkler als das hellrosa dritte, die Karte heißt <em>0, −1, −1</em>. ' +
        'Antwort <strong>B</strong> ist also die Ausnahme.</p>' +
        '<div class="hk-cards">' + cards + '</div>' +
        '<p>Die Helligkeitskarte hebt Stellen hervor, an denen sich die Helligkeit ändert (Kanten). Neuronale Netze für Bilder, ' +
        'sogenannte Convolutional Neural Networks, verwenden solche kleinen Rechenvorschriften, die über das ganze Bild geschoben werden, ' +
        'um Kanten und Muster zu finden.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      radios = OPTIONS.map(function (o, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: 'hk-opt', 'data-opt': o.key,
          'aria-label': 'Bild ' + o.key + ': ' + o.alt,
          onclick: function () { choose(i, false); },
          onkeydown: onKey
        });
        btn.innerHTML = '<span class="hk-key" aria-hidden="true">' + o.key + ')</span>' + gridSvg(o.px, 'hk-big', null);
        return btn;
      });
      el.replaceChildren(h('div', { class: 'hk-board', role: 'radiogroup', 'aria-label': 'Bilder A bis D' }, radios));
      refresh();
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
    reset: function () { reset(); refresh(); },
    showSolution: function () { selected = RIGHT; mark = 'solution'; locked = true; refresh(); }
  });
})();
