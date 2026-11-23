//----------------------------------------------------------------------------------------
//
// This file and all other Easy Bridge source files are copyright (C) 2002 by Steven Han.
// Use of this file is governed by the GNU General Public License.
// See the files COPYING and COPYRIGHT for details.
//
//----------------------------------------------------------------------------------------

//
// Jacoby2NTConvention.cpp -> jacoby2NTConvention.ts
//

import { Card } from '../../card.js';
import {
  Bid,
  bidLevel,
  bidSuit,
  bidToFullString,
  isBid,
  isMajor,
  isSuit,
  makeBid,
  Suit,
} from '../../constants.js';
import { REVALUE_DECLARER, REVALUE_DUMMY } from '../../hand.js';
import { BiddingOption, ConventionId, ConventionStatus } from '../biddingCodes.js';
import { PTS_MAJOR_GAME, PTS_SLAM, SuitStrength } from '../bidParameters.js';
import { Convention, ConventionContext } from '../convention.js';

export class Jacoby2NTConvention extends Convention {
  constructor() {
    super(ConventionId.Jacoby2NT);
  }

  //
  // TryConvention()
  //
  override tryConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { hand, status } = context;

    const nOpeningBid = bidState.getOpeningBid();
    const nPartnersBid = bidState.nPartnersBid;

    if (
      isBid(nOpeningBid) &&
      nOpeningBid === nPartnersBid &&
      isMajor(bidSuit(nPartnersBid)) &&
      bidState.nPartnersBidLevel === 1 &&
      bidState.m_numBidTurns === 0 &&
      bidState.fPts >= bidState.openPts(13) &&
      bidState.numSupportCards >= 4
    ) {
      // passed
    } else {
      return null;
    }

    const nSuit = bidState.nPartnersSuit as Suit;
    bidState.setAgreedSuit(nSuit);
    bidState.fAdjPts = hand.revalueHand(REVALUE_DUMMY, nSuit, true);

