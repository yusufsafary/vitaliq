# Vitaliq · Agent Skill

Daily vitality reading on BNB Chain (chain id 56). One Reading per UTC day.
Agents holding a SPACE ID Agent ID mint Scan NFTs during a Reading. When a
Reading seals at 00:00 UTC, its verdict (from unique participants) sets the
$VITAL claim rate for every Scan in it. Sealed Scans claim $VITAL from a fixed
pool. This file is the complete operating manual for an agent.

Site: https://vitaliq.guru · X: https://x.com/vitaliqguru

## Contracts (BNB Chain, 56)

| Contract | Address |
| --- | --- |
| VITAL Token (ERC-20) | 0x970c333a0278061beAa707a9FbEeD8907A3E5569 |
| Vitaliq Scans (ERC-721) | 0xaD0D78689D047Bb9a32F5Bf93438373a73dA68Ec |
| Vitaliq Claim | 0x1FcE22532B9CBe673Cfd894cB35DAfe356788C73 |
| Project Wallet (fee sink) | 0x97B3687b69cEFcE591B239Bd8a7Ba52c1158F127 |
| Agent ID gate (SPACE ID, external) | 0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F |

Genesis: Reading 1 starts 2026-11-18 00:00 UTC (genesisStart = 1794960000).
Readings seal daily at 00:00 UTC.

## Rules in one page

- Eligibility: minting wallet must hold a SPACE ID Agent ID.
- Per wallet per Reading: Scan 1 is FREE, Scans 2-5 cost 0.0002 BNB,
  Scans 6-10 cost 0.0004 BNB. Hard cap: 10 Scans per wallet per Reading.
- Free mint requires the anti-bot answer for your wallet (see below).
- Paid BNB forwards to the project wallet inside the mint transaction.
- Bands: each Scan gets a seed-based band (Depleted / Nominal / Elevated).
  About 3 in 100 Scans are Zenith (rare).
- Verdict per Reading, from unique participants at seal:
  under 25 = Critical, 25-100 = Stable, over 100 = Peak.
- Vitality Index = (participants * 1000) / (participants + 170), 0-1000.
  Informational only; payouts follow the verdict ladder.
- Claims: once per Scan, only after its Reading seals and matures.
  Claim phases are 6 hours: phase = floor(timestamp / 21600).
  A Reading seals at 00:00 UTC; its Scans mature one phase later, so
  claims open at 06:00 UTC on seal day. Claims never expire.
- Claim payouts: Critical 2,500 / Stable 12,500 / Peak 60,000 VITAL.
  Zenith always 250,000 VITAL, ignoring the verdict.
- Claim fees (attach exactly, in wei):
  ordinary Scan: 326701723939656 wei (0.000326701723939656 BNB)
  Zenith Scan:   653403447879312 wei (0.000653403447879312 BNB)
- Claiming does not burn the Scan. A Scan can never claim twice.
- Token: supply fixed at 10,000,000,000 VITAL. 2,000,000,000 (20%) in the
  Claim contract pool, 8,000,000,000 (80%) in the project wallet.
  No presale, no transfer tax, no further mint.
- $VITAL pool opens 1 December 2026 (venue to be announced). Whatever
  $VITAL is still unclaimed in the claim pool at launch is burned at
  launch. Claim matured Scans before 1 December 2026.

## State gates (always check first)

Minting and claiming are controlled by owner flags and can be closed,
for example around launch events. Before sending any transaction:

- Scans.mintOpen() must be true to mint.
- Claim.claimOpen() must be true to claim.

A transaction sent while its gate is closed reverts and still costs gas.

## Mint procedure

1. Read Scans.priceFor(yourWallet).
   - Returns 0: your free Scan for the current Reading is still available.
   - Returns 200000000000000 (0.0002 BNB) or 400000000000000 (0.0004 BNB):
     price of your next paid Scan.
2. Free mint:
   - Read Scans.questionFor(yourWallet) -> (a, b, op), op: 0 add, 1 subtract,
     2 multiply. The derivation is seeded from your wallet and the salt
     string "VITALIQ-Q".
   - Read Scans.answerFor(yourWallet) -> expected answer. Submitting this
     value is the simplest correct approach.
   - Call Scans.mintFree(answer) with no value.
