/* Aufgabe Flaggen am Strand (Heft 2016, Klasse 3-4 mittel, 5-6 einfach): Codierung, Bedeutung, Unicode */
(function () {
  'use strict';
  var h = Biber.h;
  var S = Biber.svg;

  /* Flaggen exakt nach dem Heft: Größe 72 x 50,6, Formen in Weiß */
  var FW = 72, FH = 50.6;
  var FLAGS = {
    richard: { label: 'blaue Flagge mit weißem Kreis', bg: 'blue', shapes: [{ t: 'circle', cx: 35.7, cy: 25.1, r: 16.3 }] },
    beatrix: { label: 'rote Flagge mit weißem Quadrat', bg: 'red', shapes: [{ t: 'rect', x: 22.1, y: 11.5, w: 27.2, h: 27.2 }] },
    beide: {
      label: 'links blau mit kleinem weißen Kreis, rechts rot mit kleinem weißen Quadrat', bg: 'half',
      shapes: [{ t: 'circle', cx: 17.8, cy: 25.1, r: 9.5 }, { t: 'rect', x: 44, y: 15.5, w: 19.1, h: 19.1 }]
    },
    essen: { label: 'grüne Flagge mit weißem Dreieck', bg: 'green', shapes: [{ t: 'poly', p: '53.4,41.6 18,41.4 35.2,8.6' }] },
    trinken: {
      label: 'gelbe Flagge mit weißem Stern', bg: 'yellow',
      shapes: [{ t: 'poly', p: '52,28.4 39.3,28.5 36.1,40.8 32,28.8 19.4,29.4 29.5,21.9 25,10 35.3,17.4 45.1,9.4 41.4,21.5' }]
    },
    eile: { label: 'rote Flagge mit weißem Quadrat', bg: 'red', shapes: [{ t: 'rect', x: 22.1, y: 11.5, w: 27.2, h: 27.2 }] },
    ruhe: { label: 'graue Flagge mit weißem Fünfeck', bg: 'gray', shapes: [{ t: 'poly', p: '51.8,20.2 35.6,8.6 19.5,20.4 25.8,39.4 45.8,39.2' }] }
  };

  function flagParts(key, x, y) {
    var f = FLAGS[key];
    var parts = [];
    if (f.bg === 'half') {
      parts.push(S('rect', { x: x, y: y, width: 35.65, height: FH, class: 't-flag16-blue' }));
      parts.push(S('rect', { x: x + 35.65, y: y, width: 36.35, height: FH, class: 't-flag16-red' }));
    } else parts.push(S('rect', { x: x, y: y, width: FW, height: FH, class: 't-flag16-' + f.bg }));
    f.shapes.forEach(function (s) {
      if (s.t === 'circle') parts.push(S('circle', { cx: x + s.cx, cy: y + s.cy, r: s.r, class: 't-flag16-white' }));
      else if (s.t === 'rect') parts.push(S('rect', { x: x + s.x, y: y + s.y, width: s.w, height: s.h, class: 't-flag16-white' }));
      else {
        var pts = s.p.split(' ').map(function (q) { var c = q.split(','); return (x + +c[0]).toFixed(2) + ',' + (y + +c[1]).toFixed(2); }).join(' ');
        parts.push(S('polygon', { points: pts, class: 't-flag16-white' }));
      }
    });
    return parts;
  }
  function flagSvg(key, cls) {
    var svg = S('svg', { viewBox: '0 0 ' + FW + ' ' + FH, class: cls || 't-flag16-flag', role: 'img', 'aria-label': FLAGS[key].label });
    flagParts(key, 0, 0).forEach(function (p) { svg.appendChild(p); });
    return svg;
  }

  /* Die Stange in der Aufgabe: blau/Kreis, grün/Dreieck, rot/Quadrat */
  var POLE = { top: 'richard', mid: 'essen', low: 'eile' };

  var OPTIONS = [
    { k: 'A', who: 'beatrix', what: 'essen', how: 'eile', text: 'Beatrix, es gibt etwas zu essen, beeile dich!' },
    { k: 'B', who: 'richard', what: 'essen', how: 'eile', text: 'Richard, es gibt etwas zu essen, beeile dich!' },
    { k: 'C', who: 'beide', what: 'trinken', how: 'ruhe', text: 'Richard und Beatrix, es gibt etwas zu trinken, ihr könnt euch Zeit lassen!' },
    { k: 'D', who: 'beatrix', what: 'trinken', how: 'ruhe', text: 'Beatrix, es gibt etwas zu trinken, du kannst dir Zeit lassen!' }
  ];
  var RIGHT = OPTIONS.filter(function (o) { return o.who === POLE.top && o.what === POLE.mid && o.how === POLE.low; })[0].k;

  function poleSvg() {
    var svg = S('svg', {
      viewBox: '0 0 150 235', class: 't-flag16-pole', role: 'img',
      'aria-label': 'Fahnenstange mit drei Flaggen: oben blau mit weißem Kreis, in der Mitte grün mit weißem Dreieck, unten rot mit weißem Quadrat'
    });
    svg.appendChild(S('path', { d: 'M8 226 C 22 214 36 206 56 212 C 66 205 90 205 100 212 C 118 205 134 214 142 226 Z', class: 't-flag16-sand' }));
    svg.appendChild(S('path', { d: 'M52 214 L 50 205 L 54 212 L 56 203 L 58 212 L 62 204 L 61 214 Z', class: 't-flag16-grass' }));
    svg.appendChild(S('rect', { x: 55, y: 14, width: 7, height: 200, class: 't-flag16-stange' }));
    svg.appendChild(S('circle', { cx: 58.5, cy: 12, r: 8, class: 't-flag16-knauf' }));
    var ys = [20, 76, 132];
    ['top', 'mid', 'low'].forEach(function (pos, i) {
      flagParts(POLE[pos], 62, ys[i]).forEach(function (p) { svg.appendChild(p); });
    });
    return svg;
  }

  var el, api, locked, picked, mode, optsEl;

  function renderOpts() {
    var kids = OPTIONS.map(function (o) {
      var sel = picked === o.k;
      var cls = 't-flag16-opt';
      var mark = null;
      if (mode && (mode === 'solution' ? o.k === RIGHT : sel)) {
        var ok = o.k === RIGHT;
        cls += ok ? ' right' : ' wrong';
        mark = h('span', { class: 't-flag16-mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      }
      var input = h('input', { type: 'radio', name: 't-flag16-opt', value: o.k, disabled: locked, 'aria-label': 'Antwort ' + o.k + ': ' + o.text });
      input.checked = sel;
      return h('label', { class: cls }, input,
        h('span', { class: 't-flag16-card' },
          h('span', { class: 't-flag16-let' }, o.k + ')'),
          h('span', { class: 't-flag16-txt' }, o.text),
          mark));
    });
    optsEl.replaceChildren.apply(optsEl, kids);
  }

  function legendRow(title, items) {
    return h('section', { class: 't-flag16-leg', 'aria-label': title },
      h('h3', null, title),
      h('ul', null, items.map(function (it) {
        return h('li', null, flagSvg(it[0]), h('span', null, it[1]));
      })));
  }

  function onChange(e) {
    if (locked || !e.target.matches('input[type=radio]')) return;
    picked = e.target.value;
    renderOpts();
    var f = optsEl.querySelector('input:checked');
    if (f) f.focus();
    api.changed('Antwort ' + picked + ' gewählt.');
  }

  Biber.register({
    id: 'flaggenamstrand16',
    story: '<p>Albert ist Rettungsschwimmer und am Strand auf Posten. Seine Kinder Beatrix und Richard spielen weiter weg. ' +
      'Das Meer rauscht, der Wind übertönt alles Rufen und die Mobiltelefone finden kein Netz. ' +
      'Um doch mit den Kindern kommunizieren zu können, verwendet Albert eine Stange mit drei Positionen für farbige Flaggen.</p>',
    question: 'Was bedeutet es, wenn diese Flaggen so an der Stange hängen?',
    howto: 'Lies in den Tabellen nach, was die Flaggen an den drei Positionen bedeuten, und wähle dann die passende Antwort.',
    explanation: function () {
      return '<p>Jede Flagge hat eine Bedeutung, die von ihrer <b>Position</b> abhängt. Oben hängt die blaue Flagge mit dem Kreis: Die Nachricht ist für <b>Richard</b>. ' +
        'In der Mitte hängt die grüne Flagge mit dem Dreieck: Es gibt etwas zu <b>essen</b>. Unten hängt die rote Flagge mit dem Quadrat: Richard soll sich <b>beeilen</b>. ' +
        'Richtig ist also Antwort B. Achtung: Die rote Flagge mit dem Quadrat oben würde „Beatrix“ bedeuten, unten aber „Beeile dich“. Die Position gehört zum Code dazu.</p>' +
        '<p><b>Informatik:</b> Hier werden mehrteilige Nachrichten mit Flaggen <i>codiert</i>: Farbe, Zeichen und Position der Flagge legen die Bedeutung fest. ' +
        'Damit Sender und Empfänger sich verstehen, müssen beide denselben Code kennen. Für Text gibt es dafür einen weltweiten Standard, den <i>Unicode</i>. ' +
        'Er umfasst die Schriftzeichen fast aller Sprachen und auch Symbole wie Emojis; das Zeichen „U+1F60A“ bedeutet zum Beispiel „lächelndes Gesicht mit lächelnden Augen“.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; picked = null; mode = null;
      optsEl = h('div', { class: 't-flag16-opts', role: 'radiogroup', 'aria-label': 'Antworten' });
      el.replaceChildren(h('div', { class: 't-flag16-box' },
        h('div', { class: 't-flag16-top' },
          h('div', { class: 't-flag16-legs' },
            legendRow('Die obere Flagge kann bedeuten:', [
              ['richard', 'Die Nachricht ist für Richard.'],
              ['beatrix', 'Die Nachricht ist für Beatrix.'],
              ['beide', 'Die Nachricht ist für Richard und Beatrix.']]),
            legendRow('Die mittlere Flagge kann bedeuten:', [
              ['essen', 'Es gibt etwas zu essen.'],
              ['trinken', 'Es gibt etwas zu trinken.']]),
            legendRow('Die untere Flagge kann bedeuten:', [
              ['eile', 'Beeile dich!'],
              ['ruhe', 'Du kannst dir Zeit lassen!']])),
          h('figure', { class: 't-flag16-fig' }, poleSvg(), h('figcaption', null, 'Albert hat diese Flaggen gehisst.'))),
        optsEl));
      optsEl.addEventListener('change', onChange);
      renderOpts();
    },
    isComplete: function () { return picked !== null; },
    evaluate: function () { return { correct: picked === RIGHT, answer: picked }; },
    setAnswer: function (ans) {
      picked = OPTIONS.some(function (o) { return o.k === ans; }) ? ans : null;
      mode = 'check';
      renderOpts();
    },
    lock: function (on) {
      locked = on;
      mode = on ? (mode || 'check') : null;
      renderOpts();
    },
    reset: function () { picked = null; mode = null; renderOpts(); },
    showSolution: function () { picked = RIGHT; mode = 'solution'; locked = true; renderOpts(); }
  });
})();
