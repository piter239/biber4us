/* Aufgabenliste des Informatik-Biber 2025 (Heft, Seite 6):
   nach ungefähr steigender Schwierigkeit, mit Thema und Heftseite der Aufgabe. */
window.BIBER_TASKS = [
  { id: 'fingerfarben', title: 'Fingerfarben', topic: 'Systeme, Neuronale Netze, Diffusionsmodell', page: 37, level: 'einfach', ages: '3–4', ready: true },
  { title: 'Flugzeuge', topic: 'Algorithmen, Optimierung, Scheduling', page: 38 },
  { title: 'Hivobu', topic: 'Programmierung, Syntax, Postfix-Notation', page: 42 },
  { title: 'Bauklötze 1', topic: 'Programmierung, Grundbausteine, Sequenz', page: 9 },
  { title: 'Obstkörbe', topic: 'Algorithmen, Sortieren, Ordnung', page: 62 },
  { title: 'Nach Hause', topic: 'Algorithmus, Analyse, Bias', page: 60 },
  { title: 'Bauklötze 2', topic: 'Algorithmen, Eigenschaften, wohldefiniert', page: 11 },
  { title: 'Tag im Nebel', topic: 'Algorithmen, Computergrafik, Floodfill Algorithmus', page: 74 },
  { title: 'Zahlenmaschine', topic: 'Algorithmen, Sortieren, Sortiernetzwerk', page: 78 },
  { title: 'Blätter im Wind', topic: 'Algorithmen, Klassifikation, Entscheidungsbaum', page: 26 },
  { title: 'Verrückte Lampe', topic: 'Modellierung, Logik, Operatoren', page: 76 },
  { title: 'Lefty 1', topic: 'Systeme, Architektur, Befehlssatz', page: 50 },
  { title: 'Biberholz', topic: 'Modellierung, Datenbanken, Abfragen', page: 19 },
  { title: 'Holz für den Damm', topic: 'Algorithmen, Optimierung, Teilfolge', page: 44 },
  { title: 'Brennende Kerzen', topic: 'Algorithmen, Analyse, Verifikation', page: 31 },
  { title: 'Mehltransport', topic: 'Algorithmen, Optimierung, Scheduling', page: 56 },
  { title: 'Stammbaum', topic: 'Modellierung, Mathematik, Funktionen', page: 72 },
  { title: 'Blumentöpfe', topic: 'Algorithmen, Lösungssuche, Bottom-Up', page: 29 },
  { title: 'Bebrasien', topic: 'Modellierung, Graphen', page: 13 },
  { title: 'Entdecke Seoul!', topic: 'Algorithmen, Graphen-Algorithmen, Tiefensuche', page: 35 },
  { title: 'Helligkeitskarte', topic: 'Systeme, Neuronale Netze, Convolutional NN', page: 40 },
  { title: 'Lefty 2', topic: 'Systeme, Architektur, Befehlssatz', page: 52 },
  { title: 'Momos Spiel', topic: 'Programmierung, Grundbausteine, Wiederholung', page: 58 },
  { title: 'Bibimbap 비빔밥', topic: 'Algorithmen, Optimierung, Scheduling', page: 24 },
  { title: 'Lichterstern', topic: 'Modellierung, Logik, Operatoren', page: 54 },
  { title: 'Der Drachen ist weg!', topic: 'Algorithmen, Lösungssuche, Topologie', page: 33 },
  { title: 'Kurierdienst', topic: 'Kodierung, Verschlüsselung, visuelle Kryptografie', page: 48 },
  { title: 'Parkplätze', topic: 'Theoretische Informatik, Automaten, Kellerautomaten', page: 64 },
  { title: 'Schere, Stein, Papier', topic: 'Algorithmen, Analyse, Invarianten', page: 68 },
  { title: 'Bergseen', topic: 'Algorithmen, Graphen-Algorithmen, Flussalgorithmen', page: 15 },
  { title: 'Adress-Erkennung', topic: 'Theoretische Informatik, Automaten, Endliche Automaten', page: 7 },
  { title: 'Schwarz – Weiß', topic: 'Kodierung, Komprimierung', page: 70 },
  { title: 'Prüf-Biber', topic: 'Kodierung, Fehlerkorrektur, Hamming-Code', page: 66 },
  { title: 'Zum Theater!', topic: 'Algorithmen, Optimierung, Dynamische Programmierung', page: 80 },
  { title: 'Klausurenplan', topic: 'Modellierung, Graphen, Färbung', page: 46 },
  { title: 'Biberone', topic: 'Modellierung, Logik, XOR', page: 21 },
  { title: 'Biber Jones', topic: 'Algorithmen, Optimierung, Pareto-Optimum', page: 17 }
];

/* Punkteschema nach Bebras-Standard (im Heft nicht angegeben):
   richtig = Pluspunkte, falsch = Abzug, keine Antwort = 0. */
window.BIBER_SCORING = {
  einfach: { right: 6, wrong: -2 },
  mittel: { right: 9, wrong: -3 },
  schwer: { right: 12, wrong: -4 }
};
