/* Aufgabe Aufzüge (2018, Klasse 5-6 schwer, 7-8 mittel): Optimierung (Rucksackproblem), gieriges Vorgehen reicht nicht */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-aufzuege18-';

  var CAP = 30;
  /* Biber von links nach rechts wie im Heft: Gewicht in kg, Bild (Pixelmaße für die Darstellung) */
  var BEAVERS = [
    { kg: 2, w: 215, h: 190 }, { kg: 3, w: 170, h: 230 }, { kg: 5, w: 210, h: 255 },
    { kg: 8, w: 175, h: 340 }, { kg: 9, w: 200, h: 270 }, { kg: 9, w: 210, h: 280 },
    { kg: 12, w: 225, h: 325 }, { kg: 12, w: 235, h: 300 }, { kg: 22, w: 265, h: 310 }
  ];
  var BEST = 8;                         /* größtmögliche Anzahl Biber (per Durchprobieren aller Verteilungen geprüft) */
  /* loc[i]: 0 = auf der Wiese, 1 = Aufzug 1, 2 = Aufzug 2 */
  var SOLUTION = [1, 1, 1, 1, 2, 2, 1, 2, 0];   /* wie im Heft: 12+8+5+3+2 und 12+9+9, der 22-kg-Biber bleibt draußen */

  var el, api;
  var loc, sel, locked, mark;
  var drag = null, suppressClick = false, refocus = null;

  function reset() { loc = BEAVERS.map(function () { return 0; }); sel = null; mark = null; }
  function load(z, except) {
    var s = 0;
    BEAVERS.forEach(function (b, i) { if (loc[i] === z && i !== except) s += b.kg; });
    return s;
  }
  function placed() { return loc.filter(function (z) { return z > 0; }).length; }
  function okLoads() { return load(1) <= CAP && load(2) <= CAP; }
  function isRight() { return placed() === BEST && okLoads(); }

  function move(i, z) {
    if (locked || loc[i] === z) return false;
    if (z > 0 && load(z, i) + BEAVERS[i].kg > CAP) {
      var cab = el.querySelector('[data-drop="' + z + '"]');
      if (cab) { cab.classList.add('nope'); setTimeout(function () { cab.classList.remove('nope'); }, 600); }
      api.changed('Das passt nicht: Aufzug ' + z + ' würde dann ' + (load(z, i) + BEAVERS[i].kg) + ' kg tragen. Erlaubt sind höchstens ' + CAP + ' kg.');
      return false;
    }
    loc[i] = z;
    sel = null;
    refocus = i;
    render();
    api.changed(BEAVERS[i].kg + '-kg-Biber ' + (z ? 'in Aufzug ' + z : 'zurück auf die Wiese') + '. Jetzt in den Aufzügen: ' + placed() + ' von 9 Bibern.');
    return true;
  }

  function beaverBtn(i) {
    var b = BEAVERS[i];
    var img = h('img', { src: 'assets/aufzuege18/b' + i + '.png', alt: '', width: Math.round(b.w * 0.22), height: Math.round(b.h * 0.22), draggable: 'false' });
    img.style.width = 'calc(' + (b.w * 0.22 / 16).toFixed(3) + 'rem * var(--t-aufzuege18-k, 1))';
    return h('button', {
      type: 'button', class: P + 'bv' + (sel === i ? ' sel' : ''), 'data-bv': String(i), disabled: locked,
      'aria-pressed': String(sel === i),
      'aria-label': 'Biber, ' + b.kg + ' Kilogramm, ' + (loc[i] ? 'in Aufzug ' + loc[i] : 'auf der Wiese') + (sel === i ? ', ausgewählt' : '')
    }, img, h('span', { class: P + 'kg' }, b.kg + ' kg'));
  }

  function arrowSvg(n) {
    var s = '<svg viewBox="0 0 34 40" width="30" height="35" aria-hidden="true" focusable="false"><path d="M17 1 L33 19 H24 V39 H10 V19 H1 Z" fill="#7a1010"/>' +
      '<text x="17" y="33" text-anchor="middle" font-size="15" font-weight="700" fill="#fff" font-family="var(--font-display)">' + n + '</text></svg>';
    var sp = h('span', { class: P + 'arrow' });
    sp.innerHTML = s;
    return sp;
  }

  function lift(z) {
    var inside = [];
    BEAVERS.forEach(function (b, i) { if (loc[i] === z) inside.push(beaverBtn(i)); });
    var total = load(z);
    var names = BEAVERS.map(function (b, i) { return loc[i] === z ? b.kg + ' kg' : null; }).filter(Boolean);
    var showPut = sel !== null && loc[sel] !== z && !locked;
    return h('div', { class: P + 'lift' },
      h('div', { class: P + 'top' },
        h('span', { class: P + 'tag' }, h('small', null, 'max.'), CAP + ' kg'),
        arrowSvg(z)),
      h('div', { class: P + 'cabin', 'data-drop': String(z), role: 'group',
        'aria-label': 'Aufzug ' + z + ', ' + (names.length ? 'enthält Biber mit ' + names.join(', ') : 'leer') + ', Gesamtgewicht ' + total + ' Kilogramm' }, inside),
      h('div', { class: P + 'scale', 'aria-hidden': 'true' }, h('b', null, String(total)), ' kg'),
      showPut ? h('button', { type: 'button', class: P + 'put', 'data-put': String(z) }, 'In Aufzug ' + z + ' setzen') : null);
  }

  function render() {
    var meadow = [];
    BEAVERS.forEach(function (b, i) { if (loc[i] === 0) meadow.push(beaverBtn(i)); });
    var showBack = sel !== null && loc[sel] !== 0 && !locked;
    var cls = P + 'board' + (mark ? ' ' + mark : '');
    el.replaceChildren(h('div', { class: cls },
      h('div', { class: P + 'lifts' }, lift(1), lift(2)),
      h('div', { class: P + 'meadow', 'data-drop': '0', role: 'group', 'aria-label': 'Wiese, hier warten ' + meadow.length + ' Biber' },
        showBack ? h('button', { type: 'button', class: P + 'put back', 'data-put': '0' }, 'Zurück auf die Wiese') : null,
        h('div', { class: P + 'pool' }, meadow)),
      h('p', { class: P + 'count' }, 'In den Aufzügen: ', h('b', null, placed() + ' von 9'), ' Bibern')));
    if (refocus !== null) {
      var b = el.querySelector('[data-bv="' + refocus + '"]');
      if (b && !locked) b.focus();
      refocus = null;
    }
  }

  /* ---------- Bedienung: Antippen (auswählen, dann Ziel antippen), Ziehen, Tastatur ---------- */
  function onClick(e) {
    if (locked) return;
    if (suppressClick) { suppressClick = false; return; }
    var put = e.target.closest('[data-put]');
    if (put && sel !== null) { refocus = sel; move(sel, +put.dataset.put); return; }
    var bv = e.target.closest('[data-bv]');
    if (bv) {
      var i = +bv.dataset.bv;
      /* Ist schon ein Biber ausgewählt und ein Biber in einem anderen Aufzug (oder auf der Wiese) angetippt, gilt das als Tippen auf diesen Ort */
      if (sel !== null && sel !== i && loc[sel] !== loc[i]) { move(sel, loc[i]); return; }
      sel = sel === i ? null : i;
      refocus = i;
      render();
      api.changed(sel === null ? '' : BEAVERS[i].kg + '-kg-Biber ausgewählt. Tippe jetzt auf einen Aufzug oder die Wiese.');
      return;
    }
    var zone = e.target.closest('[data-drop]');
    if (zone && sel !== null) move(sel, +zone.dataset.drop);
  }
  function onKey(e) {
    if (locked) return;
    var bv = e.target.closest('[data-bv]');
    if (!bv) return;
    var z = { '0': 0, '1': 1, '2': 2 }[e.key];
    if (z === undefined) return;
    e.preventDefault();
    move(+bv.dataset.bv, z);
  }

  function onDown(e) {
    var bv = e.target.closest('[data-bv]');
    if (!bv || locked || (e.pointerType === 'mouse' && e.button !== 0)) return;
    drag = { i: +bv.dataset.bv, x: e.clientX, y: e.clientY, id: e.pointerId, on: false, ghost: null, btn: bv, ox: 0, oy: 0 };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onCancel);
  }
  function onMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.on) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 7) return;
      drag.on = true;
      var r = drag.btn.getBoundingClientRect();
      drag.ox = e.clientX - r.left; drag.oy = e.clientY - r.top;
      var g = drag.btn.cloneNode(true);
      g.classList.add('ghost');
      g.removeAttribute('data-bv');
      g.style.width = r.width + 'px';
      document.body.appendChild(g);
      drag.ghost = g;
      drag.btn.classList.add('lifted');
    }
    e.preventDefault();
    drag.ghost.style.left = (e.clientX - drag.ox) + 'px';
    drag.ghost.style.top = (e.clientY - drag.oy) + 'px';
    var t = document.elementFromPoint(e.clientX, e.clientY);
    var zone = t && t.closest ? t.closest('[data-drop]') : null;
    el.querySelectorAll('.over').forEach(function (n) { n.classList.remove('over'); });
    if (zone && el.contains(zone)) zone.classList.add('over');
  }
  function endDrag(d) {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onCancel);
    if (d && d.ghost && d.ghost.parentNode) d.ghost.parentNode.removeChild(d.ghost);
    el.querySelectorAll('.over').forEach(function (n) { n.classList.remove('over'); });
  }
  function onUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    var d = drag; drag = null;
    endDrag(d);
    if (!d.on) return;                       /* kein Ziehen: das folgende click-Ereignis wählt den Biber aus */
    suppressClick = true;
    setTimeout(function () { suppressClick = false; }, 50);
    var t = document.elementFromPoint(e.clientX, e.clientY);
    var zone = t && t.closest ? t.closest('[data-drop]') : null;
    if (zone && el.contains(zone)) { if (!move(d.i, +zone.dataset.drop)) { d.btn.classList.remove('lifted'); render(); } }
    else { d.btn.classList.remove('lifted'); render(); }
  }
  function onCancel() {
    var d = drag; drag = null;
    endDrag(d);
    if (d && d.on) { d.btn.classList.remove('lifted'); render(); }
  }

  Biber.register({
    id: 'aufzuege18',
    story: '<p>Auf einer Reise sind die Biber an einem Aussichtsturm angekommen. Der Turm hat zwei Aufzüge. Jeder Aufzug kann höchstens 30 kg transportieren.</p>' +
      '<p>Die Biber wollen schnell auf den Turm.</p>',
    question: 'Verteile die Biber so auf die Aufzüge, dass möglichst viele Biber gleichzeitig hineinpassen.',
    howto: 'Ziehe die Biber in die Aufzüge. Du kannst auch einen Biber antippen und dann den Aufzug (oder die Wiese) antippen. Mit der Tastatur: Biber mit Tab anwählen und die Taste 1 oder 2 für den Aufzug, 0 für die Wiese drücken.',
    explanation: function () {
      return '<p>Es passen <strong>acht</strong> Biber hinein. Zusammen wiegen die Biber ohne den 22-kg-Biber genau 60 kg, also genau so viel, wie beide Aufzüge tragen. Eine Möglichkeit: In Aufzug 1 fahren die Biber mit 12, 8, 5, 3 und 2 kg (zusammen 30 kg), in Aufzug 2 die Biber mit 12, 9 und 9 kg (ebenfalls 30 kg). Der 22-kg-Biber muss draußen bleiben. Man kann die beiden Aufzüge und die beiden 12-kg-Biber vertauschen, andere Möglichkeiten gibt es nicht.</p>' +
        '<p>Ein „gieriges“ (engl. <em>greedy</em>) Vorgehen, bei dem man zuerst die leichten Biber einlädt, führt hier nicht zum Ziel: So passen nur sieben Biber hinein. Solche Optimierungsprobleme brauchen oft klügere Algorithmen, die auch andere Verteilungen ausprobieren.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset(); drag = null;
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKey);
      el.addEventListener('pointerdown', onDown);
      el.addEventListener('dragstart', function (e) { e.preventDefault(); });
      render();
    },
    isComplete: function () { return placed() > 0; },
    evaluate: function () { return { correct: isRight(), answer: { loc: loc.slice() } }; },
    setAnswer: function (ans) {
      var l = ans && ans.loc;
      if (Array.isArray(l) && l.length === BEAVERS.length) loc = l.map(function (z) { return z === 1 || z === 2 ? z : 0; });
      else loc = BEAVERS.map(function () { return 0; });
      sel = null;
      mark = isRight() ? 'right' : 'wrong';
      render();
    },
    lock: function (on) {
      locked = on; sel = null;
      mark = on ? (isRight() ? 'right' : 'wrong') : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      loc = SOLUTION.slice(); sel = null; locked = true; mark = 'right';
      render();
    }
  });
})();
