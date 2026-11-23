import { describe, expect, it } from 'vitest';
import {
  Card,
  CardList,
  CardLocation,
  Deck,
  GuessedCard,
  GuessedCardHoldings,
  GuessedHandHoldings,
  GuessedSuitHoldings,
  NONE,
  Play,
  PlayList,
  PlayType,
  Position,
  PlayerStatus,
  Suit,
  SuitHoldings,
  CombinedSuitHoldings,
  CombinedHoldings,
  DisplayHoldings,
  Hand,
  DeclarerPlayEngine,
  DummyPlayEngine,
  DefenderPlayEngine,
  Cash,
  Discard,
  Drop,
  ExitPlay,
  Force,
  HoldUp,
  Ruff,
  TrumpPull,
  Finesse,
  Type1Finesse,
  Type2Finesse,
  Type3Finesse,
  TypeAFinesse,
  TypeBFinesse,
} from '../src/index.js';

describe('Card', () => {
  it('maps suits and face values to and from deck values', () => {
    const card = Card.fromDeckValue(50);
    expect(card.suit).toBe(Suit.Spades);
    expect(card.faceValue).toBe(13);
    expect(card.name).toBe('SK');
  });

  it('keeps sorted card lists descending by deck value', () => {
    const list = new CardList([
      new Card(Suit.Hearts, 2),
      new Card(Suit.Hearts, 14),
      new Card(Suit.Hearts, 11),
    ]);
    expect(list.at(0)?.name).toBe('HA');
    expect(list.at(1)?.name).toBe('HJ');
  });

  it('creates a 52-card deck', () => {
    const deck = new Deck();
    deck.initializeCards();
    expect(deck.cards).toHaveLength(52);
  });

  it('shuffles deterministically for the same seed', () => {
    const first = new Deck();
    const second = new Deck();
    first.shuffle(12345);
    second.shuffle(12345);
    expect(first.cards.map(card => card.deckValue))
      .toEqual(second.cards.map(card => card.deckValue));
  });

  it('formats card names like the C++ engine utilities', () => {
    const card = new Card(Suit.Hearts, 12);
    expect(card.fullName).toBe('Queen of Hearts');
    expect(card.reverseFullName).toBe('Heart Queen');
  });

  it('counts void, singleton, doubleton, honor, and quick-trick hand statistics', () => {
    const hand = new Hand();
    hand.add(new Card(Suit.Spades, 14));
    hand.add(new Card(Suit.Spades, 13));
    hand.add(new Card(Suit.Hearts, 14));
    hand.add(new Card(Suit.Diamonds, 12));
    hand.add(new Card(Suit.Diamonds, 11));
    hand.add(new Card(Suit.Clubs, 10));
    hand.add(new Card(Suit.Clubs, 9));
    expect(hand.numAces).toBe(2);
    expect(hand.numKings).toBe(1);
    expect(hand.numQueens).toBe(1);
    expect(hand.numVoids).toBe(0);
    expect(hand.numSingletons).toBe(1);
    expect(hand.numQuickTricks).toBeGreaterThan(0);
  });
});

describe('Guessed card state', () => {
  it('tracks probable and definite locations', () => {
    const guessed = new GuessedCard(new Card(Suit.Spades, 14));
    guessed.setProbableLocation(Position.East);
    expect(guessed.probableLocation).toBe(Position.East);
    expect(guessed.definiteLocation).toBe(NONE);

    guessed.setDefiniteLocation(Position.West);
    expect(guessed.definiteLocation).toBe(Position.West);
  });

  it('marks played cards and clamps fix probability', () => {
    const guessed = new GuessedCard(new Card(Suit.Diamonds, 13));
    guessed.setFixProbability(0.4);
    guessed.adjustFixProbabilityIncremental(0.5);
    expect(guessed.fixProbabilityValue).toBeGreaterThan(0.4);
    guessed.markAsPlayed(Position.North);
    expect(guessed.wasPlayed).toBe(true);
    expect(guessed.locationIdentified).toBe(true);
  });

  it('indexes all 52 cards in card location state', () => {
    const location = new CardLocation();
    expect(location.all).toHaveLength(52);
    expect(location.at(51).name).toBe('SA');
  });
});

