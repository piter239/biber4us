/* Aufgabe Wortketten (Heft 2024, Klasse 7-8 schwer, 9-10 mittel, 11-13 einfach): Graph aus Woertern, Partition in Pfade */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-wortketten24-';
  var NS = 'http://www.w3.org/2000/svg';

  /* Neun Wörter mit Lage im Bild (viewBox 320 x 222) */
  var WORDS = {
    ROT: [44, 24], RAT: [160, 24], TAT: [276, 24],
    RAR: [100, 90], RAD: [220, 90],
    BAR: [44, 156], BAD: [160, 156], FAD: [276, 156],
    BAU: [160, 206]
  };
  var NAMES = Object.keys(WORDS);
  function adj(a, b) { var d = 0; for (var i = 0; i < 3; i++) if (a[i] !== b[i]) d++; return d === 1; }
  var EDGES = [];
  NAMES.forEach(function (a, i) { NAMES.slice(i + 1).forEach(function (b) { if (adj(a, b)) EDGES.push([a, b]); }); });

  var OPTIONS = [   /* Heft S. 72; bei A steht im Heft "ROT – RAD – TAT" (Druckfehler), in der Lösung ROT – RAT – TAT */
    { id: 'A', chain: ['ROT', 'RAT', 'TAT'] },
    { id: 'B', chain: ['BAU', 'BAR', 'RAR'] },
    { id: 'C', chain: ['BAR', 'BAD', 'FAD'] },
    { id: 'D', chain: ['BAD', 'FAD', 'RAD'] }
  ];
  var RIGHT = 'C';   /* offizielle Lösung; per Skript bestätigt: nur nach C lassen sich die übrigen sechs Wörter nicht mehr in zwei Ketten ordnen */
  var COLORS = ['c1', 'c2', 'c3'];

  var el, api, locked, picked, mode, optsEl, svgEl, msgEl, clearBtn;
  var chains, pending;   /* chains: vom Nutzer gebaute Ketten (zusätzlich zur gewählten Antwort) */

  function chainText(c) { return c.join(' – '); }
  function firstChain() { var o = OPTIONS.filter(function (x) { return x.id === picked; })[0]; return o ? o.chain : null; }
  function allChains() { var f = firstChain(); return (f ? [f] : []).concat(chains); }
  function usedBy(w) {
    var list = allChains();
    for (var i = 0; i < list.length; i++) if (list[i].indexOf(w) >= 0) return i;
    return -1;
  }

  function svg(tag, attrs, kids) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (c) { n.appendChild(c); });
    return n;
  }

  function renderGraph() {
    var list = allChains();
    var g = [];
    EDGES.forEach(function (e) {
      g.push(svg('line', { x1: WORDS[e[0]][0], y1: WORDS[e[0]][1], x2: WORDS[e[1]][0], y2: WORDS[e[1]][1], class: P + 'edge' }));
    });
    list.forEach(function (c, i) {
      for (var k = 0; k < 2; k++) {
        g.push(svg('line', { x1: WORDS[c[k]][0], y1: WORDS[c[k]][1], x2: WORDS[c[k + 1]][0], y2: WORDS[c[k + 1]][1], class: P + 'link', style: 'stroke:var(--' + COLORS[i] + ')' }));
      }
    });
    NAMES.forEach(function (w) {
      var u = usedBy(w), isPend = pending.indexOf(w) >= 0;
      var cls = P + 'node' + (u >= 0 ? ' used' : '') + (isPend ? ' pend' : '');
      var style = u >= 0 ? '--nc:var(--' + COLORS[u] + ')' : '';
      var node = svg('g', {
        class: cls, tabindex: '0', role: 'button', 'data-w': w, transform: 'translate(' + WORDS[w][0] + ' ' + WORDS[w][1] + ')', style: style,
        'aria-label': w + (u >= 0 ? ', gehört zu Kette ' + (u + 1) + (u === 0 ? ' (deine Antwort)' : '') : isPend ? ', ausgewählt' : ', frei'),
        'aria-pressed': String(isPend)
      }, [
        svg('rect', { x: -27, y: -14, width: 54, height: 28, rx: 14 }),
        svg('text', { 'text-anchor': 'middle', y: 5 })
      ]);
      node.lastChild.textContent = w;
      g.push(node);
    });
    svgEl.replaceChildren.apply(svgEl, g);
  }

  function freeWords() { return NAMES.filter(function (w) { return usedBy(w) < 0; }); }

  function renderMsg(extra) {
    var list = allChains();
    var txt;
    if (!picked) txt = 'Wähle eine Antwort. Dann siehst du die Kette hier im Bild und kannst ausprobieren, ob sich mit den übrigen Wörtern noch zwei weitere Ketten bilden lassen.';
    else {
      var free = freeWords();
      txt = 'Kette 1 (deine Antwort): ' + chainText(list[0]) + '.';
      for (var i = 1; i < list.length; i++) txt += ' Kette ' + (i + 1) + ': ' + chainText(list[i]) + '.';
      if (extra) txt += ' ' + extra;
      else if (!free.length) txt += ' Alle neun Wörter sind benutzt – diese Antwort ginge also zuerst.';
      else txt += ' Noch frei: ' + free.join(', ') + '.' + (list.length < 3 ? ' Tippe drei Wörter nacheinander an, um die nächste Kette zu bauen.' : '');
    }
    msgEl.textContent = txt;
    clearBtn.disabled = !(chains.length || pending.length);
  }

  function onNode(w) {
    if (locked || !picked) { if (!picked) renderMsg('Wähle zuerst eine Antwort.'); return; }
    var u = usedBy(w);
    if (u > 0) { chains.splice(u - 1, 1); pending = []; renderGraph(); renderMsg(); return; }
    if (u === 0) { renderMsg('Das Wort gehört zu deiner gewählten Kette. Wähle eine andere Antwort, um sie zu ändern.'); return; }
    if (chains.length >= 2) { renderMsg('Es gibt schon drei Ketten. Tippe auf ein Wort einer eigenen Kette, um sie zu entfernen.'); return; }
    var pi = pending.indexOf(w);
    if (pi >= 0) { pending.splice(pi, 1); renderGraph(); renderMsg(); return; }
    if (pending.length && !adj(pending[pending.length - 1], w)) {
      renderMsg(pending[pending.length - 1] + ' und ' + w + ' unterscheiden sich nicht an genau einer Position.');
      return;
    }
    pending.push(w);
    if (pending.length === 3) { chains.push(pending); pending = []; }
    renderGraph();
    renderMsg(pending.length ? 'Angefangene Kette: ' + chainText(pending) + ' …' : '');
    var nf = svgEl.querySelector('[data-w="' + w + '"]'); if (nf) nf.focus();
  }

  function optionCard(o) {
    var sel = picked === o.id;
    var cls = P + 'opt';
    var mark = '';
    if (mode && (mode === 'solution' ? o.id === RIGHT : sel)) {
      var ok = o.id === RIGHT;
      cls += ok ? ' right' : ' wrong';
      mark = ok ? '✓' : '✗';
    }
    var input = h('input', { type: 'radio', name: P + 'opt', value: o.id, disabled: locked, 'aria-label': 'Antwort ' + o.id + ': ' + chainText(o.chain) });
    input.checked = sel;
    return h('label', { class: cls }, input,
      h('span', { class: P + 'card' }, h('span', { class: P + 'letter' }, o.id + ')'), h('span', { class: P + 'words' }, chainText(o.chain)),
        mark ? h('span', { class: P + 'mark', 'aria-hidden': 'true' }, mark) : null));
  }
  function renderOptions() { optsEl.replaceChildren.apply(optsEl, OPTIONS.map(optionCard)); }
  function refresh() { renderOptions(); renderGraph(); renderMsg(); }

  function onChange(e) {
    if (locked || !e.target.matches('input[type=radio]')) return;
    picked = e.target.value;
    chains = []; pending = [];
    refresh();
    var f = optsEl.querySelector('input:checked'); if (f) f.focus();
    api.changed('Antwort ' + picked + ' gewählt.');
  }

  Biber.register({
    id: 'wortketten24',
    story: '<p>Herr Bibers Klasse lernt Lesen. Dabei arbeiten sie mit Wortketten: Das nächste Wort in einer Kette unterscheidet sich von seinem Vorgänger an genau einer Position. Hier ist ein Beispiel:</p>' +
      '<p class="' + P + 'ex"><b>BAD – RAD – RAT – ROT</b></p>' +
      '<p>Herr Biber schreibt nun diese neun Wörter an die Tafel: ROT, RAD, RAT, BAD, BAR, RAR, TAT, BAU, FAD.</p>' +
      '<p>Die Klasse soll alle Wörter benutzen und daraus drei Wortketten mit je drei Wörtern bilden. Herr Biber warnt: „Je nachdem, welche Wortkette man zuerst bildet, schafft man es nicht mehr, zwei weitere Wortketten zu bilden und alle Wörter zu benutzen.“</p>',
    question: 'Welche Wortkette soll die Klasse auf keinen Fall zuerst bilden?',
    howto: 'Im Bild sind Wörter verbunden, die sich an genau einer Position unterscheiden. Wähle eine Antwort und probiere im Bild aus, ob du mit den übrigen Wörtern noch zwei weitere Ketten bildest: Tippe dafür drei Wörter nacheinander an.',
    explanation: function () {
      return '<p>Zeichnet man alle Wörter auf und verbindet je zwei, die sich an genau einer Position unterscheiden, sieht man die Lösung: Das Wort BAU hat nur zwei Nachbarn, BAR und BAD. ' +
        'Bildet man zuerst die Kette <b>BAR – BAD – FAD</b>, sind beide Nachbarn schon benutzt, BAU bleibt allein übrig, und mit den übrigen Wörtern bleiben noch RAR und RAD ohne Partner. Antwort C ist also richtig.</p>' +
        '<p>Bei den anderen Antworten klappt es: Nach A (ROT – RAT – TAT) passen zum Beispiel BAU – BAR – RAR und BAD – FAD – RAD, nach B (BAU – BAR – RAR) passen ROT – RAT – TAT und BAD – FAD – RAD, nach D (BAD – FAD – RAD) passen ROT – RAT – TAT und BAU – BAR – RAR.</p>' +
        '<p><b>Informatik:</b> Das Bild ist ein Graph: Jedes Wort ist ein Knoten, und eine Kante verbindet zwei Wörter, die Nachbarn sind. Eine Wortkette ist ein Weg in diesem Graphen. ' +
        'Hier sollen alle Knoten genau einmal in drei Wegen verwendet werden, sodass der Graph in drei Komponenten zerfällt. Mit Graphen modellieren Programme viele Probleme, zum Beispiel die Wegsuche in Navigationssystemen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null; chains = []; pending = [];
      optsEl = h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Wortkette, die man nicht zuerst bilden soll' });
      svgEl = svg('svg', { viewBox: '0 0 320 222', class: P + 'svg', role: 'group', 'aria-label': 'Die neun Wörter als Netz. Wörter, die sich an genau einer Position unterscheiden, sind durch eine Linie verbunden.' });
      msgEl = h('p', { class: P + 'msg', 'aria-live': 'polite' });
      clearBtn = h('button', { type: 'button', class: 'btn ghost', onclick: function () { if (locked) return; chains = []; pending = []; refresh(); } }, 'Eigene Ketten löschen');
      el.replaceChildren(h('div', { class: P.slice(0, -1) },
        h('section', { 'aria-label': 'Antworten' }, h('h3', null, 'Wortkette, die zuerst gebildet wird'), optsEl),
        h('section', { 'aria-label': 'Probierfeld' }, h('h3', null, 'Ausprobieren'), h('div', { class: P + 'board' }, svgEl), msgEl, clearBtn)));
      optsEl.addEventListener('change', onChange);
      svgEl.addEventListener('click', function (e) { var n = e.target.closest('[data-w]'); if (n) onNode(n.getAttribute('data-w')); });
      svgEl.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var n = e.target.closest('[data-w]'); if (!n) return;
        e.preventDefault(); onNode(n.getAttribute('data-w'));
      });
      refresh();
    },
    isComplete: function () { return !!picked; },
    evaluate: function () { return { correct: picked === RIGHT, answer: picked }; },
    setAnswer: function (ans) { picked = ans || null; mode = 'check'; chains = []; pending = []; refresh(); },
    lock: function (on) { locked = on; mode = on ? (mode || 'check') : null; pending = []; refresh(); },
    reset: function () { picked = null; mode = null; chains = []; pending = []; refresh(); },
    showSolution: function () { picked = RIGHT; mode = 'solution'; locked = true; chains = []; pending = []; refresh(); }
  });
})();
