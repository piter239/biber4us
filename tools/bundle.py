"""Fasst alle Aufgabenmodule (tasks/*.js, tasks/*.css) in je eine Datei zusammen.
Aufruf:  python3 tools/bundle.py <Zielordner>
Ergebnis im Zielordner: index.html (mit je einem <link> und <script> statt hunderter Einzeldateien),
tasks.bundle.css und tasks.bundle.js. Alles andere (app.js, assets/ ...) wird nicht kopiert.
Gedacht fuer Hosts mit Dateianzahl-Limit; die Quellen in tasks/ bleiben unveraendert."""
import os, re, sys

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(root, 'dist')
os.makedirs(out, exist_ok=True)
html = open(os.path.join(root, 'index.html'), encoding='utf-8').read()

css_links = re.findall(r'<link rel="stylesheet" href="(tasks/[^"]+\.css)">\n?', html)
js_tags = re.findall(r'<script src="(tasks/[^"]+\.js)"></script>\n?', html)

def cat(files, sep):
    return sep.join('/* ' + f + ' */\n' + open(os.path.join(root, f), encoding='utf-8').read() for f in files)

open(os.path.join(out, 'tasks.bundle.css'), 'w', encoding='utf-8').write(cat(css_links, '\n'))
open(os.path.join(out, 'tasks.bundle.js'), 'w', encoding='utf-8').write(cat(js_tags, '\n;\n'))

first = True
def css_sub(m):
    global first
    if first:
        first = False
        return '<link rel="stylesheet" href="tasks.bundle.css">\n'
    return ''
html = re.sub(r'<link rel="stylesheet" href="tasks/[^"]+\.css">\n?', css_sub, html)
first = True
def js_sub(m):
    global first
    if first:
        first = False
        return '<script src="tasks.bundle.js"></script>\n'
    return ''
html = re.sub(r'<script src="tasks/[^"]+\.js"></script>\n?', js_sub, html)
open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(html)
print(len(css_links), 'CSS,', len(js_tags), 'JS gebuendelt ->', out)
