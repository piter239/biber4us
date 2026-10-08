/* Aufgabe Stern-Mobiles (Klasse 11-13, mittel): rekursive Struktur, Klammerschreibweise */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-sternmobiles24';

  /* Ein Stern-Mobile ist entweder eine Zahl (Faden mit so vielen Sternen)
     oder ein Stab { a1, m1, a2, m2 }: links im Abstand a1 hängt m1, rechts im Abstand a2 hängt m2. */
  function rod(a1, m1, a2, m2) { return { a1: a1, m1: m1, a2: a2, m2: m2 }; }
  var M3 = rod(-1, 1, 1, 1);
  var EXAMPLE = rod(-3, M3, 2, 3);
  var TARGET = '(-3 (-1 4) (2 (-1 1) (1 1))) (2 (-1 6) (2 3))';
  var OPTIONS = [
    { key: 'A', m: rod(-3, rod(-1, 4, 2, M3), 2, rod(-1, 6, 2, 3)) },
    { key: 'B', m: rod(-3, rod(-1, 4, 2, 2), 2, rod(-1, 6, 2, 3)) },
    { key: 'C', m: rod(-3, rod(-1, 4, 2, M3), 2, rod(-1, 3, 2, 3)) },
    { key: 'D', m: rod(-2, rod(-2, 3, 1, 6), 3, rod(-2, M3, 1, 4)) }
  ];

  /* Beschreibung in Klammerschreibweise (Rekursion über die Struktur) */
  function notation(m) {
    if (typeof m === 'number') return String(m);
    return '(' + m.a1 + ' ' + notation(m.m1) + ') (' + m.a2 + ' ' + notation(m.m2) + ')';
  }
  /* Beschreibung in Worten für Screenreader */
  function words(m) {
    if (typeof m === 'number') return 'Faden mit ' + m + (m === 1 ? ' Stern' : ' Sternen');
    var side = function (a) { return 'Abstand ' + Math.abs(a) + (a < 0 ? ' nach links' : ' nach rechts'); };
    return 'Stab, ' + side(m.a1) + ': ' + words(m.m1) + '; ' + side(m.a2) + ': ' + words(m.m2);
  }
  var RIGHT = (function () {
    var idx = -1, n = 0;
    OPTIONS.forEach(function (o, i) { if (notation(o.m) === TARGET) { idx = i; n++; } });
    return n === 1 ? idx : -1;
  })();

  /* ---------- Zeichnen (rekursiv wie die Definition) ---------- */
  var U = 22, R = 11, GAPY = 1.1 * U;
  var STAR = (function () {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var r = i % 2 ? R * 0.45 : R, a = -Math.PI / 2 + i * Math.PI / 5;
      pts.push((r * Math.cos(a)).toFixed(2) + ',' + (r * Math.sin(a)).toFixed(2));
    }
    return pts.join(' ');
  })();

  function mobileSvg(m, cls, label) {
    var thr = '', rods = '', dots = '', stars = '';
    var b = { x0: 0, x1: 0, y1: 0 };
    function grow(x0, x1, y1) { b.x0 = Math.min(b.x0, x0); b.x1 = Math.max(b.x1, x1); b.y1 = Math.max(b.y1, y1); }
    function line(x, ya, yb) { thr += '<line x1="' + x + '" y1="' + ya + '" x2="' + x + '" y2="' + yb + '"/>'; }
    function draw(node, x, yp) {
      var y = yp + GAPY;
      if (typeof node === 'number') {
        var last = y + (node - 1) * U;
        line(x, yp, last);
        for (var k = 0; k < node; k++) stars += '<polygon points="' + STAR + '" transform="translate(' + x + ' ' + (y + k * U) + ')"/>';
        grow(x - R, x + R, last + R);
        return;
      }
      line(x, yp, y);
      var lo = Math.min(0, node.a1, node.a2), hi = Math.max(0, node.a1, node.a2);
      rods += '<rect x="' + (x + lo * U - 8) + '" y="' + (y - 4.5) + '" width="' + ((hi - lo) * U + 16) + '" height="9" rx="4.5"/>';
      for (var d = lo; d <= hi; d++) dots += (d === 0 ? '<circle class="' + P + '-hang" cx="' + (x + d * U) + '" cy="' + y + '" r="4.2"/>' : '') +
        '<circle cx="' + (x + d * U) + '" cy="' + y + '" r="1.9"/>';
      grow(x + lo * U - 8, x + hi * U + 8, y + 5);
      draw(node.m1, x + node.a1 * U, y);
      draw(node.m2, x + node.a2 * U, y);
    }
    draw(m, 0, 0);
    var pad = 4, w = b.x1 - b.x0 + 2 * pad, hh = b.y1 + 2 * pad;
    return '<svg class="' + cls + '" style="max-width:' + Math.round(w * 0.82) + 'px" viewBox="' + (b.x0 - pad) + ' ' + (-pad) + ' ' + w + ' ' + hh + '" role="img" aria-label="' + label.replace(/"/g, '') + '" focusable="false">' +
      '<g class="' + P + '-thr">' + thr + '</g><g class="' + P + '-rod">' + rods + '</g><g class="' + P + '-dots">' + dots + '</g><g class="' + P + '-stars">' + stars + '</g></svg>';
  }

  function storyHtml() {
    return '<p>Stern-Mobiles sind Gebilde aus Fäden, Stäben und Sternen. An einem Faden kann eine Anzahl von Sternen hängen; oder ein Stab, an dessen beiden Enden jeweils wieder ein Stern-Mobile hängt.</p>' +
      '<div class="' + P + '-ex">' +
      '<figure>' + mobileSvg(EXAMPLE, P + '-fig', 'Einfaches Stern-Mobile. ' + words(EXAMPLE)) + '<figcaption>Dies ist ein einfaches Stern-Mobile.</figcaption></figure>' +
      '<div><p>Mit Zahlen und Klammern kann man es so beschreiben:</p><p><code class="' + P + '-code">' + notation(EXAMPLE) + '</code></p></div></div>' +
      '<p>Die Zahlen geben jeweils an:</p><ul><li>entweder den Abstand eines Stab-Endes zum Faden, an dem der Stab hängt (negativ: nach links),</li><li>oder eine Anzahl an Sternen.</li></ul>' +
      '<p>Die Klammern geben die Struktur des Stern-Mobiles an.</p>' +
      '<p>Welches der folgenden Stern-Mobiles kann man so beschreiben:</p>' +
      '<p><code class="' + P + '-code ' + P + '-target">' + TARGET + '</code></p>';
  }

  /* ---------- Zustand ---------- */
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
      btn.setAttribute('aria-disabled', locked ? 'true' : 'false');
      btn.classList.toggle('selected', on);
      var ok = i === RIGHT;
      btn.classList.toggle('right', on && mark !== null && ok);
      btn.classList.toggle('wrong', on && mark === 'check' && !ok);
      var m = btn.querySelector('.' + P + '-mark');
      if (m) m.remove();
      if (on && mark !== null) btn.appendChild(h('span', { class: P + '-mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
    });
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
    id: 'sternmobiles24',
    story: storyHtml(),
    question: 'Welches Stern-Mobile passt zu dieser Beschreibung?',
    howto: 'Lies die Beschreibung von außen nach innen: Die beiden äußeren Klammerpaare gehören zum obersten Stab. Tippe dann das passende Mobile an.',
    explanation: function () {
      var t = OPTIONS[RIGHT];
      return '<p>Ein Stern-Mobile mit Stab wird durch zwei Klammerpaare <code>(A1 M1) (A2 M2)</code> beschrieben, von links nach rechts so angeordnet wie die Teil-Mobiles am Stab. ' +
        '<code>A1</code> und <code>A2</code> sind die Abstände zum Aufhängefaden, <code>M1</code> und <code>M2</code> die daran hängenden Stern-Mobiles. Ein Faden mit Sternen wird durch eine einzelne Zahl beschrieben.</p>' +
        '<p>Der Ausdruck beschreibt also einen Stab mit zwei Teil-Mobiles: links im Abstand 3 ein Stab, rechts im Abstand 2 ein Stab. ' +
        'Am linken Teil-Stab hängt links (Abstand 1) ein Faden mit 4 Sternen und rechts (Abstand 2) ein kleines Mobile mit je einem Stern links und rechts. ' +
        'Am rechten Teil-Stab hängen links (Abstand 1) 6 Sterne und rechts (Abstand 2) 3 Sterne.</p>' +
        '<div class="' + P + '-solfig">' + mobileSvg(t.m, P + '-fig', 'Richtig: Mobile ' + t.key + '. ' + words(t.m)) + '</div>' +
        '<p>Das ist genau Mobile <strong>A</strong>. Bei B hat das linke Teil-Mobile kein eigenes kleines Mobile, bei C gibt es keinen Faden mit 6 Sternen, und bei D ist alles spiegelverkehrt.</p>' +
        '<p>Ein Stern-Mobile ist entweder ein Faden mit Sternen oder ein Stab, an dessen Enden wieder Stern-Mobiles hängen. Eine solche Struktur, die sich selbst als Bestandteil enthält, heißt <em>rekursiv</em>. ' +
        'Programme dafür sind meist kurz und folgen demselben Aufbau: Sie behandeln entweder den Basisfall (Faden mit Sternen) oder rufen sich für die Teil-Mobiles selbst auf.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      radios = OPTIONS.map(function (o, i) {
        var label = 'Mobile ' + o.key + ': ' + words(o.m);
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + '-opt', 'data-opt': o.key, 'aria-label': label,
          onclick: function () { choose(i, false); }, onkeydown: onKey
        });
        btn.innerHTML = '<span class="' + P + '-key" aria-hidden="true">' + o.key + ')</span>' + mobileSvg(o.m, P + '-pic', '').replace(' role="img"', ' aria-hidden="true"');
        return btn;
      });
      el.replaceChildren(h('div', { class: P + '-board', role: 'radiogroup', 'aria-label': 'Mobiles A bis D' }, radios));
      refresh();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () { return { correct: selected === RIGHT, answer: { choice: OPTIONS[selected].key } }; },
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
