/* VITALIQ swap page: countdown to pool opening, 1 December 2026 00:00 UTC,
   plus live claim pool balance (the amount subject to the launch burn). */
(function () {
  "use strict";
  var VQ = window.VQ, S = VQ.SEL, A = VQ.ADDR;
  var TARGET = 1796083200; /* 2026-12-01 00:00:00 UTC */
  function set(id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; }
  function tick() {
    var s = Math.max(0, TARGET - Math.floor(Date.now() / 1000));
    set("cdD", String(Math.floor(s / 86400)));
    set("cdH", VQ.pad2(Math.floor((s % 86400) / 3600)));
    set("cdM", VQ.pad2(Math.floor((s % 3600) / 60)));
    set("cdS", VQ.pad2(s % 60));
  }
  tick();
  setInterval(tick, 1000);
  (async function () {
    try { set("swPool", VQ.fmtVital(await VQ.callUint(A.claim, S.poolBalance)) + " VITAL"); }
    catch (e) { set("swPool", "–"); }
    try { set("swClaimed", VQ.fmtInt(await VQ.callUint(A.claim, S.totalClaimed))); }
    catch (e) { set("swClaimed", "–"); }
  })();
})();
