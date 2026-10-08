/* Aufgabe Bonbon-Spender (Heft 2022, Klasse 3-4, einfach): Stapel / LIFO.
   Der Spender gibt das oberste Bonbon zuerst aus. Gewünscht: 1, 2, 3, 4, 5 -> zuerst muss Bonbon 5 hinein. */
(function () {
  'use strict';
  var h = Biber.h;
  var A = 'assets/bonbon22/';

  var CANDY = {
    1: { name: 'grünes Bonbon mit Birne', short: 'Birne' },
    2: { name: 'rotes Bonbon mit Kirschen', short: 'Kirschen' },
    3: { name: 'gelbes Bonbon mit Ananas', short: 'Ananas' },
    4: { name: 'lila Bonbon mit Trauben', short: 'Trauben' },
    5: { name: 'orangefarbenes Bonbon mit Orange', short: 'Orange' }
  };
  var START = [2, 3, 1, 4, 5];          /* Haufen wie im Heft: bunt durcheinander */
  var RIGHT = [5, 4, 3, 2, 1];          /* von unten nach oben */
  var TILT = [-5, 4, -2, 6, -4];

  var el, api, locked, mode, stack, pool, dragging, note;

  function reset() { stack = []; pool = START.slice(); dragging = null; mode = null; note = ''; }
  function isRight(s) { return s.length === 5 && s.every(function (c, i) { return c === RIGHT[i]; }); }
  /* Reihenfolge, in der die Bonbons herauskommen (oben zuerst) */
  function outOrder(s) { return s.slice().reverse(); }

  function img(id, cls, size) {
    return h('img', { class: cls, src: A + 'b' + id + '.png', alt: CANDY[id].name, width: size || 160, height: Math.round((size || 160) * 101 / 160), draggable: 'false' });
  }

  function status() {
    if (pool.length) return stack.length ? 'Noch ' + pool.length + ' Bonbon' + (pool.length === 1 ? '' : 's') + ' im Haufen.' : '';
    return 'Alle Bonbons sind im Spender.';
  }

  function push(id) {
    if (locked || pool.indexOf(id) < 0) return;
    pool.splice(pool.indexOf(id), 1);
    stack.push(id);
    note = 'Das ' + CANDY[id].name + ' liegt jetzt oben im Spender.';
    render('top');
    api.changed(status());
  }
  function pop() {
    if (locked || !stack.length) return;
    var id = stack.pop();
    /* zurück an die Stelle des Haufens, an der es ursprünglich lag */
    var at = 0;
    START.forEach(function (c, i) { if (pool.indexOf(c) >= 0 && i < START.indexOf(id)) at = pool.indexOf(c) + 1; });
    pool.splice(at, 0, id);
    note = 'Das ' + CANDY[id].name + ' liegt wieder im Haufen.';
    render('pool' + id);
    api.changed(status());
  }

  function render(focus) {
    var hadFocus = el.contains(document.activeElement);
    var topIdx = stack.length - 1;

    var poolBtns = pool.map(function (id) {
      return h('button', {
        type: 'button', class: 't-bonbon22-candy', 'data-pool': String(id), draggable: locked ? false : 'true', disabled: locked,
        style: 'transform:rotate(' + TILT[id - 1] + 'deg)',
        'aria-label': CANDY[id].name + ', in den Spender legen'
      }, img(id, 't-bonbon22-img'));
    });

    var items = stack.map(function (id, i) {
      var cls = 't-bonbon22-slot';
      var mark = null;
      if (mode === 'check' || mode === 'solution') {
        var ok = RIGHT[i] === id;
        cls += ok ? ' right' : ' wrong';
        if (mode === 'check') mark = h('span', { class: 't-bonbon22-mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      }
      var label = 'Platz ' + (5 - i) + ' von oben: ' + CANDY[id].name;
      if (i === topIdx && !locked) {
        return h('button', {
          type: 'button', class: cls + ' top', 'data-top': String(id), draggable: 'true',
          'aria-label': label + ' (oberstes Bonbon, zurück in den Haufen legen)'
        }, img(id, 't-bonbon22-img'), mark);
      }
      return h('div', { class: cls, role: 'img', 'aria-label': label }, img(id, 't-bonbon22-img'), mark);
    });

    var spring = Biber.svg('svg', { class: 't-bonbon22-spring', viewBox: '0 0 40 30', 'aria-hidden': 'true', focusable: 'false' },
      Biber.svg('path', { d: 'M20 29 L8 26 L32 22 L8 18 L32 14 L8 10 L32 6 L20 3', fill: 'none', stroke: 'currentColor', 'stroke-width': '2.6', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));

    var disp = h('div', { class: 't-bonbon22-disp' + (mode === 'check' ? (isRight(stack) ? ' right' : ' wrong') : ''), 'data-disp': '' },
      h('img', { class: 't-bonbon22-head', src: A + 'kopf.png', alt: 'Biberkopf als Spenderkopf; oben am Spender kommt das Bonbon heraus', width: 220, height: 228, draggable: 'false' }),
      h('div', { class: 't-bonbon22-tube', role: 'group', 'aria-label': 'Spender, ' + stack.length + ' von 5 Bonbons, oben kommt das Bonbon heraus' },
        h('div', { class: 't-bonbon22-stack' }, items), spring),
      h('div', { class: 't-bonbon22-base', 'aria-hidden': 'true' }));

    var out = null;
    if (mode === 'check' || mode === 'solution') {
      out = h('div', { class: 't-bonbon22-out' },
        h('span', null, 'So kommen die Bonbons heraus:'),
        h('ol', null, outOrder(stack).map(function (id, i) {
          var ok = i + 1 === id;
          return h('li', { class: ok ? 'right' : 'wrong' }, img(id, 't-bonbon22-mini', 48),
            h('span', { class: 't-bonbon22-n' }, String(id)));
        })));
    }

    el.replaceChildren(h('div', { class: 't-bonbon22' },
      h('div', { class: 't-bonbon22-board' },
        h('section', { class: 't-bonbon22-poolbox', 'aria-label': 'Haufen mit Bonbons' },
          h('h3', null, 'Bonbons'),
          h('div', { class: 't-bonbon22-pool', 'data-poolbox': '' }, poolBtns,
            pool.length ? null : h('p', { class: 't-bonbon22-empty' }, 'Alle Bonbons sind im Spender.'))),
        h('section', { class: 't-bonbon22-dispbox', 'aria-label': 'Spender' }, disp)),
      out,
      h('p', { class: 't-bonbon22-info', 'aria-live': 'polite' }, note || 'Tippe auf ein Bonbon, um es oben in den Spender zu legen.')));

    if (hadFocus && !locked) {
      var t = null;
      if (focus === 'top') t = el.querySelector('[data-top]') || el.querySelector('[data-pool]');
      else if (focus && focus.indexOf('pool') === 0) t = el.querySelector('[data-pool="' + focus.slice(4) + '"]') || el.querySelector('[data-pool]') || el.querySelector('[data-top]');
      if (t) t.focus();
    }
  }

  function onClick(e) {
    if (locked) return;
    var p = e.target.closest('[data-pool]');
    if (p) return push(+p.getAttribute('data-pool'));
    var t = e.target.closest('[data-top]');
    if (t) pop();
  }
  function onDragStart(e) {
    var s = e.target.closest('[data-pool],[data-top]');
    if (!s || locked) return;
    dragging = s.hasAttribute('data-pool') ? { from: 'pool', id: +s.getAttribute('data-pool') } : { from: 'top', id: +s.getAttribute('data-top') };
    e.dataTransfer.setData('text/plain', String(dragging.id));
    e.dataTransfer.effectAllowed = 'move';
    s.classList.add('dragging');
  }
  function onDragOver(e) {
    if (!dragging || locked) return;
    var d = e.target.closest('[data-disp]');
    var p = e.target.closest('[data-poolbox]');
    if ((d && dragging.from === 'pool') || (p && dragging.from === 'top')) {
      e.preventDefault();
      (d || p).classList.add('over');
    }
  }
  function onDragLeave(e) {
    var s = e.target.closest('[data-disp],[data-poolbox]');
    if (s) s.classList.remove('over');
  }
  function onDrop(e) {
    if (!dragging || locked) return;
    var d = e.target.closest('[data-disp]');
    var p = e.target.closest('[data-poolbox]');
    var dr = dragging;
    dragging = null;
    if (d && dr.from === 'pool') { e.preventDefault(); push(dr.id); }
    else if (p && dr.from === 'top') { e.preventDefault(); pop(); }
    else render();
  }
  function onDragEnd() { dragging = null; if (!locked) render(); }

  Biber.register({
    id: 'bonbon22',
    story: '<p>Anna füllt fünf Bonbons in einen Spender. Danach isst sie die Bonbons so nacheinander, wie sie oben aus dem Spender kommen.</p>' +
      '<p>Sie möchte die Bonbons in dieser Reihenfolge essen:</p>' +
      '<ol class="t-bonbon22-want" aria-label="Gewünschte Reihenfolge">' +
      [1, 2, 3, 4, 5].map(function (id) {
        return '<li><img src="' + A + 'b' + id + '.png" alt="' + CANDY[id].name + '" width="64" height="40"><span aria-hidden="true">' + id + '</span><span class="t-bonbon22-sr">Nummer ' + id + '</span></li>';
      }).join('') + '</ol>',
    question: 'Wie muss Anna die Bonbons in den Spender füllen?',
    howto: 'Tippe die Bonbons nacheinander an (oder ziehe sie in den Spender). Sie landen immer oben im Spender. Das oberste Bonbon im Spender kannst du antippen, um es wieder herauszunehmen.',
    explanation: function () {
      return '<p>Der Spender gibt immer nur das <b>oberste</b> Bonbon aus. Das Bonbon, das Anna ganz unten einfüllt, kommt also als letztes heraus. ' +
        'Weil zuerst das Bonbon 1 (Birne) herauskommen soll, muss es als Letztes oben liegen. Anna füllt deshalb in der Reihenfolge <b>5, 4, 3, 2, 1</b> ein: ' +
        'Orange ganz unten, dann Trauben, Ananas, Kirschen und zuletzt die Birne.</p>' +
        '<p><b>Informatik:</b> Der Spender kehrt die Reihenfolge um: Was zuletzt hineinkommt, geht zuerst wieder heraus („last in, first out“, kurz <i>LIFO</i>). ' +
        'Eine Datenstruktur mit dieser Eigenschaft heißt <i>Stack</i> (Stapel). Sie ist leicht umzusetzen und wird in Computern oft gebraucht, zum Beispiel für „Rückgängig“-Schritte.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('dragleave', onDragLeave);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', onDragEnd);
      render();
    },
    isComplete: function () { return pool.length === 0; },
    evaluate: function () { return { correct: isRight(stack), answer: stack.slice() }; },
    setAnswer: function (ans) {
      stack = (ans || []).slice();
      pool = START.filter(function (c) { return stack.indexOf(c) < 0; });
      mode = 'check';
      note = '';
      render();
    },
    lock: function (on) {
      locked = on;
      if (on) mode = mode || 'check'; else { mode = null; note = ''; }
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      stack = RIGHT.slice();
      pool = [];
      mode = 'solution';
      locked = true;
      note = 'Richtig gefüllt: unten die 5, oben die 1.';
      render();
    }
  });
})();
