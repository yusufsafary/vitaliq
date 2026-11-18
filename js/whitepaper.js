/* VITALIQ whitepaper v3: interactive Index curve + claim phase stepper. */
(function () {
  "use strict";
  function $(id) { return document.getElementById(id); }
  function setText(id, t) { var el = $(id); if (el) el.textContent = t; }

  /* ---------------- index curve ---------------- */
  var svg = $("curveSvg");
  if (svg) {
    var W = 720, H = 300, PL = 44, PR = 14, PT = 16, PB = 34;
    var PMAX = 600;
    function X(p) { return PL + (W - PL - PR) * (p / PMAX); }
    function Y(idx) { return PT + (H - PT - PB) * (1 - idx / 1000); }
    function idxOf(p) { return Math.floor(p * 1000 / (p + 170)); }
    var NS = "http://www.w3.org/2000/svg";
    function el(name, attrs) {
      var e = document.createElementNS(NS, name);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      return e;
    }
    /* zones */
    svg.appendChild(el("rect", { x: PL, y: Y(1000), width: X(101) - PL, height: Y(0) - Y(1000), fill: "rgba(87,183,207,0.05)" }));
    /* gridlines at verdict borders */
    [25, 100].forEach(function (p) {
      svg.appendChild(el("line", { x1: X(p), y1: PT, x2: X(p), y2: H - PB, stroke: "#22496B", "stroke-width": 1, "stroke-dasharray": "4 5" }));
    });
    [0, 250, 500, 750, 1000].forEach(function (v) {
      svg.appendChild(el("line", { x1: PL, y1: Y(v), x2: W - PR, y2: Y(v), stroke: "rgba(24,58,86,0.55)", "stroke-width": 1 }));
      var t = el("text", { x: PL - 8, y: Y(v) + 4, fill: "#608098", "font-size": 11, "text-anchor": "end", "font-family": "IBM Plex Mono, monospace" });
      t.textContent = v;
      svg.appendChild(t);
    });
    /* curve path */
    var d = "";
    for (var p = 0; p <= PMAX; p += 4) {
      d += (p === 0 ? "M" : "L") + X(p).toFixed(1) + " " + Y(idxOf(p)).toFixed(1) + " ";
    }
    svg.appendChild(el("path", { d: d, fill: "none", stroke: "#22D3EE", "stroke-width": 2.5 }));
    /* verdict threshold labels */
    var t1 = el("text", { x: X(25) + 6, y: PT + 12, fill: "#57B7CF", "font-size": 10.5, "font-family": "IBM Plex Mono, monospace" });
    t1.textContent = "STABLE ≥25";
    svg.appendChild(t1);
    var t2 = el("text", { x: X(100) + 6, y: PT + 12, fill: "#22D3EE", "font-size": 10.5, "font-family": "IBM Plex Mono, monospace" });
    t2.textContent = "PEAK >100";
    svg.appendChild(t2);
    /* draggable point */
    var vline = el("line", { y1: PT, y2: H - PB, stroke: "#A8F6FF", "stroke-width": 1, opacity: 0.55 });
    svg.appendChild(vline);
    var dot = el("circle", { r: 8, fill: "#A8F6FF", stroke: "#0E94BE", "stroke-width": 3 });
    svg.appendChild(dot);
    var RATES = { 1: "2,500", 2: "12,500", 3: "60,000" };
    function verdict(p) { return p < 25 ? 1 : (p <= 100 ? 2 : 3); }
    function show(p) {
      p = Math.max(0, Math.min(PMAX, Math.round(p)));
      var idx = idxOf(p), v = verdict(p);
      dot.setAttribute("cx", X(p)); dot.setAttribute("cy", Y(idx));
      vline.setAttribute("x1", X(p)); vline.setAttribute("x2", X(p));
      setText("curveP", p.toLocaleString("en-US"));
      setText("curveIdx", String(idx));
      var cv = $("curveVerdict");
      if (cv) {
        cv.textContent = ["", "CRITICAL", "STABLE", "PEAK"][v];
        cv.style.color = ["", "#FF6054", "#57B7CF", "#22D3EE"][v];
      }
      setText("curveRate", RATES[v] + " VITAL");
    }
    var dragging = false;
    function fromEvent(e) {
      var r = svg.getBoundingClientRect();
      var x = (e.clientX - r.left) * (W / r.width);
      return (x - PL) / (W - PL - PR) * PMAX;
    }
    svg.addEventListener("pointerdown", function (e) { dragging = true; svg.setPointerCapture(e.pointerId); show(fromEvent(e)); });
    svg.addEventListener("pointermove", function (e) { if (dragging) show(fromEvent(e)); });
    svg.addEventListener("pointerup", function () { dragging = false; });
    svg.addEventListener("pointercancel", function () { dragging = false; });
    show(163);
  }

  /* ---------------- phase stepper ---------------- */
  var PHASES = {
    p1: "<b>Reading opens · 00:00 UTC.</b> A new Reading starts at midnight UTC. Agents mint Scans through the day: first Scan free with an anti-bot answer, then paid tiers up to 10 per wallet.",
    p2: "<b>Reading seals · 00:00 UTC next day.</b> Minting for that Reading stops. Its verdict locks from the unique-agent count: Critical, Stable or Peak. The Vitality Index freezes with it.",
    p3: "<b>Maturation · one phase passes.</b> Claim phases run 6 hours. Sealed Scans sit through exactly one full phase after the seal phase, a built-in cooling window before any payout can move.",
    p4: "<b>Claims open · 06:00 UTC on seal day.</b> From this second, every unclaimed Scan of the sealed Reading can claim its verdict rate, or 250,000 VITAL for a Zenith, forever. Claims never expire."
  };
  var cards = document.querySelectorAll(".phase-card");
  var detail = $("phaseDetail");
  if (cards.length && detail) {
    cards.forEach(function (card) {
      card.addEventListener("click", function () {
        cards.forEach(function (c) { c.classList.remove("on"); });
        card.classList.add("on");
        var key = card.getAttribute("data-phase");
        if (PHASES[key]) detail.innerHTML = PHASES[key];
      });
    });
  }
})();
