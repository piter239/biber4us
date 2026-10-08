/* Aufgabe Am schwersten (Biber 2020; Klasse 3-4 schwer, 5-6 mittel, 7-8 einfach): aus Waagen-Vergleichen die schwerste Kiste finden */
(function () {
  'use strict';
  var h = Biber.h, svg = Biber.svg;
  var P = 't-amschwersten20-';

  var KINDS = ['herz', 'stern', 'fuenfeck', 'kreis', 'quadrat'];
  var NAME = { herz: 'Herz', stern: 'Stern', fuenfeck: 'Fünfeck', kreis: 'Kreis', quadrat: 'Quadrat' };
  /* Heftseite 7: fünf Wägungen, jeweils [schwerere Kiste (unten), leichtere Kiste (oben)], im Bild links/rechts wie im Heft */
  var WEIGH = [
    { left: 'herz', right: 'kreis', heavier: 'left' },
    { left: 'fuenfeck', right: 'quadrat', heavier: 'left' },
    { left: 'quadrat', right: 'herz', heavier: 'left' },
    { left: 'quadrat', right: 'stern', heavier: 'left' },
    { left: 'stern', right: 'herz', heavier: 'left' }
  ];
  var RIGHT = 'fuenfeck';   /* im Heft bestätigt; per Skript über alle Ordnungen geprüft (genau eine Ordnung passt) */

  /* ---------- Kistensymbole (Koordinaten 0..48) ---------- */
  function poly(cx, cy, r, n, rot, inner) {
    var pts = [], i, a, rr;
    for (i = 0; i < (inner ? 2 * n : n); i++) {
      rr = inner ? (i % 2 ? inner : r) : r;
      a = rot + i * Math.PI * (inner ? 1 : 2) / n;
      pts.push((cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1));
    }
    return pts.join(' ');
  }
  var ICON = {
    herz: '<path class="' + P + 'herz" d="M24 41 C9 29 5 21 5 15 C5 9 10 6 15 6 C19 6 22 8 24 12 C26 8 29 6 33 6 C38 6 43 9 43 15 C43 21 39 29 24 41 Z"/>',
    stern: '<polygon class="' + P + 'stern" points="' + poly(24, 25, 19, 5, -Math.PI / 2, 8.5) + '"/>',
    fuenfeck: '<polygon class="' + P + 'fuenfeck" points="' + poly(24, 26, 18.5, 5, -Math.PI / 2) + '"/>',
    kreis: '<circle class="' + P + 'kreis" cx="24" cy="24" r="14.5"/>',
    quadrat: '<rect class="' + P + 'quadrat" x="9" y="9" width="30" height="30" rx="3"/>'
  };
  function crateInner(kind) {
    return '<rect class="' + P + 'box" x="1" y="1" width="46" height="46" rx="7"/>' + ICON[kind];
  }
  function crateSvg(kind, cls) {
    return '<svg class="' + (cls || P + 'crate') + '" viewBox="0 0 48 48" aria-hidden="true" focusable="false">' + crateInner(kind) + '</svg>';
  }

  /* ---------- Waage (viewBox 0 0 170 118) ---------- */
  function scaleSvg(w, idx) {
    var left = w.heavier === 'left';
    var yl = left ? 102 : 74, yr = left ? 74 : 102;       /* Enden des Balkens: schwerere Seite unten */
    var S = 46;                                          /* Kistengröße */
    function crate(kind, x, y) {
      return '<g class="' + P + 'sc-crate" data-kind="' + kind + '" transform="translate(' + (x - S / 2) + ' ' + (y - S - 3) + ') scale(' + S / 48 + ')">' +
        crateInner(kind) + '</g>';
    }
    return '<svg class="' + P + 'scale" viewBox="0 0 170 130" role="img" aria-label="Waage ' + (idx + 1) + ': ' +
      NAME[left ? w.left : w.right] + ' ist schwerer als ' + NAME[left ? w.right : w.left] + '. Die ' + (left ? 'linke' : 'rechte') + ' Seite ist unten.">' +
      '<ellipse class="' + P + 'base" cx="85" cy="123" rx="34" ry="6"/>' +
      '<rect class="' + P + 'post" x="81" y="88" width="8" height="34" rx="2"/>' +
      '<line class="' + P + 'beam" x1="32" y1="' + yl + '" x2="138" y2="' + yr + '"/>' +
      '<line class="' + P + 'plate" x1="10" y1="' + yl + '" x2="56" y2="' + yl + '"/>' +
      '<line class="' + P + 'plate" x1="114" y1="' + yr + '" x2="160" y2="' + yr + '"/>' +
      crate(w.left, 33, yl) + crate(w.right, 137, yr) +
      '<circle class="' + P + 'pivot" cx="85" cy="' + ((yl + yr) / 2) + '" r="6"/>' +
      '</svg>';
  }

  var el, api, radios, scalesEl, selected, locked, mark;

  function reset() { selected = null; mark = null; }

  function choose(i, focus) {
    if (locked) return;
    selected = i;
    refresh();
    if (focus) radios[i].focus();
    api.changed();
  }
  function refresh() {
    var kind = selected === null ? null : KINDS[selected];
    radios.forEach(function (btn, i) {
      var on = selected === i, ok = KINDS[i] === RIGHT;
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
    [].forEach.call(scalesEl.querySelectorAll('.' + P + 'sc-crate'), function (g) {
      g.classList.toggle('hl', g.getAttribute('data-kind') === kind);
    });
  }
  function onKey(e) {
    var k = e.key, i = radios.indexOf(e.currentTarget), to = null;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % radios.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + radios.length - 1) % radios.length;
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }

  Biber.register({
    id: 'amschwersten20',
    story:
      '<p>Fünf Kisten sind mit fünf verschiedenen Bildern markiert: Herz, Stern, Fünfeck, Kreis und Quadrat.</p>' +
      '<p>Mit einer Waage werden jeweils zwei Kisten verglichen. Die schwerere Kiste liegt unten. Auf der ersten Waage ist zum Beispiel die Herz-Kiste schwerer als die Kreis-Kiste.</p>' +
      '<p>Insgesamt wird fünf Mal verglichen:</p>',
    question: 'Welche Kiste ist am schwersten?',
    howto: 'Tippe unten auf die schwerste Kiste. Wenn du eine Kiste auswählst, wird sie auf den Waagen oben hervorgehoben.',
    explanation: function () {
      return '<p>Die Vergleiche ergeben eine Kette: Das Fünfeck ist schwerer als das Quadrat, das Quadrat schwerer als der Stern, der Stern schwerer als das Herz und das Herz schwerer als der Kreis. ' +
        'Das Fünfeck ist also schwerer als alle anderen.</p>' +
        '<div class="' + P + 'chain" aria-label="Reihenfolge von schwer nach leicht: Fünfeck, Quadrat, Stern, Herz, Kreis">' +
        ['fuenfeck', 'quadrat', 'stern', 'herz', 'kreis'].map(function (k, i) {
          return (i ? '<span class="' + P + 'gt" aria-hidden="true">&gt;</span>' : '') + crateSvg(k, P + 'crate-s');
        }).join('') + '</div>' +
        '<p>Abkürzung: Die schwerste Kiste liegt bei keinem Vergleich oben, denn sie ist nie leichter als eine andere. Das trifft nur auf das Fünfeck zu. ' +
        'In der Informatik nennt man das Sortieren aus lauter Einzelvergleichen <em>topologische Sortierung</em>: Man nimmt immer eine Kiste heraus, die bei keinem Vergleich oben liegt, und stellt sie ans Ende der Reihenfolge.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      scalesEl = h('div', { class: P + 'scales' });
      scalesEl.innerHTML = WEIGH.map(function (w, i) { return '<div class="' + P + 'scale-wrap">' + scaleSvg(w, i) + '</div>'; }).join('');
      radios = KINDS.map(function (k, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-kind': k,
          'aria-label': 'Kiste mit ' + NAME[k],
          onclick: function () { choose(i, false); }, onkeydown: onKey
        });
        btn.innerHTML = crateSvg(k);
        return btn;
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { 'aria-label': 'Die fünf Wägungen' }, h('h3', null, 'Die fünf Wägungen'), scalesEl),
        h('section', { 'aria-label': 'Antwort' }, h('h3', null, 'Welche Kiste ist am schwersten?'),
          h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Kisten' }, radios))));
      refresh();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () {
      return { correct: KINDS[selected] === RIGHT, answer: { choice: KINDS[selected] } };
    },
    setAnswer: function (ans) {
      var i = KINDS.indexOf(ans && ans.choice);
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
    showSolution: function () { selected = KINDS.indexOf(RIGHT); mark = 'solution'; locked = true; refresh(); }
  });
})();
