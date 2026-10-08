/* Aufgabe Turniersieger (Biber 2020; Klasse 11-13 mittel): Spieler ohne Niederlage = mögliche Turniersieger (topologische Sortierung) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-turniersieger20-';

  /* Spieler und ihre Position im Bild (Mitte des Kastens in einem Bild von 330 x 190) */
  var COLX = [50, 165, 280], ROWY = [20, 95, 170], BW = 92, BH = 32;
  var PLAYERS = [
    { id: 'Alice', c: 0, r: 0 }, { id: 'Bob', c: 1, r: 0 }, { id: 'Chris', c: 2, r: 0 },
    { id: 'David', c: 0, r: 1 }, { id: 'Emma', c: 1, r: 1 }, { id: 'Fred', c: 2, r: 1 },
    { id: 'Gerald', c: 0, r: 2 }, { id: 'Henry', c: 1, r: 2 }, { id: 'Ivo', c: 2, r: 2 }
  ];
  /* Pfeile [Sieger, Verlierer, x1, y1, x2, y2] wie im Heftbild */
  var WINS = [
    ['Bob', 'Alice', 119, 20, 99, 20],
    ['Alice', 'David', 50, 37, 50, 78],
    ['Alice', 'Fred', 96, 31, 231, 83],
    ['Emma', 'Bob', 165, 79, 165, 37],
    ['Gerald', 'David', 50, 153, 50, 112],
    ['Gerald', 'Bob', 84, 153, 131, 38],
    ['Chris', 'Fred', 280, 37, 280, 78],
    ['Chris', 'Henry', 259, 37, 208, 152],
    ['Ivo', 'Henry', 233, 170, 214, 170]
  ];

  /* Richtige Antwort: wer noch von niemandem "besser als" ist, also in der transitiven Hülle keinen Vorgänger hat
     (= bisher kein Spiel verloren). Im Heft: Chris, Emma, Gerald, Ivo. */
  function better(a, b) {   /* ist a (direkt oder indirekt) besser als b? */
    var seen = {}, stack = [a];
    while (stack.length) {
      var x = stack.pop();
      WINS.forEach(function (w) {
        if (w[0] === x && !seen[w[1]]) { seen[w[1]] = true; stack.push(w[1]); }
      });
    }
    return !!seen[b];
  }
  var RIGHT = PLAYERS.map(function (p) { return p.id; }).filter(function (id) {
    return !PLAYERS.some(function (q) { return q.id !== id && better(q.id, id); });
  });
  var OFFICIAL = ['Chris', 'Emma', 'Gerald', 'Ivo'];
  if (RIGHT.join() !== OFFICIAL.join()) RIGHT = OFFICIAL;   /* Sicherheitsnetz: es gilt die Heftlösung */

  var el, api, btns, sel, locked, mark;   /* sel: Menge als Objekt id -> true; mark: null | 'check' | 'solution' */

  function reset() { sel = {}; mark = null; }
  function chosen() { return PLAYERS.map(function (p) { return p.id; }).filter(function (id) { return sel[id]; }); }
  function isRight() { var c = chosen(); return c.length === RIGHT.length && c.every(function (id, i) { return id === RIGHT[i]; }); }

  function arrowsSvg() {
    var s = '<svg class="' + P + 'arrows" viewBox="0 0 330 190" aria-hidden="true" focusable="false">' +
      '<defs><marker id="' + P + 'head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">' +
      '<path d="M0 0 L10 5 L0 10 z" fill="#5f8fff"/></marker></defs>';
    WINS.forEach(function (w) {
      s += '<line x1="' + w[2] + '" y1="' + w[3] + '" x2="' + w[4] + '" y2="' + w[5] + '" stroke="#5f8fff" stroke-width="2.4" marker-end="url(#' + P + 'head)"/>';
    });
    return s + '</svg>';
  }

  function lostTo(id) {
    return WINS.filter(function (w) { return w[1] === id; }).map(function (w) { return w[0]; });
  }
  function beaten(id) {
    return WINS.filter(function (w) { return w[0] === id; }).map(function (w) { return w[1]; });
  }
  function describe(id) {
    var b = beaten(id), l = lostTo(id), t = [];
    if (b.length) t.push('hat gegen ' + b.join(' und ') + ' gewonnen');
    if (l.length) t.push('hat gegen ' + l.join(' und ') + ' verloren');
    return t.length ? t.join(', ') : 'noch kein Spiel';
  }

  function refresh() {
    var right = RIGHT.slice();
    btns.forEach(function (b, i) {
      var id = PLAYERS[i].id, on = !!sel[id], isR = right.indexOf(id) >= 0;
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', id + ' (' + describe(id) + ')' + (mark === 'check' ? (on ? (isR ? ', richtig gewählt' : ', falsch gewählt') : (isR ? ', hättest du wählen müssen' : '')) : ''));
      b.disabled = locked;
      b.classList.toggle(P + 'on', on);
      b.classList.toggle(P + 'ok', on && mark !== null && isR);
      b.classList.toggle(P + 'bad', on && mark === 'check' && !isR);
      b.classList.toggle(P + 'miss', !on && mark === 'check' && isR);
    });
    var n = chosen().length;
    var note = el.querySelector('.' + P + 'note');
    if (mark === 'solution') note.textContent = 'Diese vier Spieler haben noch kein Spiel verloren. Alle anderen haben schon einen besseren Spieler über sich.';
    else if (mark === 'check') note.textContent = isRight() ? 'Genau diese vier Spieler können noch Turniersieger werden.' : 'Gelb mit gestricheltem Rand: Diesen Spieler hättest du auswählen müssen.';
    else note.textContent = n ? 'Ausgewählt: ' + chosen().join(', ') + '.' : 'Noch niemand ausgewählt.';
  }

  function toggle(id) {
    if (locked) return;
    if (sel[id]) delete sel[id]; else sel[id] = true;
    refresh();
    api.changed();
  }

  Biber.register({
    id: 'turniersieger20',
    story:
      '<p>In einem Freiluft-Sportturnier wurden schon einige Partien gespielt. Im Bild zeigen die Pfeile, wer dabei gegen wen gewonnen hat: Der Pfeil zeigt vom Sieger zum Verlierer. Zum Beispiel hat Bob gegen Alice gewonnen und Alice gegen David.</p>' +
      '<p>Leider wird das Wetter schlecht. Um die Anzahl der noch nötigen Partien zu verringern, wird eine neue Regel aufgestellt: Es soll derjenige Turniersieger werden, der <strong>besser ist als alle anderen</strong>.</p>' +
      '<p>Wenn A gegen B gewonnen hat, dann gilt:</p>' +
      '<ul><li>A ist besser als B.</li><li>Wenn B besser ist als einige andere Spieler, ist auch A besser als diese Spieler.</li></ul>' +
      '<p>Jetzt sollen nur noch die Spieler weitermachen, die nach der neuen Regel noch Turniersieger werden können.</p>',
    question: 'Welche Spieler können noch Turniersieger werden?',
    howto: 'Tippe alle Namen an, die noch Turniersieger werden können. Nochmal antippen nimmt die Auswahl zurück.',
    explanation: function () {
      return '<p>Wer schon einmal verloren hat, für den gibt es mindestens einen besseren Spieler, und der ist dann auch besser als alle, die gegen den Verlierer verloren haben. ' +
        'Ein solcher Spieler kann also nie „besser als alle anderen“ sein. Noch Turniersieger werden können deshalb nur Spieler, die <strong>bisher kein Spiel verloren</strong> haben: auf ihren Namen zeigt kein Pfeil.</p>' +
        '<p>Das sind <strong>Chris, Emma, Gerald und Ivo</strong>. Von ihnen kann jeder noch besser als alle anderen werden, weil zwischen ihnen noch nicht gespielt wurde.</p>' +
        '<p>Aus einzelnen Vergleichen („besser als“) eine Reihenfolge zu bestimmen, nennt man in der Informatik <em>topologisches Sortieren</em>. Wenn nicht alle Paare verglichen wurden, sind mehrere Reihenfolgen möglich, so wie hier mehrere Spieler ganz vorn stehen können. ' +
        'Die Regel „A besser als B und B besser als C, dann A besser als C“ heißt <em>Transitivität</em>: Sie liefert aus direkten Vergleichen weitere indirekte.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      btns = PLAYERS.map(function (p) {
        return h('button', {
          type: 'button', class: P + 'pl', 'aria-pressed': 'false',
          style: 'left:' + ((COLX[p.c] - BW / 2) / 330 * 100).toFixed(3) + '%;top:' + ((ROWY[p.r] - BH / 2) / 190 * 100).toFixed(3) + '%;width:' + (BW / 330 * 100).toFixed(3) + '%;height:' + (BH / 190 * 100).toFixed(3) + '%',
          onclick: function () { toggle(p.id); }
        }, p.id);
      });
      var arrows = h('div', { class: P + 'arrowbox' });
      arrows.innerHTML = arrowsSvg();
      el.replaceChildren(h('div', { class: P + 'board' },
        h('div', { class: P + 'graph', role: 'group', 'aria-label': 'Turnierergebnisse: Pfeile zeigen vom Sieger zum Verlierer' }, arrows, btns),
        h('p', { class: P + 'note', role: 'status', 'aria-live': 'polite' })));
      refresh();
    },
    isComplete: function () { return chosen().length > 0; },
    evaluate: function () { return { correct: isRight(), answer: { players: chosen() } }; },
    setAnswer: function (ans) {
      sel = {};
      ((ans && ans.players) || []).forEach(function (id) { sel[id] = true; });
      mark = 'check';
      refresh();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      refresh();
    },
    reset: function () { reset(); refresh(); },
    showSolution: function () {
      sel = {};
      RIGHT.forEach(function (id) { sel[id] = true; });
      mark = 'solution'; locked = true;
      refresh();
    }
  });
})();
