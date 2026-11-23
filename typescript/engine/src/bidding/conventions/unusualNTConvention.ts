//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// UnusualNTConvention.cpp -> unusualNTConvention.ts
//

import { Card } from '../../card.js';
import {
  Bid,
  bidLevel,
  bidSuit,
  bidToFullString,
  isBid,
  isMajor,
  makeBid,
  NONE,
  Position,
  Suit,
} from '../../constants.js';
import { REVALUE_DECLARER, REVALUE_NOPENALTY_SHORTTRUMP } from '../../hand.js';
import { ConventionId, ConventionStatus } from '../biddingCodes.js';
import { PTS_SLAM } from '../bidParameters.js';
import { Convention, ConventionContext } from '../convention.js';

function getTeam(pos: Position): number {
  if (pos === Position.North || pos === Position.South) return 0;
  if (pos === Position.East || pos === Position.West) return 1;
  return -1;
}

export class UnusualNTConvention extends Convention {
  constructor() {
    super(ConventionId.UnusualNT);
  }

  //
  // TryConvention()
  //
  // check if we can use an Unusual NT Bid here
  //
  override tryConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { hand, status } = context;

    // the requirements for an Unusual NT Bid are:
    // 1: RHO must have opened a suit (not NT) at the 1-level
    // 2: this must be our first bidding opportunity
    // 3: need 5 cards in each of the two lowest unbid suits
    // 4: need either 6-11 pts or 17+ pts
    if (
      bidState.nRHOBid >= Bid.C1 &&
      bidState.nRHOBid <= Bid.S1 &&
      ((bidState.fPts >= bidState.openPts(6) && bidState.fPts <= bidState.openPts(11)) ||
        bidState.fPts >= bidState.openPts(17)) &&
      bidState.m_numBidTurns === 0 &&
      bidState.m_numPartnerBidTurns === 0
    ) {
      // passed the test
    } else {
      return null;
    }

    // test condition #3
    const nOppSuit = bidState.nRHOSuit;
    if (nOppSuit === Suit.Clubs) {
      // need 5/5 in diamonds and hearts
      if (hand.getNumCardsInSuit(Suit.Diamonds) < 5 || hand.getNumCardsInSuit(Suit.Hearts) < 5) {
        return null;
      }
      status.stream(
        '2UNT5! We have at least 5/5 in Diamonds and Hearts, so we can make an Unusual NT bid over the opponent\'s 1D opening.\n',
      );
    } else if (nOppSuit === Suit.Diamonds) {
      // need 5/5 in clubs and hearts
      if (hand.getNumCardsInSuit(Suit.Clubs) < 5 || hand.getNumCardsInSuit(Suit.Hearts) < 5) {
        return null;
      }
      status.stream(
        '2UNT6! We have at least 5/5 in Clubs and Hearts, so we can make an Unusual NT bid over the opponent\'s 1D opening.\n',
      );
    } else {
      // need 5/5 in clubs and diamonds
      if (hand.getNumCardsInSuit(Suit.Clubs) < 5 || hand.getNumCardsInSuit(Suit.Diamonds) < 5) {
        return null;
      }
      status.stream(
        '2UNT6! We have at least 5/5 in Clubs and Diamonds, so we can make an Unusual NT bid over the opponent\'s opening major.\n',
      );
    }

