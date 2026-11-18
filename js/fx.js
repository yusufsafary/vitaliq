/* VITALIQ shared FX (v3 upgrade)
   - reveal on scroll: hidden state is applied by this script only, so
     content stays visible when JS or IntersectionObserver is missing;
     a timed fallback reveals everything regardless.
   - animated counters for [data-count]
   - header live Index chip (when chain.js is present)
   - footer address copy buttons
   - whitepaper scroll progress bar */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- reveal on scroll ---------- */
  var targets = document.querySelectorAll(
    ".panel, .stat, .step, .band, .dtable, .split, .formula, .note, .faq details, .soon-panel"
  );
  if (targets.length && !reduced && "IntersectionObserver" in window) {
    targets.forEach(function (el) { el.classList.add("rv"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -4% 0px" });
    targets.forEach(function (el) { io.observe(el); });
    /* fallback: never leave anything hidden */
    setTimeout(function () {
      targets.forEach(function (el) { el.classList.add("in"); });
    }, 1600);
  }

  /* ---------- counters ---------- */
  var counters = document.querySelectorAll("[data-count]");
  function runCounter(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var dec = parseInt(el.getAttribute("data-dec") || "0", 10);
    if (isNaN(target)) return;
    if (reduced) { el.textContent = target.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }); return; }
    var t0 = performance.now(), dur = 1300;
    function step(t) {
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      var v = target * e;
      el.textContent = v.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (counters.length) {
    if ("IntersectionObserver" in window && !reduced) {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { runCounter(en.target); cio.unobserve(en.target); }
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { cio.observe(el); });
    } else {
      counters.forEach(runCounter);
    }
  }

  /* ---------- header index chip ---------- */
  var chip = document.getElementById("idxChip");
  if (chip && window.VQ) {
    var VQ = window.VQ, S = VQ.SEL, A = VQ.ADDR;
    async function chipLoad() {
      try {
        var reading = Number(await VQ.callUint(A.scans, S.currentReading));
        if (reading < 1) { chip.innerHTML = "IDX <b>STANDBY</b>"; return; }
        var idx = await VQ.callUint(A.scans, S.indexOf + VQ.encUint(reading));
        chip.innerHTML = "IDX <b>" + VQ.fmtInt(idx) + "</b>";
      } catch (e) { chip.innerHTML = "IDX <b>–</b>"; }
    }
    chipLoad();
    setInterval(chipLoad, 60000);
  }

  /* ---------- footer copy buttons ---------- */
  document.querySelectorAll(".foot-col .citem").forEach(function (item) {
    var addr = item.querySelector(".addr");
    if (!addr) return;
    var btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.type = "button";
    btn.textContent = "COPY";
    btn.addEventListener("click", function () {
      var txt = addr.textContent.trim();
      function done() {
        btn.textContent = "COPIED";
        setTimeout(function () { btn.textContent = "COPY"; }, 1400);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(done, done);
      } else { done(); }
    });
    addr.appendChild(btn);
  });

  /* ---------- scroll progress (whitepaper) ---------- */
  var prog = document.querySelector(".wp-progress");
  if (prog) {
    function onScroll() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      prog.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
})();
