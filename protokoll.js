/* Eltern-Ansicht des Aktivitätsprotokolls (Seite "Familie"): zeigt je Sitzung eine Zusammenfassung und auf Klick den Ablauf
   in lesbarer Form. Liest die Dokumente logs/<Konto>/c/* (nur Besitzer und Editoren dürfen das). */
window.BiberProtokoll = (function () {
  'use strict';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function dec(x) { try { return decodeURIComponent(x); } catch (e) { return x; } }
  function hms(t) { var d = new Date(t); return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
  function dayTime(t) { var d = new Date(t); return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) + ' ' + d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }); }

  function parse(d) {
    var out = [], t = d.b || 0;
    String(d.t || '').split('\n').forEach(function (line) {
      var p = line.split(' ');
      if (p.length < 2) return;
      var dt = parseInt(p[0], 10);
      if (isNaN(dt)) return;
      t += dt;
      out.push({ t: t, c: p[1], a: p.slice(2).map(dec) });
    });
    return out;
  }

  function say(e, title) {
    var a = e.a, c = e.c, T = function (id) { return esc(title[id] || id); };
    switch (c) {
      case 'S': return 'Start (' + esc(a.slice(1, 8).join(' ')) + ')';
      case 'v': return 'Seite ' + esc(a[0] || '#');
      case 'c': return 'Klick: ' + esc(a[0]) + ' <span class="note">(' + esc(a[1]) + '‰, ' + esc(a[2]) + '‰)</span>';
      case 'kb': return 'Tastatur: ' + esc(a[0]) + ' Tasten';
      case 'key': return 'Taste ' + esc(a[0]);
      case 'vis': return a[0] === 'h' ? 'Tab/Fenster verlassen' : 'Zurück im Tab';
      case 'idle': return 'Pause (nichts getan seit ' + esc(a[0]) + ' s)';
      case 'back': return 'wieder aktiv nach ' + esc(a[0]) + ' s';
      case 'ts': return '<b>Aufgabe geöffnet:</b> ' + T(a[0]) + ' <span class="note">(' + esc(a[1]) + ', Schwierigkeit ' + esc(a[3]) + (a[2] === '1' ? ', schon gelöst' : '') + ')</span>';
      case 'ta': return '<b>Antwort geprüft:</b> ' + T(a[0]) + ' – ' + (a[1] === '1' ? '<b style="color:var(--ok,#1c7c3c)">richtig</b>' : '<b style="color:var(--bad,#b3261e)">falsch</b>') + (a[2] === '1' ? ' (zählt)' : ' (Wiederholung)') + ', ' + esc(a[3]) + ' s';
      case 'tl': return 'Aufgabe verlassen: ' + T(a[0]) + ' nach ' + esc(a[1]) + ' s';
      case 'tr': return 'Aufgabe ' + T(a[0]) + ': ' + esc(a[1]);
      case 'tsol': return 'Lösung angesehen: ' + T(a[0]);
      case 'i': return 'Eingabe im Spielfeld: ' + T(a[0]);
      case 'lvl': return 'Niveau jetzt ' + esc(a[0]);
      case 'r.start': return '<b>Probelauf gestartet:</b> ' + esc(a[0].split(',').length) + ' Aufgaben, ' + esc(a[1]) + ' min';
      case 'r.go': return 'Probelauf: Aufgabe ' + esc(a[0]) + ' (' + T(a[1]) + ')';
      case 'r.ans': return 'Probelauf-Antwort ' + T(a[0]) + ': ' + (a[1] === '1' ? 'richtig' : a[1] === '0' ? 'falsch' : 'unvollständig');
      case 'r.fin': return '<b>Probelauf abgegeben:</b> ' + esc(a[0]) + ' Punkte, ' + esc(a[1]) + ' richtig, ' + esc(a[2]) + ' falsch, ' + esc(a[3]) + ' leer, ' + Math.round(a[4] / 60) + ' min';
      case 'sync': return 'Speicher: ' + esc(a[0]);
      case 'rec': return 'Vorschläge angezeigt: ' + esc(a.join(' '));
      case 'rs': return 'Fenstergröße ' + esc(a[0]);
      case 'k.v': return 'Kätzchen kommt (' + esc(a[0]) + ', von ' + esc(a[1]) + (a[2] === '1' ? ', mit Freundin' : '') + ')';
      case 'h.offer': return '<b>Katze bietet Hilfe an</b> (' + T(a[0]) + ', ' + (a[1] === 'ask' ? 'Irina hat gefragt' : 'automatisch') + ')';
      case 'h.say': return 'Zur Katze gesagt (' + ({ mic: 'gesprochen', type: 'getippt', quick: 'Schnellknopf' }[a[1]] || esc(a[1])) + ', ' + esc(a[2]) + ' Zeichen)';
      case 'h.cat': return 'Katze antwortet (' + (a[1] === 'ai' ? 'Claude' : 'feste Frage') + ', ' + esc(a[2]) + ' Zeichen, ' + esc(a[3]) + ' ms)';
      case 'h.close': return 'Tafel geschlossen: ' + esc(a[1]) + ' nach ' + esc(a[2]) + ' s';
      case 'h.mic': return 'Mikrofon: ' + esc(a.join(' '));
      case 'h.read': return 'Aufgabe vorlesen lassen';
      case 'h.err': return 'Hilfe-Fehler: ' + esc(a[0]);
      case 'k.pet': return 'Kätzchen gestreichelt (' + esc(a[0]) + ')';
      case 'k.zoom': return '<b>Zoomies</b> starten (Tempo ' + esc(a[0]) + ' ms)';
      case 'k.za': return 'Zoomies: Auftritt ' + esc(a[0]) + ' (' + esc(a[1]) + ')';
      case 'k.zc': return 'Zoomies: Tipp auf Auftritt ' + esc(a[0]) + ' nach ' + esc(a[1]) + ' ms – ' + ({ hit: 'Treffer', again: 'schon getroffen', late: 'zu spät', intro: 'vor dem ersten Auftritt' }[a[2]] || esc(a[2]));
      case 'k.zhit': return 'Zoomies: <b>Treffer ' + esc(a[0]) + '</b>';
      case 'k.zend': return 'Zoomies Ende: ' + esc(a[0]) + ' Treffer (neues Tempo ' + esc(a[1]) + ' ms)';
      default: return esc(c) + (e.a.length ? ' <span class="note">' + esc(e.a.join(' ')) + '</span>' : '');
    }
  }

  function summary(ev) {
    var n = { c: 0, ta: 0, right: 0, pet: 0, zoom: 0, zhit: 0, zc: 0, rs: 0, gift: 0 }, rin = null;
    ev.forEach(function (e) {
      if (e.c === 'c') n.c++;
      else if (e.c === 'ta') { n.ta++; if (e.a[1] === '1') n.right++; }
      else if (e.c === 'k.pet') n.pet++;
      else if (e.c === 'k.zoom') n.zoom++;
      else if (e.c === 'k.zhit') n.zhit++;
      else if (e.c === 'k.zc') n.zc++;
      else if (e.c === 'r.fin') rin = e.a;
    });
    var parts = [];
    if (n.ta) parts.push(n.ta + ' Antworten geprüft (' + n.right + ' richtig)');
    if (rin) parts.push('Probelauf: ' + rin[1] + ' richtig, ' + rin[2] + ' falsch');
    if (n.zoom) parts.push(n.zoom + '× Zoomies, ' + n.zhit + ' Treffer bei ' + n.zc + ' Tipps');
    parts.push(n.c + ' Klicks');
    return parts.join(' · ');
  }

  function timeline(ev, title) {
    var rows = [], last = null;
    ev.forEach(function (e) {
      var key = e.c + '|' + e.a.join('|');
      if (last && last.key === key && (e.c === 'c' || e.c === 'k.pet' || e.c === 'r.ans' || e.c === 'i')) { last.n++; last.t1 = e.t; return; }
      last = { key: key, e: e, n: 1, t1: e.t };
      rows.push(last);
    });
    return '<table class="log-tab"><tbody>' + rows.map(function (r) {
      return '<tr><td>' + hms(r.e.t) + '</td><td>' + say(r.e, title) + (r.n > 1 ? ' <span class="note">×' + r.n + '</span>' : '') + '</td></tr>';
    }).join('') + '</tbody></table>';
  }

  function sessionsOf(docs) {
    var by = {};
    docs.forEach(function (d) {
      var s = d.s || d.id; if (!by[s]) by[s] = { s: s, w: d.w || '', d: d.d || '', h: d.h || '', docs: [] };
      by[s].docs.push(d);
    });
    return Object.keys(by).map(function (k) {
      var x = by[k]; x.docs.sort(function (a, b) { return (a.n || 0) - (b.n || 0); });
      x.ev = []; x.docs.forEach(function (d) { x.ev = x.ev.concat(parse(d)); });
      return x;
    }).filter(function (x) { return x.ev.length; }).sort(function (a, b) { return b.ev[0].t - a.ev[0].t; });
  }

  /* Rendert alle Sitzungen der Konten in "host". titles: Aufgaben-Id -> Titel */
  async function render(host, uids, names, titles) {
    var B = window.BiberSync;
    host.innerHTML = '<h2>Aktivitätsprotokoll</h2><p class="note">Lade …</p>';
    var all = [];
    for (var i = 0; i < uids.length; i++) {
      try {
        var docs = await B.listLogs(uids[i]);
        sessionsOf(docs).forEach(function (s) { s.uid = uids[i]; all.push(s); });
      } catch (e) { /* kein Zugriff auf dieses Konto */ }
    }
    all.sort(function (a, b) { return b.ev[0].t - a.ev[0].t; });
    if (!all.length) { host.innerHTML = '<h2>Aktivitätsprotokoll</h2><p class="note">Noch keine Einträge.</p>'; return; }
    host.innerHTML = '<h2>Aktivitätsprotokoll</h2><p class="note">Jede Sitzung ist ein Besuch (neue Sitzung nach 30 Minuten Pause oder beim Profilwechsel). Zeiten in der Zeitzone dieses Geräts.</p>' +
      all.map(function (s) {
        var t0 = s.ev[0].t, t1 = s.ev[s.ev.length - 1].t, dev = (s.ev[0].c === 'S' ? s.ev[0].a.slice(1, 3).join(' ') + ', ' + (s.ev[0].a[6] || '') : s.h);
        return '<details class="log-ses"><summary><b>' + esc(dayTime(t0)) + '</b> · ' + esc(s.w || 'ohne Namen') + ' · ' + Math.max(1, Math.round((t1 - t0) / 60000)) + ' min · ' + esc(dev) +
          '<br><span class="note">' + esc(summary(s.ev)) + '</span></summary><div class="log-body" data-i="' + all.indexOf(s) + '"></div></details>';
      }).join('');
    host.querySelectorAll('details.log-ses').forEach(function (det) {
      det.addEventListener('toggle', function () {
        var b = det.querySelector('.log-body');
        if (det.open && !b.dataset.done) { b.dataset.done = '1'; b.innerHTML = timeline(all[+b.dataset.i].ev, titles || {}); }
      });
    });
  }
  return { render: render };
})();
