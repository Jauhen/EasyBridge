# TypeScript Engine Conversion Handoff

## Goal

Create a standalone npm TypeScript package at `typescript/engine` that reproduces the bridge engine behavior used by `EasyBridgeTest/deal_test.cpp`, especially deterministic dealt hands, bidding, trick play, scoring, and PBN export.

## Conversion order

1. Card constants and card identity
2. Deck and card-list primitives
3. Hand holdings and player state
4. Auction state and a rule-based bidding engine
5. Deal state, trick play, scoring, and PBN export
6. Integration tests using complete deals
7. Incremental port of the remaining C++ play and convention engines

## File status

| C++ source | TypeScript target | Status | Notes |
| --- | --- | --- | --- |
| `src/engine/card_constants.h` | `src/constants.ts` | Converted | Core suits, positions, bids, and deck helpers |
| `src/engine/card.cpp` / `CARD.H` | `src/card.ts` | Converted subset | UI-only MFC/GDI methods excluded |
| `src/engine/Deck.cpp` / `Deck.H` | `src/deck.ts` | Converted subset | Card creation and deterministic shuffle |
| `src/engine/CardList.cpp` / `CardList.H` | `src/cardList.ts` | Converted subset | Holdings collections |
| `src/engine/play/CardHoldings.cpp` / `.H` | `src/hand.ts` | Converted subset | PBN and point-count operations |
| `src/engine/play/HandHoldings.cpp` / `.H` | `src/hand.ts` | Converted subset | Hand by suit |
| `src/engine/player.cpp` / `Player.h` | `src/player.ts` | Converted subset | Simple auction/delegation |
| `src/engine/bidding/BidEngine.cpp` / `.H` | `src/player.ts` | Simple subset | Natural opening/responding behavior only |
| `src/engine/play/PlayEngine.cpp` / `.H` | `src/deal.ts` | Temporary | Highest/legal-card fallback until full play engines are ported |
| `src/model/deal.cpp` / `deal.h` | `src/deal.ts` | Converted subset | Core integration state and trick flow |
| `src/model/WrFilePBN.cpp` | `src/deal.ts`, `src/pbn.ts` | Converted subset | PBN writer and hand-tag parsing helpers |

## Established mappings

- Position order follows S, W, N, E clockwise; `nextPosition` is S -> W -> N -> E -> S.
- Deck value is `suit * 13 + faceValue - 2`, with suits C, D, H, S.
- PBN deal order is W, N, E, S.
- PBN initial hands must be preserved separately from cards played.

## Unknowns and deferred work

- Exact Visual C++/MFC UI behavior is intentionally not ported.
- The original bidding and advanced play engines depend on hundreds of convention classes. They need staged conversion behind temporary engines.
- Deterministic deal-number compatibility is separate from the integration API and must be validated against the C++ implementation.

## Session log

- 2026-11-22: Created project scaffold and conversion plan.
- 2026-11-22: Added the first executable vertical slice: constants, Card, CardList, Deck, Hand, Player, Deal, and PBN export.
- 2026-11-22: Added Vitest unit tests and a complete PBN deal integration test.
- 2026-11-22: Verified `npm run build` and `npm test`.

## Concrete source inventory

The original engine is under `src/engine/` and has 107 C++/header files:

### Converted or partially represented

- `src/engine/card_constants.h` -> `src/constants.ts`
- `src/engine/CARD.H` / `src/engine/card.cpp` -> `src/card.ts`
- `src/engine/CardList.H` / `src/engine/CardList.cpp` -> `src/cardList.ts`
- `src/engine/Deck.H` / `src/engine/Deck.cpp` -> `src/deck.ts`
- `src/engine/play/HandHoldings.H` / `src/engine/play/HandHoldings.cpp` -> represented in `src/hand.ts`
- `src/engine/play/CardHoldings.H` / `src/engine/play/CardHoldings.cpp` -> represented in `src/hand.ts`
- `src/engine/Player.h` / `src/engine/player.cpp` -> `src/player.ts`
- `src/model/deal.h` / `src/model/deal.cpp` -> `src/deal.ts`
- `src/model/WrFilePBN.cpp` and `src/model/file_exporter.cpp` -> `src/deal.ts` and `src/pbn.ts`

### Deferred core classes

- `src/engine/CardLocation.H`
- `src/engine/CardLocation.cpp`
- `src/engine/card_static.cpp`
- `src/engine/GuessedCard.H`
- `src/engine/GuessedCard.CPP`
- `src/engine/PlayerStatusDialog.H`
- `src/engine/PlayerStatusDialog.CPP`

### Deferred play engine files

