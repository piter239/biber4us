/* Die Katze hilft bei der Aufgabe: Wer länger an einer Aufgabe sitzt (und noch am Rechner ist), bekommt vom Kätzchen
   eine Tafel angeboten: "Kann ich mitmachen? Worum geht es bei der Aufgabe?". Das Kind erklärt es der Katze (sprechen oder
   tippen); die Katze stellt Denkfragen und gibt kleine Tipps, nie die Lösung.
   - Antworten der Katze: mit Claude (Funktion "sample" der Artifact-Umgebung, auf dem Konto des Kindes, mit Zustimmung),
     sonst fest eingebaute Denkfragen.
   - Sprechen: Spracherkennung des Browsers (Web Speech API), Vorlesen mit der Sprachausgabe des Browsers; beides nur, wenn vorhanden.
   - Protokoll (BiberTrack): h.offer, h.say (Art, Länge, Text), h.cat (Art, Länge, ms, Text), h.close, h.mic, h.err. Die Eltern sehen die Texte
   auf der Seite Familie; das Kind wird auf der Tafel und im Seitenfuß darauf hingewiesen. */
window.BiberHelper = (function () {
  'use strict';
  var OFFER_AFTER = 180000;      /* so lange an einer Aufgabe, bevor die Katze fragt */
  var PRESENT = 45000;           /* so kurz her darf die letzte Eingabe sein: wer weggegangen ist, wird nicht gestört */
  var AGAIN = 8 * 60000;         /* frühestens nach so langer Zeit wieder anbieten */
  var AUTO_CLOSE = 45000;        /* ohne Reaktion zieht sich das Angebot zurück */

  function T() { if (window.BiberTrack) window.BiberTrack.log.apply(null, arguments); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var lastInput = Date.now(), cur = { id: '', t0: 0 }, offered = {}, declined = {}, ignored = 0;
  var el = null, logEl = null, inp = null, micBtn = null, ttsBtn = null, open = false, taskId = '', autoTimer = 0;
  var turns = [], busy = false, rung = 0, ttsOn = true, aiOff = false, sampleFn, rec = null, listening = false, openedAt = 0, replied = false;
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  ['pointerdown', 'keydown', 'touchstart'].forEach(function (n) { document.addEventListener(n, function () { lastInput = Date.now(); }, true); });
  var mv = 0;
  document.addEventListener('pointermove', function () { var n = Date.now(); if (n - mv > 1000) { mv = n; lastInput = n; } }, true);

  /* ---------- Aufgabe auslesen ---------- */
  function taskEl() { return document.querySelector('article.task:not([data-run-task])'); }
  function taskInfo() {
    var a = taskEl(); if (!a) return null;
    var m = /(?:^|\s)t-([a-z0-9]+)/i.exec(a.className || '');
    var txt = function (s) { var x = a.querySelector(s); return x ? x.innerText.replace(/\s+/g, ' ').trim() : ''; };
    var board = a.querySelector('.board-mount');
    return {
      id: m ? m[1] : '', title: txt('h1'), story: txt('.story'), question: txt('.question'), howto: txt('.howto'),
      board: board ? board.innerText.replace(/\s+/g, ' ').trim().slice(0, 500) : '',
      checked: !!(a.querySelector('[data-feedback]') && a.querySelector('[data-feedback]').children.length)
    };
  }

  /* ---------- Tafel ---------- */
  var HEAD = '<svg viewBox="0 0 64 56" aria-hidden="true"><path d="M8 24 14 4l14 10Zm48 0L50 4 36 14Z" fill="#c9854a"/><ellipse cx="32" cy="34" rx="26" ry="20" fill="#d99a5b"/><ellipse cx="22" cy="31" rx="3.2" ry="4.4" fill="#2b2118"/><ellipse cx="42" cy="31" rx="3.2" ry="4.4" fill="#2b2118"/><path d="M29 40h6l-3 3.4Z" fill="#c4607a"/><path d="M32 43.4v3m0 0c-2 2-5 2-6.500 0m6.500 0c2 2 5 2 6.500 0M6 36l12 2M6 42l12-2M58 36 46 38m12 4-12-2" stroke="#7a5230" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
  var MIC = '<svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20"><path d="M12 15a4 4 0 0 0 4-4V6a4 4 0 0 0-8 0v5a4 4 0 0 0 4 4Zm6-4a6 6 0 0 1-12 0M12 17v4m-4 0h8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var SPK = '<svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20"><path d="M4 9v6h4l5 4V5L8 9H4Zm12 0a4 4 0 0 1 0 6m2-9a8 8 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function build() {
    if (el) return;
    el = document.createElement('div');
    el.className = 'hf-tafel'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Die Katze hilft'); el.hidden = true;
    el.innerHTML =
      '<div class="hf-head"><span class="hf-cat">' + HEAD + '</span><b>Kann ich mitmachen?</b>' +
      '<button type="button" class="hf-ic" data-hf="tts" aria-label="Vorlesen an oder aus" aria-pressed="true">' + SPK + '</button>' +
      '<button type="button" class="hf-ic" data-hf="x" aria-label="Schließen">×</button></div>' +
      '<div class="hf-log" aria-live="polite"></div>' +
      '<p class="hf-note">Was du hier sagst oder schreibst, können deine Eltern später lesen.</p>' +
      '<div class="hf-quick"><button type="button" data-hf="read">Lies die Aufgabe vor</button><button type="button" data-hf="tip">Ich brauche einen Tipp</button><button type="button" data-hf="no">Nein, danke</button></div>' +
      '<form class="hf-in"><input type="text" maxlength="400" autocomplete="off" placeholder="Erklär es der Katze …" aria-label="Deine Antwort an die Katze">' +
      '<button type="button" class="hf-mic" data-hf="mic" aria-label="Sprechen">' + MIC + '</button><button type="submit" class="hf-send">Senden</button></form>';
    document.body.appendChild(el);
    logEl = el.querySelector('.hf-log'); inp = el.querySelector('input'); micBtn = el.querySelector('.hf-mic'); ttsBtn = el.querySelector('[data-hf=tts]');
    if (!SR) micBtn.hidden = true;
    if (!window.speechSynthesis) ttsBtn.hidden = true;
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-hf]'); if (!b) return;
      var k = b.dataset.hf;
      if (k === 'x') close('x'); else if (k === 'no') { declined[taskId] = true; close('nein'); }
      else if (k === 'mic') toggleMic();
      else if (k === 'tts') { ttsOn = !ttsOn; ttsBtn.setAttribute('aria-pressed', ttsOn ? 'true' : 'false'); if (!ttsOn) stopSpeak(); T('h.tts', ttsOn ? 1 : 0); }
      else if (k === 'read') { readTask(); }
      else if (k === 'tip') { send('Gib mir bitte einen kleinen Tipp, aber nicht die Lösung.', 'quick'); }
    });
    el.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); var v = inp.value.trim(); if (v) { inp.value = ''; send(v, 'type'); } });
    el.addEventListener('pointerdown', function () { clearTimeout(autoTimer); });
    el.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); close('x'); } });
  }

  function addMsg(who, text) {
    var d = document.createElement('div'); d.className = 'hf-msg hf-m-' + who; d.textContent = text;
    logEl.appendChild(d); logEl.scrollTop = logEl.scrollHeight; return d;
  }

  /* ---------- Sprache ---------- */
  function stopSpeak() { try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) { /* ignorieren */ } }
  function speak(text) {
    if (!ttsOn || !window.speechSynthesis) return;
    try {
      var K = window.BiberKitten; if (K && K.stats && K.stats().muted) return;
      stopSpeak();
      var u = new SpeechSynthesisUtterance(text); u.lang = 'de-DE'; u.rate = 0.95; u.pitch = 1.25;
      var vs = window.speechSynthesis.getVoices().filter(function (v) { return /^de/i.test(v.lang); });
      if (vs.length) u.voice = vs[0];
      window.speechSynthesis.speak(u);
    } catch (e) { /* ignorieren */ }
  }
  function toggleMic() {
    if (!SR) return;
    if (listening) { try { rec.stop(); } catch (e) { /* ignorieren */ } return; }
    stopSpeak();
    try {
      rec = new SR(); rec.lang = 'de-DE'; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
      var finalText = '';
      rec.onstart = function () { listening = true; micBtn.classList.add('on'); micBtn.setAttribute('aria-label', 'Stopp'); inp.placeholder = 'Ich höre zu …'; T('h.mic', 'start'); };
      rec.onresult = function (ev) {
        var s = '', f = '';
        for (var i = 0; i < ev.results.length; i++) { s += ev.results[i][0].transcript; if (ev.results[i].isFinal) f += ev.results[i][0].transcript; }
        inp.value = s; finalText = f;
      };
      rec.onerror = function (ev) {
        T('h.mic', 'err', ev && ev.error || '?');
        if (ev && /not-allowed|service-not-allowed/.test(ev.error)) { addMsg('cat', 'Das Mikrofon geht hier leider nicht. Tipp es mir bitte ein.'); micBtn.hidden = true; }
        else if (ev && ev.error === 'no-speech') addMsg('cat', 'Ich habe nichts gehört. Versuch es noch einmal!');
      };
      rec.onend = function () {
        listening = false; micBtn.classList.remove('on'); micBtn.setAttribute('aria-label', 'Sprechen'); inp.placeholder = 'Erklär es der Katze …';
        var v = (finalText || inp.value).trim();
        if (v) { inp.value = ''; send(v, 'mic'); }
      };
      rec.start();
    } catch (e) { T('h.mic', 'err', 'start ' + (e && e.message || '')); window.__hfErr = e && e.message; addMsg('cat', 'Sprechen geht hier nicht. Tipp es mir bitte ein.'); micBtn.hidden = true; }
  }

  /* ---------- Antworten der Katze ---------- */
  var RUNGS = [
    'Danke, das hilft mir! Was ist denn gegeben, und was sollst du herausfinden?',
    'Probier einen ganz kleinen Fall aus, zum Beispiel mit nur zwei oder drei Teilen. Was passiert dann?',
    'Kannst du es dir aufmalen oder aufschreiben? Manchmal sieht man dann das Muster.',
    'Lies die Frage noch einmal ganz langsam. Welches Wort ist am wichtigsten?',
    'Das klingt gut! Probier deine Idee aus und drück dann auf Antwort prüfen.'
  ];
  function scripted() { var r = RUNGS[Math.min(rung, RUNGS.length - 1)]; rung++; return r; }

  function rules(info) {
    return 'Du bist ein freundliches Kätzchen und hilfst einem Kind (etwa 11 Jahre, 6. Klasse) bei einer Aufgabe vom Informatik-Biber. ' +
      'Sprich Deutsch, duze das Kind, benutze einfache Wörter und schreibe höchstens zwei kurze Sätze, am liebsten mit einer Frage am Ende. ' +
      'Verrate NIEMALS die Lösung oder die Antwort. Gib stattdessen kleine Denkanstöße: Was ist gegeben? Was wird gesucht? Probiere einen kleinen Fall. Male es auf. ' +
      'Wenn das Kind falsch liegt, frage freundlich nach, wie es darauf kommt. Wenn es etwas richtig erklärt, lobe genau das. Keine Emojis, keine Aufzählungen. ' +
      'Geht es nicht um die Aufgabe, lenke freundlich zurück.\n\n' +
      'AUFGABE: ' + info.title + '\nGeschichte: ' + info.story + '\nFrage: ' + info.question + '\nBedienung: ' + info.howto +
      (info.board ? '\nText auf dem Spielfeld: ' + info.board : '');
  }

  async function aiReply(info, userText) {
    if (aiOff) return null;
    if (sampleFn === undefined) {
      try { sampleFn = window.claude && window.claude.use ? await window.claude.use('sample') : null; } catch (e) { sampleFn = null; }
    }
    if (!sampleFn) { aiOff = true; return null; }
    var msgs = turns.slice(); msgs.push({ role: 'user', content: userText });
    if (msgs[0].role === 'user') msgs[0] = { role: 'user', content: rules(info) + '\n\nDas Kind sagt: ' + msgs[0].content };
    try {
      var r = await sampleFn(msgs, { cache: false, modelTier: 'quick' });
      return (r && r.text || '').trim().slice(0, 600) || null;
    } catch (e) {
      T('h.err', e && e.code || 'x');
      if (!e || e.code !== 'rate_limited') aiOff = true;   /* Zustimmung abgelehnt oder nicht verfügbar: ab jetzt feste Fragen */
      return null;
    }
  }

  async function send(text, mode) {
    if (busy) return;
    busy = true; clearTimeout(autoTimer); stopSpeak();
    var info = taskInfo() || { title: '', story: '', question: '', howto: '', board: '' };
    addMsg('me', text);
    T('h.say', taskId, mode, text.length, text);
    var wait = addMsg('cat', 'Moment …'); wait.classList.add('hf-wait');
    var t0 = Date.now(), reply = await aiReply(info, text), how = 'ai';
    if (!reply) { how = 'script'; reply = scripted(); }
    else { turns.push({ role: 'user', content: text }); turns.push({ role: 'assistant', content: reply }); }
    wait.classList.remove('hf-wait'); wait.textContent = reply;
    T('h.cat', taskId, how, reply.length, Date.now() - t0, reply);
    speak(reply);
    replied = true; busy = false;
  }

  function readTask() {
    var info = taskInfo(); if (!info) return;
    var t = [info.story, info.question].filter(Boolean).join(' ');
    T('h.read', taskId);
    var d = addMsg('cat', 'Ich lese vor: ' + t);
    speak(t); logEl.scrollTop = logEl.scrollHeight; void d;
  }

  /* ---------- Öffnen und Schließen ---------- */
  function show(reason) {
    var info = taskInfo(); if (!info || open) return;
    build();
    open = true; taskId = info.id; offered[taskId] = Date.now(); turns = []; rung = 0; replied = false; openedAt = Date.now();
    logEl.innerHTML = ''; el.hidden = false; el.classList.remove('hf-in-anim'); void el.offsetWidth; el.classList.add('hf-in-anim');
    var line = 'Kann ich mitmachen? Worum geht es bei der Aufgabe? Erklär es mir!';
    addMsg('cat', line);
    T('h.offer', taskId, reason);
    try { var K = window.BiberKitten; if (K && K.pause) K.pause(true); } catch (e) { /* ignorieren */ }
    if (reason !== 'ask') {
      try { if (window.BiberKitten) window.BiberKitten.visit({ action: 'wave', side: 'left', text: 'Kann ich mitmachen?' }); } catch (e) { /* ignorieren */ }
      autoTimer = setTimeout(function () { if (!replied) { ignored++; close('timeout'); } }, AUTO_CLOSE);
    }
    speak(line);
    setTimeout(function () { try { inp.focus({ preventScroll: true }); } catch (e) { /* ignorieren */ } }, 300);
  }
  function close(how) {
    if (!open) return;
    open = false; clearTimeout(autoTimer); stopSpeak();
    try { if (listening && rec) rec.stop(); } catch (e) { /* ignorieren */ }
    el.hidden = true;
    T('h.close', taskId, how, Math.round((Date.now() - openedAt) / 1000));
    try { var K = window.BiberKitten; if (K && K.pause) K.pause(false); } catch (e) { /* ignorieren */ }
  }

  /* ---------- Auslöser ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-help]');
    if (b) { e.preventDefault(); if (open) close('again'); show('ask'); }
  });
  setInterval(function () {
    var info = taskInfo();
    if (!info || !info.id) { cur.id = ''; if (open) close('weg'); return; }
    if (info.id !== cur.id) { cur = { id: info.id, t0: Date.now() }; if (open && taskId !== info.id) close('weg'); return; }
    if (open || document.hidden || info.checked || ignored >= 2 || declined[info.id]) return;
    if (document.body.classList.contains('bk-albumopen') || document.querySelector('.dlg-back')) return;
    var now = Date.now();
    if (now - cur.t0 < OFFER_AFTER || now - lastInput > PRESENT) return;
    if (offered[info.id] && now - offered[info.id] < AGAIN) return;
    if (window.BiberKitten && window.BiberKitten.stats && !window.BiberKitten.stats().enabled) return;
    show('auto');
  }, 4000);

  return { show: show, close: close, state: function () { return { open: open, ignored: ignored, ai: !aiOff }; } };
})();
