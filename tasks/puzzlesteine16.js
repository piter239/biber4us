/* Aufgabe Puzzlesteine (Heft 2016, Klasse 3-4 mittel, 5-6 einfach): Algorithmus, Optimierung, Greedy-Methode */
(function () {
  'use strict';
  var h = Biber.h;
  var S = Biber.svg;

  var BW = 66.97, BH = 111.62;   /* Breite und Höhe eines Steins (ohne Zapfen) */

  /* Umrisse exakt nach dem Heft (Koordinaten: x nach rechts, y nach unten, Stein beginnt bei x = 0).
     l/r: Art der linken/rechten Kante: tab = Zapfen (steht über), notch = Kerbe (eingeschnitten) */
  var PIECES = [
    { id: 1, l: 'tri-notch', r: 'rect-notch',
      d: 'M0 0 L0 33.49 L11.16 44.65 L22.32 55.81 L11.16 66.97 L0 78.13 L0 111.62 L66.97 111.62 L66.97 78.13 L53.58 78.13 L53.58 33.49 L66.97 33.49 L66.97 0 Z',
      name: 'Stein 1', desc: 'links eine spitze Kerbe, rechts eine eckige Kerbe' },
    { id: 2, l: 'rect-tab', r: 'round-tab',
      d: 'M0 0 L0 33.49 L-13.4 33.49 L-13.4 78.13 L0 78.13 L0 111.62 L66.97 111.62 L66.97 77.41 C76.82 74.87 83.71 65.98 83.72 55.81 C83.7 45.64 76.82 36.77 66.97 34.22 L66.97 0 Z',
      name: 'Stein 2', desc: 'links ein eckiger Zapfen, rechts ein runder Zapfen' },
    { id: 3, l: 'tri-notch', r: 'tri-tab',
      d: 'M0 0 L0 33.49 L11.16 44.65 L22.32 55.81 L11.16 66.97 L0 78.13 L0 111.62 L66.97 111.62 L66.97 78.13 L78.13 66.97 L89.3 55.81 L66.97 33.49 L66.97 0 Z',
      name: 'Stein 3', desc: 'links eine spitze Kerbe, rechts ein spitzer Zapfen' },
    { id: 4, l: 'rect-tab', r: 'rect-notch',
      d: 'M0 0 L0 33.49 L-13.4 33.49 L-13.4 78.13 L0 78.13 L0 111.62 L66.97 111.62 L66.97 78.25 L53.24 78.25 L53.24 33.37 L66.97 33.37 L66.97 0 Z',
      name: 'Stein 4', desc: 'links ein eckiger Zapfen, rechts eine eckige Kerbe' },
    { id: 5, l: 'round-tab', r: 'rect-tab',
      d: 'M66.97 0 L66.97 33.49 L80.37 33.49 L80.37 78.13 L66.97 78.13 L66.97 111.62 L0 111.62 L0 77.41 C-9.85 74.87 -16.74 65.98 -16.74 55.81 C-16.73 45.64 -9.85 36.77 0 34.22 L0 0 Z',
      name: 'Stein 5', desc: 'links ein runder Zapfen, rechts ein eckiger Zapfen' }
  ];
  var BY = {};
  PIECES.forEach(function (p) { BY[p.id] = p; });

  var COMPL = { 'tri-tab': 'tri-notch', 'tri-notch': 'tri-tab', 'rect-tab': 'rect-notch', 'rect-notch': 'rect-tab', 'round-tab': 'round-notch', 'round-notch': 'round-tab' };
  /* a liegt links, b rechts: rechte Kante von a passt in die linke Kante von b */
  function fits(a, b) { return a !== b && COMPL[BY[a].r] === BY[b].l; }
  function pairOk(a, b) { return fits(a, b) || fits(b, a); }
  function ordered(a, b) { return fits(a, b) ? [a, b] : [b, a]; }

  /* Höchstzahl gleichzeitiger Pärchen (jeder Stein höchstens in einem Pärchen), alle Möglichkeiten durchprobieren */
  var MAXPAIRS = (function () {
    var best = 0;
    function rec(used, from, n) {
      if (n > best) best = n;
      for (var i = from; i < PIECES.length; i++) {
        if (used.indexOf(PIECES[i].id) >= 0) continue;
        for (var j = i + 1; j < PIECES.length; j++) {
          if (used.indexOf(PIECES[j].id) >= 0) continue;
          if (pairOk(PIECES[i].id, PIECES[j].id)) rec(used.concat([PIECES[i].id, PIECES[j].id]), i + 1, n + 1);
        }
      }
    }
    rec([], 0, 0);
    return best;
  })();
  var SOLUTION = [[3, 1], [4, 2]];

  var VB_X = -22, VB_Y = -4, VB_H = 120;
  function pieceSvg(ids, cls) {
    var width = ids.length === 1 ? 116 : 116 + BW * (ids.length - 1);
    var svg = S('svg', { viewBox: VB_X + ' ' + VB_Y + ' ' + width + ' ' + VB_H, class: cls, 'aria-hidden': 'true', focusable: 'false' });
    ids.forEach(function (id, k) {
      svg.appendChild(S('path', { d: BY[id].d, transform: 'translate(' + (k * BW) + ' 0)', class: 't-puzzle16-shape' }));
    });
    return svg;
  }

  var el, api, locked, pairs, selected, mode, dragId, trayEl, pairsEl, msgEl, shake;

  function usedIds() {
    var u = {};
    pairs.forEach(function (p) { u[p[0]] = true; u[p[1]] = true; });
    return u;
  }

  function render() {
    var used = usedIds();
    var free = PIECES.filter(function (p) { return !used[p.id]; });
    var kids = free.map(function (p) {
      var cls = 't-puzzle16-piece' + (selected === p.id ? ' selected' : '') + (shake && shake.indexOf(p.id) >= 0 ? ' shake' : '');
      return h('button', {
        type: 'button', class: cls, 'data-piece': String(p.id), draggable: locked ? false : 'true', disabled: locked,
        'aria-pressed': String(selected === p.id), 'aria-label': p.name + ': ' + p.desc + (selected === p.id ? ', ausgewählt' : '')
      }, pieceSvg([p.id], 't-puzzle16-svg'), h('span', { class: 't-puzzle16-no', 'aria-hidden': 'true' }, String(p.id)));
    });
    if (!free.length) kids.push(h('p', { class: 't-puzzle16-none' }, 'Alle Steine sind in Pärchen.'));
    trayEl.replaceChildren.apply(trayEl, kids);

    var pk = pairs.map(function (p, i) {
      var cls = 't-puzzle16-pair';
      if (mode === 'check' || mode === 'solution') {
        var ok = mode === 'solution' || pairs.length === MAXPAIRS;
        cls += ok ? ' right' : ' wrong';
      }
      return h('button', {
        type: 'button', class: cls, 'data-pair': String(i), disabled: locked,
        'aria-label': 'Pärchen aus Stein ' + p[0] + ' und Stein ' + p[1] + (locked ? '' : '. Antippen zum Auflösen')
      }, pieceSvg([p[0], p[1]], 't-puzzle16-svg'), h('span', { class: 't-puzzle16-no', 'aria-hidden': 'true' }, p[0] + ' + ' + p[1]));
    });
    if (!pairs.length) pk.push(h('p', { class: 't-puzzle16-none' }, 'Noch kein Pärchen gebildet.'));
    pairsEl.replaceChildren.apply(pairsEl, pk);
    msgEl.textContent = pairs.length + ' Pärchen gebildet';
    shake = null;
  }

  function attempt(a, b) {
    if (locked || a === b) return;
    var used = usedIds();
    if (used[a] || used[b]) return;
    selected = null;
    if (pairOk(a, b)) {
      pairs.push(ordered(a, b));
      render();
      api.changed('Stein ' + a + ' und Stein ' + b + ' passen zusammen. ' + pairs.length + ' Pärchen gebildet.');
    } else {
      shake = [a, b];
      render();
      api.changed('Stein ' + a + ' und Stein ' + b + ' passen nicht zusammen.');
      var f = trayEl.querySelector('[data-piece="' + a + '"]');
      if (f) f.focus();
    }
  }

  function onClick(e) {
    if (locked) return;
    var pc = e.target.closest('[data-piece]');
    if (pc) {
      var id = +pc.getAttribute('data-piece');
      if (selected === null) { selected = id; render(); focusPiece(id); api.changed('Stein ' + id + ' ausgewählt. Wähle den Stein, der daran passt.'); }
      else if (selected === id) { selected = null; render(); focusPiece(id); api.changed(''); }
      else { var first = selected; attempt(first, id); }
      return;
    }
    var pr = e.target.closest('[data-pair]');
    if (pr) {
      var i = +pr.getAttribute('data-pair');
      var removed = pairs.splice(i, 1)[0];
      selected = null;
      render();
      focusPiece(removed[0]);
      api.changed('Pärchen aufgelöst.');
    }
  }
  function focusPiece(id) {
    var f = trayEl.querySelector('[data-piece="' + id + '"]');
    if (f) f.focus();
  }
  function onDragStart(e) {
    var pc = e.target.closest('[data-piece]');
    if (!pc || locked) return;
    dragId = +pc.getAttribute('data-piece');
    e.dataTransfer.setData('text/plain', String(dragId));
    e.dataTransfer.effectAllowed = 'move';
    pc.classList.add('dragging');
  }
  function onDragOver(e) {
    if (dragId === null || locked) return;
    var pc = e.target.closest('[data-piece]');
    if (pc && +pc.getAttribute('data-piece') !== dragId) { e.preventDefault(); pc.classList.add('over'); }
  }
  function onDragLeave(e) {
    var pc = e.target.closest('[data-piece]');
    if (pc) pc.classList.remove('over');
  }
  function onDrop(e) {
    var pc = e.target.closest('[data-piece]');
    if (!pc || dragId === null || locked) return;
    e.preventDefault();
    var a = dragId, b = +pc.getAttribute('data-piece');
    dragId = null;
    attempt(a, b);
  }
  function onDragEnd() { dragId = null; if (!locked) render(); }

  function isRight() { return pairs.length === MAXPAIRS; }

  Biber.register({
    id: 'puzzlesteine16',
    story: '<p>Die Biber haben ein neues Puzzle. Die fünf Puzzlesteine haben an den Seiten besondere Formen. ' +
      'Du kannst die Steine zu Pärchen zusammenschieben, wenn ihre Formen ineinander passen. Wie viele Pärchen kannst Du gleichzeitig bilden?</p>',
    question: 'Bilde so viele Pärchen wie möglich!',
    howto: 'Tippe zwei Steine nacheinander an (oder ziehe einen Stein auf einen anderen). Wenn sie zusammenpassen, bilden sie ein Pärchen. ' +
      'Ein Stein kann nur in einem Pärchen sein. Tippe auf ein Pärchen, um es wieder aufzulösen.',
    explanation: function () {
      return '<p>Aus den fünf Steinen lassen sich <b>höchstens zwei Pärchen</b> gleichzeitig bilden: Stein 3 passt mit seiner Spitze in die Kerbe von Stein 1, ' +
        'und der eckige Zapfen von Stein 2 passt in die eckige Kerbe von Stein 4. Stein 5 passt zu keinem anderen Stein.</p>' +
        '<div class="t-puzzle16-sol">' + pieceSvg([3, 1], 't-puzzle16-svg').outerHTML + pieceSvg([4, 2], 't-puzzle16-svg').outerHTML + '</div>' +
        '<p>Es ist verführerisch, aus den ersten beiden Steinen (Stein 1 und Stein 2) sofort ein Pärchen zu bilden, denn sie passen ebenfalls zusammen. ' +
        'Doch dann bleibt dieses das einzige Pärchen: Die übrigen Steine 3, 4 und 5 passen nicht mehr zusammen.</p>' +
        '<p><b>Informatik:</b> Viele Menschen machen Dinge gern optimal, zum Beispiel den kürzesten Weg suchen. Bei so wenigen Steinen kann man einfach alles ausprobieren. ' +
        'Müssen Computer aber große Datenmengen durchsuchen, würde „alles ausprobieren“ viel zu lange dauern. Deshalb gibt es andere Methoden, etwa die <i>Greedy-Methode</i> (englisch „greedy“ = gierig): ' +
        'Sie macht immer den Schritt, der sofort den größten Gewinn verspricht. Das geht schnell, findet aber nicht immer die beste Lösung. Hier würde sie die ersten beiden Steine zusammenschieben ' +
        'und damit nur ein Pärchen finden. Gierig zu sein lohnt sich hier also nicht: Man muss alle sinnvollen Möglichkeiten betrachten, um zwei Pärchen zu bilden.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; pairs = []; selected = null; mode = null; dragId = null; shake = null;
      trayEl = h('div', { class: 't-puzzle16-tray', role: 'group', 'aria-label': 'Freie Puzzlesteine' });
      pairsEl = h('div', { class: 't-puzzle16-pairs', role: 'group', 'aria-label': 'Gebildete Pärchen' });
      msgEl = h('p', { class: 't-puzzle16-count', 'aria-live': 'polite' });
      el.replaceChildren(h('div', { class: 't-puzzle16-box' },
        h('section', null, h('h3', null, 'Puzzlesteine'), trayEl),
        h('section', null, h('h3', null, 'Pärchen'), pairsEl, msgEl)));
      el.addEventListener('click', onClick);
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('dragleave', onDragLeave);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', onDragEnd);
      render();
    },
    isComplete: function () { return pairs.length >= 1; },
    evaluate: function () {
      return { correct: isRight(), answer: pairs.map(function (p) { return p.slice(); }) };
    },
    setAnswer: function (ans) {
      pairs = [];
      var used = {};
      (Array.isArray(ans) ? ans : []).forEach(function (p) {
        if (Array.isArray(p) && BY[p[0]] && BY[p[1]] && fits(p[0], p[1]) && !used[p[0]] && !used[p[1]]) {
          pairs.push([p[0], p[1]]);
          used[p[0]] = used[p[1]] = true;
        }
      });
      selected = null;
      mode = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      selected = null;
      mode = on ? (mode || 'check') : null;
      render();
    },
    reset: function () { pairs = []; selected = null; mode = null; render(); },
    showSolution: function () {
      pairs = SOLUTION.map(function (p) { return p.slice(); });
      selected = null;
      mode = 'solution';
      locked = true;
      render();
    }
  });
})();
