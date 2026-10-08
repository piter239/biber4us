/* Aufgabe Verrückte Lampe (Logik, Operatoren): Wie muss das Bild hängen, damit das Licht aus ist? */
(function () {
  'use strict';
  var h = Biber.h;

  var IMG = 'assets/lampe/bild.png';
  var IW = 292, IH = 321;

  // Die drei Hängungen des Bildes, in der Reihenfolge der Tabelle im Heft
  var PICS = [
    { name: 'gerade', rot: 0, alt: 'Bild hängt gerade', rule: function (l, r) { return l !== r; } },
    { name: 'nach rechts gekippt', rot: 26, alt: 'Bild hängt nach rechts gekippt', rule: function (l, r) { return l || r; } },
    { name: 'nach links gekippt', rot: -26, alt: 'Bild hängt nach links gekippt', rule: function (l, r) { return l && r; } }
  ];
  var LEFT = false, RIGHT = true;          // linker Schalter aus, rechter Schalter an
  var SOLUTION = 2;                        // nur beim nach links gekippten Bild ist das Licht aus

  function lightOf(i) { return !!PICS[i].rule(LEFT, RIGHT); }

  /* ---- Schalter als SVG (viewBox 40 x 56) ---- */
  function swInner(side, on) {
    var px = side === 'L' ? 14 : 26;
    var tx = side === 'L' ? 5 : 35;
    var ty = on ? 12 : 44;
    var col = on ? 'var(--c2)' : 'var(--muted)';
    return '<rect x="14" y="8" width="12" height="40" rx="2" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.5"/>' +
      '<line x1="' + px + '" y1="28" x2="' + tx + '" y2="' + ty + '" stroke="' + col + '" stroke-width="6" stroke-linecap="round"/>' +
      '<circle cx="' + px + '" cy="28" r="6" fill="' + col + '" stroke="var(--ink)" stroke-width="1.5"/>';
  }
  function sw(side, on) {
    return '<svg class="lp-sw" viewBox="0 0 40 56" aria-hidden="true" focusable="false">' + swInner(side, on) + '</svg>';
  }
  function swPair(l, r) {
    return '<span class="lp-pair" role="img" aria-label="linker Schalter ' + (l ? 'an' : 'aus') + ', rechter Schalter ' + (r ? 'an' : 'aus') + '">' +
      sw('L', l) + sw('R', r) + '</span>';
  }
  function inl(on) {
    return '<span class="lp-inl" role="img" aria-label="' + (on ? 'Schalter an: Hebel oben' : 'Schalter aus: Hebel unten') + '">' + sw('L', on) + sw('R', on) + '</span>';
  }
  function pic(i, cls) {
    return '<span class="lp-pic ' + (cls || '') + '" style="--rot:' + PICS[i].rot + 'deg"><img src="' + IMG + '" width="' + IW + '" height="' + IH + '" alt="' + (cls === 'lp-deco' ? '' : PICS[i].alt) + '" draggable="false"></span>';
  }

  function storyHtml() {
    var rows = [
      { p: 0, a: 'genau einer ist <strong>an</strong>: ' + swPair(false, true) + ' oder ' + swPair(true, false), an: 'an', so: 'aus' },
      { p: 1, a: 'beide sind <strong>aus</strong>: ' + swPair(false, false), an: 'aus', so: 'an' },
      { p: 2, a: 'beide sind <strong>an</strong>: ' + swPair(true, true), an: 'an', so: 'aus' }
    ];
    // Reihenfolge der Schalterpaare im ersten Fall wie im Heft: links an / rechts aus, dann links aus / rechts an
    rows[0].a = 'genau einer ist <strong>an</strong>: ' + swPair(true, false) + ' oder ' + swPair(false, true);
    var tbody = rows.map(function (r) {
      return '<tr><td class="lp-bild" rowspan="2">' + pic(r.p) + '</td><td>' + r.a + '</td><td class="lp-res">' + r.an + '</td></tr>' +
        '<tr><td class="lp-sonst">sonst</td><td class="lp-res">' + r.so + '</td></tr>';
    }).join('');
    return '<p>Viktoria Volt hat eine verrückte Lampe gebaut. Die Lampe hat zwei Lichtschalter: einer links und einer rechts. ' +
      'Jeder Lichtschalter kann entweder <strong>an</strong> (' + inl(true) + ') oder <strong>aus</strong> (' + inl(false) + ') sein.</p>' +
      '<p>Die verrückte Lampe hat aber noch einen dritten, geheimen Schalter: ein Bild! Je nachdem, wie das Bild hängt (gerade, nach rechts gekippt oder nach links gekippt), funktionieren die Lichtschalter anders.</p>' +
      '<p>Diese Tabelle sagt, wie die Schalter jeweils das Licht an oder aus machen:</p>' +
      '<table class="lp-tab"><thead><tr><th scope="col">Bild</th><th scope="col">Lichtschalter</th><th scope="col">Licht</th></tr></thead><tbody>' + tbody + '</tbody></table>' +
      '<p><strong>Der linke Lichtschalter ist aus, der rechte Lichtschalter ist an.</strong></p>';
  }

  /* ---- Szene: Wand mit Lampe, Schaltern und Bild ---- */
  function scene(sel, lit) {
    var cone = lit === true ? '<polygon points="172,78 188,78 284,222 76,222" fill="var(--c2)" opacity="0.3"/>' : '';
    var bulb = lit === true ? 'var(--c2)' : (lit === false ? 'var(--surface)' : 'var(--paper)');
    var picture;
    if (sel === null) {
      picture = '<g transform="translate(180 168)"><rect x="-55" y="-60" width="110" height="121" rx="4" fill="none" stroke="var(--muted)" stroke-width="3" stroke-dasharray="8 6"/>' +
        '<text x="0" y="14" text-anchor="middle" font-size="44" font-weight="700" fill="var(--muted)">?</text></g>';
    } else {
      picture = '<g transform="translate(180 168) rotate(' + PICS[sel].rot + ')"><image href="' + IMG + '" x="-55" y="-60.5" width="110" height="121"/></g>';
    }
    var label = 'Wand mit Lampe. Linker Schalter aus, rechter Schalter an. ' +
      (sel === null ? 'Noch kein Bild gewählt.' : PICS[sel].alt + '.') +
      (lit === true ? ' Das Licht ist an.' : lit === false ? ' Das Licht ist aus.' : '');
    return '<svg class="lp-scene" viewBox="0 0 360 272" role="img" aria-label="' + label + '">' +
      '<rect x="0" y="0" width="360" height="252" rx="14" fill="var(--surface2)" stroke="var(--line)" stroke-width="2"/>' +
      '<rect x="0" y="252" width="360" height="20" rx="6" fill="var(--line)"/>' +
      cone +
      '<line x1="180" y1="0" x2="180" y2="26" stroke="var(--ink)" stroke-width="3"/>' +
      '<path d="M146,64 Q146,30 180,28 Q214,30 214,64 Z" fill="var(--paper)" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/>' +
      '<circle cx="180" cy="72" r="9" fill="' + bulb + '" stroke="var(--ink)" stroke-width="3"/>' +
      picture +
      '<svg x="12" y="140" width="40" height="56" viewBox="0 0 40 56">' + swInner('L', LEFT) + '</svg>' +
      '<svg x="308" y="140" width="40" height="56" viewBox="0 0 40 56">' + swInner('R', RIGHT) + '</svg>' +
      '<text x="8" y="218" text-anchor="start" font-size="14" font-weight="700" fill="var(--ink)">links: aus</text>' +
      '<text x="352" y="218" text-anchor="end" font-size="14" font-weight="700" fill="var(--ink)">rechts: an</text>' +
      '</svg>';
  }

  var el, api, sceneBox, radios, selected, locked, mark;

  function reset() { selected = null; mark = null; }

  function choose(i, focus) {
    if (locked) return;
    selected = i;
    refresh();
    if (focus) radios[i].focus();
    api.changed();
  }

  function refresh() {
    var lit = (mark !== null && selected !== null) ? lightOf(selected) : null;
    sceneBox.innerHTML = scene(selected, lit);
    radios.forEach(function (btn, i) {
      var on = selected === i;
      btn.setAttribute('aria-checked', String(on));
      btn.setAttribute('aria-disabled', locked ? 'true' : 'false');
      btn.tabIndex = (selected === null ? i === 0 : on) ? 0 : -1;
      btn.classList.toggle('selected', on);
      var ok = i === SOLUTION;
      btn.classList.toggle('right', on && mark !== null && ok);
      btn.classList.toggle('wrong', on && mark === 'check' && !ok);
      var m = btn.querySelector('.lp-mark');
      if (m) m.remove();
      if (on && mark !== null) btn.appendChild(h('span', { class: 'lp-mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
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
    id: 'lampe',
    story: storyHtml(),
    question: 'Wie muss das Bild hängen, damit das Licht aus ist?',
    howto: 'Wähle, wie das Bild hängen soll. Das Licht zeigt dir die Lampe, wenn du die Antwort prüfst.',
    explanation: function () {
      var rows = [
        [0, 'Genau einer der beiden Schalter ist an. Das stimmt hier, also ist das Licht <strong>an</strong>.'],
        [1, 'Die Schalter sind nicht beide aus (der rechte ist an). Also ist das Licht <strong>an</strong>.'],
        [2, 'Beide müssten an sein, aber der linke ist aus. Also ist das Licht <strong>aus</strong>.']
      ];
      return '<p>Man probiert jede Hängung des Bildes mit „links aus, rechts an“ durch:</p>' +
        '<ul class="lp-why">' + rows.map(function (r) {
          return '<li>' + pic(r[0], 'lp-small lp-deco') + '<div><strong>Bild ' + PICS[r[0]].name + '</strong><span>' + r[1] + '</span></div></li>';
        }).join('') + '</ul>' +
        '<p>Nur wenn das Bild <strong>nach links gekippt</strong> hängt, ist das Licht aus. Solche Regeln heißen in der Informatik Operatoren: „genau einer“ (XOR), „mindestens einer“ (ODER) und „beide“ (UND).</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      sceneBox = h('div', { class: 'lp-scene-box' });
      radios = PICS.map(function (p, i) {
        var btn = h('button', {
          type: 'button', role: 'radio', class: 'lp-opt', 'data-pic': String(i),
          'aria-label': 'Bild ' + p.name,
          onclick: function () { choose(i, false); },
          onkeydown: onKey
        });
        btn.innerHTML = pic(i, 'lp-deco') + '<span class="lp-name" aria-hidden="true">' + p.name + '</span>';
        return btn;
      });
      el.replaceChildren(h('div', { class: 'lp-board' }, sceneBox,
        h('div', { class: 'lp-opts', role: 'radiogroup', 'aria-label': 'Wie hängt das Bild?' }, radios)));
      refresh();
    },
    isComplete: function () { return selected !== null; },
    evaluate: function () { return { correct: selected === SOLUTION, answer: { pic: selected } }; },
    setAnswer: function (ans) {
      selected = ans && typeof ans.pic === 'number' && PICS[ans.pic] ? ans.pic : null;
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      refresh();
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () { selected = SOLUTION; mark = 'solution'; locked = true; refresh(); }
  });
})();
