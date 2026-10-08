/* Aufgabe Stammbaum (Klasse 7-8 mittel, 9-10 einfach): Verwandtschaft als verschachtelte Funktionen Vater(...) / Mutter(...) */
(function () {
  'use strict';
  var h = Biber.h;

  /* ---------- Der Stammbaum aus dem Heft ----------
     Namen stehen nur bei den beschrifteten Bibern. Die anderen heißen nach ihrer Rolle im Bild:
     cBoss = Mann von Christina (rote Kappe), wB = Frau von Bernd (grün), wO / oH = oranges Paar (Frau / Mann),
     wC / cH = hellblaues Paar (Frau / Mann). */
  var FATHER = { Bernd: 'cBoss', Annika: 'Bernd', wB: 'Emil', wO: 'Emil', wC: 'oH', Daniel: 'cH', tL: 'cH', tR: 'cH' };
  var MOTHER = { Bernd: 'Christina', Annika: 'wB', wB: 'Gerda', wO: 'Gerda', wC: 'wO', Daniel: 'wC', tL: 'wC', tR: 'wC' };
  var NAMES = { Christina: 'Christina', Emil: 'Emil', Gerda: 'Gerda', Bernd: 'Bernd', Annika: 'Annika', Daniel: 'Daniel' };
  var FN = { Vater: FATHER, Mutter: MOTHER };

  /* Auswertung: f1(f2(f3(Daniel))), die Liste enthält die Namen von außen nach innen */
  function applyAll(seq, start) {
    var cur = start;
    for (var i = seq.length - 1; i >= 0; i--) {
      cur = FN[seq[i]][cur];
      if (!cur) return null;
    }
    return cur;
  }
  var TARGET = applyAll(['Vater', 'Mutter'], 'Annika');      /* linke Seite: Vater(Mutter(Annika)) = Emil */
  var SOLUTION = ['Vater', 'Mutter', 'Mutter'];              /* einzige Möglichkeit, per Brute Force geprüft (8 Kombinationen) */
  var SLOTS = 3;
  function who(p) { return p ? (NAMES[p] || null) : null; }

  var ALT_TREE = 'Stammbaum. Christina (rote Schleife) und ihr Mann (rote Kappe) haben einen Sohn: Bernd (grüne Kappe). Bernd und seine Frau (grüne Schleife) haben eine Tochter: Annika (rosa Schleife). ' +
    'Emil (blaue Kappe) und Gerda (blaue Schleife) haben zwei Töchter: die Frau von Bernd und die Frau eines Mannes mit oranger Kappe (orange Schleife). ' +
    'Das orange Paar hat eine Tochter (hellblaue Schleife), die mit einem Mann mit hellblauer Kappe verheiratet ist. Dieses hellblaue Paar hat drei Kinder: Daniel (lila Kappe), eine Tochter mit lila Schleife und eine Tochter mit blauer Schleife.';

  var el, api, locked, slots, active, mode, dragging;

  function resetState() { slots = [null, null, null]; active = 0; mode = null; dragging = null; }
  function firstEmpty() { for (var i = 0; i < SLOTS; i++) if (!slots[i]) return i; return -1; }
  function isFull() { return firstEmpty() < 0; }
  function result() { return isFull() ? applyAll(slots, 'Daniel') : null; }
  function isCorrect() { return isFull() && result() === TARGET; }

  function statusText() {
    var n = slots.filter(Boolean).length;
    if (n === SLOTS) return '';
    return n === 0 ? '' : (SLOTS - n === 1 ? 'Es fehlt noch ein Feld.' : 'Es fehlen noch ' + (SLOTS - n) + ' Felder.');
  }

  function chip(kind, cls, extra) {
    var im = kind === 'Vater' ? 'assets/stammbaum/vater.png' : 'assets/stammbaum/mutter.png';
    return h('span', { class: 'sb-chip ' + (kind === 'Vater' ? 'sb-v' : 'sb-m') + (cls ? ' ' + cls : '') },
      h('img', { src: im, alt: '', width: 28, height: 26, draggable: 'false' }), kind, extra || null);
  }
  function nameTag(name, cls) { return h('span', { class: 'sb-name ' + cls }, name); }
  function paren(t) { return h('span', { class: 'sb-par', 'aria-hidden': 'true' }, t); }

  function render() {
    var res = result();
    var left = h('span', { class: 'sb-side', role: 'group', 'aria-label': 'Vater von Mutter von Annika' },
      chip('Vater', 'sb-fix'), paren('('), chip('Mutter', 'sb-fix'), paren('('), nameTag('Annika', 'sb-annika'), paren('))'));

    var rightParts = [];
    for (var i = 0; i < SLOTS; i++) {
      var k = slots[i];
      var cls = 'sb-slot' + (k ? ' filled ' + (k === 'Vater' ? 'sb-v' : 'sb-m') : '') + (!locked && active === i ? ' active' : '');
      if (mode && k) cls += isCorrect() ? ' right' : ' wrong';
      var slot = h('button', {
        type: 'button', class: cls, 'data-slot': String(i), draggable: k && !locked ? 'true' : false, disabled: locked,
        'aria-label': 'Feld ' + (i + 1) + ' von ' + SLOTS + ' auf der rechten Seite: ' + (k || 'leer') + (!locked && active === i ? ' (ausgewählt)' : '')
      });
      if (k) slot.append(h('img', { src: k === 'Vater' ? 'assets/stammbaum/vater.png' : 'assets/stammbaum/mutter.png', alt: '', width: 28, height: 26, draggable: 'false' }), k);
      else slot.append(h('span', { class: 'sb-ph' }, String(i + 1)));
      rightParts.push(slot, paren('('));
    }
    rightParts.push(nameTag('Daniel', 'sb-daniel'), paren(')))'));
    var right = h('span', { class: 'sb-side sb-right', 'data-drop': '' }, rightParts);

    var eq = h('div', { class: 'sb-eq', 'data-eq': '' }, left, h('span', { class: 'sb-is', 'aria-hidden': 'true' }, '='), right);

    var pal = ['Vater', 'Mutter'].map(function (kind) {
      var b = h('button', {
        type: 'button', class: 'sb-pal ' + (kind === 'Vater' ? 'sb-v' : 'sb-m'), 'data-pal': kind, draggable: locked ? false : 'true', disabled: locked,
        'aria-label': kind + ' einsetzen'
      });
      b.append(h('img', { src: kind === 'Vater' ? 'assets/stammbaum/vater.png' : 'assets/stammbaum/mutter.png', alt: '', width: 56, height: 52, draggable: 'false' }), h('span', null, kind));
      return b;
    });

    var info = null;
    if (mode && isFull()) {
      var nm = who(res);
      var txt = isCorrect()
        ? 'Beide Seiten ergeben ' + NAMES[TARGET] + '.'
        : 'Deine rechte Seite ergibt ' + (res ? (nm ? nm : 'einen Biber ohne Namen im Stammbaum') : 'einen Biber, der im Stammbaum nicht vorkommt') + ', die linke Seite ergibt ' + NAMES[TARGET] + '.';
      info = h('p', { class: 'sb-info' + (isCorrect() ? ' ok' : ' bad') }, txt);
    }

    el.replaceChildren(h('div', { class: 'sb-board' },
      h('div', { class: 'sb-eqwrap', role: 'group', 'aria-label': 'Gleichung: Vater von Mutter von Annika ist gleich drei Funktionen, angewendet auf Daniel' }, eq),
      h('div', { class: 'sb-palette', 'data-pool': '', role: 'group', 'aria-label': 'Bausteine zum Einsetzen' }, pal),
      info));
  }

  function put(kind, idx) {
    if (locked) return;
    slots[idx] = kind;
    var nx = firstEmpty();
    active = nx >= 0 ? nx : null;
    render();
    api.changed(statusText());
  }
  function clearSlot(idx) {
    if (locked) return;
    slots[idx] = null;
    active = idx;
    render();
    api.changed(statusText());
  }

  function onClick(e) {
    if (locked) return;
    var p = e.target.closest('[data-pal]');
    if (p) {
      var idx = active != null ? active : firstEmpty();
      if (idx < 0) return;              /* alles gefüllt und kein Feld gewählt: erst ein Feld antippen */
      put(p.dataset.pal, idx);
      return;
    }
    var s = e.target.closest('[data-slot]');
    if (s) {
      var i = +s.dataset.slot;
      if (slots[i]) clearSlot(i); else { active = i; render(); }
    }
  }
  function onDragStart(e) {
    var t = e.target.closest('[data-pal],[data-slot]');
    if (!t || locked) return;
    if (t.dataset.pal) dragging = { kind: t.dataset.pal, from: null };
    else { var i = +t.dataset.slot; if (!slots[i]) return; dragging = { kind: slots[i], from: i }; }
    e.dataTransfer.setData('text/plain', dragging.kind);
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e) {
    if (!dragging) return;
    var s = e.target.closest('[data-slot],[data-pool]');
    if (!s) return;
    e.preventDefault();
    if (s.dataset.slot) s.classList.add('over');
  }
  function onDragLeave(e) {
    var s = e.target.closest('[data-slot]');
    if (s) s.classList.remove('over');
  }
  function onDrop(e) {
    if (!dragging) return;
    var s = e.target.closest('[data-slot],[data-pool]');
    if (!s) return;
    e.preventDefault();
    var d = dragging;
    dragging = null;
    if (s.dataset.slot) {
      var to = +s.dataset.slot;
      if (d.from != null) { var other = slots[to]; slots[d.from] = other; }
      put(d.kind, to);
    } else if (d.from != null) clearSlot(d.from);
  }
  function onDragEnd() { dragging = null; if (!locked) render(); }

  Biber.register({
    id: 'stammbaum',
    story:
      '<p>Die Biber Annika und Daniel wollen wissen, wie sie miteinander verwandt sind. Annika hat einen Stammbaum ihrer gemeinsamen Familie. Darin tragen die männlichen Biber eine Kappe und die weiblichen eine Schleife.</p>' +
      '<p>Annika verwendet eine Kurzschreibweise:</p>' +
      '<ul class="sb-list"><li><code>Vater(X)</code> steht für „Vater von Biber X“</li><li><code>Mutter(X)</code> steht für „Mutter von Biber X“</li></ul>' +
      '<p>Annikas Vater ist Bernd, und Bernds Mutter ist Christina. Das beschreibt Annika mit Hilfe von Gleichungen so:</p>' +
      '<ul class="sb-list"><li><code>Vater(Annika) = Bernd</code></li><li><code>Mutter(Bernd) = Christina</code></li></ul>' +
      '<p>Ihre Verwandtschaft mit Christina kann Annika auch mit nur einer Gleichung beschreiben:</p>' +
      '<ul class="sb-list"><li><code>Mutter(Vater(Annika)) = Christina</code> steht für „Mutter vom Vater von Annika ist Christina“</li></ul>' +
      '<figure class="sb-fig"><img class="sb-tree" src="assets/stammbaum/tree.png" width="1149" height="963" alt="' + ALT_TREE + '"></figure>' +
      '<p>Nun hätte sie gerne eine Gleichung für ihre Verwandtschaft mit Daniel.</p>',
    question: 'Ergänze die folgende Gleichung so, dass sie die Verwandtschaft zwischen Annika und Daniel beschreibt.',
    howto: 'Tippe auf „Vater“ oder „Mutter“, um das markierte Feld zu füllen. Du kannst die Bausteine auch in die Felder ziehen. Ein gefülltes Feld leerst du mit einem Tipp.',
    explanation: function () {
      return '<p>Eine Gleichung wie <code>Vater(Mutter(Annika))</code> liest man von innen nach außen: Zuerst die Mutter von Annika (die Frau von Bernd), davon der Vater. Das ist Emil, denn Emil und Gerda sind die Eltern von Bernds Frau.</p>' +
        '<p>Auch Daniel hängt an Emil: Die Mutter von Daniel ist die Frau im hellblauen Paar. Ihre Mutter ist die Frau im orangen Paar, und deren Vater ist Emil. Daher gilt</p>' +
        '<p class="sb-eqx"><code>Vater(Mutter(Annika)) = Vater(Mutter(Mutter(Daniel)))</code></p>' +
        '<p>Annika und Daniel haben also einen gemeinsamen Urgroßvater: Emil ist der Großvater von Annikas Mutter und der Urgroßvater von Daniel. Vater und Mutter sind Funktionen, die zu jedem Biber genau einen Biber liefern. Man kann sie ineinander schachteln, so wie hier. Keine andere Reihenfolge von Vater und Mutter führt auf der rechten Seite zu Emil.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; resetState();
      el.addEventListener('click', onClick);
      el.addEventListener('dragstart', onDragStart);
      el.addEventListener('dragover', onDragOver);
      el.addEventListener('dragleave', onDragLeave);
      el.addEventListener('drop', onDrop);
      el.addEventListener('dragend', onDragEnd);
      render();
    },
    isComplete: function () { return isFull(); },
    evaluate: function () { return { correct: isCorrect(), answer: slots.slice() }; },
    setAnswer: function (ans) {
      slots = [null, null, null];
      for (var i = 0; i < SLOTS; i++) slots[i] = ans && FN[ans[i]] ? ans[i] : null;
      active = null;
      mode = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mode = on ? 'check' : null;
      if (!on) { var nx = firstEmpty(); active = nx >= 0 ? nx : null; }
      render();
    },
    reset: function () { resetState(); render(); },
    showSolution: function () {
      slots = SOLUTION.slice();
      active = null;
      locked = true;
      mode = 'check';
      render();
    }
  });
})();
