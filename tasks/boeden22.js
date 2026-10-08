/* Aufgabe Bemalte Böden (Biber 2022; Klasse 11-13 schwer): Welcher Boden gehört zu welcher Mal-Regel? (Voronoi-Regionen) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-boeden22-';

  /* Symbole der Chips: Kürzel -> Name, Farbe, Form */
  var SYM = {
    o: { name: 'roter Kreis', col: '#e00831' },
    x: { name: 'blaues Kreuz', col: '#637fff' },
    q: { name: 'grünes Quadrat', col: '#16bc21' },
    s: { name: 'lila Stern', col: '#d200ff' },
    t: { name: 'oranges Dreieck', col: '#ff7000' }
  };
  var SYM_ORDER = ['o', 'x', 'q', 's', 't'];
  /* Die zehn Chips (Spalte, Zeile, Symbol) auf dem 30 x 30 Feldern großen Boden; auf allen vier Böden liegen sie gleich */
  var CHIPS = [[14, 0, 'o'], [5, 5, 't'], [20, 5, 't'], [20, 13, 'q'], [5, 17, 'x'], [8, 20, 's'], [21, 20, 'o'], [4, 23, 's'], [28, 24, 'x'], [18, 25, 't']];
  var N = 30;

  var RULES = [
    { n: 1, short: 'nächster Chip', text: 'das Symbol des Chips, der ihm am nächsten ist.' },
    { n: 2, short: 'am weitesten entfernter Chip', text: 'das Symbol des Chips, der am weitesten von ihm entfernt ist.' },
    { n: 3, short: 'zweitnächster Chip', text: 'das Symbol des Chips, der ihm am zweitnächsten ist.' },
    { n: 4, short: 'häufigstes Symbol bei den 6 nächsten Chips', text: 'das Symbol, das bei den 6 am nächsten liegenden Chips am häufigsten vorkommt.' }
  ];

  /* Die vier Böden wie im Heft (links oben, rechts oben, links unten, rechts unten), aus dem Heft ausgelesen; rule = richtige Regel */
  var FLOORS = [
    { label: 'A', rule: 3, grid: [
      'oooooooootttttotttttoooooooooo',
      'ooooooooootttttttttooooooooooo',
      'oooooooooottttttttooooooooooqq',
      'oooooooooottttttttooooooooqqqq',
      'xxooooooooottttttoooooooqqqqqq',
      'xxxxotoooootttttooootqqqqqqqqq',
      'xxxxxoooooootttoooooqqqqqqqqqq',
      'xxxxxxxxoooottoooqqqqqqqqqqqqq',
      'xxxxxxxxxooottoqqqqqqqqqqqqqqq',
      'xxxxxxxxxxxoqtttqqqqqqqqqqqqqq',
      'xxxxxxxxxxxxtttttttttttttttttt',
      'tttttttttttqxttttttttttttttttt',
      'tttttttsssssxstttttttttttttttt',
      'ttsssssssssssssoooooqooooooooo',
      'ssssssssssssxssooooooooooooooo',
      'sssssssssssxxqsoooooooooooooox',
      'ssssssssssxxxqsoooooooqqqqqqxo',
      'sssssxsssxxxxxqoqqqqqqqqqqqxoo',
      'ssssssssxxxxxxosqqqqqqqqqqxxoo',
      'sssssssxxxxxxtostttqqqqqxxxooo',
      'xxxxxssxsxxxxtsotttttotxxxoooo',
      'xxxxssssssssttsoootttttxxooooo',
      'xxxsssssssstttsoooottttxxooooo',
      'xxsssssssssttssoooooottxoooooo',
      'xxsssssssssttssooooooooooooooo',
      'xssssssssssttssoootooooooooooo',
      'ssssssssssstsssoootoooxtttoooo',
      'sssssssssssssssoooooooxtttttoo',
      'sssssssssssssssoooooooxtttttoo',
      'sssssssssstssssooooooxxttttttt'
    ] },
    { label: 'B', rule: 2, grid: [
      'xxxxxxxxxxxxxxoxxxssssssssssss',
      'xxxxxxxxxxxxxxxxxsssssssssssss',
      'xxxxxxxxxxxxxxxxxsssssssssssss',
      'xxxxxxxxxxxxxxxxxsssssssssssss',
      'xxxxxxxxxxxxxxxxxsssssssssssss',
      'xxxxxtxxxxxxxxxxxssstsssssssss',
      'xxxxxxxxxxxxxxxxxsssssssssssss',
      'xxxxxxxxxxxxxxxxxsssssssssssss',
      'xxxxxxxxxxxxxxxxxsssssssssssss',
      'xxxxxxxxxxxxxxxxxsssssssssssss',
      'xxxxxxxxxxxxxxxxxsssssssssssss',
      'xxxxxxxxxxxxxxxxxsssssssssssss',
      'xxxxxxxxxxxxxxxxxsssssssssssss',
      'xxxxxxxxxxxxxxxxxsssqsssssssss',
      'xxxxxxxxxxxxxxxxxsssssssssssss',
      'xxxxxxxxxxxxxxxxxttsssssssssss',
      'xxxxxxxxxxxxxxxxtttttttttttttt',
      'xxxxxxxxxxxxxoooottttttttttttt',
      'xxxxxxxxxxxxooooottttttttttttt',
      'xxxxxxxxxxooooooootttttttttttt',
      'xxxxxxxxsoooooooootttotttttttt',
      'xxxxxxxoooooooooooottttttttttt',
      'xxxxxoooooooooooooottttttttttt',
      'xxxosoooooooooooooootttttttttt',
      'xxoooooooooooooooooottttttttxt',
      'oooooooooooooooooototttttttttt',
      'ooooooooooooooooooooottttttttt',
      'ooooooooooooooooooooootttttttt',
      'ooooooooooooooooooooootttttttt',
      'ooooooooooooooooooooooottttttt'
    ] },
    { label: 'C', rule: 1, grid: [
      'tttttttttoooooooooootttttttttt',
      'tttttttttoooooooooottttttttttt',
      'ttttttttttooooooootttttttttttt',
      'ttttttttttooooooootttttttttttt',
      'tttttttttttoooooottttttttttttt',
      'tttttttttttoooootttttttttttttt',
      'ttttttttttttooottttttttttttttt',
      'ttttttttttttootttttttttttttttt',
      'ttttttttttttootttttttttttttttt',
      'tttttttttttttqqqtttttttttttttt',
      'ttttttttttttqqqqqqqqqqqqqqqqqq',
      'xxxxxxxxxxxxqqqqqqqqqqqqqqqqqq',
      'xxxxxxxxxxxxqqqqqqqqqqqqqqqqqq',
      'xxxxxxxxxxxxxqqqqqqqqqqqqqqqqq',
      'xxxxxxxxxxxssqqqqqqqqqqqqqqqqq',
      'xxxxxxxxxxxsssqqqqqqqqqqqqqqqo',
      'xxxxxxxxxxssssqqqqqqqqooooooox',
      'xxxxxxxxxssssssqooooooooooooxx',
      'xxxxxxxxsssssssooooooooooooxxx',
      'xxxxxxxssssssssooooooooooooxxx',
      'ssssssssssssssttooooooooooxxxx',
      'sssssssssssssstttooooooooxxxxx',
      'sssssssssssssstttttooooooxxxxx',
      'ssssssssssssstttttttttooxxxxxx',
      'ssssssssssssttttttttttooxxxxxx',
      'sssssssssssstttttttttttxxxxxxx',
      'sssssssssssttttttttttttxxxxxxx',
      'sssssssssssttttttttttttxxxxxxx',
      'sssssssssssttttttttttttxxxxxxx',
      'sssssssssssttttttttttttxxxxxxx'
    ] },
    { label: 'D', rule: 4, grid: [
      'ttttttttttttttooooootttttttttt',
      'tttttttttttttttoooootttttttttt',
      'tttttttttttttttoootttttttttttt',
      'tttttttttttttttoootttttttttttt',
      'tttttttttttttttoottttttttttttt',
      'tttttttttttttttotttttttttttttt',
      'tttttttttttttttotttttttttttttt',
      'tttttttttttttttttttttttttttttt',
      'sssssstttttttttttttttttttttttt',
      'sssssssttttttttttttttttttttttt',
      'sssssssstttttttttttttttttttttt',
      'ssssssssstttttooootttttttttttt',
      'ssssssssssttttooootttttttttttt',
      'ssssssssssstttttttooqooooooooo',
      'sssssssssssstttttttttttttooooo',
      'sssssssssssssttttttttttttttooo',
      'sssssssssssssstttttttttttttttt',
      'sssssxsssssssssstttttttttttttt',
      'sssssssssssssssssxxttttttttttt',
      'sssssssssssssssssxxttttttttttt',
      'sssssssssssssssssxxxtotttttttt',
      'sssssssssssssssssxxxxttttttttt',
      'sssssssssssssssssxxxxxtttttttt',
      'sssssssssssssssssssssssttttttt',
      'ssssssssssssssssssssssssttttxt',
      'sssssssssssssssssstssssssttttt',
      'sssssssssssssssssssssssssstttt',
      'sssssssssssssssssssssssssssttt',
      'sssssssssssssssssssssssssssstt',
      'ssssssssssssssssssssssssssssst'
    ] }
  ];
  /* Absicherung: Zuordnung A=3, B=2, C=1, D=4 wie im Heft; per Skript über die ausgelesenen Böden bestätigt (die richtige Regel passt bei 95 bis 99 % der Felder, jede andere nur bei höchstens 46 %; die Abweichungen sind Grenzfelder). */

  /* ---------- Regeln auswerten ---------- */
  function pred(i, j) {
    var ds = CHIPS.map(function (c, k) { return { k: k, d: (i - c[0]) * (i - c[0]) + (j - c[1]) * (j - c[1]), s: c[2] }; });
    ds.sort(function (a, b) { return a.d - b.d || a.k - b.k; });
    function tied(idx) { return ds.filter(function (x) { return x.d === ds[idx].d; }); }
    function syms(list) { var o = {}; list.forEach(function (x) { o[x.s] = true; }); return SYM_ORDER.filter(function (s) { return o[s]; }); }
    var near = tied(0), far = tied(ds.length - 1), second = tied(1);
    /* Regel 4: sechs nächste; bei Gleichstand an der Grenze kommen alle möglichen Auswahlen in Frage */
    var six = ds.slice(0, 6), edge = ds[5].d;
    var inner = ds.filter(function (x) { return x.d < edge; }), border = ds.filter(function (x) { return x.d === edge; });
    var need = 6 - inner.length, res = {};
    (function pick(start, chosen) {
      if (chosen.length === need) {
        var cnt = {}, mx = 0;
        inner.concat(chosen).forEach(function (x) { cnt[x.s] = (cnt[x.s] || 0) + 1; mx = Math.max(mx, cnt[x.s]); });
        Object.keys(cnt).forEach(function (s) { if (cnt[s] === mx) res[s] = true; });
        return;
      }
      for (var m = start; m < border.length; m++) pick(m + 1, chosen.concat([border[m]]));
    })(0, []);
    return {
      r: { 1: syms(near), 2: syms(far), 3: syms(second), 4: SYM_ORDER.filter(function (s) { return res[s]; }) },
      near: near, far: far, second: second, six: inner.concat(border.slice(0, need))
    };
  }
  function chipAt(i, j) { return CHIPS.filter(function (c) { return c[0] === i && c[1] === j; })[0] || null; }

  /* ---------- Symbole als SVG (Legende, Tabelle) ---------- */
  function starPts(cx, cy, ro, ri) {
    var p = [];
    for (var k = 0; k < 10; k++) { var a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? ri : ro; p.push((cx + r * Math.cos(a)).toFixed(2) + ',' + (cy + r * Math.sin(a)).toFixed(2)); }
    return p.join(' ');
  }
  function symSvg(s, cls) {
    var c = SYM[s].col, body;
    if (s === 'o') body = '<circle cx="12" cy="12" r="8" fill="' + c + '"/>';
    else if (s === 'x') body = '<path d="M5 5L19 19M19 5L5 19" stroke="' + c + '" stroke-width="4.2" fill="none"/>';
    else if (s === 'q') body = '<rect x="4.5" y="4.5" width="15" height="15" fill="' + c + '"/>';
    else if (s === 's') body = '<polygon points="' + starPts(12, 12.6, 10.5, 4.3) + '" fill="' + c + '"/>';
    else body = '<polygon points="3,12 19.5,2.5 19.5,21.5" fill="' + c + '"/>';
    return '<svg class="' + (cls || P + 'sym') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + body + '</svg>';
  }
  function symList(list) {
    return list.map(function (s) { return '<span class="' + P + 'sl">' + symSvg(s) + '<span>' + SYM[s].name + '</span></span>'; }).join('<span class="' + P + 'or"> oder </span>');
  }
  function symNames(list) { return list.map(function (s) { return SYM[s].name; }).join(' oder '); }

  /* ---------- Boden auf Canvas zeichnen ---------- */
  function glyph(ctx, s, cx, cy, u, scale) {
    var k = u * scale;
    ctx.fillStyle = ctx.strokeStyle = SYM[s].col;
    ctx.beginPath();
    if (s === 'o') { ctx.arc(cx, cy, 0.3 * k, 0, 6.2832); ctx.fill(); }
    else if (s === 'x') {
      ctx.lineWidth = Math.max(1.2, 0.13 * k); ctx.lineCap = 'butt';
      ctx.moveTo(cx - 0.3 * k, cy - 0.3 * k); ctx.lineTo(cx + 0.3 * k, cy + 0.3 * k);
      ctx.moveTo(cx + 0.3 * k, cy - 0.3 * k); ctx.lineTo(cx - 0.3 * k, cy + 0.3 * k); ctx.stroke();
    } else if (s === 'q') ctx.fillRect(cx - 0.26 * k, cy - 0.26 * k, 0.52 * k, 0.52 * k);
    else if (s === 's') {
      for (var m = 0; m < 10; m++) { var a = -Math.PI / 2 + m * Math.PI / 5, r = (m % 2 ? 0.14 : 0.36) * k; ctx[m ? 'lineTo' : 'moveTo'](cx + r * Math.cos(a), cy + 0.03 * k + r * Math.sin(a)); }
      ctx.closePath(); ctx.fill();
    } else { ctx.moveTo(cx - 0.3 * k, cy); ctx.lineTo(cx + 0.24 * k, cy - 0.3 * k); ctx.lineTo(cx + 0.24 * k, cy + 0.3 * k); ctx.closePath(); ctx.fill(); }
  }
  function roundRect(ctx, x, y, w, hh, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + hh, r); ctx.arcTo(x + w, y + hh, x, y + hh, r);
    ctx.arcTo(x, y + hh, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function paint(fi) {
    var cv = canvases[fi], css = cv.clientWidth;
    if (!css) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 3), W = Math.round(css * dpr);
    if (cv.width !== W) { cv.width = W; cv.height = W; }
    var ctx = cv.getContext('2d'), u = W / N, grid = FLOORS[fi].grid, i, j;
    ctx.fillStyle = '#333333'; ctx.fillRect(0, 0, W, W);
    for (j = 0; j < N; j++) for (i = 0; i < N; i++) {
      if (!chipAt(i, j)) glyph(ctx, grid[j].charAt(i), (i + 0.5) * u, (j + 0.5) * u, u, 1);
    }
    var pr = probe && probe.f === fi ? probe : null, pd = pr ? pred(pr.i, pr.j) : null;
    if (pr) {
      var px = (pr.i + 0.5) * u, py = (pr.j + 0.5) * u;
      var isNear = {}, isFar = {}, isSec = {}, isSix = {};
      pd.near.forEach(function (x) { isNear[x.k] = true; }); pd.far.forEach(function (x) { isFar[x.k] = true; });
      pd.second.forEach(function (x) { isSec[x.k] = true; }); pd.six.forEach(function (x) { isSix[x.k] = true; });
      var cx = function (c) { return (c[0] + 0.5) * u; }, cy = function (c) { return (c[1] + 0.5) * u; };
      CHIPS.forEach(function (c, k) {
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(cx(c), cy(c));
        ctx.strokeStyle = isSix[k] ? 'rgba(120,230,255,0.55)' : 'rgba(255,255,255,0.18)'; ctx.lineWidth = Math.max(1, u * 0.06); ctx.stroke();
      });
      [[isNear, '1'], [isSec, '3'], [isFar, '2']].forEach(function (pair) {
        CHIPS.forEach(function (c, k) {
          if (!pair[0][k]) return;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(cx(c), cy(c));
          ctx.strokeStyle = '#2ee6ff'; ctx.lineWidth = Math.max(2, u * 0.18); ctx.stroke();
        });
      });
    }
    CHIPS.forEach(function (c) {
      var x = (c[0] + 0.5) * u, y = (c[1] + 0.5) * u;
      ctx.fillStyle = '#e9cfbb'; roundRect(ctx, x - 0.46 * u, y - 0.46 * u, 0.92 * u, 0.92 * u, 0.2 * u); ctx.fill();
      ctx.strokeStyle = '#c4a58c'; ctx.lineWidth = Math.max(1, u * 0.05); ctx.stroke();
      glyph(ctx, c[2], x, y, u, 1.15);
    });
    if (pr) {
      [[pd.near, '1'], [pd.second, '3'], [pd.far, '2']].forEach(function (pair) {
        pair[0].forEach(function (x) {
          var c = CHIPS[x.k], bx = (c[0] + 0.5) * u + 0.55 * u, by = (c[1] + 0.5) * u - 0.55 * u, r = Math.max(5, 0.62 * u);
          ctx.beginPath(); ctx.arc(bx, by, r, 0, 6.2832); ctx.fillStyle = '#2ee6ff'; ctx.fill();
          ctx.fillStyle = '#06222a'; ctx.font = '700 ' + Math.round(r * 1.5) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(pair[1], bx, by + 0.5);
        });
      });
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(2, u * 0.16);
      ctx.strokeRect(pr.i * u + ctx.lineWidth / 2, pr.j * u + ctx.lineWidth / 2, u - ctx.lineWidth, u - ctx.lineWidth);
      ctx.strokeStyle = '#000000'; ctx.lineWidth = Math.max(1, u * 0.06);
      ctx.strokeRect(pr.i * u + 1, pr.j * u + 1, u - 2, u - 2);
    }
  }
  function paintAll() { for (var f = 0; f < FLOORS.length; f++) paint(f); }

  var el, api, canvases, radios, heads, probeBox, noteEl, assign, probe, locked, mark, ro;

  function reset() { assign = [0, 0, 0, 0]; probe = null; mark = null; }

  /* ---------- Feld untersuchen ---------- */
  function describeProbe() {
    if (!probe) {
      probeBox.innerHTML = '<p>Tippe auf ein Feld eines Bodens (oder wähle es mit den Pfeiltasten), dann siehst du, welches Symbol jede der vier Regeln dort malen würde. Die Linien zeigen die Entfernungen zu den Chips.</p>';
      return;
    }
    var f = FLOORS[probe.f], s = f.grid[probe.j].charAt(probe.i), chip = chipAt(probe.i, probe.j);
    var head = '<p class="' + P + 'where"><strong>Boden ' + f.label + ', Spalte ' + (probe.i + 1) + ', Zeile ' + (probe.j + 1) + '.</strong> ';
    if (chip) {
      probeBox.innerHTML = head + 'Hier liegt ein Chip (' + symList([chip[2]]) + '). Auf Felder mit Chip malt der Roboter nichts. Wähle ein Feld ohne Chip.</p>';
      return;
    }
    var pd = pred(probe.i, probe.j);
    var rows = RULES.map(function (r) {
      var set = pd.r[r.n], hit = set.indexOf(s) >= 0;
      return '<tr class="' + (hit ? P + 'hit' : '') + '"><th scope="row">Regel ' + r.n + '<span>' + r.short + '</span></th><td>' + symList(set) + '</td></tr>';
    }).join('');
    probeBox.innerHTML = head + 'Hier ist gemalt: ' + symList([s]) + '</p>' +
      '<table class="' + P + 'ptab"><caption>Das würde jede Regel an diesem Feld malen (hervorgehoben: stimmt mit dem Bild überein):</caption><tbody>' + rows + '</tbody></table>';
  }
  function setProbe(f, i, j, focus) {
    probe = { f: f, i: Math.max(0, Math.min(N - 1, i)), j: Math.max(0, Math.min(N - 1, j)) };
    paintAll();
    describeProbe();
    if (focus) canvases[f].focus();
  }
  function onCanvasClick(f, e) {
    var r = canvases[f].getBoundingClientRect();
    setProbe(f, Math.floor((e.clientX - r.left) / r.width * N), Math.floor((e.clientY - r.top) / r.height * N), false);
  }
  function onCanvasKey(f, e) {
    var d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!d) return;
    e.preventDefault();
    var p = probe && probe.f === f ? probe : { i: 14, j: 14 };
    if (!probe || probe.f !== f) return setProbe(f, p.i, p.j, false);
    setProbe(f, p.i + d[0], p.j + d[1], false);
  }

  /* ---------- Regeln zuordnen ---------- */
  function setRule(f, n) {
    if (locked) return;
    var moved = null;
    for (var g = 0; g < 4; g++) if (g !== f && assign[g] === n) { assign[g] = 0; moved = g; }
    assign[f] = assign[f] === n ? 0 : n;
    noteEl.textContent = moved !== null && assign[f] === n ? 'Regel ' + n + ' gehört jetzt zu Boden ' + FLOORS[f].label + '. Boden ' + FLOORS[moved].label + ' hat dadurch keine Regel mehr.' : '';
    refresh();
    api.changed();
  }
  function refresh() {
    FLOORS.forEach(function (fl, f) {
      radios[f].forEach(function (b, k) {
        var n = k + 1, on = assign[f] === n, ok = n === fl.rule;
        b.setAttribute('aria-checked', String(on));
        b.setAttribute('aria-disabled', locked ? 'true' : 'false');
        b.classList.toggle('selected', on);
        b.classList.toggle('right', on && mark !== null && ok);
        b.classList.toggle('wrong', on && mark === 'check' && !ok);
        var used = false; assign.forEach(function (a, g) { if (g !== f && a === n) used = true; });
        b.classList.toggle(P + 'used', used && !on);
      });
      var first = radios[f].filter(function (b) { return b.getAttribute('aria-checked') === 'true'; })[0] || radios[f][0];
      radios[f].forEach(function (b) { b.tabIndex = b === first ? 0 : -1; });
      var m = heads[f].querySelector('.' + P + 'mark');
      if (m) m.remove();
      if (mark !== null && assign[f]) {
        var ok2 = assign[f] === fl.rule;
        heads[f].appendChild(h('span', { class: P + 'mark ' + (ok2 ? P + 'ok' : P + 'no'), 'aria-hidden': 'true' }, ok2 ? '✓' : '✗'));
      }
    });
  }
  function onRuleKey(f, e) {
    var k = e.key, i = radios[f].indexOf(e.currentTarget), to = null;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % 4;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + 3) % 4;
    if (to === null) return;
    e.preventDefault();
    setRule(f, to + 1);
    radios[f][to].focus();
  }

  Biber.register({
    id: 'boeden22',
    story:
      '<p>Der Boden eines quadratischen Raumes ist in 30 × 30 Felder unterteilt. Auf zehn Feldern liegen Chips mit farbigen Symbolen (roter Kreis, blaues Kreuz, grünes Quadrat, lila Stern, oranges Dreieck).</p>' +
      '<p>Ein Roboter soll den Boden mit diesen Symbolen bemalen, Feld für Feld. Er hat dafür vier verschiedene Regeln. Auf einem Feld, auf dem kein Chip liegt, malt er …</p>' +
      '<ol><li>… das Symbol des Chips, der ihm <b>am nächsten</b> ist.</li>' +
      '<li>… das Symbol des Chips, der <b>am weitesten</b> von ihm entfernt ist.</li>' +
      '<li>… das Symbol des Chips, der ihm <b>am zweitnächsten</b> ist.</li>' +
      '<li>… das Symbol, das bei den <b>6 am nächsten</b> liegenden Chips am häufigsten vorkommt.</li></ol>' +
      '<p>Der Roboter bemalt alle Felder nach derselben Regel. Wenn die Regel für ein Feld mehrere mögliche Symbole ergibt, sucht der Roboter sich zufällig eines davon aus. Unten siehst du vier Böden, jeder ist nach einer anderen Regel bemalt.</p>',
    question: 'Welcher Boden passt zu welcher Regel?',
    howto: 'Wähle unter jedem Boden die Regel 1 bis 4 (jede Regel gehört zu genau einem Boden). Zum Untersuchen tippst du auf ein Feld, dann siehst du die Abstände zu den Chips und was jede Regel dort malen würde.',
    explanation: function () {
      return '<p>Weil der Roboter alle Felder nach derselben Regel bemalt, genügt es, auf jedem Boden <strong>ein einzelnes Feld</strong> zu prüfen:</p>' +
        '<ul><li><strong>Boden A – Regel 3:</strong> Das Feld hat das Symbol des zweitnächsten Chips, nicht des nächsten.</li>' +
        '<li><strong>Boden B – Regel 2:</strong> Die Flächen haben das Symbol des am weitesten entfernten Chips.</li>' +
        '<li><strong>Boden C – Regel 1:</strong> Jedes Feld hat das Symbol des nächsten Chips.</li>' +
        '<li><strong>Boden D – Regel 4:</strong> Hier entscheidet das Symbol, das unter den 6 nächsten Chips am häufigsten vorkommt.</li></ul>' +
        '<p>Die Mal-Regeln sind Algorithmen, nach denen eine Fläche in Bereiche eingeteilt wird. Besonders wichtig ist Regel 1: Sie teilt den Boden in <em>Voronoi-Regionen</em>. Jede Region gehört zu einem Zentrum (hier einem Chip), und alle Punkte der Region liegen diesem Zentrum näher als jedem anderen. Voronoi-Diagramme nutzt man zum Beispiel in der Mobilfunkversorgung oder um zu untersuchen, welche Schule oder welches Krankenhaus am nächsten liegt. Zum Berechnen gibt es effiziente Algorithmen, zum Beispiel den von Fortune (ein „Sweep-Line“-Verfahren).</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      canvases = []; radios = []; heads = [];
      var legend = h('ul', { class: P + 'legend', 'aria-label': 'Chips' });
      legend.innerHTML = SYM_ORDER.map(function (s) { return '<li>' + symSvg(s) + '<span>' + SYM[s].name + '</span></li>'; }).join('');
      var cards = FLOORS.map(function (fl, f) {
        var cv = h('canvas', {
          class: P + 'cv', tabindex: '0', role: 'img',
          'aria-label': 'Boden ' + fl.label + ', 30 mal 30 Felder. Mit den Pfeiltasten wählst du ein Feld zum Untersuchen aus.',
          onclick: function (e) { onCanvasClick(f, e); }, onkeydown: function (e) { onCanvasKey(f, e); }
        });
        canvases.push(cv);
        var head = h('div', { class: P + 'head' }, h('strong', null, 'Boden ' + fl.label));
        heads.push(head);
        var btns = [1, 2, 3, 4].map(function (n) {
          return h('button', {
            type: 'button', role: 'radio', class: P + 'rule', 'aria-checked': 'false',
            'aria-label': 'Boden ' + fl.label + ': Regel ' + n + ' (' + RULES[n - 1].short + ')',
            onclick: function () { setRule(f, n); }, onkeydown: function (e) { onRuleKey(f, e); }
          }, h('span', { class: P + 'rn' }, String(n)));
        });
        radios.push(btns);
        return h('div', { class: P + 'card' }, head, h('div', { class: P + 'cvwrap' }, cv),
          h('span', { class: P + 'lbl', 'aria-hidden': 'true' }, 'Welche Regel?'),
          h('div', { class: P + 'rules', role: 'radiogroup', 'aria-label': 'Regel für Boden ' + fl.label }, btns));
      });
      probeBox = h('div', { class: P + 'probe', role: 'status', 'aria-live': 'polite' });
      noteEl = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('div', { class: P + 'floors' }, cards),
        noteEl,
        h('section', { class: P + 'side', 'aria-label': 'Feld untersuchen' }, h('h3', null, 'Feld untersuchen'), probeBox, h('h3', { class: P + 'h2' }, 'Chips'), legend)));
      describeProbe();
      refresh();
      if (window.ResizeObserver) {
        if (ro) ro.disconnect();
        ro = new ResizeObserver(paintAll);
        canvases.forEach(function (cv) { ro.observe(cv); });
      } else window.addEventListener('resize', paintAll);
      requestAnimationFrame(paintAll);
    },
    isComplete: function () { return assign.every(Boolean); },
    evaluate: function () {
      var ok = FLOORS.every(function (fl, f) { return assign[f] === fl.rule; });
      return { correct: ok, answer: { rules: assign.slice() } };
    },
    setAnswer: function (ans) {
      assign = (ans && ans.rules ? ans.rules.slice(0, 4) : [0, 0, 0, 0]);
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      noteEl.textContent = '';
      refresh();
    },
    reset: function () { reset(); noteEl.textContent = ''; describeProbe(); refresh(); paintAll(); },
    showSolution: function () {
      assign = FLOORS.map(function (fl) { return fl.rule; });
      mark = 'solution'; locked = true;
      refresh();
    }
  });
})();
