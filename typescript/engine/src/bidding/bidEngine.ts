import { Bid, bidLevel, bidSuit, makeBid, NONE, partnerPosition, Position, Suit } from '../constants.js';
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

export enum RaiseTarget {
  RelativeByOne = 1,
  RelativeByTwo = 2,
  RelativeByThree = 3,
  ToThree = -3,
  ToFour = -4,
  ToFive = -5,
  ToGame = -10,
  ToSlam = -11,
  ToNoMoreThanGame = -9,
}

export interface PartnerRaiseResult {
  bid: Bid | null;
  statusCode: 'RDR' | 'S' | 'Q' | 'raise';
  message: string;
}

export class BidEngine {
  private pool: ConventionPool;
  private conventionSet: ConventionSet;
  readonly statusLog: string[] = [];

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
    this.statusLog.push(`OPEN: Assessing opening for ${position}.`);
    const conventionBid = this.applyConventionTests(hand, position, Bid.Pass, false, 0, true);
    if (conventionBid !== null) {
      this.statusLog.push(`OPEN-CONVENTION: ${conventionBid}.`);
      return conventionBid;
    }
    const hcp = hand.highCardPoints;
    if (hcp < 12) {
      this.statusLog.push(`OPEN-PASS: ${hcp} HCP is below the 12-HCP 1-level opening requirement.`);
      return Bid.Pass;
    }
    if (hcp >= 15 && hcp <= 17 && hand.isBalanced) {
      this.statusLog.push(`OPEN-NT: ${hcp} HCP and balanced; open 1NT.`);
      return Bid.NT1;
    }

