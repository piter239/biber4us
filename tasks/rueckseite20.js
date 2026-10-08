/* Aufgabe Rückseite (Biber 2020; Klasse 11-13 schwer): Welche Karten muss man umdrehen, um "Vokal => gerade Zahl" zu prüfen? */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-rueckseite20-';

  /* Sichtbare Seiten wie im Heft; back = Rückseite, die das Heft in der Lösung zeigt (nur bei den umzudrehenden Karten) */
  var CARDS = [
    { face: 'E', kind: 'vokal', name: 'E (ein Vokal)', back: '4' },
    { face: 'V', kind: 'konsonant', name: 'V (ein Konsonant)', back: null },
    { face: '2', kind: 'gerade', name: '2 (eine gerade Zahl)', back: null },
    { face: '7', kind: 'ungerade', name: '7 (eine ungerade Zahl)', back: 'R' }
  ];
  /* Behauptung: Vokal => gerade Zahl. Eine Karte muss umgedreht werden, wenn ihre Rückseite die Behauptung widerlegen könnte:
     sichtbarer Vokal (Rückseite könnte ungerade sein) oder sichtbare ungerade Zahl (Rückseite könnte ein Vokal sein). */
  function mustFlip(c) { return c.kind === 'vokal' || c.kind === 'ungerade'; }
  var RIGHT = CARDS.map(function (c, i) { return mustFlip(c) ? i : -1; }).filter(function (i) { return i >= 0; });   /* [0, 3] = E und 7 */

  var el, api, sel, locked, markMode;

  function reset() { sel = []; }
  function has(i) { return sel.indexOf(i) >= 0; }
  function isRightSet() { return sel.length === RIGHT.length && RIGHT.every(has); }
  function toggle(i) {
    if (locked) return;
    if (has(i)) sel.splice(sel.indexOf(i), 1); else sel.push(i);
    sel.sort(function (a, b) { return a - b; });
    render();
    var b = el.querySelector('[data-card="' + i + '"]');
    if (b) b.focus();
    api.changed(sel.length === 0 ? '' : sel.length + (sel.length === 1 ? ' Karte zum Umdrehen ausgewählt.' : ' Karten zum Umdrehen ausgewählt.'));
  }

  function render() {
    var cards = CARDS.map(function (c, i) {
      var on = has(i), need = mustFlip(c);
      var cls = P + 'card' + (on ? ' sel' : '');
      var mk = null, shown = c.face, flipped = false;
      if (markMode === 'check') {
        if (on && need) { cls += ' right'; mk = '✓'; }
        else if (on && !need) { cls += ' wrong'; mk = '✗'; }
        else if (!on && need) cls += ' missed';
      } else if (markMode === 'solution' && need) cls += ' right';
      if (markMode && need && on || markMode === 'solution' && need) { flipped = true; shown = c.back; cls += ' flipped'; }
      var label = 'Karte ' + (i + 1) + ': ' + c.name + (on ? ', zum Umdrehen ausgewählt' : ', nicht ausgewählt') +
        (flipped ? '. Auf der Rückseite steht ' + c.back + '.' : '') +
        (markMode === 'check' ? (need ? '. Diese Karte muss umgedreht werden.' : '. Diese Karte muss nicht umgedreht werden.') : '');
      var b = h('button', {
        type: 'button', class: cls, 'data-card': String(i), role: 'checkbox', 'aria-checked': String(on), 'aria-label': label, disabled: locked,
        onclick: function () { toggle(i); }
      }, h('span', { class: P + 'face', 'aria-hidden': 'true' }, shown),
      h('span', { class: P + 'tag', 'aria-hidden': 'true' }, flipped ? 'Rückseite' : (on ? 'umdrehen' : ' ')), mk ? h('span', { class: P + 'mark', 'aria-hidden': 'true' }, mk) : null);
      return b;
    });
    el.replaceChildren(h('div', { class: P + 'board' },
      h('div', { class: P + 'cards', role: 'group', 'aria-label': 'Die vier Karten' }, cards),
      h('p', { class: P + 'hint' }, markMode && cards.some(function (c) { return c.classList.contains('flipped'); })
        ? 'Umgedrehte Karten zeigen ihre Rückseite, wie im Heft: Die E-Karte hat hinten eine 4, die 7-Karte ein R.'
        : markMode ? 'Umdrehen müssen die E-Karte und die 7-Karte.'
        : 'Tippe die Karten an, die du umdrehen musst. Tippe noch einmal, um die Auswahl zurückzunehmen.')));
  }

  Biber.register({
    id: 'rueckseite20',
    story:
      '<p>Dein Freund Aristo hat Spielkarten mitgebracht. Auf der einen Seite jeder Karte ist ein Buchstabe und auf der anderen Seite eine Zahl.</p>' +
      '<p>Aristo behauptet: <strong>Wenn auf der einen Seite einer Karte ein Vokal ist, dann ist auf der anderen Seite eine gerade Zahl.</strong></p>' +
      '<p>Aristo legt vier Karten vor dich hin. Du weißt, dass E ein Vokal, V ein Konsonant, 2 gerade und 7 ungerade sind. Aber weißt du auch, ob Aristo die Wahrheit gesagt hat? Du willst seine Behauptung sicher überprüfen.</p>',
    question: 'Welche Karten musst du dazu unbedingt umdrehen?',
    howto: 'Tippe alle Karten an, die du umdrehen musst. Tippe eine Karte noch einmal an, um die Auswahl zurückzunehmen.',
    explanation: function () {
      return '<p>Die Behauptung „Wenn Vokal, dann gerade Zahl“ ist nur dann falsch, wenn es eine Karte mit einem <strong>Vokal und einer ungeraden Zahl</strong> gibt. Du musst also die Karten umdrehen, hinter denen so ein Fall stecken könnte.</p>' +
        '<ul><li><strong>E</strong> umdrehen: Steht hinten eine ungerade Zahl, hat Aristo nicht die Wahrheit gesagt.</li>' +
        '<li><strong>V</strong> nicht umdrehen: Über Konsonanten hat Aristo nichts behauptet.</li>' +
        '<li><strong>2</strong> nicht umdrehen: Ob hinten ein Vokal oder ein Konsonant steht, die Behauptung stimmt in beiden Fällen.</li>' +
        '<li><strong>7</strong> umdrehen: Steht hinten ein Vokal, hat Aristo nicht die Wahrheit gesagt.</li></ul>' +
        '<p>Das ist eine logische Implikation „wenn a, dann b“. Sie ist genau dann falsch, wenn a wahr und b falsch ist, sonst ist sie wahr. In manchen Programmiersprachen gibt es dafür sogar einen eigenen Ausdruck (IF a THEN b), nicht zu verwechseln mit der if-Anweisung.</p>';
    },
    mount: function (root, a) { el = root; api = a; locked = false; markMode = null; reset(); render(); },
    isComplete: function () { return sel.length > 0; },
    evaluate: function () { return { correct: isRightSet(), answer: sel.slice() }; },
    setAnswer: function (ans) { sel = ans.slice(); markMode = 'check'; locked = true; render(); },
    lock: function (on) { locked = on; markMode = on ? 'check' : null; render(); },
    reset: function () { reset(); markMode = null; render(); },
    showSolution: function () { sel = RIGHT.slice(); locked = true; markMode = 'solution'; render(); }
  });
})();
