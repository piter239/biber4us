/* Aufgabe Mehltransport (Klasse 9-10 mittel, 11-13 einfach): Plan für Albert und Marco, Bedingung für die maximale Mehlmenge wählen */
(function () {
  'use strict';
  var h = Biber.h;

  var OPTIONS = [
    { key: 'A', text: 'Albert muss zuerst gehen.' },
    { key: 'B', text: 'Marco muss zuerst gehen.' },
    { key: 'C', text: 'Marco muss zuletzt gehen.' },
    { key: 'D', text: 'Albert darf nicht zuletzt gehen.' },
    { key: 'E', text: 'Marco muss genau einmal gehen.' }
  ];
  var RIGHT = 0;
  // Per Brute Force (alle Pläne aus 16 halben Stunden) ermittelt: größte Mehlmenge unter jeder Bedingung
  var BEST = { A: 101, B: 98, C: 98, D: 98, E: 96 };

  /* ---- Probierfeld: Plan aus Gängen (A = Albert 1 h, M = Marco 30 min, P = Pause 30 min) ---- */
  var UNITS = 16; // 8 Stunden in halben Stunden
  var STEP = {
    A: { dur: 2, kg: 13, name: 'Albert', time: '1 Stunde' },
    M: { dur: 1, kg: 5, name: 'Marco', time: '30 Minuten' },
    P: { dur: 1, kg: 0, name: 'Pause', time: '30 Minuten' }
  };
  function hours(u) { return String(u / 2).replace('.', ','); }
  function used(plan) { return plan.reduce(function (s, e) { return s + STEP[e].dur; }, 0); }
  function total(plan) { return plan.reduce(function (s, e) { return s + STEP[e].kg; }, 0); }
  function whyNot(plan, e) {
    if (used(plan) + STEP[e].dur > UNITS) return 'Die 8 Stunden sind nicht mehr lang genug.';
    var n = plan.length;
    if (e !== 'P' && n >= 3 && plan[n - 1] === e && plan[n - 2] === e && plan[n - 3] === e) {
      return STEP[e].name + ' hat schon dreimal direkt hintereinander Mehl geholt und braucht 30 Minuten Erholung. Lass zuerst ' + (e === 'A' ? 'Marco gehen' : 'Albert gehen') + ' oder füge eine Pause ein.';
    }
    return '';
  }

  /* ---- Bilder (SVG) ---- */
  function scene() {
    return '<svg class="mt-scene" viewBox="0 0 360 120" role="img" aria-label="Links eine Windmühle mit Mehlsäcken, rechts die Bäckerei, dazwischen ein Weg">' +
      '<g class="mt-mill"><path class="mt-tower" d="M52 100 L60 52 L90 52 L98 100 Z"/><path class="mt-cap" d="M62 50 L68 34 L82 34 L88 50 Z"/>' +
      '<rect class="mt-door" x="68" y="76" width="14" height="24" rx="1"/>' +
      '<g class="mt-sails" transform="rotate(45 75 40)"><rect x="73" y="2" width="4" height="76"/><rect x="73" y="2" width="14" height="30"/><rect x="63" y="48" width="14" height="30"/><rect x="2" y="38" width="76" height="4" transform="translate(37 0)"/></g>' +
      '<circle class="mt-hub" cx="75" cy="40" r="5"/></g>' +
      '<g class="mt-bags">' + [[30, 100], [44, 106], [104, 100], [118, 106], [111, 94]].map(function (p) {
        return '<g transform="translate(' + p[0] + ' ' + p[1] + ')"><path d="M-9 0 C-12 -10 -6 -16 0 -16 C6 -16 12 -10 9 0 Z"/><path class="mt-knot" d="M-3 -16 L-5 -22 L0 -19 L5 -22 L3 -16"/></g>';
      }).join('') + '</g>' +
      '<path class="mt-road" d="M10 106 H350"/><path class="mt-way" d="M140 104 H268"/>' +
      '<g class="mt-shop"><rect class="mt-wall" x="286" y="62" width="60" height="44"/><path class="mt-awning" d="M280 62 L292 44 H340 L352 62 Z"/>' +
      '<rect class="mt-window" x="294" y="72" width="44" height="22" rx="2"/><path class="mt-shelf" d="M296 83 H336"/>' +
      '<ellipse class="mt-loaf" cx="306" cy="79" rx="6" ry="3"/><ellipse class="mt-loaf" cx="324" cy="79" rx="6" ry="3"/><ellipse class="mt-loaf" cx="306" cy="90" rx="6" ry="3"/><ellipse class="mt-loaf" cx="324" cy="90" rx="6" ry="3"/></g>' +
      '</svg>';
  }
  function carrier(kg) {
    return '<svg class="mt-carrier" viewBox="0 0 44 44" aria-hidden="true" focusable="false">' +
      '<circle class="mt-head" cx="30" cy="9" r="5"/><path class="mt-body" d="M26 15 C31 15 33 19 31 24 L33 40 H27 L25 31 L21 40 H15 L19 26 C20 20 22 15 26 15 Z"/>' +
      '<circle class="mt-sack" cx="14" cy="17" r="11"/><text class="mt-sacknum" x="14" y="21.5" text-anchor="middle">' + kg + '</text></svg>';
  }

  function storyHtml() {
    return '<p>Albert und Marco arbeiten in einer Bäckerei. Sie müssen immer wieder Mehl von der Mühle holen gehen. Es darf aber immer nur einer gehen, damit der andere die Kunden bedienen kann.</p>' +
      scene() +
      '<p>Ihre Leistungen beim Mehl holen sind unterschiedlich:</p>' +
      '<ul class="mt-perf"><li>' + carrier(13) + '<span>Albert holt 13 kg Mehl in 1 Stunde.</span></li>' +
      '<li>' + carrier(5) + '<span>Marco holt 5 kg Mehl in 30 Minuten.</span></li></ul>' +
      '<p>Für jeden der beiden gilt aber: Er kann höchstens dreimal direkt hintereinander Mehl holen. Nach dreimal Mehl holen sind 30 Minuten Erholung nötig. In dieser Zeit können Kunden bedient werden.</p>' +
      '<p>Albert und Marco möchten zusammen in 8 Stunden so viel Mehl wie möglich holen.</p>';
  }

  var el, api, radios, selected, locked, mark;
  var plan, planBox, axisBox, statusBox, hintBox, addBtns, undoBtn, clearBtn;

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
      var m = btn.querySelector('.mt-mark');
      if (m) m.remove();
      if (on && mark !== null) btn.appendChild(h('span', { class: 'mt-mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
    });
  }

  function onKey(e) {
    var k = e.key, i = radios.indexOf(e.currentTarget);
    var to = null;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % radios.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + radios.length - 1) % radios.length;
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }

  /* ---- Probierfeld zeichnen ---- */
  function renderPlan(msg) {
    var u = used(plan);
    planBox.replaceChildren.apply(planBox, plan.map(function (e, i) {
      var s = STEP[e];
      var blk = h('li', {
        class: 'mt-blk mt-' + e, style: 'width: ' + (s.dur / UNITS * 100) + '%',
        'aria-label': (i + 1) + '. ' + s.name + (e === 'P' ? ', ' : ' holt Mehl, ') + s.time + (s.kg ? ', ' + s.kg + ' Kilogramm' : '')
      }, h('b', { 'aria-hidden': 'true' }, e === 'P' ? '' : e === 'A' ? 'A' : 'M'), h('i', { 'aria-hidden': 'true' }, s.kg ? String(s.kg) : ''));
      blk.title = s.name + ' · ' + s.time;
      return blk;
    }));
    statusBox.textContent = 'Zeit: ' + hours(u) + ' von 8 Stunden · Mehl: ' + total(plan) + ' kg';
    addBtns.forEach(function (b) {
      var why = whyNot(plan, b.dataset.step);
      b.disabled = !!why;
    });
    undoBtn.disabled = plan.length === 0;
    clearBtn.disabled = plan.length === 0;
    hintBox.textContent = msg || '';
  }

  function addStep(e) {
    var why = whyNot(plan, e);
    if (why) return renderPlan(why);
    plan.push(e);
    var n = plan.length, last = plan[n - 1], msg = '';
    if (last !== 'P' && n >= 3 && plan[n - 2] === last && plan[n - 3] === last) {
      msg = STEP[last].name + ' war jetzt dreimal direkt hintereinander dran und braucht 30 Minuten Erholung: Lass ' + (last === 'A' ? 'Marco' : 'Albert') + ' gehen oder füge eine Pause ein.';
    }
    renderPlan(msg);
  }

  function labPanel() {
    planBox = h('ol', { class: 'mt-plan', 'aria-label': 'Plan, von links nach rechts' });
    var ticks = [];
    for (var i = 0; i < 8; i++) ticks.push(h('span', null, String(i)));
    axisBox = h('div', { class: 'mt-axis', 'aria-hidden': 'true' }, ticks, h('span', { class: 'mt-axis-end' }, '8 Std.'));
    statusBox = h('p', { class: 'mt-stat', 'aria-live': 'polite' });
    hintBox = h('p', { class: 'mt-hint', 'aria-live': 'polite' });
    addBtns = ['A', 'M', 'P'].map(function (e) {
      var label = e === 'A' ? 'Albert geht (1 Std., 13 kg)' : e === 'M' ? 'Marco geht (30 Min., 5 kg)' : 'Pause (30 Min.)';
      return h('button', { type: 'button', class: 'btn ghost mt-add mt-add-' + e, 'data-step': e, onclick: function () { addStep(e); } }, label);
    });
    undoBtn = h('button', { type: 'button', class: 'btn ghost', onclick: function () { plan.pop(); renderPlan(); } }, 'Letzten Schritt zurück');
    clearBtn = h('button', { type: 'button', class: 'btn ghost', onclick: function () { plan = []; renderPlan(); } }, 'Plan leeren');
    var d = h('details', { class: 'mt-lab' },
      h('summary', null, 'Probierfeld: Pläne ausprobieren (für die Antwort nicht nötig)'),
      h('div', { class: 'mt-lab-body' },
        h('p', { class: 'mt-note' }, 'Baue einen Plan für die 8 Stunden. Es geht immer nur einer. Jeder darf höchstens dreimal direkt hintereinander gehen, danach braucht er 30 Minuten Erholung (der andere geht oder es gibt eine Pause).'),
        h('div', { class: 'mt-timeline' }, planBox, axisBox),
        statusBox, hintBox,
        h('div', { class: 'mt-btns' }, addBtns), h('div', { class: 'mt-btns' }, undoBtn, clearBtn)));
    return d;
  }

  Biber.register({
    id: 'mehltransport',
    story: storyHtml(),
    question: 'Unter genau einer der folgenden Bedingungen schaffen sie das. Unter welcher?',
    howto: 'Tippe die Bedingung an, unter der Albert und Marco in 8 Stunden die größtmögliche Mehlmenge holen. Im Probierfeld kannst du Pläne ausprobieren.',
    explanation: function () {
      var rows = OPTIONS.map(function (o) {
        return '<tr' + (o.key === 'A' ? ' class="mt-best"' : '') + '><th scope="row">' + o.key + ') ' + o.text + '</th><td>' + BEST[o.key] + ' kg</td></tr>';
      }).join('');
      return '<p>Albert holt 6,5 kg pro halbe Stunde, Marco nur 5 kg. Albert sollte also möglichst oft gehen. Mehr als dreimal hintereinander geht nicht, dazwischen muss Marco einen Gang übernehmen. ' +
        'Albert kann in 8 Stunden höchstens siebenmal gehen (8 Gänge brauchen 8 Stunden und zwei Erholungen). Bei sieben Gängen von Albert bleibt eine Stunde für zwei Gänge von Marco: ' +
        '7 · 13 kg + 2 · 5 kg = <strong>101 kg</strong>, zum Beispiel A A A M A A A M A (A = Albert, M = Marco). Die sieben Gänge von Albert bilden drei Blöcke mit höchstens je drei Gängen. Dazwischen müssen genau die zwei Gänge von Marco stehen, deshalb beginnt jeder beste Plan mit Albert.</p>' +
        '<p>Alle anderen Bedingungen lassen höchstens weniger zu (bester Plan unter der jeweiligen Bedingung, durch Durchprobieren aller Pläne ermittelt):</p>' +
        '<table class="mt-tab"><thead><tr><th scope="col">Bedingung</th><th scope="col">Höchstens</th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<p>Richtig ist also <strong>A</strong>. Solche Aufgaben, bei denen Zeit, Kapazität und Regeln zusammenspielen, heißen in der Informatik <em>Scheduling</em> (Ablaufplanung).</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset(); plan = [];
      radios = OPTIONS.map(function (o, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: 'mt-opt', 'data-opt': o.key,
          'aria-label': 'Antwort ' + o.key + ': ' + o.text,
          onclick: function () { choose(i, false); },
          onkeydown: onKey
        }, h('span', { class: 'mt-key', 'aria-hidden': 'true' }, o.key + ')'), h('span', { class: 'mt-txt', 'aria-hidden': 'true' }, o.text));
        return btn;
      });
      el.replaceChildren(h('div', { class: 'mt-board' },
        h('div', { class: 'mt-opts', role: 'radiogroup', 'aria-label': 'Bedingungen' }, radios), labPanel()));
      refresh();
      renderPlan();
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
    reset: function () { reset(); plan = []; refresh(); renderPlan(); },
    showSolution: function () { selected = RIGHT; mark = 'solution'; locked = true; refresh(); }
  });
})();
