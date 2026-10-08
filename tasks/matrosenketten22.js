/* Aufgabe Matrosenketten (Biber 2022; Klasse 3-4 schwer, 5-6 mittel, 7-8 leicht): Welche Perlenkette lässt sich nicht nach Monikas Regeln bauen? (Deque) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-matrosenketten22-';

  /* b = blaue Perle, w = weiß-rote Wellenperle (von links nach rechts) */
  var OPTIONS = [
    { key: 'A', chain: 'bwbbwwww' },
    { key: 'B', chain: 'bbwbbbww' },
    { key: 'C', chain: 'bwbwwbww' },
    { key: 'D', chain: 'bwbbbwww' }
  ];
  var RIGHT = 3;   /* D: im Heft bestätigt; per Skript geprüft: A, B und C entstehen aus 'wb' durch die beiden Aktionen, D nicht (4 blaue und 4 Wellenperlen: gerade Anzahlen) */
  var START = 'wb';
  var MAXLEN = 12;

  var NAME = { b: 'blaue Perle', w: 'Wellenperle' };
  function chainLabel(chain) {
    return chain.split('').map(function (c, i) { return (i + 1) + '. ' + NAME[c]; }).join(', ');
  }

  /* ---------- Perlen zeichnen ---------- */
  function bead(c, i, hl) {
    var x = 20 + i * 30, y = 24, out = '<g transform="translate(' + x + ' ' + y + ')">';
    if (hl) out += '<circle r="17" class="' + P + 'ring"/>';
    if (c === 'b') {
      out += '<circle r="13" class="' + P + 'blue"/><ellipse cx="-4.5" cy="-5.5" rx="4.5" ry="3" class="' + P + 'shine" transform="rotate(-35 -4.5 -5.5)"/>';
    } else {
      out += '<circle r="13" class="' + P + 'wave"/>';
      [-6, 0, 6].forEach(function (dx) { out += '<path class="' + P + 'wl" d="M' + dx + ' -8q3 4 0 8t0 8"/>'; });
    }
    return out + '</g>';
  }
  function chainSvg(chain, label, hlFrom) {
    var n = chain.length, w = n * 30 + 10, out = '';
    out += '<path class="' + P + 'cord" d="M2 30 Q8 22 14 24 H' + (w - 14) + ' Q' + (w - 8) + ' 26 ' + (w - 2) + ' 18" fill="none"/>';
    chain.split('').forEach(function (c, i) { out += bead(c, i, hlFrom !== undefined && hlFrom !== null && (i >= hlFrom.from && i < hlFrom.to || i >= hlFrom.from2 && i < hlFrom.to2)); });
    return '<svg class="' + P + 'chain" viewBox="0 0 ' + w + ' 48" style="max-width:' + (w * 1.15) + 'px" role="img" aria-label="' + label + '">' + out + '</svg>';
  }

  var el, api, radios, selected, locked, mark;
  var wb, wbChain, wbLog, wbMsg, wbBtns, build;

  function reset() { selected = null; mark = null; }

  /* ---------- Werkstatt zum Ausprobieren ---------- */
  function newBuild() { build = { chain: START, log: [], hl: null }; drawBuild(); }
  function act(kind) {
    var c = build.chain;
    if (c.length + 2 > MAXLEN) return;
    if (kind === 'B') { build.chain = 'b' + c + 'b'; build.hl = { from: 0, to: 1, from2: c.length + 1, to2: c.length + 2 }; }
    else { build.chain = c + 'ww'; build.hl = { from: c.length, to: c.length + 2, from2: 0, to2: 0 }; }
    build.log.push(kind);
    drawBuild();
  }
  function undo() {
    if (!build.log.length) return;
    var kind = build.log.pop(), c = build.chain;
    build.chain = kind === 'B' ? c.slice(1, -1) : c.slice(0, -2);
    build.hl = null;
    drawBuild();
  }
  function drawBuild() {
    wbChain.innerHTML = chainSvg(build.chain, 'Deine Kette: ' + chainLabel(build.chain), build.hl);
    wbMsg.textContent = build.log.length
      ? 'Aktionen bisher: ' + build.log.map(function (k) { return k === 'B' ? 'B (blau links und rechts)' : 'W (zwei Wellenperlen rechts)'; }).join(', ') + '. Die neuen Perlen sind eingekreist.'
      : 'Du beginnst mit einer Wellenperle links und einer blauen Perle rechts. Wähle eine Aktion.';
    var full = build.chain.length + 2 > MAXLEN;
    wbBtns.b.disabled = full; wbBtns.w.disabled = full;
    wbBtns.undo.disabled = !build.log.length;
    wbBtns.reset.disabled = !build.log.length;
  }

  /* ---------- Antworten ---------- */
  function choose(i, focus) {
    if (locked) return;
    selected = i;
    refresh();
    if (focus) radios[i].focus();
    api.changed();
  }
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
  function onKey(e) {
    var k = e.key, i = radios.indexOf(e.currentTarget), to = null;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % radios.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + radios.length - 1) % radios.length;
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }

  Biber.register({
    id: 'matrosenketten22',
    story:
      '<p>Monika macht Matrosenketten mit weiß-roten Wellenperlen und einfarbigen blauen Perlen. Sie beginnt immer mit einer Wellenperle links und einer blauen Perle rechts.</p>' +
      '<p>Dann verlängert sie die Matrosenkette mehrmals. Jedesmal fügt sie</p>' +
      '<ul><li>entweder an beiden Enden der Schnur jeweils <b>eine blaue Perle</b> hinzu (Aktion <b>B</b>)</li>' +
      '<li>oder <b>zwei Wellenperlen am rechten Ende</b> der Schnur hinzu (Aktion <b>W</b>).</li></ul>',
    question: 'Welche dieser Ketten ist keine von Monikas Matrosenketten?',
    howto: 'Wähle eine Kette. Unten kannst du in der Werkstatt selbst Ketten nach Monikas Regeln bauen und ausprobieren.',
    explanation: function () {
      return '<p>Man sucht in jeder Kette zuerst die beiden Anfangsperlen (Wellenperle links, blaue Perle rechts, nebeneinander) und prüft dann, ob sich die übrigen Perlen mit den Aktionen B und W anfügen lassen:</p>' +
        '<ul><li><strong>A:</strong> Start mit Perle 2 und 3, dann B, W, W.</li>' +
        '<li><strong>B:</strong> Start mit Perle 3 und 4, dann B, B, W.</li>' +
        '<li><strong>C:</strong> Start mit Perle 2 und 3, dann W, B, W.</li>' +
        '<li><strong>D:</strong> Start mit Perle 2 und 3. Mit B kommen die erste und vierte Perle dazu, aber danach gibt es keine Aktion mehr, die die übrigen vier Perlen anfügen könnte.</li></ul>' +
        '<p>Es geht auch schneller: Jede Aktion fügt entweder zwei blaue oder zwei Wellenperlen hinzu. Am Anfang gibt es je eine, also ist die Zahl der blauen Perlen und die der Wellenperlen <strong>immer ungerade</strong>. Kette D hat 4 blaue und 4 Wellenperlen, also kann sie keine von Monikas Ketten sein.</p>' +
        '<p>Eine Kette, bei der man Perlen nur an den Enden anfügen oder wegnehmen kann, entspricht in der Informatik einer „double-ended queue“, kurz <em>Deque</em> („Deck“ gesprochen). Mit Deques verwaltet man zum Beispiel den Verlauf eines Web-Browsers oder Rückgängig-Listen, und man kann damit prüfen, ob Klammern in einem Ausdruck zusammenpassen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      radios = OPTIONS.map(function (o, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': o.key,
          'aria-label': 'Kette ' + o.key + ': ' + chainLabel(o.chain),
          onclick: function () { choose(i, false); }, onkeydown: onKey
        });
        btn.innerHTML = '<span class="' + P + 'key" aria-hidden="true">' + o.key + '</span>' + chainSvg(o.chain, 'Perlenkette ' + o.key, null).replace(' role="img"', ' aria-hidden="true"');
        return btn;
      });
      wbChain = h('div', { class: P + 'wbchain' });
      wbMsg = h('p', { class: P + 'msg', role: 'status', 'aria-live': 'polite' });
      wbBtns = {
        b: h('button', { type: 'button', class: P + 'act', onclick: function () { act('B'); } }, 'B: blaue Perle links und rechts'),
        w: h('button', { type: 'button', class: P + 'act', onclick: function () { act('W'); } }, 'W: zwei Wellenperlen rechts'),
        undo: h('button', { type: 'button', class: 'btn ghost ' + P + 'small', onclick: undo }, 'Schritt zurück'),
        reset: h('button', { type: 'button', class: 'btn ghost ' + P + 'small', onclick: newBuild }, 'Von vorn')
      };
      wb = h('section', { class: P + 'shop', 'aria-label': 'Zum Ausprobieren: Monikas Werkstatt' },
        h('h3', null, 'Zum Ausprobieren: Monikas Werkstatt'),
        wbChain, wbMsg,
        h('div', { class: P + 'acts' }, wbBtns.b, wbBtns.w, wbBtns.undo, wbBtns.reset));
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { 'aria-label': 'Antwort' }, h('h3', null, 'Welche Kette ist keine Matrosenkette?'),
          h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Ketten' }, radios)),
        wb));
      newBuild();
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
    reset: function () { reset(); newBuild(); refresh(); },
    showSolution: function () { selected = RIGHT; mark = 'solution'; locked = true; refresh(); }
  });
})();
