/* Aufgabe Herzbild (Biber 2022; Klasse 3-4 schwer, 5-6 mittel): Welche Folge von Umwandlungen macht aus Kreis und Quadrat ein Herz? */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-herzbild22-';
  var NS = 'http://www.w3.org/2000/svg';

  /* Antworten wie im Heft; Schritte: [Operation, Form] mit Operation d = drehe, v = verschiebe, p = verdopple */
  var OPTIONS = [
    { key: 'A', steps: [['p', 'k'], ['d', 'q'], ['v', 'k'], ['v', 'k']] },
    { key: 'B', steps: [['p', 'q'], ['d', 'q'], ['v', 'q'], ['v', 'k']] },
    { key: 'C', steps: [['p', 'k'], ['d', 'k'], ['v', 'k'], ['v', 'q']] },
    { key: 'D', steps: [['v', 'k'], ['v', 'k'], ['p', 'k'], ['v', 'q']] }
  ];
  var RIGHT = 0;   /* A: im Heft bestätigt (zwei Kreise + ein um 45° gedrehtes Quadrat) und per Skript über die Bedingungen geprüft */
  var OPNAME = { p: 'verdopple', d: 'drehe', v: 'verschiebe' };
  var SHAPE = { k: 'Kreis', q: 'Quadrat' };

  function stepText(s) { return OPNAME[s[0]] + ' ' + SHAPE[s[1]]; }
  function optionText(o) { return o.steps.map(stepText).join(', '); }

  /* ---------- Simulation: Welche Formen gibt es nach jedem Schritt? ---------- */
  function simulate(steps) {
    var objs = [{ k: 'k', rot: false, moved: false }, { k: 'q', rot: false, moved: false }];
    var states = [{ label: 'Start', objs: copy(objs) }];
    steps.forEach(function (s) {
      var op = s[0], kind = s[1];
      if (op === 'p') {
        var src = objs.filter(function (o) { return o.k === kind; })[0];
        objs.push({ k: kind, rot: src.rot, moved: src.moved });
      } else {
        var key = op === 'd' ? 'rot' : 'moved';
        var cand = objs.filter(function (o) { return o.k === kind && !o[key]; })[0] || objs.filter(function (o) { return o.k === kind; })[0];
        cand[key] = true;
      }
      states.push({ label: stepText(s), objs: copy(objs) });
    });
    return states;
  }
  function copy(list) { return list.map(function (o) { return { k: o.k, rot: o.rot, moved: o.moved }; }); }

  /* ---------- Zeichnen ---------- */
  function tag(name, attrs, inner) {
    var s = '<' + name;
    Object.keys(attrs).forEach(function (k) { s += ' ' + k + '="' + attrs[k] + '"'; });
    return s + (inner === undefined ? '/>' : '>' + inner + '</' + name + '>');
  }
  function shapeSvg(kind, cx, cy, size, rot, cls) {
    if (kind === 'k') return tag('circle', { cx: cx, cy: cy, r: size / 2, class: cls });
    return tag('rect', { x: cx - size / 2, y: cy - size / 2, width: size, height: size, class: cls, transform: rot ? 'rotate(45 ' + cx + ' ' + cy + ')' : '' });
  }
  /* Das Herz: zwei Kreise (Durchmesser = Seitenlänge) auf den oberen Kanten eines um 45 Grad gedrehten Quadrats */
  function heartSvg(cls, outline) {
    var s = 50, d = s / Math.SQRT2, c = 60;
    var cy = 68;
    var parts = shapeSvg('q', c, cy, s, true, cls) +
      shapeSvg('k', c - d / 2, cy - d / 2, s, false, cls) +
      shapeSvg('k', c + d / 2, cy - d / 2, s, false, cls);
    return '<svg class="' + P + 'heart" viewBox="0 0 120 112" role="img" aria-label="Das Herz, das am Ende entstehen soll' + (outline ? ': zwei Kreise und ein um 45 Grad gedrehtes Quadrat' : '') + '">' + parts + '</svg>';
  }
  function startSvg() {
    return '<svg class="' + P + 'pair" viewBox="0 0 120 56" role="img" aria-label="Am Anfang: ein Kreis und ein Quadrat">' +
      shapeSvg('k', 30, 28, 40, false, P + 'sh') + shapeSvg('q', 88, 28, 40, false, P + 'sh') + '</svg>';
  }
  function stateSvg(st, label) {
    var slot = { k: [34, 46], q: [88, 46] }, size = 28, out = '';
    ['k', 'q'].forEach(function (kind) {
      var list = st.objs.filter(function (o) { return o.k === kind; });
      /* gleich aussehende Formen liegen genau übereinander: zusammenfassen */
      var groups = {};
      list.forEach(function (o) {
        var key = (o.rot ? 'r' : 'n') + (o.moved ? 'm' : 's');
        (groups[key] = groups[key] || []).push(o);
      });
      Object.keys(groups).forEach(function (key) {
        var g = groups[key], moved = key.charAt(1) === 'm', rot = key.charAt(0) === 'r';
        var x = slot[kind][0] + (moved ? 9 : 0), y = slot[kind][1] + (moved ? -17 : 0);
        if (moved) out += shapeSvg(kind, slot[kind][0], slot[kind][1], size, rot, P + 'ghost');
        out += shapeSvg(kind, x, y, size, rot, P + 'sh');
        if (g.length > 1) out += tag('text', { x: x + size / 2 + 2, y: y - size / 2 + 2, class: P + 'cnt' }, '×' + g.length);
      });
    });
    return '<svg class="' + P + 'state" viewBox="0 0 120 72" role="img" aria-label="' + label + '">' + out + '</svg>';
  }
  function describe(st) {
    var parts = [];
    ['k', 'q'].forEach(function (kind) {
      var list = st.objs.filter(function (o) { return o.k === kind; });
      var n = list.length;
      if (!n) return;
      var rot = list.filter(function (o) { return o.rot; }).length, mv = list.filter(function (o) { return o.moved; }).length;
      var t = n + ' ' + (kind === 'k' ? (n === 1 ? 'Kreis' : 'Kreise') : (n === 1 ? 'Quadrat' : 'Quadrate'));
      var extra = [];
      if (rot) extra.push(rot + ' gedreht');
      if (mv) extra.push(mv + ' verschoben');
      parts.push(t + (extra.length ? ' (' + extra.join(', ') + ')' : ''));
    });
    return parts.join(', ');
  }
  function flowHtml(o) {
    var sts = simulate(o.steps);
    return '<ol class="' + P + 'flow">' + sts.map(function (st, i) {
      var txt = (i ? i + '. ' : '') + st.label;
      return '<li>' + stateSvg(st, txt + ': ' + describe(st)) + '<span class="' + P + 'cap">' + txt + '</span><span class="' + P + 'inv">' + describe(st) + '</span></li>';
    }).join('') + '</ol>';
  }

  var el, api, radios, flows, toggles, selected, locked, mark, shown;

  function reset() { selected = null; mark = null; shown = [false, false, false, false]; }

  function choose(i, focus) {
    if (locked) return;
    selected = i;
    refresh();
    if (focus) radios[i].focus();
    api.changed();
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
      flows[i].hidden = !shown[i];
      toggles[i].setAttribute('aria-expanded', String(shown[i]));
      toggles[i].textContent = shown[i] ? 'Ablauf verbergen' : 'Ablauf zeigen';
    });
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
    id: 'herzbild22',
    story:
      '<p>Tina hat zuerst zwei Formen gezeichnet: einen Kreis und ein Quadrat. Daraus hat sie ein Herz gemacht. Sie hat dabei nur diese Umwandlungen benutzt:</p>' +
      '<ul><li><b>drehe:</b> eine Form beliebig drehen</li><li><b>verschiebe:</b> eine Form beliebig verschieben</li><li><b>verdopple:</b> eine Form an gleicher Stelle verdoppeln</li></ul>',
    question: 'Wie hat Tina das Herz gemacht?',
    howto: 'Wähle eine Antwort. Mit „Ablauf zeigen“ kannst du bei jeder Antwort Schritt für Schritt sehen, welche Formen es nach jeder Umwandlung gibt.',
    explanation: function () {
      return '<p>Das Herz besteht aus <strong>zwei Kreisen</strong> und einem <strong>um 45 Grad gedrehten Quadrat</strong>. Tina braucht also „verdopple Kreis“, damit es zwei Kreise gibt, und „drehe Quadrat“, damit das Quadrat auf der Spitze steht. Nur Antwort A hat beides. ' +
        'Bei B wird ein Quadrat verdoppelt statt des Kreises, bei C wird der Kreis gedreht statt des Quadrats, und bei D wird gar nichts gedreht.</p>' +
        '<div class="' + P + 'expl">' + heartSvg(P + 'hf', true) + '<span>Das Herz: zwei Kreise und ein gedrehtes Quadrat. Mit A braucht Tina dafür vier Schritte: verdoppeln, drehen, zwei Kreise an die richtige Stelle schieben.</span></div>' +
        '<p>So arbeitet auch ein Computerprogramm: Es besteht aus einer Folge von Anweisungen, und die meisten davon wenden eine Operation auf ein Objekt an. Hier sind die Objekte Kreis und Quadrat, die Operationen drehen, verschieben und verdoppeln.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      radios = []; flows = []; toggles = [];
      var cards = OPTIONS.map(function (o, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: P + 'opt', 'data-opt': o.key,
          'aria-label': 'Antwort ' + o.key + ': ' + optionText(o),
          onclick: function () { choose(i, false); }, onkeydown: onKey
        });
        btn.innerHTML = '<span class="' + P + 'key" aria-hidden="true">' + o.key + '</span><span class="' + P + 'txt">' +
          o.steps.map(function (s, j) { return '<span class="' + P + 'step">' + (j + 1) + '. ' + stepText(s) + '</span>'; }).join('') + '</span>';
        var flow = h('div', { class: P + 'flowbox', hidden: true });
        flow.innerHTML = flowHtml(o);
        var tg = h('button', {
          type: 'button', class: 'btn ghost ' + P + 'tg', 'aria-expanded': 'false',
          'aria-label': 'Ablauf von Antwort ' + o.key + ' zeigen oder verbergen',
          onclick: function () { shown[i] = !shown[i]; refresh(); }
        }, 'Ablauf zeigen');
        radios.push(btn); flows.push(flow); toggles.push(tg);
        return h('div', { class: P + 'card' }, btn, tg, flow);
      });
      var fig = h('div', { class: P + 'fig', role: 'group', 'aria-label': 'Aus Kreis und Quadrat soll ein Herz werden' });
      fig.innerHTML = startSvg() + '<span class="' + P + 'arrow" aria-hidden="true">?</span>' + heartSvg(P + 'hf', false);
      el.replaceChildren(h('div', { class: P + 'board' }, fig,
        h('div', { class: P + 'opts', role: 'radiogroup', 'aria-label': 'Antworten' }, cards)));
      refresh();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () { return { correct: selected === RIGHT, answer: { choice: OPTIONS[selected].key } }; },
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
    showSolution: function () { selected = RIGHT; mark = 'solution'; locked = true; shown[RIGHT] = true; refresh(); }
  });
})();
