/* Aufgabe Blätter im Wind (Klassifikation, Entscheidungsbaum): Welche Frucht gehört an welches Blatt? */
(function () {
  'use strict';
  var h = Biber.h;

  var IMG = 'assets/blaetter/';
  var FRUIT = {
    wassermelone: { name: 'Wassermelone' },
    apfel: { name: 'Apfel' },
    orange: { name: 'Orange' },
    banane: { name: 'Banane' },
    weintraube: { name: 'Weintraube' },
    erdbeere: { name: 'Erdbeere' }
  };

  // Tabelle aus dem Heft: Farbe, Samen, Schale essbar, Fruchtsorte
  var ROWS = [
    ['grün', 391, false, 'wassermelone'], ['gelb', 5, true, 'apfel'], ['orange', 9, false, 'orange'],
    ['gelb', 0, false, 'banane'], ['rot', 5, true, 'apfel'], ['grün', 0, true, 'weintraube'],
    ['rot', 206, true, 'erdbeere'], ['grün', 6, true, 'apfel'], ['orange', 10, false, 'orange'],
    ['rot', 173, true, 'erdbeere']
  ];

  // Die fünf leeren Blätter (Reihenfolge der Antwort) und das fertige Orangen-Blatt.
  // cx/cy: Mitte im Zeichenraum 400 x 480; way: Weg von der Wurzel; ans: richtige Frucht.
  var LEAVES = [
    { id: 'a', cx: 38, cy: 236, ans: 'erdbeere', way: 'mehr als 7 Samen, Schale essbar' },
    { id: 'w', cx: 150, cy: 430, ans: 'wassermelone', way: 'mehr als 7 Samen, Schale nicht essbar, Farbe nicht orange' },
    { id: 'e', cx: 356, cy: 226, ans: 'apfel', way: 'nicht mehr als 7 und nicht weniger als 4 Samen' },
    { id: 't', cx: 232, cy: 400, ans: 'weintraube', way: 'höchstens 7 und weniger als 4 Samen, Schale essbar' },
    { id: 'b', cx: 344, cy: 370, ans: 'banane', way: 'höchstens 7 und weniger als 4 Samen, Schale nicht essbar' }
  ];
  var FIXED = { cx: 48, cy: 408, ans: 'orange' };
  var POOL = ['wassermelone', 'apfel', 'banane', 'weintraube', 'erdbeere'];
  var LW = 64, LH = 76;                              // Größe eines Blattes im Zeichenraum
  var VW = 400, VH = 480;

  // Entscheidungsbaum zur Kontrolle (wie im Heft)
  function classify(row) {
    var farbe = row[0], samen = row[1], essbar = row[2];
    if (samen > 7) {
      if (essbar) return 'a';
      return farbe === 'orange' ? 'o' : 'w';
    }
    if (samen < 4) return essbar ? 't' : 'b';
    return 'e';
  }

  function ico(id, cls) {
    var u = 'url(' + IMG + id + '.png)';
    return h('span', { class: 'bl-ico ' + (cls || ''), style: '-webkit-mask-image:' + u + ';mask-image:' + u, 'aria-hidden': 'true' });
  }
  function icoHtml(id, cls) {
    var u = 'url(' + IMG + id + '.png)';
    return '<span class="bl-ico ' + (cls || '') + '" style="-webkit-mask-image:' + u + ';mask-image:' + u + '" aria-hidden="true"></span>';
  }

  /* ---- Text: Tabelle ---- */
  function tableHtml() {
    var body = ROWS.map(function (r) {
      return '<tr><td>' + r[0] + '</td><td class="num">' + r[1] + '</td><td>' + (r[2] ? 'ja' : 'nein') + '</td>' +
        '<td class="bl-sorte">' + FRUIT[r[3]].name + '</td><td class="bl-ic">' + icoHtml(r[3], 'bl-ico-s') + '</td></tr>';
    }).join('');
    return '<div class="bl-tabwrap"><table class="bl-tab"><thead><tr><th scope="col">Farbe</th><th scope="col">Anzahl Samen</th>' +
      '<th scope="col">Schale essbar?</th><th scope="col" colspan="2">Fruchtsorte</th></tr></thead><tbody>' + body + '</tbody></table></div>';
  }

  /* ---- Baum als SVG (Äste, Fragen, Blätter) ---- */
  var QUESTIONS = [
    { x: 170, y: 34, w: 104, h: 40, cls: 'q-samen', t: ['Mehr als', '7 Samen?'] },
    { x: 80, y: 138, w: 100, h: 40, cls: 'q-schale', t: ['Schale', 'essbar?'] },
    { x: 300, y: 100, w: 112, h: 40, cls: 'q-samen', t: ['Weniger als', '4 Samen?'] },
    { x: 112, y: 296, w: 108, h: 32, cls: 'q-farbe', t: ['Farbe orange?'] },
    { x: 262, y: 250, w: 100, h: 40, cls: 'q-schale', t: ['Schale', 'essbar?'] }
  ];
  var BRANCHES = [
    'M170,0 L170,34',
    'M170,34 C170,90 80,80 80,138',
    'M170,34 C170,70 300,60 300,100',
    'M80,138 C60,170 38,170 38,198',
    'M80,138 C80,200 112,230 112,296',
    'M112,296 C90,330 48,330 48,370',
    'M112,296 C125,340 150,350 150,392',
    'M300,100 C300,160 262,190 262,250',
    'M300,100 C340,130 356,150 356,188',
    'M262,250 C250,300 232,320 232,362',
    'M262,250 C290,290 344,290 344,332'
  ];
  var LABELS = [
    ['ja', 103, 66, 'end'], ['nein', 250, 52, 'start'],
    ['ja', 44, 164, 'end'], ['nein', 98, 208, 'start'],
    ['ja', 78, 340, 'end'], ['nein', 142, 350, 'start'],
    ['ja', 270, 170, 'end'], ['nein', 397, 150, 'end'],
    ['ja', 244, 322, 'end'], ['nein', 316, 304, 'start']
  ];

  function leafPath(cx, cy) {
    var x = cx, t = cy - LH / 2, b = cy + LH / 2;
    return 'M' + x + ',' + t + ' C' + (x + 44) + ',' + (t + 20) + ' ' + (x + 42) + ',' + (b - 18) + ' ' + x + ',' + b +
      ' C' + (x - 42) + ',' + (b - 18) + ' ' + (x - 44) + ',' + (t + 20) + ' ' + x + ',' + t + ' Z';
  }

  function svgHtml(state) {
    var s = '<svg class="bl-svg" viewBox="0 0 ' + VW + ' ' + VH + '" aria-hidden="true" focusable="false">';
    s += '<g class="bl-branches">' + BRANCHES.map(function (d) { return '<path d="' + d + '"/>'; }).join('') + '</g>';
    s += QUESTIONS.map(function (q) {
      var lines = q.t.map(function (t, i) {
        var dy = q.t.length === 1 ? 5 : (i === 0 ? -2 : 13);
        return '<text x="' + q.x + '" y="' + (q.y + dy) + '" text-anchor="middle">' + t + '</text>';
      }).join('');
      return '<g class="bl-q ' + q.cls + '"><rect x="' + (q.x - q.w / 2) + '" y="' + (q.y - q.h / 2) + '" width="' + q.w + '" height="' + q.h + '" rx="6"/>' + lines + '</g>';
    }).join('');
    s += LABELS.map(function (l) { return '<text class="bl-lab" x="' + l[1] + '" y="' + l[2] + '" text-anchor="' + l[3] + '">' + l[0] + '</text>'; }).join('');
    LEAVES.forEach(function (lf, i) {
      var f = state.slots[i];
      var cls = 'bl-leaf' + (f ? ' filled' : '') + (state.sel && !f ? ' target' : '') + (state.over === lf.id ? ' over' : '');
      s += '<path class="' + cls + '" d="' + leafPath(lf.cx, lf.cy) + '"/>';
    });
    s += '<path class="bl-leaf filled fixed" d="' + leafPath(FIXED.cx, FIXED.cy) + '"/>';
    return s + '</svg>';
  }

  /* ---- Zustand ---- */
  var el, api, boardEl;
  var slots, selected, dragging, locked, over;

  function reset() { slots = [null, null, null, null, null]; selected = null; dragging = null; over = null; }
  function isRight(i) { return slots[i] === LEAVES[i].ans; }
  function allRight() { return LEAVES.every(function (l, i) { return isRight(i); }); }

  function place(f, idx) {
    if (locked) return;
    var from = slots.indexOf(f);
    var existing = slots[idx];
    slots[idx] = f;
    if (from >= 0) slots[from] = existing === f ? null : existing;
    selected = null;
    render(null, 'slot:' + idx);
    api.changed();
  }
  function release(f) {
    if (locked) return;
    var from = slots.indexOf(f);
    if (from >= 0) slots[from] = null;
    selected = null;
    render(null, 'fruit:' + f);
    api.changed();
  }

  function pct(v, total) { return (v / total * 100).toFixed(3) + '%'; }

  function render(mark, focusKey) {
    var tree = h('div', { class: 'bl-tree' });
    tree.innerHTML = svgHtml({ slots: slots, sel: selected, over: over });
    tree.firstChild.setAttribute('aria-hidden', 'true');

    LEAVES.forEach(function (lf, i) {
      var f = slots[i];
      var cls = 'bl-slot' + (f ? ' filled' : '');
      var m = null;
      if (mark === 'check') {
        var ok = f === lf.ans;
        cls += ok ? ' right' : ' wrong';
        m = h('span', { class: 'bl-mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      } else if (mark === 'solution') cls += ' right';
      var b = h('button', {
        type: 'button', class: cls, 'data-slot': String(i), 'data-in-slot': f || false,
        draggable: f && !locked ? 'true' : false, disabled: locked,
        'aria-label': 'Blatt ' + (i + 1) + ' von 5 (' + lf.way + '): ' + (f ? FRUIT[f].name : 'leer'),
        title: f ? FRUIT[f].name : 'Blatt: ' + lf.way,
        style: 'left:' + pct(lf.cx, VW) + ';top:' + pct(lf.cy, VH) + ';width:' + pct(LW, VW) + ';height:' + pct(LH, VH)
      }, f ? ico(f) : h('span', { class: 'bl-ph', 'aria-hidden': 'true' }, '?'), m);
      tree.appendChild(b);
    });
    tree.appendChild(h('div', {
      class: 'bl-slot fixed', role: 'img', 'aria-label': 'Blatt Orange (schon vorhanden)', title: 'Orange (schon vorhanden)',
      style: 'left:' + pct(FIXED.cx, VW) + ';top:' + pct(FIXED.cy, VH) + ';width:' + pct(LW, VW) + ';height:' + pct(LH, VH)
    }, ico('orange')));

    var pool = POOL.map(function (f) {
      if (slots.indexOf(f) >= 0) return h('div', { class: 'bl-cell', 'aria-hidden': 'true' });
      return h('button', {
        type: 'button', class: 'bl-fruit' + (selected === f ? ' selected' : ''), 'data-fruit': f,
        draggable: locked ? false : 'true', 'aria-pressed': String(selected === f), disabled: locked,
        'aria-label': FRUIT[f].name
      }, h('span', { class: 'bl-chip' }, ico(f)), h('span', { class: 'bl-fname' }, FRUIT[f].name));
    });

    el.replaceChildren(h('div', { class: 'bl-board' },
      h('section', { class: 'bl-sec', 'aria-label': 'Früchte (abgefallene Blätter)' },
        h('h3', null, 'Abgefallene Blätter'), h('div', { class: 'bl-pool', 'data-pool': '' }, pool)),
      h('section', { class: 'bl-sec bl-treesec', 'aria-label': 'Entscheidungsbaum' },
        h('h3', null, 'Entscheidungsbaum'), tree)));

    if (focusKey) {
      var t = focusKey.indexOf('slot:') === 0 ? el.querySelector('[data-slot="' + focusKey.slice(5) + '"]')
        : el.querySelector('[data-fruit="' + focusKey.slice(6) + '"]');
      if (t) t.focus({ preventScroll: true });
    }
  }

  function onClick(e) {
    var t = e.target.closest('[data-fruit],[data-slot]');
    if (!t || locked) return;
    if (t.dataset.fruit) {
      selected = selected === t.dataset.fruit ? null : t.dataset.fruit;
      render(null, 'fruit:' + t.dataset.fruit);
      return;
    }
    var idx = +t.dataset.slot;
    if (selected) return place(selected, idx);
    if (slots[idx]) release(slots[idx]);
  }
  function onDragStart(e) {
    var t = e.target.closest('[data-fruit],[data-in-slot]');
    if (!t || locked || t.dataset.inSlot === 'false') return;
    dragging = t.dataset.fruit || t.dataset.inSlot;
    e.dataTransfer.setData('text/plain', dragging);
    e.dataTransfer.effectAllowed = 'move';
    t.classList.add('dragging');
  }
  function setOver(id) {
    if (over === id) return;
    over = id;
    var paths = el.querySelectorAll('.bl-leaf:not(.fixed)');
    LEAVES.forEach(function (lf, i) { if (paths[i]) paths[i].classList.toggle('over', over === lf.id); });
    el.querySelectorAll('.bl-slot[data-slot]').forEach(function (b) { b.classList.toggle('over', over === LEAVES[+b.dataset.slot].id); });
  }
  function onDragOver(e) {
    if (!dragging) return;
    var s = e.target.closest('[data-slot],[data-pool]');
    if (!s) return;
    e.preventDefault();
    setOver(s.dataset.slot ? LEAVES[+s.dataset.slot].id : null);
  }
  function onDrop(e) {
    var s = e.target.closest('[data-slot],[data-pool]');
    if (!s || !dragging) return;
    e.preventDefault();
    var f = dragging;
    dragging = null; over = null;
    var idx = s.dataset.slot ? +s.dataset.slot : -1;
    // erst nach dem Ende des Ziehens neu zeichnen (die Quelle wird dabei ersetzt)
    setTimeout(function () { if (idx >= 0) place(f, idx); else release(f); }, 0);
  }
  function onDragEnd() { dragging = null; over = null; if (!locked) render(); }

  function wayList() {
    var items = [
      ['erdbeere', 'Mehr als 7 Samen und essbare Schale: Die Erdbeeren (206 und 173 Samen) landen am <strong>linken Blatt</strong>.'],
      ['wassermelone', 'Mehr als 7 Samen, Schale nicht essbar und Farbe nicht orange: Die grüne Wassermelone (391 Samen) hängt am <strong>Blatt unter „Farbe orange?“, Antwort nein</strong>.'],
      ['apfel', 'Weder mehr als 7 noch weniger als 4 Samen: Die Äpfel (5, 5 und 6 Samen) landen am <strong>Blatt ganz rechts</strong>, nämlich bei „Weniger als 4 Samen?“ mit Antwort nein. Hier ist die Schale egal.'],
      ['weintraube', 'Weniger als 4 Samen und essbare Schale: Die Weintraube (0 Samen) gehört an das Blatt zur Antwort <strong>ja</strong> bei der zweiten Frage „Schale essbar?“ (rechte Baumhälfte).'],
      ['banane', 'Weniger als 4 Samen und Schale nicht essbar: Die Banane (0 Samen) gehört an das Blatt zur Antwort <strong>nein</strong> bei der zweiten Frage „Schale essbar?“ (rechte Baumhälfte).']
    ];
    return '<ul class="bl-why">' + items.map(function (it) {
      return '<li><span class="bl-chip bl-chip-s">' + icoHtml(it[0]) + '</span><div><strong>' + FRUIT[it[0]].name + '</strong><span>' + it[1] + '</span></div></li>';
    }).join('') + '</ul>';
  }

  Biber.register({
    id: 'blaetter',
    story: '<p>In einer Schulklasse werden Früchte analysiert. Für jede Frucht werden drei Eigenschaften betrachtet und aus den Werten die Fruchtsorte bestimmt. ' +
      'Die Eigenschaften sind: äußere Farbe, Anzahl der Samen und Essbarkeit der Schale. Für zehn Früchte hat die Klasse deren Werte und die daraus bestimmten Fruchtsorten in einer Tabelle notiert:</p>' +
      tableHtml() +
      '<p>Die Fruchtsorten werden mit dem Entscheidungsbaum unten bestimmt. Ein Entscheidungsbaum sieht aus wie ein Baum, der auf dem Kopf steht: Oben ist die Wurzel und unten sind die Blätter. ' +
      'Außerdem sind die Wurzel und die Astgabeln mit Fragen beschriftet, die man mit ja oder nein beantworten kann.</p>' +
      '<p>Zur Bestimmung der Fruchtsorte werden die Fragen im Baum anhand der Werte beantwortet. Das geht so: Beginne oben an der Wurzel. Beantworte die Frage dort und gehe auf den passenden Ast mit der richtigen Antwort (ja oder nein). ' +
      'Beantworte die nächste Frage und gehe auf den nächsten passenden Ast. Mache so weiter, bis du ein Blatt erreicht hast. Das Blatt zeigt die Fruchtsorte.</p>' +
      '<p>Nach den zehn Früchten ist der Entscheidungsbaum leider kaputt gegangen: Fast alle Blätter sind abgefallen.</p>',
    question: 'An welchen Stellen waren die Blätter?',
    howto: 'Ziehe jede Frucht auf das Blatt, an dem sie im Baum hing. Du kannst auch erst die Frucht und dann das Blatt antippen. Ein angetipptes Blatt gibt die Frucht wieder frei. Das Blatt mit der Orange ist noch da.',
    explanation: function () {
      return '<p>Man verfolgt jede Zeile der Tabelle von der Wurzel aus durch den Baum und schaut, an welchem Blatt sie endet. Dort muss die Fruchtsorte dieser Zeile hängen:</p>' +
        wayList() +
        '<p>Ein Entscheidungsbaum ordnet Dinge mit wenigen Ja-Nein-Fragen einer Klasse zu. Solche Bäume nutzt man in der Informatik zum Klassifizieren und im maschinellen Lernen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', onDragEnd);
      render();
    },
    isComplete: function () { return slots.every(Boolean); },
    evaluate: function () { return { correct: allRight(), answer: slots.slice() }; },
    setAnswer: function (ans) {
      slots = (ans || []).slice(0, 5);
      while (slots.length < 5) slots.push(null);
      selected = null;
      render(allRight() ? 'solution' : 'check');
    },
    lock: function (on) {
      locked = on;
      selected = null;
      if (on) render('check'); else render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      slots = LEAVES.map(function (l) { return l.ans; });
      locked = true; selected = null;
      render('solution');
    }
  });

  // Selbsttest-Hilfe (nur Daten, kein Global): jede Tabellenzeile muss am richtigen Blatt enden
  ROWS.forEach(function (r) {
    var id = classify(r), want = id === 'o' ? 'orange' : LEAVES.filter(function (l) { return l.id === id; })[0].ans;
    if (want !== r[3] && window.console) console.warn('blaetter: Baum passt nicht zur Tabelle', r);
  });
})();
