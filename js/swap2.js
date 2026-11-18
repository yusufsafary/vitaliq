/* VITALIQ swap v3: countdown progress ring from genesis (18 Nov 2026)
   to pool opening (1 Dec 2026 00:00 UTC). */
(function () {
  "use strict";
  var START = 1794960000; /* 2026-11-18 00:00:00 UTC */
  var TARGET = 1796083200; /* 2026-12-01 00:00:00 UTC */
  var arc = document.getElementById("ringArc");
  var pctEl = document.getElementById("ringPct");
  if (!arc) return;
  var C = 2 * Math.PI * 88;
  arc.style.strokeDasharray = C.toFixed(1);
  function tick() {
    var now = Math.floor(Date.now() / 1000);
    var f = Math.max(0, Math.min(1, (now - START) / (TARGET - START)));
    arc.style.strokeDashoffset = (C * (1 - f)).toFixed(1);
    if (pctEl) pctEl.textContent = (f * 100).toFixed(1) + "%";
  }
  tick();
  setInterval(tick, 1000);
})();
