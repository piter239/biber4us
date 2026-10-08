/* Aufgabe Geburtstagsrätsel (Heft 2021, S. 30; Klasse 5-6 schwer, 9-10 leicht): Lösungssuche, Rückwärtssuche */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-geburtstag21-';

  /* Form -> { name, Farbe } (Farben bleiben in Hell und Dunkel gleich) */
  var SHAPES = {
    kreis: { name: 'Kreis', fill: '#000080' },
    quadrat: { name: 'Quadrat', fill: '#d35400' },
    herz: { name: 'Herz', fill: '#b71c1c' },
    klee: { name: 'Kleeblatt', fill: '#ff6ee0' },
    dreieck: { name: 'Dreieck mit Spitze nach unten', fill: '#0a7a0a' },
    tanne: { name: 'Tannenbaum', fill: '#0b4d0b' },
    kreuz: { name: 'Kreuz', fill: '#6a00ff' },
    mond: { name: 'Mond', fill: '#12d6a8' },
    stern: { name: 'Stern', fill: '#ffcc00' },
    raute: { name: 'Raute', fill: '#b8ff8a' },
    geschenk: { name: 'Geschenk', fill: '#0c6b8a' }
  };
  function starPath() {
    var pts = [], i;
    for (i = 0; i < 10; i++) {
      var r = i % 2 ? 4.2 : 10, a = -Math.PI / 2 + i * Math.PI / 5;
      pts.push((Math.cos(a) * r).toFixed(2) + ' ' + (Math.sin(a) * r).toFixed(2));
    }
    return 'M' + pts.join(' L') + 'Z';
  }
  var PATH = {
    kreis: '<circle r="9.5"/>',
    quadrat: '<rect x="-9" y="-9" width="18" height="18"/>',
    herz: '<path d="M0 10 C-15 -1 -10 -10 -4.5 -9 C-2 -8.5 -0.6 -7 0 -5 C0.6 -7 2 -8.5 4.5 -9 C10 -10 15 -1 0 10Z"/>',
    klee: '<circle cx="0" cy="-4.8" r="5.4"/><circle cx="-5.2" cy="3.8" r="5.4"/><circle cx="5.2" cy="3.8" r="5.4"/><rect x="-3" y="-2" width="6" height="8"/>',
    dreieck: '<path d="M-10.5 -8 L10.5 -8 L0 10Z"/>',
    tanne: '<path d="M0 -10.5 L6.5 -2 L3.2 -2 L9.5 7.5 L-9.5 7.5 L-3.2 -2 L-6.5 -2Z"/>',
    kreuz: '<path d="M-3 -10 H3 V-3 H10 V3 H3 V10 H-3 V3 H-10 V-3 H-3Z"/>',
    mond: '<path d="M2 -10 A10 10 0 1 0 10 5 A8 8 0 0 1 2 -10Z"/>',
    stern: '<path d="' + starPath() + '"/>',
    raute: '<path d="M0 -10.5 L7.5 0 L0 10.5 L-7.5 0Z"/>',
    geschenk: '<rect x="-10" y="-6" width="20" height="16" rx="1"/><rect x="-1.6" y="-6" width="3.2" height="16" fill="#8fe3ff"/><path fill="none" stroke="#8fe3ff" stroke-width="1.8" d="M0 -6 C-9 -14 -11 -5 0 -6 C11 -5 9 -14 0 -6"/>'
  };
  /* Form zeichnen: Mitte (x,y), Skalierung k */
  function shapeSvg(id, x, y, k, color) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')" fill="' + (color || SHAPES[id].fill) + '">' + PATH[id] + '</g>';
  }

  /* Die 15 Türen A-O (Heft S. 30/31, Reihe für Reihe von links nach rechts):
     b = Baustein hinter der Tür, l = Form des Lochs rechts neben der Tür */
  var DOORS = [
    { id: 'A', b: 'herz', l: 'mond' }, { id: 'B', b: 'quadrat', l: 'kreis' }, { id: 'C', b: 'klee', l: 'tanne' }, { id: 'D', b: 'herz', l: 'kreis' }, { id: 'E', b: 'quadrat', l: 'stern' },
    { id: 'F', b: 'dreieck', l: 'quadrat' }, { id: 'G', b: 'kreuz', l: 'herz' }, { id: 'H', b: 'geschenk', l: 'klee' }, { id: 'I', b: 'mond', l: 'dreieck' }, { id: 'J', b: 'stern', l: 'kreis' },
    { id: 'K', b: 'tanne', l: 'mond' }, { id: 'L', b: 'dreieck', l: 'kreis' }, { id: 'M', b: 'tanne', l: 'raute' }, { id: 'N', b: 'raute', l: 'klee' }, { id: 'O', b: 'herz', l: 'kreuz' }
  ];
  var LETTERS = DOORS.map(function (d) { return d.id; });
  var START = 'kreis';
  var MAXDOORS = 5;
  var GOAL = 'H';   /* mittlere Tür mit dem Geschenk */
  var RIGHT = 'L';  /* im Heft bestätigt; Weg L-I-K-C-H, per Skript (alle Wege mit höchstens 5 Türen durchsucht) als einziger bestätigt */
  var SOLUTION = ['L', 'I', 'K', 'C', 'H'];

  function door(id) { return DOORS[LETTERS.indexOf(id)]; }

  var el, api, unitEls, stoneEl, trailEl, msgEl, undoBtn, newBtn;
  var opened, locked, mark, shakeId;

  function stoneAfter(list) { return list.length ? door(list[list.length - 1]).b : START; }
  function finished() { return opened.length > 0 && door(opened[opened.length - 1]).id === GOAL; }
  function reset() { opened = []; mark = null; shakeId = null; }

  /* ---------- Zeichnung ---------- */
  function unitSvg(d, isOpen, inserted) {
    var bars = '', i;
    for (i = 0; i < 10; i++) bars += '<rect x="' + (6 + i * 6.6) + '" y="4" width="3.4" height="52" rx="1"/>';
    var doorArt;
    if (isOpen) {
      doorArt = '<rect class="' + P + 'inside" x="4" y="4" width="68" height="52" rx="3"/>' +
        shapeSvg(d.b, 38, 30, 1.9) +
        '<rect class="' + P + 'leaf" x="0" y="3" width="9" height="54" rx="2"/>';
    } else {
      doorArt = '<rect class="' + P + 'inside" x="4" y="4" width="68" height="52" rx="3"/>' +
        shapeSvg(d.b, 38, 30, 1.9) +
        '<g class="' + P + 'bars">' + bars + '</g><rect class="' + P + 'frame" x="2.5" y="2.5" width="71" height="55" rx="3"/>';
    }
    var hole = '<rect class="' + P + 'hole" x="82" y="14" width="40" height="40" rx="4"/>' +
      (inserted ? shapeSvg(inserted, 102, 34, 1.6) : shapeSvg(d.l, 102, 34, 1.6, '#8d6a68'));
    var tag = '<g class="' + P + 'tag"><circle cx="12" cy="12" r="9"/><text x="12" y="16" text-anchor="middle">' + d.id + '</text></g>';
    return '<svg viewBox="-2 0 126 60" aria-hidden="true" focusable="false">' + doorArt + hole + tag + '</svg>';
  }
  function chip(shape, extra) {
    return '<svg class="' + P + 'chip ' + (extra || '') + '" viewBox="-13 -13 26 26" aria-hidden="true" focusable="false">' + shapeSvg(shape, 0, 0, 1.1) + '</svg>';
  }

  function render() {
    var stone = stoneAfter(opened), done = finished();
    unitEls.forEach(function (u, i) {
      var d = DOORS[i], idx = opened.indexOf(d.id), isOpen = idx >= 0;
      var inserted = isOpen ? (idx === 0 ? START : door(opened[idx - 1]).b) : null;
      u.innerHTML = unitSvg(d, isOpen, inserted);
      var fits = !isOpen && d.l === stone && !done && opened.length < MAXDOORS;
      u.classList.toggle('open', isOpen);
      u.classList.toggle('shake', shakeId === d.id);
      u.classList.toggle('goal', isOpen && d.id === GOAL);
      u.classList.remove('right', 'wrong');
      if (isOpen && idx === 0 && mark) u.classList.add(mark !== 'solution' && d.id !== RIGHT ? 'wrong' : 'right');
      u.disabled = locked;
      u.setAttribute('aria-pressed', String(isOpen));
      u.setAttribute('aria-label', 'Tür ' + d.id + (d.id === GOAL ? ' (mittlere Tür)' : '') + ': Loch in Form ' + SHAPES[d.l].name + ', hinter der Tür ' + SHAPES[d.b].name +
        (isOpen ? ', geöffnet als ' + (idx + 1) + '. Tür' : ''));
    });
    stoneEl.innerHTML = '<span class="' + P + 'lbl">In deiner Hand:</span>' + (done ? '<span class="' + P + 'gift">' + chip('geschenk') + '<b>Das Geschenk!</b></span>' : chip(stone) + '<b>' + SHAPES[stone].name + '</b>');
    var trail = chip(START);
    opened.forEach(function (id) { trail += '<span class="' + P + 'arrow" aria-hidden="true">→</span><span class="' + P + 'tid">' + id + '</span><span class="' + P + 'arrow" aria-hidden="true">→</span>' + chip(door(id).b); });
    trailEl.innerHTML = '<span class="' + P + 'lbl">Dein Weg:</span>' + trail;
    trailEl.setAttribute('aria-label', 'Dein Weg: Start mit ' + SHAPES[START].name + (opened.length ? ', geöffnet: ' + opened.join(', ') : ', noch keine Tür geöffnet'));
    var n = opened.length;
    var text;
    if (done) text = 'Geschafft: Das Geschenk ist nach ' + n + ' Türen erreicht.';
    else if (n >= MAXDOORS) text = 'Das waren schon ' + MAXDOORS + ' Türen und das Geschenk ist noch nicht da. Gehe mit „Zurück“ einen Schritt zurück oder fange neu an.';
    else if (!n) text = 'Tippe auf eine Tür, deren Loch zu deinem Baustein passt. Die Tür geht auf, und du bekommst den Baustein dahinter.';
    else text = 'Geöffnete Türen: ' + n + ' von höchstens ' + MAXDOORS + '.';
    if (render.note) { text = render.note + ' ' + text; render.note = ''; }
    msgEl.textContent = text;
    undoBtn.disabled = locked || !n;
    newBtn.disabled = locked || !n;
  }

  function tryDoor(i) {
    if (locked) return;
    var d = DOORS[i], stone = stoneAfter(opened);
    if (finished() || opened.length >= MAXDOORS) { shakeId = null; render(); return; }
    if (opened.indexOf(d.id) >= 0) { render.note = 'Tür ' + d.id + ' ist schon offen.'; shakeId = null; render(); return; }
    if (d.l !== stone) {
      shakeId = d.id;
      render.note = 'Dein Baustein (' + SHAPES[stone].name + ') passt nicht in Tür ' + d.id + ': Dort braucht man ein ' + SHAPES[d.l].name + '.';
      render();
      return;
    }
    shakeId = null;
    opened.push(d.id);
    render();
    api.changed();
  }
  function undo() {
    if (locked || !opened.length) return;
    opened.pop(); shakeId = null; render(); api.changed();
  }
  function restart() {
    if (locked || !opened.length) return;
    opened = []; shakeId = null; render(); api.changed();
  }

  Biber.register({
    id: 'geburtstag21',
    story:
      '<p>Bastian bekommt zum Geburtstag eine Kiste mit 15 Türen. Hinter der mittleren Tür ist ein weiteres Geschenk. Hinter den anderen Türen sind Bausteine.</p>' +
      '<p>Zu jeder Tür gehört ein Loch, rechts neben der Tür. Bastian kann eine Tür öffnen, indem er in das Loch einen Baustein gleicher Form einwirft – wie einen Schlüssel. Der Baustein bleibt im Loch; dafür bekommt Bastian den Baustein, der hinter der Tür lag.</p>' +
      '<p>Zu Beginn hat Bastian diesen runden Baustein: <span class="' + P + 'inline" aria-label="blauer Kreis"></span> Er will höchstens fünf Türen öffnen, um das Geschenk zu erreichen.</p>',
    question: 'Welche Tür muss Bastian dafür zuerst öffnen?',
    howto: 'Probiere es aus: Tippe auf eine Tür, die zu deinem Baustein passt. Wenn du das Geschenk erreichst oder nicht mehr weiterkommst, geht es mit „Zurück“ oder „Neu beginnen“ weiter. „Antwort prüfen“ bewertet die Tür, die du zuerst geöffnet hast.',
    explanation: function () {
      var chain = chip(START);
      SOLUTION.forEach(function (id) { chain += '<span class="' + P + 'arrow" aria-hidden="true">→</span><span class="' + P + 'tid">' + id + '</span><span class="' + P + 'arrow" aria-hidden="true">→</span>' + chip(door(id).b); });
      return '<p>Bastian muss zuerst <strong>Tür L</strong> öffnen. Der Weg über fünf Türen geht so:</p>' +
        '<p class="' + P + 'chain" role="img" aria-label="Weg: Kreis, Tür L, Dreieck, Tür I, Mond, Tür K, Tannenbaum, Tür C, Kleeblatt, Tür H, Geschenk">' + chain + '</p>' +
        '<p>Am besten sucht man <strong>rückwärts</strong>: Für die Geschenk-Tür H braucht man das Kleeblatt (hinter C). Für C braucht man den Tannenbaum (hinter K und M). Tür M geht nur mit der Raute von N, und N braucht das Kleeblatt von C – das ist dann schon verbraucht. Also nimmt man K, dafür braucht man den Mond hinter I. Tür I öffnet man mit dem Dreieck hinter F oder L. Weil Tür L zum runden Startbaustein passt, ist der Weg L, I, K, C, H gefunden.</p>' +
        '<p>Da bei der Rückwärtssuche kein Umweg nötig war, gibt es keinen kürzeren Weg – und keinen anderen mit höchstens fünf Türen. Wer vorwärts probiert, hat viele Möglichkeiten (der Kreis passt in vier Löcher); wer vom Ziel zurückrechnet, hat fast immer nur eine.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      stoneEl = h('div', { class: P + 'stone', role: 'status', 'aria-live': 'polite' });
      trailEl = h('div', { class: P + 'trail', role: 'group' });
      msgEl = h('p', { class: P + 'msg', role: 'status', 'aria-live': 'polite' });
      undoBtn = h('button', { type: 'button', class: 'btn ghost ' + P + 'btn', onclick: undo }, 'Zurück');
      newBtn = h('button', { type: 'button', class: 'btn ghost ' + P + 'btn', onclick: restart }, 'Neu beginnen');
      unitEls = DOORS.map(function (d, i) {
        return h('button', { type: 'button', class: P + 'unit', 'data-door': d.id, onclick: function () { tryDoor(i); } });
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('div', { class: P + 'top' }, stoneEl, h('div', { class: P + 'btns' }, undoBtn, newBtn)),
        h('div', { class: P + 'box', role: 'group', 'aria-label': 'Kiste mit 15 Türen' }, unitEls),
        trailEl, msgEl));
      render();
    },
    isComplete: function () { return opened.length > 0; },
    evaluate: function () {
      return { correct: opened[0] === RIGHT, answer: { doors: opened.slice() } };
    },
    setAnswer: function (ans) {
      var list = ans && Array.isArray(ans.doors) ? ans.doors.filter(function (id) { return LETTERS.indexOf(id) >= 0; }) : [];
      opened = list.slice(0, MAXDOORS);
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () { opened = SOLUTION.slice(); mark = 'solution'; locked = true; render(); }
  });
})();
