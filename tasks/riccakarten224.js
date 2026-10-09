/* Aufgabe Ricca-Karten 2 (Biber 2024; Klasse 5-6 mittel, 7-8 einfach): Datentypen (string, integer, boolean) den Eigenschaften zuordnen */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-riccakarten224-';
  var A = 'assets/riccakarten224/';

  /* Eigenschaften in der Reihenfolge der Antworttabelle im Heft */
  var PROPS = [
    { key: 'name', label: 'Name', icon: 'icon-name.png' },
    { key: 'eyes', label: 'Anzahl der Augen', icon: 'icon-eyes.png' },
    { key: 'legs', label: 'Anzahl der Beine', icon: 'icon-legs.png' },
    { key: 'wings', label: 'Flügel', icon: 'icon-wings.png' },
    { key: 'teeth', label: 'Zähne', icon: 'icon-teeth.png' }
  ];
  var TYPES = {
    t: { name: 'Text', cls: 'text', hint: 'mehrere Buchstaben hintereinander' },
    z: { name: 'Zahlen', cls: 'num', hint: 'also 1, 2, 3 usw.' },
    j: { name: 'ja/nein', cls: 'bool', hint: 'die Zeichen ✓ und X, die „ja“ und „nein“ bedeuten' }
  };
  var POOL = { t: 1, z: 2, j: 2 };            /* im Heft gegeben: ja/nein, ja/nein, Text, Zahlen, Zahlen */
  var CARDS = [
    { n: 1, name: 'JOSI', eyes: 3, legs: 2, wings: 'X', teeth: '✓' },
    { n: 2, name: 'MONI', eyes: 3, legs: 2, wings: 'X', teeth: '✓' },
    { n: 3, name: 'KILI', eyes: 2, legs: 2, wings: '✓', teeth: '✓' },
    { n: 4, name: 'BENI', eyes: 2, legs: 2, wings: 'X', teeth: '✓' },
    { n: 5, name: 'LORI', eyes: 2, legs: 5, wings: 'X', teeth: '✓' },
    { n: 6, name: 'PHIL', eyes: 2, legs: 2, wings: 'X', teeth: '✓' }
  ];
  var ANSWER = ['t', 'z', 'z', 'j', 'j'];

  /* Typ aus den Werten ableiten und mit der offiziellen Lösung abgleichen */
  function typeOf(v) {
    if (typeof v === 'number') return 'z';
    return v === '✓' || v === 'X' ? 'j' : 't';
  }
  PROPS.forEach(function (p, i) {
    var kinds = CARDS.map(function (c) { return typeOf(c[p.key]); });
    if (kinds.some(function (k) { return k !== kinds[0]; }) || kinds[0] !== ANSWER[i]) throw new Error('riccakarten224: Typ von ' + p.key + ' stimmt nicht');
  });
  (function () {
    var cnt = { t: 0, z: 0, j: 0 };
    ANSWER.forEach(function (k) { cnt[k]++; });
    if (cnt.t !== POOL.t || cnt.z !== POOL.z || cnt.j !== POOL.j) throw new Error('riccakarten224: Vorrat stimmt nicht');
  })();

  function icon(key, cls) {
    var p = PROPS.filter(function (x) { return x.key === key; })[0];
    return h('img', { class: P + 'ico ' + (cls || ''), src: A + p.icon, alt: '', width: 26, height: 22, draggable: 'false' });
  }
  function iconHtml(key, label) {
    var p = PROPS.filter(function (x) { return x.key === key; })[0];
    return '<img class="' + P + 'ico ' + P + 'inl" src="' + A + p.icon + '" alt="' + (label || p.label) + '" width="26" height="22">';
  }
  function valText(v) { return v === '✓' ? 'ja' : v === 'X' ? 'nein' : String(v); }

  function cardEl(c) {
    var rows = [
      ['name', c.name], ['teeth', c.teeth], ['eyes', String(c.eyes)], ['legs', String(c.legs)], ['wings', c.wings]
    ];
    var label = 'Karte ' + c.n + ': ' + PROPS.map(function (p) { return p.label + ' ' + valText(c[p.key]); }).join(', ');
    return h('li', { class: P + 'card', 'aria-label': label },
      h('span', { class: P + 'no', 'aria-hidden': 'true' }, String(c.n)),
      h('span', { class: P + 'pic' }, h('img', { src: A + 'ricca' + c.n + '.png', alt: '', draggable: 'false' })),
      h('span', { class: P + 'vals', 'aria-hidden': 'true' }, rows.map(function (r) {
        return h('span', { class: P + 'val' + (r[0] === 'name' ? ' ' + P + 'full' : '') }, icon(r[0]), h('span', { class: P + 'v' }, r[1]));
      })));
  }

  var el, api, locked, slots, selected, mark, drag, suppress, winOff;
  var slotEls, poolEl, noteEl;

  function reset() { slots = [null, null, null, null, null]; selected = null; mark = null; }
  function left() {
    var c = { t: POOL.t, z: POOL.z, j: POOL.j };
    slots.forEach(function (k) { if (k) c[k]--; });
    return c;
  }
  function say(t) { noteEl.textContent = t || ''; }

  function chip(k, extra) {
    return h('button', {
      type: 'button', class: P + 'chip ' + P + TYPES[k].cls + (selected === k ? ' selected' : '') + (extra ? ' ' + extra : ''), 'data-type': k,
      'aria-pressed': String(selected === k), 'aria-label': 'Typ ' + TYPES[k].name + (selected === k ? ', ausgewählt' : '') + ' (' + TYPES[k].hint + ')', disabled: locked ? 'disabled' : false
    }, TYPES[k].name);
  }

  function draw() {
    var ok = mark !== null;
    slotEls.forEach(function (s, i) {
      var k = slots[i];
      var right = ok && k === ANSWER[i];
      s.className = P + 'slot' + (k ? ' filled' : '') + (!k && selected ? ' target' : '') + (ok ? (right ? ' right' : ' wrong') : '');
      s.disabled = locked;
      s.setAttribute('aria-label', PROPS[i].label + ': ' + (k ? 'Typ ' + TYPES[k].name : 'noch kein Typ') + (ok ? (right ? ', richtig' : ', falsch') : ''));
      var kids = [k ? chip(k, P + 'inslot') : h('span', { class: P + 'ph', 'aria-hidden': 'true' }, 'hierher')];
      if (ok) kids.push(h('span', { class: P + 'mark', 'aria-hidden': 'true' }, right ? '✓' : '✗'));
      s.replaceChildren.apply(s, kids);
      /* Chip im Feld soll kein eigener Tab-Stopp sein: das Feld ist der Button */
      var inner = s.querySelector('.' + P + 'inslot');
      if (inner) { inner.setAttribute('tabindex', '-1'); inner.setAttribute('aria-hidden', 'true'); inner.removeAttribute('aria-label'); inner.disabled = false; inner.style.pointerEvents = 'none'; }
    });
    var l = left(), kids2 = [];
    ['j', 't', 'z'].forEach(function (k) { for (var n = 0; n < l[k]; n++) kids2.push(chip(k)); });
    if (!kids2.length) kids2.push(h('span', { class: P + 'empty' }, 'Alle Typen sind verteilt.'));
    poolEl.replaceChildren.apply(poolEl, kids2);
  }

  function put(i, k, from) {
    if (locked) return;
    var cur = slots[i];
    if (from >= 0) slots[from] = cur;       /* Tausch zwischen zwei Feldern */
    slots[i] = k;
    selected = null;
    draw();
    say(PROPS[i].label + ': ' + TYPES[k].name + '.');
    api.changed();
  }
  function take(i) {
    if (locked || !slots[i]) return;
    slots[i] = null; selected = null;
    draw(); say('');
    api.changed();
  }

  function onClick(e) {
    if (suppress) { suppress = false; return; }
    if (locked) return;
    var c = e.target.closest('[data-type]');
    if (c && poolEl.contains(c)) {
      selected = selected === c.dataset.type ? null : c.dataset.type;
      draw();
      var again = poolEl.querySelector('[data-type="' + selected + '"]');
      if (again) again.focus();
      say(selected ? 'Typ ' + TYPES[selected].name + ' ausgewählt. Tippe nun auf das Feld unter einer Eigenschaft.' : '');
      return;
    }
    var s = e.target.closest('[data-i]');
    if (!s) return;
    var i = +s.dataset.i;
    if (selected) {
      if (left()[selected] > 0 || slots[i] === selected) put(i, selected, -1);
    } else if (slots[i]) take(i);
  }
  function onDown(e) {
    if (locked || (e.button !== undefined && e.button > 0)) return;
    var s = e.target.closest('[data-i]');
    var c = e.target.closest('[data-type]');
    var k = null, from = -1;
    if (s && slots[+s.dataset.i]) { k = slots[+s.dataset.i]; from = +s.dataset.i; }
    else if (c && poolEl.contains(c)) k = c.dataset.type;
    if (!k) return;
    drag = { k: k, from: from, x: e.clientX, y: e.clientY, on: false, ghost: null, pid: e.pointerId };
  }
  function onMove(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    if (!drag.on) {
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 8) return;
      drag.on = true;
      drag.ghost = h('div', { class: P + 'ghost ' + P + 'chip ' + P + TYPES[drag.k].cls, 'aria-hidden': 'true' }, TYPES[drag.k].name);
      document.body.appendChild(drag.ghost);
    }
    e.preventDefault();
    drag.ghost.style.left = e.clientX + 'px';
    drag.ghost.style.top = e.clientY + 'px';
    var u = document.elementFromPoint(e.clientX, e.clientY);
    var s = u && u.closest('[data-i]');
    slotEls.forEach(function (n) { n.classList.toggle('over', n === s); });
  }
  function onUp(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    var d = drag; drag = null;
    if (!d.on) return;
    suppress = true;
    setTimeout(function () { suppress = false; }, 50);
    if (d.ghost) d.ghost.remove();
    var u = document.elementFromPoint(e.clientX, e.clientY);
    var s = u && u.closest('[data-i]');
    if (s && slotEls.indexOf(s) >= 0) {
      var i = +s.dataset.i;
      if (d.from === i) { draw(); return; }
      if (d.from >= 0 || left()[d.k] > 0) {
        if (d.from < 0 && slots[i]) { /* Typ im Zielfeld geht zurück in den Vorrat */ }
        put(i, d.k, d.from);
        return;
      }
    }
    if (d.from >= 0) take(d.from); else draw();
  }
  function onCancel() {
    if (drag && drag.ghost) drag.ghost.remove();
    drag = null; draw();
  }

  function table(rows) {
    return '<table class="' + P + 'tbl"><tbody>' + rows.join('') + '</tbody></table>';
  }

  Biber.register({
    id: 'riccakarten224',
    story:
      '<p>Barbara sammelt Karten mit Monstern, den „Riccas“. Hier sind ihre Ricca-Karten (links oben die Nummer der Karte):</p>' +
      '<p>Auf jeder Karte sind die Eigenschaften eines Riccas angegeben, zum Beispiel der Name (' + iconHtml('name', 'Name') + ') oder ob das Ricca Zähne hat (' + iconHtml('teeth', 'Zähne') + '). Die Eigenschaften haben Werte. ' +
      'Auf Karte 2 zum Beispiel hat ' + iconHtml('name', 'Name') + ' den Wert MONI, und ' + iconHtml('teeth', 'Zähne') + ' hat den Wert ✓: Das Ricca auf der Karte heißt also MONI und hat Zähne.</p>',
    question: 'Barbara erkennt, dass es nur drei verschiedene Arten von Werten auf den Karten gibt. Sie nennt sie „Typen“. Ordne den Eigenschaften die richtigen Typen zu.',
    howto: 'Ziehe jeden Typ in das Feld unter einer Eigenschaft. Du kannst auch erst einen Typ und dann ein Feld antippen. Ein Typ im Feld geht durch Antippen zurück.',
    explanation: function () {
      var rows = CARDS.map(function (c) {
        return '<tr><th scope="row">' + c.n + '</th><td>' + c.name + '</td><td>' + c.eyes + '</td><td>' + c.legs + '</td><td>' + c.wings + '</td><td>' + c.teeth + '</td></tr>';
      });
      return '<p>Man schaut für jede Eigenschaft alle sechs Karten an:</p>' +
        '<table class="' + P + 'tbl"><thead><tr><th scope="col">Karte</th><th scope="col">' + iconHtml('name') + '</th><th scope="col">' + iconHtml('eyes') + '</th><th scope="col">' + iconHtml('legs') + '</th><th scope="col">' + iconHtml('wings') + '</th><th scope="col">' + iconHtml('teeth') + '</th></tr></thead><tbody>' + rows.join('') + '</tbody></table>' +
        '<ul><li>Die Namen sind immer Buchstaben: <strong>Text</strong>.</li>' +
        '<li>Augen und Beine sind immer Zahlen: <strong>Zahlen</strong>.</li>' +
        '<li>Flügel und Zähne sind immer ✓ oder X: <strong>ja/nein</strong>.</li></ul>' +
        '<p><strong>Informatik:</strong> Eine Ricca-Karte ist wie ein Datensatz im Computer. Der Typ legt fest, welche Werte erlaubt sind und was man damit machen kann. Die Typen heißen in der Programmierung <em>string</em> (Text), <em>integer</em> (ganze Zahlen) und <em>boolean</em> (ja/nein, wahr/falsch). ' +
        'Wer weiß, dass alle Beine-Werte Zahlen sind, kann die Karten zum Beispiel nach der Anzahl der Beine sortieren.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; drag = null; suppress = false; reset();
      noteEl = h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' });
      poolEl = h('div', { class: P + 'pool', role: 'group', 'aria-label': 'Typen zum Zuordnen' });
      slotEls = PROPS.map(function (p, i) { return h('button', { type: 'button', class: P + 'slot', 'data-i': String(i) }); });
      var types = h('ul', { class: P + 'types', 'aria-label': 'Die drei Typen' }, ['t', 'z', 'j'].map(function (k) {
        return h('li', null, h('span', { class: P + 'chip ' + P + TYPES[k].cls + ' ' + P + 'static' }, TYPES[k].name), h('span', { class: P + 'hint' }, TYPES[k].hint));
      }));
      var cols = h('div', { class: P + 'cols' }, PROPS.map(function (p, i) {
        return h('div', { class: P + 'col' }, h('div', { class: P + 'head' }, icon(p.key, P + 'big'), h('span', { class: P + 'lbl' }, p.label)), slotEls[i]);
      }));
      el.replaceChildren(h('div', { class: P + 'board' },
        h('ol', { class: P + 'cards', 'aria-label': 'Die sechs Ricca-Karten' }, CARDS.map(cardEl)),
        types,
        h('p', { class: P + 'lab' }, 'Typen zum Zuordnen:'), poolEl,
        cols, noteEl));
      el.addEventListener('click', onClick);
      el.addEventListener('pointerdown', onDown);
      if (winOff) winOff();
      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onCancel);
      winOff = function () {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onCancel);
        if (drag && drag.ghost) drag.ghost.remove();
        drag = null; winOff = null;
      };
      draw();
    },
    isComplete: function () { return slots.every(Boolean); },
    evaluate: function () {
      return { correct: ANSWER.every(function (k, i) { return slots[i] === k; }), answer: slots.slice() };
    },
    setAnswer: function (ans) {
      slots = Array.isArray(ans) ? ans.slice(0, 5) : [null, null, null, null, null];
      mark = 'check'; selected = null; draw();
    },
    lock: function (on) {
      locked = on; selected = null; mark = on ? 'check' : null;
      if (on) say(ANSWER.every(function (k, i) { return slots[i] === k; }) ? 'Alle Typen stimmen.' : 'Markiert ist, welche Zuordnungen stimmen.'); else say('');
      draw();
    },
    reset: function () { reset(); draw(); say(''); },
    showSolution: function () {
      slots = ANSWER.slice(); selected = null; mark = 'check'; locked = true; draw();
      say('Lösung: Name = Text, Augen und Beine = Zahlen, Flügel und Zähne = ja/nein.');
    }
  });
})();
