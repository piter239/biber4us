/* Aufgabe Bäume fällen (Heft 2021, S. 7; Klasse 3-4 mittel, 5-6 einfach): lokale Bedingung prüfen (links kleiner, rechts größer) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-baeumefaellen21-';

  /* Bild assets/baeumefaellen21/wald.png (942 x 206). Je Baum: Rahmen {x, y, w, h} in Bildpunkten und Höhe (aus dem Bild gemessen, in Bildpunkten).
     Der Biber (kein Baum) steht zwischen Baum 8 und 9 und ist nicht anklickbar. */
  var W = 942, HH = 206;
  var TREES = [
    { x: 15, y: 131, w: 47, h: 48, height: 85 },
    { x: 66, y: 20, w: 121, h: 166, height: 308 },
    { x: 189, y: 109, w: 65, h: 70, height: 130 },
    { x: 257, y: 81, w: 74, h: 98, height: 185 },
    { x: 324, y: 66, w: 92, h: 106, height: 215 },
    { x: 415, y: 96, w: 76, h: 83, height: 155 },
    { x: 483, y: 59, w: 99, h: 120, height: 230 },
    { x: 582, y: 43, w: 122, h: 136, height: 262 },
    { x: 724, y: 83, w: 82, h: 96, height: 182 },
    { x: 817, y: 20, w: 119, h: 166, height: 308 }
  ];

  /* Regel: genau dann fällen, wenn links ein kleinerer UND rechts ein größerer Baum direkt daneben steht */
  function fells(i) {
    return i > 0 && i < TREES.length - 1 && TREES[i - 1].height < TREES[i].height && TREES[i + 1].height > TREES[i].height;
  }
  var SOLUTION = TREES.map(function (t, i) { return i; }).filter(fells);   /* [3, 6] = 4. und 7. Baum von links (im Heft bestätigt, per Skript geprüft) */

  function pct(v, total) { return (100 * v / total).toFixed(3) + '%'; }
  function pos(t) { return 'left:' + pct(t.x, W) + ';top:' + pct(t.y, HH) + ';width:' + pct(t.w, W) + ';height:' + pct(t.h, HH) + ';'; }

  var el, api, btns, marked, locked, mark, statusEl;

  function reset() { marked = TREES.map(function () { return false; }); mark = null; }

  function refresh() {
    var n = marked.filter(Boolean).length;
    btns.forEach(function (b, i) {
      var on = marked[i], should = SOLUTION.indexOf(i) >= 0;
      b.setAttribute('aria-pressed', String(on));
      b.disabled = false;
      b.setAttribute('aria-disabled', locked ? 'true' : 'false');
      b.classList.toggle('on', on);
      b.classList.toggle('right', mark !== null && on && should);
      b.classList.toggle('wrong', mark === 'check' && on && !should);
      b.classList.toggle('missed', mark === 'check' && !on && should);
      var m = b.querySelector('.' + P + 'mark');
      if (m) m.remove();
      if (mark !== null && ((on && should) || (mark === 'check' && on !== should))) {
        b.appendChild(h('span', { class: P + 'mark', 'aria-hidden': 'true' }, (on && should) ? '✓' : (on ? '✗' : '!')));
      }
    });
    statusEl.textContent = n === 0 ? 'Noch kein Baum zum Fällen markiert.' : (n === 1 ? '1 Baum zum Fällen markiert.' : n + ' Bäume zum Fällen markiert.');
  }
  function toggle(i) {
    if (locked) return;
    marked[i] = !marked[i];
    refresh();
    api.changed();
  }

  function figure(boxes) {
    return '<div class="' + P + 'fig"><img src="assets/baeumefaellen21/wald.png" width="' + W + '" height="' + HH + '" alt="Zehn Bäume in einer Reihe, Nadelbäume und Laubbäume in verschiedenen Größen; rechts vom achten Baum sitzt ein Biber.">' +
      boxes.map(function (i) { return '<span class="' + P + 'hl" style="' + pos(TREES[i]) + '"></span>'; }).join('') + '</div>';
  }

  Biber.register({
    id: 'baeumefaellen21',
    story:
      '<p>Ein Biber möchte einen Damm bauen. Damit er immer die richtigen Bäume fällt, hat er sich zwei Bedingungen überlegt. Er wird einen Baum genau dann fällen, wenn</p>' +
      '<ul><li>direkt links daneben ein kleinerer Baum steht <strong>und</strong></li><li>direkt rechts daneben ein größerer Baum steht.</li></ul>',
    question: 'Welche Bäume wird der Biber fällen?',
    howto: 'Tippe die Bäume an, die der Biber fällt. Tippe noch einmal, um die Markierung wieder zu entfernen.',
    explanation: function () {
      return '<p>Wir prüfen jeden Baum und schauen auf seine beiden direkten Nachbarn. Gefällt wird nur, wenn der linke Nachbar kleiner <em>und</em> der rechte Nachbar größer ist. ' +
        'Das trifft genau auf den <strong>4. und den 7. Baum von links</strong> zu (gelb markiert).</p>' +
        figure(SOLUTION) +
        '<p>Bei den anderen Bäumen ist mindestens eine Bedingung verletzt. Der 5. Baum zum Beispiel hat links zwar einen kleineren, rechts aber auch einen kleineren Nachbarn. ' +
        'Der erste und der letzte Baum haben auf einer Seite gar keinen Nachbarn.</p>' +
        '<p>Auch Computerprogramme prüfen oft Bedingungen, die zwei Dinge mit <em>und</em> verknüpfen: Nur wenn beide Teile wahr sind, ist die ganze Bedingung wahr.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      statusEl = h('p', { class: P + 'status', role: 'status', 'aria-live': 'polite' });
      btns = TREES.map(function (t, i) {
        return h('button', {
          type: 'button', class: P + 'tree', style: pos(t), 'data-tree': String(i + 1),
          'aria-label': (i + 1) + '. Baum von links', 'aria-pressed': 'false',
          onclick: function () { toggle(i); }
        }, h('span', { class: P + 'num', 'aria-hidden': 'true' }, String(i + 1)));
      });
      var fig = h('div', { class: P + 'fig' },
        h('img', { src: 'assets/baeumefaellen21/wald.png', width: W, height: HH, draggable: 'false',
          alt: 'Zehn Bäume in einer Reihe, Nadelbäume und Laubbäume in verschiedenen Größen; rechts vom achten Baum sitzt ein Biber.' }),
        btns);
      el.replaceChildren(h('div', { class: P + 'board' }, fig, statusEl));
      refresh();
    },
    isComplete: function () { return marked.some(Boolean); },
    evaluate: function () {
      var sel = marked.map(function (m, i) { return m ? i + 1 : 0; }).filter(Boolean);
      var ok = marked.every(function (m, i) { return m === (SOLUTION.indexOf(i) >= 0); });
      return { correct: ok, answer: { trees: sel } };
    },
    setAnswer: function (ans) {
      var sel = (ans && ans.trees) || [];
      marked = TREES.map(function (t, i) { return sel.indexOf(i + 1) >= 0; });
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      refresh();
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () {
      marked = TREES.map(function (t, i) { return SOLUTION.indexOf(i) >= 0; });
      mark = 'solution'; locked = true; refresh();
    }
  });
})();