describe('Player status', () => {
  it('records and clears analysis text', () => {
    const status = new PlayerStatus();
    status.setPosition(Position.North);
    status.appendLine('North opens 1NT');
    expect(status.text).toBe('North opens 1NT\n');
    status.clear();
    expect(status.text).toBe('');
  });

  it('tracks hint suspension', () => {
    PlayerStatus.suspendHintOutput();
    expect(PlayerStatus.hintsSuspended).toBe(true);
    PlayerStatus.resumeHintOutput();
    expect(PlayerStatus.hintsSuspended).toBe(false);
  });

  it('parses C++ verbosity prefixes, header stripping, bang replacement, and hint blocks', () => {
    const status = new PlayerStatus({
      analysisTraceLevel: 2,
      showCommentIdentifiers: false,
    });
    status.setPosition(Position.South);
    status.clearHints();
    status.beginHintBlock();
    // Level 2 <= 2: included; STY0! header stripped; remaining ! -> :
    status.stream('2STY0! Partner opened 1NT! Bid 2C.\n');
    // Level 4 > 2: skipped and suppresses continuation until newline
    status.stream('4Verbose detail ').addStream('still suppressed\n');
    // Escaped !1 overrides stream level
    status.setStreamOutputLevel(4);
    status.stream('!1Forced line\n');
    status.clearStreamOutputLevel();
    status.endHintBlock();

    expect(status.text).toBe('Partner opened 1NT: Bid 2C.\nForced line\n');
    expect(PlayerStatus.hintBlockText).toBe('Partner opened 1NT: Bid 2C.\nForced line\n');
    status.clearHints();
  });
});

describe('Phase 1 Core Engine C++ parity', () => {
  it('ports card_static helpers and CCard metadata', () => {
    expect(Card.charToSuit('h')).toBe(Suit.Hearts);
    expect(Card.charToFaceValue('t')).toBe(10);
    expect(Card.cardValToString(2)).toBe('Deuce');
    expect(Card.cardToString(2)).toBe('Four of Clubs');
    expect(Card.cardToShortString(37)).toBe('HK');
    expect(Card.cardToReverseString(37)).toBe('Heart King');
    expect(Card.suitToSingularString(Suit.Spades)).toBe('Spade');
    expect(Card.suitToString(99)).toBe('????');

    const card = new Card(Suit.Diamonds, 7);
    expect(card.fullName).toBe('Seven of Diamonds');
    expect(card.reverseFullName).toBe('Diamond Seven');
    expect(card.faceName).toBe('seven');
    expect(card.cardLetter).toBe('7');
    expect(card.suitLetter).toBe('D');
    card.setOwner(Position.South);
    card.setAssigned(true);
    expect(card.isCardAssigned).toBe(true);
    card.setOwner(NONE);
    expect(card.isCardAssigned).toBe(false);
  });

  it('ports CardList equivalent, range, above/below, and comma-delimited helpers', () => {
    const list = new CardList([
      new Card(Suit.Hearts, 14),
      new Card(Suit.Hearts, 13),
      new Card(Suit.Hearts, 12),
      new Card(Suit.Hearts, 8),
    ]);
    expect(list.getHoldingsCommaDelimited()).toBe('HA, HK, HQ, and H8');
    expect(list.rangeCovers(10)).toBe(true);
    expect(list.rangeCovers(7)).toBe(false);
    expect(list.getLowestCardAbove(10)?.name).toBe('HQ');
    expect(list.getHighestCardBelow(12)?.name).toBe('H8');

    const hk = list.findCard(Suit.Hearts, 13)!;
    const hq = list.findCard(Suit.Hearts, 12)!;
    const h8 = list.findCard(Suit.Hearts, 8)!;
    expect(list.areEquivalentCards(hk, hq)).toBe(true);
    expect(list.areEquivalentCards(hk, h8)).toBe(false);
    expect(list.getHighestEquivalentCard(hq)?.name).toBe('HA');
    expect(list.getLowestEquivalentCard(hk)?.name).toBe('HQ');

    const equiv = new CardList();
    expect(list.getEquivalentCards(hk, equiv, true)).toBe(3);
    expect(equiv.holdingsString).toBe('HA HK HQ');
  });

  it('supports suit-first and rank-first Deck.getCardByName', () => {
    const deck = new Deck();
    expect(deck.getCardByName('HQ')?.name).toBe('HQ');
    expect(deck.getCardByName('QH')?.name).toBe('HQ');
    expect(deck.getCardBySuitAndFace(Suit.Spades, 14)?.name).toBe('SA');
  });
});

