"""Wandelt die Aktivitätsprotokolle (Dokumente logs/<Konto>/c/<Sitzung>_<Nr>) in eine Tabelle um.
Aufruf:  python3 tools/decode_log.py <Ordner mit JSON-Dateien oder eine JSON-Datei> [> ausgabe.tsv]
Die JSON-Dateien kommen z. B. aus  ArtifactData list/get ... out_dir=<Ordner>  (je Dokument eine Datei; das Feld "data"
oder das Dokument selbst muss die Felder p, w, d, h, s, n, b, t enthalten).
Ausgabe (tab-getrennt): Zeit (ISO, lokal UTC), Person (w), Gerät (d), Sitzung (s), Abschnitt, Code, Felder ...
Mit --summary gibt es stattdessen eine kurze Zusammenfassung je Sitzung (Dauer, Aufgaben, Katzen-Ereignisse)."""
import json, os, sys, datetime, collections, urllib.parse


def docs(path):
    files = [path] if os.path.isfile(path) else [os.path.join(r, f) for r, _, fs in os.walk(path) for f in fs if f.endswith('.json')]
    for f in sorted(files):
        try:
            d = json.load(open(f, encoding='utf-8'))
        except Exception:
            continue
        d = d.get('data', d) if isinstance(d, dict) else d
        if isinstance(d, dict) and 't' in d and 'b' in d:
            yield d


def events(d):
    t = d['b']
    for line in d['t'].split('\n'):
        parts = line.split(' ')
        if len(parts) < 2:
            continue
        try:
            t += int(parts[0])
        except ValueError:
            continue
        yield t, parts[1], [urllib.parse.unquote(x) for x in parts[2:]]


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    summary = '--summary' in sys.argv
    if not args:
        print(__doc__); return
    rows = []
    for d in docs(args[0]):
        for t, code, f in events(d):
            rows.append((t, d.get('w', ''), d.get('d', ''), d.get('s', ''), d.get('n', 0), code, f))
    rows.sort(key=lambda r: (r[3], r[0]))
    if not summary:
        for t, w, dev, s, n, code, f in rows:
            iso = datetime.datetime.utcfromtimestamp(t / 1000).strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]
            print('\t'.join([iso, w, dev, s, str(n), code] + f))
        return
    by = collections.defaultdict(list)
    for r in rows:
        by[r[3]].append(r)
    for s, rs in by.items():
        t0, t1 = rs[0][0], rs[-1][0]
        cnt = collections.Counter(r[5] for r in rs)
        tasks = [r for r in rs if r[5] == 'ta']
        right = sum(1 for r in tasks if r[6][1] == '1')
        cat = sum(v for k, v in cnt.items() if k.startswith('k.'))
        print('%s  %s  %s  Dauer %d min  Ereignisse %d  Aufgaben geprüft %d (richtig %d)  Katzen-Ereignisse %d  Klicks %d' % (
            datetime.datetime.utcfromtimestamp(t0 / 1000).strftime('%Y-%m-%d %H:%M'), rs[0][1], rs[0][2], round((t1 - t0) / 60000), len(rs), len(tasks), right, cat, cnt.get('c', 0)))


main()
