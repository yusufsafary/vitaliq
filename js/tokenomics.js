/* VITALIQ tokenomics live figures: claim pool balance, total claimed */
(function () {
  "use strict";
  var VQ = window.VQ, S = VQ.SEL, A = VQ.ADDR;
  function set(id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; }
  (async function () {
    try { set("tkPool", VQ.fmtVital(await VQ.callUint(A.claim, S.poolBalance)) + " VITAL"); }
    catch (e) { set("tkPool", "–"); }
    try { set("tkClaimed", VQ.fmtInt(await VQ.callUint(A.claim, S.totalClaimed)) + " claims"); }
    catch (e) { set("tkClaimed", "–"); }
    try {
      var fee = await VQ.callUint(A.claim, S.claimFee);
      set("tkFeeLow", (Number(fee) / 1e18).toFixed(6) + " BNB");
    } catch (e) {}
    try {
      var feeH = await VQ.callUint(A.claim, S.claimFeeHigh);
      set("tkFeeHigh", (Number(feeH) / 1e18).toFixed(6) + " BNB");
    } catch (e) {}
    try {
      var co = await VQ.callBool(A.claim, S.claimOpen);
      set("tkClaimState", co ? "OPEN" : "OPENS AT LAUNCH");
    } catch (e) {}
  })();
})();
