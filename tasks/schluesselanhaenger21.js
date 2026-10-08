/* Aufgabe Schlüsselanhänger (Heft 2021, S. 46; Klasse 3-4 mittel, 5-6 leicht): Kodes mit variabler Wortlänge, Perlen-Morsecode */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-schluesselanhaenger21-';

  /* G = grüne runde Perle, R = rote Raute, "." = kleine Perle zwischen den Buchstaben */
  var GIVEN = [
    { name: 'ANNA', beads: 'GR.RG.RG.GR' },
    { name: 'BELLA', beads: 'RGGG.G.GRGG.GRGG.GR' }
  ];
  /* Aus ANNA und BELLA ablesbare Kodetabelle (Heft S. 46) */
  var CODE = { A: 'GR', N: 'RG', B: 'RGGG', E: 'G', L: 'GRGG' };
  var OPTIONS = [
    { key: 'A', beads: 'GRGG.G.RG.GR' },
    { key: 'B', beads: 'RGGG.G.RG.GR' },
    { key: 'C', beads: 'RG.G.RG.GR' },
    { key: 'D', beads: 'GRGG.G.GR.RG' }
  ];
  var RIGHT = 0;   /* A: LENA = L E N A; im Heft bestätigt, per Skript (eindeutiges Dekodieren aller vier Antworten) geprüft */

  function decode(beads) {
    var inv = {};
    Object.keys(CODE).forEach(function (k) { inv[CODE[k]] = k; });
    return beads.split('.').map(function (w) { return inv[w] || '?'; }).join('');
  }

  /* ---------- Zeichnung einer Perlenkette ---------- */
  var BW = { G: 22, R: 17, '.': 8 };
  function beadSvg(c, x) {
    if (c === 'G') return '<circle class="' + P + 'g" cx="' + (x + 11) + '" cy="20" r="11"/><circle class="' + P + 'gl" cx="' + (x + 7) + '" cy="15.5" r="3"/>';
    if (c === 'R') return '<path class="' + P + 'r" d="M' + (x + 8.5) + ' 6 L' + (x + 17) + ' 20 L' + (x + 8.5) + ' 34 L' + x + ' 20Z"/><path class="' + P + 'rl" d="M' + (x + 8.5) + ' 6 L' + (x + 17) + ' 20 L' + (x + 8.5) + ' 20 L' + (x + 4) + ' 13Z"/>';
    return '<rect class="' + P + 's" x="' + x + '" y="16" width="8" height="8" rx="1"/>';
  }
  function chainWidth(beads) {
    var w = 0;
    beads.split('').forEach(function (c) { w += BW[c]; });
    return 30 + w + 12 + 70;
  }
  var MAXW = 0;
  GIVEN.concat(OPTIONS).forEach(function (o) { MAXW = Math.max(MAXW, chainWidth(o.beads)); });
  function chainSvg(beads, label, extra) {
    var x = 30, out = '', i;
    for (i = 0; i < beads.length; i++) { out += beadSvg(beads[i], x); x += BW[beads[i]]; }
    var end = x + 12;
    var W = chainWidth(beads);
    var tassel = '<path class="' + P + 'tas" d="M30 20 L6 12 M30 20 L3 18 M30 20 L5 25 M30 20 L10 31 M30 20 L8 6"/>';
    var key = '<path class="' + P + 'cord" d="M' + (x - 1) + ' 20 L' + (end + 6) + ' 20"/>' +
      '<circle class="' + P + 'ring" cx="' + (end + 8) + '" cy="20" r="9"/>' +
      '<path class="' + P + 'shaft" d="M' + (end + 17) + ' 20 L' + (end + 60) + ' 20 L' + (end + 60) + ' 26 M' + (end + 52) + ' 20 L' + (end + 52) + ' 25"/>';
    return '<svg class="' + P + 'chain ' + (extra || '') + '" viewBox="0 0 ' + W + ' 40" role="img" aria-label="' + label + '" style="max-width:' + Math.round(W * 1.5) + 'px">' +
      '<path class="' + P + 'cord" d="M30 20 L' + x + ' 20"/>' + tassel + out + key + '</svg>';
  }
  function beadWords(beads) {
    return beads.split('.').map(function (w) {
      return w.split('').map(function (c) { return c === 'G' ? 'rund' : 'Raute'; }).join(' ');
    }).join(', dann kleine Perle, dann ');
  }
  function labelFor(name, beads) {
    return name + ': ' + beadWords(beads).replace(/rund/g, 'grün rund').replace(/Raute/g, 'rote Raute');
  }

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
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }

  function legend() {
    var d = h('div', { class: P + 'legend' });
    d.innerHTML =
      '<span class="' + P + 'leg"><svg viewBox="0 0 24 40" width="24" height="40" role="img" aria-label="grüne runde Perle">' + beadSvg('G', 1) + '</svg>grüne Perle</span>' +
      '<span class="' + P + 'leg"><svg viewBox="0 0 20 40" width="20" height="40" role="img" aria-label="rote Raute">' + beadSvg('R', 1.5) + '</svg>rote Raute</span>' +
      '<span class="' + P + 'leg"><svg viewBox="0 0 12 40" width="12" height="40" role="img" aria-label="kleine Perle">' + beadSvg('.', 2) + '</svg>kleine Perle zwischen den Buchstaben</span>';
    return d;
  }

  Biber.register({
    id: 'schluesselanhaenger21',
    story:
      '<p>ANNA, BELLA und LENA machen Schlüsselanhänger mit ihren Namen. Sie „schreiben“ die Buchstaben mit zwei Sorten Perlen: einer grünen runden Perle und einer roten Raute. Alle drei machen die Buchstaben genau gleich. Zwischen zwei Buchstaben kommt eine kleine Perle.</p>' +
      '<p>ANNA und BELLA haben diese Schlüsselanhänger gemacht:</p>',
    question: 'Welchen Schlüsselanhänger hat LENA gemacht?',
    howto: 'Überlege dir, wie ANNA und BELLA die Buchstaben schreiben. Tippe dann auf den Schlüsselanhänger, den LENA gemacht hat.',
    explanation: function () {
      function codeCell(k) {
        var x = 2, out = '';
        CODE[k].split('').forEach(function (c) { out += beadSvg(c, x); x += BW[c]; });
        return '<svg class="' + P + 'code" viewBox="0 0 ' + (x + 2) + ' 40" role="img" aria-label="Perlen für ' + k + ': ' + beadWords(CODE[k]) + '" style="width:' + Math.round((x + 2) * 1.3) + 'px">' + out + '</svg>';
      }
      var table = '<table class="' + P + 'table"><thead><tr><th scope="col">Buchstabe</th><th scope="col">Perlen</th></tr></thead><tbody>' +
        Object.keys(CODE).map(function (k) { return '<tr><th scope="row">' + k + '</th><td>' + codeCell(k) + '</td></tr>'; }).join('') + '</tbody></table>';
      return '<p>Aus ANNA und BELLA lässt sich ablesen, wie jeder Buchstabe geschrieben wird:</p>' + table +
        '<p>LENA beginnt also mit dem Kode für L (grün, rot, grün, grün) und dem Kode für E (grün). Das passt zu <strong>A</strong> und <strong>D</strong>. Danach kommt N (rot, grün) und A (grün, rot): Das gibt es nur bei <strong>A</strong>. ' +
        'Bei D folgt nämlich „grün, rot, rot, grün“ – das ist A und N, also LEAN. B ergibt BENA und C ergibt NENA.</p>' +
        '<p>Ein Kode, bei dem die Buchstaben unterschiedlich viele Zeichen haben, ist nur dann eindeutig lesbar, wenn man erkennt, wo ein Buchstabe aufhört. Das leistet hier die kleine Perle – wie die Pausen im Morsecode.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      var given = h('div', { class: P + 'given' }, GIVEN.map(function (g) {
        var d = h('div', { class: P + 'row' }, h('span', { class: P + 'name' }, g.name));
        var w = h('div', { class: P + 'chainbox' });
        w.innerHTML = chainSvg(g.beads, labelFor(g.name, g.beads));
        d.appendChild(w);
        return d;
      }));
      radios = OPTIONS.map(function (o, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': o.key,
          'aria-label': 'Antwort ' + o.key + ': ' + labelFor('Schlüsselanhänger', o.beads),
          onclick: function () { choose(i, false); }, onkeydown: onKey
        });
        btn.innerHTML = '<span class="' + P + 'key" aria-hidden="true">' + o.key + ')</span><span class="' + P + 'chainbox">' + chainSvg(o.beads, '') + '</span>';
        btn.querySelector('svg').setAttribute('aria-hidden', 'true');
        btn.querySelector('svg').removeAttribute('role');
        return btn;
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { 'aria-label': 'Die Perlen' }, h('h3', null, 'Die Perlen'), legend()),
        h('section', { 'aria-label': 'Schlüsselanhänger von ANNA und BELLA' }, h('h3', null, 'ANNA und BELLA'), given),
        h('section', { 'aria-label': 'Antworten' }, h('h3', null, 'LENA hat gemacht …'),
          h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Antworten' }, radios))));
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
  /* Selbsttest (nur Entwicklung): decode(OPTIONS[i].beads) ergibt LEAN, BENA, NENA, LENA */
})();
