/* Aufgabe Prüf-Biber (Klasse 11-13, schwer): Paritätsbits / Hamming-Code, welcher Biber hält die falsche Flagge? */
(function () {
  'use strict';
  var h = Biber.h;

  /* ---------- Aufgabendaten ---------- */
  /* Flaggen laut Abbildung von links nach rechts (Biber 1 bis 7): R = rot, Y = gelb */
  var FLAGS = ['R', 'Y', 'Y', 'R', 'Y', 'R', 'R'];
  /* Prüf-Biber -> geprüfte Nachrichten-Biber */
  var CHECKS = [{ checker: 5, of: [1, 2, 3] }, { checker: 6, of: [1, 2, 4] }, { checker: 7, of: [2, 3, 4] }];
  /* Mittelpunkte der Biber im Bild (in Promille der Bildbreite) */
  var CX = [75, 205, 340, 475, 607.5, 742.5, 872.5];
  var BW = 125;                    /* Breite der Auswahlfläche (Promille) */

  function isRed(i) { return FLAGS[i - 1] === 'R'; }
  function flagName(c) { return c === 'R' ? 'rote' : 'gelbe'; }

  /* Lösung durch Herleitung: Nur Verdacht, wenn alle Prüfungen passen */
  function analyse() {
    var res = CHECKS.map(function (c) {
      var reds = c.of.filter(isRed).length;
      var should = reds % 2 === 1;                       /* ungerade Zahl roter Flaggen -> Prüf-Biber rot */
      var has = isRed(c.checker);
      return { checker: c.checker, of: c.of, reds: reds, should: should, has: has, ok: should === has };
    });
    /* Kandidaten: ein einzelner Biber, dessen Umdrehen alle Prüfungen erfüllt */
    var cand = [];
    for (var b = 1; b <= 7; b++) {
      var ok = res.every(function (r) {
        var members = r.of.concat([r.checker]);
        var n = members.filter(function (i) { return i === b ? !isRed(i) : isRed(i); }).length;
        return n % 2 === 0;
      });
      if (ok) cand.push(b);
    }
    return { checks: res, candidates: cand };
  }
  var AN = analyse();
  var CORRECT = AN.candidates[0];                        /* eindeutig: 1 */

  /* ---------- Bausteine ---------- */
  function flagSvg(c, label) {
    return '<svg class="pb-flag pb-flag-' + c + '" viewBox="0 0 26 22" width="22" height="19" role="img" aria-label="' + label + '" focusable="false">' +
      '<path d="M3 1 V21" class="pb-pole"/>' +
      (c === 'R' ? '<path d="M4 2 H22 L16 7.5 L22 13 H4 Z" class="pb-cloth"/>' : '<path d="M4 2 H19 L23 7.5 L19 13 H4 Z" class="pb-cloth"/>') + '</svg>';
  }
  function flagWord(c) { return flagSvg(c, flagName(c) + ' Flagge'); }

  var STORY =
    '<p>Der Biber-Boss setzt vier sogenannte <em>Nachrichten-Biber</em> ein: Sie halten Flaggen hoch, um Nachrichten zu senden. ' +
    'Jeder Nachrichten-Biber hält entweder eine rote Flagge ' + flagWord('R') + ' oder eine gelbe Flagge ' + flagWord('Y') + ' hoch.</p>' +
    '<p>Manchmal passiert es, dass ein Biber die falsche Flagge hochhält. Das möchte der Biber-Boss erkennen können. Deshalb bestimmt er zusätzlich drei <em>Prüf-Biber</em>.</p>' +
    '<p>Jeder Prüf-Biber prüft drei Nachrichten-Biber. Wenn diese drei eine ungerade Anzahl an roten Flaggen hochhalten sollen, dann soll ihr Prüf-Biber auch eine rote Flagge hochhalten, sonst eine gelbe. ' +
    'Wenn alle die richtigen Flaggen hochhalten, dann halten ein Prüf-Biber und seine Nachrichten-Biber zusammen eine gerade Anzahl von roten Flaggen hoch.</p>' +
    '<p>Der Boss nummeriert die Nachrichten- und Prüf-Biber und ordnet sie so einander zu:</p>' +
    '<table class="pb-table"><thead><tr><th scope="col">Nachrichten-Biber</th><th scope="col">Prüf-Biber</th></tr></thead><tbody>' +
    CHECKS.map(function (c) { return '<tr><td>' + c.of.join(', ') + '</td><td>' + c.checker + '</td></tr>'; }).join('') + '</tbody></table>' +
    '<p>Insgesamt werden in einer Nachricht nun sieben Flaggen hochgehalten. Der Biber-Boss sieht die Nachricht unten. Er bemerkt, dass genau einer der sieben Biber die falsche Flagge hochhält.</p>';

  /* ---------- Zustand und Anzeige ---------- */
  var el, api, locked, sel, mode, group, btns, note;      /* mode: null | 'check' | 'solution' */

  function describe(i) {
    var role = i <= 4 ? 'Nachrichten-Biber' : 'Prüf-Biber';
    var s = role + ' ' + i + ', hält eine ' + flagName(FLAGS[i - 1]) + ' Flagge hoch';
    var on = sel === i;
    s += on ? ', ausgewählt' : '';
    if (mode === 'check') {
      if (on && i === CORRECT) s += ', richtig';
      else if (on) s += ', falsch';
      else if (i === CORRECT) s += ', das war der Biber mit der falschen Flagge';
    }
    return s;
  }

  function render() {
    btns.forEach(function (b, k) {
      var i = k + 1, on = sel === i;
      var cls = 'pb-pick' + (on ? ' on' : '');
      if (mode === 'check' || mode === 'solution') {
        if (i === CORRECT) cls += on || mode === 'solution' ? ' right' : ' missing';
        else if (on) cls += ' wrong';
      }
      b.className = cls;
      b.setAttribute('aria-checked', String(on));
      b.setAttribute('aria-label', describe(i));
      b.tabIndex = (sel === i || (sel == null && i === 1)) && !locked ? 0 : -1;
      b.disabled = !!locked;
    });
    group.setAttribute('data-mode', mode || '');
    note.textContent = mode ? 'Biber ' + CORRECT + ' hält eine ' + flagName(FLAGS[CORRECT - 1]) + ' Flagge hoch, müsste aber eine ' + flagName(FLAGS[CORRECT - 1] === 'R' ? 'Y' : 'R') + ' Flagge hochhalten.' : '';
    note.hidden = !mode;
  }

  function choose(i, focus) {
    if (locked) return;
    sel = i;
    render();
    if (focus) btns[i - 1].focus();
    api.changed('Biber ' + i + ' ausgewählt');
  }

  function onKey(e) {
    var k = e.key, i = btns.indexOf(e.target.closest('.pb-pick')) + 1;
    if (!i || locked) return;
    var t = 0;
    if (k === 'ArrowRight' || k === 'ArrowDown') t = i % 7 + 1;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') t = (i + 5) % 7 + 1;
    else if (k === 'Home') t = 1;
    else if (k === 'End') t = 7;
    else return;
    e.preventDefault();
    choose(t, true);
  }

  /* ---------- Erklärung ---------- */
  function explain() {
    var rows = AN.checks.map(function (r) {
      var f = r.of.map(function (i) { return flagSvg(FLAGS[i - 1], 'Biber ' + i + ': ' + flagName(FLAGS[i - 1]) + ' Flagge'); }).join('');
      return '<li class="pb-chk ' + (r.ok ? 'pb-ok' : 'pb-bad') + '"><strong>Prüf-Biber ' + r.checker + '</strong> prüft Biber ' + r.of.join(', ') + ': ' + f +
        '<span class="pb-line">' + r.reds + ' rote Flagge' + (r.reds === 1 ? '' : 'n') + ', also ' + (r.reds % 2 ? 'ungerade' : 'gerade') + '. Prüf-Biber ' + r.checker + ' sollte ' +
        flagSvg(r.should ? 'R' : 'Y', (r.should ? 'rote' : 'gelbe') + ' Flagge') + ' halten, hält aber ' + flagSvg(r.has ? 'R' : 'Y', (r.has ? 'rote' : 'gelbe') + ' Flagge') + '. ' +
        '<span class="pb-res">' + (r.ok ? '✓ stimmt' : '✗ stimmt nicht') + '</span></span></li>';
    }).join('');
    return '<p>Man prüft jede Gruppe: Zusammen müssen Prüf-Biber und seine drei Nachrichten-Biber eine gerade Anzahl roter Flaggen haben.</p>' +
      '<ul class="pb-checks">' + rows + '</ul>' +
      '<p>Die Prüfungen von Biber 5 und Biber 6 schlagen an, die von Biber 7 nicht. Der Fehler liegt also bei einem Biber, der zu den Gruppen von 5 und 6 gehört, aber nicht zur Gruppe von 7: ' +
      'Das ist nur <strong>Biber 1</strong>. Er müsste eine gelbe statt der roten Flagge hochhalten.</p>' +
      '<p>Dieses Verfahren heißt <em>Paritätsprüfung</em>. Mit mehreren überlappenden Prüfungen, wie hier im sogenannten Hamming-Code, kann man einen einzelnen Fehler nicht nur bemerken, sondern auch genau lokalisieren und korrigieren.</p>';
  }

  Biber.register({
    id: 'pruefbiber',
    story: STORY,
    question: 'Welcher Biber hält die falsche Flagge hoch?',
    howto: 'Tippe den Biber an, der die falsche Flagge hochhält. Mit den Pfeiltasten wechselst du zwischen den Bibern.',
    explanation: explain,
    mount: function (root, a) {
      el = root; api = a; locked = false; sel = null; mode = null; btns = [];
      var img = h('img', { class: 'pb-img', src: 'assets/pruefbiber/biber.png', width: 1600, height: 489, alt: '', draggable: 'false' });
      group = h('div', { class: 'pb-row', role: 'radiogroup', 'aria-label': 'Sieben Biber mit Flaggen: 1 rot, 2 gelb, 3 gelb, 4 rot, 5 gelb, 6 rot, 7 rot', onkeydown: onKey }, img);
      for (var i = 1; i <= 7; i++) {
        var b = h('button', {
          type: 'button', role: 'radio', class: 'pb-pick', 'data-i': String(i),
          style: 'left:' + ((CX[i - 1] - BW / 2) / 10) + '%;width:' + (BW / 10) + '%',
          onclick: (function (k) { return function () { choose(k, false); }; })(i)
        });
        btns.push(b);
        group.appendChild(b);
      }
      note = h('p', { class: 'pb-note', 'aria-live': 'polite', hidden: true });
      el.replaceChildren(h('div', { class: 'pb-board' }, group, note));
      render();
    },
    isComplete: function () { return sel != null; },
    evaluate: function () { return { correct: sel === CORRECT, answer: sel }; },
    setAnswer: function (ans) {
      sel = typeof ans === 'number' ? ans : null;
      mode = sel == null ? null : 'check';
      locked = sel != null;
      render();
    },
    lock: function (on) {
      locked = on;
      mode = on ? 'check' : null;
      render();
    },
    reset: function () { sel = null; locked = false; mode = null; render(); },
    showSolution: function () { sel = CORRECT; locked = true; mode = 'solution'; render(); }
  });
})();