describe('Phase 2 Play Holdings C++ parity', () => {
  it('evaluates SuitHoldings quick tricks, stoppers, sequences, and solid/rebiddable flags', () => {
    const suit = new SuitHoldings();
    suit.setSuit(Suit.Spades);
    for (const face of [14, 13, 12, 9, 4]) {
      suit.add(new Card(Suit.Spades, face));
    }
    suit.countPoints(true);
    suit.evaluateHoldings();
    expect(suit.quickTricks).toBe(2);
    expect(suit.isSuitStopped).toBe(true);
    expect(suit.numStoppers).toBe(2);
    expect(suit.isSolid).toBe(true);
    expect(suit.isRebiddable).toBe(true);
    expect(suit.numTopHonors).toBe(3);
    expect(suit.numSequences).toBe(3);
    expect(suit.topSequence?.holdingsString).toBe('SA SK SQ');
  });

  it('evaluates CombinedHoldings and emits verbatim C++ status log lines', () => {
    const declarer = new Hand();
    for (const face of [14, 13, 7, 4]) declarer.add(new Card(Suit.Spades, face));
    for (const face of [14, 5]) declarer.add(new Card(Suit.Hearts, face));
    declarer.initializeInitialHand();

    const dummy = new Hand();
    for (const face of [12, 6, 3]) dummy.add(new Card(Suit.Spades, face));
    for (const face of [13, 9]) dummy.add(new Card(Suit.Hearts, face));
    dummy.initializeInitialHand();

    const status = new PlayerStatus();
    const combined = new CombinedHoldings();
    combined.initialize(declarer, dummy, status);
    combined.evaluateHoldings(4);

    expect(combined.getSuit(Suit.Spades).numTopCards).toBe(3);
    expect(combined.getSuit(Suit.Spades).holdingsDescription).toBe('AKQ7643 (Q63/AK74)');
    expect(status.text).toContain('Combined hand (Dummy/Hand):');
    expect(status.text).toContain('Combined hand evaluation:');
    expect(status.text).toContain('Sure Winners');
  });

  it('evaluates HandHoldings and revalues hand as dummy with REVAL38 log message', () => {
    const status = new PlayerStatus();
    const hand = new Hand();
    hand.initialize(Position.South, status);
    // 4-card Spade support with Ace + singleton Club -> dummy revaluation bonus
    for (const face of [14, 9, 6, 3]) hand.add(new Card(Suit.Spades, face));
    for (const face of [13, 8, 5, 2]) hand.add(new Card(Suit.Hearts, face));
    for (const face of [12, 10, 7, 4]) hand.add(new Card(Suit.Diamonds, face));
    hand.add(new Card(Suit.Clubs, 2));
    hand.initNewHand();
    hand.evaluateHoldings();

    expect(status.text).toContain('Received hand:');
    expect(status.text).toContain('Hand evaluation:');
    expect(status.text).toContain('Playing five-card majors, neither major suit qualifies for opening.');

    const revalued = hand.revalueHand(0, Suit.Spades, true, true);
    expect(revalued).toBeGreaterThan(hand.totalPoints);
    expect(status.text).toContain('REVAL38:');
  });
});

