/* Aufgabe Sturer Fred (Biber 2020; Klasse 7-8 schwer, 9-10 mittel): Wiederholung mit Schleifeninvariante; Antwort C (genau 6 Kängurus) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-sturerfred20-';
  var DIR = 'assets/sturerfred20/';

  var OPTIONS = [
    { key: 'A', text: 'Mehr als 10 Kängurus.' },
    { key: 'B', text: 'Genau 10 Kängurus.' },
    { key: 'C', text: 'Genau 6 Kängurus.' },
    { key: 'D', text: 'Genau 4 Kängurus.' },
    { key: 'E', text: 'Weniger als 4 Kängurus.' },
    { key: 'F', text: 'Das kann man nicht genau sagen.' }
  ];
  /* C: im Heft bestätigt. Per Skript (Breitensuche über alle Stellungen von Fred, Kängurus und Stein, 0-1-Kosten für Schritte zurück)
     geprüft: k Kängurus vorbei zu lassen kostet mindestens 2·(k-1) Schritte zurück, also höchstens 6 Kängurus bei höchstens 10 Schritten. */
  var RIGHT = 2;
  var MAXBACK = 10;

  /* Spielfeld zum Ausprobieren: L Baumstümpfe in einer Reihe, der Stein gehört zu Stumpf S */
  var L = 8, S = 2;
  var START = { fred: 1, ks: [3, 4, 5, 6, 7], stone: false, reserve: 3, backs: 0, passed: 0 };

  var el, api, radios, selected, locked, mark;
  var sim, stageEl, statEl, msgEl, btnBack, btnFwd, focusKey;

  function reset() { selected = null; mark = null; }
  function newSim(msg) {
    sim = { fred: START.fred, ks: START.ks.slice(), stone: START.stone, reserve: START.reserve, backs: 0, passed: 0, msg: msg || '' };
    normalize();
  }
  function has(i) { return sim.ks.indexOf(i) >= 0; }
  function free(i) { return i >= 0 && i < L && sim.fred !== i && !has(i); }
  function normalize() {
    var again = true;
    while (again) {
      again = false;
      if (sim.reserve > 0 && free(L - 1)) { sim.ks.push(L - 1); sim.reserve--; again = true; }
      sim.ks = sim.ks.filter(function (k) {
        if (k < sim.fred) { sim.passed++; again = true; return false; }
        return true;
      });
    }
    sim.ks.sort(function (a, b) { return a - b; });
  }

  /* ---------- Aktionen ---------- */
  function fredGo(d) {
    var t = sim.fred + d;
    if (d < 0 && sim.backs >= MAXBACK) { sim.msg = 'Fred ist stur: Er geht höchstens ' + MAXBACK + '-mal zurück. Das war schon der zehnte Schritt zurück.'; return draw(); }
    if (t < 0 || t >= L) { sim.msg = d > 0 ? 'Der Pfad ist hier zu Ende.' : 'Weiter zurück geht es nicht.'; return draw(); }
    if (has(t)) { sim.msg = 'Auf dem Baumstumpf davor sitzt ein Känguru. Fred kann nicht vorbei.'; return draw(); }
    sim.fred = t;
    if (d < 0) sim.backs++;
    sim.msg = d > 0 ? 'Fred geht einen Baumstumpf vorwärts.' : 'Fred geht einen Baumstumpf zurück (' + sim.backs + ' von ' + MAXBACK + ').';
    var before = sim.passed;
    normalize();
    if (sim.passed > before) sim.msg += ' ' + (sim.passed - before) + ' Känguru(s) laufen vorbei.';
    draw();
  }
  function stoneTap() {
    if (sim.stone) {
      if (!free(S)) { sim.msg = 'Das Känguru kann nicht zurückspringen: Der Stumpf unter dem Stein ist besetzt.'; return draw(); }
      sim.stone = false; sim.ks.push(S);
      sim.msg = 'Das Känguru springt vom Stein zurück auf den Stumpf.';
      var before = sim.passed;
      normalize();
      if (sim.passed > before) sim.msg += ' Fred steht schon weiter vorn: Das Känguru ist vorbei und läuft weiter.';
    } else if (has(S)) {
      sim.ks.splice(sim.ks.indexOf(S), 1); sim.stone = true;
      sim.msg = 'Das Känguru springt auf den Stein.';
      normalize();
    } else sim.msg = 'Zum Stein springen kann nur ein Känguru, das auf dem Stumpf direkt daneben sitzt.';
    draw();
  }
  function kangTap(k) {
    var j = k;
    while (free(j - 1)) j--;
    if (j === k) {
      if (k === S) return stoneTap();
      sim.msg = 'Dieses Känguru kommt nicht weiter nach vorn: Der nächste Stumpf ist besetzt.';
      return draw();
    }
    sim.ks[sim.ks.indexOf(k)] = j;
    sim.msg = 'Das Känguru geht ' + (k - j) + (k - j === 1 ? ' Baumstumpf' : ' Baumstümpfe') + ' weiter nach vorn.';
    normalize();
    draw();
  }

  /* ---------- Zeichnen ---------- */
  function im(file, cls, w, hh) { return h('img', { class: cls, src: DIR + file, alt: '', width: w, height: hh, draggable: 'false', 'aria-hidden': 'true' }); }

  function draw() {
    var ae = document.activeElement;
    if (ae && el.contains(ae) && ae.dataset && ae.dataset.k) focusKey = ae.dataset.k;
    var cols = [];
    for (var i = 0; i < L; i++) {
      var occ = null;
      if (sim.fred === i) occ = h('div', { class: P + 'fred', 'aria-label': 'Fred, auf Baumstumpf ' + (i + 1) }, im('fred.png', P + 'img', 170, 224));
      else if (has(i)) {
        (function (i) {
          occ = h('button', {
            type: 'button', class: P + 'kang', 'data-k': 'k' + i, disabled: locked,
            'aria-label': 'Känguru auf Baumstumpf ' + (i + 1) + (i === S ? ' (neben dem Stein)' : '') + ': antippen, um es weiter nach vorn zu schicken' + (i === S ? ' oder auf den Stein springen zu lassen' : ''),
            onclick: function () { kangTap(i); }
          }, im('kaenguru.png', P + 'img', 170, 318));
        })(i);
      }
      cols.push(h('div', { class: P + 'col' + (i === S ? ' ' + P + 'scol' : '') },
        h('div', { class: P + 'occ' }, occ), im('stumpf.png', P + 'stump', 160, 104)));
    }
    var stoneBtn = h('button', {
      type: 'button', class: P + 'stone', 'data-k': 'stone', disabled: locked,
      style: 'left:' + ((S + 0.5) / L * 100).toFixed(3) + '%',
      'aria-label': 'Stein neben Baumstumpf ' + (S + 1) + (sim.stone ? ', ein Känguru sitzt darauf: antippen, damit es zurückspringt' : ', leer: antippen, damit das Känguru vom Stumpf daneben hinaufspringt'),
      onclick: stoneTap
    }, im('stein.png', P + 'stoneimg', 300, 146), sim.stone ? im('kaenguru.png', P + 'onstone', 170, 318) : null);
    var reserve = sim.reserve > 0
      ? h('div', { class: P + 'reserve', 'aria-label': 'Im Gras warten noch ' + sim.reserve + ' Kängurus' }, im('kaenguru.png', P + 'rimg', 170, 318), h('span', null, '× ' + sim.reserve))
      : null;
    stageEl.replaceChildren(h('div', { class: P + 'scene' }, h('div', { class: P + 'skyrow' }, stoneBtn, reserve), h('div', { class: P + 'row' }, cols)));
    statEl.replaceChildren(
      h('span', { class: P + 'stat' }, 'Schritte zurück: ', h('strong', null, sim.backs + ' von ' + MAXBACK)),
      h('span', { class: P + 'stat' }, 'Vorbei gelassen: ', h('strong', null, String(sim.passed))));
    msgEl.textContent = sim.msg || 'Fred steht vor den Kängurus. Schicke das erste Känguru zum Stein und probiere aus, wie viele vorbeikommen.';
    btnBack.disabled = locked || sim.backs >= MAXBACK;
    btnFwd.disabled = locked;
    if (focusKey) {
      var t = stageEl.querySelector('[data-k="' + focusKey + '"]');
      if (t) t.focus();
      focusKey = null;
    }
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
    if (sim) draw();
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
    id: 'sturerfred20',
    story:
      '<p>Über den Fluss führt ein Pfad aus Baumstümpfen. Der Biber Fred geht über den Pfad und begegnet einer Gruppe Kängurus. Der Biber und die Kängurus können nicht aneinander vorbei, denn auf jeden Baumstumpf passt nur ein Tier.</p>' +
      '<p>Aber es gibt einen Baumstumpf, von dem aus ein Känguru auf einen Stein und wieder zurück springen kann. Auch auf den Stein passt nur ein Tier.</p>' +
      '<p>Mit Hilfe des Steins könnte Fred alle Kängurus vorbei lassen. Aber Fred ist stur. Er will höchstens 10-mal einen Baumstumpf zurück gehen. Vorwärts geht er beliebig oft.</p>',
    question: 'Wie viele Kängurus kann Fred höchstens vorbei lassen?',
    howto: 'Probiere es oben aus: Tippe ein Känguru an, damit es nach vorn geht oder (neben dem Stein) hinaufspringt, tippe den Stein an, und lass Fred mit den Knöpfen gehen. Wähle dann unten die Antwort.',
    explanation: function () {
      return '<p><strong>Antwort C ist richtig:</strong> Fred kann genau 6 Kängurus vorbei lassen. So lässt er <em>ein</em> Känguru vorbei:</p>' +
        '<ol><li>Das Känguru springt auf den Stein.</li><li>Fred geht zwei Baumstümpfe vorwärts.</li><li>Das Känguru springt zurück und setzt seinen Weg fort.</li>' +
        '<li>Fred geht zweimal einen Baumstumpf zurück. Jetzt steht er wieder an der Ausgangsstelle.</li></ol>' +
        '<p>Diese vier Anweisungen wiederholt Fred für jedes weitere Känguru. Jede Wiederholung kostet zwei Schritte zurück. Mit 10 Schritten zurück schafft er also 5 Wiederholungen mit Rückweg. ' +
        'Nach dem letzten Känguru muss Fred nicht mehr zurück. Für 6 Kängurus braucht er also nur 5 Rückwege, das sind genau 10 Schritte zurück: <strong>6 Kängurus</strong>. ' +
        'Ein siebtes Känguru würde einen sechsten Rückweg verlangen, und das wären 12 Schritte. Auch mit anderen Abläufen geht es nicht besser: Jedes weitere Känguru kostet mindestens zwei Schritte zurück.</p>' +
        '<p>Eine Folge von Anweisungen, die man mehrmals ausführt, heißt in der Informatik <em>Schleife</em>. Damit sie zuverlässig funktioniert, muss nach jedem Durchlauf wieder dieselbe Situation herrschen. Das nennt man die <em>Schleifeninvariante</em>. ' +
        'Hier ist es Freds Ausgangsstelle vor dem Stumpf mit dem Stein.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset(); focusKey = null;
      stageEl = h('div', { class: P + 'stage' });
      statEl = h('div', { class: P + 'stats', 'aria-live': 'polite' });
      msgEl = h('p', { class: P + 'msg', role: 'status', 'aria-live': 'polite' });
      btnBack = h('button', { type: 'button', class: P + 'go ' + P + 'back', onclick: function () { fredGo(-1); } }, '◀ Fred geht zurück');
      btnFwd = h('button', { type: 'button', class: P + 'go ' + P + 'fwd', onclick: function () { fredGo(1); } }, 'Fred geht vor ▶');
      var again = h('button', { type: 'button', class: 'btn ghost ' + P + 'again', onclick: function () { if (!locked) { newSim('Neu gestartet.'); draw(); } } }, 'Neu starten');
      radios = OPTIONS.map(function (o, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': o.key,
          'aria-label': 'Antwort ' + o.key + ': ' + o.text, onclick: function () { choose(i, false); }, onkeydown: onKey
        });
        btn.innerHTML = '<span class="' + P + 'key" aria-hidden="true">' + o.key + ')</span><span class="' + P + 'txt">' + o.text + '</span>';
        return btn;
      });
      newSim();
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { class: P + 'game', 'aria-label': 'Zum Ausprobieren: der Pfad mit Fred und den Kängurus' },
          h('h3', null, 'Zum Ausprobieren (hier warten 8 Kängurus)'),
          stageEl, statEl, msgEl,
          h('div', { class: P + 'ctrl' }, btnBack, btnFwd, again)),
        h('section', { 'aria-label': 'Antwort' }, h('h3', null, 'Wie viele Kängurus kann Fred höchstens vorbei lassen?'),
          h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Antworten' }, radios))));
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
    reset: function () { reset(); newSim(); refresh(); },
    showSolution: function () { selected = RIGHT; mark = 'solution'; locked = true; refresh(); }
  });
})();
