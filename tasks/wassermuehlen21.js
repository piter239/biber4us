/* Aufgabe Wassermühlen (Heft 2021, S. 61; Klasse 3-4 schwer, 5-6 mittel, 7-8 leicht): Wassersperren so schließen, dass nur die richtigen Mühlen Wasser bekommen */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-wassermuehlen21-';

  /* ---------- Modell (Bild S. 61/62) ----------
     Wasser kommt an zwei Quellen an (oben links vor A, oben Mitte vor B).
     Eine Strecke führt Wasser, wenn alle Sperren auf einem Weg von der Quelle bis dorthin offen sind. */
  var GATES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
  var WHEEL = { 1: true, 2: false, 3: true, 4: false, 5: false, 6: true };      /* Mühle -> hat schon ein Mühlrad */
  var SOLUTION = ['D', 'F', 'H'];                                             /* offizielle Lösung (Heft S. 62) */

  function flows(closed) {
    function o(x) { return closed.indexOf(x) < 0; }
    var A = o('A'), B = o('B'), C = o('C'), D = o('D'), E = o('E'), F = o('F'), G = o('G'), H = o('H'), I = o('I');
    var s = {};
    s.src1 = true; s.src2 = true;
    s.a1 = A; s.a2 = A; s.j1G = A; s.j1F = A;
    s.gI = A && G; s.iM1 = A && G && I;
    s.fM2 = A && F; s.fM3 = A && F;
    s.cM0 = A && C;
    s.bJ = B; s.bD = B; s.bE = B;
    s.dJ2 = B && D; s.d4 = B && D; s.dTrunk = B && D;
    s.trunk1 = (A && C) || (B && D);
    s.trunk2 = s.trunk1 || (A && F);
    s.e6 = B && E; s.eH = B && E; s.h5 = B && E && H;
    s.m1 = s.iM1; s.m2 = s.fM2; s.m3 = s.trunk2; s.m4 = s.d4; s.m5 = s.h5; s.m6 = s.e6;
    return s;
  }
  function wet(closed) { var f = flows(closed); return [1, 2, 3, 4, 5, 6].filter(function (i) { return f['m' + i]; }); }
  function isRight(closed) {
    var w = wet(closed);
    return [1, 2, 3, 4, 5, 6].every(function (i) { return (w.indexOf(i) >= 0) === WHEEL[i]; });
  }

  /* ---------- Zeichnung (viewBox 40 30 1330 990, Maße aus dem Heftbild nachgebaut) ---------- */
  var VB = { x: 40, y: 30, w: 1330, h: 990 };
  var SEG = [
    ['src1', 'M105 105 L108 215'],
    ['a1', 'M135 255 C200 300 330 300 410 295'],
    ['a2', 'M125 255 C170 330 215 380 228 440'],
    ['j1G', 'M228 440 C200 480 180 520 182 585'],
    ['gI', 'M182 585 C150 650 160 700 180 775'],
    ['iM1', 'M180 775 C190 850 260 900 330 925 C400 950 440 970 480 990'],
    ['j1F', 'M228 440 C280 450 340 465 400 490'],
    ['fM2', 'M430 510 C420 600 430 700 450 780 C480 870 560 910 700 960'],
    ['fM3', 'M430 510 C520 540 620 590 700 690'],
    ['cM0', 'M455 305 C520 360 620 430 700 490'],
    ['src2', 'M470 80 C500 90 530 100 560 115'],
    ['bJ', 'M600 135 C650 150 690 170 710 190'],
    ['bD', 'M710 190 C725 230 735 270 745 315'],
    ['bE', 'M710 190 C780 190 840 200 880 225'],
    ['dJ2', 'M752 345 C750 370 745 390 740 410'],
    ['dTrunk', 'M740 410 C725 440 710 470 700 500'],
    ['d4', 'M752 345 C760 400 790 480 820 570 C870 680 950 790 1080 850 C1180 890 1300 935 1350 950'],
    ['trunk1', 'M700 490 C700 560 700 620 700 690'],
    ['trunk2', 'M700 690 C705 780 740 850 800 900 C860 950 980 975 1100 995'],
    ['e6', 'M885 235 C940 290 990 340 1040 395 C1100 440 1200 460 1300 485'],
    ['eH', 'M885 235 C890 300 910 380 930 440 C950 490 965 520 985 545'],
    ['h5', 'M990 570 C1040 620 1100 650 1200 670 C1280 690 1330 730 1350 765']
  ];
  var GATE_ROT = { A: 0, B: -20, C: 90, D: 5, E: 65, F: 60, G: 5, H: 20, I: 0 };   /* Sperre quer zur Fließrichtung */
  var GATE_POS = { A: [115, 230], B: [585, 115], C: [445, 300], D: [745, 315], E: [890, 225], F: [420, 495], G: [185, 580], H: [990, 545], I: [180, 775] };
  /* Mühlen: Hausmitte, Dachfarbe */
  var MILL = {
    1: { x: 350, y: 835, roof: '#8a5a3a' }, 2: { x: 585, y: 790, roof: '#5f8a1c' }, 3: { x: 868, y: 825, roof: '#4a5f94' },
    4: { x: 1135, y: 795, roof: '#f2c200' }, 5: { x: 1215, y: 590, roof: '#8581e0' }, 6: { x: 1150, y: 325, roof: '#e0453f' }
  };
  function millSvg(i) {
    var m = MILL[i];
    var s = '<g transform="translate(' + m.x + ' ' + m.y + ')">';
    if (WHEEL[i]) {
      s += '<g class="' + P + 'wheel"><circle cx="30" cy="70" r="52" fill="none" stroke="#6b5a2e" stroke-width="12"/><circle cx="30" cy="70" r="9" fill="#6b5a2e"/>' +
        '<path d="M30 18V122M-22 70H82M-7 33L67 107M67 33L-7 107" stroke="#6b5a2e" stroke-width="7" stroke-linecap="round"/></g>' +
        '<path d="M-30 128 L110 128 L128 108" fill="none" stroke="#9aa0a6" stroke-width="10" stroke-linecap="round"/>';
    } else {
      s += '<path d="M-18 78 L-92 88" stroke="#7a6a3e" stroke-width="12" stroke-linecap="round"/><path d="M56 100 L110 100 M56 112 L110 112" stroke="#7a6a3e" stroke-width="9" stroke-linecap="round"/>';
    }
    s += '<path d="M-52 -30 L-52 62 L56 62 L56 -30Z" fill="#fbd3a6" stroke="#2b2b2b" stroke-width="5" stroke-linejoin="round"/>' +
      '<path d="M-66 -28 L2 -86 L70 -28Z" fill="' + m.roof + '" stroke="#2b2b2b" stroke-width="5" stroke-linejoin="round"/>' +
      '<path d="M-30 -10 v34 M-14 -10 v34 M16 -10 v34" stroke="#2b2b2b" stroke-width="9" stroke-linecap="round"/>' +
      '<rect x="22" y="22" width="22" height="40" rx="9" fill="#2b2b2b"/>';
    s += '</g>';
    return s;
  }
  function badgePos(i) { var m = MILL[i]; return { x: m.x + 60, y: m.y + 150 }; }
  var BADGE = { 1: [455, 1005], 2: [700, 990], 3: [1010, 1000], 4: [1330, 950], 5: [1340, 770], 6: [1300, 500] };

  var el, api, locked, closed, mark;
  var dryLayer, wetLayer, segEls = {}, gateEls = {}, millEls = {}, statusEl, stageEl;

  function buildStage() {
    var svg = '<svg class="' + P + 'svg" viewBox="' + VB.x + ' ' + VB.y + ' ' + VB.w + ' ' + VB.h + '" role="img" aria-label="Zwei Bäche verzweigen sich zu sechs Mühlen; auf dem Weg liegen neun Wassersperren A bis I.">' +
      '<path d="M40 330 Q20 170 160 130 Q330 90 520 60 Q780 20 1040 90 Q1250 160 1340 300 Q1380 520 1350 700 Q1380 880 1300 990 Q1000 1030 700 1020 Q300 1030 150 960 Q50 740 40 330Z" fill="#e5f1e2"/>';
    svg += '<g class="' + P + 'edges">' + SEG.map(function (sg) { return '<path class="' + P + 'edge" d="' + sg[1] + '"/>'; }).join('') + '</g>' +
      '<g class="' + P + 'dry"></g><g class="' + P + 'wet"></g>';
    // Pfeile an den Strecken (Fließrichtung)
    svg += '<g class="' + P + 'arrows" aria-hidden="true">' +
      [[108, 170, 90], [300, 292, 0], [185, 395, 55], [300, 455, 25], [190, 700, 90], [430, 640, 90], [560, 570, 40], [560, 400, 40], [730, 250, 80], [800, 195, 12], [700, 610, 90], [940, 340, 50], [920, 390, 80], [1100, 440, 25], [1100, 640, 20], [790, 480, 70], [940, 760, 40], [520, 100, 25]]
        .map(function (a) { return '<path transform="translate(' + a[0] + ' ' + a[1] + ') rotate(' + a[2] + ')" d="M-14 -9 L10 0 L-14 9 M-14 0 H10" />'; }).join('') + '</g>';
    for (var i = 1; i <= 6; i++) svg += '<g class="' + P + 'mill" data-mill="' + i + '">' + millSvg(i) + '</g>';
    for (i = 1; i <= 6; i++) {
      var b = BADGE[i];
      svg += '<g class="' + P + 'badge" data-badge="' + i + '" transform="translate(' + b[0] + ' ' + b[1] + ')"><circle r="28"/><text y="10" text-anchor="middle">' + i + '</text></g>';
    }
    svg += '</svg>';
    return svg;
  }

  function gateIcon(rot) {
    return '<svg viewBox="0 0 44 44" aria-hidden="true" focusable="false" style="transform:rotate(' + rot + 'deg)"><g class="' + P + 'bar"><rect x="9" y="16" width="26" height="12" rx="2"/><path d="M9 22H35M18 16V28M26 16V28"/></g>' +
      '<rect class="' + P + 'post" x="6" y="11" width="5" height="22" rx="2"/><rect class="' + P + 'post" x="33" y="11" width="5" height="22" rx="2"/></svg>';
  }

  function update() {
    var f = flows(closed);
    Object.keys(segEls).forEach(function (k) { (f[k] ? wetLayer : dryLayer).appendChild(segEls[k]); });
    var w = wet(closed);
    GATES.forEach(function (g) {
      var btn = gateEls[g], isClosed = closed.indexOf(g) >= 0;
      btn.setAttribute('aria-pressed', String(isClosed));
      btn.setAttribute('aria-label', 'Sperre ' + g + ': ' + (isClosed ? 'geschlossen' : 'offen') + (locked ? '' : '. Antippen zum ' + (isClosed ? 'Öffnen' : 'Schließen')));
      btn.classList.toggle('closed', isClosed);
      var show = mark === 'check' && isClosed !== (SOLUTION.indexOf(g) >= 0);
      btn.classList.toggle('bad', show);
      btn.disabled = locked;
    });
    for (var i = 1; i <= 6; i++) {
      var b = millEls[i], on = w.indexOf(i) >= 0;
      b.classList.toggle('wet', on);
      b.classList.toggle('miss', mark !== null && on !== WHEEL[i]);
      b.classList.toggle('hit', mark !== null && on === WHEEL[i]);
    }
    var wetTxt = w.length ? 'Wasser fließt zu Mühle ' + w.join(', ') : 'Wasser fließt zu keiner Mühle';
    var dry = [1, 2, 3, 4, 5, 6].filter(function (i) { return w.indexOf(i) < 0; });
    statusEl.textContent = (closed.length ? 'Geschlossen: ' + closed.join(', ') + '. ' : 'Alle Sperren sind offen. ') + wetTxt + (dry.length ? '; trocken bleibt Mühle ' + dry.join(', ') : '') + '.';
    el.querySelector('.' + P + 'stage').className = P + 'stage' + (mark === 'solution' ? ' solution' : '');
  }

  function toggle(g) {
    if (locked) return;
    var i = closed.indexOf(g);
    if (i >= 0) closed.splice(i, 1); else closed.push(g);
    closed.sort();
    mark = null;
    update();
    api.changed();
  }

  Biber.register({
    id: 'wassermuehlen21',
    story: '<p>Müller Mert hat sechs Mühlen. Das Wasser fließt vom Berg zu den Mühlen, wie die Pfeile zeigen. Auf dem Weg gibt es einige Wassersperren. ' +
      'Wenn der Müller eine Sperre schließt, fließt das Wasser dort nicht mehr weiter.</p>' +
      '<p>Bei drei Mühlen muss der Müller noch das Mühlrad einbauen: bei den Mühlen <b>2</b>, <b>4</b> und <b>5</b>. Zu diesen Mühlen soll deshalb kein Wasser mehr fließen. ' +
      'Zu den drei Mühlen mit Mühlrad (<b>1</b>, <b>3</b> und <b>6</b>) soll das Wasser aber weiter fließen.</p>',
    question: 'Welche Sperren soll der Müller schließen?',
    howto: 'Tippe auf eine Sperre (A bis I), um sie zu schließen oder wieder zu öffnen. Ein trockener Bach wird braun. Du siehst sofort, zu welchen Mühlen noch Wasser fließt.',
    explanation: function () {
      return '<p>Am besten rechnest du von den Mühlen zurück zu den Sperren: Für Mühle 1 müssen A, G und I offen sein. Weil A offen sein muss, muss F zu sein, sonst käme Wasser zu Mühle 2. ' +
        'Für Mühle 6 müssen B und E offen sein; dann muss H zu, damit Mühle 5 trocken bleibt, und D muss zu, damit Mühle 4 trocken bleibt. Mühle 3 bekommt trotzdem Wasser, wenn C offen ist.</p>' +
        '<p>Richtig ist also: <b>D, F und H</b> schließen. Eine andere Möglichkeit gibt es nicht.</p>' +
        '<p><b>Informatik:</b> Jede Sperre ist wie ein Schalter mit „an“ oder „aus“, und ob Wasser bei einer Mühle ankommt, ist eine Bedingung aus „und“ (alle Sperren auf dem Weg offen) und „oder“ (mehrere Wege möglich). ' +
        'So werden auch Schaltungen und logische Ausdrücke beschrieben.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; closed = []; mark = null;
      segEls = {}; gateEls = {}; millEls = {};
      stageEl = h('div', { class: P + 'stage' });
      stageEl.innerHTML = buildStage();
      dryLayer = stageEl.querySelector('.' + P + 'dry'); wetLayer = stageEl.querySelector('.' + P + 'wet');
      SEG.forEach(function (sg) {
        var n = Biber.svg('path', { class: P + 'fill', d: sg[1] });
        segEls[sg[0]] = n; dryLayer.appendChild(n);
      });
      stageEl.querySelectorAll('[data-badge]').forEach(function (n) { millEls[n.dataset.badge] = n; });
      GATES.forEach(function (g) {
        var p = GATE_POS[g];
        var btn = h('button', {
          type: 'button', class: P + 'gate', 'data-gate': g,
          style: 'left:' + ((p[0] - VB.x) / VB.w * 100).toFixed(2) + '%;top:' + ((p[1] - VB.y) / VB.h * 100).toFixed(2) + '%',
          onclick: function () { toggle(g); }
        });
        btn.innerHTML = gateIcon(GATE_ROT[g]) + '<span class="' + P + 'let" aria-hidden="true">' + g + '</span>';
        gateEls[g] = btn;
        stageEl.appendChild(btn);
      });
      statusEl = h('p', { class: P + 'status', 'aria-live': 'polite' });
      var legend = h('p', { class: P + 'legend' },
        'Mit Mühlrad (hier soll Wasser ankommen): 1, 3, 6. Ohne Mühlrad (hier soll es trocken sein): 2, 4, 5.');
      el.replaceChildren(h('div', { class: P + 'wrap' }, stageEl, statusEl, legend));
      update();
    },
    isComplete: function () { return closed.length > 0; },
    evaluate: function () { return { correct: isRight(closed), answer: closed.slice() }; },
    setAnswer: function (ans) { closed = (ans || []).slice().sort(); mark = 'check'; update(); },
    lock: function (on) {
      locked = on;
      if (on) mark = mark || 'check'; else mark = null;
      update();
    },
    reset: function () { closed = []; mark = null; update(); },
    showSolution: function () { closed = SOLUTION.slice(); locked = true; mark = 'solution'; update(); }
  });
})();
