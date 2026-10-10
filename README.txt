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
