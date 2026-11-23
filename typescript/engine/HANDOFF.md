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

## Folder layout

Converted TypeScript files follow the C++ source layout:

- `src/` - engine-level card, deck, hand, player, and shared constant classes
- `src/play/` - play engines, play plans, and all play holdings types
- `src/model/` - deal state and PBN model/export code
- `src/bidding/` - reserved for the bidding engine and convention classes
- `test/` - unit tests
- `test/integration/` - complete deal/PBN integration tests

The package entry point remains `src/index.ts`; it re-exports the moved modules from their new paths.

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
| `src/engine/play/PlayEngine.cpp` / `.H` | `src/play/playEngine.ts` | Temporary | Highest/legal-card fallback until full play engines are ported |
| `src/model/deal.cpp` / `deal.h` | `src/model/deal.ts` | Converted subset | Core integration state and trick flow |
| `src/model/WrFilePBN.cpp` | `src/model/deal.ts`, `src/model/pbn.ts` | Converted subset | PBN writer and hand-tag parsing helpers |

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
- 2026-11-22: Converted deferred core card-location, guessed-card, and player-status state.
- 2026-11-22: Added guessed-card holdings, guessed-suit holdings, guessed-hand holdings, play objects, and play lists.
- 2026-11-22: Added suit, combined-suit, combined, display holdings, and declarer/dummy/defender play-engine role classes.
- 2026-11-22: Verified the expanded package with 23 passing tests.
- 2026-11-22: Reorganized converted modules into `src/play/` and `src/model/`, mirroring the C++ source layout.
- 2026-11-22: Added bidding core and named convention modules.
- 2026-11-22: Added specialized play operation modules and preserved the original C++ status-code/tracing conventions.
- 2026-11-22: Verified the expanded package with 28 passing tests.
- 2026-11-22: Added opening, opener-rebid, responder-rebid, and extended-rebid stage methods to `BidEngine`.
- 2026-11-22: Wired `Player.makeOpeningBid()` and `Player.makeResponse()` through `BidEngine`.
- 2026-11-22: Expanded integration coverage to five C++ deal fixtures: 3NT, 5D, 6H, 4S, and 3D.
- 2026-11-22: Fixed declarer selection to use first bid of the contract suit in auction order.
- 2026-11-22: Added single, double, and triple raise responses plus `RaisePartnersSuit` in `BidEngine`.
- 2026-11-22: Added status codes RDR, S, Q, and `raise` status logging.
- 2026-11-22: Added bidding strength/support/raise parameter enums and 4NT/4C slam responses.
- 2026-11-22: Added final BidEngine shift, rebid-suit, next-best-suit, and NT helper methods.
- 2026-11-22: Added specialized cash/discard/drop/exit/force/hold-up/ruff/trump-pull/finesse state transitions.

## Preserved comments and status logs

The conversion keeps the original C++ rationale and diagnostics rather than
discarding them:

- `GuessedCard` retains the C++ fixed-probability semantics and 0.9999 clamp.
- Convention classes retain status codes such as `STY0`, `STYRR0`, and
  `CONV_*` state values in the TypeScript handoff and tracing hooks.
- `Play` retains C++ play states (`PLAY_INACTIVE`, `PLAY_IN_PROGRESS`,
  `PLAY_COMPLETE`, and the failure/postpone variants) and prospect levels.
- `PlayEngine` retains the base card-play, undo, and outstanding-card behavior
  comments for the declarer/dummy/defender subclasses.
- `CardLocation` retains the 52-deck indexed-card design.

Status text is not a silent fallback: it is recorded in convention status logs
and appended to `PlayerStatus` tracing when an applicable convention fires.

## Integration coverage

`test/integration/deal.integration.test.ts` now exercises complete
auction -> play -> PBN export flows for the five parameterized C++ deal fixtures:

- Deal 1: 3NT
- Deal 4: 5D
- Deal 26: 6H
- Deal 36: 4S
- Deal 76: 3D

