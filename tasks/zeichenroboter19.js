/* Aufgabe Zeichenroboter (Biber 2019; Klasse 3-4 schwer, 5-6 mittel, 7-8 einfach): Welches Bild entsteht aus den Zahlen 2, 2, 3? */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-zeichenroboter19-';

  var DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];       /* Richtungen: 0 Norden, 1 Osten, 2 Süden, 3 Westen (y wächst nach unten) */
  var DIRNAME = ['oben', 'rechts', 'unten', 'links'];

  /* Kante als Schlüssel (Endpunkte sortiert) */
  function key(x1, y1, x2, y2) {
    return (x1 < x2 || (x1 === x2 && y1 <= y2)) ? x1 + ',' + y1 + '-' + x2 + ',' + y2 : x2 + ',' + y2 + '-' + x1 + ',' + y1;
  }
  /* Simulation: Start (sx, sy), Blick nach oben; je Schritt: Zahl Felder vor, dann nach rechts drehen.
     steps: Anzahl einzelner Anweisungen insgesamt (Wiederholung der Zahlenfolge). */
  function simulate(nums, steps, sx, sy) {
    var x = sx, y = sy, d = 0, edges = {}, i, k;
    for (i = 0; i < steps; i++) {
      for (k = 0; k < nums[i % nums.length]; k++) {
        edges[key(x, y, x + DX[d], y + DY[d])] = true;
        x += DX[d]; y += DY[d];
      }
      d = (d + 1) % 4;
    }
    return { edges: edges, x: x, y: y, d: d };
  }
  function hl(y, a, b) { var o = [], i; for (i = a; i < b; i++) o.push(key(i, y, i + 1, y)); return o; }
  function vl(x, a, b) { var o = [], i; for (i = a; i < b; i++) o.push(key(x, i, x, i + 1)); return o; }
  function setOf(list) { var o = {}; list.forEach(function (k) { o[k] = true; }); return o; }
  function sameSet(a, b) {
    var ka = Object.keys(a), kb = Object.keys(b);
    return ka.length === kb.length && ka.every(function (k) { return b[k]; });
  }

  /* Bilder A-D aus dem Heft (5x5-Raster) */
  var OPTIONS = [
    { key: 'A', edges: setOf([].concat(hl(1, 2, 3), hl(2, 1, 4), hl(3, 1, 4), hl(4, 2, 3), vl(1, 2, 3), vl(2, 1, 4), vl(3, 1, 4), vl(4, 2, 3))),
      desc: 'ein Kreuz aus fünf Quadraten' },
    { key: 'B', edges: setOf([].concat(hl(1, 1, 4), hl(2, 1, 4), hl(3, 1, 4), hl(4, 1, 4), vl(1, 1, 4), vl(2, 1, 4), vl(3, 1, 4), vl(4, 1, 4))),
      desc: 'ein Gitter aus 3 mal 3 Quadraten' },
    { key: 'C', edges: setOf([].concat(hl(1, 1, 4), hl(4, 1, 4), vl(1, 1, 4), vl(4, 1, 4))),
      desc: 'ein großes Quadrat ohne Linien im Inneren' },
    { key: 'D', edges: setOf([].concat(hl(1, 1, 2), hl(1, 3, 4), hl(2, 1, 4), hl(3, 1, 4), hl(4, 1, 2), hl(4, 3, 4),
      vl(1, 1, 2), vl(1, 3, 4), vl(2, 1, 4), vl(3, 1, 4), vl(4, 1, 2), vl(4, 3, 4))),
      desc: 'vier kleine Quadrate in den Ecken, verbunden durch ein Doppelkreuz' }
  ];
  var NUMS = [2, 2, 3];
  var START_X = 1, START_Y = 3;
  /* Das Bild entsteht nach vier Durchläufen der drei Schritte (danach wiederholt es sich nur noch) */
  var FINAL = simulate(NUMS, 12, START_X, START_Y).edges;
  var RIGHT = OPTIONS.map(function (o) { return sameSet(o.edges, FINAL); }).indexOf(true);   /* B; per Skript bestätigt */

  /* ---- SVG ---- */
  function arrow(x, y, d, u) {
    var cx = x * u, cy = y * u, s = u * 0.32, pts;
    if (d === 0) pts = [[cx, cy - s], [cx - s * 0.8, cy + s * 0.6], [cx + s * 0.8, cy + s * 0.6]];
    else if (d === 1) pts = [[cx + s, cy], [cx - s * 0.6, cy - s * 0.8], [cx - s * 0.6, cy + s * 0.8]];
    else if (d === 2) pts = [[cx, cy + s], [cx - s * 0.8, cy - s * 0.6], [cx + s * 0.8, cy - s * 0.6]];
    else pts = [[cx - s, cy], [cx + s * 0.6, cy - s * 0.8], [cx + s * 0.6, cy + s * 0.8]];
    return '<polygon class="' + P + 'robot" points="' + pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') + '"/>';
  }
  function gridSvg(n, u, edges, robot, label, cls, oldEdges) {
    var out = '<svg class="' + (cls || P + 'grid') + '" viewBox="-2 -2 ' + (n * u + 4) + ' ' + (n * u + 4) + '" role="img" aria-label="' + label + '">' +
      '<rect class="' + P + 'bg" x="0" y="0" width="' + n * u + '" height="' + n * u + '"/>', i;
    for (i = 0; i <= n; i++) {
      out += '<line class="' + P + 'gl" x1="' + i * u + '" y1="0" x2="' + i * u + '" y2="' + n * u + '"/>';
      out += '<line class="' + P + 'gl" x1="0" y1="' + i * u + '" x2="' + n * u + '" y2="' + i * u + '"/>';
    }
    function lines(set, c) {
      Object.keys(set).forEach(function (k) {
        var m = k.split('-'), a = m[0].split(','), b = m[1].split(',');
        out += '<line class="' + P + c + '" x1="' + a[0] * u + '" y1="' + a[1] * u + '" x2="' + b[0] * u + '" y2="' + b[1] * u + '"/>';
      });
    }
    if (oldEdges) lines(oldEdges, 'old');
    lines(edges, 'ln');
    if (robot) out += arrow(robot.x, robot.y, robot.d, u);
    return out + '</svg>';
  }

  /* Beispiel 3, 1, 5 auf 7x7 (Start unten in Spalte 2): je Schritt die neue Linie (kräftig), frühere Linien blass */
  function exampleFigs() {
    var ex = [3, 1, 5], sx = 2, sy = 3, parts = [];
    function stepFig(idx) {
      var before = simulate(ex, idx, sx, sy), after = simulate(ex, idx + 1, sx, sy), cur = {};
      Object.keys(after.edges).forEach(function (k) { if (!before.edges[k]) cur[k] = true; });
      return '<figure class="' + P + 'fig">' + gridSvg(7, 14, cur, after, 'Bild zu Schritt ' + (idx + 1) + ': Linie über ' + ex[idx] + ' Felder, danach Drehung nach rechts', P + 'grid', before.edges) +
        '<figcaption>Schritt ' + (idx + 1) + '</figcaption></figure>';
    }
    parts.push(stepFig(0), stepFig(1), stepFig(2));
    var full = simulate(ex, 12, sx, sy);
    parts.push('<figure class="' + P + 'fig">' + gridSvg(7, 14, full.edges, full, 'Bild: Windrad aus Linien, entsteht nach vier Durchläufen der drei Schritte', P + 'grid') + '<figcaption>Bild</figcaption></figure>');
    return '<div class="' + P + 'figs">' + parts.join('') + '</div>';
  }

  var el, api, radios, selected, locked, mark;
  function reset() { selected = null; mark = null; }

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
    else if (k === ' ' || k === 'Enter') { e.preventDefault(); choose(i, false); return; }
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }

  Biber.register({
    id: 'zeichenroboter19',
    story:
      '<p>Ein Roboter bewegt sich über ein Raster und zeichnet dabei Linien. Mit drei Zahlen kann man den Roboter steuern. Die Zahlen geben dem Roboter drei Schritte an, die er beliebig oft wiederholt. So entsteht aus den Zahlen ein Bild.</p>' +
      '<p>Ein Beispiel: Aus den Zahlen 3, 1, 5 entsteht das Bild rechts, und zwar so:</p>' +
      '<ul><li>gehe 3 Felder vor und drehe nach rechts (Schritt 1),</li><li>gehe 1 Feld vor und drehe nach rechts (Schritt 2) und</li><li>gehe 5 Felder vor und drehe nach rechts (Schritt 3).</li></ul>' +
      exampleFigs() +
      '<p class="' + P + 'note">Der rote Pfeil zeigt, wo der Roboter nach dem Drehen steht und wohin er blickt. Er startet immer mit Blick nach oben.</p>',
    question: 'Welches Bild entsteht aus den Zahlen 2, 2, 3?',
    howto: 'Wähle das Bild, das der Roboter zeichnet, wenn er die drei Schritte immer wieder wiederholt.',
    explanation: function () {
      var stages = [1, 2, 3, 4].map(function (k) {
        var r = simulate(NUMS, 3 * k, START_X, START_Y);
        return '<figure class="' + P + 'fig">' + gridSvg(5, 18, r.edges, r, 'Bild nach ' + k + ' Durchläufen, Roboter blickt nach ' + DIRNAME[r.d], P + 'grid') +
          '<figcaption>nach ' + k + '. Durchlauf</figcaption></figure>';
      }).join('');
      return '<p>Bei 2, 2, 3 geht der Roboter 2 Felder vor und dreht nach rechts, geht wieder 2 Felder vor und dreht nach rechts und geht dann 3 Felder vor und dreht nach rechts. Danach wiederholt er die drei Schritte immer wieder. Die Bilder zeigen die Linien nach jedem Durchlauf.</p>' +
        '<div class="' + P + 'figs">' + stages + '</div>' +
        '<p>Nach dem vierten Durchlauf steht der Roboter wieder am Start und blickt nach oben: ab jetzt zeichnet er nur noch über bereits gezeichnete Linien. Es entsteht das Bild aus <strong>Antwort B</strong>.</p>' +
        '<p>Die Sprache dieses Roboters ist sehr einfach: Jedes Programm besteht aus genau drei Zahlen, und die Wiederholung ist fest eingebaut. Richtige Programmiersprachen erlauben beliebig viele Anweisungen, Wiederholungen und bedingte Anweisungen. Mit diesen Bausteinen kann man alles berechnen, was überhaupt berechenbar ist. Solche Sprachen heißen <strong>universell</strong> oder &bdquo;Turing-vollständig&ldquo;.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      radios = OPTIONS.map(function (o, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': o.key,
          'aria-label': 'Bild ' + o.key + ': ' + o.desc,
          onclick: function () { choose(i, false); }, onkeydown: onKey
        });
        btn.innerHTML = '<span class="' + P + 'key" aria-hidden="true">' + o.key + ')</span>' + gridSvg(5, 20, o.edges, null, 'Bild ' + o.key, P + 'optgrid');
        return btn;
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Bilder A bis D' }, radios)));
      refresh();
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
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () { selected = RIGHT; mark = 'solution'; locked = true; refresh(); }
  });
})();
