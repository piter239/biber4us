Biber 2025 interaktiv
=====================

Interaktive Version aller 37 Aufgaben des Informatik-Biber 2025 und von 40 ausgewaehlten Aufgaben der Hefte 2020-2024 (BWINF - GI e.V.,
CC BY-SA 4.0). Ansicht "Alle Aufgaben" (Reihenfolge der Aufgabenliste auf Heft-Seite 6,
ungefaehr steigende Schwierigkeit) oder "Nach Klasse" (3-4, 5-6, 7-8, 9-10, 11-13).

Starten:  python3 -m http.server 8000   und   http://localhost:8000 oeffnen.

Dateien:  index.html, style.css, app.js (Geruest, Bewertung), tasks.js (Aufgabenliste),
          biber.js + tasks/<id>.js/.css (ein Modul je Aufgabe, siehe tasks/README.md), assets/.
Kaetzchen: kitten.js ist eigenstaendig und laesst sich in jede Seite einbinden:
          <script src="kitten.js" defer></script>
          Optionen und Schnittstelle: Kopfkommentar in kitten.js.


Speicherung
-----------
sync.js gleicht Profile und Ergebnisse ueber die db-Funktion der Artifact-Umgebung mit dem Server ab
(Dokument progress/<Konto-Id>; Regeln: progress lesen = admin, progress/{self} lesen/schreiben = interact).
Ohne diese Umgebung bleibt alles im Browser (localStorage). Die Seite #familie zeigt Besitzern/Editoren alle Profile.

Veroeffentlichung mit Dateianzahl-Limit
---------------------------------------
python3 tools/bundle.py <Zielordner> fasst alle tasks/*.js und tasks/*.css zu tasks.bundle.js / tasks.bundle.css
zusammen und schreibt einen index.html, der nur diese beiden Dateien laedt. Fuer den gehosteten Artifact wird diese
gebuendelte Fassung verwendet (Limit: 511 Dateien je Version). Quellen in tasks/ bleiben unveraendert.

Aktivitaetsprotokoll
--------------------
track.js protokolliert Handlungen kompakt (eine Zeile je Ereignis, Zeit als Abstand in ms zum vorigen Ereignis) und schickt sie
abschnittsweise (300 Zeilen) als Dokumente logs/<Konto-Id>/c/<Sitzung>_<Nr> an die db der Artifact-Umgebung (Regeln: logs lesen = admin,
logs/{self} lesen/schreiben = interact). Die Eltern (Owner/Editoren) lesen alles. Auswertung: tools/decode_log.py.
Gespeichert werden Klicks (mit Position in Promille), Seitenwechsel, Aufgabenstart/-ende/-antworten, Probelauf, Katzen-Ereignisse,
Leerlauf und Sichtbarkeit. Keine Mausbewegungen, keine getippten Texte. Codes siehe Kopf von track.js.

protokoll.js zeigt das Protokoll auf der Seite "Familie" (nur Besitzer/Editoren): je Sitzung eine Zeile mit Zusammenfassung, aufklappbar der Ablauf.
Zoomies: k.za = Auftritt, k.zc = jeder Tipp (Auftritt, ms seit Erscheinen, hit|again|late|intro), k.zhit = Treffer, k.zend = Ende.

helfer.js: "Die Katze hilft". Nach 3 Minuten an einer Aufgabe (und nur, wenn jemand am Rechner ist) oder per Knopf "Katze um Hilfe bitten"
erscheint eine Tafel: Das Kind erklaert der Katze die Aufgabe (sprechen oder tippen), die Katze stellt Denkfragen und gibt kleine
Tipps, nie die Loesung. Antworten kommen von Claude ueber die Funktion "sample" (Zustimmung und Verbrauch beim Konto des Kindes),
sonst feste Fragen. Sprechen/Vorlesen nutzt die Web-Speech-Funktionen des Browsers, falls vorhanden. Protokoll: h.* (ohne Texte).

Probelauf: Aufbau wie im Wettbewerb je Klassenstufe (3-4: 9 Aufgaben / 30 Min, 5-6: 12 / 35, 7-13: 15 / 40; gleich viele einfach, mittel, schwer; Quelle: Hefte 2020-2024, Teil "Wettbewerb"). Aufgaben "passend zum Niveau" oder "laut Heft fuer die Klasse"; Zeit wahlweise +5 oder +10 Min.

Kaetzchen: Fressen dauert ca. 9 s mit zufaelligen Geraeuschen (knuspern, lecken, schmatzen, schlucken, nom, mrrp, schluerfen, brummen); acht neue Vorstellungen (Fisch, Singen, Geistesblitz, Foto, Kuchen, Lesen, Ballon, Schnee) und sechs neue Doppel-Sticker.

Grenzen: Album-Vorstellungen höchstens 5 in 90 s und nur mit Guthaben; Zoomies höchstens 5 in 5 Minuten (auch aus dem Album); Streicheln unbegrenzt.

Ruhige Szenen (kitten.js, ACTIONS mit quiet:true): Vogel, Falter, Herbstlaub, Marienkaefer, Gluehwuermchen, Heissluftballon, Schmetterling auf der Nase, Eichhoernchen. Kein Ton, kein Text, kein Sprung, immer am unteren Rand ohne Luna; nach einer richtigen Antwort (Lob wird ersetzt, ausser bei Serien 5/10/20, Geschenk und Luna-Ankuendigung) zu 50 % nach 2 s, sonst wie die anderen Besuche.

Kaetzchen und Luna: Luna kommt jeden Tag neu (mem.lunaDay). Am neuen Tag gruesst das Kaetzchen von ihr; nach 1 / 3 / 5 richtigen Aufgaben
(erster Versuch) des Tages gibt es zwei Ankuendigungen und dann ihren Besuch mit einem neuen Doppel-Sticker (d:*, 12 Stueck der Reihe nach).
Erfolgs-Sticker (m:*): 10/25/50/100 richtig, 3 in Folge, schwere Aufgabe, unter 20 s, zweiter Versuch, um Hilfe gebeten, Probelauf, 3/7 Tage.

Familien, Privatsphaere, Klassen: siehe ARCHITEKTUR.md (Gast-Familien liegen unter data/users/<Konto>/ und sind auch fuer den Besitzer unlesbar; sync.js, klasse.js).
