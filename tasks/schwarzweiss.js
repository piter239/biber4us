/* Aufgabe Schwarz - Weiß (Klasse 9-10 schwer, 11-13 mittel): rekursive Beschreibung einer Kästchen-Folge */
(function () {
  'use strict';
  var h = Biber.h;

  /* ---------- Algorithmus (B = schwarz, W = weiß) ---------- */
  function encode(s) {
    if (/^W+$/.test(s)) return 'W';
    if (/^B+$/.test(s)) return 'S';
    var m = s.length / 2;
    return 'x' + encode(s.slice(0, m)) + encode(s.slice(m));
  }
  var EXAMPLES = ['WWWWWWWW', 'WWWWBBBB', 'BBWWBBBB', 'BBBBWWBW'];
  var QUESTION = 'WBWWBBBW';                    /* laut Abbildung: weiß, schwarz, weiß, weiß, schwarz, schwarz, schwarz, weiß */
  var CORRECT = encode(QUESTION);               /* xxxWSWxSxSW */
  var MAXLEN = 30;

  /* ---------- Bausteine ---------- */
  function strip(s, size, label, cls) {
    var n = s.length, w = n * size, g = '';
    for (var i = 0; i < n; i++) g += '<rect x="' + (i * size + 1) + '" y="1" width="' + size + '" height="' + size + '" class="sw-' + (s[i] === 'B' ? 'b' : 'w') + '"/>';
    return '<svg class="sw-strip ' + (cls || '') + '" viewBox="0 0 ' + (w + 2) + ' ' + (size + 2) + '" width="' + (w + 2) + '" height="' + (size + 2) +
      '" role="img" aria-label="' + label + '" focusable="false">' + g + '</svg>';
  }
  function words(s) {
    var n = { B: 'schwarz', W: 'weiß' };
    return s.split('').map(function (c) { return n[c]; }).join(', ');
  }
  function code(t) { return '<span class="sw-code">' + t + '</span>'; }

  var STORY =
    '<p>Sarah möchte Folgen von schwarzen und weißen Kästchen mit Buchstaben beschreiben. Sie wendet dazu diesen Algorithmus auf eine Kästchen-Folge an:</p>' +
    '<ul class="sw-rules">' +
    '<li>Wenn alle Kästchen der Folge weiß sind, schreibe ' + code('W') + '.</li>' +
    '<li>Wenn alle Kästchen der Folge schwarz sind, schreibe ' + code('S') + '.</li>' +
    '<li>Wenn die Folge schwarze und weiße Kästchen enthält, schreibe ' + code('x') + ' und mache Folgendes:' +
    '<ul><li>Wende den Algorithmus auf die linke Hälfte der Folge an.</li><li>Wende den Algorithmus auf die rechte Hälfte der Folge an.</li></ul></li></ul>' +
    '<p>Hier siehst du für einige Kästchen-Folgen, welche Buchstaben-Beschreibung der Algorithmus ausgibt:</p>' +
    '<ul class="sw-examples">' + EXAMPLES.map(function (s) {
      return '<li>' + strip(s, 22, 'Kästchen-Folge: ' + words(s)) + '<span class="sw-arrow" aria-hidden="true">→</span>' +
        '<span class="sw-code" aria-label="Beschreibung ' + encode(s).split('').join(' ') + '">' + encode(s) + '</span></li>';
    }).join('') + '</ul>';

  /* ---------- Zustand und Anzeige ---------- */
  var el, api, locked, value, input, status, mode;       /* mode: null | 'right' | 'wrong' */
  var keyBtns = [];

  function normalize(t) {
    return String(t || '').replace(/[^wWsSxX]/g, '').split('').map(function (c) {
      c = c.toLowerCase();
      return c === 'x' ? 'x' : c.toUpperCase();
    }).join('').slice(0, MAXLEN);
  }
  function setValue(v, silent) {
    value = normalize(v);
    input.value = value;
    status.textContent = value.length ? value.length + ' Zeichen' : 'noch leer';
    keyBtns.forEach(function (b) { if (b.dataset.k) b.disabled = !!locked || value.length >= MAXLEN; });
    if (!silent) api.changed(value.length ? 'Eingabe: ' + value : '');
  }
  function paint() {
    input.className = 'sw-input' + (mode ? ' ' + mode : '');
    input.disabled = !!locked;
    keyBtns.forEach(function (b) { b.disabled = !!locked || (!!b.dataset.k && value.length >= MAXLEN) || (!!b.dataset.swact && !value.length); });
  }
  function add(c) { if (locked || value.length >= MAXLEN) return; setValue(value + c); paint(); }
  function back() { if (locked || !value) return; setValue(value.slice(0, -1)); paint(); }
  function clear() { if (locked || !value) return; setValue(''); paint(); }

  /* ---------- Erklärung: Zerlegung als Baum ---------- */
  function node(s, side) {
    var out = encode(s), mixed = out.charAt(0) === 'x' && s.length > 1;
    var head = '<span class="sw-side">' + side + '</span>' + strip(s, 14, 'Teilfolge: ' + words(s)) + '<span class="sw-arrow" aria-hidden="true">→</span>' +
      '<span class="sw-code">' + (mixed ? 'x' : out) + '</span>' +
      '<span class="sw-why">' + (mixed ? 'gemischt, also teilen' : s[0] === 'B' ? 'alle schwarz' : 'alle weiß') + '</span>';
    if (!mixed) return '<li>' + head + '</li>';
    var m = s.length / 2;
    return '<li>' + head + '<ul>' + node(s.slice(0, m), 'links') + node(s.slice(m), 'rechts') + '</ul></li>';
  }

  Biber.register({
    id: 'schwarzweiss',
    story: STORY,
    question: 'Welche Buchstaben-Beschreibung gibt Sarahs Algorithmus für diese Kästchen-Folge aus?',
    howto: 'Tippe die Buchstaben W, S und x nacheinander an oder gib sie mit der Tastatur ein. Mit „Löschen“ nimmst du den letzten Buchstaben wieder weg.',
    explanation: function () {
      return '<p>Man beginnt mit der ganzen Folge und halbiert sie, solange sie schwarze und weiße Kästchen enthält. Jedes Mal wird ein <strong>x</strong> geschrieben, dann folgen erst die linke und dann die rechte Hälfte.</p>' +
        '<ul class="sw-tree">' + node(QUESTION, 'ganz') + '</ul>' +
        '<p>Die Buchstaben von oben nach unten und links vor rechts gelesen ergeben <strong class="sw-code">' + CORRECT + '</strong>. ' +
        'Das ist eine Art Komprimierung: Lange einfarbige Abschnitte brauchen nur einen Buchstaben, und aus der Beschreibung lässt sich die Folge wieder genau herstellen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; value = ''; mode = null; keyBtns = [];
      var seq = h('div', { class: 'sw-seq' });
      seq.innerHTML = strip(QUESTION, 42, 'Kästchen-Folge: ' + words(QUESTION), 'sw-big');
      input = h('input', {
        class: 'sw-input', type: 'text', 'aria-label': 'Buchstaben-Beschreibung', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', inputmode: 'none',
        maxlength: String(MAXLEN * 2), oninput: function () { var v = input.value; setValue(v); paint(); }
      });
      status = h('span', { class: 'sw-status', 'aria-live': 'polite' });
      var keys = h('div', { class: 'sw-keys', role: 'group', 'aria-label': 'Buchstaben eingeben' });
      [['W', 'weiß'], ['S', 'schwarz'], ['x', 'gemischt']].forEach(function (k) {
        var b = h('button', { type: 'button', class: 'sw-key', 'data-k': k[0], 'aria-label': 'Buchstabe ' + k[0] + ' (' + k[1] + ')', onclick: function () { add(k[0]); } },
          h('span', { class: 'sw-keyc' }, k[0]), h('span', { class: 'sw-keyh' }, k[1]));
        keyBtns.push(b); keys.appendChild(b);
      });
      var del = h('button', { type: 'button', class: 'sw-key sw-act', 'data-swact': 'del', 'aria-label': 'Letzten Buchstaben löschen', onclick: back }, h('span', { class: 'sw-keyc' }, '⌫'), h('span', { class: 'sw-keyh' }, 'Löschen'));
      var clr = h('button', { type: 'button', class: 'sw-key sw-act', 'data-swact': 'clr', 'aria-label': 'Alles löschen', onclick: clear }, h('span', { class: 'sw-keyc' }, '✕'), h('span', { class: 'sw-keyh' }, 'Alles'));
      keyBtns.push(del, clr); keys.append(del, clr);
      el.replaceChildren(h('div', { class: 'sw-board' },
        seq,
        h('div', { class: 'sw-entry' }, h('label', { class: 'sw-lab' }, 'Beschreibung', input), status),
        keys));
      setValue('', true);
      paint();
    },
    isComplete: function () { return value.length > 0; },
    evaluate: function () { return { correct: value === CORRECT, answer: value }; },
    setAnswer: function (ans) {
      setValue(typeof ans === 'string' ? ans : '', true);
      mode = value === CORRECT ? 'right' : 'wrong';
      locked = true;
      paint();
    },
    lock: function (on) {
      locked = on;
      mode = on ? (value === CORRECT ? 'right' : 'wrong') : null;
      paint();
    },
    reset: function () { locked = false; mode = null; setValue('', true); paint(); },
    showSolution: function () { locked = true; mode = 'right'; setValue(CORRECT, true); paint(); }
  });
})();
