/* Aufgabe Brückentrolle (Biber 2018, Seite 18): Funktionen hintereinander schalten (EVA-Prinzip) */
(function () {
  'use strict';
  var h = Biber.h;
  var P = 't-brueckentrolle18';

  /* ---------- Modell ---------- */
  var ITEM = {
    W: { name: 'Holz', art: 'ein Stück Holz', sym: P + '-i-w', vb: [17.3, 25.2] },
    F: { name: 'Fisch', art: 'einen Fisch', sym: P + '-i-f', vb: [42.5, 25.1] },
    K: { name: 'Karotte', art: 'eine Karotte', sym: P + '-i-k', vb: [22, 34.5] }
  };
  /* Troll: ersetzt 'in' durch 'out', alles andere lässt er durch */
  var TROLL = {
    t1: { i: 'K', o: 'F', x: 50, y: 122 },
    t2: { i: 'F', o: 'W', x: 150, y: 122 },
    t3: { i: 'W', o: 'F', x: 260, y: 122 },
    t4: { i: 'K', o: 'F', x: 150, y: 212 },
    t6: { i: 'K', o: 'F', x: 260, y: 212 },
    t5: { i: 'W', o: 'K', x: 100, y: 332 },
    t7: { i: 'K', o: 'W', x: 100, y: 480 },
    t8: { i: 'F', o: 'K', x: 100, y: 566 }
  };
  var RIVER = { 1: ['t1', 't5', 't7', 't8'], 2: ['t2', 't4', 't5', 't7', 't8'], 3: ['t3', 't6', 't7', 't8'] };
  var SRC = { 1: 50, 2: 150, 3: 260 };
  var RCOL = { 1: 'var(--c6)', 2: 'var(--c4)', 3: 'var(--c1)' };
  var OPTIONS = [
    { key: 'A', item: 'F', river: 1 },
    { key: 'B', item: 'F', river: 2 },
    { key: 'C', item: 'K', river: 3 },
    { key: 'D', item: 'W', river: 3 }
  ];

  /* Weg eines Gegenstands: Liste von Schritten { troll, before, after } */
  function run(item, river) {
    var cur = item, steps = [];
    RIVER[river].forEach(function (id) {
      var t = TROLL[id], next = cur === t.i ? t.o : cur;
      steps.push({ troll: id, before: cur, after: next, changed: next !== cur });
      cur = next;
    });
    return { steps: steps, out: cur };
  }
  /* alle richtigen Antworten laut Modell (gegen das Heft: genau B) */
  var RIGHT = OPTIONS.map(function (o, i) { return run(o.item, o.river).out === 'W' ? i : -1; }).filter(function (i) { return i >= 0; });

  /* ---------- Grafik ---------- */
  var ART = {
    W: '<path fill="#ffffff" d="M 0.4 19.5 C 0.4 21.3 1 23.1 3.3 24.5 C 4.7 24.9 6.6 25.2 9.4 25.2 C 11.8 25 17.3 24.1 15.9 20.2 C 16.5 15.5 16.6 15.5 16.6 15.6 C 16.6 15.6 16.2 15.6 16.1 2.3 C 14.7 0 9.7 0.1 8.8 0.1 C 4.6 0.3 0.6 0.6 0.6 2.5 L 0.8 12.3 C 1.3 14.6 0.4 17.2 0.4 19.5"/><path fill="#4a1a0d" d="M 4.1 4.8 C 9.8 6.5 10.3 4.1 14.7 3.6 C 14.9 22.2 15.6 10.4 14.6 19.7 C 15.7 22.8 11.2 23.6 9.2 23.7 C 7 23.7 5.4 23.5 4.3 23.1 C 0 20.5 2.9 16.5 2.2 13.2 L 2.1 3.8 C 2.1 2.8 2.7 4.4 4.1 4.8"/><path fill="#cd7b51" d="M 10.7 5.4 C 3.6 6 2.3 4.6 2.4 3.3 C 2.4 2 5.5 1.8 8.7 1.8 C 13.8 1.8 14.3 2.4 14.2 3.8 C 14.2 3.8 14.2 5 10.7 5.4"/><path fill="none" stroke="#4a1a0d" stroke-width="0.56" stroke-linejoin="round" stroke-linecap="round" d="M 10.7 5.4 C 3.6 6 2.3 4.6 2.4 3.3 C 2.4 2 5.5 1.8 8.7 1.8 C 13.8 1.8 14.3 2.4 14.2 3.8 C 14.2 3.8 14.2 5 10.7 5.4 Z M 10.7 5.4"/><path fill="#832c11" d="M 9.8 7 C 9.3 7.6 10 7.2 9.4 8.7 C 9.8 12 10.5 13.1 10.3 17 C 10.3 18.1 9.9 19.5 10.2 20.7 C 10.3 20.9 10.5 20.9 10.6 20.9 C 11.4 20.9 11.2 17.2 11.2 17 C 11.3 14.6 11.4 12.1 10.5 9.8 C 10.3 9.4 10.4 8.7 10.7 7.9 C 10.9 7.8 11 7.7 11.1 7.7 C 11.7 7.7 11.9 9.1 12.1 10.5 C 12.3 11.8 12.3 13.2 12.4 13.2 L 12.4 13.1 C 12.8 12.2 12.4 9.4 12.4 8.6 C 12.4 8.3 12.3 7.9 12.2 7.7 C 12 7.4 11.8 7.2 11.4 7 L 9.8 7 M 11.2 7 L 11.2 7 L 11.4 7 L 11.6 7.1 C 11.6 7.1 11.6 7 11.5 7 C 11.4 7 11.2 7 11.2 7"/><path fill="#832c11" d="M 6 16.8 C 4.4 17.1 4.3 20.1 5.9 21 C 5.9 21.1 6 21.1 6.1 21.1 C 6.4 21.1 6.7 20.9 6.4 20.7 C 5.1 19.8 5.3 18.4 6.3 17.2 C 6.4 17 6.2 16.8 6 16.8"/><path fill="#832c11" d="M 6.5 8.7 C 3.7 9.5 6.2 14.3 6.4 15.3 C 6.5 15.4 6.7 15.5 6.9 15.5 C 7.1 15.5 7.4 15.4 7.3 15.2 C 6.2 10.7 5.1 13.5 7 9 C 7 8.9 6.8 8.7 6.5 8.7"/><path fill="none" stroke="#fabb95" stroke-width="0.27" stroke-linejoin="round" stroke-linecap="round" d="M 11.2 4.8 C 13.4 4.5 12.5 3.2 12.1 2.6"/><path fill="none" stroke="#fabb95" stroke-width="0.28" stroke-linejoin="round" stroke-linecap="round" d="M 5 2.5 C 3.6 2.4 4 4 4.9 4.2 C 5.7 4.5 7.2 4.6 7.5 4.6 M 5.6 3 C 5 4.4 7.9 4.2 10.1 4.4 M 6.5 2.9 C 6.4 3.3 6.9 3.6 7.5 3.8 C 9.9 4.4 13.7 3.3 10 2.6 C 9 2 5.5 2.6 8.3 3.1"/>',
    F: '<path fill="#308a2e" d="M 42.1 7.4 C 41.7 9.7 36.4 11 33 12.3 L 33 11.9 C 29.1 7.4 18.2 0 14 1.6 C 7.3 2.9 4.4 6.4 4.1 10.1 C 3.5 9.7 2.9 9.7 2.4 10.4 C 1.7 11.2 4.7 13.2 3.8 12.8 C 0.1 11.5 3.7 17.2 4.4 15.1 C 4.7 14.5 4.4 14.5 4.8 13.9 C 6.3 17.7 10.5 20.9 16 21.1 C 22.9 19.8 27.2 17.6 32.3 15.1 C 33.9 20.4 41 25 40.2 21.2 C 39.6 18.6 42.5 10.1 42.1 7.4"/><path fill="none" stroke="#ffffff" stroke-width="4.03" stroke-linejoin="round" stroke-linecap="round" d="M 42.1 7.4 C 41.7 9.7 36.4 11 33 12.3 L 33 11.9 C 29.1 7.4 18.2 0 14 1.6 C 7.3 2.9 4.4 6.4 4.1 10.1 C 3.5 9.7 2.9 9.7 2.4 10.4 C 1.7 11.2 4.7 13.2 3.8 12.8 C 0.1 11.5 3.7 17.2 4.4 15.1 C 4.7 14.5 4.4 14.5 4.8 13.9 C 6.3 17.7 10.5 20.9 16 21.1 C 22.9 19.8 27.2 17.6 32.3 15.1 C 33.9 20.4 41 25 40.2 21.2 C 39.6 18.6 42.5 10.1 42.1 7.4 Z M 42.1 7.4"/><path fill="#308a2e" d="M 42 7.4 C 41.5 9.8 36.3 11 32.8 12.3 L 32.9 12 C 28.9 7.5 18.1 0.1 13.8 1.6 C 7.2 3 4.3 6.5 4 10.2 C 3.4 9.7 2.8 9.8 2.2 10.5 C 1.6 11.2 4.6 13.3 3.6 12.9 C 0 11.6 3.5 17.3 4.2 15.1 C 4.6 14.5 4.3 14.5 4.7 14 C 6.2 17.8 10.4 21 15.9 21.1 C 22.8 19.9 27 17.7 32.1 15.1 C 33.8 20.5 40.9 25.1 40 21.3 C 39.4 18.7 42.3 10.2 42 7.4"/><path fill="#ffffff" d="M 10.4 6.3 C 12 6.6 13 8.3 12.6 9.9 C 12.2 11.5 10.6 12.5 9 12.1 C 7.4 11.7 6.5 10.1 6.9 8.5 C 7.2 6.8 8.9 5.9 10.4 6.3"/><path fill="#08090a" d="M 9.7 7.5 C 10.6 7.7 11.2 8.7 11 9.6 C 10.7 10.5 9.8 11.1 8.9 10.9 C 8 10.6 7.4 9.7 7.7 8.8 C 7.9 7.8 8.8 7.3 9.7 7.5"/>',
    K: '<path fill="#567c18" d="M 2.3 1 C 1.7 0.9 1.3 1.1 1.1 1.6 C 4.8 1.6 7.4 9.4 7.9 11.5 C 5.4 11.3 3.2 11.4 2.3 12.2 C 0.1 14.1 5.5 32.2 9.1 33.7 C 10.8 34.5 14.4 22 14.8 20.9 C 16.4 17 21.8 13 14 12.3 C 13.3 12.2 12.5 12.1 11.7 11.9 C 12.4 10.9 13.8 10.4 14.7 9.1 C 14.2 8.1 17.5 5 19.2 3.5 C 16.1 5.5 13.3 3 12.1 9.4 C 12.4 6.5 12.1 3 9.2 1.7 C 9 1.6 12.3 8.1 9.8 11.7 C 9.6 11.7 9.5 11.6 9.4 11.6 C 10.6 7 5 1.1 2.3 1 M 19.2 3.5 C 19.4 3.4 19.7 3.2 19.9 3 C 20.6 2.4 20.1 2.7 19.2 3.5"/><path fill="none" stroke="#ffffff" stroke-width="1.36" stroke-linejoin="miter" stroke-linecap="butt" d="M 2.3 1 C 1.7 0.9 1.3 1.1 1.1 1.6 C 4.8 1.6 7.4 9.4 7.9 11.5 C 5.4 11.3 3.2 11.4 2.3 12.2 C 0.1 14.1 5.5 32.2 9.1 33.7 C 10.8 34.5 14.4 22 14.8 20.9 C 16.4 17 21.8 13 14 12.3 C 13.3 12.2 12.5 12.1 11.7 11.9 C 12.4 10.9 13.8 10.4 14.7 9.1 C 14.2 8.1 17.5 5 19.2 3.5 C 16.1 5.5 13.3 3 12.1 9.4 C 12.4 6.5 12.1 3 9.2 1.7 C 9 1.6 12.3 8.1 9.8 11.7 C 9.6 11.7 9.5 11.6 9.4 11.6 C 10.6 7 5 1.1 2.3 1 Z M 19.2 3.5 C 19.4 3.4 19.7 3.2 19.9 3 C 20.6 2.4 20.1 2.7 19.2 3.5 Z M 19.2 3.5"/><path fill="#3a8527" d="M 10.5 13.6 C 10.6 11.7 13.7 11.4 14.9 9.6 C 14.1 8.1 22 1.7 20.1 3.5 C 16.5 6.6 13.4 2.7 12.1 10.8 C 12 11.1 11.2 13.8 11.4 13.9 C 11.4 14 14.4 4.5 9.4 2.3 C 9.2 2.2 13 9.7 9.3 13 C 13.2 9.5 3.4 0 1.2 2.1 C 5.2 2.1 7.9 10.8 8.1 12.3"/><path fill="#f2591a" d="M 14.7 21 C 14.3 22.1 10.7 34.5 9 33.8 C 5.4 32.2 0 14.2 2.2 12.2 C 3.9 10.8 9.7 11.6 13.9 12.4 C 21.7 13.1 16.3 17 14.7 21"/><path fill="none" stroke="#f2591a" stroke-width="0.21" stroke-linejoin="miter" stroke-linecap="butt" d="M 14.7 21 C 14.3 22.1 10.7 34.5 9 33.8 C 5.4 32.2 0 14.2 2.2 12.2 C 3.9 10.8 9.7 11.6 13.9 12.4 C 21.7 13.1 16.3 17 14.7 21 Z M 14.7 21"/>'
  };
  var KATJA = '<path fill="#cd7c51" d="M 8.2 9.7 C 6.7 8.1 5.2 7.6 3.8 6.2 C 2.2 9.3 3.8 16.9 4.2 19.4"/><path fill="#fbc4ca" d="M 4.1 7.3 C 5.5 8.6 6.1 8.9 7.4 10.2 C 6.1 13.4 5.8 15.8 4.5 19 C 4.2 16.7 2.6 6.1 4.1 7.3"/><path fill="#cd7b51" d="M 20 8.6 C 21.5 7 22.2 6.5 23.6 5.2 C 25.2 8.2 24.9 16.8 24.5 19.3 L 20 8.6"/><path fill="#fac3c9" d="M 22.9 6.6 C 21.5 7.8 21.3 8.3 20 9.6 C 21.3 12.8 22.6 16 23.8 19.2 C 24.4 17.8 24.6 5.6 22.9 6.6"/><path fill="#cd7b51" d="M 3.4 25.8 C 4.1 17.7 1.9 9.8 13.2 7.6 C 14.1 4.3 6 4.2 11.8 4.8 C 13.7 4.7 13.7 6.3 15.1 7.5 C 14.5 2.8 13.8 0 16.4 7.6 C 16.8 0.8 16.9 0.4 17.1 7.3 C 18 4.6 20.5 4.8 20.5 5.1 C 20.5 5.1 19.1 5.1 18.4 5.8 C 17.7 6.5 17.9 6.6 17.5 7.6 C 22.2 8.2 24.1 13.9 24.9 18.2 C 25.2 20.2 24.7 22.7 24.7 24.6 C 27.8 32.3 23.5 36.5 15.7 38.3 C 13.4 38.9 11 38.7 8.8 37.8 C 0 33.7 2.5 32.2 3.4 25.8"/><path fill="#f7909c" stroke="#4e0811" stroke-width="0.03" stroke-linejoin="miter" stroke-linecap="butt" d="M 8.9 35.3 C 11.5 38.4 13.6 38.4 16.6 35.3 Z M 8.9 35.3"/><path fill="#ffffff" stroke="#08090a" stroke-width="0.02" stroke-linejoin="miter" stroke-linecap="butt" d="M 14.5 28.8 L 15.3 31.9 L 14.9 36.4 L 12.8 37.1 L 12.7 27.9 Z M 14.5 28.8"/><path fill="#ffffff" stroke="#08090a" stroke-width="0.02" stroke-linejoin="miter" stroke-linecap="butt" d="M 10.9 28.8 L 10.1 31.9 L 10.6 36.4 L 12.7 37.1 L 12.8 27.9 Z M 10.9 28.8"/><path fill="#7e0f17" d="M 12.1 31 L 13.2 31 L 13.2 35.9 L 12.1 35.9 Z M 12.1 31"/><path fill="#fabb96" d="M 12.4 35.6 C 12.8 36.2 10.5 37.2 7.8 34.9 C 4.8 30.8 9.4 26.8 12.4 26.6 C 13.4 26.8 13 27.6 13 27.6 Z M 12.4 35.6"/><path fill="#fabb96" d="M 13 35.5 C 12.6 36.2 14.9 37.1 17.6 34.8 C 20.6 30.8 16 26.7 13 26.6 C 12 26.8 12.5 27.6 12.5 27.6 Z M 13 35.5"/><path fill="#782911" d="M 10.6 28.5 C 9.5 31 10.9 31.8 12.8 31.8 C 14.4 32.1 15.4 30.3 14.8 28.8 C 12.7 26.4 12.7 26.5 10.6 28.5"/><path fill="#ffffff" d="M 11.9 23.8 C 12 24.3 12 25.2 12 25.2 C 9.1 25.3 8.4 26.1 7.1 26.4 C 7.1 26.4 6.5 21.1 8.8 20.8 C 10.6 20.6 11.8 22.2 11.9 23.8"/><path fill="#08090a" d="M 9.8 21.4 C 9.1 21.5 8.5 22.4 8.6 23.4 C 8.7 24.4 9.4 25.2 10.2 25.1 C 11 25 11.6 24.1 11.5 23.1 C 11.4 22.1 10.6 21.4 9.8 21.4"/><path fill="#ffffff" d="M 10.4 22 C 10.1 22 10 22.3 10 22.6 C 10 22.9 10.2 23.2 10.5 23.2 C 10.7 23.1 10.9 22.9 10.9 22.5 C 10.8 22.2 10.6 22 10.4 22"/><path fill="none" stroke="#08090a" stroke-width="1.09" stroke-linejoin="round" stroke-linecap="round" d="M 11.4 21 C 11.6 20.5 12 19.9 11.7 19.5 M 10.4 20.4 C 10.8 20.4 11 19.5 10.8 19.2 M 9.7 20.2 C 9.9 19.9 10.1 18.8 9.6 18.7 M 8.7 20.3 C 8.7 19.9 8.7 19.4 8.4 19.1 M 7.9 20.4 C 7.9 19.7 7.6 19.5 7 19.6"/><path fill="#ffffff" d="M 19.7 24.4 C 19.7 24.8 19.2 27 19.2 27 C 17.1 25.8 15.8 25.2 14.5 25.3 C 14.5 25.3 14.9 20.7 17.2 20.8 C 19.1 21 19.9 22.8 19.7 24.4"/><path fill="#08090a" d="M 18.1 21.6 C 17.3 21.6 16.6 22.3 16.5 23.3 C 16.4 24.3 17 25.2 17.8 25.3 C 18.6 25.4 19.3 24.6 19.4 23.6 C 19.5 22.6 18.9 21.7 18.1 21.6"/><path fill="#ffffff" d="M 18.5 22.3 C 18.3 22.3 18.1 22.5 18 22.8 C 18 23.1 18.2 23.4 18.4 23.4 C 18.7 23.5 18.9 23.2 18.9 22.9 C 18.9 22.6 18.8 22.3 18.5 22.3"/><path fill="none" stroke="#08090a" stroke-width="0.08" stroke-linejoin="round" stroke-linecap="round" d="M 15.8 20.5 C 15.8 20 15.6 19.3 16 19 M 17 20.3 C 16.6 20.1 16.6 19.2 16.9 19 M 17.7 20.3 C 17.6 19.9 17.7 18.8 18.3 18.8 M 18.6 20.5 C 18.8 20.2 18.9 19.7 19.3 19.6 M 19.4 20.9 C 19.6 20.3 19.9 20.2 20.5 20.4"/><path fill="none" stroke="#4a1a0e" stroke-width="0.08" stroke-linejoin="round" stroke-linecap="round" d="M 12.7 27.2 C 12.5 29.2 12.3 30 12.7 31.4"/><path fill="none" stroke="#08090a" stroke-width="0.04" stroke-linejoin="miter" stroke-linecap="butt" d="M 16.6 31.2 C 18.3 30.7 24.7 33 26.9 35.9 M 16.2 32.7 C 19.1 30.9 27.1 38.3 26.2 38.4 M 8.6 30.9 C 6.8 31.1 5 32 3.5 33.1 C 3 33.5 2.4 34 1.8 34.4 M 9.2 31.9 C 7.4 32.2 3.4 36.5 2.7 38"/><path fill="#781d8d" d="M 11.8 12.7 C 11.4 12.3 11.3 12.1 11.3 11.6 C 11.3 11 11.6 10.3 12.3 9.7 C 12.7 9.3 13 9.1 13.6 8.8 C 14.1 8.5 14.6 8.3 14.7 8.1 C 14.8 8 14.8 8 14.9 8 C 15 8.1 15.1 8.1 15.2 8.1 C 15.5 8.2 15.7 8.3 15.8 8.4 C 15.2 9.3 14.1 9.1 13.6 9.6 C 13 10.2 12.2 11.1 12.3 11.8 C 12.9 13 12.9 13.9 11.8 12.7"/><path fill="#781d8d" d="M 18.4 10.6 C 18.1 10.4 16.8 9.4 16.6 9.2 C 16.3 8.9 15.8 8.7 16 8.3 C 16.6 8.2 16.8 7.7 17.1 8 C 17.4 8.2 17.2 8.5 17.8 8.7 C 18.5 9 18.8 9.1 19.2 9.5 C 20.5 11 18.6 18 18.9 13.2 C 18.9 12.3 18.9 11.3 18.4 10.6"/><path fill="#781d8d" d="M 11.5 3.4 C 11.1 3.4 11.1 3.4 10.9 3.5 C 10.6 3.6 10.4 3.8 10.2 4.1 C 10.1 4.3 10.1 4.4 10.1 4.6 C 10.1 4.9 10.2 5 10.4 5.4 C 10.6 5.9 10.6 5.9 10.6 6.2 C 10.6 6.4 10.5 6.6 10.4 7 C 10 8.1 10.3 8.9 11 9.1 C 11.7 9.3 12.6 9.1 13.4 8.6 C 13.8 8.3 14.7 7.6 14.8 7.4 C 15.1 7.1 15 6.8 14.1 5.7 C 13.2 4.3 12.8 3.8 12.1 3.5 C 11.9 3.4 11.8 3.4 11.5 3.4 M 11.5 3.9 C 11.6 3.9 11.8 4 12 4.1 C 12.8 4.4 13.4 5 14.1 6 C 14.3 6.4 14.5 6.7 14.6 6.8 L 14.5 7 C 14.4 7.1 14.3 7.1 14.2 7.1 C 13.9 7.1 13.2 6.8 12.5 6.3 C 11.6 5.7 11.2 5.3 11 4.9 C 10.9 4.6 10.9 4.4 11 4.2 C 11.1 4 11.3 3.9 11.5 3.9"/><path fill="#781d8d" d="M 20.5 3.4 C 20.2 3.4 19.9 3.4 19.7 3.6 C 19.1 3.9 18.7 4.3 17.7 5.7 C 16.9 6.8 16.8 7.1 17.1 7.4 C 17.1 7.5 17.4 7.8 17.7 8 C 18.6 8.7 19.1 9 19.8 9.1 C 20.3 9.2 20.9 9.2 21.2 9 C 21.7 8.7 21.8 7.9 21.5 7 C 21.3 6.6 21.3 6.4 21.3 6.2 C 21.3 5.9 21.3 5.9 21.5 5.4 C 21.7 5 21.7 4.9 21.8 4.6 C 21.8 4.3 21.8 4.3 21.7 4.1 C 21.4 3.6 21 3.4 20.5 3.4 M 20.4 3.9 C 20.7 3.9 21 4.2 21 4.5 C 20.9 4.7 20.8 5.1 20.6 5.3 C 20.1 5.9 18.8 6.7 18.1 7 C 17.7 7.1 17.5 7.1 17.4 7 L 17.3 6.8 C 17.4 6.6 18.3 5.3 18.6 5 C 19.1 4.5 19.8 4 20.3 3.9 L 20.4 3.9"/><path fill="#781d8d" d="M 15.6 8.1 C 15.1 8 15.1 7.9 15.1 7.4 C 15.2 7.1 15.2 7.1 15.1 6.9 C 15 6.7 15 6.6 15.4 6.4 C 16.1 6 16.7 6.3 16.7 7 C 16.7 7.2 16.8 7.3 16.8 7.4 C 16.8 7.6 16.8 7.6 16.7 7.8 C 16.6 8.1 16 8.2 15.6 8.1"/><path fill="#edcebc" d="M 21.5 7.1 L 21.5 7.2 Z M 21.5 7.1"/><path fill="#b774c0" d="M 18.1 7.8 C 18.1 7.8 18.1 7.8 18.5 8.1 C 19.1 8.6 19.5 8.8 20 8.9 C 20.2 9 20.3 9 20.4 9 C 20.7 9 20.9 8.9 21.1 8.8 C 21.3 8.7 21.4 8.5 21.4 8.2 C 21.3 8.3 21.3 8.4 21.2 8.5 C 21 8.6 20.7 8.6 20.5 8.6 C 19.7 8.6 18.8 8.3 18.5 8 C 18.3 7.9 18.1 7.8 18.1 7.8"/><path fill="#b774c0" d="M 14 7.5 C 14 7.5 13.8 7.6 13.6 7.7 C 13.3 8 12.4 8.3 11.6 8.3 C 11.3 8.3 11.1 8.3 10.9 8.2 C 10.8 8.1 10.7 8 10.7 7.9 C 10.7 8.2 10.8 8.4 11 8.6 C 11.1 8.6 11.4 8.7 11.7 8.7 C 11.8 8.7 11.9 8.7 12.1 8.7 C 12.6 8.5 13 8.3 13.6 7.8 C 13.9 7.6 14 7.5 14 7.5"/><path fill="#b774c0" d="M 16.7 8.6 L 16.6 8.6 C 16.4 9 16.9 9.2 17.1 9.4 C 17.2 9.5 18.4 10.4 18.6 10.6 C 19 11.1 19.1 12 19.1 12.8 C 19 13.8 19 14.1 19.1 14.1 C 19.2 14.1 19.2 14 19.3 13.9 L 19.3 13.9 C 19.2 13.9 19.1 13.5 19.2 12.5 C 19.3 11.7 19.2 10.9 18.8 10.3 C 18.5 10.1 17.4 9.2 17.3 9.1 C 17.1 8.9 16.8 8.8 16.7 8.6"/>';
  var JUSTUS = '<path fill="#c36231" stroke="#08090a" stroke-width="0.05" stroke-linejoin="miter" stroke-linecap="butt" d="M 21.7 9.3 L 21.3 6.3 C 21.3 6.3 21 3.5 23.1 3.4 C 25.2 3.4 26.4 8 26.4 8 L 25.1 7.8 Z M 21.7 9.3"/><path fill="#c36231" d="M 4.4 9.5 C 3.4 10.3 3.4 12 4.4 13.3 C 5.4 14.6 7.1 15.1 8.1 14.3 C 9.2 13.5 9.2 11.7 8.1 10.4 C 7.1 9.1 5.4 8.7 4.4 9.5"/><path fill="none" stroke="#08090a" stroke-width="0.1" stroke-linejoin="miter" stroke-linecap="round" d="M 4.4 9.5 C 3.4 10.3 3.4 12 4.4 13.3 C 5.4 14.6 7.1 15.1 8.1 14.3 C 9.2 13.5 9.2 11.7 8.1 10.4 C 7.1 9.1 5.4 8.7 4.4 9.5 Z M 4.4 9.5"/><path fill="#c36231" d="M 27.5 10.2 C 28.5 11 28.5 12.7 27.5 14 C 26.4 15.4 24.8 15.8 23.8 15 C 22.7 14.2 22.7 12.5 23.8 11.1 C 24.8 9.8 26.5 9.4 27.5 10.2"/><path fill="none" stroke="#08090a" stroke-width="0.1" stroke-linejoin="miter" stroke-linecap="round" d="M 27.5 10.2 C 28.5 11 28.5 12.7 27.5 14 C 26.4 15.4 24.8 15.8 23.8 15 C 22.7 14.2 22.7 12.5 23.8 11.1 C 24.8 9.8 26.5 9.4 27.5 10.2 Z M 27.5 10.2"/><path fill="#954c28" d="M 3.6 23.8 C 4 22.4 7.6 9.7 7.6 9.7 C 7.6 9.7 13.2 7.4 16.1 7.5 C 19.1 7.6 23.5 7.9 23.5 7.9 L 27.3 23.7 C 24 28.4 21 36.3 15.1 36.2 C 9.2 35.9 5.5 28.9 3.6 23.8"/><path fill="none" stroke="#08090a" stroke-width="0.05" stroke-linejoin="miter" stroke-linecap="butt" d="M 3.6 23.8 C 4 22.4 7.6 9.7 7.6 9.7 C 7.6 9.7 13.2 7.4 16.1 7.5 C 19.1 7.6 23.5 7.9 23.5 7.9 L 27.3 23.7 C 24 28.4 21 36.3 15.1 36.2 C 9.2 35.9 5.5 28.9 3.6 23.8 Z M 3.6 23.8"/><path fill="#ffffff" stroke="#08090a" stroke-width="0.03" stroke-linejoin="miter" stroke-linecap="butt" d="M 18.8 26.1 L 20.3 29.1 L 19.5 33.4 L 15.3 34.1 L 15.1 25.3 Z M 18.8 26.1"/><path fill="#ffffff" stroke="#08090a" stroke-width="0.03" stroke-linejoin="miter" stroke-linecap="butt" d="M 11.6 26.1 L 10 29.1 L 10.9 33.4 L 15.1 34.1 L 15.3 25.3 Z M 11.6 26.1"/><path fill="#c36131" stroke="#08090a" stroke-width="0.05" stroke-linejoin="miter" stroke-linecap="butt" d="M 10.4 19.8 C 10.4 19.8 6.6 20 4.6 21 C 3.7 21.5 0 29.3 3 24.9 C 3 24.9 2.7 26 2.5 27.3 C 2.4 28.6 3.1 31 3.3 30.6 C 4.3 28.2 4.4 27.6 4.1 29.9 C 4.2 32.4 4.9 32.6 4.9 32.6 C 5.6 31.9 6.4 30.5 6.3 31.1 C 5.9 32.3 5.9 33.8 6.4 33.5 C 9.4 31.8 15 31.6 15 31.6 L 16 20.4 Z M 10.4 19.8"/><path fill="#c36131" stroke="#08090a" stroke-width="0.05" stroke-linejoin="miter" stroke-linecap="butt" d="M 19.9 19.8 C 19.9 19.8 23.7 20 25.8 21 C 26.7 21.5 30.4 29.3 27.3 24.9 C 27.3 24.9 27.7 26 27.8 27.3 C 28 28.6 27.3 31 27.1 30.6 C 26 28.2 26 27.6 26.3 29.9 C 26.2 32.4 25.4 32.6 25.4 32.6 C 24.7 31.9 24 30.5 24.1 31.1 C 24.5 32.3 24.4 33.8 23.9 33.5 C 21 31.8 15.4 31.6 15.4 31.6 L 14.3 20.4 Z M 19.9 19.8"/><path fill="#08090a" d="M 9.7 19.7 C 11.1 18.1 13.6 18.6 15.8 18.6 C 18 18.6 21.3 18 22.8 19.7 C 24.2 21.4 22.2 23.7 20.8 25.5 C 19.5 27.3 18.1 28.2 15.8 28.1 C 13.5 28.1 11.8 27.1 10.6 25.3 C 9.3 23.6 8.3 21.3 9.7 19.7"/><path fill="none" stroke="#08090a" stroke-width="0.08" stroke-linejoin="miter" stroke-linecap="round" d="M 9.7 19.7 C 11.1 18.1 13.6 18.6 15.8 18.6 C 18 18.6 21.3 18 22.8 19.7 C 24.2 21.4 22.2 23.7 20.8 25.5 C 19.5 27.3 18.1 28.2 15.8 28.1 C 13.5 28.1 11.8 27.1 10.6 25.3 C 9.3 23.6 8.3 21.3 9.7 19.7 Z M 9.7 19.7"/><path fill="#ffffff" d="M 17.8 19.5 C 20.3 19.5 22.3 20 22.3 20.6 C 22.3 21.2 20.3 21.7 17.8 21.7 C 15.3 21.7 13.3 21.2 13.3 20.6 C 13.3 20 15.3 19.5 17.8 19.5"/><path fill="none" stroke="#08090a" stroke-width="0.19" stroke-linejoin="miter" stroke-linecap="round" d="M 17.8 19.5 C 20.3 19.5 22.3 20 22.3 20.6 C 22.3 21.2 20.3 21.7 17.8 21.7 C 15.3 21.7 13.3 21.2 13.3 20.6 C 13.3 20 15.3 19.5 17.8 19.5 Z M 17.8 19.5"/><path fill="#220f0b" d="M 26.5 11.3 C 27.2 11.8 27.2 12.9 26.5 13.7 C 25.8 14.5 24.7 14.8 24 14.3 C 23.3 13.8 23.3 12.7 24 11.9 C 24.7 11.1 25.8 10.9 26.5 11.3"/><path fill="#954b28" d="M 26.2 11.4 C 26.8 11.9 26.8 13 26.1 13.9 C 25.5 14.7 24.4 15 23.8 14.5 C 23.1 14 23.1 12.9 23.8 12 C 24.4 11.2 25.5 10.9 26.2 11.4"/><path fill="#220f0a" d="M 5.7 11.2 C 5 11.7 5 12.8 5.7 13.6 C 6.4 14.4 7.5 14.7 8.2 14.2 C 8.9 13.7 8.9 12.6 8.2 11.8 C 7.5 11 6.4 10.8 5.7 11.2"/><path fill="#954b28" d="M 6.1 11.2 C 5.4 11.8 5.4 13 6.1 13.9 C 6.7 14.9 7.8 15.2 8.4 14.6 C 9.1 14 9.1 12.8 8.4 11.9 C 7.8 10.9 6.7 10.6 6.1 11.2"/><path fill="#08090a" d="M 15.1 16.4 C 15.1 16.2 14.3 16 13.9 15.5 C 13.2 14.6 12 13.2 10.4 13.6 C 7.8 14.3 7.6 15.2 7.6 15.2 L 7.3 14.1 C 7.3 14.1 8.8 13 10.1 12.8 C 13.9 12.6 14.9 12.9 15.1 16.4"/><path fill="none" stroke="#08090a" stroke-width="0.12" stroke-linejoin="miter" stroke-linecap="butt" d="M 15.1 16.4 C 15.1 16.2 14.3 16 13.9 15.5 C 13.2 14.6 12 13.2 10.4 13.6 C 7.8 14.3 7.6 15.2 7.6 15.2 L 7.3 14.1 C 7.3 14.1 8.8 13 10.1 12.8 C 13.9 12.6 14.9 12.9 15.1 16.4 Z M 15.1 16.4"/><path fill="#08090a" d="M 17.6 15.1 L 18 15.3 C 18.4 14.4 19.6 13.6 20.7 13.5 C 23.2 13.3 24.5 15.3 24.5 15.3 L 24.9 14.2 C 24.9 14.2 23.4 12.7 22 12.5 C 21.3 12.4 20.2 12.1 19.1 12.4 C 17.5 12.6 17.5 14.4 17.6 15.1"/><path fill="none" stroke="#08090a" stroke-width="0.12" stroke-linejoin="miter" stroke-linecap="butt" d="M 17.6 15.1 L 18 15.3 C 18.4 14.4 19.6 13.6 20.7 13.5 C 23.2 13.3 24.5 15.3 24.5 15.3 L 24.9 14.2 C 24.9 14.2 23.4 12.7 22 12.5 C 21.3 12.4 20.2 12.1 19.1 12.4 C 17.5 12.6 17.5 14.4 17.6 15.1 Z M 17.6 15.1"/><path fill="#08090a" d="M 20.2 15 C 21.2 15 22 15.7 22 16.7 C 22 17.6 21.2 18.3 20.2 18.3 C 19.3 18.3 18.5 17.6 18.5 16.7 C 18.5 15.7 19.3 15 20.2 15"/><path fill="#ffffff" d="M 20.5 15.9 C 20.7 15.9 20.8 16.1 20.8 16.3 C 20.8 16.6 20.7 16.8 20.5 16.8 C 20.3 16.8 20.1 16.6 20.1 16.3 C 20.1 16.1 20.3 15.9 20.5 15.9"/><path fill="#08090a" d="M 11.2 15 C 12.2 15 12.9 15.7 12.9 16.7 C 12.9 17.6 12.2 18.3 11.2 18.3 C 10.2 18.3 9.4 17.6 9.4 16.7 C 9.4 15.7 10.2 15 11.2 15"/><path fill="#ffffff" d="M 11.4 15.9 C 11.6 15.9 11.8 16.2 11.8 16.4 C 11.8 16.7 11.6 16.9 11.4 16.9 C 11.3 16.9 11.1 16.7 11.1 16.4 C 11.1 16.2 11.3 15.9 11.4 15.9"/><path fill="#c36131" stroke="#08090a" stroke-width="0.05" stroke-linejoin="miter" stroke-linecap="butt" d="M 21.4 8.9 L 22.8 4.3 C 22.8 4.3 23.7 0.2 16 0.1 C 8.4 0 3.7 6.9 3.7 6.9 L 8.6 6.5 Z M 21.4 8.9"/><path fill="#c36131" stroke="#08090a" stroke-width="0.05" stroke-linejoin="miter" stroke-linecap="butt" d="M 19 9.4 L 20.5 5.3 C 20.5 5.3 21.3 1.6 13.7 1.6 C 6 1.5 1.3 7.6 1.3 7.6 L 6.3 7.3 Z M 19 9.4"/><path fill="#c36131" d="M 18.9 9.5 L 17.5 5.5 C 17.5 5 16.7 1.5 10.6 4.7 C 4.4 7.9 2.9 8.9 2.9 8.9 C 3.9 8.7 4.1 9 4.7 8.8 C 5.2 8.7 5.7 8.5 6.2 8.3 C 9 8.2 7.6 9.7 9 10.8 C 9.2 10.9 9.4 11.1 9.6 11.1 C 10.6 11.5 11.7 9.2 13.9 8.9 C 16.2 8.6 18.9 9.5 18.9 9.5"/><path fill="none" stroke="#08090a" stroke-width="0.05" stroke-linejoin="miter" stroke-linecap="butt" d="M 18.9 9.5 L 17.5 5.5 C 17.5 5 16.7 1.5 10.6 4.7 C 4.4 7.9 2.9 8.9 2.9 8.9 C 3.9 8.7 4.1 9 4.7 8.8 C 5.2 8.7 5.7 8.5 6.2 8.3 C 9 8.2 7.6 9.7 9 10.8 C 9.2 10.9 9.4 11.1 9.6 11.1 C 10.6 11.5 11.7 9.2 13.9 8.9 C 16.2 8.6 18.9 9.5 18.9 9.5 Z M 18.9 9.5"/><path fill="#c36131" stroke="#08090a" stroke-width="0.05" stroke-linejoin="miter" stroke-linecap="butt" d="M 21.4 8.8 L 22.6 7.1 C 22.6 7.1 23.8 5.6 25 6.4 C 26.2 7.3 25 11.4 25 11.4 L 23.7 9.6 Z M 21.4 8.8"/>';

  function sym() {
    return Object.keys(ITEM).map(function (k) {
      var it = ITEM[k];
      return '<symbol id="' + it.sym + '" viewBox="0 0 ' + it.vb[0] + ' ' + it.vb[1] + '">' + ART[k] + '</symbol>';
    }).join('');
  }
  /* Gegenstand mit Mittelpunkt (cx,cy), Höhe hh (bei breiten Gegenständen begrenzt durch Breite ww) */
  function icon(k, cx, cy, hh, ww) {
    var vb = ITEM[k].vb, s = Math.min(hh / vb[1], (ww || 999) / vb[0]), w = vb[0] * s, hgt = vb[1] * s;
    return '<use href="#' + ITEM[k].sym + '" x="' + (cx - w / 2).toFixed(1) + '" y="' + (cy - hgt / 2).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + hgt.toFixed(1) + '"/>';
  }
  function riverPath() {
    return {
      1: 'M50 52 V258 C50 292 100 268 100 306',
      2: 'M150 52 V258 C150 292 100 268 100 306',
      3: 'M260 52 V304 C260 394 100 354 100 436',
      4: 'M100 306 V634'
    };
  }
  function tile(id, active) {
    var t = TROLL[id];
    return '<g transform="translate(' + t.x + ',' + t.y + ')" class="' + P + '-tile' + (active ? ' act' : '') + '">' +
      '<title>Troll: ersetzt ' + ITEM[t.i].art + ' durch ' + ITEM[t.o].art + '</title>' +
      '<rect x="-42" y="-27" width="84" height="54" rx="5" class="' + P + '-tbg"/>' +
      icon(t.i, -26, -9, 24, 20) + '<path d="M-8 -9 H5 M0 -15 L7 -9 L0 -3" class="' + P + '-arrow"/>' + icon(t.o, 27, -9, 24, 30) +
      '<path d="M-37 27 V15 Q-37 9 -31 9 H31 Q37 9 37 15 V27 Z" class="' + P + '-bridge"/>' +
      '<path d="M-11 27 V20 A11 11 0 0 1 11 20 V27 Z" class="' + P + '-hole"/></g>';
  }
  function badge(k, x, y, changed) {
    return '<g class="' + P + '-badge' + (changed ? ' chg' : '') + '"><circle cx="' + x + '" cy="' + y + '" r="13"/>' + icon(k, x, y, 17, 19) + '</g>';
  }
  function face(g, x, y, ox, oy) {
    return '<g transform="translate(' + x + ',' + y + ')"><circle cx="28.2" cy="28.2" r="27.7" class="' + P + '-face"/>' +
      '<g transform="translate(' + ox + ',' + oy + ')">' + g + '</g></g>';
  }
  function diagram(traceIdx) {
    var rp = riverPath(), s = '', k;
    s += '<path d="M0 0 H360 V38 L335 46 L300 30 L262 48 L225 33 L185 47 L148 31 L110 47 L72 32 L35 47 L0 36 Z" class="' + P + '-mount"/>';
    for (k = 1; k <= 4; k++) {
      s += '<path d="' + rp[k] + '" class="' + P + '-river"/>';
    }
    /* Beschriftung der Flüsse */
    for (k = 1; k <= 3; k++) {
      s += '<circle cx="' + SRC[k] + '" cy="24" r="14" class="' + P + '-num" style="stroke:' + RCOL[k] + '"/>' +
        '<text x="' + SRC[k] + '" y="30.5" text-anchor="middle" class="' + P + '-numt" style="fill:' + RCOL[k] + '">' + k + '</text>';
    }
    s += face(KATJA, 296, 8, 13.8, 7.7) + '<text x="324" y="76" text-anchor="middle" class="' + P + '-who">Katja</text>';
    var tr = null, act = {};
    if (traceIdx != null && traceIdx >= 0) {
      tr = run(OPTIONS[traceIdx].item, OPTIONS[traceIdx].river);
      tr.steps.forEach(function (st) { if (st.changed) act[st.troll] = true; });
    }
    Object.keys(TROLL).forEach(function (id) { s += tile(id, !!act[id]); });
    /* Ausgang und Justus */
    s += face(JUSTUS, 72, 636, 13.3, 10) + '<text x="100" y="708" text-anchor="middle" class="' + P + '-who">Justus</text>';
    s += '<g transform="translate(212,640)"><path d="M10 28 C-4 28 -6 10 8 8 C6 -6 28 -8 36 2 C46 -8 70 -2 66 14 C80 14 80 36 64 36 C58 46 38 46 32 38 C24 46 8 42 10 28 Z" class="' + P + '-cloud"/>' +
      '<circle cx="-4" cy="46" r="4" class="' + P + '-cloud"/><circle cx="-14" cy="56" r="2.5" class="' + P + '-cloud"/>' + icon('W', 38, 23, 30, 22) + '</g>';
    /* Weg des Gegenstands */
    if (tr) {
      var pos = {
        t1: [50, 166], t2: [150, 166], t3: [260, 166], t4: [150, 256], t6: [260, 256],
        t5: [100, 376], t7: [100, 524], t8: [100, 610]
      };
      s += badge(OPTIONS[traceIdx].item, SRC[OPTIONS[traceIdx].river], 76, false);
      tr.steps.forEach(function (st) { s += badge(st.after, pos[st.troll][0], pos[st.troll][1], st.changed); });
    }
    return s;
  }
  function describe() {
    var out = [];
    [1, 2, 3].forEach(function (r) {
      out.push('Fluss ' + r + ' führt nacheinander unter diesen Brücken hindurch: ' + RIVER[r].map(function (id) {
        var t = TROLL[id];
        return 'Troll ersetzt ' + ITEM[t.i].art + ' durch ' + ITEM[t.o].art;
      }).join('; dann ') + '.');
    });
    return out;
  }

  /* ---------- Zustand ---------- */
  var el, api, locked, sel, mark;
  var svgHost, btns, live;

  function optText(o) { return 'Sie lässt ' + ITEM[o.item].art + ' in Fluss ' + o.river + ' fallen.'; }
  function reset() { sel = null; mark = null; }

  function render() {
    var tIdx = locked || mark ? sel : null;
    svgHost.innerHTML = '<svg viewBox="0 0 360 720" class="' + P + '-svg" role="img" focusable="false" aria-label="Drei Flüsse mit Brückentrollen. Eine Beschreibung folgt als Liste unter dem Bild.">' + diagram(tIdx) + '</svg>';
    btns.forEach(function (b, i) {
      var on = sel === i, ok = RIGHT.indexOf(i) >= 0;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = (sel === null ? i === 0 : on) ? 0 : -1;
      b.setAttribute('aria-disabled', locked ? 'true' : 'false');
      b.className = P + '-opt' + (on ? ' selected' : '') + (on && mark === 'check' ? (ok ? ' right' : ' wrong') : '') + (on && mark === 'solution' ? ' right' : '');
      var m = b.querySelector('.' + P + '-mark');
      if (m) m.remove();
      if (on && mark) b.appendChild(h('span', { class: P + '-mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
    });
  }
  function choose(i, focus) {
    if (locked) return;
    sel = i;
    render();
    if (focus) btns[i].focus();
    api.changed();
  }
  function onKey(e) {
    var k = e.key, i = btns.indexOf(e.currentTarget), to = null;
    if (k === 'ArrowRight' || k === 'ArrowDown') to = (i + 1) % btns.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') to = (i + btns.length - 1) % btns.length;
    if (to === null) return;
    e.preventDefault();
    choose(to, true);
  }

  Biber.register({
    id: 'brueckentrolle18',
    story: '<p>Von einem Berg kommen drei Flüsse. Sie fließen unter Brücken hindurch.</p>' +
      '<p>Katja kann einen Gegenstand in einen der drei Flüsse fallen lassen: ein Stück Holz, einen Fisch oder eine Karotte.</p>' +
      '<p>Unter allen Brücken sitzen Trolle. Sie ersetzen Gegenstände, die unter den Brücken hindurchfließen. Der Troll unter der Brücke oben links ersetzt zum Beispiel jede Karotte durch einen Fisch.</p>' +
      '<p>Justus wartet hinter der letzten Brücke. Er möchte ein Stück Holz bekommen. Katja weiß, was die Brückentrolle machen.</p>',
    question: 'Was muss Katja tun, damit Justus Holz bekommt?',
    howto: 'Auf jeder Brücke siehst du, was der Troll macht: Der Gegenstand links vom Pfeil wird durch den Gegenstand rechts vom Pfeil ersetzt. Alle anderen Gegenstände lässt der Troll unverändert durch. Wähle eine der vier Antworten.',
    explanation: function () {
      var lines = OPTIONS.map(function (o) {
        var r = run(o.item, o.river);
        return '<li><strong>' + o.key + ')</strong> ' + ITEM[o.item].name + ' in Fluss ' + o.river + ': Justus bekommt ' + (r.out === 'W' ? '<strong>Holz</strong> (richtig).' : ITEM[r.out].art + '.') + '</li>';
      }).join('');
      return '<p>Antwort <strong>B</strong> ist richtig. Der Fisch aus Fluss 2 wird am ersten Troll durch Holz ersetzt. Der nächste Troll hat nichts zu tun. Danach wird das Holz zu einer Karotte, die Karotte wieder zu Holz, und der letzte Troll lässt das Holz durch. Justus fischt das Holz aus dem Fluss.</p>' +
        '<ul class="' + P + '-res">' + lines + '</ul>' +
        '<p><em>Informatik:</em> Die Trolle arbeiten nach dem EVA-Prinzip: Katjas <strong>E</strong>ingabe wird <strong>v</strong>erarbeitet, und Justus erhält die <strong>A</strong>usgabe. Die Ausgabe hängt nur von der Eingabe ab, nichts wird gemerkt, so wie bei einer Funktion in der Mathematik. Auch alle Trolle zusammen bilden eine Funktion, die aus vielen kleinen Funktionen zusammengesetzt ist. Programme, die so aufgebaut sind (funktionale Programme), lassen sich gut auf ihre Richtigkeit prüfen.</p>';
    },
    mount: function (root, a) {
      el = root; api = a; locked = false; reset();
      svgHost = h('div', { class: P + '-pic' });
      live = h('p', { class: 'visually-hidden', 'aria-live': 'polite' });
      btns = OPTIONS.map(function (o, i) {
        return h('button', {
          type: 'button', role: 'radio', 'aria-checked': 'false', 'data-key': o.key,
          'aria-label': o.key + ') ' + optText(o),
          onclick: function () { choose(i, false); }, onkeydown: onKey
        }, h('span', { class: P + '-letter', 'aria-hidden': 'true' }, o.key),
          h('span', { class: P + '-oi', 'aria-hidden': 'true' }),
          h('span', { class: P + '-ot', 'aria-hidden': 'true' }, optText(o)));
      });
      btns.forEach(function (b, i) {
        b.querySelector('.' + P + '-oi').innerHTML = '<svg viewBox="0 0 34 30" focusable="false">' + icon(OPTIONS[i].item, 17, 15, 26, 32) + '</svg>';
      });
      var list = h('ul', { class: 'visually-hidden' }, describe().map(function (t) { return h('li', null, t); }));
      var defs = h('span', { class: P + '-defs', 'aria-hidden': 'true' });
      defs.innerHTML = '<svg width="0" height="0" focusable="false"><defs>' + sym() + '</defs></svg>';
      el.replaceChildren(h('div', { class: P + '-board' }, defs,
        h('div', { class: P + '-opts', role: 'radiogroup', 'aria-label': 'Antworten' }, btns),
        h('div', { class: P + '-figure' }, svgHost, list)), live);
      render();
    },
    isComplete: function () { return sel !== null; },
    evaluate: function () { return { correct: RIGHT.indexOf(sel) >= 0, answer: { choice: OPTIONS[sel].key } }; },
    setAnswer: function (ans) {
      var i = OPTIONS.map(function (o) { return o.key; }).indexOf(ans && ans.choice);
      sel = i >= 0 ? i : null;
      mark = 'check';
      render();
    },
    lock: function (on) {
      locked = on;
      mark = on ? (mark === 'solution' ? 'solution' : 'check') : null;
      render();
    },
    reset: function () { reset(); render(); },
    showSolution: function () {
      sel = RIGHT[0]; mark = 'solution'; locked = true;
      render();
    }
  });
})();
