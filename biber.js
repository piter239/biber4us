/* Gemeinsame Schnittstelle fuer Aufgabenmodule (tasks/<id>.js).
   Ein Modul registriert sich mit Biber.register({...}); das Geruest in app.js
   zeichnet Kopf, Text, Pruefen-Leiste, Rueckmeldung und Bewertung. */
window.Biber = {
  modules: {},
  register: function (m) { this.modules[m.id] = m; },
  /* kleiner DOM-Helfer: Biber.h('div', {class: 'x', onclick: fn}, 'Text', child, [children]) */
  h: function (tag, attrs) {
    var e = document.createElement(tag);
    var a = attrs || {};
    Object.keys(a).forEach(function (k) {
      var v = a[k];
      if (v === false || v == null) return;
      if (k === 'class') e.className = v;
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    });
    (function add(list) {
      list.forEach(function (c) {
        if (c == null || c === false) return;
        if (Array.isArray(c)) return add(c);
        e.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
      });
    })([].slice.call(arguments, 2));
    return e;
  },
  svg: function (tag, attrs) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    [].slice.call(arguments, 2).forEach(function (c) { if (c != null) e.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c))); });
    return e;
  }
};
