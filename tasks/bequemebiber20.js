/* Aufgabe Bequeme Biber (Biber 2020; Klasse 7-8 leicht): Gray-Code, Häuser mit drei Flaggen so tauschen, dass sich beim Zeitwechsel nur eine Flagge ändert */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-bequemebiber20-';
  var NS = 'http://www.w3.org/2000/svg';

  /* Flaggenmuster als Zeichenkette (links, Mitte, rechts); 0 = rotes Quadrat, 1 = blaues Dreieck.
     Anfangszustand von 0-3 Uhr bis 21-24 Uhr (aus der Abbildung im Heft gelesen). */
  var START = ['111', '011', '001', '101', '100', '110', '010', '000'];
  /* Heft-Lösung: Das Haus von 15-18 Uhr (110) wird mit dem von 21-24 Uhr (000) getauscht. */
  var SOLUTION = ['111', '011', '001', '101', '100', '000', '010', '110'];
  var N = 8;

  function diff(a, b) {
    var d = 0, i;
    for (i = 0; i < 3; i++) if (a.charAt(i) !== b.charAt(i)) d++;
    return d;
  }
  function transitions(arr) {   /* Anzahl geänderter Flaggen bei jedem Übergang i -> i+1 (der letzte Übergang ist der um Mitternacht) */
    return arr.map(function (p, i) { return diff(p, arr[(i + 1) % N]); });
  }
  function isGood(arr) { return transitions(arr).every(function (d) { return d === 1; }); }
  function hourLabel(i) { return (i * 3) + '–' + (i * 3 + 3) + ' Uhr'; }
  function flagWord(c) { return c === '0' ? 'rotes Quadrat' : 'blaues Dreieck'; }
  function patLabel(p) { return 'links ' + flagWord(p.charAt(0)) + ', Mitte ' + flagWord(p.charAt(1)) + ', rechts ' + flagWord(p.charAt(2)); }

  /* ---------- Zeichnungen ---------- */
  function houseSvg(p) {
    var apex = [[26, 16], [50, 5], [74, 16]], flags = '', i;
    for (i = 0; i < 3; i++) {
      var ax = apex[i][0], ay = apex[i][1];
      flags += p.charAt(i) === '0'
        ? '<rect class="' + P + 'fred" x="' + (ax + 0.5) + '" y="' + (ay - 2) + '" width="13" height="10" rx="1"/>'
        : '<polygon class="' + P + 'fblue" points="' + (ax + 0.5) + ',' + (ay - 3) + ' ' + (ax + 15) + ',' + (ay + 3) + ' ' + (ax + 0.5) + ',' + (ay + 9) + '"/>';
    }
    return '<svg class="' + P + 'house" viewBox="0 -4 100 96" aria-hidden="true" focusable="false">' +
      '<polygon fill="#3a3236" points="20,50 26,16 32,50"/><polygon fill="#3a3236" points="41,54 50,5 59,54"/><polygon fill="#3a3236" points="68,50 74,16 80,50"/>' +
      '<polygon fill="#6b4a3c" points="5,42 15,28 85,28 95,42"/>' +
      '<rect x="8" y="42" width="84" height="20" fill="#8a3a14"/>' +
      '<g stroke="#5a2408" stroke-width="1.2"><line x1="22" y1="42" x2="22" y2="62"/><line x1="36" y1="42" x2="36" y2="62"/><line x1="64" y1="42" x2="64" y2="62"/><line x1="78" y1="42" x2="78" y2="62"/></g>' +
      '<rect x="12" y="62" width="76" height="24" fill="#e3b090"/>' +
      '<path d="M42 86 V72 Q50 62 58 72 V86 Z" fill="#1d1618"/><rect x="38" y="85" width="24" height="3" fill="#7a3a12"/>' +
      '<path d="M16 86 V77 Q21 71 26 77 V86 Z" fill="#9a4a1a"/><path d="M74 86 V77 Q79 71 84 77 V86 Z" fill="#9a4a1a"/>' +
      flags + '</svg>';
  }
  var CX = 100, CY = 100, R = 98;
  function pol(r, deg) { var a = deg * Math.PI / 180; return [CX + r * Math.sin(a), CY - r * Math.cos(a)]; }
  function f1(v) { return Math.round(v * 10) / 10; }
  function wheelSvg() {
    var s = '<svg class="' + P + 'wheelsvg" viewBox="0 0 200 200" aria-hidden="true" focusable="false">', i, a, b;
    for (i = 0; i < N; i++) {
      a = pol(R, i * 45); b = pol(R, (i + 1) * 45);
      s += '<path class="' + P + (i % 2 ? 'secB' : 'secA') + '" d="M100 100 L' + f1(a[0]) + ' ' + f1(a[1]) + ' A' + R + ' ' + R + ' 0 0 1 ' + f1(b[0]) + ' ' + f1(b[1]) + ' Z"/>';
    }
    /* Uhr in der Mitte */
    s += '<circle class="' + P + 'clockring" cx="100" cy="100" r="37"/><circle class="' + P + 'clockface" cx="100" cy="100" r="34"/>';
    for (i = 0; i < 24; i++) {
      a = pol(34, i * 15); b = pol(i % 3 === 0 ? 29 : 31.5, i * 15);
      s += '<line class="' + P + 'tick" x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(b[0]) + '" y2="' + f1(b[1]) + '"/>';
    }
    for (i = 0; i < N; i++) {
      a = pol(22.5, i * 45);
      s += '<text class="' + P + 'clocknum" x="' + f1(a[0]) + '" y="' + f1(a[1]) + '" text-anchor="middle" dominant-baseline="central">' + (i === 0 ? 24 : i * 3) + '</text>';
    }
    s += '<circle cx="100" cy="100" r="2.6" fill="#6b4a3c"/></svg>';
    return s;
  }
  var HOUSE_R = 69;
  function overlaySvg(arr, mark) {
    var d = transitions(arr), s = '<svg class="' + P + 'overlay" viewBox="0 0 200 200" aria-hidden="true" focusable="false">', i;
    for (i = 0; i < N; i++) {
      var q = pol(47, (i + 1) * 45), ok = d[i] === 1;
      s += '<g class="' + P + 'badge ' + (ok ? P + 'okb' : P + 'badb') + '"><circle cx="' + f1(q[0]) + '" cy="' + f1(q[1]) + '" r="5.6"/>' +
        '<text x="' + f1(q[0]) + '" y="' + f1(q[1]) + '" text-anchor="middle" dominant-baseline="central">' + d[i] + '</text></g>';
    }
    for (i = 0; i < N; i++) {
      var t = pol(92, i * 45 + 22.5);
      s += '<text class="' + P + 'hourlab" x="' + f1(t[0]) + '" y="' + f1(t[1]) + '" text-anchor="middle" dominant-baseline="central">' + (i * 3) + '–' + (i * 3 + 3) + '</text>';
    }
    return s + '</svg>';
  }

  /* ---------- Zustand ---------- */
  var el, api, arr, sel, locked, mark, moves, wheel, overlayHost, houses, statusEl, countEl;

  function reset() { arr = START.slice(); sel = null; mark = null; moves = 0; }

  function swap(i, j) {
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  function describeSel() {
    return sel === null ? '' : 'Das Haus von ' + hourLabel(sel) + ' ist gewählt. Tippe auf ein zweites Haus, um die beiden zu tauschen.';
  }
  function refresh(msg) {
    var d = transitions(arr), good = d.filter(function (x) { return x === 1; }).length;
    houses.forEach(function (btn, i) {
      btn.innerHTML = houseSvg(arr[i]);
      btn.setAttribute('aria-label', hourLabel(i) + ': ' + patLabel(arr[i]) + (sel === i ? ' (gewählt)' : ''));
      btn.setAttribute('aria-pressed', String(sel === i));
      btn.disabled = false;
      btn.setAttribute('aria-disabled', locked ? 'true' : 'false');
      btn.draggable = !locked;
      btn.classList.toggle('sel', sel === i);
      btn.classList.toggle('done', mark !== null);
    });
    overlayHost.innerHTML = overlaySvg(arr);
    wheel.classList.toggle(P + 'good', mark !== null && isGood(arr));
    wheel.classList.toggle(P + 'bad', mark === 'check' && !isGood(arr));
    countEl.textContent = good + ' von 8 Übergängen ändern genau eine Flagge.';
    statusEl.textContent = msg !== undefined ? msg : describeSel();
  }
  function pick(i) {
    if (locked) return;
    if (sel === null) { sel = i; refresh(); return; }
    if (sel === i) { sel = null; refresh('Auswahl aufgehoben.'); return; }
    var a = sel;
    swap(a, i); sel = null; moves++;
    refresh('Getauscht: ' + hourLabel(a) + ' und ' + hourLabel(i) + '.');
    api.changed();
  }
  function dropOn(from, to) {
    if (locked || from === to || isNaN(from)) return;
    swap(from, to); sel = null; moves++;
    refresh('Getauscht: ' + hourLabel(from) + ' und ' + hourLabel(to) + '.');
    api.changed();
  }
  function onKey(e, i) {
    var to = null, k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % N;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + N - 1) % N;
    if (to === null) return;
    e.preventDefault();
    houses[to].focus();
  }

  Biber.register({
    id: 'bequemebiber20',
    story:
      '<p>In einem Dorf leben sehr bequeme Biber. Sie teilen den Tag in nur <strong>8 Zeitabschnitte zu je 3 Stunden</strong> ein. Am Rathaus zeigen <strong>drei Flaggen</strong> den aktuellen Zeitabschnitt an. Es gibt zwei Arten von Flaggen: rotes Quadrat und blaues Dreieck.</p>' +
      '<p>Die Flaggenanzeige ist so aber noch nicht bequem genug. Die Biber wünschen sich: Immer wenn ein neuer Zeitabschnitt beginnt, soll nur <strong>eine</strong> Flagge gewechselt werden.</p>',
    question: 'Ändere die Flaggenanzeige so, wie die Biber wünschen.',
    howto: 'Tippe zwei Rathäuser nacheinander an (oder ziehe eins auf das andere), um sie zu tauschen. Die Zahlen an den Grenzen zeigen, wie viele Flaggen beim Wechsel geändert werden. Mitternacht ist oben (24 Uhr).',
    explanation: function () {
      return '<p>Die einzige Problemstelle ist der Übergang um Mitternacht: Von drei roten Quadraten (21–24 Uhr) auf drei blaue Dreiecke (0–3 Uhr) würden alle drei Flaggen wechseln. Tauscht man die Anzeigen von <strong>15–18 Uhr</strong> (blau, blau, rot) und <strong>21–24 Uhr</strong> (rot, rot, rot), ändert sich bei jedem Übergang genau eine Flagge, auch um Mitternacht. Es gibt noch eine zweite Möglichkeit, mit einem Tausch zu beginnen; jede Anordnung mit genau einer Änderung pro Übergang ist richtig.</p>' +
        '<p>Beschreibt man die Flaggenbilder als dreistellige Binärzahlen (rotes Quadrat = 0, blaues Dreieck = 1), suchen wir eine Reihenfolge, in der sich benachbarte Zahlen nur in einer Stelle unterscheiden: 000, 001, 011, 010, 110, 111, 101, 100. Eine solche Anordnung heißt <strong>Gray-Code</strong>. Man erzeugt sie, indem man die bisherige Folge noch einmal in umgekehrter Reihenfolge anhängt und in diesem angehängten Teil die nächste Stelle von 0 auf 1 setzt. Gray-Codes helfen, kleine Messfehler abzufangen, zum Beispiel beim Ablesen von Drehscheiben.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      var HW = 24;   /* Hausbreite in % der Radbreite */
      houses = [];
      var i;
      for (i = 0; i < N; i++) {
        (function (idx) {
          var pos = pol(HOUSE_R, idx * 45 + 22.5);
          var btn = h('button', {
            type: 'button', class: P + 'housebtn', 'data-sector': String(idx),
            style: 'left:' + (pos[0] / 2) + '%;top:' + (pos[1] / 2) + '%;width:' + HW + '%',
            onclick: function () { pick(idx); },
            onkeydown: function (e) { onKey(e, idx); }
          });
          btn.addEventListener('dragstart', function (e) {
            if (locked) { e.preventDefault(); return; }
            e.dataTransfer.setData('text/plain', String(idx)); e.dataTransfer.effectAllowed = 'move';
          });
          btn.addEventListener('dragover', function (e) { if (!locked) e.preventDefault(); });
          btn.addEventListener('drop', function (e) {
            e.preventDefault();
            dropOn(parseInt(e.dataTransfer.getData('text/plain'), 10), idx);
          });
          houses.push(btn);
        })(i);
      }
      overlayHost = h('div', { class: P + 'overlayhost' });
      wheel = h('div', { class: P + 'wheel' }, h('div', { class: P + 'bg' }), houses, overlayHost);
      wheel.firstChild.innerHTML = wheelSvg();
      statusEl = h('p', { class: P + 'status', role: 'status', 'aria-live': 'polite' });
      countEl = h('p', { class: P + 'count' });
      el.replaceChildren(h('div', { class: P + 'board' }, wheel, h('div', { class: P + 'info' }, countEl, statusEl,
        h('p', { class: P + 'legend' }, h('span', { class: P + 'lg-red', 'aria-hidden': 'true' }), ' rotes Quadrat  ', h('span', { class: P + 'lg-blue', 'aria-hidden': 'true' }), ' blaues Dreieck'))));
      refresh('');
    },
    isComplete: function () { return moves > 0; },
    evaluate: function () { return { correct: isGood(arr), answer: { order: arr.slice() } }; },
    setAnswer: function (ans) {
      if (ans && Array.isArray(ans.order) && ans.order.length === N) arr = ans.order.slice();
      sel = null; moves = Math.max(moves, 1); mark = 'check';
      refresh('');
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      if (on) sel = null;
      refresh('');
    },
    reset: function () { reset(); refresh(''); },
    showSolution: function () { arr = SOLUTION.slice(); sel = null; mark = 'solution'; locked = true; refresh(''); }
  });
})();
