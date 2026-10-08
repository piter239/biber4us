/* Aufgabe Ballon-Maschine 2 (Biber 2024, S. 11; Klasse 5-6 schwer): bedingte Anweisungen (aufblasen oder entleeren) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-ballon224-';
  var N = 9;   /* Länge der gesuchten Folge */

  /* Rahmen 100 x 100. Lage der Ballons laut Bild im Heft (S. 11):
     B, C kommen von links (Höhe y), F von rechts, A von oben, D, E von unten (Spalte x). */
  var BALLOONS = {
    A: { dir: 'down', pos: 62 },
    B: { dir: 'right', pos: 18 },
    C: { dir: 'right', pos: 83 },
    D: { dir: 'up', pos: 39 },
    E: { dir: 'up', pos: 83 },
    F: { dir: 'left', pos: 39 }
  };
  var LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
  var SOLUTION = 'BEBCACBDB';   /* eine der vier richtigen Folgen (Heft S. 12) */

  function horiz(k) { return BALLOONS[k].dir === 'right' || BALLOONS[k].dir === 'left'; }
  /* Strecke eines aufgeblasenen Ballons */
  function seg(k, len) {
    var b = BALLOONS[k];
    if (b.dir === 'right') return { x0: 0, x1: len, y0: b.pos, y1: b.pos };
    if (b.dir === 'left') return { x0: 100 - len, x1: 100, y0: b.pos, y1: b.pos };
    if (b.dir === 'down') return { x0: b.pos, x1: b.pos, y0: 0, y1: len };
    return { x0: b.pos, x1: b.pos, y0: 100 - len, y1: 100 };
  }
  /* Länge, bis der Ballon k einen schon aufgeblasenen Ballon berührt (sonst bis zum gegenüberliegenden Rand) */
  function inflateLen(k, len) {
    var b = BALLOONS[k], best = 100;
    Object.keys(len).forEach(function (o) {
      if (horiz(o) === horiz(k)) return;
      var s = seg(o, len[o]), l = null;
      if (horiz(k)) { if (s.y0 <= b.pos && b.pos <= s.y1) l = b.dir === 'right' ? s.x0 : 100 - s.x0; }
      else if (s.x0 <= b.pos && b.pos <= s.x1) l = b.dir === 'down' ? s.y0 : 100 - s.y0;
      if (l != null && l < best) best = l;
    });
    return best;
  }
  /* Die Maschine: leer -> aufblasen, aufgeblasen -> entleeren. Liefert die Ballon-Längen (nur aufgeblasene Ballons) */
  function simulate(seq, upto) {
    var len = {};
    for (var i = 0; i < (upto == null ? seq.length : upto); i++) {
      var k = seq[i];
      if (len[k] != null) delete len[k]; else len[k] = inflateLen(k, len);
    }
    return len;
  }
  function key(len) { return LETTERS.map(function (k) { return len[k] == null ? '-' : Math.round(len[k]); }).join(','); }
  var TARGET = simulate(SOLUTION.split(''));   /* A, D, E aufgeblasen (A: 83, D und E: 82), B, C, F leer */
  var TARGET_KEY = key(TARGET);
  function isRight(seq) { return seq.length === N && key(simulate(seq)) === TARGET_KEY; }

  /* ---------- Zeichnung ---------- */
  function badgePos(k) {
    var b = BALLOONS[k];
    if (b.dir === 'right') return [-12, b.pos];
    if (b.dir === 'left') return [112, b.pos];
    if (b.dir === 'down') return [b.pos, -12];
    return [b.pos, 112];
  }
  function badge(k) {
    var p = badgePos(k);
    return '<g><circle cx="' + p[0] + '" cy="' + p[1] + '" r="6.4" class="' + P + 'badge"/><text x="' + p[0] + '" y="' + (p[1] + 3.2) + '" text-anchor="middle" class="' + P + 'bt">' + k + '</text></g>';
  }
  function balloonSvg(k, len) {
    var b = BALLOONS[k], d, n, on = len != null;
    var l = on ? Math.max(len, 0.01) : 0.01;
    if (b.dir === 'right') { n = 'M-5 ' + b.pos + 'L0 ' + b.pos; d = 'M0 ' + b.pos + 'L' + l + ' ' + b.pos; }
    else if (b.dir === 'left') { n = 'M105 ' + b.pos + 'L100 ' + b.pos; d = 'M100 ' + b.pos + 'L' + (100 - l) + ' ' + b.pos; }
    else if (b.dir === 'down') { n = 'M' + b.pos + ' -5L' + b.pos + ' 0'; d = 'M' + b.pos + ' 0L' + b.pos + ' ' + l; }
    else { n = 'M' + b.pos + ' 105L' + b.pos + ' 100'; d = 'M' + b.pos + ' 100L' + b.pos + ' ' + (100 - l); }
    return '<path d="' + n + '" class="' + P + 'nozzle"/>' + (on ? '<path d="' + d + '" class="' + P + 'bal"/>' : '');
  }
  function frameSvg(len, label) {
    var s = '<svg class="' + P + 'frame" viewBox="-20 -20 140 140" role="img" aria-label="' + label + '">' +
      '<rect x="-2" y="-2" width="104" height="104" rx="1" class="' + P + 'rim"/><rect x="0" y="0" width="100" height="100" class="' + P + 'floor"/>';
    LETTERS.forEach(function (k) { s += balloonSvg(k, len[k]); });
    LETTERS.forEach(function (k) { s += badge(k); });
    return s + '</svg>';
  }
  function describe(len) {
    var on = LETTERS.filter(function (k) { return len[k] != null; });
    if (!on.length) return 'Alle Ballons sind leer.';
    var off = LETTERS.filter(function (k) { return len[k] == null; });
    return 'Aufgeblasen: ' + on.map(function (k) { return k + (len[k] >= 99.5 ? ' (ganz durch)' : ''); }).join(', ') + '. Leer: ' + (off.length ? off.join(', ') : 'keiner') + '.';
  }

  /* Beispiel aus dem Heft: F A B A */
  function exampleHtml() {
    var seq = ['F', 'A', 'B', 'A'], out = '<div class="' + P + 'ex" role="group" aria-label="Beispiel: Die Maschine liest F A B A">';
    for (var i = 0; i <= seq.length; i++) {
      if (i) out += '<span class="' + P + 'exarrow" aria-hidden="true"><b>' + seq[i - 1] + '</b>→</span>';
      out += '<span class="' + P + 'exfig">' + frameSvg(simulate(seq, i), 'Beispiel, Bild ' + (i + 1) + ': ' + describe(simulate(seq, i))) + '</span>';
    }
    return out + '</div>';
  }

  var el, api, locked, mark;
  var seq, view, userEl, statusEl, slotBtns, poolBtns, stepEl, prevBtn, nextBtn;

  function reset() { seq = []; view = 0; mark = null; }

  function refresh() {
    var v = Math.min(view, seq.length);
    var len = simulate(seq, v);
    var cap = v === 0 ? 'Am Anfang sind alle Ballons leer.' : 'Nach Schritt ' + v + ' (Buchstabe ' + seq[v - 1] + ', ' + (simulate(seq, v - 1)[seq[v - 1]] != null ? 'entleert' : 'aufgeblasen') + ').';
    userEl.innerHTML = frameSvg(len, 'Dein Bild. ' + cap + ' ' + describe(len));
    stepEl.textContent = v === seq.length ? (seq.length ? 'Bild am Ende der Folge' : 'Noch keine Buchstaben') : 'Bild nach Schritt ' + v + ' von ' + seq.length;
    prevBtn.disabled = v <= 0;
    nextBtn.disabled = v >= seq.length;
    slotBtns.forEach(function (b, i) {
      var k = seq[i];
      b.textContent = k || '';
      b.classList.toggle('filled', !!k);
      b.classList.toggle('now', !!k && i === v - 1 && v < seq.length);
      b.classList.remove('right', 'wrong');
      b.setAttribute('aria-label', 'Schritt ' + (i + 1) + ': ' + (k ? 'Buchstabe ' + k + ' (antippen zum Entfernen)' : 'noch leer'));
      b.disabled = locked || !k;
      var m = b.querySelector('.' + P + 'mark');
      if (m) m.remove();
    });
    if (mark && seq.length === N) {
      var ok = isRight(seq);
      slotBtns.forEach(function (b) {
        b.classList.add(ok ? 'right' : 'wrong');
        b.appendChild(h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
      });
    }
    poolBtns.forEach(function (b) { b.disabled = locked || seq.length >= N; });
    statusEl.textContent = seq.length === 0 ? 'Tippe die Buchstaben in der Reihenfolge an, in der die Maschine sie liest.'
      : seq.length < N ? 'Bisher gelesen: ' + seq.join(' ') + '. Noch ' + (N - seq.length) + ' Buchstabe' + (N - seq.length === 1 ? '' : 'n') + '.'
        : 'Folge: ' + seq.join(' ') + '. Prüfe die Antwort, wenn dein Bild gleich dem Bild „So soll es werden“ ist.';
  }
  function changed() { refresh(); api.changed(); }
  function add(k) {
    if (locked || seq.length >= N) return;
    seq.push(k);
    view = seq.length;
    mark = null;
    changed();
  }
  function removeAt(i) {
    if (locked || !seq[i]) return;
    seq.splice(i, 1);
    view = seq.length;
    mark = null;
    changed();
  }
  function undo() { if (!locked && seq.length) removeAt(seq.length - 1); }
  function clearAll() {
    if (locked || !seq.length) return;
    seq = []; view = 0; mark = null;
    changed();
  }
  function stepView(d) {
    view = Math.max(0, Math.min(seq.length, view + d));
    refresh();
  }

  Biber.register({
    id: 'ballon224',
    story:
      '<p>Eine Ballon-Maschine kann Bilder erstellen, indem sie Ballons in einem quadratischen Rahmen aufbläst. Die Ballons sind mit <b>A, B, C, D, E</b> und <b>F</b> beschriftet.</p>' +
      '<p>Die Maschine liest nacheinander eine Folge von Buchstaben, von links nach rechts. Vor dem ersten Buchstaben sind alle Ballons leer. Wenn die Maschine einen Buchstaben gelesen hat, macht sie Folgendes:</p>' +
      '<ul><li>Wenn der Ballon mit diesem Buchstaben <b>leer</b> ist, wird er <b>aufgeblasen</b>, bis er entweder einen anderen Ballon oder den gegenüberliegenden Rand des Rahmens berührt.</li>' +
      '<li>Wenn der Ballon mit diesem Buchstaben <b>aufgeblasen</b> ist, wird er <b>entleert</b>.</li></ul>' +
      '<p>Wenn die Maschine zum Beispiel die Buchstabenfolge <b>F A B A</b> liest, macht sie dies:</p>' + exampleHtml(),
    question: 'Die Maschine liest eine Folge von neun Buchstaben. Am Ende hat sie das Bild „So soll es werden“ erstellt. Gib die Folge an.',
    howto: 'Tippe die Buchstaben der Reihe nach an (auch mehrfach). Im Rahmen „Dein Bild“ siehst du, was die Maschine damit macht; mit den Pfeilen kannst du die Schritte einzeln ansehen. Tippe auf einen Buchstaben in der Folge, um ihn zu entfernen.',
    explanation: function () {
      return '<p>Die Länge der Ballons verrät die Reihenfolge. Damit E und D bis zu B reichen, muss B <b>vor</b> ihnen aufgeblasen sein und danach wieder entleert werden (B E B und B D B). ' +
        'Damit A bis zu C reicht, muss C vor A aufgeblasen sein und später wieder entleert werden (C A C). ' +
        'Außerdem muss B leer sein, bevor A aufgeblasen wird (sonst wäre A kürzer), und C muss leer sein, bevor D aufgeblasen wird. ' +
        'Wenn B für E aufgeblasen wird, darf A noch nicht aufgeblasen sein, sonst würde B an A stoppen.</p>' +
        '<p>Alle vier richtigen Folgen sind: <b>B E B C A C B D B</b>, <b>B E C B A C B D B</b>, <b>B E B C A B C D B</b> und <b>B E C B A B C D B</b>. Du hast auch eine davon gefunden, wenn dein Bild am Ende stimmt.</p>' +
        '<p>Die Buchstabenfolge ist wie ein kleines Programm. Jeder Buchstabe ist eine <i>bedingte Anweisung</i>: <i>Wenn der Ballon leer ist, blase ihn auf, sonst entleere ihn.</i> ' +
        'Weil jede Anweisung beeinflusst, was die späteren bewirken, kommt es auf die Reihenfolge an. Das genau zu bedenken ist beim Programmieren besonders wichtig.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      var targetEl = h('div', { class: P + 'fig' });
      targetEl.innerHTML = frameSvg(TARGET, 'So soll das Bild aussehen: Ballon A hängt von oben herab bis fast zum unteren Rand, D und E reichen von unten fast bis zum oberen Rand; B, C und F sind leer.');
      userEl = h('div', { class: P + 'fig' });
      statusEl = h('p', { class: P + 'status', role: 'status', 'aria-live': 'polite' });
      stepEl = h('span', { class: P + 'stepcap', 'aria-live': 'polite' });
      prevBtn = h('button', { type: 'button', class: 'btn ghost ' + P + 'nav', 'aria-label': 'Einen Schritt zurück ansehen', onclick: function () { stepView(-1); } }, '◀');
      nextBtn = h('button', { type: 'button', class: 'btn ghost ' + P + 'nav', 'aria-label': 'Einen Schritt weiter ansehen', onclick: function () { stepView(1); } }, '▶');
      slotBtns = [];
      for (var i = 0; i < N; i++) (function (i) {
        slotBtns.push(h('button', { type: 'button', class: P + 'slot', onclick: function () { removeAt(i); } }));
      })(i);
      poolBtns = LETTERS.map(function (k) {
        return h('button', { type: 'button', class: P + 'letter', 'aria-label': 'Buchstabe ' + k + ' anhängen', onclick: function () { add(k); } }, k);
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('div', { class: P + 'figs' },
          h('figure', { class: P + 'figure' }, targetEl, h('figcaption', null, 'So soll es werden')),
          h('figure', { class: P + 'figure' }, userEl, h('figcaption', null, 'Dein Bild'))),
        h('div', { class: P + 'stepper' }, prevBtn, stepEl, nextBtn),
        h('section', { 'aria-label': 'Folge' },
          h('h3', null, 'Die Folge (' + N + ' Buchstaben)'),
          h('div', { class: P + 'slots' }, slotBtns.map(function (b, i) { return h('div', { class: P + 'step' }, h('span', { class: P + 'no', 'aria-hidden': 'true' }, String(i + 1)), b); }))),
        h('section', { 'aria-label': 'Buchstaben' },
          h('h3', null, 'Buchstaben'),
          h('div', { class: P + 'pool' }, poolBtns,
            h('button', { type: 'button', class: 'btn ghost ' + P + 'undo', onclick: undo }, 'Letzten entfernen'),
            h('button', { type: 'button', class: 'btn ghost ' + P + 'clear', onclick: clearAll }, 'Alles löschen'))),
        statusEl));
      refresh();
    },
    isComplete: function () { return seq.length === N; },
    evaluate: function () { return { correct: isRight(seq), answer: seq.join('') }; },
    setAnswer: function (ans) {
      seq = String(ans || '').split('').filter(function (k) { return BALLOONS[k]; }).slice(0, N);
      view = seq.length;
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? 'check' : null;
      refresh();
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () { seq = SOLUTION.split(''); view = seq.length; mark = 'check'; locked = true; refresh(); }
  });
})();
