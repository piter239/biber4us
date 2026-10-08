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
  var KEY = 'bk.v1';
  var mem = { off: false, mute: false, seen: {}, pets: 0, secrets: {} };
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) mem = Object.assign(mem, JSON.parse(raw));
  } catch (e) { /* ohne Speicher */ }
  if (!mem.stickers) {
    mem.stickers = {};
    Object.keys(mem.seen || {}).forEach(function (k) { mem.stickers['a:' + k] = true; });
    if (mem.secrets && mem.secrets.zoomies) mem.stickers['s:zoomies'] = true;
  }
  if (!CFG.start && !mem.touched) mem.off = true;
  function persist() { mem.touched = true; try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* ignorieren */ } }

  /* ---------- Stile ---------- */
  var CSS = [
    '.bk-wrap{position:fixed;z-index:2147483000;margin:0;padding:0;border:0;background:none;visibility:hidden;pointer-events:none;-webkit-tap-highlight-color:transparent;overflow:visible;font:inherit}',
    '.bk-wrap.bk-on{visibility:visible}',
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
    /* Versteckte Katze */
    '.bk-hid{position:absolute;z-index:4;width:30px;height:17px;overflow:hidden;cursor:pointer;padding:0;border:0;background:none;-webkit-tap-highlight-color:transparent}',
    '.bk-hid::before{content:"";position:absolute;inset:-10px -8px -6px}',
    '.bk-hid svg{position:absolute;left:0;top:0;width:30px;height:30px;display:block}',
    '.bk-hid:focus-visible{outline:2px solid var(--focus,#0a86a6);outline-offset:3px}',
    '.bk-hid .bk-hidblink{transform-box:fill-box;transform-origin:50% 50%;animation:bk-hblink 5s ease-in-out infinite}',
    '@keyframes bk-hblink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}',
    '.bk-hid.bk-found{animation:bk-hfound .9s ease-out 1 forwards}',
    '@keyframes bk-hfound{0%{transform:translateY(0) scale(1)}30%{transform:translateY(-14px) scale(1.5)}100%{transform:translateY(-30px) scale(1.2);opacity:0}}',
    '.bk-reduced .bk-gift{animation:none}'
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
  var MOUSE = '<svg viewBox="0 0 60 36" aria-hidden="true"><ellipse cx="28" cy="22" rx="22" ry="12" fill="#b8c0c8" stroke="#4a5560" stroke-width="2.4"/><circle cx="46" cy="12" r="6.5" fill="#b8c0c8" stroke="#4a5560" stroke-width="2.4"/><circle cx="52" cy="22" r="2.4" fill="#f4a3b4"/><circle cx="41" cy="19" r="1.8" fill="#222"/><path d="M6 22c-6 0-8 6-2 8" fill="none" stroke="#4a5560" stroke-width="2.4" stroke-linecap="round"/></svg>';

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
  }

  function size() { return window.innerWidth <= 520 ? 108 : 138; }

  function place(s) {
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
    setAcc();
  }

  function sleep(ms, t) {
    return new Promise(function (res) { setTimeout(function () { res(t === tok); }, ms); });
  }
  function stage(name) {
    peek.classList.remove('bk-sneak', 'bk-up', 'bk-pop', 'bk-out');
    if (name) peek.classList.add('bk-' + name);
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
    stretch: { ms: 2600, phrases: ['Strecken tut gut. Probier es auch!', 'Aaah, strecken!'] }
  };
  var NAMES = Object.keys(ACTIONS);
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
    var ws = list.map(function (n) { var x = w[n] || 1; total += x; return x; });
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
  var curAcc = null, accLate = false;
  function setAcc() {
    var d = new Date(), m = d.getMonth() + 1, day = d.getDate(), keys = Object.keys(SEASON);
    var inS = keys.filter(function (k) { return SEASON[k](m, day); });
    var out = keys.filter(function (k) { return inS.indexOf(k) < 0; });
    curAcc = null; accLate = false;
    if (inS.length && Math.random() < 0.8) curAcc = pick(inS);
    else if (Math.random() < 0.2) { curAcc = pick(out); accLate = true; }
    if (curAcc) wrap.setAttribute('data-acc', curAcc); else wrap.removeAttribute('data-acc');
    if (curAcc) unlock('h:' + curAcc);
  }

  function textFor(name, kind) {
    var a = ACTIONS[name], r = Math.random();
    if (kind === 'hard') return pick(HARD);
    if (curAcc && accLate && r < 0.7) return pick(ACC_LATE[curAcc]);
    if (r < 0.3) return null;
    if (r < 0.45) return pick(TIMEPH[dayPart()]);
    if (r < 0.55 && a && a.phrases) return pick(a.phrases);
    return pick(r < 0.9 ? ENCOURAGE : FUN);
  }

  /* ---------- Besuch ---------- */
  async function visit(o) {
    o = o || {};
    if (!wrap) return false;
    var t = ++tok;
    busy = true; visible = true;
    clearTimeout(timer);
    var s = o.side || pick(['bottom', 'bottom', 'left', 'right', 'top']);
    var name = o.action && ACTIONS[o.action] ? o.action : pickAction(reduced ? REDUCED_OK : NAMES);
    var a = ACTIONS[name];
    hideBubble(); clearActions();
    stage(null); peek.classList.add('bk-out'); peek.style.transition = 'none'; void peek.offsetWidth; peek.style.transition = '';
    peek.classList.remove('bk-out');
    place(s);
    wrap.classList.add('bk-on', 'bk-live');
    wrap.tabIndex = 0;
    await sleep(60, t); if (t !== tok) return;
    stage('sneak'); wrap.classList.add('bk-looking');
    if (!await sleep(rnd(900, 1500), t)) return;
    wrap.classList.remove('bk-looking');
    stage('up');
    if (!await sleep(500, t)) return;
    if (a.custom && name === 'peekaboo') {
      stage('out'); if (!await sleep(650, t)) return;
      stage('sneak'); if (!await sleep(500, t)) return;
      stage('up'); if (!await sleep(450, t)) return;
      note(name); showBubble(o.text || 'Kuckuck!'); if (!await sleep(1900, t)) return;
    } else {
      act(name); note(name);
      if (a.run) a.run(t);
      var text = o.text || textFor(name, o.kind);
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
    busy = false; visible = false;
    schedule();
  }

  /* ---------- Streicheln ---------- */
  function onPet(e) {
    if (e) e.stopPropagation();
    var t = ++tok;
    var now = Date.now();
    petCount = now - lastPet < 1600 ? petCount + 1 : 1; lastPet = now;
    mem.pets++; persist();
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
    else text = pick(PET);
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
    meow(1.3); showBubble('Zoomies!', 1400);
    stage('out');
    if (!await sleep(500, t)) return;
    var sides = ['left', 'top', 'right', 'bottom', 'left', 'right'];
    for (var i = 0; i < sides.length; i++) {
      place(sides[i]); clearActions();
      wrap.classList.add('bk-happy'); stage('sneak'); void peek.offsetWidth; stage('pop');
      if (!await sleep(380, t)) return;
      stage('out');
      if (!await sleep(260, t)) return;
    }
    place('bottom'); stage('pop'); wrap.classList.add('bk-happy'); hearts(6); sparks(4); purr(2.2);
    showBubble('Puh! Das war schön. Danke!');
    if (!await sleep(2800, t)) return;
    petCount = 0;
    await leave(t);
  }

  /* ---------- Zeitplan ---------- */
  function canVisit() {
    if (mem.off || document.hidden || busy || userBusy) return false;
    var el = document.activeElement;
    if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return false;
    return true;
  }
  function schedule(delay) {
    clearTimeout(timer);
    if (mem.off) return;
    timer = setTimeout(function tick() {
      if (!canVisit()) { timer = setTimeout(tick, 5000); return; }
      var idle = Date.now() - lastActivity > 75000;
      visit(idle ? { kind: 'hard', action: pick(['tilt', 'wave', 'kiss', 'tail']) } : {});
    }, delay != null ? delay : rnd(CFG.min, CFG.max));
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
  var STICKERS = [
    ['a:wave', 'Winken', 'Das Kätzchen winkt Dir zu.'], ['a:tail', 'Schwanzwedeln', 'Wedelt Dir Glück zu.'], ['a:kiss', 'Katzenkuss', 'Langsames Blinzeln heißt: ich mag Dich.'],
    ['a:yawn', 'Gähnen', 'Auch Kätzchen werden müde.'], ['a:ear', 'Ohrenzucken', 'Es hört Dich nachdenken.'], ['a:wash', 'Pfötchen putzen', 'Gründliche Katzenwäsche.'],
    ['a:tilt', 'Kopf neigen', 'Neugierig und verwundert.'], ['a:butterfly', 'Schmetterling', 'Ein flatterndes Ziel.'], ['a:yarn', 'Wollknäuel', 'Rollt und rollt.'],
    ['a:sleep', 'Einnicken', 'Huch, kurz weggedöst!'], ['a:mouse', 'Spielzeugmaus', 'Anschleichen und zupacken.'], ['a:knock', 'Anklopfen', 'Hallo, ist da jemand?'],
    ['a:peekaboo', 'Kuckuck', 'Weg und wieder da.'], ['a:sneeze', 'Niesen', 'Hatschi!'], ['a:stretch', 'Strecken', 'Aaah, das tut gut.'],
    ['s:zoomies', 'Zoomies', 'Fünfmal schnell streicheln.'], ['s:hidden', 'Mimi', 'Die kleine versteckte Katze.'],
    ['h:xmas', 'Weihnachtsmütze', 'Ho ho ho!'], ['h:silvester', 'Partyhut', 'Prosit Neujahr!'], ['h:halloween', 'Kürbishut', 'Buh!'], ['h:ostern', 'Blumenkranz', 'Frühlingsgefühle.'], ['h:sommer', 'Sonnenbrille', 'Cool bleiben.'],
    ['g:fish', 'Fisch', 'Geschenk für 10 richtige Antworten.'], ['g:mouse', 'Mäuschen', 'Geschenk für 20 richtige Antworten.']
  ];
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
    's:zoomies': { svg: '<path d="M4 60h36M0 84h44M8 108h32" stroke="#0a86a6" stroke-width="5" stroke-linecap="round"/>' },
    'g:fish': { svg: '<g transform="translate(96 112) scale(1.2)">' + FISH.replace(/^<svg[^>]*>/, '').replace('</svg>', '') + '</g>' },
    'g:mouse': { svg: '<g transform="translate(96 112) scale(1.1)">' + MOUSE.replace(/^<svg[^>]*>/, '').replace('</svg>', '') + '</g>' }
  };
  function stickerSvg(id) {
    var kind = id.split(':')[0], key = id.split(':')[1], pr = PROPS[id] || {};
    if (id === 's:hidden') return hidSvg(90);
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
      toast.addEventListener('click', function () { openAlbum(); });
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
    mem.stickers[id] = true; persist();
    var first = Object.keys(mem.stickers).length === 1;
    setTimeout(function () { showToast('Neuer Sticker: ' + stickerName(id) + (first ? ' (Dein Sammelalbum ist im Seitenfuß)' : '')); }, 900);
    announce();
    return true;
  }

  var albumEl = null, albumFrom = null;
  function openAlbum() {
    if (albumEl) return;
    albumFrom = document.activeElement;
    var have = mem.stickers || {};
    var n = Object.keys(have).length;
    albumEl = document.createElement('div'); albumEl.className = 'bk-album-back';
    var items = STICKERS.map(function (s) {
      var got = !!have[s[0]];
      return '<li class="bk-st' + (got ? '' : ' bk-locked') + '">' + (got ? stickerSvg(s[0]) : stickerSvg(s[0] === 's:hidden' ? 'a:wave' : s[0])) +
        '<b>' + (got ? s[1] : '???') + '</b><small>' + (got ? s[2] : 'Noch nicht entdeckt') + '</small></li>';
    }).join('');
    albumEl.innerHTML = '<div class="bk-album" role="dialog" aria-modal="true" aria-label="Kätzchen-Sammelalbum">' +
      '<div class="bk-album-head"><div><h2>Sammelalbum</h2><p>' + n + ' von ' + STICKERS.length + ' Stickern gesammelt. Das Kätzchen hat noch mehr Überraschungen auf Lager.</p></div>' +
      '<button type="button" class="bk-album-close">Schließen</button></div><ul class="bk-grid">' + items + '</ul></div>';
    document.body.appendChild(albumEl);
    var close = albumEl.querySelector('.bk-album-close');
    close.focus();
    function closeAlbum() {
      if (!albumEl) return;
      albumEl.remove(); albumEl = null; document.removeEventListener('keydown', onKey, true);
      if (albumFrom && albumFrom.focus) try { albumFrom.focus(); } catch (e) { /* ignorieren */ }
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); closeAlbum(); }
      else if (e.key === 'Tab') { e.preventDefault(); close.focus(); }
    }
    document.addEventListener('keydown', onKey, true);
    close.addEventListener('click', closeAlbum);
    albumEl.addEventListener('click', function (e) { if (e.target === albumEl) closeAlbum(); });
  }

  /* ---------- Geschenke ---------- */
  function gift(n) {
    var fish = (n / 10) % 2 === 1;
    var t = ++tok; busy = true; visible = true; clearTimeout(timer);
    (async function () {
      place(pick(['bottom', 'left', 'right'])); clearActions();
      wrap.classList.add('bk-on', 'bk-live'); wrap.tabIndex = 0;
      stage('up'); wrap.classList.add('bk-happy'); peek.classList.add('bk-a-happy');
      if (!await sleep(550, t)) return;
      addFx(fish ? FISH : MOUSE, 'bk-gift', '', 5200);
      trill(); hearts(3); sparks(5);
      showBubble(n + ' richtige Antworten! Das ist für Dich: ' + (fish ? 'ein Fisch!' : 'ein Mäuschen!'), 4200);
      unlock(fish ? 'g:fish' : 'g:mouse');
      if (!await sleep(4600, t)) return;
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
    mem.hiddenFound = (mem.hiddenFound || 0) + 1; persist();
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
      var msg = text || (streak >= 3 ? streak + ' richtig in Folge! Wahnsinn!' : pick(CORRECT));
      if (busy) { showBubble(msg); return; }
      var t = ++tok; busy = true; visible = true; clearTimeout(timer);
      (async function () {
        place(pick(['bottom', 'left', 'right'])); clearActions(); wrap.classList.add('bk-on', 'bk-live', 'bk-happy'); wrap.tabIndex = 0;
        stage('up'); peek.classList.add('bk-a-happy');
        hearts(4); sparks(5);
        if (!await sleep(500, t)) return; showBubble(msg);
        if (!await sleep(3200, t)) return; await leave(t);
      })();
    },
    comfort: function (text) {
      streak = 0;
      var msg = text || pick(WRONG);
      if (busy) { showBubble(msg); return; }
      var t = ++tok; busy = true; visible = true; clearTimeout(timer);
      (async function () {
        place(pick(['bottom', 'left', 'right'])); clearActions(); wrap.classList.add('bk-on', 'bk-live'); wrap.tabIndex = 0;
        stage('sneak'); if (!await sleep(500, t)) return;
        stage('up'); act('tilt');
        if (!await sleep(600, t)) return; showBubble(msg);
        if (!await sleep(3400, t)) return; await leave(t);
      })();
    },
    setEnabled: function (on) {
      mem.off = !on; persist();
      if (!on) { tok++; clearTimeout(timer); hideBubble(); if (wrap) { wrap.classList.remove('bk-on', 'bk-live'); } busy = false; visible = false; }
      else schedule(1500);
      announce();
    },
    setMuted: function (m) { mem.mute = !!m; persist(); announce(); },
    album: openAlbum,
    stats: function () { return { seen: Object.keys(mem.stickers || {}).length, total: STICKERS.length, pets: mem.pets, enabled: !mem.off, muted: !!mem.mute, secrets: Object.keys(mem.secrets).length }; },
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
    document.addEventListener('keydown', function () { lastActivity = Date.now(); }, { passive: true });
    document.addEventListener('biber:result', function (e) {
      var d = (e && e.detail) || {};
      if (mem.off) return;
      if (d.correct) {
        if (d.counted !== false) { mem.correct = (mem.correct || 0) + 1; persist(); }
        if (d.counted !== false && mem.correct % 10 === 0) { gift(mem.correct); return; }
        api.cheer();
      } else api.comfort();
    });
    document.addEventListener('visibilitychange', function () { if (!document.hidden && !busy) schedule(); });
    schedule(CFG.first);
    announce();
    setTimeout(placeHidden, 900);
    document.addEventListener('biber:render', function () { removeHidden(); setTimeout(placeHidden, 450); });
    var rz = 0; window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(positionHidden, 150); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
