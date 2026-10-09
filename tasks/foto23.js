/* Aufgabe Foto (Biber 2023, Klasse 5-6 einfach): Reihenfolge von vier Baumstämmen im Kreis (zyklische Liste) erkennen */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-foto23-';
  var A = 'assets/foto23/';

  /* Stämme: 1 angespitzt (grün), 2 braun mit Blättern, 3 Birke, 4 dicker brauner Stamm.
     Reihenfolge im Uhrzeigersinn ab dem angespitzten Stamm (Heft S. 29: "Foto A: 1-3-2-4" usw.). */
  var REF = [1, 2, 3, 4];
  var OPTIONS = [
    { key: 'A', img: 'fotoa.png', order: [1, 3, 2, 4], alt: 'Foto A: vier Baumstämme wie Windmühlenflügel um die Mitte, oben links ein brauner Stamm, rechts ein dicker brauner Stamm, unten ein grüner Stamm und links unten ein Birkenstamm.' },
    { key: 'B', img: 'fotob.png', order: [1, 4, 3, 2], alt: 'Foto B: vier Baumstämme um die Mitte, oben links ein brauner Stamm, oben rechts ein grüner Stamm, rechts unten ein dicker brauner Stamm und links unten ein Birkenstamm.' },
    { key: 'C', img: 'fotoc.png', order: [1, 3, 4, 2], alt: 'Foto C: vier Baumstämme um die Mitte, links ein brauner Stamm, oben rechts ein grüner Stamm, rechts unten ein Birkenstamm und links unten ein dicker brauner Stamm.' },
    { key: 'D', img: 'fotod.png', order: [1, 2, 3, 4], alt: 'Foto D: vier Baumstämme um die Mitte, oben links ein grüner Stamm, rechts ein brauner Stamm mit Blättern, unten rechts ein Birkenstamm und links unten ein dicker brauner Stamm.' }
  ];
  /* gleiche zyklische Reihenfolge wie das Foto des Bibers? */
  function sameCycle(a, b) {
    for (var k = 0; k < a.length; k++) {
      var ok = true;
      for (var i = 0; i < a.length; i++) if (a[(i + k) % a.length] !== b[i]) { ok = false; break; }
      if (ok) return true;
    }
    return false;
  }
  var RIGHT = -1;
  OPTIONS.forEach(function (o, i) { if (sameCycle(o.order, REF)) RIGHT = i; });   /* D */

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

  Biber.register({
    id: 'foto23',
    story: '<p>Der Biber hat gerade ein Foto gemacht. Er sitzt oben auf dem Baumstamm und fotografiert von oben auf die vier Stämme, die unten aufgestellt sind.</p>',
    question: 'Welches der vier Fotos ist es?',
    howto: 'Wähle das Foto aus, das der Biber gemacht hat.',
    explanation: function () {
      return '<p>Die Stämme stehen im Kreis. Wichtig ist ihre <strong>Reihenfolge</strong> rundherum. Nummeriere sie ab dem angespitzten Stamm: 1 angespitzter Stamm, 2 brauner Stamm mit Blättern, 3 Birkenstamm, 4 dicker brauner Stamm. Auf dem richtigen Foto folgen sie im Kreis genau so aufeinander.</p>' +
        '<div class="' + P + 'exp"><figure><img src="' + A + 'num_scene.png" width="519" height="519" loading="lazy" alt="Die vier Baumstämme mit den Nummern 1 bis 4"><figcaption>Die Stämme mit Nummern</figcaption></figure>' +
        '<figure><img src="' + A + 'num_d.png" width="519" height="468" loading="lazy" alt="Foto D mit den Nummern 1 bis 4 im Kreis"><figcaption>Foto D: 1 – 2 – 3 – 4</figcaption></figure></div>' +
        '<p>Geht man auf den Fotos ab dem angespitzten Stamm rundherum, ergibt sich: A: 1 – 3 – 2 – 4, B: 1 – 4 – 3 – 2, C: 1 – 3 – 4 – 2 und D: 1 – 2 – 3 – 4. Nur <strong>D</strong> zeigt die richtige Reihenfolge.</p>' +
        '<p>Ein Computer kann solche Anordnungen in einer <em>verketteten Liste</em> speichern: Jedes Element kennt seinen Nachfolger, und das letzte verweist wieder auf das erste. So kann man bei jedem beliebigen Stamm anfangen und im Kreis herum alle durchgehen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      radios = OPTIONS.map(function (o, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': o.key,
          'aria-label': 'Foto ' + o.key + ': ' + o.alt.replace(/^Foto [A-D]: /, ''),
          onclick: function () { choose(i, false); }, onkeydown: onKey
        });
        btn.appendChild(h('span', { class: P + 'key', 'aria-hidden': 'true' }, o.key));
        btn.appendChild(h('span', { class: P + 'ph' }, h('img', { src: A + o.img, alt: '', draggable: 'false', width: 300, height: 300 })));
        return btn;
      });
      el.replaceChildren(h('div', { class: P + 'board' },
        h('div', { class: P + 'scene' }, h('img', { src: A + 'scene.png', width: 544, height: 585, alt: 'Ein Biber sitzt auf einem Ast eines hohen Baumstamms und richtet seine Kamera von oben auf vier Baumstämme, die unten wie ein Zelt gegeneinander lehnen: ein angespitzter grüner Stamm in der Mitte, ein brauner Stamm mit Blättern hinten rechts, ein Birkenstamm vorn rechts und ein dicker brauner Stamm vorn links.' })),
        h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Fotos A bis D' }, radios)));
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
})();
