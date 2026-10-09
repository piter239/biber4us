/* Aufgabe Zauberland (Biber 2022; Klasse 11-13 schwer): Ersetzungsregeln (kontextfreie Grammatik); welche Anordnung kann aus einem Zauberhut nicht entstehen? */
(function () {
  'use strict';
  var h = Biber.h, S = Biber.svg;
  var P = 't-zauberland22-';

  var NAME = { H: 'Zauberhut', C: 'Kristallkugel', B: 'Zauberbuch', T: 'Zaubertrank' };
  var PLURAL = { H: 'Zauberhüte', C: 'Kristallkugeln', B: 'Zauberbücher', T: 'Zaubertränke' };
  /* Verwandlungen 1 bis 4 aus dem Heft */
  var RULES = [
    { id: 1, from: 'H', to: 'C' },
    { id: 2, from: 'H', to: 'HC' },
    { id: 3, from: 'C', to: 'TB' },
    { id: 4, from: 'C', to: 'THB' }
  ];
  var OPTIONS = [
    { key: 'A', seq: 'THTBB' },
    { key: 'B', seq: 'HTCBTCTB' },
    { key: 'C', seq: 'CTBTHB' },
    { key: 'D', seq: 'TBTB' }
  ];
  var RIGHT = 1;   /* B: laut Heft; per Skript (Ableitungen bis Länge 9 aufgezählt) bestätigt: A, C, D sind ableitbar, B nicht (3 Tränke, 2 Bücher) */
  var MAXWS = 20;

  var el, api, locked = false, selected = null, mark = null;
  var radios = [], wsSeq, wsHist, wsSel, wsEl, wsRulesEl, wsMsgEl, wsUndo;

  /* ---------- Symbole ---------- */
  function icon(k, size) {
    var kids;
    if (k === 'H') {
      kids = [
        S('path', { d: 'M9 36 C14 29 15 20 18 12 C20 6 26 3 32 5 C27 8 26 11 27 16 C28 24 30 31 32 36 Z', class: P + 'ink' }),
        S('ellipse', { cx: 20, cy: 37, rx: 18.5, ry: 5, class: P + 'ink' }),
        S('path', { d: 'M11.5 32 Q21 35 29.5 31', class: P + 'band' })
      ];
    } else if (k === 'C') {
      kids = [
        S('circle', { cx: 20, cy: 19, r: 15, class: P + 'glass' }),
        S('path', { d: 'M11 14 Q13 9 18 8', class: P + 'shine' }),
        S('path', { d: 'M9 33 Q20 29 31 33 L30 41 Q20 44.5 10 41 Z', class: P + 'ink' })
      ];
    } else if (k === 'B') {
      kids = [
        S('path', { d: 'M2.5 12 L20 16 L20 40 L2.5 36 Z', class: P + 'paper' }),
        S('path', { d: 'M37.5 12 L20 16 L20 40 L37.5 36 Z', class: P + 'paper' }),
        S('path', { d: 'M6 19 L16 21.5 M6 24 L16 26.5 M6 29 L16 31.5 M34 19 L24 21.5 M34 24 L24 26.5 M34 29 L24 31.5', class: P + 'lines' })
      ];
    } else {
      kids = [
        S('rect', { x: 16, y: 3, width: 8, height: 5, rx: 1.5, class: P + 'ink' }),
        S('path', { d: 'M17 8 H23 V17 C32 20 33 29 33 33 V38 Q33 43 28 43 H12 Q7 43 7 38 V33 C7 29 8 20 17 17 Z', class: P + 'ink' }),
        S('path', { d: 'M13 27 V37', class: P + 'shineb' })
      ];
    }
    var svg = S('svg', { viewBox: '0 0 40 46', width: size, height: Math.round(size * 1.15), class: P + 'ico', 'aria-hidden': 'true', focusable: 'false' });
    kids.forEach(function (c) { svg.appendChild(c); });
    return svg;
  }
  function seqIcons(str, size) {
    return str.split('').map(function (k) { return icon(k, size); });
  }
  function seqText(str) { return str.split('').map(function (k) { return NAME[k]; }).join(', '); }

  /* ---------- Antwortauswahl ---------- */
  function choose(i, focus) {
    if (locked) return;
    selected = i;
    refresh();
    if (focus) radios[i].focus();
    api.changed('Antwort ' + OPTIONS[i].key);
  }
  function onKey(e, i) {
    var to = i;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') to = (i + 1) % OPTIONS.length;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') to = (i + OPTIONS.length - 1) % OPTIONS.length;
    else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); return choose(i, false); }
    else return;
    e.preventDefault();
    choose(to, true);
  }
  function refresh() {
    radios.forEach(function (b, i) {
      var isSel = selected === i;
      b.setAttribute('aria-checked', isSel ? 'true' : 'false');
      b.setAttribute('aria-disabled', locked ? 'true' : 'false');
      b.tabIndex = isSel || (selected === null && i === 0) ? 0 : -1;
      var cls = P + 'opt';
      var m = b.querySelector('.' + P + 'mark');
      if (m) m.remove();
      var tag = '';
      if (mark === 'solution') { if (i === RIGHT) { cls += ' right'; tag = '✓'; } }
      else if (mark === 'check' && isSel) { cls += i === RIGHT ? ' right' : ' wrong'; tag = i === RIGHT ? '✓' : '✗'; }
      else if (isSel) cls += ' selected';
      b.className = cls;
      if (tag) b.appendChild(h('span', { class: P + 'mark', 'aria-hidden': 'true' }, tag));
    });
  }

  /* ---------- Zauberwerkstatt (nur zum Ausprobieren) ---------- */
  function wsReset() { wsSeq = ['H']; wsHist = []; wsSel = 0; wsMsgEl && (wsMsgEl.textContent = ''); }
  function wsDraw() {
    var chips = wsSeq.map(function (k, i) {
      if (k === 'T' || k === 'B') {
        return h('span', { class: P + 'chip ' + P + 'fixed', role: 'img', 'aria-label': NAME[k] + ' (verwandelt sich nicht)' }, icon(k, 30));
      }
      return h('button', { type: 'button', class: P + 'chip ' + (wsSel === i ? 'sel' : ''), 'aria-pressed': wsSel === i ? 'true' : 'false',
        'aria-label': NAME[k] + ', Stelle ' + (i + 1) + ' von ' + wsSeq.length + (wsSel === i ? ' (ausgewählt)' : ''),
        onclick: function () { wsSel = i; wsDraw(); } }, icon(k, 30));
    });
    wsEl.replaceChildren.apply(wsEl, chips);
    var k = wsSeq[wsSel];
    var btns = [];
    if (k === 'H' || k === 'C') {
      RULES.filter(function (r) { return r.from === k; }).forEach(function (r) {
        var b = h('button', { type: 'button', class: P + 'rulebtn', 'aria-label': 'Verwandlung ' + r.id + ': ' + NAME[k] + ' wird zu ' + seqText(r.to),
          disabled: wsSeq.length - 1 + r.to.length > MAXWS, onclick: function () { wsApply(r); } },
          h('span', { class: P + 'rn' }, String(r.id)), icon(k, 22), h('span', { class: P + 'arr', 'aria-hidden': 'true' }, '→'), seqIcons(r.to, 22));
        btns.push(b);
      });
    }
    wsRulesEl.replaceChildren.apply(wsRulesEl, btns);
    wsUndo.disabled = !wsHist.length;
    wsMsgEl.textContent = wsSeq.some(function (x) { return x === 'H' || x === 'C'; })
      ? 'Wähle ein Zauberhut- oder Kristallkugel-Symbol und eine Verwandlung.' : 'Hier kann sich nichts mehr verwandeln.';
  }
  function wsApply(r) {
    if (wsSeq[wsSel] !== r.from) return;
    wsHist.push({ seq: wsSeq.slice(), sel: wsSel });
    var ins = r.to.split('');
    wsSeq = wsSeq.slice(0, wsSel).concat(ins, wsSeq.slice(wsSel + 1));
    var nx = -1;
    for (var i = 0; i < wsSeq.length; i++) if (wsSeq[i] === 'H' || wsSeq[i] === 'C') { nx = i; if (i >= wsSel) break; }
    wsSel = nx < 0 ? 0 : nx;
    wsDraw();
  }

  function reset() { selected = null; mark = null; }

  Biber.register({
    id: 'zauberland22',
    story:
      '<p>Im Zauberland gibt es vier verschiedene magische Objekte: <b>Zauberhüte</b>, <b>Kristallkugeln</b>, <b>Zauberbücher</b> und <b>Zaubertränke</b>. Zauberhüte und Kristallkugeln können jeweils auf zwei verschiedene Weisen verwandelt werden.</p>' +
      '<p>Die Tabelle zeigt, was dabei aus den Objekten entsteht – genau an der Stelle, wo sie vorher waren, und genau in der gezeigten Anordnung. Verwandlungen können beliebig oft und in beliebiger Reihenfolge passieren. So kann aus einem einzigen magischen Objekt eine lange Anordnung von Objekten entstehen.</p>',
    question: 'Welche Anordnung kann aus einem einzigen Zauberhut NICHT entstehen?',
    howto: 'Wähle eine Antwort. In der Zauberwerkstatt kannst du die Verwandlungen selbst ausprobieren: Tippe ein Objekt an, wähle eine Verwandlung und sieh, was entsteht.',
    explanation: function () {
      return '<p><strong>Antwort B</strong> kann nicht entstehen. Die Anordnungen A, C und D lassen sich dagegen aus einem Zauberhut herstellen, zum Beispiel D: Hut → (2) Hut + Kugel → (1) Kugel + Kugel → (3) Trank, Buch + Kugel → (3) Trank, Buch, Trank, Buch.</p>' +
        '<p>Der Grund für B: Immer wenn ein Zaubertrank entsteht (Verwandlungen 3 und 4), entsteht gleichzeitig ein Zauberbuch. Jede Anordnung im Zauberland hat also <strong>genau so viele Zauberbücher wie Zaubertränke</strong>. In B sind es aber 2 Bücher und 3 Tränke, das geht weder aus einem Hut noch aus einer Kugel.</p>' +
        '<p>In der Informatik heißen solche Verwandlungen <em>Ersetzungsregeln</em>, eine Regelmenge ist eine <em>Grammatik</em> und die Menge aller entstehbaren Anordnungen ihre <em>Sprache</em>. Ob eine Anordnung zur Sprache gehört, ist das <em>Entscheidungsproblem</em>. Weil sich hier jedes Objekt unabhängig von seiner Umgebung verwandelt, ist die Grammatik <em>kontextfrei</em>, und dieses Problem lässt sich gut lösen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      var legend = h('div', { class: P + 'legend', role: 'list', 'aria-label': 'Die vier magischen Objekte' },
        ['H', 'C', 'B', 'T'].map(function (k) {
          return h('span', { class: P + 'leg', role: 'listitem' }, icon(k, 26), h('span', null, PLURAL[k]));
        }));
      var rows = RULES.map(function (r) {
        return h('tr', { 'aria-label': 'Verwandlung ' + r.id + ': ' + NAME[r.from] + ' wird zu ' + seqText(r.to) },
          h('td', { class: P + 'rid' }, String(r.id)),
          h('td', null, icon(r.from, 30)),
          h('td', { class: P + 'rarrow', 'aria-hidden': 'true' }, '→'),
          h('td', { class: P + 'rto' }, seqIcons(r.to, 30)));
      });
      var table = h('table', { class: P + 'rules', 'aria-label': 'Verwandlungen' },
        h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Nr.'), h('th', { scope: 'col' }, 'Aus'), h('th', { scope: 'col', 'aria-hidden': 'true' }, ''), h('th', { scope: 'col' }, 'entsteht'))),
        h('tbody', null, rows));
      radios = OPTIONS.map(function (o, i) {
        var b = h('button', { type: 'button', role: 'radio', class: P + 'opt', 'data-opt': o.key,
          'aria-label': 'Antwort ' + o.key + ': ' + seqText(o.seq),
          onclick: function () { choose(i, false); }, onkeydown: function (e) { onKey(e, i); } },
          h('span', { class: P + 'key', 'aria-hidden': 'true' }, o.key + ')'),
          h('span', { class: P + 'seq', 'aria-hidden': 'true' }, seqIcons(o.seq, 32)));
        return b;
      });
      wsEl = h('div', { class: P + 'ws', 'aria-label': 'Aktuelle Anordnung in der Zauberwerkstatt' });
      wsRulesEl = h('div', { class: P + 'wsrules', 'aria-label': 'Mögliche Verwandlungen' });
      wsMsgEl = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      wsUndo = h('button', { type: 'button', class: 'btn ghost ' + P + 'small', onclick: function () {
        var s = wsHist.pop(); if (!s) return; wsSeq = s.seq; wsSel = s.sel; wsDraw();
      } }, 'Rückgängig');
      wsReset();
      var box = h('section', { class: P + 'shop', 'aria-label': 'Zum Ausprobieren: Zauberwerkstatt' },
        h('h3', null, 'Zum Ausprobieren: Zauberwerkstatt'),
        h('p', { class: P + 'hint' }, 'Starte mit einem Zauberhut und verwandle ihn Schritt für Schritt.'),
        wsEl, wsRulesEl, wsMsgEl,
        h('div', { class: P + 'wsbar' }, wsUndo,
          h('button', { type: 'button', class: 'btn ghost ' + P + 'small', onclick: function () { wsReset(); wsDraw(); } }, 'Neu mit einem Zauberhut')));
      el.replaceChildren(h('div', { class: P + 'board' },
        legend, h('div', { class: P + 'rulebox' }, h('h3', { class: P + 'h' }, 'Verwandlungen'), table),
        h('div', { class: P + 'answers', role: 'radiogroup', 'aria-label': 'Antworten' }, radios),
        box));
      wsDraw();
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
