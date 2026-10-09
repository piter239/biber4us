/* Aufgabe Prüf-Biber (Biber 2020; Klasse 11-13 schwer): Paritätsbits / Hamming-Code, welcher Biber hält die falsche Flagge? */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 'pb20-';

  /* ---------- Aufgabendaten ---------- */
  /* Flaggen laut Abbildung im Heft von links nach rechts (Biber 1 bis 7): R = rot, Y = gelb */
  var FLAGS = ['R', 'Y', 'R', 'Y', 'R', 'R', 'Y'];
  /* Prüf-Biber -> geprüfte Nachrichten-Biber */
  var CHECKS = [{ checker: 5, of: [1, 2, 3] }, { checker: 6, of: [1, 2, 4] }, { checker: 7, of: [2, 3, 4] }];
  /* Mittelpunkte der Biber im Bild (in Promille der Bildbreite) */
  var CX = [82, 217, 349, 482, 615, 747, 881];
  var BW = 128;                    /* Breite der Auswahlfläche (Promille) */

  function isRed(i) { return FLAGS[i - 1] === 'R'; }
  function flagName(c) { return c === 'R' ? 'rote' : 'gelbe'; }

  /* Lösung durch Herleitung: Welcher einzelne Biber erklärt alle Prüfergebnisse? */
  function analyse() {
    var res = CHECKS.map(function (c) {
      var reds = c.of.filter(isRed).length;
      var should = reds % 2 === 1;                       /* ungerade Zahl roter Flaggen -> Prüf-Biber rot */
      var has = isRed(c.checker);
      var all = c.of.concat([c.checker]).filter(isRed).length;
      return { checker: c.checker, of: c.of, reds: reds, all: all, should: should, has: has, ok: should === has };
    });
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
  var CORRECT = AN.candidates[0];                        /* eindeutig: 3 (stimmt mit dem Heft überein) */

  /* ---------- Bausteine ---------- */
  function flagSvg(c, label) {
    return '<svg class="' + P + 'flag ' + P + 'flag-' + c + '" viewBox="0 0 26 22" width="22" height="19" role="img" aria-label="' + label + '" focusable="false">' +
      '<path d="M3 1 V21" class="' + P + 'pole"/>' +
      (c === 'R' ? '<path d="M4 2 H22 L16 7.5 L22 13 H4 Z" class="' + P + 'cloth"/>' : '<path d="M4 2 H19 L23 7.5 L19 13 H4 Z" class="' + P + 'cloth"/>') + '</svg>';
  }
  function flagWord(c) { return flagSvg(c, flagName(c) + ' Flagge'); }

  var STORY =
    '<p>Der Biber-Boss setzt vier Biber ein, um den anderen Bibern Flaggen-Nachrichten zu senden. Jeder dieser <em>Nachrichten-Biber</em> hält entweder eine rote Flagge ' + flagWord('R') + ' oder eine gelbe Flagge ' + flagWord('Y') + ' hoch.</p>' +
    '<p>Es kann passieren, dass ein Biber die falsche Flagge hochhält. Das möchte der Biber-Boss erkennen können. Deshalb bestimmt er drei <em>Prüf-Biber</em>.</p>' +
    '<p>Jeder Prüf-Biber prüft drei Nachrichten-Biber. Wenn diese drei eine ungerade Anzahl an roten Flaggen hochhalten sollen, dann soll ihr Prüf-Biber auch eine rote Flagge hochhalten, sonst eine gelbe. ' +
    'Wenn alle die richtigen Flaggen hochhalten, dann halten ein Prüf-Biber und seine Nachrichten-Biber zusammen eine gerade Anzahl an roten Flaggen hoch.</p>' +
    '<p>Insgesamt werden in einer Nachricht nun sieben Flaggen hochgehalten. Der Boss gibt Nachrichten-Bibern und Prüf-Bibern Nummern und ordnet sie so einander zu:</p>' +
    '<table class="' + P + 'table"><thead><tr><th scope="col">Nachrichten-Biber</th><th scope="col">Prüf-Biber</th></tr></thead><tbody>' +
    CHECKS.map(function (c) { return '<tr><td>' + c.of.join(', ') + '</td><td>' + c.checker + '</td></tr>'; }).join('') + '</tbody></table>' +
    '<p>Der Biber-Boss sieht die Nachricht unten. Er weiß sofort, dass genau einer der sieben Biber die falsche Flagge hochhält.</p>';

  /* ---------- Zustand und Anzeige ---------- */
  var el, api, locked, sel, mode, group, btns, note, chips, hint, shown;      /* mode: null | 'check' | 'solution'; shown: Prüf-Biber der hervorgehobenen Gruppe oder null */

  function members(checker) {
    for (var k = 0; k < CHECKS.length; k++) if (CHECKS[k].checker === checker) return CHECKS[k].of.concat([checker]);
    return [];
  }

  function describe(i) {
    var role = i <= 4 ? 'Nachrichten-Biber' : 'Prüf-Biber';
    var s = role + ' ' + i + ', hält eine ' + flagName(FLAGS[i - 1]) + ' Flagge hoch';
    var on = sel === i;
    s += on ? ', ausgewählt' : '';
    if (shown && members(shown).indexOf(i) >= 0) s += ', gehört zu Gruppe ' + shown;
    if (mode === 'check') {
      if (on && i === CORRECT) s += ', richtig';
      else if (on) s += ', falsch';
      else if (i === CORRECT) s += ', das war der Biber mit der falschen Flagge';
    }
    return s;
  }

  function render() {
    var mem = shown ? members(shown) : [];
    btns.forEach(function (b, k) {
      var i = k + 1, on = sel === i;
      var cls = P + 'pick' + (on ? ' on' : '') + (mem.indexOf(i) >= 0 ? ' grp' : '');
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
    chips.forEach(function (c) {
      var on = shown === +c.getAttribute('data-g');
      c.setAttribute('aria-pressed', String(on));
      c.className = P + 'chip' + (on ? ' on' : '');
    });
    if (shown) {
      var r = AN.checks.filter(function (x) { return x.checker === shown; })[0];
      hint.textContent = 'Gruppe ' + shown + ' = Biber ' + members(shown).join(', ') + ': ' + r.all + ' rote Flagge' + (r.all === 1 ? '' : 'n') + ' - ' +
        (r.all % 2 === 0 ? 'gerade, die Prüfung stimmt.' : 'ungerade, die Prüfung schlägt an.');
    } else hint.textContent = 'Tipp: Tippe auf eine Gruppe, um ihre Biber hervorzuheben und die roten Flaggen zu zählen.';
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
    var k = e.key, i = btns.indexOf(e.target.closest('.' + P + 'pick')) + 1;
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
      return '<li class="' + P + 'chk ' + (r.ok ? P + 'ok' : P + 'bad') + '"><strong>Gruppe ' + r.checker + '</strong> (Biber ' + r.of.join(', ') + ' und Prüf-Biber ' + r.checker + '): ' + f +
        '<span class="' + P + 'line">' + r.reds + ' rote Flagge' + (r.reds === 1 ? '' : 'n') + ' bei den Nachrichten-Bibern, also ' + (r.reds % 2 ? 'ungerade' : 'gerade') + '. Prüf-Biber ' + r.checker + ' sollte ' +
        flagSvg(r.should ? 'R' : 'Y', (r.should ? 'rote' : 'gelbe') + ' Flagge') + ' halten, hält aber ' + flagSvg(r.has ? 'R' : 'Y', (r.has ? 'rote' : 'gelbe') + ' Flagge') + '. ' +
        '<span class="' + P + 'res">' + (r.ok ? '✓ stimmt' : '✗ stimmt nicht') + '</span></span></li>';
    }).join('');
    return '<p>Jede Gruppe aus einem Prüf-Biber und seinen drei Nachrichten-Bibern muss eine gerade Anzahl roter Flaggen hochhalten.</p>' +
      '<ul class="' + P + 'checks">' + rows + '</ul>' +
      '<p>Gruppe 6 ist in Ordnung, also machen die Biber 1, 2, 4 und 6 alles richtig. Bei Gruppe 5 und bei Gruppe 7 gibt es einen Fehler. Den Fehler in Gruppe 5 kann nur Biber 3 oder Biber 5 verursachen, in Gruppe 7 nur Biber 3 oder Biber 7. ' +
      'Da nur ein einziger Biber falsch liegt, muss es der sein, der in beiden Gruppen vorkommt: <strong>Biber 3</strong>. Er müsste eine gelbe statt der roten Flagge hochhalten.</p>' +
      '<p>Dieses Verfahren heißt Paritätsprüfung. Mit mehreren überlappenden Prüfungen wie im Hamming-Code kann man einen einzelnen Fehler nicht nur bemerken, sondern auch genau finden und korrigieren.</p>';
  }

  Biber.register({
    id: 'pruefbiber20',
    story: STORY,
    question: 'Welcher Biber hält die falsche Flagge hoch?',
    howto: 'Tippe den Biber an, der die falsche Flagge hochhält. Mit den Pfeiltasten wechselst du zwischen den Bibern. Die Gruppen-Knöpfe helfen beim Zählen.',
    explanation: explain,
    mount: function (root, a) {
      el = root; api = a; locked = false; sel = null; mode = null; btns = []; shown = null;
      var img = h('img', { class: P + 'img', src: 'assets/pruefbiber20/biber.png', width: 1600, height: 457, alt: '', draggable: 'false' });
      group = h('div', { class: P + 'row', role: 'radiogroup', 'aria-label': 'Sieben Biber mit Flaggen: 1 rot, 2 gelb, 3 rot, 4 gelb, 5 rot, 6 rot, 7 gelb', onkeydown: onKey }, img);
      for (var i = 1; i <= 7; i++) {
        var b = h('button', {
          type: 'button', role: 'radio', class: P + 'pick', 'data-i': String(i),
          style: 'left:' + ((CX[i - 1] - BW / 2) / 10) + '%;width:' + (BW / 10) + '%',
          onclick: (function (k) { return function () { choose(k, false); }; })(i)
        });
        btns.push(b);
        group.appendChild(b);
      }
      chips = CHECKS.map(function (c) {
        return h('button', {
          type: 'button', class: P + 'chip', 'data-g': String(c.checker), 'aria-pressed': 'false',
          onclick: function () { shown = shown === c.checker ? null : c.checker; render(); }
        }, 'Gruppe ' + c.checker);
      });
      hint = h('p', { class: P + 'hint', 'aria-live': 'polite' });
      note = h('p', { class: P + 'note', 'aria-live': 'polite', hidden: true });
      el.replaceChildren(h('div', { class: P + 'board' }, group, h('div', { class: P + 'chips', role: 'group', 'aria-label': 'Gruppe hervorheben' }, chips), hint, note));
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
    reset: function () { sel = null; locked = false; mode = null; shown = null; render(); },
    showSolution: function () { sel = CORRECT; locked = true; mode = 'solution'; render(); }
  });
})();
