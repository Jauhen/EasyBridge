import { Bid, makeBid, NONE, partnerPosition, Position, Suit } from '../constants.js';
import { Hand } from '../hand.js';
import { Convention, ConventionBidContext, ConventionContext } from './convention.js';
import { ConventionSet } from './conventionSet.js';
import { ConventionPool } from './conventionPool.js';
import { CardLocation } from '../cardLocation.js';
import { PlayerStatus } from '../playerStatus.js';
import { ConventionStatus } from './biddingCodes.js';

export interface AuctionState {
  dealer: Position;
  currentPosition: Position;
  history: Array<{ position: Position; bid: Bid }>;
  passes: number;
  lastValidBid: Bid;
  lastValidPosition: Position | typeof NONE;
}

export class BidEngine {
  private pool: ConventionPool;
  private conventionSet: ConventionSet;

  constructor(conventionSet = new ConventionSet()) {
    this.pool = new ConventionPool();
    this.conventionSet = conventionSet;
    this.conventionSet.initialize(this.pool);
  }

  get conventions(): ConventionSet {
    return this.conventionSet;
  }

  get conventionPool(): ConventionPool {
    return this.pool;
  }

  makeOpeningBid(hand: Hand, position: Position): Bid {
    const hcp = hand.highCardPoints;
    if (hcp < 12) return Bid.Pass;
    if (hcp >= 15 && hcp <= 17 && hand.isBalanced) return Bid.NT1;

    const longest = this.getLongestSuit(hand);
    if (hand.getSuitLength(longest) >= 5) {
      return makeBid(longest, 1);
    }
    return makeBid(Suit.Clubs, 1);
  }

  makeResponse(hand: Hand, partnerBid: Bid): Bid {
    if (partnerBid === Bid.NT1) {
      if (hand.highCardPoints >= 10) return Bid.NT3;
      if (hand.highCardPoints >= 8) return Bid.NT2;
      if (hand.getSuitLength(Suit.Hearts) >= 4) return Bid.C2;
      if (hand.getSuitLength(Suit.Spades) >= 4) return Bid.C2;
    }
    if (hand.highCardPoints >= 6) {
      const longest = this.getLongestSuit(hand);
      if (hand.getSuitLength(longest) >= 4) {
        return makeBid(longest, 2);
      }
    }
    return Bid.Pass;
  }

  applyConventionTests(
    hand: Hand,
    position: Position,
    partnerBid: Bid,
    partnerOpenedForTeam: boolean,
    partnerBidCount: number,
    rightHandOpponentPassed: boolean,
  ): Bid | null {
    const bidContext: ConventionBidContext = {
      position,
      partnerPosition: partnerPosition(position),
      partnerBid,
      partnerOpenedForTeam,
      partnerBidCount,
      rightHandOpponentPassed,
      agreedSuit: NONE,
      bid: Bid.Pass,
      status: ConventionStatus.Inactive,
      parameters: 0,
      activeConvention: null,
    };
    const context: ConventionContext = {
      hand,
      cardLocation: new CardLocation(),
      status: new PlayerStatus(),
      bidContext,
    };
    for (const convention of this.conventionSet.conventionsList) {
      const bid = convention.applyTest(context);
      if (bid !== null) {
        bidContext.activeConvention = convention;
        bidContext.bid = bid;
        return bid;
      }
    }
    return null;
  }

  getLongestSuit(hand: Hand): Suit {
    let longest = Suit.Clubs;
    for (let suit = Suit.Clubs + 1; suit <= Suit.Spades; suit++) {
      if (hand.getSuitLength(suit as Suit) > hand.getSuitLength(longest)) {
        longest = suit as Suit;
      }
    }
    return longest;
  }
}
