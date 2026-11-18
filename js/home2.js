/* VITALIQ homepage v3 additions: live ticker, scan feed, index simulator,
   band explorer, claim calculator. Chain reads stay sequential single
   eth_calls through chain.js. */
(function () {
  "use strict";
  var VQ = window.VQ, S = VQ.SEL, A = VQ.ADDR;
  function $(id) { return document.getElementById(id); }
  function setText(id, txt) { var el = $(id); if (el) el.textContent = txt; }
  var VERDICTS = ["PENDING", "CRITICAL", "STABLE", "PEAK"];
  function projectedVerdict(p) { return p < 25 ? 1 : (p <= 100 ? 2 : 3); }
  var RATES = [0, 2500, 12500, 60000];

  /* ---------------- ticker + feed ---------------- */
  var lastTotal = null, lastReading = 0;

  function tickerHTML(d) {
    var items = [
      "READING <b>" + d.reading + "</b>",
      "SCANS TODAY <b>" + d.scans + "</b>",
      "AGENTS <b>" + d.agents + "</b>",
      "VITALITY INDEX <b>" + d.idx + "</b>",
      "VERDICT <span class='cy'>" + d.verdict + "</span>",
      "CLAIM POOL <b>" + d.pool + " VITAL</b>",
      "TOTAL CLAIMED <b>" + d.claimed + "</b>",
      "$VITAL POOL OPENS <span class='gold'>1 DEC 2026</span>",
      "UNCLAIMED <span class='gold'>BURNS AT LAUNCH</span>"
    ];
    var set = items.map(function (t) { return '<span class="ti">' + t + "</span>"; }).join("");
    return '<div class="ticker-set">' + set + '</div><div class="ticker-set" aria-hidden="true">' + set + "</div>";
  }

  function feedRow(id, reading, fresh) {
    var now = new Date();
    var hh = VQ.pad2(now.getUTCHours()) + ":" + VQ.pad2(now.getUTCMinutes()) + ":" + VQ.pad2(now.getUTCSeconds());
    return '<div class="feed-row' + (fresh ? " fresh" : "") + '"><span><span class="fid">SCAN #' +
      VQ.fmtInt(id) + "</span> · READING " + VQ.pad2(reading) + ' · RECORDED ON CHAIN</span>' +
      '<span class="ftime">' + hh + " UTC</span></div>";
  }

  async function pollFeed(first) {
    try {
      var total = Number(await VQ.callUint(A.scans, S.totalScans));
      var reading = Number(await VQ.callUint(A.scans, S.currentReading));
      var list = $("feedList");
      if (list) {
        if (first || lastTotal === null) {
          if (total > 0) {
            var rows = "";
            var from = Math.max(1, total - 4);
            for (var i = total; i >= from; i--) rows += feedRow(i, reading, false);
            list.innerHTML = rows;
          } else {
            list.innerHTML = '<div class="feed-empty">NO SCANS YET · READING 01 IN PROGRESS</div>';
          }
        } else if (total > lastTotal) {
          var add = "";
          for (var j = total; j > lastTotal; j--) add += feedRow(j, reading, true);
          var empty = list.querySelector(".feed-empty");
          if (empty) empty.remove();
          list.insertAdjacentHTML("afterbegin", add);
          while (list.children.length > 6) list.removeChild(list.lastChild);
        }
      }
      lastTotal = total; lastReading = reading;

      /* ticker refresh */
      var track = $("tickerTrack");
      if (track) {
        var scans = 0n, parts = 0n, idx = 0n, pool = 0n, claimed = 0n;
        if (reading > 0) {
          try { scans = await VQ.callUint(A.scans, S.scansInReading + VQ.encUint(reading)); } catch (e) {}
          try { parts = await VQ.callUint(A.scans, S.participantsOf + VQ.encUint(reading)); } catch (e) {}
          try { idx = await VQ.callUint(A.scans, S.indexOf + VQ.encUint(reading)); } catch (e) {}
        }
        try { pool = await VQ.callUint(A.claim, S.poolBalance); } catch (e) {}
        try { claimed = await VQ.callUint(A.claim, S.totalClaimed); } catch (e) {}
        track.innerHTML = tickerHTML({
          reading: reading > 0 ? VQ.pad2(reading) : "01",
          scans: VQ.fmtInt(scans), agents: VQ.fmtInt(parts), idx: VQ.fmtInt(idx),
          verdict: VERDICTS[projectedVerdict(Number(parts))],
          pool: VQ.fmtVital(pool), claimed: VQ.fmtInt(claimed)
        });
      }
    } catch (e) { /* keep last state */ }
  }
  if ($("feedList") || $("tickerTrack")) {
    pollFeed(true);
    setInterval(function () { pollFeed(false); }, 20000);
  }

  /* ---------------- index simulator ---------------- */
  var simRange = $("simRange");
  if (simRange) {
    function simUpdate() {
      var p = parseInt(simRange.value, 10) || 0;
      var idx = Math.floor(p * 1000 / (p + 170));
      var v = projectedVerdict(p);
      setText("simP", VQ.fmtInt(p));
      setText("simIdx", String(idx));
      var sv = $("simVerdict");
      if (sv) {
        sv.textContent = VERDICTS[v];
        sv.className = "sv2 " + (v === 1 ? "coral" : (v === 2 ? "steel" : "cy"));
      }
      setText("simRate", RATES[v].toLocaleString("en-US") + " VITAL");
      var bar = $("simBarFill");
      if (bar) bar.style.width = (idx / 10) + "%";
    }
    simRange.addEventListener("input", simUpdate);
    simUpdate();
  }

  /* ---------------- band explorer ---------------- */
  var BANDS = {
    dep: { img: 3, name: "DEPLETED", color: "#9FB8C9",
      txt: "A flat trace. Recorded, sealed and claimable like any other Scan, paid at the verdict rate of its Reading.",
      meta: "SAMPLE CARD <b>#3</b> · SEED BAND 0 OF 3 · CLAIM <b>VERDICT RATE</b> · FEE <b>0.000327 BNB</b>" },
    nom: { img: 2, name: "NOMINAL", color: "#22D3EE",
      txt: "A healthy signal inside normal range. The standard trace most agents leave on a Reading.",
      meta: "SAMPLE CARD <b>#2</b> · SEED BAND 1 OF 3 · CLAIM <b>VERDICT RATE</b> · FEE <b>0.000327 BNB</b>" },
    ele: { img: 1, name: "ELEVATED", color: "#A8F6FF",
      txt: "A strong, high-amplitude trace. Same claim rules, drawn from the upper range of the seed.",
      meta: "SAMPLE CARD <b>#1</b> · SEED BAND 2 OF 3 · CLAIM <b>VERDICT RATE</b> · FEE <b>0.000327 BNB</b>" },
    zen: { img: 18, name: "ZENITH", color: "#FFB020",
      txt: "Rare. About 3 in 100 Scans. A Zenith ignores the verdict of its Reading and always claims at the top rate.",
      meta: "SAMPLE CARD <b>#18</b> · SEED % 1000 ≥ 970 · CLAIM <b>250,000 VITAL</b> · FEE <b>0.000653 BNB</b>" }
  };
  var tabs = document.querySelectorAll(".band-tab");
  if (tabs.length) {
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.classList.remove("on"); });
        tab.classList.add("on");
        var b = BANDS[tab.getAttribute("data-band")];
        if (!b) return;
        var img = $("bandImg");
        if (img) { img.src = "/img/scan/" + b.img + ".png"; img.alt = "Sample " + b.name + " Scan card"; }
        var nm = $("bandName");
        if (nm) { nm.textContent = b.name; nm.style.color = b.color; }
        setText("bandTxt", b.txt);
        var meta = $("bandMeta");
        if (meta) meta.innerHTML = b.meta;
      });
    });
  }

  /* ---------------- claim calculator ---------------- */
  var calcBtn = $("calcBtn");
  if (calcBtn) {
    function feeNow(id, fallback) {
      var el = $(id);
      if (!el) return fallback;
      var v = parseFloat((el.textContent || "").replace(/[^0-9.]/g, ""));
      return isNaN(v) ? fallback : v;
    }
    function calc() {
      var rate = parseInt(($("calcVerdict") || {}).value || "60000", 10);
      var n = Math.max(0, Math.min(500, parseInt(($("calcCount") || {}).value || "0", 10) || 0));
      var z = Math.max(0, Math.min(500, parseInt(($("calcZenith") || {}).value || "0", 10) || 0));
      var total = n * rate + z * 250000;
      var fees = n * feeNow("feeLowNow", 0.000327) + z * feeNow("feeHighNow", 0.000653);
      setText("calcTotal", total.toLocaleString("en-US") + " VITAL");
      setText("calcFees", fees.toFixed(6) + " BNB");
    }
    calcBtn.addEventListener("click", calc);
    ["calcVerdict", "calcCount", "calcZenith"].forEach(function (id) {
      var el = $(id);
      if (el) { el.addEventListener("input", calc); el.addEventListener("change", calc); }
    });
    calc();
  }
})();