describe('Guessed holdings and play plan', () => {
  it('tracks guessed cards and suit holdings', () => {
    const holdings = new GuessedCardHoldings();
    holdings.add(new GuessedCard(new Card(Suit.Spades, 14), {
      location: Position.West,
      fixProbability: 1,
    }));
    expect(holdings.length).toBe(1);
    expect(holdings.numDefiniteCards).toBe(1);
    expect(holdings.hasCard(51)).toBe(true);
  });

  it('supports shown-out and void suit state', () => {
    const suit = new GuessedSuitHoldings();
    suit.setSuit(Suit.Hearts);
    suit.markSuitShownOut(true);
    expect(suit.isSuitShownOut).toBe(true);
    expect(suit.areAllCardsIdentified).toBe(true);
  });

  it('groups guessed cards by the four suits', () => {
    const hand = new GuessedHandHoldings();
    hand.add(new GuessedCard(new Card(Suit.Hearts, 12), {
      location: Position.North,
      fixProbability: 1,
    }));
    expect(hand.getSuit(Suit.Hearts).length).toBe(1);
    hand.markSuitShownOut(Suit.Clubs);
    expect(hand.isSuitShownOut(Suit.Clubs)).toBe(true);
  });

  it('maintains play ordering', () => {
    const list = new PlayList();
    const first = new Play(PlayType.Cash);
    const second = new Play(PlayType.Finesse);
    list.append(first);
    list.append(second);
    expect(list.head).toBe(first);
    expect(list.defer(0)).toBe(true);
    expect(list.head).toBe(second);
  });
});

describe('Suit and combined holdings', () => {
  it('formats suit holdings and recognizes void and singleton suits', () => {
    const suit = new SuitHoldings();
    suit.setSuit(Suit.Spades);
    expect(suit.isVoid).toBe(true);
    suit.add(new Card(Suit.Spades, 14));
    expect(suit.isSingleton).toBe(true);
    expect(suit.compressedHoldings).toBe('A');
  });

  it('tracks declarer and dummy cards separately', () => {
    const combinedSuit = new CombinedSuitHoldings();
    combinedSuit.setSuit(Suit.Hearts);
    combinedSuit.addFromSource(new Card(Suit.Hearts, 14), true);
    combinedSuit.addFromSource(new Card(Suit.Hearts, 13), false);
    expect(combinedSuit.declarerLength).toBe(1);
    expect(combinedSuit.dummyLength).toBe(1);
    expect(combinedSuit.holdingsDescription).toBe('AK (K/A)');
  });

  it('combines two hands and reports longest suit', () => {
    const declarer = new Hand();
    declarer.add(new Card(Suit.Hearts, 14));
    declarer.add(new Card(Suit.Hearts, 13));
    declarer.initializeInitialHand();

    const dummy = new Hand();
    dummy.add(new Card(Suit.Clubs, 12));
    dummy.initializeInitialHand();

    const combined = new CombinedHoldings();
    combined.initialize(declarer, dummy);
    expect(combined.getNumCardsInSuit(Suit.Hearts)).toBe(2);
    expect(combined.containsCards([new Card(Suit.Hearts, 14)])).toBe(true);
  });

  it('supports display holdings', () => {
    const display = new DisplayHoldings();
    display.setDummy(true);
    display.add(new Card(Suit.Diamonds, 12));
    expect(display.length).toBe(1);
  });
});

