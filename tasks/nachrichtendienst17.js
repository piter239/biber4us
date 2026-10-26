/* Aufgabe Nachrichtendienst (Heft 2017, Klasse 3-4 mittel, 5-6 einfach): Karten mit Bildmarken wieder zur Nachricht zusammensetzen */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-nachrichtendienst17-';
  var IMG = 'assets/nachrichtendienst17/';

  /* Karten: Text, linkes Bild (Vorgänger), rechtes Bild (Nachfolger) */
  var CARDS = {
    REI: { l: 'Himbeere', r: 'Blaubeeren', alt: 'Karte REI, links eine Himbeere, rechts Blaubeeren', img: 'rei' },
    BAD: { l: 'Blaubeeren', r: null, alt: 'Karte BAD, links Blaubeeren', img: 'bad' },
    HEU: { l: null, r: 'Weintrauben', alt: 'Karte HEU, rechts Weintrauben', img: 'heu' },
    NSF: { l: 'Kirschen', r: 'Himbeere', alt: 'Karte NSF, links Kirschen, rechts eine Himbeere', img: 'nsf' },
    TEI: { l: 'Weintrauben', r: 'Kirschen', alt: 'Karte TEI, links Weintrauben, rechts Kirschen', img: 'tei' }
  };
  var START = ['REI', 'BAD', 'HEU', 'NSF', 'TEI'];     /* Reihenfolge wie im Heft */
  var OPTIONS = [
    { id: 'A', text: 'BADREIHEUNSFTEI' },
    { id: 'B', text: 'HEUBADREITEINSF' },
    { id: 'C', text: 'HEUTEINSFREIBAD' },
    { id: 'D', text: 'REITEINSHEUBAD' }
  ];
  var CORRECT = 'C';

  /* Prüft eine Reihenfolge: erstes Stück nur rechts ein Bild, letztes nur links, dazwischen passen die Bilder paarweise */
  function validOrder(words) {
    return words.every(function (w, i) {
      var c = CARDS[w];
      if (!c) return false;
      var prev = i > 0 ? CARDS[words[i - 1]] : null;
      var next = i < words.length - 1 ? CARDS[words[i + 1]] : null;
      if (prev ? prev.r !== c.l || !c.l : c.l !== null) return false;
      if (next ? next.l !== c.r || !c.r : c.r !== null) return false;
      return true;
    });
  }
  function chunks(t) { var o = []; for (var i = 0; i < t.length; i += 3) o.push(t.slice(i, i + 3)); return o; }
  var SOLUTION = (function () {
    var res = null;
    OPTIONS.forEach(function (o) { if (validOrder(chunks(o.text))) { if (o.id !== CORRECT) throw new Error('nachrichtendienst17: Optionen widersprüchlich'); res = chunks(o.text); } });
    return res;
  })();

  function card(w, cls) {
    var c = CARDS[w];
    return h('img', { class: cls || P + 'img', src: IMG + c.img + '.png', width: 300, height: 218, alt: c.alt, draggable: 'false' });
  }

  var el, api, order, sel, choice, mark, locked, live;
  function reset() { order = START.slice(); sel = null; choice = null; mark = null; }

  function render() {
    var cards = order.map(function (w, i) {
      return h('button', {
        type: 'button', class: P + 'card' + (sel === i ? ' sel' : ''), 'data-pos': String(i), 'aria-pressed': String(sel === i), disabled: locked,
        'aria-label': 'Karte ' + (i + 1) + ' von 5: ' + CARDS[w].alt.replace(/^Karte /, '') + (sel === i ? ', ausgewählt' : '')
      }, card(w));
    });
    var opts = OPTIONS.map(function (o, i) {
      var cls = P + 'opt' + (choice === o.id ? ' sel' : '');
      var badge = null;
      if (mark === 'check' && choice === o.id) {
        var ok = o.id === CORRECT;
        cls += ok ? ' right' : ' wrong';
        badge = h('span', { class: P + 'mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗');
      } else if (mark === 'solution' && o.id === CORRECT) cls += ' right';
      var tab = choice ? (choice === o.id ? '0' : '-1') : (i === 0 ? '0' : '-1');
      return h('button', {
        type: 'button', role: 'radio', class: cls, 'data-opt': o.id, 'aria-checked': String(choice === o.id), tabindex: tab, disabled: locked,
        'aria-label': 'Antwort ' + o.id + ': ' + o.text
      }, h('span', { class: P + 'letter', 'aria-hidden': 'true' }, o.id + ')'), h('span', { class: P + 'word', 'aria-hidden': 'true' }, o.text), badge);
    });
    live = h('p', { class: P + 'live', 'aria-live': 'polite' }, 'Deine Reihenfolge: ', h('strong', null, order.join('')));
    el.replaceChildren(h('div', { class: P + 'board' },
      h('section', { 'aria-label': 'Beispiel' },
        h('h3', null, 'Beispiel: HITZEFREI'),
        h('div', { class: P + 'ex' }, [['HIT', 'ex1', 'Karte HIT, rechts oben ein Apfel'], ['ZEF', 'ex2', 'Karte ZEF, links ein Apfel, rechts eine Haselnuss'], ['REI', 'ex3', 'Karte REI, links eine Haselnuss']].map(function (e) {
          return h('img', { class: P + 'img', src: IMG + e[1] + '.png', width: 300, height: 215, alt: e[2], draggable: 'false' });
        }))),
      h('section', { 'aria-label': 'Die Karten, die bei Leo ankommen' },
        h('h3', null, 'Diese Karten kommen bei Leo an'),
        h('p', { class: P + 'hint' }, 'Zum Probieren: Tippe eine Karte und dann eine zweite an, dann tauschen sie die Plätze.'),
        h('div', { class: P + 'row' }, cards),
        live),
      h('section', { 'aria-label': 'Antworten' },
        h('h3', null, 'Welche Nachricht hat Viola gesendet?'),
        h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Die vier Nachrichten A bis D' }, opts))));
  }

  function pick(id) {
    if (locked) return;
    choice = id;
    render();
    var b = el.querySelector('[data-opt="' + id + '"]');
    if (b) b.focus();
    api.changed('Antwort ' + id + ' ausgewählt.');
  }
  function onClick(e) {
    if (locked) return;
    var o = e.target.closest('[data-opt]');
    if (o) return pick(o.dataset.opt);
    var c = e.target.closest('[data-pos]');
    if (!c) return;
    var i = +c.dataset.pos;
    if (sel === null) sel = i;
    else if (sel === i) sel = null;
    else { var t = order[sel]; order[sel] = order[i]; order[i] = t; sel = null; }
    render();
    var b = el.querySelector('[data-pos="' + i + '"]');
    if (b) b.focus();
  }
  function onKey(e) {
    var b = e.target.closest('[data-opt]');
    if (!b || locked) return;
    var i = OPTIONS.map(function (o) { return o.id; }).indexOf(b.dataset.opt), d = 0;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') d = 1;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') d = -1;
    else return;
    e.preventDefault();
    pick(OPTIONS[(i + d + OPTIONS.length) % OPTIONS.length].id);
  }

  Biber.register({
    id: 'nachrichtendienst17',
    story: '<p>Viola sendet mit Hilfe der Biber Nachrichten an Leo. Sie teilt eine Nachricht in Stücke mit 3 Buchstaben auf. Jedes Stück schreibt sie auf eine Karte. Dann gibt sie jede Karte einem Biber.</p>' +
      '<p>Manchmal werden die Biber aufgehalten. Dann kommen die Karten durcheinander bei Leo an. Viola malt deshalb Bilder auf die Karten. So zeigt sie Leo, wie er die Karten lesen muss.</p>' +
      '<p>Ein Beispiel: Die Nachricht <strong>HITZEFREI</strong> sendet Viola mit den drei Karten HIT, ZEF und REI. Die Biber bringen Leo nun fünf andere Karten.</p>',
    question: 'Welche Nachricht hat Viola gesendet?',
    howto: 'Tippe auf die Nachricht, die Viola gesendet hat. Die Karten kannst du zum Probieren mit zwei Tipps vertauschen.',
    explanation: function () {
      return '<p>Das Beispiel HITZEFREI zeigt: Leo muss die Karten so legen, dass die gleichen Bilder nebeneinander liegen. Die Karte ohne Bild links (HEU) kommt zuerst, die Karte ohne Bild rechts (BAD) zuletzt.</p>' +
        '<div class="' + P + 'sol">' + SOLUTION.map(function (w) { return card(w).outerHTML; }).join('') + '</div>' +
        '<p>Viola hat die Nachricht <strong>HEUTEINSFREIBAD</strong> gesendet.</p>' +
        '<p>Auch im Internet werden Daten wie E-Mails, Bilder oder Videos in kleine Pakete zerlegt (zum Beispiel TCP/IP-Pakete). Die Pakete reisen über verschiedene Wege und können in einer anderen Reihenfolge ankommen. Zusätzliche Informationen im Paket, etwa eine Nummer, sorgen dafür, dass der Empfänger die Teile wieder richtig zusammensetzen kann.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKey);
      render();
    },
    isComplete: function () { return !!choice; },
    evaluate: function () { return { correct: choice === CORRECT, answer: { choice: choice } }; },
    setAnswer: function (ans) {
      choice = ans && ans.choice ? ans.choice : null;
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? 'check' : null;
      sel = null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      choice = CORRECT; mark = 'solution'; locked = true; order = SOLUTION.slice(); sel = null;
      render();
    }
  });
})();
