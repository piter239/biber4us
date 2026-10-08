/* Aufgabe Superbebras (Klasse 5-10): Kachelfolgen und Übergangsdiagramm (gerichteter Graph / Automat) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-superbebras24';

  /* ---------- Kacheln und Diagramm ---------- */
  var TILES = {
    n: { name: 'normale Kachel' },
    d: { name: 'Kachel mit Diamant' },
    m: { name: 'Kachel mit Mauer' },
    l: { name: 'Kachel mit Loch' }
  };
  /* Pfeile des Diagramms: von -> Liste der erlaubten Nachfolger */
  var ARROWS = { n: ['n', 'd', 'm', 'l'], d: ['n'], m: ['n', 'm'], l: ['n'] };
  function allowed(a, b) { return ARROWS[a].indexOf(b) >= 0; }
  function valid(seq) {
    for (var i = 0; i + 1 < seq.length; i++) if (!allowed(seq[i], seq[i + 1])) return false;
    return true;
  }
  function firstBad(seq) {
    for (var i = 0; i + 1 < seq.length; i++) if (!allowed(seq[i], seq[i + 1])) return i;
    return -1;
  }

  /* Bilder A-D wie im Heft (6 Kacheln von links nach rechts) */
  var OPTIONS = [
    { key: 'A', seq: 'ndnmmn'.split('') },
    { key: 'B', seq: 'nlnnmm'.split('') },
    { key: 'C', seq: 'dndmnl'.split('') },
    { key: 'D', seq: 'mmmmmm'.split('') }
  ];
  var RIGHT = (function () {
    var idx = -1, bad = 0;
    OPTIONS.forEach(function (o, i) { if (!valid(o.seq)) { idx = i; bad++; } });
    return bad === 1 ? idx : -1;
  })();

  /* ---------- Zeichnen ---------- */
  var SKY = '#33ccff', GRASS = '#316b00', BRICK = '#b5532d', MORTAR = '#2b1608';
  function tileInner(t, x, y) {
    var s = '<g transform="translate(' + x + ' ' + y + ')">' +
      '<rect width="40" height="100" fill="' + SKY + '"/>';
    if (t === 'l') s += '<rect y="72" width="10" height="28" fill="' + GRASS + '"/><rect x="30" y="72" width="10" height="28" fill="' + GRASS + '"/>';
    else s += '<rect y="72" width="40" height="28" fill="' + GRASS + '"/>';
    if (t === 'm') {
      s += '<rect y="38" width="40" height="11" fill="' + BRICK + '" stroke="' + MORTAR + '" stroke-width="0.8"/>' +
        '<path d="M0 43.5h40M10 38v5.5M30 38v5.5M20 43.5V49" stroke="' + MORTAR + '" stroke-width="0.8" fill="none"/>';
    }
    if (t === 'd') {
      s += '<path d="M20 11l9 11-9 11-9-11z" fill="#8e3b93"/><path d="M20 11l9 11H11z" fill="#b567b9"/><path d="M20 33l9-11H20z" fill="#6a2570"/>';
    }
    return s + '</g>';
  }
  function tileSvg(t, cls) {
    return '<svg class="' + cls + '" viewBox="0 0 40 100" role="img" aria-label="' + TILES[t].name + '" focusable="false">' + tileInner(t, 0, 0) + '</svg>';
  }
  var GAP = 1.5;
  function stripInner(seq, y) {
    return seq.map(function (t, i) { return tileInner(t, i * (40 + GAP), y || 0); }).join('');
  }
  function stripW(n) { return n * (40 + GAP) - GAP; }
  function seqLabel(seq) { return seq.map(function (t) { return TILES[t].name.replace(' mit ', ' mit '); }).join(', '); }
  function stripSvg(seq, cls, label) {
    return '<svg class="' + cls + '" viewBox="0 0 ' + stripW(seq.length) + ' 100" role="img" aria-label="' + label + '" focusable="false">' + stripInner(seq) + '</svg>';
  }

  function diagramSvg() {
    var id = P + '-ah';
    var ar = function (d) { return '<path class="' + P + '-arrow" d="' + d + '" marker-end="url(#' + id + ')"/>'; };
    return '<svg class="' + P + '-diagram" viewBox="0 -14 330 316" role="img" aria-label="Diagramm der erlaubten Übergänge: Nach einer Kachel mit Diamant folgt nur die normale Kachel. ' +
      'Nach der normalen Kachel kann jede Kachel folgen, auch wieder die normale. Nach einer Kachel mit Mauer folgt die normale Kachel oder wieder eine Kachel mit Mauer. ' +
      'Nach einer Kachel mit Loch folgt nur die normale Kachel." focusable="false">' +
      '<defs><marker id="' + id + '" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="' + P + '-head" d="M0 0L10 5L0 10z"/></marker></defs>' +
      tileInner('d', 20, 30) + tileInner('n', 145, 30) + tileInner('m', 270, 30) + tileInner('l', 145, 190) +
      ar('M141 62H68') + ar('M68 98H141') +
      ar('M266 62H193') + ar('M193 98H266') +
      ar('M158 134V184') + ar('M172 184V134') +
      ar('M178 28C198 -14 142 -14 162 24') + ar('M303 28C323 -14 267 -14 287 24') +
      '</svg>';
  }

  function storyHtml() {
    var inl = function (t) { return tileSvg(t, P + '-inl'); };
    return '<p>Im Computerspiel „Superbebras“ besteht der Hintergrund aus einer Folge von Kacheln. Der Computer fügt ständig eine neue Kachel auf der rechten Seite der Folge hinzu und entfernt gleichzeitig eine Kachel auf der linken Seite. Das sieht dann wie eine Bewegung aus.</p>' +
      '<svg class="' + P + '-intro" viewBox="0 0 345 100" role="img" aria-label="Eine Folge aus sechs Kacheln. Rechts daneben kommt eine neue Kachel mit Mauer hinzu." focusable="false">' +
      stripInner(['n', 'd', 'n', 'n', 'l', 'n']) + tileInner('m', 305, 0) +
      '<path class="' + P + '-arrow" d="M296 52H262" marker-end="url(#' + P + '-ah2)"/>' +
      '<defs><marker id="' + P + '-ah2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path class="' + P + '-head" d="M0 0L10 5L0 10z"/></marker></defs>' +
      '</svg>' +
      '<p>Um die nächste neue Kachel auszuwählen, verwendet der Computer das Diagramm unten. Im Diagramm sucht er die vorige neue Kachel (auf der rechten Seite) und die Pfeile, die davon ausgehen. Dann wählt er zufällig eine Kachel aus, auf die einer dieser Pfeile zeigt.</p>' +
      '<div class="' + P + '-diawrap">' + diagramSvg() + '</div>' +
      '<p class="' + P + '-ex">Zum Beispiel kann der Computer nach der Kachel ' + inl('m') + ' entweder wieder die Kachel ' + inl('m') + ' oder die Kachel ' + inl('n') + ' auswählen.</p>' +
      '<p>In einem Superbebras-Hintergrund muss also die Reihenfolge der Kacheln zu diesem Diagramm passen.</p>';
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
    id: 'superbebras24',
    story: storyHtml(),
    question: 'Eines dieser Bilder ist KEIN Superbebras-Hintergrund. Welches?',
    howto: 'Gehe die Kacheln eines Bildes von links nach rechts durch und suche im Diagramm den passenden Pfeil. Tippe dann das Bild an, das nicht passt.',
    explanation: function () {
      var o = OPTIONS[RIGHT], i = firstBad(o.seq);
      var x0 = i * (40 + GAP) - 3, w = 2 * 40 + GAP + 6;
      var proof = '<svg class="' + P + '-proof" viewBox="-4 -4 ' + (stripW(o.seq.length) + 8) + ' 108" role="img" aria-label="Bild ' + o.key + ': Auf die Kachel mit Diamant (dritte Kachel) folgt eine Kachel mit Mauer, das ist nicht erlaubt." focusable="false">' +
        stripInner(o.seq) +
        '<rect class="' + P + '-hl" x="' + x0 + '" y="-3" width="' + w + '" height="106" rx="4"/>' +
        '<path class="' + P + '-x" d="M' + (x0 + w / 2 - 8) + ' 52l16 16m0-16l-16 16"/></svg>';
      return '<p>Das Bild <strong>' + o.key + '</strong> passt nicht zum Diagramm. Auf eine Kachel mit Diamant darf nur eine normale Kachel folgen. ' +
        'In Bild ' + o.key + ' folgt aber auf die Diamant-Kachel eine Kachel mit Mauer:</p>' + proof +
        '<p>Bei den Bildern A, B und D gibt es für jedes Paar nebeneinanderliegender Kacheln einen Pfeil im Diagramm, sie sind also mögliche Hintergründe. ' +
        'Man prüft das, indem man die Kacheln von links nach rechts durchgeht.</p>' +
        '<p>Ein Diagramm aus Objekten und Pfeilen nennt die Informatik einen <em>gerichteten Graphen</em>. Mit zusätzlich einem Startzustand und besonderen Endzuständen wird daraus ein <em>endlicher Automat</em>. ' +
        'Solche Regeln nutzen Spiele, um Hintergründe automatisch und trotzdem sinnvoll zu erzeugen (prozedurale Generierung).</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      radios = OPTIONS.map(function (o, i) {
        var label = 'Bild ' + o.key + ': ' + seqLabel(o.seq);
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + '-opt', 'data-opt': o.key, 'aria-label': label,
          onclick: function () { choose(i, false); }, onkeydown: onKey
        });
        btn.innerHTML = '<span class="' + P + '-key" aria-hidden="true">' + o.key + ')</span>' + stripSvg(o.seq, P + '-strip', label).replace(' role="img"', ' aria-hidden="true"').replace(/ aria-label="[^"]*"/, '');
        return btn;
      });
      el.replaceChildren(h('div', { class: P + '-board', role: 'radiogroup', 'aria-label': 'Bilder A bis D' }, radios));
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