- `src/engine/play/CardHoldings.cpp`
- `src/engine/play/CombinedHoldings.H`
- `src/engine/play/CombinedHoldings.cpp`
- `src/engine/play/CombinedSuitHoldings.H`
- `src/engine/play/CombinedSuitHoldings.cpp`
- `src/engine/play/DeclarerPlayEngine.H`
- `src/engine/play/DeclarerPlayEngine.cpp`
- `src/engine/play/DefenderPlayEngine.H`
- `src/engine/play/DefenderPlayEngine.cpp`
- `src/engine/play/DisplayHoldings.H`
- `src/engine/play/DisplayHoldings.cpp`
- `src/engine/play/DummyPlayEngine.H`
- `src/engine/play/DummyPlayEngine.cpp`
- `src/engine/play/GuessedCardHoldings.H`
- `src/engine/play/GuessedCardHoldings.cpp`
- `src/engine/play/GuessedHandHoldings.H`
- `src/engine/play/GuessedHandHoldings.cpp`
- `src/engine/play/GuessedSuitHoldings.H`
- `src/engine/play/GuessedSuitHoldings.cpp`
- `src/engine/play/HandHoldings.H`
- `src/engine/play/HandHoldings.cpp`
- `src/engine/play/PlayEngine.H`
- `src/engine/play/PlayEngine.cpp`
- `src/engine/play/PlayList.H`
- `src/engine/play/PlayList.cpp`
- `src/engine/play/SuitHoldings.H`
- `src/engine/play/SuitHoldings.cpp`
- `src/engine/play/Cash.cpp`
- `src/engine/play/Cash.h`
- `src/engine/play/Discard.cpp`
- `src/engine/play/Discard.h`
- `src/engine/play/Drop.cpp`
- `src/engine/play/Drop.h`
- `src/engine/play/ExitPlay.cpp`
- `src/engine/play/ExitPlay.h`
- `src/engine/play/Finesse.cpp`
- `src/engine/play/Finesse.h`
- `src/engine/play/Force.cpp`
- `src/engine/play/Force.h`
- `src/engine/play/HoldUp.cpp`
- `src/engine/play/HoldUp.h`
- `src/engine/play/Play.cpp`
- `src/engine/play/Play.h`
- `src/engine/play/Ruff.cpp`
- `src/engine/play/Ruff.h`
- `src/engine/play/TrumpPull.cpp`
- `src/engine/play/TrumpPull.h`
- `src/engine/play/Type1Finesse.cpp`
- `src/engine/play/Type1Finesse.h`
- `src/engine/play/Type2Finesse.cpp`
- `src/engine/play/Type2Finesse.h`
- `src/engine/play/Type3Finesse.cpp`
- `src/engine/play/Type3Finesse.h`
- `src/engine/play/TypeAFinesse.cpp`
- `src/engine/play/TypeAFinesse.h`
- `src/engine/play/TypeBFinesse.cpp`
- `src/engine/play/TypeBFinesse.h`

### Deferred bidding engine files

- `src/engine/bidding/BidEngine.H`
- `src/engine/bidding/BidEngine.cpp`
- `src/engine/bidding/BiddingGeneral.cpp`
- `src/engine/bidding/BiddingOpen.cpp`
- `src/engine/bidding/BiddingRebid.cpp`
- `src/engine/bidding/BiddingRebid2.cpp`
- `src/engine/bidding/BiddingRebidExtended.cpp`
- `src/engine/bidding/BiddingResponse.cpp`
- `src/engine/bidding/Convention.H`
- `src/engine/bidding/Convention.cpp`
- `src/engine/bidding/ConventionSet.H`
- `src/engine/bidding/ConventionSet.cpp`
- `src/engine/bidding/convention_pool.H`
- `src/engine/bidding/convention_pool.cpp`
- `src/engine/bidding/ConvCodes.h`
- `src/engine/bidding/Bidparams.H`

Convention implementations remaining:

- `4thSuitForcingConvention`, `Artificial2ClubConvention`, `BlackwoodConvention`,
  `CueBidConvention`, `DruryConvention`, `Gambling3NTConvention`,
  `GerberConvention`, `Jacoby2NTConvention`, `JacobyTransferConvention`,
  `MichaelsCueBidConvention`, `NegativeDoublesConvention`, `OvercallsConvention`,
  `ShutoutBidsConvention`, `SlamConvention`, `SplinterBidsConvention`,
  `StaymanConvention`, `StrongTwoBidsConvention`, `TakeoutDoublesConvention`,
  `UnusualNTConvention`, and `WeakTwoBidsConvention`.

## Remaining work

1. Replace the simplified natural bidding logic with the C++ convention engine in dependency order.
2. Replace the deterministic highest/legal-card play chooser with the declarer, dummy, and defender play engines.
3. Preserve deal-number seed compatibility against the original Visual C++ `rand()` implementation.
4. Port PBN parsing and the full PBN auction/play tags.
5. Add golden tests for all parameterized cases in `EasyBridgeTest/deal_test.cpp`.
