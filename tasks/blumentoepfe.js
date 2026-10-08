/* Aufgabe Blumentöpfe (Klasse 7-8 mittel, 9-10 einfach): Blumen so pflanzen, dass die Halbierungs-Methode den Schlüssel findet */
(function () {
  'use strict';
  var h = Biber.h;

  var LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  var KEY = 2; // Topf C
  var TINT = ['--c3', '--c4', '--c5', '--c1', '--c3', '--c4', '--c5', '--c1'];

  /* ---- Zeichnung eines Topfes (SVG, viewBox 60 x 96) ---- */
  function flowerSvg() {
    var petals = '';
    for (var i = 0; i < 5; i++) {
      petals += '<ellipse class="bt-petal" cx="30" cy="12" rx="6.5" ry="9" transform="rotate(' + (i * 72) + ' 30 26)"/>';
    }
    return '<g class="bt-flower">' +
      '<path class="bt-stem" d="M30 62 C30 52 30 42 30 30"/>' +
      '<path class="bt-leaf" d="M30 60 C22 58 15 52 12 44 C21 45 28 50 30 60 Z"/>' +
      '<path class="bt-leaf" d="M30 60 C38 58 45 52 48 44 C39 45 32 50 30 60 Z"/>' +
      petals + '<circle class="bt-eye" cx="30" cy="26" r="6"/></g>';
  }
  function keySvg() {
    return '<g class="bt-keyicon"><path class="bt-keybody" d="M17 73 L28 84 M23 79 L26 76 M27 83 L30 80"/><circle cx="14" cy="70" r="5.5" class="bt-keyring"/><circle cx="14" cy="70" r="2" class="bt-keyhole"/></g>';
  }
  /* opts: n (Index für Farbe und Beschriftung), flower, key, faded */
  function potSvg(n, opts) {
    opts = opts || {};
    var tint = 'style="--bt-tint: var(' + TINT[n % TINT.length] + ')"';
    return '<svg class="bt-pot' + (opts.faded ? ' faded' : '') + (opts.flower ? ' has-flower' : '') + '" viewBox="0 0 60 96" aria-hidden="true" focusable="false" ' + tint + '>' +
      '<ellipse class="bt-shadow" cx="30" cy="91" rx="27" ry="4"/>' +
      (opts.hint ? '<circle class="bt-hint" cx="30" cy="34" r="13"/><path class="bt-hint-plus" d="M30 28 V40 M24 34 H36"/>' : '') +
      (opts.flower ? flowerSvg() : '') +
      '<path class="bt-body" d="M7 62 H53 L49 89 H11 Z"/>' +
      '<rect class="bt-rim" x="4" y="58" width="52" height="9" rx="2.5"/>' +
      '<text class="bt-letter" x="' + (opts.key ? 39 : 30) + '" y="84" text-anchor="middle">' + LETTERS[n] + '</text>' +
      (opts.key ? keySvg() : '') + '</svg>';
  }

  /* ---- Halbierungs-Methode ---- */
  function trace(fl) {
    var lo = 0, hi = fl.length, steps = [];
    while (hi - lo > 1) {
      var n = 0;
      for (var i = lo; i < hi; i++) n += fl[i];
      var mid = (lo + hi) / 2, even = n % 2 === 0;
      steps.push({ lo: lo, hi: hi, n: n, even: even, mid: mid });
      if (even) hi = mid; else lo = mid;
    }
    return { steps: steps, pot: lo };
  }
  function range(lo, hi) { return LETTERS[lo] + (hi - lo > 1 ? '–' + LETTERS[hi - 1] : ''); }
  function blumen(n) { return n === 0 ? 'keine Blume' : n === 1 ? '1 Blume' : n + ' Blumen'; }
  function stepText(s) {
    return range(s.lo, s.hi) + ': ' + blumen(s.n) + ', also eine <strong>' + (s.even ? 'gerade' : 'ungerade') + '</strong> Anzahl. ' +
      'Der Schlüssel ist in der <strong>' + (s.even ? 'linken' : 'rechten') + '</strong> Hälfte: ' + (s.even ? range(s.lo, s.mid) : range(s.mid, s.hi)) + '.';
  }

  /* Beispiel aus dem Heft: Töpfe A-D, Schlüssel in B, Blumen in A und D */
  function exampleHtml() {
    function row(faded, label) {
      var pots = '';
      for (var i = 0; i < 4; i++) {
        pots += '<div class="bt-ex-pot' + (i === 1 ? ' key' : '') + '">' + potSvg(i, { flower: i === 0 || i === 3, key: i === 1, faded: faded && i > 1 }) + '</div>';
      }
      return '<div class="bt-ex" role="img" aria-label="' + label + '"><div class="bt-ex-pots">' + pots + '<i class="bt-split' + (faded ? ' s2' : '') + '"></i></div></div>';
    }
    return '<div class="bt-examples">' +
      '<div class="bt-exrow">' + row(false, 'Beispiel, erster Schritt: Töpfe A bis D. In A und D steht je eine Blume, der Schlüssel liegt in B. Eine gestrichelte Linie trennt A und B von C und D.') +
      '<p>Betrachte die Töpfe A, B, C und D. Es gibt insgesamt 2 Blumen, also eine <strong>gerade</strong> Anzahl. Das heißt, der Schlüssel ist in der <strong>linken</strong> Hälfte, also in Topf A oder B.</p></div>' +
      '<div class="bt-exrow">' + row(true, 'Beispiel, zweiter Schritt: Nur die Töpfe A und B zählen, C und D sind ausgegraut. Eine gestrichelte Linie trennt A von B.') +
      '<p>Betrachte die Töpfe A und B. Es gibt insgesamt 1 Blume, also eine <strong>ungerade</strong> Anzahl. Das heißt, der Schlüssel ist in der <strong>rechten</strong> Hälfte, also in Topf B.</p></div>' +
      '</div>';
  }

  var el, api;
  var fl, touched, locked, mark, showTrace, btns, traceBox, toggleBtn, grid;

  function reset() { fl = [0, 0, 0, 0, 0, 0, 0, 0]; touched = false; mark = null; showTrace = false; }

  function toggle(i) {
    if (locked) return;
    fl[i] = fl[i] ? 0 : 1;
    touched = true;
    refresh();
    api.changed(status());
  }

  function potLabel(i) {
    return 'Topf ' + LETTERS[i] + (i === KEY ? ' (mit Schlüssel)' : '') + ': ' + (fl[i] ? 'Blume gepflanzt' : 'leer');
  }

  function refresh() {
    var t = trace(fl);
    var shown = showTrace || mark !== null;
    btns.forEach(function (b, i) {
      b.classList.toggle('on', !!fl[i]);
      b.setAttribute('aria-pressed', String(!!fl[i]));
      b.setAttribute('aria-disabled', locked ? 'true' : 'false');
      b.setAttribute('aria-label', potLabel(i));
      b.classList.toggle('end', shown && t.pot === i);
      b.classList.toggle('right', mark !== null && t.pot === i && i === KEY);
      b.classList.toggle('wrong', mark !== null && t.pot === i && i !== KEY);
      var svg = b.querySelector('svg');
      svg.classList.toggle('has-flower', !!fl[i]);
      var fg = svg.querySelector('.bt-flower');
      if (fl[i] && !fg) svg.insertAdjacentHTML('afterbegin', flowerSvg());
      if (!fl[i] && fg) fg.remove();
      // Blume liegt im Bild vor dem Schatten, aber hinter dem Topf: richtige Reihenfolge herstellen
      if (fl[i]) {
        var f = svg.querySelector('.bt-flower'), sh = svg.querySelector('.bt-shadow');
        if (f && sh && sh.nextSibling !== f) sh.after(f);
      }
      var m = b.querySelector('.bt-mark');
      if (m) m.remove();
      if (mark !== null && t.pot === i) {
        b.appendChild(h('span', { class: 'bt-mark', 'aria-hidden': 'true' }, i === KEY ? '✓' : '✗'));
      }
    });
    toggleBtn.setAttribute('aria-pressed', String(showTrace));
    toggleBtn.textContent = showTrace || mark !== null ? 'Methode ausblenden' : 'Methode vorführen';
    toggleBtn.hidden = mark !== null;
    if (!shown) {
      traceBox.hidden = true;
      traceBox.replaceChildren();
      grid.querySelectorAll('.bt-bar').forEach(function (b) { b.remove(); });
      return;
    }
    traceBox.hidden = false;
    grid.querySelectorAll('.bt-bar').forEach(function (b) { b.remove(); });
    t.steps.forEach(function (s, k) {
      var bar = h('div', { class: 'bt-bar ' + (s.even ? 'even' : 'odd'), 'aria-hidden': 'true', style: 'grid-column: ' + (s.lo + 1) + ' / ' + (s.hi + 1) + '; grid-row: ' + (k + 2) },
        h('span', null, '' + s.n));
      grid.appendChild(bar);
    });
    var items = t.steps.map(function (s) { var li = h('li'); li.innerHTML = stepText(s); return li; });
    var last = h('p', { class: 'bt-end ' + (t.pot === KEY ? 'ok' : 'bad') });
    last.innerHTML = 'Nur noch ein Topf übrig: <strong>Topf ' + LETTERS[t.pot] + '</strong>. ' +
      (t.pot === KEY ? 'Dort ist der Schlüssel, die Methode funktioniert.' : 'Der Schlüssel liegt aber in Topf C, die Methode findet ihn so nicht.');
    traceBox.replaceChildren(h('ol', { class: 'bt-steps' }, items), last);
  }

  function status() {
    var n = fl.reduce(function (a, b) { return a + b; }, 0);
    return n === 0 ? 'Noch keine Blume gepflanzt' : n + (n === 1 ? ' Blume gepflanzt' : ' Blumen gepflanzt');
  }

  var SOLUTION = [1, 0, 1, 1, 1, 0, 0, 0]; // A, C, D, E

  Biber.register({
    id: 'blumentoepfe',
    story: '<p>Biber Florian dekoriert den Eingang seines Baus mit Blumentöpfen. In manchen Töpfen ist <strong>je eine Blume</strong> gepflanzt, die anderen sind <strong>leer</strong>.</p>' +
      '<p>In einem Topf ist ein Schlüssel versteckt. Florian erklärt seine Methode, wie man den Schlüssel finden kann.</p>' +
      '<blockquote class="bt-quote">„Zuerst betrachtet man alle Töpfe und zählt, wie viele Blumen insgesamt in den Töpfen gepflanzt sind. Wenn die Anzahl an Blumen gerade ist, ist der Schlüssel in der linken Hälfte der Töpfe, sonst ist er in der rechten Hälfte. Jetzt betrachtet man nur die Hälfte, in der der Schlüssel ist, und wiederholt das Verfahren, bis nur noch ein Topf übrig ist. Dort ist der Schlüssel versteckt.“</blockquote>' +
      '<p>Florian zeigt ein Beispiel, wie man den Schlüssel in 4 Töpfen A, B, C, D finden kann.</p>' +
      exampleHtml() +
      '<p>Florian hat acht Blumentöpfe und versteckt den Schlüssel in Topf C.</p>',
    question: 'In welche Töpfe sollte er eine Blume pflanzen, damit man den Schlüssel mit seiner Methode finden kann? Es gibt mehrere richtige Antworten. Auch 0 ist eine gerade Zahl.',
    howto: 'Tippe einen Topf an, um eine Blume zu pflanzen. Tippe ihn noch einmal an, um die Blume wieder zu entfernen. Mit „Methode vorführen“ siehst du, wo Florians Methode bei deiner Bepflanzung landet.',
    explanation: function () {
      return '<p>Rückwärts gedacht: Der Schlüssel in Topf C liegt in der <strong>linken</strong> Hälfte (A–D), dort in der <strong>rechten</strong> Hälfte (C–D) und dort wieder in der <strong>linken</strong> (C). ' +
        'Also muss die Anzahl der Blumen in A–H <strong>gerade</strong> sein, in A–D <strong>ungerade</strong> und in C–D <strong>gerade</strong>.</p>' +
        '<p>Das ist zum Beispiel bei den Blumen in A, C, D und E der Fall (4, dann 3, dann 2 Blumen). Insgesamt gibt es 32 richtige Bepflanzungen, denn: in C und D beide oder keine (2 Möglichkeiten), in A und B genau eine (2 Möglichkeiten), in E–H eine ungerade Anzahl (8 Möglichkeiten).</p>' +
        '<p>Florians Methode halbiert die Töpfe immer wieder, ähnlich wie die binäre Suche. Jede Antwort „gerade oder ungerade?“ legt eine Stelle der Position fest, sodass der Weg zum Topf rückwärts aus dem Ziel hergeleitet werden kann.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      btns = LETTERS.map(function (L, i) {
        var b = h('button', { type: 'button', class: 'bt-btn', 'data-pot': L, onclick: function () { toggle(i); } });
        b.innerHTML = potSvg(i, { key: i === KEY, hint: true });
        return b;
      });
      grid = h('div', { class: 'bt-grid' }, btns);
      toggleBtn = h('button', { type: 'button', class: 'btn ghost bt-toggle', onclick: function () { showTrace = !showTrace; refresh(); } });
      traceBox = h('div', { class: 'bt-trace', 'aria-live': 'polite', hidden: true });
      el.replaceChildren(h('div', { class: 'bt-board' }, h('div', { class: 'bt-scroll', role: 'group', 'aria-label': 'Acht Blumentöpfe A bis H' }, grid), h('div', { class: 'bt-tools' }, toggleBtn), traceBox));
      refresh();
    },
    isComplete: function () { return touched; },
    evaluate: function () {
      var t = trace(fl);
      return { correct: t.pot === KEY, answer: { pots: LETTERS.filter(function (L, i) { return fl[i]; }) } };
    },
    setAnswer: function (ans) {
      var pots = (ans && ans.pots) || [];
      fl = LETTERS.map(function (L) { return pots.indexOf(L) >= 0 ? 1 : 0; });
      touched = true;
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      refresh();
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () { fl = SOLUTION.slice(); touched = true; locked = true; mark = 'solution'; refresh(); }
  });
})();
