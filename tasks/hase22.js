/* Aufgabe Schildkröte und Hase (Heft 2022, Klasse 3-4 mittel, 5-6 leicht): Modellierung, Datenstrukturen, Liste */
(function () {
  'use strict';
  var h = Biber.h, S = Biber.svg;

  /* Felder der Laufbahn; ab Index 4 beginnt der Kreis mit sechs Feldern */
  var NODES = [
    { k: 'start', name: 'Start', x: 68, y: 260 },
    { k: 'erdbeere', name: 'Erdbeere', x: 176, y: 260 },
    { k: 'tropfen', name: 'Tropfen', x: 284, y: 260 },
    { k: 'pilz', name: 'Pilz', x: 392, y: 260 },
    { k: 'stein', name: 'Stein', x: 500, y: 260 },
    { k: 'traube', name: 'Traube', x: 612, y: 260 },
    { k: 'blume', name: 'Blume', x: 723, y: 224 },
    { k: 'blatt', name: 'Blatt', x: 694, y: 127 },
    { k: 'zapfen', name: 'Zapfen', x: 563, y: 107 },
    { k: 'glocke', name: 'Glockenblume', x: 468, y: 161 }
  ];
  var LOOP = 4, LAST = 9, ANSWER = 6, R = 36;
  var MAXMIN = 20;

  function next(i) { return i < LAST ? i + 1 : LOOP; }
  function posAt(t, speed) { var i = 0; for (var s = 0; s < t * speed; s++) i = next(i); return i; }
  function firstMeet() { for (var t = 1; t < 100; t++) if (posAt(t, 1) === posAt(t, 2)) return t; return -1; }
  var MEET = firstMeet();
  if (MEET !== 6 || posAt(MEET, 1) !== ANSWER) throw new Error('hase22: Lösung stimmt nicht');

  /* ---------- Symbole (Mittelpunkt 0,0, Größe ca. 44) ---------- */
  function icon(k) {
    var g = S('g', { class: 't-hase22-ic' });
    var a = function (n, at) { g.appendChild(S(n, at)); };
    switch (k) {
      case 'start': a('text', { class: 't-hase22-s', x: 0, y: 0, 'text-anchor': 'middle', 'dominant-baseline': 'central' }); g.lastChild.textContent = 'S'; break;
      case 'erdbeere':
        a('path', { class: 'f-red', d: 'M-14,-8Q0,-14 14,-8Q12,10 0,18Q-12,10 -14,-8Z' });
        a('path', { class: 'f-green', d: 'M-10,-10L-4,-6L0,-14L4,-6L10,-10L6,-3L-6,-3Z' });
        a('path', { class: 'f-seed', d: 'M-6,2l1,0M2,3l1,0M-1,9l1,0M6,-1l1,0M-9,-1l1,0' }); break;
      case 'tropfen': a('path', { class: 'f-drop', d: 'M0,-18Q16,6 12,12Q8,19 0,19Q-8,19 -12,12Q-16,6 0,-18Z' }); a('path', { class: 'f-hl', d: 'M-5,6Q-4,11 1,12' }); break;
      case 'pilz': a('path', { class: 'f-cap', d: 'M-18,2Q-18,-16 0,-16Q18,-16 18,2Z' }); a('path', { class: 'f-stem', d: 'M-6,2H6L8,18H-8Z' }); break;
      case 'stein': a('path', { class: 'f-stone', d: 'M-19,8Q-20,-6 -6,-9Q8,-12 17,-3Q21,8 12,12Q-8,14 -19,8Z' }); a('path', { class: 'f-line', d: 'M-12,2Q-2,-2 8,-2' }); break;
      case 'traube':
        [[-9, -8], [0, -9], [9, -8], [-5, 1], [5, 1], [-9, 8], [0, 9], [9, 8]].forEach(function (p, i) { a('circle', { class: 'f-grape', cx: p[0] * 1, cy: p[1], r: 6.2 }); });
        a('path', { class: 'f-twig', d: 'M0,-15L0,-19' }); break;
      case 'blume':
        for (var i = 0; i < 5; i++) { var ang = i * 72 - 90; a('ellipse', { class: 'f-petal', cx: 11 * Math.cos(ang * Math.PI / 180), cy: 11 * Math.sin(ang * Math.PI / 180), rx: 8, ry: 8 }); }
        a('circle', { class: 'f-core', r: 7 }); break;
      case 'blatt': a('path', { class: 'f-leaf', d: 'M-16,16Q-20,-14 14,-18Q20,12 -16,16Z' }); a('path', { class: 'f-line', d: 'M-14,14L8,-10' }); break;
      case 'zapfen':
        a('ellipse', { class: 'f-cone', cx: 0, cy: 0, rx: 14, ry: 18, transform: 'rotate(35)' });
        a('path', { class: 'f-line', d: 'M-10,-6Q0,2 8,-12M-12,4Q0,12 12,-4M-5,13Q4,16 12,6' }); break;
      case 'glocke':
        a('path', { class: 'f-stemg', d: 'M0,-18Q0,-8 0,-6' });
        a('path', { class: 'f-bell', d: 'M-5,-8Q-5,-16 0,-16Q5,-16 5,-8L12,12Q0,18 -12,12Z' }); a('path', { class: 'f-line', d: 'M-3,-8L-6,12M3,-8L6,12' }); break;
    }
    return g;
  }
  function turtle() {
    var g = S('g', { class: 't-hase22-animal' });
    g.appendChild(S('ellipse', { class: 'a-shell', cx: 0, cy: 0, rx: 13, ry: 9 }));
    g.appendChild(S('path', { class: 'a-line', d: 'M-6,-6L-3,0L-6,6M3,-8L3,8M-1,0H8' }));
    g.appendChild(S('circle', { class: 'a-skin', cx: 15, cy: -2, r: 5 }));
    g.appendChild(S('circle', { class: 'a-eye', cx: 17, cy: -3, r: 1.2 }));
    [[-8, 8], [7, 8], [-8, -8], [7, -8]].forEach(function (p) { g.appendChild(S('ellipse', { class: 'a-skin', cx: p[0], cy: p[1], rx: 3.5, ry: 2.2 })); });
    return g;
  }
  function hare() {
    var g = S('g', { class: 't-hase22-animal' });
    g.appendChild(S('ellipse', { class: 'a-ear', cx: 3, cy: -13, rx: 3, ry: 8, transform: 'rotate(-12 3 -13)' }));
    g.appendChild(S('ellipse', { class: 'a-ear', cx: 10, cy: -13, rx: 3, ry: 8, transform: 'rotate(10 10 -13)' }));
    g.appendChild(S('ellipse', { class: 'a-fur', cx: -3, cy: 3, rx: 12, ry: 8 }));
    g.appendChild(S('circle', { class: 'a-fur', cx: 9, cy: -3, r: 6.5 }));
    g.appendChild(S('circle', { class: 'a-eye', cx: 11, cy: -4, r: 1.2 }));
    g.appendChild(S('circle', { class: 'a-tail', cx: -15, cy: 2, r: 3.5 }));
    return g;
  }

  /* ---------- Zustand und Zeichnen ---------- */
  var el, api, locked, picked, mode, minute, svg, minEl, lineEl, choiceEl;

  function nodeAria(i) {
    var s = (NODES[i].name === 'Start' ? 'Startfeld' : 'Feld ' + NODES[i].name);
    return s + (picked === i ? ', ausgewählt' : '');
  }

  function arrows() {
    var out = [];
    for (var i = 0; i <= LAST; i++) {
      var a = NODES[i], b = NODES[next(i)];
      var dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx * dx + dy * dy), ux = dx / len, uy = dy / len;
      var x1 = a.x + ux * (R + 3), y1 = a.y + uy * (R + 3), x2 = b.x - ux * (R + 6), y2 = b.y - uy * (R + 6);
      var d;
      if (i === 9) d = 'M' + x1 + ',' + y1 + 'L' + x2 + ',' + y2;
      else d = 'M' + x1.toFixed(1) + ',' + y1.toFixed(1) + 'L' + x2.toFixed(1) + ',' + y2.toFixed(1);
      out.push(S('path', { class: 't-hase22-arrow', d: d, 'marker-end': 'url(#t-hase22-head)' }));
    }
    return out;
  }

  function render() {
    var kids = [S('defs', {}, S('marker', { id: 't-hase22-head', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, S('path', { class: 't-hase22-mk', d: 'M0,0L10,5L0,10Z' })))];
    kids = kids.concat(arrows());
    NODES.forEach(function (n, i) {
      var cls = 't-hase22-node' + (picked === i ? ' picked' : '');
      if (mode === 'check' && picked === i) cls += i === ANSWER ? ' right' : ' wrong';
      if (mode === 'solution' && i === ANSWER) cls += ' right';
      var g = S('g', { class: cls, 'data-n': i, role: 'button', tabindex: locked ? '-1' : '0', 'aria-label': nodeAria(i), transform: 'translate(' + n.x + ' ' + n.y + ')' });
      g.appendChild(S('circle', { class: 't-hase22-disc', r: R }));
      g.appendChild(icon(n.k));
      kids.push(g);
    });
    /* Läufer */
    var pt = posAt(minute, 1), ph = posAt(minute, 2);
    function place(ent, i, dx, dy, mirror) {
      var n = NODES[i];
      ent.setAttribute('transform', 'translate(' + (n.x + dx) + ' ' + (n.y + dy) + ') scale(' + (mirror ? 1.15 : 1.15) + ')');
      return ent;
    }
    var same = pt === ph;
    kids.push(place(turtle(), pt, same ? -14 : 0, 38, false));
    kids.push(place(hare(), ph, same ? 14 : 0, -38, false));
    svg.replaceChildren.apply(svg, kids);

    minEl.textContent = String(minute);
    var hint = minute === 0 ? 'Beide stehen am Start.' :
      (same ? 'Nach ' + minute + ' Minuten sind Schildkröte und Hase beide auf dem Feld ' + NODES[pt].name + '.' :
        'Nach ' + minute + ' Minuten: Schildkröte auf ' + NODES[pt].name + ', Hase auf ' + NODES[ph].name + '.');
    lineEl.textContent = hint;
    el.querySelector('[data-step="-1"]').disabled = minute <= 0;
    el.querySelector('[data-step="1"]').disabled = minute >= MAXMIN;
    choiceEl.textContent = picked === null ? 'Noch kein Feld gewählt.' : 'Deine Antwort: Feld ' + NODES[picked].name + '.';
  }

  function pick(i) {
    if (locked) return;
    picked = picked === i ? null : i;
    render();
    api.changed(picked === null ? '' : 'Du hast das Feld ' + NODES[picked].name + ' gewählt.');
  }
  function step(d) {
    minute = Math.max(0, Math.min(MAXMIN, minute + d));
    render();
  }

  function tableHtml() {
    var cols = [];
    for (var t = 0; t <= 13; t++) cols.push(t);
    function ico(i) {
      var s = S('svg', { viewBox: '-22 -22 44 44', width: 26, height: 26, class: 't-hase22-ti', 'aria-hidden': 'true' }, icon(NODES[i].k));
      return s.outerHTML;
    }
    function row(label, speed) {
      return '<tr><th scope="row">' + label + '</th>' + cols.map(function (t) {
        var i = posAt(t, speed), m = t === MEET;
        return '<td' + (m ? ' class="meet"' : '') + ' title="' + NODES[i].name + '">' + ico(i) + '</td>';
      }).join('') + '</tr>';
    }
    return '<div class="t-hase22-tw"><table class="t-hase22-table"><thead><tr><th scope="col">Minute</th>' + cols.map(function (t) { return '<th scope="col"' + (t === MEET ? ' class="meet"' : '') + '>' + t + '</th>'; }).join('') + '</tr></thead><tbody>' +
      row('Schildkröte', 1) + row('Hase', 2) + '</tbody></table></div>';
  }

  Biber.register({
    id: 'hase22',
    story: '<p>Schildkröte und Hase machen einen Wettlauf. Unten siehst du die Laufbahn. Sie starten gleichzeitig auf dem Feld <b>S</b>.</p>' +
      '<p>Sie gehen von Feld zu Feld, den Pfeilen entlang. In einer Minute geht die Schildkröte ein Feld vorwärts und der Hase zwei Felder vorwärts.</p>',
    question: 'Wo treffen sich Schildkröte und Hase nach dem Start zum ersten Mal wieder?',
    howto: 'Mit „Eine Minute weiter“ kannst du den Wettlauf Minute für Minute nachspielen. Tippe dann das Feld an, auf dem sich die beiden zum ersten Mal wieder treffen.',
    explanation: function () {
      return '<p>Schildkröte und Hase treffen sich zum ersten Mal auf dem Feld mit der <b>Blume</b>, und zwar nach 6 Minuten. Das kannst du mit zwei Fingern nachspielen: Der eine Finger macht pro Minute einen Schritt, der andere zwei.</p>' + tableHtml() +
        '<p><b>Informatik:</b> Die Laufbahn ist eine <b>Liste</b>: Felder, von denen jeweils ein Pfeil zu höchstens einem nächsten Feld zeigt. Mündet sie in einen Kreis, nennt man ihn <b>Zyklus</b>, und nur deshalb können sich die beiden hier begegnen. ' +
        'Robert W. Floyd hat einen Algorithmus erfunden, der genau so prüft, ob eine Liste einen Zyklus hat: Ein „Hase“ läuft doppelt so schnell wie die „Schildkröte“. Treffen sie sich, gibt es einen Zyklus. Kommt der Hase ans Ende, gibt es keinen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null; minute = 0;
      svg = S('svg', { class: 't-hase22-svg', viewBox: '24 55 740 270', role: 'group', 'aria-label': 'Laufbahn mit zehn Feldern: Start, Erdbeere, Tropfen, Pilz, dann ein Kreis aus Stein, Traube, Blume, Blatt, Zapfen und Glockenblume, von der es wieder zum Stein geht.' });
      minEl = h('b', { class: 't-hase22-min' }, '0');
      lineEl = h('p', { class: 't-hase22-line', role: 'status', 'aria-live': 'polite' });
      choiceEl = h('p', { class: 't-hase22-choice' });
      el.replaceChildren(h('div', { class: 't-hase22-root' }, svg,
        h('div', { class: 't-hase22-ctl' },
          h('button', { type: 'button', class: 't-hase22-btn', 'data-step': '-1' }, '← Eine Minute zurück'),
          h('span', { class: 't-hase22-clock' }, 'Minute ', minEl),
          h('button', { type: 'button', class: 't-hase22-btn primary', 'data-step': '1' }, 'Eine Minute weiter →')),
        lineEl, choiceEl));
      el.addEventListener('click', function (e) {
        var s = e.target.closest('[data-step]');
        if (s) { step(+s.getAttribute('data-step')); return; }
        var n = e.target.closest('[data-n]');
        if (n) pick(+n.getAttribute('data-n'));
      });
      el.addEventListener('keydown', function (e) {
        var n = e.target.closest && e.target.closest('g[data-n]');
        if (n && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pick(+n.getAttribute('data-n')); }
      });
      render();
    },
    isComplete: function () { return picked !== null; },
    evaluate: function () { return { correct: picked === ANSWER, answer: picked === null ? null : NODES[picked].k }; },
    setAnswer: function (ans) {
      picked = null;
      NODES.forEach(function (n, i) { if (n.k === ans) picked = i; });
      mode = 'check';
      render();
    },
    lock: function (on) { locked = on; mode = on ? (mode === 'solution' ? 'solution' : 'check') : null; render(); },
    reset: function () { picked = null; mode = null; minute = 0; render(); },
    showSolution: function () { picked = ANSWER; locked = true; mode = 'solution'; minute = MEET; render(); }
  });
})();
