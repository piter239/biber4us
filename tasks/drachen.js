/* Aufgabe Der Drachen ist weg! (Klasse 7-8, schwer): Schnur-Parität / Lösungssuche */
(function () {
  'use strict';
  var h = Biber.h;
  var NS = 'http://www.w3.org/2000/svg';

  /* Maße in Punkten der Heftseite: vier Grasblöcke aus je drei Feldern (Breite 31,2), dazwischen drei freie, schon durchsuchte Felder.
     Zusammen 12 + 3 = 15 Felder. Die Schnur ist die Kurve aus der Abbildung im Heft (verdeckt von den Grasfeldern). */
  var W = 31.2, TOP = 327.6, HT = 90.7;
  var BLOCK_X = [92, 216.8, 341.6, 466.4];
  var FIRST_FIELD = [1, 5, 9, 13];                   /* Feldnummer des ersten Grasfeldes je Block (Nummern 1 bis 15 von links) */
  var GAPS = [{ x: 185.6, nr: 4 }, { x: 310.4, nr: 8 }, { x: 435.2, nr: 12 }];
  var STRING_D = 'M -0.000471194 -0.00185683 C 0.730886 -36.78091 12.651617 -43.609517 22.976659 -45.005745 C 25.71436 -45.37729 38.049657 -47.481408 43.96309 -35.916579 C 56.513492 -11.355493 85.149841 1.961466 110.387531 3.803547 C 131.956701 5.37968 159.036471 -7.968566 183.29641 -19.322202 C 187.422516 -21.254236 208.119533 -32.670448 215.057649 -35.056158 C 276.960972 -56.343736 367.727482 -1.276843 441.512426 15.665613 C 535.259118 34.72001 470.109665 -32.838621 444.598206 -29.080149 C 424.824185 -27.985069 426.713198 -14.304387 401.976117 -13.987596 C 332.469808 -21.093885 344.914613 -12.082939 338.066451 1.410015 C 336.576359 4.343265 320.889335 12.52899 316.595056 13.205593 C 281.087078 18.81788 261.082308 8.903492 245.469592 -12.833851 C 243.103437 -16.130825 225.410068 -22.40407 222.175671 -24.054513 C 173.902186 -48.705552 131.937146 -60.505041 94.571443 -51.548849 C 48.245636 -19.31438 135.417937 -15.09832 192.882274 -0.103543 C 197.571564 1.1206 213.73182 4.730454 217.541135 4.957292 C 264.989398 7.773213 321.26088 -14.66811 351.598514 -28.544342';
  var STRING_T = 'matrix(0.998785 0 0 -0.998785 65.168439 354.771583)';
  var SOLUTION = 10;                                  /* mittleres Feld im dritten Block */

  var FIELDS = [];                                    /* die 12 anwählbaren Grasfelder */
  BLOCK_X.forEach(function (bx, b) {
    for (var p = 0; p < 3; p++) {
      FIELDS.push({ nr: FIRST_FIELD[b] + p, x: bx + p * W, block: b + 1, pos: p });
    }
  });
  var POS_NAME = ['linkes', 'mittleres', 'rechtes'];
  function fieldByNr(nr) { return FIELDS.filter(function (f) { return f.nr === nr; })[0]; }
  function fieldName(f) { return 'Feld ' + f.nr + ', ' + POS_NAME[f.pos] + ' Feld im ' + f.block + '. Grasblock'; }

  var el, api, svg, sel, locked, state;               /* state: null | 'check' | 'solution' */

  function s(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  function draw() {
    var revealed = {};
    if (state) { revealed[SOLUTION] = true; if (sel) revealed[sel] = true; }
    svg.replaceChildren();

    var defs = s('defs');
    var pat = s('pattern', { id: 'dr-grass', width: 10, height: 12, patternUnits: 'userSpaceOnUse' });
    pat.appendChild(s('path', { d: 'M2 9 L3 4 M4 9 L5 3 M7 10 L6 5 M8 5 L9 2', class: 'dr-tuft' }));
    defs.appendChild(pat);
    svg.appendChild(defs);

    var t = s('title');
    t.textContent = 'Wiese mit 15 Feldern: vier Grasblöcke aus je drei Feldern und drei schon durchsuchte Felder dazwischen';
    svg.appendChild(t);

    svg.appendChild(s('rect', { class: 'dr-ground', x: 43, y: 327.4, width: 518, height: 91 }));
    GAPS.forEach(function (g) {
      svg.appendChild(s('rect', { class: 'dr-gap', x: g.x, y: TOP, width: W, height: HT, 'data-gap': g.nr }));
    });

    /* Schnur (liegt unter dem Gras) */
    svg.appendChild(s('path', { class: 'dr-string', d: STRING_D, transform: STRING_T }));
    /* Griff am Schnurende */
    svg.appendChild(s('path', { class: 'dr-handle', d: 'M61.4 349 H68.8 L67.5 354.3 H62.7 Z' }));

    /* Grasfelder */
    FIELDS.forEach(function (f) {
      var on = sel === f.nr, open = !!revealed[f.nr];
      var res = '';
      if (state) {
        if (f.nr === SOLUTION) res = on ? ' right' : ' missing';
        else if (on) res = ' wrong';
      }
      var g = s('g', {
        class: 'dr-field' + (on ? ' on' : '') + (open ? ' open' : '') + res, 'data-nr': f.nr,
        role: 'radio', 'aria-checked': String(on), tabindex: locked ? '-1' : (on || (!sel && f.nr === 1) ? '0' : '-1'),
        'aria-label': fieldName(f) + (on ? ', ausgewählt' : '') +
          (res === ' right' ? ', richtig' : res === ' wrong' ? ', falsch' : res === ' missing' ? ', hier hätte Asterios suchen müssen' : '')
      });
      if (!open) {
        g.appendChild(s('rect', { class: 'dr-grass', x: f.x, y: TOP, width: W, height: HT }));
        g.appendChild(s('rect', { class: 'dr-tufts', x: f.x, y: TOP, width: W, height: HT }));
      } else {
        g.appendChild(s('rect', { class: 'dr-opened', x: f.x, y: TOP, width: W, height: HT }));
        /* aufgedeckt: die Schnur in diesem Feld nochmals über der Fläche zeichnen (Ausschnitt) */
        var cid = 'dr-clip-' + f.nr;
        var cp = s('clipPath', { id: cid });
        cp.appendChild(s('rect', { x: f.x, y: TOP, width: W, height: HT }));
        g.appendChild(cp);
        var cg = s('g', { 'clip-path': 'url(#' + cid + ')' });
        cg.appendChild(s('path', { class: 'dr-string', d: STRING_D, transform: STRING_T }));
        g.appendChild(cg);
      }
      g.appendChild(s('rect', { class: 'dr-edge', x: f.x, y: TOP, width: W, height: HT }));
      if (on || res === ' missing') {
        var m = s('text', { class: 'dr-mark', x: f.x + W / 2, y: TOP + 12, 'text-anchor': 'middle' });
        m.textContent = state ? (res === ' wrong' ? '✗' : '✓') : '';
        g.appendChild(m);
      }
      svg.appendChild(g);
    });
  }

  function choose(nr, focus) {
    if (locked) return;
    sel = nr;
    draw();
    if (focus) { var n = svg.querySelector('[data-nr="' + nr + '"]'); if (n) n.focus(); }
    api.changed('Feld ' + nr + ' gewählt');
  }
  function onClick(e) {
    var t = e.target.closest && e.target.closest('[data-nr]');
    if (t) choose(+t.getAttribute('data-nr'), false);
  }
  function onKey(e) {
    var t = e.target.closest && e.target.closest('[data-nr]');
    if (!t) return;
    var nr = +t.getAttribute('data-nr'), idx = FIELDS.indexOf(fieldByNr(nr)), d = 0;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') d = 1;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') d = -1;
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(nr, true); return; }
    if (!d) return;
    e.preventDefault();
    var nx = FIELDS[Math.max(0, Math.min(FIELDS.length - 1, idx + d))];
    choose(nx.nr, true);
  }

  Biber.register({
    id: 'drachen',
    story:
      '<p>So ein Pech! Asterios hat seinen Drachen auf der Wiese verloren. Die Drachenschnur hat sich im hohen Gras verfangen, und es ist gar nicht so einfach, den Drachen wiederzufinden.</p>' +
      '<p>Die Wiese ist in 15 Felder unterteilt, die man einzeln durchsuchen kann.</p>' +
      '<p>Asterios hat schon 3 Felder der Wiese durchsucht. Er schaut sich genau an, wie die Schnur in diesen Feldern verläuft, und erkennt: Jetzt muss er nur noch ein weiteres Feld durchsuchen, um sicher zu wissen, wo der Drachen ist.</p>',
    question: 'Welches Feld ist das?',
    howto: 'Tippe das Feld im hohen Gras an, das Asterios noch durchsuchen muss. Die drei hellgrünen Felder zwischen dem Gras hat er schon durchsucht.',
    explanation: function () {
      return '<p>Die Schnur hat nur zwei Enden. In einem Block ohne Drachen kommt jedes Schnurstück, das hineinführt, auch wieder heraus, am Rand enden dort also <strong>gerade</strong> viele Stücke. ' +
        'Block 1 hat 1 + 3 = 4, Block 2 hat 3 + 3 = 6 und Block 4 hat 2 Stücke: Der Drachen liegt dort nicht. In <strong>Block 3</strong> sind es 3 + 2 = 5, also ungerade. Hier muss der Drachen sein.</p>' +
        '<p>Welches der drei Felder in Block 3 es ist, hängt von den zwei Rändern dazwischen ab. Beide sieht man nur im <strong>mittleren Feld</strong>. Im Bild kreuzen dort links 3 und rechts 3 Schnurstücke. Damit hat das linke Feld 3 + 3 = 6 Enden (gerade), das rechte 3 + 2 = 5 (ungerade): Der Drachen liegt im rechten Feld. ' +
        'Das linke oder das rechte Feld allein zeigt nur einen der beiden Ränder und reicht nicht aus.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; sel = null; locked = false; state = null;
      svg = s('svg', {
        class: 'dr-map', viewBox: '42 326 520 94', role: 'radiogroup',
        'aria-label': 'Wiese mit 12 Grasfeldern in vier Blöcken, die Feldnummern zählen von links nach rechts, die schon durchsuchten Felder 4, 8 und 12 sind nicht wählbar', focusable: 'false'
      });
      svg.addEventListener('click', onClick);
      svg.addEventListener('keydown', onKey);
      el.replaceChildren(h('div', { class: 't-drachen' },
        h('div', { class: 'dr-board' }, svg),
        h('p', { class: 'dr-legend' },
          h('span', { class: 'dr-key dr-key-gap', 'aria-hidden': 'true' }), ' schon durchsucht (3 Felder)  ',
          h('span', { class: 'dr-key dr-key-grass', 'aria-hidden': 'true' }), ' hohes Gras, noch nicht durchsucht (12 Felder)')));
      draw();
    },
    isComplete: function () { return sel != null; },
    evaluate: function () { return { correct: sel === SOLUTION, answer: sel }; },
    setAnswer: function (ans) {
      sel = typeof ans === 'number' && fieldByNr(ans) ? ans : null;
      state = null;
      draw();
    },
    lock: function (on) {
      locked = !!on;
      state = locked ? (state || 'check') : null;
      draw();
    },
    reset: function () { sel = null; locked = false; state = null; draw(); },
    showSolution: function () { sel = SOLUTION; locked = true; state = 'solution'; draw(); }
  });
})();
