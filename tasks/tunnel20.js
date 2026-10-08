/* Aufgabe Durch den Tunnel (Heft 2020, Klasse 9-10 schwer, 11-13 mittel): Planen mit Zeitbudget */
(function () {
  'use strict';
  var h = Biber.h;

  var P = {
    A: { name: 'Anna', t: 10, col: 'var(--c1)' },
    B: { name: 'Benno', t: 5, col: 'var(--c4)' },
    M: { name: 'Mutter', t: 20, col: 'var(--c2)' },
    V: { name: 'Vater', t: 25, col: 'var(--c6)' }
  };
  var ORDER = ['A', 'B', 'M', 'V'];
  var LIMIT = 60;
  var N = 5;
  var SOLUTION = [['A', 'B'], ['B', null], ['M', 'V'], ['A', null], ['A', 'B']];

  /* Plan durchspielen: Hin-Passagen in Zeile 0, 2, 4, Zurück in Zeile 1, 3 */
  function sim(rows) {
    var side = { A: 0, B: 0, M: 0, V: 0 };
    var out = { rowOk: [], rowTime: [], msgs: [], total: 0, allThrough: false, valid: false };
    rows.forEach(function (row, r) {
      var lamp = r % 2;
      var who = row.filter(Boolean);
      var ok = who.length >= 1 && (who.length < 2 || who[0] !== who[1]);
      who.forEach(function (p) {
        if (side[p] !== lamp) {
          ok = false;
          out.msgs.push('Passage ' + (r + 1) + ': ' + P[p].name + (lamp === 0 ? ' ist schon am Ausgang des Tunnels.' : ' ist noch nicht am Ausgang des Tunnels.'));
        }
      });
      var t = who.reduce(function (m, p) { return Math.max(m, P[p].t); }, 0);
      who.forEach(function (p) { side[p] = 1 - lamp; });
      out.rowOk.push(ok);
      out.rowTime.push(t);
      out.total += t;
    });
    out.allThrough = ORDER.every(function (p) { return side[p] === 1; });
    out.valid = out.rowOk.every(Boolean) && out.allThrough && out.total <= LIMIT;
    return out;
  }

  function blank() { var r = []; for (var i = 0; i < N; i++) r.push([null, null]); return r; }

  var el, api, rows, selected, dragging, locked, mode;

  function chip(p, cls) {
    return h('span', { class: 't-tunnel20-chip ' + (cls || ''), style: '--pc:' + P[p].col },
      h('span', { class: 't-tunnel20-nm' }, P[p].name), h('span', { class: 't-tunnel20-tm' }, P[p].t + ' min'));
  }

  function place(p, r, c) {
    if (locked) return;
    if (rows[r][1 - c] === p) rows[r][1 - c] = null;
    rows[r][c] = p;
    selected = null;
    render(); focusCell(r, c);
    api.changed(statusText());
  }
  function clearCell(r, c) {
    if (locked) return;
    rows[r][c] = null;
    selected = null;
    render(); focusCell(r, c);
    api.changed(statusText());
  }
  function moveCell(from, r, c) {
    var p = rows[from[0]][from[1]], other = rows[r][c];
    if (!p || (from[0] === r && from[1] === c)) return;
    rows[from[0]][from[1]] = other && rows[from[0]][1 - from[1]] !== other ? other : null;
    place(p, r, c);
  }
  function focusCell(r, c) {
    var b = el.querySelector('[data-cell="' + r + ',' + c + '"]');
    if (b) b.focus();
  }
  function statusText() {
    var s = sim(rows);
    if (!rows.some(function (r) { return r[0] || r[1]; })) return '';
    return 'Bisher ' + s.total + ' von ' + LIMIT + ' Minuten.';
  }

  function render() {
    var s = sim(rows);
    var pool = ORDER.map(function (p) {
      return h('button', {
        type: 'button', class: 't-tunnel20-person' + (selected === p ? ' selected' : ''), 'data-person': p, draggable: locked ? false : 'true',
        disabled: locked, 'aria-pressed': String(selected === p), 'aria-label': P[p].name + ', ' + P[p].t + ' Minuten'
      }, chip(p));
    });
    var trs = rows.map(function (row, r) {
      var back = r % 2 === 1;
      var cls = 't-tunnel20-row';
      if (mode === 'check') cls += s.rowOk[r] ? ' right' : ' wrong';
      if (mode === 'solution') cls += ' right';
      var cells = row.map(function (p, c) {
        return h('button', {
          type: 'button', class: 't-tunnel20-cell' + (p ? ' filled' : ''), 'data-cell': r + ',' + c, disabled: locked,
          draggable: p && !locked ? 'true' : false,
          'aria-label': 'Passage ' + (r + 1) + ' (' + (back ? 'zurück' : 'hin') + '), Platz ' + (c + 1) + ': ' + (p ? P[p].name + ', Antippen entfernt' : 'leer')
        }, p ? chip(p) : h('span', { class: 't-tunnel20-ph' }, '–'));
      });
      return h('div', { class: cls },
        h('div', { class: 't-tunnel20-dir' }, back ? [h('span', { class: 't-tunnel20-arr back', 'aria-hidden': 'true' }, '←'), 'Zurück'] : ['Hin', h('span', { class: 't-tunnel20-arr', 'aria-hidden': 'true' }, '→')]),
        cells,
        h('div', { class: 't-tunnel20-min', 'aria-label': 'Dauer der Passage' }, s.rowTime[r] ? String(s.rowTime[r]) : ''));
    });
    var over = s.total > LIMIT;
    var msg = null;
    if (mode === 'check') {
      var lines = s.msgs.slice();
      if (!lines.length && !s.allThrough) lines.push('Am Ende sind nicht alle am Ausgang des Tunnels.');
      if (over) lines.push('Der Akku reicht nur für ' + LIMIT + ' Minuten, dein Plan braucht ' + s.total + '.');
      if (lines.length) msg = h('ul', { class: 't-tunnel20-msgs' }, lines.map(function (l) { return h('li', null, l); }));
    }
    el.replaceChildren(h('div', { class: 't-tunnel20-board' },
      h('section', { 'aria-label': 'Personen' },
        h('h3', null, 'Personen'),
        h('div', { class: 't-tunnel20-pool', 'data-pool': '' }, pool)),
      h('section', { 'aria-label': 'Plan' },
        h('div', { class: 't-tunnel20-head' }, h('span', null, 'Passage'), h('span', null, 'Person 1'), h('span', null, 'Person 2'), h('span', null, 'Min.')),
        h('div', { class: 't-tunnel20-rows' }, trs),
        h('div', { class: 't-tunnel20-total' + (over ? ' over' : ''), role: 'status' },
          h('span', null, 'Akku: ' + LIMIT + ' Minuten'),
          h('strong', { class: 'num' }, 'Dauer: ' + s.total + ' min'),
          h('span', { class: 't-tunnel20-bar', 'aria-hidden': 'true' }, h('span', { style: 'width:' + Math.min(100, s.total / LIMIT * 100) + '%' }))),
        msg)));
  }

  function onClick(e) {
    if (locked) return;
    var pb = e.target.closest('[data-person]');
    if (pb) { selected = selected === pb.dataset.person ? null : pb.dataset.person; render(); var f = el.querySelector('[data-person="' + (pb.dataset.person) + '"]'); if (f) f.focus(); return; }
    var cb = e.target.closest('[data-cell]');
    if (!cb) return;
    var rc = cb.dataset.cell.split(',').map(Number);
    if (selected) place(selected, rc[0], rc[1]);
    else if (rows[rc[0]][rc[1]]) clearCell(rc[0], rc[1]);
  }
  function onDragStart(e) {
    if (locked) return;
    var pb = e.target.closest('[data-person],[data-cell]');
    if (!pb) return;
    if (pb.dataset.person) dragging = { p: pb.dataset.person };
    else {
      var rc = pb.dataset.cell.split(',').map(Number);
      if (!rows[rc[0]][rc[1]]) return;
      dragging = { p: rows[rc[0]][rc[1]], from: rc };
    }
    e.dataTransfer.setData('text/plain', dragging.p);
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e) {
    if (!dragging) return;
    var t = e.target.closest('[data-cell],[data-pool]');
    if (!t) return;
    e.preventDefault();
    el.querySelectorAll('.over').forEach(function (x) { x.classList.remove('over'); });
    if (t.dataset.cell) t.classList.add('over');
  }
  function onDrop(e) {
    if (!dragging) return;
    var t = e.target.closest('[data-cell],[data-pool]');
    if (!t) return;
    e.preventDefault();
    var d = dragging;
    dragging = null;
    if (t.dataset.cell) {
      var rc = t.dataset.cell.split(',').map(Number);
      if (d.from) moveCell(d.from, rc[0], rc[1]); else place(d.p, rc[0], rc[1]);
    } else if (d.from) clearCell(d.from[0], d.from[1]);
  }
  function onDragEnd() { dragging = null; if (!locked) render(); }

  Biber.register({
    id: 'tunnel20',
    story: '<p>Anna und Benno machen mit ihren Eltern eine Wanderung. Auf ihrer Strecke liegt ein Tunnel. Aus Erfahrung wissen sie, wie viel Zeit jeder für die Tunnelpassage braucht: Anna 10 Minuten, Benno 5 Minuten, die Mutter 20 Minuten und der Vater 25 Minuten.</p>' +
      '<p>Den dunklen und engen Tunnel kann man nur alleine oder zu zweit passieren. Sie müssen also mehrere Passagen machen. Zu zweit braucht man so viel Zeit wie die langsamere der beiden Personen. Im Tunnel muss man auf jeden Fall eine Lampe benutzen.</p>' +
      '<p>Am Eingang stellen sie fest: Der Akku ihrer einzigen Lampe reicht nur noch für 60 Minuten. Können sie innerhalb dieser 60 Minuten alle durch den Tunnel kommen? Anna hat einen Plan: „Ja, können wir, und zwar mit fünf Passagen!“</p>',
    question: 'Ziehe die Namen so in die passenden Felder, dass Annas Plan umgesetzt wird.',
    howto: 'Ziehe eine Person in ein Feld. Jede Person kannst du mehrmals einsetzen. Du kannst auch erst die Person und dann das Feld antippen. Ein belegtes Feld antippen leert es.',
    explanation: function () {
      return '<p>Mutter und Vater sind die Langsamsten. Alle schaffen es nur in 60 Minuten, wenn die beiden den Tunnel zusammen und nur ein einziges Mal passieren (25 Minuten). Dafür muss vorher jemand die Lampe zu ihnen bringen und sie danach zurückholen: Anna und Benno gehen zuerst hindurch (10 Minuten), einer von beiden geht mit der Lampe zurück. Nach der Passage von Mutter und Vater bringt der andere die Lampe wieder zurück, und zum Schluss gehen Anna und Benno noch einmal zusammen (10 Minuten).</p>' +
        '<p>Es ist egal, ob zuerst Anna oder Benno zurückgeht: Die beiden Rückwege dauern zusammen 15 Minuten, insgesamt also 10 + 5 + 25 + 10 + 10 = 60 Minuten.</p>' +
        '<p>Anna hat einen Plan gemacht, der die Bedingung erfüllt (bei jeder Passage ist die Lampe dabei) und mit den vorhandenen Mitteln auskommt (60 Minuten Akku). Informatiksysteme, die selbstständig planen, etwa selbstfahrende Autos, müssen genau das leisten: Bedingungen einhalten und mit den Ressourcen auskommen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; rows = blank(); selected = null; dragging = null; locked = false; mode = null;
      el.addEventListener('click', onClick);
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', onDragEnd);
      render();
    },
    isComplete: function () { return rows.every(function (r) { return r[0] || r[1]; }); },
    evaluate: function () { return { correct: sim(rows).valid, answer: rows.map(function (r) { return r.slice(); }) }; },
    setAnswer: function (ans) { rows = ans.map(function (r) { return r.slice(); }); mode = null; render(); },
    lock: function (on) { locked = on; mode = on ? (mode === 'solution' ? 'solution' : 'check') : null; render(); },
    reset: function () { rows = blank(); selected = null; mode = null; render(); },
    showSolution: function () {
      rows = SOLUTION.map(function (r) { return r.slice(); });
      locked = true; mode = 'solution'; render();
    }
  });
})();