    // OK, go ahead and bid 2NT
    const nBid = Bid.NT2;
    status.stream(
      `UNT9! With a 2-suited hand, make an Unusual NT bid over RHO's ${Card.suitToString(nOppSuit as Suit)} bid at ${bidToFullString(nBid)}.\n`,
    );
    bidState.setBid(nBid);
    bidState.setConventionStatus(this, ConventionStatus.Invoked);
    return nBid;
  }

  //
  // RespondToConvention()
  //
  // respond to partner's Unusual NT Bid
  //
  override respondToConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { hand, status } = context;

    // first see if another convention is active
    if (bidState.getActiveConvention() && bidState.getActiveConvention() !== this) {
      return null;
    }

    const nPartnersBid = bidState.nPartnersBid;
    const nPartnersSuit = bidState.nPartnersSuit;
    const nLHOSuit = bidState.nLHOSuit;
    let nBid: Bid = Bid.Pass;

    // see what round this is
    const nStatus = bidState.getConventionStatus(this);
    if (nStatus === ConventionStatus.Inactive) {
      const nOpeningBid = bidState.getOpeningBid();
      const nOpeningBidder = bidState.getOpeningBidder();
      const bOppMajor = isMajor(bidSuit(nOpeningBid));
      if (
        isBid(nOpeningBid) &&
        getTeam(nOpeningBidder) !== getTeam(context.bidContext.position) &&
        nOpeningBid >= Bid.C1 &&
        nOpeningBid <= Bid.S1 &&
        nPartnersBid === Bid.NT2 &&
        bidState.m_numBidsMade === 0
      ) {
        status.stream(
          `UNTR10! Partner has made an Unusual NT bid of ${bidToFullString(nPartnersBid)}, indicating 5/5 length in ${
            bOppMajor
              ? 'Clubs and Diamonds'
              : bidSuit(nOpeningBid) === Suit.Clubs
                ? 'Hearts and Diamonds'
                : 'Hearts and Clubs'
          }.\n`,
        );
      } else {
        return null;
      }

      // pick the superior of partner's two suits
      let nSuit: Suit;
      if (nLHOSuit === Suit.Clubs) {
        nSuit = bidState.pickSuperiorSuit(Suit.Hearts, Suit.Diamonds);
      } else if (nLHOSuit === Suit.Diamonds) {
        nSuit = bidState.pickSuperiorSuit(Suit.Hearts, Suit.Clubs);
      } else {
        nSuit = bidState.pickSuperiorSuit(Suit.Diamonds, Suit.Clubs);
      }
      status.stream(`UNTR12! Given a choice, we prefer the ${Card.suitToSingularString(nSuit)} suit.\n`);

      // now adjust point count as DECLARER
      // but don't penalize for short trumps, as partner has plenty
      bidState.setAgreedSuit(nSuit);
      bidState.fAdjPts = hand.revalueHand(REVALUE_DECLARER | REVALUE_NOPENALTY_SHORTTRUMP, nSuit, true);

      // partner may have 6-11 OR 17+ pts; assume it's a weak hand
      bidState.adjustPartnershipPoints(6, 11);

      // if we have the points for a slam or game; else bid at the 3-level
      if (bidState.m_fMinTPPoints >= PTS_SLAM) {
        // cue-bid the enemy suit for a slam try
        nBid = bidState.getCheapestShiftBid(nLHOSuit as Suit, bidState.nLastValidBid);
        status.stream(
          `UNTR20! With a total of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts in the partnership, cue bid the enemy ${Card.suitToSingularString(nLHOSuit as Suit)} suit at ${bidToFullString(nBid)} for a slam try.\n`,
        );
      } else if (bidState.m_fMinTPPoints >= bidState.getGamePoints(nSuit)) {
        // bid game
        nBid = bidState.getGameBid(nSuit);
        status.stream(
          `UNTR25! With a total of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts in the partnership, go to game at ${bidToFullString(nBid)}.\n`,
        );
      } else if (bidState.m_fMinTPPoints >= bidState.getGamePoints(nSuit) - 3) {
        // game may be possible if partner opened with a strong Unusual NT hand
        // so query as to the hand type
        nBid = bidState.getCheapestShiftBid(nLHOSuit as Suit);
        status.stream(
          `UNTR26! With a total of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts in the partnership, we may be able to make game in ${Card.suitToString(nSuit)} if partner has a strong opener, so cue bid the enemy ${Card.suitToSingularString(nLHOSuit as Suit)} at ${bidToFullString(nBid)} to inquire about partner's strength..\n`,
        );
      } else {
        // settle for a 3-level bid
        nBid = makeBid(nSuit, 3);
        status.stream(
          `UNTR28! With a total of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts in the partnership, respond at the 3-level with ${bidToFullString(nBid)}.\n`,
        );
      }

      // done!
      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.RespondedRound1);
      return nBid;
    } else if (nStatus === ConventionStatus.RespondedRound1) {
      // round 2
      const nOpeningBid = bidState.getOpeningBid();
      const nEnemySuit = bidSuit(nOpeningBid);
      let bPartnerHasStrongOpener = false;

      // pick superior suit
      let nSuit1: Suit;
      let nSuit2: Suit;
      if (nLHOSuit === Suit.Clubs) {
        nSuit1 = Suit.Diamonds;
        nSuit2 = Suit.Hearts;
      } else if (nLHOSuit === Suit.Diamonds) {
        nSuit1 = Suit.Clubs;
        nSuit2 = Suit.Hearts;
      } else {
        nSuit1 = Suit.Clubs;
        nSuit2 = Suit.Diamonds;
      }
      const nSuperiorSuit = bidState.pickSuperiorSuit(nSuit1, nSuit2);

      // check our previous bid
      if (bidState.nPreviousSuit === nEnemySuit) {
        // if partner bid the lower of his two suits, he is showing a weak hand
        if (nPartnersSuit === nSuit1) {
          status.stream(
            `UNTR40! Partner rebid his lower ${Card.suitToSingularString(nSuit1)} suit, denying a strong opening hand.\n`,
          );
          if (nSuperiorSuit === nSuit1) {
            nBid = Bid.Pass;
            status.stream(
              `UNTR41! As a result, we have to pass his bid of ${bidToFullString(nPartnersBid)} to play in the ${Card.suitToSingularString(nPartnersSuit as Suit)} suit.\n`,
            );
          } else {
            nBid = makeBid(nSuit2, bidLevel(nPartnersBid));
            status.stream(`UNTR42! As a result, we settle for a contract of ${bidToFullString(nBid)}.\n`);
          }
          bidState.setBid(nBid);
          bidState.setConventionStatus(this, ConventionStatus.Finished);
          return nBid;
        } else if (nPartnersBid !== Bid.Pass) {
          // partner has NOT rebid his lower suit, indicating a strong opener
          bidState.adjustPartnershipPoints(17, Math.min(17, 40));
          status.stream(
            `UNTR50! After our cue-bid of the enemy suit, partner has NOT bid the lower of his two suits,  indicating a strong opening Unusual NT hand with ${bidState.openPts(17)}+ pts, for a total in the partnership of ${bidState.m_fMinTPPoints}-${bidState.m_fMinTPPoints} pts.\n`,
          );
          bPartnerHasStrongOpener = true;
        } else {
          // oops, partner passed
          status.stream('UNTR52! Partner passed, so we pass.\n');
          bidState.setBid(Bid.Pass);
          bidState.setConventionStatus(this, ConventionStatus.Finished);
          return Bid.Pass;
        }
      } else {
        // partner has bid again after we made a normal bid, indicating a strong opener
        if (nPartnersBid !== Bid.Pass) {
          status.stream(
            `UNTR60! Partner has made another bid after his opening Unusual NT bid and our response of ${bidToFullString(bidState.nPreviousBid)}, indicate a strong opening Unusual NT hand with ${bidState.openPts(17)}+ pts, for a total in the partnership of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts.\n`,
          );
          bPartnerHasStrongOpener = true;
        } else {
          status.stream('UNTR62! Partner passed, so we pass.\n');
          bidState.setBid(Bid.Pass);
          bidState.setConventionStatus(this, ConventionStatus.Finished);
          return Bid.Pass;
        }
      }

      // here, partner showed a strong opener
      if (bPartnerHasStrongOpener) {
        bidState.adjustPartnershipPoints(17, Math.min(17, 40));

        const nSuit = bidState.nPreviousSuit as Suit;
        if (bidState.m_fMinTPPoints >= PTS_SLAM) {
          status.stream('UNTR71! So we can proceed towards slam.\n');
          bidState.invokeBlackwood(nSuperiorSuit);
          bidState.setConventionStatus(this, ConventionStatus.Finished);
          return bidState.m_nBid;
        } else if (bidState.m_fMinTPPoints >= bidState.getGamePoints(nSuit)) {
          nBid = bidState.getGameBid(nSuit);
          status.stream(`UNTR72! So go ahead and bid game at ${bidToFullString(nBid)}.\n`);
        } else {
          nBid = Bid.Pass;
          status.stream('UNTR73! But this is still not enough to raise any further, so just pass.\n');
        }
        bidState.setBid(nBid);
        bidState.setConventionStatus(this, ConventionStatus.Finished);
        return nBid;
      }

      // oops
      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return null;
    }

    return null;
  }

  //
  // HandleConventionResponse()
  //
  // Rebidding as opener after partner responds to an Unusual NT Bid
  //
  override handleConventionResponse(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { status } = context;

    const nStatus = bidState.getConventionStatus(this);
    if (nStatus !== ConventionStatus.InvokedRound1 && nStatus !== ConventionStatus.InvokedRound2) {
      return null;
    }

    let nBid: Bid = Bid.Pass;
    const fPts = bidState.fPts;
    const nPartnersBid = bidState.nPartnersBid;
    const nPartnersSuit = bidState.nPartnersSuit;

    // first check for a strange response
    if (nPartnersBid === Bid.Double || nPartnersBid === Bid.Redouble) {
      return super.handleConventionResponse(context);
    }

    if (nStatus === ConventionStatus.Invoked) {
      const nOpeningBid = bidState.getOpeningBid();
      const nEnemySuit = bidSuit(nOpeningBid);

      // first of all, did partner cue-bid the enemy suit (a game/slam try)?
      if (nPartnersSuit === nEnemySuit) {
        status.stream('UNTRH20! Partner cue bid the enemy suit, which is a game or slam try.\n');
        let nSuit: Suit;
        if (bidState.fPts >= bidState.pointCount(17)) {
          // we have a strong opener, so respond in the higher suit
          if (nEnemySuit === Suit.Clubs || nEnemySuit === Suit.Diamonds) {
            nSuit = Suit.Hearts;
          } else {
            nSuit = Suit.Diamonds;
          }
          nBid = bidState.getCheapestShiftBid(nSuit);
          status.stream(
            `UNTRH21! Since we have ${bidState.fPts} pts in hand (a strong opener), we respond in the higher of our suits (${Card.suitToString(nSuit)}) at ${bidToFullString(nBid)}.\n`,
          );
        } else {
          // weak opener, so respond negatively in the lower suit
          if (nEnemySuit === Suit.Clubs) {
            nSuit = Suit.Diamonds;
          } else {
            nSuit = Suit.Clubs;
          }
          nBid = bidState.getCheapestShiftBid(nSuit);
          status.stream(
            `UNTRH23! But with only ${bidState.fPts} pts in hand (a weak opener), respond negatively by bidding the lower of our suits (${Card.suitToString(nSuit)}) suit at ${bidToFullString(nBid)}.\n`,
          );
        }
        bidState.setBid(nBid);
        bidState.setConventionStatus(this, ConventionStatus.Finished);
        return nBid;
      }

      // 17+ points calls for a cue bid to show our strength
      if (bidState.fPts >= bidState.pointCount(17) && !bidState.isGameBid(nPartnersBid)) {
        nBid = makeBid(nEnemySuit as Suit, 3);
        status.stream(
          `UNTRH12! with a strong Unusual NT hand (${bidState.fPts} pts), cue bid the enemy suit again at ${bidToFullString(nBid)} to indicate our strength.\n`,
        );
        bidState.setBid(nBid);
        bidState.setConventionStatus(this, ConventionStatus.InvokedRound2);
        return nBid;
      }

      // here, we have less than 17 points, and partner made a signoff, invitational, or game bid
      if (bidState.isGameBid(nPartnersBid)) {
        status.stream(
          `UNTRH30! Partner responded to our Unusual NT bid with a game bid of ${bidState.szPB}, so with a weak opener we should pass.\n`,
        );
        nBid = Bid.Pass;
      } else if (nPartnersBid !== Bid.Pass) {
        status.stream(
          `UNTRH40! Partner responded to our Unusual NT bid with a bid of ${bidState.szPB}, a possible invitation to game.\n`,
        );
        if (fPts < bidState.pointCount(17)) {
          nBid = Bid.Pass;
          status.stream(
            `UNTRH41! But since we opened Unusual NT with a weak hand (${fPts}) pts, we likely do not have the points for game and have to pass.\n`,
          );
        }
      } else {
        status.stream(
          `UNTRH49! Partner passed${bidState.bLHOInterfered ? 'after opponents interference' : ''}, so the Unusual NT convention is off.\n`,
        );
        bidState.setConventionStatus(this, ConventionStatus.Finished);
        return null;
      }

      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return nBid;
    } else if (nStatus === ConventionStatus.InvokedRound2) {
      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return null;
    }

    // oops!
    bidState.setConventionStatus(this, ConventionStatus.Error);
    return null;
  }
}
