/* VITALIQ homepage instrument
   Live Vitality Index dial, oscilloscope trace, readout table, board,
   reading log and index history. All values read from BSC with
   sequential single eth_calls (see chain.js).
   Mint and claim status come from mintOpen() / claimOpen() on chain;
   while closed, panels show an OPENS AT LAUNCH state. */
(function () {
  "use strict";
  var VQ = window.VQ;
  var S = VQ.SEL, A = VQ.ADDR;
  var GENESIS = 1794960000; /* 2026-11-18 00:00:00 UTC */
  var VERDICTS = ["PENDING", "CRITICAL", "STABLE", "PEAK"];
  var VCOLORS = ["#608098", "#FF6054", "#57B7CF", "#22D3EE"];

  function $(id) { return document.getElementById(id); }
  function setText(id, txt) { var el = $(id); if (el) el.textContent = txt; }

  /* ---------------- dial construction ---------------- */
  var CX = 260, CY = 260;
  function polar(r, v) {
    var a = (135 + 270 * (v / 1000)) * Math.PI / 180;
    return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
  }
  function arcPath(r, v0, v1) {
    var p0 = polar(r, v0), p1 = polar(r, v1);
    var large = (v1 - v0) / 1000 * 270 > 180 ? 1 : 0;
    return "M " + p0[0].toFixed(2) + " " + p0[1].toFixed(2) +
           " A " + r + " " + r + " 0 " + large + " 1 " +
           p1[0].toFixed(2) + " " + p1[1].toFixed(2);
  }
  function buildDial() {
    var svg = $("dialSvg");
    if (!svg) return;
    var parts = [];
    /* rotating dashed ring */
    parts.push('<circle class="spin-ring" cx="260" cy="260" r="247" fill="none" stroke="#34546E" stroke-width="2" stroke-dasharray="3 11" opacity="0.8"/>');
    /* band arcs */
    parts.push('<path d="' + arcPath(216, 0, 250) + '" fill="none" stroke="#33566E" stroke-width="20"/>');
    parts.push('<path d="' + arcPath(216, 250, 700) + '" fill="none" stroke="#57B7CF" stroke-width="20"/>');
    parts.push('<path d="' + arcPath(216, 700, 1000) + '" fill="none" stroke="#22D3EE" stroke-width="20"/>');
    /* progress arc (JS updates d) */
    parts.push('<path id="progArc" d="" fill="none" stroke="#A8F6FF" stroke-width="5" stroke-linecap="round"/>');
    /* ticks */
    for (var v = 0; v <= 1000; v += 25) {
      var major = v % 100 === 0;
      var p0 = polar(major ? 186 : 190, v), p1 = polar(major ? 162 : 174, v);
      parts.push('<line x1="' + p0[0].toFixed(1) + '" y1="' + p0[1].toFixed(1) +
        '" x2="' + p1[0].toFixed(1) + '" y2="' + p1[1].toFixed(1) +
        '" stroke="' + (major ? "#A8F6FF" : "#44657E") + '" stroke-width="' + (major ? 3 : 2) + '"/>');
    }
    [0, 250, 500, 1000].forEach(function (v) {
      var p = polar(132, v);
      parts.push('<text x="' + p[0].toFixed(1) + '" y="' + (p[1] + 5).toFixed(1) +
        '" fill="#608098" font-family="IBM Plex Mono, monospace" font-size="15" text-anchor="middle">' + v + "</text>");
    });
    /* needle */
    parts.push('<g id="needle"><line x1="260" y1="266" x2="260" y2="106" stroke="#A8F6FF" stroke-width="5" stroke-linecap="round"/></g>');
    parts.push('<circle cx="260" cy="260" r="11" fill="#A8F6FF"/>');
    parts.push('<circle cx="260" cy="260" r="22" fill="none" stroke="#183A56" stroke-width="1.5"/>');
    svg.innerHTML = parts.join("");
  }

  var needleShown = 0, needleTarget = 0, needleAnim = null;
  function setIndex(v) {
    needleTarget = Math.max(0, Math.min(1000, v));
    var prog = $("progArc");
    if (prog) prog.setAttribute("d", needleTarget > 0 ? arcPath(230, 0, Math.max(needleTarget, 4)) : "");
    if (needleAnim) cancelAnimationFrame(needleAnim);
    var from = needleShown, to = needleTarget, t0 = performance.now(), dur = 1300;
    function step(t) {
      var k = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - k, 3);
      needleShown = from + (to - from) * e;
      var nd = $("needle");
      if (nd) nd.setAttribute("transform", "rotate(" + (-135 + 270 * (needleShown / 1000)).toFixed(2) + " 260 260)");
      setText("idxBig", String(Math.round(needleShown)));
      if (k < 1) needleAnim = requestAnimationFrame(step);
    }
    needleAnim = requestAnimationFrame(step);
  }

  /* ---------------- oscilloscope ---------------- */
  function startScope() {
    var cv = $("scope");
    if (!cv) return;
    var ctx = cv.getContext("2d");
    var W = 0, H = 0, pts = [], frame = 0;
    function size() {
      var r = cv.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      W = Math.max(200, r.width); H = 86;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    window.addEventListener("resize", size);
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function nextY() {
      frame++;
      var t = frame % 110;
      var base = Math.sin(frame * 0.11) * 5 + Math.sin(frame * 0.031) * 4 + (Math.random() - 0.5) * 5;
      if (t === 46) return -30;
      if (t === 48) return 22;
      if (t === 50) return -9;
      if (t === 53) return 4;
      return base;
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(52,84,110,0.35)"; ctx.lineWidth = 1;
      for (var gx = 0; gx < W; gx += 34) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (var gy = 0; gy < H; gy += 22) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
      pts.push(nextY());
      while (pts.length > Math.ceil(W / 3)) pts.shift();
      ctx.beginPath();
      pts.forEach(function (y, i) {
        var x = i * 3, yy = H / 2 + y;
        if (i === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      });
      ctx.strokeStyle = "#7FE7F7"; ctx.lineWidth = 1.8;
      ctx.shadowColor = "rgba(34,211,238,0.8)"; ctx.shadowBlur = 7;
      ctx.stroke();
      ctx.shadowBlur = 0;
      if (!reduced) requestAnimationFrame(draw);
    }
    draw();
  }

  /* ---------------- countdown ---------------- */
  function tickCountdown() {
    var now = Math.floor(Date.now() / 1000);
    var target, label;
    if (now < GENESIS) { target = GENESIS; label = "READING 01 OPENS IN"; }
    else { target = (Math.floor(now / 86400) + 1) * 86400; label = "SEAL IN"; }
    var s = Math.max(0, target - now);
    var txt = VQ.pad2(Math.floor(s / 3600)) + ":" + VQ.pad2(Math.floor((s % 3600) / 60)) + ":" + VQ.pad2(s % 60);
    setText("sealCount", txt);
    setText("sealLabel", label);
  }

  /* ---------------- live data ---------------- */
  function projectedVerdict(p) { return p < 25 ? 1 : (p <= 100 ? 2 : 3); }
  function fail(id) { setText(id, "–"); }

  var lastReading = -1;

  function statusBadge(id, open, openTxt, closedTxt) {
    var el = $(id);
    if (!el) return;
    el.textContent = open ? openTxt : closedTxt;
    el.className = "badge " + (open ? "b-live" : "b-soon");
  }

  async function loadMain() {
    var reading;
    try {
      reading = Number(await VQ.callUint(A.scans, S.currentReading));
    } catch (e) {
      ["roScans", "roAgents", "roStatus", "stReading", "stScans", "stAgents", "stIndex", "stVerdict",
       "stTotalScans", "stTotalClaimed", "stPool"].forEach(fail);
      setText("dialState", "OFFLINE");
      setIndex(0);
      if (lastReading !== 0) { lastReading = 0; loadHistory(0); }
      return;
    }

    var mintOpen = false, claimOpen = false;
    try { mintOpen = await VQ.callBool(A.scans, S.mintOpen); } catch (e) {}
    try { claimOpen = await VQ.callBool(A.claim, S.claimOpen); } catch (e) {}
    statusBadge("mintBadge", mintOpen, "MINT LIVE", "OPENS AT LAUNCH");
    statusBadge("claimBadge", claimOpen, "CLAIM LIVE", "OPENS AT LAUNCH");
    setText("stMint", mintOpen ? "OPEN" : "OPENS AT LAUNCH");
    var sm = $("stMint"); if (sm) sm.className = "sv " + (mintOpen ? "cy" : "gold");
    setText("stClaimState", claimOpen ? "OPEN" : "OPENS AT LAUNCH");
    var sc = $("stClaimState"); if (sc) sc.className = "sv " + (claimOpen ? "cy" : "gold");
    setText("dialState", mintOpen ? "LIVE" : "STANDBY");

    setText("stReading", reading > 0 ? VQ.pad2(reading) : "01");

    if (reading > 0) {
      var scans = 0n, parts = 0n, idx = 0n, sealed = false, verdict = 0;
      try { scans = await VQ.callUint(A.scans, S.scansInReading + VQ.encUint(reading)); } catch (e) {}
      try { parts = await VQ.callUint(A.scans, S.participantsOf + VQ.encUint(reading)); } catch (e) {}
      try { idx = await VQ.callUint(A.scans, S.indexOf + VQ.encUint(reading)); } catch (e) {
        idx = BigInt(Math.floor(Number(parts) * 1000 / (Number(parts) + 170)));
      }
      try { sealed = await VQ.callBool(A.scans, S.isSealed + VQ.encUint(reading)); } catch (e) {}
      try { verdict = Number(await VQ.callUint(A.scans, S.verdictOf + VQ.encUint(reading))); } catch (e) {}
      if (!sealed || verdict === 0) verdict = projectedVerdict(Number(parts));

      setIndex(Number(idx));
      setText("roScans", VQ.fmtInt(scans));
      setText("roAgents", VQ.fmtInt(parts));
      setText("stScans", VQ.fmtInt(scans));
      setText("stAgents", VQ.fmtInt(parts));
      setText("stIndex", VQ.fmtInt(idx));
      var vName = VERDICTS[verdict] || "PENDING";
      setText("roStatus", vName);
      var ro = $("roStatus"); if (ro) ro.style.color = VCOLORS[verdict];
      setText("stVerdict", sealed ? vName : vName + " · PROJ");
      var sv = $("stVerdict"); if (sv) sv.style.color = VCOLORS[verdict];
      setText("statusNote", sealed
        ? "Reading " + VQ.pad2(reading) + " sealed. Verdict locked on chain."
        : (mintOpen
          ? "Projected from live participation. Verdict locks at seal, 00:00 UTC."
          : "Mint opens at launch. Verdict locks at seal, 00:00 UTC."));
    } else {
      setIndex(0);
      setText("roScans", "0"); setText("roAgents", "0");
      setText("stScans", "0"); setText("stAgents", "0"); setText("stIndex", "0");
      setText("roStatus", "STANDBY");
      setText("stVerdict", "PENDING");
      setText("statusNote", "Reading 01 opens 18 Nov 2026, 00:00 UTC. Mint opens at launch.");
    }

    try { setText("stTotalScans", VQ.fmtInt(await VQ.callUint(A.scans, S.totalScans))); } catch (e) { fail("stTotalScans"); }
    try { setText("stTotalClaimed", VQ.fmtInt(await VQ.callUint(A.claim, S.totalClaimed))); } catch (e) { fail("stTotalClaimed"); }
    try {
      var pool = await VQ.callUint(A.claim, S.poolBalance);
      setText("stPool", VQ.fmtVital(pool));
      setText("claimPoolNow", VQ.fmtVital(pool) + " VITAL");
    } catch (e) { fail("stPool"); }
    try {
      var fee = await VQ.callUint(A.claim, S.claimFee);
      setText("feeLowNow", (Number(fee) / 1e18).toFixed(6) + " BNB");
    } catch (e) {}
    try {
      var feeH = await VQ.callUint(A.claim, S.claimFeeHigh);
      setText("feeHighNow", (Number(feeH) / 1e18).toFixed(6) + " BNB");
    } catch (e) {}

    if (reading !== lastReading) {
      lastReading = reading;
      loadHistory(reading);
    }
  }

  async function loadHistory(reading) {
    var barsEl = $("histBars"), logEl = $("logBody");
    if (reading < 1) {
      if (barsEl) barsEl.innerHTML = '<div class="hist-empty">NO SEALED READINGS YET · READING 01 OPENS 00:00 UTC</div>';
      if (logEl) logEl.innerHTML = "";
      return;
    }
    var from = Math.max(1, reading - 6);
    setText("histRange", "READINGS " + VQ.pad2(from) + "–" + VQ.pad2(reading));
    var rows = [];
    for (var r = reading; r >= from; r--) {
      var d = { r: r, scans: null, parts: null, idx: null, verdict: 0, sealed: false };
      try { d.scans = await VQ.callUint(A.scans, S.scansInReading + VQ.encUint(r)); } catch (e) {}
      try { d.parts = await VQ.callUint(A.scans, S.participantsOf + VQ.encUint(r)); } catch (e) {}
      try { d.idx = await VQ.callUint(A.scans, S.indexOf + VQ.encUint(r)); } catch (e) {}
      try { d.sealed = await VQ.callBool(A.scans, S.isSealed + VQ.encUint(r)); } catch (e) {}
      try { d.verdict = Number(await VQ.callUint(A.scans, S.verdictOf + VQ.encUint(r))); } catch (e) {}
      if ((!d.sealed || d.verdict === 0) && d.parts !== null) d.verdict = projectedVerdict(Number(d.parts));
      rows.push(d);
      renderHistory(rows.slice().reverse(), reading);
      renderLog(rows);
    }
  }

  function renderHistory(rowsAsc, current) {
    var el = $("histBars");
    if (!el) return;
    el.innerHTML = rowsAsc.map(function (d) {
      var idx = d.idx === null ? 0 : Number(d.idx);
      var h = Math.max(4, Math.round(idx / 1000 * 62));
      return '<div class="hist-col' + (d.r === current ? " cur" : "") + '">' +
        '<div class="hist-bar' + (d.r === current ? " cur" : "") + '" style="height:' + h + 'px">' +
        '<span class="hv">' + (d.idx === null ? "–" : idx) + "</span></div>" +
        '<div class="hist-lab">' + VQ.pad2(d.r) + "</div></div>";
    }).join("");
  }

  function renderLog(rowsDesc) {
    var el = $("logBody");
    if (!el) return;
    el.innerHTML = rowsDesc.map(function (d) {
      var vName = VERDICTS[d.verdict] || "PENDING";
      return "<tr><td>Reading " + VQ.pad2(d.r) + "</td>" +
        '<td class="n">' + (d.scans === null ? "–" : VQ.fmtInt(d.scans)) + "</td>" +
        '<td class="n">' + (d.parts === null ? "–" : VQ.fmtInt(d.parts)) + "</td>" +
        '<td class="n">' + (d.idx === null ? "–" : VQ.fmtInt(d.idx)) + "</td>" +
        '<td style="color:' + VCOLORS[d.verdict] + '">' + vName + (d.sealed ? "" : " · PROJ") + "</td>" +
        "<td>" + (d.sealed ? "SEALED" : "OPEN") + "</td></tr>";
    }).join("");
  }

  buildDial();
  setIndex(0);
  startScope();
  tickCountdown();
  setInterval(tickCountdown, 1000);
  loadMain();
  setInterval(loadMain, 60000);
})();
