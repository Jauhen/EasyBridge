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
