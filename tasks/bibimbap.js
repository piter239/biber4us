/* Aufgabe Bibimbap (Klasse 5-6, mittel): Arbeitsplan für vier Geräte, Reihenfolge-Abhängigkeiten, kürzeste Zeit */
(function () {
  'use strict';
  var h = Biber.h;

  var COLS = 5;               /* Kästchen im Plan, je 5 Minuten */
  var MIN = 5;
  var BEST = 2;               /* kürzester Plan: 2 Kästchen = 10 Minuten (per Brute Force geprüft) */

  /* Geräte in der Reihenfolge des Hefts (von oben nach unten) */
  var DEVS = [
    { id: 'P', name: 'Bratpfanne', img: 'pfanne', verb: 'braten', w: 120, h: 38 },
    { id: 'T', name: 'Kochtopf', img: 'topf', verb: 'kochen', w: 120, h: 72 },
    { id: 'S', name: 'Schüssel', img: 'schuessel', verb: 'wässern', w: 120, h: 91 },
    { id: 'B', name: 'Schneidebrett', img: 'brett', verb: 'schneiden', w: 120, h: 60 }
  ];
  var DEV = {};
  DEVS.forEach(function (d) { DEV[d.id] = d; });

  /* Zutaten mit ihren Schritten (Geräte in der nötigen Reihenfolge) */
  var INGS = [
    { id: 'sp', name: 'Spinat', img: 'spinat', steps: ['T', 'B'], w: 70, h: 120 },
    { id: 'sr', name: 'Sprossen', img: 'sprossen', steps: ['S', 'T'], w: 102, h: 87 },
    { id: 'ka', name: 'Karotten', img: 'karotte', steps: ['B', 'P'], w: 40, h: 134 },
    { id: 'ei', name: 'Ei', img: 'ei', steps: ['P'], w: 62, h: 59 }
  ];
  var ING = {};
  INGS.forEach(function (g) { ING[g.id] = g; });
  var TOTAL = INGS.reduce(function (n, g) { return n + g.steps.length; }, 0);

  /* eine richtige (und einzige) Lösung: Zeile = Gerät, Spalte = Kästchen */
  var SOLUTION = {
    P: ['ei', 'ka', null, null, null],
    T: ['sp', 'sr', null, null, null],
    S: ['sr', null, null, null, null],
    B: ['ka', 'sp', null, null, null]
  };

  function pic(src, alt, w, hh, cls) {
    return h('img', { class: cls || '', src: 'assets/bibimbap/' + src + '.png', alt: alt || '', width: w, height: hh, draggable: 'false' });
  }
  function icHtml(src, alt) {
    return '<img class="bb-ic" src="assets/bibimbap/' + src + '.png" alt="' + alt + '" height="40">';
  }

  var el, api;
  var grid, selected, dragging, locked, msg, resultMsg;

  function emptyGrid() {
    var g = {};
    DEVS.forEach(function (d) { g[d.id] = new Array(COLS).fill(null); });
    return g;
  }
  function reset() { grid = emptyGrid(); selected = null; dragging = null; msg = ''; resultMsg = null; }
  function placedCount(ing) {
    var n = 0;
    DEVS.forEach(function (d) { grid[d.id].forEach(function (c) { if (c === ing) n++; }); });
    return n;
  }
  function totalPlaced() { return INGS.reduce(function (n, g) { return n + placedCount(g.id); }, 0); }
  function colOf(ing, dev) { return grid[dev].indexOf(ing); }

  /* Auswertung eines Plans */
  function analyse(g) {
    var bad = [];
    var len = 0;
    INGS.forEach(function (ing) {
      var cols = ing.steps.map(function (d) { return g[d].indexOf(ing.id); });
      for (var i = 0; i < cols.length - 1; i++) if (cols[i] < 0 || cols[i + 1] < 0 || cols[i] >= cols[i + 1]) { bad.push(ing.id); break; }
      cols.forEach(function (c) { if (c + 1 > len) len = c + 1; });
    });
    return { bad: bad, len: len };
  }
  function fromAnswer(ans) {
    var g = emptyGrid();
    DEVS.forEach(function (d, r) { for (var c = 0; c < COLS; c++) g[d.id][c] = ans[r] && ans[r][c] ? ans[r][c] : null; });
    return g;
  }
  function toAnswer() { return DEVS.map(function (d) { return grid[d.id].slice(); }); }

  function statusText() {
    return totalPlaced() + ' von ' + TOTAL + ' Schritten eingeplant.';
  }
  function changed() { api.changed(statusText()); }

  /* Zutat in Kästchen setzen; from = [Gerät, Spalte] beim Verschieben */
  function place(ing, dev, col, from) {
    if (locked) return;
    var def = ING[ing];
    if (def.steps.indexOf(dev) < 0) {
      msg = def.name + ' braucht nur ' + def.steps.map(function (d) { return DEV[d].name; }).join(' und ') + '.';
      selected = null; render(); return;
    }
    if (from) grid[from[0]][from[1]] = null;
    var same = colOf(ing, dev);
    if (same >= 0) grid[dev][same] = null;   /* derselbe Schritt wird nur einmal eingeplant: verschieben */
    grid[dev][col] = ing;
    msg = '';
    selected = null;
    render();
    changed();
  }
  function take(dev, col) {
    if (locked) return;
    grid[dev][col] = null;
    msg = '';
    selected = null;
    render();
    changed();
  }

  function cellLabel(d, c) {
    var v = grid[d.id][c];
    return d.name + ', Minute ' + (c * MIN) + ' bis ' + ((c + 1) * MIN) + ': ' + (v ? ING[v].name + ' ' + d.verb : 'leer');
  }

  function render(mark) {
    var an = mark === 'check' ? analyse(grid) : null;

    var palette = INGS.map(function (g) {
      var left = g.steps.length - placedCount(g.id);
      return h('button', {
        type: 'button', class: 'bb-ing' + (selected === g.id ? ' selected' : ''), 'data-ing': g.id,
        draggable: locked || !left ? false : 'true', disabled: locked || !left, 'aria-pressed': String(selected === g.id),
        'aria-label': g.name + ', noch ' + left + (left === 1 ? ' Schritt' : ' Schritte') + ' einzuplanen'
      }, h('span', { class: 'bb-tile' }, pic(g.img, '', g.w, g.h)),
        h('span', { class: 'bb-ing-name' }, g.name),
        h('span', { class: 'bb-left' }, left ? '× ' + left : '✓'));
    });

    var ruler = [h('div', { class: 'bb-unit' }, 'Minuten')];
    for (var c = 0; c < COLS; c++) {
      ruler.push(h('div', { class: 'bb-tick', 'aria-hidden': 'true' },
        h('span', { class: 'bb-t0' }, String(c * MIN)),
        c === COLS - 1 ? h('span', { class: 'bb-t1' }, String(COLS * MIN)) : null));
    }

    var rows = [];
    DEVS.forEach(function (d) {
      rows.push(h('div', { class: 'bb-dev bb-r-' + d.id, 'aria-hidden': 'true' },
        h('span', { class: 'bb-tile' }, pic(d.img, '', d.w, d.h)), h('span', { class: 'bb-dev-name' }, d.name)));
      for (var col = 0; col < COLS; col++) {
        var v = grid[d.id][col];
        var cls = 'bb-cell bb-r-' + d.id + (v ? ' filled' : '');
        var badge = null;
        if (mark === 'check' && v) {
          if (an.bad.length) {
            var okc = an.bad.indexOf(v) < 0;
            cls += okc ? '' : ' wrong';
            if (!okc) badge = h('span', { class: 'bb-mark', 'aria-hidden': 'true' }, '✗');
          } else if (an.len === BEST) {
            cls += ' right';
            badge = h('span', { class: 'bb-mark', 'aria-hidden': 'true' }, '✓');
          }
        } else if (mark === 'solution' && v) cls += ' right';
        rows.push(h('button', {
          type: 'button', class: cls, 'data-dev': d.id, 'data-col': String(col), disabled: locked,
          draggable: v && !locked ? 'true' : false, 'aria-label': cellLabel(d, col)
        }, v ? h('span', { class: 'bb-tile' }, pic(ING[v].img, '', ING[v].w, ING[v].h)) : null, badge));
      }
    });

    var note = msg || '';
    if (mark === 'check' && resultMsg) note = resultMsg;
    el.replaceChildren(h('div', { class: 'bb-board' },
      h('section', { 'aria-label': 'Zutaten' }, h('h3', null, 'Zutaten'), h('div', { class: 'bb-pal', 'data-pal': '' }, palette)),
      h('section', { 'aria-label': 'Arbeitsplan' }, h('h3', null, 'Plan des Kochs'),
        h('div', { class: 'bb-plan' }, ruler, rows)),
      h('p', { class: 'bb-note' + (mark === 'check' ? ' result' : ''), role: 'status' }, note)));
  }

  function resultText() {
    var a = analyse(grid);
    if (a.bad.length) {
      return 'Bei ' + a.bad.map(function (id) { return ING[id].name; }).join(' und ') +
        ' stimmt die Reihenfolge nicht: Ein Schritt beginnt, bevor der vorige fertig ist.';
    }
    if (a.len > BEST) return 'Dein Plan dauert ' + a.len * MIN + ' Minuten. Es geht schneller: in ' + BEST * MIN + ' Minuten.';
    return 'Dein Plan dauert ' + a.len * MIN + ' Minuten. Schneller geht es nicht.';
  }

  function onClick(e) {
    var t = e.target.closest('[data-ing],[data-dev]');
    if (!t || locked) return;
    if (t.dataset.ing) {
      selected = selected === t.dataset.ing ? null : t.dataset.ing;
      msg = '';
      render();
      return;
    }
    var dev = t.dataset.dev, col = +t.dataset.col;
    if (selected) return place(selected, dev, col);
    if (grid[dev][col]) take(dev, col);
  }
  function onDragStart(e) {
    var t = e.target.closest('[data-ing],[data-dev]');
    if (!t || locked) return;
    if (t.dataset.ing) dragging = { ing: t.dataset.ing };
    else if (grid[t.dataset.dev][+t.dataset.col]) dragging = { ing: grid[t.dataset.dev][+t.dataset.col], from: [t.dataset.dev, +t.dataset.col] };
    else return;
    e.dataTransfer.setData('text/plain', dragging.ing);
    e.dataTransfer.effectAllowed = 'move';
    t.classList.add('dragging');
  }
  function onDragOver(e) {
    var s = e.target.closest('[data-dev],[data-pal]');
    if (!s || !dragging) return;
    e.preventDefault();
    if (s.dataset.dev) s.classList.add('over');
  }
  function onDragLeave(e) {
    var s = e.target.closest('[data-dev]');
    if (s) s.classList.remove('over');
  }
  function onDrop(e) {
    var s = e.target.closest('[data-dev],[data-pal]');
    if (!s || !dragging) return;
    e.preventDefault();
    var d = dragging;
    dragging = null;
    if (s.dataset.dev) place(d.ing, s.dataset.dev, +s.dataset.col, d.from);
    else if (d.from) take(d.from[0], d.from[1]);
  }
  function onDragEnd() { dragging = null; if (!locked) render(); }

  function explanation() {
    return '<p>Jede Zutat beginnt mit einem Schritt, für den ein anderes Gerät gebraucht wird. Darum können alle vier ersten Schritte zusammen in den ersten 5 Minuten laufen: ' +
      'Spinat kochen (Topf), Sprossen wässern (Schüssel), Karotten schneiden (Brett) und Ei braten (Pfanne).</p>' +
      '<p>In den nächsten 5 Minuten folgen gleichzeitig die zweiten Schritte: Spinat schneiden (Brett), Sprossen kochen (Topf) und Karotten braten (Pfanne). ' +
      'Insgesamt dauert es 10 Minuten. Kürzer geht es nicht, weil drei Zutaten je zwei Schritte nacheinander brauchen.</p>' +
      '<p>In der Informatik nennt man das Planen von Aufgaben auf mehreren Geräten „Scheduling“: Was nicht voneinander abhängt, darf gleichzeitig laufen.</p>';
  }

  Biber.register({
    id: 'bibimbap',
    story:
      '<p>Ein Koch möchte das traditionelle koreanische Gericht 비빔밥 (Bibimbap) zubereiten. Er benutzt dazu u. a. vier Geräte, nämlich Kochtopf ' +
      icHtml('topf', 'Kochtopf') + ', Bratpfanne ' + icHtml('pfanne', 'Bratpfanne') + ', Schneidebrett ' + icHtml('brett', 'Schneidebrett') +
      ' und Schüssel ' + icHtml('schuessel', 'Schüssel') + '. Damit bereitet er die vier Zutaten für Bibimbap so vor:</p>' +
      '<div class="bb-intro"><table class="bb-recipes"><tbody>' +
      '<tr><td>' + icHtml('spinat', 'Spinat').replace('height="40"', 'height="52"') + '</td><th scope="row">Spinat</th><td>zuerst kochen ' + icHtml('topf', 'Kochtopf') + ',<br>danach schneiden ' + icHtml('brett', 'Schneidebrett') + '</td></tr>' +
      '<tr><td>' + icHtml('sprossen', 'Sprossen').replace('height="40"', 'height="52"') + '</td><th scope="row">Sprossen</th><td>zuerst wässern ' + icHtml('schuessel', 'Schüssel') + ',<br>danach kochen ' + icHtml('topf', 'Kochtopf') + '</td></tr>' +
      '<tr><td>' + icHtml('karotte', 'Karotten').replace('height="40"', 'height="52"') + '</td><th scope="row">Karotten</th><td>zuerst schneiden ' + icHtml('brett', 'Schneidebrett') + ',<br>danach braten ' + icHtml('pfanne', 'Bratpfanne') + '</td></tr>' +
      '<tr><td>' + icHtml('ei', 'Ei').replace('height="40"', 'height="52"') + '</td><th scope="row">Ei</th><td>braten ' + icHtml('pfanne', 'Bratpfanne') + '</td></tr>' +
      '</tbody></table>' +
      '<img class="bb-koch" src="assets/bibimbap/koch.png" width="800" height="494" alt="Zeichnung: Ein Biber als Koch hält gleichzeitig Pfanne mit Spiegelei, Schüssel mit Sprossen, Schneidebrett mit Karotten und Topf mit Spinat."></div>' +
      '<p>Der Koch kann mit unterschiedlichen Geräten gleichzeitig arbeiten. Aber er kann ein Gerät immer nur für eine Zutat verwenden. ' +
      'Zum Beispiel kann der Koch gleichzeitig Spinat im Topf kochen und ein Ei in der Pfanne braten, aber er kann in der Pfanne nicht gleichzeitig ein Ei und Karotten braten.</p>',
    question: 'Erstelle einen Plan, mit dem der Koch die Zutaten für Bibimbap in kürzester Zeit vorbereiten kann.',
    howto: 'Jedes Kästchen ist ein Arbeitsschritt von 5 Minuten. Ziehe eine Zutat in das Kästchen des Geräts, das sie gerade braucht. Du kannst auch erst die Zutat und dann das Kästchen antippen. Ein eingeplanter Schritt lässt sich durch Antippen wieder entfernen.',
    explanation: explanation,
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
    isComplete: function () { return totalPlaced() === TOTAL; },
    evaluate: function () {
      var a = analyse(grid);
      return { correct: a.bad.length === 0 && a.len === BEST, answer: toAnswer() };
    },
    setAnswer: function (ans) {
      grid = fromAnswer(ans);
      resultMsg = resultText();
      render('check');
    },
    lock: function (on) {
      locked = on;
      selected = null;
      if (on) { resultMsg = resultText(); render('check'); } else { msg = ''; resultMsg = null; render(); }
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      grid = emptyGrid();
      DEVS.forEach(function (d) { grid[d.id] = SOLUTION[d.id].slice(); });
      locked = true;
      resultMsg = null;
      render('solution');
    }
  });
})();
