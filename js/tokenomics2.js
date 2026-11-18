/* VITALIQ tokenomics v3: interactive allocation donut + burn simulator.
   Pool figure reads live from the Claim contract when chain.js data lands;
   until then the simulator runs on the full 2,000,000,000 pool. */
(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  var FULL_POOL = 2000000000;

  /* ---------------- donut ---------------- */
  var segs = document.querySelectorAll(".donut-seg");
  var rows = document.querySelectorAll(".dl-row");
  var dcN = $("dcN"), dcL = $("dcL");
  var INFO = {
    pool: { n: "2,000,000,000", l: "Claim pool · 20%" },
    proj: { n: "8,000,000,000", l: "Project wallet · 80%" }
  };
  function highlight(key) {
    segs.forEach(function (s) { s.style.opacity = (!key || s.getAttribute("data-seg") === key) ? "1" : "0.35"; });
    rows.forEach(function (r) { r.classList.toggle("dim", !!key && r.getAttribute("data-seg") !== key); });
    if (dcN && dcL) {
      if (key && INFO[key]) { dcN.textContent = INFO[key].n; dcL.textContent = INFO[key].l; }
      else { dcN.textContent = "10,000,000,000"; dcL.textContent = "Total supply · $VITAL"; }
    }
  }
  segs.forEach(function (s) {
    s.addEventListener("pointerenter", function () { highlight(s.getAttribute("data-seg")); });
    s.addEventListener("pointerleave", function () { highlight(null); });
    s.addEventListener("click", function () { highlight(s.getAttribute("data-seg")); });
  });
  rows.forEach(function (r) {
    r.addEventListener("pointerenter", function () { highlight(r.getAttribute("data-seg")); });
    r.addEventListener("pointerleave", function () { highlight(null); });
    r.addEventListener("click", function () { highlight(r.getAttribute("data-seg")); });
  });

  /* ---------------- burn simulator ---------------- */
  var range = $("burnRange");
  if (range) {
    var poolLive = FULL_POOL;
    function burnUpdate() {
      var pct = parseInt(range.value, 10) || 0;
      var burned = Math.round(poolLive * pct / 100);
      var el;
      el = $("burnPct"); if (el) el.textContent = pct + "%";
      el = $("burnAmt"); if (el) el.textContent = burned.toLocaleString("en-US") + " VITAL";
      el = $("burnLeft"); if (el) el.textContent = (poolLive - burned).toLocaleString("en-US") + " VITAL";
      el = $("burnPool"); if (el) el.textContent = poolLive.toLocaleString("en-US") + " VITAL";
    }
    range.addEventListener("input", burnUpdate);
    burnUpdate();
    /* refine with the live pool balance once tokenomics.js has read it */
    var tries = 0;
    var iv = setInterval(function () {
      tries++;
      var tk = $("tkPool");
      if (tk) {
        var v = parseFloat((tk.textContent || "").replace(/[^0-9.]/g, ""));
        if (!isNaN(v) && v > 0) { poolLive = Math.round(v); burnUpdate(); clearInterval(iv); return; }
      }
      if (tries > 12) clearInterval(iv);
    }, 700);
  }
})();
