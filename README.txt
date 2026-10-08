Biber 2025 interaktiv
=====================

Interaktive Version aller 37 Aufgaben des Informatik-Biber 2025 (BWINF - GI e.V.,
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
