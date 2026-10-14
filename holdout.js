/* Zurückgehaltene Testaufgaben ("held-out validation set"): Aufgaben der Hefte 2018 und 2019, die im Niveau-Training nie vorkommen.
   Sie stehen nicht in der Aufgabenliste (window.BIBER_TASKS), werden nie vorgeschlagen und fließen nicht ins Biber-Niveau ein.
   Der Probelauf zieht sie bevorzugt (wenn die Aufgabe für die gewählte Klassenstufe im Heft eingestuft ist) und vergleicht, wie viele richtige Antworten
   das Niveau-Modell erwartet hat mit dem, was das Profil wirklich geschafft hat. Ergebnisse stehen im Profil unter hold.
   Die Aufgabe heißt "gesehen", sobald ein Probelauf mit ihr abgegeben wurde (danach sind Lösung und Erklärung bekannt).
   d: relative Position (0..1) in der Aufgabenliste des Heftes, wie bei BIBER_TASKS. */
window.BIBER_HOLDOUT = [
  { id: 'bibertaler19', title: 'Bibertaler', topic: 'Kodierung, Binärzahlen', page: 12, year: 2019, d: 0.0588, groups: {'3-4': 'einfach', '5-6': 'einfach'}, holdout: true },
  { id: 'schneemannhuete19', title: 'Schneemann-Hüte', topic: 'Digitales Denken, Abstraktion, Informationsverlust', page: 44, year: 2019, d: 0.0882, groups: {'3-4': 'schwer', '5-6': 'einfach'}, holdout: true },
  { id: 'superstar19', title: 'Superstar', topic: 'Modellierung, Graphen, Soziale Netzwerke', page: 51, year: 2019, d: 0.2059, groups: {'5-6': 'schwer', '7-8': 'einfach'}, holdout: true },
  { id: 'aufraeumen19', title: 'Aufräumen', topic: 'Robotik, Steuerung, Sensorik', page: 10, year: 2019, d: 0.2353, groups: {'3-4': 'mittel', '5-6': 'einfach'}, holdout: true },
  { id: 'tellerordnung19', title: 'Teller-Ordnung', topic: 'Algorithmik, Sortieren, Einfügen, Effizienz', page: 52, year: 2019, d: 0.2647, groups: {'5-6': 'mittel', '7-8': 'einfach'}, holdout: true },
  { id: 'stempel19', title: 'Stempel', topic: 'Programmieren, Software Engineering, Reverse Engineering', page: 48, year: 2019, d: 0.2941, groups: {'3-4': 'mittel', '5-6': 'einfach'}, holdout: true },
  { id: 'obstspiesse19', title: 'Obstspieße', topic: 'Algorithmik, Heiratsproblem, Matching', page: 32, year: 2019, d: 0.3235, groups: {'5-6': 'schwer', '7-8': 'schwer', '9-10': 'einfach'}, holdout: true },
  { id: 'raumfahrt19', title: 'Raumfahrt', topic: 'Modellierung, Automaten, DEA', page: 37, year: 2019, d: 0.3824, groups: {'5-6': 'mittel', '7-8': 'einfach'}, holdout: true },
  { id: 'leckeresholz19', title: 'Leckeres Holz', topic: 'Algorithmik, Set Cover, NP-vollständig', page: 26, year: 2019, d: 0.4118, groups: {'5-6': 'schwer', '7-8': 'mittel'}, holdout: true },
  { id: 'rangoli19', title: 'Rangoli', topic: 'Digitales Denken, Dekomposition', page: 34, year: 2019, d: 0.4412, groups: {'5-6': 'mittel'}, holdout: true },
  { id: 'zeichenroboter19', title: 'Zeichenroboter', topic: 'Programmieren, Grundbausteine, Turing-vollständig', page: 63, year: 2019, d: 0.5, groups: {'3-4': 'schwer', '5-6': 'mittel', '7-8': 'einfach'}, holdout: true },
  { id: 'schiebeparkplatz19', title: 'Schiebeparkplatz', topic: 'Robotik, autonomes Fahren', page: 43, year: 2019, d: 0.5882, groups: {'5-6': 'schwer', '7-8': 'mittel', '9-10': 'einfach'}, holdout: true },
  { id: 'passendegerichte18', title: 'Passende Gerichte', topic: 'Repräsentation, Mustervergleich, Abstandsmaß', page: 47, year: 2018, d: 0.0541, groups: {'3-4': 'mittel', '5-6': 'einfach'}, holdout: true },
  { id: 'liniennetz18', title: 'Liniennetz', topic: 'Repräsentation, Abstraktion, Reduktion', page: 45, year: 2018, d: 0.1081, groups: {'3-4': 'schwer', '5-6': 'mittel', '7-8': 'einfach'}, holdout: true },
  { id: 'baeumeband18', title: 'Bäume-Band', topic: 'Algorithmik, geometrische Algorithmen, konvexe Hülle', page: 14, year: 2018, d: 0.1351, groups: {'5-6': 'einfach'}, holdout: true },
  { id: 'brueckentrolle18', title: 'Brückentrolle', topic: 'Programmieren, EVA-Prinzip, funktionale Modellierung', page: 18, year: 2018, d: 0.1892, groups: {'5-6': 'schwer', '7-8': 'mittel', '9-10': 'einfach'}, holdout: true },
  { id: 'clarasblumen18', title: 'Claras Blumen', topic: 'Datenstrukturen, Datenbanken, Logik', page: 22, year: 2018, d: 0.2162, groups: {'3-4': 'schwer', '5-6': 'mittel'}, holdout: true },
  { id: 'aufzuege18', title: 'Aufzüge', topic: 'Algorithmik, Rucksackproblem, Greedy', page: 12, year: 2018, d: 0.2432, groups: {'5-6': 'schwer', '7-8': 'mittel'}, holdout: true },
  { id: 'diefensterscheibe18', title: 'Die Fensterscheibe', topic: 'Kodierung, Logik, Schaltungen', page: 26, year: 2018, d: 0.2973, groups: {'5-6': 'schwer', '7-8': 'mittel'}, holdout: true },
  { id: 'passtderschluessel18', title: 'Passt der Schlüssel?', topic: 'Repräsentation, Mustervergleich, Suchfunktion', page: 48, year: 2018, d: 0.4054, groups: {'3-4': 'schwer', '5-6': 'einfach'}, holdout: true },
  { id: 'kleinerteich18', title: 'Kleiner Teich', topic: 'Algorithmik, Zusammenhang, Suche', page: 43, year: 2018, d: 0.5405, groups: {'5-6': 'schwer', '7-8': 'mittel', '9-10': 'einfach'}, holdout: true },
  { id: 'planetz18', title: 'Planet Z', topic: 'Formale Sprachen, kontextfreie Grammatik, Compiler', page: 51, year: 2018, d: 0.6757, groups: {'5-6': 'mittel', '7-8': 'einfach'}, holdout: true },
  { id: 'eishoernchen18', title: 'Eishörnchen', topic: 'Programmieren, Wiederholung, Wortproblem', page: 27, year: 2018, d: 0.7297, groups: {'5-6': 'mittel', '7-8': 'einfach'}, holdout: true },
  { id: 'wievielefarben18', title: 'Wie viele Farben?', topic: 'Algorithmik, schwierige Probleme, Färbeproblem', page: 61, year: 2018, d: 0.8649, groups: {'3-4': 'mittel', '5-6': 'schwer'}, holdout: true }
];
