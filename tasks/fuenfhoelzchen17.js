/* Aufgabe Fünf Hölzchen (Biber 2017; Klasse 3-4 schwer, 5-6 mittel): Wie können die Hölzchen nach Berts Zug NICHT liegen? */
(function () {
  'use strict';
  var h = Biber.h, sv = Biber.svg;
  var P = 't-fh17-';

  /* Hölzchen auf einem Raster aus 3 x 3 Punkten.
     'h r c' = waagerecht auf Punktzeile r, von Spalte c bis c+1.
     'v r c' = senkrecht auf Punktspalte c, von Zeile r bis r+1. */
  var START = ['h 0 1', 'v 0 1', 'v 0 2', 'h 1 0', 'v 1 0'];
  /* nach Nolas Zug, mit den Nummern aus der Lösung im Heft */
  var NOLA = [
    { n: 1, m: 'v 1 0' }, { n: 2, m: 'h 1 0' }, { n: 3, m: 'v 0 1' }, { n: 4, m: 'h 0 0' }, { n: 5, m: 'h 0 1' }
  ];
  var OPTIONS = [
    { id: 'A', m: ['h 0 0', 'h 0 1', 'v 0 1', 'v 0 2', 'h 1 0'] },
    { id: 'B', m: ['h 0 0', 'v 0 0', 'v 0 1', 'h 1 0', 'v 1 0'] },
    { id: 'C', m: ['h 0 0', 'h 0 1', 'v 0 1', 'h 1 0', 'h 1 1'] },
    { id: 'D', m: ['h 0 0', 'v 0 1', 'h 1 0', 'v 1 1', 'h 2 0'] }
  ];
  var CORRECT = 'D';
  var NOLA_SET = NOLA.map(function (x) { return x.m; });

  /* ---- Zeichnen ---- */
  var U = 120, OFF = 12, GAP = 8, TH = 8;
  function pos(i) { return OFF + U * i; }
  function matchRect(key, cls) {
    var p = key.split(' '), r = +p[1], c = +p[2];
    if (p[0] === 'h') return sv('rect', { class: cls, x: pos(c) + GAP, y: pos(r) - TH / 2, width: U - 2 * GAP, height: TH, rx: 3 });
    return sv('rect', { class: cls, x: pos(c) - TH / 2, y: pos(r) + GAP, width: TH, height: U - 2 * GAP, rx: 3 });
  }
  function center(key) {
    var p = key.split(' '), r = +p[1], c = +p[2];
    return p[0] === 'h' ? [pos(c) + U / 2, pos(r)] : [pos(c), pos(r) + U / 2];
  }
  var ROWN = ['oben', 'in der Mitte', 'unten'], COLN = ['links', 'in der Mitte', 'rechts'];
  function say(key) {
    var p = key.split(' '), r = +p[1], c = +p[2];
    return p[0] === 'h'
      ? 'waagerecht ' + ROWN[r] + (c === 0 ? ', linke Hälfte' : ', rechte Hälfte')
      : 'senkrecht ' + COLN[c] + (r === 0 ? ', obere Hälfte' : ', untere Hälfte');
  }
  function describe(list) { return list.map(say).join('; '); }

  /* Bild als SVG; nums = true schreibt die Nummern der Hölzchen daneben */
  function figure(list, opt) {
    opt = opt || {};
    var kids = list.map(function (k) { return matchRect(k, P + 'm'); });
    if (opt.numbers) {
      NOLA.forEach(function (x) {
        var c = center(x.m), isH = x.m.charAt(0) === 'h';
        kids.push(sv('text', { class: P + 'num', x: isH ? c[0] : c[0] + 22, y: isH ? c[1] + 30 : c[1] + 6, 'text-anchor': 'middle' }, String(x.n)));
      });
    }
    var svg = sv.apply(null, ['svg', {
      viewBox: '0 0 ' + (2 * U + 2 * OFF) + ' ' + (2 * U + 2 * OFF), class: P + 'fig' + (opt.cls ? ' ' + opt.cls : ''),
      role: 'img', 'aria-label': opt.label || ('Fünf Hölzchen: ' + describe(list)), focusable: 'false'
    }].concat(kids));
    return svg;
  }
  function figureHtml(list, opt) {
    var d = document.createElement('div');
    d.appendChild(figure(list, opt));
    return d.innerHTML;
  }

  /* ---- Prüfung der Lösung (Kontrolle) ---- */
  function missing(opt) {          /* Nummern der Hölzchen, die Bert umlegen müsste */
    return NOLA.filter(function (x) { return opt.m.indexOf(x.m) < 0; }).map(function (x) { return x.n; });
  }

  /* ---- Zustand ---- */
  var el, api, choice, locked, mark;

  function reset() { choice = null; mark = null; }

  function render() {
    var cards = OPTIONS.map(function (o, i) {
      var cls = P + 'card' + (choice === o.id ? ' sel' : '');
      var badge = null;
      if (mark === 'check' && choice === o.id) {
        var ok = o.id === CORRECT;
        cls += ok ? ' right' : ' wrong';
        badge = h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      } else if (mark === 'solution' && o.id === CORRECT) cls += ' right';
      var tab = choice ? (choice === o.id ? '0' : '-1') : (i === 0 ? '0' : '-1');
      return h('button', {
        type: 'button', role: 'radio', class: cls, 'data-opt': o.id, 'aria-checked': String(choice === o.id),
        tabindex: tab, disabled: locked,
        'aria-label': 'Bild ' + o.id + ': ' + describe(o.m)
      }, h('span', { class: P + 'name', 'aria-hidden': 'true' }, o.id + ')'), figure(o.m, { label: '', cls: P + 'optfig' }), badge);
    });
    cards.forEach(function (c) { var s = c.querySelector('svg'); s.removeAttribute('role'); s.removeAttribute('aria-label'); s.setAttribute('aria-hidden', 'true'); });
    el.replaceChildren(h('div', { class: P + 'board', role: 'radiogroup', 'aria-label': 'Die vier Bilder A bis D' }, cards));
  }

  function pick(id) {
    if (locked) return;
    choice = id;
    render();
    var b = el.querySelector('[data-opt="' + id + '"]');
    if (b) b.focus();
    api.changed('Bild ' + id + ' ausgewählt.');
  }
  function onClick(e) {
    var b = e.target.closest('[data-opt]');
    if (b && !locked) pick(b.dataset.opt);
  }
  function onKey(e) {
    var b = e.target.closest('[data-opt]');
    if (!b || locked) return;
    var i = OPTIONS.map(function (o) { return o.id; }).indexOf(b.dataset.opt), d = 0;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') d = 1;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') d = -1;
    else return;
    e.preventDefault();
    pick(OPTIONS[(i + d + OPTIONS.length) % OPTIONS.length].id);
  }

  Biber.register({
    id: 'fuenfhoelzchen17',
    story: '<p>Fünf Hölzchen liegen so auf dem Tisch:</p>' +
      '<div class="' + P + 'story">' + figureHtml(START, { cls: P + 'big' }) + '</div>' +
      '<p>Nola nimmt ein Hölzchen und legt es woanders hin. Jetzt liegen die Hölzchen so:</p>' +
      '<div class="' + P + 'story">' + figureHtml(NOLA_SET, { cls: P + 'big' }) + '</div>' +
      '<p>Danach nimmt Bert ein Hölzchen und legt es woanders hin.</p>',
    question: 'Wie können die Hölzchen jetzt <span class="' + P + 'not">NICHT</span> liegen?',
    howto: 'Tippe auf das Bild, das nach Berts Zug nicht möglich ist.',
    explanation: function () {
      var rows = OPTIONS.map(function (o) {
        var miss = missing(o);
        var txt = miss.length === 1
          ? 'Dazu muss Bert nur das Hölzchen ' + miss[0] + ' woanders hinlegen.'
          : 'Dazu müsste Bert zwei Hölzchen woanders hinlegen, nämlich die Hölzchen ' + miss.join(' und ') + '. Er legt aber nur eines um.';
        return '<li><strong>Bild ' + o.id + ':</strong> ' + txt + '</li>';
      }).join('');
      return '<p>Richtig ist <strong>Bild D</strong>. Wir geben den Hölzchen nach Nolas Zug Nummern:</p>' +
        '<div class="' + P + 'story">' + figureHtml(NOLA_SET, { numbers: true, cls: P + 'big', label: 'Die Hölzchen nach Nolas Zug, nummeriert von 1 bis 5: ' + describe(NOLA_SET) }) + '</div>' +
        '<ul class="' + P + 'why">' + rows + '</ul>' +
        '<p>Mit einer einzigen Anweisung „Lege ein Hölzchen woanders hin!“ ändert sich die Lage also so wenig wie möglich. Wer Computer programmiert, setzt aus einfachen Anweisungen, die der Computer schon kennt, größere zusammen: Er schreibt sie hintereinander auf, wiederholt sie oder führt sie nur unter einer Bedingung aus.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKey);
      render();
    },
    isComplete: function () { return !!choice; },
    evaluate: function () { return { correct: choice === CORRECT, answer: { choice: choice } }; },
    setAnswer: function (ans) {
      choice = ans && ans.choice ? ans.choice : null;
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? 'check' : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      choice = CORRECT; mark = 'solution'; locked = true;
      render();
    }
  });
})();
