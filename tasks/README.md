# Aufgabenmodule

Jede Aufgabe ist ein Modul `tasks/<id>.js` (+ optional `tasks/<id>.css`, Bilder in `assets/<id>/`).
Das Gerüst (`app.js`) zeichnet Kopf, Text, Prüfen-Leiste, Rückmeldung und Bewertung;
das Modul liefert nur Texte und das Spielfeld.

```js
(function () {
  var h = Biber.h;                  // DOM-Helfer: h('div', {class:'x', onclick: fn}, 'Text', child, [children])
  Biber.register({
    id: 'beispiel',                 // = id in tasks.js
    story: '<p>Aufgabentext als HTML</p>',
    question: 'Fettgedruckte Frage',
    howto: 'Kurzer Bedienhinweis (optional)',
    explanation: '<p>HTML oder function () { return html; } - wird nach dem Prüfen gezeigt</p>',
    mount: function (el, api) {},   // Spielfeld in el aufbauen; api.changed([statusText]) bei jeder Nutzeraktion;
                                    // api.locked() -> bool; api.group ('3-4'|'5-6'); api.level
    isComplete: function () {},     // true, wenn "Antwort prüfen" erlaubt ist
    evaluate: function () { return { correct: true, answer: {/* JSON-serialisierbar */} }; },
    setAnswer: function (answer) {},// Zustand aus gespeicherter Antwort wiederherstellen (nur Anzeige)
    lock: function (on) {},         // true: nach dem Prüfen/Lösung zeigen -> Eingaben sperren; false: wieder freigeben
    reset: function () {},          // Ausgangszustand
    showSolution: function () {}    // richtige Lösung im Spielfeld zeigen
  });
})();
```

Regeln: nur `var(--…)`-Farben aus `style.css` (Hell/Dunkel), CSS mit Präfix `.t-<id>` bzw. eigenem Kürzel,
Touch + Maus + Tastatur, funktioniert ab 360 px Breite ohne horizontales Seitenscrollen, deutsche Texte.
