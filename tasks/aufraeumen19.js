/* Aufgabe Aufräumen (Biber-Heft 2019, Klasse 3-4 mittel, 5-6 einfach): Roboter sammelt immer das nächstgelegene Ding auf */
(function () {
  'use strict';
  var h = Biber.h, S = Biber.svg;

  /* Bild assets/aufraeumen19/szene.png: 1401 x 1108 Pixel; Koordinaten im Bild (Mitten der Dinge) */
  var W = 1401, H = 1108;
  var ROBOT = { x: 180, y: 640 };
  var ITEMS = {
    papierOben: { x: 342, y: 340, name: 'Zettel oben links' },
    apfelOben: { x: 592, y: 328, name: 'Angebissener Apfel oben' },
    becherRechts: { x: 1210, y: 533, name: 'Roter Becher rechts' },
    becherRoboter: { x: 336, y: 658, name: 'Oranger Becher neben dem Roboter' },
    becherMitte: { x: 526, y: 662, name: 'Roter Becher in der Mitte' },
    apfelMitte: { x: 752, y: 676, name: 'Angebissener Apfel in der Mitte' },
    papierMitte: { x: 962, y: 780, name: 'Zettel rechts in der Mitte' },
    becherUnten: { x: 342, y: 968, name: 'Oranger Becher unten links' }
  };
  var KEYS = Object.keys(ITEMS);
  /* Reihenfolge laut Heft (Weg des Roboters); wird unten per Simulation nachgerechnet */
  var ORDER = ['becherRoboter', 'becherMitte', 'apfelMitte', 'papierMitte', 'becherRechts', 'apfelOben', 'papierOben', 'becherUnten'];
  var LAST = 'becherUnten';

  function simulate() {
    var pos = ROBOT, rem = KEYS.slice(), out = [];
    while (rem.length) {
      var best = null, bd = Infinity;
      rem.forEach(function (k) {
        var d = Math.hypot(ITEMS[k].x - pos.x, ITEMS[k].y - pos.y);
        if (d < bd) { bd = d; best = k; }
      });
      out.push(best);
      pos = ITEMS[best];
      rem.splice(rem.indexOf(best), 1);
    }
    return out;
  }
  var SIM = simulate();
  if (SIM.join() !== ORDER.join()) ORDER = SIM; /* Sicherheitsnetz: Zeichnung folgt der Regel aus der Aufgabe */
  LAST = ORDER[ORDER.length - 1];

  var el, api, picked, locked, mode; /* mode: null | 'check' | 'solution' */

  function reset() { picked = null; mode = null; }

  function pathSvg() {
    var pts = [ROBOT].concat(ORDER.map(function (k) { return ITEMS[k]; }));
    var g = S('g', { class: 't-aufraeumen19-path' });
    var segs = [];
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1];
      var dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
      var ux = dx / len, uy = dy / len;
      var sx = a.x + ux * (i === 0 ? 60 : 55), sy = a.y + uy * (i === 0 ? 60 : 55);
      var ex = b.x - ux * 48, ey = b.y - uy * 48;
      segs.push({ sx: sx, sy: sy, ex: ex, ey: ey, ux: ux, uy: uy });
    }
    segs.forEach(function (s) {
      var ah = 34, aw = 20;
      var bx = s.ex - s.ux * ah, by = s.ey - s.uy * ah;
      var tri = (bx - s.uy * aw) + ',' + (by + s.ux * aw) + ' ' + s.ex + ',' + s.ey + ' ' + (bx + s.uy * aw) + ',' + (by - s.ux * aw);
      g.appendChild(S('line', { x1: s.sx, y1: s.sy, x2: bx, y2: by, class: 't-aufraeumen19-halo' }));
      g.appendChild(S('polygon', { points: tri, class: 't-aufraeumen19-halo2' }));
      g.appendChild(S('line', { x1: s.sx, y1: s.sy, x2: bx, y2: by, class: 't-aufraeumen19-line' }));
      g.appendChild(S('polygon', { points: tri, class: 't-aufraeumen19-head' }));
    });
    ORDER.forEach(function (k, i) {
      var it = ITEMS[k];
      g.appendChild(S('circle', { cx: it.x + 62, cy: it.y - 62, r: 30, class: 't-aufraeumen19-badge' }));
      var t = S('text', { x: it.x + 62, y: it.y - 62, class: 't-aufraeumen19-badge-t', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, String(i + 1));
      g.appendChild(t);
    });
    return g;
  }

  function render() {
    var btns = KEYS.map(function (k) {
      var it = ITEMS[k], cls = 't-aufraeumen19-item';
      var sel = picked === k;
      if (sel) cls += ' sel';
      var mark = null;
      if (mode === 'check' && sel) {
        var ok = k === LAST;
        cls += ok ? ' right' : ' wrong';
        mark = h('span', { class: 't-aufraeumen19-mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      } else if (mode === 'solution' && k === LAST) {
        cls += ' right';
        mark = h('span', { class: 't-aufraeumen19-mark', 'aria-hidden': 'true' }, '✓');
      }
      return h('button', {
        type: 'button', class: cls, 'data-k': k, 'aria-pressed': String(sel), 'aria-label': it.name, disabled: locked,
        style: 'left:' + (it.x / W * 100).toFixed(2) + '%;top:' + (it.y / H * 100).toFixed(2) + '%'
      }, mark);
    });
    var svg = null;
    if (mode === 'solution') {
      svg = S('svg', { class: 't-aufraeumen19-over', viewBox: '0 0 ' + W + ' ' + H, 'aria-hidden': 'true', focusable: 'false' }, pathSvg());
    }
    el.replaceChildren(h('div', { class: 't-aufraeumen19-wrap' },
      h('div', { class: 't-aufraeumen19-scene', role: 'group', 'aria-label': 'Rasen mit Roboter und acht Dingen' },
        h('img', { src: 'assets/aufraeumen19/szene.png', width: W, height: H, alt: 'Ein Rasen im Park: Ein Roboter mit Besen steht links in der Mitte. Auf dem Rasen liegen acht Dinge: zwei Zettel, zwei angebissene Äpfel, zwei rote und zwei orange Becher.', draggable: 'false' }),
        svg, btns)));
  }

  function onClick(e) {
    var b = e.target.closest('[data-k]');
    if (!b || locked) return;
    picked = picked === b.dataset.k ? null : b.dataset.k;
    render();
    var again = el.querySelector('[data-k="' + (picked || '') + '"]');
    if (again) again.focus();
    api.changed(picked ? ITEMS[picked].name + ' ausgewählt.' : '');
  }

  Biber.register({
    id: 'aufraeumen19',
    story: '<p>Nach dem Freilichtkonzert im Park sammelt der Roboter den Müll auf, den das Publikum auf dem Rasen zurückgelassen hat.</p>' +
      '<p>Der Roboter geht zu dem nächstgelegenen Ding, das auf dem Rasen herumliegt, und sammelt es auf. Dann geht er zu dem Ding, das jetzt am nächsten liegt, und sammelt es auf. So macht der Roboter immer weiter, bis er allen Müll aufgesammelt hat.</p>',
    question: 'Welches Ding sammelt der Roboter als letztes auf?',
    howto: 'Tippe auf das Ding, das der Roboter zuletzt aufsammelt.',
    explanation: function () {
      return '<p>Der Roboter geht immer zum Ding, das von seinem aktuellen Platz aus am nächsten liegt. Sein Weg führt so über Becher, Becher, Apfel, Zettel, Becher, Apfel und Zettel. <strong>Als letztes sammelt er den orangen Becher unten links auf.</strong> Die Zahlen im Bild zeigen die Reihenfolge.</p>' +
        '<p>Ein Roboter hat Kameras und Sensoren, mit denen er Dinge wahrnimmt und ihre Entfernung bestimmt. Ein Computerprogramm im Roboter wertet diese Daten aus und steuert ihn, sodass er sich selbst bewegt (autonom) und nicht ferngesteuert werden muss.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      render();
    },
    isComplete: function () { return !!picked; },
    evaluate: function () { return { correct: picked === LAST, answer: picked }; },
    setAnswer: function (ans) {
      picked = ITEMS[ans] ? ans : null;
      mode = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      if (on) { if (mode !== 'solution') mode = 'check'; } else mode = null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      picked = LAST;
      mode = 'solution';
      locked = true;
      render();
    }
  });
})();
