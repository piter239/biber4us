/* Aufgabe Burgenbau (Biber 2023, S. 21; Klasse 9-10 mittel, 11-13 einfach): Bauplan mit höchstens 7 Unterwasser- und 5 Überwasser-Arbeitern, kürzeste Bauzeit (Scheduling) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-burgenbau23-';

  var DAYS = 20;                 /* Länge der Zeitleiste (der Plan im Heft braucht 20 Tage) */
  var MAXU = 7, MAXO = 5;        /* höchstens so viele Arbeiter unter / über Wasser */
  /* Werte aus den Diagrammen im Heft (S. 21/22): Dauer in Tagen, Arbeiter unter / über Wasser.
     Wohnraum: 4 Tage, 3 unter, 2 über (so steht es auch im Aufgabentext). */
  var PARTS = [
    { id: 'wohn', name: 'Wohnraum', dur: 4, u: 3, o: 2, color: '#f07aa5', ink: '#1a1a1a' },
    { id: 'schlaf', name: 'Schlafhöhle', dur: 3, u: 5, o: 1, color: '#7cb7f0', ink: '#1a1a1a' },
    { id: 'dach', name: 'Dach', dur: 5, u: 2, o: 2, color: '#ffd34f', ink: '#1a1a1a' },
    { id: 'damm', name: 'Damm', dur: 8, u: 4, o: 2, color: '#12906f', ink: '#ffffff' }
  ];
  var STACK = [1, 0, 2, 3];      /* Stapelreihenfolge von unten nach oben in den Diagrammen: Schlafhöhle, Wohnraum, Dach, Damm */
  var START = [0, 4, 7, 12];     /* Plan aus dem Heft: 20 Tage */
  var RIGHT = 12;                /* offizielle Lösung; per Skript (alle Startzeiten 0..24) bestätigt: 12 ist das Minimum */
  var BEST = [3, 0, 7, 3];       /* ein optimaler Plan: Schlafhöhle zuerst, dann Wohnraum und Dach nacheinander, der Damm gleichzeitig */

  /* ---------- Plan prüfen ---------- */
  function analyse(plan) {
    var res = { end: 0, loadU: [], loadO: [], overU: [], overO: [], roof: false };
    var d, i;
    PARTS.forEach(function (p, k) { res.end = Math.max(res.end, plan[k] + p.dur); });
    for (d = 0; d < DAYS; d++) {
      var u = 0, o = 0;
      for (i = 0; i < PARTS.length; i++) if (plan[i] <= d && d < plan[i] + PARTS[i].dur) { u += PARTS[i].u; o += PARTS[i].o; }
      res.loadU.push(u); res.loadO.push(o);
      if (u > MAXU) res.overU.push(d);
      if (o > MAXO) res.overO.push(d);
    }
    res.roof = plan[2] < plan[1] + PARTS[1].dur;
    res.valid = !res.roof && !res.overU.length && !res.overO.length;
    return res;
  }
  function ranges(days) {
    var out = [];
    days.forEach(function (d) {
      var last = out[out.length - 1];
      if (last && last[1] === d - 1) last[1] = d; else out.push([d, d]);
    });
    return out;
  }
  function rangeText(r) { return r[0] === r[1] ? 'an Tag ' + (r[0] + 1) : 'an den Tagen ' + (r[0] + 1) + ' bis ' + (r[1] + 1); }
  function peak(a) { return a.reduce(function (m, x) { return Math.max(m, x); }, 0); }

  var el, api, plan, locked, mark, drag;
  var rows, trackBox, chartU, chartO, statusEl, input, inputWrap, markEl;

  function reset() { plan = START.slice(); mark = null; drag = null; }

  function clamp(i, s) { return Math.max(0, Math.min(DAYS - PARTS[i].dur, s)); }
  function setStart(i, s, silent) {
    s = clamp(i, s);
    if (s === plan[i]) return;
    plan[i] = s;
    refresh();
    if (!silent) api.changed();
  }

  /* ---------- Diagramme (HTML, damit Beschriftungen lesbar bleiben) ---------- */
  function segments(which) {   /* which: 'u' | 'o'; liefert Rechtecke je Teil mit gleichem Stapel-Abstand */
    var segs = [];
    var run = {};
    for (var d = 0; d <= DAYS; d++) {
      var off = 0, now = {};
      if (d < DAYS) STACK.forEach(function (i) {
        if (plan[i] <= d && d < plan[i] + PARTS[i].dur) { now[i] = off; off += PARTS[i][which]; }
      });
      Object.keys(run).forEach(function (k) {
        if (now[k] !== run[k].off) { segs.push({ i: +k, from: run[k].from, to: d, off: run[k].off }); delete run[k]; }
      });
      Object.keys(now).forEach(function (k) { if (!run[k]) run[k] = { from: d, off: now[k] }; });
    }
    return segs;
  }
  function drawChart(chart, which, max, range, a) {
    var load = which === 'u' ? a.loadU : a.loadO;
    var over = which === 'u' ? a.overU : a.overO;
    var kids = [], clip = [];
    over.forEach(function (d) {
      clip.push(h('div', { class: P + 'overday', style: 'left:' + (d / DAYS * 100) + '%;width:' + (100 / DAYS) + '%' }));
    });
    segments(which).forEach(function (s) {
      var p = PARTS[s.i];
      clip.push(h('div', {
        class: P + 'seg', style: 'left:' + (s.from / DAYS * 100) + '%;width:' + ((s.to - s.from) / DAYS * 100) + '%;bottom:calc(' + s.off + ' * var(--' + P + 'wu));height:calc(' + p[which] + ' * var(--' + P + 'wu));background:' + p.color
      }));
    });
    kids.push(h('div', { class: P + 'clip' }, clip));
    kids.push(h('div', { class: P + 'maxline', style: 'bottom:calc(' + max + ' * var(--' + P + 'wu))' }, h('span', null, 'Max ' + max)));
    [5].forEach(function (v) { if (v !== max) kids.push(h('span', { class: P + 'ytick', style: 'bottom:calc(' + v + ' * var(--' + P + 'wu))' }, String(v))); });
    chart.plot.replaceChildren.apply(chart.plot, kids);
    chart.root.setAttribute('aria-label', (which === 'u' ? 'Unterwasser' : 'Überwasser') + '-Arbeiter pro Tag: höchstens ' + peak(load) + ' gleichzeitig, erlaubt sind ' + max + '.');
  }

  function makeChart(range) {
    var plot = h('div', { class: P + 'plot', style: 'height:calc(' + range + ' * var(--' + P + 'wu))' });
    return { root: h('div', { class: P + 'chart', role: 'img' }, plot), plot: plot };
  }

  /* ---------- Anzeige aktualisieren ---------- */
  function refresh() {
    var a = analyse(plan);
    rows.forEach(function (r, i) {
      var p = PARTS[i], s = plan[i];
      r.bar.style.left = (s / DAYS * 100) + '%';
      r.bar.style.width = (p.dur / DAYS * 100) + '%';
      r.bar.setAttribute('aria-valuenow', String(s + 1));
      r.bar.setAttribute('aria-valuemax', String(DAYS - p.dur + 1));
      r.bar.setAttribute('aria-valuetext', 'Start an Tag ' + (s + 1) + ', fertig nach Tag ' + (s + p.dur));
      r.start.textContent = 'Start: Tag ' + (s + 1);
      r.back.disabled = locked || s <= 0;
      r.fwd.disabled = locked || s >= DAYS - p.dur;
      r.bar.setAttribute('aria-disabled', locked ? 'true' : 'false');
      r.bar.classList.toggle('bad', i === 2 && a.roof);
      r.row.classList.toggle('bad', i === 2 && a.roof);
    });
    drawChart(chartU, 'u', MAXU, 10, a);
    drawChart(chartO, 'o', MAXO, 8, a);
    var msgs = [];
    if (a.roof) msgs.push('Das Dach darf erst beginnen, wenn die Schlafhöhle fertig ist (nach Tag ' + (plan[1] + PARTS[1].dur) + ').');
    if (a.overU.length) msgs.push('Zu viele Arbeiter unter Wasser ' + rangeText(ranges(a.overU)[0]) + ': bis zu ' + peak(a.loadU) + ', erlaubt sind ' + MAXU + '.');
    if (a.overO.length) msgs.push('Zu viele Arbeiter über Wasser ' + rangeText(ranges(a.overO)[0]) + ': bis zu ' + peak(a.loadO) + ', erlaubt sind ' + MAXO + '.');
    statusEl.className = P + 'status ' + (a.valid ? 'okay' : 'bad');
    statusEl.textContent = a.valid ? 'Dieser Plan ist erlaubt. Die Burg ist nach ' + a.end + ' Tagen fertig.' : msgs.join(' ');
    el.querySelector('.' + P + 'days').textContent = a.valid ? a.end + ' Tage' : '–';
  }

  /* ---------- Eingabefeld ---------- */
  function parsed() {
    var t = input.value.trim();
    return /^\d{1,3}$/.test(t) ? parseInt(t, 10) : null;
  }
  function showMark() {
    var v = parsed();
    inputWrap.classList.remove('right', 'wrong');
    markEl.textContent = '';
    if (mark === 'check') {
      var ok = v === RIGHT;
      inputWrap.classList.add(ok ? 'right' : 'wrong');
      markEl.textContent = ok ? '✓' : '✗';
    } else if (mark === 'solution') { inputWrap.classList.add('right'); markEl.textContent = '✓'; }
  }

  /* ---------- Bedienung ---------- */
  function onDown(e) {
    var bar = e.target.closest('[data-bbar]');
    if (!bar || locked) return;
    var i = +bar.dataset.bbar;
    drag = { i: i, x0: e.clientX, s0: plan[i], w: trackBox.getBoundingClientRect().width / DAYS, moved: false };
    try { bar.setPointerCapture(e.pointerId); } catch (err) { /* egal */ }
    bar.classList.add('drag');
    bar.focus({ preventScroll: true });
  }
  function onMove(e) {
    if (!drag) return;
    var ds = Math.round((e.clientX - drag.x0) / drag.w);
    if (ds !== 0) drag.moved = true;
    setStart(drag.i, drag.s0 + ds, true);
  }
  function onUp() {
    if (!drag) return;
    var moved = drag.moved;
    var b = rows[drag.i].bar;
    b.classList.remove('drag');
    drag = null;
    if (moved) api.changed();
  }
  function onKey(e) {
    var bar = e.target.closest('[data-bbar]');
    if (!bar || locked) return;
    var i = +bar.dataset.bbar, d = 0;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') d = -1;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') d = 1;
    else if (e.key === 'Home') d = -DAYS;
    else if (e.key === 'End') d = DAYS;
    if (!d) return;
    e.preventDefault();
    setStart(i, plan[i] + d);
  }

  function build() {
    var axis = [];
    for (var d = 1; d <= DAYS; d++) axis.push(h('span', { class: P + 'tick' }, (d === 1 || d % 5 === 0) ? String(d) : ''));
    rows = PARTS.map(function (p, i) {
      var start = h('span', { class: P + 'start' });
      var back = h('button', { type: 'button', class: P + 'step', 'aria-label': p.name + ' einen Tag früher', onclick: function () { setStart(i, plan[i] - 1); } }, '◀');
      var fwd = h('button', { type: 'button', class: P + 'step', 'aria-label': p.name + ' einen Tag später', onclick: function () { setStart(i, plan[i] + 1); } }, '▶');
      var bar = h('div', {
        class: P + 'bar', 'data-bbar': String(i), role: 'slider', tabindex: '0', style: 'background:' + p.color + ';color:' + p.ink,
        'aria-label': p.name + ' (' + p.dur + ' Tage). Mit den Pfeiltasten verschieben.', 'aria-valuemin': '1', 'aria-orientation': 'horizontal'
      }, h('span', { 'aria-hidden': 'true' }, '↔'));
      var track = h('div', { class: P + 'track' }, bar);
      var row = h('div', { class: P + 'row' },
        h('div', { class: P + 'rhead' },
          h('span', { class: P + 'sw', style: 'background:' + p.color, 'aria-hidden': 'true' }),
          h('strong', null, p.name),
          h('span', { class: P + 'need' }, p.dur + ' Tage · ' + p.u + ' unter, ' + p.o + ' über Wasser' + (i === 2 ? ' · erst nach der Schlafhöhle' : '')),
          h('span', { class: P + 'ctl' }, back, start, fwd)),
        track);
      return { row: row, bar: bar, start: start, back: back, fwd: fwd, track: track };
    });
    chartU = makeChart(10);
    chartO = makeChart(8);
    statusEl = h('p', { class: P + 'status', role: 'status', 'aria-live': 'polite' });
    input = h('input', {
      type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: '3', class: P + 'input', 'aria-label': 'Anzahl der Tage der kürzesten Bauzeit',
      oninput: function () { input.value = input.value.replace(/[^0-9]/g, ''); api.changed(); }
    });
    markEl = h('span', { class: P + 'mark', 'aria-hidden': 'true' });
    inputWrap = h('label', { class: P + 'answer' }, h('span', null, 'Die kürzeste Bauzeit sind'), h('span', { class: P + 'inwrap' }, input, markEl), h('span', null, 'Tage.'));

    var axisBox = h('div', { class: P + 'axis', 'aria-hidden': 'true' }, axis);
    el.replaceChildren(h('div', { class: P + 'board' },
      h('section', { 'aria-label': 'Arbeitsplan' },
        h('h3', null, 'Arbeitsplan'),
        h('p', { class: P + 'tip' }, 'Verschiebe die Balken (ziehen, Pfeiltasten oder ◀ ▶). Die Diagramme zeigen, wie viele Biber an jedem Tag arbeiten.'),
        h('div', { class: P + 'gantt' },
          h('div', { class: P + 'axisrow' }, h('span', { class: P + 'axl' }, 'Tag'), axisBox),
          rows.map(function (r) { return r.row; })),
        h('p', { class: P + 'total' }, 'Bauzeit des Plans: ', h('strong', { class: P + 'days' }))),
      h('section', { 'aria-label': 'Arbeiter pro Tag' },
        h('h3', null, 'Arbeiter pro Tag'),
        h('div', { class: P + 'gantt' },
          h('h4', null, 'Unterwasser-Arbeiter'), chartU.root,
          h('h4', null, 'Überwasser-Arbeiter'), chartO.root)),
      statusEl,
      inputWrap));
    trackBox = rows[0].track;   /* Maß für das Ziehen: Breite einer Spur = 20 Tage */
  }

  Biber.register({
    id: 'burgenbau23',
    story:
      '<p>Eine Biberburg besteht aus 4 Teilen: Wohnraum, Schlafhöhle, Dach und Damm. Bei jedem Teil wird gleichzeitig über und unter Wasser gearbeitet. Die beteiligten Biber sind aber spezialisiert: jeder arbeitet entweder nur unter Wasser oder nur über Wasser.</p>' +
      '<p>Für den Bau einer neuen Burg stehen höchstens <b>7 Unterwasser-Arbeiter</b> und <b>5 Überwasser-Arbeiter</b> zur Verfügung. Sie können auch gleichzeitig verschiedene Teile bauen. Wichtig: Das Dach kann erst gebaut werden, wenn die Schlafhöhle fertig ist! Bei allen anderen Teilen ist die Reihenfolge egal.</p>' +
      '<p>Hier ist ein Arbeitsplan, mit dem die Biberburg nach 20 Tagen fertig wird. Er zeigt für jedes Teil, wie lange dessen Bau dauert und wie viele Arbeiter unter und über Wasser dafür nötig sind. Beim Wohnraum zum Beispiel arbeiten 3 Biber unter und 2 Biber über Wasser und sind nach 4 Tagen fertig.</p>',
    question: 'Überlege dir einen Plan, mit dem die Biberburg nach möglichst wenigen Tagen fertig wird. Wie viele Tage sind das?',
    howto: 'Probiere Pläne aus, indem du die Balken verschiebst. Rot markierte Tage zeigen, dass zu viele Biber arbeiten. Trage dann die kürzeste Bauzeit in Tagen ein.',
    explanation: function () {
      return '<p>Die kürzeste Bauzeit sind <b>12 Tage</b>. Ein solcher Plan: Die Schlafhöhle (3 Tage) kommt zuerst. Sie braucht 5 Unterwasser-Arbeiter und kann deshalb nicht gleichzeitig mit dem Damm (4) oder dem Wohnraum (3) gebaut werden, und das Dach muss ohnehin warten. Danach können nicht alle drei übrigen Teile zugleich laufen, denn sie brauchen zusammen 3 + 2 + 4 = 9 Unterwasser-Arbeiter.</p>' +
        '<p>Am besten baut man den Wohnraum (4 Tage) und das Dach (5 Tage) hintereinander und gleichzeitig dazu den Damm (8 Tage). Das ist nach 3 + 4 + 5 = 12 Tagen fertig. Weniger geht nicht: Probiert man alle möglichen Reihenfolgen und Startzeiten durch, ist keine schneller.</p>' +
        '<p>Informatik: Solche Diagramme heißen Gantt-Diagramme. Sie zeigen, wie die Ressourcen (hier die Arbeiter) über die Zeit verteilt sind. Das Planen von Abläufen mit Abhängigkeiten und begrenzten Ressourcen nennt man Scheduling. Es kommt bei Projektplänen vor und auch im Computer, wenn Prozesse um Rechenzeit oder Speicher konkurrieren.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      build();
      el.addEventListener('pointerdown', onDown);
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerup', onUp);
      el.addEventListener('pointercancel', onUp);
      el.addEventListener('keydown', onKey);
      input.value = '';
      refresh();
      showMark();
    },
    isComplete: function () { return parsed() !== null && parsed() > 0; },
    evaluate: function () { return { correct: parsed() === RIGHT, answer: { days: parsed(), plan: plan.slice() } }; },
    setAnswer: function (ans) {
      plan = ans && ans.plan && ans.plan.length === 4 ? ans.plan.map(function (s, i) { return clamp(i, +s || 0); }) : START.slice();
      input.value = ans && ans.days != null ? String(ans.days) : '';
      mark = null;
      refresh(); showMark();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      input.disabled = on;
      drag = null;
      refresh(); showMark();
    },
    reset: function () { reset(); input.value = ''; refresh(); showMark(); },
    showSolution: function () {
      plan = BEST.slice();
      input.value = String(RIGHT);
      locked = true; mark = 'solution'; input.disabled = true;
      refresh(); showMark();
    }
  });
})();