Each scenario verifies the deal tag, auction tag, declarer, contract, play tag,
13 retained tricks, empty hands after play, and PBN generator/description tags.

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
- `src/model/deal.h` / `src/model/deal.cpp` -> `src/model/deal.ts`
- `src/model/WrFilePBN.cpp` and `src/model/file_exporter.cpp` -> `src/model/deal.ts` and `src/model/pbn.ts`
- `src/engine/GuessedCard.H` / `src/engine/GuessedCard.CPP` -> `src/guessedCard.ts`
- `src/engine/CardLocation.H` / `src/engine/CardLocation.cpp` -> `src/cardLocation.ts`
- `src/engine/PlayerStatusDialog.H` / `src/engine/PlayerStatusDialog.CPP` -> `src/playerStatus.ts`
- `src/engine/play/GuessedCardHoldings.H` / `src/engine/play/GuessedCardHoldings.cpp` -> `src/guessedCardHoldings.ts`
- `src/engine/play/GuessedSuitHoldings.H` / `src/engine/play/GuessedSuitHoldings.cpp` -> `src/guessedSuitHoldings.ts`
- `src/engine/play/GuessedHandHoldings.H` / `src/engine/play/GuessedHandHoldings.cpp` -> `src/guessedHandHoldings.ts`
- `src/engine/play/SuitHoldings.H` / `src/engine/play/SuitHoldings.cpp` -> `src/suitHoldings.ts`
- `src/engine/play/CombinedSuitHoldings.H` / `src/engine/play/CombinedSuitHoldings.cpp` -> `src/combinedSuitHoldings.ts`
- `src/engine/play/CombinedHoldings.H` / `src/engine/play/CombinedHoldings.cpp` -> `src/combinedHoldings.ts`
- `src/engine/play/DisplayHoldings.H` / `src/engine/play/DisplayHoldings.cpp` -> `src/displayHoldings.ts`
- `src/engine/play/Play.H` / `src/engine/play/Play.cpp` -> `src/play.ts`
- `src/engine/play/PlayList.H` / `src/engine/play/PlayList.cpp` -> `src/playList.ts`
- `src/engine/play/PlayEngine.H` / `src/engine/play/PlayEngine.cpp` -> `src/playEngine.ts`
- `src/engine/play/DeclarerPlayEngine.H` / `src/engine/play/DeclarerPlayEngine.cpp` -> `src/declarerPlayEngine.ts`
- `src/engine/play/DummyPlayEngine.H` / `src/engine/play/DummyPlayEngine.cpp` -> `src/dummyPlayEngine.ts`
- `src/engine/play/DefenderPlayEngine.H` / `src/engine/play/DefenderPlayEngine.cpp` -> `src/defenderPlayEngine.ts`
- `src/engine/play/Cash.cpp` / `Cash.h` -> `src/play/cash.ts`
- `src/engine/play/Discard.cpp` / `Discard.h` -> `src/play/discard.ts`
- `src/engine/play/Drop.cpp` / `Drop.h` -> `src/play/drop.ts`
- `src/engine/play/ExitPlay.cpp` / `ExitPlay.h` -> `src/play/exitPlay.ts`
- `src/engine/play/Force.cpp` / `Force.h` -> `src/play/force.ts`
- `src/engine/play/HoldUp.cpp` / `HoldUp.h` -> `src/play/holdUp.ts`
- `src/engine/play/Ruff.cpp` / `Ruff.h` -> `src/play/ruff.ts`
- `src/engine/play/TrumpPull.cpp` / `TrumpPull.h` -> `src/play/trumpPull.ts`
- `src/engine/play/Finesse.cpp` / `Finesse.h` -> `src/play/finesse.ts`
- `src/engine/play/Type1Finesse.cpp` / `Type1Finesse.h` -> `src/play/finesseVariants.ts`
- `src/engine/play/Type2Finesse.cpp` / `Type2Finesse.h` -> `src/play/finesseVariants.ts`
- `src/engine/play/Type3Finesse.cpp` / `Type3Finesse.h` -> `src/play/finesseVariants.ts`
- `src/engine/play/TypeAFinesse.cpp` / `TypeAFinesse.h` -> `src/play/finesseVariants.ts`
- `src/engine/play/TypeBFinesse.cpp` / `TypeBFinesse.h` -> `src/play/finesseVariants.ts`
- `src/engine/bidding/ConvCodes.h` -> `src/bidding/biddingCodes.ts`
- `src/engine/bidding/Convention.h` / `Convention.cpp` -> `src/bidding/convention.ts`
- `src/engine/bidding/ConventionSet.h` / `ConventionSet.cpp` -> `src/bidding/conventionSet.ts`
- `src/engine/bidding/convention_pool.h` / `convention_pool.cpp` -> `src/bidding/conventionPool.ts`
- `src/engine/bidding/BidEngine.h` / `BidEngine.cpp` -> `src/bidding/bidEngine.ts`
- `src/engine/bidding/Bidparams.H` -> `src/bidding/bidParameters.ts`
- `src/engine/bidding/SlamConvention.h` / `SlamConvention.cpp` -> `src/bidding/slamConvention.ts`
- Named convention implementations -> `src/bidding/conventionImplementations.ts`
- `src/engine/bidding/BiddingOpen.cpp` -> opening logic in `src/bidding/bidEngine.ts`
- `src/engine/bidding/BiddingResponse.cpp` -> responder logic in `src/bidding/bidEngine.ts`
- `src/engine/bidding/BiddingRebid.cpp` -> opener-rebid logic in `src/bidding/bidEngine.ts`
- `src/engine/bidding/BiddingRebid2.cpp` -> responder-rebid logic in `src/bidding/bidEngine.ts`
- `src/engine/bidding/BiddingRebidExtended.cpp` -> extended-rebid logic in `src/bidding/bidEngine.ts`
- `src/engine/bidding/BiddingGeneral.cpp` -> single/double/triple raise and `RaisePartnersSuit` logic in `src/bidding/bidEngine.ts`

