import { describe, expect, it } from 'vitest';
import {
  Bid,
  BidEngine,
  ConventionSet,
  ConventionStatus,
  Hand,
  Card,
  Position,
  Suit,
  StaymanConvention,
  WeakTwoBidsConvention,
  StrongTwoBidsConvention,
  Artificial2ClubConvention,
  ConventionPool,
  CardLocation,
  PlayerStatus,
  RaiseTarget,
  BlackwoodConvention,
  GerberConvention,
  Jacoby2NTConvention,
  SplinterBidsConvention,
  SlamConvention,
} from '../src/index.js';

describe('Convention core', () => {
  it('initializes conventions in C++ registry order', () => {
    const pool = new ConventionPool();
    const set = new ConventionSet({
      cueBids: true,
      blackwood: true,
      stayman: true,
      weakTwoBids: true,
    });

    set.initialize(pool);
    expect(set.conventionsList[0]).toBe(pool.cueBids);
    expect(set.conventionsList.some(convention => convention instanceof WeakTwoBidsConvention)).toBe(true);
  });

  it('runs Stayman when 1NT is opened and a four-card major is held', () => {
    const convention = new StaymanConvention();
    convention.enable();
    const hand = new Hand();
    hand.add(new Card(Suit.Hearts, 14));
    hand.add(new Card(Suit.Hearts, 13));
    hand.add(new Card(Suit.Hearts, 12));
    hand.add(new Card(Suit.Hearts, 11));
    hand.add(new Card(Suit.Spades, 14));
    for (let i = 2; i <= 8; i++) hand.add(new Card(i % 2 === 0 ? Suit.Clubs : Suit.Diamonds, i));

    const bidContext = {
      position: Position.North,
      partnerPosition: Position.South,
      partnerBid: Bid.NT1,
      partnerOpenedForTeam: true,
      partnerBidCount: 1,
      rightHandOpponentPassed: true,
      agreedSuit: -1 as -1,
      bid: Bid.Pass,
      status: ConventionStatus.Inactive,
      parameters: 0,
      activeConvention: null,
    };
    const bid = convention.tryConvention({
      hand,
      cardLocation: new CardLocation(),
      status: new PlayerStatus(),
      bidContext,
    });
    expect(bid).toBe(Bid.C2);
  });
});

describe('BidEngine auction stages', () => {
  it('uses opening, opener-rebid, responder-rebid, and extended-rebid stages', () => {
    const engine = new BidEngine();
    const opener = new Hand();
    opener.add(new Card(Suit.Spades, 14));
    opener.add(new Card(Suit.Spades, 13));
    opener.add(new Card(Suit.Spades, 12));
    opener.add(new Card(Suit.Spades, 11));
    opener.add(new Card(Suit.Spades, 10));
    opener.add(new Card(Suit.Hearts, 14));
    opener.add(new Card(Suit.Hearts, 13));
    opener.add(new Card(Suit.Clubs, 2));
    opener.add(new Card(Suit.Clubs, 3));
    opener.add(new Card(Suit.Clubs, 4));
    opener.add(new Card(Suit.Diamonds, 2));
    opener.add(new Card(Suit.Diamonds, 3));
    opener.add(new Card(Suit.Diamonds, 4));

    expect(engine.makeOpeningBid(opener, Position.South)).not.toBe(Bid.Pass);
    expect(engine.makeRebidAsOpener(opener, Bid.S1, Bid.Pass)).toBe(Bid.Pass);
    expect(engine.makeRebidAsResponder(opener, Bid.S2, Bid.S1)).not.toBeUndefined();
    expect(engine.makeRebidExtended(opener, Bid.Pass)).toBe(Bid.Pass);
    expect(engine.statusLog.length).toBeGreaterThan(3);
  });

  it('rebids a strong opener to NT after a 1NT negative response', () => {
    const engine = new BidEngine();
    const hand = new Hand();
    for (const face of [14, 13, 12, 11]) hand.add(new Card(Suit.Spades, face));
    for (const face of [14, 13, 12]) hand.add(new Card(Suit.Hearts, face));
    for (const face of [14, 13]) hand.add(new Card(Suit.Diamonds, face));
    for (const face of [14, 13]) hand.add(new Card(Suit.Clubs, face));

    expect(engine.makeRebidAsOpener(hand, Bid.S1, Bid.NT1)).toBe(Bid.NT3);
  });
});

