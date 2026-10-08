/* Aufgabe Im Park (Heft 2024, Klasse 3-4, einfach): Welcher Weg führt rückwärts an den gesehenen Dingen vorbei (Stapel, last in - first out)? */
(function () {
  'use strict';
  var h = Biber.h;
  var A = 'assets/impark24/';

  /* Wege von der Statue nach außen (Reihenfolge der Dinge laut offiziellem Heft, S. 35/36).
     Koordinaten in der Karte (viewBox 1500 x 618), Marker am äußeren Ende. */
  var WAYS = [
    { id: 'A', name: 'oben links', things: ['blau', 'brunnen'], mx: 85, my: 122,
      pts: '705,345 660,285 600,238 520,225 440,235 360,241 300,225 250,196 170,150 110,126 66,122' },
    { id: 'B', name: 'oben rechts', things: ['nest', 'brunnen', 'blau'], mx: 1425, my: 128,
      pts: '830,365 880,320 935,282 975,245 1005,200 1050,160 1120,135 1200,106 1265,100 1330,115 1400,125 1478,138' },
    { id: 'C', name: 'unten links', things: ['blau', 'brunnen', 'nest'], mx: 70, my: 462,
      pts: '705,395 650,410 595,420 520,455 440,480 330,490 250,486 150,476 60,466 4,456' },
    { id: 'D', name: 'unten rechts', things: ['nest', 'brunnen', 'weiss'], mx: 1432, my: 428,
      pts: '830,395 900,425 960,440 1020,435 1100,420 1180,425 1250,440 1330,455 1400,442 1496,414' }
  ];
  var RIGHT = 'B';
  var VW = 1500, VH = 618;

  var el, api, locked, chosen, mode;

  function way(id) { return WAYS.filter(function (w) { return w.id === id; })[0]; }
  function reset() { chosen = null; mode = null; }

  function svg(tag, attrs) {
    var n = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  function pick(id) {
    if (locked) return;
    chosen = chosen === id ? null : id;
    render();
    api.changed(chosen ? 'Du hast Weg ' + chosen + ' gewählt.' : '');
  }

  function render() {
    var routes = svg('svg', { class: 't-impark24-routes', viewBox: '0 0 ' + VW + ' ' + VH, 'aria-hidden': 'true', focusable: 'false' });
    WAYS.forEach(function (w) {
      var sel = chosen === w.id;
      var cls = 't-impark24-route' + (sel ? ' sel' : '');
      if (sel && mode) cls += chosen === RIGHT ? ' right' : ' wrong';
      if (mode === 'solution' && w.id === RIGHT) cls = 't-impark24-route sel right';
      var line = svg('polyline', { class: cls, points: w.pts, 'data-way': w.id });
      var hit = svg('polyline', { class: 't-impark24-hit', points: w.pts, 'data-way': w.id });
      routes.appendChild(line);
      routes.appendChild(hit);
    });

    var btns = WAYS.map(function (w) {
      var sel = chosen === w.id;
      var cls = 't-impark24-btn' + (sel ? ' sel' : '');
      var mark = '';
      if (mode && (sel || (mode === 'solution' && w.id === RIGHT))) {
        var ok = w.id === RIGHT;
        cls += ok ? ' right' : ' wrong';
        mark = ok ? '✓' : '✗';
      }
      return h('button', {
        type: 'button', class: cls, 'data-way': w.id, disabled: locked, 'aria-pressed': String(sel),
        style: 'left:' + (w.mx / VW * 100).toFixed(2) + '%;top:' + (w.my / VH * 100).toFixed(2) + '%',
        'aria-label': 'Weg ' + w.id + ' (' + w.name + ')' + (sel ? ', gewählt' : '')
      }, h('span', { 'aria-hidden': 'true' }, w.id + (mark ? ' ' + mark : '')));
    });

    var info = chosen
      ? 'Gewählt: Weg ' + chosen + ' (' + way(chosen).name + ')'
      : 'Tippe auf einen der vier Wege A bis D.';
    el.replaceChildren(h('div', { class: 't-impark24' },
      h('div', { class: 't-impark24-map' },
        h('img', {
          src: A + 'map.png', width: 1200, height: 494, draggable: 'false',
          alt: 'Karte des Parks. In der Mitte steht die Biberstatue. Von dort führen vier Wege nach außen: Weg A nach links oben, Weg B nach rechts oben, Weg C nach links unten und Weg D nach rechts unten. An den Wegen stehen Blumen, Brunnen, Bäume und Büsche, in manchen Bäumen und Büschen sind Vogelnester.'
        }),
        routes, btns),
      h('p', { class: 't-impark24-info', 'aria-live': 'polite' }, info)));
  }

  function onClick(e) {
    var t = e.target.closest('[data-way]');
    if (!t || locked) return;
    pick(t.getAttribute('data-way'));
  }

  Biber.register({
    id: 'impark24',
    story: '<p>Alia ist bei der Biberstatue im Park. Auf ihrem Weg dorthin hat sie einige Dinge gesehen:</p>' +
      '<ol class="t-impark24-seen">' +
      '<li><img src="' + A + 'blumen.png" width="45" height="55" alt="Blaue Blumen"><span>Zuerst hat sie <b>blaue Blumen</b> gesehen.</span></li>' +
      '<li><img src="' + A + 'brunnen.png" width="30" height="60" alt="Brunnen"><span>Danach hat sie einen <b>Brunnen</b> gesehen.</span></li>' +
      '<li><img src="' + A + 'nest.png" width="45" height="60" alt="Vogelnest"><span>Zuletzt hat sie ein <b>Nest</b> entdeckt.</span></li>' +
      '</ol>',
    question: 'Auf welchem Weg ist Alia zur Biberstatue gegangen?',
    howto: 'Tippe auf den Buchstaben am Ende eines Weges (oder auf den Weg selbst), um ihn zu wählen. Dann kannst du prüfen.',
    explanation: function () {
      return '<p>Auf dem Hinweg hat Alia zuerst die blauen Blumen, dann den Brunnen und zuletzt das Nest gesehen. ' +
        'Von der Statue aus gesehen muss man diese Dinge also in <b>umgekehrter Reihenfolge</b> antreffen: erst das Nest, dann den Brunnen, dann die blauen Blumen.</p>' +
        '<ul><li>Weg A: Hier gibt es kein Nest.</li>' +
        '<li>Weg C: Die Dinge kommen in der falschen Reihenfolge (zuerst Blumen, am Ende das Nest).</li>' +
        '<li>Weg D: Die Blumen am Ende sind weiß, nicht blau.</li>' +
        '<li>Weg B passt: Nest, Brunnen, blaue Blumen.</li></ul>' +
        '<p><b>Informatik:</b> Alia kann sich die Dinge wie auf einem Stapel (englisch <i>Stack</i>) merken. Was zuletzt oben auf den Stapel gelegt wurde, nimmt sie auf dem Rückweg zuerst wieder herunter: ' +
        '„last in, first out“ (LIFO). Computer nutzen Stapel zum Beispiel, um Spielzüge Schritt für Schritt rückgängig zu machen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      render();
    },
    isComplete: function () { return !!chosen; },
    evaluate: function () { return { correct: chosen === RIGHT, answer: chosen }; },
    setAnswer: function (ans) {
      chosen = ans || null;
      mode = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mode = on ? (mode || 'check') : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      chosen = RIGHT;
      mode = 'solution';
      locked = true;
      render();
    }
  });
})();
