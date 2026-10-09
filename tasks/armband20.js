/* Aufgabe Armband (Biber 2020; Klasse 5-6 schwer, 7-8 einfach): Welches Armband folgt nicht der Grammatik? */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-armband20-';
  var NS = 'http://www.w3.org/2000/svg';

  /* Armbänder im Uhrzeigersinn ab oben (S = Stern, M = Mond), abgelesen aus dem Heft */
  var OPTIONS = [
    { key: 'A', seq: 'MSSSSMMS' },
    { key: 'B', seq: 'SSSMMSMS' },
    { key: 'C', seq: 'SMMMSSSS' },
    { key: 'D', seq: 'MSMSMSSS' }
  ];
  var WISH = 'MSMSMSSS';

  /* Regeln: Armband = Kette S S; Kette = Paar Paar Paar; Paar = S M oder M S (Ring: beliebig gedreht) */
  function decompose(seq) {
    var n = seq.length, r, k, ok;
    for (r = 0; r < n; r++) {
      ok = true;
      for (k = 0; k < 3; k++) {
        var a = seq[(r + 2 * k) % n], b = seq[(r + 2 * k + 1) % n];
        if (a === b) { ok = false; break; }
      }
      if (ok && seq[(r + 6) % n] === 'S' && seq[(r + 7) % n] === 'S') return r;
    }
    return -1;
  }
  var RIGHT = OPTIONS.map(function (o) { return decompose(o.seq) < 0; }).indexOf(true);   /* C; per Skript bestätigt */

  function pt(i, rad) {
    var a = (-90 + 45 * i) * Math.PI / 180;
    return [100 + rad * Math.cos(a), 100 + rad * Math.sin(a)];
  }
  function starPath(cx, cy, ro, ri, rot) {
    var d = '', k;
    for (k = 0; k < 12; k++) {
      var a = (rot + k * 30) * Math.PI / 180, r = k % 2 ? ri : ro;
      d += (k ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1);
    }
    return d + 'Z';
  }
  /* Mond: Sichel, Öffnung zeigt nach außen */
  function moonPath(i) {
    var a = -90 + 45 * i, c = pt(i, 66);
    return '<path class="' + P + 'moon" d="M-20 -9 A 20.3 20.3 0 0 0 20 -9 A 29 29 0 0 1 -20 -9 Z" transform="translate(' + c[0].toFixed(1) + ' ' + c[1].toFixed(1) + ') rotate(' + (a + 90) + ') scale(1)"/>';
  }
  /* Armband als SVG-Text; groups: optional Zerlegung (Startindex r) */
  function ring(seq, label, split) {
    var out = '<svg class="' + P + 'ring" viewBox="0 0 200 200" role="img" aria-label="' + label + '">', i, c;
    if (split !== undefined && split >= 0) {
      var spans = [[0, 2, 'p1'], [2, 4, 'p2'], [4, 6, 'p3'], [6, 8, 'ss']];
      spans.forEach(function (s) {
        var a0 = (-90 + 45 * (split + s[0]) - 22.5 + 5) * Math.PI / 180, a1 = (-90 + 45 * (split + s[1]) - 22.5 - 5) * Math.PI / 180;
        var R = 90, x0 = 100 + R * Math.cos(a0), y0 = 100 + R * Math.sin(a0), x1 = 100 + R * Math.cos(a1), y1 = 100 + R * Math.sin(a1);
        out += '<path class="' + P + 'arc ' + P + s[2] + '" d="M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' A ' + R + ' ' + R + ' 0 0 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1) + '"/>';
      });
    }
    for (i = 0; i < 8; i++) {
      c = pt(i, 66);
      if (seq[i] === 'S') out += '<path class="' + P + 'star" d="' + starPath(c[0], c[1], 21, 9, -90 + 45 * i + 15) + '"/>';
      else out += moonPath(i);
    }
    for (i = 0; i < 8; i++) {   /* Verbindungspunkte */
      var a = (-90 + 45 * i + 22.5) * Math.PI / 180;
      out += '<circle class="' + P + 'dot" cx="' + (100 + 66 * Math.cos(a)).toFixed(1) + '" cy="' + (100 + 66 * Math.sin(a)).toFixed(1) + '" r="3.4"/>';
    }
    return out + '</svg>';
  }
  function describe(seq) {
    return seq.split('').map(function (c) { return c === 'S' ? 'Stern' : 'Mond'; }).join(', ');
  }

  var el, api, radios, selected, locked, mark;
  function reset() { selected = null; mark = null; }

  function refresh() {
    radios.forEach(function (btn, i) {
      var on = selected === i, ok = i === RIGHT;
      btn.setAttribute('aria-checked', String(on));
      btn.tabIndex = (selected === null ? i === 0 : on) ? 0 : -1;
      btn.setAttribute('aria-disabled', locked ? 'true' : 'false');
      btn.classList.toggle('selected', on);
      btn.classList.toggle('right', on && mark !== null && ok);
      btn.classList.toggle('wrong', on && mark === 'check' && !ok);
      var m = btn.querySelector('.' + P + 'mark');
      if (m) m.remove();
      if (on && mark !== null) btn.appendChild(h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
    });
  }
  function choose(i, focus) {
    if (locked) return;
    selected = i;
    refresh();
    if (focus) radios[i].focus();
    api.changed();
  }
  function onKey(e) {
    var k = e.key, i = radios.indexOf(e.currentTarget), to = null;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % radios.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + radios.length - 1) % radios.length;
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }

  Biber.register({
    id: 'armband20',
    story:
      '<p>Marie wünscht sich ein Armband aus Monden und Sternen. Sie kann aber nicht gut zeichnen und gibt lieber Anweisungen, wie das Armband gemacht werden soll:</p>' +
      '<ol><li>Verbinde einen Stern und einen Mond zu einem Paar.</li>' +
      '<li>Mache den ersten Schritt noch zweimal, so dass du am Ende drei Paare hast.</li>' +
      '<li>Verbinde die drei Paare zu einer Kette.</li>' +
      '<li>Füge weitere zwei Sterne an einem Ende der Kette an.</li>' +
      '<li>Verbinde die Enden zu einem Armband.</li></ol>',
    question: 'Welches Armband kann NICHT nach Maries Anweisungen gemacht werden?',
    howto: 'Wähle ein Armband. Oben siehst du als Beispiel Maries Wunscharmband, das nach den Anweisungen entsteht.',
    explanation: function () {
      var parts = OPTIONS.map(function (o) {
        var r = decompose(o.seq);
        return '<figure class="' + P + 'fig">' + ring(o.seq, 'Armband ' + o.key + (r >= 0 ? ', zerlegt in drei Stern-Mond-Paare und zwei Sterne' : ', nicht zerlegbar'), r) +
          '<figcaption><strong>' + o.key + ')</strong> ' + (r >= 0 ? 'passt' : 'passt nicht') + '</figcaption></figure>';
      }).join('');
      return '<p>Nach Anweisung 1 steht jeder Mond neben einem Stern, und jedes Armband besteht aus drei Stern-Mond-Paaren plus zwei zusätzlichen Sternen. Bei A, B und D lässt sich das Armband genau so zerlegen (farbige Bögen). Bei C stehen dagegen drei Monde hintereinander, und der mittlere hätte keinen Stern als Partner. <strong>C</strong> ist also die Antwort.</p>' +
        '<div class="' + P + 'figs">' + parts + '</div>' +
        '<p>Solche Regeln (Ersetzungsregeln mit Start- und Endsymbolen) heißen in der Informatik <strong>Grammatik</strong>. Eine Grammatik beschreibt auf endliche Weise eine ganze Menge von Dingen, hier alle möglichen Armbänder: die <strong>Sprache</strong> der Grammatik. Armband → Kette Stern Stern; Kette → Paar Paar Paar; Paar → Stern Mond oder Mond Stern.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      var wish = h('figure', { class: P + 'wish' });
      wish.innerHTML = ring(WISH, 'Maries Wunscharmband: ' + describe(WISH), undefined) + '<figcaption>Maries Wunscharmband</figcaption>';
      radios = OPTIONS.map(function (o, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': o.key,
          'aria-label': 'Armband ' + o.key + ', im Uhrzeigersinn ab oben: ' + describe(o.seq),
          onclick: function () { choose(i, false); }, onkeydown: onKey
        });
        btn.innerHTML = '<span class="' + P + 'key" aria-hidden="true">' + o.key + ')</span>' + ring(o.seq, 'Armband ' + o.key, undefined);
        return btn;
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        wish,
        h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Armbänder' }, radios)));
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