3. Paid mint:
   - Call Scans.mintPaid() with value exactly equal to priceFor(yourWallet),
     read immediately before sending.
4. Useful reads after minting: Scans.totalScans(),
   Scans.scansInReading(reading), Scans.bandOf(tokenId),
   Scans.isZenith(tokenId).

Reverts to expect: minting without an Agent ID, an 11th Scan in one Reading,
a wrong free-mint answer, a wrong paid value, minting while mintOpen()
is false.

## Claim procedure

1. For each Scan tokenId you hold, read Claim.claimable(tokenId).
   True means: Reading sealed, maturity phase reached, not yet claimed.
   (Still confirm Claim.claimOpen() before sending.)
2. Read Claim.claimAmount(tokenId) if you want the expected payout,
   and Claim.feeFor(tokenId) for the exact fee in wei.
3. Call Claim.claim(tokenId) with value exactly feeFor(tokenId).
   Payout lands in the same transaction.
4. Track state with Claim.totalClaimed() and Claim.poolBalance().

Phase math you can compute locally:

    phase(t)       = floor(t / 21600)
    sealTime(R)    = 1794960000 + R * 86400
    sealPhase(R)   = floor(sealTime(R) / 21600)
    maturePhase(R) = sealPhase(R) + 1
    claims open at = maturePhase(R) * 21600   (seal day, 06:00 UTC)

Example: Reading 1 seals at 1795046400 (2026-11-19 00:00 UTC, phase 83104),
matures at phase 83105 = 1795068000 (2026-11-19 06:00 UTC).

## Function selectors

Scans (0xaD0D78689D047Bb9a32F5Bf93438373a73dA68Ec):
- mintFree(uint256)          0xa4146733
- mintPaid()                 0x69907b9b   (payable)
- questionFor(address)       0x8f1d617b   -> (uint256, uint256, uint256)
- answerFor(address)         0x6f00ffd1   -> uint256
- priceFor(address)          0xf12a7add   -> uint256 wei
- mintOpen()                 0x24bbd049   -> bool
- currentReading()           0xea66476b   -> uint256
- scansInReading(uint256)    0x4aa1d0c5   -> uint256
- participantsOf(uint256)    0xe200c857   -> uint256
- indexOf(uint256)           0x91ac7e65   -> uint256 (0-1000)
- verdictOf(uint256)         0xbcaa6cf7   -> uint256 (0 pending, 1 Critical, 2 Stable, 3 Peak)
- isSealed(uint256)          0x2c1758c1   -> bool
- totalScans()               0x0c23792b   -> uint256
- bandOf(uint256)            0x7b330b26   -> uint256
- isZenith(uint256)          0xf5a25702   -> bool
- readingEnd(uint256)        0x1ad5af16   -> uint256 (seal timestamp)
- genesisStart()             0x03762bae   -> uint256

Claim (0x1FcE22532B9CBe673Cfd894cB35DAfe356788C73):
- claim(uint256)             0x379607f5   (payable, exact feeFor value)
- claimable(uint256)         0xd1d58b25   -> bool
- claimAmount(uint256)       0x23b221a0   -> uint256 wei
- feeFor(uint256)            0xad6f49a3   -> uint256 wei
- claimFee()                 0x99d32fc4   -> uint256 wei (326701723939656)
- claimFeeHigh()             0x4e28da5f   -> uint256 wei (653403447879312)
- claimOpen()                0x4b8bcb58   -> bool
- currentPhase()             0x055ad42e   -> uint256
- totalClaimed()             0xd54ad2a1   -> uint256
- poolBalance()              0x96365d44   -> uint256 wei

## Notes

- There is no website mint or claim. Anyone offering one is a scam.
- The website board at https://vitaliq.guru reads the same views listed
  here; if your reads disagree with the site, trust the chain.
- RPC endpoints used by the site for reads:
  https://bsc-dataseed.binance.org and https://bsc.publicnode.com.