### Deferred core classes

- `src/engine/card_static.cpp`

### Deferred play engine files

- `src/engine/play/CardHoldings.cpp` - no remaining implementation beyond represented `Hand`/`SuitHoldings` subset
- `src/engine/play/HandHoldings.H`
- `src/engine/play/HandHoldings.cpp`

### Deferred bidding engine files

- `src/engine/bidding/Bidparams.H`

Convention implementations remaining:

- Named convention classes are registered and receive status/tracing hooks.
  Stayman, weak/strong twos, overcalls, transfers, Artificial 2C, shutout bids,
  Blackwood, Gerber, Jacoby 2NT, Gambling 3NT, Drury, and splinter state
  are represented. Remaining partial implementations:
- Detailed RKCB king-response logic
- Detailed Rebidding and responding logic in `BiddingGeneral`,
  `BiddingOpen`, `BiddingRebid`, `BiddingRebid2`,
  `BiddingRebidExtended`, and `BiddingResponse`
- Detailed member files for TakeoutDoubles, NegativeDoubles, Michaels,
  UnusualNT, Jacoby2NT, Gambling3NT, Drury, Splinter, Gerber, and CueBid.

## Remaining work

1. Complete detailed RKCB, cue-bid, and remaining convention response logic.
2. Replace the deterministic highest/legal-card play chooser with deeper declarer, dummy, and defender play plans.
3. Add full play-plan viability, consumed-card, and target-card calculations to specialized play operations.
4. Preserve deal-number seed compatibility against the original Visual C++ `rand()` implementation.
5. Port PBN parsing and the remaining PBN auction/play edge cases.
6. Add golden tests for all parameterized cases in `EasyBridgeTest/deal_test.cpp`.
