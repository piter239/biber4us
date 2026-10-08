/* Aufgabe Passwörter (Heft 2020, Klasse 9-10 schwer, 11-13 mittel): deterministischer endlicher Automat */
(function () {
  'use strict';
  var h = Biber.h, S = Biber.svg;

  var SYM = {
    Y: { name: 'Astgabel', short: 'der Astgabel' },
    L: { name: 'Baumscheibe', short: 'der Baumscheibe' }
  };
  /* Übergänge des neuen Diagramms: Zustand -> Symbol -> Folgezustand */
  var DELTA = {
    S: { Y: '1' },
    '1': { L: '2', Y: '3' },
    '2': { Y: 'E' },
    '3': { L: 'E' },
    E: { Y: '1', L: '4' },
    '4': { Y: '5' },
    '5': { Y: 'E' }
  };
  var OPTIONS = {
    A: 'YYLLYYYLY',
    B: 'LYYLYY',
    C: 'YLYLYYL',
    D: 'YYLLYYLYL'
  };
  var LETTERS = ['A', 'B', 'C', 'D'];

  /* Zeichnung des neuen Diagramms (Koordinaten im Feld 580x290) */
  var BIG = {
    w: 580, h: 270, y0: 10, r: 26,
    nodes: { S: [40, 150, 'S'], '1': [170, 150, '1'], '2': [280, 55, '2'], '3': [280, 245, '3'], E: [390, 150, 'E'], '4': [510, 70, '4'], '5': [510, 230, '5'] },
    edges: [
      { a: 'S', b: '1', s: 'Y', l: [105, 118] },
      { a: '1', b: '2', s: 'L', l: [193, 78] },
      { a: '2', b: 'E', s: 'Y', l: [362, 78] },
      { a: '1', b: '3', s: 'Y', l: [193, 222] },
      { a: '3', b: 'E', s: 'L', l: [372, 224] },
      { a: 'E', b: '1', s: 'Y', l: [280, 118] },
      { a: 'E', b: '4', s: 'L', l: [434, 90] },
      { a: '4', b: '5', s: 'Y', l: [546, 150] },
      { a: '5', b: 'E', s: 'Y', l: [436, 222] }
    ]
  };
  /* Beispiel-Diagramm aus dem Heft */
  var EX = {
    w: 330, h: 130, r: 18,
    nodes: { S: [30, 92, 'S'], a: [120, 92, ''], b: [190, 36, ''], E: [290, 92, 'E'] },
    edges: [
      { a: 'S', b: 'a', s: 'Y', l: [75, 68] },
      { a: 'a', b: 'b', s: 'L', l: [135, 46] },
      { a: 'b', b: 'E', s: 'Y', l: [258, 46] },
      { a: 'E', b: 'a', s: 'L', l: [205, 118] }
    ]
  };
  var EX_WORDS = ['YLY', 'YLYLLY', 'YLYLLYLLY'];

  var uid = 0;

  function symG(k, x, y, size) {
    var kids = k === 'Y' ?
      [S('path', { d: 'M6 3 L16 17 M26 3 L16 17 L16 30', class: 't-passwoerter20-ast' })] :
      [S('circle', { cx: 16, cy: 16, r: 13, class: 't-passwoerter20-log' }),
        S('circle', { cx: 16, cy: 16, r: 8, class: 't-passwoerter20-ring' }),
        S('circle', { cx: 16, cy: 16, r: 3.5, class: 't-passwoerter20-ring' })];
    return S.apply(null, ['g', { transform: 'translate(' + (x - size / 2) + ' ' + (y - size / 2) + ') scale(' + (size / 32) + ')' }].concat(kids));
  }
  function symSvg(k, size, cls) {
    return S('svg', { viewBox: '0 0 32 32', width: size, height: size, class: cls || 't-passwoerter20-sym', role: 'img', 'aria-label': SYM[k].name, focusable: 'false' }, symG(k, 16, 16, 32));
  }

  function diagram(cfg, label) {
    var id = 't-passwoerter20-arrow' + (++uid);
    var kids = [S('defs', {}, S('marker', { id: id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' },
      S('path', { d: 'M0 0 L10 5 L0 10 z', class: 't-passwoerter20-head' })))];
    cfg.edges.forEach(function (e) {
      var a = cfg.nodes[e.a], b = cfg.nodes[e.b];
      var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.sqrt(dx * dx + dy * dy);
      var ux = dx / len, uy = dy / len;
      kids.push(S('line', {
        x1: a[0] + ux * cfg.r, y1: a[1] + uy * cfg.r, x2: b[0] - ux * (cfg.r + 2), y2: b[1] - uy * (cfg.r + 2),
        class: 't-passwoerter20-edge', 'marker-end': 'url(#' + id + ')'
      }));
      kids.push(symG(e.s, e.l[0], e.l[1], cfg.r > 20 ? 40 : 26));
    });
    Object.keys(cfg.nodes).forEach(function (k) {
      var n = cfg.nodes[k];
      var end = k === 'E';
      kids.push(S('circle', { cx: n[0], cy: n[1], r: cfg.r, class: 't-passwoerter20-node' + (k === 'S' ? ' start' : '') }));
      if (end) kids.push(S('circle', { cx: n[0], cy: n[1], r: cfg.r - 4, class: 't-passwoerter20-node-in' }));
      if (n[2]) kids.push(S('text', { x: n[0], y: n[1] + 7, 'text-anchor': 'middle', class: 't-passwoerter20-nl' }, n[2]));
    });
    return S.apply(null, ['svg', { viewBox: '0 ' + (cfg.y0 || 0) + ' ' + cfg.w + ' ' + cfg.h, class: 't-passwoerter20-diagram', role: 'img', 'aria-label': label }].concat(kids));
  }

  /* Verfolgt ein Passwort durch den Automaten */
  function trace(w) {
    var st = 'S', path = ['S'], i, c;
    for (i = 0; i < w.length; i++) {
      c = w.charAt(i);
      var nx = DELTA[st] && DELTA[st][c];
      if (!nx) return { ok: false, path: path, why: st === 'S' ? 'Von S aus führt nur ein Pfeil mit der Astgabel weg, das Passwort beginnt aber mit der Baumscheibe.' : 'Beim Kreis ' + st + ' gibt es keinen Pfeil mit ' + SYM[c].short + ', aber als Nächstes kommt dieses Symbol.' };
      st = nx; path.push(st);
    }
    if (st !== 'E') return { ok: false, path: path, why: 'Der Pfad endet beim Kreis ' + st + ', nicht beim Kreis E.' };
    return { ok: true, path: path };
  }
  function valid(w) { return trace(w).ok; }

  function seqSvg(w) {
    return h('span', { class: 't-passwoerter20-seq' }, w.split('').map(function (c) { return symSvg(c, 26); }));
  }
  function html(node) { var d = document.createElement('div'); d.appendChild(node); return d.innerHTML; }
  function seqHtml(w) { return html(seqSvg(w)); }

  var el, api, sel, locked, mode;

  function render() {
    var cards = LETTERS.map(function (L) {
      var w = OPTIONS[L], ok = valid(w), reveal = !!mode;
      var cls = 't-passwoerter20-card' + (sel === L ? ' selected' : '');
      if (mode === 'check' && sel === L) cls += ok ? ' right' : ' wrong';
      if (mode === 'solution' && ok) cls += ' right';
      var tr = trace(w);
      return h('label', { class: cls },
        h('input', {
          type: 'radio', name: 't-passwoerter20', value: L, checked: sel === L, disabled: locked,
          'aria-label': 'Passwort ' + L + ': ' + w.split('').map(function (c) { return SYM[c].name; }).join(', ')
        }),
        h('span', { class: 't-passwoerter20-letter' }, L),
        h('span', { class: 't-passwoerter20-pw' }, seqSvg(w),
          reveal ? h('span', { class: 't-passwoerter20-why' }, tr.ok ? 'Gültig. Pfad: ' + tr.path.join('-') : 'Nicht gültig. ' + tr.why) : null));
    });
    el.replaceChildren(h('div', { class: 't-passwoerter20-wrap' },
      h('div', { class: 't-passwoerter20-dia' }, diagram(BIG, 'Neues Diagramm mit den Kreisen S, 1 bis 5 und E. Von S führt ein Pfeil mit der Astgabel zu 1. Von 1 führt ein Pfeil mit der Baumscheibe zu 2 und einer mit der Astgabel zu 3. Von 2 führt die Astgabel zu E, von 3 die Baumscheibe zu E. Von E führt die Astgabel zurück zu 1 und die Baumscheibe zu 4. Von 4 führt die Astgabel zu 5, von 5 die Astgabel zu E.')),
      h('div', { class: 't-passwoerter20-opts', role: 'radiogroup', 'aria-label': 'Passwörter A bis D' }, cards)));
  }

  function onChange(e) {
    if (locked || !e.target.matches('input[type=radio]')) return;
    sel = e.target.value;
    render();
    var again = el.querySelector('input[value="' + sel + '"]');
    if (again) again.focus();
    api.changed();
  }

  Biber.register({
    id: 'passwoerter20',
    get story() {
      return '<p>Die Biber haben eigene Regeln für Passwörter. Die Passwörter sind aus den beiden Symbolen ' + html(symSvg('Y', 30)) + ' (Astgabel) und ' + html(symSvg('L', 30)) + ' (Baumscheibe) aufgebaut.</p>' +
        '<p>Ein Diagramm legt die gültigen Passwörter fest. Ein Passwort ist dann gültig, wenn es im Diagramm einen Pfad vom Kreis S entlang der Pfeile zum Kreis E gibt, der der Reihe nach die Symbole des Passworts enthält. Andere Passwörter sind nicht gültig.</p>' +
        '<p><b>Ein Beispiel:</b> Nach diesem Diagramm sind unendlich viele Passwörter gültig, zum Beispiel diese drei:</p>' +
        '<div class="t-passwoerter20-ex">' + html(diagram(EX, 'Beispiel-Diagramm: Von S führt die Astgabel zum ersten Kreis, von dort die Baumscheibe zum oberen Kreis, von dort die Astgabel zu E, und von E führt die Baumscheibe zurück zum ersten Kreis.')) +
        '<div class="t-passwoerter20-exw">' + EX_WORDS.map(seqHtml).join('') + '</div></div>' +
        '<p>Die Biber erfinden ein neues Diagramm:</p>';
    },
    question: 'Welches der folgenden Passwörter ist nach dem neuen Diagramm gültig?',
    howto: 'Verfolge die Symbole eines Passworts vom Kreis S aus Pfeil für Pfeil durch das Diagramm. Tippe dann das gültige Passwort an.',
    explanation: function () {
      return '<p><b>Antwort A ist richtig.</b> Der Pfad S-1-3-E-4-5-E-1-2-E enthält die Symbole des Passworts der Reihe nach. Bei den anderen kommt man nicht ans Ziel: B beginnt mit der Baumscheibe, aber von S aus gibt es nur einen Pfeil mit der Astgabel. Bei C endet der einzig mögliche Pfad bei Kreis 4 statt bei E, und bei D gibt es ab Kreis 5 keinen passenden Pfeil mehr.</p>' +
        '<p>Auch eine Abkürzung hilft: Gültige Passwörter sind immer aus Dreiergruppen aufgebaut (Länge ein Vielfaches von 3), und sie enthalten doppelt so viele Astgabeln wie Baumscheiben.</p>' +
        '<p>Solche Diagramme heißen Zustandsübergangsdiagramme und beschreiben endliche Automaten. Weil von jedem Kreis für jedes Symbol höchstens ein Pfeil ausgeht, muss man nur einen einzigen Weg verfolgen: Der Automat ist deterministisch. Das Passwort wird genau dann akzeptiert, wenn der Automat nach dem letzten Symbol im Zustand E steht.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; sel = null; locked = false; mode = null;
      el.addEventListener('change', onChange);
      render();
    },
    isComplete: function () { return !!sel; },
    evaluate: function () { return { correct: valid(OPTIONS[sel]), answer: sel }; },
    setAnswer: function (ans) { sel = ans; mode = null; render(); },
    lock: function (on) { locked = on; mode = on && sel ? (mode === 'solution' ? 'solution' : 'check') : null; render(); },
    reset: function () { sel = null; mode = null; render(); },
    showSolution: function () { sel = 'A'; locked = true; mode = 'solution'; render(); }
  });
})();
