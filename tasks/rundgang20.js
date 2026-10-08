/* Aufgabe Rundgang (Biber 2020; Klasse 3-4 schwer, 5-6 mittel, 7-8 leicht): In welchem Museumsplan gibt es einen Rundgang (Hamiltonkreis)? */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-rundgang20-';

  /* Geometrie (für alle vier Pläne gleich): Räume als Rechtecke [x, y, Breite, Höhe] in einer Fläche 350 x 313 */
  var ROOMS = {
    1: [0, 0, 116, 82], 2: [0, 82, 116, 231],
    3: [116, 0, 117, 173], 4: [116, 173, 117, 140],
    5: [233, 0, 117, 110], 6: [233, 110, 117, 93], 7: [233, 203, 117, 110]
  };
  var CENTER = { 1: [58, 41], 2: [58, 197], 3: [174, 86], 4: [174, 243], 5: [291, 55], 6: [291, 156], 7: [291, 258] };
  /* Türen: Wand und Lage ('h' = waagerechte Wand bei y, Tür von x1 bis x2; 'v' = senkrechte Wand bei x, Tür von y1 bis y2) */
  var DOORS = {
    '1-2': { o: 'h', at: 82, a: 38, b: 75 },
    '1-3': { o: 'v', at: 116, a: 19, b: 55 },
    '2-3': { o: 'v', at: 116, a: 108, b: 146 },
    '2-4': { o: 'v', at: 116, a: 240, b: 278 },
    '3-4': { o: 'h', at: 173, a: 155, b: 193 },
    '3-5': { o: 'v', at: 233, a: 19, b: 57 },
    '4-7': { o: 'v', at: 233, a: 240, b: 278 },
    '5-6': { o: 'h', at: 110, a: 271, b: 309 },
    '6-7': { o: 'h', at: 203, a: 271, b: 309 }
  };
  /* Ein- und Ausgänge (Wand außen) */
  var ENTRY = { room: 2, x: 0, a: 206, b: 253 };
  var EXITS = { 5: { x: 350, a: 22, b: 70 }, 6: { x: 350, a: 130, b: 178 } };

  /* Die vier Pläne wie im Heft: Türen und Raum mit dem Ausgang */
  var PLANS = [
    { key: 'A', exit: 5, doors: ['1-2', '2-3', '2-4', '3-4', '4-7', '5-6', '6-7'] },
    { key: 'B', exit: 6, doors: ['1-2', '1-3', '2-3', '2-4', '3-4', '3-5', '4-7', '5-6', '6-7'] },
    { key: 'C', exit: 5, doors: ['1-2', '1-3', '2-3', '2-4', '3-4', '3-5', '4-7', '5-6', '6-7'] },
    { key: 'D', exit: 5, doors: ['1-2', '1-3', '2-3', '2-4', '3-4', '3-5', '4-7', '6-7'] }
  ];
  var RIGHT = 2;                           /* Plan C (Heft: nur C erlaubt einen Rundgang; per Skript über alle Rundwege geprüft) */
  var SOLUTION_ROUTE = [2, 1, 3, 4, 7, 6, 5];   /* außen, 2, 1, 3, 4, 7, 6, 5, außen */

  function doorMid(key) { var d = DOORS[key]; return d.o === 'h' ? [(d.a + d.b) / 2, d.at] : [d.at, (d.a + d.b) / 2]; }
  function dk(a, b) { return a < b ? a + '-' + b : b + '-' + a; }
  function hasDoor(plan, a, b) { return plan.doors.indexOf(dk(a, b)) >= 0; }
  function neighbours(plan, r) { var out = []; for (var i = 1; i <= 7; i++) if (i !== r && hasDoor(plan, r, i)) out.push(i); return out; }

  /* ---------- Zeichnen ---------- */
  var COLORS = { 1: 'var(--c6)', 2: 'var(--c1)', 3: 'var(--c5)', 4: 'var(--c4)', 5: 'var(--c3)', 6: 'var(--c2)', 7: 'var(--slot-line)' };
  function planDoorsText(plan) {
    return plan.doors.map(function (k) { return 'Raum ' + k.replace('-', ' und Raum '); }).join('; ');
  }
  function planLabel(plan) {
    return 'Plan ' + plan.key + ': Eingang links bei Raum 2, Ausgang rechts bei Raum ' + plan.exit + '. Türen zwischen: ' + planDoorsText(plan) + '.';
  }
  function arrow(x, y, cls) {
    /* Pfeil nach rechts, Spitze bei x (Eingang: Spitze an der Wand) */
    return '<path class="' + P + 'arrow ' + (cls || '') + '" d="M' + (x - 40) + ' ' + (y - 11) + ' H' + (x - 16) + ' V' + (y - 22) + ' L' + x + ' ' + y + ' L' + (x - 16) + ' ' + (y + 22) + ' V' + (y + 11) + ' H' + (x - 40) + ' Z"/>';
  }
  function routePoints(plan, rooms, complete) {
    var pts = [[-30, 229.5], [0, 229.5]], i;
    for (i = 0; i < rooms.length; i++) {
      pts.push(CENTER[rooms[i]]);
      if (i + 1 < rooms.length && hasDoor(plan, rooms[i], rooms[i + 1])) { pts.push(doorMid(dk(rooms[i], rooms[i + 1]))); }
    }
    if (complete) { var ex = EXITS[plan.exit]; pts.push([ex.x - 16, (ex.a + ex.b) / 2]); pts.push([ex.x + 24, (ex.a + ex.b) / 2]); }
    return pts;
  }
  function planSvg(plan, o) {
    o = o || {};
    var s = '<svg class="' + P + 'plan" viewBox="-46 -8 440 330" role="img" aria-label="' + planLabel(plan) + '">', r;
    for (r = 1; r <= 7; r++) {
      var q = ROOMS[r], c = CENTER[r];
      var inner = '<rect class="' + P + 'room" style="--rc:' + COLORS[r] + '" x="' + q[0] + '" y="' + q[1] + '" width="' + q[2] + '" height="' + q[3] + '"/>' +
        '<text class="' + P + 'num" x="' + (r === 2 ? 58 : c[0]) + '" y="' + (r === 2 ? 197 : c[1]) + '">' + r + '</text>';
      if (o.interactive) {
        var vis = o.visited && o.visited.indexOf(r) >= 0;
        s += '<g class="' + P + 'rm' + (vis ? ' visited' : '') + (o.canGo && o.canGo.indexOf(r) >= 0 ? ' can' : '') + '" data-room="' + r + '" role="button" tabindex="0" aria-label="Raum ' + r + (vis ? ', schon besucht' : '') + '">' + inner + '</g>';
      } else s += inner;
    }
    /* Türen: Wand durchbrechen + zwei kleine Striche wie im Heft */
    function door(d) {
      if (d.o === 'h') return '<line class="' + P + 'gap" x1="' + d.a + '" y1="' + d.at + '" x2="' + d.b + '" y2="' + d.at + '"/><path class="' + P + 'tick" d="M' + d.a + ' ' + (d.at - 5) + ' V' + (d.at + 5) + ' M' + d.b + ' ' + (d.at - 5) + ' V' + (d.at + 5) + '"/>';
      return '<line class="' + P + 'gap" x1="' + d.at + '" y1="' + d.a + '" x2="' + d.at + '" y2="' + d.b + '"/><path class="' + P + 'tick" d="M' + (d.at - 5) + ' ' + d.a + ' H' + (d.at + 5) + ' M' + (d.at - 5) + ' ' + d.b + ' H' + (d.at + 5) + '"/>';
    }
    plan.doors.forEach(function (k) { s += door(DOORS[k]); });
    s += '<line class="' + P + 'gap" x1="0" y1="' + ENTRY.a + '" x2="0" y2="' + ENTRY.b + '"/><path class="' + P + 'tick" d="M-5 ' + ENTRY.a + ' H5 M-5 ' + ENTRY.b + ' H5"/>';
    var ex = EXITS[plan.exit];
    s += '<line class="' + P + 'gap" x1="350" y1="' + ex.a + '" x2="350" y2="' + ex.b + '"/><path class="' + P + 'tick" d="M345 ' + ex.a + ' H355 M345 ' + ex.b + ' H355"/>';
    s += arrow(0, 229.5, 'in') + arrow(390, (ex.a + ex.b) / 2, 'out');
    if (o.route && o.route.length) {
      s += '<polyline class="' + P + 'route ' + (o.done ? 'done' : '') + '" points="' + routePoints(plan, o.route, o.done).map(function (p) { return p[0] + ',' + p[1]; }).join(' ') + '"/>';
      o.route.forEach(function (rr, i) { s += '<circle class="' + P + 'stepdot" cx="' + (CENTER[rr][0] + (rr === 2 ? 0 : 0)) + '" cy="' + (CENTER[rr][1] + 34) + '" r="11"/><text class="' + P + 'stepnum" x="' + CENTER[rr][0] + '" y="' + (CENTER[rr][1] + 34) + '">' + (i + 1) + '</text>'; });
    }
    return s + '</svg>';
  }

  /* ---------- Zustand ---------- */
  var el, api, selected, locked, mark, cards, noteEl;
  var tryIdx, tryPaths, tryBox;

  function reset() { selected = null; mark = null; tryIdx = 0; tryPaths = [[], [], [], []]; }

  function refresh() {
    cards.forEach(function (card, i) {
      var on = selected === i, ok = i === RIGHT;
      card.setAttribute('aria-checked', String(on));
      card.tabIndex = (selected === null ? i === 0 : on) ? 0 : -1;
      card.setAttribute('aria-disabled', locked ? 'true' : 'false');
      card.classList.toggle('selected', on);
      card.classList.toggle('right', on && mark !== null && ok);
      card.classList.toggle('wrong', on && mark === 'check' && !ok);
      var m = card.querySelector('.' + P + 'mark');
      if (m) m.remove();
      if (on && mark !== null) card.appendChild(h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
      var showRoute = mark === 'solution' && ok;
      card.querySelector('.' + P + 'pic').innerHTML = planSvg(PLANS[i], showRoute ? { route: SOLUTION_ROUTE, done: true } : {});
    });
    noteEl.textContent = selected === null ? 'Tippe auf den Plan, bei dem man einen Rundgang machen kann.' : 'Du hast Plan ' + PLANS[selected].key + ' gewählt.';
    drawTry();
  }
  function choose(i, focus) {
    if (locked) return;
    selected = i;
    refresh();
    if (focus) cards[i].focus();
    api.changed();
  }
  function onKey(e) {
    var k = e.key, i = cards.indexOf(e.currentTarget), to = null;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % cards.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + cards.length - 1) % cards.length;
    else if (k === ' ' || k === 'Enter') { e.preventDefault(); choose(i, true); return; }
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }

  /* ---------- Zum Ausprobieren: Weg durch das Museum ---------- */
  function tryStatus() {
    var plan = PLANS[tryIdx], path = tryPaths[tryIdx];
    if (!path.length) return 'Tippe zuerst auf den Raum, in dem du das Museum betrittst (Eingang links).';
    var txt = 'Dein Weg: außen → ' + path.join(' → ');
    var last = path[path.length - 1];
    if (path.length === 7) {
      return last === plan.exit ? txt + ' → außen. Das ist ein Rundgang: Jeder Raum genau einmal, am Ausgang bist du wieder draußen.' :
        txt + '. Alle Räume sind besucht, aber der Ausgang liegt bei Raum ' + plan.exit + '.';
    }
    var nb = neighbours(plan, last).filter(function (n) { return path.indexOf(n) < 0; });
    if (!nb.length) return txt + '. Hier geht es nicht weiter, ohne einen Raum ein zweites Mal zu betreten. Geh einen Schritt zurück.';
    return txt + '. Weiter mit Raum ' + nb.join(', ') + '.';
  }
  function tryCanGo() {
    var plan = PLANS[tryIdx], path = tryPaths[tryIdx];
    if (!path.length) return [ENTRY.room];
    return neighbours(plan, path[path.length - 1]).filter(function (n) { return path.indexOf(n) < 0; });
  }
  function drawTry() {
    if (!tryBox) return;
    var plan = PLANS[tryIdx], path = tryPaths[tryIdx];
    var done = path.length === 7 && path[6] === plan.exit;
    tryBox.tabs.forEach(function (b, i) { b.setAttribute('aria-pressed', String(i === tryIdx)); b.classList.toggle('on', i === tryIdx); });
    tryBox.pic.innerHTML = planSvg(plan, { interactive: true, route: path, done: done, visited: path, canGo: tryCanGo() });
    tryBox.status.textContent = tryStatus();
    tryBox.status.classList.toggle('good', done);
    tryBox.undo.disabled = !path.length;
    tryBox.clear.disabled = !path.length;
  }
  function tryRoom(r) {
    var plan = PLANS[tryIdx], path = tryPaths[tryIdx];
    if (!path.length) { if (r === ENTRY.room) path.push(r); }
    else if (path[path.length - 1] === r) path.pop();
    else if (path.indexOf(r) < 0 && hasDoor(plan, path[path.length - 1], r)) path.push(r);
    drawTry();
    var b = tryBox.pic.querySelector('[data-room="' + r + '"]');
    if (b) b.focus();
  }

  Biber.register({
    id: 'rundgang20',
    story:
      '<p>Ein neues Museum wird geplant. Die Besucher sollen darin einen Rundgang machen. Bei einem Rundgang geht man durch alle Räume und betritt jeden Raum nur einmal.</p>' +
      '<p>Es werden vier Pläne gemacht. Alle haben sieben Räume (1 bis 7). Die Pfeile zeigen, wo die Besucher in das Museum hineingehen und wo sie wieder hinausgehen sollen. Die kleinen Striche in den Wänden sind die Türen.</p>',
    question: 'Nur bei einem Plan kann man einen Rundgang machen. Bei welchem?',
    howto: 'Tippe auf den Plan, den du für richtig hältst. Unter den Plänen kannst du einen Weg durch jeden Plan selbst ausprobieren.',
    explanation: function () {
      return '<p>Nur <strong>Plan C</strong> erlaubt einen Rundgang, und zwar so: Eingang → 2 → 1 → 3 → 4 → 7 → 6 → 5 → Ausgang. Jeder Raum kommt genau einmal vor.</p>' +
        '<p>Hat ein Raum nur eine Tür, kann man ihn nicht auf einem Rundgang besuchen: Man müsste durch dieselbe Tür zurück und beträte den Raum davor ein zweites Mal. Deshalb gehen die Pläne A (Raum 1 hat nur eine Tür) und D (Raum 6 hat nur eine Tür) nicht. ' +
        'In Plan B liegen die Räume 5 und 7 jeweils nur an zwei Türen und führen beide über Raum 6. Dann müsste man Raum 6 zweimal betreten, um danach zum Ausgang bei Raum 6 zu kommen.</p>' +
        '<p>Auf den Plan kommt es nur an den Türen an, nicht auf Größe und Lage der Räume. Man kann ihn als <strong>Graph</strong> zeichnen: Räume (und „außen“) sind Knoten, Türen sind Kanten. Ein Rundgang ist dann ein Weg, der jeden Knoten genau einmal besucht und zum Start zurückkehrt, ein <strong>Hamiltonkreis</strong>. Ihn zu finden ist im Allgemeinen ein sehr schweres Problem; bei so kleinen Graphen kann man aber systematisch ausprobieren.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      noteEl = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      cards = PLANS.map(function (plan, i) {
        var card = h('div', {
          role: 'radio', tabindex: '0', class: P + 'card', 'data-opt': plan.key, 'aria-label': 'Antwort ' + plan.key + ': ' + planLabel(plan),
          onclick: function () { choose(i, false); }, onkeydown: onKey
        });
        card.appendChild(h('span', { class: P + 'key', 'aria-hidden': 'true' }, plan.key + ')'));
        card.appendChild(h('div', { class: P + 'pic', 'aria-hidden': 'true' }));
        return card;
      });
      tryBox = {
        tabs: PLANS.map(function (plan, i) {
          return h('button', { type: 'button', class: P + 'tab', 'aria-pressed': 'false', onclick: function () { tryIdx = i; drawTry(); } }, 'Plan ' + plan.key);
        }),
        pic: h('div', { class: P + 'trypic' }),
        status: h('p', { class: P + 'status', role: 'status', 'aria-live': 'polite' }),
        undo: h('button', { type: 'button', class: 'btn ghost ' + P + 'small', onclick: function () { tryPaths[tryIdx].pop(); drawTry(); } }, 'Einen Schritt zurück'),
        clear: h('button', { type: 'button', class: 'btn ghost ' + P + 'small', onclick: function () { tryPaths[tryIdx] = []; drawTry(); } }, 'Neu beginnen')
      };
      tryBox.pic.addEventListener('click', function (e) { var g = e.target.closest('[data-room]'); if (g) tryRoom(Number(g.dataset.room)); });
      tryBox.pic.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var g = e.target.closest('[data-room]');
        if (g) { e.preventDefault(); tryRoom(Number(g.dataset.room)); }
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('div', { class: P + 'cards', role: 'radiogroup', 'aria-label': 'Die vier Pläne' }, cards),
        noteEl,
        h('section', { class: P + 'try', 'aria-label': 'Zum Ausprobieren: Weg durch das Museum' },
          h('h3', null, 'Zum Ausprobieren: Dein Rundgang'),
          h('div', { class: P + 'tabs', role: 'group', 'aria-label': 'Plan wählen' }, tryBox.tabs),
          tryBox.pic, tryBox.status,
          h('div', { class: P + 'tryact' }, tryBox.undo, tryBox.clear))));
      refresh();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () {
      return { correct: selected === RIGHT, answer: { choice: PLANS[selected].key } };
    },
    setAnswer: function (ans) {
      var i = PLANS.map(function (p) { return p.key; }).indexOf(ans && ans.choice);
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
