/* VITALIQ docs demo: read questionFor / answerFor / priceFor for any wallet.
   Read-only eth_calls against the Scans contract. */
(function () {
  "use strict";
  var VQ = window.VQ, S = VQ.SEL, A = VQ.ADDR;
  var btn = document.getElementById("qBtn");
  var input = document.getElementById("qAddr");
  var out = document.getElementById("qOut");
  if (!btn || !input || !out) return;
  btn.addEventListener("click", async function () {
    var addr = input.value.trim();
    if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) {
      out.textContent = "Enter a valid BNB Chain address (0x, 40 hex characters).";
      return;
    }
    out.textContent = "Reading from chain…";
    try {
      var hex = await VQ.call(A.scans, S.questionFor + VQ.encAddr(addr));
      var a = VQ.word(hex, 0), b = VQ.word(hex, 1), op = VQ.word(hex, 2);
      var ans = await VQ.callUint(A.scans, S.answerFor + VQ.encAddr(addr));
      var price = await VQ.callUint(A.scans, S.priceFor + VQ.encAddr(addr));
      var opName = ["a + b", "a − b", "a × b"][Number(op)] || ("op " + op);
      out.innerHTML = "questionFor → a = <b>" + a + "</b>, b = <b>" + b + "</b>, op = <b>" + op +
        "</b> (" + opName + ") · answerFor → <b>" + ans + "</b> · priceFor → <b>" +
        (price === 0n ? "0 BNB (first Scan free)" : (Number(price) / 1e18) + " BNB") + "</b>";
    } catch (e) {
      out.textContent = "Chain read failed. Check the address and try again.";
    }
  });
})();