    const longest = this.getLongestSuit(hand);
    if (hand.getSuitLength(longest) >= 5) {
      const bid = makeBid(longest, 1);
      this.statusLog.push(`OPEN-SUIT: 5+ ${Suit[longest]} cards; open ${bid}.`);
      return bid;
    }
    this.statusLog.push(`OPEN-CLUB: No clear major; open 1C.`);
    return makeBid(Suit.Clubs, 1);
  }

  makeResponse(hand: Hand, partnerBid: Bid): Bid {
    this.statusLog.push(`RESPONSE: Partner opened ${partnerBid}; assess responder hand.`);
    if (partnerBid === Bid.NT1) {
      if (hand.highCardPoints >= 10) {
        this.statusLog.push('NT-GAME: 10+ responder HCP; bid 3NT.');
        return Bid.NT3;
      }
      if (hand.highCardPoints >= 8) {
        this.statusLog.push('NT-INVITE: 8-9 responder HCP; invite 2NT.');
        return Bid.NT2;
      }
      if (hand.getSuitLength(Suit.Hearts) >= 4) {
        this.statusLog.push('STAYMAN: 4+ hearts; bid Stayman 2C.');
        return Bid.C2;
      }
      if (hand.getSuitLength(Suit.Spades) >= 4) {
        this.statusLog.push('STAYMAN: 4+ spades; bid Stayman 2C.');
        return Bid.C2;
      }
    }
    if (hand.highCardPoints >= 6) {
      const longest = this.getLongestSuit(hand);
      if (hand.getSuitLength(longest) >= 4) {
        const bid = makeBid(longest, 2);
        this.statusLog.push(`SUIT-RESPONSE: 6+ HCP and 4+ cards; respond ${bid}.`);
        return bid;
      }
    }
    this.statusLog.push('RESPONDER-PASS: Insufficient strength for a game or constructive suit response.');
    return Bid.Pass;
  }

  /**
   * Rebid after partner passes or responds to the opening bid.
   * Mirrors MakeRebidAsOpener in Bidrebid.cpp:
   * partner pass is a signoff, 1NT is a negative response, raises show support,
   * and new suits show shape before a final contract is chosen.
   */
  makeRebidAsOpener(
    hand: Hand,
    ownOpeningBid: Bid,
    partnerBid: Bid,
    agreedSuit: Suit = Suit.NoTrump,
  ): Bid {
    this.statusLog.push(`REBID-OPENER: Opening ${ownOpeningBid}, partner replied ${partnerBid}.`);
    if (partnerBid === Bid.Pass) {
      const hcp = hand.highCardPoints;
      if (hcp >= 22) {
        const suit = this.getLongestSuit(hand);
        const rebid = makeBid(suit, 3);
        this.statusLog.push(`REBID-STRONG: Partner passed but ${hcp} HCP justifies one last game try at ${rebid}.`);
        return rebid;
      }
      this.statusLog.push('REBID-PASS: Partner passed and opener has no enough strength to reopen.');
      return Bid.Pass;
    }

    if (partnerBid === Bid.NT1) {
      if (hand.isBalanced && hand.highCardPoints >= 18) {
        this.statusLog.push('REBID-NT: Balanced opener rebids 2NT/3NT after 1NT negative.');
        return hand.highCardPoints >= 20 ? Bid.NT3 : Bid.NT2;
      }
      const longest = this.getLongestSuit(hand);
      if (hand.getSuitLength(longest) >= 6) {
        const rebid = makeBid(longest, 2);
        this.statusLog.push(`REBID-SIX-CARD-SUIT: Rebids the 6-card ${Suit[longest]} suit at ${rebid}.`);
        return rebid;
      }
      return Bid.Pass;
    }

    if (partnerBid === Bid.NT2 || partnerBid === Bid.NT3) {
      const hcp = hand.highCardPoints;
      if (hcp >= 18) {
        this.statusLog.push('REBID-GAME: Partner showed 2NT/3NT interest; accept the game/rebid 3NT.');
        return Bid.NT3;
      }
    }

    const suit = agreedSuit === Suit.NoTrump ? this.getLongestSuit(hand) : agreedSuit;
    if (hand.highCardPoints >= 16) {
      const bid = makeBid(suit, 3);
      this.statusLog.push(`REBID-AGREED-SUIT: 16+ opener HCP; raise/contract ${Suit[suit]} at level 3.`);
      return bid;
    }
    this.statusLog.push('REBID-CHEAPEST: Sign off in the agreed suit/cheapest available contract.');
    return makeBid(suit, 2);
  }

  /**
   * Rebid as responder after opener makes a rebid.
   * Mirrors MakeRebidAsResponder in BiddingRebid2.cpp.
   */
  makeRebidAsResponder(
    hand: Hand,
    openerRebid: Bid,
    ownPreviousBid: Bid,
  ): Bid {
    this.statusLog.push(`REBID-RESPONDER: Opener rebid ${openerRebid}, after our ${ownPreviousBid}.`);
    if (openerRebid === Bid.Pass) return Bid.Pass;

    const hcp = hand.highCardPoints;
    const openerSuit = hcp >= 0 ? (openerRebid - 1) % 5 : -1;
    if (openerRebid === Bid.NT2) {
      if (hcp >= 10) return Bid.NT3;
      return Bid.Pass;
    }
    if (openerRebid === Bid.NT3) {
      if (hcp >= 8) return Bid.NT3;
      return Bid.Pass;
    }
    if (openerSuit >= Suit.Clubs && openerSuit <= Suit.Spades) {
      const suit = openerSuit as Suit;
      const support = hand.getSuitLength(suit);
      if (support >= 3 && hcp >= 10) {
        const game = makeBid(suit, 4);
        this.statusLog.push(`RESPONDER-GAME: ${support}-card support and ${hcp} HCP; bid ${game}.`);
        return game;
      }
      if (support >= 3) {
        const invitational = makeBid(suit, 3);
        this.statusLog.push(`RESPONDER-INVITE: ${support}-card support; bid ${invitational}.`);
        return invitational;
      }
    }
    this.statusLog.push('RESPONDER-PASS: No constructive raise or reshaping bid remains.');
    return Bid.Pass;
  }

  /**
   * Extended rebid used after the first two rounds.
   * Mirrors MakeRebidExtended in BiddingRebidExtended.cpp: conventions first,
   * partner pass is signoff, repeated suit agreement raises toward game, and
   * otherwise a fit or new-suit decision is made.
   */
  makeRebidExtended(hand: Hand, partnerBid: Bid, agreedSuit: Suit = Suit.NoTrump): Bid {
    this.statusLog.push(`REBID-EXTENDED: Round 3+, partner bid ${partnerBid}.`);
    if (partnerBid === Bid.Pass) {
      this.statusLog.push('EXTENDED-PASS: Partner passed in the later round.');
      return Bid.Pass;
    }
    if (partnerBid >= Bid.C6 && partnerBid <= Bid.NT7) {
      this.statusLog.push('EXTENDED-SLAM: Partner reached a slam-level bid; sign off unless convention logic applies.');
      return Bid.Pass;
    }
    if (agreedSuit !== Suit.NoTrump) {
      if (hand.highCardPoints >= 10) {
        const bid = makeBid(agreedSuit, 4);
        this.statusLog.push(`EXTENDED-GAME: Repeat agreed ${Suit[agreedSuit]} fit and bid game.`);
        return bid;
      }
      const bid = makeBid(agreedSuit, 3);
      this.statusLog.push(`EXTENDED-CONSERVATIVE: Bid agreed ${Suit[agreedSuit]} at level 3.`);
      return bid;
    }
    const longest = this.getLongestSuit(hand);
    if (hand.getSuitLength(longest) >= 5) {
      const bid = makeBid(longest, 3);
      this.statusLog.push(`EXTENDED-SUIT: No established fit; show a 5+ card ${Suit[longest]} suit.`);
      return bid;
    }
    this.statusLog.push('EXTENDED-PASS: No fit or new suit can be supported in the extended rebid round.');
    return Bid.Pass;
  }

  /**
   * Mirrors CBidEngine::RespondToSingleRaise in BiddingGeneral.cpp.
   * Partner's single raise is modeled as 6-10 HCP with 3-4 card support.
   */
  respondToSingleRaise(hand: Hand, agreedSuit: Suit): PartnerRaiseResult {
      if (agreedSuit === Suit.NoTrump) {
        return { bid: Bid.Pass, statusCode: 'RDR', message: 'RDR0: No trump suit agreement is available.' };
      }

      const support = hand.getSuitLength(agreedSuit);
      const minTotal = hand.highCardPoints + 6;
      const maxTotal = hand.highCardPoints + 10;
      const statusCode = 'RDR' as const;

      if (minTotal <= 22) {
        const message = `RDR2: Partnership minimum ${minTotal}-${maxTotal} points is below game; pass.`;
        this.statusLog.push(message);
        return { bid: Bid.Pass, statusCode, message };
      }

      if (minTotal >= 26) {
        if (agreedSuit === Suit.Hearts || agreedSuit === Suit.Spades) {
          const bid = makeBid(agreedSuit, 4);
          const message = `R22: ${minTotal}-${maxTotal} partnership points; bid game at ${bid}.`;
          this.statusLog.push(message);
          return { bid, statusCode, message };
        }
        const bid = makeBid(agreedSuit, 5);
        const message = `R30: ${minTotal}-${maxTotal} partnership points for a minor; bid game at ${bid}.`;
        this.statusLog.push(message);
        return { bid, statusCode, message };
      }

      if (minTotal >= 23 && support >= 3) {
        if (agreedSuit === Suit.Hearts || agreedSuit === Suit.Spades) {
          const bid = makeBid(agreedSuit, 3);
          const message = `R18: ${support}-card support and ${minTotal}-${maxTotal} partnership points; invite game.`;
          this.statusLog.push(message);
          return { bid, statusCode, message };
        }
        const bid = makeBid(agreedSuit, 3);
        const message = `R14: ${support}-card support and ${minTotal}-${maxTotal} partnership points; show an invitational minor raise.`;
        this.statusLog.push(message);
        return { bid, statusCode, message };
      }

      const message = `R08: Insufficient playing support in ${Suit[agreedSuit]}; pass.`;
      this.statusLog.push(message);
      return { bid: Bid.Pass, statusCode, message };
    }

    /**
     * Mirrors CBidEngine::RespondToDoubleRaise in BiddingGeneral.cpp.
     * Limit raises use 11-12 partner HCP; non-limit raises use 13-18.
     */
    respondToDoubleRaise(
      hand: Hand,
      agreedSuit: Suit,
      limitRaises = false,
    ): PartnerRaiseResult {
      if (agreedSuit === Suit.NoTrump) {
        return { bid: Bid.Pass, statusCode: 'S', message: 'S00: No trump suit agreement is available.' };
      }
      const partnerMin = limitRaises ? 11 : 13;
      const partnerMax = limitRaises ? 12 : 18;
      const minTotal = hand.highCardPoints + partnerMin;
      const maxTotal = hand.highCardPoints + partnerMax;
      const support = hand.getSuitLength(agreedSuit);

      if (agreedSuit === Suit.Hearts || agreedSuit === Suit.Spades) {
        if (minTotal >= 25 && support >= 3) {
          const bid = makeBid(agreedSuit, 4);
          const message = `S10: Limit/double raise with ${support} trumps and ${minTotal}-${maxTotal} partnership points; bid game at ${bid}.`;
          this.statusLog.push(message);
          return { bid, statusCode: 'S', message };
        }
        const message = `S11: ${minTotal}-${maxTotal} partnership points is insufficient to raise beyond partner's double raise; pass.`;
        this.statusLog.push(message);
        return { bid: Bid.Pass, statusCode: 'S', message };
      }

      if (minTotal >= 29 && support >= 4) {
        const bid = makeBid(agreedSuit, 5);
        const message = `S22: ${minTotal}-${maxTotal} partnership points and ${support} trumps; bid minor game at ${bid}.`;
        this.statusLog.push(message);
        return { bid, statusCode: 'S', message };
      }
      if (minTotal >= 26) {
        const bid = makeBid(agreedSuit, 3);
        const message = `S18: ${minTotal}-${maxTotal} partnership points; invite/steer toward minor game.`;
        this.statusLog.push(message);
        return { bid, statusCode: 'S', message };
      }
      const message = `S16: ${minTotal}-${maxTotal} partnership points is insufficient for minor game; pass.`;
      this.statusLog.push(message);
      return { bid: Bid.Pass, statusCode: 'S', message };
    }

    /**
     * Mirrors CBidEngine::RespondToTripleRaise in BiddingGeneral.cpp.
     * A triple raise shows approximately 6-9 partner HCP.
     */
    respondToTripleRaise(
      hand: Hand,
      agreedSuit: Suit,
    ): PartnerRaiseResult {
      if (agreedSuit === Suit.NoTrump) {
        return { bid: Bid.Pass, statusCode: 'Q', message: 'Q00: No trump suit agreement is available.' };
      }
      const minTotal = hand.highCardPoints + 6;
      const maxTotal = hand.highCardPoints + 9;

      if (minTotal < 33) {
        const message = `Q10: Triple raise with ${minTotal}-${maxTotal} partnership points signs off; pass.`;
        this.statusLog.push(message);
        return { bid: Bid.Pass, statusCode: 'Q', message };
      }
      if (minTotal <= 34) {
        const bid = makeBid(agreedSuit, 6);
        const message = `Q21: ${minTotal}-${maxTotal} partnership points; bid small slam at ${bid}.`;
        this.statusLog.push(message);
        return { bid, statusCode: 'Q', message };
      }
      const bid = makeBid(agreedSuit, 7);
      const message = `Q20: ${minTotal}-${maxTotal} partnership points; bid grand slam at ${bid}.`;
      this.statusLog.push(message);
      return { bid, statusCode: 'Q', message };
    }

    /**
     * Mirrors CBidEngine::RaisePartnersSuit in BiddingGeneral.cpp.
     * Supports relative raises and absolute ToGame/ToThree/ToFour/ToFive targets.
     */
    raisePartnersSuit(
      hand: Hand,
      partnerSuit: Suit,
      partnerBidLevel: number,
      target: RaiseTarget,
      supportLength: number,
      minimumPartnershipPoints = 0,
      maximumPartnershipPoints = 99,
    ): Bid | null {
      if (hand.getSuitLength(partnerSuit) < supportLength) return null;
      if (!Number.isFinite(minimumPartnershipPoints) || !Number.isFinite(maximumPartnershipPoints)) return null;
      const partnershipPoints = hand.highCardPoints;
      if (partnershipPoints < minimumPartnershipPoints || partnershipPoints > maximumPartnershipPoints) return null;

      let level: number;
      if (target >= 1) {
        level = partnerBidLevel + target;
      } else if (target === RaiseTarget.ToThree) {
        level = 3;
      } else if (target === RaiseTarget.ToFour) {
        level = 4;
      } else if (target === RaiseTarget.ToFive) {
        level = 5;
      } else if (target === RaiseTarget.ToGame) {
        level = partnerSuit === Suit.Clubs || partnerSuit === Suit.Diamonds ? 5 : 4;
      } else if (target === RaiseTarget.ToSlam) {
        level = partnerSuit === Suit.NoTrump ? 6 : 6;
      } else if (target === RaiseTarget.ToNoMoreThanGame) {
        level = partnerSuit === Suit.Clubs || partnerSuit === Suit.Diamonds ? 5 : 4;
      } else {
        return null;
      }

      if (level < 1 || level > 7) return null;
      const bid = makeBid(partnerSuit, level);
      this.statusLog.push(`raise: ${hand.getSuitLength(partnerSuit)}-card ${Suit[partnerSuit]} support, raise to ${bid}.`);
      return bid;
    }

  /**
   * Mirrors CBidEngine::GetCheapestShiftBid.
   * The old bid's level/suit determine the cheapest legal bid in target suit.
   */
  getCheapestShiftBid(targetSuit: Suit, oldBid: Bid = Bid.Pass): Bid {
    if (oldBid === Bid.Double || oldBid === Bid.Redouble) return Bid.Pass;
    if (oldBid === Bid.Pass) return makeBid(targetSuit, 1);
    if (!oldBid || oldBid < Bid.C1 || oldBid > Bid.NT7) return Bid.Pass;
    const oldLevel = bidLevel(oldBid);
    const oldSuit = bidSuit(oldBid);
    if (oldSuit === -1) return makeBid(targetSuit, oldLevel);
    if (targetSuit > oldSuit) return makeBid(targetSuit, oldLevel);
    if (oldLevel >= 7) return Bid.Pass;
    return makeBid(targetSuit, oldLevel + 1);
  }

  /**
   * Mirrors CBidEngine::GetJumpShiftBid.
   * Jump shifts are forcing and are clamped at the 7-level.
   */
  getJumpShiftBid(targetSuit: Suit, oldBid: Bid, jumpLevel = 1): Bid {
    if (oldBid < Bid.C1 || oldBid > Bid.NT7) return Bid.Pass;
    const oldLevel = bidLevel(oldBid);
    const oldSuit = bidSuit(oldBid);
    if (oldSuit === -1) return makeBid(targetSuit, Math.min(7, oldLevel + jumpLevel));
    const level = targetSuit > oldSuit
      ? oldLevel + jumpLevel
      : oldLevel + jumpLevel + 1;
    if (level > 7) return Bid.Pass;
    return makeBid(targetSuit, level);
  }

  /**
   * Mirrors CBidEngine::RebidSuit.
   * Applies point, length, and optional strength requirements, then computes
   * the cheapest/jump/absolute rebid.
   */
  rebidSuit(
    hand: Hand,
    suit: Suit,
    minimumHcp = 0,
    maximumHcp = 99,
    minimumLength = 0,
    oldBid: Bid = Bid.Pass,
    absoluteLevel: number | null = null,
  ): Bid | null {
    if (hand.getSuitLength(suit) < minimumLength) return null;
    const hcp = hand.highCardPoints;
    if (hcp < minimumHcp || hcp > maximumHcp) return null;
    if (absoluteLevel !== null) {
      if (absoluteLevel < 1 || absoluteLevel > 7) return null;
      return makeBid(suit, absoluteLevel);
    }
    const bid = this.getCheapestShiftBid(suit, oldBid);
    return bid === Bid.Pass ? null : bid;
  }

  /**
   * Mirrors CBidEngine::BidNextBestSuit.
   * Excludes previous, partner, and explicitly excluded suits.
   */
  bidNextBestSuit(
    hand: Hand,
    minimumLength = 4,
    excludedSuit1: Suit = Suit.NoTrump,
    excludedSuit2: Suit = Suit.NoTrump,
    excludedSuit3: Suit = Suit.NoTrump,
  ): Bid | null {
    const excluded = [excludedSuit1, excludedSuit2, excludedSuit3];
    const candidates = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs]
      .filter(suit => !excluded.includes(suit))
      .filter(suit => hand.getSuitLength(suit) >= minimumLength)
      .sort((a, b) =>
        hand.getSuitLength(b) - hand.getSuitLength(a) ||
        b - a,
      );
    if (candidates.length === 0) return null;
    return makeBid(candidates[0], 1);
  }

  /**
   * Mirrors CBidEngine::BidNoTrump.
   * Checks balance, stop count, void prohibition, partnership HCP range,
   * and whether the proposed bid remains above partner's previous bid.
   */
  bidNoTrump(
    hand: Hand,
    level: number,
    minimumHcp = 0,
    maximumHcp = 99,
    mustBeBalanced = true,
    stoppedSuitCount = 0,
    mustHaveNoVoids = true,
    partnerBid: Bid = Bid.Pass,
  ): Bid | null {
    if (level < 1 || level > 7) return null;
    if (mustBeBalanced && !hand.isBalanced) return null;
    if (stoppedSuitCount > 0) {
      let stopped = 0;
      for (let suit = Suit.Clubs; suit <= Suit.Spades; suit++) {
        if (hand.getSuitLength(suit as Suit) > 0 &&
          hand.getSuitLength(suit as Suit) >= 2) stopped++;
      }
      if (stopped < stoppedSuitCount) return null;
    }
    if (mustHaveNoVoids) {
      for (let suit = Suit.Clubs; suit <= Suit.Spades; suit++) {
        if (hand.getSuitLength(suit as Suit) === 0) return null;
      }
    }
    const hcp = hand.highCardPoints;
    if (hcp < minimumHcp || hcp > maximumHcp) return null;
    const bid = makeBid(Suit.NoTrump, level);
    if (partnerBid !== Bid.Pass && bid <= partnerBid) return null;
    this.statusLog.push(`BNT: ${hcp} HCP, balanced=${hand.isBalanced}, stopped=${stoppedSuitCount}; bid ${bid}.`);
    return bid;
  }

  /**
   * Mirrors CBidEngine::BidNoTrumpAsAppropriate.
   * Chooses the normal NT level from partnership HCP ranges.
   */
  bidNoTrumpAsAppropriate(hand: Hand, partnerBid: Bid = Bid.Pass): Bid | null {
    const hcp = hand.highCardPoints;
    return this.bidNoTrump(hand, hcp >= 26 ? 3 : 2, hcp >= 26 ? 26 : 23, hcp >= 26 ? 31 : 25, true, 4, true, partnerBid);
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
