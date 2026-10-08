/* Aufgabe Bibimbap (Klasse 5-6, mittel): Arbeitsplan für vier Geräte mit unterschiedlich langen Schritten, kürzeste Zeit (20 Minuten) */
(function () {
  'use strict';
  var h = Biber.h;

  var COLS = 5;               /* Kästchen im Plan, je 5 Minuten */
  var MIN = 5;
  var BEST = 4;               /* kürzester Plan: 4 Kästchen = 20 Minuten (Lösung im offiziellen Heft, S. 25) */

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
  /* d = Gerät, n = Dauer in Kästchen (1 Kästchen = 5 Minuten): Kochen im Topf und Braten der Karotten dauern 10 Minuten */
  var INGS = [
    { id: 'sp', name: 'Spinat', img: 'spinat', steps: [{ d: 'T', n: 2 }, { d: 'B', n: 1 }], w: 70, h: 120 },
    { id: 'sr', name: 'Sprossen', img: 'sprossen', steps: [{ d: 'S', n: 1 }, { d: 'T', n: 2 }], w: 102, h: 87 },
    { id: 'ka', name: 'Karotten', img: 'karotte', steps: [{ d: 'B', n: 1 }, { d: 'P', n: 2 }], w: 40, h: 134 },
    { id: 'ei', name: 'Ei', img: 'ei', steps: [{ d: 'P', n: 1 }], w: 62, h: 59 }
  ];
  function stepOf(ing, dev) { for (var i = 0; i < ing.steps.length; i++) if (ing.steps[i].d === dev) return ing.steps[i]; return null; }
  var ING = {};
  INGS.forEach(function (g) { ING[g.id] = g; });
  var TOTAL = INGS.reduce(function (n, g) { return n + g.steps.reduce(function (m, st) { return m + st.n; }, 0); }, 0);   /* 10 Kästchen */
  function boxesOf(g) { return g.steps.reduce(function (m, st) { return m + st.n; }, 0); }

  /* der Plan aus dem offiziellen Heft (andere Pläne mit höchstens 20 Minuten sind ebenfalls richtig): Zeile = Gerät, Spalte = Kästchen */
  var SOLUTION = {
    P: ['ei', 'ka', 'ka', null, null],
    T: ['sp', 'sp', 'sr', 'sr', null],
    S: ['sr', null, null, null, null],
    B: ['ka', null, 'sp', null, null]
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
  function placedOn(ing, dev, except) {
    var n = 0;
    grid[dev].forEach(function (c, i) { if (c === ing && i !== except) n++; });
    return n;
  }
  function totalPlaced() { return INGS.reduce(function (n, g) { return n + placedCount(g.id); }, 0); }
  function colOf(ing, dev) { return grid[dev].indexOf(ing); }

  /* Auswertung eines Plans: jeder Schritt braucht genau n zusammenhängende Kästchen, und ein Schritt darf erst nach dem vorigen beginnen */
  function analyse(g) {
    var bad = [];
    var len = 0;
    INGS.forEach(function (ing) {
      var ok = true, prevEnd = -1;
      ing.steps.forEach(function (st) {
        var cols = [];
        g[st.d].forEach(function (v, c) { if (v === ing.id) cols.push(c); });
        if (cols.length !== st.n) { ok = false; return; }
        if (cols[cols.length - 1] - cols[0] !== st.n - 1) ok = false;      /* nicht zusammenhängend */
        if (cols[0] <= prevEnd) ok = false;                                /* beginnt zu früh */
        prevEnd = cols[cols.length - 1];
        cols.forEach(function (c) { if (c + 1 > len) len = c + 1; });
      });
      if (!ok) bad.push(ing.id);
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
    return totalPlaced() + ' von ' + TOTAL + ' Kästchen belegt.';
  }
  function changed() { api.changed(statusText()); }

  /* Zutat in Kästchen setzen; from = [Gerät, Spalte] beim Verschieben */
  function place(ing, dev, col, from) {
    if (locked) return;
    var def = ING[ing], st = stepOf(def, dev);
    if (!st) {
      msg = def.name + ' braucht nur ' + def.steps.map(function (x) { return DEV[x.d].name; }).join(' und ') + '.';
      selected = null; render(); return;
    }
    if (from) grid[from[0]][from[1]] = null;
    if (grid[dev][col] !== ing && placedOn(ing, dev, col) >= st.n) {
      if (from) grid[from[0]][from[1]] = ing;
      msg = def.name + ' ' + DEV[dev].verb + ' dauert nur ' + (st.n * MIN) + ' Minuten (' + st.n + (st.n === 1 ? ' Kästchen' : ' Kästchen') + ').';
      selected = null; render(); return;
    }
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
      var left = boxesOf(g) - placedCount(g.id);
      return h('button', {
        type: 'button', class: 'bb-ing' + (selected === g.id ? ' selected' : ''), 'data-ing': g.id,
        draggable: locked || !left ? false : 'true', disabled: locked || !left, 'aria-pressed': String(selected === g.id),
        'aria-label': g.name + ', noch ' + left + (left === 1 ? ' Kästchen' : ' Kästchen') + ' einzuplanen'
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
          } else if (an.len <= BEST) {
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
        ' stimmt etwas nicht: Ein Schritt dauert nicht so lange wie nötig, ist zerrissen oder beginnt, bevor der vorige fertig ist.';
    }
    if (a.len > BEST) return 'Dein Plan dauert ' + a.len * MIN + ' Minuten. Es geht schneller: in ' + BEST * MIN + ' Minuten.';
    if (a.len < BEST) return 'Dein Plan dauert ' + a.len * MIN + ' Minuten.';
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
    return '<p>Die Vorbereitung dauert mindestens <b>20 Minuten</b>: Sowohl der Spinat als auch die Sprossen müssen nacheinander jeweils 10 Minuten im Topf gekocht werden.</p>' +
      '<p>Ein Plan mit genau 20 Minuten: Kocht zuerst der Spinat, können die Sprossen gleichzeitig gewässert werden. Während später die Sprossen kochen, kann der Spinat geschnitten werden. ' +
      'In der Pfanne wird zuerst das Ei gebraten. In dieser Zeit schneidet der Koch schon die Karotten und brät sie danach.</p>' +
      '<p>Jeder Plan, der nicht länger als 20 Minuten dauert, die richtigen Dauern verwendet und bei jeder Zutat die Schritte nacheinander in der richtigen Reihenfolge ausführt, ist richtig.</p>' +
      '<p>In der Informatik nennt man das Planen von Aufgaben auf mehreren Geräten „Scheduling“: Was nicht voneinander abhängt, darf gleichzeitig laufen.</p>';
  }

  Biber.register({
    id: 'bibimbap',
    story:
      '<p>Ein Koch möchte das traditionelle koreanische Gericht 비빔밥 (Bibimbap) zubereiten. Er benutzt dazu u. a. vier Geräte, nämlich Kochtopf ' +
      icHtml('topf', 'Kochtopf') + ', Bratpfanne ' + icHtml('pfanne', 'Bratpfanne') + ', Schneidebrett ' + icHtml('brett', 'Schneidebrett') +
      ' und Schüssel ' + icHtml('schuessel', 'Schüssel') + '. Damit bereitet er die vier Zutaten für Bibimbap so vor:</p>' +
      '<div class="bb-intro"><table class="bb-recipes"><tbody>' +
      '<tr><td>' + icHtml('spinat', 'Spinat').replace('height="40"', 'height="52"') + '</td><th scope="row">Spinat</th><td>zuerst kochen ' + icHtml('topf', 'Kochtopf') + ' (10 Min.),<br>danach schneiden ' + icHtml('brett', 'Schneidebrett') + ' (5 Min.)</td></tr>' +
      '<tr><td>' + icHtml('sprossen', 'Sprossen').replace('height="40"', 'height="52"') + '</td><th scope="row">Sprossen</th><td>zuerst wässern ' + icHtml('schuessel', 'Schüssel') + ' (5 Min.),<br>danach kochen ' + icHtml('topf', 'Kochtopf') + ' (10 Min.)</td></tr>' +
      '<tr><td>' + icHtml('karotte', 'Karotten').replace('height="40"', 'height="52"') + '</td><th scope="row">Karotten</th><td>zuerst schneiden ' + icHtml('brett', 'Schneidebrett') + ' (5 Min.),<br>danach braten ' + icHtml('pfanne', 'Bratpfanne') + ' (10 Min.)</td></tr>' +
      '<tr><td>' + icHtml('ei', 'Ei').replace('height="40"', 'height="52"') + '</td><th scope="row">Ei</th><td>braten ' + icHtml('pfanne', 'Bratpfanne') + ' (5 Min.)</td></tr>' +
      '</tbody></table>' +
      '<img class="bb-koch" src="assets/bibimbap/koch.png" width="800" height="494" alt="Zeichnung: Ein Biber als Koch hält gleichzeitig Pfanne mit Spiegelei, Schüssel mit Sprossen, Schneidebrett mit Karotten und Topf mit Spinat."></div>' +
      '<p>Der Koch kann mit unterschiedlichen Geräten gleichzeitig arbeiten. Aber er kann ein Gerät immer nur für eine Zutat verwenden. ' +
      'Zum Beispiel kann der Koch gleichzeitig Spinat im Topf kochen und ein Ei in der Pfanne braten, aber er kann in der Pfanne nicht gleichzeitig ein Ei und Karotten braten.</p>',
    question: 'Erstelle einen Plan, mit dem der Koch die Zutaten für Bibimbap in kürzester Zeit vorbereiten kann.',
    howto: 'Jedes Kästchen sind 5 Minuten. Ein Schritt von 10 Minuten braucht zwei Kästchen nebeneinander, einer von 5 Minuten braucht eins. Ziehe eine Zutat in ein Kästchen des Geräts, das sie gerade braucht (oder tippe erst die Zutat, dann das Kästchen an). Ein belegtes Kästchen lässt sich durch Antippen wieder leeren.',
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
      return { correct: a.bad.length === 0 && a.len <= BEST, answer: toAnswer() };
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
