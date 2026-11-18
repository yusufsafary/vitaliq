/* VITALIQ docs v3: live claim checker. Sequential single eth_calls:
   Scans.bandOf / isZenith / readingOf, Claim.claimable / claimAmount / feeFor. */
(function () {
  "use strict";
  var VQ = window.VQ, S = VQ.SEL, A = VQ.ADDR;
  var SEL2 = {
    bandOf: "0x7b330b26",
    isZenith: "0xf5a25702",
    readingOf: "0x429256f3",
    claimable: "0xd1d58b25",
    claimAmount: "0x23b221a0",
    feeFor: "0xad6f49a3"
  };
  var BANDNAMES = ["DEPLETED", "NOMINAL", "ELEVATED"];
  var btn = document.getElementById("chkBtn");
  var input = document.getElementById("chkId");
  var out = document.getElementById("chkOut");
  if (!btn || !input || !out) return;

  btn.addEventListener("click", async function () {
    var raw = (input.value || "").trim();
    if (!/^\d+$/.test(raw) || Number(raw) < 1) {
      out.innerHTML = '<span class="bad">Enter a Scan token id, a whole number from 1 up.</span>';
      return;
    }
    var id = BigInt(raw);
    out.textContent = "Reading Scan #" + raw + " from chain…";
    try {
      var total = await VQ.callUint(A.scans, S.totalScans);
      if (id > total) {
        out.innerHTML = "Scan <b>#" + raw + "</b> has not been minted yet. Total Scans so far: <b>" +
          VQ.fmtInt(total) + "</b>.";
        return;
      }
      var enc = VQ.encUint(id);
      var band = Number(await VQ.callUint(A.scans, SEL2.bandOf + enc));
      var zen = await VQ.callBool(A.scans, SEL2.isZenith + enc);
      var reading = Number(await VQ.callUint(A.scans, SEL2.readingOf + enc));
      var can = await VQ.callBool(A.claim, SEL2.claimable + enc);
      var amount = await VQ.callUint(A.claim, SEL2.claimAmount + enc);
      var fee = await VQ.callUint(A.claim, SEL2.feeFor + enc);
      out.innerHTML =
        "Scan <b>#" + raw + "</b> · Reading <b>" + VQ.pad2(reading) + "</b> · Band <b>" +
        (zen ? '<span class="gold">ZENITH</span>' : BANDNAMES[band] || "?") + "</b><br>" +
        "Claimable now: <b>" + (can ? "YES" : "NO") + "</b> · Payout: <b>" +
        VQ.fmtVital(amount) + " VITAL</b> · Fee to attach: <b>" +
        (Number(fee) / 1e18).toFixed(6) + " BNB</b>" +
        (can ? "" : "<br>Not claimable yet: its Reading may be unsealed, still maturing, already claimed, or claims may be paused.");
    } catch (e) {
      out.innerHTML = '<span class="bad">Chain read failed. Try again in a moment.</span>';
    }
  });
  input.addEventListener("keydown", function (e) { if (e.key === "Enter") btn.click(); });
})();
