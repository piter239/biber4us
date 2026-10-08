/* Aufgabe Blumenstrauß (Heft 2023, Klasse 3-4 mittel, 5-6 einfach): Algorithmus, Verzweigung, Schleife */
(function () {
  'use strict';
  var h = Biber.h;

  var NAMES = { d: 'Margarite', t: 'Tulpe', z: 'Zweig' };
  /* Eimer A: zwei Margeriten, zwei Tulpen; Eimer B: drei Zweige (wie im Heft) */
  var ITEMS = [
    { id: 'a1', k: 'd', bucket: 'A' }, { id: 'a2', k: 'd', bucket: 'A' },
    { id: 'a3', k: 't', bucket: 'A' }, { id: 'a4', k: 't', bucket: 'A' },
    { id: 'b1', k: 'z', bucket: 'B' }, { id: 'b2', k: 'z', bucket: 'B' }, { id: 'b3', k: 'z', bucket: 'B' }
  ];
  var SIZE = 4;

  function itemOf(id) { return ITEMS.filter(function (i) { return i.id === id; })[0]; }
  function count(kinds, k) { return kinds.filter(function (x) { return x === k; }).length; }
  /* Nach der Anleitung entsteht entweder Tulpe + 3 Zweige oder 2 Margeriten + 2 Zweige. */
  function isRight(kinds) {
    if (kinds.length !== SIZE) return false;
    return (count(kinds, 't') === 1 && count(kinds, 'z') === 3) || (count(kinds, 'd') === 2 && count(kinds, 'z') === 2);
  }

  /* Zeichnungen: Stiel unten, Blüte oben (viewBox 40 x 96) */
  function plant(k, cls, w, crop) {
    var stem = '<path class="t-blumenstrauss23-stem" d="M20 ' + (k === 'z' ? 12 : 28) + 'C20 50 17 72 19 95"/>';
    var body = '';
    if (k === 'd') {
      for (var i = 0; i < 8; i++) {
        body += '<ellipse class="t-blumenstrauss23-petal" cx="20" cy="9" rx="4.6" ry="8.5" transform="rotate(' + (i * 45) + ' 20 21)"/>';
      }
      body += '<circle class="t-blumenstrauss23-core" cx="20" cy="21" r="5.5"/>';
    } else if (k === 't') {
      body = '<path class="t-blumenstrauss23-tulip" d="M7 6C7 24 11 34 20 36C29 34 33 24 33 6L26.5 15L20 3L13.5 15Z"/>' +
        '<path class="t-blumenstrauss23-tulipshade" d="M20 3L26.5 15L33 6C33 24 29 34 20 36Z"/>' +
        '<path class="t-blumenstrauss23-leaf" d="M19 78C8 74 5 62 7 54C15 58 19 66 19 78Z"/>';
    } else {
      var leaves = '';
      [24, 40, 56].forEach(function (y) {
        leaves += '<path class="t-blumenstrauss23-leaf" d="M20 ' + y + 'C13 ' + (y - 2) + ' 8 ' + (y - 8) + ' 6 ' + (y - 14) + 'C13 ' + (y - 13) + ' 19 ' + (y - 8) + ' 20 ' + y + 'Z"/>' +
          '<path class="t-blumenstrauss23-leaf" d="M20 ' + y + 'C27 ' + (y - 2) + ' 32 ' + (y - 8) + ' 34 ' + (y - 14) + 'C27 ' + (y - 13) + ' 21 ' + (y - 8) + ' 20 ' + y + 'Z"/>';
      });
      body = leaves + '<path class="t-blumenstrauss23-leaf" d="M20 3C14 8 14 16 20 24C26 16 26 8 20 3Z"/>';
    }
    return '<svg class="' + (cls || 't-blumenstrauss23-ico') + '" viewBox="0 0 40 ' + (crop || 96) + '"' + (w ? ' width="' + w + '" height="' + Math.round(w * (crop || 96) / 40) + '"' : '') +
      ' aria-hidden="true" focusable="false">' + stem + body + '</svg>';
  }
  function inline(k) {
    return '<span class="t-blumenstrauss23-inl" role="img" aria-label="' + NAMES[k] + '">' + plant(k, 't-blumenstrauss23-ico', 16, k === 'z' ? 46 : 50) + '</span>';
  }
  function iconEl(k) {
    var s = document.createElement('span');
    s.className = 't-blumenstrauss23-iw';
    s.innerHTML = plant(k);
    return s;
  }

  /* Programmablaufplan wie im Heft, mit Text statt Bildern */
  function flowchart() {
    function box(x, y, w, hh, lines) {
      var t = lines.map(function (l, i) {
        return '<text x="' + (x + w / 2) + '" y="' + (y + hh / 2 + 4 + (i - (lines.length - 1) / 2) * 14) + '" text-anchor="middle">' + l + '</text>';
      }).join('');
      return '<rect class="t-blumenstrauss23-fb" x="' + x + '" y="' + y + '" width="' + w + '" height="' + hh + '"/>' + t;
    }
    function dia(cx, cy, hw, hh, lines) {
      var t = lines.map(function (l, i) {
        return '<text x="' + cx + '" y="' + (cy + 4 + (i - (lines.length - 1) / 2) * 13) + '" text-anchor="middle">' + l + '</text>';
      }).join('');
      return '<path class="t-blumenstrauss23-fd" d="M' + cx + ' ' + (cy - hh) + 'L' + (cx + hw) + ' ' + cy + 'L' + cx + ' ' + (cy + hh) + 'L' + (cx - hw) + ' ' + cy + 'Z"/>' + t;
    }
    function pill(x, y, w, hh, label) {
      return '<rect class="t-blumenstrauss23-fp" x="' + x + '" y="' + y + '" width="' + w + '" height="' + hh + '" rx="' + (hh / 2) + '"/>' +
        '<text x="' + (x + w / 2) + '" y="' + (y + hh / 2 + 4) + '" text-anchor="middle">' + label + '</text>';
    }
    function lbl(x, y, s) { return '<text class="t-blumenstrauss23-fl" x="' + x + '" y="' + y + '">' + s + '</text>'; }
    return '<svg class="t-blumenstrauss23-flow" viewBox="0 0 380 412" role="img" aria-label="Programmablaufplan: Start, nimm eine Blume aus Eimer A. Ist es eine Margarite? Wenn ja, nimm noch eine Margarite aus Eimer A. Dann nimm einen Zweig aus Eimer B. Hat der Strauß 4 Teile? Wenn nein, wieder einen Zweig nehmen, wenn ja, Ende.">' +
      '<defs><marker id="t-blumenstrauss23-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path class="t-blumenstrauss23-ah" d="M1 1L9 5L1 9"/></marker></defs>' +
      '<g class="t-blumenstrauss23-lines" marker-end="url(#t-blumenstrauss23-arr)">' +
      '<path d="M150 34V52"/><path d="M150 86V106"/><path d="M212 136H300V176"/><path d="M150 166V253"/>' +
      '<path d="M300 220V258H156"/><path d="M150 263V282"/><path d="M150 316V336"/><path d="M222 366H280"/>' +
      '<path d="M78 366H20V258H144"/></g>' +
      pill(120, 8, 60, 26, 'Start') +
      box(50, 52, 200, 34, ['nimm eine Blume aus Eimer A']) +
      dia(150, 136, 62, 30, ['Margarite?']) +
      box(230, 176, 140, 44, ['nimm noch eine', 'Margarite aus Eimer A']) +
      '<circle class="t-blumenstrauss23-fb" cx="150" cy="258" r="5"/>' +
      box(50, 282, 200, 34, ['nimm einen Zweig aus Eimer B']) +
      dia(150, 366, 72, 30, ['Strauß hat', '4 Teile?']) +
      pill(280, 353, 70, 26, 'Ende') +
      lbl(236, 128, 'ja') + lbl(158, 194, 'nein') + lbl(238, 358, 'ja') + lbl(30, 358, 'nein') +
      '</svg>';
  }

  var el, api, locked, pick, mark, statusEl, bucketsEl, bouquetEl, focusSel;

  function kinds() { return pick.map(function (id) { return itemOf(id).k; }); }
  function setStatus(msg) {
    if (msg) { statusEl.textContent = msg; return; }
    var n = pick.length;
    statusEl.textContent = n === 0 ? 'Der Strauß ist noch leer. Tippe Blumen und Zweige an.' :
      'Dein Strauß hat ' + n + ' von ' + SIZE + ' Teilen' + (n === SIZE ? '.' : '.');
  }

  function itemBtn(it, inBouquet) {
    var b = h('button', {
      type: 'button', class: 't-blumenstrauss23-item' + (inBouquet ? ' in' : ''), 'data-id': it.id, disabled: locked,
      'aria-label': NAMES[it.k] + (inBouquet ? ' im Strauß, zurücklegen' : ' aus Eimer ' + it.bucket + ' in den Strauß legen')
    });
    b.appendChild(iconEl(it.k));
    return b;
  }

  function render() {
    var left = ITEMS.filter(function (i) { return pick.indexOf(i.id) < 0; });
    function bucket(name, cls) {
      var inB = left.filter(function (i) { return i.bucket === name; });
      return h('section', { class: 't-blumenstrauss23-bucket ' + cls, 'aria-label': 'Eimer ' + name },
        h('h3', null, h('span', { class: 't-blumenstrauss23-tag' }, name), 'Eimer ' + name),
        h('div', { class: 't-blumenstrauss23-items' },
          inB.length ? inB.map(function (i) { return itemBtn(i, false); }) : h('span', { class: 't-blumenstrauss23-empty' }, 'leer')));
    }
    var slots = [];
    for (var i = 0; i < SIZE; i++) {
      var id = pick[i];
      slots.push(h('div', { class: 't-blumenstrauss23-slot' + (id ? ' filled' : '') }, id ? itemBtn(itemOf(id), true) : h('span', { class: 't-blumenstrauss23-ph', 'aria-hidden': 'true' }, String(i + 1))));
    }
    var cls = 't-blumenstrauss23-wrap' + (mark === 'ok' ? ' ok' : mark === 'bad' ? ' bad' : '');
    el.replaceChildren(h('div', { class: 't-blumenstrauss23-board' },
      h('div', { class: 't-blumenstrauss23-buckets' }, bucket('A', 'a'), bucket('B', 'b')),
      h('section', { class: cls, 'aria-label': 'Blumenstrauß' },
        h('h3', null, 'Dein Blumenstrauß'),
        h('div', { class: 't-blumenstrauss23-slots' }, slots),
        h('div', { class: 't-blumenstrauss23-brand', 'aria-hidden': 'true' }, 'Florians Flowers'),
        mark ? h('span', { class: 't-blumenstrauss23-mark', 'aria-hidden': 'true' }, mark === 'ok' ? '✓' : '✗') : null),
      statusEl));
    setStatus();
    if (focusSel) {
      var f = el.querySelector(focusSel);
      if (f && !f.disabled) f.focus();
      focusSel = null;
    }
  }

  function onClick(e) {
    var b = e.target.closest('[data-id]');
    if (!b || locked) return;
    var id = b.getAttribute('data-id');
    var idx = pick.indexOf(id);
    mark = null;
    if (idx >= 0) {
      pick.splice(idx, 1);
      focusSel = pick.length ? '.t-blumenstrauss23-slot .t-blumenstrauss23-item' : '.t-blumenstrauss23-bucket .t-blumenstrauss23-item[data-id="' + id + '"]';
    } else {
      if (pick.length >= SIZE) { setStatus('Der Strauß hat schon 4 Teile. Lege erst ein Teil zurück.'); return; }
      pick.push(id);
      var it = itemOf(id);
      focusSel = '.t-blumenstrauss23-bucket.' + it.bucket.toLowerCase() + ' .t-blumenstrauss23-item';
      if (!el.querySelector(focusSel)) focusSel = '.t-blumenstrauss23-slot.filled .t-blumenstrauss23-item';
    }
    render();
    api.changed();
  }

  function reset() { pick = []; mark = null; }

  Biber.register({
    id: 'blumenstrauss23',
    story: '<p>Florian verkauft Blumensträuße. Jeden Blumenstrauß bindet Florian nach dieser Anleitung:</p>' +
      '<ol class="t-blumenstrauss23-steps"><li>Nimm die erste Blume aus Eimer A.</li>' +
      '<li>Wenn die erste Blume eine Margarite ' + inline('d') + ' ist, nimm noch eine Margarite ' + inline('d') + '.</li>' +
      '<li>Nun nimm so lange einen Zweig ' + inline('z') + ' aus Eimer B, bis der Blumenstrauß 4 Teile hat. Fertig!</li></ol>',
    question: 'Hilf Florian: Folge der Anleitung und wähle Blumen und Zweige für einen Strauß aus.',
    howto: 'Tippe Blumen und Zweige in den Eimern an, dann wandern sie in den Strauß. Tippe ein Teil im Strauß an, um es zurückzulegen.',
    explanation: function () {
      return '<div class="t-blumenstrauss23-expl">' +
        '<p>Die erste Blume entscheidet. Ist es eine <strong>Tulpe</strong>, wird nur noch mit Zweigen aufgefüllt: Tulpe und 3 Zweige. ' +
        'Ist es eine <strong>Margarite</strong>, kommt noch eine zweite Margarite dazu, danach 2 Zweige. Es gibt also zwei richtige Sträuße.</p>' +
        '<div class="t-blumenstrauss23-fig">' + flowchart() + '</div>' +
        '<p>Eine solche Anleitung, die eine Maschine ausführen könnte, heißt <strong>Algorithmus</strong>. ' +
        'Die Frage „Ist es eine Margarite?“ ist eine <em>bedingte Anweisung</em> (Verzweigung). Das Zweige-Nehmen „bis der Strauß 4 Teile hat“ wird wiederholt, ' +
        'das ist eine <em>Schleife</em>. Dieses Bild nennt man Programmablaufplan.</p></div>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      el.classList.add('t-blumenstrauss23');
      statusEl = h('p', { class: 't-blumenstrauss23-status', 'aria-live': 'polite' });
      el.addEventListener('click', onClick);
      render();
    },
    isComplete: function () { return pick.length === SIZE; },
    evaluate: function () { var k = kinds(); return { correct: isRight(k), answer: k }; },
    setAnswer: function (ans) {
      var used = {};
      pick = [];
      (Array.isArray(ans) ? ans : []).forEach(function (k) {
        var it = ITEMS.filter(function (i) { return i.k === k && !used[i.id]; })[0];
        if (it) { used[it.id] = true; pick.push(it.id); }
      });
      mark = isRight(kinds()) ? 'ok' : 'bad';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (isRight(kinds()) ? 'ok' : 'bad') : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      pick = ['a3', 'b1', 'b2', 'b3'];
      mark = 'ok';
      locked = true;
      render();
    }
  });
})();
