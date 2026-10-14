/* Aufgabe Raumfahrt (Biber 2019; Klasse 5-6 mittel, 7-8 einfach): Welcher Reiseplan führt NICHT von Neptun zur Erde? */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-raumfahrt19-';
  var DIR = 'assets/raumfahrt19/';

  /* Verbindungsplan (abgelesen aus dem großen Bild und mit den Lösungswegen im Heft abgeglichen):
     Planet -> [Ziel mit Rakete (R), Ziel mit Raumschiff (S)] */
  var NEXT = {
    Merkur: ['Venus', 'Erde'],
    Venus: ['Jupiter', 'Jupiter'],
    Erde: ['Saturn', 'Saturn'],
    Mars: ['Saturn', 'Erde'],
    Jupiter: ['Merkur', 'Neptun'],
    Saturn: ['Mars', 'Uranus'],
    Uranus: ['Erde', 'Erde'],
    Neptun: ['Jupiter', 'Saturn']
  };
  var START = 'Neptun', GOAL = 'Erde';
  var OPTIONS = [
    { key: 'A', plan: 'SSR' },
    { key: 'B', plan: 'RSRS' },
    { key: 'C', plan: 'RSSSR' },
    { key: 'D', plan: 'RRS' }
  ];
  function route(plan, from) {
    var path = [from], p = from;
    plan.split('').forEach(function (c) { p = NEXT[p][c === 'R' ? 0 : 1]; path.push(p); });
    return path;
  }
  function arrives(o) { var r = route(o.plan, START); return r[r.length - 1] === GOAL; }
  var RIGHT = OPTIONS.map(function (o) { return !arrives(o); }).indexOf(true);   /* B; per Skript bestätigt */

  function describePlan(plan) {
    return plan.split('').map(function (c) { return c === 'R' ? 'Rakete' : 'Raumschiff'; }).join(', ');
  }
  function icon(kind) {
    return kind === 'R'
      ? '<img class="' + P + 'veh ' + P + 'rocket" src="' + DIR + 'rocket.png" alt="Rakete" width="88" height="111">'
      : '<img class="' + P + 'veh ' + P + 'ufo" src="' + DIR + 'ufo.png" alt="Raumschiff" width="112" height="88">';
  }
  function planet(name, file, w, hgt) {
    return '<img class="' + P + 'pl" src="' + DIR + file + '.png" alt="' + name + '" width="' + w + '" height="' + hgt + '">';
  }
  function pill(plan) {
    return '<span class="' + P + 'pill">' + plan.split('').map(icon).join('') + '</span>';
  }

  var MAP_ALT = 'Verbindungsplan: Von jedem Planeten führt ein Pfeil mit Rakete und ein Pfeil mit Raumschiff zu einem Ziel. ' +
    Object.keys(NEXT).map(function (k) { return k + ': Rakete nach ' + NEXT[k][0] + ', Raumschiff nach ' + NEXT[k][1]; }).join('; ') + '.';

  var el, api, radios, selected, locked, mark;
  function reset() { selected = null; mark = null; }

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
  function choose(i, focus) {
    if (locked) return;
    selected = i;
    refresh();
    if (focus) radios[i].focus();
    api.changed();
  }
  function onKey(e) {
    var k = e.key, i = radios.indexOf(e.currentTarget), to = null;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % radios.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + radios.length - 1) % radios.length;
    else if (k === ' ' || k === 'Enter') { e.preventDefault(); choose(i, false); return; }
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }

  Biber.register({
    id: 'raumfahrt19',
    story:
      '<p>Im All fliegen Astronauten mit Rakete ' + icon('R') + ' oder Raumschiff ' + icon('S') + ' von Planet zu Planet. Das große Bild unten zeigt die Flugmöglichkeiten. Für eine längere Reise benötigt man einen Reiseplan.</p>' +
      '<p>Ein Beispiel: Ein Astronaut möchte von der Venus ' + planet('Venus', 'venus', 96, 95) + ' zum Saturn ' + planet('Saturn', 'saturn', 200, 106) + ' reisen. Er erhält diesen Reiseplan: ' + pill('RSS') + '</p>' +
      '<p>Das bedeutet: Zunächst fliegt der Astronaut mit der Rakete zum Jupiter ' + planet('Jupiter', 'jupiter', 96, 96) + '. Weiter geht es mit dem Raumschiff zum Neptun ' + planet('Neptun', 'neptun', 96, 93) + ' und von dort mit dem Raumschiff zum Saturn ' + planet('Saturn', 'saturn', 200, 106) + '. Angekommen!</p>' +
      '<p>Astronautin Tine ist auf dem Neptun ' + planet('Neptun', 'neptun', 96, 93) + ' und möchte zurück zur Erde ' + planet('Erde', 'erde', 96, 95) + ' reisen.</p>',
    question: 'Mit welchem Reiseplan kommt Tine NICHT auf der Erde an?',
    howto: 'Verfolge die Reisepläne im Verbindungsplan, am besten mit dem Finger oder Mauszeiger. Wähle dann den Reiseplan, bei dem Tine nicht auf der Erde ankommt.',
    explanation: function () {
      var items = OPTIONS.map(function (o) {
        var r = route(o.plan, START), ok = arrives(o);
        return '<li><strong>' + o.key + ')</strong> ' + r.join(' → ') + (ok ? ': kommt auf der Erde an.' : ': <strong>endet auf dem ' + r[r.length - 1] + '</strong>, nicht auf der Erde.') + '</li>';
      }).join('');
      return '<p>Man folgt dem Plan Schritt für Schritt: Von jedem Planeten gibt es für Rakete und Raumschiff genau ein Ziel. So entstehen die Wege von Tine:</p>' +
        '<ul class="' + P + 'routes">' + items + '</ul>' +
        '<p>Nur mit Reiseplan <strong>B</strong> kommt Tine nicht auf der Erde an: Sie fliegt zweimal über den Jupiter zurück zum Neptun.</p>' +
        '<p>Ein solches Modell mit Eingaben (Rakete, Raumschiff), Zuständen (Planeten), eindeutigen Übergängen (Verbindungsplan), einem Startzustand (Neptun) und Endzuständen (hier: die Erde) heißt in der Informatik <strong>deterministischer endlicher Automat</strong> (DEA). Automaten wie Fahrkartenautomaten oder die Prüfung, ob eine Zeichenfolge eine gültige E-Mail-Adresse ist, lassen sich so beschreiben.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      var map = h('figure', { class: P + 'map' });
      map.innerHTML = '<div class="' + P + 'mapscroll" tabindex="0" role="group" aria-label="Verbindungsplan, seitlich verschiebbar"><img src="' + DIR + 'map.png" width="1400" height="565" alt="' + MAP_ALT + '"></div><figcaption class="' + P + 'maphint">Wische seitlich, um den ganzen Plan zu sehen.</figcaption>';
      radios = OPTIONS.map(function (o, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': o.key,
          'aria-label': 'Reiseplan ' + o.key + ': ' + describePlan(o.plan),
          onclick: function () { choose(i, false); }, onkeydown: onKey
        });
        btn.innerHTML = pill(o.plan) + '<span class="' + P + 'key" aria-hidden="true">' + o.key + ')</span>';
        return btn;
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        map,
        h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Reisepläne A bis D' }, radios)));
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
