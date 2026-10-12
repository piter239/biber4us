# Architektur: Familien, Privatsphäre, Klassen

Diese Seite läuft als „Artifact“ (eine von Claude gehostete Seite). Sie kann mit anderen Eltern geteilt werden, ohne dass sich
Familien gegenseitig oder dem Besitzer offenbaren. Dieses Dokument beschreibt, wie das aufgebaut ist, was es sicher garantiert
und wo die Grenzen liegen. Wer die Seite anpassen will, kopiert das Repository und veröffentlicht es als eigenes Artifact; er ist
dann selbst Besitzer.

## Ziele
1. Eine Familie = **ein Konto** (Login) mit beliebig vielen Profilen (Eltern, Kinder). Alle Profile eines Kontos sieht man auf der
   Seite „Familie“.
2. **Gast-Familien** (alle, mit denen der Besitzer die Seite teilt) sehen nur ihre eigenen Daten, und der Besitzer sieht sie auch nicht.
3. Die **eigene Familie des Besitzers** kann mehrere Konten haben (z. B. das Schultablet eines Kindes) und wird von ihm gelesen.
4. **Klassen**: Profile können freiwillig in einem Ranking mit anderen gezeigt werden. Standard ist aus.
5. Der Besitzer muss die anderen Eltern weder kennen noch ihre E-Mail-Adresse eintragen müssen; geteilt wird über den Teilen-Dialog
   von Claude (Link oder E-Mail) und einen Klassencode.

## Was die Plattform kann (und was nicht)
- Jeder angemeldete Betrachter hat eine feste Konto-Kennung (`user.id()`). Zugriffsregeln der Datenbank gibt es nur **pro Pfad**
  mit den Stufen `view < interact < admin < owner` und dem Platzhalter `{self}` (eigene Kennung). Beziehungen wie „gehört zur
  Familie X“ lassen sich nicht als Regel ausdrücken.
- `data/users/<Kennung>/…` ist **privat für dieses Konto, auch gegenüber dem Besitzer**.
- Listet man eine Sammlung (`classes`), erscheinen nur Dokumente, die dort direkt liegen. Unterpfade unter nicht angelegten
  Dokumenten (`classes/<Hash>/e/…`) tauchen nicht auf; man erreicht sie nur, wenn man den Pfad kennt. Das nutzen die Klassen.

## Datenaufbau
| Pfad | Inhalt | Wer liest | Wer schreibt |
|---|---|---|---|
| `data/users/<Konto>/progress` | alle Profile des Kontos (Ergebnisse, Niveau, Kätzchen, Klassenzugehörigkeit) – **Gast-Familie** | nur das Konto | das Konto |
| `data/users/<Konto>/log_<Sitzung>_<Nr>` | Aktivitätsprotokoll, nur wenn das Konto es einschaltet | nur das Konto | das Konto |
| `progress/<Konto>` | wie oben, aber für Konten der **eigenen Familie** des Besitzers | Konto, Besitzer, Editoren | das Konto |
| `logs/<Konto>/c/<Sitzung>_<Nr>` | Aktivitätsprotokoll der eigenen Familie | Konto, Besitzer, Editoren | das Konto |
| `famcfg/main` | Familiencode des Besitzers | Besitzer, Editoren | Besitzer, Editoren |
| `family/<Konto>` | „dieses Konto gehört zur Familie“, enthält den Familiencode | Konto, Besitzer, Editoren | das Konto |
| `classes/<Hash(Code)>/e/<Konto>_<Profil>` | Klassen-Eintrag: Spitzname, Zahl bearbeitet/richtig, Niveau-Name | wer den Code kennt | wer den Code kennt |
| `classes/<Hash(Code)>/e/meta` | Name der Klasse | wer den Code kennt | wer den Code kennt |

Regeln (`capabilities.db.rules`): `progress` read admin write owner; `progress/{self}` read+write interact; `logs` read admin write
owner; `logs/{self}` read+write interact; `family` read admin write owner; `family/{self}` read+write interact; `famcfg` read admin
write owner; `classes` read+write interact. Dazu `user` mit Bereich `profile` und `sample` für die Antworten der Katze.

