/* Aufgabe Superstar (Heft 2019, S. 51; 5-6 schwer, 7-8 einfach): Modellierung, Graphen, soziale Netzwerke */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-superstar19-';

  /* Gruppe aus der Aufgabe: Wer folgt wem? */
  var NAMES = ['Alan', 'Don', 'Frances', 'Grace', 'Robin'];
  var FOLLOWS = {
    Alan: ['Don', 'Grace'],
    Don: ['Grace', 'Robin'],
    Frances: ['Alan', 'Grace', 'Robin'],
    Grace: [],
    Robin: ['Alan', 'Grace']
  };
  var POS = { Grace: [200, 34], Robin: [62, 128], Don: [338, 128], Alan: [112, 252], Frances: [288, 252] };
  var EXAMPLE = { names: ['Hailey', 'Selena', 'Justin'],
    follows: { Hailey: ['Justin', 'Selena'], Selena: ['Justin'], Justin: [] },
    pos: { Justin: [150, 34], Selena: [244, 112], Hailey: [56, 112] }, h: 156 };
  var OPTIONS = [
    { k: 'A', t: 'Ja, Alan ist ein Superstar in dieser Gruppe.' },
    { k: 'B', t: 'Ja, Frances und Robin sind Superstars in dieser Gruppe.' },
    { k: 'C', t: 'Ja, Grace ist ein Superstar in dieser Gruppe.' },
    { k: 'D', t: 'Nein, es gibt keinen Superstar in dieser Gruppe.' }
  ];
  var RIGHT = 'C';

  /* Superstar: alle anderen folgen ihm, er folgt niemandem */
  function superstars(names, follows) {
    return names.filter(function (n) {
      return follows[n].length === 0 && names.every(function (m) { return m === n || follows[m].indexOf(n) >= 0; });
    });
  }
  function followersOf(n) { return NAMES.filter(function (m) { return FOLLOWS[m].indexOf(n) >= 0; }); }
  function list(a) { return a.length ? a.join(', ') : 'niemand'; }

  var HW = 46, HH = 17;
  function edgeEnds(a, b, gap) {
    var dx = b[0] - a[0], dy = b[1] - a[1];
    var tx = dx ? HW / Math.abs(dx) : Infinity, ty = dy ? HH / Math.abs(dy) : Infinity;
    var t = Math.min(tx, ty);
    var len = Math.sqrt(dx * dx + dy * dy);
    var g = gap / len;
    return [a[0] + dx * t, a[1] + dy * t, b[0] - dx * (t + g), b[1] - dy * (t + g)];
  }

  /* SVG als Text; sel = markiertes Mitglied, star = Superstar-Stern */
  function graphSvg(spec, sel, star, label) {
    var d = '';
    var edges = [];
    spec.names.forEach(function (a) { spec.follows[a].forEach(function (b) { edges.push([a, b]); }); });
    var order = { n: [], i: [], o: [] };
    edges.forEach(function (e) {
      var cls = 'n';
      if (sel) {
        if (e[0] === sel) { cls = 'o'; } else if (e[1] === sel) { cls = 'i'; } else { cls = 'd'; }
      }
      var p = edgeEnds(spec.pos[e[0]], spec.pos[e[1]], 5);
      var line = '<line class="' + P + 'e ' + P + 'e-' + cls + '" x1="' + p[0].toFixed(1) + '" y1="' + p[1].toFixed(1) + '" x2="' + p[2].toFixed(1) + '" y2="' + p[3].toFixed(1) +
        '" marker-end="url(#' + P + 'mk-' + (cls === 'd' ? 'd' : cls) + ')"/>';
      (cls === 'o' || cls === 'i' ? order.o : order.n).push(line);
    });
    var nodes = spec.names.map(function (n) {
      var p = spec.pos[n];
      var on = sel === n;
      var s = star === n ? '<g class="' + P + 'star" transform="translate(' + (p[0] + HW - 4) + ',' + (p[1] - HH - 4) + ')"><circle r="11"/><text y="5" text-anchor="middle">★</text></g>' : '';
      return '<g class="' + P + 'node' + (on ? ' on' : '') + '" data-n="' + n + '"><rect x="' + (p[0] - HW) + '" y="' + (p[1] - HH) + '" width="' + (2 * HW) + '" height="' + (2 * HH) + '" rx="9"/>' +
        '<text x="' + p[0] + '" y="' + (p[1] + 6) + '" text-anchor="middle">' + n + '</text>' + s + '</g>';
    });
    var mk = function (c) {
      return '<marker id="' + P + 'mk-' + c + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse"><path class="' + P + 'mk ' + P + 'mk-' + c + '" d="M0 0 L10 5 L0 10 z"/></marker>';
    };
    return '<svg class="' + P + 'svg" viewBox="0 0 400 ' + (spec.h || 290) + '" role="img" aria-label="' + label + '"><defs>' + mk('n') + mk('o') + mk('i') + mk('d') + '</defs>' +
      order.n.join('') + order.o.join('') + nodes.join('') + '</svg>';
  }
  var MAIN = { names: NAMES, follows: FOLLOWS, pos: POS, h: 290 };
  function mainLabel() {
    return 'Pfeildiagramm der Gruppe: ' + NAMES.map(function (n) { return n + ' folgt ' + list(FOLLOWS[n]); }).join('; ') + '.';
  }

  var el, api, locked, picked, mode, sel;
  var graphEl, chipsEl, infoEl, optsEl;

  function renderGraph() {
    graphEl.innerHTML = graphSvg(MAIN, sel, mode === 'solution' ? 'Grace' : null, mainLabel());
  }
  function renderChips() {
    chipsEl.replaceChildren.apply(chipsEl, NAMES.map(function (n) {
      return h('button', { type: 'button', class: P + 'chip' + (sel === n ? ' on' : ''), 'data-n': n, 'aria-pressed': String(sel === n) }, n);
    }));
  }
  function renderInfo() {
    if (!sel) {
      infoEl.textContent = 'Tippe auf ein Mitglied, um zu sehen, wem es folgt (durchgezogene Pfeile) und wer ihm folgt (gestrichelte Pfeile).';
      return;
    }
    infoEl.replaceChildren(
      h('b', null, sel), ' folgt: ', h('span', null, list(FOLLOWS[sel])), '. ',
      h('br'), 'Ihm folgen: ', h('span', null, list(followersOf(sel))), '.');
  }
  function renderOpts() {
    optsEl.replaceChildren.apply(optsEl, OPTIONS.map(function (o) {
      var sl = picked === o.k;
      var cls = P + 'opt';
      var mark = '';
      if (mode && (mode === 'solution' ? o.k === RIGHT : sl)) {
        var ok = o.k === RIGHT;
        cls += ok ? ' right' : ' wrong';
        mark = ok ? '✓' : '✗';
      }
      var input = h('input', { type: 'radio', name: P + 'opt', value: o.k, disabled: locked, 'aria-label': 'Antwort ' + o.k + ': ' + o.t });
      input.checked = sl;
      return h('label', { class: cls }, input,
        h('span', { class: P + 'card' },
          h('span', { class: P + 'let' }, o.k + ')'),
          h('span', { class: P + 'txt' }, o.t),
          mark ? h('span', { class: P + 'mark', 'aria-hidden': 'true' }, mark) : null));
    }));
  }
  function renderAll() { renderGraph(); renderChips(); renderInfo(); renderOpts(); }

  function pickMember(n) {
    sel = sel === n ? null : n;
    renderGraph(); renderChips(); renderInfo();
  }

  Biber.register({
    id: 'superstar19',
    story: '<p>Im sozialen Netzwerk „TeeniGram“ können Mitglieder anderen Mitgliedern „folgen“. In TeeniGram gibt es außerdem Mitglieder-Gruppen. ' +
      'In einer Gruppe nennt man ein Mitglied <b>„Superstar“</b>, wenn</p>' +
      '<ul class="' + P + 'rules"><li>jedes andere Mitglied der Gruppe ihm folgt <b>und</b></li><li>es selbst keinem anderen Mitglied der Gruppe folgt.</li></ul>' +
      '<div class="' + P + 'example"><div><p><i>Ein Beispiel:</i> Eine TeeniGram-Gruppe hat drei Mitglieder, nämlich Hailey, Selena und Justin.</p>' +
      '<ul><li>Hailey folgt Justin und Selena.</li><li>Selena folgt Justin.</li><li>Justin folgt keinem Mitglied der Gruppe.</li></ul>' +
      '<p>Justin ist ein Superstar in dieser Gruppe.</p></div>' +
      '<div class="' + P + 'exg">' + graphSvg({ names: EXAMPLE.names, follows: EXAMPLE.follows, pos: EXAMPLE.pos, h: EXAMPLE.h }, null, 'Justin',
        'Pfeildiagramm des Beispiels: Hailey folgt Justin und Selena, Selena folgt Justin, Justin folgt niemandem. Justin ist der Superstar.') + '</div></div>' +
      '<p>Eine andere TeeniGram-Gruppe hat diese Mitglieder: Alan, Don, Frances, Grace und Robin.</p>' +
      '<ul><li>Alan folgt Don und Grace.</li><li>Don folgt Grace und Robin.</li><li>Frances folgt Alan, Grace und Robin.</li><li>Robin folgt Alan und Grace.</li></ul>',
    question: 'Gibt es einen Superstar in dieser Gruppe?',
    howto: 'Wähle eine Antwort aus. Zur Hilfe kannst Du unten ein Mitglied antippen: Dann zeigt das Pfeildiagramm, wem es folgt und wer ihm folgt. Ein Pfeil zeigt von dem, der folgt, zu dem, dem gefolgt wird.',
    explanation: function () {
      return '<p><b>Grace</b> ist der Superstar: Alan, Don, Frances und Robin folgen ihr, und sie selbst folgt niemandem. ' +
        'Alan, Don, Frances und Robin folgen alle mindestens einem Mitglied, deshalb kann keiner von ihnen ein Superstar sein. ' +
        'Es gibt höchstens einen Superstar: Würde es zwei geben, müsste jeder dem anderen folgen, aber ein Superstar folgt ja niemandem.</p>' +
        '<div class="' + P + 'exp">' + graphSvg(MAIN, 'Grace', 'Grace', mainLabel() + ' Grace ist der Superstar.') + '</div>' +
        '<p><b>Informatik:</b> Beziehungen in einem sozialen Netzwerk lassen sich als gerichteter Graph modellieren: Mitglieder sind die Knoten, „folgt“ ist ein Pfeil. ' +
        'Bei einer Freundschaft gilt die Beziehung in beide Richtungen, sie wäre ungerichtet. Strukturen wie den Superstar findet man mit Algorithmen auf dem Graphen, auch in sehr großen Netzwerken.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null; sel = null;
      graphEl = h('div', { class: P + 'graph' });
      chipsEl = h('div', { class: P + 'chips', role: 'group', 'aria-label': 'Mitglied auswählen' });
      infoEl = h('p', { class: P + 'info', 'aria-live': 'polite' });
      optsEl = h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Antworten' });
      el.replaceChildren(h('div', { class: P + 'box' },
        h('div', { class: P + 'explore' }, graphEl, chipsEl, infoEl,
          h('p', { class: P + 'legend', 'aria-hidden': 'true' },
            h('span', { class: P + 'lg o' }, 'folgt'), h('span', { class: P + 'lg i' }, 'wird gefolgt von'))),
        optsEl));
      chipsEl.addEventListener('click', function (e) {
        var b = e.target.closest('[data-n]'); if (!b) return;
        pickMember(b.getAttribute('data-n'));
        var nb = chipsEl.querySelector('[data-n="' + b.getAttribute('data-n') + '"]'); if (nb) nb.focus();
      });
      graphEl.addEventListener('click', function (e) {
        var g = e.target.closest('[data-n]'); if (!g) return;
        pickMember(g.getAttribute('data-n'));
      });
      optsEl.addEventListener('change', function (e) {
        if (locked || !e.target.matches('input[type=radio]')) return;
        picked = e.target.value;
        renderOpts();
        var f = optsEl.querySelector('input:checked'); if (f) f.focus();
        api.changed('Antwort ' + picked + ' gewählt.');
      });
      renderAll();
    },
    isComplete: function () { return picked !== null; },
    evaluate: function () { return { correct: picked === RIGHT, answer: picked }; },
    setAnswer: function (ans) { picked = typeof ans === 'string' ? ans : null; mode = 'check'; renderAll(); },
    lock: function (on) {
      locked = on;
      mode = on ? (mode || 'check') : null;
      renderAll();
    },
    reset: function () { picked = null; mode = null; sel = null; renderAll(); },
    showSolution: function () { picked = RIGHT; mode = 'solution'; locked = true; sel = 'Grace'; renderAll(); }
  });
  /* Selbsttest der Daten: genau Grace ist Superstar */
  if (superstars(NAMES, FOLLOWS).join() !== 'Grace') { if (window.console) console.error('superstar19: Lösung stimmt nicht'); }
})();
