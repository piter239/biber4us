/*!
 * Biber-Kätzchen: ein kleines Kätzchen, das ab und zu von einem zufälligen Seitenrand hereinschaut,
 * etwas Niedliches tut und Mut macht. Ein Klick streichelt es (Miau, Schnurren, Herzchen).
 *
 * Einbinden auf jeder Seite:   <script src="kitten.js" defer></script>
 * Optionen als data-Attribute: data-first="10000" (ms bis zum ersten Besuch)
 *                              data-min="35000" data-max="90000" (Abstand zwischen Besuchen)
 *                              data-sound="off" (kein Ton), data-start="off" (Kätzchen anfangs aus)
 * Steuerung per JavaScript:    BiberKitten.visit({side:'left', action:'wave', text:'Hallo!'})
 *                              BiberKitten.say('Text'), .cheer(), .comfort(), .setEnabled(false), .stats()
 * Ereignis von der Seite:      document.dispatchEvent(new CustomEvent('biber:result', {detail:{correct:true}}))
 */
(function () {
  'use strict';
  if (window.BiberKitten) return;

  var script = document.currentScript;
  function opt(name, def) {
    var v = script && script.getAttribute('data-' + name);
    return v == null ? def : v;
  }
  var CFG = {
    first: +opt('first', 10000),
    min: +opt('min', 35000),
    max: +opt('max', 90000),
    sound: opt('sound', 'on') !== 'off',
    start: opt('start', 'on') !== 'off'
  };
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- Texte ---------- */
  var ENCOURAGE = [
    'Das machst Du super!',
    'Ich glaube an Dich!',
    'Scheint nicht gerade trivial, aber Du schaffst es bestimmt!',
    'Du bist näher dran, als Du denkst.',
    'Kleine Schritte zählen auch!',
    'Tief durchatmen, dann klappt es.',
    'Schau noch einmal genau hin. Hinweise verstecken sich gern im Detail!',
    'Fehler sind nur Zwischenschritte.',
    'Auch Biber bauen ihren Damm Stück für Stück.',
    'Probieren geht über Studieren!',
    'Knifflig? Genau das macht schlau!',
    'Weiter so, Du bist auf dem richtigen Weg!',
    'Eine kleine Pause tut auch gut. Hast Du schon etwas getrunken?'
  ];
  var HARD = [
    'Scheint nicht gerade trivial, aber Du schaffst es bestimmt!',
    'Knifflig! Aber Du hast schon ganz andere Dinge geschafft.',
    'Hast Du schon mal von hinten angefangen?',
    'Probier es einfach aus. Zurücksetzen geht immer!'
  ];
  var FUN = [
    'Miau!', 'Prrr…', 'Wusstest Du? Katzen schlafen bis zu 16 Stunden am Tag.',
    'Ich bin nur kurz vorbeigekommen. Mach weiter!', 'Hier ist es gemütlich.', 'Ich bin Dein Glückskätzchen.'
  ];
  var CORRECT = ['Richtig! Das hast Du super gemacht!', 'Volltreffer!', 'Wow, genau so!', 'Ich wusste es! Du kannst das!', 'Miau! Stark!'];
  var WRONG = ['Nicht schlimm, Fehler gehören dazu!', 'Lies Dir die Erklärung an, dann klappt es beim nächsten Mal.', 'Ich glaube trotzdem an Dich!', 'Probier es gleich noch einmal!'];
  var PET = ['Miau!', 'Mrrrau!', 'Prrrrrr…', 'Das tut gut!', 'Danke fürs Streicheln!', 'Noch einmal, noch einmal!', 'Du bist toll!', 'Mrrp?'];

  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  /* ---------- Speicher ---------- */
  /* Die Seite kann mit window.BIBER_PROFILE = {key, name} getrennte Stände pro Person anlegen (z. B. Geschwister). */
  var KEY = (window.BIBER_PROFILE && window.BIBER_PROFILE.key) || 'bk.v1';
  var who = (window.BIBER_PROFILE && window.BIBER_PROFILE.name) || '';
  function loadMem() {
    var m = { off: false, mute: false, seen: {}, pets: 0, secrets: {} };
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) m = Object.assign(m, JSON.parse(raw));
    } catch (e) { /* ohne Speicher */ }
    if (!m.stickers) {
      m.stickers = {};
      Object.keys(m.seen || {}).forEach(function (k) { m.stickers['a:' + k] = true; });
      if (m.secrets && m.secrets.zoomies) m.stickers['s:zoomies'] = true;
    }
    if (m.giftN == null) m.giftN = 0;
    if (m.giftNext == null) m.giftNext = (m.correct || 0) + 1;
    if (!CFG.start && !m.touched) m.off = true;
    return m;
  }
  var mem = loadMem();
  /* Ab und zu den Namen anhängen: "Das machst Du super!" -> "Das machst Du super, Irina!" */
  function nm(text) {
    if (!who || Math.random() > 0.4 || text.indexOf(who) >= 0 || !/[!.]$/.test(text) || text.length > 70) return text;
    return text.slice(0, -1) + ', ' + who + text.slice(-1);
  }
  /* Vorstellungen im Album kosten Guthaben; Guthaben gibt es für gelöste Aufgaben (erster Versuch: richtig +3, falsch +1) */
  function credit() { if (mem.credit == null) mem.credit = 5; return mem.credit; }
  /* Belohnung: Zählung ab jetzt (mem.fc = richtig gelöste Aufgaben im ersten Versuch). 1. Ankündigung nach 1, 2. Ankündigung nach 3, Luna kommt nach 5. */
  var pendingFriend = null;
  function friendProgress() {
    mem.fc = (mem.fc || 0) + 1; persist(); T('k.fc', mem.fc);
    var c = mem.fc, st = mem.stickers || {};
    if (!st['s:ahnung'] && c >= 1) { unlock('s:ahnung'); pendingFriend = 'ann'; }
    else if (!st['s:ahnung2'] && c >= 3) { unlock('s:ahnung2'); pendingFriend = 'ann2'; }
    else if (!st['s:luna'] && c >= 5) { mem.friend = true; unlock('s:luna'); pendingFriend = 'arrive'; }
    if (pendingFriend) schedule(9000);
  }
  function earn(n) { if (!(n > 0)) return; mem.credit = credit() + n; persist(); T('k.cr', n, mem.credit); if (window.__bkCredit) window.__bkCredit(); }
  function T() { if (window.BiberTrack) window.BiberTrack.log.apply(null, arguments); }
  function persist() { mem.touched = true; try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* ignorieren */ } }

  /* ---------- Stile ---------- */
  var CSS = [
    '.bk-wrap{position:fixed;z-index:2147483000;margin:0;padding:0;border:0;background:none;visibility:hidden;pointer-events:none;-webkit-tap-highlight-color:transparent;overflow:visible;font:inherit}',
    '.bk-wrap.bk-on{visibility:visible}',
    '[data-acc] .bk-bow{display:none}',
    '.bk-wrap.bk-live{pointer-events:auto;cursor:pointer}',
    '.bk-wrap:focus-visible{outline:3px solid var(--focus,#0a86a6);outline-offset:4px;border-radius:12px}',
    '.bk-peek{position:absolute;inset:0;transition:transform .55s cubic-bezier(.3,1.4,.5,1);transform:translateY(100%)}',
    '.bk-peek.bk-sneak{transform:translateY(var(--bk-sneak,48%))}',
    '.bk-peek.bk-up{transform:translateY(var(--bk-up,16%))}',
    '.bk-peek.bk-pop{transform:translateY(0)}',
    '.bk-peek.bk-out{transition-duration:.45s;transition-timing-function:ease-in;transform:translateY(105%)}',
    '.bk-reduced .bk-peek{transition:opacity .4s;opacity:0}',
    '.bk-reduced .bk-peek.bk-sneak,.bk-reduced .bk-peek.bk-up,.bk-reduced .bk-peek.bk-pop{opacity:1;transform:translateY(var(--bk-up,16%))}',
    '.bk-svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;display:block}',
    '.bk-svg *{transform-box:fill-box}',
    '.bk-fx{position:absolute;inset:0;pointer-events:none;overflow:visible}',
    /* Grundbewegungen */
    '.bk-tail{transform-origin:12% 92%;animation:bk-idle 3.2s ease-in-out infinite}',
    '.bk-head{transform-origin:50% 85%}',
    '.bk-earL{transform-origin:70% 90%}.bk-earR{transform-origin:30% 90%}',
    '.bk-pawL,.bk-pawR{transform-origin:50% 100%}',
    '.bk-eye{transform-origin:50% 50%}',
    '.bk-look{transition:transform .12s ease-out}',
    '.bk-happyeyes,.bk-mouthopen,.bk-tongue{opacity:0}',
    '.bk-mouthopen{transform-origin:50% 0}',
    '.bk-happy .bk-happyeyes{opacity:1}.bk-happy .bk-eye{opacity:0}',
    '.bk-looking .bk-pupil{animation:bk-lookaround 2.2s ease-in-out infinite alternate}',
    '@keyframes bk-idle{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(6deg)}}',
    '@keyframes bk-lookaround{0%{transform:translateX(-4px)}100%{transform:translateX(4px)}}',
    /* Aktionen */
    '.bk-a-wave .bk-pawR{animation:bk-wave .5s ease-in-out 4}',
    '@keyframes bk-wave{0%,100%{transform:translateY(-34px) rotate(14deg)}50%{transform:translateY(-38px) rotate(-18deg)}}',
    '.bk-a-tail .bk-tail{animation:bk-swish .45s ease-in-out 6}',
    '@keyframes bk-swish{0%,100%{transform:rotate(-28deg)}50%{transform:rotate(30deg)}}',
    '.bk-a-kiss .bk-eye{animation:bk-slowblink 2.4s ease-in-out 1}',
    '@keyframes bk-slowblink{0%,100%{transform:scaleY(1)}30%,70%{transform:scaleY(.07)}}',
    '.bk-a-yawn .bk-mouthopen{animation:bk-yawn 2.4s ease-in-out 1}',
    '.bk-a-yawn .bk-head{animation:bk-yawnhead 2.4s ease-in-out 1}',
    '.bk-a-yawn .bk-eye{animation:bk-squint 2.4s ease-in-out 1}',
    '@keyframes bk-yawn{0%,100%{opacity:0;transform:scaleY(.1)}25%,70%{opacity:1;transform:scaleY(1.6)}}',
    '@keyframes bk-yawnhead{0%,100%{transform:translateY(0) rotate(0)}30%,70%{transform:translateY(-5px) rotate(-3deg)}}',
    '@keyframes bk-squint{0%,100%{transform:scaleY(1)}30%,70%{transform:scaleY(.25)}}',
    '.bk-a-ear .bk-earL{animation:bk-ear .32s ease-in-out 5}',
    '.bk-a-ear .bk-earR{animation:bk-ear .32s ease-in-out 5 .16s}',
    '@keyframes bk-ear{0%,100%{transform:rotate(0)}50%{transform:rotate(-16deg) translateY(2px)}}',
    '.bk-a-wash .bk-pawL{animation:bk-wash 2.8s ease-in-out 1}',
    '.bk-a-wash .bk-head{animation:bk-washhead .45s ease-in-out 5 .5s}',
    '.bk-a-wash .bk-tongue{animation:bk-lick .45s ease-in-out 5 .5s}',
    '@keyframes bk-wash{0%{transform:none}18%,82%{transform:translate(20px,-56px) rotate(24deg)}100%{transform:none}}',
    '@keyframes bk-washhead{0%,100%{transform:rotate(0)}50%{transform:rotate(-5deg) translateY(2px)}}',
    '@keyframes bk-lick{0%,100%{opacity:0}40%,60%{opacity:1}}',
    '.bk-a-tilt .bk-head{animation:bk-tilt 2.6s ease-in-out 1}',
    '.bk-a-tilt .bk-pupil{animation:bk-big 2.6s ease-in-out 1}',
    '@keyframes bk-tilt{0%,100%{transform:rotate(0)}18%,42%{transform:rotate(-15deg)}58%,82%{transform:rotate(15deg)}}',
    '@keyframes bk-big{0%,100%{transform:scale(1)}18%,82%{transform:scale(1.28)}}',
    '.bk-a-butterfly .bk-pupil,.bk-a-yarn .bk-pupil{animation:bk-follow 3.6s linear 1}',
    '@keyframes bk-follow{0%{transform:translate(-5px,-2px)}50%{transform:translate(0,-3px)}100%{transform:translate(5px,-1px)}}',
    '.bk-a-butterfly .bk-pawR{animation:bk-swat .5s ease-in 3.2s 1}',
    '.bk-a-yarn .bk-pawL{animation:bk-swat .5s ease-in 2s 2}',
    '@keyframes bk-swat{0%,100%{transform:none}40%{transform:translate(-8px,-52px) rotate(-20deg)}}',
    '.bk-butterfly{position:absolute;width:26%;height:26%;left:-10%;top:18%;animation:bk-fly 3.6s ease-in-out 1 forwards}',
    '.bk-butterfly .bk-wing{transform-origin:50% 50%;animation:bk-flap .16s ease-in-out infinite alternate}',
    '@keyframes bk-flap{0%{transform:scaleX(1)}100%{transform:scaleX(.25)}}',
    '@keyframes bk-fly{0%{left:-14%;top:30%}25%{left:20%;top:6%}50%{left:50%;top:22%}75%{left:78%;top:0%}100%{left:112%;top:16%}}',
    '.bk-yarn{position:absolute;width:24%;height:24%;bottom:6%;left:-30%;animation:bk-roll 4s ease-in-out 1 forwards}',
    '@keyframes bk-roll{0%{left:-30%;transform:rotate(0)}45%{left:40%;transform:rotate(540deg)}55%{left:40%;transform:rotate(540deg)}100%{left:130%;transform:rotate(1400deg)}}',
    '.bk-a-sleep .bk-eye{animation:bk-doze 3.4s ease-in-out 1 forwards}',
    '.bk-a-sleep .bk-head{animation:bk-droop 3.4s ease-in-out 1 forwards}',
    '@keyframes bk-doze{0%{transform:scaleY(1)}35%,80%{transform:scaleY(.06)}100%{transform:scaleY(1.1)}}',
    '@keyframes bk-droop{0%{transform:none}35%,80%{transform:translateY(14px) rotate(7deg)}88%{transform:translateY(-8px) rotate(0)}100%{transform:none}}',
    '.bk-zzz{position:absolute;left:62%;top:6%;font:700 20px/1 system-ui,sans-serif;color:var(--muted,#6a7b82);opacity:0;animation:bk-zup 2.2s ease-out 1 forwards}',
    '@keyframes bk-zup{0%{opacity:0;transform:translate(0,0) scale(.6)}20%{opacity:1}100%{opacity:0;transform:translate(14px,-46px) scale(1.2)}}',
    '.bk-a-mouse .bk-peek{animation:bk-wiggle .14s ease-in-out 8 .9s}',
    '.bk-a-mouse .bk-pawR{animation:bk-swat .45s ease-in 2.4s 1}',
    '.bk-a-mouse .bk-look{transform:translate(3px,5px)}',
    '@keyframes bk-wiggle{0%,100%{margin-left:0}50%{margin-left:4px}}',
    '.bk-mouse{position:absolute;width:30%;height:20%;right:-6%;bottom:10%;animation:bk-mousepop 3.4s ease-in-out 1 forwards}',
    '@keyframes bk-mousepop{0%{transform:translate(0,40px)}15%,60%{transform:translate(0,0)}72%{transform:translate(0,-14px) rotate(-10deg)}100%{transform:translate(70px,40px)}}',
    '.bk-a-knock .bk-pawR{animation:bk-tap .5s ease-in-out 3}',
    '.bk-a-knock .bk-head{animation:bk-lean 2s ease-in-out 1}',
    '@keyframes bk-tap{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-30px) scale(1.18)}}',
    '@keyframes bk-lean{0%,100%{transform:none}30%,70%{transform:rotate(8deg) scale(1.03)}}',
    '.bk-ring{position:absolute;left:62%;top:60%;width:22%;height:22%;margin:-11% 0 0 -11%;border:3px solid var(--accent,#0a86a6);border-radius:50%;opacity:0;animation:bk-ripple .7s ease-out 1 forwards}',
    '@keyframes bk-ripple{0%{opacity:.8;transform:scale(.3)}100%{opacity:0;transform:scale(1.8)}}',
    '.bk-a-sneeze .bk-head{animation:bk-sneeze 1.6s ease-in-out 1}',
    '.bk-a-sneeze .bk-eye{animation:bk-sneezeeye 1.6s ease-in-out 1}',
    '@keyframes bk-sneeze{0%,100%{transform:none}35%{transform:translateY(6px) scale(.94)}48%{transform:translateY(-14px) scale(1.1)}70%{transform:translateY(0) scale(1)}}',
    '@keyframes bk-sneezeeye{0%,100%{transform:scaleY(1)}30%,60%{transform:scaleY(.08)}}',
    '.bk-dust{position:absolute;left:50%;top:48%;width:7%;height:7%;border-radius:50%;background:var(--muted,#8aa0a8);opacity:0;animation:bk-puff .8s ease-out 1 forwards}',
    '@keyframes bk-puff{0%{opacity:.8;transform:translate(0,0)}100%{opacity:0;transform:translate(var(--dx),var(--dy))}}',
    '.bk-a-stretch .bk-pawL,.bk-a-stretch .bk-pawR{animation:bk-stretch 2.2s ease-in-out 1}',
    '.bk-a-stretch .bk-head{animation:bk-stretchhead 2.2s ease-in-out 1}',
    '@keyframes bk-stretch{0%,100%{transform:none}25%,75%{transform:translateY(-44px) scale(1.12,1.3)}}',
    '@keyframes bk-stretchhead{0%,100%{transform:none}25%,75%{transform:translateY(12px) rotate(-3deg)}}',
    '.bk-a-happy .bk-head{animation:bk-nuzzle .5s ease-in-out infinite}',
    '.bk-a-happy .bk-tail{animation:bk-swish .35s ease-in-out infinite}',
    '@keyframes bk-nuzzle{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg) translateY(-2px)}}',
    '.bk-heart{position:absolute;width:15%;height:15%;color:#ef5d7a;opacity:0;animation:bk-hup 1.7s ease-out 1 forwards}',
    '@keyframes bk-hup{0%{opacity:0;transform:translate(0,0) scale(.5)}15%{opacity:1}100%{opacity:0;transform:translate(var(--dx),-90px) scale(1.15)}}',
    '.bk-q{position:absolute;left:68%;top:-4%;font:800 26px/1 system-ui,sans-serif;color:var(--accent,#0a86a6);animation:bk-hup 1.8s ease-out 1 forwards;--dx:6px}',
    '.bk-spark{position:absolute;width:11%;height:11%;color:#f2c230;opacity:0;animation:bk-hup 1.4s ease-out 1 forwards}',
    /* Sprechblase */
    '.bk-bubble{position:fixed;z-index:2147483001;max-width:min(260px,calc(100vw - 24px));padding:.55rem .8rem;border-radius:14px;background:var(--surface,#fff);color:var(--ink,#1b2b31);border:2px solid var(--accent,#0a86a6);font:600 15px/1.35 var(--font-body,system-ui,sans-serif);box-shadow:0 4px 14px rgba(0,0,0,.18);pointer-events:none;opacity:0;transform:scale(.85);transition:opacity .25s,transform .25s;visibility:hidden}',
    '.bk-bubble.bk-show{opacity:1;transform:scale(1);visibility:visible}',
    '@media (max-width:520px){.bk-bubble{font-size:14px}}',
    /* Zubehör */
    '.bk-acc{display:none}',
    '[data-acc="xmas"] .bk-acc-xmas,[data-acc="halloween"] .bk-acc-halloween,[data-acc="ostern"] .bk-acc-ostern,[data-acc="sommer"] .bk-acc-sommer,[data-acc="silvester"] .bk-acc-silvester{display:inline}',
    /* Geschenk */
    '.bk-gift{position:absolute;left:24%;top:58%;width:52%;animation:bk-giftin .9s cubic-bezier(.3,1.5,.5,1) 1 forwards,bk-giftwig .5s ease-in-out 1s 4}',
    '@keyframes bk-giftin{0%{opacity:0;transform:translate(90%,60%) rotate(50deg) scale(.4)}100%{opacity:1;transform:none}}',
    '@keyframes bk-giftwig{0%,100%{transform:rotate(0)}50%{transform:rotate(-9deg)}}',
    /* Toast und Album */
    '.bk-toast{position:fixed;left:12px;bottom:12px;z-index:2147483002;display:flex;gap:.5rem;align-items:center;padding:.5rem .8rem;border-radius:999px;border:2px solid var(--accent,#0a86a6);background:var(--surface,#fff);color:var(--ink,#1b2b31);font:700 14px/1.2 var(--font-body,system-ui,sans-serif);box-shadow:0 4px 14px rgba(0,0,0,.2);cursor:pointer;opacity:0;transform:translateY(12px);transition:opacity .25s,transform .25s;visibility:hidden}',
    '.bk-toast.bk-show{opacity:1;transform:none;visibility:visible}',
    '.bk-toast svg{width:22px;height:22px;color:#f2c230}',
    '.bk-album-back{position:fixed;inset:0;z-index:2147483100;background:rgba(10,20,25,.55);display:grid;place-items:center;padding:12px}',
    '.bk-album{width:min(720px,100%);max-height:calc(100vh - 24px);overflow:auto;background:var(--surface,#fff);color:var(--ink,#1b2b31);border:2px solid var(--accent,#0a86a6);border-radius:16px;padding:1rem 1.1rem;font:400 16px/1.4 var(--font-body,system-ui,sans-serif)}',
    '.bk-album h2{margin:0;font:700 1.4rem/1.2 var(--font-display,system-ui,sans-serif)}',
    '.bk-album-head{display:flex;gap:1rem;justify-content:space-between;align-items:flex-start}',
    '.bk-album p{margin:.3rem 0 .8rem;color:var(--muted,#5a6b72);font-size:.92rem}',
    '.bk-album-close{appearance:none;border:2px solid var(--accent,#0a86a6);background:transparent;color:var(--accent,#0a86a6);border-radius:10px;font:700 .95rem system-ui,sans-serif;padding:.35rem .8rem;cursor:pointer}',
    '.bk-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:.7rem;list-style:none;margin:0;padding:0}',
    '.bk-st{display:grid;gap:.25rem;justify-items:center;text-align:center;padding:.5rem .3rem;border-radius:12px;background:var(--surface2,#e8f0f2);border:2px dashed transparent;min-width:0}',
    '.bk-st svg{width:84px;height:80px;display:block;border-radius:10px;background:var(--paper,#fdf9f1)}',
    '.bk-st b{font-size:.85rem;line-height:1.2}',
    '.bk-st small{font-size:.74rem;color:var(--muted,#5a6b72);line-height:1.2}',
    '.bk-st.bk-locked{border-color:var(--line,#c9d6db);background:transparent}',
    '.bk-st.bk-locked svg{filter:grayscale(1) brightness(.5);opacity:.4}',
    '.bk-st-open .bk-mouthopen{opacity:1;transform:scaleY(1.2)}',
    '.bk-album.bk-wide{width:min(900px,100%)}',
    '.bk-ring{position:absolute;left:30%;top:20%;width:40%;pointer-events:none;animation:bk-ring .7s ease-out 1 forwards}',
    '@keyframes bk-ring{0%{opacity:0;transform:scale(.3)}25%{opacity:1}100%{opacity:0;transform:scale(1.7)}}',
    '.bk-albumopen .bk-wrap{z-index:2147483150}',
    '.bk-albumopen .bk-bubble{z-index:2147483151}',
    '.bk-albumopen .bk-conf{z-index:2147483152}',
    '.bk-st:not(.bk-locked){cursor:pointer}',
    '.bk-st:not(.bk-locked):hover{border-color:var(--accent,#0a86a6)}',
    '.bk-st:focus-visible{outline:3px solid var(--focus,#0a86a6);outline-offset:2px}',
    '.bk-st.bk-pop svg{animation:bk-stpop .6s cubic-bezier(.3,1.6,.5,1) 1}',
    '@keyframes bk-stpop{0%{transform:scale(1) rotate(0)}18%{transform:scale(1.28) rotate(-9deg)}38%{transform:scale(1.2) rotate(8deg)}58%{transform:scale(1.22) rotate(-5deg)}80%{transform:scale(1.06) rotate(2deg)}100%{transform:scale(1) rotate(0)}}',
    '.bk-st .bk-spark{position:absolute;pointer-events:none;width:16px;height:16px;color:#f2c230;animation:bk-stspark .9s ease-out 1 forwards}',
    '@keyframes bk-stspark{0%{opacity:0;transform:translate(0,0) scale(.3)}25%{opacity:1}100%{opacity:0;transform:translate(var(--sx),var(--sy)) scale(1.2) rotate(120deg)}}',
    '.bk-st{position:relative}',
    '.bk-say{margin:.2rem 0 .7rem;padding:.55rem .8rem;border-radius:12px;background:color-mix(in srgb,var(--accent,#0a86a6) 12%,var(--surface,#fff));border:2px solid var(--accent,#0a86a6);font-weight:700;display:none}',
    '.bk-say.bk-on{display:block;animation:bk-saypop .35s ease-out 1}',
    '.bk-say-go{display:inline-block;margin-left:.3rem;padding:.2rem .8rem;border-radius:999px;background:var(--accent,#0a86a6);color:#fff;text-decoration:none;font-weight:800;white-space:nowrap}',
    '.bk-say-go:hover{filter:brightness(1.1)}',
    '.bk-say-go:focus-visible{outline:3px solid var(--focus,#0a86a6);outline-offset:2px}',
    '@keyframes bk-saypop{0%{opacity:0;transform:translateY(-6px)}100%{opacity:1;transform:none}}',
    '@media (prefers-reduced-motion:reduce){.bk-st.bk-pop svg,.bk-st .bk-spark,.bk-say.bk-on{animation:none}}',
    '.bk-tabs{display:flex;gap:.4rem;margin:0 0 .9rem;flex-wrap:wrap}',
    '.bk-tab{appearance:none;border:2px solid var(--accent,#0a86a6);background:transparent;color:var(--accent,#0a86a6);border-radius:999px;font:700 .95rem var(--font-body,system-ui,sans-serif);padding:.35rem 1rem;cursor:pointer}',
    '.bk-tab[aria-selected="true"]{background:var(--accent,#0a86a6);color:#fff}',
    '.bk-tab:focus-visible,.bk-gcard:focus-visible,.bk-album-close:focus-visible{outline:3px solid var(--focus,#0a86a6);outline-offset:2px}',
    '.bk-scene{margin:0 0 1rem;border-radius:16px;overflow:hidden;background:linear-gradient(#fdf3da,#f6e3b8);border:2px solid var(--line,#c9d6db)}',
    '.bk-scene>svg{display:block;width:100%;height:auto}',
    '.bk-scenecap{margin:.4rem 0 0;font-size:.9rem;color:var(--muted,#5a6b72)}',
    '.bk-ggrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:.9rem;list-style:none;margin:0;padding:0}',
    '.bk-gcard{display:grid;gap:.5rem;padding:.7rem;border-radius:16px;background:var(--surface2,#e8f0f2);border:2px solid transparent;cursor:pointer;text-align:left;font:inherit;color:inherit;appearance:none;width:100%}',
    '.bk-gcard:hover{border-color:var(--accent,#0a86a6)}',
    '.bk-gpair{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}',
    '.bk-gpic{margin:0;display:grid;gap:.2rem;justify-items:center}',
    '.bk-gpic svg{display:block;width:100%;height:auto;border-radius:12px}',
    '.bk-gpic .bk-gwith{background:var(--paper,#fdf9f1)}',
    '.bk-gpic figcaption{font-size:.74rem;color:var(--muted,#5a6b72)}',
    '.bk-galone-bg{background:radial-gradient(circle at 50% 42%,#fffbe6 0%,#ffe9b0 55%,#f7cf86 100%);border-radius:12px;aspect-ratio:190/168;display:grid;place-items:center;width:100%}',
    '.bk-galone-bg svg{width:78%;height:auto;filter:drop-shadow(0 3px 3px rgba(80,50,10,.28))}',
    '.bk-gcard b{font:700 1.15rem/1.2 var(--font-display,system-ui,sans-serif)}',
    '.bk-gcard span{font-size:.9rem;color:var(--muted,#5a6b72)}',
    '.bk-gcard.bk-locked{background:transparent;border:2px dashed var(--line,#c9d6db);cursor:default}',
    '.bk-gcard.bk-locked svg{filter:grayscale(1) brightness(.5);opacity:.4}',
    '.bk-gcard.bk-locked .bk-galone-bg{background:var(--surface2,#e8f0f2)}',
    '.bk-gcard.bk-locked .bk-galone-bg svg{filter:grayscale(1) brightness(.4);opacity:.35}',
    '.bk-lbox{position:fixed;inset:0;z-index:2147483200;background:rgba(10,20,25,.8);display:grid;place-items:center;padding:12px;overflow:auto}',
    '.bk-lbox-in{width:min(760px,100%);background:var(--surface,#fff);color:var(--ink,#1b2b31);border:2px solid var(--accent,#0a86a6);border-radius:18px;padding:1rem 1.1rem;display:grid;gap:.7rem;font:400 16px/1.4 var(--font-body,system-ui,sans-serif)}',
    '.bk-lbox-in h3{margin:0;font:700 1.5rem/1.2 var(--font-display,system-ui,sans-serif)}',
    '.bk-lbox-in p{margin:0;color:var(--muted,#5a6b72)}',
    '.bk-lbox .bk-gpair{gap:.8rem}',
    '.bk-lbox .bk-gpic figcaption{font-size:.9rem}',
    /* Versteckte Katze */
    '.bk-hid{position:absolute;z-index:4;width:30px;height:17px;overflow:hidden;cursor:pointer;padding:0;border:0;background:none;-webkit-tap-highlight-color:transparent}',
    '.bk-hid::before{content:"";position:absolute;inset:-10px -8px -6px}',
    '.bk-hid svg{position:absolute;left:0;top:0;width:30px;height:30px;display:block}',
    '.bk-hid:focus-visible{outline:2px solid var(--focus,#0a86a6);outline-offset:3px}',
    '.bk-hid .bk-hidblink{transform-box:fill-box;transform-origin:50% 50%;animation:bk-hblink 5s ease-in-out infinite}',
    '@keyframes bk-hblink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}',
    '.bk-hid.bk-found{animation:bk-hfound .9s ease-out 1 forwards}',
    '@keyframes bk-hfound{0%{transform:translateY(0) scale(1)}30%{transform:translateY(-14px) scale(1.5)}100%{transform:translateY(-30px) scale(1.2);opacity:0}}',
    '.bk-reduced .bk-gift{animation:none}',
    '.bk-fx svg{overflow:visible}',
    '.bk-tray svg,.bk-carton svg,.bk-cuke svg,.bk-cup svg,.bk-sign svg{display:block;width:100%;height:auto}',
    /* Katzenklo */
    '.bk-tray{position:absolute;left:-2%;top:60%;width:104%;animation:bk-boxin .5s ease-out 1 backwards}',
    '.bk-sign{position:absolute;right:-14%;top:36%;width:38%;transform:rotate(8deg);animation:bk-signin .5s ease-out .2s 1 backwards}',
    '@keyframes bk-boxin{0%{opacity:0;transform:translateY(30px)}100%{opacity:1;transform:none}}',
    '@keyframes bk-signin{0%{opacity:0;transform:translateY(20px) rotate(8deg)}100%{opacity:1;transform:rotate(8deg)}}',
    '.bk-sand{background:#c9b27c}',
    '.bk-a-litter .bk-head{animation:bk-hunker 3.6s ease-in-out 1}',
    '.bk-a-litter .bk-eye{animation:bk-squint2 3.6s ease-in-out 1}',
    '.bk-a-litter .bk-pawL{animation:bk-scratch .3s ease-in-out 6 1.1s}',
    '.bk-a-litter .bk-pawR{animation:bk-scratch .3s ease-in-out 6 1.25s}',
    '@keyframes bk-hunker{0%,100%{transform:none}15%,55%{transform:translateY(9px) scale(.95)}70%{transform:translateY(-3px)}}',
    '@keyframes bk-squint2{0%,100%{transform:scaleY(1)}15%,55%{transform:scaleY(.35)}}',
    '@keyframes bk-scratch{0%,100%{transform:none}50%{transform:translate(-6px,-14px) rotate(-12deg)}}',
    /* Karton */
    '.bk-carton{position:absolute;left:-4%;top:56%;width:108%;animation:bk-boxin .5s ease-out 1 backwards}',
    '.bk-a-carton .bk-peek{animation:bk-wiggle .16s ease-in-out 6 1s}',
    '.bk-a-carton .bk-pupil{animation:bk-lookaround 1.2s ease-in-out 3 alternate}',
    /* Laserpunkt */
    '.bk-dot{position:absolute;width:9%;height:9%;border-radius:50%;background:#ff2d2d;box-shadow:0 0 12px 4px rgba(255,45,45,.55);animation:bk-dotrun 3.7s linear 1 forwards}',
    '@keyframes bk-dotrun{0%{left:90%;top:70%}15%{left:20%;top:55%}30%{left:75%;top:30%}45%{left:35%;top:10%}60%{left:85%;top:50%}75%{left:15%;top:35%}90%{left:55%;top:60%;opacity:1}100%{left:55%;top:60%;opacity:0}}',
    '.bk-a-laser .bk-pupil{animation:bk-zig 3.7s linear 1}',
    '@keyframes bk-zig{0%{transform:translate(5px,3px)}15%{transform:translate(-5px,1px)}30%{transform:translate(5px,-3px)}45%{transform:translate(-2px,-5px)}60%{transform:translate(5px,0)}75%{transform:translate(-5px,-2px)}90%{transform:translate(0,2px)}100%{transform:none}}',
    '.bk-a-laser .bk-pawR{animation:bk-swat .45s ease-in 3s 1}',
    /* Gurke */
    '.bk-cuke{position:absolute;left:6%;top:76%;width:46%;animation:bk-cukein 1.1s ease-out 1 backwards}',
    '@keyframes bk-cukein{0%{transform:translateX(170%)}100%{transform:none}}',
    '.bk-a-cuke .bk-svg{animation:bk-jump 1.1s ease-out 1.6s 1}',
    '.bk-a-cuke .bk-tail{animation:bk-puff 1.8s ease-in-out 1.6s 1}',
    '.bk-a-cuke .bk-pupil{animation:bk-shock 3.2s ease-in-out 1}',
    '@keyframes bk-jump{0%{transform:none}25%{transform:translateY(-28px) rotate(-7deg) scale(1.05)}100%{transform:none}}',
    '@keyframes bk-puff{0%,100%{transform:scale(1)}30%,70%{transform:scale(1.4)}}',
    '@keyframes bk-shock{0%{transform:translate(5px,4px)}48%{transform:translate(5px,4px)}56%{transform:scale(.6)}90%{transform:scale(.6)}100%{transform:none}}',
    /* Seifenblasen */
    '.bk-sb{position:absolute;width:13%;height:13%;border-radius:50%;border:2px solid rgba(124,196,240,.9);background:radial-gradient(circle at 30% 30%,rgba(255,255,255,.95),rgba(124,196,240,.15) 62%);opacity:0;animation:bk-sbfloat 2.4s ease-in-out 1 forwards}',
    '@keyframes bk-sbfloat{0%{opacity:0;transform:translate(0,0)}15%{opacity:1}80%{opacity:1;transform:translate(8px,-64px)}100%{opacity:0;transform:translate(8px,-72px) scale(1.5)}}',
    '.bk-a-soap .bk-pawR{animation:bk-swat .5s ease-in 1.2s 3}',
    /* Milchtritt */
    '.bk-a-knead .bk-pawL{animation:bk-knead .7s ease-in-out 5}',
    '.bk-a-knead .bk-pawR{animation:bk-knead .7s ease-in-out 5 .35s}',
    '.bk-a-knead .bk-eye{animation:bk-sleepy 3.8s ease-in-out 1}',
    '.bk-a-knead .bk-head{animation:bk-nuzzle .9s ease-in-out 4}',
    '@keyframes bk-knead{0%,100%{transform:none}50%{transform:translateY(-12px) scale(1.12,1.05)}}',
    '@keyframes bk-sleepy{0%,100%{transform:scaleY(1)}20%,80%{transform:scaleY(.3)}}',
    /* Sternschnuppe */
    '.bk-shoot{position:absolute;width:40%;height:3%;background:linear-gradient(90deg,transparent,#fff7c2,#f2c230);border-radius:3px;box-shadow:0 0 8px #f2c230;transform:rotate(30deg);opacity:0;animation:bk-shoot 1.5s ease-in 1 forwards}',
    '@keyframes bk-shoot{0%{opacity:0;left:92%;top:-14%}15%{opacity:1}100%{opacity:0;left:8%;top:24%}}',
    '.bk-a-wish .bk-pupil{animation:bk-lookup 3.7s ease-in-out 1}',
    '.bk-a-wish .bk-eye{animation:bk-doze2 3.7s ease-in-out 1}',
    '@keyframes bk-lookup{0%,50%{transform:translate(0,-5px)}70%,100%{transform:none}}',
    '@keyframes bk-doze2{0%,55%,100%{transform:scaleY(1)}65%,90%{transform:scaleY(.07)}}',
    /* Tasse */
    '.bk-bowl{position:absolute;left:22%;top:66%;width:56%;animation:bk-boxin .5s ease-out 1 backwards}',
    '.bk-bowl svg{display:block;width:100%;height:auto}',
    '.bk-a-eat .bk-head{animation:bk-eathead .5s ease-in-out 8}',
    '.bk-a-eat .bk-mouthopen{animation:bk-chew .5s ease-in-out 8}',
    '.bk-a-eat .bk-eye{animation:bk-squint 4s ease-in-out 1}',
    '@keyframes bk-eathead{0%,100%{transform:translateY(0)}45%{transform:translateY(11px) rotate(2deg)}}',
    '@keyframes bk-chew{0%,100%{opacity:0;transform:scaleY(.1)}40%,60%{opacity:1;transform:scaleY(.7)}}',
    '.bk-crumb{position:absolute;width:5%;aspect-ratio:1;border-radius:50%;background:#b9763a;pointer-events:none;animation:bk-crumb .8s ease-out 1 forwards}',
    '@keyframes bk-crumb{0%{opacity:1;transform:translate(0,0)}100%{opacity:0;transform:translate(var(--dx),24px)}}',
    '.bk-cup{position:absolute;left:62%;top:56%;width:26%;animation:bk-cupfall 3.4s ease-in 1 forwards}',
    '@keyframes bk-cupfall{0%,34%{transform:none}46%{transform:translateX(34%)}54%{transform:translateX(52%) rotate(8deg)}100%{transform:translate(90%,300%) rotate(150deg);opacity:0}}',
    '.bk-a-cup .bk-pawR{animation:bk-push .5s ease-in 1.1s 1}',
    '.bk-a-cup .bk-pupil{animation:bk-cuplook 4s ease-in-out 1}',
    '.bk-a-cup .bk-head{animation:bk-cuphead 4s ease-in-out 1}',
    '@keyframes bk-push{0%,100%{transform:none}45%{transform:translate(12px,-38px) rotate(24deg)}}',
    '@keyframes bk-cuplook{0%,55%{transform:translate(5px,3px)}70%,100%{transform:none}}',
    '@keyframes bk-cuphead{0%,65%{transform:none}78%,92%{transform:rotate(-11deg)}100%{transform:none}}',
    /* Konfetti */
    '.bk-conf{position:fixed;top:-14px;width:9px;height:14px;z-index:2147483050;pointer-events:none;animation:bk-fall 3.1s ease-in 1 forwards}',
    '@keyframes bk-fall{0%{transform:translate(0,0) rotate(0)}100%{transform:translate(var(--dx),108vh) rotate(var(--rot))}}'
  ].join('\n');

  /* ---------- Kätzchen als SVG ---------- */
  var FUR = '#f2a65a', FUR2 = '#d9822b', LIGHT = '#ffecd2', LINE = '#4a2e1a', PINK = '#f4a3b4';
  function pawSvg(cls, cx) {
    return '<g class="' + cls + '"><ellipse cx="' + cx + '" cy="170" rx="17" ry="14" fill="' + FUR + '" stroke="' + LINE + '" stroke-width="3"/>' +
      '<path d="M' + (cx - 5) + ' 176v-8M' + (cx + 5) + ' 176v-8" stroke="' + LINE + '" stroke-width="2.4" stroke-linecap="round" fill="none"/></g>';
  }
  var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
  var SPARK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 1l2.6 7.4L22 11l-7.4 2.6L12 21l-2.6-7.4L2 11l7.4-2.6z"/></svg>';
  var BUTTERFLY = '<svg viewBox="0 0 40 40" aria-hidden="true"><g class="bk-wing"><path d="M20 20C8 4 2 14 8 22c3 4 9 2 12-2z" fill="#7cc4f0" stroke="#2c6a96" stroke-width="1.6"/><path d="M20 20C32 4 38 14 32 22c-3 4-9 2-12-2z" fill="#f09ad0" stroke="#9a2c6a" stroke-width="1.6"/></g><path d="M20 12v16" stroke="#333" stroke-width="2.4" stroke-linecap="round"/></svg>';
  var YARN = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="#e8607a" stroke="#8a2a40" stroke-width="2"/><path d="M6 14c10 4 18 2 28-4M4 22c12 4 22 2 32-4M8 31c10 2 18 0 26-6M14 5c4 10 2 20-2 30" fill="none" stroke="#f9b0c0" stroke-width="2"/></svg>';
  var FISH = '<svg viewBox="0 0 60 36" aria-hidden="true"><path d="M4 18C16 4 36 4 46 18C36 32 16 32 4 18Z" fill="#6fb3d9" stroke="#2c5f80" stroke-width="2.4"/><path d="M46 18l12-12v24z" fill="#4a95c4" stroke="#2c5f80" stroke-width="2.4" stroke-linejoin="round"/><circle cx="14" cy="15" r="2.4" fill="#123"/><path d="M24 10q4 8 0 16" fill="none" stroke="#2c5f80" stroke-width="2"/></svg>';
  var TRAY = '<svg viewBox="0 0 120 56" aria-hidden="true"><path d="M2 14h116l-10 40H12Z" fill="#8cb8d6" stroke="#2c5f80" stroke-width="3" stroke-linejoin="round"/><path d="M8 16h104l-3 9H11Z" fill="#d9c28a"/><rect x="2" y="8" width="116" height="9" rx="4.5" fill="#a9cde6" stroke="#2c5f80" stroke-width="3"/></svg>';
  var SIGN = '<svg viewBox="0 0 60 44" aria-hidden="true"><rect x="3" y="3" width="54" height="24" rx="4" fill="#fff6dc" stroke="#7a4a22" stroke-width="2.4"/><text x="30" y="20" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="11" fill="#b3261e">BESETZT</text><path d="M30 27v15" stroke="#7a4a22" stroke-width="3" stroke-linecap="round"/></svg>';
  var CARTON = '<svg viewBox="0 0 120 60" aria-hidden="true"><path d="M6 20h108l-6 38H12Z" fill="#c89a5b" stroke="#6b4420" stroke-width="3" stroke-linejoin="round"/><path d="M40 32h40" stroke="#6b4420" stroke-width="3" stroke-linecap="round" opacity=".5"/><rect x="2" y="13" width="116" height="9" rx="3" fill="#d9ab6d" stroke="#6b4420" stroke-width="3"/></svg>';
  var CUKE = '<svg viewBox="0 0 70 24" aria-hidden="true"><ellipse cx="35" cy="12" rx="32" ry="9.5" fill="#4caf50" stroke="#1b5e20" stroke-width="2.4"/><path d="M12 8h5M26 15h5M42 8h5M54 15h5" stroke="#2e7d32" stroke-width="2" stroke-linecap="round"/><path d="M7 9q8-4 14-2" stroke="#a5d6a7" stroke-width="2" fill="none"/></svg>';
  var BOWL = '<svg viewBox="0 0 100 56" aria-hidden="true"><path d="M8 20h84c0 20-14 34-42 34S8 40 8 20Z" fill="#e05060" stroke="#7a2a3a" stroke-width="3" stroke-linejoin="round"/><ellipse cx="50" cy="20" rx="42" ry="9" fill="#c43c4e" stroke="#7a2a3a" stroke-width="3"/><g fill="#b9763a" stroke="#6b4420" stroke-width="1.6"><circle cx="26" cy="17" r="5"/><circle cx="38" cy="14" r="5"/><circle cx="52" cy="15" r="5"/><circle cx="65" cy="13" r="5"/><circle cx="76" cy="17" r="5"/><circle cx="46" cy="19" r="4.5"/><circle cx="60" cy="19" r="4.5"/></g><path d="M20 34q6 4 14 0M66 36q6 4 12 0" fill="none" stroke="#f7c8ce" stroke-width="2.6" stroke-linecap="round"/></svg>';
  var CUP = '<svg viewBox="0 0 44 46" aria-hidden="true"><path d="M6 10h24v22c0 6-5 10-12 10S6 38 6 32Z" fill="#fff" stroke="#4a2e1a" stroke-width="2.6" stroke-linejoin="round"/><path d="M30 16q11 2 11 10t-11 8" fill="none" stroke="#4a2e1a" stroke-width="2.6"/><path d="M6 17h24" stroke="#d93a3a" stroke-width="3"/><path d="M13 6q2-4 0-6M21 6q2-4 0-6" stroke="#9aa5ab" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
  var MOUSE = '<svg viewBox="0 0 60 36" aria-hidden="true"><ellipse cx="28" cy="22" rx="22" ry="12" fill="#b8c0c8" stroke="#4a5560" stroke-width="2.4"/><circle cx="46" cy="12" r="6.5" fill="#b8c0c8" stroke="#4a5560" stroke-width="2.4"/><circle cx="52" cy="22" r="2.4" fill="#f4a3b4"/><circle cx="41" cy="19" r="1.8" fill="#222"/><path d="M6 22c-6 0-8 6-2 8" fill="none" stroke="#4a5560" stroke-width="2.4" stroke-linecap="round"/></svg>';

  /* Die Freundin des Kätzchens: Luna (weißgrau, blaue Augen, rosa Schleife) */
  var LUNA = { '#f2a65a': '#e8e4dd', '#d9822b': '#a8a095', '#ffecd2': '#ffffff', '#7ec850': '#6fb3e0' };
  function recolorLuna(str) { Object.keys(LUNA).forEach(function (k) { str = str.split(k).join(LUNA[k]); }); return str; }
  var BOW = '<g class="bk-bow"><path d="M100 52L76 38Q71 52 76 66Z" fill="#ff6fa5" stroke="' + LINE + '" stroke-width="2.6" stroke-linejoin="round"/><path d="M100 52L124 38Q129 52 124 66Z" fill="#ff6fa5" stroke="' + LINE + '" stroke-width="2.6" stroke-linejoin="round"/><circle cx="100" cy="52" r="6.5" fill="#ff93bd" stroke="' + LINE + '" stroke-width="2.4"/></g>';
  function friendSvg() {
    var k = recolorLuna(kittenSvg()), i = k.lastIndexOf('</g></svg>');
    return k.slice(0, i) + BOW + k.slice(i);
  }

  /* Zubehör (nur eines ist sichtbar, gesteuert über data-acc) */
  var ACC =
    '<g class="bk-acc bk-acc-xmas"><path d="M62 54C70 30 100 12 124 8C122 24 134 40 140 54Z" fill="#d93a3a" stroke="' + LINE + '" stroke-width="3" stroke-linejoin="round"/>' +
    '<ellipse cx="101" cy="54" rx="45" ry="8" fill="#fff" stroke="' + LINE + '" stroke-width="3"/><circle cx="126" cy="8" r="8" fill="#fff" stroke="' + LINE + '" stroke-width="3"/></g>' +
    '<g class="bk-acc bk-acc-halloween"><ellipse cx="100" cy="40" rx="34" ry="24" fill="#f08a1c" stroke="' + LINE + '" stroke-width="3"/>' +
    '<path d="M100 17q-12 24 0 46M80 21q-14 20-2 36M120 21q14 20 2 36" fill="none" stroke="#c4650a" stroke-width="2.5"/>' +
    '<path d="M98 17q0-12 10-14" fill="none" stroke="#4a7a2a" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M86 40l6-8 6 8zM104 40l6-8 6 8z" fill="#2b1a10"/><path d="M88 51l6-5 6 5 6-5 6 5" fill="none" stroke="#2b1a10" stroke-width="3" stroke-linejoin="round"/></g>' +
    '<g class="bk-acc bk-acc-ostern"><path d="M62 58Q100 40 138 58" fill="none" stroke="#4a8a3a" stroke-width="4"/>' +
    [[60,60,'#f48fb1'],[72,53,'#fff176'],[86,48,'#ffffff'],[100,46,'#ce93d8'],[114,48,'#f48fb1'],[128,53,'#fff176'],[140,60,'#ffffff']].map(function (f) {
      return '<circle cx="' + f[0] + '" cy="' + f[1] + '" r="7" fill="' + f[2] + '" stroke="' + LINE + '" stroke-width="2"/><circle cx="' + f[0] + '" cy="' + f[1] + '" r="2.4" fill="#f2b705"/>';
    }).join('') + '</g>' +
    '<g class="bk-acc bk-acc-sommer"><rect x="54" y="82" width="42" height="28" rx="12" fill="#1b2b33" stroke="' + LINE + '" stroke-width="2.5"/>' +
    '<rect x="104" y="82" width="42" height="28" rx="12" fill="#1b2b33" stroke="' + LINE + '" stroke-width="2.5"/><path d="M96 92h8" stroke="' + LINE + '" stroke-width="3"/>' +
    '<path d="M62 90l9-2M112 90l9-2" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/></g>' +
    '<g class="bk-acc bk-acc-silvester" transform="rotate(10 100 50)"><path d="M78 54L106 -8L128 54Z" fill="#7b5cff" stroke="' + LINE + '" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M88 36h32M95 20h19" stroke="#ffd23f" stroke-width="5" stroke-linecap="round"/><circle cx="106" cy="-8" r="7" fill="#ffd23f" stroke="' + LINE + '" stroke-width="2.5"/></g>';

  function kittenSvg() {
    return '<svg class="bk-svg" viewBox="0 0 200 200" aria-hidden="true" focusable="false">' +
      '<g class="bk-tail"><path d="M150 178C192 176 200 128 172 104" fill="none" stroke="' + LINE + '" stroke-width="19" stroke-linecap="round"/>' +
      '<path d="M150 178C192 176 200 128 172 104" fill="none" stroke="' + FUR + '" stroke-width="13" stroke-linecap="round"/>' +
      '<path d="M182 134l9 3M188 150l9-2" stroke="' + FUR2 + '" stroke-width="4" stroke-linecap="round"/></g>' +
      '<ellipse cx="100" cy="190" rx="60" ry="50" fill="' + FUR + '" stroke="' + LINE + '" stroke-width="3"/>' +
      '<ellipse cx="100" cy="196" rx="30" ry="34" fill="' + LIGHT + '"/>' +
      '<path d="M52 170l12 6M148 170l-12 6M60 188l12 3M140 188l-12 3" stroke="' + FUR2 + '" stroke-width="4" stroke-linecap="round"/>' +
      pawSvg('bk-pawL', 70) + pawSvg('bk-pawR', 130) +
      '<g class="bk-head">' +
      '<g class="bk-earL"><path d="M50 74L44 18l46 34z" fill="' + FUR + '" stroke="' + LINE + '" stroke-width="3" stroke-linejoin="round"/><path d="M54 62l-3-26 25 19z" fill="' + PINK + '"/></g>' +
      '<g class="bk-earR"><path d="M150 74l6-56-46 34z" fill="' + FUR + '" stroke="' + LINE + '" stroke-width="3" stroke-linejoin="round"/><path d="M146 62l3-26-25 19z" fill="' + PINK + '"/></g>' +
      '<ellipse cx="100" cy="96" rx="58" ry="50" fill="' + FUR + '" stroke="' + LINE + '" stroke-width="3"/>' +
      '<path d="M100 48v14M86 51l3 12M114 51l-3 12" stroke="' + FUR2 + '" stroke-width="4.5" stroke-linecap="round"/>' +
      '<path d="M44 96l10 2M46 108l10-2M156 96l-10 2M154 108l-10-2" stroke="' + FUR2 + '" stroke-width="4" stroke-linecap="round"/>' +
      '<circle cx="64" cy="112" r="9" fill="' + PINK + '" opacity=".55"/><circle cx="136" cy="112" r="9" fill="' + PINK + '" opacity=".55"/>' +
      '<ellipse cx="100" cy="114" rx="22" ry="15" fill="' + LIGHT + '"/>' +
      eye(76) + eye(124) +
      '<g class="bk-happyeyes" fill="none" stroke="' + LINE + '" stroke-width="4.5" stroke-linecap="round"><path d="M64 98q12-14 24 0"/><path d="M112 98q12-14 24 0"/></g>' +
      '<path d="M94 104h12l-6 7z" fill="' + PINK + '" stroke="' + LINE + '" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M100 111v5M100 116q-6 7-13 2M100 116q6 7 13 2" fill="none" stroke="' + LINE + '" stroke-width="2.6" stroke-linecap="round"/>' +
      '<ellipse class="bk-mouthopen" cx="100" cy="122" rx="10" ry="9" fill="#7a2a3a" stroke="' + LINE + '" stroke-width="2"/>' +
      '<ellipse class="bk-tongue" cx="107" cy="124" rx="5" ry="6" fill="' + PINK + '" stroke="' + LINE + '" stroke-width="1.6"/>' +
      '<path d="M40 112l-24-6M40 118l-24 4M160 112l24-6M160 118l24 4" stroke="' + LINE + '" stroke-width="1.8" stroke-linecap="round" opacity=".75"/>' +
      ACC +
      '</g></svg>';
  }
  function eye(cx) {
    return '<g class="bk-eye"><ellipse cx="' + cx + '" cy="96" rx="12" ry="14" fill="#fff" stroke="' + LINE + '" stroke-width="2"/>' +
      '<g class="bk-look"><g class="bk-pupil"><ellipse cx="' + cx + '" cy="98" rx="9" ry="11" fill="#7ec850"/>' +
      '<ellipse cx="' + cx + '" cy="98" rx="6.2" ry="8.6" fill="#1d1410"/>' +
      '<circle cx="' + (cx - 3) + '" cy="93" r="3.1" fill="#fff"/><circle cx="' + (cx + 3) + '" cy="102" r="1.5" fill="#fff"/></g></g></g>';
  }

  /* ---------- Töne (Web Audio, nur nach Klick) ---------- */
  var actx = null;
  function audio() {
    if (!CFG.sound || mem.mute) return null;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!actx) actx = new AC();
      if (actx.state === 'suspended') actx.resume();
      return actx;
    } catch (e) { return null; }
  }
  function meow(pitch) {
    var c = audio(); if (!c) return;
    var t = c.currentTime, p = pitch || 1;
    var o = c.createOscillator(), f = c.createBiquadFilter(), f2 = c.createBiquadFilter(), g = c.createGain();
    var lfo = c.createOscillator(), lg = c.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(380 * p, t);
    o.frequency.linearRampToValueAtTime(760 * p, t + 0.17);
    o.frequency.exponentialRampToValueAtTime(470 * p, t + 0.62);
    lfo.frequency.value = 6.5; lg.gain.value = 9 * p;
    lfo.connect(lg); lg.connect(o.frequency);
    f.type = 'bandpass'; f.Q.value = 3.5;
    f.frequency.setValueAtTime(900, t); f.frequency.linearRampToValueAtTime(1900, t + 0.2); f.frequency.linearRampToValueAtTime(1000, t + 0.62);
    f2.type = 'lowpass'; f2.frequency.value = 3600;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.32, t + 0.05);
    g.gain.setValueAtTime(0.28, t + 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.68);
    o.connect(f); f.connect(f2); f2.connect(g); g.connect(c.destination);
    o.start(t); lfo.start(t); o.stop(t + 0.72); lfo.stop(t + 0.72);
  }
  /* Treffer beim Zoomies: helle Tonfolge, bei großem Treffer länger */
  function hitSound(big) {
    var c = audio(); if (!c) return;
    var t = c.currentTime, notes = big ? [659, 784, 988, 1319, 1568] : [988, 1319];
    notes.forEach(function (f, i) {
      var o = c.createOscillator(), g = c.createGain(), s = t + i * (big ? 0.09 : 0.07);
      o.type = 'square'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, s); g.gain.linearRampToValueAtTime(0.07, s + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, s + (big ? 0.2 : 0.14));
      o.connect(g); g.connect(c.destination); o.start(s); o.stop(s + 0.22);
    });
  }
  function munch() {
    var c = audio(); if (!c) return;
    var t = c.currentTime, len = Math.floor(c.sampleRate * 0.06), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var n = c.createBufferSource(); n.buffer = buf;
    var f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.8;
    var g = c.createGain(); g.gain.value = 0.28;
    n.connect(f); f.connect(g); g.connect(c.destination); n.start(t);
  }
  function trill() {
    var c = audio(); if (!c) return;
    var t = c.currentTime;
    var o = c.createOscillator(), g = c.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(520, t); o.frequency.linearRampToValueAtTime(900, t + 0.12); o.frequency.linearRampToValueAtTime(700, t + 0.22);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.3);
  }
  function purr(seconds) {
    var c = audio(); if (!c) return;
    var t = c.currentTime, d = seconds || 2.4;
    var len = Math.floor(c.sampleRate * d), buf = c.createBuffer(1, len, c.sampleRate), data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    var n = c.createBufferSource(); n.buffer = buf;
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380;
    var am = c.createGain(); am.gain.value = 0.5;
    var lfo = c.createOscillator(); lfo.frequency.value = 25; lfo.type = 'sawtooth';
    var lg = c.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(am.gain);
    var out = c.createGain();
    out.gain.setValueAtTime(0.0001, t); out.gain.linearRampToValueAtTime(0.55, t + 0.5);
    out.gain.setValueAtTime(0.55, t + d - 0.7); out.gain.linearRampToValueAtTime(0.0001, t + d);
    n.connect(lp); lp.connect(am); am.connect(out); out.connect(c.destination);
    n.start(t); lfo.start(t); n.stop(t + d); lfo.stop(t + d);
  }

  /* ---------- Aufbau ---------- */
  var wrap, peek, fx, bubble, svgEl;
  var side = 'bottom', tok = 0, busy = false, visible = false, petCount = 0, lastPet = 0, timer = 0;
  var userBusy = false, lastActivity = Date.now(), streak = 0;
  var SIDE_ROT = { bottom: 0, left: 90, top: 180, right: -90 };

  function build() {
    var st = document.createElement('style'); st.id = 'bk-style'; st.textContent = CSS; document.head.appendChild(st);
    wrap = document.createElement('button');
    wrap.type = 'button';
    wrap.className = 'bk-wrap' + (reduced ? ' bk-reduced' : '');
    wrap.setAttribute('aria-label', 'Kätzchen streicheln');
    wrap.tabIndex = -1;
    peek = document.createElement('div'); peek.className = 'bk-peek';
    peek.innerHTML = kittenSvg();
    fx = document.createElement('div'); fx.className = 'bk-fx';
    peek.appendChild(fx);
    wrap.appendChild(peek);
    document.body.appendChild(wrap);
    svgEl = peek.querySelector('.bk-svg');
    bubble = document.createElement('div'); bubble.className = 'bk-bubble'; bubble.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bubble);
    wrap.addEventListener('click', onPet);
    /* Zoomies: schon beim Drücken zählen (ein Klick geht verloren, wenn das Kätzchen zwischen Drücken und Loslassen springt) */
    wrap.addEventListener('pointerdown', function (e) { if (zoomOn) { e.stopPropagation(); zoomTap(); } });
  }
  var fwrap = null, fpeek = null, friendOn = false;
  function ensureFriend() {
    if (fwrap) return;
    fwrap = document.createElement('div');
    fwrap.className = 'bk-wrap bk-friend' + (reduced ? ' bk-reduced' : '');
    fwrap.setAttribute('aria-hidden', 'true');
    fpeek = document.createElement('div'); fpeek.className = 'bk-peek';
    fpeek.innerHTML = friendSvg();
    fwrap.appendChild(fpeek);
    document.body.appendChild(fwrap);
  }
  function hideFriend() {
    friendOn = false;
    if (!fwrap) return;
    fwrap.classList.remove('bk-on', 'bk-happy');
    fpeek.className = 'bk-peek';
  }
  function placeFriend(s, x, y, W, vw, vh) {
    ensureFriend();
    var off = W * 0.92, fx0 = x, fy0 = y;
    if (s === 'bottom' || s === 'top') fx0 = x + (x + off + W / 2 < vw - 12 ? off : -off);
    else fy0 = y + (y + off + W / 2 < vh - 80 ? off : -off);
    fwrap.style.width = W + 'px'; fwrap.style.height = W + 'px';
    fwrap.style.left = fx0 + 'px'; fwrap.style.top = fy0 + 'px';
    fwrap.style.transform = 'translate(-50%,-50%) rotate(' + SIDE_ROT[s] + 'deg)';
    fwrap.style.setProperty('--bk-sneak', '50%'); fwrap.style.setProperty('--bk-up', '17%');
    fpeek.className = 'bk-peek';
    fwrap.classList.add('bk-on');
    friendOn = true;
  }

  function size() { return window.innerWidth <= 520 ? 108 : 138; }

  function place(s, keepAcc, withFriend) {
    side = s;
    var W = size(), vw = window.innerWidth, vh = window.innerHeight, m = 24;
    wrap.style.width = W + 'px'; wrap.style.height = W + 'px';
    var x, y;
    if (s === 'bottom' || s === 'top') {
      x = rnd(m + W / 2, Math.max(m + W / 2 + 1, vw - m - W / 2));
      y = s === 'bottom' ? vh - W / 2 : W / 2;
    } else {
      y = rnd(80 + W / 2, Math.max(80 + W / 2 + 1, vh - 80 - W / 2));
      x = s === 'left' ? W / 2 : vw - W / 2;
    }
    wrap.style.left = x + 'px'; wrap.style.top = y + 'px';
    wrap.style.transform = 'translate(-50%,-50%) rotate(' + SIDE_ROT[s] + 'deg)';
    wrap.style.setProperty('--bk-sneak', '50%');
    wrap.style.setProperty('--bk-up', '17%');
    if (!keepAcc) setAcc();
    if (withFriend) {
      placeFriend(s, x, y, W, vw, vh);
      if (curAcc) fwrap.setAttribute('data-acc', curAcc); else fwrap.removeAttribute('data-acc');
    } else hideFriend();
  }

  function sleep(ms, t) {
    return new Promise(function (res) { setTimeout(function () { res(t === tok); }, ms); });
  }
  function stage(name) {
    peek.classList.remove('bk-sneak', 'bk-up', 'bk-pop', 'bk-out');
    if (name) peek.classList.add('bk-' + name);
    if (friendOn && fpeek) {
      setTimeout(function () {
        if (!friendOn) return;
        fpeek.classList.remove('bk-sneak', 'bk-up', 'bk-pop', 'bk-out');
        if (name) fpeek.classList.add('bk-' + name);
      }, 180);
    }
  }
  function clearActions() {
    peek.className = peek.className.replace(/\bbk-a-\S+/g, '').replace(/\s+/g, ' ');
    wrap.classList.remove('bk-happy', 'bk-looking');
    fx.innerHTML = '';
  }
  function act(name) { clearActions(); void peek.offsetWidth; peek.classList.add('bk-a-' + name); }
  function addFx(html, cls, style, life) {
    var d = document.createElement('div'); d.className = cls; d.innerHTML = html || ''; if (style) d.setAttribute('style', style);
    fx.appendChild(d); if (life) setTimeout(function () { d.remove(); }, life); return d;
  }
  function hearts(n) {
    for (var i = 0; i < n; i++) {
      (function (i) {
        setTimeout(function () {
          addFx(HEART, 'bk-heart', 'left:' + rnd(30, 62) + '%;top:' + rnd(0, 22) + '%;--dx:' + Math.round(rnd(-26, 26)) + 'px', 1800);
        }, i * 230);
      })(i);
    }
  }
  function sparks(n) {
    for (var i = 0; i < n; i++) addFx(SPARK, 'bk-spark', 'left:' + rnd(10, 78) + '%;top:' + rnd(-6, 30) + '%;--dx:' + Math.round(rnd(-30, 30)) + 'px;animation-delay:' + (i * 0.12) + 's', 1800);
  }

  function showBubble(text, ms) {
    if (!text) return;
    bubble.textContent = text;
    bubble.style.left = '0px'; bubble.style.top = '0px';
    bubble.classList.remove('bk-show');
    var r = svgEl.getBoundingClientRect(), bw = bubble.offsetWidth, bh = bubble.offsetHeight, vw = window.innerWidth, vh = window.innerHeight, x, y;
    if (side === 'bottom') { x = r.left + r.width / 2 - bw / 2; y = r.top - bh - 6; }
    else if (side === 'top') { x = r.left + r.width / 2 - bw / 2; y = r.bottom + 6; }
    else if (side === 'left') { x = r.right + 8; y = r.top + r.height / 2 - bh / 2; }
    else { x = r.left - bw - 8; y = r.top + r.height / 2 - bh / 2; }
    x = Math.max(8, Math.min(vw - bw - 8, x)); y = Math.max(8, Math.min(vh - bh - 8, y));
    bubble.style.left = x + 'px'; bubble.style.top = y + 'px';
    void bubble.offsetWidth;
    bubble.classList.add('bk-show');
    clearTimeout(showBubble.t);
    showBubble.t = setTimeout(hideBubble, ms || (1900 + text.length * 55));
  }
  function hideBubble() { bubble.classList.remove('bk-show'); }

  function note(name) { unlock('a:' + name); }
  function announce() { document.dispatchEvent(new CustomEvent('bk:update', { detail: api.stats() })); }

  /* ---------- Aktionen ---------- */
  var ACTIONS = {
    wave: { ms: 2400, phrases: ['Hallo, Du! Schön, dass Du da bist.', 'Huhu! Schön, dass Du hier bist.'] },
    tail: { ms: 3000, phrases: ['Ich wedle Dir Glück zu!'] },
    kiss: { ms: 2600, phrases: ['Ein langsames Blinzeln heißt: ich mag Dich.'], run: function (t) { setTimeout(function () { if (t === tok) hearts(3); }, 1000); } },
    yawn: { ms: 2600, phrases: ['Huaaah… Kurze Pause gefällig?', 'Gähn… Du hast bestimmt schon viel geschafft.'] },
    ear: { ms: 2000, phrases: ['Ich höre, wie Du nachdenkst.'] },
    wash: { ms: 3000, phrases: ['Kurz Pfötchen putzen. Gleich geht es weiter!'] },
    tilt: { ms: 2800, phrases: ['Hmm? Das sieht interessant aus!', 'Was haben wir denn da?'], run: function () { addFx('?', 'bk-q', '', 1900); } },
    butterfly: { ms: 4200, phrases: ['Ein Schmetterling! Den kriege ich!'], run: function () { addFx(BUTTERFLY, 'bk-butterfly', '', 4000); } },
    yarn: { ms: 4400, phrases: ['Wollknäuel! Das ist meins.'], run: function () { addFx(YARN, 'bk-yarn', '', 4200); } },
    sleep: { ms: 3600, phrases: ['Huch! Ich bin kurz eingenickt.'],
      run: function (t) {
        var n = 0;
        var iv = setInterval(function () {
          if (t !== tok || n++ > 3) return clearInterval(iv);
          addFx('Z', 'bk-zzz', n % 2 ? '' : 'left:70%;top:14%', 2300);
        }, 750);
      } },
    mouse: { ms: 3600, phrases: ['Eine Maus! Ich bleibe ganz leise…'], run: function () { addFx(MOUSE, 'bk-mouse', '', 3500); } },
    knock: { ms: 2400, phrases: ['Hallo? Ist da jemand?', 'Klopf, klopf!'],
      run: function (t) { [250, 750, 1250].forEach(function (d) { setTimeout(function () { if (t === tok) addFx('', 'bk-ring', '', 800); }, d); }); } },
    peekaboo: { ms: 3200, phrases: ['Kuckuck!'], custom: true },
    sneeze: { ms: 2000, phrases: ['Hatschi!', 'Hatschi! Der Staub…'],
      run: function (t) {
        setTimeout(function () {
          if (t !== tok) return;
          for (var i = 0; i < 7; i++) addFx('', 'bk-dust', '--dx:' + Math.round(rnd(-48, 48)) + 'px;--dy:' + Math.round(rnd(-70, -20)) + 'px;left:' + rnd(42, 56) + '%', 900);
        }, 780);
      } },
    stretch: { ms: 2600, phrases: ['Strecken tut gut. Probier es auch!', 'Aaah, strecken!'] },
    litter: { ms: 4600, script: function (t) {
      addFx(TRAY, 'bk-tray', '', 4800); addFx(SIGN, 'bk-sign', '', 4800);
      showBubble('Psst… Bitte nicht stören!', 2300);
      [1200, 1500, 1800, 2100, 2400].forEach(function (d) {
        setTimeout(function () {
          if (t !== tok) return;
          for (var i = 0; i < 3; i++) addFx('', 'bk-dust bk-sand', '--dx:' + Math.round(rnd(-42, 42)) + 'px;--dy:' + Math.round(rnd(-54, -12)) + 'px;left:' + Math.round(rnd(28, 72)) + '%;top:62%', 900);
        }, d);
      });
      setTimeout(function () { if (t === tok) showBubble('Fertig! Alles wieder zugedeckt.', 2300); }, 3000);
    } },
    carton: { ms: 3600, phrases: ['Wenn ich passe, dann sitze ich.', 'Ein Karton! Das ist mein Reich.'], run: function () { addFx(CARTON, 'bk-carton', '', 3800); } },
    laser: { ms: 4300, phrases: ['Der rote Punkt! Wo ist er hin?!'], run: function () { addFx('', 'bk-dot', '', 4000); } },
    cuke: { ms: 3500, phrases: ['Huch! Eine Gurke?!'], run: function () { addFx(CUKE, 'bk-cuke', '', 3500); } },
    soap: { ms: 4300, phrases: ['Seifenblasen! Plopp!'],
      run: function () { for (var i = 0; i < 5; i++) addFx('', 'bk-sb', 'left:' + Math.round(rnd(8, 76)) + '%;top:' + Math.round(rnd(40, 70)) + '%;animation-delay:' + (i * 0.45) + 's', 4400); } },
    knead: { ms: 4000, phrases: ['Ich backe Brot. Mit den Pfoten.', 'Tret, tret… Gleich ist der Teig fertig.'], run: function (t) { setTimeout(function () { if (t === tok) hearts(3); }, 1200); } },
    wish: { ms: 3700, phrases: ['Eine Sternschnuppe! Ich wünsche mir, dass Du alles schaffst.'],
      run: function (t) { addFx('', 'bk-shoot', '', 1700); setTimeout(function () { if (t === tok) sparks(4); }, 1500); } },
    eat: { ms: 4600, phrases: ['Mmmh, lecker! Nom nom nom.', 'Futterzeit! Ein bisschen Pause tut auch Dir gut.', 'Knusper, knusper. Gleich bin ich wieder fit!'],
      run: function (t) {
        addFx(BOWL, 'bk-bowl', '', 4600);
        for (var i = 0; i < 8; i++) (function (i) {
          setTimeout(function () { if (t === tok) { munch(); addFx('', 'bk-crumb', 'left:' + Math.round(rnd(34, 62)) + '%;top:' + Math.round(rnd(62, 74)) + '%;--dx:' + Math.round(rnd(-22, 22)) + 'px', 900); } }, 500 + i * 500);
        })(i);
        setTimeout(function () { if (t === tok) hearts(2); }, 4200);
      } },
    cup: { ms: 4000, script: function (t) {
      addFx(CUP, 'bk-cup', '', 3500);
      setTimeout(function () { if (t === tok) showBubble('Ups.', 1500); }, 2100);
      setTimeout(function () { if (t === tok) showBubble('War ich nicht.', 1900); }, 3200);
    } }
  };
  var BASEW = { eat: 0.9, cuke: 0.5, wish: 0.6, cup: 0.7, litter: 0.8 };
  var NAMES = Object.keys(ACTIONS);
  var FRIEND_SAY = ['Das ist Luna, meine Freundin!', 'Luna passt heute mit auf. Zu zweit macht Lernen mehr Spaß!', 'Luna sagt: Du schaffst das!', 'Wir beide glauben an Dich!', 'Luna kommt gern zu Besuch, wenn Du fleißig bist.']; 
  var REDUCED_OK = ['kiss', 'tilt', 'ear', 'wave', 'tail'];

  /* Tageszeit: abends gähnt und schläft das Kätzchen öfter, morgens streckt es sich. */
  function dayPart() {
    var h = new Date().getHours();
    return h >= 5 && h < 10 ? 'morgen' : h < 13 ? (h >= 10 ? 'mittag' : 'nacht') : h < 18 ? 'nachmittag' : h < 22 ? 'abend' : 'nacht';
  }
  var TIMEPH = {
    morgen: ['Guten Morgen! Ein neuer Tag voller Rätsel.', 'Guten Morgen! Schon wach?'],
    mittag: ['Mahlzeit! Schon etwas gegessen?', 'Mittagszeit! Auch ein Kätzchen braucht Pause.'],
    nachmittag: ['Na, wie läuft der Nachmittag?', 'Zeit für einen Schluck Wasser?'],
    abend: ['Zeit für eine Pause? Du hast schon viel geschafft.', 'Schon Abend! Du bist fleißig.', 'Gähn… Gleich ist Schlafenszeit.'],
    nacht: ['Es ist schon spät. Gönn Dir bald eine Pause!', 'Gähn… Ich bin auch müde. Morgen geht es weiter!']
  };
  var TIMEW = {
    morgen: { stretch: 4, wash: 2, wave: 2 },
    mittag: {},
    nachmittag: {},
    abend: { yawn: 5, sleep: 3, stretch: 1 },
    nacht: { yawn: 6, sleep: 5 }
  };
  function pickAction(list) {
    var w = TIMEW[dayPart()] || {}, total = 0, i;
    var ws = list.map(function (n) { var x = (w[n] || 1) * (BASEW[n] || 1); total += x; return x; });
    var r = Math.random() * total;
    for (i = 0; i < list.length; i++) { r -= ws[i]; if (r <= 0) return list[i]; }
    return list[0];
  }

  /* Zubehör nach Jahreszeit; manchmal bewusst zur falschen Zeit. */
  var SEASON = {
    xmas: function (m, d) { return m === 12 || (m === 1 && d <= 6); },
    silvester: function (m, d) { return (m === 12 && d >= 27) || (m === 1 && d <= 2); },
    halloween: function (m, d) { return (m === 10 && d >= 18) || (m === 11 && d <= 2); },
    ostern: function (m, d) { return (m === 3 && d >= 15) || (m === 4 && d <= 25); },
    sommer: function (m) { return m >= 6 && m <= 8; }
  };
  var ACC_NAME = { xmas: 'Weihnachtsmütze', silvester: 'Partyhut', halloween: 'Kürbishut', ostern: 'Blumenkranz', sommer: 'Sonnenbrille' };
  var ACC_LATE = {
    xmas: ['Ho ho ho! Für eine Mütze ist es nie zu früh.', 'Ja, ich weiß: Weihnachten ist noch weit. Die Mütze steht mir trotzdem.'],
    silvester: ['Prosit! Ich feiere einfach schon mal.', 'Jeder Tag ist ein guter Tag für einen Partyhut!'],
    halloween: ['Buh! Nur ein Kürbis auf meinem Kopf.', 'Kürbis-Saison? Bei mir immer!'],
    ostern: ['Blumen im Haar. Irgendwo ist immer Frühling!', 'Frühlingsgefühle, mitten im Jahr.'],
    sommer: ['Coole Brille, oder? Irgendwo scheint immer die Sonne.', 'Bereit für den Sommer, auch wenn es draußen anders aussieht.']
  };
  var curAcc = null, accLate = false, forceAcc = null;
  function setAcc() {
    var d = new Date(), m = d.getMonth() + 1, day = d.getDate(), keys = Object.keys(SEASON);
    var inS = keys.filter(function (k) { return SEASON[k](m, day); });
    var out = keys.filter(function (k) { return inS.indexOf(k) < 0; });
    curAcc = null; accLate = false;
    if (forceAcc) { curAcc = forceAcc; forceAcc = null; wrap.setAttribute('data-acc', curAcc); return; }
    if (inS.length && Math.random() < 0.8) curAcc = pick(inS);
    else if (Math.random() < 0.2) { curAcc = pick(out); accLate = true; }
    if (curAcc) wrap.setAttribute('data-acc', curAcc); else wrap.removeAttribute('data-acc');
  }
  /* Hut-Sticker gibt es nur, wenn das Kätzchen den Hut wirklich in Ruhe zeigt (nicht beim Zoomies-Flitzen). */
  function seenAcc() { if (curAcc) unlock('h:' + curAcc); }

  function textFor(name, kind) {
    var a = ACTIONS[name], r = Math.random();
    if (kind === 'hard') return nm(pick(HARD));
    if (curAcc && accLate && r < 0.7) return pick(ACC_LATE[curAcc]);
    if (r < 0.3) return null;
    if (r < 0.45) return pick(TIMEPH[dayPart()]);
    if (r < 0.55 && a && a.phrases) return pick(a.phrases);
    return r < 0.9 ? nm(pick(ENCOURAGE)) : pick(FUN);
  }

  /* ---------- Besuch ---------- */
  async function visit(o) {
    o = o || {};
    if (!wrap) return false;
    var t = ++tok;
    busy = true; visible = true;
    clearTimeout(timer);
    var s = o.side || pick(['bottom', 'bottom', 'left', 'right', 'top']);
    var withFriend = !!(mem.friend && (o.friend || Math.random() < 0.3));
    var name = o.action && ACTIONS[o.action] ? o.action : pickAction(reduced ? REDUCED_OK : NAMES);
    T('k.v', name, s, withFriend ? 1 : 0, o.kind || (o.text ? 'text' : ''));
    var a = ACTIONS[name];
    hideBubble(); clearActions();
    stage(null); peek.classList.add('bk-out'); peek.style.transition = 'none'; void peek.offsetWidth; peek.style.transition = '';
    peek.classList.remove('bk-out');
    place(s, false, withFriend);
    wrap.classList.add('bk-on', 'bk-live');
    wrap.tabIndex = 0;
    await sleep(60, t); if (t !== tok) return;
    stage('sneak'); wrap.classList.add('bk-looking');
    if (!await sleep(rnd(900, 1500), t)) return;
    wrap.classList.remove('bk-looking');
    stage('up');
    if (!await sleep(500, t)) return;
    seenAcc();
    if (a.custom && name === 'peekaboo') {
      stage('out'); if (!await sleep(650, t)) return;
      stage('sneak'); if (!await sleep(500, t)) return;
      stage('up'); if (!await sleep(450, t)) return;
      note(name); showBubble(o.text || 'Kuckuck!'); if (!await sleep(1900, t)) return;
    } else {
      act(name); note(name);
      if (a.run) a.run(t);
      if (a.script) a.script(t);
      var text = o.text || (a.script ? null : (withFriend && Math.random() < 0.6 ? pick(FRIEND_SAY) : textFor(name, o.kind)));
      if (withFriend && Math.random() < 0.5) setTimeout(function () { if (t === tok) hearts(2); }, 1500);
      if (text) setTimeout(function () { if (t === tok) showBubble(text); }, Math.min(700, a.ms / 3));
      if (!await sleep(a.ms + (text ? 700 : 0), t)) return;
    }
    await leave(t);
    return true;
  }
  async function leave(t) {
    hideBubble();
    clearActions(); wrap.classList.remove('bk-live');
    stage('out');
    if (!await sleep(550, t)) return;
    wrap.classList.remove('bk-on'); wrap.tabIndex = -1;
    hideFriend();
    busy = false; visible = false;
    schedule();
  }

  /* ---------- Streicheln ---------- */
  var zoomOn = false, zoomCan = false, zoomHitDone = false, zoomHits = 0, zoomIdx = 0, zoomT0 = 0;
  /* Jeder Tipp auf das Kätzchen während der Zoomies wird protokolliert: k.zc <Auftritt> <ms seit Erscheinen> <hit|again|intro|late> */
  function zoomTap() {
    var st = zoomHitDone ? 'again' : (zoomCan ? 'hit' : (zoomIdx ? 'late' : 'intro'));
    T('k.zc', zoomIdx, zoomIdx ? Date.now() - zoomT0 : 0, st);
    if (zoomCan) zoomHit();
  }
  function zoomHit() {
    if (zoomHitDone) return;
    zoomHitDone = true; zoomHits++; T('k.zhit', zoomHits);
    hitSound(false);
    sparks(7);
    addFx('<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28" fill="none" stroke="#e05060" stroke-width="5"/><circle cx="32" cy="32" r="17" fill="none" stroke="#fff" stroke-width="5"/><circle cx="32" cy="32" r="7" fill="#e05060"/></svg>', 'bk-ring', '', 700);
    showBubble(pick(['Treffer!', 'Volltreffer!', 'Erwischt!', 'Boah, schnell!']) + (zoomHits > 1 ? ' (' + zoomHits + ')' : ''), 900);
    try { if (navigator.vibrate) navigator.vibrate([20, 30, 20]); } catch (err) { /* ignorieren */ }
    unlock('s:treffer');
    if (zoomHits >= 3) unlock('s:meister');
  }
  function onPet(e) {
    if (e) e.stopPropagation();
    if (zoomOn) return;
    var t = ++tok;
    var now = Date.now();
    petCount = now - lastPet < 1600 ? petCount + 1 : 1; lastPet = now;
    mem.pets++; persist(); T('k.pet', petCount);
    if (!mem.secrets.petted) { mem.secrets.petted = true; persist(); }
    hideBubble(); clearActions();
    wrap.classList.add('bk-happy');
    peek.classList.add('bk-a-happy');
    stage('pop');
    hearts(petCount > 2 ? 5 : 3);
    try { if (navigator.vibrate) navigator.vibrate([25, 40, 25]); } catch (err) { /* ignorieren */ }
    var r = Math.random();
    if (petCount >= 5) { zoomies(t); return; }
    if (r < 0.5) { meow(rnd(0.9, 1.15)); } else { purr(2.6); }
    var text;
    var total = Object.keys(mem.stickers || {}).length;
    if (mem.pets === 10) text = 'Wir sind jetzt beste Freunde!';
    else if (mem.pets % 7 === 0 && total < STICKERS.length) text = 'Du hast schon ' + total + ' von ' + STICKERS.length + ' Stickern gesammelt. Es gibt noch mehr!';
    else if (!(mem.stickers && mem.stickers['s:hidden']) && mem.pets >= 3 && Math.random() < 0.25) text = 'Psst… Hier versteckt sich noch jemand. Schau genau hin!';
    else text = nm(pick(PET));
    showBubble(text);
    (async function () {
      if (!await sleep(3100, t)) return;
      await leave(t);
    })();
  }

  /* Geheimnis: fünfmal schnell streicheln gibt Zoomies. */
  async function zoomies(t) {
    clearActions();
    if (!mem.secrets.zoomies) { mem.secrets.zoomies = true; persist(); }
    unlock('s:zoomies');
    /* Adaptives Tempo: Es geht schnell los (0,38 s sichtbar). Erst nach drei Durchgängen in Folge ohne Treffer wird es langsamer
       (längere Auftritte, größeres Ziel); wer oft trifft, wird noch schneller. */
    if (mem.zoomV !== 2) { mem.zoomV = 2; mem.zoomSpeed = 380; mem.zoomMiss = 0; persist(); }   /* neue Treffer-Regeln: Tempo neu einpegeln */
    var zms = Math.max(300, Math.min(1800, mem.zoomSpeed || 380));
    T('k.zoom', zms);
    var gap = Math.max(240, Math.min(520, Math.round(zms * 0.45)));
    var big = 1 + 0.35 * Math.max(0, zms - 380) / 1420;
    meow(1.3); showBubble(mem.zoomHitEver ? 'Zoomies!' : 'Zoomies! Fang mich!', 1400);
    stage('out');
    var sides = ['left', 'top', 'right', 'bottom', 'left', 'right'];
    zoomOn = true; zoomCan = false; zoomHits = 0; zoomIdx = 0;   /* ab hier zählen Klicks nur noch als Treffer, sie starten die Zoomies nicht neu */
    try {
      if (!await sleep(500, t)) return;
      for (var i = 0; i < sides.length; i++) {
        place(sides[i], true); clearActions(); zoomHitDone = false;
        if (big > 1.02) { var wpx = parseFloat(wrap.style.width) * big; wrap.style.width = wpx + 'px'; wrap.style.height = wpx + 'px'; }
        peek.style.transitionDuration = '.2s';   /* schnell hinein und hinaus, damit man das Kätzchen rechtzeitig sieht */
        wrap.classList.add('bk-happy'); stage('sneak'); void peek.offsetWidth; stage('pop'); zoomCan = true;
        zoomIdx = i + 1; zoomT0 = Date.now(); T('k.za', zoomIdx, sides[i]);
        if (!await sleep(zms, t)) return;
        stage('out');                      /* zoomCan bleibt bis zum nächsten Auftritt an: das Kätzchen ist beim Abtauchen noch zu sehen */
        if (!await sleep(gap, t)) return;
      }
    } finally { zoomOn = false; zoomCan = false; peek.style.transitionDuration = ''; }
    if (zoomHits > (mem.zoomBest || 0)) mem.zoomBest = zoomHits;
    if (zoomHits > 0) mem.zoomHitEver = true;
    var rate = zoomHits / sides.length;
    if (zoomHits === 0) { mem.zoomMiss = (mem.zoomMiss || 0) + 1; if (mem.zoomMiss >= 3) { zms *= 1.2; mem.zoomMiss = 0; } }
    else { mem.zoomMiss = 0; if (rate >= 0.8) zms *= 0.78; else if (rate > 0.55) zms *= 0.88; }
    mem.zoomSpeed = Math.max(300, Math.min(1800, Math.round(zms)));
    T('k.zend', zoomHits, mem.zoomSpeed);
    persist();
    place('bottom', true); stage('pop'); wrap.classList.add('bk-happy'); hearts(6); sparks(4);
    var msg = 'Puh! Das war schön. Danke!';
    if (zoomHits >= 3) { hitSound(true); confetti(); msg = zoomHits === sides.length ? 'Alle ' + zoomHits + ' getroffen! Unglaublich schnell!' : zoomHits + ' von ' + sides.length + ' getroffen! Du bist ein Zoomies-Meister!'; }
    else if (zoomHits > 0) { msg = 'Puh! Du hast ' + zoomHits + ' von ' + sides.length + ' erwischt. Dann nochmal!'; purr(2.2); }
    else purr(2.2);
    showBubble(msg);
    if (!await sleep(2800, t)) return;
    petCount = 0;
    await leave(t);
  }

  /* ---------- Zeitplan ---------- */
  var paused = false;
  function canVisit() {
    if (mem.off || paused || document.hidden || busy || userBusy) return false;
    var el = document.activeElement;
    if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return false;
    return true;
  }
  function schedule(delay) {
    clearTimeout(timer);
    if (mem.off) return;
    timer = setTimeout(function tick() {
      if (!canVisit()) { timer = setTimeout(tick, 5000); return; }
      if (pendingFriend) {
        var pf = pendingFriend; pendingFriend = null;
        if (pf === 'ann') visit({ action: 'wave', text: 'Psst… Bald bekomme ich Besuch von einer Freundin! Löse weiter Aufgaben, dann kommt sie.' });
        else if (pf === 'ann2') visit({ action: 'tilt', text: 'Meine Freundin ist schon unterwegs! Noch ein paar gelöste Aufgaben, dann ist sie da.' });
        else visit({ action: 'kiss', friend: true, text: 'Das ist Luna, meine Freundin! Danke, dass Du so fleißig löst!' });
        return;
      }
      var idle = Date.now() - lastActivity > 75000;
      visit(idle ? { kind: 'hard', action: pick(['tilt', 'wave', 'kiss', 'tail']) } : {});
    }, delay != null ? delay : (pendingFriend ? 6000 : rnd(CFG.min, CFG.max)));
  }

  /* ---------- Blick folgt dem Mauszeiger ---------- */
  function onMove(e) {
    lastActivity = Date.now();
    if (!visible || !svgEl) return;
    var r = svgEl.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height * 0.5;
    var dx = e.clientX - cx, dy = e.clientY - cy, th = -SIDE_ROT[side] * Math.PI / 180;
    var lx = dx * Math.cos(th) - dy * Math.sin(th), ly = dx * Math.sin(th) + dy * Math.cos(th);
    var d = Math.sqrt(lx * lx + ly * ly) || 1, k = Math.min(1, d / 220) * 5;
    var px = (lx / d) * k, py = (ly / d) * k;
    peek.querySelectorAll('.bk-look').forEach(function (g) { g.style.transform = 'translate(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px)'; });
  }


  /* ---------- Sammelalbum ---------- */
  var HEADG = (function () { var k = kittenSvg(); return k.slice(k.indexOf('<g class="bk-head">'), k.lastIndexOf('</svg>')); })();
  /* ---------- Geschenke: 14 verschiedene, in dieser Reihenfolge; danach zufällig ---------- */
  function gsvg(inner) { return '<svg viewBox="0 0 60 44" aria-hidden="true">' + inner + '</svg>'; }
  var GIFTS = [
    { id: 'fish', name: 'Fisch', svg: FISH, line: 'Ein Fisch! Frisch gefangen, nur für Dich.' },
    { id: 'mouse', name: 'Mäuschen', svg: MOUSE, line: 'Ein Mäuschen! Extra für Dich gejagt.' },
    { id: 'yarn', name: 'Wollknäuel', svg: YARN, w: 36, line: 'Ein Wollknäuel! Zum Spielen und Nachdenken.' },
    { id: 'milk', name: 'Milchschälchen', svg: gsvg('<path d="M8 16h44c0 12-8 22-22 22S8 28 8 16Z" fill="#f2c9a0" stroke="#7a4a22" stroke-width="2.4" stroke-linejoin="round"/><ellipse cx="30" cy="16" rx="22" ry="5.5" fill="#fff" stroke="#7a4a22" stroke-width="2.4"/><path d="M19 15q5-2.4 10 0" fill="none" stroke="#cfd8dc" stroke-width="1.8" stroke-linecap="round"/>'), line: 'Ein Schälchen Milch. Prost!' },
    { id: 'feather', name: 'Feder', svg: gsvg('<path d="M6 36C12 10 34 3 54 6C47 22 30 36 6 36Z" fill="#7cc4f0" stroke="#2c6a96" stroke-width="2.4" stroke-linejoin="round"/><path d="M6 36L46 12" stroke="#2c6a96" stroke-width="2.4" stroke-linecap="round"/><path d="M19 28l4-9M29 23l3-8" stroke="#2c6a96" stroke-width="1.8" stroke-linecap="round"/>'), line: 'Eine Feder! Die ist ganz leicht zu jagen.' },
    { id: 'treat', name: 'Leckerli', svg: gsvg('<circle cx="30" cy="24" r="15" fill="#d9a066" stroke="#7a4a22" stroke-width="2.4"/><circle cx="30" cy="28" r="5.4" fill="#b87a3e"/><circle cx="21" cy="19" r="2.8" fill="#b87a3e"/><circle cx="26.5" cy="14" r="2.8" fill="#b87a3e"/><circle cx="33.5" cy="14" r="2.8" fill="#b87a3e"/><circle cx="39" cy="19" r="2.8" fill="#b87a3e"/>'), line: 'Ein Leckerli! Teilen wir?' },
    { id: 'bell', name: 'Glöckchen', svg: gsvg('<path d="M16 30C16 16 22 9 30 9S44 16 44 30Z" fill="#f2c230" stroke="#8a6a00" stroke-width="2.4" stroke-linejoin="round"/><rect x="12" y="30" width="36" height="5" rx="2.5" fill="#f2c230" stroke="#8a6a00" stroke-width="2.4"/><circle cx="30" cy="38.5" r="3.2" fill="#8a6a00"/><path d="M30 9V4" stroke="#8a6a00" stroke-width="2.4" stroke-linecap="round"/>'), line: 'Ein Glöckchen. Bling, bling!' },
    { id: 'star', name: 'Goldstern', svg: gsvg('<polygon points="30,3 35.6,16.4 50,17.4 39,26.8 42.4,41 30,33.4 17.6,41 21,26.8 10,17.4 24.4,16.4" fill="#f2c230" stroke="#8a6a00" stroke-width="2.4" stroke-linejoin="round"/>'), line: 'Ein goldener Stern, weil Du so gut bist!' },
    { id: 'flower', name: 'Blume', svg: gsvg('<path d="M30 26v16M30 36q8-2 10-9" fill="none" stroke="#4a8a3a" stroke-width="3" stroke-linecap="round"/><g fill="#f48fb1" stroke="#4a2e1a" stroke-width="1.8"><circle cx="30" cy="6.5" r="6"/><circle cx="39" cy="11" r="6"/><circle cx="39" cy="20" r="6"/><circle cx="30" cy="24" r="6"/><circle cx="21" cy="20" r="6"/><circle cx="21" cy="11" r="6"/></g><circle cx="30" cy="15.5" r="6" fill="#f2c230" stroke="#4a2e1a" stroke-width="1.8"/>'), line: 'Eine Blume. Frisch gepflückt für Dich.' },
    { id: 'cushion', name: 'Kissen', svg: gsvg('<rect x="8" y="9" width="44" height="28" rx="9" fill="#b794f4" stroke="#5a3ea0" stroke-width="2.4"/><path d="M17 19h26M17 28h26" stroke="#fff" stroke-width="2" stroke-dasharray="3 4" opacity=".7"/><circle cx="8" cy="9" r="3.2" fill="#f2c230"/><circle cx="52" cy="9" r="3.2" fill="#f2c230"/><circle cx="8" cy="37" r="3.2" fill="#f2c230"/><circle cx="52" cy="37" r="3.2" fill="#f2c230"/>'), line: 'Ein Kissen. Für Deine Pausen!' },
    { id: 'butterfly', name: 'Schmetterling', svg: BUTTERFLY, w: 36, line: 'Ein Schmetterling! Ganz vorsichtig…' },
    { id: 'trophy', name: 'Pokal', svg: gsvg('<path d="M18 5h24v13c0 9-6 13-12 13S18 27 18 18Z" fill="#f2c230" stroke="#8a6a00" stroke-width="2.4" stroke-linejoin="round"/><path d="M18 9h-8c0 8 4 11 8 11M42 9h8c0 8-4 11-8 11" fill="none" stroke="#8a6a00" stroke-width="2.4"/><path d="M30 31v6M20 40h20" stroke="#8a6a00" stroke-width="3" stroke-linecap="round"/>'), line: 'Ein kleiner Pokal. Du bist spitze!' },
    { id: 'goldfish', name: 'Goldfisch', svg: FISH.replace(/#6fb3d9/g, '#ffb347').replace(/#4a95c4/g, '#ff9a1f').replace(/#2c5f80/g, '#9a5200'), line: 'Ein Goldfisch! Der ist etwas ganz Besonderes.' },
    { id: 'crown', name: 'Krone', svg: gsvg('<path d="M8 32V12l12 10 10-16 10 16 12-10v20Z" fill="#f2c230" stroke="#8a6a00" stroke-width="2.4" stroke-linejoin="round"/><circle cx="8" cy="10" r="3.4" fill="#e05060"/><circle cx="30" cy="4.5" r="3.4" fill="#4a9ad9"/><circle cx="52" cy="10" r="3.4" fill="#e05060"/><rect x="8" y="32" width="44" height="6" rx="3" fill="#f2c230" stroke="#8a6a00" stroke-width="2.4"/>'), line: 'Eine Krone für Dich, Rätselprofi!' }
  ];
  /* Abstand bis zum nächsten Geschenk (in richtigen Antworten): kurz am Anfang, langsam wachsend, zufällig gestreut */
  var GAP_BASE = [2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 5];
  function nextGap(given) {
    var base = given <= GAP_BASE.length ? GAP_BASE[given - 1] : 5 + Math.floor((given - GAP_BASE.length) / 3);
    return Math.max(2, Math.round(base * rnd(0.7, 1.4)));
  }

  var STICKERS = [
    ['a:wave', 'Winken', 'Das Kätzchen winkt Dir zu.'], ['a:tail', 'Schwanzwedeln', 'Wedelt Dir Glück zu.'], ['a:kiss', 'Katzenkuss', 'Langsames Blinzeln heißt: ich mag Dich.'],
    ['a:yawn', 'Gähnen', 'Auch Kätzchen werden müde.'], ['a:ear', 'Ohrenzucken', 'Es hört Dich nachdenken.'], ['a:wash', 'Pfötchen putzen', 'Gründliche Katzenwäsche.'],
    ['a:tilt', 'Kopf neigen', 'Neugierig und verwundert.'], ['a:butterfly', 'Schmetterling', 'Ein flatterndes Ziel.'], ['a:yarn', 'Wollknäuel', 'Rollt und rollt.'],
    ['a:sleep', 'Einnicken', 'Huch, kurz weggedöst!'], ['a:mouse', 'Spielzeugmaus', 'Anschleichen und zupacken.'], ['a:knock', 'Anklopfen', 'Hallo, ist da jemand?'],
    ['a:peekaboo', 'Kuckuck', 'Weg und wieder da.'], ['a:sneeze', 'Niesen', 'Hatschi!'], ['a:stretch', 'Strecken', 'Aaah, das tut gut.'],
    ['a:litter', 'Katzenklo', 'Bitte nicht stören!'], ['a:carton', 'Karton', 'Wenn es passt, dann sitzt es.'], ['a:laser', 'Roter Punkt', 'Wo ist er hin?'],
    ['a:cuke', 'Gurke', 'Huch!'], ['a:soap', 'Seifenblasen', 'Plopp!'], ['a:knead', 'Milchtritt', 'Brot backen mit den Pfoten.'],
    ['a:wish', 'Sternschnuppe', 'Ein Wunsch für Dich.'], ['a:cup', 'Tasse', 'Ups.'], ['a:eat', 'Futterzeit', 'Nom nom nom.'],
    ['s:confetti', 'Konfetti', 'Fünf richtige Antworten in Folge.'], ['s:rufen', 'Gerufen', 'Man munkelt: Miau tippen.'],
    ['s:zoomies', 'Zoomies', 'Fünfmal schnell streicheln.'], ['s:ahnung', 'Besuch angekündigt', 'Man munkelt: Das Kätzchen bekommt bald Besuch.'], ['s:ahnung2', 'Besuch unterwegs', 'Man munkelt: Jemand ist schon auf dem Weg zum Kätzchen.'], ['s:luna', 'Luna', 'Die Freundin des Kätzchens. Sie kommt, wenn Du fleißig löst.'], ['s:treffer', 'Treffer', 'Ein Zoomies-Kätzchen im Flug getroffen.'], ['s:meister', 'Zoomies-Meister', 'Drei Zoomies-Kätzchen in einem Durchgang getroffen.'], ['s:hidden', 'Mimi', 'Die kleine versteckte Katze.'],
    ['h:xmas', 'Weihnachtsmütze', 'Ho ho ho!'], ['h:silvester', 'Partyhut', 'Prosit Neujahr!'], ['h:halloween', 'Kürbishut', 'Buh!'], ['h:ostern', 'Blumenkranz', 'Frühlingsgefühle.'], ['h:sommer', 'Sonnenbrille', 'Cool bleiben.'],
    ['x:end']
  ].filter(function (x) { return x[0] !== 'x:end'; }).concat(GIFTS.map(function (g, i) { return ['g:' + g.id, g.name, 'Geschenk Nr. ' + (i + 1) + ' vom Kätzchen.']; }));
  /* Zusatzzeichnungen je Sticker, im Koordinatensystem des Kopfes (viewBox 30 0 140 150) */
  var PROPS = {
    'a:wave': { svg: '<ellipse cx="162" cy="72" rx="9" ry="14" fill="' + FUR + '" stroke="' + LINE + '" stroke-width="3" transform="rotate(20 162 72)"/><path d="M174 52q8 6 6 16M176 44q12 8 10 24" fill="none" stroke="' + LINE + '" stroke-width="3" stroke-linecap="round"/>' },
    'a:tail': { svg: '<path d="M150 140C176 134 180 100 160 86" fill="none" stroke="' + LINE + '" stroke-width="15" stroke-linecap="round"/><path d="M150 140C176 134 180 100 160 86" fill="none" stroke="' + FUR + '" stroke-width="9" stroke-linecap="round"/>' },
    'a:kiss': { cls: 'bk-happy', svg: '<g transform="translate(120 4) scale(2.2)">' + HEART.replace('<svg viewBox="0 0 24 24" aria-hidden="true">', '<g color="#ef5d7a">').replace('</svg>', '</g>') + '</g>' },
    'a:yawn': { cls: 'bk-happy bk-st-open', svg: '' },
    'a:ear': { svg: '<path d="M30 44q-10 10 0 22M22 36q-16 18 0 38" fill="none" stroke="' + LINE + '" stroke-width="3.5" stroke-linecap="round"/>' },
    'a:wash': { svg: '<ellipse cx="108" cy="134" rx="17" ry="14" fill="' + FUR + '" stroke="' + LINE + '" stroke-width="3"/><path d="M103 140v-8M113 140v-8" stroke="' + LINE + '" stroke-width="2.4" stroke-linecap="round"/>' },
    'a:tilt': { rot: -14, svg: '<text x="146" y="42" font-family="system-ui,sans-serif" font-weight="800" font-size="40" fill="#0a86a6">?</text>' },
    'a:butterfly': { svg: '<g transform="translate(120 6) scale(1.2)">' + BUTTERFLY.replace(/^<svg[^>]*>/, '').replace('</svg>', '') + '</g>' },
    'a:yarn': { svg: '<g transform="translate(110 100) scale(1.4)">' + YARN.replace(/^<svg[^>]*>/, '').replace('</svg>', '') + '</g>' },
    'a:sleep': { cls: 'bk-happy', svg: '<text x="132" y="34" font-family="system-ui,sans-serif" font-weight="800" font-size="30" fill="#6a7b82">Z</text><text x="152" y="16" font-family="system-ui,sans-serif" font-weight="800" font-size="20" fill="#6a7b82">z</text>' },
    'a:mouse': { svg: '<g transform="translate(100 112) scale(1.1)">' + MOUSE.replace(/^<svg[^>]*>/, '').replace('</svg>', '') + '</g>' },
    'a:knock': { svg: '<circle cx="156" cy="120" r="12" fill="none" stroke="#0a86a6" stroke-width="4"/><circle cx="156" cy="120" r="24" fill="none" stroke="#0a86a6" stroke-width="3" opacity=".6"/>' },
    'a:peekaboo': { svg: '<rect x="20" y="104" width="170" height="60" fill="#8a9ca4"/>' },
    'a:sneeze': { cls: 'bk-happy', svg: '<circle cx="156" cy="100" r="5" fill="#8aa0a8"/><circle cx="170" cy="86" r="4" fill="#8aa0a8"/><circle cx="166" cy="112" r="3.5" fill="#8aa0a8"/>' },
    'a:stretch': { svg: '<ellipse cx="48" cy="26" rx="12" ry="17" fill="' + FUR + '" stroke="' + LINE + '" stroke-width="3"/><ellipse cx="152" cy="26" rx="12" ry="17" fill="' + FUR + '" stroke="' + LINE + '" stroke-width="3"/>' },
    'a:litter': { cls: 'bk-happy', svg: '<path d="M12 122h176l-16 36H28z" fill="#8cb8d6" stroke="' + LINE + '" stroke-width="3" stroke-linejoin="round"/><path d="M20 124h160l-5 12H25z" fill="#d9c28a"/>' },
    'a:carton': { svg: '<path d="M16 112h168l-10 48H26z" fill="#c89a5b" stroke="' + LINE + '" stroke-width="3" stroke-linejoin="round"/><rect x="10" y="104" width="180" height="14" rx="4" fill="#d9ab6d" stroke="' + LINE + '" stroke-width="3"/>' },
    'a:laser': { svg: '<circle cx="158" cy="38" r="18" fill="#ff2d2d" opacity=".3"/><circle cx="158" cy="38" r="9" fill="#ff2d2d"/>' },
    'a:cuke': { svg: '<ellipse cx="160" cy="126" rx="30" ry="10" fill="#4caf50" stroke="#1b5e20" stroke-width="3" transform="rotate(-14 160 126)"/>' },
    'a:soap': { svg: '<circle cx="150" cy="30" r="14" fill="none" stroke="#7cc4f0" stroke-width="3"/><circle cx="174" cy="66" r="9" fill="none" stroke="#7cc4f0" stroke-width="3"/><circle cx="30" cy="40" r="11" fill="none" stroke="#7cc4f0" stroke-width="3"/>' },
    'a:knead': { cls: 'bk-happy', svg: '<ellipse cx="64" cy="140" rx="18" ry="12" fill="' + FUR + '" stroke="' + LINE + '" stroke-width="3"/><ellipse cx="136" cy="140" rx="18" ry="12" fill="' + FUR + '" stroke="' + LINE + '" stroke-width="3"/>' },
    'a:wish': { svg: '<path d="M176 4l-52 34" stroke="#f2c230" stroke-width="6" stroke-linecap="round"/><polygon points="120,40 126,32 134,38 126,44" fill="#f2c230"/>' },
    'a:eat': { cls: 'bk-happy', svg: '<g transform="translate(40 116) scale(1.1)">' + BOWL.replace(/^<svg[^>]*>/, '').replace('</svg>', '') + '</g>' },
    'a:cup': { svg: '<g transform="translate(120 96) scale(1.1)">' + CUP.replace(/^<svg[^>]*>/, '').replace('</svg>', '') + '</g>' },
    's:confetti': { svg: '<rect x="20" y="14" width="10" height="16" fill="#e05060" transform="rotate(20 25 22)"/><rect x="150" y="10" width="10" height="16" fill="#4a9ad9" transform="rotate(-30 155 18)"/><rect x="170" y="70" width="10" height="16" fill="#f2c230" transform="rotate(50 175 78)"/><rect x="10" y="80" width="10" height="16" fill="#4caf50" transform="rotate(-20 15 88)"/><rect x="100" y="4" width="10" height="16" fill="#b794f4" transform="rotate(35 105 12)"/>' },
    's:rufen': { svg: '<text x="116" y="30" font-family="system-ui,sans-serif" font-weight="800" font-size="28" fill="#0a86a6">Miau?</text>' },
    's:ahnung2': { svg: '<path d="M126 70l8-6 8 6-8 6zM150 52l8-6 8 6-8 6zM172 32l8-6 8 6-8 6z" fill="#0a86a6"/><text x="120" y="108" font-family="system-ui,sans-serif" font-weight="800" font-size="26" fill="#0a86a6">gleich!</text>' },
    's:ahnung': { svg: '<text x="128" y="40" font-family="system-ui,sans-serif" font-weight="800" font-size="34" fill="#0a86a6">Psst…</text><path d="M168 78l8 0M172 74v8" stroke="#e05060" stroke-width="4" stroke-linecap="round"/>' },
    's:zoomies': { svg: '<path d="M4 60h36M0 84h44M8 108h32" stroke="#0a86a6" stroke-width="5" stroke-linecap="round"/>' },
    's:treffer': { cls: 'bk-happy', svg: '<g transform="translate(116 8)"><circle cx="30" cy="30" r="28" fill="#fff" stroke="#e05060" stroke-width="5"/><circle cx="30" cy="30" r="17" fill="none" stroke="#e05060" stroke-width="5"/><circle cx="30" cy="30" r="6" fill="#e05060"/></g>' },
    's:meister': { cls: 'bk-happy', svg: '<g transform="translate(112 4) scale(1.5)">' + SPARK.replace(/^<svg[^>]*>/, '<g color="#f2c230">').replace('</svg>', '</g>') + '</g><path d="M4 60h36M0 84h44" stroke="#0a86a6" stroke-width="5" stroke-linecap="round"/>' },
    'x:end': { svg: '' }
  };
  function stickerSvg(id) {
    var kind = id.split(':')[0], key = id.split(':')[1], pr = PROPS[id] || {};
    if (id === 's:hidden') return hidSvg(90);
    if (id === 's:luna') {
      var lh = recolorLuna(HEADG), li = lh.lastIndexOf('</g>');
      return '<svg viewBox="10 -8 190 168" aria-hidden="true" class="bk-happy"><g>' + lh + BOW + '</g><g transform="translate(150 6) scale(1.2)">' + HEART.replace(/^<svg[^>]*>/, '<g color="#ef5d7a">').replace('</svg>', '</g>') + '</g></svg>';
    }
    if (kind === 'g') {
      var gg = GIFTS.filter(function (x) { return x.id === key; })[0];
      pr = { svg: '<g transform="translate(78 104) scale(1.45)">' + gg.svg.replace(/^<svg[^>]*>/, '').replace('</svg>', '') + '</g>' };
    }
    var acc = kind === 'h' ? ' data-acc="' + key + '"' : '';
    var head = HEADG;
    return '<svg viewBox="10 -8 190 168" aria-hidden="true" class="' + (pr.cls || '') + '"' + acc + '><g transform="rotate(' + (pr.rot || 0) + ' 100 100)">' + head + '</g>' + (pr.svg || '') + '</svg>';
  }
  function stickerName(id) { for (var i = 0; i < STICKERS.length; i++) if (STICKERS[i][0] === id) return STICKERS[i][1]; return id; }

  var toast = null, toastT = 0;
  function showToast(text) {
    if (!toast) {
      toast = document.createElement('button'); toast.type = 'button'; toast.className = 'bk-toast';
      toast.setAttribute('aria-live', 'polite');
      toast.addEventListener('click', function () { openAlbum(lastKind); });
      document.body.appendChild(toast);
    }
    toast.innerHTML = SPARK + '<span></span>';
    toast.querySelector('span').textContent = text;
    toast.classList.add('bk-show');
    clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove('bk-show'); }, 3800);
  }
  function unlock(id) {
    if (!mem.stickers) mem.stickers = {};
    if (mem.stickers[id]) return false;
    mem.stickers[id] = true; persist(); T('k.unl', id);
    lastKind = id.slice(0, 2) === 'g:' ? 'gifts' : 'sticker';
    var first = Object.keys(mem.stickers).length === 1;
    setTimeout(function () { showToast('Neuer Sticker: ' + stickerName(id) + (first ? ' (Dein Sammelalbum ist im Seitenfuß)' : '')); }, 900);
    announce();
    return true;
  }

  /* Klick auf einen Sticker im Album: das Kätzchen führt dieselbe Vorstellung vor wie im Spiel (es erscheint über dem Album) */
  var HAT_SAY = { xmas: 'Ho ho ho!', silvester: 'Prosit Neujahr!', halloween: 'Buh!', ostern: 'Frohe Ostern!', sommer: 'Cool bleiben!' };
  function playFromAlbum(id) {
    if (!id || !wrap) return;
    var kind = id.slice(0, 2), key = id.slice(2), sd = pick(['bottom', 'left', 'right']);
    if (kind === 'a:' && ACTIONS[key]) { visit({ action: key, side: sd, text: ACTIONS[key].phrases ? pick(ACTIONS[key].phrases) : undefined }); return; }
    if (kind === 'h:') { forceAcc = key; visit({ action: pick(['wave', 'tilt', 'kiss']), side: sd, text: HAT_SAY[key] || 'Schau mal!' }); return; }
    if (id === 's:luna') { visit({ action: 'kiss', side: sd, friend: true, text: 'Das ist Luna, meine Freundin!' }); return; }
    if (id === 's:ahnung2') { visit({ action: 'tilt', side: sd, text: 'Meine Freundin ist schon unterwegs!' }); return; }
    if (id === 's:ahnung') { visit({ action: 'wave', side: sd, text: 'Psst… Bald bekomme ich Besuch!' }); return; }
    if (id === 's:confetti') { visit({ action: 'wave', side: sd, text: 'Konfetti!' }); setTimeout(confetti, 1600); return; }
    if (id === 's:zoomies' || id === 's:treffer' || id === 's:meister') {
      var t = ++tok; busy = true; visible = true; clearTimeout(timer); hideBubble();
      wrap.classList.add('bk-on', 'bk-live'); wrap.tabIndex = 0;
      zoomies(t); return;
    }
    visit({ action: id === 's:rufen' ? 'tilt' : 'wave', side: sd, text: id === 's:rufen' ? 'Miau?' : id === 's:hidden' ? 'Mimi versteckt sich gern.' : undefined });
  }

  var albumEl = null, albumFrom = null, albumTab = 'sticker', lastKind = 'sticker';

  /* Ein Geschenk groß, Größe in der Szene über x/y/width (die viewBox des Geschenks bleibt erhalten) */
  function giftAt(g, x, y, w, locked) {
    var svg = g.svg.replace('<svg ', '<svg x="' + x + '" y="' + y + '" width="' + w + '" height="' + Math.round(w * 0.75) + '" ');
    return locked ? svg.replace('<svg ', '<svg style="filter:grayscale(1) brightness(.4);opacity:.3" ') : svg;
  }
  /* Szene: das Kätzchen sitzt auf seinem Teppich, die erhaltenen Geschenke liegen um es herum */
  function sceneSvg(have) {
    var slots = [[18, 14], [76, 14], [18, 70], [76, 70], [18, 126], [76, 126], [276, 14], [334, 14], [276, 70], [334, 70], [276, 126], [334, 126], [132, 170], [214, 170]];
    var cat = kittenSvg().replace(/^<svg[^>]*>/, '<g transform="translate(138 10) scale(.62)">').replace(/<\/svg>$/, '</g>');
    var items = GIFTS.map(function (g, i) {
      var p = slots[i % slots.length];
      var got = !!have['g:' + g.id];
      return giftAt(g, p[0], p[1], 50, !got);
    }).join('');
    return '<svg viewBox="0 0 400 240" role="img" aria-label="Das Kätzchen mit seinen Geschenken">' +
      '<ellipse cx="200" cy="205" rx="190" ry="30" fill="#e8b4a0" stroke="#b9786a" stroke-width="3"/>' +
      '<ellipse cx="200" cy="205" rx="160" ry="21" fill="none" stroke="#fbe5d9" stroke-width="3" stroke-dasharray="10 8"/>' +
      cat + items + '</svg>';
  }
  function pairHtml(g, got) {
    var withCat = got ? stickerSvg('g:' + g.id) : stickerSvg('a:wave');
    return '<div class="bk-gpair"><figure class="bk-gpic"><div class="bk-galone-bg" style="background:var(--paper,#fdf9f1)">' + withCat.replace('<svg ', '<svg style="width:100%" ') + '</div><figcaption>mit dem Kätzchen</figcaption></figure>' +
      '<figure class="bk-gpic"><div class="bk-galone-bg">' + g.svg + '</div><figcaption>einzeln</figcaption></figure></div>';
  }
  function giftsHtml(have) {
    var n = GIFTS.filter(function (g) { return have['g:' + g.id]; }).length;
    var cards = GIFTS.map(function (g, i) {
      var got = !!have['g:' + g.id];
      return '<li><button type="button" class="bk-gcard' + (got ? '' : ' bk-locked') + '" data-gift="' + g.id + '"' + (got ? '' : ' disabled') + ' aria-label="' + (got ? g.name + ', groß ansehen' : 'Noch nicht bekommen') + '">' +
        pairHtml(g, got) + '<b>' + (got ? g.name : '???') + '</b><span>' + (got ? g.line : 'Noch nicht bekommen. Das Kätzchen schenkt Dir etwas für richtige Antworten im ersten Versuch.') + '</span></button></li>';
    }).join('');
    return '<div class="bk-scene">' + sceneSvg(have) + '</div>' +
      '<p class="bk-scenecap">' + n + ' von ' + GIFTS.length + ' Geschenken. Tippe ein Geschenk an, dann siehst Du es ganz groß.</p>' +
      '<ul class="bk-ggrid">' + cards + '</ul>';
  }
  function stickersHtml(have) {
    return '<div class="bk-say" role="status" aria-live="polite"></div><ul class="bk-grid">' + STICKERS.filter(function (s) { return s[0].slice(0, 2) !== 'g:'; }).map(function (s) {
      var got = !!have[s[0]];
      return '<li class="bk-st' + (got ? '' : ' bk-locked') + '"' + (got ? ' tabindex="0" role="button" data-st="' + s[0] + '" aria-label="' + s[1] + ' (antippen: das Kätzchen zeigt es Dir)"' : '') + '>' + (got ? stickerSvg(s[0]) : stickerSvg(s[0] === 's:hidden' ? 'a:wave' : s[0])) +
        '<b>' + (got ? s[1] : '???') + '</b><small>' + (got ? s[2] : 'Noch nicht entdeckt') + '</small></li>';
    }).join('') + '</ul>';
  }
  function openAlbum(tab) {
    if (albumEl) return;
    albumFrom = document.activeElement;
    T('k.alb', tab || albumTab);
    if (tab === 'sticker' || tab === 'gifts') albumTab = tab;
    var have = mem.stickers || {};
    var nGift = GIFTS.filter(function (g) { return have['g:' + g.id]; }).length;
    var nSt = Object.keys(have).filter(function (k) { return k.slice(0, 2) !== 'g:'; }).length;
    var totSt = STICKERS.length - GIFTS.length;
    albumEl = document.createElement('div'); albumEl.className = 'bk-album-back';
    document.body.classList.add('bk-albumopen');
    albumEl.innerHTML = '<div class="bk-album bk-wide" role="dialog" aria-modal="true" aria-label="Kätzchen-Sammelalbum">' +
      '<div class="bk-album-head"><div><h2>Sammelalbum</h2><p class="bk-albumsub"></p></div>' +
      '<button type="button" class="bk-album-close">Schließen</button></div>' +
      '<div class="bk-tabs" role="tablist" aria-label="Album">' +
      '<button type="button" class="bk-tab" role="tab" data-tab="sticker">Sticker (' + nSt + '/' + totSt + ')</button>' +
      '<button type="button" class="bk-tab" role="tab" data-tab="gifts">Geschenke (' + nGift + '/' + GIFTS.length + ')</button></div>' +
      '<div class="bk-albumbody" role="tabpanel"></div></div>';
    document.body.appendChild(albumEl);
    var body = albumEl.querySelector('.bk-albumbody'), sub = albumEl.querySelector('.bk-albumsub');
    var close = albumEl.querySelector('.bk-album-close');
    var lbox = null;
    var pops = [], sayT = 0, lastSay = -1;
    var SAYINGS = [
      'Aufgaben lösen sich nicht selbst!',
      'Aufgaben lösen sich nicht selbst, aber zusammen schaffen wir das!',
      'So, genug gespielt: Die Aufgaben lösen sich nicht selbst!',
      'Hihi, das kitzelt! Aber Aufgaben lösen sich nicht selbst.',
      'Ich freue mich über Besuch, aber die nächste Aufgabe wartet schon!'
    ];
    var CREDIT_SAYINGS = [
      'Mein Vorrat an Vorstellungen ist leer. Löse eine Aufgabe, dann zeige ich Dir wieder etwas!',
      'Kein Zauber ohne Arbeit! Für jede gelöste Aufgabe gibt es neue Vorstellungen.',
      'Jetzt bist Du dran: Löse eine Aufgabe, dann komme ich wieder!'
    ];
    function sayNow(kind) {
      var box = body.querySelector('.bk-say'); if (!box) return;
      var pool = kind === 'credit' ? CREDIT_SAYINGS : SAYINGS;
      var i; do { i = Math.floor(Math.random() * pool.length); } while (i === lastSay && pool.length > 1);
      lastSay = i;
      box.classList.remove('bk-on'); void box.offsetWidth;
      box.textContent = pool[i] + ' ';
      var nx = null;
      try { nx = window.BiberApp && window.BiberApp.nextTask ? window.BiberApp.nextTask() : null; } catch (e) { nx = null; }
      var go = document.createElement('a'); go.className = 'bk-say-go'; go.textContent = 'Auf die Arbeit!';
      go.href = nx ? '#' + nx.id : '#';
      if (nx) go.title = 'Weiter mit: ' + nx.title;
      go.addEventListener('click', function () { closeAlbum(); });
      box.appendChild(go); box.classList.add('bk-on');
      clearTimeout(sayT); sayT = setTimeout(function () { box.classList.remove('bk-on'); }, 9000);
    }
    /* Höchstens 5 Auftritte innerhalb von 90 Sekunden, danach ein netter Spruch statt weiterer Auftritte */
    function popSticker(li) {
      var now = Date.now();
      if (credit() <= 0) { T('k.st', li.getAttribute('data-st'), 'credit0'); sayNow('credit'); return; }
      pops = pops.filter(function (t) { return now - t < 90000; });
      if (pops.length >= 5) { T('k.st', li.getAttribute('data-st'), 'limit'); sayNow(); return; }
      pops.push(now);
      mem.credit = credit() - 1; persist(); renderSub();
      T('k.st', li.getAttribute('data-st'), 'play', mem.credit);
      li.classList.remove('bk-pop'); void li.offsetWidth; li.classList.add('bk-pop');
      setTimeout(function () { li.classList.remove('bk-pop'); }, 600);
      playFromAlbum(li.getAttribute('data-st'));
    }
    function renderSub() {
      if (albumTab !== 'sticker') return;
      sub.textContent = nSt + ' von ' + totSt + ' Stickern gesammelt. Tippe einen Sticker an, dann zeigt Dir das Kätzchen die Vorstellung. Vorstellungen übrig: ' + credit() + '. Für jede richtig gelöste Aufgabe (erster Versuch) gibt es 3 neue, für jede andere beantwortete 1.';
    }
    window.__bkCredit = renderSub;
    function show(t) {
      albumTab = t; T('k.tab', t);
      albumEl.querySelectorAll('.bk-tab').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.tab === t ? 'true' : 'false'); });
      if (t === 'gifts') {
        sub.textContent = 'Geschenke vom Kätzchen für richtige Antworten im ersten Versuch (bisher ' + (mem.correct || 0) + ').';
        body.innerHTML = giftsHtml(have);
      } else {
        renderSub();
        body.innerHTML = stickersHtml(have);
      }
    }
    function openBig(id) {
      var g = GIFTS.filter(function (x) { return x.id === id; })[0];
      if (!g || lbox) return;
      T('k.gbig', id);
      lbox = document.createElement('div'); lbox.className = 'bk-lbox';
      lbox.innerHTML = '<div class="bk-lbox-in" role="dialog" aria-modal="true" aria-label="' + g.name + '"><h3>' + g.name + '</h3><p>' + g.line + '</p>' + pairHtml(g, true) +
        '<div><button type="button" class="bk-album-close bk-lbox-close">Zurück</button></div></div>';
      albumEl.appendChild(lbox);
      lbox.querySelector('.bk-lbox-close').focus();
      lbox.addEventListener('click', function (e) { if (e.target === lbox || e.target.closest('.bk-lbox-close')) closeBig(); });
    }
    function closeBig() {
      if (!lbox) return;
      lbox.remove(); lbox = null;
      var c = body.querySelector('.bk-gcard:not(.bk-locked)'); if (c) c.focus();
    }
    function closeAlbum() {
      if (!albumEl) return;
      T('k.albx'); albumEl.remove(); albumEl = null; lbox = null; document.removeEventListener('keydown', onKey, true);
      document.body.classList.remove('bk-albumopen'); window.__bkCredit = null;
      if (albumFrom && albumFrom.focus) try { albumFrom.focus(); } catch (e) { /* ignorieren */ }
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); if (lbox) closeBig(); else closeAlbum(); }
      else if (e.key === 'Tab') {
        var root = lbox || albumEl;
        var f = [].slice.call(root.querySelectorAll('button')).filter(function (b) { return !b.disabled; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        else if (!root.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', onKey, true);
    close.addEventListener('click', closeAlbum);
    albumEl.addEventListener('click', function (e) {
      if (e.target === albumEl) { closeAlbum(); return; }
      var t = e.target.closest('.bk-tab');
      if (t) { show(t.dataset.tab); return; }
      var gc = e.target.closest('.bk-gcard');
      if (gc && !gc.disabled) { openBig(gc.dataset.gift); return; }
      var st = e.target.closest('.bk-st');
      if (st && !st.classList.contains('bk-locked')) popSticker(st);
    });
    albumEl.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('bk-st') && !e.target.classList.contains('bk-locked')) { e.preventDefault(); popSticker(e.target); }
    });
    show(albumTab);
    close.focus();
  }

  /* ---------- Konfetti ---------- */
  function confetti() {
    if (reduced) { sparks(8); return; }
    var colors = ['#e05060', '#4a9ad9', '#f2c230', '#4caf50', '#b794f4', '#ff8a3d'];
    for (var i = 0; i < 48; i++) {
      var d = document.createElement('div');
      d.className = 'bk-conf';
      d.style.left = rnd(4, 96) + 'vw';
      d.style.background = pick(colors);
      d.style.animationDelay = rnd(0, 0.7).toFixed(2) + 's';
      d.style.setProperty('--dx', Math.round(rnd(-90, 90)) + 'px');
      d.style.setProperty('--rot', Math.round(rnd(240, 900)) + 'deg');
      document.body.appendChild(d);
      (function (el) { setTimeout(function () { el.remove(); }, 4200); })(d);
    }
  }
  function streakParty() {
    if (streak === 5 || streak === 10 || streak === 20) { unlock('s:confetti'); setTimeout(confetti, 600); return true; }
    return false;
  }

  /* ---------- Geschenk-Besuch ---------- */
  function gift() {
    var n = mem.correct || 0;
    var idx = mem.giftN < GIFTS.length ? mem.giftN : Math.floor(Math.random() * GIFTS.length);
    var g = GIFTS[idx];
    mem.giftN = (mem.giftN || 0) + 1;
    mem.giftNext = n + nextGap(mem.giftN);
    persist();
    unlock('g:' + g.id); T('k.gift', g.id);
    var t = ++tok; busy = true; visible = true; clearTimeout(timer);
    (async function () {
      place(pick(['bottom', 'left', 'right'])); clearActions();
      wrap.classList.add('bk-on', 'bk-live'); wrap.tabIndex = 0;
      stage('up'); wrap.classList.add('bk-happy'); peek.classList.add('bk-a-happy');
      if (!await sleep(550, t)) return;
      seenAcc();
      var w = g.w || 52;
      addFx(g.svg, 'bk-gift', 'width:' + w + '%;left:' + ((100 - w) / 2) + '%', 5600);
      trill(); hearts(3); sparks(5);
      var party = streakParty();
      showBubble((n === 1 ? 'Deine erste richtige Antwort! ' : n + ' richtige Antworten! ') + g.line + (party ? ' Und ' + streak + ' in Folge!' : ''), 4800);
      if (!await sleep(5000, t)) return;
      await leave(t);
    })();
  }

  /* ---------- Versteckte Katze ---------- */
  var hidEl = null, hidTarget = null, hidDX = 0;
  function hidSvg(px) {
    return '<svg viewBox="0 0 30 30" width="' + px + '" height="' + px + '" aria-hidden="true"><path d="M3 12L5 2l7 5z" fill="#8c8f94" stroke="#3d3f44" stroke-width="1.4" stroke-linejoin="round"/><path d="M27 12L25 2l-7 5z" fill="#8c8f94" stroke="#3d3f44" stroke-width="1.4" stroke-linejoin="round"/>' +
      '<ellipse cx="15" cy="17" rx="12.5" ry="11.5" fill="#a7abb1" stroke="#3d3f44" stroke-width="1.4"/><g class="bk-hidblink"><ellipse cx="10" cy="15" rx="2" ry="2.6" fill="#1d1f22"/><ellipse cx="20" cy="15" rx="2" ry="2.6" fill="#1d1f22"/></g>' +
      '<path d="M13.4 19.4h3.2l-1.6 2z" fill="#f4a3b4"/><path d="M5 18l-5-1M5 21l-5 1.5M25 18l5-1M25 21l5 1.5" stroke="#3d3f44" stroke-width=".9" stroke-linecap="round"/></svg>';
  }
  function removeHidden() { if (hidEl) { hidEl.remove(); hidEl = null; hidTarget = null; } }
  function positionHidden() {
    if (!hidEl || !hidTarget || !document.body.contains(hidTarget)) return removeHidden();
    var r = hidTarget.getBoundingClientRect();
    if (r.width < 60) return removeHidden();
    hidEl.style.left = (r.left + window.scrollX + Math.min(Math.max(8, hidDX), r.width - 38)) + 'px';
    hidEl.style.top = (r.top + window.scrollY - 15) + 'px';
  }
  function placeHidden() {
    removeHidden();
    if (mem.off) return;
    var chance = (mem.stickers && mem.stickers['s:hidden']) ? 0.2 : 0.5;
    if (Math.random() > chance) return;
    var sel = 'h1,h2,.task-row,.board-shell,.panel,.stat,.feedback,.intro,.progress,article,footer,.tasklist li';
    var c = [].slice.call(document.querySelectorAll(sel)).filter(function (e) {
      var r = e.getBoundingClientRect();
      return r.width > 90 && r.height > 20 && r.top + window.scrollY > 90 && !e.closest('.bk-wrap,.bk-album-back,.site-head');
    });
    if (!c.length) return;
    hidTarget = pick(c);
    var w = hidTarget.getBoundingClientRect().width;
    hidDX = rnd(10, Math.max(12, w - 40));
    hidEl = document.createElement('button'); hidEl.type = 'button'; hidEl.className = 'bk-hid';
    hidEl.setAttribute('aria-label', 'Eine winzige Katze versteckt sich hier. Antippen!');
    hidEl.innerHTML = hidSvg(30);
    hidEl.addEventListener('click', foundHidden);
    document.body.appendChild(hidEl);
    positionHidden();
  }
  function foundHidden() {
    if (!hidEl) return;
    var el = hidEl; el.classList.add('bk-found');
    setTimeout(function () { el.remove(); }, 900);
    hidEl = null; hidTarget = null;
    mem.hiddenFound = (mem.hiddenFound || 0) + 1; persist(); T('k.hid');
    var isNew = unlock('s:hidden');
    try { if (navigator.vibrate) navigator.vibrate(30); } catch (e) { /* ignorieren */ }
    if (!busy && !mem.off) visit({ action: 'kiss', side: 'bottom', text: isNew ? 'Du hast Mimi gefunden! Das ist meine kleine Freundin.' : 'Mimi hat sich wieder versteckt. Gut gefunden!' });
  }

  /* ---------- Öffentliche Schnittstelle ---------- */
  var api = {
    visit: visit,
    say: function (text, o) { return visit(Object.assign({ text: text, action: pick(['wave', 'tilt', 'kiss', 'ear']) }, o || {})); },
    cheer: function (text) {
      streak++;
      var party = streakParty();
      var msg = text || (party ? streak + ' richtig in Folge! Konfetti!' : streak >= 3 ? streak + ' richtig in Folge! Wahnsinn!' : nm(pick(CORRECT)));
      if (busy) { showBubble(msg); return; }
      var t = ++tok; busy = true; visible = true; clearTimeout(timer);
      (async function () {
        place(pick(['bottom', 'left', 'right'])); clearActions(); wrap.classList.add('bk-on', 'bk-live', 'bk-happy'); wrap.tabIndex = 0;
        stage('up'); peek.classList.add('bk-a-happy'); seenAcc();
        hearts(4); sparks(5);
        if (!await sleep(500, t)) return; showBubble(msg);
        if (!await sleep(3200, t)) return; await leave(t);
      })();
    },
    comfort: function (text) {
      streak = 0;
      var msg = text || nm(pick(WRONG));
      if (busy) { showBubble(msg); return; }
      var t = ++tok; busy = true; visible = true; clearTimeout(timer);
      (async function () {
        place(pick(['bottom', 'left', 'right'])); clearActions(); wrap.classList.add('bk-on', 'bk-live'); wrap.tabIndex = 0;
        stage('sneak'); if (!await sleep(500, t)) return;
        stage('up'); act('tilt'); seenAcc();
        if (!await sleep(600, t)) return; showBubble(msg);
        if (!await sleep(3400, t)) return; await leave(t);
      })();
    },
    setEnabled: function (on) {
      mem.off = !on; persist();
      if (!on) { tok++; clearTimeout(timer); hideBubble(); hideFriend(); if (wrap) { wrap.classList.remove('bk-on', 'bk-live'); } busy = false; visible = false; }
      else schedule(1500);
      announce();
    },
    setMuted: function (m) { mem.mute = !!m; persist(); T('k.mute', m ? 1 : 0); announce(); },
    album: function () { openAlbum(); },
    /* Zeitweise ruhen lassen (z. B. beim Probelauf), ohne die Einstellung „aus“ zu ändern */
    pause: function (on) {
      on = !!on;
      if (on === paused) return;
      paused = on;
      if (on) { tok++; clearTimeout(timer); hideBubble(); hideFriend(); if (wrap) wrap.classList.remove('bk-on', 'bk-live'); busy = false; visible = false; }
      else if (!mem.off) schedule(4000);
    },
    reload: function () { mem = loadMem(); announce(); },
    setProfile: function (key, name) {
      if (key === KEY) { who = name || ''; return; }
      persist();
      KEY = key; who = name || ''; mem = loadMem();
      tok++; clearTimeout(timer); hideBubble();
      if (wrap) wrap.classList.remove('bk-on', 'bk-live');
      busy = false; visible = false; petCount = 0; streak = 0;
      removeHidden(); announce();
      if (!mem.off) schedule(4000);
    },
    stats: function () { return { credit: credit(), seen: Object.keys(mem.stickers || {}).length, total: STICKERS.length, pets: mem.pets, enabled: !mem.off, muted: !!mem.mute, secrets: Object.keys(mem.secrets).length }; },
    actions: NAMES.slice()
  };
  window.BiberKitten = api;

  function init() {
    build();
    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerdown', function () { userBusy = true; lastActivity = Date.now(); }, { passive: true, capture: true });
    ['pointerup', 'pointercancel', 'dragend', 'drop'].forEach(function (n) {
      document.addEventListener(n, function () { setTimeout(function () { userBusy = false; }, 600); }, { passive: true, capture: true });
    });
    var typed = '';
    document.addEventListener('keydown', function (e) {
      lastActivity = Date.now();
      var el = document.activeElement;
      if (!e.key || e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
      if (el && (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable)) { typed = ''; return; }
      typed = (typed + e.key.toLowerCase()).slice(-4);
      if (typed === 'miau' && !mem.off) {
        typed = '';
        unlock('s:rufen'); trill(); T('k.miau');
        if (!busy) visit({ action: 'wave', side: pick(['bottom', 'left', 'right', 'top']), text: 'Du hast mich gerufen? Miau!' });
        else if (visible) showBubble('Miau! Ich bin doch schon da.');
      }
    }, { passive: true });
    document.addEventListener('biber:result', function (e) {
      var d = (e && e.detail) || {};
      if (d.counted !== false) earn(d.correct ? 3 : 1);
      if (mem.off) return;
      if (d.correct) {
        if (d.counted !== false) {
          mem.correct = (mem.correct || 0) + 1; persist(); friendProgress();
          if (mem.correct >= mem.giftNext) { streak++; gift(); return; }
        }
        api.cheer();
      } else api.comfort();
    });
    document.addEventListener('biber:credit', function (e) { var d = (e && e.detail) || {}; earn(d.n); if (d.correct) friendProgress(); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden && !busy) schedule(); });
    schedule(CFG.first);
    announce();
    setTimeout(placeHidden, 900);
    document.addEventListener('biber:render', function () { removeHidden(); setTimeout(placeHidden, 450); });
    var rz = 0; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(positionHidden, 150); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
