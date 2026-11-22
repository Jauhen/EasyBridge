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

  it('formats card names like the C++ engine utilities', () => {
    const card = new Card(Suit.Hearts, 12);
    expect(card.fullName).toBe('Queen of Hearts');
    expect(card.reverseFullName).toBe('Heart Queen');
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
});
