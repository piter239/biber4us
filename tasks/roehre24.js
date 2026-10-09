/* Aufgabe Röhre (Biber 2024; Klasse 5-6 einfach): Deque mit Kapazität 3, Kugeln von links und rechts hineinschieben */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-roehre24-';

  var START = ['b', 'w', 'b'];                       /* von links nach rechts: schwarz, weiß, schwarz */
  var STEPS = [{ ball: 'b', from: 'r' }, { ball: 'w', from: 'r' }, { ball: 'b', from: 'l' }, { ball: 'w', from: 'l' }];
  var ANSWER = ['w', 'b', 'b'];                      /* offizielle Lösung (Heft S. 56): weiß, schwarz, schwarz */
  var NAME = { b: 'schwarz', w: 'weiß' };

  /* Eine Kugel von links ('l') oder rechts ('r') hineinschieben; liefert neue Röhre und die herausgefallene Kugel */
  function push(tube, ball, from) {
    var t = tube.slice(), out;
    if (from === 'l') { out = t.pop(); t.unshift(ball); }
    else { out = t.shift(); t.push(ball); }
    return { tube: t, out: out };
  }
  function run(steps) {
    var t = START.slice();
    steps.forEach(function (s) { t = push(t, s.ball, s.from).tube; });
    return t;
  }
  if (run(STEPS).join('') !== ANSWER.join('')) throw new Error('roehre24: Lösung stimmt nicht');
  /* Beispiele aus dem Heft */
  if (push(START, 'w', 'l').tube.join('') !== 'wbw' || push(START, 'w', 'l').out !== 'b') throw new Error('roehre24: Beispiel 1');
  if (push(START, 'b', 'r').tube.join('') !== 'wbb' || push(START, 'b', 'r').out !== 'b') throw new Error('roehre24: Beispiel 2');

  function ball(c, cls) {
    return h('span', { class: P + 'ball ' + P + (c === 'b' ? 'black' : 'white') + (cls ? ' ' + cls : ''), 'aria-hidden': 'true' });
  }
  function tube(arr, label) {
    return h('div', { class: P + 'tube', role: 'img', 'aria-label': label || ('Röhre, von links nach rechts: ' + arr.map(function (c) { return NAME[c]; }).join(', ')) },
      arr.map(function (c) { return h('span', { class: P + 'cell' }, ball(c)); }));
  }
  function listText(arr) { return arr.map(function (c) { return NAME[c]; }).join(', '); }

  /* Beispieldiagramm: Kugel c wird von der Seite 'from' hineingeschoben */
  function example(title, ballC, from) {
    var r = push(START, ballC, from);
    var inArrow = h('span', { class: P + 'arrow', 'aria-hidden': 'true' }, from === 'l' ? '→' : '←');
    var outArrow = h('span', { class: P + 'arrow', 'aria-hidden': 'true' }, from === 'l' ? '→' : '←');
    var inB = h('span', { class: P + 'side' }, ball(ballC));
    var outB = h('span', { class: P + 'side' }, ball(r.out));
    var before = from === 'l' ? [inB, inArrow, tube(START)] : [tube(START), inArrow, inB];
    var after = from === 'l' ? [tube(r.tube), outArrow, outB] : [outB, outArrow, tube(r.tube)];
    return h('figure', {
      class: P + 'ex', role: 'group',
      'aria-label': title + ': Röhre vorher ' + listText(START) + '; danach ' + listText(r.tube) + '; herausgefallen: ' + NAME[r.out]
    }, h('figcaption', null, title),
      h('div', { class: P + 'exrow' }, before),
      h('div', { class: P + 'down', 'aria-hidden': 'true' }, '↓'),
      h('div', { class: P + 'exrow' }, after));
  }

  var el, api, locked, ans, mark, slotEls, noteEl;
  var sim, simTube, simOut, simLog, simBtns;

  function reset() { ans = [null, null, null]; mark = null; }
  function resetSim() { sim = { tube: START.slice(), n: 0, out: null, log: [] }; }

  function posName(i) { return ['links', 'in der Mitte', 'rechts'][i]; }
  function drawAnswer() {
    slotEls.forEach(function (b, i) {
      var c = ans[i];
      var right = mark !== null && c === ANSWER[i];
      b.className = P + 'slot' + (c ? ' filled' : '') + (mark !== null ? (right ? ' right' : ' wrong') : '');
      b.disabled = locked;
      b.setAttribute('aria-label', 'Platz ' + (i + 1) + ' (' + posName(i) + '): ' + (c ? NAME[c] + 'e Kugel' : 'leer') + (c ? '. Antippen wechselt die Farbe.' : '. Antippen legt eine Kugel hinein.') +
        (mark !== null ? (right ? ' Richtig.' : ' Falsch.') : ''));
      b.replaceChildren.apply(b, [c ? ball(c) : h('span', { class: P + 'ph', 'aria-hidden': 'true' }, '?')].concat(mark !== null ? [h('span', { class: P + 'mark', 'aria-hidden': 'true' }, right ? '✓' : '✗')] : []));
    });
  }
  function onSlot(i) {
    if (locked) return;
    ans[i] = ans[i] === 'b' ? 'w' : 'b';
    drawAnswer();
    noteEl.textContent = 'Platz ' + (i + 1) + ': ' + NAME[ans[i]] + 'e Kugel.';
    api.changed();
  }

  function drawSim() {
    simTube.replaceChildren.apply(simTube, sim.tube.map(function (c) { return h('span', { class: P + 'cell' }, ball(c)); }));
    simTube.setAttribute('aria-label', 'Probier-Röhre, von links nach rechts: ' + listText(sim.tube));
    simOut.replaceChildren(sim.out ? h('span', { class: P + 'outball' }, ball(sim.out), h('span', null, 'herausgefallen')) : h('span', { class: P + 'hint' }, 'Noch nichts herausgefallen.'));
    simLog.textContent = sim.log.length ? sim.log.slice(-4).join(' · ') : '';
  }
  function doPush(c, from) {
    var r = push(sim.tube, c, from);
    sim.tube = r.tube; sim.out = r.out; sim.n++;
    sim.log.push(sim.n + '. ' + NAME[c] + ' von ' + (from === 'l' ? 'links' : 'rechts'));
    drawSim();
    simLive.textContent = 'Röhre jetzt, von links nach rechts: ' + listText(sim.tube) + '. Herausgefallen: ' + NAME[r.out] + '.';
  }
  var simLive;

  function simBtn(c, from) {
    var txt = (c === 'b' ? 'Schwarze' : 'Weiße') + ' Kugel von ' + (from === 'l' ? 'links' : 'rechts');
    var b = h('button', { type: 'button', class: P + 'push', 'aria-label': txt + ' hineinschieben' },
      from === 'l' ? [ball(c), h('span', { 'aria-hidden': 'true' }, '→')] : [h('span', { 'aria-hidden': 'true' }, '←'), ball(c)],
      h('span', { class: P + 'pushtxt' }, from === 'l' ? 'von links' : 'von rechts'));
    b.addEventListener('click', function () { doPush(c, from); });
    return b;
  }

  Biber.register({
    id: 'roehre24',
    story:
      '<p>In eine durchsichtige Röhre passen genau drei Kugeln. Die Röhre ist an beiden Seiten offen.</p>' +
      '<p>Wenn in die volle Röhre von einer Seite eine Kugel hineingeschoben wird, fällt auf der anderen Seite eine Kugel heraus. Hier sind zwei Beispiele:</p>',
    question: 'Nun werden nacheinander vier Kugeln in die volle Röhre geschoben: zuerst eine schwarze und dann eine weiße Kugel von rechts, danach eine schwarze und dann eine weiße Kugel von links. Welche drei Kugeln sind am Ende in der Röhre?',
    howto: 'Tippe in der Antwort-Röhre auf die drei Plätze, bis die Farben stimmen. Unten kannst du alles mit der Probier-Röhre ausprobieren.',
    explanation: function () {
      return '<p>Zuerst werden von rechts eine schwarze und eine weiße Kugel hineingeschoben. Links fallen dabei zwei Kugeln heraus: erst die schwarze, dann die weiße. Danach werden von links eine schwarze und eine weiße Kugel hineingeschoben, und rechts fallen zwei Kugeln heraus: erst die weiße, dann die schwarze.</p>' +
        '<p>Am Ende liegen <strong>weiß, schwarz, schwarz</strong> (von links nach rechts) in der Röhre. Kürzer: Die Kugel, die anfangs ganz rechts lag, bleibt rechts. Links davon liegen die beiden zuletzt von links hineingeschobenen Kugeln.</p>' +
        '<p><strong>Informatik:</strong> Die Röhre ist eine <em>Deque</em> (double-ended queue, Warteschlange mit zwei Enden): An beiden Enden darf man Elemente hinzufügen und entfernen. Weil die Kapazität begrenzt ist, geht beim Hinzufügen am einen Ende am anderen Ende ein Element verloren.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset(); resetSim();
      slotEls = [0, 1, 2].map(function (i) {
        var b = h('button', { type: 'button', class: P + 'slot', 'data-i': String(i) });
        b.addEventListener('click', function () { onSlot(i); });
        return b;
      });
      noteEl = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      simTube = h('div', { class: P + 'tube', role: 'img' });
      simOut = h('div', { class: P + 'outbox' });
      simLog = h('p', { class: P + 'log' });
      simLive = h('p', { class: P + 'sr', role: 'status', 'aria-live': 'polite' });
      var seq = h('ol', { class: P + 'seq', 'aria-label': 'Die vier Kugeln der Reihe nach' }, STEPS.map(function (s) {
        return h('li', { class: P + 'step', 'aria-label': NAME[s.ball] + ' von ' + (s.from === 'l' ? 'links' : 'rechts') },
          s.from === 'l' ? [ball(s.ball), h('span', { class: P + 'arrow', 'aria-hidden': 'true' }, '→')] : [h('span', { class: P + 'arrow', 'aria-hidden': 'true' }, '←'), ball(s.ball)],
          h('span', { class: P + 'steptxt' }, s.from === 'l' ? 'von links' : 'von rechts'));
      }));
      var resetBtn = h('button', { type: 'button', class: P + 'restart' }, 'Neu starten');
      resetBtn.addEventListener('click', function () { resetSim(); drawSim(); simLive.textContent = 'Probier-Röhre zurückgesetzt: ' + listText(sim.tube) + '.'; });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('div', { class: P + 'examples' }, example('Weiße Kugel von links', 'w', 'l'), example('Schwarze Kugel von rechts', 'b', 'r')),
        h('div', { class: P + 'row' }, h('p', { class: P + 'lab' }, 'Die Röhre ist voll:'), tube(START)),
        h('div', { class: P + 'row' }, h('p', { class: P + 'lab' }, 'Der Reihe nach werden diese Kugeln hineingeschoben:'), seq),
        h('div', { class: P + 'row ' + P + 'answer' }, h('p', { class: P + 'lab' }, 'Am Ende in der Röhre (von links nach rechts):'),
          h('div', { class: P + 'tube ' + P + 'ans', role: 'group', 'aria-label': 'Antwort-Röhre mit drei Plätzen' }, slotEls.map(function (b) { return h('span', { class: P + 'cell' }, b); })),
          noteEl),
        h('details', { class: P + 'sim' }, h('summary', null, 'Zum Ausprobieren: Probier-Röhre'),
          h('div', { class: P + 'simbody' },
            h('p', { class: P + 'lab' }, 'Die Probier-Röhre beginnt mit der vollen Röhre von oben. Schiebe Kugeln hinein und schau, was passiert.'),
            h('div', { class: P + 'simrow' }, simTube, simOut),
            h('div', { class: P + 'pushes' }, simBtn('b', 'l'), simBtn('w', 'l'), simBtn('b', 'r'), simBtn('w', 'r')),
            simLog, resetBtn, simLive))));
      drawAnswer(); drawSim();
    },
    isComplete: function () { return ans.every(Boolean); },
    evaluate: function () {
      return { correct: ANSWER.every(function (c, i) { return ans[i] === c; }), answer: ans.slice() };
    },
    setAnswer: function (a) {
      ans = Array.isArray(a) ? a.slice(0, 3) : [null, null, null];
      mark = 'check'; drawAnswer();
    },
    lock: function (on) {
      locked = on; mark = on ? 'check' : null;
      noteEl.textContent = on ? (ANSWER.every(function (c, i) { return ans[i] === c; }) ? 'Alle drei Kugeln stimmen.' : 'Markiert ist, welche Plätze stimmen.') : '';
      drawAnswer();
    },
    reset: function () { reset(); resetSim(); drawAnswer(); drawSim(); noteEl.textContent = ''; },
    showSolution: function () {
      ans = ANSWER.slice(); mark = 'check'; locked = true; drawAnswer();
      noteEl.textContent = 'Lösung: weiß, schwarz, schwarz.';
    }
  });
})();
