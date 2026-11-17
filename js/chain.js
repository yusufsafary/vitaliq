/* VITALIQ chain reader · BSC mainnet (56)
   Sequential single eth_call requests. Each call tries the primary RPC,
   then falls back to the secondary. No batch requests. */
(function () {
  "use strict";

  var RPCS = ["https://bsc-dataseed.binance.org", "https://bsc.publicnode.com"];

  var ADDR = {
    token: "0x970c333a0278061beAa707a9FbEeD8907A3E5569",
    scans: "0xaD0D78689D047Bb9a32F5Bf93438373a73dA68Ec",
    claim: "0x1FcE22532B9CBe673Cfd894cB35DAfe356788C73",
    wallet: "0x97B3687b69cEFcE591B239Bd8a7Ba52c1158F127"
  };

  /* function selectors, computed with ethers.id() */
  var SEL = {
    currentReading: "0xea66476b",
    scansInReading: "0x4aa1d0c5",
    participantsOf: "0xe200c857",
    indexOf: "0x91ac7e65",
    verdictOf: "0xbcaa6cf7",
    isSealed: "0x2c1758c1",
    totalScans: "0x0c23792b",
    readingEnd: "0x1ad5af16",
    mintOpen: "0x24bbd049",
    questionFor: "0x8f1d617b",
    answerFor: "0x6f00ffd1",
    priceFor: "0xf12a7add",
    bandOf: "0x7b330b26",
    isZenith: "0xf5a25702",
    totalClaimed: "0xd54ad2a1",
    poolBalance: "0x96365d44",
    claimFee: "0x99d32fc4",
    claimFeeHigh: "0x4e28da5f",
    claimOpen: "0x4b8bcb58",
    currentPhase: "0x055ad42e"
  };

  function encUint(n) {
    var hex = BigInt(n).toString(16);
    return "0".repeat(64 - hex.length) + hex;
  }
  function encAddr(a) {
    return "0".repeat(24) + a.replace(/^0x/i, "").toLowerCase();
  }

  function rpcOnce(url, to, data) {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_call",
        params: [{ to: to, data: data }, "latest"]
      })
    })
      .then(function (r) {
        if (!r.ok) throw new Error("http " + r.status);
        return r.json();
      })
      .then(function (j) {
        if (!j || !j.result || j.result === "0x") throw new Error("empty result");
        return j.result;
      });
  }

  /* call(to, data) -> Promise<hex string>; tries each RPC in order */
  function call(to, data) {
    var chain = Promise.reject(new Error("start"));
    RPCS.forEach(function (url) {
      chain = chain.catch(function () {
        return rpcOnce(url, to, data);
      });
    });
    return chain;
  }

  function callUint(to, data) {
    return call(to, data).then(function (hex) {
      return BigInt(hex);
    });
  }
  function callBool(to, data) {
    return callUint(to, data).then(function (v) {
      return v !== 0n;
    });
  }

  function word(hex, i) {
    return BigInt("0x" + hex.slice(2 + i * 64, 2 + (i + 1) * 64));
  }

  /* formatting */
  function fmtInt(v) {
    return Number(v).toLocaleString("en-US");
  }
  function fmtVital(wei) {
    var whole = wei / 10n ** 18n;
    return whole.toLocaleString("en-US");
  }
  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }

  window.VQ = {
    RPCS: RPCS,
    ADDR: ADDR,
    SEL: SEL,
    encUint: encUint,
    encAddr: encAddr,
    call: call,
    callUint: callUint,
    callBool: callBool,
    word: word,
    fmtInt: fmtInt,
    fmtVital: fmtVital,
    pad2: pad2
  };
})();
