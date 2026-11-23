import { describe, expect, it } from 'vitest';
import {
  Bid,
  BidEngine,
  BiddingOption,
  BiddingPlayerInfo,
  BiddingRoundContext,
  ConventionId,
  ConventionSet,
  ConventionStatus,
  Hand,
  Card,
  Position,
  Suit,
  NONE,
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
  parsePbnHand,
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

function makeMockPlayer(
  position: Position,
  bids: Bid[] = [],
  lastBid: Bid = Bid.Pass,
): BiddingPlayerInfo {
  const nonPass = bids.filter(b => b > Bid.Pass && b < Bid.Double);
  return {
    position,
    getNumBidsMade: () => nonPass.length,
    getNumBidTurns: () => bids.length,
    inquireLastBid: () => (bids.length > 0 ? bids[bids.length - 1] : lastBid),
    getPriorBid: (index: number) => {
      const idx = bids.length - 1 - index;
      return idx >= 0 ? bids[idx] : Bid.Pass;
    },
    getPriorSuit: () => NONE,
    getMinimumOpeningValue: () => 12,
    getOpeningPosition: () => 0,
  };
}

function makeMockDealContext(overrides: Partial<BiddingRoundContext> = {}): BiddingRoundContext {
  const lastValidBid = overrides.lastValidBid ?? Bid.Pass;
  return {
    biddingRound: 0,
    lastValidBid,
    lastValidBidTeam: 1,
    numBidsMade: 0,
    dealer: Position.South,
    contractModifier: 0,
    isBidValid: (b: Bid) => b === Bid.Pass || b === Bid.Double || b === Bid.Redouble || b > lastValidBid,
    getBidByPlayer: () => Bid.Pass,
    getBidByIndex: () => Bid.Pass,
    ...overrides,
  };
}

function makeNaturalConventionSet(): ConventionSet {
  return new ConventionSet({
    fiveCardMajors: true,
    stayman: false,
    jacobyTransfers: false,
    weakTwoBids: false,
    strongTwoBids: false,
    artificial2Club: false,
    fourthSuitForcing: false,
    blackwood: false,
    gerber: false,
    cueBids: false,
    splinterBids: false,
    michaels: false,
    jacoby2NT: false,
    unusualNT: false,
    gambling3NT: false,
    drury: false,
    negativeDoubles: false,
    takeoutDoubles: false,
    overcalls: false,
    shutoutBids: false,
  });
}

describe('Phase 5: C++ BidEngine & ConventionSet fidelity', () => {
  it('supports C++ ConventionSet getValue/setValue and NT range lookup', () => {
    const set = new ConventionSet();
    expect(set.getNTRangeMin(1)).toBe(15);
    expect(set.getNTRangeMax(1)).toBe(17);
    expect(set.getValue(BiddingOption.OneNTRangeMinPts)).toBe(15);
    expect(set.getValue(BiddingOption.OneNTRangeMaxPts)).toBe(17);

    set.setValue(BiddingOption.OneNTRange, 0); // 12-14 weak NT
    expect(set.getNTRangeMin(1)).toBe(12);
    expect(set.getNTRangeMax(1)).toBe(14);
    expect(set.isConventionEnabled(ConventionId.FiveCardMajors)).toBe(true);
  });

  it('opens 1NT with balanced 16 HCP and logs C++ A08 message', () => {
    const hand = new Hand();
    for (const c of parsePbnHand('AQJ4.KJ8.Q94.K73')) hand.add(c);
    hand.countPoints(true);
    hand.evaluateHoldings();

    const status = new PlayerStatus();
    const engine = new BidEngine(makeNaturalConventionSet());
    engine.initialize(
      makeMockPlayer(Position.South),
      makeMockPlayer(Position.North),
      makeMockPlayer(Position.West),
      makeMockPlayer(Position.East),
      hand,
      new CardLocation(),
      null,
      status,
      makeMockDealContext(),
    );
    engine.clear();

    const bid = engine.bid();
    expect(bid).toBe(Bid.NT1);
    expect(status.text).toContain('A08:');
  });

  it('opens 1S with 5-card spade suit and logs C++ E01/E02 message', () => {
    const hand = new Hand();
    for (const c of parsePbnHand('AKQ84.K73.J84.62')) hand.add(c);
    hand.countPoints(true);
    hand.evaluateHoldings();

    const status = new PlayerStatus();
    const engine = new BidEngine(makeNaturalConventionSet());
    engine.initialize(
      makeMockPlayer(Position.South),
      makeMockPlayer(Position.North),
      makeMockPlayer(Position.West),
      makeMockPlayer(Position.East),
      hand,
      new CardLocation(),
      null,
      status,
      makeMockDealContext(),
    );
    engine.clear();

    const bid = engine.bid();
    expect(bid).toBe(Bid.S1);
    expect(status.text).toMatch(/E0[12]:/);
  });

  it('responds to partner 1S opening with 2S single raise and logs C++ response codes', () => {
    const hand = new Hand();
    for (const c of parsePbnHand('Q85.K64.9753.K84')) hand.add(c);
    hand.countPoints(true);
    hand.evaluateHoldings();

    const status = new PlayerStatus();
    const engine = new BidEngine(makeNaturalConventionSet());
    engine.initialize(
      makeMockPlayer(Position.North),
      makeMockPlayer(Position.South, [Bid.S1]),
      makeMockPlayer(Position.East, [Bid.Pass]),
      makeMockPlayer(Position.West, [Bid.Pass]),
      hand,
      new CardLocation(),
      null,
      status,
      makeMockDealContext({ lastValidBid: Bid.S1, numBidsMade: 2, lastValidBidTeam: 0 }),
    );
    engine.clear();

    const bid = engine.bid();
    expect(bid).toBe(Bid.S2);
    expect(status.text).toContain('F00:');
  });

  it('rebids as opener after single raise to 2S and logs RDR0', () => {
    const hand = new Hand();
    for (const c of parsePbnHand('AKQJ84.A73.K84.6')) hand.add(c);
    hand.countPoints(true);
    hand.evaluateHoldings();

    const status = new PlayerStatus();
    const engine = new BidEngine(makeNaturalConventionSet());
    engine.initialize(
      makeMockPlayer(Position.South, [Bid.S1]),
      makeMockPlayer(Position.North, [Bid.S2]),
      makeMockPlayer(Position.West, [Bid.Pass]),
      makeMockPlayer(Position.East, [Bid.Pass]),
      hand,
      new CardLocation(),
      null,
      status,
      makeMockDealContext({ biddingRound: 1, lastValidBid: Bid.S2, numBidsMade: 4, lastValidBidTeam: 0 }),
    );
    engine.clear();
    engine.m_nBid = Bid.S1;
    engine.m_numBidsMade = 1;

    const bid = engine.bid();
    expect(bid).toBe(Bid.S3);
    expect(status.text).toContain('RDR0:');
    expect(status.text).toContain('R18:');
  });

  it('doubles for penalties when holding enough likely tricks and logs TSTDBL4', () => {
    const hand = new Hand();
    for (const c of parsePbnHand('AKQJ9.AK4.A73.84')) hand.add(c);
    hand.countPoints(true);
    hand.evaluateHoldings();

    const status = new PlayerStatus();
    const engine = new BidEngine();
    engine.initialize(
      makeMockPlayer(Position.South),
      makeMockPlayer(Position.North),
      makeMockPlayer(Position.West),
      makeMockPlayer(Position.East, [Bid.S4]),
      hand,
      new CardLocation(),
      null,
      status,
      makeMockDealContext({ lastValidBid: Bid.S4, lastValidBidTeam: 1, contractModifier: 0 }),
    );
    engine.clear();
    engine.assessPosition();

    expect(engine.testForPenaltyDouble()).toBe(true);
    expect(status.text).toContain('TSTDBL4:');
  });
});

describe('Phase 6: C++ Bidding Conventions fidelity', () => {
  function initEngineForHand(
    pbn: string,
    convSet: ConventionSet,
    pos: Position,
    partnerPos: Position,
    partnerBids: Bid[] = [],
    lhoPos: Position = Position.East,
    lhoBids: Bid[] = [],
    rhoPos: Position = Position.West,
    rhoBids: Bid[] = [],
    dealOverrides: Partial<BiddingRoundContext> = {},
    ownBids: Bid[] = [],
  ): { engine: BidEngine; status: PlayerStatus; hand: Hand } {
    const hand = new Hand();
    for (const c of parsePbnHand(pbn)) hand.add(c);
    hand.countPoints(true);
    hand.evaluateHoldings();

    const status = new PlayerStatus();
    const engine = new BidEngine(convSet);
    engine.initialize(
      makeMockPlayer(pos, ownBids),
      makeMockPlayer(partnerPos, partnerBids),
      makeMockPlayer(lhoPos, lhoBids),
      makeMockPlayer(rhoPos, rhoBids),
      hand,
      new CardLocation(),
      null,
      status,
      makeMockDealContext(dealOverrides),
    );
    engine.clear();
    return { engine, status, hand };
  }

  it('invokes Stayman 2C over partner 1NT and logs STY0', () => {
    const convSet = new ConventionSet({ stayman: true, jacobyTransfers: true });
    const { engine, status } = initEngineForHand(
      'KJ84.AQ73.942.75',
      convSet,
      Position.North,
      Position.South,
      [Bid.NT1],
      Position.East,
      [Bid.Pass],
      Position.West,
      [Bid.Pass],
      { lastValidBid: Bid.NT1, numBidsMade: 2, lastValidBidTeam: 0 },
    );
    engine.m_bPartnerOpenedForTeam = true;

    const bid = engine.bid();
    expect(bid).toBe(Bid.C2);
    expect(status.text).toContain('STY0:');
  });

  it('responds 2H to partner Stayman 2C with 4-card hearts and logs STYR10', () => {
    const convSet = new ConventionSet({ stayman: true });
    const { engine, status } = initEngineForHand(
      'KQ4.AJ85.KQ7.964',
      convSet,
      Position.South,
      Position.North,
      [Bid.C2],
      Position.West,
      [Bid.Pass],
      Position.East,
      [Bid.Pass],
      { biddingRound: 1, lastValidBid: Bid.C2, numBidsMade: 4, lastValidBidTeam: 0 },
      [Bid.NT1],
    );
    engine.m_nBid = Bid.NT1;
    engine.m_numBidsMade = 1;
    engine.m_numBidTurns = 1;
    engine.m_bOpenedBiddingForTeam = true;

    const bid = engine.bid();
    expect(bid).toBe(Bid.H2);
    expect(status.text).toContain('STYR11:');
  });

  it('invokes Jacoby Transfer 2D over partner 1NT with 5 hearts and logs JAC0', () => {
    const convSet = new ConventionSet({ stayman: true, jacobyTransfers: true });
    const { engine, status } = initEngineForHand(
      '842.AKJ95.742.96',
      convSet,
      Position.North,
      Position.South,
      [Bid.NT1],
      Position.East,
      [Bid.Pass],
      Position.West,
      [Bid.Pass],
      { lastValidBid: Bid.NT1, numBidsMade: 2, lastValidBidTeam: 0 },
    );
    engine.m_bPartnerOpenedForTeam = true;

    const bid = engine.bid();
    expect(bid).toBe(Bid.D2);
    expect(status.text).toContain('JAC0:');
  });

  it('opens Weak Two 2S with 6-card spade suit and 6-10 HCP and logs WEAK2', () => {
    const convSet = new ConventionSet({ weakTwoBids: true, shutoutBids: true });
    const { engine, status } = initEngineForHand(
      'KQJ974.842.96.73',
      convSet,
      Position.South,
      Position.North,
    );

    const bid = engine.bid();
    expect(bid).toBe(Bid.S2);
    expect(status.text).toContain('WEAK2:');
  });

  it('opens Artificial 2C with 23+ HCP and logs STR2C', () => {
    const convSet = new ConventionSet({ artificial2Club: true });
    const { engine, status } = initEngineForHand(
      'AKQ84.AKQ5.AK7.6',
      convSet,
      Position.South,
      Position.North,
    );

    const bid = engine.bid();
    expect(bid).toBe(Bid.C2);
    expect(status.text).toContain('STR2C:');
  });

  it('makes a simple 1S overcall over RHO 1C opening and logs OVERCL8', () => {
    const convSet = new ConventionSet({ takeoutDoubles: false });
    const { engine, status } = initEngineForHand(
      'AKQJ8.742.Q85.64',
      convSet,
      Position.South,
      Position.North,
      [],
      Position.West,
      [],
      Position.East,
      [Bid.C1],
      { lastValidBid: Bid.C1, numBidsMade: 1, lastValidBidTeam: 1 },
    );

    const bid = engine.bid();
    expect(bid).toBe(Bid.S1);
    expect(status.text).toContain('OVERCL8:');
  });

  it('makes a takeout double over RHO 1H opening with support for all unbid suits and logs TKOUT', () => {
    const convSet = new ConventionSet({ takeoutDoubles: true });
    const { engine, status } = initEngineForHand(
      'KQ84.6.AJ73.K952',
      convSet,
      Position.South,
      Position.North,
      [],
      Position.West,
      [],
      Position.East,
      [Bid.H1],
      { lastValidBid: Bid.H1, numBidsMade: 1, lastValidBidTeam: 1 },
    );

    const bid = engine.bid();
    expect(bid).toBe(Bid.Double);
    expect(status.text).toContain('TKOUT:');
  });

  it('invokes Blackwood 4NT via BidEngine and responds 5H with 2 aces', () => {
    const convSet = new ConventionSet({ blackwood: true });
    const { engine: invoker, status: invokerStatus } = initEngineForHand(
      'AKQ84.AK5.KQ7.A4',
      convSet,
      Position.South,
      Position.North,
      [Bid.S3],
      Position.West,
      [Bid.Pass],
      Position.East,
      [Bid.Pass],
      { biddingRound: 1, lastValidBid: Bid.S3, numBidsMade: 4, lastValidBidTeam: 0 },
      [Bid.S1],
    );
    invoker.assessPosition();
    expect(invoker.invokeBlackwood(Suit.Spades)).toBe(true);
    expect(invoker.m_nBid).toBe(Bid.NT4);
    expect(invokerStatus.text).toContain('BLKWD:');

    const { engine: responder, status: responderStatus } = initEngineForHand(
      'J953.A64.A832.75',
      convSet,
      Position.North,
      Position.South,
      [Bid.NT4],
      Position.East,
      [Bid.Pass],
      Position.West,
      [Bid.Pass],
      { biddingRound: 2, lastValidBid: Bid.NT4, numBidsMade: 6, lastValidBidTeam: 0 },
      [Bid.S3],
    );
    responder.m_nAgreedSuit = Suit.Spades;
    responder.m_numBidsMade = 1;
    responder.m_numBidTurns = 1;
    const response = responder.bid();
    expect(response).toBe(Bid.H5);
    expect(responderStatus.text).toContain('BK10:');
  });
});
