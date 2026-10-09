/* Aufgabe Bergsteiger (Biber 2020; Klasse 5-6 leicht): Greedy / Hill Climbing - von welchen Gipfeln aus erreicht Greta den höchsten? */
(function () {
  'use strict';
  var h = Biber.h, S = Biber.svg;
  var P = 't-bergsteiger20-';

  var IW = 1400, IH = 313;                       /* Bildgröße (Koordinaten der Gipfelspitzen) */
  /* Gipfel von links nach rechts: Spitze (x, y) im Bild; je kleiner y, desto höher */
  var PEAKS = [
    { x: 95, y: 196 }, { x: 175, y: 231 }, { x: 227, y: 248 }, { x: 397, y: 125 }, { x: 462, y: 178 }, { x: 565, y: 99 },
    { x: 765, y: 55 }, { x: 901, y: 127 }, { x: 964, y: 214 }, { x: 1155, y: 70 }, { x: 1256, y: 196 }
  ];
  var N = PEAKS.length;

  /* Gretas Regel: höheren Nachbarn wählen; sind beide höher, den höheren. Kein höherer Nachbar -> bleibt stehen */
  function next(i) {
    var best = -1;
    [i - 1, i + 1].forEach(function (j) {
      if (j < 0 || j >= N || PEAKS[j].y >= PEAKS[i].y) return;
      if (best < 0 || PEAKS[j].y < PEAKS[best].y) best = j;
    });
    return best;
  }
  function route(i) {
    var r = [i];
    while (next(r[r.length - 1]) >= 0) r.push(next(r[r.length - 1]));
    return r;
  }
  var TOP = 0;
  PEAKS.forEach(function (p, i) { if (p.y < PEAKS[TOP].y) TOP = i; });
  /* Startgipfel (alle außer dem höchsten selbst), von denen aus Greta den höchsten Gipfel erreicht */
  var CORRECT = [];
  PEAKS.forEach(function (p, i) { if (i !== TOP && route(i).pop() === TOP) CORRECT.push(i); });
  /* CORRECT = [4, 5, 7] (Gipfel 5, 6, 8 von links): stimmt mit den drei eingekreisten Gipfeln im Heft überein */

  function label(i) { return 'Gipfel ' + (i + 1); }

  var el, api, locked, sel, mode, tryMode, markers, stage, arrows, msg, tryBtn, timers, trail;

  function reset() { sel = []; mode = null; trail = []; }

  /* ---------- Pfeile ---------- */
  function arrowPath(a, b, cls) {
    var x1 = PEAKS[a].x, y1 = PEAKS[a].y - 12, x2 = PEAKS[b].x, y2 = PEAKS[b].y - 12;
    var cx = (x1 + x2) / 2, cy = Math.min(y1, y2) - 30 - Math.abs(x2 - x1) * 0.18;
    var ang = Math.atan2(y2 - cy, x2 - cx), L = 20, W = 0.45;
    var hx1 = x2 - L * Math.cos(ang - W), hy1 = y2 - L * Math.sin(ang - W), hx2 = x2 - L * Math.cos(ang + W), hy2 = y2 - L * Math.sin(ang + W);
    return S('g', { class: P + 'arrow ' + cls },
      S('path', { d: 'M' + x1 + ' ' + y1 + ' Q' + cx + ' ' + cy + ' ' + x2 + ' ' + y2, class: P + 'curve' }),
      S('path', { d: 'M' + hx1 + ' ' + hy1 + ' L' + x2 + ' ' + y2 + ' L' + hx2 + ' ' + hy2, class: P + 'head' }));
  }
  function drawArrows() {
    arrows.replaceChildren();
    if (mode) {
      for (var i = 0; i < N; i++) {
        var n = next(i);
        if (n >= 0) arrows.appendChild(arrowPath(i, n, route(i).pop() === TOP ? P + 'good' : P + 'stuck'));
      }
    } else {
      trail.forEach(function (st) { arrows.appendChild(arrowPath(st[0], st[1], P + 'trail')); });
    }
  }

  /* ---------- Markierungen ---------- */
  function ok(i) { return CORRECT.indexOf(i) >= 0; }
  function renderMarkers() {
    markers.forEach(function (b, i) {
      var on = sel.indexOf(i) >= 0, cls = P + 'mk';
      var txt = label(i) + (i === TOP ? ', höchster Gipfel, Ziel' : '');
      if (i === TOP) cls += ' top';
      if (on) cls += ' on';
      if (mode && i !== TOP) {
        if (on && ok(i)) cls += ' right';
        else if (on) cls += ' wrong';
        else if (ok(i)) cls += ' missing';
      }
      if (on) txt += ', ausgewählt';
      if (mode && i !== TOP) {
        if (on && ok(i)) txt += ', richtig';
        else if (on) txt += ', falsch';
        else if (ok(i)) txt += ', hätte ausgewählt werden müssen';
      }
      b.className = cls;
      b.setAttribute('aria-label', txt);
      b.setAttribute('aria-pressed', i === TOP ? 'false' : String(on));
      b.disabled = !!locked || (i === TOP && !tryMode);
      b.firstChild.textContent = i === TOP ? '⚑' : (on ? '✓' : '');
    });
    tryBtn.setAttribute('aria-pressed', String(tryMode));
    tryBtn.className = P + 'try' + (tryMode ? ' on' : '');
    tryBtn.disabled = !!locked;
  }
  function render() {
    renderMarkers();
    drawArrows();
    stage.setAttribute('data-try', tryMode ? '1' : '');
  }

  function stopTimers() { timers.forEach(clearTimeout); timers = []; }
  function say(t) { msg.textContent = t; }

  function walk(i) {
    stopTimers();
    var r = route(i), steps = [];
    for (var k = 0; k + 1 < r.length; k++) steps.push([r[k], r[k + 1]]);
    trail = [];
    drawArrows();
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!steps.length) {
      say(i === TOP ? label(i) + ' ist der höchste Gipfel: Hier ist Greta schon am Ziel.' : 'Greta startet auf ' + label(i) + '. Kein Nachbar-Gipfel ist höher, also bleibt sie hier stehen.');
      return;
    }
    say('Greta startet auf ' + label(i) + ' ...');
    function finish() {
      var e = r[r.length - 1];
      say('Greta startet auf ' + label(i) + ' und klettert über ' + steps.length + (steps.length === 1 ? ' Schritt' : ' Schritte') + ' bis ' + label(e) + '. ' +
        (e === TOP ? 'Das ist der höchste Gipfel.' : 'Dort hat sie keinen höheren Nachbarn und bleibt stehen: ein nur lokal höchster Gipfel.'));
    }
    steps.forEach(function (st, k) {
      function go() {
        trail.push(st);
        drawArrows();
        if (k === steps.length - 1) finish();
      }
      if (still) go(); else timers.push(setTimeout(go, 500 * (k + 1)));
    });
  }

  function onMarker(i) {
    if (tryMode) { walk(i); return; }
    if (locked || i === TOP) return;
    var at = sel.indexOf(i);
    if (at >= 0) sel.splice(at, 1); else sel.push(i);
    renderMarkers();
    api.changed(sel.length + (sel.length === 1 ? ' Gipfel' : ' Gipfel') + ' markiert');
  }
  function setTry(on) {
    if (locked) return;
    tryMode = on;
    stopTimers();
    trail = [];
    say(on ? 'Tippe auf einen Gipfel: Greta klettert von dort los und du siehst ihren Weg.' : '');
    render();
  }

  function sameSet(a, b) {
    return a.length === b.length && a.every(function (x) { return b.indexOf(x) >= 0; });
  }

  Biber.register({
    id: 'bergsteiger20',
    story:
      '<p>Greta klettert am liebsten in den Gipfeln des Bibergebirges.</p>' +
      '<p>Sobald sie einen Gipfel erreicht hat, schaut sie sich die beiden Nachbar-Gipfel an:</p>' +
      '<ul><li>Ist nur ein Nachbar-Gipfel höher, klettert sie auf diesen Gipfel.</li>' +
      '<li>Sind beide Nachbar-Gipfel höher, klettert sie auf den höheren der beiden.</li></ul>' +
      '<p>Das wiederholt sie so lange, bis sie einen Gipfel erreicht, der keinen höheren Nachbarn hat.</p>',
    question: 'Von welchen Gipfeln aus erreicht Greta so den höchsten Gipfel?',
    howto: 'Tippe die Gipfel an (Kreise), von denen aus Greta den höchsten Gipfel erreicht, und tippe sie noch einmal an, um sie abzuwählen. Der höchste Gipfel (Fahne) ist das Ziel. Mit „Greta klettern lassen“ kannst du zuerst ausprobieren, wohin sie von einem Gipfel aus klettert.',
    explanation: function () {
      return '<p>Von jedem Gipfel aus folgt man Gretas Regel Schritt für Schritt: immer zum höheren Nachbarn, solange einer höher ist. Drei Startgipfel führen so zum höchsten Gipfel: ' +
        'der <strong>sechste</strong> und der <strong>achte</strong> Gipfel von links (sie sind direkte Nachbarn des höchsten) und der <strong>fünfte</strong> Gipfel. Der fünfte hat zwei höhere Nachbarn und wählt den höheren, den sechsten Gipfel, und von dort geht es zum höchsten.</p>' +
        '<p>Alle anderen Wege bleiben auf einem Gipfel ohne höheren Nachbarn stecken, der aber nicht der höchste ist: Von den Gipfeln 1 und 2 geht es bis Gipfel 1, von Gipfel 3 und 4 endet es auf Gipfel 4, und von den Gipfeln 9, 10 und 11 endet es auf der großen runden Kuppe rechts.</p>' +
        '<p>Gretas Vorgehen ist ein „gieriger“ (greedy) Algorithmus, in der Informatik als Bergsteigeralgorithmus (hill climbing) bekannt: In jedem Schritt wird gewählt, was gerade am besten aussieht. Das ist einfach, findet aber nicht immer das beste Gesamtergebnis, sondern manchmal nur ein lokales Optimum.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; tryMode = false; timers = []; reset();
      var img = h('img', { class: P + 'img', src: 'assets/bergsteiger20/berge.png', width: IW, height: IH, alt: 'Gebirge mit elf Gipfeln unterschiedlicher Höhe. Der höchste Gipfel mit Schneekappe liegt in der Mitte, rechts davon eine große runde Kuppe.', draggable: 'false' });
      arrows = S('g', {});
      var svg = S('svg', { class: P + 'svg', viewBox: '0 0 ' + IW + ' ' + IH, 'aria-hidden': 'true', focusable: 'false' }, arrows);
      stage = h('div', { class: P + 'stage' }, img, svg);
      markers = PEAKS.map(function (p, i) {
        var b = h('button', {
          type: 'button', class: P + 'mk', 'aria-pressed': 'false',
          style: 'left:' + (p.x / IW * 100) + '%;top:' + (p.y / IH * 100) + '%',
          onclick: function () { onMarker(i); }
        }, h('span', { 'aria-hidden': 'true' }));
        stage.appendChild(b);
        return b;
      });
      tryBtn = h('button', { type: 'button', class: P + 'try', 'aria-pressed': 'false', onclick: function () { setTry(!tryMode); } }, 'Greta klettern lassen');
      msg = h('p', { class: P + 'msg', role: 'status', 'aria-live': 'polite' });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('p', { class: P + 'swipe' }, 'Wische seitlich, um das ganze Gebirge zu sehen.'),
        h('div', { class: P + 'scroll', tabindex: '-1' }, stage),
        h('div', { class: P + 'bar' }, tryBtn, msg)));
      render();
    },
    isComplete: function () { return sel.length > 0; },
    evaluate: function () {
      var s = sel.slice().sort(function (a, b) { return a - b; });
      return { correct: sameSet(s, CORRECT), answer: s };
    },
    setAnswer: function (ans) {
      stopTimers(); tryMode = false;
      sel = Array.isArray(ans) ? ans.slice() : [];
      mode = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      stopTimers();
      if (on) { tryMode = false; mode = 'check'; say(''); } else { mode = null; }
      render();
    },
    reset: function () { stopTimers(); reset(); tryMode = false; locked = false; say(''); render(); },
    showSolution: function () {
      stopTimers(); tryMode = false;
      sel = CORRECT.slice(); mode = 'solution'; locked = true;
      say('Die Pfeile zeigen, wohin Greta von jedem Gipfel aus klettert. Grüne Pfeile führen zum höchsten Gipfel.');
      render();
    }
  });
})();
