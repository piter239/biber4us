/* Aufgabe Hivobu (Postfix-Notation): Formen in Hivobu lesen und die richtige Abbildung wählen */
(function () {
  'use strict';
  var h = Biber.h;

  /* ---- Formen als SVG (viewBox 100 x 110) ---- */
  var SHAPE = {
    RAH: '<rect class="hv-rah" x="40" y="{y}" width="20" height="52" rx="1"/>',
    OH: '<circle class="hv-oh" cx="50" cy="{c}" r="20"/>',
    TEH: '<polygon class="hv-teh" points="27,{b} 73,{b} 50,{t}"/>'
  };
  // Höhe der Formen: Rechteck 52, Kreis 40, Dreieck 40
  var HEIGHT = { RAH: 52, OH: 40, TEH: 40 };

  // Form so zeichnen, dass ihre Mitte bei cy liegt
  function shape(name, cy) {
    var hh = HEIGHT[name];
    var top = cy - hh / 2;
    return SHAPE[name].replace('{y}', top).replace('{c}', cy).replace('{t}', top).replace(/\{b\}/g, top + hh);
  }

  // "A B CO": A liegt über B, beide überlappen. "A B DU": A liegt direkt über B.
  function compose(a, b, op) {
    var body;
    if (op === 'CO') body = shape(b, 55) + shape(a, 55); // erste Form oben (zuletzt gezeichnet)
    else {
      var total = HEIGHT[a] + HEIGHT[b];
      var start = 55 - total / 2;
      body = shape(a, start + HEIGHT[a] / 2) + shape(b, start + HEIGHT[a] + HEIGHT[b] / 2);
    }
    return body;
  }
  function svg(inner, cls) {
    return '<svg class="' + (cls || 'hv-svg') + '" viewBox="20 8 60 94" aria-hidden="true" focusable="false">' + inner + '</svg>';
  }
  function single(name) { return svg(shape(name, 55)); }
  function pair(a, b, op, cls) { return svg(compose(a, b, op), cls); }

  var NAMES = { RAH: 'Rechteck', OH: 'Kreis', TEH: 'Dreieck' };

  /* ---- Antwortmöglichkeiten wie im Heft ---- */
  var OPTIONS = [
    { key: 'A', a: 'OH', b: 'TEH', op: 'CO', alt: 'Ein Kreis liegt auf einem Dreieck, das hinten herausschaut' },
    { key: 'B', a: 'TEH', b: 'RAH', op: 'CO', alt: 'Ein Dreieck liegt auf einem Rechteck' },
    { key: 'C', a: 'TEH', b: 'OH', op: 'CO', alt: 'Ein Dreieck liegt auf einem Kreis' },
    { key: 'D', a: 'OH', b: 'TEH', op: 'DU', alt: 'Ein Kreis liegt über einem Dreieck, ohne es zu überdecken' }
  ];
  var RIGHT = 2;

  function storyHtml() {
    var t1 = '<table class="hv-tab hv-tab3"><thead><tr><th scope="col">RAH</th><th scope="col">OH</th><th scope="col">TEH</th></tr></thead><tbody><tr>' +
      ['RAH', 'OH', 'TEH'].map(function (n) {
        return '<td><span role="img" aria-label="' + NAMES[n] + '">' + single(n) + '</span></td>';
      }).join('') + '</tr></tbody></table>';
    var ex = [
      ['OH', 'RAH', 'CO', 'Ein Kreis liegt auf einem Rechteck, beide überlappen'],
      ['RAH', 'OH', 'CO', 'Ein Rechteck liegt auf einem Kreis, beide überlappen'],
      ['OH', 'RAH', 'DU', 'Ein Kreis liegt über einem Rechteck'],
      ['RAH', 'OH', 'DU', 'Ein Rechteck liegt über einem Kreis']
    ];
    var t2 = '<table class="hv-tab hv-tab4"><thead><tr>' + ex.map(function (e) {
      return '<th scope="col">' + e[0] + ' ' + e[1] + ' ' + e[2] + '</th>';
    }).join('') + '</tr></thead><tbody><tr>' + ex.map(function (e) {
      return '<td><span role="img" aria-label="' + e[3] + '">' + pair(e[0], e[1], e[2]) + '</span></td>';
    }).join('') + '</tr></tbody></table>';
    return '<p>Im Land Hivobu heißen diese drei Formen:</p>' + t1 +
      '<p>Wenn man in Hivobu zwei Formen hintereinander oder untereinander legt, heißt das so:</p>' + t2;
  }

  var el, api, radios, selected, locked, mark;

  function reset() { selected = null; mark = null; }

  function choose(i, focus) {
    if (locked) return;
    selected = i;
    refresh();
    if (focus) radios[i].focus();
    api.changed();
  }

  function refresh() {
    radios.forEach(function (btn, i) {
      var on = selected === i;
      btn.setAttribute('aria-checked', String(on));
      btn.tabIndex = (selected === null ? i === 0 : on) ? 0 : -1;
      btn.disabled = false;
      btn.setAttribute('aria-disabled', locked ? 'true' : 'false');
      btn.classList.toggle('selected', on);
      var ok = i === RIGHT;
      btn.classList.toggle('right', on && mark !== null && ok);
      btn.classList.toggle('wrong', on && mark === 'check' && !ok);
      var m = btn.querySelector('.hv-mark');
      if (m) m.remove();
      if (on && mark !== null) {
        btn.appendChild(h('span', { class: 'hv-mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
      }
    });
  }

  function onKey(e) {
    var k = e.key, i = radios.indexOf(e.currentTarget);
    var to = null;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % radios.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + radios.length - 1) % radios.length;
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }

  Biber.register({
    id: 'hivobu',
    story: storyHtml(),
    question: 'Was heißt in Hivobu: TEH OH CO?',
    howto: 'Tippe die Abbildung an, die zu TEH OH CO passt.',
    explanation: function () {
      return '<p>Die Beispiele zeigen: Das Wort <strong>CO</strong> heißt „legt die Formen übereinander, sodass sie sich überlappen“, und die <strong>zuerst</strong> genannte Form liegt oben. <strong>DU</strong> heißt „untereinander“, und die zuerst genannte Form ist oben. ' +
        'TEH ist das Dreieck, OH der Kreis. TEH OH CO ist also ein Dreieck, das auf einem Kreis liegt: <strong>Antwort C</strong>.</p>' +
        '<p>Das „Rechenwort“ (CO oder DU) steht in Hivobu hinter den beiden Formen. Informatikerinnen und Informatiker nennen das <em>Postfix-Schreibweise</em>.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      radios = OPTIONS.map(function (o, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: 'hv-opt', 'data-opt': o.key,
          'aria-label': 'Antwort ' + o.key + ': ' + o.alt,
          onclick: function () { choose(i, false); },
          onkeydown: onKey
        });
        btn.innerHTML = '<span class="hv-key" aria-hidden="true">' + o.key + ')</span>' + pair(o.a, o.b, o.op, 'hv-svg hv-big');
        return btn;
      });
      el.replaceChildren(h('div', { class: 'hv-board', role: 'radiogroup', 'aria-label': 'Antworten' }, radios));
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
