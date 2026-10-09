/* Aufgabe Im Theater (Biber 2020; Klasse 3-4 schwer, 5-6 mittel, 7-8 einfach): Welche Figuren sind nie gleichzeitig auf der Bühne? */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-imtheater20-';

  var CHARS = {
    k: { name: 'König', color: '#e0261c' },
    p: { name: 'Prinzessin', color: '#f2b705' },
    d: { name: 'Drache', color: '#1e8a2a' },
    r: { name: 'Ritter', color: '#2b5ea8' }
  };
  var ORDER = ['p', 'r', 'k', 'd'];   /* Reihenfolge wie im Heft */

  /* Handlung: [Figur, kommt (true) / geht (false)]; die Pause liegt nach dem 6. Schritt */
  var ACTS = [
    { title: 'Erster Akt', steps: [['k', 1], ['p', 1], ['k', 0], ['d', 1], ['p', 0], ['d', 0]] },
    { title: 'Zweiter Akt', steps: [['d', 1], ['r', 1], ['d', 0], ['p', 1], ['r', 0], ['p', 0]] }
  ];
  var STEPS = [];
  ACTS.forEach(function (a, ai) { a.steps.forEach(function (s) { STEPS.push({ c: s[0], in: !!s[1], act: ai }); }); });

  var OPTIONS = [
    { key: 'A', a: 'p', b: 'r' },
    { key: 'B', a: 'k', b: 'd' },
    { key: 'C', a: 'k', b: 'p' },
    { key: 'D', a: 'r', b: 'd' }
  ];
  function onStage(n) {   /* wer ist nach n ausgeführten Schritten auf der Bühne? */
    var s = {}, i;
    for (i = 0; i < n; i++) s[STEPS[i].c] = STEPS[i].in;
    return s;
  }
  function together(a, b) {
    var n, s;
    for (n = 0; n <= STEPS.length; n++) { s = onStage(n); if (s[a] && s[b]) return true; }
    return false;
  }
  var RIGHT = OPTIONS.map(function (o) { return !together(o.a, o.b); }).indexOf(true);   /* B, per Durchrechnen bestätigt (Heft: B) */
  function pairText(o) { return CHARS[o.a].name + ' und ' + CHARS[o.b].name; }

  /* Figuren als einfache Zeichnungen (viewBox 0 0 64 76) */
  var FACE = '<ellipse cx="32" cy="38" rx="14" ry="16" fill="#f6c9a0" stroke="#8a5a34" stroke-width="1.5"/>' +
    '<circle cx="26.5" cy="37" r="1.9" fill="#222"/><circle cx="37.5" cy="37" r="1.9" fill="#222"/>';
  var ART = {
    p: '<path d="M16 68 Q18 54 32 54 Q46 54 48 68 Z" fill="#f08cb6" stroke="#9a3a68" stroke-width="1.5"/>' +
       '<path d="M15 30 Q12 14 32 12 Q52 14 49 30 L50 56 Q42 50 40 44 L24 44 Q22 50 14 56 Z" fill="#f7cf3a" stroke="#b98a00" stroke-width="1.5"/>' + FACE +
       '<path d="M21 28 Q32 14 43 28 Q32 22 21 28 Z" fill="#f7cf3a"/>' +
       '<path d="M24 14 L26 6 L29 11 L32 4 L35 11 L38 6 L40 14 Z" fill="#ffd84a" stroke="#b98a00" stroke-width="1.2"/>' +
       '<path d="M28 45.5 Q32 48.5 36 45.5" fill="none" stroke="#b04a4a" stroke-width="1.6" stroke-linecap="round"/>',
    r: '<path d="M14 70 Q16 54 32 54 Q48 54 50 70 Z" fill="#aab1ba" stroke="#59616b" stroke-width="1.5"/>' + FACE +
       '<path d="M17 36 Q16 14 32 14 Q48 14 47 36 L43 36 Q43 24 32 24 Q21 24 21 36 Z" fill="#b9c0c8" stroke="#59616b" stroke-width="1.5"/>' +
       '<path d="M32 15 Q50 2 56 22 Q50 12 40 17 Z" fill="#2b5ea8" stroke="#1c3f75" stroke-width="1.2"/>' +
       '<path d="M28 46 Q32 49 36 46" fill="none" stroke="#8a3a3a" stroke-width="1.6" stroke-linecap="round"/>',
    k: '<path d="M12 70 Q14 54 32 54 Q50 54 52 70 Z" fill="#d6301f" stroke="#7d1810" stroke-width="1.5"/>' +
       '<path d="M18 34 Q18 62 32 62 Q46 62 46 34 L46 44 Q32 52 18 44 Z" fill="#6b3f1f"/>' + FACE +
       '<path d="M19 45 Q32 66 45 45 Q32 53 19 45 Z" fill="#6b3f1f"/>' +
       '<path d="M28 46 Q32 48.5 36 46" fill="none" stroke="#f6c9a0" stroke-width="1.5" stroke-linecap="round"/>' +
       '<path d="M18 24 L20 8 L26 16 L32 5 L38 16 L44 8 L46 24 Z" fill="#ffd84a" stroke="#b98a00" stroke-width="1.5"/>' +
       '<circle cx="32" cy="14" r="2.2" fill="#d6301f"/>',
    d: '<path d="M14 70 Q16 58 32 58 Q48 58 50 70 Z" fill="#2e9a3b" stroke="#16601f" stroke-width="1.5"/>' +
       '<path d="M18 30 L14 14 L24 22 L28 8 L34 20 L42 8 L44 22 L52 14 L48 32 Z" fill="#55c05f" stroke="#16601f" stroke-width="1.5" stroke-linejoin="round"/>' +
       '<ellipse cx="32" cy="38" rx="17" ry="16" fill="#4cb858" stroke="#16601f" stroke-width="1.5"/>' +
       '<circle cx="25" cy="33" r="5" fill="#fff6a8" stroke="#16601f" stroke-width="1.2"/><circle cx="39" cy="33" r="5" fill="#fff6a8" stroke="#16601f" stroke-width="1.2"/>' +
       '<circle cx="25.5" cy="33.5" r="2" fill="#222"/><circle cx="38.5" cy="33.5" r="2" fill="#222"/>' +
       '<ellipse cx="32" cy="46" rx="9" ry="5.5" fill="#7ad384" stroke="#16601f" stroke-width="1.2"/>' +
       '<circle cx="29" cy="45" r="1.1" fill="#16601f"/><circle cx="35" cy="45" r="1.1" fill="#16601f"/>' +
       '<path d="M25 51 L27 55 L29 51 M35 51 L37 55 L39 51" fill="#fff" stroke="#16601f" stroke-width="1"/>'
  };
  function figure(id) {
    return '<svg class="' + P + 'fig" viewBox="0 0 64 76" aria-hidden="true">' + ART[id] + '</svg>';
  }

  var el, api, step, selected, locked, mark;
  var slotEls, rowEls, noteEl, prevBtn, nextBtn, radios;

  function reset() { step = 0; selected = null; mark = null; }

  function stepText(i) {
    var s = STEPS[i];
    return CHARS[s.c].name + (s.in ? ' kommt' : ' geht');
  }

  function renderStage() {
    var st = onStage(step);
    ORDER.forEach(function (c) {
      slotEls[c].classList.toggle('on', !!st[c]);
      slotEls[c].setAttribute('aria-label', CHARS[c].name + ': ' + (st[c] ? 'auf der Bühne' : 'nicht zu sehen'));
    });
    rowEls.forEach(function (r, i) {
      r.classList.toggle('done', i < step);
      r.classList.toggle('now', i === step - 1);
      r.setAttribute('aria-current', i === step - 1 ? 'step' : 'false');
    });
    var names = ORDER.filter(function (c) { return st[c]; }).map(function (c) { return CHARS[c].name; });
    if (step === 0) noteEl.textContent = 'Am Anfang ist niemand zu sehen.';
    else noteEl.textContent = 'Nach „' + stepText(step - 1) + '“: ' + (names.length ? 'Auf der Bühne ' + (names.length === 1 ? 'steht ' : 'stehen ') + names.join(' und ') + '.' : 'Die Bühne ist leer.') +
      (step === 6 ? ' Jetzt ist Pause.' : '') + (step === STEPS.length ? ' Ende des Stücks.' : '');
    prevBtn.disabled = step === 0;
    nextBtn.disabled = step === STEPS.length;
  }
  function go(n) {
    step = Math.max(0, Math.min(STEPS.length, n));
    renderStage();
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

  function pairIcons(o) {
    return '<span class="' + P + 'pair" aria-hidden="true"><span class="' + P + 'mini">' + figure(o.a) + '</span><span class="' + P + 'mini">' + figure(o.b) + '</span></span>';
  }

  Biber.register({
    id: 'imtheater20',
    story:
      '<p>Im Theater spielen heute vier Figuren: die Prinzessin, der Ritter, der König und der Drache. Am Anfang ist niemand zu sehen. Dann kommen und gehen die Figuren in zwei Akten (mit einer Pause dazwischen), wie in der Liste unten.</p>',
    question: 'Welche Figuren sind NICHT gleichzeitig zu sehen?',
    howto: 'Gehe mit „Weiter“ durch das Stück (oder tippe einen Schritt in der Liste an) und beobachte, wer auf der Bühne steht. Wähle dann eine Antwort.',
    explanation: function () {
      var rows = ORDER.map(function (c) {
        var cells = '', n;
        for (n = 1; n <= STEPS.length; n++) cells += '<td class="' + (onStage(n)[c] ? 'y' : 'n') + '">' + (onStage(n)[c] ? 'Ja' : '–') + '</td>';
        return '<tr><th scope="row">' + CHARS[c].name + ' da?</th>' + cells + '</tr>';
      }).join('');
      var head = '';
      STEPS.forEach(function (s, i) { head += '<th scope="col">' + (i + 1) + '</th>'; });
      return '<p>Man muss sich für jede Figur nach jedem Schritt nur merken, ob sie auf der Bühne steht oder nicht. Trägt man das in eine Tabelle ein (Schritte 1 bis 12), sieht man, dass für <strong>König und Drache</strong> nie in derselben Spalte „Ja“ steht. Die anderen Paare sind jeweils zu einem Zeitpunkt zusammen zu sehen: König und Prinzessin nach Schritt 2, Ritter und Drache im zweiten Akt nach Schritt 8, Prinzessin und Ritter nach Schritt 10. Die Antwort ist <strong>B</strong>.</p>' +
        '<div class="' + P + 'tablewrap"><table class="' + P + 'table"><thead><tr><th></th>' + head + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<p>Jede Zeile enthält nur „ja“ oder „nein“, also ein <strong>Bit</strong>, die kleinste Informationseinheit. Mit Bits kann man rechnen, zum Beispiel mit „UND“: „König UND Drache“ ist nie wahr.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      slotEls = {};
      var stage = h('div', { class: P + 'stage', role: 'group', 'aria-label': 'Bühne' }, ORDER.map(function (c) {
        var d = h('div', { class: P + 'slot', style: '--pc:' + CHARS[c].color, role: 'img' });
        d.innerHTML = figure(c) + '<span class="' + P + 'nm">' + CHARS[c].name + '</span>';
        slotEls[c] = d;
        return d;
      }));
      noteEl = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      prevBtn = h('button', { type: 'button', class: P + 'ctl', onclick: function () { go(step - 1); } }, '‹ Zurück');
      nextBtn = h('button', { type: 'button', class: P + 'ctl ' + P + 'go', onclick: function () { go(step + 1); } }, 'Weiter ›');
      var restart = h('button', { type: 'button', class: P + 'ctl', onclick: function () { go(0); } }, 'Von vorn');
      rowEls = [];
      var acts = ACTS.map(function (act, ai) {
        var items = act.steps.map(function (s, k) {
          var i = ai * 6 + k;
          var li = h('li', null, h('button', {
            type: 'button', class: P + 'row', style: '--pc:' + CHARS[s[0]].color,
            'aria-label': 'Schritt ' + (i + 1) + ': ' + stepText(i) + ' – Bühne danach anzeigen',
            onclick: function () { go(i + 1); }
          }));
          li.firstChild.innerHTML = '<span class="' + P + 'n">' + (i + 1) + '</span><span class="' + P + 'arrow" aria-hidden="true">' + (s[1] ? '➜' : '⬅') + '</span><span class="' + P + 'tx">' + stepText(i) + '</span>';
          rowEls.push(li.firstChild);
          return li;
        });
        return h('section', { class: P + 'act' }, h('h3', null, act.title), h('ol', { class: P + 'steps', start: String(ai * 6 + 1) }, items));
      });
      radios = OPTIONS.map(function (o, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': o.key,
          'aria-label': 'Antwort ' + o.key + ': ' + pairText(o), onclick: function () { choose(i, false); }, onkeydown: onKey
        });
        btn.innerHTML = '<span class="' + P + 'key" aria-hidden="true">' + o.key + ')</span>' + pairIcons(o) + '<span class="' + P + 'txt">' + pairText(o) + '</span>';
        return btn;
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('section', { 'aria-label': 'Das Stück' },
          stage, noteEl,
          h('div', { class: P + 'ctls' }, prevBtn, nextBtn, restart)),
        h('div', { class: P + 'acts' }, acts[0], h('div', { class: P + 'pause' }, 'Pause'), acts[1], h('div', { class: P + 'pause end' }, 'Ende')),
        h('section', { 'aria-label': 'Antwort' }, h('h3', null, 'Nicht gleichzeitig zu sehen sind …'),
          h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Antworten' }, radios))));
      renderStage();
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
    reset: function () { reset(); go(0); refresh(); },
    showSolution: function () { selected = RIGHT; mark = 'solution'; locked = true; refresh(); }
  });
})();