## Abläufe
- **Erster Besuch:** `sync.js` fragt, ob das Konto Besitzer/Editor ist oder `family/<Konto>` existiert. Dann gilt der Modus `family`
  (Daten unter `progress/`, `logs/`), sonst `private` (Daten unter `data/users/<Konto>/`). Früher im offenen Bereich gespeicherte
  Daten eines Gast-Kontos werden beim ersten Start in den privaten Bereich verschoben.
- **Konto zur eigenen Familie hinzufügen:** Der Besitzer öffnet „Familie“ und sieht den Familiencode. Auf dem anderen Konto
  (z. B. Tablet des Kindes) steht unter „Familie“ → „Zur Familie des Besitzers gehören“ ein Feld für den Code. Der Beitritt schreibt
  `family/<Konto>` und verschiebt den Stand nach `progress/<Konto>`. „Familie verlassen“ macht es rückgängig.
- **Aktivitätsprotokoll:** nur im Modus `family` immer an (Hinweis im Seitenfuß und auf der Hilfe-Tafel); bei Gast-Familien aus, bis das Konto
  es auf der Seite „Familie“ einschaltet (pro Gerät), dann nur für das Konto lesbar, mit „Ansehen“ und „Löschen“. Ohne Server nie.
  Sagt oder schreibt ein Kind etwas auf der Hilfe-Tafel, steht der Wortlaut nur im Modus `family` im Protokoll.
- **Klasse:** Eine Familie legt auf der Seite „Klasse“ eine Klasse an und bekommt einen Code (`XXXX-XXXX-XXXX`), den sie anderen Eltern
  gibt. Wer beitritt, wählt je Profil Spitzname und ob das Profil gezeigt wird (Standard: nein). Nur dann liegt ein Eintrag unter
  `classes/<SHA-256(Code)>/…`. Ausschalten oder Verlassen löscht ihn sofort.

## Was das garantiert – und was nicht
- Gast-Familien sind **gegenseitig und gegenüber dem Besitzer unsichtbar**: die Plattform verhindert den Zugriff auf `data/users/…`.
- Die Klassenliste ist nur mit dem Code auffindbar. Alle, die den Code kennen, können die Einträge lesen **und technisch auch
  überschreiben oder löschen** (die Plattform kann keine Pfade pro Eintrag sperren). Es steht nur Spitzname und Zahlen darin.
  Wer das nicht möchte, teilt den Code nur mit Eltern, denen er vertraut, und legt für jede Gruppe eine eigene Klasse an.
- **Teile die Seite nicht als „Editor“.** Editoren haben Stufe `admin` und können `progress/`, `logs/` und `family/` der eigenen
  Familie lesen. Andere Eltern brauchen nur das Recht, die Seite zu benutzen („interact“).
- Der Besitzer sieht Kommentare, die Betrachter am Artifact hinterlassen, und den Quelltext. Er sieht keine Daten unter `data/users/`.
- Die Antworten der Katze („sample“) schicken die Worte des Kindes an Claude und verbrauchen das Kontingent des **Betrachters**.
  Jeder Betrachter wird dafür um Zustimmung gefragt.
- Ein Konto mit mehreren Kindern: Alle Kinder teilen den Login. Wer für jedes Kind ein eigenes Konto möchte und die Ergebnisse
  zusammen sehen will, braucht ein eigenes Artifact als Besitzer (Kopie dieser Seite) und den Familiencode.

## Anpassen für die eigene Familie / Schule
1. Repository kopieren, `python3 tools/bundle.py <Ordner>` ausführen, mit dem Artifact-Werkzeug veröffentlichen (Dateien siehe `README.txt`).
2. Die Rechte der Datenbank wie oben setzen (`capabilities`).
3. Aufgaben stehen unter CC BY-SA 4.0 (BWINF – GI e. V.); die Quellenangabe im Seitenfuß bleibt.