describe('Play engines', () => {
  it('declarer engine combines declarer and dummy holdings', () => {
    const declarer = new Hand();
    declarer.add(new Card(Suit.Hearts, 14));
    const dummy = new Hand();
    dummy.add(new Card(Suit.Hearts, 13));
    const engine = new DeclarerPlayEngine();
    engine.hand = declarer;
    engine.initializeCombinedHand(dummy);
    expect(engine.combinedHand?.getNumCardsInSuit(Suit.Hearts)).toBe(2);
  });

  it('dummy engine follows led suit when possible', () => {
    const hand = new Hand();
    hand.add(new Card(Suit.Hearts, 12));
    hand.add(new Card(Suit.Clubs, 14));
    const engine = new DummyPlayEngine();
    engine.hand = hand;
    const card = engine.playCard(Suit.Hearts);
    expect(card?.name).toBe('HQ');
  });

  it('defender engine follows led suit when possible', () => {
    const hand = new Hand();
    hand.add(new Card(Suit.Diamonds, 11));
    hand.add(new Card(Suit.Clubs, 12));
    const engine = new DefenderPlayEngine();
    engine.hand = hand;
    const card = engine.chooseCard(Suit.Diamonds);
    expect(card?.name).toBe('DJ');
  });

  it('builds declarer play plan from combined holdings', () => {
    const declarer = new Hand();
    declarer.add(new Card(Suit.Spades, 14));
    declarer.add(new Card(Suit.Spades, 13));
    const dummy = new Hand();
    dummy.add(new Card(Suit.Spades, 12));
    dummy.add(new Card(Suit.Spades, 11));
    const engine = new DeclarerPlayEngine();
    engine.hand = declarer;
    engine.initializeCombinedHand(dummy);
    engine.buildPlayPlan(Suit.Spades);
    expect(engine.playPlan.size).toBeGreaterThan(0);
  });

  it('records defender suit preference and lead selection', () => {
    const engine = new DefenderPlayEngine();
    engine.recordSuitPreference(Suit.Hearts, 3);
    engine.recordSuitPreference(Suit.Spades, 1);
    expect(engine.getPreferredSuit()).toBe(Suit.Hearts);
  });
});

describe('Specialized play types', () => {
  it('constructs the core play operations', () => {
    expect(new Cash(Suit.Spades).type).toBe(1);
    expect(new Discard().name).toBe('Discard');
    expect(new Drop(Suit.Hearts).isValid).toBe(true);
    expect(new ExitPlay().isValid).toBe(true);
    expect(new Force(Suit.Clubs).isValid).toBe(true);
  });

  it('constructs ruff, trump pull, hold-up, and finesse operations', () => {
    expect(new HoldUp(Suit.Diamonds).isValid).toBe(true);
    expect(new Ruff(Suit.Hearts).isValid).toBe(true);
    expect(new TrumpPull(Suit.Hearts).isValid).toBe(true);
    expect(new Finesse(Suit.Spades).isValid).toBe(true);
  });

  it('constructs all finesse variants', () => {
    expect(new Type1Finesse(Suit.Hearts).isValid).toBe(true);
    expect(new Type2Finesse(Suit.Hearts).isValid).toBe(true);
    expect(new Type3Finesse(Suit.Hearts).isValid).toBe(true);
    expect(new TypeAFinesse(Suit.Hearts).isValid).toBe(true);
    expect(new TypeBFinesse(Suit.Hearts).isValid).toBe(true);
  });

  it('transitions specialized plays to complete or in-progress states', () => {
    expect(new Cash(Suit.Spades).perform()).toBe(2);
    expect(new HoldUp(Suit.Diamonds).perform()).toBe(1);
    expect(new Ruff(Suit.Hearts).perform()).toBe(2);
    expect(new TrumpPull(Suit.Hearts).perform()).toBe(2);
    expect(new Finesse(Suit.Spades).perform()).toBe(1);
  });

  it('rejects nonviable plays with missing consumed, key, or target cards', () => {
    const play = new Cash(Suit.Spades);
    play.setConsumedCard(new Card(Suit.Spades, 14));
    play.setTargetCard(new Card(Suit.Spades, 13));
    play.setKeyCards([new Card(Suit.Spades, 12)]);
    expect(play.isViable({
      partnershipCards: [new Card(Suit.Hearts, 14)],
      outstandingCards: [new Card(Suit.Diamonds, 13)],
      alreadyPlayedCards: [],
    })).toBe(false);
  });

  it('executes Cash, HoldUp, and Type1Finesse with verbatim C++ status logs', () => {
    const declarer = new Hand();
    declarer.add(new Card(Suit.Spades, 14));
    declarer.add(new Card(Suit.Spades, 4));
    declarer.initializeInitialHand();

    const dummy = new Hand();
    dummy.add(new Card(Suit.Spades, 12));
    dummy.add(new Card(Suit.Spades, 3));
    dummy.initializeInitialHand();

    const combined = new CombinedHoldings();
    combined.initialize(declarer, dummy);

    const status = new PlayerStatus();
    const cash = new Cash(new Card(Suit.Spades, 14), 4, 0);
    const deps = {
      combinedHand: combined,
      declarerHand: declarer,
      dummyHand: dummy,
      status,
      numCardsPlayedInRound: 0,
      isDummyTurn: false,
      selectedCard: null as Card | null,
    };
    expect(cash.perform(deps)).toBe(1); // PlayResult.InProgress
    expect(deps.selectedCard?.name).toBe('SA');
    expect(status.text).toContain('PLCSH10: Cash the SA from hand.');

    const finesseStatus = new PlayerStatus();
    const finesse = new Type1Finesse(new Card(Suit.Spades, 12), {
      playerPosition: Position.South,
      targetHand: 1, // IN_DUMMY
      gapCards: [new Card(Suit.Spades, 13)],
      coverCards: [new Card(Suit.Spades, 14)],
      leadCards: [new Card(Suit.Spades, 4)],
    });
    const finDeps = {
      combinedHand: combined,
      declarerHand: declarer,
      dummyHand: dummy,
      outstandingCards: [new Card(Suit.Spades, 13)],
      status: finesseStatus,
      numCardsPlayedInRound: 0,
      isDummyTurn: false,
      selectedCard: null as Card | null,
    };
    expect(finesse.perform(finDeps)).toBe(1);
    expect(finDeps.selectedCard?.name).toBe('S4');
    expect(finesseStatus.text).toContain('PL1FN12:');
  });
});

