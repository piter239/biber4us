/* Aufgabe Rundhangar (Biber 2022; Klasse 7-8 schwer, 9-10 mittel, 11-13 leicht): Reihenfolge mit den meisten Tastendrücken an einer Drehscheibe (worst case) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-rundhangar22-';
  var NS = 'http://www.w3.org/2000/svg';
  var N = 6;

  /* Zahl der Tastendrücke von Position g nach Position p; Gegenrichtung bei Gleichstand (3) egal, hier wird rechts gewählt */
  function move(g, p) {
    var d = ((p - g) % N + N) % N;
    return d <= 3 ? { dir: 'r', n: d } : { dir: 'l', n: N - d };
  }
  function steps(seq) {
    var g = 1, total = 0, rot = 0, out = [];
    seq.forEach(function (p) {
      var m = move(g, p);
      total += m.n;
      rot += (m.dir === 'r' ? -1 : 1) * m.n * 60;   /* rechte Taste: Position g+1 kommt zum Tor, die Scheibe dreht sich gegen den Uhrzeigersinn */
      out.push({ p: p, dir: m.dir, n: m.n });
      g = p;
    });
    return { list: out, total: total, rot: rot, gate: g };
  }

  /* Höchstzahl per Durchprobieren aller 720 Reihenfolgen; im Heft: 16, mit genau zwei Beispielen 413625 und 415263 */
  function perms(a) {
    if (a.length < 2) return [a];
    var r = [];
    a.forEach(function (x, i) { perms(a.filter(function (_, j) { return j !== i; })).forEach(function (q) { r.push([x].concat(q)); }); });
    return r;
  }
  var MAX = 0;
  perms([1, 2, 3, 4, 5, 6]).forEach(function (q) { var t = steps(q).total; if (t > MAX) MAX = t; });   /* = 16 */
  var SOLUTION = [4, 1, 3, 6, 2, 5];

  var PLANE = 'M0 -24C3 -24 4 -18 4 -10L26 4V9L4 4L3 16L10 21V24L0 22L-10 24V21L-3 16L-4 4L-26 9V4L-4 -10C-4 -18 -3 -24 0 -24Z';
  function ang(p) { return (90 + 60 * (p - 1)) * Math.PI / 180; }   /* Position 1 unten, dann im Uhrzeigersinn */
  function svg(tag, attrs, kids) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (c) { e.appendChild(c); });
    return e;
  }
  function setT(e, t) { e.style.transform = t; }

  var el, api, seq, locked, mark;
  var discG, badges, planes, sectors, gateG, slotsEl, chipsEl, totalEl, undoBtn, clearBtn, chipBtns, liveEl;

  function reset() { seq = []; mark = null; }

  /* ---------- Drehscheibe (einmal gebaut, dann nur noch gedreht) ---------- */
  function buildDisc() {
    var cx = 150, cy = 150;
    badges = []; planes = []; sectors = [];
    var kids = [];
    kids.push(svg('circle', { class: P + 'ring', cx: cx, cy: cy, r: 140 }));
    kids.push(svg('circle', { class: P + 'plate', cx: cx, cy: cy, r: 126 }));
    discG = svg('g', { class: P + 'disc' });
    for (var p = 1; p <= N; p++) {
      var a0 = ang(p) - Math.PI / 6, a1 = ang(p) + Math.PI / 6, R = 126;
      var sec = svg('path', { class: P + 'sec' + (p % 2 ? ' odd' : ''), d: 'M' + cx + ' ' + cy + 'L' + (cx + R * Math.cos(a0)).toFixed(1) + ' ' + (cy + R * Math.sin(a0)).toFixed(1) + 'A' + R + ' ' + R + ' 0 0 1 ' + (cx + R * Math.cos(a1)).toFixed(1) + ' ' + (cy + R * Math.sin(a1)).toFixed(1) + 'Z' });
      sectors.push(sec); discG.appendChild(sec);
    }
    for (p = 1; p <= N; p++) {
      var pl = svg('path', { class: P + 'plane', d: PLANE });
      var px = cx + 84 * Math.cos(ang(p)), py = cy + 84 * Math.sin(ang(p));
      var pg = svg('g', { class: P + 'planeg' }, [pl]);
      pg.setAttribute('transform', 'translate(' + px.toFixed(1) + ' ' + py.toFixed(1) + ') rotate(' + (ang(p) * 180 / Math.PI + 90).toFixed(1) + ') scale(0.95)');
      planes.push(pg); discG.appendChild(pg);
    }
    for (p = 1; p <= N; p++) {
      var bx = cx + 40 * Math.cos(ang(p)), by = cy + 40 * Math.sin(ang(p));
      var bg = svg('g', { class: P + 'badge' }, [
        svg('circle', { r: 14 }),
        (function () { var t = svg('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central' }); t.textContent = String(p); return t; })()
      ]);
      bg.dataset.bx = bx.toFixed(1); bg.dataset.by = by.toFixed(1);
      badges.push(bg); discG.appendChild(bg);
    }
    kids.push(discG);
    /* Tor unten: Pfeil, bleibt stehen */
    gateG = svg('g', { class: P + 'gate' }, [
      svg('path', { d: 'M138 290H162V303H172L150 322L128 303H138Z' })
    ]);
    kids.push(gateG);
    var s = svg('svg', { class: P + 'svg', viewBox: '0 0 300 330', role: 'img', 'aria-hidden': 'true', focusable: 'false' }, kids);
    updateDisc(0);
    return s;
  }
  function updateDisc(rot) {
    setT(discG, 'rotate(' + rot + 'deg)');
    var used = {};
    seq.forEach(function (p) { used[p] = true; });
    var gate = steps(seq).gate;
    badges.forEach(function (b, i) {
      setT(b, 'translate(' + b.dataset.bx + 'px,' + b.dataset.by + 'px) rotate(' + (-rot) + 'deg)');
      b.classList.toggle('gone', !!used[i + 1]);
    });
    planes.forEach(function (pg, i) { pg.classList.toggle('gone', !!used[i + 1]); });
    sectors.forEach(function (s, i) { s.classList.toggle('atgate', i + 1 === gate); });
  }

  /* ---------- Reihenfolge ---------- */
  function add(p) {
    if (locked || seq.indexOf(p) >= 0 || seq.length >= N) return;
    seq.push(p);
    refresh();
    var nx = chipsEl.querySelector('button:not(:disabled)');
    if (nx) nx.focus(); else if (undoBtn) undoBtn.focus();
    api.changed();
  }
  function undo() {
    if (locked || !seq.length) return;
    var p = seq.pop();
    refresh();
    var c = chipBtns[p - 1]; if (c && !c.disabled) c.focus();
    api.changed();
  }
  function clearAll() {
    if (locked || !seq.length) return;
    seq = [];
    refresh();
    api.changed();
  }

  function dirGlyph(d) { return d === 'r' ? '▶' : '◀'; }
  function refresh() {
    var st = steps(seq);
    updateDisc(st.rot);
    chipBtns.forEach(function (b, i) { b.disabled = locked || seq.indexOf(i + 1) >= 0 || seq.length >= N; });
    slotsEl.replaceChildren.apply(slotsEl, [0, 1, 2, 3, 4, 5].map(function (i) {
      var s = st.list[i];
      var cls = P + 'slot' + (s ? ' filled' : '');
      return h('li', { class: cls },
        h('span', { class: P + 'cir', 'aria-label': s ? 'Als ' + (i + 1) + '. Flugzeug rollt Position ' + s.p + ' heraus, dafür ' + s.n + (s.n === 1 ? ' Tastendruck' : ' Tastendrücke') : (i + 1) + '. Flugzeug: noch leer' }, s ? String(s.p) : ''),
        h('span', { class: P + 'cnt ' + (s ? (s.n === 0 ? 'z' : s.dir) : ''), 'aria-hidden': 'true' }, s ? (s.n === 0 ? '0×' : s.n + '×' + dirGlyph(s.dir)) : ' '));
    }));
    undoBtn.disabled = locked || !seq.length;
    clearBtn.disabled = locked || !seq.length;
    var done = seq.length === N;
    var txt;
    if (!seq.length) txt = 'Am Anfang steht Position 1 am Tor. Wähle die Flugzeuge in der Reihenfolge, in der die Piloten sie abholen.';
    else txt = 'Tastendrücke bisher: ' + st.total + (done ? ' (alle sechs Flugzeuge sind draußen)' : '');
    totalEl.textContent = txt;
    totalEl.className = P + 'total' + (mark ? ' ' + mark : '');
    if (mark === 'check') totalEl.textContent += (st.total === MAX ? ' – mehr geht nicht.' : ' – es geht noch mit mehr Tastendrücken.');
    liveEl.textContent = seq.length ? 'Position ' + st.gate + ' steht jetzt am Tor. ' + totalEl.textContent : '';
  }

  Biber.register({
    id: 'rundhangar22',
    story:
      '<p>Auf dem Flugplatz von Beavertown parken sechs Flugzeuge in einem Rundhangar. Sie stehen auf einer Drehscheibe, in sechs Parkpositionen. Außen gibt es zwei Pfeiltasten ◀ ▶. Mit einem Tastendruck kann man die Drehscheibe um genau eine Parkposition nach links oder rechts drehen.</p>' +
      '<p>Morgens, wenn die Piloten ihre Flugzeuge abholen, ist die Parkposition 1 immer beim Hangartor, und das Flugzeug darauf kann herausrollen. Im besten Fall müssen die Pfeiltasten dann noch fünfmal gedrückt werden, damit auch alle weiteren Flugzeuge herausrollen können. Wenn zum Beispiel die Piloten in der Reihenfolge 1, 6, 5, 4, 3, 2 auf die Parkpositionen zugreifen wollen, genügt es, die Taste ◀ fünfmal zu drücken.</p>' +
      '<p>Aber was ist der schlechteste Fall? Bei welcher Reihenfolge müssen die Tasten am häufigsten gedrückt werden? Natürlich drücken die Piloten die Tasten nur so oft wie unbedingt nötig, damit ihr Flugzeug herausrollen kann.</p>',
    question: 'Gib ein Beispiel für eine solche Reihenfolge.',
    howto: 'Tippe die Zahlen 1 bis 6 in der Reihenfolge an, in der die Flugzeuge herausrollen. Die Scheibe dreht sich jeweils auf dem kürzesten Weg zum Tor, und du siehst, wie oft die Tasten gedrückt werden. Mit „Zurück“ nimmst du die letzte Zahl wieder weg.',
    explanation: function () {
      return '<p>Am meisten Tastendrücke braucht man, wenn jedes Mal das Flugzeug herausrollen soll, das von der Position am Tor am weitesten entfernt ist. Es gibt zwei solche Reihenfolgen: <strong>4, 1, 3, 6, 2, 5</strong> und <strong>4, 1, 5, 2, 6, 3</strong>. In beiden Fällen werden die Tasten <strong>16-mal</strong> gedrückt (zum Beispiel 3 + 3 + 2 + 3 + 2 + 3).</p>' +
        '<p>Mehr als 16 geht nicht: Nur beim ersten und beim zweiten Zugriff sind 3 Tastendrücke nötig (zuerst auf Position 4, dann auf Position 1). Bei den nächsten vier Zugriffen können sich höchstens 2 und 3 Tastendrücke abwechseln.</p>' +
        '<p>Der Rundhangar spart Platz, aber das Abholen dauert dafür länger als bei einem gewöhnlichen Hangar. Auch in der Informatik gibt es solche Abwägungen (Trade-Off), zum Beispiel zwischen Speicherplatz und Zugriffszeit. Bei der Laufzeitanalyse fragt man nach dem schlechtesten Fall (worst case), dem günstigsten Fall (best case) und dem typischen Fall (average case).</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      var disc = buildDisc();
      chipBtns = [1, 2, 3, 4, 5, 6].map(function (p) {
        return h('button', { type: 'button', class: P + 'chip', 'aria-label': 'Position ' + p + ' als nächstes Flugzeug herausrollen', onclick: function () { add(p); } }, String(p));
      });
      chipsEl = h('div', { class: P + 'chips', role: 'group', 'aria-label': 'Parkpositionen' }, chipBtns);
      slotsEl = h('ol', { class: P + 'slots', 'aria-label': 'Gewählte Reihenfolge' });
      totalEl = h('p', { class: P + 'total' });
      liveEl = h('p', { class: P + 'sr', role: 'status', 'aria-live': 'polite' });
      undoBtn = h('button', { type: 'button', class: 'btn ghost ' + P + 'tool', onclick: undo }, 'Zurück');
      clearBtn = h('button', { type: 'button', class: 'btn ghost ' + P + 'tool', onclick: clearAll }, 'Alle löschen');
      el.replaceChildren(h('div', { class: P + 'wrap' },
        h('div', { class: P + 'stage' }, h('div', { class: P + 'discbox' }, disc, h('span', { class: P + 'gatelab', 'aria-hidden': 'true' }, 'Hangartor'))),
        h('div', { class: P + 'ctrl' },
          h('h3', null, 'Reihenfolge'),
          chipsEl,
          slotsEl,
          totalEl,
          h('div', { class: P + 'tools' }, undoBtn, clearBtn),
          liveEl)));
      refresh();
    },
    isComplete: function () { return seq.length === N; },
    evaluate: function () { return { correct: steps(seq).total === MAX, answer: { seq: seq.slice() } }; },
    setAnswer: function (ans) {
      var s = (ans && Array.isArray(ans.seq) ? ans.seq : []).filter(function (p, i, a) { return p >= 1 && p <= N && a.indexOf(p) === i; });
      seq = s; mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      refresh();
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () { seq = SOLUTION.slice(); mark = 'solution'; locked = true; refresh(); }
  });
})();
