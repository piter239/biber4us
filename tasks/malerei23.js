/* Aufgabe Rekursive Malerei (Biber 2023; Klasse 11-13 schwer): Rekursion mit Abbruchbedingung, Halbkreise mit Drehung */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-malerei23-';

  var OPTIONS = [
    { key: 'A', alt: 'Links eine große Halbkreisfläche, deren Rundung nach links zeigt. Rechts oben und unten je eine Halbkreisfläche mit Rundung nach rechts, dazwischen schmale Streifen aus vielen kleinen Halbkreisen.' },
    { key: 'B', alt: 'Links eine große Halbkreisfläche. Rechts in der Mitte zwei große Halbkreisflächen, die sich berühren: oben mit Rundung nach unten, darunter mit Rundung nach oben. In den Ecken kleinere Muster aus Halbkreisen.' },
    { key: 'C', alt: 'Links eine große Halbkreisfläche. Rechts davon eine Spirale aus Halbkreisen, die nach rechts unten immer kleiner werden.' },
    { key: 'D', alt: 'Links eine große Halbkreisfläche. Rechts ein Muster: oben und unten große Halbkreise, in der Mitte viele kleine Kreise und Halbkreise.' }
  ];
  var RIGHT = 0;   /* Antwort A: im Heft bestätigt und per Skript (Nachbau der Rekursion, Pixelvergleich mit allen vier Bildern) geprüft */
  var STEPS = 5;   /* Karte 1 wird bei 16, 8, 4, 2 und 1 m angewendet; bei 0,5 m greift die zweite Karte (nur noch Fläche füllen, Ende) */

  /* ---------- Rekursion als SVG nachbauen (160 x 160 Einheiten = 16 x 16 m) ---------- */
  function semi(x, y, w, r) {
    var m = x + w / 2, rad = w / 2;
    return r ? 'M' + m + ' ' + (y + w) + ' A' + rad + ' ' + rad + ' 0 0 0 ' + m + ' ' + y + ' Z'
             : 'M' + m + ' ' + y + ' A' + rad + ' ' + rad + ' 0 0 0 ' + m + ' ' + (y + w) + ' Z';
  }
  function draw(x, y, w, r, lv, depth) {
    if (lv >= depth) {
      var t = '<rect class="' + P + 'todo" x="' + x + '" y="' + y + '" width="' + w + '" height="' + w + '"/>';
      if (w >= 40) t += '<text class="' + P + 'one" x="' + (x + w / 2) + '" y="' + (y + w / 2) + '" font-size="' + (w * 0.3) + '" text-anchor="middle" dominant-baseline="central"' +
        (r ? ' transform="rotate(180 ' + (x + w / 2) + ' ' + (y + w / 2) + ')"' : '') + '>1</text>';
      return t;
    }
    var out = '<path class="' + P + 'dark" d="' + semi(x, y, w, r) + '"/>';
    if (w <= 10) return out;   /* 1-m-Feld: die Hälften (0,5 m) bemalt die zweite Karte nur noch mit der Hintergrundfläche */
    var half = w / 2, cx = r ? x : x + half;
    return out + draw(cx, y, half, 1 - r, lv + 1, depth) + draw(cx, y + half, half, 1 - r, lv + 1, depth);
  }
  function floorSvg(depth, label) {
    return '<svg class="' + P + 'floor" viewBox="0 0 160 160" role="img" aria-label="' + label + '"><rect class="' + P + 'bg" width="160" height="160"/>' + draw(0, 0, 160, 0, 0, depth) + '</svg>';
  }
  function stepLabel(k) {
    if (k === 0) return 'Schritt 0: Noch nichts gemalt. Der ganze Boden ist ein Feld der Breite 16 m mit Karte 1.';
    var w = ['16', '8', '4', '2', '1'][k - 1];
    return 'Schritt ' + k + ': Karte 1 ist ' + (k === 1 ? 'einmal' : k + ' Mal') + ' angewendet (zuletzt bei ' + w + ' m Breite).' + (k === STEPS ? ' Die Felder mit 0,5 m Breite füllt die zweite Karte nur noch aus, danach ist Schluss.' : '');
  }

  var el, api, radios, selected, locked, mark, stepBox, slider, stepEl, stepNote, step;

  function reset() { selected = null; mark = null; step = STEPS; }

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
    stepBox.hidden = mark === null;
    if (mark !== null) drawStep();
  }
  function drawStep() {
    slider.value = String(step);
    stepEl.innerHTML = floorSvg(step, stepLabel(step));
    stepNote.textContent = stepLabel(step);
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
    id: 'malerei23',
    story:
      '<p>Tina und Tom helfen bei der Vorbereitung einer Sonderausstellung im Informatik-Museum. Auf den Boden eines Ausstellungsraums sollen sie ein 16 x 16 Meter großes Bild malen. Vom Künstler bekommen sie einen Satz <strong>Malanweisungskarten</strong> mit Hinweisen zu Bildelementen, Maßen und Drehungen. Auf manchen Karten sind nummerierte Felder, die auf andere Karten verweisen.</p>' +
      '<p>Hier ein Beispiel aus einem früheren Projekt. Wenn man diese drei Karten richtig ausführt, entsteht ein Bild des Bibers. Auf Karte 1 (10 m) stehen die Felder 2 und 3: Dort wird Karte 2 beziehungsweise Karte 3 eingesetzt.</p>' +
      '<figure class="' + P + 'fig"><img src="assets/malerei23/beispiel.png" width="720" height="276" alt="Drei Malanweisungskarten: Karte 1 (10 m) zeigt den Biberkopf mit zwei Feldern 2 und 3, Karte 2 (5 m) zeigt den Rumpf mit Schwanz, Karte 3 (5 m) zeigt Arm und Faust."></figure>' +
      '<p>Für die Sonderausstellung bekommen Tina und Tom nun diese zwei Karten, beide mit der Nummer 1:</p>' +
      '<figure class="' + P + 'fig ' + P + 'fig2"><img src="assets/malerei23/karten.png" width="520" height="303" alt="Linke Karte 1 (Breite 16 m, 8 m, …, 1 m): Die linke Hälfte ist eine Halbkreisfläche mit Rundung nach links. In der rechten Hälfte stehen übereinander zwei Felder, beide verweisen auf Karte 1 und sind um 180 Grad gedreht. Rechte Karte 1 (Breite 0,5 m): eine einfarbige Fläche ohne Verweis."></figure>' +
      '<p>Tom runzelt die Stirn: „Wie soll das gehen? Die linke Karte verweist auf sich selbst, und außerdem haben beide Karten dieselbe Nummer!“ Tina lacht: „Wir kriegen das hin! Zuerst verwenden wir nur die linke Karte. Die rechte Karte wird uns später anweisen, wann wir mit dem Malen aufhören sollen.“</p>',
    question: 'Wie wird der Boden des Ausstellungsraums aussehen?',
    howto: 'Wähle das Bild, das entsteht. Nach dem Prüfen kannst du die Rekursion Schritt für Schritt ansehen.',
    explanation: function () {
      return '<p>Die linke Karte malt in die linke Hälfte des Feldes eine Halbkreisfläche. Für die rechte Hälfte (zwei Felder übereinander) verweist sie zweimal auf sich selbst, aber <strong>um 180° gedreht</strong>. Dadurch zeigt die Rundung bei 16 m nach links, bei 8 m nach rechts, bei 4 m wieder nach links und so weiter.</p>' +
        '<p>Bei 0,5 m Breite passt die zweite Karte: Sie hat keinen Verweis mehr, malt nur die verbleibende freie Fläche und beendet damit das Malen. So entsteht genau das Bild von <strong>Antwort A</strong>.</p>' +
        '<p>Eine Anweisung, die sich selbst aufruft, heißt <em>rekursiv</em>. Damit die Rekursion nicht endlos weiterläuft, braucht sie eine <em>Abbruchbedingung</em>. Hier ist das die zweite Karte, die ab einer Breite von 0,5 m benutzt wird.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      radios = OPTIONS.map(function (o, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': o.key,
          'aria-label': 'Bild ' + o.key + ': ' + o.alt,
          onclick: function () { choose(i, false); }, onkeydown: onKey
        });
        btn.innerHTML = '<span class="' + P + 'key" aria-hidden="true">' + o.key + '</span>' +
          '<img src="assets/malerei23/opt-' + o.key.toLowerCase() + '.png" width="360" height="360" alt="" draggable="false">';
        return btn;
      });
      slider = h('input', { type: 'range', min: '0', max: String(STEPS), step: '1', value: String(STEPS), class: P + 'range', 'aria-label': 'Schritt der Rekursion (0 bis ' + STEPS + ')' });
      slider.addEventListener('input', function () { step = +slider.value; drawStep(); });
      stepEl = h('div', { class: P + 'stepimg' });
      stepNote = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      stepBox = h('section', { class: P + 'steps', 'aria-label': 'Rekursion Schritt für Schritt', hidden: true },
        h('h3', null, 'So malen Tina und Tom, Schritt für Schritt'),
        h('div', { class: P + 'stepgrid' }, stepEl, h('div', null, h('label', { class: P + 'rlabel' }, 'Schritt: ', slider), stepNote)));
      el.replaceChildren(h('div', { class: P + 'board' },
        h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Antworten A bis D' }, radios),
        stepBox));
      refresh();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () {
      return { correct: selected === RIGHT, answer: { choice: OPTIONS[selected].key } };
    },
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