describe('Phase 4 Play Engines C++ parity', () => {
  it('tracks card plays, show-outs, and signaling in PlayEngine and DefenderPlayEngine', () => {
    const status = new PlayerStatus({ analysisTraceLevel: 5, showCommentIdentifiers: true });
    const westHand = new Hand();
    for (const face of [13, 12, 11, 5, 2]) westHand.add(new Card(Suit.Spades, face));
    for (const face of [14, 7, 3]) westHand.add(new Card(Suit.Hearts, face));
    for (const face of [10, 8, 4]) westHand.add(new Card(Suit.Diamonds, face));
    for (const face of [9, 6]) westHand.add(new Card(Suit.Clubs, face));
    westHand.countPoints(true);
    westHand.evaluateHoldings();

    const eastHand = new Hand();
    const northHand = new Hand();
    const southHand = new Hand();

    const guessedHands = [
      new GuessedHandHoldings(),
      new GuessedHandHoldings(),
      new GuessedHandHoldings(),
      new GuessedHandHoldings(),
    ];
    guessedHands[Position.West].initNewHand(westHand, Position.West);

    const defender = new DefenderPlayEngine();
    defender.initialize({
      player: { position: Position.West, hand: westHand, status },
      partner: { position: Position.East, hand: eastHand, status: new PlayerStatus() },
      leftOpponent: { position: Position.North, hand: northHand, status: new PlayerStatus(), isDummy: true },
      rightOpponent: { position: Position.South, hand: southHand, status: new PlayerStatus(), isDeclarer: true },
      hand: westHand,
      cardLocation: new CardLocation(),
      guessedHands,
      status,
      contract: 15, // 3NT
      trumpSuit: Suit.NoTrump,
    });
    defender.initNewHand(15, 0, Suit.NoTrump);

    // Opening lead against 3NT from KQJ52 -> top of 3-card honor sequence SK
    const lead = defender.getLeadCard({ playRound: 0, contract: 15, contractLevel: 3, trumpSuit: Suit.NoTrump });
    expect(lead?.name).toBe('SK');
    expect(status.text).toContain('PLYLD22:');

    // Partner discards high (S8) on our SK lead -> PLYSIG0: suit preference signal
    const s8 = new Card(Suit.Spades, 8);
    s8.setOwner(Position.East);
    defender.recordCardPlay(Position.East, s8, {
      playRound: 0,
      numCardsPlayedInRound: 3,
      roundLead: Position.West,
      leadCard: lead!,
      currentHighCard: lead!,
      trumpSuit: Suit.NoTrump,
    });
    expect(defender.partnerSuitPreference[Suit.Spades]).toBe(1);
    expect(status.text).toContain('PLYSIG0:');
  });

  it('delegates DummyPlayEngine to declarer partner and runs DeclarerPlayEngine planPlay()', () => {
    const declarerHand = new Hand();
    for (const face of [14, 13, 12, 4]) declarerHand.add(new Card(Suit.Spades, face));
    for (const face of [14, 13, 5]) declarerHand.add(new Card(Suit.Hearts, face));
    for (const face of [14, 7, 2]) declarerHand.add(new Card(Suit.Diamonds, face));
    for (const face of [14, 6, 3]) declarerHand.add(new Card(Suit.Clubs, face));
    declarerHand.initializeInitialHand();
    declarerHand.evaluateHoldings();

    const dummyHand = new Hand();
    for (const face of [11, 8, 3]) dummyHand.add(new Card(Suit.Spades, face));
    for (const face of [12, 9, 2]) dummyHand.add(new Card(Suit.Hearts, face));
    for (const face of [13, 6, 4]) dummyHand.add(new Card(Suit.Diamonds, face));
    for (const face of [13, 12, 5, 2]) dummyHand.add(new Card(Suit.Clubs, face));
    dummyHand.initializeInitialHand();
    dummyHand.evaluateHoldings();

    const declarerStatus = new PlayerStatus({ analysisTraceLevel: 4, showCommentIdentifiers: true });
    const dummyStatus = new PlayerStatus();
    const guessedHands = [
      new GuessedHandHoldings(),
      new GuessedHandHoldings(),
      new GuessedHandHoldings(),
      new GuessedHandHoldings(),
    ];
    guessedHands[Position.South].initNewHand(declarerHand, Position.South);
    guessedHands[Position.North].initNewHand(dummyHand, Position.North);

    const declarer = new DeclarerPlayEngine();
    const declarerRole = {
      position: Position.South,
      hand: declarerHand,
      status: declarerStatus,
      isDeclarer: true,
      playForDummy: () => declarer.playForDummy({ playRound: 0, numCardsPlayedInRound: 0, contract: 15, trumpSuit: Suit.NoTrump }),
      getNumClaimableTricks: () => declarer.getNumClaimableTricks({ trumpSuit: Suit.NoTrump }),
    };
    const dummyRole = {
      position: Position.North,
      hand: dummyHand,
      status: dummyStatus,
      isDummy: true,
    };

    declarer.initialize({
      player: declarerRole,
      partner: dummyRole,
      leftOpponent: { position: Position.West, hand: new Hand(), status: new PlayerStatus() },
      rightOpponent: { position: Position.East, hand: new Hand(), status: new PlayerStatus() },
      hand: declarerHand,
      cardLocation: new CardLocation(),
      guessedHands,
      status: declarerStatus,
      contract: 15, // 3NT
      trumpSuit: Suit.NoTrump,
    });
    declarer.initNewHand(15, 0, Suit.NoTrump);

    const dummy = new DummyPlayEngine();
    dummy.initialize({
      player: dummyRole,
      partner: declarerRole,
      leftOpponent: { position: Position.East, hand: new Hand(), status: new PlayerStatus() },
      rightOpponent: { position: Position.West, hand: new Hand(), status: new PlayerStatus() },
      hand: dummyHand,
      cardLocation: new CardLocation(),
      guessedHands,
      status: dummyStatus,
      contract: 15,
      trumpSuit: Suit.NoTrump,
    });

    const playedFromDummy = dummy.playCard();
    expect(playedFromDummy).not.toBeNull();
    expect(declarer.playPlan.size).toBeGreaterThan(0);
    expect(declarerStatus.text).toContain('PLN00:');
    expect(declarerStatus.text).toContain('PLN10:');
    expect(declarerStatus.text).toContain('PLNNT90');
    expect(dummy.getNumClaimableTricks()).toBeGreaterThanOrEqual(9);
  });
});
