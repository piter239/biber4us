/* Aufgabe Faktencheck (Heft 2024, S. 27; Klasse 5-6 schwer, 7-8 mittel): Aussagen mit und/oder gegen ein Foto prüfen */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-faktencheck24-';
  var A = 'assets/faktencheck24/';

  /* Was auf dem Foto zu sehen ist (Heft S. 27/28): Hut auf, Stock in der Hand, weder Krawatte noch Fliege, Flipflops nicht, keine Schuhe */
  var FACT = { hut: true, stock: true, krawatte: false, fliege: false, flipflops: false, keineschuhe: true };

  var ICON = {
    hut: { src: 'hut.png', alt: 'Zylinder', w: 28, h: 27 },
    stock: { src: 'stock.png', alt: 'durchgestrichener Spazierstock', w: 20, h: 33 },
    krawatte: { src: 'krawatte.png', alt: 'Krawatte', w: 13, h: 40 },
    fliege: { src: 'fliege.png', alt: 'Fliege', w: 40, h: 23 },
    flipflops: { src: 'flipflops.png', alt: 'Flipflops', w: 30, h: 30 },
    schuhe: { src: 'schuhe.png', alt: 'durchgestrichener Schuh', w: 38, h: 29 }
  };

  /* Jede Aussage = Operator + zwei Teilaussagen (in der Heft-Analyse vollständig ausgeschrieben) */
  var STATEMENTS = [
    { key: 'A', op: 'und',
      parts: [{ t: 'Alfred hatte einen Hut', ic: 'hut', tail: ' auf', v: FACT.hut }, { t: 'Alfred benutzte keinen Stock', s: 'benutzte keinen Stock', ic: 'stock', v: !FACT.stock }] },
    { key: 'B', op: 'oder',
      parts: [{ t: 'Alfred trug eine Krawatte', ic: 'krawatte', v: FACT.krawatte }, { t: 'Alfred trug eine Fliege', s: 'eine Fliege', ic: 'fliege', v: FACT.fliege }] },
    { key: 'C', op: 'und',
      parts: [{ t: 'Alfred hatte einen Hut', ic: 'hut', tail: ' auf', v: FACT.hut }, { t: 'Alfred trug eine Fliege', s: 'trug eine Fliege', ic: 'fliege', v: FACT.fliege }] },
    { key: 'D', op: 'oder',
      parts: [{ t: 'Alfred hatte Flipflops', ic: 'flipflops', tail: ' an', v: FACT.flipflops }, { t: 'Alfred hatte sogar keine Schuhe', s: 'sogar keine Schuhe', ic: 'schuhe', tail: ' an', v: FACT.keineschuhe }] }
  ];
  function truth(s) { return s.op === 'und' ? s.parts[0].v && s.parts[1].v : s.parts[0].v || s.parts[1].v; }
  var TRUE_IDX = STATEMENTS.map(truth).map(function (v, i) { return v ? i : -1; }).filter(function (i) { return i >= 0; });
  var RIGHT = TRUE_IDX[0];   /* genau eine Aussage ist wahr: D (laut Heft) */

  function icon(id, cls) {
    var c = ICON[id];
    return h('img', { class: cls || P + 'ic', src: A + c.src, alt: c.alt, width: c.w, height: c.h, draggable: 'false' });
  }
  function iconHtml(id) {
    var c = ICON[id];
    return '<img class="' + P + 'ic" src="' + A + c.src + '" alt="' + c.alt + '" width="' + c.w + '" height="' + c.h + '">';
  }

  var el, api, locked, selected, mark, radios;

  function reset() { selected = null; mark = null; }

  function statementNode(s) {
    var first = s.parts[0], second = s.parts[1];
    var nodes = [h('span', { class: P + 'key', 'aria-hidden': 'true' }, s.key + ')')];
    var txt = [first.t + ' ', icon(first.ic)];
    if (first.tail) txt.push(first.tail);
    txt.push(' ', h('b', null, s.op), ' ', (second.s || second.t) + ' ', icon(second.ic));
    if (second.tail) txt.push(second.tail);
    txt.push('.');
    nodes.push(h('span', { class: P + 'txt' }, txt));
    return nodes;
  }

  function refresh() {
    radios.forEach(function (btn, i) {
      var on = selected === i, ok = i === RIGHT;
      btn.setAttribute('aria-checked', String(on));
      btn.tabIndex = (selected === null ? i === 0 : on) ? 0 : -1;
      btn.setAttribute('aria-disabled', locked ? 'true' : 'false');
      btn.classList.toggle('selected', on && mark === null);
      btn.classList.toggle('right', mark !== null && ((on && ok) || (mark === 'solution' && ok)));
      btn.classList.toggle('wrong', on && mark === 'check' && !ok);
      var m = btn.querySelector('.' + P + 'mark');
      if (m) m.remove();
      if (mark !== null && ((on && mark === 'check') || (ok && mark === 'solution'))) {
        btn.appendChild(h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
      }
    });
  }
  function choose(i, focus) {
    if (locked) return;
    selected = i;
    refresh();
    if (focus) radios[i].focus();
    api.changed('Du hast Aussage ' + STATEMENTS[i].key + ' gewählt.');
  }
  function onKey(e) {
    var k = e.key, i = radios.indexOf(e.currentTarget), to = null;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % radios.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + radios.length - 1) % radios.length;
    else if (k === ' ' || k === 'Enter') { e.preventDefault(); return choose(i, false); }
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }

  Biber.register({
    id: 'faktencheck24',
    story:
      '<p>Als der berühmte Biber Alfred zu einem großen Fest kam, wurde er fotografiert.</p>' +
      '<p>Vier Influencer schrieben über diesen Moment, aber nicht alles in sozialen Medien ist wahr:</p>',
    question: 'Nur eine der vier Aussagen ist wahr. Welche?',
    howto: 'Sieh dir das Foto genau an und tippe die Aussage an, die zum Foto passt.',
    explanation: function () {
      function yn(v) { return '<em>' + (v ? 'wahr' : 'falsch') + '</em>'; }
      var rows = STATEMENTS.map(function (s) {
        var a = s.parts[0], b = s.parts[1], t = truth(s);
        var why = s.op === 'und'
          ? (t ? 'beide Teilaussagen wahr sind' : 'nicht beide Teilaussagen wahr sind')
          : (t ? 'mindestens eine Teilaussage wahr ist' : 'nicht mindestens eine Teilaussage wahr ist');
        return '<li><strong>Aussage ' + s.key + ':</strong> ' + a.t + (a.tail || '') + ' ' + iconHtml(a.ic) + ' (' + yn(a.v) + ') <b>' + s.op + '</b> ' +
          b.t + (b.tail || '') + ' ' + iconHtml(b.ic) + ' (' + yn(b.v) + ').<br>' +
          '<span class="' + P + 'res ' + (t ? 'is-true' : 'is-false') + '">' + (t ? 'Wahr' : 'Falsch') + '</span>, weil ' + why + '.</li>';
      }).join('');
      return '<p>Man prüft jede Teilaussage am Foto und setzt dann <b>und</b> bzw. <b>oder</b> ein. „und“ ist nur wahr, wenn beide Teile wahr sind; „oder“ ist wahr, sobald mindestens ein Teil wahr ist.</p>' +
        '<ul class="' + P + 'why">' + rows + '</ul>' +
        '<p>Nur <strong>Aussage ' + STATEMENTS[RIGHT].key + '</strong> ist wahr: Alfred hat zwar keine Flipflops an, aber er trägt gar keine Schuhe.</p>' +
        '<p>Logische Operatoren wie „und“ und „oder“ verknüpfen einfache Aussagen zu komplexeren. In Programmen legt man damit Bedingungen fest, etwa bei einem Spam-Filter.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      radios = STATEMENTS.map(function (s, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': s.key,
          'aria-label': 'Aussage ' + s.key + ': ' + s.parts[0].t + (s.parts[0].tail || '') + ' (' + ICON[s.parts[0].ic].alt + ') ' + s.op + ' ' + s.parts[1].t + (s.parts[1].tail || '') + ' (' + ICON[s.parts[1].ic].alt + ')',
          onclick: function () { choose(i, false); }, onkeydown: onKey
        }, statementNode(s));
        return btn;
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('div', { class: P + 'photo' },
          h('img', {
            src: A + 'foto.png', width: 560, height: 618, draggable: 'false',
            alt: 'Foto von Biber Alfred: Er trägt einen schwarzen Zylinder und hält einen Spazierstock in der Hand. Eine Krawatte oder Fliege ist nicht zu sehen. Auch Schuhe trägt er nicht.'
          })),
        h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Die vier Aussagen' }, radios)));
      refresh();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () {
      return { correct: selected === RIGHT, answer: { choice: STATEMENTS[selected].key } };
    },
    setAnswer: function (ans) {
      var i = STATEMENTS.map(function (s) { return s.key; }).indexOf(ans && ans.choice);
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
