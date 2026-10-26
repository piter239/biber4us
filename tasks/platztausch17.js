/* Aufgabe Platz! Tausch! (Biber 2017; Klasse 5-6 leicht, 7-8 leicht): Hunde per Platztausch nebeneinander sortieren */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-pt17-';

  var START = ['B', 's', 's', 'B', 's', 's', 's', 's', 'B'];    /* B = großer Hund, s = kleiner Hund */
  var OPTIONS = [
    { id: 'A', n: 2 }, { id: 'B', n: 6 }, { id: 'C', n: 8 }, { id: 'D', n: 10 }
  ];
  var CORRECT = 'B';

  /* Mindestzahl benachbarter Platztausche, damit alle großen Hunde einen zusammenhängenden Block bilden */
  function costs(arr) {
    var pos = [];
    arr.forEach(function (d, i) { if (d === 'B') pos.push(i); });
    var res = [];
    for (var s = 0; s + pos.length <= arr.length; s++) {
      var c = 0;
      pos.forEach(function (p, i) { c += Math.abs(p - (s + i)); });
      res.push(c);
    }
    return res;                      /* je Startplatz des Blocks */
  }
  function together(arr) {
    var s = arr.join('');
    return /^s*B+s*$/.test(s);
  }
  function words(arr) {
    return arr.map(function (d, i) { return 'Platz ' + (i + 1) + ': ' + (d === 'B' ? 'großer Hund' : 'kleiner Hund'); }).join(', ');
  }
  function dogImg(d) {
    return h('img', {
      src: 'assets/platztausch17/' + (d === 'B' ? 'dog-big' : 'dog-small') + '.png', alt: '',
      width: d === 'B' ? 300 : 177, height: d === 'B' ? 319 : 191, draggable: 'false'
    });
  }

  var el, api, choice, locked, mark;
  var arr, sel, swaps;

  function reset() { choice = null; mark = null; arr = START.slice(); sel = null; swaps = 0; }

  function swap(i, j) {
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    swaps++;
  }

  function statusText() {
    var t = swaps === 0 ? 'Noch kein Platztausch gemacht.' : swaps + (swaps === 1 ? ' Platztausch gemacht.' : ' Platztausche gemacht.');
    if (swaps > 0 && together(arr)) t += ' Die großen Hunde stehen nebeneinander.';
    return t;
  }

  function render(focusIdx) {
    var dogs = arr.map(function (d, i) {
      return h('button', {
        type: 'button', class: P + 'dog ' + P + (d === 'B' ? 'big' : 'small') + (sel === i ? ' sel' : ''), 'data-i': String(i),
        'aria-pressed': String(sel === i), disabled: locked,
        'aria-label': 'Platz ' + (i + 1) + ' von ' + arr.length + ': ' + (d === 'B' ? 'großer' : 'kleiner') + ' Hund' + (sel === i ? ', ausgewählt' : '')
      }, dogImg(d));
    });
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
        tabindex: tab, disabled: locked, 'aria-label': o.id + ': ' + o.n + ' Platztausche'
      }, h('span', { class: P + 'letter', 'aria-hidden': 'true' }, o.id + ')'), h('span', { class: P + 'val', 'aria-hidden': 'true' }, o.n + ' Platztausche'), badge);
    });
    el.replaceChildren(h('div', { class: P + 'wrap' },
      h('div', { class: P + 'play' },
        h('div', { class: P + 'row', role: 'group', 'aria-label': 'Reihe von neun Hunden. ' + words(arr) }, dogs),
        h('div', { class: P + 'bar' },
          h('span', { class: P + 'count', role: 'status', 'aria-live': 'polite' }, statusText()),
          h('button', { type: 'button', class: 'btn ghost ' + P + 'undo', 'data-undo': '', disabled: locked || swaps === 0 }, 'Reihe zurücksetzen')),
        h('p', { class: P + 'tip' }, 'Zum Ausprobieren: Tippe einen Hund an und dann den Nachbarn, mit dem er den Platz tauschen soll. Mit den Pfeiltasten verschiebst du einen ausgewählten Hund.')),
      h('div', { class: P + 'board', role: 'radiogroup', 'aria-label': 'Die vier Antworten A bis D' }, cards)));
    if (focusIdx != null) {
      var b = el.querySelector('[data-i="' + focusIdx + '"]');
      if (b) b.focus();
    }
  }

  function dogClick(i) {
    if (locked) return;
    if (sel === null || sel === i) { sel = sel === i ? null : i; return render(i); }
    if (Math.abs(sel - i) === 1) {
      swap(sel, i);
      sel = null;
      render(i);
      return;
    }
    sel = i;
    render(i);
  }
  function dogKey(e, i) {
    if (locked || sel !== i) return;
    var d = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0;
    if (!d) { if (e.key === 'Escape') { sel = null; render(i); } return; }
    e.preventDefault();
    var j = i + d;
    if (j < 0 || j >= arr.length) return;
    swap(i, j);
    sel = j;
    render(j);
  }

  function pick(id) {
    if (locked) return;
    choice = id;
    render();
    var b = el.querySelector('[data-opt="' + id + '"]');
    if (b) b.focus();
    api.changed('Antwort ' + id + ' ausgewählt.');
  }
  function onClick(e) {
    if (locked) return;
    var u = e.target.closest('[data-undo]');
    if (u) { arr = START.slice(); sel = null; swaps = 0; render(); return; }
    var d = e.target.closest('[data-i]');
    if (d) return dogClick(+d.dataset.i);
    var b = e.target.closest('[data-opt]');
    if (b) pick(b.dataset.opt);
  }
  function onKey(e) {
    var d = e.target.closest('[data-i]');
    if (d) return dogKey(e, +d.dataset.i);
    var b = e.target.closest('[data-opt]');
    if (!b || locked) return;
    var i = OPTIONS.map(function (o) { return o.id; }).indexOf(b.dataset.opt), k = 0;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') k = 1;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') k = -1;
    else return;
    e.preventDefault();
    pick(OPTIONS[(i + k + OPTIONS.length) % OPTIONS.length].id);
  }

  /* kleine, feste Reihe für die Erklärung */
  function miniRow(list, label) {
    var d = document.createElement('div');
    d.appendChild(h('div', { class: P + 'mini', role: 'img', 'aria-label': label }, list.map(function (x) {
      return h('span', { class: P + 'mdog ' + P + (x === 'B' ? 'big' : 'small') }, dogImg(x));
    })));
    return d.innerHTML;
  }

  Biber.register({
    id: 'platztausch17',
    story: '<p>Hier ist eine Reihe von Hunden. Es gibt große und kleine Hunde.</p>' +
      '<p>Zwei Hunde, die nebeneinander stehen, können einen <strong>Platztausch</strong> machen: Sie tauschen dann ihre Plätze in der Reihe. Die großen Hunde sollen nebeneinander stehen.</p>',
    question: 'Wie viele Platztausche müssen die Hunde dazu mindestens machen?',
    howto: 'Probiere es mit der Reihe aus, wenn du magst. Tippe dann auf die Antwort, die du für richtig hältst.',
    explanation: function () {
      var c = costs(START);       /* Block ganz links ... ganz rechts */
      var best = Math.min.apply(null, c), left = c[0], right = c[c.length - 1];
      var mid = ['s', 's', 'B', 'B', 'B', 's', 's', 's', 's'];
      return '<p>Richtig sind <strong>' + best + ' Platztausche</strong>. Der große Hund links tauscht zweimal mit den kleinen Hunden rechts neben ihm und steht dann neben dem großen Hund in der Mitte. Der große Hund rechts tauscht viermal mit den kleinen Hunden links neben ihm, dann steht auch er neben dem großen Hund in der Mitte. Das sind 2 + 4 = ' + best + ' Platztausche.</p>' +
        miniRow(mid, 'Die großen Hunde stehen nebeneinander, in der Reihe auf Platz 3, 4 und 5.') +
        '<p>Weniger geht nicht: Zwischen den großen Hunden stehen sechs kleine Hunde, und jeder von ihnen muss mindestens einmal mit einem großen Hund tauschen. Sollen die großen Hunde ganz links nebeneinander stehen, sind es ' + left + ' Platztausche, ganz rechts sind es ' + right + '.</p>' +
        '<p>Zwei Elemente zu vertauschen ist eine Grundoperation der Informatik. Viele Sortierverfahren bestehen aus Vertauschungen, zum Beispiel Bubblesort, das benachbarte Elemente tauscht. Ein gutes Verfahren kommt mit möglichst wenigen Vertauschungen aus, vor allem wenn die Daten in einem langsamen Speicher liegen.</p>';
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
      if (on) sel = null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      choice = CORRECT; mark = 'solution'; locked = true; sel = null;
      render();
    }
  });
})();
