/* Aufgabe Möglichst bald! (Heft 2021, S. 38; Klasse 7-8 schwer, 9-10 mittel, 11-13 einfach): kürzeste Zeit für ein Treffen mit Fahrzeugen, Lösungssuche von beiden Seiten */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-moeglichstbald21-';
  var DIR = 'assets/moeglichstbald21/';

  var COLS = 10, ROWS = 6;
  /* Karte aus dem Heft (Zeile, Spalte ab 0) */
  var WATER = [[1, 1], [1, 2], [2, 2], [3, 6], [4, 5], [4, 6], [4, 7], [5, 7]];
  var VEH = [{ r: 0, c: 9, v: 1 }, { r: 2, c: 0, v: 2 }, { r: 2, c: 4, v: 2 }, { r: 5, c: 1, v: 1 }];   /* v: 1 Fahrrad, 2 Auto */
  var START = { g: { r: 4, c: 1 }, b: { r: 1, c: 9 } };
  var SPEED = [1, 2, 5];
  var VNAME = ['zu Fuß', 'Fahrrad', 'Auto'];
  var WHO = { g: 'Mädchen', b: 'Junge' };
  var OPTIONS = [1, 2, 3, 4, 5, 6].map(function (n, i) { return { key: 'ABCDEF'.charAt(i), min: n, text: n + (n === 1 ? ' Minute' : ' Minuten') }; });
  var RIGHT = 3;   /* D: 4 Minuten; im Heft bestätigt und per Skript (Suche über alle Wege, mit und ohne Wechsel mitten in der Minute) geprüft */

  var water = {}, veh = {};
  WATER.forEach(function (w) { water[w[0] * COLS + w[1]] = true; });
  VEH.forEach(function (v) { veh[v.r * COLS + v.c] = v.v; });
  function idx(p) { return p.r * COLS + p.c; }
  function adjacent(a, b) { return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1; }

  var el, api, radios, selected, locked, mark;
  var sim, active, cellEls, infoEls, msgEl, undoBtn, whoBtns, area;

  function newFriend(k) { return { pos: { r: START[k].r, c: START[k].c }, vehicle: 0, minutes: 0, used: 99, trail: [] }; }
  function reset() { selected = null; mark = null; }
  function resetSim() { sim = { g: newFriend('g'), b: newFriend('b') }; active = active || 'g'; }

  function snapshot(f) { return { pos: { r: f.pos.r, c: f.pos.c }, vehicle: f.vehicle, minutes: f.minutes, used: f.used }; }
  function tryMove(k, to) {
    var f = sim[k], msg = '';
    if (to.r < 0 || to.r >= ROWS || to.c < 0 || to.c >= COLS) return;
    if (water[idx(to)]) { msg = 'Wasserflächen kann niemand überqueren.'; }
    else if (!adjacent(f.pos, to)) { msg = 'Ein Schritt geht nur auf ein Nachbarfeld: nach links, rechts, oben oder unten.'; }
    else {
      f.trail.push(snapshot(f));
      if (f.used >= SPEED[f.vehicle]) { f.minutes++; f.used = 0; }
      f.used++;
      f.pos = { r: to.r, c: to.c };
      var v = veh[idx(to)] || 0;
      if (v > f.vehicle) { f.vehicle = v; f.used = 99; msg = (k === 'g' ? 'Das Mädchen' : 'Der Junge') + ' nimmt das ' + VNAME[v] + ' (ab der nächsten Minute).'; }
    }
    draw(msg);
  }
  function undo() {
    var f = sim[active];
    if (!f.trail.length) return;
    var s = f.trail.pop();
    f.pos = s.pos; f.vehicle = s.vehicle; f.minutes = s.minutes; f.used = s.used;
    draw('');
  }
  function restart() { sim = null; resetSim(); draw(''); }

  function meetText() {
    var g = sim.g, b = sim.b;
    if (g.pos.r === b.pos.r && g.pos.c === b.pos.c) {
      var t = Math.max(g.minutes, b.minutes);
      return 'Ihr trefft euch auf einem Feld! Das Mädchen braucht dafür ' + g.minutes + ' und der Junge ' + b.minutes + ' Minuten, zusammen vergehen ' + t + ' Minuten.';
    }
    return '';
  }

  function faceImg(k, small) {
    return h('img', { class: P + 'face' + (small ? ' ghost' : ''), src: DIR + (k === 'g' ? 'girl' : 'boy') + '.png', alt: '', width: 120, height: 130, draggable: 'false' });
  }
  function draw(msg) {
    cellEls.forEach(function (c) {
      var i = c.i, p = { r: Math.floor(i / COLS), c: i % COLS };
      var kids = [], cls = P + 'cell';
      if (veh[i]) kids.push(h('img', { class: P + 'veh', src: DIR + (veh[i] === 2 ? 'auto' : 'rad') + '.png', alt: '', width: 120, height: 130, draggable: 'false' }));
      ['g', 'b'].forEach(function (k) {
        var f = sim[k];
        var onTrail = f.trail.some(function (s) { return s.pos.r === p.r && s.pos.c === p.c; });
        if (onTrail || (START[k].r === p.r && START[k].c === p.c)) cls += ' trail-' + k;
        if (f.pos.r === p.r && f.pos.c === p.c) { kids.push(h('span', { class: P + 'me ' + P + 'me-' + k, 'aria-hidden': 'true' }, faceImg(k))); cls += ' on-' + k; }
        else if (START[k].r === p.r && START[k].c === p.c) kids.push(h('span', { class: P + 'start', 'aria-hidden': 'true' }, faceImg(k, true)));
      });
      var occ = ['g', 'b'].filter(function (k) { return sim[k].pos.r === p.r && sim[k].pos.c === p.c; }).map(function (k) { return WHO[k]; });
      c.btn.className = cls;
      c.btn.replaceChildren.apply(c.btn, kids);
      c.btn.setAttribute('aria-label', 'Feld Zeile ' + (p.r + 1) + ', Spalte ' + (p.c + 1) + (veh[i] ? ', ' + (veh[i] === 2 ? 'Auto' : 'Fahrrad') : '') + (occ.length ? ', hier steht: ' + occ.join(' und ') : ''));
      c.btn.disabled = !!locked;
    });
    ['g', 'b'].forEach(function (k) {
      var f = sim[k];
      infoEls[k].textContent = WHO[k] + ': ' + f.minutes + ' ' + (f.minutes === 1 ? 'Minute' : 'Minuten') + ', ' + (f.vehicle ? 'mit ' + (f.vehicle === 2 ? 'dem Auto' : 'dem Fahrrad') : 'zu Fuß');
      whoBtns[k].setAttribute('aria-pressed', String(active === k));
      whoBtns[k].classList.toggle('on', active === k);
      whoBtns[k].disabled = !!locked;
    });
    msgEl.textContent = msg || meetText() || 'Wähle, wen du bewegst, und tippe auf ein Nachbarfeld oder nutze die Pfeiltasten.';
    undoBtn.disabled = !!locked || !sim[active].trail.length;
  }

  function onCell(i) {
    if (locked) return;
    tryMove(active, { r: Math.floor(i / COLS), c: i % COLS });
  }
  function onKeyArea(e) {
    var d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
    if (!d || locked) return;
    e.preventDefault();
    var f = sim[active];
    tryMove(active, { r: f.pos.r + d[0], c: f.pos.c + d[1] });
  }

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

  var WAVE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9c2-3 4-3 6 0s4 3 6 0 4-3 6 0M3 15c2-3 4-3 6 0s4 3 6 0 4-3 6 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  Biber.register({
    id: 'moeglichstbald21',
    story:
      '<p>Zwei Freunde wollen sich möglichst bald treffen. In einem Schritt bewegen sie sich von einem Feld zum nächsten: nach links, rechts, oben oder unten. Nach jedem Schritt können sie die Richtung wechseln.</p>' +
      '<p>Zuerst gehen die Freunde zu Fuß. Aber wenn sie auf ein Feld mit einem Fahrzeug kommen, können sie es benutzen. Wasserflächen können sie nicht überqueren.</p>' +
      '<p>In einer Minute schaffen sie:</p>' +
      '<table class="' + P + 'speed"><thead><tr><th>zu Fuß</th><th>mit dem Fahrrad</th><th>mit dem Auto</th></tr></thead><tbody><tr><td>1 Schritt</td><td>2 Schritte</td><td>5 Schritte</td></tr></tbody></table>',
    question: 'Wie viele Minuten benötigen die beiden Freunde mindestens, um sich auf einem Feld zu treffen?',
    howto: 'Wähle eine Antwort. Zum Ausprobieren kannst du die beiden Freunde über die Karte laufen lassen: Fahrzeuge nehmen sie auf, wenn sie auf deren Feld stehen bleiben; das Fahrzeug gilt ab der nächsten Minute.',
    explanation: function () {
      return '<p>Eine Möglichkeit mit <strong>4 Minuten</strong>: Das Mädchen geht 3 Schritte zu Fuß bis zum Auto links (3 Minuten) und fährt in der 4. Minute 5 Schritte: zwei nach oben und drei nach rechts. Der Junge geht 1 Schritt zum Fahrrad (1 Minute) und fährt dann in 3 Minuten 6 Schritte nach links. Beide stehen nach 4 Minuten auf demselben Feld in der obersten Reihe.</p>' +
        '<p>Weniger als 4 Minuten geht nicht: Auf dem kürzesten Weg sind sie 11 Schritte voneinander entfernt, mit dem Auto allein bräuchten sie mehr als 2 Minuten. In 3 Minuten schaffen sie zu Fuß nur 6 Schritte zusammen. Mit dem Fahrrad wären es 12 Schritte, aber die beiden Fahrräder sind 13 Schritte voneinander entfernt. Das Mädchen erreicht in 3 Minuten ein Auto, kann es dann aber nicht mehr benutzen, und der Junge erreicht in 3 Minuten gar kein Auto.</p>' +
        '<p>Hier hilft es, von beiden Seiten gleichzeitig zu suchen: Man schaut, wo jeder in 1, 2, 3 … Minuten sein kann, und prüft, ob sich die Bereiche berühren. Das nennt man bidirektionale Suche.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset(); active = 'g'; resetSim();
      cellEls = [];
      var cells = [];
      for (var i = 0; i < ROWS * COLS; i++) {
        if (water[i]) { var w = h('div', { class: P + 'water', 'aria-hidden': 'true' }); w.innerHTML = WAVE; cells.push(w); continue; }
        (function (ii) {
          var btn = h('button', { type: 'button', class: P + 'cell', tabindex: '-1', onclick: function () { onCell(ii); } });
          cellEls.push({ i: ii, btn: btn });
          cells.push(btn);
        })(i);
      }
      area = h('div', { class: P + 'area', tabindex: '0', role: 'group', 'aria-label': 'Karte mit 6 Zeilen und 10 Spalten. Mit den Pfeiltasten bewegst du die ausgewählte Person.', onkeydown: onKeyArea },
        h('div', { class: P + 'grid' }, cells));
      whoBtns = {}; infoEls = {};
      ['g', 'b'].forEach(function (k) {
        whoBtns[k] = h('button', { type: 'button', class: P + 'who ' + P + 'who-' + k, 'aria-pressed': 'false', onclick: function () { active = k; draw(''); } },
          faceImg(k), h('span', null, WHO[k] + ' bewegen'));
        infoEls[k] = h('p', { class: P + 'info ' + P + 'info-' + k });
      });
      msgEl = h('p', { class: P + 'msg', role: 'status', 'aria-live': 'polite' });
      undoBtn = h('button', { type: 'button', class: 'btn ghost ' + P + 'btn', onclick: undo }, 'Schritt zurück');
      var restartBtn = h('button', { type: 'button', class: 'btn ghost ' + P + 'btn', onclick: restart }, 'Neu starten');
      radios = OPTIONS.map(function (o, i) {
        return h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': o.key, 'aria-label': 'Antwort ' + o.key + ': ' + o.text,
          onclick: function () { choose(i, false); }, onkeydown: onKey
        }, h('span', { class: P + 'key', 'aria-hidden': 'true' }, o.key + ')'), h('span', null, o.text));
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('div', { class: P + 'map' }, area,
          h('div', { class: P + 'ctrl' },
            h('div', { class: P + 'whos', role: 'group', 'aria-label': 'Wen möchtest du bewegen?' }, whoBtns.g, whoBtns.b),
            infoEls.g, infoEls.b, msgEl,
            h('div', { class: P + 'btns' }, undoBtn, restartBtn))),
        h('section', { 'aria-label': 'Antworten' }, h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Antworten' }, radios))));
      refresh();
      draw('');
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
      draw('');
    },
    reset: function () { reset(); restart(); refresh(); },
    showSolution: function () {
      selected = RIGHT; mark = 'solution'; locked = true;
      /* Lösungsweg aus dem Heft: Mädchen links hoch zum Auto, dann 2 hoch und 3 rechts; Junge zum Fahrrad, dann 6 nach links */
      sim = { g: newFriend('g'), b: newFriend('b') };
      var gp = [[4, 0], [3, 0], [2, 0], [1, 0], [0, 0], [0, 1], [0, 2], [0, 3]], bp = [[0, 9], [0, 8], [0, 7], [0, 6], [0, 5], [0, 4], [0, 3]];
      gp.forEach(function (p) { silentMove('g', p[0], p[1]); });
      bp.forEach(function (p) { silentMove('b', p[0], p[1]); });
      refresh();
      draw('So treffen sich beide nach 4 Minuten auf dem Feld in der obersten Reihe.');
    }
  });

  function silentMove(k, r, c) {
    var f = sim[k];
    f.trail.push(snapshot(f));
    if (f.used >= SPEED[f.vehicle]) { f.minutes++; f.used = 0; }
    f.used++;
    f.pos = { r: r, c: c };
    var v = veh[r * COLS + c] || 0;
    if (v > f.vehicle) { f.vehicle = v; f.used = 99; }
  }
})();
