/* Aufgabe Rasensprenger (Biber 2020; Klasse 3-4 mittel, 5-6 einfach): so wenige Sprenger aufstellen, dass alle Blumen gegossen werden */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-rasensprenger20-';

  var ROWS = 4, COLS = 5;
  /* Blumenfelder (Zeile, Spalte; 0-basiert) wie im Heft. pet = Blütenfarbe, cen = Mitte, small = kleine Zweitblume im Feld */
  var FLOWERS = [
    { r: 0, c: 2, pet: '--c1', cen: '--c2', small: '--c1' },
    { r: 1, c: 0, pet: '--c4', cen: '--c2', small: '--c4' },
    { r: 2, c: 1, pet: '--c5', cen: '--c2', small: null },
    { r: 1, c: 4, pet: '--c3', cen: '--c2', small: null },
    { r: 3, c: 2, pet: '--c2', cen: '--c1', small: '--c1' }
  ];
  /* Im Heft gezeigte Lösung (Zeile 2/Spalte 2 und Zeile 3/Spalte 4); per Skript (alle Platzierungen) als einzige Lösung mit 2 Sprengern bestätigt */
  var SOLUTION = [[1, 1], [2, 3]];

  function flowerAt(r, c) {
    for (var i = 0; i < FLOWERS.length; i++) if (FLOWERS[i].r === r && FLOWERS[i].c === c) return FLOWERS[i];
    return null;
  }
  function near(s, f) { return Math.max(Math.abs(s[0] - f.r), Math.abs(s[1] - f.c)) === 1; }
  function wetFlowers(list) {
    return FLOWERS.filter(function (f) { return list.some(function (s) { return near(s, f); }); });
  }
  /* kleinste Zahl von Sprengern, die alle Blumen gießen (Suche über alle Platzierungen auf leeren Feldern) */
  var MIN = (function () {
    var empty = [], r, c;
    for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) if (!flowerAt(r, c)) empty.push([r, c]);
    function search(n, from, cur) {
      if (cur.length === n) return wetFlowers(cur).length === FLOWERS.length;
      for (var i = from; i < empty.length; i++) {
        cur.push(empty[i]);
        var ok = search(n, i + 1, cur);
        cur.pop();
        if (ok) return true;
      }
      return false;
    }
    for (var n = 1; n <= FLOWERS.length; n++) if (search(n, 0, [])) return n;
    return FLOWERS.length;
  })();

  /* ---------- Zeichnungen (viewBox 0 0 100 100) ---------- */
  function flowerSvg(f) {
    function bloom(cx, cy, s, pet, cen) {
      var out = '', i;
      for (i = 0; i < 6; i++) {
        var a = i * Math.PI / 3 + 0.3;
        out += '<circle cx="' + (cx + Math.cos(a) * 16 * s).toFixed(1) + '" cy="' + (cy + Math.sin(a) * 16 * s).toFixed(1) + '" r="' + (13 * s).toFixed(1) + '" fill="var(' + pet + ')" stroke="var(--ink)" stroke-opacity="0.35" stroke-width="1.5"/>';
      }
      return out + '<circle cx="' + cx + '" cy="' + cy + '" r="' + (9 * s).toFixed(1) + '" fill="var(' + cen + ')" stroke="var(--ink)" stroke-opacity="0.35" stroke-width="1.5"/>';
    }
    return '<svg class="' + P + 'flower" viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
      (f.small ? bloom(27, 25, 0.5, f.small, f.cen) : '') + bloom(f.small ? 58 : 50, f.small ? 58 : 50, f.small ? 1 : 1.15, f.pet, f.cen) + '</svg>';
  }
  var SPRINKLER_SVG = (function () {
    var arrows = '', i;
    for (i = 0; i < 8; i++) {
      var a = i * Math.PI / 4, d = i % 2 ? 78 : 86, s = i % 2 ? 22 : 24;
      var x1 = 50 + Math.cos(a) * s, y1 = 50 + Math.sin(a) * s, x2 = 50 + Math.cos(a) * d, y2 = 50 + Math.sin(a) * d;
      arrows += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '"/>' +
        '<path d="M' + (x2 + Math.cos(a - 2.6) * 9).toFixed(1) + ' ' + (y2 + Math.sin(a - 2.6) * 9).toFixed(1) + ' L' + x2.toFixed(1) + ' ' + y2.toFixed(1) + ' L' + (x2 + Math.cos(a + 2.6) * 9).toFixed(1) + ' ' + (y2 + Math.sin(a + 2.6) * 9).toFixed(1) + '"/>';
    }
    return '<svg class="' + P + 'sprinkler" viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
      '<g class="' + P + 'arrows">' + arrows + '</g>' +
      '<ellipse cx="50" cy="66" rx="19" ry="8" class="' + P + 'sp-base"/>' +
      '<rect x="43" y="40" width="14" height="26" class="' + P + 'sp-body"/>' +
      '<rect x="33" y="33" width="34" height="11" rx="5" class="' + P + 'sp-head"/>' +
      '<circle cx="50" cy="38" r="3" class="' + P + 'sp-dot"/></svg>';
  })();
  var DROP_SVG = '<svg class="' + P + 'drop" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3 C12 3 5 11 5 15.5 A7 7 0 0 0 19 15.5 C19 11 12 3 12 3 Z"/></svg>';

  var el, api, grid, cells, noteEl, countEl, sprinklers, locked, mode, focusRC;

  function reset() { sprinklers = []; mode = null; }
  function has(r, c) { return sprinklers.some(function (s) { return s[0] === r && s[1] === c; }); }
  function isWatered(r, c) { return sprinklers.some(function (s) { return Math.max(Math.abs(s[0] - r), Math.abs(s[1] - c)) === 1; }); }
  function cellLabel(r, c) {
    var f = flowerAt(r, c), t = 'Zeile ' + (r + 1) + ', Spalte ' + (c + 1) + ': ';
    if (f) return t + 'Blume, ' + (isWatered(r, c) ? 'wird gegossen' : 'noch nicht gegossen');
    if (has(r, c)) return t + 'Sprenger' + (locked ? '' : ', antippen zum Entfernen');
    return t + 'leeres Feld' + (locked ? '' : ', antippen, um einen Sprenger aufzustellen');
  }

  function render() {
    var wet = wetFlowers(sprinklers).length;
    cells.forEach(function (btn) {
      var r = +btn.dataset.r, c = +btn.dataset.c;
      var f = flowerAt(r, c), sp = has(r, c), water = isWatered(r, c);
      var cls = P + 'cell';
      if (f) cls += ' ' + P + 'is-flower';
      if (sp) cls += ' ' + P + 'is-sprinkler';
      if (water) cls += ' ' + P + 'watered';
      if (f && !water && mode === 'check') cls += ' ' + P + 'dry';
      if (mode === 'solution' && sp) cls += ' ' + P + 'right';
      btn.className = cls;
      var inner = f ? flowerSvg(f) + (water ? DROP_SVG : '') : (sp ? SPRINKLER_SVG : '');
      if (btn.__inner !== inner) { btn.innerHTML = inner; btn.__inner = inner; }
      btn.setAttribute('aria-label', cellLabel(r, c));
      btn.setAttribute('aria-pressed', f ? 'false' : String(sp));
      btn.setAttribute('aria-disabled', (f || locked) ? 'true' : 'false');
      btn.tabIndex = (r === focusRC[0] && c === focusRC[1]) ? 0 : -1;
    });
    countEl.textContent = 'Sprenger: ' + sprinklers.length + ' · Gegossene Blumen: ' + wet + ' von ' + FLOWERS.length;
    var msg = '';
    if (mode === 'check') {
      if (wet < FLOWERS.length) msg = (FLOWERS.length - wet === 1 ? 'Eine Blume bekommt' : (FLOWERS.length - wet) + ' Blumen bekommen') + ' noch kein Wasser (rot umrandet).';
      else if (sprinklers.length > MIN) msg = 'Alle Blumen werden gegossen, aber es geht mit weniger Sprengern.';
      else msg = 'Alle Blumen werden gegossen, und zwar mit nur ' + MIN + ' Sprengern.';
    } else if (mode === 'solution') msg = 'So reichen ' + MIN + ' Sprenger für alle Blumen.';
    noteEl.textContent = msg;
  }

  function toggle(r, c) {
    if (locked || flowerAt(r, c)) return;
    focusRC = [r, c];
    if (has(r, c)) sprinklers = sprinklers.filter(function (s) { return !(s[0] === r && s[1] === c); });
    else sprinklers.push([r, c]);
    render();
    var wet = wetFlowers(sprinklers).length;
    api.changed(sprinklers.length + ' Sprenger' + ' aufgestellt, ' + wet + ' von ' + FLOWERS.length + ' Blumen gegossen.');
  }
  function onKey(e) {
    var r = +e.currentTarget.dataset.r, c = +e.currentTarget.dataset.c, k = e.key, nr = r, nc = c;
    if (k === 'ArrowRight') nc = Math.min(COLS - 1, c + 1);
    else if (k === 'ArrowLeft') nc = Math.max(0, c - 1);
    else if (k === 'ArrowDown') nr = Math.min(ROWS - 1, r + 1);
    else if (k === 'ArrowUp') nr = Math.max(0, r - 1);
    else return;
    e.preventDefault();
    focusRC = [nr, nc];
    render();
    cells[nr * COLS + nc].focus();
  }

  Biber.register({
    id: 'rasensprenger20',
    story:
      '<p>Unten siehst du Bobs Garten. Der Garten ist in Felder eingeteilt. In einigen Feldern sind Blumen.</p>' +
      '<p>Bob möchte die Blumen mit Rasensprengern gießen. Ein Sprenger kann nur auf ein leeres Feld gestellt werden. Er gießt dann die 8 Felder rundherum.</p>',
    question: 'Stelle Sprenger im Garten auf, die alle Blumen gießen. Benutze so wenige Sprenger wie möglich!',
    howto: 'Tippe auf ein leeres Feld, um dort einen Sprenger aufzustellen. Tippe noch einmal darauf, um ihn wieder wegzunehmen. Mit den Pfeiltasten kannst du dich von Feld zu Feld bewegen.',
    explanation: function () {
      return '<p>Ein Sprenger gießt eine Blume nur, wenn er rechts, links oder schräg neben ihr steht. Ein einzelner Sprenger kann deshalb nicht neben der Blume ganz links und der Blume ganz rechts stehen, denn die beiden sind zu weit voneinander entfernt. Es braucht also mindestens <strong>2 Sprenger</strong>, und mit der Aufstellung <em>Zeile 2, Spalte 2</em> und <em>Zeile 3, Spalte 4</em> reichen sie genau für alle fünf Blumen.</p>' +
        '<p>In der Informatik ist das ein <em>Optimierungsproblem</em>: Alle Blumen sollen gegossen werden, und die Zahl der Sprenger soll möglichst klein sein. Die Blumen werden dabei auf die Sprenger aufgeteilt (<em>Partitionierung</em>). Ähnlich plant man zum Beispiel, wie viele WLAN-Hotspots eine Schule braucht. Bei vielen Feldern ist die beste Aufteilung schwer zu finden. Dann ist man oft schon mit einer fast optimalen Lösung zufrieden.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset(); focusRC = [0, 0];
      cells = [];
      var items = [], r, c;
      for (r = 0; r < ROWS; r++) for (c = 0; c < COLS; c++) {
        (function (rr, cc) {
          var btn = h('button', {
            type: 'button', class: P + 'cell', 'data-r': String(rr), 'data-c': String(cc),
            onclick: function () { toggle(rr, cc); }, onkeydown: onKey
          });
          cells.push(btn);
          items.push(btn);
        })(r, c);
      }
      grid = h('div', { class: P + 'grid', role: 'group', 'aria-label': 'Bobs Garten, 4 Zeilen mit je 5 Feldern' }, items);
      countEl = h('p', { class: P + 'count', role: 'status', 'aria-live': 'polite' });
      noteEl = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      el.replaceChildren(h('div', { class: P + 'board' }, grid, countEl, noteEl));
      render();
    },
    isComplete: function () { return sprinklers.length > 0; },
    evaluate: function () {
      var ok = wetFlowers(sprinklers).length === FLOWERS.length && sprinklers.length === MIN;
      var ans = sprinklers.map(function (s) { return [s[0], s[1]]; }).sort(function (x, y) { return x[0] - y[0] || x[1] - y[1]; });
      return { correct: ok, answer: ans };
    },
    setAnswer: function (ans) {
      sprinklers = (Array.isArray(ans) ? ans : []).filter(function (s) {
        return Array.isArray(s) && s[0] >= 0 && s[0] < ROWS && s[1] >= 0 && s[1] < COLS && !flowerAt(s[0], s[1]);
      }).map(function (s) { return [s[0], s[1]]; });
      mode = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mode = on ? (mode === 'solution' ? 'solution' : 'check') : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      sprinklers = SOLUTION.map(function (s) { return [s[0], s[1]]; });
      mode = 'solution';
      locked = true;
      render();
    }
  });
})();