describe('General partner raise logic', () => {
  it('handles single raises through game or pass', () => {
    const engine = new BidEngine();
    const hand = new Hand();
    for (const face of [14, 13, 12, 11, 10]) hand.add(new Card(Suit.Hearts, face));
    for (let i = 2; i <= 8; i++) hand.add(new Card(i % 2 === 0 ? Suit.Spades : Suit.Clubs, i));

    const result = engine.respondToSingleRaise(hand, Suit.Hearts);
    expect(result.bid).not.toBeNull();
    expect(result.statusCode).toBe('RDR');
  });

  it('handles double raises at major-game level', () => {
    const engine = new BidEngine();
    const hand = new Hand();
    for (const face of [14, 13, 12, 11]) hand.add(new Card(Suit.Spades, face));
    for (const face of [14, 13, 12]) hand.add(new Card(Suit.Hearts, face));
    for (let i = 2; i <= 6; i++) hand.add(new Card(i % 2 === 0 ? Suit.Diamonds : Suit.Clubs, i));

    const result = engine.respondToDoubleRaise(hand, Suit.Spades);
    expect(result.bid).not.toBeNull();
    expect(result.statusCode).toBe('S');
  });

  it('handles triple raises by signing off or exploring slam', () => {
    const engine = new BidEngine();
    const weak = new Hand();
    for (let i = 2; i <= 13; i++) weak.add(new Card(i % 2 === 0 ? Suit.Clubs : Suit.Diamonds, i));
    expect(engine.respondToTripleRaise(weak, Suit.Hearts).bid).toBe(Bid.Pass);

    const strong = new Hand();
    for (const face of [14, 13, 12, 11, 10]) strong.add(new Card(Suit.Spades, face));
    for (const face of [14, 13, 12]) strong.add(new Card(Suit.Hearts, face));
    for (const face of [14, 13]) strong.add(new Card(Suit.Clubs, face));
    for (const face of [14, 13]) strong.add(new Card(Suit.Diamonds, face));
    expect(engine.respondToTripleRaise(strong, Suit.Spades).bid).not.toBe(Bid.Pass);
  });

  it('raises partner suit to a requested relative or game target', () => {
    const engine = new BidEngine();
    const hand = new Hand();
    for (const face of [14, 13, 12, 11]) hand.add(new Card(Suit.Hearts, face));
    for (let i = 2; i <= 9; i++) hand.add(new Card(i % 2 === 0 ? Suit.Spades : Suit.Clubs, i));

    expect(engine.raisePartnersSuit(hand, Suit.Hearts, 2, RaiseTarget.RelativeByOne, 3, 0, 99)).toBe(Bid.H3);
    expect(engine.raisePartnersSuit(hand, Suit.Hearts, 2, RaiseTarget.ToGame, 3, 0, 99)).toBe(Bid.H4);
  });
});

describe('BidEngine helper methods', () => {
  it('returns cheapest and jump shift bids', () => {
    const engine = new BidEngine();
    expect(engine.getCheapestShiftBid(Suit.Hearts, Bid.C1)).toBe(Bid.H1);
    expect(engine.getCheapestShiftBid(Suit.Clubs, Bid.H1)).toBe(Bid.C2);
    expect(engine.getJumpShiftBid(Suit.Spades, Bid.C1, 1)).toBe(Bid.S2);
  });

  it('rebids suits and bids next best suit', () => {
    const engine = new BidEngine();
    const hand = new Hand();
    for (const face of [14, 13, 12, 11, 10]) hand.add(new Card(Suit.Hearts, face));
    hand.add(new Card(Suit.Spades, 14));
    hand.add(new Card(Suit.Spades, 13));
    hand.add(new Card(Suit.Spades, 12));
    hand.add(new Card(Suit.Spades, 11));
    for (let i = 2; i <= 6; i++) hand.add(new Card(i % 2 === 0 ? Suit.Clubs : Suit.Diamonds, i));

    expect(engine.rebidSuit(hand, Suit.Hearts, 12, 99, 5, Bid.H1)).not.toBeNull();
    expect(engine.bidNextBestSuit(hand, 4, Suit.Hearts, Suit.NoTrump, Suit.NoTrump)).not.toBeNull();
  });

  it('bids NT only for balanced hands and valid ranges', () => {
    const engine = new BidEngine();
    const balanced = new Hand();
    for (const face of [14, 13]) balanced.add(new Card(Suit.Spades, face));
    for (const face of [14, 13]) balanced.add(new Card(Suit.Hearts, face));
    for (const face of [14, 13]) balanced.add(new Card(Suit.Diamonds, face));
    for (const face of [14, 13]) balanced.add(new Card(Suit.Clubs, face));
    balanced.countPoints(true);

    expect(engine.bidNoTrump(balanced, 2, 26, 30, true, 4, true)).toBe(Bid.NT2);
  });
});

describe('Slam conventions', () => {
  it('responds to Blackwood 4NT by ace count', () => {
    const blackwood = new BlackwoodConvention();
    blackwood.enable();
    const hand = new Hand();
    for (const suit of [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades]) {
      hand.add(new Card(suit, 14));
    }
    for (let face = 2; face <= 11; face++) hand.add(new Card(Suit.Spades, face));

    const bidContext = {
      position: Position.South,
      partnerPosition: Position.North,
      partnerBid: Bid.NT4,
      partnerOpenedForTeam: true,
      partnerBidCount: 1,
      rightHandOpponentPassed: true,
      agreedSuit: Suit.Spades,
      bid: Bid.Pass,
      status: ConventionStatus.Inactive,
      parameters: 0,
      activeConvention: null,
    };
    const response = blackwood.respondToConvention({
      hand,
      cardLocation: new CardLocation(),
      status: new PlayerStatus(),
      bidContext,
    });
    expect(response).toBe(Bid.C5);
  });

  it('responds to Gerber 4C by ace count', () => {
    const gerber = new GerberConvention();
    gerber.enable();
    const hand = new Hand();
    hand.add(new Card(Suit.Clubs, 14));
    hand.add(new Card(Suit.Diamonds, 14));
    for (let i = 2; i <= 11; i++) hand.add(new Card(i % 2 === 0 ? Suit.Hearts : Suit.Spades, i));

    const bidContext = {
      position: Position.North,
      partnerPosition: Position.South,
      partnerBid: Bid.C4,
      partnerOpenedForTeam: true,
      partnerBidCount: 2,
      rightHandOpponentPassed: true,
      agreedSuit: Suit.NoTrump,
      bid: Bid.Pass,
      status: ConventionStatus.Inactive,
      parameters: 0,
      activeConvention: null,
    };
    const response = gerber.respondToConvention({
      hand,
      cardLocation: new CardLocation(),
      status: new PlayerStatus(),
      bidContext,
    });
    expect(response).toBe(Bid.H5);
  });

  it('registers Jacoby 2NT and splinter state', () => {
    const jacoby = new Jacoby2NTConvention();
    const splinter = new SplinterBidsConvention();
    expect(jacoby.id).toBeGreaterThan(0);
    expect(splinter.id).toBeGreaterThan(0);
  });
});
