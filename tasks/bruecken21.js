/* Aufgabe Brückenbau (Heft 2021, S. 12; Klasse 3-6, einfach): fehlende Dinge den Geschäften zuordnen (Mengen) */
(function () {
  'use strict';
  var h = Biber.h;

  /* Was Bella braucht: Hammer und Seil hat sie schon, Nägel und Bretter fehlen */
  var NEED = [
    { id: 'hammer', name: 'Hammer', have: true },
    { id: 'naegel', name: 'Nägel', have: false },
    { id: 'bretter', name: 'Bretter', have: false },
    { id: 'seil', name: 'Seil', have: true }
  ];
  /* Die drei Geschäfte (von links nach rechts) und ihr Angebot laut Bild im Heft */
  var SHOPS = [
    { id: 'links', name: 'Geschäft links', sells: ['schere', 'hammer', 'naegel'],
      desc: 'Schere, Hammer und Nägel' },
    { id: 'mitte', name: 'Geschäft in der Mitte', sells: ['ziegel', 'bretter'],
      desc: 'Ziegelsteine und Bretter' },
    { id: 'rechts', name: 'Geschäft rechts', sells: ['farbe', 'seil'],
      desc: 'Eimer und Seil' }
  ];
  var WIDTH = { links: 560, mitte: 560, rechts: 560 };
  var HEIGHT = { links: 317, mitte: 325, rechts: 325 };

  /* Richtige Antwort: genau die Geschäfte, die etwas verkaufen, was Bella noch fehlt */
  function missing() { return NEED.filter(function (n) { return !n.have; }).map(function (n) { return n.id; }); }
  function isUseful(shop) { return shop.sells.some(function (s) { return missing().indexOf(s) >= 0; }); }
  var RIGHT = SHOPS.filter(isUseful).map(function (s) { return s.id; });   /* links, mitte */

  var el, api, chosen, locked, mark;   /* mark: null | 'check' | 'solution' */

  function reset() { chosen = []; mark = null; }
  function sameSet(a, b) { return a.length === b.length && a.every(function (x) { return b.indexOf(x) >= 0; }); }

  function toggle(id) {
    if (locked) return;
    var i = chosen.indexOf(id);
    if (i >= 0) chosen.splice(i, 1); else chosen.push(id);
    render();
    api.changed();
  }

  function render() {
    var shops = SHOPS.map(function (s) {
      var on = chosen.indexOf(s.id) >= 0;
      var right = RIGHT.indexOf(s.id) >= 0;
      var cls = 't-bruecken21-shop' + (on ? ' on' : '');
      var badge = null;
      if (mark === 'check') {
        if (on && right) { cls += ' right'; badge = h('span', { class: 't-bruecken21-badge', 'aria-hidden': 'true' }, '✓'); }
        else if (on && !right) { cls += ' wrong'; badge = h('span', { class: 't-bruecken21-badge', 'aria-hidden': 'true' }, '✗'); }
        else if (!on && right) { cls += ' missed'; badge = h('span', { class: 't-bruecken21-badge', 'aria-hidden': 'true' }, '!'); }
      } else if (mark === 'solution' && right) {
        cls += ' right'; badge = h('span', { class: 't-bruecken21-badge', 'aria-hidden': 'true' }, '✓');
      }
      return h('button', {
        type: 'button', class: cls, 'data-shop': s.id, 'aria-pressed': String(on), disabled: locked,
        'aria-label': s.name + ', verkauft ' + s.desc + (on ? ', ausgewählt' : '')
      },
        h('img', { src: 'assets/bruecken21/' + s.id + '.png', alt: '', width: WIDTH[s.id], height: HEIGHT[s.id], draggable: 'false' }),
        h('span', { class: 't-bruecken21-cap' }, s.name.replace('Geschäft ', '')),
        badge);
    });
    var list = h('figure', { class: 't-bruecken21-list' },
      h('img', { src: 'assets/bruecken21/liste.png', width: 700, height: 141, draggable: 'false',
        alt: 'Bellas Liste: Hammer ist vorhanden (Haken), Nägel fehlen (Kreuz), Bretter fehlen (Kreuz), Seil ist vorhanden (Haken).' }),
      h('figcaption', null, 'Haken: hat Bella schon. Kreuz: muss sie einkaufen.'));
    el.replaceChildren(h('div', { class: 't-bruecken21-board' },
      list,
      h('div', { class: 't-bruecken21-shops', role: 'group', 'aria-label': 'Die drei Geschäfte' }, shops)));
  }

  Biber.register({
    id: 'bruecken21',
    story: '<p>Bella möchte über einen Bach eine Brücke bauen. Sie braucht einen Hammer, Nägel, Bretter und ein Seil. ' +
      'Im Keller findet sie einen Hammer und ein Seil. Die anderen Sachen muss sie einkaufen. ' +
      'Unten siehst du drei Geschäfte und was sie verkaufen.</p>',
    question: 'Wo kann Bella die anderen Sachen einkaufen?',
    howto: 'Tippe alle Geschäfte an, in denen Bella etwas einkaufen kann, das ihr noch fehlt. Tippe noch einmal, um die Auswahl zurückzunehmen.',
    explanation: '<p>Bella fehlen noch <b>Nägel</b> und <b>Bretter</b>. Das Geschäft links verkauft Nägel (den Hammer hat Bella ja schon), ' +
      'das Geschäft in der Mitte verkauft Bretter. Das Geschäft rechts hat nur das Seil, das sie schon hat, und einen Eimer, den sie nicht braucht.</p>' +
      '<p>Der Biber vergleicht dabei zwei Mengen: Was Bella braucht, und was jedes Geschäft anbietet. Gesucht sind die Geschäfte, deren Angebot etwas aus der Menge „fehlt noch“ enthält.</p>',
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.addEventListener('click', function (e) {
        var t = e.target.closest('[data-shop]');
        if (t) toggle(t.dataset.shop);
      });
      render();
    },
    isComplete: function () { return chosen.length > 0; },
    evaluate: function () {
      var ans = SHOPS.map(function (s) { return s.id; }).filter(function (id) { return chosen.indexOf(id) >= 0; });
      return { correct: sameSet(ans, RIGHT), answer: ans };
    },
    setAnswer: function (ans) {
      chosen = (ans || []).slice();
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? 'check' : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      chosen = RIGHT.slice();
      locked = true;
      mark = 'solution';
      render();
    }
  });
})();
