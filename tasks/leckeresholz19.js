/* Aufgabe Leckeres Holz (Heft 2019, S. 26; 5-6 schwer, 7-8 mittel): Algorithmik, Set Cover, NP-vollständig */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-leckeresholz19-';
  var A = 'assets/leckeresholz19/';

  var WOODS = ['Ahorn', 'Birke', 'Eiche', 'Esche', 'Linde', 'Weide'];
  var IMG = { Ahorn: 'ahorn', Birke: 'birke', Eiche: 'eiche', Esche: 'esche', Linde: 'linde', Weide: 'weide' };
  var BEAVERS = [
    { n: 'Anne', w: ['Ahorn', 'Eiche', 'Esche', 'Weide'] },
    { n: 'Ben', w: ['Eiche', 'Linde', 'Weide'] },
    { n: 'Carlo', w: ['Eiche'] },
    { n: 'Doris', w: ['Birke', 'Esche'] },
    { n: 'Emre', w: ['Ahorn', 'Birke', 'Weide'] },
    { n: 'Freddy', w: ['Eiche', 'Esche'] },
    { n: 'Georg', w: ['Ahorn', 'Linde'] }
  ];
  var RIGHT = 3;
  var SOLUTION = ['Ahorn', 'Birke', 'Eiche'];

  function happy(sel, b) { return b.w.some(function (w) { return sel.indexOf(w) >= 0; }); }
  function countHappy(sel) { return BEAVERS.filter(function (b) { return happy(sel, b); }).length; }

  var el, api, locked, picked, mode, sel;
  var woodsEl, tableEl, sumEl, optsEl;

  function woodImg(w, size) {
    return h('img', { src: A + IMG[w] + '.png', alt: '', width: size, height: size, draggable: 'false' });
  }

  function renderWoods() {
    woodsEl.replaceChildren.apply(woodsEl, WOODS.map(function (w) {
      var on = sel.indexOf(w) >= 0;
      return h('button', { type: 'button', class: P + 'wood' + (on ? ' on' : ''), 'data-w': w, 'aria-pressed': String(on),
        'aria-label': w + (on ? ', besorgt' : ', nicht besorgt') },
        h('span', { class: P + 'pic' }, woodImg(w, 56)),
        h('span', { class: P + 'wn' }, w),
        h('span', { class: P + 'tick', 'aria-hidden': 'true' }, on ? '✓' : ''));
    }));
  }
  function renderTable() {
    tableEl.replaceChildren.apply(tableEl, BEAVERS.map(function (b) {
      var ok = happy(sel, b);
      var chips = b.w.map(function (w) {
        return h('span', { class: P + 'chip' + (sel.indexOf(w) >= 0 ? ' on' : '') },
          h('span', { class: P + 'pic s' }, woodImg(w, 24)), w);
      });
      return h('div', { class: P + 'row' + (ok ? ' ok' : ''), role: 'row' },
        h('span', { class: P + 'bn', role: 'rowheader' }, b.n),
        h('span', { class: P + 'likes', role: 'cell', 'aria-label': 'findet lecker: ' + b.w.join(', ') }, chips),
        h('span', { class: P + 'st', role: 'cell', 'aria-label': ok ? 'hat eine leckere Sorte' : 'hat noch keine leckere Sorte' }, ok ? '✓' : '–'));
    }));
  }
  function renderSum() {
    var n = sel.length, m = countHappy(sel);
    sumEl.textContent = 'Du hast ' + n + (n === 1 ? ' Holzsorte' : ' Holzsorten') + ' besorgt. ' + m + ' von 7 Bibern haben eine leckere Sorte.';
  }
  function renderOpts() {
    optsEl.replaceChildren.apply(optsEl, [1, 2, 3, 4, 5, 6].map(function (v, idx) {
      var sl = picked === v;
      var cls = P + 'opt';
      var mark = '';
      if (mode && (mode === 'solution' ? v === RIGHT : sl)) {
        var ok = v === RIGHT;
        cls += ok ? ' right' : ' wrong';
        mark = ok ? '✓' : '✗';
      }
      var input = h('input', { type: 'radio', name: P + 'opt', value: String(v), disabled: locked, 'aria-label': 'Antwort ' + 'ABCDEF'[idx] + ': ' + v });
      input.checked = sl;
      return h('label', { class: cls }, input,
        h('span', { class: P + 'card' },
          h('span', { class: P + 'let' }, 'ABCDEF'[idx] + ')'),
          h('span', { class: P + 'num' }, String(v)),
          mark ? h('span', { class: P + 'mark', 'aria-hidden': 'true' }, mark) : null));
    }));
  }
  function renderAll() { renderWoods(); renderTable(); renderSum(); renderOpts(); }

  Biber.register({
    id: 'leckeresholz19',
    story: '<p>Ben veranstaltet eine Party für sich und seine sechs Biber-Freunde, mit viel leckerem Holz! Es gibt sechs Holzsorten: Ahorn, Birke, Eiche, Esche, Linde und Weide.</p>' +
      '<p>Leider haben alle sieben Biber einen eigenen Geschmack. Die Tabelle zeigt, welche Holzsorten jeder Biber lecker findet.</p>' +
      '<p>Ben möchte sich Arbeit sparen und möglichst wenige Holzsorten besorgen. Aber natürlich möchte er für jeden Biber eine leckere Sorte haben.</p>',
    question: 'Wie viele Holzsorten muss Ben mindestens besorgen?',
    howto: 'Wähle eine Antwort aus. Zum Ausprobieren kannst Du oben Holzsorten antippen, die Ben besorgt: Die Tabelle zeigt dann, welche Biber zufrieden sind. Das ist nur eine Gedankenstütze und zählt nicht zur Antwort.',
    explanation: function () {
      return '<p>Ben muss auf jeden Fall <b>Eiche</b> besorgen, denn Carlo mag nur Eiche. Damit sind auch Anne, Ben und Freddy zufrieden. ' +
        'Doris, Emre und Georg haben zu dritt keine gemeinsame Sorte, also reicht eine zusätzliche Sorte nicht. ' +
        'Mit zwei weiteren, zum Beispiel <b>Birke</b> und <b>Ahorn</b>, sind alle sieben Biber versorgt. Ben braucht also mindestens <b>3</b> Holzsorten.</p>' +
        '<p><b>Informatik:</b> Dreht man die Tabelle um, gehört zu jeder Holzsorte eine Teilmenge der Biber, die sie lecker finden (Ahorn: Anne, Emre, Georg; Birke: Doris, Emre; Eiche: Anne, Ben, Carlo, Freddy …). ' +
        'Gesucht sind möglichst wenige Teilmengen, die zusammen alle Biber enthalten. Das nennt man das <i>Mengenüberdeckungsproblem</i> (<i>set cover</i>). ' +
        'Es gehört zu den NP-vollständigen Problemen: Für große Mengen kennt man kein Verfahren, das immer schnell die beste Lösung findet, sondern nur Verfahren, die meist recht gute Lösungen liefern.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null; sel = [];
      woodsEl = h('div', { class: P + 'woods', role: 'group', 'aria-label': 'Holzsorten, die Ben besorgt (zum Ausprobieren)' });
      tableEl = h('div', { class: P + 'table', role: 'table', 'aria-label': 'Welcher Biber findet welche Holzsorten lecker' });
      sumEl = h('p', { class: P + 'sum', 'aria-live': 'polite' });
      optsEl = h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Antworten' });
      el.replaceChildren(h('div', { class: P + 'box' },
        h('div', { class: P + 'explore' },
          h('h3', { class: P + 'h' }, 'Holzsorten ausprobieren'), woodsEl,
          h('h3', { class: P + 'h' }, 'Das finden die Biber lecker'), tableEl, sumEl),
        optsEl));
      woodsEl.addEventListener('click', function (e) {
        var b = e.target.closest('[data-w]'); if (!b) return;
        var w = b.getAttribute('data-w');
        var i = sel.indexOf(w);
        if (i >= 0) sel.splice(i, 1); else sel.push(w);
        renderWoods(); renderTable(); renderSum();
        var nb = woodsEl.querySelector('[data-w="' + w + '"]'); if (nb) nb.focus();
      });
      optsEl.addEventListener('change', function (e) {
        if (locked || !e.target.matches('input[type=radio]')) return;
        picked = +e.target.value;
        renderOpts();
        var f = optsEl.querySelector('input:checked'); if (f) f.focus();
        api.changed('Antwort ' + 'ABCDEF'[picked - 1] + ' gewählt.');
      });
      renderAll();
    },
    isComplete: function () { return picked !== null; },
    evaluate: function () { return { correct: picked === RIGHT, answer: { n: picked, sel: sel.slice() } }; },
    setAnswer: function (ans) {
      picked = ans && typeof ans.n === 'number' ? ans.n : null;
      sel = ans && Array.isArray(ans.sel) ? ans.sel.filter(function (w) { return WOODS.indexOf(w) >= 0; }) : [];
      mode = 'check'; renderAll();
    },
    lock: function (on) {
      locked = on;
      mode = on ? (mode || 'check') : null;
      renderAll();
    },
    reset: function () { picked = null; mode = null; sel = []; renderAll(); },
    showSolution: function () { picked = RIGHT; mode = 'solution'; locked = true; sel = SOLUTION.slice(); renderAll(); }
  });
})();