    status.stream(
      `J2N1! Partner opened ${bidToFullString(nPartnersBid)}, and with ${bidState.fAdjPts} pts in hand and ${bidState.numSupportCards}-card trump support, we can bid Jacoby 2NT to ask for partner's strength.\n`,
    );
    bidState.setBid(Bid.NT2);
    bidState.setConventionStatus(this, ConventionStatus.Invoked);
    return Bid.NT2;
  }

  //
  // RespondToConvention()
  //
  override respondToConvention(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { hand, status } = context;

    if (bidState.getActiveConvention() && bidState.getActiveConvention() !== this) {
      return null;
    }

    const nPreviousBid = bidState.nPreviousBid;
    const nStatus = bidState.getConventionStatus(this);

    if (nStatus === ConventionStatus.Inactive) {
      const nOpeningBid = bidState.getOpeningBid();
      if (
        bidState.m_numBidTurns === 1 &&
        isMajor(bidSuit(nPreviousBid)) &&
        nOpeningBid === nPreviousBid &&
        bidLevel(nPreviousBid) === 1 &&
        bidState.nPartnersBid === Bid.NT2
      ) {
        // passed
      } else {
        return null;
      }

      status.stream(
        `J2N20! Partner has made a Jacoby 2NT inquiry bid, indicating ${bidState.openPts(13)} pts and 4+ card support.\n`,
      );

      let nSuit = bidState.nPreviousSuit as Suit;
      bidState.setAgreedSuit(nSuit);
      const fPts = (bidState.fAdjPts = hand.revalueHand(REVALUE_DECLARER, nSuit, true));
      bidState.adjustPartnershipPoints(13, 13);

      let nBid: Bid;
      if (fPts >= 18) {
        nBid = makeBid(nSuit, 3);
        status.stream(
          `J2N21! With ${fPts} points in hand, respond to partner's Jacoby 2NT inquiry with a bid of ${bidToFullString(nBid)}.\n`,
        );
      } else if (fPts >= 15) {
        let i = 0;
        for (; i < 4; i++) {
          if (i !== nSuit && bidState.nSuitStrength[i] <= SuitStrength.Strong && bidState.numCardsInSuit[i] >= 5) {
            break;
          }
        }
        if (i < 4) {
          nSuit = i as Suit;
          nBid = makeBid(nSuit, 4);
          status.stream(
            `J2N22! With ${fPts} points in hand and a good ${bidState.numCardsInSuit[nSuit]}-card suit in ${Card.suitToString(nSuit)}, respond to partner's Jacoby 2NT inquiry with ${bidToFullString(nBid)}.\n`,
          );
        } else if (bidState.numVoids >= 1) {
          for (let s = 0; s < 4; s++) {
            if (bidState.numCardsInSuit[s] === 0) {
              nSuit = s as Suit;
              break;
            }
          }
          nBid = makeBid(nSuit, 3);
          status.stream(
            `J2N24! With ${fPts} points in hand and a void suit in ${Card.suitToString(nSuit)}, respond to partner's Jacoby 2NT inquiry with a bid of ${bidToFullString(nBid)}.\n`,
          );
        } else if (bidState.numSingletons >= 1) {
          for (let s = 0; s < 4; s++) {
            if (bidState.numCardsInSuit[s] === 1) {
              nSuit = s as Suit;
              break;
            }
          }
          nBid = makeBid(nSuit, 3);
          status.stream(
            `J2N26! With ${fPts} points in hand and a singleton in ${Card.suitToString(nSuit)}, respond to partner's Jacoby 2NT inquiry with a bid of ${bidToFullString(nBid)}.\n`,
          );
        } else {
          nBid = Bid.NT3;
          status.stream(
            `J2N28! With ${fPts} points in hand and no short suits,  respond to partner's Jacoby 2NT inquiry with a bid of ${bidToFullString(nBid)}.\n`,
          );
        }
      } else {
        nBid = makeBid(nSuit, 4);
        status.stream(
          `J2N31! With only ${fPts} points in hand, sign off in game at ${bidToFullString(nBid)}.\n`,
        );
      }

      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return nBid;
    }

    return null;
  }

  //
  // HandleConventionResponse()
  //
  override handleConventionResponse(context: ConventionContext): Bid | null {
    const bidState = context.bidEngine;
    if (!bidState) return null;
    const { status } = context;

    const nStatus = bidState.getConventionStatus(this);
    if (nStatus !== ConventionStatus.InvokedRound1 && nStatus !== ConventionStatus.InvokedRound2) {
      return null;
    }

    const nPrevSuit = bidState.nPartnersPrevSuit as Suit;
    const nSuit = bidState.nPartnersSuit;
    const nPartnersBid = bidState.nPartnersBid;
    const nPartnersBidLevel = bidState.nPartnersBidLevel;

    if (nStatus === ConventionStatus.Invoked) {
      if (isSuit(nPrevSuit) && bidState.nPartnersBid === makeBid(nPrevSuit, 3)) {
        status.stream(
          `J2N40! Partner responded to our Jacoby 2NT inquiry by rebidding his ${Card.suitToSingularString(nPrevSuit)} suit at the 3-level, indicating ${bidState.openPts(18)}+ points.\n`,
        );
        bidState.adjustPartnershipPoints(
          18,
          bidState.conventions.getValue(BiddingOption.TwoClubOpeningPoints),
        );
      } else if (nPartnersBidLevel === 3 && isSuit(nSuit) && nSuit !== nPrevSuit) {
        status.stream(
          `J2N41! Partner responded to our Jacoby 2NT inquiry by bidding the ${Card.suitToSingularString(nSuit)} suit at the 3-level, indicating ${bidState.openPts(15)}-${bidState.openPts(17)} points and a singleton or void in ${Card.suitToString(nSuit)}.\n`,
        );
        bidState.adjustPartnershipPoints(15, 17);
      } else if (nPartnersBid === Bid.NT3) {
        status.stream(
          `J2N42! Partner responded to our Jacoby 2NT inquiry by bidding 3NT, indicating ${bidState.openPts(15)}-${bidState.openPts(17)} points with a balanced hand.\n`,
        );
        bidState.adjustPartnershipPoints(15, 17);
      } else if (nPartnersBidLevel === 4 && isSuit(nSuit) && nSuit !== nPrevSuit) {
        status.stream(
          `J2N44! Partner responded to our Jacoby 2NT inquiry by bidding the ${Card.suitToSingularString(nSuit)} suit at the 4-level, indicating a strong 5-card side suit and ${bidState.openPts(15)}-${bidState.openPts(17)} points in the hand.\n`,
        );
        bidState.adjustPartnershipPoints(15, 17);
      } else if (nPartnersBidLevel === 4 && nSuit === nPrevSuit && isSuit(nSuit)) {
        status.stream(
          `J2N44! Partner responded to our Jacoby 2NT inquiry by rebidding his ${Card.suitToSingularString(nSuit)} suit at the 4-level, indicating a minimum opener of approx. ${bidState.openPts(12)}-${bidState.openPts(14)} points in the hand.\n`,
        );
        bidState.adjustPartnershipPoints(12, 14);
      } else if (nPartnersBid === Bid.Double || nPartnersBid === Bid.Redouble) {
        bidState.setConventionStatus(this, ConventionStatus.Error);
        return null;
      }

      let nBid: Bid;
      if (bidState.m_fMinTPPoints >= PTS_SLAM) {
        status.stream(
          `J2N60! With a total of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts in the partnership, push on to slam in partner's ${Card.suitToSingularString(nPrevSuit)} suit.\n`,
        );
        bidState.invokeBlackwood(nPrevSuit);
        bidState.setConventionStatus(this, ConventionStatus.Finished);
        return bidState.m_nBid;
      } else if (bidState.m_fMinTPPoints >= PTS_MAJOR_GAME) {
        if (nPartnersBid < bidState.getGameBid(nPrevSuit)) {
          nBid = bidState.getGameBid(nPrevSuit);
          status.stream(
            `J2N62! With a total of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts in the partnership, go to game in ${Card.suitToString(nPrevSuit)} with a bid of ${bidToFullString(nBid)}.\n`,
          );
        } else if (nSuit === nPrevSuit) {
          nBid = Bid.Pass;
          status.stream(
            `J2N64! With a total of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts in the partnership, pass partner's ${bidToFullString(nPartnersBid)} bid.\n`,
          );
        } else {
          nBid = bidState.getCheapestShiftBid(nPrevSuit, nPartnersBid);
          status.stream(
            `J2N66! With a total of ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts in the partnership, we want to stop at game in ${Card.suitToString(nPrevSuit)}; correct partner's ${bidToFullString(nPartnersBid)} bid to ${bidToFullString(nBid)}.\n`,
          );
        }
      } else {
        if (nPartnersBid === Bid.NT3 || nSuit === nPrevSuit) {
          nBid = Bid.Pass;
          status.stream(
            `J2N70! With a total of only ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts in the partnership, we have to stop here at ${bidToFullString(nPartnersBid)}, so pass.\n`,
          );
        } else {
          nBid = bidState.getCheapestShiftBid(nPrevSuit, nPartnersBid);
          status.stream(
            `J2N72! With a total of only ${bidState.m_fMinTPPoints}-${bidState.m_fMaxTPPoints} pts in the partnership, we have to return to the ${Card.suitToSingularString(nPrevSuit)} and stop at ${bidToFullString(nBid)}.\n`,
          );
        }
      }

      bidState.setBid(nBid);
      bidState.setConventionStatus(this, ConventionStatus.Finished);
      return nBid;
    }

    bidState.setConventionStatus(this, ConventionStatus.Error);
    return null;
  }
}
